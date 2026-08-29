import { describe, expect, it } from "vitest";
import { checkLayout, findingsForPlacement } from "../lib/clearance/checkLayout";
import type { Finding, FindingCode } from "../lib/clearance/findings";
import { createRectangularRoom } from "../lib/domain/room";
import { footprintFor, ROTATIONS } from "../lib/geometry/rotation";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  aDoor,
  bareRoom,
  place,
} from "./fixtures";

function codes(findings: readonly Finding[]): FindingCode[] {
  return findings.map((finding) => finding.code);
}

describe("layouts that must produce no findings at all", () => {
  it("passes a generous living room with a sofa, rug and coffee table", () => {
    const room = createRectangularRoom({
      name: "Living Room",
      widthMm: 6000,
      depthMm: 5000,
      openings: [aDoor({ id: "door", offsetMm: 4600, widthMm: 900 })],
    });
    const { findings, summary } = checkLayout(
      room,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 1000, 0),
        place("rug", TEST_PRODUCTS.rug.id, 1000, 900),
        place("coffee", TEST_PRODUCTS.coffeeTable.id, 1400, 1300),
      ],
      TEST_CATALOG,
    );
    expect(findings).toEqual([]);
    expect(summary.passes).toBe(true);
  });

  it("passes a bedroom with a queen bed reachable from both sides", () => {
    const room = createRectangularRoom({
      name: "Bedroom",
      widthMm: 4000,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [
        place("bed", TEST_PRODUCTS.queenBed.id, 1175, 0),
        place("left", TEST_PRODUCTS.bedsideTable.id, 700, 0),
        place("right", TEST_PRODUCTS.bedsideTable.id, 2850, 0),
      ],
      TEST_CATALOG,
    );
    expect(findings).toEqual([]);
  });

  it("passes a dining table with chairs tucked into its pull-out zones", () => {
    const { findings } = checkLayout(
      bareRoom(6000, 6000),
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2200, 2550),
        place("chair-n", TEST_PRODUCTS.diningChair.id, 2500, 1900, 180),
        place("chair-s", TEST_PRODUCTS.diningChair.id, 2500, 3450),
        place("chair-w", TEST_PRODUCTS.diningChair.id, 1600, 2800, 90),
        place("chair-e", TEST_PRODUCTS.diningChair.id, 3860, 2800, 270),
      ],
      TEST_CATALOG,
    );
    expect(findings).toEqual([]);
  });

  it("passes a wardrobe turned to face into the room from the east wall", () => {
    const { findings } = checkLayout(
      bareRoom(4000, 4000),
      [place("wardrobe", TEST_PRODUCTS.wardrobe.id, 3400, 1000, 90)],
      TEST_CATALOG,
    );
    expect(findings).toEqual([]);
  });

  it("passes an empty room with a door and a window", () => {
    const { findings, summary } = checkLayout(
      createRectangularRoom({
        name: "Empty",
        widthMm: 3000,
        depthMm: 3000,
        openings: [aDoor({ id: "door", offsetMm: 1000 })],
      }),
      [],
      TEST_CATALOG,
    );
    expect(findings).toEqual([]);
    expect(summary).toEqual({
      total: 0,
      errors: 0,
      warnings: 0,
      byCode: {},
      passes: true,
    });
  });
});

describe("degenerate inputs", () => {
  it("survives a zero-area room with nothing in it", () => {
    const { summary } = checkLayout(bareRoom(0, 0), [], TEST_CATALOG);
    expect(summary.passes).toBe(true);
  });

  it("reports an item in a zero-area room as entirely outside it", () => {
    const { findings } = checkLayout(
      bareRoom(0, 0),
      [place("p1", TEST_PRODUCTS.bookshelf.id, 0, 0)],
      TEST_CATALOG,
    );
    expect(codes(findings)).toContain("OUTSIDE_ROOM");
  });

  it("does not invent walkway problems for an item that exactly fills the room", () => {
    const { findings } = checkLayout(
      bareRoom(1500, 600),
      [place("p1", TEST_PRODUCTS.wardrobe.id, 0, 0)],
      TEST_CATALOG,
    );
    expect(codes(findings)).not.toContain("WALKWAY_TOO_NARROW");
    expect(codes(findings)).not.toContain("OUTSIDE_ROOM");
  });

  it("treats an empty catalog as every placement being unknown", () => {
    const { findings, summary } = checkLayout(
      bareRoom(),
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0), place("p2", TEST_PRODUCTS.rug.id, 0, 0)],
      [],
    );
    expect(codes(findings)).toEqual(["UNKNOWN_PRODUCT", "UNKNOWN_PRODUCT"]);
    expect(summary.errors).toBe(2);
  });
});

describe("multiple simultaneous violations", () => {
  it("reports every distinct problem with the right placements and measurements", () => {
    const room = createRectangularRoom({
      name: "Cramped Room",
      widthMm: 2600,
      depthMm: 2600,
      openings: [aDoor({ id: "door", offsetMm: 0, widthMm: 700 })],
      obstructions: [
        {
          id: "col",
          label: "structural column",
          kind: "column",
          x: 2300,
          y: 2300,
          widthMm: 300,
          depthMm: 300,
        },
      ],
    });
    const { findings, summary } = checkLayout(
      room,
      [
        place("sofa", TEST_PRODUCTS.sofa.id, 200, 200),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 2000, 2200),
        place("ghost", "not-in-catalog", 0, 0),
      ],
      TEST_CATALOG,
    );

    const seen = new Set(codes(findings));
    expect(seen).toContain("UNKNOWN_PRODUCT");
    expect(seen).toContain("OUTSIDE_ROOM");
    expect(seen).toContain("WONT_FIT_THROUGH_DOOR");
    expect(seen).toContain("OBSTRUCTION_CONFLICT");
    expect(summary.total).toBe(findings.length);
    expect(summary.passes).toBe(false);

    for (const finding of findingsForPlacement(findings, "sofa")) {
      expect(finding.placementIds).toContain("sofa");
    }
  });

  it("counts each code separately in the summary", () => {
    const { summary } = checkLayout(
      bareRoom(),
      [
        place("a", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("b", TEST_PRODUCTS.wardrobe.id, 1100, 1100),
        place("c", TEST_PRODUCTS.wardrobe.id, 1200, 1200),
      ],
      TEST_CATALOG,
    );
    expect(summary.byCode.OVERLAP).toBe(3);
  });
});

describe("rotation is applied about the placement's north-west corner", () => {
  it("keeps the corner fixed and only swaps the axes", () => {
    for (const rotation of ROTATIONS) {
      const footprint = footprintFor(1500, 2500, 2000, 900, rotation);
      expect(footprint.x).toBe(1500);
      expect(footprint.y).toBe(2500);
      const sideways = rotation === 90 || rotation === 270;
      expect(footprint.width).toBe(sideways ? 900 : 2000);
      expect(footprint.depth).toBe(sideways ? 2000 : 900);
    }
  });

  it("leaves a square footprint identical under every rotation", () => {
    const square = ROTATIONS.map((rotation) => footprintFor(0, 0, 800, 800, rotation));
    for (const footprint of square) {
      expect(footprint).toEqual({ x: 0, y: 0, width: 800, depth: 800 });
    }
  });

  it("judges a rotated placement's bounds on its rotated footprint", () => {
    const room = bareRoom(1000, 2500);
    const upright = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0, 180)],
      TEST_CATALOG,
    );
    expect(codes(upright.findings)).toContain("OUTSIDE_ROOM");

    const turned = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0, 270)],
      TEST_CATALOG,
    );
    expect(codes(turned.findings)).not.toContain("OUTSIDE_ROOM");
  });
});
