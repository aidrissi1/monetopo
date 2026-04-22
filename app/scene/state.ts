import { create } from "zustand";
import type { EntityId, LayerId } from "./shared/types";

export type FocusMode = "overview" | "focused" | "interior";

/** A single active QE-tracer print event. */
export interface TracerEvent {
  id: number;
  presetId: string;
  startedAt: number;
  amountBn: number;
}

interface SceneState {
  activeEntity: EntityId | null;
  focusMode: FocusMode;
  visibleLayers: Set<LayerId>;
  /** Entity whose outer shell is split open, revealing its interior.
   *  Independent of camera focus — the user can orbit freely while opened. */
  openedEntity: EntityId | null;

  /** Active money-flow-tracer events (usually 0 or 1 at a time). */
  tracerEvents: TracerEvent[];
  /** Preset last selected (drives the button label + next-fire parameters). */
  tracerPreset: string;

  /** Fly camera to an entity (focused mode). */
  focusEntity: (id: EntityId) => void;
  /** Enter interior scene for current entity (v1: a no-op placeholder). */
  enterInterior: () => void;
  /** Reset to overview. */
  returnToOverview: () => void;

  /** Split the entity's shell open (animated). */
  openEntity: (id: EntityId) => void;
  /** Close all open shells. */
  closeEntity: () => void;

  toggleLayer: (layer: LayerId) => void;
  setLayerVisible: (layer: LayerId, visible: boolean) => void;

  /** Fire a new print-event — spawns particles from ECB outward. */
  fireTracer: (presetId: string, amountBn: number) => void;
  /** Remove a tracer event (called when animation completes). */
  retireTracer: (id: number) => void;
  setTracerPreset: (presetId: string) => void;
}

const ALL_LAYERS: LayerId[] = [
  "banking_core",
  "credit_flows",
  "return_flows",
  "circulation",
  "ecb",
  "state",
  "bonds",
  "shadow",
  "allocators",
  "ownership",
  "common_ownership",
  "supervisors",
  "eu_fiscal",
  "rating_agencies",
  "payment_rails",
];

let _tracerNextId = 1;

export const useSceneStore = create<SceneState>((set) => ({
  activeEntity: null,
  focusMode: "overview",
  visibleLayers: new Set<LayerId>(ALL_LAYERS),
  openedEntity: null,

  tracerEvents: [],
  tracerPreset: "pepp_2020",

  focusEntity: (id) => set({ activeEntity: id, focusMode: "focused" }),
  enterInterior: () => set({ focusMode: "interior" }),
  returnToOverview: () =>
    set({ activeEntity: null, focusMode: "overview", openedEntity: null }),

  openEntity: (id) => set({ openedEntity: id }),
  closeEntity: () => set({ openedEntity: null }),

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

  fireTracer: (presetId, amountBn) =>
    set((state) => ({
      tracerEvents: [
        ...state.tracerEvents,
        {
          id: _tracerNextId++,
          presetId,
          startedAt: performance.now(),
          amountBn,
        },
      ],
    })),
  retireTracer: (id) =>
    set((state) => ({
      tracerEvents: state.tracerEvents.filter((e) => e.id !== id),
    })),
  setTracerPreset: (presetId) => set({ tracerPreset: presetId }),
}));
