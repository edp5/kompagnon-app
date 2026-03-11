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
        if (firstName !== undefined) fireEvent.changeText(getByPlaceholderText("John"), firstName);
        if (lastName !== undefined) fireEvent.changeText(getByPlaceholderText("Doe"), lastName);
        fireEvent.changeText(getByPlaceholderText("hello@example.com"), email ?? "");
        fireEvent.changeText(getByPlaceholderText("Min. 6 characters"), password ?? "");
        fireEvent.changeText(
            getByPlaceholderText("Re-enter your password"),
            confirmPassword ?? ""
        );
        fireEvent.press(getByText("Sign Up"));
    }

    // ─── RENDERING ───────────────────────────────────────────────────────────────

    describe("Initial rendering", () => {
        it("should display all form elements", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            expect(getByText("Create Account")).toBeTruthy();
            expect(getByText("Join Kompagnon today")).toBeTruthy();
            expect(getByPlaceholderText("John")).toBeTruthy();
            expect(getByPlaceholderText("Doe")).toBeTruthy();
            expect(getByPlaceholderText("hello@example.com")).toBeTruthy();
            expect(getByPlaceholderText("Min. 6 characters")).toBeTruthy();
            expect(getByPlaceholderText("Re-enter your password")).toBeTruthy();
            expect(getByText("Sign Up")).toBeTruthy();
            expect(getByText("Log In")).toBeTruthy();
        });

        it("should not display any error on initial render", () => {
            const { queryByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            expect(queryByText("All fields are required.")).toBeNull();
            expect(queryByText("Passwords do not match.")).toBeNull();
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
            const result = getPasswordStrength("abcdefgh");
            expect(result.level).toBe("weak");
        });

        it("should return 'fair' for a password with letters and numbers >= 6 chars", () => {
            const result = getPasswordStrength("abc123");
            expect(result.level).toBe("fair");
            expect(result.label).toBe("Moyen");
            expect(result.color).toBe("#FDCB6E");
        });

        it("should return 'strong' for a password with letters, numbers, special char >= 10 chars", () => {
            const result = getPasswordStrength("Secure@12345");
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
            fireEvent.changeText(getByTestId("password-input"), "abc123");
            expect(getByText("Moyen")).toBeTruthy();
        });

        it("should show 'Fort' for a strong password", () => {
            const { getByTestId, getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            fireEvent.changeText(getByTestId("password-input"), "Secure@12345");
            expect(getByText("Fort")).toBeTruthy();
        });
    });

    // ─── FIELD VALIDATION ────────────────────────────────────────────────────────

    describe("Form validation", () => {
        it("should show error when all fields are empty", () => {
            const { getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fireEvent.press(getByText("Sign Up"));

            expect(getByText("All fields are required.")).toBeTruthy();
        });

        it("should show error when email is missing", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                { firstName: "John", lastName: "Doe", email: "", password: "test-Password123!", confirmPassword: "test-Password123!" },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("All fields are required.")).toBeTruthy();
        });

        it("should show error when password is missing", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                { firstName: "John", lastName: "Doe", email: "user@example.com", password: "", confirmPassword: "" },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("All fields are required.")).toBeTruthy();
        });

        it("should show error when passwords do not match", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                {
                    firstName: "John",
                    lastName: "Doe",
                    email: "user@example.com",
                    password: "test-Password123!",
                    confirmPassword: "different",
                },
                getByPlaceholderText,
                getByText
            );

            expect(getByText("Passwords do not match.")).toBeTruthy();
        });

        it("should show error when password is shorter than 6 characters", () => {
            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fillAndSubmit(
                { firstName: "John", lastName: "Doe", email: "user@example.com", password: "abc", confirmPassword: "abc" },
                getByPlaceholderText,
                getByText
            );

            expect(
                getByText("Password must be at least 6 characters long.")
            ).toBeTruthy();
        });

        it("should clear error after re-submitting valid data", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({
                ok: true,
            });

            const { getByText, getByPlaceholderText, queryByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            fireEvent.press(getByText("Sign Up"));
            expect(getByText("All fields are required.")).toBeTruthy();

            await act(async () => {
                fillAndSubmit(
                    {
                        email: "user@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(queryByText("All fields are required.")).toBeNull();
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

            await act(async () => {
                fillAndSubmit(
                    {
                        firstName: "John",
                        lastName: "Doe",
                        email: "user@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(apiFetchModule.apiFetch).toHaveBeenCalledWith("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName: "John",
                        lastName: "Doe",
                        email: "user@example.com",
                        password: "test-Password123!",
                    }),
                });
            });
        });

        it("should show success Alert and call onRegisterSuccess on successful registration", async () => {
            apiFetchModule.apiFetch.mockResolvedValueOnce({ ok: true });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            await act(async () => {
                fillAndSubmit(
                    {
                        firstName: "John",
                        lastName: "Doe",
                        email: "user@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    "Success",
                    "Account created successfully!",
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
                json: async () => ({ message: "Email already in use." }),
            });

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            await act(async () => {
                fillAndSubmit(
                    {
                        email: "taken@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(getByText("Email already in use.")).toBeTruthy();
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

            await act(async () => {
                fillAndSubmit(
                    {
                        firstName: "John",
                        lastName: "Doe",
                        email: "user@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(
                    getByText("Registration failed. Please try again.")
                ).toBeTruthy();
            });
        });

        it("should display network error message when fetch throws", async () => {
            apiFetchModule.apiFetch.mockRejectedValueOnce(new Error("Network error"));

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            await act(async () => {
                fillAndSubmit(
                    {
                        firstName: "John",
                        lastName: "Doe",
                        email: "user@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(
                    getByText("An error occurred. Please check your connection.")
                ).toBeTruthy();
            });
        });
    });

    // ─── LOADING STATE ───────────────────────────────────────────────────────────

    describe("Loading state", () => {
        it("should disable the Sign Up button while loading", async () => {
            apiFetchModule.apiFetch.mockReturnValueOnce(new Promise(() => { }));

            const { getByText, getByPlaceholderText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );

            await act(async () => {
                fillAndSubmit(
                    {
                        email: "user@example.com",
                        password: "test-Password123!",
                        confirmPassword: "test-Password123!",
                    },
                    getByPlaceholderText,
                    getByText
                );
            });

            await waitFor(() => {
                expect(() => getByText("Sign Up")).toThrow();
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
            expect(getByText("Create Account")).toBeTruthy();
            expect(getByText("Join Kompagnon today")).toBeTruthy();
        });

        it("should still show error container even with shake animation", () => {
            const { getByText, getByTestId } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            fireEvent.press(getByText("Sign Up"));
            expect(getByTestId("error-container")).toBeTruthy();
            expect(getByText("All fields are required.")).toBeTruthy();
        });

        it("should render Sign Up button with animated wrapper", () => {
            const { getByText } = render(
                <RegistrationScreen onRegisterSuccess={onRegisterSuccess} />
            );
            expect(getByText("Sign Up")).toBeTruthy();
        });
    });
});
