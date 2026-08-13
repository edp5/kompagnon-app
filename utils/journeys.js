import { apiFetch } from "./api-fetch";

/**
 * Records a journey for the authenticated user. The API stores it as a passenger
 * or companion journey (depending on the user's role) and uses it for matching.
 * Coordinates must be resolved beforehand (see utils/location).
 *
 * @param {object}  params
 * @param {string}  params.token            - Bearer token of the authenticated user.
 * @param {string}  params.departureAddress
 * @param {string}  params.arrivalAddress
 * @param {number}  params.departureLat
 * @param {number}  params.departureLon
 * @param {number}  params.arrivalLat
 * @param {number}  params.arrivalLon
 * @param {string}  params.departureTime    - ISO date-time.
 * @param {string}  params.arrivalTime      - ISO date-time.
 * @returns {Promise<{ success: boolean, journeyId?: number, message?: string }>}
 */
async function recordJourney({
  token,
  departureAddress,
  arrivalAddress,
  departureLat,
  departureLon,
  arrivalLat,
  arrivalLon,
  departureTime,
  arrivalTime,
}) {
  try {
    const response = await apiFetch("/api/journeys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        departureAddress,
        arrivalAddress,
        departureLat,
        departureLon,
        arrivalLat,
        arrivalLon,
        departureTime,
        arrivalTime,
      }),
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, journeyId: data?.data };
    }
    if (response && response.status === 401) {
      return { success: false, message: "Session expirée. Reconnectez-vous." };
    }
    return { success: false, message: "Impossible d'enregistrer le trajet. Réessayez." };
  } catch {
    return { success: false, message: "Une erreur est survenue. Vérifiez votre connexion." };
  }
}

export { recordJourney };
