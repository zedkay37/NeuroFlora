/* Jauge bioluminescente : la sève monte, teal → or. Méritée, jamais un %. */
import { type CSSProperties } from 'react';

interface Props {
  ratio: number;
  tier: string;
  presented: number;
}

export function PrecisionGauge({ ratio, tier, presented }: Props) {
  return (
    <div className="gauge" data-live={presented > 0} style={{ '--fill': ratio.toFixed(3) } as CSSProperties}>
      <div className="gauge-eyebrow">Précision de lecture</div>
      <div className="gauge-track" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={ratio} aria-label="Précision de lecture">
        <div className="gauge-fill" />
      </div>
      <div className="gauge-tier">{tier}</div>
    </div>
  );
}
