import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";

import HomeScreen from "../screens/HomeScreen";
import JourneysScreen from "../screens/JourneysScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors, fonts, shadow } from "../theme/tokens";

const Tab = createBottomTabNavigator();

const ICONS = { Home: "home", Journeys: "map", Profile: "user" };

/**
 * Bottom tab bar of the authenticated area (Accueil / Trajets / Profil), styled
 * with the project palette. Detail flows (journey detail, record a journey) are
 * pushed over the tabs from the parent stack.
 */
export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tealDark,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 11 },
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONS[route.name]} size={size ?? 22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Accueil" }} />
      <Tab.Screen name="Journeys" component={JourneysScreen} options={{ tabBarLabel: "Trajets" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Profil" }} />
    </Tab.Navigator>
  );
}

const styles = {
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.beige,
    borderTopWidth: 1,
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
    ...shadow.card,
  },
};
