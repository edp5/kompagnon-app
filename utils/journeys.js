import { apiFetch } from "./api-fetch";

const JOURNEYS_URL = "/api/journeys";

const SESSION_EXPIRED = "Session expirée. Reconnectez-vous.";
const UNREACHABLE = "Une erreur est survenue. Vérifiez votre connexion.";

/** A match is confirmed once both sides have accepted it. */
const ACCEPTED = "accepted";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

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
    const response = await apiFetch(JOURNEYS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
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
      return { success: true, journeyId: data?.data?.journeyId };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible d'enregistrer le trajet. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Lists the journeys of the authenticated user.
 * @param {{ token: string }} params
 * @returns {Promise<{ success: boolean, journeys?: object[], message?: string }>}
 */
async function getJourneys({ token }) {
  try {
    const response = await apiFetch(JOURNEYS_URL, { headers: authHeaders(token) });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, journeys: data?.data ?? [] };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible de récupérer vos trajets. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Reads one journey of the authenticated user.
 * @param {{ token: string, journeyId: number }} params
 * @returns {Promise<{ success: boolean, journey?: object, message?: string }>}
 */
async function getJourney({ token, journeyId }) {
  try {
    const response = await apiFetch(`${JOURNEYS_URL}/${journeyId}`, { headers: authHeaders(token) });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, journey: data?.data };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    if (response && response.status === 404) {
      return { success: false, message: "Ce trajet est introuvable." };
    }
    return { success: false, message: "Impossible de récupérer le trajet. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Lists the matches of a journey. Each match carries the other user and their
 * side of the trip, plus both acceptance statuses.
 * @param {{ token: string, journeyId: number }} params
 * @returns {Promise<{ success: boolean, matches?: object[], message?: string }>}
 */
async function getJourneyMatches({ token, journeyId }) {
  try {
    const response = await apiFetch(`${JOURNEYS_URL}/${journeyId}/matches`, {
      headers: authHeaders(token),
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, matches: data?.data ?? [] };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible de récupérer les correspondances." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * True when both sides accepted the match.
 * @param {object} match
 * @returns {boolean}
 */
function isConfirmedMatch(match) {
  return match?.myStatus === ACCEPTED && match?.otherStatus === ACCEPTED;
}

/**
 * Upcoming journeys that are confirmed, i.e. matched with a companion (or a
 * passenger) who accepted, sorted by departure time.
 *
 * The API has no "confirmed" filter and the list only carries an `isMatched`
 * flag, which stays true while a match is still pending. Confirmation therefore
 * has to be read from each journey's matches, fetched in parallel.
 *
 * @param {{ token: string, now?: Date }} params
 * @returns {Promise<{ success: boolean, journeys?: object[], message?: string }>}
 */
async function getUpcomingConfirmedJourneys({ token, now = new Date() }) {
  const result = await getJourneys({ token });
  if (!result.success) {
    return result;
  }

  const upcoming = result.journeys.filter((journey) => {
    const arrival = new Date(journey.arrivalTime);
    return !isNaN(arrival.getTime()) && arrival >= now && journey.isMatched;
  });

  const withMatches = await Promise.all(
    upcoming.map(async (journey) => {
      const matches = await getJourneyMatches({ token, journeyId: journey.id });
      const confirmed = (matches.matches ?? []).find(isConfirmedMatch);
      return confirmed ? { ...journey, match: confirmed } : null;
    }),
  );

  const journeys = withMatches
    .filter(Boolean)
    .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

  return { success: true, journeys };
}

export {
  getJourney,
  getJourneyMatches,
  getJourneys,
  getUpcomingConfirmedJourneys,
  isConfirmedMatch,
  recordJourney,
};
