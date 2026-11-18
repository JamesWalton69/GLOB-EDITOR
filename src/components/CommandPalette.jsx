import React, { useMemo, useState } from 'react';
import { Search, CornerDownLeft, FileCode, Command } from 'lucide-react';

export default function CommandPalette({ open, onClose, files = [], actions = [], onOpenFile }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const items = useMemo(() => {
    const q = query.toLowerCase().trim();
    const fileItems = files.map(path => ({
      id: `file:${path}`,
      label: path.split('/').pop(),
      detail: path,
      icon: FileCode,
      run: () => onOpenFile(path),
    }));
    const actionItems = actions.map(action => ({
      ...action,
      id: `action:${action.id}`,
      icon: action.icon || Command,
    }));
    return [...actionItems, ...fileItems]
      .filter(item => !q || `${item.label} ${item.detail || ''}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, files, actions, onOpenFile]);

  if (!open) return null;

  const choose = (item) => {
    item.run();
    onClose();
  };

  return (
    <div className="cmd-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="cmd-dialog" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmd-search">
          <Search size={16} />
          <input
            autoFocus
            value={query}
            onChange={event => { setQuery(event.target.value); setIndex(0); }}
            onKeyDown={event => {
              if (event.key === 'Escape') { event.preventDefault(); onClose(); }
              else if (event.key === 'ArrowDown') { event.preventDefault(); setIndex(i => Math.min(i + 1, items.length - 1)); }
              else if (event.key === 'ArrowUp') { event.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
              else if (event.key === 'Enter' && items[index]) { event.preventDefault(); choose(items[index]); }
            }}
            placeholder="Search files and commands…"
            aria-label="Search files and commands"
          />
          <kbd>esc</kbd>
        </div>
        <div className="cmd-list" role="listbox">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={i === index}
              className={`cmd-item ${i === index ? 'selected' : ''}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => choose(item)}
            >
              <item.icon size={15} />
              <span className="cmd-item-label">{item.label}</span>
              {item.detail && <span className="cmd-item-detail">{item.detail}</span>}
              {i === index && <CornerDownLeft size={13} />}
            </button>
          ))}
          {!items.length && <div className="cmd-empty">No matches</div>}
        </div>
        <div className="cmd-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
        </div>
      </div>
    </div>
  );
}
