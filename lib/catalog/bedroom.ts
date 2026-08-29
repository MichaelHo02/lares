import type { ClearanceRequirement, Product } from "../domain/product";
import { dollarsToCents } from "../domain/units";

/** 600mm each side is the usual figure for making a bed and getting in and out. */
const sideAccess = (face: "left" | "right"): ClearanceRequirement => ({
  face,
  depthMm: 600,
  reason: "side_access",
  label: "600mm beside the bed to get in and make it up",
});

/**
 * Both sides are always listed as candidates. The clearance engine decides how
 * many have to be clear from the bed's width: a single is fine against a wall,
 * anything double or wider should be reachable from both sides.
 */
const SIDE_ACCESS: readonly ClearanceRequirement[] = [
  sideAccess("left"),
  sideAccess("right"),
];

export const BEDROOM: readonly Product[] = [
  {
    id: "mossvik-single-bed",
    name: "Mossvik Single Bed",
    category: "bed",
    widthMm: 1050,
    depthMm: 1990,
    heightMm: 900,
    priceCents: dollarsToCents(549),
    styleTags: ["light oak", "compact", "scandinavian"],
    clearances: SIDE_ACCESS,
    blurb: "A slatted single bed frame that can sit with one side to the wall.",
  },
  {
    id: "mossvik-king-single-bed",
    name: "Mossvik King Single Bed",
    category: "bed",
    widthMm: 1160,
    depthMm: 2100,
    heightMm: 900,
    priceCents: dollarsToCents(699),
    styleTags: ["light oak", "compact", "minimal"],
    clearances: SIDE_ACCESS,
    blurb: "The longer king single, useful for taller teenagers and guest rooms.",
  },
  {
    id: "mossvik-double-bed",
    name: "Mossvik Double Bed",
    category: "bed",
    widthMm: 1450,
    depthMm: 2030,
    heightMm: 950,
    priceCents: dollarsToCents(899),
    styleTags: ["light oak", "scandinavian", "minimal"],
    clearances: SIDE_ACCESS,
    blurb: "A pared-back double frame with a low timber headboard.",
  },
  {
    id: "mossvik-queen-bed",
    name: "Mossvik Queen Bed",
    category: "bed",
    widthMm: 1650,
    depthMm: 2030,
    heightMm: 1050,
    priceCents: dollarsToCents(1199),
    styleTags: ["light oak", "linen", "scandinavian"],
    clearances: SIDE_ACCESS,
    blurb: "The queen Mossvik with an upholstered linen headboard panel.",
  },
  {
    id: "halvard-king-bed",
    name: "Halvard King Bed",
    category: "bed",
    widthMm: 2130,
    depthMm: 2030,
    heightMm: 1100,
    priceCents: dollarsToCents(2199),
    styleTags: ["walnut", "boucle", "mid-century"],
    clearances: SIDE_ACCESS,
    blurb: "A king frame with a deep boucle headboard on a walnut base.",
  },
];
