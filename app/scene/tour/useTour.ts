"use client";

import { useEffect, useRef } from "react";
import { useSceneStore } from "../state";
import { TOUR } from "./chapters";

/**
 * Watches `tourStep` in the store and applies each chapter's effects:
 *   - replaces visibleLayers with the chapter's set
 *   - focuses an entity (or returns to overview) via the existing store actions
 *   - runs the chapter's side-effect exactly once per entry (e.g. fire_qe)
 *
 * Mount this hook once at the scene level (Scene.tsx). It has no render
 * output — it only writes to the store when tourStep changes.
 */
export function useTour() {
  const tourStep = useSceneStore((s) => s.tourStep);

  // Track which step we last applied so we don't re-fire side-effects
  // on unrelated renders (chapter action should run once per enter).
  const appliedStepRef = useRef<number | null>(null);

  useEffect(() => {
    // Tour inactive — nothing to do (exitTour already cleans up layers).
    if (tourStep === null) {
      appliedStepRef.current = null;
      return;
    }

    // Index out of range — exit gracefully.
    if (tourStep < 0 || tourStep >= TOUR.length) {
      useSceneStore.getState().exitTour();
      return;
    }

    // Already applied this step — nothing to do.
    if (appliedStepRef.current === tourStep) return;
    appliedStepRef.current = tourStep;

    const chapter = TOUR[tourStep];
    const store = useSceneStore.getState();

    // 1. Layers — replace wholesale.
    store.setVisibleLayers(chapter.layers);

    // 2. Camera — focused entity or overview.
    if (chapter.focus) {
      store.focusEntity(chapter.focus);
    } else {
      store.returnToOverview();
    }

    // 3. Chapter action (side-effect). Fire once on entry.
    if (chapter.action === "fire_qe") {
      // Slight delay so the camera has a beat to settle before particles fly.
      const timer = setTimeout(() => {
        useSceneStore.getState().fireTracer(store.tracerPreset, 100);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [tourStep]);
}
