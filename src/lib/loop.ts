/* ============================================================
   NEUROFLORA — La boucle (state machine pure, testable)
   Aujourd'hui → Guidage → Silence → Preuve déposée.
   Parcours en avant ; navigation libre seulement APRÈS le 1er passage.
   ============================================================ */
import type { ClimateKey } from './climate';

export type LoopStep = ClimateKey;

export const LOOP_SEQUENCE: LoopStep[] = ['today', 'guided', 'silence', 'proof'];

export interface LoopState {
  step: LoopStep;
  visited: LoopStep[];
  guidedSolved: boolean; // menace lue + neutralisée en Guidage
  silenceResolved: boolean; // défense jouée en Silence
  firstPassComplete: boolean; // débloque la navigation libre
}

export type LoopEvent =
  | { type: 'BEGIN' } // Aujourd'hui → Guidage
  | { type: 'GUIDED_PROVEN' } // une preuve déposée en Guidage
  | { type: 'SILENCE_RESOLVED' } // un coup de défense joué en Silence
  | { type: 'ADVANCE' } // étape suivante si la sortie est atteinte
  | { type: 'GOTO'; step: LoopStep } // navigation libre (post 1er passage)
  | { type: 'REPLAY' }; // recommencer la boucle

export interface LoopCta {
  label: string;
  event: LoopEvent | null; // null = état d'attente (pas d'action)
  ready: boolean;
}

export function initLoop(): LoopState {
  return {
    step: 'today',
    visited: ['today'],
    guidedSolved: false,
    silenceResolved: false,
    firstPassComplete: false,
  };
}

export function stepIndex(step: LoopStep): number {
  return LOOP_SEQUENCE.indexOf(step);
}

function nextStep(step: LoopStep): LoopStep | null {
  const i = stepIndex(step);
  return i >= 0 && i < LOOP_SEQUENCE.length - 1 ? LOOP_SEQUENCE[i + 1] : null;
}

// La sortie de l'étape courante est-elle atteinte ?
export function canAdvance(s: LoopState): boolean {
  switch (s.step) {
    case 'today':
      return true;
    case 'guided':
      return s.guidedSolved;
    case 'silence':
      return s.silenceResolved;
    case 'proof':
      return false;
  }
}

function withStep(s: LoopState, step: LoopStep): LoopState {
  const visited = s.visited.includes(step) ? s.visited : [...s.visited, step];
  const firstPassComplete = s.firstPassComplete || LOOP_SEQUENCE.every((k) => visited.includes(k));
  return { ...s, step, visited, firstPassComplete };
}

export function loopReducer(s: LoopState, e: LoopEvent): LoopState {
  switch (e.type) {
    case 'BEGIN':
      return s.step === 'today' ? withStep(s, 'guided') : s;
    case 'GUIDED_PROVEN':
      return s.step === 'guided' ? { ...s, guidedSolved: true } : s;
    case 'SILENCE_RESOLVED':
      return s.step === 'silence' ? { ...s, silenceResolved: true } : s;
    case 'ADVANCE': {
      if (!canAdvance(s)) return s;
      const n = nextStep(s.step);
      return n ? withStep(s, n) : s;
    }
    case 'GOTO':
      // libre seulement après le 1er passage complet
      return s.firstPassComplete ? withStep(s, e.step) : s;
    case 'REPLAY':
      // on relance le voyage ; la navigation libre reste débloquée
      return { ...s, step: 'today', guidedSolved: false, silenceResolved: false };
  }
}

// Le pas en avant contextuel (un seul appel à l'action à la fois).
export function loopCta(s: LoopState): LoopCta {
  switch (s.step) {
    case 'today':
      return { label: 'Commencer', event: { type: 'BEGIN' }, ready: true };
    case 'guided':
      return s.guidedSolved
        ? { label: 'Continuer — le Silence', event: { type: 'ADVANCE' }, ready: true }
        : { label: 'Neutralise la menace vue', event: null, ready: false };
    case 'silence':
      return s.silenceResolved
        ? { label: 'Voir la preuve', event: { type: 'ADVANCE' }, ready: true }
        : { label: 'Vois seul. Défends ta pièce.', event: null, ready: false };
    case 'proof':
      return { label: 'Rejouer la boucle', event: { type: 'REPLAY' }, ready: true };
  }
}
