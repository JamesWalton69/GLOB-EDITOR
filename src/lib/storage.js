import { ID, Query, Permission, Role } from 'appwrite';
import { account, storage, APPWRITE_BUCKET_ID, ADMIN_USER_ID } from './appwrite';

const BUCKET = APPWRITE_BUCKET_ID;
const PAGE_SIZE = 100;

const norm = (folder = '') => String(folder).replace(/^\/+|\/+$/g, '');
const splitPath = (path = '') => {
  const parts = String(path).split('/').filter(Boolean);
  return { folder: parts.slice(0, -1).join('/'), name: parts[parts.length - 1] || '' };
};
const toPath = (folder, name) => (folder ? `${folder}/${name}` : name);
const metaPath = (file) => toPath(norm(file.folder), file.name);

// Always read the current user — a cached ID goes stale after sign-out/sign-in
// as a different account and produces invalid file permission strings.
async function currentUserId() {
  return (await account.get()).$id;
}

// Appwrite permissions are per file. Grant the owner full access and, when configured,
// the admin read/write so the master view can browse every workspace.
async function filePermissions() {
  const uid = await currentUserId();
  const perms = [Permission.read(Role.user(uid)), Permission.write(Role.user(uid))];
  if (ADMIN_USER_ID && ADMIN_USER_ID !== uid) {
    perms.push(Permission.read(Role.user(ADMIN_USER_ID)), Permission.write(Role.user(ADMIN_USER_ID)));
  }
  return perms;
}

async function allFiles() {
  const out = [];
  let offset = 0;
  while (true) {
    const { files } = await storage.listFiles({
      bucketId: BUCKET,
      queries: [Query.limit(PAGE_SIZE), Query.offset(offset)],
      total: false,
    });
    out.push(...files);
    if (files.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return out;
}

export async function findFile(path) {
  const target = norm(path);
  const files = await allFiles();
  return files.find((file) => metaPath(file) === target) || null;
}

// Returns the immediate children of a virtual folder. Appwrite folders are just a
// `folder` string on each file, so subfolders are derived from the stored paths.
export async function listDirectory(path = '') {
  const current = norm(path);
  const files = await allFiles();
  const folders = new Set();

  files.forEach((file) => {
    const folder = norm(file.folder);
    if (current && folder !== current && !folder.startsWith(`${current}/`)) return;
    const rest = current ? folder.slice(current.length + 1) : folder;
    if (rest) folders.add(rest.split('/')[0]);
  });

  return [
    ...[...folders].sort().map((name) => ({ name, id: null })),
    ...files
      .filter((file) => norm(file.folder) === current && file.name !== '.keep')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((file) => ({ name: file.name, id: file.$id })),
  ];
}

export async function listAllFiles(prefix = '') {
  const base = norm(prefix);
  const files = await allFiles();
  return files
    .map(metaPath)
    .filter((path) => !base || path === base || path.startsWith(`${base}/`));
}

export async function readFile(path) {
  const file = await findFile(path);
  if (!file) throw new Error(`File not found: ${path}`);

  const url = storage.getFileDownload({ bucketId: BUCKET, fileId: file.$id });
  const headers = {};
  // The web SDK authenticates downloads with this header because the session cookie is HTTP-only.
  const fallback = typeof localStorage !== 'undefined' ? localStorage.getItem('cookieFallback') : null;
  if (fallback) headers['X-Fallback-Cookies'] = fallback;

  const response = await fetch(url, { headers, credentials: 'include' });
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  return response.text();
}

export async function writeFile(path, content, { overwrite = true } = {}) {
  const { folder, name } = splitPath(path);
  if (!name) throw new Error('Invalid file path');

  const existing = await findFile(path);
  if (existing && !overwrite) throw new Error(`"${name}" already exists.`);
  if (existing) await storage.deleteFile({ bucketId: BUCKET, fileId: existing.$id });

  // Appwrite has no "replace content" endpoint — a save recreates the file with a fresh ID.
  await storage.createFile({
    bucketId: BUCKET,
    fileId: ID.unique(),
    file: new File([content ?? ''], name, { type: 'text/plain' }),
    folder,
    permissions: await filePermissions(),
  });
}

export async function createFolder(path) {
  await writeFile(`${norm(path)}/.keep`, '', { overwrite: false });
}

export async function deletePath(path) {
  const target = norm(path);
  const files = await allFiles();
  const victims = files.filter((file) => {
    const filePath = metaPath(file);
    return filePath === target || filePath.startsWith(`${target}/`);
  });
  for (const file of victims) {
    await storage.deleteFile({ bucketId: BUCKET, fileId: file.$id });
  }
}

export async function renamePath(from, to) {
  const oldBase = norm(from);
  const newBase = norm(to);
  if (!oldBase || !newBase || oldBase === newBase) throw new Error('Invalid rename');

  const files = await allFiles();
  const known = new Set(files.map(metaPath));
  const victims = files.filter((file) => {
    const filePath = metaPath(file);
    return filePath === oldBase || filePath.startsWith(`${oldBase}/`);
  });
  if (!victims.length) throw new Error('Nothing to rename.');

  const targets = victims.map((file) => newBase + metaPath(file).slice(oldBase.length));
  const clash = targets.find((path) => known.has(path));
  if (clash) throw new Error(`"${clash}" already exists.`);

  const contents = await Promise.all(victims.map((file) => readFile(metaPath(file))));
  for (let i = 0; i < victims.length; i += 1) {
    await storage.deleteFile({ bucketId: BUCKET, fileId: victims[i].$id });
    await writeFile(targets[i], contents[i], { overwrite: false });
  }
}
