import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ApiUnavailable from "./components/ApiUnavailable";
import MainTabs from "./components/MainTabs";
import AboutScreen from "./screens/AboutScreen";
import ActivateAccountScreen from "./screens/ActivateAccountScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import HelpScreen from "./screens/HelpScreen";
import JourneyDetailScreen from "./screens/JourneyDetailScreen";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import PrivacyScreen from "./screens/PrivacyScreen";
import RecordJourneyScreen from "./screens/RecordJourneyScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import TermsScreen from "./screens/TermsScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import { colors } from "./theme/tokens";
import { checkHealth } from "./utils/api-fetch";
import { hasSeenOnboarding } from "./utils/onboarding";
import { clearSession, getSession } from "./utils/session";
import { getUserProfile } from "./utils/users";

const Stack = createNativeStackNavigator();

// Deep links used by the account emails, e.g. kompagnon://reset-password?token=…
const linking = {
  prefixes: ["kompagnon://", "https://kompagnon.dev"],
  config: {
    screens: {
      ResetPassword: "reset-password",
      ActivateAccount: "activate",
    },
  },
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.teal,
    background: colors.bg,
    card: colors.surface,
    text: colors.navy,
    border: colors.border,
    notification: colors.teal,
  },
};

export default function App() {
  // Load the Kompagnon brand fonts (Nunito display + DM Sans body).
  // Rendering is not gated on this: fonts fall back to system until ready.
  useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // The app is gated on the API health: screens are only shown when the backend
  // answers. The stored session then decides the entry screen, so a logged-in
  // user skips the auth flow.
  const [apiStatus, setApiStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [initialRoute, setInitialRoute] = useState("Welcome");

  const start = useCallback(async () => {
    setApiStatus("loading");
    const healthy = await checkHealth();
    if (!healthy) {
      setApiStatus("error");
      return;
    }
    // A stored token only means the user was logged in before. Verify it is
    // still valid by fetching the profile: an expired or revoked token must not
    // land the user on the authenticated app (issue #125).
    // A visitor who has never seen the introduction gets it before anything else.
    const entryScreen = (await hasSeenOnboarding()) ? "Welcome" : "Onboarding";

    const session = await getSession();
    if (session) {
      const profile = await getUserProfile({ token: session.token });
      if (profile.success) {
        setInitialRoute("Main");
      } else {
        await clearSession();
        setInitialRoute(entryScreen);
      }
    } else {
      setInitialRoute(entryScreen);
    }
    setApiStatus("ready");
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  if (apiStatus === "loading") {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (apiStatus === "error") {
    return <ApiUnavailable onRetry={start} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme} linking={linking}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Register" component={RegistrationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="RecordJourney" component={RecordJourneyScreen} />
          <Stack.Screen name="JourneyDetail" component={JourneyDetailScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="ActivateAccount" component={ActivateAccountScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});
