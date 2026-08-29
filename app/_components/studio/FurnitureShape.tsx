"use client";

import type { ProductCategory } from "@/lib/domain/product";

interface FurnitureShapeProps {
  category: ProductCategory;
  widthM: number;
  heightM: number;
  depthM: number;
  color: string;
  metalness: number;
}

/**
 * Category-aware proxy meshes. Not photoreal — just enough silhouette that a
 * sofa reads differently from a lamp while the agent and user share the studio.
 */
export function FurnitureShape({
  category,
  widthM,
  heightM,
  depthM,
  color,
  metalness,
}: FurnitureShapeProps) {
  const material = (
    <meshStandardMaterial
      color={color}
      roughness={0.65}
      metalness={metalness}
      transparent={category === "rug"}
      opacity={category === "rug" ? 0.85 : 1}
    />
  );

  switch (category) {
    case "sofa":
    case "armchair":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, heightM * 0.28, 0]}>
            <boxGeometry args={[widthM, heightM * 0.55, depthM]} />
            {material}
          </mesh>
          <mesh castShadow position={[0, heightM * 0.72, -depthM * 0.32]}>
            <boxGeometry args={[widthM * 0.95, heightM * 0.45, depthM * 0.22]} />
            {material}
          </mesh>
        </group>
      );
    case "bed":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, heightM * 0.35, 0]}>
            <boxGeometry args={[widthM, heightM * 0.45, depthM]} />
            {material}
          </mesh>
          <mesh castShadow position={[0, heightM * 0.7, -depthM * 0.42]}>
            <boxGeometry args={[widthM * 0.98, heightM * 0.55, depthM * 0.12]} />
            {material}
          </mesh>
        </group>
      );
    case "dining_table":
    case "coffee_table":
    case "desk":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, heightM * 0.9, 0]}>
            <boxGeometry args={[widthM, heightM * 0.12, depthM]} />
            {material}
          </mesh>
          {(
            [
              [-0.4, -0.4],
              [0.4, -0.4],
              [-0.4, 0.4],
              [0.4, 0.4],
            ] as const
          ).map(([ox, oz]) => (
            <mesh
              key={`${ox},${oz}`}
              castShadow
              position={[widthM * ox, heightM * 0.4, depthM * oz]}
            >
              <boxGeometry args={[widthM * 0.08, heightM * 0.8, depthM * 0.08]} />
              {material}
            </mesh>
          ))}
        </group>
      );
    case "floor_lamp":
      return (
        <group>
          <mesh castShadow position={[0, heightM * 0.45, 0]}>
            <cylinderGeometry args={[0.02, 0.02, heightM * 0.9, 8]} />
            {material}
          </mesh>
          <mesh castShadow position={[0, heightM * 0.92, 0]}>
            <coneGeometry
              args={[Math.min(widthM, depthM) * 0.35, heightM * 0.2, 12]}
            />
            {material}
          </mesh>
          <mesh receiveShadow position={[0, 0.02, 0]}>
            <cylinderGeometry
              args={[
                Math.min(widthM, depthM) * 0.35,
                Math.min(widthM, depthM) * 0.35,
                0.04,
                12,
              ]}
            />
            {material}
          </mesh>
        </group>
      );
    case "dining_chair":
    case "office_chair":
      return (
        <group>
          <mesh castShadow receiveShadow position={[0, heightM * 0.35, 0]}>
            <boxGeometry args={[widthM, heightM * 0.12, depthM]} />
            {material}
          </mesh>
          <mesh castShadow position={[0, heightM * 0.7, -depthM * 0.35]}>
            <boxGeometry args={[widthM * 0.9, heightM * 0.55, depthM * 0.12]} />
            {material}
          </mesh>
        </group>
      );
    case "rug":
      return (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[widthM, depthM]} />
          {material}
        </mesh>
      );
    case "wardrobe":
    case "bookshelf":
    case "sideboard":
    case "tv_unit":
    case "bedside_table":
      return (
        <mesh castShadow receiveShadow position={[0, heightM / 2, 0]}>
          <boxGeometry args={[widthM, heightM, depthM]} />
          {material}
        </mesh>
      );
    default: {
      const exhaustive: never = category;
      void exhaustive;
      return (
        <mesh castShadow receiveShadow position={[0, heightM / 2, 0]}>
          <boxGeometry args={[widthM, heightM, depthM]} />
          {material}
        </mesh>
      );
    }
  }
}
