/* Le registre : ce qui est gravé (preuves déposées). */
import type { Proof } from '../hooks/useNeuroGame';

export function Ledger({ proofs }: { proofs: Proof[] }) {
  return (
    <div className="ledger">
      <div className="ledger-title">Preuve déposée</div>
      {proofs.length === 0 ? (
        <div className="ledger-empty">
          Rien encore gravé. Vois une menace, réponds — la voie restera.
        </div>
      ) : (
        proofs.map((p) => (
          <div className="proof-row" key={p.id}>
            <div className="proof-syn">
              <span />
            </div>
            <div>
              <div className="proof-label">{p.label}</div>
              <div className="proof-meta">{p.meta}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
