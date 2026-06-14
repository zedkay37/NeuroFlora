/* ============================================================
   NEUROFLORA — Climats
   4 climats = les 4 temps de la boucle de preuve.
   Chacun pilote densité/bioluminescence/respiration et une température.
   ============================================================ */

export type ClimateKey = 'today' | 'guided' | 'silence' | 'proof';

export interface ClimateCfg {
  label: string;
  density: number;
  bio: number;
  breath: number;
  accent: string;
  temp: string;
}

export const CLIMATE: Record<ClimateKey, ClimateCfg> = {
  today: { label: 'Aujourd’hui', density: 1.0, bio: 1.0, breath: 11, accent: 'var(--calc)', temp: 'var(--calc)' },
  guided: { label: 'Guidage', density: 0.82, bio: 1.16, breath: 9, accent: 'var(--proof)', temp: 'var(--proof)' },
  silence: { label: 'Silence', density: 0.04, bio: 0.34, breath: 17, accent: 'var(--threat)', temp: 'var(--threat)' },
  proof: { label: 'Preuve déposée', density: 0.5, bio: 0.88, breath: 12, accent: 'var(--proof)', temp: 'var(--proof)' },
};

// L'ordre canonique de la boucle (utilisé par la state machine en J1).
export const CLIMATE_ORDER: ClimateKey[] = ['today', 'guided', 'silence', 'proof'];

export const FONTS = {
  cormorant: { display: "'Cormorant', Georgia, serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
  spectral: { display: "'Spectral', Georgia, serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
  marcellus: { display: "'Marcellus', Georgia, serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
} as const;

export type FontKey = keyof typeof FONTS;

export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const GUIDED_FEN = 'r1bqkb1r/ppp2ppp/2np1n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 1';
// Silence : cavalier blanc en g4 attaqué par Cf6, sans aide. Le joueur doit voir seul.
export const SILENCE_FEN = 'rnbqkb1r/pppp1ppp/5n2/4p3/4P1N1/8/PPPP1PPP/RNBQKB1R w KQkq - 0 1';
