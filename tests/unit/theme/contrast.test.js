import { colors } from "../../../theme/tokens";

/**
 * Relative luminance of an #rrggbb colour, as defined by WCAG 2.1.
 * @param {string} hex - The colour.
 * @returns {number} Its relative luminance.
 */
function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Contrast ratio between two colours, from 1 (identical) to 21 (black on white).
 * @param {string} foreground
 * @param {string} background
 * @returns {number} The ratio.
 */
function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

// Every pairing the app actually renders text or a meaningful icon with. The
// app is built for people with a visual impairment, so these hold the AA
// threshold of 4.5:1 rather than the 3:1 that large text alone would allow.
const PAIRINGS = [
  ["the primary button label", colors.textOnDark, colors.teal],
  ["teal text on a card", colors.teal, colors.surface],
  ["teal text on the page", colors.teal, colors.bg],
  ["titles on the page", colors.navy, colors.bg],
  ["titles on a card", colors.navy, colors.surface],
  ["secondary text on the page", colors.textMedium, colors.bg],
  ["secondary text on a card", colors.textMedium, colors.surface],
  ["tertiary text on the page", colors.textLight, colors.bg],
  ["tertiary text on a card", colors.textLight, colors.surface],
  ["icons on a card", colors.tealDark, colors.surface],
  ["icons inside a light bubble", colors.tealDark, colors.tealLight],
  ["text on a navy surface", colors.textOnDark, colors.navy],
  ["the confirmed badge", colors.successText, colors.successBg],
  ["the pending badge", colors.warning, colors.sand],
  ["an error on the page", colors.danger, colors.bg],
  ["an error on a card", colors.danger, colors.surface],
];

describe("Unit | Theme | contrast", () => {
  it.each(PAIRINGS)("keeps %s readable", (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the brand teal out of white-on-colour pairings", () => {
    // The web design system's teal, which this palette used to carry. It is
    // recorded here so the reason `teal` holds a deeper tone stays visible.
    const brandTeal = "#48AFC4";

    expect(contrast(colors.textOnDark, brandTeal)).toBeLessThan(4.5);
    expect(colors.teal).not.toBe(brandTeal);
  });
});
