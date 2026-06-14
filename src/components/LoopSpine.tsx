/* La colonne vertébrale : où suis-je, où je vais. */
import { CLIMATE } from '../lib/climate';
import { LOOP_SEQUENCE, stepIndex, type LoopState, type LoopStep } from '../lib/loop';

export function LoopSpine({ loop, onGoto }: { loop: LoopState; onGoto: (s: LoopStep) => void }) {
  const cur = stepIndex(loop.step);
  const clickable = loop.firstPassComplete;
  return (
    <ol className="spine">
      {LOOP_SEQUENCE.map((k, i) => {
        const state =
          loop.step === k ? 'on' : i < cur ? 'done' : loop.visited.includes(k) ? 'seen' : 'todo';
        return (
          <li key={k} className="spine-node" data-state={state}>
            <button
              type="button"
              className="spine-dot"
              disabled={!clickable}
              aria-current={loop.step === k ? 'step' : undefined}
              onClick={() => clickable && onGoto(k)}
              title={CLIMATE[k].label}
            >
              <span aria-hidden="true">{i + 1}</span>
            </button>
            <span className="spine-label">{CLIMATE[k].label}</span>
          </li>
        );
      })}
    </ol>
  );
}
