jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn(),
}));

import * as Location from "expo-location";

import { geocodeAddress, getCurrentPosition, reverseGeocode, searchAddresses } from "../../../utils/location";

describe("Unit | Utils | location", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentPosition", () => {
    it("returns coordinates when permission is granted", async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
      Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: 48.85, longitude: 2.35 } });

      expect(await getCurrentPosition()).toEqual({ granted: true, latitude: 48.85, longitude: 2.35 });
    });

    it("returns granted:false and does not read the position when permission is denied", async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });

      expect(await getCurrentPosition()).toEqual({ granted: false });
      expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });
  });

  describe("reverseGeocode", () => {
    it("builds a readable address from the first match", async () => {
      Location.reverseGeocodeAsync.mockResolvedValue([
        { streetNumber: "10", street: "Rue de Paris", postalCode: "75001", city: "Paris" },
      ]);

      expect(await reverseGeocode({ latitude: 1, longitude: 2 })).toBe("10 Rue de Paris, 75001, Paris");
    });

    it("returns an empty string when nothing is found", async () => {
      Location.reverseGeocodeAsync.mockResolvedValue([]);

      expect(await reverseGeocode({ latitude: 1, longitude: 2 })).toBe("");
    });
  });

  describe("geocodeAddress", () => {
    it("returns coordinates for an address", async () => {
      Location.geocodeAsync.mockResolvedValue([{ latitude: 48.85, longitude: 2.35 }]);

      expect(await geocodeAddress("Paris")).toEqual({ latitude: 48.85, longitude: 2.35 });
    });

    it("returns null when the address is not found", async () => {
      Location.geocodeAsync.mockResolvedValue([]);

      expect(await geocodeAddress("nowhere")).toBeNull();
    });
  });

  describe("searchAddresses", () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it("returns an empty list for short queries without calling the network", async () => {
      expect(await searchAddresses("ab")).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("maps results to a label and coordinates", async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => [{ display_name: "10 Rue de Paris, Paris", lat: "48.8", lon: "2.3" }],
      });

      expect(await searchAddresses("10 rue de paris")).toEqual([
        { label: "10 Rue de Paris, Paris", latitude: 48.8, longitude: 2.3 },
      ]);
    });

    it("returns an empty list on a non-ok response", async () => {
      fetch.mockResolvedValue({ ok: false });

      expect(await searchAddresses("paris")).toEqual([]);
    });

    it("returns an empty list when the request throws", async () => {
      fetch.mockRejectedValue(new Error("network"));

      expect(await searchAddresses("paris")).toEqual([]);
    });
  });
});
