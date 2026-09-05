import { fireEvent, render } from "@testing-library/react-native";

import JourneysScreen from "../../screens/JourneysScreen";
import { getPastMatchedJourneys, getUpcomingMatchedJourneys } from "../../utils/journeys";
import { getSession } from "../../utils/session";

jest.mock("../../utils/journeys", () => ({
    getUpcomingMatchedJourneys: jest.fn(),
    getPastMatchedJourneys: jest.fn(),
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

const CONFIRMED_JOURNEY = {
    id: 8,
    departureAddress: "12 Rue de Rivoli, Paris",
    arrivalAddress: "Gare de Lyon, Paris",
    departureTime: "2026-08-14T15:00:00.000Z",
    arrivalTime: "2026-08-14T16:00:00.000Z",
    isMatched: true,
    matches: [{ foundJourneyId: 1, myStatus: "accepted", otherStatus: "accepted" }],
    confirmedMatch: {
        foundJourneyId: 1,
        user: { firstname: "Bob", lastname: "Durand" },
        myStatus: "accepted",
        otherStatus: "accepted",
    },
    pendingCount: 0,
};

const PENDING_JOURNEY = {
    id: 9,
    departureAddress: "5 Avenue Anatole France, Paris",
    arrivalAddress: "Gare du Nord, Paris",
    departureTime: "2026-08-15T09:00:00.000Z",
    arrivalTime: "2026-08-15T10:00:00.000Z",
    isMatched: true,
    matches: [
        { foundJourneyId: 2, myStatus: "waiting", otherStatus: "waiting" },
        { foundJourneyId: 3, myStatus: "waiting", otherStatus: "accepted" },
    ],
    confirmedMatch: null,
    pendingCount: 2,
};

describe("JourneysScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getUpcomingMatchedJourneys.mockResolvedValue({ success: true, journeys: [CONFIRMED_JOURNEY] });
        getPastMatchedJourneys.mockResolvedValue({ success: true, journeys: [] });
    });

    it("lists a confirmed journey with the other user", async () => {
        const { findByText, getByText } = render(<JourneysScreen />);

        expect(await findByText("12 Rue de Rivoli, Paris")).toBeTruthy();
        expect(getByText("Gare de Lyon, Paris")).toBeTruthy();
        expect(getByText("Avec Bob Durand")).toBeTruthy();
        expect(getByText("Confirmé")).toBeTruthy();
        expect(getUpcomingMatchedJourneys).toHaveBeenCalledWith({ token: "jwt" });
    });

    it("flags a journey with pending requests to answer", async () => {
        getUpcomingMatchedJourneys.mockResolvedValue({ success: true, journeys: [PENDING_JOURNEY] });

        const { findByText, getByText } = render(<JourneysScreen />);

        expect(await findByText("2 demandes")).toBeTruthy();
        expect(getByText("Appuyez pour répondre à la demande")).toBeTruthy();
    });

    it("opens the journey detail when a journey is tapped", async () => {
        const { findByTestId } = render(<JourneysScreen />);

        fireEvent.press(await findByTestId("journey-card-8"));

        expect(mockNavigate).toHaveBeenCalledWith("JourneyDetail", { journeyId: 8 });
    });

    it("shows an empty state when there is no upcoming journey", async () => {
        getUpcomingMatchedJourneys.mockResolvedValue({ success: true, journeys: [] });

        const { findByTestId, getByText } = render(<JourneysScreen />);

        expect(await findByTestId("journeys-empty")).toBeTruthy();
        expect(getByText("Aucun trajet à venir")).toBeTruthy();
    });

    it("shows an error when the journeys cannot be loaded", async () => {
        getUpcomingMatchedJourneys.mockResolvedValue({
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
        expect(getUpcomingMatchedJourneys).not.toHaveBeenCalled();
    });

    it("shows the travelled journeys when switching to the past tab", async () => {
        getPastMatchedJourneys.mockResolvedValue({
            success: true,
            journeys: [{ ...CONFIRMED_JOURNEY, id: 4, departureAddress: "Ancien départ, Paris" }],
        });

        const { findByTestId, findByText } = render(<JourneysScreen />);
        fireEvent.press(await findByTestId("journeys-tab-past"));

        expect(await findByText("Ancien départ, Paris")).toBeTruthy();
        expect(getPastMatchedJourneys).toHaveBeenCalledWith({ token: "jwt" });
    });

    it("tells the user when nothing has been travelled yet", async () => {
        const { findByTestId, findByText } = render(<JourneysScreen />);
        fireEvent.press(await findByTestId("journeys-tab-past"));

        expect(await findByText("Aucun trajet passé")).toBeTruthy();
    });
});
