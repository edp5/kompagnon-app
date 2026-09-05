import { fireEvent, render, waitFor } from "@testing-library/react-native";

import ChatScreen from "../../screens/ChatScreen";
import { getJourneyMessages, sendJourneyMessage } from "../../utils/messages";
import { getSession } from "../../utils/session";

jest.mock("../../utils/messages", () => ({
    getJourneyMessages: jest.fn(),
    sendJourneyMessage: jest.fn(),
}));

jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ goBack: mockGoBack }),
    useRoute: () => ({ params: { foundJourneyId: 7, otherName: "Bob Durand" } }),
}));

const CONVERSATION = [
    { id: 1, body: "Bonjour Bob !", sentAt: "2026-09-05T10:00:00.000Z", mine: true, author: { firstname: "Alice" } },
    { id: 2, body: "J'arrive dans 5 minutes.", sentAt: "2026-09-05T10:01:00.000Z", mine: false, author: { firstname: "Bob" } },
];

describe("ChatScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getJourneyMessages.mockResolvedValue({ success: true, messages: CONVERSATION });
        sendJourneyMessage.mockResolvedValue({ success: true });
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it("shows the conversation with the other user's name", async () => {
        const { findByText, getByText } = render(<ChatScreen />);

        expect(await findByText("Bob Durand")).toBeTruthy();
        expect(getByText("Bonjour Bob !")).toBeTruthy();
        expect(getByText("J'arrive dans 5 minutes.")).toBeTruthy();
        expect(getJourneyMessages).toHaveBeenCalledWith({ token: "jwt", foundJourneyId: 7 });
    });

    it("invites the user to start when there is nothing yet", async () => {
        getJourneyMessages.mockResolvedValue({ success: true, messages: [] });

        const { findByTestId } = render(<ChatScreen />);

        expect(await findByTestId("chat-empty")).toBeTruthy();
    });

    it("sends a message and refreshes the conversation", async () => {
        const { findByTestId, getByTestId } = render(<ChatScreen />);
        await findByTestId("chat-input");

        fireEvent.changeText(getByTestId("chat-input"), "Je suis devant l'entrée");
        fireEvent.press(getByTestId("chat-send"));

        await waitFor(() => {
            expect(sendJourneyMessage).toHaveBeenCalledWith({
                token: "jwt",
                foundJourneyId: 7,
                body: "Je suis devant l'entrée",
            });
        });
        // Reloaded after sending (initial load + refresh).
        expect(getJourneyMessages.mock.calls.length).toBeGreaterThan(1);
    });

    it("does not send an empty message", async () => {
        const { findByTestId, getByTestId } = render(<ChatScreen />);
        await findByTestId("chat-input");

        fireEvent.changeText(getByTestId("chat-input"), "   ");
        fireEvent.press(getByTestId("chat-send"));

        expect(sendJourneyMessage).not.toHaveBeenCalled();
    });

    it("shows why the conversation cannot be read", async () => {
        getJourneyMessages.mockResolvedValue({
            success: false,
            message: "Cette conversation ne vous est pas accessible.",
        });

        const { findByText } = render(<ChatScreen />);

        expect(await findByText("Cette conversation ne vous est pas accessible.")).toBeTruthy();
    });

    it("asks the user to reconnect when the session is missing", async () => {
        getSession.mockResolvedValue(null);

        const { findByText } = render(<ChatScreen />);

        expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
        expect(getJourneyMessages).not.toHaveBeenCalled();
    });

    it("goes back", async () => {
        const { findByLabelText } = render(<ChatScreen />);
        fireEvent.press(await findByLabelText("Retour"));

        expect(mockGoBack).toHaveBeenCalled();
    });
});
