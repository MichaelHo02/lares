import type { Placement } from "../domain/placement";
import type { Catalog } from "../domain/product";
import type { Room } from "../domain/room";
import type { Cents } from "../domain/units";

export const CHECKOUT_STATES = [
  "idle",
  "awaiting_confirmation",
  "confirmed",
  "declined",
] as const;

export type CheckoutState = (typeof CHECKOUT_STATES)[number];

export interface CheckoutRequest {
  id: string;
  requestedAt: number;
  itemCount: number;
  totalCents: Cents;
  /** Errors present at the moment checkout was requested. */
  blockingErrors: number;
}

export interface PlannerState {
  /** Null until the shopper or agent sets the space with `defineRoom`. */
  room: Room | null;
  placements: readonly Placement[];
  catalog: Catalog;
  budgetCents: Cents | null;
  selectedPlacementId: string | null;
  checkoutState: CheckoutState;
  checkoutRequest: CheckoutRequest | null;
  /** Monotonic counter used to generate placement ids without a random source. */
  nextPlacementSeq: number;
  /** Rolling log of agent and user edits, newest last. */
  activity: readonly ActivityEntry[];
}

export const ACTIVITY_SOURCES = ["agent", "user"] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export interface ActivityEntry {
  id: string;
  at: number;
  source: ActivitySource;
  summary: string;
}
