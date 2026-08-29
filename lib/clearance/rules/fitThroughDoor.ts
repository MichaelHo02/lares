import { smallestCrossSection } from "../../domain/product";
import { doors } from "../../domain/room";
import { STANDARDS } from "../standards";
import { describe, type Rule } from "../context";
import type { Finding } from "../findings";

/**
 * An item can be tilted and turned while being carried, so the only dimension
 * that must clear the door jamb is its smallest. A small carrying tolerance is
 * subtracted from the opening because hands and packaging need room too.
 *
 * A room with several doors only has to admit the item through one of them, so
 * the widest door is the one that decides delivery access.
 */
export const fitThroughDoorRule: Rule = ({ room, resolved }) => {
  const roomDoors = doors(room);
  if (roomDoors.length === 0) return [];

  const widest = roomDoors.reduce((max, door) =>
    door.widthMm > max.widthMm ? door : max,
  );
  const usableWidth = widest.widthMm - STANDARDS.DOOR_FIT_TOLERANCE_MM;
  const findings: Finding[] = [];

  for (const entry of resolved) {
    const crossSection = smallestCrossSection(entry.product);
    if (crossSection <= usableWidth) continue;

    findings.push({
      code: "WONT_FIT_THROUGH_DOOR",
      severity: "error",
      placementIds: [entry.placement.id],
      measuredMm: crossSection,
      requiredMm: usableWidth,
      message:
        `${describe(entry)} has a smallest cross-section of ${crossSection}mm, which ` +
        `cannot be carried through the ${widest.widthMm}mm ${widest.wall} door ` +
        `(${usableWidth}mm usable). Choose a narrower item or one that ships flat-packed.`,
      region: entry.footprint,
    });
  }

  return findings;
};
