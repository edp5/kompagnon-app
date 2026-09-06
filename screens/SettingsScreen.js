import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import Icon from "../components/Icon";
import { colors, fonts, layout, radius, shadow } from "../theme/tokens";
import { resetOnboarding } from "../utils/onboarding";
import { setSpeaksAloud, speaksAloud } from "../utils/preferences";

/**
 * The settings the app actually has: what it may say out loud, and a way back
 * to the introduction.
 *
 * The spoken announcements are the reason this screen exists. The app talks on
 * its own — when the pair gets close, when a code is asked for — and something
 * that talks has to be silenceable. A station concourse, a meeting, a night
 * bus: there are plenty of moments where being read to is the wrong thing.
 */
export default function SettingsScreen() {
  const navigation = useNavigation();
  const [speaking, setSpeaking] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    speaksAloud().then((allowed) => {
      setSpeaking(allowed);
      setLoaded(true);
    });
  }, []);

  async function changeSpeaking(allowed) {
    setSpeaking(allowed);
    await setSpeaksAloud(allowed);
  }

  async function replayIntroduction() {
    await resetOnboarding();
    navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID="settings-screen">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-left" size={22} color={colors.navy} />
        </TouchableOpacity>

        <Text style={styles.title}>Réglages</Text>

        <Text style={styles.sectionTitle}>Voix</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Annonces à voix haute</Text>
              <Text style={styles.rowText}>
                L&apos;application dit quand votre binôme approche et peut relire votre
                code de rencontre. Coupez-les si vous préférez le silence : le
                lecteur d&apos;écran, lui, continue de tout annoncer.
              </Text>
            </View>
            <Switch
              value={speaking}
              onValueChange={changeSpeaking}
              disabled={!loaded}
              trackColor={{ true: colors.teal, false: colors.sand }}
              accessibilityRole="switch"
              accessibilityLabel="Annonces à voix haute"
              accessibilityState={{ checked: speaking }}
              testID="settings-speech-switch"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Découverte</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={replayIntroduction}
          accessibilityRole="button"
          accessibilityLabel="Revoir l'introduction"
          testID="settings-replay-onboarding"
        >
          <Icon name="play-circle" size={18} color={colors.tealDark} />
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Revoir l&apos;introduction</Text>
            <Text style={styles.rowText}>Rejouer les écrans de bienvenue depuis le début.</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { ...layout.content, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 18, ...shadow.card,
  },
  title: { fontSize: 26, fontFamily: fonts.displayBlack, color: colors.navy, marginBottom: 24 },
  sectionTitle: {
    fontSize: 16, fontFamily: fonts.displayBold, color: colors.navy,
    marginBottom: 12, marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18,
    marginBottom: 28, ...shadow.card,
  },
  actionCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18,
    marginBottom: 28, ...shadow.card,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.navy },
  rowText: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 19 },
});
