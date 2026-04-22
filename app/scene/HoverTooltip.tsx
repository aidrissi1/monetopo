"use client";

import { useEffect, useRef, useState } from "react";
import { useHoverStore } from "./shared/hover-store";

/**
 * Floating tooltip anchored to the mouse cursor.
 * Shows info about the currently-hovered allocator / firm node.
 * Lives outside the Canvas (plain DOM), positioned via a global mousemove
 * listener — so the 3D scene stays untouched.
 */
export function HoverTooltip() {
  const hovered = useHoverStore((s) => s.hovered);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!hovered || !pos) return null;

  // Offset so the tooltip doesn't sit under the cursor
  const OFFSET_X = 16;
  const OFFSET_Y = 16;
  const MAX_WIDTH = 280;

  // Flip to the left if the tooltip would run off the right edge
  const willOverflow = pos.x + OFFSET_X + MAX_WIDTH > window.innerWidth - 20;
  const left = willOverflow ? pos.x - MAX_WIDTH - OFFSET_X : pos.x + OFFSET_X;
  const top = pos.y + OFFSET_Y;

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 font-sans text-xs"
      style={{
        left,
        top,
        maxWidth: MAX_WIDTH,
        backgroundColor: "rgba(12, 15, 22, 0.92)",
        border: `1px solid ${hovered.color}55`,
        borderRadius: 6,
        padding: "8px 10px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
        color: "white",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: hovered.color, boxShadow: `0 0 6px ${hovered.color}` }}
        />
        <div
          className="font-semibold truncate"
          style={{ color: "#ffd97a", fontSize: 13 }}
        >
          {hovered.title}
        </div>
      </div>
      <div
        className="uppercase tracking-widest mb-1"
        style={{ opacity: 0.55, fontSize: 10 }}
      >
        {hovered.subtitle}
      </div>
      {hovered.meta && hovered.meta.length > 0 && (
        <div className="mt-1.5 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {hovered.meta.map((m, i) => (
            <div key={i} style={{ opacity: 0.75, fontSize: 11, lineHeight: 1.4 }}>
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
