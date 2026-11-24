/* ===== Kunūz al-Dhikr inside the merged engine — port 6, part 7 (2026-11-22): the Maktaba.
   A vanilla-JS port of Kunūz al-Dhikr's maktaba() ("Books": the channel's 24 books read page by page) and kutub()
   ("Library": what is carried in full, the channel's images with a lightbox, the reading list, the 198 documents named on
   Telegram, the sohbah transcripts), reading B's own files copied here server-side: kunuz/library.json, kunuz/docs.json,
   kunuz/libb/*.wasm (each pack is a run of JPEG pages; library.json gives offset and length — B's pageURL, unchanged),
   kunuz/media/*.jpg and the image list in kunuz/practices.json. The two web editions B linked out to (Ḥizb al-Wiqāya,
   the Laṭāʾif codex) are carried as script-free copies (kunuz/html/*.html) and read inside the engine.
   Kept from B: books grouped by ṭarīqa, page by page with ← / → and a page number, the page's text (English and
   transliteration) beside the image, withheld pages as a notice only, the next page fetched ahead, deep links
   (B's #maktaba-<book>-<page> and #read/maktaba/<book>/<page>), the Library page and its document filter.
   Better than B: a search of every book's pages that opens at the page with the words marked, ☆ marks on any page and the
   reading place kept per book — both in the database so they follow Al across devices — a page strip, zoom (fit, full width,
   2×), swipe and arrow keys, reading bars on every book, the gallery with previous / next, "Ask the Ustādh about this page",
   and the books in the Ustādh's search (as in B) with tools to read and open a page.
   Decision 1: no machine voice for Arabic — "▶ English only" reads the page's English (englishOnly). ===== */
(function(){
'use strict';
const css=`
.mkbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.mkbar button{font:inherit;font-size:.86rem;min-height:38px;padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer}
.mkbar button[aria-pressed="true"]{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}
.mkbar .num{color:inherit;opacity:.75}
.mknav .mkg{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);padding:10px 9px 2px}
.mknav button .mkyr{display:block;height:3px;border-radius:2px;background:var(--line);margin-top:4px;overflow:hidden}
.mknav button .mkyr i{display:block;height:100%;background:var(--gold)}
.mkhead{display:grid;gap:3px;text-align:center;padding:4px 0 8px;border-bottom:1px solid color-mix(in srgb,var(--gold) 45%,var(--line))}
.mkhead h3{font-family:var(--f-head);font-weight:400;font-size:1.3rem;margin:0;text-wrap:balance}
.mkhead .eb{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.mkstrip{display:flex;gap:4px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:thin}
.mkstrip button{flex:none;font:inherit;font-family:var(--f-mono);font-size:.74rem;min-width:36px;min-height:32px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--muted);cursor:pointer;position:relative}
.mkstrip button[aria-current="true"]{border-color:var(--gold);background:var(--gold-soft);color:var(--ink);font-weight:600}
.mkstrip button.mk::after{content:"★";position:absolute;top:-7px;right:-3px;font-size:.62rem;color:var(--gold)}
.mkstrip button.w{color:var(--warn);border-style:dashed}
.mkpage{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:1000px){.mkpage.two{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:start}.mkpage.two .mktext{position:sticky;top:calc(var(--hdrH,110px) + 64px);max-height:calc(100vh - var(--hdrH,110px) - 90px);overflow:auto}}
.mkimg{overflow:auto;border-radius:10px;border:1px solid var(--line);background:#f7f3ea;padding:8px;min-height:240px;display:grid;place-items:start center;touch-action:pan-y pinch-zoom}
.mkimg img{display:block;width:100%;max-width:620px;height:auto;margin:0 auto;border-radius:4px;box-shadow:0 2px 10px -6px rgba(0,0,0,.5);background:#fff}
.mkimg.z-wide img{max-width:none}
.mkimg.z-2x img{width:200%;max-width:none}
.mkimg .empty{align-self:center}
.mktext{border:1px solid var(--line);border-radius:10px;padding:10px 14px;background:var(--panel);min-width:0}
.mktext summary{cursor:pointer;color:var(--muted);font-size:.85rem}
.mktext p{max-width:70ch;margin:.5em 0;font-size:var(--mkfs,1rem)}
.mktext p[lang=ar]{font-family:var(--aw-ar,var(--f-ar));font-size:calc(var(--mkfs,1rem)*1.35);text-align:right;line-height:1.9}
.mktext mark,.mkhit mark{background:var(--gold-soft);color:inherit;border-bottom:2px solid var(--gold)}
.mkheld{border-left:3px solid var(--warn);padding:10px 14px;background:color-mix(in srgb,var(--warn) 8%,transparent);border-radius:0 8px 8px 0}
.mked{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.mked iframe{display:block;width:100%;height:min(78vh,1100px);border:0;background:#fff}
.mkhit{font:inherit;text-align:left;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:8px 10px;cursor:pointer;display:grid;gap:2px;min-width:0;min-height:44px}
.mkhit:hover{border-color:var(--gold)}
.mkgal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.mkgal figure{margin:0;min-width:0;display:grid;gap:4px}
.mkgal button{padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--bg);cursor:zoom-in}
.mkgal img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
.mkgal figcaption{font-size:.8rem;line-height:1.35}
.mklb{position:fixed;inset:0;z-index:60;background:rgba(6,8,20,.9);display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:8px;padding:max(12px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));color:#f2e6c4}
.mklb[hidden]{display:none!important}
.mklb img{max-width:100%;max-height:100%;object-fit:contain;margin:auto;display:block;border-radius:6px;background:#fff}
.mklb .row{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}
.mklb button{font:inherit;min-height:40px;padding:6px 14px;border-radius:999px;border:1px solid rgba(242,230,196,.45);background:transparent;color:inherit;cursor:pointer}
.mkdoc{border-top:1px solid var(--line);padding:10px 0;display:grid;gap:4px;min-width:0}
.mkdoc .t{font-weight:600;overflow-wrap:anywhere}
.mkcols{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.mkcols{grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}
.mkcarry{display:grid;gap:8px}
.mkcarry button{font:inherit;text-align:left;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);padding:10px 12px;cursor:pointer;display:grid;gap:2px;min-height:44px}
.mkcarry button:hover{border-color:var(--gold)}
.mkcarry button b{font-family:var(--f-head);font-weight:400;font-size:1.02rem}
#mkBox a{color:var(--lapis);text-underline-offset:2px}#mkBox a:hover{color:var(--gold)}.mklb a{color:var(--gold-hi)}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ── data: B's files, copied here (B's paths gain the kunuz/ prefix) ── */
const KP=p=>'kunuz/'+p;
const JC={}; const jget=p=>JC[p]||(JC[p]=fetch(p).then(r=>{if(!r.ok) throw new Error(p); return r.json()}).catch(e=>{delete JC[p]; throw e}));
const LIB=()=>jget('kunuz/library.json'), DOCS=()=>jget('kunuz/docs.json'), PRAC=()=>jget('kunuz/practices.json');
/* B's pageURL: fetch the pack once, cut the page out of it */
const BUND={}, PURL={};
async function pageURL(r){const b=KP(r.b), key=b+':'+r.o; if(PURL[key]) return PURL[key];
  if(!BUND[b]) BUND[b]=fetch(b).then(x=>{if(!x.ok) throw new Error(b); return x.arrayBuffer()}).catch(e=>{delete BUND[b]; throw e});
  const buf=await BUND[b]; return PURL[key]=URL.createObjectURL(new Blob([buf.slice(r.o,r.o+r.l)],{type:'image/jpeg'}))}

/* ── B's normaliser (the same as kunuz/ustadh.js) ── */
const N_STRIP=/[̀-ًͯ-ٰٟۖ-ۭـʾʿʻʼ‘’'`´]/g;
const N_MAP={'ٱ':'ا','ة':'ه','ى':'ي','ک':'ك','ی':'ي','ھ':'ه','ہ':'ه','أ':'ا','إ':'ا','آ':'ا'};
const bn=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(N_STRIP,'').replace(/[ٱةىکیھہأإآ]/g,c=>N_MAP[c]);
const STOP=new Set(['the','and','of','to','in','is','for','on','al','wa']);
function qterms(q){const t=[...new Set(bn(q).split(/[^a-z0-9ء-ي]+/).filter(w=>w.length>1))]; const s=t.filter(w=>!STOP.has(w)); return s.length?s:t}
const NC=new Map(); const nch=c=>{let v=NC.get(c); if(v===undefined){v=bn(c); NC.set(c,v)} return v};
function nmap(text){let n=''; const map=[]; for(let i=0;i<text.length;i++){const c=nch(text[i]); for(let j=0;j<c.length;j++){n+=c[j]; map.push(i)}} return {n,map}}
function hl(text,terms){text=String(text==null?'':text); if(!terms||!terms.length) return esc(text); const {n,map}=nmap(text), R=[];
  for(const t of terms){let i=n.indexOf(t); while(i>-1){R.push([map[i],map[i+t.length-1]+1]); i=n.indexOf(t,i+t.length)}}
  if(!R.length) return esc(text); R.sort((a,b)=>a[0]-b[0]); let out='',p=0; for(const [a,b] of R){if(b<=p) continue; const s=Math.max(a,p); out+=esc(text.slice(p,s))+'<mark>'+esc(text.slice(s,b))+'</mark>'; p=b} return out+esc(text.slice(p))}
function snip(text,terms,len){len=len||220; text=String(text||'').replace(/\s+/g,' ').trim(); const {n,map}=nmap(text); let h=-1; for(const t of terms){const i=n.indexOf(t); if(i>-1&&(h<0||i<h)) h=i} h=h<0?0:map[h];
  let a=Math.max(0,h-70); if(a>0){const sp=text.indexOf(' ',a); if(sp>-1&&sp<a+25) a=sp+1} let b=Math.min(text.length,a+len); if(b<text.length){const sp=text.lastIndexOf(' ',b); if(sp>a+len*.6) b=sp}
  return (a>0?'… ':'')+hl(text.slice(a,b),terms)+(b<text.length?' …':'')}
const isAr=t=>{const a=(String(t).match(/[ء-يٱ-ۓ]/g)||[]).length,l=(String(t).match(/[A-Za-z]/g)||[]).length; return a>2&&(l<6||a>6*l)};
const TG=id=>'<a href="https://t.me/DhikrNotes/'+(+id)+'" target="_blank" rel="noopener">#'+(+id)+'</a>';   // the channel post a book or image came from (source citation)

/* ── state, on the device and in the database (kunuz/maktaba): marks are a union with remembered removals, places go to the latest ── */
const LS={get(k,d){try{const v=localStorage.getItem('mk:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('mk:'+k,JSON.stringify(v))}catch(e){}}};
const MK=Object.assign({view:'books',k:null,pg:{},pgT:{},marks:{},rm:{},z:'fit',fs:1,txt:1,q:''},LS.get('st',{}));
const save=()=>LS.set('st',MK);
let DB=null, dbTried=false, syncT=null;
async function db(){if(dbTried) return DB; dbTried=true; try{DB=await Promise.race([cuse('db'),new Promise(r=>setTimeout(()=>r(null),8000))])}catch(e){DB=null} return DB}
function mergeRec(a,b){const out={marks:{},rm:{},pg:{},pgT:{}};
  for(const s of [a,b]){for(const [k,t] of Object.entries(s.marks||{})) out.marks[k]=Math.max(out.marks[k]||0,t); for(const [k,t] of Object.entries(s.rm||{})) out.rm[k]=Math.max(out.rm[k]||0,t);
    for(const [k,t] of Object.entries(s.pgT||{})) if(!(out.pgT[k]>=t)){out.pgT[k]=t; out.pg[k]=(s.pg||{})[k]}}
  for(const k of Object.keys(out.marks)) if((out.rm[k]||0)>out.marks[k]) delete out.marks[k];
  return out}
async function sync(push){const d=await db(); if(!d) return; const ref=d.doc('kunuz/maktaba');
  try{const s=await ref.get(); const rem=s.exists&&s.data()&&s.data().json?JSON.parse(s.data().json):{}; const m=mergeRec(MK,rem);
    const before=JSON.stringify([MK.marks,MK.pg]); Object.assign(MK,m); save();
    if(push||JSON.stringify(m)!==JSON.stringify(mergeRec(rem,{}))) await ref.set({json:JSON.stringify(m),updated:new Date().toISOString()});
    if(before!==JSON.stringify([MK.marks,MK.pg])&&tab==='read'&&window.kzShelf&&window.kzShelf()==='maktaba') renderMaktaba()}catch(e){}}
const later=()=>{clearTimeout(syncT); syncT=setTimeout(()=>sync(true),1500)};
function setPage(k,pi){MK.pg[k]=pi; MK.pgT[k]=Date.now(); save(); later()}
function toggleMark(key){if(MK.marks[key]){delete MK.marks[key]; MK.rm[key]=Date.now()} else {MK.marks[key]=Date.now(); delete MK.rm[key]} save(); later(); return !!MK.marks[key]}
const setHash=h=>{try{history.replaceState(null,'','#'+h)}catch(e){}};

let JUMP=null, RID=0, LBI=null;
/* ── the page ── */
async function renderMaktaba(){const rid=++RID; const v=document.getElementById('view'); const J=JUMP; JUMP=null;
  v.innerHTML=(window.kzShelfHTML?window.kzShelfHTML():'')+'<section class="box" id="mkBox"><h2>Kunūz al-Dhikr · the Maktaba <span class="ari" style="color:var(--gold)">المكتبة</span></h2><p class="meta">The channel\'s books, read page by page as Kunūz al-Dhikr carries them — page images with their English and transliteration — and the Library: what is carried in full, the channel\'s images, the reading list and every document named on DhikrNotes. Possession of a text is not idhn.</p><div class="mkbar" role="group" aria-label="View">'+[['books','Books'],['library','Library'],['marks','My marks']].map(([k,l])=>'<button data-mkv="'+k+'" aria-pressed="'+(MK.view===k)+'">'+l+(k==='marks'?' <span class="num">'+Object.keys(MK.marks).length+'</span>':'')+'</button>').join('')+'</div><div class="tools"><label for="mkQ" hidden>Find in the books</label><input id="mkQ" type="search" placeholder="Find in every book: Wiqāya, laṭāʾif, ṣalawāt, Jaʿfariyya…" autocomplete="off" value="'+esc(MK.q||'')+'"></div><div id="mkHits"></div><div id="mkBody"><p class="empty">Opening the books…</p></div></section><div class="mklb" id="mkLb" hidden role="dialog" aria-modal="true" aria-label="Image"><div class="row"><span id="mkLbC" style="min-width:0;overflow-wrap:anywhere"></span><button id="mkLbX">Close</button></div><img id="mkLbI" alt=""><div class="row"><button id="mkLbP">← Previous</button><span id="mkLbN" class="num" style="color:inherit"></span><button id="mkLbN2">Next →</button></div></div>';
  if(window.kzWireShelf) window.kzWireShelf(v);
  v.querySelectorAll('[data-mkv]').forEach(b=>b.onclick=()=>{MK.view=b.dataset.mkv; save(); renderMaktaba()});
  let tq; document.getElementById('mkQ').addEventListener('input',e=>{MK.q=e.target.value; save(); clearTimeout(tq); tq=setTimeout(find,300)});
  let L; try{L=await LIB()}catch(e){if(rid===RID){const b=document.getElementById('mkBody'); if(b){b.innerHTML='<p class="empty">The books could not load. <button class="more" id="mkRetry">Try again</button></p>'; document.getElementById('mkRetry').onclick=renderMaktaba}} return}
  if(rid!==RID||!document.getElementById('mkBody')) return;
  if(MK.q) find();
  if(MK.view==='library') return library(rid);
  if(MK.view==='marks') return marks(L);
  books(L,J)}

/* Books: B's reader, with the strip, zoom, marks, text beside the image */
function books(L,J){const body=document.getElementById('mkBody');
  let B=L.find(b=>b.k===(J&&J.k||MK.k))||L[0]; MK.k=B.k; let pi=Math.max(0,Math.min(J&&J.pi!=null?J.pi:(+MK.pg[B.k]||0),B.pages.length-1)); save();
  const groups={}; L.forEach(b=>(groups[b.q]=groups[b.q]||[]).push(b));
  const kind=b=>b.mode==='img'?b.pages.length+' pp':b.mode==='html'?'edition · '+b.pages.length+' pp':'text · '+b.pages.length+' pp';
  const bar=b=>{const p=+MK.pg[b.k]; return Number.isFinite(p)&&MK.pgT[b.k]?Math.round((p+1)/b.pages.length*100):0};
  body.innerHTML='<div class="kbgrid"><nav class="kbnav mknav" aria-label="Books"><div class="meta" style="padding:0 9px 4px">'+L.length+' books from DhikrNotes</div>'+Object.entries(groups).map(([g,bs])=>'<div class="mkg">'+esc(g)+'</div>'+bs.map(b=>'<button data-mkb="'+esc(b.k)+'" aria-current="'+(b.k===B.k)+'"><span>'+esc(b.t)+'</span><span class="num">'+kind(b)+'</span><span class="mkyr" aria-hidden="true"><i style="width:'+bar(b)+'%"></i></span></button>').join('')).join('')+'</nav><div style="min-width:0;display:grid;gap:10px"><select class="kbsel" id="mkSel" aria-label="Book">'+Object.entries(groups).map(([g,bs])=>'<optgroup label="'+esc(g)+'">'+bs.map(b=>'<option value="'+esc(b.k)+'"'+(b.k===B.k?' selected':'')+'>'+esc(b.t)+' ('+kind(b)+')</option>').join('')+'</optgroup>').join('')+'</select><article id="mkRd" style="min-width:0;display:grid;gap:10px"></article></div></div>';
  const pick=k=>{MK.k=k; save(); renderMaktaba(); window.scrollTo(0,0)};
  body.querySelectorAll('[data-mkb]').forEach(b=>b.onclick=()=>pick(b.dataset.mkb)); document.getElementById('mkSel').onchange=e=>pick(e.target.value);
  const go=n=>{pi=Math.max(0,Math.min(B.pages.length-1,n)); draw(null); const r=document.getElementById('mkRd'); if(r) r.scrollIntoView({block:'start'})};
  function draw(J){const rd=document.getElementById('mkRd'); if(!rd) return; const p=B.pages[pi]; setPage(B.k,pi); setHash('read/maktaba/'+B.k+'/'+(pi+1));
    const key=B.k+':'+p.n, on=!!MK.marks[key], terms=J&&J.terms||null, nm=Object.keys(MK.marks).filter(k=>k.startsWith(B.k+':')).length;
    const ed=B.mode==='html'&&B.href;
    rd.innerHTML='<div class="mkhead"><div class="eb">'+esc(B.q)+' · DhikrNotes '+TG(B.post)+'</div><h3>'+esc(B.t)+'</h3><div class="num">page '+(pi+1)+' of '+B.pages.length+(B.mode==='img'?' · page images':ed?' · edition carried here':' · text')+(nm?' · ★ '+nm:'')+'</div></div>'+
      (ed?'<div class="mkbar" role="group" aria-label="How to read"><button data-mked="1" aria-pressed="'+(MK.ed!==0)+'">The edition</button><button data-mked="0" aria-pressed="'+(MK.ed===0)+'">Page by page</button></div>':'')+
      (ed&&MK.ed!==0?edition(B):pageHTML(B,p,pi,on,terms));
    if(ed&&MK.ed!==0) wireEdition(B); else wirePage(B,p,pi,J);
    rd.querySelectorAll('[data-mked]').forEach(b=>b.onclick=()=>{MK.ed=+b.dataset.mked; save(); draw(null)});
    const nx=B.pages[pi+1]; if(nx&&nx.img) pageURL(nx.img).catch(()=>{})}
  function wirePage(B,p,pi0,J){const rd=document.getElementById('mkRd');
    ['mkPrev','mkPrev2'].forEach(id=>{const e=document.getElementById(id); if(e) e.onclick=()=>go(pi-1)}); ['mkNext','mkNext2'].forEach(id=>{const e=document.getElementById(id); if(e) e.onclick=()=>go(pi+1)});
    const n=document.getElementById('mkN'); if(n) n.onchange=e=>go((+e.target.value||1)-1);
    rd.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>go(+b.dataset.pg));
    const cur=rd.querySelector('.mkstrip [aria-current="true"]'); if(cur) cur.scrollIntoView({block:'nearest',inline:'center'});
    const m=document.getElementById('mkMark'); if(m) m.onclick=()=>{const on=toggleMark(B.k+':'+p.n); m.setAttribute('aria-pressed',on); m.textContent=on?'★ Marked':'☆ Mark'; const s=rd.querySelector('.mkstrip [data-pg="'+pi+'"]'); if(s) s.classList.toggle('mk',on)};
    rd.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{MK.z=b.dataset.z; save(); rd.querySelectorAll('[data-z]').forEach(x=>x.setAttribute('aria-pressed',x===b)); const w=document.getElementById('mkImg'); if(w) w.className='mkimg z-'+MK.z});
    rd.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{MK.fs=Math.max(.85,Math.min(1.6,Math.round((MK.fs+.1*b.dataset.fs)*100)/100)); save(); rd.style.setProperty('--mkfs',MK.fs+'rem')}); rd.style.setProperty('--mkfs',MK.fs+'rem');
    const t=document.getElementById('mkTxt'); if(t) t.addEventListener('toggle',()=>{MK.txt=t.open?1:0; save()});
    const eng=document.getElementById('mkEng'); if(eng) eng.onclick=()=>{const s=englishOnly(p.x||''); const msg=document.getElementById('mkMsg'); if(!s.trim()){if(msg) msg.textContent='No English on this page.'; return} tts.speak(s.slice(0,6000)).catch(()=>{if(msg) msg.textContent='Read-aloud is not available here.'})};
    const ask=document.getElementById('mkAsk'); if(ask) ask.onclick=()=>(window.askUstadh||askAbout)('Explain page '+p.n+' of "'+B.t+'" (Kunūz al-Dhikr Maktaba, DhikrNotes #'+B.post+'): what it says, who composed the text, how it is recited in the ṭarīqa, and what my other sources say. Use read_maktaba_page with book "'+B.k+'" and page '+p.n+', and search_corpus.');
    if(p.img){pageURL(p.img).then(u=>{const im=document.getElementById('mkI'); if(!im||B.pages[pi]!==p) return; im.src=u; im.hidden=false; const l=document.getElementById('mkLoad'); if(l) l.remove()}).catch(()=>{const l=document.getElementById('mkLoad'); if(l) l.innerHTML='This page could not load. <button class="more" id="mkRe">Try again</button>'; const r=document.getElementById('mkRe'); if(r) r.onclick=()=>draw(null)});
      const w=document.getElementById('mkImg'); let x0=null; w.addEventListener('touchstart',e=>{if(e.touches.length===1&&MK.z==='fit') x0=e.touches[0].clientX},{passive:true}); w.addEventListener('touchend',e=>{if(x0==null) return; const dx=e.changedTouches[0].clientX-x0; x0=null; if(Math.abs(dx)>60) go(pi+(dx<0?1:-1))},{passive:true})}
    if(J&&J.terms){const mk=rd.querySelector('.mktext mark'); if(mk) setTimeout(()=>{mk.scrollIntoView({block:'center'})},120)}}
  KEYS=e=>{if(tab!=='read'||!window.kzShelf||window.kzShelf()!=='maktaba'||MK.view!=='books'||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')||!document.getElementById('mkRd')||!document.getElementById('mkLb').hidden) return; if(e.key==='ArrowRight'){e.preventDefault(); go(pi+1)} else if(e.key==='ArrowLeft'){e.preventDefault(); go(pi-1)}};
  draw(J)}
let KEYS=null; document.addEventListener('keydown',e=>{if(KEYS) KEYS(e)});

function pageHTML(B,p,pi,on,terms){const N=B.pages.length;
  const strip=N>1?'<div class="mkstrip" role="group" aria-label="Pages">'+B.pages.map((q,i)=>'<button data-pg="'+i+'" aria-current="'+(i===pi)+'" class="'+(MK.marks[B.k+':'+q.n]?'mk ':'')+(q.w?'w':'')+'" aria-label="Page '+q.n+(q.w?' (not carried)':'')+'">'+q.n+'</button>').join('')+'</div>':'';
  const tools='<div class="kbtools" role="toolbar" aria-label="Page"><button id="mkPrev"'+(pi?'':' disabled')+'>← Page</button><label class="num">page <input id="mkN" type="number" min="1" max="'+N+'" value="'+(pi+1)+'" style="width:64px"> of '+N+'</label><button id="mkNext"'+(pi<N-1?'':' disabled')+'>Page →</button><button id="mkMark" aria-pressed="'+on+'">'+(on?'★ Marked':'☆ Mark')+'</button>'+(p.img?[['fit','Fit'],['wide','Full width'],['2x','2×']].map(([z,l])=>'<button data-z="'+z+'" aria-pressed="'+(MK.z===z)+'">'+l+'</button>').join(''):'')+(p.x?'<button data-fs="-1" aria-label="Smaller text">A−</button><button data-fs="1" aria-label="Larger text">A+</button>':'')+(tts&&p.x?'<button id="mkEng">▶ English only</button>':'')+'<span class="meta" id="mkMsg"></span></div>';
  const held=p.w?'<div class="mkheld"><b>This page is not carried here.</b> Kunūz al-Dhikr never stored its image or its text, so there is nothing to show; the page is in the original PDF on Telegram ('+TG(B.post)+'). Send the PDF and it will be added whole, as printed.</div>':'';
  const img=p.img?'<div class="mkimg z-'+esc(MK.z)+'" id="mkImg"><p class="empty" id="mkLoad">Loading page '+p.n+'…</p><img id="mkI" alt="'+esc(B.t)+', page '+p.n+'" hidden></div>':'';
  const txt=p.x?'<details class="mktext" id="mkTxt"'+(MK.txt||!p.img||terms?' open':'')+'><summary>'+(p.img?'Text on this page (English and transliteration)':'Text')+'</summary>'+p.x.split(/\n+/).map(x=>'<p dir="auto"'+(isAr(x)?' lang="ar"':'')+'>'+(terms?hl(x,terms):esc(x))+'</p>').join('')+'</details>':(p.img&&!p.w?'<p class="meta">No text layer for this page in Kunūz: read it from the image.</p>':'');
  return strip+tools+held+'<div class="mkpage'+(img&&txt?' two':'')+'">'+img+txt+'</div><div class="awpager"><button class="more" id="mkPrev2"'+(pi?'':' disabled')+'>← Previous page</button><button class="more" id="mkAsk">✦ Ask the Ustādh about this page</button><button class="more pri" id="mkNext2"'+(pi<N-1?'':' disabled')+'>Next page →</button></div>'}

/* the two web editions, carried here without their scripts and read in place */
const ED={'hizb-al-wiqaya':'kunuz/html/hizb-al-wiqaya.html','lataif-codex':'kunuz/html/lataif-codex.html'};
function edition(B){const src=ED[B.k]; if(!src) return '<p class="empty">This edition is not carried.</p>';
  return '<div class="kbtools" role="toolbar" aria-label="Edition">'+(B.k==='hizb-al-wiqaya'?'<button id="mkTr" aria-pressed="'+(MK.edTr!==0)+'">Translation</button>':'')+'<button data-efs="-1" aria-label="Smaller">A−</button><button data-efs="1" aria-label="Larger">A+</button><span class="meta">Amin Patel\'s web edition, as Kunūz al-Dhikr carries it.</span></div><div class="mked"><iframe id="mkEd" title="'+esc(B.t)+'" src="'+src+'" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" loading="lazy"></iframe></div>'}
function wireEdition(B){const f=document.getElementById('mkEd'); if(!f) return; MK.efs=MK.efs||1;
  const apply=()=>{try{const d=f.contentDocument; if(!d||!d.body) return; let s=d.getElementById('mkInj'); if(!s){s=d.createElement('style'); s.id='mkInj'; d.head.appendChild(s)}
    s.textContent='.controls{display:none!important}.reveal{opacity:1!important;transform:none!important}html{zoom:'+MK.efs+'}';
    d.body.classList.toggle('hide-tr',MK.edTr===0)}catch(e){}};
  f.addEventListener('load',apply); apply();
  const tr=document.getElementById('mkTr'); if(tr) tr.onclick=()=>{MK.edTr=MK.edTr===0?1:0; save(); tr.setAttribute('aria-pressed',MK.edTr!==0); apply()};
  document.querySelectorAll('[data-efs]').forEach(b=>b.onclick=()=>{MK.efs=Math.max(.8,Math.min(1.5,Math.round((MK.efs+.1*b.dataset.efs)*10)/10)); save(); apply()})}

/* search: B's index entries for books (pages with more than 60 characters of text, never withheld) plus titles */
async function find(){const el=document.getElementById('mkHits'); if(!el) return; const q=(MK.q||'').trim(); if(!q){el.innerHTML=''; return}
  let L; try{L=await LIB()}catch(e){el.innerHTML='<p class="empty">The books did not load.</p>'; return} if((MK.q||'').trim()!==q||!document.getElementById('mkHits')) return;
  const r=searchBooks(L,q); el.innerHTML='<p class="meta">'+r.hits.length+' page'+(r.hits.length===1?'':'s')+' found'+(r.hits.length>40?' · the first 40 shown — add a word to narrow it':'')+' <button class="linkbtn" id="mkClr">clear</button></p><div style="display:grid;gap:6px">'+r.hits.slice(0,40).map((h,i)=>'<button class="mkhit" data-h="'+i+'"><span class="meta">'+esc(h.b.t)+' · p.'+h.p.n+'</span><span>'+(h.p.x?snip(h.p.x,r.terms,200):'<i>title</i>')+'</span></button>').join('')+'</div>';
  document.getElementById('mkClr').onclick=()=>{MK.q=''; save(); const i=document.getElementById('mkQ'); if(i) i.value=''; el.innerHTML=''};
  el.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{const h=r.hits[+b.dataset.h]; openMaktaba(h.b.k,h.i+1,r.terms)})}
function searchBooks(L,q){const terms=qterms(q); const hits=[]; if(!terms.length) return {terms,hits};
  for(const b of L){const tn=bn(b.t+' '+b.q); b.pages.forEach((p,i)=>{if(p.w) return; const x=p.x||''; const n=bn(x); let s=0,all=true; for(const t of terms){let c=0,j=n.indexOf(t); while(j>-1&&c<6){c++; j=n.indexOf(t,j+t.length)} if(c) s+=1+Math.log(c); else if(tn.includes(t)&&i===0) s+=.5; else all=false}
    if(all&&s>0&&(x.length>60||i===0)) hits.push({b,p,i,s})})}
  hits.sort((a,b)=>b.s-a.s); return {terms,hits}}

/* Library: B's kutub() */
async function library(rid){const body=document.getElementById('mkBody'); let D,P; try{[D,P]=await Promise.all([DOCS(),PRAC()])}catch(e){if(body) body.innerHTML='<p class="empty">The library could not load. <button class="more" id="mkRetry">Try again</button></p>'; const r=document.getElementById('mkRetry'); if(r) r.onclick=renderMaktaba; return}
  if(rid!==RID||!document.getElementById('mkBody')) return;
  const docs=D.slice().sort((a,b)=>b.last.localeCompare(a.last)), aw=docs.filter(d=>!d.sohbah), so=docs.filter(d=>d.sohbah), media=(P.media||[]), reading=(P.reading||[]);
  const card=d=>'<div class="mkdoc" data-dn="'+esc(bn(d.name+' '+(d.desc||'')))+'"><div class="t">📄 '+esc(d.name)+'</div><div class="meta">'+esc(d.size||'')+' · last posted '+esc(d.last)+' '+d.q.map(t=>'<span class="chip">'+esc(t)+'</span>').join(' ')+'</div>'+(d.desc?'<details><summary class="meta">Description</summary><div style="white-space:pre-wrap;font-size:.9rem">'+esc(d.desc)+'</div></details>':'')+'<div class="meta">On Telegram: '+d.posts.map(TG).join(' ')+'</div></div>';
  body.innerHTML='<div class="mkcols"><div style="min-width:0;display:grid;gap:14px">'+
    '<div><h3 class="akh">Carried in full inside this engine</h3><div class="mkcarry">'+[['naqshi','Naqshbandī awrād + Dalāʾil al-Khayrāt','Ḥizb Qudsiyya of Shāh Naqshband; the duʿās of Shaykh Sharafuddīn, Grandshaykh ʿAbdallāh and Mawlana Shaykh Nāẓim; the heavenly titles; the Mawlid; Madad; the whole Dalāʾil in eight aḥzāb.'],['qadiri','al-Ṣalāt al-Kubrā + Qādirī awrād','Durood Ghawthiyya, Basmala wird, Khamriyya, Ḥiṣār, Ḥizb al-Qahr, Ḥizb al-Naṣr, Chahel Kāf/Qāf, Names of the Ghawth, Kibrīt al-Aḥmar; the Kubrā in seven daily portions.'],['recite','Ḥizb al-Baḥr + Shādhilī aḥzāb','Iʿtiṣām, Baḥr with full Yā Sīn, Ikhtitām, Dāʾira, Ikhfāʾ, Barr, Naṣr, Mashīshiyya; the working book of 64 khawāṣṣ, every method as the edition prints it.'],['sharh','Sharḥ Ḥizb al-Baḥr','of Shāh Walī Allāh Dihlawī — 92 pages, English.'],['books','The 24 books of this Maktaba','page by page, under Books above.']].map(([k,t,d])=>'<button data-carry="'+k+'"><b>'+esc(t)+'</b><span class="meta">'+esc(d)+'</span></button>').join('')+'</div><p class="meta">Not carried in either engine: the Telegram-only PDFs listed below, which the cloud cannot open — attach any of them to extend the engine. The Iḥyāʾ Uṣūl al-Ḥikma is carried whole under Read → Iḥyāʾ · Kitāb.</p></div>'+
    '<div><h3 class="akh">From the channel\'s images <span class="num">('+media.length+')</span></h3><p class="meta">Posters and book pages with practices, transcribed into Practices &amp; the sacred year. Tap to enlarge.</p><div class="mkgal">'+media.map((m,i)=>'<figure><button data-img="'+i+'" aria-label="Enlarge: '+esc(m.c)+'"><img src="'+esc(KP(m.f))+'" alt="'+esc(m.c)+'" loading="lazy"></button><figcaption>'+esc(m.c)+' <span class="meta">'+TG(m.i)+'</span></figcaption></figure>').join('')+'</div></div>'+
    '<div><h3 class="akh">Reading list from the channel</h3><p class="meta">Books photographed or shared on DhikrNotes.</p>'+reading.map(r=>'<div class="mkdoc"><div><b>'+esc(r.t)+'</b> <span class="meta">— '+esc(r.a)+'</span></div><div class="meta">'+r.src.map(TG).join(' ')+'</div></div>').join('')+'</div>'+
    '<div><h3 class="akh">Awrād documents on Telegram <span class="num">('+aw.length+')</span></h3><div class="tools"><label for="mkDq" hidden>Filter documents</label><input type="search" id="mkDq" placeholder="Filter documents by name — e.g. wiqaya, salawat" autocomplete="off"></div><div id="mkDocs">'+aw.map(card).join('')+'</div><p class="empty" id="mkDnone" hidden>No document has that in its name or description.</p></div>'+
    '</div><aside style="min-width:0"><h3 class="akh">Sohbah transcripts <span class="num">('+so.length+')</span></h3><p class="meta">Mawlana Shaykh Mehmet ʿĀdil ar-Rabbānī, Fajr sohbahs, 2024–2026. The 2,302 sohbahs of Mawlana Shaykh Nāẓim read in full under Read → Kunūz · Sohbahs.</p>'+so.map(d=>'<div class="mkdoc"><span class="t" style="font-weight:500">'+esc(d.name)+'</span><span class="meta">'+d.posts.map(TG).join(' ')+'</span></div>').join('')+'</aside></div>';
  body.querySelectorAll('[data-carry]').forEach(b=>b.onclick=()=>{const k=b.dataset.carry; if(k==='books'){MK.view='books'; save(); renderMaktaba(); return} if(window.kzOpenAwrad) window.kzOpenAwrad(k,0)});
  body.querySelectorAll('[data-img]').forEach(b=>b.onclick=()=>lightbox(media,+b.dataset.img));
  body.querySelectorAll('.mkgal img').forEach(im=>im.onerror=()=>{const b=im.closest('button'); if(b) b.disabled=true; im.alt='Image unavailable'});
  document.getElementById('mkDq').oninput=e=>{const t=qterms(e.target.value); let n=0; body.querySelectorAll('#mkDocs .mkdoc').forEach(el=>{const ok=t.every(w=>el.dataset.dn.includes(w)); el.hidden=!ok; if(ok) n++}); document.getElementById('mkDnone').hidden=n>0}}
function lightbox(media,i){const lb=document.getElementById('mkLb'); if(!lb) return; LBI=i;
  const show=()=>{const m=media[LBI]; document.getElementById('mkLbI').src=KP(m.f); document.getElementById('mkLbI').alt=m.c; document.getElementById('mkLbC').innerHTML=esc(m.c)+' · DhikrNotes '+TG(m.i); document.getElementById('mkLbN').textContent=(LBI+1)+' / '+media.length};
  show(); lb.hidden=false; document.getElementById('mkLbX').focus();
  const close=()=>{lb.hidden=true; document.removeEventListener('keydown',kd)}; const step=d=>{LBI=(LBI+d+media.length)%media.length; show()};
  const kd=e=>{if(e.key==='Escape') close(); else if(e.key==='ArrowRight') step(1); else if(e.key==='ArrowLeft') step(-1)};
  document.addEventListener('keydown',kd); document.getElementById('mkLbX').onclick=close; document.getElementById('mkLbP').onclick=()=>step(-1); document.getElementById('mkLbN2').onclick=()=>step(1);
  lb.onclick=e=>{if(e.target===lb) close()}}

/* My marks */
function marks(L){const body=document.getElementById('mkBody'); const ks=Object.entries(MK.marks).sort((a,b)=>b[1]-a[1]);
  const rows=ks.map(([k])=>{const [bk,n]=k.split(':'); const b=L.find(x=>x.k===bk); if(!b) return ''; const i=b.pages.findIndex(p=>String(p.n)===n); if(i<0) return ''; const p=b.pages[i];
    return '<button class="mkhit" data-ob="'+esc(bk)+'" data-op="'+(i+1)+'"><span class="meta">'+esc(b.q)+' · '+esc(b.t)+' · p.'+esc(n)+'</span><span>'+esc((p.x||'(page image)').replace(/\s+/g,' ').slice(0,160))+'</span></button>'}).join('');
  body.innerHTML='<p class="meta">Pages you marked with ☆, newest first. They follow you to your other devices.</p><div style="display:grid;gap:6px">'+(rows||'<p class="empty">No marks yet. Open a book and tap ☆ Mark on a page.</p>')+'</div>';
  body.querySelectorAll('[data-ob]').forEach(b=>b.onclick=()=>openMaktaba(b.dataset.ob,+b.dataset.op))}

/* open a book at a page from anywhere: ('kabir',3), ('kabir-3'), with search terms to mark */
function openMaktaba(k,page,terms){if(typeof k==='string'&&page==null){const m=/^(.+)-(\d+)$/.exec(k); if(m){k=m[1]; page=+m[2]}}
  MK.view='books'; MK.k=k; save(); JUMP={k,pi:page!=null?Math.max(0,+page-1):null,terms:terms||null};
  if(window.kzSetShelf) window.kzSetShelf('maktaba'); if(tab!=='read'){tab='read'; render()} else renderMaktaba(); window.scrollTo(0,0)}
window.kzRenderMaktaba=()=>{renderMaktaba(); if(!dbTried) sync(false)};
window.kzOpenMaktaba=openMaktaba;
window.kzMaktaba={lib:LIB,search:async q=>searchBooks(await LIB(),q),pageURL,merge:mergeRec,state:()=>MK};

/* Ask: read or open a page (the Ustādh and the engine) */
if(typeof AITOOLS!=='undefined'){
  AITOOLS.push({name:'read_maktaba_page',description:'Read the text of one page of a book in the Kunūz Maktaba (the DhikrNotes channel\'s books: Shādhilī aḥzāb, Ḥizb al-Wiqāya, Duʿāʾ Sayfī, Jāliyat al-Akdār, al-Ṣalawāt al-Jaʿfariyya, the Kashkūl-i Kalīmī, Dhikr methods, the Laṭāʾif codex and more). Without book, lists the books with their keys; without page, lists the book\'s pages that carry text. Withheld pages return a notice only.',inputSchema:{type:'object',properties:{book:{type:'string'},page:{type:'number'}}},
    execute:async(i)=>{if(typeof prog==='function') prog('Reading the Maktaba'); const L=await LIB(); if(!i.book) return {books:L.map(b=>({key:b.k,title:b.t,tariqa:b.q,pages:b.pages.length,post:b.post}))};
      const b=L.find(x=>x.k===i.book)||L.find(x=>bn(x.t).includes(bn(i.book))); if(!b) throw new Error('no book "'+i.book+'"'); if(i.page==null) return {key:b.k,title:b.t,pages:b.pages.length,with_text:b.pages.filter(p=>p.x).map(p=>p.n)};
      const p=b.pages.find(x=>+x.n===+i.page); if(!p) throw new Error('no page '+i.page); if(p.w) return {title:b.t,page:p.n,not_carried:'Kunūz never stored this page; it is in the original PDF on Telegram (post '+b.post+')'};
      return {title:b.t,page:p.n,of:b.pages.length,text:(p.x||'(this page is an image without a text layer)').slice(0,12000),ref:b.t+' p.'+p.n+' (DhikrNotes #'+b.post+')'}}},
   {name:'open_maktaba',description:'Open a page of a Maktaba book in the reader (Read → Kunūz · Maktaba) for Al. book: the key from read_maktaba_page; words: optional words to mark on the page.',inputSchema:{type:'object',properties:{book:{type:'string'},page:{type:'number'},words:{type:'string'}},required:['book']},
    execute:async(i)=>{const L=await LIB(); const b=L.find(x=>x.k===i.book)||L.find(x=>bn(x.t).includes(bn(i.book))); if(!b) throw new Error('no book "'+i.book+'"'); setTimeout(()=>openMaktaba(b.k,+i.page||1,i.words?qterms(i.words):null),400); return {opened:true,book:b.k,page:+i.page||1}}});
}

/* Learn's "Still in the original engines" table was written before this port: the Maktaba now reads here */
new MutationObserver(()=>{if(tab!=='learn') return; document.querySelectorAll('#view td').forEach(td=>{if(td.dataset.mkfix||!/the Maktaba books/.test(td.innerHTML)) return; td.dataset.mkfix=1; td.innerHTML=td.innerHTML.replace(/the Maktaba books \(/,'(the Maktaba now reads in Read → Kunūz · Maktaba; ')})}).observe(document.getElementById('view'),{childList:true,subtree:true});

/* deep link on load: #read/maktaba/<book>/<page> or B's #maktaba-<book>-<page> */
try{let m=/^#read\/maktaba(?:\/([\w-]+?)(?:\/(\d+))?)?$/.exec(location.hash)||/^#maktaba(?:-([\w-]+?))?(?:-(\d+))?$/.exec(location.hash); if(m) setTimeout(()=>{if(m[1]) openMaktaba(m[1],m[2]?+m[2]:null); else {if(window.kzSetShelf) window.kzSetShelf('maktaba'); tab='read'; render()}},0)}catch(e){}
if(tab==='read'&&window.kzShelf&&window.kzShelf()==='maktaba') window.kzRenderMaktaba();
})();
