import type { MoneyCreator } from "./types";

/**
 * The 12 money creators in Spain's banking system, ordered row-by-row
 * (top ring · middle ring · bottom ring). Position in the array maps to the
 * result of computeRingPositions().
 */
export const CREATORS: MoneyCreator[] = [
  // TOP ring
  { id: "bde",       name: "Banco de España",  tier: 0, color: "#ffd24d" },
  { id: "santander", name: "Santander",        tier: 1, color: "#ff4b4b" },
  { id: "bbva",      name: "BBVA",             tier: 1, color: "#2a7dff" },
  { id: "caixabank", name: "CaixaBank",        tier: 1, color: "#60b0ff" },
  // MIDDLE ring
  { id: "sabadell",  name: "Sabadell",         tier: 1, color: "#1aa3a3" },
  { id: "bankinter", name: "Bankinter",        tier: 1, color: "#f88c2a" },
  { id: "unicaja",   name: "Unicaja",          tier: 1, color: "#20c06a" },
  { id: "kutxabank", name: "Kutxabank",        tier: 1, color: "#17b3b3" },
  // BOTTOM ring
  { id: "ibercaja",  name: "Ibercaja",         tier: 1, color: "#9a5cff" },
  { id: "abanca",    name: "Abanca",           tier: 1, color: "#ff5ca0" },
  { id: "cajamar",   name: "Cajamar",          tier: 1, color: "#7acb4a" },
  { id: "otros",     name: "Otros",            tier: 2, color: "#9aa0ab" },
];
