import React, { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      {items.map((item, i) =>
        item === 'sep'
          ? <div key={i} className="context-menu-separator" />
          : (
            <div key={i} className={`context-menu-item ${item.danger ? 'danger' : ''}`}
              onClick={() => { item.action(); onClose(); }}>
              {item.icon && <item.icon size={12} />}
              {item.label}
            </div>
          )
      )}
    </div>
  );
}
