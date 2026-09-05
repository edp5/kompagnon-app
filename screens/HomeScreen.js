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
import { getHomeOverview } from "../utils/journeys";
import { getSession } from "../utils/session";
import { getUserProfile } from "../utils/users";

const SHORTCUTS = [
  { label: "Mes trajets", icon: "list", screen: "Journeys" },
  { label: "Mon profil", icon: "user", screen: "Profile" },
  { label: "Aide", icon: "help-circle", screen: "Help" },
  { label: "À propos", icon: "info", screen: "About" },
];

const EMPTY_OVERVIEW = {
  ongoing: null,
  next: null,
  pending: [],
  searching: [],
  upcomingCount: 0,
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [apiIsActive, setApiIsActive] = useState(true);
  const [firstname, setFirstname] = useState(null);
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
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

    const [profile, home] = await Promise.all([
      getUserProfile({ token: session.token }),
      getHomeOverview({ token: session.token }),
    ]);

    if (profile.success) {
      setFirstname(profile.profile?.firstname ?? null);
    }
    setOverview(home.success ? home.overview : EMPTY_OVERVIEW);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openJourney = (journeyId) => navigation.navigate("JourneyDetail", { journeyId });

  const showNext = loading || Boolean(overview.next) || !overview.ongoing;

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
        <Text style={styles.subtitle}>
          {overview.upcomingCount > 0
            ? `${overview.upcomingCount} trajet${overview.upcomingCount > 1 ? "s" : ""} à venir.`
            : "L'accompagnement accessible, pensé pour tous."}
        </Text>

        {overview.ongoing ? (
          <TouchableOpacity
            style={styles.ongoingCard}
            testID="home-ongoing"
            onPress={() => openJourney(overview.ongoing.id)}
            accessibilityRole="button"
            accessibilityLabel={`Trajet en cours avec ${overview.ongoing.confirmedMatch?.user?.firstname ?? "votre binôme"}, ouvrir le suivi`}
          >
            <View style={styles.ongoingTop}>
              <View style={styles.livePulse} />
              <Text style={styles.ongoingLabel}>Trajet en cours</Text>
            </View>
            <Text style={styles.ongoingRoute} numberOfLines={1}>
              {overview.ongoing.departureAddress} → {overview.ongoing.arrivalAddress}
            </Text>
            <View style={styles.ongoingBottom}>
              <Text style={styles.ongoingWith}>
                Avec {overview.ongoing.confirmedMatch?.user?.firstname ?? "votre binôme"}
              </Text>
              <Text style={styles.ongoingAction}>Suivre le trajet</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("RecordJourney")}
          accessibilityRole="button"
          accessibilityLabel="Demander un accompagnement"
        >
          <Icon name="navigation" size={18} color={colors.textOnDark} />
          <Text style={styles.primaryButtonText}>Demander un accompagnement</Text>
        </TouchableOpacity>

        {overview.pending.length > 0 ? (
          <View testID="home-pending">
            <Text style={styles.sectionTitle}>Demandes à répondre</Text>
            {overview.pending.map((journey) => (
              <TouchableOpacity
                key={journey.id}
                style={styles.pendingCard}
                onPress={() => openJourney(journey.id)}
                accessibilityRole="button"
                accessibilityLabel={`${journey.pendingCount} demande${journey.pendingCount > 1 ? "s" : ""} en attente pour le trajet du ${formatShortDate(journey.departureTime)}, répondre`}
              >
                <View style={styles.pendingIcon}>
                  <Icon name="user-plus" size={16} color={colors.warning} />
                </View>
                <View style={styles.pendingBody}>
                  <Text style={styles.pendingTitle}>
                    {journey.pendingCount} demande{journey.pendingCount > 1 ? "s" : ""} en attente
                  </Text>
                  <Text style={styles.pendingRoute} numberOfLines={1}>
                    {formatShortDate(journey.departureTime)} · {journey.departureAddress}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* While a journey is under way and no other follows, the banner above
            already says what is happening: an empty "next journey" card here
            would answer "no upcoming journey" to someone who is travelling. */}
        {showNext ? <Text style={styles.sectionTitle}>Votre prochain trajet</Text> : null}

        {!showNext ? null : loading ? (
          <View style={styles.skeletonCard} testID="home-skeleton">
            <View style={[styles.skeleton, { width: "40%" }]} />
            <View style={[styles.skeleton, { width: "80%" }]} />
            <View style={[styles.skeleton, { width: "65%" }]} />
          </View>
        ) : overview.next ? (
          <TouchableOpacity
            style={styles.journeyCard}
            onPress={() => openJourney(overview.next.id)}
            accessibilityRole="button"
            accessibilityLabel={`Prochain trajet du ${formatShortDate(overview.next.departureTime)}, ${overview.next.departureAddress} vers ${overview.next.arrivalAddress}`}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{formatShortDate(overview.next.departureTime)}</Text>
              {overview.next.confirmedMatch ? (
                <View style={styles.confirmedBadge}>
                  <Icon name="check" size={11} color={colors.successText} />
                  <Text style={styles.confirmedText}>Confirmé</Text>
                </View>
              ) : overview.next.pendingCount > 0 ? (
                <View style={styles.pendingBadge}>
                  <Icon name="clock" size={11} color={colors.warning} />
                  <Text style={styles.pendingText}>
                    {overview.next.pendingCount} demande{overview.next.pendingCount > 1 ? "s" : ""}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.leg}>
              <Icon name="map-pin" size={14} color={colors.tealDark} />
              <Text style={styles.legText} numberOfLines={1}>{overview.next.departureAddress}</Text>
              <Text style={styles.legTime}>{formatTime(overview.next.departureTime)}</Text>
            </View>
            <View style={styles.leg}>
              <Icon name="flag" size={14} color={colors.textLight} />
              <Text style={styles.legText} numberOfLines={1}>{overview.next.arrivalAddress}</Text>
              <Text style={styles.legTime}>{formatTime(overview.next.arrivalTime)}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard} testID="home-empty">
            <Icon name="calendar" size={20} color={colors.textLight} />
            <Text style={styles.emptyText}>
              {overview.searching.length > 0
                ? "Aucun accompagnement confirmé pour l'instant. Vos demandes sont en cours de recherche."
                : "Aucun trajet à venir. Demandez un accompagnement pour commencer."}
            </Text>
          </View>
        )}

        {overview.searching.length > 0 ? (
          <View testID="home-searching">
            <Text style={styles.sectionTitle}>En recherche d&apos;accompagnateur</Text>
            {overview.searching.map((journey) => (
              <TouchableOpacity
                key={journey.id}
                style={styles.searchingCard}
                onPress={() => openJourney(journey.id)}
                accessibilityRole="button"
                accessibilityLabel={`Trajet du ${formatShortDate(journey.departureTime)}, ${journey.departureAddress} vers ${journey.arrivalAddress}, en recherche d'accompagnateur`}
              >
                <View style={styles.searchingIcon}>
                  <Icon name="search" size={15} color={colors.tealDark} />
                </View>
                <View style={styles.pendingBody}>
                  <Text style={styles.searchingRoute} numberOfLines={1}>
                    {journey.departureAddress} → {journey.arrivalAddress}
                  </Text>
                  <Text style={styles.searchingMeta}>
                    {formatShortDate(journey.departureTime)} · {formatTime(journey.departureTime)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Raccourcis</Text>
        <View style={styles.shortcuts} testID="home-shortcuts">
          {SHORTCUTS.map((shortcut) => (
            <TouchableOpacity
              key={shortcut.screen}
              style={styles.shortcut}
              onPress={() => navigation.navigate(shortcut.screen)}
              accessibilityRole="button"
              accessibilityLabel={shortcut.label}
            >
              <Icon name={shortcut.icon} size={19} color={colors.tealDark} />
              <Text style={styles.shortcutText}>{shortcut.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  ongoingCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 20,
    gap: 10,
    ...shadow.card,
  },
  ongoingTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  livePulse: { width: 9, height: 9, borderRadius: radius.full, backgroundColor: colors.teal },
  ongoingLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.teal,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  ongoingRoute: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.textOnDark },
  ongoingBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ongoingWith: { fontSize: 13, fontFamily: fonts.body, color: colors.navyLight },
  ongoingAction: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.teal },
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
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  pendingIcon: {
    width: 38, height: 38, borderRadius: radius.full,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.sand,
  },
  pendingBody: { flex: 1, gap: 3 },
  pendingTitle: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.navy },
  pendingRoute: { fontSize: 12, fontFamily: fonts.body, color: colors.textMedium },
  searchingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  searchingIcon: {
    width: 38, height: 38, borderRadius: radius.full,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.tealLight,
  },
  searchingRoute: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.navy },
  searchingMeta: { fontSize: 12, fontFamily: fonts.body, color: colors.textMedium },
  shortcuts: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  shortcut: {
    flexGrow: 1,
    flexBasis: "45%",
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  shortcutText: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.navy },
  emptyCard: {
    alignItems: "center", gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 32, paddingHorizontal: 24, ...shadow.card,
  },
  emptyText: { fontSize: 14, fontFamily: fonts.body, color: colors.textMedium, textAlign: "center", lineHeight: 20 },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, gap: 12, ...shadow.card },
  skeleton: { height: 14, borderRadius: radius.sm, backgroundColor: colors.beige },
});
