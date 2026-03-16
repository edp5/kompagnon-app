import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import RegistrationScreen from "./screens/RegistrationScreen";
import { apiFetch } from "./utils/api-fetch.js";

export default function App() {
  const [apiIsActive, setApiIsActive] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function doCheck() {
      try {
        const request = await apiFetch("/api/health");
        if (mounted && request && request.status === 200) {
          setApiIsActive(true);
        }
      } catch (err) {
        // keep apiIsActive as false; log for debugging
        console.warn("Health check failed", err);
      }
    }

    doCheck();
    return () => { mounted = false; };
  }, []);

  if (!isRegistered) {
    return (
      <View style={styles.container}>
        <RegistrationScreen onRegisterSuccess={() => setIsRegistered(true)} />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {apiIsActive ? (
        <>
          <Text>Hello, World!</Text>
          <StatusBar style="auto" />
        </>
      ) : (
        <Text>API is not active</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
