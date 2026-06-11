import { render } from "@testing-library/react-native";

import App from "../App.js";
import { checkHealth } from "../utils/api-fetch";

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

jest.mock("../utils/api-fetch", () => ({
  checkHealth: jest.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the auth flow when the API is healthy", async () => {
    checkHealth.mockResolvedValue(true);

    const { findByText } = render(<App />);

    expect(await findByText("REGISTER_SCREEN")).toBeTruthy();
  });

  it("shows an error message when the API is unavailable", async () => {
    checkHealth.mockResolvedValue(false);

    const { findByText } = render(<App />);

    expect(await findByText("Service indisponible")).toBeTruthy();
  });
});
