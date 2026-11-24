/* ===== Kunūz al-Ḥalqa — the lessons of Kunūz al-Dhikr inside the merged engine (port 6, part 5, 2026-11-21).
   Ported from Kunūz al-Dhikr's index.html: H.lessons / H.next (seasonal first, then the next unlearned, a review of the
   missed questions every fourth lesson), material(), HSYS, makeLesson(), runLesson(), runQuiz(), startSession(),
   drawSess(), hqSyl(), pickSection(), hqRecite(), hqHifz(), hqProg(), askCircle(), and the merge of the lesson record
   (MERGE.core: done, log, missed, gone, mins). Syllabus: kunuz/halqa.json (B's halqa.json, 8 tracks, 59 lessons).
   Decision 1: no machine voice ever says the Arabic. B's "Recite with me" voice, "Ḥifẓ → Hear it" and the whole
   "Sound & voice" page (Hz tones, binaural beats, Arabic voice) are cut; recite-with-me advances at reading pace and
   the lesson's English may be read aloud (englishOnly, off until tapped).
   Better than B: a composed lesson is kept in the database (kunuz/les-<id>) so it is never paid for twice and reads the
   same on every device; the abjad of every Arabic line; the Qurʾān a lesson names read from the muṣḥaf; withheld lines
   (kzAwHeld) stay out of the material, recite and ḥifẓ; tick of the day's lesson in the Kunūz wird; Ask tools. ===== */
(function(){
'use strict';
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const LS={get(k,d){try{const v=localStorage.getItem('kzh:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('kzh:'+k,JSON.stringify(v))}catch(e){}}};
const HM=['Muḥarram','Ṣafar','Rabīʿ al-Awwal','Rabīʿ al-Thānī','Jumādā al-Ūlā','Jumādā al-Ākhira','Rajab','Shaʿbān','Ramaḍān','Shawwāl','Dhū al-Qaʿda','Dhū al-Ḥijja'];
function kzHijri(d){try{const p=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'}).formatToParts(d); const g=t=>+p.find(x=>x.type===t).value; const r={d:g('day'),m:g('month'),y:g('year')}; if(r.d&&r.m&&r.y) return r}catch(e){} try{const h=hijri(d); return {d:h.d,m:h.m,y:h.y}}catch(e){return null}}
const TG=id=>'<a href="https://t.me/DhikrNotes/'+id+'" target="_blank" rel="noopener">#'+id+'</a>';
const ab=t=>{try{return abjad(String(t),false).total}catch(e){return 0}};

/* ── data ── */
let SYL=null, SYLP=null;
const loadSyl=()=>SYL?Promise.resolve(SYL):SYLP||(SYLP=xget('kunuz/halqa.json').then(d=>(SYL=d)).catch(e=>{SYLP=null; throw e}));
const lessons=()=>SYL?SYL.tracks.flatMap(t=>t.lessons.map(l=>({...l,track:t.name,tid:t.id}))):[];

/* ── the record, merged as Kunūz merges halqa/core (lessons keep the latest result, logs and the review list are unions,
   review removals remembered, minutes the maximum). Kept in its own document kunuz/lessons. ── */
const canon=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
const maxMap=(a,b)=>{const o={...(b||{})}; for(const [k,v] of Object.entries(a||{})) o[k]=Math.max(+v||0,+o[k]||0); return o};
function merge(a,b){a=a||{}; b=b||{}; const o={};
  o.done={...(b.done||{})}; for(const [k,v] of Object.entries(a.done||{})){const w=o.done[k]; if(!w||String(v.date||'')>=String(w.date||'')) o.done[k]=v}
  const lk=x=>[x.d,x.id,x.score,x.total,x.ts||''].join('|'), L=new Map(); [...(b.log||[]),...(a.log||[])].forEach(x=>x&&L.set(lk(x),x));
  o.log=[...L.values()].sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:(x.ts||0)-(y.ts||0)).slice(-400);
  o.gone=maxMap(a.gone,b.gone); o.gone=Object.fromEntries(Object.entries(o.gone).sort((x,y)=>y[1]-x[1]).slice(0,200));
  const M=new Map(); [...(b.missed||[]),...(a.missed||[])].forEach(m=>{if(!m||!m.q) return; const p=M.get(m.q); if(!p||(m.at||0)>=(p.at||0)) M.set(m.q,m)});
  o.missed=[...M.values()].filter(m=>!(o.gone[m.q]&&o.gone[m.q]>=(m.at||0))).slice(-60);
  o.mins=maxMap(a.mins,b.mins); return o}
const H={st:merge(LS.get('st',{}),{}), db:null, cur:null, session:null, _t:null,
  async init(){let db=null; try{db=await Promise.race([cuse('db'),new Promise(r=>setTimeout(()=>r(null),10000))])}catch(e){} if(!db) return; this.db=db;
    try{const s=await db.doc('kunuz/lessons').get(); const d=s.exists&&s.data(); if(d&&d.json){const before=canon(this.st); this.st=merge(this.st,JSON.parse(d.json)); if(canon(this.st)!==before) redraw()}}catch(e){}
    LS.set('st',this.st); this.flush();
    try{db.doc('kunuz/lessons').onSnapshot(s=>{const d=s.exists&&s.data(); if(!d||!d.json) return; let v; try{v=JSON.parse(d.json)}catch(e){return} const before=canon(this.st); this.st=merge(this.st,v); if(canon(this.st)!==before){LS.set('st',this.st); redraw()}},()=>{})}catch(e){}},
  save(){LS.set('st',this.st); clearTimeout(this._t); this._t=setTimeout(()=>this.flush(),800)},
  async flush(){if(!this.db) return; try{let rem=null; try{const s=await this.db.doc('kunuz/lessons').get(); const d=s.exists&&s.data(); if(d&&d.json) rem=JSON.parse(d.json)}catch(e){}
    if(rem) this.st=merge(this.st,rem); if(!rem||canon(merge(rem,{}))!==canon(this.st)) await this.db.doc('kunuz/lessons').set({json:JSON.stringify(this.st),updated:new Date().toISOString()}); LS.set('st',this.st)}catch(e){}},
  next(){const L=lessons(), h=kzHijri(new Date()), done=this.st.done;
    const seasonal=L.find(l=>l.month===(h&&h.m)&&(!done[l.id]||Date.now()-new Date(done[l.id].date)>25*864e5)); if(seasonal) return seasonal;
    const nDone=Object.keys(done).length;
    if(this.st.missed.length>=4&&nDone%4===3) return {id:'REV',t:'Review: questions you missed',track:'Review',review:true};
    const rt=v=>v&&v.total?v.score/v.total:1; return L.find(l=>!done[l.id])||L.slice().sort((a,b)=>rt(done[a.id])-rt(done[b.id]))[0]}};
function todayLesson(){const d=ymd(new Date()); const lg=(H.st.log||[]).find(x=>x.d===d); if(lg) return lessons().find(l=>l.id===lg.id)||{id:lg.id,t:lg.t,track:''}; return H.next()}

/* ── the lesson's sources (B: material) ── */
async function material(l){const out=[]; const add=(ref,x)=>out.push('['+ref+']\n'+x);
  if(l.posts&&l.posts.length){let P=[]; try{P=await xget('kunuz/posts.json')}catch(e){} for(const id of l.posts){const p=P.find(x=>x.i===id); if(p) add('post #'+id+' '+p.d,(p.x||p.lt||'').slice(0,3500)+(p.doc?'\n(document: '+p.doc+')':''))}}
  if(l.book){const s=await bookSec(l.book).catch(()=>null); if(s){let t='',n=0; s.sec.blocks.forEach((b,bi)=>{if(t.length>7000) return; if(window.kzAwHeld&&window.kzAwHeld(l.book[0],s.si,bi)) return;
      if(b.t==='ar'&&n<14){t+='AR: '+b.x+'\n'; n++} else if(b.t==='tl'&&n<14) t+='TL: '+b.x+'\n'; else if(b.t==='entry') t+=(b.title||'')+(b.withheld?' (method withheld: harm-directed)':'')+'\n'; else if(b.t!=='ar'&&b.t!=='tl') t+=(b.title||b.x||'')+'\n'});
    add(s.bt+' › '+s.sec.title,t)}}
  if(l.pages){try{const sh=await xget('kunuz/sharh.json'); for(const p of sh.pages) if(p.n>=l.pages[0]&&p.n<=l.pages[1]) add('Sharḥ p.'+p.n,p.x.slice(0,3200))}catch(e){}}
  if(l.q){try{const tool=XTOOLS.find(x=>x.name==='search_kunuz'); const ws=l.q.split(/\s+/).filter(w=>w.length>2); let r={results:[]}; for(let k=ws.length;k>=2&&!r.results.length;k--){r=await tool.execute({query:ws.slice(0,k).join(' ')})} r.results.slice(0,4).forEach(x=>add(x.source+(x.section?' › '+x.section:''),String(x.text||JSON.stringify(x.item||'')).slice(0,1200)))}catch(e){}}
  return out.join('\n\n').slice(0,22000)}
async function bookSec(bk){const [k,m]=bk; const K=window.KZBK; if(!K) return null; const meta=await K.M(); const B=meta[k]; if(!B) return null;
  const si=B.sections.findIndex(x=>(x.title+x.ar).toLowerCase().includes(m.toLowerCase())); if(si<0) return null; const sec=await K.sec(k,si); return {si,sec,bt:B.title,k}}
const HSYS='You are the teacher of al-Ḥalqa inside "Kunūz al-Dhikr", Al\'s personal study circle built from Amin Patel\'s DhikrNotes channel and his editions of the Naqshbandī, Qādirī and Shādhilī awrād and the Sharḥ Ḥizb al-Baḥr. Al is a practitioner (Shādhilī/Chishtī-adjacent, Naqshbandī awrād with his shaykh\'s idhn) who says he has forgotten much; teach warmly and exactly, as a living teacher in a circle. Ground everything in the SOURCE MATERIAL; cite refs like (post #925) or (Sharḥ p.48). You may add short classical context from al-Ghazālī, Ibn ʿArabī, al-Shādhilī or the Naqshbandī masters, marked as such. Quote the litanies and the editions exactly as printed, nothing cut or softened, with the compiler\'s own restrictions and the tradition\'s caution (only against an actual oppressor, never the innocent, under a teacher\'s idhn). Transliterate with diacritics; Arabic in Arabic script with full tashkīl, copied from the source where possible.';
let sampleP=null; const getSample=()=>sampleP||(sampleP=cuse('sample').catch(()=>null));
function clean(L){if(!L||!Array.isArray(L.sections)) return null; L.sections=L.sections.filter(s=>s&&(s.heading||s.body));
  L.quiz=(Array.isArray(L.quiz)?L.quiz:[]).filter(q=>q&&q.q&&Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=6&&Number.isInteger(+q.answer)&&+q.answer>=0&&+q.answer<q.options.length); return L}
async function getLesson(l,fresh){
  if(l.review){const qs=H.st.missed.slice(-8); return {title:l.t,opening:'We return to what slipped away. Read each explanation again, then answer.',sections:qs.slice(0,4).map(q=>({heading:q.q,body:q.why||''})),practice:'Recite the related wird once today with attention on these points.',reflection:'Which of these did you know by heart, and which by memory only?',quiz:qs.map(q=>({q:q.q,options:q.options,answer:q.answer,why:q.why,src:q.src})),refs:[]}}
  if(!fresh&&H.db){try{const s=await H.db.doc('kunuz/les-'+l.id).get(); const d=s.exists&&s.data(); if(d&&d.json){const L=clean(JSON.parse(d.json)); if(L&&L.sections.length){L._at=d.at; return L}}}catch(e){}}
  if(!fresh){const c=LS.get('les:'+l.id,null); if(c){const L=clean(c); if(L&&L.sections.length) return L}}
  const sample=await getSample(); if(!sample) return null;
  const mat=await material(l);
  const prompt=HSYS+'\n\nLESSON: '+l.t+' (track: '+l.track+')\nReturn ONLY JSON with this shape:\n{"title":string,"opening":string (2-3 sentences, spoken greeting and aim),"sections":[{"heading":string,"body":string (90-170 words, teaching prose for listening),"arabic":string|null (a short key phrase or line in Arabic from the source, else null),"translit":string|null,"english":string|null (faithful English of the Arabic line)}],"practice":string (one concrete practice for today, with counts/time if the source gives them),"reflection":string (one question to sit with),"quiz":[{"q":string,"options":[4 strings],"answer":0-3,"why":string (one sentence with a ref),"src":string}],"refs":[strings]}\nMake 4-6 sections and exactly 5 multiple-choice quiz questions answerable from the lesson.\n\nSOURCE MATERIAL:\n'+mat;
  const L=clean(await sample.json([{role:'user',content:prompt}],{modelTier:'default'})); if(!L) throw new Error('empty lesson');
  L._at=new Date().toISOString(); LS.set('les:'+l.id,L);
  if(H.db){try{await H.db.doc('kunuz/les-'+l.id).set({json:JSON.stringify(L),at:L._at,lesson:l.id})}catch(e){}}
  return L}

/* ── state of the view ── */
const V={sub:LS.get('sub','circle'), mins:LS.get('mins',45)};
const SUBS=[['circle','The circle'],['syllabus','Syllabus'],['recite','Recite with me'],['hifz','Ḥifẓ drill'],['progress','Progress']];
let tts=null; try{cuse('tts').then(t=>{tts=t}).catch(()=>{})}catch(e){}
function redraw(){if(tab!=='learn') return; const el=document.getElementById('kzhRoot'); if(!el) return; if(V.sub==='progress'||V.sub==='syllabus') draw(); else if(V.sub==='circle'&&!document.querySelector('#kzhLesson .kzhq,#kzhLesson .kzhl')) draw()}

function draw(){const root=document.getElementById('kzhRoot'); if(!root) return;
  if(!SYL){root.innerHTML='<section class="box"><h2>Kunūz al-Ḥalqa <span class="ari" style="color:var(--gold)">حلقة الكنوز</span></h2><p class="empty">Opening the syllabus…</p></section>'; loadSyl().then(draw).catch(()=>{root.querySelector('.empty').textContent='The syllabus did not load. Reload to try again.'}); return}
  const L=lessons(), nd=Object.keys(H.st.done).length;
  root.innerHTML='<section class="box kzh"><h2>Kunūz al-Ḥalqa <span class="ari" style="color:var(--gold)">حلقة الكنوز</span></h2><p class="meta">The teaching circle of Kunūz al-Dhikr: '+L.length+' lessons in '+SYL.tracks.length+' tracks built from the DhikrNotes posts, the awrād, the Sharḥ Ḥizb al-Baḥr and the sacred year. The teacher chooses — the season\'s lesson first, then the next you have not learned, and every fourth lesson a review of what you missed — teaches it from the sources with their references, and checks it with five multiple-choice questions. '+nd+'/'+L.length+' taken.</p><div class="flt" role="tablist" aria-label="Kunūz al-Ḥalqa">'+SUBS.map(([k,n])=>'<button role="tab" data-kzhs="'+k+'" aria-pressed="'+(V.sub===k)+'">'+n+'</button>').join('')+'</div></section><div id="kzhBody" class="kzhbody"></div>';
  root.querySelectorAll('[data-kzhs]').forEach(b=>b.onclick=()=>{V.sub=b.dataset.kzhs; LS.set('sub',V.sub); stopAuto(); draw()});
  ({circle:drawCircle,syllabus:drawSyl,recite:drawRecite,hifz:drawHifz,progress:drawProg})[V.sub]()}
const body=()=>document.getElementById('kzhBody');
const chipT=l=>'<span class="chip">'+esc(l.track||'')+'</span>'+(l.month?'<span class="chip ih">'+HM[l.month-1]+'</span>':'');

function drawCircle(){const el=body(); const nx=H.cur||H.next(); const dn=H.st.done[nx.id];
  el.innerHTML='<div class="kzhgrid"><div style="display:grid;gap:16px;min-width:0"><section class="box hqstage"><div class="hqlbl">The teacher has chosen</div><div class="hqbig">'+esc(nx.t)+'</div><div class="chips">'+chipT(nx)+(dn?'<span class="chip ih">revisit · last '+dn.score+'/'+dn.total+'</span>':'')+'</div>'+
    '<div class="tools"><button class="more pri" id="kzhGo">Begin this lesson</button><button class="more" id="kzhSess">Study session · <span id="kzhSm">'+V.mins+'</span> min</button><select id="kzhMins" aria-label="Session length">'+[20,45,60,90,120,180].map(m=>'<option'+(m===V.mins?' selected':'')+'>'+m+'</option>').join('')+'</select></div>'+
    '<p class="meta">In a session the teacher chooses lesson after lesson — seasonal first, then the next unlearned, with a review every fourth lesson — until the time is up.</p></section><div id="kzhLesson" style="display:grid;gap:16px;min-width:0"></div></div>'+
    '<aside style="display:grid;gap:16px;align-content:start;min-width:0"><section class="box"><h3 class="akh" style="margin:0">Ask in the circle</h3><p class="meta">Your question goes to the teacher with the current lesson in mind; he searches Kunūz before he answers.</p><textarea id="kzhQ" rows="3" placeholder="Ask…" aria-label="Question for the teacher"></textarea><div class="tools"><button class="more pri" id="kzhAsk">Ask</button></div><div id="kzhAns" style="display:grid;gap:8px"></div></section><section class="box" id="kzhSessC" hidden></section></aside></div>';
  document.getElementById('kzhGo').onclick=()=>runLesson(nx);
  document.getElementById('kzhMins').onchange=e=>{V.mins=+e.target.value; LS.set('mins',V.mins); document.getElementById('kzhSm').textContent=V.mins};
  document.getElementById('kzhSess').onclick=()=>startSession(V.mins);
  document.getElementById('kzhAsk').onclick=()=>askCircle(document.getElementById('kzhQ').value);
  if(H.session) drawSess(); if(H.pending){const p=H.pending; H.pending=null; runLesson(p)}}

async function askCircle(q){q=(q||'').trim(); if(!q) return; const A=document.getElementById('kzhAns'); const sample=await getSample(); if(!sample){A.innerHTML='<p class="meta">The teacher answers when this page is opened in Claude.</p>'; return}
  document.getElementById('kzhQ').value=''; const el=document.createElement('div'); el.className='msg assistant'; el.textContent='…'; A.prepend(el); const u=document.createElement('div'); u.className='msg user'; u.textContent=q; A.prepend(u);
  const ctx=H.cur?('Current lesson: '+H.cur.t+'\n'+(H.lessonText||'')).slice(0,6000):'';
  try{const r=await sample([{role:'user',content:HSYS+'\nAnswer Al briefly (under 180 words), spoken style, cite refs. Use search_kunuz first.\n'+ctx+'\n\nQuestion: '+q}],{onText:({text})=>{el.innerHTML=mdLite(text||'…')},tools:XTOOLS.filter(t=>['search_kunuz','find_sohbahs','read_sohbah'].includes(t.name))});
    el.innerHTML=mdLite(r.text)}catch(e){el.textContent='No answer came back. Ask again in a moment.'}}

function arLine(s){const v=ab(s.arabic); return '<div class="ar kzhar" lang="ar" dir="rtl">'+esc(s.arabic)+'</div>'+(v?'<div class="num" style="text-align:right">abjad '+v+' (Mashriqī, by the engine)</div>':'')}
async function runLesson(l,o){o=o||{}; H.cur=l; const box=document.getElementById('kzhLesson'); if(!box){H.pending=l; V.sub='circle'; LS.set('sub','circle'); draw(); return null}
  box.innerHTML='<section class="box hqstage"><div class="hqlbl">Preparing</div><div class="hqbig">'+esc(l.t)+'</div><p class="meta">The teacher is gathering the sources…</p><div class="hqbar"><span style="width:35%"></span></div></section>';
  let L=null, err=null; try{L=await getLesson(l,o.fresh)}catch(e){err=e} if(!document.contains(box)) return null;
  if(!L&&!err) return selfStudy(l,box);
  if(!L){box.innerHTML='<section class="box"><p>The lesson could not be prepared ('+esc(err.code||err.message||'error')+').</p><button class="more" id="kzhRetry">Try again</button></section>'; document.getElementById('kzhRetry').onclick=()=>runLesson(l,o); return null}
  H.lessonText=L.sections.map(s=>s.heading+': '+s.body).join('\n');
  const qrefs=window.kzQrefs?window.kzQrefs(L.sections.map(s=>s.body).join(' ')+' '+(L.refs||[]).join(' ')):[];
  box.innerHTML='<article class="box kzhl" data-read-root><div class="hqlbl">'+esc(l.track||'')+' · lesson'+(L._at&&!l.review?' · composed '+esc(String(L._at).slice(0,10))+', kept':'')+'</div><h3 class="akh" style="font-size:1.35rem;margin:0">'+esc(L.title||l.t)+'</h3><p class="kzhlead">'+esc(L.opening||'')+'</p>'+
    L.sections.map(s=>'<section class="kzhsec"><h4>'+esc(s.heading)+'</h4>'+(s.arabic?arLine(s):'')+(s.translit?'<p class="kzhtl">'+esc(s.translit)+'</p>':'')+(s.arabic&&s.english?'<p class="kzhen">'+esc(s.english)+'</p>':'')+'<p>'+esc(s.body)+'</p></section>').join('')+
    '<section class="kzhsec"><h4>Practice for today</h4><p>'+esc(L.practice||'')+'</p></section><section class="kzhsec"><h4>Sit with this</h4><p><i>'+esc(L.reflection||'')+'</i></p></section>'+
    (L.refs&&L.refs.length?'<p class="meta">'+L.refs.map(esc).join(' · ')+'</p>':'')+(qrefs.length?'<div id="kzhQr" class="meta">The Qurʾān it names: '+qrefs.map(q=>'<span class="chip">Q '+esc(q.k||(q.s+':'+q.a))+'</span>').join(' ')+'</div>':'')+
    '<div class="tools">'+(l.review?'':'<button class="more" id="kzhSrc">The sources</button>')+(tts?'<button class="more" id="kzhPlay">▶ English only</button><button class="more" id="kzhStop">■</button>':'')+(l.review?'':'<button class="more" id="kzhFresh" title="Uses your Claude usage">Compose it again</button>')+'<button class="more" id="kzhAskL">✦ Ask about this lesson</button><button class="more pri" id="kzhToQ">'+(L.quiz.length?'Take the quiz ('+L.quiz.length+' multiple-choice)':'Finish the lesson')+'</button></div><div id="kzhSrcBox"></div><div id="kzhQuiz"></div></article>';
  const on=(id,f)=>{const x=document.getElementById(id); if(x) x.onclick=f};
  on('kzhSrc',()=>selfStudy(l,null,true)); on('kzhFresh',()=>runLesson(l,{fresh:true}));
  on('kzhPlay',()=>{const t=englishOnly([L.title,L.opening,...L.sections.map(s=>s.heading+'. '+(s.english||'')+' '+s.body),'Practice for today. '+L.practice,'Sit with this. '+L.reflection].join('\n')); if(tts&&t) tts.speak(t.slice(0,6000)).catch(()=>{})}); on('kzhStop',()=>{try{tts&&tts.stop()}catch(e){}});
  on('kzhAskL',()=>askAbout('In my Kunūz al-Ḥalqa lesson "'+(L.title||l.t)+'" ('+l.id+'), explain more and check it against the Kunūz sources (search_kunuz), citing posts and pages.'));
  return await new Promise(res=>{on('kzhToQ',()=>{try{tts&&tts.stop()}catch(e){} runQuiz(l,L.quiz||[],res)}); if(o.auto) runQuiz(l,L.quiz||[],res)})}

async function selfStudy(l,box,extra){let P=[]; try{P=await xget('kunuz/posts.json')}catch(e){} const ps=(l.posts||[]).map(id=>P.find(p=>p.i===id)).filter(Boolean);
  const bs=l.book?await bookSec(l.book).catch(()=>null):null; let pi=-1; if(l.pages){try{const sh=await xget('kunuz/sharh.json'); pi=sh.pages.findIndex(p=>p.n>=l.pages[0])}catch(e){}}
  const html='<article class="box kzhs"><div class="hqlbl">'+esc(l.track||'')+' · sources'+(extra?'':' for self-study')+'</div><h3 class="akh" style="margin:0">'+esc(l.t)+'</h3>'+(extra?'':'<p class="meta">The teacher prepares the lesson and its multiple-choice quiz when this page is opened in Claude. Until then, these are the sources the lesson is built from.</p>')+
    '<div class="tools">'+(bs?'<button class="more" data-kzhaw="'+bs.k+'|'+bs.si+'">Read '+esc(bs.sec.title)+' →</button>':'')+(pi>-1?'<button class="more" data-kzhsh="'+pi+'">Read the Sharḥ, pp. '+l.pages[0]+'–'+l.pages[1]+' →</button>':'')+'</div>'+
    ps.map(p=>'<section class="kzhsec"><div class="meta">'+esc(p.d)+' · '+TG(p.i)+' · <button class="linkbtn" data-kzhp="'+p.i+'">open in the Dīwān</button></div><div class="kzhpost'+((p.x||'').length>900?' clip':'')+'" dir="auto">'+esc(p.x||p.lt||p.doc||'')+'</div>'+((p.x||'').length>900?'<button class="more" data-kzhx>Read all</button>':'')+'</section>').join('')+(l.q&&!ps.length&&!bs&&pi<0?'<p class="meta">This lesson gathers its sources by searching Kunūz for: '+esc(l.q)+'.</p>':'')+'</article>';
  const tgt=box||document.getElementById('kzhSrcBox'); if(!tgt) return null; tgt.innerHTML=html;
  tgt.querySelectorAll('[data-kzhx]').forEach(b=>b.onclick=()=>{b.previousElementSibling.classList.remove('clip'); b.remove()});
  tgt.querySelectorAll('[data-kzhp]').forEach(b=>b.onclick=()=>window.kzOpenDiwan&&window.kzOpenDiwan(+b.dataset.kzhp));
  tgt.querySelectorAll('[data-kzhaw]').forEach(b=>b.onclick=()=>{const [k,si]=b.dataset.kzhaw.split('|'); window.kzOpenAwrad&&window.kzOpenAwrad(k,+si,null,null)});
  tgt.querySelectorAll('[data-kzhsh]').forEach(b=>b.onclick=()=>window.kzOpenAwrad&&window.kzOpenAwrad('sharh',+b.dataset.kzhsh,null,null));
  return null}

let quizKey=null;
function runQuiz(l,Q,done){let i=0,score=0; const box=document.getElementById('kzhQuiz'); const tq=document.getElementById('kzhToQ'); if(tq) tq.remove(); if(!box) return;
  const step=()=>{if(i>=Q.length){finish(); return} const q=Q[i]; let picked=null;
    box.innerHTML='<div class="kzhq"><div class="hqlbl">Question '+(i+1)+' of '+Q.length+'</div><p class="kzhqq" dir="auto">'+esc(q.q)+'</p><div class="hqq">'+q.options.map((o,k)=>'<button data-k="'+k+'" dir="auto"><b>'+'ABCDEF'[k]+'</b><span>'+esc(o)+'</span></button>').join('')+'</div><p class="meta">Choose one. Keys A–'+'ABCDEF'[q.options.length-1]+' or 1–'+q.options.length+' also answer; Enter goes on.</p><div id="kzhWhy" role="status"></div></div>';
    const pick=k=>{if(picked!=null) return; picked=k; const ok=k===+q.answer; if(ok) score++; else if(!H.st.missed.some(m=>m.q===q.q)) H.st.missed.push({...q,lesson:l.id,at:Date.now()});
      box.querySelectorAll('[data-k]').forEach(x=>{x.disabled=true; if(+x.dataset.k===+q.answer) x.classList.add('ok'); else if(+x.dataset.k===k) x.classList.add('no')});
      document.getElementById('kzhWhy').innerHTML='<p><b>'+(ok?'Correct.':'Not quite.')+'</b> '+esc(q.why||'')+' <span class="meta">'+esc(q.src||'')+'</span></p><button class="more pri" id="kzhNq">'+(i+1<Q.length?'Next question':'Finish')+'</button>';
      document.getElementById('kzhNq').onclick=()=>{i++; step()}; document.getElementById('kzhNq').focus({preventScroll:true});
      if(H.session&&H.session.running) setTimeout(()=>{if(document.getElementById('kzhNq')&&H.session&&H.session.running){i++; step()}},6000)};
    box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
    quizKey=e=>{if(/INPUT|TEXTAREA|SELECT/.test((e.target.tagName||''))) return; const c=e.key.toUpperCase(); let k='ABCDEF'.indexOf(c); if(k<0&&/^[1-6]$/.test(e.key)) k=+e.key-1; if(picked==null&&k>=0&&k<q.options.length){e.preventDefault(); pick(k)} else if(picked!=null&&e.key==='Enter'){const n=document.getElementById('kzhNq'); if(n){e.preventDefault(); n.click()}}}};
  const finish=()=>{quizKey=null;
    if(l.review){const t=Date.now(); H.st.gone=H.st.gone||{}; Q.forEach(q=>{H.st.gone[q.q]=t}); H.st.missed=H.st.missed.filter(m=>!Q.some(x=>x.q===m.q))}
    else {try{window.kzDaySet&&window.kzDaySet('lesson',true)}catch(e){} H.st.done[l.id]={score,total:Q.length,date:new Date().toISOString(),count:((H.st.done[l.id]||{}).count||0)+1}}
    H.st.missed=H.st.missed.slice(-60); const d=ymd(new Date()); H.st.log.push({d,id:l.id,t:l.t,score,total:Q.length,ts:Date.now()}); H.st.log=H.st.log.slice(-400); H.save(); H.cur=null;
    box.innerHTML='<div class="kzhq"><div class="hqbig">'+(Q.length?score+'/'+Q.length:'Lesson complete')+'</div><p>'+(!Q.length?'No quiz came with this lesson.':score===Q.length?'Complete. The teacher moves on.':'The missed questions return in a review.')+'</p><button class="more pri" id="kzhNext">Next lesson</button></div>';
    document.getElementById('kzhNext').onclick=()=>{V.sub='circle'; draw(); window.scrollTo(0,document.getElementById('kzhRoot').offsetTop-80)}; done(score)};
  step()}
document.addEventListener('keydown',e=>{if(quizKey&&tab==='learn') quizKey(e)});

async function startSession(mins){H.session={running:true,end:Date.now()+mins*60000,start:Date.now(),n:0}; drawSess();
  while(H.session&&H.session.running&&Date.now()<H.session.end){const l=H.next(); if(!document.getElementById('kzhLesson')) break; const r=await runLesson(l,{auto:true}); if(r===null) break; H.session&&(H.session.n++); await new Promise(r=>setTimeout(r,2500))}
  if(H.session){const d=ymd(new Date()); H.st.mins[d]=(H.st.mins[d]||0)+Math.round((Date.now()-H.session.start)/60000); H.save()}
  H.session=null; const c=document.getElementById('kzhSessC'); if(c) c.hidden=true}
function drawSess(){const c=document.getElementById('kzhSessC'); if(!c||!H.session) return; c.hidden=false;
  const tick=()=>{if(!H.session||!document.getElementById('kzhSessC')){clearInterval(t); return} const left=Math.max(0,H.session.end-Date.now()); c.innerHTML='<div class="hqlbl">Study session</div><div class="kzhclock">'+Math.floor(left/60000)+':'+String(Math.floor(left/1000)%60).padStart(2,'0')+'</div><p class="meta">'+H.session.n+' lesson(s) completed</p><button class="more" id="kzhEnd">End session</button>'; document.getElementById('kzhEnd').onclick=()=>{H.session.running=false}};
  const t=setInterval(tick,1000); tick()}

function drawSyl(){const el=body(), done=H.st.done;
  el.innerHTML=SYL.tracks.map(t=>{const d=t.lessons.filter(l=>done[l.id]).length; return '<section class="box"><div class="hqlbl">Track '+t.id+' · '+d+'/'+t.lessons.length+'</div><h3 class="akh" style="margin:0">'+esc(t.name)+'</h3><div class="hqbar"><span style="width:'+(100*d/t.lessons.length)+'%"></span></div>'+t.lessons.map(l=>'<div class="kzhrow"><span class="num">'+l.id+'</span><span style="min-width:0">'+esc(l.t)+(l.month?' <span class="chip ih">'+HM[l.month-1]+'</span>':'')+'</span><span>'+(done[l.id]?'<span class="tag">'+done[l.id].score+'/'+done[l.id].total+'</span>':'')+'</span><button class="more" data-kzhl="'+l.id+'">'+(done[l.id]?'Retake':'Take')+'</button></div>').join('')+'</section>'}).join('');
  el.querySelectorAll('[data-kzhl]').forEach(b=>b.onclick=()=>{const l=lessons().find(x=>x.id===b.dataset.kzhl); H.cur=l; H.pending=l; V.sub='circle'; LS.set('sub','circle'); draw(); setTimeout(()=>{const x=document.getElementById('kzhLesson'); if(x) x.scrollIntoView({block:'start'})},50)})}

/* ── recite with me and the ḥifẓ drill (B: pickSection, hqRecite, hqHifz) — the Arabic on screen, never voiced ── */
async function pickSection(prefix,cb){const st=LS.get(prefix,{b:'recite',s:1}); const K=window.KZBK; const el=body();
  if(!K){el.innerHTML='<p class="empty">The awrād are still loading…</p>'; setTimeout(cb,300); return null}
  let meta; try{meta=await K.M()}catch(e){el.innerHTML='<p class="empty">The awrād did not load.</p>'; return null}
  if(!meta[st.b]) st.b='recite'; const secs=meta[st.b].sections.map((s,i)=>[i,s]).filter(([i,s])=>s.a); if(!secs.some(([i])=>i===st.s)) st.s=secs[0][0];
  const sel='<div class="tools"><select id="'+prefix+'B" aria-label="Book">'+Object.entries(meta).map(([k,B])=>'<option value="'+k+'"'+(k===st.b?' selected':'')+'>'+esc(B.tariqa)+'</option>').join('')+'</select><select id="'+prefix+'S" aria-label="Section" style="flex:1 1 220px;min-width:0;width:100%">'+secs.map(([i,s])=>'<option value="'+i+'"'+(i===st.s?' selected':'')+'>'+esc(s.title)+'</option>').join('')+'</select></div>';
  let sec; try{if(!meta[st.b].sections[st.s].blocks) el.innerHTML='<section class="box">'+sel+'<p class="empty">Opening the section…</p></section>'; sec=await K.sec(st.b,st.s)}catch(e){el.innerHTML='<section class="box">'+sel+'<p class="empty">This section could not load. Choose it again.</p></section>'; wire(); return null}
  function wire(){const b=document.getElementById(prefix+'B'), s=document.getElementById(prefix+'S'); if(b) b.onchange=e=>{st.b=e.target.value; st.s=-1; LS.set(prefix,st); LS.set(prefix+'i',0); cb()}; if(s) s.onchange=e=>{st.s=+e.target.value; LS.set(prefix,st); LS.set(prefix+'i',0); cb()}}
  const units=[]; let u=null; sec.blocks.forEach((b,bi)=>{if(window.kzAwHeld&&window.kzAwHeld(st.b,st.s,bi)){u=null; return} if(b.t==='ar'){u={ar:b.x}; units.push(u)} else if(u&&b.t==='tl') u.tl=b.x; else if(u&&b.t==='en') u.en=b.x});
  LS.set(prefix,st); return {sel,wire,units,sec,st}}
let auto=null; function stopAuto(){if(auto){clearTimeout(auto.t); auto=null}}
async function drawRecite(){stopAuto(); const P=await pickSection('rc',drawRecite); if(!P||V.sub!=='recite') return; const el=body(); if(!P.units.length){el.innerHTML='<section class="box">'+P.sel+'<p class="empty">No Arabic lines in this section.</p></section>'; P.wire(); return}
  let i=Math.min(LS.get('rci',0),P.units.length-1), rep=0; const reps=LS.get('rcreps',1);
  el.innerHTML='<section class="box">'+P.sel+'<div class="hqstage box" style="text-align:center"><div class="meta" id="rcPos"></div><div class="hqar" id="rcAr" lang="ar" dir="rtl"></div><div class="num" id="rcAb"></div><p class="hqtr" id="rcTl"></p><p class="hqen" id="rcEn"></p><div class="hqbar" style="margin:0 auto"><span id="rcBar"></span></div></div>'+
    '<div class="tools" style="justify-content:center"><button class="more" id="rcP">← Back</button><button class="more pri" id="rcN">Next →</button><button class="more" id="rcAuto" aria-pressed="false">▶ Follow along at reading pace</button><label class="meta">repeat each <select id="rcReps">'+[1,3,7,11].map(n=>'<option'+(n===reps?' selected':'')+'>'+n+'</option>').join('')+'</select></label></div><p class="meta">Recite each line aloud yourself. The engine never voices the Arabic; it moves on at reading pace (about as long as the line takes to say), or when you tap Next or press →.</p></section>';
  P.wire();
  const dr=()=>{const u=P.units[i]; LS.set('rci',i); document.getElementById('rcPos').textContent=P.sec.title+' · line '+(i+1)+' of '+P.units.length+(reps>1?' · repetition '+(rep+1)+'/'+reps:''); document.getElementById('rcAr').textContent=u.ar; document.getElementById('rcAb').textContent='abjad '+ab(u.ar); document.getElementById('rcTl').textContent=u.tl||''; document.getElementById('rcEn').textContent=u.en||''; document.getElementById('rcBar').style.width=(100*(i+1)/P.units.length)+'%'};
  const adv=d=>{if(d>0&&rep+1<reps) rep++; else {rep=0; i=Math.max(0,Math.min(P.units.length-1,i+d))} dr()};
  document.getElementById('rcP').onclick=()=>adv(-1); document.getElementById('rcN').onclick=()=>adv(1);
  document.getElementById('rcReps').onchange=e=>{LS.set('rcreps',+e.target.value); drawRecite()};
  const ab2=document.getElementById('rcAuto'); ab2.onclick=()=>{if(auto){stopAuto(); ab2.setAttribute('aria-pressed','false'); ab2.textContent='▶ Follow along at reading pace'; return} ab2.setAttribute('aria-pressed','true'); ab2.textContent='■ Stop'; const go=()=>{if(!document.getElementById('rcAr')){stopAuto(); return} auto={t:setTimeout(()=>{if(i>=P.units.length-1&&rep+1>=reps){stopAuto(); ab2.setAttribute('aria-pressed','false'); ab2.textContent='▶ Follow along at reading pace'; return} adv(1); go()},Math.max(4000,P.units[i].ar.length*90))}}; go()};
  keyNav=e=>{if(V.sub!=='recite') return; if(e.key==='ArrowRight'){e.preventDefault(); adv(1)} else if(e.key==='ArrowLeft'){e.preventDefault(); adv(-1)}};
  dr()}
let keyNav=null; document.addEventListener('keydown',e=>{if(keyNav&&tab==='learn'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||'')&&document.getElementById('kzhRoot')) keyNav(e)});
async function drawHifz(){stopAuto(); const P=await pickSection('hz',drawHifz); if(!P||V.sub!=='hifz') return; const el=body(); if(!P.units.length){el.innerHTML='<section class="box">'+P.sel+'<p class="empty">No Arabic lines in this section.</p></section>'; P.wire(); return}
  let i=Math.min(LS.get('hzi',0),P.units.length-1), lvl=LS.get('hzl',2);
  el.innerHTML='<section class="box">'+P.sel+'<div class="flt" role="group" aria-label="Hide"><span class="meta">Hide</span>'+[0,1,2,3,4].map(n=>'<button data-hzl="'+n+'" aria-pressed="'+(n===lvl)+'">'+['0%','25%','50%','75%','all'][n]+'</button>').join('')+'<button id="hzR">Reveal all</button></div><div class="hqar kzhhz" id="hzA" lang="ar" dir="rtl"></div><details><summary class="meta">Meaning</summary><p class="hqtr" id="hzT"></p><p class="hqen" id="hzE"></p></details><div class="tools"><button class="more" id="hzP">← Previous line</button><button class="more pri" id="hzN">Next line →</button><span class="num" id="hzPos"></span></div><p class="meta">Tap a hidden word to reveal it. Recite the line aloud, then raise the level until you can say it with nothing showing.</p></section>';
  P.wire();
  const dr=()=>{const u=P.units[i]; LS.set('hzi',i); const words=u.ar.split(/\s+/), seed=i*7+3;
    document.getElementById('hzA').innerHTML=words.map((w,k)=>{const hide=lvl===4||(lvl>0&&((k*31+seed)%4)<lvl); return hide?'<button class="hw" data-w="'+esc(w)+'" aria-label="hidden word">'+'ـ'.repeat(Math.min(8,Math.max(3,w.length)))+'</button>':'<span>'+esc(w)+'</span>'}).join(' ');
    document.getElementById('hzT').textContent=u.tl||''; document.getElementById('hzE').textContent=u.en||''; document.getElementById('hzPos').textContent='line '+(i+1)+' of '+P.units.length;
    el.querySelectorAll('.hw').forEach(s=>s.onclick=()=>{s.textContent=s.dataset.w; s.classList.add('shown')})};
  el.querySelectorAll('[data-hzl]').forEach(b=>b.onclick=()=>{lvl=+b.dataset.hzl; LS.set('hzl',lvl); el.querySelectorAll('[data-hzl]').forEach(x=>x.setAttribute('aria-pressed',x===b)); dr()});
  document.getElementById('hzR').onclick=()=>el.querySelectorAll('.hw').forEach(s=>{s.textContent=s.dataset.w; s.classList.add('shown')});
  document.getElementById('hzP').onclick=()=>{i=Math.max(0,i-1); dr()}; document.getElementById('hzN').onclick=()=>{i=Math.min(P.units.length-1,i+1); dr()};
  keyNav=e=>{if(V.sub!=='hifz') return; if(e.key==='ArrowRight'){e.preventDefault(); i=Math.min(P.units.length-1,i+1); dr()} else if(e.key==='ArrowLeft'){e.preventDefault(); i=Math.max(0,i-1); dr()}};
  dr()}

function stats(){const st=H.st, done=Object.entries(st.done), sc=done.filter(([k,v])=>v.total>0), avg=sc.length?Math.round(100*sc.reduce((a,[k,v])=>a+v.score/v.total,0)/sc.length):0;
  const days=[...new Set(st.log.map(x=>x.d))].sort(); let streak=0; {let d=new Date(); if(!days.includes(ymd(d))) d=new Date(d-864e5); while(days.includes(ymd(d))){streak++; d=new Date(d-864e5)}}
  return {taken:done.length,total:lessons().length,avg,streak,review:st.missed.length,mins:Object.values(st.mins).reduce((a,b)=>a+(+b||0),0)}}
function drawProg(){const el=body(), s=stats(), st=H.st;
  el.innerHTML='<section class="box"><div class="stats">'+[[s.taken+'/'+s.total,'lessons taken'],[s.avg+'%','average score'],[s.streak,'day streak'],[s.review,'questions in review'],[s.mins,'minutes in sessions']].map(([n,l])=>'<div class="stat"><b>'+n+'</b><span>'+l+'</span></div>').join('')+'</div></section>'+
   '<div class="akcols"><section class="box"><h3 class="akh" style="margin:0">Tracks</h3>'+SYL.tracks.map(t=>{const d=t.lessons.filter(l=>st.done[l.id]).length; return '<div><div class="tools" style="justify-content:space-between"><span>'+esc(t.name)+'</span><span class="num">'+d+'/'+t.lessons.length+'</span></div><div class="hqbar" style="width:100%"><span style="width:'+(100*d/t.lessons.length)+'%"></span></div></div>'}).join('')+'</section>'+
   '<section class="box"><h3 class="akh" style="margin:0">Recent</h3>'+(st.log.slice(-12).reverse().map(x=>'<div class="kzhrow" style="grid-template-columns:minmax(0,1fr) auto"><span style="min-width:0">'+esc(x.t)+'</span><span class="num">'+x.d+' · '+x.score+'/'+x.total+'</span></div>').join('')||'<p class="meta">No lessons yet. The circle begins the first.</p>')+'</section></div>'+
   (st.missed.length?'<section class="box"><h3 class="akh" style="margin:0">In review</h3>'+st.missed.slice(-20).reverse().map(m=>'<div class="kzhrow" style="grid-template-columns:minmax(0,1fr)"><span>'+esc(m.q)+' <span class="meta">— '+esc((m.options||[])[m.answer]||'')+'</span></span></div>').join('')+'</section>':'')+
   '<p class="meta">'+(H.db?'Progress is kept with the engine\'s database, so it follows you to any device.':'Progress is kept in this browser.')+'</p>'}

/* ── into Learn ── */
const css=document.createElement('style'); css.textContent=`
#kzhRoot{display:grid;gap:16px;min-width:0}.kzhbody{display:grid;gap:16px;min-width:0}
.kzhgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,320px);gap:16px;align-items:start}@media (max-width:820px){.kzhgrid{grid-template-columns:minmax(0,1fr)}}
.kzhl,.kzhs{gap:6px}.kzhlead{font-size:1.08rem;line-height:1.7;max-width:68ch;margin:4px 0}
.kzhsec{border-top:1px solid var(--line);padding:10px 0 2px;max-width:70ch;line-height:1.75}.kzhsec h4{font-family:var(--f-head);font-weight:400;font-size:1.1rem;margin:0 0 4px;color:var(--gold)}.kzhsec p{margin:4px 0}
.kzhar{font-size:clamp(1.3rem,4.4vw,1.75rem);line-height:2}.kzhtl{font-style:italic;color:var(--turq)}.kzhen{color:var(--muted)}
.kzhpost{white-space:pre-wrap;max-width:72ch;line-height:1.7;overflow-wrap:anywhere}.kzhpost.clip{max-height:14em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent)}
.kzhq{display:grid;gap:8px;border:1px solid var(--gold);border-radius:10px;padding:12px;background:var(--panel);margin-top:8px}.kzhqq{font-weight:500;margin:0;font-size:1.05rem}
.kzhrow{display:grid;grid-template-columns:44px minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line);min-height:44px}
@media (max-width:520px){.kzhrow{grid-template-columns:40px minmax(0,1fr) auto}.kzhrow>button{grid-column:2/-1;justify-self:start}}
.kzhclock{font-family:var(--f-mono);font-size:2rem;font-variant-numeric:tabular-nums}
.kzhhz{text-align:right;line-height:2.2}.kzhhz .hw{font:inherit;border:0;border-bottom:2px dotted var(--gold);background:none;color:var(--gold);cursor:pointer;padding:0 2px;min-height:40px}.kzhhz .hw.shown{color:var(--ink);border-bottom-color:var(--ok)}
.learnjump{display:flex;gap:6px;flex-wrap:wrap}`;
document.head.appendChild(css);

const rL=window.renderLearn||renderLearn;
renderLearn=function(){const r=rL.apply(this,arguments); const v=document.getElementById('view'); const hq=document.getElementById('hqRoot');
  if(v&&!document.getElementById('kzhRoot')){const d=document.createElement('div'); d.id='kzhRoot'; if(hq&&hq.nextSibling) v.insertBefore(d,hq.nextSibling); else v.appendChild(d);
    const j=document.createElement('section'); j.className='box'; j.innerHTML='<div class="learnjump flt" role="navigation" aria-label="On this page"><span class="meta">Go to</span><button data-lj="hqRoot">al-Ḥalqa &amp; the Study</button><button data-lj="kzhRoot">Kunūz al-Ḥalqa</button><button data-lj="about">Abjad &amp; square lab</button></div>'; v.insertBefore(j,v.firstChild);
    j.querySelectorAll('[data-lj]').forEach(b=>b.onclick=()=>{const t=b.dataset.lj==='about'?document.getElementById('abin'):document.getElementById(b.dataset.lj); if(t) t.scrollIntoView({behavior:'smooth',block:'start'})});
    draw()} return r};
window.renderLearn=renderLearn;

/* the day's lesson in the Kunūz wird, as B lists it */
window.kzhToday=()=>SYL?todayLesson():null;
window.kzhOpen=l=>{H.cur=l; H.pending=l; V.sub='circle'; LS.set('sub','circle'); tab='learn'; render(); setTimeout(()=>{const x=document.getElementById('kzhRoot'); if(x) x.scrollIntoView({block:'start'})},80)};
window.kzhState=()=>H.st;

/* ── Ask ── */
if(typeof AITOOLS!=='undefined') AITOOLS.push(
 {name:'kunuz_lessons',description:"Kunūz al-Ḥalqa: the syllabus (8 tracks, 59 lessons with their source posts, awrād sections and Sharḥ pages), Al's results, the lesson the teacher would choose next, the review list, streak and averages.",inputSchema:{type:'object',properties:{}},
  execute:async()=>{await loadSyl(); const nx=H.next(); return {next:{id:nx.id,title:nx.t,track:nx.track},stats:stats(),tracks:SYL.tracks.map(t=>({id:t.id,name:t.name,lessons:t.lessons.map(l=>({id:l.id,title:l.t,month:l.month?HM[l.month-1]:null,posts:l.posts||[],book:l.book||null,sharh_pages:l.pages||null,result:H.st.done[l.id]||null}))})),in_review:H.st.missed.map(m=>m.q)}}},
 {name:'open_kunuz_lesson',description:'Open a Kunūz al-Ḥalqa lesson by id (e.g. "V3", or "next") in Learn for Al. Use when he asks to take or see a lesson.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id']},
  execute:async({id})=>{await loadSyl(); const l=id==='next'?H.next():lessons().find(x=>x.id.toLowerCase()===String(id).toLowerCase()); if(!l) throw new Error('no such lesson'); setTimeout(()=>window.kzhOpen(l),300); return {opened:l.id,title:l.t}}});

H.init(); loadSyl().catch(()=>{});
if(tab==='learn'&&!document.getElementById('kzhRoot')) renderLearn();
})();
