import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, fonts, radius } from "../theme/tokens";

/**
 * Rates the strength of a password.
 * @param {string} pwd
 * @returns {{ level: string, label: string, color: string, fraction: number }}
 */
export function getPasswordStrength(pwd) {
  if (!pwd || pwd.length === 0) {
    return { level: "none", label: "", color: "transparent", fraction: 0 };
  }

  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  if (pwd.length >= 10 && hasLetters && hasNumbers && hasSpecial) {
    return { level: "strong", label: "Fort", color: colors.teal, fraction: 1 };
  }
  if (pwd.length >= 6 && hasLetters && hasNumbers) {
    return { level: "fair", label: "Moyen", color: colors.warning, fraction: 0.66 };
  }
  return { level: "weak", label: "Faible", color: colors.danger, fraction: 0.33 };
}

/**
 * Kompagnon-styled password field: "pill" control, lock icon, circular
 * visibility toggle and an optional strength bar.
 *
 * @param {object} props
 * @param {string}   props.label          - Label shown above the field
 * @param {string}   props.value          - Current value
 * @param {Function} props.onChangeText   - Text change callback
 * @param {string}   props.placeholder    - Placeholder text
 * @param {string}   [props.hint]         - Accessibility hint (e.g. password rules)
 * @param {string}   props.testID         - TextInput testID
 * @param {string}   props.toggleTestID   - Visibility toggle testID
 * @param {boolean}  [props.showStrength] - Show the strength bar when true
 */
export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  testID,
  toggleTestID,
  showStrength = false,
}) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.control, focused && styles.controlFocused]}>
        <Feather name="lock" size={18} color={colors.textLight} style={styles.leadingIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={!visible}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={hint}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setVisible((v) => !v)}
          testID={toggleTestID}
          accessibilityRole="button"
          accessibilityLabel={
            visible
              ? `Masquer ${label.toLowerCase()}`
              : `Afficher ${label.toLowerCase()}`
          }
          accessibilityState={{ expanded: visible }}
        >
          <Feather
            name={visible ? "eye-off" : "eye"}
            size={18}
            color={colors.navy}
            importantForAccessibility="no"
          />
        </TouchableOpacity>
      </View>

      {showStrength && strength && strength.level !== "none" && (
        <View
          style={styles.strengthContainer}
          testID="password-strength-container"
          accessible
          accessibilityLabel={`Force du mot de passe : ${strength.label}`}
        >
          <View
            style={styles.strengthBarBackground}
            importantForAccessibility="no-hide-descendants"
          >
            <View
              style={[
                styles.strengthBarFill,
                {
                  width: `${Math.round(strength.fraction * 100)}%`,
                  backgroundColor: strength.color,
                },
              ]}
              testID="password-strength-bar"
            />
          </View>
          <Text
            style={[styles.strengthLabel, { color: strength.color }]}
            testID="password-strength-label"
            importantForAccessibility="no"
          >
            {strength.label}
          </Text>
        </View>
      )}
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
    paddingLeft: 16,
    paddingRight: 6,
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
  toggle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30, 44, 56, 0.06)",
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 4,
    gap: 8,
  },
  strengthBarBackground: {
    flex: 1,
    height: 5,
    backgroundColor: colors.beige,
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    width: 42,
    textAlign: "right",
  },
});
