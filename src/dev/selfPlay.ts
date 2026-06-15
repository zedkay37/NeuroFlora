/* ============================================================
   NEUROFLORA — auto-jeu (OUTIL DE DEV)
   Mini-tournoi : deux ELO s'affrontent pour vérifier que l'ordre tient.
   Exposé sur window.__nfSelfPlay en dev uniquement.
   ============================================================ */
import { Chess } from 'chess.js';
import { eloSettings } from '../lib/elo';
import { goCommand, parseBestMove, positionCommand, strengthCommands, type EngineOpts } from '../lib/uci';

const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// bilan matériel (blanc − noir) lu depuis le champ pièces du FEN
function material(fen: string): number {
  let diff = 0;
  for (const ch of fen.split(' ')[0]) {
    const low = ch.toLowerCase();
    const v = VAL[low];
    if (v === undefined) continue;
    diff += ch === low ? -v : v;
  }
  return diff;
}

function ask(w: Worker, fen: string, opts: EngineOpts): Promise<string | null> {
  return new Promise((resolve) => {
    const onMsg = (e: MessageEvent) => {
      const l: string = typeof e.data === 'string' ? e.data : (e.data && e.data.line) || '';
      if (!l.startsWith('bestmove')) return;
      w.removeEventListener('message', onMsg);
      clearTimeout(tm);
      const m = parseBestMove(l);
      resolve(m ? m.from + m.to + (m.promotion || '') : null);
    };
    const tm = setTimeout(() => {
      w.removeEventListener('message', onMsg);
      resolve(null);
    }, 4000);
    w.addEventListener('message', onMsg);
    for (const c of strengthCommands(opts)) w.postMessage(c);
    w.postMessage(positionCommand(fen));
    w.postMessage(goCommand(opts));
  });
}

export interface SelfPlayResult {
  result: string;
  material: number;
  plies: number;
}

export async function selfPlay(whiteElo: number, blackElo: number, maxPlies = 50, movetimeCap = 120): Promise<SelfPlayResult> {
  const w = new Worker('/engine/stockfish-18-lite-single.js');
  w.postMessage('uci');
  w.postMessage('isready');
  await new Promise((r) => setTimeout(r, 300));
  const game = new Chess();
  let plies = 0;
  while (!game.isGameOver() && plies < maxPlies) {
    const opts = eloSettings(game.turn() === 'w' ? whiteElo : blackElo);
    opts.movetime = Math.min(opts.movetime ?? movetimeCap, movetimeCap);
    const uci = await ask(w, game.fen(), opts);
    if (!uci) break;
    try {
      game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' });
    } catch {
      break;
    }
    plies++;
  }
  w.terminate();
  const result = game.isCheckmate()
    ? game.turn() === 'w'
      ? 'noir gagne'
      : 'blanc gagne'
    : game.isGameOver()
      ? 'nulle'
      : 'plafond de coups';
  return { result, material: material(game.fen()), plies };
}

declare global {
  interface Window {
    __nfSelfPlay?: typeof selfPlay;
  }
}

if (import.meta.env.DEV) window.__nfSelfPlay = selfPlay;
