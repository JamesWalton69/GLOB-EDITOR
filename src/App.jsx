import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, isAdminUser } from './lib/auth';
import { listAllFiles, readFile, writeFile } from './lib/storage';
import { PROVIDERS, runRemote } from './lib/compiler';
import { getMonacoTheme } from './theme.js';
import { getLang, getLangColor, basename } from './lib/editor';
import { getMode, WORST_LOGS, WORST_TOAST } from './lib/fixture';
import ToastContainer from './components/ToastContainer';
import FileExplorer from './components/FileExplorer';
import SearchPanel from './components/SearchPanel';
import SettingsPanel from './components/SettingsPanel';
import CommandPalette from './components/CommandPalette';
import WelcomePanel from './components/WelcomePanel';
import PreviewPanel from './components/PreviewPanel';
import LandingPage from './components/LandingPage';
import './App.css';
import {
  FileCode, Search, Settings, LogOut,
  Save, Code, X,
  Terminal as TerminalIcon, Shield,
  GitBranch, Download, Maximize2, Minimize2,
  Play, Cloud, Sun, Moon, Command
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// ─────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────
const CODEX_LANG = {
  python: 'python', javascript: 'javascript', typescript: 'typescript',
  java: 'java', c: 'c', cpp: 'cpp', sql: 'sql', html: 'html',
};
const LOCAL_LANG_LABELS = {
  python: 'Python (Pyodide)',
  javascript: 'JavaScript (Web Worker)',
  html: 'HTML (sandboxed preview)',
};
const PYODIDE_INPUT_BUFFER_SIZE = 64 * 1024;
const SETTINGS_KEY = 'globeditor.settings';
const SETTINGS_DEFAULTS = {
  fontSize: 13, wordWrap: 'off', minimap: false,
  tabSize: 2, theme: 'auto', autoSave: false, termFontSize: 12,
  cloudProvider: 'jdoodle',
};

const sanitizeSettings = (raw) => {
  const merged = { ...SETTINGS_DEFAULTS, ...(raw || {}) };
  const bounded = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : fallback;
  };
  return {
    ...merged,
    fontSize: bounded(merged.fontSize, 10, 22, SETTINGS_DEFAULTS.fontSize),
    termFontSize: bounded(merged.termFontSize, 10, 18, SETTINGS_DEFAULTS.termFontSize),
    tabSize: [2, 4].includes(Number(merged.tabSize)) ? Number(merged.tabSize) : SETTINGS_DEFAULTS.tabSize,
    // 'vs' was the old default, not a deliberate choice — migrate it to style-following.
    theme: merged.theme === 'vs' ? 'auto'
      : ['auto', 'vs-dark', 'hc-black'].includes(merged.theme) ? merged.theme : SETTINGS_DEFAULTS.theme,
    wordWrap: merged.wordWrap === 'on' ? 'on' : 'off',
    minimap: merged.minimap === true,
    autoSave: merged.autoSave === true,
    cloudProvider: PROVIDERS.some(p => p.id === merged.cloudProvider)
      ? merged.cloudProvider : SETTINGS_DEFAULTS.cloudProvider,
  };
};

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
//  MAIN APP
// ─────────────────────────────────────────────────────
export default function App() {
  const { user, signInWithGoogle, sendEmailCode, confirmEmailCode, signOut } = useAuth();
  const isAdmin = isAdminUser(user);

  // --- Editor state ---
  const [tabs, setTabs] = useState([]); // { path, content, modified }
  const [activeTabPath, setActiveTabPath] = useState(null);
  const [activePanel, setActivePanel] = useState('files');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteFiles, setPaletteFiles] = useState([]);
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null); // monaco editor instance

  // --- Terminal state ---
  const [terminalLogs, setTerminalLogs]   = useState(() => [
    { type: 'system', text: '  GlobEditor Terminal v2.0 — Ready.' },
    ...(import.meta.env.DEV && getMode() === 'worst' ? WORST_LOGS : []),
  ]);
  const [isExecuting, setIsExecuting]     = useState(false);
  const [stdinPending, setStdinPending]   = useState(false);
  const [stdinValue, setStdinValue]       = useState('');
  const [preview, setPreview]             = useState(null);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState([]);
  const terminalHistoryIndexRef = useRef(-1);
  const terminalHeight = 240;
  const [paneMode, setPaneMode] = useState('split');
  const terminalRef  = useRef(null);
  const stdinRef     = useRef(null);
  const pyodideWorkerRef = useRef(null);
  const jsWorkerRef = useRef(null);
  const pyodideWorkerReadyRef = useRef(null);
  const pyodideStdinBuffersRef = useRef(null);
  const textEncoderRef = useRef(new TextEncoder());
  const completionSetupRef = useRef(new Set());
  const fileSearchCacheRef = useRef({ at: 0, files: [] });

  // --- Cursor position ---
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // --- Toasts ---
  const [toasts, setToasts] = useState(() => (
    import.meta.env.DEV && getMode() === 'worst'
      ? [{ id: -1, type: WORST_TOAST.type, message: WORST_TOAST.message }]
      : []
  ));

  // --- Settings ---
  const [settings, setSettings] = useState(() => {
    try {
      return sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    } catch {
      return SETTINGS_DEFAULTS;
    }
  });
  const [styleTick, setStyleTick] = useState(0);
  useEffect(() => {
    const onStyleChange = () => setStyleTick(tick => tick + 1);
    window.addEventListener('globeditor:ui-change', onStyleChange);
    return () => window.removeEventListener('globeditor:ui-change', onStyleChange);
  }, []);
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

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
    jsWorkerRef.current?.terminate();
  }, []);

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
    let content;
    try {
      content = await readFile(path);
    } catch (err) {
      addToast('error', err.message);
      return;
    }
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
    try {
      await writeFile(activeTabPath, content);
    } catch (err) {
      addToast('error', 'Save failed: ' + err.message);
      return;
    }
    setTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, content, modified: false } : t));
    addToast('success', `Saved ${basename(activeTabPath)}`);
  }, [activeTabPath, addToast]);

  const openPalette = useCallback(async () => {
    try {
      const paths = await listAllFiles(isAdmin ? '' : user.$id);
      setPaletteFiles(paths.filter(path => !path.endsWith('/.keep')));
    } catch {
      setPaletteFiles(tabs.map(tab => tab.path));
    }
    setPaletteOpen(true);
  }, [isAdmin, user, tabs]);

  // ── keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActiveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (paletteOpen) setPaletteOpen(false);
        else openPalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveActiveFile, openPalette, paletteOpen]);

  // ── auto-save
  useEffect(() => {
    if (!settings.autoSave) return;
    const t = setInterval(() => { if (activeTabPath) saveActiveFile(); }, 10000);
    return () => clearInterval(t);
  }, [settings.autoSave, activeTabPath, saveActiveFile]);

  // Keep open tabs pointing at the right file after a rename.
  const handlePathsRenamed = useCallback((from, to) => {
    const remap = (path) => path === from || path.startsWith(`${from}/`) ? to + path.slice(from.length) : path;
    setTabs(prev => prev.map(t => ({ ...t, path: remap(t.path) })));
    setActiveTabPath(prev => (prev ? remap(prev) : prev));
  }, []);

  // shortcut: 60s stale search cache, invalidate on save if live full-text search is needed.
  const searchAllFiles = useCallback(async (query) => {
    const q = query.toLowerCase();
    if (Date.now() - fileSearchCacheRef.current.at > 60_000) {
      const root = isAdmin ? '' : user.$id;
      const paths = await listAllFiles(root);
      const entries = await Promise.all(paths
        .filter(path => !path.endsWith('/.keep'))
        .map(async (path) => ({ path, content: await readFile(path) })));
      fileSearchCacheRef.current = { at: Date.now(), files: entries };
    }

    const hits = [];
    for (const file of fileSearchCacheRef.current.files) {
      file.content.split('\n').forEach((line, idx) => {
        if (line.toLowerCase().includes(q)) {
          hits.push({ path: file.path, line: idx + 1, text: line.trim(), match: query });
        }
      });
    }
    return hits.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  }, [isAdmin, user]);

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

    const worker = new Worker(new URL('./workers/pyodide.worker.js', import.meta.url), { type: 'module' });
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

  const runInCloud = useCallback(async () => {
    if (!activeTab) return;
    if (!CODEX_LANG[lang]) { addToast('info', `Cloud run not supported for "${lang}"`); return; }
    const code = editorRef.current?.getValue() || activeTab.content;
    const provider = settings.cloudProvider;
    addLog('command', `☁  ${provider === 'jdoodle' ? 'JDoodle' : 'OnlineCompiler'} run ${basename(activeTab.path)}`);
    setIsExecuting(true);
    try {
      const result = await runRemote({ provider, language: lang, code, input: '' });
      if (result.preview) {
        setPreview({ code: result.output, title: `${basename(activeTab.path)} (cloud)` });
        addLog('system', `Opened HTML preview for ${basename(activeTab.path)}.`);
      } else {
        if (result.output) addLog('stdout', result.output);
        if (result.error) addLog('stderr', result.error);
        if (!result.output && !result.error) addLog('system', 'Process exited with code 0.');
      }
    } catch (e) {
      addLog('error', `Cloud failed: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [activeTab, lang, settings.cloudProvider, addLog, addToast]);

  const runPythonSource = useCallback(async (python, label) => {
    addLog('command', label);
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
      pyodideWorkerRef.current?.postMessage({ type: 'run', python });
    } catch (e) {
      addLog('stderr', e.message);
      setIsExecuting(false);
    }
  }, [addLog, ensurePyodideWorker]);

  const runJavaScriptSource = useCallback((code, label) => {
    addLog('command', label);
    setIsExecuting(true);
    setStdinPending(false);
    setStdinValue('');
    try {
      if (!jsWorkerRef.current) {
        const worker = new Worker(new URL('./workers/js.worker.js', import.meta.url), { type: 'module' });
        worker.addEventListener('message', handlePyodideWorkerMessage);
        worker.addEventListener('error', (event) => {
          addLog('stderr', event.message || 'JavaScript worker crashed.');
          setIsExecuting(false);
        });
        jsWorkerRef.current = worker;
      }
      jsWorkerRef.current.postMessage({ type: 'run', code });
    } catch (error) {
      addLog('stderr', error.message);
      setIsExecuting(false);
    }
  }, [addLog, handlePyodideWorkerMessage]);

  const runLocally = useCallback(async () => {
    if (!activeTab) return;
    const code = editorRef.current?.getValue() || activeTab.content;
    const name = basename(activeTab.path);

    if (lang === 'python') {
      await runPythonSource(code, `▶  python ${name}`);
    } else if (lang === 'javascript') {
      runJavaScriptSource(code, `▶  node ${name}`);
    } else if (lang === 'html') {
      setPreview({ code, title: name });
      addLog('system', `Opened HTML preview for ${name}.`);
    } else if (['java', 'c', 'cpp'].includes(lang)) {
      const message = `Local runtime cannot compile ${lang.toUpperCase()}. Use Run Cloud for Java, C and C++.`;
      addLog('stderr', message);
      addToast('info', message);
    } else {
      addToast('info', `No local runner for "${lang}".`);
    }
  }, [activeTab, lang, addLog, addToast, runPythonSource, runJavaScriptSource]);

  const handleTerminalCommand = useCallback(async (rawValue) => {
    const input = rawValue.trim();
    if (!input) return;

    addLog('command', `${SHELL_PROMPT} $ ${input}`);
    setTerminalHistory(prev => [...prev.slice(-49), input]);
    terminalHistoryIndexRef.current = -1;
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
        'help, clear, pwd, ls, tabs, open <path>, cat [path], run, preview, cloud, python [file|-c "code"], save, echo <text>, history',
        'Local: Python, JavaScript, HTML preview. Cloud: Python, JS, TS, Java, C, C++, SQL, HTML preview.',
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

    if (normalized === 'preview') {
      if (lang !== 'html') {
        addLog('stderr', 'Open an HTML file to use preview.');
        return;
      }
      await runLocally();
      return;
    }

    if (normalized === 'cloud') {
      await runInCloud();
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
  }, [activeTab, activeTabPath, addLog, lang, openFile, runInCloud, runLocally, runPythonSource, saveActiveFile, tabs, terminalHistory]);

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
      const prev = terminalHistoryIndexRef.current;
      const nextIndex = prev < 0 ? terminalHistory.length - 1 : Math.max(0, prev - 1);
      terminalHistoryIndexRef.current = nextIndex;
      setTerminalInput(terminalHistory[nextIndex] ?? '');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const prev = terminalHistoryIndexRef.current;
      if (prev < 0) return;
      const nextIndex = prev + 1;
      if (nextIndex >= terminalHistory.length) {
        terminalHistoryIndexRef.current = -1;
        setTerminalInput('');
        return;
      }
      terminalHistoryIndexRef.current = nextIndex;
      setTerminalInput(terminalHistory[nextIndex]);
    }
  }, [clearTerminal, handleTerminalCommand, stdinPending, submitStdin, terminalHistory, terminalInput]);

  // ─────────── Download active file ───────────
  const downloadFile = () => {
    if (!activeTab) return;
    const blob = new Blob([editorRef.current?.getValue() || activeTab.content], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = basename(activeTab.path); a.click();
  };

  // ─────────── Landing Page (unauthenticated) ───────────
  if (!user) {
    return <LandingPage onSignIn={signInWithGoogle} onSendCode={sendEmailCode} onVerify={confirmEmailCode} />;
  }

  // ─────────── IDE Layout ───────────
  const activeTabObj = tabs.find(t => t.path === activeTabPath);
  const effectiveTheme = settings.theme === 'auto' ? getMonacoTheme() : settings.theme;

  return (
    <div className="app-container" data-style-tick={styleTick}>
      {/* ─── Header ─── */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
            background: 'linear-gradient(135deg, #0071e3, #0a84ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Code size={13} color="white" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>GlobEditor</span>
          {activeTabObj && (
            <span className="header-file-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '12px', flexShrink: 0 }}>/</span>
              <span
                title={basename(activeTabObj.path)}
                style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {basename(activeTabObj.path)}
                {activeTabObj.modified && <span style={{ color: 'var(--accent-primary)', marginLeft: '4px' }}>●</span>}
              </span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={openPalette} className="btn-icon" title="Commands (Ctrl+K)"><Command size={14} /></button>
          {activeTabObj && (
            <>
              <button onClick={downloadFile} className="btn-icon" title="Download file"><Download size={14} /></button>
              <button onClick={saveActiveFile} className="btn-icon" title="Save (Ctrl+S)">
                <Save size={14} color={activeTabObj?.modified ? 'var(--accent-primary)' : undefined} />
              </button>
              <button onClick={runInCloud} className="btn-secondary" disabled={isExecuting} title="Run in Cloud (Python, JS, TS, Java, C, C++, SQL, HTML)">☁  Run Cloud</button>
              <button onClick={runLocally} className="btn-primary" disabled={isExecuting} title={`Run Locally (${Object.values(LOCAL_LANG_LABELS).map(l => l.split(' ')[0]).join(', ')})`}>
                {isExecuting ? <span style={{ display:'flex', gap:'4px', alignItems:'center' }}><span className="loading-spinner" style={{width:10,height:10,borderWidth:1.5}} />Running</span> : '▶  Run Local'}
              </button>
            </>
          )}
          {isAdmin && <span className="admin-badge" style={{ marginLeft: '4px' }}>ADMIN</span>}
          <span className="header-email" title={user.email} style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '180px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        {activePanel === 'files'   && <FileExplorer isAdmin={isAdmin} user={user} onSelectFile={openFile} activeFilePath={activeTabPath} addToast={addToast} onPathsRenamed={handlePathsRenamed} />}
        {activePanel === 'search'  && <SearchPanel tabs={tabs} onOpenTab={openFile} searchAllFiles={searchAllFiles} />}
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
                <span className="tab-name" title={basename(tab.path)}>{basename(tab.path)}</span>
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
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-surface)', display: paneMode === 'terminal' ? 'none' : 'block' }}>
            {!activeTabObj ? (
              <WelcomePanel onShowFiles={() => setActivePanel('files')} onOpenPalette={openPalette} />
            ) : (
              <Editor
                key={activeTabPath}
                height="100%"
                theme={effectiveTheme}
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
              lineHeight: '1.75', overflowWrap: 'anywhere',
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
                  <div key={i} style={{ color: colors[log.type] || 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
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
            <div className="status-bar-item status-bar-file" title={basename(activeTabObj.path)} style={{ color: 'white' }}>
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

      {preview && (
        <PreviewPanel code={preview.code} title={preview.title} onClose={() => setPreview(null)} />
      )}

      <CommandPalette
        key={paletteOpen ? 'palette-open' : 'palette-closed'}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        files={paletteFiles}
        onOpenFile={openFile}
        actions={[
          { id: 'run-local', label: 'Run locally (Python, JS, HTML)', detail: 'Pyodide / Web Worker / preview', icon: Play, run: runLocally },
          { id: 'run-cloud', label: 'Run in cloud', detail: 'Python, JS, TS, Java, C, C++, SQL, HTML', icon: Cloud, run: runInCloud },
          { id: 'save', label: 'Save active file', icon: Save, run: saveActiveFile },
          {
            id: 'theme',
            label: effectiveTheme === 'vs' ? 'Switch to dark editor' : 'Switch to light editor',
            icon: effectiveTheme === 'vs' ? Moon : Sun,
            run: () => updateSetting('theme', effectiveTheme === 'vs' ? 'vs-dark' : 'vs'),
          },
        ]}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

