import fs from "fs";
import { basename } from "path";

function _updateVersion(obj, found_key, value) {
  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      obj[key] = _updateVersion(obj[key], found_key, value);
    } else if (key === found_key) {
      obj[key] = value;
    }
  }
  return obj;
}

function updateFile(path, update_key, update_value) {
  let data = JSON.parse(fs.readFileSync(path, "utf8"));
  data = _updateVersion(data, update_key, update_value);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

export { _updateVersion, updateFile };

// Avoid using `import.meta` which the Jest/Babel setup (hermes preset)
// cannot parse. Instead detect direct execution by checking
// if `process.argv[1]` ends with the script filename.
const scriptFileName = basename(process.argv[1] || "");
const isMain = scriptFileName === basename("update-version.js");

if (isMain) {
  runUpdateFromPackage();
}

function runUpdateFromPackage() {
  const FILE_TO_UPDATE = ["./app.json", "./config.json"];
  const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
  const version = pkg.version;
  for (const filePath of FILE_TO_UPDATE) {
    console.log(`Updating ${filePath}`);
    updateFile(filePath, "version", version);
  }
  console.log("Version update complete.");
}

export { runUpdateFromPackage };
