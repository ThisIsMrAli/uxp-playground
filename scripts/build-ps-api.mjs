// Builds src/generated/ps-api.json from @types/photoshop: enum values for photoshop.constants and the
// member names of the DOM classes and core/action/imaging namespaces. The preview uses it to return the
// real constant strings and to tell "exists in Photoshop but not simulated" from "not a Photoshop API".
import ts from 'typescript';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dom = resolve(root, 'node_modules/@types/photoshop/dom');
const pkg = JSON.parse(readFileSync(resolve(root, 'node_modules/@types/photoshop/package.json'), 'utf8'));
const parse = (f) => ts.createSourceFile(f, readFileSync(resolve(dom, f), 'utf8'), ts.ScriptTarget.Latest, true);

const constants = {};
ts.forEachChild(parse('Constants.d.ts'), (n) => {
  if (!ts.isEnumDeclaration(n)) return;
  const e = {};
  for (const m of n.members) {
    const name = m.name.getText();
    const init = m.initializer;
    e[name] = init && ts.isStringLiteral(init) ? init.text : init && ts.isNumericLiteral(init) ? Number(init.text) : init ? init.getText() : name;
  }
  constants[n.name.text] = e;
});

function classMembers(file, cls) {
  const out = {};
  ts.forEachChild(parse(file), (n) => {
    if ((ts.isClassDeclaration(n) || ts.isInterfaceDeclaration(n)) && n.name?.text === cls) {
      for (const m of n.members) if (m.name && !m.name.getText().startsWith('_') && !m.name.getText().startsWith('#')) out[m.name.getText()] = ts.isMethodDeclaration(m) || ts.isMethodSignature(m) ? 'm' : 'p';
    }
  });
  return out;
}
function namespaceMembers(file, ns) {
  const out = {};
  ts.forEachChild(parse(file), (n) => {
    if (ts.isModuleDeclaration(n) && n.name.text === ns && n.body && ts.isModuleBlock(n.body)) {
      for (const s of n.body.statements) {
        if (ts.isFunctionDeclaration(s) && s.name) out[s.name.text] = 'm';
        if (ts.isVariableStatement(s)) s.declarationList.declarations.forEach((d) => (out[d.name.getText()] = 'p'));
      }
    }
  });
  return out;
}

const members = {
  'photoshop.app': classMembers('Photoshop.d.ts', 'Photoshop'),
  'photoshop.Document': classMembers('Document.d.ts', 'Document'),
  'photoshop.Layer': classMembers('Layer.d.ts', 'Layer'),
  'photoshop.core': namespaceMembers('CoreModules.d.ts', 'photoshopCore'),
  'photoshop.action': namespaceMembers('CoreModules.d.ts', 'photoshopAction'),
  'photoshop.imaging': namespaceMembers('ImagingModule.d.ts', 'imaging')
};
mkdirSync(resolve(root, 'src/generated'), { recursive: true });
writeFileSync(resolve(root, 'src/generated/ps-api.json'), JSON.stringify({ source: `@types/photoshop ${pkg.version}`, constants, members }));
console.log('ps-api:', Object.keys(constants).length, 'enums;', Object.entries(members).map(([k, v]) => `${k} ${Object.keys(v).length}`).join(', '));
