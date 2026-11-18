import React, { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { basename } from '../lib/editor';

export default function SearchPanel({ tabs, onOpenTab, searchAllFiles }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [scope, setScope] = useState('tabs');
  const [error, setError] = useState('');

  const doSearch = useCallback(async (q, currentScope) => {
    if (!q.trim()) { setResults([]); setError(''); return; }
    setSearching(true);
    try {
      if (currentScope === 'all') {
        setResults(await searchAllFiles(q));
      } else {
        const found = [];
        const needle = q.toLowerCase();
        for (const tab of tabs) {
          tab.content.split('\n').forEach((line, idx) => {
            if (line.toLowerCase().includes(needle)) {
              found.push({ path: tab.path, line: idx + 1, text: line.trim(), match: q });
            }
          });
        }
        setResults(found.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line));
      }
      setError('');
    } catch (e) {
      setResults([]);
      setError(e.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  }, [tabs, searchAllFiles]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query, scope), 300);
    return () => clearTimeout(t);
  }, [query, scope, doSearch]);

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
          placeholder={scope === 'all' ? 'Search all workspace files…' : 'Search in open files…'}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="search-scope">
        <button className={scope === 'tabs' ? 'active' : ''} onClick={() => setScope('tabs')}>Open tabs</button>
        <button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>All files</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {searching && <div className="search-empty">Searching…</div>}
        {!searching && error && <div className="search-empty" style={{ color: 'var(--accent-danger)' }}>{error}</div>}
        {!searching && !error && query && results.length === 0 && (
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
            Type to search across<br />{scope === 'all' ? 'your whole workspace' : 'all open files'}
          </div>
        )}
      </div>
    </div>
  );
}
