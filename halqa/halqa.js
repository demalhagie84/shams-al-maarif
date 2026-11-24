/* ═══ al-Ḥalqa — the daily circle, ported from the Iḥyāʾ Engine (kit/tools/halqa.jsx v4.0) on 2026-11-17 ═══
   The day's practice step by step at its hour: the day's verse and Name (p.115, p.1787), the day's square at the first hour
   (pp.115–117, ch.19), the ṭarīqa wird, the day's portion of Yā-Sīn (ch.20), the lesson through the book in order, the review
   (multiple choice), the closing verse Q 36:82–83, and the journal. Between them the watch of the hours: every planetary hour
   the next of the Ninety-nine with its pages, its count, its square and a word on it; and any working Al hands him.
   Changes from A, by Al's decisions: no machine voice ever speaks Arabic (Names, verses and litanies are shown and counted on
   screen; the English lines may be read aloud by the page's voice, Arabic and transliteration skipped); the Qurʾān steps show
   the Tanzil text (quran/c*.gz.txt) until the real recitation player arrives; no Hz "atmosphere". The Study (855 lessons) is
   now ported (the Study section below; the code spliced in from kit/tools/dars.jsx on 2026-11-17). Records: the artifact's database (halqa/state, lessons/<date>, journal/<id>), else this browser. */
(function(){
'use strict';
const LSg=(k,d)=>{try{const v=localStorage.getItem(k); return v==null?d:JSON.parse(v)}catch(e){return d}};
const LSs=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const ymd=d=>{const x=new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const fmt=d=>d instanceof Date&&!isNaN(d)?fmtT(d):'—';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const HQ_ORDER={saturn:3,jupiter:4,mars:5,sun:6,venus:7,mercury:8,moon:9};
const HQ_CLOSE={ar:'إِنَّمَآ أَمْرُهُۥٓ إِذَآ أَرَادَ شَيْـًٔا أَن يَقُولَ لَهُۥ كُن فَيَكُونُ ۝ فَسُبْحَـٰنَ ٱلَّذِى بِيَدِهِۦ مَلَكُوتُ كُلِّ شَىْءٍ وَإِلَيْهِ تُرْجَعُونَ',tr:'Innamā amruhū idhā arāda shayʾan an yaqūla lahū kun fa-yakūn. Fa-subḥāna lladhī bi-yadihī malakūtu kulli shayʾin wa-ilayhi turjaʿūn.',ref:'Q 36:82–83'};
const HQ_BASMALA={ar:'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',tr:'Bismi llāhi r-raḥmāni r-raḥīm'};
const HQ_START=40;
const HQ_DONE='halqa-done',HQ_AUTO='halqaAuto',HQ_REQ='halqaRequests',HQ_HELD='halqaHeld',HQ_RESUME='halqaResume',HQ_COUNT='halqaCount',HQ_VOICE='halqaVoice';
const NUTQ_RULE='Whenever you write any Arabic (a Divine Name, a verse, a dhikr, a word), write it in Arabic script with full and correct tashkīl on every letter — never bare letters — and the Qurʾān exactly as in the Ḥafṣ reading.';
const HQ_MCQ='"questions": 3 multiple-choice review questions as [{"q": the question, "choices": [4 short options, at most 16 words each — exactly one right; the other three plausible to a student but plainly wrong by these pages, in the book\'s own terms; never "all/none of the above"], "correct": the index (0–3) of the right option, "a": one or two sentences giving the right answer as the page has it, with its page (p.N)}], answered from these pages';
const HQ_LESSON_RULES=NUTQ_RULE+' You are al-Muʿallim, Al\'s teacher of Iḥyāʾ Uṣūl al-Ḥikmah (Amin Patel\'s English compilation, 2,401 pages). Today\'s lesson is the pages given below, in the book\'s order. Write the lesson as JSON:\n{"title": short title, "teaching": the lesson in plain spoken English, 300–550 words, as you would say it aloud to one student — what these pages teach, the principle behind it, how it bears on practice, and how it follows from what came before; cite pages as p.N; no headers, no bullet points, no markdown,\n "points": 3–6 key points, each ending with its page (p.N),\n '+HQ_MCQ+',\n "practice": one small thing to observe or do today taken from these pages, with its page — or "" if the pages give none}\nRules: teach only what the pages say; where you explain beyond them, say so ("by way of explanation"). Never invent a page number, count, ingredient or name. Arabic words in transliteration. Workings aimed at harming, compelling or binding a person are named only, never explained. Medical matters: the tradition complements a doctor, never replaces one.';

/* ── data ── */
let M=null, MP=null;
const meta=()=>{if(M) return Promise.resolve(M); if(!MP) MP=xget('halqa/meta.json').then(d=>{M=d; return d}).catch(e=>{MP=null; throw e}); return MP};
if(DAY_TABLE[4]&&!DAY_TABLE[4].printed) DAY_TABLE[4].printed='ظهير';   // p.115 prints Ẓahīr; pp.411, 516 and the Ninety-nine give al-Ẓāhir (A v3.14.1)
const chapterOfPage=p=>{const c=(M&&M.chapters||[]).find(c=>p>=c.from&&p<=c.to); return c?c.ch:0};
/* the Qurʾān text (Tanzil Uthmani), carried gzip+base64 as in the Iḥyāʾ Engine */
const QF={}; let QIDX=null;
async function qrJson(path){const r=await fetch(path); if(!r.ok) throw new Error(r.status+' '+path); let b=new Uint8Array(await r.arrayBuffer());
  if(b[0]!==0x1f&&b[0]!==0x7b&&b[0]!==0x5b){const t=new TextDecoder().decode(b).trim(); if(/^[A-Za-z0-9+/=\s]+$/.test(t.slice(0,200))){const bin=atob(t); b=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i)}}
  if(b[0]===0x1f&&b[1]===0x8b) return JSON.parse(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
  return JSON.parse(new TextDecoder().decode(b))}
const qrIndex=()=>{if(!QIDX) QIDX=qrJson('quran/index.json').catch(e=>{QIDX=null; throw e}); return QIDX};
async function qrAyat(s,a,to){const I=await qrIndex(); const c=I.core.find(x=>s>=x.from&&s<=x.to); if(!QF[c.f]) QF[c.f]=qrJson(c.f).catch(e=>{delete QF[c.f]; throw e}); const d=await QF[c.f];
  return (d[s]||[]).filter(x=>x[0]>=a&&x[0]<=(to||a)).map(x=>({a:x[0],ar:x[1],tr:x[2],en:x[3]}))}
window.hqQuran=qrAyat;

/* ── the database: never trusted to answer (A v3.13–3.14) ── */
let HQ_DB; const HQ_UNREAD=new Set(), HQ_RETRY={};
const hqWait=(p,ms)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),ms); Promise.resolve(p).then(v=>{clearTimeout(t); res(v)},e=>{clearTimeout(t); rej(e)})});
async function hqDb(){if(HQ_DB!==undefined) return HQ_DB; try{HQ_DB=(await hqWait(cuse('db'),10000))||null}catch(e){if(e&&e.message==='timeout') return null; HQ_DB=null} return HQ_DB}
async function hqGet(path){const db=await hqDb(); if(!db) return null;
  for(let k=0;k<3;k++){try{const s=await hqWait(db.doc(path).get(),12000); HQ_UNREAD.delete(path); return s.exists?s.data():null}catch(e){if(k<2) await sleep(400*(k+1))}}
  HQ_UNREAD.add(path); return null}
async function hqSet(path,v,merge,onMerged){const db=await hqDb(); if(!db) return false;
  if(HQ_UNREAD.has(path)){const now=Date.now(); if(now-(HQ_RETRY[path]||0)<60000) return false; HQ_RETRY[path]=now; const remote=await hqGet(path); if(HQ_UNREAD.has(path)) return false;
    if(remote){if(!merge) return false; try{v=merge(remote,v)}catch(e){return false} if(onMerged){try{onMerged(v)}catch(e){}}}}
  try{await hqWait(db.doc(path).set(JSON.parse(JSON.stringify(v))),15000); return true}catch(e){return false}}
/** the course pointer joined from two copies: the furthest page, the furthest Name, every day-lesson once */
function hqMergeState(a,b){a=a||{}; b=b||{}; const hist=new Map(); for(const h of [...(a.history||[]),...(b.history||[])]) if(h&&h.date) hist.set(h.date+'|'+h.from,h);
  const later=(a.updatedAt||'')>(b.updatedAt||'')?a:b;
  const o=Object.assign({},a,b,later,{history:[...hist.values()].sort((x,y)=>(x.date+String(x.from).padStart(5,'0'))<(y.date+String(y.from).padStart(5,'0'))?-1:1).slice(-200)});
  for(const k of ['next','nameNext']){const m=Math.max(+a[k]||0,+b[k]||0); if(m) o[k]=m; else delete o[k]} return o}
window.hqMergeState=hqMergeState;

/* ── the book's pages, from the engine's reading text (ihya/search.json: [chapter, page, kind, text]) ── */
async function hqPages(from,to){const s=await xget('ihya/search.json'); return s.filter(x=>x[1]>=from&&x[1]<=to&&x[2]!=='src'&&String(x[3]).trim()!=='· · ·').map(x=>({p:x[1],k:x[2],t:x[3]}))}
async function hqRange(p0){await meta(); let p=Math.max(1,Math.min(2401,p0||HQ_START)); const C=M.chapters.find(c=>p>=c.from&&p<=c.to)||M.chapters[0];
  const nextHead=M.outline.map(o=>o.p).filter(q=>q>p).sort((a,b)=>a-b)[0]||9999;
  const paras=await hqPages(p,Math.min(C.to,p+5)); const len=q=>paras.filter(x=>x.p===q&&x.t).reduce((a,x)=>a+x.t.length,0);
  let to=p,total=len(p); while(to<C.to&&to+1<nextHead&&to-p<4&&(to-p<1||total<1500)){to++; total+=len(to)}
  const head=[...M.outline].filter(o=>o.p<=p).sort((a,b)=>b.p-a.p)[0];
  return {ch:C.ch,from:p,to,heading:head?head.t:C.title}}
window.hqRange=hqRange;

/* ── the heavens for Al's place (My day's place and method) ── */
const tzOf=d=>-d.getTimezoneOffset()/60;
function hoursFor(date){const noon=new Date(date); noon.setHours(12,0,0,0); const [,lat,lon]=TD.loc; const H=planetaryHoursAt(noon,lat,lon,tzOf(noon),TD.method); return {hours:H.hours||[],ruler:DAY_RULERS[date.getDay()]}}
function hqHourNow(now){const [,lat,lon]=TD.loc; const H=planetaryHoursAt(now,lat,lon,tzOf(now),TD.method); const i=(H.hours||[]).findIndex(h=>now>=h.start&&now<h.end); return i<0?null:{h:H.hours[i],i,ruler:H.ruler,day:H.sunrise,hours:H.hours}}
function prayersOf(date){const mid=new Date(date); mid.setHours(0,0,0,0); const [,lat,lon]=TD.loc; try{const p=prayerTimes(mid,lat,lon,tzOf(mid),TD.method); return p.polar?null:p}catch(e){return null}}
function hqWorld(now){const H=hqHourNow(now), Z=manzilNow(now), Mo=moon(now); let next=null; const p=prayersOf(now);
  if(p){const mid=new Date(now); mid.setHours(0,0,0,0); next=[['Fajr',p.fajr],['Ẓuhr',p.dhuhr],['ʿAṣr',p.asr],['Maghrib',p.maghrib],['ʿIshāʾ',p.isha]].map(([k,h])=>[k,new Date(mid.getTime()+h*3600e3)]).find(([,t])=>t>now)||null}
  return {H,Z,M:Mo,mz:MZN[Z.n-1],next}}
const hqOrdinal=k=>['','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'][k]||k+'th';
const plName=p=>p==='sun'||p==='moon'?'the '+p:p.charAt(0).toUpperCase()+p.slice(1);

/* ── the ṭarīqa wird (tools/tariqa.jsx) ── */
const tqKey=()=>{const k=LSg('tariqa','naqshbandi'); return M&&M.tariqa[k]?k:'naqshbandi'};
const tqYasin=W=>{const m=String(W.yasin).match(/36:(\d+)\D+(\d+)/); return m?[+m[1],+m[2]]:[1,12]};
function tqScript(key){const T=M.tariqa[key]||M.tariqa.naqshbandi, out=[{t:'say',text:'The '+T.name+' wird. '+T.src.split(';')[0]+'.'}];
  for(const it of T.items){
    if(it.bayah) continue;
    if(it.say){out.push({t:'say',text:it.say}); continue}
    if(it.parts){out.push({t:'say',text:it.label.replace('Duʿā','The duʿā of')+'.'}); it.parts.forEach(([ar,tr],i)=>out.push({t:'recite',ar,tr,times:1,label:it.label+' · '+(i+1)+' of '+it.parts.length,prov:'the Ḥaqqānī prayer book · recited with the shaykh\'s idhn'})); continue}
    if(it.q){for(let i=0;i<it.n;i++) out.push({t:'recite',ar:it.ar,tr:it.label,times:1,label:it.label+(it.n>1?' · '+(i+1)+' of '+it.n:''),q:{s:it.q[0],a:it.q[1],to:it.q[2]}}); continue}
    out.push({t:'recite',ar:it.ar,tr:it.tr,times:it.n,label:it.label+' × '+it.n,prov:T.src});
    if(it.afterAr) out.push({t:'recite',ar:it.afterAr,tr:it.after.replace(/^[^:]*:\s*/,'').replace('ﷺ',''),times:1,label:it.after.replace(/^[^:]*:\s*/,'')});
    else if(it.after) out.push({t:'say',text:it.after.replace('ﷺ','')})}
  return out}

/* ── the Ninety-nine (DATA.names: o, tr, en, ab bare, aw with al-, mb, mw, p) ── */
const hqNorm=s=>{const t=String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/^\s*(ya\s+)?(a[lnrstdz]{1,2}|el|ul)[\s\-–]+/,'');
  const u=t.replace(/[ʿʾ'’`ˁ\-–_.,\s]/g,'').replace(/^ya(?=[a-z])/,''); return /^allah/.test(u)?u:u.replace(/^al(?=[a-z])/,'').replace(/^ar(?=r)|^as(?=s)|^ash(?=sh)|^at(?=t)|^ad(?=d)|^an(?=n)|^az(?=z)/,'')};
const hqArNorm=s=>String(s||'').replace(/[ً-ٰٟـ]/g,'').replace(/\s+/g,'').replace(/^يا/,'').replace(/^ال/,'');
function hqFindName(q){const t=String(q||'').trim(); if(!t||!M) return null; const N=M.names;
  if(/[؀-ۿ]/.test(t)){const a=hqArNorm(t); return N.find(x=>hqArNorm(x.ab)===a||hqArNorm(x.aw||'')===a)||null}
  const m=t.match(/^#?(\d{1,2})$/); if(m) return N.find(x=>x.o===+m[1])||null;
  const k=hqNorm(t); if(k.length<2) return null;
  return N.find(x=>hqNorm(x.tr)===k)||N.find(x=>hqNorm(x.en)===k||hqNorm(x.en.replace(/^the/i,''))===k)||N.find(x=>hqNorm(x.tr).startsWith(k)&&k.length>=4)||null}
window.hqFindName=hqFindName;
function hqNamePages(nm){if(!nm||!nm.p) return null; const later=M.names.map(x=>x.p).filter(p=>p&&p>nm.p).sort((a,b)=>a-b)[0]; return [nm.p,Math.max(nm.p,Math.min((later||nm.p+1)-1,nm.p+2))]}
/** the square for a value at an order, by the first rule; below that floor, with the article, then the largest order it fills, then the 3×3 second rule (p.1705) */
function hqSquareFor(A,Aw,n){const tries=[];
  const ok=(v,k)=>{const w=wafq(v,k); if(!w.error){const cs=checkSums(w.grid); if(cs.rows&&cs.rows.every(x=>x===v)) return toVisual(w.grid)} tries.push(v+' on the '+k+'×'+k+': '+(w.error||'does not close')); return null};
  let g=ok(A,n); if(g) return {grid:g,n,A,rule:'the '+n+'×'+n+' by the first rule (ch.19)'};
  if(Aw&&Aw!==A){g=ok(Aw,n); if(g) return {grid:g,n,A:Aw,rule:'the '+n+'×'+n+' on the Name with its article, '+Aw+', by the first rule — '+A+' is below this square\'s floor',tries}}
  for(let k=9;k>=3;k--){if(k===n) continue; g=ok(A,k); if(g) return {grid:g,n:k,A,rule:'the '+k+'×'+k+' by the first rule — '+A+' is below the '+n+'×'+n+' floor, so the largest square it fills',tries}}
  if(A>=5){const r=three_second(A); return {grid:r.grid,n:3,A,constant:3*A,rule:'the 3×3 by the second rule (p.1705): '+A+' in the centre, each line '+(3*A)+' — '+A+' is below every first-rule floor',tries}}
  return {error:A+' is too small for any square',tries}}
window.hqSquareFor=hqSquareFor;

/* ── the day's program ── */
function hqProgram(date){
  const di=date.getDay(), D=DAY_TABLE[di], C=M.ch20[di]; const {hours,ruler}=hoursFor(date);
  const mid=new Date(date); mid.setHours(0,0,0,0); const PT=prayersOf(date);
  const at=(h,fb)=>new Date(mid.getTime()+((h==null||isNaN(h))?fb:h)*3600e3);
  const P=PLANETS[ruler]||{}, n=HQ_ORDER[ruler], A=abjad(D.name).total, h1=hours[0];
  const names=C.names.filter(x=>x[1]); const TK=tqKey(), T=M.tariqa[TK]; const [ya,yb]=tqYasin(C);
  const fa=Math.min(7,di+2);
  const steps=[
    {id:'verse',at:at(PT&&PT.fajr,5.5),when:'after Fajr',title:'The day\'s verse and its Name',cite:'p.115 · p.1787',
     why:'The table of p.115 gives '+D.d+' the Name '+D.nameTr+' ('+D.name+')'+(D.printed?' (it prints '+D.printed+'; the same set on pp.411 and 516, and the Ninety-nine, give '+D.name+')':'')+', the angel '+D.angelTr+', the colour '+D.colour+' and the incense '+D.incense+'; p.1787 gives it its verse of al-Fātiḥa.',
     script:[{t:'say',text:'It is '+D.d+', the day of '+plName(ruler)+'. The book gives this day the Name '+D.nameTr+', the angel '+D.angelTr+', the colour '+D.colour+', and the incense '+D.incense+'. It is on page one hundred and fifteen.'},
       {t:'recite',ar:HQ_BASMALA.ar,tr:HQ_BASMALA.tr,times:1,label:'the Basmala',q:{s:1,a:1,to:1}},
       {t:'say',text:'The day\'s verse of al-Fātiḥa, from page seventeen eighty-seven.'},
       {t:'recite',ar:D.fatiha,tr:'Q 1:'+fa,times:1,label:'the day\'s verse of al-Fātiḥa',q:{s:1,a:fa,to:fa}},
       {t:'say',text:'Now the day\'s Name, called by its number. '+D.nameTr+' is '+A+' by the letters, so it is said '+A+' times. Watch the count.'},
       {t:'recite',ar:'يا '+D.name,tr:'Yā '+D.nameTr.replace(/^al-/,''),times:A,label:'Yā '+D.nameTr.replace(/^al-/,'')+' × '+A,prov:A+' = the abjad of '+D.name+', recomputed — the tradition\'s way of counting a Name, as the Iḥyāʾ Engine\'s Asmāʾ uses it; p.115 gives the Name, not this count.'}]},
    {id:'square',at:h1?h1.start:at(null,6.5),when:'the first hour ('+(P.g||'')+' '+ruler+') at sunrise',title:'The day\'s square — '+ruler+' '+n+'×'+n+' on '+D.nameTr,cite:'pp.115–117 · ch.19',
     why:'The first hour of the day belongs to the day\'s ruler (pp.115–117). The '+ruler+' square is the '+n+'×'+n+'; it is built here on the day\'s Name, '+A+', by the book\'s first rule (ch.19), and the cells are written in the order of their numbers, as Durūs lesson 3 teaches.',
     script:[{t:'say',text:'This is the first hour of the day, the hour of '+ruler+', its ruler. I will build the '+ruler+' square, '+n+' by '+n+', on '+D.nameTr+', '+A+', by the first rule of chapter nineteen, and write the cells in the order of their numbers.'},{t:'grid',A,n,text:D.name,label:ruler+' '+n+'×'+n+' · '+D.nameTr+' '+A}],
     forge:{text:D.name,order:n,label:D.d+'\'s square · '+ruler+' '+n+'×'+n}},
    {id:'wird',at:new Date(at(PT&&PT.fajr,5.5).getTime()+20*60e3),when:'after Fajr',title:'The '+T.name+' wird',cite:'the Sufi orders',
     why:T.full+': '+T.src+'. Chosen below; it takes the place of chapter 20\'s invocations, which stay in the book as its text.',script:tqScript(TK)},
    {id:'litany',at:hours[2]?hours[2].start:at(null,9),when:'mid-morning, the third hour ('+(hours[2]?hours[2].planet:'')+')',title:D.d+'\'s portion of Yā-Sīn',cite:'Q '+C.yasin+' · ch.20 rotation',
     why:'Chapter 20 gives each day its portion of Yā-Sīn ('+C.yasin+'), every day closing on Q 36:82–83. The Qurʾān alone; the litany\'s calls on angels and jinn kings are not performed (A v3.12).',
     script:[{t:'say',text:D.d+'\'s portion of Yā Sīn, '+C.yasin.replace('36:','verses ').replace('–',' to ')+'.'},{t:'recite',ar:'يس',tr:'Yā-Sīn '+C.yasin,times:1,label:'Yā-Sīn '+C.yasin,q:{s:36,a:ya,to:yb}},
       ...(names.length?[{t:'say',text:'The Names of Allah the day calls upon:'},...names.map(([tr,ar])=>({t:'recite',ar:'يا '+(ar==='الله'?ar:ar.replace(/^ال/,'')),tr:'Yā '+tr.replace(/^al-/,''),times:1,label:tr}))]:[])]},
    {id:'lesson',at:at(PT&&PT.dhuhr,13),when:'after Ẓuhr',title:'Today\'s lesson',cite:'the book in order',
     why:'One lesson a day through the whole book in its order, beginning with the Prologue on the conditions of the science (p.40). The teacher reads the pages, then teaches them.',script:[{t:'lesson'}]},
    {id:'review',at:at(PT&&PT.asr,16),when:'after ʿAṣr',title:'Review',cite:'today\'s pages',
     why:'The lesson\'s questions, multiple choice: four answers each — tap one or press 1–4 — then the answer as the page gives it.',script:[{t:'quiz'}]},
    {id:'close',at:at(PT&&PT.maghrib,18),when:'after Maghrib',title:'The closing verse',cite:'pp.'+C.pp[0]+'–'+C.pp[1]+' · '+HQ_CLOSE.ref,
     why:'Every day of chapter 20 closes on '+HQ_CLOSE.ref+'; '+D.d+'\'s own sealing verse is Q '+C.seal+'.',
     script:[{t:'say',text:'Every day of chapter twenty closes on Yā Sīn, verses eighty-two and eighty-three. '+D.d+'\'s own sealing verse is chapter '+C.seal.split(':')[0]+', verse '+C.seal.split(':')[1].replace('–',' to ')+'.'},{t:'recite',ar:HQ_CLOSE.ar,tr:HQ_CLOSE.tr,times:1,label:HQ_CLOSE.ref,q:{s:36,a:82,to:83}}]},
    {id:'journal',at:at(PT&&PT.isha,20),when:'after ʿIshāʾ',title:'The day written down',cite:'your journal',
     why:'The teacher writes what was performed today into your journal, stamped with the day, hour and mansion.',script:[{t:'journal'}]}];
  return steps.sort((x,y)=>x.at-y.at)}
window.hqProgram=d=>hqProgram(d||new Date());

/** one hour's session, or a working Al asked for */
function hqWorkSession({id,title,nm,text,value,order,world,why,cite,hourLabel}){const script=[];
  if(world){const {H,M:Mo,mz,next,Z}=world, pl=H?H.h.planet:'', day=H?DAY_TABLE[H.day.getDay()].d:''; const nightOf=H&&H.i>=12;
    script.push({t:'say',text:'This is the '+hqOrdinal((H?H.i%12:0)+1)+' hour of the '+(nightOf?'night':'day')+' of '+day+', the hour of '+(pl?plName(pl):'')+(H?', until '+fmt(H.h.end):'')+'. The moon is '+Math.round(Mo.illum*100)+' percent lit, '+Mo.phase+', in its '+hqOrdinal(Z.n)+' mansion'+(mz?', '+mz[1]:'')+'.'+(next?' The next prayer is '+next[0]+', at '+fmt(next[1])+'.':'')})}
  let A=value,Aw=null,label=text;
  if(nm){A=nm.mb; Aw=nm.mw; label=nm.tr; const pp=hqNamePages(nm);
    script.push({t:'say',text:(world?'The Name for this hour:':'You asked for')+' '+nm.tr+', '+nm.en+', '+(nm.o<=12?'the '+hqOrdinal(nm.o):'number '+nm.o)+' of the ninety-nine. By its letters it is '+nm.mb+(nm.mw&&nm.mw!==nm.mb?', and with its article '+nm.mw:'')+'.'+(pp?' The book gives it on page '+pp[0]+'.':'')});
    if(pp) script.push({t:'read',from:pp[0],to:pp[1],label:nm.tr+' · p.'+pp[0]+(pp[1]>pp[0]?'–'+pp[1]:''),only:nm});
    script.push({t:'recite',ar:'يا '+nm.ab,tr:'Yā '+nm.tr.replace(/^al-|^a[a-z]-/,''),times:nm.mb,label:'Yā '+nm.tr.replace(/^al-/,'')+' × '+nm.mb,prov:nm.mb+' = the abjad of '+nm.ab+', recomputed — the tradition\'s way of counting a Name; p.'+nm.p+' gives the Name and its virtues, not this count.'})}
  else if(text){A=abjad(text).total; script.push({t:'say',text:'You asked for '+text+'. By its letters it is '+A+'.'})}
  else script.push({t:'say',text:'You asked for the number '+A+'.'});
  const sq=hqSquareFor(A,Aw,order);
  if(sq.error) script.push({t:'say',text:A+' is too small for any square.'});
  else{script.push({t:'say',text:'Now the square: '+sq.rule.replace(/\s*\((ch\.19|p\.1705)\)/g,'')+'. I write the cells in the order of their numbers.'}); script.push({t:'grid',grid:sq.grid,A:sq.A,n:sq.n,label:label+' · '+sq.n+'×'+sq.n+' · '+sq.A})}
  if(nm) script.push({t:'reflect',nm});
  script.push({t:'say',text:world?'The hour is kept.':'It is done. The square is waiting in the Forge if you want to write it out.'});
  return {id,title,script,at:new Date(),when:hourLabel||'now',cite:cite||(nm?'p.'+nm.p+' · ch.16':'ch.19'),why:why||'',
    work:sq.error?null:{label,A:sq.A,n:sq.n,rule:sq.rule,grid:sq.grid,nm:nm?{o:nm.o,tr:nm.tr,ab:nm.ab,p:nm.p}:null},
    forge:nm?{text:nm.ab,order:sq.error?order:sq.n,label:nm.tr+' · '+sq.n+'×'+sq.n}:text?{text,order:sq.n,label:text}:{value:A,order:sq.n,label:String(A)}}}

/* ── local records ── */
const hqLoadDone=k=>(LSg(HQ_DONE,{})[k]||[]);
const hqMarkDone=(k,id)=>{const all=LSg(HQ_DONE,{}); const l=new Set(all[k]||[]); l.add(id); const keep=Object.keys(all).sort().slice(-30); const n={}; keep.forEach(x=>n[x]=all[x]); n[k]=[...l]; LSs(HQ_DONE,n); return n[k]};
const hqResumeAll=()=>{const r=LSg(HQ_RESUME,null); return r&&typeof r==='object'&&!r.id?r:{}};
const hqResumeGet=(k,id)=>{const r=hqResumeAll()[id]; return r&&r.day===k?r:null};
const hqResumeSet=(k,id,ai,sub)=>{const all=hqResumeAll(); all[id]={day:k,id,ai,sub,at:Date.now()}; const ks=Object.keys(all).sort((a,b)=>all[b].at-all[a].at).slice(0,12); const n={}; ks.forEach(x=>n[x]=all[x]); LSs(HQ_RESUME,n)};
const hqResumeClear=id=>{const all=hqResumeAll(); delete all[id]; LSs(HQ_RESUME,all)};

/* ── state of the circle ── */
const S={db:undefined,sample:undefined,tts:undefined,state:null,lesson:undefined,past:[],busy:'',err:'',run:null,prog:[],dkey:'',reqs:LSg(HQ_REQ,[]),lastWork:LSg('halqaLastWork',null),askErr:'',hand:'',quiz:null};
window.HQS=S;
let tok=0, running=false, composing=null, ansFn=null, tapFn=null, skipFn=null, ttsSkipped=false;
const live=t=>tok===t;
const voiceOn=()=>LSg(HQ_VOICE,false)&&!!S.tts;
async function speakOrRead(text,t,ms){if(!live(t)) return false; const words=String(text).split(/\s+/).length; const read=ms||Math.max(1600,words*300);
  if(voiceOn()){const say=englishOnly(text); if(say.replace(/[\s…]/g,'').length>2){const parts=say.match(/[^.!?]+[.!?]*\s*/g)||[say]; let chunk=''; const chunks=[]; for(const p of parts){if((chunk+p).length>1800){chunks.push(chunk); chunk=''} chunk+=p} if(chunk) chunks.push(chunk);
      ttsSkipped=false; try{for(const c of chunks){if(!live(t)) return false; await S.tts.speak(c,{language:'en'})} return live(t)}catch(e){if(!live(t)) return false; if(ttsSkipped||(e&&e.code==='viewer_stopped')){ttsSkipped=false; return true}}}}
  return waitFor(read,t)}
function waitFor(ms,t){return new Promise(res=>{const st=Date.now(); let skip=false; skipFn=()=>{skip=true}; const iv=setInterval(()=>{if(!live(t)||skip||Date.now()-st>=ms){clearInterval(iv); skipFn=null; res(live(t))}},120)})}
function skipNow(){if(S.tts&&running){ttsSkipped=true; try{S.tts.stop()}catch(e){}} if(skipFn) skipFn()}
const arLetters=s=>[...String(s)].filter(c=>/[ء-ي]/.test(c)).length;
function show(x){S.run=Object.assign({},S.run||{},x); drawStage(); drawMini()}

async function perform(step,opts){opts=opts||{};
  if(!opts.auto){LSs(HQ_HELD,null)}
  const t=++tok; running=true; try{S.tts&&S.tts.stop&&S.tts.stop()}catch(e){}
  const dkey=ymd(new Date());
  S.run={id:step.id,title:step.title,label:step.title}; drawStage(); drawMini(); drawDay();
  const R0=opts.resume?hqResumeGet(dkey,step.id):null; let L=S.lesson, interrupted=false;
  const clean={line:null,ar:null,tr:null,en:null,qr:false,q:null,count:null,of:null,grid:null,lit:null,cur:null,para:null,quiz:null,answer:null,prov:null,pause:null};
  try{
    for(let ai=0;ai<step.script.length;ai++){const a=step.script[ai]; if(!live(t)) return false;
      const from=R0&&R0.ai===ai?(R0.sub||0):0; if(R0&&ai<R0.ai) continue; hqResumeSet(dkey,step.id,ai,from);
      if(a.t==='say'){show(Object.assign({},clean,{line:a.text})); if(!(await speakOrRead(a.text,t))) return false}
      else if(a.t==='recite'){const times=a.times||1;
        if(a.q){let ay=[]; try{ay=await qrAyat(a.q.s,a.q.a,a.q.to)}catch(e){} if(!live(t)) return false;
          const text=ay.length?ay.map(x=>x.ar+' ﴿'+toIndic(x.a)+'﴾').join(' '):a.ar;
          show(Object.assign({},clean,{ar:text,tr:ay.length?ay.map(x=>x.tr).join(' '):a.tr,en:ay.length?ay.map(x=>x.en).join(' '):'',count:1,of:1,label:a.label,prov:'Qurʾān '+a.q.s+':'+a.q.a+(a.q.to>a.q.a?'–'+a.q.to:'')+' · Tanzil Uthmani text · read it yourself; the real recitation (al-ʿAfāsī, al-Ḥuṣarī, al-Minshāwī) arrives with the recitation player — no machine voice reads the Qurʾān',qr:true}));
          if(!(await waitFor(Math.max(4000,arLetters(text)*85),t))) return false; await sleep(250); continue}
        const mode=LSg(HQ_COUNT,'auto'), per=Math.max(900,arLetters(a.ar)*110);
        show(Object.assign({},clean,{ar:a.ar,tr:a.tr,of:times,count:from,label:a.label,prov:a.prov}));
        for(let k=from+1;k<=times;k++){if(!live(t)) return false;
          if(mode==='tap'){const ok=await new Promise(res=>{tapFn=n=>res(n||1); const iv=setInterval(()=>{if(!live(t)){clearInterval(iv); res(0)}},200)}); tapFn=null; if(!ok||!live(t)) return false; k=Math.min(times,k+ok-1)}
          else if(!(await waitFor(per,t))) return false;
          show({count:k}); if(k%10===0||k===times) hqResumeSet(dkey,step.id,ai,k)}
        await sleep(350)}
      else if(a.t==='grid'){const g=a.grid||(()=>{const w=wafq(a.A,a.n); return w.error?null:toVisual(w.grid)})();
        if(!g){const m='The '+a.n+'×'+a.n+' cannot take '+a.A+' by the first rule.'; show(Object.assign({},clean,{line:m})); if(!(await speakOrRead(m,t))) return false; continue}
        const cs=checkSums(g), cells=g.flatMap((row,i)=>row.map((v,j)=>[v,i,j])).sort((x,y)=>x[0]-y[0]); const litAt=m=>cells.slice(0,m+1).map(([,i,j])=>i+','+j);
        const n=g.length, stepMs=n<=4?520:n<=6?380:230;
        show(Object.assign({},clean,{grid:g,lit:litAt(from-1),cur:null,label:a.label}));
        for(let m=from;m<cells.length;m++){if(!(await waitFor(stepMs,t))) return false; const [,ci,cj]=cells[m]; show({lit:litAt(m),cur:ci+','+cj}); if(m%8===0) hqResumeSet(dkey,step.id,ai,m)}
        const msg='Every row and every column comes to '+(cs.rows?cs.rows[0]:a.A)+(cs.diagonals?', and both diagonals too':'')+'. The square is checked.';
        show({line:msg,cur:null}); if(!(await speakOrRead(msg,t))) return false; await sleep(800)}
      else if(a.t==='read'){show(Object.assign({},clean,{line:'Opening the book at p.'+a.from+'…'})); let paras=await hqPages(a.from,a.to); if(!live(t)) return false;
        if(a.only){const k=paras.findIndex(x=>x.t&&(x.t.includes(a.only.tr)||x.t.includes(a.only.ab))); if(k>0) paras=paras.slice(k)}
        for(let i=from;i<paras.length;i++){const x=paras[i]; const para=x.k==='seal'?{p:x.p,k:'p',t:'A sealed working is named here; its method is not carried.'}:x;
          show({line:null,para,label:a.label+' · p.'+x.p}); hqResumeSet(dkey,step.id,ai,i); if(!(await speakOrRead(para.t,t))) return false}
        show({para:null})}
      else if(a.t==='lesson'){
        if(!L){show(Object.assign({},clean,{line:'Preparing today\'s lesson… (Claude is writing it from the pages)'})); L=await compose(); if(!live(t)) return false}
        if(!L){show({line:'Today\'s lesson isn\'t ready — compose it from the lesson card below.'}); interrupted=true; return false}
        show(Object.assign({},clean,{line:'Opening the book at p.'+L.from+'…'})); const paras=await hqPages(L.from,L.to); if(!live(t)) return false;
        const items=[{text:'Today\'s lesson: '+L.title+'. Pages '+L.from+(L.to>L.from?' to '+L.to:'')+'. First the book itself.',label:'Today\'s lesson'}];
        for(const x of paras){if(x.k==='seal') continue; items.push({text:x.t,para:x})}
        items.push({text:'Now let me teach it.',label:'the teaching'}); for(const part of String(L.teaching||'').split(/\n+/).filter(Boolean)) items.push({text:part,label:'the teaching'});
        if(L.practice) items.push({text:'For today: '+L.practice,label:'for today'});
        for(let i=from;i<items.length;i++){const it=items[i]; show(it.para?{line:null,para:it.para,label:'the book · p.'+it.para.p}:{para:null,line:it.text,label:it.label}); hqResumeSet(dkey,step.id,ai,i); if(!(await speakOrRead(it.text,t))) return false}
        show({para:null})}
      else if(a.t==='quiz'){
        if(!L||!(L.questions||[]).length){const m='There is no lesson to review yet today.'; show(Object.assign({},clean,{line:'No lesson has been given today yet, so there is nothing to review.'})); if(!(await speakOrRead(m,t))) return false; continue}
        if(L.questions.some(q=>!q.choices)&&S.sample){show(Object.assign({},clean,{line:'Setting four answers to each question…',label:'Review'}));
          try{const need=L.questions.map((q,i)=>[q,i]).filter(([q])=>!q.choices); const r=await S.sample.json([{role:'user',content:'You prepare multiple-choice review questions for a lesson on Iḥyāʾ Uṣūl al-Ḥikmah. For each question below, keep its right answer exactly in meaning (shortened to at most 16 words) and add three wrong options that are plausible to a student but plainly wrong by the lesson, in the book\'s own terms; never "all/none of the above". Return JSON {"items":[{"i": the question number given, "choices": [4 options], "correct": index 0–3 of the right one}]}.\n\nLesson: '+L.title+' (pp.'+L.from+'–'+L.to+')\n'+String(L.teaching||'').slice(0,6000)+'\n\nQuestions:\n'+need.map(([q,i])=>i+'. Q: '+q.q+'\n   Right answer: '+q.a).join('\n')}],{modelTier:'default',cache:false});
            for(const it of (r&&r.items)||[]){const q=L.questions[+it.i]; if(!q||q.choices) continue; const n=dsNormQ({q:q.q,a:q.a,choices:it.choices,correct:it.correct}); if(n&&n.choices){q.choices=n.choices; q.correct=n.correct}}
            S.lesson=L; await saveLesson(L)}catch(e){} if(!live(t)) return false}
        const tally=LSg('halqaQuiz',{}); const day=tally[dkey]||{right:0,asked:0};
        for(let k=from;k<L.questions.length;k++){const q=L.questions[k]; if(!live(t)) return false;
          if(!q.choices){show(Object.assign({},clean,{line:'Question '+(k+1)+': '+q.q+' — answer it to yourself, then press Next for the page\'s answer (four choices need Claude, inside the Claude app).',label:'Review'})); if(!(await waitFor(30000,t))) return false; show({line:'Question '+(k+1)+': '+q.q,answer:q.a}); if(!(await speakOrRead(q.a,t))) return false; continue}
          const order=q.choices.map((c,i)=>i); for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]}
          show(Object.assign({},clean,{label:'Review · question '+(k+1)+' of '+L.questions.length,quiz:{q:q.q,order,choices:q.choices,correct:q.correct,picked:null}}));
          if(!(await speakOrRead('Question '+(k+1)+'. '+q.q,t))) return false;
          const pick=await new Promise(res=>{ansFn=v=>res(v); const iv=setInterval(()=>{if(!live(t)){clearInterval(iv); res(null)}},200)}); ansFn=null; if(pick==null||!live(t)) return false;
          day.asked++; if(pick===q.correct) day.right++; tally[dkey]=day; LSs('halqaQuiz',tally);
          show({quiz:Object.assign({},S.run.quiz,{picked:pick}),answer:(pick===q.correct?'Right. ':'Not quite — the answer is '+'ABCDE'[order.indexOf(q.correct)]+'. ')+q.a});
          hqResumeSet(dkey,step.id,ai,k+1); if(!(await speakOrRead((pick===q.correct?'Right. ':'Not quite. ')+q.a,t))) return false; if(!(await waitFor(2200,t))) return false}
        show({quiz:null,answer:null})}
      else if(['unit','reteach','cards','overview','recap','pause'].includes(a.t)){if(!(await dsAct(a,{t,from,step,dkey,ai,clean}))){if(step.failed) interrupted=true; return false}}
      else if(a.t==='reflect'){const cache=LSg('halqaReflect',{}); let txt=cache[a.nm.o];
        if(!txt&&S.sample){show(Object.assign({},clean,{line:'A word on it…'}));
          try{const pp=hqNamePages(a.nm), paras=pp?await hqPages(pp[0],pp[1]):[]; const src=paras.filter(x=>x.t).map(x=>'[p.'+x.p+'] '+x.t).join('\n').slice(0,9000);
            const r=await S.sample.json([{role:'user',content:NUTQ_RULE+' You are al-Muʿallim, a master of the Shādhilī way teaching one student, Al, from Iḥyāʾ Uṣūl al-Ḥikmah. In 110–170 words of plain spoken English, no markdown, give a short teaching on the Divine Name '+a.nm.tr+' ('+a.nm.ab+', '+a.nm.en+', abjad '+a.nm.mb+') from the book\'s pages below: what the Name means, what the book says of its virtue and use (cite p.N), and the inner adab of calling on it. Teach only what the pages say; anything beyond them is said as "by way of explanation". Harmful uses are never explained. Return JSON {"teaching": "..."}.\n\n'+src}],{modelTier:'default',cache:false});
            txt=String((r&&r.teaching)||''); if(txt){const c=LSg('halqaReflect',{}); c[a.nm.o]=txt; const ks=Object.keys(c); if(ks.length>120) delete c[ks[0]]; LSs('halqaReflect',c)}}catch(e){}
          if(!live(t)) return false}
        if(txt){show({line:txt,label:'the teaching'}); if(!(await speakOrRead(txt,t))) return false}}
      else if(a.t==='journal'){const d=new Date(), D=DAY_TABLE[d.getDay()], H=hqHourNow(d), ids=hqLoadDone(dkey);
        const body=['Performed in the daily circle: '+S.prog.filter(s=>ids.includes(s.id)||s.id==='journal').map(s=>s.title).join('; ')+'.',
          'The day\'s Name '+D.nameTr+' ('+D.name+') × '+abjad(D.name).total+'; verse of al-Fātiḥa (p.1787); Yā-Sīn '+M.ch20[d.getDay()].yasin+'; the '+M.tariqa[tqKey()].name+' wird.',
          L?'Lesson: '+L.title+' (pp.'+L.from+'–'+L.to+').':'No lesson today.'].join('\n');
        const entry={id:'halqa-'+dkey,at:d.getTime(),date:dkey,kind:'dhikr',title:'The daily circle · '+D.d,name:'يا '+D.name,intent:'the day\'s practice, performed in al-Ḥalqa',count:String(abjad(D.name).total),body,outcome:'',hourPlanet:H?H.h.planet:null,dayPlanet:DAY_RULERS[d.getDay()],mansion:manzilNow(d).n,lunar:lunarDay(d).day,by:'halqa'};
        await saveJournal(entry); const m='I have written today\'s circle into your journal.'; show(Object.assign({},clean,{line:m})); if(!(await speakOrRead(m,t))) return false}
    }
    if(live(t)){if(!step.quiet||step.id.startsWith('hour:')) hqMarkDone(dkey,step.id); hqResumeClear(step.id); try{opts.onDone&&opts.onDone(step)}catch(e){}}
    return !interrupted}
  finally{if(live(t)){running=false; S.run=null; drawStage(); drawMini(); drawDay(); drawWork()}}}
function stopAll(){tok++; running=false; tapFn=null; skipFn=null; if(ansFn){const f=ansFn; ansFn=null; f(null)} try{S.tts&&S.tts.stop&&S.tts.stop()}catch(e){} S.run=null; drawStage(); drawMini(); drawDay()}
function stopByHand(){LSs(HQ_HELD,ymd(new Date())); if(DS.s) dsEnd(); stopAll(); hqRender()}
async function runDay(){for(const s of S.prog){if(hqLoadDone(ymd(new Date())).includes(s.id)) continue; const t0=tok; await perform(s,{resume:true}); if(tok!==t0+1) break; if(!hqLoadDone(ymd(new Date())).includes(s.id)) break}}

/* ── the journal (database collection "journal", else this browser) ── */
async function saveJournal(e){const db=await hqDb(); if(db){try{await hqWait(db.doc('journal/'+e.id).set(e),15000); return true}catch(x){}} const l=LSg('hikma-journal',[]).filter(x=>x.id!==e.id); l.unshift(e); LSs('hikma-journal',l.slice(0,500)); return true}

/* ── lessons ── */
async function saveState(st){S.state=st; const db=await hqDb(); if(db){LSs('halqa-state-shadow',st); LSs('halqa-state-unsynced',!(await hqSet('halqa/state',st,hqMergeState,m=>{LSs('halqa-state-shadow',m); S.state=m})))} else LSs('halqa-state',st)}
async function saveLesson(l){const db=await hqDb(); if(db) await hqSet('lessons/'+l.date,l); else{const all=LSg('halqa-lessons',{}); all[l.date]=l; LSs('halqa-lessons',all)}}
function dsNormQ(q){if(!q||!q.q) return null; const o={q:String(q.q).trim(),a:String(q.a||'').trim()}; let ch=Array.isArray(q.choices)?q.choices:Array.isArray(q.options)?q.options:null;
  if(ch){ch=ch.map(x=>String(x==null?'':typeof x==='object'?(x.text||x.t||''):x).replace(/^\s*\(?[A-Ea-e1-5][.):]\s+/,'').trim()).filter(Boolean); let c=q.correct!=null?q.correct:q.answer;
    if(typeof c==='string'){const s=c.trim(),L=s.toUpperCase(); c=/^[A-E]$/.test(L)?L.charCodeAt(0)-65:/^\d$/.test(s)?+s:ch.findIndex(x=>x.toLowerCase()===s.toLowerCase());
      if(c<0){const m=/^\(?([A-Ea-e])[.):]\s+(.*)$/.exec(s); if(m){const t=ch.findIndex(x=>x.toLowerCase()===m[2].trim().toLowerCase()); c=t>=0?t:m[1].toUpperCase().charCodeAt(0)-65}}}
    c=Math.round(+c); if(ch.length>=3&&ch.length<=5&&c>=0&&c<ch.length&&new Set(ch.map(x=>x.toLowerCase())).size===ch.length){o.choices=ch; o.correct=c; if(!o.a) o.a=ch[c]}}
  return o}
window.dsNormQ=dsNormQ;
function compose(){if(composing) return composing; if(!S.sample){S.err='Composing a lesson needs Claude — open the engine inside Claude.'; drawCourse(); return Promise.resolve(null)}
  composing=(async()=>{S.busy='Composing today\'s lesson…'; S.err=''; drawCourse(); const dkey=ymd(new Date());
    try{const st=S.state||{next:HQ_START,history:[]}; const R=await hqRange(st.next||HQ_START); const paras=await hqPages(R.from,R.to);
      const text=paras.filter(x=>x.t).map(x=>'[p.'+x.p+'] '+(x.k==='seal'?'(sealed working, named only) ':'')+x.t).join('\n').slice(0,22000);
      const recent=(st.history||[]).slice(-5).map(h=>h.date+': pp.'+h.from+'–'+h.to+' '+h.title).join('\n')||'(this is the first lesson)';
      let j=null,lastErr=null; for(let k=0;k<2&&!j;k++){try{j=await S.sample.json([{role:'user',content:HQ_LESSON_RULES+'\n\nRecent lessons:\n'+recent+'\n\nSection: '+R.heading+'\nPages '+R.from+'–'+R.to+':\n'+text}],{modelTier:'default',cache:false})}catch(e){lastErr=e; if(e&&e.code==='rate_limited') break; await sleep(2500)}}
      if(!j||!j.teaching) throw lastErr||new Error('empty lesson');
      const l={date:dkey,ch:R.ch,from:R.from,to:R.to,heading:R.heading,title:String(j.title||R.heading).slice(0,160),teaching:String(j.teaching||''),points:(j.points||[]).map(String).slice(0,8),questions:(j.questions||[]).map(dsNormQ).filter(Boolean).slice(0,5),practice:String(j.practice||''),by:'page',at:new Date().toISOString()};
      await saveLesson(l); S.lesson=l; S.past=[l,...S.past.filter(x=>x.date!==l.date)];
      await saveState(Object.assign({},st,{next:R.to+1,history:[...(st.history||[]),{date:dkey,from:R.from,to:R.to,title:l.title}].slice(-120),updatedAt:new Date().toISOString()}));
      return l}
    catch(e){S.err=e&&e.code==='rate_limited'?'Claude is busy or the usage limit was reached — try again shortly.':'The lesson could not be composed ('+((e&&(e.code||e.message))||'error')+').'; return null}
    finally{S.busy=''; composing=null; drawCourse()}})();
  return composing}

/* ── the hours, the requests ── */
const nameNow=()=>M.names.find(x=>x.o===((S.state&&S.state.nameNext)||1))||M.names[0];
function advanceName(){const st=S.state||{next:HQ_START,history:[]}; saveState(Object.assign({},st,{nameNext:((st.nameNext||1)%99)+1,updatedAt:new Date().toISOString()}))}
function hourSession(n){const H=hqHourNow(n); if(!H) return null; const nm=nameNow(); if(!nm) return null;
  const st=hqWorkSession({id:'hour:'+H.h.start.toISOString().slice(0,16),title:'The hour of '+plName(H.h.planet)+' — '+nm.tr,nm,order:HQ_ORDER[H.h.planet],world:hqWorld(n),hourLabel:fmt(H.h.start)+'–'+fmt(H.h.end)});
  st.quiet=true; st.end=H.h.end; st.planet=H.h.planet; return st}
function runRequest(r,now){const nm=hqFindName(r.q), num=/^\d+$/.test(r.q.trim())?+r.q.trim():null, H=hqHourNow(new Date()); const order=r.order||(H?HQ_ORDER[H.h.planet]:4);
  const step=hqWorkSession({id:'req:'+r.id,title:'Your working — '+(nm?nm.tr:r.q),nm,text:!nm&&num==null?r.q:null,value:num,order}); step.quiet=true;
  const fin=()=>{const left=LSg(HQ_REQ,[]).filter(x=>x.id!==r.id); LSs(HQ_REQ,left); S.reqs=left; if(step.work){const w=Object.assign({},step.work,{forge:step.forge,at:Date.now()}); S.lastWork=w; LSs('halqaLastWork',w)} drawWork()};
  if(now){stopAll(); setTimeout(()=>perform(step,{resume:true,onDone:fin}),60)} else perform(step,{resume:true,onDone:fin})}
function tick(){if(!M||running||DS.s||DS.asking) return; const n=new Date(); const dk=ymd(n); if(dk!==S.dkey){S.dkey=dk; S.prog=hqProgram(n); loadLesson(); drawDay()}
  const ids=hqLoadDone(dk); const q=LSg(HQ_REQ,[]); if(q.length){runRequest(q[0]); return}
  if(LSg(HQ_HELD,null)===dk) return; if(!LSg(HQ_AUTO,true)) return;
  const due=S.prog.find(s=>s.at<=n&&!ids.includes(s.id)); if(due){perform(due,{auto:true,resume:true}); return}
  {const C=dsCfg(); if(C.self&&S.sample&&DS.prog&&LSg('dsStopped',null)!==dk&&dsStats(DS.prog).today<C.goal){dsStart({auto:true}); return}}
  if(!LSg('halqaWatch',true)) return; const hs=hourSession(n); if(hs&&!ids.includes(hs.id)&&hs.end-n>4*60000) perform(hs,{auto:true,resume:true,onDone:()=>advanceName()})}

/* ── loading ── */
async function loadLesson(){const dk=ymd(new Date()); S.lesson=undefined; drawCourse(); const db=await hqDb();
  const l=db?await hqGet('lessons/'+dk):(LSg('halqa-lessons',{})[dk]||null); S.lesson=l||null;
  if(db){try{const q=await hqWait(db.collection('lessons').orderBy('date','desc').limit(30).get(),12000); S.past=q.docs.map(x=>x.data())}catch(e){}}
  else S.past=Object.values(LSg('halqa-lessons',{})).sort((a,b)=>b.date<a.date?-1:1);
  drawCourse()}
let started=false;
async function hqInit(){if(started) return; started=true;
  try{await meta()}catch(e){started=false; return}
  S.dkey=ymd(new Date()); S.prog=hqProgram(new Date());
  const d=await hqDb(); S.db=d;
  if(d){let st=await hqGet('halqa/state');
    if(!HQ_UNREAD.has('halqa/state')&&LSg('halqa-state-unsynced',false)&&LSg('halqa-state-shadow',null)){st=hqMergeState(st,LSg('halqa-state-shadow',null)); if(await hqSet('halqa/state',st)) LSs('halqa-state-unsynced',false)}
    if(st) LSs('halqa-state-shadow',st);
    S.state=st||(HQ_UNREAD.has('halqa/state')?LSg('halqa-state-shadow',null):null)||{next:HQ_START,history:[]}}
  else S.state=LSg('halqa-state',{next:HQ_START,history:[]});
  cuse('sample').then(s=>{S.sample=s||null; drawCourse()}).catch(()=>{S.sample=null});
  cuse('tts').then(t=>{S.tts=t||null; hqRender()}).catch(()=>{S.tts=null});
  await loadLesson(); hqRender(); dsInit();
  setTimeout(tick,1500); setInterval(tick,10000);
  setInterval(()=>{if(!S.run) drawIdle()},20000)}
window.hqInit=hqInit;

/* ═══ the Study (dars) — ported from the Iḥyāʾ Engine (kit/tools/dars.jsx v3.5–v4.0 and the Study of halqa in kit/src/engine.jsx) on 2026-11-17 ═══
   The whole book (pp.40–2401) cut into lessons at its own joints — chapter starts, the outline's headings and each Name of ch.16 —
   none longer than four pages. In a session al-Muʿallim chooses: what Al may have forgotten (spaced review, multiple choice only),
   the map of a chapter before he enters it, the next pages in order (the book's text, then the teaching, then checked at once),
   and every third lesson gathered up. Chapter exams (MCQ, 80% passes). Records: study/progress, units/<uid>, units/ov<ch>.
   Al's decisions kept: no machine voice for Arabic; review is multiple choice only (A's typed/spoken grading is not ported). */
const DS_START=40, DS_PROG='study/progress';
let DS_UNITS=null;
const dsChapters=()=>M.chapters;
const dsOutline=()=>M.outline;
function dsUnits(){if(DS_UNITS) return DS_UNITS;
  const chs=dsChapters().filter(c=>c.to>=DS_START); const chOf=p=>chs.find(c=>p>=c.from&&p<=c.to)||chs[chs.length-1];
  const heads=[];
  for(const c of chs) heads.push({p:Math.max(c.from,DS_START),t:(c.ch?'Chapter '+c.ch+': ':'')+(c.short||c.title),chap:true});
  for(const o of dsOutline()||[]) if(o.p>=DS_START) heads.push({p:o.p,t:o.t});
  for(const nm of M.names||[]) if(nm.p&&nm.p>=1100&&nm.p<=1505) heads.push({p:nm.p,t:nm.tr+' — '+nm.en,nm:nm.o});
  const cuts=[...new Set(heads.map(h=>h.p))].sort((a,b)=>a-b); const out=[];
  for(let i=0;i<cuts.length;i++){const a=cuts[i],C=chOf(a),b=Math.min(i+1<cuts.length?cuts[i+1]-1:2401,C.to); if(b<a) continue;
    const hs=heads.filter(h=>h.p===a),named=hs.find(h=>h.nm),title0=(hs.find(h=>!h.chap)||hs[0]).t;
    const len=b-a+1,parts=len<=4?1:Math.ceil(len/3); let from=a;
    for(let k=0;k<parts;k++){const size=Math.floor(len/parts)+(k<len%parts?1:0),to=from+size-1;
      out.push({id:'u'+from,ch:C.ch,from,to,title:parts>1?title0+' (part '+(k+1)+' of '+parts+')':title0,heads:k===0?hs.map(h=>h.t):[],part:k+1,parts,nm:named?named.nm:null,chapStart:k===0&&hs.some(h=>h.chap)}); from=to+1}}
  const merged=[];
  for(const u of out){const pv=merged[merged.length-1];
    if(pv&&u.to===u.from&&pv.ch===u.ch&&pv.to-pv.from<=1&&pv.parts===1&&u.parts===1&&!u.nm&&!pv.nm&&!u.chapStart){pv.to=u.to; pv.heads=[...pv.heads,...u.heads]; pv.title=pv.title+' · '+u.title; continue}
    merged.push(Object.assign({},u))}
  DS_UNITS=merged; return merged}
const dsAfter=u=>{const U=dsUnits(),i=U.findIndex(x=>x.id===u.id); return i>=0?U[i+1]||null:null};
/* spaced review: score 0 forgot · 1 partly · 2 knew it · 3 knew it well; card = [due, ease×100, interval days, reps, lapses, last score] */
const dsAddDays=(d,n)=>{const x=new Date(d); x.setHours(12,0,0,0); x.setDate(x.getDate()+n); return ymd(x)};
function dsSchedule(card,score,today){today=today||new Date(); let [,ease=250,ivl=0,reps=0,lapses=0]=card||[];
  if(score==null) return [dsAddDays(today,1),ease,ivl,reps,lapses,card?card[5]:null];
  if(score<=0){reps=0; lapses++; ivl=1; ease=Math.max(130,ease-20)}
  else if(score===1){reps++; ivl=Math.max(1,Math.round(ivl*1.2)); ease=Math.max(130,ease-15)}
  else{reps++; ivl=reps===1?1:reps===2?3:Math.round(Math.max(ivl,1)*ease/100*(score===3?1.3:1)); if(score===3) ease+=15}
  ivl=Math.min(ivl,365); return [dsAddDays(today,ivl),ease,ivl,reps,lapses,score]}
function dsDue(prog,today,skip){const t=ymd(today||new Date()); skip=skip||new Set();
  return Object.entries((prog&&prog.cards)||{}).filter(([id,c])=>c[0]<=t&&!skip.has(id))
    .sort((a,b)=>(a[1][0]<b[1][0]?-1:a[1][0]>b[1][0]?1:0)||((a[1][5]??2)-(b[1][5]??2))||a[1][1]-b[1][1]).map(([id])=>id)}
function dsUnitStatus(prog,u){const P=(prog&&prog.units&&prog.units[u.id])||null; if(!P) return 'new';
  const cs=Object.entries(prog.cards||{}).filter(([id])=>id.startsWith(u.id+'.')).map(e=>e[1]);
  if(cs.some(c=>c[5]===0)) return 'weak'; if(cs.length&&cs.every(c=>c[3]>=2&&c[5]>=2)) return 'kept'; return 'taught'}
function dsStats(prog,now){now=now||new Date(); const U=dsUnits(),t=ymd(now),units=(prog&&prog.units)||{},mins=(prog&&prog.minutes)||{};
  const taught=U.filter(u=>units[u.id]).length; const last=((prog&&prog.answers)||[]).slice(-60),kept=last.filter(x=>x>=2).length;
  let streak=0; for(let d=new Date(now);;d.setDate(d.getDate()-1)){if((mins[ymd(d)]||0)>=5) streak++; else if(ymd(d)!==t) break; if(streak>3650) break}
  return {total:U.length,taught,pct:Math.round(1000*taught/U.length)/10,today:Math.round(mins[t]||0),due:dsDue(prog,now).length,cards:Object.keys((prog&&prog.cards)||{}).length,
    retention:last.length?Math.round(100*kept/last.length):null,streak,todayUnits:Object.values(units).filter(x=>x.t===t&&x.by!=='circle').length}}
function dsMarkCovered(prog,dayLessons){const seen=new Map();
  for(const l of dayLessons||[]){if(!l||!l.date||!(l.from>0)||!(l.to>=l.from)) continue; for(let p=l.from;p<=Math.min(l.to,l.from+12);p++) if(!seen.has(p)||seen.get(p)<l.date) seen.set(p,l.date)}
  if(!seen.size) return 0; prog.units=prog.units||{}; let n=0;
  for(const u of dsUnits()){if(prog.units[u.id]) continue; let last='',all=true; for(let p=u.from;p<=u.to;p++){const d=seen.get(p); if(!d){all=false; break} if(d>last) last=d}
    if(all){prog.units[u.id]={t:last,n:1,by:'circle'}; n++}}
  return n}
function dsMergeProg(a,b){a=a||{}; b=b||{};
  const pickU=(x,y)=>!x?y:!y?x:((y.n||0)>(x.n||0)||((y.n||0)===(x.n||0)&&(y.t||'')>(x.t||''))?y:x);
  const units=Object.assign({},a.units||{}); for(const [k,v] of Object.entries(b.units||{})) units[k]=pickU(units[k],v);
  const rv=c=>Array.isArray(c)?(c[3]||0)+(c[4]||0):-1;
  const cards=Object.assign({},a.cards||{}); for(const [k,c] of Object.entries(b.cards||{})){const o=cards[k]; cards[k]=!o||rv(c)>rv(o)||(rv(c)===rv(o)&&String(c[0])>String(o[0]))?c:o}
  const minutes=Object.assign({},a.minutes||{}); for(const [k,m] of Object.entries(b.minutes||{})) minutes[k]=Math.max(minutes[k]||0,m||0);
  const ses=new Map(); for(const s of [...(a.sessions||[]),...(b.sessions||[])]) if(s) ses.set(s.start||JSON.stringify(s),s);
  const sessions=[...ses.values()].sort((x,y)=>String(x.start||'')<String(y.start||'')?-1:1).slice(-60);
  const answers=((b.answers||[]).length>=(a.answers||[]).length?b.answers:a.answers)||[];
  const later=(a.updatedAt||'')>(b.updatedAt||'')?a:b;
  const exams=Object.assign({},a.exams||{}); for(const [k,e] of Object.entries(b.exams||{})){const o=exams[k]; exams[k]=!o||(e.best||0)>(o.best||0)||((e.best||0)===(o.best||0)&&(e.sittings||0)>(o.sittings||0))?e:o}
  return Object.assign({},a,b,later,{exams,units,overviews:Object.assign({},a.overviews||{},b.overviews||{}),cards,minutes,sessions,answers:answers.slice(-300),updatedAt:new Date().toISOString()})}
/* the teacher's choice */
const DS_MODES=[['choice','Teacher\'s choice'],['forgot','What I\'ve forgotten'],['order','The book in order'],['chapter','One chapter']];
function dsPlan(ctx){const {prog,state,mode,chapter}=ctx,U=dsUnits(),today=ctx.today||new Date();
  const due=dsDue(prog,today,ctx.quizzed||new Set()); const reviewSeg=n=>({kind:'review',cards:due.slice(0,n),title:'Review — what you may have forgotten ('+Math.min(n,due.length)+' questions)'});
  if(mode==='forgot'){if(due.length) return reviewSeg(10);
    const weak=U.filter(u=>dsUnitStatus(prog,u)==='weak'&&!(ctx.retaught||new Set()).has(u.id))[0]; if(weak) return {kind:'reteach',unit:weak,title:'Again, more slowly — '+weak.title};
    const old=U.filter(u=>prog.units[u.id]).sort((a,b)=>(prog.units[a.id].t<prog.units[b.id].t?-1:1)).find(u=>!(ctx.retaught||new Set()).has(u.id)); if(old) return {kind:'reteach',unit:old,title:'Refreshing — '+old.title}}
  if(due.length&&mode!=='order'&&(ctx.seg===0||ctx.sinceReview>=2||due.length>=15)) return reviewSeg(ctx.seg===0?8:6);
  if(mode==='order'&&due.length>=25&&ctx.sinceReview>=4) return reviewSeg(6);
  if((ctx.recent||[]).length>=3&&ctx.sinceRecap>=3) return {kind:'recap',units:ctx.recent.slice(-3),title:'Gathering up the last three lessons'};
  let next=null; if(mode==='chapter'&&chapter!=null) next=U.find(u=>u.ch===+chapter&&!prog.units[u.id]);
  if(!next){const p=(state&&state.next)||DS_START; next=U.find(u=>u.to>=p&&!prog.units[u.id])||U.find(u=>!prog.units[u.id])}
  if(!next) return due.length?reviewSeg(10):null;
  if(!prog.overviews[next.ch]&&next.ch>0) return {kind:'overview',ch:next.ch,title:'The map of chapter '+next.ch+' — '+((dsChapters().find(c=>c.ch===next.ch)||{}).short||''),before:next};
  return {kind:'unit',unit:next,title:next.title+' · pp.'+next.from+(next.to>next.from?'–'+next.to:'')}}
/* multiple choice */
function dsShuffle(a){a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a}
function dsDeal(c){const ord=dsShuffle(c.choices.map((_,i)=>i)); return {order:ord,right:ord.indexOf(c.correct)}}
/* the chapter exam */
const DS_EXAM_N=20, DS_EXAM_PASS=0.8, DS_EXAM_MIN=5;
function dsExamCards(prog,ch,unitsById){const C=dsChapters().find(c=>c.ch===ch); if(!C) return [];
  return Object.keys((prog&&prog.cards)||{}).filter(id=>{const uid=id.slice(0,id.lastIndexOf('.')); if(uid.startsWith('L')) return true; if(uid.startsWith('ov')) return +uid.slice(2)===ch; const u=unitsById.get(uid); return !!u&&u.ch===ch})}
const dsExamScore=answers=>{const n=answers.length,r=answers.filter(x=>x.ok).length; return {n,right:r,pct:n?Math.round(100*r/n):0,pass:n>=DS_EXAM_MIN&&r/n>=DS_EXAM_PASS}};
function dsIjazaSvg(o){const C=dsChapters().find(c=>c.ch===o.ch)||{}, e=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]);
  const L=[[200,30,'Cormorant Garamond, serif','#5a3c08','Shahādat al-Qirāʾa · a record of reading'],[270,20,'Spectral, serif','#2b2216','This records that'],[330,38,'Cormorant Garamond, serif','#2b2216',o.name||'the reader'],
    [390,20,'Spectral, serif','#2b2216','read with al-Muʿallim '+(o.ch?'chapter '+o.ch:'the prologue')+' of Iḥyāʾ Uṣūl al-Ḥikmah'],[425,22,'Cormorant Garamond, serif','#5a3c08',(C.title||C.short||'')+' · pp.'+C.from+'–'+C.to],
    [480,18,'Spectral, serif','#2b2216','and answered '+o.pct+'% of '+o.n+' questions drawn from its lessons, on '+o.date+'.'],[560,14,'Spectral, serif','#6b5a40','Kept by the Ḥikma Merged Engine. An ijāza proper is given by a living teacher; this is a record of study in its manner.']];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640"><rect width="900" height="640" fill="#f6efdc"/><rect x="24" y="24" width="852" height="592" fill="none" stroke="#8a6a2a" stroke-width="3"/><rect x="36" y="36" width="828" height="568" fill="none" stroke="#8a6a2a" stroke-width="1"/>'
    +'<text x="450" y="120" text-anchor="middle" font-family="Amiri, serif" font-size="44" fill="#5a3c08">بسم الله الرحمن الرحيم</text>'+L.map(([y,s,f,c,t])=>'<text x="450" y="'+y+'" text-anchor="middle" font-family="'+f+'" font-size="'+s+'" fill="'+c+'">'+e(t)+'</text>').join('')+'</svg>'}

/* ── the Study: storage (a save joins the record first, as A v3.16.2) ── */
const DS={prog:null,s:null,err:'',asking:false,handLog:[],exam:null,open:null,mapOpen:false,saving:Promise.resolve()};
const DS_LCACHE={};
const dsCfg=()=>Object.assign({mode:'choice',ch:1,len:60,goal:120,self:false,read:true,wait:0},LSg('dsCfg',{}));
const dsSetCfg=(k,v)=>{const c=dsCfg(); c[k]=v; LSs('dsCfg',c)};
async function dsLoad(){const fresh={units:{},overviews:{},cards:{},minutes:{},sessions:[],answers:[],exams:{}}; const db=await hqDb();
  if(db){let p=await hqGet(DS_PROG);
    if(!HQ_UNREAD.has(DS_PROG)&&LSg('study-progress-unsynced',false)&&LSg('study-progress-shadow',null)){p=dsMergeProg(p,LSg('study-progress-shadow',null)); if(await hqSet(DS_PROG,p)) LSs('study-progress-unsynced',false)}
    return Object.assign({},fresh,p||(HQ_UNREAD.has(DS_PROG)?LSg('study-progress-shadow',{}):{}))}
  return Object.assign({},fresh,LSg('study-progress',{}))}
function dsSave(prog,onMerged){
  DS.saving=DS.saving.then(async()=>{const db=await hqDb(); let p=Object.assign({},prog,{sessions:(prog.sessions||[]).slice(-60),answers:(prog.answers||[]).slice(-300),updatedAt:new Date().toISOString()});
    if(db){const remote=await hqGet(DS_PROG); if(remote&&!HQ_UNREAD.has(DS_PROG)){p=Object.assign(dsMergeProg(remote,p),{updatedAt:p.updatedAt}); if(onMerged){try{onMerged(p)}catch(e){}}}
      LSs('study-progress-shadow',p); LSs('study-progress-unsynced',!(await hqSet(DS_PROG,p,dsMergeProg,m=>{LSs('study-progress-shadow',m); onMerged&&onMerged(m)})))}
    else LSs('study-progress',p)}).catch(()=>{});
  return DS.saving}
function dsUpdate(fn){const P=JSON.parse(JSON.stringify(DS.prog||{units:{},overviews:{},cards:{},minutes:{},sessions:[],answers:[],exams:{}})); fn(P); DS.prog=P;
  dsSave(P,m=>{DS.prog=dsMergeProg(m,DS.prog)}); drawStudy()}
async function dsGetLesson(uid){if(DS_LCACHE[uid]) return DS_LCACHE[uid]; const db=await hqDb(); let l=null;
  if(uid.startsWith('L')) l=db?await hqGet('lessons/'+uid.slice(1)):(LSg('halqa-lessons',{})[uid.slice(1)]||null);
  else l=db?await hqGet('units/'+uid):(LSg('study-units',{})[uid]||null);
  if(l) DS_LCACHE[uid]=l; return l}
async function dsPutLesson(uid,l){DS_LCACHE[uid]=l; const db=await hqDb(); if(db) return hqSet('units/'+uid,l);
  const all=LSg('study-units',{}); all[uid]=l; const ks=Object.keys(all); if(ks.length>150) delete all[ks[0]]; LSs('study-units',all); return true}
async function dsAdoptDayLessons(prog){const db=await hqDb(); let ls=[];
  if(db){try{const q=await hqWait(db.collection('lessons').orderBy('date','desc').limit(120).get(),12000); ls=q.docs.map(x=>x.data())}catch(e){}}
  else ls=Object.values(LSg('halqa-lessons',{}));
  let added=0; prog.cards=prog.cards||{};
  for(const l of ls){if(!l||!l.date) continue; const uid='L'+l.date; DS_LCACHE[uid]=l;
    (l.questions||[]).forEach((q,k)=>{const id=uid+'.'+k; if(!prog.cards[id]){prog.cards[id]=[dsAddDays(new Date(l.date+'T12:00:00'),1),250,0,0,0,null]; added++}})}
  return added+dsMarkCovered(prog,ls)}
async function dsCardText(id){const i=id.lastIndexOf('.'),uid=id.slice(0,i),k=+id.slice(i+1); const l=await dsGetLesson(uid); const q=l&&(l.questions||[])[k];
  return q?{id,uid,k,q:q.q,a:q.a,choices:q.choices||null,correct:q.correct,title:l.title,from:l.from,to:l.to}:null}
async function dsStoreChoices(c,choices,correct){try{const l=await dsGetLesson(c.uid); if(!l||!l.questions||!l.questions[c.k]) return;
  l.questions[c.k]=Object.assign({},l.questions[c.k],{choices,correct});
  if(c.uid.startsWith('L')) await saveLesson(l); else await dsPutLesson(c.uid,l)}catch(e){}}
/** Older questions carry no options: Claude gives them four once (kept with the lesson); without Claude the wrong ones come from other lessons' answers. */
async function dsChoicesFor(sample,c){if(c.choices&&c.choices.length>=3) return c;
  if(sample){try{const j=await sample.json([{role:'user',content:NUTQ_RULE+' Turn this review question on Iḥyāʾ Uṣūl al-Ḥikmah (Amin Patel\'s compilation, pp.'+c.from+'–'+c.to+', "'+c.title+'") into multiple choice. Return JSON {"choices": [4 short options, at most 16 words each — exactly one is the right answer below, restated briefly; the other three plausible to a student but wrong by that answer, in the book\'s own kind of terms; never "all/none of the above"], "correct": the index 0–3 of the right one}.\n\nQuestion: '+c.q+'\nThe right answer, from the page: '+c.a}],{modelTier:'quick',cache:false});
    const m=dsNormQ({q:c.q,a:c.a,choices:j&&j.choices,correct:j&&j.correct}); if(m&&m.choices){await dsStoreChoices(c,m.choices,m.correct); return Object.assign({},c,{choices:m.choices,correct:m.correct})}}catch(e){}}
  const cut=s=>s.length>200?s.slice(0,190).replace(/\s+\S*$/,'')+'…':s; const right=cut(c.a||''),pool=new Set();
  for(const l of Object.values(DS_LCACHE)) for(const q of (l&&l.questions)||[]){const x=cut(String(q.choices?q.choices[q.correct]:q.a||'').trim()); if(x&&x!==right) pool.add(x)}
  const wrong=dsShuffle([...pool]).slice(0,3); if(!right||wrong.length<2) return c;
  return Object.assign({},c,{choices:[right,...wrong],correct:0})}
/* what Claude is asked */
const DS_MASTERS='"masters": a short word from the masters of the path that bears on these pages — al-Ghazālī (Iḥyāʾ ʿUlūm al-Dīn, al-Arbaʿīn, Kīmiyāʾ al-Saʿāda), Abū l-Ḥasan al-Shādhilī (his ḥizbs and sayings as transmitted by Ibn ʿAṭāʾ Allāh in Laṭāʾif al-Minan), Ibn ʿAṭāʾ Allāh (al-Ḥikam, Tāj al-ʿArūs, Miftāḥ al-Falāḥ), Ibn ʿArabī (al-Futūḥāt al-Makkiyya, Fuṣūṣ al-Ḥikam, Risālat al-Anwār), al-Qushayrī (al-Risāla), al-Būnī, Aḥmad Zarrūq (Qawāʿid al-Taṣawwuf), and others of the people of the path — 60–140 words, spoken English: {"who": the master, "work": the work it comes from, "text": the teaching}. Paraphrase faithfully in your own words; never invent a quotation, a chapter number or a saying; quote at most a short phrase you are certain of. If nothing you are sure of bears on these pages, return null.';
const DS_UNIT_RULES=HQ_LESSON_RULES.replace('or "" if the pages give none}','or "" if the pages give none,\n '+DS_MASTERS+'}');
async function dsCompose(sample,u,prevTitle){const paras=await hqPages(u.from,u.to);
  const text=paras.filter(x=>x.t).map(x=>'[p.'+x.p+'] '+(x.k==='seal'?'(sealed working, named only) ':'')+x.t).join('\n').slice(0,22000);
  const C=dsChapters().find(c=>c.ch===u.ch)||{}; let j=null,last=null;
  for(let a=0;a<2&&!j;a++){try{j=await sample.json([{role:'user',content:DS_UNIT_RULES+'\n\nThis lesson belongs to chapter '+u.ch+': '+(C.title||'')+'. The lesson before it: '+(prevTitle||'(none yet)')+'.\nSection: '+u.title+'\nPages '+u.from+'–'+u.to+':\n'+(text||'(these pages carry figures or Arabic only; teach what the headings and figures indicate, and say so)')}],{modelTier:'default',cache:false})}
    catch(e){last=e; if(e&&e.code==='rate_limited') break; await sleep(2500)}}
  if(!j||!j.teaching) throw last||new Error('empty lesson');
  const m=j.masters&&j.masters.text?{who:String(j.masters.who||''),work:String(j.masters.work||''),text:String(j.masters.text)}:null;
  const l={uid:u.id,ch:u.ch,from:u.from,to:u.to,heading:u.title,title:String(j.title||u.title).slice(0,160),teaching:String(j.teaching),points:(j.points||[]).map(String).slice(0,8),questions:(j.questions||[]).map(dsNormQ).filter(Boolean).slice(0,5),practice:String(j.practice||''),masters:m,at:new Date().toISOString()};
  await dsPutLesson(u.id,l); return l}
async function dsOverview(sample,ch){const id='ov'+ch,have=await dsGetLesson(id); if(have) return have; const C=dsChapters().find(c=>c.ch===ch); if(!C) return null;
  const heads=dsOutline().filter(o=>o.p>=C.from&&o.p<=C.to).map(o=>'p.'+o.p+' '+o.t).slice(0,80).join('\n'); const units=dsUnits().filter(u=>u.ch===ch).length;
  const first=(await hqPages(Math.max(C.from,DS_START),Math.min(C.to,Math.max(C.from,DS_START)+2))).filter(x=>x.t).map(x=>'[p.'+x.p+'] '+x.t).join('\n').slice(0,7000);
  const j=await sample.json([{role:'user',content:NUTQ_RULE+' You are al-Muʿallim, Al\'s teacher of Iḥyāʾ Uṣūl al-Ḥikmah (Amin Patel\'s compilation). Before Al enters chapter '+ch+', give him its map, 220–380 words of plain English, no markdown: what the chapter is about, the order of its parts (from its headings, with pages), what to hold on to, and how it connects to what comes before it in the book and to the practitioner\'s nearness to God. Teach only what the headings and pages show; anything beyond is "by way of explanation". Return JSON {"title": ..., "teaching": ..., "questions": [2 multiple-choice questions answerable from the map, each {"q": the question, "choices": [4 short options, exactly one right, the others plausible but wrong by the map], "correct": index 0–3 of the right one, "a": the answer in a sentence}]}.\n\nChapter '+ch+': '+C.title+' (pp.'+C.from+'–'+C.to+', '+units+' lessons)\nHeadings:\n'+heads+'\nOpening pages:\n'+first}],{modelTier:'default',cache:false});
  if(!j||!j.teaching) return null;
  const l={uid:id,ch,from:C.from,to:C.to,title:String(j.title||'The map of chapter '+ch),teaching:String(j.teaching),questions:(j.questions||[]).map(dsNormQ).filter(Boolean).slice(0,3),at:new Date().toISOString()};
  await dsPutLesson(id,l); return l}
async function dsAnswerQuestion(sample,u,question,history){const paras=u?await hqPages(u.from,u.to):[]; const text=paras.filter(x=>x.t).map(x=>'[p.'+x.p+'] '+x.t).join('\n').slice(0,14000);
  const r=await sample([{role:'user',content:NUTQ_RULE+' You are al-Muʿallim, Al\'s teacher of Iḥyāʾ Uṣūl al-Ḥikmah and of the path to God, in the Shādhilī way. Al has raised his hand in the middle of a lesson'+(u?' on pp.'+u.from+'–'+u.to+' ('+u.title+')':'')+'. Answer him as you would aloud: plain English, no markdown, 60–220 words, warm and exact. Use the pages below first and cite them (p.N); you may add the teaching of the masters (al-Ghazālī, al-Shādhilī, Ibn ʿAṭāʾ Allāh, Ibn ʿArabī, al-Qushayrī…), naming the master and the work, paraphrased, never an invented quotation. Say plainly when something is beyond the pages. You are not a shaykh and give no idhn. Harmful workings are never explained. Medical matters: the tradition complements a doctor.\n\n'+(history||[]).slice(-4).map(h=>'Earlier he asked: '+h.q+'\nYou said: '+h.a).join('\n')+'\n\nPages:\n'+(text||'(no pages in view)')+'\n\nAl asks: '+question}],{modelTier:'default',cache:false});
  return String((r&&r.text)||'').trim()}

/* ── the Study's actions, performed on the circle's stage ── */
const DS_LT='ABCDE';
async function dsAct(a,x){const {t,from,step,dkey,ai,clean}=x;
  if(a.t==='unit'||a.t==='reteach'){const u=a.unit; let l=await dsGetLesson(u.id); if(!live(t)) return false;
    if(!l){if(!S.sample){show(Object.assign({},clean,{line:'Teaching new pages needs Claude — open the engine inside Claude. (Review still works.)'})); step.failed='no-sample'; return false}
      show(Object.assign({},clean,{line:'Preparing the lesson — Claude is writing it from the pages…',label:u.title}));
      try{l=await dsCompose(S.sample,u,a.prev)}catch(e){step.failed=(e&&e.code)||'compose'} if(!live(t)) return false;
      if(!l){show({line:step.failed==='rate_limited'?'Claude is busy or the usage limit was reached — the study pauses.':'This lesson could not be prepared just now.'}); return false}}
    const reading=a.t==='unit'&&dsCfg().read; const paras=reading?await hqPages(u.from,u.to):[]; if(!live(t)) return false;
    const C=dsChapters().find(c=>c.ch===u.ch);
    const items=[{text:a.t==='reteach'?'Let us go over this again: '+l.title+', pages '+u.from+(u.to>u.from?' to '+u.to:'')+'.':(u.ch?'Chapter '+u.ch+', '+((C&&C.short)||'')+'. ':'')+l.title+'. Pages '+u.from+(u.to>u.from?' to '+u.to:'')+'.'+(reading?' First the book itself.':''),label:u.title}];
    for(const p of paras){if(p.k==='corr') continue; items.push(p.k==='seal'?{text:'A sealed working is named here; its method is not carried.',para:{p:p.p,t:'A sealed working is named here; its method is not carried.'}}:{text:p.t,para:p})}
    if(reading) items.push({text:'Now let me teach it.',label:'the teaching'});
    for(const part of String(l.teaching||'').split(/\n+/).filter(Boolean)) items.push({text:part,label:'the teaching'});
    if((l.points||[]).length){items.push({text:'Hold on to these:',label:'to keep'}); for(const pt of l.points) items.push({text:'· '+pt,label:'to keep'})}
    if(l.practice) items.push({text:'For today: '+l.practice,label:'for today'});
    if(l.masters&&l.masters.text){const m=l.masters; items.push({text:'From the masters — '+m.who+(m.work?', '+m.work:'')+' (not the book; paraphrased)',label:'from the masters'}); items.push({text:m.text,label:'from the masters — '+m.who})}
    for(let i=from;i<items.length;i++){const it=items[i]; show(it.para?Object.assign({},clean,{para:it.para,label:'the book · p.'+it.para.p}):Object.assign({},clean,{line:it.text,label:it.label})); hqResumeSet(dkey,step.id,ai,i); if(!(await speakOrRead(it.text,t))) return false}
    if(a.t==='unit'){dsUpdate(p=>{p.units[u.id]={t:ymd(new Date()),n:((p.units[u.id]||{}).n||0)+1}; (l.questions||[]).forEach((q,k)=>{const id=u.id+'.'+k; if(!p.cards[id]) p.cards[id]=[dsAddDays(new Date(),1),250,0,0,0,null]})});
      const st=S.state||{next:HQ_START,history:[]},nx=st.next||HQ_START;
      if(u.to>=nx&&u.from<=nx+4) await saveState(Object.assign({},st,{next:u.to+1,history:[...(st.history||[]),{date:dkey,from:u.from,to:u.to,title:l.title,by:'study'}].slice(-120),updatedAt:new Date().toISOString()}))}
    return true}
  if(a.t==='cards'){let ids=a.cards||[]; if(a.fromUnit){const l=await dsGetLesson(a.fromUnit); ids=((l&&l.questions)||[]).map((_,k)=>a.fromUnit+'.'+k)}
    if(!ids.length) return true;
    if(a.intro&&from===0){show(Object.assign({},clean,{line:a.intro,label:a.label})); if(!(await speakOrRead(a.intro,t))) return false}
    let got=0,done=0;
    for(let k=from;k<ids.length;k++){let c=await dsCardText(ids[k]); if(!live(t)) return false; if(!c) continue;
      const src='pp.'+c.from+'–'+c.to+' · '+c.title;
      if(!c.choices){show(Object.assign({},clean,{label:a.label,line:'Setting out the four answers…'})); c=await dsChoicesFor(S.sample,c); if(!live(t)) return false}
      if(!c.choices){show(Object.assign({},clean,{label:a.label,line:'Question '+(k+1)+': '+c.q,answer:'The answer: '+c.a})); if(!(await speakOrRead('Question '+(k+1)+'. '+c.q+' The answer: '+c.a,t))) return false; dsUpdate(p=>{p.cards[c.id]=dsSchedule(p.cards[c.id],null)}); continue}
      const {order}=dsDeal(c); const wait=dsCfg().wait;
      show(Object.assign({},clean,{label:a.label+' · question '+(k+1)+' of '+ids.length,quiz:{q:c.q,order,choices:c.choices,correct:c.correct,picked:null,src,idk:true,tally:done?[got,done]:null,deadline:wait?Date.now()+wait*1000:0}}));
      hqResumeSet(dkey,step.id,ai,k);
      const pick=await new Promise(res=>{let fin=false; const end=v=>{if(fin) return; fin=true; clearInterval(iv); ansFn=null; res(v)}; ansFn=v=>end(v);
        const dl=wait?Date.now()+wait*1000:0; const iv=setInterval(()=>{if(!live(t)) return end('dead'); if(dl&&Date.now()>dl) end(null)},250)});
      if(pick==='dead'||!live(t)) return false;
      const picked=pick!=null&&pick>=0?pick:-1; const score=picked>=0?(picked===c.correct?3:0):pick===-1?0:null;
      if(picked>=0){done++; if(picked===c.correct) got++}
      const nz=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''), why=c.a&&nz(c.a)!==nz(c.choices[c.correct])?' '+c.a:'', R=DS_LT[order.indexOf(c.correct)];
      const said=picked===c.correct?'Right — '+R+'.'+why:picked>=0?'Not quite — you chose '+DS_LT[order.indexOf(picked)]+'. The answer is '+R+': '+c.choices[c.correct]+'.'+why:'The answer is '+R+': '+c.choices[c.correct]+'.'+why;
      show({quiz:Object.assign({},S.run.quiz,{picked:picked>=0?picked:-1,tally:done?[got,done]:null}),answer:said});
      dsUpdate(p=>{p.cards[c.id]=dsSchedule(p.cards[c.id],score); if(score!=null) p.answers=[...(p.answers||[]),score].slice(-300)});
      if(DS.s){DS.s.quizzed.add(c.id); DS.s.asked++; if(score!=null&&score>=2) DS.s.right++}
      if(!(await speakOrRead(said,t,Math.max(2600,said.split(/\s+/).length*260)))) return false}
    if(done>1){const m=got===done?'All '+done+' right. Mā shāʾ Allāh.':got+' of '+done+' right.'+(got<done?' The ones you missed will come back to you soon.':''); show(Object.assign({},clean,{line:m,label:a.label})); if(!(await speakOrRead(m,t))) return false}
    return true}
  if(a.t==='overview'){let l=await dsGetLesson('ov'+a.ch); if(!live(t)) return false;
    if(!l&&S.sample){show(Object.assign({},clean,{line:'Preparing the map of chapter '+a.ch+'…'})); try{l=await dsOverview(S.sample,a.ch)}catch(e){step.failed=(e&&e.code)||'overview'} if(!live(t)) return false}
    if(!l&&!S.sample){show(Object.assign({},clean,{line:'The map of a new chapter needs Claude — open the engine inside Claude.'})); step.failed='no-sample'; return false}
    if(l){const items=[l.title,...String(l.teaching||'').split(/\n+/).filter(Boolean)]; for(let i=from;i<items.length;i++){show(Object.assign({},clean,{line:items[i],label:'The map of chapter '+a.ch})); hqResumeSet(dkey,step.id,ai,i); if(!(await speakOrRead(items[i],t))) return false}}
    dsUpdate(p=>{p.overviews[a.ch]=ymd(new Date()); if(l) (l.questions||[]).forEach((q,k)=>{const id='ov'+a.ch+'.'+k; if(!p.cards[id]) p.cards[id]=[dsAddDays(new Date(),1),250,0,0,0,null]})});
    return true}
  if(a.t==='recap'){const items=['Let us gather up what we have just covered.']; for(const u of a.units){const l=await dsGetLesson(u.id); if(!l) continue; items.push(l.title+' · pp.'+u.from+'–'+u.to); for(const pt of (l.points||[]).slice(0,4)) items.push('· '+pt)}
    if(!live(t)) return false; for(let i=from;i<items.length;i++){show(Object.assign({},clean,{line:items[i],label:'Gathering up'})); if(!(await speakOrRead(items[i],t))) return false} return true}
  if(a.t==='pause'){show(Object.assign({},clean,{line:a.text,label:a.label,pause:{until:Date.now()+a.ms,kind:a.kind}})); if(from===0&&!(await speakOrRead(a.text,t,2500))) return false;
    await new Promise(res=>{let fin=false; const end=()=>{if(fin) return; fin=true; clearInterval(iv); clearTimeout(to); ansFn=null; res()}; ansFn=end; const iv=setInterval(()=>{if(!live(t)) end()},300); const to=setTimeout(end,a.ms)});
    if(!live(t)) return false; show({pause:null}); if(a.back){show({line:a.back}); if(!(await speakOrRead(a.back,t,2000))) return false} return true}
  return true}

/* ── the session: he chooses, teaches, checks, and keeps going ── */
function dsStep(plan,s){const base={study:true,quiet:true,at:new Date(),when:'the study',cite:'',why:'',title:plan.title};
  if(plan.kind==='unit') return Object.assign(base,{id:'ds:u:'+plan.unit.id,unit:plan.unit,script:[{t:'unit',unit:plan.unit,prev:s.recent.length?s.recent[s.recent.length-1].title:''},{t:'cards',fromUnit:plan.unit.id,intro:'Now let me see what has stayed with you.',label:'Checking the lesson'}]});
  if(plan.kind==='reteach') return Object.assign(base,{id:'ds:r:'+plan.unit.id,unit:plan.unit,script:[{t:'reteach',unit:plan.unit},{t:'cards',fromUnit:plan.unit.id,intro:'And again, the questions.',label:'Checking again'}]});
  if(plan.kind==='review') return Object.assign(base,{id:'ds:rv:'+(plan.cards[0]||'x'),script:[{t:'cards',cards:plan.cards,label:'Review',intro:s.seg===0?'Before anything new, let us see what has stayed with you. '+plan.cards.length+' question'+(plan.cards.length>1?'s':'')+' from earlier lessons.':'A few questions from earlier lessons, so nothing slips away.'}]});
  if(plan.kind==='overview') return Object.assign(base,{id:'ds:ov:'+plan.ch,script:[{t:'overview',ch:plan.ch}]});
  if(plan.kind==='recap') return Object.assign(base,{id:'ds:rc:'+plan.units.map(u=>u.id).join('-'),script:[{t:'recap',units:plan.units}]});
  return null}
function dsPrayerDue(s){const p=prayersOf(new Date()); if(!p) return null; const n=new Date(),mid=new Date(n); mid.setHours(0,0,0,0);
  return [['Fajr',p.fajr],['Ẓuhr',p.dhuhr],['ʿAṣr',p.asr],['Maghrib',p.maghrib],['ʿIshāʾ',p.isha]].map(([k,h])=>[k,new Date(mid.getTime()+h*3600e3)]).find(([k,at])=>at<=n&&at.getTime()>s.start-60000&&!s.prayed.has(k))||null}
const dsWaitIdle=async s=>{for(let i=0;i<2400;i++){if(DS.s!==s) return; if(!running&&!DS.asking) return; await sleep(500)}};
async function dsStart(cfg){cfg=cfg||{}; if(DS.s||!DS.prog) return; const C=dsCfg(), dkey=ymd(new Date());
  const s={start:Date.now(),until:cfg.minutes?Date.now()+cfg.minutes*60000:0,mode:C.mode,chapter:C.ch,seg:0,sinceReview:0,sinceRecap:0,recent:[],quizzed:new Set(),retaught:new Set(),asked:0,right:0,taught:[],first:cfg.first||null,lastBreak:Date.now(),prayed:new Set(),auto:!!cfg.auto,fails:0,current:null};
  DS.s=s; DS.err=''; LSs('dsStopped',null); drawStudy();
  (async()=>{try{const p=JSON.parse(JSON.stringify(DS.prog)); if(await dsAdoptDayLessons(p)){DS.prog=dsMergeProg(DS.prog,p); dsSave(DS.prog,m=>{DS.prog=dsMergeProg(m,DS.prog)}); drawStudy()}}catch(e){}})();
  stopAll(); await sleep(80);
  try{
    while(DS.s===s){
      if(s.until&&Date.now()>=s.until) break;
      if(s.auto&&dsStats(DS.prog).today>=dsCfg().goal) break;
      const n=new Date(),ids=hqLoadDone(ymd(n));
      const due=LSg(HQ_AUTO,true)&&LSg(HQ_HELD,null)!==ymd(n)&&S.prog.find(x=>x.at<=n&&!ids.includes(x.id));
      if(due){await perform(due,{resume:true,auto:true}); if(DS.s!==s) break; if(!hqLoadDone(ymd(n)).includes(due.id)) await dsWaitIdle(s); continue}
      const q=LSg(HQ_REQ,[]); if(q.length){runRequest(q[0]); await sleep(300); await dsWaitIdle(s); continue}
      const pr=dsPrayerDue(s);
      if(pr){s.prayed.add(pr[0]); await perform({id:'ds:prayer:'+pr[0]+dkey,study:true,quiet:true,title:'The time of '+pr[0],at:new Date(),script:[{t:'pause',kind:'prayer',ms:20*60000,label:'The time of '+pr[0],text:'It is the time of '+pr[0]+'. Go and pray; I will wait here for you. Press "I\'m back" when you return.',back:'Welcome back. Let us continue.'}]},{auto:true}); if(DS.s!==s) break; continue}
      if(Date.now()-s.lastBreak>60*60000){s.lastBreak=Date.now(); await perform({id:'ds:rest:'+s.lastBreak,study:true,quiet:true,title:'A short rest',at:new Date(),script:[{t:'pause',kind:'rest',ms:2*60000,label:'A short rest',text:'We have studied for an hour. Stand, stretch, take some water, renew your intention. I continue in two minutes.'}]},{auto:true}); if(DS.s!==s) break; continue}
      const P=DS.prog; let plan=null;
      if(s.first){const u=s.first; s.first=null; plan={kind:P.units[u.id]?'reteach':'unit',unit:u,title:u.title+' · pp.'+u.from+'–'+u.to}}
      else plan=dsPlan({prog:P,state:S.state,mode:s.mode,chapter:s.chapter,seg:s.seg,sinceReview:s.sinceReview,sinceRecap:s.sinceRecap,recent:s.recent,quizzed:s.quizzed,retaught:s.retaught});
      if(!plan){show({line:'Every lesson of the book has been taught, and nothing is due for review. Alḥamdulillāh.'}); break}
      const step=dsStep(plan,s); s.current=plan; drawStudy();
      if(S.sample){const nx=plan.kind==='unit'?dsAfter(plan.unit):plan.kind==='overview'?plan.before:null;
        if(nx&&!(P.units||{})[nx.id]) setTimeout(()=>{dsGetLesson(nx.id).then(l=>l||dsCompose(S.sample,nx,plan.unit?plan.unit.title:'')).catch(()=>{})},1500)}
      const ok=await perform(step,{resume:true,auto:true});
      if(DS.s!==s) break;
      if(!ok){if(step.failed){s.fails++; if(step.failed==='rate_limited'||step.failed==='no-sample'||s.fails>=3){s.err=true; DS.err=step.failed==='no-sample'?'New lessons need Claude: open the engine inside Claude. Review of what you\'ve learned still works.':'Claude is busy or the usage limit was reached, so the study paused. Begin again in a little while.'; break} await sleep(4000); continue}
        await dsWaitIdle(s); if(DS.s!==s) break; continue}
      s.fails=0; s.seg++;
      if(plan.kind==='review') s.sinceReview=0;
      if(plan.kind==='unit'){s.sinceReview++; s.sinceRecap++; s.recent.push(plan.unit); s.taught.push(plan.unit)}
      if(plan.kind==='reteach'){s.retaught.add(plan.unit.id); s.sinceReview++}
      if(plan.kind==='recap') s.sinceRecap=0;
      drawStudy()}
  }finally{
    if(DS.s===s){const min=Math.round((Date.now()-s.start)/60000);
      const sum='We studied '+min+' minute'+(min===1?'':'s')+': '+s.taught.length+' new lesson'+(s.taught.length===1?'':'s')+(s.asked?', '+s.asked+' question'+(s.asked===1?'':'s')+', '+s.right+' answered well':'')+'. May Allah make it a light for you.';
      dsUpdate(p=>{p.sessions=[...(p.sessions||[]),{date:dkey,start:new Date(s.start).toISOString(),min,units:s.taught.map(u=>u.id),asked:s.asked,right:s.right}].slice(-60)});
      if(min>=3){try{await saveJournal({id:'j'+Date.now(),at:Date.now(),kind:'study',title:'Study with al-Muʿallim · '+min+' min',name:'',intent:'the study of the book',count:'',body:sum+(s.taught.length?'\nLessons: '+s.taught.map(u=>u.title+' (pp.'+u.from+'–'+u.to+')').join('; '):''),outcome:'',by:'halqa-study'})}catch(e){}}
      DS.s=null; DS.last=min>=1?sum:''; drawStudy()}}}
function dsEnd(){const s=DS.s; if(!s) return; if(s.auto) LSs('dsStopped',ymd(new Date())); s.until=1; stopAll(); drawStudy()}
async function dsRaiseHand(text){const q=String(text||'').trim(); if(!q||DS.asking) return; if(!S.sample){DS.err='Questions need Claude — open the engine inside Claude.'; drawStudy(); return}
  const s=DS.s, cur=(s&&s.current&&s.current.unit)||(S.lesson?{from:S.lesson.from,to:S.lesson.to,title:S.lesson.title}:null);
  DS.asking=true; tok++; running=false; if(ansFn){const f=ansFn; ansFn=null; f('dead')} try{S.tts&&S.tts.stop&&S.tts.stop()}catch(e){}
  S.run={id:'ds:ask',title:'Answering your question',label:'You asked: '+q,line:'Let me think…'}; drawStage(); drawMini(); const t=tok; running=true;
  try{const a=await dsAnswerQuestion(S.sample,cur,q,DS.handLog); DS.handLog=[...DS.handLog,{q,a,at:Date.now()}].slice(-30); show({line:a}); await speakOrRead(a,t,Math.max(6000,a.split(/\s+/).length*280))}
  catch(e){show({line:e&&e.code==='rate_limited'?'Claude is busy just now — ask again in a moment.':'I could not answer just now.'}); await sleep(2500)}
  finally{if(live(t)){running=false; S.run=null; drawStage(); drawMini()} DS.asking=false; drawStudy()}}
async function dsInit(){try{DS.prog=await dsLoad(); const p=JSON.parse(JSON.stringify(DS.prog)); if(await dsAdoptDayLessons(p)){DS.prog=dsMergeProg(DS.prog,p); dsSave(DS.prog,m=>{DS.prog=dsMergeProg(m,DS.prog)})}}catch(e){DS.prog=DS.prog||{units:{},overviews:{},cards:{},minutes:{},sessions:[],answers:[],exams:{}}} drawStudy()}
setInterval(()=>{if(DS.s&&(running||DS.asking)) dsUpdate(p=>{const k=ymd(new Date()); p.minutes=Object.assign({},p.minutes||{},{[k]:Math.round(((p.minutes||{})[k]||0)+1)})})},60000);

/* ── the Study's panel, the course map and the chapter exam ── */
function drawStudy(){const el=document.getElementById('dsBox'); if(!el) return; const C=dsCfg();
  if(!DS.prog){el.innerHTML='<h2>The Study <span class="ari" style="color:var(--gold)">الدرس</span></h2><p class="empty">Opening the record of the course…</p>'; return}
  const st=dsStats(DS.prog), s=DS.s, P=DS.prog;
  const nextPlan=!s?dsPlan({prog:P,state:S.state,mode:C.mode,chapter:C.ch,seg:0,sinceReview:0,sinceRecap:0,recent:[],quizzed:new Set()}):null;
  const opt=(v,l,cur)=>'<option value="'+v+'"'+(String(v)===String(cur)?' selected':'')+'>'+esc(l)+'</option>';
  let h='<h2>The Study <span class="ari" style="color:var(--gold)">الدرس</span></h2><p class="meta">The whole book with the teacher, in '+st.total+' lessons cut at its own headings (each Name of ch.16 its own). In a session he weighs what is due: questions you may have forgotten first, the map of a chapter before you enter it, then the next pages — the book\'s text, the teaching, and checked at once with four answers — and every third lesson gathered up. He pauses for each prayer and rests you every hour. A word "from the masters" is always marked as from outside the book.</p>';
  h+='<div class="dshead"><div class="hqbig">'+(s?(s.current?esc(s.current.title):'Beginning…'):st.today>=C.goal?'Today\'s study goal is met — he can keep going if you wish':'He chooses what to teach, and teaches it')+'</div>'+(s?'<button class="more" id="dsEnd">■ End the study</button>':'<button class="more pri" id="dsGo">▶ Begin the study'+(+C.len?' · '+(+C.len>=60?(C.len/60)+' h':C.len+' min'):'')+'</button>')+'</div>';
  h+='<div class="stats">'+[['today',st.today+' / '+C.goal+' min'],['the book',st.taught+' of '+st.total+' · '+st.pct+'%'],['due for review',st.due],['remembered',st.retention==null?'—':st.retention+'%'],['days in a row',st.streak]].concat(s?[['this session',Math.round((Date.now()-s.start)/60000)+' min · '+s.taught.length+' lessons · '+s.right+'/'+s.asked]]:[]).map(([k,v])=>'<div class="stat"><b>'+esc(v)+'</b><span>'+k+'</span></div>').join('')+'</div>';
  h+='<div class="hqbar" style="width:100%"><span style="width:'+Math.min(100,100*st.today/Math.max(1,C.goal))+'%"></span></div>';
  if(nextPlan) h+='<p class="meta">He would begin with: <b style="color:var(--ink)">'+esc(nextPlan.title)+'</b></p>';
  h+='<div class="tools"><select id="dsMode" aria-label="What he teaches">'+DS_MODES.map(([k,l])=>opt(k,l,C.mode)).join('')+'</select>'+(C.mode==='chapter'?'<select id="dsCh" aria-label="Chapter">'+dsChapters().filter(c=>c.to>=DS_START).map(c=>opt(c.ch,(c.ch?'ch.'+c.ch:'Prologue')+' · '+c.short,C.ch)).join('')+'</select>':'')+'<select id="dsLen" aria-label="Session length">'+[[30,'30 minutes'],[60,'1 hour'],[120,'2 hours'],[180,'3 hours'],[240,'4 hours'],[0,'until I stop him']].map(([v,l])=>opt(v,l,C.len)).join('')+'</select><select id="dsGoal" aria-label="Daily goal">'+[30,60,120,180,240,300,360].map(v=>opt(v,'goal '+(v<60?v+' min':v/60+' h')+' a day',C.goal)).join('')+'</select></div>';
  h+='<div class="flt"><button data-dsc="read" aria-pressed="'+!!C.read+'" title="Show the book\'s own pages before teaching them">'+(C.read?'Reads the pages first':'Teaching only')+'</button><button data-dsc="wait" aria-pressed="'+!C.wait+'" title="After a question: wait for your answer, or give it after 30 seconds">'+(C.wait?'Answers after 30 s':'Waits for my answer')+'</button><button data-dsc="self" aria-pressed="'+!!C.self+'" title="When the engine is open he begins the study by himself and keeps going until the day\'s goal is met; each new lesson uses your Claude usage">'+(C.self?'● Studies by himself to the goal':'Waits for ▶')+'</button></div>';
  h+='<div class="tools"><label for="dsHand" hidden>Raise your hand</label><input id="dsHand" placeholder="✋ Raise your hand — ask him anything about the lesson or the path" autocomplete="off"><button class="more" id="dsAsk">Ask</button></div>';
  if(DS.err) h+='<p class="fnd">'+esc(DS.err)+'</p>';
  if(DS.last&&!s) h+='<p class="meta">'+esc(DS.last)+'</p>';
  if(DS.handLog.length) h+='<details><summary class="meta">your questions today · '+DS.handLog.length+'</summary>'+DS.handLog.slice().reverse().map(x=>'<div style="margin-top:8px"><div style="color:var(--gold)">'+esc(x.q)+'</div><div class="hqlesson">'+arw(x.a)+'</div></div>').join('')+'</details>';
  h+='<p class="meta">'+(S.db?'Kept with the engine\'s records (study/progress, copied from the Iḥyāʾ Engine and joined on every save).':'Kept in this browser.')+(S.sample?'':' New lessons and chapter maps are written by Claude: open the engine inside Claude for them. Review of what was taught works anywhere.')+'</p>';
  el.innerHTML=h;
  const on=(id,f)=>{const x=document.getElementById(id); if(x) x.onclick=f};
  on('dsGo',()=>{dsStart({minutes:+dsCfg().len}); const st=document.getElementById('hqStage'); if(st) st.scrollIntoView({behavior:'smooth',block:'start'})}); on('dsEnd',dsEnd);
  [['dsMode','mode',String],['dsCh','ch',Number],['dsLen','len',Number],['dsGoal','goal',Number]].forEach(([id,k,f])=>{const x=document.getElementById(id); if(x) x.onchange=e=>{dsSetCfg(k,f(e.target.value)); if(DS.s&&(k==='mode'||k==='ch')){DS.s.mode=dsCfg().mode; DS.s.chapter=dsCfg().ch} drawStudy()}});
  el.querySelectorAll('[data-dsc]').forEach(b=>b.onclick=()=>{const k=b.dataset.dsc; dsSetCfg(k,k==='wait'?(C.wait?0:30):!C[k]); drawStudy()});
  const hi=document.getElementById('dsHand'); hi.onkeydown=e=>{if(e.key==='Enter'){dsRaiseHand(hi.value); hi.value=''}}; on('dsAsk',()=>{dsRaiseHand(hi.value); hi.value=''});
  drawMap()}
const DS_COL={new:'var(--line)',taught:'color-mix(in srgb,var(--gold) 55%,transparent)',kept:'var(--ok)',weak:'var(--warn)'};
function drawMap(){const el=document.getElementById('dsMap'); if(!el||!DS.prog) return; const P=DS.prog, U=dsUnits(), cur=DS.s&&DS.s.current&&DS.s.current.unit?DS.s.current.unit.id:null;
  let h='<details'+(DS.mapOpen?' open':'')+' id="dsMapD"><summary><h2>The whole book — course map</h2><span class="chev" aria-hidden="true">❯</span></summary><div class="dsmap">';
  for(const c of dsChapters().filter(c=>c.to>=DS_START)){const us=U.filter(u=>u.ch===c.ch), stt=us.map(u=>dsUnitStatus(P,u)), n=stt.filter(x=>x!=='new').length, ex=(P.exams||{})[c.ch];
    h+='<div class="dsch"><button class="dschb" data-dsch="'+c.ch+'" aria-expanded="'+(DS.open===c.ch)+'"><span class="num">'+(c.ch?'ch.'+c.ch:'pro.')+'</span><span style="min-width:0"><span>'+esc(c.short)+'</span><span class="dsdots">'+stt.map((x,i)=>'<i title="'+esc(us[i].title)+'" style="background:'+DS_COL[x]+(cur===us[i].id?';outline:2px solid var(--gold)':'')+'"></i>').join('')+'</span></span><span class="num">'+n+'/'+us.length+(P.overviews[c.ch]?'':' · map not yet given')+(ex?' · exam best '+ex.best+'%'+(ex.passed?' ✓':''):'')+'</span></button>';
    if(DS.open===c.ch){h+='<div class="tools">'+(DS.exam&&DS.exam.ch===c.ch?'':'<button class="more" data-dsex="'+c.ch+'">Sit the chapter\'s exam</button>')+'<span class="meta">multiple choice · up to '+DS_EXAM_N+' questions from the lessons already taught · '+Math.round(DS_EXAM_PASS*100)+'% passes</span></div>';
      if(DS.exam&&DS.exam.ch===c.ch) h+='<div id="dsExam" class="dsexam"></div>';
      h+='<div class="dsunits">'+us.map((u,i)=>'<div class="dsu"><i style="background:'+DS_COL[stt[i]]+'"></i><span class="num">pp.'+u.from+(u.to>u.from?'–'+u.to:'')+'</span><span class="t">'+esc(u.title)+'</span><span class="acts"><button class="more" data-dst="'+u.id+'">'+(stt[i]==='new'?'teach me this':'again')+'</button><button class="more" data-dsr="'+u.from+'">read</button></span></div>').join('')+'</div>'}
    h+='</div>'}
  h+='</div><p class="meta">'+[['new','not yet taught'],['taught','taught'],['kept','kept — answered well twice'],['weak','forgotten — he will come back to it']].map(([k,l])=>'<span style="white-space:nowrap"><i class="dskey" style="background:'+DS_COL[k]+'"></i>'+l+'</span>').join(' · ')+'</p></details>';
  el.innerHTML=h;
  document.getElementById('dsMapD').ontoggle=e=>{DS.mapOpen=e.target.open};
  el.querySelectorAll('[data-dsch]').forEach(b=>b.onclick=()=>{const c=+b.dataset.dsch; DS.open=DS.open===c?null:c; drawMap()});
  el.querySelectorAll('[data-dst]').forEach(b=>b.onclick=()=>{const u=U.find(x=>x.id===b.dataset.dst); if(DS.s){DS.s.first=u; stopAll()} else dsStart({minutes:+dsCfg().len,first:u}); const st=document.getElementById('hqStage'); if(st) st.scrollIntoView({behavior:'smooth',block:'start'})});
  el.querySelectorAll('[data-dsr]').forEach(b=>b.onclick=()=>{RD.pg=+b.dataset.dsr; RD.q=''; rdSave(); tab='read'; render(); window.scrollTo(0,0)});
  el.querySelectorAll('[data-dsex]').forEach(b=>b.onclick=()=>dsExamOpen(+b.dataset.dsex));
  if(DS.exam) drawExam()}
async function dsExamOpen(ch){DS.exam={ch,qs:null,i:0,ans:[],picked:null}; drawMap();
  const Um=new Map(dsUnits().map(u=>[u.id,u])), C=dsChapters().find(c=>c.ch===ch), out=[];
  for(const id of dsShuffle(dsExamCards(DS.prog,ch,Um))){if(out.length>=DS_EXAM_N) break; let c=await dsCardText(id).catch(()=>null); if(!c) continue;
    if(id.startsWith('L')&&!(c.from>=C.from&&c.from<=C.to)) continue;
    if(!(c.choices&&c.choices.length>=3)) c=await dsChoicesFor(null,c).catch(()=>c);
    const m=c&&dsNormQ({q:c.q,a:c.a,choices:c.choices,correct:c.correct}); if(m&&m.choices){const cc=Object.assign({},c,{choices:m.choices,correct:m.correct}); out.push(Object.assign(cc,dsDeal(cc)))}}
  if(DS.exam&&DS.exam.ch===ch){DS.exam.qs=out; drawExam()}}
function drawExam(){const el=document.getElementById('dsExam'), E=DS.exam; if(!el||!E) return; const C=dsChapters().find(c=>c.ch===E.ch)||{}, name='the exam of '+(E.ch?'chapter '+E.ch:'the prologue');
  if(!E.qs){el.innerHTML='<p class="empty">Drawing the questions of '+name+'…</p>'; return}
  if(E.qs.length<DS_EXAM_MIN){el.innerHTML='<p>Only '+E.qs.length+' question'+(E.qs.length===1?'':'s')+' with options so far — an exam needs at least '+DS_EXAM_MIN+'. Study more of this chapter with him and come back.</p><button class="more" id="dsExX">close</button>'; document.getElementById('dsExX').onclick=()=>{DS.exam=null; drawMap()}; return}
  const sc=dsExamScore(E.ans);
  if(E.i>=E.qs.length){const at=ymd(new Date()); if(!E.saved){E.saved=true; dsUpdate(p=>{const o=(p.exams||{})[E.ch]||{}; p.exams=Object.assign({},p.exams||{},{[E.ch]:{best:Math.max(o.best||0,sc.pct),last:sc.pct,n:sc.n,at,sittings:(o.sittings||0)+1,passed:o.passed||(sc.pass?at:null)}})}); return}
    const nm=LSg('ijazaName','Al'); const svg=sc.pass?dsIjazaSvg({ch:E.ch,name:nm,pct:sc.pct,n:sc.n,date:at}):'';
    el.innerHTML='<div class="hqlbl">'+esc(name)+' · '+esc(C.short||'')+'</div><div class="hqbig">'+sc.right+' of '+sc.n+' · '+sc.pct+'%</div><p style="color:'+(sc.pass?'var(--ok)':'var(--warn)')+'">'+(sc.pass?'Passed — the record of reading is yours.':'Not yet — '+Math.round(DS_EXAM_PASS*100)+'% passes. The questions you missed come back in the review.')+'</p>'+(sc.pass?'<div class="tools"><label class="meta" for="dsNm">name on the record</label><input id="dsNm" value="'+esc(nm)+'" style="flex:0 1 200px"></div><div class="plate" id="dsIj">'+svg.replace('width="900" height="640"','width="100%"')+'</div><div class="tools"><button class="more pri" id="dsIjDl">Download the record (SVG)</button><span id="dsIjM" class="meta"></span></div>':'')+'<button class="more" id="dsExX">close</button>';
    const ni=document.getElementById('dsNm'); if(ni) ni.onchange=e=>{LSs('ijazaName',e.target.value); drawExam()};
    const dl=document.getElementById('dsIjDl'); if(dl) dl.onclick=async()=>{const ok=await saveFile('shahada-chapter-'+E.ch+'.svg',dsIjazaSvg({ch:E.ch,name:LSg('ijazaName','Al'),pct:sc.pct,n:sc.n,date:at}),'image/svg+xml'); document.getElementById('dsIjM').textContent=ok?'':'Saving isn’t available in this view.'};
    document.getElementById('dsExX').onclick=()=>{DS.exam=null; drawMap()}; return}
  const q=E.qs[E.i];
  el.innerHTML='<div class="tools" style="justify-content:space-between"><span class="hqlbl">'+esc(name)+' · question '+(E.i+1)+' of '+E.qs.length+'</span><button class="linkbtn" id="dsExX">leave the exam</button></div><div class="hqbig" style="font-size:1.1rem">'+esc(q.q)+'</div><div class="hqq">'+q.order.map((ci,pos)=>{const c=E.picked!=null?(ci===q.correct?' ok':ci===E.picked?' no':''):''; return '<button data-dsq="'+ci+'" class="'+c+'"'+(E.picked!=null?' disabled':'')+'><b>'+DS_LT[pos]+'</b><span>'+esc(q.choices[ci])+'</span></button>'}).join('')+'</div>'+(E.picked!=null?'<div class="tools"><span class="meta">'+(E.picked===q.correct?'Right.':'The answer: '+esc(q.choices[q.correct]))+' · pp.'+q.from+(q.to>q.from?'–'+q.to:'')+'</span><button class="more pri" id="dsExN">'+(E.i+1<E.qs.length?'next':'see the result')+'</button></div>':'');
  document.getElementById('dsExX').onclick=()=>{DS.exam=null; drawMap()};
  el.querySelectorAll('[data-dsq]').forEach(b=>b.onclick=()=>{if(E.picked!=null) return; E.picked=+b.dataset.dsq; E.ans.push({id:q.id,ok:E.picked===q.correct}); drawExam()});
  const nx=document.getElementById('dsExN'); if(nx) nx.onclick=()=>{E.picked=null; E.i++; drawExam()}}

/* ── the page ── */
const css=document.createElement('style'); css.textContent=`
#hqRoot{display:grid;gap:16px;min-width:0}
.hqtop{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.hqstage{min-height:220px;background:radial-gradient(700px 240px at 50% 0,color-mix(in srgb,var(--gold) 12%,transparent),transparent 70%),var(--panel);border-color:color-mix(in srgb,var(--gold) 40%,var(--line))}
.hqstage.on{border-color:var(--gold)}
.hqlbl{font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);font-family:var(--f-mono)}
.hqbig{font-family:var(--f-head);font-size:1.45rem;line-height:1.3;text-wrap:balance}
.hqar{font-family:var(--f-ar);font-size:clamp(1.7rem,6vw,2.6rem);line-height:1.75;direction:rtl;text-align:center;color:var(--ink);overflow-wrap:anywhere}
.hqar.qr{font-size:clamp(1.35rem,4.6vw,2rem);line-height:2.1}
.hqtr{font-style:italic;color:var(--muted);text-align:center;max-width:62ch;margin:0 auto}
.hqen{color:var(--muted);text-align:center;max-width:62ch;margin:0 auto;font-size:.9rem}
.hqcount{display:grid;justify-items:center;gap:6px}
.hqcount button.tapc{font-family:var(--f-mono);font-size:2.2rem;min-width:9rem;min-height:4.2rem;border-radius:18px;border:2px solid var(--gold);background:var(--gold-soft);color:var(--ink);cursor:pointer;font-variant-numeric:tabular-nums}
.hqcount .of{font-size:1rem;color:var(--muted)}
.hqbar{height:6px;border-radius:4px;background:var(--line);overflow:hidden;width:min(420px,100%)}
.hqbar span{display:block;height:100%;background:var(--gold);transition:width .2s}
.hqgrid{display:grid;gap:3px;margin:8px auto;width:min(100%,var(--w))}
.hqgrid span{aspect-ratio:1;display:grid;place-items:center;font-family:var(--f-mono);font-variant-numeric:tabular-nums;border:1px solid var(--line);border-radius:4px;color:transparent;transition:background .2s,color .2s;font-size:.9rem;min-width:0}
.hqgrid span.on{color:var(--ink);background:var(--gold-soft)}
.hqgrid span.cur{background:var(--gold);color:#1a1405;border-color:var(--gold)}
.hqpara{font-size:1.05rem;line-height:1.8;max-width:68ch}
.hqpara .pg{font-family:var(--f-mono);font-size:.72rem;color:var(--gold);margin-right:8px}
.hqline{font-size:1.05rem;line-height:1.75;max-width:68ch}
.hqq{display:grid;gap:6px}
.hqq button{font:inherit;text-align:left;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);cursor:pointer;display:flex;gap:10px;align-items:baseline}
.hqq button b{font-family:var(--f-mono);color:var(--gold)}
.hqq button.ok{border-color:var(--ok);background:var(--ok-soft)}.hqq button.no{border-color:var(--warn);background:color-mix(in srgb,var(--warn) 12%,transparent)}
.hqans{color:var(--ok);line-height:1.7;max-width:68ch}
.hqrow{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.hqrow:last-child{border-bottom:0}
.hqrow .tm{font-family:var(--f-mono);font-size:.85rem;font-variant-numeric:tabular-nums}
.hqrow .tm small{display:block;font-size:.7rem;color:var(--muted)}
.hqrow.done{opacity:.72}.hqrow.done .tm{color:var(--ok)}.hqrow.due .tm{color:var(--gold)}.hqrow.now{background:var(--gold-soft);border-radius:8px;padding-inline:8px}
.hqrow .acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.hqmini{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:20;max-width:min(420px,calc(100vw - 24px));display:flex;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--gold);border-radius:14px;padding:8px 12px;box-shadow:0 10px 30px -12px rgba(0,0,0,.45)}
.hqmini button.go{flex:1;min-width:0;border:0;background:none;color:var(--ink);text-align:left;cursor:pointer;font:inherit;padding:0}
.hqmini .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.88rem}
.hqmini .x{border:1px solid var(--gold);background:none;color:var(--gold);border-radius:50%;width:30px;height:30px;cursor:pointer;flex:none}
.hqlesson{max-width:70ch;line-height:1.75;white-space:pre-wrap}
.hqgrid-s{display:grid;gap:2px;width:min(100%,var(--w))}.hqgrid-s span{aspect-ratio:1;display:grid;place-items:center;border:1px solid var(--line);border-radius:3px;font-family:var(--f-mono);font-size:.82rem;font-variant-numeric:tabular-nums;min-width:0}
#dsBox,#dsMap{grid-template-columns:minmax(0,1fr)}
.dshead{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center}
.dsmap{display:grid;gap:6px;margin-top:10px}
.dsch{border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg);min-width:0}
.dschb{font:inherit;display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;background:none;border:0;color:var(--ink);text-align:left;cursor:pointer;padding:4px 0;min-height:44px}
.dsdots{display:flex;flex-wrap:wrap;gap:2px;margin-top:5px}.dsdots i,.dsu i,.dskey{display:inline-block;width:8px;height:8px;border-radius:2px;flex:none}.dskey{margin-right:5px;vertical-align:middle}
.dsunits{display:grid;gap:4px;max-height:380px;overflow-y:auto;margin-top:8px}
.dsu{display:grid;grid-template-columns:10px 84px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:.9rem;padding:3px 0;border-bottom:1px solid var(--line)}
.dsu .acts{display:flex;gap:4px}.dsu .more{padding:4px 10px;font-size:.78rem}
.dsexam{display:grid;gap:8px;border:1px solid var(--gold);border-radius:8px;padding:12px;margin-top:8px;background:var(--panel)}
#dsMap summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px}#dsMap summary::-webkit-details-marker{display:none}#dsMap summary .chev{color:var(--gold);transition:transform .2s}#dsMap details[open]>summary .chev{transform:rotate(90deg)}
@media (max-width:520px){.dsu{grid-template-columns:10px minmax(0,1fr)}.dsu .num{grid-column:2}.dsu .t{grid-column:2}.dsu .acts{grid-column:2}.dschb{grid-template-columns:40px minmax(0,1fr)}.dschb>.num:last-child{grid-column:2}}
@media (max-width:520px){.hqrow{grid-template-columns:52px minmax(0,1fr)}.hqrow .acts{grid-column:1/-1;justify-content:flex-start}}
@media (prefers-reduced-motion:reduce){.hqbar span,.hqgrid span{transition:none}}`;
document.head.appendChild(css);

function hqRender(){const root=document.getElementById('hqRoot'); if(!root) return;
  if(!M){root.innerHTML='<section class="box"><h2>al-Ḥalqa <span class="ari" style="color:var(--gold)">الحلقة</span></h2><p class="empty">Opening the circle…</p></section>'; hqInit().then(()=>{if(M) hqRender()}); return}
  const auto=LSg(HQ_AUTO,true), watch=LSg('halqaWatch',true), held=LSg(HQ_HELD,null)===ymd(new Date()), count=LSg(HQ_COUNT,'auto'), tk=tqKey();
  let h='<section class="box"><h2>al-Ḥalqa <span class="ari" style="color:var(--gold)">الحلقة</span></h2><p class="meta">The daily circle. The day\'s practice is performed step by step at its hour — the day\'s verse and Name, the square of the first hour, the wird, the day\'s portion of Yā-Sīn, a lesson through the whole book, its review, the closing verse and the journal — and between them every planetary hour is kept with the next of the Ninety-nine: its pages, its count, its square. Arabic is never spoken by a machine: Names and verses are shown, vowelled, and counted on screen.</p>';
  h+='<div class="hqtop flt"><button data-hq="auto" aria-pressed="'+auto+'">'+(auto?'● Leading the day':'Paused — resume')+'</button>'+(held?'<button data-hq="held" aria-pressed="true">■ Stopped for today — let him resume</button>':'')+'<button data-hq="day">▶ Perform the whole day now</button><button data-hq="watch" aria-pressed="'+watch+'">'+(watch?'● Keeping the hours':'Hours off')+'</button><button data-hq="hour">▶ This hour now</button></div>';
  h+='<div class="hqtop flt"><button data-hq="count" aria-pressed="'+(count==='tap')+'" title="Auto: counted on screen at reading pace. Tap: you say each one and tap (or press Space).">'+(count==='tap'?'I count myself (tap)':'Counted at reading pace')+'</button>'+(S.tts?'<button data-hq="voice" aria-pressed="'+voiceOn()+'" title="The English lines read aloud; Arabic and transliteration are never voiced.">'+(voiceOn()?'♪ English read aloud':'Silent — read on screen')+'</button>':'')+'<label for="hqTq" class="meta">Wird</label><select id="hqTq">'+Object.entries(M.tariqa).map(([k,T])=>'<option value="'+k+'"'+(k===tk?' selected':'')+'>'+esc(T.name)+'</option>').join('')+'</select></div></section>';
  h+='<section class="box hqstage" id="hqStage"></section>';
  h+='<section class="box"><h2>Hand him a working</h2><div class="tools"><label for="hqAsk" hidden>A Name, text or number</label><input id="hqAsk" placeholder="a Name (al-Wahhāb, #17, وهاب), a text, or a number" value="'+esc(S.hand)+'" autocomplete="off"><select id="hqOrd" aria-label="Which square"><option value="0">the hour\'s square</option>'+[3,4,5,6,7,8,9].map(k=>'<option value="'+k+'">'+k+'×'+k+'</option>').join('')+'</select><button class="more pri" id="hqNow">Do it now</button><button class="more" id="hqAfter">after this</button></div><div id="hqWork"></div></section>';
  h+='<section class="box"><h2>Today\'s circle</h2><div id="hqDay"></div><p class="meta">Times are computed for '+esc(TD.loc[0])+' ('+esc(TD.method)+'; change the place on My day). Which practice sits after which prayer is the Iḥyāʾ Engine\'s arrangement, not the book\'s; each line says what comes from the book.</p></section>';
  h+='<section class="box" id="hqCourse"></section>';
  h+='<section class="box" id="dsBox"></section><section class="box" id="dsMap"></section>';
  root.innerHTML=h;
  root.querySelectorAll('[data-hq]').forEach(b=>b.onclick=()=>{const k=b.dataset.hq;
    if(k==='auto'){const v=!LSg(HQ_AUTO,true); LSs(HQ_AUTO,v); if(!v) stopAll()} else if(k==='held'){LSs(HQ_HELD,null)}
    else if(k==='day'){stopAll(); setTimeout(runDay,50)} else if(k==='watch'){LSs('halqaWatch',!LSg('halqaWatch',true))}
    else if(k==='hour'){const hs=hourSession(new Date()); if(hs){stopAll(); setTimeout(()=>perform(hs,{resume:true,onDone:advanceName}),60)}}
    else if(k==='count'){LSs(HQ_COUNT,LSg(HQ_COUNT,'auto')==='tap'?'auto':'tap')} else if(k==='voice'){LSs(HQ_VOICE,!LSg(HQ_VOICE,false))}
    hqRender()});
  document.getElementById('hqTq').onchange=e=>{LSs('tariqa',e.target.value); S.prog=hqProgram(new Date()); drawDay()};
  const ai=document.getElementById('hqAsk'); ai.oninput=()=>{S.hand=ai.value; S.askErr=''; drawWork()}; ai.onkeydown=e=>{if(e.key==='Enter') addRequest(true)};
  document.getElementById('hqNow').onclick=()=>addRequest(true); document.getElementById('hqAfter').onclick=()=>addRequest(false);
  drawStage(); drawWork(); drawDay(); drawCourse(); drawStudy()}
window.hqRender=hqRender;
function addRequest(now){const q=S.hand.trim(); if(!q) return; const nm=hqFindName(q), num=/^\d+$/.test(q), ar=/[؀-ۿ]/.test(q);
  if(!nm&&!num&&!ar){S.askErr='I don\'t know that Name in this spelling — write it as in the list (al-Wahhāb, Wahhab), by its number (#17), in Arabic (وهاب), or as a number.'; drawWork(); return}
  S.askErr=''; const r={id:Date.now().toString(36),q,order:+document.getElementById('hqOrd').value||0,at:Date.now()};
  if(now){runRequest(r,true); const l=[r,...LSg(HQ_REQ,[])]; LSs(HQ_REQ,l); S.reqs=l; const st=document.getElementById('hqStage'); if(st) st.scrollIntoView({behavior:'smooth',block:'start'})} else{const l=[...LSg(HQ_REQ,[]),r]; LSs(HQ_REQ,l); S.reqs=l}
  S.hand=''; const ai=document.getElementById('hqAsk'); if(ai) ai.value=''; drawWork()}
function toForge(f){stopAll(); FG.grid=null; FG.text=f.text||''; FG.num=f.value?String(f.value):''; FG.order=f.order||0; FG.mode='wafq'; fgSave(); tab='forge'; render(); window.scrollTo(0,0)}
function smallGrid(g){const n=g.length; return '<div class="hqgrid-s" style="grid-template-columns:repeat('+n+',minmax(0,1fr));--w:'+Math.min(420,n*58)+'px">'+g.flat().map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>'}
function drawWork(){const el=document.getElementById('hqWork'); if(!el) return; const nm=hqFindName(S.hand); let h='';
  if(S.hand&&nm) h+='<p class="meta">'+esc(nm.tr)+' <span class="ari">'+esc(nm.ab)+'</span> · '+esc(nm.en)+' · '+nm.mb+(nm.mw?' (with the article '+nm.mw+')':'')+(nm.p?' · p.'+nm.p:'')+'</p>';
  if(S.askErr) h+='<p class="fnd">'+esc(S.askErr)+'</p>';
  const reqs=LSg(HQ_REQ,[]); if(reqs.length) h+='<p class="meta">Waiting: '+reqs.map(r=>esc(r.q)).join(' · ')+' <button class="linkbtn" id="hqClr">clear</button></p>';
  h+='<p class="meta">He reads the Name\'s pages, counts it by its number, builds the square — by the first rule at the order you choose; below that square\'s floor he says so and takes the Name with its article, then the largest square it fills, then the 3×3 second rule (p.1705) — checks every line, and leaves it ready in the Forge.</p>';
  const w=S.lastWork; if(w&&w.grid){const cs=checkSums(w.grid); h+='<div class="sq"><div class="vh"><span class="k">'+esc(w.label)+' · '+w.n+'×'+w.n+' on '+w.A+'</span><span class="tag'+(cs.balanced?'':' b')+'">'+(cs.balanced?'every line '+cs.rows[0]+(cs.diagonals?', diagonals too':''):'lines differ')+'</span></div><p class="meta">'+esc(w.rule)+'</p>'+smallGrid(w.grid)+'<div class="tools"><button class="more" id="hqWF">Open in the Forge</button></div></div>'}
  el.innerHTML=h; const c=document.getElementById('hqClr'); if(c) c.onclick=()=>{LSs(HQ_REQ,[]); S.reqs=[]; drawWork()};
  const wf=document.getElementById('hqWF'); if(wf) wf.onclick=()=>toForge(S.lastWork.forge||{text:w.nm?w.nm.ab:'',order:w.n})}
function drawDay(){const el=document.getElementById('hqDay'); if(!el||!M) return; const now=new Date(), done=hqLoadDone(ymd(now));
  el.innerHTML='<p class="meta">'+now.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})+' · the day of '+plName(DAY_RULERS[now.getDay()])+'</p>'+S.prog.map(s=>{const isDone=done.includes(s.id), isNow=S.run&&S.run.id===s.id, due=s.at<=now;
    return '<div class="hqrow'+(isDone?' done':'')+(isNow?' now':'')+(!isDone&&due?' due':'')+'"><div class="tm">'+fmt(s.at)+'<small>'+(isDone?'✓ done':isNow?'now':due?'due':'')+'</small></div><div style="min-width:0"><div>'+esc(s.title)+' <span class="num">· '+esc(s.cite)+'</span></div><div class="meta">'+esc(s.when)+' — '+arw(s.why)+'</div></div><div class="acts">'+(s.forge?'<button class="more" data-hqf="'+s.id+'">Forge</button>':'')+(s.id==='litany'?'<button class="more" data-hqr="1">Read Q 36</button>':'')+'<button class="more'+(isNow?'':' pri')+'" data-hqw="'+s.id+'">'+(isNow?'■ Stop':'▶ Watch')+'</button></div></div>'}).join('');
  el.querySelectorAll('[data-hqw]').forEach(b=>b.onclick=()=>{const s=S.prog.find(x=>x.id===b.dataset.hqw); if(S.run&&S.run.id===s.id) stopByHand(); else{stopAll(); setTimeout(()=>perform(s,{resume:true}),40); const st=document.getElementById('hqStage'); if(st) st.scrollIntoView({behavior:'smooth',block:'start'})}});
  el.querySelectorAll('[data-hqf]').forEach(b=>b.onclick=()=>toForge(S.prog.find(x=>x.id===b.dataset.hqf).forge));
  el.querySelectorAll('[data-hqr]').forEach(b=>b.onclick=()=>{const [a,z]=tqYasin(M.ch20[now.getDay()]); stopAll(); perform({id:'read36',title:'Yā-Sīn '+a+'–'+z,quiet:true,script:[{t:'recite',ar:'يس',tr:'',times:1,label:'Yā-Sīn '+a+'–'+z,q:{s:36,a,to:z}}]},{})})}
function drawIdle(){const el=document.getElementById('hqStage'); if(!el||S.run||!M) return; const now=new Date(), done=hqLoadDone(ymd(now)); el.classList.remove('on');
  const next=S.prog.find(s=>!done.includes(s.id)&&s.at>now); const H=hqHourNow(now), nm=nameNow(); const auto=LSg(HQ_AUTO,true), watch=LSg('halqaWatch',true);
  let h='<div class="hqlbl">'+esc(DAY_TABLE[now.getDay()].d)+' · day of '+plName(DAY_RULERS[now.getDay()])+'</div><div class="hqbig">'+(next?'Next: '+esc(next.title)+' <span style="color:var(--gold)">at '+fmt(next.at)+'</span>':S.prog.every(s=>done.includes(s.id))?'Today\'s circle is complete — he keeps the hours.':'The rest of today is waiting — press ▶ on any step.')+'</div>';
  if(H&&nm){const key='hour:'+H.h.start.toISOString().slice(0,16), kept=done.includes(key); h+='<p>'+(kept?'This hour ('+plName(H.h.planet)+') is kept. Next hour at <b>'+fmt(H.h.end)+'</b> — '+esc(nm.tr)+' <span class="ari">'+esc(nm.ab)+'</span>.':'The hour of '+plName(H.h.planet)+' until '+fmt(H.h.end)+' — '+esc(nm.tr)+' <span class="ari">'+esc(nm.ab)+'</span> = '+nm.mb+(H.h.end-now<4*60000?' (too little of this hour is left; he begins at the next)':'')+'.')+'</p>'}
  h+='<p class="meta">'+(auto?(watch?'While the engine is open he keeps every hour, day and night, and each step of the circle at its time; wherever you are in the engine a small bar shows what he is doing.':'He leads the circle at its times; the hours are off.'):'He is paused. Resume him, or press ▶ on any step. Anything you hand him he still does.')+'</p>';
  el.innerHTML=h}
function drawStage(){const el=document.getElementById('hqStage'); if(!el) return; const r=S.run; if(!r){drawIdle(); return} el.classList.add('on'); const st=S.prog.find(s=>s.id===r.id);
  let h='<div class="tools" style="justify-content:space-between"><div class="hqlbl">'+esc(st?st.title:r.title||'')+(r.label&&r.label!==(st?st.title:r.title)?' · '+esc(r.label):'')+'</div><button class="more" id="hqStop">■ Stop</button></div>';
  if(r.ar){h+='<div class="hqar'+(r.qr?' qr':'')+'">'+esc(r.ar)+'</div>'+(r.tr&&r.tr!==r.ar?'<p class="hqtr">'+esc(r.tr)+'</p>':'')+(r.en?'<p class="hqen">'+esc(r.en)+' <span class="num">(Pickthall)</span></p>':'');
    if(r.of>1){const mode=LSg(HQ_COUNT,'auto'); h+='<div class="hqcount">'+(mode==='tap'?'<button class="tapc" id="hqTap" aria-label="Count one">'+(r.count||0)+'<span class="of"> / '+r.of+'</span></button><div class="flt"><button id="hqTap33">+33</button><button id="hqTapAll">finish the count</button></div><p class="meta">Say it, then tap (or press Space).</p>':'<div style="font-family:var(--f-mono);font-size:2.3rem;color:var(--gold);font-variant-numeric:tabular-nums">'+(r.count||0)+'<span class="of"> / '+r.of+'</span></div>')+'<div class="hqbar"><span style="width:'+(100*(r.count||0)/r.of)+'%"></span></div></div>'}
    else if(r.qr) h+='<div class="tools" style="justify-content:center"><button class="more" id="hqNext">Done reading ›</button></div>';
    if(r.prov) h+='<p class="meta" style="text-align:center;max-width:62ch;margin:0 auto">'+esc(r.prov)+'</p>'}
  if(r.grid){const n=r.grid.length, lit=new Set(r.lit||[]); h+='<div class="hqgrid" style="grid-template-columns:repeat('+n+',minmax(0,1fr));--w:'+Math.min(520,n*70)+'px">'+r.grid.flatMap((row,i)=>row.map((v,j)=>{const k=i+','+j; return '<span class="'+(r.cur===k?'cur':lit.has(k)?'on':'')+'"'+(n>7?' style="font-size:.7rem"':'')+'>'+esc(v)+'</span>'})).join('')+'</div>'}
  if(r.para) h+='<div class="hqpara"><span class="pg">p.'+r.para.p+'</span>'+esc(r.para.t)+'</div>';
  if(r.line) h+='<div class="hqline">'+arw(r.line)+'</div>';
  if(r.quiz){const z=r.quiz; if(z.src||z.tally) h+='<div class="tools" style="justify-content:space-between"><span class="num">'+esc(z.src||'')+'</span>'+(z.tally?'<span class="num">'+z.tally[0]+' / '+z.tally[1]+' right</span>':'')+'</div>';
    h+='<div class="hqbig" style="font-size:1.15rem">'+esc(z.q)+'</div><div class="hqq">'+z.order.map((ci,pos)=>{const c=z.picked!=null?(ci===z.correct?' ok':ci===z.picked?' no':''):''; return '<button data-hqa="'+ci+'" class="'+c+'"'+(z.picked!=null?' disabled':'')+'><b>'+'ABCDE'[pos]+'</b><span>'+esc(z.choices[ci])+'</span></button>'}).join('')+'</div>'+(z.picked==null?'<div class="tools">'+(z.idk?'<button class="more" id="hqIdk">I don\'t know</button>':'')+'<span class="meta">Tap an answer or press 1–'+z.order.length+(z.idk?' (0 = I don\'t know)':'')+'.'+(z.deadline?' He gives the answer after 30 seconds.':'')+'</span></div>':'')}
  if(r.pause) h+='<div class="tools"><button class="more pri" id="hqBack">'+(r.pause.kind==='prayer'?'I\'m back':'Continue now')+'</button><span class="meta">he waits until '+fmt(new Date(r.pause.until))+'</span></div>';
  if(r.answer) h+='<div class="hqans">'+esc(r.answer)+'</div>';
  if(!r.ar&&!r.grid&&!r.quiz&&(r.line||r.para)) h+='<div class="tools"><button class="more" id="hqNext">Next ›</button></div>';
  el.innerHTML=h;
  document.getElementById('hqStop').onclick=stopByHand;
  const tp=document.getElementById('hqTap'); if(tp) tp.onclick=()=>tapFn&&tapFn(1);
  const t33=document.getElementById('hqTap33'); if(t33) t33.onclick=()=>tapFn&&tapFn(33);
  const ta=document.getElementById('hqTapAll'); if(ta) ta.onclick=()=>tapFn&&tapFn(r.of);
  const nx=document.getElementById('hqNext'); if(nx) nx.onclick=skipNow;
  el.querySelectorAll('[data-hqa]').forEach(b=>b.onclick=()=>ansFn&&ansFn(+b.dataset.hqa));
  const idk=document.getElementById('hqIdk'); if(idk) idk.onclick=()=>ansFn&&ansFn(-1);
  const bk=document.getElementById('hqBack'); if(bk) bk.onclick=()=>ansFn&&ansFn(0)}
document.addEventListener('keydown',e=>{if(!S.run||/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')) return;
  if(S.run.quiz&&S.run.quiz.picked==null&&/^[1-5]$/.test(e.key)&&ansFn){const ci=S.run.quiz.order[+e.key-1]; if(ci!=null){e.preventDefault(); ansFn(ci)}}
  else if(S.run.quiz&&S.run.quiz.picked==null&&S.run.quiz.idk&&(e.key==='0'||e.key==='?')&&ansFn){e.preventDefault(); ansFn(-1)}
  else if(e.key===' '&&tab==='learn'&&(tapFn||skipFn)){e.preventDefault(); tapFn?tapFn(1):skipNow()}});
let miniEl=null;
function drawMini(){const r=S.run, show=r&&tab!=='learn'; if(!show){if(miniEl){miniEl.remove(); miniEl=null} return}
  if(!miniEl){miniEl=document.createElement('div'); miniEl.className='hqmini'; miniEl.setAttribute('role','status'); document.body.appendChild(miniEl)}
  miniEl.innerHTML='<button class="go" aria-label="Open al-Ḥalqa"><div class="hqlbl">al-Ḥalqa · now</div><div class="t">'+esc(r.title||'')+(r.of>1?' · '+(r.count||0)+' / '+r.of:'')+'</div></button><button class="x" aria-label="Stop">■</button>';
  miniEl.querySelector('.go').onclick=()=>{tab='learn'; render(); window.scrollTo(0,0)}; miniEl.querySelector('.x').onclick=stopByHand}
window.hqMini=drawMini;
function drawCourse(){const el=document.getElementById('hqCourse'); if(!el) return; const L=S.lesson, st=S.state; const dk=ymd(new Date());
  let h='<h2>The course</h2>';
  if(L===undefined) h+='<p class="empty">Looking for today\'s lesson…</p>';
  else if(L===null) h+='<div class="hqbig">Today\'s lesson isn\'t written yet</div><p class="meta">The Iḥyāʾ Engine\'s morning run prepares one each day and it is copied here; '+(S.sample?'you can also have it composed now.':'open the engine inside Claude to compose it here.')+' Next in the course: p.'+((st&&st.next)||HQ_START)+'.</p>'+(S.sample?'<div class="tools"><button class="more pri" id="hqCompose"'+(S.busy?' disabled':'')+'>'+esc(S.busy||'Compose today\'s lesson')+'</button></div>':'');
  else{h+='<div class="vh"><span class="hqbig">'+esc(L.title)+'</span></div><p class="num">'+esc(L.heading||'')+' · pp.'+L.from+'–'+L.to+' · '+(L.by==='scheduled'?'prepared this morning':L.by==='page'?'composed here':esc(L.by||''))+'</p><div class="tools"><button class="more" id="hqRd">Read pp.'+L.from+'–'+L.to+'</button>'+(S.tts?'<button class="more" id="hqHear">Hear the teaching</button>':'')+'</div><div class="hqlesson">'+arw(L.teaching||'')+'</div>';
    if((L.points||[]).length) h+='<ul>'+L.points.map(p=>'<li>'+arw(p)+'</li>').join('')+'</ul>';
    if(L.practice) h+='<p class="fnd"><b>For today · </b>'+arw(L.practice)+'</p>';
    if((L.questions||[]).length) h+='<details><summary class="meta">review questions · '+L.questions.length+'</summary>'+L.questions.map((q,i)=>'<div style="margin-top:8px"><div>'+(i+1)+'. '+esc(q.q)+'</div>'+(q.choices||[]).map((o,j)=>'<div class="meta" style="margin-left:14px'+(j===q.correct?';color:var(--ok)':'')+'">'+'ABCDE'[j]+'. '+esc(o)+(j===q.correct?' ✓':'')+'</div>').join('')+'<div style="color:var(--ok)">'+esc(q.a)+'</div></div>').join('')+'</details>'}
  if(S.err) h+='<p class="fnd">'+esc(S.err)+'</p>';
  const tally=LSg('halqaQuiz',{})[dk]; h+='<div class="tools"><span class="meta">Next in the course: p.'+((st&&st.next)||HQ_START)+(st&&st.nameNext?' · next Name #'+st.nameNext:'')+(tally?' · today\'s review '+tally.right+'/'+tally.asked:'')+'</span><label class="meta" for="hqFrom">start from page</label><input id="hqFrom" inputmode="numeric" placeholder="'+((st&&st.next)||HQ_START)+'" style="flex:0 1 90px"><span class="meta">'+(S.db?'kept with the engine\'s records':'kept in this browser')+'</span></div>';
  const past=(S.past||[]).filter(l=>l.date!==dk); if(past.length) h+='<details><summary class="meta">Earlier lessons · '+past.length+'</summary>'+past.map(l=>'<details class="sq"><summary><span class="num">'+esc(l.date)+' · pp.'+l.from+'–'+l.to+'</span> '+esc(l.title)+'</summary><div class="hqlesson">'+arw(l.teaching||'')+'</div></details>').join('')+'</details>';
  if(st&&(st.history||[]).length) h+='<details><summary class="meta">The course so far · '+st.history.length+' lessons</summary><ul class="meta">'+st.history.slice().reverse().map(x=>'<li>'+esc(x.date)+' · pp.'+x.from+'–'+x.to+' · '+esc(x.title)+(x.by==='study'?' (the Study)':'')+'</li>').join('')+'</ul></details>';
  el.innerHTML=h;
  const c=document.getElementById('hqCompose'); if(c) c.onclick=()=>compose();
  const rd=document.getElementById('hqRd'); if(rd) rd.onclick=()=>{RD.pg=L.from; RD.q=''; rdSave(); tab='read'; render(); window.scrollTo(0,0)};
  const he=document.getElementById('hqHear'); if(he) he.onclick=()=>{const t=englishOnly(L.teaching||''); if(t) S.tts.speak(t.slice(0,2000),{language:'en'}).catch(()=>{})};
  const fr=document.getElementById('hqFrom'); if(fr) fr.onkeydown=e=>{if(e.key==='Enter'){const p=+e.target.value; if(p>=1&&p<=2401){saveState(Object.assign({},S.state||{history:[]},{next:p,updatedAt:new Date().toISOString()})); drawCourse()}}}}

/* shared with the Wird module (ihya/wird.js, 2026-11-22) */
window.HQAPI={dsLoad,dsStats,dsUnits,dsSchedule,dsSetCfg,meta,hqGet,hqSet,saveJournal,chapterOfPage,ymd};
/* start the circle once the page is up, so the hours are kept wherever Al is in the engine */
setTimeout(()=>{hqInit()},800);
})();
