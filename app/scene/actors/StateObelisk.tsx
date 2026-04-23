"use client";

import { Cone } from "@react-three/drei";
import { DistantHtml } from "../shared/DistantHtml";
import * as THREE from "three";
import {
  TESORO_POSITION,
  CCAA_POSITION,
  SEG_SOC_POSITION,
  TESORO_HEIGHT,
  CCAA_HEIGHT,
  SEG_SOC_HEIGHT,
  STATE_CAP_HEIGHT,
  STATE_SHAFT_SIZE,
  SUB_STATE_SHAFT_SIZE,
} from "../shared/geometry";
import { useHoverStore } from "../shared/hover-store";

interface SubStateProps {
  id: string;
  position: THREE.Vector3;
  height: number;
  shaftSize: number;
  shaftColor: string;
  capColor: string;
  label: string;
  title: string;
  subtitle: string;
  meta: string[];
}

function SubState({
  id,
  position,
  height,
  shaftSize,
  shaftColor,
  capColor,
  label,
  title,
  subtitle,
  meta,
}: SubStateProps) {
  const setHovered = useHoverStore((s) => s.setHovered);
  const capSize = shaftSize / Math.SQRT2 * Math.SQRT2;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        setHovered({
          id,
          title,
          subtitle,
          meta,
          color: capColor,
        });
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
        setHovered(null);
      }}
    >
      <mesh>
        <boxGeometry args={[shaftSize, height, shaftSize]} />
        <meshStandardMaterial
          color={shaftColor}
          metalness={0.45}
          roughness={0.45}
          emissive={shaftColor}
          emissiveIntensity={0.25}
        />
      </mesh>
      <Cone
        args={[capSize, STATE_CAP_HEIGHT, 4, 1]}
        position={[0, height / 2 + STATE_CAP_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <meshStandardMaterial
          color={capColor}
          metalness={0.6}
          roughness={0.3}
          emissive={capColor}
          emissiveIntensity={0.4}
        />
      </Cone>
      <DistantHtml
        position={[0, -height / 2 - 0.55, 0]}
        threshold={14}
        showWhenActive="state"
        center
        distanceFactor={12}
        style={{
          pointerEvents: "none",
          color: "white",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </DistantHtml>
    </group>
  );
}

/**
 * Le "cluster étatique" — trois entités fiscales distinctes au lieu d'un
 * pilier unique :
 *   · Tesoro (central)   — émetteur des obligations
 *   · CCAA (gauche)      — 17 communautés autonomes, ~20% de la dette publique
 *   · Seguridad Social   — ~€200B/an, plus grand flux public du pays
 */
export function StateObelisk() {
  return (
    <group>
      <SubState
        id="tesoro"
        position={TESORO_POSITION}
        height={TESORO_HEIGHT}
        shaftSize={STATE_SHAFT_SIZE}
        shaftColor="#3d4a5c"
        capColor="#6a7a8c"
        label="Tesoro"
        title="Tesoro Público"
        subtitle="Émetteur de la dette · centrale"
        meta={[
          "Émet les obligations souveraines (BOT, BONOS, OBLIG)",
          "Interface entre l'État et les marchés de dette",
          "Dette centrale ≈ 50% du total public (le reste : CCAA, SS)",
        ]}
      />
      <SubState
        id="ccaa"
        position={CCAA_POSITION}
        height={CCAA_HEIGHT}
        shaftSize={SUB_STATE_SHAFT_SIZE}
        shaftColor="#4a5d70"
        capColor="#7a8d9e"
        label="CCAA"
        title="Communautés autonomes"
        subtitle="État régional · 17 entités"
        meta={[
          "17 Comunidades Autónomas avec dette propre",
          "≈ 20% de la dette publique totale",
          "Catalogne · Madrid · Andalousie · Valence · etc.",
          "Assurent santé + éducation + services sociaux",
        ]}
      />
      <SubState
        id="seg-soc"
        position={SEG_SOC_POSITION}
        height={SEG_SOC_HEIGHT}
        shaftSize={STATE_SHAFT_SIZE}
        shaftColor="#5b7c9a"
        capColor="#8ea8c0"
        label="Seguridad Social"
        title="Seguridad Social"
        subtitle="État social · plus grand flux public"
        meta={[
          "Flux annuel ≈ €200B — retraites + cotisations",
          "Le plus grand flux monétaire public en Espagne",
          "Fondo de Reserva (fonds de réserve) — partiellement épuisé",
          "Complété par le Pacto de Toledo (accord politique)",
        ]}
      />
    </group>
  );
}
