/* ============================================================
   NEUROFLORA — Board = clairière / nexus
   3 états · signaux intégrés · mycélium · coordonnées gravées
   ============================================================ */
const { useMemo: useMemoBoard } = React;
const useMemo = useMemoBoard;

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

function sqXY(sq) {
  const file = sq.charCodeAt(0) - 97;       // a..h -> 0..7
  const rank = parseInt(sq[1], 10);         // 1..8
  const row = 8 - rank;                     // rang 8 en haut
  return { x: file + 0.5, y: row + 0.5 };
}

// — mycélium racinaire sous le board —
function Mycelium({ density }) {
  const paths = useMemo(() => {
    const F = window.Fractal;
    const out = [];
    [22, 38, 50, 62, 78].forEach((sx, i) => {
      const segs = F.tree({
        x: sx, y: 0, angle: Math.PI / 2 + (sx - 50) / 120,
        length: 11, depth: 4, spread: 0.55, decay: 0.72,
        branches: 2, jitter: 0.4, bow: 0.12, seed: 30 + i * 9
      });
      segs.forEach(s => out.push({ d: s.d, w: (0.7 - s.depth * 0.12) }));
    });
    return out;
  }, []);
  return (
    <svg className="mycelium" viewBox="0 0 100 36" preserveAspectRatio="none">
      {paths.map((p, i) => (
        <path key={i} d={p.d} style={{ strokeWidth: Math.max(0.18, p.w) + 'px' }}
          vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

function Board({
  position,            // 8x8 [row0=rank8] de {type,color}|null
  selected,            // 'e2' | null
  targets,             // [{ to, capture }]
  lastMove,            // { from, to } | null
  checkSq,             // 'e1' | null
  proofSqs,            // Set de cases
  calcVeins,           // [{ from, to, capture, seed }]
  threat,              // { from, to } | null
  density, climate,
  onSquareClick,
  liftSq,
  showBuds = true,
}) {
  // — géométrie des signaux —
  const calcPaths = useMemo(() => {
    const F = window.Fractal;
    return calcVeins.map((v, i) => {
      const a = sqXY(v.from), b = sqXY(v.to);
      const ven = F.vein(a.x, a.y, b.x, b.y, { bow: 0.18, twigs: 2, twigLen: 0.34, seed: v.seed || (i + 3) });
      return { ...ven, capture: v.capture, idx: i };
    });
  }, [calcVeins]);

  const threatPath = useMemo(() => {
    if (!threat) return null;
    const F = window.Fractal;
    const a = sqXY(threat.from), b = sqXY(threat.to);
    return F.vein(a.x, a.y, b.x, b.y, { bow: 0.12, twigs: 1, twigLen: 0.22, seed: 91 });
  }, [threat]);

  const rows = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = 8 - row;
      const file = String.fromCharCode(97 + col);
      const sq = file + rank;
      const isLight = (row + col) % 2 === 0;
      const pc = position[row][col];
      const tgt = targets.find(t => t.to === sq);
      const sel = selected === sq;
      rows.push(
        <div
          key={sq}
          className={'sq ' + (isLight ? 'light' : 'dark') + (onSquareClick ? ' hot' : '') + (tgt ? ' movable' : '')}
          data-sq={sq}
          data-sel={sel ? 'true' : undefined}
          data-last={lastMove && (lastMove.from === sq || lastMove.to === sq)
            ? (lastMove.from === sq ? 'from' : 'true') : undefined}
          data-check={checkSq === sq ? 'true' : undefined}
          data-proof={proofSqs && proofSqs.has(sq) ? 'true' : undefined}
          onClick={onSquareClick ? () => onSquareClick(sq) : undefined}
        >
          {col === 0 && <span className={'coord rank ' + (isLight ? 'on-light' : 'on-dark')}>{rank}</span>}
          {row === 7 && <span className={'coord file ' + (isLight ? 'on-light' : 'on-dark')}>{file}</span>}
          {tgt && showBuds && <span className={'bud' + (tgt.capture ? ' capture' : '')} style={{ '--d': '0s' }} />}
          {pc && (
            <span className={'piece ' + pc.color + (liftSq === sq ? ' lift' : '')}>
              {GLYPH[pc.type]}
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="board-nexus" data-state={climate}>
      <Mycelium density={density} />
      <div className="board-frame">
        <div className="board-grid">
          {rows}

          {/* OVERLAY de signaux — sous les pièces (z2), au-dessus du damier */}
          <svg className="sig-svg" viewBox="0 0 8 8" preserveAspectRatio="none">
            <defs>
              <filter id="sig-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.04" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* — FLORAISON DE CALCUL : dendrites teal qui poussent — */}
            <g filter="url(#sig-glow)">
              {calcPaths.map((cp, i) => (
                <g key={'c' + i}>
                  <path className="dendrite calc grow" d={cp.main.d}
                    style={{ '--len': cp.main.len.toFixed(2), '--gd': (i * 0.06) + 's',
                             strokeWidth: 0.05, opacity: 0.92 }} />
                  {cp.twigs.map((tw, j) => (
                    <path key={j} className="dendrite calc-twig grow" d={tw.d}
                      style={{ '--len': tw.len.toFixed(2), '--gd': (i * 0.06 + 0.28) + 's',
                               strokeWidth: 0.028, opacity: 0.6 }} />
                  ))}
                  <path className="dendrite calc pulse" d={cp.main.d}
                    style={{ '--len': cp.main.len.toFixed(2), strokeWidth: 0.06,
                             filter: 'drop-shadow(0 0 1.5px var(--calc))' }} />
                </g>
              ))}
            </g>

            {/* — SIGNAL DE MENACE : synapse froide qui court — */}
            {threatPath && (
              <g filter="url(#sig-glow)">
                <path className="dendrite threat grow" d={threatPath.main.d}
                  style={{ '--len': threatPath.main.len.toFixed(2), '--gd': '0s',
                           strokeWidth: 0.04, opacity: 0.85 }} />
                <path className="dendrite threat" d={threatPath.main.d}
                  style={{ strokeWidth: 0.075, '--len': threatPath.main.len.toFixed(2),
                           strokeDasharray: '0.32 ' + threatPath.main.len.toFixed(2),
                           filter: 'drop-shadow(0 0 2px var(--threat))',
                           animation: 'coldRun 1.1s linear infinite' }} />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

// keyframe pour la course froide de la menace
(function () {
  const s = document.createElement('style');
  s.textContent = `@keyframes coldRun { from { stroke-dashoffset: var(--len, 8); } to { stroke-dashoffset: 0; } }
  .dendrite.threat { stroke-dashoffset: 0; }
  @media (prefers-reduced-motion: reduce){ .dendrite.threat[style*="coldRun"]{ animation:none !important; stroke-dasharray:none !important; } }`;
  document.head.appendChild(s);
})();

window.Board = Board;
window.sqXY = sqXY;
