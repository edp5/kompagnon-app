import { apiFetch } from "../../../utils/api-fetch";
import { recordJourney } from "../../../utils/journeys";

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
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: 7 }) });

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
