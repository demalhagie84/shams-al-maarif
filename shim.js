/* Site shim: stands in for the Claude artifact runtime on shamsalmaarif.org.
   db -> this browser's localStorage; tts -> the browser's own voices;
   downloads -> a normal file download. The AI (sample) and dictation stay off
   here until a site AI service is connected. */
(function(){
  if (window.claude && typeof window.claude.use === 'function') return;
  const P = 'hikma:db:';
  const rd = k => { try { const v = localStorage.getItem(P + k); return v ? JSON.parse(v) : null } catch (e) { return null } };
  const wr = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)) } catch (e) {} };
  const rm = k => { try { localStorage.removeItem(P + k) } catch (e) {} };
  const listeners = {};
  const snap = (id, d) => ({ id, exists: d != null, data: () => d });
  function docRef(path) {
    const id = path.split('/').pop();
    return {
      id,
      get: async () => snap(id, rd(path)),
      set: async (v, o) => { const cur = (o && o.merge) ? (rd(path) || {}) : {}; wr(path, Object.assign(cur, v)); (listeners[path] || []).forEach(f => f(snap(id, rd(path)))) },
      update: async v => { wr(path, Object.assign(rd(path) || {}, v)); (listeners[path] || []).forEach(f => f(snap(id, rd(path)))) },
      delete: async () => { rm(path); (listeners[path] || []).forEach(f => f(snap(id, null))) },
      onSnapshot: f => { (listeners[path] = listeners[path] || []).push(f); setTimeout(() => f(snap(id, rd(path))), 0); return () => { listeners[path] = (listeners[path] || []).filter(x => x !== f) } }
    };
  }
  function query(name, steps) {
    const run = () => {
      const pre = P + name + '/'; let docs = [];
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(pre) && !k.slice(pre.length).includes('/')) { const id = k.slice(pre.length); docs.push(snap(id, rd(name + '/' + id))) } } } catch (e) {}
      for (const s of steps) {
        if (s[0] === 'where') { const [, f, op, v] = s; docs = docs.filter(d => { const x = (d.data() || {})[f]; return op === '>' ? x > v : op === '>=' ? x >= v : op === '<' ? x < v : op === '<=' ? x <= v : op === '==' ? x === v : op === '!=' ? x !== v : true }) }
        else if (s[0] === 'orderBy') { const [, f, dir] = s; docs.sort((a, b) => { const x = (a.data() || {})[f], y = (b.data() || {})[f]; return (x > y ? 1 : x < y ? -1 : 0) * (dir === 'desc' ? -1 : 1) }) }
        else if (s[0] === 'limit') docs = docs.slice(0, s[1]);
      }
      return { docs, size: docs.length, empty: !docs.length, forEach: f => docs.forEach(f) };
    };
    return {
      where: (f, op, v) => query(name, steps.concat([['where', f, op, v]])),
      orderBy: (f, dir) => query(name, steps.concat([['orderBy', f, dir]])),
      limit: n => query(name, steps.concat([['limit', n]])),
      get: async () => run(),
      doc: id => docRef(name + '/' + (id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)))),
      add: async v => { const r = docRef(name + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)); await r.set(v); return r },
      onSnapshot: f => { setTimeout(() => f(run()), 0); return () => {} }
    };
  }
  const db = { doc: docRef, collection: n => query(n, []) };

  const tts = ('speechSynthesis' in window) ? {
    speak: (text, o) => new Promise((res, rej) => {
      try {
        speechSynthesis.cancel();
        const parts = String(text || '').match(/[^.!?\n]{1,220}[.!?\n]?/g) || [];
        if (!parts.length) return res();
        const vs = speechSynthesis.getVoices(); const lang = (o && o.lang) || 'en';
        const v = vs.find(x => x.lang && x.lang.startsWith(lang) && /natural|google|samantha|daniel/i.test(x.name)) || vs.find(x => x.lang && x.lang.startsWith(lang));
        parts.forEach((p, i) => { const u = new SpeechSynthesisUtterance(p); if (v) u.voice = v; u.rate = (o && o.rate) || 0.95; if (i === parts.length - 1) { u.onend = () => res(); u.onerror = () => res() } speechSynthesis.speak(u) });
      } catch (e) { rej(e) }
    }),
    stop: () => { try { speechSynthesis.cancel() } catch (e) {} }
  } : null;

  const downloads = {
    save: async ({ filename, data }) => { const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); const a = document.createElement('a'); a.href = url; a.download = filename || 'download'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000) }
  };

  const caps = { db, tts, downloads, sample: null, dictation: null, assets: null };
  window.claude = { use: async n => caps[n] || null };
})();
