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
import { ReturnFlows } from "./flows/ReturnFlows";
import { ShadowMoney } from "./actors/ShadowMoney";
import { Allocators } from "./actors/Allocators";
import { IbexFirms } from "./actors/IbexFirms";
import { Supervisors } from "./actors/Supervisors";
import { EuFiscal } from "./actors/EuFiscal";
import { RatingAgencies } from "./actors/RatingAgencies";
import { PaymentRails } from "./actors/PaymentRails";
import { OwnershipThreads } from "./flows/OwnershipThreads";
import { CommonOwnership } from "./flows/CommonOwnership";
import { MoneyFlowTracer } from "./flows/MoneyFlowTracer";
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

      {/* ─── Return flows: deposits + loan interest (boxes → banks) ─── */}
      <Layer id="return_flows">
        <ReturnFlows />
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

      {/* ─── Shadow money (NBFI cluster: MMFs, repo, stablecoins, private credit) ─── */}
      <Layer id="shadow">
        <ShadowMoney />
      </Layer>

      {/* ─── Tier-4 allocator dome + IBEX firm cluster ─── */}
      <Layer id="allocators">
        <Allocators />
        <IbexFirms />
      </Layer>

      {/* ─── Ownership threads (allocator → bank/firm) ─── */}
      <Layer id="ownership">
        <OwnershipThreads />
      </Layer>

      {/* ─── Common-ownership horizontal arcs (Elhauge) ─── */}
      <Layer id="common_ownership">
        <CommonOwnership />
      </Layer>

      {/* ─── Tier-2 supervisors (SSM, SRB, FGD, CNMV, DGSFP) ─── */}
      <Layer id="supervisors">
        <Supervisors />
      </Layer>

      {/* ─── EU fiscal layer (EIB, ESM, NGEU, SURE) ─── */}
      <Layer id="eu_fiscal">
        <EuFiscal />
      </Layer>

      {/* ─── Tier-0 rating agencies (slowly rotating halo above scene) ─── */}
      <Layer id="rating_agencies">
        <RatingAgencies />
      </Layer>

      {/* ─── Tier-3 payment rails (T2, Iberpay, Bizum, Iberclear) ─── */}
      <Layer id="payment_rails">
        <PaymentRails />
      </Layer>

      {/* ─── Money-flow tracer — always on, driven by ControlDesk button ─── */}
      <MoneyFlowTracer />
    </>
  );
}
