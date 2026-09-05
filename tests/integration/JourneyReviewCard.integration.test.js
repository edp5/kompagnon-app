import { fireEvent, render, waitFor } from "@testing-library/react-native";

import JourneyReviewCard from "../../components/JourneyReviewCard";
import { getMyJourneyReview, reviewJourney } from "../../utils/reviews";
import { getSession } from "../../utils/session";

jest.mock("../../utils/reviews", () => ({
    getMyJourneyReview: jest.fn(),
    reviewJourney: jest.fn(),
}));
jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));

describe("JourneyReviewCard — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getMyJourneyReview.mockResolvedValue({ success: true, review: null });
        reviewJourney.mockResolvedValue({ success: true });
    });

    it("asks for a rating when nothing has been written", async () => {
        const { findByTestId } = render(<JourneyReviewCard foundJourneyId={3} otherName="Léo" />);

        expect(await findByTestId("review-rating")).toBeTruthy();
    });

    it("records the rating and the comment", async () => {
        const { findByTestId, getByTestId } = render(<JourneyReviewCard foundJourneyId={3} otherName="Léo" />);
        fireEvent.press(await findByTestId("review-rating-star-4"));
        fireEvent.changeText(getByTestId("review-comment"), "Très rassurant.");
        fireEvent.press(getByTestId("review-save"));

        await waitFor(() => {
            expect(reviewJourney).toHaveBeenCalledWith({
                token: "jwt",
                foundJourneyId: 3,
                rating: 4,
                comment: "Très rassurant.",
            });
        });
    });

    it("sends no comment rather than an empty one", async () => {
        const { findByTestId, getByTestId } = render(<JourneyReviewCard foundJourneyId={3} />);
        fireEvent.press(await findByTestId("review-rating-star-5"));
        fireEvent.press(getByTestId("review-save"));

        await waitFor(() => {
            expect(reviewJourney).toHaveBeenCalledWith(expect.objectContaining({ comment: null }));
        });
    });

    it("refuses to save without a rating", async () => {
        const { findByTestId, getByTestId, findByText } = render(<JourneyReviewCard foundJourneyId={3} />);
        fireEvent.press(await findByTestId("review-save"));

        expect(await findByText("Choisissez une note avant d'enregistrer.")).toBeTruthy();
        expect(reviewJourney).not.toHaveBeenCalled();
        expect(getByTestId("review-rating")).toBeTruthy();
    });

    it("shows the review already written instead of asking again", async () => {
        getMyJourneyReview.mockResolvedValue({
            success: true,
            review: { rating: 4, comment: "Très rassurant.", updatedAt: "2026-09-05T10:00:00.000Z" },
        });

        const { findByTestId, queryByTestId, getByText } = render(<JourneyReviewCard foundJourneyId={3} />);

        expect(await findByTestId("review-given")).toBeTruthy();
        expect(getByText("Très rassurant.")).toBeTruthy();
        expect(queryByTestId("review-rating")).toBeNull();
    });

    it("lets the author change their mind, starting from what they wrote", async () => {
        getMyJourneyReview.mockResolvedValue({
            success: true,
            review: { rating: 2, comment: "Bof.", updatedAt: "2026-09-05T10:00:00.000Z" },
        });

        const { findByTestId, getByTestId } = render(<JourneyReviewCard foundJourneyId={3} />);
        fireEvent.press(await findByTestId("review-edit"));

        expect(getByTestId("review-comment").props.value).toBe("Bof.");
        fireEvent.press(getByTestId("review-rating-star-5"));
        fireEvent.press(getByTestId("review-save"));

        await waitFor(() => {
            expect(reviewJourney).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
        });
    });

    it("says why the review could not be saved", async () => {
        reviewJourney.mockResolvedValue({
            success: false,
            message: "Vous pourrez donner votre avis une fois le trajet terminé.",
        });

        const { findByTestId, getByTestId, findByText } = render(<JourneyReviewCard foundJourneyId={3} />);
        fireEvent.press(await findByTestId("review-rating-star-3"));
        fireEvent.press(getByTestId("review-save"));

        expect(await findByText("Vous pourrez donner votre avis une fois le trajet terminé.")).toBeTruthy();
    });

    it("asks the user to reconnect when the session expired", async () => {
        const { findByTestId, getByTestId, findByText } = render(<JourneyReviewCard foundJourneyId={3} />);
        fireEvent.press(await findByTestId("review-rating-star-3"));
        getSession.mockResolvedValue(null);
        fireEvent.press(getByTestId("review-save"));

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(reviewJourney).not.toHaveBeenCalled();
    });

    it("reads nothing without a session", async () => {
        getSession.mockResolvedValue(null);

        const { findByTestId } = render(<JourneyReviewCard foundJourneyId={3} />);
        await findByTestId("journey-review");

        expect(getMyJourneyReview).not.toHaveBeenCalled();
    });
});
