import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import Icon from "./Icon";

/**
 * Shared layout for the app's static content pages (help, privacy, about):
 * a back button, a title, an optional intro and a list of titled sections.
 *
 * @param {object}   props
 * @param {string}   props.title    - Page title.
 * @param {string}   [props.intro]  - Short paragraph under the title.
 * @param {Array<{ heading: string, body: string }>} props.sections
 * @param {string}   [props.testID]
 * @param {React.ReactNode} [props.footer] - Rendered under the sections.
 */
export default function ContentScreen({ title, intro, sections, testID, footer }) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} testID={testID}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Icon name="arrow-left" size={22} color={colors.navy} />
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
        {intro && <Text style={styles.intro}>{intro}</Text>}

        {sections.map((section) => (
          <View
            key={section.heading}
            style={styles.card}
            accessible
            accessibilityLabel={`${section.heading}. ${section.body}`}
          >
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}

        {footer}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backButton: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", marginBottom: 16, ...shadow.card,
  },
  title: { fontSize: 26, fontFamily: fonts.displayBlack, color: colors.navy, letterSpacing: -0.5, marginBottom: 8 },
  intro: { fontSize: 15, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 21, marginBottom: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, marginBottom: 12, ...shadow.card },
  heading: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy, marginBottom: 6 },
  body: { fontSize: 14, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 20 },
});
