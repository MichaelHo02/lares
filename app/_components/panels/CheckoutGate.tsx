"use client";

import { useMemo } from "react";
import { buildCostBreakdown } from "@/lib/cost/breakdown";
import { confirmCheckout, declineCheckout } from "@/lib/store/checkout";
import { usePlannerStore } from "@/lib/store/store";
import { Button, Panel } from "../ui";

/**
 * The human half of the gated `checkout` tool. The tool can only move the page
 * into `awaiting_confirmation`; completing the purchase requires a real click
 * here, per Chrome's guidance on sensitive actions.
 */
export function CheckoutGate() {
  const checkoutState = usePlannerStore((state) => state.checkoutState);
  const request = usePlannerStore((state) => state.checkoutRequest);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);
  const budgetCents = usePlannerStore((state) => state.budgetCents);

  const cost = useMemo(
    () => buildCostBreakdown(placements, catalog, budgetCents),
    [placements, catalog, budgetCents],
  );

  switch (checkoutState) {
    case "idle":
      return null;

    case "declined":
      return (
        <p className="bg-surface-sunken rounded-card text-body-m text-ink-2 p-4">
          Purchase declined. Nothing was bought.
        </p>
      );

    case "confirmed":
      return (
        <div className="border-positive bg-tint-positive rounded-card border p-4">
          <p className="text-label-m text-positive font-bold">Purchase confirmed</p>
          <p className="text-body-m text-ink-2 mt-1 tabular-nums">
            {cost.itemCount} item{cost.itemCount === 1 ? "" : "s"} for{" "}
            {cost.totalFormatted}. This demo stops here — no payment is taken.
          </p>
        </div>
      );

    case "awaiting_confirmation":
      return (
        <Panel variant="sheet">
          <div role="alertdialog" aria-labelledby="checkout-heading">
            <h2 id="checkout-heading" className="text-heading-m font-bold">
              Confirm this purchase?
            </h2>
            <p className="text-body-m text-ink-2 mt-1">
              The agent has staged {cost.itemCount} item
              {cost.itemCount === 1 ? "" : "s"} totalling{" "}
              <strong className="text-ink tabular-nums">{cost.totalFormatted}</strong>. It
              cannot complete this itself.
            </p>

            {request && request.blockingErrors > 0 ? (
              <p className="border-negative rounded-input text-body-m text-negative mt-3 border p-2">
                {request.blockingErrors} clearance error
                {request.blockingErrors === 1 ? "" : "s"} still outstanding — you may want
                to fix the layout first.
              </p>
            ) : null}

            {cost.overBudget ? (
              <p className="text-body-m text-negative mt-2 tabular-nums">
                {cost.remainingFormatted} over your {cost.budgetFormatted} budget.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="emphasis" size="small" onClick={confirmCheckout}>
                Confirm purchase
              </Button>
              <Button variant="secondary" size="small" onClick={declineCheckout}>
                Not now
              </Button>
            </div>
          </div>
        </Panel>
      );

    default: {
      const exhaustive: never = checkoutState;
      throw new Error(`unhandled checkout state: ${String(exhaustive)}`);
    }
  }
}
