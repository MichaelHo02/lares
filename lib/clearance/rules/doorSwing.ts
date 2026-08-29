import { obstructionRect } from "../../domain/room";
import { doorSwingGeometry } from "../../geometry/doorSwing";
import { distancePointToRect, intersectRect } from "../../geometry/rect";
import { describe, type Rule } from "../context";
import type { Finding } from "../findings";

/**
 * A leaf is obstructed when something sits inside the swept quarter disc. The
 * bounding box is tested first, then the true radial distance from the hinge, so
 * items tucked into the square's far corner are not falsely reported.
 */
export const doorSwingRule: Rule = ({ room, resolved }) => {
  const findings: Finding[] = [];

  for (const opening of room.openings) {
    const swing = doorSwingGeometry(room, opening);
    if (!swing) continue;

    for (const entry of resolved) {
      const inBounds = intersectRect(entry.footprint, swing.bounds);
      if (!inBounds) continue;

      const distance = distancePointToRect(swing.hinge, inBounds);
      if (distance >= swing.radiusMm) continue;

      findings.push({
        code: "DOOR_SWING_BLOCKED",
        severity: "error",
        placementIds: [entry.placement.id],
        measuredMm: Math.round(distance),
        requiredMm: swing.radiusMm,
        message:
          `${describe(entry)} sits inside the swing of the ${opening.widthMm}mm ` +
          `${opening.wall} door, ${Math.round(distance)}mm from the hinge where the leaf ` +
          `needs a clear ${swing.radiusMm}mm. Move it clear of the door arc.`,
        region: inBounds,
      });
    }

    for (const obstruction of room.obstructions) {
      const inBounds = intersectRect(obstructionRect(obstruction), swing.bounds);
      if (!inBounds) continue;

      const distance = distancePointToRect(swing.hinge, inBounds);
      if (distance >= swing.radiusMm) continue;

      findings.push({
        code: "DOOR_SWING_BLOCKED",
        severity: "warning",
        placementIds: [],
        measuredMm: Math.round(distance),
        requiredMm: swing.radiusMm,
        message:
          `The fixed ${obstruction.kind} (${obstruction.label}) restricts the ` +
          `${opening.wall} door to ${Math.round(distance)}mm of its ${swing.radiusMm}mm swing.`,
        region: inBounds,
      });
    }
  }

  return findings;
};
