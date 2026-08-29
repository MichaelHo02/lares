import { describe, expect, it } from "vitest";
import { checkLayout, findingsForPlacement } from "../lib/clearance/checkLayout";
import type { Finding, FindingCode } from "../lib/clearance/findings";
import { FINDING_CODES, summariseFindings } from "../lib/clearance/findings";
import { STANDARDS } from "../lib/clearance/standards";
import { createRectangularRoom } from "../lib/domain/room";
import { TEST_CATALOG, TEST_PRODUCTS, makeRoom, place } from "./fixtures";

function codes(findings: readonly Finding[]): FindingCode[] {
  return findings.map((finding) => finding.code);
}

function firstOf(findings: readonly Finding[], code: FindingCode): Finding {
  const found = findings.find((finding) => finding.code === code);
  if (!found) throw new Error(`expected a ${code} finding, got ${codes(findings).join(", ")}`);
  return found;
}

const BARE_ROOM = createRectangularRoom({
  name: "Bare Room",
  widthMm: 6000,
  depthMm: 6000,
});

describe("OUTSIDE_ROOM", () => {
  it("reports the worst overhang when an item hangs past a wall", () => {
    const room = makeRoom(3000, 3000, []);
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 1500, 1000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "OUTSIDE_ROOM");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(500);
    expect(finding.requiredMm).toBe(0);
    expect(finding.placementIds).toEqual(["p1"]);
  });

  it("reports negative coordinates as an overhang too", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("p1", TEST_PRODUCTS.sofa.id, -300, 1000)],
      TEST_CATALOG,
    );
    expect(firstOf(findings, "OUTSIDE_ROOM").measuredMm).toBe(300);
  });

  it("accepts an item flush against the wall", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("OUTSIDE_ROOM");
  });

  it("accounts for rotation when testing bounds", () => {
    // A 2000 × 900 sofa cannot lie across a 1500mm-wide room, but it can along it.
    const room = makeRoom(1500, 3000, []);
    const upright = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0, 0)],
      TEST_CATALOG,
    );
    expect(codes(upright.findings)).toContain("OUTSIDE_ROOM");

    const turned = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0, 90)],
      TEST_CATALOG,
    );
    expect(codes(turned.findings)).not.toContain("OUTSIDE_ROOM");
  });
});

describe("OVERLAP", () => {
  it("flags two items sharing floor area and names both", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1200, 1100),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "OVERLAP");
    expect(finding.severity).toBe("error");
    expect(finding.placementIds).toEqual(["p1", "p2"]);
    expect(finding.measuredMm).toBe(300);
  });

  it("does not flag items that merely touch", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 0, 0),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1500, 0),
      ],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("OVERLAP");
  });

  it("lets furniture sit on top of a rug", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("rug", TEST_PRODUCTS.rug.id, 1000, 1000),
        place("sofa", TEST_PRODUCTS.sofa.id, 1200, 1200),
      ],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("OVERLAP");
  });
});

describe("OBSTRUCTION_CONFLICT", () => {
  it("flags furniture clashing with a fixed bulkhead", () => {
    const room = createRectangularRoom({
      name: "Bulkhead Room",
      widthMm: 6000,
      depthMm: 6000,
      obstructions: [
        {
          id: "bulk-1",
          label: "corner bulkhead",
          kind: "bulkhead",
          x: 5400,
          y: 0,
          widthMm: 600,
          depthMm: 600,
        },
      ],
    });
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.wardrobe.id, 4200, 0)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "OBSTRUCTION_CONFLICT");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(300);
    expect(finding.message).toContain("bulkhead");
  });
});

describe("WONT_FIT_THROUGH_DOOR", () => {
  it("rejects an item whose smallest cross-section exceeds the narrowest door", () => {
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.bulkySectional.id, 2000, 2000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WONT_FIT_THROUGH_DOOR");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(900);
    expect(finding.requiredMm).toBe(820 - STANDARDS.DOOR_FIT_TOLERANCE_MM);
  });

  it("accepts an item that can be tilted through, judged on its smallest dimension", () => {
    // 1100 × 600 × 400: too wide to carry upright, but 400mm on its side.
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.coffeeTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("WONT_FIT_THROUGH_DOOR");
  });

  it("uses the narrowest door when a room has several", () => {
    const room = makeRoom(6000, 6000, [
      {
        id: "wide",
        type: "door",
        wall: "north",
        offsetMm: 200,
        widthMm: 1200,
        heightMm: 2040,
        swing: { hingeSide: "start", direction: "outward" },
      },
      {
        id: "narrow",
        type: "door",
        wall: "south",
        offsetMm: 200,
        widthMm: 720,
        heightMm: 2040,
        swing: { hingeSide: "start", direction: "outward" },
      },
    ]);
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 2500, 2500)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WONT_FIT_THROUGH_DOOR");
    expect(finding.measuredMm).toBe(850);
    expect(finding.requiredMm).toBe(710);
  });

  it("skips the check entirely for a room with no doors", () => {
    const { findings } = checkLayout(
      makeRoom(6000, 6000, []),
      [place("p1", TEST_PRODUCTS.bulkySectional.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("WONT_FIT_THROUGH_DOOR");
  });
});

describe("DOOR_SWING_BLOCKED", () => {
  it("flags an item inside the swept arc", () => {
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.bookshelf.id, 500, 100)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "DOOR_SWING_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.requiredMm).toBe(820);
    expect(finding.placementIds).toEqual(["p1"]);
  });

  it("clears an item tucked into the far corner of the arc bounding box", () => {
    // 820mm hinged at x=400: the point (1200, 800) is 1131mm from the hinge, so
    // it lies inside the bounding square but outside the quarter disc.
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.bedsideTable.id, 1180, 780)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("DOOR_SWING_BLOCKED");
  });

  it("ignores an outward-swinging door", () => {
    const room = makeRoom(6000, 6000, [
      {
        id: "door-out",
        type: "door",
        wall: "north",
        offsetMm: 400,
        widthMm: 820,
        heightMm: 2040,
        swing: { hingeSide: "start", direction: "outward" },
      },
    ]);
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.bookshelf.id, 500, 100)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("DOOR_SWING_BLOCKED");
  });

  it("warns rather than errors when a fixed obstruction restricts the swing", () => {
    const room = createRectangularRoom({
      name: "Radiator Room",
      widthMm: 6000,
      depthMm: 6000,
      openings: [
        {
          id: "door-north",
          type: "door",
          wall: "north",
          offsetMm: 400,
          widthMm: 820,
          heightMm: 2040,
          swing: { hingeSide: "start", direction: "inward" },
        },
      ],
      obstructions: [
        {
          id: "rad-1",
          label: "hallway radiator",
          kind: "radiator",
          x: 600,
          y: 0,
          widthMm: 900,
          depthMm: 150,
        },
      ],
    });
    const { findings } = checkLayout(room, [], TEST_CATALOG);
    const finding = firstOf(findings, "DOOR_SWING_BLOCKED");
    expect(finding.severity).toBe("warning");
    expect(finding.placementIds).toEqual([]);
  });
});

describe("CHAIR_PULLOUT_INSUFFICIENT", () => {
  it("errors when furniture stands in the pull-out zone and names the blocker", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 2000, 3200),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.severity).toBe("error");
    expect(finding.requiredMm).toBe(STANDARDS.DINING_PULLOUT_MM);
    expect(finding.measuredMm).toBe(300);
    expect(finding.placementIds).toEqual(["table", "shelf"]);
  });

  it("only warns when a wall is what limits the side, since it is not a seating side", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("table", TEST_PRODUCTS.diningTable.id, 0, 2000)],
      TEST_CATALOG,
    );
    const pullouts = findings.filter(
      (finding) => finding.code === "CHAIR_PULLOUT_INSUFFICIENT",
    );
    expect(pullouts.length).toBeGreaterThan(0);
    for (const finding of pullouts) {
      expect(finding.severity).toBe("warning");
    }
  });

  it("lets dining chairs occupy the pull-out zone they exist for", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000),
        place("chair", TEST_PRODUCTS.diningChair.id, 2200, 2950),
      ],
      TEST_CATALOG,
    );
    const blamed = findingsForPlacement(findings, "chair").filter(
      (finding) => finding.code === "CHAIR_PULLOUT_INSUFFICIENT",
    );
    expect(blamed).toEqual([]);
  });

  it("passes cleanly with 900mm clear on every side", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("CHAIR_PULLOUT_INSUFFICIENT");
  });

  it("follows rotation, so a turned table is judged on its turned sides", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        // Rotated 90, the table's front faces west, so the west gap is the one judged.
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000, 90),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 900, 2000),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.measuredMm).toBe(300);
  });
});

describe("CLEARANCE_ZONE_BLOCKED", () => {
  it("errors when a wardrobe cannot open its doors against a wall", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      // Front faces north at rotation 180, leaving only 400mm to the north wall.
      [place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 400, 180)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(400);
    expect(finding.requiredMm).toBe(600);
  });

  it("passes a wardrobe with its back to the wall and its doors facing the room", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 0, 0)],
      TEST_CATALOG,
    );
    expect(findingsForPlacement(findings, "wardrobe")).toEqual([]);
  });

  it("errors when another item stands in front of a wardrobe", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 0, 0),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 1200, 900, 0),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(300);
    expect(finding.placementIds).toContain("shelf");
  });
});

describe("BED_SIDE_ACCESS_BLOCKED", () => {
  it("errors when a queen bed has no clear side at all", () => {
    const room = createRectangularRoom({
      name: "Tight Bedroom",
      widthMm: 2400,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [
        place("bed", TEST_PRODUCTS.queenBed.id, 400, 500),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 2050, 500, 90),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.requiredMm).toBe(STANDARDS.BED_SIDE_ACCESS_MM);
  });

  it("warns when a queen bed is pushed against one wall", () => {
    const room = createRectangularRoom({
      name: "Bedroom",
      widthMm: 3000,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.queenBed.id, 0, 500)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(0);
  });

  it("accepts a single bed against a wall, which only needs one side", () => {
    const room = createRectangularRoom({
      name: "Kids Room",
      widthMm: 3000,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.singleBed.id, 0, 500)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("BED_SIDE_ACCESS_BLOCKED");
  });

  it("lets a bedside table sit in the access zone", () => {
    const room = createRectangularRoom({
      name: "Bedroom",
      widthMm: 4000,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [
        place("bed", TEST_PRODUCTS.queenBed.id, 1000, 500),
        place("table", TEST_PRODUCTS.bedsideTable.id, 500, 500),
      ],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("BED_SIDE_ACCESS_BLOCKED");
  });

  it("passes a queen bed with both sides clear", () => {
    const room = createRectangularRoom({
      name: "Bedroom",
      widthMm: 4000,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.queenBed.id, 1100, 500)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("BED_SIDE_ACCESS_BLOCKED");
  });
});

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
    expect(codes(findings)).not.toContain("WALKWAY_TOO_NARROW");
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
    expect(codes(findings)).not.toContain("WALKWAY_TOO_NARROW");
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
    expect(codes(findings)).not.toContain("WALKWAY_TOO_NARROW");
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
    const blamed = findingsForPlacement(findings, "rug");
    expect(codes(blamed)).not.toContain("WALKWAY_TOO_NARROW");
  });
});

describe("UNKNOWN_PRODUCT", () => {
  it("reports a placement referring to a product that is not catalogued", () => {
    const { findings, summary } = checkLayout(
      BARE_ROOM,
      [place("p1", "no-such-product", 100, 100)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "UNKNOWN_PRODUCT");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBeNull();
    expect(finding.requiredMm).toBeNull();
    expect(summary.passes).toBe(false);
  });
});

describe("checkLayout contract", () => {
  it("passes an empty room", () => {
    const { findings, summary } = checkLayout(makeRoom(), [], TEST_CATALOG);
    expect(findings).toEqual([]);
    expect(summary).toEqual({
      total: 0,
      errors: 0,
      warnings: 0,
      byCode: {},
      passes: true,
    });
  });

  it("emits errors before warnings", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1200, 1100),
        place("p3", TEST_PRODUCTS.sofa.id, 3000, 300),
      ],
      TEST_CATALOG,
    );
    const severities = findings.map((finding) => finding.severity);
    expect(severities).toContain("error");
    expect(severities).toContain("warning");
    expect(severities.lastIndexOf("error")).toBeLessThan(severities.indexOf("warning"));
  });

  it("gives every finding a code from the published list and a non-empty message", () => {
    const { findings } = checkLayout(
      makeRoom(3000, 3000),
      [
        place("p1", TEST_PRODUCTS.bulkySectional.id, 200, 200),
        place("p2", TEST_PRODUCTS.diningTable.id, 400, 2200),
        place("p3", "missing", 0, 0),
      ],
      TEST_CATALOG,
    );
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      expect(FINDING_CODES).toContain(finding.code);
      expect(finding.message.length).toBeGreaterThan(10);
      expect(Array.isArray(finding.placementIds)).toBe(true);
    }
  });

  it("summarises counts by code and severity", () => {
    const summary = summariseFindings([
      {
        code: "OVERLAP",
        severity: "error",
        placementIds: ["a", "b"],
        measuredMm: 10,
        requiredMm: 0,
        message: "x",
      },
      {
        code: "OVERLAP",
        severity: "error",
        placementIds: ["a", "c"],
        measuredMm: 10,
        requiredMm: 0,
        message: "y",
      },
      {
        code: "WALKWAY_TOO_NARROW",
        severity: "warning",
        placementIds: ["a"],
        measuredMm: 800,
        requiredMm: 900,
        message: "z",
      },
    ]);
    expect(summary).toEqual({
      total: 3,
      errors: 2,
      warnings: 1,
      byCode: { OVERLAP: 2, WALKWAY_TOO_NARROW: 1 },
      passes: false,
    });
  });

  it("filters findings down to a single placement", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1200, 1100),
      ],
      TEST_CATALOG,
    );
    const forP2 = findingsForPlacement(findings, "p2");
    expect(forP2.length).toBeGreaterThan(0);
    for (const finding of forP2) {
      expect(finding.placementIds).toContain("p2");
    }
    expect(findingsForPlacement(findings, "nope")).toEqual([]);
  });
});
