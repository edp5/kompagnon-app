import { fireEvent, render } from "@testing-library/react-native";

import ResetPasswordScreen from "../../screens/ResetPasswordScreen";
import { resetPassword } from "../../utils/auth";

jest.mock("../../utils/auth", () => ({ resetPassword: jest.fn() }));

const mockReset = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams = {};
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset, goBack: mockGoBack }),
    useRoute: () => ({ params: mockRouteParams }),
}));

describe("ResetPasswordScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = {};
        resetPassword.mockResolvedValue({ success: true });
    });

    it("prefills the code coming from the email link", () => {
        mockRouteParams = { token: "from-email" };

        const { getByLabelText } = render(<ResetPasswordScreen />);

        expect(getByLabelText("Code de réinitialisation").props.value).toBe("from-email");
    });

    it("requires the code before submitting", async () => {
        const { getByLabelText, findByText } = render(<ResetPasswordScreen />);

        fireEvent.press(getByLabelText("Changer le mot de passe"));

        expect(await findByText("Collez le code reçu par email.")).toBeTruthy();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("goes back", () => {
        const { getByLabelText } = render(<ResetPasswordScreen />);
        fireEvent.press(getByLabelText("Retour"));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it("refuses a password that is too short", async () => {
        const { getByLabelText, findByText } = render(<ResetPasswordScreen />);

        fireEvent.changeText(getByLabelText("Code de réinitialisation"), "abc");
        fireEvent.changeText(getByLabelText("Nouveau mot de passe"), "123");
        fireEvent.press(getByLabelText("Changer le mot de passe"));

        expect(await findByText("Le mot de passe doit faire au moins 6 caractères.")).toBeTruthy();
        expect(resetPassword).not.toHaveBeenCalled();
    });

    it("refuses mismatched passwords", async () => {
        const { getByLabelText, findByText } = render(<ResetPasswordScreen />);

        fireEvent.changeText(getByLabelText("Code de réinitialisation"), "abc");
        fireEvent.changeText(getByLabelText("Nouveau mot de passe"), "motdepasse");
        fireEvent.changeText(getByLabelText("Confirmer le mot de passe"), "different");
        fireEvent.press(getByLabelText("Changer le mot de passe"));

        expect(await findByText("Les mots de passe ne correspondent pas.")).toBeTruthy();
    });

    it("changes the password and sends the user back to login", async () => {
        const { getByLabelText, findByLabelText } = render(<ResetPasswordScreen />);

        fireEvent.changeText(getByLabelText("Code de réinitialisation"), "abc");
        fireEvent.changeText(getByLabelText("Nouveau mot de passe"), "motdepasse");
        fireEvent.changeText(getByLabelText("Confirmer le mot de passe"), "motdepasse");
        fireEvent.press(await findByLabelText("Changer le mot de passe"));

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(resetPassword).toHaveBeenCalledWith({ token: "abc", password: "motdepasse" });
        expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    });

    it("explains an expired link", async () => {
        resetPassword.mockResolvedValue({ success: false, message: "Ce lien est invalide ou expiré. Demandez-en un nouveau." });

        const { getByLabelText, findByText } = render(<ResetPasswordScreen />);
        fireEvent.changeText(getByLabelText("Code de réinitialisation"), "old");
        fireEvent.changeText(getByLabelText("Nouveau mot de passe"), "motdepasse");
        fireEvent.changeText(getByLabelText("Confirmer le mot de passe"), "motdepasse");
        fireEvent.press(getByLabelText("Changer le mot de passe"));

        expect(await findByText("Ce lien est invalide ou expiré. Demandez-en un nouveau.")).toBeTruthy();
    });
});
