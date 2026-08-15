import { fireEvent, render, waitFor } from "@testing-library/react-native";

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
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset, goBack: mockGoBack }),
}));

const PROFILE = {
    userId: 12,
    firstname: "Alice",
    lastname: "Martin",
    email: "alice@exemple.com",
    birthday: "1990-05-12",
    genre: "F",
    role: "invalid",
    disabilities: ["mobility"],
};

describe("ProfileScreen — Integration Tests", () => {
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

        // "Personne handicapé" appears in the role pill and in the details row.
        expect((await findByText("Mme")).props.children).toBe("Mme");
        expect(getAllByText("Personne handicapé").length).toBeGreaterThan(0);
    });

    it("lists the accompaniment needs", async () => {
        const { findByText } = render(<ProfileScreen />);

        expect(await findByText("mobility")).toBeTruthy();
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

    it("clears the session and returns to Login on logout", async () => {
        const { findByText } = render(<ProfileScreen />);
        fireEvent.press(await findByText("Se déconnecter"));

        await waitFor(() => {
            expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
        });
        expect(clearSession).toHaveBeenCalled();
    });

    it("goes back when tapping the back button", async () => {
        const { findByLabelText } = render(<ProfileScreen />);
        fireEvent.press(await findByLabelText("Retour"));

        expect(mockGoBack).toHaveBeenCalled();
    });
});
