/* ============================================================
   NEUROFLORA — Calibrage ELO (pur, testable)
   800–2000 → réglages Stockfish. Le moteur ne descend pas sous ~1320 via
   UCI_Elo ; en dessous on s'appuie sur Skill Level + profondeur plafonnée.
   ============================================================ */
import type { EngineOpts } from './uci';

export const ELO_MIN = 800;
export const ELO_MAX = 2000;
const ELO_FLOOR = 1320; // plancher UCI_Elo de Stockfish

export function eloSettings(elo: number): EngineOpts {
  const e = Math.max(ELO_MIN, Math.min(ELO_MAX, Math.round(elo)));
  const frac = (e - ELO_MIN) / (ELO_MAX - ELO_MIN); // 0..1
  const skill = Math.round(frac * 20); // 0..20
  const movetime = Math.round(120 + frac * 380); // 120..500 ms
  const opts: EngineOpts = { skill, movetime };
  if (e >= ELO_FLOOR) opts.uciElo = e;
  else opts.depth = e < 1000 ? 4 : 6; // bas de gamme : profondeur courte, plus faillible
  return opts;
}
