import { parentPort, workerData } from 'worker_threads';

interface SandboxPayload {
  code: string;
  inputData: any;
}

const { code, inputData } = workerData as SandboxPayload;

try {
  const logs: string[] = [];
  const customConsole = {
    log: (...args: any[]) => logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')),
    error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' '))
  };

  const userFunction = new Function('input', 'console', `
    let output = null;
    try {
      ${code}
    } catch (err: any) {
      throw new Error('Script execution error: ' + err.message);
    }
    return output;
  `);

  const result = userFunction(inputData, customConsole);

  parentPort?.postMessage({
    success: true,
    result,
    logs
  });
} catch (err: any) {
  parentPort?.postMessage({
    success: false,
    error: err.message || 'Unknown sandbox execution error'
  });
}