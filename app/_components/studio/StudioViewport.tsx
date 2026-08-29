"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { MOUSE, TOUCH } from "three";
import type { Finding } from "@/lib/clearance/findings";
import { resolveLayout } from "@/lib/domain/placement";
import { usePlannerStore } from "@/lib/store/store";
import { DEFAULT_WALL_HEIGHT_MM, mmToM } from "@/lib/studio/units";
import { Chip } from "@/app/_components/ui";
import { StudioInteractionProvider, useStudioInteraction } from "./StudioInteraction";
import { StudioScene } from "./StudioScene";
import { useStudioKeyboard } from "./useStudioKeyboard";

type ViewMode = "perspective" | "top";

interface StudioViewportProps {
  findings: readonly Finding[];
  highlightedKey: string | null;
}

/**
 * Hero 3D viewport. Orbit or switch to a top orthographic view (SketchUp-like).
 * Click furniture to select; drag to move; arrows/R/Delete for precise edits.
 * Agent WebMCP mutations update the same store, so this view follows along.
 */
export function StudioViewport({ findings, highlightedKey }: StudioViewportProps) {
  return (
    <StudioInteractionProvider>
      <StudioViewportInner findings={findings} highlightedKey={highlightedKey} />
    </StudioInteractionProvider>
  );
}

function StudioViewportInner({ findings, highlightedKey }: StudioViewportProps) {
  const room = usePlannerStore((state) => state.room);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);
  const selectedId = usePlannerStore((state) => state.selectedPlacementId);
  const { orbitEnabled } = useStudioInteraction();
  const [viewMode, setViewMode] = useState<ViewMode>("perspective");

  const resolved = useMemo(
    () => resolveLayout(placements, catalog).resolved,
    [placements, catalog],
  );
  useStudioKeyboard(resolved, selectedId);

  const widthM = mmToM(room.widthMm);
  const depthM = mmToM(room.depthMm);
  const wallHeightM = mmToM(DEFAULT_WALL_HEIGHT_MM);
  const target: [number, number, number] = [widthM / 2, 0, depthM / 2];
  const perspectivePosition: [number, number, number] = [
    widthM * 0.85,
    wallHeightM * 1.6,
    depthM * 1.35,
  ];
  const topPosition: [number, number, number] = [
    widthM / 2,
    Math.max(widthM, depthM) * 1.4,
    depthM / 2,
  ];
  const orthoZoom = 80 / Math.max(widthM, depthM);

  return (
    <div className="relative h-full w-full bg-canvas-bg">
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <Chip
          selected={viewMode === "perspective"}
          onClick={() => setViewMode("perspective")}
        >
          Perspective
        </Chip>
        <Chip selected={viewMode === "top"} onClick={() => setViewMode("top")}>
          Top
        </Chip>
      </div>

      <Canvas shadows gl={{ antialias: true }}>
        <color attach="background" args={["#faf9f7"]} />
        <Suspense fallback={null}>
          {viewMode === "perspective" ? (
            <PerspectiveCamera
              makeDefault
              position={perspectivePosition}
              fov={42}
              near={0.05}
              far={80}
            />
          ) : (
            <OrthographicCamera
              makeDefault
              position={topPosition}
              zoom={orthoZoom}
              near={0.1}
              far={200}
            />
          )}
          <CameraLookAt target={target} />
          <StudioScene findings={findings} highlightedKey={highlightedKey} />
          <ContactShadows
            position={[widthM / 2, 0.01, depthM / 2]}
            opacity={0.35}
            scale={Math.max(widthM, depthM) * 1.4}
            blur={2.2}
            far={4}
          />
          <OrbitControls
            makeDefault
            enabled={orbitEnabled}
            target={target}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={viewMode === "top" ? 0.01 : Math.PI / 2.05}
            minPolarAngle={viewMode === "top" ? 0 : 0.15}
            minDistance={1.2}
            maxDistance={Math.max(widthM, depthM) * 4}
            mouseButtons={{
              LEFT: MOUSE.ROTATE,
              MIDDLE: MOUSE.DOLLY,
              RIGHT: MOUSE.PAN,
            }}
            touches={{
              ONE: TOUCH.ROTATE,
              TWO: TOUCH.DOLLY_PAN,
            }}
          />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-card border border-hairline bg-surface/90 px-3 py-2 text-caption-m text-ink-2 backdrop-blur-sm">
        Drag to move · arrows nudge · R rotate · Delete remove · Top for plan view
      </div>
    </div>
  );
}

function CameraLookAt({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, target]);
  return null;
}
