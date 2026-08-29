import { describe, expect, it } from "vitest";
import {
  isCompanionPair,
  mayOccupyClearanceZone,
  requiredWalkwayFor,
  STANDARDS,
} from "../lib/clearance/standards";
import {
  FINDING_CODES,
  FINDING_CODE_TITLES,
  isErrorFinding,
  sortFindings,
  type Finding,
  type FindingCode,
} from "../lib/clearance/findings";
import { CLEARANCE_REASONS, PRODUCT_CATEGORIES } from "../lib/domain/product";

function finding(code: FindingCode, severity: "error" | "warning"): Finding {
  return {
    code,
    severity,
    placementIds: [],
    measuredMm: null,
    requiredMm: null,
    message: `${code} ${severity}`,
  };
}

describe("walkway requirements", () => {
  it("holds any pair involving a large item to the primary width", () => {
    expect(requiredWalkwayFor("sofa", "bookshelf")).toBe(STANDARDS.PRIMARY_WALKWAY_MM);
    expect(requiredWalkwayFor("bookshelf", "bed")).toBe(STANDARDS.PRIMARY_WALKWAY_MM);
  });

  it("holds a pair of minor items to the secondary width", () => {
    expect(requiredWalkwayFor("bedside_table", "floor_lamp")).toBe(
      STANDARDS.SECONDARY_WALKWAY_MM,
    );
  });

  it("treats a wall like a minor neighbour, so the item's own category decides", () => {
    expect(requiredWalkwayFor("bed", "wall")).toBe(STANDARDS.PRIMARY_WALKWAY_MM);
    expect(requiredWalkwayFor("bedside_table", "wall")).toBe(
      STANDARDS.SECONDARY_WALKWAY_MM,
    );
  });

  it("is symmetric for every pair of categories", () => {
    for (const a of PRODUCT_CATEGORIES) {
      for (const b of PRODUCT_CATEGORIES) {
        expect(requiredWalkwayFor(a, b)).toBe(requiredWalkwayFor(b, a));
      }
    }
  });
});

describe("companion pairs", () => {
  it("exempts furniture designed to sit together, in either order", () => {
    expect(isCompanionPair("sofa", "coffee_table")).toBe(true);
    expect(isCompanionPair("coffee_table", "sofa")).toBe(true);
    expect(isCompanionPair("bed", "bedside_table")).toBe(true);
    expect(isCompanionPair("dining_chair", "dining_chair")).toBe(true);
  });

  it("does not exempt furniture that should have a walkway between it", () => {
    expect(isCompanionPair("sofa", "wardrobe")).toBe(false);
    expect(isCompanionPair("bed", "desk")).toBe(false);
  });

  it("is symmetric for every pair of categories", () => {
    for (const a of PRODUCT_CATEGORIES) {
      for (const b of PRODUCT_CATEGORIES) {
        expect(isCompanionPair(a, b)).toBe(isCompanionPair(b, a));
      }
    }
  });
});

describe("clearance zone occupants", () => {
  it("lets a dining chair stand in the pull-out zone it exists for", () => {
    expect(mayOccupyClearanceZone("chair_pullout", "dining_chair")).toBe(true);
    expect(mayOccupyClearanceZone("chair_pullout", "wardrobe")).toBe(false);
  });

  it("lets a rug lie in every kind of clearance zone", () => {
    for (const reason of CLEARANCE_REASONS) {
      expect(mayOccupyClearanceZone(reason, "rug")).toBe(true);
    }
  });

  it("keeps every other category out of a door swing zone", () => {
    for (const category of PRODUCT_CATEGORIES) {
      if (category === "rug") continue;
      expect(mayOccupyClearanceZone("door_swing", category)).toBe(false);
    }
  });
});

describe("finding presentation", () => {
  it("titles every published finding code", () => {
    for (const code of FINDING_CODES) {
      expect(FINDING_CODE_TITLES[code].length).toBeGreaterThan(0);
    }
    expect(Object.keys(FINDING_CODE_TITLES)).toHaveLength(FINDING_CODES.length);
  });

  it("sorts errors before warnings and codes alphabetically within a severity", () => {
    const sorted = sortFindings([
      finding("WALKWAY_TOO_NARROW", "warning"),
      finding("OVERLAP", "error"),
      finding("BED_SIDE_ACCESS_BLOCKED", "warning"),
      finding("DOOR_SWING_BLOCKED", "error"),
    ]);
    expect(sorted.map((entry) => entry.code)).toEqual([
      "DOOR_SWING_BLOCKED",
      "OVERLAP",
      "BED_SIDE_ACCESS_BLOCKED",
      "WALKWAY_TOO_NARROW",
    ]);
  });

  it("does not mutate the array it is given", () => {
    const input = [finding("WALKWAY_TOO_NARROW", "warning"), finding("OVERLAP", "error")];
    sortFindings(input);
    expect(input.map((entry) => entry.code)).toEqual(["WALKWAY_TOO_NARROW", "OVERLAP"]);
  });

  it("identifies error findings", () => {
    expect(isErrorFinding(finding("OVERLAP", "error"))).toBe(true);
    expect(isErrorFinding(finding("OVERLAP", "warning"))).toBe(false);
  });
});
