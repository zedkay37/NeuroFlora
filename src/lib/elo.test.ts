import { describe, it, expect } from 'vitest';
import { eloSettings, ELO_MIN, ELO_MAX } from './elo';
import { BOTS } from './bots';

describe('calibrage ELO', () => {
  it('skill monotone et borné 0..20', () => {
    expect(eloSettings(ELO_MIN).skill).toBe(0);
    expect(eloSettings(ELO_MAX).skill).toBe(20);
    expect(eloSettings(800).skill!).toBeLessThan(eloSettings(1400).skill!);
    expect(eloSettings(1400).skill!).toBeLessThan(eloSettings(2000).skill!);
  });

  it('movetime monte avec l’ELO', () => {
    expect(eloSettings(800).movetime!).toBeLessThan(eloSettings(2000).movetime!);
  });

  it('UCI_Elo seulement au-dessus du plancher moteur', () => {
    expect(eloSettings(1100).uciElo).toBeUndefined();
    expect(eloSettings(1100).depth).toBeDefined();
    expect(eloSettings(1320).uciElo).toBe(1320);
    expect(eloSettings(2000).uciElo).toBe(2000);
  });

  it('borne les valeurs hors plage', () => {
    expect(eloSettings(400).skill).toBe(0);
    expect(eloSettings(3000).uciElo).toBe(ELO_MAX);
  });
});

describe('palette de bots', () => {
  it('ELO bornés, triés, ids uniques', () => {
    const elos = BOTS.map((b) => b.elo);
    expect(Math.min(...elos)).toBeGreaterThanOrEqual(ELO_MIN);
    expect(Math.max(...elos)).toBeLessThanOrEqual(ELO_MAX);
    expect([...elos].sort((a, b) => a - b)).toEqual(elos);
    expect(new Set(BOTS.map((b) => b.id)).size).toBe(BOTS.length);
  });
});
