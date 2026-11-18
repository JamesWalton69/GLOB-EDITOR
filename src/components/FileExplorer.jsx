import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileCode, Folder, ChevronRight, FilePlus, FolderPlus,
  Trash2, RefreshCw, Pencil, Shield,
} from 'lucide-react';
import { listDirectory, writeFile, createFolder, deletePath, renamePath } from '../lib/storage';
import { basename, getLang, getLangColor } from '../lib/editor';
import ContextMenu from './ContextMenu';

export default function FileExplorer({ isAdmin, user, onSelectFile, activeFilePath, addToast, onPathsRenamed }) {
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(100);
  const [currentPath, setCurrentPath] = useState(isAdmin ? '' : user.$id);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null); // 'file' | 'folder' | null
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [ctxMenu, setCtxMenu] = useState(null);
  const newInputRef = useRef(null);
  const renameInputRef = useRef(null);

  useEffect(() => { if (creating && newInputRef.current) newInputRef.current.focus(); }, [creating]);
  useEffect(() => { if (renaming && renameInputRef.current) renameInputRef.current.focus(); }, [renaming]);

  const fetchStorage = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listDirectory(currentPath));
      setVisibleCount(100);
    } catch (err) { addToast('error', err.message); }
    setLoading(false);
  }, [currentPath, addToast]);

  // Fetch is tied to the external storage path changing, so the loading state must update here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStorage(); }, [fetchStorage]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) { setCreating(null); return; }
    const isFile = creating === 'file';
    const targetPath = currentPath ? `${currentPath}/${name}` : name;
    try {
      if (isFile) await writeFile(targetPath, '');
      else await createFolder(targetPath);
      addToast('success', `Created ${name}`);
      setCreating(null); setNewName('');
      fetchStorage();
      if (isFile) onSelectFile(targetPath);
    } catch (err) {
      addToast('error', 'Create failed: ' + err.message);
    }
  };

  const handleDelete = async (item) => {
    const isFolder = !item.id;
    const pathToDelete = currentPath ? `${currentPath}/${item.name}` : item.name;
    if (!window.confirm(`Delete "${item.name}"${isFolder ? ' and all its contents' : ''}?`)) return;
    try {
      await deletePath(pathToDelete);
      addToast('success', `Deleted ${item.name}`);
      fetchStorage();
    } catch (err) { addToast('error', 'Delete failed: ' + err.message); }
  };

  const handleRename = async (e, item) => {
    e.preventDefault();
    const name = renameValue.trim().replace(/^\/+|\/+$/g, '');
    if (!name || name === item.name || name.includes('/')) {
      if (name.includes('/')) addToast('error', 'Names cannot contain "/".');
      setRenaming(null);
      return;
    }
    const oldPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    try {
      await renamePath(oldPath, newPath);
      onPathsRenamed?.(oldPath, newPath);
      addToast('success', `Renamed to ${name}`);
      setRenaming(null); setRenameValue('');
      fetchStorage();
    } catch (err) {
      addToast('error', 'Rename failed: ' + err.message);
      setRenaming(null);
    }
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

  const canGoBack = isAdmin ? currentPath !== '' : currentPath !== user.$id;

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
                maxLength={255}
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
          <>
            {items.slice(0, visibleCount).map(item => {
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
                      maxLength={255}
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
                <span title={item.name} dir="auto" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            })}
            {visibleCount < items.length && (
              <button
                type="button"
                className="explorer-item"
                style={{ width: '100%', color: 'var(--text-muted)' }}
                onClick={() => setVisibleCount(count => count + 100)}
              >
                Show more ({items.length - visibleCount} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenu.items} onClose={() => setCtxMenu(null)} />}
    </div>
  );
}
