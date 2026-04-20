import { create } from "zustand";
import type { EntityId, LayerId } from "./shared/types";

export type FocusMode = "overview" | "focused" | "interior";

interface SceneState {
  activeEntity: EntityId | null;
  focusMode: FocusMode;
  visibleLayers: Set<LayerId>;

  /** Fly camera to an entity (focused mode). */
  focusEntity: (id: EntityId) => void;
  /** Enter interior scene for current entity (v1: a no-op placeholder). */
  enterInterior: () => void;
  /** Reset to overview. */
  returnToOverview: () => void;

  toggleLayer: (layer: LayerId) => void;
  setLayerVisible: (layer: LayerId, visible: boolean) => void;
}

const ALL_LAYERS: LayerId[] = [
  "banking_core",
  "credit_flows",
  "circulation",
  "ecb",
  "state",
  "bonds",
];

export const useSceneStore = create<SceneState>((set) => ({
  activeEntity: null,
  focusMode: "overview",
  visibleLayers: new Set<LayerId>(ALL_LAYERS),

  focusEntity: (id) => set({ activeEntity: id, focusMode: "focused" }),
  enterInterior: () => set({ focusMode: "interior" }),
  returnToOverview: () =>
    set({ activeEntity: null, focusMode: "overview" }),

  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.visibleLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { visibleLayers: next };
    }),
  setLayerVisible: (layer, visible) =>
    set((state) => {
      const next = new Set(state.visibleLayers);
      if (visible) next.add(layer);
      else next.delete(layer);
      return { visibleLayers: next };
    }),
}));
