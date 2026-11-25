declare const __UXP_LINT_EXTERNAL__: boolean;
declare module '@pg/uxp-lint-provider' {
  import type { UxpLintProvider } from './lint/adapter';
  export const provider: UxpLintProvider;
}
declare module 'eslint-linter-browserify' {
  export const Linter: any;
}
declare module 'eslint-plugin-uxp-lint/browser' {
  const plugin: any;
  export const buildConfig: (opts: any) => any[];
  export const rules: Record<string, any>;
  export default plugin;
}
declare module '@pg/monaco' {
  export * from 'monaco-editor';
}
declare module 'monaco-editor/language/typescript/ts.worker.js' {
  import type TypeScript from 'typescript';
  export class TypeScriptWorker {
    constructor(context: unknown, options: unknown);
    getLanguageService(): TypeScript.LanguageService;
  }
  export function initialize(create: (context: unknown, options: unknown) => TypeScriptWorker): void;
  export const ts: { typescript: typeof TypeScript };
}
