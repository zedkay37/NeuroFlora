import { describe, it, expect } from 'vitest';
import { rng, tree, vein, mark } from './fractal';

describe('fractal — déterminisme (parité reduced-motion)', () => {
  it('même graine → même suite PRNG', () => {
    const a = rng(42);
    const b = rng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('graines différentes → suites différentes', () => {
    expect(rng(1)()).not.toBe(rng(2)());
  });

  it('tree est reproductible à graine fixe', () => {
    const opts = { x: 5, y: 5, length: 10, seed: 7 };
    expect(tree(opts)).toEqual(tree(opts));
    expect(tree(opts).length).toBeGreaterThan(0);
  });

  it('vein produit un chemin principal + brindilles déterministes', () => {
    const v = vein(0, 0, 4, 4, { seed: 3, twigs: 2 });
    expect(v.main.d).toMatch(/^M /);
    expect(v.twigs).toHaveLength(2);
    expect(vein(0, 0, 4, 4, { seed: 3, twigs: 2 })).toEqual(v);
  });

  it('mark (logo) est stable', () => {
    expect(mark(11)).toEqual(mark(11));
  });
});
