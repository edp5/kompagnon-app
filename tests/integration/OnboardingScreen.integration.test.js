import { fireEvent, render, waitFor } from "@testing-library/react-native";

import OnboardingScreen from "../../screens/OnboardingScreen";
import { markOnboardingSeen } from "../../utils/onboarding";

jest.mock("../../utils/onboarding", () => ({ markOnboardingSeen: jest.fn() }));

const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset }),
}));

describe("OnboardingScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        markOnboardingSeen.mockResolvedValue(undefined);
    });

    it("opens on the first step", () => {
        const { getByText } = render(<OnboardingScreen />);

        expect(getByText("Se déplacer sans obstacle")).toBeTruthy();
        expect(getByText("Suivant")).toBeTruthy();
    });

    it("walks through the steps and finishes on the last one", async () => {
        const { getByTestId, getByText } = render(<OnboardingScreen />);

        fireEvent.press(getByTestId("onboarding-next"));
        fireEvent.press(getByTestId("onboarding-next"));

        // Last step offers to start rather than to continue.
        expect(getByText("Commencer")).toBeTruthy();

        fireEvent.press(getByTestId("onboarding-next"));

        await waitFor(() => {
            expect(markOnboardingSeen).toHaveBeenCalled();
            expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Welcome" }] });
        });
    });

    it("can be skipped, and is not shown again", async () => {
        const { getByTestId } = render(<OnboardingScreen />);

        fireEvent.press(getByTestId("onboarding-skip"));

        await waitFor(() => {
            expect(markOnboardingSeen).toHaveBeenCalled();
            expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Welcome" }] });
        });
    });
});
