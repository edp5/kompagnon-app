import { apiFetch } from "../../../utils/api-fetch";
import { getUserProfile } from "../../../utils/users";

jest.mock("../../../utils/api-fetch", () => ({
  apiFetch: jest.fn(),
}));

const PROFILE = { userId: 12, firstname: "Alice", lastname: "Martin" };

describe("Unit | Utils | getUserProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads the profile with a bearer token", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: PROFILE }) });

    const result = await getUserProfile({ token: "jwt" });

    expect(apiFetch).toHaveBeenCalledWith("/api/users/profile", {
      headers: { Authorization: "Bearer jwt" },
    });
    expect(result).toEqual({ success: true, profile: PROFILE });
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect(await getUserProfile({ token: "jwt" })).toEqual({
      success: false,
      message: "Session expirée. Reconnectez-vous.",
    });
  });

  it("reports a generic failure on other errors", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await getUserProfile({ token: "jwt" });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Impossible de charger votre profil.");
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await getUserProfile({ token: "jwt" })).success).toBe(false);
  });
});
