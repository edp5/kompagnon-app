import { fireEvent, render } from "@testing-library/react-native";

import WelcomeScreen from "../../screens/WelcomeScreen";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("WelcomeScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("presents the app and both entry points", () => {
        const { getByText, getByLabelText } = render(<WelcomeScreen />);

        expect(getByText("Kompagnon")).toBeTruthy();
        expect(getByLabelText("Se connecter")).toBeTruthy();
        expect(getByLabelText("Créer un compte")).toBeTruthy();
    });

    it("goes to the login screen", () => {
        const { getByLabelText } = render(<WelcomeScreen />);
        fireEvent.press(getByLabelText("Se connecter"));

        expect(mockNavigate).toHaveBeenCalledWith("Login");
    });

    it("goes to the registration screen", () => {
        const { getByLabelText } = render(<WelcomeScreen />);
        fireEvent.press(getByLabelText("Créer un compte"));

        expect(mockNavigate).toHaveBeenCalledWith("Register");
    });
});
