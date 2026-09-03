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
