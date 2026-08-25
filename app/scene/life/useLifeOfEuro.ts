"use client";

import { useEffect, useRef } from "react";
import { useSceneStore } from "../state";
import { LIFE_SCRIPT } from "./script";

/**
 * Watches `lifeStep` in the store and runs each chapter's side-effect
 * exactly once on entry. Step 0 focuses the bank so the BalanceSheetPanel
 * is visible for the creation/destruction steps. Mount once at scene
 * level — no render output.
 */
export function useLifeOfEuro() {
  const lifeStep = useSceneStore((s) => s.lifeStep);
  const appliedRef = useRef<number | null>(null);

  useEffect(() => {
    if (lifeStep === null) {
      appliedRef.current = null;
      return;
    }
    if (lifeStep < 0 || lifeStep >= LIFE_SCRIPT.length) {
      useSceneStore.getState().exitLifeOfEuro();
      return;
    }
    if (appliedRef.current === lifeStep) return;
    appliedRef.current = lifeStep;

    const store = useSceneStore.getState();
    const step = LIFE_SCRIPT[lifeStep];

    // Step 0: focus the lender so the BalanceSheetPanel opens automatically
    // and the user sees both T-account entries appear together.
    if (lifeStep === 0) {
      store.focusEntity("santander");
    }

    step.run(store, store.lifeAmountBn);
  }, [lifeStep]);
}
