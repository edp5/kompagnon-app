import { apiFetch } from "./api-fetch";

const JOURNEYS_URL = "/api/journeys";

const SESSION_EXPIRED = "Session expirée. Reconnectez-vous.";
const UNREACHABLE = "Une erreur est survenue. Vérifiez votre connexion.";

function messagesUrl(foundJourneyId) {
  return `${JOURNEYS_URL}/found/${foundJourneyId}/messages`;
}

/**
 * Reads the conversation shared with the other user of a match, oldest first.
 * Each message carries a `mine` flag telling who wrote it.
 * @param {{ token: string, foundJourneyId: number }} params
 * @returns {Promise<{ success: boolean, messages?: object[], message?: string }>}
 */
async function getJourneyMessages({ token, foundJourneyId }) {
  try {
    const response = await apiFetch(messagesUrl(foundJourneyId), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, messages: data?.data ?? [] };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    if (response && response.status === 403) {
      return { success: false, message: "Cette conversation ne vous est pas accessible." };
    }
    return { success: false, message: "Impossible de charger la conversation. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Sends a message to the other user of a match.
 * @param {{ token: string, foundJourneyId: number, body: string }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function sendJourneyMessage({ token, foundJourneyId, body }) {
  try {
    const response = await apiFetch(messagesUrl(foundJourneyId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body }),
    });

    if (response && response.ok) {
      return { success: true };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Message non envoyé. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

export { getJourneyMessages, sendJourneyMessage };
