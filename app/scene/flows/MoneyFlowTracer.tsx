"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSceneStore } from "../state";
import qeData from "@/app/data/qe-transmission.json";
import type {
  QeTransmissionData,
  TracerChannel,
  TransmissionPreset,
} from "../shared/tracer-types";
import {
  ECB_CENTER,
  STATE_POSITION,
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
} from "../shared/geometry";
import { ALLOCATOR_DOME_CENTER } from "../shared/allocator-geometry";

const DATA = qeData as QeTransmissionData;

const TRACE_DURATION_MS = 4200;
const PARTICLES_PER_10BN = 4;

/**
 * Endpoint positions per channel. Each channel funnels particles toward
 * a representative target in the existing scene.
 */
const CHANNEL_TARGET: Record<TracerChannel, THREE.Vector3> = {
  bank_reserves:   new THREE.Vector3(0, 0, 0), // hub = aggregate capital (reserves sit here pedagogically)
  asset_prices:    ALLOCATOR_DOME_CENTER.clone(), // rise into the allocator dome
  fiscal_channel:  STATE_POSITION.clone(),
  real_credit:     new THREE.Vector3(
    (HOUSEHOLDS_BOX_POS.x + COMPANIES_BOX_POS.x) / 2,
    0,
    0,
  ),
};

interface Particle {
  channel: TracerChannel;
  /** Bezier control points for this particle's flight path. */
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  /** Phase offset so particles don't all fire in lockstep. */
  delay: number;
  /** Duration in ms this particle takes to travel. */
  travelMs: number;
}

/** Cubic-like quadratic Bezier eval. */
function bezier(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number): THREE.Vector3 {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z,
  );
}

/**
 * Build the particle set for a single print event.
 * Particle count per channel = floor(amount_bn / 10 × ratio × base).
 */
function buildParticles(preset: TransmissionPreset, amountBn: number): Particle[] {
  const baseCount = Math.round((amountBn / 10) * PARTICLES_PER_10BN);
  const particles: Particle[] = [];

  for (const channel of Object.keys(preset.ratios) as TracerChannel[]) {
    const ratio = preset.ratios[channel];
    const n = Math.max(1, Math.round(baseCount * ratio));
    const target = CHANNEL_TARGET[channel];

    for (let i = 0; i < n; i++) {
      // Spread start points slightly around ECB apex for visual density
      const p0 = ECB_CENTER.clone().add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
        ),
      );
      // Mid control point — lifted for an arc
      const mid = p0.clone().lerp(target, 0.5);
      mid.y += 2 + Math.random() * 2;
      mid.x += (Math.random() - 0.5) * 2;
      mid.z += (Math.random() - 0.5) * 2;

      particles.push({
        channel,
        p0,
        p1: mid,
        p2: target.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.6,
          ),
        ),
        delay: Math.random() * (TRACE_DURATION_MS * 0.5),
        travelMs: TRACE_DURATION_MS * (0.5 + Math.random() * 0.3),
      });
    }
  }
  return particles;
}

/**
 * A single print event — renders its particles and retires itself when done.
 */
function PrintEvent({
  eventId,
  startedAt,
  preset,
  amountBn,
}: {
  eventId: number;
  startedAt: number;
  preset: TransmissionPreset;
  amountBn: number;
}) {
  const retireTracer = useSceneStore((s) => s.retireTracer);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const particles = useMemo(
    () => buildParticles(preset, amountBn),
    [preset, amountBn],
  );

  useFrame(() => {
    const now = performance.now();
    const elapsed = now - startedAt;
    let allDone = true;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      const localT = (elapsed - p.delay) / p.travelMs;
      if (localT <= 0) {
        // not started yet
        mesh.visible = false;
        allDone = false;
        continue;
      }
      if (localT >= 1) {
        mesh.visible = false;
        continue;
      }

      const pos = bezier(p.p0, p.p1, p.p2, localT);
      mesh.position.copy(pos);
      mesh.visible = true;
      allDone = false;

      // Fade in/out — visible for first 85% then fade
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (localT < 0.05) mat.opacity = localT / 0.05;
      else if (localT > 0.85) mat.opacity = (1 - localT) / 0.15;
      else mat.opacity = 1;
    }

    if (allDone && elapsed > TRACE_DURATION_MS + 800) {
      retireTracer(eventId);
    }
  });

  return (
    <group>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.065, 6, 6]} />
          <meshBasicMaterial
            color={DATA.channels[p.channel].color}
            transparent
            opacity={0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * MoneyFlowTracer — renders all active print events.
 * Spawning is triggered by ControlDesk via `fireTracer()` in the store.
 */
export function MoneyFlowTracer() {
  const events = useSceneStore((s) => s.tracerEvents);
  const presetMap = useMemo(() => {
    const m: Record<string, TransmissionPreset> = {};
    for (const p of DATA.presets) m[p.id] = p;
    return m;
  }, []);

  return (
    <group>
      {events.map((e) => {
        const preset = presetMap[e.presetId];
        if (!preset) return null;
        return (
          <PrintEvent
            key={e.id}
            eventId={e.id}
            startedAt={e.startedAt}
            preset={preset}
            amountBn={e.amountBn}
          />
        );
      })}
    </group>
  );
}
