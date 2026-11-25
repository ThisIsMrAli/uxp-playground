export interface PremiereRecipe {
  task: 'review' | 'organize';
  input: string;
  expected: string;
  hostSteps: string[];
  docs: { label: string; url: string }[];
}

interface PremiereRecipeDefinition {
  id: string;
  label: string;
  description: string;
  heading: string;
  recipe: PremiereRecipe;
  html: string;
  script: string;
  permissions?: Record<string, unknown>;
}

export const premiereRecipeStyles = `body { margin: 0; padding: 0; overflow-y: auto; }
.recipe { display: flex; flex-direction: column; padding: 12px; }
.recipe sp-heading, .recipe sp-body, .recipe sp-label { margin-bottom: 8px; }
.recipe sp-textarea { width: 100%; min-height: 90px; margin-bottom: 12px; }
.actions { display: flex; flex-wrap: wrap; margin-bottom: 4px; }
.actions sp-button { margin: 0 8px 8px 0; }
#status, #output { white-space: pre-wrap; }
`;

const markerDocs = { label: 'Adobe Markers API', url: 'https://developer.adobe.com/premiere-pro/uxp/ppro-reference/classes/markers' };
const projectDocs = { label: 'Adobe Project API', url: 'https://developer.adobe.com/premiere-pro/uxp/ppro-reference/classes/project' };
const folderDocs = { label: 'Adobe FolderItem API', url: 'https://developer.adobe.com/premiere-pro/uxp/ppro-reference/classes/folderitem' };

export const premiereRecipeDefinitions: PremiereRecipeDefinition[] = [
  {
    id: 'premiere-marker-csv',
    label: 'Export review markers to CSV',
    heading: 'Review markers',
    description: 'Preview the active sequence’s marker names, comments, and times, then save a CSV for your review team.',
    recipe: {
      task: 'review',
      input: 'The sample sequence has Opening at 0 s and Review cut at 23.5 s.',
      expected: 'Preview CSV shows two rows with time, name, and comments. Save CSV writes review-markers.csv. In browser preview, the saved text appears in Console.',
      hostSteps: [
        'Open a disposable Premiere project and create or open a sequence.',
        'Click the timeline with no clip selected, then press M at the playhead to add a sequence marker. Double-click it to enter a name and a comment.',
        'Open the plugin panel and select Preview CSV. Check the rows against your sequence markers, then select Save CSV and open the saved file.'
      ],
      docs: [markerDocs]
    },
    html: `<sp-body size="S">Export marker times, names, and comments from the active sequence.</sp-body>
      <div class="actions">
        <sp-button id="preview">Preview CSV</sp-button>
        <sp-button id="save" variant="cta">Save CSV</sp-button>
      </div>
      <sp-body id="status" size="S" role="status"></sp-body>
      <sp-body id="output" size="S"></sp-body>`,
    script: String.raw`const { Project, Markers } = require("premierepro");
const { storage } = require("uxp");

function textCell(value) {
  const text = value || "";
  // Keep spreadsheet programs from interpreting marker text as a formula.
  const safe = /^\s*[=+@-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}

async function markerRows() {
  const project = await Project.getActiveProject();
  if (!project) throw new Error("Open a Premiere Pro project first.");
  const sequence = await project.getActiveSequence();
  if (!sequence) throw new Error("Open a sequence first.");
  const collection = await Markers.getMarkers(sequence);
  return collection.getMarkers().map(marker => ({
    seconds: marker.getStart().seconds,
    name: marker.getName(),
    comments: marker.getComments()
  })).sort((first, second) => first.seconds - second.seconds);
}

const status = document.getElementById("status");
const output = document.getElementById("output");
const preview = document.getElementById("preview");
const save = document.getElementById("save");

async function exportMarkers(write) {
  preview.disabled = true;
  save.disabled = true;
  output.textContent = "";
  try {
    const rows = await markerRows();
    if (!rows.length) {
      status.textContent = "No sequence markers to export.";
      return;
    }
    const lines = rows.map(row =>
      [row.seconds.toFixed(3), textCell(row.name), textCell(row.comments)].join(",")
    );
    const csv = ["seconds,name,comments", ...lines].join("\r\n") + "\r\n";
    status.textContent = rows.length + (rows.length === 1 ? " marker." : " markers.");
    output.textContent = csv;
    if (write) {
      const file = await storage.localFileSystem.getFileForSaving("review-markers.csv", { types: ["csv"] });
      if (!file) {
        status.textContent = "Save cancelled.";
        return;
      }
      await file.write(csv);
      status.textContent = "Saved " + file.name + ".";
    }
  } catch (error) {
    status.textContent = error.message || String(error);
  } finally {
    preview.disabled = false;
    save.disabled = false;
  }
}

preview.addEventListener("click", () => exportMarkers(false));
save.addEventListener("click", () => exportMarkers(true));
`,
    permissions: { localFileSystem: 'request' }
  },
  {
    id: 'premiere-review-notes',
    label: 'Turn review notes into markers',
    heading: 'Review notes',
    description: 'Paste timestamped feedback, check the parsed notes, and add sequence markers in one undoable edit.',
    recipe: {
      task: 'review',
      input: 'The panel starts with two sample notes at 00:01 and 00:03. Each line has a timestamp, a title, and optional comments separated by |.',
      expected: 'Preview notes shows Opening pace and Check lower third. Add markers creates both markers on the active sequence.',
      hostSteps: [
        'Open a disposable Premiere project with an active sequence longer than four seconds.',
        'Open the plugin, keep the sample notes or replace them with your own, and select Preview notes.',
        'Select Add markers. Open Window → Markers and check the times, names, and comments. One Undo removes both sample markers.'
      ],
      docs: [markerDocs, projectDocs]
    },
    html: `<sp-body size="S">Use MM:SS or HH:MM:SS, then | title | optional comments. Add .sss for fractional seconds.</sp-body>
      <sp-textarea id="notes" aria-label="Timestamped review notes">
        <sp-label slot="label">Timestamped review notes</sp-label>
      </sp-textarea>
      <div class="actions">
        <sp-button id="preview">Preview notes</sp-button>
        <sp-button id="apply" variant="cta">Add markers</sp-button>
      </div>
      <sp-body id="status" size="S" role="status"></sp-body>
      <sp-body id="output" size="S"></sp-body>`,
    script: String.raw`const { Project, Markers, TickTime } = require("premierepro");

const notes = document.getElementById("notes");
const status = document.getElementById("status");
const output = document.getElementById("output");
const preview = document.getElementById("preview");
const apply = document.getElementById("apply");

notes.value = "00:01 | Opening pace | Try holding the wide shot.\n" +
  "00:03 | Check lower third | Confirm the spelling.";

function parseNotes(input) {
  const rows = [];
  for (const [index, line] of input.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const match = /^(?:(\d{1,4}):)?([0-5]\d):([0-5]\d(?:\.\d{1,3})?)\s*\|\s*([^|]+?)(?:\s*\|\s*(.*))?$/.exec(line.trim());
    if (!match || !match[4].trim()) {
      throw new Error("Check the timestamp and title on line " + (index + 1) + ".");
    }
    const [, hours, minutes, seconds, title, comments = ""] = match;
    rows.push({
      line: index + 1,
      seconds: Number(hours || 0) * 3600 + Number(minutes) * 60 + Number(seconds),
      name: title.trim(),
      comments: comments.trim()
    });
  }
  if (!rows.length) throw new Error("Enter at least one review note.");
  return rows;
}

async function handleNotes(write) {
  preview.disabled = true;
  apply.disabled = true;
  output.textContent = "";
  try {
    const rows = parseNotes(notes.value);
    const project = await Project.getActiveProject();
    const sequence = project && await project.getActiveSequence();
    if (!sequence) throw new Error("Open a sequence first.");
    const end = await sequence.getEndTime();
    const outside = rows.find(row => row.seconds >= end.seconds);
    if (outside) throw new Error("The timestamp on line " + outside.line + " must be before the end of the sequence.");

    output.textContent = rows.map(row => row.seconds.toFixed(3) + " s · " + row.name).join("\n");
    if (!write) {
      status.textContent = rows.length + (rows.length === 1 ? " note ready." : " notes ready.");
      return;
    }

    const markers = await Markers.getMarkers(sequence);
    let added = 0;
    let success = true;
    project.lockedAccess(() => {
      const existing = new Set(markers.getMarkers().map(marker =>
        noteKey(marker.getStart().seconds, marker.getName(), marker.getComments())
      ));
      const newRows = rows.filter(row => {
        const key = noteKey(row.seconds, row.name, row.comments);
        if (existing.has(key)) return false;
        existing.add(key);
        return true;
      });
      if (!newRows.length) return;
      success = project.executeTransaction(transaction => {
        for (const row of newRows) {
          transaction.addAction(markers.createAddMarkerAction(
            row.name, "Comment", TickTime.createWithSeconds(row.seconds),
            TickTime.createWithSeconds(0), row.comments
          ));
        }
      }, "Add review markers");
      added = newRows.length;
    });
    if (!success) throw new Error("Premiere could not add the markers.");
    status.textContent = added
      ? "Added " + added + (added === 1 ? " sequence marker." : " sequence markers.")
      : "These review markers are already on the sequence.";
  } catch (error) {
    status.textContent = error.message || String(error);
  } finally {
    preview.disabled = false;
    apply.disabled = false;
  }
}

function noteKey(seconds, name, comments) {
  return JSON.stringify([seconds.toFixed(3), name, comments || ""]);
}

preview.addEventListener("click", () => handleNotes(false));
apply.addEventListener("click", () => handleNotes(true));
`
  },
  {
    id: 'premiere-organize-bins',
    label: 'Organize footage into bins',
    heading: 'Organize media',
    description: 'Preview a move plan for top-level media and sort video, audio, and stills into project bins.',
    recipe: {
      task: 'organize',
      input: 'The sample project contains Interview.mov, Room tone.wav, Title still.png, and existing Footage and Audio bins.',
      expected: 'Scan project proposes three moves. Move media reuses Footage and Audio, creates a Stills bin, and moves the loose media.',
      hostSteps: [
        'In a disposable Premiere project, import a video, an audio file, and an image directly into the project root.',
        'Open the plugin and select Scan project. Check the destination for each clip.',
        'Select Move media and expand Footage, Audio, and Stills in the Project panel. Undo the move and, if new bins were created, undo bin creation to restore the original layout.'
      ],
      docs: [folderDocs, projectDocs]
    },
    html: `<sp-body size="S">Sort recognized media at the top level of the Project panel into Footage, Audio, and Stills.</sp-body>
      <div class="actions">
        <sp-button id="preview">Scan project</sp-button>
        <sp-button id="apply" variant="cta" disabled>Move media</sp-button>
      </div>
      <sp-body id="status" size="S" role="status"></sp-body>
      <sp-body id="output" size="S"></sp-body>`,
    script: String.raw`const { Project, ProjectItem, FolderItem, ClipProjectItem } = require("premierepro");

const status = document.getElementById("status");
const output = document.getElementById("output");
const preview = document.getElementById("preview");
const apply = document.getElementById("apply");
let plan;

const categories = [
  { bin: "Footage", extensions: ["mov", "mp4", "mxf", "avi", "mts", "m4v"] },
  { bin: "Audio", extensions: ["wav", "mp3", "aif", "aiff", "m4a", "aac", "flac"] },
  { bin: "Stills", extensions: ["png", "jpg", "jpeg", "tif", "tiff", "psd", "gif", "bmp"] }
];

async function buildPlan(project) {
  const root = await project.getRootItem();
  const items = await root.getItems();
  const bins = getBins(items);
  const moves = [];
  for (const item of items) {
    if (item.type !== ProjectItem.TYPE_CLIP) continue;
    const clip = ClipProjectItem.cast(item);
    if (!clip || await clip.isSequence()) continue;
    const path = await clip.getMediaFilePath();
    const extension = /\.([a-z0-9]+)$/i.exec(path || "");
    const category = extension && categories.find(group => group.extensions.includes(extension[1].toLowerCase()));
    if (category) moves.push({ item, bin: category.bin });
  }
  return { root, bins, moves };
}

function getBins(items) {
  const bins = new Map();
  for (const { bin } of categories) {
    const item = items.find(item => item.type === ProjectItem.TYPE_BIN && item.name === bin);
    if (item) bins.set(bin, FolderItem.cast(item));
  }
  return bins;
}

function planKey(moves) {
  return JSON.stringify(moves.map(({ item, bin }) => [item.getId(), bin]).sort());
}

async function run(write) {
  preview.disabled = true;
  apply.disabled = true;
  let createdBins = false;
  try {
    const project = await Project.getActiveProject();
    if (!project) throw new Error("Open a Premiere Pro project first.");
    const { root, bins, moves } = await buildPlan(project);
    const key = planKey(moves);
    const projectId = project.guid.toString();
    output.textContent = moves.map(({ item, bin }) => item.name + " → " + bin).join("\n");
    if (!moves.length) {
      plan = null;
      status.textContent = "No recognized media at the project root.";
      return;
    }
    if (!write || !plan || plan.projectId !== projectId || plan.key !== key) {
      plan = { projectId, key };
      status.textContent = write ? "The project changed. Review the updated plan." :
        moves.length + (moves.length === 1 ? " move ready." : " moves ready.");
      return;
    }

    const missing = [...new Set(moves.map(move => move.bin))].filter(name => !bins.get(name));
    let destinations = bins;
    if (missing.length) {
      let success = false;
      project.lockedAccess(() => {
        success = project.executeTransaction(transaction => {
          for (const name of missing) transaction.addAction(root.createBinAction(name, false));
        }, "Create media bins");
      });
      if (!success) throw new Error("Premiere could not create the media bins.");
      createdBins = true;
      destinations = getBins(await root.getItems());
    }
    if (moves.some(move => !destinations.get(move.bin))) {
      throw new Error("A destination bin is missing. Scan the project again.");
    }
    let moved = false;
    project.lockedAccess(() => {
      moved = project.executeTransaction(transaction => {
        for (const { item, bin } of moves) {
          transaction.addAction(root.createMoveItemAction(item, destinations.get(bin)));
        }
      }, "Move media into bins");
    });
    if (!moved) throw new Error("Premiere could not move the media.");
    plan = null;
    status.textContent = "Moved " + moves.length + (moves.length === 1 ? " item." : " items.");
  } catch (error) {
    plan = null;
    status.textContent = (error.message || String(error)) +
      (createdBins ? " The new bins remain in the project and can be undone." : "");
  } finally {
    preview.disabled = false;
    apply.disabled = !plan;
  }
}

preview.addEventListener("click", () => run(false));
apply.addEventListener("click", () => run(true));
`
  }
];
