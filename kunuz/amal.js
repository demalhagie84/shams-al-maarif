/* ===== Kunūz al-Dhikr inside the merged engine — port 6, part 1 (2026-11-17):
   the daily wird with its ticks (merged across devices, as Kunūz does), the guided practice runner (one step at a time,
   counted, the Arabic shown vowelled with transliteration and English, the awrād books line by line), the Practices
   & the sacred year page, and the Tasbīḥ. Ported from Kunūz al-Dhikr's index.html (todayItems, stepsFor, runPractice,
   drawRun, runInc, finishRun, DAY, MERGE, TAS, amal, tasbih). Data: kunuz/practices.json and kunuz/books/ (copies).
   Decision 1: no machine voice for any Arabic — B's "Say it with me" and "Recite the count with me" are cut; the
   English line may be read aloud (englishOnly). ===== */
(function(){
'use strict';
const $=s=>document.querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const LS={get(k,d){try{const v=localStorage.getItem('kz:'+k); return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{if(v==null) localStorage.removeItem('kz:'+k); else localStorage.setItem('kz:'+k,JSON.stringify(v))}catch(e){}}};
const HM=['Muḥarram','Ṣafar','Rabīʿ al-Awwal','Rabīʿ al-Thānī','Jumādā al-Ūlā','Jumādā al-Ākhira','Rajab','Shaʿbān','Ramaḍān','Shawwāl','Dhū al-Qaʿda','Dhū al-Ḥijja'];
const WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
/* Kunūz reckons the sacred year by Umm al-Qurā (Intl), as B does; the engine's tabular hijri() is the fallback */
function kzHijri(d){try{const p=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric',year:'numeric'}).formatToParts(d); const g=t=>+p.find(x=>x.type===t).value; const r={d:g('day'),m:g('month'),y:g('year')}; if(r.d&&r.m&&r.y) return r}catch(e){} try{const h=hijri(d); return {d:h.d,m:h.m,y:h.y}}catch(e){return null}}
const TG=id=>'<a href="https://t.me/DhikrNotes/'+id+'" target="_blank" rel="noopener">#'+id+'</a>';
const srcs=a=>a&&a.length?'<div class="meta">DhikrNotes '+a.map(TG).join(' ')+'</div>':'';

/* ── data ── */
let PRAC=null, PRACP=null, BOOKS=null, BOOKSP=null;
const loadPrac=()=>PRAC?Promise.resolve(PRAC):PRACP||(PRACP=xget('kunuz/practices.json').then(d=>(PRAC=d)).catch(e=>{PRACP=null; throw e}));
/* the awrād books: Kunūz's books/meta.json + one file per section (kunuz/books/…), loaded by KZBK in kunuz/awrad.js (2026-11-17; books.json dropped) */
const kzbk=()=>window.KZBK?Promise.resolve(window.KZBK):new Promise(r=>setTimeout(()=>r(kzbk()),30));
const loadBooks=()=>BOOKS?Promise.resolve(BOOKS):BOOKSP||(BOOKSP=kzbk().then(K=>K.all()).then(d=>(BOOKS=d)).catch(e=>{BOOKSP=null; throw e}));

/* ── state: merge-safe, as Kunūz pass 2. Each day its own record (wird/<date>), every tick carries its time;
   counters are per device and only grow (tasbīḥ: separate plus and minus tallies). Any two devices merge to the same state. ── */
const DEV=(()=>{let d=LS.get('dev',null); if(!d){d=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4); LS.set('dev',d)} return d})();
const canon=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
const maxMap=(a,b)=>{const o={...(b||{})}; for(const [k,v] of Object.entries(a||{})) o[k]=Math.max(+v||0,+o[k]||0); return o};
const lww=(a,b,f='t')=>(((a&&a[f])||0)>=((b&&b[f])||0)?a:b)||a||b;
const MERGE={
  day(a,b){a=a||{}; b=b||{}; const o={done:{},un:{},occ:{...(b.occ||{}),...(a.occ||{})}};
    const ids=new Set([a.done,a.un,b.done,b.un].flatMap(x=>Object.keys(x||{})));
    for(const id of ids){const d=Math.max(+(a.done||{})[id]||0,+(b.done||{})[id]||0), u=Math.max(+(a.un||{})[id]||0,+(b.un||{})[id]||0); if(d&&d>=u) o.done[id]=d; else if(u) o.un[id]=u}
    const src=(+a.t||0)>=(+b.t||0)?a:b, c=Object.keys(o.done).length; o.t=Math.max(+a.t||0,+b.t||0); o.of=+src.of||Math.max(+a.of||0,+b.of||0); o.n=Math.min(+src.n||0,c); return o},
  core(a,b){a=a||{}; b=b||{}; const o={...b,...a};
    o.tasP=maxMap(a.tasP,b.tasP); o.tasN=maxMap(a.tasN,b.tasN); o.tasL=Math.max(+a.tasL||0,+b.tasL||0);
    o.tday={}; for(const k of new Set([...Object.keys(a.tday||{}),...Object.keys(b.tday||{})])) o.tday[k]=maxMap((a.tday||{})[k],(b.tday||{})[k]);
    const tk=Object.keys(o.tday).sort(); while(tk.length>120) delete o.tday[tk.shift()];
    o.plan=lww(a.plan,b.plan); o.tas=lww(a.tas,b.tas,'ts'); o.juz=lww(a.juz,b.juz);
    for(const k of Object.keys(o)) if(o[k]===undefined) delete o[k]; return o}};
const coreBody=s=>{const o={}; ['plan','tas','juz','tasP','tasN','tasL','tday'].forEach(k=>{if(s[k]!==undefined) o[k]=s[k]}); return o};
const dayBody=v=>({done:v.done||{},un:v.un||{},occ:v.occ||{},t:+v.t||0,of:+v.of||0,n:+v.n||0});
const K={st:LS.get('st',{}), db:null, dirty:new Set(), lastW:{}, _t:null,
  async init(){this.st.days=this.st.days||{}; let db=null; try{db=await Promise.race([cuse('db'),new Promise(r=>setTimeout(()=>r(null),10000))])}catch(e){db=null} if(db) await this.attach(db)},
  absorb(v){const before=canon(coreBody(this.st)); Object.assign(this.st,MERGE.core(coreBody(this.st),v)); return canon(coreBody(this.st))!==before},
  async attach(db){if(!db||this.db) return; let ch=false;
    try{const s=await db.doc('kunuz/core').get(); const d=s.exists&&s.data(); if(d&&d.json) ch=this.absorb(JSON.parse(d.json))||ch}catch(e){}
    const remote={}; try{(await db.collection('wird').get()).docs.forEach(s=>{if(s.exists) remote[s.id]=s.data()})}catch(e){}
    for(const [k,v] of Object.entries(remote)){const cur=this.st.days[k], m=MERGE.day(cur,v); if(!cur||canon(dayBody(m))!==canon(dayBody(cur))){this.st.days[k]=m; ch=true}}
    this.db=db; LS.set('st',this.st);
    for(const [k,v] of Object.entries(this.st.days)) if(!remote[k]||canon(dayBody(MERGE.day(v,remote[k])))!==canon(dayBody(remote[k]))) this.dirty.add(k); else this.lastW[k]=canon(dayBody(remote[k]));
    this.flushDays(); this.flushCore(); this.listen(); if(ch) redraw()},
  listen(){const db=this.db;
    try{const cut=ymd(new Date(Date.now()-40*864e5)); db.collection('wird').where('k','>=',cut).onSnapshot(qs=>{let ch=false;
      qs.docs.forEach(s=>{const v=s.exists&&s.data(); if(!v) return; const k=s.id, cur=this.st.days[k], m=MERGE.day(cur,v);
        if(!cur||canon(dayBody(m))!==canon(dayBody(cur))){this.st.days[k]=m; ch=true}
        if(canon(dayBody(m))!==canon(dayBody(v))) this.dirty.add(k); else this.lastW[k]=canon(dayBody(v))});
      if(ch){LS.set('st',this.st); redraw()} if(this.dirty.size) this.flushDays()},()=>{})}catch(e){}
    try{db.doc('kunuz/core').onSnapshot(s=>{const d=s.exists&&s.data(); if(!d||!d.json) return; let v; try{v=JSON.parse(d.json)}catch(e){return}
      if(this.absorb(v)){LS.set('st',this.st); redraw()} if(canon(coreBody(this.st))!==canon(coreBody(v))) this.saveCore()},()=>{})}catch(e){}},
  save(){LS.set('st',this.st); this.dirty.add(ymd(new Date())); this.saveCore()},
  saveCore(){clearTimeout(this._t); this._t=setTimeout(()=>{this.flushCore(); this.flushDays()},800)},
  async flushCore(){if(!this.db) return; if(this._wc){this._dc=true; return} this._wc=true; this._dc=false;
    try{let rem=null; try{const s=await this.db.doc('kunuz/core').get(); const d=s.exists&&s.data(); if(d&&d.json) rem=JSON.parse(d.json)}catch(e){}
      if(rem) this.absorb(rem); const body=coreBody(this.st);
      if(!rem||canon(coreBody(rem))!==canon(body)) await this.db.doc('kunuz/core').set({json:JSON.stringify(body),updated:new Date().toISOString()}); LS.set('st',this.st)}catch(e){}
    this._wc=false; if(this._dc) this.flushCore()},
  async flushDays(){if(!this.db||this._wd) return; this._wd=true;
    try{while(this.dirty.size){const k=this.dirty.values().next().value; this.dirty.delete(k); const loc=this.st.days[k]; if(!loc) continue;
      let rem=null; try{const s=await this.db.doc('wird/'+k).get(); if(s.exists) rem=s.data()}catch(e){}
      const m=MERGE.day(loc,rem); this.st.days[k]=m; const c=canon(dayBody(m));
      if(rem&&canon(dayBody(rem))===c){this.lastW[k]=c; continue} if(rem&&this.lastW[k]===c) continue;
      try{await this.db.doc('wird/'+k).set({k,...dayBody(m)}); this.lastW[k]=c}catch(e){this.dirty.add(k); break}}
      LS.set('st',this.st)}catch(e){}
    this._wd=false}};

/* ── the wird plan (B: PLAN, SLOTS, slotOf, todayItems) ── */
const SLOTS=[['fajr','After Fajr'],['morning','Morning'],['dhuhr','Ẓuhr'],['asr','ʿAṣr'],['maghrib','Maghrib'],['isha','ʿIshāʾ · before sleep'],['any','Any time today']];
const SLOT_N=Object.fromEntries(SLOTS);
const SORD=['fajr','morning','dhuhr','asr','maghrib','isha'];
const PLAN_DEF=['d-adab','d-dalail','d-hifz','d-quran','d-mashish','d-friday'];
const SLOT_DEF={'d-intent':'fajr','d-adab':'fajr','d-qudsiyya':'morning','d-dalail':'morning','d-kubra':'morning','d-wiqaya':'fajr','d-hifz':'morning','d-bahr':'asr','d-mashish':'isha','d-barr':'fajr','d-quran':'any','d-names':'maghrib','d-friday':'dhuhr','d-wealth':'any'};
const PLAN=()=>{const p=K.st.plan||{}; return {ids:p.ids||PLAN_DEF.slice(),slots:p.slots||{},lesson:p.lesson!==false}};
function savePlan(p){p.t=Date.now(); K.st.plan=p; K.save()}
const JUZ=()=>Math.min(30,Math.max(1,(K.st.juz&&+K.st.juz.n)||1));
const slotOf=(id,p)=>{p=p||PLAN(); return p.slots[id]||SLOT_DEF[id]||'any'};
/* prayer times from My day's place and method (the engine's own prayerTimes) */
function PT(now){now=now||new Date(); const [name,lat,lon]=TD.loc; const tz=-now.getTimezoneOffset()/60; const p=prayerTimes(now,lat,lon,tz,TD.method); const at=h=>{if(h==null) return null; const x=new Date(now); x.setHours(0,0,0,0); return new Date(x.getTime()+h*3600000)};
  return {name,P:{fajr:at(p.fajr),sunrise:at(p.sunrise),dhuhr:at(p.dhuhr),asr:at(p.asr),maghrib:at(p.maghrib),isha:at(p.isha)}}}
function slotNow(P,t){t=t||new Date(); if(!P.fajr) return 'any'; if(t<P.fajr) return 'isha'; if(t<P.sunrise) return 'fajr'; if(t<P.dhuhr) return 'morning'; if(t<P.asr) return 'dhuhr'; if(t<P.maghrib) return 'asr'; if(t<P.isha) return 'maghrib'; return 'isha'}
function occFor(date){if(!PRAC) return []; const h=kzHijri(date); if(!h) return [];
  const md=String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  const nxt=kzHijri(new Date(date.getTime()+7*864e5)), tmr=kzHijri(new Date(date.getTime()+864e5));
  return PRAC.occasions.filter(o=>{if(o.greg) return o.greg===md; if(o.month!==h.m) return false; if(o.day==null) return true;
    if(o.day==='last Wednesday') return date.getDay()===3&&nxt&&nxt.m!==h.m;
    if(o.day==='first Thursday night') return date.getDay()===4&&h.d<=7;
    if(o.day==='last Thursday night') return date.getDay()===4&&nxt&&nxt.m!==h.m;
    if(o.day==='last night') return tmr&&tmr.m!==h.m;
    return o.day===h.d}).map(o=>({...o,monthLong:o.day==null&&!o.greg}))}
function upcoming(n){const out=[],seen=new Set(),t=new Date(); for(let i=1;i<=n;i++){const d=new Date(t.getTime()+i*864e5); for(const o of occFor(d)){if(seen.has(o.id)) continue; seen.add(o.id); out.push({o,d,i})}} return out}
function todayItems(){if(!PRAC) return []; const p=PLAN(), wd=new Date().getDay(), out=[];
  for(const id of p.ids){const it=PRAC.daily.find(x=>x.id===id); if(!it) continue; if(id==='d-friday'&&wd!==5) continue; out.push({...it,slot:slotOf(id,p),kind:'wird'})}
  if(p.lesson!==false&&window.kzhToday){const l=window.kzhToday(); if(l) out.push({id:'lesson',title:'al-Ḥalqa lesson: '+l.t,when:'Any time · about 15 minutes',tariqa:l.track,slot:'any',kind:'lesson',lesson:l})} /* 2026-11-21: B's day lesson, now that Kunūz al-Ḥalqa runs in Learn */
  for(const o of occFor(new Date())) out.unshift({...o,when:o.monthLong?'This month':'Today',slot:'any',kind:'occ'});
  return out}
const DAY={get(d){d=d||ymd(new Date()); const S=K.st.days; const x=S[d]||(S[d]={done:{},un:{},occ:{}}); x.done=x.done||{}; x.un=x.un||{}; return x},
  set(id,v){const x=this.get(), t=Date.now(); if(v){x.done[id]=t; delete x.un[id]} else {delete x.done[id]; x.un[id]=t} x.t=t; const it=todayItems(); x.of=it.length; x.n=it.filter(i=>x.done[i.id]).length;
    const ks=Object.keys(K.st.days).sort(); while(ks.length>150) delete K.st.days[ks.shift()]; K.save()}};
const tdone=id=>!!DAY.get().done[id];
function streak(){const days=K.st.days||{}; let n=0, d=new Date(); const ok=k=>days[k]&&days[k].of>0&&days[k].n>=days[k].of; if(!ok(ymd(d))) d=new Date(d-864e5); while(ok(ymd(d))){n++; d=new Date(d-864e5)} return n}
function nextItem(){const its=todayItems().filter(i=>!tdone(i.id)); if(!its.length) return null; const cur=slotNow(PT().P), ci=SORD.indexOf(cur);
  return its.find(i=>i.kind==='occ')||its.find(i=>i.slot===cur)||its.find(i=>SORD.indexOf(i.slot)>-1&&SORD.indexOf(i.slot)<ci)||its.find(i=>i.slot==='any')||its[0]}

/* ── texts for doing a practice (B's AR / AR_TL / AR_EN, verbatim; the Qurʾānic ones checked against the muṣḥaf) ── */
const AR={
 taawwudh:'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ۝ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ',
 shahada:'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
 istighfar:'أَسْتَغْفِرُ اللّٰهَ',
 ikhlas:'قُلْ هُوَ اللّٰهُ أَحَدٌ ۝ اللّٰهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
 fatiha:'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
 falaq:'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
 nas:'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
 sharh:'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ۝ وَوَضَعْنَا عَنْكَ وِزْرَكَ ۝ الَّذِي أَنْقَضَ ظَهْرَكَ ۝ وَرَفَعْنَا لَكَ ذِكْرَكَ ۝ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ فَإِذَا فَرَغْتَ فَانْصَبْ ۝ وَإِلَىٰ رَبِّكَ فَارْغَبْ',
 amana:'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۝ لَا يُكَلِّفُ اللّٰهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
 tahlil:'لَا إِلٰهَ إِلَّا اللّٰهُ',
 salawat:'اللّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ وَسَلِّمْ',
 sharifa:'صَلِّ يَا رَبِّ وَسَلِّمْ عَلَىٰ جَمِيعِ الْأَنْبِيَاءِ وَالْمُرْسَلِينَ، وَآلِ كُلٍّ أَجْمَعِينَ، وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ',
 haqq:'اللّٰهُ اللّٰهُ اللّٰهُ حَقّ',allah3:'اللّٰهُ اللّٰهُ اللّٰهُ',
 mashaallah:'مَا شَاءَ اللّٰهُ',hamd:'الْحَمْدُ لِلّٰهِ',shukr:'شُكْرًا لِلّٰهِ',subhan:'سُبْحَانَ اللّٰهِ',
 inna:'إِنَّا لِلّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ',hasbuna:'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ',tawakkul:'تَوَكَّلْتُ عَلَى اللّٰهِ',
 hawla:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',latif:'يَا لَطِيفُ',
 hayy:'سُبْحَانَ اللّٰهِ الْحَيِّ الْقَيُّومِ',ahad:'سُبْحَانَ اللّٰهِ الْأَحَدِ الصَّمَدِ',rauf:'سُبْحَانَ اللّٰهِ الرَّؤُوفِ',
 muhammad:'مُحَمَّدٌ رَسُولُ اللّٰهِ'};
const FORM=[[/ta.?awwudh/,'taawwudh'],[/salawat al-sharifa|salli ya rabbi/,'sharifa'],[/l-hayyi l-qayyum/,'hayy'],[/l-ahadi s-samad/,'ahad'],[/r-ra.?uf/,'rauf'],[/allahu allahu allahu haqq/,'haqq'],
  [/shahada/,'shahada'],[/astaghfiru|istighfar/,'istighfar'],[/falaq.*nas/,'falaq+nas'],[/ikhlas/,'ikhlas'],[/fatiha/,'fatiha'],[/al-falaq/,'falaq'],[/sharh/,'sharh'],[/amana r-rasul|2:285/,'amana'],
  [/la ilaha illa/,'tahlil'],[/salawat|allahumma salli/,'salawat'],[/ma sha.?a-?llah/,'mashaallah'],[/al-hamdu li-?llah/,'hamd'],[/shukran/,'shukr'],[/subhana-?llah/,'subhan'],
  [/inna li-?llahi/,'inna'],[/hasbuna/,'hasbuna'],[/tawakkaltu/,'tawakkul'],[/la hawla/,'hawla'],[/ya latif/,'latif'],[/allah allah allah/,'allah3']];
const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[ʿʾ'’‘]/g,'').toLowerCase();
const AR_TL={
 taawwudh:'Aʿūdhu bi’llāhi mina’sh-shayṭāni’r-rajīm. Bismi’llāhi’r-Raḥmāni’r-Raḥīm.',
 shahada:'Ashhadu an lā ilāha illa’llāh, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh.',
 istighfar:'Astaghfiru’llāh.',
 ikhlas:'Qul huwa’llāhu aḥad. Allāhu’ṣ-Ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahū kufuwan aḥad.',
 fatiha:'Bismi’llāhi’r-Raḥmāni’r-Raḥīm. Al-ḥamdu li’llāhi Rabbi’l-ʿālamīn. Ar-Raḥmāni’r-Raḥīm. Māliki yawmi’d-dīn. Iyyāka naʿbudu wa iyyāka nastaʿīn. Ihdina’ṣ-ṣirāṭa’l-mustaqīm. Ṣirāṭa’lladhīna anʿamta ʿalayhim, ghayri’l-maghḍūbi ʿalayhim wa la’ḍ-ḍāllīn.',
 falaq:'Qul aʿūdhu bi-Rabbi’l-falaq. Min sharri mā khalaq. Wa min sharri ghāsiqin idhā waqab. Wa min sharri’n-naffāthāti fi’l-ʿuqad. Wa min sharri ḥāsidin idhā ḥasad.',
 nas:'Qul aʿūdhu bi-Rabbi’n-nās. Maliki’n-nās. Ilāhi’n-nās. Min sharri’l-waswāsi’l-khannās. Alladhī yuwaswisu fī ṣudūri’n-nās. Mina’l-jinnati wa’n-nās.',
 sharh:'A-lam nashraḥ laka ṣadrak. Wa waḍaʿnā ʿanka wizrak. Alladhī anqaḍa ẓahrak. Wa rafaʿnā laka dhikrak. Fa-inna maʿa’l-ʿusri yusrā. Inna maʿa’l-ʿusri yusrā. Fa-idhā faraghta fa’nṣab. Wa ilā Rabbika fa’rghab.',
 amana:'Āmana’r-rasūlu bimā unzila ilayhi min Rabbihī wa’l-muʾminūn. Kullun āmana bi’llāhi wa malāʾikatihī wa kutubihī wa rusulih, lā nufarriqu bayna aḥadin min rusulih. Wa qālū samiʿnā wa aṭaʿnā, ghufrānaka Rabbanā wa ilayka’l-maṣīr. Lā yukallifu’llāhu nafsan illā wusʿahā, lahā mā kasabat wa ʿalayhā ma’ktasabat. Rabbanā lā tuʾākhidhnā in nasīnā aw akhṭaʾnā. Rabbanā wa lā taḥmil ʿalaynā iṣran kamā ḥamaltahū ʿala’lladhīna min qablinā. Rabbanā wa lā tuḥammilnā mā lā ṭāqata lanā bih. Wa’ʿfu ʿannā wa’ghfir lanā wa’rḥamnā, anta mawlānā fa’nṣurnā ʿala’l-qawmi’l-kāfirīn.',
 tahlil:'Lā ilāha illa’llāh.',
 salawat:'Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammadin wa sallim.',
 sharifa:'Ṣalli yā Rabbi wa sallim ʿalā jamīʿi’l-anbiyāʾi wa’l-mursalīn, wa āli kullin ajmaʿīn, wa’l-ḥamdu li’llāhi Rabbi’l-ʿālamīn.',
 haqq:'Allāhu Allāhu Allāhu Ḥaqq.',allah3:'Allāhu Allāhu Allāh.',
 mashaallah:'Mā shāʾa’llāh.',hamd:'Al-ḥamdu li’llāh.',shukr:'Shukran li’llāh.',subhan:'Subḥāna’llāh.',
 inna:'Innā li’llāhi wa innā ilayhi rājiʿūn.',hasbuna:'Ḥasbuna’llāhu wa niʿma’l-wakīl.',tawakkul:'Tawakkaltu ʿala’llāh.',
 hawla:'Lā ḥawla wa lā quwwata illā bi’llāhi’l-ʿAliyyi’l-ʿAẓīm.',latif:'Yā Laṭīf.',
 hayy:'Subḥāna’llāhi’l-Ḥayyi’l-Qayyūm.',ahad:'Subḥāna’llāhi’l-Aḥadi’ṣ-Ṣamad.',rauf:'Subḥāna’llāhi’r-Raʾūf.',
 muhammad:'Muḥammadun rasūlu’llāh.'};
const AR_EN={
 taawwudh:'I seek refuge in Allāh from Satan the outcast. In the name of Allāh, the All-Merciful, the Compassionate.',
 shahada:'I bear witness that there is no god but Allāh, and I bear witness that Muḥammad is His servant and His Messenger.',
 istighfar:'I ask Allāh’s forgiveness.',
 ikhlas:'Say: He is Allāh, the One. Allāh, the Eternally Besought. He does not beget, nor was He begotten. And there is none comparable to Him.',
 fatiha:'In the name of Allāh, the All-Merciful, the Compassionate. Praise belongs to Allāh, Lord of the worlds, the All-Merciful, the Compassionate, Master of the Day of Judgement. You alone we worship, and You alone we ask for help. Guide us on the straight path: the path of those You have blessed, not of those who earn anger, nor of those who go astray.',
 falaq:'Say: I seek refuge with the Lord of the daybreak, from the evil of what He has created, from the evil of the darkness when it settles, from the evil of those who blow on knots, and from the evil of the envier when he envies.',
 nas:'Say: I seek refuge with the Lord of people, the King of people, the God of people, from the evil of the slinking whisperer who whispers in the breasts of people, from among jinn and people.',
 sharh:'Did We not open your breast for you, lift from you the burden that weighed down your back, and raise high your remembrance? So truly, with hardship comes ease; truly, with hardship comes ease. So when you are free, keep striving, and turn to your Lord with longing.',
 amana:'The Messenger believes in what was sent down to him from his Lord, and so do the believers. Each believes in Allāh, His angels, His books and His messengers: “We make no distinction between any of His messengers.” And they say: “We hear and we obey. Your forgiveness, our Lord; to You is the journey’s end.” Allāh burdens no soul beyond its capacity: it has what it earned and bears what it incurred. Our Lord, do not take us to task if we forget or err. Our Lord, do not lay on us a burden like the one You laid on those before us. Our Lord, do not make us carry what we have no strength to bear. Pardon us, forgive us, and have mercy on us. You are our Protector, so help us against the people who deny.',
 tahlil:'There is no god but Allāh.',
 salawat:'O Allāh, send blessings upon Muḥammad and the family of Muḥammad, and grant them peace.',
 sharifa:'Bless, O Lord, and grant peace to all the prophets and messengers, and to the family of each of them, all together; and praise belongs to Allāh, Lord of the worlds.',
 haqq:'Allāh, Allāh, Allāh: the Real.',allah3:'Allāh, Allāh, Allāh.',
 mashaallah:'What Allāh wills comes to be.',hamd:'Praise belongs to Allāh.',shukr:'Thanks be to Allāh.',subhan:'Glory be to Allāh.',
 inna:'We belong to Allāh, and to Him we return.',hasbuna:'Allāh is enough for us, and how excellent a Guardian He is.',tawakkul:'I put my trust in Allāh.',
 hawla:'There is no power and no strength except through Allāh, the Most High, the Immense.',latif:'O Subtle, Gentle One.',
 hayy:'Glory be to Allāh, the Living, the Self-Subsisting.',ahad:'Glory be to Allāh, the One, the Eternally Besought.',rauf:'Glory be to Allāh, the Most Kind.',
 muhammad:'Muḥammad is the Messenger of Allāh.'};
/* the Qurʾānic texts, by verse (checked against the copied Tanzil muṣḥaf in the verification run) */
const AR_Q={ikhlas:'112:1-4',fatiha:'1:1-7',falaq:'113:1-5',nas:'114:1-6',sharh:'94:1-8',amana:'2:285-286'};
window.KZ_AR=AR; window.KZ_AR_Q=AR_Q;
function arFor(step){const f=fold(step); for(const [re,k] of FORM) if(re.test(f)) return k.split('+'); return null}
function arPack(step){const ks=arFor(step); if(!ks) return {}; return {ar:ks.map(x=>AR[x]).join(' ۝ '),tl:ks.map(x=>AR_TL[x]).filter(Boolean).join(' · '),en:ks.map(x=>AR_EN[x]).filter(Boolean).join(' '),q:ks.map(x=>AR_Q[x]).filter(Boolean),abj:ks.length===1&&!AR_Q[ks[0]]?abjad(AR[ks[0]],false).total:null}}
function countOf(s){s=String(s||''); let m=s.match(/[×]\s?(\d+)/)||s.match(/(?<![:\d])(\d+)\s*[–-]\s*\d+(?!\s*:)/)||s.match(/(\d+)\s?×/); const n=m?+m[1]:1; return Math.max(1,Math.min(1000,n))}
/* 2026-11-22: the runner carries every recited line of a section, as printed — the 'li' lines (the house built of Names in
   Ḥizb al-Baḥr, the Names lists of the Ikhtitām, the letters of the Iʿtiṣām) and an Arabic line set as a paragraph (the
   Iʿtiṣām's basmala) become steps when the edition gives their transliteration or English; a count printed after a line
   (❁ ٣, (٧)) becomes the bead's count. Before this the runner skipped those lines, so the Ḥizb could not be read through. */
const AR_ONLY=/^[\s\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF❁۝﴾﴿().,،:؛]+$/;
const isArLine=t=>!!t&&AR_ONLY.test(t)&&/[\u0621-\u064A]/.test(t);
const AD=d=>+String(d).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));
function lineCount(t){t=String(t||'').replace(/\s*Q\s*\d+\s*:\s*[\d\s–-]+$/,'').trim(); let m=t.match(/(?:❁|﴾)\s*\(?([٠-٩0-9]{1,3})\)?\s*[.،,]?$/)||t.match(/\(([٠-٩0-9]{1,3})\)\s*[.،,]?$/); const n=m?AD(m[1]):1; return n>1&&n<=1000?n:1}
function unitsOfBlocks(blocks,filter){const units=[]; let u=null, on=!filter;
  const next=(j,t)=>{for(let k=j+1;k<blocks.length;k++){const b=blocks[k]; if(b.t===t) continue; return b} return null};
  for(let j=0;j<blocks.length;j++){const b=blocks[j]; if(b.t==='day'&&filter){on=filter(b.x); continue} if(!on) continue;
    if(b.t==='ar'){u={ar:b.x,v:b.v,count:lineCount(b.x)}; units.push(u)}
    else if(b.t==='li'&&isArLine(b.x)){const nb=next(j,'li'); if(!(nb&&(nb.t==='tl'||nb.t==='en'))) continue; if(u&&u.li&&blocks[j-1]&&blocks[j-1].t==='li') u.ar+='\n'+b.x; else {u={ar:b.x,li:1,count:1}; units.push(u)}}
    else if(b.t==='p'&&isArLine(b.x)){const nb=blocks[j+1]; if(nb&&(nb.t==='tl'||nb.t==='en')){u={ar:b.x,count:lineCount(b.x)}; units.push(u)}}
    else if(u&&b.t==='tl'&&!u.tl) u.tl=b.x; else if(u&&b.t==='en'&&!u.en) u.en=b.x}
  return units}
function itemSecs(it,date){date=date||new Date(); if(!it||!it.book||!BOOKS) return null; const [k,m]=it.book, B=BOOKS[k]; if(!B) return null; const wd=date.getDay(); let ix=[];
  if(it.id==='d-dalail'){const n=[7,1,2,3,4,5,6][wd]; B.sections.forEach((s,i)=>{if(s.num==='Ḥizb '+n||(wd===1&&s.num==='Ḥizb 8')) ix.push(i)})}
  else if(it.id==='d-kubra'){const i=B.sections.findIndex(x=>x.title.includes('al-Ṣalāt al-Kubrā')); if(i>-1) ix=[i]}
  else if(it.id==='d-bahr'){['Iʿtiṣām','Ḥizb al-Baḥr','Ikhtitām'].forEach(t=>{const i=B.sections.findIndex(x=>x.title.includes(t)); if(i>-1) ix.push(i)})} /* 2026-11-22: as the practice says — with the Iʿtiṣām before and the Ikhtitām after */
  else {const i=B.sections.findIndex(x=>(x.title+x.ar).toLowerCase().includes(m.toLowerCase())); if(i>-1) ix=[i]}
  return {k,ix}}
function bookUnits(it,date){date=date||new Date(); const q=itemSecs(it,date); if(!q||!q.ix.length) return null; const B=BOOKS[q.k], wd=date.getDay(); let units=[], label=''; const ss=q.ix.map(i=>B.sections[i]);
  if(it.id==='d-kubra'){units=unitsOfBlocks(ss[0].blocks,x=>x.startsWith(WD[wd])); label=WD[wd]+"'s portion"}
  else {ss.forEach(s=>units.push(...unitsOfBlocks(s.blocks).map(x=>(x.sec=ss.length>1?s.title:'',x)))); label=ss.map(s=>s.title).join(' + ')}
  return units.length?{units,label,book:B.title}:null}
function stepsFor(it){
  if(it.alt) return [{text:it.title,list:it.steps,note:it.note,count:1,open:it.open}];
  if(it.kind==='occ') return it.steps.map(s=>({text:s,...arPack(s),count:countOf(s)}));
  const bu=bookUnits(it); const pre=(it.steps||[]).map(s=>({text:s,...arPack(s),count:countOf(s)}));
  if(bu) return [...pre.filter(()=>it.id!=='d-mashish'),...bu.units.map(u=>({unit:1,ar:u.ar,tl:u.tl,en:u.en,count:u.count||1,book:u.sec||bu.label})),...(it.id==='d-mashish'?pre.slice(1):[])];
  if(pre.length) return pre;
  if(it.id==='d-quran') return [{text:'Juzʾ '+JUZ()+' of 30',note:it.note,notext:it.notext,juz:JUZ(),count:1}];
  return [{text:it.title,note:it.note,count:countOf(it.when),notext:it.notext,links:it.links}]}
function itemMeta(it){if(it.kind==='lesson') return 'Lesson, then a short quiz (Learn → Kunūz al-Ḥalqa)'; if(it.alt) return 'choose one of '+it.steps.length+' ways'; if(it.id==='d-quran') return 'Juzʾ '+JUZ()+' of 30 next'; if(it.kind==='occ') return it.steps.length+' steps'; if(it.notext) return (countOf(it.when)>1?countOf(it.when)+' times · ':'')+'text not in Kunūz';
  const bu=it.book&&BOOKS?bookUnits(it):null; if(bu) return bu.label+' · '+bu.units.length+' lines'+(it.steps&&it.id!=='d-mashish'?' · '+it.steps.length+' steps first':''); if(it.book) return 'from the awrād books'; if(it.steps) return it.steps.length+' steps'; const n=countOf(it.when); return n>1?n+' times':''}
function findItem(id){return todayItems().find(i=>i.id===id)||(()=>{const it=PRAC&&PRAC.daily.find(i=>i.id===id); return it?{...it,slot:slotOf(id),kind:'wird'}:null})()||(()=>{const o=PRAC&&PRAC.occasions.find(x=>x.id===id); return o?{...o,kind:'occ',slot:'any'}:null})()}

/* ── styles (engine tokens only) ── */
const css=`
.kzw{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:start;padding:10px 0;border-top:1px solid var(--line)}
.kzw input[type=checkbox]{width:22px;height:22px;margin-top:3px;accent-color:var(--ok)}
.kzw .tt{font-weight:600}.kzw.done .tt{color:var(--muted);text-decoration:line-through}
.kzw .wact{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.kzw details summary{cursor:pointer;color:var(--lapis);font-size:.85rem}
.kzw ol{margin:6px 0;padding-inline-start:20px;font-size:.9rem}
@media (max-width:520px){.kzw{grid-template-columns:auto minmax(0,1fr)}.kzw .wact{grid-column:2;justify-content:flex-start}}
.kzslot{margin-top:6px}.kzslot>.kzsh{font-family:var(--f-head);color:var(--muted);font-size:1rem;padding-top:6px}.kzslot.cur>.kzsh{color:var(--gold)}
.kzbar{height:8px;border-radius:4px;background:var(--lapis-soft);overflow:hidden}.kzbar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-hi))}
.kzwk{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.kzwk span.d{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font-family:var(--f-mono);font-size:.7rem;color:var(--muted)}
.kzwk span.part{border-color:var(--gold);color:var(--gold)}.kzwk span.full{background:var(--ok);border-color:var(--ok);color:var(--panel)}.kzwk span.today{box-shadow:0 0 0 2px var(--gold-soft)}
.kznext{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid var(--gold);background:var(--gold-soft);border-radius:10px;padding:10px 12px}
.kzbtn{font:inherit;font-size:.88rem;min-height:40px;padding:7px 14px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:8px;cursor:pointer}
.kzbtn:hover{border-color:var(--gold)}.kzbtn.pri{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}.kzbtn:disabled{opacity:.45;cursor:default}
.kzbtn.on{background:var(--gold-soft);border-color:var(--gold);color:var(--gold)}
.kzrun{position:fixed;inset:0;z-index:40;background:var(--bg);overflow:auto;padding:max(12px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(40px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
.kzrun[hidden]{display:none!important}
.kzrw{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.kzrtop{display:flex;gap:10px;align-items:center}.kzrtop .tt{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kzrbody{background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:var(--glow);padding:22px 18px;display:grid;gap:12px;justify-items:center;text-align:center;position:relative}
.kzrbody::before{content:"";position:absolute;inset:6px;border:1px solid color-mix(in srgb,var(--gold) 35%,transparent);border-radius:10px;pointer-events:none}
.kzrstep{font-family:var(--f-head);font-weight:400;font-size:1.3rem;margin:0;max-width:60ch}
.kzrar{font-family:var(--f-ar);font-size:clamp(1.5rem,5.4vw,2.2rem);line-height:2.05;direction:rtl;text-align:center;unicode-bidi:isolate;max-width:100%;overflow-wrap:anywhere;white-space:pre-line}
.kzrtl{font-style:italic;color:var(--turq);max-width:62ch;margin:0}.kzren{max-width:62ch;margin:0}
.kzbead{font:inherit;width:min(220px,62vw);aspect-ratio:1;border-radius:50%;border:2px solid var(--gold);background:radial-gradient(circle at 35% 30%,var(--gold-soft),var(--panel) 70%);color:var(--ink);cursor:pointer;display:grid;place-items:center;box-shadow:0 0 0 6px color-mix(in srgb,var(--gold) 14%,transparent),var(--glow);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.kzbead:active{transform:scale(.97)}.kzbead .n{font-family:var(--f-mono);font-size:3.2rem;font-variant-numeric:tabular-nums;line-height:1}.kzbead .of{color:var(--muted);font-size:.9rem}
.kzbead.full{background:radial-gradient(circle at 35% 30%,var(--ok-soft),var(--panel) 70%);border-color:var(--ok)}
.kzrctl{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.kznotext{background:var(--saffron-soft);border-radius:10px;padding:10px 14px;max-width:62ch}
.kzseg{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.kzq{font-size:.78rem}
.kztas{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,300px);gap:16px}@media (max-width:760px){.kztas{grid-template-columns:minmax(0,1fr)}}
.kzpre{display:grid;gap:6px}.kzpre button{text-align:left}
.kzcal details{border-top:1px solid var(--line);padding:6px 0}.kzcal summary{cursor:pointer}
.kzans{display:grid;gap:8px;text-align:left}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ── My day: Your wird today (B's drawWird) ── */
function wirdHTML(){
  if(!PRAC) return '<h2>Your wird today <span class="ari" style="color:var(--gold)">الورد</span></h2><p class="empty">Loading the practices…</p>';
  const its=todayItems(), {P}=PT(), cur=slotNow(P), ci=SORD.indexOf(cur), x=DAY.get(); const nd=its.filter(i=>x.done[i.id]).length, nx=nextItem(), sk=streak();
  const h0=kzHijri(new Date());
  const row=it=>{const d=!!x.done[it.id], pos=LS.get('run:'+ymd(new Date())+':'+it.id,null), sl=SORD.indexOf(it.slot), late=!d&&sl>-1&&sl<ci, meta=itemMeta(it);
    return '<div class="kzw'+(d?' done':'')+'"><input type="checkbox" data-kzdone="'+esc(it.id)+'"'+(d?' checked':'')+' aria-label="Mark '+esc(it.title)+' done"><div style="min-width:0"><div class="tt">'+esc(it.title)+'</div><div class="meta">'+esc(it.when||'')+(meta?' · '+esc(meta):'')+(late?' · <span style="color:var(--warn)">still open</span>':'')+(pos&&!d?' · paused at step '+(pos.i+1):'')+'</div>'+
      '<details><summary>What to do</summary>'+(it.steps?'<ol>'+it.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>':'')+(it.note?'<p class="meta">'+esc(it.note)+'</p>':'')+(it.notext?'<p class="meta">'+esc(it.notext)+'</p>':'')+srcs(it.src)+'</details></div>'+
      '<div class="wact"><button class="kzbtn'+(d?'':' pri')+'" data-kzrun="'+esc(it.id)+'">'+(d?'Again':pos?'▶ Resume':'▶ Do it')+'</button></div></div>'};
  const groups=SLOTS.map(([k,n])=>[k,n,its.filter(i=>i.slot===k)]).filter(g=>g[2].length);
  let h='<h2>Your wird today <span class="ari" style="color:var(--gold)">الورد</span></h2><div class="vh"><span class="meta">'+(h0?h0.d+' '+HM[h0.m-1]+' '+h0.y+' (Umm al-Qurā)':'')+'</span><span class="num">'+nd+' / '+its.length+' done'+(sk?' · '+sk+'-day streak':'')+'</span>'+(K.db?'<span class="tag">kept with the engine · merged across your devices</span>':'<span class="tag w">kept in this browser</span>')+'</div>';
  h+='<div class="kzbar" role="progressbar" aria-valuemin="0" aria-valuemax="'+its.length+'" aria-valuenow="'+nd+'" aria-label="Wird done today"><i style="width:'+(its.length?100*nd/its.length:0)+'%"></i></div>';
  h+='<div class="kzwk" aria-label="The last seven days">'+[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5), k=ymd(d), v=K.st.days[k], full=v&&v.of>0&&v.n>=v.of, part=v&&v.n>0; return '<span class="d '+(full?'full':part?'part':'')+(i===6?' today':'')+'" title="'+k+': '+(v&&v.of?v.n+' of '+v.of+' done':'nothing recorded')+'">'+WD[d.getDay()][0]+'</span>'}).join('')+'<span class="meta">last 7 days</span></div>';
  h+=nx?'<div class="kznext"><div style="min-width:0"><div class="meta">Next</div><div style="font-weight:600">'+esc(nx.title)+'</div><div class="meta">'+esc(SLOT_N[nx.slot]||'')+'</div></div><button class="kzbtn pri" data-kzrun="'+esc(nx.id)+'">▶ Start</button></div>':'<p><b>All done for today.</b> <span class="meta">Al-ḥamdu li-llāh. Optional practices are a tap away.</span></p>';
  h+=groups.map(([k,n,g])=>'<div class="kzslot'+(k===cur?' cur':'')+'"><div class="kzsh">'+esc(n)+(k===cur?' <span class="chip ih">now</span>':'')+'</div>'+g.map(row).join('')+'</div>').join('');
  h+='<div class="tools"><button class="kzbtn" id="kzEdit">Edit my wird</button><button class="kzbtn" id="kzOpt">Optional practices</button><button class="kzbtn" id="kzAmal">Practices &amp; the sacred year</button><button class="kzbtn" id="kzTas">Tasbīḥ</button></div><div id="kzEd"></div>';
  h+='<p class="meta">Slots follow the prayer times for '+esc(TD.loc[0])+' ('+esc(TD.method)+'), set above. From Kunūz al-Dhikr; the Arabic is shown, never voiced by a machine.</p>';
  return h}
function drawWird(){const box=document.getElementById('kzWird'); if(!box) return; if(box.contains(document.activeElement)&&document.activeElement.tagName==='SELECT') return; const ed=document.getElementById('kzEd'), edWas=ed&&ed.dataset.open;
  box.innerHTML=wirdHTML(); wireWird(box); if(edWas) drawEdit(edWas==='opt')}
function wireWird(box){
  box.querySelectorAll('[data-kzrun]').forEach(b=>b.onclick=()=>runPractice(b.dataset.kzrun));
  box.querySelectorAll('[data-kzdone]').forEach(c=>c.onchange=()=>{DAY.set(c.dataset.kzdone,c.checked); drawWird()});
  const on=(id,f)=>{const x=document.getElementById(id); if(x) x.onclick=f};
  on('kzEdit',()=>drawEdit(false)); on('kzOpt',()=>drawEdit(true)); on('kzAmal',()=>go('amal')); on('kzTas',()=>go('tasbih'))}
function drawEdit(optOnly){const box=document.getElementById('kzEd'); if(!box||!PRAC) return; const key=optOnly?'opt':'edit'; if(box.dataset.open===key&&box.innerHTML&&!drawEdit._re){box.innerHTML=''; box.dataset.open=''; return} drawEdit._re=false; box.dataset.open=key; const p=PLAN();
  const all=PRAC.daily.filter(i=>!optOnly||!p.ids.includes(i.id));
  box.innerHTML='<h3 class="akh">'+(optOnly?'Optional practices':'Edit my wird')+'</h3><p class="meta">'+(optOnly?'Do any of these today without adding them to your wird.':'Tick what you keep daily and choose when. Keep what your shaykh has given you; it is better to keep a little steadily.')+'</p>'+
   (all.map(i=>'<div class="kzw">'+(optOnly?'<span></span>':'<input type="checkbox" data-kzpl="'+i.id+'"'+(p.ids.includes(i.id)?' checked':'')+' aria-label="Keep '+esc(i.title)+'">')+'<div style="min-width:0"><div class="tt">'+esc(i.title)+'</div><div class="meta">'+esc(i.tariqa||'')+' · '+esc(i.when||'')+'</div></div><div class="wact">'+(optOnly?'<button class="kzbtn" data-kzorun="'+i.id+'">▶ Do it</button>':'<select data-kzsl="'+i.id+'" aria-label="When">'+SLOTS.map(([k,n])=>'<option value="'+k+'"'+(slotOf(i.id,p)===k?' selected':'')+'>'+n+'</option>').join('')+'</select>')+'</div></div>').join('')||'<p class="meta">Everything is already in your wird.</p>')+
   (optOnly?'':'<label class="kzw" style="grid-template-columns:auto minmax(0,1fr)"><input type="checkbox" id="kzPlLes"'+(p.lesson?' checked':'')+'><span>Include the day\'s al-Ḥalqa lesson (Kunūz al-Ḥalqa, in Learn)</span></label>')+'<div class="tools"><button class="kzbtn pri" id="kzEdClose">Done</button></div>';
  box.onchange=e=>{const p=PLAN(); const c=e.target.closest('[data-kzpl]'); if(c) p.ids=c.checked?[...new Set([...p.ids,c.dataset.kzpl])]:p.ids.filter(x=>x!==c.dataset.kzpl);
    const s=e.target.closest('[data-kzsl]'); if(s) p.slots[s.dataset.kzsl]=s.value; if(e.target.id==='kzPlLes') p.lesson=e.target.checked; savePlan(p); const x=DAY.get(), its=todayItems(); x.of=its.length; x.n=its.filter(i=>x.done[i.id]).length; K.save(); drawEdit._re=true; drawWird()};
  box.onclick=e=>{const r=e.target.closest('[data-kzorun]'); if(r) runPractice(r.dataset.kzorun); if(e.target.id==='kzEdClose'){box.innerHTML=''; box.dataset.open=''}}}

/* ── the practice runner (B: runPractice, drawRun, runInc, finishRun) ── */
const R={it:null,steps:[],i:0,n:0,tok:0,wl:null,ask:[],askOpen:false};
function runEl(){let el=document.getElementById('kzRun'); if(!el){el=document.createElement('div'); el.id='kzRun'; el.className='kzrun'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-label','Practice'); el.hidden=true; document.body.appendChild(el)} return el}
async function runPractice(id){await loadPrac().catch(()=>{}); const it=findItem(id); if(!it) return false;
  if(it.kind==='lesson'){if(window.kzhOpen) window.kzhOpen(it.lesson); return true}
  const el=runEl(); el.hidden=false; document.body.style.overflow='hidden';
  if(it.book&&!BOOKS){const tk=++R.tok; el.innerHTML='<div class="kzrw"><div class="kzrtop"><button class="kzbtn" id="kzX" aria-label="Close">✕</button><div class="tt" style="flex:1;min-width:0">'+esc(it.title)+'</div></div><p class="empty" id="kzLoad">Opening the text…</p></div>'; document.getElementById('kzX').onclick=closeRun;
    try{await loadBooks()}catch(e){if(tk===R.tok&&document.getElementById('kzLoad')){document.getElementById('kzLoad').innerHTML='The text could not load. <button class="kzbtn" id="kzRetry">Try again</button>'; document.getElementById('kzRetry').onclick=()=>runPractice(id)} return true} if(tk!==R.tok||el.hidden) return true}
  R.it=it; R.steps=stepsFor(it); R.ask=[]; const pos=LS.get('run:'+ymd(new Date())+':'+id,null); R.i=pos&&!tdone(id)?Math.min(pos.i,R.steps.length-1):0; R.n=pos&&!tdone(id)?pos.n||0:0;
  try{if(navigator.wakeLock) navigator.wakeLock.request('screen').then(w=>{R.wl=w}).catch(()=>{})}catch(e){}
  drawRun(); return true}
function closeRun(){R.tok++; try{R.wl&&R.wl.release().catch(()=>{}); R.wl=null}catch(e){} try{if(tts&&tts.stop) tts.stop()}catch(e){} const el=document.getElementById('kzRun'); if(el){el.hidden=true; el.innerHTML=''} document.body.style.overflow=''; drawWird()}
function saveRun(){if(R.it) LS.set('run:'+ymd(new Date())+':'+R.it.id,{i:R.i,n:R.n})}
function drawRun(){const el=runEl(), it=R.it, S=R.steps, s=S[R.i], last=R.i>=S.length-1;
  const pct=Math.round(100*(R.i+(s.count>1?Math.min(1,R.n/s.count):0))/S.length);
  let h='<div class="kzrw"><div class="kzrtop"><button class="kzbtn" id="kzX" aria-label="Close and keep my place">✕</button><div style="min-width:0;flex:1"><div class="meta">'+esc(it.kind==='occ'?'Occasion':SLOT_N[it.slot]||'')+'</div><div class="tt">'+esc(it.title)+'</div></div><span class="num">'+(R.i+1)+' / '+S.length+'</span></div>';
  h+='<div class="kzbar"><i style="width:'+pct+'%"></i></div><div class="kzrbody">';
  if(!s.unit) h+='<h2 class="kzrstep">'+esc(s.text||'')+'</h2>'; else if(s.book) h+='<div class="meta">'+esc(s.book)+'</div>';
  if(s.ar) h+='<div class="kzrar" lang="ar" dir="rtl">'+esc(s.ar)+'</div>';
  if(s.tl) h+='<p class="kzrtl">'+esc(s.tl)+'</p>';
  if(s.en) h+='<p class="kzren">'+esc(s.en)+'</p>';
  if(s.q&&s.q.length) h+='<div class="chips kzq">'+s.q.map(k=>'<span class="chip">Q '+esc(k)+' · the muṣḥaf\'s text</span>').join('')+'</div>';
  if(s.abj) h+='<div class="chips kzq"><span class="chip ih">abjad of these words '+s.abj+'</span></div>';
  if(s.list) h+='<p class="meta" style="margin:0">Choose the way that fits today:</p><ol style="text-align:left;max-width:60ch;margin:0">'+s.list.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';
  if(s.note) h+='<p class="meta" style="max-width:62ch">'+esc(s.note)+'</p>';
  if(s.unit&&it.book&&window.kzOpenAwrad) h+='<p style="margin:0"><button class="kzbtn" id="kzOpenTxt">Read the whole text in the awrād reader →</button></p>';
  if(s.open) h+='<p class="meta">The full text of this ḥizb is one of Kunūz\'s page-image books; it opens here when the Maktaba is brought in (next).</p>';
  if(s.notext) h+='<div class="kznotext"><div class="meta">'+(s.juz?'From the muṣḥaf':'Text not carried in Kunūz')+'</div><p style="margin:4px 0">'+esc(s.notext)+'</p>'+(s.juz?'<label class="meta">Juzʾ <select id="kzJuz">'+[...Array(30)].map((_,j)=>'<option'+(j+1===s.juz?' selected':'')+'>'+(j+1)+'</option>').join('')+'</select></label>':'')+(s.links&&s.links.length?'<div class="kzseg">'+s.links.map(l=>'<a class="kzbtn" href="'+esc(l.u)+'" target="_blank" rel="noopener">'+esc(l.t)+' ↗</a>').join('')+'</div>':'')+'</div>';
  if(!s.ar&&!s.unit&&it.src&&it.src.length) h+=srcs(it.src);
  if(!s.ar&&!s.unit&&s.count<=1) h+='<p class="meta">Do this step, then tap Next. Unsure how? Ask below.</p>';
  if(s.count>1) h+='<button class="kzbead'+(R.n>=s.count?' full':'')+'" id="kzBead" aria-label="Count one"><div><div class="n">'+R.n+'</div><div class="of">of '+s.count+(R.n>=s.count?' · complete':'')+'</div></div></button><p class="meta" style="margin:0">Tap the bead or press Space for each one.</p><div class="kzseg"><button class="kzbtn" id="kzMinus"'+(R.n?'':' disabled')+'>−1</button><button class="kzbtn" id="kzZero"'+(R.n?'':' disabled')+'>Reset count</button></div>';
  h+='</div><div class="kzrctl"><button class="kzbtn" id="kzPrev"'+(R.i?'':' disabled')+'>← Back</button>'+(tts&&(s.en||(!s.unit&&s.text))?'<button class="kzbtn" id="kzEng">▶ English only</button>':'')+'<button class="kzbtn pri" id="kzNext">'+(last?'✓ Finish':'Next →')+'</button></div>';
  h+='<details class="box" id="kzAskD"'+(R.askOpen?' open':'')+'><summary style="cursor:pointer;color:var(--lapis)">Ask the teacher about this step</summary><div class="kzans" id="kzAns">'+R.ask.map(m=>'<div class="msg '+m.role+'">'+(m.role==='user'?esc(m.content):mdLite(m.content))+'</div>').join('')+'</div><textarea id="kzQ" rows="2" placeholder="e.g. How do I do the rābiṭa? What does this line mean?" aria-label="Question about this step"></textarea><div class="tools"><button class="kzbtn pri" id="kzAsk">Ask</button><span class="meta" id="kzAskSt"></span></div></details></div>';
  el.innerHTML=h;
  const $i=id=>document.getElementById(id);
  $i('kzX').onclick=()=>{saveRun(); closeRun()};
  $i('kzPrev').onclick=()=>{R.tok++; R.i--; R.n=0; saveRun(); drawRun()};
  $i('kzNext').onclick=()=>{R.tok++; if(last){finishRun(); return} R.i++; R.n=0; saveRun(); drawRun(); el.scrollTop=0};
  if($i('kzBead')) $i('kzBead').onclick=()=>runInc();
  if($i('kzOpenTxt')) $i('kzOpenTxt').onclick=()=>{const q=itemSecs(it); saveRun(); closeRun(); if(q&&q.ix.length) window.kzOpenAwrad(q.k,q.ix[0])};
  if($i('kzMinus')){$i('kzMinus').onclick=()=>{R.tok++; R.n=Math.max(0,R.n-1); saveRun(); drawRun()}; $i('kzZero').onclick=()=>{R.tok++; R.n=0; saveRun(); drawRun()}}
  if($i('kzJuz')) $i('kzJuz').onchange=e=>{K.st.juz={n:+e.target.value,t:Date.now()}; K.save(); R.steps=stepsFor(R.it); drawRun()};
  if($i('kzEng')) $i('kzEng').onclick=()=>{const t=englishOnly([!s.unit?s.text:'',s.en||''].filter(Boolean).join('. ')); if(t) tts.speak(t.slice(0,2000)).catch(()=>{})};
  $i('kzAskD').ontoggle=e=>{R.askOpen=e.target.open};
  $i('kzAsk').onclick=()=>askStep(s);
  ($i('kzBead')||$i('kzNext')).focus({preventScroll:true})}
function runInc(){const s=R.steps[R.i]; if(!s||s.count<=1||R.n>=s.count) return; R.n=Math.min(s.count,R.n+1); saveRun();
  const b=document.getElementById('kzBead'); if(b){b.querySelector('.n').textContent=R.n; b.querySelector('.of').textContent='of '+s.count+(R.n>=s.count?' · complete':''); b.classList.toggle('full',R.n>=s.count)}
  ['kzMinus','kzZero'].forEach(id=>{const x=document.getElementById(id); if(x) x.disabled=false});
  const pi=document.querySelector('#kzRun .kzbar i'); if(pi) pi.style.width=Math.round(100*(R.i+Math.min(1,R.n/s.count))/R.steps.length)+'%';
  try{navigator.vibrate&&navigator.vibrate(R.n>=s.count?[60,40,60]:8)}catch(e){}
  if(R.n>=s.count){const tk=++R.tok; setTimeout(()=>{const el=document.getElementById('kzRun'); if(tk!==R.tok||!el||el.hidden) return; if(R.i>=R.steps.length-1) return; R.i++; R.n=0; saveRun(); drawRun()},900)}}
function finishRun(){const it=R.it; if(it.id==='d-quran') K.st.juz={n:JUZ()%30+1,t:Date.now()}; DAY.set(it.id,true); LS.set('run:'+ymd(new Date())+':'+it.id,null); const nx=nextItem();
  runEl().innerHTML='<div class="kzrw"><div class="kzrbody"><div class="meta">Complete</div><h2 class="kzrstep">'+esc(it.title)+'</h2><p class="meta">Marked done. May Allāh accept it.</p>'+(nx?'<p>Next: <b>'+esc(nx.title)+'</b> <span class="meta">'+esc(SLOT_N[nx.slot]||'')+'</span></p><div class="kzseg"><button class="kzbtn pri" id="kzGo">▶ Start it</button><button class="kzbtn" id="kzDone">Back to my day</button></div>':'<p><b>Your wird is complete for today.</b></p><div class="kzseg"><button class="kzbtn pri" id="kzDone">Back to my day</button></div>')+'</div></div>';
  document.getElementById('kzDone').onclick=closeRun; const g=document.getElementById('kzGo'); if(g) g.onclick=()=>runPractice(nx.id)}
document.addEventListener('keydown',e=>{const el=document.getElementById('kzRun'); if(el&&!el.hidden){
    if(e.code==='Space'&&!/TEXTAREA|INPUT|SELECT|BUTTON|SUMMARY/.test(e.target.tagName)){e.preventDefault(); runInc(); return}
    if(e.key==='Escape'&&e.target.tagName!=='TEXTAREA'){e.preventDefault(); saveRun(); closeRun(); return}
    if(!/TEXTAREA|INPUT|SELECT/.test(e.target.tagName)){if(e.key==='ArrowRight'){const b=document.getElementById('kzNext'); if(b) b.click()} if(e.key==='ArrowLeft'){const b=document.getElementById('kzPrev'); if(b&&!b.disabled) b.click()}}
    return}
  if(tab==='tasbih'&&e.code==='Space'&&!/TEXTAREA|INPUT|SELECT|BUTTON/.test(e.target.tagName)){e.preventDefault(); tasInc()}});
async function askStep(s){const ta=document.getElementById('kzQ'), q=ta?ta.value.trim():''; if(!q) return; const stEl=document.getElementById('kzAskSt');
  const sample=await cuse('sample'); if(!sample){if(stEl) stEl.textContent='Asking Claude isn’t available in this view.'; return}
  R.askOpen=true; R.ask.push({role:'user',content:q}); R.ask.push({role:'assistant',content:''}); const tk=R.tok; drawRun();
  const ctx='Al is doing "'+R.it.title+'" now (Kunūz al-Dhikr practice'+(R.it.tariqa?', '+R.it.tariqa:'')+'), step '+(R.i+1)+' of '+R.steps.length+': '+[s.text,s.tl,s.en].filter(Boolean).join(' — ').slice(0,1400)+(R.it.note?' Note in the source: '+R.it.note:'')+(R.it.src?' Source posts: '+R.it.src.join(', '):'');
  const input=[{role:'user',content:RULES+'\nYou are answering beside the practice runner, briefly (under 180 words), as a teacher sitting with him. '+ctx+'\nHis question follows. Search Kunūz (search_kunuz) before answering anything about the text or its adab; cite what you used.'},...R.ask.slice(0,-1).slice(-6)];
  try{const r=await sample(input,{tools:AITOOLS,modelTier:'default',onText:({text})=>{R.ask[R.ask.length-1].content=text; const a=document.querySelector('#kzAns .msg:last-child'); if(a&&tk===R.tok) a.innerHTML=mdLite(text)}}); R.ask[R.ask.length-1].content=r.text}
  catch(e){R.ask[R.ask.length-1].content=(e&&e.text?e.text+'\n\n(interrupted)':(AIERR[e&&e.code]||'Something went wrong — try again.'))}
  const el=document.getElementById('kzRun'); if(el&&!el.hidden&&R.it) drawRun()}

/* ── Practices & the sacred year (B: amal) ── */
function renderAmal(){const v=document.getElementById('view'); v.innerHTML='<section class="box"><p class="empty">Loading the practices…</p></section>';
  loadPrac().then(P=>{if(tab!=='amal') return; const h0=kzHijri(new Date()); const byM={}; P.occasions.forEach(o=>{const k=o.month||0; (byM[k]=byM[k]||[]).push(o)}); const order=[...Array(12)].map((_,i)=>((h0?h0.m-1:0)+i)%12+1);
    const up=upcoming(90).slice(0,6);
    let h='<section class="box"><div class="tools"><button class="kzbtn" data-kzgo="day">‹ My day</button><button class="kzbtn" data-kzgo="tasbih">Tasbīḥ</button></div><h2>Practices &amp; the sacred year <span class="ari" style="color:var(--gold)">الأعمال</span></h2><p class="meta">Dissected from the DhikrNotes channel in Kunūz al-Dhikr: the daily awrād, the teachings, and every practice of the Hijrī year (Umm al-Qurā; local sighting may differ by a day). Each one runs step by step with its count.</p>'+
      '<h3 class="akh">Coming up</h3>'+(up.length?up.map(({o,d,i})=>'<div class="kzw" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="meta">'+d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})+' · in '+i+' day'+(i>1?'s':'')+'</div><div class="tt">'+esc(o.title)+'</div></div><div class="wact"><button class="kzbtn" data-kzrun="'+esc(o.id)+'">▶ Step by step</button></div></div>').join(''):'<p class="meta">Nothing in the next three months.</p>')+'</section>';
    h+='<div class="akcols"><section class="box" style="align-content:start"><h2>The daily awrād</h2>'+P.daily.map(i=>'<div class="op" id="kzp-'+esc(i.id)+'"><div class="chips"><span class="chip">'+esc(i.tariqa||'')+'</span><span class="chip ih">'+esc(i.when||'')+'</span></div><div class="t">'+esc(i.title)+'</div>'+(i.steps?'<ol style="margin:0;padding-inline-start:20px;font-size:.9rem">'+i.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>':'')+(i.note?'<p class="meta" style="margin:0">'+esc(i.note)+'</p>':'')+(i.notext?'<p class="meta" style="margin:0">'+esc(i.notext)+'</p>':'')+'<div class="btns"><button class="kzbtn pri" data-kzrun="'+esc(i.id)+'">▶ Do it now</button>'+(i.book?'<button class="kzbtn" data-kzopen="'+esc(i.book[0])+'|'+esc(i.book[1])+'">Open the text →</button>':'')+'</div>'+srcs(i.src)+'</div>').join('')+
      '<h2 style="margin-top:10px">Teachings</h2>'+P.teachings.map(t=>'<div class="op"><div class="t">'+esc(t.t)+'</div><p style="margin:0">'+esc(t.x)+'</p>'+srcs(t.src)+'</div>').join('')+'</section>';
    h+='<section class="box kzcal" style="align-content:start"><h2>Through the Hijrī year</h2><p class="meta">Starting from the current month'+(h0?', '+HM[h0.m-1]:'')+'.</p>'+order.filter(m=>byM[m]).map(m=>'<h3 class="akh">'+HM[m-1]+'</h3>'+byM[m].map(o=>'<details id="kzp-'+esc(o.id)+'"><summary><b>'+esc(o.title)+'</b> <span class="meta">'+(o.day?'· '+esc(o.day):'· whole month')+'</span></summary><ol style="padding-inline-start:20px;font-size:.9rem">'+o.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'+(o.note?'<p class="meta">'+esc(o.note)+'</p>':'')+'<button class="kzbtn" data-kzrun="'+esc(o.id)+'">▶ Do it step by step</button>'+srcs(o.src)+'</details>').join('')).join('')+
      ((byM[0]||[]).length?'<h3 class="akh">Fixed anniversaries (Gregorian)</h3>'+byM[0].map(o=>'<details id="kzp-'+esc(o.id)+'"><summary><b>'+esc(o.title)+'</b></summary><ol style="padding-inline-start:20px;font-size:.9rem">'+o.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><button class="kzbtn" data-kzrun="'+esc(o.id)+'">▶ Do it step by step</button>'+srcs(o.src)+'</details>').join(''):'')+'</section></div>';
    v.innerHTML=h; wireGo(v); v.querySelectorAll('[data-kzrun]').forEach(b=>b.onclick=()=>runPractice(b.dataset.kzrun)); v.querySelectorAll('[data-kzopen]').forEach(b=>b.onclick=()=>{const [k,m]=b.dataset.kzopen.split('|'); const it=P.daily.find(x=>x.book&&x.book[0]===k&&x.book[1]===m); loadBooks().then(()=>{const q=it?itemSecs(it):null; if(window.kzOpenAwrad) window.kzOpenAwrad(k,q&&q.ix.length?q.ix[0]:0)}).catch(()=>{})})}).catch(()=>{v.innerHTML='<section class="box"><p class="empty">The practices did not load. Reload the page to try again.</p></section>'})}

/* ── Tasbīḥ (B: tasbih + TAS; A+B: a Name at its abjad, a custom target, today's count) ── */
const PRE=[['lā ilāha illā-llāh','لَا إِلٰهَ إِلَّا اللّٰه',100,'There is no god but Allāh.'],['Allāh','اللّٰه',100,'Allāh.'],['Hū','هُو',33,'He.'],['Ḥaqq','حَقّ',33,'The Real.'],['Ḥayy','حَيّ',33,'The Ever-Living.'],['Astaghfiru-llāh','أَسْتَغْفِرُ اللّٰه',100,'I ask Allāh’s forgiveness.'],['Astaghfiru-llāh (Ṣafar)','أَسْتَغْفِرُ اللّٰه',300,'I ask Allāh’s forgiveness.'],['Ṣalawāt','اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّد',100,'O Allāh, send blessings upon Muḥammad.'],['Ḥasbunā-llāhu wa niʿma-l-wakīl','حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيْل',450,'Allāh is enough for us, and how excellent a Guardian He is.'],['Yā Laṭīf','يَا لَطِيْف',129,'O Subtle, Gentle One.'],['Ḥizb al-Wiqāya (for weighty matters)','حِزْبُ الْوِقَايَة',41,'The litany of protection.'],['Dua al-Ḥifẓ','دُعَاءُ الْحِفْظ',7,'The prayer of safekeeping.']];
const TAS={tot(){const s=K.st, sum=m=>Object.values(m||{}).reduce((a,b)=>a+(+b||0),0); return (+s.tasL||0)+sum(s.tasP)-sum(s.tasN)},
  today(){const t=(K.st.tday||{})[ymd(new Date())]||{}; return Object.values(t).reduce((a,b)=>a+(+b||0),0)},
  add(d){const s=K.st, k=d>0?'tasP':'tasN'; s[k]=s[k]||{}; s[k][DEV]=(s[k][DEV]||0)+Math.abs(d); const dk=ymd(new Date()); s.tday=s.tday||{}; s.tday[dk]=s.tday[dk]||{}; s.tday[dk][DEV]=Math.max(0,(s.tday[dk][DEV]||0)+d)}};
const tasS=()=>{const s=K.st.tas||(K.st.tas={p:0,n:0}); return s};
function tasCur(){const s=tasS(); if(typeof s.p==='string'&&s.p.startsWith('nm:')){const x=M6.names[s.p.slice(3)]; if(x) return [x[0]+' (its abjad)',x[1],x[2],'Counted at its abjad value, '+x[2]+' (Mashriqī, without the article).']} return PRE[+s.p]||PRE[0]}
const tasTgt=()=>{const s=tasS(); return (s.t&&+s.t[s.p])||tasCur()[2]};
function tasDraw(){const p=tasCur(), s=tasS(), $i=id=>document.getElementById(id); if(!$i('kzTn')) return;
  $i('kzTar').textContent=p[1]; $i('kzTtl').textContent=p[0]; $i('kzTen').textContent=p[3]||''; $i('kzTn').textContent=s.n; $i('kzTof').textContent='of '+tasTgt()+(s.n>=tasTgt()?' · complete':''); $i('kzTbead').classList.toggle('full',s.n>=tasTgt());
  $i('kzTtot').textContent=TAS.tot(); $i('kzTday').textContent=TAS.today(); if(document.activeElement!==$i('kzTtgt')) $i('kzTtgt').value=tasTgt(); $i('kzTst').textContent=K.db?'Kept with the engine and merged across your devices (your Kunūz tally came with it).':'Kept in this browser.'}
function tasInc(){const s=tasS(); s.n++; TAS.add(1); s.ts=Date.now(); try{navigator.vibrate&&navigator.vibrate(s.n===tasTgt()?[60,40,60]:8)}catch(e){} K.save(); tasDraw()}
function renderTasbih(){const v=document.getElementById('view'); const s=tasS();
  const nmOpts='<option value="">a Name of Allah at its abjad…</option>'+Object.entries(M6.names).map(([k,x])=>'<option value="'+k+'"'+(s.p==='nm:'+k?' selected':'')+'>'+esc(x[0])+' · '+x[2]+'</option>').join('');
  v.innerHTML='<section class="box"><div class="tools"><button class="kzbtn" data-kzgo="day">‹ My day</button><button class="kzbtn" data-kzgo="amal">Practices &amp; the sacred year</button></div><h2>Tasbīḥ <span class="ari" style="color:var(--gold)">التسبيح</span></h2></section>'+
   '<div class="kztas"><section class="box" style="justify-items:center;text-align:center"><div class="kzrar" lang="ar" dir="rtl" id="kzTar"></div><p class="kzrtl" id="kzTtl"></p><p class="kzren meta" id="kzTen"></p><button class="kzbead" id="kzTbead" aria-label="Count one"><div><div class="n" id="kzTn">0</div><div class="of" id="kzTof"></div></div></button>'+
   '<div class="kzseg"><button class="kzbtn" id="kzTundo">−1</button><button class="kzbtn" id="kzTreset">Reset</button><label class="meta">target <input id="kzTtgt" type="number" min="1" max="100000" inputmode="numeric" style="width:96px;font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink)" aria-label="Target count"></label></div>'+
   '<p class="meta">Tap the bead or press Space. Today <b id="kzTday">0</b> · lifetime <b id="kzTtot">0</b>. <span id="kzTst"></span></p></section>'+
   '<section class="box" style="align-content:start"><h3 class="akh" style="margin:0">Counts from the channel</h3><div class="kzpre">'+PRE.map((x,i)=>'<button class="kzbtn'+(String(s.p)===String(i)?' on':'')+'" data-kzp="'+i+'">'+esc(x[0])+' <span class="num">×'+x[2]+'</span></button>').join('')+'</div><label class="meta" for="kzTnm">Or count a Name at its abjad</label><select id="kzTnm">'+nmOpts+'</select><p class="meta">Ramaḍān wird after Witr #114 · Ṣafar #925 · Wiqāya #712 · Ḥifẓ #154 · Ḥasbunā (value 450) from al-Sirr al-Jalīl.</p></section></div>';
  wireGo(v);
  const $i=id=>document.getElementById(id);
  $i('kzTbead').onclick=tasInc;
  $i('kzTundo').onclick=()=>{const s=tasS(); if(s.n>0){s.n--; TAS.add(-1); s.ts=Date.now(); K.save(); tasDraw()}};
  $i('kzTreset').onclick=()=>{const s=tasS(); s.n=0; s.ts=Date.now(); K.save(); tasDraw()};
  $i('kzTtgt').onchange=e=>{const s=tasS(), val=Math.round(+e.target.value); s.t=s.t||{}; if(val>=1&&val<=100000) s.t[s.p]=val; else delete s.t[s.p]; s.ts=Date.now(); K.save(); tasDraw()};
  v.querySelectorAll('[data-kzp]').forEach(b=>b.onclick=()=>{const s=tasS(); s.p=+b.dataset.kzp; s.n=0; s.ts=Date.now(); K.save(); renderTasbih()});
  $i('kzTnm').onchange=e=>{if(!e.target.value) return; const s=tasS(); s.p='nm:'+e.target.value; s.n=0; s.ts=Date.now(); K.save(); renderTasbih()};
  tasDraw()}

/* ── wiring into the engine ── */
function go(t){tab=t; render(); window.scrollTo(0,0)}
function wireGo(v){v.querySelectorAll('[data-kzgo]').forEach(b=>b.onclick=()=>go(b.dataset.kzgo))}
function redraw(){try{if(tab==='day') drawWird(); else if(tab==='tasbih') tasDraw()}catch(e){}}
const rT=window.renderToday||renderToday;
const renderTodayKz=function(){const r=rT.apply(this,arguments); const v=document.getElementById('view'); if(v&&!document.getElementById('kzWird')){const box=document.createElement('section'); box.className='box'; box.id='kzWird'; const first=v.querySelector('section'); if(first&&first.nextSibling) v.insertBefore(box,first.nextSibling); else v.appendChild(box); drawWird(); if(!PRAC) loadPrac().then(()=>drawWird()).catch(()=>{}); const its=PRAC?todayItems():[]; if(PRAC&&its.some(i=>i.book)&&!BOOKS) loadBooks().then(()=>drawWird()).catch(()=>{})} return r};
renderToday=renderTodayKz; window.renderToday=renderTodayKz;
const r0=window.render;
render=function(){if(tab==='amal'||tab==='tasbih'){document.querySelectorAll('nav [role=tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab==='day')); tab==='amal'?renderAmal():renderTasbih(); if(window.hqMini) hqMini(); return} return r0.apply(this,arguments)};
window.render=render;
/* the slots move with the hours: redraw the wird every minute on My day */
setInterval(()=>{if(tab==='day'&&document.getElementById('kzWird')&&!document.getElementById('kzWird').contains(document.activeElement)&&!document.querySelector('#kzWird details[open]')) drawWird()},60000);

/* ── Ask: the wird, the practices and the runner ── */
if(typeof AITOOLS!=='undefined') AITOOLS.push(
 {name:'kunuz_today',description:"Al's Kunūz wird today: his standing wird items with their time slots and done status, today's sacred occasions (Umm al-Qurā), the next item, streak, tasbīḥ today/lifetime, and the optional practices.",inputSchema:{type:'object',properties:{}},
  execute:async()=>{await loadPrac(); const x=DAY.get(), its=todayItems(), {P,name}=PT(); return {place:name,current_slot:SLOT_N[slotNow(P)],hijri:(h=>h?h.d+' '+HM[h.m-1]+' '+h.y:'')(kzHijri(new Date())),wird:its.map(i=>({id:i.id,title:i.title,when:SLOT_N[i.slot],done:!!x.done[i.id],kind:i.kind,steps:i.steps})),next:(nextItem()||{}).id||null,streak_days:streak(),tasbih:{today:TAS.today(),lifetime:TAS.tot()},optional:PRAC.daily.filter(i=>!PLAN().ids.includes(i.id)).map(i=>({id:i.id,title:i.title,when:i.when}))}}},
 {name:'start_practice',description:'Open the guided step-by-step practice runner for a Kunūz practice or occasion id (from kunuz_today or search_kunuz scope practices). Use when Al says he wants to do it now.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id']},
  execute:async({id})=>{await loadPrac(); if(!findItem(id)) throw new Error('no such practice'); setTimeout(()=>runPractice(id),300); return {opened:id}}},
 {name:'mark_practice_done',description:"Mark an item of today's Kunūz wird done (or not done). Only when Al says so.",inputSchema:{type:'object',properties:{id:{type:'string'},done:{type:'boolean'}},required:['id']},
  execute:async({id,done=true})=>{await loadPrac(); DAY.set(id,!!done); return {id,done:!!done}}});

window.kzDaySet=(id,v)=>DAY.set(id,v); window.kzRunPractice=runPractice; window.kzState=()=>K.st; window.kzSteps=id=>{const it=findItem(id); return it?stepsFor(it):null}; window.kzReady=()=>Promise.all([loadPrac(),loadBooks()]);
try{cuse('tts').then(t=>{if(t&&!tts) tts=t}).catch(()=>{})}catch(e){}
K.init(); loadPrac().then(()=>{if(tab==='day') drawWird()}).catch(()=>{});
if(tab==='day'&&!document.getElementById('kzWird')) renderToday();
})();
