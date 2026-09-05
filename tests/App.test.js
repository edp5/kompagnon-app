import { render } from "@testing-library/react-native";

import App from "../App.js";
import { checkHealth } from "../utils/api-fetch";
import { hasSeenOnboarding } from "../utils/onboarding";
import { clearSession, getSession } from "../utils/session";
import { getUserProfile } from "../utils/users";

// Mock the screens so this suite only verifies the app shell: the API health
// gate and the navigator's initial route.
jest.mock("../screens/RegistrationScreen", () => {
  const { Text } = require("react-native");
  const Screen = () => <Text>REGISTER_SCREEN</Text>;
  Screen.displayName = "MockRegisterScreen";
  return Screen;
});
jest.mock("../screens/LoginScreen", () => {
  const { Text } = require("react-native");
  const Screen = () => <Text>LOGIN_SCREEN</Text>;
  Screen.displayName = "MockLoginScreen";
  return Screen;
});
jest.mock("../screens/OnboardingScreen", () => {
  const { Text } = require("react-native");
  const Screen = () => <Text>ONBOARDING_SCREEN</Text>;
  Screen.displayName = "MockOnboardingScreen";
  return Screen;
});
jest.mock("../screens/WelcomeScreen", () => {
  const { Text } = require("react-native");
  const Screen = () => <Text>WELCOME_SCREEN</Text>;
  Screen.displayName = "MockWelcomeScreen";
  return Screen;
});
jest.mock("../screens/HomeScreen", () => {
  const { Text } = require("react-native");
  const Screen = () => <Text>HOME_SCREEN</Text>;
  Screen.displayName = "MockHomeScreen";
  return Screen;
});
jest.mock("../screens/RecordJourneyScreen", () => {
  const { Text } = require("react-native");
  const Screen = () => <Text>RECORD_JOURNEY_SCREEN</Text>;
  Screen.displayName = "MockRecordJourneyScreen";
  return Screen;
});

jest.mock("../utils/api-fetch", () => ({
  checkHealth: jest.fn(),
}));

jest.mock("../utils/session", () => ({
  getSession: jest.fn(),
  clearSession: jest.fn(),
}));

jest.mock("../utils/users", () => ({
  getUserProfile: jest.fn(),
}));

jest.mock("../utils/onboarding", () => ({
  hasSeenOnboarding: jest.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkHealth.mockResolvedValue(true);
    getSession.mockResolvedValue(null);
    getUserProfile.mockResolvedValue({ success: true, profile: { firstname: "Alice" } });
    hasSeenOnboarding.mockResolvedValue(true);
  });

  it("shows an error message when the API is unavailable", async () => {
    checkHealth.mockResolvedValue(false);

    const { findByText } = render(<App />);

    expect(await findByText("Service indisponible")).toBeTruthy();
  });

  it("starts on the welcome screen when the API is healthy and no session is stored", async () => {
    const { findByText } = render(<App />);

    expect(await findByText("WELCOME_SCREEN")).toBeTruthy();
  });

  it("introduces the app on the very first launch", async () => {
    hasSeenOnboarding.mockResolvedValue(false);

    const { findByText } = render(<App />);

    expect(await findByText("ONBOARDING_SCREEN")).toBeTruthy();
  });

  it("starts on Home when a session is stored and the token is still valid", async () => {
    getSession.mockResolvedValue({ token: "jwt", userId: 1 });

    const { findByText } = render(<App />);

    expect(await findByText("HOME_SCREEN")).toBeTruthy();
    expect(getUserProfile).toHaveBeenCalledWith({ token: "jwt" });
  });

  it("logs out and starts on the welcome screen when the stored token is invalid", async () => {
    getSession.mockResolvedValue({ token: "expired", userId: 1 });
    getUserProfile.mockResolvedValue({ success: false, message: "Session expirée. Reconnectez-vous." });

    const { findByText, queryByText } = render(<App />);

    expect(await findByText("WELCOME_SCREEN")).toBeTruthy();
    expect(clearSession).toHaveBeenCalled();
    expect(queryByText("HOME_SCREEN")).toBeNull();
  });

  it("does not read the session when the API is unavailable", async () => {
    checkHealth.mockResolvedValue(false);

    const { findByText } = render(<App />);
    await findByText("Service indisponible");

    expect(getSession).not.toHaveBeenCalled();
  });
});
