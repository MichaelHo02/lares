import { buildCostBreakdown, type CostBreakdown } from "../cost/breakdown";
import { summariseFindings, type Finding } from "../clearance/findings";
import { logActivity, patchPlanner, plannerState } from "./store";
import { findingsFor } from "./views";
import type { CheckoutRequest, CheckoutState } from "./types";

export interface CheckoutResult {
  state: CheckoutState;
  /** True only once the human has confirmed in the page. */
  completed: boolean;
  request: CheckoutRequest | null;
  cost: CostBreakdown;
  blockingFindings: readonly Finding[];
  message: string;
}

/**
 * Checkout spends money, so the tool never completes on its own. It moves the
 * page into `awaiting_confirmation` and returns that state, following Chrome's
 * guidance that sensitive actions require an explicit human interaction.
 */
export function requestCheckout(): CheckoutResult {
  const state = plannerState();
  const cost = buildCostBreakdown(state.placements, state.catalog, state.budgetCents);
  const findings = findingsFor(state);
  const errors = findings.filter((finding) => finding.severity === "error");

  if (cost.itemCount === 0) {
    return {
      state: "idle",
      completed: false,
      request: null,
      cost,
      blockingFindings: [],
      message: "Nothing to buy — describe the room and place some items first.",
    };
  }

  const request: CheckoutRequest = {
    id: `co-${Date.now().toString(36)}`,
    requestedAt: Date.now(),
    itemCount: cost.itemCount,
    totalCents: cost.totalCents,
    blockingErrors: errors.length,
  };

  patchPlanner({ checkoutState: "awaiting_confirmation", checkoutRequest: request });
  logActivity(
    "agent",
    `Requested checkout of ${cost.itemCount} item(s) for ${cost.totalFormatted} — awaiting the shopper's confirmation.`,
  );

  const budgetNote = cost.overBudget
    ? ` This is ${cost.remainingFormatted} over the ${cost.budgetFormatted} budget.`
    : "";
  const errorNote =
    errors.length > 0
      ? ` ${errors.length} clearance error(s) are still outstanding and are shown alongside the confirmation.`
      : "";

  return {
    state: "awaiting_confirmation",
    completed: false,
    request,
    cost,
    blockingFindings: errors,
    message:
      `Checkout is staged but not complete. A confirmation panel is now showing in the page ` +
      `for ${cost.itemCount} item(s) totalling ${cost.totalFormatted}; the shopper must press ` +
      `Confirm purchase themselves.${budgetNote}${errorNote}`,
  };
}

export function confirmCheckout(): void {
  const state = plannerState();
  if (state.checkoutState !== "awaiting_confirmation") return;
  patchPlanner({ checkoutState: "confirmed" });
  logActivity("user", "Confirmed the purchase.");
}

export function declineCheckout(): void {
  const state = plannerState();
  if (state.checkoutState !== "awaiting_confirmation") return;
  patchPlanner({ checkoutState: "declined", checkoutRequest: null });
  logActivity("user", "Declined the purchase.");
}

export function checkoutStatus(): CheckoutResult {
  const state = plannerState();
  const cost = buildCostBreakdown(state.placements, state.catalog, state.budgetCents);
  const findings = findingsFor(state);

  switch (state.checkoutState) {
    case "idle":
      return {
        state: "idle",
        completed: false,
        request: null,
        cost,
        blockingFindings: [],
        message: "No checkout in progress.",
      };
    case "awaiting_confirmation":
      return {
        state: "awaiting_confirmation",
        completed: false,
        request: state.checkoutRequest,
        cost,
        blockingFindings: findings.filter((finding) => finding.severity === "error"),
        message: "Waiting for the shopper to confirm the purchase in the page.",
      };
    case "confirmed":
      return {
        state: "confirmed",
        completed: true,
        request: state.checkoutRequest,
        cost,
        blockingFindings: [],
        message: `Purchase confirmed by the shopper: ${cost.itemCount} item(s), ${cost.totalFormatted}.`,
      };
    case "declined":
      return {
        state: "declined",
        completed: false,
        request: null,
        cost,
        blockingFindings: [],
        message: "The shopper declined the purchase.",
      };
    default: {
      const exhaustive: never = state.checkoutState;
      throw new Error(`unhandled checkout state: ${String(exhaustive)}`);
    }
  }
}

export const EMPTY_FINDING_COUNT = summariseFindings([]);
