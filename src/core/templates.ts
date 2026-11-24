import type { Project } from './types';

function manifest(opts: { id: string; name: string; panelId: string; label: string; main?: string; minVersion?: string; perms?: Record<string, unknown>; width?: number; height?: number; commands?: { id: string; label: string }[] }): string {
  const m = {
    manifestVersion: 5,
    id: opts.id,
    name: opts.name,
    version: '1.0.0',
    main: opts.main ?? 'index.html',
    host: { app: 'PS', minVersion: opts.minVersion ?? '24.4.0' },
    entrypoints: [
      {
        type: 'panel',
        id: opts.panelId,
        label: { default: opts.label },
        minimumSize: { width: 230, height: 200 },
        maximumSize: { width: 2000, height: 2000 },
        preferredDockedSize: { width: opts.width ?? 300, height: opts.height ?? 420 },
        preferredFloatingSize: { width: opts.width ?? 300, height: opts.height ?? 420 }
      },
      ...(opts.commands ?? []).map((c) => ({ type: 'command', id: c.id, label: { default: c.label } }))
    ],
    requiredPermissions: opts.perms ?? {}
  };
  return JSON.stringify(m, null, 2) + '\n';
}

const helloHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="S">Hello UXP</sp-heading>
    <sp-body size="S">Type a name and press the button. The playground approximates Spectrum UXP widgets.</sp-body>
    <sp-textfield id="name" placeholder="Your name"><sp-label slot="label">Name</sp-label></sp-textfield>
    <sp-checkbox id="loud">Shout</sp-checkbox>
    <div class="row">
      <sp-button id="greet" variant="cta">Greet</sp-button>
      <sp-button id="alert" variant="secondary">Show alert</sp-button>
    </div>
    <sp-divider size="small"></sp-divider>
    <sp-body id="out" size="S">Waiting…</sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const helloJs = `const { entrypoints } = require("uxp");
const { app } = require("photoshop");

entrypoints.setup({
  panels: {
    helloPanel: {
      show() {
        console.log("Panel shown. Active document:", app.activeDocument && app.activeDocument.title);
      }
    }
  },
  commands: {
    sayHello: () => app.showAlert("Hello from a command!")
  }
});

document.getElementById("greet").addEventListener("click", () => {
  const name = document.getElementById("name").value || "world";
  const loud = document.getElementById("loud").checked;
  const text = \`Hello, \${name}!\`;
  document.getElementById("out").textContent = loud ? text.toUpperCase() : text;
  console.log("greeted", name);
});

document.getElementById("alert").addEventListener("click", () => {
  app.showAlert("Document: " + (app.activeDocument ? app.activeDocument.title : "none"));
});
`;
const baseCss = `/* UXP does not support CSS Grid; use flexbox. */
.row {
  display: flex;
  margin: 8px 0;
}
.row > * {
  margin-right: 8px;
}
`;

const renameHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="S">Rename active layer</sp-heading>
    <sp-body size="XS" id="current">Current layer: …</sp-body>
    <sp-textfield id="newName" placeholder="New layer name"><sp-label slot="label">New name</sp-label></sp-textfield>
    <div class="row">
      <sp-button id="rename" variant="cta">Rename (batchPlay)</sp-button>
      <sp-button id="unsafe" variant="warning">Rename without modal</sp-button>
    </div>
    <sp-body size="XS">The second button calls batchPlay outside executeAsModal, which Photoshop rejects. Watch the Host calls tab.</sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const renameJs = `const { action, core, app } = require("photoshop");

const renameDescriptor = (name) => ({
  _obj: "set",
  _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
  to: { _obj: "layer", name }
});

async function readCurrentName() {
  const [result] = await action.batchPlay(
    [{ _obj: "get", _target: [{ _property: "name" }, { _ref: "layer", _enum: "ordinal", _value: "targetEnum" }] }],
    {}
  );
  document.getElementById("current").textContent = "Current layer: " + result.name;
}

document.getElementById("rename").addEventListener("click", async () => {
  const name = document.getElementById("newName").value || "Renamed layer";
  try {
    await core.executeAsModal(
      async () => {
        await action.batchPlay([renameDescriptor(name)], {});
      },
      { commandName: "Rename layer" }
    );
  } catch (e) {
    // executeAsModal rejects when Photoshop is busy in another modal state.
    console.error("Rename failed:", e.message);
    return;
  }
  await readCurrentName();
  console.log("Layers now:", app.activeDocument.layers.map((l) => l.name));
});

document.getElementById("unsafe").addEventListener("click", async () => {
  try {
    await action.batchPlay(
      [{ _obj: "set", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], to: { _obj: "layer", name: "Oops" } }],
      {}
    );
  } catch (e) {
    console.error("As expected:", e.message);
  }
});

readCurrentName();
`;

const reactHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="index.jsx"></script>
  </body>
</html>
`;
const reactJsx = `import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { app, core } from "photoshop";
import { LayerList } from "./LayerList.jsx";

function App() {
  const [layers, setLayers] = useState(() => app.activeDocument.layers.map((l) => l.name));
  const [count, setCount] = useState(0);

  const addLayer = async () => {
    try {
      await core.executeAsModal(async () => {
        await app.activeDocument.createLayer({ name: "React layer " + (count + 1) });
      }, { commandName: "Add layer" });
    } catch (e) {
      console.error("Could not add a layer:", e.message);
      return;
    }
    setCount(count + 1);
    setLayers(app.activeDocument.layers.map((l) => l.name));
  };

  return (
    <div className="app">
      <sp-heading size="S">React panel</sp-heading>
      <sp-body size="XS">React 19 rendered into a UXP-style panel.</sp-body>
      <sp-button variant="cta" onClick={addLayer}>Add layer</sp-button>
      <sp-detail>Layers ({layers.length})</sp-detail>
      <LayerList names={layers} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
`;
const layerListJsx = `import React from "react";

export function LayerList({ names }) {
  return (
    <div className="list">
      {names.map((n, i) => (
        <div className="item" key={i}>{n}</div>
      ))}
    </div>
  );
}
`;
const reactCss = `.app { display: flex; flex-direction: column; }
.app > * { margin-bottom: 6px; }
.list { border: 1px solid var(--uxp-host-border-color); border-radius: 4px; }
.item { padding: 4px 8px; border-bottom: 1px solid var(--uxp-host-border-color); }
`;

const pickerHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="S">File picker</sp-heading>
    <sp-body size="XS">Uses uxp.storage.localFileSystem. Needs requiredPermissions.localFileSystem = "request".</sp-body>
    <div class="row">
      <sp-button id="open" variant="cta">Open text file…</sp-button>
      <sp-button id="save" variant="secondary">Save notes…</sp-button>
    </div>
    <sp-textarea id="text" placeholder="File contents appear here"></sp-textarea>
    <sp-body size="XS" id="status"></sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const pickerJs = `const { storage } = require("uxp");
const fs = storage.localFileSystem;
const status = (t) => (document.getElementById("status").textContent = t);

document.getElementById("open").addEventListener("click", async () => {
  try {
    const file = await fs.getFileForOpening({ types: ["txt", "json", "md"] });
    if (!file) return status("Cancelled");
    const text = await file.read({ format: storage.formats.utf8 });
    document.getElementById("text").value = text;
    status("Loaded " + file.name + " (" + text.length + " chars)");
  } catch (e) {
    status("Error: " + e.message);
  }
});

document.getElementById("save").addEventListener("click", async () => {
  try {
    const file = await fs.getFileForSaving("notes.txt", { types: ["txt"] });
    if (!file) return status("Cancelled");
    await file.write(document.getElementById("text").value);
    status("Saved " + file.name);
  } catch (e) {
    status("Error: " + e.message);
  }
});
`;

export interface Template {
  id: string;
  label: string;
  description: string;
  build: () => Project;
}

const project = (name: string, files: Record<string, string>, active = 'index.js'): Project => ({
  v: 1,
  name,
  target: { app: 'PS', uxp: '9.2' },
  theme: 'dark',
  size: null,
  files,
  active
});

export const TEMPLATES: Template[] = [
  {
    id: 'hello',
    label: 'Hello panel',
    description: 'Spectrum widgets, entrypoints.setup, a command and app.showAlert.',
    build: () =>
      project('Hello panel', {
        'manifest.json': manifest({ id: 'pg.hello.panel', name: 'Hello Panel', panelId: 'helloPanel', label: 'Hello', commands: [{ id: 'sayHello', label: 'Say hello' }] }),
        'index.html': helloHtml,
        'index.js': helloJs,
        'styles.css': baseCss
      })
  },
  {
    id: 'batchplay-rename',
    label: 'batchPlay: rename layer',
    description: 'batchPlay get/set inside core.executeAsModal, plus the error you get outside a modal scope.',
    build: () =>
      project('batchPlay rename', {
        'manifest.json': manifest({ id: 'pg.batchplay.rename', name: 'Rename Layer', panelId: 'renamePanel', label: 'Rename Layer' }),
        'index.html': renameHtml,
        'index.js': renameJs,
        'styles.css': baseCss
      })
  },
  {
    id: 'react',
    label: 'React panel',
    description: 'React 19 + JSX across two files. Export compiles JSX and ships React in vendor/.',
    build: () =>
      project(
        'React panel',
        {
          'manifest.json': manifest({ id: 'pg.react.panel', name: 'React Panel', panelId: 'reactPanel', label: 'React Panel' }),
          'index.html': reactHtml,
          'index.jsx': reactJsx,
          'LayerList.jsx': layerListJsx,
          'styles.css': reactCss
        },
        'index.jsx'
      )
  },
  {
    id: 'file-picker',
    label: 'File picker',
    description: 'localFileSystem.getFileForOpening / getFileForSaving with the manifest v5 permission.',
    build: () =>
      project('File picker', {
        'manifest.json': manifest({ id: 'pg.file.picker', name: 'File Picker', panelId: 'filePanel', label: 'File Picker', perms: { localFileSystem: 'request' } }),
        'index.html': pickerHtml,
        'index.js': pickerJs,
        'styles.css': baseCss
      })
  }
];

export function templateById(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
