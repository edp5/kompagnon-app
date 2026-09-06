import { fireEvent, render, waitFor } from "@testing-library/react-native";

import SettingsScreen from "../../screens/SettingsScreen";
import { resetOnboarding } from "../../utils/onboarding";
import { setSpeaksAloud, speaksAloud } from "../../utils/preferences";

jest.mock("../../utils/preferences", () => ({
    speaksAloud: jest.fn(),
    setSpeaksAloud: jest.fn(),
}));
jest.mock("../../utils/onboarding", () => ({ resetOnboarding: jest.fn() }));

const mockGoBack = jest.fn();
const mockReset = jest.fn();
jest.mock("@react-navigation/native", () => ({
    useNavigation: () => ({ goBack: mockGoBack, reset: mockReset }),
}));

describe("SettingsScreen — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        speaksAloud.mockResolvedValue(true);
        setSpeaksAloud.mockResolvedValue(undefined);
        resetOnboarding.mockResolvedValue(undefined);
    });

    it("shows the spoken announcements as on by default", async () => {
        const { findByTestId } = render(<SettingsScreen />);

        expect((await findByTestId("settings-speech-switch")).props.value).toBe(true);
    });

    it("shows them as off when the user asked for silence", async () => {
        speaksAloud.mockResolvedValue(false);

        const { findByTestId } = render(<SettingsScreen />);

        await waitFor(async () => {
            expect((await findByTestId("settings-speech-switch")).props.value).toBe(false);
        });
    });

    it("records silence when the switch is turned off", async () => {
        const { findByTestId } = render(<SettingsScreen />);
        fireEvent(await findByTestId("settings-speech-switch"), "valueChange", false);

        await waitFor(() => {
            expect(setSpeaksAloud).toHaveBeenCalledWith(false);
        });
    });

    it("says the screen reader keeps announcing either way", async () => {
        const { findByText } = render(<SettingsScreen />);

        expect(await findByText(/le lecteur d'écran, lui, continue de tout annoncer/)).toBeTruthy();
    });

    it("replays the introduction from the beginning", async () => {
        const { findByTestId } = render(<SettingsScreen />);
        fireEvent.press(await findByTestId("settings-replay-onboarding"));

        await waitFor(() => {
            expect(resetOnboarding).toHaveBeenCalled();
        });
        expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Onboarding" }] });
    });

    it("goes back", async () => {
        const { findByLabelText } = render(<SettingsScreen />);
        fireEvent.press(await findByLabelText("Retour"));

        expect(mockGoBack).toHaveBeenCalled();
    });
});
