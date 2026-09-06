import { ORS_API_KEY } from "@env";

// Walking, deliberately. The wheelchair profile avoids stairs and kerbs, which
// is the right call for a wheelchair user and the wrong one here: a blind
// passenger walks with a guide, and routing them hundreds of metres around a
// staircase they can climb on someone's arm makes the journey worse, not safer.
// When the app serves users with a mobility impairment, this becomes a choice
// driven by their declared needs rather than a constant.
const PROFILE = "foot-walking";
const DIRECTIONS_URL = `https://api.openrouteservice.org/v2/directions/${PROFILE}`;

// A route is a nicety: the trip is still readable as a straight line, so
// nothing waits on the routing service for long.
const TIMEOUT_MS = 6000;

/**
 * Whether a real route can be asked for at all.
 * @returns {boolean} True when a key is configured.
 */
function canRoute() {
  return Boolean(ORS_API_KEY);
}

/**
 * The call to ask for a walking route, or null when the ends are unusable.
 * @param {object} params - The two ends and the key to call with.
 * @param {{ lat: number, lon: number }} params.from - Where the walk starts.
 * @param {{ lat: number, lon: number }} params.to - Where it ends.
 * @param {string} params.apiKey - The OpenRouteService key.
 * @returns {string|null} The URL to fetch, or null.
 */
function buildDirectionsUrl({ from, to, apiKey }) {
  // Not plain Number(): it turns null and "" into 0, which would send someone
  // off the Gulf of Guinea instead of refusing a coordinate the API never sent.
  const ends = [from?.lon, from?.lat, to?.lon, to?.lat].map((value) =>
    value === null || value === undefined || value === "" ? NaN : Number(value),
  );
  if (!apiKey || ends.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [fromLon, fromLat, toLon, toLat] = ends;
  return `${DIRECTIONS_URL}?api_key=${encodeURIComponent(apiKey)}&start=${fromLon},${fromLat}&end=${toLon},${toLat}`;
}

/**
 * The path out of a routing answer, or null when it holds none worth drawing.
 * A single point is not a path: it would draw nothing and hide the straight
 * line that at least says where the journey goes.
 * @param {object} payload - The GeoJSON the service answered with.
 * @returns {Array<[number, number]>|null} The path as [lon, lat] pairs, or null.
 */
function readRoute(payload) {
  const coordinates = payload?.features?.[0]?.geometry?.coordinates;
  return Array.isArray(coordinates) && coordinates.length > 1 ? coordinates : null;
}

/**
 * The walking route between two points, as the line to draw.
 *
 * Returns null rather than throwing whenever a route cannot be had — no key, no
 * network, a service that is down or slow, a pair of points it cannot connect.
 * The caller falls back to the straight line, which is what the app drew before
 * and is still honest about where the journey goes.
 *
 * @param {object} params - The two ends of the walk.
 * @param {{ lat: number, lon: number }} params.from - Where it starts.
 * @param {{ lat: number, lon: number }} params.to - Where it ends.
 * @param {string} [params.apiKey] - The key to call with; the configured one by default.
 * @returns {Promise<Array<[number, number]>|null>} The path, or null.
 */
async function getWalkingRoute({ from, to, apiKey = ORS_API_KEY }) {
  const url = buildDirectionsUrl({ from, to, apiKey });
  if (!url) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response || !response.ok) {
      return null;
    }
    return readRoute(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export { buildDirectionsUrl, canRoute, getWalkingRoute, readRoute };
