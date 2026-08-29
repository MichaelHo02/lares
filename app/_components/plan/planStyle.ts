/**
 * Canvas palette and line weights from docs/design.md section 7. These resolve
 * the --color-canvas-* custom properties from the token layer, because SVG
 * paint attributes take CSS variables but not Tailwind utility classes.
 */
export const PLAN_COLOURS = {
  paper: "var(--color-canvas-bg)",
  gridMinor: "var(--color-canvas-grid)",
  gridMajor: "var(--color-canvas-grid-major)",
  wall: "var(--color-canvas-wall)",
  dimension: "var(--color-canvas-dim)",
  dimensionText: "var(--color-ink-2)",
  footprintFill: "var(--color-footprint-fill)",
  footprintStroke: "var(--color-footprint-stroke)",
  selection: "var(--color-footprint-selected)",
  violation: "var(--color-clearance-stroke)",
  violationFill: "var(--color-clearance-fill)",
  blocking: "var(--color-negative)",
  hairline: "var(--color-hairline)",
} as const;

/** Four line weights, in device pixels. The hierarchy is the whole game. */
export const PLAN_WEIGHTS = {
  exteriorWall: 6,
  partition: 4,
  leaf: 1.5,
  hairline: 1,
} as const;

export const PLAN_TYPE = {
  labelPx: 12,
  dimensionPx: 12,
  captionPx: 11,
} as const;

export const GRID_MINOR_MM = 100;
export const GRID_MAJOR_MM = 1000;
/** Below this on-screen spacing the minor grid becomes noise and is dropped. */
export const GRID_MINOR_MIN_PX = 5;

export const DASH_VIOLATION = "6 4";

/** Scales a design-spec pixel value into room millimetres for the current view. */
export type PxToMm = (px: number) => number;

export function makePxToMm(mmPerPx: number): PxToMm {
  return (px: number) => px * mmPerPx;
}
