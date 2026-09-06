import { apiFetch } from "../../../utils/api-fetch";
import { getMyJourneyReview, reviewJourney } from "../../../utils/reviews";

jest.mock("../../../utils/api-fetch", () => ({
  apiFetch: jest.fn(),
}));

describe("Unit | Utils | reviewJourney", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends the rating and the comment", async () => {
    const review = { rating: 4, comment: "Très rassurant." };
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: review }) });

    const result = await reviewJourney({ token: "jwt", foundJourneyId: 3, ...review });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/3/review", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify(review),
    });
    expect(result).toEqual({ success: true, review });
  });

  it("explains a journey cannot be reviewed before it happened", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 409 });

    const result = await reviewJourney({ token: "jwt", foundJourneyId: 3, rating: 5 });

    expect(result.message).toBe("Vous pourrez donner votre avis une fois le trajet terminé.");
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await reviewJourney({ token: "jwt", foundJourneyId: 3, rating: 5 })).message).toBe(
      "Session expirée. Reconnectez-vous.",
    );
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await reviewJourney({ token: "jwt", foundJourneyId: 3, rating: 5 })).message).toBe(
      "Impossible d'enregistrer votre avis.",
    );
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await reviewJourney({ token: "jwt", foundJourneyId: 3, rating: 5 })).success).toBe(false);
  });
});

describe("Unit | Utils | getMyJourneyReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the review already written", async () => {
    const review = { rating: 4, comment: null, updatedAt: "2026-09-05T10:00:00.000Z" };
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: review }) });

    const result = await getMyJourneyReview({ token: "jwt", foundJourneyId: 3 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/3/review", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, review });
  });

  it("returns nothing when the user has not reviewed the journey", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: null }) });

    expect(await getMyJourneyReview({ token: "jwt", foundJourneyId: 3 })).toEqual({
      success: true,
      review: null,
    });
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await getMyJourneyReview({ token: "jwt", foundJourneyId: 3 })).message).toBe(
      "Session expirée. Reconnectez-vous.",
    );
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await getMyJourneyReview({ token: "jwt", foundJourneyId: 3 })).message).toBe(
      "Impossible de récupérer votre avis.",
    );
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await getMyJourneyReview({ token: "jwt", foundJourneyId: 3 })).success).toBe(false);
  });
});
