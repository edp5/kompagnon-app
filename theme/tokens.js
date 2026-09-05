/**
 * Kompagnon Design Tokens — mobile mirror of the web Design System v3.0.
 * Source of truth: web repo `src/styles/design-system.css`.
 * Philosophy: warm, human, calm, inclusive, premium — a reassuring digital
 * companion for solidarity & mobility (not a SaaS dashboard).
 */
import { Platform } from "react-native";

export const colors = {
  // -- Brand palette (from logo) --
  navy: "#1E2C38",
  teal: "#48AFC4",
  cream: "#F3EDE6",
  aqua: "#9ED4D9",

  // -- Surfaces --
  bg: "#F8F4EF", // warm off-white page background
  beige: "#EDE7DF", // secondary surface
  sand: "#DDD6CC", // tertiary surface
  surface: "#FFFFFF", // card / panel
  border: "#E8E2DB", // warm border

  // -- Teal accent --
  tealLight: "#D4EFF3",
  tealDark: "#2D8FA3",

  // -- Navy --
  navyLight: "#DDE3E8",

  // -- Text --
  text: "#1E2C38",
  textMedium: "#5A6C7A",
  textLight: "#8FA0AD",
  textOnDark: "#FFFFFF",

  // -- Status --
  success: "#2D9E60",
  successBg: "#D4F0E0",
  successText: "#1A6B3E",
  warning: "#C48A00",
  danger: "#D43A3A",
  dangerBg: "rgba(212, 58, 58, 0.09)",
  dangerBorder: "rgba(212, 58, 58, 0.22)",
};

// -- Border radius (px) --
export const radius = {
  xs: 6,
  sm: 10,
  md: 12, // inputs
  lg: 20, // cards
  xl: 24, // large cards
  xxl: 32, // hero / banner
  full: 999, // pills / buttons
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// -- Font families --
// Titles use More Sugar, the brand typeface (bundled in assets/fonts). It ships
// only in Regular and Thin, so the display scale relies on size rather than
// weight. Body copy stays on DM Sans, which is easier to read at small sizes.
export const fonts = {
  brand: "MoreSugar-Regular",
  brandThin: "MoreSugar-Thin",
  display: "MoreSugar-Regular", // titles
  displayBold: "MoreSugar-Regular",
  displayBlack: "MoreSugar-Regular",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemiBold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
};

// -- Elevation presets (navy-tinted, matching web shadow scale) --
export const shadow = {
  // On web, RN deprecates shadow* props in favor of boxShadow; native keeps
  // the shadow*/elevation props (rendered identically as before).
  card: Platform.select({
    web: { boxShadow: "0px 2px 12px rgba(30, 44, 56, 0.06)" },
    default: {
      shadowColor: "#1E2C38",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
  }),
  teal: Platform.select({
    web: { boxShadow: "0px 6px 20px rgba(72, 175, 196, 0.3)" },
    default: {
      shadowColor: colors.teal,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 6,
    },
  }),
};
