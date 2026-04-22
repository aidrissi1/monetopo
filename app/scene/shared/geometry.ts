import * as THREE from "three";

// Hub (aggregate capital)
export const HUB_RADIUS = 1.9;

// Bank satellites
export const SATELLITE_RADIUS = 0.55;
export const SOCKET_RADIUS = 0.14;
export const SOCKET_DEPTH = 0.07;
export const PIPE_RADIUS = 0.1;

// Ring arrangement (3 horizontal rings of 4)
export const RING_DISTANCE = 4.8;
export const RING_Y_OFFSET = 2.8;

// Credit destination boxes
export const BOX_SIZE: [number, number, number] = [2.4, 2.4, 2.4];
export const HOUSEHOLDS_BOX_POS = new THREE.Vector3(-11, 0, 0);
export const COMPANIES_BOX_POS = new THREE.Vector3(11, 0, 0);
export const CURVE_PIPE_RADIUS = 0.06;

// ECB pyramid (authority layer, above the 12-bank ring)
export const ECB_CENTER = new THREE.Vector3(0, 11, 0);
export const ECB_BASE_RADIUS = 1.8;
export const ECB_HEIGHT = 3.2;
export const ECB_BASE_Y = ECB_CENTER.y - ECB_HEIGHT / 2;
export const ECB_RAY_ORIGIN = new THREE.Vector3(0, ECB_BASE_Y, 0);
export const ECB_RAY_RADIUS = 0.035;
export const ECB_REG_PIPE_RADIUS = 0.17;

// State cluster — 3 obelisks: Tesoro (central debt issuer) · CCAA (17 regions)
// · Seguridad Social (pensions + contributions — largest single flow in Spain).
// STATE_POSITION anchor is kept for backward compat with pipes + tracer targets.
export const STATE_POSITION = new THREE.Vector3(0, 4, -10);
export const STATE_SHAFT_SIZE = 2;
export const STATE_SHAFT_HEIGHT = 5;
export const STATE_CAP_HEIGHT = 0.7;
export const STATE_PIPE_RADIUS = 0.11;

// Sub-states — offsets from STATE_POSITION, sized by magnitude of flows
export const TESORO_POSITION = STATE_POSITION.clone();
export const CCAA_POSITION = STATE_POSITION.clone().add(new THREE.Vector3(-4.2, -0.4, 0));
export const SEG_SOC_POSITION = STATE_POSITION.clone().add(new THREE.Vector3(4.4, 0.5, 0));

// Heights reflect comparative flow magnitude
export const TESORO_HEIGHT = 5;
export const CCAA_HEIGHT = 3.8;
export const SEG_SOC_HEIGHT = 6.2;
export const SUB_STATE_SHAFT_SIZE = 1.6;

// Bond belt
export const BOND_BELT_Y = 3.7;
export const BOND_BELT_RADIUS = 6.5;
export const BOND_BELT_TUBE = 0.22;

// Flow pipe colors
export const TAX_COLOR = "#b85c5c";
export const SPENDING_COLOR = "#4a9a6a";
export const BONDS_COLOR = "#c0a060";

// Return-flow pipes (boxes → banks): deposits + interest on loans
export const DEPOSITS_COLOR = "#8a96a8";  // muted grey — "money parked at banks"
export const INTEREST_COLOR = "#d96a4a";  // warm red — "income to banks"

// Default camera
export const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 5, 26];
export const DEFAULT_CAMERA_TARGET: [number, number, number] = [0, 2, 0];
