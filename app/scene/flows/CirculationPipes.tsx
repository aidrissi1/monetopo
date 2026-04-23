"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { DistantHtml } from "../shared/DistantHtml";
import {
  BOX_SIZE,
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
} from "../shared/geometry";
import { WAGES_RADIUS, CONSUMPTION_RADIUS } from "../shared/dataScaling";
import { FlowParticles } from "./FlowParticles";

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
  const { geometry, curve } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const start = from.clone().add(dir.clone().multiplyScalar(halfBox));
    const end = to.clone().sub(dir.clone().multiplyScalar(halfBox));

    const c1 = new THREE.Vector3().lerpVectors(start, end, 0.15);
    const c2 = new THREE.Vector3().lerpVectors(start, end, 0.85);
    c1.y += arcStrength;
    c2.y += arcStrength;

    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    const geometry = new THREE.TubeGeometry(curve, 64, radius, 12, false);
    return { geometry, curve };
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
      <FlowParticles curve={curve} color={color} count={7} speed={0.22} size={0.1} />
      <DistantHtml
        position={midPoint}
        threshold={8}
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
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </DistantHtml>
    </group>
  );
}

/** Salaires arcing over the top ring; Consommation arcing under the bottom ring. */
export function CirculationPipes() {
  return (
    <>
      {/* Wages — firms → households — €585 B/yr (INE) */}
      <CirculationPipe
        from={COMPANIES_BOX_POS}
        to={HOUSEHOLDS_BOX_POS}
        color="#5dd39e"
        arcStrength={8.5}
        radius={WAGES_RADIUS}
        label="Salaires"
        labelOffsetY={-1.2}
      />
      {/* Consumption — households → firms — €760 B/yr (INE) */}
      <CirculationPipe
        from={HOUSEHOLDS_BOX_POS}
        to={COMPANIES_BOX_POS}
        color="#ffbf5c"
        arcStrength={-8.5}
        radius={CONSUMPTION_RADIUS}
        label="Consommation"
        labelOffsetY={1.2}
      />
    </>
  );
}
