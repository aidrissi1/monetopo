"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import { useSceneStore } from "../state";
import {
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
  STATE_POSITION,
  ECB_CENTER,
} from "../shared/geometry";
import { computeRingPositions } from "../shared/helpers";
import { CREATORS } from "../shared/creators";
import type { TransferEvent } from "../state";

/**
 * Animates deposit-transfer events from the store — ownership changes of
 * existing money between actors. Used by the life-of-euro narrative (M2)
 * to visualize: consumption (h'holds → firms), wages (firms → h'holds),
 * taxes (→ state), state transfers, etc.
 *
 * Colors encode the economic meaning of the transfer rather than just a
 * direction — so the user learns "green = consumption, blue = wages" as
 * the narrative plays out.
 */

const TAG_COLOR: Record<NonNullable<TransferEvent["tag"]>, string> = {
  consumption: "#ffbf5c", // warm orange — h'holds spending at firms
  wages:       "#5dd39e", // green — firms paying workers
  tax:         "#c98a4a", // bronze — anything flowing to the state
  transfer:    "#7ac7ff", // blue — state transfers back to h'holds
  other:       "#b8b8b8",
};
const DEFAULT_COLOR = "#e0e0e0";

const FLIGHT_MS = 2000;
const ARC_HEIGHT = 2.8;

const ACTOR_POS: Record<string, THREE.Vector3> = {
  menages: HOUSEHOLDS_BOX_POS.clone(),
  entreprises: COMPANIES_BOX_POS.clone(),
  state: STATE_POSITION.clone(),
  ecb: ECB_CENTER.clone(),
};

function actorPosition(id: string): THREE.Vector3 | null {
  if (ACTOR_POS[id]) return ACTOR_POS[id];
  // Fall back to the bank ring for bank ids
  const ringPositions = computeRingPositions();
  const idx = CREATORS.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  return ringPositions[idx] ?? null;
}

function TransferFlight({ event }: { event: TransferEvent }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const from = actorPosition(event.fromId);
    const to = actorPosition(event.toId);
    if (!from || !to) return null;
    const mid = from.clone().lerp(to, 0.5);
    mid.y += ARC_HEIGHT;
    return new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
  }, [event.fromId, event.toId]);

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
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (t < 0.1) mat.opacity = t / 0.1;
    else if (t > 0.85) mat.opacity = (1 - t) / 0.15;
    else mat.opacity = 1;
    mesh.visible = true;
  });

  if (!curve) return null;

  const color = event.tag ? TAG_COLOR[event.tag] : DEFAULT_COLOR;

  return (
    <Select enabled>
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial
          color={color}
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

export function TransferParticles() {
  const transferEvents = useSceneStore((s) => s.transferEvents);
  const now = performance.now();
  const active = transferEvents.filter(
    (e) => now - e.startedAt < FLIGHT_MS + 200,
  );

  return (
    <group>
      {active.map((e) => (
        <TransferFlight key={e.id} event={e} />
      ))}
    </group>
  );
}
