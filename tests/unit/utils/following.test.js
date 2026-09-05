import { apiFetch } from "../../../utils/api-fetch";
import { createShareLink, getPositions, recordPosition } from "../../../utils/following";

jest.mock("../../../utils/api-fetch", () => ({
  apiFetch: jest.fn(),
}));

describe("Unit | Utils | recordPosition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports the position of the user", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    const result = await recordPosition({ token: "jwt", foundJourneyId: 3, lat: 48.85, lon: 2.35 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/3/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify({ lat: 48.85, lon: 2.35 }),
    });
    expect(result).toEqual({ success: true });
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await recordPosition({ token: "jwt", foundJourneyId: 3, lat: 1, lon: 2 })).message).toBe(
      "Session expirée. Reconnectez-vous.",
    );
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await recordPosition({ token: "jwt", foundJourneyId: 3, lat: 1, lon: 2 })).success).toBe(false);
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await recordPosition({ token: "jwt", foundJourneyId: 3, lat: 1, lon: 2 })).success).toBe(false);
  });
});

describe("Unit | Utils | getPositions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads where each participant is", async () => {
    const positions = [{ lat: "48.85", lon: "2.35", mine: true, firstname: "Alice" }];
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: positions }) });

    const result = await getPositions({ token: "jwt", foundJourneyId: 3 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/3/positions", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, positions });
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await getPositions({ token: "jwt", foundJourneyId: 3 })).success).toBe(false);
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await getPositions({ token: "jwt", foundJourneyId: 3 })).success).toBe(false);
  });
});

describe("Unit | Utils | createShareLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates the link to follow the journey", async () => {
    const share = { token: "abc", url: "http://web/#/suivi/abc", expiresAt: "2026-09-06T00:00:00.000Z" };
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: share }) });

    const result = await createShareLink({ token: "jwt", foundJourneyId: 3 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/3/share", {
      method: "POST",
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, share });
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await createShareLink({ token: "jwt", foundJourneyId: 3 })).message).toBe(
      "Impossible de créer le lien de suivi.",
    );
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await createShareLink({ token: "jwt", foundJourneyId: 3 })).success).toBe(false);
  });
});
