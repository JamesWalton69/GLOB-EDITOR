import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { UI_STYLES, getUI, setUI } from '../theme.js';

export default function StyleSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getUI());

  const choose = (id) => {
    setUI(id);
    setCurrent(id);
    setOpen(false);
  };

  return (
    <div className="ui-switcher">
      {open && (
        <div className="ui-switcher-list" role="group" aria-label="UI style">
          {UI_STYLES.map(style => (
            <button
              key={style.id}
              type="button"
              className={`ui-switcher-item ${current === style.id ? 'active' : ''}`}
              aria-pressed={current === style.id}
              onClick={() => choose(style.id)}
            >
              <span className="ui-swatch" style={{ background: style.swatch }} />
              {style.name}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="ui-switcher-toggle"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        <Palette size={14} />
        UI: {UI_STYLES.find(style => style.id === current)?.name}
      </button>
    </div>
  );
}
