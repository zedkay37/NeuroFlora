/* ============================================================
   NEUROFLORA — Palette de bots (jungle, maturités croissantes)
   Légère, on-brand : créatures/spores rendues par le primitif Fractal.
   ============================================================ */

export interface Bot {
  id: string;
  name: string;
  elo: number;
  hue: string; // température (jeune = teal, mûr = or)
  blurb: string;
  depth: number; // maturité de la dendrite (rendu Fractal)
}

export const BOTS: Bot[] = [
  { id: 'spore', name: 'Spore', elo: 800, hue: 'var(--calc-dim)', blurb: 'Hésitante. Laisse parfois pendre.', depth: 2 },
  { id: 'pousse', name: 'Pousse', elo: 1100, hue: 'var(--calc)', blurb: 'Voit les captures simples.', depth: 3 },
  { id: 'liane', name: 'Liane', elo: 1400, hue: 'var(--calc)', blurb: 'Tactique courte, vive.', depth: 4 },
  { id: 'canopee', name: 'Canopée', elo: 1700, hue: 'var(--proof)', blurb: 'Solide. Punit les oublis.', depth: 5 },
  { id: 'ancien', name: 'Ancien', elo: 2000, hue: 'var(--proof)', blurb: 'Lecture nette. Peu de failles.', depth: 6 },
];

export const DEFAULT_BOT = BOTS[1]; // Pousse
