import { render } from "@testing-library/react-native";

import App from "../App.js";

// Mock the screens so this suite only verifies the navigator wiring
// (initial route), not each screen's own behaviour.
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

describe("App", () => {
  it("should render the navigation container with Register as the initial route", () => {
    const { getByText } = render(<App />);

    expect(getByText("REGISTER_SCREEN")).toBeTruthy();
  });
});
