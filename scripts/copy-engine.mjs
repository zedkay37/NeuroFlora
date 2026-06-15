/* Copie le build Stockfish lite-single (single-thread, sans COOP/COEP) dans
   public/engine/ pour qu'il soit servi côté client. Lancé en postinstall.
   public/engine/ est gitignoré (binaire 7 Mo reproductible depuis node_modules). */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'node_modules', 'stockfish', 'bin');
const DEST = join(ROOT, 'public', 'engine');
const FILES = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm'];

if (!existsSync(SRC)) {
  console.warn('[copy-engine] stockfish introuvable dans node_modules — ignoré.');
  process.exit(0);
}
mkdirSync(DEST, { recursive: true });
for (const f of FILES) {
  const from = join(SRC, f);
  if (!existsSync(from)) {
    console.warn('[copy-engine] manquant :', f);
    continue;
  }
  copyFileSync(from, join(DEST, f));
}
console.log('[copy-engine] moteur copié dans public/engine/');
