import { beforeEach, describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import { formatMetresInput, parseRoomDimensionToMm } from "../lib/domain/units";
import { defineRoom, furnishRoom, patchRoom, placeItem } from "../lib/store/operations";
import { usePlannerStore } from "../lib/store/store";
import { initialPlannerState } from "../lib/store/defaults";
import { MAX_ROOM_DIMENSION_MM, MIN_ROOM_DIMENSION_MM } from "../lib/webmcp/schema";

describe("room dimension parsing", () => {
  it("reads metres when the number is small and millimetres when it is large", () => {
    expect(parseRoomDimensionToMm("4.2", MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM)).toBe(
      4200,
    );
    expect(parseRoomDimensionToMm("4200", MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM)).toBe(
      4200,
    );
    expect(parseRoomDimensionToMm("0.5", MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM)).toBeNull();
    expect(formatMetresInput(4200)).toBe("4.2");
  });
});

describe("agent studio flow (store)", () => {
  beforeEach(() => {
    usePlannerStore.setState(initialPlannerState());
  });

  it("starts with no room so describing the space is the first step", () => {
    const state = usePlannerStore.getState();
    expect(state.room).toBeNull();
    expect(state.placements).toEqual([]);
  });

  it("define_room then furnish_room updates the shared studio state", () => {
    const roomResult = defineRoom({
      name: "Studio living",
      widthMm: 4500,
      depthMm: 4000,
      openings: [
        {
          id: "door-entry",
          type: "door",
          wall: "north",
          offsetMm: 500,
          widthMm: 900,
          heightMm: 2040,
          swing: { hingeSide: "start", direction: "inward" },
        },
        {
          id: "window-east",
          type: "window",
          wall: "east",
          offsetMm: 800,
          widthMm: 1600,
          heightMm: 1200,
        },
      ],
      keepPlacements: false,
    });
    expect(roomResult.ok).toBe(true);
    expect(usePlannerStore.getState().room?.name).toBe("Studio living");
    expect(usePlannerStore.getState().room?.openings).toHaveLength(2);

    const furnished = furnishRoom({
      roomFunction: "living_room",
      theme: "warm timber",
      budgetCents: 400_000,
      replaceExisting: true,
    });
    expect(furnished.ok).toBe(true);
    expect(furnished.notes).toBeDefined();

    const state = usePlannerStore.getState();
    expect(state.room).not.toBeNull();
    expect(state.placements.length).toBeGreaterThanOrEqual(3);
    expect(state.budgetCents).toBe(400_000);

    const findings = checkLayout(state.room!, state.placements, state.catalog).findings;
    // Findings may be non-empty — that is the inspect/refine signal for the agent.
    expect(Array.isArray(findings)).toBe(true);
    expect(furnished.allFindings).toBeDefined();
    expect(usePlannerStore.getState().activity.at(-1)?.source).toBe("agent");
  });

  it("lets a shopper define and rename the room on the same store path", () => {
    const created = patchRoom({
      name: "Living",
      widthMm: 4200,
      depthMm: 3800,
      source: "user",
    });
    expect(created.ok).toBe(true);
    expect(usePlannerStore.getState().room?.name).toBe("Living");
    expect(usePlannerStore.getState().activity.at(-1)?.source).toBe("user");

    const placed = placeItem({
      productId: "aldsjo-2-seat-sofa",
      x: 400,
      y: 400,
      rotation: 0,
      source: "user",
    });
    expect(placed.ok).toBe(true);

    const renamed = patchRoom({ name: "Dining", source: "user" });
    expect(renamed.ok).toBe(true);
    expect(usePlannerStore.getState().room?.name).toBe("Dining");
    expect(usePlannerStore.getState().room?.widthMm).toBe(4200);
    expect(usePlannerStore.getState().placements).toHaveLength(1);
    expect(usePlannerStore.getState().activity.at(-1)?.summary).toMatch(/Renamed/);

    const resized = patchRoom({ widthMm: 5000, depthMm: 4000, source: "user" });
    expect(resized.ok).toBe(true);
    expect(usePlannerStore.getState().room?.depthMm).toBe(4000);
    expect(usePlannerStore.getState().placements).toHaveLength(1);
  });
});
