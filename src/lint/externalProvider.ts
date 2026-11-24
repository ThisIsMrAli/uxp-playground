/**
 * Bridge to eslint-plugin-uxp-lint (sibling repo ../uxp-eslint, browser entry dist/browser.js).
 * Selected at build time by vite.config.ts when that file exists.
 */
import uxpLint, { buildConfig, rules } from 'eslint-plugin-uxp-lint/browser';
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
      // The playground's UXP selector is the version the code must run on.
      settings: ctx.target.uxp ? { uxpVersion: ctx.target.uxp } : undefined,
      css,
      json,
      htmlParser
    } as any),
  docsUrl(ruleId) {
    const name = ruleId.replace(/^uxp-lint\//, '');
    if (name === ruleId) return undefined;
    const rule = ((rules as any) || (uxpLint as any)?.rules || {})[name];
    const url = rule?.meta?.docs?.url;
    return typeof url === 'string' ? url : undefined;
  }
};
