"use client";

import { useState } from "react";
import { useSceneStore } from "./state";
import { ENTITIES } from "./entities";
import type { Entity, EntityId, LayerId } from "./shared/types";
import qeData from "@/app/data/qe-transmission.json";
import type { QeTransmissionData } from "./shared/tracer-types";

const QE = qeData as QeTransmissionData;

// Entities that support the shell-opening interaction (OpenableSphere wrapper).
// Expand this set as more actors are retrofitted.
const OPENABLE: Set<EntityId> = new Set([
  "shadow_money",
  "hub",
  "bde",
  "santander",
  "bbva",
  "caixabank",
  "sabadell",
  "bankinter",
  "unicaja",
  "kutxabank",
  "ibercaja",
  "abanca",
  "cajamar",
  "otros",
]);

/**
 * Group entities by their conceptual category for the desk menu.
 */
const GROUPS: { title: string; entityIds: EntityId[] }[] = [
  { title: "Autorité", entityIds: ["ecb"] },
  { title: "Capital", entityIds: ["hub"] },
  {
    title: "Banques",
    entityIds: [
      "bde",
      "santander",
      "bbva",
      "caixabank",
      "sabadell",
      "bankinter",
      "unicaja",
      "kutxabank",
      "ibercaja",
      "abanca",
      "cajamar",
      "otros",
    ],
  },
  { title: "Obligations", entityIds: ["bond_belt"] },
  { title: "État", entityIds: ["state"] },
  { title: "Destinations", entityIds: ["menages", "entreprises"] },
  { title: "Zone grise", entityIds: ["shadow_money"] },
];

const LAYER_LABELS: { id: LayerId; label: string }[] = [
  { id: "banking_core", label: "Banques & capital" },
  { id: "credit_flows", label: "Flux de crédit" },
  { id: "return_flows", label: "Dépôts & intérêts" },
  { id: "circulation", label: "Circulation (salaires/conso)" },
  { id: "ecb", label: "BCE" },
  { id: "state", label: "État" },
  { id: "bonds", label: "Obligations" },
  { id: "shadow", label: "Finance parallèle" },
  { id: "allocators", label: "Allocateurs · Tier 4" },
  { id: "ownership", label: "Fils de propriété" },
  { id: "common_ownership", label: "Propriété croisée (Elhauge)" },
  { id: "supervisors", label: "Superviseurs · Tier 2" },
  { id: "eu_fiscal", label: "Fiscal UE (EIB, ESM, NGEU)" },
  { id: "rating_agencies", label: "Agences de notation · Tier 0" },
  { id: "payment_rails", label: "Rails de paiement · Tier 3" },
  { id: "flow_particles", label: "Particules de flux (animé)" },
  { id: "bloom", label: "Bloom (halo lumineux)" },
];

function Swatch({ kind, color }: { kind: Entity["kind"]; color: string }) {
  const base = "inline-block w-3 h-3 mr-2 flex-shrink-0";
  if (kind === "pyramid")
    return (
      <span
        className={base}
        style={{
          backgroundColor: color,
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }}
      />
    );
  if (kind === "obelisk")
    return (
      <span
        className={base}
        style={{ backgroundColor: color, width: "6px", height: "12px" }}
      />
    );
  if (kind === "box")
    return <span className={base} style={{ backgroundColor: color }} />;
  if (kind === "belt")
    return (
      <span
        className="inline-block w-3 h-3 mr-2 flex-shrink-0 rounded-full border-2"
        style={{ borderColor: color, background: "transparent" }}
      />
    );
  // sphere
  return (
    <span
      className={`${base} rounded-full`}
      style={{ backgroundColor: color }}
    />
  );
}

export function ControlDesk() {
  const activeEntity = useSceneStore((s) => s.activeEntity);
  const focusMode = useSceneStore((s) => s.focusMode);
  const visibleLayers = useSceneStore((s) => s.visibleLayers);
  const openedEntity = useSceneStore((s) => s.openedEntity);
  const focusEntity = useSceneStore((s) => s.focusEntity);
  const returnToOverview = useSceneStore((s) => s.returnToOverview);
  const openEntity = useSceneStore((s) => s.openEntity);
  const closeEntity = useSceneStore((s) => s.closeEntity);
  const toggleLayer = useSceneStore((s) => s.toggleLayer);
  const tracerPreset = useSceneStore((s) => s.tracerPreset);
  const setTracerPreset = useSceneStore((s) => s.setTracerPreset);
  const fireTracer = useSceneStore((s) => s.fireTracer);

  const [collapsed, setCollapsed] = useState(false);

  const entityById = new Map(ENTITIES.map((e) => [e.id, e]));

  return (
    <div
      className="absolute bottom-4 left-4 max-h-[calc(100vh-2rem)] overflow-y-auto font-sans text-sm text-white"
      style={{
        backgroundColor: "rgba(15, 18, 25, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: collapsed ? "10px 14px" : "14px 16px",
        width: collapsed ? "auto" : 280,
        transition: "width 0.2s, padding 0.2s",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="font-bold uppercase tracking-widest text-xs"
          style={{ color: "#ffd97a" }}
        >
          Système monétaire
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs opacity-60 hover:opacity-100"
          style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}
        >
          {collapsed ? "▸" : "▾"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Guided tour entry — primary CTA at the top */}
          <TourLaunchButton />

          {/* Current focus + back button + open/close button */}
          {focusMode !== "overview" && activeEntity && (
            <div
              className="mb-3 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">
                Vue actuelle
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">
                  {entityById.get(activeEntity)?.label ?? activeEntity}
                </div>
                <button
                  onClick={returnToOverview}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  ← retour
                </button>
              </div>
              {OPENABLE.has(activeEntity) && (
                <button
                  onClick={() =>
                    openedEntity === activeEntity
                      ? closeEntity()
                      : openEntity(activeEntity)
                  }
                  className="w-full text-xs px-3 py-1.5 rounded"
                  style={{
                    background:
                      openedEntity === activeEntity
                        ? "rgba(255, 217, 122, 0.2)"
                        : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color:
                      openedEntity === activeEntity ? "#ffd97a" : "white",
                    cursor: "pointer",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {openedEntity === activeEntity
                    ? "◉  Fermer"
                    : "◎  Ouvrir"}
                </button>
              )}
            </div>
          )}

          {/* Entity groups */}
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-3">
              <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">
                {group.title}
              </div>
              {group.entityIds.map((id) => {
                const e = entityById.get(id);
                if (!e) return null;
                const isActive = activeEntity === id;
                return (
                  <button
                    key={id}
                    onClick={() => focusEntity(id)}
                    className="w-full flex items-center text-left py-1 px-2 rounded"
                    style={{
                      background: isActive
                        ? "rgba(255, 217, 122, 0.15)"
                        : "transparent",
                      border: "none",
                      color: isActive ? "#ffd97a" : "white",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <Swatch kind={e.kind} color={e.color} />
                    <span className="truncate">{e.label}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* QE money-flow tracer */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">
              Tracer · Où va la monnaie imprimée ?
            </div>
            <select
              value={tracerPreset}
              onChange={(e) => setTracerPreset(e.target.value)}
              className="w-full mb-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                padding: "6px 8px",
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              {QE.presets.map((p) => (
                <option key={p.id} value={p.id} style={{ color: "black" }}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => fireTracer(tracerPreset, 100)}
              className="w-full text-xs px-3 py-2 rounded font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,217,122,0.2), rgba(255,217,122,0.08))",
                border: "1px solid rgba(255,217,122,0.35)",
                color: "#ffd97a",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              💶  Imprimer €100 B
            </button>
            {/* Warning: the per-channel ratios in qe-transmission.json are
                flagged verified:false — sourced placeholder defaults, not
                peer-reviewed. Surface this so nobody treats them as truth. */}
            <div
              className="mt-2 flex items-start gap-2 px-2 py-1.5 rounded"
              style={{
                background: "rgba(255,166,64,0.08)",
                border: "1px solid rgba(255,166,64,0.3)",
                fontSize: 10,
                lineHeight: 1.35,
                color: "#ffc98a",
              }}
            >
              <span style={{ fontSize: 12 }}>⚠</span>
              <span>
                <strong style={{ letterSpacing: "0.05em" }}>
                  Ratios illustratifs.
                </strong>{" "}
                À raffiner depuis ECB Working Papers (PEPP + APP transmission).
              </span>
            </div>
          </div>

          {/* Layer toggles */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">
              Couches visibles
            </div>
            {LAYER_LABELS.map(({ id, label }) => {
              const visible = visibleLayers.has(id);
              return (
                <label
                  key={id}
                  className="flex items-center py-0.5 cursor-pointer"
                  style={{ fontSize: 12 }}
                >
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => toggleLayer(id)}
                    className="mr-2"
                  />
                  <span style={{ opacity: visible ? 1 : 0.45 }}>{label}</span>
                </label>
              );
            })}
          </div>

          {/* Lighting controls */}
          <LightingPanel />
        </>
      )}
    </div>
  );
}

function LightingPanel() {
  const lighting = useSceneStore((s) => s.lighting);
  const setLighting = useSceneStore((s) => s.setLighting);
  const applyPreset = useSceneStore((s) => s.applyLightingPreset);

  return (
    <div
      className="mt-4 pt-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2">
        Éclairage
      </div>
      <div className="flex gap-1 mb-3">
        {(["studio", "museum", "night"] as const).map((p) => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            className="flex-1 py-1 text-[10px] uppercase tracking-wide rounded"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <LightSlider
        label="Ambiant"
        value={lighting.ambient}
        min={0}
        max={1.5}
        onChange={(v) => setLighting("ambient", v)}
      />
      <LightSlider
        label="Clef"
        value={lighting.key}
        min={0}
        max={2}
        onChange={(v) => setLighting("key", v)}
      />
      <LightSlider
        label="Contre (bleu)"
        value={lighting.fill}
        min={0}
        max={1}
        onChange={(v) => setLighting("fill", v)}
      />
    </div>
  );
}

function LightSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 py-1" style={{ fontSize: 11 }}>
      <span className="w-20 opacity-70">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="w-8 text-right tabular-nums opacity-60">
        {value.toFixed(2)}
      </span>
    </label>
  );
}

/**
 * Primary entry into the guided tour. When the tour is active, shows a muted
 * "restart" option + a "quitter" shortcut instead.
 */
function TourLaunchButton() {
  const tourStep = useSceneStore((s) => s.tourStep);
  const startTour = useSceneStore((s) => s.startTour);
  const exitTour = useSceneStore((s) => s.exitTour);
  const isActive = tourStep !== null;

  if (isActive) {
    return (
      <div
        className="mb-3 pb-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={startTour}
          className="flex-1 text-xs px-2 py-2 rounded"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.75)",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          ↺ Recommencer
        </button>
        <button
          onClick={exitTour}
          className="flex-1 text-xs px-2 py-2 rounded"
          style={{
            background: "rgba(255,100,100,0.08)",
            border: "1px solid rgba(255,100,100,0.25)",
            color: "#ff9090",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          ✕ Quitter
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startTour}
      className="w-full mb-3 px-3 py-2.5 rounded font-semibold"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,217,122,0.22), rgba(255,217,122,0.08))",
        border: "1px solid rgba(255,217,122,0.45)",
        color: "#ffd97a",
        cursor: "pointer",
        letterSpacing: "0.06em",
        fontSize: 12,
      }}
    >
      ▶ Commencer la visite guidée
    </button>
  );
}
