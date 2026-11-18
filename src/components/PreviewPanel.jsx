import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function PreviewPanel({ code, title, onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="preview-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="preview-dialog" role="dialog" aria-modal="true" aria-label="HTML preview">
        <div className="preview-header">
          <span>Preview · {title}</span>
          <button type="button" className="btn-icon" onClick={onClose} title="Close preview (Esc)"><X size={15} /></button>
        </div>
        <iframe title="HTML preview" sandbox="allow-scripts allow-forms allow-modals" srcDoc={code} />
      </div>
    </div>
  );
}
