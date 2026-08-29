import { resolveLayout, type Placement } from "../domain/placement";
import type { Catalog } from "../domain/product";
import type { Room } from "../domain/room";
import type { Rule, RuleContext } from "./context";
import {
  sortFindings,
  summariseFindings,
  type Finding,
  type FindingSummary,
} from "./findings";
import { bedAccessRule } from "./rules/bedAccess";
import { obstructionRule, outsideRoomRule } from "./rules/bounds";
import { clearanceZoneRule } from "./rules/clearanceZones";
import { doorSwingRule } from "./rules/doorSwing";
import { fitThroughDoorRule } from "./rules/fitThroughDoor";
import { overlapRule } from "./rules/overlap";
import { walkwayRule } from "./rules/walkway";

const RULES: readonly Rule[] = [
  outsideRoomRule,
  obstructionRule,
  overlapRule,
  fitThroughDoorRule,
  doorSwingRule,
  clearanceZoneRule,
  bedAccessRule,
  walkwayRule,
];

export interface LayoutCheck {
  findings: readonly Finding[];
  summary: FindingSummary;
}

export function checkLayout(
  room: Room,
  placements: readonly Placement[],
  catalog: Catalog,
): LayoutCheck {
  const { resolved, unresolved } = resolveLayout(placements, catalog);
  const context: RuleContext = { room, resolved };

  const findings: Finding[] = unresolved.map((placement) => ({
    code: "UNKNOWN_PRODUCT",
    severity: "error",
    placementIds: [placement.id],
    measuredMm: null,
    requiredMm: null,
    message:
      `Placement ${placement.id} refers to product "${placement.productId}", which is ` +
      `not in the catalog. Remove it or swap it for a catalogued product.`,
  }));

  for (const rule of RULES) {
    findings.push(...rule(context));
  }

  const sorted = sortFindings(findings);
  return { findings: sorted, summary: summariseFindings(sorted) };
}

/** Findings that mention a given placement, used for per-item feedback in tool results. */
export function findingsForPlacement(
  findings: readonly Finding[],
  placementId: string,
): Finding[] {
  return findings.filter((finding) => finding.placementIds.includes(placementId));
}
