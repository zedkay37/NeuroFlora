import { describe, it, expect } from 'vitest';
import { initLoop, loopReducer, loopCta, canAdvance, type LoopState } from './loop';

const run = (s: LoopState, ...evs: Parameters<typeof loopReducer>[1][]) =>
  evs.reduce(loopReducer, s);

describe('boucle — parcours en avant', () => {
  it('démarre à Aujourd’hui, navigation libre verrouillée', () => {
    const s = initLoop();
    expect(s.step).toBe('today');
    expect(s.firstPassComplete).toBe(false);
  });

  it('BEGIN mène Aujourd’hui → Guidage', () => {
    expect(run(initLoop(), { type: 'BEGIN' }).step).toBe('guided');
  });

  it('on ne peut pas quitter Guidage sans avoir lu la menace', () => {
    const s = run(initLoop(), { type: 'BEGIN' });
    expect(canAdvance(s)).toBe(false);
    expect(run(s, { type: 'ADVANCE' }).step).toBe('guided');
  });

  it('preuve en Guidage → ADVANCE → Silence', () => {
    const s = run(initLoop(), { type: 'BEGIN' }, { type: 'GUIDED_PROVEN' });
    expect(canAdvance(s)).toBe(true);
    expect(run(s, { type: 'ADVANCE' }).step).toBe('silence');
  });

  it('défense en Silence → ADVANCE → Preuve, 1er passage complet', () => {
    const s = run(
      initLoop(),
      { type: 'BEGIN' },
      { type: 'GUIDED_PROVEN' },
      { type: 'ADVANCE' },
      { type: 'SILENCE_RESOLVED' },
      { type: 'ADVANCE' },
    );
    expect(s.step).toBe('proof');
    expect(s.firstPassComplete).toBe(true);
  });

  it('navigation libre : bloquée avant le 1er passage, ouverte après', () => {
    const locked = run(initLoop(), { type: 'GOTO', step: 'silence' });
    expect(locked.step).toBe('today');

    const done = run(
      initLoop(),
      { type: 'BEGIN' },
      { type: 'GUIDED_PROVEN' },
      { type: 'ADVANCE' },
      { type: 'SILENCE_RESOLVED' },
      { type: 'ADVANCE' },
    );
    expect(run(done, { type: 'GOTO', step: 'guided' }).step).toBe('guided');
  });

  it('REPLAY repart d’Aujourd’hui mais garde la navigation libre', () => {
    const done = run(
      initLoop(),
      { type: 'BEGIN' },
      { type: 'GUIDED_PROVEN' },
      { type: 'ADVANCE' },
      { type: 'SILENCE_RESOLVED' },
      { type: 'ADVANCE' },
      { type: 'REPLAY' },
    );
    expect(done.step).toBe('today');
    expect(done.guidedSolved).toBe(false);
    expect(done.firstPassComplete).toBe(true);
  });

  it('le CTA reflète l’étape', () => {
    expect(loopCta(initLoop()).label).toBe('Commencer');
    const guided = run(initLoop(), { type: 'BEGIN' });
    expect(loopCta(guided).ready).toBe(false);
    expect(loopCta(run(guided, { type: 'GUIDED_PROVEN' })).ready).toBe(true);
  });
});
