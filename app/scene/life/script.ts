import type { SceneState } from "../state";

/**
 * Life-of-a-euro — scripted narrative chaining the M1 credit primitives
 * with M2 deposit transfers to show ONE hypothetical €X loan travelling
 * through the Spanish economy, touching multiple actors, and finally
 * being destroyed on repayment.
 *
 * Every step's action uses real coefficients from the data files:
 *
 *   - Consumption share of disposable income: 760/820 ≈ 92.7%  (households.json)
 *   - Wages share of firm GVA:                585/1420 ≈ 41.2% (firms.json)
 *   - Corporate tax share of firm GVA:        132/1420 ≈ 9.3%  (firms.json)
 *   - State transfers to h'holds / spending:  385/610  ≈ 63%   (state.json)
 *
 * Amounts below are ROUNDED applications of these ratios to the base
 * €X loan amount in the store (lifeAmountBn). The copy spells out the
 * accounting double-entry at each step so the balance-sheet panel on the
 * right can be read alongside.
 */

export interface LifeStep {
  id: string;
  title: string;
  copy: string;
  /** Side-effect to run on step entry — fires credit / transfer events. */
  run: (store: SceneState, amount: number) => void;
}

/** Santander is the default "lender" for the narrative — arbitrary choice,
 *  any of the 12 banks would work. We pick the largest so visuals are clear. */
const LENDER = "santander";

export const LIFE_SCRIPT: LifeStep[] = [
  {
    id: "creation",
    title: "1. Naissance du crédit",
    copy:
      "Un ménage emprunte un montant à Santander. Deux écritures apparaissent simultanément sur le bilan de la banque : un prêt à l'actif, un dépôt au passif. L'argent n'existait pas — il vient d'être créé par cette paire d'écritures.",
    run: (store, amount) => {
      store.createCredit(LENDER, "menages", amount);
    },
  },
  {
    id: "consumption",
    title: "2. Consommation",
    copy:
      "Le ménage dépense 93 % du prêt dans des entreprises (ratio réel consommation/revenu disponible en Espagne). Le dépôt change simplement de propriétaire — il reste un passif de Santander, mais maintenant au nom d'une entreprise. Aucune création, aucune destruction.",
    run: (store, amount) => {
      store.transferDeposit("menages", "entreprises", amount * 0.93, "consumption");
    },
  },
  {
    id: "wages",
    title: "3. Salaires",
    copy:
      "L'entreprise redistribue 41 % de sa valeur ajoutée en salaires à d'autres ménages (ratio Contabilidad Nacional). Encore un changement de propriétaire du dépôt — pas de monnaie nouvelle, juste la circulation.",
    run: (store, amount) => {
      store.transferDeposit("entreprises", "menages", amount * 0.38, "wages");
    },
  },
  {
    id: "tax",
    title: "4. Impôts",
    copy:
      "L'entreprise verse ~9 % de sa valeur ajoutée à l'État (IS + cotisations). Le ménage verse aussi ~20 % de son revenu en IRPF + cotisations. Ces dépôts quittent le secteur privé pour atterrir sur le compte de l'État — toujours aucune création monétaire.",
    run: (store, amount) => {
      store.transferDeposit("entreprises", "state", amount * 0.09, "tax");
      store.transferDeposit("menages", "state", amount * 0.15, "tax");
    },
  },
  {
    id: "state_back",
    title: "5. Dépenses publiques",
    copy:
      "L'État renvoie une partie en transferts sociaux vers les ménages : retraites, santé, chômage. 63 % de ses dépenses vont directement aux ménages (state.json). Le dépôt revient dans le secteur privé — la boucle continue.",
    run: (store, amount) => {
      store.transferDeposit("state", "menages", amount * 0.22, "transfer");
    },
  },
  {
    id: "repayment",
    title: "6. Remboursement — la destruction",
    copy:
      "Après plusieurs années et de nombreux allers-retours dans l'économie, le ménage rembourse le prêt initial. Santander annule les deux écritures du Step 1 : le prêt disparaît de l'actif, le dépôt correspondant disparaît du passif. L'argent a cessé d'exister — détruit exactement comme il avait été créé.",
    run: (store, amount) => {
      store.destroyCredit(LENDER, "menages", amount);
    },
  },
  {
    id: "summary",
    title: "7. Bilan net : zéro",
    copy:
      "Masse monétaire avant = masse monétaire après. Pendant sa vie, le même euro a servi successivement de pouvoir d'achat à un ménage, une entreprise, un travailleur, l'État, d'autres ménages — mais au total, rien n'a été ajouté au stock de monnaie. La création n'est que temporaire, gagée sur le remboursement futur. C'est tout le paradoxe de la monnaie bancaire.",
    run: () => {
      /* no-op — just the closing reflection */
    },
  },
];
