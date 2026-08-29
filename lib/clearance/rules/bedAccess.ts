import type { ResolvedPlacement } from "../../domain/placement";
import { isFloorCovering, type Product } from "../../domain/product";
import { faceToCompass, zoneOutside } from "../../geometry/rotation";
import { describe, type Rule } from "../context";
import type { Finding } from "../findings";
import { DOUBLE_BED_MIN_WIDTH_MM, mayOccupyClearanceZone } from "../standards";
import { measureZone } from "./measure";

function sideAccessRequirements(product: Product) {
  return product.clearances.filter(
    (requirement) => requirement.reason === "side_access",
  );
}

/**
 * `side_access` requirements list the sides that are candidates for getting in
 * and out of bed, not sides that must all be clear. At least one must be clear
 * for the bed to be usable at all; anything double width or wider should have
 * both clear so two people are not climbing over each other.
 */
export const bedAccessRule: Rule = ({ room, resolved }) => {
  const findings: Finding[] = [];

  for (const entry of resolved) {
    const requirements = sideAccessRequirements(entry.product);
    if (requirements.length === 0) continue;

    const blockers = resolved.filter((candidate) => {
      if (candidate.placement.id === entry.placement.id) return false;
      if (isFloorCovering(candidate.product.category)) return false;
      return !mayOccupyClearanceZone("side_access", candidate.product.category);
    });

    const results = requirements.map((requirement) => {
      const direction = faceToCompass(requirement.face, entry.placement.rotation);
      const zone = zoneOutside(entry.footprint, direction, requirement.depthMm);
      return {
        requirement,
        direction,
        zone,
        measurement: measureZone({
          room,
          subject: entry,
          direction,
          zone,
          requestedMm: requirement.depthMm,
          blockers,
        }),
      };
    });

    const clear = results.filter(
      (result) => result.measurement.availableMm >= result.requirement.depthMm,
    );
    if (clear.length === results.length) continue;

    const best = results.reduce((a, b) =>
      b.measurement.availableMm > a.measurement.availableMm ? b : a,
    );
    const worst = results.reduce((a, b) =>
      b.measurement.availableMm < a.measurement.availableMm ? b : a,
    );

    if (clear.length === 0) {
      const placementIds = [entry.placement.id];
      if (best.measurement.limiterPlacementId) {
        placementIds.push(best.measurement.limiterPlacementId);
      }
      findings.push({
        code: "BED_SIDE_ACCESS_BLOCKED",
        severity: "error",
        placementIds,
        measuredMm: best.measurement.availableMm,
        requiredMm: best.requirement.depthMm,
        message:
          `${describe(entry)} has no usable side access — the best side offers ` +
          `${best.measurement.availableMm}mm against the ${best.requirement.depthMm}mm needed. ` +
          `Leave at least one long side clear to get in and out of bed.`,
        region: best.zone,
      });
      continue;
    }

    const needsBothSides =
      requirements.length > 1 && entry.product.widthMm >= DOUBLE_BED_MIN_WIDTH_MM;
    if (!needsBothSides) continue;

    const placementIds = [entry.placement.id];
    if (worst.measurement.limiterPlacementId) {
      placementIds.push(worst.measurement.limiterPlacementId);
    }
    findings.push({
      code: "BED_SIDE_ACCESS_BLOCKED",
      severity: "warning",
      placementIds,
      measuredMm: worst.measurement.availableMm,
      requiredMm: worst.requirement.depthMm,
      message:
        `${describe(entry)} is only reachable from one side. Its ${worst.direction} side has ` +
        `${worst.measurement.availableMm}mm of the ${worst.requirement.depthMm}mm needed, so ` +
        `whoever sleeps there has to climb across.`,
      region: worst.zone,
    });
  }

  return findings;
};
