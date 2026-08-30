import { CATALOG } from "../catalog/products";
import type { PlannerState } from "./types";

/** Returned by tools and mutations when the studio has no room yet. */
export const NO_ROOM_DEFINED =
  "No room is defined yet. Call define_room from the user's description of the space before placing furniture.";

export function initialPlannerState(): PlannerState {
  return {
    room: null,
    placements: [],
    catalog: CATALOG,
    budgetCents: null,
    selectedPlacementId: null,
    checkoutState: "idle",
    checkoutRequest: null,
    nextPlacementSeq: 1,
    activity: [],
  };
}
