import { describe, expect, it } from "vitest";
import { checkLayout, findingsForPlacement } from "../lib/clearance/checkLayout";
import { STANDARDS } from "../lib/clearance/standards";
import { createRectangularRoom } from "../lib/domain/room";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  bareRoom,
  codesOf,
  findingsOf,
  firstOf,
  place,
} from "./fixtures";

const BARE_ROOM = bareRoom();

describe("CHAIR_PULLOUT_INSUFFICIENT", () => {
  it("errors when furniture stands in the pull-out zone and names the blocker", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 2000, 3200),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(finding.severity).toBe("error");
    expect(finding.requiredMm).toBe(STANDARDS.DINING_PULLOUT_MM);
    expect(finding.measuredMm).toBe(300);
    expect(finding.placementIds).toEqual(["table", "shelf"]);
  });

  it("only warns when a wall is what limits the side, since it is not a seating side", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("table", TEST_PRODUCTS.diningTable.id, 0, 2000)],
      TEST_CATALOG,
    );
    const pullouts = findingsOf(findings, "CHAIR_PULLOUT_INSUFFICIENT");
    expect(pullouts.length).toBeGreaterThan(0);
    for (const finding of pullouts) {
      expect(finding.severity).toBe("warning");
    }
  });

  it("lets dining chairs occupy the pull-out zone they exist for", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000),
        place("chair", TEST_PRODUCTS.diningChair.id, 2200, 2950),
      ],
      TEST_CATALOG,
    );
    const blamed = findingsOf(
      findingsForPlacement(findings, "chair"),
      "CHAIR_PULLOUT_INSUFFICIENT",
    );
    expect(blamed).toEqual([]);
  });

  it("passes cleanly with 900mm clear on every side", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("CHAIR_PULLOUT_INSUFFICIENT");
  });

  it("follows rotation, so a turned table is judged on its turned sides", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        // Rotated 90, the table's front faces west, so the west gap is the one judged.
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000, 90),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 900, 2000),
      ],
      TEST_CATALOG,
    );
    expect(firstOf(findings, "CHAIR_PULLOUT_INSUFFICIENT").measuredMm).toBe(300);
  });

  it("lets a rug lie in the pull-out zone", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("table", TEST_PRODUCTS.diningTable.id, 2000, 2000),
        place("rug", TEST_PRODUCTS.rug.id, 1800, 1800),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("CHAIR_PULLOUT_INSUFFICIENT");
  });
});

describe("CLEARANCE_ZONE_BLOCKED", () => {
  it("errors when a wardrobe cannot open its doors against a wall", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      // Front faces north at rotation 180, leaving only 400mm to the north wall.
      [place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 400, 180)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(400);
    expect(finding.requiredMm).toBe(600);
  });

  it("passes a wardrobe with its back to the wall and its doors facing the room", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 0, 0)],
      TEST_CATALOG,
    );
    expect(findingsForPlacement(findings, "wardrobe")).toEqual([]);
  });

  it("errors when another item stands in front of a wardrobe", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1000, 0, 0),
        place("shelf", TEST_PRODUCTS.bookshelf.id, 1200, 900, 0),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(300);
    expect(finding.placementIds).toContain("shelf");
  });

  it("warns rather than errors when a wall limits a shelf's reach zone", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("shelf", TEST_PRODUCTS.bookshelf.id, 1000, 5500, 0)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "CLEARANCE_ZONE_BLOCKED");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(200);
    expect(finding.requiredMm).toBe(350);
  });
});

describe("BED_SIDE_ACCESS_BLOCKED", () => {
  it("errors when a queen bed has no clear side at all", () => {
    const room = createRectangularRoom({
      name: "Tight Bedroom",
      widthMm: 2400,
      depthMm: 4000,
    });
    const { findings } = checkLayout(
      room,
      [
        place("bed", TEST_PRODUCTS.queenBed.id, 400, 500),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 2050, 500, 90),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.severity).toBe("error");
    expect(finding.requiredMm).toBe(STANDARDS.BED_SIDE_ACCESS_MM);
  });

  it("warns when a queen bed is pushed against one wall", () => {
    const room = createRectangularRoom({ name: "Bedroom", widthMm: 3000, depthMm: 4000 });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.queenBed.id, 0, 500)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.severity).toBe("warning");
    expect(finding.measuredMm).toBe(0);
  });

  it("accepts a single bed against a wall, which only needs one side", () => {
    const room = createRectangularRoom({ name: "Kids Room", widthMm: 3000, depthMm: 4000 });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.singleBed.id, 0, 500)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("BED_SIDE_ACCESS_BLOCKED");
  });

  it("errors when even a single bed has both sides blocked", () => {
    const room = createRectangularRoom({ name: "Box Room", widthMm: 1990, depthMm: 4000 });
    const { findings } = checkLayout(
      room,
      [
        place("bed", TEST_PRODUCTS.singleBed.id, 500, 500),
        place("wardrobe", TEST_PRODUCTS.wardrobe.id, 1690, 500, 90),
      ],
      TEST_CATALOG,
    );
    expect(firstOf(findings, "BED_SIDE_ACCESS_BLOCKED").severity).toBe("error");
  });

  it("lets a bedside table sit in the access zone", () => {
    const room = createRectangularRoom({ name: "Bedroom", widthMm: 4000, depthMm: 4000 });
    const { findings } = checkLayout(
      room,
      [
        place("bed", TEST_PRODUCTS.queenBed.id, 1000, 500),
        place("table", TEST_PRODUCTS.bedsideTable.id, 500, 500),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("BED_SIDE_ACCESS_BLOCKED");
  });

  it("passes a queen bed with both sides clear", () => {
    const room = createRectangularRoom({ name: "Bedroom", widthMm: 4000, depthMm: 4000 });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.queenBed.id, 1100, 500)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("BED_SIDE_ACCESS_BLOCKED");
  });

  it("follows rotation, judging a turned bed on its turned long sides", () => {
    const room = createRectangularRoom({ name: "Bedroom", widthMm: 4000, depthMm: 4000 });
    const { findings } = checkLayout(
      room,
      [place("bed", TEST_PRODUCTS.queenBed.id, 900, 0, 90)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "BED_SIDE_ACCESS_BLOCKED");
    expect(finding.measuredMm).toBe(0);
    expect(finding.message).toContain("north");
  });
});
