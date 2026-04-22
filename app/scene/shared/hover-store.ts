import { create } from "zustand";

/**
 * Lightweight hover state — separate store so mouse movement doesn't
 * trigger re-renders of the main scene store.
 *
 * Used by allocator dome + IBEX firm cluster (and any future actor
 * that wants to participate in the tooltip layer).
 */
export interface HoveredEntity {
  id: string;
  title: string;
  subtitle: string;
  meta?: string[];
  color: string;
}

interface HoverState {
  hovered: HoveredEntity | null;
  setHovered: (e: HoveredEntity | null) => void;
}

export const useHoverStore = create<HoverState>((set) => ({
  hovered: null,
  setHovered: (e) => set({ hovered: e }),
}));
