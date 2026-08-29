import { describe, expect, it } from "vitest";
import { doorSwingGeometry, inwardDoorSwings } from "../lib/geometry/doorSwing";
import type { Rect } from "../lib/geometry/rect";
import {
  createRectangularRoom,
  HINGE_SIDES,
  WALL_NAMES,
  type HingeSide,
  type WallName,
} from "../lib/domain/room";
import { aDoor } from "./fixtures";

const ROOM_WIDTH_MM = 4000;
const ROOM_DEPTH_MM = 3000;
const DOOR_WIDTH_MM = 800;
const DOOR_OFFSET_MM = 1000;

function roomWithDoor(wall: WallName, hingeSide: HingeSide, inward: boolean) {
  return createRectangularRoom({
    name: "Swing Room",
    widthMm: ROOM_WIDTH_MM,
    depthMm: ROOM_DEPTH_MM,
    openings: [
      aDoor({
        id: `door-${wall}`,
        wall,
        offsetMm: DOOR_OFFSET_MM,
        widthMm: DOOR_WIDTH_MM,
        swing: { hingeSide, direction: inward ? "inward" : "outward" },
      }),
    ],
  });
}

function swingOf(wall: WallName, hingeSide: HingeSide, inward = true) {
  const room = roomWithDoor(wall, hingeSide, inward);
  return doorSwingGeometry(room, room.openings[0]);
}

/** Bounds are the same square whichever jamb the leaf is hinged on. */
const EXPECTED_BOUNDS: Record<WallName, Rect> = {
  north: { x: 1000, y: 0, width: 800, depth: 800 },
  east: { x: 3200, y: 1000, width: 800, depth: 800 },
  south: { x: 2200, y: 2200, width: 800, depth: 800 },
  west: { x: 0, y: 1200, width: 800, depth: 800 },
};

const EXPECTED_HINGES: Record<WallName, Record<HingeSide, { x: number; y: number }>> = {
  north: { start: { x: 1000, y: 0 }, end: { x: 1800, y: 0 } },
  east: { start: { x: 4000, y: 1000 }, end: { x: 4000, y: 1800 } },
  south: { start: { x: 3000, y: 3000 }, end: { x: 2200, y: 3000 } },
  west: { start: { x: 0, y: 2000 }, end: { x: 0, y: 1200 } },
};

describe("door swing geometry across every wall and hinge", () => {
  for (const wall of WALL_NAMES) {
    for (const hingeSide of HINGE_SIDES) {
      it(`hinges an inward ${wall} door on its ${hingeSide} jamb`, () => {
        const swing = swingOf(wall, hingeSide);
        expect(swing).not.toBeNull();
        if (!swing) return;
        expect(swing.hinge).toEqual(EXPECTED_HINGES[wall][hingeSide]);
        expect(swing.radiusMm).toBe(DOOR_WIDTH_MM);
        expect(swing.bounds).toEqual(EXPECTED_BOUNDS[wall]);
      });

      it(`ignores an outward ${wall} door hinged on its ${hingeSide} jamb`, () => {
        expect(swingOf(wall, hingeSide, false)).toBeNull();
      });
    }
  }

  it("sweeps the leaf tip straight into the room from every wall", () => {
    const expectedTips: Record<WallName, { x: number; y: number }> = {
      north: { x: 1000, y: 800 },
      east: { x: 3200, y: 1000 },
      south: { x: 3000, y: 2200 },
      west: { x: 800, y: 2000 },
    };
    for (const wall of WALL_NAMES) {
      expect(swingOf(wall, "start")?.tip).toEqual(expectedTips[wall]);
    }
  });

  it("points the along vector back down the wall when hinged at the end jamb", () => {
    expect(swingOf("north", "start")?.along).toEqual({ x: 1, y: 0 });
    expect(swingOf("north", "end")?.along).toEqual({ x: -1, y: 0 });
    expect(swingOf("west", "start")?.along).toEqual({ x: 0, y: -1 });
    expect(swingOf("west", "end")?.along).toEqual({ x: 0, y: 1 });
  });

  it("collects only the inward doors of a room, skipping windows", () => {
    const room = createRectangularRoom({
      name: "Mixed Room",
      widthMm: ROOM_WIDTH_MM,
      depthMm: ROOM_DEPTH_MM,
      openings: [
        aDoor({ id: "in", wall: "north", offsetMm: 500 }),
        aDoor({
          id: "out",
          wall: "south",
          offsetMm: 500,
          swing: { hingeSide: "start", direction: "outward" },
        }),
        {
          id: "window",
          type: "window",
          wall: "east",
          offsetMm: 500,
          widthMm: 1200,
          heightMm: 900,
        },
        { ...aDoor({ id: "sliding", wall: "west", offsetMm: 500 }), swing: undefined },
      ],
    });
    const swings = inwardDoorSwings(room);
    expect(swings).toHaveLength(1);
    expect(swings[0].hinge).toEqual({ x: 500, y: 0 });
  });
});
