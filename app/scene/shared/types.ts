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
  | "otros";

export type LayerId =
  | "banking_core"      // hub + banks + capital pipes
  | "credit_flows"      // bank→box colored pipes
  | "circulation"       // Salaires / Consommation
  | "ecb"               // pyramid + 12 rays + 2 reg pipes
  | "state"             // obelisk + tax/spending pipes
  | "bonds";            // belt + 12 branches + feed pipe

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
