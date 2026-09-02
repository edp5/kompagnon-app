import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import logo from "../assets/kompagnon-logo.png";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { checkHealth } from "../utils/api-fetch";
import { formatShortDate, formatTime } from "../utils/format";
import { getUpcomingMatchedJourneys } from "../utils/journeys";
import { getSession } from "../utils/session";
import { getUserProfile } from "../utils/users";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [apiIsActive, setApiIsActive] = useState(true);
  const [firstname, setFirstname] = useState(null);
  const [nextJourney, setNextJourney] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const healthy = await checkHealth();
    setApiIsActive(healthy);

    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const [profile, journeys] = await Promise.all([
      getUserProfile({ token: session.token }),
      getUpcomingMatchedJourneys({ token: session.token }),
    ]);

    if (profile.success) {
      setFirstname(profile.profile?.firstname ?? null);
    }
    setNextJourney(journeys.success ? journeys.journeys[0] ?? null : null);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
            <Text style={styles.wordmark}>Kompagnon</Text>
          </View>
          <View
            style={[styles.statusPill, apiIsActive ? styles.statusOk : styles.statusDown]}
            testID="api-status"
            accessible
            accessibilityRole="text"
            accessibilityLabel={apiIsActive ? "API connectée" : "API injoignable"}
          >
            <Icon name={apiIsActive ? "check-circle" : "alert-circle"} size={13} color={apiIsActive ? colors.successText : colors.danger} />
            <Text style={[styles.statusText, { color: apiIsActive ? colors.successText : colors.danger }]}>
              {apiIsActive ? "Connecté" : "Hors ligne"}
            </Text>
          </View>
        </View>

        <Text style={styles.greeting}>Bonjour{firstname ? ` ${firstname}` : ""} 👋</Text>
        <Text style={styles.subtitle}>L&apos;accompagnement accessible, pensé pour tous.</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("RecordJourney")}
          accessibilityRole="button"
          accessibilityLabel="Demander un accompagnement"
        >
          <Icon name="navigation" size={18} color={colors.textOnDark} />
          <Text style={styles.primaryButtonText}>Demander un accompagnement</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Votre prochain trajet</Text>

        {loading ? (
          <View style={styles.skeletonCard} testID="home-skeleton">
            <View style={[styles.skeleton, { width: "40%" }]} />
            <View style={[styles.skeleton, { width: "80%" }]} />
            <View style={[styles.skeleton, { width: "65%" }]} />
          </View>
        ) : nextJourney ? (
          <TouchableOpacity
            style={styles.journeyCard}
            onPress={() => navigation.navigate("JourneyDetail", { journeyId: nextJourney.id })}
            accessibilityRole="button"
            accessibilityLabel={`Prochain trajet du ${formatShortDate(nextJourney.departureTime)}, ${nextJourney.departureAddress} vers ${nextJourney.arrivalAddress}`}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{formatShortDate(nextJourney.departureTime)}</Text>
              {nextJourney.confirmedMatch ? (
                <View style={styles.confirmedBadge}>
                  <Icon name="check" size={11} color={colors.successText} />
                  <Text style={styles.confirmedText}>Confirmé</Text>
                </View>
              ) : nextJourney.pendingCount > 0 ? (
                <View style={styles.pendingBadge}>
                  <Icon name="clock" size={11} color={colors.warning} />
                  <Text style={styles.pendingText}>
                    {nextJourney.pendingCount} demande{nextJourney.pendingCount > 1 ? "s" : ""}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.leg}>
              <Icon name="map-pin" size={14} color={colors.tealDark} />
              <Text style={styles.legText} numberOfLines={1}>{nextJourney.departureAddress}</Text>
              <Text style={styles.legTime}>{formatTime(nextJourney.departureTime)}</Text>
            </View>
            <View style={styles.leg}>
              <Icon name="flag" size={14} color={colors.textLight} />
              <Text style={styles.legText} numberOfLines={1}>{nextJourney.arrivalAddress}</Text>
              <Text style={styles.legTime}>{formatTime(nextJourney.arrivalTime)}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard} testID="home-empty">
            <Icon name="calendar" size={20} color={colors.textLight} />
            <Text style={styles.emptyText}>
              Aucun trajet à venir. Demandez un accompagnement pour commencer.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: radius.md },
  wordmark: { fontSize: 18, fontFamily: fonts.displayBlack, color: colors.navy, letterSpacing: -0.3 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: radius.full,
  },
  statusOk: { backgroundColor: colors.successBg },
  statusDown: { backgroundColor: colors.dangerBg },
  statusText: { fontSize: 12, fontFamily: fonts.bodySemiBold },
  greeting: {
    fontSize: 28,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, fontFamily: fonts.body, color: colors.textMedium, marginBottom: 24 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
    paddingVertical: 18,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
    marginBottom: 32,
    ...shadow.teal,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 16, fontFamily: fonts.bodyBold, letterSpacing: 0.3 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.navy, marginBottom: 12, marginLeft: 4 },
  journeyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, ...shadow.card },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardDate: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.navy },
  confirmedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.successBg,
  },
  confirmedText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.successText },
  pendingBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.sand,
  },
  pendingText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.warning },
  leg: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  legText: { flex: 1, fontSize: 14, fontFamily: fonts.body, color: colors.navy },
  legTime: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.textMedium },
  emptyCard: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 32, paddingHorizontal: 24, ...shadow.card,
  },
  emptyText: { fontSize: 14, fontFamily: fonts.body, color: colors.textMedium, textAlign: "center", lineHeight: 20 },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 12, ...shadow.card },
  skeleton: { height: 14, borderRadius: radius.sm, backgroundColor: colors.beige },
});
