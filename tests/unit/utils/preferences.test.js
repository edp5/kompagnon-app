import { setSpeaksAloud, speaksAloud } from "../../../utils/preferences";
import { getItem, setItem } from "../../../utils/storage";

jest.mock("../../../utils/storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("Unit | Utils | preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("speaks on a fresh install", async () => {
    // The announcements exist for someone who cannot watch the screen: a
    // setting they never find would be worth nothing to them.
    getItem.mockResolvedValue(null);

    expect(await speaksAloud()).toBe(true);
  });

  it("keeps quiet once the user has asked for silence", async () => {
    getItem.mockResolvedValue("false");

    expect(await speaksAloud()).toBe(false);
  });

  it("speaks again once the user turns it back on", async () => {
    getItem.mockResolvedValue("true");

    expect(await speaksAloud()).toBe(true);
  });

  it("records the choice", async () => {
    await setSpeaksAloud(false);
    expect(setItem).toHaveBeenCalledWith("spoken_announcements", "false");

    await setSpeaksAloud(true);
    expect(setItem).toHaveBeenCalledWith("spoken_announcements", "true");
  });

  it("keeps speaking rather than falling silent when storage fails", async () => {
    getItem.mockRejectedValue(new Error("storage"));
    setItem.mockRejectedValue(new Error("storage"));

    expect(await speaksAloud()).toBe(true);
    await expect(setSpeaksAloud(false)).resolves.toBeUndefined();
  });
});
