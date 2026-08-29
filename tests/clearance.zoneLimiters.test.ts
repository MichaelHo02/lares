import { describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import { createRectangularRoom } from "../lib/domain/room";
import { TEST_CATALOG, TEST_PRODUCTS, bareRoom, codesOf, firstOf, place } from "./fixtures";

const BARE_ROOM = bareRoom();

describe("seating approach clearance", () => {
  it("warns when a sofa has no room to step up to it", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 2100),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(200);
    expect(finding.requiredMm).toBe(400);
    expect(finding.placementIds).toEqual(["sofa", "wardrobe"]);
  });

  it("lets a coffee table stand in the approach zone it belongs in", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("coffee", TEST_PRODUCTS.coffeeTable.id, 1000, 2100),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("CLEARANCE_ZONE_BLOCKED");
  });
});

describe("fixed obstructions limiting a clearance zone", () => {
  function roomWithColumnAt(x: number, y: number) {
    return createRectangularRoom({
      name: "Column Room",
      widthMm: 6000,
      depthMm: 6000,
      obstructions: [
        { id: "col", label: "steel column", kind: "column", x, y, widthMm: 300, depthMm: 300 },
      ],
    });
  }

  it("names the obstruction as the cause and blames no other placement", () => {
    const { findings } = checkLayout(
      roomWithColumnAt(1200, 1100),
      [place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 0)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.measuredMm).toBe(500);
    expect(finding.message).toContain("steel column");
    expect(finding.placementIds).toEqual(["wardrobe"]);
  });

  it("measures the pull-out zone west of a table against a column", () => {
    const { findings } = checkLayout(
      roomWithColumnAt(1600, 2200),
      [place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.measuredMm).toBe(100);
    expect(finding.severity).toBe("error");
    expect(finding.message).toContain("west");
  });

  it("measures the pull-out zone east of a table against a column", () => {
    const { findings } = checkLayout(
      roomWithColumnAt(3800, 2200),
      [place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.measuredMm).toBe(200);
    expect(finding.message).toContain("east");
  });

  it("measures the zone north of a table against a column", () => {
    const { findings } = checkLayout(
      roomWithColumnAt(2200, 1600),
      [place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.measuredMm).toBe(100);
    expect(finding.message).toContain("north");
  });
});
