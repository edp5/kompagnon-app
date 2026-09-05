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
