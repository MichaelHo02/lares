import type { Mm } from "@/lib/domain/units";

/** Millimetres → Three.js metres. Keeps room-scale numbers sane for the camera. */
export const MM_TO_M = 0.001;

export function mmToM(mm: Mm): number {
  return mm * MM_TO_M;
}

/** Default ceiling height until rooms carry an explicit height field. */
export const DEFAULT_WALL_HEIGHT_MM = 2700 as Mm;
