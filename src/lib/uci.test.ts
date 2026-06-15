import { describe, it, expect } from 'vitest';
import { parseBestMove, positionCommand, goCommand, strengthCommands } from './uci';

describe('uci', () => {
  it('parse un bestmove simple', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toEqual({ from: 'e2', to: 'e4', promotion: undefined });
  });
  it('parse une promotion', () => {
    expect(parseBestMove('bestmove e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });
  it('renvoie null sur (none) ou bruit', () => {
    expect(parseBestMove('bestmove (none)')).toBeNull();
    expect(parseBestMove('info depth 12 score cp 30')).toBeNull();
  });
  it('compose position et go', () => {
    expect(positionCommand('8/8/8/8/8/8/8/8 w - - 0 1')).toBe('position fen 8/8/8/8/8/8/8/8 w - - 0 1');
    expect(goCommand({ movetime: 250 })).toBe('go movetime 250');
    expect(goCommand({ depth: 6, movetime: 200 })).toBe('go depth 6 movetime 200');
    expect(goCommand({})).toBe('go movetime 300');
  });
  it('compose la force : skill + limit elo', () => {
    const c = strengthCommands({ uciElo: 1500, skill: 8 });
    expect(c).toContain('setoption name Skill Level value 8');
    expect(c).toContain('setoption name UCI_LimitStrength value true');
    expect(c).toContain('setoption name UCI_Elo value 1500');
  });
  it('sans elo : LimitStrength false', () => {
    expect(strengthCommands({})).toContain('setoption name UCI_LimitStrength value false');
  });
});
