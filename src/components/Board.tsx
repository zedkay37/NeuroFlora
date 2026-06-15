/* ============================================================
   NEUROFLORA — Board = clairière / nexus
   3 états · signaux intégrés (floraison, menace) · mycélium.
   Props-driven et indépendant.
   ============================================================ */
import { useMemo, type CSSProperties } from 'react';
import type { Color, PieceSymbol, Square } from 'chess.js';
import { Fractal } from '../lib/fractal';
import type { ClimateKey } from '../lib/climate';
import type { CalcVein, LastMove } from '../hooks/useNeuroGame';
import { FR, type MoveTarget, type Threat } from '../lib/engine';

type Cell = { square: Square; type: PieceSymbol; color: Color } | null;

const GLYPH: Record<PieceSymbol, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

// libellé accessible d'une case
function squareLabel(sq: string, pc: Cell): string {
  if (!pc) return `${sq}, vide`;
  return `${sq}, ${FR[pc.type]} ${pc.color === 'w' ? 'ivoire' : 'graphite'}`;
}

// petit cast pour les variables CSS custom dans `style`
const sv = (o: Record<string, string | number>): CSSProperties => o as CSSProperties;

function sqXY(sq: string): { x: number; y: number } {
  const file = sq.charCodeAt(0) - 97; // a..h -> 0..7
  const rank = parseInt(sq[1], 10); // 1..8
  const row = 8 - rank; // rang 8 en haut
  return { x: file + 0.5, y: row + 0.5 };
}

// — mycélium racinaire sous le board —
function Mycelium() {
  const paths = useMemo(() => {
    const out: { d: string; w: number }[] = [];
    [22, 38, 50, 62, 78].forEach((sx, i) => {
      const segs = Fractal.tree({
        x: sx,
        y: 0,
        angle: Math.PI / 2 + (sx - 50) / 120,
        length: 11,
        depth: 4,
        spread: 0.55,
        decay: 0.72,
        branches: 2,
        jitter: 0.4,
        bow: 0.12,
        seed: 30 + i * 9,
      });
      segs.forEach((s) => out.push({ d: s.d, w: 0.7 - s.depth * 0.12 }));
    });
    return out;
  }, []);
  return (
    <svg className="mycelium" viewBox="0 0 100 36" preserveAspectRatio="none">
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          style={{ strokeWidth: Math.max(0.18, p.w) + 'px' }}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export interface BoardProps {
  position: Cell[][];
  selected: Square | null;
  targets: MoveTarget[];
  lastMove: LastMove | null;
  checkSq: Square | null;
  proofSqs: Set<string>;
  calcVeins: CalcVein[];
  threat: Threat | null;
  climate: ClimateKey;
  onSquareClick: (sq: Square) => void;
  showBuds?: boolean;
}

export function Board({
  position,
  selected,
  targets,
  lastMove,
  checkSq,
  proofSqs,
  calcVeins,
  threat,
  climate,
  onSquareClick,
  showBuds = true,
}: BoardProps) {
  // — géométrie des signaux —
  const calcPaths = useMemo(
    () =>
      calcVeins.map((v, i) => {
        const a = sqXY(v.from);
        const b = sqXY(v.to);
        const ven = Fractal.vein(a.x, a.y, b.x, b.y, {
          bow: 0.18,
          twigs: 2,
          twigLen: 0.34,
          seed: v.seed || i + 3,
        });
        return { ...ven, capture: v.capture, idx: i };
      }),
    [calcVeins],
  );

  const threatPath = useMemo(() => {
    if (!threat) return null;
    const a = sqXY(threat.from);
    const b = sqXY(threat.to);
    return Fractal.vein(a.x, a.y, b.x, b.y, { bow: 0.12, twigs: 1, twigLen: 0.22, seed: 91 });
  }, [threat]);

  const rows = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = 8 - row;
      const file = String.fromCharCode(97 + col);
      const sq = (file + rank) as Square;
      const isLight = (row + col) % 2 === 0;
      const pc = position[row][col];
      const tgt = targets.find((t) => t.to === sq);
      const sel = selected === sq;
      rows.push(
        <div
          key={sq}
          className={'sq ' + (isLight ? 'light' : 'dark') + ' hot' + (tgt ? ' movable' : '')}
          data-sq={sq}
          data-sel={sel ? 'true' : undefined}
          data-last={
            lastMove && (lastMove.from === sq || lastMove.to === sq)
              ? lastMove.from === sq
                ? 'from'
                : 'true'
              : undefined
          }
          data-check={checkSq === sq ? 'true' : undefined}
          data-proof={proofSqs.has(sq) ? 'true' : undefined}
          role="gridcell"
          aria-label={squareLabel(sq, pc)}
          onClick={() => onSquareClick(sq)}
        >
          {col === 0 && (
            <span className={'coord rank ' + (isLight ? 'on-light' : 'on-dark')}>{rank}</span>
          )}
          {row === 7 && (
            <span className={'coord file ' + (isLight ? 'on-light' : 'on-dark')}>{file}</span>
          )}
          {tgt && showBuds && (
            <span className={'bud' + (tgt.capture ? ' capture' : '')} style={sv({ '--d': '0s' })} />
          )}
          {pc && <span className={'piece ' + pc.color}>{GLYPH[pc.type]}</span>}
        </div>,
      );
    }
  }

  return (
    <div className="board-nexus" data-state={climate}>
      <Mycelium />
      <div className="board-frame">
        <div className="board-grid" role="grid" aria-label="Échiquier">

          {rows}

          {/* OVERLAY de signaux — au-dessus du damier, sous le glow des pièces */}
          <svg className="sig-svg" viewBox="0 0 8 8" preserveAspectRatio="none">
            <defs>
              <filter id="sig-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.04" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* — FLORAISON DE CALCUL : dendrites teal qui poussent — */}
            <g filter="url(#sig-glow)">
              {calcPaths.map((cp, i) => (
                <g key={'c' + i}>
                  <path
                    className="dendrite calc grow"
                    d={cp.main.d}
                    style={sv({
                      '--len': cp.main.len.toFixed(2),
                      '--gd': i * 0.06 + 's',
                      strokeWidth: 0.05,
                      opacity: 0.92,
                    })}
                  />
                  {cp.twigs.map((tw, j) => (
                    <path
                      key={j}
                      className="dendrite calc-twig grow"
                      d={tw.d}
                      style={sv({
                        '--len': tw.len.toFixed(2),
                        '--gd': i * 0.06 + 0.28 + 's',
                        strokeWidth: 0.028,
                        opacity: 0.6,
                      })}
                    />
                  ))}
                  <path
                    className="dendrite calc pulse"
                    d={cp.main.d}
                    style={sv({
                      '--len': cp.main.len.toFixed(2),
                      strokeWidth: 0.06,
                      filter: 'drop-shadow(0 0 1.5px var(--calc))',
                    })}
                  />
                </g>
              ))}
            </g>

            {/* — SIGNAL DE MENACE : synapse froide qui court — */}
            {threatPath && (
              <g filter="url(#sig-glow)">
                <path
                  className="dendrite threat grow"
                  d={threatPath.main.d}
                  style={sv({
                    '--len': threatPath.main.len.toFixed(2),
                    '--gd': '0s',
                    strokeWidth: 0.04,
                    opacity: 0.85,
                  })}
                />
                <path
                  className="dendrite threat cold"
                  d={threatPath.main.d}
                  style={sv({
                    strokeWidth: 0.075,
                    '--len': threatPath.main.len.toFixed(2),
                    strokeDasharray: '0.32 ' + threatPath.main.len.toFixed(2),
                    filter: 'drop-shadow(0 0 2px var(--threat))',
                  })}
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
