import { checkLayout } from "../clearance/checkLayout";
import type { Finding } from "../clearance/findings";
import { summariseFindings } from "../clearance/findings";
import {
  placementFootprint,
  resolvePlacement,
  type Placement,
} from "../domain/placement";
import { CATEGORY_LABELS, findProduct, type Catalog } from "../domain/product";
import { formatAud } from "../domain/units";
import type { PlacementView } from "./results";
import type { PlannerState } from "./types";

export function toPlacementView(
  placement: Placement,
  catalog: Catalog,
): PlacementView | null {
  const resolved = resolvePlacement(placement, catalog);
  if (!resolved) return null;
  const { product } = resolved;
  return {
    id: placement.id,
    productId: product.id,
    productName: product.name,
    category: CATEGORY_LABELS[product.category],
    x: placement.x,
    y: placement.y,
    rotation: placement.rotation,
    footprint: placementFootprint(placement, product),
    priceCents: product.priceCents,
    priceFormatted: formatAud(product.priceCents),
    ...(placement.note === undefined ? {} : { note: placement.note }),
  };
}

export function placementViews(state: PlannerState): PlacementView[] {
  const views: PlacementView[] = [];
  for (const placement of state.placements) {
    const view = toPlacementView(placement, state.catalog);
    if (view) views.push(view);
  }
  return views;
}

export function findingsFor(state: PlannerState): readonly Finding[] {
  if (!state.room) return [];
  return checkLayout(state.room, state.placements, state.catalog).findings;
}

export function findingsForLayout(
  state: PlannerState,
  placements: readonly Placement[],
): readonly Finding[] {
  if (!state.room) return [];
  return checkLayout(state.room, placements, state.catalog).findings;
}

export const EMPTY_FINDING_SUMMARY = summariseFindings([]);

export function productExists(state: PlannerState, productId: string): boolean {
  return findProduct(state.catalog, productId) !== undefined;
}

export function findPlacement(
  state: PlannerState,
  placementId: string,
): Placement | undefined {
  return state.placements.find((placement) => placement.id === placementId);
}
