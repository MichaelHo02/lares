"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import type { ResolvedPlacement } from "@/lib/domain/placement";
import { faceToCompass } from "@/lib/geometry/rotation";
import { FurnitureGlyph } from "./FurnitureGlyph";
import { PLAN_COLOURS, PLAN_TYPE, PLAN_WEIGHTS, type PxToMm } from "./planStyle";

interface FurnitureItemProps {
  entry: ResolvedPlacement;
  px: PxToMm;
  selected: boolean;
  dragging: boolean;
  onPointerDown: (event: ReactPointerEvent<SVGGElement>, placementId: string) => void;
}

export function FurnitureItem({
  entry,
  px,
  selected,
  dragging,
  onPointerDown,
}: FurnitureItemProps) {
  const { footprint, product, placement } = entry;
  const front = faceToCompass("front", placement.rotation);
  const labelSize = px(PLAN_TYPE.labelPx);
  const captionSize = px(PLAN_TYPE.captionPx);

  const labelFits =
    footprint.width > labelSize * product.name.length * 0.58 &&
    footprint.depth > labelSize * 2.6;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${product.name}, ${footprint.width} by ${footprint.depth} millimetres, rotated ${placement.rotation} degrees${
        selected ? ", selected" : ""
      }`}
      aria-pressed={selected}
      data-placement-id={placement.id}
      className="cursor-grab focus-visible:outline-none"
      opacity={dragging ? 0.6 : 1}
      onPointerDown={(event) => onPointerDown(event, placement.id)}
    >
      <rect
        x={footprint.x}
        y={footprint.y}
        width={footprint.width}
        height={footprint.depth}
        rx={px(2)}
        fill={PLAN_COLOURS.footprintFill}
        stroke={selected ? PLAN_COLOURS.selection : PLAN_COLOURS.footprintStroke}
        strokeWidth={selected ? 2 : PLAN_WEIGHTS.leaf}
        vectorEffect="non-scaling-stroke"
      />

      <FurnitureGlyph
        category={product.category}
        footprint={footprint}
        front={front}
      />

      {labelFits ? (
        <g pointerEvents="none" textAnchor="middle">
          <text
            x={footprint.x + footprint.width / 2}
            y={footprint.y + footprint.depth / 2}
            fontSize={labelSize}
            fontWeight={700}
            fill={PLAN_COLOURS.dimensionText}
          >
            {product.name}
          </text>
          <text
            x={footprint.x + footprint.width / 2}
            y={footprint.y + footprint.depth / 2 + captionSize * 1.45}
            fontSize={captionSize}
            fill={PLAN_COLOURS.dimension}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {footprint.width} × {footprint.depth}
          </text>
        </g>
      ) : null}

      {selected ? <SelectionHandles footprint={footprint} px={px} /> : null}

      <title>{`${product.name} — ${footprint.width} × ${footprint.depth}mm at ${placement.rotation}°`}</title>
    </g>
  );
}

/** Corner handles sit inside the footprint, so selecting never shifts layout. */
function SelectionHandles({
  footprint,
  px,
}: {
  footprint: { x: number; y: number; width: number; depth: number };
  px: PxToMm;
}) {
  const size = px(4);
  const corners = [
    { x: footprint.x, y: footprint.y },
    { x: footprint.x + footprint.width, y: footprint.y },
    { x: footprint.x, y: footprint.y + footprint.depth },
    { x: footprint.x + footprint.width, y: footprint.y + footprint.depth },
  ];

  return (
    <g pointerEvents="none">
      {corners.map((corner, index) => (
        <rect
          key={index}
          x={corner.x - size}
          y={corner.y - size}
          width={size * 2}
          height={size * 2}
          rx={px(1)}
          fill={PLAN_COLOURS.selection}
        />
      ))}
    </g>
  );
}
