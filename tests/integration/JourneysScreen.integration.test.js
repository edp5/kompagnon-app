import { fireEvent, render } from "@testing-library/react-native";

import JourneysScreen from "../../screens/JourneysScreen";
import { getUpcomingConfirmedJourneys } from "../../utils/journeys";
import { getSession } from "../../utils/session";

jest.mock("../../utils/journeys", () => ({
    getUpcomingConfirmedJourneys: jest.fn(),
}));

jest.mock("../../utils/session", () => ({
    getSession: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
    // Run the focus callback once, like a screen coming into view.
    useFocusEffect: (callback) => {
        const React = require("react");
        React.useEffect(callback, [callback]);
    },
}));

const JOURNEY = {
    id: 8,
    departureAddress: "12 Rue de Rivoli, Paris",
    arrivalAddress: "Gare de Lyon, Paris",
    departureTime: "2026-08-14T15:00:00.000Z",
    arrivalTime: "2026-08-14T16:00:00.000Z",
    isMatched: true,
    match: {
        foundJourneyId: 1,
        user: { firstname: "Bob", lastname: "Durand" },
        myStatus: "accepted",
        otherStatus: "accepted",
    },
};

describe("JourneysScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getUpcomingConfirmedJourneys.mockResolvedValue({ success: true, journeys: [JOURNEY] });
    });

    it("lists the confirmed journeys with the other user", async () => {
        const { findByText, getByText } = render(<JourneysScreen />);

        expect(await findByText("12 Rue de Rivoli, Paris")).toBeTruthy();
        expect(getByText("Gare de Lyon, Paris")).toBeTruthy();
        expect(getByText("Avec Bob Durand")).toBeTruthy();
        expect(getByText("Confirmé")).toBeTruthy();
        expect(getUpcomingConfirmedJourneys).toHaveBeenCalledWith({ token: "jwt" });
    });

    it("opens the journey detail when a journey is tapped", async () => {
        const { findByTestId } = render(<JourneysScreen />);

        fireEvent.press(await findByTestId("journey-card-8"));

        expect(mockNavigate).toHaveBeenCalledWith("JourneyDetail", { journeyId: 8 });
    });

    it("shows an empty state when there is no confirmed journey", async () => {
        getUpcomingConfirmedJourneys.mockResolvedValue({ success: true, journeys: [] });

        const { findByTestId, getByText } = render(<JourneysScreen />);

        expect(await findByTestId("journeys-empty")).toBeTruthy();
        expect(getByText("Aucun trajet confirmé")).toBeTruthy();
    });

    it("shows an error when the journeys cannot be loaded", async () => {
        getUpcomingConfirmedJourneys.mockResolvedValue({
            success: false,
            message: "Impossible de récupérer vos trajets. Réessayez.",
        });

        const { findByText } = render(<JourneysScreen />);

        expect(await findByText("Impossible de récupérer vos trajets. Réessayez.")).toBeTruthy();
    });

    it("asks the user to reconnect when the session is missing", async () => {
        getSession.mockResolvedValue(null);

        const { findByText } = render(<JourneysScreen />);

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(getUpcomingConfirmedJourneys).not.toHaveBeenCalled();
    });
});
