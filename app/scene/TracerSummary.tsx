"use client";

import { useEffect, useState } from "react";
import { useSceneStore } from "./state";
import qeData from "@/app/data/qe-transmission.json";
import type { QeTransmissionData, TracerChannel } from "./shared/tracer-types";

const DATA = qeData as QeTransmissionData;

/**
 * Summary card that fades in 3s after a tracer fires — shows where the
 * printed euros actually landed, with channel colors + % split.
 */
export function TracerSummary() {
  const events = useSceneStore((s) => s.tracerEvents);
  const [lastEvent, setLastEvent] = useState<
    { presetId: string; amountBn: number } | null
  >(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const latest = events[events.length - 1];
    if (latest) {
      setLastEvent({ presetId: latest.presetId, amountBn: latest.amountBn });
      // Reveal the summary shortly after the particles have had time to start flowing
      const showTimer = setTimeout(() => setVisible(true), 2500);
      // Fade out after a while
      const hideTimer = setTimeout(() => setVisible(false), 12000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [events]);

  if (!lastEvent) return null;

  const preset = DATA.presets.find((p) => p.id === lastEvent.presetId);
  if (!preset) return null;

  return (
    <div
      className="absolute right-4 bottom-4 max-w-[380px] font-sans text-sm text-white"
      style={{
        backgroundColor: "rgba(12, 15, 22, 0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "16px 18px",
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s, transform 0.5s",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        className="font-bold uppercase tracking-widest text-xs mb-2"
        style={{ color: "#ffd97a" }}
      >
        Transmission · {preset.label}
      </div>
      <div className="mb-3" style={{ fontSize: 12, opacity: 0.7 }}>
        Impression de <strong style={{ color: "white" }}>€{lastEvent.amountBn}B</strong>.
        Voici où les euros atterrissent — {preset.context.toLowerCase()}
      </div>

      {/* Stacked bar */}
      <div
        className="flex mb-2 overflow-hidden rounded"
        style={{ height: 10, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {(Object.keys(preset.ratios) as TracerChannel[]).map((ch) => (
          <div
            key={ch}
            style={{
              flexBasis: `${preset.ratios[ch] * 100}%`,
              backgroundColor: DATA.channels[ch].color,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {(Object.keys(preset.ratios) as TracerChannel[]).map((ch) => {
          const ratio = preset.ratios[ch];
          const euros = Math.round(lastEvent.amountBn * ratio);
          return (
            <div
              key={ch}
              className="flex items-baseline justify-between gap-3"
              style={{ fontSize: 12 }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: DATA.channels[ch].color,
                    boxShadow: `0 0 6px ${DATA.channels[ch].color}`,
                  }}
                />
                <span className="truncate" style={{ color: "white" }}>
                  {DATA.channels[ch].label}
                </span>
              </div>
              <div
                className="tabular-nums flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                €{euros}B <span style={{ opacity: 0.5 }}>({Math.round(ratio * 100)}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source + honesty flag */}
      <div
        className="mt-3 pt-2"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 10,
          lineHeight: 1.4,
          opacity: 0.55,
        }}
      >
        {preset.verified
          ? <>Source : {preset.source}</>
          : <>⚠️ Ratios illustratifs — à raffiner depuis recherche ECB/BdE. Source prévue : {preset.source}</>}
      </div>
    </div>
  );
}
