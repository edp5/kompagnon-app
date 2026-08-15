import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import { formatShortDate, formatTime } from "../utils/format";
import { getJourney, getJourneyMatches, isConfirmedMatch } from "../utils/journeys";
import { getSession } from "../utils/session";

export default function JourneyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { journeyId } = route.params ?? {};

  const [journey, setJourney] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const session = await getSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous.");
      setLoading(false);
      return;
    }

    const [journeyResult, matchesResult] = await Promise.all([
      getJourney({ token: session.token, journeyId }),
      getJourneyMatches({ token: session.token, journeyId }),
    ]);

    if (!journeyResult.success) {
      setError(journeyResult.message);
      setLoading(false);
      return;
    }

    setJourney(journeyResult.journey);
    setMatch((matchesResult.matches ?? []).find(isConfirmedMatch) ?? null);
    setLoading(false);
  }, [journeyId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Feather name="arrow-left" size={22} color={colors.navy} />
          </TouchableOpacity>
          <Text style={styles.title}>Détail du trajet</Text>
        </View>

        {loading && (
          <View style={styles.centered} testID="journey-detail-loading">
            <ActivityIndicator color={colors.teal} accessibilityLabel="Chargement…" />
          </View>
        )}

        {!loading && error && (
          <View
            style={styles.errorContainer}
            testID="journey-detail-error"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={load}
              accessibilityRole="button"
              accessibilityLabel="Réessayer"
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && journey && (
          <>
            <View style={styles.card}>
              <Text style={styles.date}>{formatShortDate(journey.departureTime)}</Text>

              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <Feather name="map-pin" size={15} color={colors.tealDark} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepLabel}>Départ</Text>
                  <Text style={styles.stepValue}>{journey.departureAddress}</Text>
                </View>
                <Text style={styles.stepTime}>{formatTime(journey.departureTime)}</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <Feather name="flag" size={15} color={colors.tealDark} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepLabel}>Arrivée</Text>
                  <Text style={styles.stepValue}>{journey.arrivalAddress}</Text>
                </View>
                <Text style={styles.stepTime}>{formatTime(journey.arrivalTime)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Votre accompagnement</Text>

            {match ? (
              <View style={styles.card} testID="journey-detail-match">
                <View style={styles.personRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(match.user?.firstname?.[0] ?? "?").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.personBody}>
                    <Text style={styles.personName}>
                      {match.user?.firstname} {match.user?.lastname}
                    </Text>
                    <View style={styles.confirmedBadge}>
                      <Feather name="check" size={11} color={colors.successText} />
                      <Text style={styles.confirmedText}>Trajet confirmé</Text>
                    </View>
                  </View>
                </View>

                {match.user?.phoneNumber && (
                  <View style={styles.contactRow}>
                    <Feather name="phone" size={14} color={colors.tealDark} />
                    <Text style={styles.contactText}>{match.user.phoneNumber}</Text>
                  </View>
                )}

                <View style={styles.otherTrip}>
                  <Text style={styles.otherTripTitle}>Son trajet</Text>
                  <View style={styles.otherTripRow}>
                    <Feather name="map-pin" size={13} color={colors.textLight} />
                    <Text style={styles.otherTripText} numberOfLines={1}>
                      {match.journey?.departureAddress}
                    </Text>
                    <Text style={styles.otherTripTime}>
                      {formatTime(match.journey?.departureTime)}
                    </Text>
                  </View>
                  <View style={styles.otherTripRow}>
                    <Feather name="flag" size={13} color={colors.textLight} />
                    <Text style={styles.otherTripText} numberOfLines={1}>
                      {match.journey?.arrivalAddress}
                    </Text>
                    <Text style={styles.otherTripTime}>
                      {formatTime(match.journey?.arrivalTime)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard} testID="journey-detail-no-match">
                <Feather name="clock" size={20} color={colors.textLight} />
                <Text style={styles.emptyText}>
                  Ce trajet n&apos;a pas encore d&apos;accompagnement confirmé.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...shadow.card,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  centered: {
    paddingVertical: 48,
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: colors.dangerBg,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    alignItems: "flex-start",
    gap: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  retryText: {
    color: colors.navy,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 24,
    ...shadow.card,
  },
  date: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.tealDark,
    marginBottom: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBody: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textLight,
    marginBottom: 2,
  },
  stepValue: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.navy,
  },
  stepTime: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.navy,
    marginBottom: 12,
    marginLeft: 4,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fonts.displayBlack,
    color: colors.tealDark,
  },
  personBody: {
    flex: 1,
    gap: 6,
  },
  personName: {
    fontSize: 17,
    fontFamily: fonts.displayBold,
    color: colors.navy,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
  },
  confirmedText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.successText,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  contactText: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.navy,
  },
  otherTrip: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  otherTripTitle: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textLight,
    marginBottom: 10,
  },
  otherTripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  otherTripText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.navy,
  },
  otherTripTime: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMedium,
  },
  emptyCard: {
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 28,
    paddingHorizontal: 24,
    ...shadow.card,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 20,
  },
});
