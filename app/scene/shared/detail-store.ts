import { create } from "zustand";

/**
 * Sticky detail view — opens when you click an allocator or a firm node.
 * Separate from hover-store so tooltip + panel don't fight each other.
 */
export type DetailTarget =
  | { kind: "allocator"; id: string }
  | { kind: "firm"; id: string };

interface DetailState {
  detail: DetailTarget | null;
  open: (target: DetailTarget) => void;
  close: () => void;
}

export const useDetailStore = create<DetailState>((set) => ({
  detail: null,
  open: (target) => set({ detail: target }),
  close: () => set({ detail: null }),
}));
