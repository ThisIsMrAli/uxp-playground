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
