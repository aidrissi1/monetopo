"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Sphere, Html } from "@react-three/drei";
import nbfiData from "../../data/nbfi.json";
import { HUB_RADIUS_SCALED } from "../shared/dataScaling";
import { OpenableSphere } from "./OpenableSphere";

// ─── Shadow money cluster ──────────────────────────────────────────────
// Openable clamshell. Closed: solid grey sphere with label. Open: top and
// bottom hemispheres split apart, revealing 4 sub-spheres (Repo, MMF,
// Crédit privé, Stablecoins) that represent the non-bank plumbing — the
// "zone grise" that amplifies or substitutes for bank credit.
const SHADOW_CENTER = new THREE.Vector3(18, 5, 10);
const SHADOW_CLOUD_RADIUS = 2.6;

interface ShadowNode {
  id: string;
  label: string;
  valueLabel: string;
  color: string;
  offset: [number, number, number];
  radius: number;
}

const SHADOW_NODES: ShadowNode[] = [
  {
    id: "repo",
    label: "Repo",
    valueLabel: "€1 800 Md/jour",
    color: "#8a96a8",
    offset: [-1.2, 0.6, 0],
    radius: 0.7,
  },
  {
    id: "mmf",
    label: "MMF",
    valueLabel: "€650 Md",
    color: "#8294a6",
    offset: [1.2, 0.6, 0],
    radius: 0.5,
  },
  {
    id: "private_credit",
    label: "Crédit privé",
    valueLabel: "€520 Md",
    color: "#7d8b9b",
    offset: [-0.9, -0.9, 0.3],
    radius: 0.48,
  },
  {
    id: "stablecoins",
    label: "Stablecoins",
    valueLabel: "€190 Md",
    color: "#7a889a",
    offset: [0.9, -0.9, 0.3],
    radius: 0.38,
  },
];

export function ShadowMoney() {
  // Amplifier pipe from the cluster's outer surface toward the hub.
  // Rendered once outside the OpenableSphere so it's always visible.
  const amplifierGeometry = useMemo(() => {
    const dirToHub = new THREE.Vector3(0, 0, 0)
      .sub(SHADOW_CENTER)
      .normalize();
    const start = SHADOW_CENTER.clone().add(
      dirToHub.clone().multiplyScalar(SHADOW_CLOUD_RADIUS * 0.95)
    );
    const end = dirToHub
      .clone()
      .multiplyScalar(-(HUB_RADIUS_SCALED - 0.4))
      .negate();
    const c1 = new THREE.Vector3()
      .lerpVectors(start, end, 0.35)
      .add(new THREE.Vector3(0, 1.2, 0.5));
    const c2 = new THREE.Vector3()
      .lerpVectors(start, end, 0.65)
      .add(new THREE.Vector3(0, 1.0, 0));
    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 48, 0.09, 10, false);
  }, []);

  return (
    <>
      {/* Openable cluster shell: solid when closed, splits open on "ouvrir" */}
      <OpenableSphere
        entityId="shadow_money"
        center={SHADOW_CENTER}
        radius={SHADOW_CLOUD_RADIUS}
        color="#4a5668"
        emissive="#2a3442"
        emissiveIntensity={0.35}
        metalness={0.3}
        roughness={0.55}
      >
        {/* Sub-nodes — only visible when the shell splits */}
        {SHADOW_NODES.map((n) => (
          <group key={n.id} position={n.offset}>
            <Sphere args={[n.radius, 32, 32]}>
              <meshStandardMaterial
                color={n.color}
                metalness={0.4}
                roughness={0.4}
                emissive={n.color}
                emissiveIntensity={0.35}
              />
            </Sphere>
            <Html
              position={[0, n.radius + 0.2, 0]}
              center
              distanceFactor={9}
              style={{
                pointerEvents: "none",
                color: "#eef2f8",
                fontSize: 11,
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: "0 1px 3px rgba(0,0,0,0.95)",
                opacity: 0.98,
                lineHeight: 1.15,
              }}
            >
              <div style={{ fontWeight: 700 }}>{n.label}</div>
              <div style={{ fontSize: 10, opacity: 0.85 }}>{n.valueLabel}</div>
            </Html>
          </group>
        ))}
      </OpenableSphere>

      {/* External label — always visible */}
      <group position={SHADOW_CENTER}>
        <Html
          position={[0, -SHADOW_CLOUD_RADIUS - 0.6, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: "none",
            color: "#c9d2e0",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textShadow: "0 1px 4px rgba(0,0,0,0.9)",
            opacity: 0.9,
            whiteSpace: "nowrap",
          }}
        >
          Finance parallèle
        </Html>
        <Html
          position={[0, -SHADOW_CLOUD_RADIUS - 1.0, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: "none",
            color: "#9aa4b4",
            fontSize: 10,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            opacity: 0.8,
            whiteSpace: "nowrap",
          }}
        >
          NBFI UE : €{(nbfiData.eu_aggregate.total_nbfi_assets_bn_eur / 1000).toFixed(1)}T
          · {nbfiData.eu_aggregate.nbfi_as_pct_of_gdp}% PIB
        </Html>
      </group>

      {/* Amplifier pipe → capital hub (always rendered) */}
      <mesh geometry={amplifierGeometry}>
        <meshStandardMaterial
          color="#8a96a8"
          metalness={0.3}
          roughness={0.5}
          emissive="#5a6478"
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  );
}

export { SHADOW_CENTER };
