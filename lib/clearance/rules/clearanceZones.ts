import type { ResolvedPlacement } from "../../domain/placement";
import type { ClearanceReason } from "../../domain/product";
import { isFloorCovering } from "../../domain/product";
import { faceToCompass, zoneOutside } from "../../geometry/rotation";
import { describe, type Rule } from "../context";
import type { Finding, FindingCode, Severity } from "../findings";
import { mayOccupyClearanceZone } from "../standards";
import { measureZone, type LimiterKind } from "./measure";

function codeFor(reason: ClearanceReason): FindingCode {
  switch (reason) {
    case "chair_pullout":
      return "CHAIR_PULLOUT_INSUFFICIENT";
    case "side_access":
      return "BED_SIDE_ACCESS_BLOCKED";
    case "door_swing":
    case "drawer_pull":
    case "seating_approach":
      return "CLEARANCE_ZONE_BLOCKED";
    default: {
      const exhaustive: never = reason;
      throw new Error(`unhandled clearance reason: ${String(exhaustive)}`);
    }
  }
}

/**
 * A wall limiting a seating or approach zone means that side of the item simply
 * is not usable, which is a design trade-off rather than a fault. Furniture
 * standing in the zone is a fault, because it can be moved.
 */
function severityFor(reason: ClearanceReason, limiter: LimiterKind): Severity {
  switch (reason) {
    case "door_swing":
      return "error";
    case "chair_pullout":
    case "drawer_pull":
      return limiter === "wall" ? "warning" : "error";
    case "seating_approach":
    case "side_access":
      return "warning";
    default: {
      const exhaustive: never = reason;
      throw new Error(`unhandled clearance reason: ${String(exhaustive)}`);
    }
  }
}

function blockersFor(
  subject: ResolvedPlacement,
  reason: ClearanceReason,
  all: readonly ResolvedPlacement[],
): ResolvedPlacement[] {
  return all.filter((candidate) => {
    if (candidate.placement.id === subject.placement.id) return false;
    if (isFloorCovering(candidate.product.category)) return false;
    return !mayOccupyClearanceZone(reason, candidate.product.category);
  });
}

export const clearanceZoneRule: Rule = ({ room, resolved }) => {
  const findings: Finding[] = [];

  for (const entry of resolved) {
    for (const requirement of entry.product.clearances) {
      // Bed side access is judged across both sides at once, not per side.
      if (requirement.reason === "side_access") continue;

      const direction = faceToCompass(requirement.face, entry.placement.rotation);
      const zone = zoneOutside(entry.footprint, direction, requirement.depthMm);
      const measurement = measureZone({
        room,
        subject: entry,
        direction,
        zone,
        requestedMm: requirement.depthMm,
        blockers: blockersFor(entry, requirement.reason, resolved),
      });

      if (measurement.availableMm >= requirement.depthMm) continue;

      const placementIds = [entry.placement.id];
      if (measurement.limiterPlacementId) placementIds.push(measurement.limiterPlacementId);

      const cause =
        measurement.limiter === "wall"
          ? `the ${direction} wall`
          : (measurement.limiterLabel ?? "something fixed");

      findings.push({
        code: codeFor(requirement.reason),
        severity: severityFor(requirement.reason, measurement.limiter),
        placementIds,
        measuredMm: measurement.availableMm,
        requiredMm: requirement.depthMm,
        message:
          `${describe(entry)} has ${measurement.availableMm}mm clear on its ` +
          `${direction} side but needs ${requirement.depthMm}mm — ${requirement.label}. ` +
          `Blocked by ${cause}.`,
        region: zone,
      });
    }
  }

  return findings;
};
