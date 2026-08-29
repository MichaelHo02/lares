import { searchCatalog } from "../catalog/search";
import type { Catalog, Product, ProductCategory, StyleTag } from "../domain/product";
import type { Room } from "../domain/room";
import type { Cents, Mm } from "../domain/units";
import type { Rotation } from "../geometry/rotation";
import type { ApplyLayoutItem } from "../store/operations";

export const ROOM_FUNCTIONS = [
  "living_room",
  "bedroom",
  "home_office",
  "dining",
] as const;

export type RoomFunction = (typeof ROOM_FUNCTIONS)[number];

export interface FurnishRequest {
  room: Room;
  catalog: Catalog;
  roomFunction: RoomFunction;
  theme?: StyleTag;
  budgetCents?: Cents | null;
  marginMm?: Mm;
}

export interface FurnishProposal {
  items: ApplyLayoutItem[];
  notes: string[];
  totalCents: Cents;
}

interface Slot {
  category: ProductCategory;
  /** Preferred facing / placement intent for the note. */
  note: string;
  x: Mm;
  y: Mm;
  rotation: Rotation;
  /** Prefer larger pieces when true. */
  preferLarger?: boolean;
}

/**
 * Propose a clearance-aware-ish starter layout from room function + theme.
 * Exact clearances are still enforced by check_layout after apply — this is the
 * agent's first draft so it can inspect and refine.
 */
export function proposeFurnish(request: FurnishRequest): FurnishProposal {
  const margin = request.marginMm ?? 400;
  const slots = slotsFor(request.roomFunction, request.room, margin);
  const notes: string[] = [];
  const items: ApplyLayoutItem[] = [];
  let totalCents = 0 as Cents;
  const used = new Set<string>();

  for (const slot of slots) {
    if (
      request.budgetCents !== undefined &&
      request.budgetCents !== null &&
      totalCents >= request.budgetCents
    ) {
      notes.push("Stopped early: remaining budget cannot cover more pieces.");
      break;
    }

    const product = pickProduct({
      catalog: request.catalog,
      category: slot.category,
      theme: request.theme,
      room: request.room,
      preferLarger: slot.preferLarger,
      excludeIds: used,
      remainingBudget:
        request.budgetCents === undefined || request.budgetCents === null
          ? undefined
          : ((request.budgetCents - totalCents) as Cents),
    });

    if (!product) {
      notes.push(`No catalog match for ${slot.category}${request.theme ? ` / ${request.theme}` : ""}.`);
      continue;
    }

    used.add(product.id);
    const clamped = clampToRoom(request.room, product, slot.x, slot.y, slot.rotation, margin);
    items.push({
      productId: product.id,
      x: clamped.x,
      y: clamped.y,
      rotation: slot.rotation,
      note: slot.note,
    });
    totalCents = (totalCents + product.priceCents) as Cents;
  }

  if (items.length === 0) {
    notes.push("Could not place any furniture for this function and theme.");
  }

  return { items, notes, totalCents };
}

function slotsFor(roomFunction: RoomFunction, room: Room, margin: Mm): Slot[] {
  const w = room.widthMm;
  const d = room.depthMm;

  switch (roomFunction) {
    case "living_room":
      return [
        {
          category: "rug",
          note: "Under seating",
          x: Math.round(w * 0.2),
          y: Math.round(d * 0.35),
          rotation: 0,
          preferLarger: true,
        },
        {
          category: "sofa",
          note: "Facing into the room",
          x: margin,
          y: Math.round(d * 0.55),
          rotation: 0,
          preferLarger: true,
        },
        {
          category: "coffee_table",
          note: "In front of the sofa",
          x: Math.round(w * 0.35),
          y: Math.round(d * 0.4),
          rotation: 0,
        },
        {
          category: "tv_unit",
          note: "Opposite the sofa",
          x: Math.round(w * 0.3),
          y: margin,
          rotation: 180,
        },
        {
          category: "armchair",
          note: "Accent seating",
          x: Math.round(w * 0.65),
          y: Math.round(d * 0.55),
          rotation: 270,
        },
        {
          category: "floor_lamp",
          note: "Beside seating",
          x: Math.round(w * 0.75),
          y: Math.round(d * 0.7),
          rotation: 0,
        },
      ];
    case "bedroom":
      return [
        {
          category: "bed",
          note: "Head against the wall",
          x: Math.round(w * 0.25),
          y: margin,
          rotation: 0,
          preferLarger: true,
        },
        {
          category: "bedside_table",
          note: "Left of bed",
          x: margin,
          y: margin + 200,
          rotation: 0,
        },
        {
          category: "bedside_table",
          note: "Right of bed",
          x: Math.round(w * 0.7),
          y: margin + 200,
          rotation: 0,
        },
        {
          category: "wardrobe",
          note: "Along the free wall",
          x: Math.round(w * 0.55),
          y: Math.round(d * 0.55),
          rotation: 270,
        },
        {
          category: "rug",
          note: "Beside the bed",
          x: Math.round(w * 0.2),
          y: Math.round(d * 0.45),
          rotation: 0,
        },
      ];
    case "home_office":
      return [
        {
          category: "desk",
          note: "Work surface",
          x: Math.round(w * 0.2),
          y: margin,
          rotation: 0,
          preferLarger: true,
        },
        {
          category: "office_chair",
          note: "At the desk",
          x: Math.round(w * 0.35),
          y: margin + 700,
          rotation: 180,
        },
        {
          category: "bookshelf",
          note: "Storage wall",
          x: Math.round(w * 0.7),
          y: margin,
          rotation: 0,
        },
        {
          category: "floor_lamp",
          note: "Task lighting",
          x: margin,
          y: Math.round(d * 0.55),
          rotation: 0,
        },
        {
          category: "rug",
          note: "Under desk zone",
          x: Math.round(w * 0.15),
          y: Math.round(d * 0.35),
          rotation: 0,
        },
      ];
    case "dining":
      return [
        {
          category: "dining_table",
          note: "Centred dining",
          x: Math.round(w * 0.28),
          y: Math.round(d * 0.3),
          rotation: 0,
          preferLarger: true,
        },
        {
          category: "dining_chair",
          note: "Seat",
          x: Math.round(w * 0.2),
          y: Math.round(d * 0.18),
          rotation: 0,
        },
        {
          category: "dining_chair",
          note: "Seat",
          x: Math.round(w * 0.45),
          y: Math.round(d * 0.18),
          rotation: 0,
        },
        {
          category: "dining_chair",
          note: "Seat",
          x: Math.round(w * 0.2),
          y: Math.round(d * 0.55),
          rotation: 180,
        },
        {
          category: "dining_chair",
          note: "Seat",
          x: Math.round(w * 0.45),
          y: Math.round(d * 0.55),
          rotation: 180,
        },
        {
          category: "sideboard",
          note: "Serving / storage",
          x: margin,
          y: margin,
          rotation: 0,
        },
      ];
    default: {
      const exhaustive: never = roomFunction;
      throw new Error(`unhandled room function: ${String(exhaustive)}`);
    }
  }
}

function pickProduct(input: {
  catalog: Catalog;
  category: ProductCategory;
  theme?: StyleTag;
  room: Room;
  preferLarger?: boolean;
  excludeIds: Set<string>;
  remainingBudget?: Cents;
}): Product | null {
  const matches = searchCatalog(input.catalog, {
    categories: [input.category],
    styleTags: input.theme ? [input.theme] : undefined,
    maxWidthMm: input.room.widthMm,
    maxDepthMm: input.room.depthMm,
    maxPriceCents: input.remainingBudget,
    mustFitThroughMm: undefined,
    limit: 20,
  })
    .map((match) => match.product)
    .filter((product) => !input.excludeIds.has(product.id));

  if (matches.length === 0) {
    // Fall back without theme rather than leave the slot empty.
    if (input.theme) {
      return pickProduct({ ...input, theme: undefined });
    }
    return null;
  }

  const sorted = [...matches].sort((a, b) => {
    const areaA = a.widthMm * a.depthMm;
    const areaB = b.widthMm * b.depthMm;
    return input.preferLarger ? areaB - areaA : areaA - areaB;
  });
  return sorted[0] ?? null;
}

function clampToRoom(
  room: Room,
  product: Product,
  x: Mm,
  y: Mm,
  rotation: Rotation,
  margin: Mm,
): { x: Mm; y: Mm } {
  const width = rotation === 90 || rotation === 270 ? product.depthMm : product.widthMm;
  const depth = rotation === 90 || rotation === 270 ? product.widthMm : product.depthMm;
  const maxX = Math.max(margin, room.widthMm - width - margin);
  const maxY = Math.max(margin, room.depthMm - depth - margin);
  return {
    x: Math.min(Math.max(margin, x), maxX) as Mm,
    y: Math.min(Math.max(margin, y), maxY) as Mm,
  };
}
