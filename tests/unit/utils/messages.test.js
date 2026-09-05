import { apiFetch } from "../../../utils/api-fetch";
import { getJourneyMessages, sendJourneyMessage } from "../../../utils/messages";

jest.mock("../../../utils/api-fetch", () => ({
  apiFetch: jest.fn(),
}));

const CONVERSATION = [
  { id: 1, body: "Bonjour !", sentAt: "2026-09-05T10:00:00.000Z", mine: true, author: { firstname: "Alice" } },
];

describe("Unit | Utils | getJourneyMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads the conversation of a match", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: CONVERSATION }) });

    const result = await getJourneyMessages({ token: "jwt", foundJourneyId: 7 });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/7/messages", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, messages: CONVERSATION });
  });

  it("explains that the conversation is not the user's on 403", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 403 });

    expect(await getJourneyMessages({ token: "jwt", foundJourneyId: 7 })).toEqual({
      success: false,
      message: "Cette conversation ne vous est pas accessible.",
    });
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await getJourneyMessages({ token: "jwt", foundJourneyId: 7 })).message).toBe(
      "Session expirée. Reconnectez-vous.",
    );
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await getJourneyMessages({ token: "jwt", foundJourneyId: 7 })).success).toBe(false);
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await getJourneyMessages({ token: "jwt", foundJourneyId: 7 })).success).toBe(false);
  });
});

describe("Unit | Utils | sendJourneyMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts the message", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    const result = await sendJourneyMessage({ token: "jwt", foundJourneyId: 7, body: "Bonjour" });

    expect(apiFetch).toHaveBeenCalledWith("/api/journeys/found/7/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify({ body: "Bonjour" }),
    });
    expect(result).toEqual({ success: true });
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await sendJourneyMessage({ token: "jwt", foundJourneyId: 7, body: "x" })).message).toBe(
      "Session expirée. Reconnectez-vous.",
    );
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await sendJourneyMessage({ token: "jwt", foundJourneyId: 7, body: "x" })).success).toBe(false);
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await sendJourneyMessage({ token: "jwt", foundJourneyId: 7, body: "x" })).success).toBe(false);
  });
});
