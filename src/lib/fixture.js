// Dev-only adversarial datasets. The worst case enters through the same boundary
// as real data (storage.js read functions + copy constants + user object).

export const MODES = ['demo', 'worst', 'empty', 'one', 'huge'];

export function getMode() {
  if (!import.meta.env.DEV) return 'demo';
  const value = new URLSearchParams(window.location.search).get('data');
  return MODES.includes(value) ? value : 'demo';
}

const longLine = 'collaborators.push({ name: "Aleksandra Wiśniewska-Kowalczyk", role: "Senior Product Design Engineer, Platform Infrastructure", email: "bartholomew.fitzgerald@northwind-industries-holdings.example.com", status: "Invitation expired 12 days ago" }); // ' + 'x'.repeat(1800);

export const WORST_USER = {
  $id: 'demo-user',
  email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
  name: 'Aleksandra Wiśniewska-Kowalczyk',
};

export const WORST_LOGS = [
  { type: 'stdout', text: 'Loaded 1,284 workspaces for bartholomew.fitzgerald@northwind-industries-holdings.example.com' },
  { type: 'stdout', text: longLine },
  { type: 'stderr', text: 'TypeError: Cannot read properties of undefined (reading "folder") at storage.js:58:19' },
  { type: 'system', text: 'Invitation expired 12 days ago · Benachrichtigungseinstellungen · Paramètres de confidentialité et de sécurité' },
];

export const WORST_TOAST = {
  type: 'error',
  message: 'Rename failed: "Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf" already exists in Workspaces/2026/Q4 Planning — Enterprise Rollout/',
};

const file = (name, content = '') => ({ name, content });

const WORST_FILES = [
  file('Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf', longLine),
  file('IMG_20250914_183022_HDR_portrait_edited_edited.HEIC', 'camera roll'),
  file('customer-feedback-from-enterprise-onboarding.js', 'console.log("hello from JavaScript"); console.error("js stderr works");'),
  file('王秀英.py', 'print("你好")'),
  file('نور الهدى عبد الرحمن.py', 'print("مرحبا")'),
  file('🦊 Fox.py', 'print("fox")'),
  file('J', 'one letter'),
  file('  Sam   Lee .py', 'spaces'),
  file('Đặng Thị Ngọc Hân.py', 'print("xin chào")'),
  file('a@b.test', 'shortest'),
  file('preview.html', '<!doctype html><html><body style="font:16px system-ui;padding:24px"><h1>HTML preview works</h1><script>document.body.style.background="#eef4ff"</script></body></html>'),
  file('Main.java', 'class Main { public static void main(String[] a) { System.out.println("java"); } }'),
  file('main.c', '#include <stdio.h>\nint main(void){ printf("c\\n"); return 0; }'),
  file('undefined', 'no value'),
  file('NaN', 'not a number'),
  file('Workspaces/2026/Q4 Planning — Enterprise Rollout/Paramètres de confidentialité et de sécurité.md', 'long nested path'),
  file('Workspaces/2026/Q4 Planning — Enterprise Rollout/<script>alert(1)</script>.txt', '<script>alert(1)</script> &amp; **bold**'),
];

export const WORST_COPY = {
  heroTitle: 'Code anywhere. Set up nowhere with an unreasonably long unbreakable Benachrichtigungseinstellungen headline.',
  heroLead: 'A full editor in your browser, with Python and cloud runners ready — plus Paramètres de confidentialité et de sécurité for every workspace, including enterprise onboarding.',
  runnersTitle: 'Two ways to run, with a translation that is considerably longer than the English original',
  runnersLead: 'Python runs in this tab. Compiled languages run in a cloud sandbox. Invitation expired 12 days ago.',
  rows: [
    ['Monaco editor with syntax highlighting', 'Syntax highlighting, completions and a command palette from VS Code — Benachrichtigungseinstellungen und Datenschutzeinstellungen.'],
    ['Tabs and folders', 'Open several files, create folders, rename and delete from the tree. Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf'],
    ['Search across files', 'Find a line in your open tabs, or across the whole workspace — bartholomew.fitzgerald@northwind-industries-holdings.example.com'],
    ['Integrated terminal', 'Run commands, inspect output and answer program input in the page. TypeError: Cannot read properties of undefined (reading "folder")'],
    ['Email code sign in', 'A six digit code arrives by email. There is no password to remember. Invitation expired 12 days ago.'],
  ],
  tagline: 'One tab for the code, the files and the run, plus an extended description that keeps going well past the point where the layout expected it to stop.',
  closeTitle: 'Start with an empty file, or with a workspace containing 1,284 items',
  closeLead: 'Sign in with your email and the editor is ready. A six digit code arrives by email.',
  table: [
    ['Local runtimes', 'In this browser tab — Pyodide, Web Worker and sandboxed preview', 'Python, JavaScript, HTML'],
    ['JDoodle enterprise cloud runner', 'Cloud sandbox — Invitation expired 12 days ago', 'Python, JavaScript, Java, C, C++, TypeScript, SQL, Rust, Go, PHP, Ruby, Swift, Kotlin'],
    ['OnlineCompiler.io', 'Cloud sandbox', 'customer-feedback-from-enterprise-onboarding-languages'],
  ],
  firstRowName: 'Senior Product Design Engineer, Platform Infrastructure',
};

const HUGE_FILES = Array.from({ length: 1000 }, (_, i) =>
  file(`workspace-${String(i + 1).padStart(4, '0')}/report-${i + 1}.py`, `print(${i + 1})`));

function fixtureFiles(mode) {
  if (mode === 'empty') return [];
  if (mode === 'one') return [file('Jo.py', 'print("Jo")')];
  if (mode === 'huge') return HUGE_FILES;
  return WORST_FILES;
}

function toMeta(f) {
  const parts = f.name.split('/');
  return { $id: `fixture-${f.name}`, name: parts.pop(), folder: parts.join('/') };
}

export function fixtureMetas(mode) {
  return fixtureFiles(mode).map(toMeta);
}

export function fixturePaths(mode) {
  // Fixture paths deliberately ignore the user prefix so search/explorer see the same set.
  return fixtureFiles(mode).map(f => f.name);
}

export function fixtureContent(mode, path) {
  const clean = String(path).split('/').pop();
  return fixtureFiles(mode).find(f => f.name === path || f.name.split('/').pop() === clean)?.content ?? '';
}
