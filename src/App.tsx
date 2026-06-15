/* ============================================================
   NEUROFLORA — App (composition seule)
   Toute la logique vit dans useNeuroGame ; ici on ne fait que rendre.
   ============================================================ */
import { useCallback, useState, type CSSProperties } from 'react';
import { useNeuroGame } from './hooks/useNeuroGame';
import { useTweaks } from './hooks/useTweaks';
import { useEngine } from './hooks/useEngine';
import { CLIMATE, FONTS } from './lib/climate';
import { eloSettings } from './lib/elo';
import { DEFAULT_BOT, type Bot } from './lib/bots';
import { BotPicker } from './components/BotPicker';
import { Board } from './components/Board';
import { Canopy } from './components/Canopy';
import { Coach } from './components/Coach';
import { Ledger } from './components/Ledger';
import { LogoMark } from './components/LogoMark';
import { LoopSpine } from './components/LoopSpine';
import { PrecisionGauge } from './components/PrecisionGauge';
import { Tutorial } from './components/Tutorial';
import { Settings } from './components/Settings';
import { DevTweaks } from './components/dev/DevTweaks';

const sv = (o: Record<string, string | number>): CSSProperties => o as CSSProperties;
const TUT_KEY = 'nf.tutorial.v1';

export default function App() {
  const [t, setTweak] = useTweaks();
  const engine = useEngine();
  const [bot, setBot] = useState<Bot>(DEFAULT_BOT);
  const [reading, setReading] = useState(false);
  const getMove = useCallback((fen: string) => engine.bestMove(fen, eloSettings(bot.elo)), [engine, bot]);
  const g = useNeuroGame({ getMove, reading });
  const [tutorial, setTutorial] = useState(() => !localStorage.getItem(TUT_KEY));

  const closeTutorial = () => {
    localStorage.setItem(TUT_KEY, 'seen');
    setTutorial(false);
  };

  const cfg = CLIMATE[g.climate];
  const ft = FONTS[t.font];

  const stageStyle = sv({
    '--bio': (cfg.bio * t.bio).toFixed(3),
    '--density': (cfg.density * t.density).toFixed(3),
    '--breath': (cfg.breath / Math.max(0.4, t.breathSpeed)).toFixed(1) + 's',
    '--clearing': g.climate === 'silence' ? 1 : 0.7,
    '--accent': cfg.accent,
    '--temp': cfg.temp,
    '--calc': t.temps[0],
    '--threat': t.temps[1],
    '--proof': t.temps[2],
    '--display': ft.display,
    '--sans': ft.sans,
  });

  const turnName = g.turn === 'w' ? 'Ivoire' : 'Graphite';

  return (
    <div className="stage" data-climate={g.climate} style={stageStyle}>
      <Canopy />

      <div className="scene">
        <header className="brand">
          <div className="brand-mark">
            <LogoMark />
            <div>
              <div className="brand-word">
                Neuro<b>flora</b>
              </div>
              <div className="brand-sub">la preuve silencieuse</div>
            </div>
          </div>

          <div className="loop-nav" style={sv({ '--accent': cfg.accent })}>
            <LoopSpine loop={g.loop} onGoto={g.gotoStep} />
            <button
              className="loop-cta"
              data-ready={g.cta.ready}
              disabled={!g.cta.ready}
              onClick={g.runCta}
            >
              {g.cta.label}
            </button>
          </div>
        </header>

        <main className="play">
          <div className="flank left">
            <Coach message={g.coach} threat={g.threat} showGuides={g.showGuides} />
          </div>

          <Board
            position={g.position}
            selected={g.selected}
            targets={g.targets}
            showBuds={g.showGuides}
            lastMove={g.lastMove}
            checkSq={g.checkSq}
            proofSqs={g.proofSqs}
            calcVeins={g.calcVeins}
            threat={g.threat}
            climate={g.climate}
            onSquareClick={g.onSquareClick}
          />

          <div className="flank right">
            <div className="status">
              <span className={'turn-dot ' + g.turn} />
              <span>
                Au trait : <b>{turnName}</b>
              </span>
            </div>
            <BotPicker value={bot.id} onSelect={setBot} />
            <button
              className="reading-toggle"
              data-on={reading}
              aria-pressed={reading}
              onClick={() => setReading((r) => !r)}
            >
              <span className="dot" />
              Lecture {reading ? '· active' : '· retirée'}
            </button>
            <PrecisionGauge
              ratio={g.precision.ratio}
              tier={g.precision.tier}
              presented={g.precision.presented}
            />
            <Ledger proofs={g.proofs} />
          </div>
        </main>
      </div>

      <Settings onReplayTutorial={() => setTutorial(true)} />
      {tutorial && <Tutorial onClose={closeTutorial} />}
      {import.meta.env.DEV && <DevTweaks t={t} setTweak={setTweak} />}
    </div>
  );
}
