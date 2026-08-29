"use client";

import { resolvePlacement } from "@/lib/domain/placement";
import { removeItem, rotateItem, selectPlacement } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { Button, Panel, Price } from "../ui";
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
      <Panel variant="sunken">
        <p className="text-body-m text-ink-2">
          Drag anything on the plan to move it. Select an item to rotate or remove it.
        </p>
      </Panel>
    );
  }

  const rotation = nextRotation(placement.rotation);

  return (
    <Panel variant="plain" bodyClassName="flex flex-wrap items-center gap-4 !py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-label-m truncate font-bold text-ink">
            {resolved.product.name}
          </p>
          <Price amount={resolved.product.priceCents / 100} size="small" />
        </div>
        <p className="text-body-s text-ink-3 tabular-nums">
          {resolved.footprint.width} × {resolved.footprint.depth}mm at ({placement.x},{" "}
          {placement.y}) · {placement.rotation}°
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
    </Panel>
  );
}
