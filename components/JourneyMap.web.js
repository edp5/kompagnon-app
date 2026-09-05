import React, { useEffect, useMemo } from "react";
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
      <MapFrame html={buildHtml({ mine, other, meeting })} title={label} />
    </View>
  );
}

/**
 * Serves the map document from a blob URL rather than `srcDoc`. A `srcdoc`
 * iframe has an opaque origin, and MapLibre's tile workers cannot fetch through
 * it; a blob URL inherits the page's origin, so they can.
 * @param {{ html: string, title: string }} props
 */
function MapFrame({ html, title }) {
  const blobUrl = useMemo(() => {
    if (typeof URL === "undefined" || typeof Blob === "undefined") {
      return null;
    }
    return URL.createObjectURL(new Blob([html], { type: "text/html" }));
  }, [html]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (!blobUrl) {
    return null;
  }

  return (
    <iframe
      title={title}
      src={blobUrl}
      style={{ border: "none", width: "100%", height: "100%" }}
    />
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
