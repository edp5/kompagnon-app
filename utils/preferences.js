import { getItem, setItem } from "./storage";

const SPOKEN_KEY = "spoken_announcements";

/**
 * Whether the app may speak on its own.
 *
 * On by default: the announcements exist for someone who cannot watch the
 * screen, and a setting they never find is worth nothing to them. It is the
 * person who does not want to be spoken to who goes looking for the switch.
 *
 * @returns {Promise<boolean>} True when the app may speak.
 */
async function speaksAloud() {
  try {
    // Only an explicit "no" turns it off, so a fresh install and a storage that
    // cannot be read both leave the announcements on.
    return (await getItem(SPOKEN_KEY)) !== "false";
  } catch {
    return true;
  }
}

/**
 * Records whether the app may speak on its own.
 * @param {boolean} allowed - Whether announcements are wanted.
 * @returns {Promise<void>}
 */
async function setSpeaksAloud(allowed) {
  try {
    await setItem(SPOKEN_KEY, allowed ? "true" : "false");
  } catch {
    // Not being able to remember it only means asking again next time.
  }
}

export { setSpeaksAloud, speaksAloud };
