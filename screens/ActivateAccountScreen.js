import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BrandInput from "../components/BrandInput";
import Icon from "../components/Icon";
import { USER_ROLES } from "../constants";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { activateAccount } from "../utils/auth";

const PHONE_PATTERN = /^0[67]\d{8}$/;

const ROLE_OPTIONS = [
  {
    value: "passenger",
    icon: "user",
    description: "Je souhaite être accompagné lors de mes trajets.",
  },
  {
    value: "companion",
    icon: "users",
    description: "Je souhaite accompagner une personne sur ses trajets.",
  },
];

/**
 * Finishes the sign-up: the account is activated with the token received by
 * email, and the user picks the phone number and the role that drive the rest
 * of the app. The token is prefilled when opened from the email link.
 */
export default function ActivateAccountScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [token, setToken] = useState(route.params?.token ?? "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit() {
    if (!token.trim()) {
      setError("Collez le code d'activation reçu par email.");
      return;
    }
    if (!PHONE_PATTERN.test(phoneNumber.trim())) {
      setError("Renseignez un numéro de mobile valide (ex. 0612345678).");
      return;
    }
    if (!role) {
      setError("Choisissez votre rôle pour continuer.");
      return;
    }

    setError(null);
    setLoading(true);
    const result = await activateAccount({ token: token.trim(), phoneNumber: phoneNumber.trim(), role });
    setLoading(false);

    if (result.success) {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } else {
      setError(result.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Icon name="arrow-left" size={22} color={colors.navy} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.kicker}>ACTIVATION DU COMPTE</Text>
            <Text style={styles.title}>Plus qu&apos;une étape</Text>
            <Text style={styles.subtitle}>
              Collez le code reçu par email, indiquez votre mobile et choisissez votre rôle.
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer} testID="activate-error" accessibilityLiveRegion="polite" accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <BrandInput
              label="Code reçu par email"
              icon="key"
              value={token}
              onChangeText={setToken}
              placeholder="Collez le code ici"
              autoCapitalize="none"
              autoCorrect={false}
              testID="activate-token-input"
              accessibilityLabel="Code d'activation"
            />

            <BrandInput
              label="Numéro de mobile"
              icon="phone"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="0612345678"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
              testID="activate-phone-input"
              accessibilityLabel="Numéro de mobile"
              accessibilityHint="Il permet à votre binôme de vous appeler une fois le trajet confirmé."
            />

            <Text style={styles.roleLabel}>Vous êtes</Text>
            {ROLE_OPTIONS.map((option) => {
              const selected = role === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.roleCard, selected && styles.roleCardSelected]}
                  onPress={() => setRole(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${USER_ROLES[option.value]}. ${option.description}`}
                  testID={`activate-role-${option.value}`}
                >
                  <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
                    <Icon name={option.icon} size={18} color={selected ? colors.textOnDark : colors.tealDark} />
                  </View>
                  <View style={styles.roleBody}>
                    <Text style={styles.roleTitle}>{USER_ROLES[option.value]}</Text>
                    <Text style={styles.roleDescription}>{option.description}</Text>
                  </View>
                  {selected && <Icon name="check-circle" size={20} color={colors.teal} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Activer mon compte"
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Activation…" />
              ) : (
                <Text style={styles.primaryButtonText}>Activer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 16, ...shadow.card,
  },
  header: { marginBottom: 24 },
  kicker: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.tealDark, letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: fonts.displayBlack, color: colors.navy, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 21 },
  form: { gap: 4 },
  errorContainer: {
    backgroundColor: colors.dangerBg, borderWidth: 1.5, borderColor: colors.dangerBorder,
    borderRadius: radius.md, padding: 14, marginBottom: 16,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.bodyMedium },
  roleLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.navy, marginBottom: 8, marginLeft: 4 },
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: colors.border,
  },
  roleCardSelected: { borderColor: colors.teal, backgroundColor: colors.tealLight },
  roleIcon: {
    width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.tealLight,
    alignItems: "center", justifyContent: "center",
  },
  roleIconSelected: { backgroundColor: colors.teal },
  roleBody: { flex: 1 },
  roleTitle: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy, marginBottom: 2 },
  roleDescription: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 18 },
  primaryButton: {
    alignItems: "center", justifyContent: "center", minHeight: 56, paddingVertical: 18,
    borderRadius: radius.full, backgroundColor: colors.teal, marginTop: 8, ...shadow.teal,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 16, fontFamily: fonts.bodyBold, letterSpacing: 0.3 },
});
