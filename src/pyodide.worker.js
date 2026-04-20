import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.mjs';

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/';

let pyodidePromise;
let stdinControl;
let stdinData;

let stdinQueue = new Uint8Array(0);
let stdinQueueOffset = 0;

function post(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function resetStdinState() {
  stdinQueue = new Uint8Array(0);
  stdinQueueOffset = 0;

  if (stdinControl) {
    Atomics.store(stdinControl, 0, 0);
    Atomics.store(stdinControl, 1, 0);
  }

  if (stdinData) {
    stdinData.fill(0);
  }
}

function waitForStdinChunk() {
  if (!stdinControl || !stdinData) {
    throw new Error('Shared stdin buffers were not initialized.');
  }

  post('stdin-request');
  Atomics.store(stdinControl, 0, 1);

  while (Atomics.load(stdinControl, 0) === 1) {
    Atomics.wait(stdinControl, 0, 1);
  }

  const length = Atomics.load(stdinControl, 1);
  const chunk = stdinData.slice(0, length);

  stdinData.fill(0, 0, length);
  Atomics.store(stdinControl, 0, 0);
  Atomics.store(stdinControl, 1, 0);

  return chunk;
}

async function ensurePyodide() {
  if (!pyodidePromise) {
    post('system', { text: 'Loading Pyodide runtime...' });
    pyodidePromise = loadPyodide({ indexURL: PYODIDE_INDEX_URL }).then((instance) => {
      instance.setStdout({ batched: (text) => post('stdout', { text }) });
      instance.setStderr({ batched: (text) => post('stderr', { text }) });
      instance.setStdin({
        read: (buffer) => {
          if (stdinQueueOffset >= stdinQueue.length) {
            stdinQueue = waitForStdinChunk();
            stdinQueueOffset = 0;
          }

          if (stdinQueue.length === 0) {
            return 0;
          }

          const remaining = stdinQueue.length - stdinQueueOffset;
          const bytesToCopy = Math.min(buffer.length, remaining);
          buffer.set(stdinQueue.subarray(stdinQueueOffset, stdinQueueOffset + bytesToCopy), 0);
          stdinQueueOffset += bytesToCopy;
          return bytesToCopy;
        },
        isatty: true,
      });
      post('system', { text: 'Pyodide ready.' });
      return instance;
    });
  }

  return pyodidePromise;
}

self.onmessage = async (event) => {
  const { type, controlBuffer, inputBuffer, python } = event.data;

  if (type === 'init') {
    stdinControl = new Int32Array(controlBuffer);
    stdinData = new Uint8Array(inputBuffer);
    resetStdinState();

    try {
      await ensurePyodide();
      post('ready');
    } catch (error) {
      post('stderr', { text: error.message });
      post('done', { success: false });
    }
    return;
  }

  if (type !== 'run') {
    return;
  }

  try {
    const pyodide = await ensurePyodide();
    resetStdinState();
    await pyodide.loadPackagesFromImports(python);
    await pyodide.runPythonAsync(python);
    post('done', { success: true });
  } catch (error) {
    post('stderr', { text: error.message });
    post('done', { success: false });
  }
};
