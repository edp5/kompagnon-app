import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import { formatShortDate, formatTime } from "../utils/format";
import { getJourney, getJourneyMatches, matchState, updateFoundJourneyStatus } from "../utils/journeys";
import { getSession } from "../utils/session";

export default function JourneyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { journeyId } = route.params ?? {};

  const [journey, setJourney] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingId, setRespondingId] = useState(null);

  const handleCall = useCallback((phoneNumber) => {
    const url = `tel:${String(phoneNumber).replace(/\s+/g, "")}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Appel impossible", "Impossible de lancer l'appel depuis cet appareil.");
    });
  }, []);

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
    setMatches(matchesResult.matches ?? []);
    setLoading(false);
  }, [journeyId]);

  const onRespond = useCallback(
    async (foundJourneyId, accept) => {
      const session = await getSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous.");
        return;
      }
      setRespondingId(foundJourneyId);
      const result = await updateFoundJourneyStatus({ token: session.token, foundJourneyId, accept });
      setRespondingId(null);
      if (!result.success) {
        Alert.alert("Action impossible", result.message);
        return;
      }
      load();
    },
    [load],
  );

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

            <Text style={styles.sectionTitle}>
              {matches.length > 1 ? "Vos correspondances" : "Votre correspondance"}
            </Text>

            {matches.length > 0 ? (
              matches.map((item) => (
                <MatchCard
                  key={item.foundJourneyId}
                  match={item}
                  responding={respondingId === item.foundJourneyId}
                  onRespond={onRespond}
                  onCall={handleCall}
                />
              ))
            ) : (
              <View style={styles.emptyCard} testID="journey-detail-no-match">
                <Feather name="clock" size={20} color={colors.textLight} />
                <Text style={styles.emptyText}>
                  Ce trajet n&apos;a pas encore de correspondance.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * One match on the journey details screen. Confirmed matches expose a call
 * button; matches still awaiting the user's answer expose accept/reject buttons.
 * @param {{ match: object, responding: boolean, onRespond: Function, onCall: Function }} props
 */
function MatchCard({ match, responding, onRespond, onCall }) {
  const state = matchState(match);
  const firstname = match.user?.firstname;

  return (
    <View style={styles.card} testID={`match-card-${match.foundJourneyId}`}>
      <View style={styles.personRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(firstname?.[0] ?? "?").toUpperCase()}</Text>
        </View>
        <View style={styles.personBody}>
          <Text style={styles.personName}>
            {firstname} {match.user?.lastname}
          </Text>
          {state.confirmed ? (
            <View style={styles.confirmedBadge}>
              <Feather name="check" size={11} color={colors.successText} />
              <Text style={styles.confirmedText}>Trajet confirmé</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Feather name="clock" size={11} color={colors.warning} />
              <Text style={styles.pendingText}>
                {state.actionable ? "À confirmer" : "En attente"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.otherTrip}>
        <Text style={styles.otherTripTitle}>Son trajet</Text>
        <View style={styles.otherTripRow}>
          <Feather name="map-pin" size={13} color={colors.textLight} />
          <Text style={styles.otherTripText} numberOfLines={1}>
            {match.journey?.departureAddress}
          </Text>
          <Text style={styles.otherTripTime}>{formatTime(match.journey?.departureTime)}</Text>
        </View>
        <View style={styles.otherTripRow}>
          <Feather name="flag" size={13} color={colors.textLight} />
          <Text style={styles.otherTripText} numberOfLines={1}>
            {match.journey?.arrivalAddress}
          </Text>
          <Text style={styles.otherTripTime}>{formatTime(match.journey?.arrivalTime)}</Text>
        </View>
      </View>

      {state.confirmed &&
        (match.user?.phoneNumber ? (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCall(match.user.phoneNumber)}
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${firstname ?? "votre binôme"}`}
          >
            <Feather name="phone" size={16} color={colors.textOnDark} />
            <Text style={styles.callButtonText}>Appeler</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.contactUnavailable}>Coordonnées indisponibles pour le moment.</Text>
        ))}

      {state.actionable && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectButton, responding && styles.buttonDisabled]}
            onPress={() => onRespond(match.foundJourneyId, false)}
            disabled={responding}
            accessibilityRole="button"
            accessibilityLabel={`Refuser la demande de ${firstname ?? "cette personne"}`}
          >
            <Text style={styles.rejectText}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, responding && styles.buttonDisabled]}
            onPress={() => onRespond(match.foundJourneyId, true)}
            disabled={responding}
            accessibilityRole="button"
            accessibilityLabel={`Accepter la demande de ${firstname ?? "cette personne"}`}
          >
            {responding ? (
              <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Envoi…" />
            ) : (
              <Text style={styles.acceptText}>Accepter</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {state.message && <Text style={styles.awaitingText}>{state.message}</Text>}
    </View>
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
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
  },
  callButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.textOnDark,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.sand,
  },
  pendingText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.warning,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
  },
  acceptText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.textOnDark,
  },
  rejectButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.surface,
  },
  rejectText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  awaitingText: {
    marginTop: 16,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMedium,
    lineHeight: 19,
  },
  contactUnavailable: {
    marginTop: 16,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textLight,
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
