import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Accordion from "../components/Accordion";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { resetOnboarding } from "../utils/onboarding";

const SUPPORT_EMAIL = "contact@kompagnon.dev";

const QUESTIONS = [
  {
    icon: "navigation",
    question: "Comment demander un accompagnement ?",
    answer: "Depuis l'accueil, appuyez sur « Demander un accompagnement », renseignez votre départ, votre arrivée et vos horaires. Votre trajet est ensuite proposé aux personnes dont l'itinéraire correspond.",
  },
  {
    icon: "check-circle",
    question: "Quand mon trajet est-il confirmé ?",
    answer: "Un trajet est confirmé lorsque vous et votre binôme avez accepté la correspondance. Tant qu'une seule des deux personnes a répondu, le trajet reste « en attente ».",
  },
  {
    icon: "user-check",
    question: "Comment répondre à une demande ?",
    answer: "Ouvrez l'onglet Trajets : les trajets qui attendent votre réponse portent un badge « demande ». Ouvrez le trajet, puis appuyez sur Accepter ou Refuser.",
  },
  {
    icon: "phone",
    question: "Comment contacter mon binôme ?",
    answer: "Une fois le trajet confirmé des deux côtés, le bouton « Appeler » apparaît sur le détail du trajet. Par respect de la vie privée, le numéro n'est jamais affiché et n'est partagé qu'après confirmation.",
  },
  {
    icon: "map",
    question: "À quoi sert la carte du trajet ?",
    answer: "Elle affiche votre itinéraire, celui de votre binôme et le point de rendez-vous, pour vous aider à vous retrouver le jour du trajet.",
  },
  {
    icon: "lock",
    question: "Je n'arrive pas à me connecter",
    answer: "Vérifiez que votre compte a bien été activé via le lien reçu par email. Si vous avez oublié votre mot de passe, utilisez « Mot de passe oublié » sur l'écran de connexion.",
  },
];

/** Help centre: questions unfold on tap, plus a way to reach a human. */
export default function HelpScreen() {
  const navigation = useNavigation();

  async function replayIntroduction() {
    await resetOnboarding();
    navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="help-screen">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-left" size={22} color={colors.navy} />
        </TouchableOpacity>

        <Text style={styles.title}>Aide & support</Text>
        <Text style={styles.intro}>Appuyez sur une question pour voir la réponse.</Text>

        {QUESTIONS.map((item, position) => (
          <Accordion
            key={item.question}
            icon={item.icon}
            question={item.question}
            answer={item.answer}
            testID={`help-question-${position}`}
          />
        ))}

        <Text style={styles.sectionTitle}>Toujours bloqué ?</Text>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          accessibilityRole="button"
          accessibilityLabel="Écrire au support"
          testID="help-contact"
        >
          <View style={styles.actionIcon}>
            <Icon name="mail" size={18} color={colors.textOnDark} />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Écrire au support</Text>
            <Text style={styles.actionText}>{SUPPORT_EMAIL} — réponse sous 48 h ouvrées</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={replayIntroduction}
          accessibilityRole="button"
          accessibilityLabel="Revoir l'introduction"
          testID="help-replay"
        >
          <View style={[styles.actionIcon, styles.actionIconSoft]}>
            <Icon name="play-circle" size={18} color={colors.tealDark} />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Revoir l&apos;introduction</Text>
            <Text style={styles.actionText}>Les trois étapes du fonctionnement de Kompagnon</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.textLight} />
        </TouchableOpacity>
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
  sectionTitle: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.navy, marginTop: 20, marginBottom: 12, marginLeft: 4 },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 10,
    minHeight: 64, ...shadow.card,
  },
  actionIcon: {
    width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.teal,
    alignItems: "center", justifyContent: "center",
  },
  actionIconSoft: { backgroundColor: colors.tealLight },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.navy, marginBottom: 2 },
  actionText: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 18 },
});
