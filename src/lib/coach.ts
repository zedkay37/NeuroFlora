/* ============================================================
   NEUROFLORA — Coach (textes sobres, 1–2 lignes)
   Données pures : `line` porte des *mots* en emphase (rendus par <CoachLine>).
   Aucune logique React ici — testable.
   ============================================================ */
import type { PieceSymbol } from 'chess.js';
import { FR } from './engine';
import { CLIMATE, type ClimateKey } from './climate';

export interface CoachMessage {
  eyebrow: string;
  temp: string;
  line: string;
  hint: string;
}

export function calcCoach(n: number): CoachMessage {
  return {
    eyebrow: 'Floraison de calcul',
    temp: 'var(--calc)',
    line: n
      ? `Le calcul *fleurit* — ${n} ${n > 1 ? 'lignes candidates' : 'ligne candidate'}.`
      : 'Aucune voie. La pièce est *murée*.',
    hint: 'Chaque dendrite est une variante. Suis-en une.',
  };
}

export function proofCoach(): CoachMessage {
  return {
    eyebrow: 'Preuve déposée',
    temp: 'var(--proof)',
    line: 'La synapse dorée *reste*. Tu as vu avant de calculer.',
    hint: 'La mémoire se forme. La voie est gravée.',
  };
}

export function threatCoach(victim: PieceSymbol): CoachMessage {
  return {
    eyebrow: 'Signal de menace',
    temp: 'var(--threat)',
    line: `Une synapse *froide* court vers ton ${FR[victim]}.`,
    hint: 'Vois la menace avant de calculer. Puis réponds.',
  };
}

export function climateCoach(climate: ClimateKey): CoachMessage {
  return {
    eyebrow: CLIMATE[climate].label,
    temp: CLIMATE[climate].accent,
    line:
      climate === 'proof'
        ? 'Les voies prouvées *brillent*, apaisées.'
        : 'Une seule priorité. *Respire*, puis calcule.',
    hint: climate === 'proof' ? 'Ce qui est prouvé reste gravé.' : 'Sélectionne une pièce : son calcul fleurit.',
  };
}

export function todayCoach(): CoachMessage {
  return {
    eyebrow: 'Aujourd’hui',
    temp: 'var(--calc)',
    line: 'Une seule compétence : *voir la menace* avant de calculer.',
    hint: 'Commence la boucle — l’aide se retirera à mesure que tu apprends.',
  };
}

export function mateCoach(): CoachMessage {
  return { eyebrow: 'Fin', temp: 'var(--threat)', line: 'Échec et mat. Le réseau se fige.', hint: '' };
}
