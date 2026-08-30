"use client";

import { useMemo } from "react";
import { buildCostBreakdown } from "@/lib/cost/breakdown";
import { usePlannerStore } from "@/lib/store/store";
import { Price } from "../ui";

export function CostSummary() {
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);

  const cost = useMemo(
    () => buildCostBreakdown(placements, catalog, null),
    [placements, catalog],
  );

  const itemLabel = `${cost.itemCount} item${cost.itemCount === 1 ? "" : "s"}`;

  return (
    <section className="shrink-0 border-t border-hairline bg-surface px-3 py-3">
      <div className="flex items-baseline gap-2">
        <Price amount={cost.totalCents / 100} size="large" />
        <span className="text-body-s tabular-nums text-ink-3">{itemLabel}</span>
      </div>
    </section>
  );
}
