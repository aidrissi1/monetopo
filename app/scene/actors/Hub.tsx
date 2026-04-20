"use client";

import { Sphere } from "@react-three/drei";
import { HUB_RADIUS_SCALED } from "../shared/dataScaling";

/**
 * The central hub sphere — aggregate capital backing money creation.
 * Radius sized from the sum of all Spanish banks' CET1 (€223B in 2024).
 */
export function Hub() {
  return (
    <Sphere args={[HUB_RADIUS_SCALED, 64, 64]}>
      <meshStandardMaterial
        color="#2d5fff"
        metalness={0.25}
        roughness={0.35}
        emissive="#0a1a55"
        emissiveIntensity={0.4}
      />
    </Sphere>
  );
}
