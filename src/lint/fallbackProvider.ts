import { fallbackPlugin, fallbackRules } from './fallbackPlugin';
import type { UxpLintProvider } from './adapter';

export const provider: UxpLintProvider = {
  name: 'built-in fallback rules',
  version: '0.1.0',
  fallback: true,
  covers: ['js'],
  buildConfig: (ctx) => [
    {
      files: ['**/*.{js,jsx,mjs,cjs}'],
      plugins: { uxp: fallbackPlugin },
      settings: { uxp: { manifest: ctx.manifest, manifestText: ctx.manifestText } },
      rules: fallbackRules
    }
  ]
};
