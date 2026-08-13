const PLACEHOLDER = "—";

/**
 * Formats an ISO date-time as a short French date, e.g. "jeu. 14 août 2026".
 * @param {string} isoString
 * @returns {string}
 */
function formatShortDate(isoString) {
  const date = new Date(isoString);
  if (!isoString || isNaN(date.getTime())) {
    return PLACEHOLDER;
  }
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats an ISO date-time as a French time, e.g. "15:04".
 * @param {string} isoString
 * @returns {string}
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  if (!isoString || isNaN(date.getTime())) {
    return PLACEHOLDER;
  }
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export { formatShortDate, formatTime, PLACEHOLDER };
