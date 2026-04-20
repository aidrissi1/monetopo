"use client";

import { useState } from "react";
import { useSceneStore } from "./state";
import { ENTITIES } from "./entities";
import type { Entity, EntityId, LayerId } from "./shared/types";

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
];

const LAYER_LABELS: { id: LayerId; label: string }[] = [
  { id: "banking_core", label: "Banques & capital" },
  { id: "credit_flows", label: "Flux de crédit" },
  { id: "circulation", label: "Circulation (salaires/conso)" },
  { id: "ecb", label: "BCE" },
  { id: "state", label: "État" },
  { id: "bonds", label: "Obligations" },
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
  const focusEntity = useSceneStore((s) => s.focusEntity);
  const returnToOverview = useSceneStore((s) => s.returnToOverview);
  const toggleLayer = useSceneStore((s) => s.toggleLayer);

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
          {/* Current focus + back button */}
          {focusMode !== "overview" && activeEntity && (
            <div
              className="mb-3 pb-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">
                Vue actuelle
              </div>
              <div className="flex items-center justify-between">
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
        </>
      )}
    </div>
  );
}
