/*
 * UXP Playground preview runtime.
 * Runs inside the sandboxed preview iframe. It is plain script (no imports) because it is injected as text.
 * Everything here is an APPROXIMATION of UXP for a browser. It is not the UXP engine and not a real host.
 */
(function (root) {
  'use strict';
  var BOOT = root.__PG_BOOT__ || { manifest: {}, target: { app: 'PS', uxp: '9.2' }, modules: {}, vendor: null };
  var manifest = BOOT.manifest || {};
  var target = BOOT.target || {};
  var perms = manifest.requiredPermissions || {};

  // ---------------------------------------------------------------- bridge
  function safe(v, depth) {
    depth = depth || 0;
    if (v === undefined) return 'undefined';
    if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
    if (typeof v === 'symbol') return v.toString();
    if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
    if (v instanceof Error) return { __error: true, name: v.name, message: v.message, stack: String(v.stack || '') };
    if (depth > 8) return '[Object]';
    if (typeof Node !== 'undefined' && v instanceof Node) return '<' + (v.nodeName || 'node').toLowerCase() + '>';
    if (Array.isArray(v)) return v.slice(0, 100).map(function (x) { return safe(x, depth + 1); });
    var out = {};
    try {
      Object.keys(v).slice(0, 100).forEach(function (k) { if (typeof v[k] !== 'function') out[k] = safe(v[k], depth + 1); });
    } catch (e) { return String(v); }
    return out;
  }
  function post(type, payload) {
    try { root.parent.postMessage({ __pg: true, type: type, payload: safe(payload) }, '*'); } catch (e) { /* ignore */ }
  }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    var orig = root.console[level] ? root.console[level].bind(root.console) : function () {};
    root.console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      post('console', { level: level, args: args });
      orig.apply(null, args);
    };
  });
  root.addEventListener('error', function (e) {
    post('error', { message: e.message, source: e.filename, line: e.lineno, col: e.colno, stack: e.error && e.error.stack });
  });
  root.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    post('error', { message: 'Unhandled promise rejection: ' + (r && r.message ? r.message : String(r)), stack: r && r.stack });
  });

  var callSeq = 0;
  function hostCall(mod, fn, args, run) {
    var id = ++callSeq;
    var entry = { id: id, module: mod, fn: fn, args: args, modal: modal.depth > 0 ? modal.name : null };
    try {
      var res = run();
      if (res && typeof res.then === 'function') {
        return res.then(function (v) { entry.result = v; post('host-call', entry); return v; },
          function (err) { entry.error = err && err.message ? err.message : String(err); post('host-call', entry); throw err; });
      }
      entry.result = res; post('host-call', entry); return res;
    } catch (err) {
      entry.error = err && err.message ? err.message : String(err); post('host-call', entry); throw err;
    }
  }
  function note(mod, message) { post('host-call', { id: ++callSeq, module: mod, fn: '(note)', args: [], note: message }); }

  // ---------------------------------------------------------------- permissions (manifest v5)
  function domainAllowed(url) {
    var net = perms.network && perms.network.domains;
    if (net === 'all') return true;
    if (!Array.isArray(net)) return false;
    var u;
    try { u = new URL(url, 'https://invalid.invalid/'); } catch (e) { return false; }
    return net.some(function (d) {
      var p;
      try { p = new URL(String(d).replace('*.', 'wildcard.')); } catch (e) { return false; }
      if (p.protocol !== u.protocol) return false;
      if (p.hostname.indexOf('wildcard.') === 0) {
        var base = p.hostname.slice('wildcard.'.length);
        return u.hostname === base || u.hostname.slice(-(base.length + 1)) === '.' + base;
      }
      return p.hostname === u.hostname;
    });
  }
  function requireFsPermission(kind) {
    var v = perms.localFileSystem;
    var ok = kind === 'picker' ? (v === 'request' || v === 'fullAccess') : (v === 'fullAccess');
    if (!ok) {
      throw new Error('Permission denied (playground check): manifest requiredPermissions.localFileSystem is "' +
        (v || 'plugin') + '"; ' + (kind === 'picker' ? '"request" or "fullAccess"' : '"fullAccess"') + ' is needed.');
    }
  }

  // ---------------------------------------------------------------- tiny UI helpers (host dialogs)
  function hostAlert(message) {
    return new Promise(function (resolve) {
      var wrap = document.createElement('div');
      wrap.className = 'pg-host-alert';
      wrap.setAttribute('role', 'alertdialog');
      wrap.innerHTML = '<div class="pg-host-alert-box"><div class="pg-host-alert-title">Host alert (simulated)</div><div class="pg-host-alert-msg"></div><button type="button">OK</button></div>';
      wrap.querySelector('.pg-host-alert-msg').textContent = String(message);
      wrap.querySelector('button').addEventListener('click', function () { wrap.remove(); resolve(); });
      document.documentElement.appendChild(wrap);
    });
  }

  // ---------------------------------------------------------------- photoshop mock
  var modal = { depth: 0, name: null };
  var psState = {
    nextId: 10,
    activeDocId: 1,
    docs: [{
      id: 1, title: 'Untitled-1', width: 1920, height: 1080, resolution: 72,
      layers: [
        { id: 4, name: 'Title', kind: 'text', visible: true },
        { id: 3, name: 'Layer 1', kind: 'pixel', visible: true },
        { id: 2, name: 'Background', kind: 'pixel', visible: true, isBackgroundLayer: true }
      ],
      selected: [3]
    }]
  };
  var notifyListeners = [];
  function modalError(evt) {
    // Wording matches the real Photoshop error reported in AdobeDocs/uxp-photoshop issues.
    return new Error('Event: ' + evt + ' may modify the state of Photoshop. Such events are only allowed from inside a modal scope.');
  }
  function assertModal(evt) { if (modal.depth === 0) throw modalError(evt); }
  function activeDoc() { return psState.docs.filter(function (d) { return d.id === psState.activeDocId; })[0] || null; }
  function findLayer(doc, ref) {
    if (!doc) return null;
    if (!ref || ref._enum === 'ordinal') return doc.layers.filter(function (l) { return l.id === doc.selected[0]; })[0] || null;
    if (ref._id != null) return doc.layers.filter(function (l) { return l.id === ref._id; })[0] || null;
    if (ref._name != null) return doc.layers.filter(function (l) { return l.name === ref._name; })[0] || null;
    if (ref._index != null) return doc.layers[doc.layers.length - ref._index] || null;
    return null;
  }
  function fire(evt, desc) {
    notifyListeners.forEach(function (l) {
      if (l.events.indexOf(evt) >= 0 || l.events.indexOf('all') >= 0) {
        setTimeout(function () { try { l.cb(evt, desc); } catch (e) { console.error(e); } }, 0);
      }
    });
  }
  function wrapLayer(doc, l) {
    var api = {
      get id() { return l.id; },
      get _id() { return l.id; },
      get name() { return l.name; },
      set name(v) { hostCall('photoshop', 'Layer.name =', [v], function () { assertModal('set'); l.name = String(v); fire('set', { name: v }); }); },
      get kind() { return l.kind; },
      get visible() { return l.visible; },
      set visible(v) { hostCall('photoshop', 'Layer.visible =', [v], function () { assertModal('set'); l.visible = !!v; }); },
      get isBackgroundLayer() { return !!l.isBackgroundLayer; },
      get document() { return wrapDoc(doc); },
      delete: function () {
        return hostCall('photoshop', 'Layer.delete', [], function () {
          assertModal('delete');
          doc.layers = doc.layers.filter(function (x) { return x !== l; });
          doc.selected = doc.selected.filter(function (id) { return id !== l.id; });
        });
      },
      duplicate: function () {
        return hostCall('photoshop', 'Layer.duplicate', [], function () {
          assertModal('duplicate');
          var c = { id: psState.nextId++, name: l.name + ' copy', kind: l.kind, visible: l.visible };
          doc.layers.splice(doc.layers.indexOf(l), 0, c);
          return Promise.resolve(wrapLayer(doc, c));
        });
      }
    };
    return api;
  }
  function wrapDoc(doc) {
    if (!doc) return null;
    return {
      get id() { return doc.id; },
      get _id() { return doc.id; },
      get title() { return doc.title; },
      get name() { return doc.title; },
      get width() { return doc.width; },
      get height() { return doc.height; },
      get resolution() { return doc.resolution; },
      get layers() { return doc.layers.map(function (l) { return wrapLayer(doc, l); }); },
      get activeLayers() { return doc.layers.filter(function (l) { return doc.selected.indexOf(l.id) >= 0; }).map(function (l) { return wrapLayer(doc, l); }); },
      createLayer: function (opts) {
        return hostCall('photoshop', 'Document.createLayer', [opts], function () {
          assertModal('make');
          var l = { id: psState.nextId++, name: (opts && opts.name) || ('Layer ' + psState.nextId), kind: 'pixel', visible: true };
          doc.layers.unshift(l); doc.selected = [l.id]; fire('make', { name: l.name });
          return Promise.resolve(wrapLayer(doc, l));
        });
      },
      closeWithoutSaving: function () {
        return hostCall('photoshop', 'Document.closeWithoutSaving', [], function () {
          assertModal('close');
          psState.docs = psState.docs.filter(function (d) { return d !== doc; });
          psState.activeDocId = psState.docs[0] ? psState.docs[0].id : null;
        });
      }
    };
  }
  function layerDescriptor(doc, l) {
    return { _obj: 'layer', name: l.name, layerID: l.id, visible: l.visible, layerKind: l.kind === 'text' ? 3 : 1, itemIndex: doc.layers.length - doc.layers.indexOf(l) };
  }
  function docDescriptor(d) {
    return { _obj: 'document', title: d.title, documentID: d.id, width: { _unit: 'distanceUnit', _value: d.width }, height: { _unit: 'distanceUnit', _value: d.height }, resolution: { _unit: 'densityUnit', _value: d.resolution }, numberOfLayers: d.layers.length };
  }
  function pick(desc, prop) {
    if (!prop) return desc;
    var o = { _obj: desc._obj }; o[prop] = desc[prop]; return o;
  }
  function runDescriptor(d) {
    var evt = d && d._obj;
    var t = d && (d._target || d['null']);
    var refs = Array.isArray(t) ? t : (t ? [t] : []);
    var prop = (refs.filter(function (r) { return r._property; })[0] || {})._property;
    var docRef = refs.filter(function (r) { return r._ref === 'document'; })[0];
    var doc = docRef && docRef._id != null ? psState.docs.filter(function (x) { return x.id === docRef._id; })[0] : activeDoc();
    var layerRef = refs.filter(function (r) { return r._ref === 'layer'; })[0];
    if (evt === 'get') {
      if (layerRef) { var gl = findLayer(doc, layerRef); return gl ? pick(layerDescriptor(doc, gl), prop) : { _obj: 'error', message: 'The object "layer" is not currently available (playground mock).' }; }
      if (docRef || !refs.length) return doc ? pick(docDescriptor(doc), prop) : { _obj: 'error', message: 'No document open (playground mock).' };
      if (refs.some(function (r) { return r._ref === 'application'; })) return pick({ _obj: 'application', hostName: 'Adobe Photoshop (playground mock)', numberOfDocuments: psState.docs.length }, prop);
      return { _obj: 'error', message: 'get target not simulated by the playground' };
    }
    assertModal(evt);
    if (evt === 'set' && layerRef && d.to) {
      var sl = findLayer(doc, layerRef); if (!sl) return { _obj: 'error', message: 'Layer not found (playground mock).' };
      if (d.to.name != null) sl.name = String(d.to.name);
      fire('set', d); return {};
    }
    if (evt === 'make' && layerRef) {
      var nl = { id: psState.nextId++, name: (d.using && d.using.name) || ('Layer ' + psState.nextId), kind: 'pixel', visible: true };
      doc.layers.unshift(nl); doc.selected = [nl.id]; fire('make', d); return { layerID: nl.id };
    }
    if (evt === 'select' && layerRef) {
      var sel = findLayer(doc, layerRef); if (!sel) return { _obj: 'error', message: 'Layer not found (playground mock).' };
      doc.selected = [sel.id]; fire('select', d); return {};
    }
    if (evt === 'delete' && layerRef) {
      var dl = findLayer(doc, layerRef); if (!dl) return { _obj: 'error', message: 'Layer not found (playground mock).' };
      doc.layers = doc.layers.filter(function (x) { return x !== dl; }); doc.selected = []; fire('delete', d); return {};
    }
    if ((evt === 'show' || evt === 'hide') && layerRef) {
      var vl = findLayer(doc, layerRef); if (vl) vl.visible = evt === 'show'; fire(evt, d); return {};
    }
    note('photoshop', 'batchPlay event "' + evt + '" is not simulated; returned an empty descriptor.');
    fire(evt, d);
    return {};
  }
  var photoshop = {
    app: {
      get activeDocument() { return wrapDoc(activeDoc()); },
      get documents() { var a = psState.docs.map(wrapDoc); return a; },
      get version() { return BOOT.target.hostVersion || '27.4.0'; },
      showAlert: function (msg) { var p; hostCall('photoshop', 'app.showAlert', [msg], function () { p = hostAlert(msg); }); return p; },
      createDocument: function (opts) {
        return hostCall('photoshop', 'app.createDocument', [opts], function () {
          assertModal('make');
          var d = { id: psState.nextId++, title: (opts && opts.name) || 'Untitled-' + (psState.docs.length + 1), width: (opts && opts.width) || 1920, height: (opts && opts.height) || 1080, resolution: (opts && opts.resolution) || 72, layers: [{ id: psState.nextId++, name: 'Background', kind: 'pixel', visible: true, isBackgroundLayer: true }], selected: [] };
          psState.docs.push(d); psState.activeDocId = d.id; return Promise.resolve(wrapDoc(d));
        });
      }
    },
    action: {
      batchPlay: function (descriptors, options) {
        options = options || {};
        var list = Array.isArray(descriptors) ? descriptors : [descriptors];
        var exec = function () { return list.map(runDescriptor); };
        if (options.synchronousExecution) return hostCall('photoshop', 'action.batchPlay', [descriptors, options], exec);
        return hostCall('photoshop', 'action.batchPlay', [descriptors, options], function () {
          return new Promise(function (resolve, reject) { try { resolve(exec()); } catch (e) { reject(e); } });
        });
      },
      addNotificationListener: function (events, cb) {
        return hostCall('photoshop', 'action.addNotificationListener', [events], function () {
          notifyListeners.push({ events: (events || []).map(function (e) { return typeof e === 'string' ? e : e.event; }), cb: cb });
          return Promise.resolve();
        });
      },
      removeNotificationListener: function (events, cb) {
        return hostCall('photoshop', 'action.removeNotificationListener', [events], function () {
          notifyListeners = notifyListeners.filter(function (l) { return l.cb !== cb; }); return Promise.resolve();
        });
      }
    },
    core: {
      executeAsModal: function (fn, opts) {
        var name = (opts && opts.commandName) || '(no commandName)';
        return hostCall('photoshop', 'core.executeAsModal', [{ commandName: name }], function () {
          modal.depth++; modal.name = name;
          var ctx = {
            isCancelled: false,
            onCancel: null,
            reportProgress: function (p) { note('photoshop', 'reportProgress ' + JSON.stringify(safe(p))); },
            hostControl: {
              suspendHistory: function (o) { note('photoshop', 'suspendHistory ' + JSON.stringify(safe(o))); return Promise.resolve(1); },
              resumeHistory: function (id, commit) { note('photoshop', 'resumeHistory ' + id + ' commit=' + (commit !== false)); return Promise.resolve(); },
              registerAutoCloseDocument: function () { return Promise.resolve(); },
              unregisterAutoCloseDocument: function () { return Promise.resolve(); }
            }
          };
          return Promise.resolve().then(function () { return fn(ctx, opts && opts.descriptor); })
            .then(function (v) { modal.depth--; if (!modal.depth) modal.name = null; return v; },
              function (e) { modal.depth--; if (!modal.depth) modal.name = null; throw e; });
        });
      },
      showAlert: function (o) { var m = o && o.message != null ? o.message : o; var p; hostCall('photoshop', 'core.showAlert', [m], function () { p = hostAlert(m); }); return p; },
      getActiveTool: function () { return hostCall('photoshop', 'core.getActiveTool', [], function () { return Promise.resolve({ title: 'Move Tool (mock)' }); }); }
    },
    constants: new Proxy({}, {
      get: function (_t, group) {
        if (typeof group !== 'string') return undefined;
        return new Proxy({}, { get: function (_g, key) { return typeof key === 'string' ? key.toLowerCase().replace(/_/g, '') : undefined; } });
      }
    }),
    imaging: {
      getPixels: function () { return hostCall('photoshop', 'imaging.getPixels', [], function () { return Promise.reject(new Error('imaging is not simulated in the playground')); }); }
    }
  };

  // ---------------------------------------------------------------- uxp mock
  var memFiles = {};
  function makeFile(name, folderPath, initial, nativeFile) {
    var path = folderPath + '/' + name;
    if (initial != null) memFiles[path] = initial;
    return {
      name: name, nativePath: path, url: 'file://' + path, isFile: true, isFolder: false, isEntry: true,
      read: function (o) {
        return hostCall('uxp', 'File.read', [{ file: name, format: o && o.format ? String(o.format) : 'utf8' }], function () {
          if (nativeFile) {
            var binary = o && o.format === storage.formats.binary;
            return binary ? nativeFile.arrayBuffer() : nativeFile.text();
          }
          return Promise.resolve(memFiles[path] != null ? memFiles[path] : '');
        });
      },
      write: function (data, o) {
        return hostCall('uxp', 'File.write', [{ file: name, bytes: data && data.byteLength != null ? data.byteLength : String(data).length, append: !!(o && o.append) }], function () {
          memFiles[path] = (o && o.append && memFiles[path] ? memFiles[path] : '') + (typeof data === 'string' ? data : '[binary]');
          post('file-written', { path: path, name: name, content: typeof data === 'string' ? data.slice(0, 20000) : '[binary ' + (data.byteLength || 0) + ' bytes]' });
          return Promise.resolve(String(data).length);
        });
      },
      delete: function () { return hostCall('uxp', 'File.delete', [name], function () { delete memFiles[path]; return Promise.resolve(); }); },
      getMetadata: function () { return Promise.resolve({ size: nativeFile ? nativeFile.size : String(memFiles[path] || '').length, dateModified: new Date() }); }
    };
  }
  function makeFolder(name, path, readonlyFiles) {
    return {
      name: name, nativePath: path, isFile: false, isFolder: true, isEntry: true,
      getEntries: function () {
        return hostCall('uxp', 'Folder.getEntries', [path], function () {
          var names = {};
          Object.keys(readonlyFiles || {}).forEach(function (n) { names[n] = true; });
          Object.keys(memFiles).forEach(function (p) { if (p.indexOf(path + '/') === 0) names[p.slice(path.length + 1)] = true; });
          return Promise.resolve(Object.keys(names).map(function (n) { return makeFile(n, path, readonlyFiles && readonlyFiles[n]); }));
        });
      },
      getEntry: function (n) {
        return hostCall('uxp', 'Folder.getEntry', [n], function () {
          var exists = (readonlyFiles && readonlyFiles[n] != null) || memFiles[path + '/' + n] != null;
          if (!exists) return Promise.reject(new Error('Entry not found: ' + n + ' (playground mock)'));
          return Promise.resolve(makeFile(n, path, readonlyFiles && readonlyFiles[n]));
        });
      },
      createFile: function (n, o) {
        return hostCall('uxp', 'Folder.createFile', [n, o], function () { return Promise.resolve(makeFile(n, path, memFiles[path + '/' + n] || '')); });
      }
    };
  }
  function pickFiles(opts) {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      if (opts && opts.allowMultiple) input.multiple = true;
      if (opts && Array.isArray(opts.types) && opts.types.length && opts.types.indexOf('*') < 0) {
        input.accept = opts.types.map(function (t) { return '.' + String(t).replace(/^\./, ''); }).join(',');
      }
      input.addEventListener('change', function () {
        var files = Array.prototype.slice.call(input.files || []);
        input.remove();
        resolve(files);
      });
      input.addEventListener('cancel', function () { input.remove(); resolve([]); });
      document.body.appendChild(input);
      input.click();
    });
  }
  var storage = {
    formats: { utf8: 'utf8', binary: 'binary' },
    types: { file: 'file', folder: 'folder' },
    modes: { readOnly: 'readOnly', readWrite: 'readWrite' },
    domains: { userDesktop: 'userDesktop', userDocuments: 'userDocuments', userPictures: 'userPictures', userVideos: 'userVideos', userMusic: 'userMusic', appLocalData: 'appLocalData', appLocalLibrary: 'appLocalLibrary', appLocalCache: 'appLocalCache', appLocalShared: 'appLocalShared', appLocalTemporary: 'appLocalTemporary', appRoamingData: 'appRoamingData', appRoamingLibrary: 'appRoamingLibrary' },
    localFileSystem: {
      getFileForOpening: function (opts) {
        return hostCall('uxp', 'localFileSystem.getFileForOpening', [opts], function () {
          requireFsPermission('picker');
          return pickFiles(opts).then(function (files) {
            var entries = files.map(function (f) { return makeFile(f.name, '/picked', null, f); });
            if (opts && opts.allowMultiple) return entries;
            return entries[0] || null;
          });
        });
      },
      getFileForSaving: function (suggested, opts) {
        return hostCall('uxp', 'localFileSystem.getFileForSaving', [suggested, opts], function () {
          requireFsPermission('picker');
          return Promise.resolve(makeFile(suggested || 'untitled.txt', '/saved', ''));
        });
      },
      getFolder: function (opts) {
        return hostCall('uxp', 'localFileSystem.getFolder', [opts], function () {
          requireFsPermission('picker');
          return Promise.resolve(makeFolder('Picked Folder', '/picked-folder'));
        });
      },
      getPluginFolder: function () { return hostCall('uxp', 'localFileSystem.getPluginFolder', [], function () { return Promise.resolve(makeFolder('plugin', '/plugin', BOOT.sources || {})); }); },
      getDataFolder: function () { return hostCall('uxp', 'localFileSystem.getDataFolder', [], function () { return Promise.resolve(makeFolder('data', '/plugin-data')); }); },
      getTemporaryFolder: function () { return hostCall('uxp', 'localFileSystem.getTemporaryFolder', [], function () { return Promise.resolve(makeFolder('temp', '/plugin-temp')); }); },
      getEntryWithUrl: function (url) {
        return hostCall('uxp', 'localFileSystem.getEntryWithUrl', [url], function () {
          var u = String(url);
          if (!/^plugin(-data|-temp)?:/.test(u)) requireFsPermission('full');
          var name = u.split('/').pop();
          if (/^plugin:/.test(u) && BOOT.sources && BOOT.sources[name] != null) return Promise.resolve(makeFile(name, '/plugin', BOOT.sources[name]));
          return Promise.resolve(makeFile(name, '/url', memFiles['/url/' + name] || ''));
        });
      }
    }
  };
  var entrypointsConfig = null;
  var uxp = {
    storage: storage,
    entrypoints: {
      setup: function (cfg) {
        return hostCall('uxp', 'entrypoints.setup', [Object.keys(cfg || {})], function () {
          entrypointsConfig = cfg || {};
          post('entrypoints', {
            panels: Object.keys(entrypointsConfig.panels || {}),
            commands: Object.keys(entrypointsConfig.commands || {})
          });
          setTimeout(runLifecycle, 0);
        });
      }
    },
    shell: {
      openExternal: function (url) {
        return hostCall('uxp', 'shell.openExternal', [url], function () {
          var lp = perms.launchProcess;
          var scheme = String(url).split(':')[0];
          if (!lp || !Array.isArray(lp.schemes) || lp.schemes.indexOf(scheme) < 0) {
            return Promise.reject(new Error('Permission denied (playground check): add "' + scheme + '" to requiredPermissions.launchProcess.schemes'));
          }
          note('uxp', 'Would open ' + url + ' after a user consent dialog (not opened in the playground).');
          return Promise.resolve('');
        });
      },
      openPath: function (p) {
        return hostCall('uxp', 'shell.openPath', [p], function () {
          if (!perms.launchProcess) return Promise.reject(new Error('Permission denied (playground check): requiredPermissions.launchProcess is missing'));
          return Promise.resolve('');
        });
      }
    },
    host: { get name() { return hostName(target.app); }, get version() { return target.hostVersion || ''; }, uiLocale: 'en_US' },
    versions: { get uxp() { return 'uxp-' + (target.uxp || '') + ' (playground)'; }, get plugin() { return manifest.version || ''; } },
    userInfo: {
      userId: function () {
        if (!perms.enableUserInfo) throw new Error('Permission denied (playground check): requiredPermissions.enableUserInfo is not true');
        return 'playground-user-guid';
      }
    }
  };
  function hostName(app) {
    return { PS: 'Photoshop', ID: 'InDesign', premierepro: 'premierepro' }[app] || String(app || '');
  }
  function runLifecycle() {
    var cfg = entrypointsConfig || {};
    var p = Promise.resolve();
    if (cfg.plugin && typeof cfg.plugin.create === 'function') p = p.then(function () { note('uxp', 'plugin.create()'); return cfg.plugin.create(); });
    var panelIds = (manifest.entrypoints || []).filter(function (e) { return e.type === 'panel'; }).map(function (e) { return e.id; });
    var panelId = panelIds.filter(function (id) { return cfg.panels && cfg.panels[id]; })[0];
    var panel = panelId && cfg.panels[panelId];
    if (panel) {
      p = p.then(function () { if (panel.create) { note('uxp', 'panels.' + panelId + '.create(rootNode)'); return panel.create(document.body); } })
        .then(function () { if (panel.show) { note('uxp', 'panels.' + panelId + '.show(rootNode, data)'); return panel.show(document.body, {}); } });
    }
    p.catch(function (e) { console.error(e); });
  }
  function invokeCommand(id) {
    var cfg = entrypointsConfig || {};
    var cmd = cfg.commands && cfg.commands[id];
    if (!cmd) { note('uxp', 'Command "' + id + '" is not registered through entrypoints.setup()'); return; }
    var fn = typeof cmd === 'function' ? cmd : cmd.run;
    note('uxp', 'commands.' + id + '.run()');
    Promise.resolve().then(function () { return fn.call(cmd); }).catch(function (e) { console.error(e); });
  }
  function invokeMenu(panelId, menuId) {
    var cfg = entrypointsConfig || {};
    var panel = cfg.panels && cfg.panels[panelId];
    if (panel && panel.invokeMenu) { note('uxp', 'panels.' + panelId + '.invokeMenu("' + menuId + '")'); panel.invokeMenu(menuId); }
  }

  var premierepro = {
    Project: {
      getActiveProject: function () {
        return hostCall('premierepro', 'Project.getActiveProject', [], function () {
          return Promise.resolve({ name: 'Mock Project.prproj', getActiveSequence: function () { return hostCall('premierepro', 'Project.getActiveSequence', [], function () { return Promise.resolve({ name: 'Sequence 01' }); }); } });
        });
      }
    }
  };
  var indesign = {
    app: {
      get documents() { return { length: 0, item: function () { return null; } }; },
      get activeDocument() { note('indesign', 'app.activeDocument: no document in the playground stub'); return null; },
      doScript: function () { note('indesign', 'app.doScript is not simulated'); }
    }
  };

  // network permission check
  if (root.fetch) {
    var realFetch = root.fetch.bind(root);
    root.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || String(input);
      if (!domainAllowed(url)) {
        post('host-call', { id: ++callSeq, module: 'network', fn: 'fetch', args: [url], error: 'Blocked (playground check): domain not listed in requiredPermissions.network.domains' });
        return Promise.reject(new TypeError('Network request failed: ' + url + ' is not in manifest requiredPermissions.network.domains (playground check)'));
      }
      post('host-call', { id: ++callSeq, module: 'network', fn: 'fetch', args: [url], note: 'allowed by manifest' });
      return realFetch(input, init);
    };
  }

  // ---------------------------------------------------------------- CommonJS module runtime
  var vendor = null;
  function loadVendor() {
    if (vendor) return vendor;
    if (!BOOT.vendor) throw new Error('React vendor bundle is not loaded');
    var m = { exports: {} };
    (new Function('module', 'exports', 'require', 'process', BOOT.vendor + '\n//# sourceURL=playground:///vendor/react-bundle.js'))(m, m.exports, function () { return {}; }, { env: { NODE_ENV: 'production' } });
    vendor = m.exports;
    return vendor;
  }
  var builtins = {
    photoshop: function () { return photoshop; },
    uxp: function () { return uxp; },
    premierepro: function () { return premierepro; },
    indesign: function () { return indesign; },
    react: function () { return loadVendor().React; },
    'react-dom': function () { return loadVendor().ReactDOM; },
    'react-dom/client': function () { return loadVendor().ReactDOMClient; },
    'react/jsx-runtime': function () { return loadVendor().jsxRuntime; },
    'react/jsx-dev-runtime': function () { return loadVendor().jsxRuntime; }
  };
  var cache = {};
  function normalize(base, rel) {
    var parts = (base ? base.split('/').slice(0, -1) : []).concat(rel.split('/'));
    var out = [];
    parts.forEach(function (p) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); });
    return out.join('/');
  }
  function resolve(from, name) {
    var mods = BOOT.modules || {};
    var p = normalize(from, name.replace(/^plugin:\//, ''));
    var tries = [p, p + '.js', p + '.jsx', p + '.ts', p + '.tsx', p + '.json', p + '/index.js', p + '/index.jsx'];
    for (var i = 0; i < tries.length; i++) if (Object.prototype.hasOwnProperty.call(mods, tries[i])) return tries[i];
    return null;
  }
  function makeRequire(from) {
    return function require(name) {
      if (name.indexOf('adobe:') === 0) name = name.slice(6);
      if (builtins[name]) return builtins[name]();
      if (name.charAt(0) !== '.' && name.charAt(0) !== '/' && name.indexOf('plugin:') !== 0) {
        throw new Error('Cannot find module "' + name + '". The playground provides photoshop, uxp, premierepro, indesign, react and react-dom; other npm packages need a bundler.');
      }
      var path = resolve(from, name);
      if (!path) throw new Error('Cannot find module "' + name + '" from "' + (from || '/') + '"');
      return load(path);
    };
  }
  function load(path) {
    if (cache[path]) return cache[path].exports;
    var mod = BOOT.modules[path];
    var m = { exports: {}, id: path };
    cache[path] = m;
    if (mod.kind === 'json') { m.exports = JSON.parse(mod.code); return m.exports; }
    if (mod.error) { delete cache[path]; throw new SyntaxError(path + ': ' + mod.error); }
    var dir = path.split('/').slice(0, -1).join('/');
    var fn = new Function('module', 'exports', 'require', '__filename', '__dirname', mod.code + '\n//# sourceURL=plugin:///' + path);
    fn.call(m.exports, m, m.exports, makeRequire(path), path, dir);
    return m.exports;
  }
  root.require = makeRequire('');
  root.__pg = {
    run: function (path) {
      try { load(path); } catch (e) { console.error(e); post('error', { message: e.message, stack: e.stack }); }
    },
    invokeCommand: invokeCommand,
    domainAllowed: domainAllowed,
    state: psState,
    modal: modal,
    builtins: { photoshop: photoshop, uxp: uxp }
  };
  root.addEventListener('load', function () { setTimeout(function () { post('ready', { url: String(location.href).slice(0, 20) }); }, 0); });
  root.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.__pgParent && d.type === 'invokeCommand') invokeCommand(d.id);
    if (d.__pgParent && d.type === 'invokeMenu') invokeMenu(d.panelId, d.menuId);
  });

  // ---------------------------------------------------------------- Spectrum UXP widget approximations
  if (root.customElements) {
    var sheet = BOOT.shimCss || '';
    var define = function (name, cls) { if (!customElements.get(name)) customElements.define(name, cls); };
    var Base = function (tpl, css) {
      return class extends HTMLElement {
        constructor() {
          super();
          var s = this.attachShadow({ mode: 'open' });
          s.innerHTML = '<style>' + sheet + (css || '') + '</style>' + tpl;
        }
      };
    };
    define('sp-button', class extends Base('<button part="button" class="btn"><slot name="icon"></slot><slot></slot></button>') {
      static get observedAttributes() { return ['disabled']; }
      connectedCallback() { this.setAttribute('role', 'button'); if (!this.hasAttribute('tabindex')) this.tabIndex = 0; this.attributeChangedCallback(); }
      attributeChangedCallback() { this.shadowRoot.querySelector('button').disabled = this.hasAttribute('disabled'); }
    });
    define('sp-action-button', class extends Base('<button part="button" class="abtn"><slot name="icon"></slot><slot></slot></button>') {
      static get observedAttributes() { return ['disabled']; }
      attributeChangedCallback() { this.shadowRoot.querySelector('button').disabled = this.hasAttribute('disabled'); }
    });
    function fieldClass(tag, multiline) {
      return class extends Base('<label class="fieldwrap"><slot name="label"></slot>' + (multiline ? '<textarea class="field"></textarea>' : '<input class="field">') + '</label>') {
        static get observedAttributes() { return ['value', 'placeholder', 'disabled', 'type', 'readonly']; }
        constructor() {
          super();
          var f = this._f = this.shadowRoot.querySelector('.field');
          var self = this;
          f.addEventListener('input', function () { self.dispatchEvent(new Event('input', { bubbles: true })); });
          f.addEventListener('change', function () { self.dispatchEvent(new Event('change', { bubbles: true })); });
        }
        attributeChangedCallback(n, _o, v) {
          if (n === 'value') this._f.value = v == null ? '' : v;
          else if (n === 'disabled' || n === 'readonly') this._f[n === 'readonly' ? 'readOnly' : 'disabled'] = v != null;
          else if (n === 'type' && !multiline) this._f.type = v === 'number' ? 'number' : v === 'search' ? 'search' : 'text';
          else if (v == null) this._f.removeAttribute(n); else this._f.setAttribute(n, v);
        }
        get value() { return this._f.value; }
        set value(v) { this._f.value = v == null ? '' : v; }
        focus() { this._f.focus(); }
      };
    }
    define('sp-textfield', fieldClass('sp-textfield', false));
    define('sp-textarea', fieldClass('sp-textarea', true));
    function toggleClass(kind) {
      return class extends Base('<span class="tog ' + kind + '"><span class="box"></span><span class="lbl"><slot></slot></span></span>') {
        static get observedAttributes() { return ['checked', 'disabled', 'indeterminate']; }
        connectedCallback() {
          this.setAttribute('role', kind === 'switch' ? 'switch' : kind);
          if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
          if (!this._wired) {
            this._wired = true;
            var self = this;
            this.addEventListener('click', function () {
              if (self.hasAttribute('disabled')) return;
              if (kind === 'radio') { if (self.checked) return; self.checked = true; var g = self.closest('sp-radio-group'); if (g) Array.prototype.forEach.call(g.querySelectorAll('sp-radio'), function (r) { if (r !== self) r.checked = false; }); }
              else self.checked = !self.checked;
              self.dispatchEvent(new Event('change', { bubbles: true }));
            });
          }
        }
        get checked() { return this.hasAttribute('checked'); }
        set checked(v) { if (v) this.setAttribute('checked', ''); else this.removeAttribute('checked'); }
        get value() { return this.getAttribute('value'); }
      };
    }
    define('sp-checkbox', toggleClass('checkbox'));
    define('sp-switch', toggleClass('switch'));
    define('sp-radio', toggleClass('radio'));
    define('sp-radio-group', class extends Base('<div class="rgroup"><slot></slot></div>') {
      get selected() { var r = this.querySelector('sp-radio[checked]'); return r ? r.getAttribute('value') : null; }
    });
    define('sp-slider', class extends Base('<div class="slider"><div class="srow"><slot name="label"></slot><span class="sval"></span></div><input type="range" class="range"></div>') {
      static get observedAttributes() { return ['min', 'max', 'value', 'step', 'disabled', 'show-value']; }
      constructor() {
        super();
        var r = this._r = this.shadowRoot.querySelector('input');
        var self = this;
        r.addEventListener('input', function () { self._sync(); self.dispatchEvent(new Event('input', { bubbles: true })); });
        r.addEventListener('change', function () { self.dispatchEvent(new Event('change', { bubbles: true })); });
      }
      attributeChangedCallback(n, _o, v) { if (n === 'disabled') this._r.disabled = v != null; else if (n !== 'show-value') { if (v == null) this._r.removeAttribute(n); else this._r.setAttribute(n, v); if (n === 'value') this._r.value = v; } this._sync(); }
      _sync() { this.shadowRoot.querySelector('.sval').textContent = this.getAttribute('show-value') === 'false' ? '' : this._r.value; }
      get value() { return Number(this._r.value); }
      set value(v) { this._r.value = v; this._sync(); }
    });
    var pickerClass = class extends Base('<div class="picker"><slot name="label"></slot><button class="pbtn" type="button"><span class="ptxt"></span><span class="chev">▾</span></button><div class="pop" hidden><slot name="options"></slot></div></div>') {
      constructor() {
        super();
        var self = this;
        this.shadowRoot.querySelector('.pbtn').addEventListener('click', function () {
          if (self.hasAttribute('disabled')) return;
          var pop = self.shadowRoot.querySelector('.pop'); pop.hidden = !pop.hidden;
        });
        this.addEventListener('click', function (e) {
          var item = e.target && e.target.closest ? e.target.closest('sp-menu-item') : null;
          if (!item || !self.contains(item)) return;
          Array.prototype.forEach.call(self.querySelectorAll('sp-menu-item'), function (i) { i.removeAttribute('selected'); });
          item.setAttribute('selected', '');
          self.shadowRoot.querySelector('.pop').hidden = true;
          self._sync();
          self.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
      connectedCallback() { var self = this; setTimeout(function () { self._sync(); }, 0); }
      _items() { return Array.prototype.slice.call(this.querySelectorAll('sp-menu-item')); }
      _sync() {
        var sel = this._items().filter(function (i) { return i.hasAttribute('selected'); })[0];
        this.shadowRoot.querySelector('.ptxt').textContent = sel ? sel.textContent.trim() : (this.getAttribute('placeholder') || 'Select…');
      }
      get selectedIndex() { return this._items().findIndex(function (i) { return i.hasAttribute('selected'); }); }
      get value() { var i = this._items()[this.selectedIndex]; return i ? (i.getAttribute('value') || i.textContent.trim()) : undefined; }
    };
    define('sp-picker', pickerClass);
    define('sp-dropdown', class extends pickerClass {});
    define('sp-menu', class extends Base('<div class="menu" role="menu"><slot></slot></div>') {});
    define('sp-menu-item', class extends Base('<div class="mitem" role="menuitem"><slot></slot></div>') {});
    define('sp-progressbar', class extends Base('<div class="pb"><div class="srow"><slot name="label"></slot><span class="pval"></span></div><div class="track"><div class="fill"></div></div></div>') {
      static get observedAttributes() { return ['value', 'max']; }
      attributeChangedCallback() {
        var max = Number(this.getAttribute('max') || 100); var v = Number(this.getAttribute('value') || 0);
        var pct = Math.max(0, Math.min(100, (v / max) * 100));
        this.shadowRoot.querySelector('.fill').style.width = pct + '%';
        this.shadowRoot.querySelector('.pval').textContent = this.hasAttribute('show-value') ? Math.round(pct) + '%' : '';
      }
      connectedCallback() { this.attributeChangedCallback(); }
    });
    define('sp-divider', class extends HTMLElement {});
    define('sp-heading', class extends HTMLElement {});
    define('sp-body', class extends HTMLElement {});
    define('sp-detail', class extends HTMLElement {});
    define('sp-label', class extends HTMLElement {});
    define('sp-link', class extends HTMLElement {
      connectedCallback() {
        if (this._wired) return; this._wired = true;
        var self = this;
        this.addEventListener('click', function (e) {
          var href = self.getAttribute('href');
          if (href) { e.preventDefault(); note('uxp', 'sp-link to ' + href + ' would ask the user for consent and open the browser (manifest v5).'); }
        });
      }
    });
    define('sp-icon', class extends HTMLElement {});
  }
})(window);
