import type { Project } from './types';
import { hostInfo, type HostApp } from './hosts';
import { premiereRecipeDefinitions, premiereRecipeStyles, type PremiereRecipe } from './premiereRecipes';

function manifest(opts: { id: string; name: string; panelId: string; label: string; main?: string; minVersion?: string; app?: HostApp; perms?: Record<string, unknown>; width?: number; height?: number; commands?: { id: string; label: string }[] }): string {
  const host = hostInfo(opts.app ?? 'PS')!;
  const m = {
    manifestVersion: 5,
    id: opts.id,
    name: opts.name,
    version: '1.0.0',
    main: opts.main ?? 'index.html',
    host: { app: host.id, minVersion: opts.minVersion ?? host.minVersion, ...(host.id === 'PS' && { data: { apiVersion: 2 } }) },
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
      ...(opts.commands ?? []).map((c) => ({ type: 'command', id: c.id, label: c.label }))
    ],
    ...(opts.perms && { requiredPermissions: opts.perms })
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
  tags?: string[];
  host?: HostApp | 'shared';
  recipe?: PremiereRecipe;
  build: (app?: HostApp) => Project;
}

const project = (name: string, files: Record<string, string>, active = 'index.js', app: HostApp = 'PS'): Project => ({
  v: 1,
  name,
  target: { app, uxp: hostInfo(app)!.uxp },
  theme: 'dark',
  size: null,
  files,
  active
});

const BASE_TEMPLATES: Template[] = [
  {
    id: 'hello',
    label: 'Hello panel',
    description: 'Spectrum widgets, entrypoints.setup, a command and app.showAlert.',
    tags: ['basics', 'Spectrum', 'entrypoints'],
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
    tags: ['batchPlay', 'executeAsModal'],
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
    tags: ['React', 'JSX', 'multi-file'],
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
    tags: ['file system', 'permissions'],
    host: 'shared',
    build: (app = 'PS') =>
      project('File picker', {
        'manifest.json': manifest({ id: 'pg.file.picker', name: 'File Picker', panelId: 'filePanel', label: 'File Picker', app, perms: { localFileSystem: 'request' } }),
        'index.html': pickerHtml,
        'index.js': pickerJs,
        'styles.css': baseCss
      }, 'index.js', app)
  }
];


// ---------------------------------------------------------------- templates from real-plugin patterns
const domHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="XS">Layers in the active document</sp-heading>
    <ul id="layers"></ul>
    <div class="row">
      <sp-action-button id="group">Group selected</sp-action-button>
      <sp-action-button id="dup">Duplicate</sp-action-button>
      <sp-action-button id="hideText">Hide text layers</sp-action-button>
    </div>
    <sp-body id="status" size="XS"></sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const domJs = `// Photoshop DOM API (app.activeDocument, layers, bounds) with every change inside executeAsModal.
const { app, core, constants } = require("photoshop");

const list = document.getElementById("layers");
const status = (msg) => (document.getElementById("status").textContent = msg);

function render() {
  const doc = app.activeDocument;
  list.innerHTML = "";
  if (!doc) return status("Open a document first.");
  const walk = (layers, depth) => {
    for (const layer of layers) {
      const li = document.createElement("li");
      const b = layer.bounds;
      li.style.paddingLeft = depth * 12 + "px";
      li.textContent = \`\${layer.kind === constants.LayerKind.GROUP ? "▸ " : ""}\${layer.name} — \${layer.kind}, \${b.width}×\${b.height}\${layer.visible ? "" : " (hidden)"}\`;
      if (layer.selected) li.className = "selected";
      list.appendChild(li);
      if (layer.layers) walk(layer.layers, depth + 1);
    }
  };
  walk(doc.layers, 0);
  status(\`\${doc.title}: \${doc.width}×\${doc.height} px, \${doc.activeLayers.length} selected\`);
}

async function modal(commandName, fn) {
  try {
    await core.executeAsModal(fn, { commandName });
  } catch (e) {
    status("Error: " + e.message);
  }
  render();
}

document.getElementById("group").addEventListener("click", () =>
  modal("Group selected layers", async () => {
    const doc = app.activeDocument;
    await doc.createLayerGroup({ name: "Group", fromLayers: doc.activeLayers });
  })
);
document.getElementById("dup").addEventListener("click", () =>
  modal("Duplicate layer", async () => {
    for (const layer of app.activeDocument.activeLayers) await layer.duplicate();
  })
);
document.getElementById("hideText").addEventListener("click", () =>
  modal("Hide text layers", async () => {
    const hide = (layers) => {
      for (const l of layers) {
        if (l.kind === constants.LayerKind.TEXT) l.visible = false;
        if (l.layers) hide(l.layers);
      }
    };
    hide(app.activeDocument.layers);
  })
);

render();
`;
const domCss = baseCss + `ul#layers {
  list-style: none;
  margin: 4px 0;
  padding: 6px;
  border: 1px solid var(--uxp-host-border-color);
  border-radius: 4px;
  max-height: 200px;
  overflow: auto;
  font-size: 11px;
}
ul#layers li.selected {
  color: var(--uxp-host-link-text-color);
}
`;

const notifyHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="XS">Photoshop events</sp-heading>
    <sp-body size="XS">Listening for make, select, set and delete. Trigger some events:</sp-body>
    <div class="row">
      <sp-action-button id="make">New layer</sp-action-button>
      <sp-action-button id="select">Select bottom layer</sp-action-button>
      <sp-action-button id="stop">Stop listening</sp-action-button>
    </div>
    <ol id="feed"></ol>
    <script src="index.js"></script>
  </body>
</html>
`;
const notifyJs = `// action.addNotificationListener: react to what happens in Photoshop.
const { action, core } = require("photoshop");

const EVENTS = ["make", "select", "set", "delete"];
const feed = document.getElementById("feed");

function onEvent(event, descriptor) {
  const li = document.createElement("li");
  li.textContent = \`\${new Date().toLocaleTimeString()} \${event} \${JSON.stringify(descriptor).slice(0, 80)}\`;
  feed.prepend(li);
}

action.addNotificationListener(EVENTS, onEvent);

document.getElementById("make").addEventListener("click", () =>
  core.executeAsModal(
    () => action.batchPlay([{ _obj: "make", _target: [{ _ref: "layer" }], using: { _obj: "layer", name: "From event demo" } }], {}),
    { commandName: "Make layer" }
  )
);
document.getElementById("select").addEventListener("click", () =>
  core.executeAsModal(
    () => action.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _index: 1 }], makeVisible: false }], {}),
    { commandName: "Select layer" }
  )
);
document.getElementById("stop").addEventListener("click", async () => {
  await action.removeNotificationListener(EVENTS, onEvent);
  onEvent("(stopped listening)", {});
});
`;

const imagingHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="XS">Imaging API thumbnail</sp-heading>
    <sp-button id="grab" variant="cta">Get thumbnail</sp-button>
    <div class="thumb"><img id="img" alt="Document thumbnail" /></div>
    <sp-body id="info" size="XS"></sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const imagingJs = `// imaging.getPixels -> encodeImageData -> <img>. Always dispose image data you no longer need.
const { app, core, imaging } = require("photoshop");

document.getElementById("grab").addEventListener("click", async () => {
  const info = document.getElementById("info");
  try {
    await core.executeAsModal(
      async () => {
        const doc = app.activeDocument;
        const pixels = await imaging.getPixels({ documentID: doc.id, targetSize: { height: 120 } });
        const jpeg = await imaging.encodeImageData({ imageData: pixels.imageData, base64: true });
        document.getElementById("img").src = "data:image/jpeg;base64," + jpeg;
        info.textContent = \`\${pixels.imageData.width}×\${pixels.imageData.height}, \${pixels.imageData.components} components\`;
        pixels.imageData.dispose();
      },
      { commandName: "Get thumbnail" }
    );
  } catch (e) {
    info.textContent = "Error: " + e.message;
  }
});
`;
const imagingCss = baseCss + `.thumb {
  margin: 8px 0;
  min-height: 120px;
  border: 1px dashed var(--uxp-host-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

const settingsHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="XS">Settings in the plugin data folder</sp-heading>
    <sp-textfield id="prefix" placeholder="Prefix"><sp-label slot="label">Layer name prefix</sp-label></sp-textfield>
    <sp-checkbox id="upper">Uppercase</sp-checkbox>
    <div class="row">
      <sp-button id="save" variant="cta">Save</sp-button>
      <sp-button id="load" variant="secondary">Reload</sp-button>
    </div>
    <sp-body id="status" size="XS"></sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const settingsJs = `// Persist settings as JSON in the plugin data folder (no permission needed), with a localStorage counter.
const { storage } = require("uxp");
const fs = storage.localFileSystem;

const FILE = "settings.json";
const $ = (id) => document.getElementById(id);

async function load() {
  try {
    const folder = await fs.getDataFolder();
    const file = await folder.getEntry(FILE);
    const settings = JSON.parse(await file.read());
    $("prefix").value = settings.prefix || "";
    $("upper").checked = !!settings.upper;
    $("status").textContent = "Loaded " + FILE;
  } catch (e) {
    $("status").textContent = "No saved settings yet.";
  }
}

async function save() {
  const folder = await fs.getDataFolder();
  const file = await folder.createFile(FILE, { overwrite: true });
  await file.write(JSON.stringify({ prefix: $("prefix").value, upper: $("upper").checked }, null, 2));
  const saves = Number(localStorage.getItem("saves") || 0) + 1;
  localStorage.setItem("saves", String(saves));
  $("status").textContent = \`Saved (\${saves} saves this session)\`;
}

$("save").addEventListener("click", save);
$("load").addEventListener("click", load);
load();
`;

const menusHtml = `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <sp-heading size="XS">Flyout menu and commands</sp-heading>
    <sp-body size="XS">Open the panel menu (☰ in the panel header) or run the command from the preview toolbar.</sp-body>
    <sp-body id="last" size="S">Nothing invoked yet.</sp-body>
    <script src="index.js"></script>
  </body>
</html>
`;
const menusJs = `// entrypoints.setup with panel menuItems, invokeMenu, and a menu command entrypoint.
const { entrypoints } = require("uxp");
const { app } = require("photoshop");

const show = (text) => (document.getElementById("last").textContent = text);
let compact = false;

entrypoints.setup({
  plugin: {
    create() {
      console.log("plugin created");
    }
  },
  panels: {
    menuPanel: {
      show() {
        show("Panel shown");
      },
      menuItems: [
        { id: "refresh", label: "Refresh" },
        { id: "compact", label: "Compact mode", checked: false },
        { id: "-", label: "-" },
        { id: "about", label: "About…" }
      ],
      invokeMenu(id) {
        if (id === "compact") compact = !compact;
        show("Menu: " + id + (id === "compact" ? " (" + compact + ")" : ""));
      }
    }
  },
  commands: {
    resetPanel: {
      run() {
        show("Command resetPanel ran");
        return app.showAlert("Panel reset");
      }
    }
  }
});
`;

export const EXTRA_TEMPLATES: Template[] = [
  {
    id: 'dom-layers',
    label: 'DOM: layers and groups',
    description: 'app.activeDocument, nested layers, bounds, createLayerGroup and duplicate inside executeAsModal.',
    tags: ['DOM', 'layers', 'executeAsModal'],
    build: () =>
      project('DOM layers', {
        'manifest.json': manifest({ id: 'pg.dom.layers', name: 'DOM Layers', panelId: 'domPanel', label: 'DOM Layers', height: 360 }),
        'index.html': domHtml,
        'index.js': domJs,
        'styles.css': domCss
      })
  },
  {
    id: 'notifications',
    label: 'Event listener',
    description: 'action.addNotificationListener with a live event feed, and removeNotificationListener.',
    tags: ['events', 'batchPlay'],
    build: () =>
      project('Event listener', {
        'manifest.json': manifest({ id: 'pg.notify', name: 'Event Listener', panelId: 'notifyPanel', label: 'Events' }),
        'index.html': notifyHtml,
        'index.js': notifyJs,
        'styles.css': baseCss
      })
  },
  {
    id: 'imaging',
    label: 'Imaging API thumbnail',
    description: 'imaging.getPixels with targetSize, encodeImageData to an <img>, and dispose().',
    tags: ['imaging', 'executeAsModal'],
    build: () =>
      project('Imaging thumbnail', {
        'manifest.json': manifest({ id: 'pg.imaging', name: 'Imaging Thumbnail', panelId: 'imagingPanel', label: 'Thumbnail', minVersion: '24.2.0' }),
        'index.html': imagingHtml,
        'index.js': imagingJs,
        'styles.css': imagingCss
      })
  },
  {
    id: 'settings',
    label: 'Settings in the data folder',
    description: 'getDataFolder, createFile({ overwrite }), File.read/write as JSON, plus localStorage.',
    tags: ['storage', 'file system'],
    host: 'shared',
    build: (app = 'PS') =>
      project('Settings storage', {
        'manifest.json': manifest({ id: 'pg.settings', name: 'Settings Storage', panelId: 'settingsPanel', label: 'Settings', app }),
        'index.html': settingsHtml,
        'index.js': settingsJs,
        'styles.css': baseCss
      }, 'index.js', app)
  },
  {
    id: 'menus',
    label: 'Flyout menu and commands',
    description: 'Panel menuItems with invokeMenu, plugin.create and a command entrypoint.',
    tags: ['entrypoints', 'menus', 'commands'],
    build: () =>
      project('Menus and commands', {
        'manifest.json': manifest({ id: 'pg.menus', name: 'Menus and Commands', panelId: 'menuPanel', label: 'Menus', commands: [{ id: 'resetPanel', label: 'Reset panel' }] }),
        'index.html': menusHtml,
        'index.js': menusJs,
        'styles.css': baseCss
      })
  }
];

function inspectorTemplate(app: HostApp, id: string, label: string, description: string, api: string, action?: { label: string; prompt: string; perms: Record<string, unknown> }): Template {
  return {
    id, label, description, host: app, tags: ['panel', 'host API'],
    build: () => project(label, {
      'manifest.json': manifest({ id: 'pg.' + id, name: label, panelId: 'inspector', label, app, perms: action?.perms }),
      'index.html': `<!DOCTYPE html>
<html>
  <head><link rel="stylesheet" href="styles.css" /></head>
  <body>
    <div class="inspector">
      <sp-heading size="S">${label}</sp-heading>
      <sp-body id="summary" size="S">${action?.prompt ?? 'Click Refresh to read from the host.'}</sp-body>
      <sp-button id="refresh">${action?.label ?? 'Refresh'}</sp-button>
    </div>
    <script src="index.js"></script>
  </body>
</html>
`,
      'styles.css': `body { margin: 0; padding: 0; }
.inspector { display: flex; flex-direction: column; align-items: flex-start; padding: 12px; }
#summary { margin: 4px 0 12px; white-space: pre-wrap; }
`,
      'index.js': `${api}
const summary = document.getElementById("summary");
document.getElementById("refresh").addEventListener("click", async () => {
  try {
    summary.textContent = await inspect();
  } catch (error) {
    summary.textContent = error.message || String(error);
  }
});
`
    }, 'index.js', app)
  };
}

const HOST_STARTERS: Template[] = [
  inspectorTemplate('premierepro', 'premiere-sequence', 'Premiere Pro active sequence', 'Read the current project and sequence names.', `const { Project } = require("premierepro");

async function inspect() {
  const project = await Project.getActiveProject();
  if (!project) return "Open a Premiere Pro project and try again.";
  const sequence = await project.getActiveSequence();
  return project.name + " · " + (sequence ? sequence.name : "No active sequence");
}`),
  inspectorTemplate('premierepro', 'premiere-tracks', 'Premiere Pro track overview', 'Read video and audio track counts and the end time of the active sequence.', `const { Project } = require("premierepro");

async function inspect() {
  const project = await Project.getActiveProject();
  const sequence = project && await project.getActiveSequence();
  if (!sequence) return "Open a sequence and try again.";
  const video = await sequence.getVideoTrackCount();
  const audio = await sequence.getAudioTrackCount();
  const end = await sequence.getEndTime();
  return sequence.name + "\\nVideo tracks: " + video + "\\nAudio tracks: " + audio + "\\nEnd: " + end.seconds.toFixed(2) + " s";
}`),
  inspectorTemplate('premierepro', 'premiere-markers', 'Premiere Pro sequence markers', 'List the active sequence’s markers with timestamps.', `const { Project, Markers } = require("premierepro");

async function inspect() {
  const project = await Project.getActiveProject();
  const sequence = project && await project.getActiveSequence();
  if (!sequence) return "Open a sequence and try again.";
  const collection = await Markers.getMarkers(sequence);
  const markers = collection.getMarkers();
  return markers.map(marker => marker.getStart().seconds.toFixed(2) + " s · " + (marker.getName() || "Untitled marker")).join("\\n") || "No sequence markers.";
}`),
  inspectorTemplate('premierepro', 'premiere-project-sequences', 'Premiere Pro project sequences', 'List the sequences in the current project.', `const { Project } = require("premierepro");

async function inspect() {
  const project = await Project.getActiveProject();
  if (!project) return "Open a Premiere Pro project and try again.";
  const sequences = await project.getSequences();
  return sequences.map(sequence => sequence.name).join("\\n") || "No sequences in this project.";
}`),
  inspectorTemplate('premierepro', 'premiere-project-bin', 'Premiere Pro project bin', 'List items at the top level of the Project panel.', `const { Project } = require("premierepro");

async function inspect() {
  const project = await Project.getActiveProject();
  if (!project) return "Open a Premiere Pro project and try again.";
  const root = await project.getRootItem();
  const items = await root.getItems();
  return items.map(item => item.name).join("\\n") || "The project bin is empty.";
}`),
  inspectorTemplate('premierepro', 'premiere-import-srt', 'Premiere Pro subtitle import', 'Pick an SRT file and import it into the current project.', `const { Project } = require("premierepro");
const { storage } = require("uxp");

async function inspect() {
  const project = await Project.getActiveProject();
  if (!project) return "Open a Premiere Pro project and try again.";
  const file = await storage.localFileSystem.getFileForOpening({ types: ["srt"] });
  if (!file) return "No file selected.";
  const imported = await project.importFiles([file.nativePath], true);
  return imported ? "Imported " + file.name : "Premiere Pro could not import " + file.name;
}`, { label: 'Choose SRT file', prompt: 'Choose a subtitle file to add it to the Project panel.', perms: { localFileSystem: 'request' } }),
  inspectorTemplate('ID', 'indesign-pages', 'InDesign document pages', 'Read the active document name and page count.', `const { app } = require("indesign");

function inspect() {
  if (!app.documents.length) return "Open an InDesign document and try again.";
  const doc = app.activeDocument;
  return doc.name + " · " + doc.pages.length + " pages";
}`),
  inspectorTemplate('ame', 'media-encoder-queue', 'Media Encoder render queue', 'Read the queue status without starting a render.', `const { RenderQueue } = require("mediaencoder");

function inspect() {
  const status = RenderQueue.getInstance().getStatus();
  switch (status) {
    case RenderQueue.RENDER_QUEUE_STOPPED: return "Queue stopped";
    case RenderQueue.RENDER_QUEUE_RUNNING: return "Queue running";
    case RenderQueue.RENDER_QUEUE_PAUSED: return "Queue paused";
    case RenderQueue.RENDER_QUEUE_STOPPING: return "Queue stopping";
    default: return "Queue status: " + status;
  }
}`),
  inspectorTemplate('aftereffects', 'after-effects-project', 'After Effects project items', 'Read the item count and current selection in After Effects Beta.', `const app = require("aftereffects");

function inspect() {
  const project = app.project;
  if (!project) return "Open an After Effects project and try again.";
  const item = project.activeItem;
  return project.numItems + " project items · " + (item ? item.name : "No active item");
}`)
];

const PREMIERE_RECIPES: Template[] = premiereRecipeDefinitions.map(({ id, label, description, heading, recipe, html, script, permissions }) => ({
  id, label, description, recipe, host: 'premierepro', tags: ['recipe'],
  build: () => project(label, {
    'manifest.json': manifest({ id: 'pg.' + id, name: label, panelId: 'recipePanel', label, app: 'premierepro', perms: permissions, width: 340, height: 440 }),
    'index.html': `<!DOCTYPE html>
<html>
  <head><link rel="stylesheet" href="styles.css" /></head>
  <body>
    <div class="recipe">
      <sp-heading size="S">${heading}</sp-heading>
      ${html}
    </div>
    <script src="index.js"></script>
  </body>
</html>
`,
    'index.js': script,
    'styles.css': premiereRecipeStyles
  }, 'index.js', 'premierepro')
}));

export const TEMPLATES: Template[] = [BASE_TEMPLATES[0], ...PREMIERE_RECIPES, ...HOST_STARTERS, ...BASE_TEMPLATES.slice(1), ...EXTRA_TEMPLATES];

export function templateHash(template: Template, app: HostApp = 'PS'): string {
  return '#template=' + template.id + (template.host === 'shared' && app !== 'PS' ? '&host=' + app : '');
}

export function buildTemplate(template: Template, app: HostApp = 'PS'): Project {
  return template.build(template.host === 'shared' ? app : undefined);
}

export function templateById(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
