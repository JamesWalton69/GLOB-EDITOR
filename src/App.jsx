import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, ADMIN_EMAIL } from './AuthContext';
import { supabase } from './supabase';
import './App.css';
import {
  FileCode, Folder, Search, Settings, Play, LogOut,
  ChevronRight, Plus, FilePlus, FolderPlus, Trash2,
  Globe, Save, RefreshCw, Code, Layout, X, Pencil,
  Terminal as TerminalIcon, Shield, ChevronDown,
  GitBranch, Bell, CheckCircle, AlertCircle, Info,
  Download, Maximize2, Minimize2
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// ─────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────
const LANG_MAP = {
  py: 'python', js: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript', html: 'html',
  css: 'css', java: 'java', c: 'c', cpp: 'cpp',
  json: 'json', md: 'markdown', txt: 'plaintext', sql: 'sql',
};
const CODEX_LANG = { python: 'python', javascript: 'js', java: 'java', c: 'c', cpp: 'cpp' };
const LANG_ICON_COLOR = {
  python: '#3b82f6', javascript: '#f59e0b', java: '#f97316',
  html: '#f43f5e', css: '#8b5cf6', c: '#06b6d4', cpp: '#06b6d4',
  default: '#6b7280',
};

const getLang = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return LANG_MAP[ext] || 'plaintext';
};
const getLangColor = (lang) => LANG_ICON_COLOR[lang] || LANG_ICON_COLOR.default;
const basename = (path = '') => path.split('/').pop();
const PYODIDE_INPUT_BUFFER_SIZE = 64 * 1024;
const SHELL_PROMPT = 'workspace';
const TERMINAL_COMMANDS = ['help', 'clear', 'pwd', 'ls', 'open', 'cat', 'run', 'python', 'save', 'tabs', 'echo', 'history'];
const LANGUAGE_COMPLETIONS = {
  python: [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
    'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global',
    'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass',
    'raise', 'return', 'True', 'try', 'while', 'with', 'yield', 'print', 'input',
    'range', 'len', 'list', 'dict', 'set', 'str', 'int', 'float'
  ],
  javascript: [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
    'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
    'null', 'return', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var',
    'while', 'yield', 'console', 'log', 'map', 'filter', 'reduce', 'Promise'
  ],
  typescript: [
    'abstract', 'any', 'as', 'async', 'await', 'boolean', 'class', 'const', 'declare',
    'enum', 'export', 'extends', 'false', 'function', 'implements', 'import', 'interface',
    'let', 'never', 'null', 'number', 'private', 'protected', 'public', 'readonly',
    'return', 'string', 'true', 'type', 'undefined', 'unknown', 'void'
  ],
  html: ['div', 'span', 'button', 'input', 'form', 'section', 'main', 'header', 'footer', 'article', 'nav', 'img', 'a', 'label'],
  css: ['display', 'position', 'color', 'background', 'padding', 'margin', 'border', 'font-size', 'width', 'height', 'flex', 'grid', 'align-items', 'justify-content'],
  json: ['true', 'false', 'null'],
  sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'ORDER BY', 'GROUP BY', 'CREATE TABLE', 'ALTER TABLE'],
};

const parseCommand = (value = '') => {
  const matches = value.match(/"([^"]*)"|'([^']*)'|`([^`]*)`|[^\s]+/g) || [];
  return matches.map((token) => token.replace(/^["'`]|["'`]$/g, ''));
};

// ─────────────────────────────────────────────────────
//  TOAST SYSTEM
// ─────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
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

// ─────────────────────────────────────────────────────
//  CONTEXT MENU
// ─────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
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

// ─────────────────────────────────────────────────────
//  FILE EXPLORER
// ─────────────────────────────────────────────────────
function FileExplorer({ isAdmin, user, onSelectFile, activeFilePath, addToast }) {
  const [items, setItems] = useState([]);
  const [currentPath, setCurrentPath] = useState(isAdmin ? '' : user.id);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null); // 'file' | 'folder' | null
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [ctxMenu, setCtxMenu] = useState(null);
  const newInputRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => { fetchStorage(); }, [currentPath]);
  useEffect(() => { if (creating && newInputRef.current) newInputRef.current.focus(); }, [creating]);
  useEffect(() => { if (renaming && renameInputRef.current) renameInputRef.current.focus(); }, [renaming]);

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('editor_files').list(currentPath, { limit: 200, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      const filtered = (data || []).filter(i => i.name !== '.keep' && i.name !== '.emptyFolderPlaceholder');
      // folders first, then files
      const folders = filtered.filter(i => !i.id);
      const files   = filtered.filter(i =>  i.id);
      setItems([...folders, ...files]);
    } catch (err) { addToast('error', err.message); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { setCreating(null); return; }
    const isFile = creating === 'file';
    const uploadPath = currentPath
      ? `${currentPath}/${name}${isFile ? '' : '/.keep'}`
      : `${name}${isFile ? '' : '/.keep'}`;
    const { error } = await supabase.storage.from('editor_files').upload(uploadPath, isFile ? '' : '', { upsert: false });
    if (error) { addToast('error', 'Create failed: ' + error.message); }
    else {
      addToast('success', `Created ${name}`);
      setCreating(null); setNewName('');
      fetchStorage();
      if (isFile) onSelectFile(uploadPath);
    }
  };

  const handleDelete = async (item) => {
    const isFolder = !item.id;
    const pathToDelete = currentPath ? `${currentPath}/${item.name}` : item.name;
    if (!window.confirm(`Delete "${item.name}"${isFolder ? ' and all its contents' : ''}?`)) return;
    if (isFolder) {
      // list all files in folder and delete them
      const { data } = await supabase.storage.from('editor_files').list(pathToDelete, { limit: 500 });
      if (data?.length) {
        await supabase.storage.from('editor_files').remove(data.map(f => `${pathToDelete}/${f.name}`));
      }
      await supabase.storage.from('editor_files').remove([`${pathToDelete}/.keep`]);
    } else {
      const { error } = await supabase.storage.from('editor_files').remove([pathToDelete]);
      if (error) { addToast('error', 'Delete failed: ' + error.message); return; }
    }
    addToast('success', `Deleted ${item.name}`);
    fetchStorage();
  };

  const handleRename = async (e, item) => {
    e.preventDefault();
    const name = renameValue.trim();
    if (!name || name === item.name) { setRenaming(null); return; }
    const oldPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    const { data: fileData } = await supabase.storage.from('editor_files').download(oldPath);
    if (!fileData) { addToast('error', 'Could not read file for rename.'); setRenaming(null); return; }
    const { error: uploadErr } = await supabase.storage.from('editor_files').upload(newPath, fileData, { upsert: false });
    if (uploadErr) { addToast('error', 'Rename failed: ' + uploadErr.message); setRenaming(null); return; }
    await supabase.storage.from('editor_files').remove([oldPath]);
    addToast('success', `Renamed to ${name}`);
    setRenaming(null); setRenameValue('');
    fetchStorage();
    if (activeFilePath === oldPath) onSelectFile(newPath);
  };

  const openContextMenu = (e, item) => {
    e.preventDefault(); e.stopPropagation();
    const isFolder = !item.id;
    const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    setCtxMenu({
      x: e.clientX, y: e.clientY,
      items: [
        !isFolder && { label: 'Open File', icon: FileCode, action: () => onSelectFile(fullPath) },
        { label: 'Rename', icon: Pencil, action: () => { setRenaming(item.name); setRenameValue(item.name); } },
        'sep',
        { label: 'Delete', icon: Trash2, danger: true, action: () => handleDelete(item) },
      ].filter(Boolean),
    });
  };

  const canGoBack = isAdmin ? currentPath !== '' : currentPath !== user.id;

  return (
    <div className="panel flex flex-col h-full" style={{ width: '250px' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          {basename(currentPath) || (isAdmin ? 'ALL USERS' : 'WORKSPACE')}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-icon" title="New File" onClick={() => setCreating('file')}><FilePlus size={13} /></button>
          <button className="btn-icon" title="New Folder" onClick={() => setCreating('folder')}><FolderPlus size={13} /></button>
          <button className="btn-icon" title="Refresh" onClick={fetchStorage}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={10} color="#f9e2af" />
          <span className="admin-badge">ADMIN VIEW</span>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto" style={{ paddingTop: '4px' }}>
        {canGoBack && (
          <div className="explorer-item" onClick={() => {
            const parts = currentPath.split('/');
            parts.pop();
            setCurrentPath(parts.join('/'));
          }}>
            <ChevronRight size={13} style={{ transform: 'rotate(180deg)', color: 'var(--text-dim)' }} />
            <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>..</span>
          </div>
        )}

        {/* Inline create input */}
        {creating && (
          <form onSubmit={handleCreate} style={{ padding: '4px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {creating === 'file' ? <FileCode size={13} color="var(--accent-primary)" /> : <Folder size={13} color="#f9e2af" />}
              <input
                ref={newInputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={() => { if (!newName) setCreating(null); }}
                onKeyDown={e => { if (e.key === 'Escape') { setCreating(null); setNewName(''); } }}
                placeholder={creating === 'file' ? 'filename.py' : 'folder-name'}
                style={{ fontSize: '12px', flex: 1, borderBottom: '1px solid var(--accent-primary)' }}
              />
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
            Empty workspace.<br />Create a file to begin.
          </div>
        ) : (
          items.map(item => {
            const isFolder = !item.id;
            const fullPath = currentPath ? `${currentPath}/${item.name}` : item.name;
            const isActive = !isFolder && activeFilePath === fullPath;
            const lang = isFolder ? null : getLang(item.name);
            const color = isFolder ? '#f9e2af' : getLangColor(lang);

            if (renaming === item.name) {
              return (
                <form key={item.name} onSubmit={e => handleRename(e, item)} style={{ padding: '4px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isFolder ? <Folder size={13} color="#f9e2af" /> : <FileCode size={13} color={color} />}
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => setRenaming(null)}
                      onKeyDown={e => { if (e.key === 'Escape') setRenaming(null); }}
                      style={{ fontSize: '12px', flex: 1, borderBottom: '1px solid var(--accent-primary)' }}
                    />
                  </div>
                </form>
              );
            }

            return (
              <div
                key={item.name}
                className={`explorer-item ${isActive ? 'selected' : ''}`}
                onClick={() => isFolder ? setCurrentPath(fullPath) : onSelectFile(fullPath)}
                onContextMenu={e => openContextMenu(e, item)}
              >
                {isFolder
                  ? <Folder size={14} color={color} />
                  : <FileCode size={14} color={color} />
                }
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                <div className="item-actions">
                  {!isFolder && (
                    <button className="item-action-btn" title="Rename" onClick={e => { e.stopPropagation(); setRenaming(item.name); setRenameValue(item.name); }}>
                      <Pencil size={10} />
                    </button>
                  )}
                  <button className="item-action-btn danger" title="Delete" onClick={e => { e.stopPropagation(); handleDelete(item); }}>
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  SEARCH PANEL
// ─────────────────────────────────────────────────────
function SearchPanel({ tabs, onOpenTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const found = [];
    for (const tab of tabs) {
      const lines = tab.content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(q.toLowerCase())) {
          found.push({ path: tab.path, line: idx + 1, text: line.trim(), match: q });
        }
      });
    }
    setResults(found);
    setSearching(false);
  }, [tabs]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const highlight = (text, match) => {
    const idx = text.toLowerCase().indexOf(match.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + match.length)}</mark>
        {text.slice(idx + match.length)}
      </>
    );
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">SEARCH</div>
      <div className="search-input-wrap">
        <input
          autoFocus
          placeholder="Search in open files…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {searching && <div className="search-empty">Searching…</div>}
        {!searching && query && results.length === 0 && (
          <div className="search-empty">No results for "{query}"</div>
        )}
        {!searching && results.map((r, i) => (
          <div key={i} className="search-result" onClick={() => onOpenTab(r.path)}>
            <div className="search-result-file">{basename(r.path)} <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>:{r.line}</span></div>
            <div className="search-result-line">{highlight(r.text, r.match)}</div>
          </div>
        ))}
        {!query && (
          <div className="search-empty" style={{ marginTop: '16px' }}>
            <Search size={24} style={{ opacity: 0.2, margin: '0 auto 8px', display: 'block' }} />
            Type to search across<br />all open files
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
//  SETTINGS PANEL
// ─────────────────────────────────────────────────────
function SettingsPanel({ settings, onUpdate }) {
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

// ─────────────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────────────
export default function App() {
  const { user, signInWithGoogle, signOut, isAdmin } = useAuth();

  // --- Editor state ---
  const [tabs, setTabs] = useState([]); // { path, content, modified }
  const [activeTabPath, setActiveTabPath] = useState(null);
  const [activePanel, setActivePanel] = useState('files');
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null); // monaco editor instance

  // --- Terminal state ---
  const [terminalLogs, setTerminalLogs]   = useState([{ type: 'system', text: '  GlobEditor Terminal v2.0 — Ready.' }]);
  const [isExecuting, setIsExecuting]     = useState(false);
  const [stdinPending, setStdinPending]   = useState(false);
  const [stdinValue, setStdinValue]       = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalHistoryIndex, setTerminalHistoryIndex] = useState(-1);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [paneMode, setPaneMode] = useState('split');
  const terminalRef  = useRef(null);
  const stdinRef     = useRef(null);
  const pyodideWorkerRef = useRef(null);
  const pyodideWorkerReadyRef = useRef(null);
  const pyodideStdinBuffersRef = useRef(null);
  const textEncoderRef = useRef(new TextEncoder());
  const completionSetupRef = useRef(new Set());

  // --- Cursor position ---
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // --- Toasts ---
  const [toasts, setToasts] = useState([]);

  // --- Settings ---
  const [settings, setSettings] = useState({
    fontSize: 13, wordWrap: 'off', minimap: false,
    tabSize: 2, theme: 'vs-dark', autoSave: false, termFontSize: 12,
  });

  // ── auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLogs]);

  // ── focus stdin when pending
  useEffect(() => {
    if (stdinRef.current && (stdinPending || paneMode !== 'editor')) stdinRef.current.focus();
  }, [stdinPending, paneMode]);

  useEffect(() => () => {
    pyodideWorkerRef.current?.terminate();
  }, []);

  // ── keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveActiveFile();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabPath, tabs]);

  // ── auto-save
  useEffect(() => {
    if (!settings.autoSave) return;
    const t = setInterval(() => { if (activeTabPath) saveActiveFile(); }, 10000);
    return () => clearInterval(t);
  }, [settings.autoSave, activeTabPath]);

  // ─────────── Toast helpers ───────────
  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const addLog = useCallback((type, text) =>
    setTerminalLogs(prev => [...prev.slice(-200), { type, text }]), []);

  // ─────────── File Operations ───────────
  const openFile = useCallback(async (path) => {
    // if already open, just switch
    if (tabs.find(t => t.path === path)) {
      setActiveTabPath(path);
      return;
    }
    const { data, error } = await supabase.storage.from('editor_files').download(path);
    if (error) { addToast('error', error.message); return; }
    const content = await data.text();
    setTabs(prev => [...prev, { path, content, modified: false }]);
    setActiveTabPath(path);
  }, [tabs, addToast]);

  const closeTab = useCallback((path, e) => {
    e?.stopPropagation();
    const tab = tabs.find(t => t.path === path);
    if (tab?.modified && !window.confirm(`"${basename(path)}" has unsaved changes. Close anyway?`)) return;
    setTabs(prev => {
      const next = prev.filter(t => t.path !== path);
      if (activeTabPath === path) setActiveTabPath(next.length ? next[next.length - 1].path : null);
      return next;
    });
  }, [tabs, activeTabPath]);

  const saveActiveFile = useCallback(async () => {
    if (!activeTabPath || !editorRef.current) return;
    const content = editorRef.current.getValue();
    const { error } = await supabase.storage.from('editor_files').upload(activeTabPath, content, { upsert: true });
    if (error) { addToast('error', 'Save failed: ' + error.message); return; }
    setTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content, modified: false } : t));
    addToast('success', `Saved ${basename(activeTabPath)}`);
  }, [activeTabPath, addToast]);

  const handleEditorChange = useCallback((value) => {
    setTabs(prev => prev.map(t => (
      t.path === activeTabPath ? { ...t, content: value ?? '', modified: true } : t
    )));
  }, [activeTabPath]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    editorInstanceRef.current = { editor, monaco };
    Object.entries(LANGUAGE_COMPLETIONS).forEach(([language, entries]) => {
      if (completionSetupRef.current.has(language)) return;
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems(model, position) {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const prefix = (word.word || '').toLowerCase();
          const suggestions = entries
            .filter((entry) => !prefix || entry.toLowerCase().startsWith(prefix))
            .map((entry) => ({
              label: entry,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: entry,
              range,
            }));
          return { suggestions };
        },
      });
      completionSetupRef.current.add(language);
    });
    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─────────── Stdin prompt ───────────
  const handlePyodideWorkerMessage = useCallback((event) => {
    const { type, text, success } = event.data;

    if (type === 'stdout') {
      addLog('stdout', text);
      return;
    }

    if (type === 'stderr') {
      addLog('stderr', text);
      return;
    }

    if (type === 'system') {
      addLog('system', text);
      return;
    }

    if (type === 'stdin-request') {
      setStdinPending(true);
      return;
    }

    if (type === 'ready') {
      pyodideWorkerReadyRef.current?.resolve?.();
      pyodideWorkerReadyRef.current = { promise: Promise.resolve() };
      return;
    }

    if (type === 'done') {
      setIsExecuting(false);
      setStdinPending(false);
      setStdinValue('');
      if (success) {
        addLog('system', 'Process exited with code 0.');
      }
    }
  }, [addLog]);

  const ensurePyodideWorker = useCallback(() => {
    if (typeof SharedArrayBuffer === 'undefined' || !window.crossOriginIsolated) {
      throw new Error('SharedArrayBuffer is unavailable. Start the app with cross-origin isolation enabled.');
    }

    if (pyodideWorkerReadyRef.current?.promise) {
      return pyodideWorkerReadyRef.current.promise;
    }

    const worker = new Worker(new URL('./pyodide.worker.js', import.meta.url), { type: 'module' });
    const controlBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    const inputBuffer = new SharedArrayBuffer(PYODIDE_INPUT_BUFFER_SIZE);

    pyodideWorkerRef.current = worker;
    pyodideStdinBuffersRef.current = {
      control: new Int32Array(controlBuffer),
      data: new Uint8Array(inputBuffer),
    };

    worker.addEventListener('message', handlePyodideWorkerMessage);
    worker.addEventListener('error', (event) => {
      addLog('stderr', event.message || 'Pyodide worker crashed.');
      setIsExecuting(false);
      setStdinPending(false);
      pyodideWorkerReadyRef.current?.reject?.(event.error || new Error(event.message || 'Pyodide worker crashed.'));
      pyodideWorkerReadyRef.current = null;
    });

    const promise = new Promise((resolve, reject) => {
      pyodideWorkerReadyRef.current = { promise: null, resolve, reject };
      worker.postMessage({ type: 'init', controlBuffer, inputBuffer });
    });

    pyodideWorkerReadyRef.current.promise = promise;
    return promise;
  }, [addLog, handlePyodideWorkerMessage]);

  const submitStdin = useCallback(() => {
    if (!stdinPending || !pyodideStdinBuffersRef.current) return;

    const encoded = textEncoderRef.current.encode(`${stdinValue}\n`);
    if (encoded.length > PYODIDE_INPUT_BUFFER_SIZE) {
      addToast('error', 'Input is too long for the local runtime buffer.');
      return;
    }

    const { control, data } = pyodideStdinBuffersRef.current;
    data.fill(0, 0, encoded.length);
    data.set(encoded, 0);
    Atomics.store(control, 1, encoded.length);
    Atomics.store(control, 0, 2);
    Atomics.notify(control, 0, 1);

    addLog('stdin-value', '> ' + stdinValue);
    setStdinValue('');
    setStdinPending(false);
  }, [stdinPending, stdinValue, addLog, addToast]);

  // ─────────── Execution ───────────
  const activeTab = tabs.find(t => t.path === activeTabPath);
  const lang = activeTab ? getLang(activeTab.path) : '';

  const runLocallyLegacy = async () => {
    if (!activeTab) return;
    if (lang !== 'python') { addToast('info', 'Local execution only supports Python'); return; }
    addLog('command', `▶  python ${basename(activeTab.path)}`);
    setIsExecuting(true);
    setStdinPending(false);
    setStdinValue('');
    try {
      await ensurePyodideWorker();
        addLog('system', 'Loading Pyodide runtime…');
      if (pyodideStdinBuffersRef.current) {
        const { control, data } = pyodideStdinBuffersRef.current;
        control.fill(0);
        data.fill(0);
      }
      const code = editorRef.current?.getValue() || activeTab.content;
      pyodideWorkerRef.current?.postMessage({ type: 'run', python: code });
    } catch (e) {
      addLog('stderr', e.message);
      setIsExecuting(false);
    }
  };

  const runInCloud = async () => {
    if (!activeTab) return;
    const codexLang = CODEX_LANG[lang];
    if (!codexLang) { addToast('info', `Cloud run not supported for "${lang}"`); return; }
    const code = editorRef.current?.getValue() || activeTab.content;
    addLog('command', `☁  cloud run ${basename(activeTab.path)}`);
    setIsExecuting(true);
    try {
      const res = await fetch('https://api.codex.jaagrav.in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, language: codexLang, input: '' }),
      });
      const json = await res.json();
      if (json.output) addLog('stdout', json.output);
      if (json.error)  addLog('stderr', json.error);
      if (!json.output && !json.error) addLog('system', 'Process exited with code 0.');
    } catch (e) { addLog('error', 'Cloud failed: ' + e.message); }
    setIsExecuting(false);
  };

  const runPythonSource = useCallback(async (python, label) => {
    addLog('command', label);
    setIsExecuting(true);
    setStdinPending(false);
    setStdinValue('');
    try {
      await ensurePyodideWorker();
      addLog('system', 'Loading Pyodide runtimeâ€¦');
      if (pyodideStdinBuffersRef.current) {
        const { control, data } = pyodideStdinBuffersRef.current;
        control.fill(0);
        data.fill(0);
      }
      pyodideWorkerRef.current?.postMessage({ type: 'run', python });
    } catch (e) {
      addLog('stderr', e.message);
      setIsExecuting(false);
    }
  }, [addLog, ensurePyodideWorker]);

  const runLocally = useCallback(async () => {
    if (!activeTab) return;
    if (lang !== 'python') {
      addToast('info', 'Local execution only supports Python files right now.');
      return;
    }
    const code = editorRef.current?.getValue() || activeTab.content;
    await runPythonSource(code, `▶  python ${basename(activeTab.path)}`);
  }, [activeTab, lang, addToast, runPythonSource]);

  const handleTerminalCommand = useCallback(async (rawValue) => {
    const input = rawValue.trim();
    if (!input) return;

    addLog('command', `${SHELL_PROMPT} $ ${input}`);
    setTerminalHistory(prev => [...prev.slice(-49), input]);
    setTerminalHistoryIndex(-1);
    setTerminalInput('');

    const [command = '', ...args] = parseCommand(input);
    const normalized = command.toLowerCase();

    if (normalized === 'clear') {
      setTerminalLogs([{ type: 'system', text: '  Terminal cleared.' }]);
      return;
    }

    if (normalized === 'help') {
      addLog('stdout', [
        'Available commands:',
        'help, clear, pwd, ls, tabs, open <path>, cat [path], run, python [file|-c "code"], save, echo <text>, history',
      ].join('\n'));
      return;
    }

    if (normalized === 'pwd') {
      addLog('stdout', activeTab?.path || '/workspace');
      return;
    }

    if (normalized === 'ls' || normalized === 'tabs') {
      if (!tabs.length) {
        addLog('stdout', 'No open files.');
        return;
      }
      addLog('stdout', tabs.map(tab => `${tab.path === activeTabPath ? '* ' : '  '}${tab.path}`).join('\n'));
      return;
    }

    if (normalized === 'echo') {
      addLog('stdout', args.join(' '));
      return;
    }

    if (normalized === 'history') {
      addLog('stdout', terminalHistory.length
        ? terminalHistory.map((entry, index) => `${index + 1}  ${entry}`).join('\n')
        : 'No command history yet.');
      return;
    }

    if (normalized === 'open') {
      if (!args.length) {
        addLog('stderr', 'Usage: open <path>');
        return;
      }
      await openFile(args.join(' '));
      return;
    }

    if (normalized === 'cat') {
      if (!activeTab) {
        addLog('stderr', 'No active file.');
        return;
      }

      const requestedPath = args.join(' ');
      const targetTab = requestedPath
        ? tabs.find(tab => tab.path === requestedPath || basename(tab.path) === requestedPath)
        : activeTab;

      if (!targetTab) {
        addLog('stderr', 'Open the file first, then use cat.');
        return;
      }

      const content = targetTab.path === activeTabPath
        ? (editorRef.current?.getValue() || targetTab.content)
        : targetTab.content;
      addLog('stdout', content || '[empty file]');
      return;
    }

    if (normalized === 'save') {
      await saveActiveFile();
      return;
    }

    if (normalized === 'run') {
      await runLocally();
      return;
    }

    if (normalized === 'python') {
      if (!args.length) {
        await runLocally();
        return;
      }

      if (args[0] === '-c') {
        const code = input.slice(input.indexOf('-c') + 2).trim().replace(/^["'`]|["'`]$/g, '');
        if (!code) {
          addLog('stderr', 'Usage: python -c "print(123)"');
          return;
        }
        await runPythonSource(code, '▶  python -c');
        return;
      }

      const requestedPath = args.join(' ');
      if (!activeTab || lang !== 'python') {
        addLog('stderr', 'Open a Python file first.');
        return;
      }

      if (requestedPath !== activeTab.path && requestedPath !== basename(activeTab.path)) {
        addLog('stderr', 'This browser terminal can run the active Python tab or inline code with python -c.');
        return;
      }

      await runLocally();
      return;
    }

    addLog('stderr', `Command not found: ${command}`);
  }, [activeTab, activeTabPath, addLog, lang, openFile, runLocally, runPythonSource, saveActiveFile, tabs, terminalHistory]);

  const clearTerminal = useCallback(() => {
    setTerminalLogs([{ type: 'system', text: '  Terminal cleared.' }]);
  }, []);

  const toggleEditorPane = useCallback(() => {
    setPaneMode(prev => prev === 'editor' ? 'split' : 'editor');
  }, []);

  const toggleTerminalPane = useCallback(() => {
    setPaneMode(prev => prev === 'terminal' ? 'split' : 'terminal');
  }, []);

  const handleTerminalKeyDown = useCallback(async (event) => {
    if (stdinPending) {
      if (event.key === 'Enter') {
        submitStdin();
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      await handleTerminalCommand(terminalInput);
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      clearTerminal();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setTerminalHistoryIndex(prev => {
        const nextIndex = prev < 0 ? terminalHistory.length - 1 : Math.max(0, prev - 1);
        const nextValue = terminalHistory[nextIndex] ?? '';
        setTerminalInput(nextValue);
        return nextIndex;
      });
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setTerminalHistoryIndex(prev => {
        if (prev < 0) return -1;
        const nextIndex = prev + 1;
        if (nextIndex >= terminalHistory.length) {
          setTerminalInput('');
          return -1;
        }
        setTerminalInput(terminalHistory[nextIndex]);
        return nextIndex;
      });
    }
  }, [clearTerminal, handleTerminalCommand, stdinPending, submitStdin, terminalHistory, terminalInput]);

  // ─────────── Download active file ───────────
  const downloadFile = () => {
    if (!activeTab) return;
    const blob = new Blob([editorRef.current?.getValue() || activeTab.content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = basename(activeTab.path); a.click();
  };

  // ─────────── Login Screen ───────────
  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <div style={{ maxWidth: '380px', width: '100%', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #0071e3, #0a84ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 0 40px rgba(0,113,227,0.3)'
            }}>
              <Code size={28} color="white" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px' }}>GlobEditor</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5 }}>The cloud IDE. Sign in to access your workspace.</p>
          </div>

          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%', padding: '14px',
              background: 'white', color: '#000',
              fontSize: '14px', fontWeight: '600', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'opacity 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </button>
          <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-dim)' }}>
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>
    );
  }

  // ─────────── IDE Layout ───────────
  const activeTabObj = tabs.find(t => t.path === activeTabPath);
  const activeLang = activeTabObj ? getLang(activeTabObj.path) : '';

  return (
    <div className="app-container">
      {/* ─── Header ─── */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #0071e3, #0a84ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Code size={13} color="white" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>GlobEditor</span>
          {activeTabObj && (
            <>
              <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>/</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {basename(activeTabObj.path)}
                {activeTabObj.modified && <span style={{ color: 'var(--accent-primary)', marginLeft: '4px' }}>●</span>}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTabObj && (
            <>
              <button onClick={downloadFile} className="btn-icon" title="Download file"><Download size={14} /></button>
              <button onClick={saveActiveFile} className="btn-icon" title="Save (Ctrl+S)">
                <Save size={14} color={activeTabObj?.modified ? 'var(--accent-primary)' : undefined} />
              </button>
              <button onClick={runLocally} className="btn-primary" disabled={isExecuting} title="Run Locally">
                {isExecuting ? <span style={{ display:'flex', gap:'4px', alignItems:'center' }}><span className="loading-spinner" style={{width:10,height:10,borderWidth:1.5}} />Running</span> : '▶  Run Local'}
              </button>
            </>
          )}
          {isAdmin && <span className="admin-badge" style={{ marginLeft: '4px' }}>ADMIN</span>}
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
          <button className="btn-icon" onClick={signOut} title="Sign out"><LogOut size={15} /></button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Activity Bar */}
        <div className="sidebar activity-bar">
          {[
            { id: 'files',    icon: FileCode,       title: 'Explorer' },
            { id: 'search',   icon: Search,         title: 'Search' },
            { id: 'settings', icon: Settings,       title: 'Settings' },
          ].map(({ id, icon: Icon, title }) => (
            <button
              key={id}
              title={title}
              className={`btn-icon ${activePanel === id ? 'active' : ''}`}
              onClick={() => setActivePanel(p => p === id ? null : id)}
              style={{ color: activePanel === id ? 'var(--accent-primary)' : 'var(--text-dim)', marginBottom: '8px' }}
            >
              <Icon size={20} strokeWidth={1.8} />
            </button>
          ))}
        </div>

        {/* Side Panel */}
        {activePanel === 'files'   && <FileExplorer isAdmin={isAdmin} user={user} onSelectFile={openFile} activeFilePath={activeTabPath} addToast={addToast} />}
        {activePanel === 'search'  && <SearchPanel tabs={tabs} onOpenTab={openFile} />}
        {activePanel === 'settings'&& <SettingsPanel settings={settings} onUpdate={updateSetting} />}

        {/* Editor + Terminal Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Tab Bar */}
          <div className="tab-bar">
            {tabs.map(tab => (
              <div
                key={tab.path}
                className={`tab ${activeTabPath === tab.path ? 'active' : ''}`}
                onClick={() => setActiveTabPath(tab.path)}
              >
                <FileCode size={12} color={getLangColor(getLang(tab.path))} style={{ flexShrink: 0 }} />
                <span className="tab-name">{basename(tab.path)}</span>
                {tab.modified
                  ? <span className="tab-modified-dot" />
                  : <span className="tab-close" onClick={e => closeTab(tab.path, e)}><X size={10} /></span>
                }
                {tab.modified && (
                  <span className="tab-close" onClick={e => closeTab(tab.path, e)}><X size={10} /></span>
                )}
              </div>
            ))}
            <div className="tab-bar-actions">
              <button
                className="tab-pane-btn"
                onClick={toggleEditorPane}
                title={paneMode === 'editor' ? 'Restore split view' : 'Maximize editor'}
              >
                {paneMode === 'editor' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000', display: paneMode === 'terminal' ? 'none' : 'block' }}>
            {!activeTabObj ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-dim)' }}>
                <Code size={48} style={{ opacity: 0.06 }} />
                <span style={{ fontSize: '13px' }}>Open a file to start editing</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Use the explorer on the left</span>
              </div>
            ) : (
              <Editor
                key={activeTabPath}
                height="100%"
                theme={settings.theme}
                language={getLang(activeTabObj.path)}
                value={activeTabObj.content}
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: settings.minimap },
                  fontSize: settings.fontSize,
                  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  fontLigatures: true,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  wordWrap: settings.wordWrap,
                  tabSize: settings.tabSize,
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  bracketPairColorization: { enabled: true },
                  quickSuggestions: { other: true, comments: false, strings: true },
                  suggestOnTriggerCharacters: true,
                  acceptSuggestionOnEnter: 'on',
                  tabCompletion: 'on',
                  wordBasedSuggestions: 'currentDocument',
                  snippetSuggestions: 'inline',
                  parameterHints: { enabled: true },
                  inlineSuggest: { enabled: true },
                }}
              />
            )}
          </div>

          {/* Terminal */}
          <div className="terminal" style={{ height: paneMode === 'split' ? terminalHeight : undefined, display: paneMode === 'editor' ? 'none' : 'flex', flexDirection: 'column', flexShrink: 0, flex: paneMode === 'terminal' ? 1 : '0 0 auto' }}>
            {/* Terminal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <TerminalIcon size={12} color="var(--text-muted)" />
              <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>TERMINAL</span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Built-in browser shell</span>
              <div style={{ flex: 1 }} />
              <button
                className="tab-pane-btn"
                onClick={toggleTerminalPane}
                title={paneMode === 'terminal' ? 'Restore split view' : 'Maximize terminal'}
              >
                {paneMode === 'terminal' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
              <button
                onClick={clearTerminal}
                style={{ fontSize: '10px', color: 'var(--text-dim)', cursor: 'pointer' }}
                title="Clear terminal"
              >
                Clear
              </button>
            </div>

            {/* Log Output */}
            <div ref={terminalRef} onMouseDown={() => stdinRef.current?.focus()} style={{
              flex: 1, overflowY: 'auto', padding: '8px 20px',
              fontFamily: "'Fira Code', monospace", fontSize: settings.termFontSize,
              lineHeight: '1.75',
            }}>
              {terminalLogs.map((log, i) => {
                const colors = {
                  'system':       'var(--text-dim)',
                  'command':      'var(--accent-primary)',
                  'stdout':       'var(--text-main)',
                  'stderr':       'var(--accent-danger)',
                  'error':        'var(--accent-danger)',
                  'stdin-prompt': 'var(--accent-success)',
                  'stdin-value':  'var(--accent-success)',
                };
                return (
                  <div key={i} style={{ color: colors[log.type] || 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {log.text}
                  </div>
                );
              })}
              {isExecuting && !stdinPending && (
                <span style={{ color: 'var(--text-dim)', animation: 'none' }}>▌</span>
              )}
            </div>

            {/* Terminal Input Row */}
            
              <div className="terminal-input-row">
                <span className="terminal-prompt-icon">›</span>
                <input
                  ref={stdinRef}
                  className="terminal-stdin"
                  value={stdinPending ? stdinValue : terminalInput}
                  onChange={e => stdinPending ? setStdinValue(e.target.value) : setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder="Type input and press Enter…"
                />
              </div>
          </div>
        </div>
      </div>

      {/* ─── Status Bar ─── */}
      <div className={`status-bar ${terminalLogs.some(l => l.type === 'error' || l.type === 'stderr') && !isExecuting ? 'status-bar-error' : ''}`}
        style={{ background: isExecuting ? '#2d5a27' : undefined }}>
        <div className="status-bar-item">
          <GitBranch size={10} />
          main
        </div>
        {activeTabObj && (
          <>
            <div className="status-bar-item" style={{ color: 'white' }}>
              {basename(activeTabObj.path)}
            </div>
            <div className="status-bar-item">
              {getLang(activeTabObj.path)}
            </div>
          </>
        )}
        <div className="status-bar-spacer" />
        {activeTabObj && (
          <div className="status-bar-item">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </div>
        )}
        <div className="status-bar-item">
          {settings.tabSize === 2 ? 'Spaces: 2' : 'Spaces: 4'}
        </div>
        <div className="status-bar-item">
          UTF-8
        </div>
        {isExecuting && <div className="status-bar-item" style={{ color: '#a2e3a2' }}>⟳ Running…</div>}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

