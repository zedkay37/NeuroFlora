/* ============================================================
   NEUROFLORA — Minage des angles morts (pur, testable)
   Un angle mort = une position où, au trait du joueur, une menace réelle
   pesait sur lui (detectThreat) ET son coup réel ne l'a pas neutralisée
   (stillThreatened). Même heuristique que la boucle live — aucun moteur.
   ============================================================ */
import { Chess } from 'chess.js';
import type { Color, PieceSymbol } from 'chess.js';
import { detectThreat, FR, stillThreatened, VAL } from './engine';
import type { ParsedGame } from './pgn';

export interface BlindSpot {
  fen: string; // position AVANT le coup raté (à rejouer)
  played: string; // le coup réellement joué (SAN)
  victim: PieceSymbol;
  undefended: boolean;
  theme: string;
  game: string;
  ply: number;
}

// On entraîne la vue des pièces : on ignore les simples pions.
const MIN_VICTIM = 3;

export function mineGame(g: ParsedGame, color: Color, minVictim = MIN_VICTIM): BlindSpot[] {
  const out: BlindSpot[] = [];
  const board = new Chess();
  for (let i = 0; i < g.sans.length; i++) {
    const san = g.sans[i];
    const myTurn = board.turn() === color;
    const th = myTurn ? detectThreat(board) : null;
    const fenBefore = board.fen();
    let mv;
    try {
      mv = board.move(san);
    } catch {
      break; // PGN illisible à partir d'ici
    }
    if (th && VAL[th.victim] >= minVictim && stillThreatened(board, th)) {
      out.push({
        fen: fenBefore,
        played: mv.san,
        victim: th.victim,
        undefended: th.undefended,
        theme: `${FR[th.victim]} ${th.undefended ? 'qui pend' : 'mal défendu'}`,
        game: `${g.white} – ${g.black}`,
        ply: i + 1,
      });
    }
  }
  return out;
}

export function mineGames(
  games: ParsedGame[],
  resolveColor: (g: ParsedGame) => Color | null,
  minVictim = MIN_VICTIM,
): BlindSpot[] {
  const seen = new Set<string>();
  const all: BlindSpot[] = [];
  for (const g of games) {
    const color = resolveColor(g);
    if (!color) continue;
    for (const bs of mineGame(g, color, minVictim)) {
      if (seen.has(bs.fen)) continue;
      seen.add(bs.fen);
      all.push(bs);
    }
  }
  return all;
}
