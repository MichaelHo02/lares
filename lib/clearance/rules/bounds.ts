import { obstructionRect, roomFootprint } from "../../domain/room";
import {
  containsRect,
  intersectRect,
  rectBottom,
  rectRight,
} from "../../geometry/rect";
import { describe, type Rule } from "../context";
import type { Finding } from "../findings";

/** How far outside the room the worst corner of a footprint sits. */
function worstOverhang(
  footprint: { x: number; y: number; width: number; depth: number },
  room: { width: number; depth: number },
): number {
  return Math.max(
    -footprint.x,
    -footprint.y,
    rectRight(footprint) - room.width,
    rectBottom(footprint) - room.depth,
  );
}

export const outsideRoomRule: Rule = ({ room, resolved }) => {
  const bounds = roomFootprint(room);
  const findings: Finding[] = [];

  for (const entry of resolved) {
    if (containsRect(bounds, entry.footprint)) continue;
    const overhang = Math.round(
      worstOverhang(entry.footprint, { width: room.widthMm, depth: room.depthMm }),
    );
    findings.push({
      code: "OUTSIDE_ROOM",
      severity: "error",
      placementIds: [entry.placement.id],
      measuredMm: overhang,
      requiredMm: 0,
      message:
        `${describe(entry)} extends ${overhang}mm beyond the room. Move it fully inside ` +
        `the ${room.widthMm}mm × ${room.depthMm}mm footprint.`,
      region: entry.footprint,
    });
  }

  return findings;
};

export const obstructionRule: Rule = ({ room, resolved }) => {
  const findings: Finding[] = [];

  for (const entry of resolved) {
    for (const obstruction of room.obstructions) {
      const overlap = intersectRect(entry.footprint, obstructionRect(obstruction));
      if (!overlap) continue;
      findings.push({
        code: "OBSTRUCTION_CONFLICT",
        severity: "error",
        placementIds: [entry.placement.id],
        measuredMm: Math.round(Math.min(overlap.width, overlap.depth)),
        requiredMm: 0,
        message:
          `${describe(entry)} clashes with a fixed ${obstruction.kind} ` +
          `(${obstruction.label}) by ${Math.round(Math.min(overlap.width, overlap.depth))}mm.`,
        region: overlap,
      });
    }
  }

  return findings;
};
