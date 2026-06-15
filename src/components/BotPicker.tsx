/* Palette d'adversaires : créatures Fractal de maturité croissante. */
import { useMemo, type CSSProperties } from 'react';
import { Fractal } from '../lib/fractal';
import { BOTS, type Bot } from '../lib/bots';

function BotGlyph({ bot }: { bot: Bot }) {
  const segs = useMemo(
    () =>
      Fractal.tree({
        x: 11,
        y: 21,
        angle: -Math.PI / 2,
        length: 6.4,
        depth: bot.depth,
        spread: 0.6,
        decay: 0.72,
        branches: 2,
        jitter: 0.2,
        bow: 0.16,
        seed: bot.elo,
      }),
    [bot],
  );
  return (
    <svg width="24" height="28" viewBox="0 0 22 26" aria-hidden="true">
      <g stroke={bot.hue} fill="none" strokeLinecap="round">
        {segs.map((s, i) => (
          <path key={i} d={s.d} strokeWidth={Math.max(0.5, 1.5 - s.depth * 0.3)} opacity={Math.max(0.4, 0.95 - s.depth * 0.12)} />
        ))}
      </g>
      <circle cx="11" cy="21" r="1.4" fill={bot.hue} />
    </svg>
  );
}

export function BotPicker({ value, onSelect }: { value: string; onSelect: (b: Bot) => void }) {
  return (
    <div className="bots">
      <div className="bots-title">Adversaire</div>
      <div className="bots-list" role="radiogroup" aria-label="Choix de l'adversaire">
        {BOTS.map((b) => (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={b.id === value}
            className="bot"
            data-on={b.id === value}
            style={{ '--bot': b.hue } as CSSProperties}
            onClick={() => onSelect(b)}
            title={`${b.blurb} (~${b.elo})`}
          >
            <BotGlyph bot={b} />
            <span className="bot-name">{b.name}</span>
            <span className="bot-elo">~{b.elo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
