"use client";

import * as THREE from "three";
import { ReactNode } from "react";
import { useSpring, animated } from "@react-spring/three";
import { useSceneStore } from "../state";
import type { EntityId } from "../shared/types";

/**
 * A sphere that can split open like a clamshell along the equator.
 * Closed: solid opaque sphere, clean borders, interior hidden.
 * Open:   top + bottom hemispheres translate apart vertically, interior visible.
 *
 * The open/close state is driven by the scene store's `openedEntity` field.
 * Clicking "Ouvrir" in the ControlDesk triggers the animation.
 */
export function OpenableSphere({
  entityId,
  center,
  radius,
  color,
  emissive,
  emissiveIntensity = 0.3,
  metalness = 0.3,
  roughness = 0.45,
  children,
  openGap,
}: {
  entityId: EntityId;
  center: THREE.Vector3;
  radius: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  children?: ReactNode;
  /** How far the hemispheres travel apart (default: radius * 1.1). */
  openGap?: number;
}) {
  const isOpen = useSceneStore((s) => s.openedEntity === entityId);
  const gap = openGap ?? radius * 1.1;

  const { offset } = useSpring({
    offset: isOpen ? gap : 0,
    config: { tension: 120, friction: 22 },
  });

  return (
    <group position={center}>
      {/* Top hemisphere (north, theta 0 → π/2) */}
      <animated.mesh position-y={offset}>
        <sphereGeometry
          args={[radius, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          emissive={emissive ?? color}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </animated.mesh>

      {/* Bottom hemisphere (south, theta π/2 → π) */}
      <animated.mesh position-y={offset.to((o) => -o)}>
        <sphereGeometry
          args={[radius, 48, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]}
        />
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          emissive={emissive ?? color}
          emissiveIntensity={emissiveIntensity}
          side={THREE.DoubleSide}
        />
      </animated.mesh>

      {/* Interior — visible only when the shell is open */}
      <group visible={isOpen}>{children}</group>
    </group>
  );
}
