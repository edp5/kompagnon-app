import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Alert, Linking } from "react-native";

import JourneyDetailScreen from "../../screens/JourneyDetailScreen";
import { getJourney, getJourneyMatches, updateFoundJourneyStatus } from "../../utils/journeys";
import { getSession } from "../../utils/session";

jest.mock("../../utils/journeys", () => {
    const actual = jest.requireActual("../../utils/journeys");
    return {
        getJourney: jest.fn(),
        getJourneyMatches: jest.fn(),
        updateFoundJourneyStatus: jest.fn(),
        // Keep the real state machine so the screen reacts like in production.
        matchState: actual.matchState,
    };
});

jest.mock("../../utils/session", () => ({
    getSession: jest.fn(),
}));

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ goBack: mockGoBack }),
    useRoute: () => ({ params: { journeyId: 8 } }),
}));

const JOURNEY = {
    id: 8,
    departureAddress: "12 Rue de Rivoli, Paris",
    arrivalAddress: "Gare de Lyon, Paris",
    departureTime: "2026-08-14T15:00:00.000Z",
    arrivalTime: "2026-08-14T16:00:00.000Z",
};

const otherJourney = {
    departureAddress: "10 Rue de Rivoli, Paris",
    arrivalAddress: "Gare de Lyon, Paris",
    departureTime: "2026-08-14T15:00:00.000Z",
    arrivalTime: "2026-08-14T16:00:00.000Z",
    departureLat: "48.8600",
    departureLon: "2.3400",
    arrivalLat: "48.8443",
    arrivalLon: "2.3743",
};

const CONFIRMED_MATCH = {
    foundJourneyId: 1,
    user: { firstname: "Bob", lastname: "Durand", phoneNumber: "0622222222" },
    journey: otherJourney,
    myStatus: "accepted",
    otherStatus: "accepted",
};

const PENDING_MATCH = {
    foundJourneyId: 2,
    user: { firstname: "Alice", lastname: "Martin" },
    journey: otherJourney,
    myStatus: "waiting",
    otherStatus: "waiting",
};

const AWAITING_MATCH = {
    foundJourneyId: 3,
    user: { firstname: "Carl", lastname: "Petit" },
    journey: otherJourney,
    myStatus: "accepted",
    otherStatus: "waiting",
};

function mockMatches(matches) {
    getJourneyMatches.mockResolvedValue({ success: true, matches });
}

describe("JourneyDetailScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getJourney.mockResolvedValue({ success: true, journey: JOURNEY });
        mockMatches([CONFIRMED_MATCH]);
        updateFoundJourneyStatus.mockResolvedValue({ success: true });
        jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
        jest.spyOn(Alert, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("shows the journey details", async () => {
        const { findByText, getAllByText } = render(<JourneyDetailScreen />);

        expect(await findByText("12 Rue de Rivoli, Paris")).toBeTruthy();
        // Same arrival for the user and for the matched companion.
        expect(getAllByText("Gare de Lyon, Paris").length).toBe(2);
        expect(getJourney).toHaveBeenCalledWith({ token: "jwt", journeyId: 8 });
    });

    it("shows a confirmed match without exposing the number", async () => {
        const { findByText, getByText, queryByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Bob Durand")).toBeTruthy();
        expect(getByText("Trajet confirmé")).toBeTruthy();
        expect(queryByText("0622222222")).toBeNull();
        expect(getByText("Appeler")).toBeTruthy();
    });

    it("launches a phone call to the pair when tapping the call button", async () => {
        const { findByText } = render(<JourneyDetailScreen />);

        fireEvent.press(await findByText("Appeler"));

        expect(Linking.openURL).toHaveBeenCalledWith("tel:0622222222");
    });

    it("warns when the call cannot be launched", async () => {
        Linking.openURL.mockRejectedValue(new Error("no dialer"));

        const { findByText } = render(<JourneyDetailScreen />);
        fireEvent.press(await findByText("Appeler"));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                "Appel impossible",
                "Impossible de lancer l'appel depuis cet appareil.",
            );
        });
    });

    it("shows a fallback when a confirmed pair has no reachable number", async () => {
        mockMatches([{ ...CONFIRMED_MATCH, user: { firstname: "Bob", lastname: "Durand" } }]);

        const { findByText, queryByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Coordonnées indisponibles pour le moment.")).toBeTruthy();
        expect(queryByText("Appeler")).toBeNull();
    });

    it("offers accept and reject on a match awaiting the user's answer", async () => {
        mockMatches([PENDING_MATCH]);

        const { findByText, getByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Alice Martin")).toBeTruthy();
        expect(getByText("À confirmer")).toBeTruthy();
        expect(getByText("Accepter")).toBeTruthy();
        expect(getByText("Refuser")).toBeTruthy();
    });

    it("accepts a match and reloads", async () => {
        mockMatches([PENDING_MATCH]);

        const { findByText } = render(<JourneyDetailScreen />);
        fireEvent.press(await findByText("Accepter"));

        await waitFor(() => {
            expect(updateFoundJourneyStatus).toHaveBeenCalledWith({ token: "jwt", foundJourneyId: 2, accept: true });
        });
        // Reloaded after the update (initial load + reload).
        expect(getJourneyMatches).toHaveBeenCalledTimes(2);
    });

    it("rejects a match", async () => {
        mockMatches([PENDING_MATCH]);

        const { findByText } = render(<JourneyDetailScreen />);
        fireEvent.press(await findByText("Refuser"));

        await waitFor(() => {
            expect(updateFoundJourneyStatus).toHaveBeenCalledWith({ token: "jwt", foundJourneyId: 2, accept: false });
        });
    });

    it("announces the result to screen readers when responding", async () => {
        mockMatches([PENDING_MATCH]);
        const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});

        const { findByText } = render(<JourneyDetailScreen />);
        fireEvent.press(await findByText("Accepter"));

        await waitFor(() => {
            expect(announce).toHaveBeenCalledWith("Demande acceptée.");
        });
    });

    it("alerts when the update fails", async () => {
        mockMatches([PENDING_MATCH]);
        updateFoundJourneyStatus.mockResolvedValue({ success: false, message: "Impossible de mettre à jour la demande. Réessayez." });

        const { findByText } = render(<JourneyDetailScreen />);
        fireEvent.press(await findByText("Accepter"));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Action impossible", "Impossible de mettre à jour la demande. Réessayez.");
        });
    });

    it("asks the user to reconnect when the session expired while responding", async () => {
        mockMatches([PENDING_MATCH]);
        getSession.mockResolvedValueOnce({ token: "jwt", userId: 12 }).mockResolvedValueOnce(null);

        const { findByText } = render(<JourneyDetailScreen />);
        fireEvent.press(await findByText("Accepter"));

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(updateFoundJourneyStatus).not.toHaveBeenCalled();
    });

    it("shows a waiting note when the user already accepted", async () => {
        mockMatches([AWAITING_MATCH]);

        const { findByText, queryByText } = render(<JourneyDetailScreen />);

        expect(await findByText("Vous avez accepté. En attente de la réponse de l'autre personne.")).toBeTruthy();
        expect(queryByText("Accepter")).toBeNull();
    });

    it("tells the user when there is no match yet", async () => {
        mockMatches([]);

        const { findByTestId } = render(<JourneyDetailScreen />);

        expect(await findByTestId("journey-detail-no-match")).toBeTruthy();
    });

    it("goes back when tapping the back button", async () => {
        const { findByLabelText } = render(<JourneyDetailScreen />);

        fireEvent.press(await findByLabelText("Retour"));

        expect(mockGoBack).toHaveBeenCalled();
    });

    it("shows the itinerary map when the journey has coordinates", async () => {
        getJourney.mockResolvedValue({
            success: true,
            journey: {
                ...JOURNEY,
                departureLat: "48.8558",
                departureLon: "2.3588",
                arrivalLat: "48.8443",
                arrivalLon: "2.3743",
            },
        });

        const { findByLabelText } = render(<JourneyDetailScreen />);

        expect(await findByLabelText(/Carte de l'itinéraire/)).toBeTruthy();
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
