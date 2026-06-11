import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import logo from "../assets/kompagnon-logo.png";
import { colors, fonts, radius, shadow } from "../theme/tokens";

/**
 * Full-screen message shown when the API health check fails, so the auth
 * screens are not displayed while the backend is unreachable.
 * @param {{ onRetry: () => void }} props
 */
export default function ApiUnavailable({ onRetry }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
        <Text style={styles.title}>Service indisponible</Text>
        <Text style={styles.message}>
          Impossible de joindre Kompagnon pour le moment. Vérifiez votre connexion, puis réessayez.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
        >
          <Text style={styles.buttonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    marginBottom: 24,
    ...shadow.card,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    marginBottom: 10,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    backgroundColor: colors.teal,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.full,
    ...shadow.teal,
  },
  buttonText: {
    color: colors.textOnDark,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
});
