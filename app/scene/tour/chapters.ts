import type { EntityId, LayerId } from "../shared/types";

/**
 * A single step in the guided tour.
 *
 *   layers  — visible layers for this chapter (everything else is hidden).
 *             Note: the households + firms boxes live inside `credit_flows`,
 *             so any chapter that shows them must include that layer.
 *   focus   — optional entity id to frame the camera on (uses the store's
 *             existing focusEntity → CameraController tween).
 *   action  — optional side-effect that fires when the chapter is entered
 *             (used by chapter 7 to auto-fire the QE tracer).
 */
export interface TourChapter {
  id: string;
  title: string;
  copy: string;
  layers: LayerId[];
  focus: EntityId | null;
  action?: "fire_qe" | null;
}

// Banks + hub + households/firms boxes. credit_flows (the pipes themselves)
// is now a separate layer, so chapter 2 can reveal the pipes as an actual
// new visual when they appear.
const CORE: LayerId[] = ["banking_core", "economy_actors"];

export const TOUR: TourChapter[] = [
  {
    id: "actors",
    title: "Les trois blocs",
    copy:
      "12 banques commerciales au centre. 18,8 M ménages et 3,4 M entreprises à droite. Toute la monnaie circule entre ces trois blocs — le reste n'est que régulation, capital et dette. On commence ici.",
    layers: CORE,
    focus: null, // overview
  },
  {
    id: "credit_creation",
    title: "La monnaie naît du crédit",
    copy:
      "Les fils qui apparaissent à l'instant — ce sont les prêts. Mais ils ne transportent pas d'épargne existante : chaque fois qu'une banque accorde un prêt, elle crée le dépôt ex nihilo sur son propre bilan. Les particules que vous voyez circuler sont cet argent qui n'existait pas une seconde plus tôt. — Bank of England (2014), Werner (2014).",
    layers: [...CORE, "credit_flows", "flow_particles"],
    focus: "hub",
  },
  {
    id: "deposits_return",
    title: "La monnaie revient en dépôt",
    copy:
      "Presque chaque euro prêté termine en dépôt quelque part dans le système. Les ménages déposent €975 B, les entreprises €420 B. La monnaie ne sort jamais du système bancaire — elle circule entre comptes.",
    layers: [...CORE, "credit_flows", "return_flows", "flow_particles"],
    focus: null,
  },
  {
    id: "real_economy",
    title: "L'économie réelle",
    copy:
      "Les entreprises paient €585 B de salaires par an. Les ménages en rendent €760 B en consommation. La boucle qui anime tout le reste — et qui fait que le travail d'un est la dépense de l'autre.",
    layers: [...CORE, "credit_flows", "return_flows", "circulation", "flow_particles"],
    focus: null,
  },
  {
    id: "state",
    title: "L'État",
    copy:
      "L'État prélève €297 B d'impôts + €155 B de cotisations, dépense €610 B. Le déficit de €52 B se finance par l'émission de nouveaux titres. La dette publique atteint ~€1 700 B — autour de 101 % du PIB.",
    layers: [...CORE, "credit_flows", "return_flows", "circulation", "state", "bonds", "flow_particles"],
    focus: "state",
  },
  {
    id: "ecb",
    title: "La BCE",
    copy:
      "La BCE supervise, fournit les réserves, et détient €420 B de dette espagnole via APP + PEPP — soit 26 % du stock. Son bilan consolidé Eurosystème atteint €6,45 T. Les banques gardent €3,18 T en réserves excédentaires.",
    layers: [
      ...CORE,
      "credit_flows",
      "return_flows",
      "circulation",
      "state",
      "bonds",
      "ecb",
      "flow_particles",
    ],
    focus: "ecb",
  },
  {
    id: "qe_live",
    title: "QE en direct",
    copy:
      "Regardez ce qui se passe quand la BCE imprime €100 B. Actifs + €100 B. Réserves + €100 B. Obligations ES + €10 B (part Espagne ≈ 10 %). L'essentiel reste en réserves excédentaires — seuls quelques % deviennent du crédit réel. Les autres particules filent vers les allocateurs (canal prix des actifs) et l'État (canal budgétaire).",
    layers: [
      ...CORE,
      "credit_flows",
      "return_flows",
      "circulation",
      "state",
      "bonds",
      "ecb",
      "allocators",
      "flow_particles",
      "bloom",
    ],
    focus: "ecb",
    action: "fire_qe",
  },
  {
    id: "explore",
    title: "À vous",
    copy:
      "Toutes les couches sont rallumées. Cliquez n'importe quelle entité pour l'ouvrir, ajustez la lumière, relancez des événements QE. Chaque chiffre affiché vient d'une source publique citée dans app/data/*.json.",
    layers: [
      "banking_core",
      "economy_actors",
      "credit_flows",
      "return_flows",
      "circulation",
      "ecb",
      "state",
      "bonds",
      "shadow",
      "allocators",
      "ownership",
      "common_ownership",
      "supervisors",
      "eu_fiscal",
      "rating_agencies",
      "payment_rails",
      "flow_particles",
      "bloom",
    ],
    focus: null,
  },
];
