/* ============================================================
   NEUROFLORA — Fractal
   Un seul motif de branchement fractal partout :
   nervure de feuille = dendrite de neurone = arbre de variantes.
   Plain JS — exposé sur window.Fractal.
   ============================================================ */
(function () {
  // PRNG déterministe (mulberry32) — pour que reduced-motion soit identique
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Un segment courbe (quadratique) avec contrôle perpendiculaire — feel liane/nervure
  function curvedPath(x1, y1, x2, y2, bow) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    // normale
    const nx = -dy / len, ny = dx / len;
    const cx = mx + nx * bow * len;
    const cy = my + ny * bow * len;
    return `M ${r(x1)} ${r(y1)} Q ${r(cx)} ${r(cy)} ${r(x2)} ${r(y2)}`;
  }
  const r = (n) => Math.round(n * 1000) / 1000;

  function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

  /* Arbre dendritique récursif.
     Renvoie [{d, len, depth, dist}] — d = path string, dist = distance cumulée au tronc
     (sert au délai de croissance pour l'effet « ça pousse vers l'extérieur »). */
  function tree(opts) {
    const o = Object.assign({
      x: 0, y: 0, angle: -Math.PI / 2, length: 1,
      depth: 4, spread: 0.55, decay: 0.72, branches: 2,
      jitter: 0.25, bow: 0.12, seed: 7
    }, opts);
    const rand = rng(o.seed);
    const segs = [];
    (function rec(x, y, angle, length, depth, cumDist) {
      if (depth <= 0 || length < o.length * 0.04) return;
      const x2 = x + Math.cos(angle) * length;
      const y2 = y + Math.sin(angle) * length;
      const bow = (rand() - 0.5) * 2 * o.bow;
      segs.push({
        d: curvedPath(x, y, x2, y2, bow),
        len: dist(x, y, x2, y2) * (1 + Math.abs(bow) * 0.6),
        depth: o.depth - depth,
        dist: cumDist
      });
      const n = o.branches;
      for (let i = 0; i < n; i++) {
        const off = n === 1 ? 0 : (i - (n - 1) / 2);
        const a = angle + off * o.spread + (rand() - 0.5) * o.jitter;
        rec(x2, y2, a, length * o.decay * (0.86 + rand() * 0.28),
            depth - 1, cumDist + length);
      }
    })(o.x, o.y, o.angle, o.length, o.depth, 0);
    return segs;
  }

  /* Dendrite dirigée : du point A vers le point B, courbée, avec petites brindilles.
     Utilisée pour la floraison de calcul (case -> case candidate) et le signal de menace. */
  function vein(x1, y1, x2, y2, opts) {
    const o = Object.assign({ bow: 0.16, twigs: 2, twigLen: 0.5, seed: 3 }, opts);
    const rand = rng(o.seed);
    const sign = (rand() > 0.5 ? 1 : -1);
    const main = curvedPath(x1, y1, x2, y2, o.bow * sign);
    const L = dist(x1, y1, x2, y2);
    const twigs = [];
    for (let i = 0; i < o.twigs; i++) {
      const t = 0.45 + 0.42 * (i / Math.max(1, o.twigs - 1)) + (rand() - 0.5) * 0.1;
      // point sur la droite (approx) + direction
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const ang = Math.atan2(y2 - y1, x2 - x1) + (rand() > 0.5 ? 1 : -1) * (0.7 + rand() * 0.5);
      const tl = L * o.twigLen * (0.5 + rand() * 0.6);
      const tx = px + Math.cos(ang) * tl;
      const ty = py + Math.sin(ang) * tl;
      twigs.push({ d: curvedPath(px, py, tx, ty, (rand() - 0.5) * 0.4), len: dist(px, py, tx, ty) });
    }
    return { main: { d: main, len: L * (1 + Math.abs(o.bow) * 0.6) }, twigs };
  }

  /* Marque / logo — une petite dendrite symétrique compacte */
  function mark(seed) {
    const segs = tree({
      x: 11, y: 21, angle: -Math.PI / 2, length: 6.4,
      depth: 4, spread: 0.62, decay: 0.7, branches: 2,
      jitter: 0.18, bow: 0.16, seed: seed || 11
    });
    return segs;
  }

  window.Fractal = { rng, tree, vein, mark, curvedPath };
})();
