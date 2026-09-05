import React, { useState } from "react";
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import Icon from "./Icon";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * A question that unfolds its answer when tapped. The whole row is the control,
 * so a screen reader announces the question, its state and the answer once open.
 *
 * @param {object}  props
 * @param {string}  props.question
 * @param {string}  props.answer
 * @param {string}  [props.icon]      - Feather icon shown before the question.
 * @param {boolean} [props.defaultOpen]
 * @param {string}  [props.testID]
 */
export default function Accordion({ question, answer, icon, defaultOpen = false, testID }) {
  const [open, setOpen] = useState(defaultOpen);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((value) => !value);
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={question}
        accessibilityHint={open ? "Appuyez pour replier la réponse" : "Appuyez pour lire la réponse"}
        testID={testID}
      >
        {icon && (
          <View style={styles.iconBubble}>
            <Icon name={icon} size={15} color={colors.tealDark} />
          </View>
        )}
        <Text style={styles.question}>{question}</Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.textLight} />
      </TouchableOpacity>

      {open && (
        <Text style={styles.answer} testID={testID ? `${testID}-answer` : undefined}>
          {answer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 10,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    minHeight: 56,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.navy,
  },
  answer: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMedium,
    lineHeight: 20,
    paddingBottom: 18,
  },
});
