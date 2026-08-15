import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius } from "../theme/tokens";
import { searchAddresses } from "../utils/location";
import BrandInput from "./BrandInput";

const DEBOUNCE_MS = 350;

/**
 * Address field with debounced autocomplete suggestions (OpenStreetMap).
 * Selecting a suggestion gives back its label and coordinates, so the caller
 * doesn't need to geocode again.
 *
 * @param {object}   props
 * @param {string}   props.label
 * @param {string}   props.icon              - Feather icon name
 * @param {string}   props.placeholder
 * @param {string}   props.value
 * @param {Function} props.onChangeText      - called on every keystroke
 * @param {Function} props.onSelect          - called with { label, latitude, longitude }
 * @param {string}   [props.testID]
 */
export default function AddressAutocomplete({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  onSelect,
  testID,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const handleChange = (text) => {
    onChangeText(text);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchAddresses(text);
      if (mounted.current) {
        setSuggestions(results);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleSelect = (suggestion) => {
    setSuggestions([]);
    onSelect(suggestion);
  };

  return (
    <View style={styles.field}>
      <BrandInput
        label={label}
        icon={icon}
        placeholder={placeholder}
        value={value}
        onChangeText={handleChange}
        autoCorrect={false}
        testID={testID}
        accessibilityLabel={label}
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.tealDark} />
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.label}-${index}`}
              style={[styles.suggestion, index > 0 && styles.suggestionDivider]}
              onPress={() => handleSelect(suggestion)}
              accessibilityRole="button"
              accessibilityLabel={suggestion.label}
              testID={`${testID}-suggestion-${index}`}
            >
              <Feather name="map-pin" size={14} color={colors.textLight} style={styles.suggestionIcon} />
              <Text style={styles.suggestionText} numberOfLines={2}>{suggestion.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  loadingRow: {
    paddingVertical: 8,
    alignItems: "flex-start",
    marginLeft: 4,
  },
  suggestions: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.beige,
  },
  suggestionIcon: {
    marginTop: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.navy,
  },
});
