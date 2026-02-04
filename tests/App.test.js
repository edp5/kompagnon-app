import { fireEvent, render } from "@testing-library/react-native";

import App from "../App.js";
import * as apiFetchModule from "../utils/api-fetch.js";


jest.mock("../screens/RegistrationScreen", () => {
  const { View, Button } = require("react-native");
  const MockRegistrationScreen = ({ onRegisterSuccess }) => (
    <View>
      <Button title="Mock Register" onPress={onRegisterSuccess} />
    </View>
  );
  MockRegistrationScreen.displayName = "MockRegistrationScreen";
  return MockRegistrationScreen;
});

describe("App", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when api is not active", () => {
    it("should display text", async () => {
      // given
      jest.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ status: 500 });

      // when
      const { getByText, findByText } = render(<App />);
      fireEvent.press(getByText("Mock Register"));

      // then
      const textElement = await findByText("API is not active");

      expect(textElement).toBeTruthy();
    });
  });

  describe("when api is active", () => {
    it("should display hello world message", async () => {
      // given
      jest.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ status: 200 });

      // when
      const { getByText, findByText } = render(<App />);
      fireEvent.press(getByText("Mock Register"));

      // then
      const textElement = await findByText("Hello, World!");
      expect(textElement).toBeTruthy();

    });
  });
});
