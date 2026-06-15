import { describe, it, expect } from 'vitest';
import { calcCoach, climateCoach, mateCoach, proofCoach, threatCoach, todayCoach } from './coach';

describe('coach', () => {
  it('Aujourd’hui énonce la compétence', () => {
    expect(todayCoach().line).toContain('voir la menace');
  });

  it('le signal de menace nomme la victime', () => {
    expect(threatCoach('n').line).toContain('cavalier');
  });

  it('la floraison s’accorde en nombre', () => {
    expect(calcCoach(1).line).toContain('ligne candidate');
    expect(calcCoach(3).line).toContain('lignes candidates');
    expect(calcCoach(0).line).toContain('murée');
  });

  it('la preuve et la fin ont la bonne température', () => {
    expect(proofCoach().temp).toBe('var(--proof)');
    expect(mateCoach().temp).toBe('var(--threat)');
  });

  it('chaque ligne porte une emphase *…*', () => {
    for (const m of [todayCoach(), proofCoach(), threatCoach('q'), climateCoach('proof'), calcCoach(2)]) {
      expect((m.line.match(/\*/g) ?? []).length).toBe(2);
    }
  });
});
