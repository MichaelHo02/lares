import { beforeEach, describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import { defineRoom, furnishRoom } from "../lib/store/operations";
import { usePlannerStore } from "../lib/store/store";
import { initialPlannerState } from "../lib/store/defaults";

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
  });
});
