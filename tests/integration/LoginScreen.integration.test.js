import { fireEvent, render, waitFor } from "@testing-library/react-native";

import LoginScreen from "../../screens/LoginScreen";
import * as apiFetchModule from "../../utils/api-fetch.js";
import { saveSession } from "../../utils/session";

jest.mock("@env", () => ({
    KOMPAGNON_API_URL: "http://localhost:3000",
}));

jest.mock("../../utils/api-fetch.js", () => ({
    apiFetch: jest.fn(),
}));

jest.mock("../../utils/session", () => ({
    saveSession: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate, reset: mockReset }),
}));

const MDP = "mdptest1234";

function fillAndSubmit({ email, password }, getByPlaceholderText, getByText) {
    fireEvent.changeText(getByPlaceholderText("vous@exemple.com"), email ?? "");
    fireEvent.changeText(getByPlaceholderText("Votre mot de passe"), password ?? "");
    fireEvent.press(getByText("Se connecter"));
}

describe("LoginScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render all form elements", () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        expect(getByText("Bon retour")).toBeTruthy();
        expect(getByPlaceholderText("vous@exemple.com")).toBeTruthy();
        expect(getByPlaceholderText("Votre mot de passe")).toBeTruthy();
        expect(getByText("Se connecter")).toBeTruthy();
        expect(getByText("S'inscrire")).toBeTruthy();
    });

    it("should show an error when fields are empty", () => {
        const { getByText } = render(<LoginScreen />);
        fireEvent.press(getByText("Se connecter"));
        expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        expect(apiFetchModule.apiFetch).not.toHaveBeenCalled();
    });

    it("should call the authenticate endpoint with the right payload", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { userId: 42, token: "jwt" } }),
        });

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fillAndSubmit({ email: "user@exemple.com", password: MDP }, getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(apiFetchModule.apiFetch).toHaveBeenCalledWith("/api/authentication/authenticate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "user@exemple.com", password: MDP }),
            });
        });
    });

    it("should navigate to Home on successful login", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { userId: 42, token: "jwt" } }),
        });

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fillAndSubmit({ email: "user@exemple.com", password: MDP }, getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(mockReset).toHaveBeenCalledWith({
                index: 0,
                routes: [{ name: "Home", params: { userId: 42 } }],
            });
        });
        expect(saveSession).toHaveBeenCalledWith({ token: "jwt", userId: 42 });
    });

    it("should show 'Identifiants incorrects.' on 401", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: false, status: 401 });

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fillAndSubmit({ email: "user@exemple.com", password: "wrong" }, getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(getByText("Identifiants incorrects.")).toBeTruthy();
        });
        expect(mockReset).not.toHaveBeenCalled();
    });

    it("should show an activation hint on 404 (inactive account)", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: false, status: 404 });

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fillAndSubmit({ email: "inactive@exemple.com", password: MDP }, getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(getByText("Compte non activé. Activez-le via l'e-mail reçu après inscription.")).toBeTruthy();
        });
        expect(mockReset).not.toHaveBeenCalled();
    });

    it("should show a generic error on other failures (e.g. 500)", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: false, status: 500 });

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fillAndSubmit({ email: "user@exemple.com", password: MDP }, getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(getByText("Échec de la connexion. Veuillez réessayer.")).toBeTruthy();
        });
        expect(mockReset).not.toHaveBeenCalled();
    });

    it("should show a network error message when fetch throws", async () => {
        apiFetchModule.apiFetch.mockRejectedValueOnce(new Error("Network error"));

        const { getByText, getByPlaceholderText } = render(<LoginScreen />);
        fillAndSubmit({ email: "user@exemple.com", password: MDP }, getByPlaceholderText, getByText);

        await waitFor(() => {
            expect(getByText("Une erreur est survenue. Vérifiez votre connexion.")).toBeTruthy();
        });
    });

    it("should navigate to Register when tapping S'inscrire", () => {
        const { getByText } = render(<LoginScreen />);
        fireEvent.press(getByText("S'inscrire"));
        expect(mockNavigate).toHaveBeenCalledWith("Register");
    });
});
