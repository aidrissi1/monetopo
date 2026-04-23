import * as THREE from "three";

export interface MoneyCreator {
  id: string;
  name: string;
  tier: 0 | 1 | 2;
  color: string;
}

/**
 * Entity types rendered in the macro scene. Used by the control desk + state
 * store to know what's selectable and where to fly the camera.
 */
export type EntityId =
  | "overview"
  | "ecb"
  | "hub"
  | "bond_belt"
  | "state"
  | "menages"
  | "entreprises"
  // individual banks, keyed by id from CREATORS
  | "bde"
  | "santander"
  | "bbva"
  | "caixabank"
  | "sabadell"
  | "bankinter"
  | "unicaja"
  | "kutxabank"
  | "ibercaja"
  | "abanca"
  | "cajamar"
  | "otros"
  | "shadow_money";

export type LayerId =
  | "banking_core"      // hub + banks + capital pipes
  | "credit_flows"      // bank→box colored pipes
  | "return_flows"      // deposits + loan interest (boxes→banks)
  | "circulation"       // Salaires / Consommation
  | "ecb"               // pyramid + 12 rays + 2 reg pipes
  | "state"             // obelisk + tax/spending pipes
  | "bonds"             // belt + 12 branches + feed pipe
  | "shadow"            // NBFI cluster — MMFs, repo, stablecoins, private credit
  | "allocators"        // Tier-4 allocator dome + IBEX firm cluster
  | "ownership"         // ownership threads allocator → bank/firm
  | "common_ownership"  // horizontal Elhauge arcs between co-owned firms
  | "supervisors"       // Tier-2 supervisory bodies (SSM, SRB, FGD, CNMV, DGSFP)
  | "eu_fiscal"         // EU fiscal layer (EIB, ESM, NGEU, SURE)
  | "rating_agencies"   // Tier-0 rotating halo (S&P, Moody's, Fitch, DBRS, Scope)
  | "payment_rails"     // Tier-3 payment + settlement infrastructure
  | "flow_particles"    // animated particles travelling along existing pipes
  | "bloom"             // post-processing bloom pass on emissive materials
  | "economy_actors";   // households + firms boxes (split from credit_flows)

export interface Entity {
  id: EntityId;
  kind: "sphere" | "pyramid" | "box" | "obelisk" | "belt";
  label: string;
  color: string;
  position: THREE.Vector3;
  /** Camera offset from the entity position when focused on it. */
  cameraOffset: THREE.Vector3;
  /** Whether clicking "ouvrir" goes to an interior scene (v1: false everywhere). */
  hasInterior?: boolean;
  /** Layer this entity belongs to (for visibility toggles). */
  layer: LayerId;
}
