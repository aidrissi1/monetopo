"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Select } from "@react-three/postprocessing";
import { useSceneStore } from "../state";

/**
 * FlowParticles — additive-blended dots travelling along a three.js curve.
 *
 * Perf:
 *   - One InstancedMesh per call site: 1 draw call for all particles here
 *     (was N separate meshes + N draw calls).
 *   - useFrame work is skipped when the "flow_particles" layer is off.
 *   - Phases array re-syncs when the `count` prop changes.
 *
 * Visual:
 *   - Additive blending + `toneMapped={false}` → particles read as light
 *     sources that stack when they overlap each other or the pipes.
 *   - Wrapped in <Select enabled> so the Bloom pass picks them up selectively
 *     (requires a <Selection> up the tree — provided in Scene.tsx).
 *   - `depthWrite={false}` so they don't punch holes in the pipe tubes.
 */

const tempObj = new THREE.Object3D();

export function FlowParticles({
  curve,
  color,
  count = 5,
  speed = 0.28,
  size = 0.08,
}: {
  curve: THREE.Curve<THREE.Vector3>;
  color: string;
  count?: number;
  speed?: number;
  size?: number;
}) {
  const visible = useSceneStore((s) => s.visibleLayers.has("flow_particles"));
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Phases are even-spaced along the curve; re-seed when count changes.
  const phases = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = i / count;
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (!visible) return; // hidden → no work
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      phases[i] = (phases[i] + dt * speed) % 1;
      curve.getPoint(phases[i], tempObj.position);
      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <Select enabled>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[size, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </Select>
  );
}
