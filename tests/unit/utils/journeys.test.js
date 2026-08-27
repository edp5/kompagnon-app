import { apiFetch } from "../../../utils/api-fetch";
import {
  getJourney,
  getJourneyMatches,
  getJourneys,
  getUpcomingMatchedJourneys,
  isConfirmedMatch,
  matchState,
  recordJourney,
  updateFoundJourneyStatus,
} from "../../../utils/journeys";

jest.mock("../../../utils/api-fetch", () => ({
  apiFetch: jest.fn(),
}));

const PAYLOAD = {
  token: "jwt",
  departureAddress: "A",
  arrivalAddress: "B",
  departureLat: 1,
  departureLon: 2,
  arrivalLat: 3,
  arrivalLon: 4,
  departureTime: "2024-01-01T10:00:00.000Z",
  arrivalTime: "2024-01-01T10:30:00.000Z",
};

describe("Unit | Utils | recordJourney", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts the journey with a bearer token and returns the id on success", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { journeyId: 7 } }) });

    const result = await recordJourney(PAYLOAD);

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify({
        departureAddress: "A",
        arrivalAddress: "B",
        departureLat: 1,
        departureLon: 2,
        arrivalLat: 3,
        arrivalLon: 4,
        departureTime: "2024-01-01T10:00:00.000Z",
        arrivalTime: "2024-01-01T10:30:00.000Z",
      }),
    });
    expect(result).toEqual({ success: true, journeyId: 7 });
  });

  it("returns a session message on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect(await recordJourney(PAYLOAD)).toEqual({
      success: false,
      message: "Session expirée. Reconnectez-vous.",
    });
  });

  it("returns a generic message on other failures", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await recordJourney(PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Impossible d'enregistrer le trajet. Réessayez.");
  });

  it("returns a message when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    const result = await recordJourney(PAYLOAD);

    expect(result.success).toBe(false);
  });
});

describe("Unit | Utils | reading journeys", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the journeys of the user", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [{ id: 1 }] }) });

    const result = await getJourneys({ token: "jwt" });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, journeys: [{ id: 1 }] });
  });

  it("reads one journey", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 8 } }) });

    const result = await getJourney({ token: "jwt", journeyId: 8 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/8", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, journey: { id: 8 } });
  });

  it("reports a missing journey on 404", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 404 });

    expect(await getJourney({ token: "jwt", journeyId: 8 })).toEqual({
      success: false,
      message: "Ce trajet est introuvable.",
    });
  });

  it("lists the matches of a journey", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: [{ foundJourneyId: 1 }] }) });

    const result = await getJourneyMatches({ token: "jwt", journeyId: 8 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/8/matches", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, matches: [{ foundJourneyId: 1 }] });
  });
});

describe("Unit | Utils | isConfirmedMatch", () => {
  it("is confirmed only when both sides accepted", () => {
    expect(isConfirmedMatch({ myStatus: "accepted", otherStatus: "accepted" })).toBe(true);
    expect(isConfirmedMatch({ myStatus: "accepted", otherStatus: "waiting" })).toBe(false);
    expect(isConfirmedMatch({ myStatus: "waiting", otherStatus: "accepted" })).toBe(false);
    expect(isConfirmedMatch(undefined)).toBe(false);
  });
});

describe("Unit | Utils | matchState", () => {
  it("is actionable while the user has not answered", () => {
    expect(matchState({ myStatus: "waiting", otherStatus: "waiting" })).toMatchObject({
      actionable: true,
      confirmed: false,
    });
    expect(matchState({ myStatus: "waiting", otherStatus: "accepted" })).toMatchObject({ actionable: true });
  });

  it("is confirmed when both sides accepted", () => {
    expect(matchState({ myStatus: "accepted", otherStatus: "accepted" })).toMatchObject({
      confirmed: true,
      actionable: false,
    });
  });

  it("waits for the other side when the user accepted first", () => {
    const state = matchState({ myStatus: "accepted", otherStatus: "waiting" });
    expect(state).toMatchObject({ actionable: false, confirmed: false });
    expect(state.message).toBeTruthy();
  });
});

describe("Unit | Utils | updateFoundJourneyStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts a match by putting the flag with a bearer token", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    const result = await updateFoundJourneyStatus({ token: "jwt", foundJourneyId: 5, accept: true });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/5", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify({ updatedStatus: true }),
    });
    expect(result).toEqual({ success: true });
  });

  it("sends false when rejecting", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    await updateFoundJourneyStatus({ token: "jwt", foundJourneyId: 6, accept: false });

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/journeys/found/6",
      expect.objectContaining({ body: JSON.stringify({ updatedStatus: false }) }),
    );
  });

  it("returns a session message on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect(await updateFoundJourneyStatus({ token: "jwt", foundJourneyId: 5, accept: true })).toEqual({
      success: false,
      message: "Session expirée. Reconnectez-vous.",
    });
  });

  it("returns a generic message on other failures", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await updateFoundJourneyStatus({ token: "jwt", foundJourneyId: 5, accept: true });

    expect(result.success).toBe(false);
  });
});

describe("Unit | Utils | getUpcomingMatchedJourneys", () => {
  const NOW = new Date("2026-08-13T12:00:00.000Z");

  const future = (id, hours) => ({
    id,
    isMatched: true,
    departureTime: new Date(NOW.getTime() + hours * 3600000).toISOString(),
    arrivalTime: new Date(NOW.getTime() + (hours + 1) * 3600000).toISOString(),
  });

  const accepted = { foundJourneyId: 10, myStatus: "accepted", otherStatus: "accepted", user: { firstname: "Bob" } };
  const waiting = { foundJourneyId: 11, myStatus: "waiting", otherStatus: "waiting" };
  const rejected = { foundJourneyId: 12, myStatus: "rejected", otherStatus: "waiting" };

  function mockApi({ journeys, matchesByJourneyId }) {
    apiFetch.mockImplementation(async (endpoint) => {
      const matchMatches = endpoint.match(/^\/api\/journeys\/(\d+)\/matches$/);
      if (matchMatches) {
        return { ok: true, json: async () => ({ data: matchesByJourneyId[matchMatches[1]] ?? [] }) };
      }
      return { ok: true, json: async () => ({ data: journeys }) };
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps journeys with a confirmed or a pending match, annotated", async () => {
    mockApi({
      journeys: [future(1, 5), future(2, 8)],
      matchesByJourneyId: { 1: [accepted], 2: [waiting] },
    });

    const result = await getUpcomingMatchedJourneys({ token: "jwt", now: NOW });

    expect(result.success).toBe(true);
    expect(result.journeys.map((journey) => journey.id)).toEqual([1, 2]);
    const [confirmed, pending] = result.journeys;
    expect(confirmed.confirmedMatch).toEqual(accepted);
    expect(confirmed.pendingCount).toBe(0);
    expect(pending.confirmedMatch).toBeNull();
    expect(pending.pendingCount).toBe(1);
  });

  it("drops past, unmatched, and only-declined journeys", async () => {
    const past = { ...future(3, -10), isMatched: true };
    const unmatched = { ...future(4, 6), isMatched: false };
    const declinedOnly = { ...future(5, 7), isMatched: true };
    mockApi({
      journeys: [past, unmatched, declinedOnly],
      matchesByJourneyId: { 3: [accepted], 4: [accepted], 5: [rejected] },
    });

    const result = await getUpcomingMatchedJourneys({ token: "jwt", now: NOW });

    expect(result.journeys).toEqual([]);
  });

  it("sorts the journeys by departure time", async () => {
    mockApi({
      journeys: [future(1, 9), future(2, 3)],
      matchesByJourneyId: { 1: [accepted], 2: [accepted] },
    });

    const result = await getUpcomingMatchedJourneys({ token: "jwt", now: NOW });

    expect(result.journeys.map((journey) => journey.id)).toEqual([2, 1]);
  });

  it("propagates a listing failure", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    const result = await getUpcomingMatchedJourneys({ token: "jwt", now: NOW });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Session expirée. Reconnectez-vous.");
  });
});
