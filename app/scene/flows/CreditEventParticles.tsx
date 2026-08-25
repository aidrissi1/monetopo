"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import { useSceneStore } from "../state";
import {
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
} from "../shared/geometry";
import { computeRingPositions } from "../shared/helpers";
import { CREATORS } from "../shared/creators";
import type { CreditEvent } from "../state";

/**
 * Scene representation of the M1 credit-creation atom.
 *
 * Each credit event fires a single particle that travels along a curved path:
 *   - kind=create   → bank → borrower box (loan extended, deposit created)
 *   - kind=destroy  → borrower box → bank (loan repaid, deposit cancelled)
 *
 * The particle is slightly larger + brighter than FlowParticles' pipe dots,
 * and colored by kind (gold = creation, red-orange = destruction). Retires
 * from the store when its flight completes so the event log stays bounded
 * visually while the balance-sheet delta accumulates in state.
 */

const CREATE_COLOR = "#ffd97a"; // warm gold
const DESTROY_COLOR = "#ff7a5a"; // warm red-orange
const FLIGHT_MS = 2200;
const ARC_HEIGHT = 3.2;

const BORROWER_POS: Record<string, THREE.Vector3> = {
  menages: HOUSEHOLDS_BOX_POS.clone(),
  entreprises: COMPANIES_BOX_POS.clone(),
};

/** Look up a bank's ring position by creator id. */
function bankPosition(id: string): THREE.Vector3 | null {
  const ringPositions = computeRingPositions();
  const idx = CREATORS.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  return ringPositions[idx] ?? null;
}

function CreditEventFlight({ event }: { event: CreditEvent }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Build the curve once per event from the event's bank → borrower pair.
  const curve = useMemo(() => {
    const bank = bankPosition(event.bankId);
    const borrower = BORROWER_POS[event.borrowerId];
    if (!bank || !borrower) return null;

    // For "create": fly bank → borrower. For "destroy": reverse.
    const start = event.kind === "create" ? bank : borrower;
    const end = event.kind === "create" ? borrower : bank;

    const mid = start.clone().lerp(end, 0.5);
    mid.y += ARC_HEIGHT;

    return new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone());
  }, [event.bankId, event.borrowerId, event.kind]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !curve) return;
    const elapsed = performance.now() - event.startedAt;
    const t = Math.min(elapsed / FLIGHT_MS, 1);
    if (t >= 1) {
      mesh.visible = false;
      return;
    }
    curve.getPoint(t, mesh.position);
    // fade in first 10%, hold, fade out last 15%
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (t < 0.1) mat.opacity = t / 0.1;
    else if (t > 0.85) mat.opacity = (1 - t) / 0.15;
    else mat.opacity = 1;
    mesh.visible = true;
  });

  if (!curve) return null;

  return (
    <Select enabled>
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial
          color={event.kind === "create" ? CREATE_COLOR : DESTROY_COLOR}
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </Select>
  );
}

export function CreditEventParticles() {
  const creditEvents = useSceneStore((s) => s.creditEvents);

  // Only render events whose flight is still in progress — the store keeps
  // the full log (for the balance-sheet running total) but we don't need
  // to render thousands of completed particles.
  const now = performance.now();
  const active = creditEvents.filter(
    (e) => now - e.startedAt < FLIGHT_MS + 200,
  );

  return (
    <group>
      {active.map((e) => (
        <CreditEventFlight key={e.id} event={e} />
      ))}
    </group>
  );
}
