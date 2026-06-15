import { describe, it, expect } from 'vitest';
import { colorFor, parseGames, splitPgn } from './pgn';

const TWO = `[Event "A"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0

[Event "B"]
[White "Carol"]
[Black "Dan"]
[Result "0-1"]

1. d4 d5 0-1`;

describe('pgn', () => {
  it('découpe un PGN multi-parties', () => {
    expect(splitPgn(TWO)).toHaveLength(2);
  });
  it('extrait noms, résultat et coups SAN', () => {
    const g = parseGames(TWO);
    expect(g).toHaveLength(2);
    expect(g[0].white).toBe('Alice');
    expect(g[0].sans).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    expect(g[1].black).toBe('Dan');
  });
  it('résout la couleur du joueur par pseudo', () => {
    const g = parseGames(TWO);
    expect(colorFor(g[0], 'alice')).toBe('w');
    expect(colorFor(g[1], 'dan')).toBe('b');
    expect(colorFor(g[0], 'zzz')).toBeNull();
  });
});
