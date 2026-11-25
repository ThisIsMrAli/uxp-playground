import type { HostApp } from './hosts';
import type { PreviewScenario } from './scenarios';

export type { HostApp } from './hosts';
export type Theme = 'darkest' | 'dark' | 'medium' | 'light' | 'lightest';

export interface Target {
  app: HostApp;
  /** UXP version the user wants to approximate, e.g. "9.2". Drives lint and runtime labels only. */
  uxp: string;
}

export interface Project {
  /** Format version of the saved/shared state. */
  v: 1;
  name: string;
  target: Target;
  theme: Theme;
  /** Preview size in CSS px; null = use the manifest's preferredDockedSize. */
  size: { width: number; height: number } | null;
  /** Optional fixture selection for supported hosts. */
  scenario?: PreviewScenario;
  files: Record<string, string>;
  active: string;
}

export interface LogEntry {
  kind: 'console' | 'error' | 'host-call' | 'file-written' | 'system';
  level?: string;
  text: string;
  detail?: any;
  time: number;
  /** Project file the entry points at (compile and load errors). */
  file?: string;
  line?: number;
  /** Repeated identical consecutive messages are collapsed into one entry. */
  count?: number;
}
