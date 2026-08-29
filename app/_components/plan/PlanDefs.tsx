"use client";

import { PLAN_COLOURS } from "./planStyle";

/** Pattern units are room millimetres, matching the plan's coordinate system. */
export function PlanDefs() {
  return (
    <defs>
      <pattern
        id="obstruction-hatch"
        width={120}
        height={120}
        patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse"
      >
        <rect width={120} height={120} fill={PLAN_COLOURS.hairline} />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={120}
          stroke={PLAN_COLOURS.wall}
          strokeWidth={18}
          strokeOpacity={0.5}
        />
      </pattern>
    </defs>
  );
}
