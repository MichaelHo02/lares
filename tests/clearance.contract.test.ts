import { describe, expect, it } from "vitest";
import { checkLayout, findingsForPlacement } from "../lib/clearance/checkLayout";
import { FINDING_CODES, summariseFindings } from "../lib/clearance/findings";
import {
  TEST_CATALOG,
  TEST_PRODUCTS,
  bareRoom,
  firstOf,
  makeRoom,
  place,
} from "./fixtures";

const BARE_ROOM = bareRoom();

describe("UNKNOWN_PRODUCT", () => {
  it("reports a placement referring to a product that is not catalogued", () => {
    const { findings, summary } = checkLayout(
      BARE_ROOM,
      [place("p1", "no-such-product", 100, 100)],
      TEST_CATALOG,
    );
    const finding = firstOf(findings, "UNKNOWN_PRODUCT");
    expect(finding.severity).toBe("error");
    expect(finding.measuredMm).toBeNull();
    expect(finding.requiredMm).toBeNull();
    expect(summary.passes).toBe(false);
  });

  it("still checks the placements it can resolve", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("ghost", "no-such-product", 100, 100),
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
      ],
      TEST_CATALOG,
    );
    expect(firstOf(findings, "OVERLAP").placementIds).toEqual(["p1", "p2"]);
  });
});

describe("checkLayout contract", () => {
  it("passes an empty room", () => {
    const { findings, summary } = checkLayout(makeRoom(), [], TEST_CATALOG);
    expect(findings).toEqual([]);
    expect(summary).toEqual({
      total: 0,
      errors: 0,
      warnings: 0,
      byCode: {},
      passes: true,
    });
  });

  it("emits errors before warnings", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1200, 1100),
        place("p3", TEST_PRODUCTS.sofa.id, 3000, 300),
      ],
      TEST_CATALOG,
    );
    const severities = findings.map((finding) => finding.severity);
    expect(severities).toContain("error");
    expect(severities).toContain("warning");
    expect(severities.lastIndexOf("error")).toBeLessThan(severities.indexOf("warning"));
  });

  it("gives every finding a code from the published list and a non-empty message", () => {
    const { findings } = checkLayout(
      makeRoom(3000, 3000),
      [
        place("p1", TEST_PRODUCTS.bulkySectional.id, 200, 200),
        place("p2", TEST_PRODUCTS.diningTable.id, 400, 2200),
        place("p3", "missing", 0, 0),
      ],
      TEST_CATALOG,
    );
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      expect(FINDING_CODES).toContain(finding.code);
      expect(finding.message.length).toBeGreaterThan(10);
      expect(Array.isArray(finding.placementIds)).toBe(true);
    }
  });

  it("summarises counts by code and severity", () => {
    const summary = summariseFindings([
      {
        code: "OVERLAP",
        severity: "error",
        placementIds: ["a", "b"],
        measuredMm: 10,
        requiredMm: 0,
        message: "x",
      },
      {
        code: "OVERLAP",
        severity: "error",
        placementIds: ["a", "c"],
        measuredMm: 10,
        requiredMm: 0,
        message: "y",
      },
      {
        code: "WALKWAY_TOO_NARROW",
        severity: "warning",
        placementIds: ["a"],
        measuredMm: 800,
        requiredMm: 900,
        message: "z",
      },
    ]);
    expect(summary).toEqual({
      total: 3,
      errors: 2,
      warnings: 1,
      byCode: { OVERLAP: 2, WALKWAY_TOO_NARROW: 1 },
      passes: false,
    });
  });

  it("filters findings down to a single placement", () => {
    const { findings } = checkLayout(
      BARE_ROOM,
      [
        place("p1", TEST_PRODUCTS.wardrobe.id, 1000, 1000),
        place("p2", TEST_PRODUCTS.bookshelf.id, 1200, 1100),
      ],
      TEST_CATALOG,
    );
    const forP2 = findingsForPlacement(findings, "p2");
    expect(forP2.length).toBeGreaterThan(0);
    for (const finding of forP2) {
      expect(finding.placementIds).toContain("p2");
    }
    expect(findingsForPlacement(findings, "nope")).toEqual([]);
  });

  it("is deterministic for the same input", () => {
    const layout = [
      place("p1", TEST_PRODUCTS.diningTable.id, 200, 200),
      place("p2", TEST_PRODUCTS.bookshelf.id, 900, 1200),
    ];
    const first = checkLayout(makeRoom(3000, 3000), layout, TEST_CATALOG);
    const second = checkLayout(makeRoom(3000, 3000), layout, TEST_CATALOG);
    expect(first.findings).toEqual(second.findings);
  });
});
