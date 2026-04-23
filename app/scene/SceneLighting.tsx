"use client";

import { useSceneStore, selectActiveTracerAmount } from "./state";

/**
 * Scene-wide lighting, controllable from the ControlDesk, with a live pulse
 * while tracer events are running. €100 B of active tracer ≈ +20 % ambient
 * boost; €500 B ≈ +50 %. The boost saturates so huge prints don't blow out.
 */
const BOOST_REFERENCE_BN = 500; // amount that saturates the boost curve
const MAX_BOOST = 0.5;

function tracerBoost(activeAmount: number): number {
  if (activeAmount <= 0) return 0;
  const t = Math.min(activeAmount / BOOST_REFERENCE_BN, 1);
  return MAX_BOOST * t;
}

export function SceneLighting() {
  const { ambient, key, fill } = useSceneStore((s) => s.lighting);
  const activeAmount = useSceneStore(selectActiveTracerAmount);
  const boost = 1 + tracerBoost(activeAmount);
  return (
    <>
      <ambientLight intensity={ambient * boost} />
      <directionalLight position={[7, 7, 7]} intensity={key * boost} />
      <directionalLight
        position={[-7, -4, -7]}
        intensity={fill * boost}
        color="#4f7cff"
      />
    </>
  );
}
