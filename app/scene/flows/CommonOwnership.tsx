"use client";

import { useMemo } from "react";
import * as THREE from "three";
import holdingsData from "@/app/data/holdings.json";
import type { HoldingsRegistry } from "../shared/holdings-types";
import { FIRM_POSITIONS } from "../actors/IbexFirms";

const HOLDINGS = holdingsData as HoldingsRegistry;

/**
 * Elhauge common-ownership visualization.
 *
 * When a single allocator holds ≥ x% in multiple firms, those firms share
 * owners — classic horizontal cross-holding. Draw a subtle arc between
 * every pair of firms that share at least one allocator.
 *
 * Strength aggregates across all shared allocators:
 *   strength(A, B) = Σ over shared allocators of  min(pct_A, pct_B, default_stub)
 *
 * For stub-to-stub links (both pct null), we add a small nominal weight so
 * presence is visible even without specific %.
 */

const NULL_STUB_WEIGHT = 0.8; // presence only
const LINE_BASE_RADIUS = 0.012;
const LINE_MAX_RADIUS = 0.08;

interface PairLink {
  keyPair: string;
  firmA: string;
  firmB: string;
  strength: number;
  sharedCount: number;
}

function computeCommonOwnership(): PairLink[] {
  // Bucket holdings by allocator → list of {target, pct}
  const byAllocator: Record<string, { target: string; pct: number | null }[]> = {};
  for (const h of HOLDINGS.holdings) {
    if (!byAllocator[h.allocator_id]) byAllocator[h.allocator_id] = [];
    byAllocator[h.allocator_id].push({ target: h.target_id, pct: h.pct_held });
  }

  // For each allocator with 2+ holdings, emit pairs
  const pairStrength: Record<string, { firmA: string; firmB: string; strength: number; count: number }> = {};

  for (const targets of Object.values(byAllocator)) {
    if (targets.length < 2) continue;
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const a = targets[i].target;
        const b = targets[j].target;
        // Canonical pair key (sorted)
        const [firmA, firmB] = a < b ? [a, b] : [b, a];
        const key = `${firmA}__${firmB}`;

        const pctA = targets[i].pct;
        const pctB = targets[j].pct;
        let weight: number;
        if (pctA !== null && pctB !== null) {
          weight = Math.min(pctA, pctB);
        } else if (pctA !== null) {
          weight = Math.max(pctA * 0.4, NULL_STUB_WEIGHT);
        } else if (pctB !== null) {
          weight = Math.max(pctB * 0.4, NULL_STUB_WEIGHT);
        } else {
          weight = NULL_STUB_WEIGHT;
        }

        if (!pairStrength[key]) {
          pairStrength[key] = { firmA, firmB, strength: 0, count: 0 };
        }
        pairStrength[key].strength += weight;
        pairStrength[key].count += 1;
      }
    }
  }

  return Object.entries(pairStrength).map(([key, v]) => ({
    keyPair: key,
    firmA: v.firmA,
    firmB: v.firmB,
    strength: v.strength,
    sharedCount: v.count,
  }));
}

function radiusFromStrength(strength: number): number {
  const normalized = Math.min(strength / 20, 1); // 20% cumulative = max width
  return LINE_BASE_RADIUS + normalized * (LINE_MAX_RADIUS - LINE_BASE_RADIUS);
}

function LinkArc({
  from,
  to,
  radius,
  color,
  opacity,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  radius: number;
  color: string;
  opacity: number;
}) {
  const curve = useMemo(() => {
    // Arc above the ground plane — symmetric lift for aesthetic
    const mid = from.clone().lerp(to, 0.5);
    const dist = from.distanceTo(to);
    mid.y += 1.5 + dist * 0.08;
    return new THREE.CatmullRomCurve3([from, mid, to], false, "catmullrom", 0.5);
  }, [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 24, radius, 5, false]} />
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
 * CommonOwnership — horizontal cross-holding arcs between firms that share
 * allocators. One arc per firm-pair with aggregated strength.
 */
export function CommonOwnership() {
  const links = useMemo(() => {
    const pairs = computeCommonOwnership();
    return pairs
      .map((p) => {
        const from = FIRM_POSITIONS[p.firmA];
        const to = FIRM_POSITIONS[p.firmB];
        if (!from || !to) return null;
        return {
          ...p,
          from,
          to,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
  }, []);

  return (
    <group>
      {links.map((link) => (
        <LinkArc
          key={link.keyPair}
          from={link.from}
          to={link.to}
          radius={radiusFromStrength(link.strength)}
          // Elhauge color — warm gold, signals "ownership coordination"
          color="#ffb347"
          // Opacity scales faintly with shared-count (more shared allocators = more prominent)
          opacity={Math.min(0.25 + link.sharedCount * 0.05, 0.6)}
        />
      ))}
    </group>
  );
}
