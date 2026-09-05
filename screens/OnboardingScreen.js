import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { markOnboardingSeen } from "../utils/onboarding";
import { getSession } from "../utils/session";

const SLIDES = [
  {
    key: "mission",
    icon: "navigation",
    title: "Se déplacer sans obstacle",
    text: "Kompagnon met en relation des personnes en situation de handicap avec des accompagnateurs bénévoles, pour que chaque trajet reste possible.",
  },
  {
    key: "match",
    icon: "users",
    title: "Trouvez votre binôme",
    text: "Enregistrez votre trajet : nous cherchons une personne dont l'itinéraire correspond au vôtre, et vous confirmez ensemble.",
  },
  {
    key: "meet",
    icon: "map-pin",
    title: "Retrouvez-vous facilement",
    text: "Une fois le trajet confirmé des deux côtés, la carte affiche le point de rendez-vous et vous pouvez appeler votre binôme d'un geste.",
  },
];

/**
 * Three-step introduction shown once, on the very first launch, before the
 * welcome screen. Skipping and finishing both mark it as seen.
 */
export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);

  const current = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  async function finish() {
    await markOnboardingSeen();
    // Someone replaying the introduction from the app is already signed in, and
    // must land back in the app rather than on the sign-in screens.
    const session = await getSession();
    navigation.reset({ index: 0, routes: [{ name: session ? "Main" : "Welcome" }] });
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    setIndex(index + 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel="Passer l'introduction"
          testID="onboarding-skip"
          style={styles.skip}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.slides} testID="onboarding-slides">
        <View
          style={styles.slide}
          accessible
          accessibilityLabel={`Étape ${index + 1} sur ${SLIDES.length}. ${current.title}. ${current.text}`}
        >
          <View style={styles.iconCircle}>
            <Icon name={current.icon} size={40} color={colors.tealDark} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.text}>{current.text}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Étape ${index + 1} sur ${SLIDES.length}`}>
          {SLIDES.map((slide, position) => (
            <View key={slide.key} style={[styles.dot, position === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Commencer" : "Suivant"}
          testID="onboarding-next"
        >
          <Text style={styles.primaryButtonText}>{isLast ? "Commencer" : "Suivant"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  slides: { flex: 1, justifyContent: "center" },
  topBar: { alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 8 },
  skip: { paddingVertical: 12, paddingHorizontal: 12, minHeight: 44, justifyContent: "center" },
  skipText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textMedium },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 36 },
  iconCircle: {
    width: 112, height: 112, borderRadius: radius.full, backgroundColor: colors.tealLight,
    alignItems: "center", justifyContent: "center", marginBottom: 32, ...shadow.card,
  },
  title: {
    fontSize: 26, fontFamily: fonts.displayBlack, color: colors.navy,
    letterSpacing: -0.5, textAlign: "center", marginBottom: 12,
  },
  text: {
    fontSize: 16, fontFamily: fonts.body, color: colors.textMedium,
    textAlign: "center", lineHeight: 23,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.sand },
  dotActive: { width: 24, backgroundColor: colors.teal },
  primaryButton: {
    alignItems: "center", justifyContent: "center", minHeight: 56, paddingVertical: 18,
    borderRadius: radius.full, backgroundColor: colors.teal, ...shadow.teal,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 16, fontFamily: fonts.bodyBold, letterSpacing: 0.3 },
});
