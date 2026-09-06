// Announcing every reading would talk over the user; announcing only the last
// metres would come too late to turn around. These are the distances worth
// hearing, from "they are next to you" up to "they are on their way", kept in
// ascending order so the closest one that still contains the reading wins.
const ANNOUNCED_DISTANCES_M = [20, 50, 100, 200, 500];

const EARTH_RADIUS_M = 6371000;

/**
 * Distance in metres between two points, over the surface of the earth.
 * The haversine formula is far more precision than a walking distance needs,
 * but it costs nothing and stays correct near the poles and the date line.
 * @param {{ lat: number|string, lon: number|string }} from - First point.
 * @param {{ lat: number|string, lon: number|string }} to - Second point.
 * @returns {number|null} The distance in metres, or null when a coordinate is unusable.
 */
function distanceInMetres(from, to) {
  // Not plain Number(): it turns null and "" into 0, which would measure the
  // distance to the Gulf of Guinea instead of refusing a coordinate that is
  // simply not there.
  const coordinates = [from?.lat, from?.lon, to?.lat, to?.lon].map((value) =>
    value === null || value === undefined || value === "" ? NaN : Number(value),
  );
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    return null;
  }

  const [fromLat, fromLon, toLat, toLon] = coordinates;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLon = toRadians(toLon - fromLon);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * The distance step a reading has reached, or null when the pair is still
 * further away than the first step worth announcing.
 * @param {number} metres - The distance between the two users.
 * @returns {number|null} The step reached.
 */
function stepFor(metres) {
  return ANNOUNCED_DISTANCES_M.find((step) => metres <= step) ?? null;
}

/**
 * Decides what to say, if anything, about the pair getting closer.
 *
 * Only a step the user has not heard yet is announced, and only while the pair
 * is getting closer: someone walking back and forth around a threshold would
 * otherwise be announced over and over.
 *
 * @param {object} params
 * @param {number} params.metres - Current distance between the two users.
 * @param {number|null} params.announcedStep - The step already announced, if any.
 * @param {string} [params.otherName] - First name of the pair.
 * @returns {{ step: number, sentence: string }|null} What to announce, or null.
 */
function approachAnnouncement({ metres, announcedStep, otherName }) {
  const step = stepFor(metres);
  if (step === null || (announcedStep !== null && step >= announcedStep)) {
    return null;
  }

  const who = otherName ?? "Votre binôme";
  const sentence = step <= 20
    ? `${who} est tout près de vous.`
    : `${who} est à moins de ${step} mètres.`;

  return { step, sentence };
}

export { ANNOUNCED_DISTANCES_M, approachAnnouncement, distanceInMetres };
