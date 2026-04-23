"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Selection } from "@react-three/postprocessing";
import { MacroScene } from "../scene/MacroScene";
import { CameraController } from "../scene/CameraController";
import { SceneEffects } from "../scene/SceneEffects";
import { ControlDesk } from "../scene/ControlDesk";
import { DataPanel } from "../scene/DataPanel";
import { HoverTooltip } from "../scene/HoverTooltip";
import { TracerSummary } from "../scene/TracerSummary";
import { DetailPanel } from "../scene/DetailPanel";
import { FlowKPIBoard } from "../scene/FlowKPIBoard";
import { TourOverlay } from "../scene/tour/TourOverlay";
import { useTour } from "../scene/tour/useTour";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
} from "../scene/shared/geometry";

export default function Scene() {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
  // Wire the guided tour — watches tourStep and applies layers + camera + actions.
  useTour();

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: DEFAULT_CAMERA_POSITION, fov: 52 }}
        className="w-full h-full"
        style={{ background: "#06070a" }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        {/* Selection provides the context that <Select> and <Bloom> use
            for selective bloom — only flagged meshes get the halo. */}
        <Selection>
          <MacroScene />
          <CameraController controlsRef={controlsRef} />
          <SceneEffects />
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={3}
            maxDistance={45}
            dampingFactor={0.08}
            enableDamping
            target={DEFAULT_CAMERA_TARGET}
          />
        </Selection>
      </Canvas>
      <ControlDesk />
      <DataPanel />
      <HoverTooltip />
      <TracerSummary />
      <DetailPanel />
      <FlowKPIBoard />
      <TourOverlay />
    </div>
  );
}
