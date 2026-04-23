import { create } from "zustand";
import type { EntityId, LayerId } from "./shared/types";

/** Spain's share of Eurosystem QE (GDP-based, approx). Used to attribute the
 *  ES slice of an EU-wide QE print in the KPI board. */
export const ES_SHARE_OF_EUROSYSTEM = 0.1;

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

  /** Scene lighting — user-controllable via the ControlDesk sliders. */
  lighting: {
    ambient: number; // 0..1.5
    key: number;     // 0..2
    fill: number;    // 0..1
  };
  setLighting: (which: "ambient" | "key" | "fill", value: number) => void;
  applyLightingPreset: (preset: "studio" | "museum" | "night") => void;

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

  /* ─── Guided tour state ───────────────────────────────────────────── */
  /** Current chapter index (0..N-1), or null when the tour isn't running. */
  tourStep: number | null;
  startTour: () => void;
  advanceTour: () => void;
  goToTourStep: (step: number | null) => void;
  exitTour: () => void;
  /** Wholesale layer replacement — used by the tour hook each step. */
  setVisibleLayers: (layers: LayerId[]) => void;
}

/** Sum of €B across all currently-active tracer events. Drops to 0 between fires. */
export function selectActiveTracerAmount(s: SceneState): number {
  return s.tracerEvents.reduce((sum, e) => sum + e.amountBn, 0);
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
  "flow_particles",
  "bloom",
  "economy_actors",
];

let _tracerNextId = 1;

export const useSceneStore = create<SceneState>((set) => ({
  activeEntity: null,
  focusMode: "overview",
  visibleLayers: new Set<LayerId>(ALL_LAYERS),
  openedEntity: null,

  tracerEvents: [],
  tracerPreset: "pepp_2020",

  lighting: { ambient: 0.45, key: 0.9, fill: 0.3 },
  setLighting: (which, value) =>
    set((state) => ({ lighting: { ...state.lighting, [which]: value } })),
  applyLightingPreset: (preset) =>
    set(() => {
      switch (preset) {
        case "studio":
          return { lighting: { ambient: 0.25, key: 1.4, fill: 0.2 } };
        case "museum":
          return { lighting: { ambient: 0.85, key: 0.55, fill: 0.35 } };
        case "night":
          return { lighting: { ambient: 0.15, key: 0.55, fill: 0.85 } };
      }
    }),

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

  /* ─── Guided tour ──────────────────────────────────────────────────── */
  tourStep: null,
  startTour: () => set({ tourStep: 0 }),
  advanceTour: () =>
    set((s) => ({
      tourStep: s.tourStep === null ? 0 : s.tourStep + 1,
    })),
  goToTourStep: (step) => set({ tourStep: step }),
  exitTour: () =>
    set({
      tourStep: null,
      visibleLayers: new Set<LayerId>(ALL_LAYERS),
      activeEntity: null,
      focusMode: "overview",
    }),
  setVisibleLayers: (layers) =>
    set({ visibleLayers: new Set<LayerId>(layers) }),
}));
