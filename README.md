# GlobEditor

A browser-based cloud IDE: Monaco editor, multi-tab file management in Appwrite Storage, an in-browser Python runtime (Pyodide), and cloud compilation through an Appwrite Function backed by JDoodle and OnlineCompiler.io.

## Stack

- React 19 + Vite 8
- Monaco Editor (`@monaco-editor/react`)
- Appwrite (Google auth + private `editor_files` bucket + compiler Function)
- Pyodide in a Web Worker for local Python execution
- Lucide icons

## Setup

Follow **[APPWRITE_SETUP.md](APPWRITE_SETUP.md)** — it covers the project, bucket, Google OAuth, the compiler function and its API keys, and the admin ID.

Short version:

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Appwrite IDs.
3. Deploy `functions/compiler` with your JDoodle / OnlineCompiler.io keys as function environment variables.
4. `npm run dev`

### Cross-origin isolation

`SharedArrayBuffer` is required for interactive Python stdin. Vite's dev server and `vite preview` send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (see `vite.config.js`); the production host must send the same headers (`vercel.json` does).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build (with isolation headers) |
| `npm run lint` | ESLint |

## Layout

```
src/
  App.jsx              IDE shell: tabs, terminal, execution engines
  components/          Explorer, search, settings, toasts, context menu, landing page
  context/             AuthProvider
  lib/                 Appwrite client, auth, storage adapter, compiler client, helpers
  workers/             Pyodide worker with shared-memory stdin
  App.css / index.css  Styles
functions/compiler/    Server-side JDoodle / OnlineCompiler.io proxy
```

- `src/lib/storage.js` — Appwrite Storage adapter: virtual folders, recursive delete/rename, downloads
- `src/lib/compiler.js` — calls the compiler Function (no keys in the browser)
- `src/lib/editor.js` — shared language/helper utilities
- `src/context/AuthContext.jsx` — Google sign-in session state

Editor settings (font size, theme, word wrap, minimap, tab size, auto-save, cloud runner, terminal font) persist in `localStorage`.
