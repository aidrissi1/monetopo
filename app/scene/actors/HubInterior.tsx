"use client";

import * as THREE from "three";
import { Sphere, Html } from "@react-three/drei";
import { CREATORS } from "../shared/creators";
import { bankData } from "../shared/dataScaling";
import { HUB_RADIUS_SCALED } from "../shared/dataScaling";

/**
 * Interior of the capital hub — 11 sub-spheres, one per commercial bank,
 * sized proportionally to their real CET1 capital (from banks.json).
 * Arrangement: fibonacci-sphere distribution on a shell inside the hub.
 *
 * This is the pedagogical fix to the "hub = single pool" simplification:
 * when the user opens the hub, they see that capital is per-bank (Santander
 * dominates, the smaller banks are visibly tinier) and NOT mutualized.
 */

function fibonacciPoints(n: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (Math.sqrt(5) - 1); // golden angle
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    points.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius
      )
    );
  }
  return points;
}

// Sub-sphere radius scaled from bank CET1 (sqrt compression).
const MIN_CET1_RADIUS = 0.1;
const MAX_CET1_RADIUS = 0.35;
function cet1SphereRadius(cet1BnEur: number, minCet1: number, maxCet1: number): number {
  const t =
    (Math.sqrt(cet1BnEur) - Math.sqrt(minCet1)) /
    (Math.sqrt(maxCet1) - Math.sqrt(minCet1));
  return MIN_CET1_RADIUS + t * (MAX_CET1_RADIUS - MIN_CET1_RADIUS);
}

export function HubInterior() {
  // Collect the commercial banks that actually publish a CET1 figure
  const banksWithCet1 = CREATORS
    .map((c) => {
      const d = bankData(c.id);
      return d && d.cet1_bn_eur !== undefined
        ? { creator: c, cet1: d.cet1_bn_eur }
        : null;
    })
    .filter(
      (x): x is { creator: (typeof CREATORS)[number]; cet1: number } => x !== null
    );

  const cet1Values = banksWithCet1.map((b) => b.cet1);
  const minCet1 = Math.min(...cet1Values);
  const maxCet1 = Math.max(...cet1Values);

  // Inner shell radius — leave some margin from the outer hub surface
  const innerRadius = HUB_RADIUS_SCALED * 0.52;
  const positions = fibonacciPoints(banksWithCet1.length, innerRadius);

  return (
    <group>
      {banksWithCet1.map(({ creator, cet1 }, i) => {
        const r = cet1SphereRadius(cet1, minCet1, maxCet1);
        return (
          <group key={creator.id} position={positions[i]}>
            <Sphere args={[r, 24, 24]}>
              <meshStandardMaterial
                color={creator.color}
                metalness={0.3}
                roughness={0.4}
                emissive={creator.color}
                emissiveIntensity={0.45}
              />
            </Sphere>
            <Html
              position={[0, r + 0.15, 0]}
              center
              distanceFactor={7}
              style={{
                pointerEvents: "none",
                color: "#f0f4fa",
                fontSize: 10,
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: "0 1px 3px rgba(0,0,0,0.95)",
                lineHeight: 1.15,
              }}
            >
              <div style={{ fontWeight: 700 }}>{creator.name}</div>
              <div style={{ fontSize: 9, opacity: 0.85 }}>{cet1} B€</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
