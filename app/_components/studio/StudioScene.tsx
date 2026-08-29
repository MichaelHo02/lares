"use client";

import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Finding } from "@/lib/clearance/findings";
import { resolveLayout } from "@/lib/domain/placement";
import { moveItem, rotateItem, selectPlacement } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { DEFAULT_WALL_HEIGHT_MM, mmToM } from "@/lib/studio/units";
import { findingKey } from "../plan/ViolationOverlay";
import { FurnitureMesh } from "./FurnitureMesh";
import { RoomMesh } from "./RoomMesh";

interface StudioSceneProps {
  findings: readonly Finding[];
  highlightedKey: string | null;
}

export function StudioScene({ findings, highlightedKey }: StudioSceneProps) {
  const room = usePlannerStore((state) => state.room);
  const placements = usePlannerStore((state) => state.placements);
  const catalog = usePlannerStore((state) => state.catalog);
  const selectedPlacementId = usePlannerStore((state) => state.selectedPlacementId);

  const resolved = useMemo(
    () => resolveLayout(placements, catalog).resolved,
    [placements, catalog],
  );

  const wallHeightM = mmToM(DEFAULT_WALL_HEIGHT_MM);
  const widthM = mmToM(room.widthMm);
  const depthM = mmToM(room.depthMm);

  return (
    <group>
      <ambientLight intensity={0.75} />
      <directionalLight
        castShadow
        intensity={1.1}
        position={[widthM * 0.6, wallHeightM * 2.2, depthM * 0.4]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#f5f5f5", "#e8e4dc", 0.35]} />

      <RoomMesh room={room} wallHeightM={wallHeightM} />

      {resolved.map((entry) => {
        const selected = entry.placement.id === selectedPlacementId;
        const highlighted = findingTouchesPlacement(
          findings,
          highlightedKey,
          entry.placement.id,
        );
        return (
          <FurnitureMesh
            key={entry.placement.id}
            entry={entry}
            wallHeightM={wallHeightM}
            selected={selected}
            highlighted={highlighted}
            onSelect={() => selectPlacement(entry.placement.id)}
            onDragEnd={(xMm, yMm) =>
              moveItem({
                placementId: entry.placement.id,
                x: xMm,
                y: yMm,
                source: "user",
              })
            }
            onRotate={() => {
              const next = ((entry.placement.rotation + 90) % 360) as 0 | 90 | 180 | 270;
              rotateItem({
                placementId: entry.placement.id,
                rotation: next,
                source: "user",
              });
            }}
          />
        );
      })}

      {/* Invisible floor plane for deselect / empty clicks */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[widthM / 2, 0.001, depthM / 2]}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          selectPlacement(null);
        }}
      >
        <planeGeometry args={[widthM, depthM]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

function findingTouchesPlacement(
  findings: readonly Finding[],
  highlightedKey: string | null,
  placementId: string,
): boolean {
  if (!highlightedKey) return false;
  const match = findings.find(
    (finding, index) => findingKey(finding, index) === highlightedKey,
  );
  return match?.placementIds.includes(placementId) ?? false;
}
