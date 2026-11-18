import React from 'react';
import { PROVIDERS } from '../lib/compiler';

export default function SettingsPanel({ settings, onUpdate }) {
  return (
    <div className="settings-panel">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>SETTINGS</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Editor</div>
        <div className="settings-row">
          <span className="settings-label">Font Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="range" className="settings-slider" min="10" max="22" value={settings.fontSize}
              onChange={e => onUpdate('fontSize', +e.target.value)} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px' }}>{settings.fontSize}</span>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-label">Word Wrap</span>
          <button className={`settings-toggle ${settings.wordWrap === 'on' ? 'on' : ''}`}
            onClick={() => onUpdate('wordWrap', settings.wordWrap === 'on' ? 'off' : 'on')} />
        </div>
        <div className="settings-row">
          <span className="settings-label">Minimap</span>
          <button className={`settings-toggle ${settings.minimap ? 'on' : ''}`}
            onClick={() => onUpdate('minimap', !settings.minimap)} />
        </div>
        <div className="settings-row">
          <span className="settings-label">Tab Size</span>
          <select className="settings-select" value={settings.tabSize}
            onChange={e => onUpdate('tabSize', +e.target.value)}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <select className="settings-select" value={settings.theme}
            onChange={e => onUpdate('theme', e.target.value)}>
            <option value="vs-dark">Dark</option>
            <option value="vs">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Execution</div>
        <div className="settings-row">
          <span className="settings-label">Cloud runner</span>
          <select className="settings-select" value={settings.cloudProvider}
            onChange={e => onUpdate('cloudProvider', e.target.value)}>
            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="settings-row">
          <span className="settings-label">Auto-save</span>
          <button className={`settings-toggle ${settings.autoSave ? 'on' : ''}`}
            onClick={() => onUpdate('autoSave', !settings.autoSave)} />
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Terminal</div>
        <div className="settings-row">
          <span className="settings-label">Font Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="range" className="settings-slider" min="10" max="18" value={settings.termFontSize}
              onChange={e => onUpdate('termFontSize', +e.target.value)} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px' }}>{settings.termFontSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
