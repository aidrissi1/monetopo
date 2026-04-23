#!/usr/bin/env node
/**
 * validate-data.mjs
 *
 * Runs accounting identities + cross-file consistency checks on the JSON
 * data files. These are real macro identities from national-accounts
 * methodology — if a check fails, either the data or the real-world
 * claim is wrong.
 *
 * Usage:  npm run test:data
 * Exit code 0 = all PASS, 1 = at least one FAIL.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "app", "data");

/* ─── Tolerance for "approximately equal" (percent of the larger value) ──── */
const TOL_STRICT = 0.01; // cross-file matches should be exact (within 1%)
const TOL_SOFT = 0.10;   // within-file sums allow for rounding + residual cats

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
}
function approxEq(a, b, tol) {
  const larger = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / larger <= tol;
}
async function readJson(file) {
  return JSON.parse(await readFile(join(DATA, file), "utf8"));
}

/* ─── Load ─────────────────────────────────────────────────────────────── */
const households = await readJson("households.json");
const firms = await readJson("firms.json");
const state = await readJson("state.json");
const banks = await readJson("banks.json");
const bonds = await readJson("bonds.json");
const ecb = await readJson("ecb.json");
const allocators = await readJson("allocators.json");
const ibexFirms = await readJson("ibex-firms.json");
const holdings = await readJson("holdings.json");
const nbfi = await readJson("nbfi.json");
const euFiscal = await readJson("eu-fiscal.json");
const supervisors = await readJson("supervisors.json");
const ratingAgencies = await readJson("rating-agencies.json");
const paymentRails = await readJson("payment-rails.json");
const qeTransmission = await readJson("qe-transmission.json");

/* ─── Within-file identities ───────────────────────────────────────────── */

// Households: disposition of DISPOSABLE income = consumption + savings
// (the canonical national-accounts identity after taxes are already netted out)
{
  const af = households.annual_flows;
  const disposition = af.to_consumption_bn_eur + af.to_savings_bn_eur;
  record(
    "households · consumption + savings = disposable income",
    approxEq(disposition, af.total_disposable_income_bn_eur, TOL_SOFT),
    `c+s(${disposition}) vs disposable(${af.total_disposable_income_bn_eur})`,
  );
}

// Households: gross income streams > disposable (taxes + loan_repayment consume
// the difference). Not a strict equality due to SS contributions accounting.
{
  const af = households.annual_flows;
  const gross =
    af.from_wages_bn_eur +
    af.from_self_employment_bn_eur +
    af.from_state_transfers_bn_eur +
    af.from_financial_income_bn_eur;
  record(
    "households · gross income streams > disposable (taxes consumed)",
    gross > af.total_disposable_income_bn_eur,
    `gross(${gross}) > disposable(${af.total_disposable_income_bn_eur})`,
  );
}

// Households: savings rate = savings / disposable income
{
  const af = households.annual_flows;
  const computed = (af.to_savings_bn_eur / af.total_disposable_income_bn_eur) * 100;
  record(
    "households · savings rate matches computed",
    approxEq(computed, af.savings_rate_pct, TOL_SOFT),
    `stated ${af.savings_rate_pct}% vs computed ${computed.toFixed(1)}%`,
  );
}

// State: taxes → tax_from_households + tax_from_companies
{
  const af = state.annual_flows;
  const sum = af.tax_from_households_bn_eur + af.tax_from_companies_bn_eur;
  record(
    "state · tax_from_(h + c) ≈ total_tax_revenue",
    approxEq(sum, af.total_tax_revenue_bn_eur, TOL_SOFT),
    `Σ(${sum}) vs total(${af.total_tax_revenue_bn_eur})`,
  );
}

// State: breakdown_tax components sum = total_tax_revenue (SS lives separately)
{
  const af = state.annual_flows;
  const bd = af.breakdown_tax;
  if (bd) {
    const sum =
      (bd.income_tax_irpf_bn_eur ?? 0) +
      (bd.corporate_tax_bn_eur ?? 0) +
      (bd.vat_iva_bn_eur ?? 0) +
      (bd.other_indirect_taxes_bn_eur ?? 0);
    record(
      "state · Σ breakdown_tax == total_tax_revenue",
      approxEq(sum, af.total_tax_revenue_bn_eur, TOL_SOFT),
      `Σ breakdown(${sum}) vs total_tax_revenue(${af.total_tax_revenue_bn_eur})`,
    );
  }
}

// State: total_revenue = taxes + SS + non_tax (the canonical general-gov revenue line)
{
  const af = state.annual_flows;
  const computed =
    af.total_tax_revenue_bn_eur +
    af.social_security_contributions_bn_eur +
    af.non_tax_revenue_bn_eur;
  record(
    "state · total_revenue = tax + SS + non_tax",
    approxEq(computed, af.total_revenue_bn_eur, TOL_SOFT),
    `stated €${af.total_revenue_bn_eur} B vs computed €${computed} B`,
  );
}

// State: deficit = spending - total_revenue (full general-gov revenue, not just taxes)
{
  const af = state.annual_flows;
  const computedDeficit = af.total_spending_bn_eur - af.total_revenue_bn_eur;
  record(
    "state · deficit = spending − total_revenue",
    approxEq(computedDeficit, af.deficit_bn_eur, TOL_SOFT),
    `stated €${af.deficit_bn_eur} B vs computed €${computedDeficit} B`,
  );
}

// State: debt-to-GDP
{
  const computed = (state.debt.total_public_debt_bn_eur / state.gdp_bn_eur) * 100;
  record(
    "state · debt/GDP matches stated",
    approxEq(computed, state.debt.debt_to_gdp_pct, TOL_SOFT),
    `stated ${state.debt.debt_to_gdp_pct}% vs computed ${computed.toFixed(1)}%`,
  );
}

// State: debt holders sum ≈ total public debt
{
  const d = state.debt;
  const sum =
    d.held_by_eurosystem_bn_eur +
    d.held_by_spanish_banks_bn_eur +
    d.held_by_foreign_investors_bn_eur +
    d.held_by_insurance_and_pensions_bn_eur +
    d.held_by_households_and_other_bn_eur;
  record(
    "state · Σ debt holders ≈ total public debt",
    approxEq(sum, d.total_public_debt_bn_eur, TOL_SOFT + 0.02),
    `Σ holders(${sum}) vs total(${d.total_public_debt_bn_eur})`,
  );
}

/* ─── Cross-file identities (the real-world closed loops) ─────────────── */

// Wages: firms pay = households receive
{
  const firmsWages = firms.annual_flows.to_wages_bn_eur;
  const householdsWages = households.annual_flows.from_wages_bn_eur;
  record(
    "CROSS · firms.to_wages == households.from_wages",
    approxEq(firmsWages, householdsWages, TOL_STRICT),
    `firms(€${firmsWages}) vs h'holds(€${householdsWages})`,
  );
}

// Taxes on households: state revenue = households outflow
{
  const stateRcv = state.annual_flows.tax_from_households_bn_eur;
  const hhPaid = households.annual_flows.to_taxes_bn_eur;
  record(
    "CROSS · state.tax_from_h == households.to_taxes",
    approxEq(stateRcv, hhPaid, TOL_STRICT),
    `state receives(€${stateRcv}) vs h'holds pay(€${hhPaid})`,
  );
}

// Taxes on firms: state revenue = firms outflow
{
  const stateRcv = state.annual_flows.tax_from_companies_bn_eur;
  const firmsPaid = firms.annual_flows.to_taxes_bn_eur;
  record(
    "CROSS · state.tax_from_c == firms.to_taxes",
    approxEq(stateRcv, firmsPaid, TOL_STRICT),
    `state receives(€${stateRcv}) vs firms pay(€${firmsPaid})`,
  );
}

// State transfers to households: state outflow = households inflow
{
  const stateOut = state.annual_flows.spending_to_households_bn_eur;
  const hhIn = households.annual_flows.from_state_transfers_bn_eur;
  record(
    "CROSS · state.spending_to_h == households.from_state_transfers",
    approxEq(stateOut, hhIn, TOL_STRICT),
    `state sends(€${stateOut}) vs h'holds receive(€${hhIn})`,
  );
}

// Public procurement: state.breakdown.public_procurement ↔ firms.public_procurement_revenue
{
  const stateOut = state.annual_flows.breakdown_spending?.public_procurement_bn_eur;
  const firmsIn = firms.annual_flows.public_procurement_revenue_bn_eur;
  if (stateOut !== undefined && firmsIn !== undefined) {
    record(
      "CROSS · state.public_procurement == firms.public_procurement_revenue",
      approxEq(stateOut, firmsIn, TOL_STRICT),
      `state spends(€${stateOut}) vs firms receive(€${firmsIn})`,
    );
  }
}

/* ─── Sanity bounds on ratios ─────────────────────────────────────────── */

// Savings rate is in plausible 0-25% window (Eurostat historical)
record(
  "sanity · savings_rate in [0, 25]%",
  households.annual_flows.savings_rate_pct >= 0 &&
    households.annual_flows.savings_rate_pct <= 25,
  `${households.annual_flows.savings_rate_pct}%`,
);

// Debt-to-GDP in plausible range for advanced economies
record(
  "sanity · debt_to_gdp in [30, 200]%",
  state.debt.debt_to_gdp_pct >= 30 && state.debt.debt_to_gdp_pct <= 200,
  `${state.debt.debt_to_gdp_pct}%`,
);

// Household leverage: debt should be << wealth for aggregate
{
  const ratio =
    households.stocks.total_wealth_bn_eur / households.stocks.total_debt_bn_eur;
  record(
    "sanity · h'holds wealth/debt ratio > 3",
    ratio > 3,
    `${ratio.toFixed(1)}×`,
  );
}

/* ─── Bonds ↔ State: debt-holder mapping (same numbers must show up on both sides) ── */
{
  const b = bonds.spanish_sovereign_debt.holdings_by_holder;
  const s = state.debt;
  const pairs = [
    ["eurosystem_apppepp_bn_eur", "held_by_eurosystem_bn_eur", "eurosystem"],
    ["spanish_commercial_banks_bn_eur", "held_by_spanish_banks_bn_eur", "spanish banks"],
    ["foreign_investors_bn_eur", "held_by_foreign_investors_bn_eur", "foreign investors"],
    ["spanish_insurance_and_pensions_bn_eur", "held_by_insurance_and_pensions_bn_eur", "insurance/pensions"],
    ["spanish_households_and_other_bn_eur", "held_by_households_and_other_bn_eur", "h'holds + other"],
  ];
  for (const [bKey, sKey, label] of pairs) {
    record(
      `CROSS · bonds[${label}] == state.debt[${label}]`,
      approxEq(b[bKey], s[sKey], TOL_STRICT),
      `bonds(€${b[bKey]}) vs state(€${s[sKey]})`,
    );
  }
}

// Bonds: Σ holdings ≈ total outstanding
{
  const b = bonds.spanish_sovereign_debt;
  const holders = b.holdings_by_holder;
  const sum = Object.values(holders).reduce(
    (s, v) => s + (typeof v === "number" ? v : 0),
    0,
  );
  record(
    "bonds · Σ holdings == total_outstanding",
    approxEq(sum, b.total_outstanding_bn_eur, TOL_STRICT),
    `Σ holders(${sum}) vs total(${b.total_outstanding_bn_eur})`,
  );
}

// State public debt ≥ bonds marketable-outstanding (non-marketable loans make up the gap)
{
  const stateTotal = state.debt.total_public_debt_bn_eur;
  const bondsTotal = bonds.spanish_sovereign_debt.total_outstanding_bn_eur;
  record(
    "CROSS · state.total_public_debt ≥ bonds.total_outstanding",
    stateTotal >= bondsTotal,
    `state(€${stateTotal}) vs bonds(€${bondsTotal}) — gap €${stateTotal - bondsTotal} is non-marketable`,
  );
}

/* ─── ECB balance sheet identity ──────────────────────────────────────── */
{
  const bs = ecb.eurosystem_balance_sheet;
  const assets = bs.assets;
  const sum =
    (assets.securities_held_for_monetary_policy_bn_eur ?? 0) +
    (assets.lending_to_euro_area_banks_bn_eur ?? 0) +
    (assets.gold_and_gold_receivables_bn_eur ?? 0) +
    (assets.foreign_currency_assets_bn_eur ?? 0) +
    (assets.other_assets_bn_eur ?? 0);
  record(
    "ecb · Σ asset components == total_assets",
    approxEq(sum, bs.total_assets_bn_eur, TOL_SOFT),
    `Σ(${sum}) vs total(${bs.total_assets_bn_eur})`,
  );
}
{
  const bs = ecb.eurosystem_balance_sheet.assets;
  const secSum =
    (bs.app_portfolio_bn_eur ?? 0) + (bs.pepp_portfolio_bn_eur ?? 0);
  record(
    "ecb · APP + PEPP ≤ total securities held for monetary policy",
    secSum <= bs.securities_held_for_monetary_policy_bn_eur,
    `APP+PEPP(${secSum}) vs total_sec(${bs.securities_held_for_monetary_policy_bn_eur})`,
  );
}

/* ─── Holdings → Allocators / Firms foreign-key integrity ────────────── */
{
  const allocSet = new Set(allocators.allocators.map((a) => a.id));
  const firmSet = new Set(ibexFirms.firms.map((f) => f.id));
  const bankSet = new Set(banks.banks.map((b) => b.id));
  const validTargets = new Set([...firmSet, ...bankSet]);

  let badAlloc = 0;
  let badTarget = 0;
  for (const h of holdings.holdings) {
    if (!allocSet.has(h.allocator_id)) badAlloc++;
    if (!validTargets.has(h.target_id)) badTarget++;
  }
  record(
    "holdings · every allocator_id exists in allocators.json",
    badAlloc === 0,
    `${badAlloc} unknown allocator references of ${holdings.holdings.length}`,
  );
  record(
    "holdings · every target_id exists in ibex-firms OR banks",
    badTarget === 0,
    `${badTarget} unknown target references of ${holdings.holdings.length}`,
  );
}

/* ─── QE transmission preset ratios sum ≈ 1 ───────────────────────────── */
for (const preset of qeTransmission.presets) {
  const r = preset.ratios;
  const sum = Object.values(r).reduce((s, v) => s + v, 0);
  record(
    `qe-transmission · preset "${preset.id}" ratios sum ≈ 1`,
    approxEq(sum, 1, TOL_SOFT),
    `sum = ${sum.toFixed(3)}`,
  );
}

/* ─── QE transmission presets flagged unverified (warning only) ───────── */
{
  const unverified = qeTransmission.presets.filter((p) => p.verified === false);
  record(
    "qe-transmission · all presets have verified flag",
    qeTransmission.presets.every((p) => typeof p.verified === "boolean"),
    `${unverified.length} of ${qeTransmission.presets.length} marked verified:false`,
  );
}

/* ─── Data metadata integrity (all 15 files) ──────────────────────────── */
for (const [name, f] of [
  ["households", households],
  ["firms", firms],
  ["state", state],
  ["banks", banks],
  ["bonds", bonds],
  ["ecb", ecb],
  ["allocators", allocators],
  ["ibex-firms", ibexFirms],
  ["holdings", holdings],
  ["nbfi", nbfi],
  ["eu-fiscal", euFiscal],
  ["supervisors", supervisors],
  ["rating-agencies", ratingAgencies],
  ["payment-rails", paymentRails],
  ["qe-transmission", qeTransmission],
]) {
  record(
    `meta · ${name}.json has sources[] cited`,
    Array.isArray(f._meta?.sources) && f._meta.sources.length > 0,
    `${f._meta?.sources?.length ?? 0} sources`,
  );
  record(
    `meta · ${name}.json has fiscal_year or as_of`,
    !!(f._meta?.fiscal_year || f._meta?.as_of),
    `${f._meta?.fiscal_year ?? f._meta?.as_of ?? "MISSING"}`,
  );
}

/* ─── Print report ────────────────────────────────────────────────────── */
const W = 62;
console.log("\n" + "═".repeat(W));
console.log("  DATA VALIDATION · real-world accounting identities");
console.log("═".repeat(W));

let passes = 0;
let fails = 0;
for (const r of results) {
  const badge = r.pass ? "  \x1b[32m✓ PASS\x1b[0m" : "  \x1b[31m✗ FAIL\x1b[0m";
  console.log(`${badge}  ${r.name}`);
  console.log(`          ${r.detail}`);
  if (r.pass) passes++;
  else fails++;
}

console.log("─".repeat(W));
console.log(`  ${passes} passing · ${fails} failing · ${results.length} total`);
console.log("═".repeat(W));

// If failures exist, explain WHAT needs to be fixed (data vs. model).
if (fails > 0) {
  console.log("\n  \x1b[33mReal data bugs to triage:\x1b[0m");
  for (const r of results) {
    if (!r.pass) {
      console.log(`   • ${r.name}`);
      console.log(`     ${r.detail}`);
    }
  }
  console.log();
}

process.exit(fails > 0 ? 1 : 0);
