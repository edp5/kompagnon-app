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
import PasswordInput from "../components/PasswordInput";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { resetPassword } from "../utils/auth";

const MIN_PASSWORD_LENGTH = 6;

/**
 * Sets a new password from the reset token. The token is prefilled when the
 * screen is opened from the email link, and can otherwise be pasted by hand.
 */
export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [token, setToken] = useState(route.params?.token ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit() {
    if (!token.trim()) {
      setError("Collez le code reçu par email.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError(null);
    setLoading(true);
    const result = await resetPassword({ token: token.trim(), password });
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
            <Text style={styles.kicker}>NOUVEAU MOT DE PASSE</Text>
            <Text style={styles.title}>Choisissez votre mot de passe</Text>
            <Text style={styles.subtitle}>
              Collez le code reçu par email, puis choisissez un nouveau mot de passe.
            </Text>
          </View>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer} testID="reset-error" accessibilityLiveRegion="polite" accessibilityRole="alert">
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
              testID="reset-token-input"
              accessibilityLabel="Code de réinitialisation"
            />

            <PasswordInput
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder={`Min. ${MIN_PASSWORD_LENGTH} caractères`}
              testID="reset-password-input"
              toggleTestID="toggle-reset-password-visibility"
              showStrength
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Retapez le mot de passe"
              testID="reset-confirm-input"
              toggleTestID="toggle-reset-confirm-visibility"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Changer le mot de passe"
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Envoi…" />
              ) : (
                <Text style={styles.primaryButtonText}>Changer le mot de passe</Text>
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
  primaryButton: {
    alignItems: "center", justifyContent: "center", minHeight: 56, paddingVertical: 18,
    borderRadius: radius.full, backgroundColor: colors.teal, marginTop: 8, ...shadow.teal,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 16, fontFamily: fonts.bodyBold, letterSpacing: 0.3 },
});
