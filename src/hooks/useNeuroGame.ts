/* ============================================================
   NEUROFLORA — useNeuroGame
   Tout l'état jouable : sélection, floraison, menace, preuves, coach,
   adversaire. App ne fait que composer le rendu à partir d'ici.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Color, Square } from 'chess.js';
import {
  aiMove,
  detectThreat,
  findKing,
  FR,
  legalTargets,
  stillThreatened,
  type MoveTarget,
  type Threat,
} from '../lib/engine';
import { GUIDED_FEN, START, type ClimateKey } from '../lib/climate';
import {
  calcCoach,
  climateCoach,
  mateCoach,
  proofCoach,
  threatCoach,
  type CoachMessage,
} from '../lib/coach';

export interface Proof {
  id: number;
  label: string;
  meta: string;
}
export interface CalcVein {
  from: Square;
  to: Square;
  capture: boolean;
  seed: number;
}
export interface LastMove {
  from: Square;
  to: Square;
}

const PLAYER: Color = 'w';
const AI_DELAY = 620;

export function useNeuroGame() {
  const gameRef = useRef<Chess | null>(null);
  if (!gameRef.current) gameRef.current = new Chess(START);
  const game = gameRef.current;

  const [, force] = useState(0);
  const redraw = useCallback(() => force((n) => n + 1), []);

  const [climate, setClimate] = useState<ClimateKey>('today');
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<MoveTarget[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [threat, setThreat] = useState<Threat | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [proofSqs, setProofSqs] = useState<Set<string>>(() => new Set());
  const [coach, setCoach] = useState<CoachMessage | null>(null);

  const pendingThreat = useRef<Threat | null>(null);
  const provedAt = useRef(0);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showGuides = climate !== 'silence';
  const position = game.board();

  // — recalcul de menace après chaque position —
  const refreshThreat = useCallback(
    (g: Chess): Threat | null => {
      const th = climate === 'silence' ? null : detectThreat(g);
      setThreat(showGuides && th ? th : null);
      pendingThreat.current = th;
      return th;
    },
    [climate, showGuides],
  );

  const syncCoach = useCallback(
    (th?: Threat | null) => {
      const t2 = th !== undefined ? th : pendingThreat.current;
      if (climate === 'silence') {
        setCoach(null);
        return;
      }
      if (t2 && showGuides) setCoach(threatCoach(t2.victim));
      else setCoach(climateCoach(climate));
    },
    [climate, showGuides],
  );

  // — déposer une preuve dorée —
  const depositProof = useCallback((th: Threat, destSq: Square) => {
    provedAt.current = Date.now();
    const label = th.undefended ? 'Pièce sauvée — la voie tient' : 'Échange neutralisé';
    setProofs((p) =>
      [{ id: Date.now(), label, meta: `${FR[th.victim] ?? 'pièce'} · menace vue` }, ...p].slice(0, 4),
    );
    setProofSqs((s) => {
      const n = new Set(s);
      n.add(destSq || th.to);
      return n;
    });
    setCoach(proofCoach());
  }, []);

  // — après stabilisation de la position —
  const afterPosition = useCallback(() => {
    const th = refreshThreat(game);
    if (game.isCheckmate()) setCoach(mateCoach());
    else if (!selected && Date.now() - provedAt.current > 2600) syncCoach(th);
  }, [game, refreshThreat, selected, syncCoach]);

  // — l'adversaire répond —
  const scheduleAI = useCallback(() => {
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => {
      if (game.isGameOver() || game.turn() === PLAYER) {
        afterPosition();
        return;
      }
      const m = aiMove(game);
      if (m) {
        game.move({ from: m.from, to: m.to, promotion: 'q' });
        setLastMove({ from: m.from, to: m.to });
      }
      redraw();
      afterPosition();
    }, AI_DELAY);
  }, [game, redraw, afterPosition]);

  // — clic sur une case —
  const onSquareClick = useCallback(
    (sq: Square) => {
      if (game.isGameOver()) return;
      const piece = position[8 - parseInt(sq[1], 10)][sq.charCodeAt(0) - 97];
      const tgt = targets.find((x) => x.to === sq);
      // jouer un coup si c'est une cible
      if (selected && tgt) {
        const before = pendingThreat.current;
        try {
          game.move({ from: selected, to: sq, promotion: 'q' });
        } catch {
          return;
        }
        setLastMove({ from: selected, to: sq });
        setSelected(null);
        setTargets([]);
        // preuve : la menace vue a-t-elle été désamorcée ?
        if (before && !stillThreatened(game, before)) depositProof(before, sq);
        redraw();
        scheduleAI();
        return;
      }
      // sélectionner sa propre pièce → la floraison de calcul
      if (piece && piece.color === game.turn()) {
        setSelected(sq);
        const ms = legalTargets(game, sq);
        setTargets(ms);
        setCoach(calcCoach(ms.length));
        return;
      }
      // clic à vide → désélection
      setSelected(null);
      setTargets([]);
      syncCoach();
    },
    [game, position, selected, targets, redraw, depositProof, scheduleAI, syncCoach],
  );

  // — nouvelle partie / position guidée —
  const newGame = useCallback(
    (fen?: string, clim?: ClimateKey) => {
      clearTimeout(aiTimer.current);
      gameRef.current = new Chess(fen || START);
      setSelected(null);
      setTargets([]);
      setLastMove(null);
      setProofs([]);
      setProofSqs(new Set());
      if (clim) setClimate(clim);
      pendingThreat.current = null;
      redraw();
      setTimeout(() => {
        const th = refreshThreat(gameRef.current!);
        syncCoach(th);
      }, 30);
    },
    [redraw, refreshThreat, syncCoach],
  );

  // changer de climat depuis l'UI : on désélectionne (comme les onglets du proto)
  const changeClimate = useCallback((k: ClimateKey) => {
    setSelected(null);
    setTargets([]);
    setClimate(k);
  }, []);

  // recompute coach/threat quand le climat change
  useEffect(() => {
    if (!selected) syncCoach();
    setThreat(climate === 'silence' ? null : pendingThreat.current);
    // dépend du seul climat (parité avec le prototype) ; les closures sont
    // fraîches car l'effet se déclenche après le rendu du changement de climat.
  }, [climate]); // eslint-disable-line react-hooks/exhaustive-deps

  // menace initiale au montage + cleanup du timer
  useEffect(() => {
    afterPosition();
    return () => clearTimeout(aiTimer.current);
    // au montage uniquement
  }, []);

  // — floraison de calcul —
  const calcVeins: CalcVein[] =
    showGuides && selected
      ? targets.map((tg, i) => ({ from: selected, to: tg.to, capture: tg.capture, seed: i + 5 }))
      : [];

  const checkSq = game.isCheck() ? findKing(game, game.turn()) : null;

  return {
    climate,
    setClimate: changeClimate,
    position,
    turn: game.turn(),
    selected,
    targets,
    lastMove,
    checkSq,
    threat,
    proofs,
    proofSqs,
    coach,
    calcVeins,
    showGuides,
    onSquareClick,
    newGame,
    guidedFen: GUIDED_FEN,
  };
}
