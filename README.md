# Monetopo

> Visualisation 3D interactive du système monétaire espagnol — qui crée la monnaie, comment elle circule, qui la régule.

## C'est quoi ?

Un explorateur 3D web-native du système monétaire de l'Espagne dans la zone euro. La scène met en scène les six acteurs du système — BCE, banques commerciales, capital bancaire agrégé, État, ménages, entreprises — et les flux qui les relient : crédit, réserves, dette souveraine, impôts, dépenses publiques, salaires, consommation.

L'ambition : donner une représentation **topologique** — pas comptable — de la plomberie monétaire. Vous voyez qui parle à qui, dans quel sens, et avec quelle épaisseur de flux.

## Sources et ancrage intellectuel

- **Bank of England (2014)** — [Money creation in the modern economy](https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy). Les banques créent la monnaie par le crédit, pas en prêtant l'épargne.
- **Werner (2014)** — [Can banks individually create money out of nothing?](https://www.sciencedirect.com/science/article/pii/S1057521914001070). Preuve empirique de la thèse précédente.
- **Perry Mehrling** — *Money View* + hiérarchie de la monnaie.
- **Zoltan Pozsar** — banque de l'ombre, collatéral comme monnaie.

## Les données

Toutes les valeurs géométriques (taille des sphères, épaisseur des pipes, dimensions des boîtes) sont dérivées de données publiques citées dans chaque fichier `app/data/*.json`.

| Source | Ce qu'on en tire |
|---|---|
| [ECB SDW](https://data.ecb.europa.eu/) | Taux directeurs, bilan Eurosystème, courbes de rendement |
| [Banco de España](https://www.bde.es/) | Statistiques bancaires, dette espagnole, FSR |
| [IGAE](https://www.igae.pap.hacienda.gob.es/) | Flux fiscaux annuels de l'État |
| [INE](https://www.ine.es/) | Ménages, entreprises, PIB |
| [ESRB](https://www.esrb.europa.eu/) | Banque de l'ombre / NBFI Monitor |
| Rapports annuels 2024 | Actifs + CET1 des 11 banques espagnoles |

### Rafraîchissement automatique

- `scripts/refresh-data.mjs` tire en direct depuis l'ECB SDW (taux, rendements 10 ans)
- GitHub Actions exécute `.github/workflows/refresh-data.yml` chaque jour à 07h UTC et commit les changements
- Les données automatiques apparaissent avec `● live` dans le panneau ; les données manuelles avec `● manuel`
- Exécution locale : `npm run refresh`

## Limites assumées

- Le `hub` bleu central est une **simplification pédagogique** : en réalité, le capital est par banque (CET1 de Santander ne soutient pas les prêts de BBVA), pas mutualisé.
- Les flux sont **topologiques**, pas dynamiques : ils n'animent pas encore la création/destruction de monnaie en temps réel.
- La **finance parallèle** (NBFI, repo, MMF, stablecoins — ~380% du PIB européen) n'est pas encore dessinée, seulement chargée dans les données.
- Les **allocateurs** (BlackRock, fonds de pension, private equity) ne sont pas représentés : qui *possède* les entreprises espagnoles reste absent.
- Le **secteur étranger** (imports/exports, IDE) est absent.

## Stack technique

- Next.js 16 (App Router) · React 19 · TypeScript
- Three.js via `@react-three/fiber` + `@react-three/drei`
- Zustand pour la navigation / les couches
- `@react-spring/three` pour les transitions caméra

## Développement local

```bash
npm install
npm run dev         # http://localhost:3000
npm run refresh     # rafraîchir les données depuis l'ECB
npm run build       # production build
```

## Structure

```
app/
├── components/Scene.tsx          # Canvas + panneaux d'overlay
├── data/                         # JSON cités, sources publiques
├── scene/
│   ├── MacroScene.tsx            # Composition de la vue d'ensemble
│   ├── ControlDesk.tsx           # Panneau d'entités + toggles de couches
│   ├── DataPanel.tsx             # Chiffres de l'entité sélectionnée
│   ├── CameraController.tsx      # Transitions caméra via ressort
│   ├── state.ts                  # Store zustand
│   ├── entities.ts               # Registre d'entités cliquables
│   ├── actors/                   # Hub, BCE, banques, boîtes, obélisque
│   ├── flows/                    # Pipes de crédit, circulation, ceinture…
│   └── shared/                   # Constantes, helpers, échelles
scripts/refresh-data.mjs          # Pipeline de rafraîchissement
```

## Licence

MIT — voir [LICENSE](LICENSE).
