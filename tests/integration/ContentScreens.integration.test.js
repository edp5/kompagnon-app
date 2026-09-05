import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import AboutScreen from "../../screens/AboutScreen";
import HelpScreen from "../../screens/HelpScreen";
import PrivacyScreen from "../../screens/PrivacyScreen";
import TermsScreen from "../../screens/TermsScreen";
import { resetOnboarding } from "../../utils/onboarding";

jest.mock("../../utils/onboarding", () => ({ resetOnboarding: jest.fn() }));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate, reset: mockReset }),
}));

describe("Help, privacy, terms and about — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetOnboarding.mockResolvedValue(undefined);
        jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Help", () => {
        it("lists the questions with their answers hidden", () => {
            const { getByTestId, getByText, queryByText } = render(<HelpScreen />);

            expect(getByTestId("help-screen")).toBeTruthy();
            expect(getByText("Comment contacter mon binôme ?")).toBeTruthy();
            // The answer only appears once the question is opened.
            expect(queryByText(/le bouton « Appeler » apparaît/)).toBeNull();
        });

        it("unfolds an answer when the question is tapped", () => {
            const { getByTestId, getByText } = render(<HelpScreen />);

            fireEvent.press(getByTestId("help-question-3"));

            expect(getByText(/le bouton « Appeler » apparaît/)).toBeTruthy();
        });

        it("opens the mail client to reach the support", () => {
            const { getByTestId } = render(<HelpScreen />);

            fireEvent.press(getByTestId("help-contact"));

            expect(Linking.openURL).toHaveBeenCalledWith("mailto:contact@kompagnon.dev");
        });

        it("replays the introduction", async () => {
            const { getByTestId } = render(<HelpScreen />);

            fireEvent.press(getByTestId("help-replay"));

            await waitFor(() => {
                expect(resetOnboarding).toHaveBeenCalled();
                expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Onboarding" }] });
            });
        });
    });

    describe("Privacy", () => {
        it("leads with the commitments", () => {
            const { getByTestId, getByText } = render(<PrivacyScreen />);

            expect(getByTestId("privacy-screen")).toBeTruthy();
            expect(getByText("Votre numéro reste privé")).toBeTruthy();
            expect(getByText("Partagé après accord")).toBeTruthy();
        });

        it("unfolds a detail on demand", () => {
            const { getByTestId, getByText, queryByText } = render(<PrivacyScreen />);

            expect(queryByText(/droit d'accès, de rectification/)).toBeNull();
            fireEvent.press(getByTestId("privacy-detail-4"));

            expect(getByText(/droit d'accès, de rectification/)).toBeTruthy();
        });
    });

    describe("About", () => {
        it("shows the brand, the version and how it works", () => {
            const { getByTestId, getByText } = render(<AboutScreen />);

            expect(getByTestId("about-screen")).toBeTruthy();
            expect(getByText(/Version \d+\.\d+\.\d+/)).toBeTruthy();
            expect(getByText("Enregistrez un trajet")).toBeTruthy();
        });

        it("does not repeat what the profile menu already offers", () => {
            const { queryByLabelText } = render(<AboutScreen />);

            // Privacy, terms and support all live one level up, in the profile.
            expect(queryByLabelText("Confidentialité")).toBeNull();
            expect(queryByLabelText("Conditions d'utilisation")).toBeNull();
            expect(queryByLabelText("Revoir l'introduction")).toBeNull();
        });

        it("goes back", () => {
            const { getByLabelText } = render(<AboutScreen />);
            fireEvent.press(getByLabelText("Retour"));

            expect(mockGoBack).toHaveBeenCalled();
        });
    });

    describe("Terms", () => {
        it("shows the terms of use", () => {
            const { getByTestId, getByText } = render(<TermsScreen />);

            expect(getByTestId("terms-screen")).toBeTruthy();
            expect(getByText("Objet du service")).toBeTruthy();
        });
    });
});
