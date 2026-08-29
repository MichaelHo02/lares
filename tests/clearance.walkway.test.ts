import { describe, expect, it } from "vitest";
import { checkLayout, findingsForPlacement } from "../lib/clearance/checkLayout";
import { STANDARDS } from "../lib/clearance/standards";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  bareRoom,
  codesOf,
  firstOf,
  place,
} from "./fixtures";

const BARE_ROOM = bareRoom();

describe("WALKWAY_TOO_NARROW", () => {
  it("errors on a sub-700mm gap between two facing primary items", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 2400),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WALKWAY_TOO_NARROW");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(500);
    expect(finding.requiredMm).toBe(STANDARDS.PRIMARY_WALKWAY_MM);
    expect(finding.placementIds).toEqual(["sofa", "wardrobe"]);
    expect(finding.region).toEqual({ x: 1000, y: 1900, width: 1500, depth: 500 });
  });

  it("warns on a gap between 700mm and the 900mm primary requirement", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 2700),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WALKWAY_TOO_NARROW");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(800);
  });

  it("ignores gaps too tight to be an attempted walkway", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 2000),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WALKWAY_TOO_NARROW");
  });

  it("exempts a coffee table pulled up to a sofa", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("coffee", TEST_PRODUCTS.coffeeTable.id, 1400, 2300),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WALKWAY_TOO_NARROW");
  });

  it("ignores pairs whose faces do not overlap", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 3500, 2500),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WALKWAY_TOO_NARROW");
  });

  it("measures a side-by-side gap on the x axis too", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 3300, 1000, 90),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WALKWAY_TOO_NARROW");
    expect(finding.measuredMm).toBe(300);
    expect(finding.region).toEqual({ x: 3000, y: 1000, width: 300, depth: 900 });
  });

  it("warns about dead space between a large item and the wall behind it", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("sofa", TEST_PRODUCTS.sofa.id, 1000, 300)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WALKWAY_TOO_NARROW");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(300);
    expect(finding.region).toEqual({ x: 1000, y: 0, width: 2000, depth: 300 });
  });

  it("ignores dead space behind an item too small to strand floor area", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("table", TEST_PRODUCTS.bedsideTable.id, 1000, 300)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WALKWAY_TOO_NARROW");
  });

  it("ignores rugs, which are walked over rather than around", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("rug", TEST_PRODUCTS.rug.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 2900),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findingsForPlacement(findings, "rug"))).not.toContain(
      "WALKWAY_TOO_NARROW",
    );
  });
});
