import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius } from "../theme/tokens";
import Icon from "./Icon";

const STARS = [1, 2, 3, 4, 5];

// An unfilled star is still a control: it has to be visible to someone with low
// vision, so it takes the text colour rather than a pale tint nobody can see.

// A number alone tells a screen reader nothing about what it means, and stars
// tell it nothing at all. Each one says what choosing it would mean.
const MEANINGS = {
  1: "Très mauvais",
  2: "Mauvais",
  3: "Correct",
  4: "Bien",
  5: "Très bien",
};

/**
 * A rating out of five.
 *
 * Read-only it is a single sentence for a screen reader; editable each star is
 * its own button announcing what picking it would mean, because "star" repeated
 * five times is not a choice anyone can make by ear.
 *
 * @param {object} props
 * @param {number} [props.value]    - The rating, 1 to 5, or 0 when unset.
 * @param {Function} [props.onChange] - Called with the rating; omit for read-only.
 * @param {string} [props.label]    - What is being rated, for the announcement.
 * @param {string} [props.testID]
 */
export default function StarRating({ value = 0, onChange, label, testID }) {
  const readOnly = !onChange;
  const spoken = value > 0 ? `${value} sur 5, ${MEANINGS[value]}` : "pas encore noté";

  if (readOnly) {
    return (
      <View
        style={styles.row}
        accessible
        accessibilityRole="text"
        accessibilityLabel={label ? `${label} : ${spoken}` : spoken}
        testID={testID}
      >
        {STARS.map((star) => (
          <Icon
            key={star}
            name="star"
            size={16}
            color={star <= value ? colors.warning : colors.textLight}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row} accessibilityRole="radiogroup" testID={testID}>
      {STARS.map((star) => (
        <TouchableOpacity
          key={star}
          style={styles.starButton}
          onPress={() => onChange(star)}
          accessibilityRole="radio"
          accessibilityState={{ selected: star === value }}
          accessibilityLabel={`${star} sur 5, ${MEANINGS[star]}`}
          testID={`${testID}-star-${star}`}
        >
          <Icon name="star" size={28} color={star <= value ? colors.warning : colors.textLight} />
        </TouchableOpacity>
      ))}
      <Text style={styles.meaning}>{value > 0 ? MEANINGS[value] : ""}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  starButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  meaning: { marginLeft: 4, fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.textMedium },
});
