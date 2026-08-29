import type { Mm } from "../domain/units";
import type { ProductCategory } from "../domain/product";

/**
 * Circulation figures follow the residential guidance common to AS 1428-derived
 * accessible design and standard architectural planning tables. They are the
 * numbers a builder or joiner would use, not aspirational minimums.
 */
export const STANDARDS = {
  /** Main route through a room, wide enough for two people to pass. */
  PRIMARY_WALKWAY_MM: 900 as Mm,
  /** Secondary route serving a single piece of furniture. */
  SECONDARY_WALKWAY_MM: 700 as Mm,
  /** Pulling a dining chair back and standing up from it. */
  DINING_PULLOUT_MM: 900 as Mm,
  /** Getting into and out of a bed along its long side. */
  BED_SIDE_ACCESS_MM: 600 as Mm,
  /**
   * Gaps narrower than this are furniture standing side by side, not an attempt
   * at a walkway, so flagging them would produce noise on every valid layout.
   */
  WALKWAY_INTENT_THRESHOLD_MM: 150 as Mm,
  /** Carrying tolerance subtracted from a doorway when checking delivery access. */
  DOOR_FIT_TOLERANCE_MM: 10 as Mm,
} as const;

/**
 * Categories that sit on a room's main circulation route. A gap involving one of
 * these is held to the primary walkway width; everything else to the secondary.
 */
const PRIMARY_CIRCULATION: ReadonlySet<ProductCategory> = new Set<ProductCategory>([
  "sofa",
  "dining_table",
  "bed",
  "wardrobe",
  "desk",
  "sideboard",
]);

export function requiredWalkwayFor(
  a: ProductCategory,
  b: ProductCategory | "wall",
): Mm {
  const bIsPrimary = b !== "wall" && PRIMARY_CIRCULATION.has(b);
  return PRIMARY_CIRCULATION.has(a) || bIsPrimary
    ? STANDARDS.PRIMARY_WALKWAY_MM
    : STANDARDS.SECONDARY_WALKWAY_MM;
}

type CategoryPair = `${ProductCategory}|${ProductCategory}`;

function pairKey(a: ProductCategory, b: ProductCategory): CategoryPair {
  return (a < b ? `${a}|${b}` : `${b}|${a}`) as CategoryPair;
}

/**
 * Pairs that are meant to sit close together. A coffee table 400mm from a sofa
 * is correct design, not a blocked walkway, so these pairs are exempt from the
 * walkway rule entirely.
 */
const COMPANION_PAIRS: ReadonlySet<string> = new Set<string>([
  pairKey("sofa", "coffee_table"),
  pairKey("armchair", "coffee_table"),
  pairKey("sofa", "armchair"),
  pairKey("bed", "bedside_table"),
  pairKey("desk", "office_chair"),
  pairKey("dining_table", "dining_chair"),
  pairKey("dining_chair", "dining_chair"),
  pairKey("sofa", "floor_lamp"),
  pairKey("armchair", "floor_lamp"),
  pairKey("bookshelf", "floor_lamp"),
  pairKey("desk", "bookshelf"),
  pairKey("sofa", "tv_unit"),
  pairKey("sofa", "sideboard"),
]);

export function isCompanionPair(a: ProductCategory, b: ProductCategory): boolean {
  return COMPANION_PAIRS.has(pairKey(a, b));
}

/**
 * Categories permitted to stand inside another product's declared clearance
 * zone, because they are what the clearance exists to accommodate.
 */
const CLEARANCE_ZONE_OCCUPANTS: ReadonlyMap<string, ReadonlySet<ProductCategory>> =
  new Map<string, ReadonlySet<ProductCategory>>([
    ["chair_pullout", new Set<ProductCategory>(["dining_chair", "rug"])],
    ["seating_approach", new Set<ProductCategory>(["coffee_table", "office_chair", "rug"])],
    ["side_access", new Set<ProductCategory>(["bedside_table", "rug"])],
    ["door_swing", new Set<ProductCategory>(["rug"])],
    ["drawer_pull", new Set<ProductCategory>(["rug"])],
  ]);

export function mayOccupyClearanceZone(
  reason: string,
  category: ProductCategory,
): boolean {
  return CLEARANCE_ZONE_OCCUPANTS.get(reason)?.has(category) ?? false;
}

/** A bed wide enough that both long sides should be reachable. */
export const DOUBLE_BED_MIN_WIDTH_MM: Mm = 1300;
