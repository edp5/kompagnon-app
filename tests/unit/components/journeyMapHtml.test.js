import { buildHtml } from "../../../components/journeyMapHtml";

const TRIP = {
  departure: { lat: 48.8532, lon: 2.3692, label: "Bastille" },
  arrival: { lat: 48.8484, lon: 2.3958, label: "Nation" },
};

const PATH = [[2.3692, 48.8532], [2.3750, 48.8520], [2.3800, 48.8500], [2.3958, 48.8484]];

/**
 * The config object the generated page is built around.
 * @param {string} html - The generated page.
 * @returns {object} The parsed config.
 */
function configOf(html) {
  return JSON.parse(html.match(/var C = (\{.*?\});/s)[1]);
}

describe("Unit | Components | journeyMapHtml", () => {
  it("hands the walking path to the page when one was found", () => {
    expect(configOf(buildHtml({ mine: TRIP, route: PATH })).route).toEqual(PATH);
  });

  it("carries no path when none was found", () => {
    expect(configOf(buildHtml({ mine: TRIP })).route).toBeNull();
  });

  it("draws the found path rather than a line between the two ends", () => {
    const html = buildHtml({ mine: TRIP, route: PATH });

    expect(html).toContain("var walked = route && route.length > 1");
    expect(html).toContain("var line = walked ? route : [from, to]");
  });

  it("dashes the line when it is only the straight line", () => {
    // A straight line must never pass for a route someone can walk, so it is
    // drawn the way an approximation should be drawn.
    expect(buildHtml({ mine: TRIP })).toContain("(dashed || !walked)");
  });
});
