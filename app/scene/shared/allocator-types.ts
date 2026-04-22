/**
 * Tier-4 allocators — entities that hold other people's money
 * and decide where it goes.
 *
 * Structural only. No AUM, no % holdings in this file — those go in
 * a separate `holdings.json` that gets populated from verified sources
 * (CNMV filings, annual reports, GPFG register, etc.) one entity at a time.
 *
 * See app/data/allocators.json for the registry.
 */

export type AllocatorCategory =
  | "passive_index"
  | "european_am_active"
  | "us_am_active"
  | "spanish_bank_am"
  | "spanish_independent_am"
  | "spanish_public_pension"
  | "spanish_family_office"
  | "spanish_pe"
  | "spanish_socimi"
  | "spanish_insurance"
  | "sovereign_wealth"
  | "european_pension"
  | "canadian_pension"
  | "us_pension"
  | "european_insurance"
  | "global_insurance"
  | "private_equity"
  | "infrastructure_fund"
  | "real_estate_fund"
  | "hedge_fund"
  | "money_market_fund"
  | "stablecoin_issuer"
  | "esg_specialty";

/**
 * Data completeness per entity — the single most honest field.
 *
 *   verified    : we have sourced specific Spanish holdings (CNMV filing, GPFG register, etc.)
 *   partial     : presence confirmed (material Spanish activity known from public record)
 *                 but specific % stakes not yet sourced
 *   structural  : institution exists, category assigned, Spanish exposure probable via
 *                 mandate type — no specific sourcing yet
 *
 * Ownership threads are drawn only for `verified`. `partial` draws a thin dotted
 * presence thread. `structural` renders the node at low opacity with no threads.
 */
export type DataCompleteness = "verified" | "partial" | "structural";

export interface Allocator {
  id: string;
  name: string;
  category: AllocatorCategory;
  /** ISO-2 country code of domicile, or "multi" for multi-jurisdiction. */
  origin: string;
  completeness: DataCompleteness;
  /** Short factual note — what's distinctive about their Spanish activity. Optional. */
  notes?: string;
}

export interface AllocatorRegistry {
  _meta: {
    as_of: string;
    sources: string[];
    schema_version: number;
    notes: string;
  };
  allocators: Allocator[];
}
