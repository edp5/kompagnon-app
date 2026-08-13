import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
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
import { getUpcomingConfirmedJourneys } from "../utils/journeys";
import { getSession } from "../utils/session";

export default function JourneysScreen() {
  const navigation = useNavigation();

  const [journeys, setJourneys] = useState([]);
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

    const result = await getUpcomingConfirmedJourneys({ token: session.token });
    if (result.success) {
      setJourneys(result.journeys);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  // Reload on focus so a journey confirmed elsewhere shows up on the way back.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
          <Text style={styles.title}>Mes prochains trajets</Text>
          <Text style={styles.subtitle}>Vos accompagnements confirmés</Text>
        </View>

        {loading && (
          <View style={styles.centered} testID="journeys-loading">
            <ActivityIndicator color={colors.teal} accessibilityLabel="Chargement…" />
          </View>
        )}

        {!loading && error && (
          <View
            style={styles.errorContainer}
            testID="journeys-error"
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

        {!loading && !error && journeys.length === 0 && (
          <View style={styles.emptyCard} testID="journeys-empty">
            <Feather name="calendar" size={22} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Aucun trajet confirmé</Text>
            <Text style={styles.emptyText}>
              Vos trajets apparaîtront ici une fois qu&apos;un accompagnement aura été confirmé.
            </Text>
          </View>
        )}

        {!loading && !error && journeys.map((journey) => (
          <TouchableOpacity
            key={journey.id}
            style={styles.journeyCard}
            onPress={() => navigation.navigate("JourneyDetail", { journeyId: journey.id })}
            accessibilityRole="button"
            accessibilityLabel={`Trajet du ${formatShortDate(journey.departureTime)}, ${journey.departureAddress} vers ${journey.arrivalAddress}`}
            testID={`journey-card-${journey.id}`}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{formatShortDate(journey.departureTime)}</Text>
              <View style={styles.confirmedBadge}>
                <Feather name="check" size={11} color={colors.successText} />
                <Text style={styles.confirmedText}>Confirmé</Text>
              </View>
            </View>

            <View style={styles.leg}>
              <Feather name="map-pin" size={14} color={colors.tealDark} />
              <Text style={styles.legText} numberOfLines={1}>{journey.departureAddress}</Text>
              <Text style={styles.legTime}>{formatTime(journey.departureTime)}</Text>
            </View>
            <View style={styles.leg}>
              <Feather name="flag" size={14} color={colors.textLight} />
              <Text style={styles.legText} numberOfLines={1}>{journey.arrivalAddress}</Text>
              <Text style={styles.legTime}>{formatTime(journey.arrivalTime)}</Text>
            </View>

            {journey.match?.user && (
              <View style={styles.withUser}>
                <Feather name="user" size={13} color={colors.textMedium} />
                <Text style={styles.withUserText}>
                  Avec {journey.match.user.firstname} {journey.match.user.lastname}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMedium,
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
  emptyCard: {
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 36,
    paddingHorizontal: 24,
    ...shadow.card,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.navy,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 20,
  },
  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    ...shadow.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardDate: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
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
  leg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  legText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.navy,
  },
  legTime: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMedium,
  },
  withUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  withUserText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMedium,
  },
});
