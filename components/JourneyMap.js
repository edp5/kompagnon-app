import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { colors, radius } from "../theme/tokens";
import { buildHtml } from "./journeyMapHtml";

/**
 * Interactive map of an accompanied journey (native platforms), rendered with
 * the project palette inside a WebView. Renders nothing until the user's own
 * trip coordinates are known.
 * @param {{ mine: object, other?: object, meeting?: object, positions?: object[], height?: number }} props
 */
export default function JourneyMap({ mine, other, meeting, positions, height = 220 }) {
  if (!mine?.departure || mine.departure.lat == null || mine.departure.lon == null) {
    return null;
  }

  const label = `Carte de l'itinéraire, de ${mine.departure.label ?? "votre départ"} à ${mine.arrival?.label ?? "votre arrivée"}.`;

  return (
    <View style={[styles.container, { height }]} accessible accessibilityLabel={label}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: buildHtml({ mine, other, meeting, positions }) }}
        style={styles.web}
        scrollEnabled={false}
        androidLayerType="hardware"
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
  web: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
