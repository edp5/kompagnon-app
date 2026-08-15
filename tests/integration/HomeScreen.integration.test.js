import { fireEvent, render } from "@testing-library/react-native";

import HomeScreen from "../../screens/HomeScreen";
import { checkHealth } from "../../utils/api-fetch";

jest.mock("../../utils/api-fetch", () => ({
    checkHealth: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("HomeScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        checkHealth.mockResolvedValue(false);
    });

    it("should show 'API connectée' when the health check passes", async () => {
        checkHealth.mockResolvedValueOnce(true);

        const { findByText } = render(<HomeScreen />);

        expect(await findByText("API connectée")).toBeTruthy();
    });

    it("should show 'API injoignable' when the health check fails", async () => {
        checkHealth.mockResolvedValueOnce(false);

        const { findByText } = render(<HomeScreen />);

        expect(await findByText("API injoignable")).toBeTruthy();
    });

    it("should navigate to the journey form from the main action", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Demander un accompagnement"));

        expect(mockNavigate).toHaveBeenCalledWith("RecordJourney");
    });

    it("should navigate to the journeys list", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Mes trajets"));

        expect(mockNavigate).toHaveBeenCalledWith("Journeys");
    });

    it("should navigate to the profile", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Mon profil"));

        expect(mockNavigate).toHaveBeenCalledWith("Profile");
    });
});
