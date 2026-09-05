import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import logo from "../assets/kompagnon-logo.png";
import BrandInput from "../components/BrandInput";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { requestPasswordReset } from "../utils/auth";

/**
 * Asks for the account's email and requests a reset link. The API answers the
 * same way whether or not the address exists, so the confirmation stays neutral.
 */
export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      setError("Renseignez votre adresse email.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await requestPasswordReset({ email: email.trim() });
    setLoading(false);
    if (result.success) {
      setSent(true);
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
            <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
            <Text style={styles.kicker}>MOT DE PASSE OUBLIÉ</Text>
            <Text style={styles.title}>On vous remet en selle</Text>
            <Text style={styles.subtitle}>
              Indiquez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe.
            </Text>
          </View>

          {sent ? (
            <View style={styles.successCard} testID="forgot-success" accessibilityLiveRegion="polite">
              <Icon name="mail" size={22} color={colors.successText} />
              <Text style={styles.successTitle}>Vérifiez votre boîte mail</Text>
              <Text style={styles.successText}>
                Si un compte existe pour {email.trim()}, un lien de réinitialisation vient d&apos;être envoyé.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("ResetPassword")}
                accessibilityRole="button"
                accessibilityLabel="J'ai reçu le lien"
              >
                <Text style={styles.primaryButtonText}>J&apos;ai reçu le lien</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {error && (
                <View style={styles.errorContainer} accessibilityLiveRegion="polite" accessibilityRole="alert">
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <BrandInput
                label="Email"
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="bonjour@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="forgot-email-input"
                accessibilityLabel="Adresse email"
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onSubmit}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Envoyer le lien"
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Envoi…" />
                ) : (
                  <Text style={styles.primaryButtonText}>Envoyer le lien</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.link}
                onPress={() => navigation.navigate("ResetPassword")}
                accessibilityRole="button"
                accessibilityLabel="J'ai déjà un code de réinitialisation"
              >
                <Text style={styles.linkText}>J&apos;ai déjà un code</Text>
              </TouchableOpacity>
            </View>
          )}
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
    alignItems: "center", justifyContent: "center", marginBottom: 12, ...shadow.card,
  },
  header: { alignItems: "center", marginBottom: 28 },
  logo: { width: 72, height: 72, borderRadius: radius.lg, marginBottom: 16, ...shadow.card },
  kicker: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.tealDark, letterSpacing: 1.2, marginBottom: 8 },
  title: { fontSize: 26, fontFamily: fonts.displayBlack, color: colors.navy, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: fonts.body, color: colors.textMedium, textAlign: "center", lineHeight: 21 },
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
  link: { alignItems: "center", paddingVertical: 16 },
  linkText: { color: colors.tealDark, fontSize: 14, fontFamily: fonts.bodyBold },
  successCard: {
    alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 24, ...shadow.card,
  },
  successTitle: { fontSize: 17, fontFamily: fonts.displayBold, color: colors.navy },
  successText: { fontSize: 14, fontFamily: fonts.body, color: colors.textMedium, textAlign: "center", lineHeight: 20 },
});
