"use client";

import * as THREE from "three";
import { Html } from "@react-three/drei";
import {
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
} from "../shared/geometry";
import {
  HOUSEHOLDS_BOX_SIDE,
  COMPANIES_BOX_SIDE,
} from "../shared/dataScaling";

function DestinationBox({
  position,
  color,
  label,
  side,
}: {
  position: THREE.Vector3;
  color: string;
  label: string;
  side: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[side, side, side]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.45}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Html
        position={[0, -side / 2 - 0.5, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.85)",
          opacity: 0.95,
        }}
      >
        {label}
      </Html>
    </group>
  );
}

/** Ménages box — side length scaled from household disposable income. */
export function HouseholdsBox() {
  return (
    <DestinationBox
      position={HOUSEHOLDS_BOX_POS}
      color="#4a86c9"
      label="Ménages"
      side={HOUSEHOLDS_BOX_SIDE}
    />
  );
}

/** Entreprises box — side length scaled from firm gross value added. */
export function CompaniesBox() {
  return (
    <DestinationBox
      position={COMPANIES_BOX_POS}
      color="#c98a4a"
      label="Entreprises"
      side={COMPANIES_BOX_SIDE}
    />
  );
}
