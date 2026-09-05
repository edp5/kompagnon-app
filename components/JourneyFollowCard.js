import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import { createShareLink, getPositions, recordPosition } from "../utils/following";
import { getCurrentPosition } from "../utils/location";
import { getSession } from "../utils/session";

// Foreground only, and only while the card is on screen: the app never follows
// anyone in the background.
const REPORT_INTERVAL_MS = 15000;
const READ_INTERVAL_MS = 15000;

/**
 * Live following of a confirmed journey: the user chooses to share their own
 * position, sees where their pair is, and can hand a relative a link to follow
 * the trip.
 *
 * @param {object}   props
 * @param {number}   props.foundJourneyId - The journey being followed.
 * @param {string}   [props.otherName]    - First name of the pair, for the copy.
 * @param {Function} [props.onPositions]  - Called with the latest positions, for the map.
 */
export default function JourneyFollowCard({ foundJourneyId, otherName, onPositions }) {
  const [sharingPosition, setSharingPosition] = useState(false);
  const [positions, setPositions] = useState([]);
  const [creatingLink, setCreatingLink] = useState(false);
  const [error, setError] = useState(null);
  const reportTimer = useRef(null);

  const readPositions = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      return;
    }
    const result = await getPositions({ token: session.token, foundJourneyId });
    if (result.success) {
      setPositions(result.positions);
      onPositions?.(result.positions);
    }
  }, [foundJourneyId, onPositions]);

  // Reading where the pair is does not require sharing your own position.
  useEffect(() => {
    readPositions();
    const timer = setInterval(readPositions, READ_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [readPositions]);

  const reportPosition = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      return;
    }
    const position = await getCurrentPosition();
    if (!position.granted) {
      setError("Autorisez la localisation pour partager votre position.");
      setSharingPosition(false);
      return;
    }
    await recordPosition({
      token: session.token,
      foundJourneyId,
      lat: position.latitude,
      lon: position.longitude,
    });
    readPositions();
  }, [foundJourneyId, readPositions]);

  useEffect(() => {
    if (!sharingPosition) {
      return undefined;
    }
    reportPosition();
    reportTimer.current = setInterval(reportPosition, REPORT_INTERVAL_MS);
    return () => clearInterval(reportTimer.current);
  }, [sharingPosition, reportPosition]);

  async function onShareJourney() {
    setError(null);
    setCreatingLink(true);
    const session = await getSession();
    if (!session) {
      setCreatingLink(false);
      setError("Votre session a expiré. Reconnectez-vous.");
      return;
    }

    const result = await createShareLink({ token: session.token, foundJourneyId });
    setCreatingLink(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    try {
      await Share.share({
        message: `Suivez mon trajet Kompagnon en direct : ${result.share.url}`,
      });
    } catch {
      // Dismissing the share sheet is not an error; show the link as a fallback.
      Alert.alert("Lien de suivi", result.share.url);
    }
  }

  const theirPosition = positions.find((position) => !position.mine);

  return (
    <View style={styles.card} testID="journey-follow-card">
      <Text style={styles.title}>Suivi du trajet</Text>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      )}

      <View style={styles.row}>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Partager ma position</Text>
          <Text style={styles.rowText}>
            {sharingPosition
              ? "Votre position est visible pendant le trajet."
              : `Permet à ${otherName ?? "votre binôme"} de vous localiser.`}
          </Text>
        </View>
        <Switch
          value={sharingPosition}
          onValueChange={setSharingPosition}
          trackColor={{ true: colors.teal, false: colors.sand }}
          accessibilityRole="switch"
          accessibilityLabel="Partager ma position"
          accessibilityState={{ checked: sharingPosition }}
          testID="follow-position-switch"
        />
      </View>

      <Text style={styles.status} testID="follow-status">
        {theirPosition
          ? `${theirPosition.firstname ?? "Votre binôme"} partage sa position.`
          : `${otherName ?? "Votre binôme"} ne partage pas encore sa position.`}
      </Text>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={onShareJourney}
        disabled={creatingLink}
        accessibilityRole="button"
        accessibilityLabel="Partager mon trajet avec un proche"
        testID="follow-share-button"
      >
        {creatingLink ? (
          <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Création du lien…" />
        ) : (
          <Text style={styles.shareButtonText}>Partager mon trajet à un proche</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.hint}>Le lien permet de suivre le trajet et expire au bout de 24 h.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 24, ...shadow.card,
  },
  title: { fontSize: 16, fontFamily: fonts.displayBold, color: colors.navy, marginBottom: 14 },
  error: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.danger, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.navy, marginBottom: 2 },
  rowText: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 18 },
  status: {
    fontSize: 13, fontFamily: fonts.body, color: colors.textMedium,
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.beige,
  },
  shareButton: {
    alignItems: "center", justifyContent: "center", minHeight: 48, paddingVertical: 14,
    borderRadius: radius.full, backgroundColor: colors.teal, marginTop: 14,
  },
  shareButtonText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textOnDark },
  hint: { fontSize: 12, fontFamily: fonts.body, color: colors.textLight, textAlign: "center", marginTop: 8 },
});
