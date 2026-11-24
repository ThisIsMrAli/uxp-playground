import { transform } from 'sucrase';

export interface CompiledModule {
  kind: 'js' | 'json';
  code: string;
  error?: string;
  errorLine?: number;
  errorColumn?: number;
}

export const SCRIPT_RE = /\.(js|jsx|ts|tsx|cjs|mjs)$/i;
const ESM_RE = /(^|\n|;)\s*(import\s+[\w*{"']|import\s*\(|export\s+(default|const|let|var|function|class|async|\{|\*))/;

export function isScript(path: string) {
  return SCRIPT_RE.test(path);
}

/** Does this file need compiling (JSX, TypeScript or ES module syntax) before UXP or the preview can run it? */
export function needsCompile(path: string, code: string): boolean {
  if (/\.(jsx|ts|tsx)$/i.test(path)) return true;
  if (ESM_RE.test(code)) return true;
  return /<\s*[A-Za-z][\w.-]*[\s/>]/.test(code) && /(return|=>|render\()\s*\(?\s*</.test(code);
}

export function compileModule(path: string, code: string): CompiledModule {
  if (/\.json$/i.test(path)) return { kind: 'json', code };
  if (!needsCompile(path, code)) return { kind: 'js', code };
  const transforms: ('jsx' | 'typescript' | 'imports')[] = [];
  if (/\.tsx?$/i.test(path)) transforms.push('typescript');
  if (!/\.ts$/i.test(path)) transforms.push('jsx');
  transforms.push('imports');
  try {
    const out = transform(code, { transforms, jsxRuntime: 'automatic', production: true, filePath: path });
    return { kind: 'js', code: out.code };
  } catch (e: any) {
    const msg = String(e && e.message ? e.message : e);
    const m = /\((\d+):(\d+)\)/.exec(msg);
    return { kind: 'js', code: '', error: msg, errorLine: m ? Number(m[1]) : 1, errorColumn: m ? Number(m[2]) + 1 : 1 };
  }
}

/** Path of the plain-JS file that UXP will load for a source file (index.jsx -> index.js). */
export function outputPath(path: string): string {
  return path.replace(/\.(jsx|ts|tsx|mjs|cjs)$/i, '.js');
}

export const REACT_MODULES: Record<string, string> = {
  react: 'vendor/react.js',
  'react-dom': 'vendor/react-dom.js',
  'react-dom/client': 'vendor/react-dom-client.js',
  'react/jsx-runtime': 'vendor/react-jsx-runtime.js',
  'react/jsx-dev-runtime': 'vendor/react-jsx-runtime.js'
};

export function usesReact(code: string): boolean {
  return /require\(\s*['"](react|react-dom|react-dom\/client|react\/jsx-runtime|react\/jsx-dev-runtime)['"]\s*\)/.test(code);
}

/** Rewrites bare React requires and source extensions so the exported plugin needs no bundler. */
export function rewriteRequires(fromPath: string, code: string): string {
  const depth = fromPath.split('/').length - 1;
  const up = depth ? '../'.repeat(depth) : './';
  return code.replace(/require\(\s*(['"])([^'"]+)\1\s*\)/g, (whole, q: string, spec: string) => {
    if (REACT_MODULES[spec]) return `require(${q}${up}${REACT_MODULES[spec]}${q})`;
    if (spec.startsWith('.') && /\.(jsx|ts|tsx|mjs|cjs)$/i.test(spec)) return `require(${q}${outputPath(spec)}${q})`;
    return whole;
  });
}
