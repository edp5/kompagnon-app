import { fireEvent, render } from "@testing-library/react-native";

import ForgotPasswordScreen from "../../screens/ForgotPasswordScreen";
import { requestPasswordReset } from "../../utils/auth";

jest.mock("../../utils/auth", () => ({ requestPasswordReset: jest.fn() }));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

describe("ForgotPasswordScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        requestPasswordReset.mockResolvedValue({ success: true });
    });

    it("requires an email before submitting", async () => {
        const { findByText, getByLabelText } = render(<ForgotPasswordScreen />);
        fireEvent.press(getByLabelText("Envoyer le lien"));

        expect(await findByText("Renseignez votre adresse email.")).toBeTruthy();
        expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    it("sends the reset link and confirms without revealing whether the account exists", async () => {
        const { getByLabelText, findByTestId, findByText } = render(<ForgotPasswordScreen />);

        fireEvent.changeText(getByLabelText("Adresse email"), "alice@exemple.com");
        fireEvent.press(getByLabelText("Envoyer le lien"));

        expect(await findByTestId("forgot-success")).toBeTruthy();
        expect(await findByText(/Si un compte existe/)).toBeTruthy();
        expect(requestPasswordReset).toHaveBeenCalledWith({ email: "alice@exemple.com" });
    });

    it("shows the error when the request fails", async () => {
        requestPasswordReset.mockResolvedValue({ success: false, message: "Impossible d'envoyer le lien. Réessayez." });

        const { getByLabelText, findByText } = render(<ForgotPasswordScreen />);
        fireEvent.changeText(getByLabelText("Adresse email"), "alice@exemple.com");
        fireEvent.press(getByLabelText("Envoyer le lien"));

        expect(await findByText("Impossible d'envoyer le lien. Réessayez.")).toBeTruthy();
    });

    it("goes to the reset screen from the confirmation", async () => {
        const { getByLabelText, findByTestId } = render(<ForgotPasswordScreen />);

        fireEvent.changeText(getByLabelText("Adresse email"), "alice@exemple.com");
        fireEvent.press(getByLabelText("Envoyer le lien"));
        await findByTestId("forgot-success");

        fireEvent.press(getByLabelText("J'ai reçu le lien"));

        expect(mockNavigate).toHaveBeenCalledWith("ResetPassword");
    });

    it("goes back", () => {
        const { getByLabelText } = render(<ForgotPasswordScreen />);
        fireEvent.press(getByLabelText("Retour"));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it("lets the user go straight to the reset screen with a code", async () => {
        const { getByLabelText } = render(<ForgotPasswordScreen />);
        fireEvent.press(getByLabelText("J'ai déjà un code de réinitialisation"));

        expect(mockNavigate).toHaveBeenCalledWith("ResetPassword");
    });
});
