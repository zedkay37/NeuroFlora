# NeuroFlora — Plan V1.5 « L'adversaire »

> Affluent, pas produit. Le bot te fait *jouer* — il ne te dicte rien.
> La boucle de preuve reste le cœur ; l'adversaire l'alimente.

État : V1 livrée (`v1.0.0`). Cette phase ajoute un **adversaire réel à ELO réglable**,
100 % client, sans casser le frontend-only ni la règle de marque.

---

## 0. Objectif & critères de réussite

Jouer des parties complètes contre des **bots 800–2000 ELO** crédibles, choisis dans une
**palette thématisée jungle**, avec un **overlay de lecture optionnel** (floraison + signal de
menace) activable pendant la partie. Le tout sans jamais figer l'interface.

**Gate V1.5 (durs) :**
- **Ordre ELO sain** : un bot ~2000 bat un bot ~800 de façon consistante (mini-tournoi auto).
- **Non-bloquant** : le worker ne gèle jamais l'UI (le board reste réactif pendant la réflexion).
- **Latence acceptable** : réponse du bot perçue < ~1,5 s aux niveaux courants.
- **Marque tenue** : Stockfish = adversaire uniquement. **Aucune barre d'éval, aucun coup
  suggéré, aucun chiffre moteur** dans la boucle cœur. La jauge reste « précision de lecture ».

---

## 1. Règle de marque (rappel, assumé)

- Stockfish **AUTORISÉ comme adversaire** (worker client) — il joue contre toi.
- Stockfish **INTERDIT comme évaluateur visible** (barre d'éval, « précision 87 % »,
  meilleur coup) dans la boucle cœur. Un rapport moteur post-partie reste hors scope ici.
- L'overlay de lecture s'appuie sur `detectThreat` (déjà là), **pas** sur l'éval du moteur.

---

## 2. Architecture

```
src/
  engine-worker/
    stockfish.worker.ts     # Web Worker : charge le WASM, parle UCI, isole le calcul
    uci.ts                  # protocole UCI minimal (position, go, bestmove, options)
  lib/
    bots.ts                 # palette de bots (ELO, nom jungle, réglages, profondeur/skill)
    elo.ts                  # mapping ELO → UCI_LimitStrength/UCI_Elo (+ plafond bas de gamme)
  hooks/
    useEngine.ts            # cycle de vie worker, file de requêtes, annulation, timeout
  components/
    BotPicker.tsx           # sélection du bot (carte = créature/spore de maturité variable)
    ReadingOverlayToggle.tsx# active/désactive floraison+signal pendant la partie
```

- **Stockfish WASM** via package npm (`stockfish` / build `lite-single` pour compat large,
  ou `wasm` multi-thread si COOP/COEP disponibles — sinon fallback single-thread).
- **Web Worker** dédié : tout l'UCI hors du thread principal → UI jamais bloquée.
- `useEngine` : une seule requête en vol, **annulation** (`stop`) au changement de position,
  **timeout** de garde, remontée du `bestmove` au `useNeuroGame`.
- Le coup du bot **rentre par le même chemin** que `aiMove` aujourd'hui (on remplace
  l'heuristique gloutonne par le worker quand un bot est sélectionné ; l'heuristique reste
  le fallback si le WASM échoue à charger).

---

## 3. Calibrage ELO

- Plage **800–2000** via `UCI_LimitStrength=true` + `UCI_Elo=<n>`.
- **Bas de gamme (< ~1320)** : `UCI_Elo` seul reste trop fort → plafonner aussi
  `Skill Level` et/ou la **profondeur** (movetime court) pour des coups plus humains/faillibles.
- Budget de réflexion borné par `movetime` (ex. 200–600 ms) pour la latence + la faillibilité.
- `elo.ts` = fonction pure et **testable** : `(elo) → { uciElo, skill, depth, movetime }`.

---

## 4. Palette de bots (on-brand, légère)

Créatures/spores de « maturités » croissantes, jungle bioluminescente — sans gadget.
Indicatif (5–6 bots) :

| Nom | ELO ~ | Teinte | Caractère |
|---|---|---|---|
| Spore | 800 | teal sourd | hésitante, laisse pendre |
| Pousse | 1100 | teal | voit les captures simples |
| Liane | 1400 | teal vif | tactique courte |
| Canopée | 1700 | or pâle | solide, punit les erreurs |
| Ancien | 2000 | or | lecture nette, peu d'oublis |

Le `BotPicker` réutilise le primitif Fractal (maturité = profondeur/densité de la dendrite).

---

## 5. Overlay de lecture (optionnel, pendant la partie)

- Toggle off par défaut (l'esprit « sans aide »). Activé : on ré-affiche la **floraison**
  à la sélection et le **signal de menace** (`detectThreat`) — exactement les primitives V1,
  branchées sur la partie libre. La jauge de précision continue de se nourrir de tes lectures.
- Off : partie « nue » contre le bot ; la jauge mesure quand même (vérité de `detectThreat`).

---

## 6. Jalons (J5, séquencé, s'arrête au gate)

**J5a — Worker & UCI (squelette)**
- Intégrer Stockfish WASM dans un worker ; `uci.ts` (uci/isready/ucinewgame/position/go/bestmove).
- `useEngine` : démarrage, `bestmove`, annulation, timeout, teardown propre.
- *Sortie :* le worker renvoie un coup légal sur une position donnée, sans bloquer l'UI.

**J5b — Calibrage ELO + palette**
- `elo.ts` (pur, testé) + `bots.ts` (palette). Brancher le coup du bot dans `useNeuroGame`
  (remplace `aiMove` quand un bot est choisi ; fallback heuristique si WASM KO).
- *Sortie :* on joue une partie entière contre un bot choisi.

**J5c — UI : BotPicker + overlay de lecture**
- Surface de sélection (DA NEUROFLORA, cartes-créatures) + toggle overlay.
- *Sortie :* choisir un bot et (dé)activer la lecture en cours de partie.

**J5d — Calibrage & robustesse**
- Mini-tournoi automatisé (bots entre eux) pour vérifier l'ordre ELO ; gestion charge WASM
  échouée, COOP/COEP, annulation rapide, fuite mémoire worker.
- *Sortie :* **GATE V1.5** (cf. §0).

---

## 7. Tests

- `elo.test.ts` — monotonie du mapping, plafonds bas de gamme.
- `uci.test.ts` — parsing `bestmove`, construction `position ... moves`.
- `bots.test.ts` — palette bornée 800–2000, noms/teintes uniques.
- Calibrage : script de mini-tournoi (hors CI lourde) → l'ordre ELO tient.
- Garde des seuils de lignes (App<250, écran<300, CSS<700) maintenue.

---

## 8. Risques & parades

- **WASM lourd / threads** → build `lite-single` en fallback ; lazy-load à la 1ʳᵉ partie vs bot.
- **COOP/COEP** (multi-thread) indispo selon hébergement → single-thread d'office, dégradation propre.
- **UI gelée** → tout le calcul dans le worker, requête unique + annulation.
- **Dérive de marque** → revue : zéro éval visible, zéro suggestion ; seul `detectThreat` nourrit l'overlay.
- **Latence bas ELO** → `movetime` court + plafonds, jamais d'attente perçue longue.

---

## 9. La ligne à ne pas perdre

L'adversaire n'est pas le produit : c'est un partenaire d'entraînement. Chaque partie nourrit
la **boucle de preuve** et la **précision de lecture**. On t'apprend à voir — pas à demander
à la machine.
