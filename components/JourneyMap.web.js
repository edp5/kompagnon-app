import React from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "../theme/tokens";
import { buildHtml } from "./journeyMapHtml";

/**
 * Interactive map of an accompanied journey (web platform). react-native-webview
 * has no web implementation, so on web the same Leaflet document is rendered in
 * an iframe. Renders nothing until the user's own trip coordinates are known.
 * @param {{ mine: object, other?: object, meeting?: object, height?: number }} props
 */
export default function JourneyMap({ mine, other, meeting, height = 220 }) {
  if (!mine?.departure || mine.departure.lat == null || mine.departure.lon == null) {
    return null;
  }

  const label = `Carte de l'itinéraire, de ${mine.departure.label ?? "votre départ"} à ${mine.arrival?.label ?? "votre arrivée"}.`;

  return (
    <View style={[styles.container, { height }]} accessible accessibilityLabel={label}>
      <iframe
        title={label}
        srcDoc={buildHtml({ mine, other, meeting })}
        style={{ border: "none", width: "100%", height: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: colors.bg,
  },
});
