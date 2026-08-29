"use client";

import { useMemo, useRef, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ResolvedPlacement } from "@/lib/domain/placement";
import { isFloorCovering } from "@/lib/domain/product";
import type { Mm } from "@/lib/domain/units";
import { MM_TO_M, mmToM } from "@/lib/studio/units";
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
 * Box proxy for a catalog product. Drag on the floor plane to move (SketchUp-
 * style nudge); double-click to rotate 90°. Real meshes come later.
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
  const meshRef = useRef<THREE.Mesh>(null);
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
    if (!dragging || !meshRef.current) return;
    event.stopPropagation();
    const point = projectToFloor(event.clientX, event.clientY);
    if (!point) return;
    meshRef.current.position.x = point.x;
    meshRef.current.position.z = point.z;
  }

  function onPointerUp(event: ThreeEvent<PointerEvent>) {
    if (!dragging || !meshRef.current) return;
    event.stopPropagation();
    setDragging(false);
    setOrbitEnabled(true);
    const xMm = Math.round((meshRef.current.position.x - widthM / 2) / MM_TO_M) as Mm;
    const yMm = Math.round((meshRef.current.position.z - depthM / 2) / MM_TO_M) as Mm;
    onDragEnd(xMm, yMm);
  }

  function onDoubleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onRotate();
  }

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      position={[centerX, heightM / 2, centerZ]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <boxGeometry args={[widthM, heightM, depthM]} />
      <meshStandardMaterial
        color={color}
        roughness={0.65}
        metalness={product.styleTags.includes("black metal") ? 0.4 : 0.05}
        transparent={isFloorCovering(product.category)}
        opacity={isFloorCovering(product.category) ? 0.85 : 1}
      />
      {selected ? (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(widthM * 1.02, heightM * 1.02, depthM * 1.02)]}
          />
          <lineBasicMaterial color="#111111" />
        </lineSegments>
      ) : null}
    </mesh>
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
