import { fireEvent, render } from "@testing-library/react-native";

import HomeScreen from "../../screens/HomeScreen";
import * as apiFetchModule from "../../utils/api-fetch.js";

jest.mock("@env", () => ({
    KOMPAGNON_API_URL: "http://localhost:3000",
}));

jest.mock("../../utils/api-fetch.js", () => ({
    apiFetch: jest.fn(),
}));

const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ reset: mockReset }),
}));

describe("HomeScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should show 'API connectée' when the health check returns 200", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({ status: 200 });

        const { findByText } = render(<HomeScreen />);

        expect(await findByText("API connectée")).toBeTruthy();
    });

    it("should show 'API injoignable' when the health check fails", async () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({ status: 500 });

        const { findByText } = render(<HomeScreen />);

        expect(await findByText("API injoignable")).toBeTruthy();
    });

    it("should show 'API injoignable' when the health check throws", async () => {
        apiFetchModule.apiFetch.mockRejectedValueOnce(new Error("network down"));

        const { findByText } = render(<HomeScreen />);

        expect(await findByText("API injoignable")).toBeTruthy();
    });

    it("should reset navigation to Login on logout", () => {
        apiFetchModule.apiFetch.mockResolvedValueOnce({ status: 200 });

        const { getByText } = render(<HomeScreen />);
        fireEvent.press(getByText("Se déconnecter"));

        expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
    });
});
