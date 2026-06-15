/* ============================================================
   NEUROFLORA — Lecture PGN (pur, testable)
   Découpe un PGN (mono ou multi-parties) et en extrait les coups SAN.
   ============================================================ */
import { Chess } from 'chess.js';
import type { Color } from 'chess.js';

export interface ParsedGame {
  white: string;
  black: string;
  result: string;
  sans: string[];
}

// Une nouvelle partie commence à une ligne vide suivie d'un en-tête [Event.
// (La ligne vide en-têtes→coups est suivie de « 1. … », jamais de [Event.)
export function splitPgn(pgn: string): string[] {
  return pgn
    .replace(/\r\n/g, '\n')
    .split(/\n\n(?=\[Event )/)
    .map((b) => b.trim())
    .filter(Boolean);
}

export function parseGames(pgn: string): ParsedGame[] {
  const games: ParsedGame[] = [];
  for (const block of splitPgn(pgn)) {
    try {
      const c = new Chess();
      c.loadPgn(block);
      const h = c.header();
      const sans = c.history();
      if (sans.length) {
        games.push({
          white: h.White || 'Blancs',
          black: h.Black || 'Noirs',
          result: h.Result || '*',
          sans,
        });
      }
    } catch {
      /* partie illisible : on saute */
    }
  }
  return games;
}

// Quelle couleur le joueur a-t-il tenue dans cette partie ? (match par pseudo)
export function colorFor(g: ParsedGame, name: string): Color | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (g.white.toLowerCase().includes(n)) return 'w';
  if (g.black.toLowerCase().includes(n)) return 'b';
  return null;
}
