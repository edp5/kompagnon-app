import { Feather } from "@expo/vector-icons";
import React from "react";

/**
 * Feather icon that is hidden from screen readers by default. Icons in this app
 * are decorative and always paired with visible text, so announcing them adds
 * noise for VoiceOver / TalkBack users. Pass an `accessibilityLabel` for the
 * rare icon that carries meaning on its own; it is then exposed as an image.
 *
 * @param {object} props - Feather props (name, size, color, style…).
 * @param {string} [props.accessibilityLabel] - Makes the icon meaningful when set.
 */
export default function Icon({ accessibilityLabel, ...props }) {
  const decorative = !accessibilityLabel;
  return (
    <Feather
      {...props}
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
    />
  );
}
