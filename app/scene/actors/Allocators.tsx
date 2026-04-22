"use client";

import { useMemo } from "react";
import * as THREE from "three";
import allocatorsData from "@/app/data/allocators.json";
import type {
  Allocator,
  AllocatorRegistry,
} from "../shared/allocator-types";
import {
  ALLOCATOR_DOME_CENTER,
  ALLOCATOR_DOME_RADIUS,
  ALLOCATOR_NODE_RADIUS,
  CATEGORY_COLOR,
  fibonacciHemisphere,
  opacityForCompleteness,
  sizeForCompleteness,
} from "../shared/allocator-geometry";
import { useHoverStore } from "../shared/hover-store";
import { useDetailStore } from "../shared/detail-store";
import holdingsData from "@/app/data/holdings.json";
import type { HoldingsRegistry } from "../shared/holdings-types";

const HOLDINGS = holdingsData as HoldingsRegistry;

/**
 * Lookup: allocator id → list of target ids they hold.
 * Used to surface "what does this allocator own in Spain?" on hover.
 */
const HOLDINGS_BY_ALLOCATOR: Record<string, { target: string; pct: number | null }[]> = (() => {
  const map: Record<string, { target: string; pct: number | null }[]> = {};
  for (const h of HOLDINGS.holdings) {
    if (!map[h.allocator_id]) map[h.allocator_id] = [];
    map[h.allocator_id].push({ target: h.target_id, pct: h.pct_held });
  }
  return map;
})();

const REGISTRY = allocatorsData as AllocatorRegistry;

/**
 * Pre-computed allocator node layout. Deterministic — given the same registry
 * order, positions are stable across renders. Exported so ownership threads
 * can look up where each allocator sits.
 */
export const ALLOCATOR_POSITIONS: Record<string, THREE.Vector3> = (() => {
  const points = fibonacciHemisphere(
    REGISTRY.allocators.length,
    ALLOCATOR_DOME_RADIUS,
  );
  const map: Record<string, THREE.Vector3> = {};
  REGISTRY.allocators.forEach((a, i) => {
    // Offset by dome center
    map[a.id] = points[i].clone().add(ALLOCATOR_DOME_CENTER);
  });
  return map;
})();

export function getAllocator(id: string): Allocator | undefined {
  return REGISTRY.allocators.find((a) => a.id === id);
}

/**
 * Allocators — Tier-4 outer dome around the scene.
 * 319 nodes, colored by category, opacity by data completeness.
 */
export function Allocators() {
  const setHovered = useHoverStore((s) => s.setHovered);
  const openDetail = useDetailStore((s) => s.open);

  const nodes = useMemo(() => {
    return REGISTRY.allocators.map((a) => ({
      allocator: a,
      position: ALLOCATOR_POSITIONS[a.id],
      color: CATEGORY_COLOR[a.category] ?? "#808080",
      opacity: opacityForCompleteness(a.completeness),
      sizeFactor: sizeForCompleteness(a.completeness),
    }));
  }, []);

  return (
    <group>
      {nodes.map(({ allocator, position, color, opacity, sizeFactor }) => {
        const holdings = HOLDINGS_BY_ALLOCATOR[allocator.id] ?? [];
        const completenessLabel =
          allocator.completeness === "verified"
            ? "Données vérifiées"
            : allocator.completeness === "partial"
              ? "Présence confirmée · % à sourcer"
              : "Présence structurelle · données à vérifier";
        const verifiedHoldings = holdings.filter((h) => h.pct !== null);
        const meta: string[] = [
          `Origine : ${allocator.origin} · ${completenessLabel}`,
        ];
        if (holdings.length > 0) {
          meta.push(
            `Positions ES : ${holdings.length}${verifiedHoldings.length > 0 ? ` (${verifiedHoldings.length} chiffrée${verifiedHoldings.length > 1 ? "s" : ""})` : ""}`,
          );
        }
        if (allocator.notes) {
          meta.push(allocator.notes);
        }

        return (
          <mesh
            key={allocator.id}
            position={position}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHovered({
                id: allocator.id,
                title: allocator.name,
                subtitle: `Allocateur · ${allocator.category.replace(/_/g, " ")}`,
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
              openDetail({ kind: "allocator", id: allocator.id });
            }}
          >
            <sphereGeometry args={[ALLOCATOR_NODE_RADIUS * sizeFactor, 12, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={allocator.completeness === "verified" ? 0.35 : 0.15}
              transparent
              opacity={opacity}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
