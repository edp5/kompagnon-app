/**
 * Global Jest setup (setupFilesAfterEnv).
 *
 * Mocks Expo modules that touch native code at import time. They are only used
 * for presentation (icons, brand fonts) and are not under test, so stubbing them
 * keeps unit/integration tests focused and avoids the jest-expo native-bridge
 * invariant ("__fbBatchedBridgeConfig is not set").
 */

// Icon set → render a lightweight stub for any icon family/name.
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const IconStub = (props) => React.createElement(Text, props, null);
  IconStub.displayName = "IconStub";
  return new Proxy(
    {},
    {
      get: () => IconStub,
    },
  );
});

// expo-secure-store → in-memory store (no native keychain).
jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    setItemAsync: jest.fn(async (key, value) => { store.set(key, value); }),
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    deleteItemAsync: jest.fn(async (key) => { store.delete(key); }),
  };
});

// expo-location → no-op defaults (individual tests override the return values).
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 0, longitude: 0 } })),
  reverseGeocodeAsync: jest.fn(async () => []),
  geocodeAsync: jest.fn(async () => []),
}));

// expo-font → behave as if fonts are already loaded.
jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: () => true,
  isLoading: () => false,
}));

// react-native-safe-area-context → render children immediately (no async frame
// measurement, which never resolves under jest and would hide the tree).
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(inset);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets: inset, frame },
  };
});
