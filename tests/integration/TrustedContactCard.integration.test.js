import { fireEvent, render, waitFor } from "@testing-library/react-native";

import TrustedContactCard from "../../components/TrustedContactCard";
import { getSession } from "../../utils/session";
import { setTrustedContact } from "../../utils/users";

jest.mock("../../utils/users", () => ({ setTrustedContact: jest.fn() }));
jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));

const CONTACT = { name: "Camille", phoneNumber: "0612345678" };

describe("TrustedContactCard — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        setTrustedContact.mockResolvedValue({ success: true, trustedContact: CONTACT });
    });

    it("invites the user to add one when there is none", () => {
        const { getByTestId } = render(<TrustedContactCard />);

        expect(getByTestId("trusted-contact-add")).toBeTruthy();
    });

    it("shows the contact already recorded", () => {
        const { getByTestId } = render(<TrustedContactCard contact={CONTACT} />);

        expect(getByTestId("trusted-contact-current").props.children).toBe("Camille · 0612345678");
    });

    it("records a contact and hands it back", async () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<TrustedContactCard onChange={onChange} />);

        fireEvent.press(getByTestId("trusted-contact-add"));
        fireEvent.changeText(getByTestId("trusted-contact-name"), "Camille");
        fireEvent.changeText(getByTestId("trusted-contact-phone"), "06 12 34 56 78");
        fireEvent.press(getByTestId("trusted-contact-save"));

        await waitFor(() => {
            expect(setTrustedContact).toHaveBeenCalledWith({
                token: "jwt",
                name: "Camille",
                phoneNumber: "0612345678",
            });
        });
        expect(onChange).toHaveBeenCalledWith(CONTACT);
    });

    it("lets the user take the contact back", async () => {
        setTrustedContact.mockResolvedValue({ success: true, trustedContact: null });
        const onChange = jest.fn();
        const { getByTestId } = render(<TrustedContactCard contact={CONTACT} onChange={onChange} />);

        fireEvent.press(getByTestId("trusted-contact-clear"));

        await waitFor(() => {
            expect(setTrustedContact).toHaveBeenCalledWith({ token: "jwt", name: null, phoneNumber: null });
        });
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("shows why a number was refused, keeping what was typed", async () => {
        setTrustedContact.mockResolvedValue({
            success: false,
            message: "Ce numéro n'est pas un mobile français valide.",
        });

        const { getByTestId, findByText } = render(<TrustedContactCard />);
        fireEvent.press(getByTestId("trusted-contact-add"));
        fireEvent.changeText(getByTestId("trusted-contact-phone"), "12345");
        fireEvent.press(getByTestId("trusted-contact-save"));

        expect(await findByText("Ce numéro n'est pas un mobile français valide.")).toBeTruthy();
        expect(getByTestId("trusted-contact-phone").props.value).toBe("12345");
    });

    it("asks the user to reconnect when the session expired", async () => {
        getSession.mockResolvedValue(null);

        const { getByTestId, findByText } = render(<TrustedContactCard />);
        fireEvent.press(getByTestId("trusted-contact-add"));
        fireEvent.press(getByTestId("trusted-contact-save"));

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(setTrustedContact).not.toHaveBeenCalled();
    });

    it("goes back without saving when cancelled", () => {
        const { getByTestId } = render(<TrustedContactCard />);

        fireEvent.press(getByTestId("trusted-contact-add"));
        fireEvent.press(getByTestId("trusted-contact-cancel"));

        expect(getByTestId("trusted-contact-add")).toBeTruthy();
        expect(setTrustedContact).not.toHaveBeenCalled();
    });

    it("opens on the recorded contact when editing", () => {
        const { getByTestId } = render(<TrustedContactCard contact={CONTACT} />);

        fireEvent.press(getByTestId("trusted-contact-edit"));

        expect(getByTestId("trusted-contact-name").props.value).toBe("Camille");
        expect(getByTestId("trusted-contact-phone").props.value).toBe("0612345678");
    });
});
