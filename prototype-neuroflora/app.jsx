/* ============================================================
   NEUROFLORA — App
   Règles d'échecs réelles (chess.js) · 4 climats · 3 températures
   ============================================================ */
const { useState, useCallback, useRef: useRefA, useEffect: useEffectA } = React;

const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const FR = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const GUIDED_FEN = 'r1bqkb1r/ppp2ppp/2np1n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 1';

const CLIMATE = {
  today:   { label: 'Aujourd’hui', density: 1.00, bio: 1.00, breath: 11, accent: 'var(--calc)',   temp: 'var(--calc)' },
  guided:  { label: 'Guidage',     density: 0.82, bio: 1.16, breath: 9,  accent: 'var(--proof)',  temp: 'var(--proof)' },
  silence: { label: 'Silence',     density: 0.04, bio: 0.34, breath: 17, accent: 'var(--threat)', temp: 'var(--threat)' },
  proof:   { label: 'Preuve déposée', density: 0.5, bio: 0.88, breath: 12, accent: 'var(--proof)', temp: 'var(--proof)' },
};

const FONTS = {
  cormorant: { display: "'Cormorant', Georgia, serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
  spectral:  { display: "'Spectral', Georgia, serif",  sans: "'Hanken Grotesk', system-ui, sans-serif" },
  marcellus: { display: "'Marcellus', Georgia, serif", sans: "'Hanken Grotesk', system-ui, sans-serif" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bio": 1,
  "density": 1,
  "breathSpeed": 1,
  "temps": ["oklch(0.84 0.155 178)", "oklch(0.90 0.085 232)", "oklch(0.83 0.135 83)"],
  "font": "cormorant"
}/*EDITMODE-END*/;

// — IA gloutonne sobre (l'adversaire) —
function aiMove(game) {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  let best = null, bestScore = -1e9;
  for (const m of moves) {
    let s = 0;
    if (m.captured) s += 10 * VAL[m.captured];
    if (m.flags.includes('e')) s += 10;
    // centralité douce
    const f = m.to.charCodeAt(0) - 97, r = parseInt(m.to[1], 10) - 1;
    s += 2 - (Math.abs(3.5 - f) + Math.abs(3.5 - r)) * 0.25;
    // risque : la case d'arrivée est-elle reprise ?
    const g2 = new Chess(game.fen());
    g2.move({ from: m.from, to: m.to, promotion: 'q' });
    const recap = g2.moves({ verbose: true }).some(x => x.to === m.to);
    if (recap) s -= 8 * VAL[m.piece];
    if (m.san.includes('#')) s += 1000;
    if (m.san.includes('+')) s += 2;
    s += Math.random() * 1.4;
    if (s > bestScore) { bestScore = s; best = m; }
  }
  return best;
}

// — détection de menace : un signal froid (pièce ennemie -> ma pièce qui pend) —
function detectThreat(game) {
  try {
    if (game.in_check()) return null;
    const parts = game.fen().split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    parts[3] = '-';
    const enemy = new Chess(parts.join(' '));
    const caps = enemy.moves({ verbose: true }).filter(m => m.captured);
    let best = null, bestGain = 0;
    for (const c of caps) {
      const g2 = new Chess(parts.join(' '));
      try { g2.move({ from: c.from, to: c.to, promotion: 'q' }); } catch (e) { continue; }
      const recap = g2.moves({ verbose: true }).some(x => x.to === c.to);
      const gain = VAL[c.captured] - (recap ? VAL[c.piece] : 0);
      // priorité aux vraies pièces qui pendent
      const score = gain + (recap ? 0 : 0.5);
      if (gain > 0 && score > bestGain) { bestGain = score; best = { from: c.from, to: c.to, victim: c.captured, undefended: !recap }; }
    }
    return best;
  } catch (e) { return null; }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const gameRef = useRefA(null);
  if (!gameRef.current) gameRef.current = new Chess(START);

  const [, force] = useState(0);
  const redraw = useCallback(() => force(n => n + 1), []);

  const [climate, setClimate] = useState('today');
  const [orient, setOrient] = useState('w');
  const [selected, setSelected] = useState(null);
  const [targets, setTargets] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [threat, setThreat] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [proofSqs, setProofSqs] = useState(() => new Set());
  const [coach, setCoach] = useState(null);
  const [liftSq, setLiftSq] = useState(null);
  const pendingThreat = useRefA(null);
  const provedAt = useRefA(0);
  const aiTimer = useRefA(null);

  const game = gameRef.current;
  const showGuides = climate !== 'silence';

  // position matricielle [row0 = rang 8]
  const position = game.board();

  // — recalcul de menace + coach après chaque position —
  const refreshThreat = useCallback((g) => {
    const th = (climate === 'silence') ? null : detectThreat(g);
    setThreat(showGuides && th ? th : null);
    pendingThreat.current = th;
    return th;
  }, [climate, showGuides]);

  // — clic sur une case —
  const onSquareClick = useCallback((sq) => {
    if (game.game_over()) return;
    const piece = position[8 - parseInt(sq[1], 10)][sq.charCodeAt(0) - 97];
    // jouer un coup si c'est une cible
    const tgt = targets.find(x => x.to === sq);
    if (selected && tgt) {
      const before = pendingThreat.current;
      game.move({ from: selected, to: sq, promotion: 'q' });
      setLastMove({ from: selected, to: sq });
      setSelected(null); setTargets([]);
      // preuve : la menace vue a-t-elle été désamorcée ?
      if (before) {
        const enemy = new Chess(game.fen());
        const stillCap = enemy.moves({ verbose: true }).some(m => m.to === before.to && m.captured);
        if (!stillCap) depositProof(before, sq);
      }
      redraw();
      scheduleAI();
      return;
    }
    // sélectionner sa propre pièce
    if (piece && piece.color === game.turn()) {
      setSelected(sq);
      const ms = game.moves({ square: sq, verbose: true });
      setTargets(ms.map(m => ({ to: m.to, capture: !!m.captured || m.flags.includes('e') })));
      setCoach({
        eyebrow: 'Floraison de calcul',
        temp: 'var(--calc)',
        line: ms.length
          ? <>Le calcul <em>fleurit</em> — {ms.length} {ms.length > 1 ? 'lignes candidates' : 'ligne candidate'}.</>
          : <>Aucune voie. La pièce est <em>murée</em>.</>,
        hint: 'Chaque dendrite est une variante. Suis-en une.'
      });
      return;
    }
    // clic à vide -> désélection
    setSelected(null); setTargets([]);
    syncCoach();
  }, [game, position, selected, targets, redraw]);

  // — l'adversaire répond —
  const scheduleAI = useCallback(() => {
    clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => {
      if (game.game_over() || game.turn() === orient) { afterPosition(); return; }
      const m = aiMove(game);
      if (m) {
        game.move({ from: m.from, to: m.to, promotion: 'q' });
        setLastMove({ from: m.from, to: m.to });
      }
      redraw();
      afterPosition();
    }, 620);
  }, [game, orient, redraw]);

  // — déposer une preuve dorée —
  const depositProof = useCallback((th, destSq) => {
    provedAt.current = Date.now();
    const label = th.undefended
      ? `Pièce sauvée — la voie tient`
      : `Échange neutralisé`;
    setProofs(p => [{
      id: Date.now(),
      label,
      meta: `${FR[th.victim] || 'pièce'} · menace vue`
    }, ...p].slice(0, 4));
    setProofSqs(s => { const n = new Set(s); n.add(destSq || th.to); return n; });
    setCoach({
      eyebrow: 'Preuve déposée', temp: 'var(--proof)',
      line: <>La synapse dorée <em>reste</em>. Tu as vu avant de calculer.</>,
      hint: 'La mémoire se forme. La voie est gravée.'
    });
  }, [lastMove]);

  // — après stabilisation de la position —
  const afterPosition = useCallback(() => {
    const th = refreshThreat(game);
    if (game.in_checkmate()) {
      setCoach({ eyebrow: 'Fin', temp: 'var(--threat)', line: <>Échec et mat. Le réseau se fige.</>, hint: '' });
    } else if (!selected && Date.now() - provedAt.current > 2600) {
      syncCoach(th);
    }
  }, [game, refreshThreat, selected]);

  const syncCoach = useCallback((th) => {
    const t2 = th !== undefined ? th : pendingThreat.current;
    if (climate === 'silence') { setCoach(null); return; }
    if (t2 && showGuides) {
      setCoach({
        eyebrow: 'Signal de menace', temp: 'var(--threat)',
        line: <>Une synapse <em>froide</em> court vers ton {FR[t2.victim]}.</>,
        hint: 'Vois la menace avant de calculer. Puis réponds.'
      });
    } else {
      setCoach({
        eyebrow: CLIMATE[climate].label, temp: CLIMATE[climate].accent,
        line: climate === 'proof'
          ? <>Les voies prouvées <em>brillent</em>, apaisées.</>
          : <>Une seule priorité. <em>Respire</em>, puis calcule.</>,
        hint: climate === 'proof' ? 'Ce qui est prouvé reste gravé.' : 'Sélectionne une pièce : son calcul fleurit.'
      });
    }
  }, [climate, showGuides]);

  // recompute coach/threat quand le climat change
  useEffectA(() => {
    if (!selected) syncCoach();
    setThreat(climate === 'silence' ? null : pendingThreat.current);
  }, [climate]);

  // menace initiale au montage
  useEffectA(() => { afterPosition(); }, []);
  useEffectA(() => () => clearTimeout(aiTimer.current), []);

  // — nouvelle partie / position guidée —
  const newGame = useCallback((fen, clim) => {
    clearTimeout(aiTimer.current);
    gameRef.current = new Chess(fen || START);
    setSelected(null); setTargets([]); setLastMove(null);
    setProofs([]); setProofSqs(new Set());
    setOrient('w');
    if (clim) setClimate(clim);
    pendingThreat.current = null;
    redraw();
    setTimeout(() => { const th = refreshThreat(gameRef.current); syncCoach(th); }, 30);
  }, [redraw, refreshThreat, syncCoach]);

  // — calcul des veines (floraison) —
  const calcVeins = (showGuides && selected)
    ? targets.map((tg, i) => ({ from: selected, to: tg.to, capture: tg.capture, seed: i + 5 }))
    : [];

  const checkSq = game.in_check() ? findKing(game, game.turn()) : null;

  // — variables CSS pilotées par climat × tweaks —
  const cfg = CLIMATE[climate];
  const temps = t.temps || TWEAK_DEFAULTS.temps;
  const ft = FONTS[t.font] || FONTS.cormorant;
  const stageStyle = {
    '--bio': (cfg.bio * t.bio).toFixed(3),
    '--density': (cfg.density * t.density).toFixed(3),
    '--breath': (cfg.breath / Math.max(0.4, t.breathSpeed)).toFixed(1) + 's',
    '--clearing': (climate === 'silence' ? 1 : 0.7),
    '--accent': cfg.accent,
    '--temp': cfg.temp,
    '--calc': temps[0],
    '--threat': temps[1],
    '--proof': temps[2],
    '--display': ft.display,
    '--sans': ft.sans,
  };

  const turnName = game.turn() === 'w' ? 'Ivoire' : 'Graphite';
  const flankStyle = {
    opacity: climate === 'silence' ? 0.1 : 1,
    pointerEvents: climate === 'silence' ? 'none' : 'auto',
    transition: 'opacity .9s ease, transform .9s ease',
  };

  return (
    <div className="stage" data-climate={climate} style={stageStyle}>
      <Canopy density={cfg.density * t.density} climate={climate} />

      <div className="scene">
        <header className="brand">
          <div className="brand-mark">
            <LogoMark />
            <div>
              <div className="brand-word">Neuro<b>flora</b></div>
              <div className="brand-sub">la preuve silencieuse</div>
            </div>
          </div>
          <div className="climates" style={{ '--accent': cfg.accent }}>
            {Object.keys(CLIMATE).map(k => (
              <button key={k} className="climate-btn" data-on={climate === k}
                style={{ '--accent': CLIMATE[k].accent }}
                onClick={() => { setSelected(null); setTargets([]); setClimate(k); }}>
                {CLIMATE[k].label}
              </button>
            ))}
          </div>
        </header>

        <main className="play">
          {/* — flanc gauche : coach minimal — */}
          <div className="flank left" style={flankStyle}>
            {coach && (
              <div className="coach" style={{ '--temp': coach.temp }}>
                <div className="coach-eyebrow">{coach.eyebrow}</div>
                <div className="coach-line">{coach.line}</div>
                {coach.hint && <div className="coach-hint">{coach.hint}</div>}
                <div className="threat-read" data-on={!!threat && showGuides}>
                  <span className="pip" />
                  {threat && `${threat.from.toUpperCase()} → ${threat.to.toUpperCase()} · ${FR[threat.victim]}`}
                </div>
              </div>
            )}
          </div>

          {/* — board — */}
          <Board
            position={position}
            selected={selected}
            targets={targets}
            showBuds={showGuides}
            lastMove={lastMove}
            checkSq={checkSq}
            proofSqs={proofSqs}
            calcVeins={calcVeins}
            threat={threat}
            density={cfg.density * t.density}
            climate={climate}
            onSquareClick={onSquareClick}
            liftSq={liftSq}
          />

          {/* — flanc droit : preuve déposée + organes — */}
          <div className="flank right" style={flankStyle}>
            <div className="status">
              <span className={'turn-dot ' + game.turn()} />
              <span>Au trait : <b>{turnName}</b></span>
            </div>

            <div className="ledger">
              <div className="ledger-title">Preuve déposée</div>
              {proofs.length === 0 ? (
                <div className="ledger-empty">Rien encore gravé. Vois une menace, réponds — la voie restera.</div>
              ) : proofs.map(p => (
                <div className="proof-row" key={p.id}>
                  <div className="proof-syn"><span /></div>
                  <div>
                    <div className="proof-label">{p.label}</div>
                    <div className="proof-meta">{p.meta}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="organs">
              <button className="organ proof" onClick={() => newGame(GUIDED_FEN, 'guided')}>
                <small>Plateau guidé</small>
                Voir la menace
              </button>
              <button className="organ rematch" onClick={() => newGame(START, 'today')}>
                <small>Revanche</small>
                Nouvelle partie
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* — TWEAKS — */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Bioluminescence" />
        <TweakSlider label="Intensité" value={t.bio} min={0.3} max={1.6} step={0.05}
          onChange={v => setTweak('bio', v)} />
        <TweakSlider label="Densité de la jungle" value={t.density} min={0} max={1.4} step={0.05}
          onChange={v => setTweak('density', v)} />
        <TweakSlider label="Respiration" value={t.breathSpeed} min={0.5} max={2} step={0.1} unit="×"
          onChange={v => setTweak('breathSpeed', v)} />
        <TweakSection label="Trois températures" />
        <TweakColor label="Calcul · Menace · Preuve" value={t.temps}
          options={[
            ['oklch(0.84 0.155 178)', 'oklch(0.90 0.085 232)', 'oklch(0.83 0.135 83)'],
            ['oklch(0.86 0.16 152)', 'oklch(0.88 0.10 262)', 'oklch(0.82 0.14 60)'],
            ['oklch(0.85 0.15 195)', 'oklch(0.92 0.09 210)', 'oklch(0.80 0.13 95)'],
          ]}
          onChange={v => setTweak('temps', v)} />
        <TweakSection label="Typographie" />
        <TweakRadio label="Display" value={t.font}
          options={['cormorant', 'spectral', 'marcellus']}
          onChange={v => setTweak('font', v)} />
      </TweaksPanel>
    </div>
  );
}

// — petit utilitaire : trouver le roi —
function findKing(game, color) {
  const b = game.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = b[r][c];
    if (p && p.type === 'k' && p.color === color) {
      return String.fromCharCode(97 + c) + (8 - r);
    }
  }
  return null;
}

// — logo : une dendrite compacte (le motif partout) —
function LogoMark() {
  const segs = React.useMemo(() => window.Fractal.mark(11), []);
  return (
    <svg width="30" height="34" viewBox="0 0 22 26" aria-hidden="true">
      <defs>
        <filter id="logo-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter="url(#logo-glow)" stroke="var(--calc)" fill="none" strokeLinecap="round">
        {segs.map((s, i) => (
          <path key={i} d={s.d} strokeWidth={Math.max(0.5, 1.5 - s.depth * 0.3)}
            opacity={Math.max(0.35, 0.95 - s.depth * 0.13)} />
        ))}
      </g>
      <circle cx="11" cy="21" r="1.5" fill="var(--calc)" filter="url(#logo-glow)" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
