/* ============================================================
   NEUROFLORA — Canopée synaptique (le fond vivant)
   3–4 couches de profondeur · parallaxe · spores · respiration
   ============================================================ */
const { useRef, useEffect, useMemo } = React;

function Canopy({ density = 1, climate = 'today' }) {
  const farRef = useRef(null);
  const midRef = useRef(null);
  const nearRef = useRef(null);
  const stageRef = useRef(null);

  // — maillage de dendrites-lianes (généré une fois) —
  const mesh = useMemo(() => {
    const F = window.Fractal;
    const all = [];
    // racines le long des bords, pointant vers l'intérieur
    const roots = [
      // bas
      { x: 12, y: 104, a: -Math.PI / 2 - 0.3, len: 34, seed: 3 },
      { x: 30, y: 106, a: -Math.PI / 2 + 0.2, len: 40, seed: 8 },
      { x: 50, y: 105, a: -Math.PI / 2, len: 30, seed: 21 },
      { x: 70, y: 106, a: -Math.PI / 2 - 0.2, len: 42, seed: 14 },
      { x: 88, y: 104, a: -Math.PI / 2 + 0.3, len: 34, seed: 5 },
      // haut
      { x: 18, y: -4, a: Math.PI / 2 + 0.2, len: 30, seed: 33 },
      { x: 44, y: -6, a: Math.PI / 2, len: 38, seed: 41 },
      { x: 64, y: -5, a: Math.PI / 2 - 0.2, len: 34, seed: 52 },
      { x: 86, y: -4, a: Math.PI / 2 + 0.25, len: 28, seed: 60 },
      // côtés
      { x: -4, y: 38, a: 0.15, len: 30, seed: 71 },
      { x: -5, y: 70, a: -0.2, len: 34, seed: 77 },
      { x: 104, y: 30, a: Math.PI - 0.2, len: 32, seed: 83 },
      { x: 105, y: 66, a: Math.PI + 0.2, len: 36, seed: 90 },
    ];
    roots.forEach((rt, ri) => {
      const segs = F.tree({
        x: rt.x, y: rt.y, angle: rt.a, length: rt.len,
        depth: 5, spread: 0.5, decay: 0.74, branches: 2,
        jitter: 0.35, bow: 0.14, seed: rt.seed
      });
      segs.forEach((s, i) => all.push({ ...s, root: ri, pulse: (ri * 7 + i) % 13 === 0 }));
    });
    return all;
  }, []);

  // — spores bioluminescentes —
  const spores = useMemo(() => {
    const F = window.Fractal;
    const rand = F.rng(999);
    return Array.from({ length: 46 }, (_, i) => ({
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
    const stage = stageRef.current?.closest('.stage') || stageRef.current?.parentElement;
    if (!stage) return;
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5);
      ty = ((e.clientY - r.top) / r.height - 0.5);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      if (farRef.current) farRef.current.style.transform = `translate(${cx * 14}px, ${cy * 10}px) scale(1.08)`;
      if (midRef.current) midRef.current.style.transform = `translate(${cx * 30}px, ${cy * 22}px)`;
      if (nearRef.current) nearRef.current.style.transform = `translate(${cx * 54}px, ${cy * 40}px)`;
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) raf = requestAnimationFrame(tick);
      else raf = null;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="canopy" ref={stageRef} aria-hidden="true">
      <style>{canopyCSS}</style>

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
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g filter="url(#cy-glow)">
            {mesh.map((s, i) => (
              <path key={i} d={s.d} className="mesh-vein"
                style={{
                  '--w': (0.36 - s.depth * 0.05).toFixed(2),
                  '--o': Math.max(0.05, (0.5 - s.depth * 0.08)).toFixed(2),
                }} />
            ))}
            {mesh.filter(s => s.pulse).map((s, i) => (
              <path key={'p' + i} d={s.d} className="mesh-pulse"
                style={{ '--len': s.len.toFixed(1), '--pd': (i * 0.7) + 's' }} />
            ))}
          </g>
        </svg>
      </div>

      {/* COUCHE 2 — spores qui dérivent */}
      <div className="cy-layer cy-near" ref={nearRef}>
        {spores.map((sp, i) => (
          <span key={i} className={'spore ' + sp.hue}
            style={{
              left: sp.x + '%', top: sp.y + '%',
              width: sp.s + 'px', height: sp.s + 'px',
              '--dur': sp.dur + 's', '--delay': sp.delay + 's',
              '--drift': sp.drift + 'px', '--rise': sp.rise + 'px',
              '--op': sp.op,
            }} />
        ))}
      </div>

      {/* COUCHE 3 — vignette / canopée proche hors-foyer */}
      <div className="cy-vignette" />
    </div>
  );
}

const canopyCSS = `
.canopy { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.cy-layer { position: absolute; inset: -8%; will-change: transform; }

/* densité & respiration globales */
.cy-mid { opacity: calc(0.5 + var(--density) * 0.5); transition: opacity 1.2s ease; }
.cy-near { opacity: calc(0.35 + var(--density) * 0.65); transition: opacity 1.2s ease; }
.cy-far { animation: cyBreath var(--breath) ease-in-out infinite; }
@keyframes cyBreath { 0%,100% { filter: brightness(.9); } 50% { filter: brightness(1.12); } }

/* blooms lointains */
.bloom { position: absolute; border-radius: 50%; filter: blur(40px); mix-blend-mode: screen; }
.b1 { width: 46vw; height: 46vw; left: -8vw; top: 8vh;
  background: radial-gradient(circle, color-mix(in oklab, var(--far-violet), transparent 55%), transparent 68%);
  opacity: calc(.4 * var(--bio)); animation: drift1 38s ease-in-out infinite; }
.b2 { width: 52vw; height: 52vw; right: -12vw; top: 30vh;
  background: radial-gradient(circle, color-mix(in oklab, var(--far-magenta), transparent 60%), transparent 66%);
  opacity: calc(.32 * var(--bio)); animation: drift2 46s ease-in-out infinite; }
.b3 { width: 40vw; height: 40vw; left: 30vw; bottom: -14vh;
  background: radial-gradient(circle, color-mix(in oklab, var(--calc-deep), transparent 68%), transparent 64%);
  opacity: calc(.3 * var(--bio)); animation: drift1 52s ease-in-out infinite reverse; }
@keyframes drift1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(4vw,-3vh); } }
@keyframes drift2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-5vw,4vh); } }

/* maillage */
.mesh-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.mesh-vein {
  fill: none; stroke: var(--calc);
  stroke-width: calc(var(--w) * 1px);
  vector-effect: non-scaling-stroke;
  opacity: calc(var(--o) * var(--bio) * 0.85);
  stroke-linecap: round;
}
.mesh-pulse {
  fill: none; stroke: var(--calc);
  stroke-width: 1.1px; vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  filter: drop-shadow(0 0 3px var(--calc));
  stroke-dasharray: 2.5 var(--len);
  stroke-dashoffset: var(--len);
  opacity: calc(.55 * var(--bio));
  animation: meshRun 7s linear infinite;
  animation-delay: var(--pd);
}
@keyframes meshRun { to { stroke-dashoffset: 0; } }

/* spores */
.spore {
  position: absolute; border-radius: 50%;
  background: var(--calc);
  box-shadow: 0 0 6px var(--calc), 0 0 2px white;
  opacity: 0;
  animation: sporeFloat var(--dur) ease-in-out infinite;
  animation-delay: var(--delay);
}
.spore.violet { background: var(--far-magenta); box-shadow: 0 0 6px var(--far-magenta); }
@keyframes sporeFloat {
  0% { opacity: 0; transform: translate(0,0); }
  12% { opacity: calc(var(--op) * var(--bio)); }
  88% { opacity: calc(var(--op) * var(--bio)); }
  100% { opacity: 0; transform: translate(var(--drift), calc(var(--rise) * -1px)); }
}

.cy-vignette {
  position: absolute; inset: 0;
  background:
    radial-gradient(120% 80% at 50% 40%, transparent 48%, color-mix(in oklab, var(--night-0), transparent 35%) 100%),
    linear-gradient(180deg, color-mix(in oklab, var(--night-0), transparent 55%), transparent 22%, transparent 78%, var(--night-0));
  mix-blend-mode: multiply;
}

@media (prefers-reduced-motion: reduce) {
  .mesh-pulse, .spore { animation: none; }
  .spore { opacity: calc(var(--op) * var(--bio) * .8); }
  .cy-far, .bloom { animation: none; }
}
`;

window.Canopy = Canopy;
