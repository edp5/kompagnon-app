import { fireEvent, render } from "@testing-library/react-native";

import HomeScreen from "../../screens/HomeScreen";
import { checkHealth } from "../../utils/api-fetch";
import { getUpcomingMatchedJourneys } from "../../utils/journeys";
import { getSession } from "../../utils/session";
import { getUserProfile } from "../../utils/users";

jest.mock("../../utils/api-fetch", () => ({ checkHealth: jest.fn() }));
jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));
jest.mock("../../utils/users", () => ({ getUserProfile: jest.fn() }));
jest.mock("../../utils/journeys", () => ({ getUpcomingMatchedJourneys: jest.fn() }));

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

describe("HomeScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        checkHealth.mockResolvedValue(true);
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getUserProfile.mockResolvedValue({ success: true, profile: { firstname: "Alice" } });
        getUpcomingMatchedJourneys.mockResolvedValue({ success: true, journeys: [NEXT_JOURNEY] });
    });

    it("greets the user by their first name", async () => {
        const { findByText } = render(<HomeScreen />);

        expect(await findByText("Bonjour Alice 👋")).toBeTruthy();
    });

    it("reads nothing rather than calling the API without a session", async () => {
        getSession.mockResolvedValue(null);

        const { findByTestId } = render(<HomeScreen />);

        expect(await findByTestId("home-empty")).toBeTruthy();
        expect(getUserProfile).not.toHaveBeenCalled();
        expect(getUpcomingMatchedJourneys).not.toHaveBeenCalled();
    });

    describe("depending on the role", () => {
        it("asks a passenger to request an accompaniment", async () => {
            getUserProfile.mockResolvedValue({
                success: true,
                profile: { firstname: "Alice", role: "passenger" },
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("Demander un accompagnement")).toBeTruthy();
            expect(await findByText("Votre prochain trajet")).toBeTruthy();
        });

        it("asks a companion to offer one instead", async () => {
            // A volunteer opening the app used to be invited to ask for help.
            getUserProfile.mockResolvedValue({
                success: true,
                profile: { firstname: "Léo", role: "companion" },
            });

            const { findByText, queryByText } = render(<HomeScreen />);

            expect(await findByText("Proposer un accompagnement")).toBeTruthy();
            expect(await findByText("Votre prochain accompagnement")).toBeTruthy();
            expect(queryByText("Demander un accompagnement")).toBeNull();
        });

        it("speaks to a companion in their own terms", async () => {
            getUserProfile.mockResolvedValue({
                success: true,
                profile: { firstname: "Léo", role: "companion" },
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("Vos trajets rendent ceux des autres possibles.")).toBeTruthy();
        });

        it("still reads for an account whose role the API has not set", async () => {
            getUserProfile.mockResolvedValue({
                success: true,
                profile: { firstname: "Alice", role: null },
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("Demander un accompagnement")).toBeTruthy();
        });

        it("understands the roles stored on older accounts", async () => {
            // The API still returns "valid" for companions created before it
            // renamed its roles.
            getUserProfile.mockResolvedValue({
                success: true,
                profile: { firstname: "Léo", role: "valid" },
            });

            const { findByText } = render(<HomeScreen />);

            expect(await findByText("Proposer un accompagnement")).toBeTruthy();
        });

        it("tells a companion what an empty week means for them", async () => {
            getUserProfile.mockResolvedValue({
                success: true,
                profile: { firstname: "Léo", role: "companion" },
            });
            getUpcomingMatchedJourneys.mockResolvedValue({ success: true, journeys: [] });

            const { findByText } = render(<HomeScreen />);

            expect(
                await findByText("Aucun accompagnement prévu. Proposez un trajet et nous vous mettrons en relation."),
            ).toBeTruthy();
        });
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

    it("shows an empty state when there is no upcoming journey", async () => {
        getUpcomingMatchedJourneys.mockResolvedValue({ success: true, journeys: [] });

        const { findByTestId } = render(<HomeScreen />);

        expect(await findByTestId("home-empty")).toBeTruthy();
    });
});
