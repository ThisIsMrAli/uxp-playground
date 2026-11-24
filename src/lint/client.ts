import type { LintRequest, LintResponse } from './adapter';
import type { Target } from '../core/types';

/** Main-thread client for the lint worker; latest request wins. */
export class LintClient {
  private worker: Worker;
  private seq = 0;
  private waiting = new Map<number, (r: LintResponse) => void>();
  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', (e: MessageEvent<LintResponse>) => {
      const cb = this.waiting.get(e.data.id);
      this.waiting.delete(e.data.id);
      if (cb && e.data.id === this.seq) cb(e.data);
    });
  }
  lint(files: Record<string, string>, target: Target): Promise<LintResponse> {
    const id = ++this.seq;
    const req: LintRequest = { id, files, target };
    return new Promise((resolve) => {
      this.waiting.set(id, resolve);
      this.worker.postMessage(req);
    });
  }
  dispose() {
    this.worker.terminate();
  }
}
