import { checkLayout } from "../../clearance/checkLayout";
import { STANDARDS } from "../../clearance/standards";
import { clearanceEnvelope, searchCatalog } from "../../catalog/search";
import { buildCostBreakdown } from "../../cost/breakdown";
import {
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  STYLE_TAGS,
  smallestCrossSection,
} from "../../domain/product";
import { narrowestDoorWidth, openingSegment } from "../../domain/room";
import { formatAud, formatMetres } from "../../domain/units";
import { plannerState } from "../../store/store";
import { placementViews } from "../../store/views";
import {
  optionalEnumArray,
  optionalInteger,
  optionalString,
  toolResult,
} from "../args";
import {
  CATEGORY_PROPERTY,
  MAX_PRICE_CENTS,
  MAX_ROOM_DIMENSION_MM,
  STYLE_TAGS_PROPERTY,
  millimetres,
} from "../schema";
import { EMPTY_SCHEMA } from "../schema";
import type { ToolDescriptor } from "../types";

const READ_ONLY = { readOnlyHint: true, idempotentHint: true } as const;

const getRoom: ToolDescriptor = {
  name: "get_room",
  description:
    "Read the current room: its size in millimetres, its walls, every door and window with its position and swing, and any fixed obstructions. Call this before placing anything so coordinates are correct.",
  inputSchema: EMPTY_SCHEMA,
  annotations: READ_ONLY,
  execute: () => {
    const { room } = plannerState();
    return toolResult({
      name: room.name,
      widthMm: room.widthMm,
      depthMm: room.depthMm,
      size: `${formatMetres(room.widthMm)} × ${formatMetres(room.depthMm)}`,
      coordinateSystem:
        "Origin (0,0) is the north-west corner. x increases east, y increases south. All values are millimetres.",
      walls: room.walls,
      openings: room.openings.map((opening) => ({
        ...opening,
        segment: openingSegment(room, opening),
      })),
      obstructions: room.obstructions,
      narrowestDoorWidthMm: narrowestDoorWidth(room),
    });
  },
};

const listPlacements: ToolDescriptor = {
  name: "list_placements",
  description:
    "Read everything currently placed in the room, with each item's placement id, product, position, rotation and derived footprint. Use the placement ids to move, rotate, swap or remove items.",
  inputSchema: EMPTY_SCHEMA,
  annotations: READ_ONLY,
  execute: () => {
    const state = plannerState();
    const views = placementViews(state);
    return toolResult({
      count: views.length,
      placements: views,
      selectedPlacementId: state.selectedPlacementId,
    });
  },
};

const searchCatalogTool: ToolDescriptor = {
  name: "search_catalog",
  description:
    "Find products, filtered by what will physically fit. Give maxWidthMm and maxDepthMm to get only items that fit that floor area in either orientation, and set includeClearances to also require room for their door swings and chair pull-out. Filter further by category, price ceiling and style tags.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Free-text match against product names, blurbs and style tags.",
        maxLength: 120,
      },
      categories: {
        type: "array",
        description: "Restrict results to these categories.",
        items: CATEGORY_PROPERTY,
        maxItems: 15,
      },
      maxWidthMm: millimetres(
        "Longest footprint side the item may have, in millimetres. Items are tested in both orientations.",
        100,
      ),
      maxDepthMm: millimetres(
        "Shortest footprint side the item may have, in millimetres.",
        100,
      ),
      minWidthMm: millimetres(
        "Smallest acceptable longest side, in millimetres — use this to avoid returning items that are too small for the space.",
        100,
      ),
      maxHeightMm: millimetres("Height ceiling in millimetres.", 10, 4000),
      maxPriceCents: {
        type: "integer",
        description: "Price ceiling in Australian cents. $1,500 is 150000.",
        minimum: 0,
        maximum: MAX_PRICE_CENTS,
      },
      minPriceCents: {
        type: "integer",
        description: "Price floor in Australian cents.",
        minimum: 0,
        maximum: MAX_PRICE_CENTS,
      },
      styleTags: STYLE_TAGS_PROPERTY,
      includeClearances: {
        type: "boolean",
        description:
          "When true, maxWidthMm and maxDepthMm must accommodate the item plus the clearance it needs to be usable, not just its bare footprint.",
      },
      mustFitThroughMm: millimetres(
        "Narrowest doorway the item has to be carried through, in millimetres. Defaults to the room's narrowest door when omitted.",
        300,
        4000,
      ),
      limit: {
        type: "integer",
        description: "Maximum number of results to return.",
        minimum: 1,
        maximum: 50,
        default: 12,
      },
    },
    additionalProperties: false,
  },
  annotations: READ_ONLY,
  execute: (args) => {
    const state = plannerState();
    const doorWidth = narrowestDoorWidth(state.room);
    const mustFitThroughMm =
      optionalInteger(args, "mustFitThroughMm", 300, 4000) ??
      (doorWidth === null
        ? undefined
        : doorWidth - STANDARDS.DOOR_FIT_TOLERANCE_MM);

    const matches = searchCatalog(state.catalog, {
      text: optionalString(args, "text"),
      categories: optionalEnumArray(args, "categories", PRODUCT_CATEGORIES),
      styleTags: optionalEnumArray(args, "styleTags", STYLE_TAGS),
      maxWidthMm: optionalInteger(args, "maxWidthMm", 100, MAX_ROOM_DIMENSION_MM),
      maxDepthMm: optionalInteger(args, "maxDepthMm", 100, MAX_ROOM_DIMENSION_MM),
      minWidthMm: optionalInteger(args, "minWidthMm", 100, MAX_ROOM_DIMENSION_MM),
      maxHeightMm: optionalInteger(args, "maxHeightMm", 10, 4000),
      maxPriceCents: optionalInteger(args, "maxPriceCents", 0, MAX_PRICE_CENTS),
      minPriceCents: optionalInteger(args, "minPriceCents", 0, MAX_PRICE_CENTS),
      includeClearances: args.includeClearances === true,
      mustFitThroughMm,
      limit: optionalInteger(args, "limit", 1, 50) ?? 12,
    });

    return toolResult({
      count: matches.length,
      filteredByDoorWidthMm: mustFitThroughMm ?? null,
      results: matches.map(({ product, envelope }) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        categoryLabel: CATEGORY_LABELS[product.category],
        widthMm: product.widthMm,
        depthMm: product.depthMm,
        heightMm: product.heightMm,
        priceCents: product.priceCents,
        price: formatAud(product.priceCents),
        styleTags: product.styleTags,
        blurb: product.blurb,
        smallestCrossSectionMm: smallestCrossSection(product),
        clearances: product.clearances,
        totalFootprintWithClearances: clearanceEnvelope(product),
        testedEnvelope: envelope,
      })),
    });
  },
};

const checkLayoutTool: ToolDescriptor = {
  name: "check_layout",
  description:
    "Validate the current layout against real circulation standards and return every violation as a structured finding with a code, a severity, the placements involved, and the measured against required millimetres. Call this after placing or moving anything to see whether the change works.",
  inputSchema: EMPTY_SCHEMA,
  annotations: READ_ONLY,
  execute: () => {
    const state = plannerState();
    const { findings, summary } = checkLayout(
      state.room,
      state.placements,
      state.catalog,
    );
    return toolResult({
      passes: summary.passes,
      summary,
      standards: STANDARDS,
      findings,
    });
  },
};

const getCostBreakdown: ToolDescriptor = {
  name: "get_cost_breakdown",
  description:
    "Read the itemised cost of everything currently placed, subtotalled by category and compared against the budget if one is set.",
  inputSchema: EMPTY_SCHEMA,
  annotations: READ_ONLY,
  execute: () => {
    const state = plannerState();
    return toolResult(
      buildCostBreakdown(state.placements, state.catalog, state.budgetCents),
    );
  },
};

export const READ_TOOLS: readonly ToolDescriptor[] = [
  getRoom,
  listPlacements,
  searchCatalogTool,
  checkLayoutTool,
  getCostBreakdown,
];
