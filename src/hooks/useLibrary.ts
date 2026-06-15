/* ============================================================
   NEUROFLORA — useLibrary
   Import PGN / Lichess → minage des angles morts → persistance locale.
   ============================================================ */
import { useCallback, useState } from 'react';
import type { Color } from 'chess.js';
import { colorFor, parseGames, type ParsedGame } from '../lib/pgn';
import { mineGames, type BlindSpot } from '../lib/blindspots';
import { fetchLichessPgn } from '../lib/lichess';

const KEY = 'nf.library.v1';

export interface ImportReport {
  games: number;
  found: number;
}

function load(): BlindSpot[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function merge(existing: BlindSpot[], found: BlindSpot[]): BlindSpot[] {
  const seen = new Set(existing.map((b) => b.fen));
  return [...existing, ...found.filter((b) => !seen.has(b.fen))];
}

export function useLibrary() {
  const [spots, setSpots] = useState<BlindSpot[]>(load);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback((found: BlindSpot[]) => {
    setSpots((prev) => {
      const next = merge(prev, found);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const ingest = useCallback(
    (games: ParsedGame[], resolve: (g: ParsedGame) => Color | null): ImportReport => {
      const found = mineGames(games, resolve);
      commit(found);
      return { games: games.length, found: found.length };
    },
    [commit],
  );

  const importPgn = useCallback(
    (pgn: string, name: string, color: Color): ImportReport => {
      const resolve = name.trim() ? (g: ParsedGame) => colorFor(g, name) : () => color;
      return ingest(parseGames(pgn), resolve);
    },
    [ingest],
  );

  const importLichess = useCallback(
    async (user: string, color: Color): Promise<ImportReport | null> => {
      setBusy(true);
      setError(null);
      try {
        const games = parseGames(await fetchLichessPgn(user));
        return ingest(games, (g) => colorFor(g, user) ?? color);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [ingest],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setSpots([]);
    setSelected(null);
  }, []);

  return {
    spots,
    selected,
    current: selected != null ? (spots[selected] ?? null) : null,
    busy,
    error,
    importPgn,
    importLichess,
    select: setSelected,
    clear,
  };
}

export type Library = ReturnType<typeof useLibrary>;
