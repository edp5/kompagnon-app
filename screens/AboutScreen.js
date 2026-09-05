import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import appJson from "../app.json";
import logo from "../assets/kompagnon-logo.png";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";

const VERSION = appJson?.expo?.version ?? "1.0.0";

const STEPS = [
  { title: "Enregistrez un trajet", text: "Départ, arrivée, horaires : en moins d'une minute." },
  { title: "Recevez une correspondance", text: "Une personne dont l'itinéraire croise le vôtre vous est proposée." },
  { title: "Confirmez et retrouvez-vous", text: "La carte affiche le point de rendez-vous, et vous pouvez l'appeler." },
];

/** About page: who we are, how it works, and what to do next. */
export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="about-screen">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-left" size={22} color={colors.navy} />
        </TouchableOpacity>

        <View style={styles.hero} accessible accessibilityLabel={`Kompagnon, version ${VERSION}. L'accompagnement accessible, pensé pour tous.`}>
          <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
          <Text style={styles.brand}>Kompagnon</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version {VERSION}</Text>
          </View>
          <Text style={styles.tagline}>L&apos;accompagnement accessible, pensé pour tous.</Text>
        </View>

        <Text style={styles.sectionTitle}>Comment ça marche</Text>
        {STEPS.map((step, position) => (
          <View
            key={step.title}
            style={styles.step}
            accessible
            accessibilityLabel={`Étape ${position + 1}. ${step.title}. ${step.text}`}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{position + 1}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.credit}>Fait avec soin pour que se déplacer ne soit plus un obstacle.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 16, ...shadow.card,
  },
  hero: { alignItems: "center", marginBottom: 12 },
  logo: { width: 84, height: 84, borderRadius: radius.xl, marginBottom: 14, ...shadow.card },
  brand: { fontSize: 30, fontFamily: fonts.displayBlack, color: colors.navy, letterSpacing: -0.5 },
  versionPill: {
    marginTop: 8, paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: radius.full, backgroundColor: colors.tealLight,
  },
  versionText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.tealDark },
  tagline: {
    marginTop: 12, fontSize: 15, fontFamily: fonts.body, color: colors.textMedium,
    textAlign: "center", lineHeight: 21,
  },
  sectionTitle: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.navy, marginTop: 24, marginBottom: 12, marginLeft: 4 },
  step: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 10, ...shadow.card,
  },
  stepNumber: {
    width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.teal,
    alignItems: "center", justifyContent: "center",
  },
  stepNumberText: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.textOnDark },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.navy, marginBottom: 2 },
  stepText: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 18 },
  credit: {
    marginTop: 24, fontSize: 13, fontFamily: fonts.body, color: colors.textLight,
    textAlign: "center", lineHeight: 19,
  },
});
