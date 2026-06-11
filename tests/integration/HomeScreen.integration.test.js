import { fireEvent, render } from "@testing-library/react-native";

import HomeScreen from "../../screens/HomeScreen";
import { checkHealth } from "../../utils/api-fetch";

jest.mock("../../utils/api-fetch", () => ({
    checkHealth: jest.fn(),
}));

const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset }),
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

    it("should reset navigation to Login on logout", () => {
        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Se déconnecter"));

        expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    });
});
