"use client";

import * as THREE from "three";
import { HUB_RADIUS_SCALED } from "../shared/dataScaling";
import { OpenableSphere } from "./OpenableSphere";
import { HubInterior } from "./HubInterior";

/**
 * The central hub sphere — aggregate capital backing money creation.
 * Radius sized from the sum of all Spanish banks' CET1 (€223B in 2024).
 * Clamshell-openable: reveals per-bank CET1 sub-spheres when split.
 */
export function Hub() {
  return (
    <OpenableSphere
      entityId="hub"
      center={new THREE.Vector3(0, 0, 0)}
      radius={HUB_RADIUS_SCALED}
      color="#2d5fff"
      emissive="#0a1a55"
      emissiveIntensity={0.4}
      metalness={0.25}
      roughness={0.35}
    >
      <HubInterior />
    </OpenableSphere>
  );
}
