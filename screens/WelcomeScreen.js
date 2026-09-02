import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import logo from "../assets/kompagnon-logo.png";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";

/**
 * First screen shown to a visitor who is not logged in. It presents the app and
 * offers the two entry points, so returning users are not dropped straight onto
 * the registration form.
 */
export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
          <Text style={styles.title}>Kompagnon</Text>
          <Text style={styles.subtitle}>L&apos;accompagnement accessible, pensé pour tous.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login")}
            accessibilityRole="button"
            accessibilityLabel="Se connecter"
          >
            <Icon name="log-in" size={18} color={colors.textOnDark} />
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Register")}
            accessibilityRole="button"
            accessibilityLabel="Créer un compte"
          >
            <Icon name="user-plus" size={18} color={colors.navy} />
            <Text style={styles.secondaryButtonText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: radius.xl,
    marginBottom: 24,
    ...shadow.card,
  },
  title: {
    fontSize: 34,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
    ...shadow.teal,
  },
  primaryButtonText: {
    color: colors.textOnDark,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.navy,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
});
