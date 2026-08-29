import { create } from "zustand";
import { initialPlannerState } from "./defaults";
import { activityId } from "./results";
import type { ActivitySource, PlannerState } from "./types";

interface PlannerActions {
  /** Replace state wholesale; operations build the next state themselves. */
  patch: (partial: Partial<PlannerState>) => void;
  log: (source: ActivitySource, summary: string) => void;
  reset: () => void;
}

export type PlannerStore = PlannerState & PlannerActions;

/** Newer entries are appended; older ones fall off the front. */
const ACTIVITY_LIMIT = 40;

export const usePlannerStore = create<PlannerStore>((set) => ({
  ...initialPlannerState(),

  patch: (partial) => set(partial),

  log: (source, summary) =>
    set((state) => {
      const at = Date.now();
      const entry = {
        id: activityId(state.activity.length, at),
        at,
        source,
        summary,
      };
      const activity = [...state.activity, entry];
      return { activity: activity.slice(-ACTIVITY_LIMIT) };
    }),

  reset: () => set(initialPlannerState()),
}));

export function plannerState(): PlannerState {
  return usePlannerStore.getState();
}

export function patchPlanner(partial: Partial<PlannerState>): void {
  usePlannerStore.getState().patch(partial);
}

export function logActivity(source: ActivitySource, summary: string): void {
  usePlannerStore.getState().log(source, summary);
}
