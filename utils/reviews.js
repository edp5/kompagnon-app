import { apiFetch } from "./api-fetch";

const SESSION_EXPIRED = "Session expirée. Reconnectez-vous.";
const UNREACHABLE = "Une erreur est survenue. Vérifiez votre connexion.";

/**
 * Builds the review endpoint of a journey.
 * @param {number} foundJourneyId - The journey.
 * @returns {string} The path.
 */
function reviewUrl(foundJourneyId) {
  return `/api/journeys/found/${foundJourneyId}/review`;
}

/**
 * Records what the user thought of a journey they travelled. Sending it again
 * replaces what they wrote rather than adding a second review.
 * @param {{ token: string, foundJourneyId: number, rating: number, comment?: string|null }} params
 * @returns {Promise<{ success: boolean, review?: object, message?: string }>}
 */
async function reviewJourney({ token, foundJourneyId, rating, comment = null }) {
  try {
    const response = await apiFetch(reviewUrl(foundJourneyId), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating, comment }),
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, review: data?.data };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    if (response && response.status === 409) {
      return {
        success: false,
        message: "Vous pourrez donner votre avis une fois le trajet terminé.",
      };
    }
    return { success: false, message: "Impossible d'enregistrer votre avis." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * The review the user already left on a journey, so the app can offer to change
 * it rather than asking again.
 * @param {{ token: string, foundJourneyId: number }} params
 * @returns {Promise<{ success: boolean, review?: object|null, message?: string }>}
 */
async function getMyJourneyReview({ token, foundJourneyId }) {
  try {
    const response = await apiFetch(reviewUrl(foundJourneyId), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, review: data?.data ?? null };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible de récupérer votre avis." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

export { getMyJourneyReview, reviewJourney };
