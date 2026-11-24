# UXP Playground: stack research and decisions

Prepared 24 Nov 2026 (Asia/Tehran) for Ali Abdolyousefi. Builds on `/workspace/uxplugins-evidence/uxp-ideas-2026-11-18/REPORT.md` §6 (Idea #4).
Package versions and licenses below were read today from `registry.npmjs.org` (`/latest` and `npm view`). Facts I could not verify are marked **[unverified]**.

## 1. What we are building and why (recap of the gap)

- Adobe's UDT Playground (https://developer.adobe.com/uxp/guides/how-to/udt-deep-dive/playground, fetched today) has HTML/CSS/JS/Manifest editors, loads into a **running host**, live-refreshes, has a Chrome-DevTools-based debugger and a Download/export. It needs UDT installed and a connected host. It has no share links and no linting.
- Gap: a **zero-install browser** playground with **share links, templates, linting, mocked host APIs with a call log, and a one-click download of an installable manifest v5 plugin** that you then load in UDT.
- A browser cannot run the UXP engine. Adobe's own FAQ says Spectrum UXP widgets "are not built atop Web Components" (UXP docs, spectrum FAQ, snapshot in `uxp-assistant/test/fixtures/real-docs/spectrum-faq.txt`, retrieved 2026-11-09). So every preview is **approximate** and the UI must say so on every pane.

## 2. Editor: Monaco vs CodeMirror 6

| | Monaco `monaco-editor` 0.58.0 (MIT) | CodeMirror 6 `codemirror` 6.0.2 + `@codemirror/*` (MIT) |
|---|---|---|
| JS/TS intellisense from `.d.ts` | **Built in** (TypeScript language service in a worker; `typescript.javascriptDefaults.addExtraLib`) | Not built in; needs `@typescript/vfs` + a TS compiler in a worker (TypeScript 7.x on npm is the native port, so the JS-API story is in flux **[unverified details]**) |
| JSON schema validation for manifest | Built in (`json.jsonDefaults.setDiagnosticsOptions({schemas})`) | Needs extra packages |
| Lint markers API | `editor.setModelMarkers` | `@codemirror/lint` (very good) |
| Size | Large (80 MB unpacked package; ~3–5 MB shipped after tree-shaking) | Small (core packages tens of KB) |
| Mobile/touch | Weak | Good |

**Choice: Monaco.** The single most valuable editor feature for UXP developers is autocomplete/hover from the real Adobe typings (`require('photoshop').action.batchPlay`, `uxp.storage.localFileSystem.getFileForOpening`), and Monaco gives that with no extra compiler plumbing. Size is acceptable for a desktop developer tool; workers are code-split by Vite. CodeMirror 6 remains the right fallback if an embeddable "lite" mode for blogs/forums is wanted later.

## 3. Running code in the browser: esbuild-wasm vs Sandpack vs WebContainers vs plain iframe

| Option | License | Fit |
|---|---|---|
| `esbuild-wasm` 0.28.2 | MIT | Real bundler in the browser, ~14.5 MB unpacked (wasm binary). Needs a virtual FS plugin to resolve npm packages (CDN or vendored). Overkill for 3–6 small plugin files. |
| Sandpack (`@codesandbox/sandpack-client` 2.19.8 / `-react` 2.20.0) | Apache-2.0 | By default evaluates code on CodeSandbox's hosted bundler (`{version}-sandpack.codesandbox.io`); self-hosting means building `codesandbox-client` (https://sandpack.codesandbox.io/docs/guides/hosting-the-bundler). External runtime dependency and a Node/npm-centric model; nothing UXP-specific. |
| WebContainers (`@webcontainer/api` 1.6.4) | npm package MIT, **but the service requires a commercial license**: "Licensing is required for production usage of the API in a commercial, for-profit setting" (https://webcontainers.io/enterprise). Also needs cross-origin isolation headers. | Runs Node in the browser; irrelevant because UXP is not Node. **Rejected** (license + mismatch). |
| **Plain sandboxed iframe + own CommonJS `require` runtime + `sucrase` transforms** | `sucrase` 3.35.1 MIT | UXP plugins use `require("photoshop")`, `require("uxp")` and relative `require("./x.js")`. A ~150-line module runtime in the iframe resolves host modules to mocks, plugin files to compiled modules, and `react`/`react-dom` to vendored copies. `sucrase` (1.1 MB unpacked, fast) compiles JSX/TS/ESM-imports to CommonJS. |

**Choice: plain iframe + own CJS runtime + sucrase.** It matches the UXP module model exactly (CommonJS `require`), works offline, needs no third-party service, and keeps the preview fast (sub-100 ms rebuild). Import maps were considered but UXP code is CommonJS-first, so they add nothing. esbuild-wasm can be added later behind a lazy import if arbitrary npm packages are wanted.

## 4. App framework

- **Vite 8.3.8 (MIT) + React 19.3.1 (MIT) + TypeScript.** React is needed anyway for the React template runtime, so the app reuses it. Bolt UXP (`bolt-uxp` 1.3.27, registry) depends on `react ^19.1.0`, which is the best available evidence that React 19 is used in UXP plugins today. Svelte 5.59.1 / Solid 2.0.3 would give a smaller app shell, but the shell is dwarfed by Monaco; no measurable win.
- Tests: `vitest` 5.1.1 (MIT) for units, `@playwright/test` 1.65.1 (Apache-2.0) headless Chromium for e2e.

## 5. Share links and persistence

- **`lz-string` 1.5.0 (MIT)** `compressToEncodedURIComponent` of `{v, host, uxp, theme, size, files}` in the **URL hash** (`#s=...`). The hash never reaches a server, so sharing needs no backend. Typical template compresses to well under 4 KB.
- **Gist import** (`#gist=<id>`): read-only `GET https://api.github.com/gists/<id>` (public, CORS-enabled, no token). **Gist export with a token is deliberately not built**: pasting a GitHub token into a web page is a credential risk. Instead the app offers "Download playground.json" and the plugin zip; a user can paste files into a gist themselves.
- LocalStorage autosave of the last session.

## 6. Zip export (installable plugin)

- **`fflate` 0.8.3 (MIT)**, ~8 kB used, synchronous `zipSync`. JSZip 3.10.2 is dual "(MIT OR GPL-3.0-or-later)" and larger; fflate is the cleaner choice.
- Export layout = a plain UXP plugin folder with `manifest.json` (manifestVersion 5) at the zip root, loadable through UDT "Add Plugin" after unzipping. JSX/TS files are compiled with sucrase to plain CommonJS JS on export, and `require("react")`/`react-dom` are rewritten to a vendored file shipped in the zip (`vendor/react.js`), so the React template needs no build step.
- Manifest v5 shape and permissions model per https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/ (fetched today): `manifestVersion`, `id`, `name`, `version`, `main`, `host {app,minVersion}`, `entrypoints[]` (`panel`/`command`), `requiredPermissions` (`network.domains`, `clipboard`, `localFileSystem: request|plugin|fullAccess`, `launchProcess`, `ipc`, `webview`, `enableUserInfo`). The doc states full v5 needs PS 23.3.0+ (UXP 6.0+), and `enableUserInfo` needs PS 25.1 / UXP 7.3.

## 7. Spectrum / `sp-*` emulation

- Options: (a) real Spectrum Web Components (`@spectrum-web-components/bundle` 1.12.6, Apache-2.0); (b) Adobe's `@swc-uxp-wrappers/*` (2.0.1, Apache-2.0, pinned to SWC 0.37.0); (c) a small, labelled CSS/JS approximation of the **Spectrum UXP widgets**.
- **Choice: (c) own approximation layer** for the built-in widgets (`sp-button`, `sp-action-button`, `sp-textfield`, `sp-textarea`, `sp-checkbox`, `sp-radio`, `sp-radio-group`, `sp-switch`, `sp-slider`, `sp-picker`/`sp-dropdown`, `sp-menu`, `sp-menu-item`, `sp-heading`, `sp-body`, `sp-detail`, `sp-label`, `sp-divider`, `sp-link`, `sp-progressbar`). Reason: Adobe documents the built-in widgets as *not* web components, so rendering them with SWC would show SWC's behaviour, not UXP's; and the SWC bundle is heavy. Variants follow the UXP widget docs (e.g. `sp-button` variants cta/primary/secondary/warning/overBackground, `quiet`). Theme tokens approximate light / dark / darkest. Every preview carries an "Approximate — not the UXP engine" badge.
- SWC-in-UXP via `swc-uxp-wrappers` is left as future work (needs a bundler, see §3).

## 8. Host API mocks

Mocks (in the preview iframe, all calls logged to a "Host calls" panel with args/results):
- `photoshop`: `app` (activeDocument with layers, `documents`, `showAlert`), `action.batchPlay(descriptors, options)` (logs descriptors; implements a few common `_obj` values: `get` on layers/documents, `set` name for layer rename, `make`, `delete`, `select`), `core.executeAsModal(fn, {commandName})` (tracks modal state; `batchPlay` that **modifies** state outside a modal scope throws like Photoshop's "modal state" error **[message text approximated]**), `core.showAlert`, `constants`.
- `uxp`: `storage.localFileSystem` (`getFileForOpening`/`getFileForSaving`/`getFolder`/`getPluginFolder`/`getDataFolder`/`getTemporaryFolder`) backed by an in-memory FS and the browser file picker (`<input type=file>`) for opening; `storage.formats`, `storage.domains`, `entrypoints.setup`, `shell.openExternal` (permission-checked against the manifest), `host`, `versions`.
- `premierepro` / `indesign`: minimal stubs that log and return placeholders. **Not behaviour-accurate.**
- Permission checks follow the manifest v5 doc: e.g. pickers need `localFileSystem: "request"`, `fetch` needs `network.domains`, `openExternal` needs `launchProcess`.
These are hand-written approximations, not recorded host data (that is Contract Lab, idea #3).

## 9. TypeScript intellisense from real Adobe typings

Verified on the registry today:
- `@adobe/cc-ext-uxp-types` **7.3.1** — "Typescript definitions for the Adobe UXP JS API"; `package.json` has **no `license` field** but the tarball ships an Apache-2.0 `LICENSE` and each file header says Apache-2.0; declares `module 'uxp'` (header: "UXP 7.3").
- `@types/photoshop` **27.11.0** — MIT (DefinitelyTyped); `photoshop/index.d.ts` exports `app`, `core`, `action`, `constants`, `imaging`.
- Alternatives: `@adobe-uxp-types/uxp` 0.1.4 and `@adobe-uxp-types/photoshop` 0.1.8 (MIT, bubblydoo); `@adobe/premierepro` 27.0.0 (Apache-2.0).
**Choice:** load `@types/photoshop` + `@adobe/cc-ext-uxp-types` into Monaco's TS worker as extra libs at virtual `file:///node_modules/...` paths (raw-imported at build time, so no network at runtime). Licenses allow redistribution with notices; `THIRD_PARTY_NOTICES.md` lists them.

## 10. Linting

- Engine: `eslint-linter-browserify` 10.15.0 (MIT; mirrors `eslint` 10.15.0): ESLint's `Linter` packaged for browsers, run in a **Web Worker** so typing never blocks.
- UXP rules: **`eslint-plugin-uxp-lint`** (sibling repo `/workspace/repos/uxp-eslint`, built by the other worker on 24 Nov). Its browser entry `dist/browser.js` exports `buildConfig({ manifest, manifestText, host, css, json, htmlParser })`, which returns flat configs for JS, CSS (`@eslint/css` 2.0.1, Apache-2.0), HTML (`@html-eslint/parser` 0.68.0, MIT) and `manifest.json` (`@eslint/json` 2.1.1, Apache-2.0). The playground passes the parsed manifest, so permission and minimum-version rules see the same manifest the user is editing.
- Adapter: `src/lint/adapter.ts` defines `UxpLintProvider { name, version, fallback, covers, buildConfig(ctx) }`. `vite.config.ts` picks `externalProvider.ts` when `../uxp-eslint/dist/browser.js` (or `$UXP_ESLINT_DIR/dist/browser.js`) exists at build time, else `fallbackProvider.ts` (two small built-in rules: modal scope and manifest permissions). `UXP_LINT_PROVIDER=fallback` forces the fallback.
- Playground-only checks stay on in both modes: JSON syntax, `main` file missing, host mismatch with the selected host, and "you preview UXP X but `host.minVersion` ships UXP Y" (from Adobe's Photoshop changelog table).
- The selected UXP version sets ESLint's `ecmaVersion` (2022 before UXP 8, 2024 from UXP 8, per Jaroslav Bereza's forum report in thread 9050). Minimum-version rules in the plugin follow the manifest's `host.minVersion`, not the preview selector.

## 11. Deployment

Static site (Vite `build` → `dist/`). Works on GitHub Pages, Netlify, Cloudflare Pages or any static host. No backend; no cross-origin-isolation headers needed (we don't use SharedArrayBuffer/WebContainers). Preview iframe uses `sandbox="allow-scripts allow-modals"` (no `allow-same-origin`) so plugin code can't read the app's storage.

## 12. Things a browser cannot reproduce (shown in the app's "About fidelity" box)

- The UXP layout/CSS engine (unsupported CSS, flex quirks, no grid in older UXP), fonts, native widget rendering, focus/keyboard behaviour.
- Real host APIs and their errors, modal scopes, history states, timing, events (`action.addNotificationListener` only logs).
- Real file system and permission consent dialogs; WebView behaviour; network policy enforcement beyond the manifest domain check.
- Entry-point lifecycle timeouts (300 ms per the manifest v5 doc), multiple panels, flyout menus (only logged).
