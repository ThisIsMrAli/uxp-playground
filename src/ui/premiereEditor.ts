import type { Diagnostic } from '../core/manifest';

export const PREMIERE_TYPES_URI = 'file:///node_modules/@adobe/premierepro/index.d.ts';

// Adobe exposes the typings and the host API under different module names.
export const HOST_MODULE_DECLARATIONS = `
declare function require(moduleName: 'premierepro'): import('@adobe/premierepro').premierepro;
declare function require(moduleName: string): any;
declare module 'premierepro' {
  import type { premierepro } from '@adobe/premierepro';
  const host: premierepro;
  export = host;
}
declare module 'indesign' { const anyModule: any; export = anyModule; }
`;

export interface PremiereCompatibilityWorker {
  getPremiereCompatibility(files: string[], minVersion: string): Promise<Diagnostic[]>;
}
