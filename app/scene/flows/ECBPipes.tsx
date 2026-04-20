"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Cylinder, Sphere } from "@react-three/drei";
import { CREATORS } from "../shared/creators";
import {
  ECB_BASE_Y,
  ECB_RAY_ORIGIN,
  ECB_RAY_RADIUS,
  ECB_REG_PIPE_RADIUS,
} from "../shared/geometry";
import { computeRingPositions, quatFromNormal } from "../shared/helpers";
import { bankRadius, HUB_RADIUS_SCALED } from "../shared/dataScaling";

// Reserves manifold node — where reserves flow from ECB to before fanning
// out to each bank. Placed behind the scene to keep the pipes readable.
const RESERVES_MANIFOLD = new THREE.Vector3(0, 1.0, -5.5);
const RESERVES_MANIFOLD_RADIUS = 0.32;
const RESERVES_BRANCH_RADIUS = 0.05;

/**
 * Regulatory pipe (ECB → hub). Gold. Arcs forward (+Z) so it doesn't
 * intersect the reserves pipe that arcs backward.
 */
function ECBRegulationPipe() {
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(0, ECB_BASE_Y + 0.9, 0);
    const end = new THREE.Vector3(0, HUB_RADIUS_SCALED - 0.5, 0);
    const c1 = new THREE.Vector3(0, ECB_BASE_Y - 1.6, 3.2);
    const c2 = new THREE.Vector3(0, HUB_RADIUS_SCALED + 2.0, 3.2);
    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 64, ECB_REG_PIPE_RADIUS, 14, false);
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#ffe08a"
        metalness={0.75}
        roughness={0.22}
        emissive="#d4a020"
        emissiveIntensity={0.7}
      />
    </mesh>
  );
}

/**
 * Reserves channel (ECB → banking system).
 *
 * Reserves are NOT capital: they're bank deposits at the central bank,
 * functionally liquidity each bank holds at the ECB. So the pipe lands
 * on a *reserves manifold node* behind the scene, then fans out to every
 * bank — NOT on the capital hub.
 */
function ECBReservesPipe() {
  const positions = useMemo(() => computeRingPositions(), []);

  // Main trunk ECB pyramid → manifold node (arcs backward)
  const trunkGeometry = useMemo(() => {
    const start = new THREE.Vector3(0, ECB_BASE_Y + 0.9, 0);
    const end = RESERVES_MANIFOLD.clone();
    const c1 = new THREE.Vector3(0, ECB_BASE_Y - 1.6, -3.5);
    const c2 = new THREE.Vector3(0, 3.5, -5.5);
    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 64, ECB_REG_PIPE_RADIUS, 14, false);
  }, []);

  return (
    <>
      {/* Trunk */}
      <mesh geometry={trunkGeometry}>
        <meshStandardMaterial
          color="#7ac7ff"
          metalness={0.55}
          roughness={0.3}
          emissive="#2a7dff"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Manifold node (represents reserves pool) */}
      <Sphere args={[RESERVES_MANIFOLD_RADIUS, 32, 32]} position={RESERVES_MANIFOLD}>
        <meshStandardMaterial
          color="#7ac7ff"
          metalness={0.6}
          roughness={0.3}
          emissive="#2a7dff"
          emissiveIntensity={0.7}
        />
      </Sphere>

      {/* 12 branches: manifold → each bank */}
      {positions.map((pos, i) => {
        const r = bankRadius(CREATORS[i].id);
        const dir = new THREE.Vector3().subVectors(pos, RESERVES_MANIFOLD).normalize();
        const branchStart = RESERVES_MANIFOLD.clone().add(
          dir.clone().multiplyScalar(RESERVES_MANIFOLD_RADIUS)
        );
        const branchEnd = pos.clone().sub(dir.clone().multiplyScalar(r));
        const length = branchStart.distanceTo(branchEnd);
        const mid = new THREE.Vector3()
          .addVectors(branchStart, branchEnd)
          .multiplyScalar(0.5);
        const q = quatFromNormal(dir);
        return (
          <Cylinder
            key={`reserves-branch-${CREATORS[i].id}`}
            args={[RESERVES_BRANCH_RADIUS, RESERVES_BRANCH_RADIUS, length, 12]}
            position={mid}
            quaternion={q}
          >
            <meshStandardMaterial
              color="#7ac7ff"
              metalness={0.4}
              roughness={0.4}
              emissive="#2a7dff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.78}
            />
          </Cylinder>
        );
      })}
    </>
  );
}

/** 12 thin supervision rays from the pyramid base to each bank's top. */
function ECBSupervisionRays() {
  const positions = useMemo(() => computeRingPositions(), []);
  return (
    <>
      {positions.map((pos, i) => {
        const bankTop = pos
          .clone()
          .add(new THREE.Vector3(0, bankRadius(CREATORS[i].id), 0));
        const rayLength = ECB_RAY_ORIGIN.distanceTo(bankTop);
        const rayCenter = new THREE.Vector3()
          .addVectors(ECB_RAY_ORIGIN, bankTop)
          .multiplyScalar(0.5);
        const rayDir = new THREE.Vector3()
          .subVectors(bankTop, ECB_RAY_ORIGIN)
          .normalize();
        const rayQuat = quatFromNormal(rayDir);
        return (
          <Cylinder
            key={`ecb-ray-${CREATORS[i].id}`}
            args={[ECB_RAY_RADIUS, ECB_RAY_RADIUS, rayLength, 12]}
            position={rayCenter}
            quaternion={rayQuat}
          >
            <meshStandardMaterial
              color="#ffe08a"
              metalness={0.3}
              roughness={0.5}
              emissive="#ffd97a"
              emissiveIntensity={0.9}
              transparent
              opacity={0.6}
            />
          </Cylinder>
        );
      })}
    </>
  );
}

/** All ECB-originated flows: regulation pipe + reserves pipe + 12 supervision rays. */
export function ECBPipes() {
  return (
    <>
      <ECBRegulationPipe />
      <ECBReservesPipe />
      <ECBSupervisionRays />
    </>
  );
}
