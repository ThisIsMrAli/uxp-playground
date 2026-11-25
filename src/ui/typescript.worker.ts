import { initialize, TypeScriptWorker, ts } from 'monaco-editor/language/typescript/ts.worker.js';
import type { LanguageService } from 'typescript';
import { premiereDiagnostics } from '../core/premiereCompatibility';
import type { PremiereCompatibilityWorker } from './premiereEditor';

class PlaygroundTypeScriptWorker extends TypeScriptWorker implements PremiereCompatibilityWorker {
  async getPremiereCompatibility(files: string[], minVersion: string) {
    const service: LanguageService = this.getLanguageService();
    const program = service.getProgram();
    return program ? premiereDiagnostics(ts.typescript, program, files, minVersion) : [];
  }
}

// Match Monaco's module worker handshake and reuse its TypeScript program for compatibility checks.
self.onmessage = () => {
  initialize((context, options) => new PlaygroundTypeScriptWorker(context, options));
};
