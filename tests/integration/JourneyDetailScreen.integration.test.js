import { render } from "@testing-library/react-native";

import JourneyDetailScreen from "../../screens/JourneyDetailScreen";
import { getJourney, getJourneyMatches } from "../../utils/journeys";
import { getSession } from "../../utils/session";

jest.mock("../../utils/journeys", () => ({
    getJourney: jest.fn(),
    getJourneyMatches: jest.fn(),
    // Keep the real rule: confirmed means both sides accepted.
    isConfirmedMatch: (match) => match?.myStatus === "accepted" && match?.otherStatus === "accepted",
}));

jest.mock("../../utils/session", () => ({
    getSession: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ goBack: jest.fn() }),
    useRoute: () => ({ params: { journeyId: 8 } }),
}));

const JOURNEY = {
    id: 8,
    departureAddress: "12 Rue de Rivoli, Paris",
    arrivalAddress: "Gare de Lyon, Paris",
    departureTime: "2026-08-14T15:00:00.000Z",
    arrivalTime: "2026-08-14T16:00:00.000Z",
};

const CONFIRMED_MATCH = {
    foundJourneyId: 1,
    user: { firstname: "Bob", lastname: "Durand", phoneNumber: "0622222222" },
    journey: {
        departureAddress: "10 Rue de Rivoli, Paris",
        arrivalAddress: "Gare de Lyon, Paris",
        departureTime: "2026-08-14T15:00:00.000Z",
        arrivalTime: "2026-08-14T16:00:00.000Z",
    },
    myStatus: "accepted",
    otherStatus: "accepted",
};

describe("JourneyDetailScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getJourney.mockResolvedValue({ success: true, journey: JOURNEY });
        getJourneyMatches.mockResolvedValue({ success: true, matches: [CONFIRMED_MATCH] });
    });

    it("shows the journey details", async () => {
        const { findByText, getAllByText } = render(<JourneyDetailScreen />);

        expect(await findByText("12 Rue de Rivoli, Paris")).toBeTruthy();
        // Same arrival for the user and for the matched companion.
        expect(getAllByText("Gare de Lyon, Paris").length).toBe(2);
        expect(getJourney).toHaveBeenCalledWith({ token: "jwt", journeyId: 8 });
    });

    it("shows the other user of a confirmed journey", async () => {
        const { findByText, getByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Bob Durand")).toBeTruthy();
        expect(getByText("Trajet confirmé")).toBeTruthy();
        expect(getByText("0622222222")).toBeTruthy();
    });

    it("shows the other user's own trip", async () => {
        const { findByText } = render(<JourneyDetailScreen />);

        expect(await findByText("10 Rue de Rivoli, Paris")).toBeTruthy();
    });

    it("tells the user when no accompaniment is confirmed yet", async () => {
        getJourneyMatches.mockResolvedValue({
            success: true,
            matches: [{ ...CONFIRMED_MATCH, myStatus: "waiting", otherStatus: "waiting" }],
        });

        const { findByTestId } = render(<JourneyDetailScreen />);

        expect(await findByTestId("journey-detail-no-match")).toBeTruthy();
    });

    it("shows an error when the journey cannot be loaded", async () => {
        getJourney.mockResolvedValue({ success: false, message: "Ce trajet est introuvable." });

        const { findByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Ce trajet est introuvable.")).toBeTruthy();
    });

    it("asks the user to reconnect when the session is missing", async () => {
        getSession.mockResolvedValue(null);

        const { findByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(getJourney).not.toHaveBeenCalled();
    });
});
