"use client";

import type { Finding } from "@/lib/clearance/findings";
import { rectBottom, rectRight } from "@/lib/geometry/rect";
import { DimensionLine } from "./DimensionLine";
import { DASH_VIOLATION, PLAN_COLOURS, type PxToMm } from "./planStyle";

/** Stable identity for a finding within one render, shared with the findings list. */
export function findingKey(finding: Finding, index: number): string {
  return `${finding.code}:${finding.placementIds.join("+")}:${index}`;
}

interface ViolationOverlayProps {
  findings: readonly Finding[];
  px: PxToMm;
  highlightedKey: string | null;
}

/**
 * Violations are drawn on the gap, never on the furniture. Recolouring a sofa
 * red turns a design tool into an error console; annotating the 640mm that
 * should have been 900mm tells you what to actually change.
 */
export function ViolationOverlay({
  findings,
  px,
  highlightedKey,
}: ViolationOverlayProps) {
  return (
    <g pointerEvents="none">
      {findings.map((finding, index) => {
        const region = finding.region;
        if (!region || region.width <= 0 || region.depth <= 0) return null;

        const key = findingKey(finding, index);
        const highlighted = key === highlightedKey;
        const colour =
          finding.severity === "error" ? PLAN_COLOURS.blocking : PLAN_COLOURS.violation;

        return (
          <g key={key}>
            <rect
              x={region.x}
              y={region.y}
              width={region.width}
              height={region.depth}
              fill={PLAN_COLOURS.violationFill}
              fillOpacity={highlighted ? 1 : 0.7}
              stroke={colour}
              strokeWidth={highlighted ? 2.5 : 1.5}
              strokeDasharray={DASH_VIOLATION}
              vectorEffect="non-scaling-stroke"
            />
            <GapDimension finding={finding} colour={colour} px={px} />
          </g>
        );
      })}
    </g>
  );
}

function GapDimension({
  finding,
  colour,
  px,
}: {
  finding: Finding;
  colour: string;
  px: PxToMm;
}) {
  const region = finding.region;
  if (!region) return null;
  if (finding.measuredMm === null || finding.requiredMm === null) return null;
  // Below this the annotation is bigger than the gap it describes.
  if (Math.max(region.width, region.depth) < px(52)) return null;

  const measuresVertically = region.depth <= region.width;

  return measuresVertically ? (
    <DimensionLine
      axis="vertical"
      from={region.y}
      to={rectBottom(region)}
      at={region.x + region.width / 2}
      label={String(finding.measuredMm)}
      subLabel={`min ${finding.requiredMm}`}
      colour={colour}
      dashed
      px={px}
    />
  ) : (
    <DimensionLine
      axis="horizontal"
      from={region.x}
      to={rectRight(region)}
      at={region.y + region.depth / 2}
      label={String(finding.measuredMm)}
      subLabel={`min ${finding.requiredMm}`}
      colour={colour}
      dashed
      px={px}
    />
  );
}
