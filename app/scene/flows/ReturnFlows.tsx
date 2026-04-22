"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import {
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
  HUB_RADIUS,
  DEPOSITS_COLOR,
  INTEREST_COLOR,
} from "../shared/geometry";
import { HOUSEHOLDS_BOX_SIDE, COMPANIES_BOX_SIDE } from "../shared/dataScaling";
import householdsData from "../../data/households.json";
import firmsData from "../../data/firms.json";

/**
 * A curved tube for return flows: boxes → banking system.
 * Emerges from the box face and lands on the hub surface from a specified
 * angle. The arcDirection offset pushes the curve's midsection in a given
 * axis so deposit pipes and interest pipes don't overlap.
 */
function ReturnPipe({
  start,
  end,
  arcOffset,
  color,
  radius,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  arcOffset: THREE.Vector3;
  color: string;
  radius: number;
}) {
  const geometry = useMemo(() => {
    const c1 = new THREE.Vector3().lerpVectors(start, end, 0.33).add(arcOffset);
    const c2 = new THREE.Vector3().lerpVectors(start, end, 0.66).add(arcOffset);
    const curve = new THREE.CubicBezierCurve3(start, c1, c2, end);
    return new THREE.TubeGeometry(curve, 48, radius, 10, false);
  }, [start, end, arcOffset, radius]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.5}
        emissive={color}
        emissiveIntensity={0.35}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

/**
 * Return flows — deposits + loan interest from households/firms to banks.
 * Represents the "money doesn't disappear" half of the cycle: almost every
 * euro a bank lends ends up as a deposit somewhere in the banking system.
 *
 *  - Deposits (grey): aggregate flow, thicker (€975B for ménages, €420B firms)
 *  - Interest (red): smaller recurring flow on outstanding loans (~€25B/year
 *    on ~€710B household debt + ~€860B firm bank debt at ~3-4% avg rate)
 */
export function ReturnFlows() {
  // Anchor points on the hub's near side (facing each box) so pipes land at
  // a different angle than the outbound credit pipes which hit bank surfaces.
  const menages = HOUSEHOLDS_BOX_POS;
  const entreprises = COMPANIES_BOX_POS;

  // Hub surface points — pipes land at slight y-offset from the top so they
  // don't collide with the ECB reserves/regulation pipes already landing there
  const hubTowardMenages = new THREE.Vector3(-HUB_RADIUS + 0.3, -0.4, 0.6);
  const hubTowardEntreprises = new THREE.Vector3(HUB_RADIUS - 0.3, -0.4, 0.6);

  const halfM = HOUSEHOLDS_BOX_SIDE / 2;
  const halfE = COMPANIES_BOX_SIDE / 2;

  // Deposits from each box: emerge from the bottom-inner face of box
  const depMenagesStart = new THREE.Vector3(menages.x + halfM, -halfM * 0.5, 0);
  const depEntreprisesStart = new THREE.Vector3(entreprises.x - halfE, -halfE * 0.5, 0);

  // Interest from each box: emerge from a different face (top-back) so the
  // two pipes don't stack. Smaller radius.
  const intMenagesStart = new THREE.Vector3(menages.x + halfM, halfM * 0.3, -halfM * 0.6);
  const intEntreprisesStart = new THREE.Vector3(entreprises.x - halfE, halfE * 0.3, -halfE * 0.6);

  // Deposits arc DOWN (below the credit pipes which arc up)
  const depositsArc = new THREE.Vector3(0, -4, 0);
  // Interest arcs slightly lower-back to distinguish
  const interestArc = new THREE.Vector3(0, -3, -2);

  // Household deposits ~€975B; firm deposits ~€420B
  // Scale radii from these (sqrt)
  const hhDeposits = householdsData.stocks.deposits_at_banks_bn_eur;
  const firmDeposits = firmsData.stocks.deposits_at_banks_bn_eur;
  const depRadius = (bnEur: number) =>
    0.05 + 0.18 * Math.sqrt(Math.min(bnEur, 1200) / 1200);

  // Interest flow ~€25-30B/year combined; each box roughly half
  const interestRadius = 0.06;

  return (
    <>
      <ReturnPipe
        start={depMenagesStart}
        end={hubTowardMenages}
        arcOffset={depositsArc}
        color={DEPOSITS_COLOR}
        radius={depRadius(hhDeposits)}
      />
      <ReturnPipe
        start={depEntreprisesStart}
        end={hubTowardEntreprises}
        arcOffset={depositsArc}
        color={DEPOSITS_COLOR}
        radius={depRadius(firmDeposits)}
      />
      <ReturnPipe
        start={intMenagesStart}
        end={hubTowardMenages.clone().add(new THREE.Vector3(0, 0.3, -0.4))}
        arcOffset={interestArc}
        color={INTEREST_COLOR}
        radius={interestRadius}
      />
      <ReturnPipe
        start={intEntreprisesStart}
        end={hubTowardEntreprises.clone().add(new THREE.Vector3(0, 0.3, -0.4))}
        arcOffset={interestArc}
        color={INTEREST_COLOR}
        radius={interestRadius}
      />

      {/* Labels */}
      <Html
        position={[0, -4.5, 1.5]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "#c9d2e0",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          opacity: 0.9,
          whiteSpace: "nowrap",
        }}
      >
        Dépôts
      </Html>
      <Html
        position={[0, -3.2, -3.5]}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "#ffb8a0",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          opacity: 0.9,
          whiteSpace: "nowrap",
        }}
      >
        Intérêts crédit
      </Html>
    </>
  );
}
