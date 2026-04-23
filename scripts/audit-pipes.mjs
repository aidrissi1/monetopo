#!/usr/bin/env node
/**
 * audit-pipes.mjs
 *
 * Scans app/scene/flows/*.tsx for pipe geometry that claims a real-world
 * flow but uses a hardcoded radius literal instead of a data-derived
 * constant. Every pipe thickness is supposed to scale from a €B value
 * in app/data/*.json — this script fails the build when that contract
 * is broken.
 *
 * Usage:  npm run test:pipes
 * Exit code 0 = all PASS, 1 = any offender found.
 */
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FLOWS = join(ROOT, "app", "scene", "flows");
const ACTORS = join(ROOT, "app", "scene", "actors");

// Actors that are legitimately pure-geometry (the visual/editorial anchors —
// pyramid, obelisk, boxes). They don't claim a data-scaled size.
const ACTOR_PURE_GEOMETRY = new Set([
  "OpenableSphere.tsx", // wrapper, no geometry of its own
  "HubInterior.tsx",    // interior scene, illustrative
  "BankInterior.tsx",   // interior scene, illustrative
]);

// Files that don't represent a flow and legitimately don't need dynamic radii.
// FlowParticles uses a fixed `size` prop; MoneyFlowTracer uses a per-event
// radius; BondBelt is a ring. All three are out of scope for this audit.
const EXEMPT = new Set(["FlowParticles.tsx", "MoneyFlowTracer.tsx", "BondBelt.tsx"]);

// Pattern: radius={<literal number>} — e.g. radius={0.14}, radius={0.2}
// A data-backed radius looks like radius={WAGES_RADIUS} and doesn't match.
const HARDCODE_RE = /\bradius=\{-?\s*\d*\.?\d+\s*\}/g;

const offenders = [];
const reviewed = [];

const files = (await readdir(FLOWS)).filter(
  (f) => f.endsWith(".tsx") && !EXEMPT.has(f),
);

for (const f of files) {
  const src = await readFile(join(FLOWS, f), "utf8");
  const lines = src.split("\n");
  const hits = [];
  lines.forEach((line, i) => {
    if (HARDCODE_RE.test(line)) {
      hits.push({ lineNo: i + 1, snippet: line.trim() });
    }
    HARDCODE_RE.lastIndex = 0; // reset global regex state
  });
  reviewed.push({ file: f, hits: hits.length });
  if (hits.length > 0) offenders.push({ file: f, hits });
}

/* ─── Report ──────────────────────────────────────────────────────────── */
const W = 62;
console.log("\n" + "═".repeat(W));
console.log("  PIPE AUDIT · hardcoded radii that should be data-driven");
console.log("═".repeat(W));

for (const r of reviewed) {
  const status =
    r.hits === 0
      ? "  \x1b[32m✓ OK\x1b[0m    "
      : `  \x1b[31m✗ ${r.hits} hit${r.hits > 1 ? "s" : ""}\x1b[0m`;
  console.log(`${status}  ${r.file}`);
}

if (offenders.length > 0) {
  console.log("\n─ offender detail ".padEnd(W, "─"));
  for (const o of offenders) {
    console.log(`\n  ${o.file}`);
    for (const h of o.hits) {
      console.log(`    L${h.lineNo}: ${h.snippet}`);
    }
  }
}

console.log("─".repeat(W));
const totalHits = offenders.reduce((s, o) => s + o.hits.length, 0);
console.log(`  ${reviewed.length - offenders.length}/${reviewed.length} files clean · ${totalHits} hardcoded radius literal${totalHits !== 1 ? "s" : ""} total`);
console.log(`  Exempt (not flow-data pipes): ${[...EXEMPT].join(", ")}`);

/* ─── Actor-file data-import map (informational, not fail-gated) ──────── */
console.log("\n" + "═".repeat(W));
console.log("  ACTOR AUDIT · which actors bind to data vs. pure geometry");
console.log("═".repeat(W));

const actorFiles = (await readdir(ACTORS)).filter((f) => f.endsWith(".tsx"));
const actorRows = [];
for (const f of actorFiles) {
  const src = await readFile(join(ACTORS, f), "utf8");
  const usesDataScaling = /from\s+["'][^"']*shared\/dataScaling["']/.test(src);
  const usesDataJson = /from\s+["'][^"']*\/data\/[^"']+\.json["']/.test(src);
  const hasData = usesDataScaling || usesDataJson;
  const pureGeo = ACTOR_PURE_GEOMETRY.has(f);
  actorRows.push({ file: f, hasData, pureGeo, usesDataScaling, usesDataJson });
}

for (const r of actorRows) {
  let badge;
  if (r.hasData) badge = "  \x1b[32m✓ data-bound\x1b[0m";
  else if (r.pureGeo) badge = "  \x1b[90m· pure geom \x1b[0m"; // legit
  else badge = "  \x1b[33m? no data  \x1b[0m"; // suspicious, not fatal
  const tag = [];
  if (r.usesDataScaling) tag.push("dataScaling");
  if (r.usesDataJson) tag.push("data/*.json");
  const detail = tag.length ? ` (imports: ${tag.join(", ")})` : "";
  console.log(`${badge}  ${r.file}${detail}`);
}

const suspicious = actorRows.filter((r) => !r.hasData && !r.pureGeo);
console.log("─".repeat(W));
if (suspicious.length === 0) {
  console.log("  All actors either data-bound or flagged pure-geometry.");
} else {
  console.log(
    `  \x1b[33m${suspicious.length} actor${suspicious.length > 1 ? "s" : ""} claim real entities but don't import data:\x1b[0m`,
  );
  for (const r of suspicious) console.log(`   • ${r.file}`);
  console.log("  (informational — review each to confirm it's truly static.)");
}
console.log("═".repeat(W) + "\n");

process.exit(totalHits > 0 ? 1 : 0);
