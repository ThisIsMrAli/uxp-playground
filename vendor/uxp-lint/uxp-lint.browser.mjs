var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@typescript-eslint/utils/dist/eslint-utils/deepMerge.js
var require_deepMerge = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/deepMerge.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isObjectNotArray = isObjectNotArray;
    exports.deepMerge = deepMerge;
    function isObjectNotArray(obj) {
      return typeof obj === "object" && obj != null && !Array.isArray(obj);
    }
    function deepMerge(first = {}, second = {}) {
      const keys = /* @__PURE__ */ new Set([...Object.keys(first), ...Object.keys(second)]);
      return Object.fromEntries([...keys].map((key) => {
        const firstHasKey = key in first;
        const secondHasKey = key in second;
        const firstValue = first[key];
        const secondValue = second[key];
        let value;
        if (firstHasKey && secondHasKey) {
          if (isObjectNotArray(firstValue) && isObjectNotArray(secondValue)) {
            value = deepMerge(firstValue, secondValue);
          } else {
            value = secondValue;
          }
        } else if (firstHasKey) {
          value = firstValue;
        } else {
          value = secondValue;
        }
        return [key, value];
      }));
    }
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/applyDefault.js
var require_applyDefault = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/applyDefault.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyDefault = applyDefault;
    var deepMerge_1 = require_deepMerge();
    function applyDefault(defaultOptions, userOptions) {
      const options = structuredClone(defaultOptions);
      if (userOptions == null) {
        return options;
      }
      options.forEach((opt, i) => {
        if (userOptions[i] !== void 0) {
          const userOpt = userOptions[i];
          if ((0, deepMerge_1.isObjectNotArray)(userOpt) && (0, deepMerge_1.isObjectNotArray)(opt)) {
            options[i] = (0, deepMerge_1.deepMerge)(opt, userOpt);
          } else {
            options[i] = userOpt;
          }
        }
      });
      return options;
    }
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/parserSeemsToBeTSESLint.js
var require_parserSeemsToBeTSESLint = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/parserSeemsToBeTSESLint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parserSeemsToBeTSESLint = parserSeemsToBeTSESLint;
    function parserSeemsToBeTSESLint(parser) {
      return !!parser && /(?:typescript-eslint|\.\.)[\w/\\]*parser/.test(parser);
    }
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/getParserServices.js
var require_getParserServices = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/getParserServices.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParserServices = getParserServices;
    var parserSeemsToBeTSESLint_1 = require_parserSeemsToBeTSESLint();
    var ERROR_MESSAGE_REQUIRES_PARSER_SERVICES = "You have used a rule which requires type information, but don't have parserOptions set to generate type information for this file. See https://tseslint.com/typed-linting for enabling linting with type information.";
    var ERROR_MESSAGE_UNKNOWN_PARSER = 'Note: detected a parser other than @typescript-eslint/parser. Make sure the parser is configured to forward "parserOptions.project" to @typescript-eslint/parser.';
    function getParserServices(context, allowWithoutFullTypeInformation = false) {
      const parser = (
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- For compatibility with ESLint 8
        context.parserPath || context.languageOptions.parser?.meta?.name
      );
      if (context.sourceCode.parserServices?.esTreeNodeToTSNodeMap == null || context.sourceCode.parserServices.tsNodeToESTreeNodeMap == null) {
        throwError(parser);
      }
      if (context.sourceCode.parserServices.program == null && !allowWithoutFullTypeInformation) {
        throwError(parser);
      }
      return context.sourceCode.parserServices;
    }
    function throwError(parser) {
      const messages = [
        ERROR_MESSAGE_REQUIRES_PARSER_SERVICES,
        `Parser: ${parser || "(unknown)"}`,
        !(0, parserSeemsToBeTSESLint_1.parserSeemsToBeTSESLint)(parser) && ERROR_MESSAGE_UNKNOWN_PARSER
      ].filter(Boolean);
      throw new Error(messages.join("\n"));
    }
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/InferTypesFromRule.js
var require_InferTypesFromRule = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/InferTypesFromRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/nullThrows.js
var require_nullThrows = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/nullThrows.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullThrowsReasons = void 0;
    exports.nullThrows = nullThrows;
    exports.NullThrowsReasons = {
      MissingParent: "Expected node to have a parent.",
      MissingToken: (token, thing) => `Expected to find a ${token} for the ${thing}.`
    };
    function nullThrows(value, message) {
      if (value == null) {
        throw new Error(`Non-null Assertion Failed: ${message}`);
      }
      return value;
    }
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/RuleCreator.js
var require_RuleCreator = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/RuleCreator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RuleCreator = RuleCreator2;
    var applyDefault_1 = require_applyDefault();
    function RuleCreator2(urlCreator) {
      return function createNamedRule({ meta, name, ...rule }) {
        const ruleWithDocs = createRule2({
          meta: {
            ...meta,
            docs: {
              ...meta.docs,
              url: urlCreator(name)
            }
          },
          name,
          ...rule
        });
        return ruleWithDocs;
      };
    }
    function createRule2({
      create,
      // Keep accepting deprecated defaultOptions for backward compatibility.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      defaultOptions,
      meta,
      name
    }) {
      const resolvedDefaultOptions = meta.defaultOptions ?? defaultOptions ?? [];
      return {
        create(context) {
          const optionsWithDefault = (0, applyDefault_1.applyDefault)(resolvedDefaultOptions, context.options);
          return create(context, optionsWithDefault);
        },
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- For compatibility with ESLint 8, see #12842
        defaultOptions,
        meta,
        name
      };
    }
    RuleCreator2.withoutDocs = function withoutDocs(args) {
      return createRule2(args);
    };
  }
});

// node_modules/@typescript-eslint/utils/dist/eslint-utils/index.js
var require_eslint_utils = __commonJS({
  "node_modules/@typescript-eslint/utils/dist/eslint-utils/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_applyDefault(), exports);
    __exportStar(require_deepMerge(), exports);
    __exportStar(require_getParserServices(), exports);
    __exportStar(require_InferTypesFromRule(), exports);
    __exportStar(require_nullThrows(), exports);
    __exportStar(require_RuleCreator(), exports);
  }
});

// src/util/create-rule.ts
var import_eslint_utils = __toESM(require_eslint_utils(), 1);

// src/util/file-kind.ts
var cache = /* @__PURE__ */ new WeakMap();
var GENERATED_BANNER = /^\s*(\/\*[!*]?\s*|\/\/\s*)?(@generated|generated by|auto-?generated|this file (is|was) (auto-?)?generated|do not edit)/i;
function classifySource(text, filename) {
  if (/(^|\/)manifest\.json$/.test(filename)) return "source";
  const head = text.slice(0, 600);
  if (GENERATED_BANNER.test(head) || /\.min\.(js|css|mjs)$/.test(filename) || /(^|\/)(sourcemap|.*\.map)$/.test(filename)) return "generated";
  let longest = 0;
  let lines = 1;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      longest = Math.max(longest, i - start);
      start = i + 1;
      lines++;
    }
  }
  longest = Math.max(longest, text.length - start);
  if (longest > 3e3 || text.length > 2e3 && text.length / lines > 300) return "generated";
  if (/\.(c|m)?(j|t)sx?$|\.(ps|id)js$/.test(filename)) {
    if (text.startsWith("#!")) return "node";
    if (/(?:^|[\s;(=])(?:import\s[^;]*?from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)["']node:[a-z_/]+["']/m.test(text)) return "node";
    if (/\bprocess\.(argv|exit|stdout|stderr|stdin)\b|\brequire\.main\s*===\s*module\b|\bimport\.meta\.(dirname|filename|main)\b/.test(text)) return "node";
  }
  return "source";
}
function fileKind(context) {
  const sc = context.sourceCode ?? context.getSourceCode?.();
  if (!sc) return "source";
  const hit = cache.get(sc);
  if (hit) return hit;
  const filename = (context.filename ?? context.getFilename?.() ?? "").split("\\").join("/");
  const kind = classifySource(sc.text, filename);
  cache.set(sc, kind);
  return kind;
}

// src/util/create-rule.ts
var DOCS_BASE = "https://github.com/ThisIsMrAli/uxp-eslint/blob/main/docs/rules/";
var base = (0, import_eslint_utils.RuleCreator)((name) => `${DOCS_BASE}${name}.md`);
var createRule = (spec) => {
  const rule = base(spec);
  const create = rule.create;
  return {
    ...rule,
    create(context) {
      const kind = fileKind(context);
      if (kind !== "source") {
        const s = context.settings?.uxp ?? {};
        if (kind === "generated" && !s.lintGenerated) return {};
        if (kind === "node" && !s.lintNodeScripts) return {};
      }
      return create(context);
    }
  };
};

// src/data/generated/host-uxp-versions.ts
var hostUxpVersions = {
  "$source": {
    "repo": "https://github.com/jardicc/vscode-uxp-validator",
    "file": "common/versionTable.ts",
    "commit": "2711fb98fbb11a2c12792b9435284591bddbc7ff",
    "license": "MIT (c) Jaroslav Bereza"
  },
  "hosts": {
    "PS": [
      {
        "host": "21.1.0",
        "uxp": "3.4.2"
      },
      {
        "host": "22.2.0",
        "uxp": "4.3.2"
      },
      {
        "host": "22.4.0",
        "uxp": "5.0.1"
      },
      {
        "host": "22.5.0",
        "uxp": "5.4.1"
      },
      {
        "host": "23.0.0",
        "uxp": "5.5.1"
      },
      {
        "host": "23.2.0",
        "uxp": "5.6.0"
      },
      {
        "host": "23.3.0",
        "uxp": "6.0.1"
      },
      {
        "host": "23.4.0",
        "uxp": "6.1.1"
      },
      {
        "host": "23.5.0",
        "uxp": "6.2.0"
      },
      {
        "host": "24.0.0",
        "uxp": "6.3.3"
      },
      {
        "host": "24.1.0",
        "uxp": "6.4.0"
      },
      {
        "host": "24.2.0",
        "uxp": "6.5.1"
      },
      {
        "host": "24.3.0",
        "uxp": "6.5.2"
      },
      {
        "host": "24.4.0",
        "uxp": "7.0.0"
      },
      {
        "host": "24.6.0",
        "uxp": "7.1.0"
      },
      {
        "host": "25.0.0",
        "uxp": "7.2.0"
      },
      {
        "host": "25.2.0",
        "uxp": "7.3.0"
      },
      {
        "host": "25.5.0",
        "uxp": "7.4.0"
      },
      {
        "host": "26.0.0",
        "uxp": "8.1.0"
      },
      {
        "host": "26.1.0",
        "uxp": "8.1.0"
      },
      {
        "host": "26.3.0",
        "uxp": "8.1.1"
      },
      {
        "host": "26.6.0",
        "uxp": "8.1.2"
      },
      {
        "host": "26.6.1",
        "uxp": "8.1.4"
      },
      {
        "host": "26.8.0",
        "uxp": "8.3.0"
      },
      {
        "host": "26.9.0",
        "uxp": "8.4.0"
      },
      {
        "host": "26.10.0",
        "uxp": "9.0.1"
      },
      {
        "host": "26.11.0",
        "uxp": "9.0.2"
      },
      {
        "host": "27.4.0",
        "uxp": "9.2.0"
      },
      {
        "host": "27.7.0",
        "uxp": "9.3.0"
      }
    ],
    "premierepro": [
      {
        "host": "25.2.0",
        "uxp": "8.1.0"
      },
      {
        "host": "26.0.2",
        "uxp": "8.1.0"
      },
      {
        "host": "26.2.0",
        "uxp": "9.2.1"
      },
      {
        "host": "26.3.0",
        "uxp": "9.3.0"
      }
    ],
    "ID": [
      {
        "host": "18.5.0",
        "uxp": "7.1.0"
      },
      {
        "host": "19.0.0",
        "uxp": "7.3.1"
      },
      {
        "host": "20.0.0",
        "uxp": "8.0.1"
      },
      {
        "host": "20.2.1",
        "uxp": "8.0.1"
      },
      {
        "host": "20.4.0",
        "uxp": "8.1.6"
      },
      {
        "host": "21.0.0",
        "uxp": "9.0.3"
      },
      {
        "host": "21.3.0",
        "uxp": "9.2.1"
      },
      {
        "host": "21.4.0",
        "uxp": "9.3.0"
      }
    ]
  }
};
var host_uxp_versions_default = hostUxpVersions;

// src/util/version.ts
function parseVersion(v) {
  if (!v || typeof v !== "string") return null;
  const m = v.trim().replace(/^v|^UXP\s*/i, "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] ?? 0), Number(m[3] ?? 0)];
}
function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    const d = pa[i] - pb[i];
    if (d) return d;
  }
  return 0;
}
function isOlder(target, required) {
  return compareVersions(target, required) < 0;
}
function uxpForHost(app, hostVersion) {
  const rows = host_uxp_versions_default.hosts[app];
  if (!rows || !parseVersion(hostVersion)) return null;
  let best = null;
  for (const r2 of rows) {
    if (compareVersions(r2.host, hostVersion) <= 0 && (!best || compareVersions(r2.host, best.host) > 0)) best = r2;
  }
  return best ? best.uxp : null;
}

// src/util/settings.ts
function photoshopApiVersion(r2) {
  if (!r2.manifest) return null;
  const hosts = r2.manifest.host ? Array.isArray(r2.manifest.host) ? r2.manifest.host : [r2.manifest.host] : [];
  const ps = hosts.find((h) => h.app === "PS");
  if (!ps) return null;
  if (typeof ps.data?.apiVersion === "number") return ps.data.apiVersion;
  if (!ps.minVersion) return null;
  return compareVersions(ps.minVersion, "23.0.0") < 0 ? 1 : 2;
}
var cache2 = /* @__PURE__ */ new WeakMap();
var HOST_HINTS = [
  [/(^|[\/._-])(ppro|premiere|premierepro)([\/._-]|$)/i, "premierepro"],
  [/(^|[\/._-])(ps|photoshop)([\/._-]|$)/i, "PS"],
  [/(^|[\/._-])(indesign|idsn)([\/._-]|$)/i, "ID"]
];
function getUxp(context) {
  const s = context.settings?.uxp ?? {};
  let byHint = cache2.get(s);
  if (!byHint) {
    byHint = /* @__PURE__ */ new Map();
    cache2.set(s, byHint);
  }
  let manifest = s.manifest ?? null;
  if (!manifest && typeof s.manifestText === "string") {
    try {
      manifest = JSON.parse(s.manifestText);
    } catch {
      manifest = null;
    }
  }
  const hostEntries = manifest?.host ? Array.isArray(manifest.host) ? manifest.host : [manifest.host] : [];
  const hosts = hostEntries.map((h) => h.app).filter((x) => typeof x === "string");
  const filename = (context.filename ?? "").split("\\").join("/");
  const hint = !s.host && hosts.length > 1 ? HOST_HINTS.find(([re, h]) => hosts.includes(h) && re.test(filename))?.[1] ?? "" : "";
  const cached = byHint.get(hint);
  if (cached) return cached;
  const host = s.host ?? (hint || hosts[0]) ?? null;
  const entry = hostEntries.find((h) => h.app === host) ?? hostEntries[0];
  const hostMinVersion = s.hostMinVersion ?? (typeof entry?.minVersion === "string" ? entry.minVersion : null);
  let uxpVersion = s.uxpVersion ?? (host && hostMinVersion ? uxpForHost(host, hostMinVersion) : null);
  if (!s.uxpVersion && !s.host && !hint && hostEntries.length > 1) {
    for (const h of hostEntries) {
      const v = typeof h.app === "string" && typeof h.minVersion === "string" ? uxpForHost(h.app, h.minVersion) : null;
      if (v && (!uxpVersion || compareVersions(v, uxpVersion) > 0)) uxpVersion = v;
    }
  }
  const r2 = {
    manifest,
    manifestVersion: typeof manifest?.manifestVersion === "number" ? manifest.manifestVersion : null,
    host,
    hosts: s.host ? [s.host] : hosts,
    hostMinVersion,
    uxpVersion
  };
  byHint.set(hint, r2);
  return r2;
}

// src/util/ast.ts
function staticString(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0]?.value.cooked ?? null;
  return null;
}
function staticPrefix(node) {
  if (!node) return null;
  const s = staticString(node);
  if (s !== null) return { text: s, complete: true };
  if (node.type === "TemplateLiteral") return { text: node.quasis[0]?.value.cooked ?? "", complete: false };
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = staticPrefix(node.left);
    if (left) return { text: left.text, complete: false };
  }
  return null;
}
function propertyName(node) {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  if (node.computed) return staticString(node.property);
  if (node.property.type === "PrivateIdentifier") return null;
  return null;
}
function keyName(node) {
  if (node.key.type === "Identifier" && !node.computed) return node.key.name;
  return staticString(node.key);
}
function requireSource(node) {
  if (!node || node.type !== "CallExpression") return null;
  if (node.callee.type !== "Identifier" || node.callee.name !== "require" || node.arguments.length !== 1) return null;
  return staticString(node.arguments[0]);
}
function unwrap(node) {
  let n = node;
  while (n.type === "AwaitExpression" || n.type === "TSAsExpression" || n.type === "TSNonNullExpression" || n.type === "TSSatisfiesExpression" || n.type === "ChainExpression" || n.type === "TSTypeAssertion") {
    n = n.expression ?? n.argument;
  }
  return n;
}
var BROWSER_GLOBAL_OBJECTS = /* @__PURE__ */ new Set(["window", "globalThis", "self"]);
var ModuleTracker = class {
  constructor(modules) {
    this.modules = modules;
  }
  modules;
  bindings = /* @__PURE__ */ new Map();
  pending = [];
  visitors() {
    return {
      ImportDeclaration: (node) => {
        const src = node.source.value;
        if (typeof src !== "string" || !this.modules.has(src)) return;
        for (const s of node.specifiers) {
          if (s.type === "ImportDefaultSpecifier" || s.type === "ImportNamespaceSpecifier") this.bindings.set(s.local.name, src);
          else {
            const imported = s.imported.type === "Identifier" ? s.imported.name : String(s.imported.value);
            this.bindings.set(s.local.name, `${src}.${imported}`);
          }
        }
      },
      VariableDeclarator: (node) => {
        if (node.init) this.pending.push({ pattern: node.id, init: node.init });
      },
      AssignmentExpression: (node) => {
        if (node.left.type === "Identifier" || node.left.type === "ObjectPattern") this.pending.push({ pattern: node.left, init: node.right });
      }
    };
  }
  /** Call once in Program:exit (or lazily) to resolve declarators in dependency order. */
  finalize() {
    for (let pass = 0; pass < 4 && this.pending.length; pass++) {
      const rest = [];
      for (const p of this.pending) {
        const base2 = this.resolve(p.init);
        if (base2) this.bind(p.pattern, base2);
        else rest.push(p);
      }
      if (rest.length === this.pending.length) break;
      this.pending = rest;
    }
  }
  bind(pattern, base2) {
    if (pattern.type === "Identifier") {
      if (!this.bindings.has(pattern.name)) this.bindings.set(pattern.name, base2);
      return;
    }
    if (pattern.type === "ObjectPattern") {
      for (const prop of pattern.properties) {
        if (prop.type !== "Property") continue;
        const k = keyName(prop);
        if (!k) continue;
        const value = prop.value.type === "AssignmentPattern" ? prop.value.left : prop.value;
        this.bind(value, `${base2}.${k}`);
      }
    }
  }
  /** Canonical dotted path for an expression, e.g. "photoshop.action.batchPlay"; null when not module-derived. */
  resolve(node) {
    if (!node) return null;
    const n = unwrap(node);
    if (n.type === "Identifier") return this.bindings.get(n.name) ?? null;
    const req = requireSource(n);
    if (req !== null) return this.modules.has(req) ? req : null;
    if (n.type === "MemberExpression") {
      const name = propertyName(n);
      if (!name) return null;
      const obj = unwrap(n.object);
      if (obj.type === "Identifier" && BROWSER_GLOBAL_OBJECTS.has(obj.name) && name === "require") return null;
      const base2 = this.resolve(n.object);
      return base2 ? `${base2}.${name}` : null;
    }
    return null;
  }
  has(name) {
    return this.bindings.has(name);
  }
};
function memberPath(node) {
  const n = unwrap(node);
  if (n.type === "Identifier") return n.name;
  if (n.type === "ThisExpression") return "this";
  if (n.type === "MemberExpression") {
    const name = propertyName(n);
    if (!name) return null;
    const base2 = memberPath(n.object);
    return base2 ? `${base2}.${name}` : null;
  }
  return null;
}
function stripGlobal(path) {
  return path.replace(/^(?:window|globalThis|self)\./, "");
}
function isGlobalReference(sourceCode, node) {
  let scope = sourceCode.getScope(node);
  while (scope) {
    const v = scope.set.get(node.name);
    if (v && v.defs.length > 0) return false;
    scope = scope.upper;
  }
  return true;
}
function getHtmlAttr(node, name) {
  return node.attributes?.find((a) => a.key?.value?.toLowerCase() === name);
}
function viewFromHtml(tag) {
  return {
    name: tag.name.toLowerCase(),
    attrs: (tag.attributes ?? []).map((a) => ({ name: a.key.value.toLowerCase(), value: a.value ? a.value.value : null, node: a, loc: a.loc })),
    node: tag,
    loc: tag.openStart?.loc ?? tag.loc,
    jsx: false
  };
}
function viewFromJsx(el) {
  let name = null;
  if (el.name.type === "JSXIdentifier") name = el.name.name;
  if (!name || /^[A-Z]/.test(name)) return null;
  const attrs = [];
  for (const a of el.attributes) {
    if (a.type !== "JSXAttribute") continue;
    const an = a.name.type === "JSXIdentifier" ? a.name.name : `${a.name.namespace.name}:${a.name.name.name}`;
    let value = null;
    if (a.value?.type === "Literal" && typeof a.value.value === "string") value = a.value.value;
    else if (a.value?.type === "JSXExpressionContainer") value = staticString(a.value.expression) ?? (a.value.expression.type === "Literal" ? String(a.value.expression.value) : "\0dynamic");
    else if (!a.value) value = "";
    attrs.push({ name: an, value, node: a, loc: a.loc });
  }
  return { name, attrs, node: el, loc: el.loc, jsx: true };
}
function mergeVisitors(...listeners) {
  const out = {};
  for (const l of listeners) {
    for (const [k, fn] of Object.entries(l)) {
      if (typeof fn !== "function") continue;
      const prev = out[k];
      out[k] = prev ? (...a) => {
        prev(...a);
        fn(...a);
      } : fn;
    }
  }
  return out;
}
function isOptionalUse(node) {
  let n = node;
  for (let i = 0; i < 3 && n.parent; i++) {
    const p = n.parent;
    if (p.type === "MemberExpression" && p.object === n && p.optional || p.type === "CallExpression" && p.callee === n && p.optional) return true;
    if (p.type === "MemberExpression" && p.property === n) {
      n = p;
      continue;
    }
    break;
  }
  return false;
}
function isFeatureDetected(sourceCode, node, name) {
  if (isOptionalUse(node)) return true;
  if (node.parent?.type === "UnaryExpression" && node.parent.operator === "typeof") return true;
  for (let p = node.parent; p; p = p.parent) {
    const test = p.type === "IfStatement" || p.type === "ConditionalExpression" ? p.test : p.type === "LogicalExpression" ? p.left : null;
    if (test && !(node.range[0] >= test.range[0] && node.range[1] <= test.range[1]) && sourceCode.getText(test).includes(name)) return true;
    if (p.type === "TryStatement" && p.handler && node.range[0] >= p.block.range[0] && node.range[1] <= p.block.range[1]) return true;
  }
  return false;
}

// src/util/domains.ts
function urlParts(u) {
  const m = u.trim().match(/^([a-z][a-z0-9+.-]*):(\/\/)?([^/?#]*)?([^?#]*)/i);
  if (!m) return null;
  const scheme = m[1].toLowerCase();
  const host = m[2] ? (m[3] ?? "").replace(/^[^@]*@/, "").replace(/:\d+$/, "").toLowerCase() || null : null;
  return { scheme, host, path: m[4] ?? "" };
}
function domainAllows(entry, host) {
  let e = entry.trim().toLowerCase();
  e = e.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "");
  if (!e) return false;
  if (e === "*") return true;
  if (e.startsWith("*.")) {
    const base2 = e.slice(2);
    return host === base2 || host.endsWith(`.${base2}`);
  }
  return host === e;
}
function domainsAllow(domains, host) {
  if (domains === "all") return true;
  if (!Array.isArray(domains)) return null;
  return domains.some((d) => typeof d === "string" && domainAllows(d, host));
}

// src/data/sources.ts
var SOURCES = {
  knownIssues: "https://developer.adobe.com/uxp/uxp-api/known-issues",
  unsupportedAttributes: "https://developer.adobe.com/photoshop/uxp/2022/uxp-api/reference-html/general/unsupported-attributes",
  unsupportedElements: "https://developer.adobe.com/photoshop/uxp/2022/uxp-api/reference-html/general/unsupported-elements",
  manifestV5: "https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/",
  alert: "https://github.com/AdobeDocs/uxp/blob/main/src/pages/uxp-api/reference-js/Global%20Members/HTML%20DOM/alert.md",
  fs: "https://github.com/AdobeDocs/uxp/blob/main/src/pages/uxp-api/reference-js/Modules/fs/fs.md",
  modulesIndex: "https://github.com/AdobeDocs/uxp/blob/main/src/pages/uxp-api/reference-js/Modules/index.md",
  executeAsModal: "https://developer.adobe.com/photoshop/uxp/2022/ps_reference/media/executeasmodal/",
  bubblydooPolyfills: "https://github.com/bubblydoo/uxp-toolkit/blob/13a179c36b599e48c33395ffd5935dfbe2062378/packages/uxp-polyfills/README.md",
  forum4605: "https://forums.creativeclouddeveloper.com/t/4605",
  forum10557: "https://forums.creativeclouddeveloper.com/t/uxp-manifest-network-permission-denied-for-fetch-despite-domains-all/10557",
  forum12117: "https://forums.creativeclouddeveloper.com/t/released-a-portrait-retouching-plugin-some-uxp-lessons-from-the-build/12117",
  forum5837: "https://forums.creativeclouddeveloper.com/t/error-host-is-in-a-modal-state/5837",
  forum6687: "https://forums.creativeclouddeveloper.com/t/how-to-know-which-batchplay-actions-require-executeasmodal-is-there-any-downside-to-executing-all-as-modal/6687",
  psManifestApiVersion: "https://github.com/AdobeDocs/uxp-photoshop/blob/9bd99ffedbaf0e79d525ee2ffe200eb29a8e6aaf/src/pages/guides/uxp-guide/uxp-misc/manifest-v4/photoshop-manifest/index.md#apiversion",
  uxpChangelog: "https://github.com/AdobeDocs/uxp/blob/f04f65e02065b4cd8c78d9d26bcba2ccf6943c58/src/pages/uxp-api/changelog3P.md",
  psChangelog: "https://developer.adobe.com/photoshop/uxp/2022/ps-reference/changelog/",
  manifestV4: "https://github.com/AdobeDocs/uxp-photoshop/blob/9bd99ffedbaf0e79d525ee2ffe200eb29a8e6aaf/src/pages/guides/uxp-guide/uxp-misc/manifest-v4/index.md",
  manifestV5Md: "https://github.com/AdobeDocs/uxp-photoshop/blob/9bd99ffedbaf0e79d525ee2ffe200eb29a8e6aaf/src/pages/guides/uxp-guide/uxp-misc/manifest-v5/index.md",
  forum8224: "https://forums.creativeclouddeveloper.com/t/localfilesystem-getentrywithurl-is-not-a-function/8224",
  forum11310: "https://forums.creativeclouddeveloper.com/t/does-css-gap-work-in-uxp-panels-for-prpro/11310",
  forum11898: "https://forums.creativeclouddeveloper.com/t/trying-to-fix-require-is-not-a-function/11898",
  uiPlaygroundReadme: "https://github.com/AdobeDocs/uxp-photoshop-plugin-samples/tree/main/ui-playground"
};

// src/rules/manifest-permissions.ts
var PLUGIN_SCHEMES = /^(plugin|plugin-data|plugin-temp):/i;
var PICKERS = /* @__PURE__ */ new Set(["getFileForOpening", "getFileForSaving", "getFolder"]);
var URL_ENTRY = /* @__PURE__ */ new Set(["getEntryWithUrl", "createEntryWithUrl"]);
var FS_PATH_FIRST = /* @__PURE__ */ new Set(["readFile", "readFileSync", "writeFile", "writeFileSync", "open", "lstat", "lstatSync", "rename", "copyFile", "unlink", "mkdir", "rmdir", "readdir", "readdirSync"]);
var LFS = "uxp.storage.localFileSystem";
var manifest_permissions_default = createRule({
  name: "manifest-permissions",
  meta: {
    type: "problem",
    docs: {
      description: "Require manifest v5+ `requiredPermissions` for the network, file system, launchProcess, clipboard, IPC, WebView, user info and alert APIs the code uses",
      recommended: true,
      sources: [SOURCES.manifestV5, SOURCES.alert, SOURCES.fs, SOURCES.forum12117]
    },
    schema: [],
    messages: {
      missingNetwork: "`{{api}}` needs `requiredPermissions.network.domains` in manifest.json (manifest v5 grants no network access by default).",
      domainNotAllowed: '`{{host}}` is not in `requiredPermissions.network.domains`; the request will be denied ("Manifest entry not found").',
      missingLaunchProcess: "`{{api}}` needs `requiredPermissions.launchProcess` in manifest.json.",
      schemeNotAllowed: "Scheme `{{scheme}}` is not in `requiredPermissions.launchProcess.schemes`.",
      extensionNotAllowed: "Extension `{{ext}}` is not in `requiredPermissions.launchProcess.extensions`.",
      folderNeedsEmptyExtension: 'Opening a folder with `openPath` needs an empty string `""` in `requiredPermissions.launchProcess.extensions`.',
      needsRequestFs: '`{{api}}` needs `requiredPermissions.localFileSystem` set to "request" or "fullAccess" (default is "plugin").',
      needsFullAccess: 'Accessing `{{path}}` outside plugin storage needs `requiredPermissions.localFileSystem: "fullAccess"`.',
      missingClipboard: '`{{api}}` needs `requiredPermissions.clipboard` ("read" or "readAndWrite").',
      clipboardReadOnly: '`{{api}}` writes to the clipboard but `requiredPermissions.clipboard` is "read"; use "readAndWrite".',
      missingIpc: "`{{api}}` needs `requiredPermissions.ipc.enablePluginCommunication: true`.",
      missingWebview: 'WebView needs `requiredPermissions.webview.allow: "yes"` (manifest v5).',
      webviewDomainNotAllowed: "WebView source host `{{host}}` is not in `requiredPermissions.webview.domains`.",
      missingUserInfo: "`{{api}}` needs `requiredPermissions.enableUserInfo: true`.",
      missingEnableAlerts: '`{{api}}()` only works with `"featureFlags": { "enableAlerts": true }` in manifest.json (UXP 7.4+).'
    }
  },
  defaultOptions: [],
  create(context) {
    const uxp = getUxp(context);
    const m = uxp.manifest;
    if (!m || uxp.manifestVersion !== null && uxp.manifestVersion < 5) return {};
    const perms = m.requiredPermissions ?? {};
    const sourceCode = context.sourceCode;
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["uxp", "fs", "photoshop"]));
    const calls = [];
    const news = [];
    const members = [];
    const reported = /* @__PURE__ */ new Set();
    const report = (node, messageId, data2 = {}) => {
      const key = `${messageId}:${JSON.stringify(data2)}:${node.loc.start.line}:${node.loc.start.column}`;
      if (reported.has(key)) return;
      reported.add(key);
      context.report({ loc: node.loc, messageId, data: data2 });
    };
    const checkNetwork = (node, api, urlNode) => {
      const net = perms.network;
      if (!net || net.domains === void 0 || Array.isArray(net.domains) && net.domains.length === 0) {
        const pre2 = urlNode ? staticPrefix(urlNode) : null;
        if (pre2 && pre2.complete && !urlParts(pre2.text)) return;
        report(node, "missingNetwork", { api });
        return;
      }
      const pre = urlNode ? staticPrefix(urlNode) : null;
      if (!pre) return;
      const parts = urlParts(pre.text);
      if (!parts || !parts.host) return;
      if (!pre.complete && !/^[a-z][a-z0-9+.-]*:\/\/[^/?#]+[/?#:]/i.test(pre.text)) return;
      if (!["http", "https", "ws", "wss"].includes(parts.scheme)) return;
      if (domainsAllow(net.domains, parts.host) === false) report(urlNode ?? node, "domainNotAllowed", { host: parts.host });
    };
    const checkWebviewSrc = (node, src) => {
      const wv = perms.webview;
      if (!wv || wv.allow !== "yes") {
        report(node, "missingWebview");
        return;
      }
      if (!src) return;
      const parts = urlParts(src);
      if (!parts?.host || !["http", "https"].includes(parts.scheme)) return;
      if (wv.domains !== void 0 && domainsAllow(wv.domains, parts.host) === false) report(node, "webviewDomainNotAllowed", { host: parts.host });
    };
    const evaluateCall = (node) => {
      const callee = node.callee;
      const resolved = tracker.resolve(callee);
      const raw = memberPath(callee);
      const globalPath = raw ? stripGlobal(raw) : null;
      const arg0 = node.arguments[0];
      if (callee.type === "Identifier" && callee.name === "fetch" && isGlobalReference(sourceCode, callee)) checkNetwork(node, "fetch", arg0);
      else if (callee.type === "MemberExpression" && globalPath === "fetch") checkNetwork(node, "fetch", arg0);
      if (callee.type === "MemberExpression" && !callee.computed && callee.property.type === "Identifier" && callee.property.name === "open" && node.arguments.length >= 2) {
        const method = staticString(arg0);
        if (method && /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/i.test(method)) checkNetwork(node, "XMLHttpRequest.open", node.arguments[1]);
      }
      if (resolved) {
        if (resolved === "uxp.shell.openExternal" || resolved === "uxp.shell.openPath") {
          const api = resolved.slice(4);
          const lp = perms.launchProcess;
          if (!lp) {
            report(node, "missingLaunchProcess", { api });
            return;
          }
          const s = staticString(arg0);
          if (s === null) return;
          if (resolved.endsWith("openExternal")) {
            const parts = urlParts(s);
            if (parts && !(lp.schemes ?? []).map((x) => x.toLowerCase()).includes(parts.scheme)) report(arg0, "schemeNotAllowed", { scheme: parts.scheme });
          } else {
            const base2 = s.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
            const dot = base2.lastIndexOf(".");
            const exts = (lp.extensions ?? []).map((x) => x.toLowerCase());
            if (dot <= 0 || /[\\/]$/.test(s)) {
              if (!exts.includes("")) report(arg0, "folderNeedsEmptyExtension");
            } else {
              const ext = base2.slice(dot).toLowerCase();
              if (!exts.includes(ext) && !exts.includes(ext.slice(1))) report(arg0, "extensionNotAllowed", { ext });
            }
          }
          return;
        }
        if (resolved.startsWith(`${LFS}.`)) {
          const method = resolved.slice(LFS.length + 1);
          const level = perms.localFileSystem ?? "plugin";
          if (PICKERS.has(method) && level !== "request" && level !== "fullAccess") report(node, "needsRequestFs", { api: `localFileSystem.${method}` });
          if (URL_ENTRY.has(method)) {
            const s = staticString(arg0);
            if (s !== null && !PLUGIN_SCHEMES.test(s) && level !== "fullAccess") report(arg0, "needsFullAccess", { path: s });
          }
          return;
        }
        if (resolved.startsWith("fs.") || resolved.startsWith("uxp.storage.fs.")) {
          const method = resolved.split(".").pop();
          if (!FS_PATH_FIRST.has(method)) return;
          const level = perms.localFileSystem ?? "plugin";
          for (const a of method === "rename" || method === "copyFile" ? node.arguments.slice(0, 2) : node.arguments.slice(0, 1)) {
            const s = staticString(a);
            if (s !== null && !PLUGIN_SCHEMES.test(s) && level !== "fullAccess") report(a, "needsFullAccess", { path: s });
          }
          return;
        }
      }
      if (globalPath && /^navigator\.clipboard\.(read|readText|write|writeText|clearContent|setContent|getContent)$/.test(globalPath)) {
        const method = globalPath.split(".").pop();
        const api = `navigator.clipboard.${method}`;
        const writes = !/^(read|readText|getContent)$/.test(method);
        if (!perms.clipboard) report(node, "missingClipboard", { api });
        else if (writes && perms.clipboard === "read") report(node, "clipboardReadOnly", { api });
      }
      if (globalPath === "document.createElement" && staticString(arg0)?.toLowerCase() === "webview") checkWebviewSrc(node, null);
      const alertName = callee.type === "Identifier" && isGlobalReference(sourceCode, callee) ? callee.name : globalPath && /^(window|globalThis)\./.test(raw ?? "") ? globalPath : null;
      if (alertName && ["alert", "confirm", "prompt"].includes(alertName) && m.featureFlags?.enableAlerts !== true && !node.optional && !isOptionalUse(callee)) report(node, "missingEnableAlerts", { api: alertName });
    };
    const evaluateMember = (node) => {
      if (node.parent?.type === "MemberExpression" && node.parent.object === node) return;
      const resolved = tracker.resolve(node);
      if (!resolved) return;
      if ((resolved === "uxp.pluginManager" || resolved.startsWith("uxp.pluginManager.")) && perms.ipc?.enablePluginCommunication !== true) report(node, "missingIpc", { api: resolved.replace(/^uxp\./, "") });
      if ((resolved === "uxp.userInfo" || resolved.startsWith("uxp.userInfo.")) && perms.enableUserInfo !== true) report(node, "missingUserInfo", { api: resolved.replace(/^uxp\./, "") });
    };
    return mergeVisitors(tracker.visitors(), {
      CallExpression(node) {
        calls.push(node);
      },
      NewExpression(node) {
        news.push(node);
      },
      MemberExpression(node) {
        members.push(node);
      },
      ImportSpecifier(node) {
        const src = node.parent.source.value;
        const imported = node.imported.type === "Identifier" ? node.imported.name : "";
        if (src === "uxp" && imported === "pluginManager" && perms.ipc?.enablePluginCommunication !== true) report(node, "missingIpc", { api: "pluginManager" });
        if (src === "uxp" && imported === "userInfo" && perms.enableUserInfo !== true) report(node, "missingUserInfo", { api: "userInfo" });
      },
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "webview") return;
        const src = node.attributes.find((a) => a.type === "JSXAttribute" && a.name.type === "JSXIdentifier" && a.name.name === "src");
        checkWebviewSrc(node, src?.value?.type === "Literal" ? String(src.value.value) : null);
      },
      // @html-eslint/parser
      ...{
        Tag(node) {
          if (node.name.toLowerCase() !== "webview") return;
          checkWebviewSrc(node, getHtmlAttr(node, "src")?.value?.value ?? null);
        }
      },
      "Program:exit"() {
        tracker.finalize();
        for (const c of calls) evaluateCall(c);
        for (const n of news) {
          if (n.callee.type === "Identifier" && (n.callee.name === "WebSocket" || n.callee.name === "Request") && isGlobalReference(sourceCode, n.callee)) checkNetwork(n, n.callee.name, n.arguments[0]);
        }
        for (const mm of members) evaluateMember(mm);
      }
    });
  }
});

// src/data/generated/uxp-since.ts
var uxpSince = {
  "$source": {
    "repo": "https://github.com/AdobeDocs/uxp",
    "dir": "src/pages/uxp-api/reference-js",
    "commit": "f04f65e02065b4cd8c78d9d26bcba2ccf6943c58",
    "note": "globals: H1 title of each doc page with a '**Since**' line directly under it; members: '<page title>.<H2/H3 heading>'. Versions are UXP versions."
  },
  "globals": {
    "crypto": {
      "since": "6.2",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Crypto/Crypto.md"
    },
    "Blob": {
      "since": "6.3",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Blob.md"
    },
    "Headers": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Headers.md"
    },
    "Request": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Request.md"
    },
    "Response": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Response.md"
    },
    "CanvasGradient": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/CanvasGradient.md"
    },
    "CanvasRenderingContext2D": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/CanvasRenderingContext2D.md"
    },
    "IntersectionObserver": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserverEntry": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "NodeFilter": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/NodeFilter.md"
    },
    "Path2D": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Path2D.md"
    },
    "ResizeObserver": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserver.md"
    },
    "ResizeObserverEntry": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverEntry.md"
    },
    "ResizeObserverSize": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverSize.md"
    },
    "ShadowRoot": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ShadowRoot.md"
    },
    "alert": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/alert.md"
    },
    "confirm": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/confirm.md"
    },
    "prompt": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/prompt.md"
    },
    "HTMLCanvasElement": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLCanvasElement.md"
    },
    "HTMLSlotElement": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSlotElement.md"
    },
    "HTMLTemplateElement": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTemplateElement.md"
    },
    "HTMLWebViewElement": {
      "since": "6.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLWebViewElement.md"
    },
    "ImageBlob": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/ImageBlob/ImageBlob.md"
    },
    "path": {
      "since": "6.4.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Path/Path.md"
    },
    "ReadableStream": {
      "since": "6.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Streams/ReadableStream.md"
    },
    "uxp.userInfo": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/User Information/UserInfo.md"
    },
    "uxp.xmp.XMPDateTime": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPDateTime.md"
    },
    "uxp.xmp.XMPFile": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPFile.md"
    },
    "XMPFileInfo": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPFileInfo.md"
    },
    "XMPIterator": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPIterator.md"
    },
    "uxp.xmp.XMPMeta": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPMeta.md"
    },
    "XMPPacketInfo": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPPacketInfo.md"
    },
    "XMPProperty": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPProperty.md"
    },
    "uxp.xmp.XMPUtils": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/XMP Classes/XMPUtils.md"
    },
    "uxp.xmp": {
      "since": "7.2.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/XMP/getting-started/xmp.md"
    }
  },
  "members": {
    "clipboard.write": {
      "since": "6.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Clipboard.md"
    },
    "clipboard.writeText": {
      "since": "6.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Clipboard.md"
    },
    "clipboard.read": {
      "since": "6.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Clipboard.md"
    },
    "clipboard.readText": {
      "since": "6.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Clipboard.md"
    },
    "clipboard.clearContent": {
      "since": "6.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/Clipboard.md"
    },
    "FormData.append": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.delete": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.entries": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.get": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.getAll": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.has": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.keys": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.set": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "FormData.values": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Data Transfers/FormData.md"
    },
    "Element.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Element.md"
    },
    "Element.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Element.md"
    },
    "Element.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Element.md"
    },
    "Element.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Element.md"
    },
    "Element.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Element.md"
    },
    "Element.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/Element.md"
    },
    "IntersectionObserver.root": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.rootMargin": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.thresholds": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.scrollMargin": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.observe": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.unobserve": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.disconnect": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserver.takeRecords": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserver.md"
    },
    "IntersectionObserverEntry.time": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "IntersectionObserverEntry.rootBounds": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "IntersectionObserverEntry.boundingClientRect": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "IntersectionObserverEntry.intersectionRect": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "IntersectionObserverEntry.isIntersecting": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "IntersectionObserverEntry.intersectionRatio": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "IntersectionObserverEntry.target": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/IntersectionObserverEntry.md"
    },
    "ResizeObserver.observe": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserver.md"
    },
    "ResizeObserver.unobserve": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserver.md"
    },
    "ResizeObserver.disconnect": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserver.md"
    },
    "ResizeObserverEntry.target": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverEntry.md"
    },
    "ResizeObserverEntry.contentRect": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverEntry.md"
    },
    "ResizeObserverEntry.borderBoxSize": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverEntry.md"
    },
    "ResizeObserverEntry.contentBoxSize": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverEntry.md"
    },
    "ResizeObserverEntry.devicePixelContentBoxSize": {
      "since": "8.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML DOM/ResizeObserverEntry.md"
    },
    "HTMLAnchorElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLAnchorElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLAnchorElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLAnchorElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLAnchorElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLAnchorElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLAnchorElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLAnchorElement.md"
    },
    "HTMLBodyElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLBodyElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLBodyElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLBodyElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLBodyElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLBodyElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLBodyElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLBodyElement.md"
    },
    "HTMLButtonElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLButtonElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLButtonElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLButtonElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLButtonElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLButtonElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLButtonElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLButtonElement.md"
    },
    "HTMLCanvasElement.getContext": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLCanvasElement.md"
    },
    "HTMLDialogElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLDialogElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLDialogElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLDialogElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLDialogElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLDialogElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLDialogElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLDialogElement.md"
    },
    "HTMLElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLElement.md"
    },
    "HTMLHeadElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHeadElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHeadElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHeadElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHeadElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHeadElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHeadElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHeadElement.md"
    },
    "HTMLHtmlElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLHtmlElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLHtmlElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLHtmlElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLHtmlElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLHtmlElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLHtmlElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLHtmlElement.md"
    },
    "HTMLImageElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLImageElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLImageElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLImageElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLImageElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLImageElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLImageElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLImageElement.md"
    },
    "HTMLInputElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLInputElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLInputElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLInputElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLInputElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLInputElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLInputElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLInputElement.md"
    },
    "HTMLLabelElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLabelElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLabelElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLabelElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLabelElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLabelElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLabelElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLabelElement.md"
    },
    "HTMLLinkElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLLinkElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLLinkElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLLinkElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLLinkElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLLinkElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLLinkElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLLinkElement.md"
    },
    "HTMLMenuElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuElement.md"
    },
    "HTMLMenuItemElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLMenuItemElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLMenuItemElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLMenuItemElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLMenuItemElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLMenuItemElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLMenuItemElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLMenuItemElement.md"
    },
    "HTMLOptionElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLOptionElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLOptionElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLOptionElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLOptionElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLOptionElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLOptionElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLOptionElement.md"
    },
    "HTMLProgressElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLProgressElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLProgressElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLProgressElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLProgressElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLProgressElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLProgressElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLProgressElement.md"
    },
    "HTMLScriptElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLScriptElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLScriptElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLScriptElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLScriptElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLScriptElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLScriptElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLScriptElement.md"
    },
    "HTMLSelectElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLSelectElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLSelectElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLSelectElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLSelectElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLSelectElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLSelectElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLSelectElement.md"
    },
    "HTMLStyleElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLStyleElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLStyleElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLStyleElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLStyleElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLStyleElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLStyleElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLStyleElement.md"
    },
    "HTMLTextAreaElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLTextAreaElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLTextAreaElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLTextAreaElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLTextAreaElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLTextAreaElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLTextAreaElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLTextAreaElement.md"
    },
    "HTMLVideoElement.videoWidth": {
      "since": "7.4.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.videoHeight": {
      "since": "7.4.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.dir": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.fastSeek": {
      "since": "7.4.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.append": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.prepend": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.replaceChildren": {
      "since": "8.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.setPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.releasePointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "HTMLVideoElement.hasPointerCapture": {
      "since": "7.1",
      "doc": "src/pages/uxp-api/reference-js/Global Members/HTML Elements/HTMLVideoElement.md"
    },
    "ReadableStream.pipeThrough": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Streams/ReadableStream.md"
    },
    "ReadableStream.pipeTo": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Streams/ReadableStream.md"
    },
    "ReadableStream.tee": {
      "since": "7.0.0",
      "doc": "src/pages/uxp-api/reference-js/Global Members/Streams/ReadableStream.md"
    },
    "uxp.userInfo.userId": {
      "since": "7.3.0",
      "doc": "src/pages/uxp-api/reference-js/Modules/uxp/User Information/UserInfo.md"
    }
  }
};
var uxp_since_default = uxpSince;

// src/data/generated/photoshop-min-versions.ts
var photoshopMinVersions = {
  "$source": {
    "package": "@types/photoshop",
    "version": "27.11.0",
    "repo": "https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/photoshop",
    "license": "MIT",
    "note": "Owner.member -> @minVersion JSDoc tag (Photoshop version). photoshopCore = require('photoshop').core, photoshopAction = .action, imaging = .imaging, Photoshop = app"
  },
  "members": {
    "ActionSet.typename": "23.0",
    "ActionSet.index": "22.1",
    "ActionSet.id": "22.1",
    "ActionSet.name": "22.1",
    "ActionSet.actions": "22.1",
    "ActionSet.delete": "22.1",
    "ActionSet.duplicate": "22.1",
    "ActionSet.play": "22.1",
    "Action.typename": "23.0",
    "Action.id": "22.1",
    "Action.index": "22.1",
    "Action.name": "22.1",
    "Action.parent": "22.1",
    "Action.delete": "22.1",
    "Action.play": "22.1",
    "Action.duplicate": "22.1",
    "Channel": "23.0",
    "Channel.parent": "23.0",
    "Channel.kind": "23.0",
    "Channel.visible": "23.0",
    "Channel.duplicate": "23.0",
    "Channel.name": "23.0",
    "Channel.histogram": "23.0",
    "Channel.color": "23.0",
    "Channel.opacity": "23.0",
    "Channel.remove": "23.0",
    "Channel.merge": "23.0",
    "ComponentChannel.typename": "24.5",
    "AlphaChannel.typename": "24.5",
    "ColorSampler.typename": "24.0",
    "ColorSampler.docId": "24.0",
    "ColorSampler.parent": "24.0",
    "ColorSampler.position": "24.0",
    "ColorSampler.color": "24.0",
    "ColorSampler.remove": "24.0",
    "ColorSampler.move": "24.0",
    "BatchPlayCommandOptions": "23.0",
    "BatchPlayCommandOptions.commandEnablement": "23.0",
    "BatchPlayCommandOptions.dialogOptions": "23.0",
    "BatchPlayCommandOptions.propagateErrorToDefaultHandler": "23.0",
    "BatchPlayCommandOptions.synchronousExecution": "23.0",
    "BatchPlayCommandOptions.modalBehavior": "23.0",
    "BatchPlayCommandOptions.useMultiGet": "23.0",
    "BatchPlayCommandOptions.suppressPlayLevelIncrease": "23.0",
    "CPUInfo": "23.0",
    "CPUInfo.vendor": "23.0",
    "CPUInfo.physicalCores": "23.0",
    "CPUInfo.logicalCores": "23.0",
    "CPUInfo.frequencyMhz": "23.0",
    "CPUInfo.emulationMode": "23.0",
    "OpenGLDeviceInfo": "23.0",
    "OpenGLDeviceInfo.version": "23.0",
    "OpenGLDeviceInfo.memoryMB": "23.0",
    "OpenGLDeviceInfo.name": "23.0",
    "OpenGLDeviceInfo.driverVersion": "23.0",
    "OpenGLDeviceInfo.vendor": "23.0",
    "OpenGLDeviceInfo.isIntegrated": "23.0",
    "OpenGLDeviceInfo.glDriver": "23.0",
    "OpenCLDeviceInfo": "23.0",
    "OpenCLDeviceInfo.version": "23.0",
    "OpenCLDeviceInfo.memoryMB": "23.0",
    "OpenCLDeviceInfo.name": "23.0",
    "OpenCLDeviceInfo.driverVersion": "23.0",
    "OpenCLDeviceInfo.vendor": "23.0",
    "OpenCLDeviceInfo.isIntegrated": "23.0",
    "OpenCLDeviceInfo.oclBandwidth": "23.0",
    "OpenCLDeviceInfo.oclCompute": "23.0",
    "OpenCLDeviceInfo.clDeviceVersion": "23.0",
    "OpenCLDeviceInfo.clPlatformVersion": "23.0",
    "GPUInfo": "23.0",
    "GPUInfo.gpuInfoList": "23.0",
    "GPUInfo.clgpuInfoList": "23.0",
    "DisplayConfigurationOptions": "23.0",
    "DisplayConfigurationOptions.physicalResolution": "23.0",
    "DisplayConfiguration": "23.0",
    "DisplayConfiguration.globalBounds": "23.0",
    "DisplayConfiguration.globalWorkingBounds": "23.0",
    "DisplayConfiguration.isPrimary": "23.0",
    "DisplayConfiguration.maximumExtendedDynamicRangeColorComponent": "26.5",
    "DisplayConfiguration.physicalResolution": "23.0",
    "DisplayConfiguration.scaleFactor": "23.0",
    "DisplayConfiguration.screensHaveSeparateSpaces": "26.3",
    "LayerTreeInfo": "23.0",
    "LayerTreeInfo.name": "23.0",
    "LayerTreeInfo.layerID": "23.0",
    "LayerTreeInfo.kind": "23.0",
    "LayerTreeInfo.layers": "23.0",
    "photoshopAction.batchPlay": "23.0",
    "photoshopAction.batchPlaySync": "23.1",
    "photoshopAction.addNotificationListener": "23.0",
    "photoshopAction.removeNotificationListener": "23.0",
    "photoshopAction.validateReference": "23.1",
    "photoshopAction.recordAction": "25.0",
    "photoshopAction.getIDFromString": "24.0",
    "photoshopCore.apiVersion": "22.5",
    "photoshopCore.addNotificationListener": "23.3",
    "photoshopCore.calculateDialogSize": "22.5",
    "photoshopCore.convertGlobalToLocal": "26.0",
    "photoshopCore.convertColor": "23.0",
    "photoshopCore.createTemporaryDocument": "23.0",
    "photoshopCore.deleteTemporaryDocument": "23.0",
    "photoshopCore.endModalToolState": "22.5",
    "photoshopCore.executeAsModal": "22.5",
    "photoshopCore.getActiveTool": "22.5",
    "photoshopCore.getCPUInfo": "23.1",
    "photoshopCore.getDisplayConfiguration": "23.0",
    "photoshopCore.getGPUInfo": "23.1",
    "photoshopCore.getLayerGroupContents": "23.1",
    "photoshopCore.getLayerGroupContentsSync": "23.1",
    "photoshopCore.getLayerTree": "23.1",
    "photoshopCore.getLayerTreeSync": "23.1",
    "photoshopCore.getMenuCommandState": "22.5",
    "photoshopCore.getMenuCommandTitle": "22.5",
    "photoshopCore.getPluginInfo": "23.2",
    "photoshopCore.getUserIdleTime": "23.3",
    "photoshopCore.historySuspended": "23.1",
    "photoshopCore.isModal": "23.1",
    "photoshopCore.performMenuCommand": "22.5",
    "photoshopCore.redrawDocument": "24.1",
    "photoshopCore.removeNotificationListener": "23.0",
    "photoshopCore.setExecutionMode": "23.2",
    "photoshopCore.setUserIdleTime": "23.3",
    "photoshopCore.showAlert": "22.5",
    "photoshopCore.suppressResizeGripper": "23.1",
    "photoshopCore.translateUIString": "22.5",
    "ExecuteAsModalOptions.commandName": "22.5",
    "ExecuteAsModalOptions.descriptor": "22.5",
    "ExecuteAsModalOptions.interactive": "23.3",
    "ExecuteAsModalOptions.timeOut": "25.10",
    "HistoryStateInfo.name": "23.0",
    "HistoryStateInfo.documentID": "23.0",
    "HistorySuspension": "23.0",
    "HistorySuspension.historySuspensionID": "23.0",
    "ResumeHistorySuspensionOptions.finalName": "23.0",
    "ExecutionContext": "23.0",
    "ExecutionContext.isCancelled": "23.0",
    "ExecutionContext.onCancel": "23.0",
    "ExecutionContext.reportProgress": "23.0",
    "ExecutionContext.hostControl": "23.0",
    "ExecutionContext.suspendHistory": "23.0",
    "ExecutionContext.resumeHistory": "23.0",
    "CountItem.typename": "24.1",
    "CountItem.parent": "24.1",
    "CountItem.position": "24.1",
    "CountItem.move": "24.1",
    "CountItem.remove": "24.1",
    "GenerativeUpscaleOptions": "25.0",
    "Document.typename": "23.0",
    "Document.id": "22.5",
    "Document.saved": "23.0",
    "Document.activeLayers": "22.5",
    "Document.artboards": "22.5",
    "Document.name": "23.0",
    "Document.histogram": "23.0",
    "Document.quickMaskMode": "23.0",
    "Document.guides": "23.0",
    "Document.countItems": "24.1",
    "Document.colorSamplers": "24.0",
    "Document.mode": "23.0",
    "Document.bitsPerChannel": "23.0",
    "Document.cloudDocument": "23.0",
    "Document.cloudWorkAreaDirectory": "23.0",
    "Document.layers": "22.5",
    "Document.layerComps": "24.0",
    "Document.backgroundLayer": "22.5",
    "Document.path": "22.5",
    "Document.pathItems": "23.3",
    "Document.historyStates": "22.5",
    "Document.activeHistoryState": "22.5",
    "Document.activeHistoryBrushSource": "22.5",
    "Document.title": "22.5",
    "Document.resolution": "22.5",
    "Document.width": "22.5",
    "Document.height": "22.5",
    "Document.zoom": "25.1",
    "Document.pixelAspectRatio": "22.5",
    "Document.colorProfileName": "23.0",
    "Document.colorProfileType": "23.0",
    "Document.selection": "24.2",
    "Document.close": "22.5",
    "Document.closeWithoutSaving": "22.5",
    "Document.crop": "23.0",
    "Document.flatten": "22.5",
    "Document.duplicate": "23.0",
    "Document.mergeVisibleLayers": "23.0",
    "Document.splitChannels": "23.0",
    "Document.revealAll": "23.0",
    "Document.rasterizeAllLayers": "23.0",
    "Document.changeMode": "23.0",
    "Document.convertProfile": "23.0",
    "Document.trap": "23.0",
    "Document.resizeCanvas": "23.0",
    "Document.resizeImage": "23.0",
    "Document.generativeUpscale": "25.0",
    "Document.trim": "23.0",
    "Document.rotate": "23.0",
    "Document.paste": "23.0",
    "Document.save": "23.0",
    "Document.saveAs": "23.0",
    "Document.psd": "23.0",
    "Document.psb": "23.0",
    "Document.jpg": "23.0",
    "Document.gif": "23.0",
    "Document.png": "23.0",
    "Document.bmp": "23.0",
    "Document.duplicateLayers": "23.0",
    "Document.linkLayers": "23.0",
    "Document.createLayer": "23.0",
    "Document.createPixelLayer": "24.1",
    "Document.createTextLayer": "24.2",
    "Document.createLayerGroup": "23.0",
    "Document.groupLayers": "23.0",
    "Document.suspendHistory": "23.0",
    "Document.sampleColor": "24.0",
    "Document.calculations": "24.5",
    "Document.channels": "23.0",
    "Document.componentChannels": "24.5",
    "Document.compositeChannels": "23.0",
    "Document.activeChannels": "23.0",
    "Guide": "23.0",
    "Guide.typename": "23.0",
    "Guide.id": "23.0",
    "Guide.docId": "23.0",
    "Guide.parent": "23.0",
    "Guide.direction": "23.0",
    "Guide.coordinate": "23.0",
    "Guide.delete": "23.0",
    "HistoryState": "22.5",
    "HistoryState.typename": "23.0",
    "HistoryState.id": "22.5",
    "HistoryState.docId": "22.5",
    "HistoryState.name": "22.5",
    "HistoryState.parent": "22.5",
    "HistoryState.snapshot": "22.5",
    "imaging": "24.4",
    "imaging.getPixels": "24.4",
    "imaging.putPixels": "24.4",
    "imaging.getLayerMask": "24.4",
    "imaging.putLayerMask": "24.4",
    "imaging.getSelection": "24.4",
    "imaging.putSelection": "24.4",
    "imaging.createImageDataFromBuffer": "24.4",
    "imaging.encodeImageData": "24.4",
    "GetPixelsOptions": "24.4",
    "GetPixelsOptions.documentID": "24.4",
    "GetPixelsOptions.layerID": "24.4",
    "GetPixelsOptions.sourceBounds": "24.4",
    "GetPixelsOptions.targetSize": "24.4",
    "GetPixelsOptions.colorSpace": "24.4",
    "GetPixelsOptions.colorProfile": "24.4",
    "GetPixelsOptions.componentSize": "24.4",
    "GetPixelsOptions.applyAlpha": "24.4",
    "GetPixelsResult": "24.4",
    "GetPixelsResult.imageData": "24.4",
    "GetPixelsResult.sourceBounds": "24.4",
    "GetPixelsResult.level": "24.4",
    "CreateImageDataFromBufferOptions": "24.4",
    "CreateImageDataFromBufferOptions.width": "24.4",
    "CreateImageDataFromBufferOptions.height": "24.4",
    "CreateImageDataFromBufferOptions.components": "24.4",
    "CreateImageDataFromBufferOptions.chunky": "24.4",
    "CreateImageDataFromBufferOptions.colorProfile": "24.4",
    "CreateImageDataFromBufferOptions.colorSpace": "24.4",
    "CreateImageDataFromBufferOptions.fullRange": "24.4",
    "EncodeImageDataOptions": "24.4",
    "EncodeImageDataOptions.imageData": "24.4",
    "EncodeImageDataOptions.base64": "24.4",
    "GetDataOptions": "24.4",
    "GetDataOptions.chunky": "24.4",
    "GetDataOptions.fullRange": "24.4",
    "Size": "24.4",
    "Layer.typename": "23.0",
    "Layer.locked": "22.5",
    "Layer.allLocked": "22.5",
    "Layer.pixelsLocked": "22.5",
    "Layer.positionLocked": "22.5",
    "Layer.transparentPixelsLocked": "22.5",
    "Layer.isBackgroundLayer": "22.5",
    "Layer.visible": "22.5",
    "Layer.kind": "22.5",
    "Layer.bounds": "22.5",
    "Layer.boundsNoEffects": "22.5",
    "Layer.opacity": "22.5",
    "Layer.fillOpacity": "23.0",
    "Layer.filterMaskDensity": "23.0",
    "Layer.filterMaskFeather": "23.0",
    "Layer.layerMaskDensity": "23.0",
    "Layer.layerMaskFeather": "23.0",
    "Layer.vectorMaskDensity": "23.0",
    "Layer.vectorMaskFeather": "23.0",
    "Layer.isClippingMask": "23.0",
    "Layer.blendMode": "22.5",
    "Layer.linkedLayers": "22.5",
    "Layer.name": "22.5",
    "Layer.id": "22.5",
    "Layer.document": "23.0",
    "Layer.parent": "22.5",
    "Layer.selected": "22.5",
    "Layer.textItem": "24.2",
    "Layer.applyAddNoise": "23.5",
    "Layer.applyAverage": "23.5",
    "Layer.applyBlur": "23.5",
    "Layer.applyBlurMore": "23.5",
    "Layer.applyClouds": "23.5",
    "Layer.applyCustomFilter": "23.5",
    "Layer.applyDeInterlace": "23.5",
    "Layer.applyDespeckle": "23.5",
    "Layer.applyDifferenceClouds": "23.5",
    "Layer.applyDiffuseGlow": "23.5",
    "Layer.applyDisplace": "23.5",
    "Layer.applyDustAndScratches": "23.5",
    "Layer.applyGaussianBlur": "23.5",
    "Layer.applyGlassEffect": "23.5",
    "Layer.applyHighPass": "23.5",
    "Layer.applyLensBlur": "23.5",
    "Layer.applyLensFlare": "23.5",
    "Layer.applyMaximum": "23.5",
    "Layer.applyMinimum": "23.5",
    "Layer.applyMedianNoise": "23.5",
    "Layer.applyMotionBlur": "23.5",
    "Layer.applyNTSC": "23.5",
    "Layer.applyOceanRipple": "23.5",
    "Layer.applyOffset": "23.5",
    "Layer.applyTwirl": "23.5",
    "Layer.applyPinch": "23.5",
    "Layer.applyPolarCoordinates": "23.5",
    "Layer.applyRipple": "23.5",
    "Layer.applySharpen": "23.5",
    "Layer.applySharpenEdges": "23.5",
    "Layer.applySharpenMore": "23.5",
    "Layer.applyShear": "23.5",
    "Layer.applySmartBlur": "24.0",
    "Layer.applySpherize": "24.0",
    "Layer.applyUnSharpMask": "24.0",
    "Layer.applyWave": "24.0",
    "Layer.applyZigZag": "24.0",
    "Layer.applyImage": "24.5",
    "Layer.delete": "23.0",
    "Layer.duplicate": "23.0",
    "Layer.link": "23.0",
    "Layer.unlink": "23.0",
    "Layer.move": "23.0",
    "Layer.bringToFront": "23.0",
    "Layer.sendToBack": "23.0",
    "Layer.translate": "23.0",
    "Layer.flip": "23.0",
    "Layer.scale": "23.0",
    "Layer.rotate": "23.0",
    "Layer.skew": "23.0",
    "Layer.clear": "23.0",
    "Layer.copy": "23.0",
    "Layer.cut": "23.0",
    "Layer.merge": "23.0",
    "Layer.rasterize": "23.0",
    "Layer.layers": "23.0",
    "LayerComp": "24.0",
    "LayerComp.typename": "24.0",
    "LayerComp.id": "24.0",
    "LayerComp.docId": "24.0",
    "LayerComp.parent": "24.0",
    "LayerComp.name": "24.0",
    "LayerComp.comment": "24.0",
    "LayerComp.selected": "24.0",
    "LayerComp.appearance": "24.0",
    "LayerComp.position": "24.0",
    "LayerComp.visibility": "24.0",
    "LayerComp.childComp": "24.0",
    "LayerComp.apply": "24.0",
    "LayerComp.recapture": "24.0",
    "LayerComp.remove": "24.0",
    "LayerComp.resetLayerComp": "24.0",
    "LayerComp.duplicate": "24.0",
    "PathItem": "23.3",
    "PathItem.typename": "23.3",
    "PathItem.id": "23.3",
    "PathItem.docId": "23.3",
    "PathItem.parent": "23.3",
    "PathItem.kind": "23.3",
    "PathItem.name": "23.3",
    "PathItem.subPathItems": "23.3",
    "PathItem.deselect": "23.3",
    "PathItem.duplicate": "23.3",
    "PathItem.fillPath": "23.3",
    "PathItem.makeClippingPath": "23.3",
    "PathItem.makeSelection": "23.3",
    "PathItem.remove": "23.3",
    "PathItem.select": "23.3",
    "PathItem.strokePath": "23.3",
    "PathPoint.typename": "23.3",
    "PathPoint.parent": "23.3",
    "PathPoint.anchor": "23.3",
    "PathPoint.kind": "23.3",
    "PathPoint.leftDirection": "23.3",
    "PathPoint.rightDirection": "23.3",
    "Photoshop.typename": "23.0",
    "Photoshop.preferences": "24.0",
    "Photoshop.displayDialogs": "23.0",
    "Photoshop.activeDocument": "23.0",
    "Photoshop.getColorProfiles": "24.1",
    "Photoshop.currentTool": "23.0",
    "Photoshop.actionTree": "23.0",
    "Photoshop.documents": "23.0",
    "Photoshop.foregroundColor": "23.0",
    "Photoshop.convertUnits": "23.4",
    "Photoshop.backgroundColor": "23.0",
    "Photoshop.fonts": "23.0",
    "Photoshop.showAlert": "23.0",
    "Photoshop.batchPlay": "23.0",
    "Photoshop.bringToFront": "23.0",
    "Photoshop.open": "23.0",
    "Photoshop.createDocument": "23.0",
    "Photoshop.updateUI": "26.0",
    "Selection": "25.0",
    "Selection.typename": "25.0",
    "Selection.docId": "25.0",
    "Selection.parent": "25.0",
    "Selection.bounds": "25.0",
    "Selection.solid": "25.0",
    "Selection.contract": "25.0",
    "Selection.deselect": "25.0",
    "Selection.expand": "25.0",
    "Selection.feather": "25.0",
    "Selection.grow": "25.0",
    "Selection.inverse": "25.0",
    "Selection.load": "25.0",
    "Selection.makeWorkPath": "25.0",
    "Selection.selectAll": "25.0",
    "Selection.selectRectangle": "25.0",
    "Selection.selectEllipse": "25.0",
    "Selection.selectPolygon": "25.0",
    "Selection.selectRow": "25.0",
    "Selection.selectColumn": "25.0",
    "Selection.save": "25.0",
    "Selection.saveTo": "25.0",
    "Selection.selectBorder": "25.0",
    "Selection.smooth": "25.0",
    "Selection.translateBoundary": "25.0",
    "Selection.resizeBoundary": "25.0",
    "Selection.rotateBoundary": "25.0",
    "SubPathItem.typename": "23.3",
    "SubPathItem.parent": "23.3",
    "SubPathItem.operation": "23.3",
    "SubPathItem.closed": "23.3",
    "SubPathItem.pathPoints": "23.3",
    "TextItem": "24.1",
    "TextItem.parent": "24.1",
    "TextItem.typename": "24.1",
    "TextItem.contents": "24.1",
    "TextItem.textClickPoint": "24.1",
    "TextItem.orientation": "24.1",
    "TextItem.isPointText": "24.1",
    "TextItem.isParagraphText": "24.1",
    "TextItem.bounds": "27.4",
    "TextItem.convertToParagraphText": "27.4",
    "TextItem.convertToPointText": "24.1",
    "TextItem.convertToShape": "24.1",
    "TextItem.createWorkPath": "24.1",
    "TextItem.characterStyle": "24.1",
    "TextItem.paragraphStyle": "24.1",
    "TextItem.warpStyle": "24.1",
    "Channels": "23.0",
    "Channels.add": "23.0",
    "Channels.getByName": "23.0",
    "Channels.removeAll": "23.0",
    "Channels.length": "23.0",
    "Channels.parent": "23.0",
    "Channels.typename": "23.0",
    "ColorSamplers": "24.0",
    "ColorSamplers.length": "24.0",
    "ColorSamplers.parent": "24.0",
    "ColorSamplers.add": "24.0",
    "ColorSamplers.removeAll": "24.0",
    "CountItems.typename": "24.1",
    "CountItems.length": "24.1",
    "CountItems.parent": "24.1",
    "CountItems.add": "24.1",
    "CountItems.removeAllFromActiveGroup": "24.1",
    "CountItems.getAll": "24.1",
    "CountItems.createGroup": "24.1",
    "CountItems.renameActiveGroup": "24.1",
    "CountItems.removeGroupByIndex": "24.1",
    "CountItems.toggleActiveGroupVisibility": "24.1",
    "CountItems.activateGroupByIndex": "24.1",
    "CountItems.setActiveMarkerSize": "24.1",
    "CountItems.setActiveLabelSize": "24.1",
    "CountItems.setActiveColor": "24.1",
    "Documents.getByName": "22.5",
    "Documents.length": "22.5",
    "Documents.parent": "22.5",
    "Documents.typename": "22.5",
    "Documents.add": "22.5",
    "Guides.length": "23.0",
    "Guides.parent": "23.0",
    "Guides.add": "23.0",
    "Guides.removeAll": "23.0",
    "HistoryStates.getByName": "22.5",
    "HistoryStates.length": "22.5",
    "HistoryStates.parent": "22.5",
    "LayerComps": "24.0",
    "LayerComps.typename": "24.0",
    "LayerComps.length": "24.0",
    "LayerComps.parent": "24.0",
    "LayerComps.add": "24.0",
    "LayerComps.removeAll": "24.0",
    "LayerComps.getAllByName": "24.0",
    "Layers.getByName": "22.5",
    "Layers.length": "22.5",
    "Layers.typename": "22.5",
    "Layers.add": "22.5",
    "PathItems.length": "23.3",
    "PathItems.parent": "23.3",
    "PathItems.add": "23.3",
    "PathItems.removeAll": "23.3",
    "PathItems.getByName": "23.3",
    "PathPoints.length": "23.3",
    "PathPoints.parent": "23.3",
    "SubPathItems.length": "23.3",
    "SubPathItems.parent": "23.3",
    "TextFonts.getByName": "23.0",
    "TextFonts.length": "23.0",
    "TextFonts.parent": "23.0",
    "TextFonts.typename": "23.0",
    "Bounds.left": "22.5",
    "Bounds.right": "22.5",
    "Bounds.top": "22.5",
    "Bounds.bottom": "22.5",
    "Bounds.width": "22.5",
    "Bounds.height": "22.5",
    "Bounds.typename": "22.5",
    "CMYKColor": "23.0",
    "CMYKColor.black": "23.0",
    "CMYKColor.cyan": "23.0",
    "CMYKColor.magenta": "23.0",
    "CMYKColor.yellow": "23.0",
    "CMYKColor.typename": "23.0",
    "GrayColor": "23.0",
    "GrayColor.gray": "23.0",
    "GrayColor.typename": "23.0",
    "HSBColor": "23.0",
    "HSBColor.brightness": "23.0",
    "HSBColor.hue": "23.0",
    "HSBColor.saturation": "23.0",
    "HSBColor.typename": "23.0",
    "LabColor": "23.0",
    "LabColor.a": "23.0",
    "LabColor.b": "23.0",
    "LabColor.l": "23.0",
    "LabColor.typename": "23.0",
    "RGBColor": "23.0",
    "RGBColor.blue": "23.0",
    "RGBColor.green": "23.0",
    "RGBColor.red": "23.0",
    "RGBColor.hexValue": "23.0",
    "RGBColor.typename": "23.0",
    "NoColor": "23.0",
    "NoColor.typename": "23.0",
    "BitmapConversionOptions.angle": "23.0",
    "BitmapConversionOptions.frequency": "23.0",
    "BitmapConversionOptions.method": "23.0",
    "BitmapConversionOptions.patternName": "23.0",
    "BitmapConversionOptions.resolution": "23.0",
    "BitmapConversionOptions.shape": "23.0",
    "BitmapConversionOptions.typename": "23.0",
    "IndexedConversionOptions": "23.0",
    "IndexedConversionOptions.colors": "23.0",
    "IndexedConversionOptions.dither": "23.0",
    "IndexedConversionOptions.ditherAmount": "23.0",
    "IndexedConversionOptions.forced": "23.0",
    "IndexedConversionOptions.matte": "23.0",
    "IndexedConversionOptions.palette": "23.0",
    "IndexedConversionOptions.preserveExactColors": "23.0",
    "IndexedConversionOptions.transparency": "23.0",
    "IndexedConversionOptions.typename": "23.0",
    "PathPointInfo": "23.3",
    "PathPointInfo.anchor": "23.3",
    "PathPointInfo.kind": "23.3",
    "PathPointInfo.leftDirection": "23.3",
    "PathPointInfo.rightDirection": "23.3",
    "PathPointInfo.typename": "23.3",
    "BMPSaveOptions": "22.5",
    "BMPSaveOptions.alphaChannels": "22.5",
    "BMPSaveOptions.depth": "22.5",
    "BMPSaveOptions.flipRowOrder": "22.5",
    "BMPSaveOptions.osType": "22.5",
    "BMPSaveOptions.rleCompression": "22.5",
    "BMPSaveOptions.typename": "22.5",
    "JPEGSaveOptions": "22.5",
    "JPEGSaveOptions.quality": "22.5",
    "JPEGSaveOptions.formatOptions": "22.5",
    "JPEGSaveOptions.scans": "22.5",
    "JPEGSaveOptions.color": "22.5",
    "JPEGSaveOptions.matteColor": "22.5",
    "JPEGSaveOptions.customMatte": "22.5",
    "JPEGSaveOptions.embedColorProfile": "22.5",
    "JPEGSaveOptions.typename": "22.5",
    "GIFSaveOptions": "22.5",
    "GIFSaveOptions.colors": "22.5",
    "GIFSaveOptions.dither": "22.5",
    "GIFSaveOptions.ditherAmount": "22.5",
    "GIFSaveOptions.forced": "22.5",
    "GIFSaveOptions.interlaced": "22.5",
    "GIFSaveOptions.matte": "22.5",
    "GIFSaveOptions.palette": "22.5",
    "GIFSaveOptions.preserveExactColors": "22.5",
    "GIFSaveOptions.transparency": "22.5",
    "GIFSaveOptions.typename": "22.5",
    "PNGSaveOptions": "22.5",
    "PNGSaveOptions.method": "22.5",
    "PNGSaveOptions.compression": "22.5",
    "PNGSaveOptions.interlaced": "22.5",
    "PNGSaveOptions.typename": "22.5",
    "PhotoshopSaveOptions": "22.5",
    "PhotoshopSaveOptions.alphaChannels": "22.5",
    "PhotoshopSaveOptions.annotations": "22.5",
    "PhotoshopSaveOptions.embedColorProfile": "22.5",
    "PhotoshopSaveOptions.layers": "22.5",
    "PhotoshopSaveOptions.spotColor": "22.5",
    "PhotoshopSaveOptions.maximizeCompatibility": "22.5",
    "PhotoshopSaveOptions.typename": "22.5",
    "SolidColor": "23.0",
    "SolidColor.typename": "24.2",
    "SolidColor.rgb": "23.0",
    "SolidColor.cmyk": "23.0",
    "SolidColor.hsb": "23.0",
    "SolidColor.lab": "23.0",
    "SolidColor.gray": "23.0",
    "SolidColor.nearestWebColor": "23.0",
    "SolidColor.isEqual": "23.0",
    "SubPathInfo": "23.3",
    "SubPathInfo.closed": "23.3",
    "SubPathInfo.entireSubPath": "23.3",
    "SubPathInfo.operation": "23.3",
    "SubPathInfo.typename": "23.3",
    "TextFont": "23.0",
    "TextFont.family": "23.0",
    "TextFont.name": "23.0",
    "TextFont.parent": "23.0",
    "TextFont.postScriptName": "23.0",
    "TextFont.style": "23.0",
    "TextFont.typename": "23.0",
    "Tool": "23.0",
    "Tool.id": "23.0",
    "Tool.typename": "23.0",
    "Preferences": "24.0",
    "Preferences.typename": "24.0",
    "Preferences.general": "24.0",
    "Preferences.interface": "24.0",
    "Preferences.tools": "24.0",
    "Preferences.history": "24.0",
    "Preferences.fileHandling": "24.0",
    "Preferences.performance": "24.0",
    "Preferences.cursors": "24.0",
    "Preferences.transparencyAndGamut": "24.0",
    "Preferences.unitsAndRulers": "24.0",
    "Preferences.guidesGridsAndSlices": "24.0",
    "Preferences.type": "24.0",
    "Preferences.notifications": "26.11",
    "Preferences.enhancedControls": "27.11",
    "PreferencesCursors": "24.0",
    "PreferencesCursors.typename": "24.0",
    "PreferencesCursors.paintingCursors": "24.0",
    "PreferencesCursors.otherCursors": "24.0",
    "PreferencesEnhancedControls": "27.11",
    "PreferencesEnhancedControls.typename": "27.11",
    "PreferencesEnhancedControls.enableHapticFeedback": "27.11",
    "PreferencesEnhancedControls.activeHapticEvents": "27.11",
    "PreferencesFileHandling": "24.0",
    "PreferencesFileHandling.typename": "24.0",
    "PreferencesFileHandling.imagePreviews": "24.0",
    "PreferencesFileHandling.useLowerCaseExtension": "24.0",
    "PreferencesFileHandling.askBeforeSavingLayeredTIFF": "24.0",
    "PreferencesFileHandling.maximizeCompatibility": "24.0",
    "PreferencesFileHandling.recentFileListMaximum": "24.0",
    "PreferencesGeneral": "24.0",
    "PreferencesGeneral.typename": "24.0",
    "PreferencesGeneral.colorPicker": "24.0",
    "PreferencesGeneral.imageInterpolation": "24.0",
    "PreferencesGeneral.exportClipboard": "24.0",
    "PreferencesGeneral.autoUpdateOpenDocuments": "24.0",
    "PreferencesGeneral.beepWhenDone": "24.0",
    "ColorPickerOption": "24.0",
    "ColorPickerOption.type": "24.0",
    "ColorPickerOption.pluginID": "24.0",
    "PreferencesGuidesGridsAndSlices": "24.0",
    "PreferencesGuidesGridsAndSlices.typename": "24.0",
    "PreferencesGuidesGridsAndSlices.guideStyle": "24.0",
    "PreferencesGuidesGridsAndSlices.gridStyle": "24.0",
    "PreferencesGuidesGridsAndSlices.gridSubDivisions": "24.0",
    "PreferencesGuidesGridsAndSlices.showSliceNumber": "24.0",
    "PreferencesHistory": "24.0",
    "PreferencesHistory.typename": "24.0",
    "PreferencesHistory.createFirstSnapshot": "24.0",
    "PreferencesHistory.nonLinearHistory": "24.0",
    "PreferencesHistory.numberOfHistoryStates": "24.0",
    "PreferencesHistory.useHistoryLog": "24.0",
    "PreferencesHistory.editLogItems": "24.0",
    "PreferencesHistory.saveLogItems": "24.0",
    "PreferencesInterface": "24.0",
    "PreferencesInterface.typename": "24.0",
    "PreferencesInterface.dynamicColorSliders": "24.0",
    "PreferencesInterface.textFontSize": "24.0",
    "PreferencesInterface.colorChannelsInColor": "24.0",
    "PreferencesNotifications": "26.11",
    "PreferencesNotifications.typename": "26.11",
    "PreferencesNotifications.showToolTips": "26.11",
    "PreferencesNotifications.quietMode": "26.11",
    "PreferencesNotifications.useRichToolTips": "26.11",
    "PreferencesNotifications.showWhatsNew": "26.11",
    "PreferencesNotifications.showFeatureOnboarding": "26.11",
    "PreferencesPerformance": "24.0",
    "PreferencesPerformance.typename": "24.0",
    "PreferencesPerformance.imageCacheLevels": "24.0",
    "PreferencesPerformance.maxRAMuse": "24.0",
    "PreferencesTools": "24.0",
    "PreferencesTools.typename": "24.0",
    "PreferencesTools.showToolTips": "24.0",
    "PreferencesTools.useShiftKeyForToolSwitch": "24.0",
    "PreferencesTools.keyboardZoomResizesWindows": "24.0",
    "PreferencesTransparencyAndGamut": "24.0",
    "PreferencesTransparencyAndGamut.typename": "24.0",
    "PreferencesTransparencyAndGamut.gridSize": "24.0",
    "PreferencesTransparencyAndGamut.gamutWarningOpacity": "24.0",
    "PreferencesType": "24.0",
    "PreferencesType.typename": "24.0",
    "PreferencesType.showTextFeatures": "24.0",
    "PreferencesType.showEnglishFontNames": "24.0",
    "PreferencesType.smartQuotes": "24.0",
    "PreferencesUnitsAndRulers": "24.0",
    "PreferencesUnitsAndRulers.typename": "24.0",
    "PreferencesUnitsAndRulers.rulerUnits": "24.0",
    "PreferencesUnitsAndRulers.typeUnits": "24.0",
    "PreferencesUnitsAndRulers.pointSize": "24.0",
    "CharacterStyle": "24.1",
    "CharacterStyle.font": "24.1",
    "CharacterStyle.size": "24.1",
    "CharacterStyle.horizontalScale": "24.1",
    "CharacterStyle.verticalScale": "24.1",
    "CharacterStyle.fauxBold": "24.1",
    "CharacterStyle.fauxItalic": "24.1",
    "CharacterStyle.useAutoLeading": "24.1",
    "CharacterStyle.leading": "24.1",
    "CharacterStyle.tracking": "24.1",
    "CharacterStyle.baselineShift": "24.1",
    "CharacterStyle.horizontalDiacriticPosition": "24.1",
    "CharacterStyle.verticalDiacriticPosition": "24.1",
    "CharacterStyle.autoKerning": "24.1",
    "CharacterStyle.capitalization": "24.1",
    "CharacterStyle.baseline": "24.1",
    "CharacterStyle.strikeThrough": "24.1",
    "CharacterStyle.underline": "24.1",
    "CharacterStyle.ligatures": "24.1",
    "CharacterStyle.alternateLigatures": "24.1",
    "CharacterStyle.fractions": "24.1",
    "CharacterStyle.ordinals": "24.1",
    "CharacterStyle.swash": "24.1",
    "CharacterStyle.titlingAlternates": "24.1",
    "CharacterStyle.stylisticAlternates": "24.1",
    "CharacterStyle.language": "24.1",
    "CharacterStyle.characterAlignment": "24.1",
    "CharacterStyle.noBreak": "24.1",
    "CharacterStyle.color": "24.1",
    "CharacterStyle.kashidas": "24.1",
    "CharacterStyle.middleEasternTextDirection": "24.1",
    "CharacterStyle.middleEasternDigitsType": "24.1",
    "CharacterStyle.fractionalWidths": "24.1",
    "CharacterStyle.antiAliasMethod": "24.1",
    "CharacterStyle.reset": "24.1",
    "ParagraphStyle": "24.1",
    "ParagraphStyle.justification": "24.1",
    "ParagraphStyle.justificationFeatures": "24.1",
    "ParagraphStyle.leftIndent": "24.1",
    "ParagraphStyle.rightIndent": "24.1",
    "ParagraphStyle.firstLineIndent": "24.1",
    "ParagraphStyle.spaceBefore": "24.1",
    "ParagraphStyle.kashidaWidth": "24.1",
    "ParagraphStyle.kinsoku": "24.1",
    "ParagraphStyle.mojikumi": "24.1",
    "ParagraphStyle.spaceAfter": "24.1",
    "ParagraphStyle.hyphenation": "24.1",
    "ParagraphStyle.hyphenationFeatures": "24.1",
    "ParagraphStyle.layoutMode": "24.1",
    "ParagraphStyle.features": "24.1",
    "ParagraphStyle.reset": "24.1",
    "WarpStyle": "24.1",
    "WarpStyle.style": "24.1",
    "WarpStyle.direction": "24.1",
    "WarpStyle.bend": "24.1",
    "WarpStyle.horizontalDistortion": "24.1",
    "WarpStyle.verticalDistortion": "24.1",
    "WarpStyle.reset": "24.1",
    "ApplyImageSource": "24.5",
    "ApplyImageSource.document": "24.5",
    "ApplyImageSource.layer": "24.5",
    "ApplyImageSource.channel": "24.5",
    "ApplyImageSource.invert": "24.5",
    "ApplyImageOptions": "24.5",
    "ApplyImageOptions.source": "24.5",
    "ApplyImageOptions.blending": "24.5",
    "ApplyImageOptions.opacity": "24.5",
    "ApplyImageOptions.preserveTransparency": "24.5",
    "ApplyImageOptions.mask": "24.5",
    "CalculationsSource": "24.5",
    "CalculationsSource.document": "24.5",
    "CalculationsSource.layer": "24.5",
    "CalculationsSource.channel": "24.5",
    "CalculationsSource.invert": "24.5",
    "CalculationsOptions": "24.5",
    "CalculationsOptions.source1": "24.5",
    "CalculationsOptions.source2": "24.5",
    "CalculationsOptions.blending": "24.5",
    "CalculationsOptions.opacity": "24.5",
    "CalculationsOptions.mask": "24.5",
    "CalculationsOptions.result": "24.5",
    "DocumentCreateOptions": "22.5",
    "DocumentCreateOptions.name": "22.5",
    "DocumentCreateOptions.preset": "22.5",
    "DocumentCreateOptions.presetJSON": "22.5",
    "DocumentCreateOptions.mode": "22.5",
    "DocumentCreateOptions.width": "22.5",
    "DocumentCreateOptions.height": "22.5",
    "DocumentCreateOptions.resolution": "22.5",
    "DocumentCreateOptions.fill": "22.5",
    "DocumentCreateOptions.fillColor": "23.0",
    "DocumentCreateOptions.depth": "22.5",
    "DocumentCreateOptions.pixelScaleFactor": "22.5",
    "DocumentCreateOptions.profile": "22.5",
    "Position": "NA",
    "Position.x": "NA",
    "Position.y": "NA",
    "SimpleBounds": "NA",
    "SimpleBounds.bottom": "NA",
    "SimpleBounds.left": "NA",
    "SimpleBounds.right": "NA",
    "SimpleBounds.top": "NA",
    "Dimensions": "NA",
    "Dimensions.horizontal": "NA",
    "Dimensions.vertical": "NA",
    "LayerCompCreateOptions.name": "24.0",
    "LayerCompCreateOptions.comment": "24.0",
    "LayerCompCreateOptions.visibility": "24.0",
    "LayerCompCreateOptions.position": "24.0",
    "LayerCompCreateOptions.appearance": "24.0",
    "LayerCompCreateOptions.childComp": "24.0",
    "LayerCompRecaptureOptions": "24.0",
    "LayerCompRecaptureOptions.visibility": "24.0",
    "LayerCompRecaptureOptions.position": "24.0",
    "LayerCompRecaptureOptions.appearance": "24.0",
    "LayerCompRecaptureOptions.childComp": "24.0",
    "LayerCreateOptionsBase.name": "22.5",
    "LayerCreateOptionsBase.group": "22.5",
    "LayerCreateOptionsBase.color": "22.5",
    "LayerCreateOptionsBase.opacity": "22.5",
    "LayerCreateOptionsBase.mode": "22.5",
    "LayerCreateOptionsBase.blendMode": "22.5",
    "PixelLayerCreateOptions": "22.5",
    "PixelLayerCreateOptions.fillNeutral": "22.5",
    "TextLayerCreateOptions": "24.2",
    "TextLayerCreateOptions.contents": "24.2",
    "TextLayerCreateOptions.position": "24.2",
    "TextLayerCreateOptions.bounds": "27.4",
    "TextLayerCreateOptions.textColor": "24.2",
    "TextLayerCreateOptions.fontSize": "24.2",
    "TextLayerCreateOptions.fontName": "24.2",
    "GroupLayerCreateOptions": "22.5",
    "GroupLayerCreateOptions.name": "22.5",
    "GroupLayerCreateOptions.fromLayers": "22.5",
    "JustificationProperties": "24.1",
    "JustificationProperties.autoLeadingAmount": "24.1",
    "JustificationProperties.wordSpacingMinimum": "24.1",
    "JustificationProperties.wordSpacingDesired": "24.1",
    "JustificationProperties.wordSpacingMaximum": "24.1",
    "JustificationProperties.letterSpacingMinimum": "24.1",
    "JustificationProperties.letterSpacingDesired": "24.1",
    "JustificationProperties.letterSpacingMaximum": "24.1",
    "JustificationProperties.glyphScalingMinimum": "24.1",
    "JustificationProperties.glyphScalingDesired": "24.1",
    "JustificationProperties.glyphScalingMaximum": "24.1",
    "HyphenationProperties": "24.1",
    "HyphenationProperties.wordsLongerThan": "24.1",
    "HyphenationProperties.afterFirst": "24.1",
    "HyphenationProperties.beforeLast": "24.1",
    "HyphenationProperties.limit": "24.1",
    "HyphenationProperties.zone": "24.1",
    "HyphenationProperties.capitalWords": "24.1"
  }
};
var photoshop_min_versions_default = photoshopMinVersions;

// src/data/curated-since.ts
var CURATED_SINCE = {
  // "UXP v6.5.0 — New: getEntryWithUrl in LocalFileProvider" (UXP changelog); forum 8224 reports it missing in PS 23.3
  "uxp.storage.localFileSystem.getEntryWithUrl": { since: "6.5.0", source: SOURCES.uxpChangelog },
  // UXP changelog 8.0.1 — New: "Support for Navigator.language API"
  "navigator.language": { since: "8.0.1", source: SOURCES.uxpChangelog },
  // Photoshop changelog, UXP 8.2.0: filesystem stream support.
  "fs.createReadStream": { since: "8.2.0", source: "https://developer.adobe.com/photoshop/uxp/ps_reference/changelog/" },
  "uxp.storage.fs.createReadStream": { since: "8.2.0", source: "https://developer.adobe.com/photoshop/uxp/ps_reference/changelog/" }
};

// src/rules/api-min-version.ts
var GLOBALS = uxp_since_default.globals;
var MEMBERS = uxp_since_default.members;
var PS = photoshop_min_versions_default.members;
var PS_ROOTS = { core: "photoshopCore", action: "photoshopAction", imaging: "imaging", app: "Photoshop" };
var DOM_MEMBERS = /* @__PURE__ */ new Set(["replaceChildren", "setPointerCapture", "releasePointerCapture", "hasPointerCapture"]);
var DOCS_BASE2 = "https://github.com/AdobeDocs/uxp/blob/main/";
var PS_DOC_FLOOR = "23.0";
var PS_CONFIRMED_EARLY = /* @__PURE__ */ new Set(["executeAsModal", "suspendHistory"]);
var api_min_version_default = createRule({
  name: "api-min-version",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow UXP and Photoshop APIs that are newer than the manifest's host.minVersion",
      recommended: true,
      sources: ["@types/photoshop @minVersion tags", "AdobeDocs/uxp reference-js **Since** lines", "jardicc/vscode-uxp-validator host\u2192UXP table", SOURCES.psChangelog, SOURCES.uxpChangelog, SOURCES.forum8224]
    },
    schema: [{ type: "object", properties: { typeAware: { type: "boolean" }, checkDomMembers: { type: "boolean" } }, additionalProperties: false }],
    messages: {
      hostTooOld: "`{{api}}` needs {{host}} {{required}}+ ({{source}}), but manifest host.minVersion is {{min}}. Raise minVersion or feature-detect it.",
      uxpTooOld: "`{{api}}` needs UXP {{required}}+ ({{source}}), but host.minVersion {{min}} ships UXP {{uxp}}. Raise minVersion or feature-detect it."
    }
  },
  defaultOptions: [{ typeAware: true, checkDomMembers: true }],
  create(context, [opts]) {
    const uxp = getUxp(context);
    if (!uxp.hostMinVersion && !uxp.uxpVersion) return {};
    const sourceCode = context.sourceCode;
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["uxp", "photoshop", "fs"]));
    const members = [];
    const idents = [];
    const done = /* @__PURE__ */ new Set();
    const services = sourceCode.parserServices ?? {};
    const checker = opts.typeAware !== false && services.program && services.esTreeNodeToTSNodeMap ? services.program.getTypeChecker() : null;
    const guarded = (node, text) => {
      if (isOptionalUse(node)) return true;
      const par = node.parent;
      if (node.type === "MemberExpression" && node.object.type === "Identifier" && BROWSER_GLOBAL_OBJECTS.has(node.object.name) && !(par?.type === "CallExpression" && par.callee === node) && !(par?.type === "NewExpression" && par.callee === node) && !(par?.type === "MemberExpression" && par.object === node)) return true;
      for (let p = node.parent; p; p = p.parent) {
        const test = p.type === "IfStatement" || p.type === "ConditionalExpression" ? p.test : p.type === "LogicalExpression" ? p.left : null;
        if (test && node.range[0] >= test.range[0] && node.range[1] <= test.range[1]) return true;
        if (test && test !== node && sourceCode.getText(test).includes(text)) return true;
        if (p.type === "TryStatement" && p.block && node.range[0] >= p.block.range[0] && node.range[1] <= p.block.range[1]) return true;
      }
      return false;
    };
    const reportHost = (node, api, required, source) => {
      const last = api.split(".").pop();
      if (!uxp.hostMinVersion || !isOlder(uxp.hostMinVersion, required) || guarded(node, last)) return;
      if (compareVersions(required, PS_DOC_FLOOR) <= 0 && !PS_CONFIRMED_EARLY.has(last)) return;
      done.add(node);
      context.report({ node, messageId: "hostTooOld", data: { api, required, host: uxp.host ?? "host", min: uxp.hostMinVersion, source } });
    };
    const reportUxp = (node, api, required, doc) => {
      if (!uxp.uxpVersion || !isOlder(uxp.uxpVersion, required) || guarded(node, api.split(".").pop()) || done.has(node)) return;
      done.add(node);
      context.report({ node, messageId: "uxpTooOld", data: { api, required, uxp: uxp.uxpVersion, min: uxp.hostMinVersion ?? "(settings.uxp.uxpVersion)", source: /^https?:/.test(doc) ? doc : DOCS_BASE2 + doc.replace(/ /g, "%20") } });
    };
    const checkPhotoshopPath = (node, resolved) => {
      if (uxp.host !== "PS") return;
      const parts = resolved.split(".");
      if (parts[0] !== "photoshop" || parts.length < 2) return;
      const owner = PS_ROOTS[parts[1]];
      if (!owner) return;
      if (parts.length === 2 && node.parent?.type === "MemberExpression" && node.parent.object === node) return;
      const key = parts.length === 2 ? owner === "imaging" ? "imaging" : null : `${owner}.${parts[2]}`;
      if (key && PS[key]) reportHost(node, parts.slice(1, 3).join("."), PS[key], "@types/photoshop @minVersion");
    };
    const checkTypeAware = (node) => {
      if (!checker || uxp.host !== "PS" || done.has(node)) return;
      const tsNode = services.esTreeNodeToTSNodeMap.get(node.property);
      if (!tsNode) return;
      const sym = checker.getSymbolAtLocation(tsNode);
      const decl = sym?.declarations?.[0];
      if (!sym || !decl || !/[\\/](@types[\\/]photoshop|photoshop)[\\/]/.test(decl.getSourceFile().fileName)) return;
      const tag = sym.getJsDocTags(checker).find((t) => t.name === "minVersion");
      const text = tag?.text?.map((t) => t.text).join("").trim();
      if (text && /^\d/.test(text)) reportHost(node, sourceCode.getText(node).replace(/\s+/g, ""), text, "typed @minVersion");
    };
    return mergeVisitors(tracker.visitors(), {
      MemberExpression(node) {
        members.push(node);
      },
      Identifier(node) {
        const p = node.parent;
        if (!p) return;
        if (p.type === "MemberExpression" && p.property === node && !p.computed) return;
        if (p.type === "Property" && p.parent?.type === "ObjectPattern") return;
        if (p.type === "ArrayPattern" || p.type === "RestElement" || p.type === "AssignmentPattern" && p.left === node) return;
        if (p.type === "Property" && p.key === node && !p.computed || p.type === "ImportSpecifier" || p.type === "ImportDefaultSpecifier" || p.type === "ImportNamespaceSpecifier") return;
        if (p.type === "VariableDeclarator" && p.id === node) return;
        if (p.type.startsWith("TS") && p.type !== "TSAsExpression" && p.type !== "TSNonNullExpression") return;
        idents.push(node);
      },
      "Program:exit"() {
        tracker.finalize();
        for (const n of idents) {
          const bound = tracker.resolve(n);
          if (bound) {
            if (GLOBALS[bound]) reportUxp(n, bound, GLOBALS[bound].since, GLOBALS[bound].doc);
            continue;
          }
          if (!GLOBALS[n.name] || !isGlobalReference(sourceCode, n)) continue;
          if (n.parent?.type === "Property" && n.parent.parent.type === "ObjectPattern") continue;
          const g = GLOBALS[n.name];
          reportUxp(n, n.name, g.since, g.doc);
        }
        for (const n of members) {
          const resolved = tracker.resolve(n);
          if (resolved) {
            if (resolved.startsWith("photoshop.")) checkPhotoshopPath(n, resolved);
            else if (GLOBALS[resolved]) reportUxp(n, resolved, GLOBALS[resolved].since, GLOBALS[resolved].doc);
            else if (CURATED_SINCE[resolved]) reportUxp(n, resolved.replace(/^uxp\.storage\./, ""), CURATED_SINCE[resolved].since, CURATED_SINCE[resolved].source);
          } else {
            const raw = memberPath(n);
            const path = raw ? stripGlobal(raw) : null;
            if (path && raw !== path && GLOBALS[path]) reportUxp(n, path, GLOBALS[path].since, GLOBALS[path].doc);
            let root = n;
            while (root.type === "MemberExpression") root = root.object;
            if (path && CURATED_SINCE[path] && root.type === "Identifier" && isGlobalReference(sourceCode, root)) reportUxp(n, path, CURATED_SINCE[path].since, CURATED_SINCE[path].source);
            const m = path?.match(/^navigator\.clipboard\.(\w+)$/);
            if (m && MEMBERS[`clipboard.${m[1]}`]) reportUxp(n, path, MEMBERS[`clipboard.${m[1]}`].since, MEMBERS[`clipboard.${m[1]}`].doc);
            const prop = propertyName(n);
            if (opts.checkDomMembers !== false && prop && DOM_MEMBERS.has(prop) && n.parent?.type === "CallExpression" && n.parent.callee === n) {
              const e = MEMBERS[`Element.${prop}`];
              if (e) reportUxp(n.property, `Element.${prop}`, e.since, e.doc);
            }
          }
          checkTypeAware(n);
        }
      }
    });
  }
});

// src/data/generated/css.ts
var css = {
  "$source": {
    "repo": "https://github.com/jardicc/vscode-uxp-validator",
    "file": "server/src/CssService/data/uxpCustomData.ts",
    "commit": "2711fb98fbb11a2c12792b9435284591bddbc7ff",
    "license": "MIT (c) Jaroslav Bereza; based on @vscode/web-custom-data (MIT, Microsoft)",
    "semantics": "value = minimum UXP version; an item absent from a category is not supported by UXP",
    "adobeDocs": {
      "repo": "https://github.com/AdobeDocs/uxp",
      "dir": "src/pages/uxp-api/reference-css",
      "commit": "f04f65e02065b4cd8c78d9d26bcba2ccf6943c58",
      "note": "items added from Adobe docs carry from:'adobe-docs'"
    }
  },
  "properties": {
    "align-content": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "center": "3.0",
        "flex-end": "3.0",
        "flex-start": "3.0",
        "space-around": "3.0",
        "space-between": "3.0",
        "stretch": "3.0"
      }
    },
    "align-items": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "center": "3.0",
        "flex-end": "3.0",
        "flex-start": "3.0",
        "stretch": "3.0"
      }
    },
    "align-self": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "center": "3.0",
        "flex-end": "3.0",
        "flex-start": "3.0",
        "stretch": "3.0"
      }
    },
    "background": {
      "since": "2.0",
      "restrictions": [
        "enum",
        "image",
        "color",
        "position",
        "length",
        "repeat",
        "percentage",
        "box"
      ],
      "values": {
        "fixed": "2.0",
        "local": "2.0",
        "none": "2.0",
        "scroll": "2.0",
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "background-attachment": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "scroll": "3.0"
      }
    },
    "background-color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "background-image": {
      "since": "2.0",
      "restrictions": [
        "image",
        "enum"
      ],
      "values": {
        "none": "2.0"
      }
    },
    "background-repeat": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "no-repeat": "3.0"
      }
    },
    "background-size": {
      "since": "3.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "contain": "3.0",
        "cover": "3.0"
      }
    },
    "border": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width",
        "line-style",
        "color"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0",
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-bottom": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width",
        "line-style",
        "color"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0",
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-bottom-color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-bottom-left-radius": {
      "since": "3.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "border-bottom-right-radius": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "border-bottom-style": {
      "since": "2.0",
      "restrictions": [
        "line-style"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0"
      }
    },
    "border-bottom-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width"
      ]
    },
    "border-color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-left": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width",
        "line-style",
        "color"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0",
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-left-color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-left-style": {
      "since": "2.0",
      "restrictions": [
        "line-style"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0"
      }
    },
    "border-left-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width"
      ]
    },
    "border-radius": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "border-right": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width",
        "line-style",
        "color"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0",
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-right-color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-right-style": {
      "since": "2.0",
      "restrictions": [
        "line-style"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0"
      }
    },
    "border-right-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width"
      ]
    },
    "border-style": {
      "since": "2.0",
      "restrictions": [
        "line-style"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0"
      }
    },
    "border-top": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width",
        "line-style",
        "color"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0"
      }
    },
    "border-top-color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "border-top-left-radius": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "border-top-style": {
      "since": "2.0",
      "restrictions": [
        "line-style"
      ],
      "values": {
        "none": "2.0",
        "solid": "2.0",
        "dashed": "2.0"
      }
    },
    "border-top-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width"
      ]
    },
    "border-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "line-width"
      ]
    },
    "bottom": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "color": {
      "since": "2.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "2.0",
        "aliceblue": "2.0",
        "antiquewhite": "2.0",
        "aqua": "2.0",
        "aquamarine": "2.0",
        "azure": "2.0",
        "beige": "2.0",
        "bisque": "2.0",
        "black": "2.0",
        "blanchedalmond": "2.0",
        "blue": "2.0",
        "blueviolet": "2.0",
        "brown": "2.0",
        "burlywood": "2.0",
        "cadetblue": "2.0",
        "chartreuse": "2.0",
        "chocolate": "2.0",
        "coral": "2.0",
        "cornflowerblue": "2.0",
        "cornsilk": "2.0",
        "crimson": "2.0",
        "cyan": "2.0",
        "darkblue": "2.0",
        "darkcyan": "2.0",
        "darkgoldenrod": "2.0",
        "darkgray": "2.0",
        "darkgrey": "2.0",
        "darkgreen": "2.0",
        "darkkhaki": "2.0",
        "darkmagenta": "2.0",
        "darkolivegreen": "2.0",
        "darkorange": "2.0",
        "darkorchid": "2.0",
        "darkred": "2.0",
        "darksalmon": "2.0",
        "darkseagreen": "2.0",
        "darkslateblue": "2.0",
        "darkslategray": "2.0",
        "darkslategrey": "2.0",
        "darkturquoise": "2.0",
        "darkviolet": "2.0",
        "deeppink": "2.0",
        "deepskyblue": "2.0",
        "dimgray": "2.0",
        "dimgrey": "2.0",
        "dodgerblue": "2.0",
        "firebrick": "2.0",
        "floralwhite": "2.0",
        "forestgreen": "2.0",
        "fuchsia": "2.0",
        "gainsboro": "2.0",
        "ghostwhite": "2.0",
        "gold": "2.0",
        "goldenrod": "2.0",
        "gray": "2.0",
        "grey": "2.0",
        "green": "2.0",
        "greenyellow": "2.0",
        "honeydew": "2.0",
        "hotpink": "2.0",
        "indianred": "2.0",
        "indigo": "2.0",
        "ivory": "2.0",
        "khaki": "2.0",
        "lavender": "2.0",
        "lavenderblush": "2.0",
        "lawngreen": "2.0",
        "lemonchiffon": "2.0",
        "lightblue": "2.0",
        "lightcoral": "2.0",
        "lightcyan": "2.0",
        "lightgoldenrodyellow": "2.0",
        "lightgray": "2.0",
        "lightgrey": "2.0",
        "lightgreen": "2.0",
        "lightpink": "2.0",
        "lightsalmon": "2.0",
        "lightseagreen": "2.0",
        "lightskyblue": "2.0",
        "lightslategray": "2.0",
        "lightslategrey": "2.0",
        "lightsteelblue": "2.0",
        "lightyellow": "2.0",
        "lime": "2.0",
        "limegreen": "2.0",
        "linen": "2.0",
        "magenta": "2.0",
        "maroon": "2.0",
        "mediumaquamarine": "2.0",
        "mediumblue": "2.0",
        "mediumorchid": "2.0",
        "mediumpurple": "2.0",
        "mediumseagreen": "2.0",
        "mediumslateblue": "2.0",
        "mediumspringgreen": "2.0",
        "mediumturquoise": "2.0",
        "mediumvioletred": "2.0",
        "midnightblue": "2.0",
        "mintcream": "2.0",
        "mistyrose": "2.0",
        "moccasin": "2.0",
        "navajowhite": "2.0",
        "navy": "2.0",
        "oldlace": "2.0",
        "olive": "2.0",
        "olivedrab": "2.0",
        "orange": "2.0",
        "orangered": "2.0",
        "orchid": "2.0",
        "palegoldenrod": "2.0",
        "palegreen": "2.0",
        "paleturquoise": "2.0",
        "palevioletred": "2.0",
        "papayawhip": "2.0",
        "peachpuff": "2.0",
        "peru": "2.0",
        "pink": "2.0",
        "plum": "2.0",
        "powderblue": "2.0",
        "purple": "2.0",
        "red": "2.0",
        "rebeccapurple": "2.0",
        "rosybrown": "2.0",
        "royalblue": "2.0",
        "saddlebrown": "2.0",
        "salmon": "2.0",
        "sandybrown": "2.0",
        "seagreen": "2.0",
        "seashell": "2.0",
        "sienna": "2.0",
        "silver": "2.0",
        "skyblue": "2.0",
        "slateblue": "2.0",
        "slategray": "2.0",
        "slategrey": "2.0",
        "snow": "2.0",
        "springgreen": "2.0",
        "steelblue": "2.0",
        "tan": "2.0",
        "teal": "2.0",
        "thistle": "2.0",
        "tomato": "2.0",
        "turquoise": "2.0",
        "violet": "2.0",
        "wheat": "2.0",
        "white": "2.0",
        "whitesmoke": "2.0",
        "yellow": "2.0",
        "yellowgreen": "2.0"
      }
    },
    "display": {
      "since": "2.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "block": "2.0",
        "flex": "3.0",
        "inline": "2.0",
        "inline-block": "2.0",
        "inline-flex": "3.0",
        "none": "2.0"
      }
    },
    "flex": {
      "since": "3.0",
      "restrictions": [
        "length",
        "number",
        "percentage"
      ],
      "values": {
        "auto": "3.0",
        "content": "3.0",
        "none": "3.0"
      }
    },
    "flex-basis": {
      "since": "3.0",
      "restrictions": [
        "length",
        "number",
        "percentage"
      ],
      "values": {
        "auto": "3.0",
        "content": "3.0"
      }
    },
    "flex-direction": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "column": "3.0",
        "column-reverse": "3.0",
        "row": "3.0",
        "row-reverse": "3.0"
      }
    },
    "flex-grow": {
      "since": "3.0",
      "restrictions": [
        "number"
      ]
    },
    "flex-shrink": {
      "since": "3.0",
      "restrictions": [
        "number"
      ]
    },
    "flex-wrap": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "nowrap": "3.0",
        "wrap": "3.0"
      }
    },
    "font-family": {
      "since": "2.0",
      "restrictions": [
        "font"
      ]
    },
    "font-size": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "large": "2.0",
        "larger": "2.0",
        "medium": "2.0",
        "small": "2.0",
        "smaller": "2.0",
        "x-large": "2.0",
        "x-small": "2.0",
        "xx-large": "2.0",
        "xx-small": "2.0"
      }
    },
    "font-style": {
      "since": "2.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "italic": "2.0",
        "normal": "2.0"
      }
    },
    "font-weight": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "50": "3.0",
        "100": "3.0",
        "200": "3.0",
        "300": "3.0",
        "400": "3.0",
        "500": "3.0",
        "550": "3.0",
        "600": "3.0",
        "700": "3.0",
        "800": "3.0",
        "850": "3.0",
        "900": "3.0",
        "950": "3.0",
        "1000": "3.0",
        "bold": "3.0",
        "bolder": "3.0",
        "lighter": "3.0",
        "normal": "3.0"
      }
    },
    "height": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0",
        "fit-content": "3.0",
        "max-content": "3.0",
        "min-content": "3.0"
      }
    },
    "justify-content": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "center": "3.0",
        "stretch": "3.0",
        "flex-end": "3.0",
        "flex-start": "3.0",
        "space-around": "3.0",
        "space-between": "3.0"
      }
    },
    "left": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "letter-spacing": {
      "since": "2.0",
      "restrictions": [
        "length"
      ],
      "values": {
        "normal": "2.0"
      }
    },
    "margin": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "margin-bottom": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "margin-left": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "margin-right": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "margin-top": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "max-height": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "none": "2.0",
        "fit-content": "3.0",
        "max-content": "3.0",
        "min-content": "3.0"
      }
    },
    "max-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "none": "2.0",
        "fit-content": "3.0",
        "max-content": "3.0",
        "min-content": "3.0"
      }
    },
    "min-height": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "3.0",
        "fit-content": "3.0",
        "max-content": "3.0",
        "min-content": "3.0"
      }
    },
    "min-width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "3.0",
        "fit-content": "3.0",
        "max-content": "3.0",
        "min-content": "3.0"
      }
    },
    "opacity": {
      "since": "2.0",
      "restrictions": [
        "number(0-1)"
      ]
    },
    "overflow": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "hidden": "3.0",
        "scroll": "3.0",
        "visible": "3.0"
      }
    },
    "overflow-x": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "hidden": "3.0",
        "scroll": "3.0",
        "visible": "3.0"
      }
    },
    "overflow-y": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "hidden": "3.0",
        "scroll": "3.0",
        "visible": "3.0"
      }
    },
    "padding": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "padding-bottom": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "padding-left": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "padding-right": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "padding-top": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "right": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "text-align": {
      "since": "3.0",
      "restrictions": [
        "string"
      ],
      "values": {
        "center": "3.0",
        "left": "3.0",
        "right": "3.0"
      }
    },
    "text-overflow": {
      "since": "3.0",
      "restrictions": [
        "enum",
        "string"
      ],
      "values": {
        "clip": "3.0",
        "ellipsis": "3.0"
      }
    },
    "top": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0"
      }
    },
    "visibility": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "hidden": "3.0",
        "visible": "3.0"
      }
    },
    "width": {
      "since": "2.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "auto": "2.0",
        "fit-content": "3.0",
        "max-content": "3.0",
        "min-content": "3.0"
      }
    },
    "white-space": {
      "since": "3.0",
      "values": {
        "normal": "3.0",
        "pre": "3.0",
        "nowrap": "3.0",
        "pre-wrap": "3.0",
        "pre-line": "3.0"
      }
    },
    "appearance": {
      "since": "3.0"
    },
    "background-blend-mode": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "normal": "3.0",
        "multiply": "3.0",
        "screen": "3.0",
        "overlay": "3.0",
        "darken": "3.0",
        "lighten": "3.0",
        "color-dodge": "3.0",
        "color-burn": "3.0",
        "hard-light": "3.0",
        "soft-light": "3.0",
        "difference": "3.0",
        "exclusion": "3.0",
        "hue": "3.0",
        "saturation": "3.0",
        "color": "3.0",
        "luminosity": "3.0"
      }
    },
    "background-clip": {
      "since": "3.0",
      "restrictions": [
        "box"
      ]
    },
    "background-origin": {
      "since": "3.0",
      "restrictions": [
        "box"
      ]
    },
    "background-position-x": {
      "since": "3.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "center": "3.0",
        "left": "3.0",
        "right": "3.0"
      }
    },
    "background-position-y": {
      "since": "3.0",
      "restrictions": [
        "length",
        "percentage"
      ],
      "values": {
        "bottom": "3.0",
        "center": "3.0",
        "top": "3.0"
      }
    },
    "border-collapse": {
      "since": "5.6",
      "restrictions": [
        "enum"
      ],
      "values": {
        "collapse": "5.6",
        "separate": "5.6"
      }
    },
    "border-spacing": {
      "since": "5.6",
      "restrictions": [
        "length"
      ]
    },
    "border-top-right-radius": {
      "since": "3.0",
      "restrictions": [
        "length",
        "percentage"
      ]
    },
    "content": {
      "since": "3.0",
      "restrictions": [
        "string",
        "url"
      ],
      "values": {
        "icon": "3.0",
        "none": "3.0",
        "normal": "3.0"
      }
    },
    "cursor": {
      "since": "3.0",
      "restrictions": [
        "url",
        "number",
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "crosshair": "3.0",
        "default": "3.0",
        "ew-resize": "3.0",
        "grab": "3.0",
        "grabbing": "3.0",
        "move": "3.0",
        "nesw-resize": "3.0",
        "not-allowed": "3.0",
        "ns-resize": "3.0",
        "nwse-resize": "3.0",
        "pointer": "3.0",
        "text": "3.0",
        "zoom-in": "3.0",
        "zoom-out": "3.0"
      }
    },
    "fill": {
      "since": "3.0",
      "restrictions": [
        "color",
        "enum",
        "url"
      ],
      "values": {
        "none": "3.0",
        "transparent": "3.0",
        "aliceblue": "3.0",
        "antiquewhite": "3.0",
        "aqua": "3.0",
        "aquamarine": "3.0",
        "azure": "3.0",
        "beige": "3.0",
        "bisque": "3.0",
        "black": "3.0",
        "blanchedalmond": "3.0",
        "blue": "3.0",
        "blueviolet": "3.0",
        "brown": "3.0",
        "burlywood": "3.0",
        "cadetblue": "3.0",
        "chartreuse": "3.0",
        "chocolate": "3.0",
        "coral": "3.0",
        "cornflowerblue": "3.0",
        "cornsilk": "3.0",
        "crimson": "3.0",
        "cyan": "3.0",
        "darkblue": "3.0",
        "darkcyan": "3.0",
        "darkgoldenrod": "3.0",
        "darkgray": "3.0",
        "darkgrey": "3.0",
        "darkgreen": "3.0",
        "darkkhaki": "3.0",
        "darkmagenta": "3.0",
        "darkolivegreen": "3.0",
        "darkorange": "3.0",
        "darkorchid": "3.0",
        "darkred": "3.0",
        "darksalmon": "3.0",
        "darkseagreen": "3.0",
        "darkslateblue": "3.0",
        "darkslategray": "3.0",
        "darkslategrey": "3.0",
        "darkturquoise": "3.0",
        "darkviolet": "3.0",
        "deeppink": "3.0",
        "deepskyblue": "3.0",
        "dimgray": "3.0",
        "dimgrey": "3.0",
        "dodgerblue": "3.0",
        "firebrick": "3.0",
        "floralwhite": "3.0",
        "forestgreen": "3.0",
        "fuchsia": "3.0",
        "gainsboro": "3.0",
        "ghostwhite": "3.0",
        "gold": "3.0",
        "goldenrod": "3.0",
        "gray": "3.0",
        "grey": "3.0",
        "green": "3.0",
        "greenyellow": "3.0",
        "honeydew": "3.0",
        "hotpink": "3.0",
        "indianred": "3.0",
        "indigo": "3.0",
        "ivory": "3.0",
        "khaki": "3.0",
        "lavender": "3.0",
        "lavenderblush": "3.0",
        "lawngreen": "3.0",
        "lemonchiffon": "3.0",
        "lightblue": "3.0",
        "lightcoral": "3.0",
        "lightcyan": "3.0",
        "lightgoldenrodyellow": "3.0",
        "lightgray": "3.0",
        "lightgrey": "3.0",
        "lightgreen": "3.0",
        "lightpink": "3.0",
        "lightsalmon": "3.0",
        "lightseagreen": "3.0",
        "lightskyblue": "3.0",
        "lightslategray": "3.0",
        "lightslategrey": "3.0",
        "lightsteelblue": "3.0",
        "lightyellow": "3.0",
        "lime": "3.0",
        "limegreen": "3.0",
        "linen": "3.0",
        "magenta": "3.0",
        "maroon": "3.0",
        "mediumaquamarine": "3.0",
        "mediumblue": "3.0",
        "mediumorchid": "3.0",
        "mediumpurple": "3.0",
        "mediumseagreen": "3.0",
        "mediumslateblue": "3.0",
        "mediumspringgreen": "3.0",
        "mediumturquoise": "3.0",
        "mediumvioletred": "3.0",
        "midnightblue": "3.0",
        "mintcream": "3.0",
        "mistyrose": "3.0",
        "moccasin": "3.0",
        "navajowhite": "3.0",
        "navy": "3.0",
        "oldlace": "3.0",
        "olive": "3.0",
        "olivedrab": "3.0",
        "orange": "3.0",
        "orangered": "3.0",
        "orchid": "3.0",
        "palegoldenrod": "3.0",
        "palegreen": "3.0",
        "paleturquoise": "3.0",
        "palevioletred": "3.0",
        "papayawhip": "3.0",
        "peachpuff": "3.0",
        "peru": "3.0",
        "pink": "3.0",
        "plum": "3.0",
        "powderblue": "3.0",
        "purple": "3.0",
        "red": "3.0",
        "rebeccapurple": "3.0",
        "rosybrown": "3.0",
        "royalblue": "3.0",
        "saddlebrown": "3.0",
        "salmon": "3.0",
        "sandybrown": "3.0",
        "seagreen": "3.0",
        "seashell": "3.0",
        "sienna": "3.0",
        "silver": "3.0",
        "skyblue": "3.0",
        "slateblue": "3.0",
        "slategray": "3.0",
        "slategrey": "3.0",
        "snow": "3.0",
        "springgreen": "3.0",
        "steelblue": "3.0",
        "tan": "3.0",
        "teal": "3.0",
        "thistle": "3.0",
        "tomato": "3.0",
        "turquoise": "3.0",
        "violet": "3.0",
        "wheat": "3.0",
        "white": "3.0",
        "whitesmoke": "3.0",
        "yellow": "3.0",
        "yellowgreen": "3.0"
      }
    },
    "fill-opacity": {
      "since": "3.0",
      "restrictions": [
        "number(0-1)"
      ]
    },
    "flex-flow": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "column": "3.0",
        "column-reverse": "3.0",
        "nowrap": "3.0",
        "row": "3.0",
        "row-reverse": "3.0",
        "wrap": "3.0",
        "wrap-reverse": "3.0"
      }
    },
    "isolation": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "isolate": "3.0"
      }
    },
    "line-clamp": {
      "since": "4.5"
    },
    "line-height": {
      "since": "3.0",
      "restrictions": [
        "number",
        "length",
        "percentage"
      ],
      "values": {
        "normal": "3.0"
      }
    },
    "object-fit": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "contain": "3.0",
        "cover": "3.0",
        "fill": "3.0",
        "none": "3.0",
        "scale-down": "3.0"
      }
    },
    "object-position": {
      "since": "3.0",
      "restrictions": [
        "position",
        "length",
        "percentage"
      ]
    },
    "order": {
      "since": "3.0",
      "restrictions": [
        "integer"
      ]
    },
    "outline": {
      "since": "3.0",
      "restrictions": [
        "length",
        "line-width",
        "line-style",
        "color",
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "invert": "3.0",
        "none": "3.0",
        "solid": "3.0",
        "dashed": "3.0",
        "transparent": "3.0",
        "aliceblue": "3.0",
        "antiquewhite": "3.0",
        "aqua": "3.0",
        "aquamarine": "3.0",
        "azure": "3.0",
        "beige": "3.0",
        "bisque": "3.0",
        "black": "3.0",
        "blanchedalmond": "3.0",
        "blue": "3.0",
        "blueviolet": "3.0",
        "brown": "3.0",
        "burlywood": "3.0",
        "cadetblue": "3.0",
        "chartreuse": "3.0",
        "chocolate": "3.0",
        "coral": "3.0",
        "cornflowerblue": "3.0",
        "cornsilk": "3.0",
        "crimson": "3.0",
        "cyan": "3.0",
        "darkblue": "3.0",
        "darkcyan": "3.0",
        "darkgoldenrod": "3.0",
        "darkgray": "3.0",
        "darkgrey": "3.0",
        "darkgreen": "3.0",
        "darkkhaki": "3.0",
        "darkmagenta": "3.0",
        "darkolivegreen": "3.0",
        "darkorange": "3.0",
        "darkorchid": "3.0",
        "darkred": "3.0",
        "darksalmon": "3.0",
        "darkseagreen": "3.0",
        "darkslateblue": "3.0",
        "darkslategray": "3.0",
        "darkslategrey": "3.0",
        "darkturquoise": "3.0",
        "darkviolet": "3.0",
        "deeppink": "3.0",
        "deepskyblue": "3.0",
        "dimgray": "3.0",
        "dimgrey": "3.0",
        "dodgerblue": "3.0",
        "firebrick": "3.0",
        "floralwhite": "3.0",
        "forestgreen": "3.0",
        "fuchsia": "3.0",
        "gainsboro": "3.0",
        "ghostwhite": "3.0",
        "gold": "3.0",
        "goldenrod": "3.0",
        "gray": "3.0",
        "grey": "3.0",
        "green": "3.0",
        "greenyellow": "3.0",
        "honeydew": "3.0",
        "hotpink": "3.0",
        "indianred": "3.0",
        "indigo": "3.0",
        "ivory": "3.0",
        "khaki": "3.0",
        "lavender": "3.0",
        "lavenderblush": "3.0",
        "lawngreen": "3.0",
        "lemonchiffon": "3.0",
        "lightblue": "3.0",
        "lightcoral": "3.0",
        "lightcyan": "3.0",
        "lightgoldenrodyellow": "3.0",
        "lightgray": "3.0",
        "lightgrey": "3.0",
        "lightgreen": "3.0",
        "lightpink": "3.0",
        "lightsalmon": "3.0",
        "lightseagreen": "3.0",
        "lightskyblue": "3.0",
        "lightslategray": "3.0",
        "lightslategrey": "3.0",
        "lightsteelblue": "3.0",
        "lightyellow": "3.0",
        "lime": "3.0",
        "limegreen": "3.0",
        "linen": "3.0",
        "magenta": "3.0",
        "maroon": "3.0",
        "mediumaquamarine": "3.0",
        "mediumblue": "3.0",
        "mediumorchid": "3.0",
        "mediumpurple": "3.0",
        "mediumseagreen": "3.0",
        "mediumslateblue": "3.0",
        "mediumspringgreen": "3.0",
        "mediumturquoise": "3.0",
        "mediumvioletred": "3.0",
        "midnightblue": "3.0",
        "mintcream": "3.0",
        "mistyrose": "3.0",
        "moccasin": "3.0",
        "navajowhite": "3.0",
        "navy": "3.0",
        "oldlace": "3.0",
        "olive": "3.0",
        "olivedrab": "3.0",
        "orange": "3.0",
        "orangered": "3.0",
        "orchid": "3.0",
        "palegoldenrod": "3.0",
        "palegreen": "3.0",
        "paleturquoise": "3.0",
        "palevioletred": "3.0",
        "papayawhip": "3.0",
        "peachpuff": "3.0",
        "peru": "3.0",
        "pink": "3.0",
        "plum": "3.0",
        "powderblue": "3.0",
        "purple": "3.0",
        "red": "3.0",
        "rebeccapurple": "3.0",
        "rosybrown": "3.0",
        "royalblue": "3.0",
        "saddlebrown": "3.0",
        "salmon": "3.0",
        "sandybrown": "3.0",
        "seagreen": "3.0",
        "seashell": "3.0",
        "sienna": "3.0",
        "silver": "3.0",
        "skyblue": "3.0",
        "slateblue": "3.0",
        "slategray": "3.0",
        "slategrey": "3.0",
        "snow": "3.0",
        "springgreen": "3.0",
        "steelblue": "3.0",
        "tan": "3.0",
        "teal": "3.0",
        "thistle": "3.0",
        "tomato": "3.0",
        "turquoise": "3.0",
        "violet": "3.0",
        "wheat": "3.0",
        "white": "3.0",
        "whitesmoke": "3.0",
        "yellow": "3.0",
        "yellowgreen": "3.0"
      }
    },
    "outline-color": {
      "since": "3.0",
      "restrictions": [
        "enum",
        "color"
      ],
      "values": {
        "invert": "3.0",
        "transparent": "3.0",
        "aliceblue": "3.0",
        "antiquewhite": "3.0",
        "aqua": "3.0",
        "aquamarine": "3.0",
        "azure": "3.0",
        "beige": "3.0",
        "bisque": "3.0",
        "black": "3.0",
        "blanchedalmond": "3.0",
        "blue": "3.0",
        "blueviolet": "3.0",
        "brown": "3.0",
        "burlywood": "3.0",
        "cadetblue": "3.0",
        "chartreuse": "3.0",
        "chocolate": "3.0",
        "coral": "3.0",
        "cornflowerblue": "3.0",
        "cornsilk": "3.0",
        "crimson": "3.0",
        "cyan": "3.0",
        "darkblue": "3.0",
        "darkcyan": "3.0",
        "darkgoldenrod": "3.0",
        "darkgray": "3.0",
        "darkgrey": "3.0",
        "darkgreen": "3.0",
        "darkkhaki": "3.0",
        "darkmagenta": "3.0",
        "darkolivegreen": "3.0",
        "darkorange": "3.0",
        "darkorchid": "3.0",
        "darkred": "3.0",
        "darksalmon": "3.0",
        "darkseagreen": "3.0",
        "darkslateblue": "3.0",
        "darkslategray": "3.0",
        "darkslategrey": "3.0",
        "darkturquoise": "3.0",
        "darkviolet": "3.0",
        "deeppink": "3.0",
        "deepskyblue": "3.0",
        "dimgray": "3.0",
        "dimgrey": "3.0",
        "dodgerblue": "3.0",
        "firebrick": "3.0",
        "floralwhite": "3.0",
        "forestgreen": "3.0",
        "fuchsia": "3.0",
        "gainsboro": "3.0",
        "ghostwhite": "3.0",
        "gold": "3.0",
        "goldenrod": "3.0",
        "gray": "3.0",
        "grey": "3.0",
        "green": "3.0",
        "greenyellow": "3.0",
        "honeydew": "3.0",
        "hotpink": "3.0",
        "indianred": "3.0",
        "indigo": "3.0",
        "ivory": "3.0",
        "khaki": "3.0",
        "lavender": "3.0",
        "lavenderblush": "3.0",
        "lawngreen": "3.0",
        "lemonchiffon": "3.0",
        "lightblue": "3.0",
        "lightcoral": "3.0",
        "lightcyan": "3.0",
        "lightgoldenrodyellow": "3.0",
        "lightgray": "3.0",
        "lightgrey": "3.0",
        "lightgreen": "3.0",
        "lightpink": "3.0",
        "lightsalmon": "3.0",
        "lightseagreen": "3.0",
        "lightskyblue": "3.0",
        "lightslategray": "3.0",
        "lightslategrey": "3.0",
        "lightsteelblue": "3.0",
        "lightyellow": "3.0",
        "lime": "3.0",
        "limegreen": "3.0",
        "linen": "3.0",
        "magenta": "3.0",
        "maroon": "3.0",
        "mediumaquamarine": "3.0",
        "mediumblue": "3.0",
        "mediumorchid": "3.0",
        "mediumpurple": "3.0",
        "mediumseagreen": "3.0",
        "mediumslateblue": "3.0",
        "mediumspringgreen": "3.0",
        "mediumturquoise": "3.0",
        "mediumvioletred": "3.0",
        "midnightblue": "3.0",
        "mintcream": "3.0",
        "mistyrose": "3.0",
        "moccasin": "3.0",
        "navajowhite": "3.0",
        "navy": "3.0",
        "oldlace": "3.0",
        "olive": "3.0",
        "olivedrab": "3.0",
        "orange": "3.0",
        "orangered": "3.0",
        "orchid": "3.0",
        "palegoldenrod": "3.0",
        "palegreen": "3.0",
        "paleturquoise": "3.0",
        "palevioletred": "3.0",
        "papayawhip": "3.0",
        "peachpuff": "3.0",
        "peru": "3.0",
        "pink": "3.0",
        "plum": "3.0",
        "powderblue": "3.0",
        "purple": "3.0",
        "red": "3.0",
        "rebeccapurple": "3.0",
        "rosybrown": "3.0",
        "royalblue": "3.0",
        "saddlebrown": "3.0",
        "salmon": "3.0",
        "sandybrown": "3.0",
        "seagreen": "3.0",
        "seashell": "3.0",
        "sienna": "3.0",
        "silver": "3.0",
        "skyblue": "3.0",
        "slateblue": "3.0",
        "slategray": "3.0",
        "slategrey": "3.0",
        "snow": "3.0",
        "springgreen": "3.0",
        "steelblue": "3.0",
        "tan": "3.0",
        "teal": "3.0",
        "thistle": "3.0",
        "tomato": "3.0",
        "turquoise": "3.0",
        "violet": "3.0",
        "wheat": "3.0",
        "white": "3.0",
        "whitesmoke": "3.0",
        "yellow": "3.0",
        "yellowgreen": "3.0"
      }
    },
    "outline-offset": {
      "since": "3.0",
      "restrictions": [
        "length"
      ]
    },
    "outline-style": {
      "since": "3.0",
      "restrictions": [
        "line-style",
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "none": "3.0",
        "solid": "3.0",
        "dashed": "3.0"
      }
    },
    "outline-width": {
      "since": "3.0",
      "restrictions": [
        "length",
        "line-width"
      ]
    },
    "pointer-events": {
      "since": "7.2",
      "restrictions": [
        "enum"
      ],
      "values": {
        "none": "7.2",
        "auto": "7.2"
      }
    },
    "position": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "absolute": "3.0",
        "fixed": "3.0",
        "-ms-page": "3.0",
        "relative": "3.0",
        "static": "3.0",
        "sticky": "3.0",
        "-webkit-sticky": "3.0"
      }
    },
    "stroke": {
      "since": "3.0",
      "restrictions": [
        "color",
        "enum",
        "url"
      ],
      "values": {
        "none": "3.0",
        "transparent": "3.0",
        "aliceblue": "3.0",
        "antiquewhite": "3.0",
        "aqua": "3.0",
        "aquamarine": "3.0",
        "azure": "3.0",
        "beige": "3.0",
        "bisque": "3.0",
        "black": "3.0",
        "blanchedalmond": "3.0",
        "blue": "3.0",
        "blueviolet": "3.0",
        "brown": "3.0",
        "burlywood": "3.0",
        "cadetblue": "3.0",
        "chartreuse": "3.0",
        "chocolate": "3.0",
        "coral": "3.0",
        "cornflowerblue": "3.0",
        "cornsilk": "3.0",
        "crimson": "3.0",
        "cyan": "3.0",
        "darkblue": "3.0",
        "darkcyan": "3.0",
        "darkgoldenrod": "3.0",
        "darkgray": "3.0",
        "darkgrey": "3.0",
        "darkgreen": "3.0",
        "darkkhaki": "3.0",
        "darkmagenta": "3.0",
        "darkolivegreen": "3.0",
        "darkorange": "3.0",
        "darkorchid": "3.0",
        "darkred": "3.0",
        "darksalmon": "3.0",
        "darkseagreen": "3.0",
        "darkslateblue": "3.0",
        "darkslategray": "3.0",
        "darkslategrey": "3.0",
        "darkturquoise": "3.0",
        "darkviolet": "3.0",
        "deeppink": "3.0",
        "deepskyblue": "3.0",
        "dimgray": "3.0",
        "dimgrey": "3.0",
        "dodgerblue": "3.0",
        "firebrick": "3.0",
        "floralwhite": "3.0",
        "forestgreen": "3.0",
        "fuchsia": "3.0",
        "gainsboro": "3.0",
        "ghostwhite": "3.0",
        "gold": "3.0",
        "goldenrod": "3.0",
        "gray": "3.0",
        "grey": "3.0",
        "green": "3.0",
        "greenyellow": "3.0",
        "honeydew": "3.0",
        "hotpink": "3.0",
        "indianred": "3.0",
        "indigo": "3.0",
        "ivory": "3.0",
        "khaki": "3.0",
        "lavender": "3.0",
        "lavenderblush": "3.0",
        "lawngreen": "3.0",
        "lemonchiffon": "3.0",
        "lightblue": "3.0",
        "lightcoral": "3.0",
        "lightcyan": "3.0",
        "lightgoldenrodyellow": "3.0",
        "lightgray": "3.0",
        "lightgrey": "3.0",
        "lightgreen": "3.0",
        "lightpink": "3.0",
        "lightsalmon": "3.0",
        "lightseagreen": "3.0",
        "lightskyblue": "3.0",
        "lightslategray": "3.0",
        "lightslategrey": "3.0",
        "lightsteelblue": "3.0",
        "lightyellow": "3.0",
        "lime": "3.0",
        "limegreen": "3.0",
        "linen": "3.0",
        "magenta": "3.0",
        "maroon": "3.0",
        "mediumaquamarine": "3.0",
        "mediumblue": "3.0",
        "mediumorchid": "3.0",
        "mediumpurple": "3.0",
        "mediumseagreen": "3.0",
        "mediumslateblue": "3.0",
        "mediumspringgreen": "3.0",
        "mediumturquoise": "3.0",
        "mediumvioletred": "3.0",
        "midnightblue": "3.0",
        "mintcream": "3.0",
        "mistyrose": "3.0",
        "moccasin": "3.0",
        "navajowhite": "3.0",
        "navy": "3.0",
        "oldlace": "3.0",
        "olive": "3.0",
        "olivedrab": "3.0",
        "orange": "3.0",
        "orangered": "3.0",
        "orchid": "3.0",
        "palegoldenrod": "3.0",
        "palegreen": "3.0",
        "paleturquoise": "3.0",
        "palevioletred": "3.0",
        "papayawhip": "3.0",
        "peachpuff": "3.0",
        "peru": "3.0",
        "pink": "3.0",
        "plum": "3.0",
        "powderblue": "3.0",
        "purple": "3.0",
        "red": "3.0",
        "rebeccapurple": "3.0",
        "rosybrown": "3.0",
        "royalblue": "3.0",
        "saddlebrown": "3.0",
        "salmon": "3.0",
        "sandybrown": "3.0",
        "seagreen": "3.0",
        "seashell": "3.0",
        "sienna": "3.0",
        "silver": "3.0",
        "skyblue": "3.0",
        "slateblue": "3.0",
        "slategray": "3.0",
        "slategrey": "3.0",
        "snow": "3.0",
        "springgreen": "3.0",
        "steelblue": "3.0",
        "tan": "3.0",
        "teal": "3.0",
        "thistle": "3.0",
        "tomato": "3.0",
        "turquoise": "3.0",
        "violet": "3.0",
        "wheat": "3.0",
        "white": "3.0",
        "whitesmoke": "3.0",
        "yellow": "3.0",
        "yellowgreen": "3.0"
      }
    },
    "stroke-opacity": {
      "since": "3.0",
      "restrictions": [
        "number(0-1)"
      ]
    },
    "stroke-width": {
      "since": "3.0",
      "restrictions": [
        "percentage",
        "length"
      ]
    },
    "table-layout": {
      "since": "5.6",
      "restrictions": [
        "enum"
      ],
      "values": {
        "auto": "5.6",
        "fixed": "5.6"
      }
    },
    "text-decoration": {
      "since": "3.0",
      "restrictions": [
        "enum",
        "color"
      ],
      "values": {
        "dashed": "3.0",
        "dotted": "3.0",
        "double": "3.0",
        "line-through": "3.0",
        "none": "3.0",
        "overline": "3.0",
        "solid": "3.0",
        "underline": "3.0",
        "wavy": "3.0",
        "transparent": "3.0",
        "aliceblue": "3.0",
        "antiquewhite": "3.0",
        "aqua": "3.0",
        "aquamarine": "3.0",
        "azure": "3.0",
        "beige": "3.0",
        "bisque": "3.0",
        "black": "3.0",
        "blanchedalmond": "3.0",
        "blue": "3.0",
        "blueviolet": "3.0",
        "brown": "3.0",
        "burlywood": "3.0",
        "cadetblue": "3.0",
        "chartreuse": "3.0",
        "chocolate": "3.0",
        "coral": "3.0",
        "cornflowerblue": "3.0",
        "cornsilk": "3.0",
        "crimson": "3.0",
        "cyan": "3.0",
        "darkblue": "3.0",
        "darkcyan": "3.0",
        "darkgoldenrod": "3.0",
        "darkgray": "3.0",
        "darkgrey": "3.0",
        "darkgreen": "3.0",
        "darkkhaki": "3.0",
        "darkmagenta": "3.0",
        "darkolivegreen": "3.0",
        "darkorange": "3.0",
        "darkorchid": "3.0",
        "darkred": "3.0",
        "darksalmon": "3.0",
        "darkseagreen": "3.0",
        "darkslateblue": "3.0",
        "darkslategray": "3.0",
        "darkslategrey": "3.0",
        "darkturquoise": "3.0",
        "darkviolet": "3.0",
        "deeppink": "3.0",
        "deepskyblue": "3.0",
        "dimgray": "3.0",
        "dimgrey": "3.0",
        "dodgerblue": "3.0",
        "firebrick": "3.0",
        "floralwhite": "3.0",
        "forestgreen": "3.0",
        "fuchsia": "3.0",
        "gainsboro": "3.0",
        "ghostwhite": "3.0",
        "gold": "3.0",
        "goldenrod": "3.0",
        "gray": "3.0",
        "grey": "3.0",
        "green": "3.0",
        "greenyellow": "3.0",
        "honeydew": "3.0",
        "hotpink": "3.0",
        "indianred": "3.0",
        "indigo": "3.0",
        "ivory": "3.0",
        "khaki": "3.0",
        "lavender": "3.0",
        "lavenderblush": "3.0",
        "lawngreen": "3.0",
        "lemonchiffon": "3.0",
        "lightblue": "3.0",
        "lightcoral": "3.0",
        "lightcyan": "3.0",
        "lightgoldenrodyellow": "3.0",
        "lightgray": "3.0",
        "lightgrey": "3.0",
        "lightgreen": "3.0",
        "lightpink": "3.0",
        "lightsalmon": "3.0",
        "lightseagreen": "3.0",
        "lightskyblue": "3.0",
        "lightslategray": "3.0",
        "lightslategrey": "3.0",
        "lightsteelblue": "3.0",
        "lightyellow": "3.0",
        "lime": "3.0",
        "limegreen": "3.0",
        "linen": "3.0",
        "magenta": "3.0",
        "maroon": "3.0",
        "mediumaquamarine": "3.0",
        "mediumblue": "3.0",
        "mediumorchid": "3.0",
        "mediumpurple": "3.0",
        "mediumseagreen": "3.0",
        "mediumslateblue": "3.0",
        "mediumspringgreen": "3.0",
        "mediumturquoise": "3.0",
        "mediumvioletred": "3.0",
        "midnightblue": "3.0",
        "mintcream": "3.0",
        "mistyrose": "3.0",
        "moccasin": "3.0",
        "navajowhite": "3.0",
        "navy": "3.0",
        "oldlace": "3.0",
        "olive": "3.0",
        "olivedrab": "3.0",
        "orange": "3.0",
        "orangered": "3.0",
        "orchid": "3.0",
        "palegoldenrod": "3.0",
        "palegreen": "3.0",
        "paleturquoise": "3.0",
        "palevioletred": "3.0",
        "papayawhip": "3.0",
        "peachpuff": "3.0",
        "peru": "3.0",
        "pink": "3.0",
        "plum": "3.0",
        "powderblue": "3.0",
        "purple": "3.0",
        "red": "3.0",
        "rebeccapurple": "3.0",
        "rosybrown": "3.0",
        "royalblue": "3.0",
        "saddlebrown": "3.0",
        "salmon": "3.0",
        "sandybrown": "3.0",
        "seagreen": "3.0",
        "seashell": "3.0",
        "sienna": "3.0",
        "silver": "3.0",
        "skyblue": "3.0",
        "slateblue": "3.0",
        "slategray": "3.0",
        "slategrey": "3.0",
        "snow": "3.0",
        "springgreen": "3.0",
        "steelblue": "3.0",
        "tan": "3.0",
        "teal": "3.0",
        "thistle": "3.0",
        "tomato": "3.0",
        "turquoise": "3.0",
        "violet": "3.0",
        "wheat": "3.0",
        "white": "3.0",
        "whitesmoke": "3.0",
        "yellow": "3.0",
        "yellowgreen": "3.0"
      }
    },
    "text-decoration-color": {
      "since": "3.0",
      "restrictions": [
        "color"
      ],
      "values": {
        "transparent": "3.0",
        "aliceblue": "3.0",
        "antiquewhite": "3.0",
        "aqua": "3.0",
        "aquamarine": "3.0",
        "azure": "3.0",
        "beige": "3.0",
        "bisque": "3.0",
        "black": "3.0",
        "blanchedalmond": "3.0",
        "blue": "3.0",
        "blueviolet": "3.0",
        "brown": "3.0",
        "burlywood": "3.0",
        "cadetblue": "3.0",
        "chartreuse": "3.0",
        "chocolate": "3.0",
        "coral": "3.0",
        "cornflowerblue": "3.0",
        "cornsilk": "3.0",
        "crimson": "3.0",
        "cyan": "3.0",
        "darkblue": "3.0",
        "darkcyan": "3.0",
        "darkgoldenrod": "3.0",
        "darkgray": "3.0",
        "darkgrey": "3.0",
        "darkgreen": "3.0",
        "darkkhaki": "3.0",
        "darkmagenta": "3.0",
        "darkolivegreen": "3.0",
        "darkorange": "3.0",
        "darkorchid": "3.0",
        "darkred": "3.0",
        "darksalmon": "3.0",
        "darkseagreen": "3.0",
        "darkslateblue": "3.0",
        "darkslategray": "3.0",
        "darkslategrey": "3.0",
        "darkturquoise": "3.0",
        "darkviolet": "3.0",
        "deeppink": "3.0",
        "deepskyblue": "3.0",
        "dimgray": "3.0",
        "dimgrey": "3.0",
        "dodgerblue": "3.0",
        "firebrick": "3.0",
        "floralwhite": "3.0",
        "forestgreen": "3.0",
        "fuchsia": "3.0",
        "gainsboro": "3.0",
        "ghostwhite": "3.0",
        "gold": "3.0",
        "goldenrod": "3.0",
        "gray": "3.0",
        "grey": "3.0",
        "green": "3.0",
        "greenyellow": "3.0",
        "honeydew": "3.0",
        "hotpink": "3.0",
        "indianred": "3.0",
        "indigo": "3.0",
        "ivory": "3.0",
        "khaki": "3.0",
        "lavender": "3.0",
        "lavenderblush": "3.0",
        "lawngreen": "3.0",
        "lemonchiffon": "3.0",
        "lightblue": "3.0",
        "lightcoral": "3.0",
        "lightcyan": "3.0",
        "lightgoldenrodyellow": "3.0",
        "lightgray": "3.0",
        "lightgrey": "3.0",
        "lightgreen": "3.0",
        "lightpink": "3.0",
        "lightsalmon": "3.0",
        "lightseagreen": "3.0",
        "lightskyblue": "3.0",
        "lightslategray": "3.0",
        "lightslategrey": "3.0",
        "lightsteelblue": "3.0",
        "lightyellow": "3.0",
        "lime": "3.0",
        "limegreen": "3.0",
        "linen": "3.0",
        "magenta": "3.0",
        "maroon": "3.0",
        "mediumaquamarine": "3.0",
        "mediumblue": "3.0",
        "mediumorchid": "3.0",
        "mediumpurple": "3.0",
        "mediumseagreen": "3.0",
        "mediumslateblue": "3.0",
        "mediumspringgreen": "3.0",
        "mediumturquoise": "3.0",
        "mediumvioletred": "3.0",
        "midnightblue": "3.0",
        "mintcream": "3.0",
        "mistyrose": "3.0",
        "moccasin": "3.0",
        "navajowhite": "3.0",
        "navy": "3.0",
        "oldlace": "3.0",
        "olive": "3.0",
        "olivedrab": "3.0",
        "orange": "3.0",
        "orangered": "3.0",
        "orchid": "3.0",
        "palegoldenrod": "3.0",
        "palegreen": "3.0",
        "paleturquoise": "3.0",
        "palevioletred": "3.0",
        "papayawhip": "3.0",
        "peachpuff": "3.0",
        "peru": "3.0",
        "pink": "3.0",
        "plum": "3.0",
        "powderblue": "3.0",
        "purple": "3.0",
        "red": "3.0",
        "rebeccapurple": "3.0",
        "rosybrown": "3.0",
        "royalblue": "3.0",
        "saddlebrown": "3.0",
        "salmon": "3.0",
        "sandybrown": "3.0",
        "seagreen": "3.0",
        "seashell": "3.0",
        "sienna": "3.0",
        "silver": "3.0",
        "skyblue": "3.0",
        "slateblue": "3.0",
        "slategray": "3.0",
        "slategrey": "3.0",
        "snow": "3.0",
        "springgreen": "3.0",
        "steelblue": "3.0",
        "tan": "3.0",
        "teal": "3.0",
        "thistle": "3.0",
        "tomato": "3.0",
        "turquoise": "3.0",
        "violet": "3.0",
        "wheat": "3.0",
        "white": "3.0",
        "whitesmoke": "3.0",
        "yellow": "3.0",
        "yellowgreen": "3.0"
      }
    },
    "text-decoration-line": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "line-through": "3.0",
        "none": "3.0",
        "overline": "3.0",
        "underline": "3.0"
      }
    },
    "text-decoration-style": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "dashed": "3.0",
        "dotted": "3.0",
        "double": "3.0",
        "none": "3.0",
        "solid": "3.0",
        "wavy": "3.0"
      }
    },
    "touch-action": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "auto": "3.0",
        "cross-slide-x": "3.0",
        "cross-slide-y": "3.0",
        "double-tap-zoom": "3.0",
        "manipulation": "3.0",
        "none": "3.0",
        "pan-x": "3.0",
        "pan-y": "3.0",
        "pinch-zoom": "3.0"
      }
    },
    "transform": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "none": "3.0"
      }
    },
    "transform-origin": {
      "since": "8.0.1",
      "restrictions": [
        "position",
        "length",
        "percentage"
      ],
      "values": {
        "left": "8.0.1",
        "center": "8.0.1",
        "right": "8.0.1",
        "top": "8.0.1",
        "bottom": "8.0.1"
      }
    },
    "translate": {
      "since": "8.0.1"
    },
    "vertical-align": {
      "since": "3.0",
      "restrictions": [
        "percentage",
        "length"
      ],
      "values": {
        "auto": "3.0",
        "baseline": "3.0",
        "bottom": "3.0",
        "middle": "3.0",
        "sub": "3.0",
        "super": "3.0",
        "text-bottom": "3.0",
        "text-top": "3.0",
        "top": "3.0",
        "-webkit-baseline-middle": "3.0"
      }
    },
    "word-break": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "break-all": "3.0",
        "keep-all": "3.0",
        "normal": "3.0"
      }
    },
    "writing-mode": {
      "since": "3.0",
      "restrictions": [
        "enum"
      ],
      "values": {
        "horizontal-tb": "3.0",
        "sideways-lr": "3.0",
        "sideways-rl": "3.0",
        "vertical-lr": "3.0",
        "vertical-rl": "3.0"
      }
    },
    "z-index": {
      "since": "3.0",
      "restrictions": [
        "integer"
      ],
      "values": {
        "auto": "3.0"
      }
    },
    "box-shadow": {
      "since": "7.3",
      "restrictions": [
        "length",
        "color",
        "enum"
      ],
      "values": {
        "none": "7.3",
        "transparent": "7.3",
        "aliceblue": "7.3",
        "antiquewhite": "7.3",
        "aqua": "7.3",
        "aquamarine": "7.3",
        "azure": "7.3",
        "beige": "7.3",
        "bisque": "7.3",
        "black": "7.3",
        "blanchedalmond": "7.3",
        "blue": "7.3",
        "blueviolet": "7.3",
        "brown": "7.3",
        "burlywood": "7.3",
        "cadetblue": "7.3",
        "chartreuse": "7.3",
        "chocolate": "7.3",
        "coral": "7.3",
        "cornflowerblue": "7.3",
        "cornsilk": "7.3",
        "crimson": "7.3",
        "cyan": "7.3",
        "darkblue": "7.3",
        "darkcyan": "7.3",
        "darkgoldenrod": "7.3",
        "darkgray": "7.3",
        "darkgrey": "7.3",
        "darkgreen": "7.3",
        "darkkhaki": "7.3",
        "darkmagenta": "7.3",
        "darkolivegreen": "7.3",
        "darkorange": "7.3",
        "darkorchid": "7.3",
        "darkred": "7.3",
        "darksalmon": "7.3",
        "darkseagreen": "7.3",
        "darkslateblue": "7.3",
        "darkslategray": "7.3",
        "darkslategrey": "7.3",
        "darkturquoise": "7.3",
        "darkviolet": "7.3",
        "deeppink": "7.3",
        "deepskyblue": "7.3",
        "dimgray": "7.3",
        "dimgrey": "7.3",
        "dodgerblue": "7.3",
        "firebrick": "7.3",
        "floralwhite": "7.3",
        "forestgreen": "7.3",
        "fuchsia": "7.3",
        "gainsboro": "7.3",
        "ghostwhite": "7.3",
        "gold": "7.3",
        "goldenrod": "7.3",
        "gray": "7.3",
        "grey": "7.3",
        "green": "7.3",
        "greenyellow": "7.3",
        "honeydew": "7.3",
        "hotpink": "7.3",
        "indianred": "7.3",
        "indigo": "7.3",
        "ivory": "7.3",
        "khaki": "7.3",
        "lavender": "7.3",
        "lavenderblush": "7.3",
        "lawngreen": "7.3",
        "lemonchiffon": "7.3",
        "lightblue": "7.3",
        "lightcoral": "7.3",
        "lightcyan": "7.3",
        "lightgoldenrodyellow": "7.3",
        "lightgray": "7.3",
        "lightgrey": "7.3",
        "lightgreen": "7.3",
        "lightpink": "7.3",
        "lightsalmon": "7.3",
        "lightseagreen": "7.3",
        "lightskyblue": "7.3",
        "lightslategray": "7.3",
        "lightslategrey": "7.3",
        "lightsteelblue": "7.3",
        "lightyellow": "7.3",
        "lime": "7.3",
        "limegreen": "7.3",
        "linen": "7.3",
        "magenta": "7.3",
        "maroon": "7.3",
        "mediumaquamarine": "7.3",
        "mediumblue": "7.3",
        "mediumorchid": "7.3",
        "mediumpurple": "7.3",
        "mediumseagreen": "7.3",
        "mediumslateblue": "7.3",
        "mediumspringgreen": "7.3",
        "mediumturquoise": "7.3",
        "mediumvioletred": "7.3",
        "midnightblue": "7.3",
        "mintcream": "7.3",
        "mistyrose": "7.3",
        "moccasin": "7.3",
        "navajowhite": "7.3",
        "navy": "7.3",
        "oldlace": "7.3",
        "olive": "7.3",
        "olivedrab": "7.3",
        "orange": "7.3",
        "orangered": "7.3",
        "orchid": "7.3",
        "palegoldenrod": "7.3",
        "palegreen": "7.3",
        "paleturquoise": "7.3",
        "palevioletred": "7.3",
        "papayawhip": "7.3",
        "peachpuff": "7.3",
        "peru": "7.3",
        "pink": "7.3",
        "plum": "7.3",
        "powderblue": "7.3",
        "purple": "7.3",
        "red": "7.3",
        "rebeccapurple": "7.3",
        "rosybrown": "7.3",
        "royalblue": "7.3",
        "saddlebrown": "7.3",
        "salmon": "7.3",
        "sandybrown": "7.3",
        "seagreen": "7.3",
        "seashell": "7.3",
        "sienna": "7.3",
        "silver": "7.3",
        "skyblue": "7.3",
        "slateblue": "7.3",
        "slategray": "7.3",
        "slategrey": "7.3",
        "snow": "7.3",
        "springgreen": "7.3",
        "steelblue": "7.3",
        "tan": "7.3",
        "teal": "7.3",
        "thistle": "7.3",
        "tomato": "7.3",
        "turquoise": "7.3",
        "violet": "7.3",
        "wheat": "7.3",
        "white": "7.3",
        "whitesmoke": "7.3",
        "yellow": "7.3",
        "yellowgreen": "7.3"
      }
    }
  },
  "atDirectives": {
    "@media": {
      "since": "4.1"
    }
  },
  "pseudoClasses": {
    "active": {
      "since": "3.0"
    },
    "checked": {
      "since": "3.0"
    },
    "disabled": {
      "since": "3.0"
    },
    "empty": {
      "since": "3.0"
    },
    "enabled": {
      "since": "3.0"
    },
    "first-child": {
      "since": "3.0"
    },
    "focus": {
      "since": "3.0"
    },
    "hover": {
      "since": "3.0"
    },
    "last-child": {
      "since": "3.0"
    },
    "nth-child": {
      "since": "3.0"
    },
    "nth-last-child": {
      "since": "3.0"
    },
    "nth-last-of-type": {
      "since": "3.0"
    },
    "nth-of-type": {
      "since": "3.0"
    },
    "only-child": {
      "since": "3.0"
    },
    "root": {
      "since": "3.0"
    },
    "not": {
      "since": "4.3.2"
    },
    "defined": {
      "since": "6.0"
    }
  },
  "pseudoElements": {
    "after": {
      "since": "3.0"
    },
    "before": {
      "since": "3.0"
    },
    "slotted": {
      "since": "7.0"
    }
  },
  "mediaFeatures": {
    "height": {
      "since": "4.1"
    },
    "min-height": {
      "since": "4.1"
    },
    "max-height": {
      "since": "4.1"
    },
    "width": {
      "since": "4.1"
    },
    "min-width": {
      "since": "4.1"
    },
    "max-width": {
      "since": "4.1"
    },
    "prefers-color-scheme": {
      "since": "4.1"
    }
  },
  "units": {
    "em": {
      "since": "3.0"
    },
    "vh": {
      "since": "3.0"
    },
    "vw": {
      "since": "3.0"
    },
    "vmin": {
      "since": "3.0"
    },
    "vmax": {
      "since": "3.0"
    },
    "cm": {
      "since": "3.0"
    },
    "mm": {
      "since": "3.0"
    },
    "in": {
      "since": "3.0"
    },
    "pc": {
      "since": "3.0"
    },
    "pt": {
      "since": "3.0"
    },
    "px": {
      "since": "3.0"
    },
    "%": {
      "since": "3.0"
    },
    "deg": {
      "since": "3.0"
    },
    "grad": {
      "since": "3.0"
    },
    "rad": {
      "since": "3.0"
    },
    "turn": {
      "since": "3.0"
    },
    "rem": {
      "since": "3.0",
      "from": "adobe-docs",
      "doc": "reference-css/General/units.md"
    }
  },
  "functionNames": {
    "calc": {
      "since": "3.0"
    },
    "var": {
      "since": "3.0"
    },
    "rgb": {
      "since": "2.0"
    },
    "rgba": {
      "since": "2.0"
    },
    "hsl": {
      "since": "2.0"
    },
    "hsla": {
      "since": "2.0"
    },
    "linear-gradient": {
      "since": "3.0"
    },
    "radial-gradient": {
      "since": "3.0"
    },
    "scale": {
      "since": "8.0"
    },
    "rotate": {
      "since": "8.0"
    },
    "scaleX": {
      "since": "8.0.1"
    },
    "scaleY": {
      "since": "8.0.1"
    },
    "translate": {
      "since": "3.0"
    },
    "translateX": {
      "since": "3.0"
    },
    "translateY": {
      "since": "3.0"
    },
    "url": {
      "since": "2.0"
    }
  },
  "knownFunctionNames": [
    "translateX",
    "translateY",
    "translateZ",
    "translate",
    "translate3d",
    "rotateX",
    "rotateY",
    "rotateZ",
    "rotate",
    "rotate3d",
    "scaleX",
    "scaleY",
    "scaleZ",
    "scale",
    "scale3d",
    "skewX",
    "skewY",
    "skew",
    "matrix",
    "matrix3d",
    "perspective",
    "calc",
    "min",
    "max",
    "clamp",
    "round",
    "mod",
    "rem",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "atan2",
    "pow",
    "sqrt",
    "hypot",
    "log",
    "exp",
    "abs",
    "sign",
    "blur",
    "brightness",
    "contrast",
    "drop-shadow",
    "grayscale",
    "hue-rotate",
    "invert",
    "opacity",
    "saturate",
    "sepia",
    "rgb",
    "hsl",
    "hwb",
    "lch",
    "oklch",
    "lab",
    "oklab",
    "color",
    "color-mix",
    "color-contrast",
    "device-cmyk",
    "light-dark",
    "linear-gradient",
    "radial-gradient",
    "conic-gradient",
    "repeating-linear-gradient",
    "repeating-radial-gradient",
    "repeating-conic-gradient",
    "image",
    "image-set",
    "cross-fade",
    "element",
    "paint",
    "counter",
    "counters",
    "symbols",
    "circle",
    "ellipse",
    "inset",
    "rect",
    "xywh",
    "polygon",
    "path",
    "shape",
    "attr",
    "env",
    "var",
    "fit-content",
    "minmax",
    "repeat",
    "stylistic",
    "styleset",
    "character-variant",
    "swash",
    "ornaments",
    "annotation",
    "linear",
    "cubic-bezier",
    "steps",
    "scroll",
    "view",
    "anchor",
    "anchor-size",
    "url"
  ]
};
var css_default = css;

// src/util/css-data.ts
var data = css_default;
var knownFunctions = new Set(data.knownFunctionNames.map((f) => f.toLowerCase()));
var CSS_WIDE = /* @__PURE__ */ new Set(["inherit", "initial", "unset", "revert", "revert-layer"]);
function checkCss(category, name, uxpVersion) {
  const item = data[category]?.[name.toLowerCase()] ?? data[category]?.[name];
  if (!item) return { ok: false, reason: "unsupported" };
  if (uxpVersion && item.since && isOlder(uxpVersion, item.since)) return { ok: false, reason: "newer", since: item.since };
  return { ok: true };
}
function checkCssValue(property, value, uxpVersion) {
  const item = data.properties[property.toLowerCase()];
  if (!item?.values || CSS_WIDE.has(value.toLowerCase())) return { ok: true };
  if (!item.restrictions || item.restrictions.some((r2) => r2 !== "enum")) return { ok: true };
  const since = item.values[value.toLowerCase()];
  if (since === void 0) return { ok: false, reason: "unsupported" };
  if (uxpVersion && since && isOlder(uxpVersion, since)) return { ok: false, reason: "newer", since };
  return { ok: true };
}
function isKnownWebFunction(name) {
  return knownFunctions.has(name.toLowerCase()) || !!data.functionNames[name];
}
var MATCHES_UXP_DEFAULT = { "box-sizing": /* @__PURE__ */ new Set(["border-box", "inherit", "initial", "unset"]) };
function matchesUxpDefault(property, value) {
  if (!value) return false;
  return MATCHES_UXP_DEFAULT[property.toLowerCase()]?.has(value.trim().toLowerCase().replace(/\s*!important$/, "")) ?? false;
}

// src/rules/no-unsupported-css.ts
var BUILD_TIME_AT_RULES = /* @__PURE__ */ new Set(["tailwind", "apply", "layer", "config", "screen", "variants", "responsive", "theme", "source", "plugin", "utility", "custom-variant", "reference"]);
var CSS_NEXT = {
  "transform-origin": { group: "transformProperties", kind: "properties" },
  translate: { group: "transformProperties", kind: "properties" },
  scaleX: { group: "transformFunctions", kind: "functionNames" },
  scaleY: { group: "transformFunctions", kind: "functionNames" }
};
var no_unsupported_css_default = createRule({
  name: "no-unsupported-css",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow CSS properties, values, at-rules, pseudo selectors, units and functions that the target UXP version does not support (CSS files, via @eslint/css)",
      recommended: true,
      sources: ["jardicc/vscode-uxp-validator UXP CSS data (MIT)", SOURCES.knownIssues, "AdobeDocs/uxp reference-css", SOURCES.uxpChangelog, SOURCES.forum11310]
    },
    schema: [{ type: "object", properties: { ignore: { type: "array", items: { type: "string" } }, ignoreVendorPrefixed: { type: "boolean" }, checkValues: { type: "boolean" }, ignoreBuildTimeAtRules: { type: "boolean" } }, additionalProperties: false }],
    messages: {
      unsupported: "{{kind}} `{{name}}` is not supported by UXP{{target}}.",
      newer: "{{kind}} `{{name}}` needs UXP {{since}}+, but the target is UXP {{uxp}}.",
      needsCssNext: '{{kind}} `{{name}}` only takes effect with `"featureFlags": { "CSSNextSupport": true }` (or ["{{group}}"]) in manifest.json (UXP 8.0 changelog).'
    }
  },
  defaultOptions: [{ ignore: [], ignoreVendorPrefixed: true, checkValues: true, ignoreBuildTimeAtRules: true }],
  create(context, [opts]) {
    const uxp = getUxp(context);
    const uxpVersion = uxp.uxpVersion;
    const flags = uxp.manifest?.featureFlags ?? null;
    const cssNextOn = (group) => {
      const v = flags?.CSSNextSupport;
      return v === true || Array.isArray(v) && v.includes(group) || flags?.enableSWCSupport === true;
    };
    const checkCssNext = (node, kind, name) => {
      const n = CSS_NEXT[name];
      if (!n || !uxp.manifest || cssNextOn(n.group) || ignore.has(name.toLowerCase())) return;
      if (!checkCss(n.kind, name, uxpVersion).ok) return;
      context.report({ loc: node.loc, messageId: "needsCssNext", data: { kind, name, group: n.group } });
    };
    const ignore = new Set((opts.ignore ?? []).map((x) => x.toLowerCase()));
    const target = uxpVersion ? ` ${uxpVersion}` : "";
    const report = (node, kind, name, v) => {
      if (v.ok || ignore.has(name.toLowerCase())) return;
      if (opts.ignoreVendorPrefixed !== false && /^[:@]*-[a-z]+-/.test(name)) return;
      if (v.reason === "unsupported") context.report({ loc: node.loc, messageId: "unsupported", data: { kind, name, target } });
      else context.report({ loc: node.loc, messageId: "newer", data: { kind, name, since: v.since, uxp: uxpVersion ?? "?" } });
    };
    let skipValues = 0;
    const visitors = {
      "Declaration:exit"() {
        if (skipValues > 0) skipValues--;
      },
      Declaration(node) {
        const prop = node.property ?? "";
        if (prop.startsWith("--")) {
          skipValues++;
          return;
        }
        const v = checkCss("properties", prop, uxpVersion);
        if (!v.ok && matchesUxpDefault(prop, context.sourceCode.getText(node.value))) {
          skipValues++;
          return;
        }
        report(node, "Property", prop, v);
        if (!v.ok) {
          skipValues++;
          return;
        }
        checkCssNext(node, "Property", prop);
        if (opts.checkValues === false) return;
        const kids = node.value?.children?.filter((c) => c.type !== "WhiteSpace") ?? [];
        if (kids.length === 1 && kids[0].type === "Identifier" && kids[0].name) {
          const val = kids[0].name;
          const vv = checkCssValue(prop, val, uxpVersion);
          if (!vv.ok && !ignore.has(`${prop}:${val}`.toLowerCase())) report(kids[0], `Value of ${prop}`, val, vv);
        }
      },
      Atrule(node) {
        if (opts.ignoreBuildTimeAtRules !== false && BUILD_TIME_AT_RULES.has(node.name ?? "")) return;
        report(node, "At-rule", `@${node.name}`, checkCss("atDirectives", `@${node.name}`, uxpVersion));
      },
      PseudoClassSelector(node) {
        const n = node.name ?? "";
        if (["before", "after", "first-line", "first-letter"].includes(n)) {
          report(node, "Pseudo-element", `:${n}`, checkCss("pseudoElements", n, uxpVersion));
          return;
        }
        report(node, "Pseudo-class", `:${n}`, checkCss("pseudoClasses", n, uxpVersion));
      },
      PseudoElementSelector(node) {
        report(node, "Pseudo-element", `::${node.name}`, checkCss("pseudoElements", node.name ?? "", uxpVersion));
      },
      Dimension(node) {
        if (skipValues) return;
        report(node, "Unit", node.unit ?? "", checkCss("units", node.unit ?? "", uxpVersion));
      },
      Function(node) {
        if (skipValues) return;
        if (!node.name || !isKnownWebFunction(node.name)) return;
        report(node, "Function", `${node.name}()`, checkCss("functionNames", node.name, uxpVersion));
        checkCssNext(node, "Function", node.name);
      },
      // Media features: css-tree Feature nodes
      Feature(node) {
        if (node.name) report(node, "Media feature", node.name, checkCss("mediaFeatures", node.name, uxpVersion));
      }
    };
    return visitors;
  }
});

// src/rules/no-unsupported-inline-style.ts
var kebab = (s) => s.startsWith("--") ? s : s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^ms-/, "-ms-");
var no_unsupported_inline_style_default = createRule({
  name: "no-unsupported-inline-style",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unsupported CSS properties in JSX `style={{...}}` objects and `element.style.x = ...` assignments",
      recommended: true,
      sources: ["jardicc/vscode-uxp-validator UXP CSS data (MIT)"]
    },
    schema: [{ type: "object", properties: { ignore: { type: "array", items: { type: "string" } } }, additionalProperties: false }],
    messages: {
      unsupported: "Style property `{{name}}` is not supported by UXP{{target}}.",
      newer: "Style property `{{name}}` needs UXP {{since}}+, but the target is UXP {{uxp}}.",
      unsupportedValue: "`{{name}}: {{value}}` is not supported by UXP{{target}}."
    }
  },
  defaultOptions: [{ ignore: [] }],
  create(context, [opts]) {
    const uxpVersion = getUxp(context).uxpVersion;
    const target = uxpVersion ? ` ${uxpVersion}` : "";
    const ignore = new Set((opts.ignore ?? []).map((x) => x.toLowerCase()));
    const check = (node, jsName, valueNode) => {
      const name = kebab(jsName);
      if (name.startsWith("--") || /^-[a-z]+-/.test(name) || ignore.has(name)) return;
      const v = checkCss("properties", name, uxpVersion);
      if (!v.ok && matchesUxpDefault(name, staticString(valueNode))) return;
      if (!v.ok) {
        if (v.reason === "unsupported") context.report({ node, messageId: "unsupported", data: { name, target } });
        else context.report({ node, messageId: "newer", data: { name, since: v.since, uxp: uxpVersion ?? "?" } });
        return;
      }
      const value = staticString(valueNode);
      if (value && /^[a-z-]+$/i.test(value.trim())) {
        const vv = checkCssValue(name, value.trim(), uxpVersion);
        if (!vv.ok) context.report({ node: valueNode, messageId: "unsupportedValue", data: { name, value, target } });
      }
    };
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "style") return;
        if (node.value?.type !== "JSXExpressionContainer" || node.value.expression.type !== "ObjectExpression") return;
        for (const p of node.value.expression.properties) {
          if (p.type !== "Property") continue;
          const k = keyName(p);
          if (k) check(p.key, k, p.value);
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== "MemberExpression") return;
        const obj = node.left.object;
        if (obj.type !== "MemberExpression" || propertyName(obj) !== "style") return;
        const k = propertyName(node.left);
        if (k && k !== "cssText") check(node.left.property, k, node.right);
      },
      CallExpression(node) {
        if (node.callee.type !== "MemberExpression" || propertyName(node.callee) !== "setProperty") return;
        const obj = node.callee.object;
        if (obj.type !== "MemberExpression" || propertyName(obj) !== "style") return;
        const k = staticString(node.arguments[0]);
        if (k) check(node.arguments[0], k, node.arguments[1] ?? null);
      }
    };
  }
});

// src/data/html.ts
var UNSUPPORTED_ELEMENTS = Object.fromEntries(
  [
    ["ul", "Lists are not supported; <ul> renders like a <div>. Simulate bullets with CSS."],
    ["ol", "Ordered lists are not supported; number items manually."],
    ["li", "List items are not supported; <li> renders like a <div>."],
    ["i", "<i> is not supported; use a styled element (font-style: italic)."],
    ["em", "<em> is not supported; use a styled element (font-style: italic)."],
    ["strong", "<strong> is not supported; use a styled element (font-weight: bold)."],
    ["q", "<q> is not supported; add quotes with CSS ::before/::after."],
    ["blockquote", "<blockquote> is not supported; style a <div> instead."],
    ["pre", "<pre> is not supported; use white-space: pre on a <div>."],
    ["code", "<code> is not supported; set font-family on a <span>."],
    ["title", "<title> is not used by UXP and may render visibly; add `title { display: none; }` or remove it."]
  ].map(([el, message]) => [el, { message, source: SOURCES.unsupportedElements, confidence: "docs" }])
);
var UNSUPPORTED_ATTRIBUTES = ["accesskey", "autocapitalize", "contenteditable", "contextmenu", "dir", "dropzone", "hidden", "inputmode", "is", "part", "spellcheck", "translate"];
var UNSUPPORTED_ATTRIBUTE_PREFIXES = ["aria-", "item"];
var INPUT_TYPES_UNSUPPORTED = {
  file: { message: '<input type="file"> is not supported. Use require("uxp").storage.localFileSystem.getFileForOpening().', source: SOURCES.knownIssues, confidence: "docs" },
  color: { message: '<input type="color"> is not supported.', source: SOURCES.knownIssues, confidence: "docs" }
};

// src/rules/no-unsupported-html.ts
var SPECTRUM_PREFIX = /^sp-/;
var no_unsupported_html_default = createRule({
  name: "no-unsupported-html",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow HTML elements, attributes and patterns that UXP documents as unsupported (HTML via @html-eslint/parser, and JSX)",
      recommended: true,
      sources: [SOURCES.knownIssues, SOURCES.unsupportedAttributes, SOURCES.unsupportedElements, SOURCES.uiPlaygroundReadme]
    },
    schema: [{ type: "object", properties: { elements: { type: "boolean" }, attributes: { type: "boolean" }, aria: { type: "boolean" }, inlineHandlers: { type: "boolean" }, ignore: { type: "array", items: { type: "string" } } }, additionalProperties: false }],
    messages: {
      element: "{{message}}",
      attribute: "Global attribute `{{name}}` is not supported by UXP.",
      inputType: "{{message}}",
      labelFor: "`<label {{attr}}>` is not supported in UXP; wrap the control inside the <label> instead.",
      formMethod: 'UXP forms only support `method="dialog"`; they do not submit to a URL.',
      textareaSize: "`<textarea {{attr}}>` is ignored in UXP; size it with CSS width/height.",
      optionValue: "`<option>` needs a `value` attribute in UXP, otherwise `select.value` returns undefined.",
      optionDisabled: "`<option disabled>` is not supported in UXP.",
      selectValue: '`<select value=...>` does not select the option in UXP; set `selected` on the <option> or call setAttribute("value", ...).',
      inlineHandler: "Inline `{{name}}` handlers are not reliable in UXP; attach listeners with addEventListener.",
      defaultValue: "UXP input elements do not accept `defaultValue`; set `value` instead.",
      spEvent: "React (before 19) does not forward `{{name}}` to the `<{{el}}>` web component, so the handler never runs. Attach a `change` listener with a ref and addEventListener, or upgrade to React 19."
    }
  },
  defaultOptions: [{ elements: true, attributes: true, aria: false, inlineHandlers: true, ignore: [] }],
  create(context, [opts]) {
    const ignore = new Set(opts.ignore ?? []);
    const reactVersion = context.settings?.uxp?.reactVersion ?? 0;
    const reactForwards = reactVersion >= 19;
    const styled = new Set((context.settings?.uxp?.styledElements ?? []).map((e) => e.toLowerCase()));
    const at = (loc, messageId, data2 = {}) => {
      if (!ignore.has(messageId) && !ignore.has(data2.name ?? "\0")) context.report({ loc, messageId, data: data2 });
    };
    const check = (el) => {
      const attr = (n) => el.attrs.find((a) => a.name.toLowerCase() === n);
      const selfStyled = el.name !== "title" && el.attrs.some((a) => /^(class|classname|style)$/i.test(a.name));
      if (opts.elements !== false && UNSUPPORTED_ELEMENTS[el.name] && !styled.has(el.name) && !selfStyled) at(el.loc, "element", { message: UNSUPPORTED_ELEMENTS[el.name].message, name: el.name });
      if (el.name === "input") {
        const t = attr("type")?.value?.toLowerCase();
        if (t && INPUT_TYPES_UNSUPPORTED[t]) at(attr("type").loc, "inputType", { message: INPUT_TYPES_UNSUPPORTED[t].message });
      }
      if ((el.name === "input" || el.name === "textarea") && attr(el.jsx ? "defaultvalue" : "\0")) at(attr("defaultvalue").loc, "defaultValue");
      if (el.name === "label") {
        const f = el.jsx ? el.attrs.find((a) => a.name === "htmlFor") : attr("for");
        if (f) at(f.loc, "labelFor", { attr: el.jsx ? "htmlFor" : "for" });
      }
      if (el.name === "form") {
        const m = attr("method");
        if (m && m.value !== "\0dynamic" && m.value?.toLowerCase() !== "dialog" || attr("action")) at((m ?? attr("action")).loc, "formMethod");
      }
      if (el.name === "textarea") {
        for (const n of ["rows", "cols"]) if (attr(n)) at(attr(n).loc, "textareaSize", { attr: n });
      }
      if (el.name === "option") {
        if (!attr("value")) at(el.loc, "optionValue");
        if (attr("disabled")) at(attr("disabled").loc, "optionDisabled");
      }
      if (el.name === "select" && !el.jsx && attr("value")) at(attr("value").loc, "selectValue");
      for (const a of el.attrs) {
        const n = a.name.toLowerCase();
        if (opts.attributes !== false && !el.name.includes("-")) {
          const prefixHit = UNSUPPORTED_ATTRIBUTE_PREFIXES.find((p) => n.startsWith(p) && (p !== "item" || /^item(scope|type|prop|id|ref)$/.test(n)));
          if (UNSUPPORTED_ATTRIBUTES.includes(n) || prefixHit && (prefixHit !== "aria-" || opts.aria === true)) {
            if (!(n === "dir" && el.jsx === false && el.name === "html")) at(a.loc, "attribute", { name: a.name });
          }
        }
        if (!el.jsx && opts.inlineHandlers !== false && /^on[a-z]+$/.test(n)) at(a.loc, "inlineHandler", { name: a.name });
        if (el.jsx && reactForwards !== true && SPECTRUM_PREFIX.test(el.name) && a.name === "onChange") at(a.loc, "spEvent", { name: a.name, el: el.name });
      }
    };
    return {
      JSXOpeningElement(node) {
        const v = viewFromJsx(node);
        if (v) check(v);
      },
      ...{ Tag(node) {
        check(viewFromHtml(node));
      } }
    };
  }
});

// src/data/web-api.ts
var UNAVAILABLE_GLOBALS = {
  MutationObserver: { message: "MutationObserver is not available in UXP (needs a polyfill such as mutationobserver-shim).", source: `${SOURCES.bubblydooPolyfills} ; ${SOURCES.forum4605}`, confidence: "community" },
  matchMedia: { message: "matchMedia is not available in UXP (needs a polyfill such as matchmedia-polyfill).", source: SOURCES.bubblydooPolyfills, confidence: "community" },
  "performance.measure": { message: "performance.measure is not available in UXP.", source: SOURCES.bubblydooPolyfills, confidence: "community" }
};
var UNSUPPORTED_EVENTS = {
  keypress: { message: "`keypress` is not supported in UXP; use keydown/keyup.", source: SOURCES.knownIssues, confidence: "docs" }
};
var NODE_ONLY_MODULES = ["child_process", "cluster", "dgram", "dns", "dns/promises", "http", "http2", "https", "inspector", "net", "readline", "readline/promises", "repl", "tls", "tty", "v8", "vm", "worker_threads", "fs/promises"];

// src/rules/no-unsupported-web-api.ts
var no_unsupported_web_api_default = createRule({
  name: "no-unsupported-web-api",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow browser APIs that UXP does not provide or documents as unreliable",
      recommended: true,
      sources: [SOURCES.knownIssues, SOURCES.bubblydooPolyfills, SOURCES.forum4605]
    },
    schema: [{ type: "object", properties: { community: { type: "boolean" }, scriptFilePattern: { type: "string" } }, additionalProperties: false }],
    messages: {
      unavailable: "{{message}} ({{confidence}} source: {{source}})",
      event: "{{message}}",
      innerHtmlScript: 'Do not rely on scripts or inline event handlers inside `innerHTML` in UXP; Adobe says this behaviour "will likely go away". Use addEventListener.',
      storageInScript: "UXP scripts (.psjs) have no persistent storage; `{{name}}` is unavailable there."
    }
  },
  defaultOptions: [{ community: true, scriptFilePattern: "\\.psjs$" }],
  create(context, [opts]) {
    const sourceCode = context.sourceCode;
    const isScript = new RegExp(opts.scriptFilePattern ?? "\\.psjs$").test(context.filename);
    const facts = Object.entries(UNAVAILABLE_GLOBALS).filter(([, f]) => opts.community !== false || f.confidence === "docs");
    const byName = new Map(facts);
    const reportFact = (node, key) => {
      const f = byName.get(key);
      if (f && isFeatureDetected(sourceCode, node, key.split(".").pop())) return;
      if (f) context.report({ node, messageId: "unavailable", data: { message: f.message, confidence: f.confidence, source: f.source } });
    };
    return {
      Identifier(node) {
        if (!byName.has(node.name) && !(isScript && (node.name === "localStorage" || node.name === "sessionStorage"))) return;
        const p = node.parent;
        if (p?.type === "MemberExpression" && p.property === node && !p.computed) return;
        if (p?.type === "Property" && p.key === node) return;
        if (p?.type === "VariableDeclarator" && p.id === node) return;
        if (!isGlobalReference(sourceCode, node)) return;
        if (p?.type === "UnaryExpression" && p.operator === "typeof") return;
        if (isScript && (node.name === "localStorage" || node.name === "sessionStorage")) {
          context.report({ node, messageId: "storageInScript", data: { name: node.name } });
          return;
        }
        reportFact(node, node.name);
      },
      MemberExpression(node) {
        const raw = memberPath(node);
        if (!raw) return;
        const path = stripGlobal(raw);
        const root = raw.split(".")[0];
        if (raw !== path || root === "performance") {
          if (node.parent?.type === "UnaryExpression" && node.parent.operator === "typeof") return;
          if (byName.has(path)) reportFact(node, path);
          if (isScript && (path === "localStorage" || path === "sessionStorage") && raw !== path) context.report({ node, messageId: "storageInScript", data: { name: path } });
        }
      },
      CallExpression(node) {
        if (node.callee.type === "MemberExpression" && propertyName(node.callee) === "addEventListener") {
          const ev = staticString(node.arguments[0]);
          if (ev && UNSUPPORTED_EVENTS[ev]) context.report({ node: node.arguments[0], messageId: "event", data: { message: UNSUPPORTED_EVENTS[ev].message } });
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== "MemberExpression") return;
        const prop = propertyName(node.left);
        if (prop === "onkeypress") context.report({ node: node.left, messageId: "event", data: { message: UNSUPPORTED_EVENTS.keypress.message } });
        if (prop === "innerHTML" || prop === "outerHTML") {
          const s = staticString(node.right) ?? (node.right.type === "TemplateLiteral" ? node.right.quasis.map((q) => q.value.raw).join("") : null);
          if (s && (/<script\b/i.test(s) || /\son[a-z]+\s*=/i.test(s))) context.report({ node: node.right, messageId: "innerHtmlScript" });
        }
      },
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "onKeyPress") context.report({ node, messageId: "event", data: { message: UNSUPPORTED_EVENTS.keypress.message } });
      }
    };
  }
});

// src/data/generated/fs-methods.ts
var fsMethods = {
  "$source": {
    "repo": "https://github.com/AdobeDocs/uxp",
    "file": "src/pages/uxp-api/reference-js/Modules/fs/fs.md",
    "commit": "f04f65e02065b4cd8c78d9d26bcba2ccf6943c58"
  },
  "methods": [
    "readFile",
    "readFileSync",
    "writeFile",
    "writeFileSync",
    "open",
    "close",
    "read",
    "write",
    "lstat",
    "lstatSync",
    "rename",
    "copyFile",
    "unlink",
    "mkdir",
    "rmdir",
    "readdir",
    "readdirSync"
  ]
};
var fs_methods_default = fsMethods;

// src/rules/no-unsupported-fs-method.ts
var DOCUMENTED = new Set(fs_methods_default.methods);
var SYNC_TO_DOC = { existsSync: "lstatSync (wrapped in try/catch)", statSync: "lstatSync", mkdirSync: "await fs.mkdir", unlinkSync: "await fs.unlink", stat: "lstat", exists: "lstat", appendFile: 'writeFile with flag "a"', readFileAsync: "readFile" };
var no_unsupported_fs_method_default = createRule({
  name: "no-unsupported-fs-method",
  meta: {
    type: "problem",
    docs: { description: 'Disallow Node `fs` methods that UXP\'s `require("fs")` does not document', recommended: true, sources: [SOURCES.fs] },
    schema: [],
    messages: {
      unsupported: "`fs.{{name}}` is not part of UXP's fs module (documented: {{list}}).{{hint}}",
      promises: "`fs.promises` is not part of UXP's fs module; UXP's fs methods already return promises when no callback is passed."
    }
  },
  defaultOptions: [],
  create(context) {
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["fs", "uxp"]));
    const members = [];
    const list = [...DOCUMENTED].join(", ");
    return mergeVisitors(tracker.visitors(), {
      MemberExpression(node) {
        members.push(node);
      },
      ImportDeclaration(node) {
        if (node.source.value === "fs/promises") context.report({ node, messageId: "promises" });
      },
      "Program:exit"() {
        tracker.finalize();
        for (const n of members) {
          const base2 = tracker.resolve(n.object);
          if (base2 !== "fs" && base2 !== "uxp.storage.fs") continue;
          const name = propertyName(n);
          if (!name) continue;
          if (name === "promises") {
            context.report({ node: n.property, messageId: "promises" });
            continue;
          }
          if (!DOCUMENTED.has(name) && !["constants", "default", "createReadStream"].includes(name)) context.report({ node: n.property, messageId: "unsupported", data: { name, list, hint: SYNC_TO_DOC[name] ? ` Use ${SYNC_TO_DOC[name]}.` : "" } });
        }
      }
    });
  }
});

// src/rules/no-node-builtin-modules.ts
var no_node_builtin_modules_default = createRule({
  name: "no-node-builtin-modules",
  meta: {
    type: "problem",
    docs: { description: "Disallow Node core modules that UXP does not provide (UXP modules: uxp, fs, os, plus host modules)", recommended: true, sources: [SOURCES.modulesIndex] },
    schema: [{ type: "object", properties: { allow: { type: "array", items: { type: "string" } } }, additionalProperties: false }],
    messages: { nodeOnly: "`{{name}}` is a Node.js module with no UXP equivalent; it fails at runtime in UXP.{{hint}}" }
  },
  defaultOptions: [{ allow: [] }],
  create(context, [opts]) {
    const allow = new Set(opts.allow ?? []);
    const hints = { http: " Use fetch() with requiredPermissions.network.", https: " Use fetch() with requiredPermissions.network.", child_process: ' Use require("uxp").shell.openPath/openExternal or a hybrid plugin.', net: " Use WebSocket.", "fs/promises": " UXP fs methods return promises already." };
    const check = (node, src) => {
      if (!src) return;
      const name = src.replace(/^node:/, "");
      if (allow.has(name)) return;
      if (NODE_ONLY_MODULES.includes(name)) context.report({ node, messageId: "nodeOnly", data: { name: src, hint: hints[name] ?? "" } });
    };
    return {
      ImportDeclaration(node) {
        if (node.importKind !== "type") check(node.source, node.source.value);
      },
      ImportExpression(node) {
        check(node.source, staticString(node.source));
      },
      CallExpression(node) {
        const s = requireSource(node);
        if (s) check(node.arguments[0], s);
      }
    };
  }
});

// src/rules/entrypoints-match-manifest.ts
var entrypoints_match_manifest_default = createRule({
  name: "entrypoints-match-manifest",
  meta: {
    type: "problem",
    docs: {
      description: "Require `entrypoints.setup()` panel and command ids to match manifest.json entrypoints",
      recommended: true,
      sources: ["https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/#entrypointssetup-using-promises"]
    },
    schema: [{ type: "object", properties: { reportMissing: { type: "boolean" } }, additionalProperties: false }],
    messages: {
      notInManifest: "{{kind}} `{{id}}` is set up in code but manifest.json has no {{kind}} entrypoint with that id.",
      missingHandler: "manifest.json declares {{kind}} `{{id}}` but this entrypoints.setup() call has no handler for it.",
      wrongKind: "`{{id}}` is a {{actual}} in manifest.json but is set up under `{{key}}`."
    }
  },
  defaultOptions: [{ reportMissing: true }],
  create(context, [opts]) {
    const m = getUxp(context).manifest;
    const eps = m ? Array.isArray(m.entrypoints) ? m.entrypoints : Array.isArray(m.entryPoints) ? m.entryPoints : null : null;
    if (!eps) return {};
    const byType = { panel: /* @__PURE__ */ new Set(), command: /* @__PURE__ */ new Set() };
    for (const e of eps) if (e && typeof e.id === "string" && typeof e.type === "string" && byType[e.type]) byType[e.type].add(e.id);
    const splitSetup = context.settings.uxp?.splitSetup === true;
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["uxp"]));
    const calls = [];
    return mergeVisitors(tracker.visitors(), {
      CallExpression(node) {
        calls.push(node);
      },
      "Program:exit"() {
        tracker.finalize();
        for (const call of calls) {
          if (tracker.resolve(call.callee) !== "uxp.entrypoints.setup") continue;
          const arg = call.arguments[0];
          if (!arg || arg.type !== "ObjectExpression") continue;
          for (const section of arg.properties) {
            if (section.type !== "Property") continue;
            const key = keyName(section);
            const kind = key === "panels" ? "panel" : key === "commands" ? "command" : null;
            if (!kind || section.value.type !== "ObjectExpression") continue;
            const seen = /* @__PURE__ */ new Set();
            let dynamic = false;
            for (const p of section.value.properties) {
              if (p.type !== "Property") {
                dynamic = true;
                continue;
              }
              const id = keyName(p);
              if (!id) {
                dynamic = true;
                continue;
              }
              seen.add(id);
              if (byType[kind].has(id)) continue;
              const other = kind === "panel" ? "command" : "panel";
              if (byType[other].has(id)) context.report({ node: p.key, messageId: "wrongKind", data: { id, actual: other, key } });
              else context.report({ node: p.key, messageId: "notInManifest", data: { id, kind } });
            }
            if (opts.reportMissing !== false && !dynamic && !splitSetup) {
              for (const id of byType[kind]) if (!seen.has(id)) context.report({ node: section.key, messageId: "missingHandler", data: { id, kind } });
            }
          }
        }
      }
    });
  }
});

// src/rules/valid-manifest.ts
var get = (o, k) => o?.type === "Object" ? o.members.find((m) => m.name.value === k)?.value : void 0;
var KNOWN_HOSTS = /* @__PURE__ */ new Set(["PS", "ID", "premierepro", "XD", "ame"]);
var REQUIRED = ["manifestVersion", "id", "name", "version", "host"];
var PANEL_ONLY = ["minimumSize", "maximumSize", "preferredDockedSize", "preferredFloatingSize"];
var TOP_WILDCARD = /^(?:[a-z]+:\/\/)?\*(?:\.[a-z0-9-]+)?(?::\d+)?\/?$/i;
var valid_manifest_default = createRule({
  name: "valid-manifest",
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description: "Catch manifest.json mistakes that UXP accepts silently (lint manifest.json with @eslint/json)",
      recommended: true,
      sources: [SOURCES.manifestV4, SOURCES.manifestV5Md, SOURCES.uxpChangelog, SOURCES.forum10557, SOURCES.forum12117]
    },
    schema: [{ type: "object", properties: { reportUnknownHostVersion: { type: "boolean" } }, additionalProperties: false }],
    messages: {
      entrypointMain: "Remove `main` from entrypoint `{{id}}`; `main` belongs at the top level of manifest.json, not inside entrypoints (community report, forum thread 10557).",
      blankExtension: '`launchProcess.extensions` entry {{raw}} is whitespace. Use an empty string "" to allow opening folders.',
      permissionsNeedV5: "`requiredPermissions` is ignored before manifestVersion 5.",
      webviewNeedsV5: "WebViews need manifestVersion 5 or later.",
      missingMinVersion: "Set `host.minVersion`; version-aware rules (api-min-version, no-unsupported-css) cannot check this plugin without it.",
      unknownHost: "Unknown host app `{{app}}`; manifest docs list PS, ID, premierepro and XD.",
      missingRequired: "manifest.json is missing `{{key}}`, which Adobe's manifest reference marks as required for development and publishing.",
      invalidVersion: "Plugin `version` {{value}} is not valid for manifestVersion {{mv}}: {{why}}.",
      nameLength: "Plugin `name` should be 3 to 45 characters (Adobe manifest reference); {{value}} has {{n}}.",
      entrypointType: 'Entrypoint type {{value}} is not valid; use "panel" or "command".',
      duplicateEntrypoint: "Entrypoint id `{{id}}` is declared more than once; ids must be unique and map to entrypoints.setup().",
      keyOnlyFor: "`{{key}}` is only valid for `{{type}}` entrypoints; entrypoint `{{id}}` is a {{actual}}.",
      sizeOrder: "Entrypoint `{{id}}`: minimumSize.{{dim}} ({{min}}) is larger than maximumSize.{{dim}} ({{max}}).",
      invalidPermissionValue: "`requiredPermissions.{{key}}` is {{value}}; allowed values: {{allowed}}.",
      wildcardTopLevel: 'Domain {{value}} uses a wildcard at the top-level domain, which UXP 7.4+ rejects. List the registrable domain, e.g. "https://*.example.com".',
      manifestVersionTooOld: "manifestVersion {{value}} is below 4; Photoshop and current UXP hosts need manifestVersion 4 or higher (5 recommended).",
      wrongType: "`{{key}}` must be {{expected}}.",
      unknownHostVersion: "No documented UXP version is known for {{app}} {{version}} (older than every row in the host\u2192UXP table); version checks will be skipped."
    }
  },
  defaultOptions: [{ reportUnknownHostVersion: false }],
  create(context, [opts]) {
    if (!/(^|[\\/])manifest\.json$/.test(context.filename)) return {};
    return {
      Document(node) {
        const root = node.body;
        if (root?.type !== "Object") return;
        const rootLoc = { start: root.loc.start, end: { line: root.loc.start.line, column: root.loc.start.column + 1 } };
        const legacyXd = !!get(root, "uiEntrypoints");
        if (!legacyXd) {
          for (const key of REQUIRED) if (!get(root, key)) context.report({ loc: rootLoc, messageId: "missingRequired", data: { key } });
        }
        const mv = get(root, "manifestVersion");
        const version = typeof mv?.value === "number" ? mv.value : null;
        const isXd = /"app"\s*:\s*"XD"/.test(context.sourceCode.text);
        if (version !== null && version < 4 && !isXd) context.report({ loc: mv.loc, messageId: "manifestVersionTooOld", data: { value: String(version) } });
        const ver = get(root, "version");
        if (ver && ver.type !== "String") context.report({ loc: ver.loc, messageId: "wrongType", data: { key: "version", expected: 'a string such as "1.0.0"' } });
        else if (ver) {
          const v = ver.value;
          const why = version !== null && version < 5 ? /^\d{1,2}\.\d{1,2}\.\d{1,2}$/.test(v) ? null : "manifest v4 needs exactly three numeric segments, each 0-99" : /^\d+(\.\d+){0,2}([-+][0-9A-Za-z.+-]+)?$/.test(v) ? null : 'use semver, e.g. "1.0.0"';
          if (why) context.report({ loc: ver.loc, messageId: "invalidVersion", data: { value: JSON.stringify(v), mv: String(version ?? 5), why } });
        }
        const nm = get(root, "name");
        if (nm?.type === "String") {
          const n = [...nm.value].length;
          if (n < 3 || n > 45) context.report({ loc: nm.loc, messageId: "nameLength", data: { value: JSON.stringify(nm.value), n: String(n) } });
        }
        const perms = get(root, "requiredPermissions");
        const enumCheck = (key, val, allowed) => {
          if (!val) return;
          if (val.type === "String" && allowed.includes(val.value)) return;
          context.report({ loc: val.loc, messageId: "invalidPermissionValue", data: { key, value: val.type === "String" ? JSON.stringify(val.value) : `a ${val.type.toLowerCase()}`, allowed: allowed.map((a) => JSON.stringify(a)).join(", ") } });
        };
        enumCheck("clipboard", get(perms, "clipboard"), ["read", "readAndWrite"]);
        enumCheck("localFileSystem", get(perms, "localFileSystem"), ["plugin", "request", "fullAccess"]);
        enumCheck("webview.allow", get(get(perms, "webview"), "allow"), ["yes"]);
        for (const [key, val] of [["enableUserInfo", get(perms, "enableUserInfo")], ["enableAddon", get(perms, "enableAddon")], ["ipc.enablePluginCommunication", get(get(perms, "ipc"), "enablePluginCommunication")]]) {
          if (val && val.type !== "Boolean") context.report({ loc: val.loc, messageId: "wrongType", data: { key: `requiredPermissions.${key}`, expected: "true or false" } });
        }
        for (const owner of ["network", "webview"]) {
          const doms = get(get(perms, owner), "domains");
          if (doms?.type !== "Array") continue;
          for (const el of doms.elements) {
            const d = el.value;
            if (d.type === "String" && TOP_WILDCARD.test(d.value.trim())) context.report({ loc: d.loc, messageId: "wildcardTopLevel", data: { value: JSON.stringify(d.value) } });
          }
        }
        if (perms && version !== null && version < 5) context.report({ loc: perms.loc, messageId: "permissionsNeedV5" });
        if (get(perms, "webview") && version !== null && version < 5) context.report({ loc: get(perms, "webview").loc, messageId: "webviewNeedsV5" });
        const exts = get(get(perms, "launchProcess"), "extensions");
        if (exts?.type === "Array") {
          for (const el of exts.elements) {
            const v = el.value;
            if (v.type === "String" && v.value.length > 0 && v.value.trim() === "") {
              context.report({ loc: v.loc, messageId: "blankExtension", data: { raw: JSON.stringify(v.value) }, fix: v.range ? (f) => f.replaceTextRange(v.range, '""') : null });
            }
          }
        }
        const hostNode = get(root, "host");
        const hosts = hostNode?.type === "Array" ? hostNode.elements.map((e) => e.value) : hostNode ? [hostNode] : [];
        for (const h of hosts) {
          const app = get(h, "app")?.value;
          const min = get(h, "minVersion");
          if (app && !KNOWN_HOSTS.has(app)) context.report({ loc: get(h, "app").loc, messageId: "unknownHost", data: { app } });
          if (!min) context.report({ loc: h.loc, messageId: "missingMinVersion" });
          else if (opts.reportUnknownHostVersion && app && !["XD", "ame"].includes(app) && KNOWN_HOSTS.has(app) && typeof min.value === "string" && uxpForHost(app, min.value) === null) context.report({ loc: min.loc, messageId: "unknownHostVersion", data: { app, version: min.value } });
        }
        const eps = get(root, "entrypoints") ?? get(root, "entryPoints");
        if (eps?.type === "Array") {
          const seen = /* @__PURE__ */ new Set();
          for (const el of eps.elements) {
            const e = el.value;
            if (e.type !== "Object") continue;
            const typeNode = get(e, "type");
            const type = typeNode?.type === "String" ? typeNode.value : void 0;
            const idNode = get(e, "id");
            const id = idNode?.type === "String" ? idNode.value : "?";
            if (typeNode && (type === void 0 || !["panel", "command"].includes(type))) context.report({ loc: typeNode.loc, messageId: "entrypointType", data: { value: JSON.stringify(type ?? typeNode.value) } });
            if (idNode?.type === "String") {
              if (seen.has(id)) context.report({ loc: idNode.loc, messageId: "duplicateEntrypoint", data: { id } });
              seen.add(id);
            }
            if (type === "command") for (const key of PANEL_ONLY) {
              const k = e.members.find((m) => m.name.value === key);
              if (k) context.report({ loc: k.name.loc, messageId: "keyOnlyFor", data: { key, type: "panel", id, actual: "command" } });
            }
            if (type === "panel") {
              const k = e.members.find((m) => m.name.value === "shortcut");
              if (k) context.report({ loc: k.name.loc, messageId: "keyOnlyFor", data: { key: "shortcut", type: "command", id, actual: "panel" } });
            }
            for (const dim of ["width", "height"]) {
              const mn = get(get(e, "minimumSize"), dim)?.value;
              const mxNode = get(get(e, "maximumSize"), dim);
              const mx = mxNode?.value;
              if (typeof mn === "number" && typeof mx === "number" && mn > mx) context.report({ loc: mxNode.loc, messageId: "sizeOrder", data: { id, dim, min: String(mn), max: String(mx) } });
            }
          }
          for (const el of eps.elements) {
            const main = el.value.type === "Object" ? el.value.members.find((x) => x.name.value === "main") : void 0;
            if (main) context.report({ loc: main.loc, messageId: "entrypointMain", data: { id: String(get(el.value, "id")?.value ?? "?") } });
          }
        }
      }
    };
  }
});

// src/util/modal-reach.ts
var isFn = (n) => !!n && (n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression");
var HANDLER_APIS = /* @__PURE__ */ new Set(["addEventListener", "setTimeout", "setInterval", "requestAnimationFrame", "requestIdleCallback", "queueMicrotask", "addNotificationListener", "addEventHandler", "on", "once", "useEffect", "useLayoutEffect", "subscribe"]);
var INHERIT_APIS = /* @__PURE__ */ new Set(["then", "catch", "finally", "map", "forEach", "filter", "reduce", "reduceRight", "some", "every", "find", "findIndex", "findLast", "flatMap", "sort", "from", "all", "allSettled", "race", "any"]);
var MEMO_APIS = /* @__PURE__ */ new Set(["useCallback", "useMemo", "memo", "useEvent"]);
var EXEC_CONTEXT_MEMBERS = /* @__PURE__ */ new Set(["hostControl", "reportProgress", "isCancelled", "onCancel"]);
function calleeName(c) {
  const callee = unwrap(c.callee);
  if (callee.type === "Identifier") return callee.name;
  if (callee.type === "MemberExpression") return propertyName(callee);
  return null;
}
function fnName(f) {
  if (f.type === "FunctionDeclaration" && f.id) return f.id.name;
  let p = f.parent;
  if (p?.type === "CallExpression" && MEMO_APIS.has(calleeName(p) ?? "")) p = p.parent;
  if (p?.type === "VariableDeclarator" && p.id.type === "Identifier") return p.id.name;
  if (p?.type === "AssignmentExpression" && p.left.type === "Identifier") return p.left.name;
  if (p?.type === "AssignmentExpression" && p.left.type === "MemberExpression" && !/^on[a-z]+$/.test(propertyName(p.left) ?? "")) return propertyName(p.left);
  if (p?.type === "Property" || p?.type === "MethodDefinition" || p?.type === "PropertyDefinition") return keyName(p);
  return null;
}
function refName(n) {
  if (!n) return null;
  const u = unwrap(n);
  if (u.type === "Identifier") return u.name;
  if (u.type === "MemberExpression") return propertyName(u);
  if (u.type === "CallExpression" && u.callee.type === "MemberExpression" && propertyName(u.callee) === "bind") return refName(u.callee.object);
  return null;
}
function paramNames(f) {
  return f.params.map((p) => p.type === "Identifier" ? p.name : p.type === "AssignmentPattern" && p.left.type === "Identifier" ? p.left.name : "").filter(Boolean);
}
function buildModalGraph(ast, visitorKeys, tracker) {
  const allFns = [];
  const calls = [];
  const members = [];
  const assigns = [];
  const jsxHandlers = [];
  const fnsByName = /* @__PURE__ */ new Map();
  const stack = [ast];
  while (stack.length) {
    const n = stack.pop();
    if (isFn(n)) {
      allFns.push(n);
      const nm = fnName(n);
      if (nm) fnsByName.set(nm, [...fnsByName.get(nm) ?? [], n]);
    } else if (n.type === "CallExpression") calls.push(n);
    else if (n.type === "MemberExpression") members.push(n);
    else if (n.type === "AssignmentExpression") assigns.push(n);
    else if (n.type === "JSXAttribute" && n.name.type === "JSXIdentifier" && /^on[A-Z]/.test(n.name.name) && n.value?.type === "JSXExpressionContainer" && n.value.expression.type !== "JSXEmptyExpression") jsxHandlers.push(n.value.expression);
    for (const k of visitorKeys[n.type] ?? []) {
      const v = n[k];
      if (Array.isArray(v)) {
        for (const c of v) if (c && typeof c === "object" && "type" in c) stack.push(c);
      } else if (v && typeof v === "object" && "type" in v) stack.push(v);
    }
  }
  const fnCache = /* @__PURE__ */ new WeakMap();
  const enclosingFns = (n) => {
    const hit = fnCache.get(n);
    if (hit) return hit;
    const out = [];
    for (let p = n.parent; p; p = p.parent) if (isFn(p)) out.push(p);
    fnCache.set(n, out);
    return out;
  };
  const innermost = (n) => enclosingFns(n)[0];
  const isModalEntry = (c) => {
    const name = calleeName(c);
    return tracker.resolve(c.callee) === "photoshop.core.executeAsModal" || name === "executeAsModal" || name === "suspendHistory";
  };
  const wrappers = /* @__PURE__ */ new Map();
  const modalArgIndexes = (c) => {
    if (isModalEntry(c)) return [0];
    const w = wrappers.get(calleeName(c) ?? "");
    return w ? [...w] : [];
  };
  for (let changed = true, pass = 0; changed && pass < 5; pass++) {
    changed = false;
    for (const c of calls) {
      for (const i of modalArgIndexes(c)) {
        const a = c.arguments[i] ? unwrap(c.arguments[i]) : null;
        if (a?.type !== "Identifier") continue;
        const f = innermost(c);
        if (!f) continue;
        const idx = paramNames(f).indexOf(a.name);
        const nm = fnName(f);
        if (idx < 0 || !nm) continue;
        const set = wrappers.get(nm) ?? /* @__PURE__ */ new Set();
        if (!set.has(idx)) {
          set.add(idx);
          wrappers.set(nm, set);
          changed = true;
        }
      }
    }
  }
  const modal = /* @__PURE__ */ new Set();
  const modalNames = /* @__PURE__ */ new Set();
  for (const c of calls) {
    for (const i of modalArgIndexes(c)) {
      const a = c.arguments[i] ? unwrap(c.arguments[i]) : null;
      if (isFn(a)) modal.add(a);
      else {
        const nm = refName(a);
        if (nm) modalNames.add(nm);
      }
    }
  }
  for (const nm of modalNames) for (const f of fnsByName.get(nm) ?? []) modal.add(f);
  for (const m of members) {
    if (m.object.type !== "Identifier" || !EXEC_CONTEXT_MEMBERS.has(propertyName(m) ?? "")) continue;
    const name = m.object.name;
    const f = enclosingFns(m).find((g) => paramNames(g).includes(name));
    if (f) modal.add(f);
  }
  const calledBy = /* @__PURE__ */ new Map();
  for (const c of calls) {
    const nm = calleeName(c);
    const f = innermost(c);
    if (nm && f) {
      const s = calledBy.get(f) ?? /* @__PURE__ */ new Set();
      s.add(nm);
      calledBy.set(f, s);
    }
  }
  for (let changed = true; changed; ) {
    changed = false;
    for (const f of [...modal]) for (const nm of calledBy.get(f) ?? []) for (const g of fnsByName.get(nm) ?? []) if (!modal.has(g)) {
      modal.add(g);
      changed = true;
    }
  }
  const direct = /* @__PURE__ */ new Set();
  const root = /* @__PURE__ */ new Set();
  const rootNames = /* @__PURE__ */ new Set();
  const inSetupObject = (n) => {
    let p = n.parent;
    while (p && (p.type === "Property" || p.type === "ObjectExpression" || p.type === "ArrayExpression")) {
      const parent = p.parent;
      if (parent?.type === "CallExpression" && parent.arguments.includes(p)) return calleeName(parent) === "setup";
      p = parent;
    }
    return false;
  };
  const isHandlerPosition = (expr) => {
    const p = expr.parent;
    if (!p) return false;
    if (p.type === "CallExpression" && p.arguments.includes(expr) && HANDLER_APIS.has(calleeName(p) ?? "")) return true;
    if (p.type === "AssignmentExpression" && p.right === expr && p.left.type === "MemberExpression" && /^on[a-z]+$/.test(propertyName(p.left) ?? "")) return true;
    if (p.type === "Property" && p.value === expr && inSetupObject(p)) return true;
    return false;
  };
  for (const f of allFns) if (isHandlerPosition(f) || (f.parent?.type === "MethodDefinition" ? false : f.parent?.type === "Property" && f.parent.method && inSetupObject(f.parent))) direct.add(f);
  for (const e of jsxHandlers) {
    const u = unwrap(e);
    if (isFn(u)) direct.add(u);
    else {
      const nm = refName(u);
      if (nm) rootNames.add(nm);
    }
  }
  for (const c of calls) {
    if (!HANDLER_APIS.has(calleeName(c) ?? "")) continue;
    for (const a of c.arguments) {
      const u = unwrap(a);
      if (!isFn(u)) {
        const nm = refName(u);
        if (nm) rootNames.add(nm);
      }
    }
  }
  for (const a of assigns) {
    if (a.left.type === "MemberExpression" && /^on[a-z]+$/.test(propertyName(a.left) ?? "")) {
      const u = unwrap(a.right);
      if (!isFn(u)) {
        const nm = refName(u);
        if (nm) rootNames.add(nm);
      }
    }
  }
  for (const nm of rootNames) for (const f of fnsByName.get(nm) ?? []) direct.add(f);
  for (const f of direct) root.add(f);
  const ctxIsRoot = (n) => {
    const f = innermost(n);
    return !f || root.has(f);
  };
  const callsByName = /* @__PURE__ */ new Map();
  const passedByName = /* @__PURE__ */ new Map();
  for (const c of calls) {
    const nm = calleeName(c);
    if (nm) {
      const l = callsByName.get(nm);
      if (l) l.push(c);
      else callsByName.set(nm, [c]);
    }
    if (nm && INHERIT_APIS.has(nm)) for (const a of c.arguments) {
      const r2 = refName(a);
      if (r2) {
        const l = passedByName.get(r2);
        if (l) l.push(c);
        else passedByName.set(r2, [c]);
      }
    }
  }
  for (let changed = true, pass = 0; changed && pass < 20; pass++) {
    changed = false;
    for (const f of allFns) {
      if (root.has(f)) continue;
      let isRoot = false;
      const p = f.parent;
      if (p?.type === "CallExpression" && p.arguments.includes(f) && INHERIT_APIS.has(calleeName(p) ?? "") && ctxIsRoot(p)) isRoot = true;
      if (p?.type === "CallExpression" && p.callee === f && ctxIsRoot(p)) isRoot = true;
      if (p?.type === "NewExpression" && p.callee.type === "Identifier" && p.callee.name === "Promise" && ctxIsRoot(p)) isRoot = true;
      if (!isRoot) {
        const nm = fnName(f);
        if (nm) isRoot = (callsByName.get(nm) ?? []).some(ctxIsRoot) || (passedByName.get(nm) ?? []).some(ctxIsRoot);
      }
      if (isRoot) {
        root.add(f);
        changed = true;
      }
    }
  }
  return {
    calls,
    fnsByName,
    enclosingFns,
    isModalEntry,
    ctx(node) {
      const fns = enclosingFns(node);
      if (fns.some((f2) => modal.has(f2))) return "modal";
      const f = fns[0];
      if (!f || root.has(f)) return "root";
      return "unknown";
    },
    isDirectRoot(node) {
      const f = innermost(node);
      return !f || direct.has(f);
    }
  };
}

// src/rules/photoshop-modal-scope.ts
var READ_ONLY = /* @__PURE__ */ new Set(["get", "multiGet"]);
var MODIFYING = /* @__PURE__ */ new Set([
  "createLayer",
  "createLayerGroup",
  "createPixelLayer",
  "createTextLayer",
  "groupLayers",
  "resizeImage",
  "resizeCanvas",
  "rotate",
  "crop",
  "trim",
  "flatten",
  "mergeVisibleLayers",
  "duplicateLayers",
  "splitChannels",
  "convertMode",
  "changeMode",
  "revealAll",
  "applyGaussianBlur",
  "applyMotionBlur",
  "applyAddNoise",
  "applySharpen",
  "applyUnSharpMask",
  "applyHighPass",
  "applyMedianNoise",
  "applyAverage",
  "applyBlur",
  "applyBlurMore",
  "applyClouds",
  "applyDespeckle",
  "applyDustAndScratches",
  "applyLensBlur",
  "applyMaximum",
  "applyMinimum",
  "applyOffset",
  "applyPinch",
  "applyPolarCoordinates",
  "applyRipple",
  "applyShear",
  "applySpherize",
  "applyTwirl",
  "applyWave",
  "applyZigZag",
  "applyBrightnessContrast",
  "applyInvert",
  "sendToBack",
  "rasterize",
  "selectAll",
  "deselect",
  "inverse",
  "createDocument",
  "closeWithoutSaving",
  "unlink",
  "link",
  "translate",
  "scale",
  "skew",
  "flip",
  "merge",
  "duplicate",
  "delete"
]);
var SETTERS = /* @__PURE__ */ new Set(["activeChannels", "activeHistoryBrushSource", "activeHistoryState", "activeLayers", "allLocked", "bitsPerChannel", "blendMode", "colorProfileName", "colorProfileType", "fillOpacity", "filterMaskDensity", "filterMaskFeather", "isClippingMask", "layerMaskDensity", "layerMaskFeather", "name", "opacity", "pixelAspectRatio", "pixelsLocked", "positionLocked", "quickMaskMode", "selected", "transparentPixelsLocked", "vectorMaskDensity", "vectorMaskFeather", "visible"]);
var photoshop_modal_scope_default = createRule({
  name: "photoshop-modal-scope",
  meta: {
    type: "problem",
    docs: {
      description: "Require Photoshop state changes (modifying batchPlay, DOM edits) to run inside core.executeAsModal",
      recommended: true,
      sources: [SOURCES.executeAsModal, SOURCES.psManifestApiVersion, SOURCES.forum6687, SOURCES.forum5837, SOURCES.forum11898]
    },
    schema: [{ type: "object", properties: { extraModifyingMethods: { type: "array", items: { type: "string" } }, readOnlyDescriptors: { type: "array", items: { type: "string" } }, checkDomMethods: { type: "boolean" } }, additionalProperties: false }],
    messages: {
      batchPlayOutsideModal: "batchPlay `{{obj}}` modifies Photoshop state but runs outside core.executeAsModal(). With apiVersion 2 this throws; wrap it in executeAsModal.",
      batchPlayHelperOutsideModal: "`{{helper}}()` runs batchPlay `{{obj}}`, which modifies Photoshop state, outside core.executeAsModal(). With apiVersion 2 this throws; call it inside executeAsModal.",
      domOutsideModal: "`{{name}}()` modifies the Photoshop document but runs outside core.executeAsModal().",
      setterOutsideModal: "Setting `{{name}}` on a Photoshop layer/document modifies state but runs outside core.executeAsModal()."
    }
  },
  defaultOptions: [{ extraModifyingMethods: [], readOnlyDescriptors: [], checkDomMethods: true }],
  create(context, [opts]) {
    const uxp = getUxp(context);
    if (uxp.host && uxp.host !== "PS") return {};
    if (photoshopApiVersion(uxp) === 1) return {};
    if (/\.psjs$/i.test(context.filename)) return {};
    const sourceCode = context.sourceCode;
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["photoshop"]));
    const readOnly = /* @__PURE__ */ new Set([...READ_ONLY, ...opts.readOnlyDescriptors ?? []]);
    const modifying = /* @__PURE__ */ new Set([...MODIFYING, ...opts.extraModifyingMethods ?? []]);
    let usesPhotoshop = false;
    const resolveConst = (id) => {
      let scope = sourceCode.getScope(id);
      while (scope) {
        const v = scope.set.get(id.name);
        if (v) {
          const def = v.defs[0];
          if (!def || def.type !== "Variable" || v.defs.length !== 1) return null;
          const decl = def.node;
          if (decl.id.type !== "Identifier" || !decl.init) return null;
          if (v.references.some((r2) => r2.isWrite() && r2.identifier !== decl.id)) return null;
          return unwrap(decl.init);
        }
        scope = scope.upper;
      }
      return null;
    };
    const descriptorObjs = (arg, depth = 0) => {
      if (!arg || depth > 3) return [];
      let a = unwrap(arg);
      if (a.type === "Identifier") a = resolveConst(a) ?? a;
      if (a.type === "ObjectExpression") {
        const p = a.properties.find((x) => x.type === "Property" && keyName(x) === "_obj");
        const v = p ? staticString(p.value) : null;
        return v ? [v] : [];
      }
      if (a.type !== "ArrayExpression") return [];
      const out = [];
      for (const el of a.elements) {
        if (!el) continue;
        if (el.type === "SpreadElement") out.push(...descriptorObjs(el.argument, depth + 1));
        else out.push(...descriptorObjs(el, depth + 1));
      }
      return out;
    };
    return mergeVisitors(tracker.visitors(), {
      ImportDeclaration(node) {
        if (node.source.value === "photoshop") usesPhotoshop = true;
      },
      "Program:exit"() {
        tracker.finalize();
        const g = buildModalGraph(sourceCode.ast, sourceCode.visitorKeys, tracker);
        if (!usesPhotoshop) usesPhotoshop = g.calls.some((c) => c.callee.type === "Identifier" && c.callee.name === "require" && staticString(c.arguments[0]) === "photoshop");
        if (!usesPhotoshop) return;
        const isBatchPlay = (c) => {
          const r2 = tracker.resolve(c.callee);
          return r2 === "photoshop.action.batchPlay" || r2 === "photoshop.app.batchPlay";
        };
        const helpers = /* @__PURE__ */ new Map();
        for (const c of g.calls) {
          if (!isBatchPlay(c) || g.ctx(c) === "modal") continue;
          const f = g.enclosingFns(c)[0];
          const nm = f ? fnName(f) : null;
          if (!f || !nm) continue;
          const params = f.params.map((p) => p.type === "Identifier" ? p.name : p.type === "AssignmentPattern" && p.left.type === "Identifier" ? p.left.name : "");
          const a0 = c.arguments[0] ? unwrap(c.arguments[0]) : null;
          if (a0?.type === "Identifier" && params.includes(a0.name)) helpers.set(nm, { index: params.indexOf(a0.name), wrapInArray: false });
          else if (a0?.type === "ArrayExpression" && a0.elements.length === 1 && a0.elements[0]?.type === "Identifier" && params.includes(a0.elements[0].name)) helpers.set(nm, { index: params.indexOf(a0.elements[0].name), wrapInArray: true });
        }
        for (const c of g.calls) {
          if (g.ctx(c) !== "root") continue;
          const prop = c.callee.type === "MemberExpression" ? propertyName(c.callee) : null;
          if (isBatchPlay(c)) {
            const objs = descriptorObjs(c.arguments[0]).filter((o) => !readOnly.has(o));
            if (objs.length) context.report({ node: c, messageId: "batchPlayOutsideModal", data: { obj: [...new Set(objs)].join(", ") } });
            continue;
          }
          const helper = helpers.get(calleeName(c) ?? "");
          if (helper && !g.isModalEntry(c)) {
            const objs = descriptorObjs(c.arguments[helper.index]).filter((o) => !readOnly.has(o));
            if (objs.length) context.report({ node: c, messageId: "batchPlayHelperOutsideModal", data: { helper: calleeName(c), obj: [...new Set(objs)].join(", ") } });
            continue;
          }
          if (opts.checkDomMethods !== false && prop && modifying.has(prop) && (tracker.resolve(c.callee)?.startsWith("photoshop.") || looksLikePsReceiver(sourceCode, c.callee))) {
            context.report({ node: c.callee.property, messageId: "domOutsideModal", data: { name: prop } });
          }
        }
        if (opts.checkDomMethods === false) return;
        const visit = (n) => {
          if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression") {
            const left = n.left;
            const prop = propertyName(left);
            if (prop && SETTERS.has(prop) && g.ctx(n) === "root") {
              const r2 = tracker.resolve(left.object);
              if (r2?.startsWith("photoshop.") || looksLikePsReceiver(sourceCode, left)) context.report({ node: left.property, messageId: "setterOutsideModal", data: { name: prop } });
            }
          }
          for (const k of sourceCode.visitorKeys[n.type] ?? []) {
            const v = n[k];
            if (Array.isArray(v)) v.forEach((x) => x && typeof x === "object" && "type" in x && visit(x));
            else if (v && typeof v === "object" && "type" in v) visit(v);
          }
        };
        visit(sourceCode.ast);
      }
    });
  }
});
function looksLikePsReceiver(sourceCode, callee) {
  const t = sourceCode.getText(callee.object);
  return /(^|\.)(app|activeDocument|documents|activeLayers|layers|selection)\b|^(doc|document|layer|psDoc|activeDoc)\w*$/i.test(t) && !/^document\.(body|head|getElementById|querySelector)/.test(t) && t !== "document";
}

// src/rules/photoshop-handle-modal-errors.ts
var photoshop_handle_modal_errors_default = createRule({
  name: "photoshop-handle-modal-errors",
  meta: {
    type: "suggestion",
    docs: {
      description: "Require handling rejections from core.executeAsModal (only one plugin can be modal at a time)",
      recommended: true,
      sources: [SOURCES.executeAsModal, SOURCES.forum5837]
    },
    schema: [],
    messages: {
      unhandled: 'This executeAsModal() promise is neither awaited, returned nor caught. It rejects when Photoshop is already modal ("host is in a modal state"), and the error is lost. Await it in try/catch or add .catch().',
      unhandledInHandler: 'executeAsModal() is awaited in an event handler without try/catch. It rejects when Photoshop is already modal ("host is in a modal state"), and nothing above this handler catches it. Wrap it in try/catch.'
    }
  },
  defaultOptions: [],
  create(context) {
    const uxp = getUxp(context);
    if (uxp.host && uxp.host !== "PS") return {};
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["photoshop"]));
    const sourceCode = context.sourceCode;
    const inTry = (node) => {
      for (let a = node.parent; a; a = a.parent) {
        if (a.type === "TryStatement" && a.handler && node.range[0] >= a.block.range[0] && node.range[1] <= a.block.range[1]) return true;
        if (a.type === "FunctionDeclaration" || a.type === "FunctionExpression" || a.type === "ArrowFunctionExpression") return false;
      }
      return false;
    };
    const classify = (call) => {
      let n = call;
      for (; ; ) {
        const p2 = n.parent;
        if (p2?.type === "MemberExpression" && p2.object === n && p2.parent?.type === "CallExpression" && p2.parent.callee === p2) {
          const name = propertyName(p2);
          if (name === "catch") return null;
          if (name === "then" && p2.parent.arguments.length >= 2) return null;
          if (name === "then" || name === "finally") {
            n = p2.parent;
            continue;
          }
        }
        break;
      }
      let p = n.parent;
      if (p?.type === "ChainExpression") {
        n = p;
        p = n.parent;
      }
      if (p?.type === "AwaitExpression") {
        if (inTry(p)) return null;
        const pp = p.parent;
        if (pp?.type === "ReturnStatement" || pp?.type === "ArrowFunctionExpression" && pp.body === p) return null;
        return "awaited";
      }
      if (p?.type === "ExpressionStatement") return inTry(p) ? null : "floating";
      if (p?.type === "UnaryExpression" && p.operator === "void") return "floating";
      return null;
    };
    return mergeVisitors(tracker.visitors(), {
      "Program:exit"() {
        tracker.finalize();
        const g = buildModalGraph(sourceCode.ast, sourceCode.visitorKeys, tracker);
        for (const c of g.calls) {
          if (tracker.resolve(c.callee) !== "photoshop.core.executeAsModal") continue;
          const kind = classify(c);
          if (kind === "floating") context.report({ node: c, messageId: "unhandled" });
          else if (kind === "awaited" && g.isDirectRoot(c)) context.report({ node: c, messageId: "unhandledInHandler" });
        }
      }
    });
  }
});

// src/rules/photoshop-await-in-modal.ts
var photoshop_await_in_modal_default = createRule({
  name: "photoshop-await-in-modal",
  meta: {
    type: "problem",
    hasSuggestions: true,
    docs: {
      description: "Require awaiting batchPlay and history calls inside an executeAsModal target function so the modal scope does not end early",
      recommended: true,
      sources: [SOURCES.executeAsModal]
    },
    schema: [],
    messages: {
      floating: "`{{name}}()` returns a promise that this executeAsModal target function does not await. The function can finish first, Photoshop then leaves the modal state, and the call fails or runs outside it. Await it.",
      asyncForEach: "`forEach` does not wait for async callbacks, so this executeAsModal target function returns before they finish and Photoshop leaves the modal state early. Use `for (const x of list) await ...` or `await Promise.all(list.map(...))`.",
      addAwait: "Add `await`."
    }
  },
  defaultOptions: [],
  create(context) {
    const uxp = getUxp(context);
    if (uxp.host && uxp.host !== "PS") return {};
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["photoshop"]));
    const sourceCode = context.sourceCode;
    const calls = [];
    const resolveFn = (arg) => {
      if (!arg) return null;
      const a = unwrap(arg);
      if (isFn(a)) return a;
      if (a.type !== "Identifier") return null;
      let scope = sourceCode.getScope(a);
      while (scope) {
        const v = scope.set.get(a.name);
        if (v) {
          if (v.defs.length !== 1) return null;
          const d = v.defs[0];
          if (d.type === "FunctionName") return d.node;
          if (d.type === "Variable") {
            const decl = d.node;
            if (v.references.some((r2) => r2.isWrite() && r2.identifier !== decl.id)) return null;
            return decl.init && isFn(unwrap(decl.init)) ? unwrap(decl.init) : null;
          }
          return null;
        }
        scope = scope.upper;
      }
      return null;
    };
    const ownerFn = (n) => {
      for (let a = n.parent; a; a = a.parent) if (isFn(a)) return a;
      return null;
    };
    const asyncPsCall = (c) => {
      const r2 = tracker.resolve(c.callee);
      if (r2 === "photoshop.action.batchPlay") return "batchPlay";
      if (c.callee.type === "MemberExpression") {
        const name = propertyName(c.callee);
        if ((name === "suspendHistory" || name === "resumeHistory") && /hostControl$/.test(sourceCode.getText(c.callee.object))) return name;
      }
      return null;
    };
    const isDropped = (c) => {
      let p = c.parent;
      if (p?.type === "ChainExpression") p = p.parent;
      return p?.type === "ExpressionStatement" || p?.type === "UnaryExpression" && p.operator === "void";
    };
    const awaitsIn = (f) => {
      const out = [];
      const walk = (n) => {
        if (n.type === "AwaitExpression" || n.type === "ForOfStatement" && n.await) out.push(n.range[0]);
        if (n !== f && isFn(n)) return;
        for (const k of sourceCode.visitorKeys[n.type] ?? []) {
          const v = n[k];
          if (Array.isArray(v)) v.forEach((x) => x && typeof x === "object" && walk(x));
          else if (v && typeof v === "object") walk(v);
        }
      };
      walk(f.body);
      return out;
    };
    const awaitCache = /* @__PURE__ */ new Map();
    const hasAwait = (f) => {
      let found = false;
      const walk = (n) => {
        if (found) return;
        if (n.type === "AwaitExpression") {
          found = true;
          return;
        }
        if (n !== f && isFn(n)) return;
        for (const k of sourceCode.visitorKeys[n.type] ?? []) {
          const v = n[k];
          if (Array.isArray(v)) v.forEach((x) => x && typeof x === "object" && walk(x));
          else if (v && typeof v === "object") walk(v);
        }
      };
      walk(f.body);
      return found;
    };
    return mergeVisitors(tracker.visitors(), {
      CallExpression(node) {
        calls.push(node);
      },
      "Program:exit"() {
        tracker.finalize();
        const targets = /* @__PURE__ */ new Set();
        for (const c of calls) {
          if (tracker.resolve(c.callee) !== "photoshop.core.executeAsModal") continue;
          const f = resolveFn(c.arguments[0]);
          if (f) targets.add(f);
        }
        if (!targets.size) return;
        for (const c of calls) {
          const owner = ownerFn(c);
          if (!owner || !targets.has(owner)) continue;
          const name = asyncPsCall(c);
          if (!awaitCache.has(owner)) awaitCache.set(owner, awaitsIn(owner));
          const laterAwait = awaitCache.get(owner).some((pos) => pos > c.range[1]);
          if (name && isDropped(c) && !laterAwait && !(owner.body.type !== "BlockStatement")) {
            context.report({
              node: c,
              messageId: "floating",
              data: { name },
              suggest: owner.async ? [{ messageId: "addAwait", fix: (fx) => fx.insertTextBefore(c, "await ") }] : []
            });
            continue;
          }
          if (!name && c.callee.type === "MemberExpression" && propertyName(c.callee) === "forEach" && isDropped(c)) {
            const cb = c.arguments[0] ? unwrap(c.arguments[0]) : null;
            if (cb && isFn(cb) && cb.async && hasAwait(cb)) context.report({ node: c.callee.property, messageId: "asyncForEach" });
          }
        }
      }
    });
  }
});

// src/rules/no-deprecated-api.ts
var CLIPBOARD = {
  setContent: { use: "clipboard.write(data)", rename: "write" },
  getContent: { use: "clipboard.read()", rename: "read" },
  clearContent: { use: 'clipboard.writeText("")' }
};
var VIDEO_EVENTS = { uxpvideoload: "loadeddata", uxpvideoplay: "play", uxpvideocomplete: "ended", uxpvideopause: "pause" };
var no_deprecated_api_default = createRule({
  name: "no-deprecated-api",
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description: "Flag UXP and Photoshop APIs that Adobe documents as deprecated, with the documented replacement",
      recommended: true,
      sources: [SOURCES.uxpChangelog, SOURCES.psChangelog]
    },
    schema: [],
    messages: {
      clipboard: "`clipboard.{{name}}()` is deprecated since UXP 8.0. Use `{{use}}` instead.",
      clipboardObject: "Passing an object to `clipboard.writeText()` is deprecated since UXP 8.0. Use `clipboard.write(object)` instead.",
      videoEvent: "The `{{name}}` video event is deprecated since UXP 8.0. Listen for `{{use}}` instead.",
      compositeChannels: "`document.compositeChannels` is deprecated (they are component channels). Use `document.componentChannels`.",
      replace: "Replace with `{{text}}`."
    }
  },
  defaultOptions: [],
  create(context) {
    const uxp = getUxp(context);
    const sourceCode = context.sourceCode;
    const clipboardOk = !uxp.uxpVersion || !isOlder(uxp.uxpVersion, "6.0");
    const channelsOk = uxp.host !== "PS" || !uxp.hostMinVersion || !isOlder(uxp.hostMinVersion, "24.5");
    const tracker = new ModuleTracker(/* @__PURE__ */ new Set(["uxp", "photoshop"]));
    const isClipboard = (obj) => {
      const t = sourceCode.getText(obj);
      return /(^|\.)clipboard$/i.test(t) || tracker.resolve(obj) === "uxp.clipboard";
    };
    const pending = [];
    return mergeVisitors(tracker.visitors(), {
      CallExpression(node) {
        pending.push(node);
      },
      MemberExpression(node) {
        if (propertyName(node) !== "compositeChannels" || node.computed) return;
        if (uxp.host && uxp.host !== "PS" || !channelsOk) return;
        context.report({
          node: node.property,
          messageId: "compositeChannels",
          suggest: [{ messageId: "replace", data: { text: "componentChannels" }, fix: (f) => f.replaceText(node.property, "componentChannels") }]
        });
      },
      "Program:exit"() {
        tracker.finalize();
        for (const node of pending) {
          const callee = node.callee;
          if (callee.type !== "MemberExpression") continue;
          const name = propertyName(callee);
          if (!name) continue;
          if (CLIPBOARD[name] && clipboardOk && isClipboard(callee.object)) {
            const d = CLIPBOARD[name];
            context.report({
              node: callee.property,
              messageId: "clipboard",
              data: { name, use: d.use },
              suggest: d.rename ? [{ messageId: "replace", data: { text: d.rename }, fix: (f) => f.replaceText(callee.property, d.rename) }] : [{ messageId: "replace", data: { text: 'writeText("")' }, fix: (f) => f.replaceTextRange([callee.property.range[0], node.range[1]], 'writeText("")') }]
            });
            continue;
          }
          if (name === "writeText" && clipboardOk && isClipboard(callee.object) && node.arguments[0] && unwrap(node.arguments[0]).type === "ObjectExpression") {
            context.report({ node: callee.property, messageId: "clipboardObject", suggest: [{ messageId: "replace", data: { text: "write" }, fix: (f) => f.replaceText(callee.property, "write") }] });
            continue;
          }
          if ((name === "addEventListener" || name === "removeEventListener") && node.arguments[0]) {
            const ev = staticString(node.arguments[0]);
            const use = ev ? VIDEO_EVENTS[ev] : void 0;
            if (use) {
              const arg = node.arguments[0];
              const q = sourceCode.getText(arg)[0];
              context.report({ node: arg, messageId: "videoEvent", data: { name: ev, use }, suggest: [{ messageId: "replace", data: { text: use }, fix: (f) => f.replaceText(arg, `${q}${use}${q}`) }] });
            }
          }
        }
      }
    });
  }
});

// src/rules/index.ts
var rules = {
  "manifest-permissions": manifest_permissions_default,
  "api-min-version": api_min_version_default,
  "no-unsupported-css": no_unsupported_css_default,
  "no-unsupported-inline-style": no_unsupported_inline_style_default,
  "no-unsupported-html": no_unsupported_html_default,
  "no-unsupported-web-api": no_unsupported_web_api_default,
  "no-unsupported-fs-method": no_unsupported_fs_method_default,
  "no-node-builtin-modules": no_node_builtin_modules_default,
  "entrypoints-match-manifest": entrypoints_match_manifest_default,
  "valid-manifest": valid_manifest_default,
  "photoshop-modal-scope": photoshop_modal_scope_default,
  "photoshop-handle-modal-errors": photoshop_handle_modal_errors_default,
  "photoshop-await-in-modal": photoshop_await_in_modal_default,
  "no-deprecated-api": no_deprecated_api_default
};

// src/configs.ts
var PREFIX = "uxp-lint";
var JS_FILES = ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,psjs,idjs}"];
var CSS_FILES = ["**/*.css"];
var HTML_FILES = ["**/*.{html,htm}"];
var MANIFEST_FILES = ["**/manifest.json"];
var r = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [`${PREFIX}/${k}`, v]));
var JS_RECOMMENDED = r({
  "manifest-permissions": "error",
  "api-min-version": "error",
  "no-unsupported-inline-style": "warn",
  "no-unsupported-html": "warn",
  "no-unsupported-web-api": "warn",
  "no-unsupported-fs-method": "error",
  "no-node-builtin-modules": "error",
  "entrypoints-match-manifest": "error",
  "no-deprecated-api": "warn"
});
var JS_PHOTOSHOP = r({ "photoshop-modal-scope": "error", "photoshop-handle-modal-errors": "warn", "photoshop-await-in-modal": "warn" });
var JS_STRICT = r({
  "manifest-permissions": "error",
  "api-min-version": "error",
  "no-unsupported-inline-style": "error",
  "no-unsupported-html": ["error", { aria: true }],
  "no-unsupported-web-api": "error",
  "no-unsupported-fs-method": "error",
  "no-node-builtin-modules": "error",
  "entrypoints-match-manifest": "error",
  "no-deprecated-api": "error"
});
var CSS_RULES = r({ "no-unsupported-css": "warn" });
var CSS_STRICT = r({ "no-unsupported-css": ["error", { ignoreVendorPrefixed: false }] });
var HTML_RULES = r({ "no-unsupported-html": "warn", "manifest-permissions": "error" });
var MANIFEST_RULES = r({ "valid-manifest": "error" });

// src/version.ts
var VERSION = "0.2.0";

// src/index.ts
var plugin = {
  meta: { name: "eslint-plugin-uxp-lint", version: VERSION, namespace: PREFIX },
  rules,
  configs: {}
};
var hostRules = (host, strict) => ({
  ...strict ? JS_STRICT : JS_RECOMMENDED,
  ...host === "PS" || host === void 0 ? JS_PHOTOSHOP : {}
});
function buildConfig(opts = {}) {
  const strict = opts.level === "strict";
  const settings = { uxp: { ...opts.settings ?? {}, ...opts.manifest ? { manifest: opts.manifest } : {}, ...opts.manifestText ? { manifestText: opts.manifestText } : {}, ...opts.host ? { host: opts.host } : {} } };
  const manifestHost = (() => {
    const h = opts.manifest?.host;
    const app = Array.isArray(h) ? h[0]?.app : h?.app;
    return opts.host ?? app;
  })();
  const b = (globs) => globs.map((g) => `${opts.base ?? ""}${g}`);
  const tag = opts.base ? ` (${opts.base.replace(/\/$/, "")})` : "";
  const ign = opts.ignores?.length ? { ignores: [...opts.ignores] } : {};
  const out = [
    {
      name: `uxp-lint/js${tag}`,
      files: b(JS_FILES),
      ...ign,
      plugins: { [PREFIX]: plugin, ...opts.tsPlugin ? { "@typescript-eslint": opts.tsPlugin } : {} },
      settings,
      languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } }, ...opts.tsParser ? { parser: opts.tsParser } : {} },
      rules: hostRules(manifestHost, strict)
    }
  ];
  if (opts.css) out.push({ name: `uxp-lint/css${tag}`, files: b(CSS_FILES), ...ign, plugins: { [PREFIX]: plugin, css: opts.css }, language: "css/css", settings, rules: strict ? CSS_STRICT : CSS_RULES });
  if (opts.htmlParser) out.push({ name: `uxp-lint/html${tag}`, files: b(HTML_FILES), ...ign, plugins: { [PREFIX]: plugin }, languageOptions: { parser: opts.htmlParser }, settings, rules: HTML_RULES });
  if (opts.json) out.push({ name: `uxp-lint/manifest${tag}`, files: b(MANIFEST_FILES), ...ign, plugins: { [PREFIX]: plugin, json: opts.json }, language: "json/json", rules: MANIFEST_RULES });
  return out;
}
var preset = (name, host, strict) => ({
  name: `uxp-lint/${name}`,
  files: JS_FILES,
  plugins: { [PREFIX]: plugin },
  rules: hostRules(host, strict)
});
plugin.configs = {
  recommended: preset("recommended", void 0, false),
  strict: preset("strict", void 0, true),
  photoshop: preset("photoshop", "PS", false),
  indesign: preset("indesign", "ID", false),
  premierepro: preset("premierepro", "premierepro", false),
  "photoshop-strict": preset("photoshop-strict", "PS", true),
  "indesign-strict": preset("indesign-strict", "ID", true),
  "premierepro-strict": preset("premierepro-strict", "premierepro", true),
  css: { name: "uxp-lint/css", files: CSS_FILES, plugins: { [PREFIX]: plugin }, language: "css/css", rules: CSS_RULES },
  html: { name: "uxp-lint/html", files: HTML_FILES, plugins: { [PREFIX]: plugin }, rules: HTML_RULES },
  manifest: { name: "uxp-lint/manifest", files: MANIFEST_FILES, plugins: { [PREFIX]: plugin }, language: "json/json", rules: MANIFEST_RULES }
};
var index_default = plugin;
export {
  buildConfig,
  checkCss,
  checkCssValue,
  compareVersions,
  index_default as default,
  rules,
  uxpForHost
};
