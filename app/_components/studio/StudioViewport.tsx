"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { MOUSE, TOUCH } from "three";
import type { Finding } from "@/lib/clearance/findings";
import { resolveLayout } from "@/lib/domain/placement";
import { usePlannerStore } from "@/lib/store/store";
import { DEFAULT_WALL_HEIGHT_MM, mmToM } from "@/lib/studio/units";
import { StudioInteractionProvider, useStudioInteraction } from "./StudioInteraction";
import { StudioScene } from "./StudioScene";
import { useStudioKeyboard } from "./useStudioKeyboard";

export type ViewMode = "perspective" | "front" | "top";

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
  const [autoFollow, setAutoFollow] = useState(true);

  const resolved = useMemo(
    () => resolveLayout(placements, catalog).resolved,
    [placements, catalog],
  );
  useStudioKeyboard(resolved, selectedId);

  const widthM = mmToM(room.widthMm);
  const depthM = mmToM(room.depthMm);
  const wallHeightM = mmToM(DEFAULT_WALL_HEIGHT_MM);
  const selected = resolved.find((entry) => entry.placement.id === selectedId);
  const target = useMemo<[number, number, number]>(() => {
    if (autoFollow && selected) {
      return [
        mmToM(selected.footprint.x) + mmToM(selected.footprint.width) / 2,
        0,
        mmToM(selected.footprint.y) + mmToM(selected.footprint.depth) / 2,
      ];
    }
    return [widthM / 2, 0, depthM / 2];
  }, [autoFollow, selected, widthM, depthM]);
  const perspectivePosition: [number, number, number] = [
    widthM * 0.85,
    wallHeightM * 1.6,
    depthM * 1.35,
  ];
  const frontPosition: [number, number, number] = [
    widthM / 2,
    wallHeightM * 0.7,
    depthM + Math.max(2.2, depthM * 0.45),
  ];
  const topPosition: [number, number, number] = [
    widthM / 2,
    Math.max(widthM, depthM) * 1.4,
    depthM / 2,
  ];
  const cameraPosition =
    viewMode === "front"
      ? frontPosition
      : viewMode === "top"
        ? topPosition
        : perspectivePosition;
  const orthoZoom = 80 / Math.max(widthM, depthM);

  return (
    <div className="relative h-full w-full bg-canvas-bg">
      <Canvas shadows gl={{ antialias: true }}>
        <color attach="background" args={["#faf9f7"]} />
        <Suspense fallback={null}>
          {viewMode === "top" ? (
            <OrthographicCamera
              makeDefault
              position={topPosition}
              zoom={orthoZoom}
              near={0.1}
              far={200}
            />
          ) : (
            <PerspectiveCamera
              makeDefault
              position={cameraPosition}
              fov={42}
              near={0.05}
              far={80}
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

      <div
        role="group"
        aria-label="Scene viewing angle"
        className="absolute bottom-4 left-3 z-10 flex flex-nowrap items-center gap-0.5 rounded-pill border border-hairline bg-surface/95 p-1 shadow-sheet backdrop-blur-sm"
      >
        <ViewChip selected={autoFollow} onClick={() => setAutoFollow((value) => !value)}>
          Auto follow
        </ViewChip>
        <ViewChip
          selected={viewMode === "perspective"}
          onClick={() => setViewMode("perspective")}
        >
          Perspective
        </ViewChip>
        <ViewChip selected={viewMode === "front"} onClick={() => setViewMode("front")}>
          Front
        </ViewChip>
        <ViewChip selected={viewMode === "top"} onClick={() => setViewMode("top")}>
          Top
        </ViewChip>
      </div>
    </div>
  );
}

function ViewChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-8 whitespace-nowrap rounded-pill px-3 text-label-s font-bold ${
        selected ? "bg-surface-sunken text-ink" : "text-ink-2 hover:bg-subtle-hover"
      }`}
    >
      {children}
    </button>
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
