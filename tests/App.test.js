import { render } from "@testing-library/react-native";

import App from "../App.js";
import * as apiFetchModule from "../utils/api-fetch.js";

describe("App", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when api is not active", () => {
    it("should display text", async () => {
      // given
      jest.spyOn(apiFetchModule, "apiFetch").mockResolvedValue({ status: 500 });

      // when
      const { findByText } = render(<App />);

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
      const { findByText } = render(<App />);

      // then
      const textElement = await findByText("Hello, World!");
      expect(textElement).toBeTruthy();

    });
  });
});
