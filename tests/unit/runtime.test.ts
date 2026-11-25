import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { buildPreview } from '../../src/core/buildPreview';
import type { PreviewScenario } from '../../src/core/scenarios';
import { templateById } from '../../src/core/templates';
import type { Project } from '../../src/core/types';

const assets = {
  runtime: readFileSync(resolve('src/runtime/runtime.js'), 'utf8'),
  panelCss: readFileSync(resolve('src/runtime/panel.css'), 'utf8'),
  shimCss: readFileSync(resolve('src/runtime/shim.css'), 'utf8'),
  vendor: readFileSync(resolve('src/generated/react-bundle.js'), 'utf8'),
  psApi: JSON.parse(readFileSync(resolve('src/generated/ps-api.json'), 'utf8'))
};

function boot(p: Project, scenario?: PreviewScenario) {
  const { html } = buildPreview(p, assets, scenario);
  const messages: any[] = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    beforeParse(win) {
      Object.defineProperty(win, 'parent', { value: { postMessage: (m: any) => messages.push(m) } });
      (win as any).fetch = async (u: string) => ({ ok: true, url: u });
    }
  });
  return { win: dom.window as any, messages, hostCalls: () => messages.filter((m) => m.type === 'host-call').map((m) => m.payload) };
}
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

function withScript(js: string, perms: Record<string, unknown> = {}): Project {
  const p = templateById('hello').build();
  const m = JSON.parse(p.files['manifest.json']);
  m.requiredPermissions = perms;
  p.files['manifest.json'] = JSON.stringify(m);
  p.files['index.js'] = js;
  p.files['index.html'] = '<html><body><div id="out"></div><script src="index.js"></script></body></html>';
  return p;
}

describe('preview runtime (jsdom)', () => {
  it('runs the hello template and registers its command', async () => {
    const { win, messages } = boot(templateById('hello').build());
    await tick();
    expect(win.document.querySelector('sp-heading').textContent).toBe('Hello UXP');
    expect(messages.find((m) => m.type === 'entrypoints').payload.commands).toEqual(['sayHello']);
    expect(messages.some((m) => m.type === 'console' && String(m.payload.args[0]).includes('Panel shown'))).toBe(true);
    win.document.querySelector('#name').value = 'Ali';
    win.document.querySelector('#greet').click();
    expect(win.document.querySelector('#out').textContent).toBe('Hello, Ali!');
  });

  it('rejects state-changing batchPlay outside executeAsModal with the Photoshop wording', async () => {
    const { win, hostCalls } = boot(withScript(`
      const { action, core, app } = require('photoshop');
      window.result = (async () => {
        const out = {};
        try { await action.batchPlay([{ _obj: 'set', _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }], to: { _obj: 'layer', name: 'X' } }], {}); }
        catch (e) { out.error = e.message; }
        await core.executeAsModal(() => action.batchPlay([{ _obj: 'set', _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }], to: { _obj: 'layer', name: 'Renamed' } }], {}), { commandName: 'Rename' });
        const [got] = await action.batchPlay([{ _obj: 'get', _target: [{ _property: 'name' }, { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }] }], {});
        out.name = got.name;
        out.layers = app.activeDocument.layers.map(l => l.name);
        return out;
      })();`));
    const r = await win.result;
    expect(r.error).toBe('Event: set may modify the state of Photoshop. Such events are only allowed from inside a modal scope.');
    expect(r.name).toBe('Renamed');
    expect(r.layers).toContain('Renamed');
    const calls = hostCalls();
    expect(calls.some((c: any) => c.fn === 'core.executeAsModal')).toBe(true);
    expect(calls.some((c: any) => c.fn === 'action.batchPlay' && c.modal === 'Rename')).toBe(true);
  });

  it('enforces manifest permissions for pickers, openExternal and fetch', async () => {
    const js = `
      const { storage, shell } = require('uxp');
      window.result = (async () => {
        const out = {};
        try { await storage.localFileSystem.getFileForSaving('a.txt'); out.fs = 'ok'; } catch (e) { out.fs = e.message; }
        try { await shell.openExternal('https://adobe.com'); out.open = 'ok'; } catch (e) { out.open = e.message; }
        try { await fetch('https://example.com/x'); out.fetch = 'ok'; } catch (e) { out.fetch = e.message; }
        return out;
      })();`;
    const denied = await boot(withScript(js)).win.result;
    expect(denied.fs).toMatch(/localFileSystem/);
    expect(denied.open).toMatch(/launchProcess/);
    expect(denied.fetch).toMatch(/network\.domains/);
    const { win } = boot(withScript(js, { localFileSystem: 'request', launchProcess: { schemes: ['https'] } }));
    const allowed = await win.result;
    expect(allowed.fs).toBe('ok');
    expect(allowed.open).toBe('ok');
  });

  it('matches wildcard network domains like UXP manifests', () => {
    const { win } = boot(withScript('', { network: { domains: ['https://*.adobe.com', 'https://example.org'] } }));
    expect(win.__pg.domainAllowed('https://developer.adobe.com/x')).toBe(true);
    expect(win.__pg.domainAllowed('https://adobe.com')).toBe(true);
    expect(win.__pg.domainAllowed('https://evil-adobe.com')).toBe(false);
    expect(win.__pg.domainAllowed('http://example.org')).toBe(false);
    expect(win.__pg.domainAllowed('https://example.org/a')).toBe(true);
  });

  it('keeps the Premiere host name used by cross-host bundles and simulates importing a temporary file', async () => {
    const p = templateById('premiere-sequence').build();
    p.files['index.js'] = `
      const { host, storage } = require('uxp');
      window.result = (async () => {
        const { Project } = require(host.name.toLowerCase());
        const project = await Project.getActiveProject();
        const folder = await storage.localFileSystem.getTemporaryFolder();
        const entry = await folder.createFile('captions.srt');
        await entry.write('Caption text');
        return [
          await project.importFiles([entry.nativePath], true),
          await project.importFiles(['/missing.srt'], true),
          await project.importFiles([folder.nativePath], true)
        ];
      })();
    `;
    const { win, hostCalls } = boot(p);
    expect(await win.result).toEqual([true, false, false]);
    expect(hostCalls().filter((c: any) => c.fn === 'Project.importFiles').map((c: any) => c.result)).toEqual([true, false, false]);
  });

  it('exports sample marker CSV with CRLF and escaped comments', async () => {
    const { win, messages } = boot(templateById('premiere-marker-csv').build());
    win.document.getElementById('save').click();
    await tick();
    expect(win.document.getElementById('status').textContent).toBe('Saved review-markers.csv.');
    expect(messages.find(m => m.type === 'file-written')?.payload.content).toBe(
      'seconds,name,comments\r\n0.000,"Opening","Start with the wide shot"\r\n' +
      '23.500,"Review cut","Check the music, then confirm ""approved"""\r\n'
    );
    win.close();
  });

  it.each([
    ['empty-sequence', 'No sequence markers to export.'],
    ['no-active-sequence', 'Open a sequence first.']
  ] as const)('reports the %s marker scenario without writing a file', async (scenario, status) => {
    const { win, messages } = boot(templateById('premiere-marker-csv').build(), scenario);
    win.document.getElementById('save').click();
    await tick();
    expect(win.document.getElementById('status').textContent).toBe(status);
    expect(messages.some(m => m.type === 'file-written')).toBe(false);
    win.close();
  });

  it('validates review notes and writes distinct markers in one Premiere transaction', async () => {
    const { win, hostCalls } = boot(templateById('premiere-review-notes').build());
    const notes = win.document.getElementById('notes');
    const sample = notes.value;
    const status = win.document.getElementById('status');
    const apply = win.document.getElementById('apply');
    notes.value = sample + '\n60:99 | Invalid';
    apply.click();
    await tick();
    expect(status.textContent).toBe('Check the timestamp and title on line 3.');
    expect(hostCalls().filter((call: any) => call.fn === 'Project.executeTransaction')).toHaveLength(0);
    notes.value = sample;
    apply.click();
    await tick();
    expect(status.textContent).toBe('Added 2 sequence markers.');
    expect(hostCalls().filter((call: any) => call.fn === 'Project.executeTransaction')).toHaveLength(1);
    expect(hostCalls().filter((call: any) => call.fn === 'Markers.createAddMarkerAction').map((call: any) => call.args[0])).toEqual(['Opening pace', 'Check lower third']);
    apply.click();
    await tick();
    expect(status.textContent).toBe('These review markers are already on the sequence.');
    win.close();
  });

  it('scans and moves the sample media, creating only its missing bin', async () => {
    const { win, hostCalls } = boot(templateById('premiere-organize-bins').build());
    const scan = win.document.getElementById('preview');
    const apply = win.document.getElementById('apply');
    const status = win.document.getElementById('status');
    expect(apply.disabled).toBe(true);
    scan.click();
    await tick();
    expect(status.textContent).toBe('3 moves ready.');
    expect(win.document.getElementById('output').textContent).toContain('Title still.png → Stills');
    expect(hostCalls().filter((call: any) => call.fn === 'Project.executeTransaction')).toHaveLength(0);
    apply.click();
    await tick();
    expect(status.textContent).toBe('Moved 3 items.');
    expect(hostCalls().filter((call: any) => call.fn === 'FolderItem.createBinAction').map((call: any) => call.args)).toEqual([['Stills']]);
    scan.click();
    await tick();
    expect(status.textContent).toBe('No recognized media at the project root.');
    win.close();
  });

  it('resolves relative requires and JSON, and explains missing npm packages', async () => {
    const p = withScript(`
      const util = require('./lib/util');
      const data = require('./data.json');
      let err; try { require('lodash'); } catch (e) { err = e.message; }
      window.result = { sum: util.add(2, 3), name: data.name, err };`);
    p.files['lib/util.js'] = 'exports.add = (a, b) => a + b;';
    p.files['data.json'] = '{"name":"cfg"}';
    const { win } = boot(p);
    expect(win.result.sum).toBe(5);
    expect(win.result.name).toBe('cfg');
    expect(win.result.err).toMatch(/need the project bundler/);
  });

  it('renders the React template with the vendored React', async () => {
    const { win } = boot(templateById('react').build());
    await tick(50);
    const text = win.document.getElementById('root').textContent;
    expect(text).toContain('React panel');
    expect(text).toContain('Layers (4)');
  });

  it('approximates sp-* widgets with working values and events', async () => {
    const { win } = boot(withScript(''));
    const d = win.document;
    d.body.innerHTML = '<sp-checkbox id="c">A</sp-checkbox><sp-picker id="p"><sp-menu slot="options"><sp-menu-item value="a">A</sp-menu-item><sp-menu-item value="b">B</sp-menu-item></sp-menu></sp-picker><sp-slider id="s" min="0" max="10" value="4"></sp-slider><sp-textfield id="t" value="hi"></sp-textfield>';
    let changes = 0;
    d.getElementById('c').addEventListener('change', () => changes++);
    d.getElementById('c').click();
    expect(d.getElementById('c').checked).toBe(true);
    expect(changes).toBe(1);
    d.querySelectorAll('sp-menu-item')[1].click();
    expect(d.getElementById('p').value).toBe('b');
    expect(d.getElementById('s').value).toBe(4);
    expect(d.getElementById('t').value).toBe('hi');
  });

  it('runs registered commands on request', async () => {
    const { win, hostCalls } = boot(templateById('hello').build());
    await tick();
    win.__pg.invokeCommand('sayHello');
    await tick();
    await tick();
    expect(hostCalls().some((c: any) => c.fn === 'app.showAlert')).toBe(true);
    expect(win.document.querySelector('.pg-host-alert-msg').textContent).toBe('Hello from a command!');
  });
});
