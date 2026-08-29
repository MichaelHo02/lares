"use client";

import type { Room } from "@/lib/domain/room";
import { mmToM } from "@/lib/studio/units";

interface RoomMeshProps {
  room: Room;
  wallHeightM: number;
}

/**
 * Top-down plan coordinates map to Three.js as X = east, Z = south, Y = up.
 * The floor sits on Y=0; walls are thin boxes along the perimeter.
 */
export function RoomMesh({ room, wallHeightM }: RoomMeshProps) {
  const widthM = mmToM(room.widthMm);
  const depthM = mmToM(room.depthMm);
  const wallThickness = 0.08;

  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[widthM / 2, 0, depthM / 2]}
      >
        <planeGeometry args={[widthM, depthM]} />
        <meshStandardMaterial color="#faf9f7" />
      </mesh>

      {/* Subtle grid so scale reads like a drafting room */}
      <gridHelper
        args={[Math.max(widthM, depthM), Math.max(8, Math.round(Math.max(widthM, depthM))), "#dfdfdf", "#eeeeee"]}
        position={[widthM / 2, 0.002, depthM / 2]}
      />

      <Wall
        length={widthM}
        height={wallHeightM}
        thickness={wallThickness}
        position={[widthM / 2, wallHeightM / 2, 0]}
        rotationY={0}
      />
      <Wall
        length={widthM}
        height={wallHeightM}
        thickness={wallThickness}
        position={[widthM / 2, wallHeightM / 2, depthM]}
        rotationY={0}
      />
      <Wall
        length={depthM}
        height={wallHeightM}
        thickness={wallThickness}
        position={[0, wallHeightM / 2, depthM / 2]}
        rotationY={Math.PI / 2}
      />
      <Wall
        length={depthM}
        height={wallHeightM}
        thickness={wallThickness}
        position={[widthM, wallHeightM / 2, depthM / 2]}
        rotationY={Math.PI / 2}
      />

      {room.obstructions.map((obstruction) => {
        const w = mmToM(obstruction.widthMm);
        const d = mmToM(obstruction.depthMm);
        const h = wallHeightM * 0.35;
        return (
          <mesh
            key={obstruction.id}
            castShadow
            receiveShadow
            position={[
              mmToM(obstruction.x) + w / 2,
              h / 2,
              mmToM(obstruction.y) + d / 2,
            ]}
          >
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
        );
      })}
    </group>
  );
}

function Wall({
  length,
  height,
  thickness,
  position,
  rotationY,
}: {
  length: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[length, height, thickness]} />
      <meshStandardMaterial color="#f5f5f5" />
    </mesh>
  );
}
