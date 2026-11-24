/* ===== Kunūz al-Dhikr inside the merged engine — port 6, part 3 (2026-11-17): the Dīwān.
   A vanilla-JS port of Kunūz al-Dhikr's diwan() (index.html): all 1,240 posts of the DhikrNotes channel (kunuz/posts.json),
   newest first, with B's filters (search across text, link titles, documents and link descriptions with the words marked;
   category; ṭarīqa; year; "with text"; "documents"; clear), long posts clipped with "Read all", forwarded-from, documents,
   link previews, a post opened on its own (pinned) with its link, and English-only read-aloud of the opened post.
   Better than B: topic chips and a year strip with counts that filter at a tap; ☆ keep a post (this device) and a "Kept" filter;
   the opened post has previous / next, the Qurʾānic references it names opened in place from the copied Tanzil muṣḥaf
   (with the engine's abjad), the abjad of every Arabic line on request, the other posts that carry the same text, and
   "Ask about this post"; the place is kept in the address (#read/diwan/<id>); search_kunuz hits open the post here; Ask tools
   read_diwan_post and open_diwan. Decision 1: no machine voice for Arabic — "▶ English only" skips every Arabic and
   transliterated word (englishOnly). Media (images, videos, the PDFs themselves) are not carried in Kunūz either:
   such posts say so and keep their Telegram link as the source. ===== */
(function(){
'use strict';
const css=`
.dwbar{display:grid;gap:8px}
.dwrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.dwrow input[type=search]{flex:1 1 240px;min-width:0;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit}
.dwtg{font:inherit;font-size:.82rem;min-height:34px;padding:4px 12px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.dwtg .num{color:inherit;opacity:.7;font-size:.74rem}
.dwtg[aria-pressed="true"]{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}
.dwtg:hover{border-color:var(--gold)}
.dwtopics{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding-bottom:2px}
.dwtopics .dwtg{flex:none}
.dwyears{display:grid;grid-template-columns:repeat(auto-fit,minmax(40px,1fr));gap:4px;align-items:end}
.dwyr{font:inherit;border:0;background:none;color:var(--muted);cursor:pointer;display:grid;gap:3px;justify-items:center;padding:2px 0;min-height:44px}
.dwyr i{display:block;width:70%;background:color-mix(in srgb,var(--gold) 45%,transparent);border-radius:3px 3px 0 0}
.dwyr span{font-family:var(--f-mono);font-size:.72rem;font-variant-numeric:tabular-nums;line-height:1.2}.dwyr small{font-family:var(--f-mono);font-size:.66rem;opacity:.75}
.dwyr[aria-pressed="true"]{color:var(--ink)}.dwyr[aria-pressed="true"] i{background:var(--gold)}
.dwlist{display:grid}
.dwp{padding:14px 0;border-top:1px solid var(--line);display:grid;gap:6px;min-width:0}
.dwp:first-child{border-top:0}
.dwmeta{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;min-width:0}
.dwmeta .dwd{font-family:var(--f-mono);font-size:.78rem;color:var(--muted);font-variant-numeric:tabular-nums}
.dwmeta a{color:var(--muted);font-family:var(--f-mono);font-size:.74rem}
.dwbody{white-space:pre-wrap;overflow-wrap:anywhere;unicode-bidi:plaintext;max-width:72ch;line-height:1.6}
.dwbody.clip{max-height:9.6em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent)}
.dwdoc{font-family:var(--f-mono);font-size:.8rem;color:var(--gold);overflow-wrap:anywhere}
.dwlp{border-left:3px solid var(--turq);padding:4px 12px;font-size:.92rem;color:var(--muted);overflow-wrap:anywhere;max-width:72ch}
.dwlp b{color:var(--ink);font-weight:600}
.dwact{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.dwact button{font:inherit;font-size:.78rem;min-height:32px;border:1px solid var(--line);background:transparent;color:var(--lapis);border-radius:999px;padding:2px 11px;cursor:pointer}
.dwact button[aria-pressed="true"]{color:var(--gold);border-color:var(--gold);background:var(--gold-soft)}
.dwopen{font:inherit;font-weight:600;text-align:left;border:0;background:none;padding:0;color:var(--ink);cursor:pointer;font-size:.95rem}
.dwopen:hover{color:var(--lapis);text-decoration:underline}
.dwpin{border:1px solid var(--gold);border-radius:12px;padding:14px 16px;background:var(--panel);display:grid;gap:10px;box-shadow:inset 0 3px 0 var(--gold);min-width:0}
.dwpin .dwbody{font-size:1.02rem}
.dwpin h3{font-family:var(--f-head);font-weight:400;font-size:1.25rem;margin:0;text-wrap:balance}
.dwq{border:1px solid color-mix(in srgb,var(--turq) 45%,var(--line));border-radius:8px;padding:8px 12px;display:grid;gap:4px;background:var(--bg)}
.dwq .ar{font-size:1.35rem;line-height:1.9}
.dwq .tl{font-style:italic;color:var(--turq);margin:0}
.dwarl{display:grid;gap:6px}
.dwarl div{display:grid;gap:2px;border-bottom:1px dashed var(--line);padding-bottom:6px}
.dwarl .ar{font-size:1.25rem;line-height:1.9}
.dwab{font-family:var(--f-mono);font-size:.72rem;background:var(--gold-soft);color:var(--gold);border-radius:999px;padding:1px 8px;justify-self:end}
.dwbody mark,.dwlp mark,.dwdoc mark{background:var(--gold-soft);color:inherit;border-bottom:2px solid var(--gold)}
.dwpager{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ── Kunūz's own normaliser and highlighter (the same as the awrād reader) ── */
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

/* ── data ── */
let P=null, PP=null, BYID=null, DUP=null;
const posts=()=>P?Promise.resolve(P):PP||(PP=fetch('kunuz/posts.json').then(r=>{if(!r.ok) throw new Error('kunuz/posts.json'); return r.json()}).then(d=>{P=d; BYID=new Map(d.map((p,k)=>[p.i,k]));
  DUP=new Map(); const g=new Map(); d.forEach(p=>{const key=kn((p.x||'')+'|'+(p.lt||'')+'|'+(p.doc||'')).replace(/\s+/g,' ').trim(); if(key.length<40) return; (g.get(key)||g.set(key,[]).get(key)).push(p.i)}); for(const ids of g.values()) if(ids.length>1) ids.forEach(i=>DUP.set(i,ids.filter(j=>j!==i))); return d}).catch(e=>{PP=null; throw e}));
const hay=p=>p._n||(p._n=kn(p.x+' '+(p.lt||'')+' '+(p.doc||'')+' '+(p.ld||'')));
const TG=id=>'https://t.me/DhikrNotes/'+id;
const isLink=u=>/^https?:/.test(u||'');

/* ── per-viewer state (this device) ── */
const LS={get(k,d){try{const v=localStorage.getItem('dw:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('dw:'+k,JSON.stringify(v))}catch(e){}}};
const DW=Object.assign({q:'',c:'',t:'',y:'',doc:0,txt:0,kept:0,abj:0},LS.get('st',{}));
const save=()=>LS.set('st',DW);
let KEPT=LS.get('kept',{});
let PIN=null, JT=null, QOPEN='';                 // the opened post and the search terms carried to it
const setHash=h=>{try{history.replaceState(null,'','#'+h)}catch(e){}};

/* ── Qurʾānic references named in a post (only where the post says it is the Qurʾān) ── */
const QREF=/(?:\b(?:Q|Qur['ʾ’]?[aā]n|S[uū]r(?:a|ah|at)|[AĀ]y(?:a|ah|at)|verses?)\b[^\d\n]{0,32}?)(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?|(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?(?=\s*(?:\(|,)?\s*S[uū]r)/g;
function qrefs(t){const out=[], seen=new Set(); let m; QREF.lastIndex=0; while((m=QREF.exec(String(t||'')))){const s=+(m[1]||m[4]), a=+(m[2]||m[5]), b=+(m[3]||m[6])||a; if(s<1||s>114||a<1||b<a||b-a>20) continue; const k=s+':'+a+(b>a?'-'+b:''); if(seen.has(k)) continue; seen.add(k); out.push({s,a,b,k})} return out}
window.kzQrefs=qrefs;
/* Arabic lines of a post (each run of Arabic of three or more letters) */
function arLines(t){return String(t||'').split(/\n+/).map(x=>x.trim()).filter(x=>(x.match(/[ء-ي]/g)||[]).length>=3).map(x=>x.replace(/[^ء-ْٰٱ-ۓ\s]+/g,' ').replace(/\s+/g,' ').trim()).filter(x=>(x.match(/[ء-ي]/g)||[]).length>=3)}

/* ── a post ── */
function postHTML(p,terms,full){const long=!full&&p.x&&p.x.length>600, on=!!KEPT[p.i];
  let h='<article class="dwp" data-i="'+p.i+'"><div class="dwmeta"><span class="dwd">'+esc(p.d)+'</span><button class="dwopen" data-dwo="'+p.i+'">Post #'+p.i+'</button>'+(p.f?'<span class="chip ih">via '+esc(p.f)+'</span>':'')+p.c.map(c=>'<span class="chip">'+esc(c)+'</span>').join('')+p.q.map(c=>'<span class="chip nm">'+esc(c)+'</span>').join('')+'</div>';
  if(p.x) h+='<div class="dwbody'+(long?' clip':'')+'" dir="auto">'+hlq(p.x,terms)+'</div>'+(long?'<div><button class="more" data-dwx>Read all</button></div>':'');
  if(p.doc) h+='<div class="dwdoc">📄 '+hlq(p.doc,terms)+(p.sz?' · '+esc(p.sz):'')+' <span class="meta">— the document itself is kept on Telegram</span></div>';
  if(p.lt) h+='<div class="dwlp"><b>'+hlq(p.lt,terms)+'</b>'+(p.ld?'<br>'+esc(full?p.ld:p.ld.slice(0,220)):'')+((p.l||[]).some(isLink)?' <a href="'+esc(p.l.find(isLink))+'" target="_blank" rel="noopener">open ↗</a>':'')+'</div>';
  if(!p.x&&!p.doc&&!p.lt&&(p.ph||p.v)) h+='<p class="meta">'+(p.ph?'An image':'A video')+' with no words — the media are not carried in Kunūz; it stays on Telegram.</p>';
  h+='<div class="dwact"><button data-dwk="'+p.i+'" aria-pressed="'+on+'">'+(on?'★ kept':'☆ keep')+'</button>'+(full?'':'<button data-dwo="'+p.i+'">Open</button>')+'<button data-dwa="'+p.i+'">✦ Ask the Ustādh</button><a class="meta" href="'+TG(p.i)+'" target="_blank" rel="noopener">source: t.me/DhikrNotes/'+p.i+' ↗</a></div>';
  return h+'</article>'}

/* ── the Dīwān ── */
async function renderDiwan(){
  const v=document.getElementById('view');
  v.innerHTML=(window.kzShelfHTML?window.kzShelfHTML():'')+'<section class="box" id="dwBox"><h2>Kunūz al-Dhikr · the Dīwān <span class="ari" style="color:var(--gold)">الديوان</span></h2><p class="empty" id="dwLoad">Opening the archive…</p></section>';
  if(window.kzWireShelf) window.kzWireShelf(v);
  try{await posts()}catch(e){const l=document.getElementById('dwLoad'); if(l){l.innerHTML='The archive did not load. <button class="more" id="dwRetry">Try again</button>'; document.getElementById('dwRetry').onclick=renderDiwan} return}
  if(tab!=='read'||!isDiwan()) return;
  const cats={}, tq={}, yrs={}; P.forEach(p=>{p.c.forEach(c=>cats[c]=(cats[c]||0)+1); p.q.forEach(c=>tq[c]=(tq[c]||0)+1); const y=p.d.slice(0,4); yrs[y]=(yrs[y]||0)+1});
  const catL=Object.keys(cats).sort((a,b)=>cats[b]-cats[a]), tqL=Object.keys(tq).sort((a,b)=>tq[b]-tq[a]), yrL=Object.keys(yrs).sort(), ymax=Math.max(...Object.values(yrs));
  const box=document.getElementById('dwBox');
  box.innerHTML='<h2>Kunūz al-Dhikr · the Dīwān <span class="ari" style="color:var(--gold)">الديوان</span></h2><p class="meta">The DhikrNotes channel as Kunūz al-Dhikr carries it: '+P.length+' posts from '+esc(P[0].d.slice(0,7))+' to '+esc(P[P.length-1].d.slice(0,7))+', newest first. Open a post to read the Qurʾān it cites from the muṣḥaf and the abjad of its Arabic.</p>'+
    '<div class="dwbar"><div class="dwrow"><label for="dwQ" hidden>Search the Dīwān</label><input id="dwQ" type="search" dir="auto" placeholder="Search every post: Wiqāya, rābiṭa, Ṣafar, حسبنا…" value="'+esc(DW.q)+'" autocomplete="off"><label for="dwT" hidden>Ṭarīqa</label><select id="dwT"><option value="">All ṭuruq</option>'+tqL.map(c=>'<option value="'+esc(c)+'"'+(c===DW.t?' selected':'')+'>'+esc(c)+' · '+tq[c]+'</option>').join('')+'</select></div>'+
    '<div class="dwtopics" role="group" aria-label="Topic"><button class="dwtg" data-dwc="" aria-pressed="'+!DW.c+'">All topics <span class="num">'+P.length+'</span></button>'+catL.map(c=>'<button class="dwtg" data-dwc="'+esc(c)+'" aria-pressed="'+(DW.c===c)+'">'+esc(c)+' <span class="num">'+cats[c]+'</span></button>').join('')+'</div>'+
    '<div class="dwyears" role="group" aria-label="Year">'+yrL.map(y=>'<button class="dwyr" data-dwy="'+y+'" aria-pressed="'+(DW.y===y)+'" title="'+yrs[y]+' posts in '+y+'"><i style="height:'+Math.max(4,Math.round(30*yrs[y]/ymax))+'px"></i><span>'+y+'</span><small>'+yrs[y]+'</small></button>').join('')+'</div>'+
    '<div class="dwrow"><button class="dwtg" id="dwTxt" aria-pressed="'+!!DW.txt+'">With text</button><button class="dwtg" id="dwDoc" aria-pressed="'+!!DW.doc+'">Documents</button><button class="dwtg" id="dwKept" aria-pressed="'+!!DW.kept+'">☆ Kept <span class="num" id="dwKn">'+Object.keys(KEPT).length+'</span></button><button class="dwtg" id="dwClr">Clear</button><span class="meta" id="dwCnt" role="status"></span></div></div>'+
    '<div id="dwPin"></div><div class="dwlist" id="dwList"></div><div><button class="more" id="dwMore">Show more</button></div>'+
    '<p class="awsrc meta">Source: the DhikrNotes channel (t.me/DhikrNotes), as dissected and carried in Kunūz al-Dhikr. Each post keeps its own link as its source.</p>';
  let lim=40, res=[], terms=[];
  const run=()=>{save(); terms=qterms(DW.q);
    res=P.filter(p=>(!DW.c||p.c.includes(DW.c))&&(!DW.t||p.q.includes(DW.t))&&(!DW.y||p.d.startsWith(DW.y))&&(!DW.doc||p.doc)&&(!DW.txt||p.x.length>200)&&(!DW.kept||KEPT[p.i])&&(!terms.length||terms.every(t=>hay(p).includes(t)))).reverse();
    lim=40; draw()};
  const draw=()=>{const c=document.getElementById('dwCnt'); if(!c) return; c.textContent=res.length+' post'+(res.length===1?'':'s')+(terms.length?' matching “'+DW.q.trim()+'”':'');
    document.getElementById('dwList').innerHTML=res.slice(0,lim).map(p=>postHTML(p,terms,false)).join('')||'<p class="empty">No posts match. Clear a filter or try another word.</p>';
    document.getElementById('dwMore').hidden=res.length<=lim};
  let tm; document.getElementById('dwQ').addEventListener('input',e=>{clearTimeout(tm); tm=setTimeout(()=>{DW.q=e.target.value; run()},180)});
  document.getElementById('dwT').onchange=e=>{DW.t=e.target.value; run()};
  box.querySelectorAll('[data-dwc]').forEach(b=>b.onclick=()=>{DW.c=b.dataset.dwc; box.querySelectorAll('[data-dwc]').forEach(x=>x.setAttribute('aria-pressed',x===b)); run()});
  box.querySelectorAll('[data-dwy]').forEach(b=>b.onclick=()=>{DW.y=DW.y===b.dataset.dwy?'':b.dataset.dwy; box.querySelectorAll('[data-dwy]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.dwy===DW.y)); run()});
  [['dwTxt','txt'],['dwDoc','doc'],['dwKept','kept']].forEach(([id,k])=>document.getElementById(id).onclick=e=>{DW[k]=DW[k]?0:1; e.currentTarget.setAttribute('aria-pressed',String(!!DW[k])); run()});
  document.getElementById('dwClr').onclick=()=>{Object.assign(DW,{q:'',c:'',t:'',y:'',doc:0,txt:0,kept:0}); save(); PIN=null; renderDiwan()};
  document.getElementById('dwMore').onclick=()=>{lim+=60; draw()};
  box.onclick=e=>{const x=e.target.closest('[data-dwx]'); if(x){const b=x.parentElement.previousElementSibling; if(b) b.classList.remove('clip'); x.parentElement.remove(); return}
    const o=e.target.closest('[data-dwo]'); if(o){openPost(+o.dataset.dwo,terms.length?terms:null); return}
    const k=e.target.closest('[data-dwk]'); if(k){const i=+k.dataset.dwk; if(KEPT[i]) delete KEPT[i]; else KEPT[i]=Date.now(); LS.set('kept',KEPT); box.querySelectorAll('[data-dwk="'+i+'"]').forEach(b=>{b.setAttribute('aria-pressed',!!KEPT[i]); b.textContent=KEPT[i]?'★ kept':'☆ keep'}); const n=document.getElementById('dwKn'); if(n) n.textContent=Object.keys(KEPT).length; return}
    const a=e.target.closest('[data-dwa]'); if(a){const p=P[BYID.get(+a.dataset.dwa)]; (window.askUstadh||askAbout)('Explain Dīwān post #'+p.i+' ('+p.d+') from Kunūz al-Dhikr: what it teaches, the practice or occasion it describes, and what my other sources (the Iḥyāʾ, the awrād, the Teacher Library) say on the same subject. Read it first with read_diwan_post. Check any Qurʾān reference against the muṣḥaf and any number by compute_abjad.'); return}
    const q=e.target.closest('[data-dwq]'); if(q){showVerse(q); return}
    const ab=e.target.closest('#dwAbj'); if(ab){DW.abj=DW.abj?0:1; save(); drawPin(); return}
    const en=e.target.closest('#dwEng'); if(en){const p=PIN!=null&&P[BYID.get(PIN)]; const t=p&&englishOnly([p.x,p.lt,p.ld].filter(Boolean).join('\n')); const m=document.getElementById('dwMsg'); if(!t){if(m) m.textContent='No English in this post.'; return} tts.speak(t.slice(0,6000)).catch(()=>{if(m) m.textContent='Read-aloud is not available here.'}); return}
    const nv=e.target.closest('[data-dwn]'); if(nv){openPost(+nv.dataset.dwn,null); return}
    const cl=e.target.closest('#dwClose'); if(cl){PIN=null; JT=null; drawPin(); setHash('read/diwan'); return}};
  run(); drawPin();
}
/* the opened post: pinned above the archive */
function drawPin(){const el=document.getElementById('dwPin'); if(!el||!P) return; if(PIN==null){el.innerHTML=''; return}
  const k=BYID.get(PIN); if(k==null){el.innerHTML='<p class="awnote">Post #'+esc(PIN)+' is not in the archive.</p>'; return}
  const p=P[k], prev=P[k-1], next=P[k+1], text=[p.x,p.lt,p.ld].filter(Boolean).join('\n'), Q=qrefs(text), AR=arLines(p.x), dup=(DUP.get(p.i)||[]);
  let h='<div class="dwpin" id="dwPinned"><div class="dwpager"><span class="eyebrow meta">Post #'+p.i+' · '+esc(p.d)+' · '+(k+1)+' of '+P.length+'</span><span class="dwact"><button data-dwn="'+(prev?prev.i:'')+'"'+(prev?'':' disabled')+'>← earlier</button><button data-dwn="'+(next?next.i:'')+'"'+(next?'':' disabled')+'>later →</button><button id="dwClose">close</button></span></div>';
  if(p.lt) h+='<h3>'+esc(p.lt)+'</h3>';
  h+=postHTML(p,JT,true).replace('<article class="dwp"','<article class="dwp" style="border-top:0;padding-top:0"');
  if(Q.length) h+='<div><div class="meta">The Qurʾān it names — tap to read the āya from the muṣḥaf</div><div class="dwact">'+Q.map(r=>'<button data-dwq="'+r.k+'">Q '+r.k+'</button>').join('')+'</div><div id="dwQv" class="dwarl"></div></div>';
  if(AR.length) h+='<div class="dwact"><button id="dwAbj" aria-pressed="'+!!DW.abj+'">abjad of its Arabic ('+AR.length+' line'+(AR.length>1?'s':'')+')</button>'+(typeof tts!=='undefined'&&tts?'<button id="dwEng">▶ English only</button>':'')+'<span class="meta" id="dwMsg"></span></div>'+(DW.abj?'<div class="dwarl">'+AR.map(x=>{const a=abjad(x,false); return '<div><span class="ar" lang="ar" dir="rtl">'+esc(x)+'</span><span class="dwab" title="Mashriqī abjad computed by the engine, letter by letter">abjad '+a.total+' · '+a.letters+' letters</span></div>'}).join('')+'</div>':'');
  else if(typeof tts!=='undefined'&&tts) h+='<div class="dwact"><button id="dwEng">▶ English only</button><span class="meta" id="dwMsg"></span></div>';
  if(dup.length) h+='<p class="meta">The same text was posted again as '+dup.map(i=>'<button class="linkbtn" data-dwn="'+i+'">#'+i+' ('+esc(P[BYID.get(i)].d)+')</button>').join(', ')+'.</p>';
  el.innerHTML=h+'</div>';
  if(QOPEN){const b=el.querySelector('[data-dwq="'+QOPEN+'"]'); if(b) showVerse(b,true); else QOPEN=''}
}
async function showVerse(btn,keep){const k=btn.dataset.dwq, out=document.getElementById('dwQv'); if(!out) return; const m=/^(\d+):(\d+)(?:-(\d+))?$/.exec(k); const s=+m[1],a=+m[2],b=+(m[3]||m[2]);
  if(!keep&&out.dataset.k===k){out.innerHTML=''; out.dataset.k=''; QOPEN=''; return} out.dataset.k=k; QOPEN=k; out.innerHTML='<p class="empty">Reading Q '+k+' from the muṣḥaf…</p>';
  let A=[]; try{A=window.hqQuran?await window.hqQuran(s,a,b):[]}catch(e){out.innerHTML='<p class="empty">The Qurʾān text did not load. Reload to try again.</p>'; return}
  if(out.dataset.k!==k) return;
  if(!A.length){out.innerHTML='<p class="fnd">Q '+esc(k)+' is not an āya of the muṣḥaf — the post\'s reference may be mistyped.</p>'; return}
  out.innerHTML=A.map(x=>{const ab=abjad(x.ar,false); return '<div class="dwq"><div class="vh"><span class="k">Q '+s+':'+x.a+'</span><span class="dwab">abjad '+ab.total+' · '+ab.letters+' letters</span></div><div class="ar" lang="ar" dir="rtl">'+esc(x.ar)+'</div>'+(x.tr?'<p class="tl" lang="ar-Latn">'+esc(x.tr)+'</p>':'')+(x.en?'<p style="margin:0">'+esc(x.en)+' <span class="meta">(Pickthall)</span></p>':'')+'</div>'}).join('')+'<p class="meta">Tanzil Uthmani text, copied from the Iḥyāʾ Engine; abjad of the whole āya as written there (Mashriqī). The Uthmani writing marks some long alifs with a small (dagger) alif, which is not a letter and is not counted, so the same āya in plain spelling can come to a little more.</p>'}
function isDiwan(){return window.kzShelf&&window.kzShelf()==='diwan'}
function openPost(id,terms){if(id!==PIN) QOPEN=''; PIN=id; JT=terms||null; if(window.kzSetShelf) window.kzSetShelf('diwan');
  if(tab!=='read'){tab='read'; render(); window.scrollTo(0,0); return}
  if(!document.getElementById('dwPin')){window.kzRenderDiwan(); return}
  drawPin(); setHash('read/diwan/'+id); const e=document.getElementById('dwPinned'); if(e) e.scrollIntoView({block:'start',behavior:'smooth'})}
window.kzRenderDiwan=async function(){await renderDiwan(); if(PIN!=null){setHash('read/diwan/'+PIN); const e=document.getElementById('dwPinned'); if(e) setTimeout(()=>e.scrollIntoView({block:'start'}),60)} else setHash('read/diwan')};
window.kzOpenDiwan=openPost;

/* ── Ask: read or open a post ── */
if(typeof AITOOLS!=='undefined'){
  AITOOLS.push({name:'read_diwan_post',description:'Read Dīwān posts of Kunūz al-Dhikr (the DhikrNotes channel, 1,240 posts) in full: give ids (numbers from search_kunuz "Kunūz Dīwān post #…"), or words to find (all must appear) with optional topic and year. Returns up to 6 posts with date, topics, ṭuruq, full text, link title/description and document name, and the Qurʾān references each names.',inputSchema:{type:'object',properties:{ids:{type:'array',items:{type:'number'}},words:{type:'string'},topic:{type:'string'},year:{type:'string'}}},
    execute:async(i)=>{prog('Reading the Dīwān'); await posts(); let L=[];
      if(Array.isArray(i.ids)&&i.ids.length) L=i.ids.map(n=>P[BYID.get(+n)]).filter(Boolean);
      else {const t=qterms(i.words||''); L=P.filter(p=>(!i.topic||p.c.some(c=>kn(c).includes(kn(i.topic))))&&(!i.year||p.d.startsWith(String(i.year)))&&(!t.length||t.every(w=>hay(p).includes(w)))).reverse()}
      let out=L.slice(0,6).map(p=>({id:p.i,date:p.d,topics:p.c,turuq:p.q,forwarded_from:p.f||null,text:p.x,link_title:p.lt,link_description:p.ld,document:p.doc,quran_refs:qrefs([p.x,p.lt,p.ld].join('\n')).map(r=>r.k),source:TG(p.i)}));
      let js=JSON.stringify(out); while(js.length>26000&&out.length>1){out=out.slice(0,-1); js=JSON.stringify(out)} if(js.length>26000) out[0].text=String(out[0].text).slice(0,20000)+'…';
      return {total:L.length,posts:out}}},
   {name:'open_diwan',description:'Open the Dīwān (Read tab → Kunūz · Dīwān) for Al at one post by its id, optionally marking some words in it.',inputSchema:{type:'object',properties:{id:{type:'number'},words:{type:'string'}},required:['id']},
    execute:async(i)=>{await posts(); if(!BYID.has(+i.id)) throw new Error('no post #'+i.id); setTimeout(()=>openPost(+i.id,i.words?qterms(i.words):null),400); return {opened:true,id:+i.id}}});
}
/* deep link on load: #read/diwan or #read/diwan/<id> */
try{const m=/^#read\/diwan(?:\/(\d+))?/.exec(location.hash); if(m) setTimeout(()=>{if(m[1]) openPost(+m[1],null); else {if(window.kzSetShelf) window.kzSetShelf('diwan'); tab='read'; render()}},0)}catch(e){}
if(tab==='read'&&isDiwan()) render();
})();
