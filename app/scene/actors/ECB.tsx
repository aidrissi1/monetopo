"use client";

import { Cone, Html } from "@react-three/drei";
import {
  ECB_CENTER,
  ECB_BASE_RADIUS,
  ECB_HEIGHT,
} from "../shared/geometry";

/**
 * ECB pyramid — authority layer floating above the banking ring. The
 * 4-sided cone is rotated by π/4 so its flat faces point in cardinal
 * directions (better readability than diagonal faces).
 */
export function ECB() {
  return (
    <group position={ECB_CENTER}>
      <Cone
        args={[ECB_BASE_RADIUS, ECB_HEIGHT, 4, 1]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <meshStandardMaterial
          color="#e8cc6e"
          metalness={0.7}
          roughness={0.25}
          emissive="#4a3410"
          emissiveIntensity={0.45}
        />
      </Cone>
      <Html
        position={[0, -ECB_HEIGHT / 2 - 0.7, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          opacity: 0.98,
        }}
      >
        BCE
      </Html>
    </group>
  );
}
