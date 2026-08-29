import { render } from "@testing-library/react-native";

import JourneyMap from "../../components/JourneyMap";

const MINE = {
    departure: { lat: 48.8558, lon: 2.3588, label: "12 Rue de Rivoli" },
    arrival: { lat: 48.8443, lon: 2.3743, label: "Gare de Lyon" },
};

describe("JourneyMap — Integration Tests", () => {
    it("renders the map when the user's trip has coordinates", () => {
        const { getByLabelText } = render(<JourneyMap mine={MINE} meeting={MINE.departure} />);

        expect(getByLabelText(/Carte de l'itinéraire/)).toBeTruthy();
    });

    it("renders nothing when the departure coordinates are missing", () => {
        const { toJSON } = render(<JourneyMap mine={{ departure: { lat: null, lon: null } }} />);

        expect(toJSON()).toBeNull();
    });

    it("renders nothing when there is no trip at all", () => {
        const { toJSON } = render(<JourneyMap />);

        expect(toJSON()).toBeNull();
    });
});
