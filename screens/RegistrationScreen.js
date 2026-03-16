import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import PasswordInput, { getPasswordStrength } from "../components/PasswordInput";
import { apiFetch } from "../utils/api-fetch";

// Re-export for backward compatibility with existing tests
export { getPasswordStrength };

export default function RegistrationScreen({ onRegisterSuccess }) {
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

    setLoading(true);

    try {
      const response = await apiFetch("/api/authentication/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstname: firstName, lastname: lastName, email, password, userType: "user", birthday }),
      });

      if (response && response.ok) {
        Alert.alert("Succès", "Compte créé avec succès !", [
          { text: "OK", onPress: () => onRegisterSuccess && onRegisterSuccess() },
        ]);
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
          {/* En-tête animé */}
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
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>K</Text>
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez Kompagnon aujourd'hui</Text>
          </Animated.View>

          {/* Formulaire animé */}
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
                testID="firstName-input"
                accessibilityLabel="Prénom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Dupont"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
                testID="lastName-input"
                accessibilityLabel="Nom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date de naissance</Text>
              <TextInput
                style={styles.input}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#999"
                value={birthday}
                onChangeText={setBirthday}
                keyboardType="numeric"
                testID="birthday-input"
                accessibilityLabel="Date de naissance"
                accessibilityHint="Format JJ/MM/AAAA"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="bonjour@exemple.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Adresse email"
              />
            </View>

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

            {/* Bouton d'inscription animé */}
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
                  <ActivityIndicator color="#fff" accessibilityLabel="Chargement…" />
                ) : (
                  <Text style={styles.buttonText}>S'inscrire</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Déjà un compte ? </Text>
              <TouchableOpacity accessibilityRole="button">
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
    backgroundColor: "#F8F9FA",
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
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#2D3436",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#636E72",
  },
  formContainer: {
    width: "100%",
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FF7675",
  },
  errorText: {
    color: "#D63031",
    fontSize: 14,
  },
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
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2D3436",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: "#0984E3",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#0984E3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#74B9FF",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginLinkText: {
    color: "#636E72",
    fontSize: 14,
  },
  loginLinkHighlight: {
    color: "#0984E3",
    fontSize: 14,
    fontWeight: "600",
  },
});
