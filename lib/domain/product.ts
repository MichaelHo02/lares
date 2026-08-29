import type { Face } from "../geometry/rotation";
import type { Cents, Mm } from "./units";

export const PRODUCT_CATEGORIES = [
  "sofa",
  "armchair",
  "coffee_table",
  "dining_table",
  "dining_chair",
  "bed",
  "bedside_table",
  "wardrobe",
  "bookshelf",
  "desk",
  "office_chair",
  "rug",
  "floor_lamp",
  "sideboard",
  "tv_unit",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  sofa: "Sofa",
  armchair: "Armchair",
  coffee_table: "Coffee table",
  dining_table: "Dining table",
  dining_chair: "Dining chair",
  bed: "Bed",
  bedside_table: "Bedside table",
  wardrobe: "Wardrobe",
  bookshelf: "Bookshelf",
  desk: "Desk",
  office_chair: "Office chair",
  rug: "Rug",
  floor_lamp: "Floor lamp",
  sideboard: "Sideboard",
  tv_unit: "TV unit",
};

export const CATEGORY_GLYPHS: Record<ProductCategory, string> = {
  sofa: "🛋️",
  armchair: "🪑",
  coffee_table: "☕",
  dining_table: "🍽️",
  dining_chair: "🪑",
  bed: "🛏️",
  bedside_table: "🕯️",
  wardrobe: "🚪",
  bookshelf: "📚",
  desk: "🖥️",
  office_chair: "💼",
  rug: "🟫",
  floor_lamp: "💡",
  sideboard: "🗄️",
  tv_unit: "📺",
};

/**
 * Why a product needs floor space outside its own footprint. The reason selects
 * the finding code the clearance engine emits, so an agent can tell a blocked
 * wardrobe door from a dining chair that cannot be pulled out.
 */
export const CLEARANCE_REASONS = [
  "door_swing",
  "drawer_pull",
  "chair_pullout",
  "side_access",
  "seating_approach",
] as const;

export type ClearanceReason = (typeof CLEARANCE_REASONS)[number];

export interface ClearanceRequirement {
  /** Product-local face the clearance extends from. */
  face: Face;
  depthMm: Mm;
  reason: ClearanceReason;
  /** Human-readable justification, surfaced in findings. */
  label: string;
}

export const STYLE_TAGS = [
  "warm timber",
  "light oak",
  "walnut",
  "black metal",
  "brushed brass",
  "linen",
  "boucle",
  "leather",
  "minimal",
  "mid-century",
  "scandinavian",
  "industrial",
  "coastal",
  "rattan",
  "velvet",
  "compact",
] as const;

export type StyleTag = (typeof STYLE_TAGS)[number];

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  /** Footprint measured across the product's front face. */
  widthMm: Mm;
  /** Footprint measured front-to-back. */
  depthMm: Mm;
  heightMm: Mm;
  priceCents: Cents;
  styleTags: readonly StyleTag[];
  clearances: readonly ClearanceRequirement[];
  /** One sentence of merchandising copy; also helps agents pick sensibly. */
  blurb: string;
}

export type Catalog = readonly Product[];

export function findProduct(catalog: Catalog, productId: string): Product | undefined {
  return catalog.find((product) => product.id === productId);
}

/**
 * Smallest cross-sectional dimension: the limiting measurement when carrying an
 * item through a doorway, because the item can be tilted or turned so that only
 * its narrowest dimension has to clear the jamb width.
 */
export function smallestCrossSection(product: Product): Mm {
  return Math.min(product.widthMm, product.depthMm, product.heightMm);
}

/** Rugs are flat, so furniture legitimately sits on top of them. */
export function isFloorCovering(category: ProductCategory): boolean {
  return category === "rug";
}
