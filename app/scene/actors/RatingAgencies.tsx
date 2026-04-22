"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import ratingData from "@/app/data/rating-agencies.json";
import { TESORO_POSITION } from "../shared/geometry";
import { computeRingPositions } from "../shared/helpers";
import { CREATORS } from "../shared/creators";
import { useHoverStore } from "../shared/hover-store";

interface Agency {
  id: string;
  name: string;
  short: string;
  origin: string;
  role: string;
}

interface RatingData {
  _meta: unknown;
  agencies: Agency[];
}

const REGISTRY = ratingData as RatingData;
const AGENCY_COLOR = "#d65050"; // warning red — downgrades move markets
const RATING_RADIUS = 14;
const RATING_Y = 11;

/**
 * Rating-agency positions — high-altitude ring framing the scene from above.
 */
const AGENCY_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const map: Record<string, THREE.Vector3> = {};
  REGISTRY.agencies.forEach((a, i) => {
    const angle = (i / REGISTRY.agencies.length) * Math.PI * 2 - Math.PI / 2;
    map[a.id] = new THREE.Vector3(
      Math.cos(angle) * RATING_RADIUS,
      RATING_Y,
      Math.sin(angle) * RATING_RADIUS,
    );
  });
  return map;
})();

/**
 * Rating agencies rotate slowly as a halo to emphasize their "above the
 * system" status — they don't touch the scene, they frame it.
 */
function RotatingHalo({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.025;
  });
  return <group ref={ref}>{children}</group>;
}

function RatingLine({
  from,
  to,
  color,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
}) {
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 2;
    return new THREE.CatmullRomCurve3([from, mid, to], false, "catmullrom", 0.5);
  }, [from, to]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 16, 0.006, 4, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} toneMapped={false} />
    </mesh>
  );
}

/**
 * RatingAgencies — 5 small octahedral nodes on a slow-rotating halo above
 * the scene. Thin rating lines drop down to Tesoro + G-SIBs.
 */
export function RatingAgencies() {
  const setHovered = useHoverStore((s) => s.setHovered);
  const ringPositions = useMemo(() => computeRingPositions(), []);
  const bankIdx = useMemo(() => {
    const m: Record<string, number> = {};
    CREATORS.forEach((c, i) => { m[c.id] = i; });
    return m;
  }, []);

  // Targets every agency rates — Tesoro + top 3 G-SIBs
  const ratingTargets: THREE.Vector3[] = useMemo(() => {
    return [
      TESORO_POSITION,
      ringPositions[bankIdx["santander"] ?? 1],
      ringPositions[bankIdx["bbva"] ?? 2],
      ringPositions[bankIdx["caixabank"] ?? 3],
    ].filter((v): v is THREE.Vector3 => !!v);
  }, [ringPositions, bankIdx]);

  return (
    <RotatingHalo>
      {/* Rating lines — each agency to each target */}
      {REGISTRY.agencies.flatMap((agency) => {
        const from = AGENCY_POSITIONS[agency.id];
        return ratingTargets.map((to, i) => (
          <RatingLine
            key={`${agency.id}__${i}`}
            from={from}
            to={to}
            color={AGENCY_COLOR}
          />
        ));
      })}

      {/* Agency nodes — small octahedrons (diamond-like, distinct shape) */}
      {REGISTRY.agencies.map((agency) => {
        const position = AGENCY_POSITIONS[agency.id];
        return (
          <group
            key={agency.id}
            position={position}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered({
                id: agency.id,
                title: agency.name,
                subtitle: `Tier 0 · Agence de notation · ${agency.origin}`,
                meta: [agency.role],
                color: AGENCY_COLOR,
              });
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
              setHovered(null);
            }}
          >
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <octahedronGeometry args={[0.4, 0]} />
              <meshStandardMaterial
                color={AGENCY_COLOR}
                emissive={AGENCY_COLOR}
                emissiveIntensity={0.45}
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>
            <Html
              position={[0, -0.7, 0]}
              center
              distanceFactor={15}
              style={{
                pointerEvents: "none",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                opacity: 0.9,
                whiteSpace: "nowrap",
              }}
            >
              {agency.short}
            </Html>
          </group>
        );
      })}
    </RotatingHalo>
  );
}
