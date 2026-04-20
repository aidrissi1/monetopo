"use client";

import { useSceneStore } from "./state";
import { getEntity } from "./entities";
import banksData from "../data/banks.json";
import stateData from "../data/state.json";
import householdsData from "../data/households.json";
import firmsData from "../data/firms.json";
import ecbData from "../data/ecb.json";
import bondsData from "../data/bonds.json";
import {
  AGGREGATE_CET1_BN_EUR,
  AGGREGATE_BANK_ASSETS_BN_EUR,
  bondHoldings,
} from "./shared/dataScaling";

type Row = { label: string; value: string };

type Freshness = { lastUpdated: string; autoRefresh: boolean };

function freshnessForEntity(id: string): Freshness | null {
  // Map entity id → which JSON file holds its data
  const bankIds = new Set([
    "santander", "bbva", "caixabank", "sabadell", "bankinter",
    "unicaja", "kutxabank", "ibercaja", "abanca", "cajamar", "otros", "bde", "hub",
  ]);
  if (bankIds.has(id)) {
    return {
      lastUpdated: banksData._meta?.last_updated ?? "",
      autoRefresh: banksData._meta?.auto_refresh ?? false,
    };
  }
  if (id === "ecb")
    return {
      lastUpdated: ecbData._meta?.last_updated ?? "",
      autoRefresh: ecbData._meta?.auto_refresh ?? false,
    };
  if (id === "state")
    return {
      lastUpdated: stateData._meta?.last_updated ?? "",
      autoRefresh: stateData._meta?.auto_refresh ?? false,
    };
  if (id === "bond_belt")
    return {
      lastUpdated: bondsData._meta?.last_updated ?? "",
      autoRefresh: bondsData._meta?.auto_refresh ?? false,
    };
  if (id === "menages")
    return {
      lastUpdated: householdsData._meta?.last_updated ?? "",
      autoRefresh: householdsData._meta?.auto_refresh ?? false,
    };
  if (id === "entreprises")
    return {
      lastUpdated: firmsData._meta?.last_updated ?? "",
      autoRefresh: firmsData._meta?.auto_refresh ?? false,
    };
  return null;
}

function fmt(n: number, unit = "B€"): string {
  if (n >= 1000) return `${(n / 1000).toFixed(2)} T${unit.slice(1)}`;
  if (n >= 1) return `${n.toFixed(n < 10 ? 1 : 0)} ${unit}`;
  return `${(n * 1000).toFixed(0)} M${unit.slice(1)}`;
}

function rowsForEntity(id: string): { title: string; rows: Row[] } | null {
  // Individual banks
  const bank = banksData.banks.find((b) => b.id === id);
  if (bank) {
    const rows: Row[] = [
      { label: "Total des actifs", value: fmt(bank.total_assets_bn_eur) },
    ];
    if (bank.cet1_bn_eur !== undefined)
      rows.push({ label: "Capital CET1", value: fmt(bank.cet1_bn_eur) });
    if (bank.cet1_ratio_pct !== undefined)
      rows.push({ label: "Ratio CET1", value: `${bank.cet1_ratio_pct}%` });
    if (bank.net_income_2024_bn_eur !== undefined)
      rows.push({
        label: "Bénéfice net 2024",
        value: fmt(bank.net_income_2024_bn_eur),
      });
    if (bank.employees)
      rows.push({
        label: "Employés",
        value: bank.employees.toLocaleString("fr-FR"),
      });
    const holdings = bondHoldings(bank.id);
    if (holdings !== undefined) {
      rows.push({
        label: "Obligations d'État détenues",
        value: fmt(holdings),
      });
    }
    return { title: bank.name, rows };
  }

  if (id === "hub") {
    return {
      title: "Capital agrégé",
      rows: [
        { label: "CET1 total (11 banques)", value: fmt(AGGREGATE_CET1_BN_EUR) },
        { label: "Actifs totaux (11 banques)", value: fmt(AGGREGATE_BANK_ASSETS_BN_EUR) },
        {
          label: "Ratio CET1 moyen",
          value: `${((AGGREGATE_CET1_BN_EUR / AGGREGATE_BANK_ASSETS_BN_EUR) * 100).toFixed(1)}%`,
        },
        {
          label: "Levier théorique (≈12,5×)",
          value: fmt(AGGREGATE_CET1_BN_EUR * 12.5),
        },
      ],
    };
  }

  if (id === "ecb") {
    const bs = ecbData.eurosystem_balance_sheet;
    return {
      title: "Banque centrale européenne",
      rows: [
        { label: "Total du bilan", value: fmt(bs.total_assets_bn_eur) },
        { label: "APP + PEPP", value: fmt(bs.assets.securities_held_for_monetary_policy_bn_eur) },
        {
          label: "Réserves bancaires",
          value: fmt(bs.liabilities.bank_reserves_at_eurosystem_bn_eur),
        },
        {
          label: "Billets en circulation",
          value: fmt(bs.liabilities.banknotes_in_circulation_bn_eur),
        },
        { label: "Taux de dépôt", value: `${ecbData.policy_rates_pct.deposit_facility}%` },
        { label: "Taux MRO", value: `${ecbData.policy_rates_pct.main_refinancing_operations}%` },
        { label: "M3 zone euro", value: fmt(ecbData.monetary_aggregates_eurozone.m3_bn_eur) },
        ...(ecbData.hicp_eurozone_annual_pct
          ? [{ label: "Inflation HICP (a/a)", value: `${ecbData.hicp_eurozone_annual_pct.hicp_annual_pct}%` }]
          : []),
      ],
    };
  }

  if (id === "state") {
    const d = stateData.debt;
    const f = stateData.annual_flows;
    return {
      title: "État espagnol",
      rows: [
        { label: "Dette publique", value: fmt(d.total_public_debt_bn_eur) },
        { label: "Dette / PIB", value: `${d.debt_to_gdp_pct}%` },
        { label: "Recettes fiscales", value: `${fmt(f.total_tax_revenue_bn_eur)}/an` },
        { label: "Dépenses publiques", value: `${fmt(f.total_spending_bn_eur)}/an` },
        { label: "Déficit", value: `${fmt(f.deficit_bn_eur)} (${f.deficit_to_gdp_pct}% PIB)` },
        { label: "Intérêts sur la dette", value: `${fmt(f.breakdown_spending.interest_on_debt_bn_eur)}/an` },
        { label: "PIB", value: fmt(stateData.gdp_bn_eur) },
      ],
    };
  }

  if (id === "bond_belt") {
    const h = bondsData.spanish_sovereign_debt.holdings_by_holder;
    return {
      title: "Obligations d'État espagnol",
      rows: [
        { label: "Total encours", value: fmt(bondsData.spanish_sovereign_debt.total_outstanding_bn_eur) },
        { label: "Détenu par l'Eurosystème (QE)", value: fmt(h.eurosystem_apppepp_bn_eur) },
        { label: "Détenu par banques espagnoles", value: fmt(h.spanish_commercial_banks_bn_eur) },
        { label: "Détenu par investisseurs étrangers", value: fmt(h.foreign_investors_bn_eur) },
        { label: "Détenu par assurance + retraites", value: fmt(h.spanish_insurance_and_pensions_bn_eur) },
        { label: "Rendement 10 ans Espagne", value: `${bondsData.spanish_sovereign_debt.avg_yield_10y_pct}%` },
        ...(bondsData.german_bund_10y_pct !== undefined
          ? [{ label: "Rendement 10 ans Allemagne (réf.)", value: `${bondsData.german_bund_10y_pct}%` }]
          : []),
        ...(bondsData.spread_spain_germany_10y_bps !== undefined
          ? [{ label: "Spread Espagne-Bund", value: `${bondsData.spread_spain_germany_10y_bps} pb` }]
          : []),
      ],
    };
  }

  if (id === "menages") {
    const h = householdsData.annual_flows;
    const s = householdsData.stocks;
    return {
      title: "Ménages espagnols",
      rows: [
        {
          label: "Nombre de ménages",
          value: `${householdsData.aggregate.number_of_households_millions} M`,
        },
        { label: "Revenu disponible", value: `${fmt(h.total_disposable_income_bn_eur)}/an` },
        { label: "Consommation", value: `${fmt(h.to_consumption_bn_eur)}/an` },
        { label: "Taux d'épargne", value: `${h.savings_rate_pct}%` },
        { label: "Patrimoine total", value: fmt(s.total_wealth_bn_eur) },
        { label: "Dette (hypothécaire + conso)", value: fmt(s.total_debt_bn_eur) },
        ...(householdsData.unemployment_rate_pct
          ? [{ label: "Taux de chômage", value: `${householdsData.unemployment_rate_pct.rate_pct}%` }]
          : []),
      ],
    };
  }

  if (id === "entreprises") {
    const f = firmsData.annual_flows;
    const s = firmsData.stocks;
    return {
      title: "Entreprises espagnoles",
      rows: [
        {
          label: "Nombre d'entreprises",
          value: `${firmsData.aggregate.number_of_firms_millions} M`,
        },
        { label: "Valeur ajoutée brute", value: `${fmt(f.gross_value_added_bn_eur)}/an` },
        { label: "Investissement", value: `${fmt(f.to_investment_bn_eur)}/an` },
        { label: "Dette bancaire", value: fmt(s.total_bank_debt_bn_eur) },
        { label: "Obligations en circulation", value: fmt(s.corporate_bonds_outstanding_bn_eur) },
        { label: "Capitalisation boursière", value: fmt(s.equity_market_cap_spanish_listed_bn_eur) },
      ],
    };
  }

  return null;
}

/**
 * Floating panel on the right side showing real-data figures for the
 * currently-focused entity. Appears only when an entity is selected.
 */
export function DataPanel() {
  const activeEntity = useSceneStore((s) => s.activeEntity);
  const focusMode = useSceneStore((s) => s.focusMode);

  if (focusMode === "overview" || !activeEntity) return null;

  const entity = getEntity(activeEntity);
  const content = rowsForEntity(activeEntity);
  if (!content || !entity) return null;

  return (
    <div
      className="absolute top-4 right-4 font-sans text-white"
      style={{
        backgroundColor: "rgba(15, 18, 25, 0.85)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "14px 16px",
        width: 300,
        maxHeight: "calc(100vh - 2rem)",
        overflowY: "auto",
      }}
    >
      <div className="flex items-center mb-3">
        <span
          className="inline-block w-3 h-3 mr-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: entity.color }}
        />
        <div className="font-bold uppercase tracking-wider text-sm">
          {content.title}
        </div>
      </div>
      <table className="w-full" style={{ fontSize: 12 }}>
        <tbody>
          {content.rows.map((r) => (
            <tr key={r.label}>
              <td
                className="py-1 pr-2"
                style={{ opacity: 0.65, verticalAlign: "top" }}
              >
                {r.label}
              </td>
              <td
                className="py-1 text-right font-mono"
                style={{ color: "#ffd97a" }}
              >
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(() => {
        const fresh = freshnessForEntity(activeEntity);
        if (!fresh) return null;
        return (
          <div
            className="mt-3 pt-2 text-[10px] opacity-50 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span>MAJ : {fresh.lastUpdated}</span>
            <span
              style={{
                color: fresh.autoRefresh ? "#5dd39e" : "#c98a4a",
                fontWeight: 600,
              }}
            >
              {fresh.autoRefresh ? "● live" : "● manuel"}
            </span>
          </div>
        );
      })()}
    </div>
  );
}
