import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { detectThreat, stillThreatened, legalTargets, findKing, aiMove } from './engine';
import { START, GUIDED_FEN } from './climate';

describe('detectThreat (le signal froid)', () => {
  it('ne voit aucune menace en position de départ', () => {
    expect(detectThreat(new Chess(START))).toBeNull();
  });

  it('voit la pièce qui pend sur le plateau guidé', () => {
    const th = detectThreat(new Chess(GUIDED_FEN));
    expect(th).not.toBeNull();
    // le cavalier blanc en e5 est la victime
    expect(th!.to).toBe('e5');
    expect(th!.victim).toBe('n');
  });

  it('ne signale pas de menace quand le roi est en échec', () => {
    // échec immédiat : la détection se tait (on gère l'échec, pas la menace)
    const inCheck = new Chess('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
    expect(detectThreat(inCheck)).toBeNull();
  });
});

describe('stillThreatened (preuve de désamorçage)', () => {
  it('détecte que la menace persiste si on joue ailleurs', () => {
    const game = new Chess(GUIDED_FEN);
    const th = detectThreat(game)!;
    game.move('a3'); // coup qui ignore la menace
    expect(stillThreatened(game, th)).toBe(true);
  });

  it('détecte que la menace disparaît si on protège/déplace', () => {
    const game = new Chess(GUIDED_FEN);
    const th = detectThreat(game)!;
    game.move('Nxc6'); // le cavalier e5 quitte la case menacée en capturant
    expect(stillThreatened(game, th)).toBe(false);
  });
});

describe('helpers', () => {
  it('legalTargets marque les captures', () => {
    const game = new Chess(GUIDED_FEN);
    const targets = legalTargets(game, 'e5');
    expect(targets.some((t) => t.to === 'c6' && t.capture)).toBe(true);
  });

  it('findKing localise les rois', () => {
    const game = new Chess(START);
    expect(findKing(game, 'w')).toBe('e1');
    expect(findKing(game, 'b')).toBe('e8');
  });

  it('aiMove renvoie un coup légal', () => {
    const game = new Chess(START);
    const m = aiMove(game);
    expect(m).not.toBeNull();
    expect(game.moves({ verbose: true }).some((x) => x.from === m!.from && x.to === m!.to)).toBe(true);
  });
});
