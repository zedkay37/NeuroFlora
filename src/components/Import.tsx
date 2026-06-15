/* ============================================================
   NEUROFLORA — Import (overlay : « Mes angles morts »)
   Importer ses parties (Lichess / PGN) et les rejouer dans la boucle.
   ============================================================ */
import { useState, type ChangeEvent } from 'react';
import type { Color } from 'chess.js';
import type { Library } from '../hooks/useLibrary';
import type { ImportReport } from '../hooks/useLibrary';

function summary(r: ImportReport): string {
  if (!r.games) return 'Aucune partie lisible.';
  return r.found
    ? `${r.found} angle(s) mort(s) sur ${r.games} partie(s).`
    : `Aucun angle mort net sur ${r.games} partie(s) — belle lecture.`;
}

export function Import({ lib, onClose }: { lib: Library; onClose: () => void }) {
  const [user, setUser] = useState('');
  const [pgn, setPgn] = useState('');
  const [color, setColor] = useState<Color>('w');
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPgn(await f.text());
  };
  const doPgn = () => setMsg(summary(lib.importPgn(pgn, '', color)));
  const doLichess = async () => {
    const r = await lib.importLichess(user, color);
    if (r) setMsg(summary(r));
  };

  return (
    <div className="lib-overlay" role="dialog" aria-modal="true" aria-label="Mes angles morts">
      <div className="lib-panel">
        <header className="lib-head">
          <h2>Mes angles morts</h2>
          <button className="lib-x" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        <p className="lib-intro">
          Tes propres parties, minées pour les menaces que tu n'as pas vues. Rejoue-les — d'abord guidé, puis en silence.
        </p>

        <section className="lib-src">
          <label className="lib-field">
            Pseudo Lichess
            <div className="lib-row">
              <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="ex. DrNykterstein" />
              <button onClick={doLichess} disabled={lib.busy || !user.trim()}>
                {lib.busy ? '…' : 'Importer'}
              </button>
            </div>
          </label>

          <div className="lib-or">ou</div>

          <label className="lib-field">
            Coller un PGN
            <textarea value={pgn} onChange={(e) => setPgn(e.target.value)} rows={4} placeholder="[Event ...] 1. e4 e5 ..." />
          </label>
          <div className="lib-row">
            <input type="file" accept=".pgn,.txt" onChange={onFile} />
            <fieldset className="lib-color">
              <label>
                <input type="radio" checked={color === 'w'} onChange={() => setColor('w')} /> Blancs
              </label>
              <label>
                <input type="radio" checked={color === 'b'} onChange={() => setColor('b')} /> Noirs
              </label>
            </fieldset>
            <button onClick={doPgn} disabled={!pgn.trim()}>
              Analyser
            </button>
          </div>

          {lib.error && <p className="lib-err">Échec : {lib.error}</p>}
          {msg && <p className="lib-msg">{msg}</p>}
        </section>

        <section className="lib-list">
          <div className="lib-list-head">
            <span>{lib.spots.length} angle(s) mort(s) en réserve</span>
            {lib.spots.length > 0 && (
              <button className="lib-clear" onClick={lib.clear}>
                Tout effacer
              </button>
            )}
          </div>
          <ul>
            {lib.spots.map((bs, i) => (
              <li key={bs.fen} data-on={i === lib.selected}>
                <div className="lib-spot-txt">
                  <b>{bs.theme}</b>
                  <span className="lib-meta">
                    {bs.game} · coup {Math.ceil(bs.ply / 2)} · joué {bs.played}
                  </span>
                </div>
                <button
                  onClick={() => {
                    lib.select(i);
                    onClose();
                  }}
                >
                  Rejouer
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
