"use client";

import { useMemo } from "react";
import { buildCostBreakdown } from "@/lib/cost/breakdown";
import { dollarsToCents } from "@/lib/domain/units";
import { setBudget } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { Chip, Panel, Price } from "../ui";

const BUDGET_PRESETS = [1500, 3000, 6000] as const;

export function CostSummary({ embedded = false }: { embedded?: boolean }) {
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);
  const budgetCents = usePlannerStore((state) => state.budgetCents);

  const cost = useMemo(
    () => buildCostBreakdown(placements, catalog, budgetCents),
    [placements, catalog, budgetCents],
  );

  const usedFraction =
    cost.budgetCents && cost.budgetCents > 0
      ? Math.min(1, cost.totalCents / cost.budgetCents)
      : 0;

  const itemLabel = `${cost.itemCount} item${cost.itemCount === 1 ? "" : "s"}`;
  const body = (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Price amount={cost.totalCents / 100} size="large" />
        {cost.budgetFormatted ? (
          <span
            className={`text-body-m tabular-nums ${
              cost.overBudget ? "text-negative" : "text-ink-2"
            }`}
          >
            {cost.overBudget
              ? `${cost.remainingFormatted} over ${cost.budgetFormatted}`
              : `${cost.remainingFormatted} left of ${cost.budgetFormatted}`}
          </span>
        ) : (
          <span className="text-body-m text-ink-3">No budget set</span>
        )}
      </div>

      {cost.budgetCents !== null ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={cost.budgetCents}
          aria-valuenow={cost.totalCents}
          aria-label="Spend against budget"
          className="bg-neutral-3 mt-3 h-1.5 w-full overflow-hidden rounded-pill"
        >
          <div
            className={`h-full ${cost.overBudget ? "bg-negative" : "bg-positive"}`}
            style={{ width: `${Math.max(2, usedFraction * 100)}%` }}
          />
        </div>
      ) : null}

      {cost.byCategory.length > 0 ? (
        <ul className="border-hairline mt-4 flex flex-col gap-1.5 border-t pt-3">
          {cost.byCategory.map((row) => (
            <li
              key={row.category}
              className="text-body-m flex items-baseline justify-between"
            >
              <span className="text-ink-2">
                {row.categoryLabel}
                {row.itemCount > 1 ? ` × ${row.itemCount}` : ""}
              </span>
              <span className="tabular-nums">{row.subtotalFormatted}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-body-s text-ink-3">Budget</span>
        {BUDGET_PRESETS.map((dollars) => {
          const cents = dollarsToCents(dollars);
          const active = budgetCents === cents;
          return (
            <Chip
              key={dollars}
              selected={active}
              onClick={() => setBudget(active ? null : cents)}
            >
              ${dollars.toLocaleString("en-AU")}
            </Chip>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return (
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-label-s font-bold uppercase tracking-wide text-ink-3">
            Cost
          </h2>
          <span className="text-body-s tabular-nums text-ink-3">{itemLabel}</span>
        </div>
        {body}
      </section>
    );
  }

  return (
    <Panel
      variant="plain"
      title="Cost"
      actions={<span className="text-body-m text-ink-2 tabular-nums">{itemLabel}</span>}
    >
      {body}
    </Panel>
  );
}
