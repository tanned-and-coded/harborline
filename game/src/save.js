// localStorage save: cash, mission progress, health, position and armed flag.
import { SAVE_KEY } from './config.js';
export function saveGame(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage off */ }
}
export function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function hasSave() { return loadGame() !== null; }
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
