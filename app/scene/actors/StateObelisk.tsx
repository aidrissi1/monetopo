"use client";

import { Cone, Html } from "@react-three/drei";
import {
  STATE_POSITION,
  STATE_SHAFT_SIZE,
  STATE_SHAFT_HEIGHT,
  STATE_CAP_HEIGHT,
} from "../shared/geometry";

/**
 * Obelisk representing the State. Shaft + pyramidion cap aligned via
 * π/4 rotation so the cap's base corners sit on the shaft's top corners.
 */
export function StateObelisk() {
  return (
    <group position={STATE_POSITION}>
      <mesh>
        <boxGeometry args={[STATE_SHAFT_SIZE, STATE_SHAFT_HEIGHT, STATE_SHAFT_SIZE]} />
        <meshStandardMaterial
          color="#3d4a5c"
          metalness={0.45}
          roughness={0.45}
          emissive="#1a2430"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Cone
        args={[Math.SQRT2, STATE_CAP_HEIGHT, 4, 1]}
        position={[0, STATE_SHAFT_HEIGHT / 2 + STATE_CAP_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <meshStandardMaterial
          color="#6a7a8c"
          metalness={0.6}
          roughness={0.3}
          emissive="#2a3440"
          emissiveIntensity={0.35}
        />
      </Cone>
      <Html
        position={[0, -STATE_SHAFT_HEIGHT / 2 - 0.7, 0]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          opacity: 0.95,
        }}
      >
        État
      </Html>
    </group>
  );
}
