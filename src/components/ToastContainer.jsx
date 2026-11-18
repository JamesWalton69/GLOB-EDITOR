import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <CheckCircle size={14} color="var(--accent-success)" />}
          {t.type === 'error'   && <AlertCircle  size={14} color="var(--accent-danger)" />}
          {t.type === 'info'    && <Info          size={14} color="var(--accent-primary)" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
