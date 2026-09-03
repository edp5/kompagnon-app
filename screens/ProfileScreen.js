import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Icon from "../components/Icon";
import { USER_DISABILITIES, USER_GENRE, USER_ROLES } from "../constants";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { PLACEHOLDER } from "../utils/format";
import { clearSession, getSession } from "../utils/session";
import { getUserProfile } from "../utils/users";

/**
 * Builds the two-letter avatar initials from a profile.
 * @param {object} profile
 * @returns {string}
 */
function getInitials(profile) {
  const first = profile?.firstname?.[0] ?? "";
  const last = profile?.lastname?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const session = await getSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous.");
      setLoading(false);
      return;
    }

    const result = await getUserProfile({ token: session.token });
    if (result.success) {
      setProfile(result.profile);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const rows = [
    { label: "Civilité", value: USER_GENRE[profile?.genre] ?? PLACEHOLDER },
    { label: "Prénom", value: profile?.firstname ?? PLACEHOLDER },
    { label: "Nom", value: profile?.lastname ?? PLACEHOLDER },
    { label: "Email", value: profile?.email ?? PLACEHOLDER },
    { label: "Date de naissance", value: profile?.birthday ?? PLACEHOLDER },
    { label: "Vous êtes", value: USER_ROLES[profile?.role] ?? PLACEHOLDER },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Mon profil</Text>
        </View>

        {loading && (
          <View style={styles.centered} testID="profile-loading">
            <ActivityIndicator color={colors.teal} accessibilityLabel="Chargement…" />
          </View>
        )}

        {!loading && error && (
          <View
            style={styles.errorContainer}
            testID="profile-error"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={load}
              accessibilityRole="button"
              accessibilityLabel="Réessayer"
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && profile && (
          <>
            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile)}</Text>
              </View>
              <Text style={styles.name}>
                {profile.firstname} {profile.lastname}
              </Text>
              <Text style={styles.email}>{profile.email}</Text>
              <View style={styles.rolePill}>
                <Icon name="user-check" size={13} color={colors.tealDark} />
                <Text style={styles.rolePillText}>
                  {USER_ROLES[profile.role] ?? "Rôle non défini"}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.card}>
              {rows.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.row, index > 0 && styles.rowDivider]}
                >
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            {profile.disabilities?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Besoins d&apos;accompagnement</Text>
                <View style={styles.tagsCard}>
                  {profile.disabilities.map((disability) => (
                    <View key={disability} style={styles.tag}>
                      <Text style={styles.tagText}>
                        {USER_DISABILITIES[disability] ?? disability}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
            >
              <Icon name="log-out" size={16} color={colors.danger} />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...shadow.card,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.displayBlack,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  centered: {
    paddingVertical: 48,
    alignItems: "center",
  },
  errorContainer: {
    backgroundColor: colors.dangerBg,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    alignItems: "flex-start",
    gap: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  retryText: {
    color: colors.navy,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 28,
    ...shadow.card,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: fonts.displayBlack,
    color: colors.tealDark,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.displayBold,
    color: colors.navy,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMedium,
    marginBottom: 14,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
  },
  rolePillText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.tealDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.displayBold,
    color: colors.navy,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    marginBottom: 28,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMedium,
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.navy,
    textAlign: "right",
  },
  tagsCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.beige,
  },
  tagText: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.navy,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.surface,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
});
