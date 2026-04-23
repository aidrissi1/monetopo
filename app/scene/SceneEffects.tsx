"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSceneStore } from "./state";

/**
 * Post-processing stack.
 *
 * Selective bloom: `luminanceThreshold={1}` means non-selected objects
 * don't bloom at all, regardless of their emissive. Only meshes wrapped
 * in `<Select enabled>` pass through the bloom pass. The `<Selection>`
 * provider lives in Scene.tsx. Today only FlowParticles opts in — pipes
 * keep their standalone emissive glow, particles get the halo on top.
 *
 * Toggleable via the "bloom" layer in ControlDesk.
 */
export function SceneEffects() {
  const enabled = useSceneStore((s) => s.visibleLayers.has("bloom"));
  if (!enabled) return null;

  // multisampling={4} restores MSAA that EffectComposer would otherwise kill,
  // keeping edges crisp. `autoClear={false}` lets the scene's alpha pass through.
  return (
    <EffectComposer multisampling={4} autoClear={false}>
      <Bloom
        luminanceThreshold={1}
        luminanceSmoothing={0.15}
        intensity={1.2}
        mipmapBlur
        radius={0.9}
      />
    </EffectComposer>
  );
}
