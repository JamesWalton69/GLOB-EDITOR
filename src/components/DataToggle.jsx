import React from 'react';
import { MODES, getMode } from '../lib/fixture';

const LABELS = {
  demo: 'Demo data',
  worst: 'Worst case',
  empty: 'Empty',
  one: 'One',
  huge: '1,000 rows',
};

export default function DataToggle() {
  if (!import.meta.env.DEV) return null;
  const current = getMode();

  const select = (mode) => {
    const url = new URL(window.location.href);
    if (mode === 'demo') url.searchParams.delete('data');
    else url.searchParams.set('data', mode);
    window.location.assign(url.toString());
  };

  return (
    <div className="data-toggle" role="group" aria-label="Test data">
      {MODES.map(mode => (
        <button
          key={mode}
          type="button"
          className={current === mode ? 'active' : ''}
          aria-pressed={current === mode}
          onClick={() => select(mode)}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
