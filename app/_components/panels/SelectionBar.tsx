"use client";

import { resolvePlacement } from "@/lib/domain/placement";
import { formatAud } from "@/lib/domain/units";
import { removeItem, rotateItem, selectPlacement } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { Button } from "../ui";
import { nextRotation } from "../plan/usePlanInteraction";

/**
 * Direct manipulation on the canvas is the editing story; this bar carries only
 * the actions a pointer drag cannot express for the current selection.
 */
export function SelectionBar() {
  const selectedId = usePlannerStore((state) => state.selectedPlacementId);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);

  const placement = placements.find((entry) => entry.id === selectedId);
  const resolved = placement ? resolvePlacement(placement, catalog) : null;

  if (!placement || !resolved) {
    return (
      <p className="bg-surface-sunken rounded-card text-body-m text-ink-2 px-4 py-3">
        Drag anything on the plan to move it. Select an item to rotate or remove it.
      </p>
    );
  }

  const rotation = nextRotation(placement.rotation);

  return (
    <div className="border-hairline-strong rounded-card flex flex-wrap items-center gap-4 border px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-label-m truncate font-bold">{resolved.product.name}</p>
        <p className="text-body-s text-ink-3 tabular-nums">
          {resolved.footprint.width} × {resolved.footprint.depth}mm at ({placement.x},{" "}
          {placement.y}) · {placement.rotation}° ·{" "}
          {formatAud(resolved.product.priceCents)}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          size="small"
          onClick={() =>
            rotateItem({ placementId: placement.id, rotation, source: "user" })
          }
        >
          Rotate to {rotation}°
        </Button>
        <Button
          variant="destructive"
          size="small"
          onClick={() => removeItem(placement.id, "user")}
        >
          Remove
        </Button>
        <Button variant="tertiary" size="small" onClick={() => selectPlacement(null)}>
          Deselect
        </Button>
      </div>
    </div>
  );
}
