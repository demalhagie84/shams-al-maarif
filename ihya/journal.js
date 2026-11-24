/* ===== The Journal — port 7, part 3 (2026-11-23), from the Iḥyāʾ Engine's Journal (kit/src/engine.jsx, "═══ Journal ═══").
   My day → Journal: every entry stamped with its day, the planetary day and hour, the lunar mansion and the lunar day (as A),
   and now also the Hijri date and the place; five kinds (working, dhikr · wird, dream · ruʾyā, study, note); title, Name or
   verse with its abjad (Mashriqī, by code), intention, count, what was done, outcome and signs; search, kinds with counts,
   edit, delete, export and import (A's own export file is accepted as it is). Forge its square from a Name.
   Better than A: the entries live in this page's database (journal/<id>) and follow Al to every device — the entries
   al-Ḥalqa, the Study and the Wird counter write land here too; "outcomes to add" lists workings whose result is not yet
   written; an operation's page has "Write it in the journal", which opens a working already filled with its title, Name,
   page and count; entries grouped by month; Ask can read the journal and write an entry when Al asks.
   Nothing is spoken; the Arabic is shown, never voiced. ===== */
(function(){
'use strict';
const KINDS=[['working','Working'],['dhikr','Dhikr · wird'],['dream','Dream · ruʾyā'],['study','Study'],['note','Note']];
const KN=k=>(KINDS.find(x=>x[0]===k)||[,'Entry'])[1];
const LSK='hikma-journal';
const LSg=(k,d)=>{try{const v=localStorage.getItem(k); return v==null?d:JSON.parse(v)}catch(e){return d}};
const LSs=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const hasAr=s=>/[؀-ۿ]/.test(s||'');
const J={list:null,loading:null,edit:null,q:'',kind:'all',dbOk:false,msg:'',delArm:null,shown:40};
let DB; async function jdb(){if(DB!==undefined) return DB; try{DB=await Promise.race([cuse('db'),new Promise(r=>setTimeout(()=>r(null),10000))])}catch(e){DB=null} return DB}
const wait=(p,ms)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),ms); Promise.resolve(p).then(v=>{clearTimeout(t); res(v)},e=>{clearTimeout(t); rej(e)})});
const clean=e=>JSON.parse(JSON.stringify(e));
const sortL=l=>l.sort((a,b)=>(b.at||0)-(a.at||0));

/* load: the database first, then anything this browser kept while the database was away (pushed up and cleared) */
async function load(force){if(J.list&&!force) return J.list; if(J.loading) return J.loading;
  J.loading=(async()=>{const local=LSg(LSK,[]).filter(x=>x&&x.id); const db=await jdb(); let remote=[];
    if(db){try{const s=await wait(db.collection('journal').get(),15000); remote=s.docs.map(d=>d.data()).filter(x=>x&&x.id); J.dbOk=true}catch(e){J.dbOk=false}}
    const M=new Map(); for(const x of remote) M.set(x.id,x);
    const push=[]; for(const x of local){const r=M.get(x.id); if(!r||(x.upd||0)>(r.upd||0)){M.set(x.id,x); push.push(x)}}
    if(J.dbOk&&push.length){let ok=true; for(const x of push){try{await wait(db.doc('journal/'+x.id).set(clean(x)),15000)}catch(e){ok=false}} if(ok) LSs(LSK,[])}
    J.list=sortL([...M.values()]); J.loading=null; return J.list})();
  return J.loading}
async function put(e){e.upd=Date.now(); const i=J.list.findIndex(x=>x.id===e.id); if(i>=0) J.list[i]=e; else J.list.unshift(e); sortL(J.list);
  const db=await jdb(); if(db){try{await wait(db.doc('journal/'+e.id).set(clean(e)),15000); J.dbOk=true; return true}catch(x){}}
  const l=LSg(LSK,[]).filter(x=>x.id!==e.id); l.unshift(e); LSs(LSK,l.slice(0,800)); return false}
async function del(id){J.list=J.list.filter(x=>x.id!==id); LSs(LSK,LSg(LSK,[]).filter(x=>x.id!==id)); const db=await jdb(); if(db){try{await wait(db.doc('journal/'+id).delete(),15000); return true}catch(e){}} return false}

/* the stamp: day, planetary day and hour, mansion, lunar day (A), with the Hijri date and the place */
function stamp(d){d=d||new Date(); let t=null; try{t=computeToday(d)}catch(e){}
  return {at:d.getTime(),dayPlanet:t&&t.H?t.H.ruler:null,hourPlanet:t&&t.cur?t.cur.planet:null,mansion:t?t.mz.n:manzilNow(d).n,lunar:t?t.ld.day:lunarDay(d).day,
    hijri:t?t.hj.d+' '+t.hj.month+' '+t.hj.y:'',place:t?t.label:''}}
function blank(seed){seed=seed||{}; return Object.assign({id:'j'+Date.now(),kind:seed.kind||'working',title:seed.title||'',name:seed.name||'',intent:seed.intent||'',count:seed.count||'',body:seed.body||'',outcome:'',op:seed.op||''},stamp())}
const PN=k=>k&&PLANETS[k]?PLANETS[k].n:(k?String(k):'');
const fmtD=t=>new Date(t).toLocaleDateString([],{weekday:'short',day:'numeric',month:'short',year:'numeric'});
const fmtTm=t=>new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
function stampLine(x){const mz=x.mansion&&MZN[x.mansion-1]; return fmtD(x.at)+' · '+fmtTm(x.at)+(x.dayPlanet?' · day of '+PN(x.dayPlanet):'')+(x.hourPlanet?' · hour of '+PN(x.hourPlanet):'')+(x.mansion?' · mansion '+x.mansion+(mz?' '+mz[1]:''):'')+(x.lunar?' · lunar day '+x.lunar+(MANHUS.has(+x.lunar)?' (inauspicious, p.43)':''):'')+(x.hijri?' · '+x.hijri:'')+(x.place?' · '+x.place:'')}
const needsOutcome=x=>x.kind==='working'&&!String(x.outcome||'').trim()&&Date.now()-(x.at||0)>864e5;

const css=document.createElement('style'); css.textContent=`
#jnRoot{display:grid;gap:10px}
.jnhead{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between}
.jnbtns{display:flex;flex-wrap:wrap;gap:6px}
.jnbtns .more{min-height:40px}
.jned{border:1px solid color-mix(in srgb,var(--gold) 55%,var(--line));border-radius:12px;padding:14px;display:grid;gap:10px;background:linear-gradient(180deg,var(--gold-soft),transparent 140px);box-shadow:inset 0 0 0 3px var(--panel),inset 0 0 0 4px color-mix(in srgb,var(--gold) 30%,transparent)}
.jnstamp{font-family:var(--f-mono);font-size:.78rem;color:var(--gold);line-height:1.5}
.jnf{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:8px}
.jnf input,.jned textarea{width:100%;min-width:0;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink);font:inherit}
.jnname{position:relative}.jnname input.ar-in{font-family:var(--f-ar);font-size:1.25rem;direction:rtl;padding-left:76px}
.jnname .v{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-family:var(--f-mono);font-size:.85rem;color:var(--gold);border:0;padding:0}
.jnlist{display:grid;gap:8px}
.jnmon{font-family:var(--f-head);color:var(--gold);font-size:1rem;margin:8px 0 0;display:flex;align-items:center;gap:8px}
.jnmon::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,color-mix(in srgb,var(--gold) 60%,transparent),transparent)}
.jnrow{font:inherit;color:inherit;text-align:left;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);cursor:pointer;min-height:56px}
.jnrow:hover{border-color:var(--gold)}
.jnglyph{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-size:1.1rem;flex:none}
.jnt{min-width:0}.jnt b{font-weight:500;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jnt .ari{color:var(--gold);margin-left:10px}
.jnt .m{display:block;font-family:var(--f-mono);font-size:.72rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.jnk{font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.jnk.o{color:var(--saffron)}
.jnempty{text-align:center;padding:26px 12px;display:grid;gap:8px;justify-items:center}
.jnempty .ruqh{font-size:1.6rem}
@media (max-width:520px){.jnrow{grid-template-columns:auto minmax(0,1fr)}.jnk{grid-column:2}}
`; document.head.appendChild(css);

const root=()=>document.getElementById('jnRoot');
function draw(){const el=root(); if(!el) return;
  if(!J.list){el.innerHTML='<h2>Journal <span class="ari" style="color:var(--gold)">الدفتر</span></h2><p class="empty">Opening the journal…</p>'; load().then(()=>draw()); return}
  const L=J.list, fq=norm(J.q.trim()), out=L.filter(needsOutcome).length;
  const shown=L.filter(x=>(J.kind==='all'||(J.kind==='outcome'?needsOutcome(x):x.kind===J.kind))&&(!fq||norm([x.title,x.name,x.intent,x.body,x.outcome,x.count,x.op].join(' ')).includes(fq)));
  let h='<div class="jnhead"><h2>Journal <span class="ari" style="color:var(--gold)">الدفتر</span></h2><div class="jnbtns"><button class="more pri" id="jnNew">+ New entry</button><button class="more" id="jnExp">Export</button><label class="more" style="display:inline-flex;align-items:center;cursor:pointer">Import<input type="file" id="jnImp" accept="application/json,.json" hidden></label></div></div>';
  h+='<p class="meta">Your workings, dhikr, dreams and study, each stamped with its day, the planetary day and hour, the lunar mansion, the lunar day and the Hijri date. '+(J.dbOk?'Kept in the engine and on every device you open it on.':'Kept on this device until the engine\'s store answers; then it follows you everywhere.')+' The Iḥyāʾ Engine\'s export file imports as it is.</p>';
  if(J.msg) h+='<p class="meta" style="color:var(--ok)" role="status">'+esc(J.msg)+'</p>';
  if(J.edit) h+=editor();
  if(L.length){h+='<div class="tools"><label for="jnQ" hidden>Search the journal</label><input id="jnQ" type="search" placeholder="Search your entries: a Name, an intention, a word…" value="'+esc(J.q)+'" autocomplete="off"></div><div class="flt" role="group" aria-label="Kind">'+[['all','All · '+L.length]].concat(KINDS.map(([k,l])=>{const n=L.filter(x=>x.kind===k).length; return n?[k,l+' · '+n]:null}).filter(Boolean)).concat(out?[['outcome','Outcomes to add · '+out]]:[]).map(([k,l])=>'<button data-jk="'+k+'" aria-pressed="'+(J.kind===k)+'">'+esc(l)+'</button>').join('')+'</div>'}
  if(!L.length&&!J.edit) h+='<div class="jnempty"><span class="ruqh">بسم الله</span><b style="font-family:var(--f-head);font-weight:400;font-size:1.2rem">Your journal is empty</b><p class="meta" style="max-width:52ch">Record each working with its Name, count and intention. The engine stamps the day, the planetary hour, the mansion and the lunar day for you. al-Ḥalqa and the Wird counter write here too.</p><button class="more pri" id="jnFirst">Write the first entry</button></div>';
  if(L.length){let mon=''; h+='<div class="jnlist">'; shown.slice(0,J.shown).forEach(x=>{const m=new Date(x.at).toLocaleDateString([],{month:'long',year:'numeric'}); if(m!==mon){mon=m; h+='<div class="jnmon">'+esc(m)+'</div>'}
      const p=x.hourPlanet&&PLANETS[x.hourPlanet]; const col=p?p.h:'var(--gold)';
      h+='<button class="jnrow" data-je="'+esc(x.id)+'"><span class="jnglyph" style="background:color-mix(in srgb,'+col+' 16%,transparent);color:'+col+'">'+(p?p.g:'✎')+'</span><span class="jnt"><b>'+esc(x.title||KN(x.kind))+(x.name?'<span class="ari" dir="rtl">'+esc(x.name)+'</span>':'')+'</b><span class="m">'+esc(fmtD(x.at)+(x.hourPlanet?' · hour of '+PN(x.hourPlanet):'')+(x.count?' · '+x.count:'')+(x.intent?' · '+x.intent:''))+'</span></span><span class="jnk'+(needsOutcome(x)?' o':'')+'">'+esc(needsOutcome(x)?'outcome to add':KN(x.kind))+'</span></button>'});
    h+='</div>'+(shown.length>J.shown?'<button class="more" id="jnMore">Show '+Math.min(40,shown.length-J.shown)+' more</button>':'')+(!shown.length?'<p class="empty">No entries match.</p>':'')}
  el.innerHTML=h; wire()}
function editor(){const e=J.edit, ex=J.list.some(x=>x.id===e.id), val=hasAr(e.name)?abjad(e.name,false).total:null;
  return '<div class="jned" id="jnEd"><div class="flt" role="group" aria-label="Kind of entry">'+KINDS.map(([k,l])=>'<button data-jek="'+k+'" aria-pressed="'+(e.kind===k)+'">'+esc(l)+'</button>').join('')+'</div><div class="jnstamp">'+esc(stampLine(e))+'</div>'+
    '<div class="jnf"><input id="jeTitle" placeholder="Title" value="'+esc(e.title)+'" aria-label="Title"><div class="jnname"><input id="jeName" class="'+(hasAr(e.name)?'ar-in':'')+'" placeholder="Name or verse (Arabic gives its value)" value="'+esc(e.name)+'" aria-label="Name or verse"><span class="v" id="jeVal">'+(val!=null?val:'')+'</span></div><input id="jeIntent" placeholder="Intention (niyya)" value="'+esc(e.intent)+'" aria-label="Intention"><input id="jeCount" placeholder="Count · e.g. 1115 × 3" value="'+esc(e.count)+'" aria-label="Count"></div>'+
    (e.op?'<p class="meta">Operation <button class="linkbtn" id="jeOp">'+esc(e.op)+'</button></p>':'')+
    '<textarea id="jeBody" rows="5" placeholder="What you did — materials, incense, direction, state…" aria-label="What you did">'+esc(e.body)+'</textarea><textarea id="jeOut" rows="3" placeholder="Outcome and signs (add later)" aria-label="Outcome and signs">'+esc(e.outcome)+'</textarea>'+
    '<div class="jnbtns"><button class="more pri" id="jeSave">Save entry</button><button class="more" id="jeCancel">Cancel</button><button class="more" id="jeForge"'+(val==null?' hidden':'')+'>Forge its square</button>'+(ex?'<button class="more" id="jeDel" style="margin-inline-start:auto;color:var(--warn)">'+(J.delArm===e.id?'Tap again to delete':'Delete')+'</button>':'')+'</div></div>'}
function grab(){const e=J.edit; if(!e) return; const g=id=>{const x=document.getElementById(id); return x?x.value:''}; e.title=g('jeTitle'); e.name=g('jeName'); e.intent=g('jeIntent'); e.count=g('jeCount'); e.body=g('jeBody'); e.outcome=g('jeOut')}
function wire(){const $=id=>document.getElementById(id), on=(id,ev,f)=>{const x=$(id); if(x) x.addEventListener(ev,f)};
  const neu=()=>{J.edit=blank(); J.msg=''; draw(); const t=$('jeTitle'); if(t) t.focus()};
  on('jnNew','click',neu); on('jnFirst','click',neu);
  on('jnExp','click',async()=>{const ok=await saveFile('hikma-journal-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(J.list,null,1),'application/json'); J.msg=ok?'Exported '+J.list.length+' entries.':'Saving isn’t available in this view.'; draw()});
  on('jnImp','change',e=>{const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=async()=>{try{const arr=JSON.parse(r.result); if(!Array.isArray(arr)) throw 0; const have=new Set(J.list.map(x=>x.id)); const add=arr.filter(x=>x&&x.id&&x.at&&!have.has(x.id)).map(x=>Object.assign({kind:'note',title:'',name:'',intent:'',count:'',body:'',outcome:''},x,{count:x.count==null?'':String(x.count)}));
      for(const x of add) await put(x); J.msg='Imported '+add.length+' entr'+(add.length===1?'y':'ies')+(arr.length-add.length?' ('+(arr.length-add.length)+' already here)':'')+'.'}catch(z){J.msg='That file isn’t a journal export.'} draw()}; r.readAsText(f)});
  on('jnQ','input',e=>{J.q=e.target.value; J.shown=40; const p=e.target.selectionStart; draw(); const q=$('jnQ'); if(q){q.focus(); try{q.setSelectionRange(p,p)}catch(z){}}});
  document.querySelectorAll('[data-jk]').forEach(b=>b.onclick=()=>{J.kind=b.dataset.jk; J.shown=40; draw()});
  document.querySelectorAll('[data-je]').forEach(b=>b.onclick=()=>{const x=J.list.find(y=>y.id===b.dataset.je); if(x){J.edit=Object.assign({},x); J.delArm=null; J.msg=''; draw(); const ed=$('jnEd'); if(ed) ed.scrollIntoView({behavior:'smooth',block:'start'})}});
  on('jnMore','click',()=>{J.shown+=40; draw()});
  if(!J.edit) return;
  document.querySelectorAll('[data-jek]').forEach(b=>b.onclick=()=>{grab(); J.edit.kind=b.dataset.jek; draw()});
  on('jeName','input',e=>{const v=e.target.value, a=hasAr(v); e.target.classList.toggle('ar-in',a); $('jeVal').textContent=a?abjad(v,false).total:''; const fb=$('jeForge'); if(fb) fb.hidden=!a});
  on('jeSave','click',async()=>{grab(); const e=J.edit; J.edit=null; const ok=await put(e); J.msg=ok?'Saved.':'Saved on this device (the engine\'s store did not answer).'; draw()});
  on('jeCancel','click',()=>{J.edit=null; J.delArm=null; draw()});
  on('jeForge','click',()=>{grab(); const t=J.edit.name.trim(); FG.grid=null; FG.text=t; FG.num=''; FG.mode='wafq'; fgSave(); tab='forge'; render(); window.scrollTo(0,0)});
  on('jeOp','click',()=>{grab(); openOp(J.edit.op)});
  on('jeDel','click',async()=>{if(J.delArm!==J.edit.id){grab(); J.delArm=J.edit.id; draw(); return} const id=J.edit.id; J.edit=null; J.delArm=null; await del(id); J.msg='Deleted.'; draw()})}

/* open the journal with a new entry, already filled (from an operation, the forge, Ask) */
window.jnOpen=seed=>{J.edit=seed?blank(seed):null; J.msg=''; tab='day'; render(); setTimeout(()=>{const x=document.getElementById('jnEd')||root(); if(x) x.scrollIntoView({block:'start'})},150)};
window.jnLoad=()=>load(true);

/* ── where it lives: My day, after the Wird card ── */
const rT=window.renderToday||renderToday;
const renderTodayJn=function(){const r=rT.apply(this,arguments); const v=document.getElementById('view');
  if(v&&!root()){const box=document.createElement('section'); box.className='box'; box.id='jnRoot'; const w=document.getElementById('wdDay'); if(w&&w.nextSibling) v.insertBefore(box,w.nextSibling); else v.appendChild(box); draw()} return r};
renderToday=renderTodayJn; window.renderToday=renderTodayJn;
/* ── an operation's page: Write it in the journal ── */
const rO=renderOp;
renderOp=async function(){const r=await rO.apply(this,arguments); const a=document.getElementById('opAsk'); if(a&&!document.getElementById('opJn')&&OP){const o=OP.find(x=>x.id===OPD); if(o&&!o.harm&&!o.sealed){const b=document.createElement('button'); b.className='more'; b.id='opJn'; b.textContent='✎ Write it in the journal';
    b.onclick=()=>{const nm=(o.nm||[]).map(k=>M6.names[k]).filter(Boolean); window.jnOpen({kind:'working',title:o.t.slice(0,90),name:nm.length?nm[0][1].replace(/[ً-ْٰ]/g,''):'',count:(o.n||[]).join(' · '),op:o.id,body:OSRC[o.src]+' · '+o.ref+(o.m?'\nMaterials: '+o.m.map(k=>M6.mats[k]||k).join(', '):'')})};
    a.parentNode.insertBefore(b,a.nextSibling)}} return r};

/* ── Ask ── */
if(typeof AITOOLS!=='undefined') AITOOLS.push(
 {name:'read_journal',description:"Al's own journal (My day → Journal): his workings, dhikr, dreams, study and notes, each with date, planetary day and hour, lunar mansion, lunar day, Hijri date, Name/verse, intention, count, what he did and the outcome. Optional query (words), kind (working, dhikr, dream, study, note) and limit (default 20). Newest first.",inputSchema:{type:'object',properties:{query:{type:'string'},kind:{type:'string',enum:['working','dhikr','dream','study','note']},limit:{type:'number'}}},
  execute:async(i)=>{prog('Reading the journal'); const L=await load(); const fq=norm(String(i.query||'').trim()); const f=L.filter(x=>(!i.kind||x.kind===i.kind)&&(!fq||norm([x.title,x.name,x.intent,x.body,x.outcome,x.count].join(' ')).includes(fq)));
    return {total:f.length,entries:f.slice(0,Math.min(60,i.limit||20)).map(x=>({date:new Date(x.at).toISOString(),stamp:stampLine(x),kind:x.kind,title:x.title,name:x.name,name_abjad:hasAr(x.name)?abjad(x.name,false).total:null,intent:x.intent,count:x.count,did:String(x.body||'').slice(0,1500),outcome:x.outcome,operation:x.op||null,outcome_missing:needsOutcome(x)}))}}},
 {name:'write_journal',description:"Write a new entry into Al's journal, stamped now with the planetary day and hour, mansion and lunar day. Only when Al asks you to record something.",inputSchema:{type:'object',properties:{kind:{type:'string',enum:['working','dhikr','dream','study','note']},title:{type:'string'},name:{type:'string'},intent:{type:'string'},count:{type:'string'},body:{type:'string'},outcome:{type:'string'}},required:['kind','title']},
  execute:async(i)=>{prog('Writing in the journal'); await load(); const e=blank({kind:i.kind,title:i.title,name:i.name,intent:i.intent,count:i.count,body:i.body}); e.outcome=i.outcome||''; e.by='ask'; const ok=await put(e); if(tab==='day') draw(); return {written:true,synced:ok,stamp:stampLine(e)}}},
 {name:'open_journal',description:'Show Al his journal on My day, optionally with a new entry already filled in for him to check and save.',inputSchema:{type:'object',properties:{kind:{type:'string'},title:{type:'string'},name:{type:'string'},intent:{type:'string'},count:{type:'string'},body:{type:'string'}}},
  execute:async(i)=>{setTimeout(()=>window.jnOpen(i&&i.title?i:null),300); return {opened:true}}});

load().catch(()=>{});
if(tab==='day'&&!root()) renderToday();
})();
