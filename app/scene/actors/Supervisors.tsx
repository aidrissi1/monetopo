"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { DistantHtml } from "../shared/DistantHtml";
import supervisorsData from "@/app/data/supervisors.json";
import { computeRingPositions } from "../shared/helpers";
import { CREATORS } from "../shared/creators";
import { useHoverStore } from "../shared/hover-store";

interface Supervisor {
  id: string;
  name: string;
  short: string;
  role: string;
  scope: string[];
  origin: string;
}

interface SupervisorsData {
  _meta: unknown;
  supervisors: Supervisor[];
}

const REGISTRY = supervisorsData as SupervisorsData;

const SUPERVISOR_RING_RADIUS = 9.6;
const SUPERVISOR_Y = 5.5;
const SUPERVISOR_COLOR = "#6ec3d8"; // cyan-slate — regulatory palette

/**
 * Place supervisors on a ring above the bank cluster.
 * 5 supervisors at fixed angles, slightly tilted outward from the scene.
 */
function computeSupervisorPositions(count: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    positions.push(
      new THREE.Vector3(
        Math.cos(angle) * SUPERVISOR_RING_RADIUS,
        SUPERVISOR_Y,
        Math.sin(angle) * SUPERVISOR_RING_RADIUS,
      ),
    );
  }
  return positions;
}

const SUPERVISOR_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const pts = computeSupervisorPositions(REGISTRY.supervisors.length);
  const map: Record<string, THREE.Vector3> = {};
  REGISTRY.supervisors.forEach((s, i) => {
    map[s.id] = pts[i];
  });
  return map;
})();

/**
 * Thin supervision line from supervisor torus to each bank in scope.
 */
function SupervisionLine({
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
    // slight arc upward so lines curve over, not through the scene
    mid.y += 1;
    return new THREE.CatmullRomCurve3([from, mid, to], false, "catmullrom", 0.5);
  }, [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 16, 0.008, 4, false]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.35}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * Supervisors — Tier-2 regulatory layer.
 * 5 translucent toroidal nodes on an outer ring above the bank cluster,
 * each with thin lines reaching down to the banks it supervises.
 */
export function Supervisors() {
  const setHovered = useHoverStore((s) => s.setHovered);
  const ringPositions = useMemo(() => computeRingPositions(), []);
  const bankIdToIdx: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    CREATORS.forEach((c, i) => { m[c.id] = i; });
    return m;
  }, []);

  return (
    <group>
      {/* Supervision lines under torus nodes */}
      {REGISTRY.supervisors.flatMap((sup) => {
        const from = SUPERVISOR_POSITIONS[sup.id];
        return sup.scope
          .map((targetId) => {
            const idx = bankIdToIdx[targetId];
            if (idx === undefined) return null;
            const to = ringPositions[idx];
            return (
              <SupervisionLine
                key={`${sup.id}__${targetId}`}
                from={from}
                to={to}
                color={SUPERVISOR_COLOR}
              />
            );
          })
          .filter((n): n is NonNullable<typeof n> => n !== null);
      })}

      {/* Torus nodes */}
      {REGISTRY.supervisors.map((sup) => {
        const position = SUPERVISOR_POSITIONS[sup.id];
        return (
          <group
            key={sup.id}
            position={position}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered({
                id: sup.id,
                title: sup.name,
                subtitle: `Tier 2 · Superviseur · ${sup.origin}`,
                meta: [
                  sup.role,
                  sup.scope.length > 0
                    ? `Supervise ${sup.scope.length} entité${sup.scope.length > 1 ? "s" : ""}`
                    : "Secteur : assurance / pensions (hors banques)",
                ],
                color: SUPERVISOR_COLOR,
              });
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
              setHovered(null);
            }}
          >
            {/* Horizontal torus — supervisor ring, facing up */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.55, 0.12, 12, 28]} />
              <meshStandardMaterial
                color={SUPERVISOR_COLOR}
                emissive={SUPERVISOR_COLOR}
                emissiveIntensity={0.35}
                transparent
                opacity={0.82}
                roughness={0.4}
                metalness={0.2}
              />
            </mesh>
            {/* Label below the torus */}
            <DistantHtml
              position={[0, -0.75, 0]}
              threshold={8}
              center
              distanceFactor={14}
              style={{
                pointerEvents: "none",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                whiteSpace: "nowrap",
              }}
            >
              {sup.short}
            </DistantHtml>
          </group>
        );
      })}
    </group>
  );
}
