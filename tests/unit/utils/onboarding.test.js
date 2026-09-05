import { hasSeenOnboarding, markOnboardingSeen, resetOnboarding } from "../../../utils/onboarding";
import { getItem, removeItem, setItem } from "../../../utils/storage";

jest.mock("../../../utils/storage", () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("Unit | Utils | onboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is unseen on a fresh install", async () => {
    getItem.mockResolvedValue(null);

    expect(await hasSeenOnboarding()).toBe(false);
  });

  it("is seen once it has been marked", async () => {
    getItem.mockResolvedValue("true");

    expect(await hasSeenOnboarding()).toBe(true);
  });

  it("marks it as seen", async () => {
    await markOnboardingSeen();

    expect(setItem).toHaveBeenCalledWith("onboarding_seen", "true");
  });

  it("forgets it so the introduction can be watched again", async () => {
    await resetOnboarding();

    expect(removeItem).toHaveBeenCalledWith("onboarding_seen");
  });

  it("does not block the app when storage fails", async () => {
    getItem.mockRejectedValue(new Error("storage"));
    setItem.mockRejectedValue(new Error("storage"));
    removeItem.mockRejectedValue(new Error("storage"));

    expect(await hasSeenOnboarding()).toBe(true);
    await expect(markOnboardingSeen()).resolves.toBeUndefined();
    await expect(resetOnboarding()).resolves.toBeUndefined();
  });
});
