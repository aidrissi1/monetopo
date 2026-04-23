"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useSceneStore } from "../state";
import type { EntityId } from "./types";

/**
 * An Html label that's hidden by default and only fades in when:
 *   (a) the camera is within `threshold` units of the label's world position, OR
 *   (b) `showWhenActive` matches the store's `activeEntity` (clicked/hovered).
 *
 * Used to de-clutter the scene — labels appear only when you zoom close
 * or click the entity. Smooth 0.2s opacity transition via CSS.
 */
export function DistantHtml({
  position,
  threshold = 8,
  showWhenActive,
  children,
  innerStyle,
  ...htmlProps
}: {
  position: THREE.Vector3 | [number, number, number];
  threshold?: number;
  /** When this entity is active in the store, the label stays visible. */
  showWhenActive?: EntityId;
  children: React.ReactNode;
  /** Style applied to the inner opacity-wrapping div. */
  innerStyle?: React.CSSProperties;
} & Omit<React.ComponentProps<typeof Html>, "position" | "children">) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Invisible scene-graph anchor — gives us the true world position each frame
  // regardless of how deeply nested the DistantHtml is inside parent groups.
  const anchorRef = useRef<THREE.Object3D>(null);
  const worldVec = useRef(new THREE.Vector3());
  const posArr = useRef<[number, number, number]>(
    Array.isArray(position)
      ? [position[0], position[1], position[2]]
      : [position.x, position.y, position.z],
  );
  // Seed from current store state; updated by the subscription below.
  const activeRef = useRef<EntityId | null>(
    useSceneStore.getState().activeEntity,
  );

  // One subscription per mount, cleaned up on unmount — read in useFrame without re-renders.
  useEffect(() => {
    const unsub = useSceneStore.subscribe((s) => {
      activeRef.current = s.activeEntity;
    });
    return unsub;
  }, []);

  useFrame(({ camera }) => {
    const el = wrapperRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    anchor.getWorldPosition(worldVec.current);
    const dist = camera.position.distanceTo(worldVec.current);
    const isActive =
      showWhenActive !== undefined && activeRef.current === showWhenActive;
    const shouldShow = isActive || dist < threshold;
    const target = shouldShow ? "1" : "0";
    if (el.style.opacity !== target) el.style.opacity = target;
    el.style.pointerEvents = shouldShow ? "auto" : "none";
  });

  return (
    <>
      <object3D ref={anchorRef} position={posArr.current} />
      <Html position={posArr.current} {...htmlProps}>
        <div
          ref={wrapperRef}
          style={{
            transition: "opacity 0.25s ease-out",
            opacity: 0,
            ...innerStyle,
          }}
        >
          {children}
        </div>
      </Html>
    </>
  );
}
