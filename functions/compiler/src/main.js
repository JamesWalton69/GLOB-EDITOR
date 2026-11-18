// Appwrite Function: proxies cloud compilation so API keys never reach the browser.
// Env vars: JDOODLE_CLIENT_ID, JDOODLE_CLIENT_SECRET, ONLINECOMPILER_API_KEY
// Optional: REQUIRE_SESSION=true to reject executions without an Appwrite session.

const JDOODLE_URL = 'https://api.jdoodle.com/v1/execute';
const ONLINECOMPILER_URL = 'https://api.onlinecompiler.io/api/run-code-sync/';
const MAX_CODE_LENGTH = 100_000;

// Verify versionIndex values in your JDoodle dashboard if a language stops working.
const JDOODLE_LANG = {
  python: { language: 'python3', versionIndex: '6' },
  javascript: { language: 'nodejs', versionIndex: '18' },
  java: { language: 'java', versionIndex: '5' },
  c: { language: 'c', versionIndex: '5' },
  cpp: { language: 'cpp', versionIndex: '5' },
};

// From GET https://api.onlinecompiler.io/api/compilers/ (no key required).
const ONLINECOMPILER_LANG = {
  python: 'python-3.14',
  javascript: 'nodejs-24',
  typescript: 'typescript-deno',
  java: 'openjdk-25',
  c: 'gcc-15',
  cpp: 'g++-15',
  sql: 'sqlite-3',
};

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 300) || `Provider returned ${response.status}`);
  }
  if (!response.ok) throw new Error(data.error || data.message || `Provider returned ${response.status}`);
  return data;
}

async function runJdoodle(language, code, input) {
  const spec = JDOODLE_LANG[language];
  if (!spec) throw new Error(`JDoodle does not support "${language}"`);
  if (!process.env.JDOODLE_CLIENT_ID || !process.env.JDOODLE_CLIENT_SECRET) {
    throw new Error('JDoodle credentials are not configured');
  }

  const data = await postJson(JDOODLE_URL, {
    clientId: process.env.JDOODLE_CLIENT_ID,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    script: code,
    stdin: input,
    language: spec.language,
    versionIndex: spec.versionIndex,
  });

  return {
    provider: 'jdoodle',
    output: data.output || '',
    error: data.error || '',
    statusCode: data.statusCode ?? 200,
    time: data.cpuTime || '',
    memory: data.memory || '',
  };
}

async function runOnlineCompiler(language, code, input) {
  const compiler = ONLINECOMPILER_LANG[language];
  if (!compiler) throw new Error(`OnlineCompiler.io does not support "${language}"`);
  if (!process.env.ONLINECOMPILER_API_KEY) {
    throw new Error('OnlineCompiler.io key is not configured');
  }

  const data = await postJson(ONLINECOMPILER_URL, { compiler, code, input }, {
    Authorization: process.env.ONLINECOMPILER_API_KEY,
  });

  return {
    provider: 'onlinecompiler',
    output: data.output || '',
    error: data.error || '',
    statusCode: data.exit_code ?? 0,
    time: data.time || '',
    memory: data.memory || '',
  };
}

export default async function main(context) {
  const { req, res } = context;

  if (process.env.REQUIRE_SESSION === 'true' && !req.headers?.['x-appwrite-user-id']) {
    return res.json({ error: 'Sign in required' }, 401);
  }

  let payload;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    payload = JSON.parse(raw);
  } catch {
    return res.json({ error: 'Invalid JSON body' }, 400);
  }

  const { provider = 'jdoodle', language, code, input = '' } = payload || {};
  if (!code || typeof code !== 'string' || code.length > MAX_CODE_LENGTH) {
    return res.json({ error: `Code is required and must be under ${MAX_CODE_LENGTH} characters` }, 400);
  }
  if (!['jdoodle', 'onlinecompiler'].includes(provider)) {
    return res.json({ error: 'Unknown provider' }, 400);
  }

  try {
    const result = provider === 'jdoodle'
      ? await runJdoodle(language, code, input)
      : await runOnlineCompiler(language, code, input);
    return res.json(result, 200);
  } catch (error) {
    return res.json({ error: error.message || 'Compilation failed' }, 502);
  }
}
