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
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import { colors } from "./theme/tokens";
import { checkHealth } from "./utils/api-fetch";

const Stack = createNativeStackNavigator();

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

  // Gate the app on the API health: the auth screens are only shown when the
  // backend answers. Otherwise an error message is displayed.
  const [apiStatus, setApiStatus] = useState("loading"); // "loading" | "ready" | "error"

  const refreshApiStatus = useCallback(async () => {
    setApiStatus("loading");
    const healthy = await checkHealth();
    setApiStatus(healthy ? "ready" : "error");
  }, []);

  useEffect(() => {
    refreshApiStatus();
  }, [refreshApiStatus]);

  if (apiStatus === "loading") {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (apiStatus === "error") {
    return <ApiUnavailable onRetry={refreshApiStatus} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName="Register"
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
        >
          <Stack.Screen name="Register" component={RegistrationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
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
