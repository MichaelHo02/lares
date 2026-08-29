import type { Mm } from "../domain/units";

/**
 * Room-space coordinates. Origin is the room's north-west corner, `x` increases
 * east, `y` increases south. This matches SVG's y-down convention so the canvas
 * needs no axis flip.
 */
export interface Point {
  x: Mm;
  y: Mm;
}

export interface Rect {
  x: Mm;
  y: Mm;
  width: Mm;
  depth: Mm;
}

export function rectRight(rect: Rect): Mm {
  return rect.x + rect.width;
}

export function rectBottom(rect: Rect): Mm {
  return rect.y + rect.depth;
}

export function rectArea(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.depth);
}

export function rectCentre(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.depth / 2 };
}

/** Overlap of open interiors: rectangles that merely share an edge do not overlap. */
export function intersectRect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(rectRight(a), rectRight(b));
  const bottom = Math.min(rectBottom(a), rectBottom(b));
  if (right <= x || bottom <= y) return null;
  return { x, y, width: right - x, depth: bottom - y };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return intersectRect(a, b) !== null;
}

export function containsRect(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    rectRight(inner) <= rectRight(outer) &&
    rectBottom(inner) <= rectBottom(outer)
  );
}

export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rectRight(rect) &&
    point.y >= rect.y &&
    point.y <= rectBottom(rect)
  );
}

export function inflateRect(rect: Rect, by: Mm): Rect {
  return {
    x: rect.x - by,
    y: rect.y - by,
    width: rect.width + by * 2,
    depth: rect.depth + by * 2,
  };
}

/** Shortest distance from a point to a rectangle; zero when the point is inside. */
export function distancePointToRect(point: Point, rect: Rect): Mm {
  const dx = Math.max(rect.x - point.x, 0, point.x - rectRight(rect));
  const dy = Math.max(rect.y - point.y, 0, point.y - rectBottom(rect));
  return Math.hypot(dx, dy);
}

/**
 * Distance between two rectangles measured along a single axis, but only when
 * their projections on the other axis overlap. `null` means the pair does not
 * face each other and so no walkway exists between them.
 */
export function facingGap(a: Rect, b: Rect): { gap: Mm; axis: "x" | "y" } | null {
  const xOverlap = Math.min(rectRight(a), rectRight(b)) - Math.max(a.x, b.x);
  const yOverlap = Math.min(rectBottom(a), rectBottom(b)) - Math.max(a.y, b.y);

  if (xOverlap > 0 && yOverlap <= 0) {
    return { gap: -yOverlap, axis: "y" };
  }
  if (yOverlap > 0 && xOverlap <= 0) {
    return { gap: -xOverlap, axis: "x" };
  }
  return null;
}
