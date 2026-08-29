"use client";

import type { ProductCategory } from "@/lib/domain/product";
import type { Rect } from "@/lib/geometry/rect";
import type { Compass } from "@/lib/geometry/rotation";
import { PLAN_COLOURS } from "./planStyle";

interface GlyphProps {
  category: ProductCategory;
  footprint: Rect;
  /** Compass direction the product's front faces. */
  front: Compass;
}

const LINE = {
  stroke: PLAN_COLOURS.footprintStroke,
  strokeWidth: 1,
  fill: "none",
  vectorEffect: "non-scaling-stroke" as const,
};

/**
 * A schematic hint at what the footprint is, drawn in plan the way a set of
 * drawings would: seat divisions on a sofa, a mattress fold on a bed, hatching
 * on a rug. Never photography, never an icon set.
 */
export function FurnitureGlyph({ category, footprint, front }: GlyphProps) {
  const { x, y, width, depth } = footprint;
  const inset = Math.min(width, depth) * 0.16;

  switch (category) {
    case "sofa":
    case "armchair":
      return <SeatBack rect={footprint} front={front} inset={inset} />;

    case "bed":
      return (
        <>
          <BackBand rect={footprint} front={front} fraction={0.16} />
          <line
            {...LINE}
            x1={x + width * 0.5}
            y1={y + depth * 0.35}
            x2={x + width * 0.5}
            y2={y + depth}
          />
        </>
      );

    case "dining_table":
    case "coffee_table":
    case "desk":
      return (
        <rect
          {...LINE}
          x={x + inset}
          y={y + inset}
          width={Math.max(0, width - inset * 2)}
          height={Math.max(0, depth - inset * 2)}
        />
      );

    case "dining_chair":
    case "office_chair":
      return <SeatBack rect={footprint} front={front} inset={inset} />;

    case "wardrobe":
    case "sideboard":
    case "tv_unit":
    case "bookshelf":
    case "bedside_table":
      return <Shelves rect={footprint} front={front} />;

    case "rug":
      return (
        <rect
          {...LINE}
          x={x + inset}
          y={y + inset}
          width={Math.max(0, width - inset * 2)}
          height={Math.max(0, depth - inset * 2)}
          strokeDasharray="5 5"
        />
      );

    case "floor_lamp":
      return (
        <circle
          {...LINE}
          cx={x + width / 2}
          cy={y + depth / 2}
          r={Math.min(width, depth) * 0.28}
        />
      );

    default: {
      const exhaustive: never = category;
      throw new Error(`unhandled category: ${String(exhaustive)}`);
    }
  }
}

/** The band along a product's back face, used for seat backs and headboards. */
function bandRect(rect: Rect, front: Compass, fraction: number): Rect {
  const { x, y, width, depth } = rect;
  switch (front) {
    case "south":
      return { x, y, width, depth: depth * fraction };
    case "north":
      return { x, y: y + depth * (1 - fraction), width, depth: depth * fraction };
    case "east":
      return { x, y, width: width * fraction, depth };
    case "west":
      return { x: x + width * (1 - fraction), y, width: width * fraction, depth };
    default: {
      const exhaustive: never = front;
      throw new Error(`unhandled direction: ${String(exhaustive)}`);
    }
  }
}

function BackBand({
  rect,
  front,
  fraction,
}: {
  rect: Rect;
  front: Compass;
  fraction: number;
}) {
  const band = bandRect(rect, front, fraction);
  return (
    <rect {...LINE} x={band.x} y={band.y} width={band.width} height={band.depth} />
  );
}

function SeatBack({
  rect,
  front,
  inset,
}: {
  rect: Rect;
  front: Compass;
  inset: number;
}) {
  const band = bandRect(rect, front, 0.28);
  const acrossIsX = front === "south" || front === "north";
  const seatSpan = acrossIsX ? rect.width : rect.depth;
  const cushions = Math.max(1, Math.min(3, Math.round(seatSpan / 700)));

  return (
    <>
      <rect {...LINE} x={band.x} y={band.y} width={band.width} height={band.depth} />
      {Array.from({ length: cushions - 1 }, (_, index) => {
        const t = (index + 1) / cushions;
        return acrossIsX ? (
          <line
            {...LINE}
            key={index}
            x1={rect.x + rect.width * t}
            y1={rect.y + inset}
            x2={rect.x + rect.width * t}
            y2={rect.y + rect.depth - inset}
          />
        ) : (
          <line
            {...LINE}
            key={index}
            x1={rect.x + inset}
            y1={rect.y + rect.depth * t}
            x2={rect.x + rect.width - inset}
            y2={rect.y + rect.depth * t}
          />
        );
      })}
    </>
  );
}

/** A single line just inside the front face, reading as a door or shelf edge. */
function Shelves({ rect, front }: { rect: Rect; front: Compass }) {
  const band = bandRect(rect, front, 0.82);
  const vertical = front === "south" || front === "north";
  return vertical ? (
    <line
      {...LINE}
      x1={band.x}
      y1={front === "south" ? band.y + band.depth : band.y}
      x2={band.x + band.width}
      y2={front === "south" ? band.y + band.depth : band.y}
    />
  ) : (
    <line
      {...LINE}
      x1={front === "east" ? band.x + band.width : band.x}
      y1={band.y}
      x2={front === "east" ? band.x + band.width : band.x}
      y2={band.y + band.depth}
    />
  );
}
