import React from "react";

import appJson from "../app.json";
import ContentScreen from "../components/ContentScreen";

const VERSION = appJson?.expo?.version ?? "1.0.0";

const SECTIONS = [
  {
    heading: "Notre mission",
    body: "Kompagnon met en relation des personnes en situation de handicap avec des accompagnateurs bénévoles, pour que se déplacer ne soit plus un obstacle.",
  },
  {
    heading: "Comment ça marche",
    body: "Vous enregistrez un trajet, l'application cherche une personne dont le trajet correspond, et vous confirmez ensemble. Le jour J, vous vous retrouvez au point de rendez-vous affiché sur la carte.",
  },
  {
    heading: "Accessibilité",
    body: "L'application est pensée pour être utilisable au lecteur d'écran : les blocs sont annoncés d'un seul tenant, les icônes décoratives sont ignorées, et chaque action est explicitement décrite.",
  },
  {
    heading: "Version",
    body: `Kompagnon mobile ${VERSION}`,
  },
];

/** About page, reachable from the profile tab. */
export default function AboutScreen() {
  return (
    <ContentScreen
      title="À propos"
      intro="Kompagnon, l'accompagnement accessible, pensé pour tous."
      sections={SECTIONS}
      testID="about-screen"
    />
  );
}
