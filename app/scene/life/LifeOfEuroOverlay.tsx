"use client";

import { useSceneStore } from "../state";
import { LIFE_SCRIPT } from "./script";

/**
 * Bottom-center overlay for the life-of-euro narrative. Mirrors the
 * TourOverlay visually but lives in a parallel lane — different state,
 * different content, different mechanic. User can run both in sequence
 * but not simultaneously.
 */
export function LifeOfEuroOverlay() {
  const lifeStep = useSceneStore((s) => s.lifeStep);
  const lifeAmountBn = useSceneStore((s) => s.lifeAmountBn);
  const advance = useSceneStore((s) => s.advanceLifeOfEuro);
  const goTo = useSceneStore((s) => s.goToLifeStep);
  const exit = useSceneStore((s) => s.exitLifeOfEuro);

  if (lifeStep === null) return null;
  if (lifeStep < 0 || lifeStep >= LIFE_SCRIPT.length) return null;

  const step = LIFE_SCRIPT[lifeStep];
  const isLast = lifeStep === LIFE_SCRIPT.length - 1;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(680px, calc(100vw - 48px))",
        backgroundColor: "rgba(15, 18, 25, 0.94)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(93, 211, 158, 0.28)",
        borderRadius: 10,
        padding: "18px 22px",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.55)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#5dd39e",
          fontWeight: 700,
        }}
      >
        <span>
          Vie d&apos;un euro · étape {String(lifeStep + 1).padStart(2, "0")} /{" "}
          {String(LIFE_SCRIPT.length).padStart(2, "0")} · €{lifeAmountBn} B
        </span>
        <button
          onClick={exit}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "2px 4px",
          }}
        >
          Quitter ✕
        </button>
      </div>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          marginBottom: 6,
        }}
      >
        {step.title}
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          margin: 0,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {step.copy}
      </p>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {LIFE_SCRIPT.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Aller à l'étape ${i + 1}`}
              style={{
                width: i === lifeStep ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === lifeStep
                    ? "#5dd39e"
                    : i < lifeStep
                      ? "rgba(93, 211, 158, 0.5)"
                      : "rgba(255, 255, 255, 0.15)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s, background 0.2s",
              }}
            />
          ))}
        </div>

        <button
          onClick={isLast ? exit : advance}
          style={{
            background:
              "linear-gradient(135deg, rgba(93,211,158,0.26), rgba(93,211,158,0.12))",
            border: "1px solid rgba(93, 211, 158, 0.5)",
            color: "#5dd39e",
            cursor: "pointer",
            padding: "8px 18px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {isLast ? "Terminer →" : "Étape suivante →"}
        </button>
      </div>
    </div>
  );
}
