import * as Speech from "expo-speech";
import React from "react";
import { AccessibilityInfo, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import Icon from "./Icon";

/**
 * Reads the code as separate digits. "4821" spoken as a number becomes "four
 * thousand eight hundred and twenty-one", which nobody can repeat out loud, so
 * every announcement spells it out.
 * @param {string} code - The four digits.
 * @returns {string} The digits, spaced apart.
 */
function spellOut(code) {
  return String(code).split("").join(" ");
}

/**
 * Says the code out loud.
 *
 * A screen reader announcement only reaches someone who already has VoiceOver
 * or TalkBack running. This button says "hear the code", so it has to speak for
 * everyone who presses it — someone with low vision who does not use a screen
 * reader, or anyone whose hands are busy holding a cane.
 *
 * @param {string} spoken - The digits, spaced apart.
 */
function sayOutLoud(spoken) {
  const sentence = `Votre code de rencontre est ${spoken}`;
  // Both: the screen reader announcement keeps the code in the accessibility
  // history for someone reading back through it.
  AccessibilityInfo.announceForAccessibility(sentence);
  Speech.stop();
  Speech.speak(sentence, { language: "fr-FR" });
}

/**
 * The code both users read to check they found each other. It answers a
 * question the app could not: for someone who cannot see the person walking up
 * to them, there is otherwise no way to tell their companion from a stranger,
 * and calling out a name tells that stranger which name to answer with.
 *
 * @param {object} props
 * @param {string} props.code      - The four digits, shared by both users.
 * @param {string} [props.otherName] - First name of the other user.
 */
export default function MeetingCode({ code, otherName }) {
  if (!code) {
    return null;
  }

  const digits = String(code).split("");
  const spoken = spellOut(code);
  const withWhom = otherName ?? "votre binôme";

  return (
    <View style={styles.card} testID="meeting-code">
      <View style={styles.header}>
        <Icon name="shield" size={16} color={colors.tealDark} />
        <Text style={styles.title}>Code de rencontre</Text>
      </View>

      <View
        style={styles.digits}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Votre code de rencontre est ${spoken}`}
        testID="meeting-code-digits"
      >
        {digits.map((digit, index) => (
          // The digits never reorder, so their position is a stable identity.
          <View key={`${digit}-${index}`} style={styles.digitBox}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.explanation}>
        {withWhom} voit le même code. Dites-le à voix haute en vous retrouvant :
        si les deux codes concordent, vous avez trouvé la bonne personne.
      </Text>

      <TouchableOpacity
        style={styles.speakButton}
        onPress={() => sayOutLoud(spoken)}
        accessibilityRole="button"
        accessibilityLabel="Entendre le code"
        accessibilityHint="Annonce les chiffres du code un par un"
        testID="meeting-code-speak"
      >
        <Icon name="volume-2" size={15} color={colors.teal} />
        <Text style={styles.speakText}>Entendre le code</Text>
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
    gap: 14,
    ...shadow.card,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy },
  digits: { flexDirection: "row", justifyContent: "center", gap: 10 },
  digitBox: {
    minWidth: 56,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    backgroundColor: colors.tealLight,
    alignItems: "center",
  },
  digit: {
    fontSize: 32,
    fontFamily: fonts.displayBold,
    color: colors.tealDark,
    letterSpacing: 1,
  },
  explanation: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMedium,
    lineHeight: 19,
  },
  speakButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
  },
  speakText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.teal },
});
