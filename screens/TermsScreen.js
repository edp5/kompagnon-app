import React from "react";

import ContentScreen from "../components/ContentScreen";

const SECTIONS = [
  {
    heading: "Objet du service",
    body: "Kompagnon met en relation des personnes en situation de handicap souhaitant être accompagnées lors d'un trajet et des accompagnateurs bénévoles. Kompagnon n'est ni un transporteur ni un service d'assistance médicale.",
  },
  {
    heading: "Conditions d'inscription",
    body: "L'inscription est gratuite et réservée aux personnes majeures. Vous vous engagez à fournir des informations exactes, notamment votre numéro de mobile, qui permet à votre binôme de vous joindre le jour du trajet.",
  },
  {
    heading: "Engagements des utilisateurs",
    body: "Vous vous engagez à honorer les trajets que vous avez confirmés, à prévenir votre binôme en cas d'empêchement, et à adopter un comportement respectueux. Tout comportement inapproprié peut entraîner la suspension du compte.",
  },
  {
    heading: "Rôle de Kompagnon",
    body: "Kompagnon facilite la mise en relation mais n'est pas partie au trajet. Le service est fourni « en l'état », sans garantie qu'une correspondance soit trouvée pour chaque trajet enregistré.",
  },
  {
    heading: "Responsabilité",
    body: "Chaque utilisateur reste responsable de son propre comportement pendant le trajet. Kompagnon ne saurait être tenu responsable des incidents survenant lors d'un accompagnement organisé via l'application.",
  },
  {
    heading: "Résiliation",
    body: "Vous pouvez cesser d'utiliser le service à tout moment. La suppression de votre compte et des données associées peut être demandée à contact@kompagnon.dev.",
  },
];

/** Terms of use, reachable from the profile tab. */
export default function TermsScreen() {
  return (
    <ContentScreen
      title="Conditions d'utilisation"
      intro="Les règles du service, à connaître avant d'organiser un accompagnement."
      sections={SECTIONS}
      testID="terms-screen"
    />
  );
}
