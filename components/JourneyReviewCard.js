import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import { getMyJourneyReview, reviewJourney } from "../utils/reviews";
import { getSession } from "../utils/session";
import StarRating from "./StarRating";

/**
 * What the user thought of a journey they travelled, asked once it is over.
 *
 * A review already written comes back rather than being asked for again: the
 * card then offers to change it, which is the only honest way to let someone
 * revise an opinion without letting them weigh on the same trip twice.
 *
 * @param {object} props
 * @param {number} props.foundJourneyId - The journey being reviewed.
 * @param {string} [props.otherName]    - First name of the pair, for the copy.
 */
export default function JourneyReviewCard({ foundJourneyId, otherName }) {
  const [existing, setExisting] = useState(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      return;
    }
    const result = await getMyJourneyReview({ token: session.token, foundJourneyId });
    if (result.success && result.review) {
      setExisting(result.review);
      setRating(result.review.rating);
      setComment(result.review.comment ?? "");
    }
  }, [foundJourneyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setError(null);
    if (rating < 1) {
      setError("Choisissez une note avant d'enregistrer.");
      return;
    }

    setSaving(true);
    const session = await getSession();
    if (!session) {
      setSaving(false);
      setError("Votre session a expiré. Reconnectez-vous.");
      return;
    }

    const result = await reviewJourney({
      token: session.token,
      foundJourneyId,
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setExisting({ rating, comment: comment.trim() || null });
    setEditing(false);
  }

  const who = otherName ?? "votre binôme";
  const showForm = editing || !existing;

  return (
    <View style={styles.card} testID="journey-review">
      <Text style={styles.title}>Votre avis sur ce trajet</Text>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      )}

      {!showForm ? (
        <>
          <StarRating value={existing.rating} label={`Votre note pour ${who}`} testID="review-given" />
          {existing.comment ? <Text style={styles.comment}>{existing.comment}</Text> : null}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Modifier mon avis"
            testID="review-edit"
          >
            <Text style={styles.secondaryText}>Modifier mon avis</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.explanation}>
            Comment s&apos;est passé ce trajet avec {who} ? Votre note aide les
            prochaines personnes à choisir.
          </Text>

          <StarRating value={rating} onChange={setRating} testID="review-rating" />

          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Un mot à ajouter ? (facultatif)"
            placeholderTextColor={colors.textLight}
            multiline
            accessibilityLabel="Commentaire sur le trajet, facultatif"
            testID="review-comment"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Enregistrer mon avis"
            testID="review-save"
          >
            {saving ? (
              <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Enregistrement…" />
            ) : (
              <Text style={styles.primaryText}>Enregistrer mon avis</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 20,
    gap: 12,
    ...shadow.card,
  },
  title: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy },
  explanation: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 19 },
  comment: { fontSize: 14, fontFamily: fonts.body, color: colors.navy, lineHeight: 20 },
  error: { fontSize: 13, fontFamily: fonts.body, color: colors.danger },
  input: {
    minHeight: 72,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.navy,
    textAlignVertical: "top",
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.teal,
  },
  primaryText: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.textOnDark },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.bg,
  },
  secondaryText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.teal },
});
