import {
  openingSegment,
  wallDirection,
  wallInwardNormal,
  findWall,
  type Opening,
  type Room,
} from "../domain/room";
import type { Mm } from "../domain/units";
import type { Point, Rect } from "./rect";

export interface DoorSwingGeometry {
  /** Corner the door is hinged on. */
  hinge: Point;
  /** Quarter-circle radius, equal to the door leaf width. */
  radiusMm: Mm;
  /** Unit vector from the hinge towards the door's opposite jamb. */
  along: Point;
  /** Unit vector from the hinge in the direction the leaf swings. */
  sweep: Point;
  /** Point the open leaf's tip reaches. */
  tip: Point;
  /** Axis-aligned bounding box of the swept quarter disc. */
  bounds: Rect;
}

/** Negating a zero component yields -0, which leaks into coordinates and JSON. */
function reverse(vector: Point): Point {
  return { x: -vector.x + 0, y: -vector.y + 0 };
}

function boundsOf(points: readonly Point[]): Rect {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, depth: Math.max(...ys) - y };
}

/**
 * Geometry of a door leaf's swept quarter disc. Returns `null` for windows and
 * for doors that swing away from the room, which cannot be obstructed from
 * inside it.
 */
export function doorSwingGeometry(
  room: Room,
  opening: Opening,
): DoorSwingGeometry | null {
  if (opening.type !== "door" || !opening.swing) return null;
  if (opening.swing.direction !== "inward") return null;

  const wall = findWall(room, opening.wall);
  const segment = openingSegment(room, opening);
  if (!wall || !segment) return null;

  const direction = wallDirection(wall);
  const hinge = opening.swing.hingeSide === "start" ? segment.start : segment.end;
  const along =
    opening.swing.hingeSide === "start" ? direction : reverse(direction);
  const sweep = wallInwardNormal(opening.wall);
  const radiusMm = opening.widthMm;

  const tip = { x: hinge.x + sweep.x * radiusMm, y: hinge.y + sweep.y * radiusMm };
  const alongTip = {
    x: hinge.x + along.x * radiusMm,
    y: hinge.y + along.y * radiusMm,
  };
  const diagonal = {
    x: hinge.x + (along.x + sweep.x) * radiusMm,
    y: hinge.y + (along.y + sweep.y) * radiusMm,
  };

  return {
    hinge,
    radiusMm,
    along,
    sweep,
    tip,
    bounds: boundsOf([hinge, alongTip, tip, diagonal]),
  };
}

export function inwardDoorSwings(room: Room): DoorSwingGeometry[] {
  const geometries: DoorSwingGeometry[] = [];
  for (const opening of room.openings) {
    const geometry = doorSwingGeometry(room, opening);
    if (geometry) geometries.push(geometry);
  }
  return geometries;
}
