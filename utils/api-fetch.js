import { KOMPAGNON_API_URL } from "@env";

/**
 * Makes a fetch request to the Kompagnon API.
 * @param {string} endpoint - The api endpoint.
 * @param {object} data - The request options (method, headers, body, etc.).
 * @return {Promise<Response>}
 */
async function apiFetch(endpoint, data = {}) {
  return fetch(`${KOMPAGNON_API_URL}${endpoint}`, data);
}

/**
 * Pings the API health endpoint.
 * `cache: "no-store"` keeps the browser from turning this into a conditional
 * request (answered with 304). 2xx and 304 both mean the API is reachable.
 * @returns {Promise<boolean>} true when the API is reachable.
 */
async function checkHealth() {
  try {
    const response = await apiFetch("/api/health", { cache: "no-store" });
    return Boolean(response && response.status >= 200 && response.status < 400);
  } catch {
    return false;
  }
}

export { apiFetch, checkHealth };
