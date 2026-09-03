import { USER_DISABILITIES, USER_GENRE, USER_ROLES } from "../../constants";

// Values stored by the API, from api/src/shared/constants.js in edp5/kompagnon.
// GET /api/users/profile returns them as-is, so a label map keyed on anything
// else silently renders nothing. That is the defect this suite guards against.
const API_ROLES = ["companion", "passenger"];
const API_GENRES = ["M", "F"];
const API_DISABILITIES = ["blind", "visually", "wheelchair", "mental"];

describe("Unit | Constants", () => {
  it("labels every role the API can return", () => {
    API_ROLES.forEach((role) => {
      expect(USER_ROLES[role]).toEqual(expect.any(String));
    });
  });

  it("labels every genre the API can return", () => {
    API_GENRES.forEach((genre) => {
      expect(USER_GENRE[genre]).toEqual(expect.any(String));
    });
  });

  it("labels every disability the API can return", () => {
    API_DISABILITIES.forEach((disability) => {
      expect(USER_DISABILITIES[disability]).toEqual(expect.any(String));
    });
  });

  it("declares no label the API never sends", () => {
    expect(Object.keys(USER_ROLES).sort()).toEqual([...API_ROLES].sort());
    expect(Object.keys(USER_GENRE).sort()).toEqual([...API_GENRES].sort());
    expect(Object.keys(USER_DISABILITIES).sort()).toEqual([...API_DISABILITIES].sort());
  });
});
