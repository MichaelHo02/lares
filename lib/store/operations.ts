import { summariseFindings } from "../clearance/findings";
import { findingsForPlacement } from "../clearance/checkLayout";
import type { Placement } from "../domain/placement";
import { createRectangularRoom, type Room } from "../domain/room";
import type { Rotation } from "../geometry/rotation";
import type { Cents, Mm } from "../domain/units";
import {
  failure,
  findingDelta,
  nextPlacementId,
  type MutationResult,
} from "./results";
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
}

export function defineRoom(input: DefineRoomInput): MutationResult {
  const state = plannerState();
  const room = createRectangularRoom({
    name: input.name ?? state.room.name,
    widthMm: input.widthMm,
    depthMm: input.depthMm,
    openings: input.openings ?? [],
    obstructions: input.obstructions ?? [],
  });

  const placements = input.keepPlacements ? state.placements : [];
  patchPlanner({ room, placements, checkoutState: "idle", checkoutRequest: null });

  const after = findingsForLayout(plannerState(), placements);
  const summary =
    `Room set to ${input.widthMm}mm × ${input.depthMm}mm with ` +
    `${room.openings.length} opening(s) and ${room.obstructions.length} obstruction(s).`;
  logActivity("agent", summary);

  return {
    ok: true,
    summary,
    placements: placementViews(plannerState()),
    introducedFindings: after,
    allFindings: after,
    findingSummary: summariseFindings(after),
  };
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
