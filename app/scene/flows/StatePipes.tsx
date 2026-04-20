"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { TAX_COLOR, SPENDING_COLOR } from "../shared/geometry";
import {
  TAX_HOUSEHOLDS_RADIUS,
  TAX_COMPANIES_RADIUS,
  SPENDING_HOUSEHOLDS_RADIUS,
  SPENDING_COMPANIES_RADIUS,
} from "../shared/dataScaling";

function StateFlowPipe({
  start,
  end,
  c1,
  c2,
  color,
  radius,
  label,
  labelPosition,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  c1: THREE.Vector3;
  c2: THREE.Vector3;
  color: string;
  radius: number;
  label?: string;
  labelPosition?: THREE.Vector3;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 64, radius, 12, false);
  }, [start, end, c1, c2, radius]);

  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.45}
          transparent
          opacity={0.92}
        />
      </mesh>
      {label && labelPosition && (
        <Html
          position={labelPosition.toArray()}
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
            opacity: 0.92,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Html>
      )}
    </>
  );
}

/** Taxes (boxes → state) + Public spending (state → boxes). */
export function StatePipes() {
  return (
    <>
      {/* Taxes: ménages → state (thickness = €165B/y) */}
      <StateFlowPipe
        start={new THREE.Vector3(-11, 1.0, 0.8)}
        end={new THREE.Vector3(-0.9, 3.5, -9.1)}
        c1={new THREE.Vector3(-9, -2.5, -3)}
        c2={new THREE.Vector3(-3, -1.5, -8)}
        color={TAX_COLOR}
        radius={TAX_HOUSEHOLDS_RADIUS}
        label="Impôts"
        labelPosition={new THREE.Vector3(-6, -2.8, -4.5)}
      />
      {/* Taxes: entreprises → state (thickness = €132B/y) */}
      <StateFlowPipe
        start={new THREE.Vector3(11, 1.0, 0.8)}
        end={new THREE.Vector3(0.9, 3.5, -9.1)}
        c1={new THREE.Vector3(9, -2.5, -3)}
        c2={new THREE.Vector3(3, -1.5, -8)}
        color={TAX_COLOR}
        radius={TAX_COMPANIES_RADIUS}
      />
      {/* Public spending: state → ménages (thickness = €385B/y — biggest flow) */}
      <StateFlowPipe
        start={new THREE.Vector3(-0.9, 5.0, -9.1)}
        end={new THREE.Vector3(-11, 1.0, -0.8)}
        c1={new THREE.Vector3(-3, 9.5, -8)}
        c2={new THREE.Vector3(-9, 9.5, -3)}
        color={SPENDING_COLOR}
        radius={SPENDING_HOUSEHOLDS_RADIUS}
        label="Dépenses publiques"
        labelPosition={new THREE.Vector3(-6, 10.3, -5)}
      />
      {/* Public spending: state → entreprises (thickness = €155B/y) */}
      <StateFlowPipe
        start={new THREE.Vector3(0.9, 5.0, -9.1)}
        end={new THREE.Vector3(11, 1.0, -0.8)}
        c1={new THREE.Vector3(3, 9.5, -8)}
        c2={new THREE.Vector3(9, 9.5, -3)}
        color={SPENDING_COLOR}
        radius={SPENDING_COMPANIES_RADIUS}
      />
    </>
  );
}
