/* ===== Kitāb — the Iḥyāʾ read as the book is, with its figures inline.
   Vanilla port of the Iḥyāʾ Engine's kit/tools/kitab.jsx (Kitab, ReadPane, SearchPane, FigCard, WorkCard, the reading
   part of TodayPane), reader.jsx and readpane.jsx (2026-11-17). Data: ihya/book/ch00–ch21.json (text, the printed Arabic
   as images, figure markers), ihya/figs_*.json (figure images), ihya/figs_book.json (the engine's readings),
   kitab/kitab.json (chapters, outline, the 660 numbered workings, corrections). Sealed workings: heading only; their
   figures and every figure on a page that holds a sealed or harm-directed working are not drawn. No machine voice
   reads Arabic: read-aloud is English only (englishOnly) and off until asked. ===== */
(function(){
const css=`
.kbgrid{display:grid;grid-template-columns:minmax(0,250px) minmax(0,1fr);gap:18px;align-items:start}
.kbnav{display:grid;gap:2px;max-height:calc(100vh - var(--hdrH,110px) - 24px);overflow-y:auto;position:sticky;top:calc(var(--hdrH,110px) + 10px)}
.kbnav button{font:inherit;text-align:left;border:0;border-left:2px solid transparent;background:transparent;color:var(--ink);padding:6px 9px;cursor:pointer;border-radius:0 6px 6px 0;display:grid;gap:1px}
.kbnav button .num{font-size:.72rem}.kbnav button span:last-child{font-size:.86rem;line-height:1.35;color:var(--muted)}
.kbnav button[aria-current="true"]{border-left-color:var(--gold);background:var(--gold-soft)}.kbnav button[aria-current="true"] span:last-child{color:var(--ink)}
.kbbar{height:4px;background:var(--line);border-radius:2px;overflow:hidden;margin-top:3px}.kbbar i{display:block;height:100%;background:var(--gold)}
.kbsel{display:none}
@media (max-width:820px){.kbgrid{grid-template-columns:minmax(0,1fr)}.kbnav{display:none}.kbsel{display:block;width:100%}}
.kbhead .ttl{font-family:var(--f-head);font-size:1.35rem;line-height:1.3;text-wrap:balance;margin:0}
.kbtools{position:sticky;top:calc(var(--hdrH,110px) + 6px);z-index:3;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;box-shadow:var(--glow)}
.kbtools button,.kbtools select,.kbtools input{font:inherit;font-size:.82rem;padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer;min-height:32px}
.kbtools input{width:76px;border-radius:6px;cursor:text}.kbtools button[aria-pressed="true"]{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}
.kbtoc{flex-basis:100%;max-height:45vh;overflow-y:auto;border-top:1px solid var(--line);padding-top:6px;display:grid;gap:2px}
.kbtoc button{border:0!important;background:none!important;border-radius:0!important;display:flex;gap:10px;text-align:left;width:100%}
.kbart{--kfs:17px;font-size:var(--kfs);line-height:1.85;overflow-wrap:anywhere;max-width:780px;min-width:0;padding:6px 2px;border-radius:10px;overflow-anchor:none}
.kbart.sepia{background:#f3ead6;color:#2b2216;padding:18px clamp(14px,4vw,28px)}.kbart.paper{background:#fdfcf8;color:#161412;padding:18px clamp(14px,4vw,28px)}
.kbart.sepia,.kbart.paper{--muted:#6b5f4c;--line:#00000020;--gold:#7a4a12;--lapis:#1f3c96;--gold-soft:#efe1c0;--ok:#2f6b2a;--ok-soft:#e3efd8;--saffron:#8a4d06;--saffron-soft:#f5e3c4;--warn:#9c2a1f}
.kbart p{margin:0 0 .9em}.kbart h3.kh1{font-family:var(--f-head);font-weight:400;font-size:1.6em;line-height:1.25;margin:1.2em 0 .5em;text-wrap:balance}
.kbart h4.kh2{font-family:var(--f-head);font-weight:400;font-size:1.22em;line-height:1.3;margin:1.1em 0 .25em;color:var(--gold);text-wrap:balance}
.kbart .ksrc{font-style:italic;font-size:.82em;color:var(--muted);margin-bottom:.5em}
.kpg{display:flex;align-items:center;gap:8px;margin:18px 0 6px;color:var(--muted)}.kpg::before{content:"";flex:1;border-top:1px solid var(--line)}
.kpg button{font-family:var(--f-mono);font-size:.72rem;border:0;background:none;color:var(--muted);cursor:pointer;padding:6px 4px;min-height:32px}.kpg button.on{color:var(--gold)}
.kanc{font-family:var(--f-mono);font-size:.62em;color:var(--muted);vertical-align:super}
.kp{position:relative;border-radius:3px}.kp.hl{background:color-mix(in srgb,var(--gold-hi) 26%,transparent)}.kp.speaking{box-shadow:-3px 0 0 var(--gold)}
.kp .kpt{white-space:nowrap;margin-left:6px}.kp .kpt button{border:0;background:none;color:var(--muted);cursor:pointer;font-size:.75em;padding:2px 4px}.kp.hl .kpt button:first-child{color:var(--gold)}
.kar{margin:6px 0 14px;text-align:center}.kar img{max-width:100%;height:auto;opacity:.97}
:root[data-theme="dark"] .kbart.auto .kar img{filter:invert(.9) sepia(.25)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .kbart.auto .kar img{filter:invert(.9) sepia(.25)}}
.kcorr{border:1px solid color-mix(in srgb,var(--ok) 45%,transparent);background:var(--ok-soft);padding:8px 12px;border-radius:6px;margin:4px 0 14px;font-size:.84em;line-height:1.6}
.kcorr b,.kseal b{font-family:var(--f-mono);font-size:.78em;letter-spacing:.06em}
.kseal{border:1px solid color-mix(in srgb,var(--saffron) 45%,transparent);background:var(--saffron-soft);padding:8px 12px;border-radius:6px;margin:6px 0 14px;font-size:.86em}
.kfig{margin:10px 0 18px;border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--panel);font-size:15px;line-height:1.55;color:var(--ink);display:grid;gap:8px;min-width:0}
.kbart.sepia .kfig,.kbart.paper .kfig{background:#fff}
.kfig .figimg{min-height:60px}.kfig .btns{display:flex;flex-wrap:wrap;gap:6px}
.kfc{display:grid;gap:6px;min-width:0}.kfc .vh{font-size:.82rem}
.kbcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:10px}
.kbcards>div{border:1px solid var(--line);border-radius:8px;padding:10px;background:var(--panel);min-width:0}
.kw{display:grid;gap:4px;border-left:3px solid var(--wc,var(--line))}
.kw .t{font:inherit;text-align:left;border:0;background:none;padding:0;color:var(--ink);cursor:pointer;font-weight:600}.kw .t:hover{color:var(--lapis);text-decoration:underline}
.kwhit{text-align:left;font:inherit;display:grid;gap:2px;width:100%;padding:8px 11px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);cursor:pointer}
.kwhit:hover{border-color:var(--gold)}
mark.kq{background:color-mix(in srgb,var(--gold-hi) 40%,transparent);color:inherit;border-radius:2px}
.kstats{display:flex;flex-wrap:wrap;gap:8px}.kstats>div{border:1px solid var(--line);border-radius:8px;padding:7px 12px}.kstats b{display:block;font-family:var(--f-mono);font-size:1.1rem;color:var(--lapis)}.kstats span{font-size:.74rem;color:var(--muted);letter-spacing:.04em}
.kyr{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) auto;gap:10px;align-items:center;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:3px 0;width:100%}
.kyr .kbbar{height:6px;margin:0}
@media (max-width:520px){.kyr{grid-template-columns:minmax(0,1fr) auto}.kyr .kbbar{grid-column:1/-1;order:3}}
@media (max-width:640px){.kbtools{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:thin;padding:6px 8px}.kbtools>*{flex:none}.kbtoc{position:fixed;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));top:calc(var(--hdrH,110px) + 60px);max-height:55vh;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px;z-index:4;box-shadow:var(--glow)}}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const hdr=document.querySelector('header'); const setH=()=>document.documentElement.style.setProperty('--hdrH',Math.round(hdr.getBoundingClientRect().height+(parseFloat(getComputedStyle(hdr).top)||0))+'px'); if(hdr){setH(); new ResizeObserver(setH).observe(hdr)}

const LSg=(k,d)=>{try{const v=localStorage.getItem('kb:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}};
const LSs=(k,v)=>{try{localStorage.setItem('kb:'+k,JSON.stringify(v))}catch(e){}};
let KB=Object.assign({ch:0,view:'overview',page:null,q:'',size:17,showAr:true,theme:'auto',seenPg:null,ff:'all',cat:'all',sq:'',scope:'all'},LSg('state',{}));
const kbSave=()=>{const {page,...s}=KB; LSs('state',s)};
let KM=null, KMp=null;
const loadKM=()=>KMp||(KMp=fetch('kitab/kitab.json').then(r=>{if(!r.ok) throw new Error(r.status); return r.json()}).then(d=>KM=d).catch(e=>{KMp=null; throw e}));
const loadCh=c=>xget('ihya/book/ch'+String(c).padStart(2,'0')+'.json');
const chOf=p=>{const c=KM&&KM.chapters.find(c=>p>=c.from&&p<=c.to); return c?c.ch:0};
const CATCOL={healing:'#2f9a78',protection:'#3f78c8',provision:'#b8901e',need:'#8f7a52',release:'#8a5fd0',knowledge:'#2b97b8',family:'#c45a8a',standing:'#c08a1a',travel:'#4f9a3f',jinn:'#8a7a4a',dreams:'#6f7f99',other:'#7d7770',sealed:'#c97a2c'};
/* the Iḥyāʾ's "instruments for this chapter", pointed at where each now lives in this engine */
const INSTR={0:[['day','My day'],['learn','Abjad calculator']],2:[['day','Planetary hours'],['forge:rules','Other rules of ch.19']],3:[['timing','The 28 mansions (Reference → Timing)']],5:[['forge:wafq','Forge']],10:[['forge:wafq','Forge']],12:[['forge:wafq','Forge']],14:[['learn','al-Ḥalqa']],16:[['forge:wafq','Forge a Name'],['squares','The Name squares (Reference)']],17:[['forge:talasim','Ṭalāsim']],18:[['forge:wafq','Forge']],19:[['forge:wafq','Forge'],['forge:rules','Other rules of ch.19'],['forge:ashkal','From a figure of the book'],['forge:studio','Ṭilasm Studio']],20:[['learn','al-Ḥalqa'],['day','My day']],21:[['forge:talasim','Ṭalāsim']]};
function goInstr(k){if(k.startsWith('forge:')){FG.mode=k.slice(6); fgSave(); tab='forge'} else tab=k; render(); window.scrollTo(0,0)}

/* fold for search and highlight: diacritics, ʿayn/hamza marks and case ignored, with a map back to the original */
function foldMap(s){let out='',map=[]; for(let i=0;i<s.length;i++){const c=s[i]; if(/[ʿʾ'’‘`ʻʼ]/.test(c)) continue; const f=c.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); for(const x of f){out+=x; map.push(i)}} return [out,map]}
const fold=s=>foldMap(s)[0];
function hl(text,q){text=String(text); if(!q) return esc(text); const [ft,map]=foldMap(text), fq=fold(q); const at=fq?ft.indexOf(fq):-1; if(at<0) return esc(text);
  const a=map[at], b=map[at+fq.length-1]+1; return esc(text.slice(0,a))+'<mark class="kq">'+esc(text.slice(a,b))+'</mark>'+hl(text.slice(b),q)}
/* the book's source anchors "[I 44]" become quiet references to Manbaʿ Uṣūl al-Ḥikma */
const withAnchors=(t,q)=>String(t).split(/(\[I+ \d+\])/).map(s=>/^\[I+ \d+\]$/.test(s)?'<span class="kanc" title="page of Manbaʿ Uṣūl al-Ḥikma">'+esc(s.slice(1,-1))+'</span>':hl(s,q)).join('');

let FB=null, FBM=null;
async function figsBook(){if(!FB){FB=await xget('ihya/figs_book.json'); FBM=new Map(FB.map(f=>[f.id,f]))} return FB}
const isSquare=g=>Array.isArray(g)&&g.length>=3&&g.every(r=>Array.isArray(r)&&r.length===g.length);
const cellsOf=g=>g.map(r=>r.map(x=>x==null?'':x));
/* FigCard: the engine's reading of a figure, every square re-summed here before it is shown */
function figCard(f,shown){if(!f) return ''; const ok=f.status==='verified'||f.status==='book-rule';
  const label=f.status==='verified'?'✓ verified':f.status==='book-rule'?'✓ rebuilt from rule':f.status==='eye'?'read by eye':f.status==='figure'?'figure · described':f.status==='queued'?'grid · reading queued':'not yet read';
  let h='<div class="kfc"><div class="vh"><span class="num">#'+f.id+' · p.'+f.page+(f.n?' · '+f.n+'×'+f.n:'')+(f.constant?' · Σ '+f.constant:'')+'</span><span class="tag'+(ok?'':f.status==='eye'?' w':' w')+'">'+label+'</span>'+(f.same!=null?'<span class="meta">repeats figure #'+f.same+'</span>':'')+'</div>';
  const g=shown==='printed'&&f.printed?f.printed:f.grid;
  if(f.printed) h+='<div class="flt" role="group" aria-label="Which reading"><button data-kfs="'+f.id+'" data-v="grid" aria-pressed="'+(shown!=='printed')+'">corrected</button><button data-kfs="'+f.id+'" data-v="printed" aria-pressed="'+(shown==='printed')+'">as printed</button></div>';
  if(g) h+=gridView(cellsOf(g),isSquare(g)?checkGrid(cellsOf(g)):null);
  if(f.printed&&f.grid&&f.printed.length===f.grid.length){const ch=[]; f.grid.forEach((r,i)=>r.forEach((v,j)=>{if(f.printed[i][j]!==v) ch.push('row '+(i+1)+', column '+(j+1)+': printed '+f.printed[i][j]+' → '+v)})); if(ch.length) h+='<p class="meta">Changed cells: '+esc(ch.join(' · '))+'</p>'}
  (f.panels||[]).forEach(p=>{h+=(p.label?'<div class="num">'+esc(p.label)+(p.constant?' · Σ '+p.constant:'')+'</div>':'')+gridView(cellsOf(p.grid),isSquare(p.grid)?checkGrid(cellsOf(p.grid)):null)});
  if(f.table) h+='<details><summary class="meta">The engine\'s transcription</summary>'+gridView(cellsOf(f.table))+'</details>';
  if(f.closes===false&&!f.printed) h+='<p class="meta" style="color:var(--warn)">does not close as printed</p>';
  if(f.note) h+='<p class="meta">'+esc(f.note)+'</p>';
  if(f.caption&&f.caption!==f.note) h+='<p class="meta"><i>'+esc(f.caption)+'</i></p>';
  if(f.issue) h+='<div class="fnd">Correction (approved in the Iḥyāʾ Engine): '+esc(f.issue)+'</div>';
  if(f.remark) h+='<div class="fnd">'+(f.held?'Printed as the rule gives it — ':'Remark — ')+esc(f.remark)+'</div>';
  return h+'</div>'}
const figShown={};
function wireFigCards(root){root.querySelectorAll('[data-kfs]').forEach(b=>b.onclick=()=>{const id=+b.dataset.kfs; figShown[id]=b.dataset.v; const box=b.closest('.kfc'); if(box) box.outerHTML=figCard(FBM.get(id),figShown[id]); wireFigCards(root)})}
const blocked=(id,page)=>SEALED_FIGS.includes(id)||sealedPages().has(page);

/* ---------- the shell ---------- */
async function renderKitab(){
  const v=document.getElementById('view');
  v.innerHTML='<section class="box"><p class="empty">Opening the book…</p></section>';
  try{await Promise.all([loadKM(),figsBook(),ensureData()])}catch(e){v.innerHTML='<section class="box"><p class="empty">The book did not load. Reload the page to try again.</p></section>'; return}
  if(tab!=='read') return;
  if(RD.pg&&RD.pg!==KB.seenPg){KB.ch=chOf(RD.pg); KB.view='read'; KB.page=RD.pg; KB.q=RD.hq||''; KB.seenPg=RD.pg; RD.hq=''; kbSave()}
  const C=KM.chapters.find(c=>c.ch===KB.ch)||KM.chapters[0];
  const visited=LSg('visited',[]);
  const tot=KM.chapters.reduce((a,c)=>({f:a.f+c.figs,fd:a.fd+c.figsDone,w:a.w+c.works}),{f:0,fd:0,w:0});
  const nav=KM.chapters.map(c=>{const n=visited.filter(p=>p>=c.from&&p<=c.to).length; return '<button data-kch="'+c.ch+'" aria-current="'+(c.ch===KB.ch)+'"><span class="num">'+esc(CHNAME(c.ch))+' · pp.'+c.from+'–'+c.to+'</span><span>'+esc(c.short)+'</span><span class="kbbar" aria-hidden="true"><i style="width:'+(100*n/(c.to-c.from+1)).toFixed(1)+'%"></i></span></button>'}).join('');
  const secs=KM.outline.filter(o=>o.ch===KB.ch), works=KM.workings.filter(w=>w.ch===KB.ch), open=works.filter(w=>w.cat!=='sealed'), sealed=works.filter(w=>w.cat==='sealed');
  const figs=FB.filter(f=>chOfPage(f.page)===KB.ch), corr=KM.corrections.filter(c=>c.p>=C.from&&c.p<=C.to), nCorr=corr.length+figs.filter(f=>f.issue).length;
  const figsDone=figs.filter(f=>f.status!=='unread'&&f.status!=='queued').length;
  const views=[['read','Read'],['overview','Overview'],['sections','Sections · '+secs.length],['figures','Figures · '+figsDone+'/'+figs.length],['workings','Workings · '+open.length+(sealed.length?' + '+sealed.length+' sealed':'')],['corrections','Corrections · '+nCorr],['search','⌕ Search the book'],['reading','Your reading']];
  let h='<section class="box kbhead"><h2>Kitāb <span class="ari" style="color:var(--gold)">إحياء أصول الحكمة</span></h2><p class="meta">The Iḥyāʾ Uṣūl al-Ḥikma in its own order: '+KM.outline.length+' headings from its contents, '+tot.w+' numbered workings, '+tot.fd+' of '+tot.f+' figures read. The English text page by page with the printed Arabic as it stands on the page and every figure where the book puts it, each with the engine\'s reading re-summed. Sealed workings show their heading only, and their figures are not drawn.</p>'+
    '<div class="kbgrid"><nav class="kbnav" aria-label="Chapters">'+nav+'</nav><div style="min-width:0;display:grid;gap:12px">'+
    '<select class="kbsel" id="kbSel" aria-label="Chapter">'+KM.chapters.map(c=>'<option value="'+c.ch+'"'+(c.ch===KB.ch?' selected':'')+'>'+esc(CHNAME(c.ch)+' · pp.'+c.from+'–'+c.to+' — '+c.short)+'</option>').join('')+'</select>'+
    '<div><div class="num">'+esc(CHNAME(KB.ch))+' · pp.'+C.from+'–'+C.to+' · '+(C.to-C.from+1)+' pages</div><p class="ttl">'+esc(C.title)+'</p></div>'+
    '<div class="flt" role="group" aria-label="View">'+views.map(([k,l])=>'<button data-kv="'+k+'" aria-pressed="'+(KB.view===k)+'">'+esc(l)+'</button>').join('')+'</div>'+
    '<div id="kbBody" style="min-width:0"></div></div></div></section>';
  h+='<section class="box"><h2>Kunūz al-Dhikr <span class="ari" style="color:var(--lapis)">كنوز الذكر</span></h2><p class="meta">Search the awrād (Arabic, transliteration and English line by line), the Dīwān posts, Sharḥ Ḥizb al-Baḥr, the Rev5 compilation and the practices; awrād, Sharḥ and Rev5 results open in the reader (Kunūz · Awrād, above).</p><div class="tools"><label for="rdK" hidden>Search Kunūz</label><input id="rdK" type="search" placeholder="Search: Wiqāya, ṣalawāt, Ḥizb al-Baḥr, Friday…" value="'+esc(RD.kq)+'" autocomplete="off"><div class="flt" role="group" aria-label="Kunūz part">'+[['all','All'],['awrad','Awrād'],['posts','Dīwān'],['sharh','Sharḥ'],['rev5','Rev5'],['practices','Practices']].map(([k,l])=>'<button data-ks="'+k+'" aria-pressed="'+(RD.ks===k)+'">'+l+'</button>').join('')+'</div></div><div id="rdKo"></div></section>';
  v.innerHTML=h;
  const setCh=c=>{const cc=KM.chapters.find(x=>x.ch===c); KB.ch=c; KB.page=KB.view==='read'?cc.from:null; if(KB.view==='search'||KB.view==='reading') KB.view='overview'; KB.q=''; kbSave(); renderKitab(); window.scrollTo(0,0)};
  v.querySelectorAll('[data-kch]').forEach(b=>b.onclick=()=>setCh(+b.dataset.kch));
  document.getElementById('kbSel').onchange=e=>setCh(+e.target.value);
  v.querySelectorAll('[data-kv]').forEach(b=>b.onclick=()=>{KB.view=b.dataset.kv; if(KB.view==='read'){KB.page=null; KB.q=''} kbSave(); renderKitab()});
  let tk; document.getElementById('rdK').addEventListener('input',e=>{RD.kq=e.target.value; rdSave(); clearTimeout(tk); tk=setTimeout(rdKunuz,350)});
  v.querySelectorAll('[data-ks]').forEach(b=>b.onclick=()=>{RD.ks=b.dataset.ks; rdSave(); v.querySelectorAll('[data-ks]').forEach(x=>x.setAttribute('aria-pressed',x===b)); rdKunuz()});
  rdKunuz();
  const body=document.getElementById('kbBody');
  ({read:readPane,overview:overviewPane,sections:sectionsPane,figures:figuresPane,workings:workingsPane,corrections:correctionsPane,search:searchPane,reading:readingPane}[KB.view]||overviewPane)(body,{C,secs,works,open,sealed,figs,corr,nCorr,figsDone});
}
function openPage(p,q){RD.pg=p; RD.hq=q||''; rdSave(); if(tab!=='read'){tab='read'; render()} else renderKitab(); }
window.kbOpenPage=openPage;

/* ---------- Overview ---------- */
function overviewPane(el,x){const {C,secs,open,sealed,figs,nCorr,figsDone}=x; const last=LSg('lastRead',null);
  let h='<div class="tools"><button class="more pri" id="kbR">Read this chapter · '+(C.to-C.from+1)+' pages</button>'+(last?'<button class="more" id="kbC">Continue reading · p.'+last.p+'</button>':'')+'</div>';
  if(C.summary) h+='<p style="max-width:72ch">'+esc(C.summary)+'</p>';
  h+='<div class="kstats">'+[['sections',secs.length],['figures read',figsDone+' / '+figs.length],['workings',open.length],['sealed',sealed.length],['corrections',nCorr]].map(([l,n])=>'<div><span>'+l.toUpperCase()+'</span><b>'+n+'</b></div>').join('')+'</div>';
  if(INSTR[C.ch]) h+='<h3 class="akh">Instruments for this chapter</h3><div class="tools">'+INSTR[C.ch].map(([k,l])=>'<button class="more" data-kin="'+k+'">'+esc(l)+'</button>').join('')+'</div>';
  if(secs.length) h+='<h3 class="akh">In the book\'s order</h3><div style="display:grid;gap:2px">'+secs.slice(0,12).map(s=>'<div class="vh"><span class="num" style="min-width:52px">p.'+s.p+'</span><button class="linkbtn" data-kp="'+s.p+'" style="text-decoration:none;text-align:left">'+esc(s.t)+'</button></div>').join('')+(secs.length>12?'<button class="linkbtn" id="kbAllS">all '+secs.length+' →</button>':'')+'</div>';
  el.innerHTML=h;
  el.querySelector('#kbR').onclick=()=>openPage(C.from);
  const c=el.querySelector('#kbC'); if(c) c.onclick=()=>openPage(last.p);
  el.querySelectorAll('[data-kin]').forEach(b=>b.onclick=()=>goInstr(b.dataset.kin));
  el.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>openPage(+b.dataset.kp));
  const a=el.querySelector('#kbAllS'); if(a) a.onclick=()=>{KB.view='sections'; kbSave(); renderKitab()}}
function sectionsPane(el,{C,secs,works,figs}){
  el.innerHTML=secs.length?'<div style="display:grid">'+secs.map((s,i)=>{const nx=secs[i+1]?secs[i+1].p-1:C.to; const wn=works.filter(w=>w.p>=s.p&&w.p<=nx).length, fn=figs.filter(f=>f.page>=s.p&&f.page<=nx).length;
    return '<div class="v"><div class="vh"><span class="num" style="min-width:76px">pp.'+s.p+'–'+Math.max(s.p,nx)+'</span><button class="linkbtn" data-kp="'+s.p+'" style="text-decoration:none;text-align:left;flex:1 1 200px">'+esc(s.t)+'</button><span class="num">'+(fn?fn+' fig':'')+(fn&&wn?' · ':'')+(wn?wn+' work':'')+'</span></div></div>'}).join('')+'</div>':'<p class="empty">The book\'s contents list no sub-sections for this chapter; it runs as one exposition.</p>';
  el.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>openPage(+b.dataset.kp))}
function figuresPane(el,{figs}){
  const F=[['all',figs.length],['squares',figs.filter(f=>f.grid).length],['corrected',figs.filter(f=>f.corrected).length],['held',figs.filter(f=>f.held).length],['described',figs.filter(f=>f.status==='figure').length],['to do',figs.filter(f=>f.status==='unread'||f.status==='queued').length]].filter(([k,n])=>k==='all'||n>0);
  if(!F.some(([k])=>k===KB.ff)) KB.ff='all';
  const L=figs.filter(f=>KB.ff==='all'||(KB.ff==='squares'&&f.grid)||(KB.ff==='corrected'&&f.corrected)||(KB.ff==='held'&&f.held)||(KB.ff==='described'&&f.status==='figure')||(KB.ff==='to do'&&(f.status==='unread'||f.status==='queued')));
  el.innerHTML='<p class="meta" style="max-width:72ch">Each figure is read from the page image. A numeric square is shown only after its own arithmetic checks out, and it is re-summed here again; a seal, circle or cipher is described and cited, not redrawn. Where the printed square does not close, the corrected square is shown with the printed one beside it. Figures of sealed workings are listed without their image.</p><div class="flt" role="group" aria-label="Figures">'+F.map(([k,n])=>'<button data-kff="'+k+'" aria-pressed="'+(KB.ff===k)+'">'+k+' · '+n+'</button>').join('')+'</div>'+
    (L.length?'<div class="kbcards" style="margin-top:10px">'+L.map(f=>'<div>'+(blocked(f.id,f.page)?'<p class="meta" style="color:var(--saffron)">#'+f.id+' · p.'+f.page+' — figure of a sealed working; its image and reading are not carried</p>':figCard(f,figShown[f.id])+'<div class="tools"><button class="more" data-kp="'+f.page+'">Read p.'+f.page+'</button>'+(f.grid||f.status==='figure'?'<button class="more" data-kfg="'+f.id+'">Forge it</button>':'')+'</div>')+'</div>').join('')+'</div>':'<p class="empty">No figures in this chapter.</p>');
  el.querySelectorAll('[data-kff]').forEach(b=>b.onclick=()=>{KB.ff=b.dataset.kff; kbSave(); figuresPane(el,{figs})});
  el.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>openPage(+b.dataset.kp));
  el.querySelectorAll('[data-kfg]').forEach(b=>b.onclick=()=>forgeFig(+b.dataset.kfg));
  wireFigCards(el)}
function forgeFig(id){FG.mode='ashkal'; fgSave(); AK.sel=id; AK.method=null; AK.q=''; AK.kind='all'; AK.ch='all'; akSave(); tab='forge'; render(); window.scrollTo(0,0)}
function workCard(w){const col=CATCOL[w.cat]||'#7d7770'; const opId='I'+w.p+'.'+w.n; const has=OP&&OP.some(o=>o.id===opId);
  if(w.cat==='sealed') return '<div class="kw" style="--wc:'+col+'"><span class="num">p.'+w.p+' · no.'+w.n+' · sealed</span><span>'+esc(w.title)+'</span></div>';
  const chips=[...(w.days||[]),...(w.hour||[]).map(x=>PLANETS[x]?'hour of '+PLANETS[x].n:x),...(w.element||[]).map(e=>e+' form'),...(w.form||[]),...(w.square||[]).map(n=>n+'×'+n),...(w.material||[]),...(w.incense||[]).map(i=>'✻ '+i),...(w.recite||[]),...(w.counts||[]).map(c=>c+'×'),...(w.moon||[]).map(m=>'☾ '+m)];
  return '<div class="kw" style="--wc:'+col+'"><div class="vh"><span class="num" style="color:'+col+'">'+esc(w.cat.toUpperCase())+'</span><button class="linkbtn" data-kp="'+w.p+'">p.'+w.p+' · no.'+w.n+' · read ›</button></div>'+(has?'<button class="t" data-forge-op="'+esc(opId)+'">'+esc(w.title)+'</button>':'<span style="font-weight:600">'+esc(w.title)+'</span>')+(chips.length?'<div class="chips">'+chips.map(c=>'<span class="chip">'+esc(c)+'</span>').join('')+'</div>':'')+((w.square||[]).length?'<div class="tools"><button class="more" data-kwf="'+w.square[0]+'|'+((w.values||[])[0]||'')+'">Open the '+w.square[0]+'×'+w.square[0]+' in the Forge</button></div>':'')+'</div>'}
function workingsPane(el,x){const {open,sealed}=x; const cats=[...new Set(open.map(w=>w.cat))]; if(KB.cat!=='all'&&!cats.includes(KB.cat)) KB.cat='all';
  let h='<div class="flt" role="group" aria-label="Kind"><button data-kc="all" aria-pressed="'+(KB.cat==='all')+'">all · '+open.length+'</button>'+cats.map(k=>'<button data-kc="'+k+'" aria-pressed="'+(KB.cat===k)+'">'+k+' · '+open.filter(w=>w.cat===k).length+'</button>').join('')+'</div>';
  h+=open.length?'<div class="kbcards" style="margin-top:10px">'+open.filter(w=>KB.cat==='all'||w.cat===KB.cat).map(w=>'<div>'+workCard(w)+'</div>').join('')+'</div>':'<p class="empty">No numbered workings in this chapter.</p>';
  if(sealed.length) h+='<div class="fnd" style="margin-top:14px;display:grid;gap:6px"><b>Sealed — indexed, not built · '+sealed.length+'</b><span class="meta">Workings aimed at harming, compelling or binding another person, kept as title and page only so the record is complete.</span>'+sealed.map(workCard).join('')+'</div>';
  el.innerHTML=h;
  el.querySelectorAll('[data-kc]').forEach(b=>b.onclick=()=>{KB.cat=b.dataset.kc; kbSave(); workingsPane(el,x)});
  el.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>openPage(+b.dataset.kp));
  el.querySelectorAll('[data-kwf]').forEach(b=>b.onclick=()=>{const [n,val]=b.dataset.kwf.split('|'); FG.grid=null; FG.mode='wafq'; FG.order=+n; if(val){FG.num=val; FG.text=''} fgSave(); tab='forge'; render(); window.scrollTo(0,0)})}
function correctionsPane(el,{corr,figs,nCorr}){const fi=figs.filter(f=>f.issue&&!blocked(f.id,f.page));
  el.innerHTML=(nCorr?'<div style="display:grid;gap:8px">'+corr.map(c=>'<div class="sq"><div class="vh"><b>'+esc(c.says)+'</b><button class="linkbtn" data-kp="'+c.p+'">p.'+c.p+'</button></div><p class="meta">'+esc(c.correct)+(c.how?' · '+esc(c.how):'')+'</p></div>').join('')+fi.map(f=>'<div class="sq"><div class="vh"><b>Figure #'+f.id+(f.n?' · '+f.n+'×'+f.n:'')+' — '+(f.held?'held for re-reading':'printed square corrected')+'</b><button class="linkbtn" data-kp="'+f.page+'">p.'+f.page+'</button></div><p class="meta">'+esc(f.issue)+'</p></div>').join('')+'</div>':'<p class="empty">No corrections logged in this chapter yet.</p>')+'<p class="meta">More checks across the three sources are in Reference → Squares (the six Name squares and the other findings).</p>';
  el.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>openPage(+b.dataset.kp))}
function readingPane(el){const visited=LSg('visited',[]), last=LSg('lastRead',null), marks=LSg('bookmarks',[]), hls=LSg('highlights',{});
  let h='<p class="meta">Pages you have read in this engine on this device, chapter by chapter.'+(last?' You were last on p.'+last.p+'.':'')+'</p><div style="display:grid;gap:4px">'+KM.chapters.map(c=>{const n=visited.filter(p=>p>=c.from&&p<=c.to).length,t=c.to-c.from+1; return '<button class="kyr" data-kp="'+c.from+'"><span>'+esc(CHNAME(c.ch))+'</span><span class="kbbar"><i style="width:'+(100*n/t).toFixed(1)+'%"></i></span><span class="num">'+n+'/'+t+'</span></button>'}).join('')+'</div>';
  h+='<h3 class="akh">Bookmarks · '+marks.length+'</h3>'+(marks.length?'<div class="chips">'+marks.map(m=>'<button class="sug" data-kp="'+m.p+'">★ p.'+m.p+' · '+esc(CHNAME(m.ch))+'</button>').join('')+'</div>':'<p class="meta">Tap ☆ beside a page number while reading to keep it here.</p>');
  const H=Object.values(hls).sort((a,b)=>a.p-b.p);
  h+='<h3 class="akh">Highlighted passages · '+H.length+'</h3>'+(H.length?H.map(x=>'<div class="v"><button class="linkbtn" data-kp="'+x.p+'">p.'+x.p+'</button><div>'+esc(x.t)+'</div></div>').join(''):'<p class="meta">Tap ◇ after a paragraph to highlight it.</p>');
  el.innerHTML=h; el.querySelectorAll('[data-kp]').forEach(b=>b.onclick=()=>openPage(+b.dataset.kp))}

/* ---------- Search the whole book ---------- */
let SIDX=null, SFOLD=null;
function searchPane(el){
  el.innerHTML='<div class="tools"><label for="kbQ" hidden>Search the whole book</label><input id="kbQ" type="search" placeholder="a name, a verse, a word… (3 letters or more)" value="'+esc(KB.sq)+'" autocomplete="off"><div class="flt" role="group" aria-label="Where"><button data-ksc="all" aria-pressed="'+(KB.scope==='all')+'">everywhere</button><button data-ksc="head" aria-pressed="'+(KB.scope==='head')+'">headings only</button></div></div><div id="kbHits"><p class="empty">Loading the index…</p></div>';
  const run=async()=>{const out=document.getElementById('kbHits'); if(!out) return; if(!SIDX){try{SIDX=await xget('ihya/search.json'); SFOLD=SIDX.map(r=>fold(r[3]))}catch(e){out.innerHTML='<p class="empty">The search index did not load.</p>'; return}}
    const q=KB.sq.trim(); if(q.length<3){out.innerHTML='<p class="meta">'+SIDX.length.toLocaleString()+' passages, pp.2–2400. Type three letters or more.</p>'; return}
    const s=fold(q), hits=[]; for(let i=0;i<SIDX.length;i++){const r=SIDX[i]; if(KB.scope!=='all'&&r[2]!=='h1'&&r[2]!=='h2') continue; if(SFOLD[i].includes(s)){hits.push(r); if(hits.length>=300) break}}
    out.innerHTML='<p class="meta">'+(hits.length>=300?'300+':hits.length)+' passages</p><div style="display:grid;gap:6px">'+hits.map((r,i)=>{const t=r[3], [fs,mp]=foldMap(t), fa=fs.indexOf(s), at=fa<0?0:mp[fa], a=Math.max(0,at-90);
      return '<button class="kwhit" data-kh="'+i+'"><span class="num">'+esc(CHNAME(r[0]))+' · p.'+r[1]+(r[2]==='seal'?' · sealed':'')+'</span><span>'+(a>0?'…':'')+hl(t.slice(a,at+160),q)+(at+160<t.length?'…':'')+'</span></button>'}).join('')+'</div>';
    out.querySelectorAll('[data-kh]').forEach(b=>b.onclick=()=>{const r=hits[+b.dataset.kh]; openPage(r[1],q)})};
  let t; document.getElementById('kbQ').addEventListener('input',e=>{KB.sq=e.target.value; kbSave(); clearTimeout(t); t=setTimeout(run,220)});
  el.querySelectorAll('[data-ksc]').forEach(b=>b.onclick=()=>{KB.scope=b.dataset.ksc; kbSave(); el.querySelectorAll('[data-ksc]').forEach(x=>x.setAttribute('aria-pressed',x===b)); run()});
  run()}

/* ---------- Read: the chapter page by page ---------- */
let RDON={live:0,tts:null}, kbScrollFn=null, kbKeyFn=null, kbIO=null;
function stopReading(){RDON.live++; try{RDON.tts&&RDON.tts.stop&&RDON.tts.stop()}catch(e){} document.querySelectorAll('.kp.speaking').forEach(x=>x.classList.remove('speaking')); const b=document.getElementById('kbAloud'); if(b){b.textContent='♪ Read aloud from here'; b.setAttribute('aria-pressed','false')}}
const barOff=()=>{const h=document.querySelector('header'), t=document.querySelector('.kbtools'); return (h?h.getBoundingClientRect().height:110)+(t?t.getBoundingClientRect().height:50)+16};
function scrollToEl(e,off){if(!e) return; window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY-(off||barOff())})}
async function readPane(el,{C,secs}){
  el.innerHTML='<p class="empty">Opening the chapter…</p>';
  let d; try{d=await loadCh(C.ch)}catch(e){el.innerHTML='<p class="empty">The text of this chapter did not load. Reload the page to try again.</p>'; return}
  if(tab!=='read'||KB.view!=='read'||KB.ch!==C.ch) return;
  const marks=LSg('bookmarks',[]), hls=LSg('highlights',{}), q=KB.q;
  let tools='<div class="kbtools"><button id="kbToc" aria-pressed="false">contents</button><button id="kbM" aria-label="Smaller text">A−</button><button id="kbP" aria-label="Larger text">A+</button>'+[['auto','page'],['sepia','sepia'],['paper','paper']].map(([k,l])=>'<button data-krt="'+k+'" aria-pressed="'+(KB.theme===k)+'">'+l+'</button>').join('')+'<button id="kbAr" aria-pressed="'+KB.showAr+'">'+(KB.showAr?'Arabic shown':'Arabic hidden')+'</button><button id="kbAloud" aria-pressed="false" title="The English read aloud; Arabic and transliterated words are skipped">♪ Read aloud from here</button><label class="meta" for="kbPg">page</label><input id="kbPg" inputmode="numeric" placeholder="'+C.from+'">'+(marks.length?'<select id="kbBm" aria-label="Bookmarks"><option value="">bookmarks · '+marks.length+'</option>'+marks.map((m,i)=>'<option value="'+i+'">p.'+m.p+' · '+esc(CHNAME(m.ch))+'</option>').join('')+'</select>':'')+(q?'<button id="kbClrQ" title="Clear the highlighted search">⌕ '+esc(q)+' ✕</button>':'')+'<div class="kbtoc" id="kbTocL" hidden>'+[{t:C.title,p:C.from},...secs].map(s=>'<button data-ktp="'+s.p+'"><span class="num" style="min-width:52px">p.'+s.p+'</span><span>'+esc(s.t)+'</span></button>').join('')+'</div></div>';
  const sp=sealedPages(); let page=C.from; const parts=[];
  d.items.forEach((it,i)=>{
    if(it.k==='pg'){page=it.p; const on=marks.some(m=>m.p===it.p); parts.push('<div class="kpg" data-page="'+it.p+'"><button data-kbm="'+it.p+'" class="'+(on?'on':'')+'" title="Bookmark this page" aria-pressed="'+on+'">'+(on?'★':'☆')+' p.'+it.p+'</button></div>'); return}
    if(it.k==='h1'){parts.push('<h3 class="kh1" data-i="'+i+'">'+hl(it.t,q)+'</h3>'); return}
    if(it.k==='h2'){parts.push('<h4 class="kh2" data-i="'+i+'">'+hl(it.t,q)+'</h4>'); return}
    if(it.k==='src'){parts.push('<div class="ksrc">'+esc(it.t)+'</div>'); return}
    if(it.k==='p'){const key=C.ch+':'+i, on=!!hls[key]; parts.push('<p class="kp'+(on?' hl':'')+'" data-i="'+i+'" data-pp="'+page+'">'+withAnchors(it.t,q)+'<span class="kpt"><button data-khl="'+i+'" title="'+(on?'Remove highlight':'Highlight this passage')+'" aria-label="Highlight">'+(on?'◆':'◇')+'</button></span></p>'); return}
    if(it.k==='ar'){if(KB.showAr&&d.img[it.src]) parts.push('<div class="kar"><img src="'+d.img[it.src]+'" alt="Arabic text as printed, p.'+page+'" width="'+it.w+'" height="'+it.h+'" style="width:'+Math.min(it.w/2.1,700).toFixed(0)+'px;aspect-ratio:'+it.w+'/'+it.h+'" loading="lazy" decoding="async"></div>'); return}
    if(it.k==='corr'){parts.push('<div class="kcorr"><b>CORRECTED · </b>'+esc(it.t.replace(/^Corrected in this edition:\s*/,''))+'</div>'); return}
    if(it.k==='seal'){parts.push('<div class="kseal"><b>SEALED · p.'+(it.p||page)+' — </b>'+esc(it.t)+'<div class="meta" style="margin-top:3px">a working aimed at harming, compelling or binding another person — named and cited, its method not carried</div></div>'); return}
    if(it.k==='fig'){const f=FBM.get(it.id), shut=it.sealed||blocked(it.id,page);
      if(shut){parts.push('<figure class="kfig"><span class="num" style="color:var(--saffron)">figure #'+it.id+' · of a sealed working — its image is not carried</span></figure>'); return}
      const tal=KM.talismanIds.includes(it.id);
      parts.push('<figure class="kfig"><div class="figimg" data-kimg="'+it.id+'"><p class="empty">Figure #'+it.id+'…</p></div>'+(f?'<figcaption>'+figCard(f,figShown[it.id])+'</figcaption>':'')+'<div class="btns">'+(tal?'<button class="more" data-ktl="'+it.id+'">Open in Ṭalāsim · to read and sketch</button>':'')+'<button class="more" data-kfg="'+it.id+'">Forge it</button><button class="more" data-kst="'+it.id+'">Compose in the Ṭilasm Studio</button></div></figure>'); return}
  });
  el.innerHTML=tools+'<article class="kbart '+KB.theme+'" id="kbArt" style="--kfs:'+KB.size+'px">'+parts.join('')+'</article><div class="tools" style="margin-top:14px">'+(C.ch>0?'<button class="more" id="kbPrev">‹ '+esc(CHNAME(C.ch-1))+'</button>':'')+(C.ch<21?'<button class="more" id="kbNext">'+esc(CHNAME(C.ch+1))+' ›</button>':'')+'<span class="meta">Alt + ← / → moves between chapters</span></div>';
  const art=document.getElementById('kbArt');
  const go=c=>{stopReading(); KB.ch=c; KB.q=''; KB.page=KM.chapters.find(x=>x.ch===c).from; RD.pg=KB.page; KB.seenPg=RD.pg; rdSave(); kbSave(); renderKitab(); window.scrollTo(0,0)};
  const on=(id,f)=>{const x=document.getElementById(id); if(x) x.onclick=f};
  on('kbPrev',()=>go(C.ch-1)); on('kbNext',()=>go(C.ch+1));
  on('kbM',()=>{KB.size=Math.max(13,KB.size-1); kbSave(); art.style.setProperty('--kfs',KB.size+'px')});
  on('kbP',()=>{KB.size=Math.min(26,KB.size+1); kbSave(); art.style.setProperty('--kfs',KB.size+'px')});
  el.querySelectorAll('[data-krt]').forEach(b=>b.onclick=()=>{KB.theme=b.dataset.krt; kbSave(); art.className='kbart '+KB.theme; el.querySelectorAll('[data-krt]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  on('kbAr',()=>{KB.showAr=!KB.showAr; KB.page=curPage(); kbSave(); readPane(el,{C,secs})});
  on('kbClrQ',()=>{KB.q=''; KB.page=curPage(); kbSave(); readPane(el,{C,secs})});
  on('kbToc',()=>{const t=document.getElementById('kbTocL'); t.hidden=!t.hidden; document.getElementById('kbToc').setAttribute('aria-pressed',String(!t.hidden))});
  el.querySelectorAll('[data-ktp]').forEach(b=>b.onclick=()=>{document.getElementById('kbTocL').hidden=true; document.getElementById('kbToc').setAttribute('aria-pressed','false'); toPage(+b.dataset.ktp)});
  document.getElementById('kbPg').onkeydown=e=>{if(e.key!=='Enter') return; const p=parseInt(e.target.value,10); if(!(p>=1&&p<=2401)) return; if(p>=C.from&&p<=C.to) toPage(p); else openPage(p)};
  const bm=document.getElementById('kbBm'); if(bm) bm.onchange=e=>{const m=marks[+e.target.value]; if(m) openPage(m.p)};
  art.addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return;
    if(b.dataset.kbm){const p=+b.dataset.kbm; let M=LSg('bookmarks',[]); const had=M.some(x=>x.p===p); M=had?M.filter(x=>x.p!==p):[...M,{p,ch:C.ch,at:Date.now()}].sort((a,b)=>a.p-b.p); LSs('bookmarks',M); b.classList.toggle('on',!had); b.setAttribute('aria-pressed',String(!had)); b.textContent=(had?'☆':'★')+' p.'+p}
    else if(b.dataset.khl){const i=+b.dataset.khl, key=C.ch+':'+i, H=LSg('highlights',{}), par=b.closest('.kp'); if(H[key]) delete H[key]; else H[key]={ch:C.ch,p:+par.dataset.pp,t:d.items[i].t.slice(0,400),at:Date.now()}; LSs('highlights',H); par.classList.toggle('hl',!!H[key]); b.textContent=H[key]?'◆':'◇'}
    else if(b.dataset.ktl){FG.mode='talasim'; fgSave(); TLS.sel=+b.dataset.ktl; TLS.mode='clear'; tlsSave(); stopReading(); tab='forge'; render(); window.scrollTo(0,0)}
    else if(b.dataset.kfg){stopReading(); forgeFig(+b.dataset.kfg)}
    else if(b.dataset.kst){stopReading(); tlOpen('f'+b.dataset.kst)}});
  wireFigCards(art);
  // figure images, loaded as they come near the screen
  if(kbIO) kbIO.disconnect();
  kbIO=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting) return; const box=en.target; kbIO.unobserve(box); const id=+box.dataset.kimg; figImg(id).then(s=>{box.innerHTML=s?'<img alt="Figure '+id+' as printed" src="'+s+'">':'<p class="meta">No image for this figure.</p>'})}),{rootMargin:'600px 0px'});
  art.querySelectorAll('[data-kimg]').forEach(x=>kbIO.observe(x));
  // read aloud — English only, never Arabic
  cuse('tts').then(t=>{RDON.tts=t; const b=document.getElementById('kbAloud'); if(!t&&b) b.hidden=true});
  on('kbAloud',async()=>{const b=document.getElementById('kbAloud'); if(b.getAttribute('aria-pressed')==='true'){stopReading(); return} const T=RDON.tts; if(!T) return;
    const my=++RDON.live; b.textContent='■ Stop reading'; b.setAttribute('aria-pressed','true'); const from=curPage();
    const list=[...art.querySelectorAll('.kp,.kh1,.kh2')].filter(x=>+(x.dataset.pp||from)>=from&&x.getBoundingClientRect().top>-20);
    for(const p of list){if(RDON.live!==my) break; const txt=englishOnly(p.textContent.replace(/[◇◆]/g,'')); if(!txt||txt==='…'||/^[·\s…]+$/.test(txt)) continue; scrollToEl(p); p.classList.add('speaking');
      try{await T.speak(txt.slice(0,4000),{language:'en'})}catch(e){p.classList.remove('speaking'); break} p.classList.remove('speaking')}
    if(RDON.live===my) stopReading()});
  // where the reader is
  const curPage=()=>{let p=C.from; for(const m of art.querySelectorAll('[data-page]')){if(m.getBoundingClientRect().top<barOff()+10) p=+m.dataset.page; else break} return p};
  function toPage(p){scrollToEl(art.querySelector('[data-page="'+p+'"]'))}
  if(kbScrollFn) window.removeEventListener('scroll',kbScrollFn);
  let tm=null; kbScrollFn=()=>{if(tm) return; tm=setTimeout(()=>{tm=null; if(tab!=='read'||!document.getElementById('kbArt')) return; const p=curPage(); LSs('lastRead',{ch:C.ch,p}); RD.pg=p; KB.seenPg=p; rdSave(); const v=LSg('visited',[]); if(!v.includes(p)){v.push(p); LSs('visited',v)} const pi=document.getElementById('kbPg'); if(pi) pi.placeholder=String(p)},250)};
  window.addEventListener('scroll',kbScrollFn,{passive:true});
  if(kbKeyFn) window.removeEventListener('keydown',kbKeyFn);
  kbKeyFn=e=>{if(tab!=='read'||!document.getElementById('kbArt')||/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')) return; if(e.altKey&&e.key==='ArrowLeft'&&C.ch>0) go(C.ch-1); if(e.altKey&&e.key==='ArrowRight'&&C.ch<21) go(C.ch+1)};
  window.addEventListener('keydown',kbKeyFn);
  // go to the requested page and hold it there while images above it settle, unless the reader moves
  const target=KB.page; KB.page=null;
  const tEl=target?art.querySelector('[data-page="'+target+'"]'):null;
  if(tEl){let moved=false; const mk=()=>{moved=true}; ['wheel','touchmove','keydown'].forEach(ev=>window.addEventListener(ev,mk,{passive:true,once:true}));
    scrollToEl(tEl); const ro=new ResizeObserver(()=>{if(!moved) scrollToEl(tEl)}); ro.observe(art); setTimeout(()=>ro.disconnect(),4000)}
  else {const L=LSg('lastRead',null); if(!target&&L&&L.ch===C.ch&&L.p>C.from){const e2=art.querySelector('[data-page="'+L.p+'"]'); if(e2) scrollToEl(e2)}}
}

/* replaces the plain-text reader (renderRead) of 2026-11-16 */
window.renderRead=renderKitab;
renderRead=renderKitab;
/* Ask can open the book at a page */
if(typeof AITOOLS!=='undefined') AITOOLS.push({name:'open_book_page',description:'Open the Iḥyāʾ in the Read tab (the Kitāb reader, with the printed Arabic and figures inline) at a page, optionally highlighting a word. Use after citing a page when Al wants to see it.',inputSchema:{type:'object',properties:{page:{type:'number'},highlight:{type:'string'}},required:['page']},
  execute:async(i)=>{const p=Math.round(Number(i.page)); if(!(p>=1&&p<=2401)) throw new Error('page out of range'); setTimeout(()=>openPage(p,i.highlight||''),400); return {opened:p,chapter:KM?chOf(p):null}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden) stopReading()});
const r0=window.render; if(typeof r0==='function'){render=function(){if(tab!=='read') stopReading(); return r0.apply(this,arguments)}; window.render=render}
if(tab==='read') renderKitab();
})();
