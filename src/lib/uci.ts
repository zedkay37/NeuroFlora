/* ============================================================
   NEUROFLORA — UCI minimal (pur, testable)
   On parle à Stockfish, mais jamais d'éval visible : seulement « joue ».
   ============================================================ */

export interface UciMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface EngineOpts {
  uciElo?: number;
  skill?: number;
  movetime?: number;
  depth?: number;
}

export function parseBestMove(line: string): UciMove | null {
  const m = /^bestmove\s+(\S+)/.exec(line.trim());
  if (!m || m[1] === '(none)') return null;
  const u = m[1];
  if (u.length < 4) return null;
  return { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined };
}

export function positionCommand(fen: string): string {
  return `position fen ${fen}`;
}

export function goCommand(o: EngineOpts): string {
  const parts = ['go'];
  if (o.depth != null) parts.push('depth', String(o.depth));
  if (o.movetime != null) parts.push('movetime', String(o.movetime));
  if (parts.length === 1) parts.push('movetime', '300');
  return parts.join(' ');
}

export function strengthCommands(o: EngineOpts): string[] {
  const cmds: string[] = [];
  if (o.skill != null) cmds.push(`setoption name Skill Level value ${o.skill}`);
  if (o.uciElo != null) {
    cmds.push('setoption name UCI_LimitStrength value true');
    cmds.push(`setoption name UCI_Elo value ${o.uciElo}`);
  } else {
    cmds.push('setoption name UCI_LimitStrength value false');
  }
  return cmds;
}
