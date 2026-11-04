import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import ProfileScreen from "../../screens/ProfileScreen";
import { clearSession, getSession } from "../../utils/session";
import { getUserProfile } from "../../utils/users";

jest.mock("../../utils/users", () => ({
    getUserProfile: jest.fn(),
}));

jest.mock("../../utils/session", () => ({
    getSession: jest.fn(),
    clearSession: jest.fn(),
}));

const mockReset = jest.fn();
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset, navigate: mockNavigate }),
}));

const PROFILE = {
    userId: 12,
    firstname: "Alice",
    lastname: "Martin",
    email: "alice@exemple.com",
    birthday: "1990-05-12",
    genre: "F",
    role: "passenger",
    disabilities: ["wheelchair"],
};

describe("ProfileScreen — Integration Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getUserProfile.mockResolvedValue({ success: true, profile: PROFILE });
    });

    it("shows the profile of the authenticated user", async () => {
        const { findByText, getByText, getAllByText } = render(<ProfileScreen />);

        expect(await findByText("Alice Martin")).toBeTruthy();
        // The email shows both in the identity card and in the details rows.
        expect(getAllByText("alice@exemple.com").length).toBe(2);
        expect(getByText("1990-05-12")).toBeTruthy();
        expect(getUserProfile).toHaveBeenCalledWith({ token: "jwt" });
    });

    it("maps the role and genre to their display labels", async () => {
        const { findByText, getAllByText } = render(<ProfileScreen />);

        // "Personne handicapée" appears in the role pill and in the details row.
        expect((await findByText("Mme")).props.children).toBe("Mme");
        expect(getAllByText("Personne handicapée").length).toBe(2);
    });

    it("maps the companion role to its display label", async () => {
        getUserProfile.mockResolvedValue({ success: true, profile: { ...PROFILE, role: "companion" } });

        const { findAllByText } = render(<ProfileScreen />);

        expect((await findAllByText("Accompagnateur")).length).toBe(2);
    });

    it("falls back to a neutral label when the role is not set", async () => {
        getUserProfile.mockResolvedValue({ success: true, profile: { ...PROFILE, role: null } });

        const { findByText } = render(<ProfileScreen />);

        expect(await findByText("Rôle non défini")).toBeTruthy();
    });

    it("lists the accompaniment needs with their display labels", async () => {
        const { findByText } = render(<ProfileScreen />);

        expect(await findByText("Fauteuil roulant")).toBeTruthy();
    });

    it("shows an unknown accompaniment need as sent by the API", async () => {
        getUserProfile.mockResolvedValue({ success: true, profile: { ...PROFILE, disabilities: ["unmapped"] } });

        const { findByText } = render(<ProfileScreen />);

        expect(await findByText("unmapped")).toBeTruthy();
    });

    it("shows an error when the profile cannot be loaded", async () => {
        getUserProfile.mockResolvedValue({ success: false, message: "Impossible de charger votre profil." });

        const { findByText } = render(<ProfileScreen />);

        expect(await findByText("Impossible de charger votre profil.")).toBeTruthy();
    });

    it("asks the user to reconnect when the session is missing", async () => {
        getSession.mockResolvedValue(null);

        const { findByText } = render(<ProfileScreen />);

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(getUserProfile).not.toHaveBeenCalled();
    });

    it("retries loading the profile", async () => {
        getUserProfile.mockResolvedValueOnce({ success: false, message: "Impossible de charger votre profil." });

        const { findByText } = render(<ProfileScreen />);
        fireEvent.press(await findByText("Réessayer"));

        expect(await findByText("Alice Martin")).toBeTruthy();
    });

    it("asks for confirmation before logging out", async () => {
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

        const { findByText } = render(<ProfileScreen />);
        fireEvent.press(await findByText("Se déconnecter"));

        expect(alertSpy).toHaveBeenCalledWith(
            "Se déconnecter",
            "Voulez-vous vraiment vous déconnecter ?",
            expect.arrayContaining([
                expect.objectContaining({ text: "Annuler" }),
                expect.objectContaining({ text: "Se déconnecter" }),
            ]),
        );
        // Nothing happens until the user confirms.
        expect(clearSession).not.toHaveBeenCalled();
    });

    it("clears the session and returns to the welcome screen once confirmed", async () => {
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

        const { findByText } = render(<ProfileScreen />);
        fireEvent.press(await findByText("Se déconnecter"));

        const confirm = alertSpy.mock.calls[0][2].find((button) => button.text === "Se déconnecter");
        await confirm.onPress();

        await waitFor(() => {
            expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Welcome" }] });
        });
        expect(clearSession).toHaveBeenCalled();
    });

    it("opens the help, privacy and about pages from the more section", async () => {
        const { findByLabelText, getByLabelText } = render(<ProfileScreen />);

        fireEvent.press(await findByLabelText("Aide & support"));
        expect(mockNavigate).toHaveBeenCalledWith("Help");

        fireEvent.press(getByLabelText("Confidentialité"));
        expect(mockNavigate).toHaveBeenCalledWith("Privacy");

        fireEvent.press(getByLabelText("À propos"));
        expect(mockNavigate).toHaveBeenCalledWith("About");
    });

});
