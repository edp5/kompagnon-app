import { approachAnnouncement, distanceInMetres } from "../../../utils/proximity";

describe("Unit | Utils | distanceInMetres", () => {
  it("measures a short walk", () => {
    // Bastille to Nation, about 1.9 km apart.
    const metres = distanceInMetres(
      { lat: 48.8532, lon: 2.3692 },
      { lat: 48.8484, lon: 2.3958 },
    );

    expect(metres).toBeGreaterThan(1900);
    expect(metres).toBeLessThan(2100);
  });

  it("measures zero between a point and itself", () => {
    expect(distanceInMetres({ lat: 48.85, lon: 2.35 }, { lat: 48.85, lon: 2.35 })).toBe(0);
  });

  it("accepts the strings the API returns for decimals", () => {
    const metres = distanceInMetres({ lat: "48.8532", lon: "2.3692" }, { lat: "48.8484", lon: "2.3958" });

    expect(metres).toBeGreaterThan(1900);
  });

  it("returns nothing when a coordinate is missing or unusable", () => {
    expect(distanceInMetres({ lat: 48.85 }, { lat: 48.85, lon: 2.35 })).toBeNull();
    expect(distanceInMetres({ lat: "nowhere", lon: 2.35 }, { lat: 48.85, lon: 2.35 })).toBeNull();
    expect(distanceInMetres(null, { lat: 48.85, lon: 2.35 })).toBeNull();
  });

  it("refuses a null coordinate rather than reading it as zero", () => {
    // Number(null) is 0, which would put the point off the Gulf of Guinea and
    // answer a confident, wrong distance.
    expect(distanceInMetres({ lat: 48.85, lon: 2.35 }, { lat: null, lon: null })).toBeNull();
    expect(distanceInMetres({ lat: 48.85, lon: 2.35 }, { lat: "", lon: "" })).toBeNull();
  });
});

describe("Unit | Utils | approachAnnouncement", () => {
  it("says nothing while the pair is still far away", () => {
    expect(approachAnnouncement({ metres: 1200, announcedStep: null, otherName: "Léo" })).toBeNull();
  });

  it("announces the first step reached", () => {
    const announcement = approachAnnouncement({ metres: 430, announcedStep: null, otherName: "Léo" });

    expect(announcement).toEqual({ step: 500, sentence: "Léo est à moins de 500 mètres." });
  });

  it("says nothing again at the same step", () => {
    expect(approachAnnouncement({ metres: 410, announcedStep: 500, otherName: "Léo" })).toBeNull();
  });

  it("announces the next step once it is crossed", () => {
    const announcement = approachAnnouncement({ metres: 180, announcedStep: 500, otherName: "Léo" });

    expect(announcement).toEqual({ step: 200, sentence: "Léo est à moins de 200 mètres." });
  });

  it("stays quiet when the pair walks back away", () => {
    expect(approachAnnouncement({ metres: 460, announcedStep: 200, otherName: "Léo" })).toBeNull();
  });

  it("drops the metres once the pair is next to the user", () => {
    const announcement = approachAnnouncement({ metres: 8, announcedStep: 50, otherName: "Léo" });

    expect(announcement).toEqual({ step: 20, sentence: "Léo est tout près de vous." });
  });

  it("skips the steps crossed between two readings", () => {
    const announcement = approachAnnouncement({ metres: 60, announcedStep: null, otherName: "Léo" });

    expect(announcement.step).toBe(100);
  });

  it("falls back to a neutral wording without a name", () => {
    const announcement = approachAnnouncement({ metres: 90, announcedStep: null });

    expect(announcement.sentence).toBe("Votre binôme est à moins de 100 mètres.");
  });
});
