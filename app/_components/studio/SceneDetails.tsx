"use client";

import { useMemo, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/domain/product";
import { resolvePlacement } from "@/lib/domain/placement";
import { removeItem, rotateItem, selectPlacement } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { nextRotation } from "../plan/usePlanInteraction";
import { CatalogBrowser } from "../panels/CatalogBrowser";
import { CostSummary } from "../panels/CostSummary";
import { Button, Chip, Price } from "../ui";

type DetailsTab = "scene" | "shop";

interface SceneDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Docked right sidebar: scene objects and shop. The 3D canvas keeps the
 * remaining width instead of this sitting as a floating sheet.
 */
export function SceneDetails({ open, onOpenChange }: SceneDetailsProps) {
  const [tab, setTab] = useState<DetailsTab>("scene");
  const placementCount = usePlannerStore((state) => state.placements.length);

  if (!open) return null;

  return (
    <aside
      id="scene-details-panel"
      className="flex h-full w-[22rem] max-w-full shrink-0 flex-col overflow-hidden border-l border-hairline bg-surface"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
        <h2 className="text-label-s font-bold uppercase tracking-wide text-ink-3">
          Scene details
        </h2>
        <Button
          variant="tertiary"
          size="small"
          aria-expanded
          aria-controls="scene-details-panel"
          onClick={() => onOpenChange(false)}
        >
          Hide
        </Button>
      </div>
      <div className="flex gap-1 border-b border-hairline p-2">
        <TabChip current={tab} id="scene" onSelect={setTab} count={placementCount}>
          Scene
        </TabChip>
        <TabChip current={tab} id="shop" onSelect={setTab}>
          Shop
        </TabChip>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tabContent(tab)}
      </div>
    </aside>
  );
}

function tabContent(tab: DetailsTab) {
  switch (tab) {
    case "scene":
      return (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ScenePane />
        </div>
      );
    case "shop":
      return <ShopPane />;
    default: {
      const exhaustive: never = tab;
      return exhaustive;
    }
  }
}

function TabChip({
  current,
  id,
  onSelect,
  count,
  children,
}: {
  current: DetailsTab;
  id: DetailsTab;
  onSelect: (tab: DetailsTab) => void;
  count?: number;
  children: string;
}) {
  return (
    <Chip
      selected={current === id}
      count={count}
      onClick={() => onSelect(id)}
      className="min-h-8 px-3 text-label-s"
    >
      {children}
    </Chip>
  );
}

function ShopPane() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <CatalogBrowser compact />
      </div>
      <CostSummary />
    </div>
  );
}

function ScenePane() {
  const room = usePlannerStore((state) => state.room);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);
  const selectedId = usePlannerStore((state) => state.selectedPlacementId);

  const resolved = useMemo(
    () =>
      placements
        .map((placement) => resolvePlacement(placement, catalog))
        .filter((entry) => entry !== null),
    [placements, catalog],
  );

  const selected = resolved.find((entry) => entry.placement.id === selectedId) ?? null;

  return (
    <div className="flex flex-col">
      <section className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-label-s font-bold uppercase tracking-wide text-ink-3">
            Room objects
          </h2>
          <span className="text-label-s tabular-nums text-ink-3">{resolved.length}</span>
        </div>
        {resolved.length === 0 ? (
          <p className="text-body-s mt-2 text-ink-3">
            {room
              ? "Nothing placed yet. Ask the agent to furnish, or open Shop."
              : "No room yet. Describe the size, doors, and windows first."}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {resolved.map((entry) => {
              const active = entry.placement.id === selectedId;
              return (
                <li key={entry.placement.id}>
                  <button
                    type="button"
                    onClick={() => selectPlacement(entry.placement.id)}
                    className={`w-full rounded-input px-2 py-2 text-left ${
                      active
                        ? "bg-surface-sunken text-ink"
                        : "text-ink-2 hover:bg-subtle-hover"
                    }`}
                  >
                    <span className="block text-body-m font-bold">{entry.product.name}</span>
                    <span className="text-caption-m text-ink-3">
                      {CATEGORY_LABELS[entry.product.category]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-hairline p-3">
        <h2 className="text-label-s font-bold uppercase tracking-wide text-ink-3">
          Inspector
        </h2>
        {selected ? (
          <div className="mt-2 flex flex-col gap-3">
            <div>
              <p className="text-label-m font-bold text-ink">{selected.product.name}</p>
              <p className="text-caption-m text-ink-3">
                {CATEGORY_LABELS[selected.product.category]}
              </p>
              <div className="mt-1">
                <Price amount={selected.product.priceCents / 100} size="small" />
              </div>
            </div>
            <AxisRow
              label="Position"
              x={`${selected.placement.x}`}
              y={`${selected.placement.y}`}
              z="0"
            />
            <AxisRow
              label="Rotation"
              x="0"
              y={`${selected.placement.rotation}°`}
              z="0"
            />
            <AxisRow
              label="Size"
              x={`${selected.footprint.width}`}
              y="—"
              z={`${selected.footprint.depth}`}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="small"
                onClick={() =>
                  rotateItem({
                    placementId: selected.placement.id,
                    rotation: nextRotation(selected.placement.rotation),
                    source: "user",
                  })
                }
              >
                Rotate
              </Button>
              <Button
                variant="destructive"
                size="small"
                onClick={() => removeItem(selected.placement.id, "user")}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-body-s mt-2 text-ink-3">
            Select an object above to inspect its current values.
          </p>
        )}
      </section>
    </div>
  );
}

function AxisRow({
  label,
  x,
  y,
  z,
}: {
  label: string;
  x: string;
  y: string;
  z: string;
}) {
  return (
    <div>
      <p className="text-label-s font-bold text-ink-3">{label}</p>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <AxisValue axis="X" value={x} />
        <AxisValue axis="Y" value={y} />
        <AxisValue axis="Z" value={z} />
      </div>
    </div>
  );
}

function AxisValue({ axis, value }: { axis: string; value: string }) {
  return (
    <div className="rounded-input bg-surface-sunken px-2 py-1.5">
      <span className="text-caption-m text-ink-3">{axis}</span>
      <p className="text-body-s font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
