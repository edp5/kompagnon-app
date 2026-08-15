import { render } from "@testing-library/react-native";

import App from "../App.js";
import { checkHealth } from "../utils/api-fetch";
import { getSession } from "../utils/session";

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
}));

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkHealth.mockResolvedValue(true);
    getSession.mockResolvedValue(null);
  });

  it("shows an error message when the API is unavailable", async () => {
    checkHealth.mockResolvedValue(false);

    const { findByText } = render(<App />);

    expect(await findByText("Service indisponible")).toBeTruthy();
  });

  it("starts on Register when the API is healthy and no session is stored", async () => {
    const { findByText } = render(<App />);

    expect(await findByText("REGISTER_SCREEN")).toBeTruthy();
  });

  it("starts on Home when a session is stored (auto-login)", async () => {
    getSession.mockResolvedValue({ token: "jwt", userId: 1 });

    const { findByText } = render(<App />);

    expect(await findByText("HOME_SCREEN")).toBeTruthy();
  });

  it("does not read the session when the API is unavailable", async () => {
    checkHealth.mockResolvedValue(false);

    const { findByText } = render(<App />);
    await findByText("Service indisponible");

    expect(getSession).not.toHaveBeenCalled();
  });
});
