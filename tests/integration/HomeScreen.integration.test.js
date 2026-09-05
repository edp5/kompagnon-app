import { fireEvent, render } from "@testing-library/react-native";

import HomeScreen from "../../screens/HomeScreen";
import { checkHealth } from "../../utils/api-fetch";
import { getHomeOverview } from "../../utils/journeys";
import { getSession } from "../../utils/session";
import { getUserProfile } from "../../utils/users";

jest.mock("../../utils/api-fetch", () => ({ checkHealth: jest.fn() }));
jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));
jest.mock("../../utils/users", () => ({ getUserProfile: jest.fn() }));
jest.mock("../../utils/journeys", () => ({ getHomeOverview: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (callback) => {
        const React = require("react");
        React.useEffect(callback, [callback]);
    },
}));

const NEXT_JOURNEY = {
    id: 8,
    departureAddress: "12 Rue de Rivoli, Paris",
    arrivalAddress: "Gare de Lyon, Paris",
    departureTime: "2026-09-05T15:00:00.000Z",
    arrivalTime: "2026-09-05T16:00:00.000Z",
    confirmedMatch: { user: { firstname: "Bob" } },
    pendingCount: 0,
};

const overview = (extra = {}) => ({
    ongoing: null,
    next: NEXT_JOURNEY,
    pending: [],
    searching: [],
    upcomingCount: 1,
    ...extra,
});

describe("HomeScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        checkHealth.mockResolvedValue(true);
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getUserProfile.mockResolvedValue({ success: true, profile: { firstname: "Alice" } });
        getHomeOverview.mockResolvedValue({ success: true, overview: overview() });
    });

    it("greets the user by their first name", async () => {
        const { findByText } = render(<HomeScreen />);

        expect(await findByText("Bonjour Alice 👋")).toBeTruthy();
    });

    it("shows the API connection status", async () => {
        const { findByLabelText } = render(<HomeScreen />);

        expect(await findByLabelText("API connectée")).toBeTruthy();
    });

    it("shows the offline status when the health check fails", async () => {
        checkHealth.mockResolvedValue(false);

        const { findByLabelText } = render(<HomeScreen />);

        expect(await findByLabelText("API injoignable")).toBeTruthy();
    });

    it("navigates to the journey form from the main action", async () => {
        const { findByText } = render(<HomeScreen />);
        fireEvent.press(await findByText("Demander un accompagnement"));

        expect(mockNavigate).toHaveBeenCalledWith("RecordJourney");
    });

    it("shows the next journey and opens its detail", async () => {
        const { findByText } = render(<HomeScreen />);

        expect(await findByText("12 Rue de Rivoli, Paris")).toBeTruthy();
        fireEvent.press(await findByText("Gare de Lyon, Paris"));

        expect(mockNavigate).toHaveBeenCalledWith("JourneyDetail", { journeyId: 8 });
    });

    it("sums up how many journeys are coming", async () => {
        getHomeOverview.mockResolvedValue({
            success: true,
            overview: overview({ upcomingCount: 3 }),
        });

        const { findByText } = render(<HomeScreen />);

        expect(await findByText("3 trajets à venir.")).toBeTruthy();
    });

    it("shows an empty state when there is no upcoming journey", async () => {
        getHomeOverview.mockResolvedValue({
            success: true,
            overview: overview({ next: null, upcomingCount: 0 }),
        });

        const { findByTestId } = render(<HomeScreen />);

        expect(await findByTestId("home-empty")).toBeTruthy();
    });

    it("reads nothing rather than calling the API without a session", async () => {
        getSession.mockResolvedValue(null);

        const { findByTestId } = render(<HomeScreen />);

        expect(await findByTestId("home-empty")).toBeTruthy();
        expect(getHomeOverview).not.toHaveBeenCalled();
    });

    it("falls back to an empty home when the journeys cannot be read", async () => {
        getHomeOverview.mockResolvedValue({ success: false, message: "Session expirée." });

        const { findByTestId } = render(<HomeScreen />);

        expect(await findByTestId("home-empty")).toBeTruthy();
    });

    describe("a journey being travelled", () => {
        const ONGOING = {
            ...NEXT_JOURNEY,
            id: 4,
            departureAddress: "Place d'Italie",
            arrivalAddress: "Gare du Nord",
        };

        it("is shown first and opens the journey to follow it", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ ongoing: ONGOING, next: null }),
            });

            const { findByTestId } = render(<HomeScreen />);
            fireEvent.press(await findByTestId("home-ongoing"));

            expect(mockNavigate).toHaveBeenCalledWith("JourneyDetail", { journeyId: 4 });
        });

        it("names who the user is travelling with", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ ongoing: ONGOING, next: null }),
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("Avec Bob")).toBeTruthy();
        });

        it("replaces the next-journey section rather than contradicting it", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ ongoing: ONGOING, next: null }),
            });

            const { queryByText, findByTestId } = render(<HomeScreen />);
            await findByTestId("home-ongoing");

            expect(queryByText("Votre prochain trajet")).toBeNull();
            expect(queryByText("Aucun trajet à venir. Demandez un accompagnement pour commencer.")).toBeNull();
        });

        it("still shows the next journey when another one follows", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ ongoing: ONGOING, next: NEXT_JOURNEY, upcomingCount: 2 }),
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("Votre prochain trajet")).toBeTruthy();
        });

        it("is absent while no journey is under way", async () => {
            const { queryByTestId, findByText } = render(<HomeScreen />);
            await findByText("Bonjour Alice 👋");

            expect(queryByTestId("home-ongoing")).toBeNull();
        });
    });

    describe("requests waiting for an answer", () => {
        const AWAITING = { ...NEXT_JOURNEY, id: 9, confirmedMatch: null, pendingCount: 2 };

        it("are listed and open the journey to answer them", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ pending: [AWAITING] }),
            });

            const { findByText } = render(<HomeScreen />);
            fireEvent.press(await findByText("2 demandes en attente"));

            expect(mockNavigate).toHaveBeenCalledWith("JourneyDetail", { journeyId: 9 });
        });

        it("read in the singular for a lone request", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ pending: [{ ...AWAITING, pendingCount: 1 }] }),
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("1 demande en attente")).toBeTruthy();
        });

        it("are absent when nothing waits for the user", async () => {
            const { queryByTestId, findByText } = render(<HomeScreen />);
            await findByText("Bonjour Alice 👋");

            expect(queryByTestId("home-pending")).toBeNull();
        });
    });

    describe("journeys still looking for someone", () => {
        const SEARCHING = {
            id: 12,
            departureAddress: "Bastille",
            arrivalAddress: "Nation",
            departureTime: "2026-09-06T09:00:00.000Z",
            arrivalTime: "2026-09-06T09:40:00.000Z",
        };

        it("are listed instead of being hidden", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ next: null, searching: [SEARCHING], upcomingCount: 1 }),
            });

            const { findByTestId, findByText } = render(<HomeScreen />);

            expect(await findByTestId("home-searching")).toBeTruthy();
            fireEvent.press(await findByText("Bastille → Nation"));
            expect(mockNavigate).toHaveBeenCalledWith("JourneyDetail", { journeyId: 12 });
        });

        it("change what the empty state says, since a journey does exist", async () => {
            getHomeOverview.mockResolvedValue({
                success: true,
                overview: overview({ next: null, searching: [SEARCHING], upcomingCount: 1 }),
            });

            const { findByText } = render(<HomeScreen />);

            expect(
                await findByText("Aucun accompagnement confirmé pour l'instant. Vos demandes sont en cours de recherche."),
            ).toBeTruthy();
        });

        it("are absent when every journey found someone", async () => {
            const { queryByTestId, findByText } = render(<HomeScreen />);
            await findByText("Bonjour Alice 👋");

            expect(queryByTestId("home-searching")).toBeNull();
        });
    });

    describe("shortcuts", () => {
        it("open the other screens of the app", async () => {
            const { findByLabelText } = render(<HomeScreen />);

            fireEvent.press(await findByLabelText("Mes trajets"));
            expect(mockNavigate).toHaveBeenCalledWith("Journeys");

            fireEvent.press(await findByLabelText("Mon profil"));
            expect(mockNavigate).toHaveBeenCalledWith("Profile");

            fireEvent.press(await findByLabelText("Aide"));
            expect(mockNavigate).toHaveBeenCalledWith("Help");

            fireEvent.press(await findByLabelText("À propos"));
            expect(mockNavigate).toHaveBeenCalledWith("About");
        });
    });
});
