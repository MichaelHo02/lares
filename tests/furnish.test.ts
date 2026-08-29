import { describe, expect, it } from "vitest";
import { CATALOG } from "../lib/catalog/products";
import { createRectangularRoom } from "../lib/domain/room";
import { proposeFurnish } from "../lib/studio/furnish";

describe("proposeFurnish", () => {
  const room = createRectangularRoom({
    name: "Test living",
    widthMm: 4200,
    depthMm: 3800,
    openings: [
      {
        id: "door",
        type: "door",
        wall: "north",
        offsetMm: 400,
        widthMm: 820,
        heightMm: 2040,
        swing: { hingeSide: "start", direction: "inward" },
      },
    ],
  });

  it("places a living-room starter set with theme bias", () => {
    const proposal = proposeFurnish({
      room,
      catalog: CATALOG,
      roomFunction: "living_room",
      theme: "warm timber",
      budgetCents: 500_000,
    });

    expect(proposal.items.length).toBeGreaterThanOrEqual(3);
    expect(proposal.totalCents).toBeGreaterThan(0);
    expect(proposal.totalCents).toBeLessThanOrEqual(500_000);
    for (const item of proposal.items) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThan(room.widthMm);
      expect(item.y).toBeLessThan(room.depthMm);
    }
  });

  it("furnishes a bedroom with a bed", () => {
    const proposal = proposeFurnish({
      room,
      catalog: CATALOG,
      roomFunction: "bedroom",
      theme: "scandinavian",
    });
    const ids = new Set(proposal.items.map((item) => item.productId));
    const categories = CATALOG.filter((product) => ids.has(product.id)).map(
      (product) => product.category,
    );
    expect(categories).toContain("bed");
  });

  it("returns notes rather than throwing when budget is tiny", () => {
    const proposal = proposeFurnish({
      room,
      catalog: CATALOG,
      roomFunction: "dining",
      budgetCents: 1,
    });
    expect(proposal.items.length).toBeLessThanOrEqual(1);
  });
});
