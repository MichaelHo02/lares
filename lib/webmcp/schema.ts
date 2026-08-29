import { PRODUCT_CATEGORIES, STYLE_TAGS } from "../domain/product";
import {
  HINGE_SIDES,
  OBSTRUCTION_KINDS,
  OPENING_TYPES,
  SWING_DIRECTIONS,
  WALL_NAMES,
} from "../domain/room";
import { ROTATIONS } from "../geometry/rotation";
import type { JsonSchemaProperty, ToolInputSchema } from "./types";

/** Largest room Lares will model, and therefore the bound on every coordinate. */
export const MAX_ROOM_DIMENSION_MM = 20000;
export const MIN_ROOM_DIMENSION_MM = 1000;
export const MAX_PRICE_CENTS = 100_000_00;

export function millimetres(
  description: string,
  minimum = 0,
  maximum = MAX_ROOM_DIMENSION_MM,
): JsonSchemaProperty {
  return { type: "integer", description, minimum, maximum };
}

export const ROTATION_PROPERTY: JsonSchemaProperty = {
  type: "integer",
  enum: ROTATIONS,
  description:
    "Clockwise rotation in degrees. At 0 the product's front faces south (down the plan); 90 turns it to face west.",
};

export const CATEGORY_PROPERTY: JsonSchemaProperty = {
  type: "string",
  enum: PRODUCT_CATEGORIES,
  description: "Product category.",
};

export const WALL_PROPERTY: JsonSchemaProperty = {
  type: "string",
  enum: WALL_NAMES,
  description: "Which wall the opening sits in.",
};

export const OPENING_SCHEMA: JsonSchemaProperty = {
  type: "object",
  description: "A door or window in one of the room's walls.",
  properties: {
    type: { type: "string", enum: OPENING_TYPES, description: "Door or window." },
    wall: WALL_PROPERTY,
    offsetMm: millimetres(
      "Distance in millimetres from the clockwise start of that wall to the near edge of the opening. Walls run clockwise from the north-west corner.",
    ),
    widthMm: millimetres("Width of the opening in millimetres.", 300, 6000),
    heightMm: millimetres(
      "Head height for a door, or sill-to-head height for a window, in millimetres.",
      300,
      3000,
    ),
    hingeSide: {
      type: "string",
      enum: HINGE_SIDES,
      description:
        "Doors only. 'start' hinges at the end of the opening nearest the wall's clockwise start; 'end' hinges at the far end.",
    },
    swingDirection: {
      type: "string",
      enum: SWING_DIRECTIONS,
      description:
        "Doors only. 'inward' swings into this room and its arc must be kept clear; 'outward' swings away.",
    },
  },
  required: ["type", "wall", "offsetMm", "widthMm"],
  additionalProperties: false,
};

export const OBSTRUCTION_SCHEMA: JsonSchemaProperty = {
  type: "object",
  description: "A fixed thing furniture cannot occupy, such as a bulkhead or a column.",
  properties: {
    label: {
      type: "string",
      description: "Short natural-language label, e.g. 'corner bulkhead'.",
      maxLength: 80,
    },
    kind: {
      type: "string",
      enum: OBSTRUCTION_KINDS,
      description: "What kind of fixed thing it is.",
    },
    x: millimetres("Millimetres east of the room's north-west corner."),
    y: millimetres("Millimetres south of the room's north-west corner."),
    widthMm: millimetres("East-west size in millimetres.", 50),
    depthMm: millimetres("North-south size in millimetres.", 50),
  },
  required: ["label", "kind", "x", "y", "widthMm", "depthMm"],
  additionalProperties: false,
};

export const STYLE_TAGS_PROPERTY: JsonSchemaProperty = {
  type: "array",
  description:
    "Style tags to match, so requests like 'something in warmer timber' can be honoured.",
  items: { type: "string", enum: STYLE_TAGS },
  maxItems: 8,
};

export const PLACEMENT_ID_PROPERTY: JsonSchemaProperty = {
  type: "string",
  description:
    "Id of an existing placement, as returned by list_placements or place_item (for example 'pl-003').",
  maxLength: 40,
};

export const PRODUCT_ID_PROPERTY: JsonSchemaProperty = {
  type: "string",
  description: "Catalog product id, as returned by search_catalog.",
  maxLength: 60,
};

export const EMPTY_SCHEMA: ToolInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};
