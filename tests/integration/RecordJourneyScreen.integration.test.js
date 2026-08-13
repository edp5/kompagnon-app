import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import RecordJourneyScreen from "../../screens/RecordJourneyScreen";
import { recordJourney } from "../../utils/journeys";
import { geocodeAddress, getCurrentPosition, reverseGeocode } from "../../utils/location";
import { getSession } from "../../utils/session";

jest.mock("../../utils/location", () => ({
  geocodeAddress: jest.fn(),
  getCurrentPosition: jest.fn(),
  reverseGeocode: jest.fn(),
}));

jest.mock("../../utils/journeys", () => ({
  recordJourney: jest.fn(),
}));

jest.mock("../../utils/session", () => ({
  getSession: jest.fn(),
}));

// Decouple the screen from the autocomplete internals: a plain input plus a
// button that emits a picked suggestion.
jest.mock("../../components/AddressAutocomplete", () => {
  const { Text, TextInput, TouchableOpacity } = require("react-native");
  const MockAutocomplete = ({ value, onChangeText, onSelect, testID }) => (
    <>
      <TextInput value={value} onChangeText={onChangeText} testID={testID} />
      <TouchableOpacity
        testID={`${testID}-pick`}
        onPress={() => onSelect({ label: `${testID}-picked`, latitude: 10, longitude: 20 })}
      >
        <Text>pick</Text>
      </TouchableOpacity>
    </>
  );
  MockAutocomplete.displayName = "MockAddressAutocomplete";
  return MockAutocomplete;
});

const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

describe("RecordJourneyScreen — Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fills the departure address from the current position", async () => {
    getCurrentPosition.mockResolvedValue({ granted: true, latitude: 48.85, longitude: 2.35 });
    reverseGeocode.mockResolvedValue("10 Rue de Paris, 75001, Paris");

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.press(getByText("Utiliser ma position"));

    await waitFor(() => {
      expect(getByTestId("departure-input").props.value).toBe("10 Rue de Paris, 75001, Paris");
    });
  });

  it("shows an error when location permission is denied", async () => {
    getCurrentPosition.mockResolvedValue({ granted: false });

    const { getByText } = render(<RecordJourneyScreen />);
    fireEvent.press(getByText("Utiliser ma position"));

    await waitFor(() => {
      expect(getByText("Autorisez la localisation pour utiliser votre position.")).toBeTruthy();
    });
  });

  it("requires a departure before submitting", () => {
    const { getByText } = render(<RecordJourneyScreen />);
    fireEvent.press(getByText("Demander un accompagnement"));

    expect(getByText("Indiquez votre point de départ.")).toBeTruthy();
    expect(recordJourney).not.toHaveBeenCalled();
  });

  it("records the journey and goes back on success", async () => {
    jest.spyOn(Alert, "alert");
    getCurrentPosition.mockResolvedValue({ granted: true, latitude: 48.85, longitude: 2.35 });
    reverseGeocode.mockResolvedValue("Départ");
    geocodeAddress.mockResolvedValue({ latitude: 1, longitude: 2 });
    getSession.mockResolvedValue({ token: "jwt", userId: 1 });
    recordJourney.mockResolvedValue({ success: true, journeyId: 9 });

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.press(getByText("Utiliser ma position"));
    await waitFor(() => expect(getByTestId("departure-input").props.value).toBe("Départ"));

    fireEvent.changeText(getByTestId("arrival-input"), "Gare de Lyon");
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(recordJourney).toHaveBeenCalled();
    });
    const payload = recordJourney.mock.calls[0][0];
    expect(payload.token).toBe("jwt");
    expect(payload.departureLat).toBe(48.85);
    expect(payload.arrivalLat).toBe(1);
    expect(payload.arrivalAddress).toBe("Gare de Lyon");

    expect(Alert.alert).toHaveBeenCalled();
    const onPress = Alert.alert.mock.calls[0][2][0].onPress;
    onPress();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("shows the API error message when recording fails", async () => {
    geocodeAddress.mockResolvedValue({ latitude: 1, longitude: 2 });
    getSession.mockResolvedValue({ token: "jwt" });
    recordJourney.mockResolvedValue({ success: false, message: "Impossible d'enregistrer le trajet. Réessayez." });

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.changeText(getByTestId("departure-input"), "Départ manuel");
    fireEvent.changeText(getByTestId("arrival-input"), "Arrivée");
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(getByText("Impossible d'enregistrer le trajet. Réessayez.")).toBeTruthy();
    });
  });

  it("requires a destination once a departure is set", () => {
    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.changeText(getByTestId("departure-input"), "Départ");
    fireEvent.press(getByText("Demander un accompagnement"));

    expect(getByText("Indiquez votre destination.")).toBeTruthy();
    expect(recordJourney).not.toHaveBeenCalled();
  });

  it("shows an error when the departure address cannot be resolved", async () => {
    geocodeAddress.mockResolvedValueOnce(null);

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.changeText(getByTestId("departure-input"), "Adresse inconnue");
    fireEvent.changeText(getByTestId("arrival-input"), "Arrivée");
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(getByText("Adresse de départ introuvable.")).toBeTruthy();
    });
    expect(recordJourney).not.toHaveBeenCalled();
  });

  it("shows an error when the arrival address cannot be resolved", async () => {
    geocodeAddress
      .mockResolvedValueOnce({ latitude: 1, longitude: 2 })
      .mockResolvedValueOnce(null);

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.changeText(getByTestId("departure-input"), "Départ");
    fireEvent.changeText(getByTestId("arrival-input"), "Adresse inconnue");
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(getByText("Adresse d'arrivée introuvable.")).toBeTruthy();
    });
  });

  it("asks the user to reconnect when the session is missing", async () => {
    geocodeAddress.mockResolvedValue({ latitude: 1, longitude: 2 });
    getSession.mockResolvedValue(null);

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.changeText(getByTestId("departure-input"), "Départ");
    fireEvent.changeText(getByTestId("arrival-input"), "Arrivée");
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(getByText("Votre session a expiré. Reconnectez-vous.")).toBeTruthy();
    });
    expect(recordJourney).not.toHaveBeenCalled();
  });

  it("shows an error when reading the position throws", async () => {
    getCurrentPosition.mockRejectedValue(new Error("gps off"));

    const { getByText } = render(<RecordJourneyScreen />);
    fireEvent.press(getByText("Utiliser ma position"));

    await waitFor(() => {
      expect(getByText("Impossible de récupérer votre position.")).toBeTruthy();
    });
  });

  it("goes back when tapping the back button", () => {
    const { getByLabelText } = render(<RecordJourneyScreen />);
    fireEvent.press(getByLabelText("Retour"));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("shows a generic error when resolving the address throws", async () => {
    geocodeAddress.mockRejectedValue(new Error("boom"));

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.changeText(getByTestId("departure-input"), "Départ");
    fireEvent.changeText(getByTestId("arrival-input"), "Arrivée");
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(getByText("Une erreur est survenue. Réessayez.")).toBeTruthy();
    });
  });

  it("uses the coordinates from picked suggestions without geocoding", async () => {
    jest.spyOn(Alert, "alert");
    getSession.mockResolvedValue({ token: "jwt" });
    recordJourney.mockResolvedValue({ success: true, journeyId: 1 });

    const { getByText, getByTestId } = render(<RecordJourneyScreen />);
    fireEvent.press(getByTestId("departure-input-pick"));
    fireEvent.press(getByTestId("arrival-input-pick"));
    fireEvent.press(getByText("Demander un accompagnement"));

    await waitFor(() => {
      expect(recordJourney).toHaveBeenCalled();
    });
    const payload = recordJourney.mock.calls[0][0];
    expect(payload.departureLat).toBe(10);
    expect(payload.arrivalLat).toBe(10);
    expect(geocodeAddress).not.toHaveBeenCalled();
  });
});
