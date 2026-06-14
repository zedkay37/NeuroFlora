/* ============================================================
   Seuils de qualité durs (brief Codex) :
   - App.tsx < 250 lignes
   - aucun écran/composant > 300 lignes
   - aucun fichier CSS > 700 lignes
   ============================================================ */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');

const APP_MAX = 250;
const SCREEN_MAX = 300;
const CSS_MAX = 700;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(SRC);
const fails = [];

for (const f of files) {
  const ext = extname(f);
  const lines = readFileSync(f, 'utf8').split('\n').length;
  const rel = f.slice(ROOT.length + 1);
  if (f.endsWith('App.tsx') && lines > APP_MAX) fails.push(`${rel}: ${lines} > ${APP_MAX} (App)`);
  else if ((ext === '.tsx' || ext === '.ts') && lines > SCREEN_MAX)
    fails.push(`${rel}: ${lines} > ${SCREEN_MAX} (écran/module)`);
  if (ext === '.css' && lines > CSS_MAX) fails.push(`${rel}: ${lines} > ${CSS_MAX} (CSS)`);
}

if (fails.length) {
  console.error('✗ Seuils de lignes dépassés :');
  for (const m of fails) console.error('  ' + m);
  process.exit(1);
}
console.log('✓ Seuils de lignes respectés (App<250, écrans<300, CSS<700).');
