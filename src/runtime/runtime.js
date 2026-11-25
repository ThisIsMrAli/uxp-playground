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
  // requiredPermissions arrived with manifest v5; manifest v4 plugins are not checked.
  var PERMS_ENFORCED = Number(manifest.manifestVersion || 0) >= 5;
  if (!PERMS_ENFORCED) {
    perms = { localFileSystem: 'fullAccess', network: { domains: 'all' }, launchProcess: { schemes: ['*'], extensions: ['*'] }, clipboard: 'readAndWrite', enableUserInfo: true, allowCodeGenerationFromStrings: true };
    setTimeout(function () { note('uxp', 'manifest v' + (manifest.manifestVersion || '?') + ': permission checks (requiredPermissions) apply to manifest v5 and later, so the playground does not check them for this plugin.'); }, 0);
  }

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
    if (typeof v.__pgSummary === 'function') { try { return v.__pgSummary(); } catch (e) { return '[Object]'; } }
    if (v instanceof ArrayBuffer) return '[ArrayBuffer ' + v.byteLength + ' bytes]';
    if (ArrayBuffer.isView && ArrayBuffer.isView(v)) return '[' + (v.constructor && v.constructor.name) + ' ' + v.length + ']';
    if (v instanceof Map) return { '[Map]': safe(Array.from(v.entries()).slice(0, 50), depth + 1) };
    if (v instanceof Set) return { '[Set]': safe(Array.from(v.values()).slice(0, 50), depth + 1) };
    if (v instanceof Date) return v.toISOString();
    if (typeof v.then === 'function') return '[Promise]';
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
    var msg = e.message === 'Script error.' ? 'Script error in a cross-origin script' + (e.filename ? ' (' + e.filename + ')' : '') + '; the browser hides the details of errors from remote scripts.' : e.message;
    post('error', { message: msg, source: e.filename, line: e.lineno, col: e.colno, stack: e.error && e.error.stack });
  });
  root.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    post('error', { message: 'Unhandled promise rejection: ' + describeReason(r), stack: r && r.stack });
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
  function describeReason(r) {
    if (r && r.message) return r.message;
    if (typeof Event !== 'undefined' && r instanceof Event) {
      var t = r.target;
      var what = t && typeof XMLHttpRequest !== 'undefined' && t instanceof XMLHttpRequest ? 'XMLHttpRequest' : t && typeof WebSocket !== 'undefined' && t instanceof WebSocket ? 'WebSocket' : t && t.nodeName ? '<' + t.nodeName.toLowerCase() + '>' : 'object';
      return (r.constructor && r.constructor.name || 'Event') + ' "' + r.type + '" from ' + what + (r.type === 'error' ? ' (a network request failed: the server is offline, blocked by CORS, or not reachable from the playground)' : '');
    }
    if (r && typeof r === 'object') { try { return JSON.stringify(r).slice(0, 300); } catch (e) { /* fall through */ } }
    return String(r);
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

  // ---------------------------------------------------------------- unsupported-API marking
  // Anything the mocks do not implement is reported clearly instead of failing as "x is not a function".
  var reportedMissing = {};
  var PASS_THROUGH = { then: 1, toJSON: 1, __esModule: 1, 'default': 1, $$typeof: 1, constructor: 1, prototype: 1, nodeType: 1, length: 1, asymmetricMatch: 1, __pgSummary: 1, _reactFragment: 1, valueOf: 1, toString: 1, inspect: 1, tagName: 1 };
  var METHOD_LIKE = /^(apply|create|duplicate|resize|rotate|merge|flatten|save|close|crop|trim|move|select|group|ungroup|link|unlink|convert|rasterize|fill|add|remove|get|set|paste|copy|cut|clear|scale|translate|flip|invert|bring|send|open|play|record|validate|load|export|import|suspend|resume|update|delete|reveal|change|make|show|hide|edit|place|sample|calculate|split|skew|warp|align|distribute|stroke|purge|revert|undo|redo|perform|invoke|request|register|unregister|execute)/;
  var PS_API = BOOT.psApi || { source: '', members: {}, constants: {} };
  function missingMessage(full, path, prop) {
    var table = PS_API.members[path];
    if (table && table[prop]) return full + ' exists in Photoshop (' + PS_API.source + ') but is not simulated by UXP Playground. Test it in UDT.';
    if (table) return full + ' is not in the Photoshop API typings (' + PS_API.source + '). Check the spelling or the Photoshop version that added it.';
    return full + ' is not simulated by UXP Playground. It may exist in the real host: check the API reference and test in UDT.';
  }
  function unsupportedFn(full, path, prop) {
    return function () {
      var msg = missingMessage(full, path, prop);
      post('host-call', { id: ++callSeq, module: full.split('.')[0], fn: full.split('.').slice(1).join('.') || full, args: Array.prototype.slice.call(arguments), error: msg, unsupported: true });
      throw new Error(msg);
    };
  }
  function guard(obj, path, mode) {
    if (typeof Proxy === 'undefined') return obj;
    return new Proxy(obj, {
      get: function (t, prop, recv) {
        if (prop in t || typeof prop === 'symbol' || PASS_THROUGH[prop]) return Reflect.get(t, prop, recv);
        var full = path + '.' + String(prop);
        var table = PS_API.members[path];
        var kind = table && table[prop];
        var callable = kind ? kind === 'm' : (mode === 'module' || METHOD_LIKE.test(String(prop)));
        if (!reportedMissing[full]) {
          reportedMissing[full] = true;
          post('host-call', { id: ++callSeq, module: path.split('.')[0], fn: full.split('.').slice(1).join('.'), args: [], note: missingMessage(full, path, String(prop)) + (callable ? '' : ' Returned undefined.'), unsupported: true });
        }
        return callable ? unsupportedFn(full, path, String(prop)) : undefined;
      }
    });
  }
  function summary(obj, fn) { Object.defineProperty(obj, '__pgSummary', { value: fn, enumerable: false }); return obj; }

  // ---------------------------------------------------------------- photoshop mock
  var modal = { depth: 0, name: null };
  // Adobe: apiVersion defaults to 2 when host.minVersion >= 23.0.0, otherwise 1; host.data.apiVersion overrides it.
  var psHost = (Array.isArray(manifest.host) ? manifest.host.filter(function (h) { return h && h.app === 'PS'; })[0] : manifest.host) || {};
  var apiVersion = psHost.data && psHost.data.apiVersion ? Number(psHost.data.apiVersion) : (cmpVer(psHost.minVersion || '0', '23.0.0') >= 0 ? 2 : 1);
  function cmpVer(a, b) {
    var x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (var i = 0; i < Math.max(x.length, y.length); i++) { var d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
    return 0;
  }
  function rect(l, t, r, b) { return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }; }
  function L(id, name, kind, extra) {
    var o = { id: id, name: name, kind: kind, visible: true, opacity: 100, fillOpacity: 100, blendMode: 'normal', locked: false, bounds: rect(0, 0, 1920, 1080) };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  var psState = {
    nextId: 10,
    activeDocId: 1,
    docs: [{
      id: 1, title: 'Untitled-1', width: 1920, height: 1080, resolution: 72, mode: 'RGBColorMode', bitsPerChannel: 8, saved: true,
      layers: [
        L(4, 'Title', 'text', { bounds: rect(160, 120, 900, 220), text: { contents: 'Hello UXP', size: 72, font: 'MyriadPro-Regular' } }),
        L(5, 'Shapes', 'group', { bounds: rect(200, 300, 1100, 800), children: [
          L(6, 'Circle', 'pixel', { bounds: rect(200, 300, 600, 700) }),
          L(7, 'Square', 'pixel', { bounds: rect(700, 400, 1100, 800) })
        ] }),
        L(3, 'Layer 1', 'pixel', { bounds: rect(100, 100, 1820, 980) }),
        L(2, 'Background', 'pixel', { isBackgroundLayer: true, locked: true })
      ],
      selected: [3],
      selection: null
    }],
    foreground: { red: 0, green: 0, blue: 0 },
    background: { red: 255, green: 255, blue: 255 }
  };
  var notifyListeners = [];
  var coreListeners = [];
  function modalError(evt) {
    // Wording matches the real Photoshop error reported in AdobeDocs/uxp-photoshop issues and Adobe's blog post.
    return new Error('Event: ' + evt + ' may modify the state of Photoshop. Such events are only allowed from inside a modal scope.');
  }
  var warnedApi1 = false;
  function assertModal(evt) {
    if (modal.depth > 0) return;
    if (apiVersion < 2) {
      if (!warnedApi1) { warnedApi1 = true; note('photoshop', 'apiVersion 1 (host.minVersion < 23.0.0 and no host.data.apiVersion): Photoshop allows "' + evt + '" outside executeAsModal, but apiVersion 1 is deprecated. With apiVersion 2 this call throws.'); }
      return;
    }
    note('photoshop', 'Hint: wrap state-changing calls ("' + evt + '") in require("photoshop").core.executeAsModal(async () => { ... }, { commandName: "..." }).');
    throw modalError(evt);
  }
  function activeDoc() { return psState.docs.filter(function (d) { return d.id === psState.activeDocId; })[0] || null; }
  function flat(list, out, parent) {
    out = out || [];
    (list || []).forEach(function (l) { out.push(l); l._parent = parent || null; if (l.children) flat(l.children, out, l); });
    return out;
  }
  function allLayers(doc) { return doc ? flat(doc.layers) : []; }
  function siblingsOf(doc, l) { return l._parent ? l._parent.children : doc.layers; }
  function bottomUp(doc) { return allLayers(doc).slice().reverse(); }
  function findLayer(doc, ref) {
    if (!doc) return null;
    var all = allLayers(doc);
    if (!ref || ref._enum === 'ordinal') return all.filter(function (l) { return l.id === doc.selected[0]; })[0] || null;
    if (ref._id != null) return all.filter(function (l) { return l.id === ref._id; })[0] || null;
    if (ref._name != null) return all.filter(function (l) { return l.name === ref._name; })[0] || null;
    if (ref._index != null) { var bu = bottomUp(doc); var hasBg = bu[0] && bu[0].isBackgroundLayer; return bu[hasBg ? ref._index : ref._index - 1] || null; }
    return null;
  }
  function itemIndexOf(doc, l) { var bu = bottomUp(doc); var hasBg = bu[0] && bu[0].isBackgroundLayer; return bu.indexOf(l) + (hasBg ? 0 : 1); }
  function fire(evt, desc) {
    notifyListeners.forEach(function (l) {
      if (l.events.indexOf(evt) >= 0 || l.events.indexOf('all') >= 0) {
        setTimeout(function () { try { l.cb(evt, desc); } catch (e) { console.error(e); } }, 0);
      }
    });
  }
  function removeLayer(doc, l) {
    var sib = siblingsOf(doc, l); var i = sib.indexOf(l); if (i >= 0) sib.splice(i, 1);
    doc.selected = doc.selected.filter(function (id) { return id !== l.id; });
  }
  function cloneLayer(l, suffix) {
    var c = JSON.parse(JSON.stringify(l, function (k, v) { return k === '_parent' ? undefined : v; }));
    (function renum(x) { x.id = psState.nextId++; (x.children || []).forEach(renum); })(c);
    if (suffix) c.name = l.name + suffix;
    c.isBackgroundLayer = false; c.locked = false;
    return c;
  }
  function boundsOf(l) {
    if (l.children && l.children.length) {
      var bs = l.children.map(boundsOf);
      return rect(Math.min.apply(null, bs.map(function (b) { return b.left; })), Math.min.apply(null, bs.map(function (b) { return b.top; })), Math.max.apply(null, bs.map(function (b) { return b.right; })), Math.max.apply(null, bs.map(function (b) { return b.bottom; })));
    }
    return rect(l.bounds.left, l.bounds.top, l.bounds.right, l.bounds.bottom);
  }
  function shift(l, dx, dy) { l.bounds = rect(l.bounds.left + dx, l.bounds.top + dy, l.bounds.right + dx, l.bounds.bottom + dy); (l.children || []).forEach(function (c) { shift(c, dx, dy); }); }
  function scaleLayer(l, sx, sy) {
    var b = boundsOf(l); var cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2;
    (function sc(x) { var bb = x.bounds; x.bounds = rect(Math.round(cx + (bb.left - cx) * sx), Math.round(cy + (bb.top - cy) * sy), Math.round(cx + (bb.right - cx) * sx), Math.round(cy + (bb.bottom - cy) * sy)); (x.children || []).forEach(sc); })(l);
  }
  function solidColor(rgb) {
    var c = rgb || { red: 0, green: 0, blue: 0 };
    var hex = function () { return [c.red, c.green, c.blue].map(function (n) { var h = Math.round(n).toString(16).toUpperCase(); return h.length < 2 ? '0' + h : h; }).join(''); };
    return summary({
      rgb: {
        get red() { return c.red; }, set red(v) { c.red = v; },
        get green() { return c.green; }, set green(v) { c.green = v; },
        get blue() { return c.blue; }, set blue(v) { c.blue = v; },
        get hexValue() { return hex(); }, set hexValue(v) { var s = String(v).replace('#', ''); c.red = parseInt(s.slice(0, 2), 16); c.green = parseInt(s.slice(2, 4), 16); c.blue = parseInt(s.slice(4, 6), 16); }
      },
      typename: 'SolidColor'
    }, function () { return { typename: 'SolidColor', hex: '#' + hex() }; });
  }
  function SolidColor() { return solidColor({ red: 0, green: 0, blue: 0 }); }
  // Document.colorSamplers: samplers read the synthetic gradient that imaging.getPixels also returns.
  function sampleAt(doc, x, y) {
    var w = doc.width, h = doc.height;
    return { red: (x * 255 / Math.max(1, w - 1) + 11) & 255, green: (y * 255 / Math.max(1, h - 1)) & 255, blue: (11 * 3 + 128) & 255 };
  }
  function colorSamplers(doc) {
    doc.samplers = doc.samplers || [];
    var wrap = function (s) {
      return summary({
        typename: 'ColorSampler',
        get docId() { return doc.id; },
        get position() { return { x: s.x, y: s.y }; },
        get color() { return solidColor(sampleAt(doc, s.x, s.y)); },
        move: function (pos) { assertModal('move'); s.x = Number(pos && pos.x) || 0; s.y = Number(pos && pos.y) || 0; },
        remove: function () { assertModal('delete'); doc.samplers = doc.samplers.filter(function (x) { return x !== s; }); }
      }, function () { return { typename: 'ColorSampler', position: { x: s.x, y: s.y } }; });
    };
    var arr = doc.samplers.map(wrap);
    Object.defineProperty(arr, 'typename', { value: 'ColorSamplers', enumerable: false });
    Object.defineProperty(arr, 'add', { enumerable: false, value: function (pos) {
      assertModal('make');
      var s = { x: Number(pos && pos.x) || 0, y: Number(pos && pos.y) || 0 };
      doc.samplers.push(s);
      return wrap(s);
    } });
    Object.defineProperty(arr, 'removeAll', { enumerable: false, value: function () { assertModal('delete'); doc.samplers = []; } });
    return arr;
  }
  function layerCollection(doc, list) {
    var arr = list.map(function (l) { return wrapLayer(doc, l); });
    Object.defineProperty(arr, 'getByName', { value: function (n) { return arr.filter(function (x) { return x.name === n; })[0] || null; }, enumerable: false });
    Object.defineProperty(arr, 'typename', { value: 'Layers', enumerable: false });
    return arr;
  }
  function mutate(name, args, evt, fn) {
    return hostCall('photoshop', name, args, function () { assertModal(evt); var r = fn(); fire(evt, { _obj: evt }); return r; });
  }
  function wrapLayer(doc, l) {
    var api = {
      get id() { return l.id; },
      get _id() { return l.id; },
      get typename() { return 'Layer'; },
      get name() { return l.name; },
      set name(v) { mutate('Layer.name =', [v], 'set', function () { l.name = String(v); }); },
      get kind() { return l.kind; },
      get visible() { return l.visible; },
      set visible(v) { mutate('Layer.visible =', [v], 'set', function () { l.visible = !!v; }); },
      get opacity() { return l.opacity; },
      set opacity(v) { mutate('Layer.opacity =', [v], 'set', function () { l.opacity = Math.max(0, Math.min(100, Number(v))); }); },
      get fillOpacity() { return l.fillOpacity; },
      set fillOpacity(v) { mutate('Layer.fillOpacity =', [v], 'set', function () { l.fillOpacity = Math.max(0, Math.min(100, Number(v))); }); },
      get blendMode() { return l.blendMode; },
      set blendMode(v) { mutate('Layer.blendMode =', [v], 'set', function () { l.blendMode = String(v); }); },
      get bounds() { return boundsOf(l); },
      get boundsNoEffects() { return boundsOf(l); },
      get isBackgroundLayer() { return !!l.isBackgroundLayer; },
      get allLocked() { return !!l.locked; },
      set allLocked(v) { mutate('Layer.allLocked =', [v], 'set', function () { l.locked = !!v; }); },
      get locked() { return !!l.locked; },
      get selected() { return doc.selected.indexOf(l.id) >= 0; },
      set selected(v) { mutate('Layer.selected =', [v], 'select', function () { if (v) { if (doc.selected.indexOf(l.id) < 0) doc.selected.push(l.id); } else doc.selected = doc.selected.filter(function (id) { return id !== l.id; }); }); },
      get parent() { return l._parent ? wrapLayer(doc, l._parent) : null; },
      get layers() { return l.children ? layerCollection(doc, l.children) : null; },
      get document() { return wrapDoc(doc); },
      get textItem() {
        if (l.kind !== 'text') return null;
        return summary({
          get contents() { return l.text.contents; },
          set contents(v) { mutate('TextItem.contents =', [v], 'set', function () { l.text.contents = String(v); }); },
          get isParagraphText() { return false; },
          get isPointText() { return true; },
          characterStyle: { get size() { return l.text.size; }, set size(v) { mutate('CharacterStyle.size =', [v], 'set', function () { l.text.size = Number(v); }); }, get font() { return l.text.font; } }
        }, function () { return { typename: 'TextItem', contents: l.text.contents }; });
      },
      delete: function () { return mutate('Layer.delete', [], 'delete', function () { removeLayer(doc, l); }); },
      duplicate: function (target, placement, name) {
        return mutate('Layer.duplicate', [name], 'duplicate', function () {
          var c = cloneLayer(l, name ? '' : ' copy'); if (name) c.name = String(name);
          var sib = siblingsOf(doc, l); sib.splice(sib.indexOf(l), 0, c);
          return Promise.resolve(wrapLayer(doc, c));
        });
      },
      translate: function (dx, dy) { return mutate('Layer.translate', [dx, dy], 'move', function () { shift(l, Number(dx && dx._value != null ? dx._value : dx) || 0, Number(dy && dy._value != null ? dy._value : dy) || 0); return Promise.resolve(); }); },
      scale: function (w, h) { return mutate('Layer.scale', [w, h], 'transform', function () { scaleLayer(l, (Number(w) || 100) / 100, (Number(h != null ? h : w) || 100) / 100); return Promise.resolve(); }); },
      rotate: function (a) { return mutate('Layer.rotate', [a], 'transform', function () { note('photoshop', 'Layer.rotate: bounds are not recomputed by the playground'); return Promise.resolve(); }); },
      flip: function (axis) { return mutate('Layer.flip', [axis], 'flip', function () { return Promise.resolve(); }); },
      rasterize: function () { return mutate('Layer.rasterize', [], 'rasterizeLayer', function () { if (l.kind !== 'group') l.kind = 'pixel'; return Promise.resolve(); }); },
      merge: function () { return mutate('Layer.merge', [], 'mergeLayersNew', function () { return Promise.resolve(wrapLayer(doc, l)); }); },
      move: function (rel, placement) { return mutate('Layer.move', [rel && rel.name, placement], 'move', function () { return moveRel(doc, l, rel, placement); }); },
      moveAbove: function (rel) { return mutate('Layer.moveAbove', [rel && rel.name], 'move', function () { return moveRel(doc, l, rel, 'placeBefore'); }); },
      moveBelow: function (rel) { return mutate('Layer.moveBelow', [rel && rel.name], 'move', function () { return moveRel(doc, l, rel, 'placeAfter'); }); },
      bringToFront: function () { return mutate('Layer.bringToFront', [], 'move', function () { var s = siblingsOf(doc, l); s.splice(s.indexOf(l), 1); s.unshift(l); }); },
      sendToBack: function () { return mutate('Layer.sendToBack', [], 'move', function () { var s = siblingsOf(doc, l); s.splice(s.indexOf(l), 1); var bg = s.length && s[s.length - 1].isBackgroundLayer; s.splice(bg ? s.length - 1 : s.length, 0, l); }); },
      link: function () { return mutate('Layer.link', [], 'linkSelectedLayers', function () { return []; }); },
      unlink: function () { return mutate('Layer.unlink', [], 'unlinkSelectedLayers', function () {}); },
      clear: function () { return mutate('Layer.clear', [], 'delete', function () {}); }
    };
    Object.keys(PS_API.members['photoshop.Layer'] || {}).forEach(function (m) {
      if (/^apply/.test(m) && !(m in api)) api[m] = function () { var args = Array.prototype.slice.call(arguments); return mutate('Layer.' + m, args, m.replace(/^apply/, '').replace(/^./, function (c) { return c.toLowerCase(); }), function () { note('photoshop', 'Layer.' + m + ': filter accepted; the playground does not render pixels.'); return Promise.resolve(); }); };
    });
    summary(api, function () { return { typename: 'Layer', id: l.id, name: l.name, kind: l.kind, visible: l.visible }; });
    return guard(api, 'photoshop.Layer', 'dom');
  }
  function moveRel(doc, l, rel, placement) {
    if (!rel || rel.id == null) return Promise.resolve();
    var all = allLayers(doc); var target = all.filter(function (x) { return x.id === rel.id; })[0];
    if (!target || target === l) return Promise.resolve();
    removeLayer(doc, l);
    if (placement === 'placeInside' && target.children) target.children.unshift(l);
    else { var s = siblingsOf(doc, target); s.splice(s.indexOf(target) + (placement === 'placeAfter' ? 1 : 0), 0, l); }
    return Promise.resolve();
  }
  function newDoc(opts) {
    opts = opts || {};
    var d = { id: psState.nextId++, title: opts.name || 'Untitled-' + (psState.docs.length + 1), width: Number(opts.width) || 1920, height: Number(opts.height) || 1080, resolution: Number(opts.resolution) || 72, mode: opts.mode || 'RGBColorMode', bitsPerChannel: 8, saved: false, layers: [], selected: [], selection: null };
    var bg = L(psState.nextId++, 'Background', 'pixel', { isBackgroundLayer: true, locked: true, bounds: rect(0, 0, d.width, d.height) });
    d.layers.push(bg); d.selected = [bg.id];
    psState.docs.push(d); psState.activeDocId = d.id;
    return d;
  }
  function saveStub(kind, doc) {
    return function (entry, opts) {
      return hostCall('photoshop', 'Document.saveAs.' + kind, [entry && entry.name, opts], function () {
        assertModal('save');
        if (entry && entry.write) entry.write('[' + kind.toUpperCase() + ' bytes of "' + doc.title + '" — not produced by the playground]');
        doc.saved = true;
        return Promise.resolve();
      });
    };
  }
  function wrapDoc(doc) {
    if (!doc) return null;
    var api = {
      get id() { return doc.id; },
      get _id() { return doc.id; },
      get typename() { return 'Document'; },
      get title() { return doc.title; },
      get name() { return doc.title; },
      get width() { return doc.width; },
      get height() { return doc.height; },
      get resolution() { return doc.resolution; },
      get mode() { return doc.mode; },
      get bitsPerChannel() { return 'bitDepth' + doc.bitsPerChannel; },
      get colorProfileName() { return 'sRGB IEC61966-2.1'; },
      get pixelAspectRatio() { return 1; },
      get path() { return ''; },
      get saved() { return !!doc.saved; },
      get cloudDocument() { return false; },
      get zoom() { return 100; },
      get layers() {
        var c = layerCollection(doc, doc.layers);
        Object.defineProperty(c, 'add', { enumerable: false, value: function () { return api.createLayer({}); } });
        return c;
      },
      get activeLayers() { return layerCollection(doc, allLayers(doc).filter(function (l) { return doc.selected.indexOf(l.id) >= 0; })); },
      get backgroundLayer() { var b = doc.layers.filter(function (l) { return l.isBackgroundLayer; })[0]; return b ? wrapLayer(doc, b) : null; },
      get layerComps() { return []; },
      get colorSamplers() { return colorSamplers(doc); },
      get channels() { return []; },
      get guides() { return []; },
      get selection() {
        return summary({
          get bounds() { return doc.selection ? rect(doc.selection.left, doc.selection.top, doc.selection.right, doc.selection.bottom) : null; },
          selectAll: function () { return mutate('Selection.selectAll', [], 'set', function () { doc.selection = rect(0, 0, doc.width, doc.height); }); },
          deselect: function () { return mutate('Selection.deselect', [], 'set', function () { doc.selection = null; }); },
          selectRectangle: function (b) { return mutate('Selection.selectRectangle', [b], 'set', function () { doc.selection = rect(b.left, b.top, b.right, b.bottom); }); }
        }, function () { return { typename: 'Selection', bounds: doc.selection }; });
      },
      saveAs: { psd: saveStub('psd', doc), psb: saveStub('psb', doc), png: saveStub('png', doc), jpg: saveStub('jpg', doc), gif: saveStub('gif', doc), bmp: saveStub('bmp', doc) },
      save: function () { return mutate('Document.save', [], 'save', function () { doc.saved = true; return Promise.resolve(); }); },
      createLayer: function (opts) {
        opts = opts || {};
        return mutate('Document.createLayer', [opts], 'make', function () {
          var l = L(psState.nextId++, opts.name || ('Layer ' + (allLayers(doc).length)), opts.group ? 'group' : 'pixel', { opacity: opts.opacity != null ? opts.opacity : 100, blendMode: opts.blendMode || 'normal', bounds: rect(0, 0, 0, 0) });
          if (opts.group) l.children = [];
          var cur = findLayer(doc, null);
          var sib = cur ? siblingsOf(doc, cur) : doc.layers; sib.splice(cur ? sib.indexOf(cur) : 0, 0, l);
          doc.selected = [l.id];
          return Promise.resolve(wrapLayer(doc, l));
        });
      },
      createPixelLayer: function (opts) { return api.createLayer(opts); },
      createTextLayer: function (opts) {
        opts = opts || {};
        return mutate('Document.createTextLayer', [opts], 'make', function () {
          var l = L(psState.nextId++, opts.name || opts.contents || 'Text', 'text', { text: { contents: opts.contents || 'Lorem Ipsum', size: opts.fontSize || 24, font: opts.fontName || 'MyriadPro-Regular' }, bounds: rect(opts.position ? opts.position.x : 0, opts.position ? opts.position.y : 0, 200, 40) });
          doc.layers.unshift(l); doc.selected = [l.id];
          return Promise.resolve(wrapLayer(doc, l));
        });
      },
      createLayerGroup: function (opts) {
        opts = opts || {};
        return mutate('Document.createLayerGroup', [{ name: opts.name, fromLayers: (opts.fromLayers || []).length }], 'make', function () {
          var g = L(psState.nextId++, opts.name || 'Group ' + (allLayers(doc).filter(function (x) { return x.kind === 'group'; }).length + 1), 'group', { children: [] });
          var from = (opts.fromLayers ? [].concat(opts.fromLayers) : []).map(function (w) { return allLayers(doc).filter(function (x) { return x.id === w.id; })[0]; }).filter(Boolean);
          var anchor = from[0] || findLayer(doc, null);
          var sib = anchor ? siblingsOf(doc, anchor) : doc.layers; var at = anchor ? sib.indexOf(anchor) : 0;
          sib.splice(at < 0 ? 0 : at, 0, g);
          from.forEach(function (x) { removeLayer(doc, x); g.children.push(x); });
          doc.selected = [g.id];
          return Promise.resolve(wrapLayer(doc, g));
        });
      },
      groupLayers: function (layers) { return api.createLayerGroup({ fromLayers: layers }); },
      duplicateLayers: function (layers, targetDocument) {
        return mutate('Document.duplicateLayers', [(layers || []).length, targetDocument && targetDocument.title], 'duplicate', function () {
          var dest = targetDocument ? psState.docs.filter(function (d) { return d.id === targetDocument.id; })[0] || doc : doc;
          var out = (layers || []).map(function (w) { var src = allLayers(doc).filter(function (x) { return x.id === w.id; })[0]; if (!src) return null; var c = cloneLayer(src, dest === doc ? ' copy' : ''); dest.layers.unshift(c); return wrapLayer(dest, c); }).filter(Boolean);
          return Promise.resolve(out);
        });
      },
      resizeImage: function (w, h, res) {
        return mutate('Document.resizeImage', [w, h, res], 'imageSize', function () {
          var nw = Number(w) || doc.width, nh = Number(h) || Math.round(doc.height * nw / doc.width);
          var sx = nw / doc.width, sy = nh / doc.height;
          allLayers(doc).forEach(function (l) { var b = l.bounds; l.bounds = rect(Math.round(b.left * sx), Math.round(b.top * sy), Math.round(b.right * sx), Math.round(b.bottom * sy)); });
          doc.width = nw; doc.height = nh; if (res) doc.resolution = Number(res);
          return Promise.resolve();
        });
      },
      resizeCanvas: function (w, h) { return mutate('Document.resizeCanvas', [w, h], 'canvasSize', function () { doc.width = Number(w) || doc.width; doc.height = Number(h) || doc.height; return Promise.resolve(); }); },
      crop: function (b) { return mutate('Document.crop', [b], 'crop', function () { if (b) { doc.width = b.right - b.left; doc.height = b.bottom - b.top; } return Promise.resolve(); }); },
      trim: function () { return mutate('Document.trim', [], 'trim', function () { return Promise.resolve(); }); },
      rotate: function (a) { return mutate('Document.rotate', [a], 'rotateEventEnum', function () { if (Math.abs(Number(a)) % 180 === 90) { var t = doc.width; doc.width = doc.height; doc.height = t; } return Promise.resolve(); }); },
      flatten: function () { return mutate('Document.flatten', [], 'flattenImage', function () { doc.layers = [L(psState.nextId++, 'Background', 'pixel', { isBackgroundLayer: true, locked: true, bounds: rect(0, 0, doc.width, doc.height) })]; doc.selected = [doc.layers[0].id]; return Promise.resolve(); }); },
      mergeVisibleLayers: function () { return mutate('Document.mergeVisibleLayers', [], 'mergeVisible', function () { var vis = doc.layers.filter(function (l) { return l.visible; }); var keep = vis[vis.length - 1]; doc.layers = doc.layers.filter(function (l) { return !l.visible || l === keep; }); if (keep) { delete keep.children; keep.kind = 'pixel'; doc.selected = [keep.id]; } return Promise.resolve(); }); },
      duplicate: function (name) { return mutate('Document.duplicate', [name], 'duplicate', function () { var d = newDoc({ name: name || doc.title + ' copy', width: doc.width, height: doc.height, resolution: doc.resolution }); d.layers = doc.layers.map(function (l) { return cloneLayer(l); }); return Promise.resolve(wrapDoc(d)); }); },
      suspendHistory: function (fn, name) {
        return hostCall('photoshop', 'Document.suspendHistory', [name], function () {
          if (modal.depth === 0 && apiVersion >= 2) throw modalError('suspendHistory');
          return Promise.resolve().then(function () { return fn({ document: api }); });
        });
      },
      close: function (opt) { return mutate('Document.close', [opt], 'close', function () { closeDoc(doc); return Promise.resolve(); }); },
      closeWithoutSaving: function () { return mutate('Document.closeWithoutSaving', [], 'close', function () { closeDoc(doc); return Promise.resolve(); }); }
    };
    summary(api, function () { return { typename: 'Document', id: doc.id, title: doc.title, width: doc.width, height: doc.height }; });
    return guard(api, 'photoshop.Document', 'dom');
  }
  function closeDoc(doc) {
    psState.docs = psState.docs.filter(function (d) { return d !== doc; });
    if (psState.activeDocId === doc.id) psState.activeDocId = psState.docs[0] ? psState.docs[0].id : null;
  }
  function unitPx(v) { return { _unit: 'pixelsUnit', _value: v }; }
  function boundsDescriptor(b) { return { _obj: 'rectangle', top: unitPx(b.top), left: unitPx(b.left), bottom: unitPx(b.bottom), right: unitPx(b.right), width: unitPx(b.width), height: unitPx(b.height) }; }
  var KIND_CODE = { pixel: 1, adjustment: 2, text: 3, vector: 4, smartObject: 5, video: 6, group: 7, threeD: 8, gradientFill: 9, pattern: 10, solidColor: 11, background: 12 };
  function layerDescriptor(doc, l) {
    var b = boundsOf(l);
    var d = {
      _obj: 'layer', name: l.name, layerID: l.id, visible: l.visible, color: { _enum: 'color', _value: 'none' },
      opacity: l.opacity, fillOpacity: l.fillOpacity, mode: { _enum: 'blendMode', _value: l.blendMode },
      layerKind: l.isBackgroundLayer ? 12 : (KIND_CODE[l.kind] || 1), background: !!l.isBackgroundLayer,
      itemIndex: itemIndexOf(doc, l), count: allLayers(doc).length,
      layerSection: { _enum: 'layerSectionType', _value: l.kind === 'group' ? 'layerSectionStart' : 'layerSectionContent' },
      bounds: boundsDescriptor(b), boundsNoEffects: boundsDescriptor(b), boundsNoMask: boundsDescriptor(b),
      parentLayerID: l._parent ? l._parent.id : -1, group: false, targetChannels: [],
      layerLocking: { _obj: 'layerLocking', protectAll: !!l.locked }
    };
    if (l.text) d.textKey = { _obj: 'textLayer', textKey: l.text.contents, textStyleRange: [{ _obj: 'textStyleRange', from: 0, to: l.text.contents.length, textStyle: { _obj: 'textStyle', size: { _unit: 'pointsUnit', _value: l.text.size }, fontPostScriptName: l.text.font } }] };
    return d;
  }
  function docDescriptor(d) {
    return {
      _obj: 'document', title: d.title, documentID: d.id, itemIndex: psState.docs.indexOf(d) + 1, count: psState.docs.length,
      width: { _unit: 'distanceUnit', _value: d.width }, height: { _unit: 'distanceUnit', _value: d.height },
      resolution: { _unit: 'densityUnit', _value: d.resolution },
      mode: { _enum: 'colorSpace', _value: d.mode === 'RGBColorMode' ? 'RGBColor' : d.mode === 'CMYKColorMode' ? 'CMYKColorEnum' : 'grayscaleMode' },
      depth: d.bitsPerChannel, numberOfLayers: allLayers(d).length, hasBackgroundLayer: d.layers.some(function (l) { return l.isBackgroundLayer; }),
      targetLayers: d.selected.map(function (id) { var l = allLayers(d).filter(function (x) { return x.id === id; })[0]; return { _ref: 'layer', _index: l ? itemIndexOf(d, l) : 0 }; }),
      targetLayersIDs: d.selected.map(function (id) { return { _ref: 'layer', _id: id }; }),
      isDirty: !d.saved, fileReference: undefined, format: 'Photoshop', zoom: { _unit: 'percentUnit', _value: 100 },
      selection: d.selection ? boundsDescriptor(d.selection) : undefined
    };
  }
  function pick(desc, prop) {
    if (!prop) return desc;
    var o = { _obj: desc._obj }; o[prop] = desc[prop];
    if (desc[prop] === undefined) return { _obj: 'error', message: 'Property "' + prop + '" is not available (playground mock).' };
    return o;
  }
  function applicationDescriptor() {
    return {
      _obj: 'application', hostName: 'Adobe Photoshop (playground mock)', hostVersion: { _obj: 'version', versionMajor: Number(String(BOOT.target.hostVersion || '27.4.0').split('.')[0]), versionMinor: Number(String(BOOT.target.hostVersion || '27.4.0').split('.')[1] || 0), versionFix: 0 },
      numberOfDocuments: psState.docs.length, currentToolOptions: {}, tool: { _enum: 'tool', _value: 'moveTool' },
      foregroundColor: { _obj: 'RGBColor', red: psState.foreground.red, grain: psState.foreground.green, blue: psState.foreground.blue },
      backgroundColor: { _obj: 'RGBColor', red: psState.background.red, grain: psState.background.green, blue: psState.background.blue },
      panelList: [], interfacePrefs: { _obj: 'interfacePrefs', kuiBrightnessLevel: { _enum: 'uiBrightnessLevelEnumType', _value: 'kPanelBrightnessDarkGray' } }
    };
  }
  var NOT_SIMULATED_NOTED = {};
  function runDescriptor(d) {
    var evt = d && d._obj;
    var t = d && (d._target || d['null']);
    var refs = Array.isArray(t) ? t : (t ? [t] : []);
    var prop = (refs.filter(function (r) { return r._property; })[0] || {})._property;
    var docRef = refs.filter(function (r) { return r._ref === 'document'; })[0];
    var doc = docRef && docRef._id != null ? psState.docs.filter(function (x) { return x.id === docRef._id; })[0] : docRef && docRef._name != null ? psState.docs.filter(function (x) { return x.title === docRef._name; })[0] : activeDoc();
    var layerRef = refs.filter(function (r) { return r._ref === 'layer'; })[0];
    var channelRef = refs.filter(function (r) { return r._ref === 'channel'; })[0];
    if (!evt) return { _obj: 'error', message: 'Descriptor has no _obj (event name).', result: -1 };
    if (evt === 'get') {
      if (refs.some(function (r) { return r._ref === 'application'; })) return pick(applicationDescriptor(), prop);
      if (layerRef) { var gl = findLayer(doc, layerRef); return gl ? pick(layerDescriptor(doc, gl), prop) : { _obj: 'error', message: 'The object "layer" is not currently available.', result: -1 }; }
      if (channelRef) return { _obj: 'channel', channelName: 'RGB', visible: true };
      if (docRef || !refs.length || refs.every(function (r) { return r._property; })) return doc ? pick(docDescriptor(doc), prop) : { _obj: 'error', message: 'The object "current document" is not currently available.', result: -1 };
      return { _obj: 'error', message: 'get target not simulated by the playground' };
    }
    assertModal(evt);
    if (!doc && ['set', 'make', 'select', 'delete', 'show', 'hide', 'duplicate', 'move'].indexOf(evt) >= 0 && (layerRef || channelRef)) return { _obj: 'error', message: 'The command "' + evt + '" is not currently available.', result: -1 };
    if (evt === 'set' && channelRef && channelRef._property === 'selection') {
      var to = d.to || {};
      if (to._enum === 'ordinal' || to._value === 'allEnum') doc.selection = rect(0, 0, doc.width, doc.height);
      else if (to._value === 'none') doc.selection = null;
      else if (to._obj === 'rectangle') { var v = function (x) { return x && x._value != null ? x._value : Number(x) || 0; }; doc.selection = rect(v(to.left), v(to.top), v(to.right), v(to.bottom)); }
      fire('set', d); return {};
    }
    if (evt === 'set' && layerRef && d.to) {
      var sl = findLayer(doc, layerRef); if (!sl) return { _obj: 'error', message: 'The object "layer" is not currently available.', result: -1 };
      if (d.to.name != null) sl.name = String(d.to.name);
      if (d.to.opacity != null) sl.opacity = d.to.opacity._value != null ? d.to.opacity._value : Number(d.to.opacity);
      if (d.to.fillOpacity != null) sl.fillOpacity = d.to.fillOpacity._value != null ? d.to.fillOpacity._value : Number(d.to.fillOpacity);
      if (d.to.mode && d.to.mode._value) sl.blendMode = d.to.mode._value;
      fire('set', d); return {};
    }
    if (evt === 'set' && docRef && d.to) { fire('set', d); return {}; }
    if (evt === 'make' && d['new'] && d['new']._obj === 'document') { var nd = newDoc({ name: d['new'].name, width: d['new'].width && d['new'].width._value, height: d['new'].height && d['new'].height._value }); fire('make', d); return { documentID: nd.id }; }
    if (evt === 'make' && refs.some(function (r) { return r._ref === 'textLayer'; }) && doc) {
      var u = d.using || {};
      var shape = Array.isArray(u.textShape) && u.textShape[0] && u.textShape[0].bounds;
      var num = function (x) { return x && x._value != null ? x._value : Number(x) || 0; };
      var b = shape ? rect(num(shape.left), num(shape.top), num(shape.right), num(shape.bottom)) : rect(0, 0, 200, 40);
      var text = String(u.textKey != null ? u.textKey : 'Text');
      var tl = L(psState.nextId++, text.slice(0, 40) || 'Text', 'text', { text: { contents: text, size: 24, font: 'MyriadPro-Regular' }, bounds: b });
      var cur0 = findLayer(doc, null); var sib0 = cur0 ? siblingsOf(doc, cur0) : doc.layers; sib0.splice(cur0 ? sib0.indexOf(cur0) : 0, 0, tl);
      doc.selected = [tl.id]; fire('make', d); return { layerID: tl.id, name: tl.name };
    }
    if (evt === 'make' && (layerRef || refs.some(function (r) { return r._ref === 'layerSection'; }))) {
      var isGroup = refs.some(function (r) { return r._ref === 'layerSection'; });
      var nl = L(psState.nextId++, (d.using && d.using.name) || (isGroup ? 'Group ' : 'Layer ') + psState.nextId, isGroup ? 'group' : 'pixel', { bounds: rect(0, 0, 0, 0) });
      if (isGroup) nl.children = [];
      if (d.using && d.using.opacity != null) nl.opacity = d.using.opacity._value != null ? d.using.opacity._value : d.using.opacity;
      var cur = findLayer(doc, null); var sib = cur ? siblingsOf(doc, cur) : doc.layers; sib.splice(cur ? sib.indexOf(cur) : 0, 0, nl);
      if (isGroup && d.from) { var moving = doc.selected.map(function (id) { return allLayers(doc).filter(function (x) { return x.id === id; })[0]; }).filter(function (x) { return x && x !== nl; }); moving.forEach(function (x) { removeLayer(doc, x); nl.children.push(x); }); }
      doc.selected = [nl.id]; fire('make', d); return { layerID: nl.id, layerSectionStart: isGroup ? nl.id : undefined, name: nl.name };
    }
    if (evt === 'select' && layerRef) {
      var sel = findLayer(doc, layerRef); if (!sel) return { _obj: 'error', message: 'The object "layer" is not currently available.', result: -1 };
      var mod = d.selectionModifier && d.selectionModifier._value;
      if (mod === 'addToSelection' || mod === 'addToSelectionContinuous') { if (doc.selected.indexOf(sel.id) < 0) doc.selected.push(sel.id); }
      else if (mod === 'removeFromSelection') doc.selected = doc.selected.filter(function (id) { return id !== sel.id; });
      else doc.selected = [sel.id];
      if (d.makeVisible) sel.visible = true;
      fire('select', d); return {};
    }
    if (evt === 'select' && docRef) { if (doc) psState.activeDocId = doc.id; fire('select', d); return {}; }
    if (evt === 'selectAllLayers') { doc.selected = allLayers(doc).filter(function (l) { return !l.isBackgroundLayer; }).map(function (l) { return l.id; }); fire(evt, d); return {}; }
    if (evt === 'selectNoLayers') { doc.selected = []; fire(evt, d); return {}; }
    if (evt === 'delete' && layerRef) {
      var targets = layerRef._enum === 'ordinal' ? doc.selected.map(function (id) { return allLayers(doc).filter(function (x) { return x.id === id; })[0]; }).filter(Boolean) : [findLayer(doc, layerRef)].filter(Boolean);
      if (!targets.length) return { _obj: 'error', message: 'The object "layer" is not currently available.', result: -1 };
      targets.forEach(function (x) { removeLayer(doc, x); }); fire('delete', d); return {};
    }
    if (evt === 'duplicate' && layerRef) {
      var src = findLayer(doc, layerRef); if (!src) return { _obj: 'error', message: 'The object "layer" is not currently available.', result: -1 };
      var c = cloneLayer(src, ' copy'); if (d.name) c.name = String(d.name);
      var s2 = siblingsOf(doc, src); s2.splice(s2.indexOf(src), 0, c); doc.selected = [c.id]; fire('duplicate', d); return { ID: [c.id] };
    }
    if ((evt === 'show' || evt === 'hide') && (layerRef || refs.length)) {
      var vl = findLayer(doc, layerRef); if (vl) vl.visible = evt === 'show'; fire(evt, d); return {};
    }
    if (evt === 'move' && layerRef && d.to) {
      var ml = findLayer(doc, layerRef);
      if (ml && d.to._obj === 'offset') { shift(ml, (d.to.horizontal && d.to.horizontal._value) || 0, (d.to.vertical && d.to.vertical._value) || 0); }
      else if (ml && d.to._ref === 'layer' && d.to._index != null) { note('photoshop', 'move to index: stacking order is approximated'); }
      fire('move', d); return {};
    }
    if (evt === 'transform' && layerRef) {
      var tl = findLayer(doc, layerRef);
      if (tl && d.width) scaleLayer(tl, (d.width._value || 100) / 100, ((d.height || d.width)._value || 100) / 100);
      if (tl && d.offset) shift(tl, (d.offset.horizontal && d.offset.horizontal._value) || 0, (d.offset.vertical && d.offset.vertical._value) || 0);
      fire('transform', d); return {};
    }
    if (evt === 'flattenImage') { wrapDoc(doc); doc.layers = [L(psState.nextId++, 'Background', 'pixel', { isBackgroundLayer: true, locked: true, bounds: rect(0, 0, doc.width, doc.height) })]; doc.selected = [doc.layers[0].id]; fire(evt, d); return {}; }
    if (evt === 'mergeVisible') { var mv = L(psState.nextId++, 'Merged', 'pixel', { bounds: rect(0, 0, doc.width, doc.height) }); doc.layers.unshift(mv); doc.selected = [mv.id]; fire(evt, d); return {}; }
    if (evt === 'imageSize' && d.width) { doc.width = d.width._value || doc.width; doc.height = d.height ? d.height._value : doc.height; fire(evt, d); return {}; }
    if (evt === 'canvasSize' && d.width) { doc.width = d.width._value || doc.width; doc.height = d.height ? d.height._value : doc.height; fire(evt, d); return {}; }
    if (evt === 'close') { if (doc) closeDoc(doc); fire(evt, d); return {}; }
    if (!NOT_SIMULATED_NOTED[evt]) { NOT_SIMULATED_NOTED[evt] = true; }
    note('photoshop', 'batchPlay event "' + evt + '" is not simulated; the document state is unchanged and an empty descriptor was returned. Photoshop would run it.');
    fire(evt, d);
    return {};
  }
  // ---- imaging: synthetic pixels so real getPixels/putPixels code paths run end to end.
  function synthPixels(doc, layer, w, h, comps) {
    var data = new Uint8Array(w * h * comps);
    var seed = layer ? layer.id * 37 : 11;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var i = (y * w + x) * comps;
      data[i] = (x * 255 / Math.max(1, w - 1) + seed) & 255;
      data[i + 1] = (y * 255 / Math.max(1, h - 1)) & 255;
      data[i + 2] = (seed * 3 + 128) & 255;
      if (comps === 4) data[i + 3] = 255;
    }
    return data;
  }
  var liveImageData = 0;
  function imageData(w, h, comps, data, colorSpace) {
    liveImageData++;
    var disposed = false;
    return summary({
      width: w, height: h, components: comps, componentSize: 8, colorSpace: colorSpace || 'RGB', hasAlpha: comps === 4 || comps === 2, pixelFormat: comps === 4 ? 'RGBA' : comps === 3 ? 'RGB' : comps === 1 ? 'Grayscale' : 'GrayscaleAlpha', isChunky: true, colorProfile: 'sRGB IEC61966-2.1',
      getData: function (o) {
        if (disposed) return Promise.reject(new Error('PhotoshopImageData was disposed'));
        if (o && o.chunky === false) { var planar = new Uint8Array(data.length); var n = w * h; for (var p = 0; p < n; p++) for (var c = 0; c < comps; c++) planar[c * n + p] = data[p * comps + c]; return Promise.resolve(planar); }
        return Promise.resolve(data);
      },
      dispose: function () { if (!disposed) { disposed = true; liveImageData--; } },
      _data: data
    }, function () { return { typename: 'PhotoshopImageData', width: w, height: h, components: comps }; });
  }
  var imaging = {
    getPixels: function (o) {
      o = o || {};
      return hostCall('photoshop', 'imaging.getPixels', [{ documentID: o.documentID, layerID: o.layerID, sourceBounds: o.sourceBounds, targetSize: o.targetSize }], function () {
        if (modal.depth === 0) throw new Error('imaging.getPixels must be called inside executeAsModal (Photoshop imaging API).');
        var doc = o.documentID != null ? psState.docs.filter(function (d) { return d.id === o.documentID; })[0] : activeDoc();
        if (!doc) throw new Error('No document');
        var layer = o.layerID != null ? allLayers(doc).filter(function (l) { return l.id === o.layerID; })[0] : null;
        if (o.layerID != null && !layer) throw new Error('Layer ' + o.layerID + ' not found');
        var sb = o.sourceBounds || (layer ? boundsOf(layer) : rect(0, 0, doc.width, doc.height));
        var sw = Math.max(1, (sb.right != null ? sb.right - sb.left : sb.width) || doc.width), sh = Math.max(1, (sb.bottom != null ? sb.bottom - sb.top : sb.height) || doc.height);
        var w = sw, h = sh;
        if (o.targetSize) { var tw = o.targetSize.width, th = o.targetSize.height; var k = Math.min(tw ? tw / w : Infinity, th ? th / h : Infinity, 1); w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k)); }
        var comps = o.componentSize === 16 ? 4 : (layer && !layer.isBackgroundLayer ? 4 : 3);
        if (o.colorSpace === 'Grayscale') comps = 1;
        if (w * h > 16e6) throw new Error('Playground limit: getPixels area over 16 megapixels; pass targetSize.');
        note('photoshop', 'imaging.getPixels returns synthetic gradient pixels (' + w + '×' + h + '×' + comps + '); real Photoshop returns the document pixels.');
        return Promise.resolve({ imageData: imageData(w, h, comps, synthPixels(doc, layer, w, h, comps), o.colorSpace), sourceBounds: { left: sb.left || 0, top: sb.top || 0, right: (sb.left || 0) + sw, bottom: (sb.top || 0) + sh }, level: 0 });
      });
    },
    putPixels: function (o) {
      o = o || {};
      return hostCall('photoshop', 'imaging.putPixels', [{ documentID: o.documentID, layerID: o.layerID, width: o.imageData && o.imageData.width, height: o.imageData && o.imageData.height }], function () {
        if (modal.depth === 0) throw modalError('putPixels');
        if (!o.imageData || !o.imageData.getData) throw new Error('putPixels needs { imageData } created by imaging.createImageDataFromBuffer or getPixels');
        note('photoshop', 'imaging.putPixels: pixels accepted; the playground does not render document pixels.');
        return Promise.resolve();
      });
    },
    getLayerMask: function (o) { return imaging.getPixels(Object.assign({}, o || {}, { colorSpace: 'Grayscale' })); },
    putLayerMask: function (o) { return imaging.putPixels(o); },
    getSelection: function (o) { return imaging.getPixels(Object.assign({}, o || {}, { colorSpace: 'Grayscale' })); },
    putSelection: function (o) { return imaging.putPixels(o); },
    createImageDataFromBuffer: function (buf, o) {
      return hostCall('photoshop', 'imaging.createImageDataFromBuffer', [{ length: buf && buf.length, width: o && o.width, height: o && o.height, components: o && o.components }], function () {
        o = o || {};
        if (!buf || buf.length !== o.width * o.height * o.components) throw new Error('createImageDataFromBuffer: buffer length must equal width * height * components');
        return Promise.resolve(imageData(o.width, o.height, o.components, new Uint8Array(buf.buffer || buf), o.colorSpace));
      });
    },
    encodeImageData: function (o) {
      return hostCall('photoshop', 'imaging.encodeImageData', [{ base64: !!(o && o.base64) }], function () {
        var id = o && o.imageData; if (!id) throw new Error('encodeImageData needs { imageData }');
        var cv = document.createElement('canvas'); cv.width = id.width; cv.height = id.height;
        var ctx2 = cv.getContext('2d'); var img = ctx2.createImageData(id.width, id.height); var src = id._data || new Uint8Array(0);
        for (var p = 0, n = id.width * id.height; p < n; p++) { var c = id.components; img.data[p * 4] = src[p * c]; img.data[p * 4 + 1] = src[p * c + (c > 2 ? 1 : 0)]; img.data[p * 4 + 2] = src[p * c + (c > 2 ? 2 : 0)]; img.data[p * 4 + 3] = c === 4 ? src[p * 4 + 3] : 255; }
        ctx2.putImageData(img, 0, 0);
        var b64 = cv.toDataURL('image/jpeg', 0.9).split(',')[1];
        if (o.base64) return Promise.resolve(b64);
        var bin = atob(b64); var arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return Promise.resolve(arr);
      });
    }
  };
  var menuCommands = { 1030: 'Cut', 1040: 'Copy', 1050: 'Paste', 1210: 'Merge Visible', 2982: 'Copy Merged', 3000: 'Free Transform', 1017: 'Select All', 1018: 'Deselect', 1300: 'Flatten Image', 101: 'Undo', 2600: 'New Layer' };
  var photoshop = {
    app: {
      get activeDocument() { return wrapDoc(activeDoc()); },
      set activeDocument(d) { hostCall('photoshop', 'app.activeDocument =', [d && d.title], function () { if (d && d.id != null) psState.activeDocId = d.id; }); },
      get documents() {
        var a = psState.docs.map(wrapDoc);
        Object.defineProperty(a, 'getByName', { value: function (n) { return a.filter(function (x) { return x.title === n; })[0] || null; }, enumerable: false });
        Object.defineProperty(a, 'add', { value: function (o) { return photoshop.app.createDocument(o); }, enumerable: false });
        return a;
      },
      get version() { return BOOT.target.hostVersion || '27.4.0'; },
      get typename() { return 'Photoshop'; },
      get foregroundColor() { return solidColor(psState.foreground); },
      set foregroundColor(c) { hostCall('photoshop', 'app.foregroundColor =', [c && c.rgb && c.rgb.hexValue], function () { assertModal('set'); if (c && c.rgb) psState.foreground = { red: c.rgb.red, green: c.rgb.green, blue: c.rgb.blue }; }); },
      get backgroundColor() { return solidColor(psState.background); },
      set backgroundColor(c) { hostCall('photoshop', 'app.backgroundColor =', [c && c.rgb && c.rgb.hexValue], function () { assertModal('set'); if (c && c.rgb) psState.background = { red: c.rgb.red, green: c.rgb.green, blue: c.rgb.blue }; }); },
      get currentTool() { return { id: 'moveTool', title: 'Move Tool' }; },
      get fonts() { return [{ name: 'Myriad Pro', postScriptName: 'MyriadPro-Regular', family: 'Myriad Pro', style: 'Regular' }, { name: 'Minion Pro', postScriptName: 'MinionPro-Regular', family: 'Minion Pro', style: 'Regular' }]; },
      get displayDialogs() { return 'dontDisplay'; },
      SolidColor: SolidColor,
      showAlert: function (msg) { var p; hostCall('photoshop', 'app.showAlert', [msg], function () { p = hostAlert(msg); }); return p; },
      createDocument: function (opts) { return mutate('app.createDocument', [opts], 'make', function () { return Promise.resolve(wrapDoc(newDoc(opts))); }); },
      open: function (entry) { return mutate('app.open', [entry && entry.name], 'open', function () { return Promise.resolve(wrapDoc(newDoc({ name: entry && entry.name ? entry.name : 'Opened' }))); }); },
      batchPlay: function (d, o) { return photoshop.action.batchPlay(d, o); }
    },
    action: {
      batchPlay: function (descriptors, options) {
        options = options || {};
        var list = Array.isArray(descriptors) ? descriptors : [descriptors];
        var exec = function () { return list.map(function (d) { var r = runDescriptor(d); if (d && d._options && d._options.dialogOptions === 'display') note('photoshop', 'dialogOptions "display" would show the "' + d._obj + '" dialog in Photoshop.'); return r; }); };
        if (options.synchronousExecution) return hostCall('photoshop', 'action.batchPlay', [descriptors, options], exec);
        return hostCall('photoshop', 'action.batchPlay', [descriptors, options], function () {
          return new Promise(function (resolve, reject) { try { resolve(exec()); } catch (e) { reject(e); } });
        });
      },
      addNotificationListener: function (events, cb) {
        return hostCall('photoshop', 'action.addNotificationListener', [events], function () {
          if (typeof cb !== 'function') throw new Error('addNotificationListener needs a callback function');
          notifyListeners.push({ events: (events || []).map(function (e) { return typeof e === 'string' ? e : e.event; }), cb: cb });
          return Promise.resolve();
        });
      },
      removeNotificationListener: function (events, cb) {
        return hostCall('photoshop', 'action.removeNotificationListener', [events], function () {
          notifyListeners = notifyListeners.filter(function (l) { return l.cb !== cb; }); return Promise.resolve();
        });
      },
      recordAction: function (opts, fn) { return hostCall('photoshop', 'action.recordAction', [opts], function () { note('photoshop', 'recordAction: action recording is not simulated; running the callback.'); return Promise.resolve().then(function () { return fn({ recordAction: function () {} }, {}); }); }); },
      validateReference: function (ref) { return hostCall('photoshop', 'action.validateReference', [ref], function () { return Promise.resolve(true); }); }
    },
    core: {
      executeAsModal: function (fn, opts) {
        opts = opts || {};
        var name = opts.commandName || '(no commandName)';
        return hostCall('photoshop', 'core.executeAsModal', [{ commandName: name, interactive: !!opts.interactive, timeOut: opts.timeOut }], function () {
          if (typeof fn !== 'function') throw new Error('executeAsModal: the first argument must be a function');
          if (!opts.commandName) note('photoshop', 'executeAsModal without options.commandName: Photoshop shows the command name in its progress bar.');
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
          return Promise.resolve().then(function () { return fn(ctx, opts.descriptor); })
            .then(function (v) { modal.depth--; if (!modal.depth) modal.name = null; return v; },
              function (e) { modal.depth--; if (!modal.depth) modal.name = null; throw e; });
        });
      },
      showAlert: function (o) { var m = o && o.message != null ? o.message : o; var p; hostCall('photoshop', 'core.showAlert', [m], function () { p = hostAlert(m); }); return p; },
      getActiveTool: function () { return hostCall('photoshop', 'core.getActiveTool', [], function () { return Promise.resolve({ id: 'moveTool', title: 'Move Tool (mock)' }); }); },
      performMenuCommand: function (o) {
        return hostCall('photoshop', 'core.performMenuCommand', [o], function () {
          assertModal('performMenuCommand');
          var id = o && o.commandID;
          note('photoshop', 'performMenuCommand ' + id + (menuCommands[id] ? ' (' + menuCommands[id] + ')' : '') + ': menu commands are not simulated; returned true.');
          return Promise.resolve(true);
        });
      },
      getMenuCommandState: function (o) { return hostCall('photoshop', 'core.getMenuCommandState', [o], function () { return Promise.resolve([true]); }); },
      getMenuCommandTitle: function (o) { return hostCall('photoshop', 'core.getMenuCommandTitle', [o], function () { return Promise.resolve(menuCommands[o && o.commandID] || 'Menu command ' + (o && o.commandID)); }); },
      isModal: function () { return modal.depth > 0; },
      redrawDocument: function () { return hostCall('photoshop', 'core.redrawDocument', [], function () { return Promise.resolve(); }); },
      suppressResizeGripper: function (o) { return hostCall('photoshop', 'core.suppressResizeGripper', [o], function () { return Promise.resolve(); }); },
      translateUIString: function (s) { return String(s).replace(/^\$\$\$\/[^=]*=/, ''); },
      convertColor: function (c) { return c; },
      getCPUInfo: function () { return { vendor: 'playground', brandString: 'Playground CPU', features: [] }; },
      getGPUInfo: function () { return { gpuInfoList: [], clgpuInfoList: [] }; },
      addNotificationListener: function (group, events, cb) { return hostCall('photoshop', 'core.addNotificationListener', [group, events], function () { coreListeners.push({ group: group, events: events, cb: cb }); note('photoshop', 'core notifications (' + group + ') are registered but never fired by the playground.'); return Promise.resolve(); }); },
      removeNotificationListener: function (group, events, cb) { return hostCall('photoshop', 'core.removeNotificationListener', [group, events], function () { coreListeners = coreListeners.filter(function (l) { return l.cb !== cb; }); return Promise.resolve(); }); }
    },
    constants: new Proxy({}, {
      get: function (_t, group) {
        if (typeof group !== 'string' || PASS_THROUGH[group]) return undefined;
        var table = PS_API.constants[group];
        if (!table && PS_API.source) note('photoshop', 'constants.' + group + ' is not in ' + PS_API.source + '.');
        return new Proxy({}, { get: function (_g, key) {
          if (typeof key !== 'string' || PASS_THROUGH[key]) return undefined;
          if (table && Object.prototype.hasOwnProperty.call(table, key)) return table[key];
          if (table) note('photoshop', 'constants.' + group + '.' + key + ' is not in ' + PS_API.source + ' (returned undefined).');
          return table ? undefined : key.toLowerCase();
        } });
      }
    }),
    imaging: imaging
  };
  photoshop.app = guard(photoshop.app, 'photoshop.app', 'module');
  photoshop.action = guard(photoshop.action, 'photoshop.action', 'module');
  photoshop.core = guard(photoshop.core, 'photoshop.core', 'module');
  photoshop.imaging = guard(photoshop.imaging, 'photoshop.imaging', 'module');
  var photoshopModule = guard(photoshop, 'photoshop', 'module');

  // ---------------------------------------------------------------- uxp mock: in-memory file system
  // Paths: /plugin (read-only project files), /plugin-data, /plugin-temp, /picked..., /saved, /url
  var mem = {}; // path -> { type: 'file'|'folder', data: string|ArrayBuffer, native?: File }
  function b64ToBuf(b64) { var bin = atob(b64); var a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; }
  function mkdirp(p) { var parts = p.split('/').filter(Boolean); var cur = ''; parts.forEach(function (x) { cur += '/' + x; if (!mem[cur]) mem[cur] = { type: 'folder' }; }); }
  function memWrite(p, data, native) { mkdirp(p.split('/').slice(0, -1).join('/')); mem[p] = { type: 'file', data: data, native: native }; }
  ['/plugin', '/plugin-data', '/plugin-temp'].forEach(mkdirp);
  Object.keys(BOOT.sources || {}).forEach(function (rel) {
    var v = BOOT.sources[rel];
    var m = /^data:[^,]*;base64,/.exec(v);
    memWrite('/plugin/' + rel, m ? b64ToBuf(v.slice(m[0].length)) : v);
  });
  function urlToPath(u) {
    var s = String(u);
    var m = /^(plugin|plugin-data|plugin-temp):\/*(.*)$/.exec(s);
    if (m) return '/' + m[1] + (m[2] ? '/' + m[2] : '');
    if (/^file:/.test(s)) return '/file' + s.replace(/^file:\/*/, '/');
    return s.charAt(0) === '/' ? s : '/' + s;
  }
  function pathToUrl(p) {
    var m = /^\/(plugin|plugin-data|plugin-temp)(\/.*)?$/.exec(p);
    return m ? m[1] + ':' + (m[2] || '/') : 'file://' + p;
  }
  function isReadOnly(p) { return p === '/plugin' || p.indexOf('/plugin/') === 0; }
  function children(p) {
    var out = [];
    Object.keys(mem).forEach(function (k) { if (k.indexOf(p + '/') === 0 && k.slice(p.length + 1).indexOf('/') < 0) out.push(k); });
    return out.sort();
  }
  function entryFor(p) { var e = mem[p]; if (!e) return null; return e.type === 'folder' ? makeFolder(p) : makeFile(p); }
  function fsErr(msg) { var e = new Error(msg); return e; }
  function bytesOf(data) {
    if (data == null) return 0;
    if (typeof data === 'string') return data.length;
    return data.byteLength != null ? data.byteLength : String(data).length;
  }
  var tokenSeq = 0;
  var tokens = {};
  function entryBase(p, isFolder) {
    var name = p.split('/').pop();
    return {
      name: name, nativePath: p, url: pathToUrl(p), isFile: !isFolder, isFolder: !!isFolder, isEntry: true,
      provider: { isFileSystemProvider: true },
      toString: function () { return pathToUrl(p); },
      getMetadata: function () {
        return hostCall('uxp', 'Entry.getMetadata', [name], function () {
          var e = mem[p]; if (!e) return Promise.reject(fsErr('Entry does not exist: ' + p));
          return Promise.resolve({ name: name, size: e.native ? e.native.size : bytesOf(e.data), dateCreated: new Date(0), dateModified: new Date(), isFile: e.type === 'file', isFolder: e.type === 'folder' });
        });
      },
      delete: function () {
        return hostCall('uxp', 'Entry.delete', [name], function () {
          if (isReadOnly(p)) return Promise.reject(fsErr('The plugin folder is read-only.'));
          Object.keys(mem).forEach(function (k) { if (k === p || k.indexOf(p + '/') === 0) delete mem[k]; });
          return Promise.resolve();
        });
      },
      copyTo: function (folder, o) {
        return hostCall('uxp', 'Entry.copyTo', [name, folder && folder.nativePath], function () {
          var dest = folder.nativePath + '/' + ((o && o.newName) || name);
          if (mem[dest] && !(o && o.overwrite)) return Promise.reject(fsErr('Destination exists: ' + dest + ' (pass { overwrite: true })'));
          var e = mem[p]; memWrite(dest, e.data, e.native); return Promise.resolve(entryFor(dest));
        });
      },
      moveTo: function (folder, o) {
        return hostCall('uxp', 'Entry.moveTo', [name, folder && folder.nativePath], function () {
          if (isReadOnly(p)) return Promise.reject(fsErr('The plugin folder is read-only.'));
          var dest = folder.nativePath + '/' + ((o && o.newName) || name);
          var e = mem[p]; delete mem[p]; memWrite(dest, e.data, e.native); return Promise.resolve();
        });
      }
    };
  }
  function makeFile(p) {
    var f = entryBase(p, false);
    f.mode = isReadOnly(p) ? 'readOnly' : 'readWrite';
    f.read = function (o) {
      var binary = o && o.format === storage.formats.binary;
      return hostCall('uxp', 'File.read', [{ file: f.name, format: binary ? 'binary' : 'utf8' }], function () {
        var e = mem[p]; if (!e) return Promise.reject(fsErr('File does not exist: ' + p));
        if (e.native) return binary ? e.native.arrayBuffer() : e.native.text();
        if (binary) return Promise.resolve(typeof e.data === 'string' ? new TextEncoder().encode(e.data).buffer : e.data);
        return Promise.resolve(typeof e.data === 'string' ? e.data : new TextDecoder().decode(new Uint8Array(e.data)));
      });
    };
    f.write = function (data, o) {
      return hostCall('uxp', 'File.write', [{ file: f.name, bytes: bytesOf(data), append: !!(o && o.append), format: o && o.format }], function () {
        if (isReadOnly(p)) return Promise.reject(fsErr('Cannot write ' + f.name + ': the plugin folder is read-only. Use getDataFolder() or a picked file.'));
        var prev = mem[p] && mem[p].data;
        var next = data && data.byteLength != null && typeof data !== 'string' ? (data.buffer && data.byteLength !== undefined && !(data instanceof ArrayBuffer) ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data) : String(data);
        if (o && o.append && typeof prev === 'string' && typeof next === 'string') next = prev + next;
        memWrite(p, next);
        post('file-written', { path: p, url: pathToUrl(p), name: f.name, size: bytesOf(next), content: typeof next === 'string' ? next.slice(0, 20000) : '[binary ' + bytesOf(next) + ' bytes]' });
        return Promise.resolve(bytesOf(next));
      });
    };
    return f;
  }
  function makeFolder(p) {
    var d = entryBase(p, true);
    d.getEntries = function () {
      return hostCall('uxp', 'Folder.getEntries', [p], function () { return Promise.resolve(children(p).map(entryFor)); });
    };
    d.getEntry = function (rel) {
      return hostCall('uxp', 'Folder.getEntry', [rel], function () {
        var t = p + '/' + String(rel).replace(/^\/+/, '');
        if (!mem[t]) return Promise.reject(fsErr('Could not find an entry of name ' + rel + ' in ' + p + ' (playground file system)'));
        return Promise.resolve(entryFor(t));
      });
    };
    d.createFile = function (n, o) {
      return hostCall('uxp', 'Folder.createFile', [n, o], function () {
        var t = p + '/' + n;
        if (isReadOnly(t)) return Promise.reject(fsErr('The plugin folder is read-only.'));
        if (mem[t] && !(o && o.overwrite)) return Promise.reject(fsErr('File already exists: ' + n + ' (pass { overwrite: true })'));
        if (!mem[t]) memWrite(t, '');
        return Promise.resolve(makeFile(t));
      });
    };
    d.createFolder = function (n) {
      return hostCall('uxp', 'Folder.createFolder', [n], function () {
        var t = p + '/' + n;
        if (isReadOnly(t)) return Promise.reject(fsErr('The plugin folder is read-only.'));
        if (mem[t]) return Promise.reject(fsErr('Folder already exists: ' + n));
        mkdirp(t); return Promise.resolve(makeFolder(t));
      });
    };
    d.createEntry = function (n, o) { return o && o.type === storage.types.folder ? d.createFolder(n) : d.createFile(n, o); };
    d.renameEntry = function (entry, newName, o) {
      return hostCall('uxp', 'Folder.renameEntry', [entry && entry.name, newName], function () {
        var from = entry.nativePath, to = p + '/' + newName;
        if (mem[to] && !(o && o.overwrite)) return Promise.reject(fsErr('Entry exists: ' + newName));
        Object.keys(mem).forEach(function (k) { if (k === from || k.indexOf(from + '/') === 0) { mem[to + k.slice(from.length)] = mem[k]; delete mem[k]; } });
        return Promise.resolve();
      });
    };
    return guard(d, 'uxp.Folder', 'dom');
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
  var pickSeq = 0;
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
            var dir = '/picked-' + (++pickSeq);
            var entries = files.map(function (f) { memWrite(dir + '/' + f.name, null, f); return makeFile(dir + '/' + f.name); });
            if (opts && opts.allowMultiple) return entries;
            return entries[0] || null;
          });
        });
      },
      getFileForSaving: function (suggested, opts) {
        return hostCall('uxp', 'localFileSystem.getFileForSaving', [suggested, opts], function () {
          requireFsPermission('picker');
          var p = '/saved/' + (suggested || 'untitled.txt');
          if (!mem[p]) memWrite(p, '');
          note('uxp', 'getFileForSaving: Photoshop would show a save dialog; the playground picked ' + p + '. Written content appears in the Console.');
          return Promise.resolve(makeFile(p));
        });
      },
      getFolder: function (opts) {
        return hostCall('uxp', 'localFileSystem.getFolder', [opts], function () {
          requireFsPermission('picker');
          var p = '/picked-folder';
          if (!mem[p]) { mkdirp(p); memWrite(p + '/sample.txt', 'Sample file in the playground\'s picked folder.\n'); memWrite(p + '/image.png', new ArrayBuffer(8)); }
          note('uxp', 'getFolder: a folder picker would open; the playground returns an in-memory folder with two sample files.');
          return Promise.resolve(makeFolder(p));
        });
      },
      getPluginFolder: function () { return hostCall('uxp', 'localFileSystem.getPluginFolder', [], function () { return Promise.resolve(makeFolder('/plugin')); }); },
      getDataFolder: function () { return hostCall('uxp', 'localFileSystem.getDataFolder', [], function () { return Promise.resolve(makeFolder('/plugin-data')); }); },
      getTemporaryFolder: function () { return hostCall('uxp', 'localFileSystem.getTemporaryFolder', [], function () { return Promise.resolve(makeFolder('/plugin-temp')); }); },
      getEntryWithUrl: function (url) {
        return hostCall('uxp', 'localFileSystem.getEntryWithUrl', [url], function () {
          var u = String(url);
          if (!/^plugin(-data|-temp)?:/.test(u)) requireFsPermission('full');
          var p = urlToPath(u);
          if (!mem[p]) return Promise.reject(fsErr('Entry not found: ' + u + ' (playground file system)'));
          return Promise.resolve(entryFor(p));
        });
      },
      createEntryWithUrl: function (url, o) {
        return hostCall('uxp', 'localFileSystem.createEntryWithUrl', [url, o], function () {
          var u = String(url);
          if (!/^plugin(-data|-temp)?:/.test(u)) requireFsPermission('full');
          var p = urlToPath(u);
          if (isReadOnly(p)) return Promise.reject(fsErr('The plugin folder is read-only.'));
          if (o && o.type === 'folder') mkdirp(p); else if (!mem[p] || (o && o.overwrite)) memWrite(p, '');
          return Promise.resolve(entryFor(p));
        });
      },
      getNativePath: function (entry) { return entry && entry.nativePath; },
      isFileSystemProvider: true,
      createSessionToken: function (entry) {
        if (!entry || !entry.nativePath) throw new Error('createSessionToken needs a File or Folder entry');
        var t = 'session-token-' + (++tokenSeq); tokens[t] = entry.nativePath;
        post('host-call', { id: ++callSeq, module: 'uxp', fn: 'localFileSystem.createSessionToken', args: [entry.name], result: t });
        return t;
      },
      getEntryForSessionToken: function (t) { var p = tokens[t]; if (!p) throw new Error('Invalid session token: ' + t); return entryFor(p); },
      createPersistentToken: function (entry) {
        return hostCall('uxp', 'localFileSystem.createPersistentToken', [entry && entry.name], function () {
          if (!entry || !entry.nativePath) throw new Error('createPersistentToken needs a File or Folder entry');
          var t = 'persistent-token-' + (++tokenSeq); tokens[t] = entry.nativePath;
          note('uxp', 'Persistent tokens last for this preview run only (real UXP keeps them across sessions).');
          return Promise.resolve(t);
        });
      },
      getEntryForPersistentToken: function (t) {
        return hostCall('uxp', 'localFileSystem.getEntryForPersistentToken', [t], function () {
          var p = tokens[t]; if (!p || !mem[p]) return Promise.reject(new Error('The persistent token is not valid (playground: tokens do not survive a re-run).'));
          return Promise.resolve(entryFor(p));
        });
      }
    },
    secureStorage: (function () {
      var store = {};
      var api = {
        setItem: function (k, v) { return hostCall('uxp', 'secureStorage.setItem', [k], function () { store[k] = typeof v === 'string' ? new TextEncoder().encode(v) : new Uint8Array(v.buffer || v); return Promise.resolve(); }); },
        getItem: function (k) { return hostCall('uxp', 'secureStorage.getItem', [k], function () { return Promise.resolve(store[k] != null ? store[k] : null); }); },
        removeItem: function (k) { return hostCall('uxp', 'secureStorage.removeItem', [k], function () { delete store[k]; return Promise.resolve(); }); },
        key: function (i) { return Object.keys(store)[i] || null; },
        clear: function () { store = {}; return Promise.resolve(); }
      };
      Object.defineProperty(api, 'length', { get: function () { return Object.keys(store).length; } });
      return api;
    })()
  };
  storage.localFileSystem = guard(storage.localFileSystem, 'uxp.storage.localFileSystem', 'module');
  var entrypointsConfig = null;
  var setupCalled = false;
  var uxp = {
    storage: storage,
    entrypoints: {
      getPanel: function (id) { return panelInfo(id); },
      getCommand: function (id) { return commandInfo(id); },
      get _pluginInfo() { return { id: manifest.id, version: manifest.version, name: typeof manifest.name === 'string' ? manifest.name : manifest.name && manifest.name.default }; },
      setup: function (cfg) {
        return hostCall('uxp', 'entrypoints.setup', [Object.keys(cfg || {})], function () {
          if (setupCalled) throw new Error('entrypoints.setup() can only be called once.');
          setupCalled = true;
          entrypointsConfig = cfg || {};
          var declared = (manifest.entrypoints || []).map(function (e) { return e && e.id; });
          Object.keys(entrypointsConfig.panels || {}).concat(Object.keys(entrypointsConfig.commands || {})).forEach(function (id) {
            if (declared.indexOf(id) < 0) note('uxp', 'entrypoints.setup registers "' + id + '", which is not an entrypoint id in manifest.json; the host never calls it.');
          });
          var panels = entrypointsConfig.panels || {};
          Object.keys(panels).forEach(function (id) {
            var items = panels[id] && panels[id].menuItems;
            if (Array.isArray(items)) menuState[id] = items.map(function (m) { return typeof m === 'string' ? { id: m, label: m, enabled: true, checked: false } : { id: m.id, label: typeof m.label === 'string' ? m.label : (m.label && m.label.default) || m.id, enabled: m.enabled !== false, checked: !!m.checked }; });
          });
          postEntrypoints();
          setTimeout(runLifecycle, 0);
        });
      }
    },
    shell: {
      openExternal: function (url) {
        return hostCall('uxp', 'shell.openExternal', [url], function () {
          var lp = perms.launchProcess;
          var scheme = String(url).split(':')[0];
          if (!lp || !Array.isArray(lp.schemes) || (lp.schemes.indexOf(scheme) < 0 && lp.schemes.indexOf('*') < 0)) {
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
  var uxpModule = guard(uxp, 'uxp', 'module');
  // ---------------------------------------------------------------- entrypoint info objects (entrypoints.getPanel / getCommand)
  var menuState = {};
  var commandEnabled = {};
  function postEntrypoints() {
    var cfg = entrypointsConfig || {};
    post('entrypoints', { panels: Object.keys(cfg.panels || {}), commands: Object.keys(cfg.commands || {}).filter(function (c) { return commandEnabled[c] !== false; }), menus: menuState });
  }
  function manifestEntry(id, type) {
    return (manifest.entrypoints || []).filter(function (e) { return e && e.id === id && (!type || e.type === type); })[0];
  }
  function labelOf(e) { return e ? (typeof e.label === 'string' ? e.label : (e.label && e.label.default) || e.id) : ''; }
  function menuItemInfo(panelId, item) {
    var o = { get id() { return item.id; } };
    ['label', 'enabled', 'checked'].forEach(function (k) {
      Object.defineProperty(o, k, { enumerable: true, get: function () { return item[k]; }, set: function (v) { item[k] = k === 'label' ? String(v) : !!v; postEntrypoints(); } });
    });
    o.remove = function () { menuState[panelId] = (menuState[panelId] || []).filter(function (m) { return m !== item; }); postEntrypoints(); };
    return o;
  }
  function panelInfo(id) {
    var e = manifestEntry(id, 'panel');
    if (!e) { note('uxp', 'entrypoints.getPanel("' + id + '"): no panel with that id in manifest.json'); return undefined; }
    return {
      id: id,
      get label() { return labelOf(e); },
      menuItems: {
        get size() { return (menuState[id] || []).length; },
        getItem: function (menuId) { var it = (menuState[id] || []).filter(function (m) { return m.id === menuId; })[0]; return it ? menuItemInfo(id, it) : undefined; },
        getItemAt: function (i) { var it = (menuState[id] || [])[i]; return it ? menuItemInfo(id, it) : undefined; },
        insertAt: function (i, m) { var list = menuState[id] = menuState[id] || []; list.splice(i, 0, { id: m.id, label: typeof m.label === 'string' ? m.label : (m.label && m.label.default) || m.id, enabled: m.enabled !== false, checked: !!m.checked }); postEntrypoints(); },
        removeAt: function (i) { (menuState[id] || []).splice(i, 1); postEntrypoints(); }
      }
    };
  }
  function commandInfo(id) {
    var e = manifestEntry(id, 'command');
    if (!e) { note('uxp', 'entrypoints.getCommand("' + id + '"): no command with that id in manifest.json'); return undefined; }
    return {
      id: id,
      get label() { return labelOf(e); },
      get enabled() { return commandEnabled[id] !== false; },
      set enabled(v) { commandEnabled[id] = !!v; postEntrypoints(); }
    };
  }

  function hostName(app) {
    return { PS: 'Photoshop', ID: 'InDesign', premierepro: 'premierepro', ame: 'mediaencoder', aftereffects: 'aftereffects' }[app] || String(app || '');
  }
  function runLifecycle() {
    var cfg = entrypointsConfig || {};
    var p = Promise.resolve();
    if (cfg.plugin && typeof cfg.plugin.create === 'function') p = p.then(function () { note('uxp', 'plugin.create()'); return cfg.plugin.create(); });
    var panelIds = (manifest.entrypoints || []).filter(function (e) { return e && e.type === 'panel'; }).map(function (e) { return e.id; });
    var panelId = panelIds.filter(function (id) { return cfg.panels && cfg.panels[id]; })[0];
    var panel = panelId && cfg.panels[panelId];
    if (panel) {
      // Older plugins (PanelController pattern) read event.node; newer ones take rootNode directly.
      if (!('node' in document.body)) Object.defineProperty(document.body, 'node', { configurable: true, get: function () { return document.body; } });
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
    if (panel && panel.invokeMenu) { note('uxp', 'panels.' + panelId + '.invokeMenu("' + menuId + '")'); Promise.resolve().then(function () { return panel.invokeMenu(menuId); }).catch(function (e) { console.error(e); }); }
  }

  // ---------------------------------------------------------------- Node-style modules UXP provides: os, fs
  var osModule = {
    platform: function () { return /Mac/i.test(navigator.platform || navigator.userAgent) ? 'darwin' : /Win/i.test(navigator.platform || navigator.userAgent) ? 'win32' : 'darwin'; },
    release: function () { return '0.0.0-playground'; },
    arch: function () { return 'x64'; },
    cpus: function () { return [{ model: 'Playground CPU', speed: 0 }]; },
    totalmem: function () { return (navigator.deviceMemory || 8) * 1073741824; },
    freemem: function () { return (navigator.deviceMemory || 8) * 536870912; },
    homedir: function () { return '/Users/playground'; }
  };
  function fsPath(p) {
    var s = String(p);
    if (/^file:/.test(s)) requireFsPermission('full');
    return urlToPath(s);
  }
  function cbify(fn) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      var cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      var pr = Promise.resolve().then(function () { return fn.apply(null, args); });
      if (cb) { pr.then(function (v) { cb(null, v); }, function (e) { cb(e); }); return undefined; }
      return pr;
    };
  }
  function fsRead(p, o) {
    var path = fsPath(p); var e = mem[path];
    if (!e || e.type !== 'file') throw fsErr('ENOENT: no such file, ' + p);
    var enc = typeof o === 'string' ? o : o && o.encoding;
    var data = e.data;
    if (enc) return typeof data === 'string' ? data : new TextDecoder().decode(new Uint8Array(data));
    return typeof data === 'string' ? new TextEncoder().encode(data).buffer : data;
  }
  function fsWrite(p, data, o) {
    var path = fsPath(p);
    if (isReadOnly(path)) throw fsErr('EPERM: plugin folder is read-only, ' + p);
    var append = o && (o.flag === 'a' || o.flag === 'a+');
    var prev = mem[path] && mem[path].data;
    var next = typeof data === 'string' ? data : data && data.buffer ? data.buffer : data;
    if (append && typeof prev === 'string' && typeof next === 'string') next = prev + next;
    memWrite(path, next);
    post('file-written', { path: path, url: pathToUrl(path), name: path.split('/').pop(), size: bytesOf(next), content: typeof next === 'string' ? next.slice(0, 20000) : '[binary ' + bytesOf(next) + ' bytes]' });
    return bytesOf(next);
  }
  function fsStat(p) {
    var path = fsPath(p); var e = mem[path];
    if (!e) throw fsErr('ENOENT: no such file or directory, ' + p);
    return { size: e.type === 'file' ? bytesOf(e.data) : 0, isFile: function () { return e.type === 'file'; }, isDirectory: function () { return e.type === 'folder'; }, mtime: new Date(), birthtime: new Date(0) };
  }
  function fsLog(fn, args, run) { return hostCall('fs', fn, args, run); }
  var fsModule = guard({
    readFile: cbify(function (p, o) { return fsLog('readFile', [p], function () { return fsRead(p, o); }); }),
    readFileSync: function (p, o) { return fsLog('readFileSync', [p], function () { return fsRead(p, o); }); },
    writeFile: cbify(function (p, d, o) { return fsLog('writeFile', [p], function () { return fsWrite(p, d, o); }); }),
    writeFileSync: function (p, d, o) { return fsLog('writeFileSync', [p], function () { return fsWrite(p, d, o); }); },
    readdir: cbify(function (p) { return fsLog('readdir', [p], function () { var path = fsPath(p); if (!mem[path]) throw fsErr('ENOENT: ' + p); return children(path).map(function (k) { return k.split('/').pop(); }); }); }),
    readdirSync: function (p) { return fsLog('readdirSync', [p], function () { var path = fsPath(p); if (!mem[path]) throw fsErr('ENOENT: ' + p); return children(path).map(function (k) { return k.split('/').pop(); }); }); },
    lstat: cbify(function (p) { return fsLog('lstat', [p], function () { return fsStat(p); }); }),
    lstatSync: function (p) { return fsLog('lstatSync', [p], function () { return fsStat(p); }); },
    mkdir: cbify(function (p) { return fsLog('mkdir', [p], function () { mkdirp(fsPath(p)); }); }),
    rmdir: cbify(function (p) { return fsLog('rmdir', [p], function () { delete mem[fsPath(p)]; }); }),
    unlink: cbify(function (p) { return fsLog('unlink', [p], function () { var path = fsPath(p); if (isReadOnly(path)) throw fsErr('EPERM: read-only'); delete mem[path]; }); }),
    rename: cbify(function (a, b) { return fsLog('rename', [a, b], function () { var pa = fsPath(a), pb = fsPath(b); mem[pb] = mem[pa]; delete mem[pa]; }); }),
    copyFile: cbify(function (a, b) { return fsLog('copyFile', [a, b], function () { var pa = fsPath(a); memWrite(fsPath(b), mem[pa] && mem[pa].data); }); })
  }, 'fs', 'module');

  // UXP-specific DOM additions.
  if (typeof document !== 'undefined') {
    var themeListeners = [];
    var currentTheme = String(document.documentElement.getAttribute('data-theme') || 'dark');
    var theme = {
      getCurrent: function () { return currentTheme; },
      onUpdated: { addListener: function (cb) { themeListeners.push(cb); }, removeListener: function (cb) { themeListeners = themeListeners.filter(function (x) { return x !== cb; }); } }
    };
    try { Object.defineProperty(document, 'theme', { value: theme, configurable: true }); } catch (e) { /* ignore */ }
    root.__pgSetTheme = function (t) { currentTheme = t; document.documentElement.setAttribute('data-theme', t); themeListeners.forEach(function (cb) { try { cb(t); } catch (e) { console.error(e); } }); };
  }
  if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.uxpShowModal = function (opts) {
      var dlg = this;
      post('host-call', { id: ++callSeq, module: 'uxp', fn: 'dialog.uxpShowModal', args: [opts || {}], note: 'shown as an HTML modal dialog (UXP shows a host window)' });
      if (opts && opts.title) dlg.setAttribute('data-uxp-title', opts.title);
      return new Promise(function (resolve) {
        var done = function () { dlg.removeEventListener('close', done); resolve(dlg.returnValue === '' ? 'reasonCanceled' : dlg.returnValue); };
        dlg.addEventListener('close', done);
        try { if (!dlg.isConnected) document.body.appendChild(dlg); dlg.showModal(); } catch (e) { dlg.removeEventListener('close', done); throw e; }
      });
    };
    HTMLDialogElement.prototype.uxpShowPanel = function (opts) { return this.uxpShowModal(opts); };
  }
  // The preview iframe is sandboxed without same-origin, so the real Web Storage throws. UXP has localStorage
  // and sessionStorage, so give the plugin an in-memory version for this run.
  (function () {
    function memStorage(label) {
      var data = {};
      var s = {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
        setItem: function (k, v) { data[k] = String(v); },
        removeItem: function (k) { delete data[k]; },
        clear: function () { data = {}; },
        key: function (i) { return Object.keys(data)[i] || null; }
      };
      Object.defineProperty(s, 'length', { get: function () { return Object.keys(data).length; } });
      return s;
    }
    ['localStorage', 'sessionStorage'].forEach(function (k) {
      var ok = false;
      try { ok = !!root[k]; } catch (e) { ok = false; }
      if (!ok) { try { Object.defineProperty(root, k, { value: memStorage(k), configurable: true }); } catch (e) { /* ignore */ } }
    });
  })();
  root.global = root;

  // window.ImageBlob (UXP 7.0+): a Blob from encoded image bytes or from raw pixels ("image/uncompressed").
  // Raw pixels are converted to PNG here so URL.createObjectURL(blob) works in <img>, as it does in Photoshop.
  if (typeof root.ImageBlob === 'undefined' && typeof Blob !== 'undefined') {
    var ImageBlobImpl = function ImageBlob(buffer, options) {
      var o = options || {};
      var bytes;
      if (buffer instanceof ArrayBuffer) bytes = new Uint8Array(buffer);
      else if (buffer && ArrayBuffer.isView(buffer)) bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      else throw new TypeError('ImageBlob: arrayBuffer must be an ArrayBuffer');
      if (o.type !== 'image/uncompressed') return new Blob([bytes], { type: o.type || '' });
      if (!(o.width > 0) || !(o.height > 0)) throw new Error('ImageBlob: width and height are required');
      if (o.colorSpace !== 'RGB' && o.colorSpace !== 'Grayscale') throw new Error('ImageBlob: unsupported colorSpace ' + o.colorSpace);
      if (o.componentSize !== 8 && o.componentSize !== 16) throw new Error('ImageBlob: unsupported componentSize ' + o.componentSize);
      if (['RGB', 'RGBA', 'Gray', 'GrayAlpha', 'Grayscale'].indexOf(o.pixelFormat) < 0) throw new Error('ImageBlob: unsupported pixelFormat ' + o.pixelFormat);
      var comps = o.components || (o.pixelFormat === 'RGBA' ? 4 : o.pixelFormat === 'RGB' ? 3 : 1);
      var step = o.componentSize / 8;
      var need = o.width * o.height * comps * step;
      if (bytes.byteLength !== need) throw new Error('ImageBlob: byteLength ' + bytes.byteLength + ' does not match ' + o.width + '×' + o.height + '×' + comps + '×' + step + ' = ' + need);
      var canvas = document.createElement('canvas');
      canvas.width = o.width; canvas.height = o.height;
      var ctx = canvas.getContext('2d');
      var img = ctx.createImageData(o.width, o.height);
      var read = step === 2 ? function (i) { return bytes[i * 2 + 1]; } : function (i) { return bytes[i]; };
      for (var px = 0; px < o.width * o.height; px++) {
        var b = px * comps, d = px * 4;
        if (comps >= 3) { img.data[d] = read(b); img.data[d + 1] = read(b + 1); img.data[d + 2] = read(b + 2); img.data[d + 3] = comps === 4 ? read(b + 3) : 255; }
        else { img.data[d] = img.data[d + 1] = img.data[d + 2] = read(b); img.data[d + 3] = comps === 2 ? read(b + 1) : 255; }
      }
      ctx.putImageData(img, 0, 0);
      var b64 = canvas.toDataURL('image/png').split(',')[1];
      var bin = atob(b64); var png = new Uint8Array(bin.length);
      for (var k = 0; k < bin.length; k++) png[k] = bin.charCodeAt(k);
      return new Blob([png], { type: 'image/png' });
    };
    root.ImageBlob = ImageBlobImpl;
  }

  function premiereRead(name, value) {
    return hostCall('premierepro', name, [], function () { return value; });
  }
  var premiereSequence = {
    name: 'Sequence 01',
    getVideoTrackCount: function () { return premiereRead('Sequence.getVideoTrackCount', 3); },
    getAudioTrackCount: function () { return premiereRead('Sequence.getAudioTrackCount', 4); },
    getEndTime: function () { return premiereRead('Sequence.getEndTime', { seconds: 62.5 }); }
  };
  var premierepro = {
    Markers: {
      getMarkers: function (sequence) {
        return Promise.resolve(hostCall('premierepro', 'Markers.getMarkers', [sequence.name], function () {
          return {
            getMarkers: function () {
              return premiereRead('Markers.getMarkers (collection)', [
                { getName: function () { return 'Opening'; }, getStart: function () { return { seconds: 0 }; } },
                { getName: function () { return 'Review cut'; }, getStart: function () { return { seconds: 23.5 }; } }
              ]);
            }
          };
        }));
      }
    },
    Project: {
      getActiveProject: function () {
        return hostCall('premierepro', 'Project.getActiveProject', [], function () {
          return Promise.resolve({
            name: 'Mock Project.prproj',
            getActiveSequence: function () {
              return hostCall('premierepro', 'Project.getActiveSequence', [], function () { return Promise.resolve(premiereSequence); });
            },
            getSequences: function () {
              return Promise.resolve(premiereRead('Project.getSequences', [premiereSequence, { ...premiereSequence, name: 'Social cut' }]));
            },
            getRootItem: function () {
              return Promise.resolve(premiereRead('Project.getRootItem', {
                getItems: function () {
                  return Promise.resolve(premiereRead('FolderItem.getItems', [{ name: 'Footage' }, { name: 'Audio' }, { name: 'Sequence 01' }]));
                }
              }));
            },
            importFiles: function (paths, suppressUI) {
              return hostCall('premierepro', 'Project.importFiles', [paths, suppressUI], function () {
                var exists = Array.isArray(paths) && paths.length > 0 && paths.every(function (path) {
                  var entry = mem[urlToPath(path)];
                  return entry && entry.type === 'file';
                });
                note('premierepro', 'Project.importFiles checks the preview file system. Open the plugin in Premiere Pro to import into a real project.');
                return Promise.resolve(exists);
              });
            }
          });
        });
      }
    }
  };
  var indesign = {
    app: {
      get documents() { return { length: 1 }; },
      get activeDocument() {
        return hostCall('indesign', 'app.activeDocument', [], function () { return { name: 'Mock Layout.indd', pages: { length: 3 } }; });
      },
      doScript: function () { note('indesign', 'app.doScript is not simulated'); }
    }
  };
  var mediaEncoder = {
    RenderQueue: {
      RENDER_QUEUE_RUNNING: 2,
      RENDER_QUEUE_STOPPED: 0,
      RENDER_QUEUE_PAUSED: 3,
      RENDER_QUEUE_STOPPING: 4,
      getInstance: function () {
        return { getStatus: function () {
          return hostCall('mediaencoder', 'RenderQueue.getStatus', [], function () { return mediaEncoder.RenderQueue.RENDER_QUEUE_STOPPED; });
        } };
      }
    }
  };
  var afterEffects = {
    get project() {
      return hostCall('aftereffects', 'app.project', [], function () { return { numItems: 3, activeItem: { name: 'Mock Composition' } }; });
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
  var reactDomShimmed = null;
  function reactDom() {
    if (reactDomShimmed) return reactDomShimmed;
    var v = loadVendor();
    var RD = v.ReactDOM, client = v.ReactDOMClient;
    var roots = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    var warned = false;
    var shim = Object.assign({}, RD);
    // React 18 deprecated and React 19 removed ReactDOM.render; Adobe's React samples still call it.
    if (typeof RD.render !== 'function') {
      shim.render = function (el, container, cb) {
        if (!warned) { warned = true; note('react', 'ReactDOM.render was removed in React 19. The playground maps it to createRoot().render(); a real plugin uses the React version it bundles.'); }
        var r = roots && roots.get(container);
        if (!r) { r = client.createRoot(container); if (roots) roots.set(container, r); }
        r.render(el);
        if (typeof cb === 'function') setTimeout(cb, 0);
        return null;
      };
      shim.unmountComponentAtNode = function (container) { var r = roots && roots.get(container); if (r) { r.unmount(); roots.delete(container); return true; } return false; };
      shim.hydrate = shim.render;
    }
    reactDomShimmed = shim;
    return shim;
  }
  var builtins = {
    photoshop: function () { return photoshopModule; },
    uxp: function () { return uxpModule; },
    premierepro: function () { return premierepro; },
    indesign: function () { return indesign; },
    mediaencoder: function () { return mediaEncoder; },
    aftereffects: function () { return afterEffects; },
    os: function () { return osModule; },
    fs: function () { return fsModule; },
    react: function () { return loadVendor().React; },
    'react-dom': function () { return reactDom(); },
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
    var abs = name.indexOf('plugin:') === 0 || name.charAt(0) === '/';
    var p = normalize(abs ? '' : from, name.replace(/^plugin:\/*/, '').replace(/^\/+/, ''));
    var tries = [p, p + '.js', p + '.jsx', p + '.ts', p + '.tsx', p + '.mjs', p + '.cjs', p + '.json', p + '/index.js', p + '/index.jsx', p + '/index.ts', p + '/index.tsx'];
    for (var i = 0; i < tries.length; i++) if (Object.prototype.hasOwnProperty.call(mods, tries[i])) return tries[i];
    return null;
  }
  var missingPackages = {};
  function makeRequire(from) {
    return function require(name) {
      if (typeof name !== 'string') throw new TypeError('require() needs a string');
      if (name.indexOf('adobe:') === 0) name = name.slice(6);
      if (builtins[name]) return builtins[name]();
      if (name.charAt(0) !== '.' && name.charAt(0) !== '/' && name.indexOf('plugin:') !== 0) {
        var pkg = name.charAt(0) === '@' ? name.split('/').slice(0, 2).join('/') : name.split('/')[0];
        if (!missingPackages[pkg]) { missingPackages[pkg] = true; post('missing-package', { name: pkg, from: from }); }
        var err = new Error('Cannot find module "' + name + '" (required from ' + (from || 'the page') + '). npm packages need the project bundler.');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      var path = resolve(from, name);
      if (!path) { var e2 = new Error('Cannot find module "' + name + '" from "' + (from || '/') + '": no such file in the project.'); e2.code = 'MODULE_NOT_FOUND'; throw e2; }
      return load(path);
    };
  }
  function syntaxHint(path, e) {
    var msg = String(e && e.message || e);
    var hint = '';
    if (/await is only valid/.test(msg)) hint = ' UXP loads plain scripts, not ES modules, so top-level await is a syntax error there too. Wrap the code in an async function.';
    else if (/Cannot use import statement|Unexpected token 'export'/.test(msg)) hint = ' Use require() or rename the file to .mjs/.jsx so the playground compiles it.';
    var out = new SyntaxError(path + ': ' + msg + '.' + hint + ' The Problems tab shows the line.');
    out.pgFile = path;
    return out;
  }
  function load(path) {
    if (cache[path]) return cache[path].exports;
    var mod = BOOT.modules[path];
    var m = { exports: {}, id: path, filename: path, loaded: false };
    cache[path] = m;
    if (mod.kind === 'json') {
      try { m.exports = JSON.parse(mod.code); } catch (e) { delete cache[path]; throw new SyntaxError(path + ': invalid JSON (' + e.message + ')'); }
      return m.exports;
    }
    if (mod.kind === 'css') {
      var st = document.createElement('style'); st.setAttribute('data-pg-file', path); st.textContent = mod.code; document.head.appendChild(st);
      m.exports = {}; return m.exports;
    }
    if (mod.kind === 'asset') { m.exports = mod.code; return m.exports; }
    if (mod.error) { delete cache[path]; var ce = new SyntaxError(path + ': ' + mod.error); ce.pgCompile = true; ce.pgFile = path; throw ce; }
    var dir = path.split('/').slice(0, -1).join('/');
    var fn;
    try {
      fn = new Function('module', 'exports', 'require', '__filename', '__dirname', 'global', mod.code + '\n//# sourceURL=plugin:///' + path);
    } catch (e) { delete cache[path]; throw syntaxHint(path, e); }
    fn.call(m.exports, m, m.exports, makeRequire(path), path, dir, root);
    m.loaded = true;
    return m.exports;
  }
  root.require = makeRequire('');
  var loadedScripts = [];
  root.__pg = {
    run: function (path) {
      loadedScripts.push(path);
      // Compile errors were already reported (with line and column) when the preview was built.
      try { load(path); } catch (e) { if (!(e && e.pgCompile)) post('error', { message: e && e.message ? e.message : String(e), stack: e && e.stack, file: (e && e.pgFile) || path }); }
    },
    missing: function (from, path) {
      post('error', { message: from + ' loads "' + path + '", which is not in the project.' + (/\.js$/.test(path) ? ' If a bundler (webpack) normally writes it, run the source entry instead.' : ''), file: from });
    },
    // Ready once the panel scripts have run; remote resources (CDN modules, images) can still be loading.
    loaded: function () { post('scripts-done', { scripts: loadedScripts }); setTimeout(function () { post('ready', { url: String(location.href).slice(0, 20) }); }, 0); },
    invokeCommand: invokeCommand,
    invokeMenu: invokeMenu,
    domainAllowed: domainAllowed,
    state: psState,
    modal: modal,
    mem: mem,
    apiVersion: apiVersion,
    builtins: { photoshop: photoshopModule, uxp: uxpModule, os: osModule, fs: fsModule }
  };
  root.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.__pgParent && d.type === 'invokeCommand') invokeCommand(d.id);
    if (d.__pgParent && d.type === 'invokeMenu') invokeMenu(d.panelId, d.menuId);
    if (d.__pgParent && d.type === 'setTheme' && root.__pgSetTheme) root.__pgSetTheme(d.theme);
    if (d.__pgParent && d.type === 'batchPlay') {
      var list = d.descriptors;
      photoshop.core.executeAsModal(function () { return photoshop.action.batchPlay(list, {}); }, { commandName: 'batchPlay inspector' })
        .then(function (r) { post('batchplay-result', { token: d.token, result: r }); }, function (err) { post('batchplay-result', { token: d.token, error: err && err.message ? err.message : String(err) }); });
    }
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
      set selectedIndex(n) { this._items().forEach(function (i, k) { if (k === Number(n)) i.setAttribute('selected', ''); else i.removeAttribute('selected'); }); this._sync(); }
      get value() { var i = this._items()[this.selectedIndex]; return i ? (i.getAttribute('value') || i.textContent.trim()) : undefined; }
      set value(v) { var items = this._items(); var idx = items.findIndex(function (i) { return (i.getAttribute('value') || i.textContent.trim()) === String(v); }); this.selectedIndex = idx; }
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
    define('sp-action-group', class extends HTMLElement { connectedCallback() { this.setAttribute('role', 'group'); } });
    define('sp-tooltip', class extends HTMLElement {});
    define('sp-menu-divider', class extends HTMLElement {});
  }
})(window);
