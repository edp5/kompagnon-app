import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";

import EmergencyAlert from "../../components/EmergencyAlert";
import { createShareLink } from "../../utils/following";
import { getSession } from "../../utils/session";

jest.mock("../../utils/following", () => ({ createShareLink: jest.fn() }));
jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));

const CONTACT = { name: "Camille", phoneNumber: "0612345678" };
const SHARE = { token: "abc", url: "http://web/#/suivi/abc", expiresAt: "2026-09-06T00:00:00.000Z" };

/**
 * Runs the confirmation the alert asks for, the way a user tapping the
 * confirming button would.
 */
function confirmAlert() {
    const [, , buttons] = Alert.alert.mock.calls.at(-1);
    buttons.find((button) => button.text === "Préparer le message").onPress();
}

describe("EmergencyAlert — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        createShareLink.mockResolvedValue({ success: true, share: SHARE });
        jest.spyOn(Alert, "alert").mockImplementation(() => {});
        jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("asks before doing anything, and sends nothing on its own", async () => {
        const { getByTestId } = render(<EmergencyAlert foundJourneyId={3} contact={CONTACT} />);

        fireEvent.press(getByTestId("emergency-alert-button"));

        expect(Alert.alert).toHaveBeenCalled();
        expect(createShareLink).not.toHaveBeenCalled();
        expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("opens the message app with the follow link, once confirmed", async () => {
        const { getByTestId } = render(<EmergencyAlert foundJourneyId={3} contact={CONTACT} />);
        fireEvent.press(getByTestId("emergency-alert-button"));

        confirmAlert();

        await waitFor(() => {
            expect(createShareLink).toHaveBeenCalledWith({ token: "jwt", foundJourneyId: 3 });
            expect(Linking.openURL).toHaveBeenCalledWith(
                expect.stringContaining("sms:0612345678"),
            );
        });
        expect(Linking.openURL.mock.calls[0][0]).toContain(encodeURIComponent(SHARE.url));
    });

    it("lets the user back out of the confirmation", async () => {
        const { getByTestId } = render(<EmergencyAlert foundJourneyId={3} contact={CONTACT} />);
        fireEvent.press(getByTestId("emergency-alert-button"));

        const [, , buttons] = Alert.alert.mock.calls.at(-1);

        expect(buttons.find((button) => button.text === "Annuler")).toBeTruthy();
        expect(createShareLink).not.toHaveBeenCalled();
    });

    it("sends the user to their profile when no contact is set", () => {
        const onNoContact = jest.fn();
        const { getByTestId } = render(<EmergencyAlert foundJourneyId={3} onNoContact={onNoContact} />);

        fireEvent.press(getByTestId("emergency-alert-button"));

        expect(onNoContact).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("shows why the link could not be created", async () => {
        createShareLink.mockResolvedValue({ success: false, message: "Impossible de créer le lien de suivi." });

        const { getByTestId, findByText } = render(<EmergencyAlert foundJourneyId={3} contact={CONTACT} />);
        fireEvent.press(getByTestId("emergency-alert-button"));
        confirmAlert();

        expect(await findByText("Impossible de créer le lien de suivi.")).toBeTruthy();
        expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it("asks the user to reconnect when the session expired", async () => {
        getSession.mockResolvedValue(null);

        const { getByTestId, findByText } = render(<EmergencyAlert foundJourneyId={3} contact={CONTACT} />);
        fireEvent.press(getByTestId("emergency-alert-button"));
        confirmAlert();

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(createShareLink).not.toHaveBeenCalled();
    });

    it("shows the link when no message app can open it", async () => {
        Linking.openURL.mockRejectedValue(new Error("no sms app"));

        const { getByTestId } = render(<EmergencyAlert foundJourneyId={3} contact={CONTACT} />);
        fireEvent.press(getByTestId("emergency-alert-button"));
        confirmAlert();

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Envoyez ce lien à Camille", SHARE.url);
        });
    });
});
