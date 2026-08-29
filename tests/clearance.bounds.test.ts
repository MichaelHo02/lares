import { describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import { createRectangularRoom } from "../lib/domain/room";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  bareRoom,
  codesOf,
  firstOf,
  makeRoom,
  place,
} from "./fixtures";

const BARE_ROOM = bareRoom();

describe("OUTSIDE_ROOM", () => {
  it("reports the worst overhang when an item hangs past a wall", () => {
    const room = makeRoom(3000, 3000, []);
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 1500, 1000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "OUTSIDE_ROOM");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(500);
    expect(finding.requiredMm).toBe(0);
    expect(finding.placementIds).toEqual(["p1"]);
    expect(finding.region).toEqual({ x: 1500, y: 1000, width: 2000, depth: 900 });
  });

  it("reports negative coordinates as an overhang too", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("p1", TEST_PRODUCTS.sofa.id, -300, 1000)],
      TEST_CATALOG,
    );
    expect(firstOf(findings, "OUTSIDE_ROOM").measuredMm).toBe(300);
  });

  it("accepts an item flush against the wall", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("OUTSIDE_ROOM");
  });

  it("accounts for rotation when testing bounds", () => {
    // A 2000 × 900 sofa cannot lie across a 1500mm-wide room, but it can along it.
    const room = makeRoom(1500, 3000, []);
    const upright = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0, 0)],
      TEST_CATALOG,
    );
    expect(codesOf(upright.findings)).toContain("OUTSIDE_ROOM");

    const turned = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 0, 0, 90)],
      TEST_CATALOG,
    );
    expect(codesOf(turned.findings)).not.toContain("OUTSIDE_ROOM");
  });
});

describe("OVERLAP", () => {
  it("flags two items sharing floor area and names both", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1200, 1100),
      ],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "OVERLAP");
    expect(finding.severity).toBe("error");
    expect(finding.placementIds).toEqual(["p1", "p2"]);
    expect(finding.measuredMm).toBe(300);
  });

  it("does not flag items that merely touch", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 0, 0),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1500, 0),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("OVERLAP");
  });

  it("lets furniture sit on top of a rug", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("rug", TEST_PRODUCTS.rug.id, 1000, 1000),
        place("sofa", TEST_PRODUCTS.sofa.id, 1200, 1200),
      ],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("OVERLAP");
  });
});

describe("OBSTRUCTION_CONFLICT", () => {
  const bulkheadRoom = createRectangularRoom({
    name: "Bulkhead Room",
    widthMm: 6000,
    depthMm: 6000,
    obstructions: [
      {
        id: "bulk-1",
        label: "corner bulkhead",
        kind: "bulkhead",
        x: 5400,
        y: 0,
        widthMm: 600,
        depthMm: 600,
      },
    ],
  });

  it("flags furniture clashing with a fixed bulkhead", () => {
    const { findings } = checkLayout(
      bulkheadRoom,
      [place("p1", TEST_PRODUCTS.wardrobe.id, 4200, 0)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "OBSTRUCTION_CONFLICT");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(300);
    expect(finding.message).toContain("bulkhead");
    expect(finding.region).toEqual({ x: 5400, y: 0, width: 300, depth: 600 });
  });

  it("does not flag furniture that stops exactly at the obstruction", () => {
    const { findings } = checkLayout(
      bulkheadRoom,
      [place("p1", TEST_PRODUCTS.wardrobe.id, 3900, 0)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("OBSTRUCTION_CONFLICT");
  });
});
