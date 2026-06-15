import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/canopy.css';
import './styles/board.css';
import './styles/chrome.css';
import './styles/loop.css';
import './styles/gauge.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root introuvable');

// Pas de StrictMode : on évite le double-montage des effets (timer IA, menace
// initiale) pour rester fidèle au comportement du prototype.
createRoot(root).render(<App />);
