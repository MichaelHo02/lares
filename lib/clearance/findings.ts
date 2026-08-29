import type { Rect } from "../geometry/rect";
import type { Mm } from "../domain/units";

export const FINDING_CODES = [
  "OUTSIDE_ROOM",
  "OVERLAP",
  "OBSTRUCTION_CONFLICT",
  "WALKWAY_TOO_NARROW",
  "DOOR_SWING_BLOCKED",
  "CHAIR_PULLOUT_INSUFFICIENT",
  "CLEARANCE_ZONE_BLOCKED",
  "BED_SIDE_ACCESS_BLOCKED",
  "WONT_FIT_THROUGH_DOOR",
  "UNKNOWN_PRODUCT",
] as const;

export type FindingCode = (typeof FINDING_CODES)[number];

export const SEVERITIES = ["error", "warning"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface Finding {
  code: FindingCode;
  severity: Severity;
  /** Every placement implicated, so an agent knows all its options for a fix. */
  placementIds: readonly string[];
  /** What the layout actually achieves, in millimetres. */
  measuredMm: Mm | null;
  /** What the standard demands, in millimetres. */
  requiredMm: Mm | null;
  message: string;
  /** Region to shade on the floor plan, when the finding has a location. */
  region?: Rect;
}

export const FINDING_CODE_TITLES: Record<FindingCode, string> = {
  OUTSIDE_ROOM: "Outside the room",
  OVERLAP: "Furniture overlaps",
  OBSTRUCTION_CONFLICT: "Blocked by a fixed obstruction",
  WALKWAY_TOO_NARROW: "Walkway too narrow",
  DOOR_SWING_BLOCKED: "Door swing blocked",
  CHAIR_PULLOUT_INSUFFICIENT: "Not enough room to pull a chair out",
  CLEARANCE_ZONE_BLOCKED: "Clearance zone blocked",
  BED_SIDE_ACCESS_BLOCKED: "Bed side access blocked",
  WONT_FIT_THROUGH_DOOR: "Will not fit through the door",
  UNKNOWN_PRODUCT: "Unknown product",
};

export function isErrorFinding(finding: Finding): boolean {
  return finding.severity === "error";
}

export function sortFindings(findings: readonly Finding[]): Finding[] {
  const severityRank: Record<Severity, number> = { error: 0, warning: 1 };
  return [...findings].sort((a, b) => {
    const bySeverity = severityRank[a.severity] - severityRank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.code.localeCompare(b.code);
  });
}

export interface FindingSummary {
  total: number;
  errors: number;
  warnings: number;
  byCode: Partial<Record<FindingCode, number>>;
  /** True when the layout has no errors; warnings are acceptable. */
  passes: boolean;
}

export function summariseFindings(findings: readonly Finding[]): FindingSummary {
  const byCode: Partial<Record<FindingCode, number>> = {};
  let errors = 0;
  let warnings = 0;

  for (const finding of findings) {
    byCode[finding.code] = (byCode[finding.code] ?? 0) + 1;
    switch (finding.severity) {
      case "error":
        errors += 1;
        break;
      case "warning":
        warnings += 1;
        break;
      default: {
        const exhaustive: never = finding.severity;
        throw new Error(`unhandled severity: ${String(exhaustive)}`);
      }
    }
  }

  return { total: findings.length, errors, warnings, byCode, passes: errors === 0 };
}
