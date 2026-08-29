"use client";

import type { Room } from "@/lib/domain/room";
import {
  GRID_MAJOR_MM,
  GRID_MINOR_MIN_PX,
  GRID_MINOR_MM,
  PLAN_COLOURS,
} from "./planStyle";

interface PlanGridProps {
  room: Room;
  mmPerPx: number;
}

function ticks(extent: number, step: number): number[] {
  const values: number[] = [];
  for (let value = step; value < extent; value += step) values.push(value);
  return values;
}

/**
 * Grid lines are drawn individually rather than as a pattern so they can carry
 * `vectorEffect="non-scaling-stroke"` and stay one device pixel wide at every
 * zoom level, as the spec requires.
 */
export function PlanGrid({ room, mmPerPx }: PlanGridProps) {
  const minorSpacingPx = GRID_MINOR_MM / mmPerPx;
  const showMinor = minorSpacingPx >= GRID_MINOR_MIN_PX;

  const line = (key: string, colour: string, coords: [number, number, number, number]) => (
    <line
      key={key}
      x1={coords[0]}
      y1={coords[1]}
      x2={coords[2]}
      y2={coords[3]}
      stroke={colour}
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
    />
  );

  return (
    <g pointerEvents="none">
      <rect
        x={0}
        y={0}
        width={room.widthMm}
        height={room.depthMm}
        fill={PLAN_COLOURS.paper}
      />

      {showMinor ? (
        <g opacity={Math.min(1, (minorSpacingPx - GRID_MINOR_MIN_PX) / 4 + 0.35)}>
          {ticks(room.widthMm, GRID_MINOR_MM).map((x) =>
            x % GRID_MAJOR_MM === 0
              ? null
              : line(`vn-${x}`, PLAN_COLOURS.gridMinor, [x, 0, x, room.depthMm]),
          )}
          {ticks(room.depthMm, GRID_MINOR_MM).map((y) =>
            y % GRID_MAJOR_MM === 0
              ? null
              : line(`hn-${y}`, PLAN_COLOURS.gridMinor, [0, y, room.widthMm, y]),
          )}
        </g>
      ) : null}

      {ticks(room.widthMm, GRID_MAJOR_MM).map((x) =>
        line(`vm-${x}`, PLAN_COLOURS.gridMajor, [x, 0, x, room.depthMm]),
      )}
      {ticks(room.depthMm, GRID_MAJOR_MM).map((y) =>
        line(`hm-${y}`, PLAN_COLOURS.gridMajor, [0, y, room.widthMm, y]),
      )}
    </g>
  );
}
