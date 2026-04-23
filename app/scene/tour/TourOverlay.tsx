"use client";

import { useSceneStore } from "../state";
import { TOUR } from "./chapters";

/**
 * Bottom-center overlay shown while the guided tour is running.
 * Renders nothing when tourStep is null.
 */
export function TourOverlay() {
  const tourStep = useSceneStore((s) => s.tourStep);
  const advanceTour = useSceneStore((s) => s.advanceTour);
  const exitTour = useSceneStore((s) => s.exitTour);
  const goToTourStep = useSceneStore((s) => s.goToTourStep);

  if (tourStep === null) return null;
  if (tourStep < 0 || tourStep >= TOUR.length) return null;

  const chapter = TOUR[tourStep];
  const isLast = tourStep === TOUR.length - 1;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(640px, calc(100vw - 48px))",
        backgroundColor: "rgba(15, 18, 25, 0.92)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 217, 122, 0.22)",
        borderRadius: 10,
        padding: "18px 22px",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Top row: step counter + exit */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#ffd97a",
          fontWeight: 700,
        }}
      >
        <span>
          Chapitre {String(tourStep + 1).padStart(2, "0")} / {String(TOUR.length).padStart(2, "0")}
        </span>
        <button
          onClick={exitTour}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.45)",
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

      {/* Title */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          marginBottom: 6,
        }}
      >
        {chapter.title}
      </div>

      {/* Copy */}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          margin: 0,
          color: "rgba(255,255,255,0.82)",
        }}
      >
        {chapter.copy}
      </p>

      {/* Dots + next button */}
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
          {TOUR.map((_, i) => (
            <button
              key={i}
              onClick={() => goToTourStep(i)}
              aria-label={`Aller au chapitre ${i + 1}`}
              style={{
                width: i === tourStep ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === tourStep
                    ? "#ffd97a"
                    : i < tourStep
                      ? "rgba(255, 217, 122, 0.45)"
                      : "rgba(255, 255, 255, 0.15)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>

        <button
          onClick={isLast ? exitTour : advanceTour}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,217,122,0.22), rgba(255,217,122,0.1))",
            border: "1px solid rgba(255, 217, 122, 0.45)",
            color: "#ffd97a",
            cursor: "pointer",
            padding: "8px 18px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {isLast ? "Terminer la visite →" : "Continuer →"}
        </button>
      </div>
    </div>
  );
}
