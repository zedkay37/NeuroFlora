/* ============================================================
   NEUROFLORA — Moteur (règles réelles via chess.js)
   detectThreat = le « signal froid » · aiMove = l'adversaire glouton.
   Aucune éval moteur chiffrée : seulement « y a-t-il une menace ? ».
   ============================================================ */
import { Chess } from 'chess.js';
import type { Color, Move, PieceSymbol, Square } from 'chess.js';

export const VAL: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export const FR: Record<PieceSymbol, string> = {
  p: 'pion',
  n: 'cavalier',
  b: 'fou',
  r: 'tour',
  q: 'dame',
  k: 'roi',
};

export interface Threat {
  from: Square;
  to: Square;
  victim: PieceSymbol;
  undefended: boolean;
}

export interface MoveTarget {
  to: Square;
  capture: boolean;
}

// chess.js 1.x valide les FEN au chargement ; on saute la validation pour
// pouvoir sonder une position « tour adverse inversé » (heuristique de menace).
function loadFen(fen: string): Chess {
  const c = new Chess();
  c.load(fen, { skipValidation: true });
  return c;
}

// — IA gloutonne sobre (l'adversaire) —
export function aiMove(game: Chess): Move | null {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  let best: Move | null = null;
  let bestScore = -1e9;
  for (const m of moves) {
    let s = 0;
    if (m.captured) s += 10 * VAL[m.captured];
    if (m.flags.includes('e')) s += 10;
    // centralité douce
    const f = m.to.charCodeAt(0) - 97;
    const rk = parseInt(m.to[1], 10) - 1;
    s += 2 - (Math.abs(3.5 - f) + Math.abs(3.5 - rk)) * 0.25;
    // risque : la case d'arrivée est-elle reprise ?
    const g2 = new Chess(game.fen());
    try {
      g2.move({ from: m.from, to: m.to, promotion: 'q' });
    } catch {
      continue;
    }
    const recap = g2.moves({ verbose: true }).some((x) => x.to === m.to);
    if (recap) s -= 8 * VAL[m.piece];
    if (m.san.includes('#')) s += 1000;
    if (m.san.includes('+')) s += 2;
    s += Math.random() * 1.4;
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}

// — détection de menace : un signal froid (pièce ennemie -> ma pièce qui pend) —
export function detectThreat(game: Chess): Threat | null {
  try {
    if (game.isCheck()) return null;
    const parts = game.fen().split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    parts[3] = '-';
    const flipped = parts.join(' ');
    const enemy = loadFen(flipped);
    const caps = enemy.moves({ verbose: true }).filter((m) => m.captured);
    let best: Threat | null = null;
    let bestGain = 0;
    for (const c of caps) {
      const g2 = loadFen(flipped);
      try {
        g2.move({ from: c.from, to: c.to, promotion: 'q' });
      } catch {
        continue;
      }
      const recap = g2.moves({ verbose: true }).some((x) => x.to === c.to);
      const gain = VAL[c.captured!] - (recap ? VAL[c.piece] : 0);
      // priorité aux vraies pièces qui pendent
      const score = gain + (recap ? 0 : 0.5);
      if (gain > 0 && score > bestGain) {
        bestGain = score;
        best = { from: c.from, to: c.to, victim: c.captured!, undefended: !recap };
      }
    }
    return best;
  } catch {
    return null;
  }
}

// — après le coup du joueur : la menace vue est-elle encore là ? —
export function stillThreatened(game: Chess, threat: Threat): boolean {
  try {
    const enemy = new Chess(game.fen());
    return enemy.moves({ verbose: true }).some((m) => m.to === threat.to && m.captured);
  } catch {
    return false;
  }
}

// — cibles légales d'une pièce (pour la floraison) —
export function legalTargets(game: Chess, square: Square): MoveTarget[] {
  return game
    .moves({ square, verbose: true })
    .map((m) => ({ to: m.to, capture: !!m.captured || m.flags.includes('e') }));
}

// — trouver le roi d'une couleur —
export function findKing(game: Chess, color: Color): Square | null {
  const b = game.board();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = b[row][col];
      if (p && p.type === 'k' && p.color === color) {
        return (String.fromCharCode(97 + col) + (8 - row)) as Square;
      }
    }
  }
  return null;
}
