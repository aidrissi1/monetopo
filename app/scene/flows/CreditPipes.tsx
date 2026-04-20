"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { CREATORS } from "../shared/creators";
import {
  CURVE_PIPE_RADIUS,
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
  BOX_SIZE,
} from "../shared/geometry";
import {
  computeRingPositions,
  entryPointForBank,
  faceNormalForEntry,
} from "../shared/helpers";
import { bankRadius } from "../shared/dataScaling";

function CurvedPipe({
  from,
  to,
  faceNorm,
  color,
  arcStrength,
  fromRadius,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  faceNorm: THREE.Vector3;
  color: string;
  arcStrength: number;
  fromRadius: number;
}) {
  const geometry = useMemo(() => {
    const bankOutward = from.clone().normalize();
    const start = from
      .clone()
      .add(bankOutward.clone().multiplyScalar(fromRadius));
    const end = to.clone();

    const c1 = from
      .clone()
      .add(bankOutward.clone().multiplyScalar(fromRadius + arcStrength));
    const c2 = end.clone().add(faceNorm.clone().multiplyScalar(arcStrength));

    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 64, CURVE_PIPE_RADIUS, 10, false);
  }, [from, to, faceNorm, arcStrength, fromRadius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        metalness={0.35}
        roughness={0.4}
        emissive={color}
        emissiveIntensity={0.45}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/**
 * 24 credit pipes: each of the 12 banks connects to both destination boxes,
 * entering via a distributed slot on one of the box's 6 faces.
 */
export function CreditPipes() {
  const positions = useMemo(() => computeRingPositions(), []);
  return (
    <>
      {positions.map((pos, i) => {
        const hhEntry = entryPointForBank(i, HOUSEHOLDS_BOX_POS);
        const coEntry = entryPointForBank(i, COMPANIES_BOX_POS);
        const hhNormal = faceNormalForEntry(hhEntry, HOUSEHOLDS_BOX_POS);
        const coNormal = faceNormalForEntry(coEntry, COMPANIES_BOX_POS);
        const r = bankRadius(CREATORS[i].id);
        return (
          <group key={`pipes-${CREATORS[i].id}`}>
            <CurvedPipe
              from={pos}
              to={hhEntry}
              faceNorm={hhNormal}
              color={CREATORS[i].color}
              arcStrength={3.2}
              fromRadius={r}
            />
            <CurvedPipe
              from={pos}
              to={coEntry}
              faceNorm={coNormal}
              color={CREATORS[i].color}
              arcStrength={3.2}
              fromRadius={r}
            />
          </group>
        );
      })}
    </>
  );
}

// Re-export box size so consumers can compute layout without cross-imports.
export { BOX_SIZE };
