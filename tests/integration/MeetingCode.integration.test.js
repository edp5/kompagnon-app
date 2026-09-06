import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Speech from "expo-speech";
import { AccessibilityInfo } from "react-native";

import MeetingCode from "../../components/MeetingCode";
import { speaksAloud } from "../../utils/preferences";

jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock("../../utils/preferences", () => ({ speaksAloud: jest.fn() }));

describe("MeetingCode — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        speaksAloud.mockResolvedValue(true);
        jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("shows the four digits apart, so they can be read one by one", () => {
        const { getByText } = render(<MeetingCode code="4821" otherName="Léo" />);

        ["4", "8", "2", "1"].forEach((digit) => {
            expect(getByText(digit)).toBeTruthy();
        });
    });

    it("spells the code out for a screen reader instead of saying a number", () => {
        const { getByTestId } = render(<MeetingCode code="4821" otherName="Léo" />);

        expect(getByTestId("meeting-code-digits").props.accessibilityLabel).toBe(
            "Votre code de rencontre est 4 8 2 1",
        );
    });

    it("says who else can see the code", () => {
        const { getByText } = render(<MeetingCode code="4821" otherName="Léo" />);

        expect(getByText(/Léo voit le même code/)).toBeTruthy();
    });

    it("falls back to a neutral wording when the other name is unknown", () => {
        const { getByText } = render(<MeetingCode code="4821" />);

        expect(getByText(/votre binôme voit le même code/)).toBeTruthy();
    });

    it("says the digits out loud on demand, screen reader or not", async () => {
        const { getByTestId } = render(<MeetingCode code="4821" otherName="Léo" />);

        fireEvent.press(getByTestId("meeting-code-speak"));

        // Speaking is the point of the button: an accessibility announcement
        // alone only reaches someone who already runs VoiceOver or TalkBack.
        await waitFor(() => {
            expect(Speech.speak).toHaveBeenCalledWith("Votre code de rencontre est 4 8 2 1", {
                language: "fr-FR",
            });
        });
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
            "Votre code de rencontre est 4 8 2 1",
        );
    });

    it("cuts off whatever it was saying before repeating the code", async () => {
        const { getByTestId } = render(<MeetingCode code="4821" />);

        fireEvent.press(getByTestId("meeting-code-speak"));
        fireEvent.press(getByTestId("meeting-code-speak"));

        await waitFor(() => {
            expect(Speech.stop).toHaveBeenCalledTimes(2);
        });
        expect(Speech.speak).toHaveBeenCalledTimes(2);
    });

    it("keeps quiet when the user asked for silence, but still tells the screen reader", async () => {
        speaksAloud.mockResolvedValue(false);

        const { getByTestId } = render(<MeetingCode code="4821" />);
        fireEvent.press(getByTestId("meeting-code-speak"));

        await waitFor(() => {
            expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalled();
        });
        // The announcement is how the app talks to a screen reader; the switch
        // only governs the phone speaking on its own.
        expect(Speech.speak).not.toHaveBeenCalled();
    });

    it("keeps a repeated digit rather than collapsing it", () => {
        const { getAllByText, getByTestId } = render(<MeetingCode code="7007" />);

        expect(getAllByText("0")).toHaveLength(2);
        expect(getByTestId("meeting-code-digits").props.accessibilityLabel).toBe(
            "Votre code de rencontre est 7 0 0 7",
        );
    });

    it("shows nothing while the match has no code yet", () => {
        const { queryByTestId } = render(<MeetingCode code={null} otherName="Léo" />);

        expect(queryByTestId("meeting-code")).toBeNull();
    });
});
