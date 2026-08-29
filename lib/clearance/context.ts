import type { ResolvedPlacement } from "../domain/placement";
import type { Room } from "../domain/room";
import { formatMetres } from "../domain/units";
import type { Finding } from "./findings";

export interface RuleContext {
  room: Room;
  resolved: readonly ResolvedPlacement[];
}

export type Rule = (context: RuleContext) => Finding[];

export function describe(entry: ResolvedPlacement): string {
  return entry.product.name;
}

export function describeSize(entry: ResolvedPlacement): string {
  return `${formatMetres(entry.footprint.width)} × ${formatMetres(entry.footprint.depth)}`;
}
