# Third-party notices

The built site bundles the following packages. Licenses as published on the npm registry (checked 24 Nov 2026).

| Package | Version | License | Used for |
|---|---|---|---|
| monaco-editor | 0.58.0 | MIT | Code editor and TypeScript/JSON/CSS/HTML language services |
| react, react-dom | 19.3.1 | MIT | App UI; also shipped as `vendor/react-bundle.js` in exported React plugins |
| sucrase | 3.35.1 | MIT | JSX / TypeScript / ES module → CommonJS |
| eslint-linter-browserify | 10.15.0 | MIT | ESLint `Linter` in a Web Worker |
| globals | 17.14.0 | MIT | Browser globals for ESLint |
| @eslint/css | 2.0.1 | Apache-2.0 | CSS linting (with eslint-plugin-uxp-lint) |
| @eslint/json | 2.1.1 | Apache-2.0 | manifest.json linting (with eslint-plugin-uxp-lint) |
| @html-eslint/parser | 0.68.0 | MIT | HTML linting (with eslint-plugin-uxp-lint) |
| lz-string | 1.5.0 | MIT | Share links (compressed state in the URL hash) |
| fflate | 0.8.3 | MIT | Plugin .zip export |
| @types/photoshop | 27.11.0 | MIT (DefinitelyTyped) | Editor autocomplete for `photoshop` |
| @adobe/cc-ext-uxp-types | 7.3.1 | Apache-2.0 (LICENSE file and file headers; the package.json has no `license` field) | Editor autocomplete for `uxp` |
| eslint-plugin-uxp-lint | 0.2.0, source commit 138aa45 | MIT | Pinned browser bundle for UXP lint rules; see `vendor/uxp-lint/` for its license and data notices |

## Example plugins

`public/examples/` contains sample plugins copied unchanged from [AdobeDocs/uxp-photoshop-plugin-samples](https://github.com/AdobeDocs/uxp-photoshop-plugin-samples) at commit `d937f1a36f3a2149a92c3f5af56181a3caaae036`. Each example keeps its own license (Apache-2.0 or MIT, as published in that sample's folder) and a `SOURCE.md` naming its origin. The gallery shows the license on every card.

"Adobe", "Photoshop", "InDesign", "Premiere Pro" and "UXP" are trademarks of Adobe. This project is not affiliated with or endorsed by Adobe.
