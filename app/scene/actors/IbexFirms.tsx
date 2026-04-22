"use client";

import { useMemo } from "react";
import * as THREE from "three";
import firmsData from "@/app/data/ibex-firms.json";
import { CREATORS } from "../shared/creators";
import {
  FIRM_CLUSTER_CENTER,
  FIRM_CLUSTER_RADIUS,
  FIRM_NODE_RADIUS,
  FIRM_SECTOR_COLOR,
  fibonacciCluster,
} from "../shared/allocator-geometry";
import { computeRingPositions } from "../shared/helpers";
import { useHoverStore } from "../shared/hover-store";
import { useDetailStore } from "../shared/detail-store";
import holdingsData from "@/app/data/holdings.json";
import type { HoldingsRegistry } from "../shared/holdings-types";

const HOLDINGS = holdingsData as HoldingsRegistry;

/**
 * Lookup: firm id → list of allocators holding stakes. Used to reveal
 * "who owns this firm?" on hover.
 */
const HOLDERS_BY_TARGET: Record<string, { allocator: string; pct: number | null }[]> = (() => {
  const map: Record<string, { allocator: string; pct: number | null }[]> = {};
  for (const h of HOLDINGS.holdings) {
    if (!map[h.target_id]) map[h.target_id] = [];
    map[h.target_id].push({ allocator: h.allocator_id, pct: h.pct_held });
  }
  return map;
})();

interface IbexFirm {
  id: string;
  name: string;
  sector: string;
}

interface IbexFirmsData {
  _meta: unknown;
  firms: IbexFirm[];
}

const FIRM_REGISTRY = firmsData as IbexFirmsData;

/**
 * IBEX firm positions. Banks fall back to the existing ring positions (so
 * ownership threads into Santander/BBVA/etc. land on the same spheres the
 * scene already shows). Non-bank firms cluster around the Companies box.
 */
export const FIRM_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const map: Record<string, THREE.Vector3> = {};

  // Bank firms → use existing bank ring positions
  const ringPositions = computeRingPositions();
  const bankIds = new Set(CREATORS.map((c) => c.id));
  CREATORS.forEach((c, i) => {
    map[c.id] = ringPositions[i].clone();
  });

  // Non-bank firms → cluster around the Companies box
  const nonBankFirms = FIRM_REGISTRY.firms.filter(
    (f) => !bankIds.has(f.id) && f.sector !== "banking",
  );
  const clusterPoints = fibonacciCluster(
    nonBankFirms.length,
    FIRM_CLUSTER_CENTER,
    FIRM_CLUSTER_RADIUS,
  );
  nonBankFirms.forEach((f, i) => {
    map[f.id] = clusterPoints[i];
  });

  return map;
})();

export function getFirm(id: string): IbexFirm | undefined {
  return FIRM_REGISTRY.firms.find((f) => f.id === id);
}

/**
 * IbexFirms — small named-firm nodes around the Companies box.
 * Banks are NOT re-rendered here (they already exist as the 12-bank ring).
 */
export function IbexFirms() {
  const setHovered = useHoverStore((s) => s.setHovered);
  const openDetail = useDetailStore((s) => s.open);

  const nonBankFirms = useMemo(() => {
    const bankIds = new Set(CREATORS.map((c) => c.id));
    return FIRM_REGISTRY.firms.filter(
      (f) => !bankIds.has(f.id) && f.sector !== "banking",
    );
  }, []);

  return (
    <group>
      {nonBankFirms.map((firm) => {
        const position = FIRM_POSITIONS[firm.id];
        const color = FIRM_SECTOR_COLOR[firm.sector] ?? "#9aa0ab";
        const holders = HOLDERS_BY_TARGET[firm.id] ?? [];
        const verifiedHolders = holders.filter((h) => h.pct !== null);
        const meta: string[] = [];
        if (holders.length > 0) {
          meta.push(
            `Propriétaires référencés : ${holders.length}${verifiedHolders.length > 0 ? ` (${verifiedHolders.length} chiffré${verifiedHolders.length > 1 ? "s" : ""})` : ""}`,
          );
        } else {
          meta.push("Propriétaires à référencer — voir holdings.json");
        }

        return (
          <mesh
            key={firm.id}
            position={position}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered({
                id: firm.id,
                title: firm.name,
                subtitle: `IBEX · ${firm.sector.replace(/_/g, " ")}`,
                meta,
                color,
              });
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
              setHovered(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              openDetail({ kind: "firm", id: firm.id });
            }}
          >
            <sphereGeometry args={[FIRM_NODE_RADIUS, 12, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.22}
              transparent
              opacity={0.85}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
