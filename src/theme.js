export const UI_STYLES = [
  { id: 'paper', name: 'Paper', swatch: '#f4f1e9' },
  { id: 'brutalist', name: 'Brutalist', swatch: '#0b0b0b' },
  { id: 'ocean', name: 'Ocean', swatch: '#0a1426' },
  { id: 'rose', name: 'Rose', swatch: '#f8eee9' },
  { id: 'swiss', name: 'Swiss', swatch: '#ffffff' },
];

const valid = new Set(UI_STYLES.map(style => style.id));
const requested = new URLSearchParams(window.location.search).get('ui');
const saved = localStorage.getItem('globeditor.ui');
const initial = valid.has(requested) ? requested : valid.has(saved) ? saved : 'paper';
document.documentElement.dataset.ui = initial;

export const getUI = () => document.documentElement.dataset.ui;

export function setUI(id) {
  if (!valid.has(id)) return;
  document.documentElement.dataset.ui = id;
  localStorage.setItem('globeditor.ui', id);
}
