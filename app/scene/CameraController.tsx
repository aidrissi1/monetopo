"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "./state";
import { getEntity } from "./entities";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
} from "./shared/geometry";

type OrbitControlsRefLike = {
  target: THREE.Vector3;
  update: () => void;
};

/**
 * Smoothly animates camera position + OrbitControls target toward the
 * currently-active entity. When no entity is active, returns to defaults.
 */
export function CameraController({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsRefLike | null>;
}) {
  const { camera } = useThree();
  const activeEntity = useSceneStore((s) => s.activeEntity);

  const targetCameraPos = useRef(
    new THREE.Vector3(...DEFAULT_CAMERA_POSITION)
  );
  const targetLookAt = useRef(
    new THREE.Vector3(...DEFAULT_CAMERA_TARGET)
  );
  const isAnimating = useRef(false);

  // Recompute targets when active entity changes
  useEffect(() => {
    if (!activeEntity) {
      targetCameraPos.current.set(...DEFAULT_CAMERA_POSITION);
      targetLookAt.current.set(...DEFAULT_CAMERA_TARGET);
    } else {
      const entity = getEntity(activeEntity);
      if (entity) {
        targetCameraPos.current
          .copy(entity.position)
          .add(entity.cameraOffset);
        targetLookAt.current.copy(entity.position);
      }
    }
    isAnimating.current = true;
  }, [activeEntity]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (!isAnimating.current) return;

    const LERP = 0.08;
    camera.position.lerp(targetCameraPos.current, LERP);
    controls.target.lerp(targetLookAt.current, LERP);
    controls.update();

    // Stop lerping once we're close enough to target
    const posDist = camera.position.distanceTo(targetCameraPos.current);
    const lookDist = controls.target.distanceTo(targetLookAt.current);
    if (posDist < 0.05 && lookDist < 0.05) {
      isAnimating.current = false;
    }
  });

  return null;
}
