import { apiFetch } from "./api-fetch";

const JOURNEYS_URL = "/api/journeys";

const SESSION_EXPIRED = "Session expirée. Reconnectez-vous.";
const UNREACHABLE = "Une erreur est survenue. Vérifiez votre connexion.";

/** Match statuses shared with the API (see JOURNEY_STATUS). */
const ACCEPTED = "accepted";
const WAITING = "waiting";
const REJECTED = "rejected";

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
 * Describes what the user can do with a match, mirroring the web behaviour.
 * - "actionable": the user still has to accept or reject it.
 * - "confirmed": both sides accepted.
 * - "awaiting-other": the user accepted and waits for the other side.
 * @param {object} match
 * @returns {{ status: string, actionable: boolean, confirmed: boolean, message: string|null }}
 */
function matchState(match) {
  if (match?.myStatus === WAITING) {
    return { status: "actionable", actionable: true, confirmed: false, message: null };
  }
  if (isConfirmedMatch(match)) {
    return { status: "confirmed", actionable: false, confirmed: true, message: null };
  }
  return {
    status: "awaiting-other",
    actionable: false,
    confirmed: false,
    message: "Vous avez accepté. En attente de la réponse de l'autre personne.",
  };
}

/**
 * Accepts or rejects a match on behalf of the authenticated user. The API infers
 * the side (passenger or companion) from the user's role, so the client only
 * says whether it accepts.
 * @param {{ token: string, foundJourneyId: number, accept: boolean }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function updateFoundJourneyStatus({ token, foundJourneyId, accept }) {
  try {
    const response = await apiFetch(`${JOURNEYS_URL}/found/${foundJourneyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ updatedStatus: accept }),
    });

    if (response && response.ok) {
      return { success: true };
    }
    if (response && response.status === 401) {
      return { success: false, message: SESSION_EXPIRED };
    }
    return { success: false, message: "Impossible de mettre à jour la demande. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Upcoming journeys that have at least one live match (pending or confirmed),
 * sorted by departure time. Each journey carries its non-declined `matches`, the
 * `confirmedMatch` if any, and a `pendingCount` of matches awaiting the user's
 * answer, so the list can flag journeys that need action.
 *
 * The list endpoint only carries an `isMatched` flag (true even while a match is
 * pending), so the matches are fetched per journey in parallel.
 *
 * @param {{ token: string, now?: Date }} params
 * @returns {Promise<{ success: boolean, journeys?: object[], message?: string }>}
 */
async function getMatchedJourneys({ token, now = new Date(), past = false }) {
  const result = await getJourneys({ token });
  if (!result.success) {
    return result;
  }

  const upcoming = result.journeys.filter((journey) => {
    const arrival = new Date(journey.arrivalTime);
    if (isNaN(arrival.getTime()) || !journey.isMatched) {
      return false;
    }
    return past ? arrival < now : arrival >= now;
  });

  const withMatches = await Promise.all(
    upcoming.map(async (journey) => {
      const matchesResult = await getJourneyMatches({ token, journeyId: journey.id });
      const matches = (matchesResult.matches ?? []).filter(
        (match) => match?.myStatus !== REJECTED && match?.otherStatus !== REJECTED,
      );
      if (matches.length === 0) {
        return null;
      }
      const confirmedMatch = matches.find(isConfirmedMatch) ?? null;
      const pendingCount = matches.filter((match) => match?.myStatus === WAITING).length;
      return { ...journey, matches, confirmedMatch, pendingCount };
    }),
  );

  const journeys = withMatches
    .filter(Boolean)
    // Upcoming trips read soonest first; past ones read most recent first.
    .sort((a, b) => (past
      ? new Date(b.departureTime) - new Date(a.departureTime)
      : new Date(a.departureTime) - new Date(b.departureTime)));

  return { success: true, journeys };
}

/**
 * Upcoming journeys that still have a live match, soonest first.
 * @param {{ token: string, now?: Date }} params
 * @returns {Promise<{ success: boolean, journeys?: object[], message?: string }>}
 */
async function getUpcomingMatchedJourneys({ token, now = new Date() }) {
  return getMatchedJourneys({ token, now, past: false });
}

/**
 * Journeys already travelled, most recent first, so the user keeps a history.
 * @param {{ token: string, now?: Date }} params
 * @returns {Promise<{ success: boolean, journeys?: object[], message?: string }>}
 */
async function getPastMatchedJourneys({ token, now = new Date() }) {
  return getMatchedJourneys({ token, now, past: true });
}

export {
  getJourney,
  getJourneyMatches,
  getJourneys,
  getPastMatchedJourneys,
  getUpcomingMatchedJourneys,
  isConfirmedMatch,
  matchState,
  recordJourney,
  updateFoundJourneyStatus,
};
