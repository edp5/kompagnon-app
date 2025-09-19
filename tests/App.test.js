import { render } from "@testing-library/react-native";

import App from "../App.js";

describe("App", () => {
  it("should display text", () => {
    // given
    const { getByText } = render(<App/>);

    // when
    const textElement = getByText("Hello, World!");

    // then
    expect(textElement).toBeTruthy();
  });
});
