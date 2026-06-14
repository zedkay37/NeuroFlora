/* ============================================================
   NEUROFLORA — Canopée synaptique (le fond vivant)
   Couches de profondeur · parallaxe · spores · respiration.
   Géométrie déterministe (PRNG) → reduced-motion identique.
   ============================================================ */
import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Fractal, type Seg } from '../lib/fractal';

type MeshSeg = Seg & { root: number; pulse: boolean };

interface Spore {
  x: number;
  y: number;
  s: number;
  dur: number;
  delay: number;
  drift: number;
  rise: number;
  hue: 'violet' | 'teal';
  op: number;
}

const sv = (o: Record<string, string | number>): CSSProperties => o as CSSProperties;

export function Canopy() {
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // — maillage de dendrites-lianes (généré une fois) —
  const mesh = useMemo<MeshSeg[]>(() => {
    const all: MeshSeg[] = [];
    const roots = [
      { x: 12, y: 104, a: -Math.PI / 2 - 0.3, len: 34, seed: 3 },
      { x: 30, y: 106, a: -Math.PI / 2 + 0.2, len: 40, seed: 8 },
      { x: 50, y: 105, a: -Math.PI / 2, len: 30, seed: 21 },
      { x: 70, y: 106, a: -Math.PI / 2 - 0.2, len: 42, seed: 14 },
      { x: 88, y: 104, a: -Math.PI / 2 + 0.3, len: 34, seed: 5 },
      { x: 18, y: -4, a: Math.PI / 2 + 0.2, len: 30, seed: 33 },
      { x: 44, y: -6, a: Math.PI / 2, len: 38, seed: 41 },
      { x: 64, y: -5, a: Math.PI / 2 - 0.2, len: 34, seed: 52 },
      { x: 86, y: -4, a: Math.PI / 2 + 0.25, len: 28, seed: 60 },
      { x: -4, y: 38, a: 0.15, len: 30, seed: 71 },
      { x: -5, y: 70, a: -0.2, len: 34, seed: 77 },
      { x: 104, y: 30, a: Math.PI - 0.2, len: 32, seed: 83 },
      { x: 105, y: 66, a: Math.PI + 0.2, len: 36, seed: 90 },
    ];
    roots.forEach((rt, ri) => {
      const segs = Fractal.tree({
        x: rt.x,
        y: rt.y,
        angle: rt.a,
        length: rt.len,
        depth: 5,
        spread: 0.5,
        decay: 0.74,
        branches: 2,
        jitter: 0.35,
        bow: 0.14,
        seed: rt.seed,
      });
      segs.forEach((s, i) => all.push({ ...s, root: ri, pulse: (ri * 7 + i) % 13 === 0 }));
    });
    return all;
  }, []);

  // — spores bioluminescentes —
  const spores = useMemo<Spore[]>(() => {
    const rand = Fractal.rng(999);
    return Array.from({ length: 46 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      s: 1 + rand() * 3.2,
      dur: 14 + rand() * 26,
      delay: -rand() * 30,
      drift: (rand() - 0.5) * 40,
      rise: 20 + rand() * 50,
      hue: rand() > 0.78 ? 'violet' : 'teal',
      op: 0.25 + rand() * 0.6,
    }));
  }, []);

  // — parallaxe douce —
  useEffect(() => {
    const stage = stageRef.current?.closest('.stage') as HTMLElement | null;
    if (!stage) return;
    let raf: number | null = null;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (farRef.current) farRef.current.style.transform = `translate(${cx * 14}px, ${cy * 10}px) scale(1.08)`;
      if (midRef.current) midRef.current.style.transform = `translate(${cx * 30}px, ${cy * 22}px)`;
      if (nearRef.current) nearRef.current.style.transform = `translate(${cx * 54}px, ${cy * 40}px)`;
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
      else raf = null;
    };
    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="canopy" ref={stageRef} aria-hidden="true">
      {/* COUCHE 0 — profondeur lointaine : blooms violet/magenta sourds, flous */}
      <div className="cy-layer cy-far" ref={farRef}>
        <div className="bloom b1" />
        <div className="bloom b2" />
        <div className="bloom b3" />
      </div>

      {/* COUCHE 1 — maillage de dendrites-lianes */}
      <div className="cy-layer cy-mid" ref={midRef}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mesh-svg">
          <defs>
            <filter id="cy-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#cy-glow)">
            {mesh.map((s, i) => (
              <path
                key={i}
                d={s.d}
                className="mesh-vein"
                style={sv({
                  '--w': (0.36 - s.depth * 0.05).toFixed(2),
                  '--o': Math.max(0.05, 0.5 - s.depth * 0.08).toFixed(2),
                })}
              />
            ))}
            {mesh
              .filter((s) => s.pulse)
              .map((s, i) => (
                <path
                  key={'p' + i}
                  d={s.d}
                  className="mesh-pulse"
                  style={sv({ '--len': s.len.toFixed(1), '--pd': i * 0.7 + 's' })}
                />
              ))}
          </g>
        </svg>
      </div>

      {/* COUCHE 2 — spores qui dérivent */}
      <div className="cy-layer cy-near" ref={nearRef}>
        {spores.map((sp, i) => (
          <span
            key={i}
            className={'spore ' + sp.hue}
            style={sv({
              left: sp.x + '%',
              top: sp.y + '%',
              width: sp.s + 'px',
              height: sp.s + 'px',
              '--dur': sp.dur + 's',
              '--delay': sp.delay + 's',
              '--drift': sp.drift + 'px',
              '--rise': sp.rise + 'px',
              '--op': sp.op,
            })}
          />
        ))}
      </div>

      {/* COUCHE 3 — vignette / canopée proche hors-foyer */}
      <div className="cy-vignette" />
    </div>
  );
}
