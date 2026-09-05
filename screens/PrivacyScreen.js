import React from "react";

import ContentScreen from "../components/ContentScreen";

const SECTIONS = [
  {
    heading: "Les données que nous collectons",
    body: "Votre identité (nom, prénom, date de naissance), votre email, votre numéro de mobile, votre rôle et, le cas échéant, vos besoins d'accompagnement. S'y ajoutent les trajets que vous enregistrez et leurs adresses.",
  },
  {
    heading: "Pourquoi nous les utilisons",
    body: "Uniquement pour vous mettre en relation avec un binôme adapté, vous permettre de vous retrouver le jour du trajet, et vous tenir informé par email de vos correspondances.",
  },
  {
    heading: "Votre numéro de téléphone",
    body: "Il n'est jamais affiché dans l'application. Il n'est transmis à votre binôme qu'une fois le trajet accepté par vous deux, et sert uniquement à passer l'appel depuis l'application.",
  },
  {
    heading: "Vos adresses de trajet",
    body: "Les adresses de départ et d'arrivée servent à calculer les correspondances et à afficher l'itinéraire. Elles ne sont visibles que par vous et par le binôme d'un trajet vous concernant.",
  },
  {
    heading: "Conservation et suppression",
    body: "Vos données sont conservées le temps de votre inscription. Vous pouvez demander la suppression de votre compte et des données associées en écrivant à contact@kompagnon.dev.",
  },
  {
    heading: "Vos droits",
    body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'opposition et d'effacement sur vos données. Contactez-nous pour les exercer.",
  },
];

/** Privacy page, reachable from the profile tab. */
export default function PrivacyScreen() {
  return (
    <ContentScreen
      title="Confidentialité"
      intro="Ce que Kompagnon collecte, pourquoi, et ce que vous pouvez en faire."
      sections={SECTIONS}
      testID="privacy-screen"
    />
  );
}
