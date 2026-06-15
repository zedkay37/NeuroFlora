/* ============================================================
   NEUROFLORA — useEngine
   Stockfish dans un Web Worker : calcul hors thread principal → UI jamais figée.
   Une requête en vol, annulable, avec timeout et dégradation propre.
   ============================================================ */
import { useCallback, useEffect, useRef } from 'react';
import { goCommand, parseBestMove, positionCommand, strengthCommands, type EngineOpts, type UciMove } from '../lib/uci';

const ENGINE_URL = '/engine/stockfish-18-lite-single.js';
const REQ_TIMEOUT = 6000;

interface Pending {
  resolve: (m: UciMove | null) => void;
  timer: ReturnType<typeof setTimeout>;
}

export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef(false);
  const failedRef = useRef(false);
  const pendingRef = useRef<Pending | null>(null);

  const settle = useCallback((move: UciMove | null) => {
    const p = pendingRef.current;
    if (!p) return;
    clearTimeout(p.timer);
    pendingRef.current = null;
    p.resolve(move);
  }, []);

  useEffect(() => {
    let w: Worker;
    try {
      w = new Worker(ENGINE_URL);
    } catch {
      failedRef.current = true;
      return;
    }
    workerRef.current = w;
    w.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : (e.data && e.data.line) || '';
      if (line === 'uciok') w.postMessage('isready');
      else if (line === 'readyok') readyRef.current = true;
      else if (line.startsWith('bestmove')) settle(parseBestMove(line));
    };
    w.onerror = () => {
      failedRef.current = true;
      readyRef.current = false;
      settle(null);
    };
    w.postMessage('uci');
    return () => {
      w.terminate();
      workerRef.current = null;
      readyRef.current = false;
      settle(null);
    };
  }, [settle]);

  // Renvoie le coup du moteur, ou null (l'appelant retombe sur l'heuristique).
  const bestMove = useCallback(
    (fen: string, opts: EngineOpts = {}): Promise<UciMove | null> => {
      const w = workerRef.current;
      if (!w || failedRef.current) return Promise.resolve(null);
      // une seule requête à la fois : on annule la précédente
      if (pendingRef.current) {
        w.postMessage('stop');
        settle(null);
      }
      return new Promise<UciMove | null>((resolve) => {
        const timer = setTimeout(() => {
          w.postMessage('stop');
          settle(null);
        }, REQ_TIMEOUT);
        pendingRef.current = { resolve, timer };
        for (const c of strengthCommands(opts)) w.postMessage(c);
        w.postMessage(positionCommand(fen));
        w.postMessage(goCommand(opts));
      });
    },
    [settle],
  );

  const available = useCallback(() => !!workerRef.current && !failedRef.current, []);

  return { bestMove, available };
}
