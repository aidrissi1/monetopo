"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MacroScene } from "../scene/MacroScene";
import { CameraController } from "../scene/CameraController";
import { ControlDesk } from "../scene/ControlDesk";
import { DataPanel } from "../scene/DataPanel";
import { HoverTooltip } from "../scene/HoverTooltip";
import { TracerSummary } from "../scene/TracerSummary";
import { DetailPanel } from "../scene/DetailPanel";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
} from "../scene/shared/geometry";

export default function Scene() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: DEFAULT_CAMERA_POSITION, fov: 52 }}
        className="w-full h-full"
        style={{ background: "#06070a" }}
      >
        <MacroScene />
        <CameraController controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={3}
          maxDistance={45}
          dampingFactor={0.08}
          enableDamping
          target={DEFAULT_CAMERA_TARGET}
        />
      </Canvas>
      <ControlDesk />
      <DataPanel />
      <HoverTooltip />
      <TracerSummary />
      <DetailPanel />
    </div>
  );
}
