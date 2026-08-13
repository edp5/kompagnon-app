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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} resizeMode="cover" accessibilityRole="image" accessibilityLabel="Logo Kompagnon" />
        <Text style={styles.title}>Bienvenue sur Kompagnon</Text>
        <Text style={styles.subtitle}>L&apos;accompagnement accessible, pensé pour tous.</Text>

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
          style={styles.primaryButton}
          onPress={() => navigation.navigate("RecordJourney")}
          accessibilityRole="button"
          accessibilityLabel="Demander un accompagnement"
        >
          <Feather name="navigation" size={18} color={colors.textOnDark} />
          <Text style={styles.primaryButtonText}>Demander un accompagnement</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Journeys")}
            accessibilityRole="button"
            accessibilityLabel="Mes trajets"
          >
            <Feather name="calendar" size={17} color={colors.navy} />
            <Text style={styles.secondaryButtonText}>Mes trajets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Profile")}
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
          >
            <Feather name="user" size={17} color={colors.navy} />
            <Text style={styles.secondaryButtonText}>Mon profil</Text>
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "stretch",
    paddingVertical: 18,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
    marginBottom: 16,
    ...shadow.teal,
  },
  primaryButtonText: {
    color: colors.textOnDark,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
  secondaryRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    color: colors.navy,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
