"use client";

import {
  obstructionRect,
  openingSegment,
  type Opening,
  type Room,
} from "@/lib/domain/room";
import { doorSwingGeometry, type DoorSwingGeometry } from "@/lib/geometry/doorSwing";
import { DimensionLine } from "./DimensionLine";
import { PLAN_COLOURS, PLAN_WEIGHTS, type PxToMm } from "./planStyle";

interface RoomShellProps {
  room: Room;
  px: PxToMm;
}

/** Walls are drawn as a filled band so they read as mass rather than as a stroke. */
function Walls({ room, px }: RoomShellProps) {
  const thickness = px(PLAN_WEIGHTS.exteriorWall);
  const outer = `M ${-thickness} ${-thickness} H ${room.widthMm + thickness} V ${
    room.depthMm + thickness
  } H ${-thickness} Z`;
  const inner = `M 0 0 H ${room.widthMm} V ${room.depthMm} H 0 Z`;

  return <path d={`${outer} ${inner}`} fillRule="evenodd" fill={PLAN_COLOURS.wall} />;
}

function DoorLeaf({ swing, px }: { swing: DoorSwingGeometry; px: PxToMm }) {
  const { hinge, radiusMm, along, sweep, tip } = swing;
  const alongTip = {
    x: hinge.x + along.x * radiusMm,
    y: hinge.y + along.y * radiusMm,
  };
  // SVG sweep flag: 1 when turning from `along` to `sweep` is clockwise.
  const clockwise = along.x * sweep.y - along.y * sweep.x > 0 ? 1 : 0;

  return (
    <g>
      <path
        d={`M ${alongTip.x} ${alongTip.y} A ${radiusMm} ${radiusMm} 0 0 ${clockwise} ${tip.x} ${tip.y}`}
        fill="none"
        stroke={PLAN_COLOURS.dimension}
        strokeWidth={PLAN_WEIGHTS.hairline}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={hinge.x}
        y1={hinge.y}
        x2={tip.x}
        y2={tip.y}
        stroke={PLAN_COLOURS.wall}
        strokeWidth={PLAN_WEIGHTS.leaf}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={hinge.x} cy={hinge.y} r={px(2)} fill={PLAN_COLOURS.wall} />
    </g>
  );
}

function OpeningMark({
  room,
  opening,
  px,
}: RoomShellProps & { opening: Opening }) {
  const segment = openingSegment(room, opening);
  if (!segment) return null;

  const thickness = px(PLAN_WEIGHTS.exteriorWall);
  const swing = doorSwingGeometry(room, opening);
  const { start, end } = segment;
  const along = {
    x: (end.x - start.x) / opening.widthMm,
    y: (end.y - start.y) / opening.widthMm,
  };
  // Perpendicular to the wall run, used to spread the window's triple lines.
  const normal = { x: -along.y, y: along.x };

  const offsetLine = (distance: number, key: string) => (
    <line
      key={key}
      x1={start.x + normal.x * distance}
      y1={start.y + normal.y * distance}
      x2={end.x + normal.x * distance}
      y2={end.y + normal.y * distance}
      stroke={PLAN_COLOURS.wall}
      strokeWidth={PLAN_WEIGHTS.hairline}
      vectorEffect="non-scaling-stroke"
    />
  );

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={PLAN_COLOURS.paper}
        strokeWidth={thickness * 2.4}
        strokeLinecap="butt"
      />
      {opening.type === "window"
        ? [
            offsetLine(-thickness * 0.55, "outer"),
            offsetLine(0, "centre"),
            offsetLine(thickness * 0.55, "inner"),
          ]
        : null}
      {swing ? <DoorLeaf swing={swing} px={px} /> : null}
      <title>
        {opening.type === "door"
          ? `${opening.widthMm}mm door on the ${opening.wall} wall`
          : `${opening.widthMm}mm window on the ${opening.wall} wall`}
      </title>
    </g>
  );
}

export function RoomShell({ room, px }: RoomShellProps) {
  const dimensionOffset = px(34);

  return (
    <g>
      {room.obstructions.map((obstruction) => {
        const rect = obstructionRect(obstruction);
        return (
          <g key={obstruction.id}>
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.depth}
              fill="url(#obstruction-hatch)"
              stroke={PLAN_COLOURS.wall}
              strokeWidth={PLAN_WEIGHTS.leaf}
              vectorEffect="non-scaling-stroke"
            />
            <title>{`${obstruction.label} (${obstruction.kind})`}</title>
          </g>
        );
      })}

      <Walls room={room} px={px} />

      {room.openings.map((opening) => (
        <OpeningMark key={opening.id} room={room} opening={opening} px={px} />
      ))}

      <DimensionLine
        axis="horizontal"
        from={0}
        to={room.widthMm}
        at={-dimensionOffset}
        extendFrom={0}
        label={String(room.widthMm)}
        px={px}
      />
      <DimensionLine
        axis="vertical"
        from={0}
        to={room.depthMm}
        at={-dimensionOffset}
        extendFrom={0}
        label={String(room.depthMm)}
        px={px}
      />
    </g>
  );
}
