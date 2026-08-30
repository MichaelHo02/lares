"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checkLayout } from "@/lib/clearance/checkLayout";
import { usePlannerStore } from "@/lib/store/store";
import { LARES_TOOLS } from "@/lib/webmcp/tools";
import { useWebMCPTools } from "@/lib/webmcp/useWebMCPTool";
import { CheckoutGate } from "./_components/panels/CheckoutGate";
import { EmptyStudio } from "./_components/studio/EmptyStudio";
import { SceneDetails } from "./_components/studio/SceneDetails";
import { StudioTopBar } from "./_components/studio/StudioTopBar";
import { StudioViewport } from "./_components/studio/StudioViewport";

/**
 * Viewport + overlay chrome on the left, docked scene/shop/cost sidebar on
 * the right. The canvas is the product; the sidebar is retail + inspector.
 */
export default function Home() {
  const room = usePlannerStore((state) => state.room);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);

  const { available, registered, error } = useWebMCPTools(LARES_TOOLS);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const openedDetailsForRoom = useRef(false);

  useEffect(() => {
    if (room && !openedDetailsForRoom.current) {
      setDetailsOpen(true);
      openedDetailsForRoom.current = true;
    }
  }, [room]);

  const findings = useMemo(
    () => (room ? checkLayout(room, placements, catalog).findings : []),
    [room, placements, catalog],
  );

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-canvas-bg">
      <div className="relative min-w-0 flex-1">
        <StudioViewport findings={findings} highlightedKey={highlightedKey} />
        {room ? null : (
          <EmptyStudio
            available={available}
            registeredCount={registered.length}
            error={error}
          />
        )}
        <StudioTopBar
          available={available}
          registeredCount={registered.length}
          detailsOpen={detailsOpen}
          onOpenDetails={() => setDetailsOpen(true)}
        />
        <div className="pointer-events-none absolute left-1/2 top-14 z-30 w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2">
          <div className="pointer-events-auto">
            <CheckoutGate />
          </div>
        </div>
      </div>
      <SceneDetails
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        findings={findings}
        onHighlight={setHighlightedKey}
      />
    </div>
  );
}
