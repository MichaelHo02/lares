"use client";

import { PLAN_COLOURS, PLAN_TYPE, type PxToMm } from "./planStyle";

export type DimensionAxis = "horizontal" | "vertical";

interface DimensionLineProps {
  axis: DimensionAxis;
  /** Start and end of the measured span, along `axis`. */
  from: number;
  to: number;
  /** Position on the perpendicular axis where the dimension line is drawn. */
  at: number;
  label: string;
  /** Second line of text, e.g. the required minimum on a violation. */
  subLabel?: string;
  colour?: string;
  dashed?: boolean;
  px: PxToMm;
  /** Extension lines run back to the measured object from these positions. */
  extendFrom?: number;
}

/**
 * A draughtsman's dimension: extension lines, a run with 45-degree tick marks
 * rather than arrowheads, and a haloed label. Ticks read as drafting; arrows
 * read as a diagram.
 */
export function DimensionLine({
  axis,
  from,
  to,
  at,
  label,
  subLabel,
  colour = PLAN_COLOURS.dimension,
  dashed = false,
  px,
  extendFrom,
}: DimensionLineProps) {
  const horizontal = axis === "horizontal";
  const tick = px(6);
  const gap = px(6);
  const overrun = px(3);
  const fontSize = px(PLAN_TYPE.dimensionPx);
  const mid = (from + to) / 2;

  const point = (along: number, across: number) =>
    horizontal ? { x: along, y: across } : { x: across, y: along };

  const lineStart = point(from, at);
  const lineEnd = point(to, at);

  const stroke = {
    stroke: colour,
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const,
    ...(dashed ? { strokeDasharray: "6 4" } : {}),
  };

  const extensions =
    extendFrom === undefined
      ? null
      : [from, to].map((along, index) => {
          const towards = at > extendFrom ? 1 : -1;
          const start = point(along, extendFrom + towards * gap);
          const end = point(along, at + towards * overrun);
          return (
            <line
              key={index}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={colour}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        });

  return (
    <g pointerEvents="none">
      {extensions}

      <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} {...stroke} />

      {[from, to].map((along, index) => {
        const a = point(along - tick / 2, at + tick / 2);
        const b = point(along + tick / 2, at - tick / 2);
        return (
          <line
            key={index}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={colour}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      <DimensionLabel
        horizontal={horizontal}
        mid={mid}
        at={at}
        label={label}
        subLabel={subLabel}
        colour={colour}
        fontSize={fontSize}
        px={px}
      />
    </g>
  );
}

function DimensionLabel({
  horizontal,
  mid,
  at,
  label,
  subLabel,
  colour,
  fontSize,
  px,
}: {
  horizontal: boolean;
  mid: number;
  at: number;
  label: string;
  subLabel?: string;
  colour: string;
  fontSize: number;
  px: PxToMm;
}) {
  const x = horizontal ? mid : at;
  const y = horizontal ? at : mid;
  // Vertical dimensions rotate a quarter turn, never far enough to read upside-down.
  const transform = horizontal ? undefined : `rotate(-90 ${x} ${y})`;

  return (
    <g transform={transform}>
      <text
        x={x}
        y={y - px(5)}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill={colour}
        stroke={PLAN_COLOURS.paper}
        strokeWidth={px(3)}
        paintOrder="stroke"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {label}
      </text>
      {subLabel ? (
        <text
          x={x}
          y={y + fontSize}
          textAnchor="middle"
          fontSize={fontSize * 0.92}
          fill={colour}
          stroke={PLAN_COLOURS.paper}
          strokeWidth={px(3)}
          paintOrder="stroke"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {subLabel}
        </text>
      ) : null}
    </g>
  );
}
