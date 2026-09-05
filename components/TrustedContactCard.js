import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors, fonts, radius, shadow } from "../theme/tokens";
import { getSession } from "../utils/session";
import { setTrustedContact } from "../utils/users";
import BrandInput from "./BrandInput";
import Icon from "./Icon";

/**
 * The person to reach if a journey goes wrong. Naming one is what turns the
 * alert button on a journey into something that can actually reach a human.
 *
 * @param {object}   props
 * @param {object}   [props.contact] - The contact already recorded, if any.
 * @param {Function} [props.onChange] - Called with the contact once saved or cleared.
 */
export default function TrustedContactCard({ contact, onChange }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact?.name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(contact?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save({ clear = false } = {}) {
    setError(null);
    setSaving(true);

    const session = await getSession();
    if (!session) {
      setSaving(false);
      setError("Votre session a expiré. Reconnectez-vous.");
      return;
    }

    const result = await setTrustedContact({
      token: session.token,
      name: clear ? null : name.trim(),
      phoneNumber: clear ? null : phoneNumber.replace(/[\s.-]/g, ""),
    });
    setSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    onChange?.(result.trustedContact);
    setEditing(false);
    if (clear) {
      setName("");
      setPhoneNumber("");
    }
  }

  return (
    <View style={styles.card} testID="trusted-contact">
      <View style={styles.header}>
        <Icon name="heart" size={16} color={colors.tealDark} />
        <Text style={styles.title}>Contact de confiance</Text>
      </View>

      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      )}

      {!editing && contact ? (
        <>
          <Text style={styles.current} testID="trusted-contact-current">
            {contact.name ? `${contact.name} · ${contact.phoneNumber}` : contact.phoneNumber}
          </Text>
          <Text style={styles.explanation}>
            Pendant un trajet, un bouton vous permet de lui envoyer votre position en un geste.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="Modifier le contact de confiance"
              testID="trusted-contact-edit"
            >
              <Text style={styles.secondaryText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => save({ clear: true })}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Retirer le contact de confiance"
              testID="trusted-contact-clear"
            >
              <Text style={[styles.secondaryText, styles.removeText]}>Retirer</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : !editing ? (
        <>
          <Text style={styles.explanation}>
            Indiquez la personne à prévenir si un trajet se passe mal. Elle recevra
            votre position, et vous pouvez la retirer à tout moment.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un contact de confiance"
            testID="trusted-contact-add"
          >
            <Text style={styles.primaryText}>Ajouter un contact</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <BrandInput
            label="Son prénom"
            icon="user"
            value={name}
            onChangeText={setName}
            placeholder="Camille"
            testID="trusted-contact-name"
          />
          <BrandInput
            label="Son numéro"
            icon="phone"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="06 12 34 56 78"
            keyboardType="phone-pad"
            testID="trusted-contact-phone"
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => save()}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Enregistrer le contact de confiance"
              testID="trusted-contact-save"
            >
              {saving ? (
                <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Enregistrement…" />
              ) : (
                <Text style={styles.primaryText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setEditing(false)}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              testID="trusted-contact-cancel"
            >
              <Text style={styles.secondaryText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
    ...shadow.card,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontFamily: fonts.displayBold, color: colors.navy },
  current: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.navy },
  explanation: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, lineHeight: 19 },
  error: { fontSize: 13, fontFamily: fonts.body, color: colors.danger },
  actions: { flexDirection: "row", gap: 10 },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.teal,
  },
  primaryText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.textOnDark },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.bg,
  },
  secondaryText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.teal },
  removeText: { color: colors.danger },
});
