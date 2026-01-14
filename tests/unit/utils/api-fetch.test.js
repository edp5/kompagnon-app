import { KOMPAGNON_API_URL } from "@env";

import { apiFetch } from "../../../utils/api-fetch.js";

global.fetch = jest.fn();

describe("Unit | Utils | apiFetch", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("should call fetch with url and provided options", async () => {
    // given
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: "success" }),
    });
    const endpoint = "/users";
    const options = { method: "POST", body: JSON.stringify({ name: "John" }) };

    // when
    await apiFetch(endpoint, options);

    // then
    expect(fetch).toHaveBeenCalledWith(`${KOMPAGNON_API_URL}${endpoint}`, options);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should function if data is empty", async () => {
    // given
    fetch.mockResolvedValue({ ok: true });
    const endpoint = "/status";

    // when
    await apiFetch(endpoint);

    // then
    expect(fetch).toHaveBeenCalledWith(`${KOMPAGNON_API_URL}${endpoint}`, {});
  });

  it("should return error if an error occurred", async () => {
    // given
    fetch.mockRejectedValue(new Error("Network Error"));

    // when & then
    await expect(apiFetch("/error")).rejects.toThrow("Network Error");
  });
});
