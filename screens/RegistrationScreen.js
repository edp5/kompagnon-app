import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import PasswordInput, { getPasswordStrength } from "../components/PasswordInput";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { apiFetch } from "../utils/api-fetch";

// Re-export for backward compatibility with existing tests
export { getPasswordStrength };

/**
 * Formats a date as a "JJ/MM/AAAA" mask while typing: keeps only digits
 * (max 8) and inserts the slashes automatically. Handles backspace naturally
 * (the slashes are recomputed on each keystroke).
 * @param {string} value
 * @returns {string} the masked value
 */
export function formatBirthdayInput(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

/**
 * Converts a "JJ/MM/AAAA" input into the ISO "AAAA-MM-JJ" format the API
 * expects (the web already sends ISO via <input type="date">).
 * @param {string} value
 * @returns {string|null} the ISO date, or null if the input is invalid
 */
export function toIsoDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((value || "").trim());
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  // Validate that the date actually exists (e.g. reject 31/02).
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yyyy}-${mm}-${dd}`;
}

export default function RegistrationScreen() {
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Animations ──────────────────────────────────────────────────────────────
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Fade-in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Shake the error box whenever a new error appears
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

  // Button press scale feedback
  const onButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  const onButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // ─── Logic ───────────────────────────────────────────────────────────────────
  const setErrorWithShake = (msg) => {
    setError(msg);
    if (msg) triggerShake();
  };

  const handleRegister = async () => {
    setErrorWithShake(null);

    if (!firstName || !lastName || !birthday || !email || !password || !confirmPassword) {
      setErrorWithShake("Tous les champs sont obligatoires.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorWithShake("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setErrorWithShake("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    const isoBirthday = toIsoDate(birthday);
    if (!isoBirthday) {
      setErrorWithShake("Date de naissance invalide. Utilisez le format JJ/MM/AAAA.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/authentication/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstname: firstName, lastname: lastName, email, password, birthday: isoBirthday }),
      });

      if (response && response.ok) {
        Alert.alert(
          "Compte créé",
          "Un email d'activation vient de vous être envoyé. Activez votre compte pour choisir votre rôle et pouvoir vous connecter.",
          [
            { text: "Plus tard", style: "cancel", onPress: () => navigation.navigate("Login") },
            { text: "Activer maintenant", onPress: () => navigation.navigate("ActivateAccount") },
          ],
        );
      } else if (response && response.status === 409) {
        setErrorWithShake("Cet email est déjà utilisé.");
      } else {
        const data = await response.json();
        setErrorWithShake(data.message || "Inscription échouée. Veuillez réessayer.");
        console.warn("Registration failed:", data);
      }
    } catch (err) {
      setErrorWithShake("Une erreur est survenue. Vérifiez votre connexion.");
      console.error("Registration error:", err);
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
          {/* Animated header */}
          <Animated.View
            style={[
              styles.headerContainer,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
            testID="header-container"
          >
            <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
            <Text style={styles.kicker}>KOMPAGNON</Text>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez Kompagnon aujourd'hui</Text>
          </Animated.View>

          {/* Animated form */}
          <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
            {error && (
              <Animated.View
                style={[
                  styles.errorContainer,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
                testID="error-container"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <BrandInput
              label="Prénom"
              icon="user"
              placeholder="Jean"
              value={firstName}
              onChangeText={setFirstName}
              testID="firstName-input"
              accessibilityLabel="Prénom"
            />

            <BrandInput
              label="Nom"
              icon="user"
              placeholder="Dupont"
              value={lastName}
              onChangeText={setLastName}
              testID="lastName-input"
              accessibilityLabel="Nom"
            />

            <BrandInput
              label="Date de naissance"
              icon="calendar"
              placeholder="JJ/MM/AAAA"
              value={birthday}
              onChangeText={(text) => setBirthday(formatBirthdayInput(text))}
              keyboardType="numeric"
              maxLength={10}
              testID="birthday-input"
              accessibilityLabel="Date de naissance"
              accessibilityHint="Format JJ/MM/AAAA, les barres obliques sont ajoutées automatiquement"
            />

            <BrandInput
              label="Email"
              icon="mail"
              placeholder="bonjour@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Adresse email"
            />

            <PasswordInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 caractères"
              hint="Minimum 6 caractères, avec lettres, chiffres et symboles pour un mot de passe fort"
              testID="password-input"
              toggleTestID="toggle-password-visibility"
              showStrength
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmez votre mot de passe"
              testID="confirm-password-input"
              toggleTestID="toggle-confirm-password-visibility"
            />

            {/* Animated submit button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                onPressIn={onButtonPressIn}
                onPressOut={onButtonPressOut}
                disabled={loading}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel="S'inscrire"
                accessibilityState={{ disabled: loading }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Chargement…" />
                ) : (
                  <Text style={styles.buttonText}>S'inscrire</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Déjà un compte ? </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginLinkHighlight}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  button: {
    backgroundColor: colors.teal,
    paddingVertical: 18,
    borderRadius: radius.full,
    alignItems: "center",
    marginTop: 12,
    ...shadow.teal,
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
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginLinkText: {
    color: colors.textMedium,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  loginLinkHighlight: {
    color: colors.tealDark,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
