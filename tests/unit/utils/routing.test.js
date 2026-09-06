import { buildDirectionsUrl, canRoute, getWalkingRoute, readRoute } from "../../../utils/routing";

const BASTILLE = { lat: 48.8532, lon: 2.3692 };
const NATION = { lat: 48.8484, lon: 2.3958 };
const PATH = [[2.3692, 48.8532], [2.3750, 48.8520], [2.3958, 48.8484]];

describe("Unit | Utils | buildDirectionsUrl", () => {
  it("asks for a walking route between the two ends", () => {
    const url = buildDirectionsUrl({ from: BASTILLE, to: NATION, apiKey: "k" });

    // Walking, not wheelchair: a blind passenger walks with a guide and can take
    // the stairs a wheelchair route would detour hundreds of metres around.
    expect(url).toContain("/v2/directions/foot-walking");
    expect(url).toContain("start=2.3692,48.8532");
    expect(url).toContain("end=2.3958,48.8484");
    expect(url).toContain("api_key=k");
  });

  it("escapes the key rather than pasting it into the query", () => {
    expect(buildDirectionsUrl({ from: BASTILLE, to: NATION, apiKey: "a b&c" })).toContain("api_key=a%20b%26c");
  });

  it("asks for nothing without a key", () => {
    expect(buildDirectionsUrl({ from: BASTILLE, to: NATION, apiKey: "" })).toBeNull();
  });

  it("asks for nothing when an end is missing or unusable", () => {
    expect(buildDirectionsUrl({ from: BASTILLE, to: { lat: null, lon: null }, apiKey: "k" })).toBeNull();
    expect(buildDirectionsUrl({ from: BASTILLE, to: { lat: "nowhere", lon: 2 }, apiKey: "k" })).toBeNull();
    expect(buildDirectionsUrl({ from: null, to: NATION, apiKey: "k" })).toBeNull();
  });
});

describe("Unit | Utils | readRoute", () => {
  it("reads the path out of the answer", () => {
    expect(readRoute({ features: [{ geometry: { coordinates: PATH } }] })).toEqual(PATH);
  });

  it("treats a single point as no path at all", () => {
    // Drawing it would hide the straight line, which at least says where the
    // journey goes.
    expect(readRoute({ features: [{ geometry: { coordinates: [[2.36, 48.85]] } }] })).toBeNull();
  });

  it("survives an answer shaped differently than expected", () => {
    expect(readRoute({})).toBeNull();
    expect(readRoute(null)).toBeNull();
    expect(readRoute({ features: [] })).toBeNull();
  });
});

describe("Unit | Utils | getWalkingRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("asks for nothing at all without a key", async () => {
    // The checkout under test carries no key, which is the state of any clone
    // that has not been given one.
    expect(canRoute()).toBe(false);

    expect(await getWalkingRoute({ from: BASTILLE, to: NATION })).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns the path the service answered with", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ features: [{ geometry: { coordinates: PATH } }] }),
    });

    expect(await getWalkingRoute({ from: BASTILLE, to: NATION, apiKey: "k" })).toEqual(PATH);
    expect(global.fetch.mock.calls[0][0]).toContain("foot-walking");
  });

  it("gives up rather than throwing when the service refuses", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 429 });

    expect(await getWalkingRoute({ from: BASTILLE, to: NATION, apiKey: "k" })).toBeNull();
  });

  it("gives up rather than throwing when the service cannot be reached", async () => {
    global.fetch.mockRejectedValue(new Error("network"));

    expect(await getWalkingRoute({ from: BASTILLE, to: NATION, apiKey: "k" })).toBeNull();
  });

  it("gives up when the answer holds no path worth drawing", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ features: [{ geometry: { coordinates: [[2.36, 48.85]] } }] }),
    });

    expect(await getWalkingRoute({ from: BASTILLE, to: NATION, apiKey: "k" })).toBeNull();
  });

  it("stops waiting rather than holding the screen", async () => {
    // The map is readable without a route, so the request carries an abort
    // signal and the caller simply gets nothing.
    global.fetch.mockImplementation((url, options) => {
      expect(options.signal).toBeDefined();
      return Promise.resolve({ ok: false });
    });

    expect(await getWalkingRoute({ from: BASTILLE, to: NATION, apiKey: "k" })).toBeNull();
  });
});
