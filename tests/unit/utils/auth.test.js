import { activateAccount, requestPasswordReset, resetPassword } from "../../../utils/auth";
import { apiFetch } from "../../../utils/api-fetch";

jest.mock("../../../utils/api-fetch", () => ({
  apiFetch: jest.fn(),
}));

describe("Unit | Utils | requestPasswordReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts the email to the forgot-password endpoint", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    const result = await requestPasswordReset({ email: "alice@exemple.com" });

    expect(apiFetch).toHaveBeenCalledWith("/api/authentication/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alice@exemple.com" }),
    });
    expect(result).toEqual({ success: true });
  });

  it("reports a failure when the API refuses", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await requestPasswordReset({ email: "alice@exemple.com" });

    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await requestPasswordReset({ email: "a@b.c" })).success).toBe(false);
  });
});

describe("Unit | Utils | resetPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts the token and the new password", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    const result = await resetPassword({ token: "abc", password: "nouveau123" });

    expect(apiFetch).toHaveBeenCalledWith("/api/authentication/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "abc", password: "nouveau123" }),
    });
    expect(result).toEqual({ success: true });
  });

  it("explains that the link is invalid or expired on 400", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 400 });

    const result = await resetPassword({ token: "old", password: "x" });

    expect(result).toEqual({
      success: false,
      message: "Ce lien est invalide ou expiré. Demandez-en un nouveau.",
    });
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await resetPassword({ token: "t", password: "p" })).success).toBe(false);
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await resetPassword({ token: "t", password: "p" })).success).toBe(false);
  });
});

describe("Unit | Utils | activateAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends the phone number and role with the token as a bearer", async () => {
    apiFetch.mockResolvedValue({ ok: true });

    const result = await activateAccount({ token: "jwt", phoneNumber: "0612345678", role: "passenger" });

    expect(apiFetch).toHaveBeenCalledWith("/api/authentication/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer jwt" },
      body: JSON.stringify({ phoneNumber: "0612345678", role: "passenger" }),
    });
    expect(result).toEqual({ success: true });
  });

  it("explains that the activation link is invalid on 401", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 401 });

    const result = await activateAccount({ token: "bad", phoneNumber: "0612345678", role: "passenger" });

    expect(result).toEqual({
      success: false,
      message: "Ce lien d'activation est invalide ou expiré.",
    });
  });

  it("reports a generic failure otherwise", async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500 });

    expect((await activateAccount({ token: "t", phoneNumber: "0612345678", role: "companion" })).success).toBe(false);
  });

  it("reports a failure when the request throws", async () => {
    apiFetch.mockRejectedValue(new Error("network"));

    expect((await activateAccount({ token: "t", phoneNumber: "0612345678", role: "passenger" })).success).toBe(false);
  });
});
