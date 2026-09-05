import { apiFetch } from "../../../utils/api-fetch";
import { getUserProfile, setTrustedContact } from "../../../utils/users";

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

describe("Unit | Utils | setTrustedContact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records the contact and gives it back", async () => {
    const trustedContact = { name: "Camille", phoneNumber: "0612345678" };
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { trustedContact } }) });

    const result = await setTrustedContact({ token: "jwt", ...trustedContact });

    expect(apiFetch).toHaveBeenCalledWith("/api/users/trusted-contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify(trustedContact),
    });
    expect(result).toEqual({ success: true, trustedContact });
  });

  it("clears the contact when nothing is given", async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { trustedContact: null } }) });

    const result = await setTrustedContact({ token: "jwt" });

    expect(apiFetch).toHaveBeenCalledWith("/api/users/trusted-contact", expect.objectContaining({
      body: JSON.stringify({ name: null, phoneNumber: null }),
    }));
    expect(result).toEqual({ success: true, trustedContact: null });
  });

  it("says the number was refused rather than blaming the network", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 400 });

    const result = await setTrustedContact({ token: "jwt", phoneNumber: "12345" });

    expect(result.message).toBe("Ce numéro n'est pas un mobile français valide.");
  });

  it("reports an expired session on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    expect((await setTrustedContact({ token: "jwt" })).message).toBe("Session expirée. Reconnectez-vous.");
  });

  it("reports a generic failure on other errors", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await setTrustedContact({ token: "jwt" })).message).toBe("Impossible d'enregistrer ce contact.");
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await setTrustedContact({ token: "jwt" })).success).toBe(false);
  });
});
