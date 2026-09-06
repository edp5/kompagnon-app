import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Alert, Share } from "react-native";

import * as Speech from "expo-speech";

import JourneyFollowCard from "../../components/JourneyFollowCard";
import { speaksAloud } from "../../utils/preferences";
import { createShareLink, getPositions, recordPosition } from "../../utils/following";
import { getCurrentPosition } from "../../utils/location";
import { getSession } from "../../utils/session";

jest.mock("../../utils/following", () => ({
    getPositions: jest.fn(),
    recordPosition: jest.fn(),
    createShareLink: jest.fn(),
}));
jest.mock("../../utils/location", () => ({ getCurrentPosition: jest.fn() }));
jest.mock("../../utils/session", () => ({ getSession: jest.fn() }));
jest.mock("../../utils/preferences", () => ({ speaksAloud: jest.fn() }));
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn() }));

const THEIR_POSITION = { lat: "48.87", lon: "2.33", mine: false, firstname: "Bob" };

describe("JourneyFollowCard — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        speaksAloud.mockResolvedValue(true);
        getSession.mockResolvedValue({ token: "jwt", userId: 12 });
        getPositions.mockResolvedValue({ success: true, positions: [] });
        recordPosition.mockResolvedValue({ success: true });
        getCurrentPosition.mockResolvedValue({ granted: true, latitude: 48.85, longitude: 2.35 });
        createShareLink.mockResolvedValue({
            success: true,
            share: { token: "abc", url: "http://web/#/suivi/abc", expiresAt: "2026-09-06T00:00:00.000Z" },
        });
        jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("says when the pair is not sharing their position yet", async () => {
        const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);

        const status = await findByTestId("follow-status");
        expect(status.props.children).toContain("ne partage pas encore sa position");
    });

    it("says when the pair is sharing, without the user having to share back", async () => {
        getPositions.mockResolvedValue({ success: true, positions: [THEIR_POSITION] });

        const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);

        await waitFor(() => {
            expect(findByTestId("follow-status")).toBeTruthy();
        });
        expect(recordPosition).not.toHaveBeenCalled();
    });

    it("hands the positions to the map", async () => {
        getPositions.mockResolvedValue({ success: true, positions: [THEIR_POSITION] });
        const onPositions = jest.fn();

        render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" onPositions={onPositions} />);

        await waitFor(() => {
            expect(onPositions).toHaveBeenCalledWith([THEIR_POSITION]);
        });
    });

    it("reports the position only once the user turns it on", async () => {
        const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
        const toggle = await findByTestId("follow-position-switch");

        expect(recordPosition).not.toHaveBeenCalled();

        fireEvent(toggle, "valueChange", true);

        await waitFor(() => {
            expect(recordPosition).toHaveBeenCalledWith({
                token: "jwt",
                foundJourneyId: 3,
                lat: 48.85,
                lon: 2.35,
            });
        });
    });

    it("explains that the location permission is needed", async () => {
        getCurrentPosition.mockResolvedValue({ granted: false });

        const { findByTestId, findByText } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
        fireEvent(await findByTestId("follow-position-switch"), "valueChange", true);

        expect(await findByText("Autorisez la localisation pour partager votre position.")).toBeTruthy();
        expect(recordPosition).not.toHaveBeenCalled();
    });

    it("creates a link and opens the share sheet", async () => {
        const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
        fireEvent.press(await findByTestId("follow-share-button"));

        await waitFor(() => {
            expect(createShareLink).toHaveBeenCalledWith({ token: "jwt", foundJourneyId: 3 });
            expect(Share.share).toHaveBeenCalledWith({
                message: "Suivez mon trajet Kompagnon en direct : http://web/#/suivi/abc",
            });
        });
    });

    it("shows why the link could not be created", async () => {
        createShareLink.mockResolvedValue({ success: false, message: "Impossible de créer le lien de suivi." });

        const { findByTestId, findByText } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
        fireEvent.press(await findByTestId("follow-share-button"));

        expect(await findByText("Impossible de créer le lien de suivi.")).toBeTruthy();
        expect(Share.share).not.toHaveBeenCalled();
    });

    it("falls back to showing the link when the share sheet cannot open", async () => {
        jest.spyOn(Alert, "alert").mockImplementation(() => {});
        Share.share.mockRejectedValue(new Error("no share sheet"));

        const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
        fireEvent.press(await findByTestId("follow-share-button"));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Lien de suivi", "http://web/#/suivi/abc");
        });
    });

    describe("as the pair gets closer", () => {
        const BASTILLE = { lat: "48.8532", lon: "2.3692", mine: true, firstname: "Nina" };
        const near = (metres) => ({
            lat: String(48.8532 + metres / 111320),
            lon: "2.3692",
            mine: false,
            firstname: "Léo",
        });

        beforeEach(() => {
            jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
        });

        it("says how far away the pair is", async () => {
            getPositions.mockResolvedValue({ success: true, positions: [BASTILLE, near(180)] });

            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Léo" />);

            expect((await findByTestId("follow-status")).props.children).toContain("Léo est à");
        });

        it("announces the pair coming within a distance", async () => {
            getPositions.mockResolvedValue({ success: true, positions: [BASTILLE, near(180)] });

            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Léo" />);
            await findByTestId("follow-status");

            await waitFor(() => {
                expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
                    "Léo est à moins de 200 mètres.",
                );
            });
        });

        it("says the approach out loud", async () => {
            getPositions.mockResolvedValue({ success: true, positions: [BASTILLE, near(180)] });

            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Léo" />);
            await findByTestId("follow-status");

            await waitFor(() => {
                expect(Speech.speak).toHaveBeenCalledWith("Léo est à moins de 200 mètres.", {
                    language: "fr-FR",
                });
            });
        });

        it("keeps the phone quiet when the user asked for silence", async () => {
            speaksAloud.mockResolvedValue(false);
            getPositions.mockResolvedValue({ success: true, positions: [BASTILLE, near(180)] });

            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Léo" />);
            await findByTestId("follow-status");

            await waitFor(() => {
                // The screen reader is still told: the switch governs the phone
                // speaking on its own, not how the app talks to a screen reader.
                expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalled();
            });
            expect(Speech.speak).not.toHaveBeenCalled();
        });

        it("stays quiet while the pair is still far off", async () => {
            getPositions.mockResolvedValue({ success: true, positions: [BASTILLE, near(1500)] });

            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Léo" />);
            const status = await findByTestId("follow-status");

            // Far enough that metres would be noise, so it reads in kilometres.
            expect(status.props.children).toContain("1,5 kilomètres");
            expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
        });

        it("says only that the pair is sharing when the user is not", async () => {
            getPositions.mockResolvedValue({ success: true, positions: [near(180)] });

            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Léo" />);

            expect((await findByTestId("follow-status")).props.children).toContain(
                "Léo partage sa position.",
            );
            expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
        });
    });

    describe("without a session", () => {
        beforeEach(() => {
            getSession.mockResolvedValue(null);
        });

        it("reads nothing rather than calling the API without a token", async () => {
            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
            await findByTestId("journey-follow-card");

            expect(getPositions).not.toHaveBeenCalled();
        });

        it("reports nothing when the user turns sharing on", async () => {
            const { findByTestId } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
            fireEvent(await findByTestId("follow-position-switch"), "valueChange", true);

            await waitFor(() => {
                expect(getSession).toHaveBeenCalled();
            });
            expect(recordPosition).not.toHaveBeenCalled();
        });

        it("asks the user to reconnect instead of creating a link", async () => {
            const { findByTestId, findByText } = render(<JourneyFollowCard foundJourneyId={3} otherName="Bob" />);
            fireEvent.press(await findByTestId("follow-share-button"));

            expect(await findByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
            expect(createShareLink).not.toHaveBeenCalled();
        });
    });
});
