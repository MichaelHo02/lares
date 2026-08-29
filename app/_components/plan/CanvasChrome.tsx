"use client";

/** Canvas chrome stays white-on-paper with hairlines — no dark floating toolbar. */

export function ScaleBar({ mmPerPx }: { mmPerPx: number }) {
  const oneMetrePx = 1000 / mmPerPx;
  if (!Number.isFinite(oneMetrePx) || oneMetrePx <= 0) return null;

  const clamped = Math.min(oneMetrePx, 320);
  const label =
    oneMetrePx > 320 ? `${(Math.round((320 * mmPerPx) / 10) / 100).toFixed(1)} m` : "1 m";

  return (
    <div className="pointer-events-none absolute bottom-5 left-5 flex flex-col gap-1">
      <div
        className="border-canvas-dim h-2 border-x border-b"
        style={{ width: `${clamped}px` }}
      />
      <span className="text-body-s text-ink-3 leading-none tabular-nums">{label}</span>
    </div>
  );
}

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

const ICON_BUTTON =
  "flex size-10 items-center justify-center rounded-pill bg-surface text-ink " +
  "shadow-[inset_0_0_0_1px_#dfdfdf] transition-colors hover:bg-subtle-hover " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink " +
  "disabled:pointer-events-none disabled:text-ink-3";

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onFit,
  canZoomIn,
  canZoomOut,
}: ZoomControlsProps) {
  return (
    <div className="absolute right-5 bottom-5 flex flex-col gap-2">
      <button
        type="button"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        className={ICON_BUTTON}
      >
        <Icon path="M12 6v12M6 12h12" />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        className={ICON_BUTTON}
      >
        <Icon path="M6 12h12" />
      </button>
      <button
        type="button"
        onClick={onFit}
        aria-label="Fit the plan to the view"
        className={ICON_BUTTON}
      >
        <Icon path="M5 9V5h4M19 9V5h-4M5 15v4h4M19 15v4h-4" />
      </button>
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-6"
    >
      <path d={path} />
    </svg>
  );
}

export function PlanLegend({ itemCount }: { itemCount: number }) {
  return (
    <div className="text-body-s text-ink-3 pointer-events-none absolute top-5 left-5">
      <p className="tabular-nums">All dimensions in mm</p>
      <p className="tabular-nums">
        {itemCount} item{itemCount === 1 ? "" : "s"} placed
      </p>
    </div>
  );
}
