import type { Finding, FindingSummary } from "../clearance/findings";
import type { Placement } from "../domain/placement";
import type { Rect } from "../geometry/rect";
import type { Cents } from "../domain/units";

export interface PlacementView {
  id: string;
  productId: string;
  productName: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  footprint: Rect;
  priceCents: Cents;
  priceFormatted: string;
  note?: string;
}

/**
 * Every mutating operation reports the layout consequences of the change, not
 * just that it happened. `introducedFindings` is the delta an agent needs in
 * order to decide whether to undo or adjust what it just did.
 */
export interface MutationResult {
  ok: boolean;
  /** Present when `ok` is false; explains what to send instead. */
  error?: string;
  summary: string;
  placement?: PlacementView;
  placements?: readonly PlacementView[];
  introducedFindings: readonly Finding[];
  allFindings: readonly Finding[];
  findingSummary: FindingSummary;
}

export function failure(error: string, emptySummary: FindingSummary): MutationResult {
  return {
    ok: false,
    error,
    summary: error,
    introducedFindings: [],
    allFindings: [],
    findingSummary: emptySummary,
  };
}

/** Findings present after a change that were not present before it. */
export function findingDelta(
  before: readonly Finding[],
  after: readonly Finding[],
): Finding[] {
  const seen = new Set(before.map(fingerprint));
  return after.filter((finding) => !seen.has(fingerprint(finding)));
}

function fingerprint(finding: Finding): string {
  return [
    finding.code,
    finding.severity,
    [...finding.placementIds].sort().join(","),
    finding.measuredMm ?? "-",
    finding.requiredMm ?? "-",
  ].join("|");
}

export function nextPlacementId(seq: number): string {
  return `pl-${String(seq).padStart(3, "0")}`;
}

export function activityId(seq: number, at: number): string {
  return `act-${at.toString(36)}-${seq}`;
}
