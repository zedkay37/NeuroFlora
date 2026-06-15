/* ============================================================
   NEUROFLORA — Précision de lecture
   PAS une exactitude moteur (centipions). Une compétence entraînée :
   sur les menaces présentées, combien ai-je vues et désamorcées AVANT
   de m'engager. Données : detectThreat (présentée ?) + désamorçage (lue ?).
   Aucun moteur. Signal qualitatif, mérité — jamais un % froid.
   ============================================================ */

export interface Precision {
  presented: number;
  read: number;
}

export const ZERO: Precision = { presented: 0, read: 0 };

// Enregistre un engagement : une menace était-elle présentée ? l'ai-je lue ?
export function record(p: Precision, presented: boolean, read: boolean): Precision {
  if (!presented) return p;
  return { presented: p.presented + 1, read: p.read + (read ? 1 : 0) };
}

export function ratio(p: Precision): number {
  return p.presented ? p.read / p.presented : 0;
}

// Palier qualitatif (jamais un chiffre exposé à l'utilisateur).
export function tier(p: Precision): string {
  if (!p.presented) return 'À l’écoute';
  const r = ratio(p);
  if (r < 0.34) return 'L’œil s’ouvre';
  if (r < 0.67) return 'Lecture qui s’affûte';
  if (r < 1) return 'Vigie sûre';
  return 'Œil d’or';
}
