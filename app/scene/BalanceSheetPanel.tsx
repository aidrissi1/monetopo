"use client";

/**
 * BalanceSheetPanel — slides in from the right when a bank entity is focused.
 *
 * Shows the BoE 2014 dual-entry visually:
 *   ASSETS                         LIABILITIES
 *   ─────────                      ─────────────
 *   Loans created       +€X B     Deposits created   +€X B
 *
 * Both columns ALWAYS move together. That's the teaching — the user clicks
 * "Créer crédit", sees both numbers bump simultaneously, sees a particle
 * fly bank → borrower, sees the KPI panel react. Click "Rembourser" and
 * both zero out as the particle flies back.
 */

import { useSceneStore, selectBankBalance } from "./state";
import { CREATORS } from "./shared/creators";

const CLICK_AMOUNT_BN = 10;

function formatBn(bn: number, sign = ""): string {
  if (bn === 0) return `${sign}€0 B`;
  const abs = Math.abs(bn);
  const display = abs >= 1000 ? `€${(abs / 1000).toFixed(1)} T` : `€${abs.toFixed(1)} B`;
  if (bn > 0) return `+${display}`;
  if (bn < 0) return `−${display}`;
  return display;
}

export function BalanceSheetPanel() {
  const activeEntity = useSceneStore((s) => s.activeEntity);
  const balance = useSceneStore((s) =>
    activeEntity ? selectBankBalance(s, activeEntity) : null,
  );
  const createCredit = useSceneStore((s) => s.createCredit);
  const destroyCredit = useSceneStore((s) => s.destroyCredit);

  // Only show the panel when the focused entity is a known bank.
  const isBank = !!CREATORS.find((c) => c.id === activeEntity);
  if (!isBank || !activeEntity || !balance) return null;

  const bank = CREATORS.find((c) => c.id === activeEntity);
  const canDestroy = balance.loansAdded >= CLICK_AMOUNT_BN;

  return (
    <div
      style={{
        position: "absolute",
        top: 320, // below the KPI board
        right: 16,
        width: 280,
        padding: "14px 16px",
        backgroundColor: "rgba(15, 18, 25, 0.9)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,217,122,0.22)",
        borderRadius: 8,
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#ffd97a",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Bilan · création monétaire
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
        {bank?.name ?? activeEntity}
      </div>

      {/* T-account: Assets | Liabilities */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: "10px 8px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.5,
              marginBottom: 4,
            }}
          >
            Actif · Loans
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: balance.loansAdded > 0 ? "#ffd97a" : "rgba(255,255,255,0.55)",
              transition: "color 0.3s",
            }}
          >
            {formatBn(balance.loansAdded)}
          </div>
        </div>
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 10 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.5,
              marginBottom: 4,
            }}
          >
            Passif · Deposits
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color:
                balance.depositsAdded > 0 ? "#ffd97a" : "rgba(255,255,255,0.55)",
              transition: "color 0.3s",
            }}
          >
            {formatBn(balance.depositsAdded)}
          </div>
        </div>
      </div>

      {/* The crucial insight — surfaced as text */}
      <div
        style={{
          fontSize: 10,
          fontStyle: "italic",
          opacity: 0.65,
          lineHeight: 1.45,
          marginBottom: 12,
          padding: "6px 8px",
          background: "rgba(255,217,122,0.05)",
          borderLeft: "2px solid rgba(255,217,122,0.4)",
          borderRadius: 2,
        }}
      >
        Les deux colonnes bougent ensemble. C&apos;est la création monétaire
        au sens strict — le prêt et le dépôt n&apos;existaient pas une
        seconde plus tôt.
      </div>

      {/* Action buttons */}
      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.5,
            marginBottom: 2,
          }}
        >
          Créer crédit · €{CLICK_AMOUNT_BN} B
        </div>
        <button
          onClick={() => createCredit(activeEntity, "menages", CLICK_AMOUNT_BN)}
          style={primaryButtonStyle}
        >
          → vers ménages
        </button>
        <button
          onClick={() => createCredit(activeEntity, "entreprises", CLICK_AMOUNT_BN)}
          style={primaryButtonStyle}
        >
          → vers entreprises
        </button>

        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.5,
            marginTop: 8,
            marginBottom: 2,
          }}
        >
          Rembourser · €{CLICK_AMOUNT_BN} B
        </div>
        <button
          onClick={() =>
            destroyCredit(activeEntity, "menages", CLICK_AMOUNT_BN)
          }
          disabled={!canDestroy}
          style={canDestroy ? destroyButtonStyle : disabledButtonStyle}
        >
          ← depuis ménages
        </button>
        <button
          onClick={() =>
            destroyCredit(activeEntity, "entreprises", CLICK_AMOUNT_BN)
          }
          disabled={!canDestroy}
          style={canDestroy ? destroyButtonStyle : disabledButtonStyle}
        >
          ← depuis entreprises
        </button>
      </div>

      {balance.eventCount > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: 10,
            opacity: 0.55,
            letterSpacing: "0.05em",
          }}
        >
          {balance.eventCount} événement{balance.eventCount > 1 ? "s" : ""} de
          crédit dans cette session
        </div>
      )}
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  background:
    "linear-gradient(135deg, rgba(255,217,122,0.2), rgba(255,217,122,0.08))",
  border: "1px solid rgba(255,217,122,0.35)",
  color: "#ffd97a",
  cursor: "pointer",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textAlign: "left",
};

const destroyButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  background:
    "linear-gradient(135deg, rgba(255,122,90,0.18), rgba(255,122,90,0.06))",
  border: "1px solid rgba(255,122,90,0.35)",
  color: "#ff9c8a",
  cursor: "pointer",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textAlign: "left",
};

const disabledButtonStyle: React.CSSProperties = {
  ...destroyButtonStyle,
  opacity: 0.35,
  cursor: "not-allowed",
};
