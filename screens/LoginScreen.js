import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import PasswordInput from "../components/PasswordInput";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { apiFetch } from "../utils/api-fetch";
import { saveSession } from "../utils/session";

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const setErrorWithShake = (msg) => {
    setError(msg);
    if (msg) triggerShake();
  };

  const handleLogin = async () => {
    setErrorWithShake(null);

    if (!email || !password) {
      setErrorWithShake("Tous les champs sont obligatoires.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/authentication/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response && response.ok) {
        const payload = await response.json();
        await saveSession({ token: payload?.data?.token, userId: payload?.data?.userId });
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else if (response && response.status === 401) {
        setErrorWithShake("Identifiants incorrects.");
      } else if (response && response.status === 404) {
        setErrorWithShake("Compte non activé. Activez-le via l'e-mail reçu après inscription.");
      } else {
        setErrorWithShake("Échec de la connexion. Veuillez réessayer.");
      }
    } catch (err) {
      setErrorWithShake("Une erreur est survenue. Vérifiez votre connexion.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer} testID="login-header">
            <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
            <Text style={styles.kicker}>CONNEXION SÉCURISÉE</Text>
            <Text style={styles.title}>Bon retour</Text>
            <Text style={styles.subtitle}>Reprenez votre parcours Kompagnon</Text>
          </View>

          <View style={styles.formContainer}>
            {error && (
              <Animated.View
                style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}
                testID="login-error-container"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <BrandInput
              label="Email"
              icon="mail"
              placeholder="vous@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-email-input"
              accessibilityLabel="Adresse email"
            />

            <PasswordInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Votre mot de passe"
              testID="login-password-input"
              toggleTestID="toggle-login-password-visibility"
            />

            <Text style={styles.hint}>
              Votre compte doit être activé via l&apos;e-mail reçu après inscription.
            </Text>
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate("ActivateAccount")}
              accessibilityRole="button"
              accessibilityLabel="Activer mon compte"
            >
              <Text style={styles.forgotLinkText}>Activer mon compte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Se connecter"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Chargement…" />
              ) : (
                <Text style={styles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate("ForgotPassword")}
              accessibilityRole="button"
              accessibilityLabel="Mot de passe oublié"
            >
              <Text style={styles.forgotLinkText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <View style={styles.signupLinkContainer}>
              <Text style={styles.signupLinkText}>Pas encore de compte ? </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.signupLinkHighlight}>S&apos;inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  forgotLink: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  forgotLinkText: {
    color: colors.tealDark,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    marginBottom: 16,
    ...shadow.card,
  },
  kicker: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.5,
    color: colors.tealDark,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMedium,
  },
  formContainer: {
    width: "100%",
  },
  errorContainer: {
    backgroundColor: colors.dangerBg,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  hint: {
    color: colors.textLight,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    backgroundColor: colors.navy,
    paddingVertical: 18,
    borderRadius: radius.full,
    alignItems: "center",
    ...shadow.card,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textOnDark,
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupLinkText: {
    color: colors.textMedium,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  signupLinkHighlight: {
    color: colors.tealDark,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
