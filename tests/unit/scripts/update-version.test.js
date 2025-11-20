import fs from "fs";

import { _updateVersion, runUpdateFromPackage, updateFile } from "../../../scripts/update-version.js";

jest.mock("fs");

describe("Unit | Scripts | Update version", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("recursively updates all 'version' keys", () => {
    const input = {
      version: "1.0.0",
      nested: { version: "1.0.0", deep: { value: 42, version: "1.0.0" } },
    };

    const output = _updateVersion(input, "version", "2.0.0");

    expect(output.version).toBe("2.0.0");
    expect(output.nested.version).toBe("2.0.0");
    expect(output.nested.deep.version).toBe("2.0.0");
  });

  test("updates the file with the new version", () => {
    // given
    fs.readFileSync.mockImplementation(() => {
      return JSON.stringify({ version: "0.0.0", expo: { version: "0.0.0" } });
    });
    const updateVersion = "1.0.0";

    fs.writeFileSync.mockImplementation(() => {});

    // when
    updateFile("./app.json", "version", updateVersion);

    // then
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const writtenJson = JSON.parse(fs.writeFileSync.mock.calls[0][1]);

    expect(writtenJson.version).toBe(updateVersion);
    expect(writtenJson.expo.version).toBe(updateVersion);
  });

  test("does not update 'version' keys inside arrays", () => {
    const input = {
      version: "1.0.0",
      list: [{ version: "1.0.0" }, { version: "1.0.0" }],
      nested: { version: "1.0.0" },
    };

    const output = _updateVersion(input, "version", "2.0.0");

    expect(output.version).toBe("2.0.0");
    expect(output.nested.version).toBe("2.0.0");
    expect(output.list[0].version).toBe("1.0.0");
    expect(output.list[1].version).toBe("1.0.0");
  });

  test("ignores missing keys and does not create new keys", () => {
    const input = { name: "kompagnon", nested: null };
    const before = JSON.parse(JSON.stringify(input));

    const output = _updateVersion(input, "version", "9.9.9");

    expect(output).toEqual(before);
    expect(output.nested).toBeNull();
  });

  test("_updateVersion mutates the original object (in-place)", () => {
    const input = { version: "0.1.0" };

    const output = _updateVersion(input, "version", "0.2.0");

    expect(output).toBe(input);
    expect(input.version).toBe("0.2.0");
  });

  test("when executed it updates ./app.json and ./config.json and logs progress", () => {
    // prepare package.json, app.json, config.json responses
    const pkg = { version: "7.7.7" };
    const app = { version: "0.0.0", expo: { version: "0.0.0" } };
    const config = { nested: { version: "0.0.0" }, list: [{ version: "0.0.0" }] };

    fs.readFileSync.mockImplementation((p) => {
      if (p === "./package.json") return JSON.stringify(pkg);
      if (p === "./app.json") return JSON.stringify(app);
      if (p === "./config.json") return JSON.stringify(config);
      return JSON.stringify({});
    });
    fs.writeFileSync.mockImplementation(jest.fn());

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // when
    runUpdateFromPackage();

    // then
    expect(logSpy).toHaveBeenCalledWith("Updating ./app.json");
    expect(logSpy).toHaveBeenCalledWith("Updating ./config.json");
    expect(logSpy).toHaveBeenCalledWith("Version update complete.");

    expect(fs.writeFileSync).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  test("top-level isMain branch runs on import when argv matches (require path)", () => {
    // Simulate a fresh module load where process.argv[1] points to the script
    jest.resetModules();
    const pkg = { version: "9.9.9" };
    const app = { version: "0.0.0", expo: { version: "0.0.0" } };
    const config = { nested: { version: "0.0.0" }, list: [{ version: "0.0.0" }] };

    // mock fs for this isolated load
    jest.doMock("fs", () => ({
      readFileSync: (p) => {
        if (p === "./package.json") return JSON.stringify(pkg);
        if (p === "./app.json") return JSON.stringify(app);
        if (p === "./config.json") return JSON.stringify(config);
        return JSON.stringify({});
      },
      writeFileSync: jest.fn(),
    }));

    const originalArgv1 = process.argv[1];
    process.argv[1] = "/some/path/update-version.js";

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // require the module fresh; the top-level isMain branch should run
    require("../../../scripts/update-version.js");

    expect(logSpy).toHaveBeenCalledWith("Updating ./app.json");
    expect(logSpy).toHaveBeenCalledWith("Updating ./config.json");
    expect(logSpy).toHaveBeenCalledWith("Version update complete.");

    logSpy.mockRestore();
    process.argv[1] = originalArgv1;
  });
});
