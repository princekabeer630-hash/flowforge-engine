import { Worker } from 'worker_threads';
import path from 'path';

export function runInSandbox(code: string, inputData: any, timeoutMs: number = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    // Point to the compiled/built worker file path relative to this service
    const workerPath = path.resolve(__dirname, 'sandboxWorker.js');

    const worker = new Worker(workerPath, {
      workerData: { code, inputData }
    });

    let isFinished = false;

    const timer = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        worker.terminate();
        reject(new Error(`Sandbox execution timed out after ${timeoutMs}ms (infinite loop protection triggered).`));
      }
    }, timeoutMs);

    worker.on('message', (message) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      worker.terminate();

      if (message.success) {
        resolve({ result: message.result, logs: message.logs });
      } else {
        reject(new Error(message.error));
      }
    });

    worker.on('error', (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      worker.terminate();
      reject(err);
    });

    worker.on('exit', (code) => {
      if (!isFinished && code !== 0) {
        isFinished = true;
        clearTimeout(timer);
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}