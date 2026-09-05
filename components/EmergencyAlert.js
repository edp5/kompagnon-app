import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import { createShareLink } from "../utils/following";
import { getSession } from "../utils/session";

/**
 * Builds the SMS link for a phone. iOS separates the body with "&", every other
 * platform with "?", and getting it wrong drops the message silently.
 * @param {string} phoneNumber - The number to text.
 * @param {string} body - The message.
 * @returns {string} The sms: URL.
 */
function smsUrl(phoneNumber, body) {
  const separator = Platform.OS === "ios" ? "&" : "?";
  return `sms:${phoneNumber}${separator}body=${encodeURIComponent(body)}`;
}

/**
 * One press to tell a trusted contact where you are, during a journey.
 *
 * It does not call emergency services: it hands a real person a link that shows
 * the trip live. Nothing is sent behind the user's back — the message opens in
 * their own SMS app, already written, and they send it.
 *
 * @param {object} props
 * @param {number} props.foundJourneyId - The journey being travelled.
 * @param {object} [props.contact]      - The trusted contact, when one is set.
 * @param {Function} [props.onNoContact] - Called when the user wants to set one.
 */
export default function EmergencyAlert({ foundJourneyId, contact, onNoContact }) {
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(null);

  const who = contact?.name || "votre contact de confiance";

  async function alertContact() {
    setError(null);
    setPreparing(true);

    const session = await getSession();
    if (!session) {
      setPreparing(false);
      setError("Votre session a expiré. Reconnectez-vous.");
      return;
    }

    const result = await createShareLink({ token: session.token, foundJourneyId });
    setPreparing(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const body = `J'ai besoin d'aide pendant mon trajet Kompagnon. Suivez-moi ici : ${result.share.url}`;
    try {
      await Linking.openURL(smsUrl(contact.phoneNumber, body));
    } catch {
      // No SMS app, or it refused to open. The link is what matters, so show it
      // rather than leaving the user with nothing after asking for help.
      Alert.alert("Envoyez ce lien à " + who, result.share.url);
    }
  }

  function confirm() {
    if (!contact?.phoneNumber) {
      onNoContact?.();
      return;
    }

    Alert.alert(
      `Prévenir ${who} ?`,
      "Un message contenant le lien de suivi de votre trajet sera préparé. Vous restez libre de l'envoyer ou non.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Préparer le message", onPress: alertContact },
      ],
    );
  }

  return (
    <View style={styles.card} testID="emergency-alert">
      <Text style={styles.title}>Besoin d&apos;aide ?</Text>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Text style={styles.explanation}>
        {contact?.phoneNumber
          ? `Prévenez ${who} en un geste : le message contiendra le lien pour suivre votre trajet en direct.`
          : "Indiquez un contact de confiance dans votre profil pour pouvoir le prévenir d'un geste pendant un trajet."}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={confirm}
        disabled={preparing}
        accessibilityRole="button"
        accessibilityLabel={contact?.phoneNumber ? `Prévenir ${who}` : "Ajouter un contact de confiance"}
        accessibilityHint={contact?.phoneNumber ? "Prépare un message avec le lien de suivi" : undefined}
        testID="emergency-alert-button"
      >
        {preparing ? (
          <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Préparation…" />
        ) : (
          <Text style={styles.buttonText}>
            {contact?.phoneNumber ? `Prévenir ${who}` : "Ajouter un contact de confiance"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    ...shadow.card,
  },
  title: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy },
  explanation: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 19 },
  error: { fontSize: 13, fontFamily: fonts.body, color: colors.danger },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.danger,
  },
  buttonText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textOnDark },
});
