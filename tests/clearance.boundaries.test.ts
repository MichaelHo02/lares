import { describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import type { Finding, FindingCode } from "../lib/clearance/findings";
import { STANDARDS } from "../lib/clearance/standards";
import { createRectangularRoom } from "../lib/domain/room";
import { TEST_CATALOG, TEST_PRODUCTS, bareRoom, findingsOf as of, place } from "./fixtures";

/**
 * Every threshold in the engine is inclusive of the standard: a gap exactly
 * equal to the requirement passes, one millimetre less fails. These tests pin
 * that down on both sides of every boundary.
 */

function pairOf(findings: readonly Finding[], code: FindingCode): Finding[] {
  return of(findings, code).filter((finding) => finding.placementIds.length === 2);
}

describe("OUTSIDE_ROOM boundary", () => {
  it("accepts an item that exactly fills the room", () => {
    const room = bareRoom(2000, 900);
    const { findings, summary } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0)],
      TEST_CATALOG,
    );
    expect(of(findings, "OUTSIDE_ROOM")).toEqual([]);
    expect(summary.passes).toBe(true);
  });

  it("rejects a one millimetre overhang", () => {
    const { findings } = checkLayout(
      bareRoom(2000, 900),
      [place("p1", TEST_PRODUCTS.sofa.id, 1, 0)],
      TEST_CATALOG,
    );
    expect(of(findings, "OUTSIDE_ROOM")[0].measuredMm).toBe(1);
  });
});

describe("OVERLAP boundary", () => {
  it("reports a one millimetre encroachment", () => {
    const { findings } = checkLayout(
      bareRoom(),
      [
        place("a", TEST_PRODUCTS.bookshelf.id, 0, 1000),
        place("b", TEST_PRODUCTS.bookshelf.id, 799, 1000),
      ],
      TEST_CATALOG,
    );
    expect(of(findings, "OVERLAP")[0].measuredMm).toBe(1);
  });

  it("reports identical placements as a full-footprint overlap", () => {
    const { findings } = checkLayout(
      bareRoom(),
      [
        place("a", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("b", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
      ],
      TEST_CATALOG,
    );
    const overlap = of(findings, "OVERLAP");
    expect(overlap).toHaveLength(1);
    expect(overlap[0].measuredMm).toBe(600);
    expect(overlap[0].region).toEqual({ x: 1000, y: 1000, width: 1500, depth: 600 });
  });
});

describe("WALKWAY_TOO_NARROW boundaries", () => {
  const sofaBottomMm = 1900;

  function gapBetweenPrimaryItems(gapMm: number): readonly Finding[] {
    return checkLayout(
      bareRoom(),
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 1000),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, sofaBottomMm + gapMm),
      ],
      TEST_CATALOG,
    ).findings;
  }

  it("accepts a gap exactly equal to the 900mm primary walkway", () => {
    expect(pairOf(gapBetweenPrimaryItems(STANDARDS.PRIMARY_WALKWAY_MM), "WALKWAY_TOO_NARROW"))
      .toEqual([]);
  });

  it("warns one millimetre below the primary walkway", () => {
    const [finding] = pairOf(gapBetweenPrimaryItems(899), "WALKWAY_TOO_NARROW");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(899);
    expect(finding.requiredMm).toBe(900);
  });

  it("still only warns at exactly the 700mm secondary width", () => {
    const [finding] = pairOf(gapBetweenPrimaryItems(700), "WALKWAY_TOO_NARROW");
    expect(finding.severity).toBe("warning");
  });

  it("escalates to an error one millimetre below 700mm", () => {
    const [finding] = pairOf(gapBetweenPrimaryItems(699), "WALKWAY_TOO_NARROW");
    expect(finding.severity).toBe("error");
  });

  it("starts caring at exactly the 150mm intent threshold", () => {
    const [finding] = pairOf(
      gapBetweenPrimaryItems(STANDARDS.WALKWAY_INTENT_THRESHOLD_MM),
      "WALKWAY_TOO_NARROW",
    );
    expect(finding.measuredMm).toBe(150);
  });

  it("ignores a gap one millimetre below the intent threshold", () => {
    expect(pairOf(gapBetweenPrimaryItems(149), "WALKWAY_TOO_NARROW")).toEqual([]);
  });

  it("holds two minor items to the 700mm secondary width only", () => {
    function gapBetweenBedsideTables(gapMm: number): readonly Finding[] {
      return checkLayout(
        bareRoom(),
        [
          place("a", TEST_PRODUCTS.bedsideTable.id, 1000, 1000),
          place("b", TEST_PRODUCTS.bedsideTable.id, 1000, 1400 + gapMm),
        ],
        TEST_CATALOG,
      ).findings;
    }
    expect(pairOf(gapBetweenBedsideTables(700), "WALKWAY_TOO_NARROW")).toEqual([]);
    const [finding] = pairOf(gapBetweenBedsideTables(699), "WALKWAY_TOO_NARROW");
    expect(finding.requiredMm).toBe(STANDARDS.SECONDARY_WALKWAY_MM);
  });

  it("accepts dead space against a wall at exactly the required width", () => {
    const { findings } = checkLayout(
      bareRoom(),
      [place("sofa", TEST_PRODUCTS.sofa.id, 1000, 900)],
      TEST_CATALOG,
    );
    expect(of(findings, "WALKWAY_TOO_NARROW")).toEqual([]);
  });

  it("warns about dead space one millimetre below the required width", () => {
    const { findings } = checkLayout(
      bareRoom(),
      [place("sofa", TEST_PRODUCTS.sofa.id, 1000, 899)],
      TEST_CATALOG,
    );
    const [finding] = of(findings, "WALKWAY_TOO_NARROW");
    expect(finding.measuredMm).toBe(899);
    expect(finding.placementIds).toEqual(["sofa"]);
  });
});

describe("CHAIR_PULLOUT_INSUFFICIENT boundary", () => {
  function blockerAtGap(gapMm: number): readonly Finding[] {
    return checkLayout(
      bareRoom(),
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 2000, 2900 + gapMm),
      ],
      TEST_CATALOG,
    ).findings;
  }

  it("accepts a blocker exactly 900mm from the table", () => {
    expect(of(blockerAtGap(STANDARDS.DINING_PULLOUT_MM), "CHAIR_PULLOUT_INSUFFICIENT"))
      .toEqual([]);
  });

  it("errors one millimetre short and blames the blocker", () => {
    const [finding] = of(blockerAtGap(899), "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(899);
    expect(finding.placementIds).toEqual(["table", "shelf"]);
  });
});

describe("CLEARANCE_ZONE_BLOCKED boundary", () => {
  function shelfInFrontOfWardrobe(gapMm: number): readonly Finding[] {
    return checkLayout(
      bareRoom(),
      [
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 0),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 1000, 600 + gapMm),
      ],
      TEST_CATALOG,
    ).findings;
  }

  it("accepts exactly the 600mm the wardrobe doors need", () => {
    expect(of(shelfInFrontOfWardrobe(600), "CLEARANCE_ZONE_BLOCKED")).toEqual([]);
  });

  it("errors at 599mm", () => {
    const [finding] = of(shelfInFrontOfWardrobe(599), "CLEARANCE_ZONE_BLOCKED");
    expect(finding.measuredMm).toBe(599);
    expect(finding.requiredMm).toBe(600);
  });
});

describe("BED_SIDE_ACCESS_BLOCKED boundary", () => {
  function bedInRoom(widthMm: number, bedXMm: number): readonly Finding[] {
    return checkLayout(
      createRectangularRoom({ name: "Bedroom", widthMm, depthMm: 4000 }),
      [place("bed", TEST_PRODUCTS.queenBed.id, bedXMm, 500)],
      TEST_CATALOG,
    ).findings;
  }

  it("accepts exactly 600mm on both sides", () => {
    expect(of(bedInRoom(2850, 600), "BED_SIDE_ACCESS_BLOCKED")).toEqual([]);
  });

  it("warns when one side falls a millimetre short", () => {
    const [finding] = of(bedInRoom(2849, 600), "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(599);
    expect(finding.requiredMm).toBe(STANDARDS.BED_SIDE_ACCESS_MM);
  });

  it("errors when neither side reaches the standard", () => {
    const [finding] = of(bedInRoom(2650, 500), "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(500);
  });
});
