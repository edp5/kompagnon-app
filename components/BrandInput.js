import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, fonts, radius } from "../theme/tokens";
import Icon from "./Icon";

/**
 * Kompagnon-styled text field: "pill" control, leading icon, teal focus.
 * Used for simple fields (first name, last name, email, date…).
 *
 * @param {object}   props
 * @param {string}   props.label              - Label above the field
 * @param {string}   props.icon               - Feather icon name (e.g. "user", "mail")
 * @param {string}   props.value              - Current value
 * @param {Function} props.onChangeText       - Change callback
 * @param {string}   props.placeholder        - Placeholder text
 * @param {string}   [props.keyboardType]     - RN keyboard type
 * @param {string}   [props.autoCapitalize]   - "none" | "sentences" | "words" | "characters"
 * @param {boolean}  [props.autoCorrect]      - Autocorrect
 * @param {number}   [props.maxLength]        - Max input length
 * @param {string}   [props.testID]           - TextInput testID
 * @param {string}   [props.accessibilityLabel]
 * @param {string}   [props.accessibilityHint]
 */
export default function BrandInput({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.control, focused && styles.controlFocused]}>
        {icon && (
          <Icon name={icon} size={18} color={colors.textLight} style={styles.leadingIcon} />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          testID={testID}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    marginBottom: 8,
    marginLeft: 4,
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(30, 44, 56, 0.08)",
    borderRadius: radius.full,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  controlFocused: {
    borderColor: "rgba(72, 175, 196, 0.4)",
  },
  leadingIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.navy,
  },
});
