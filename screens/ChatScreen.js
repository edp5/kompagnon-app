import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Icon from "../components/Icon";
import { colors, fonts, radius, shadow } from "../theme/tokens";
import { formatTime } from "../utils/format";
import { getJourneyMessages, sendJourneyMessage } from "../utils/messages";
import { getSession } from "../utils/session";

// The API has no realtime channel, so the conversation is polled while open.
const POLL_INTERVAL_MS = 5000;

/**
 * Conversation with the other user of a match, so the pair can agree on the
 * details of the meeting without exchanging phone numbers first.
 */
export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { foundJourneyId, otherName } = route.params ?? {};

  const scrollRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      const session = await getSession();
      if (!session) {
        setError("Votre session a expiré. Reconnectez-vous.");
        setLoading(false);
        return;
      }

      const result = await getJourneyMessages({ token: session.token, foundJourneyId });
      if (result.success) {
        setMessages(result.messages);
        setError(null);
      } else if (!silent) {
        setError(result.message);
      }
      setLoading(false);
    },
    [foundJourneyId],
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function onSend() {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }

    const session = await getSession();
    if (!session) {
      setError("Votre session a expiré. Reconnectez-vous.");
      return;
    }

    setSending(true);
    const result = await sendJourneyMessage({ token: session.token, foundJourneyId, body });
    setSending(false);

    if (result.success) {
      setDraft("");
      await load({ silent: true });
    } else {
      setError(result.message);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Icon name="arrow-left" size={22} color={colors.navy} />
          </TouchableOpacity>
          <View style={styles.headerBody}>
            <Text style={styles.title}>{otherName ?? "Conversation"}</Text>
            <Text style={styles.subtitle}>Pour convenir du point de rendez-vous</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.centered} testID="chat-loading">
            <ActivityIndicator color={colors.teal} accessibilityLabel="Chargement…" />
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorContainer} testID="chat-error" accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && messages.length === 0 && (
          <View style={styles.emptyCard} testID="chat-empty">
            <Icon name="message-circle" size={22} color={colors.textLight} />
            <Text style={styles.emptyText}>
              Aucun message pour l&apos;instant. Dites bonjour à {otherName ?? "votre binôme"} !
            </Text>
          </View>
        )}

        {!loading && (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.conversation}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[styles.bubble, message.mine ? styles.bubbleMine : styles.bubbleTheirs]}
                accessible
                accessibilityLabel={`${message.mine ? "Vous" : message.author?.firstname ?? "Votre binôme"} : ${message.body}`}
              >
                <Text style={[styles.bubbleText, message.mine && styles.bubbleTextMine]}>
                  {message.body}
                </Text>
                <Text style={[styles.bubbleTime, message.mine && styles.bubbleTimeMine]}>
                  {formatTime(message.sentAt)}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Votre message…"
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={2000}
            testID="chat-input"
            accessibilityLabel="Votre message"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={!draft.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message"
            testID="chat-send"
          >
            {sending ? (
              <ActivityIndicator color={colors.textOnDark} accessibilityLabel="Envoi…" />
            ) : (
              <Icon name="send" size={18} color={colors.textOnDark} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  backButton: {
    width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center", ...shadow.card,
  },
  headerBody: { flex: 1 },
  title: { fontSize: 20, fontFamily: fonts.displayBold, color: colors.navy },
  subtitle: { fontSize: 13, fontFamily: fonts.body, color: colors.textMedium, marginTop: 2 },
  centered: { paddingVertical: 48, alignItems: "center" },
  errorContainer: {
    marginHorizontal: 24, backgroundColor: colors.dangerBg, borderWidth: 1.5, borderColor: colors.dangerBorder,
    borderRadius: radius.md, padding: 14,
  },
  errorText: { color: colors.danger, fontSize: 14, fontFamily: fonts.bodyMedium },
  emptyCard: { alignItems: "center", gap: 10, paddingHorizontal: 40, paddingVertical: 32 },
  emptyText: { fontSize: 14, fontFamily: fonts.body, color: colors.textMedium, textAlign: "center", lineHeight: 20 },
  conversation: { paddingHorizontal: 24, paddingVertical: 12, gap: 10 },
  bubble: { maxWidth: "82%", borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.teal, borderBottomRightRadius: 6 },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: colors.surface, borderBottomLeftRadius: 6, ...shadow.card },
  bubbleText: { fontSize: 15, fontFamily: fonts.body, color: colors.navy, lineHeight: 21 },
  bubbleTextMine: { color: colors.textOnDark },
  bubbleTime: { fontSize: 11, fontFamily: fonts.body, color: colors.textLight, marginTop: 4, alignSelf: "flex-end" },
  bubbleTimeMine: { color: "rgba(255,255,255,0.85)" },
  composer: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 24, paddingTop: 10, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: colors.beige, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, minHeight: 48, maxHeight: 120, borderRadius: radius.lg,
    backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
    fontSize: 15, fontFamily: fonts.body, color: colors.navy,
  },
  sendButton: {
    width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.teal,
    alignItems: "center", justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.45 },
});
