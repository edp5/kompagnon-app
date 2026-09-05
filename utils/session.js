import { getItem, removeItem, setItem } from "./storage";

// Same key names as the web auth store.
const TOKEN_KEY = "auth_token";
const USER_ID_KEY = "auth_user_id";

/**
 * Persists the authenticated session (bearer token + user id).
 * @param {{ token: string, userId?: number }} session
 * @returns {Promise<void>}
 */
async function saveSession({ token, userId }) {
  await setItem(TOKEN_KEY, token);
  if (userId != null) {
    await setItem(USER_ID_KEY, String(userId));
  }
}

/**
 * Reads the stored session, or null if the user is not logged in.
 * @returns {Promise<{ token: string, userId: number|null }|null>}
 */
async function getSession() {
  const token = await getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }
  const userId = await getItem(USER_ID_KEY);
  return { token, userId: userId ? Number(userId) : null };
}

/**
 * Clears the stored session (logout).
 * @returns {Promise<void>}
 */
async function clearSession() {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_ID_KEY);
}

export { clearSession, getSession, saveSession };
