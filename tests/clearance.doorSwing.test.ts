import { describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import type { Finding } from "../lib/clearance/findings";
import { createRectangularRoom, type WallName } from "../lib/domain/room";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  aDoor,
  aProduct,
  catalogOf,
  codesOf,
  firstOf,
  makeRoom,
  place,
} from "./fixtures";

const BLOCK = aProduct({
  id: "block",
  name: "Block",
  category: "bookshelf",
  widthMm: 300,
  depthMm: 300,
  heightMm: 300,
});

const CATALOG = catalogOf(BLOCK);

function roomWithDoorOn(wall: WallName, widthMm = 500, offsetMm = 0) {
  return createRectangularRoom({
    name: "Swing Room",
    widthMm: 4000,
    depthMm: 4000,
    openings: [aDoor({ id: `door-${wall}`, wall, offsetMm, widthMm })],
  });
}

function swingFindings(wall: WallName, x: number, y: number): Finding[] {
  const { findings } = checkLayout(
    roomWithDoorOn(wall),
    [place("p1", BLOCK.id, x, y)],
    CATALOG,
  );
  return findings.filter((finding) => finding.code === "DOOR_SWING_BLOCKED");
}

describe("DOOR_SWING_BLOCKED across the arc", () => {
  it("flags an item under the leaf of a north door", () => {
    const [finding] = swingFindings("north", 100, 100);
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(141);
    expect(finding.requiredMm).toBe(500);
  });

  it("flags an item under the leaf of every wall's door", () => {
    const near: Record<WallName, [number, number]> = {
      north: [100, 100],
      east: [3600, 100],
      south: [3600, 3600],
      west: [100, 3600],
    };
    for (const wall of Object.keys(near) as WallName[]) {
      const [x, y] = near[wall];
      expect(swingFindings(wall, x, y)).toHaveLength(1);
    }
  });

  it("clears an item exactly on the arc's radius", () => {
    // Hinge at (0, 0), radius 500: the corner (300, 400) is exactly 500mm away.
    expect(swingFindings("north", 300, 400)).toEqual([]);
  });

  it("flags an item one millimetre inside the arc", () => {
    const [finding] = swingFindings("north", 300, 399);
    expect(finding.measuredMm).toBe(499);
  });

  it("clears an item that only touches the arc's bounding box", () => {
    expect(swingFindings("north", 0, 500)).toEqual([]);
    expect(swingFindings("north", 500, 0)).toEqual([]);
  });

  it("clears an item beyond the leaf even when it shares the door's wall", () => {
    expect(swingFindings("north", 600, 0)).toEqual([]);
  });

  it("scales the arc with the door's width", () => {
    const wide = checkLayout(
      roomWithDoorOn("north", 900),
      [place("p1", BLOCK.id, 600, 600)],
      CATALOG,
    );
    const narrow = checkLayout(
      roomWithDoorOn("north", 500),
      [place("p1", BLOCK.id, 600, 600)],
      CATALOG,
    );
    expect(wide.findings.some((f) => f.code === "DOOR_SWING_BLOCKED")).toBe(true);
    expect(narrow.findings.some((f) => f.code === "DOOR_SWING_BLOCKED")).toBe(false);
  });

  it("clears an item tucked into the far corner of the arc bounding box", () => {
    // 820mm hinged at x=400: the point (1200, 800) is 1131mm from the hinge, so
    // it lies inside the bounding square but outside the quarter disc.
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.bedsideTable.id, 1180, 780)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("DOOR_SWING_BLOCKED");
  });

  it("ignores an outward-swinging door", () => {
    const room = makeRoom(6000, 6000, [
      aDoor({
        id: "door-out",
        offsetMm: 400,
        widthMm: 820,
        swing: { hingeSide: "start", direction: "outward" },
      }),
    ]);
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.bookshelf.id, 500, 100)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("DOOR_SWING_BLOCKED");
  });

  it("warns rather than errors when a fixed obstruction restricts the swing", () => {
    const room = createRectangularRoom({
      name: "Radiator Room",
      widthMm: 6000,
      depthMm: 6000,
      openings: [aDoor({ id: "door-north", offsetMm: 400, widthMm: 820 })],
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

  it("flags the same item from either hinge side of the same doorway", () => {
    const room = createRectangularRoom({
      name: "Hinge Room",
      widthMm: 4000,
      depthMm: 4000,
      openings: [
        aDoor({
          id: "door",
          offsetMm: 1000,
          widthMm: 800,
          swing: { hingeSide: "end", direction: "inward" },
        }),
      ],
    });
    const { findings } = checkLayout(
      room,
      [place("p1", BLOCK.id, 1500, 100)],
      CATALOG,
    );
    const swing = findings.filter((finding) => finding.code === "DOOR_SWING_BLOCKED");
    expect(swing).toHaveLength(1);
    expect(swing[0].placementIds).toEqual(["p1"]);
  });
});
