import type { Mm } from "../domain/units";
import type { Rect } from "./rect";

export const ROTATIONS = [0, 90, 180, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];

export function isRotation(value: number): value is Rotation {
  return ROTATIONS.includes(value as Rotation);
}

/** Compass direction in room space. */
export const COMPASS = ["north", "east", "south", "west"] as const;
export type Compass = (typeof COMPASS)[number];

/** Product-local faces. At rotation 0 the product's front faces south. */
export const FACES = ["front", "back", "left", "right"] as const;
export type Face = (typeof FACES)[number];

/**
 * Rotating a product by +90 advances every one of its faces one step along this
 * cycle, so a single table drives all four faces.
 */
const ROTATION_CYCLE: readonly Compass[] = ["south", "west", "north", "east"];

const FACE_OFFSET: Record<Face, number> = {
  front: 0,
  left: 1,
  back: 2,
  right: 3,
};

export function faceToCompass(face: Face, rotation: Rotation): Compass {
  const steps = rotation / 90 + FACE_OFFSET[face];
  return ROTATION_CYCLE[steps % 4];
}

export function compassToFace(direction: Compass, rotation: Rotation): Face {
  for (const face of FACES) {
    if (faceToCompass(face, rotation) === direction) return face;
  }
  throw new Error(`unreachable: no face maps to ${direction}`);
}

export function isRotationSideways(rotation: Rotation): boolean {
  return rotation === 90 || rotation === 270;
}

/** Axis-aligned footprint of a product placed with its north-west corner at (x, y). */
export function footprintFor(
  x: Mm,
  y: Mm,
  widthMm: Mm,
  depthMm: Mm,
  rotation: Rotation,
): Rect {
  return isRotationSideways(rotation)
    ? { x, y, width: depthMm, depth: widthMm }
    : { x, y, width: widthMm, depth: depthMm };
}

/**
 * The band of floor immediately outside one edge of `rect`, extending `depth`
 * millimetres away from it. This is how every clearance requirement becomes a
 * rectangle the engine can test.
 */
export function zoneOutside(rect: Rect, direction: Compass, depth: Mm): Rect {
  switch (direction) {
    case "north":
      return { x: rect.x, y: rect.y - depth, width: rect.width, depth };
    case "south":
      return { x: rect.x, y: rect.y + rect.depth, width: rect.width, depth };
    case "west":
      return { x: rect.x - depth, y: rect.y, width: depth, depth: rect.depth };
    case "east":
      return { x: rect.x + rect.width, y: rect.y, width: depth, depth: rect.depth };
    default: {
      const exhaustive: never = direction;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}

export function axisOf(direction: Compass): "x" | "y" {
  switch (direction) {
    case "north":
    case "south":
      return "y";
    case "east":
    case "west":
      return "x";
    default: {
      const exhaustive: never = direction;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}

export function oppositeOf(direction: Compass): Compass {
  switch (direction) {
    case "north":
      return "south";
    case "south":
      return "north";
    case "east":
      return "west";
    case "west":
      return "east";
    default: {
      const exhaustive: never = direction;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}
