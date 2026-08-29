"use client";

import { resolvePlacement } from "@/lib/domain/placement";
import { ROTATIONS, type Rotation } from "@/lib/geometry/rotation";
import { removeItem, rotateItem, selectPlacement } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";

/**
 * Direct manipulation happens on the canvas; this is only the small set of
 * actions a pointer drag cannot express for the item already selected there.
 */
export function SelectionControls() {
  const selectedId = usePlannerStore((state) => state.selectedPlacementId);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);

  const placement = placements.find((entry) => entry.id === selectedId);
  const resolved = placement ? resolvePlacement(placement, catalog) : null;

  if (!placement || !resolved) {
    return (
      <p className="rounded-card border border-hairline bg-surface-sunken p-3 text-body-s text-ink-2">
        Drag any item on the plan to move it. Select one to rotate or remove it.
      </p>
    );
  }

  const nextRotation = (): Rotation => {
    const index = ROTATIONS.indexOf(placement.rotation);
    return ROTATIONS[(index + 1) % ROTATIONS.length];
  };

  return (
    <div className="rounded-card border border-hairline-strong p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-body-m font-bold">{resolved.product.name}</p>
        <code className="font-mono text-body-s text-ink-3">{placement.id}</code>
      </div>
      <p className="mt-0.5 text-body-s text-ink-2">
        {resolved.footprint.width} × {resolved.footprint.depth}mm at (
        {placement.x}, {placement.y}), {placement.rotation}°
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            rotateItem({
              placementId: placement.id,
              rotation: nextRotation(),
              source: "user",
            })
          }
          className="rounded-input bg-action px-3 py-1.5 text-body-s font-bold text-ink-inverse hover:bg-action-hover"
        >
          Rotate to {nextRotation()}°
        </button>
        <button
          type="button"
          onClick={() => removeItem(placement.id, "user")}
          className="rounded-input border border-negative px-3 py-1.5 text-body-s font-bold text-negative hover:bg-subtle-hover"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => selectPlacement(null)}
          className="rounded-input border border-hairline px-3 py-1.5 text-body-s hover:bg-subtle-hover"
        >
          Deselect
        </button>
      </div>
    </div>
  );
}
