import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// expo-secure-store has no web implementation, so on web we fall back to
// localStorage. On native we use the device's secure storage.
const isWeb = Platform.OS === "web";

/**
 * Stores a value under a key.
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
async function setItem(key, value) {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

/**
 * Reads a value, or null when it was never stored.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function getItem(key) {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

/**
 * Removes a stored value.
 * @param {string} key
 * @returns {Promise<void>}
 */
async function removeItem(key) {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export { getItem, removeItem, setItem };
