#!/usr/bin/env node
/**
 * Refresh live data from public APIs into app/data/*.json.
 *
 * Sources (all free, no auth):
 *  - ECB SDW (Statistical Data Warehouse) — rates, balance sheet, yields
 *  - Eurostat — GDP, debt/GDP (future)
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

// ─── ECB SDW helper ────────────────────────────────────────────────────
// API docs: https://data.ecb.europa.eu/help/api/overview
// Returns the most recent numeric observation for a given series key.
async function fetchEcbSeries(flowRef, seriesKey) {
  const url =
    `https://data-api.ecb.europa.eu/service/data/${flowRef}/${seriesKey}` +
    `?format=jsondata&lastNObservations=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ECB SDW ${flowRef}/${seriesKey}: ${res.status}`);
  const json = await res.json();
  // SDMX-JSON parsing: dataSets[0].series[0:0:0:0:0:0].observations has {"N": [value, ...]}
  const series = Object.values(json.dataSets[0].series)[0];
  const obs = Object.values(series.observations)[0];
  const value = obs[0];
  const timeDim = json.structure.dimensions.observation[0].values;
  const timeKey = Object.keys(series.observations)[0];
  const date = timeDim[Number(timeKey)].id;
  return { value, date };
}

// ─── Fetchers ──────────────────────────────────────────────────────────

async function fetchEcbPolicyRates() {
  // FM dataset, daily key = D.U2.EUR.4F.KR.<rate>.LEV
  // Official series codes: DFR (deposit), MRR_RT (MRO), MLF (marginal)
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

async function fetchEcbBalanceSheet() {
  // ILM (consolidated balance sheet of the Eurosystem), weekly
  // W.U2.C.A000000.Z5.Z01.EUR = total assets
  const totalAssets = await fetchEcbSeries("ILM", "W.U2.C.A000000.Z5.Z01.EUR");
  return {
    total_assets_bn_eur: Math.round(totalAssets.value / 1_000_000),
    as_of: totalAssets.date,
  };
}

async function fetchSpanishBondYield() {
  // Euro area yield curve for Spain 10Y (spot rate)
  // YC dataset: B.U2.EUR.4F.G_N_C.SV_C_YM.SR_10Y (this is euro-area, not Spain-specific)
  // Spanish 10Y via IRS dataset: IRS.M.ES.L.L40.CI.0000.EUR.N.Z
  // Simpler: use monthly average 10Y government benchmark
  const yield10y = await fetchEcbSeries(
    "IRS",
    "M.ES.L.L40.CI.0000.EUR.N.Z"
  );
  return {
    avg_yield_10y_pct: Number(yield10y.value.toFixed(2)),
    as_of: yield10y.date,
  };
}

// ─── Update JSON files ─────────────────────────────────────────────────

function readJson(name) {
  return JSON.parse(readFileSync(path.join(DATA_DIR, name), "utf-8"));
}
function writeJson(name, obj) {
  writeFileSync(
    path.join(DATA_DIR, name),
    JSON.stringify(obj, null, 2) + "\n"
  );
}

async function updateEcb() {
  console.log("→ Refreshing ecb.json (rates + balance sheet)");
  const ecb = readJson("ecb.json");

  try {
    const rates = await fetchEcbPolicyRates();
    ecb.policy_rates_pct = rates;
    console.log(
      `  rates: deposit ${rates.deposit_facility}% · MRO ${rates.main_refinancing_operations}% · MLF ${rates.marginal_lending_facility}% (${rates.as_of})`
    );
  } catch (e) {
    console.error(`  ! rates failed: ${e.message}`);
  }

  try {
    const bs = await fetchEcbBalanceSheet();
    ecb.eurosystem_balance_sheet.total_assets_bn_eur = bs.total_assets_bn_eur;
    ecb._last_balance_sheet_date = bs.as_of;
    console.log(
      `  balance sheet: ${bs.total_assets_bn_eur} B€ total assets (${bs.as_of})`
    );
  } catch (e) {
    console.error(`  ! balance sheet failed: ${e.message}`);
  }

  ecb._meta = ecb._meta || {};
  ecb._meta.last_updated = TODAY;
  ecb._meta.auto_refresh = true;
  writeJson("ecb.json", ecb);
}

async function updateBonds() {
  console.log("→ Refreshing bonds.json (Spanish 10Y yield)");
  const bonds = readJson("bonds.json");

  try {
    const y = await fetchSpanishBondYield();
    bonds.spanish_sovereign_debt.avg_yield_10y_pct = y.avg_yield_10y_pct;
    console.log(`  yield 10Y: ${y.avg_yield_10y_pct}% (${y.as_of})`);
  } catch (e) {
    console.error(`  ! yield failed: ${e.message}`);
  }

  bonds._meta = bonds._meta || {};
  bonds._meta.last_updated = TODAY;
  bonds._meta.auto_refresh = true;
  writeJson("bonds.json", bonds);
}

// Files we don't auto-refresh yet but stamp today's date anyway for honesty.
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
  stampManual("banks.json");
  stampManual("state.json");
  stampManual("households.json");
  stampManual("firms.json");
  stampManual("nbfi.json");
  console.log("✔ done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
