/* Réglages minimaux : rejouer le tutoriel (étendu en J4). */
import { useState } from 'react';

export function Settings({ onReplayTutorial }: { onReplayTutorial: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="settings">
      {open && (
        <div className="settings-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onReplayTutorial();
            }}
          >
            Revoir le tutoriel
          </button>
        </div>
      )}
      <button
        type="button"
        className="settings-btn"
        aria-label="Réglages"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⚙
      </button>
    </div>
  );
}
