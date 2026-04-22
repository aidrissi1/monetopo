#!/usr/bin/env node
/**
 * Refresh GPFG (Norges Bank Investment Management / Government Pension
 * Fund Global) Spanish equity holdings into app/data/holdings.json.
 *
 * GPFG publishes its full equity register annually — typically as Excel
 * downloads from https://www.nbim.no/en/investments/the-funds-holdings/
 *
 * This script is built to run in two modes:
 *
 *   1. REMOTE mode (default): fetch the NBIM holdings file directly
 *      from the URL configured below.
 *
 *   2. LOCAL mode: read a CSV placed at scripts/gpfg-holdings-raw.csv
 *      (useful if the remote URL pattern changes — manually download
 *      the XLSX, export Spanish rows to CSV, drop in).
 *
 * Flags:
 *   --local      read from scripts/gpfg-holdings-raw.csv instead of fetching
 *   --dry-run    print what would be updated without writing
 *   --year YYYY  override the year (default: most recent reporting year)
 *
 * Usage examples:
 *   node scripts/refresh-gpfg.mjs --dry-run
 *   node scripts/refresh-gpfg.mjs --local
 *   node scripts/refresh-gpfg.mjs --year 2025
 *
 * ⚠️  The exact remote URL pattern changes year-over-year on NBIM's site.
 *     If REMOTE fetch fails, fall back to LOCAL mode with a CSV export.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "app", "data");
const HOLDINGS_PATH = path.join(DATA_DIR, "holdings.json");
const LOCAL_CSV_PATH = path.join(__dirname, "gpfg-holdings-raw.csv");
const TODAY = new Date().toISOString().slice(0, 10);

// ─── Args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const LOCAL_MODE = args.includes("--local");
const DRY_RUN = args.includes("--dry-run");
const YEAR_FLAG = args.findIndex((a) => a === "--year");
const YEAR = YEAR_FLAG >= 0 ? args[YEAR_FLAG + 1] : String(new Date().getFullYear() - 1);

// ─── Mapping GPFG issuer names → our IBEX firm ids ─────────────────────
// Maintained here rather than in the JSON so we can version-control it.
// Extend this as NBIM reports new ES issuers.
const ISSUER_TO_FIRM_ID = {
  "Banco Santander":          "santander",
  "Banco Santander SA":       "santander",
  "Banco Bilbao Vizcaya":     "bbva",
  "BBVA":                     "bbva",
  "CaixaBank":                "caixabank",
  "Banco Sabadell":           "sabadell",
  "Bankinter":                "bankinter",
  "Unicaja Banco":            "unicaja-banco",
  "Iberdrola":                "iberdrola",
  "Endesa":                   "endesa",
  "Naturgy Energy Group":     "naturgy",
  "Naturgy":                  "naturgy",
  "Repsol":                   "repsol",
  "Enagas":                   "enagas",
  "Enagás":                   "enagas",
  "Redeia Corporacion":       "redeia",
  "Redeia":                   "redeia",
  "Red Electrica":            "redeia",
  "Solaria Energia":          "solaria",
  "Acciona Energia":          "acciona-energia",
  "ACS Actividades":          "acs",
  "Ferrovial":                "ferrovial",
  "Acciona":                  "acciona",
  "Sacyr":                    "sacyr",
  "Aena":                     "aena",
  "Telefonica":               "telefonica",
  "Telefónica":               "telefonica",
  "Cellnex Telecom":          "cellnex",
  "Industria de Diseno":      "inditex",
  "Inditex":                  "inditex",
  "Puig":                     "puig",
  "Melia Hotels":             "melia",
  "International Consolidated Airlines": "iag",
  "IAG":                      "iag",
  "ArcelorMittal":            "arcelormittal",
  "Acerinox":                 "acerinox",
  "CIE Automotive":           "cie-automotive",
  "Fluidra":                  "fluidra",
  "Grifols":                  "grifols",
  "Laboratorios Farmaceuticos Rovi": "rovi",
  "Rovi":                     "rovi",
  "Amadeus IT":               "amadeus",
  "Indra Sistemas":            "indra",
  "Logista":                  "logista",
  "Mapfre":                   "mapfre-firm",
  "Merlin Properties":        "merlin-prop",
  "Inmobiliaria Colonial":    "colonial-firm",
};

function resolveFirmId(issuerName) {
  // Try exact then prefix match
  if (ISSUER_TO_FIRM_ID[issuerName]) return ISSUER_TO_FIRM_ID[issuerName];
  for (const [prefix, id] of Object.entries(ISSUER_TO_FIRM_ID)) {
    if (issuerName.startsWith(prefix)) return id;
  }
  return null;
}

// ─── Naive CSV parser — no quoting needed for NBIM export ───────────────
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i]; });
    return row;
  });
}

// ─── Extract Spanish rows from GPFG export ──────────────────────────────
// Expected CSV columns (exact labels vary — we check a few):
//   Issuer name · Country · Market Value (NOK) · Ownership (% of company)
// Filters: Country in {Spain, ES, ESP}.
function extractSpanishRows(rows) {
  const spanish = rows.filter((r) => {
    const c = (r.Country ?? r.country ?? "").toLowerCase();
    return c === "spain" || c === "es" || c === "esp" || c === "españa";
  });
  return spanish.map((r) => {
    const issuer =
      r["Issuer name"] ?? r["Issuer Name"] ?? r["Name"] ?? r["Company"] ?? "";
    const pctRaw =
      r["Ownership (% of company)"] ??
      r["Ownership %"] ??
      r["Ownership"] ??
      r["Voting %"] ??
      "";
    const pct = parseFloat(String(pctRaw).replace(",", ".").replace("%", ""));
    return {
      issuer: issuer.trim(),
      pct_held: Number.isFinite(pct) ? pct : null,
    };
  });
}

// ─── Main ───────────────────────────────────────────────────────────────
async function loadRaw() {
  if (LOCAL_MODE) {
    if (!existsSync(LOCAL_CSV_PATH)) {
      throw new Error(
        `LOCAL mode expected CSV at ${LOCAL_CSV_PATH}\n` +
        `Download NBIM ${YEAR} holdings XLSX, filter Spanish rows, export as CSV there.`,
      );
    }
    return readFileSync(LOCAL_CSV_PATH, "utf-8");
  }

  // Remote. NBIM publishes annual Excel files at URLs that follow a
  // year-specific pattern. Update this if the pattern changes.
  const url =
    `https://www.nbim.no/contentassets/7e3ac72a2ff241e4a4b9e4b2d9d6f831/${YEAR}/holdings-equity-${YEAR}.csv`;

  console.error(`→ fetching ${url}`);
  const res = await fetch(url, { headers: { Accept: "text/csv" } });
  if (!res.ok) {
    throw new Error(
      `NBIM fetch ${res.status}. URL pattern may have changed for year ${YEAR}.\n` +
      `Fallback: download manually from https://www.nbim.no/en/investments/the-funds-holdings/, ` +
      `filter Spanish rows, export as CSV to scripts/gpfg-holdings-raw.csv, re-run with --local`,
    );
  }
  return res.text();
}

async function main() {
  console.error(`GPFG holdings refresh · year ${YEAR} · ${LOCAL_MODE ? "LOCAL" : "REMOTE"} · ${DRY_RUN ? "DRY-RUN" : "WRITE"}`);

  const raw = await loadRaw();
  const rows = parseCsv(raw);
  const spanishRows = extractSpanishRows(rows);
  console.error(`parsed ${rows.length} rows · ${spanishRows.length} Spanish`);

  // Map issuer names → our firm ids
  const candidateUpdates = [];
  const unmatched = [];
  for (const r of spanishRows) {
    const targetId = resolveFirmId(r.issuer);
    if (targetId) {
      candidateUpdates.push({ allocator_id: "gpfg", target_id: targetId, pct_held: r.pct_held });
    } else {
      unmatched.push(r.issuer);
    }
  }
  console.error(`mapped ${candidateUpdates.length} · unmatched ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.error(`  unmatched issuers (add to ISSUER_TO_FIRM_ID if relevant):`);
    for (const u of unmatched.slice(0, 20)) console.error(`    · ${u}`);
  }

  // Read existing holdings
  const holdings = JSON.parse(readFileSync(HOLDINGS_PATH, "utf-8"));

  // Upsert — replace existing gpfg→X rows, keep non-gpfg rows untouched
  const nonGpfg = holdings.holdings.filter((h) => h.allocator_id !== "gpfg");
  const newGpfgEntries = candidateUpdates.map((u) => ({
    allocator_id: "gpfg",
    target_id: u.target_id,
    stake_type: "equity_common",
    pct_held: u.pct_held,
    as_of: `${YEAR}-12-31`,
    source: `Norway GPFG — annual holdings register (${YEAR}), via refresh-gpfg.mjs`,
  }));

  const updated = {
    ...holdings,
    _meta: {
      ...holdings._meta,
      as_of: TODAY,
    },
    holdings: [...nonGpfg, ...newGpfgEntries].sort((a, b) =>
      (a.allocator_id + a.target_id).localeCompare(b.allocator_id + b.target_id),
    ),
  };

  if (DRY_RUN) {
    console.error(`\n— DRY RUN — would write ${newGpfgEntries.length} GPFG entries. Preview:`);
    for (const e of newGpfgEntries.slice(0, 10)) {
      console.error(`  gpfg → ${e.target_id}  ${e.pct_held === null ? "(null %)" : e.pct_held + "%"}`);
    }
    if (newGpfgEntries.length > 10) console.error(`  … ${newGpfgEntries.length - 10} more`);
    return;
  }

  writeFileSync(HOLDINGS_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.error(`\n✓ wrote ${newGpfgEntries.length} GPFG entries to holdings.json`);
}

main().catch((e) => {
  console.error(`\nFAILED: ${e.message}`);
  process.exit(1);
});
