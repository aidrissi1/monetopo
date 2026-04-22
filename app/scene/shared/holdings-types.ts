/**
 * Ownership / holding relations between Tier-4 allocators and their targets
 * (Tier-1 banks + IBEX firms).
 *
 * One record per (allocator, target, stake_type) tuple. `pct_held: null` means
 * the relation is known to exist but the % hasn't been sourced yet — geometry
 * draws a thin "presence" thread (no width signal) until a real number lands.
 *
 * Every record carries an explicit `source` citation. If you can't cite it,
 * don't add it.
 */

export type StakeType =
  | "equity_common"          // ordinary equity stake
  | "equity_controlling"     // majority or controlling block
  | "preferred_equity"
  | "convertible_bond"
  | "senior_debt"            // ordinary corporate bond holding
  | "subordinated_debt"
  | "real_estate_owned"      // direct property holding (RE funds, NPL portfolios)
  | "infrastructure_concession"; // concession-style infra stake

export interface Holding {
  /** Allocator id from app/data/allocators.json */
  allocator_id: string;
  /** Target id — bank id (creators.ts) or firm id (ibex-firms.json) */
  target_id: string;
  stake_type: StakeType;
  /** Percentage of target's outstanding equity / debt. null = known presence, % unsourced. */
  pct_held: number | null;
  /** When this snapshot was true. */
  as_of: string;
  /** Specific document or register where this can be verified. */
  source: string;
  /** Optional clarifying note. */
  notes?: string;
}

export interface HoldingsRegistry {
  _meta: {
    as_of: string;
    sources: string[];
    schema_version: number;
    notes: string;
  };
  holdings: Holding[];
}
