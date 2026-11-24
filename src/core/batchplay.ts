/** Helpers for the batchPlay inspector: plain-language descriptor summaries and code generation. */

function refText(r: any): string {
  if (!r || typeof r !== 'object') return String(r);
  const what = r._ref || 'object';
  if (r._property) return `property "${r._property}"`;
  if (r._enum === 'ordinal') return `the ${r._value === 'targetEnum' ? 'selected/active' : r._value} ${what}`;
  if (r._id != null) return `${what} id ${r._id}`;
  if (r._name != null) return `${what} "${r._name}"`;
  if (r._index != null) return `${what} at index ${r._index}`;
  if (r._offset != null) return `${what} offset ${r._offset}`;
  return what;
}

export function describeDescriptor(d: any): string {
  if (!d || typeof d !== 'object') return 'Not a descriptor';
  const evt = d._obj || '(no _obj)';
  const t = d._target ?? d.null;
  const refs = Array.isArray(t) ? t : t ? [t] : [];
  const prop = refs.find((r: any) => r && r._property);
  const rest = refs.filter((r: any) => r && !r._property);
  let s = `${evt}`;
  if (rest.length) s += ` → ${rest.map(refText).join(' in ')}`;
  if (prop) s += ` · ${refText(prop)}`;
  if (d.to && typeof d.to === 'object') {
    const keys = Object.keys(d.to).filter((k) => k !== '_obj');
    if (keys.length) s += ` · set ${keys.join(', ')}`;
  }
  if (d._options?.dialogOptions) s += ` · dialog: ${d._options.dialogOptions}`;
  return s;
}

export const READ_ONLY_EVENTS = new Set(['get']);

/** Code that replays descriptors. Wrapped in an async function: UXP scripts cannot use top-level await. */
export function batchPlayCode(descriptors: any[], options: any = {}, commandName = 'My command'): string {
  const json = JSON.stringify(descriptors, null, 2).replace(/\n/g, '\n    ');
  const opts = options && Object.keys(options).length ? JSON.stringify(options) : '{}';
  const modifies = descriptors.some((d) => d && !READ_ONLY_EVENTS.has(d._obj));
  if (!modifies) {
    return `const { action } = require("photoshop");\n\nasync function run() {\n  const result = await action.batchPlay(${json.replace(/\n {4}/g, '\n  ')}, ${opts});\n  console.log(result);\n  return result;\n}\n\nrun();\n`;
  }
  return `const { action, core } = require("photoshop");\n\nasync function run() {\n  try {\n    const result = await core.executeAsModal(\n      () => action.batchPlay(${json.replace(/\n {4}/g, '\n      ')}, ${opts}),\n      { commandName: ${JSON.stringify(commandName)} }\n    );\n    console.log(result);\n    return result;\n  } catch (e) {\n    console.error(e);\n  }\n}\n\nrun();\n`;
}
