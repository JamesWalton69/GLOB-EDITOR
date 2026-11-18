// Pure helpers shared by the editor shell and its panels.

const LANG_MAP = {
  py: 'python', js: 'javascript', jsx: 'javascript',
  ts: 'typescript', tsx: 'typescript', html: 'html',
  css: 'css', java: 'java', c: 'c', cpp: 'cpp',
  json: 'json', md: 'markdown', txt: 'plaintext', sql: 'sql',
};

const LANG_ICON_COLOR = {
  python: '#3b82f6', javascript: '#f59e0b', java: '#f97316',
  html: '#f43f5e', css: '#8b5cf6', c: '#06b6d4', cpp: '#06b6d4',
  default: '#6b7280',
};

export const getLang = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return LANG_MAP[ext] || 'plaintext';
};

export const getLangColor = (lang) => LANG_ICON_COLOR[lang] || LANG_ICON_COLOR.default;

export const basename = (path = '') => path.split('/').pop();
