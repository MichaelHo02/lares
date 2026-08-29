"use client";

import { useMemo, useRef, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ResolvedPlacement } from "@/lib/domain/placement";
import { isFloorCovering } from "@/lib/domain/product";
import type { Mm } from "@/lib/domain/units";
import { SNAP_MM } from "@/lib/canvas/viewport";
import { MM_TO_M, mmToM } from "@/lib/studio/units";
import { FurnitureShape } from "./FurnitureShape";
import { useStudioInteraction } from "./StudioInteraction";

interface FurnitureMeshProps {
  entry: ResolvedPlacement;
  wallHeightM: number;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
  onDragEnd: (xMm: Mm, yMm: Mm) => void;
  onRotate: () => void;
}

/**
 * Interactive furniture proxy. Drag on the floor to move; double-click to
 * rotate 90°. Agent edits update the same store, so the mesh follows along.
 */
export function FurnitureMesh({
  entry,
  wallHeightM,
  selected,
  highlighted,
  onSelect,
  onDragEnd,
  onRotate,
}: FurnitureMeshProps) {
  const { footprint, product } = entry;
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const { setOrbitEnabled } = useStudioInteraction();
  const [dragging, setDragging] = useState(false);
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const widthM = mmToM(footprint.width);
  const depthM = mmToM(footprint.depth);
  const heightM = isFloorCovering(product.category)
    ? 0.02
    : Math.min(mmToM(product.heightMm), wallHeightM * 0.95);

  const centerX = mmToM(footprint.x) + widthM / 2;
  const centerZ = mmToM(footprint.y) + depthM / 2;
  const color = highlighted ? "#ca5008" : selected ? "#0058a3" : categoryColor(product.category);
  const metalness = product.styleTags.includes("black metal") ? 0.4 : 0.05;

  function projectToFloor(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const ok = raycaster.ray.intersectPlane(dragPlane, hit);
    return ok ? hit.clone() : null;
  }

  function onPointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onSelect();
    setOrbitEnabled(false);
    setDragging(true);
  }

  function onPointerMove(event: ThreeEvent<PointerEvent>) {
    if (!dragging || !groupRef.current) return;
    event.stopPropagation();
    const point = projectToFloor(event.clientX, event.clientY);
    if (!point) return;
    groupRef.current.position.x = point.x;
    groupRef.current.position.z = point.z;
  }

  function onPointerUp(event: ThreeEvent<PointerEvent>) {
    if (!dragging || !groupRef.current) return;
    event.stopPropagation();
    setDragging(false);
    setOrbitEnabled(true);
    const rawX = (groupRef.current.position.x - widthM / 2) / MM_TO_M;
    const rawY = (groupRef.current.position.z - depthM / 2) / MM_TO_M;
    const xMm = (Math.round(rawX / SNAP_MM) * SNAP_MM) as Mm;
    const yMm = (Math.round(rawY / SNAP_MM) * SNAP_MM) as Mm;
    onDragEnd(xMm, yMm);
  }

  function onDoubleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onRotate();
  }

  return (
    <group
      ref={groupRef}
      position={[centerX, 0, centerZ]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <FurnitureShape
        category={product.category}
        widthM={widthM}
        heightM={heightM}
        depthM={depthM}
        color={color}
        metalness={metalness}
      />
      {selected ? (
        <mesh position={[0, heightM / 2, 0]}>
          <boxGeometry args={[widthM * 1.04, heightM * 1.04, depthM * 1.04]} />
          <meshBasicMaterial color="#111111" wireframe transparent opacity={0.55} />
        </mesh>
      ) : null}
    </group>
  );
}

function categoryColor(category: string): string {
  switch (category) {
    case "sofa":
    case "armchair":
      return "#c4b5a0";
    case "bed":
      return "#d4cfc6";
    case "dining_table":
    case "coffee_table":
    case "desk":
    case "sideboard":
    case "tv_unit":
    case "bookshelf":
    case "wardrobe":
    case "bedside_table":
      return "#b08968";
    case "dining_chair":
    case "office_chair":
      return "#8a8175";
    case "rug":
      return "#e8dcc8";
    case "floor_lamp":
      return "#929292";
    default:
      return "#cccccc";
  }
}
