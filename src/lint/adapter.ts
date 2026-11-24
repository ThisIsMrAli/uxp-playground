/**
 * Lint adapter. The playground talks to linting only through this interface, so the eslint-plugin-uxp-lint
 * browser build and the built-in fallback rules are interchangeable.
 */
import type { Diagnostic } from '../core/manifest';
import type { Target } from '../core/types';

export interface LintRequest {
  id: number;
  files: Record<string, string>;
  target: Target;
}

export interface LintEngineInfo {
  name: string;
  version: string;
  plugin: string;
  pluginVersion: string;
  fallback: boolean;
  /** File kinds the provider lints itself with ESLint (others use the playground's own checks). */
  covers: ('js' | 'css' | 'html' | 'manifest')[];
}

export interface LintResponse {
  id: number;
  diagnostics: Diagnostic[];
  engine: LintEngineInfo;
  ms: number;
}

export interface ProviderContext {
  files: Record<string, string>;
  target: Target;
  manifest: any;
  manifestText: string | undefined;
}

/** What a UXP lint provider must supply: ESLint flat-config objects for a project. */
export interface UxpLintProvider {
  name: string;
  version: string;
  fallback: boolean;
  covers: LintEngineInfo['covers'];
  buildConfig(ctx: ProviderContext): any[];
  /** Documentation URL for a rule id the provider reports (from the rule's meta.docs.url). */
  docsUrl?(ruleId: string): string | undefined;
}

export function severityFromEslint(sev: number): Diagnostic['severity'] {
  return sev === 2 ? 'error' : sev === 1 ? 'warning' : 'info';
}
