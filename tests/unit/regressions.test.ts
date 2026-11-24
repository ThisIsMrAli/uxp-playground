/**
 * Regressions from the real-plugin corpus (samples/corpus.json in uxp-tools/playground): each test reproduces,
 * in a few lines, a pattern from a real plugin that failed in the playground before hardening.
 * Sources are named in the test titles (Adobe samples, GitHub plugins, forums.creativeclouddeveloper.com threads).
 */
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildPreview } from '../../src/core/buildPreview';
import type { Project } from '../../src/core/types';

const assets = {
  runtime: readFileSync(resolve('src/runtime/runtime.js'), 'utf8'),
  panelCss: readFileSync(resolve('src/runtime/panel.css'), 'utf8'),
  shimCss: readFileSync(resolve('src/runtime/shim.css'), 'utf8'),
  vendor: readFileSync(resolve('src/generated/react-bundle.js'), 'utf8'),
  psApi: JSON.parse(readFileSync(resolve('src/generated/ps-api.json'), 'utf8'))
};

function plugin(files: Record<string, string>, manifestExtra: Record<string, unknown> = {}): Project {
  const manifest = { manifestVersion: 5, id: 'reg', name: 'Reg', version: '1.0.0', main: 'index.html', host: { app: 'PS', minVersion: '24.4.0' }, entrypoints: [{ type: 'panel', id: 'panel' }], ...manifestExtra };
  return { v: 1, name: 'reg', target: { app: 'PS', uxp: '9.2' }, theme: 'dark', size: null, files: { 'manifest.json': JSON.stringify(manifest), ...files }, active: 'index.js' };
}
function run(p: Project) {
  const build = buildPreview(p, assets);
  const messages: any[] = [];
  const dom = new JSDOM(build.html, {
    runScripts: 'dangerously',
    beforeParse(win) {
      Object.defineProperty(win, 'parent', { value: { postMessage: (m: any) => messages.push(m) } });
    }
  });
  const of = (type: string) => messages.filter((m) => m.type === type).map((m) => m.payload);
  return { win: dom.window as any, build, messages, of, errors: () => of('error').map((e) => e.message), notes: () => of('host-call').filter((h) => h.note).map((h) => h.note as string) };
}
const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const html = (body = '', head = '<script src="index.js"></script>') => `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;

describe('real-plugin regressions', () => {
  it('scripts in <head> can query body elements (Adobe hello-world-panel, layer-creation, vanilla, oauth…)', async () => {
    const r = run(plugin({ 'index.html': html('<sp-button id="btn">Go</sp-button>'), 'index.js': 'document.getElementById("btn").addEventListener("click", () => { window.clicked = true; });' }));
    await tick();
    r.win.document.getElementById('btn').click();
    expect(r.win.clicked).toBe(true);
    expect(r.errors()).toEqual([]);
  });

  it('`global` exists, like in UXP (Adobe ui-react-starter: global.screen = {})', async () => {
    const r = run(plugin({ 'index.html': html('', '<script>global.screen = {}; window.ok = global === window;</script>'), 'index.js': '' }));
    await tick();
    expect(r.win.ok).toBe(true);
    expect(r.errors()).toEqual([]);
  });

  it('panel show(event) receives event.node (PanelController pattern from Adobe React starters)', async () => {
    const r = run(
      plugin({
        'index.html': html('', '<script src="index.js"></script>'),
        'index.js': `require('uxp').entrypoints.setup({ panels: { panel: { show(event) { const d = document.createElement('div'); d.id = 'mounted'; event.node.appendChild(d); } } } });`
      })
    );
    await tick(60);
    expect(r.win.document.getElementById('mounted')).not.toBeNull();
    expect(r.errors()).toEqual([]);
  });

  it('entrypoints.getPanel menu items can be checked and disabled (io-websocket-example)', async () => {
    const r = run(
      plugin({
        'index.html': html(),
        'index.js': `const { entrypoints } = require('uxp');
          entrypoints.setup({ panels: { panel: { menuItems: [{ id: 'live', label: 'Live' }], invokeMenu() {} } } });
          const item = entrypoints.getPanel('panel').menuItems.getItem('live');
          item.checked = true; item.enabled = false;
          window.label = entrypoints.getPanel('panel').menuItems.getItem('live').label;`
      })
    );
    await tick();
    expect(r.win.label).toBe('Live');
    const last = r.of('entrypoints').pop();
    expect(last.menus.panel[0]).toMatchObject({ id: 'live', checked: true, enabled: false });
  });

  it('sp-picker value can be set and <dialog>.uxpShowModal exists (NickSchirripa/texture-blend)', async () => {
    const r = run(
      plugin({
        'index.html': html('<sp-picker id="p"><sp-menu slot="options"><sp-menu-item value="a">A</sp-menu-item><sp-menu-item value="b">B</sp-menu-item></sp-menu></sp-picker><dialog id="d"></dialog>'),
        'index.js': `document.getElementById('p').value = 'b'; window.v = document.getElementById('p').value; window.hasModal = typeof document.getElementById('d').uxpShowModal === 'function';`
      })
    );
    await tick();
    expect(r.win.v).toBe('b');
    expect(r.win.hasModal).toBe(true);
  });

  it('document.theme.getCurrent() and onUpdated (tokyosheep/PhotoshopUXPMulti-window)', async () => {
    const r = run(plugin({ 'index.html': html(), 'index.js': `window.t = document.theme.getCurrent(); document.theme.onUpdated.addListener((t) => (window.t2 = t));` }));
    await tick();
    expect(r.win.t).toBe('dark');
    r.win.__pgSetTheme('light');
    expect(r.win.t2).toBe('light');
  });

  it('layer bounds have right/bottom and the document descriptor has mode (mbloflin FitLayerToCanvas, kjepo/skin)', async () => {
    const r = run(
      plugin({
        'index.html': html(),
        'index.js': `const { app, action } = require('photoshop');
          window.result = (async () => {
            const b = app.activeDocument.activeLayers[0].bounds;
            const [d] = await action.batchPlay([{ _obj: 'get', _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }], {});
            return { right: b.right, bottom: b.bottom, mode: d.mode && d.mode._value };
          })();`
      })
    );
    const res = await r.win.result;
    expect(typeof res.right).toBe('number');
    expect(typeof res.bottom).toBe('number');
    expect(res.mode).toBe('RGBColor');
  });

  it('enforces the modal scope with Photoshop\'s wording, and allows the same call inside executeAsModal (forum 11898, 5352)', async () => {
    const r = run(
      plugin({
        'index.html': html(),
        'index.js': `const { app, core } = require('photoshop');
          window.result = (async () => {
            const out = {};
            try { app.activeDocument.activeLayers[0].visible = false; } catch (e) { out.outside = e.message; }
            await core.executeAsModal(async () => { app.activeDocument.activeLayers[0].visible = false; }, { commandName: 'Hide' });
            out.visible = app.activeDocument.activeLayers[0].visible;
            return out;
          })();`
      })
    );
    const res = await r.win.result;
    expect(res.outside).toBe('Event: set may modify the state of Photoshop. Such events are only allowed from inside a modal scope.');
    expect(res.visible).toBe(false);
  });

  it('apiVersion 1 plugins (host.minVersion < 23) are not forced into a modal scope', async () => {
    const r = run(plugin({ 'index.html': html(), 'index.js': `const { app } = require('photoshop'); app.activeDocument.activeLayers[0].name = 'ok'; window.n = app.activeDocument.activeLayers[0].name;` }, { host: { app: 'PS', minVersion: '22.0.0' } }));
    await tick();
    expect(r.win.n).toBe('ok');
    expect(r.notes().some((n) => /apiVersion 1/.test(n))).toBe(true);
  });

  it('permission checks apply to manifest v5 only (Adobe layer-creation and typescript-webpack are manifest v4)', async () => {
    const code = `window.result = require('uxp').shell.openExternal('https://example.com').then(() => 'opened', (e) => e.message);`;
    const v4 = run(plugin({ 'index.html': html(), 'index.js': code }, { manifestVersion: 4 }));
    const v5 = run(plugin({ 'index.html': html(), 'index.js': code }));
    expect(await v4.win.result).toBe('opened');
    expect(await v5.win.result).toMatch(/add "https" to requiredPermissions\.launchProcess\.schemes/);
  });

  it('imaging.getPixels needs a modal scope; imageData is disposable and encodable (WasmUXP, forum 6725)', async () => {
    const r = run(
      plugin({
        'index.html': html(),
        'index.js': `const { app, core, imaging } = require('photoshop');
          window.result = (async () => {
            const out = {};
            try { await imaging.getPixels({ documentID: app.activeDocument.id }); } catch (e) { out.outside = e.message; }
            await core.executeAsModal(async () => {
              const px = await imaging.getPixels({ documentID: app.activeDocument.id, targetSize: { height: 20 } });
              out.h = px.imageData.height;
              out.len = (await px.imageData.getData()).length;
              px.imageData.dispose();
              out.hasDisposeOnResult = typeof px.dispose;
            }, { commandName: 'Read' });
            return out;
          })();`
      })
    );
    const res = await r.win.result;
    expect(res.outside).toMatch(/inside executeAsModal/);
    expect(res.h).toBe(20);
    expect(res.len).toBeGreaterThan(0);
    expect(res.hasDisposeOnResult).toBe('undefined'); // as in Photoshop: dispose() lives on imageData, not on the result
  });

  it('window.ImageBlob validates raw pixel buffers (digital-black-and-white/uxp-ps-imaging-bug)', async () => {
    const r = run(
      plugin({
        'index.html': html(),
        'index.js': `window.out = {};
          try { new ImageBlob(new ArrayBuffer(10), { type: 'image/uncompressed', width: 2, height: 2, colorSpace: 'RGB', pixelFormat: 'RGB', components: 3, componentSize: 8, hasAlpha: false }); } catch (e) { out.size = e.message; }
          out.png = new ImageBlob(new Uint8Array([137, 80, 78, 71]).buffer, { type: 'image/png' }).type;`
      })
    );
    await tick();
    expect(r.win.out.size).toMatch(/does not match/);
    expect(r.win.out.png).toBe('image/png');
  });

  it('Document.colorSamplers, Layers.add() and batchPlay make textLayer work (kjepo/skin, Adobe vanilla-js and layer-creation)', async () => {
    const r = run(
      plugin({
        'index.html': html(),
        'index.js': `const { app, core, action } = require('photoshop');
          window.result = core.executeAsModal(async () => {
            const doc = app.activeDocument;
            doc.colorSamplers.add({ x: 10, y: 20 });
            const s = doc.colorSamplers[0];
            const before = doc.layers.length;
            await doc.layers.add();
            await action.batchPlay([{ _obj: 'make', _target: [{ _ref: 'textLayer' }], using: { _obj: 'textLayer', textKey: 'Hi there' } }], {});
            return { samplers: doc.colorSamplers.length, x: s.position.x, red: typeof s.color.rgb.red, added: doc.layers.length - before, text: doc.activeLayers[0].textItem && doc.activeLayers[0].textItem.contents };
          }, { commandName: 'Test' });`
      })
    );
    const res = await r.win.result;
    expect(res).toEqual({ samplers: 1, x: 10, red: 'number', added: 2, text: 'Hi there' });
  });

  it('flags APIs that are not in the Photoshop typings instead of failing silently (yuanchen1103 activeLayer, forum 4869 layerTree)', async () => {
    const r = run(plugin({ 'index.html': html(), 'index.js': `window.v = require('photoshop').app.activeDocument.activeLayer;` }));
    await tick();
    expect(r.win.v).toBeUndefined();
    expect(r.of('host-call').some((h) => h.unsupported && /activeLayer.*not in the Photoshop API typings/.test(h.note))).toBe(true);
  });

  it('explains top-level await (forum 5196, 8831, 6861, 4967)', async () => {
    const r = run(plugin({ 'index.html': html(), 'index.js': `const { app } = require('photoshop');\nawait app.showAlert('x');` }));
    await tick();
    expect(r.errors().join('\n')).toMatch(/top-level await is a syntax error there too/);
  });

  it('reports a syntax error once, at build time, with its line (forum 2317)', async () => {
    const r = run(plugin({ 'index.html': html(), 'index.js': `import x from './y';\nconst a = {b: 1 c: 2};` }));
    await tick();
    expect(r.build.compileErrors).toHaveLength(1);
    expect(r.build.compileErrors[0].line).toBe(2);
    expect(r.build.compileErrors[0].message).not.toMatch(/^Error transforming/);
    expect(r.errors()).toEqual([]);
  });

  it('describes non-Error rejections such as failed XHRs (Adobe oauth-workflow-sample)', async () => {
    // jsdom does not fire unhandledrejection itself, so the test dispatches the event a browser would.
    const r = run(plugin({ 'index.html': html(), 'index.js': `const ev = new Event('unhandledrejection'); ev.reason = new ProgressEvent('error'); window.dispatchEvent(ev);` }));
    await tick();
    expect(r.errors()[0]).toMatch(/ProgressEvent "error"/);
  });

  it('headless plugins (main is a .js file) still run and expose their commands (Adobe direct-action-js-sample)', async () => {
    const p = plugin({ 'index.js': `require('uxp').entrypoints.setup({ commands: { writelayers: () => { window.ran = true; } } });` }, { main: 'index.js', entrypoints: [{ type: 'command', id: 'writelayers', label: 'Write layers' }] });
    const r = run(p);
    expect(r.build.headless).toBe(true);
    await tick();
    expect(r.of('entrypoints')[0].commands).toEqual(['writelayers']);
    r.win.__pg.invokeCommand('writelayers');
    await tick();
    expect(r.win.ran).toBe(true);
    expect(r.win.document.querySelector('.pg-headless')).not.toBeNull();
  });

  it('remote module scripts keep type="module" (Adobe oauth-workflow-sample loads Spectrum from jspm.dev)', () => {
    const b = buildPreview(plugin({ 'index.html': html('', '<script src="https://jspm.dev/x.js" type="module"></script>'), 'index.js': '' }), assets);
    expect(b.html).toContain('<script src="https://jspm.dev/x.js" type="module"></script>');
  });
});
