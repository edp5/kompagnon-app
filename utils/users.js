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

/**
 * Records, or clears, the person to reach if a journey goes wrong. Passing no
 * phone number clears it, which is how the user takes the contact back.
 * @param {{ token: string, name?: string|null, phoneNumber?: string|null }} params
 * @returns {Promise<{ success: boolean, trustedContact?: object|null, message?: string }>}
 */
async function setTrustedContact({ token, name = null, phoneNumber = null }) {
  try {
    const response = await apiFetch("/api/users/trusted-contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, phoneNumber }),
    });

    if (response && response.ok) {
      const data = await response.json();
      return { success: true, trustedContact: data?.data?.trustedContact ?? null };
    }
    if (response && response.status === 401) {
      return { success: false, message: "Session expirée. Reconnectez-vous." };
    }
    if (response && response.status === 400) {
      return { success: false, message: "Ce numéro n'est pas un mobile français valide." };
    }
    return { success: false, message: "Impossible d'enregistrer ce contact." };
  } catch {
    return { success: false, message: "Une erreur est survenue. Vérifiez votre connexion." };
  }
}

export { getUserProfile, setTrustedContact };
