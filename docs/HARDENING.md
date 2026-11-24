# Hardening report

How UXP Playground was tested against real UXP plugin code, what broke, what changed, and what is still out of reach. All testing ran in headless Chromium (Playwright) and jsdom. **Nothing here was run in Photoshop or another Adobe host**: the preview is a browser approximation, and so is every result below.

## 1. Real-plugin corpus

73 real samples, kept outside this repo in `uxp-tools/playground/samples/`:

| Source | Count | How it was collected |
|---|---|---|
| [AdobeDocs/uxp-photoshop-plugin-samples](https://github.com/AdobeDocs/uxp-photoshop-plugin-samples) @ `d937f1a` | 26 | every sample folder |
| Public GitHub UXP plugins | 15 | repos with a UXP `manifest.json` (asciiwave, gradient-library, photoshop-dithering, texture-blend, uxp-ps-imaging-bug, photoshop-color-unmix, skin, FitLayerToCanvas, WasmUXP, retouch-panel, SaveLayerAsPNG-UXP, PhotoshopUXPMulti-window, documentBoard, uxp_psdrename, photoshop-filter-all-layers) |
| forums.creativeclouddeveloper.com snippets | 32 | code blocks from Photoshop UXP threads, wrapped in a minimal panel |

- `SAMPLES.md`: the list with a source link per sample. `corpus.json`: the files.
- `harness.mjs` loads each sample through the playground's own import path (`window.uxpPlayground.importFiles`).
  - It then clicks every button in the panel and runs every command.
  - It reads the Console, Host calls and Problems panels, and opens Share.
  - It downloads the plugin zip and checks it the way UDT loads a folder: manifest at the root, `main`, icons (including `@1x`/`@2x` files), and files the HTML references.
- `results-before.json` was measured on the first release (`6438689`) and `results-after.json` on this one. `compare.mjs` prints the comparison.

## 2. What broke (before), by category

| Category | Examples from the corpus | Cause in the playground |
|---|---|---|
| **Import / loader** | 9 samples showed an empty panel. Projects whose `manifest.json` sits next to `src/`, `dist/` or a webpack `HtmlWebpackPlugin` template loaded 1–2 files. | Only the manifest folder was imported. Bundler projects had no entry. Scripts in `<head>` ran before the body existed. |
| **require errors** | `firebase.js` next to the plugin folder; `os`/`fs` modules; `global.screen = {}` (Adobe React starters) | Loose top-level scripts were not imported. `os`, `fs` and `global` were missing. |
| **Mock gaps** | `entrypoints.getPanel`, `show(event)` with `event.node`, menu `checked`/`enabled`, `doc.colorSamplers`, `Layers.add()`, batchPlay `make textLayer`, `window.ImageBlob`, `layer.bounds.right/bottom`, `document.theme`, sp-picker `value`, `<dialog>.uxpShowModal` | Not implemented. |
| **Wrong errors** | Manifest v4 samples (layer-creation, typescript-webpack) were refused permissions. XHR failures showed `[object ProgressEvent]`. Remote-script errors showed `Script error.`. Syntax errors were reported twice. | Manifest v5 permission rules were applied to v4. Rejection reasons and cross-origin errors were not described. |
| **Headless plugins** | direct-action, invisible-plugin (no panel, or `main` is a `.js`) | The preview never reported "ready", and the commands never appeared. |
| **Remote scripts** | oauth-workflow loads Spectrum from jspm.dev with `type="module"` | The `type` attribute was dropped. "ready" waited on the CDN's `load` event. |
| **Zip export** | 39 of 73 zips would be rejected by UDT | Icons, files referenced from HTML, and files with syntax errors were dropped. Entrypoints were required where UXP does not require them. |
| **Share links** | none failed. 16 were over 8,000 characters before, 39 after (§4). | No size feedback, and large binaries were inlined. |
| **GitHub import** | monorepos (several plugins in one repo) | Picking a plugin failed with "No manifest.json in samples/one/": the common folder was stripped before the chosen root was applied. Found by a new unit test. |
| **Layout** | Monaco collapsed to 5 px after the editor became a lazy chunk. Phone toolbar overflowed. Embeds flashed the starter panel before a linked example loaded. | Nested editor host, toolbar wrap, route timing. All found by screenshot review during this work. |

## 3. Fixed

**Runtime and mocks** (`src/runtime/runtime.js`)

- **Scripts and globals**
  - `<head>` scripts run after the body is parsed, as in UXP.
  - `global`, `os`, `fs` and `document.theme` (`getCurrent` / `onUpdated`) are available.
- **Entrypoints**
  - `entrypoints.getPanel` / `getCommand` and `_pluginInfo`.
  - Panel `menuItems` with `checked`, `enabled` and `label` setters.
  - `show(event)` gets `event.node`.
  - Headless plugins (`main: "index.js"`) get a note in the panel, and their commands appear in the sidebar.
- **Photoshop DOM and batchPlay**
  - `Document.colorSamplers` (add, removeAll; colours are sampled from the synthetic image) and `Layers.add()`.
  - batchPlay `make` of a `textLayer` (with `textKey`).
  - Layer `bounds` has `right` and `bottom`; the document descriptor has `mode`.
- **Imaging**
  - `window.ImageBlob` (UXP 7.0+), with the documented byte-length check.
  - Uncompressed pixels render as PNG.
- **Permissions**
  - They apply to manifest v5+ only. Older manifests get a one-time note.
  - `launchProcess` accepts `"*"`.
- **Errors**
  - Unhandled rejections describe the actual reason, e.g. a ProgressEvent from a failed XHR.
  - "Script error." from cross-origin scripts is explained.
  - Compile errors are reported once, with their line.
- **Unsupported APIs**
  - Calls that are not simulated, or are not in the Photoshop typings (`Document.activeLayer`, `layerTree`), are marked in the Host calls log instead of failing silently.

**Import and export** (`src/core/importer.ts`, `github.ts`, `exportZip.ts`)

- **Import**
  - Imports find the plugin folder, the parent's `src/`, build configs and loose scripts.
  - Bundler projects get a marked loader stub and a note.
  - Monorepos list the plugins they contain.
  - GitHub imports download only the chosen plugin.
- **Export**
  - Files with syntax errors are exported unchanged, with a warning, instead of being dropped.
  - CSS and image `import`s become small modules, so the exported plugin needs no bundler.
  - `validatePluginFiles` reports what UDT would reject.

**Remaining zip problems are in the sources themselves** (see §6), not in the export.

## 4. Before → after on the corpus

| Measure (73 samples) | Before | After |
|---|---|---|
| Empty preview | 9 | **0** |
| Samples with runtime errors | 49 | **45** |
| Runtime error lines | 127 | **85** |
| Zips UDT would reject | 39 | **8** |
| Page-level errors | 14 | **10** |
| Harness failures | 0 | 0 |
| Samples with host-call errors / not-simulated calls | 9 / 5 | 12 / 10 |
| Share links over 8,000 characters | 16 | 39 |

- **Host-call errors and not-simulated calls went up** because far more plugin code now runs (whole projects instead of 1–2 files). Each one is logged with the reason.
- **Share links grew for the same reason.** Imports now include icons and licence files, so a typical Adobe sample is 12–20k characters; the largest is 179k (photoshop-dithering, 67 files).
- Links that long work in Chromium/Firefox/Safari address bars because the hash is never sent to a server. Some chat apps truncate them.
- The share dialog shows the size, leaves out binaries over the limit, and offers the short origin link (`#github=…` or `#example=…`) for imported projects.

All 45 samples that still log runtime errors are faithful reproductions, not playground crashes. They are listed in §6.

## 5. Product work (best-in-class pass)

**Compared with:** TypeScript Playground, Vue SFC Playground, Svelte Playground, Figma's Scripter, StackBlitz/CodeSandbox embeds.

**The common bar:**

- the state lives in the URL;
- examples are one click away;
- an embed mode exists for docs (Svelte: `/playground/embed#…`);
- a fast first paint;
- an editor with real types;
- clear errors.

The playground now meets that bar for UXP:

- **First run**
  - A welcome screen with three starts: a panel, a GitHub repo, or an import.
  - It includes the examples gallery and a plain note that the preview is approximate. It appears once.
- **Examples gallery**
  - 10 of Adobe's own samples, pinned to a commit and shipped with their licences, plus 9 starter templates covering:
    - the layers DOM;
    - notifications;
    - imaging;
    - settings storage;
    - flyout menus and commands.
  - Every example has a short link, `#example=<id>`.
- **Embed mode for Adobe docs pages**
  - URL options: `?embed=1`, `view=split|preview|editor`, `readonly`, `theme`, `console`.
  - Embeds never touch the reader's storage, and have an "Open in Playground" link.
  - A `postMessage` API lets a docs page load, run and edit the embedded project.
  - Preview-only embeds skip Monaco and ESLint entirely: 2 files, ~0.21 MB gzip.
  - The starter never flashes while a linked example loads.
- **Import**
  - From a GitHub repo or folder, `.zip`/`.ccx`, a local folder (drag and drop anywhere), a gist, or `playground.json`.
  - Progress and errors are shown.
- **batchPlay inspector**
  - Each call is described in plain language, e.g. `set → the selected/active layer · set name`.
  - Descriptors are shown as a tree, with copy and re-run.
  - "Copy as code" generates replay code that UXP can load: wrapped in an async function, because top-level `await` is a syntax error in UXP scripts, with `executeAsModal` only when the descriptors change state.
- **Workbench**
  - File tree with folders, rename and delete; tabs; resizable, persisted panes.
  - Command palette and file palette, plus shortcuts (`Ctrl/⌘+Shift+/` lists them).
  - Light and dark UI; a phone layout whose views stay mounted, so the preview keeps logging.
  - Empty and error states for a broken manifest or missing packages; a status bar; skip link and ARIA labels; reduced-motion support.
- **Lint integration** (eslint-plugin-uxp-lint 0.2.0, `main` 016da83, 14 rules)
  - Bundled from `dist/uxp-lint.browser.mjs`.
  - The selected UXP version is passed as `settings.uxp.uxpVersion`.
  - Every problem links to its rule page (`meta.docs.url`), and core ESLint rules link to eslint.org.

## 6. Tests

| Suite | Count | Covers |
|---|---|---|
| Unit (vitest + jsdom) | **86** in 6 files | core, runtime, lint (fallback and uxp-lint, docs links, `uxpVersion`), importer (GitHub/gist with mocked fetch, monorepo root), export/share/batchPlay/palette, and **19 regressions named after the real samples** they came from |
| End-to-end (Playwright, headless Chromium) | **33** | editing and the live preview, host log, lint markers, theme and size, share round-trip, zip download, React export, file picker, intellisense, welcome/first run, **every gallery example loading with 0 runtime errors**, batchPlay inspector, palette, share/embed dialog, embed mode, the postMessage API from a host page, GitHub monorepo import (mocked API), zip import and its error, phone layout, and a check that the first paint loads no Monaco/TypeScript code |

## 7. Bundle and speed

| | Before (`6438689`) | After |
|---|---|---|
| Initial JS (eager) | 4.90 MB (1.27 MB gzip), Monaco included | **0.73 MB (0.21 MB gzip)** |
| Preview-only embed, everything it loads | n/a (no embed mode) | **0.76 MB raw / 0.21 MB gzip, 2 files** |
| Full app with editor ready, everything it loads | 16.4 MB raw / 3.9 MB gzip | 17.2 MB raw / 4.1 MB gzip, loaded after first paint |
| First contentful paint (localhost, 3 runs) | 344–468 ms | **~145 ms** |
| `dist/` total | 17.6 MB, 174 files | 18.5 MB, 108 files |

**What changed in the build:**

- Monaco, its language workers and the ESLint worker are lazy.
- The vendored React bundle (220 KB) loads only for projects that use React.

**Why the total stayed at about 18 MB:**

- The TypeScript worker (6.9 MB), which gives the real `@types/photoshop` intellisense, is still there.
- The full uxp-lint ESLint worker (2.2 MB) is still there.
- The before build linted with the small fallback rules instead of uxp-lint.
- These files are cached after the first visit. Serve `dist/` with gzip or brotli: the numbers above are uncompressed unless marked.

## 8. Remaining limits (honest list)

**Not testable here:**

- The preview is Chromium, not UXP: layout, CSS support, fonts and Spectrum widgets are approximations.
- Nothing was verified in Photoshop.

**Projects that need their build (18 corpus samples):**

- npm packages other than React: socket.io, firebase, jszip, sval, `@swc-react`, Spectrum Web Components, redux.
- Vue and Svelte single-file components.
- Webpack `DefinePlugin` constants (`APP_TYPE`).
- Tailwind's generated CSS.
- The wasm build output.
- These show a banner naming the missing packages; they are not silent failures.

**Bugs in the samples themselves, reproduced faithfully:**

- Adobe layer-creation reads `result[0]` from `executeAsModal`, which returns the callback's value (`undefined`).
- WasmUXP and forum 6725 call `imageObj.dispose()` on the `getPixels` result; `dispose` lives on `imageData`.
- `activeLayer` / `layerTree` are not in the Photoshop API.
- Forum snippets with top-level `await`, syntax errors or missing `PanelController`.
- Calls that change state outside a modal scope.

**Not simulated:**

- neural filters;
- real document pixels (a synthetic gradient is used);
- history;
- real file system writes;
- WebViews;
- an OAuth flow that needs a local server;
- InDesign and Premiere Pro beyond stubs.

**Zips still rejected (8):** source repos that do not contain their icons, or that reference build output that does not exist (`dist/output.css`, a wasm `index.js`).

**Share links:**

- Imported projects with images can exceed what chat apps accept.
- Use the origin link (`#github=` / `#example=`), the `.json` download, or a gist.
