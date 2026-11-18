// Runs user JavaScript in an isolated worker. Uses the same message protocol as
// pyodide.worker.js so the app's message handler works for both.

function format(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack || value.message;
  try { return JSON.stringify(value); } catch { return String(value); }
}

const emit = (level, args) => self.postMessage({ type: level, text: args.map(format).join(' ') });

const fakeConsole = {
  log: (...args) => emit('stdout', args),
  info: (...args) => emit('stdout', args),
  warn: (...args) => emit('stderr', args),
  error: (...args) => emit('stderr', args),
};

self.onmessage = async (event) => {
  if (event.data?.type !== 'run') return;
  const { code } = event.data;
  try {
    // Wrapping in an async function also supports top-level await.
    const execute = new Function('console', `(async () => {\n${code}\n})()`);
    await execute(fakeConsole);
    self.postMessage({ type: 'done', success: true });
  } catch (error) {
    self.postMessage({ type: 'stderr', text: format(error) });
    self.postMessage({ type: 'done', success: false });
  }
};
