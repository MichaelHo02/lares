import { isFloorCovering } from "../../domain/product";
import { COMPASS } from "../../geometry/rotation";
import { facingGap, rectBottom, rectRight, type Rect } from "../../geometry/rect";
import type { Mm } from "../../domain/units";
import type { Room } from "../../domain/room";
import { describe, type Rule } from "../context";
import type { Finding, Severity } from "../findings";
import { isCompanionPair, requiredWalkwayFor, STANDARDS } from "../standards";

/**
 * A general "is this room navigable" answer needs pathfinding, which this engine
 * deliberately does not attempt. Instead it measures the gaps a person would
 * actually try to walk through: the space between two pieces of furniture whose
 * faces overlap, and the space between a large item and the wall behind it.
 */

/** Items too small to create a meaningful dead space against a wall. */
const WALL_GAP_MIN_FOOTPRINT_MM: Mm = 500;

function severityForPairGap(gap: Mm): Severity {
  return gap < STANDARDS.SECONDARY_WALKWAY_MM ? "error" : "warning";
}

function gapRegionBetween(a: Rect, b: Rect, axis: "x" | "y"): Rect {
  if (axis === "y") {
    const x = Math.max(a.x, b.x);
    const width = Math.min(rectRight(a), rectRight(b)) - x;
    const y = Math.min(rectBottom(a), rectBottom(b));
    const depth = Math.max(a.y, b.y) - y;
    return { x, y, width, depth };
  }
  const y = Math.max(a.y, b.y);
  const depth = Math.min(rectBottom(a), rectBottom(b)) - y;
  const x = Math.min(rectRight(a), rectRight(b));
  const width = Math.max(a.x, b.x) - x;
  return { x, y, width, depth };
}

function wallGap(footprint: Rect, room: Room, direction: (typeof COMPASS)[number]): Mm {
  switch (direction) {
    case "north":
      return footprint.y;
    case "south":
      return room.depthMm - rectBottom(footprint);
    case "west":
      return footprint.x;
    case "east":
      return room.widthMm - rectRight(footprint);
    default: {
      const exhaustive: never = direction;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}

function wallGapRegion(
  footprint: Rect,
  room: Room,
  direction: (typeof COMPASS)[number],
  gap: Mm,
): Rect {
  switch (direction) {
    case "north":
      return { x: footprint.x, y: 0, width: footprint.width, depth: gap };
    case "south":
      return {
        x: footprint.x,
        y: rectBottom(footprint),
        width: footprint.width,
        depth: gap,
      };
    case "west":
      return { x: 0, y: footprint.y, width: gap, depth: footprint.depth };
    case "east":
      return {
        x: rectRight(footprint),
        y: footprint.y,
        width: gap,
        depth: footprint.depth,
      };
    default: {
      const exhaustive: never = direction;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}

export const walkwayRule: Rule = ({ room, resolved }) => {
  const findings: Finding[] = [];
  const walkable = resolved.filter((entry) => !isFloorCovering(entry.product.category));

  for (let i = 0; i < walkable.length; i += 1) {
    for (let j = i + 1; j < walkable.length; j += 1) {
      const a = walkable[i];
      const b = walkable[j];
      if (isCompanionPair(a.product.category, b.product.category)) continue;

      const facing = facingGap(a.footprint, b.footprint);
      if (!facing) continue;

      const gap = Math.round(facing.gap);
      if (gap < STANDARDS.WALKWAY_INTENT_THRESHOLD_MM) continue;

      const required = requiredWalkwayFor(a.product.category, b.product.category);
      if (gap >= required) continue;

      findings.push({
        code: "WALKWAY_TOO_NARROW",
        severity: severityForPairGap(gap),
        placementIds: [a.placement.id, b.placement.id],
        measuredMm: gap,
        requiredMm: required,
        message:
          `Only ${gap}mm between ${describe(a)} and ${describe(b)}, where a walkway needs ` +
          `${required}mm. Widen the gap or push one of them together.`,
        region: gapRegionBetween(a.footprint, b.footprint, facing.axis),
      });
    }
  }

  for (const entry of walkable) {
    const smallestSide = Math.min(entry.footprint.width, entry.footprint.depth);
    if (smallestSide < WALL_GAP_MIN_FOOTPRINT_MM) continue;

    for (const direction of COMPASS) {
      const gap = Math.round(wallGap(entry.footprint, room, direction));
      if (gap < STANDARDS.WALKWAY_INTENT_THRESHOLD_MM) continue;

      const required = requiredWalkwayFor(entry.product.category, "wall");
      if (gap >= required) continue;

      findings.push({
        code: "WALKWAY_TOO_NARROW",
        severity: "warning",
        placementIds: [entry.placement.id],
        measuredMm: gap,
        requiredMm: required,
        message:
          `${gap}mm of dead space between ${describe(entry)} and the ${direction} wall — ` +
          `too narrow to walk through at ${required}mm. Push it against the wall to ` +
          `recover the floor area.`,
        region: wallGapRegion(entry.footprint, room, direction, gap),
      });
    }
  }

  return findings;
};
