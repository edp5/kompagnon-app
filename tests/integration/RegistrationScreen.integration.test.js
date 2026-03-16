import {
    act,
    fireEvent,
    render,
    waitFor,
} from "@testing-library/react-native";
import { getPasswordStrength } from "../../screens/RegistrationScreen";
import { Alert } from "react-native";

import RegistrationScreen from "../../screens/RegistrationScreen";
import * as apiFetchModule from "../../utils/api-fetch.js";

jest.mock("@env", () => ({
    KOMPAGNON_API_URL: "http://localhost:3000",
}));

jest.mock("../../utils/api-fetch.js", () => ({
    apiFetch: jest.fn(),
}));
// Valeurs de saisie pour les tests — ne sont pas des identifiants réels
const SAISIE_FAIBLE = "aaaaaaaa";
const SAISIE_MOYENNE = "aaaaa1";
const SAISIE_FORTE = "aaa1@aaaaaa";
const SAISIE_FORMULAIRE = "mdptest1234";

describe("RegistrationScreen — Integration Tests", () => {
    let onRegisterSuccess;

    beforeEach(() => {
        onRegisterSuccess = jest.fn();
        jest.clearAllMocks();
        jest.spyOn(Alert, "alert");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ─── HELPERS ─────────────────────────────────────────────────────────────────

    function fillAndSubmit(
        { firstName, lastName, email, password, confirmPassword },
        getByPlaceholderText,
        getByText
    ) {
        if (firstName !== undefined) fireEvent.changeText(getByPlaceholderText("Jean"), firstName);
        if (lastName !== undefined) fireEvent.changeText(getByPlaceholderText("Dupont"), lastName);
        fireEvent.changeText(getByPlaceholderText("bonjour@exemple.com"), email ?? "");
        fireEvent.changeText(getByPlaceholderText("Min. 6 caractères"), password ?? "");
        fireEvent.changeText(
            getByPlaceholderText("Confirmez votre mot de passe"),
            confirmPassword ?? ""
        );
        fireEvent.press(getByText("S'inscrire"));
    }

    // ─── RENDERING ───────────────────────────────────────────────────────────────

    describe("Initial rendering", () => {
        it("should display all form elements", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            expect(getByText("Créer un compte")).toBeTruthy();
            expect(getByText("Rejoignez Kompagnon aujourd'hui")).toBeTruthy();
            expect(getByPlaceholderText("Jean")).toBeTruthy();
            expect(getByPlaceholderText("Dupont")).toBeTruthy();
            expect(getByPlaceholderText("bonjour@exemple.com")).toBeTruthy();
            expect(getByPlaceholderText("Min. 6 caractères")).toBeTruthy();
            expect(getByPlaceholderText("Confirmez votre mot de passe")).toBeTruthy();
            expect(getByText("S'inscrire")).toBeTruthy();
            expect(getByText("Se connecter")).toBeTruthy();
        });

        it("should not display any error on initial render", () => {
            const { queryByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            expect(queryByText("Tous les champs sont obligatoires.")).toBeNull();
            expect(queryByText("Les mots de passe ne correspondent pas.")).toBeNull();
        });
    });

    // ─── PASSWORD VISIBILITY TOGGLE ───────────────────────────────────────────────

    describe("Password visibility toggle", () => {
        it("should render the eye button for password field", () => {
            const { getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            expect(getByTestId("toggle-password-visibility")).toBeTruthy();
        });

        it("should render the eye button for confirm password field", () => {
            const { getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            expect(getByTestId("toggle-confirm-password-visibility")).toBeTruthy();
        });

        it("password field should be hidden by default (secureTextEntry=true)", () => {
            const { getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            const passwordInput = getByTestId("password-input");
            expect(passwordInput.props.secureTextEntry).toBe(true);
        });

        it("pressing eye button should toggle password visibility", () => {
            const { getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            const passwordInput = getByTestId("password-input");
            const toggleButton = getByTestId("toggle-password-visibility");

            expect(passwordInput.props.secureTextEntry).toBe(true);
            fireEvent.press(toggleButton);
            expect(passwordInput.props.secureTextEntry).toBe(false);
            fireEvent.press(toggleButton);
            expect(passwordInput.props.secureTextEntry).toBe(true);
        });

        it("pressing eye button should toggle confirm password visibility", () => {
            const { getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            const confirmInput = getByTestId("confirm-password-input");
            const toggleButton = getByTestId("toggle-confirm-password-visibility");

            expect(confirmInput.props.secureTextEntry).toBe(true);
            fireEvent.press(toggleButton);
            expect(confirmInput.props.secureTextEntry).toBe(false);
        });

        it("password and confirm password visibility toggles should be independent", () => {
            const { getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            const passwordInput = getByTestId("password-input");
            const confirmInput = getByTestId("confirm-password-input");

            fireEvent.press(getByTestId("toggle-password-visibility"));

            expect(passwordInput.props.secureTextEntry).toBe(false);
            expect(confirmInput.props.secureTextEntry).toBe(true);
        });
    });

    // ─── PASSWORD STRENGTH BAR ────────────────────────────────────────────────────

    describe("Password strength — getPasswordStrength()", () => {
        it("should return level 'none' for empty password", () => {
            expect(getPasswordStrength("").level).toBe("none");
            expect(getPasswordStrength("").label).toBe("");
        });

        it("should return 'weak' for a short password", () => {
            const result = getPasswordStrength("abc");
            expect(result.level).toBe("weak");
            expect(result.label).toBe("Faible");
            expect(result.color).toBe("#FF7675");
        });

        it("should return 'weak' for a long password with only letters", () => {
            const result = getPasswordStrength(SAISIE_FAIBLE);
            expect(result.level).toBe("weak");
        });

        it("should return 'fair' for a password with letters and numbers >= 6 chars", () => {
            const result = getPasswordStrength(SAISIE_MOYENNE);
            expect(result.level).toBe("fair");
            expect(result.label).toBe("Moyen");
            expect(result.color).toBe("#FDCB6E");
        });

        it("should return 'strong' for a password with letters, numbers, special char >= 10 chars", () => {
            const result = getPasswordStrength(SAISIE_FORTE);
            expect(result.level).toBe("strong");
            expect(result.label).toBe("Fort");
            expect(result.color).toBe("#00B894");
        });
    });

    describe("Password strength bar — UI", () => {
        it("should not show strength bar when password is empty", () => {
            const { queryByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            expect(queryByTestId("password-strength-container")).toBeNull();
        });

        it("should show 'Faible' for a weak password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            fireEvent.changeText(getByTestId("password-input"), "abc");
            expect(getByTestId("password-strength-container")).toBeTruthy();
            expect(getByText("Faible")).toBeTruthy();
        });

        it("should show 'Moyen' for a fair password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            fireEvent.changeText(getByTestId("password-input"), SAISIE_MOYENNE);
            expect(getByText("Moyen")).toBeTruthy();
        });

        it("should show 'Fort' for a strong password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            fireEvent.changeText(getByTestId("password-input"), SAISIE_FORTE);
            expect(getByText("Fort")).toBeTruthy();
        });
    });

    // ─── FIELD VALIDATION ────────────────────────────────────────────────────────

    describe("Form validation", () => {
        it("should show error when all fields are empty", () => {
            const { getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fireEvent.press(getByText("S'inscrire"));

            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should show error when email is missing", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                { firstName: "Jean", lastName: "Dupont", email: "", password: SAISIE_FORMULAIRE, confirmPassword: SAISIE_FORMULAIRE },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should show error when password is missing", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                { firstName: "Jean", lastName: "Dupont", email: "utilisateur@exemple.com", password: "", confirmPassword: "" },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should show error when passwords do not match", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: "different",
                },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Les mots de passe ne correspondent pas.")).toBeTruthy();
        });

        it("should show error when password is shorter than 6 characters", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                { firstName: "Jean", lastName: "Dupont", email: "utilisateur@exemple.com", password: "abc", confirmPassword: "abc" },
                getByPlaceholderText,
                getByText
            );

            expect(
                getByText("Le mot de passe doit comporter au moins 6 caractères.")
            ).toBeTruthy();
        });

        it("should clear error after re-submitting valid data", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: true,
            });

            const { getByText, getByPlaceholderText, queryByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fireEvent.press(getByText("S'inscrire"));
            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(queryByText("Tous les champs sont obligatoires.")).toBeNull();
            });
        });
    });

    // ─── API INTERACTIONS ────────────────────────────────────────────────────────

    describe("API interactions", () => {
        it("should call apiFetch with correct endpoint and payload on submit", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: true });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(apiFetchModule.apiFetch).toHaveBeenCalledWith("/api/authentication/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName: "Jean",
                        lastName: "Dupont",
                        email: "utilisateur@exemple.com",
                        password: SAISIE_FORMULAIRE,
                    }),
                });
            });
        });

        it("should show success Alert and call onRegisterSuccess on successful registration", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: true });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    "Succès",
                    "Compte créé avec succès !",
                    expect.arrayContaining([
                        expect.objectContaining({ text: "OK" }),
                    ])
                );
            });

            const alertCallback = Alert.alert.mock.calls[0][2][0].onPress;
            act(() => alertCallback());

            expect(onRegisterSuccess).toHaveBeenCalledTimes(1);
        });

        it("should display API error message on failed registration (non-ok response)", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "Email déjà utilisé." }),
            });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "pris@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(getByText("Email déjà utilisé.")).toBeTruthy();
            });
            expect(onRegisterSuccess).not.toHaveBeenCalled();
        });

        it("should display fallback error message when API returns no message", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(
                    getByText("Inscription échouée. Veuillez réessayer.")
                ).toBeTruthy();
            });
        });

        it("should display network error message when fetch throws", async () => {
            apiFetchModule.apiFetch.mockRejectedValueOnce(new Error("Network error"));

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(
                    getByText("Une erreur est survenue. Vérifiez votre connexion.")
                ).toBeTruthy();
            });
        });
    });

    // ─── LOADING STATE ───────────────────────────────────────────────────────────

    describe("Loading state", () => {
        it("should disable the S'inscrire button while loading", async () => {
            apiFetchModule.apiFetch.mockReturnValueOnce(new Promise(() => { }));

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(() => getByText("S'inscrire")).toThrow();
            });
        });
    });

    // ─── ANIMATIONS (regression) ─────────────────────────────────────────────────

    describe("Animations", () => {
        it("should render the header with all elements (animation regression)", () => {
            const { getByText, getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            expect(getByTestId("header-container")).toBeTruthy();
            expect(getByText("Créer un compte")).toBeTruthy();
            expect(getByText("Rejoignez Kompagnon aujourd'hui")).toBeTruthy();
        });

        it("should still show error container even with shake animation", () => {
            const { getByText, getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            fireEvent.press(getByText("S'inscrire"));
            expect(getByTestId("error-container")).toBeTruthy();
            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should render S'inscrire button with animated wrapper", () => {
            const { getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            expect(getByText("S'inscrire")).toBeTruthy();
        });
    });
});
