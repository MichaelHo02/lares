import type { Placement } from "../lib/domain/placement";
import type { Catalog, Product } from "../lib/domain/product";
import { createRectangularRoom, type Opening, type Room } from "../lib/domain/room";
import { dollarsToCents } from "../lib/domain/units";
import type { Rotation } from "../lib/geometry/rotation";

/**
 * Fixtures are deliberately independent of the shipped catalog so that editing
 * merchandising data can never change what the engine tests assert.
 */

function product(overrides: Partial<Product> & Pick<Product, "id" | "category">): Product {
  return {
    name: overrides.id,
    widthMm: 1000,
    depthMm: 500,
    heightMm: 800,
    priceCents: dollarsToCents(499),
    styleTags: ["minimal"],
    clearances: [],
    blurb: "Test fixture.",
    ...overrides,
  };
}

export const TEST_PRODUCTS = {
  sofa: product({
    id: "test-sofa",
    name: "Test Sofa",
    category: "sofa",
    widthMm: 2000,
    depthMm: 900,
    heightMm: 850,
    clearances: [
      { face: "front", depthMm: 400, reason: "seating_approach", label: "Legroom" },
    ],
  }),
  coffeeTable: product({
    id: "test-coffee-table",
    name: "Test Coffee Table",
    category: "coffee_table",
    widthMm: 1100,
    depthMm: 600,
    heightMm: 400,
  }),
  diningTable: product({
    id: "test-dining-table",
    name: "Test Dining Table",
    category: "dining_table",
    widthMm: 1600,
    depthMm: 900,
    heightMm: 740,
    clearances: [
      { face: "front", depthMm: 900, reason: "chair_pullout", label: "Chair pull-out" },
      { face: "back", depthMm: 900, reason: "chair_pullout", label: "Chair pull-out" },
      { face: "left", depthMm: 900, reason: "chair_pullout", label: "Chair pull-out" },
      { face: "right", depthMm: 900, reason: "chair_pullout", label: "Chair pull-out" },
    ],
  }),
  wardrobe: product({
    id: "test-wardrobe",
    name: "Test Wardrobe",
    category: "wardrobe",
    widthMm: 1500,
    depthMm: 600,
    heightMm: 2100,
    clearances: [
      { face: "front", depthMm: 600, reason: "door_swing", label: "Door swing" },
    ],
  }),
  queenBed: product({
    id: "test-queen-bed",
    name: "Test Queen Bed",
    category: "bed",
    widthMm: 1650,
    depthMm: 2030,
    heightMm: 1000,
    clearances: [
      { face: "left", depthMm: 600, reason: "side_access", label: "Side access" },
      { face: "right", depthMm: 600, reason: "side_access", label: "Side access" },
    ],
  }),
  singleBed: product({
    id: "test-single-bed",
    name: "Test Single Bed",
    category: "bed",
    widthMm: 990,
    depthMm: 1900,
    heightMm: 900,
    // Both sides are candidates; a single only needs one of them to be clear.
    clearances: [
      { face: "left", depthMm: 600, reason: "side_access", label: "Side access" },
      { face: "right", depthMm: 600, reason: "side_access", label: "Side access" },
    ],
  }),
  bedsideTable: product({
    id: "test-bedside-table",
    name: "Test Bedside Table",
    category: "bedside_table",
    widthMm: 450,
    depthMm: 400,
    heightMm: 550,
  }),
  rug: product({
    id: "test-rug",
    name: "Test Rug",
    category: "rug",
    widthMm: 2400,
    depthMm: 1700,
    heightMm: 10,
  }),
  diningChair: product({
    id: "test-dining-chair",
    name: "Test Dining Chair",
    category: "dining_chair",
    widthMm: 460,
    depthMm: 520,
    heightMm: 880,
  }),
  /** Rigid and too bulky to pass a standard 820mm doorway in any orientation. */
  bulkySectional: product({
    id: "test-bulky-sectional",
    name: "Test Bulky Sectional",
    category: "sofa",
    widthMm: 2900,
    depthMm: 1000,
    heightMm: 900,
  }),
  bookshelf: product({
    id: "test-bookshelf",
    name: "Test Bookshelf",
    category: "bookshelf",
    widthMm: 800,
    depthMm: 300,
    heightMm: 2000,
    clearances: [
      { face: "front", depthMm: 350, reason: "drawer_pull", label: "Reach the shelves" },
    ],
  }),
} as const;

export const TEST_CATALOG: Catalog = Object.values(TEST_PRODUCTS);

export const NORTH_DOOR: Opening = {
  id: "door-north",
  type: "door",
  wall: "north",
  offsetMm: 400,
  widthMm: 820,
  heightMm: 2040,
  swing: { hingeSide: "start", direction: "inward" },
};

export const EAST_WINDOW: Opening = {
  id: "window-east",
  type: "window",
  wall: "east",
  offsetMm: 800,
  widthMm: 1500,
  heightMm: 900,
};

export function makeRoom(
  widthMm = 4200,
  depthMm = 3800,
  openings: readonly Opening[] = [NORTH_DOOR, EAST_WINDOW],
): Room {
  return createRectangularRoom({ name: "Test Room", widthMm, depthMm, openings });
}

export function place(
  id: string,
  productId: string,
  x: number,
  y: number,
  rotation: Rotation = 0,
): Placement {
  return { id, productId, x, y, rotation };
}
