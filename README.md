# UXP Playground

A browser playground for Adobe UXP plugins. Edit a plugin's files, see an **approximate** panel preview with mocked host APIs, lint it with ESLint and UXP rules, share it as a link, and download it as a plugin folder (.zip) you can load in the UXP Developer Tool (UDT).

> The preview runs in a browser, not in the UXP engine. Spectrum UXP widgets, theme colours, CSS support and the `photoshop` / `uxp` modules are simulated. Always check the real result in UDT with your host app.

## Features

- **Multi-file editor** (Monaco): `manifest.json`, HTML, JS/JSX/TS, CSS and extra files or folders. Autocomplete and hovers come from the real Adobe typings (`@types/photoshop` 27.11.0, `@adobe/cc-ext-uxp-types` 7.3.1). `manifest.json` is checked against a manifest v5 schema.
- **Target selectors**: host (Photoshop, InDesign, Premiere Pro), UXP version (6.0 to 9.2), theme (darkest, dark, medium, light, lightest) and panel size (the manifest's docked size or presets).
- **Live preview** in a sandboxed iframe (`allow-scripts allow-modals allow-forms`, no same-origin), framed like a host panel and labelled *Approximate*:
  - CommonJS `require` for `photoshop`, `uxp`, `premierepro`, `indesign`, `react`, `react-dom`, relative files and JSON.
  - JSX, TypeScript and ES modules are compiled with sucrase.
  - `sp-*` Spectrum UXP widgets are re-created as small web components: button, action-button, textfield, textarea, checkbox, radio(-group), switch, slider, picker/dropdown, menu, menu-item, progressbar, heading, body, detail, label, divider, link and icon.
- **Host API mocks** with a *Host calls* log:
  - Photoshop: `app` and the DOM (one sample document with layers, groups and a text layer; documents, layers, color samplers, `suspendHistory`), `action.batchPlay` (get, set, make incl. text layers, select, delete, show/hide, duplicate…), `core.executeAsModal` with its options, `imaging` (getPixels/putPixels/encodeImageData), notification listeners and `window.ImageBlob`. Calls that are not simulated, or not in the Photoshop typings, are marked in the log instead of failing silently.
  - Photoshop's real error text for state changes outside a modal scope.
  - `uxp.storage.localFileSystem` (the real browser file picker for opening; saving and the data folder are kept in memory), `secureStorage`, `entrypoints.setup` and `getPanel`/`getCommand` (panel create/show, flyout menus, commands you can run from the sidebar, headless plugins), `shell.openExternal` and `userInfo`.
  - Manifest v5 permission checks (manifest v4 plugins are not checked, as in UXP) for the file system, `launchProcess`, network domains (wildcards supported) and `enableUserInfo`.
- **Problems panel**:
  - ESLint 10 runs in a Web Worker with `eslint-plugin-uxp-lint` (JS, CSS, HTML and manifest rules) when that sibling repo is built.
  - Otherwise built-in fallback rules run.
  - Playground checks for the manifest are always on.
  - Results also show as editor squiggles.
- **Examples gallery**: 10 of Adobe's own samples from `AdobeDocs/uxp-photoshop-plugin-samples` (pinned commit, licenses kept, see `public/examples/`) plus 9 starter templates (panel, batchPlay, React, file picker, layers DOM, notifications, imaging, settings storage, flyout menus and commands). Every example has a link (`#example=<id>`, `#template=<id>`).
- **Import**: a GitHub repo or sub-folder (`#github=owner/repo/path`; monorepos ask which plugin and download only that one), a `.zip`/`.ccx`, a local folder (drag and drop anywhere), a public gist or a `playground.json`. Projects built with webpack/Vite get a small loader stub and a note instead of a blank panel.
- **Share link**: the whole project is lz-string compressed into the URL hash, so nothing is uploaded. The share dialog shows the link size and which large binaries were left out. You can also save and open `playground.json`.
- **Embed mode** for docs pages and blogs: `?embed=1` with `view=split|preview|editor`, `readonly=1`, `theme=light|dark`, `console=1`. Embeds never write the reader's storage and have an *Open in Playground* link. A host page can drive an embed with `postMessage` (`uxp-playground:load`, `:run`, `:set-file`; the embed answers `uxp-playground:ready` and `:ran`).
- **batchPlay inspector**: each batchPlay call in the Host calls log is described in plain words, with the descriptors as a tree, copy buttons, generated replay code and a re-run button.
- **Workbench**: file tree with folders, tabs, resizable panes, command palette (`Ctrl/⌘+Shift+P`, files with `Ctrl/⌘+P`), keyboard shortcuts (`Ctrl/⌘+Shift+/`), light and dark UI, a phone layout, and a welcome screen on first visit.
- **Download plugin .zip**: a plain UXP plugin folder with `manifest.json` at the root.
  - JSX, TypeScript and ESM are compiled to CommonJS `.js`, and script tags and requires are rewritten.
  - React projects get `vendor/react-bundle.js` (React 19.3.1, production build), so no bundler is needed.
  - The zip includes a `PLAYGROUND-README.txt` with the UDT steps.

## Run it

```bash
npm install
npx playwright install chromium   # once, for the e2e tests
npm run dev                       # http://localhost:5310
npm run build                     # static site in dist/ (deploy anywhere: GitHub Pages, Netlify, Cloudflare Pages)
npm test                          # unit tests (vitest + jsdom)
npm run build && npm run e2e      # end-to-end tests (Playwright, headless Chromium, against vite preview)
```

Screenshots from the e2e run are written to `test-results/screenshots/` (or `$SCREENSHOT_DIR`; the feature tests use `$HARDENING_SHOTS`).

`node scripts/build-examples.mjs <clone of AdobeDocs/uxp-photoshop-plugin-samples>` regenerates `public/examples/`.

### Scripting API

The page exposes `window.uxpPlayground` (`importFiles`, `getProject`, `setProject`, `run`, `getReport`, `exportZipBase64`), which the e2e tests and the real-plugin harness use.

### UXP lint rules

`vite.config.ts` bundles `eslint-plugin-uxp-lint` from `../uxp-eslint/dist/uxp-lint.browser.mjs` (or the older `dist/browser.js`) when it exists. The selected UXP version is passed as `settings.uxp.uxpVersion`, and each problem links to its rule page (`meta.docs.url`; core ESLint rules link to eslint.org). Point to another checkout with `UXP_ESLINT_DIR=/path/to/uxp-eslint`, or force the built-in rules with `UXP_LINT_PROVIDER=fallback`. Build the plugin first (`npm run build` in that repo).

## Load an exported plugin in UDT

1. Unzip the download.
2. In UDT choose **Add Plugin** and pick `manifest.json`.
3. Start the host app and click **Load**.

## What differs from real UXP

- **Layout and CSS** come from Chromium, not UXP's engine. UXP lacks CSS Grid and some properties (the linter flags many of these), and fonts and metrics differ.
- **Spectrum UXP widgets** are approximations. Adobe documents the real ones as native widgets, not web components.
- **The JavaScript engine** is your browser's, so newer built-ins may work here but not in UXP. The UXP selector only changes the ECMAScript level used by the linter.
- **Host APIs** are hand-written mocks with one sample document:
  - Most batchPlay events return `{}` and log "not simulated".
  - There is no real history, pixel-accurate imaging (a synthetic gradient stands in for pixels), real file system, consent dialogs, WebViews, neural filters or entrypoint timeouts.
  - npm packages other than React are not resolved: projects that need their bundler show a banner listing the packages.
  - InDesign and Premiere Pro modules are only stubs.
- **Permission checks** follow Adobe's manifest v5 guide, but error messages are the playground's, except the modal-scope error, which copies Photoshop's wording.

See `docs/RESEARCH.md` for the stack decisions and sources, and `docs/HARDENING.md` for the real-plugin test results.
