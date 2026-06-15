import { describe, it, expect } from 'vitest';
import { ZERO, record, ratio, tier } from './precision';

describe('précision de lecture', () => {
  it('vierge : à l’écoute, ratio 0', () => {
    expect(ratio(ZERO)).toBe(0);
    expect(tier(ZERO)).toBe('À l’écoute');
  });

  it('un engagement sans menace ne compte pas', () => {
    expect(record(ZERO, false, false)).toEqual(ZERO);
  });

  it('lecture réussie fait monter, lecture manquée pèse', () => {
    let p = record(ZERO, true, true); // vue
    expect(ratio(p)).toBe(1);
    p = record(p, true, false); // manquée
    expect(ratio(p)).toBe(0.5);
    expect(p).toEqual({ presented: 2, read: 1 });
  });

  it('les paliers reflètent la compétence', () => {
    expect(tier({ presented: 3, read: 0 })).toBe('L’œil s’ouvre');
    expect(tier({ presented: 2, read: 1 })).toBe('Lecture qui s’affûte');
    expect(tier({ presented: 4, read: 3 })).toBe('Vigie sûre');
    expect(tier({ presented: 3, read: 3 })).toBe('Œil d’or');
  });
});
