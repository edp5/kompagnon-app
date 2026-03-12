import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Évalue la force d'un mot de passe.
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
    return { level: "strong", label: "Fort", color: "#00B894", fraction: 1 };
  }
  if (pwd.length >= 6 && hasLetters && hasNumbers) {
    return { level: "fair", label: "Moyen", color: "#FDCB6E", fraction: 0.66 };
  }
  return { level: "weak", label: "Faible", color: "#FF7675", fraction: 0.33 };
}

/**
 * Champ de saisie de mot de passe avec toggle de visibilité et barre de force optionnelle.
 *
 * @param {object} props
 * @param {string}   props.label          - Étiquette affichée au-dessus du champ
 * @param {string}   props.value          - Valeur courante
 * @param {Function} props.onChangeText   - Callback de changement de texte
 * @param {string}   props.placeholder    - Texte indicatif
 * @param {string}   [props.hint]         - Indice d'accessibilité (ex: règles du mot de passe)
 * @param {string}   props.testID         - testID du TextInput
 * @param {string}   props.toggleTestID   - testID du bouton de visibilité
 * @param {boolean}  [props.showStrength] - Affiche la barre de force si true
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
  const strength = showStrength ? getPasswordStrength(value) : null;

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.inputWithIcon}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={hint}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
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
          <Text style={styles.eyeIcon} importantForAccessibility="no">
            {visible ? "🙈" : "👁"}
          </Text>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWithIcon: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#2D3436",
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    minHeight: 44,
  },
  eyeIcon: {
    fontSize: 18,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  strengthBarBackground: {
    flex: 1,
    height: 5,
    backgroundColor: "#DFE6E9",
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    width: 42,
    textAlign: "right",
  },
});
