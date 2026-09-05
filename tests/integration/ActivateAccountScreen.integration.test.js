import { fireEvent, render } from "@testing-library/react-native";

import ActivateAccountScreen from "../../screens/ActivateAccountScreen";
import { activateAccount } from "../../utils/auth";

jest.mock("../../utils/auth", () => ({ activateAccount: jest.fn() }));

const mockReset = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams = {};
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset, goBack: mockGoBack }),
    useRoute: () => ({ params: mockRouteParams }),
}));

function fill(getByLabelText, { token = "jwt", phone = "0612345678" } = {}) {
    fireEvent.changeText(getByLabelText("Code d'activation"), token);
    fireEvent.changeText(getByLabelText("Numéro de mobile"), phone);
}

describe("ActivateAccountScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = {};
        activateAccount.mockResolvedValue({ success: true });
    });

    it("prefills the code coming from the activation email", () => {
        mockRouteParams = { token: "from-email" };

        const { getByLabelText } = render(<ActivateAccountScreen />);

        expect(getByLabelText("Code d'activation").props.value).toBe("from-email");
    });

    it("offers both roles", () => {
        const { getByTestId } = render(<ActivateAccountScreen />);

        expect(getByTestId("activate-role-passenger")).toBeTruthy();
        expect(getByTestId("activate-role-companion")).toBeTruthy();
    });

    it("requires the activation code before submitting", async () => {
        const { getByLabelText, findByText } = render(<ActivateAccountScreen />);

        fireEvent.press(getByLabelText("Activer mon compte"));

        expect(await findByText("Collez le code d'activation reçu par email.")).toBeTruthy();
        expect(activateAccount).not.toHaveBeenCalled();
    });

    it("goes back", () => {
        const { getByLabelText } = render(<ActivateAccountScreen />);
        fireEvent.press(getByLabelText("Retour"));
        expect(mockGoBack).toHaveBeenCalled();
    });

    it("refuses an invalid phone number", async () => {
        const { getByLabelText, findByText } = render(<ActivateAccountScreen />);

        fill(getByLabelText, { phone: "0123" });
        fireEvent.press(getByLabelText("Activer mon compte"));

        expect(await findByText("Renseignez un numéro de mobile valide (ex. 0612345678).")).toBeTruthy();
        expect(activateAccount).not.toHaveBeenCalled();
    });

    it("requires a role", async () => {
        const { getByLabelText, findByText } = render(<ActivateAccountScreen />);

        fill(getByLabelText);
        fireEvent.press(getByLabelText("Activer mon compte"));

        expect(await findByText("Choisissez votre rôle pour continuer.")).toBeTruthy();
        expect(activateAccount).not.toHaveBeenCalled();
    });

    it("activates the account with the phone number and the chosen role", async () => {
        const { getByLabelText, getByTestId } = render(<ActivateAccountScreen />);

        fill(getByLabelText);
        fireEvent.press(getByTestId("activate-role-companion"));
        fireEvent.press(getByLabelText("Activer mon compte"));

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(activateAccount).toHaveBeenCalledWith({
            token: "jwt",
            phoneNumber: "0612345678",
            role: "companion",
        });
        expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    });

    it("explains an invalid activation link", async () => {
        activateAccount.mockResolvedValue({ success: false, message: "Ce lien d'activation est invalide ou expiré." });

        const { getByLabelText, getByTestId, findByText } = render(<ActivateAccountScreen />);
        fill(getByLabelText);
        fireEvent.press(getByTestId("activate-role-passenger"));
        fireEvent.press(getByLabelText("Activer mon compte"));

        expect(await findByText("Ce lien d'activation est invalide ou expiré.")).toBeTruthy();
    });
});
