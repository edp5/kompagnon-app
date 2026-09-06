import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
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

import EmergencyAlert from "../components/EmergencyAlert";
import Icon from "../components/Icon";
import JourneyFollowCard from "../components/JourneyFollowCard";
import JourneyMap from "../components/JourneyMap";
import JourneyReviewCard from "../components/JourneyReviewCard";
import MeetingCode from "../components/MeetingCode";
import StarRating from "../components/StarRating";
import { colors, fonts, layout, radius, shadow } from "../theme/tokens";
import { formatShortDate, formatTime } from "../utils/format";
import { getJourney, getJourneyMatches, matchState, updateFoundJourneyStatus } from "../utils/journeys";
import { distanceInMetres } from "../utils/proximity";
import { getWalkingRoute } from "../utils/routing";
import { getSession } from "../utils/session";
import { getUserProfile } from "../utils/users";

// Two addresses geocode a few dozen metres apart when they name the same place
// from either side of a square, so "the same trip" has to be a distance rather
// than an equality.
const SAME_TRIP_M = 200;

/**
 * Whether the pair's trip is different enough from the user's to be worth
 * drawing on its own. Anything that cannot be measured counts as the same trip:
 * a second line drawn on a guess is worse than no second line.
 * @param {object} mine - The user's trip, as the map takes it.
 * @param {object} theirs - The pair's trip, as the map takes it.
 * @returns {boolean} True when their trip deserves its own line.
 */
function goesElsewhere(mine, theirs) {
  if (!mine || !theirs) {
    return false;
  }

  const atStart = distanceInMetres(mine.departure, theirs.departure);
  const atEnd = distanceInMetres(mine.arrival, theirs.arrival);
  if (atStart === null || atEnd === null) {
    return false;
  }

  return atStart > SAME_TRIP_M || atEnd > SAME_TRIP_M;
}

export default function JourneyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { journeyId } = route.params ?? {};

  const [journey, setJourney] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [livePositions, setLivePositions] = useState([]);
  const [trustedContact, setTrustedContact] = useState(null);
  const [walkingRoute, setWalkingRoute] = useState(null);

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

    const [journeyResult, matchesResult, profileResult] = await Promise.all([
      getJourney({ token: session.token, journeyId }),
      getJourneyMatches({ token: session.token, journeyId }),
      getUserProfile({ token: session.token }),
    ]);

    setTrustedContact(profileResult.success ? profileResult.profile?.trustedContact ?? null : null);

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
      AccessibilityInfo.announceForAccessibility(accept ? "Demande acceptée." : "Demande refusée.");
      load();
    },
    [load],
  );

  const openChat = useCallback(
    (match) => {
      navigation.navigate("Chat", {
        foundJourneyId: match.foundJourneyId,
        otherName: [match.user?.firstname, match.user?.lastname].filter(Boolean).join(" ") || "Votre binôme",
      });
    },
    [navigation],
  );

  useEffect(() => {
    load();
  }, [load]);

  const confirmedMatch = matches.find((item) => matchState(item).confirmed) ?? null;
  // Once the trip is behind them, following it live and warning someone about it
  // are noise; what is left to do is say how it went.
  const journeyIsOver = journey?.arrivalTime ? new Date(journey.arrivalTime) < new Date() : false;
  const otherTrip = matches.map((item) => item.journey).find((trip) => trip && trip.departureLat != null);
  const mapMine = journey && journey.departureLat != null
    ? {
        departure: { lat: journey.departureLat, lon: journey.departureLon, label: journey.departureAddress },
        arrival: { lat: journey.arrivalLat, lon: journey.arrivalLon, label: journey.arrivalAddress },
      }
    : null;
  const otherTripPath = otherTrip
    ? {
        departure: { lat: otherTrip.departureLat, lon: otherTrip.departureLon, label: otherTrip.departureAddress },
        arrival: { lat: otherTrip.arrivalLat, lon: otherTrip.arrivalLon, label: otherTrip.arrivalAddress },
      }
    : undefined;

  // The pair's trip is only worth its own line when it actually goes somewhere
  // else. A companion who meets you at the door and rides to the same place has
  // your trip, and drawing it again puts a second path across the map that
  // looks like a mistake — which is what it looked like.
  const mapOther = goesElsewhere(mapMine, otherTripPath) ? otherTripPath : undefined;

  // The walking path is asked for after the journey is on screen, never before:
  // the map is readable without it, and a routing service being slow must not
  // hold up the rest of the page.
  // Held by their coordinates rather than by identity: the objects above are
  // rebuilt on every render, and asking for the same route each time would
  // hammer the routing service for nothing.
  const ends = useMemo(
    () => (mapMine ? { from: mapMine.departure, to: mapMine.arrival } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapMine?.departure?.lat, mapMine?.departure?.lon, mapMine?.arrival?.lat, mapMine?.arrival?.lon],
  );

  useEffect(() => {
    let current = true;
    if (!ends) {
      return undefined;
    }

    getWalkingRoute(ends).then((found) => {
      if (current) {
        setWalkingRoute(found);
      }
    });

    return () => {
      current = false;
    };
  }, [ends]);

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
            <Icon name="arrow-left" size={22} color={colors.navy} />
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
            <View
              style={styles.card}
              accessible
              accessibilityLabel={`Trajet du ${formatShortDate(journey.departureTime)}. Départ ${journey.departureAddress} à ${formatTime(journey.departureTime)}. Arrivée ${journey.arrivalAddress} à ${formatTime(journey.arrivalTime)}.`}
            >
              <Text style={styles.date}>{formatShortDate(journey.departureTime)}</Text>

              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <Icon name="map-pin" size={15} color={colors.tealDark} />
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepHead}>
                    <Text style={styles.stepLabel}>Départ</Text>
                    <Text style={styles.stepTime}>{formatTime(journey.departureTime)}</Text>
                  </View>
                  <Text style={styles.stepValue}>{journey.departureAddress}</Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepIcon}>
                  <Icon name="flag" size={15} color={colors.tealDark} />
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepHead}>
                    <Text style={styles.stepLabel}>Arrivée</Text>
                    <Text style={styles.stepTime}>{formatTime(journey.arrivalTime)}</Text>
                  </View>
                  <Text style={styles.stepValue}>{journey.arrivalAddress}</Text>
                </View>
              </View>
            </View>

            {mapMine && (
              <>
                <Text style={styles.sectionTitle}>Itinéraire</Text>
                <JourneyMap
                  mine={mapMine}
                  other={mapOther}
                  meeting={mapMine.departure}
                  positions={livePositions}
                  route={walkingRoute}
                />
              </>
            )}

            {confirmedMatch && journeyIsOver && (
              <JourneyReviewCard
                foundJourneyId={confirmedMatch.foundJourneyId}
                otherName={confirmedMatch.user?.firstname}
              />
            )}

            {confirmedMatch && !journeyIsOver && (
              <MeetingCode
                code={confirmedMatch.meetingCode}
                otherName={confirmedMatch.user?.firstname}
              />
            )}

            {confirmedMatch && !journeyIsOver && (
              <EmergencyAlert
                foundJourneyId={confirmedMatch.foundJourneyId}
                contact={trustedContact}
                onNoContact={() => navigation.navigate("Profile")}
              />
            )}

            {confirmedMatch && !journeyIsOver && (
              <JourneyFollowCard
                foundJourneyId={confirmedMatch.foundJourneyId}
                otherName={confirmedMatch.user?.firstname}
                onPositions={setLivePositions}
              />
            )}

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
                  onChat={openChat}
                />
              ))
            ) : (
              <View style={styles.emptyCard} testID="journey-detail-no-match">
                <Icon name="clock" size={20} color={colors.textLight} />
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
function MatchCard({ match, responding, onRespond, onCall, onChat }) {
  const state = matchState(match);
  const firstname = match.user?.firstname;
  const fullName = [firstname, match.user?.lastname].filter(Boolean).join(" ") || "votre binôme";

  return (
    <View style={styles.card} testID={`match-card-${match.foundJourneyId}`}>
      <View
        style={styles.personRow}
        accessible
        accessibilityLabel={`${fullName}, ${
          state.confirmed ? "trajet confirmé" : state.actionable ? "demande à confirmer" : "en attente de réponse"
        }`}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(firstname?.[0] ?? "?").toUpperCase()}</Text>
        </View>
        <View style={styles.personBody}>
          <Text style={styles.personName}>
            {firstname} {match.user?.lastname}
          </Text>
          {match.user?.reputation?.count > 0 ? (
            <View style={styles.reputationRow}>
              <StarRating
                value={Math.round(match.user.reputation.average)}
                label={`Note de ${firstname ?? "cette personne"}`}
                testID={`match-reputation-${match.foundJourneyId}`}
              />
              <Text style={styles.reputationText}>
                {String(match.user.reputation.average).replace(".", ",")} ·{" "}
                {match.user.reputation.count} trajet{match.user.reputation.count > 1 ? "s" : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.reputationText}>Pas encore de trajet noté</Text>
          )}
          {state.confirmed ? (
            <View style={styles.confirmedBadge}>
              <Icon name="check" size={11} color={colors.successText} />
              <Text style={styles.confirmedText}>Trajet confirmé</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Icon name="clock" size={11} color={colors.warning} />
              <Text style={styles.pendingText}>
                {state.actionable ? "À confirmer" : "En attente"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={styles.otherTrip}
        accessible
        accessibilityLabel={`Son trajet : départ ${match.journey?.departureAddress ?? "adresse inconnue"} à ${formatTime(match.journey?.departureTime)}, arrivée ${match.journey?.arrivalAddress ?? "adresse inconnue"} à ${formatTime(match.journey?.arrivalTime)}.`}
      >
        <Text style={styles.otherTripTitle}>Son trajet</Text>
        <View style={styles.otherTripRow}>
          <Icon name="map-pin" size={13} color={colors.textLight} />
          <Text style={styles.otherTripText}>
            {match.journey?.departureAddress}
          </Text>
          <Text style={styles.otherTripTime}>{formatTime(match.journey?.departureTime)}</Text>
        </View>
        <View style={styles.otherTripRow}>
          <Icon name="flag" size={13} color={colors.textLight} />
          <Text style={styles.otherTripText}>
            {match.journey?.arrivalAddress}
          </Text>
          <Text style={styles.otherTripTime}>{formatTime(match.journey?.arrivalTime)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => onChat(match)}
        accessibilityRole="button"
        accessibilityLabel={`Discuter avec ${firstname ?? "votre binôme"}`}
        testID={`match-chat-${match.foundJourneyId}`}
      >
        <Icon name="message-circle" size={16} color={colors.tealDark} />
        <Text style={styles.chatButtonText}>Discuter</Text>
      </TouchableOpacity>

      {state.confirmed &&
        (match.user?.phoneNumber ? (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCall(match.user.phoneNumber)}
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${firstname ?? "votre binôme"}`}
          >
            <Icon name="phone" size={16} color={colors.textOnDark} />
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
    ...layout.content,
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
  // The label and the time are both short pieces of metadata, so they share a
  // line and leave the address the full width of the card. Side by side with
  // the address, the time squeezed it to eighteen characters a line.
  stepHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textLight,
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
  reputationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  reputationText: { fontSize: 12, fontFamily: fonts.body, color: colors.textMedium, marginTop: 2 },
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
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    minHeight: 46,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.tealLight,
    backgroundColor: colors.surface,
  },
  chatButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.tealDark,
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
    // Top-aligned: an address long enough to wrap should push the icon and the
    // time to its first line, not float them against its middle.
    alignItems: "flex-start",
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
    // The time is short and always fits; the address is what has to give way.
    flexShrink: 0,
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
