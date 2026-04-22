"use client";

import { useDetailStore } from "./shared/detail-store";
import allocatorsData from "@/app/data/allocators.json";
import firmsData from "@/app/data/ibex-firms.json";
import holdingsData from "@/app/data/holdings.json";
import type { AllocatorRegistry } from "./shared/allocator-types";
import type { HoldingsRegistry } from "./shared/holdings-types";
import { CATEGORY_COLOR, FIRM_SECTOR_COLOR } from "./shared/allocator-geometry";

const ALLOCATORS = allocatorsData as AllocatorRegistry;
const HOLDINGS = holdingsData as HoldingsRegistry;

interface IbexFirm { id: string; name: string; sector: string }
const FIRMS = (firmsData as { firms: IbexFirm[] }).firms;

const COMPLETENESS_LABEL = {
  verified: "Données vérifiées",
  partial: "Présence confirmée · % à sourcer",
  structural: "Présence structurelle · à vérifier",
} as const;

const COMPLETENESS_COLOR = {
  verified: "#5dd39e",
  partial: "#ffd97a",
  structural: "#9aa0ab",
} as const;

function AllocatorDetail({ allocatorId }: { allocatorId: string }) {
  const allocator = ALLOCATORS.allocators.find((a) => a.id === allocatorId);
  if (!allocator) return <div>Allocator not found.</div>;

  const holdings = HOLDINGS.holdings.filter((h) => h.allocator_id === allocatorId);
  const color = CATEGORY_COLOR[allocator.category] ?? "#808080";

  return (
    <>
      <Header
        title={allocator.name}
        subtitle={`Allocateur · ${allocator.category.replace(/_/g, " ")}`}
        color={color}
        chips={[
          { label: allocator.origin, muted: true },
          {
            label: COMPLETENESS_LABEL[allocator.completeness],
            color: COMPLETENESS_COLOR[allocator.completeness],
          },
        ]}
      />
      {allocator.notes && (
        <Section title="Note">
          <div style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.8 }}>
            {allocator.notes}
          </div>
        </Section>
      )}
      <Section title={`Positions Espagne · ${holdings.length}`}>
        {holdings.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            Aucune position spécifique référencée. Voir holdings.json pour ajouter
            les participations significatives (source : CNMV ou registre annuel).
          </div>
        ) : (
          <HoldingList rows={holdings.map((h) => ({
            name: nameForTarget(h.target_id),
            pct: h.pct_held,
            stake: h.stake_type,
            source: h.source,
            as_of: h.as_of,
          }))} />
        )}
      </Section>
    </>
  );
}

function FirmDetail({ firmId }: { firmId: string }) {
  const firm = FIRMS.find((f) => f.id === firmId);
  if (!firm) return <div>Firm not found.</div>;

  const holders = HOLDINGS.holdings.filter((h) => h.target_id === firmId);
  const color = FIRM_SECTOR_COLOR[firm.sector] ?? "#9aa0ab";

  return (
    <>
      <Header
        title={firm.name}
        subtitle={`IBEX · ${firm.sector.replace(/_/g, " ")}`}
        color={color}
        chips={[{ label: "Cible d'investissement", muted: true }]}
      />
      <Section title={`Propriétaires référencés · ${holders.length}`}>
        {holders.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            Aucun propriétaire encore référencé. Ajouter dans holdings.json
            depuis le rapport annuel de l'entreprise ou les filings CNMV
            (participations significatives).
          </div>
        ) : (
          <HoldingList rows={holders.map((h) => ({
            name: nameForAllocator(h.allocator_id),
            pct: h.pct_held,
            stake: h.stake_type,
            source: h.source,
            as_of: h.as_of,
          }))} />
        )}
      </Section>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function nameForTarget(id: string): string {
  const firm = FIRMS.find((f) => f.id === id);
  if (firm) return firm.name;
  // bank ids fall back to id (we don't have the names loaded here)
  const bankLabel = id.replace(/^(\w)/, (c) => c.toUpperCase());
  return bankLabel;
}

function nameForAllocator(id: string): string {
  const a = ALLOCATORS.allocators.find((x) => x.id === id);
  return a ? a.name : id;
}

function Header({
  title,
  subtitle,
  color,
  chips,
}: {
  title: string;
  subtitle: string;
  color: string;
  chips: { label: string; color?: string; muted?: boolean }[];
}) {
  return (
    <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
        <div
          className="font-semibold"
          style={{ color: "#ffd97a", fontSize: 15, lineHeight: 1.2 }}
        >
          {title}
        </div>
      </div>
      <div
        className="uppercase tracking-widest mb-2"
        style={{ fontSize: 10, opacity: 0.55 }}
      >
        {subtitle}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span
            key={i}
            style={{
              fontSize: 9,
              padding: "2px 7px",
              borderRadius: 10,
              backgroundColor: c.muted
                ? "rgba(255,255,255,0.06)"
                : `${c.color ?? "#888"}22`,
              border: `1px solid ${c.muted ? "rgba(255,255,255,0.12)" : (c.color ?? "#888") + "55"}`,
              color: c.muted ? "rgba(255,255,255,0.65)" : (c.color ?? "#888"),
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div
        className="uppercase tracking-widest mb-1.5"
        style={{ fontSize: 10, opacity: 0.5 }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function HoldingList({
  rows,
}: {
  rows: { name: string; pct: number | null; stake: string; source: string; as_of: string }[];
}) {
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div
          key={i}
          className="p-2 rounded"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            fontSize: 12,
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="truncate" style={{ color: "white", fontWeight: 500 }}>
              {r.name}
            </div>
            <div className="tabular-nums flex-shrink-0" style={{ color: r.pct === null ? "#9aa0ab" : "#ffd97a" }}>
              {r.pct === null ? "—" : `${r.pct}%`}
            </div>
          </div>
          <div
            className="flex items-baseline justify-between gap-2 mt-0.5"
            style={{ fontSize: 10, opacity: 0.55 }}
          >
            <div className="truncate">{r.stake.replace(/_/g, " ")}</div>
            <div className="tabular-nums flex-shrink-0">{r.as_of}</div>
          </div>
          <div
            className="truncate mt-0.5"
            style={{ fontSize: 9.5, opacity: 0.4, fontStyle: "italic" }}
            title={r.source}
          >
            {r.source}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Right-side sticky detail panel. Opens on click of allocator/firm nodes,
 * closes via close button or clicking elsewhere.
 */
export function DetailPanel() {
  const detail = useDetailStore((s) => s.detail);
  const close = useDetailStore((s) => s.close);

  return (
    <div
      className="absolute top-4 right-4 font-sans text-sm text-white overflow-y-auto"
      style={{
        backgroundColor: "rgba(12, 15, 22, 0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "14px 16px",
        width: 340,
        maxHeight: "calc(100vh - 2rem)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        opacity: detail ? 1 : 0,
        transform: detail ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.25s, transform 0.25s",
        pointerEvents: detail ? "auto" : "none",
      }}
    >
      <button
        onClick={close}
        className="absolute right-3 top-3 text-xs"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "white",
          cursor: "pointer",
          padding: "3px 8px",
          borderRadius: 4,
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        fermer ×
      </button>
      {detail?.kind === "allocator" && <AllocatorDetail allocatorId={detail.id} />}
      {detail?.kind === "firm" && <FirmDetail firmId={detail.id} />}
    </div>
  );
}
