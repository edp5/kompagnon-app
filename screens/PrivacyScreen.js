import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Accordion from "../components/Accordion";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";

// The three commitments that matter most to someone deciding to sign up.
const PROMISES = [
  { icon: "eye-off", title: "Votre numéro reste privé", text: "Il n'est jamais affiché dans l'application." },
  { icon: "user-check", title: "Partagé après accord", text: "Transmis à votre binôme seulement quand vous avez tous les deux accepté." },
  { icon: "trash-2", title: "Effaçable sur demande", text: "Vous pouvez demander la suppression de votre compte et de vos données." },
];

const DETAILS = [
  {
    icon: "database",
    question: "Quelles données sont collectées ?",
    answer: "Votre identité (nom, prénom, date de naissance), votre email, votre numéro de mobile, votre rôle et, le cas échéant, vos besoins d'accompagnement. S'y ajoutent les trajets que vous enregistrez et leurs adresses.",
  },
  {
    icon: "target",
    question: "Pourquoi sont-elles utilisées ?",
    answer: "Uniquement pour vous mettre en relation avec un binôme adapté, vous permettre de vous retrouver le jour du trajet, et vous tenir informé par email de vos correspondances.",
  },
  {
    icon: "map-pin",
    question: "Que deviennent mes adresses de trajet ?",
    answer: "Elles servent à calculer les correspondances et à afficher l'itinéraire. Elles ne sont visibles que par vous et par le binôme d'un trajet vous concernant.",
  },
  {
    icon: "clock",
    question: "Combien de temps sont-elles conservées ?",
    answer: "Le temps de votre inscription. Vous pouvez demander la suppression de votre compte et des données associées en écrivant à contact@kompagnon.dev.",
  },
  {
    icon: "shield",
    question: "Quels sont mes droits ?",
    answer: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'opposition et d'effacement sur vos données. Contactez-nous pour les exercer.",
  },
];

/** Privacy page: the promises up front, the details on demand. */
export default function PrivacyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="privacy-screen">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-left" size={22} color={colors.navy} />
        </TouchableOpacity>

        <Text style={styles.title}>Confidentialité</Text>
        <Text style={styles.intro}>Nos trois engagements, et le détail juste en dessous.</Text>

        {PROMISES.map((promise) => (
          <View
            key={promise.title}
            style={styles.promise}
            accessible
            accessibilityLabel={`${promise.title}. ${promise.text}`}
          >
            <View style={styles.promiseIcon}>
              <Icon name={promise.icon} size={20} color={colors.textOnDark} />
            </View>
            <View style={styles.promiseBody}>
              <Text style={styles.promiseTitle}>{promise.title}</Text>
              <Text style={styles.promiseText}>{promise.text}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Le détail</Text>

        {DETAILS.map((item, position) => (
          <Accordion
            key={item.question}
            icon={item.icon}
            question={item.question}
            answer={item.answer}
            testID={`privacy-detail-${position}`}
          />
        ))}
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
  title: { fontSize: 26, fontFamily: fonts.displayBlack, color: colors.navy, marginBottom: 8 },
  intro: { fontSize: 15, fontFamily: fonts.body, color: colors.textMedium, marginBottom: 20 },
  promise: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.tealLight, borderRadius: radius.lg, padding: 16, marginBottom: 10,
  },
  promiseIcon: {
    width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.tealDark,
    alignItems: "center", justifyContent: "center",
  },
  promiseBody: { flex: 1 },
  promiseTitle: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy, marginBottom: 2 },
  promiseText: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.navy, marginTop: 20, marginBottom: 12, marginLeft: 4 },
});
