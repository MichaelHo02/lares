import { describe, expect, it } from "vitest";
import {
  containsRect,
  distancePointToRect,
  facingGap,
  inflateRect,
  intersectRect,
  rectsOverlap,
} from "../lib/geometry/rect";
import {
  COMPASS,
  ROTATIONS,
  axisOf,
  compassToFace,
  faceToCompass,
  footprintFor,
  isRotationSideways,
  oppositeOf,
  zoneOutside,
} from "../lib/geometry/rotation";
import { doorSwingGeometry } from "../lib/geometry/doorSwing";
import { createRectangularRoom, wallInwardNormal } from "../lib/domain/room";
import { EAST_WINDOW, NORTH_DOOR, makeRoom } from "./fixtures";

describe("rect", () => {
  it("treats shared edges as touching rather than overlapping", () => {
    const a = { x: 0, y: 0, width: 100, depth: 100 };
    const b = { x: 100, y: 0, width: 100, depth: 100 };
    expect(rectsOverlap(a, b)).toBe(false);
    expect(intersectRect(a, b)).toBeNull();
  });

  it("returns the shared region when rectangles genuinely overlap", () => {
    const overlap = intersectRect(
      { x: 0, y: 0, width: 100, depth: 100 },
      { x: 60, y: 40, width: 100, depth: 100 },
    );
    expect(overlap).toEqual({ x: 60, y: 40, width: 40, depth: 60 });
  });

  it("containment allows flush edges", () => {
    const room = { x: 0, y: 0, width: 1000, depth: 1000 };
    expect(containsRect(room, { x: 0, y: 0, width: 1000, depth: 1000 })).toBe(true);
    expect(containsRect(room, { x: -1, y: 0, width: 1000, depth: 1000 })).toBe(false);
  });

  it("inflates symmetrically", () => {
    expect(inflateRect({ x: 100, y: 100, width: 200, depth: 200 }, 50)).toEqual({
      x: 50,
      y: 50,
      width: 300,
      depth: 300,
    });
  });

  it("measures zero distance for a point inside a rectangle", () => {
    expect(
      distancePointToRect({ x: 50, y: 50 }, { x: 0, y: 0, width: 100, depth: 100 }),
    ).toBe(0);
  });

  it("measures diagonal distance from a point to a rectangle corner", () => {
    expect(
      distancePointToRect({ x: -30, y: -40 }, { x: 0, y: 0, width: 100, depth: 100 }),
    ).toBe(50);
  });

  it("reports a facing gap only when the perpendicular projections overlap", () => {
    const a = { x: 0, y: 0, width: 1000, depth: 500 };
    const facing = { x: 200, y: 1200, width: 1000, depth: 500 };
    expect(facingGap(a, facing)).toEqual({ gap: 700, axis: "y" });

    const offset = { x: 2000, y: 1200, width: 500, depth: 500 };
    expect(facingGap(a, offset)).toBeNull();
  });

  it("reports a facing gap on the x axis for side-by-side rectangles", () => {
    expect(
      facingGap(
        { x: 0, y: 0, width: 500, depth: 1000 },
        { x: 1100, y: 200, width: 500, depth: 1000 },
      ),
    ).toEqual({ gap: 600, axis: "x" });
  });
});

describe("rotation", () => {
  it("swaps width and depth for sideways rotations only", () => {
    expect(footprintFor(0, 0, 2000, 900, 0)).toEqual({
      x: 0,
      y: 0,
      width: 2000,
      depth: 900,
    });
    expect(footprintFor(0, 0, 2000, 900, 180)).toEqual({
      x: 0,
      y: 0,
      width: 2000,
      depth: 900,
    });
    expect(footprintFor(0, 0, 2000, 900, 90)).toEqual({
      x: 0,
      y: 0,
      width: 900,
      depth: 2000,
    });
    expect(footprintFor(0, 0, 2000, 900, 270)).toEqual({
      x: 0,
      y: 0,
      width: 900,
      depth: 2000,
    });
    expect(isRotationSideways(90)).toBe(true);
    expect(isRotationSideways(180)).toBe(false);
  });

  it("faces south at rotation 0 and rotates the whole wheel with the product", () => {
    expect(faceToCompass("front", 0)).toBe("south");
    expect(faceToCompass("back", 0)).toBe("north");
    expect(faceToCompass("left", 0)).toBe("west");
    expect(faceToCompass("right", 0)).toBe("east");

    expect(faceToCompass("front", 90)).toBe("west");
    expect(faceToCompass("front", 180)).toBe("north");
    expect(faceToCompass("front", 270)).toBe("east");
  });

  it("keeps front and back opposed at every rotation", () => {
    for (const rotation of ROTATIONS) {
      expect(faceToCompass("back", rotation)).toBe(
        oppositeOf(faceToCompass("front", rotation)),
      );
      expect(faceToCompass("right", rotation)).toBe(
        oppositeOf(faceToCompass("left", rotation)),
      );
    }
  });

  it("round-trips faces through compass directions", () => {
    for (const rotation of ROTATIONS) {
      for (const direction of COMPASS) {
        const face = compassToFace(direction, rotation);
        expect(faceToCompass(face, rotation)).toBe(direction);
      }
    }
  });

  it("builds clearance zones outside the requested edge", () => {
    const rect = { x: 1000, y: 1000, width: 800, depth: 400 };
    expect(zoneOutside(rect, "south", 600)).toEqual({
      x: 1000,
      y: 1400,
      width: 800,
      depth: 600,
    });
    expect(zoneOutside(rect, "north", 600)).toEqual({
      x: 1000,
      y: 400,
      width: 800,
      depth: 600,
    });
    expect(zoneOutside(rect, "west", 600)).toEqual({
      x: 400,
      y: 1000,
      width: 600,
      depth: 400,
    });
    expect(zoneOutside(rect, "east", 600)).toEqual({
      x: 1800,
      y: 1000,
      width: 600,
      depth: 400,
    });
  });

  it("maps directions to axes", () => {
    expect(axisOf("north")).toBe("y");
    expect(axisOf("east")).toBe("x");
  });
});

describe("wall normals", () => {
  it("points into the room from every wall", () => {
    expect(wallInwardNormal("north")).toEqual({ x: 0, y: 1 });
    expect(wallInwardNormal("south")).toEqual({ x: 0, y: -1 });
    expect(wallInwardNormal("east")).toEqual({ x: -1, y: 0 });
    expect(wallInwardNormal("west")).toEqual({ x: 1, y: 0 });
  });
});

describe("door swing geometry", () => {
  it("sweeps a quarter disc from the hinge into the room", () => {
    const swing = doorSwingGeometry(makeRoom(), NORTH_DOOR);
    expect(swing).not.toBeNull();
    if (!swing) return;
    expect(swing.hinge).toEqual({ x: 400, y: 0 });
    expect(swing.radiusMm).toBe(820);
    expect(swing.tip).toEqual({ x: 400, y: 820 });
    expect(swing.bounds).toEqual({ x: 400, y: 0, width: 820, depth: 820 });
  });

  it("hinges at the far jamb when the hinge side is end", () => {
    const swing = doorSwingGeometry(makeRoom(), {
      ...NORTH_DOOR,
      swing: { hingeSide: "end", direction: "inward" },
    });
    expect(swing?.hinge).toEqual({ x: 1220, y: 0 });
    expect(swing?.bounds).toEqual({ x: 400, y: 0, width: 820, depth: 820 });
  });

  it("ignores windows and outward swings", () => {
    expect(doorSwingGeometry(makeRoom(), EAST_WINDOW)).toBeNull();
    expect(
      doorSwingGeometry(makeRoom(), {
        ...NORTH_DOOR,
        swing: { hingeSide: "start", direction: "outward" },
      }),
    ).toBeNull();
  });

  it("swings west from an east wall door", () => {
    const room = createRectangularRoom({
      name: "East door room",
      widthMm: 3000,
      depthMm: 3000,
      openings: [
        {
          id: "door-east",
          type: "door",
          wall: "east",
          offsetMm: 500,
          widthMm: 900,
          heightMm: 2040,
          swing: { hingeSide: "start", direction: "inward" },
        },
      ],
    });
    const swing = doorSwingGeometry(room, room.openings[0]);
    expect(swing?.hinge).toEqual({ x: 3000, y: 500 });
    expect(swing?.bounds).toEqual({ x: 2100, y: 500, width: 900, depth: 900 });
  });
});
