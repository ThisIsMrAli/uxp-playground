import type TS from 'typescript';
import type { Diagnostic } from './manifest';
import { PREMIERE_API_VERSIONS } from './premiereVersions';
import { cmpVersion } from './versions';

const API_BASE = 'https://developer.adobe.com/premiere-pro/uxp/ppro-reference/';
const ASYNC_CALLBACK_APIS = {
  'Project.lockedAccess': 'classes/project#lockedaccess',
  'Project.executeTransaction': 'classes/project#executetransaction',
  'TrackItemSelection.createEmptySelection': 'classes/trackitemselection#createemptyselection'
};
const apiNames = new Set([...Object.keys(PREMIERE_API_VERSIONS), ...Object.keys(ASYNC_CALLBACK_APIS)].map((key) => key.split('.').at(-1)));

function apiKey(ts: typeof TS, checker: TS.TypeChecker, symbol: TS.Symbol | undefined) {
  if (!symbol) return;
  if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
  const declaration = symbol.declarations?.find((d) => /\/node_modules\/@adobe\/premierepro\//.test(d.getSourceFile().fileName));
  if (!declaration) return;
  const owner = declaration.parent;
  if (ts.isTypeLiteralNode(owner) && ts.isTypeAliasDeclaration(owner.parent)) {
    const type = owner.parent.name.text.replace(/Static$/, '');
    return type === 'premierepro' ? symbol.name : `${type}.${symbol.name}`;
  }
  if (ts.isEnumDeclaration(owner)) return `${owner.name.text}.${symbol.name}`;
  if (ts.isModuleBlock(owner) && ts.isModuleDeclaration(owner.parent)) return `${owner.parent.name.text}.${symbol.name}`;
  return ts.isTypeAliasDeclaration(declaration) ? symbol.name.replace(/Static$/, '') : symbol.name;
}

function resolveAccess(ts: typeof TS, checker: TS.TypeChecker, node: TS.Node) {
  if (ts.isPropertyAccessExpression(node)) {
    return { name: node.name, symbol: apiNames.has(node.name.text) ? checker.getSymbolAtLocation(node.name) : undefined };
  }
  if (ts.isElementAccessExpression(node) && ts.isStringLiteralLike(node.argumentExpression)) {
    const name = node.argumentExpression;
    return { name, symbol: apiNames.has(name.text) ? checker.getTypeAtLocation(node.expression).getProperty(name.text) : undefined };
  }
  if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent) && !node.dotDotDotToken) {
    const name = node.propertyName || node.name;
    if ((ts.isIdentifier(name) || ts.isStringLiteralLike(name)) && apiNames.has(name.text)) {
      return { name, symbol: checker.getTypeAtLocation(node.parent).getProperty(name.text) };
    }
  }
}

export function premiereDiagnostics(ts: typeof TS, program: TS.Program, files: string[], minVersion: string): Diagnostic[] {
  const checker = program.getTypeChecker();
  const diagnostics: Diagnostic[] = [];
  for (const file of files) {
    const source = program.getSourceFile(file);
    if (!source) continue;
    const path = decodeURIComponent(file.replace(/^file:\/\/\//, ''));
    const versionWarnings = new Map<TS.Node, { name: TS.Node; key: string; version: string; doc: string }>();
    const report = (node: TS.Node, ruleId: string, severity: Diagnostic['severity'], message: string, doc: string) => {
      const start = source.getLineAndCharacterOfPosition(node.getStart(source));
      const end = source.getLineAndCharacterOfPosition(node.getEnd());
      diagnostics.push({ file: path, line: start.line + 1, column: start.character + 1, endLine: end.line + 1, endColumn: end.character + 1, severity, ruleId, message, source: 'compatibility', docsUrl: API_BASE + doc });
    };
    const minimum = (node: TS.Node, name: TS.Node, key: string) => {
      const requirement = PREMIERE_API_VERSIONS[key];
      if (!requirement || cmpVersion(minVersion, requirement[0]) >= 0) return;
      while ((ts.isPropertyAccessExpression(node.parent) || ts.isElementAccessExpression(node.parent) || ts.isNewExpression(node.parent)) && node.parent.expression === node) node = node.parent;
      const previous = versionWarnings.get(node);
      if (!previous || cmpVersion(requirement[0], previous.version) > 0) {
        versionWarnings.set(node, { name, key, version: requirement[0], doc: requirement[1] });
      }
    };
    const visit = (node: TS.Node) => {
      const access = resolveAccess(ts, checker, node);
      if (access) {
        const key = apiKey(ts, checker, access.symbol);
        if (key) {
          minimum(node, access.name, key);
          const parent = node.parent;
          if (Object.hasOwn(ASYNC_CALLBACK_APIS, key) && ts.isCallExpression(parent) && parent.expression === node && parent.arguments.length) {
            const callback = parent.arguments[0];
            if (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) {
              const async = callback.modifiers?.find((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
              if (async) report(async, 'premiere/synchronous-callback', 'error', `${key} requires a synchronous callback. Await work before calling it.`, ASYNC_CALLBACK_APIS[key]);
            }
          }
        }
      }
      if (ts.isNewExpression(node)) {
        const type = checker.getTypeAtLocation(node.expression);
        const key = apiKey(ts, checker, type.aliasSymbol ?? type.getSymbol());
        if (key) minimum(node, node.expression, `${key}.constructor`);
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(source, visit);
    for (const { name, key, version, doc } of versionWarnings.values()) {
      const api = key.endsWith('.constructor') ? `Constructing ${key.split('.')[0]}` : key;
      report(name, 'premiere/api-min-version', 'warning', `${api} requires Premiere Pro ${version} or later. The manifest declares ${minVersion}.`, doc);
    }
  }
  return diagnostics;
}
