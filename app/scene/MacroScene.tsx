"use client";

import { Hub } from "./actors/Hub";
import { ECB } from "./actors/ECB";
import { Banks } from "./actors/Banks";
import { HouseholdsBox, CompaniesBox } from "./actors/Boxes";
import { StateObelisk } from "./actors/StateObelisk";
import { CreditPipes } from "./flows/CreditPipes";
import { CirculationPipes } from "./flows/CirculationPipes";
import { ECBPipes } from "./flows/ECBPipes";
import { StatePipes } from "./flows/StatePipes";
import { BondBelt } from "./flows/BondBelt";
import { useSceneStore } from "./state";
import type { LayerId } from "./shared/types";

/**
 * Conditionally render based on layer visibility (controlled by ControlDesk).
 */
function Layer({ id, children }: { id: LayerId; children: React.ReactNode }) {
  const visible = useSceneStore((s) => s.visibleLayers.has(id));
  if (!visible) return null;
  return <>{children}</>;
}

/**
 * The full macro scene — everything the user sees in overview mode.
 * Composed from actors + flows, gated by layer visibility toggles.
 */
export function MacroScene() {
  return (
    <>
      {/* Lights — always on */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[7, 7, 7]} intensity={0.9} />
      <directionalLight position={[-7, -4, -7]} intensity={0.3} color="#4f7cff" />

      {/* ─── Banking core: hub + 12 banks + capital pipes ─── */}
      <Layer id="banking_core">
        <Hub />
        <Banks />
      </Layer>

      {/* ─── Credit destinations ─── */}
      <Layer id="credit_flows">
        <HouseholdsBox />
        <CompaniesBox />
        <CreditPipes />
      </Layer>

      {/* ─── Circulation loop (salaires ↔ consommation) ─── */}
      <Layer id="circulation">
        <CirculationPipes />
      </Layer>

      {/* ─── ECB pyramid + 2 reg/reserves pipes + 12 supervision rays ─── */}
      <Layer id="ecb">
        <ECB />
        <ECBPipes />
      </Layer>

      {/* ─── State obelisk + tax/spending pipes ─── */}
      <Layer id="state">
        <StateObelisk />
        <StatePipes />
      </Layer>

      {/* ─── Sovereign bond belt + 12 branches ─── */}
      <Layer id="bonds">
        <BondBelt />
      </Layer>
    </>
  );
}
