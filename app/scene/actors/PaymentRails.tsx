"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { DistantHtml } from "../shared/DistantHtml";
import railsData from "@/app/data/payment-rails.json";
import { CREATORS } from "../shared/creators";
import { computeRingPositions } from "../shared/helpers";
import { useHoverStore } from "../shared/hover-store";

interface Rail {
  id: string;
  name: string;
  short: string;
  role: string;
  scope: string[];
}

interface RailsData {
  _meta: unknown;
  rails: Rail[];
}

const REGISTRY = railsData as RailsData;
const RAIL_COLOR = "#8a96a8"; // slate — infrastructure signal
const RAIL_Y = -3.5;
const RAIL_RADIUS = 3.2;

/**
 * Payment-rail positions — compact cluster below the bank ring.
 * "Pipes under the pipes" — literally drawn below the scene's ground plane.
 */
const RAIL_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const map: Record<string, THREE.Vector3> = {};
  REGISTRY.rails.forEach((r, i) => {
    const angle = (i / REGISTRY.rails.length) * Math.PI * 2;
    map[r.id] = new THREE.Vector3(
      Math.cos(angle) * RAIL_RADIUS,
      RAIL_Y,
      Math.sin(angle) * RAIL_RADIUS,
    );
  });
  return map;
})();

function RailConnection({
  from,
  to,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
}) {
  const curve = useMemo(() => {
    // Near-vertical rise from rail up to bank — no arc, pipes-under-pipes go straight
    return new THREE.CatmullRomCurve3([from, to], false, "catmullrom", 0.5);
  }, [from, to]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 8, 0.005, 4, false]} />
      <meshBasicMaterial color={RAIL_COLOR} transparent opacity={0.28} toneMapped={false} />
    </mesh>
  );
}

/**
 * PaymentRails — Tier-3 infrastructure layer. 5 hex-cylinder "stations"
 * below the scene, with thin risers up to the banks each rail serves.
 */
export function PaymentRails() {
  const setHovered = useHoverStore((s) => s.setHovered);
  const ringPositions = useMemo(() => computeRingPositions(), []);
  const bankIdx = useMemo(() => {
    const m: Record<string, number> = {};
    CREATORS.forEach((c, i) => { m[c.id] = i; });
    return m;
  }, []);

  return (
    <group>
      {/* Vertical risers from rails up to their banks */}
      {REGISTRY.rails.flatMap((rail) => {
        const from = RAIL_POSITIONS[rail.id];
        return rail.scope
          .map((bankId) => {
            const idx = bankIdx[bankId];
            if (idx === undefined) return null;
            return (
              <RailConnection
                key={`${rail.id}__${bankId}`}
                from={from}
                to={ringPositions[idx]}
              />
            );
          })
          .filter((n): n is NonNullable<typeof n> => n !== null);
      })}

      {/* Rail stations — low hexagonal cylinders */}
      {REGISTRY.rails.map((rail) => {
        const position = RAIL_POSITIONS[rail.id];
        return (
          <group
            key={rail.id}
            position={position}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered({
                id: rail.id,
                title: rail.name,
                subtitle: `Tier 3 · Infrastructure de paiement`,
                meta: [
                  rail.role,
                  `Dessert ${rail.scope.length} banque${rail.scope.length > 1 ? "s" : ""}`,
                ],
                color: RAIL_COLOR,
              });
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
              setHovered(null);
            }}
          >
            {/* Hexagonal disc — "station" feel */}
            <mesh>
              <cylinderGeometry args={[0.42, 0.42, 0.18, 6]} />
              <meshStandardMaterial
                color={RAIL_COLOR}
                emissive={RAIL_COLOR}
                emissiveIntensity={0.35}
                roughness={0.45}
                metalness={0.3}
              />
            </mesh>
            <DistantHtml
              position={[0, -0.4, 0]}
              threshold={8}
              center
              distanceFactor={13}
              style={{
                pointerEvents: "none",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                whiteSpace: "nowrap",
              }}
            >
              {rail.short}
            </DistantHtml>
          </group>
        );
      })}
    </group>
  );
}
