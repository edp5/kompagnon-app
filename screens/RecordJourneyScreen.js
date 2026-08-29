import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AddressAutocomplete from "../components/AddressAutocomplete";
import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { recordJourney } from "../utils/journeys";
import { geocodeAddress, getCurrentPosition, reverseGeocode } from "../utils/location";
import { getSession } from "../utils/session";

// Estimated arrival used until an explicit time picker is added.
const DEFAULT_TRIP_MINUTES = 30;

export default function RecordJourneyScreen() {
  const navigation = useNavigation();

  const [departureAddress, setDepartureAddress] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [arrivalAddress, setArrivalAddress] = useState("");
  const [arrivalCoords, setArrivalCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Typing invalidates the resolved coordinates: they are re-resolved from the
  // address on submit (or set directly when a suggestion is picked).
  const onDepartureChange = (text) => {
    setDepartureAddress(text);
    setDepartureCoords(null);
  };

  const onDepartureSelect = (suggestion) => {
    setDepartureAddress(suggestion.label);
    setDepartureCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
  };

  const onArrivalChange = (text) => {
    setArrivalAddress(text);
    setArrivalCoords(null);
  };

  const onArrivalSelect = (suggestion) => {
    setArrivalAddress(suggestion.label);
    setArrivalCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
  };

  const handleUseMyLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      if (!position.granted) {
        setError("Autorisez la localisation pour utiliser votre position.");
        return;
      }
      const address = await reverseGeocode(position);
      setDepartureCoords({ latitude: position.latitude, longitude: position.longitude });
      setDepartureAddress(address);
    } catch {
      setError("Impossible de récupérer votre position.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!departureAddress.trim()) {
      setError("Indiquez votre point de départ.");
      return;
    }
    if (!arrivalAddress.trim()) {
      setError("Indiquez votre destination.");
      return;
    }

    setLoading(true);
    try {
      const departure = departureCoords ?? (await geocodeAddress(departureAddress));
      if (!departure) {
        setError("Adresse de départ introuvable.");
        return;
      }
      const arrival = arrivalCoords ?? (await geocodeAddress(arrivalAddress));
      if (!arrival) {
        setError("Adresse d'arrivée introuvable.");
        return;
      }

      const session = await getSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous.");
        return;
      }

      const now = new Date();
      const arrivalTime = new Date(now.getTime() + DEFAULT_TRIP_MINUTES * 60000);

      const result = await recordJourney({
        token: session.token,
        departureAddress,
        arrivalAddress,
        departureLat: departure.latitude,
        departureLon: departure.longitude,
        arrivalLat: arrival.latitude,
        arrivalLon: arrival.longitude,
        departureTime: now.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
      });

      if (result.success) {
        Alert.alert("Demande envoyée", "Votre trajet a bien été enregistré.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Icon name="arrow-left" size={22} color={colors.navy} />
            </TouchableOpacity>
            <Text style={styles.title}>Nouveau trajet</Text>
            <Text style={styles.subtitle}>Où souhaitez-vous être accompagné ?</Text>
          </View>

          {error && (
            <View
              style={styles.errorContainer}
              testID="journey-error-container"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <AddressAutocomplete
            label="Départ"
            icon="map-pin"
            placeholder="Adresse de départ"
            value={departureAddress}
            onChangeText={onDepartureChange}
            onSelect={onDepartureSelect}
            testID="departure-input"
          />

          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseMyLocation}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel="Utiliser ma position"
          >
            {locating ? (
              <ActivityIndicator color={colors.tealDark} />
            ) : (
              <>
                <Icon name="navigation" size={16} color={colors.tealDark} />
                <Text style={styles.locationButtonText}>Utiliser ma position</Text>
              </>
            )}
          </TouchableOpacity>

          <AddressAutocomplete
            label="Destination"
            icon="flag"
            placeholder="Adresse d'arrivée"
            value={arrivalAddress}
            onChangeText={onArrivalChange}
            onSelect={onArrivalSelect}
            testID="arrival-input"
          />

          <Text style={styles.hint}>Départ planifié : maintenant.</Text>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Demander un accompagnement"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Chargement…" />
            ) : (
              <Text style={styles.submitButtonText}>Demander un accompagnement</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMedium,
  },
  errorContainer: {
    backgroundColor: colors.dangerBg,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.tealLight,
    marginTop: -4,
    marginBottom: 16,
    minHeight: 44,
  },
  locationButtonText: {
    color: colors.tealDark,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  hint: {
    color: colors.textLight,
    fontSize: 13,
    fontFamily: fonts.body,
    marginLeft: 4,
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.teal,
    paddingVertical: 18,
    borderRadius: radius.full,
    alignItems: "center",
    ...shadow.teal,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textOnDark,
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.3,
  },
});
