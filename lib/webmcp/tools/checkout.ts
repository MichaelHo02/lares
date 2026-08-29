import { checkoutStatus, requestCheckout } from "../../store/checkout";
import { toolResult } from "../args";
import { EMPTY_SCHEMA } from "../schema";
import type { ToolDescriptor } from "../types";

/**
 * Checkout spends money, so the tool stages the purchase and hands control back
 * to the person. It reports `awaiting_confirmation` rather than completing, per
 * Chrome's guidance that sensitive actions need an explicit human interaction.
 */
const checkoutTool: ToolDescriptor = {
  name: "checkout",
  description:
    "Stage the current layout for purchase. This does not complete the purchase: it opens a confirmation panel in the page and returns a state of 'awaiting_confirmation'. The shopper must press Confirm purchase themselves. Call checkout_status afterwards to see what they decided.",
  inputSchema: EMPTY_SCHEMA,
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  execute: () => toolResult(requestCheckout()),
};

const checkoutStatusTool: ToolDescriptor = {
  name: "checkout_status",
  description:
    "Read whether a staged purchase is still waiting on the shopper, was confirmed by them, or was declined.",
  inputSchema: EMPTY_SCHEMA,
  annotations: { readOnlyHint: true, idempotentHint: true },
  execute: () => toolResult(checkoutStatus()),
};

export const GATED_TOOLS: readonly ToolDescriptor[] = [checkoutTool, checkoutStatusTool];
