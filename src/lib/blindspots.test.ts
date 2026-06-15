import { describe, it, expect } from 'vitest';
import { mineGame } from './blindspots';
import type { ParsedGame } from './pgn';

const game = (sans: string[]): ParsedGame => ({ white: 'Moi', black: 'Adv', result: '*', sans });

describe('blindspots', () => {
  it('repère une pièce qui pend ignorée par le joueur', () => {
    // Cg5 attaqué par h6 ; les blancs jouent e4 au lieu de sauver le cavalier.
    const bs = mineGame(game(['Nf3', 'e5', 'Ng5', 'h6', 'e4']), 'w');
    expect(bs).toHaveLength(1);
    expect(bs[0].victim).toBe('n');
    expect(bs[0].undefended).toBe(true);
    expect(bs[0].fen).toContain(' w '); // au trait des blancs
  });
  it('aucun angle mort quand la pièce est sauvée', () => {
    // Même menace, mais le cavalier se retire en f3.
    expect(mineGame(game(['Nf3', 'e5', 'Ng5', 'h6', 'Nf3']), 'w')).toHaveLength(0);
  });
});
