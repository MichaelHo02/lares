"use client";

import { useMemo, useState } from "react";
import { checkLayout } from "@/lib/clearance/checkLayout";
import { usePlannerStore } from "@/lib/store/store";
import { LARES_TOOLS } from "@/lib/webmcp/tools";
import { useWebMCPTools } from "@/lib/webmcp/useWebMCPTool";
import { StudioViewport } from "./_components/studio/StudioViewport";
import { CatalogBrowser } from "./_components/panels/CatalogBrowser";
import { CheckoutGate } from "./_components/panels/CheckoutGate";
import { CostSummary } from "./_components/panels/CostSummary";
import { FindingsList } from "./_components/panels/FindingsList";
import { HowToUse } from "./_components/panels/HowToUse";
import { SelectionBar } from "./_components/panels/SelectionBar";

/**
 * SketchUp + IKEA shell: 3D studio as the hero, catalog + cost as the retail
 * sidebar. The agent drives the same store through WebMCP; the viewport follows.
 */
export default function Home() {
  const room = usePlannerStore((state) => state.room);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);

  const { available, registered, error } = useWebMCPTools(LARES_TOOLS);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  const findings = useMemo(
    () => checkLayout(room, placements, catalog).findings,
    [room, placements, catalog],
  );

  return (
    <div className="mx-auto flex w-full max-w-page flex-1 flex-col gap-5 p-4 lg:h-dvh lg:flex-none lg:flex-row lg:gap-8 lg:overflow-hidden lg:p-6">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <header>
          <h1 className="text-heading-xl font-bold text-ink">
            <span className="rounded-badge bg-accent-yellow px-2">Lares</span>
          </h1>
          <p className="mt-1 text-body-m text-ink-2 tabular-nums">
            {room.name} · {room.widthMm} × {room.depthMm}mm · 3D studio
          </p>
        </header>

        <div className="h-[60vh] min-h-[24rem] overflow-hidden rounded-card border border-hairline bg-canvas-bg lg:h-auto lg:min-h-0 lg:flex-1">
          <StudioViewport findings={findings} highlightedKey={highlightedKey} />
        </div>

        <SelectionBar />
      </main>

      <aside className="flex w-full shrink-0 flex-col gap-5 lg:min-h-0 lg:w-[26rem] lg:overflow-y-auto">
        <CheckoutGate />
        <HowToUse
          available={available}
          registeredCount={registered.length}
          error={error}
        />
        <CostSummary />
        <CatalogBrowser />
        <FindingsList findings={findings} onHighlight={setHighlightedKey} />
      </aside>
    </div>
  );
}
