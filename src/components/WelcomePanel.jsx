import React from 'react';
import { Code, FolderOpen, Command } from 'lucide-react';

export default function WelcomePanel({ onShowFiles, onOpenPalette }) {
  return (
    <div className="welcome-panel">
      <div className="welcome-stack" aria-hidden="true"><span /><span /><span /></div>
      <div className="welcome-icon"><Code size={30} /></div>
      <h2>Start with a file.</h2>
      <p>Open something from your workspace, or jump straight to a command.</p>
      <div className="welcome-actions">
        <button type="button" className="btn-primary" onClick={onShowFiles}><FolderOpen size={14} /> Browse files</button>
        <button type="button" className="btn-secondary" onClick={onOpenPalette}><Command size={14} /> Commands <kbd>⌘K</kbd></button>
      </div>
    </div>
  );
}
