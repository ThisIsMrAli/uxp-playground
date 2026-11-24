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
  - Photoshop: `app` (one sample document with three layers), `action.batchPlay` (get, set name, make, select, delete, show/hide), `core.executeAsModal` and notification listeners.
  - Photoshop's real error text for state changes outside a modal scope.
  - `uxp.storage.localFileSystem` (the real browser file picker for opening; saving is kept in memory), `entrypoints.setup` (panel create/show, commands you can run from the sidebar), `shell.openExternal` and `userInfo`.
  - Manifest v5 permission checks for the file system, `launchProcess`, network domains (wildcards supported) and `enableUserInfo`.
- **Problems panel**:
  - ESLint 10 runs in a Web Worker with `eslint-plugin-uxp-lint` (JS, CSS, HTML and manifest rules) when that sibling repo is built.
  - Otherwise built-in fallback rules run.
  - Playground checks for the manifest are always on.
  - Results also show as editor squiggles.
- **Templates**: Hello panel, batchPlay rename layer, React panel (two JSX files) and File picker.
- **Share link**: the whole project is lz-string compressed into the URL hash, so nothing is uploaded. Opening `#gist=<id>` loads a public gist. You can also save and open `playground.json`.
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

Screenshots from the e2e run are written to `test-results/screenshots/` (or `$SCREENSHOT_DIR`).

### UXP lint rules

`vite.config.ts` bundles `eslint-plugin-uxp-lint` from `../uxp-eslint/dist/browser.js` when it exists. Point to another checkout with `UXP_ESLINT_DIR=/path/to/uxp-eslint`, or force the built-in rules with `UXP_LINT_PROVIDER=fallback`. Build the plugin first (`npm run build` in that repo).

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
  - There is no history, imaging, real file system, consent dialogs, WebViews, flyout menus or entrypoint timeouts.
  - InDesign and Premiere Pro modules are only stubs.
- **Permission checks** follow Adobe's manifest v5 guide, but error messages are the playground's, except the modal-scope error, which copies Photoshop's wording.

See `docs/RESEARCH.md` for the stack decisions and sources.
