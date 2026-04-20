#!/usr/bin/env node
/**
 * Refresh live data from public APIs into app/data/*.json.
 *
 * Sources (all free, no auth):
 *  - ECB SDW (Statistical Data Warehouse) — rates, balance sheet, yields, M3, HICP
 *  - Eurostat — GDP, public debt, unemployment
 *
 * Run manually:    node scripts/refresh-data.mjs
 * Run via cron:    .github/workflows/refresh-data.yml (daily)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "app", "data");
const TODAY = new Date().toISOString().slice(0, 10);

// ─── ECB SDW (SDMX-JSON) helper ────────────────────────────────────────
// API docs: https://data.ecb.europa.eu/help/api/overview
async function fetchEcbSeries(flowRef, seriesKey) {
  const url =
    `https://data-api.ecb.europa.eu/service/data/${flowRef}/${seriesKey}` +
    `?format=jsondata&lastNObservations=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ECB SDW ${flowRef}/${seriesKey}: ${res.status}`);
  const json = await res.json();
  const series = Object.values(json.dataSets[0].series)[0];
  const obs = Object.values(series.observations)[0];
  const value = obs[0];
  const timeDim = json.structure.dimensions.observation[0].values;
  const timeKey = Object.keys(series.observations)[0];
  const date = timeDim[Number(timeKey)].id;
  return { value, date };
}

// ─── Eurostat (JSON-stat 2.0) helper ───────────────────────────────────
// API docs: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data
//
// JSON-stat value object is keyed by a linear index into the full dimension
// cube (row-major over json.id / json.size). To get a specific cell we must
// compute the linear index from positions in every dimension, not just time.
async function fetchEurostat(dataset, params) {
  const qs = new URLSearchParams(params).toString();
  const url =
    `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?${qs}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Eurostat ${dataset}: ${res.status}`);
  const json = await res.json();

  const dimIds = json.id; // dimension names in row-major order
  const dimSizes = json.size;
  const timeDimIdx = dimIds.indexOf("time");
  if (timeDimIdx < 0) throw new Error(`Eurostat ${dataset}: no time dim`);

  // Row-major strides: stride[i] = product of sizes[i+1..n-1]
  const strides = new Array(dimSizes.length);
  let s = 1;
  for (let i = dimSizes.length - 1; i >= 0; i--) {
    strides[i] = s;
    s *= dimSizes[i];
  }

  // All non-time dims should have been filtered down to size 1 by the URL
  // params. If any remain > 1, position 0 is our best-effort pick (typically
  // the first / canonical value). This is honest — document it.
  const pos = new Array(dimSizes.length).fill(0);

  // Sort time periods descending so we start from the most recent.
  const timeIndex = json.dimension.time.category.index;
  const periods = Object.entries(timeIndex).sort(
    ([, a], [, b]) => Number(b) - Number(a)
  );

  for (const [period, idx] of periods) {
    pos[timeDimIdx] = Number(idx);
    let linear = 0;
    for (let i = 0; i < pos.length; i++) linear += pos[i] * strides[i];
    const v = json.value[String(linear)];
    if (v !== null && v !== undefined) return { value: v, date: period };
  }
  throw new Error(`Eurostat ${dataset}: no non-null observation`);
}

// ─── ECB fetchers ──────────────────────────────────────────────────────

async function fetchEcbPolicyRates() {
  const deposit = await fetchEcbSeries("FM", "D.U2.EUR.4F.KR.DFR.LEV");
  const mro = await fetchEcbSeries("FM", "D.U2.EUR.4F.KR.MRR_RT.LEV");
  const marginal = await fetchEcbSeries("FM", "D.U2.EUR.4F.KR.MLFR.LEV");
  return {
    deposit_facility: deposit.value,
    main_refinancing_operations: mro.value,
    marginal_lending_facility: marginal.value,
    as_of: deposit.date,
  };
}

/**
 * ECB consolidated balance sheet total assets. The clean weekly series is
 * BSI.M.U2.N.R.LT0000.A1.Z5.0000.Z01.E (Eurosystem total assets, monthly).
 * Falls back to a longer flowRef variant if the short form rejects.
 */
async function fetchEcbBalanceSheet() {
  const candidates = [
    ["BSI", "M.U2.N.R.LT0000.A1.Z5.0000.Z01.E"],
    ["BSI", "M.U2.N.R.A00.A.1.U2.0000.Z01.E"],
    ["ILM", "W.U2.C.A000000.U2.EUR"],
  ];
  let lastErr;
  for (const [ref, key] of candidates) {
    try {
      const r = await fetchEcbSeries(ref, key);
      return {
        total_assets_bn_eur: Math.round(r.value / 1_000_000),
        as_of: r.date,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/**
 * Eurozone M3 broad money. BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E = outstanding
 * amount, millions of EUR. Convert to billions.
 */
async function fetchEcbM3() {
  const r = await fetchEcbSeries("BSI", "M.U2.Y.V.M30.X.1.U2.2300.Z01.E");
  return {
    m3_bn_eur: Math.round(r.value / 1_000),
    as_of: r.date,
  };
}

/** Eurozone HICP headline, annual rate of change. */
async function fetchEcbHicp() {
  const r = await fetchEcbSeries("ICP", "M.U2.N.000000.4.ANR");
  return { hicp_annual_pct: Number(r.value.toFixed(2)), as_of: r.date };
}

async function fetchSpainBond10y() {
  const r = await fetchEcbSeries("IRS", "M.ES.L.L40.CI.0000.EUR.N.Z");
  return { yield_pct: Number(r.value.toFixed(2)), as_of: r.date };
}

async function fetchGermanyBond10y() {
  const r = await fetchEcbSeries("IRS", "M.DE.L.L40.CI.0000.EUR.N.Z");
  return { yield_pct: Number(r.value.toFixed(2)), as_of: r.date };
}

// ─── Eurostat fetchers ─────────────────────────────────────────────────

/** Spain unemployment rate, monthly, seasonally adjusted, % of active pop. */
async function fetchSpainUnemployment() {
  const r = await fetchEurostat("une_rt_m", {
    geo: "ES",
    sex: "T",
    age: "TOTAL",
    s_adj: "SA",
    unit: "PC_ACT",
  });
  return { rate_pct: Number(r.value.toFixed(1)), as_of: r.date };
}

/** Spain GDP (nominal, MIO_EUR, annual). */
async function fetchSpainGdp() {
  const r = await fetchEurostat("nama_10_gdp", {
    geo: "ES",
    unit: "CP_MEUR",
    na_item: "B1GQ",
  });
  return { gdp_bn_eur: Math.round(r.value / 1_000), as_of: r.date };
}

/** Spain general-government consolidated gross debt (Maastricht), MIO_EUR. */
async function fetchSpainPublicDebt() {
  const r = await fetchEurostat("gov_10q_ggdebt", {
    geo: "ES",
    unit: "MIO_EUR",
    sector: "S13",
    na_item: "GD",
  });
  return { debt_bn_eur: Math.round(r.value / 1_000), as_of: r.date };
}

// ─── JSON read/write helpers ───────────────────────────────────────────

function readJson(name) {
  return JSON.parse(readFileSync(path.join(DATA_DIR, name), "utf-8"));
}
function writeJson(name, obj) {
  writeFileSync(
    path.join(DATA_DIR, name),
    JSON.stringify(obj, null, 2) + "\n"
  );
}

async function tryUpdate(label, fn) {
  try {
    const r = await fn();
    console.log(`  ✓ ${label}`);
    return r;
  } catch (e) {
    console.error(`  ! ${label} failed: ${e.message}`);
    return null;
  }
}

// ─── Update ecb.json ───────────────────────────────────────────────────

async function updateEcb() {
  console.log("→ ecb.json");
  const ecb = readJson("ecb.json");

  const rates = await tryUpdate("policy rates", fetchEcbPolicyRates);
  if (rates) ecb.policy_rates_pct = rates;

  const bs = await tryUpdate("balance sheet", fetchEcbBalanceSheet);
  if (bs) {
    ecb.eurosystem_balance_sheet.total_assets_bn_eur = bs.total_assets_bn_eur;
    ecb._last_balance_sheet_date = bs.as_of;
  }

  const m3 = await tryUpdate("M3", fetchEcbM3);
  if (m3) {
    ecb.monetary_aggregates_eurozone.m3_bn_eur = m3.m3_bn_eur;
    ecb._last_m3_date = m3.as_of;
  }

  const hicp = await tryUpdate("HICP", fetchEcbHicp);
  if (hicp) ecb.hicp_eurozone_annual_pct = hicp;

  ecb._meta = ecb._meta || {};
  ecb._meta.last_updated = TODAY;
  ecb._meta.auto_refresh = true;
  writeJson("ecb.json", ecb);
}

// ─── Update bonds.json ─────────────────────────────────────────────────

async function updateBonds() {
  console.log("→ bonds.json");
  const bonds = readJson("bonds.json");

  const es = await tryUpdate("Spain 10Y yield", fetchSpainBond10y);
  const de = await tryUpdate("Germany 10Y yield", fetchGermanyBond10y);

  if (es) bonds.spanish_sovereign_debt.avg_yield_10y_pct = es.yield_pct;
  if (de) bonds.german_bund_10y_pct = de.yield_pct;
  if (es && de) {
    bonds.spread_spain_germany_10y_bps = Math.round((es.yield_pct - de.yield_pct) * 100);
  }

  bonds._meta = bonds._meta || {};
  bonds._meta.last_updated = TODAY;
  bonds._meta.auto_refresh = true;
  writeJson("bonds.json", bonds);
}

// ─── Update state.json ─────────────────────────────────────────────────

async function updateState() {
  console.log("→ state.json");
  const state = readJson("state.json");

  const gdp = await tryUpdate("Spain GDP", fetchSpainGdp);
  const debt = await tryUpdate("Spain public debt", fetchSpainPublicDebt);

  if (gdp) state.gdp_bn_eur = gdp.gdp_bn_eur;
  if (debt) state.debt.total_public_debt_bn_eur = debt.debt_bn_eur;
  if (gdp && debt) {
    state.debt.debt_to_gdp_pct = Number(
      ((debt.debt_bn_eur / gdp.gdp_bn_eur) * 100).toFixed(1)
    );
  }

  state._meta = state._meta || {};
  state._meta.last_updated = TODAY;
  state._meta.auto_refresh = true;
  writeJson("state.json", state);
}

// ─── Update households.json (unemployment) ─────────────────────────────

async function updateHouseholds() {
  console.log("→ households.json");
  const h = readJson("households.json");

  const un = await tryUpdate("Spain unemployment", fetchSpainUnemployment);
  if (un) h.unemployment_rate_pct = un;

  h._meta = h._meta || {};
  h._meta.last_updated = TODAY;
  h._meta.auto_refresh = true;
  writeJson("households.json", h);
}

// Stamp files we don't auto-refresh yet.
function stampManual(name) {
  const data = readJson(name);
  data._meta = data._meta || {};
  data._meta.last_updated = data._meta.last_updated || TODAY;
  data._meta.auto_refresh = false;
  writeJson(name, data);
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log(`Refresh data — ${TODAY}`);
  await updateEcb();
  await updateBonds();
  await updateState();
  await updateHouseholds();
  stampManual("banks.json");
  stampManual("firms.json");
  stampManual("nbfi.json");
  console.log("✔ done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
