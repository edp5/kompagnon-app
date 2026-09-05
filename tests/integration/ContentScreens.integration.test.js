import { fireEvent, render } from "@testing-library/react-native";

import AboutScreen from "../../screens/AboutScreen";
import HelpScreen from "../../screens/HelpScreen";
import PrivacyScreen from "../../screens/PrivacyScreen";
import TermsScreen from "../../screens/TermsScreen";

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ goBack: mockGoBack }),
}));

describe("Content screens — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows the help page with its questions", () => {
        const { getByTestId, getByText } = render(<HelpScreen />);

        expect(getByTestId("help-screen")).toBeTruthy();
        expect(getByText("Aide & support")).toBeTruthy();
        expect(getByText("Comment contacter mon binôme ?")).toBeTruthy();
    });

    it("shows the privacy page, including what happens to the phone number", () => {
        const { getByTestId, getByText } = render(<PrivacyScreen />);

        expect(getByTestId("privacy-screen")).toBeTruthy();
        expect(getByText("Votre numéro de téléphone")).toBeTruthy();
    });

    it("shows the about page with the app version", () => {
        const { getByTestId, getByText } = render(<AboutScreen />);

        expect(getByTestId("about-screen")).toBeTruthy();
        expect(getByText(/Kompagnon mobile \d+\.\d+\.\d+/)).toBeTruthy();
    });

    it("shows the terms of use", () => {
        const { getByTestId, getByText } = render(<TermsScreen />);

        expect(getByTestId("terms-screen")).toBeTruthy();
        expect(getByText("Objet du service")).toBeTruthy();
    });

    it("goes back from a content page", () => {
        const { getByLabelText } = render(<AboutScreen />);
        fireEvent.press(getByLabelText("Retour"));

        expect(mockGoBack).toHaveBeenCalled();
    });
});
