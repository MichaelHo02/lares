import { CATALOG } from "../catalog/products";
import { createRectangularRoom, type Room } from "../domain/room";
import type { PlannerState } from "./types";

export const DEFAULT_ROOM: Room = createRectangularRoom({
  name: "Living room",
  widthMm: 4200,
  depthMm: 3800,
  openings: [
    {
      id: "door-entry",
      type: "door",
      wall: "north",
      offsetMm: 400,
      widthMm: 820,
      heightMm: 2040,
      swing: { hingeSide: "start", direction: "inward" },
    },
    {
      id: "window-east",
      type: "window",
      wall: "east",
      offsetMm: 900,
      widthMm: 1800,
      heightMm: 1200,
    },
  ],
  obstructions: [],
});

export function initialPlannerState(): PlannerState {
  return {
    room: DEFAULT_ROOM,
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
