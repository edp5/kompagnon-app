jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    __store: store,
    setItemAsync: jest.fn(async (key, value) => { store.set(key, value); }),
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    deleteItemAsync: jest.fn(async (key) => { store.delete(key); }),
  };
});

import * as SecureStore from "expo-secure-store";

import { clearSession, getSession, saveSession } from "../../../utils/session.js";

describe("Unit | Utils | session", () => {
  beforeEach(() => {
    SecureStore.__store.clear();
    jest.clearAllMocks();
  });

  it("returns null when no session is stored", async () => {
    expect(await getSession()).toBeNull();
  });

  it("saves then reads back the token and user id", async () => {
    await saveSession({ token: "jwt-123", userId: 42 });

    expect(await getSession()).toEqual({ token: "jwt-123", userId: 42 });
  });

  it("stores the user id as null when it is not provided", async () => {
    await saveSession({ token: "jwt-123" });

    expect(await getSession()).toEqual({ token: "jwt-123", userId: null });
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it("clears the stored session", async () => {
    await saveSession({ token: "jwt-123", userId: 42 });

    await clearSession();

    expect(await getSession()).toBeNull();
  });

  describe("web fallback", () => {
    it("uses localStorage on web", async () => {
      const store = {};
      global.localStorage = {
        setItem: (key, value) => { store[key] = value; },
        getItem: (key) => (key in store ? store[key] : null),
        removeItem: (key) => { delete store[key]; },
      };

      let session;
      jest.isolateModules(() => {
        jest.doMock("react-native", () => ({ Platform: { OS: "web" } }));
        session = require("../../../utils/session.js");
      });

      await session.saveSession({ token: "web-token", userId: 5 });
      expect(store.auth_token).toBe("web-token");
      expect(await session.getSession()).toEqual({ token: "web-token", userId: 5 });

      await session.clearSession();
      expect(await session.getSession()).toBeNull();

      delete global.localStorage;
    });
  });
});
