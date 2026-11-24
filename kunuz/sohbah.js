/* ===== Kunūz al-Dhikr inside the merged engine — port 6, part 4 (2026-11-17): the Sohbahs.
   A vanilla-JS port of Kunūz al-Dhikr's sohbahs() and its SOH store (index.html, "pass 2"): the 2,302 sohbahs of
   Mawlana Shaykh Nāẓim al-Ḥaqqānī (1979–2013) as Kunūz carries them — kunuz/sohbah/index.json (titles, lengths, which
   word-index shard holds each two-letter prefix), the text in 96 shards of 24 (kunuz/sohbah/t-NNN.json, B's sohbah/v2/t-*)
   and the prebuilt word index (kunuz/sohbah/fx-NN.json, B's sohbah/v2/fx-*: word → postings "gap.count" in base 36;
   Arabic words also indexed without the article). Title search as you type with the words marked; Enter / "Search every
   word" ranks every sohbah by B's own score (all words first, then Σ 1+ln(min(8,count)) + 2 for a title hit) with the
   "word ×n" counts and a passage that loads when it scrolls into view; open one at random; the reader with previous /
   next and B's highlight of the searched words.
   Better than B: paragraphs instead of one pre-wrapped block, "find in this sohbah" with the count and ‹ › between the
   matches, A−/A+, the place kept in each sohbah and a reading bar, ☆ keep (this device) with a Kept list, Recently read,
   the Qurʾān references it names read in place from the copied Tanzil muṣḥaf with the engine's abjad, "Ask about this
   sohbah", the address #read/sohbah/<n>, English-only read-aloud (englishOnly skips every Arabic and transliterated
   word — decision 1), and Ask tools search_sohbahs_fulltext and open_sohbah. ===== */
(function(){
'use strict';
const css=`
.shbar{display:grid;gap:8px}
.shrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.shrow input[type=search]{flex:1 1 260px;min-width:0;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit}
.shtg{font:inherit;font-size:.82rem;min-height:36px;padding:4px 12px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.shtg .num{color:inherit;opacity:.7;font-size:.74rem}
.shtg[aria-pressed="true"]{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}
.shtg.pri{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}
.shtg:hover{border-color:var(--gold)}.shtg:disabled{opacity:.45;cursor:default}
.shgrid{display:grid;grid-template-columns:minmax(0,330px) minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:820px){.shgrid{grid-template-columns:minmax(0,1fr)}.shlist{max-height:46vh}}
.shlist{display:grid;gap:2px;max-height:76vh;overflow-y:auto;align-content:start;min-width:0;padding-right:2px;scrollbar-width:thin}
.shit{font:inherit;text-align:left;display:grid;gap:2px;padding:8px 10px;border:1px solid transparent;border-radius:8px;background:none;color:var(--ink);cursor:pointer;min-height:44px;min-width:0}
.shit:hover{border-color:var(--line);background:var(--bg)}
.shit[aria-current="true"]{border-color:var(--gold);background:var(--gold-soft)}
.shit .t{font-size:.92rem;line-height:1.35;overflow-wrap:anywhere}
.shit .m{font-family:var(--f-mono);font-size:.72rem;color:var(--muted);font-variant-numeric:tabular-nums;display:flex;gap:8px;flex-wrap:wrap}
.shit .m .hits{color:var(--turq)}
.shit .x{font-size:.82rem;color:var(--muted);line-height:1.45;overflow-wrap:anywhere}
.shit mark,.shart mark{background:var(--gold-soft);color:inherit;border-bottom:2px solid var(--gold)}
.shart mark.on{background:var(--gold);color:#1a1405}
.shread{min-width:0;display:grid;gap:10px;align-content:start}
.shcard{border:1px solid color-mix(in srgb,var(--gold) 55%,var(--line));border-radius:12px;padding:14px 16px;background:var(--panel);display:grid;gap:10px;box-shadow:inset 0 3px 0 var(--gold);min-width:0}
.shcard h3{font-family:var(--f-head);font-weight:400;font-size:1.35rem;margin:0;text-wrap:balance;overflow-wrap:anywhere}
.shtools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;position:sticky;top:calc(var(--hdrH,0px) + 4px);z-index:2;background:var(--panel);padding:6px 0;border-bottom:1px solid var(--line)}
.shtools input{flex:1 1 150px;min-width:0;padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit;font-size:.88rem}
@media (max-width:520px){.shtools input{flex:1 1 100%}}
.shprog{height:4px;border-radius:2px;background:var(--line);overflow:hidden}.shprog i{display:block;height:100%;background:var(--gold);width:0}
.shart{font-size:var(--shfs,1.02rem);line-height:1.7;max-width:70ch;overflow-wrap:anywhere}
.shart p{margin:0 0 .8em}
.shart .ari{font-size:1.2em}
.shq{border:1px solid color-mix(in srgb,var(--turq) 45%,var(--line));border-radius:8px;padding:8px 12px;display:grid;gap:4px;background:var(--bg)}
.shq .ar{font-size:1.35rem;line-height:1.9}.shq .tl{font-style:italic;color:var(--turq);margin:0}
.shab{font-family:var(--f-mono);font-size:.72rem;background:var(--gold-soft);color:var(--gold);border-radius:999px;padding:1px 8px}
.shrec{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}
.shrec button{flex:none;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ── Kunūz's own normaliser, query terms and highlighter, exactly as B (the word index was built with this norm()) ── */
const N_STRIP=/[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed\u0640\u02be\u02bf\u02bb\u02bc\u2018\u2019'`\u00b4]/g;
const N_MAP={'ٱ':'ا','ة':'ه','ى':'ي','ک':'ك','ی':'ي','ھ':'ه','ہ':'ه'};
const bn=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(N_STRIP,'').replace(/[ٱةىکیھہ]/g,c=>N_MAP[c]);
const N_STOP=new Set(['the','and','of','to','in','is','for','on','al','wa']);
function qterms(q){const t=[...new Set(bn(q).split(/[^a-z0-9ء-ي]+/).filter(w=>w.length>1))]; const s=t.filter(w=>!N_STOP.has(w)); return s.length?s:t}
const NC=new Map(); const nch=c=>{let v=NC.get(c); if(v===undefined){v=bn(c); NC.set(c,v)} return v};
function nmap(text){let n=''; const map=[]; for(let i=0;i<text.length;i++){const c=nch(text[i]); for(let j=0;j<c.length;j++){n+=c[j]; map.push(i)}} return {n,map}}
const RE_MARK=/[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed]/, RE_ARW=/[ء-ي]/;
function hlq(text,terms){text=String(text==null?'':text); if(!terms||!terms.length) return esc(text); const {n,map}=nmap(text), R=[];
  for(const t of terms){let i=n.indexOf(t); while(i>-1){let a=map[i],b=map[i+t.length-1]+1; while(b<text.length&&RE_MARK.test(text[b])) b++;
    if(RE_ARW.test(t)){while(a>0&&!/\s/.test(text[a-1])) a--; while(b<text.length&&!/\s/.test(text[b])) b++} R.push([a,b]); i=n.indexOf(t,i+t.length)}}
  if(!R.length) return esc(text); R.sort((x,y)=>x[0]-y[0]); let out='',p=0; for(const [a,b] of R){if(b<=p) continue; const s=Math.max(a,p); out+=esc(text.slice(p,s))+'<mark>'+esc(text.slice(s,b))+'</mark>'; p=b} return out+esc(text.slice(p))}
function firstHit(text,terms){const {n,map}=nmap(text); let best=-1; for(const t of terms){const i=n.indexOf(t); if(i>-1&&(best<0||i<best)) best=i} return best<0?-1:map[best]}
function snippet(text,terms,len){len=len||260; text=String(text||'').replace(/\s+/g,' ').trim(); const h=firstHit(text,terms); let a=Math.max(0,(h<0?0:h)-70); if(a>0){const sp=text.indexOf(' ',a); if(sp>-1&&sp<a+25) a=sp+1} let b=Math.min(text.length,a+len); if(b<text.length){const sp=text.lastIndexOf(' ',b); if(sp>a+len*.6) b=sp}
  return (a>0?'… ':'')+hlq(text.slice(a,b),terms)+(b<text.length?' …':'')}

/* ── B's SOH store, on this engine's copies ── */
const ART=/^(وال|بال|فال|كال|لل|ال)(?=[ء-ي]{2,})/;
const BASE='kunuz/sohbah/';
const SOH={idx:null,idxP:null,txt:{},got:{},fx:{},tn:null,last:null,
  async index(){if(this.idx) return this.idx; if(!this.idxP) this.idxP=fetch(BASE+'index.json').then(r=>{if(!r.ok) throw new Error('sohbah index'); return r.json()}).then(j=>(this.idx=j)).catch(e=>{this.idxP=null; throw e}); return this.idxP},
  shard(s){return this.txt[s]||(this.txt[s]=fetch(BASE+'t-'+String(s).padStart(3,'0')+'.json').then(r=>{if(!r.ok) throw new Error('sohbah shard'); return r.json()}).then(j=>(this.got[s]=j)).catch(e=>{delete this.txt[s]; throw e}))},
  async text(n){const I=await this.index(); return (await this.shard(Math.floor(n/I.per)))[n%I.per]||''},
  textNow(n){const I=this.idx; if(!I) return null; const g=this.got[Math.floor(n/I.per)]; return g?g[n%I.per]||'':null},
  fxs(s){return this.fx[s]||(this.fx[s]=fetch(BASE+'fx-'+String(s).padStart(2,'0')+'.json').then(r=>{if(!r.ok) throw new Error('sohbah word index'); return r.json()}).catch(e=>{delete this.fx[s]; throw e}))},
  async post(term){const I=await this.index(); const t=RE_ARW.test(term)?term.replace(ART,''):term, m=new Map(); const s=I.fx[[...t].slice(0,2).join('')]; if(s==null) return m; const F=await this.fxs(s);
    for(const w in F){if(!w.startsWith(t)) continue; let p=-1; for(const e of F[w].split(',')){const i=e.indexOf('.'); p+=parseInt(i<0?e:e.slice(0,i),36); m.set(p,(m.get(p)||0)+(i<0?1:parseInt(e.slice(i+1),36)))}} return m},
  async searchFull(q,k){k=k||8; const I=await this.index(); const terms=qterms(q); if(!terms.length) return []; if(!this.tn) this.tn=I.items.map(x=>bn(x[0]));
    const P=await Promise.all(terms.map(t=>this.post(t))); const res=[];
    for(let n=0;n<I.n;n++){const T=this.tn[n]; let s=0,hit=0; terms.forEach((w,j)=>{const c=P[j].get(n)||0,m=Math.min(8,c),inT=T.includes(w); if(c||inT) hit++; s+=(m?1+Math.log(m):0)+(inT?2:0)}); if(s>0) res.push([hit>=terms.length?1:0,s,n])}
    res.sort((a,b)=>b[0]-a[0]||b[1]-a[1]); this.last={q,terms,P}; return res.slice(0,k).map(r=>r[2])},
  hits(n){const L=this.last; if(!L) return ''; return L.terms.map((t,j)=>{const c=L.P[j].get(n)||0; return c?t+' ×'+c:''}).filter(Boolean).join(' · ')}};
window.kzSOH=SOH;

/* ── per-viewer state (this device) ── */
const LS={get(k,d){try{const v=localStorage.getItem('sh:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('sh:'+k,JSON.stringify(v))}catch(e){}}};
const SH=Object.assign({q:'',full:0,last:null,fs:1.02,kept:0},LS.get('st',{}));
const save=()=>LS.set('st',SH);
let KEPT=LS.get('kept',{}), RECENT=LS.get('recent',[]), POS=LS.get('pos',{});
let PEND=false, CUR=null, TERMS=[], FIND='', FI=0, RES=null, RID=0;
const setHash=h=>{try{history.replaceState(null,'','#'+h)}catch(e){}};
const isSoh=()=>window.kzShelf&&window.kzShelf()==='sohbah';

/* ── the view ── */
async function renderSohbah(){const rid=++RID; const v=document.getElementById('view');
  v.innerHTML=(window.kzShelfHTML?window.kzShelfHTML():'')+'<section class="box" id="shBox"><h2>Kunūz al-Dhikr · the Sohbahs <span class="ari" style="color:var(--gold)">الصحبة</span></h2><p class="empty" id="shLoad">Opening the list…</p></section>';
  if(window.kzWireShelf) window.kzWireShelf(v);
  let I; try{I=await SOH.index()}catch(e){const l=document.getElementById('shLoad'); if(l){l.innerHTML='The sohbah list did not load. <button class="more" id="shRetry">Try again</button>'; document.getElementById('shRetry').onclick=renderSohbah} return}
  if(rid!==RID||tab!=='read'||!isSoh()) return; if(!SOH.tn) SOH.tn=I.items.map(x=>bn(x[0]));
  const box=document.getElementById('shBox');
  box.innerHTML='<h2>Kunūz al-Dhikr · the Sohbahs <span class="ari" style="color:var(--gold)">الصحبة</span></h2><p class="meta">Mawlana Shaykh Nāẓim al-Ḥaqqānī, 1979–2013: the '+I.n.toLocaleString()+' sohbahs Kunūz al-Dhikr carries from DhikrNotes, every word searchable. Type to find a title; press Enter or “Search every word” to search inside all of them.</p>'+
    '<div class="shbar"><div class="shrow"><label for="shQ" hidden>Search the sohbahs</label><input id="shQ" type="search" dir="auto" placeholder="Titles as you type · Enter searches every word: patience, rabita, Mahdi, صبر…" value="'+esc(SH.q)+'" autocomplete="off"><button class="shtg pri" id="shFull">Search every word</button><button class="shtg" id="shRand">Open one at random</button></div>'+
    '<div class="shrow"><button class="shtg" id="shKept" aria-pressed="'+!!SH.kept+'">☆ Kept <span class="num" id="shKn">'+Object.keys(KEPT).length+'</span></button><span class="meta" id="shSt" role="status"></span></div>'+
    (RECENT.length?'<div class="shrec" aria-label="Recently read"><span class="meta" style="flex:none;align-self:center">Recently read:</span>'+RECENT.slice(0,8).map(n=>'<button class="shtg" data-sho="'+n+'" title="'+esc(I.items[n][0])+'">'+esc(I.items[n][0])+'</button>').join('')+'</div>':'')+
    '</div><div class="shgrid"><div class="shlist" id="shList" role="list"></div><div class="shread" id="shRead"><p class="meta">Choose a sohbah to read it here.</p></div></div>'+
    '<p class="meta">Source: the sohbahs of Mawlana Shaykh Nāẓim as transcribed and carried in Kunūz al-Dhikr (from DhikrNotes). The words are his teaching as transcribed; Qurʾān references named in a sohbah are read from the muṣḥaf and checked here.</p>';
  const q=document.getElementById('shQ');
  const titles=()=>{SH.full=0; save(); const t=qterms(SH.q); TERMS=t; RES=null; let ns=I.items.map((x,n)=>n).filter(n=>!t.length||t.every(w=>SOH.tn[n].includes(w))); if(SH.kept) ns=ns.filter(n=>KEPT[n]);
    list(ns,false); document.getElementById('shSt').textContent=SH.kept?ns.length+' kept':SH.q.trim()?ns.length+' title'+(ns.length===1?'':'s')+' match · “Search every word” looks inside every sohbah':I.n.toLocaleString()+' sohbahs'};
  const full=async()=>{const s=SH.q.trim(); if(!s) return; const b=document.getElementById('shFull'); b.disabled=true; document.getElementById('shSt').textContent='Searching every word of every sohbah…';
    let ns; try{ns=await SOH.searchFull(s,40)}catch(e){if(rid===RID) document.getElementById('shSt').textContent='The sohbahs could not be searched just now. Try again.'; b.disabled=false; return}
    if(rid!==RID||!document.getElementById('shList')) return; SH.full=1; save(); TERMS=qterms(s); RES=ns; if(SH.kept) ns=ns.filter(n=>KEPT[n]);
    list(ns,true); document.getElementById('shSt').textContent=ns.length+' best match'+(ns.length===1?'':'es')+' for “'+s+'” in the words of every sohbah'; b.disabled=false};
  let tm; q.addEventListener('input',e=>{SH.q=e.target.value; clearTimeout(tm); tm=setTimeout(titles,160)});
  q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault(); full()}};
  document.getElementById('shFull').onclick=full;
  document.getElementById('shRand').onclick=()=>openS(Math.floor(Math.random()*I.n),true);
  document.getElementById('shKept').onclick=e=>{SH.kept=SH.kept?0:1; save(); e.currentTarget.setAttribute('aria-pressed',String(!!SH.kept)); if(SH.full&&RES){let ns=SH.kept?RES.filter(n=>KEPT[n]):RES; list(ns,true)} else titles()};
  box.addEventListener('click',e=>{const o=e.target.closest('[data-sho]'); if(o){e.preventDefault(); openS(+o.dataset.sho,true)}});
  if(SH.full&&SH.q.trim()) full(); else titles();
  const want=CUR!=null?CUR:SH.last; if(want!=null) openS(want,PEND); PEND=false;
}
let SXO=null;
function list(ns,full){const I=SOH.idx, el=document.getElementById('shList'); if(!el) return;
  el.innerHTML=ns.slice(0,200).map(n=>'<button class="shit" role="listitem" data-sho="'+n+'" aria-current="'+(n===CUR)+'"><span class="t">'+(KEPT[n]?'<span style="color:var(--gold)">★ </span>':'')+hlq(I.items[n][0],TERMS)+'</span><span class="m"><span>#'+(n+1)+'</span><span>'+Math.max(1,Math.round(I.items[n][1]/1000))+'k chars</span>'+(full&&SOH.hits(n)?'<span class="hits">'+esc(SOH.hits(n))+'</span>':'')+'</span>'+(full?'<span class="x" data-sx="'+n+'">Opening the passage…</span>':'')+'</button>').join('')+(ns.length>200?'<p class="meta">Showing the first 200 of '+ns.length+'. Add a word to narrow it.</p>':'')||'<p class="empty">'+(SH.kept?'Nothing kept yet — ☆ keep a sohbah while reading it.':'No titles match. Try “Search every word”.')+'</p>';
  if(full) excerpts(el)}
/* a result's passage loads only when it scrolls into view (B's sohExcerpts) */
function excerpts(root){try{SXO&&SXO.disconnect()}catch(e){} const els=[...root.querySelectorAll('[data-sx]')]; if(!els.length) return; const terms=TERMS;
  const fill=el=>{const n=+el.dataset.sx; el.removeAttribute('data-sx'); SOH.text(n).then(t=>{if(document.contains(el)) el.innerHTML=snippet(t.slice(t.indexOf('\n')+1),terms,220)}).catch(()=>{el.textContent=''})};
  if(!('IntersectionObserver' in window)){els.slice(0,6).forEach(fill); return}
  SXO=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){SXO.unobserve(x.target); fill(x.target)}}),{root:root.scrollHeight>root.clientHeight?root:null}); els.forEach(el=>SXO.observe(el))}

/* ── the reader ── */
function paras(t){const lines=String(t).split(/\n+/); return lines.slice(lines[0]&&lines.length>1?1:0).map(x=>x.trim()).filter(Boolean)}
async function openS(n,scroll){const I=SOH.idx||await SOH.index(); n=Math.max(0,Math.min(I.n-1,n)); if(n!==CUR){FIND=''; FI=0} CUR=n; SH.last=n; save();
  RECENT=[n,...RECENT.filter(x=>x!==n)].slice(0,12); LS.set('recent',RECENT);
  document.querySelectorAll('#shList .shit').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.sho===n)));
  setHash('read/sohbah/'+(n+1)); const box=document.getElementById('shRead'); if(!box) return;
  box.innerHTML='<div class="shcard"><span class="meta">Sohbah '+(n+1)+' of '+I.n.toLocaleString()+'</span><h3>'+esc(I.items[n][0])+'</h3><p class="empty">Opening…</p></div>';
  let t; try{t=await SOH.text(n)}catch(e){if(CUR===n&&document.getElementById('shRead')) box.innerHTML='<div class="shcard"><h3>'+esc(I.items[n][0])+'</h3><p class="meta">This sohbah could not load.</p><button class="shtg" id="shAgain">Try again</button></div>'; const a=document.getElementById('shAgain'); if(a) a.onclick=()=>openS(n,scroll); return}
  if(CUR!==n||!document.getElementById('shRead')) return;
  const P=paras(t), refs=window.kzQrefs?window.kzQrefs(t):[], on=!!KEPT[n], canTts=typeof tts!=='undefined'&&tts;
  box.innerHTML='<div class="shcard"><div class="shrow" style="justify-content:space-between"><span class="meta">Sohbah '+(n+1)+' of '+I.n.toLocaleString()+' · '+P.length+' paragraphs · about '+Math.max(1,Math.round(t.split(/\s+/).length/200))+' min</span><span class="shrow"><button class="shtg" data-sho="'+(n-1)+'"'+(n?'':' disabled')+'>← Previous</button><button class="shtg" data-sho="'+(n+1)+'"'+(n<I.n-1?'':' disabled')+'>Next →</button></span></div><h3>'+esc(I.items[n][0])+'</h3>'+
    '<div class="shtools"><label for="shF" hidden>Find in this sohbah</label><input id="shF" type="search" placeholder="Find in this sohbah" value="'+esc(FIND)+'" autocomplete="off"><button class="shtg" id="shFp" aria-label="Previous match">‹</button><span class="meta" id="shFn"></span><button class="shtg" id="shFx" aria-label="Next match">›</button><button class="shtg" id="shAm" aria-label="Smaller text">A−</button><button class="shtg" id="shAp" aria-label="Larger text">A+</button><button class="shtg" id="shK" aria-pressed="'+on+'">'+(on?'★ kept':'☆ keep')+'</button>'+(canTts?'<button class="shtg" id="shL">▶ English only</button>':'')+'<button class="shtg" id="shAsk">✦ Ask the Ustādh about this</button></div><div class="shprog" aria-hidden="true"><i id="shPr"></i></div>'+
    (refs.length?'<div><div class="meta">The Qurʾān it names — tap to read the āya from the muṣḥaf</div><div class="shrow">'+refs.map(r=>'<button class="shtg" data-shq="'+r.k+'">Q '+r.k+'</button>').join('')+'</div><div id="shQv" style="display:grid;gap:6px"></div></div>':'')+
    '<article class="shart" id="shArt" lang="en">'+P.map(p=>'<p>'+arSpan(hlq(p,TERMS))+'</p>').join('')+'</article><div class="shrow" style="justify-content:space-between"><button class="shtg" data-sho="'+(n-1)+'"'+(n?'':' disabled')+'>← Previous</button><span class="meta" id="shMsg"></span><button class="shtg" data-sho="'+(n+1)+'"'+(n<I.n-1?'':' disabled')+'>Next →</button></div></div>';
  document.documentElement.style.setProperty('--shfs',SH.fs+'rem');
  const art=document.getElementById('shArt');
  document.getElementById('shAm').onclick=()=>{SH.fs=Math.max(.86,+(SH.fs-.08).toFixed(2)); save(); document.documentElement.style.setProperty('--shfs',SH.fs+'rem')};
  document.getElementById('shAp').onclick=()=>{SH.fs=Math.min(1.5,+(SH.fs+.08).toFixed(2)); save(); document.documentElement.style.setProperty('--shfs',SH.fs+'rem')};
  document.getElementById('shK').onclick=e=>{if(KEPT[n]) delete KEPT[n]; else KEPT[n]=Date.now(); LS.set('kept',KEPT); const k=!!KEPT[n]; e.currentTarget.setAttribute('aria-pressed',String(k)); e.currentTarget.textContent=k?'★ kept':'☆ keep'; const c=document.getElementById('shKn'); if(c) c.textContent=Object.keys(KEPT).length};
  document.getElementById('shAsk').onclick=()=>(window.askUstadh||askAbout)('Teach me the main points of Mawlana Shaykh Nāẓim\'s sohbah "'+I.items[n][0]+'" (Kunūz sohbah #'+(n+1)+', index '+n+') and how to apply them; read it first with read_sohbah (index '+n+'). Then show what my other sources (the Iḥyāʾ, the awrād, the Teacher Library) say on the same subject, and check any Qurʾān reference against the muṣḥaf.');
  const L=document.getElementById('shL'); if(L) L.onclick=()=>{const s=englishOnly(P.join('\n')); tts.speak(s.slice(0,8000)).catch(()=>{const m=document.getElementById('shMsg'); if(m) m.textContent='Read-aloud is not available here.'})};
  box.querySelectorAll('[data-shq]').forEach(b=>b.onclick=()=>showVerse(b));
  const fi=document.getElementById('shF'); let tf; fi.addEventListener('input',e=>{FIND=e.target.value; clearTimeout(tf); tf=setTimeout(()=>find(P,true),200)}); fi.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault(); step(e.shiftKey?-1:1)}};
  document.getElementById('shFp').onclick=()=>step(-1); document.getElementById('shFx').onclick=()=>step(1);
  if(FIND) find(P,false); else document.getElementById('shFn').textContent='';
  // place kept per sohbah; the bar follows the reading
  const onScroll=()=>{const a=document.getElementById('shArt'); if(!a){window.removeEventListener('scroll',onScroll); return} const r=a.getBoundingClientRect(), h=Math.max(1,r.height-innerHeight*.6), f=Math.min(1,Math.max(0,-r.top/h)); const pr=document.getElementById('shPr'); if(pr) pr.style.width=Math.round(f*100)+'%'; if(CUR===n){POS[n]=+f.toFixed(3); clearTimeout(onScroll.t); onScroll.t=setTimeout(()=>LS.set('pos',POS),400)}};
  window.removeEventListener('scroll',window._shScroll||(()=>{})); window._shScroll=onScroll; window.addEventListener('scroll',onScroll,{passive:true});
  const m=TERMS.length&&art.querySelector('mark');
  if(m&&scroll) setTimeout(()=>m.scrollIntoView({block:'center',behavior:'smooth'}),40);
  else if(scroll){const pos=POS[n]; if(pos>0.02&&pos<0.98){const r=art.getBoundingClientRect(); window.scrollTo({top:window.scrollY+r.top+(r.height-innerHeight*.6)*pos,behavior:'auto'})} else box.scrollIntoView({block:'start',behavior:'smooth'})}
}
/* Arabic runs in the English text set in the Arabic face */
function arSpan(h){return h.replace(/([؀-ۿ][؀-ۿً-ٰ\s]*[؀-ۿً-ٰ]|[؀-ۿ])/g,'<span class="ari" lang="ar">$1</span>')}
function find(P,jump){const art=document.getElementById('shArt'), out=document.getElementById('shFn'); if(!art) return; const t=qterms(FIND); const use=t.length?t:TERMS;
  art.innerHTML=P.map(p=>'<p>'+arSpan(hlq(p,use))+'</p>').join(''); const ms=[...art.querySelectorAll('mark')];
  if(!t.length){out.textContent=''; return} FI=Math.min(FI,Math.max(0,ms.length-1)); out.textContent=ms.length?(FI+1)+' / '+ms.length:'not found'; if(ms.length){ms[FI].classList.add('on'); if(jump) ms[FI].scrollIntoView({block:'center',behavior:'smooth'})}}
function step(d){const art=document.getElementById('shArt'); if(!art) return; const ms=[...art.querySelectorAll('mark')]; if(!ms.length) return; ms[FI]&&ms[FI].classList.remove('on'); FI=(FI+d+ms.length)%ms.length; ms[FI].classList.add('on'); ms[FI].scrollIntoView({block:'center',behavior:'smooth'}); const out=document.getElementById('shFn'); if(out) out.textContent=(FI+1)+' / '+ms.length}
async function showVerse(btn){const k=btn.dataset.shq, out=document.getElementById('shQv'); if(!out) return; const m=/^(\d+):(\d+)(?:-(\d+))?$/.exec(k); const s=+m[1],a=+m[2],b=+(m[3]||m[2]);
  if(out.dataset.k===k){out.innerHTML=''; out.dataset.k=''; return} out.dataset.k=k; out.innerHTML='<p class="empty">Reading Q '+k+' from the muṣḥaf…</p>';
  let A=[]; try{A=window.hqQuran?await window.hqQuran(s,a,b):[]}catch(e){out.innerHTML='<p class="empty">The Qurʾān text did not load. Reload to try again.</p>'; return}
  if(out.dataset.k!==k) return; if(!A.length){out.innerHTML='<p class="fnd">Q '+esc(k)+' is not an āya of the muṣḥaf — the reference in the transcript may be mistyped.</p>'; return}
  out.innerHTML=A.map(x=>{const ab=abjad(x.ar,false); return '<div class="shq"><div class="vh"><span class="k">Q '+s+':'+x.a+'</span><span class="shab">abjad '+ab.total+' · '+ab.letters+' letters</span></div><div class="ar" lang="ar" dir="rtl">'+esc(x.ar)+'</div>'+(x.tr?'<p class="tl" lang="ar-Latn">'+esc(x.tr)+'</p>':'')+(x.en?'<p style="margin:0">'+esc(x.en)+' <span class="meta">(Pickthall)</span></p>':'')+'</div>'}).join('')+'<p class="meta">Tanzil Uthmani text, copied from the Iḥyāʾ Engine; abjad of the whole āya as written there (Mashriqī; the small dagger alif is not counted).</p>'}

function openSohbah(n,terms){if(terms) {TERMS=terms; FIND=''} CUR=n; if(window.kzSetShelf) window.kzSetShelf('sohbah');
  if(tab!=='read'||!document.getElementById('shRead')){PEND=true; tab='read'; render(); window.scrollTo(0,0); return} openS(n,true)}
window.kzRenderSohbah=async function(){await renderSohbah(); if(CUR==null&&SH.last==null) setHash('read/sohbah')};
window.kzOpenSohbah=openSohbah;

/* ── Ask: search every word, open a sohbah ── */
if(typeof AITOOLS!=='undefined'){
  AITOOLS.push({name:'search_sohbahs_fulltext',description:'Search EVERY WORD of the 2,302 sohbahs of Mawlana Shaykh Nāẓim (Kunūz al-Dhikr) through their prebuilt word index, ranked as Kunūz ranks them (sohbahs holding all the words first). Returns up to 10 {index, title, counts of each word, passage around the first match}. Then read_sohbah with the index and the same query for the full passages.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query']},
    execute:async(i)=>{prog('Searching every word of the sohbahs: '+i.query); const ns=await SOH.searchFull(String(i.query||''),10); const terms=qterms(String(i.query||'')); const out=[];
      for(const n of ns){let t=''; try{t=await SOH.text(n)}catch(e){} out.push({index:n,title:SOH.idx.items[n][0],counts:SOH.hits(n),passage:snippet(t.slice(t.indexOf('\n')+1),terms,500).replace(/<\/?mark>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')})}
      return {total_ranked:ns.length,results:out}}},
   {name:'open_sohbah',description:'Open a sohbah for Al in Read → Kunūz · Sohbahs by its index (from find_sohbahs or search_sohbahs_fulltext), optionally marking some words in it.',inputSchema:{type:'object',properties:{index:{type:'number'},words:{type:'string'}},required:['index']},
    execute:async(i)=>{const I=await SOH.index(); const n=Math.round(Number(i.index)); if(!(n>=0&&n<I.n)) throw new Error('index out of range'); setTimeout(()=>openSohbah(n,i.words?qterms(i.words):null),400); return {opened:true,index:n,title:I.items[n][0]}}});
}
/* deep link on load: #read/sohbah or #read/sohbah/<n> (1-based, as B's #sohbahs-<n>) */
try{const m=/^#read\/sohbah(?:\/(\d+))?/.exec(location.hash); if(m) setTimeout(()=>{if(m[1]) openSohbah(+m[1]-1,null); else {if(window.kzSetShelf) window.kzSetShelf('sohbah'); tab='read'; render()}},0)}catch(e){}
if(tab==='read'&&isSoh()) render();
})();
