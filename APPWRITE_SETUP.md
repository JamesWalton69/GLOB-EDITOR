# Appwrite + compiler setup

This app has no Supabase dependency. It uses Appwrite for auth and file storage, and one Appwrite Function to call JDoodle / OnlineCompiler.io with server-side keys.

## 1. Appwrite project

1. Create a project at <https://cloud.appwrite.io> (or self-host).
2. **Settings → Platforms → Add platform → Web app.** Add every hostname you deploy on (`localhost` for dev) — required for CORS and OAuth redirects.
3. **Auth → Settings → Google → Enable.** Put your OAuth client ID/secret in and copy the redirect URI Appwrite shows back into Google Cloud.
4. **Email delivery is required for email sign-in.** Under **Settings → Mailer**, configure SMTP (or Appwrite Cloud's mail service) and verify the sender. The email sign-in flow calls `createEmailToken`, which sends a 6-digit code valid for 15 minutes; the code is then exchanged for a session via `createSession`. New email addresses create an account automatically.
5. The nav **Sign in** button and the **Sign in with email** buttons open the code dialog. Google sign-in remains available from the hero and footer CTA.

## 2. Storage bucket

1. **Storage → Create bucket**, id `editor_files` (or set `VITE_APPWRITE_BUCKET_ID` to the bucket's actual ID — Appwrite generates one, e.g. `6afc2a0a...`).
2. Turn **File level security** on.
3. Bucket **Permissions** → role **All users** → enable **Create** and **Read**. `listFiles` requires bucket-level Read; Update/Delete stay off and are granted per file. Each file gets owner (and optional admin) permissions when created.

Note: bucket-level Read lets signed-in users see file *metadata* across workspaces; file contents are still protected by the per-file permissions. Admin/master-view isolation would need a server-side function to filter lists — the current client setup does not enforce it.

### How paths work

Appwrite file IDs can't contain `/`, so the editor stores each file as:

- `fileId`: a random ID (`ID.unique()`)
- `name`: the filename
- `folder`: the virtual folder path, e.g. `<userId>/projects/demo`

`src/lib/storage.js` derives folders from the `folder` field and maps a path like `<userId>/main.py` to the right file. Empty folders are kept alive with a hidden `.keep` file. Every file is created with owner read/write permissions plus, if configured, admin read/write.

## 3. Compiler function

1. **Functions → Create function** → name `compiler`, runtime **Node.js 22**, entrypoint `src/main.js`, scope `functions.write` for authenticated users.
2. Deploy it from this repo:
   ```bash
   cd functions/compiler
   appwrite push function   # after `appwrite init function` and linking the function ID
   ```
   Or zip `functions/compiler` and upload it in the console. No npm dependencies are needed.
3. **Function → Settings → Environment variables:**

   | Variable | Value |
   | --- | --- |
   | `JDOODLE_CLIENT_ID` | from your JDoodle dashboard |
   | `JDOODLE_CLIENT_SECRET` | from your JDoodle dashboard |
   | `ONLINECOMPILER_API_KEY` | from <https://api.onlinecompiler.io> |
   | `REQUIRE_SESSION` | `true` (recommended) |

   Never put these in the frontend `.env.local` — anything prefixed `VITE_` ships in the JS bundle.
4. Set the function timeout to at least 30 seconds (compilation counts toward it).
5. Copy the function ID into `VITE_APPWRITE_FUNCTION_ID`.

The function only forwards the `language` values the editor knows. If JDoodle changes a `versionIndex`, edit `JDOODLE_LANG` in `functions/compiler/src/main.js` and redeploy. OnlineCompiler.io compiler ids come from `GET https://api.onlinecompiler.io/api/compilers/`.

## 4. Admin (optional)

Admins can be set two ways in `.env.local`:
- `VITE_APPWRITE_ADMIN_EMAILS` — comma-separated email addresses (checked against the signed-in user's email).
- `VITE_APPWRITE_ADMIN_USER_ID` — a single Appwrite user ID (fallback).

Leave both blank to disable the master view. Note: file-level admin permissions are only granted on files created while the admin ID is configured; older files won't carry them.

## 5. Frontend env

Copy `.env.example` to `.env.local`:

```
VITE_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=...
VITE_APPWRITE_BUCKET_ID=...
VITE_APPWRITE_FUNCTION_ID=...
VITE_APPWRITE_ADMIN_USER_ID=...
VITE_APPWRITE_ADMIN_EMAILS=admin@example.com
```

Then `npm install && npm run dev`.

## Cross-origin isolation

Interactive Python stdin uses `SharedArrayBuffer`. Vite's dev server, `vite preview` and `vercel.json` already send the required COOP/COEP headers. Your production host must do the same or Run Local will refuse to start.

## Current deployment status

The setup above was applied to the Appwrite Cloud project `6afb516d0035500b536b` (Singapore endpoint):

- Bucket `editor_files` (id `6afc2a0a00040f2a7bf2`) — file-level security on; All users Create+Read.
- Function `compiler` (id `6afc2c0f002d562ba984`, Node.js 22) — deployed with the four secret env vars; both JDoodle and OnlineCompiler.io runners verified.
- Auth: Email OTP and Anonymous enabled; mailer working (verification codes are delivered).
- Admins: `VITE_APPWRITE_ADMIN_EMAILS` set to the four admin addresses.

### Google sign-in (configured)

- Google Cloud project `globeditor` (id `globeditor`, number `22010194727`), OAuth consent screen External, user support `nnsjshsb26@gmail.com`.
- OAuth client: Web application `GlobEditor`, client id `22010194727-86ha978j9elgip702tkfos6gtmorgcvt.apps.googleusercontent.com`. The client secret is stored only in the Appwrite Google provider, not in this repo.
- Authorised JavaScript origin `http://localhost:5173`; authorised redirect URI `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/6afb516d0035500b536b`.
- Appwrite Google provider: Browser sign-in enabled with those credentials.
- Publishing status is **Testing** with five test users: `nnsjshsb26@gmail.com`, `manghosh7@gmail.com`, `firstnd58@gmail.com`, `recordingacc01@gmail.com`, `recordingacc02@gmail.com`. Only these accounts can complete Google sign-in until the app is published.
- To publish, complete Branding with a real application home page, privacy policy link and terms of service link, then submit for Google verification. Add the production origin and the same Appwrite callback to the OAuth client.

Still outstanding:
- **Admin master view** — bucket-level Read exposes file metadata to all signed-in users. Enforcing true per-user isolation while allowing an admin view needs the storage reads moved behind a server function.
