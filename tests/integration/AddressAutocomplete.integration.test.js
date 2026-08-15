import { act, fireEvent, render } from "@testing-library/react-native";

import AddressAutocomplete from "../../components/AddressAutocomplete";
import { searchAddresses } from "../../utils/location";

jest.mock("../../utils/location", () => ({
  searchAddresses: jest.fn(),
}));

function setup(props = {}) {
  const onChangeText = jest.fn();
  const onSelect = jest.fn();
  const utils = render(
    <AddressAutocomplete
      label="Adresse"
      icon="map-pin"
      placeholder="adresse"
      value=""
      onChangeText={onChangeText}
      onSelect={onSelect}
      testID="addr"
      {...props}
    />,
  );
  return { onChangeText, onSelect, ...utils };
}

describe("AddressAutocomplete", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("forwards keystrokes but does not search for short queries", () => {
    jest.useFakeTimers();
    const { onChangeText, getByTestId } = setup();

    fireEvent.changeText(getByTestId("addr"), "ab");

    expect(onChangeText).toHaveBeenCalledWith("ab");
    jest.advanceTimersByTime(500);
    expect(searchAddresses).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("shows suggestions after typing and emits the picked one", async () => {
    searchAddresses.mockResolvedValue([
      { label: "10 Rue de Paris, Paris", latitude: 48.8, longitude: 2.3 },
    ]);
    const { onSelect, getByTestId, findByText } = setup();

    fireEvent.changeText(getByTestId("addr"), "10 rue de paris");

    const suggestion = await findByText("10 Rue de Paris, Paris");
    fireEvent.press(suggestion);

    expect(onSelect).toHaveBeenCalledWith({
      label: "10 Rue de Paris, Paris",
      latitude: 48.8,
      longitude: 2.3,
    });
  });

  it("debounces consecutive keystrokes into a single search", () => {
    jest.useFakeTimers();
    searchAddresses.mockResolvedValue([]);
    const { getByTestId } = setup();

    fireEvent.changeText(getByTestId("addr"), "10 rue");
    fireEvent.changeText(getByTestId("addr"), "10 rue de paris");
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(searchAddresses).toHaveBeenCalledTimes(1);
    expect(searchAddresses).toHaveBeenCalledWith("10 rue de paris");
    jest.useRealTimers();
  });

  it("clears the pending search timer on unmount", () => {
    jest.useFakeTimers();
    const { getByTestId, unmount } = setup();

    fireEvent.changeText(getByTestId("addr"), "10 rue de paris");
    unmount();
    jest.advanceTimersByTime(500);

    expect(searchAddresses).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
