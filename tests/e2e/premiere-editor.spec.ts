import { expect, test } from '@playwright/test';
import { fresh } from './helpers';

test('the Premiere suggestion menu displays and inserts a marker API completion', async ({ page }) => {
  await fresh(page, '#template=premiere-markers');
  await page.evaluate(() => {
    const editor = (window as any).__pgEditor;
    (window as any).__pgReveal('index.js', 1, 1);
    const model = editor.getModel();
    const method = model.findMatches('Markers.getMarkers(sequence)', false, false, true, null, false)[0].range;
    editor.setSelection({
      startLineNumber: method.startLineNumber,
      endLineNumber: method.startLineNumber,
      startColumn: method.startColumn + 'Markers.'.length,
      endColumn: method.startColumn + 'Markers.getMarkers'.length
    });
    editor.revealLineInCenter(method.startLineNumber);
  });
  await page.keyboard.type('getM');
  // Explicitly open suggestions without depending on OS shortcuts or typing timing.
  await page.evaluate(() => (window as any).__pgEditor.trigger('test', 'editor.action.triggerSuggest', {}));
  const widget = page.locator('.suggest-widget.visible');
  await expect(widget.getByRole('listitem', { name: 'getMarkers, Function' })).toBeVisible();
  await expect(widget.locator(':scope > .tree')).toHaveCSS('padding-bottom', '0px');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__pgEditor.getModel().getValue())).toContain('Markers.getMarkers(sequence)');
});

test('Premiere has typed JavaScript completions and warns about APIs newer than the manifest', async ({ page }) => {
  await fresh(page, '#template=premiere-sequence');
  const code = [
    'const ppro = require("premierepro");',
    'function newApis(tick, fps, display) {',
    '  const timecode = ppro.TickTime.timeToTimecode(tick, fps, display);',
    '  const { purgeMediaCache } = ppro.MediaManager;',
    '  return [timecode, purgeMediaCache, new ppro.TimeDisplay()];',
    '}',
    'async function edit() {',
    '  const project = await ppro.Project.getActiveProject();',
    '  project.lockedAccess(async () => {});',
    '  return newApis;',
    '}',
    'console.log(edit, { timeToTimecode() {} }.timeToTimecode());'
  ].join('\n');
  await page.evaluate((text) => {
    const api = (window as any).uxpPlayground;
    const project = api.getProject();
    api.setProject({ ...project, files: { ...project.files, 'index.js': text }, active: 'index.js' });
  }, code);

  const declarations = () => page.evaluate(async () => {
    const monaco = (window as any).__pgMonaco;
    const model = monaco.editor.getModel(monaco.Uri.file('/index.js'));
    const getWorker = await monaco.typescript.getJavaScriptWorker();
    const worker = await getWorker(model.uri);
    const text = model.getValue();
    const position = text.indexOf('ppro.TickTime.') + 'ppro.TickTime.'.length;
    const completions = await worker.getCompletionsAtPosition(model.uri.toString(), position, {});
    const hover = await worker.getQuickInfoAtPosition(model.uri.toString(), text.indexOf('timeToTimecode') + 1);
    return {
      methods: completions?.entries?.some((entry: { name: string }) => entry.name === 'createWithSeconds'),
      docs: hover?.documentation?.map((part: { text: string }) => part.text).join('')
    };
  });
  await expect.poll(declarations).toMatchObject({ methods: true, docs: expect.stringContaining('current display format') });

  await page.getByTestId('tab-problems').click();
  const problems = page.getByTestId('panel-problems');
  await expect(problems.getByText(/TickTime.timeToTimecode requires Premiere Pro 27.0/)).toHaveCount(1);
  await expect(problems).toContainText('MediaManager.purgeMediaCache requires Premiere Pro 26.5');
  await expect(problems).toContainText('Constructing TimeDisplay requires Premiere Pro 27.0');
  await expect(problems).toContainText('Project.lockedAccess requires a synchronous callback');

  await page.evaluate(() => {
    const api = (window as any).uxpPlayground;
    const project = api.getProject();
    const manifest = JSON.parse(project.files['manifest.json']);
    manifest.host.minVersion = '27.0.0';
    api.setProject({ ...project, files: { ...project.files, 'manifest.json': JSON.stringify(manifest) } });
  });
  await expect(problems).not.toContainText('requires Premiere Pro');
  await expect(problems).toContainText('Project.lockedAccess requires a synchronous callback');
});

test('Premiere version checks follow typed imports across TypeScript and JavaScript files', async ({ page }) => {
  await fresh(page, '#template=premiere-sequence');
  await page.evaluate(() => {
    const api = (window as any).uxpPlayground;
    const project = api.getProject();
    api.setProject({
      ...project,
      active: 'rename.js',
      files: {
        ...project.files,
        'timeline.ts': [
          'import type { VideoTrack } from "@adobe/premierepro";',
          'import host from "premierepro";',
          'export async function track(): Promise<VideoTrack> {',
          '  const project = await host.Project.getActiveProject();',
          '  const sequence = await project.getActiveSequence();',
          '  return sequence.getVideoTrack(0);',
          '}'
        ].join('\n'),
        'rename.js': [
          'import { track } from "./timeline";',
          'export async function rename() {',
          '  const result = await track();',
          '  return result.createSetNameAction("Review");',
          '}'
        ].join('\n')
      }
    });
  });
  await page.getByTestId('tab-problems').click();
  await expect(page.getByTestId('panel-problems')).toContainText('VideoTrack.createSetNameAction requires Premiere Pro 26.3');
});
