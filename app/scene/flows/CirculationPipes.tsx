"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import {
  BOX_SIZE,
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
} from "../shared/geometry";

function CirculationPipe({
  from,
  to,
  color,
  arcStrength,
  radius,
  label,
  labelOffsetY,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  arcStrength: number;
  radius: number;
  label: string;
  labelOffsetY: number;
}) {
  const halfBox = BOX_SIZE[0] / 2;
  const geometry = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const start = from.clone().add(dir.clone().multiplyScalar(halfBox));
    const end = to.clone().sub(dir.clone().multiplyScalar(halfBox));

    const c1 = new THREE.Vector3().lerpVectors(start, end, 0.15);
    const c2 = new THREE.Vector3().lerpVectors(start, end, 0.85);
    c1.y += arcStrength;
    c2.y += arcStrength;

    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 64, radius, 12, false);
  }, [from, to, arcStrength, radius, halfBox]);

  const midPoint = useMemo(
    () =>
      new THREE.Vector3()
        .addVectors(from, to)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3(0, arcStrength + labelOffsetY, 0)),
    [from, to, arcStrength, labelOffsetY]
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.35}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={0.92}
        />
      </mesh>
      <Html
        position={midPoint.toArray()}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          opacity: 0.95,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Html>
    </group>
  );
}

/** Salaires arcing over the top ring; Consommation arcing under the bottom ring. */
export function CirculationPipes() {
  return (
    <>
      <CirculationPipe
        from={COMPANIES_BOX_POS}
        to={HOUSEHOLDS_BOX_POS}
        color="#5dd39e"
        arcStrength={8.5}
        radius={0.14}
        label="Salaires"
        labelOffsetY={-1.2}
      />
      <CirculationPipe
        from={HOUSEHOLDS_BOX_POS}
        to={COMPANIES_BOX_POS}
        color="#ffbf5c"
        arcStrength={-8.5}
        radius={0.14}
        label="Consommation"
        labelOffsetY={1.2}
      />
    </>
  );
}
