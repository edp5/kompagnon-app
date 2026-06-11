import { KOMPAGNON_API_URL } from "@env";

import { apiFetch, checkHealth } from "../../../utils/api-fetch.js";

global.fetch = jest.fn();

describe("Unit | Utils | apiFetch", () => {
  beforeEach(() => {
    fetch.mockReset();
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("should call fetch with the API url and provided options", async () => {
    const endpoint = "/users";
    const options = { method: "POST", body: JSON.stringify({ name: "John" }) };

    await apiFetch(endpoint, options);

    expect(fetch).toHaveBeenCalledWith(`${KOMPAGNON_API_URL}${endpoint}`, options);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should default options to an empty object", async () => {
    await apiFetch("/status");

    expect(fetch).toHaveBeenCalledWith(`${KOMPAGNON_API_URL}/status`, {});
  });

  it("should propagate fetch errors", async () => {
    fetch.mockRejectedValue(new Error("Network Error"));

    await expect(apiFetch("/error")).rejects.toThrow("Network Error");
  });

  describe("checkHealth", () => {
    it("returns true when the API answers with HTTP 200", async () => {
      fetch.mockResolvedValue({ status: 200 });

      expect(await checkHealth()).toBe(true);
    });

    it("returns true on a 304 (cached / not modified) response", async () => {
      fetch.mockResolvedValue({ status: 304 });

      expect(await checkHealth()).toBe(true);
    });

    it("returns false on a 4xx/5xx response", async () => {
      fetch.mockResolvedValue({ status: 503 });

      expect(await checkHealth()).toBe(false);
    });

    it("returns false when the request throws", async () => {
      fetch.mockRejectedValue(new Error("Network Error"));

      expect(await checkHealth()).toBe(false);
    });
  });
});
