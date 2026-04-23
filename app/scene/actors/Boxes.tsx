"use client";

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import {
  HOUSEHOLDS_BOX_POS,
  COMPANIES_BOX_POS,
} from "../shared/geometry";
import { DistantHtml } from "../shared/DistantHtml";
import type { EntityId } from "../shared/types";
import {
  HOUSEHOLDS_BOX_SIDE,
  COMPANIES_BOX_SIDE,
} from "../shared/dataScaling";
import householdsData from "../../data/households.json";
import firmsData from "../../data/firms.json";

/**
 * A single small cube inside the lattice, rendered via InstancedMesh.
 *   - Households: 4×4×2 = 32 sub-cubes (≈ 587k households each, 18.8M total)
 *   - Firms: 3×3×3 = 27 sub-cubes (≈ 126k firms each, 3.4M total)
 * Counts are symbolic per the source data — rounded to visually clean lattices.
 */
function SubCubeLattice({
  side,
  gridX,
  gridY,
  gridZ,
  color,
}: {
  side: number;
  gridX: number;
  gridY: number;
  gridZ: number;
  color: string;
}) {
  const total = gridX * gridY * gridZ;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Spacing + sub-cube size derived from the outer cube side.
  const { subSize, spacing } = useMemo(() => {
    const maxDim = Math.max(gridX, gridY, gridZ);
    // Leave ~20% margin inside the outer cube for the lattice to breathe.
    const inner = side * 0.8;
    const spacing = inner / maxDim;
    const subSize = spacing * 0.42;
    return { subSize, spacing };
  }, [side, gridX, gridY, gridZ]);

  // Build all instance matrices once — lattice is static.
  const matrices = useMemo(() => {
    const list: THREE.Matrix4[] = [];
    const tmp = new THREE.Object3D();
    const offsetX = ((gridX - 1) * spacing) / 2;
    const offsetY = ((gridY - 1) * spacing) / 2;
    const offsetZ = ((gridZ - 1) * spacing) / 2;
    for (let x = 0; x < gridX; x++) {
      for (let y = 0; y < gridY; y++) {
        for (let z = 0; z < gridZ; z++) {
          tmp.position.set(
            x * spacing - offsetX,
            y * spacing - offsetY,
            z * spacing - offsetZ,
          );
          tmp.updateMatrix();
          list.push(tmp.matrix.clone());
        }
      }
    }
    return list;
  }, [gridX, gridY, gridZ, spacing]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, total]}>
      <boxGeometry args={[subSize, subSize, subSize]} />
      <meshStandardMaterial
        color={color}
        metalness={0.25}
        roughness={0.5}
        emissive={color}
        emissiveIntensity={0.55}
      />
    </instancedMesh>
  );
}

function DestinationBox({
  position,
  color,
  label,
  side,
  grid,
  equityBn,
  debtBn,
  badge,
  equityNote,
  entityId,
}: {
  position: THREE.Vector3;
  color: string;
  label: string;
  side: number;
  grid: { x: number; y: number; z: number };
  /** Borrower-side equity in bn EUR (sets the shell thickness). */
  equityBn: number;
  /** Bank debt in bn EUR (sets the red debt-rim intensity). */
  debtBn: number;
  /** Two headline stats rendered in the floating badge. */
  badge: { headline: string; sub: string };
  /** Optional footnote under the badge for data caveats. */
  equityNote?: string;
  /** Store entity id — label stays visible when this entity is active. */
  entityId: EntityId;
}) {
  // Edge cage: crisp wireframe around the outer cube, no diagonals.
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(side, side, side)),
    [side],
  );

  // Equity shell — thickness proportional to √(equity/debt). More cushion → thicker halo.
  // Ratio == 1 → shell is 1.5× the box; ratio == 12 → shell saturates ≈ 2.3× the box.
  const { shellSide, debtRatio } = useMemo(() => {
    const ratio = debtBn > 0 ? equityBn / debtBn : 1;
    const thicknessBoost = Math.min(Math.sqrt(ratio) * 0.2 + 0.35, 1.0);
    return { shellSide: side * (1 + thicknessBoost), debtRatio: ratio };
  }, [side, equityBn, debtBn]);

  // Debt rim — a second slightly larger cube outline in red, intensity ∝ 1/ratio.
  // Low ratio (debt ≈ equity) → bright red rim; high ratio → dim rim.
  const rimEdges = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(side * 1.02, side * 1.02, side * 1.02),
      ),
    [side],
  );
  const rimOpacity = Math.max(0.15, Math.min(0.85, 1 / (debtRatio * 0.7 + 0.4)));

  return (
    <group position={position}>
      {/* Equity shell — translucent outer cube sized by (equity − debt) cushion */}
      <mesh>
        <boxGeometry args={[shellSide, shellSide, shellSide]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08}
          metalness={0.15}
          roughness={0.8}
          emissive={color}
          emissiveIntensity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Debt rim — red wire cage just outside the box, intensity scales with leverage */}
      <lineSegments geometry={rimEdges}>
        <lineBasicMaterial color="#e14d4d" transparent opacity={rimOpacity} />
      </lineSegments>

      {/* Faint face plane — subtle fill so the cube doesn't read hollow */}
      <mesh>
        <boxGeometry args={[side, side, side]} />
        <meshStandardMaterial
          color={color}
          metalness={0.2}
          roughness={0.55}
          transparent
          opacity={0.15}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Wire cage — sharp box outline */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </lineSegments>

      {/* Sub-cube lattice interior */}
      <SubCubeLattice
        side={side}
        gridX={grid.x}
        gridY={grid.y}
        gridZ={grid.z}
        color={color}
      />

      {/* Floating headline badge — visible when zoomed close or box is active */}
      <DistantHtml
        position={new THREE.Vector3(
          position.x,
          position.y + shellSide / 2 + 0.5,
          position.z,
        )}
        threshold={12}
        showWhenActive={entityId}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}
        innerStyle={{ textAlign: "center" }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: color,
            marginBottom: 2,
          }}
        >
          {badge.headline}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            opacity: 0.7,
          }}
        >
          {badge.sub}
        </div>
        {equityNote && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "0.05em",
              opacity: 0.45,
              marginTop: 2,
            }}
          >
            {equityNote}
          </div>
        )}
      </DistantHtml>

      {/* Label under the box — visible when zoomed close or box is active */}
      <DistantHtml
        position={new THREE.Vector3(
          position.x,
          position.y - shellSide / 2 - 0.5,
          position.z,
        )}
        threshold={12}
        showWhenActive={entityId}
        center
        distanceFactor={10}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.85)",
        }}
      >
        {label}
      </DistantHtml>
    </group>
  );
}

/**
 * Ménages box — 18.8M households, 4×4×2 lattice (each ≈ 587k).
 * Equity = total wealth − total debt (€8,240B − €710B = €7,530B net).
 * Source: INE + Banco de España EFF (households.json).
 */
export function HouseholdsBox() {
  const pop = householdsData.aggregate.population_millions;
  const wealth = householdsData.stocks.total_wealth_bn_eur;
  const debt = householdsData.stocks.total_debt_bn_eur;
  const equity = wealth - debt;

  return (
    <DestinationBox
      position={HOUSEHOLDS_BOX_POS}
      color="#4a86c9"
      label="Ménages"
      side={HOUSEHOLDS_BOX_SIDE}
      grid={{ x: 4, y: 4, z: 2 }}
      equityBn={equity}
      debtBn={debt}
      entityId="menages"
      badge={{
        headline: `${pop.toFixed(1)} M personnes · ${formatBn(wealth)} patrimoine`,
        sub: `${formatBn(debt)} dette bancaire · ratio ${(wealth / debt).toFixed(1)}×`,
      }}
    />
  );
}

/**
 * Entreprises box — 3.4M firms, 3×3×3 lattice (each ≈ 126k).
 * Equity proxy = listed-market cap + corporate deposits − bank debt − bonds.
 * CAVEAT: only listed-firm equity is in firms.json. Non-listed SME equity
 * (bulk of the 3.4M entities) isn't captured, so the debt rim may read
 * hotter than reality. Fix path: add Banco de España ESA non-financial
 * corp equity to firms.json in a follow-up.
 * Source: INE DIRCE + BdE Central de Balances (firms.json).
 */
export function CompaniesBox() {
  const firmCount = firmsData.aggregate.number_of_firms_millions;
  const listedEquity = firmsData.stocks.equity_market_cap_spanish_listed_bn_eur;
  const deposits = firmsData.stocks.deposits_at_banks_bn_eur;
  const bankDebt = firmsData.stocks.total_bank_debt_bn_eur;
  const equity = Math.max(listedEquity + deposits - bankDebt, listedEquity * 0.2);

  return (
    <DestinationBox
      position={COMPANIES_BOX_POS}
      color="#c98a4a"
      label="Entreprises"
      side={COMPANIES_BOX_SIDE}
      grid={{ x: 3, y: 3, z: 3 }}
      equityBn={equity}
      debtBn={bankDebt}
      entityId="entreprises"
      badge={{
        headline: `${firmCount.toFixed(1)} M entités · ${formatBn(listedEquity)} equity coté`,
        sub: `${formatBn(bankDebt)} dette bancaire · ${formatBn(deposits)} dépôts`,
      }}
      equityNote="equity coté uniquement — SME hors périmètre"
    />
  );
}

/** Format a bn EUR value as either "€820 B" or "€8.2 T" above 1000. */
function formatBn(bn: number): string {
  if (bn >= 1000) return `€${(bn / 1000).toFixed(1)} T`;
  return `€${Math.round(bn)} B`;
}
