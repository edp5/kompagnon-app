import { apiFetch } from "./api-fetch";

/**
 * Reads the profile of the authenticated user.
 * @param {{ token: string }} params
 * @returns {Promise<{ success: boolean, profile?: object, message?: string }>}
 */
async function getUserProfile({ token }) {
  try {
    const response = await apiFetch("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, profile: data?.data };
    }
    if (response && response.status === 401) {
      return { success: false, message: "Session expirée. Reconnectez-vous." };
    }
    return { success: false, message: "Impossible de charger votre profil." };
  } catch {
    return { success: false, message: "Une erreur est survenue. Vérifiez votre connexion." };
  }
}

export { getUserProfile };
