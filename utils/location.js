import * as Location from "expo-location";

/**
 * Requests foreground location permission and reads the current coordinates.
 * @returns {Promise<{ granted: boolean, latitude?: number, longitude?: number }>}
 */
async function getCurrentPosition() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { granted: false };
  }
  const { coords } = await Location.getCurrentPositionAsync({});
  return { granted: true, latitude: coords.latitude, longitude: coords.longitude };
}

/**
 * Turns coordinates into a readable address, or "" when none is found.
 * @param {{ latitude: number, longitude: number }} coords
 * @returns {Promise<string>}
 */
async function reverseGeocode({ latitude, longitude }) {
  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (!place) {
    return "";
  }
  const street = [place.streetNumber, place.street].filter(Boolean).join(" ");
  return [street, place.postalCode, place.city].filter(Boolean).join(", ");
}

/**
 * Resolves an address to coordinates, or null when none is found.
 * @param {string} address
 * @returns {Promise<{ latitude: number, longitude: number }|null>}
 */
async function geocodeAddress(address) {
  const [match] = await Location.geocodeAsync(address);
  if (!match) {
    return null;
  }
  return { latitude: match.latitude, longitude: match.longitude };
}

// Free OpenStreetMap geocoder. Fine for development; a production app should use
// a keyed provider (Google/Mapbox) or a self-hosted Nominatim instance.
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Searches addresses matching a query, for autocomplete suggestions.
 * Returns an empty list for short queries or on any error.
 * @param {string} query
 * @returns {Promise<Array<{ label: string, latitude: number, longitude: number }>>}
 */
async function searchAddresses(query) {
  const trimmed = (query || "").trim();
  if (trimmed.length < 3) {
    return [];
  }
  try {
    const url = `${NOMINATIM_SEARCH_URL}?format=json&limit=5&accept-language=fr&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return [];
    }
    const results = await response.json();
    return results.map((place) => ({
      label: place.display_name,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    }));
  } catch {
    return [];
  }
}

export { geocodeAddress, getCurrentPosition, reverseGeocode, searchAddresses };
