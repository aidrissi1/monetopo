"use client";

import { useMemo } from "react";
import * as THREE from "three";
import holdingsData from "@/app/data/holdings.json";
import type { HoldingsRegistry } from "../shared/holdings-types";
import { ALLOCATOR_POSITIONS, getAllocator } from "../actors/Allocators";
import { FIRM_POSITIONS } from "../actors/IbexFirms";
import { CATEGORY_COLOR } from "../shared/allocator-geometry";

const REGISTRY = holdingsData as HoldingsRegistry;

/**
 * Width (tube radius) encoding for ownership threads.
 *   verified with pct → thicker, width proportional to sqrt(pct)
 *   presence only (pct null) → thin uniform
 */
function widthForHolding(pctHeld: number | null): number {
  if (pctHeld === null) return 0.008;
  // sqrt scale so 5% is clearly thinner than 60% but not 12x thinner
  const normalized = Math.sqrt(Math.min(pctHeld, 100) / 100);
  return 0.01 + normalized * 0.06;
}

/**
 * Opacity — verified threads opaque, presence threads dim.
 */
function opacityForHolding(pctHeld: number | null): number {
  return pctHeld === null ? 0.25 : 0.7;
}

/**
 * One curved tube from allocator → target, mid-control raised so threads
 * arc over the scene rather than plowing straight through it.
 */
function ThreadTube({
  from,
  to,
  color,
  radius,
  opacity,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  radius: number;
  opacity: number;
}) {
  const curve = useMemo(() => {
    // Elevate the mid-point so the arc reads as "ownership flowing down"
    const mid = from.clone().lerp(to, 0.5);
    const liftY = Math.max(from.y, to.y) + from.distanceTo(to) * 0.18;
    mid.y = liftY;

    return new THREE.CatmullRomCurve3([from, mid, to], false, "catmullrom", 0.5);
  }, [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 28, radius, 6, false]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * OwnershipThreads — Tier-4 ownership arcs from every allocator that has
 * at least one holding record, bending down to its target (bank or IBEX firm).
 */
export function OwnershipThreads() {
  const threads = useMemo(() => {
    return REGISTRY.holdings
      .map((h) => {
        const from = ALLOCATOR_POSITIONS[h.allocator_id];
        const to = FIRM_POSITIONS[h.target_id];
        if (!from || !to) return null; // defensive — missing ref

        const allocator = getAllocator(h.allocator_id);
        const color =
          allocator && CATEGORY_COLOR[allocator.category]
            ? CATEGORY_COLOR[allocator.category]
            : "#c8c8c8";

        return {
          key: `${h.allocator_id}__${h.target_id}__${h.stake_type}`,
          from,
          to,
          color,
          radius: widthForHolding(h.pct_held),
          opacity: opacityForHolding(h.pct_held),
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
  }, []);

  return (
    <group>
      {threads.map(({ key, from, to, color, radius, opacity }) => (
        <ThreadTube
          key={key}
          from={from}
          to={to}
          color={color}
          radius={radius}
          opacity={opacity}
        />
      ))}
    </group>
  );
}
