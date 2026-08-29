import type { Compass } from "../geometry/rotation";
import type { Point, Rect } from "../geometry/rect";
import type { Mm } from "./units";

export type WallName = Compass;

export const WALL_NAMES: readonly WallName[] = ["north", "east", "south", "west"];

/**
 * Walls are stored as directed segments rather than derived from a bounding box
 * so that non-rectangular footprints can be introduced without changing the
 * shape of stored rooms or the opening/offset model.
 */
export interface Wall {
  name: WallName;
  from: Point;
  to: Point;
}

export const OPENING_TYPES = ["door", "window"] as const;
export type OpeningType = (typeof OPENING_TYPES)[number];

export const HINGE_SIDES = ["start", "end"] as const;
/** `start` hinges at the wall segment's `from` end, `end` at its `to` end. */
export type HingeSide = (typeof HINGE_SIDES)[number];

export const SWING_DIRECTIONS = ["inward", "outward"] as const;
export type SwingDirection = (typeof SWING_DIRECTIONS)[number];

export interface DoorSwing {
  hingeSide: HingeSide;
  direction: SwingDirection;
}

export interface Opening {
  id: string;
  type: OpeningType;
  wall: WallName;
  /** Distance from the wall segment's `from` end to the near edge of the opening. */
  offsetMm: Mm;
  widthMm: Mm;
  /** Sill height for windows; head height for doors. */
  heightMm: Mm;
  /** Present only for doors. */
  swing?: DoorSwing;
}

export const OBSTRUCTION_KINDS = [
  "bulkhead",
  "column",
  "radiator",
  "stair",
  "fireplace",
  "other",
] as const;

export type ObstructionKind = (typeof OBSTRUCTION_KINDS)[number];

export interface Obstruction {
  id: string;
  label: string;
  kind: ObstructionKind;
  x: Mm;
  y: Mm;
  widthMm: Mm;
  depthMm: Mm;
}

export interface Room {
  name: string;
  widthMm: Mm;
  depthMm: Mm;
  walls: readonly Wall[];
  openings: readonly Opening[];
  obstructions: readonly Obstruction[];
}

export function roomFootprint(room: Room): Rect {
  return { x: 0, y: 0, width: room.widthMm, depth: room.depthMm };
}

export function obstructionRect(obstruction: Obstruction): Rect {
  return {
    x: obstruction.x,
    y: obstruction.y,
    width: obstruction.widthMm,
    depth: obstruction.depthMm,
  };
}

/**
 * Wall segments run clockwise from the north-west corner, which fixes the
 * meaning of an opening's `offsetMm` and of a door's hinge side.
 */
export function rectangularWalls(widthMm: Mm, depthMm: Mm): Wall[] {
  return [
    { name: "north", from: { x: 0, y: 0 }, to: { x: widthMm, y: 0 } },
    { name: "east", from: { x: widthMm, y: 0 }, to: { x: widthMm, y: depthMm } },
    { name: "south", from: { x: widthMm, y: depthMm }, to: { x: 0, y: depthMm } },
    { name: "west", from: { x: 0, y: depthMm }, to: { x: 0, y: 0 } },
  ];
}

export function createRectangularRoom(input: {
  name: string;
  widthMm: Mm;
  depthMm: Mm;
  openings?: readonly Opening[];
  obstructions?: readonly Obstruction[];
}): Room {
  return {
    name: input.name,
    widthMm: input.widthMm,
    depthMm: input.depthMm,
    walls: rectangularWalls(input.widthMm, input.depthMm),
    openings: input.openings ?? [],
    obstructions: input.obstructions ?? [],
  };
}

export function findWall(room: Room, name: WallName): Wall | undefined {
  return room.walls.find((wall) => wall.name === name);
}

export function wallLength(wall: Wall): Mm {
  return Math.hypot(wall.to.x - wall.from.x, wall.to.y - wall.from.y);
}

/** Unit vector along the wall, from `from` towards `to`. */
export function wallDirection(wall: Wall): Point {
  const length = wallLength(wall);
  if (length === 0) return { x: 0, y: 0 };
  return { x: (wall.to.x - wall.from.x) / length, y: (wall.to.y - wall.from.y) / length };
}

/** Unit vector pointing from the wall into the room. */
export function wallInwardNormal(wall: WallName): Point {
  switch (wall) {
    case "north":
      return { x: 0, y: 1 };
    case "east":
      return { x: -1, y: 0 };
    case "south":
      return { x: 0, y: -1 };
    case "west":
      return { x: 1, y: 0 };
    default: {
      const exhaustive: never = wall;
      throw new Error(`unhandled wall: ${String(exhaustive)}`);
    }
  }
}

export function pointAlongWall(wall: Wall, offsetMm: Mm): Point {
  const direction = wallDirection(wall);
  return {
    x: wall.from.x + direction.x * offsetMm,
    y: wall.from.y + direction.y * offsetMm,
  };
}

/** The two endpoints of an opening, in room coordinates. */
export function openingSegment(
  room: Room,
  opening: Opening,
): { start: Point; end: Point } | null {
  const wall = findWall(room, opening.wall);
  if (!wall) return null;
  return {
    start: pointAlongWall(wall, opening.offsetMm),
    end: pointAlongWall(wall, opening.offsetMm + opening.widthMm),
  };
}

export function doors(room: Room): Opening[] {
  return room.openings.filter((opening) => opening.type === "door");
}

export function narrowestDoorWidth(room: Room): Mm | null {
  const widths = doors(room).map((door) => door.widthMm);
  return widths.length === 0 ? null : Math.min(...widths);
}
