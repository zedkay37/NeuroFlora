/* ============================================================
   NEUROFLORA — Panneau Tweaks (OUTIL INTERNE DE DEV)
   Non livré à l'utilisateur : rendu seulement sous import.meta.env.DEV.
   Styles auto-contenus (hors budget CSS produit).
   ============================================================ */
import { useState } from 'react';
import type { Tweaks } from '../../hooks/useTweaks';
import { FONTS, type FontKey } from '../../lib/climate';

const TEMP_PRESETS: [string, string, string][] = [
  ['oklch(0.84 0.155 178)', 'oklch(0.90 0.085 232)', 'oklch(0.83 0.135 83)'],
  ['oklch(0.86 0.16 152)', 'oklch(0.88 0.10 262)', 'oklch(0.82 0.14 60)'],
  ['oklch(0.85 0.15 195)', 'oklch(0.92 0.09 210)', 'oklch(0.80 0.13 95)'],
];

const STYLE = `
.dev-twk-fab{position:fixed;right:14px;bottom:14px;z-index:9999;width:34px;height:34px;
  border-radius:10px;border:1px solid rgba(255,255,255,.18);cursor:pointer;
  background:rgba(20,28,28,.7);color:#9fe;backdrop-filter:blur(8px);font:13px/1 monospace}
.dev-twk{position:fixed;right:14px;bottom:56px;z-index:9999;width:240px;
  display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:12px;
  background:rgba(16,22,22,.86);backdrop-filter:blur(18px);color:#cfe;
  border:1px solid rgba(255,255,255,.14);font:11.5px/1.4 ui-sans-serif,system-ui,sans-serif;
  box-shadow:0 14px 40px rgba(0,0,0,.5)}
.dev-twk h4{margin:0 0 2px;font:600 10px/1 monospace;letter-spacing:.14em;
  text-transform:uppercase;color:#7cc}
.dev-twk label{display:flex;justify-content:space-between;gap:8px;align-items:center}
.dev-twk input[type=range]{width:120px}
.dev-twk .row{display:flex;gap:6px;flex-wrap:wrap}
.dev-twk button.chip{flex:1;min-width:46px;height:24px;border-radius:6px;cursor:pointer;
  border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:inherit}
.dev-twk button.chip[data-on="1"]{outline:2px solid #6ee;background:rgba(110,238,238,.16)}
`;

interface Props {
  t: Tweaks;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

export function DevTweaks({ t, setTweak }: Props) {
  const [open, setOpen] = useState(false);
  const tempKey = JSON.stringify(t.temps);

  return (
    <>
      <style>{STYLE}</style>
      <button className="dev-twk-fab" title="Tweaks (dev)" onClick={() => setOpen((o) => !o)}>
        ✦
      </button>
      {open && (
        <div className="dev-twk">
          <h4>Bioluminescence</h4>
          <label>
            Intensité
            <input
              type="range"
              min={0.3}
              max={1.6}
              step={0.05}
              value={t.bio}
              onChange={(e) => setTweak('bio', Number(e.target.value))}
            />
          </label>
          <label>
            Densité
            <input
              type="range"
              min={0}
              max={1.4}
              step={0.05}
              value={t.density}
              onChange={(e) => setTweak('density', Number(e.target.value))}
            />
          </label>
          <label>
            Respiration
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={t.breathSpeed}
              onChange={(e) => setTweak('breathSpeed', Number(e.target.value))}
            />
          </label>

          <h4>Températures</h4>
          <div className="row">
            {TEMP_PRESETS.map((preset, i) => (
              <button
                key={i}
                className="chip"
                data-on={JSON.stringify(preset) === tempKey ? '1' : '0'}
                style={{ background: preset[0] }}
                onClick={() => setTweak('temps', preset)}
                title={preset.join(' · ')}
              />
            ))}
          </div>

          <h4>Typographie</h4>
          <div className="row">
            {(Object.keys(FONTS) as FontKey[]).map((f) => (
              <button
                key={f}
                className="chip"
                data-on={t.font === f ? '1' : '0'}
                onClick={() => setTweak('font', f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
