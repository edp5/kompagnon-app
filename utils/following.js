import { apiFetch } from "./api-fetch";

const JOURNEYS_URL = "/api/journeys";

const SESSION_EXPIRED = "Session expirée. Reconnectez-vous.";
const UNREACHABLE = "Une erreur est survenue. Vérifiez votre connexion.";

function foundJourneyUrl(foundJourneyId, suffix) {
  return `${JOURNEYS_URL}/found/${foundJourneyId}/${suffix}`;
}

/**
 * Reports where the user currently is, so their pair (and anyone holding a
 * share link) can follow the journey.
 * @param {{ token: string, foundJourneyId: number, lat: number, lon: number }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function recordPosition({ token, foundJourneyId, lat, lon }) {
  try {
    const response = await apiFetch(foundJourneyUrl(foundJourneyId, "positions"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lat, lon }),
    });

    if (response && response.ok) {
      return { success: true };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Position non partagée. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Reads where each participant of the journey currently is.
 * @param {{ token: string, foundJourneyId: number }} params
 * @returns {Promise<{ success: boolean, positions?: object[], message?: string }>}
 */
async function getPositions({ token, foundJourneyId }) {
  try {
    const response = await apiFetch(foundJourneyUrl(foundJourneyId, "positions"), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, positions: data?.data ?? [] };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible de récupérer les positions." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Creates a link letting someone outside the app follow this journey.
 * @param {{ token: string, foundJourneyId: number }} params
 * @returns {Promise<{ success: boolean, share?: { token: string, url: string, expiresAt: string }, message?: string }>}
 */
async function createShareLink({ token, foundJourneyId }) {
  try {
    const response = await apiFetch(foundJourneyUrl(foundJourneyId, "share"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, share: data?.data };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible de créer le lien de suivi." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

export { createShareLink, getPositions, recordPosition };
