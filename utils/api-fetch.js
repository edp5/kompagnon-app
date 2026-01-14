import { KOMPAGNON_API_URL } from "@env";

/**
 * This function makes a fetch request to the Kompagnon API.
 * @param {string} endpoint - The api endpoint.
 * @param {object} data - The request options (method, headers, body, etc.).
 * @return {Promise<Response>}
 */
async function apiFetch(endpoint, data = {}) {
  return fetch(`${KOMPAGNON_API_URL}${endpoint}`, data);
}

export { apiFetch };
