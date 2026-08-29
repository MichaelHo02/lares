import { beforeEach, describe, expect, it } from "vitest";
import { initialPlannerState } from "../lib/store/defaults";
import { usePlannerStore } from "../lib/store/store";
import { LARES_TOOLS } from "../lib/webmcp/tools";

const context = { signal: new AbortController().signal };

async function callTool(name: string, args: Record<string, unknown>) {
  const tool = LARES_TOOLS.find((entry) => entry.name === name);
  if (!tool) throw new Error(`missing tool ${name}`);
  const raw = await tool.execute(args, context);
  return JSON.parse(raw) as Record<string, unknown>;
}

describe("WebMCP tool create/inspect/refine loop", () => {
  beforeEach(() => {
    usePlannerStore.setState(initialPlannerState());
  });

  it("exposes the studio tool surface the agent needs", () => {
    const names = LARES_TOOLS.map((tool) => tool.name);
    for (const required of [
      "define_room",
      "furnish_room",
      "get_room",
      "list_placements",
      "search_catalog",
      "check_layout",
      "get_cost_breakdown",
      "move_item",
      "rotate_item",
      "place_item",
    ]) {
      expect(names).toContain(required);
    }
  });

  it("runs define → furnish → inspect → refine through tool execute handlers", async () => {
    const defined = await callTool("define_room", {
      name: "Agent living",
      widthMm: 4200,
      depthMm: 3800,
      openings: [
        {
          type: "door",
          wall: "north",
          offsetMm: 400,
          widthMm: 820,
          hingeSide: "start",
          swingDirection: "inward",
        },
        { type: "window", wall: "east", offsetMm: 900, widthMm: 1800 },
      ],
    });
    expect(defined.ok).toBe(true);

    const room = await callTool("get_room", {});
    expect(room.name).toBe("Agent living");
    expect(room.widthMm).toBe(4200);

    const furnished = await callTool("furnish_room", {
      roomFunction: "living_room",
      theme: "warm timber",
      budgetCents: 350000,
      replaceExisting: true,
    });
    expect(furnished.ok).toBe(true);

    const listed = await callTool("list_placements", {});
    const placements = listed.placements as { id: string; x: number; y: number }[];
    expect(placements.length).toBeGreaterThanOrEqual(2);

    const checked = await callTool("check_layout", {});
    expect(Array.isArray(checked.findings)).toBe(true);

    const first = placements[0];
    const moved = await callTool("move_item", {
      placementId: first.id,
      x: Math.max(200, first.x - 50),
      y: first.y,
    });
    expect(moved.ok).toBe(true);

    const cost = await callTool("get_cost_breakdown", {});
    expect(typeof cost.itemCount).toBe("number");
    expect(typeof cost.totalCents).toBe("number");
  });
});
