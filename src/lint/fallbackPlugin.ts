/**
 * Built-in fallback rules used until the eslint-plugin-uxp-lint browser build is available.
 * Small and conservative; each rule is a static heuristic.
 */
import { domainAllowed } from './domains';

type Ctx = any;
type Node = any;

function manifestOf(context: Ctx): any {
  const s = (context.settings && context.settings.uxp) || {};
  if (s.manifest) return s.manifest;
  if (typeof s.manifestText === 'string') {
    try {
      return JSON.parse(s.manifestText);
    } catch {
      return {};
    }
  }
  return {};
}

function memberName(callee: Node): string | null {
  if (!callee) return null;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') return callee.property.name;
  if (callee.type === 'Identifier') return callee.name;
  return null;
}

function insideExecuteAsModal(context: Ctx, node: Node): boolean {
  const ancestors: Node[] = context.sourceCode ? context.sourceCode.getAncestors(node) : context.getAncestors();
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if ((a.type === 'FunctionExpression' || a.type === 'ArrowFunctionExpression') && ancestors[i - 1]) {
      const parent = ancestors[i - 1];
      if (parent.type === 'CallExpression' && memberName(parent.callee) === 'executeAsModal' && parent.arguments[0] === a) return true;
    }
  }
  return false;
}

function descriptorsAreReadOnly(arg: Node): boolean {
  if (!arg || arg.type !== 'ArrayExpression' || !arg.elements.length) return false;
  return arg.elements.every((el: Node) => {
    if (!el || el.type !== 'ObjectExpression') return false;
    const obj = el.properties.find((p: Node) => p.type === 'Property' && ((p.key.type === 'Identifier' && p.key.name === '_obj') || (p.key.type === 'Literal' && p.key.value === '_obj')));
    return obj && obj.value.type === 'Literal' && obj.value.value === 'get';
  });
}

const modalScope = {
  meta: {
    type: 'problem',
    docs: { description: 'Photoshop: state-changing batchPlay must run inside core.executeAsModal' },
    schema: []
  },
  create(context: Ctx) {
    return {
      CallExpression(node: Node) {
        if (memberName(node.callee) !== 'batchPlay') return;
        if (descriptorsAreReadOnly(node.arguments[0])) return;
        if (insideExecuteAsModal(context, node)) return;
        context.report({
          node,
          message:
            'batchPlay is not lexically inside core.executeAsModal(). Photoshop rejects state-changing events outside a modal scope ("Such events are only allowed from inside a modal scope"). Ignore this if the caller is already modal.'
        });
      }
    };
  }
};

const FS_PICKERS = new Set(['getFileForOpening', 'getFileForSaving', 'getFolder']);

const manifestPermissions = {
  meta: {
    type: 'problem',
    docs: { description: 'Code uses an API whose manifest v5 permission is missing' },
    schema: []
  },
  create(context: Ctx) {
    const m = manifestOf(context);
    const perms = (m && m.requiredPermissions) || {};
    const v5 = m && m.manifestVersion === 5;
    const report = (node: Node, message: string) => v5 && context.report({ node, message });
    const checkUrl = (node: Node, arg: Node, api: string) => {
      if (!arg) return;
      let url: string | null = null;
      if (arg.type === 'Literal' && typeof arg.value === 'string') url = arg.value;
      if (arg.type === 'TemplateLiteral' && arg.quasis.length) url = arg.quasis[0].value.cooked;
      if (!url || !/^(https?|wss?):\/\//i.test(url)) return;
      if (!domainAllowed(url.replace(/\$\{.*$/, ''), perms.network && perms.network.domains)) {
        let origin = url;
        try {
          origin = new URL(url).origin;
        } catch {
          /* keep raw */
        }
        report(node, `${api} to ${origin} needs that origin in requiredPermissions.network.domains.`);
      }
    };
    return {
      CallExpression(node: Node) {
        const name = memberName(node.callee);
        if (!name) return;
        if (FS_PICKERS.has(name) && node.callee.type === 'MemberExpression' && !['request', 'fullAccess'].includes(perms.localFileSystem)) {
          report(node, `${name}() needs requiredPermissions.localFileSystem set to "request" (or "fullAccess").`);
        }
        if ((name === 'openExternal' || name === 'openPath') && node.callee.type === 'MemberExpression' && !perms.launchProcess) {
          report(node, `${name}() needs requiredPermissions.launchProcess (schemes/extensions).`);
        }
        if (name === 'openExternal' && perms.launchProcess && node.arguments[0] && node.arguments[0].type === 'Literal' && typeof node.arguments[0].value === 'string') {
          const scheme = node.arguments[0].value.split(':')[0];
          const schemes = perms.launchProcess.schemes;
          if (Array.isArray(schemes) && !schemes.includes(scheme)) report(node, `openExternal("${scheme}:…") needs "${scheme}" in requiredPermissions.launchProcess.schemes.`);
        }
        if (name === 'userId' && node.callee.type === 'MemberExpression' && memberName(node.callee.object) === 'userInfo' && perms.enableUserInfo !== true) {
          report(node, 'userInfo.userId() needs "enableUserInfo": true in requiredPermissions (UXP 7.3+).');
        }
        if (name === 'fetch' && node.callee.type === 'Identifier') checkUrl(node, node.arguments[0], 'fetch()');
      },
      NewExpression(node: Node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'WebSocket') checkUrl(node, node.arguments[0], 'WebSocket');
      },
      MemberExpression(node: Node) {
        if (!node.computed && node.property.name === 'clipboard' && node.object.type === 'Identifier' && node.object.name === 'navigator' && !perms.clipboard) {
          report(node, 'navigator.clipboard needs requiredPermissions.clipboard ("read" or "readAndWrite").');
        }
      }
    };
  }
};

export const fallbackPlugin = {
  meta: { name: 'uxp-playground-fallback', version: '0.1.0' },
  rules: { 'modal-scope': modalScope, 'manifest-permissions': manifestPermissions }
};

export const fallbackRules: Record<string, 'warn' | 'error'> = {
  'uxp/modal-scope': 'warn',
  'uxp/manifest-permissions': 'error'
};
