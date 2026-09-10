// Shared display labels, kept in sync with the web app's src/constants.js.
//
// The keys must match the values the API stores, defined in
// api/src/shared/constants.js of the edp5/kompagnon repository.

/**
 * Labels for `USER_ROLE` as returned by GET /api/users/profile.
 * @readonly
 * @enum {string}
 */
export const USER_ROLES = {
  companion: "Accompagnateur",
  passenger: "Personne handicapée",
};

/**
 * Roles stored on accounts created before the API renamed them. The profile
 * endpoint returns `user.role` as-is, so those rows still arrive with the old
 * values and would otherwise render no label at all.
 * @readonly
 */
const LEGACY_ROLE_ALIASES = {
  valid: "companion",
  invalid: "passenger",
};

/**
 * Normalises a role coming from the API to the vocabulary used by USER_ROLES.
 * @param {string} [role] - Role as returned by GET /api/users/profile.
 * @returns {string|undefined} The current role name.
 */
export function normalizeRole(role) {
  return LEGACY_ROLE_ALIASES[role] ?? role;
}

/**
 * The words each side of the app is addressed with.
 *
 * A companion offers a trip they are making so someone can be matched to it; a
 * passenger asks to be accompanied on theirs. Same form, same endpoint, opposite
 * sentences — and until now both sides read the passenger's, so a volunteer
 * opened the app and was invited to ask for help.
 * @readonly
 */
export const ROLE_COPY = {
  companion: {
    tagline: "Vos trajets rendent ceux des autres possibles.",
    action: "Proposer un accompagnement",
    nextHeading: "Votre prochain accompagnement",
    empty: "Aucun accompagnement prévu. Proposez un trajet et nous vous mettrons en relation.",
    formQuestion: "Quel trajet faites-vous ? Nous y associerons une personne à accompagner.",
  },
  passenger: {
    tagline: "L'accompagnement accessible, pensé pour tous.",
    action: "Demander un accompagnement",
    nextHeading: "Votre prochain trajet",
    empty: "Aucun trajet à venir. Demandez un accompagnement pour commencer.",
    formQuestion: "Où souhaitez-vous être accompagné ?",
  },
};

/**
 * The wording to address a user with.
 *
 * An account whose role the API has not set yet reads as a passenger: it is the
 * side the app was built for first, and it is what every user saw before this
 * existed.
 * @param {string} [role] - Role as returned by GET /api/users/profile.
 * @returns {object} The sentences for that side of the app.
 */
export function copyForRole(role) {
  return ROLE_COPY[normalizeRole(role)] ?? ROLE_COPY.passenger;
}

/**
 * Labels for `USER_GENRES` as returned by GET /api/users/profile.
 * @readonly
 * @enum {string}
 */
export const USER_GENRE = {
  F: "Mme",
  M: "Monsieur",
};

/**
 * Labels for `USER_DISABILITIES` as returned by GET /api/users/profile.
 * @readonly
 * @enum {string}
 */
export const USER_DISABILITIES = {
  blind: "Aveugle",
  visually: "Déficience visuelle",
  wheelchair: "Fauteuil roulant",
  mental: "Handicap mental",
};
