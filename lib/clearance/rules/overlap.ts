import { isFloorCovering } from "../../domain/product";
import { intersectRect } from "../../geometry/rect";
import { describe, type Rule } from "../context";
import type { Finding } from "../findings";

export const overlapRule: Rule = ({ resolved }) => {
  const findings: Finding[] = [];

  for (let i = 0; i < resolved.length; i += 1) {
    for (let j = i + 1; j < resolved.length; j += 1) {
      const a = resolved[i];
      const b = resolved[j];

      // Rugs lie flat under furniture, so sharing floor area with them is intended.
      if (isFloorCovering(a.product.category) || isFloorCovering(b.product.category)) {
        continue;
      }

      const overlap = intersectRect(a.footprint, b.footprint);
      if (!overlap) continue;

      const encroachment = Math.round(Math.min(overlap.width, overlap.depth));
      findings.push({
        code: "OVERLAP",
        severity: "error",
        placementIds: [a.placement.id, b.placement.id],
        measuredMm: encroachment,
        requiredMm: 0,
        message:
          `${describe(a)} and ${describe(b)} occupy the same floor space, ` +
          `overlapping by ${encroachment}mm.`,
        region: overlap,
      });
    }
  }

  return findings;
};
