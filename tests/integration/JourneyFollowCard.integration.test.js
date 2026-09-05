import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Share } from "react-native";

import JourneyFollowCard from "../../components/JourneyFollowCard";
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

const THEIR_POSITION = { lat: "48.87", lon: "2.33", mine: false, firstname: "Bob" };

describe("JourneyFollowCard — Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
});
