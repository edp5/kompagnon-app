import { getItem, setItem } from "./storage";

const ONBOARDING_KEY = "onboarding_seen";

/**
 * True once the introduction has been shown, so it only greets a first launch.
 * @returns {Promise<boolean>}
 */
async function hasSeenOnboarding() {
  try {
    return (await getItem(ONBOARDING_KEY)) === "true";
  } catch {
    // A storage failure must not keep the user out of the app.
    return true;
  }
}

/** Remembers that the introduction has been shown. @returns {Promise<void>} */
async function markOnboardingSeen() {
  try {
    await setItem(ONBOARDING_KEY, "true");
  } catch {
    // Not being able to remember it only means showing it again later.
  }
}

export { hasSeenOnboarding, markOnboardingSeen };
