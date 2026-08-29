"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Finding } from "@/lib/clearance/findings";
import { resolveLayout } from "@/lib/domain/placement";
import {
  IDENTITY_VIEW,
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  computeViewBox,
  mmPerPixel,
  type ViewTransform,
} from "@/lib/geometry/viewport";
import { selectPlacement } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { PlanLegend, ScaleBar, ZoomControls } from "./CanvasChrome";
import { FurnitureItem } from "./FurnitureItem";
import { PlanDefs } from "./PlanDefs";
import { PlanGrid } from "./PlanGrid";
import { RoomShell } from "./RoomShell";
import { ViolationOverlay } from "./ViolationOverlay";
import { makePxToMm } from "./planStyle";
import { usePlanInteraction } from "./usePlanInteraction";

interface FloorPlanCanvasProps {
  findings: readonly Finding[];
  highlightedKey: string | null;
}

export function FloorPlanCanvas({ findings, highlightedKey }: FloorPlanCanvasProps) {
  const room = usePlannerStore((state) => state.room);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);
  const selectedId = usePlannerStore((state) => state.selectedPlacementId);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState<ViewTransform>(IDENTITY_VIEW);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const viewBox = useMemo(() => computeViewBox(room, view), [room, view]);
  const mmPerPx = useMemo(
    () => mmPerPixel(viewBox, size.width, size.height),
    [viewBox, size],
  );
  const px = useMemo(() => makePxToMm(mmPerPx), [mmPerPx]);

  const { resolved } = useMemo(
    () => resolveLayout(placements, catalog),
    [placements, catalog],
  );

  const { drag, beginDrag, updateDrag, endDrag } = usePlanInteraction({
    svgRef,
    room,
    resolved,
    selectedId,
  });

  useLayoutEffect(() => {
    const element = svgRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) setSize({ width: box.width, height: box.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setView((current) => ({ ...current, zoom: clampZoom(current.zoom * factor) }));
  }, []);
  const fit = useCallback(() => setView(IDENTITY_VIEW), []);

  return (
    <div className="bg-canvas-bg relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={viewBox.value}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label={`Floor plan of ${room.name}, ${room.widthMm} by ${room.depthMm} millimetres, with ${placements.length} items placed. Drag an item to move it; press R to rotate, Delete to remove, and the arrow keys to nudge.`}
        className="h-full w-full touch-none select-none"
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(event) => {
          if (event.target === svgRef.current) selectPlacement(null);
        }}
      >
        <PlanDefs />

        <PlanGrid room={room} mmPerPx={mmPerPx} />
        <RoomShell room={room} px={px} />
        <ViolationOverlay
          findings={findings}
          px={px}
          highlightedKey={highlightedKey}
        />

        {resolved.map((entry) => (
          <FurnitureItem
            key={entry.placement.id}
            entry={entry}
            px={px}
            selected={entry.placement.id === selectedId}
            dragging={drag?.placementId === entry.placement.id}
            onPointerDown={beginDrag}
          />
        ))}
      </svg>

      <PlanLegend itemCount={placements.length} />
      <ScaleBar mmPerPx={mmPerPx} />
      <ZoomControls
        onZoomIn={() => zoomBy(1.25)}
        onZoomOut={() => zoomBy(1 / 1.25)}
        onFit={fit}
        canZoomIn={view.zoom < MAX_ZOOM}
        canZoomOut={view.zoom > MIN_ZOOM}
      />
    </div>
  );
}
