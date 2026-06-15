# NeuroFlora

> Une décision devient une preuve. L'aide se retire à mesure qu'on apprend.

Un entraîneur d'échecs dont l'âme tient en une compétence : **voir la menace avant de calculer.**
Construit **sur** le prototype Claude Design « NEUROFLORA », migré en base produit propre (Vite + React + TS),
puis enrichi par phases. La déco *est* le sens : un seul primitif fractal (nervure de feuille = dendrite =
arbre de variantes) sert au logo, au mycélium et aux veines de calcul.

## La boucle

Un parcours en avant, pas quatre onglets libres :

`Aujourd'hui` → `Guidage` → `Silence` → `Preuve déposée`

- **Aujourd'hui** — l'invitation ; la compétence énoncée.
- **Guidage** — menace vive : sélectionne (le calcul fleurit), lis le signal froid, désamorce. Preuve dorée.
- **Silence** — même compétence, sans aide : voir seul, jouer la défense.
- **Preuve déposée** — la jauge + le registre. Ce qui est gravé.

Navigation libre débloquée seulement après le premier passage. Tutoriel d'entrée (~60 s) rejouable.

## Règles de marque

- Pas d'éval moteur chiffrée dans la boucle cœur ; pas de fausse neuroscience ; pas de métrique brute. UI en français.
- La **précision de lecture** est qualitative et méritée (teal → or), jamais un % froid — alimentée par
  `detectThreat` + le désamorçage réel, **aucun moteur**.
- Stockfish toléré uniquement comme *adversaire* (worker) à partir de V1.5, jamais comme évaluateur visible.

## Stack & structure

`Vite · React 18 · TypeScript · chess.js 1.x · Vitest`

```
src/
  lib/        fractal · engine (detectThreat/aiMove) · climate · coach · loop (state machine) · precision
  hooks/      useNeuroGame (tout l'état jouable) · useTweaks (dev)
  components/ Board · Canopy · Coach · Ledger · LoopSpine · PrecisionGauge · Tutorial · Settings · LogoMark
  styles/     tokens · base · canopy · board · chrome · loop · gauge · tutorial (jetons OKLCH)
prototype-neuroflora/   le prototype d'origine, archivé
```

Seuils durs : `App.tsx < 250` lignes, aucun écran `> 300`, aucun CSS `> 700` (vérifiés par `npm run lint:lines`).

## Scripts

```bash
npm install
npm run dev          # serveur de dev (localhost:5173)
npm run build        # type-check + build de production
npm test             # 46 tests (moteur, boucle, précision, coach, fractal, uci, elo, pgn, angles morts)
npm run lint:lines   # seuils de lignes
```

## Feuille de route

- **V1 — Le noyau** ✅ migration · boucle séquentielle · tutoriel · jauge de précision · registre.
- **V1.5 — L'adversaire** ✅ bots 800–2000 ELO (Stockfish WASM, worker), palette jungle,
  overlay de lecture optionnel. Le moteur charge depuis `public/engine/` (postinstall).
- **V2 — Import & angles morts** ✅ import PGN (coller / fichier) ou pseudo Lichess, **minage des
  angles morts** : les menaces que tu n'as pas vues dans tes propres parties (même `detectThreat`,
  aucun moteur), rejouées dans la boucle — d'abord guidé, puis en silence. Réserve persistée en local.
- **V3 — Plateforme en ligne** · jeu vs joueurs Lichess (OAuth + Board API).
