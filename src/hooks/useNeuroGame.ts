/* ============================================================
   NEUROFLORA — useNeuroGame
   Tout l'état jouable + la boucle (state machine). App ne fait que rendre.
   ============================================================ */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
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
import { GUIDED_FEN, SILENCE_FEN, START } from '../lib/climate';
import {
  calcCoach,
  climateCoach,
  mateCoach,
  proofCoach,
  threatCoach,
  todayCoach,
  type CoachMessage,
} from '../lib/coach';
import { initLoop, loopCta, loopReducer, type LoopStep } from '../lib/loop';
import { ratio as precisionRatio, record, tier as precisionTier, ZERO, type Precision } from '../lib/precision';
import type { UciMove } from '../lib/uci';

export interface NeuroGameOpts {
  // l'adversaire (Stockfish) ; null/échec → repli sur l'heuristique
  getMove?: (fen: string) => Promise<UciMove | null>;
  // overlay de lecture : force l'aide (floraison + signal) même hors Guidage
  reading?: boolean;
}

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
const FEN_FOR: Partial<Record<LoopStep, string>> = {
  today: START,
  guided: GUIDED_FEN,
  silence: SILENCE_FEN,
};

export function useNeuroGame(opts: NeuroGameOpts = {}) {
  const gameRef = useRef<Chess | null>(null);
  if (!gameRef.current) gameRef.current = new Chess(START);
  const game = gameRef.current;

  // l'adversaire est lu via ref → scheduleAI reste stable
  const oppRef = useRef(opts);
  oppRef.current = opts;

  const [, force] = useState(0);
  const redraw = useCallback(() => force((n) => n + 1), []);

  const [loop, dispatch] = useReducer(loopReducer, undefined, initLoop);
  const [selected, setSelected] = useState<Square | null>(null);
  const [targets, setTargets] = useState<MoveTarget[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [threat, setThreat] = useState<Threat | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [proofSqs, setProofSqs] = useState<Set<string>>(() => new Set());
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const [precision, setPrecision] = useState<Precision>(ZERO);

  const pendingThreat = useRef<Threat | null>(null);
  const provedAt = useRef(0);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const climate = loop.step;
  // l'overlay de lecture peut rallumer l'aide hors du climat (sinon : climat décide)
  const showGuides = climate !== 'silence' || !!opts.reading;
  const position = game.board();

  // — menace : la vérité est toujours calculée (preuve + jauge) ;
  //   le signal froid n'est visible que si l'aide est active. —
  const refreshThreat = useCallback(
    (g: Chess): Threat | null => {
      const th = detectThreat(g);
      pendingThreat.current = th;
      setThreat(showGuides && th ? th : null);
      return th;
    },
    [showGuides],
  );

  const syncCoach = useCallback(
    (th?: Threat | null) => {
      const t2 = th !== undefined ? th : pendingThreat.current;
      if (climate === 'silence') return setCoach(null);
      if (t2 && showGuides) return setCoach(threatCoach(t2.victim));
      setCoach(climate === 'today' ? todayCoach() : climateCoach(climate));
    },
    [climate, showGuides],
  );

  // — déposer une preuve dorée (silencieuse en Silence) —
  const depositProof = useCallback(
    (th: Threat, destSq: Square) => {
      provedAt.current = Date.now();
      const label = th.undefended ? 'Pièce sauvée — la voie tient' : 'Échange neutralisé';
      setProofs((p) =>
        [{ id: Date.now(), label, meta: `${FR[th.victim] ?? 'pièce'} · menace vue` }, ...p].slice(0, 6),
      );
      setProofSqs((s) => new Set(s).add(destSq || th.to));
      if (showGuides) setCoach(proofCoach());
    },
    [showGuides],
  );

  const afterPosition = useCallback(() => {
    const th = refreshThreat(game);
    if (game.isCheckmate()) setCoach(mateCoach());
    else if (!selected && Date.now() - provedAt.current > 2600) syncCoach(th);
  }, [game, refreshThreat, selected, syncCoach]);

  const scheduleAI = useCallback(() => {
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(async () => {
      if (game.isGameOver() || game.turn() === PLAYER) return afterPosition();
      const fenAtReq = game.fen();
      let mv: { from: string; to: string; promotion?: string } | null = null;
      const getMove = oppRef.current.getMove;
      if (getMove) {
        try {
          mv = await getMove(fenAtReq);
        } catch {
          mv = null;
        }
        // position changée pendant la réflexion → on abandonne ce coup
        if (game.fen() !== fenAtReq) return;
      }
      if (!mv) {
        const h = aiMove(game); // repli heuristique si pas de bot / moteur indispo
        if (h) mv = { from: h.from, to: h.to, promotion: 'q' };
      }
      if (mv) {
        try {
          game.move({ from: mv.from, to: mv.to, promotion: mv.promotion || 'q' });
          setLastMove({ from: mv.from as Square, to: mv.to as Square });
        } catch {
          /* coup illégal inattendu : on ignore */
        }
      }
      redraw();
      afterPosition();
    }, AI_DELAY);
  }, [game, redraw, afterPosition]);

  const onSquareClick = useCallback(
    (sq: Square) => {
      if (game.isGameOver()) return;
      const piece = position[8 - parseInt(sq[1], 10)][sq.charCodeAt(0) - 97];
      const tgt = targets.find((x) => x.to === sq);
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
        const proven = !!before && !stillThreatened(game, before);
        // jauge de précision : une menace présentée, l'ai-je lue ?
        if (before) setPrecision((p) => record(p, true, proven));
        if (proven) depositProof(before!, sq);
        if (climate === 'guided' && proven) dispatch({ type: 'GUIDED_PROVEN' });
        if (climate === 'silence') dispatch({ type: 'SILENCE_RESOLVED' });
        redraw();
        scheduleAI();
        return;
      }
      if (piece && piece.color === game.turn()) {
        setSelected(sq);
        const ms = legalTargets(game, sq);
        setTargets(ms);
        if (showGuides) setCoach(calcCoach(ms.length));
        return;
      }
      setSelected(null);
      setTargets([]);
      syncCoach();
    },
    [game, position, selected, targets, climate, showGuides, redraw, depositProof, scheduleAI, syncCoach],
  );

  // — charger une position (garde les preuves du voyage) —
  const loadPosition = useCallback(
    (fen: string) => {
      clearTimeout(aiTimer.current);
      gameRef.current = new Chess(fen);
      setSelected(null);
      setTargets([]);
      setLastMove(null);
      setProofSqs(new Set());
      pendingThreat.current = null;
      redraw();
      setTimeout(() => {
        const th = refreshThreat(gameRef.current!);
        syncCoach(th);
      }, 30);
    },
    [redraw, refreshThreat, syncCoach],
  );

  const replay = useCallback(() => {
    setProofs([]);
    dispatch({ type: 'REPLAY' });
  }, []);

  // — charger la position quand l'étape change —
  const loadedStep = useRef<LoopStep>('today');
  useEffect(() => {
    if (loadedStep.current === climate) return;
    loadedStep.current = climate;
    const fen = FEN_FOR[climate];
    if (fen) loadPosition(fen); // 'proof' garde le plateau (vue de synthèse)
  }, [climate, loadPosition]);

  // menace initiale au montage + cleanup du timer
  useEffect(() => {
    afterPosition();
    return () => clearTimeout(aiTimer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const calcVeins: CalcVein[] =
    showGuides && selected
      ? targets.map((tg, i) => ({ from: selected, to: tg.to, capture: tg.capture, seed: i + 5 }))
      : [];

  const checkSq = game.isCheck() ? findKing(game, game.turn()) : null;
  const cta = loopCta(loop);
  const runCta = () => {
    if (!cta.event) return;
    cta.event.type === 'REPLAY' ? replay() : dispatch(cta.event);
  };
  const gotoStep = useCallback((step: LoopStep) => dispatch({ type: 'GOTO', step }), []);

  return {
    climate,
    loop,
    cta,
    runCta,
    gotoStep,
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
    precision: {
      ratio: precisionRatio(precision),
      tier: precisionTier(precision),
      presented: precision.presented,
    },
    calcVeins,
    showGuides,
    onSquareClick,
  };
}
