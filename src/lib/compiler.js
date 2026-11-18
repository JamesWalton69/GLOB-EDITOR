import { ExecutionMethod } from 'appwrite';
import { functions, APPWRITE_FUNCTION_ID } from './appwrite';

export const PROVIDERS = [
  { id: 'jdoodle', label: 'JDoodle' },
  { id: 'onlinecompiler', label: 'OnlineCompiler.io' },
];

// The keys live in the Appwrite Function, never in this bundle.
export async function runRemote({ provider, language, code, input = '' }) {
  if (!APPWRITE_FUNCTION_ID) throw new Error('Compiler function is not configured (VITE_APPWRITE_FUNCTION_ID).');

  const execution = await functions.createExecution({
    functionId: APPWRITE_FUNCTION_ID,
    body: JSON.stringify({ provider, language, code, input }),
    xpath: '/run',
    method: ExecutionMethod.POST,
    headers: { 'Content-Type': 'application/json' },
  });

  if (execution.responseStatusCode >= 400) {
    throw new Error(`Compiler service returned ${execution.responseStatusCode}`);
  }

  let result;
  try {
    result = JSON.parse(execution.responseBody);
  } catch {
    throw new Error(execution.responseBody?.slice(0, 300) || 'Empty compiler response');
  }
  if (result.error) throw new Error(result.error);
  return result;
}
