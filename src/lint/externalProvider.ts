/**
 * Bridge to eslint-plugin-uxp-lint (sibling repo ../uxp-eslint, browser entry dist/browser.js).
 * Selected at build time by vite.config.ts when that file exists.
 */
import uxpLint, { buildConfig } from 'eslint-plugin-uxp-lint/browser';
import css from '@eslint/css';
import json from '@eslint/json';
import * as htmlParser from '@html-eslint/parser';
import type { UxpLintProvider } from './adapter';

const HOSTS = new Set(['PS', 'ID', 'premierepro']);

export const provider: UxpLintProvider = {
  name: (uxpLint as any)?.meta?.name || 'eslint-plugin-uxp-lint',
  version: (uxpLint as any)?.meta?.version || 'unknown',
  fallback: false,
  covers: ['js', 'css', 'html', 'manifest'],
  buildConfig: (ctx) =>
    buildConfig({
      manifest: ctx.manifest && typeof ctx.manifest === 'object' ? ctx.manifest : undefined,
      manifestText: ctx.manifestText,
      host: HOSTS.has(ctx.target.app) ? (ctx.target.app as any) : undefined,
      css,
      json,
      htmlParser
    } as any)
};
