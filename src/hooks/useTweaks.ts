/* ============================================================
   NEUROFLORA — useTweaks (outil INTERNE de dev)
   Source de vérité des réglages visuels. Le panneau n'est rendu
   qu'en dev ; en prod les valeurs restent les défauts.
   ============================================================ */
import { useCallback, useState } from 'react';
import type { FontKey } from '../lib/climate';

export interface Tweaks {
  bio: number;
  density: number;
  breathSpeed: number;
  temps: [string, string, string];
  font: FontKey;
}

export const TWEAK_DEFAULTS: Tweaks = {
  bio: 1,
  density: 1,
  breathSpeed: 1,
  temps: ['oklch(0.84 0.155 178)', 'oklch(0.90 0.085 232)', 'oklch(0.83 0.135 83)'],
  font: 'cormorant',
};

export function useTweaks() {
  const [values, setValues] = useState<Tweaks>(TWEAK_DEFAULTS);
  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);
  return [values, setTweak] as const;
}
