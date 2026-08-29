import type { Obstruction, Opening } from "../../domain/room";
import {
  HINGE_SIDES,
  OBSTRUCTION_KINDS,
  OPENING_TYPES,
  SWING_DIRECTIONS,
  WALL_NAMES,
} from "../../domain/room";
import { ROTATIONS, type Rotation } from "../../geometry/rotation";
import {
  applyLayout,
  defineRoom,
  furnishRoom,
  moveItem,
  placeItem,
  removeItem,
  rotateItem,
  setBudget,
  swapProduct,
} from "../../store/operations";
import { buildCostBreakdown } from "../../cost/breakdown";
import { plannerState } from "../../store/store";
import { ROOM_FUNCTIONS } from "../../studio/furnish";
import { STYLE_TAGS } from "../../domain/product";
import {
  ToolInputError,
  optionalBoolean,
  optionalInteger,
  optionalObjectArray,
  optionalString,
  requiredEnum,
  requiredInteger,
  requiredObjectArray,
  requiredString,
  toolError,
  toolResult,
} from "../args";
import {
  MAX_PRICE_CENTS,
  MAX_ROOM_DIMENSION_MM,
  MIN_ROOM_DIMENSION_MM,
  OBSTRUCTION_SCHEMA,
  OPENING_SCHEMA,
  PLACEMENT_ID_PROPERTY,
  PRODUCT_ID_PROPERTY,
  ROTATION_PROPERTY,
  millimetres,
} from "../schema";
import type { ToolArguments, ToolDescriptor } from "../types";

const MUTATING = { readOnlyHint: false } as const;

function rotationFrom(args: ToolArguments, key: string): Rotation {
  const value = requiredInteger(args, key, 0, 270);
  const match = ROTATIONS.find((rotation) => rotation === value);
  if (match === undefined) {
    throw new ToolInputError(`"${key}" must be one of: ${ROTATIONS.join(", ")}.`);
  }
  return match;
}

function openingFrom(entry: ToolArguments, index: number): Opening {
  const type = requiredEnum(entry, "type", OPENING_TYPES);
  const wall = requiredEnum(entry, "wall", WALL_NAMES);
  const opening: Opening = {
    id: `${type}-${wall}-${index + 1}`,
    type,
    wall,
    offsetMm: requiredInteger(entry, "offsetMm", 0, MAX_ROOM_DIMENSION_MM),
    widthMm: requiredInteger(entry, "widthMm", 300, 6000),
    heightMm: optionalInteger(entry, "heightMm", 300, 3000) ?? (type === "door" ? 2040 : 1200),
  };
  if (type !== "door") return opening;

  return {
    ...opening,
    swing: {
      hingeSide: requiredEnum({ hingeSide: entry.hingeSide ?? "start" }, "hingeSide", HINGE_SIDES),
      direction: requiredEnum(
        { swingDirection: entry.swingDirection ?? "inward" },
        "swingDirection",
        SWING_DIRECTIONS,
      ),
    },
  };
}

function obstructionFrom(entry: ToolArguments, index: number): Obstruction {
  return {
    id: `obs-${index + 1}`,
    label: requiredString(entry, "label"),
    kind: requiredEnum(entry, "kind", OBSTRUCTION_KINDS),
    x: requiredInteger(entry, "x", 0, MAX_ROOM_DIMENSION_MM),
    y: requiredInteger(entry, "y", 0, MAX_ROOM_DIMENSION_MM),
    widthMm: requiredInteger(entry, "widthMm", 50, MAX_ROOM_DIMENSION_MM),
    depthMm: requiredInteger(entry, "depthMm", 50, MAX_ROOM_DIMENSION_MM),
  };
}

const defineRoomTool: ToolDescriptor = {
  name: "define_room",
  description:
    "Create or replace the room from a description of the space: its size in millimetres, its doors and windows, and any fixed obstructions such as a bulkhead or a column. Doors record their hinge side and swing so the arc can be kept clear.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "What to call the room, e.g. 'Living room'.",
        maxLength: 60,
      },
      widthMm: millimetres(
        "East-west size of the room in millimetres. 4.2 metres is 4200.",
        MIN_ROOM_DIMENSION_MM,
        MAX_ROOM_DIMENSION_MM,
      ),
      depthMm: millimetres(
        "North-south size of the room in millimetres. 3.8 metres is 3800.",
        MIN_ROOM_DIMENSION_MM,
        MAX_ROOM_DIMENSION_MM,
      ),
      openings: {
        type: "array",
        description: "Every door and window in the room.",
        items: OPENING_SCHEMA,
        maxItems: 12,
      },
      obstructions: {
        type: "array",
        description: "Fixed things furniture cannot occupy.",
        items: OBSTRUCTION_SCHEMA,
        maxItems: 12,
      },
      keepPlacements: {
        type: "boolean",
        description:
          "Keep the existing furniture when redefining the room. Leave this off when describing a new room, since old coordinates will rarely still make sense.",
      },
    },
    required: ["widthMm", "depthMm"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      const openings = (optionalObjectArray(args, "openings") ?? []).map(openingFrom);
      const obstructions = (optionalObjectArray(args, "obstructions") ?? []).map(
        obstructionFrom,
      );
      return toolResult(
        defineRoom({
          name: optionalString(args, "name"),
          widthMm: requiredInteger(args, "widthMm", MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
          depthMm: requiredInteger(args, "depthMm", MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
          openings,
          obstructions,
          keepPlacements: optionalBoolean(args, "keepPlacements") ?? false,
        }),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const placeItemTool: ToolDescriptor = {
  name: "place_item",
  description:
    "Add a catalog product to the room at a position and rotation. Returns the new placement together with every clearance finding the placement introduced, so a bad position can be corrected immediately.",
  inputSchema: {
    type: "object",
    properties: {
      productId: PRODUCT_ID_PROPERTY,
      x: millimetres(
        "Millimetres east of the room's north-west corner, to the item's west edge.",
      ),
      y: millimetres(
        "Millimetres south of the room's north-west corner, to the item's north edge.",
      ),
      rotation: ROTATION_PROPERTY,
      note: {
        type: "string",
        description: "Optional note about intent, e.g. 'faces the window'.",
        maxLength: 120,
      },
    },
    required: ["productId", "x", "y", "rotation"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      return toolResult(
        placeItem({
          productId: requiredString(args, "productId"),
          x: requiredInteger(args, "x", -MAX_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
          y: requiredInteger(args, "y", -MAX_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
          rotation: rotationFrom(args, "rotation"),
          note: optionalString(args, "note"),
        }),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const moveItemTool: ToolDescriptor = {
  name: "move_item",
  description:
    "Move an existing placement to a new position, keeping its product and rotation. Returns the clearance findings the new position introduced.",
  inputSchema: {
    type: "object",
    properties: {
      placementId: PLACEMENT_ID_PROPERTY,
      x: millimetres("New millimetres east of the room's north-west corner."),
      y: millimetres("New millimetres south of the room's north-west corner."),
    },
    required: ["placementId", "x", "y"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      return toolResult(
        moveItem({
          placementId: requiredString(args, "placementId"),
          x: requiredInteger(args, "x", -MAX_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
          y: requiredInteger(args, "y", -MAX_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
        }),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const rotateItemTool: ToolDescriptor = {
  name: "rotate_item",
  description:
    "Turn an existing placement to a new rotation, keeping its north-west corner where it is. Returns the clearance findings the new orientation introduced.",
  inputSchema: {
    type: "object",
    properties: {
      placementId: PLACEMENT_ID_PROPERTY,
      rotation: ROTATION_PROPERTY,
    },
    required: ["placementId", "rotation"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      return toolResult(
        rotateItem({
          placementId: requiredString(args, "placementId"),
          rotation: rotationFrom(args, "rotation"),
        }),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const removeItemTool: ToolDescriptor = {
  name: "remove_item",
  description:
    "Take an item out of the room. Returns the remaining placements and the findings that are still outstanding.",
  inputSchema: {
    type: "object",
    properties: { placementId: PLACEMENT_ID_PROPERTY },
    required: ["placementId"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false, destructiveHint: true },
  execute: (args) => {
    try {
      return toolResult(removeItem(requiredString(args, "placementId")));
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const swapProductTool: ToolDescriptor = {
  name: "swap_product",
  description:
    "Replace the product in an existing placement while keeping its position and rotation. Use this for 'swap that for something cheaper' or 'the same but in warmer timber'.",
  inputSchema: {
    type: "object",
    properties: {
      placementId: PLACEMENT_ID_PROPERTY,
      productId: PRODUCT_ID_PROPERTY,
    },
    required: ["placementId", "productId"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      return toolResult(
        swapProduct({
          placementId: requiredString(args, "placementId"),
          productId: requiredString(args, "productId"),
        }),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const applyLayoutTool: ToolDescriptor = {
  name: "apply_layout",
  description:
    "Place a whole proposed layout in one call. Use this when furnishing a room from scratch, then read the returned findings to see which items need adjusting.",
  inputSchema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "The items to place, in the order they should be added.",
        minItems: 1,
        maxItems: 30,
        items: {
          type: "object",
          properties: {
            productId: PRODUCT_ID_PROPERTY,
            x: millimetres("Millimetres east of the room's north-west corner."),
            y: millimetres("Millimetres south of the room's north-west corner."),
            rotation: ROTATION_PROPERTY,
            note: {
              type: "string",
              description: "Optional note about intent.",
              maxLength: 120,
            },
          },
          required: ["productId", "x", "y", "rotation"],
          additionalProperties: false,
        },
      },
      replaceExisting: {
        type: "boolean",
        description:
          "Clear the room before applying, rather than adding to what is already placed.",
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      const items = requiredObjectArray(args, "items").map((entry) => ({
        productId: requiredString(entry, "productId"),
        x: requiredInteger(entry, "x", -MAX_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
        y: requiredInteger(entry, "y", -MAX_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM),
        rotation: rotationFrom(entry, "rotation"),
        note: optionalString(entry, "note"),
      }));
      return toolResult(
        applyLayout(items, optionalBoolean(args, "replaceExisting") ?? false),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const setBudgetTool: ToolDescriptor = {
  name: "set_budget",
  description:
    "Set or clear the spending limit the layout is priced against. Pass budgetCents to set it, or omit it to remove the limit.",
  inputSchema: {
    type: "object",
    properties: {
      budgetCents: {
        type: "integer",
        description:
          "Budget in Australian cents, so a $3,000 budget is 300000. Omit to clear the budget.",
        minimum: 0,
        maximum: MAX_PRICE_CENTS,
      },
    },
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      const budgetCents = optionalInteger(args, "budgetCents", 0, MAX_PRICE_CENTS);
      setBudget(budgetCents ?? null);
      const state = plannerState();
      return toolResult({
        ok: true,
        summary:
          budgetCents === undefined
            ? "Budget cleared."
            : `Budget set to ${budgetCents} cents.`,
        cost: buildCostBreakdown(state.placements, state.catalog, state.budgetCents),
      });
    } catch (cause) {
      return toolError(cause);
    }
  },
};

const furnishRoomTool: ToolDescriptor = {
  name: "furnish_room",
  description:
    "Furnish the current room for a function (living_room, bedroom, home_office, dining) and optional style theme. Picks matching catalog products, places a starter layout in the 3D studio, and returns clearance findings so you can inspect and refine. Prefer this over hand-placing every item when the user says 'furnish my living room in warm timber'.",
  inputSchema: {
    type: "object",
    properties: {
      roomFunction: {
        type: "string",
        enum: ROOM_FUNCTIONS,
        description: "How the room will be used.",
      },
      theme: {
        type: "string",
        enum: STYLE_TAGS,
        description: "Optional style tag to bias product picks, e.g. 'warm timber' or 'scandinavian'.",
      },
      budgetCents: {
        type: "integer",
        description:
          "Optional spending limit in Australian cents. Also sets the studio budget.",
        minimum: 0,
        maximum: MAX_PRICE_CENTS,
      },
      replaceExisting: {
        type: "boolean",
        description: "Replace current placements (default true) rather than adding to them.",
      },
    },
    required: ["roomFunction"],
    additionalProperties: false,
  },
  annotations: MUTATING,
  execute: (args) => {
    try {
      return toolResult(
        furnishRoom({
          roomFunction: requiredEnum(args, "roomFunction", ROOM_FUNCTIONS),
          theme: optionalString(args, "theme")
            ? requiredEnum(args, "theme", STYLE_TAGS)
            : undefined,
          budgetCents: optionalInteger(args, "budgetCents", 0, MAX_PRICE_CENTS),
          replaceExisting: optionalBoolean(args, "replaceExisting") ?? true,
        }),
      );
    } catch (cause) {
      return toolError(cause);
    }
  },
};

export const WRITE_TOOLS: readonly ToolDescriptor[] = [
  defineRoomTool,
  furnishRoomTool,
  placeItemTool,
  moveItemTool,
  rotateItemTool,
  removeItemTool,
  swapProductTool,
  applyLayoutTool,
  setBudgetTool,
];
