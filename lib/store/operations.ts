import { summariseFindings } from "../clearance/findings";
import { findingsForPlacement } from "../clearance/checkLayout";
import type { Placement } from "../domain/placement";
import type { StyleTag } from "../domain/product";
import { createRectangularRoom, type Room } from "../domain/room";
import type { Rotation } from "../geometry/rotation";
import type { Cents, Mm } from "../domain/units";
import { proposeFurnish, type RoomFunction } from "../studio/furnish";
import {
  failure,
  findingDelta,
  nextPlacementId,
  type MutationResult,
} from "./results";
import { NO_ROOM_DEFINED } from "./defaults";
import { logActivity, patchPlanner, plannerState } from "./store";
import {
  EMPTY_FINDING_SUMMARY,
  findPlacement,
  findingsFor,
  findingsForLayout,
  placementViews,
  productExists,
  toPlacementView,
} from "./views";
import type { ActivitySource } from "./types";

interface CommitInput {
  placements: readonly Placement[];
  focusPlacementId: string | null;
  summary: string;
  source: ActivitySource;
  nextSeq?: number;
  selectedPlacementId?: string | null;
}

/**
 * Applies a new placement list and reports the findings the change introduced.
 * Checking before and after is what turns a bare acknowledgement into feedback
 * an agent can act on.
 */
function commit(input: CommitInput): MutationResult {
  const state = plannerState();
  const before = findingsFor(state);
  const after = findingsForLayout(state, input.placements);

  patchPlanner({
    placements: input.placements,
    ...(input.nextSeq === undefined ? {} : { nextPlacementSeq: input.nextSeq }),
    ...(input.selectedPlacementId === undefined
      ? {}
      : { selectedPlacementId: input.selectedPlacementId }),
    // Any layout edit invalidates a pending purchase confirmation.
    checkoutState: "idle",
    checkoutRequest: null,
  });
  logActivity(input.source, input.summary);

  const relevant = new Set(findingDelta(before, after));
  if (input.focusPlacementId) {
    // Pre-existing problems the edited item is now part of matter just as much
    // as brand new ones, so the agent sees the full consequence of its edit.
    for (const finding of findingsForPlacement(after, input.focusPlacementId)) {
      relevant.add(finding);
    }
  }

  const nextState = plannerState();
  const focused = input.focusPlacementId
    ? input.placements.find((placement) => placement.id === input.focusPlacementId)
    : undefined;
  const view = focused ? toPlacementView(focused, nextState.catalog) : null;

  return {
    ok: true,
    summary: input.summary,
    ...(view ? { placement: view } : {}),
    placements: placementViews(nextState),
    introducedFindings: [...relevant],
    allFindings: after,
    findingSummary: summariseFindings(after),
  };
}

export interface DefineRoomInput {
  name?: string;
  widthMm: Mm;
  depthMm: Mm;
  openings?: Room["openings"];
  obstructions?: Room["obstructions"];
  keepPlacements?: boolean;
  source?: ActivitySource;
}

export interface PatchRoomInput {
  name?: string;
  widthMm?: Mm;
  depthMm?: Mm;
  source?: ActivitySource;
}

function missingRoom(): MutationResult {
  return failure(NO_ROOM_DEFINED, EMPTY_FINDING_SUMMARY);
}

function roomSummary(input: {
  previous: Room | null;
  name: string;
  widthMm: Mm;
  depthMm: Mm;
  openingCount: number;
  obstructionCount: number;
}): string {
  const { previous, name, widthMm, depthMm, openingCount, obstructionCount } = input;
  const sizeChanged =
    !previous || previous.widthMm !== widthMm || previous.depthMm !== depthMm;
  const nameChanged = Boolean(previous && previous.name !== name);

  if (previous && nameChanged && !sizeChanged) {
    return `Renamed the room to ${name}.`;
  }
  if (previous && !nameChanged && sizeChanged) {
    return `Room set to ${widthMm}mm × ${depthMm}mm.`;
  }
  return (
    `Room set to ${widthMm}mm × ${depthMm}mm with ` +
    `${openingCount} opening(s) and ${obstructionCount} obstruction(s).`
  );
}

export function defineRoom(input: DefineRoomInput): MutationResult {
  const state = plannerState();
  const previous = state.room;
  const name = input.name?.trim();
  const room = createRectangularRoom({
    name: name && name.length > 0 ? name : "Room",
    widthMm: input.widthMm,
    depthMm: input.depthMm,
    openings: input.openings ?? [],
    obstructions: input.obstructions ?? [],
  });

  const placements = input.keepPlacements ? state.placements : [];
  patchPlanner({ room, placements, checkoutState: "idle", checkoutRequest: null });

  const after = findingsForLayout(plannerState(), placements);
  const summary = roomSummary({
    previous,
    name: room.name,
    widthMm: input.widthMm,
    depthMm: input.depthMm,
    openingCount: room.openings.length,
    obstructionCount: room.obstructions.length,
  });
  logActivity(input.source ?? "agent", summary);

  return {
    ok: true,
    summary,
    placements: placementViews(plannerState()),
    introducedFindings: after,
    allFindings: after,
    findingSummary: summariseFindings(after),
  };
}

/**
 * Shopper-facing room edit. Creates the room when the studio is empty, or
 * updates name/size while keeping openings, obstructions, and furniture.
 */
export function patchRoom(input: PatchRoomInput): MutationResult {
  const state = plannerState();
  const room = state.room;
  if (!room) {
    if (input.widthMm === undefined || input.depthMm === undefined) {
      return missingRoom();
    }
    return defineRoom({
      name: input.name,
      widthMm: input.widthMm,
      depthMm: input.depthMm,
      source: input.source ?? "user",
    });
  }

  return defineRoom({
    name: input.name ?? room.name,
    widthMm: input.widthMm ?? room.widthMm,
    depthMm: input.depthMm ?? room.depthMm,
    openings: room.openings,
    obstructions: room.obstructions,
    keepPlacements: true,
    source: input.source ?? "user",
  });
}

export interface PlaceItemInput {
  productId: string;
  x: Mm;
  y: Mm;
  rotation: Rotation;
  note?: string;
  source?: ActivitySource;
}

export function placeItem(input: PlaceItemInput): MutationResult {
  const state = plannerState();
  if (!state.room) return missingRoom();
  if (!productExists(state, input.productId)) {
    return failure(
      `No product with id "${input.productId}". Call search_catalog to get valid ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }

  const id = nextPlacementId(state.nextPlacementSeq);
  const placement: Placement = {
    id,
    productId: input.productId,
    x: Math.round(input.x),
    y: Math.round(input.y),
    rotation: input.rotation,
    ...(input.note === undefined ? {} : { note: input.note }),
  };

  return commit({
    placements: [...state.placements, placement],
    focusPlacementId: id,
    summary: `Placed ${input.productId} as ${id} at (${placement.x}, ${placement.y}) rotated ${placement.rotation}°.`,
    source: input.source ?? "agent",
    nextSeq: state.nextPlacementSeq + 1,
    selectedPlacementId: id,
  });
}

export interface MoveItemInput {
  placementId: string;
  x: Mm;
  y: Mm;
  source?: ActivitySource;
}

export function moveItem(input: MoveItemInput): MutationResult {
  const state = plannerState();
  if (!state.room) return missingRoom();
  const existing = findPlacement(state, input.placementId);
  if (!existing) {
    return failure(
      `No placement with id "${input.placementId}". Call list_placements for current ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }

  const x = Math.round(input.x);
  const y = Math.round(input.y);
  return commit({
    placements: state.placements.map((placement) =>
      placement.id === input.placementId ? { ...placement, x, y } : placement,
    ),
    focusPlacementId: input.placementId,
    summary: `Moved ${input.placementId} from (${existing.x}, ${existing.y}) to (${x}, ${y}).`,
    source: input.source ?? "agent",
  });
}

export interface RotateItemInput {
  placementId: string;
  rotation: Rotation;
  source?: ActivitySource;
}

export function rotateItem(input: RotateItemInput): MutationResult {
  const state = plannerState();
  if (!state.room) return missingRoom();
  const existing = findPlacement(state, input.placementId);
  if (!existing) {
    return failure(
      `No placement with id "${input.placementId}". Call list_placements for current ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }

  return commit({
    placements: state.placements.map((placement) =>
      placement.id === input.placementId
        ? { ...placement, rotation: input.rotation }
        : placement,
    ),
    focusPlacementId: input.placementId,
    summary: `Rotated ${input.placementId} from ${existing.rotation}° to ${input.rotation}°.`,
    source: input.source ?? "agent",
  });
}

export function removeItem(
  placementId: string,
  source: ActivitySource = "agent",
): MutationResult {
  const state = plannerState();
  if (!state.room) return missingRoom();
  const existing = findPlacement(state, placementId);
  if (!existing) {
    return failure(
      `No placement with id "${placementId}". Call list_placements for current ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }

  const result = commit({
    placements: state.placements.filter((placement) => placement.id !== placementId),
    focusPlacementId: null,
    summary: `Removed ${placementId} (${existing.productId}).`,
    source,
    selectedPlacementId:
      state.selectedPlacementId === placementId ? null : state.selectedPlacementId,
  });
  return result;
}

export interface SwapProductInput {
  placementId: string;
  productId: string;
  source?: ActivitySource;
}

export function swapProduct(input: SwapProductInput): MutationResult {
  const state = plannerState();
  if (!state.room) return missingRoom();
  const existing = findPlacement(state, input.placementId);
  if (!existing) {
    return failure(
      `No placement with id "${input.placementId}". Call list_placements for current ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }
  if (!productExists(state, input.productId)) {
    return failure(
      `No product with id "${input.productId}". Call search_catalog to get valid ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }

  return commit({
    placements: state.placements.map((placement) =>
      placement.id === input.placementId
        ? { ...placement, productId: input.productId }
        : placement,
    ),
    focusPlacementId: input.placementId,
    summary: `Swapped ${input.placementId} from ${existing.productId} to ${input.productId}, keeping its position.`,
    source: input.source ?? "agent",
  });
}

export interface ApplyLayoutItem {
  productId: string;
  x: Mm;
  y: Mm;
  rotation: Rotation;
  note?: string;
}

export function applyLayout(
  items: readonly ApplyLayoutItem[],
  replaceExisting: boolean,
): MutationResult {
  const state = plannerState();
  if (!state.room) return missingRoom();

  const unknown = items
    .map((item) => item.productId)
    .filter((productId) => !productExists(state, productId));
  if (unknown.length > 0) {
    return failure(
      `Unknown product id(s): ${[...new Set(unknown)].join(", ")}. Call search_catalog to get valid ids.`,
      EMPTY_FINDING_SUMMARY,
    );
  }

  let seq = state.nextPlacementSeq;
  const added: Placement[] = items.map((item) => {
    const placement: Placement = {
      id: nextPlacementId(seq),
      productId: item.productId,
      x: Math.round(item.x),
      y: Math.round(item.y),
      rotation: item.rotation,
      ...(item.note === undefined ? {} : { note: item.note }),
    };
    seq += 1;
    return placement;
  });

  const placements = replaceExisting ? added : [...state.placements, ...added];
  return commit({
    placements,
    focusPlacementId: null,
    summary:
      `Applied a layout of ${added.length} item(s), ` +
      `${replaceExisting ? "replacing" : "adding to"} what was there.`,
    source: "agent",
    nextSeq: seq,
    selectedPlacementId: null,
  });
}

export function setBudget(budgetCents: Cents | null): void {
  patchPlanner({ budgetCents });
  logActivity(
    "agent",
    budgetCents === null ? "Cleared the budget." : `Budget set to ${budgetCents} cents.`,
  );
}

export function selectPlacement(placementId: string | null): void {
  patchPlanner({ selectedPlacementId: placementId });
}

export interface FurnishRoomInput {
  roomFunction: RoomFunction;
  theme?: StyleTag;
  budgetCents?: Cents | null;
  replaceExisting?: boolean;
}

/**
 * Agent-facing convenience: pick catalog pieces for a room function + theme,
 * place them, and return findings so the agent can refine in the 3D studio.
 */
export function furnishRoom(input: FurnishRoomInput): MutationResult & {
  notes: string[];
  proposalTotalCents: Cents;
} {
  const state = plannerState();
  if (!state.room) {
    return {
      ...missingRoom(),
      notes: [],
      proposalTotalCents: 0 as Cents,
    };
  }

  const proposal = proposeFurnish({
    room: state.room,
    catalog: state.catalog,
    roomFunction: input.roomFunction,
    theme: input.theme,
    budgetCents: input.budgetCents,
  });

  if (proposal.items.length === 0) {
    return {
      ...failure(
        proposal.notes.join(" ") || "No furniture could be placed.",
        EMPTY_FINDING_SUMMARY,
      ),
      notes: proposal.notes,
      proposalTotalCents: proposal.totalCents,
    };
  }

  if (input.budgetCents !== undefined) {
    setBudget(input.budgetCents);
  }

  const result = applyLayout(proposal.items, input.replaceExisting ?? true);
  return {
    ...result,
    summary:
      `${result.summary} Function=${input.roomFunction}` +
      `${input.theme ? `, theme=${input.theme}` : ""}.`,
    notes: proposal.notes,
    proposalTotalCents: proposal.totalCents,
  };
}
