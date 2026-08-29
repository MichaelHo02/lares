import type { ResolvedPlacement } from "../../domain/placement";
import { obstructionRect, type Room } from "../../domain/room";
import type { Compass } from "../../geometry/rotation";
import { intersectRect, rectBottom, rectRight, type Rect } from "../../geometry/rect";
import type { Mm } from "../../domain/units";

export type LimiterKind = "wall" | "placement" | "obstruction" | "none";

export interface ZoneMeasurement {
  /** Depth of clear floor actually available, capped at the requested depth. */
  availableMm: Mm;
  limiter: LimiterKind;
  /** Set when a placement is the closest blocker. */
  limiterPlacementId: string | null;
  limiterLabel: string | null;
}

/** Distance from the relevant edge of `from` to the near edge of `to`, along `direction`. */
function gapAlong(from: Rect, to: Rect, direction: Compass): Mm {
  switch (direction) {
    case "north":
      return from.y - rectBottom(to);
    case "south":
      return to.y - rectBottom(from);
    case "west":
      return from.x - rectRight(to);
    case "east":
      return to.x - rectRight(from);
    default: {
      const exhaustive: never = direction;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}

function distanceToWall(footprint: Rect, room: Room, direction: Compass): Mm {
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

/**
 * How much of a requested clearance zone is genuinely clear floor, and what the
 * closest thing standing in it is. Reporting the limiter is what lets an agent
 * decide whether to move the item or move whatever is blocking it.
 */
export function measureZone(input: {
  room: Room;
  subject: ResolvedPlacement;
  direction: Compass;
  zone: Rect;
  requestedMm: Mm;
  blockers: readonly ResolvedPlacement[];
}): ZoneMeasurement {
  const { room, subject, direction, zone, requestedMm, blockers } = input;

  let availableMm = Math.min(
    requestedMm,
    Math.max(0, distanceToWall(subject.footprint, room, direction)),
  );
  let limiter: LimiterKind = availableMm < requestedMm ? "wall" : "none";
  let limiterPlacementId: string | null = null;
  let limiterLabel: string | null = null;

  for (const blocker of blockers) {
    if (!intersectRect(blocker.footprint, zone)) continue;
    const gap = Math.max(0, gapAlong(subject.footprint, blocker.footprint, direction));
    if (gap >= availableMm) continue;
    availableMm = gap;
    limiter = "placement";
    limiterPlacementId = blocker.placement.id;
    limiterLabel = blocker.product.name;
  }

  for (const obstruction of room.obstructions) {
    const rect = obstructionRect(obstruction);
    if (!intersectRect(rect, zone)) continue;
    const gap = Math.max(0, gapAlong(subject.footprint, rect, direction));
    if (gap >= availableMm) continue;
    availableMm = gap;
    limiter = "obstruction";
    limiterPlacementId = null;
    limiterLabel = obstruction.label;
  }

  return { availableMm: Math.round(availableMm), limiter, limiterPlacementId, limiterLabel };
}
