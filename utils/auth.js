import { apiFetch } from "./api-fetch";

const AUTH_URL = "/api/authentication";

const UNREACHABLE = "Une erreur est survenue. Vérifiez votre connexion.";

/**
 * Asks the API to send a password reset link to this address. The API answers
 * the same way whether or not the address exists, so the caller must not reveal
 * which is the case.
 * @param {{ email: string }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function requestPasswordReset({ email }) {
  try {
    const response = await apiFetch(`${AUTH_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (response && response.ok) {
      return { success: true };
    }
    return { success: false, message: "Impossible d'envoyer le lien. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Sets a new password from the token received by email.
 * @param {{ token: string, password: string }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function resetPassword({ token, password }) {
  try {
    const response = await apiFetch(`${AUTH_URL}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (response && response.ok) {
      return { success: true };
    }
    if (response && (response.status === 400 || response.status === 404)) {
      return { success: false, message: "Ce lien est invalide ou expiré. Demandez-en un nouveau." };
    }
    return { success: false, message: "Impossible de changer le mot de passe. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

/**
 * Activates the account with the token received by email, setting the phone
 * number and the role the user will have in the app.
 * @param {{ token: string, phoneNumber: string, role: string }} params
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function activateAccount({ token, phoneNumber, role }) {
  try {
    const response = await apiFetch(`${AUTH_URL}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phoneNumber, role }),
    });

    if (response && response.ok) {
      return { success: true };
    }
    if (response && (response.status === 401 || response.status === 403)) {
      return { success: false, message: "Ce lien d'activation est invalide ou expiré." };
    }
    if (response && response.status === 409) {
      // The API answers 409 both for an already-active account and for a phone
      // number taken by someone else; the message tells the two apart.
      const data = await response.json().catch(() => null);
      const alreadyActive = /already active/i.test(data?.message ?? "");
      return {
        success: false,
        message: alreadyActive
          ? "Ce compte est déjà activé. Vous pouvez vous connecter."
          : "Ce numéro est déjà utilisé par un autre compte.",
      };
    }
    return { success: false, message: "Impossible d'activer le compte. Réessayez." };
  } catch {
    return { success: false, message: UNREACHABLE };
  }
}

export { activateAccount, requestPasswordReset, resetPassword };
