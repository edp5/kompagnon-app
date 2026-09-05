import React from "react";

import ContentScreen from "../components/ContentScreen";

const SECTIONS = [
  {
    heading: "Comment demander un accompagnement ?",
    body: "Depuis l'accueil, appuyez sur « Demander un accompagnement », renseignez votre départ, votre arrivée et vos horaires. Votre trajet est ensuite proposé aux accompagnateurs disponibles.",
  },
  {
    heading: "Quand mon trajet est-il confirmé ?",
    body: "Un trajet est confirmé lorsque vous et votre binôme avez accepté la correspondance. Tant qu'une seule des deux personnes a répondu, le trajet reste « en attente ».",
  },
  {
    heading: "Comment répondre à une demande ?",
    body: "Ouvrez l'onglet Trajets : les trajets qui attendent votre réponse portent un badge « demande ». Ouvrez le trajet, puis appuyez sur Accepter ou Refuser.",
  },
  {
    heading: "Comment contacter mon binôme ?",
    body: "Une fois le trajet confirmé des deux côtés, le bouton « Appeler » apparaît sur le détail du trajet. Par respect de la vie privée, le numéro n'est jamais affiché et n'est partagé qu'après confirmation.",
  },
  {
    heading: "Je n'arrive pas à me connecter",
    body: "Vérifiez que votre compte a bien été activé via le lien reçu par email. Si vous avez oublié votre mot de passe, utilisez « Mot de passe oublié » sur l'écran de connexion.",
  },
  {
    heading: "Besoin d'aide supplémentaire ?",
    body: "Écrivez-nous à contact@kompagnon.dev en précisant votre email de compte. Nous répondons sous 48 heures ouvrées.",
  },
];

/** Help and support page, reachable from the profile tab. */
export default function HelpScreen() {
  return (
    <ContentScreen
      title="Aide & support"
      intro="Les réponses aux questions les plus fréquentes sur l'accompagnement."
      sections={SECTIONS}
      testID="help-screen"
    />
  );
}
