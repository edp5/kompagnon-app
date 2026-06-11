import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import logo from "../assets/kompagnon-logo.png";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { checkHealth } from "../utils/api-fetch";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [apiIsActive, setApiIsActive] = useState(false);

  useEffect(() => {
    let mounted = true;

    checkHealth().then((healthy) => {
      if (mounted) {
        setApiIsActive(healthy);
      }
    });

    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
        <Text style={styles.title}>Bienvenue sur Kompagnon</Text>
        <Text style={styles.subtitle}>L'accompagnement accessible, pensé pour tous.</Text>

        <View
          style={[styles.statusPill, apiIsActive ? styles.statusOk : styles.statusDown]}
          testID="api-status"
          accessibilityRole="text"
        >
          <Feather
            name={apiIsActive ? "check-circle" : "alert-circle"}
            size={14}
            color={apiIsActive ? colors.successText : colors.danger}
          />
          <Text style={[styles.statusText, { color: apiIsActive ? colors.successText : colors.danger }]}>
            {apiIsActive ? "API connectée" : "API injoignable"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Se déconnecter"
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
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
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    marginBottom: 20,
    ...shadow.card,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 24,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    marginBottom: 32,
  },
  statusOk: {
    backgroundColor: colors.successBg,
  },
  statusDown: {
    backgroundColor: colors.dangerBg,
  },
  statusText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoutText: {
    color: colors.navy,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
});
