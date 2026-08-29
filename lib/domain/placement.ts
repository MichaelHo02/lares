import { footprintFor, type Rotation } from "../geometry/rotation";
import type { Rect } from "../geometry/rect";
import type { Catalog, Product } from "./product";
import { findProduct } from "./product";
import type { Mm } from "./units";

export interface Placement {
  id: string;
  productId: string;
  /** North-west corner of the axis-aligned footprint, in room coordinates. */
  x: Mm;
  y: Mm;
  rotation: Rotation;
  /** Optional user or agent note, e.g. "faces the window". */
  note?: string;
}

export interface ResolvedPlacement {
  placement: Placement;
  product: Product;
  footprint: Rect;
}

export function placementFootprint(placement: Placement, product: Product): Rect {
  return footprintFor(
    placement.x,
    placement.y,
    product.widthMm,
    product.depthMm,
    placement.rotation,
  );
}

export function resolvePlacement(
  placement: Placement,
  catalog: Catalog,
): ResolvedPlacement | null {
  const product = findProduct(catalog, placement.productId);
  if (!product) return null;
  return { placement, product, footprint: placementFootprint(placement, product) };
}

export interface ResolvedLayout {
  resolved: readonly ResolvedPlacement[];
  /** Placements whose product id is not in the catalog. */
  unresolved: readonly Placement[];
}

export function resolveLayout(
  placements: readonly Placement[],
  catalog: Catalog,
): ResolvedLayout {
  const resolved: ResolvedPlacement[] = [];
  const unresolved: Placement[] = [];
  for (const placement of placements) {
    const entry = resolvePlacement(placement, catalog);
    if (entry) resolved.push(entry);
    else unresolved.push(placement);
  }
  return { resolved, unresolved };
}
