"use client";

/**
 * FlowKPIBoard — top-right HTML overlay with 4 live stocks from the real data.
 *
 * Each KPI reads a baseline straight from `ecb.json` / `bonds.json`.
 * When tracer events are active, each displays an additional delta in gold
 * derived from the balance-sheet mechanics of a QE print:
 *
 *   - Eurosystem total assets     +€X (bonds go on the asset side)
 *   - APP + PEPP portfolio        +€X (QE buys sovereign / corporate bonds)
 *   - Bank reserves at Eurosystem +€X (sellers receive reserves on liability side)
 *   - ES bonds held by BCE        +€X × ES_SHARE (~10%, Spain's EA weight)
 *
 * Deltas drop to 0 the moment all active events retire (retireTracer).
 */

import { useSceneStore, selectActiveTracerAmount, ES_SHARE_OF_EUROSYSTEM } from "./state";
import ecbData from "@/app/data/ecb.json";
import bondsData from "@/app/data/bonds.json";

type Delta = { value: number; isDelta: true } | null;

function KpiRow({
  label,
  unit,
  baseline,
  delta,
  sub,
}: {
  label: string;
  unit: string;
  baseline: number;
  delta: Delta;
  sub?: string;
}) {
  const displayBase =
    unit === "B"
      ? baseline >= 1000
        ? `€${(baseline / 1000).toFixed(2)} T`
        : `€${Math.round(baseline)} B`
      : unit === "%"
        ? `${baseline.toFixed(2)}%`
        : `${baseline}`;

  return (
    <div style={{ padding: "6px 0" }}>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700 }}>{displayBase}</span>
        {delta && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#ffd97a",
              transition: "opacity 0.25s",
            }}
          >
            +€{Math.round(delta.value).toLocaleString()} B
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

export function FlowKPIBoard() {
  const activeAmount = useSceneStore(selectActiveTracerAmount);
  const hasActive = activeAmount > 0;

  const bs = ecbData.eurosystem_balance_sheet;
  const appPepp =
    (bs.assets.app_portfolio_bn_eur ?? 0) + (bs.assets.pepp_portfolio_bn_eur ?? 0);
  const totalAssets = bs.total_assets_bn_eur;
  const bankReserves = bs.liabilities.bank_reserves_at_eurosystem_bn_eur ?? 3180;
  const esBonds =
    bondsData.spanish_sovereign_debt.holdings_by_holder.eurosystem_apppepp_bn_eur;

  // QE mechanics → direct balance-sheet deltas.
  const d = (v: number): Delta => (hasActive ? { value: v, isDelta: true } : null);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 280,
        padding: "14px 16px",
        backgroundColor: "rgba(15, 18, 25, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#ffd97a",
          }}
        >
          Tableau de bord · flux en cours
        </div>
        {hasActive && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#5dd39e",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#5dd39e",
                animation: "pulse 1.4s ease-in-out infinite",
              }}
            />
            {activeAmount.toFixed(0)} B€ actif
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 4,
        }}
      />

      <KpiRow
        label="Actifs Eurosystème"
        unit="B"
        baseline={totalAssets}
        delta={d(activeAmount)}
        sub="bilan consolidé Eurosystème"
      />
      <KpiRow
        label="Portefeuille APP + PEPP"
        unit="B"
        baseline={appPepp}
        delta={d(activeAmount)}
        sub="achats d'actifs cumulés"
      />
      <KpiRow
        label="Réserves banques à la BCE"
        unit="B"
        baseline={bankReserves}
        delta={d(activeAmount)}
        sub="côté passif — création mécanique"
      />
      <KpiRow
        label="Obligations ES détenues par BCE"
        unit="B"
        baseline={esBonds}
        delta={d(activeAmount * ES_SHARE_OF_EUROSYSTEM)}
        sub={`part Espagne ≈ ${(ES_SHARE_OF_EUROSYSTEM * 100).toFixed(0)}% des achats`}
      />

      {!hasActive && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            fontSize: 10,
            opacity: 0.55,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 6,
            lineHeight: 1.4,
          }}
        >
          Lancez un événement depuis le Contrôle ↙ pour voir les KPI se
          recalibrer en temps réel.
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
