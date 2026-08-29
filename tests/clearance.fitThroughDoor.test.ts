import { describe, expect, it } from "vitest";
import { checkLayout } from "../lib/clearance/checkLayout";
import { STANDARDS } from "../lib/clearance/standards";
import { createRectangularRoom } from "../lib/domain/room";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  aDoor,
  aProduct,
  catalogOf,
  codesOf,
  findingsOf as of,
  firstOf,
  makeRoom,
  place,
} from "./fixtures";

describe("WONT_FIT_THROUGH_DOOR", () => {
  it("rejects an item whose smallest cross-section exceeds the door", () => {
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.bulkySectional.id, 2000, 2000)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "WONT_FIT_THROUGH_DOOR");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBe(900);
    expect(finding.requiredMm).toBe(820 - STANDARDS.DOOR_FIT_TOLERANCE_MM);
  });

  it("accepts an item that can be tilted through, judged on its smallest dimension", () => {
    // 1100 × 600 × 400: too wide to carry upright, but 400mm on its side.
    const { findings } = checkLayout(
      makeRoom(6000, 6000),
      [place("p1", TEST_PRODUCTS.coffeeTable.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WONT_FIT_THROUGH_DOOR");
  });

  it("lets an item in through the widest door when a room has several", () => {
    const room = makeRoom(6000, 6000, [
      {
        id: "wide",
        type: "door",
        wall: "north",
        offsetMm: 200,
        widthMm: 890,
        heightMm: 2040,
        swing: { hingeSide: "start", direction: "outward" },
      },
      {
        id: "narrow",
        type: "door",
        wall: "south",
        offsetMm: 200,
        widthMm: 720,
        heightMm: 2040,
        swing: { hingeSide: "start", direction: "outward" },
      },
    ]);
    const fits = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.sofa.id, 2500, 2500)],
      TEST_CATALOG,
    );
    expect(codesOf(fits.findings)).not.toContain("WONT_FIT_THROUGH_DOOR");

    const tooBig = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.bulkySectional.id, 2500, 2500)],
      TEST_CATALOG,
    );
    const finding = firstOf(tooBig.findings, "WONT_FIT_THROUGH_DOOR");
    expect(finding.measuredMm).toBe(900);
    expect(finding.requiredMm).toBe(880);
  });

  it("skips the check entirely for a room with no doors", () => {
    const { findings } = checkLayout(
      makeRoom(6000, 6000, []),
      [place("p1", TEST_PRODUCTS.bulkySectional.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WONT_FIT_THROUGH_DOOR");
  });

  it("ignores windows, which nothing is carried through", () => {
    const room = makeRoom(6000, 6000, [
      {
        id: "big-window",
        type: "window",
        wall: "east",
        offsetMm: 500,
        widthMm: 2400,
        heightMm: 1500,
      },
    ]);
    const { findings } = checkLayout(
      room,
      [place("p1", TEST_PRODUCTS.bulkySectional.id, 2000, 2000)],
      TEST_CATALOG,
    );
    expect(codesOf(findings)).not.toContain("WONT_FIT_THROUGH_DOOR");
  });
});
describe("WONT_FIT_THROUGH_DOOR boundary", () => {
  const usableMm = 820 - STANDARDS.DOOR_FIT_TOLERANCE_MM;
  const flatPack = aProduct({
    id: "flat-pack",
    name: "Flat Pack Wardrobe",
    category: "wardrobe",
    widthMm: 2400,
    depthMm: 1200,
    heightMm: usableMm,
  });
  const rigidBox = aProduct({
    id: "rigid-box",
    name: "Rigid Cabinet",
    category: "wardrobe",
    widthMm: 2400,
    depthMm: 1200,
    heightMm: usableMm + 1,
  });
  const room = createRectangularRoom({
    name: "Delivery Room",
    widthMm: 6000,
    depthMm: 6000,
    openings: [aDoor({ id: "door", offsetMm: 2000, swing: undefined })],
  });

  it("accepts an item whose smallest cross-section exactly equals the usable width", () => {
    const { findings } = checkLayout(
      room,
      [place("p1", flatPack.id, 1000, 1000)],
      catalogOf(flatPack),
    );
    expect(of(findings, "WONT_FIT_THROUGH_DOOR")).toEqual([]);
  });

  it("rejects it one millimetre thicker", () => {
    const { findings } = checkLayout(
      room,
      [place("p1", rigidBox.id, 1000, 1000)],
      catalogOf(rigidBox),
    );
    const [finding] = of(findings, "WONT_FIT_THROUGH_DOOR");
    expect(finding.measuredMm).toBe(usableMm + 1);
    expect(finding.requiredMm).toBe(usableMm);
  });

  it("admits the item through the widest of several doors", () => {
    const twoDoors = createRectangularRoom({
      name: "Two Door Room",
      widthMm: 6000,
      depthMm: 6000,
      openings: [
        aDoor({ id: "narrow", wall: "south", offsetMm: 1000, widthMm: 700, swing: undefined }),
        aDoor({ id: "wide", offsetMm: 2000, widthMm: 900, swing: undefined }),
      ],
    });
    const { findings } = checkLayout(
      twoDoors,
      [place("p1", rigidBox.id, 1000, 1000)],
      catalogOf(rigidBox),
    );
    expect(of(findings, "WONT_FIT_THROUGH_DOOR")).toEqual([]);
  });
});
