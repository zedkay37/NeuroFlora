/* ============================================================
   NEUROFLORA — Tutoriel d'entrée (45–60 s)
   Coachmarks accrochés aux VRAIS éléments d'UI. Skippable, rejouable.
   Critère : un primo-arrivant boucle une fois < 60 s et énonce la compétence.
   ============================================================ */
import { useLayoutEffect, useState, type CSSProperties } from 'react';

interface Step {
  sel: string;
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    sel: '.spine',
    eyebrow: 'La boucle',
    title: 'Un seul chemin, en avant',
    body: 'Aujourd’hui → Guidage → Silence → Preuve. Tu avances d’un pas à la fois ; la navigation libre s’ouvre après le premier passage.',
  },
  {
    sel: '.board-nexus',
    eyebrow: 'Le calcul fleurit',
    title: 'Sélectionne, et la jungle pousse',
    body: 'Clique une pièce : chaque coup légal pousse en dendrite. Une nervure = une variante. La déco est le sens.',
  },
  {
    sel: '.flank.left',
    eyebrow: 'La compétence',
    title: 'Voir la menace avant de calculer',
    body: 'Quand une pièce pend, une synapse froide court vers elle. La lire d’abord — puis répondre — c’est tout NeuroFlora.',
  },
  {
    sel: '.gauge',
    eyebrow: 'Précision de lecture',
    title: 'Ta vigilance, vivante',
    body: 'Chaque menace vue à temps fait monter la sève — teal, puis or. Méritée, jamais un chiffre froid.',
  },
  {
    sel: '.ledger',
    eyebrow: 'La preuve reste',
    title: 'Ce qui est vu se grave',
    body: 'Désamorce une menace et une preuve dorée s’inscrit. L’aide se retirera en Silence ; la voie, elle, restera.',
  },
];

const PAD = 8;
const CARD_W = 320;

export function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(step.sel);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    const t = setTimeout(measure, 60);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [step.sel]);

  const spot: CSSProperties = rect
    ? { left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : { left: '50%', top: '50%', width: 0, height: 0 };

  const card: CSSProperties = (() => {
    if (!rect) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const below = rect.bottom + 240 < window.innerHeight;
    const left = Math.min(Math.max(14, rect.left + rect.width / 2 - CARD_W / 2), window.innerWidth - CARD_W - 14);
    return below ? { left, top: rect.bottom + 18 } : { left, top: Math.max(14, rect.top - 18), transform: 'translateY(-100%)' };
  })();

  return (
    <div className="tut" role="dialog" aria-modal="true" aria-label="Tutoriel NeuroFlora">
      <div className="tut-catch" />
      <div className="tut-spot" style={spot} />
      <div className="tut-card" style={{ ...card, width: CARD_W }}>
        <div className="tut-eyebrow">
          <span>{step.eyebrow}</span>
          <span className="tut-count">
            {i + 1} / {STEPS.length}
          </span>
        </div>
        <div className="tut-title">{step.title}</div>
        <p className="tut-body">{step.body}</p>
        <div className="tut-actions">
          <button className="tut-skip" onClick={onClose}>
            Passer
          </button>
          <button className="tut-next" onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}
