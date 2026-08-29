import type { Room } from "../domain/room";
import type { Mm } from "../domain/units";
import type { Point, Rect } from "../geometry/rect";

/** Room-space padding around the walls, leaving space for dimension lines. */
export const PLAN_MARGIN_MM: Mm = 900;

export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 6;

export interface ViewTransform {
  zoom: number;
  /** Pan offset of the view centre, in room millimetres. */
  panX: Mm;
  panY: Mm;
}

export const IDENTITY_VIEW: ViewTransform = { zoom: 1, panX: 0, panY: 0 };

export interface ViewBox extends Rect {
  value: string;
}

function baseBox(room: Room): Rect {
  return {
    x: -PLAN_MARGIN_MM,
    y: -PLAN_MARGIN_MM,
    width: room.widthMm + PLAN_MARGIN_MM * 2,
    depth: room.depthMm + PLAN_MARGIN_MM * 2,
  };
}

/**
 * The SVG's user coordinate system is room millimetres, so the viewBox alone
 * does all scaling. Nothing in the drawing has to be recomputed when the
 * viewport changes size — which is what keeps this usable in a narrow in-app
 * browser as well as on a desktop.
 */
export function computeViewBox(room: Room, transform: ViewTransform): ViewBox {
  const base = baseBox(room);
  const width = base.width / transform.zoom;
  const depth = base.depth / transform.zoom;
  const centreX = base.x + base.width / 2 + transform.panX;
  const centreY = base.y + base.depth / 2 + transform.panY;
  const x = centreX - width / 2;
  const y = centreY - depth / 2;

  return { x, y, width, depth, value: `${x} ${y} ${width} ${depth}` };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Room millimetres covered by one device pixel. Anything the design spec sizes
 * in pixels — line weights, corner radii, type — is multiplied by this so it
 * stays visually constant at every zoom level and room size.
 */
export function mmPerPixel(viewBox: Rect, elementWidth: number, elementHeight: number): Mm {
  if (elementWidth <= 0 || elementHeight <= 0) return viewBox.width / 800;
  // preserveAspectRatio="xMidYMid meet" scales by whichever axis is tighter.
  const pixelsPerMm = Math.min(
    elementWidth / viewBox.width,
    elementHeight / viewBox.depth,
  );
  return pixelsPerMm > 0 ? 1 / pixelsPerMm : viewBox.width / 800;
}

/** Converts a pointer position in client pixels to room millimetres. */
export function clientToRoom(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): Point | null {
  const rect = svg.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  const viewBox = svg.viewBox.baseVal;
  const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
  if (!Number.isFinite(scale) || scale <= 0) return null;

  // Back out the letterboxing introduced by the meet fit.
  const offsetX = (rect.width - viewBox.width * scale) / 2;
  const offsetY = (rect.height - viewBox.height * scale) / 2;

  return {
    x: viewBox.x + (clientX - rect.left - offsetX) / scale,
    y: viewBox.y + (clientY - rect.top - offsetY) / scale,
  };
}

export const SNAP_MM: Mm = 10;
/** Within this distance of a wall, an item is pulled flush against it. */
export const WALL_SNAP_MM: Mm = 80;

export function snapToGrid(value: number): Mm {
  return Math.round(value / SNAP_MM) * SNAP_MM;
}

/**
 * Snaps a dragged footprint to the grid, then flush to any wall it is close to.
 * Furniture is nearly always pushed against a wall, so making that the easy
 * outcome removes most of the nudging a mouse would otherwise require.
 */
export function snapFootprint(
  x: Mm,
  y: Mm,
  width: Mm,
  depth: Mm,
  room: Room,
): Point {
  let snappedX = snapToGrid(x);
  let snappedY = snapToGrid(y);

  if (Math.abs(snappedX) <= WALL_SNAP_MM) snappedX = 0;
  else if (Math.abs(room.widthMm - (snappedX + width)) <= WALL_SNAP_MM) {
    snappedX = room.widthMm - width;
  }

  if (Math.abs(snappedY) <= WALL_SNAP_MM) snappedY = 0;
  else if (Math.abs(room.depthMm - (snappedY + depth)) <= WALL_SNAP_MM) {
    snappedY = room.depthMm - depth;
  }

  return { x: snappedX, y: snappedY };
}
