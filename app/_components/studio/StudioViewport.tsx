"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { MOUSE, TOUCH } from "three";
import type { Finding } from "@/lib/clearance/findings";
import { usePlannerStore } from "@/lib/store/store";
import { DEFAULT_WALL_HEIGHT_MM, mmToM } from "@/lib/studio/units";
import { StudioInteractionProvider, useStudioInteraction } from "./StudioInteraction";
import { StudioScene } from "./StudioScene";

interface StudioViewportProps {
  findings: readonly Finding[];
  highlightedKey: string | null;
}

/**
 * Hero 3D viewport. Orbit to look around; click furniture to select; drag to
 * move on the floor; double-click to rotate 90°. Agent edits via WebMCP update
 * the same store, so this view follows along.
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
  const { orbitEnabled } = useStudioInteraction();
  const widthM = mmToM(room.widthMm);
  const depthM = mmToM(room.depthMm);
  const wallHeightM = mmToM(DEFAULT_WALL_HEIGHT_MM);

  const target: [number, number, number] = [widthM / 2, 0, depthM / 2];
  const cameraPosition: [number, number, number] = [
    widthM * 0.85,
    wallHeightM * 1.6,
    depthM * 1.35,
  ];

  return (
    <div className="relative h-full w-full bg-canvas-bg">
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 42, near: 0.05, far: 80 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#faf9f7"]} />
        <Suspense fallback={null}>
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
            maxPolarAngle={Math.PI / 2.05}
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
        Drag furniture to move · double-click to rotate · drag empty space to orbit
      </div>
    </div>
  );
}
