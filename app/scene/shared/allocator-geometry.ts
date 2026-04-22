import * as THREE from "three";
import type { AllocatorCategory, DataCompleteness } from "./allocator-types";

/**
 * Tier-4 allocator dome.
 * Nodes distributed via Fibonacci sphere across the upper hemisphere —
 * they float above and around the scene, never on the floor.
 */
export const ALLOCATOR_DOME_CENTER = new THREE.Vector3(0, 4, 0);
export const ALLOCATOR_DOME_RADIUS = 22;
export const ALLOCATOR_NODE_RADIUS = 0.18;

/**
 * IBEX firm cluster — small named-firm nodes grouped around the
 * Companies box, so ownership threads have targets to land on.
 */
export const FIRM_CLUSTER_CENTER = new THREE.Vector3(11, 0, 0);
export const FIRM_CLUSTER_RADIUS = 3.2;
export const FIRM_NODE_RADIUS = 0.14;

/**
 * Fibonacci-sphere placement over a hemisphere (y >= 0 half).
 * Produces visually even distribution of N points on a dome surface.
 */
export function fibonacciHemisphere(n: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < n; i++) {
    // Map index to [0, 1] then lift to upper hemisphere only
    const y = (i / Math.max(1, n - 1)) * 0.85 + 0.1; // keep away from poles
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }
  return points;
}

/**
 * Compact cluster around a center — a small Fibonacci sphere at tight radius.
 * Used for the 37 IBEX firms orbiting the Companies box.
 */
export function fibonacciCluster(
  n: number,
  center: THREE.Vector3,
  radius: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    points.push(
      new THREE.Vector3(
        center.x + x * radius,
        center.y + y * radius,
        center.z + z * radius,
      ),
    );
  }
  return points;
}

/**
 * Category → base color. Warm spectrum for public/institutional money,
 * cool for passive/mechanical, magenta/pink for private capital, gold for SWFs.
 */
export const CATEGORY_COLOR: Record<AllocatorCategory, string> = {
  passive_index:           "#4da3ff", // cool blue — mechanical replication
  european_am_active:      "#7d9bff", // softer blue — European active
  us_am_active:            "#9e7dff", // purple — US active
  spanish_bank_am:         "#ff9a4a", // warm orange — Spanish bank arm
  spanish_independent_am:  "#f4b964", // lighter warm — Spanish indie
  spanish_public_pension:  "#2cbf6a", // green — public Spain
  spanish_family_office:   "#e05c8f", // pink — private capital
  spanish_pe:              "#c94a73", // deeper pink — private capital
  spanish_socimi:          "#d6a04a", // sienna — real estate
  spanish_insurance:       "#e07a4a", // orange-red — Spanish insurance
  sovereign_wealth:        "#ffd24d", // gold — state sovereign capital
  european_pension:        "#3da58a", // teal — European public pensions
  canadian_pension:        "#4abfa3", // lighter teal
  us_pension:              "#6ac9ac", // lightest teal
  european_insurance:      "#d96a4a", // warm red — European insurance
  global_insurance:        "#c95a3a", // deeper red
  private_equity:          "#b548a8", // magenta — private equity
  infrastructure_fund:     "#8a96a8", // slate — infrastructure
  real_estate_fund:        "#a67d5a", // umber — real estate
  hedge_fund:              "#6a6a6a", // grey — hedge funds
  money_market_fund:       "#b8c0cc", // pale grey — cash-equivalents
  stablecoin_issuer:       "#20c06a", // bright green — digital money
  esg_specialty:           "#5ad8a0", // mint — ESG
};

/**
 * Completeness → opacity. Verified nodes fully opaque and prominent;
 * structural nodes ghost-like (present but not claiming specific relations).
 */
export function opacityForCompleteness(c: DataCompleteness): number {
  if (c === "verified") return 0.95;
  if (c === "partial") return 0.65;
  return 0.3; // structural
}

/**
 * Node size multiplier by completeness. Verified nodes slightly larger so
 * the 23 with sourced Spanish holdings stand out visually.
 */
export function sizeForCompleteness(c: DataCompleteness): number {
  if (c === "verified") return 1.3;
  if (c === "partial") return 1.05;
  return 0.85;
}

/**
 * Sector → color for IBEX firm cluster.
 */
export const FIRM_SECTOR_COLOR: Record<string, string> = {
  banking:                      "#ff5c5c",
  utilities_energy:             "#4ac9ff",
  infrastructure_construction:  "#c9a040",
  telecom:                      "#b56afc",
  retail_consumer:              "#ff8a3a",
  industrial:                   "#8a96a8",
  healthcare_pharma:            "#5ad8a0",
  tech_services:                "#4a86c9",
  insurance:                    "#d96a4a",
  real_estate:                  "#a67d5a",
};
