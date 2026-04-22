"use client";

import { Sphere, Html } from "@react-three/drei";
import { bankData } from "../shared/dataScaling";

/**
 * Miniature balance sheet displayed inside a bank when its shell opens.
 *
 *   ● Capital (CET1)  — green, left
 *   ● Prêts (actifs)  — blue, center (largest)
 *   ● Dépôts (passifs) — orange, right
 *
 * Sizes are proportional within the bank (not comparable across banks).
 * "Prêts" is a coarse proxy using ~60% of total assets (typical bank loan
 * book share), since banks.json doesn't yet break out loan books per bank.
 */
export function BankInterior({ bankId }: { bankId: string }) {
  const d = bankData(bankId);
  if (!d) return null;

  const assets = d.total_assets_bn_eur;
  const cet1 = d.cet1_bn_eur ?? assets * 0.08;
  // Rough allocation: loans ~60% of assets, securities + cash + other = 40%
  // Deposits ~75% of assets on typical commercial balance sheets.
  const loans = assets * 0.6;
  const deposits = assets * 0.75;

  // Normalize so the biggest component maps to radius ~0.3
  const maxVal = Math.max(cet1, loans, deposits);
  const scale = (v: number) => 0.1 + 0.22 * Math.sqrt(v / maxVal);

  const items = [
    {
      label: "CET1",
      amount: cet1,
      color: "#5dd39e",
      position: [-0.4, 0, 0] as [number, number, number],
    },
    {
      label: "Prêts",
      amount: loans,
      color: "#6aa3ff",
      position: [0, 0, 0] as [number, number, number],
    },
    {
      label: "Dépôts",
      amount: deposits,
      color: "#ffbf5c",
      position: [0.4, 0, 0] as [number, number, number],
    },
  ];

  return (
    <group>
      {items.map((it) => {
        const r = scale(it.amount);
        return (
          <group key={it.label} position={it.position}>
            <Sphere args={[r, 20, 20]}>
              <meshStandardMaterial
                color={it.color}
                metalness={0.3}
                roughness={0.4}
                emissive={it.color}
                emissiveIntensity={0.5}
              />
            </Sphere>
            <Html
              position={[0, r + 0.1, 0]}
              center
              distanceFactor={5}
              style={{
                pointerEvents: "none",
                color: "#f0f4fa",
                fontSize: 9,
                fontFamily: "system-ui, sans-serif",
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: "0 1px 3px rgba(0,0,0,0.95)",
                lineHeight: 1.1,
              }}
            >
              <div style={{ fontWeight: 700 }}>{it.label}</div>
              <div style={{ fontSize: 8, opacity: 0.85 }}>
                {it.amount >= 100 ? Math.round(it.amount) : it.amount.toFixed(1)} B€
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
