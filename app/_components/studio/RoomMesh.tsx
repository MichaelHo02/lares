"use client";

import {
  openingSegment,
  type Opening,
  type Room,
  type WallName,
} from "@/lib/domain/room";
import { mmToM } from "@/lib/studio/units";

interface RoomMeshProps {
  room: Room;
  wallHeightM: number;
}

/**
 * Top-down plan coordinates map to Three.js as X = east, Z = south, Y = up.
 * Walls are split around openings so doors and windows read as real voids.
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

      <gridHelper
        args={[
          Math.max(widthM, depthM),
          Math.max(8, Math.round(Math.max(widthM, depthM))),
          "#dfdfdf",
          "#eeeeee",
        ]}
        position={[widthM / 2, 0.002, depthM / 2]}
      />

      {(["north", "east", "south", "west"] as const).map((wall) => (
        <WallWithOpenings
          key={wall}
          room={room}
          wall={wall}
          wallHeightM={wallHeightM}
          thickness={wallThickness}
        />
      ))}

      {room.openings.map((opening) => (
        <OpeningMarker
          key={opening.id}
          room={room}
          opening={opening}
          wallHeightM={wallHeightM}
          thickness={wallThickness}
        />
      ))}

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

function WallWithOpenings({
  room,
  wall,
  wallHeightM,
  thickness,
}: {
  room: Room;
  wall: WallName;
  wallHeightM: number;
  thickness: number;
}) {
  const lengthMm =
    wall === "north" || wall === "south" ? room.widthMm : room.depthMm;
  const openings = room.openings
    .filter((opening) => opening.wall === wall)
    .slice()
    .sort((a, b) => a.offsetMm - b.offsetMm);

  const spans: { startMm: number; endMm: number }[] = [];
  let cursor = 0;
  for (const opening of openings) {
    const start = Math.max(0, opening.offsetMm);
    const end = Math.min(lengthMm, opening.offsetMm + opening.widthMm);
    if (start > cursor) spans.push({ startMm: cursor, endMm: start });
    cursor = Math.max(cursor, end);
  }
  if (cursor < lengthMm) spans.push({ startMm: cursor, endMm: lengthMm });

  return (
    <group>
      {spans.map((span) => {
        const spanLengthM = mmToM(span.endMm - span.startMm);
        if (spanLengthM <= 0.01) return null;
        const midMm = (span.startMm + span.endMm) / 2;
        const { position, rotationY } = wallPose(room, wall, midMm, wallHeightM / 2);
        return (
          <mesh
            key={`${wall}-${span.startMm}-${span.endMm}`}
            castShadow
            receiveShadow
            position={position}
            rotation={[0, rotationY, 0]}
          >
            <boxGeometry args={[spanLengthM, wallHeightM, thickness]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>
        );
      })}

      {/* Lintels above each opening so the wall still reads as continuous */}
      {openings.map((opening) => {
        const openingHeightM = mmToM(opening.heightMm);
        const sillM = opening.type === "window" ? wallHeightM * 0.32 : 0;
        const topOfOpening = sillM + openingHeightM;
        if (topOfOpening >= wallHeightM - 0.02) return null;
        const lintelHeight = wallHeightM - topOfOpening;
        const midMm = opening.offsetMm + opening.widthMm / 2;
        const { position, rotationY } = wallPose(
          room,
          wall,
          midMm,
          topOfOpening + lintelHeight / 2,
        );
        return (
          <mesh
            key={`${opening.id}-lintel`}
            castShadow
            receiveShadow
            position={position}
            rotation={[0, rotationY, 0]}
          >
            <boxGeometry args={[mmToM(opening.widthMm), lintelHeight, thickness]} />
            <meshStandardMaterial color="#f5f5f5" />
          </mesh>
        );
      })}
    </group>
  );
}

function OpeningMarker({
  room,
  opening,
  wallHeightM,
  thickness,
}: {
  room: Room;
  opening: Opening;
  wallHeightM: number;
  thickness: number;
}) {
  const sillM = opening.type === "window" ? wallHeightM * 0.32 : 0;
  const heightM = Math.min(mmToM(opening.heightMm), wallHeightM - sillM - 0.02);
  const midMm = opening.offsetMm + opening.widthMm / 2;
  const { position, rotationY } = wallPose(room, opening.wall, midMm, sillM + heightM / 2);
  const widthM = mmToM(opening.widthMm);

  if (opening.type === "window") {
    return (
      <mesh position={position} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[widthM, heightM, thickness * 0.4]} />
        <meshStandardMaterial
          color="#9ec9e8"
          transparent
          opacity={0.45}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
    );
  }

  // Door: thin frame + floor arc so swing intent is visible in 3D.
  const segment = openingSegment(room, opening);
  const hinge = opening.swing?.hingeSide ?? "start";
  const hingePoint = segment
    ? hinge === "start"
      ? segment.start
      : segment.end
    : null;

  return (
    <group>
      <mesh position={position} rotation={[0, rotationY, 0]}>
        <boxGeometry args={[widthM, heightM, thickness * 0.25]} />
        <meshStandardMaterial color="#d6c3a8" roughness={0.7} />
      </mesh>
      {hingePoint ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[mmToM(hingePoint.x), 0.015, mmToM(hingePoint.y)]}
        >
          <ringGeometry args={[0.05, mmToM(opening.widthMm), 24, 1, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#0058a3" transparent opacity={0.25} />
        </mesh>
      ) : null}
    </group>
  );
}

function wallPose(
  room: Room,
  wall: WallName,
  offsetAlongWallMm: number,
  heightM: number,
): { position: [number, number, number]; rotationY: number } {
  const widthM = mmToM(room.widthMm);
  const depthM = mmToM(room.depthMm);
  const alongM = mmToM(offsetAlongWallMm);

  switch (wall) {
    case "north":
      return { position: [alongM, heightM, 0], rotationY: 0 };
    case "east":
      return { position: [widthM, heightM, alongM], rotationY: Math.PI / 2 };
    case "south":
      // South wall runs east→west in storage; offset is from the east end.
      return { position: [widthM - alongM, heightM, depthM], rotationY: 0 };
    case "west":
      // West wall runs south→north in storage; offset is from the south end.
      return { position: [0, heightM, depthM - alongM], rotationY: Math.PI / 2 };
    default: {
      const exhaustive: never = wall;
      throw new Error(`unhandled wall: ${String(exhaustive)}`);
    }
  }
}
