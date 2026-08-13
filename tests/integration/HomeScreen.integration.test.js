import { fireEvent, render, waitFor } from "@testing-library/react-native";

import HomeScreen from "../../screens/HomeScreen";
import { checkHealth } from "../../utils/api-fetch";
import { clearSession } from "../../utils/session";

jest.mock("../../utils/api-fetch", () => ({
    checkHealth: jest.fn(),
}));

jest.mock("../../utils/session", () => ({
    clearSession: jest.fn(),
}));

const mockReset = jest.fn();
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset, navigate: mockNavigate }),
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

    it("should clear the session and reset navigation to Login on logout", async () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Se déconnecter"));

        await waitFor(() => {
            expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
        });
        expect(clearSession).toHaveBeenCalled();
    });

    it("should navigate to the journey screen from the main action", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Demander un accompagnement"));

        expect(mockNavigate).toHaveBeenCalledWith("RecordJourney");
    });
});
