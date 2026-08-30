"use client";

import { usePlannerStore } from "@/lib/store/store";
import { Chip } from "../ui";

interface StudioTopBarProps {
  available: boolean | null;
  registeredCount: number;
  detailsOpen: boolean;
  onOpenDetails: () => void;
}

/**
 * Modeling Studio-style chrome: brand + scene identity on the left, live
 * status chips on the right. Sits over the viewport rather than taking layout space.
 */
export function StudioTopBar({
  available,
  registeredCount,
  detailsOpen,
  onOpenDetails,
}: StudioTopBarProps) {
  const room = usePlannerStore((state) => state.room);
  const activity = usePlannerStore((state) => state.activity);
  const agentBusy = activity.some((entry) => entry.source === "agent");

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-4 py-3">
      <div className="pointer-events-auto min-w-0">
        <p className="text-heading-s font-bold text-ink">
          <span className="rounded-badge bg-accent-yellow px-1.5">Lares</span>
          <span className="text-ink-3"> / </span>
          <span className="text-ink-2">{room.name}</span>
        </p>
        <p className="text-caption-m mt-0.5 tabular-nums text-ink-3">
          {room.widthMm} × {room.depthMm}mm
        </p>
      </div>

      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <StatusChip
          tone={available === true ? "positive" : available === false ? "caution" : "neutral"}
          label={
            available === true
              ? `WebMCP · ${registeredCount}`
              : available === false
                ? "WebMCP unavailable"
                : "WebMCP"
          }
        />
        <StatusChip
          tone={agentBusy ? "positive" : "neutral"}
          label={agentBusy ? "Agent active" : "Agent waiting"}
        />
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
}: {
  tone: "positive" | "caution" | "neutral";
  label: string;
}) {
  const fill =
    tone === "positive" ? "bg-positive" : tone === "caution" ? "bg-caution" : "bg-neutral-4";
  return (
    <span className="flex items-center gap-1.5 rounded-pill border border-hairline bg-surface/90 px-3 py-1.5 text-label-s font-bold text-ink-2 backdrop-blur-sm">
      <span aria-hidden className={`size-1.5 rounded-pill ${fill}`} />
      {label}
    </span>
  );
}
