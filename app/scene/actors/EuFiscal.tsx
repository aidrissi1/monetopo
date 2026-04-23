"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { DistantHtml } from "../shared/DistantHtml";
import euData from "@/app/data/eu-fiscal.json";
import {
  TESORO_POSITION,
  SEG_SOC_POSITION,
} from "../shared/geometry";
import { FIRM_POSITIONS } from "./IbexFirms";
import { computeRingPositions } from "../shared/helpers";
import { CREATORS } from "../shared/creators";
import { useHoverStore } from "../shared/hover-store";

interface EuEntity {
  id: string;
  name: string;
  short: string;
  role: string;
  targets_flow_to: string[];
  annual_eu_flow_bn_eur: number;
}

interface EuFiscalData {
  _meta: unknown;
  entities: EuEntity[];
}

const REGISTRY = euData as EuFiscalData;
const EU_COLOR = "#3a66c9"; // EU blue
const EU_ACCENT = "#ffd800"; // EU gold

/**
 * Position EU fiscal entities on a small row above and behind the state
 * cluster — conceptually "above Spain" fiscally.
 */
const EU_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const base = new THREE.Vector3(
    TESORO_POSITION.x,
    TESORO_POSITION.y + 7,
    TESORO_POSITION.z - 3,
  );
  const spacing = 3.2;
  const map: Record<string, THREE.Vector3> = {};
  REGISTRY.entities.forEach((e, i) => {
    const offset = (i - (REGISTRY.entities.length - 1) / 2) * spacing;
    map[e.id] = new THREE.Vector3(base.x + offset, base.y, base.z);
  });
  return map;
})();

/**
 * Resolve a target id to a scene position. Supports firms, banks,
 * and sub-state entities.
 */
function resolveTargetPosition(
  targetId: string,
  ringPositions: THREE.Vector3[],
  bankIdx: Record<string, number>,
): THREE.Vector3 | null {
  // Firms (including banks registered as firms)
  if (FIRM_POSITIONS[targetId]) return FIRM_POSITIONS[targetId];
  // Banks
  const idx = bankIdx[targetId];
  if (idx !== undefined) return ringPositions[idx];
  // Aliases for macro buckets
  if (targetId === "firms") return new THREE.Vector3(11, 0, 0);
  if (targetId === "menages") return new THREE.Vector3(-11, 0, 0);
  if (targetId === "tesoro") return TESORO_POSITION;
  if (targetId === "seg-soc") return SEG_SOC_POSITION;
  return null;
}

function FlowLine({
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
    mid.y += 1.2;
    return new THREE.CatmullRomCurve3([from, mid, to], false, "catmullrom", 0.5);
  }, [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 18, 0.018, 5, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} />
    </mesh>
  );
}

/**
 * EuFiscal — EU-level fiscal instruments as small elevated cubes above the
 * state cluster, with flow lines down to their Spanish targets.
 */
export function EuFiscal() {
  const setHovered = useHoverStore((s) => s.setHovered);
  const ringPositions = useMemo(() => computeRingPositions(), []);
  const bankIdx = useMemo(() => {
    const m: Record<string, number> = {};
    CREATORS.forEach((c, i) => { m[c.id] = i; });
    return m;
  }, []);

  return (
    <group>
      {/* Flow lines down to each target */}
      {REGISTRY.entities.flatMap((e) => {
        const from = EU_POSITIONS[e.id];
        return e.targets_flow_to
          .map((t, i) => {
            const to = resolveTargetPosition(t, ringPositions, bankIdx);
            if (!to) return null;
            return (
              <FlowLine
                key={`${e.id}__${t}__${i}`}
                from={from}
                to={to}
                color={EU_COLOR}
              />
            );
          })
          .filter((n): n is NonNullable<typeof n> => n !== null);
      })}

      {/* EU entity nodes — gold-ringed blue cubes */}
      {REGISTRY.entities.map((entity) => {
        const position = EU_POSITIONS[entity.id];
        return (
          <group
            key={entity.id}
            position={position}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered({
                id: entity.id,
                title: entity.name,
                subtitle: "Fiscal UE · Tier 5 européen",
                meta: [
                  entity.role,
                  entity.annual_eu_flow_bn_eur > 0
                    ? `Flux annuel vers ES ≈ €${entity.annual_eu_flow_bn_eur}B`
                    : "Instrument activable · pas de flux annuel régulier",
                ],
                color: EU_COLOR,
              });
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
              setHovered(null);
            }}
          >
            {/* Blue cube body */}
            <mesh>
              <boxGeometry args={[1.1, 1.1, 1.1]} />
              <meshStandardMaterial
                color={EU_COLOR}
                emissive={EU_COLOR}
                emissiveIntensity={0.3}
                roughness={0.5}
                metalness={0.2}
              />
            </mesh>
            {/* Gold accent ring — EU-flag circle signal */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.85, 0.04, 10, 28]} />
              <meshStandardMaterial
                color={EU_ACCENT}
                emissive={EU_ACCENT}
                emissiveIntensity={0.5}
                roughness={0.25}
                metalness={0.5}
              />
            </mesh>
            <DistantHtml
              position={[0, -0.95, 0]}
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
              {entity.short}
            </DistantHtml>
          </group>
        );
      })}
    </group>
  );
}
