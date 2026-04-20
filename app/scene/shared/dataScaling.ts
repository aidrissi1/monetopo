import banksData from "../../data/banks.json";
import stateData from "../../data/state.json";
import householdsData from "../../data/households.json";
import firmsData from "../../data/firms.json";
import bondsData from "../../data/bonds.json";
import {
  SATELLITE_RADIUS,
  HUB_RADIUS,
  STATE_PIPE_RADIUS,
  BOND_BELT_TUBE,
  BOX_SIZE,
} from "./geometry";

interface Bank {
  id: string;
  total_assets_bn_eur: number;
  cet1_bn_eur?: number;
  cet1_ratio_pct?: number;
  net_income_2024_bn_eur?: number;
  employees?: number;
  type: string;
}

/**
 * Compute per-bank sphere radii scaled to their total assets.
 * Uses √-scaling so Santander (€1.8T) isn't 26× Kutxabank (€70B);
 * range clamped to [MIN_R, MAX_R] to keep geometry readable.
 */
const MIN_R = 0.38;
const MAX_R = 0.95;

function sqrtScale(
  value: number,
  minValue: number,
  maxValue: number,
  minOut: number,
  maxOut: number
): number {
  const sqrtMin = Math.sqrt(minValue);
  const sqrtMax = Math.sqrt(maxValue);
  const sqrtV = Math.sqrt(value);
  const t = (sqrtV - sqrtMin) / (sqrtMax - sqrtMin);
  return minOut + t * (maxOut - minOut);
}

// Exclude BdE (national central bank) from the commercial-bank scaling pool.
const commercialBanks: Bank[] = banksData.banks.filter(
  (b) => b.type !== "national_central_bank"
);
const assetsMin = Math.min(...commercialBanks.map((b) => b.total_assets_bn_eur));
const assetsMax = Math.max(...commercialBanks.map((b) => b.total_assets_bn_eur));

/** Radius per bank, keyed by bank id. */
export const BANK_RADIUS: Record<string, number> = Object.fromEntries(
  banksData.banks.map((b) => {
    // BdE gets a modest radius (not scaled to its €920B balance sheet — that
    // would dwarf everything; its role is structural not operational).
    if (b.type === "national_central_bank") return [b.id, SATELLITE_RADIUS];
    const r = sqrtScale(b.total_assets_bn_eur, assetsMin, assetsMax, MIN_R, MAX_R);
    return [b.id, r];
  })
);

/** Lookup helper with SATELLITE_RADIUS fallback. */
export function bankRadius(id: string): number {
  return BANK_RADIUS[id] ?? SATELLITE_RADIUS;
}

/** Raw data access for tooltips / interior scenes. */
export function bankData(id: string): Bank | undefined {
  return banksData.banks.find((b) => b.id === id) as Bank | undefined;
}

// ─── Aggregate numbers ────────────────────────────────────────────────

/** Sum of commercial bank CET1 capital — what the hub sphere represents. */
export const AGGREGATE_CET1_BN_EUR = commercialBanks.reduce(
  (sum, b) => sum + (b.cet1_bn_eur ?? 0),
  0
);

/** Sum of commercial bank total assets. */
export const AGGREGATE_BANK_ASSETS_BN_EUR = commercialBanks.reduce(
  (sum, b) => sum + b.total_assets_bn_eur,
  0
);

// ─── Scaled geometry values (cached at module load) ───────────────────

/**
 * Hub radius scaled from aggregate CET1 capital.
 * Reference: ~€220B → 1.9 (the original default).
 */
export const HUB_RADIUS_SCALED = (() => {
  const REFERENCE_CET1 = 220;
  const scale = Math.sqrt(AGGREGATE_CET1_BN_EUR / REFERENCE_CET1);
  return HUB_RADIUS * scale;
})();

// ─── State flow pipe radii (scaled from annual flow magnitudes) ────────

/** Scale an annual flow magnitude (bn EUR) to a pipe radius. */
export function flowPipeRadius(flowBnEur: number): number {
  const REFERENCE_FLOW = 300;
  const MIN_R = 0.055;
  const MAX_R = 0.22;
  const t = Math.sqrt(flowBnEur / REFERENCE_FLOW);
  return Math.max(MIN_R, Math.min(MAX_R, STATE_PIPE_RADIUS * t));
}

export const TAX_HOUSEHOLDS_RADIUS = flowPipeRadius(
  stateData.annual_flows.tax_from_households_bn_eur
);
export const TAX_COMPANIES_RADIUS = flowPipeRadius(
  stateData.annual_flows.tax_from_companies_bn_eur
);
export const SPENDING_HOUSEHOLDS_RADIUS = flowPipeRadius(
  stateData.annual_flows.spending_to_households_bn_eur
);
export const SPENDING_COMPANIES_RADIUS = flowPipeRadius(
  stateData.annual_flows.spending_to_companies_bn_eur
);

// ─── Bond belt tube thickness scaled from total sovereign debt ────────

export const BOND_BELT_TUBE_SCALED = (() => {
  const REFERENCE_DEBT = 1600;
  const totalDebt = stateData.debt.total_public_debt_bn_eur;
  const scale = Math.sqrt(totalDebt / REFERENCE_DEBT);
  return BOND_BELT_TUBE * scale;
})();

// ─── Box sizes scaled from economic weight ────────────────────────────

/**
 * Box side length. Ménages scales with household disposable income;
 * Entreprises scales with firm GVA. Scaled so the two remain roughly
 * comparable in visual weight.
 */
function boxSideFromFlow(annualFlowBnEur: number): number {
  const REFERENCE = 900;
  const scale = Math.sqrt(annualFlowBnEur / REFERENCE);
  return BOX_SIZE[0] * Math.max(0.8, Math.min(1.25, scale));
}

export const HOUSEHOLDS_BOX_SIDE = boxSideFromFlow(
  householdsData.annual_flows.total_disposable_income_bn_eur
);
export const COMPANIES_BOX_SIDE = boxSideFromFlow(
  firmsData.annual_flows.gross_value_added_bn_eur
);

// ─── Per-bank sovereign bond holdings → belt branch thickness ──────────

const PER_BANK_BONDS: Record<string, number> = Object.fromEntries(
  Object.entries(bondsData._holdings_by_bank_approximate_bn_eur)
    .filter(([k, v]) => !k.startsWith("_") && typeof v === "number")
) as Record<string, number>;

const MIN_BRANCH_R = 0.04;
const MAX_BRANCH_R = 0.20;

const _holdingsValues = Object.entries(PER_BANK_BONDS)
  .filter(([k]) => !k.startsWith("_"))
  .map(([, v]) => v);
const _holdingsMin = Math.min(..._holdingsValues);
const _holdingsMax = Math.max(..._holdingsValues);

export function bondBranchRadius(bankId: string): number {
  const h = PER_BANK_BONDS[bankId];
  if (!h) return MIN_BRANCH_R;
  const t = (Math.sqrt(h) - Math.sqrt(_holdingsMin)) /
    (Math.sqrt(_holdingsMax) - Math.sqrt(_holdingsMin));
  return MIN_BRANCH_R + t * (MAX_BRANCH_R - MIN_BRANCH_R);
}

export function bondHoldings(bankId: string): number | undefined {
  return PER_BANK_BONDS[bankId];
}
