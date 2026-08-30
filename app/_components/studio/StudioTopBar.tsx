"use client";

import type { ButtonHTMLAttributes } from "react";
import { usePlannerStore } from "@/lib/store/store";
import { Chip } from "../ui";
import { EmptyStudio } from "./EmptyStudio";
import { RoomIdentity } from "./RoomIdentity";

interface StudioTopBarProps {
  available: boolean | null;
  registeredCount: number;
  error: string | null;
  detailsOpen: boolean;
  onOpenDetails: () => void;
}

function connectionStatus(
  available: boolean | null,
  agentBusy: boolean,
): { tone: "positive" | "caution" | "neutral"; label: string } {
  if (available === null) {
    return { tone: "neutral", label: "Checking WebMCP…" };
  }
  if (available === false) {
    return { tone: "caution", label: "WebMCP unavailable" };
  }
  if (agentBusy) {
    return { tone: "positive", label: "Agent active" };
  }
  return { tone: "neutral", label: "Agent waiting" };
}

/**
 * Modeling Studio-style chrome: brand + scene identity on the left, a single
 * connection chip on the right. Sits over the viewport rather than taking layout space.
 */
export function StudioTopBar({
  available,
  registeredCount,
  error,
  detailsOpen,
  onOpenDetails,
}: StudioTopBarProps) {
  const room = usePlannerStore((state) => state.room);
  const activity = usePlannerStore((state) => state.activity);
  const agentBusy = activity.some((entry) => entry.source === "agent");
  const status = connectionStatus(available, agentBusy);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-4 py-3">
      <div className="pointer-events-auto min-w-0">
        <RoomIdentity />
      </div>

      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <EmptyStudio
          available={available}
          registeredCount={registeredCount}
          error={error}
          hasRoom={Boolean(room)}
        >
          <StatusChip tone={status.tone} label={status.label} />
        </EmptyStudio>
        {detailsOpen ? null : (
          <Chip
            aria-expanded={false}
            aria-controls="scene-details-panel"
            onClick={onOpenDetails}
            className="min-h-8 px-3 text-label-s"
          >
            Scene details
          </Chip>
        )}
      </div>
    </header>
  );
}

function StatusChip({
  tone,
  label,
  ...rest
}: {
  tone: "positive" | "caution" | "neutral";
  label: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const fill =
    tone === "positive" ? "bg-positive" : tone === "caution" ? "bg-caution" : "bg-neutral-4";

  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1.5 rounded-pill border border-hairline bg-surface/90 px-3 py-1.5 text-label-s font-bold text-ink-2 outline-none backdrop-blur-sm hover:shadow-ring-ink focus-visible:shadow-ring-ink"
      {...rest}
    >
      <span aria-hidden className={`size-1.5 rounded-pill ${fill}`} />
      {label}
    </button>
  );
}
