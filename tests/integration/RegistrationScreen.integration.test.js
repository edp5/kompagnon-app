import {
    act,
    fireEvent,
    render,
    waitFor,
} from "@testing-library/react-native";
import { formatBirthdayInput, getPasswordStrength, toIsoDate } from "../../screens/RegistrationScreen";
import { Alert } from "react-native";

import RegistrationScreen from "../../screens/RegistrationScreen";
import * as apiFetchModule from "../../utils/api-fetch.js";

jest.mock("@env", () => ({
    KOMPAGNON_API_URL: "http://localhost:3000",
}));

jest.mock("../../utils/api-fetch.js", () => ({
    apiFetch: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate }),
}));
// Valeurs de saisie pour les tests — ne sont pas des identifiants réels
const SAISIE_FAIBLE = "aaaaaaaa";
const SAISIE_MOYENNE = "aaaaa1";
const SAISIE_FORTE = "aaa1@aaaaaa";
const SAISIE_FORMULAIRE = "mdptest1234";
const SAISIE_DATE = "01/01/2000";

describe("RegistrationScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, "alert");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ─── HELPERS ─────────────────────────────────────────────────────────────────

    function fillAndSubmit(
        { firstName, lastName, birthday, email, password, confirmPassword },
        getByPlaceholderText,
        getByText
    ) {
        if (firstName !== undefined) fireEvent.changeText(getByPlaceholderText("Jean"), firstName);
        if (lastName !== undefined) fireEvent.changeText(getByPlaceholderText("Dupont"), lastName);
        if (birthday !== undefined) fireEvent.changeText(getByPlaceholderText("JJ/MM/AAAA"), birthday);
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
                <RegistrationScreen />
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
                <RegistrationScreen />
            );

            expect(queryByText("Tous les champs sont obligatoires.")).toBeNull();
            expect(queryByText("Les mots de passe ne correspondent pas.")).toBeNull();
        });
    });

    // ─── PASSWORD VISIBILITY TOGGLE ───────────────────────────────────────────────

    describe("Password visibility toggle", () => {
        it("should render the eye button for password field", () => {
            const { getByTestId } = render(
                <RegistrationScreen />
            );
            expect(getByTestId("toggle-password-visibility")).toBeTruthy();
        });

        it("should render the eye button for confirm password field", () => {
            const { getByTestId } = render(
                <RegistrationScreen />
            );
            expect(getByTestId("toggle-confirm-password-visibility")).toBeTruthy();
        });

        it("password field should be hidden by default (secureTextEntry=true)", () => {
            const { getByTestId } = render(
                <RegistrationScreen />
            );
            const passwordInput = getByTestId("password-input");
            expect(passwordInput.props.secureTextEntry).toBe(true);
        });

        it("pressing eye button should toggle password visibility", () => {
            const { getByTestId } = render(
                <RegistrationScreen />
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
                <RegistrationScreen />
            );
            const confirmInput = getByTestId("confirm-password-input");
            const toggleButton = getByTestId("toggle-confirm-password-visibility");

            expect(confirmInput.props.secureTextEntry).toBe(true);
            fireEvent.press(toggleButton);
            expect(confirmInput.props.secureTextEntry).toBe(false);
        });

        it("password and confirm password visibility toggles should be independent", () => {
            const { getByTestId } = render(
                <RegistrationScreen />
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
            expect(result.color).toBe("#D43A3A");
        });

        it("should return 'weak' for a long password with only letters", () => {
            const result = getPasswordStrength(SAISIE_FAIBLE);
            expect(result.level).toBe("weak");
        });

        it("should return 'fair' for a password with letters and numbers >= 6 chars", () => {
            const result = getPasswordStrength(SAISIE_MOYENNE);
            expect(result.level).toBe("fair");
            expect(result.label).toBe("Moyen");
            expect(result.color).toBe("#C48A00");
        });

        it("should return 'strong' for a password with letters, numbers, special char >= 10 chars", () => {
            const result = getPasswordStrength(SAISIE_FORTE);
            expect(result.level).toBe("strong");
            expect(result.label).toBe("Fort");
            expect(result.color).toBe("#48AFC4");
        });
    });

    describe("Password strength bar — UI", () => {
        it("should not show strength bar when password is empty", () => {
            const { queryByTestId } = render(
                <RegistrationScreen />
            );
            expect(queryByTestId("password-strength-container")).toBeNull();
        });

        it("should show 'Faible' for a weak password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen />
            );
            fireEvent.changeText(getByTestId("password-input"), "abc");
            expect(getByTestId("password-strength-container")).toBeTruthy();
            expect(getByText("Faible")).toBeTruthy();
        });

        it("should show 'Moyen' for a fair password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen />
            );
            fireEvent.changeText(getByTestId("password-input"), SAISIE_MOYENNE);
            expect(getByText("Moyen")).toBeTruthy();
        });

        it("should show 'Fort' for a strong password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen />
            );
            fireEvent.changeText(getByTestId("password-input"), SAISIE_FORTE);
            expect(getByText("Fort")).toBeTruthy();
        });
    });

    // ─── DATE MASK — formatBirthdayInput() ────────────────────────────────────────

    describe("Birthday mask — formatBirthdayInput()", () => {
        it("should insert slashes automatically while typing", () => {
            expect(formatBirthdayInput("1")).toBe("1");
            expect(formatBirthdayInput("13")).toBe("13");
            expect(formatBirthdayInput("131")).toBe("13/1");
            expect(formatBirthdayInput("1311")).toBe("13/11");
            expect(formatBirthdayInput("13112")).toBe("13/11/2");
            expect(formatBirthdayInput("13112000")).toBe("13/11/2000");
        });

        it("should ignore non-digit characters and cap at 8 digits", () => {
            expect(formatBirthdayInput("13/11/2000")).toBe("13/11/2000");
            expect(formatBirthdayInput("13a11b2000")).toBe("13/11/2000");
            expect(formatBirthdayInput("131120009999")).toBe("13/11/2000");
        });

        it("should handle backspace gracefully (recomputes slashes)", () => {
            expect(formatBirthdayInput("13/")).toBe("13");
            expect(formatBirthdayInput("13/11/")).toBe("13/11");
            expect(formatBirthdayInput("")).toBe("");
        });
    });

    // ─── DATE CONVERSION — toIsoDate() ────────────────────────────────────────────

    describe("Birthday conversion — toIsoDate()", () => {
        it("should convert JJ/MM/AAAA to ISO AAAA-MM-JJ", () => {
            expect(toIsoDate("01/01/2000")).toBe("2000-01-01");
            expect(toIsoDate("13/11/2000")).toBe("2000-11-13");
        });

        it("should trim surrounding whitespace", () => {
            expect(toIsoDate("  05/06/1990  ")).toBe("1990-06-05");
        });

        it("should return null for malformed input", () => {
            expect(toIsoDate("")).toBeNull();
            expect(toIsoDate("2000-01-01")).toBeNull();
            expect(toIsoDate("1/1/2000")).toBeNull();
            expect(toIsoDate("abc")).toBeNull();
        });

        it("should return null for an impossible calendar date", () => {
            expect(toIsoDate("31/02/2000")).toBeNull();
            expect(toIsoDate("32/01/2000")).toBeNull();
            expect(toIsoDate("00/00/2000")).toBeNull();
        });
    });

    // ─── FIELD VALIDATION ────────────────────────────────────────────────────────

    describe("Form validation", () => {
        it("should show error when all fields are empty", () => {
            const { getByText } = render(
                <RegistrationScreen />
            );

            fireEvent.press(getByText("S'inscrire"));

            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should show error when email is missing", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                { firstName: "Jean", lastName: "Dupont", birthday: SAISIE_DATE, email: "", password: SAISIE_FORMULAIRE, confirmPassword: SAISIE_FORMULAIRE },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should show error when password is missing", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                { firstName: "Jean", lastName: "Dupont", birthday: SAISIE_DATE, email: "utilisateur@exemple.com", password: "", confirmPassword: "" },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should show error when passwords do not match", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
                <RegistrationScreen />
            );

            fillAndSubmit(
                { firstName: "Jean", lastName: "Dupont", birthday: SAISIE_DATE, email: "utilisateur@exemple.com", password: "abc", confirmPassword: "abc" },
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
                <RegistrationScreen />
            );

            fireEvent.press(getByText("S'inscrire"));
            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
                        firstname: "Jean",
                        lastname: "Dupont",
                        email: "utilisateur@exemple.com",
                        password: SAISIE_FORMULAIRE,
                        birthday: "2000-01-01",
                    }),
                });
            });
        });

        it("should show success Alert and navigate to Login on successful registration", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: true });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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

            expect(mockNavigate).toHaveBeenCalledWith("Login");
        });

        it("should display API error message on failed registration (non-ok response)", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: "Email déjà utilisé." }),
            });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it("should display a friendly message when the email is already used (409)", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: async () => ({ message: "Email already in use" }),
            });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
                    email: "pris@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            await waitFor(() => {
                expect(getByText("Cet email est déjà utilisé.")).toBeTruthy();
            });
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it("should display fallback error message when API returns no message", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({}),
            });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: SAISIE_DATE,
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
                <RegistrationScreen />
            );
            expect(getByTestId("header-container")).toBeTruthy();
            expect(getByText("Créer un compte")).toBeTruthy();
            expect(getByText("Rejoignez Kompagnon aujourd'hui")).toBeTruthy();
        });

        it("should still show error container even with shake animation", () => {
            const { getByText, getByTestId } = render(
                <RegistrationScreen />
            );
            fireEvent.press(getByText("S'inscrire"));
            expect(getByTestId("error-container")).toBeTruthy();
            expect(getByText("Tous les champs sont obligatoires.")).toBeTruthy();
        });

        it("should render S'inscrire button with animated wrapper", () => {
            const { getByText } = render(
                <RegistrationScreen />
            );
            expect(getByText("S'inscrire")).toBeTruthy();
        });

        it("should run the button press-feedback handlers without crashing", () => {
            const { getByText } = render(
                <RegistrationScreen />
            );
            const button = getByText("S'inscrire");
            fireEvent(button, "pressIn");
            fireEvent(button, "pressOut");
            expect(button).toBeTruthy();
        });
    });

    // ─── DATE VALIDATION ─────────────────────────────────────────────────────────

    describe("Birthday validation on submit", () => {
        it("should reject an impossible calendar date without calling the API", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen />
            );

            fillAndSubmit(
                {
                    firstName: "Jean",
                    lastName: "Dupont",
                    birthday: "31/02/2000",
                    email: "utilisateur@exemple.com",
                    password: SAISIE_FORMULAIRE,
                    confirmPassword: SAISIE_FORMULAIRE,
                },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Date de naissance invalide. Utilisez le format JJ/MM/AAAA.")).toBeTruthy();
            expect(apiFetchModule.apiFetch).not.toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    // ─── NAVIGATION & INPUT FOCUS ────────────────────────────────────────────────

    describe("Navigation and focus", () => {
        it("should navigate to Login when tapping Se connecter", () => {
            const { getByText } = render(
                <RegistrationScreen />
            );
            fireEvent.press(getByText("Se connecter"));
            expect(mockNavigate).toHaveBeenCalledWith("Login");
        });

        it("should handle focus and blur on text and password inputs", () => {
            const { getByTestId } = render(
                <RegistrationScreen />
            );
            const firstName = getByTestId("firstName-input");
            fireEvent(firstName, "focus");
            fireEvent(firstName, "blur");

            const password = getByTestId("password-input");
            fireEvent(password, "focus");
            fireEvent(password, "blur");

            expect(firstName).toBeTruthy();
            expect(password).toBeTruthy();
        });
    });
});
