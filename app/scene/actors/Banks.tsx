"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Cylinder, Html } from "@react-three/drei";
import { CREATORS } from "../shared/creators";
import type { MoneyCreator, EntityId } from "../shared/types";
import {
  SOCKET_RADIUS,
  SOCKET_DEPTH,
  PIPE_RADIUS,
} from "../shared/geometry";
import { computeRingPositions, quatFromNormal } from "../shared/helpers";
import { bankRadius, HUB_RADIUS_SCALED } from "../shared/dataScaling";
import { OpenableSphere } from "./OpenableSphere";
import { BankInterior } from "./BankInterior";

/**
 * Build a pipe connecting the hub surface to a satellite center,
 * plus the satellite sphere + label. Satellite radius is data-driven:
 * bigger banks (by total assets) render as bigger spheres.
 */
function BankLink({
  satellitePosition,
  creator,
  radius,
}: {
  satellitePosition: THREE.Vector3;
  creator: MoneyCreator;
  radius: number;
}) {
  const direction = satellitePosition.clone().normalize();
  const quaternion = useMemo(() => quatFromNormal(direction), [direction]);

  const socketOnHub = direction.clone().multiplyScalar(HUB_RADIUS_SCALED);
  const socketVisualCenter = socketOnHub
    .clone()
    .add(direction.clone().multiplyScalar(SOCKET_DEPTH / 2));

  const pipeStart = socketOnHub.clone();
  const pipeEnd = satellitePosition
    .clone()
    .sub(direction.clone().multiplyScalar(radius));
  const pipeLength = pipeStart.distanceTo(pipeEnd);
  const pipeCenter = new THREE.Vector3()
    .addVectors(pipeStart, pipeEnd)
    .multiplyScalar(0.5);

  return (
    <group>
      <Cylinder
        args={[SOCKET_RADIUS, SOCKET_RADIUS, SOCKET_DEPTH, 32]}
        position={socketVisualCenter}
        quaternion={quaternion}
      >
        <meshStandardMaterial
          color="#ffb84d"
          metalness={0.6}
          roughness={0.25}
          emissive="#5a2800"
          emissiveIntensity={0.6}
        />
      </Cylinder>

      <Cylinder
        args={[PIPE_RADIUS, PIPE_RADIUS, pipeLength, 24, 1, false]}
        position={pipeCenter}
        quaternion={quaternion}
      >
        <meshStandardMaterial
          color="#9ab3ff"
          metalness={0.4}
          roughness={0.35}
          emissive="#1a2a70"
          emissiveIntensity={0.3}
        />
      </Cylinder>

      <OpenableSphere
        entityId={creator.id as EntityId}
        center={satellitePosition}
        radius={radius}
        color={creator.color}
        emissive={creator.color}
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.4}
        openGap={radius * 1.3}
      >
        <BankInterior bankId={creator.id} />
      </OpenableSphere>

      {/* Label floats beyond the sphere surface along the outward direction */}
      <group position={satellitePosition}>
        <Html
          position={direction
            .clone()
            .multiplyScalar(radius + 0.25)
            .toArray()}
          center
          distanceFactor={10}
          style={{
            pointerEvents: "none",
            color: "white",
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            whiteSpace: "nowrap",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            opacity: 0.92,
          }}
        >
          {creator.name}
        </Html>
      </group>
    </group>
  );
}

/**
 * All 12 commercial banks as a ring around the hub, data-driven sphere sizes.
 */
export function Banks() {
  const positions = useMemo(() => computeRingPositions(), []);
  return (
    <>
      {positions.map((pos, i) => (
        <BankLink
          key={CREATORS[i].id}
          satellitePosition={pos}
          creator={CREATORS[i]}
          radius={bankRadius(CREATORS[i].id)}
        />
      ))}
    </>
  );
}
