/* Ask the Iḥyāʾ — meaning-based search over the whole book, run entirely in the reader's browser.
   Drop-in for shamsalmaarif.org: add <script src="book/ask.js" defer></script> before </body> in index.html.
   Needs: book/search.json (already on the site) and book/ask-embed.i8 (row-aligned int8 passage vectors).
   Model: Xenova/bge-small-en-v1.5 (q8, ~34 MB, cached by the browser after first use). */
(() => {
  'use strict';
  const TF_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5';
  const MODEL = 'Xenova/bge-small-en-v1.5';
  const DIM = 384, SCALE = 0.35 / 127;
  const QPREFIX = 'Represent this sentence for searching relevant passages: ';
  const C = { bg: '#0a0806', panel: '#14100b', line: '#ffffff17', fg: '#ece6d8', muted: '#a89f8e', gold: '#e8b84f' };
  const EXAMPLES = ['What are the conditions for this science?', 'How is a wafq for protection made?',
    'Which names bring love between hearts?', 'What does the Throne Verse do?', 'Working for healing an illness'];
  const STOP = new Set('a an the and or of to in on at by for from with as is are was were be it its this that what which who how why when does do i me my you your he his him they them we our can will should about into'.split(' '));

  let rows = null, vecs = null, extractor = null, loading = null, open = false;
  const babLabel = c => c === 0 ? 'Prologue' : c === 21 ? 'Applied workings' : 'Bāb ' + c;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʿʾ'’‘`]/g, '');
  const words = s => fold(s).match(/[a-z]{3,}/g)?.filter(w => !STOP.has(w)) || [];

  /* ---------- UI ---------- */
  const css = `
  #ihya-ask-btn{position:fixed;z-index:9998;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));
    background:${C.gold};color:#1a1206;border:0;border-radius:999px;padding:11px 18px;font:600 14px/1 system-ui,sans-serif;cursor:pointer;
    box-shadow:0 6px 24px #0008;display:flex;gap:8px;align-items:center}
  #ihya-ask-btn:hover{filter:brightness(1.08)} #ihya-ask-btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
  #ihya-ask{position:fixed;z-index:9999;inset:0;display:none;background:#000a;backdrop-filter:blur(3px)}
  #ihya-ask.on{display:flex;justify-content:center;align-items:flex-start;padding:max(4vh,env(safe-area-inset-top,0px)) 12px 12px}
  #ihya-ask .box{width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;background:${C.panel};color:${C.fg};
    border:1px solid ${C.line};border-radius:14px;box-shadow:0 20px 60px #000c;overflow:hidden;font:15px/1.55 Georgia,'Times New Roman',serif}
  #ihya-ask header{display:flex;gap:10px;align-items:center;padding:14px 16px;border-bottom:1px solid ${C.line}}
  #ihya-ask header b{font:600 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:${C.gold}}
  #ihya-ask header span{color:${C.muted};font-size:12.5px;flex:1}
  #ihya-ask .x{background:none;border:1px solid ${C.line};color:${C.muted};border-radius:8px;padding:4px 10px;cursor:pointer;font:13px system-ui}
  #ihya-ask form{display:flex;gap:8px;padding:12px 16px}
  #ihya-ask input{flex:1;min-width:0;background:${C.bg};color:${C.fg};border:1px solid ${C.line};border-radius:10px;padding:12px 14px;font:16px Georgia,serif}
  #ihya-ask input:focus{outline:none;border-color:${C.gold}}
  #ihya-ask form button{background:${C.gold};color:#1a1206;border:0;border-radius:10px;padding:0 16px;font:600 14px system-ui;cursor:pointer}
  #ihya-ask .body{overflow:auto;padding:4px 16px 16px;display:grid;gap:10px}
  #ihya-ask .status{color:${C.muted};font:13px system-ui;padding:6px 0}
  #ihya-ask .chips{display:flex;flex-wrap:wrap;gap:6px}
  #ihya-ask .chip{background:none;border:1px solid ${C.line};color:${C.fg};border-radius:999px;padding:6px 11px;font:13px Georgia,serif;cursor:pointer}
  #ihya-ask .chip:hover{border-color:${C.gold};color:${C.gold}}
  #ihya-ask .hit{border:1px solid ${C.line};border-radius:10px;padding:11px 13px;display:grid;gap:6px;background:${C.bg}}
  #ihya-ask .hit.best{border-color:${C.gold}66}
  #ihya-ask .meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:12px ui-monospace,Menlo,monospace;color:${C.muted}}
  #ihya-ask .meta .lab{color:${C.gold}}
  #ihya-ask .go{margin-left:auto;background:none;border:1px solid ${C.gold}88;color:${C.gold};border-radius:7px;padding:4px 9px;font:12px system-ui;cursor:pointer}
  #ihya-ask .go:hover{background:${C.gold}22}
  #ihya-ask p{margin:0} #ihya-ask mark{background:${C.gold}33;color:inherit;border-radius:2px;padding:0 1px}
  #ihya-ask .ctx{color:${C.muted};font-size:14px}
  #ihya-ask .foot{font:11.5px system-ui;color:${C.muted};padding:8px 16px;border-top:1px solid ${C.line}}
  @media (max-width:520px){#ihya-ask-btn span.t{display:none}}`;

  function mount() {
    if (document.getElementById('ihya-ask-btn')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.id = 'ihya-ask-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Ask the Iḥyāʾ');
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="t">Ask the Iḥyāʾ</span>';
    btn.onclick = show;
    const ov = document.createElement('div'); ov.id = 'ihya-ask'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="box"><header><b>Ask the Iḥyāʾ</b><span>Ask in your own words. Answers come from the book, with the page.</span><button class="x" type="button">Close</button></header>
      <form><input id="ihya-ask-q" type="search" autocomplete="off" placeholder="e.g. how is a wafq for protection made?" aria-label="Your question"><button type="submit">Ask</button></form>
      <div class="body"><div class="status" id="ihya-ask-st"></div><div class="chips">${EXAMPLES.map(e => `<button class="chip" type="button">${esc(e)}</button>`).join('')}</div><div id="ihya-ask-res"></div></div>
      <div class="foot">Runs privately in your browser. Nothing you type leaves this device. First use downloads a 34 MB model, cached after that.</div></div>`;
    document.body.append(btn, ov);
    ov.addEventListener('click', e => { if (e.target === ov) hide(); });
    ov.querySelector('.x').onclick = hide;
    ov.querySelector('form').onsubmit = e => { e.preventDefault(); ask(ov.querySelector('input').value); };
    ov.querySelectorAll('.chip').forEach(c => c.onclick = () => { ov.querySelector('input').value = c.textContent; ask(c.textContent); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && open) hide();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); open ? hide() : show(); }
    });
  }
  const $ = id => document.getElementById(id);
  function show() { open = true; $('ihya-ask').classList.add('on'); setTimeout(() => $('ihya-ask-q').focus(), 30); load().catch(() => {}); }
  function hide() { open = false; $('ihya-ask').classList.remove('on'); }
  const status = t => { $('ihya-ask-st').textContent = t || ''; };

  /* ---------- data + model ---------- */
  function load() {
    if (loading) return loading;
    loading = (async () => {
      status('Loading the book…');
      const [r, v] = await Promise.all([
        fetch('book/search.json').then(x => { if (!x.ok) throw new Error('search.json ' + x.status); return x.json(); }),
        fetch('book/ask-embed.i8').then(x => x.ok ? x.arrayBuffer() : null).catch(() => null)
      ]);
      rows = r;
      rows.forEach(x => { x._w = new Set(words(x[3])); });
      if (v && v.byteLength === rows.length * DIM) vecs = new Int8Array(v);
      if (vecs) {
        status('Loading the language model (first time only)…');
        try {
          const tf = await import(TF_URL);
          tf.env.allowLocalModels = false;
          extractor = await tf.pipeline('feature-extraction', MODEL, { dtype: 'q8' });
        } catch (e) { console.warn('[ask] model unavailable, using keyword search', e); extractor = null; }
      }
      status(extractor ? 'Ready.' : 'Ready (keyword mode).');
    })();
    loading.catch(e => { status('Could not load the book: ' + e.message); loading = null; });
    return loading;
  }

  async function ask(q) {
    q = (q || '').trim(); if (q.length < 3) return;
    $('ihya-ask-res').innerHTML = '';
    await load(); if (!rows) return;
    status('Searching ' + rows.length.toLocaleString() + ' passages…');
    const qw = [...new Set(words(q))];
    const N = rows.length, scores = new Float32Array(N);
    if (extractor && vecs) {
      const out = await extractor([QPREFIX + q], { pooling: 'cls', normalize: true });
      const e = out.data;
      for (let i = 0; i < N; i++) { let s = 0, o = i * DIM; for (let k = 0; k < DIM; k++) s += e[k] * vecs[o + k]; scores[i] = s * SCALE; }
    }
    for (let i = 0; i < N; i++) {
      const r = rows[i]; let kw = 0;
      if (qw.length) { for (const w of qw) if (r._w.has(w)) kw++; kw /= qw.length; }
      let s = scores[i] + (extractor ? 0.12 : 1) * kw;
      if (r[2] === 'seal') s -= 0.05;
      if (r[3].length < 40) s -= 0.04;
      scores[i] = s;
    }
    const idx = [...scores.keys()].sort((a, b) => scores[b] - scores[a]);
    const seen = new Set(), top = [];
    for (const i of idx) { const key = rows[i][0] + ':' + rows[i][1]; if (seen.has(key)) continue; seen.add(key); top.push(i); if (top.length >= 10) break; }
    if (!top.length || scores[top[0]] <= 0) { status('Nothing found. Try other words.'); return; }
    status(`Best matches for “${q}”`);
    const hl = t => { let h = esc(t); for (const w of qw) h = h.replace(new RegExp('\\b(' + w.replace(/[^a-z]/g, '') + '\\w*)', 'gi'), '<mark>$1</mark>'); return h; };
    $('ihya-ask-res').innerHTML = top.map((i, n) => {
      const r = rows[i];
      const ctx = n === 0 ? [i + 1, i + 2].filter(j => rows[j] && rows[j][1] === r[1] && rows[j][2] === 'p').map(j => `<p class="ctx">${hl(rows[j][3].slice(0, 420))}</p>`).join('') : '';
      return `<div class="hit${n === 0 ? ' best' : ''}"><div class="meta"><span class="lab">${n === 0 ? 'Most relevant · ' : ''}${esc(babLabel(r[0]))}</span><span>p. ${r[1]}</span>${r[2] === 'seal' ? '<span>sealed</span>' : ''}<button class="go" type="button" data-ch="${r[0]}" data-p="${r[1]}">Read p. ${r[1]}</button></div><p>${hl(r[3].slice(0, n === 0 ? 900 : 380))}${r[3].length > (n === 0 ? 900 : 380) ? '…' : ''}</p>${ctx}</div>`;
    }).join('');
    $('ihya-ask-res').querySelectorAll('.go').forEach(b => b.onclick = () => {
      const page = +b.dataset.p, chapter = +b.dataset.ch;
      if (window.__ihyaGo) { hide(); window.__ihyaGo('kitab', { chapter, page, view: 'read' }); }
      else location.hash = '#/kitab';
    });
  }

  window.__ihyaAsk = { show, ask };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
