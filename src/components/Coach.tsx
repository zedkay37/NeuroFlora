/* Coach minimal (1–2 lignes) + lecture de menace sobre. */
import { Fragment, type CSSProperties } from 'react';
import type { CoachMessage } from '../lib/coach';
import { FR, type Threat } from '../lib/engine';

// `line` porte des *mots* en emphase.
function CoachLine({ text }: { text: string }) {
  const parts = text.split('*');
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <em key={i}>{p}</em> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

interface CoachProps {
  message: CoachMessage | null;
  threat: Threat | null;
  showGuides: boolean;
}

export function Coach({ message, threat, showGuides }: CoachProps) {
  if (!message) return null;
  return (
    <div className="coach" style={{ '--temp': message.temp } as CSSProperties}>
      <div className="coach-eyebrow">{message.eyebrow}</div>
      <div className="coach-line">
        <CoachLine text={message.line} />
      </div>
      {message.hint && <div className="coach-hint">{message.hint}</div>}
      <div className="threat-read" data-on={!!threat && showGuides}>
        <span className="pip" />
        {threat && `${threat.from.toUpperCase()} → ${threat.to.toUpperCase()} · ${FR[threat.victim]}`}
      </div>
    </div>
  );
}
