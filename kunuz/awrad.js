/* ===== Kunūz al-Dhikr inside the merged engine — port 6, part 2 (2026-11-17): the awrād reader.
   A vanilla-JS port of Kunūz al-Dhikr's awrad() and sharhReader() (index.html) with its section loader BK
   (books/meta.json + one file per section, copied here as kunuz/books/…), its block rendering (Arabic line with
   transliteration and English as one unit, numbered; headings, days, entries, notes, sheets), the Arabic / Transliteration /
   English switches, A−/A+, the choice of Arabic typeface, previous / next section, the day jumps of the Kubrā, and the
   search terms carried to the line they open. Sharḥ Ḥizb al-Baḥr and the Rev5 compilation read page by page, as in B.
   Better than B: the engine's abjad on any Arabic line (Mashriqī, by code), ☆ marks kept per line, a search inside the
   books that opens at the line, the runner and Ask open the text here, and the place is kept in the address.
   Decision 1: no machine voice for any Arabic or transliteration — "▶ English only" reads the English lines (englishOnly). ===== */
(function(){
'use strict';
const css=`
.awshelf{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.awshelf button{font:inherit;font-size:.86rem;padding:6px 14px;min-height:38px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer;display:inline-flex;gap:8px;align-items:baseline}
.awshelf button .ari{font-size:1.05rem;color:var(--gold)}
.awshelf button[aria-pressed="true"]{background:linear-gradient(180deg,var(--gold-hi),var(--gold));border-color:var(--gold-hi);color:#1a1405}.awshelf button[aria-pressed="true"] .ari{color:#1a1405}
.awbooks{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}
.awbooks button{flex:none;font:inherit;font-size:.84rem;padding:6px 12px;min-height:36px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);cursor:pointer;display:grid;text-align:left;gap:0}
.awbooks button small{color:var(--muted);font-size:.72rem}
.awbooks button[aria-pressed="true"]{border-color:var(--gold);background:var(--gold-soft);box-shadow:inset 0 -3px 0 var(--gold)}
.awnav button .tar{font-family:var(--f-ar);font-size:1.05rem;direction:rtl;text-align:right;color:var(--ink);display:block}
.awart{min-width:0;display:grid;gap:10px;--awfs:1.75rem}
.awhead{text-align:center;display:grid;gap:4px;padding:6px 0 4px;border-bottom:1px solid color-mix(in srgb,var(--gold) 45%,var(--line))}
.awhead .awar{font-family:var(--f-ar);font-size:clamp(1.6rem,6vw,2.3rem);color:var(--gold);line-height:1.5}
.awhead h3{font-family:var(--f-head);font-weight:400;font-size:1.3rem;margin:0;text-wrap:balance}
.awhead .eb{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.awtxt{display:grid}
.awu{padding:14px 2px;border-top:1px solid var(--line);display:grid;gap:4px;position:relative;min-width:0}
.awu:first-child{border-top:0}
.awu .ar{font-family:var(--aw-ar,var(--f-ar));font-size:var(--awfs);line-height:2.05;direction:rtl;text-align:right;overflow-wrap:anywhere}
.awu .tl{font-style:italic;color:var(--turq);margin:0;max-width:72ch}
.awu .en{margin:0;max-width:72ch}
.awu .awm{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.awvn{font-family:var(--f-mono);font-size:.72rem;color:var(--gold);border:1px solid color-mix(in srgb,var(--gold) 50%,transparent);border-radius:999px;padding:0 8px}
.awst{font:inherit;font-size:.9rem;line-height:1;border:0;background:none;color:var(--muted);cursor:pointer;padding:4px 6px;min-width:32px;min-height:32px}
.awst[aria-pressed="true"]{color:var(--gold)}
.awab{font-family:var(--f-mono);font-size:.72rem;background:var(--gold-soft);color:var(--gold);border-radius:999px;padding:1px 8px}
.awu.on{background:color-mix(in srgb,var(--gold-soft) 70%,transparent);border-radius:8px}
.awu.flash,.awp.flash{animation:awfl 2.2s ease-out}
@keyframes awfl{0%{background:var(--gold-soft)}100%{background:transparent}}
.awtxt.hide-ar .ar,.awtxt.hide-tl .tl,.awtxt.hide-en .en{display:none}
.awh{font-family:var(--f-head);font-size:1.15rem;margin:22px 0 4px;color:var(--ink)}
.awday{font-family:var(--f-head);font-size:1.3rem;color:var(--gold);margin:26px 0 4px;padding-top:10px;border-top:2px solid var(--gold);scroll-margin-top:calc(var(--hdrH,110px) + 70px)}
.awent{border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:8px 0;background:var(--bg);display:grid;gap:4px}
.awnote{border-left:3px solid var(--warn);padding:6px 12px;color:var(--muted);font-size:.92rem;margin:8px 0}
.awsheet{font-size:.92rem;color:var(--muted);border-left:3px solid var(--turq);padding:4px 12px;margin:8px 0}
.awp{max-width:72ch;margin:8px 0}
.awsrc{font-size:.8rem;color:var(--muted);border-top:1px solid var(--line);padding-top:10px;margin-top:10px}
.awpg .awp{white-space:pre-line}
.awfind{display:grid;gap:6px}
.awhit{font:inherit;text-align:left;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);padding:8px 10px;cursor:pointer;display:grid;gap:2px;min-width:0}
.awhit:hover{border-color:var(--gold)}
.awhit mark,.awtxt mark,.awpg mark{background:var(--gold-soft);color:inherit;border-bottom:2px solid var(--gold)}
.awpager{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ── the data: B's BK loader on the copied files (kunuz/books/meta.json + kunuz/books/<book>-<n>.json) ── */
const KZBK={meta:null,mp:null,p:{},allP:null,
  M(){return this.meta?Promise.resolve(this.meta):this.mp||(this.mp=fetch('kunuz/books/meta.json').then(r=>{if(!r.ok) throw new Error('kunuz/books/meta.json'); return r.json()}).then(m=>(this.meta=m)).catch(e=>{this.mp=null; throw e}))},
  async sec(k,si){const m=await this.M(); const s=m[k]&&m[k].sections[si]; if(!s) throw new Error('no such section'); if(s.blocks) return s; const key=k+'-'+si;
    return this.p[key]||(this.p[key]=fetch('kunuz/books/'+key+'.json').then(r=>{if(!r.ok) throw new Error('kunuz/books/'+key); return r.json()}).then(b=>{s.blocks=s.blocks||b; return s}).catch(e=>{delete this.p[key]; throw e}))},
  /* every section loaded: the same shape as Kunūz's books.json (used by the runner and the search) */
  all(){return this.allP||(this.allP=this.M().then(m=>Promise.all(Object.entries(m).flatMap(([k,B])=>B.sections.map((_,i)=>this.sec(k,i))))).then(()=>this.meta).catch(e=>{this.allP=null; throw e}))}};
window.KZBK=KZBK;
/* 2026-11-22, at Al's instruction: the classical litanies and their editions are shown whole, exactly as printed — nothing cut
   or softened. The four editor's lines of the Ḥizb al-Baḥr introduction that were withheld here from 2026-11-17 to 2026-11-22
   (blocks 3, 4, 39, 55 of recite-1) are shown again, and the seven working-book entries Kunūz itself had withheld (15, 19, 20,
   36, 41, 42, 54) are restored from the same edition (amori.ca/recite.html) with the compiler's own restrictions. held() stays
   so older callers keep working; it now holds nothing. */
const HELD={};
const held=(k,si,bi)=>{const h=HELD[k+'-'+si]; return h&&h[bi]||null};
window.kzAwHeld=held;
const XB={};
const xb=k=>XB[k]||(XB[k]=fetch('kunuz/'+k+'.json').then(r=>{if(!r.ok) throw new Error('kunuz/'+k+'.json'); return r.json()}).catch(e=>{delete XB[k]; throw e}));

/* ── Kunūz's own normaliser and highlighter (diacritics, ʿayn marks, tashkīl, hamza seats, tāʾ marbūṭa, alif maqṣūra) ── */
const N_STRIP=/[̀-ًͯ-ٰٟۖ-ۭـʾʿʻʼ‘’'`´]/g;
const N_MAP={'ٱ':'ا','أ':'ا','إ':'ا','آ':'ا','ة':'ه','ى':'ي','ک':'ك','ی':'ي','ھ':'ه','ہ':'ه'};
const kn=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(N_STRIP,'').replace(/[ٱأإآةىکیھہ]/g,c=>N_MAP[c]);
const STOP=new Set(['the','and','of','to','in','is','for','on','al','wa']);
function qterms(q){const t=[...new Set(kn(q).split(/[^a-z0-9ء-ي]+/).filter(w=>w.length>1))]; const s=t.filter(w=>!STOP.has(w)); return s.length?s:t}
const NC=new Map(); const nch=c=>{let v=NC.get(c); if(v===undefined){v=kn(c); NC.set(c,v)} return v};
function nmap(text){let n=''; const map=[]; for(let i=0;i<text.length;i++){const c=nch(text[i]); for(let j=0;j<c.length;j++){n+=c[j]; map.push(i)}} return {n,map}}
const RE_MARK=/[̀-ًͯ-ٰٟۖ-ۭ]/, RE_ARW=/[ء-ي]/;
function hlq(text,terms){text=String(text==null?'':text); if(!terms||!terms.length) return esc(text); const {n,map}=nmap(text), R=[];
  for(const t of terms){let i=n.indexOf(t); while(i>-1){let a=map[i],b=map[i+t.length-1]+1; while(b<text.length&&RE_MARK.test(text[b])) b++;
    if(RE_ARW.test(t)){while(a>0&&!/\s/.test(text[a-1])) a--; while(b<text.length&&!/\s/.test(text[b])) b++} R.push([a,b]); i=n.indexOf(t,i+t.length)}}
  if(!R.length) return esc(text); R.sort((x,y)=>x[0]-y[0]); let out='',p=0; for(const [a,b] of R){if(b<=p) continue; const s=Math.max(a,p); out+=esc(text.slice(p,s))+'<mark>'+esc(text.slice(s,b))+'</mark>'; p=b} return out+esc(text.slice(p))}
function snip(text,terms,len){len=len||220; text=String(text||'').replace(/\s+/g,' ').trim(); const {n,map}=nmap(text); let h=-1; for(const t of terms){const i=n.indexOf(t); if(i>-1&&(h<0||i<h)) h=i} h=h<0?0:map[h];
  let a=Math.max(0,h-60); if(a>0){const sp=text.indexOf(' ',a); if(sp>-1&&sp<a+25) a=sp+1} let b=Math.min(text.length,a+len); if(b<text.length){const sp=text.lastIndexOf(' ',b); if(sp>a+len*.6) b=sp}
  return (a>0?'… ':'')+hlq(text.slice(a,b),terms)+(b<text.length?' …':'')}
const isArText=t=>{const a=(String(t).match(/[ء-يٱ-ۓﭐ-﷿ﹰ-﻿]/g)||[]).length,l=(String(t).match(/[A-Za-z]/g)||[]).length; return a>2&&(l<6||a>6*l)};

/* ── state ── */
const LS={get(k,d){try{const v=localStorage.getItem('aw:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('aw:'+k,JSON.stringify(v))}catch(e){}}};
const AW=Object.assign({shelf:'kitab',bk:'naqshi',sec:{},show:{ar:1,tl:1,en:1},fs:1.75,font:'amiri',abj:0},LS.get('st',{}));
const awSave=()=>LS.set('st',AW);
let MARKS=LS.get('marks',{});            // {'naqshi-18:12':time}
let JUMP=null;                            // {bk,si,bi,terms}
const BOOKS=[['naqshi','Naqshbandī','Awrād & Dalāʾil al-Khayrāt'],['qadiri','Qādirī','al-Ṣalāt al-Kubrā'],['recite','Shādhilī','Ḥizb al-Baḥr & aḥzāb'],['sharh','Sharḥ','Ḥizb al-Baḥr, page by page'],['rev5','Rev5','the Qudsiyya in English']];
const AR_FONTS=[['amiri','Amiri','"Amiri"',''],['scheh','Scheherazade New','"Scheherazade New"','Scheherazade+New:wght@400;700'],['naskh','Noto Naskh Arabic','"Noto Naskh Arabic"','Noto+Naskh+Arabic:wght@400;700']];
function applyFont(){const f=AR_FONTS.find(x=>x[0]===AW.font)||AR_FONTS[0]; if(f[3]&&!document.getElementById('awf-'+f[0])){const l=document.createElement('link'); l.id='awf-'+f[0]; l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?family='+f[3]+'&display=swap'; document.head.appendChild(l)}
  document.documentElement.style.setProperty('--aw-ar',f[2]+',"Amiri","Traditional Arabic",serif')}
applyFont();
const setHash=h=>{try{history.replaceState(null,'','#'+h)}catch(e){}};

/* ── the Read tab's shelf: the Iḥyāʾ (Kitāb) or the Kunūz awrād ── */
const SHELF=[['kitab','Iḥyāʾ · Kitāb','إحياء'],['quran','Qurʾān','قرآن'],['awrad','Kunūz · Awrād','أوراد'],['diwan','Kunūz · Dīwān','ديوان'],['sohbah','Kunūz · Sohbahs','صحبة'],['maktaba','Kunūz · Maktaba','مكتبة']];   // maktaba: kunuz/maktaba.js (2026-11-22)
function shelfHTML(){return '<section class="box" id="rdShelf" style="gap:6px"><div class="awshelf" role="group" aria-label="Which book">'+SHELF.map(([k,l,a])=>'<button data-shelf="'+k+'" aria-pressed="'+(AW.shelf===k)+'"><span class="ari">'+a+'</span>'+l+'</button>').join('')+'</div></section>'}
function wireShelf(root){root.querySelectorAll('[data-shelf]').forEach(b=>b.onclick=()=>{AW.shelf=b.dataset.shelf; awSave(); if(typeof RD!=='undefined'&&RD) lastPg=RD.pg; renderRead(); window.scrollTo(0,0)})}
const kitabRender=renderRead;
let lastPg=(typeof RD!=='undefined'&&RD)?RD.pg:null;
function readTab(){
  if(typeof RD!=='undefined'&&RD&&RD.pg!==lastPg){lastPg=RD.pg; AW.shelf='kitab'; awSave()}   // a "Read p.X" from anywhere opens the book at that page
  if(AW.shelf==='quran'){if(window.qrRender) return window.qrRender(); view.innerHTML=shelfHTML()+'<section class="box"><p class="empty">Opening the Qurʾān…</p></section>'; wireShelf(view); return}   // ihya/quran.js (2026-11-22)
  if(AW.shelf==='awrad') return renderAwrad();
  if(AW.shelf==='diwan'&&window.kzRenderDiwan) return window.kzRenderDiwan();
  if(AW.shelf==='sohbah'&&window.kzRenderSohbah) return window.kzRenderSohbah();
  if(AW.shelf==='maktaba'){if(window.kzRenderMaktaba) return window.kzRenderMaktaba(); view.innerHTML=shelfHTML()+'<section class="box"><p class="empty">Opening the Maktaba…</p></section>'; wireShelf(view); return}
  setHash('read/kitab'); return kitabRender()}
renderRead=readTab; window.renderRead=readTab;
window.kzShelfHTML=shelfHTML; window.kzWireShelf=wireShelf; window.kzShelf=()=>AW.shelf; window.kzSetShelf=k=>{AW.shelf=k; awSave(); if(typeof RD!=='undefined'&&RD) lastPg=RD.pg};
/* the Kitāb redraws #view itself: keep the shelf at the top of the Read tab whatever drew it */
const view=document.getElementById('view');
new MutationObserver(()=>{if(tab!=='read'||AW.shelf!=='kitab') return; if(typeof RD!=='undefined'&&RD) lastPg=RD.pg; if(view.firstElementChild&&view.firstElementChild.id==='rdShelf') return; const old=document.getElementById('rdShelf'); if(old) old.remove(); view.insertAdjacentHTML('afterbegin',shelfHTML()); wireShelf(view)}).observe(view,{childList:true});

/* ── the reader ── */
async function renderAwrad(){
  const v=view; const J=JUMP; JUMP=null;
  const bk=BOOKS.some(b=>b[0]===AW.bk)?AW.bk:'naqshi';
  v.innerHTML=shelfHTML()+'<section class="box" id="awBox"><h2>Kunūz al-Dhikr · the awrād <span class="ari" style="color:var(--gold)">الأوراد</span></h2><p class="meta">The three litany books of Kunūz al-Dhikr — the Naqshbandī awrād with the whole Dalāʾil al-Khayrāt, the Qādirī awrād with al-Ṣalāt al-Kubrā, the Shādhilī aḥzāb with Ḥizb al-Baḥr — vowelled Arabic, transliteration and English line by line, and the Sharḥ of Ḥizb al-Baḥr and the Rev5 compilation page by page. No machine voice reads the Arabic or the transliteration; “English only” reads the English lines.</p><div class="awbooks" role="group" aria-label="Book">'+BOOKS.map(([k,a,b])=>'<button data-awb="'+k+'" aria-pressed="'+(k===bk)+'"><span>'+a+'</span><small>'+b+'</small></button>').join('')+'</div><div class="awfind"><div class="tools"><label for="awQ" hidden>Find in the awrād</label><input id="awQ" type="search" placeholder="Find in all five: Laṭīf, ṣalawāt, حسبنا, Friday…" autocomplete="off" value="'+esc(AW.q||'')+'"></div><div id="awHits"></div></div><div id="awBody"><p class="empty">Opening the awrād…</p></div></section>';
  wireShelf(v);
  v.querySelectorAll('[data-awb]').forEach(b=>b.onclick=()=>{AW.bk=b.dataset.awb; awSave(); renderAwrad()});
  let tq; document.getElementById('awQ').addEventListener('input',e=>{AW.q=e.target.value; awSave(); clearTimeout(tq); tq=setTimeout(awFind,300)}); if(AW.q) awFind();
  const body=document.getElementById('awBody');
  if(bk==='sharh'||bk==='rev5') return pageReader(bk,body,J);
  let m; try{m=await KZBK.M()}catch(e){body.innerHTML='<p class="empty">The awrād did not load. Reload the page to try again.</p>'; return} if(tab!=='read'||AW.shelf!=='awrad'||AW.bk!==bk) return;
  const B=m[bk]; let si=Math.max(0,Math.min(+(AW.sec[bk]||0),B.sections.length-1)); if(J&&J.bk===bk&&J.si!=null) si=J.si;
  body.innerHTML='<div class="kbgrid"><nav class="kbnav awnav" aria-label="Sections"><div class="meta" style="padding:0 9px 4px">'+esc(B.tariqa)+' · '+B.sections.length+' sections</div>'+B.sections.map((s,i)=>'<button data-si="'+i+'" aria-current="'+(i===si)+'">'+(s.ar?'<span class="tar" lang="ar">'+esc(s.ar)+'</span>':'')+'<span>'+esc((s.num&&s.num!=='·'?s.num+' · ':'')+s.title)+'</span></button>').join('')+'</nav><div style="min-width:0;display:grid;gap:10px"><select class="kbsel" id="awSel" aria-label="Section">'+B.sections.map((s,i)=>'<option value="'+i+'"'+(i===si?' selected':'')+'>'+esc((s.num&&s.num!=='·'?s.num+' · ':'')+s.title)+'</option>').join('')+'</select><article class="awart" id="awRd"></article></div></div>';
  const go=n=>{si=Math.max(0,Math.min(B.sections.length-1,n)); AW.sec[bk]=si; awSave(); body.querySelectorAll('[data-si]').forEach(x=>x.setAttribute('aria-current',+x.dataset.si===si)); const s=document.getElementById('awSel'); if(s) s.value=si; draw(null); const r=document.getElementById('awRd'); if(r) r.scrollIntoView({block:'start'})};
  body.querySelectorAll('[data-si]').forEach(b=>b.onclick=()=>go(+b.dataset.si));
  document.getElementById('awSel').onchange=e=>go(+e.target.value);
  async function draw(J){const rd=document.getElementById('awRd'); if(!rd) return; const s=B.sections[si];
    if(!s.blocks){const want=si; rd.innerHTML='<div class="awhead"><div class="eb">'+esc(B.title)+'</div><h3>'+esc(s.title)+'</h3></div><p class="empty" id="awLoad">Opening the text…</p>';
      try{await KZBK.sec(bk,si)}catch(e){const l=document.getElementById('awLoad'); if(l){l.innerHTML='This section could not load. <button class="more" id="awRetry">Try again</button>'; document.getElementById('awRetry').onclick=()=>draw(J)} return}
      if(si!==want||AW.bk!==bk||!document.getElementById('awRd')) return}
    if(B.sections[si+1]) KZBK.sec(bk,si+1).catch(()=>{});
    const terms=J&&J.terms||null, hx=t=>terms?hlq(t,terms):esc(t);
    const html=[]; let unit=null, bi=-1; const key=bk+'-'+si;
    const flush=()=>{if(!unit) return; const mk=key+':'+unit.bi, on=!!MARKS[mk]; const ab=AW.abj&&unit.ar?abjad(unit.ar,false):null;
      html.push('<div class="awu'+(on?' on':'')+'" data-bi="'+unit.bi+'"><div class="awm">'+(unit.v?'<span class="awvn">'+esc(unit.v)+'</span>':'')+(ab?'<span class="awab" title="Mashriqī abjad of the Arabic line, computed by the engine">abjad '+ab.total+' · '+ab.letters+' letters</span>':'')+'<span style="flex:1"></span><button class="awst" data-mk="'+mk+'" aria-pressed="'+on+'" aria-label="Mark this line">'+(on?'★':'☆')+'</button></div>'+unit.parts.join('')+'</div>'); unit=null};
    for(const b of s.blocks){bi++;
      const hd=held(bk,si,bi); if(hd){flush(); html.push('<p class="awnote" data-bi="'+bi+'">'+esc(hd)+' — its method is withheld here: a working aimed at another person is kept by title and source only.</p>'); continue}
      if(b.t==='ar'||((b.t==='p'||b.t==='li')&&isArText(b.x)&&!/[A-Za-z]{3}/.test(b.x))){flush(); unit={bi,v:b.v,ar:b.x,parts:['<div lang="ar" dir="rtl" class="ar">'+hx(b.x)+'</div>']}; continue}
      if(b.t==='tl'||b.t==='en'){if(!unit) unit={bi,parts:[]}; unit.parts.push('<p class="'+b.t+'"'+(b.t==='tl'?' lang="ar-Latn"':'')+'>'+hx(b.x)+'</p>'); continue}
      flush(); const at=html.length;
      if(b.t==='h') html.push('<div class="awh">'+esc(b.x)+'</div>');
      else if(b.t==='day') html.push('<div class="awday" id="awday-'+esc(String(b.x).split(' ')[0])+'">'+esc(b.x)+'</div>');
      else if(b.t==='entry') html.push('<div class="awent"><div class="chips">'+(b.id?'<span class="chip ih">'+esc(b.id)+'</span>':'')+(b.tags||[]).map(t=>'<span class="chip">'+esc(t)+'</span>').join('')+(b.withheld?'<span class="chip h">method withheld</span>':'')+'</div><div style="font-weight:600">'+esc(b.title||'')+'</div>'+(!b.withheld&&b.formula?'<p class="tl" style="margin:0;font-style:italic;color:var(--turq)">'+esc(b.formula)+'</p>':'')+(!b.withheld&&b.method?'<p style="margin:0">'+esc(b.method)+'</p>':'')+(b.lim?'<p class="awnote" style="margin:0">'+esc(b.lim)+'</p>':'')+(b.withheld?'<p class="meta" style="margin:0">Harm-directed or acts on a named third party. Kept by its purpose only; the tradition\'s condition stands — never against the innocent, and only under a teacher\'s idhn.</p>':'')+(b.src?'<div class="meta">'+esc(b.src)+'</div>':'')+'</div>');
      else if(b.t==='note') html.push('<p class="awnote">'+esc(b.x)+'</p>');
      else if(b.t==='sheet') html.push('<p class="awsheet">'+esc(b.x)+'</p>');
      else if(b.t==='li') html.push('<p class="awp" style="margin-left:14px">• '+hx(b.x)+'</p>');
      else html.push('<p class="awp">'+hx(b.x)+'</p>');
      if(html[at]) html[at]=html[at].replace(/^<(\w+)/,'<$1 data-bi="'+bi+'"')}
    flush();
    const days=s.blocks.filter(b=>b.t==='day').map(b=>String(b.x).split(' ')[0]);
    const nU=s.blocks.filter(b=>b.t==='ar').length, nMk=Object.keys(MARKS).filter(k=>k.startsWith(key+':')).length;
    const f=AR_FONTS.map(([k,n])=>'<option value="'+k+'"'+(AW.font===k?' selected':'')+'>'+n+'</option>').join('');
    rd.style.setProperty('--awfs',AW.fs+'rem');
    rd.innerHTML='<div class="awhead"><div class="eb">'+esc(B.title)+' · '+esc(B.tariqa)+'</div>'+(s.ar?'<div class="awar" lang="ar" dir="rtl">'+esc(s.ar)+'</div>':'')+'<h3>'+esc((s.num&&s.num!=='·'?s.num+' · ':'')+s.title)+'</h3><div class="num">section '+(si+1)+' of '+B.sections.length+(nU?' · '+nU+' Arabic lines':'')+(nMk?' · ★ '+nMk:'')+'</div></div>'+
      '<div class="kbtools" role="toolbar" aria-label="Reading">'+['ar','tl','en'].map(k=>'<button data-sh="'+k+'" aria-pressed="'+!!AW.show[k]+'">'+{ar:'Arabic',tl:'Transliteration',en:'English'}[k]+'</button>').join('')+'<button data-fs="-1" aria-label="Smaller Arabic">A−</button><button data-fs="1" aria-label="Larger Arabic">A+</button><select id="awFont" aria-label="Arabic typeface">'+f+'</select><button id="awAbj" aria-pressed="'+!!AW.abj+'" title="The engine\'s Mashriqī abjad of each Arabic line">abjad</button>'+(tts?'<button id="awEng">▶ English only</button>':'')+'<button id="awPrev"'+(si?'':' disabled')+'>← Previous</button><button id="awNext"'+(si<B.sections.length-1?'':' disabled')+'>Next →</button>'+(days.length?days.map(d=>'<button data-day="'+esc(d)+'">'+esc(d)+'</button>').join(''):'')+'<span class="meta" id="awMsg"></span></div>'+
      '<div class="awtxt '+['ar','tl','en'].filter(k=>!AW.show[k]).map(k=>'hide-'+k).join(' ')+'" id="awTxt">'+html.join('')+'</div>'+
      '<div class="awpager"><button class="more" id="awPrev2"'+(si?'':' disabled')+'>← '+(si?esc(B.sections[si-1].title.split(' · ')[0]):'')+'</button><button class="more" id="awAsk">✦ Ask the Ustādh about this</button><button class="more pri" id="awNext2"'+(si<B.sections.length-1?'':' disabled')+'>'+(si<B.sections.length-1?esc(B.sections[si+1].title.split(' · ')[0]):'')+' →</button></div>'+
      '<p class="awsrc">Source: Amin Patel, <a href="'+esc(B.url)+'" target="_blank" rel="noopener">'+esc(B.url.replace('https://www.',''))+'</a> — khidma, freely given — as carried in Kunūz al-Dhikr. Possession of a text is not idhn.</p>';
    rd.querySelectorAll('[data-sh]').forEach(b=>b.onclick=()=>{AW.show[b.dataset.sh]=AW.show[b.dataset.sh]?0:1; if(!AW.show.ar&&!AW.show.tl&&!AW.show.en) AW.show.en=1; awSave(); draw(null)});
    rd.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{AW.fs=Math.max(1.2,Math.min(3.2,Math.round((AW.fs+.2*b.dataset.fs)*10)/10)); awSave(); rd.style.setProperty('--awfs',AW.fs+'rem')});
    document.getElementById('awFont').onchange=e=>{AW.font=e.target.value; awSave(); applyFont()};
    document.getElementById('awAbj').onclick=()=>{AW.abj=AW.abj?0:1; awSave(); draw(null)};
    rd.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const el=document.getElementById('awday-'+b.dataset.day); if(el) el.scrollIntoView({behavior:'smooth',block:'start'})});
    ['awPrev','awPrev2'].forEach(id=>document.getElementById(id).onclick=()=>go(si-1)); ['awNext','awNext2'].forEach(id=>document.getElementById(id).onclick=()=>go(si+1));
    rd.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{const k=b.dataset.mk; if(MARKS[k]) delete MARKS[k]; else MARKS[k]=Date.now(); LS.set('marks',MARKS); const on=!!MARKS[k]; b.setAttribute('aria-pressed',on); b.textContent=on?'★':'☆'; b.closest('.awu').classList.toggle('on',on)});
    document.getElementById('awAsk').onclick=()=>(window.askUstadh||askAbout)('Explain "'+s.title+'" from '+B.title+' (Kunūz al-Dhikr awrād): what it is, who composed it, when and how it is recited in the ṭarīqa, and anything my other sources (the Iḥyāʾ, the Teacher Library) say about it. Use search_kunuz and read_awrad_section.');
    const eng=document.getElementById('awEng'); if(eng) eng.onclick=()=>{const t=englishOnly(s.blocks.filter(b=>b.t==='en'||((b.t==='p'||b.t==='li')&&!isArText(b.x))).map(b=>b.x).join('\n')); const msg=document.getElementById('awMsg'); if(!t){if(msg) msg.textContent='No English in this section.'; return} tts.speak(t.slice(0,6000)).catch(()=>{if(msg) msg.textContent='Read-aloud is not available here.'})};
    setHash('read/awrad/'+bk+'/'+si);
    if(J){const el=(J.bi!=null&&rd.querySelector('#awTxt [data-bi="'+J.bi+'"]'))||rd.querySelector('#awTxt mark'); if(el){const u=el.closest('.awu')||el; setTimeout(()=>{u.scrollIntoView({block:'center'}); u.classList.add('flash')},80)}}}
  draw(J);
}
/* Sharḥ Ḥizb al-Baḥr and Rev5: page by page (B's sharhReader) */
async function pageReader(bk,body,J){let S; try{S=await xb(bk)}catch(e){body.innerHTML='<p class="empty">This book did not load. Reload the page to try again.</p>'; return} if(tab!=='read'||AW.shelf!=='awrad'||AW.bk!==bk) return;
  let pi=Math.max(0,Math.min(+(AW.sec[bk]||0),S.pages.length-1)); if(J&&J.bk===bk&&J.pi!=null) pi=J.pi;
  const heads=S.pages.map(p=>p.x.replace(/\s+/g,' ').slice(0,60));
  body.innerHTML='<div class="kbgrid"><nav class="kbnav" aria-label="Pages"><div class="meta" style="padding:0 9px 4px">'+esc(S.author)+'</div>'+S.pages.map((p,i)=>'<button data-pi="'+i+'" aria-current="'+(i===pi)+'"><span class="num">p.'+p.n+'</span><span>'+esc(heads[i])+'</span></button>').join('')+'</nav><div style="min-width:0;display:grid;gap:10px"><select class="kbsel" id="awSel" aria-label="Page">'+S.pages.map((p,i)=>'<option value="'+i+'"'+(i===pi?' selected':'')+'>p.'+p.n+' — '+esc(heads[i])+'</option>').join('')+'</select><article class="awart awpg" id="awRd"></article></div></div>';
  const go=n=>{pi=Math.max(0,Math.min(S.pages.length-1,n)); AW.sec[bk]=pi; awSave(); body.querySelectorAll('[data-pi]').forEach(x=>x.setAttribute('aria-current',+x.dataset.pi===pi)); document.getElementById('awSel').value=pi; draw(null); document.getElementById('awRd').scrollIntoView({block:'start'})};
  body.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>go(+b.dataset.pi)); document.getElementById('awSel').onchange=e=>go(+e.target.value);
  function draw(J){const rd=document.getElementById('awRd'), p=S.pages[pi], terms=J&&J.terms;
    rd.innerHTML='<div class="awhead"><div class="eb">'+esc(S.title)+'</div><h3>Page '+p.n+'</h3><div class="num">'+(pi+1)+' of '+S.pages.length+' pages carried</div></div><div class="kbtools" role="toolbar" aria-label="Reading"><button id="awPrev"'+(pi?'':' disabled')+'>← Previous</button><button id="awNext"'+(pi<S.pages.length-1?'':' disabled')+'>Next →</button>'+(tts?'<button id="awEng">▶ English only</button>':'')+'<span class="meta" id="awMsg"></span></div><div>'+p.x.split(/\n+/).map(x=>'<p class="awp" dir="auto"'+(isArText(x)?' lang="ar" style="font-family:var(--aw-ar,var(--f-ar));font-size:1.35rem;text-align:right"':'')+'>'+(terms?hlq(x,terms):esc(x))+'</p>').join('')+'</div><div class="awpager"><button class="more" id="awPrev2"'+(pi?'':' disabled')+'>← Previous page</button><button class="more pri" id="awNext2"'+(pi<S.pages.length-1?'':' disabled')+'>Next page →</button></div><p class="awsrc">Source: <a href="'+esc(S.url)+'" target="_blank" rel="noopener">'+esc(S.url.replace('https://',''))+'</a> — '+esc(S.author)+' — as carried in Kunūz al-Dhikr.</p>';
    ['awPrev','awPrev2'].forEach(id=>document.getElementById(id).onclick=()=>go(pi-1)); ['awNext','awNext2'].forEach(id=>document.getElementById(id).onclick=()=>go(pi+1));
    const eng=document.getElementById('awEng'); if(eng) eng.onclick=()=>{const t=englishOnly(p.x); if(t) tts.speak(t.slice(0,6000)).catch(()=>{const m=document.getElementById('awMsg'); if(m) m.textContent='Read-aloud is not available here.'})};
    setHash('read/awrad/'+bk+'/'+pi);
    if(J){const m=rd.querySelector('mark'); if(m) setTimeout(()=>{m.scrollIntoView({block:'center'}); m.closest('.awp').classList.add('flash')},80)}}
  draw(J)}

/* ── search inside the five books; every hit opens at its line ── */
async function awSearch(q,limit){const terms=qterms(q); if(!terms.length) return {terms,hits:[]}; const hits=[];
  const m=await KZBK.all();
  for(const [k,B] of Object.entries(m)) B.sections.forEach((s,si)=>{const bl=s.blocks||[]; for(let j=0;j<bl.length;j++){const x=bl[j]; if(!x||!x.x||held(k,si,j)) continue; const n=kn(x.x+' '+s.title); if(!terms.every(t=>n.includes(t))) continue;
    let bi=j; if(x.t==='tl'||x.t==='en'){for(let i=j;i>=Math.max(0,j-3);i--) if(bl[i].t==='ar'){bi=i; break}}
    hits.push({bk:k,si,bi,book:B.title,sec:s.title,t:x.t,x:x.x})}});
  for(const k of ['sharh','rev5']){let S; try{S=await xb(k)}catch(e){continue} S.pages.forEach((p,pi)=>{const n=kn(p.x); if(terms.every(t=>n.includes(t))) hits.push({bk:k,pi,book:S.title,sec:'p.'+p.n,t:'page',x:p.x})})}
  const seen=new Set(); const out=hits.filter(h=>{const key=h.bk+'|'+(h.si!=null?h.si+'|'+h.bi:h.pi); if(seen.has(key)) return false; seen.add(key); return true});
  return {terms,hits:out.slice(0,limit||400),total:out.length}}
async function awFind(){const el=document.getElementById('awHits'); if(!el) return; const q=(AW.q||'').trim(); if(!q){el.innerHTML=''; return} el.innerHTML='<p class="empty">Searching the awrād…</p>';
  let r; try{r=await awSearch(q,200)}catch(e){el.innerHTML='<p class="empty">The search did not run. Reload to try again.</p>'; return} if((AW.q||'').trim()!==q||!document.getElementById('awHits')) return;
  el.innerHTML='<p class="meta">'+r.total+' line'+(r.total===1?'':'s')+' found'+(r.total>40?' · the first 40 shown — add a word to narrow it':'')+' <button class="linkbtn" id="awClr">clear</button></p>'+r.hits.slice(0,40).map((h,i)=>'<button class="awhit" data-h="'+i+'"><span class="meta">'+esc(h.book)+' · '+esc(h.sec)+'</span><span'+(h.t==='ar'?' dir="rtl" lang="ar" class="ari" style="text-align:right;font-size:1.15rem"':'')+'>'+snip(h.x,r.terms,200)+'</span></button>').join('');
  document.getElementById('awClr').onclick=()=>{AW.q=''; awSave(); const i=document.getElementById('awQ'); if(i) i.value=''; el.innerHTML=''};
  el.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{const h=r.hits[+b.dataset.h]; openAwrad(h.bk,h.si!=null?h.si:h.pi,h.bi,r.terms)})}

/* open a book at a section (or page) and line, from anywhere */
function openAwrad(bk,idx,bi,terms){if(bk==='maktaba'&&window.kzOpenMaktaba) return window.kzOpenMaktaba(String(idx),null,terms||null); if(bk==='diwan'&&window.kzOpenDiwan) return window.kzOpenDiwan(+idx,terms||null); if(bk==='sohbah'&&window.kzOpenSohbah) return window.kzOpenSohbah(+idx,terms||null); AW.shelf='awrad'; AW.bk=bk; if(idx!=null) AW.sec[bk]=idx; awSave(); JUMP={bk,si:bk==='sharh'||bk==='rev5'?null:idx,pi:bk==='sharh'||bk==='rev5'?idx:null,bi:bi!=null?bi:null,terms:terms||null};
  if(typeof RD!=='undefined'&&RD) lastPg=RD.pg; if(tab!=='read'){tab='read'; render()} else renderAwrad(); window.scrollTo(0,0)}
window.kzOpenAwrad=openAwrad; window.kzAwSearch=awSearch;
/* by a book's own words: e.g. ('naqshi','Ḥizb 2') or ('recite','Ḥizb al-Baḥr') */
async function sectionIndex(bk,want){const m=await KZBK.M(); const B=m[bk]; if(!B) return -1; if(/^\d+$/.test(String(want))) return Math.min(+want,B.sections.length-1); const w=kn(want);
  let i=B.sections.findIndex(s=>kn(s.num||'')===w); if(i<0) i=B.sections.findIndex(s=>kn(s.title+' '+(s.ar||'')).includes(w)); return i}
window.kzAwSection=sectionIndex;

/* ── Ask: open or read a section ── */
if(typeof AITOOLS!=='undefined'){
  AITOOLS.push({name:'read_awrad_section',description:'Read one section of the Kunūz awrād books line by line (Arabic, transliteration, English). book: naqshi (Naqshbandī awrād & Dalāʾil al-Khayrāt), qadiri (Qādirī awrād & al-Ṣalāt al-Kubrā), recite (Shādhilī aḥzāb, Ḥizb al-Baḥr), sharh (Sharḥ Ḥizb al-Baḥr, page index), rev5 (Rev5 compilation, page index). section: index, its number (e.g. "Ḥizb 2") or words of its title. Without section, lists the sections. Returns at most ~20,000 characters.',inputSchema:{type:'object',properties:{book:{type:'string',enum:['naqshi','qadiri','recite','sharh','rev5']},section:{type:'string'}},required:['book']},
    execute:async(i)=>{const bk=i.book; prog('Reading the awrād');
      if(bk==='sharh'||bk==='rev5'){const S=await xb(bk); if(i.section==null||i.section==='') return {title:S.title,pages:S.pages.length}; const p=S.pages[Math.max(0,Math.min(S.pages.length-1,+i.section||0))]; return {title:S.title,page:p.n,text:p.x.slice(0,20000)}}
      const m=await KZBK.M(); const B=m[bk]; if(!B) throw new Error('unknown book'); if(i.section==null||i.section==='') return {title:B.title,sections:B.sections.map((s,k)=>({index:k,num:s.num,title:s.title,ar:s.ar}))};
      const si=await sectionIndex(bk,i.section); if(si<0) throw new Error('no section matches "'+i.section+'"'); const s=await KZBK.sec(bk,si);
      let out=s.blocks.map((b,j)=>held(bk,si,j)?'note: ['+held(bk,si,j)+' — method withheld: aimed at another person]':b.withheld?'entry: '+(b.title||'')+' [method withheld]':b.t+(b.v?' '+b.v:'')+': '+(b.x||[b.title,b.formula,b.method].filter(Boolean).join(' — ')||'')).join('\n'); if(out.length>20000) out=out.slice(0,20000)+'…';
      return {book:B.title,index:si,title:s.title,ar:s.ar,text:out}}},
   {name:'open_awrad',description:'Open the awrād reader (Read tab → Kunūz · Awrād) at a book and section for Al to read, optionally at the first line containing some words. book as in read_awrad_section.',inputSchema:{type:'object',properties:{book:{type:'string',enum:['naqshi','qadiri','recite','sharh','rev5']},section:{type:'string'},words:{type:'string'}},required:['book']},
    execute:async(i)=>{const bk=i.book; let idx=0, bi=null, terms=null;
      if(bk==='sharh'||bk==='rev5') idx=Math.max(0,+i.section||0); else {idx=i.section!=null&&i.section!==''?await sectionIndex(bk,i.section):0; if(idx<0) throw new Error('no section matches "'+i.section+'"')}
      if(i.words&&bk!=='sharh'&&bk!=='rev5'){terms=qterms(i.words); const s=await KZBK.sec(bk,idx); const j=s.blocks.findIndex(b=>b.x&&terms.every(t=>kn(b.x).includes(t))); if(j>-1) bi=j}
      setTimeout(()=>openAwrad(bk,idx,bi,terms),400); return {opened:true,book:bk,section:idx}}});
}

/* ── deep link on load: #read/awrad/<book>/<n> ── */
try{const m=/^#read\/awrad\/(\w+)\/(\d+)/.exec(location.hash); if(m&&BOOKS.some(b=>b[0]===m[1])) setTimeout(()=>openAwrad(m[1],+m[2]),0)}catch(e){}
if(tab==='read') readTab();
/* the Maktaba (port 6, part 7) loads after the awrād: kunuz/maktaba.js */
{const s=document.createElement('script'); s.src='kunuz/maktaba.js'; document.body.appendChild(s)}
})();
