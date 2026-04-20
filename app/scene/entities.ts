import * as THREE from "three";
import type { Entity } from "./shared/types";
import { CREATORS } from "./shared/creators";
import {
  ECB_CENTER,
  STATE_POSITION,
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
  BOND_BELT_Y,
  BOND_BELT_RADIUS,
} from "./shared/geometry";
import { computeRingPositions } from "./shared/helpers";

const RING_POSITIONS = computeRingPositions();

/**
 * Registry of every selectable entity in the macro scene.
 * Used by the ControlDesk to build the menu, and by the CameraController
 * to know where to fly.
 */
export const ENTITIES: Entity[] = [
  // ─── AUTHORITY LAYER ───
  {
    id: "ecb",
    kind: "pyramid",
    label: "BCE",
    color: "#e8cc6e",
    position: ECB_CENTER,
    cameraOffset: new THREE.Vector3(0, 1, 7),
    layer: "ecb",
  },
  // ─── CAPITAL ───
  {
    id: "hub",
    kind: "sphere",
    label: "Capital agrégé",
    color: "#2d5fff",
    position: new THREE.Vector3(0, 0, 0),
    cameraOffset: new THREE.Vector3(0, 1, 6),
    layer: "banking_core",
  },
  // ─── BOND BELT ───
  {
    id: "bond_belt",
    kind: "belt",
    label: "Obligations d'État",
    color: "#c0a060",
    position: new THREE.Vector3(0, BOND_BELT_Y, -BOND_BELT_RADIUS),
    cameraOffset: new THREE.Vector3(0, 0, -5),
    layer: "bonds",
  },
  // ─── STATE ───
  {
    id: "state",
    kind: "obelisk",
    label: "État",
    color: "#3d4a5c",
    position: STATE_POSITION,
    cameraOffset: new THREE.Vector3(0, 1, 7),
    layer: "state",
  },
  // ─── CREDIT DESTINATIONS ───
  {
    id: "menages",
    kind: "box",
    label: "Ménages",
    color: "#4a86c9",
    position: HOUSEHOLDS_BOX_POS,
    cameraOffset: new THREE.Vector3(-5, 1, 5),
    layer: "credit_flows",
  },
  {
    id: "entreprises",
    kind: "box",
    label: "Entreprises",
    color: "#c98a4a",
    position: COMPANIES_BOX_POS,
    cameraOffset: new THREE.Vector3(5, 1, 5),
    layer: "credit_flows",
  },
  // ─── 12 BANKS (generated from CREATORS + ring positions) ───
  ...CREATORS.map((c, i) => ({
    id: c.id as Entity["id"],
    kind: "sphere" as const,
    label: c.name,
    color: c.color,
    position: RING_POSITIONS[i],
    cameraOffset: new THREE.Vector3(0, 0.5, 3.5),
    layer: "banking_core" as const,
  })),
];

/** Retrieve an entity by its id. */
export function getEntity(id: string): Entity | undefined {
  return ENTITIES.find((e) => e.id === id);
}
