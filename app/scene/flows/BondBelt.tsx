"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Cylinder } from "@react-three/drei";
import { DistantHtml } from "../shared/DistantHtml";
import { CREATORS } from "../shared/creators";
import {
  BOND_BELT_Y,
  BOND_BELT_RADIUS,
  BONDS_COLOR,
  STATE_PIPE_RADIUS,
} from "../shared/geometry";
import { computeRingPositions, quatFromNormal } from "../shared/helpers";
import { BOND_BELT_TUBE_SCALED, bondBranchRadius } from "../shared/dataScaling";

// Interest-on-debt: state pays ~€38B/yr to bondholders. Parallel pipe to the
// bond-issuance feed, offset in Y, different color (red-orange) so the two
// flows read as distinct (primary issuance vs. recurring coupon).
const INTEREST_COLOR = "#d97860";
const INTEREST_Y_OFFSET = -0.55;

/**
 * Sovereign bond belt: a translucent torus encircling the bank ring,
 * plus a feed pipe from the state obelisk + 12 thin branches to each bank.
 */
export function BondBelt() {
  const positions = useMemo(() => computeRingPositions(), []);

  // Feed pipe from obelisk front to belt back
  const feedGeometry = useMemo(() => {
    const start = new THREE.Vector3(0, BOND_BELT_Y, -9.3);
    const end = new THREE.Vector3(0, BOND_BELT_Y, -BOND_BELT_RADIUS + BOND_BELT_TUBE_SCALED * 0.7);
    const length = start.distanceTo(end);
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const q = quatFromNormal(dir);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    return { length, q, mid };
  }, []);

  return (
    <>
      {/* Torus belt */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, BOND_BELT_Y, 0]}>
        <torusGeometry args={[BOND_BELT_RADIUS, BOND_BELT_TUBE_SCALED, 16, 96]} />
        <meshStandardMaterial
          color={BONDS_COLOR}
          metalness={0.45}
          roughness={0.4}
          emissive={BONDS_COLOR}
          emissiveIntensity={0.5}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Feed pipe obelisk → belt (bond issuance) */}
      <Cylinder
        args={[
          STATE_PIPE_RADIUS + 0.02,
          STATE_PIPE_RADIUS + 0.02,
          feedGeometry.length,
          16,
        ]}
        position={feedGeometry.mid}
        quaternion={feedGeometry.q}
      >
        <meshStandardMaterial
          color={BONDS_COLOR}
          metalness={0.45}
          roughness={0.4}
          emissive={BONDS_COLOR}
          emissiveIntensity={0.55}
        />
      </Cylinder>

      {/* Interest-on-debt pipe: state → bond belt, thin parallel pipe below */}
      {(() => {
        const start = new THREE.Vector3(0, BOND_BELT_Y + INTEREST_Y_OFFSET, -9.3);
        const end = new THREE.Vector3(
          0,
          BOND_BELT_Y + INTEREST_Y_OFFSET,
          -BOND_BELT_RADIUS + BOND_BELT_TUBE_SCALED * 0.7
        );
        const length = start.distanceTo(end);
        const dir = new THREE.Vector3().subVectors(end, start).normalize();
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const q = quatFromNormal(dir);
        return (
          <Cylinder
            args={[0.07, 0.07, length, 14]}
            position={mid}
            quaternion={q}
          >
            <meshStandardMaterial
              color={INTEREST_COLOR}
              metalness={0.4}
              roughness={0.4}
              emissive={INTEREST_COLOR}
              emissiveIntensity={0.6}
              transparent
              opacity={0.9}
            />
          </Cylinder>
        );
      })()}

      {/* Interest label */}
      <DistantHtml
        position={[0, BOND_BELT_Y + INTEREST_Y_OFFSET - 0.3, -7]}
        threshold={12}
        showWhenActive="bond_belt"
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "#ffb8a0",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}
      >
        Intérêts 38 B€/an
      </DistantHtml>

      {/* Belt label */}
      <DistantHtml
        position={[0, BOND_BELT_Y + 0.6, -BOND_BELT_RADIUS]}
        threshold={12}
        showWhenActive="bond_belt"
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}
      >
        Obligations d&apos;État
      </DistantHtml>

      {/* 12 branches: belt → each bank */}
      {positions.map((pos, i) => {
        const bankAngle = Math.atan2(pos.z, pos.x);
        const beltPoint = new THREE.Vector3(
          Math.cos(bankAngle) * BOND_BELT_RADIUS,
          BOND_BELT_Y,
          Math.sin(bankAngle) * BOND_BELT_RADIUS
        );
        const length = beltPoint.distanceTo(pos);
        const mid = new THREE.Vector3()
          .addVectors(beltPoint, pos)
          .multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(pos, beltPoint).normalize();
        const q = quatFromNormal(dir);
        const r = bondBranchRadius(CREATORS[i].id);
        return (
          <Cylinder
            key={`bond-branch-${CREATORS[i].id}`}
            args={[r, r, length, 12]}
            position={mid}
            quaternion={q}
          >
            <meshStandardMaterial
              color={BONDS_COLOR}
              metalness={0.4}
              roughness={0.45}
              emissive={BONDS_COLOR}
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
