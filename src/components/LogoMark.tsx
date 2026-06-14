/* Logo : une dendrite compacte — le motif fractal, partout. */
import { useMemo } from 'react';
import { mark } from '../lib/fractal';

export function LogoMark() {
  const segs = useMemo(() => mark(11), []);
  return (
    <svg width="30" height="34" viewBox="0 0 22 26" aria-hidden="true">
      <defs>
        <filter id="logo-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#logo-glow)" stroke="var(--calc)" fill="none" strokeLinecap="round">
        {segs.map((s, i) => (
          <path
            key={i}
            d={s.d}
            strokeWidth={Math.max(0.5, 1.5 - s.depth * 0.3)}
            opacity={Math.max(0.35, 0.95 - s.depth * 0.13)}
          />
        ))}
      </g>
      <circle cx="11" cy="21" r="1.5" fill="var(--calc)" filter="url(#logo-glow)" />
    </svg>
  );
}
