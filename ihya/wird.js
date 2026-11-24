/* ===== The Iḥyāʾ's Wird and the Ninety-nine — port 7, part 1 (2026-11-22), from the Iḥyāʾ Engine's kit/tools/wird.jsx (v3.7).
   Learn → Wird & the Ninety-nine: Count with him (the adhkār, any of the Ninety-nine at its abjad, your own dhikr; rounds,
   back one, reset, Space/Enter/+, a buzz at every 33 and at the round's end, the breath guide, one count with each slow
   breath, count by voice, written into the journal, today's totals), The Ninety-nine (flash cards on spaced review, N new a
   day, the meaning first now and then, its pages, its square), Say it (you say the Name, the listening checks every letter),
   My path (the book, study minutes, retention, streak, dhikr counted, the Names, 14-day bars, chapter by chapter, the
   teacher's weekly letter — by itself on Fridays) and the day's check-in that shapes the Study (DarsCheckin).
   Record: study/wird in this page's database (copied from the Iḥyāʾ Engine's study/wird on 2026-11-22), and this browser.
   Al's decision 1: no machine voice ever says the Arabic — A's "Hear it" / "Hear him say it" are not ported; the Names are
   shown vowelled with their transliteration, and the English letter may be read aloud. ===== */
(function(){
'use strict';
const LSg=(k,d)=>{try{const v=localStorage.getItem(k); return v==null?d:JSON.parse(v)}catch(e){return d}};
const LSs=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const API=()=>window.HQAPI||null;
const ymd=d=>{const x=new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const WD_PATH='study/wird';
const FRESH=()=>({totals:{},cards:{},newDay:{},checkins:{},pron:{},letters:{},sessions:[]});
let W=null, WP=null, saveT=null;

/* two copies joined: the larger count of a day's dhikr, the card with more reviews, every letter and check-in once */
function wdMerge(a,b){a=Object.assign(FRESH(),a||{}); b=Object.assign(FRESH(),b||{}); const o=FRESH();
  const days=new Set([...Object.keys(a.totals),...Object.keys(b.totals)]); for(const d of days){const x=a.totals[d]||{},y=b.totals[d]||{},z={}; for(const k of new Set([...Object.keys(x),...Object.keys(y)])) z[k]=Math.max(x[k]||0,y[k]||0); o.totals[d]=z}
  const rv=c=>Array.isArray(c)?(c[3]||0)+(c[4]||0):-1; o.cards=Object.assign({},a.cards); for(const [k,c] of Object.entries(b.cards)){const p=o.cards[k]; o.cards[k]=!p||rv(c)>rv(p)||(rv(c)===rv(p)&&String(c[0])>String(p[0]))?c:p}
  for(const d of new Set([...Object.keys(a.newDay),...Object.keys(b.newDay)])) o.newDay[d]=Math.max(a.newDay[d]||0,b.newDay[d]||0);
  for(const k of new Set([...Object.keys(a.pron),...Object.keys(b.pron)])) o.pron[k]=Math.max(a.pron[k]||0,b.pron[k]||0);
  o.checkins=Object.assign({},a.checkins,b.checkins); o.letters=Object.assign({},a.letters); for(const [k,l] of Object.entries(b.letters)){const p=o.letters[k]; o.letters[k]=!p||(l.at||0)>(p.at||0)?l:p}
  o.sessions=[...(a.sessions||[]),...(b.sessions||[])].slice(-60);
  o.updatedAt=(a.updatedAt||'')>(b.updatedAt||'')?a.updatedAt:b.updatedAt; return o}
async function wdLoad(){if(W) return W; if(WP) return WP;
  WP=(async()=>{let p=null; try{p=API()?await API().hqGet(WD_PATH):null}catch(e){} W=wdMerge(p,LSg('wird',null)); return W})(); return WP}
function wdUpdate(fn){const p=Object.assign(FRESH(),JSON.parse(JSON.stringify(W||{}))); fn(p); p.updatedAt=new Date().toISOString(); W=p; LSs('wird',p);
  clearTimeout(saveT); saveT=setTimeout(async()=>{try{const a=API(); if(!a) return; await a.hqSet(WD_PATH,W,(remote,mine)=>wdMerge(remote,mine),m=>{W=m; LSs('wird',m)})}catch(e){}},900)}

/* ── the adhkār (A's list, unchanged) ── */
const ADHKAR=[
 {k:'subhan',ar:'سُبْحَانَ ٱللَّٰهِ',tr:'Subḥān Allāh',en:'Glory be to God',n:33},
 {k:'hamd',ar:'ٱلْحَمْدُ لِلَّٰهِ',tr:'Alḥamdu lillāh',en:'Praise be to God',n:33},
 {k:'akbar',ar:'ٱللَّٰهُ أَكْبَرُ',tr:'Allāhu akbar',en:'God is greatest',n:34},
 {k:'tahlil',ar:'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',tr:'Lā ilāha illā Allāh',en:'There is no god but God',n:100},
 {k:'istighfar',ar:'أَسْتَغْفِرُ ٱللَّٰهَ',tr:'Astaghfirullāh',en:'I ask God\'s forgiveness',n:100},
 {k:'salawat',ar:'ٱللَّٰهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ',tr:'Allāhumma ṣalli ʿalā sayyidinā Muḥammad',en:'O God, bless our master Muḥammad',n:100},
 {k:'hawqala',ar:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ',tr:'Lā ḥawla wa lā quwwata illā billāh',en:'No power and no strength but through God',n:100},
 {k:'hasbuna',ar:'حَسْبُنَا ٱللَّٰهُ وَنِعْمَ ٱلْوَكِيلُ',tr:'Ḥasbunā Allāh wa niʿma al-Wakīl',en:'God suffices us, and how excellent a Guardian',n:450,note:'450 — the verse\'s own value, the count of al-Sirr al-Jalīl'}];
let NAMES=null;   // A's DATA.names (halqa/meta.json): o, tr, en, ab (bare), aw (with al-), mb, mw, p
async function names(){if(NAMES) return NAMES; try{const m=API()?await API().meta():await xget('halqa/meta.json'); NAMES=(m.names||[]).filter(n=>n.o>=2&&n.ab)}catch(e){NAMES=[]} return NAMES}
/* the Name vowelled (from the Reference's vowelled list), and called with yā */
const VOC={84:['يَا مَالِكَ الْمُلْكِ','Yā Mālik al-Mulk'],85:['يَا ذَا الْجَلَالِ وَالْإِكْرَامِ','Yā Dhā l-Jalāli wa-l-Ikrām']};
const vow=o=>{const x=M6.names[String(o)]; return x?x[1]:''};
function vocative(n){if(VOC[n.o]) return VOC[n.o]; let v=vow(n.o); if(!v) return ['يَا '+n.ab,'Yā '+n.tr.replace(/^al-/,'')];
  v=v.replace(/^ا[ً-ْٰ]*ل[ْ]?/,'').replace(/^(.)ّ/,'$1'); return ['يَا '+v,'Yā '+n.tr.replace(/^al-/,'').replace(/^(.)/,c=>c.toUpperCase())]}
function dhikrOf(key){
  if(key&&key.startsWith('name:')&&NAMES){const n=NAMES.find(x=>'name:'+x.o===key); if(n){const [ar,tr]=vocative(n); return {k:key,ar,tr,en:n.en,n:n.mb||100,note:n.mb+' — the Name\'s abjad, the tradition\'s count'+(n.p?' · p.'+n.p:''),page:n.p,name:n}}}
  if(key&&key.startsWith('custom:')){const c=LSg('wirdCustom',{ar:'',n:100}); return {k:key,ar:c.ar||'—',tr:c.ar?'your own dhikr':'your own dhikr — type it below',en:'',n:c.n||100}}
  return ADHKAR.find(a=>a.k===key)||ADHKAR[0]}

/* ── listening: the page's dictation (Arabic), else the browser's own ── */
let DICT=undefined; const SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
async function dict(){if(DICT!==undefined) return DICT; try{DICT=await cuse('dictation')}catch(e){DICT=null} return DICT}
const wdNorm=s=>String(s||'').replace(/[ً-ْٰـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^ء-ي]/g,'');
const wdBare=s=>wdNorm(s).replace(/^يا/,'').replace(/^ال/,'');
function wdLev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]); for(let j=1;j<=n;j++) d[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[m][n]}
const wdSim=(t,h)=>{const a=wdBare(t),b=wdBare(h); if(!a||!b) return 0; if(b.includes(a)) return 100; return Math.max(0,Math.round(100*(1-wdLev(a,b)/Math.max(a.length,b.length))))};
function wdMarks(t,h){const a=[...wdBare(t)],b=[...wdBare(h)],m=a.length,n=b.length; const L=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=m-1;i>=0;i--) for(let j=n-1;j>=0;j--) L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const ok=Array(m).fill(false); let i=0,j=0; while(i<m&&j<n){if(a[i]===b[j]){ok[i]=true;i++;j++} else if(L[i+1][j]>=L[i][j+1]) i++; else j++}
  return a.map((c,k)=>[c,ok[k]])}
/* start listening from the click itself; onText(alternatives) for each settled phrase; returns a stop() */
let DH=null; function dictHook(){if(DH) return; DH={}; DICT.onFinal(({text})=>{if(DH.text&&text) DH.text([text])}); DICT.onState(({state,reason})=>{if(state==='idle'&&DH.end){const f=DH.end; DH.end=null; DH.text=null; f(reason)}})}
function listen(continuous,onText,onEnd){
  if(DICT){dictHook(); DH.text=onText; DH.end=r=>onEnd&&onEnd(r==='stopped'||r==='viewer_stopped'?undefined:r);
    DICT.start({language:'ar'}).catch(e=>{const f=DH.end; DH.end=null; DH.text=null; f&&f(e&&e.code||'error')}); return ()=>{DH.text=null; DICT.stop().catch(()=>{})}}
  if(SR){const r=new SR(); r.lang='ar-SA'; r.continuous=continuous; r.interimResults=false; r.maxAlternatives=5; let on=true;
    r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++) if(e.results[i].isFinal) onText([...e.results[i]].map(x=>x.transcript))};
    r.onend=()=>{if(on&&continuous){try{r.start()}catch(e){}} else onEnd&&onEnd()}; r.onerror=()=>{}; try{r.start()}catch(e){} return ()=>{on=false; try{r.stop()}catch(e){} onEnd&&onEnd()}}
  onEnd&&onEnd('unavailable'); return ()=>{}}

/* a soft bell at the round's end (a struck tone, not a voice; can be turned off) */
let AC=null; function bell(){if(!LSg('wdBell',true)) return; try{AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const t=AC.currentTime;
  [[660,.18],[990,.07]].forEach(([f,g])=>{const o=AC.createOscillator(),v=AC.createGain(); o.type='sine'; o.frequency.value=f; v.gain.setValueAtTime(0,t); v.gain.linearRampToValueAtTime(g,t+.02); v.gain.exponentialRampToValueAtTime(.0001,t+2.2); o.connect(v).connect(AC.destination); o.start(t); o.stop(t+2.3)})}catch(e){}}

/* ── the page ── */
const css=document.createElement('style'); css.textContent=`
#wdRoot{display:grid;gap:16px;min-width:0}
.wdtabs{display:flex;gap:6px;flex-wrap:wrap}.wdtabs button{min-height:40px}
.wdrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.wdrow select{max-width:100%;min-height:40px;flex:1 1 220px;min-width:0}.wdrow input[type=number]{width:84px;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);font:inherit;min-height:40px}
.wdstage{display:flex;gap:24px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:8px}
.wdring{position:relative;width:min(280px,78vw);aspect-ratio:1;border-radius:50%;border:0;cursor:pointer;color:inherit;touch-action:manipulation;user-select:none;-webkit-user-select:none;
  background:radial-gradient(circle at 50% 38%,color-mix(in srgb,var(--gold-hi) 26%,transparent),var(--panel) 68%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--gold) 45%,transparent),0 10px 30px -18px rgba(0,0,0,.5);display:grid;place-items:center;padding:0}
.wdring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.wdring .in{position:relative;display:grid;gap:2px;justify-items:center;padding:0 12%}
.wdring .ar{text-align:center;font-size:clamp(1.25rem,5.4vw,1.75rem);line-height:1.6;color:var(--ink)}
.wdring .n{font-family:var(--f-mono);font-size:clamp(2.2rem,10vw,3rem);color:var(--gold);line-height:1.1;font-variant-numeric:tabular-nums}
.wdring:active{transform:scale(.985)}
.wdbreath{width:150px;height:150px;display:grid;place-items:center;position:relative}.wdbreath i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--turq) 40%,transparent),transparent 70%);transition:transform 4s ease-in-out}
.wdbreath span{position:relative;font-family:var(--f-mono);font-size:.75rem;letter-spacing:.08em;color:var(--muted)}
.wdcenter{text-align:center}.wdtr{font-style:italic;color:var(--turq)}
.wdcard{border:1px solid color-mix(in srgb,var(--gold) 45%,var(--line));border-radius:12px;padding:22px 16px;text-align:center;display:grid;gap:8px;background:var(--panel);box-shadow:inset 0 0 0 4px var(--panel),inset 0 0 0 5px color-mix(in srgb,var(--gold) 30%,transparent)}
.wdbig{font-family:var(--f-ar);font-size:clamp(2.3rem,11vw,3.4rem);line-height:1.6;direction:rtl;color:var(--ink)}
.wdstats{display:flex;gap:8px 22px;flex-wrap:wrap}.wdstats div b{display:block;font-family:var(--f-mono);font-size:1.05rem;color:var(--lapis)}.wdstats div span{font-size:.74rem;color:var(--muted);letter-spacing:.04em}
.wdrate{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.wdrate button{min-width:92px;min-height:44px}
.wdtiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.wdtile{border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel)}
.wdtile span{display:block;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.wdtile b{display:block;font-family:var(--f-head);font-weight:400;font-size:1.7rem;color:var(--ink)}.wdtile i{font-style:normal;font-size:.78rem;color:var(--muted)}
.wdbars{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:18px}.wdbar{display:flex;align-items:flex-end;gap:4px;height:84px}.wdbar span{flex:1;background:color-mix(in srgb,var(--gold) 55%,transparent);border-radius:2px 2px 0 0;min-height:2px}.wdbar span.t{background:var(--gold)}
.wdlbl{display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:.7rem;color:var(--muted);margin-top:4px}
.wdletter{border:1px solid var(--gold);border-radius:10px;padding:14px 16px;background:var(--panel);display:grid;gap:8px}.wdletter p{white-space:pre-wrap;line-height:1.8;max-width:70ch;margin:0}
.wdch{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(56px,1fr) 52px;gap:10px;align-items:center;background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:5px 0;min-height:36px;border-top:1px solid var(--line)}
.wdch span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.88rem}.wdch .bar{height:6px;border-radius:4px;background:var(--line);overflow:hidden}.wdch .bar i{display:block;height:100%;background:var(--gold)}.wdch .num{text-align:right}
.wdci{border:1px dashed color-mix(in srgb,var(--gold) 60%,transparent);border-radius:10px;padding:10px 12px;display:grid;gap:8px}.wdci .wdrow span{min-width:48px;font-size:.85rem;color:var(--muted)}
.wdci button{min-height:36px}
.wdmarks{font-family:var(--f-ar);font-size:2rem;direction:rtl}.wdmarks .ok{color:var(--ok)}.wdmarks .no{color:var(--warn);text-decoration:underline}
#wdDay .wdrow{justify-content:space-between}`;
document.head.appendChild(css);

const V={sub:LSg('wirdTab','count'),key:LSg('wirdKey','subhan'),target:null,count:0,committed:0,breath:LSg('wirdBreath',false),auto:false,mic:false,stopMic:null,saved:'',show:false,skip:[],sayO:LSg('wirdSayO',2),heard:null,listening:false,stopSay:null,busy:false,err:''};
let autoIv=null, breathT=null;
function root(){return document.getElementById('wdRoot')}
function commit(){const add=V.count-V.committed; if(add<=0) return; V.committed=V.count; const t=ymd(new Date()), k=V.key; wdUpdate(p=>{const d=Object.assign({},p.totals[t]||{}); d[k]=(d[k]||0)+add; p.totals[t]=d})}
function tap(){const D=dhikrOf(V.key), T=V.target||D.n; V.count++; const n=V.count;
  if(n%T===0||n%33===0){try{navigator.vibrate&&navigator.vibrate(n%T===0?[60,60,60]:35)}catch(e){}}
  if(n%T===0){bell(); commit()} drawCountNum()}
function drawCountNum(){const r=root(); if(!r) return; const D=dhikrOf(V.key), T=V.target||D.n; const c=r.querySelector('#wdN'), s=r.querySelector('#wdRounds'), arc=r.querySelector('#wdArc');
  if(c) c.textContent=V.count; if(s) s.textContent=Math.floor(V.count/T)+' round'+(Math.floor(V.count/T)===1?'':'s')+' · of '+T;
  if(arc){const C=2*Math.PI*46, pct=Math.min(1,(V.count%T||(V.count?T:0))/T); arc.setAttribute('stroke-dashoffset',String(C*(1-pct)))}}

function draw(){const r=root(); if(!r) return;
  const T=[['count','Count with him'],['names','The Ninety-nine'],['say','Say it'],['path','My path']];
  r.innerHTML='<section class="box"><h2>Wird &amp; the Ninety-nine <span class="ari" style="color:var(--gold)">الورد</span></h2><p class="meta">Your own practice beside the teacher\'s, from the Iḥyāʾ Engine: count your dhikr with the breath, keep the Ninety-nine in memory by spaced review, say them rightly, and see the path you have walked. No machine voice says the Arabic: read it, and say it yourself.</p><div class="wdtabs flt" role="tablist" aria-label="Wird">'+T.map(([k,l])=>'<button role="tab" data-wdt="'+k+'" aria-pressed="'+(V.sub===k)+'">'+l+'</button>').join('')+'</div></section><section class="box" id="wdBody"><p class="empty">Loading…</p></section>';
  r.querySelectorAll('[data-wdt]').forEach(b=>b.onclick=()=>{if(V.sub==='count') commit(); stopAll(); V.sub=b.dataset.wdt; LSs('wirdTab',V.sub); draw()});
  Promise.all([wdLoad(),names()]).then(()=>{if(!root()) return; ({count:drawCount,names:drawNames,say:drawSay,path:drawPath}[V.sub]||drawCount)()})}
function stopAll(){V.auto=false; clearInterval(autoIv); if(V.stopMic){const s=V.stopMic; V.stopMic=null; s()} V.mic=false; if(V.stopSay){const s=V.stopSay; V.stopSay=null; s()} clearTimeout(breathT)}

/* 1 · Count with him */
function drawCount(){const el=document.getElementById('wdBody'); if(!el) return; const D=dhikrOf(V.key); if(V.target==null) V.target=D.n; const T=V.target;
  const today=(W.totals||{})[ymd(new Date())]||{}; const C=2*Math.PI*46; const custom=LSg('wirdCustom',{ar:'',n:100});
  let h='<div class="wdrow"><label for="wdSel" hidden>Dhikr</label><select id="wdSel"><optgroup label="Adhkār">'+ADHKAR.map(a=>'<option value="'+a.k+'"'+(a.k===V.key?' selected':'')+'>'+esc(a.tr)+' · '+a.n+'</option>').join('')+'</optgroup><optgroup label="The Ninety-nine (× abjad)">'+NAMES.map(n=>'<option value="name:'+n.o+'"'+('name:'+n.o===V.key?' selected':'')+'>'+n.o+'. '+esc(n.tr)+' · '+n.mb+'</option>').join('')+'</optgroup><option value="custom:1"'+(V.key.startsWith('custom:')?' selected':'')+'>My own dhikr…</option></select>'+
    '<label class="meta" for="wdT">round of</label><input id="wdT" type="number" min="1" value="'+T+'"><button class="more" id="wdBack">back one</button><button class="more" id="wdReset">reset</button></div>';
  if(V.key.startsWith('custom:')) h+='<div class="wdrow"><input id="wdCa" dir="rtl" class="ari" value="'+esc(custom.ar)+'" placeholder="اكتب الذكر" style="flex:1 1 240px;padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);font-size:1.2rem;min-width:0"><span class="num" id="wdCv">'+(custom.ar?'abjad '+abjad(custom.ar,false).total:'')+'</span></div>';
  h+='<div class="wdstage"><button class="wdring" id="wdTap" aria-label="Count one"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" stroke-width="2.2"/><circle id="wdArc" cx="50" cy="50" r="46" fill="none" stroke="var(--gold)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+C+'"/></svg><span class="in"><span class="ar" dir="rtl">'+esc(D.ar)+'</span><span class="n" id="wdN">'+V.count+'</span><span class="num" id="wdRounds"></span></span></button>'+(V.breath?'<div class="wdbreath" aria-hidden="true"><i id="wdBi"></i><span id="wdBt">breathe in</span></div>':'')+'</div>';
  h+='<div class="wdcenter"><div class="wdtr">'+esc(D.tr)+(D.en?' — <span style="font-style:normal;color:var(--ink)">'+esc(D.en)+'</span>':'')+'</div>'+(D.note?'<div class="meta">'+esc(D.note)+'</div>':'')+'<div class="meta" style="font-size:.8rem">Tap the circle, or press Space / Enter / +. It buzzes at every 33 and at the round\'s end.</div></div>';
  h+='<div class="wdrow" style="justify-content:center"><div class="flt"><button id="wdBr" aria-pressed="'+V.breath+'">'+(V.breath?'● Breath guide':'Breath guide')+'</button><button id="wdAuto" aria-pressed="'+V.auto+'" title="One count with each slow breath (11 s), hands-free">'+(V.auto?'● Counting each breath':'Count each breath')+'</button><button id="wdMic" aria-pressed="'+V.mic+'" hidden title="Each time you say it aloud, it counts">'+(V.mic?'■ Counting by voice':'🎙 Count by voice')+'</button><button id="wdBell" aria-pressed="'+LSg('wdBell',true)+'">'+(LSg('wdBell',true)?'soft bell on':'soft bell off')+'</button></div><button class="more pri" id="wdJ">Write it in the journal</button>'+(D.name?'<button class="more" id="wdSq">Its square</button>'+(D.page?'<button class="more" id="wdPg">Its pages</button>':''):'')+'</div>';
  h+='<p class="meta wdcenter" id="wdMsg">'+esc(V.saved)+'</p>'+(Object.keys(today).length?'<p class="meta wdcenter">Today: '+Object.entries(today).map(([k,v])=>esc(dhikrOf(k).tr)+' '+v).join(' · ')+'</p>':'');
  el.innerHTML=h; drawCountNum();
  const $=id=>document.getElementById(id);
  $('wdSel').onchange=e=>{commit(); V.key=e.target.value; LSs('wirdKey',V.key); V.target=null; V.count=0; V.committed=0; V.saved=''; drawCount()};
  $('wdT').onchange=e=>{V.target=Math.max(1,+e.target.value||1); drawCountNum()};
  $('wdBack').onclick=()=>{V.count=Math.max(V.committed,V.count-1); drawCountNum()};
  $('wdReset').onclick=()=>{commit(); V.count=0; V.committed=0; drawCountNum()};
  $('wdTap').onclick=tap;
  const ca=$('wdCa'); if(ca) ca.oninput=e=>{const c=LSg('wirdCustom',{ar:'',n:100}); c.ar=e.target.value; LSs('wirdCustom',c); $('wdCv').textContent=c.ar?'abjad '+abjad(c.ar,false).total:''};
  $('wdBr').onclick=()=>{V.breath=!V.breath; LSs('wirdBreath',V.breath); clearTimeout(breathT); drawCount()};
  $('wdAuto').onclick=()=>{V.auto=!V.auto; clearInterval(autoIv); if(V.auto) autoIv=setInterval(()=>{if(tab!=='learn'||!document.getElementById('wdTap')){V.auto=false; clearInterval(autoIv); return} tap()},11000); const b=$('wdAuto'); b.setAttribute('aria-pressed',V.auto); b.textContent=V.auto?'● Counting each breath':'Count each breath'};
  $('wdBell').onclick=()=>{LSs('wdBell',!LSg('wdBell',true)); const b=$('wdBell'); b.setAttribute('aria-pressed',LSg('wdBell',true)); b.textContent=LSg('wdBell',true)?'soft bell on':'soft bell off'};
  const mic=$('wdMic'); if(DICT||SR) mic.hidden=false; else dict().then(d=>{if(d&&document.getElementById('wdMic')) document.getElementById('wdMic').hidden=false});
  mic.onclick=()=>{if(V.mic){stopAll(); drawCount(); return} V.mic=true; mic.setAttribute('aria-pressed','true'); mic.textContent='■ Counting by voice';
    V.stopMic=listen(true,()=>tap(),err=>{V.mic=false; V.stopMic=null; const b=document.getElementById('wdMic'); if(b){b.setAttribute('aria-pressed','false'); b.textContent='🎙 Count by voice'} if(err==='not_granted'&&b) b.hidden=true})};
  $('wdJ').onclick=async()=>{commit(); if(!V.count){V.saved='Count first, then write it.'; $('wdMsg').textContent=V.saved; return} const a=API(); const d=new Date(), R=Math.floor(V.count/T);
    const e={id:'j'+d.getTime(),at:d.getTime(),kind:'dhikr',title:'Wird · '+D.tr,name:D.ar,intent:'my own wird',count:V.count,note:V.count+' ('+R+' round'+(R===1?'':'s')+' of '+T+')',by:'wird'};
    try{if(a) await a.saveJournal(e); V.saved='Written in your journal: '+V.count+' × '+D.tr+'.'}catch(x){V.saved='Could not write the journal.'} $('wdMsg').textContent=V.saved};
  const sq=$('wdSq'); if(sq) sq.onclick=()=>{FG.grid=null; FG.text=D.name.ab; FG.num=''; FG.mode='wafq'; fgSave(); tab='forge'; render(); window.scrollTo(0,0)};
  const pg=$('wdPg'); if(pg) pg.onclick=()=>{if(window.kbOpenPage) window.kbOpenPage(D.page)};
  if(V.breath) breathe()}
function breathe(){const bi=document.getElementById('wdBi'), bt=document.getElementById('wdBt'); if(!bi) return; const cyc=ph=>{const b=document.getElementById('wdBi'), t=document.getElementById('wdBt'); if(!b) return;
  const dur=ph==='in'?4:ph==='hold'?1:6; b.style.transitionDuration=(ph==='hold'?.2:dur)+'s'; b.style.transform='scale('+(ph==='out'?.55:1)+')'; t.textContent=ph==='in'?'breathe in':ph==='hold'?'hold':'breathe out';
  breathT=setTimeout(()=>cyc(ph==='in'?'hold':ph==='hold'?'out':'in'),dur*1000)}; bi.style.transform='scale(.55)'; breathT=setTimeout(()=>cyc('in'),60)}
document.addEventListener('keydown',e=>{if(tab!=='learn'||V.sub!=='count'||!document.getElementById('wdTap')) return; if(e.target&&/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)&&e.target.id!=='wdTap') return;
  if(e.code==='Space'||e.key==='Enter'||e.key==='+'){const r=document.getElementById('wdTap').getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return; e.preventDefault(); tap()}});
window.addEventListener('pagehide',()=>commit());

/* 2 · The Ninety-nine, kept by spaced review */
function drawNames(){const el=document.getElementById('wdBody'); if(!el) return; const a=API(); const t=ymd(new Date()), perDay=LSg('wirdNewPerDay',5), cards=W.cards||{};
  const N=NAMES; const due=N.filter(n=>cards['n'+n.o]&&cards['n'+n.o][0]<=t); const introduced=(W.newDay||{})[t]||0;
  const fresh=N.filter(n=>!cards['n'+n.o]).slice(0,Math.max(0,perDay-introduced)); const queue=[...due,...fresh].filter(n=>!V.skip.includes(n.o)); const cur=queue[0]; const c=cur?cards['n'+cur.o]:null;
  const reverse=c&&c[3]>=2&&(cur.o+new Date().getDate())%3===0;
  const learned=N.filter(n=>cards['n'+n.o]&&cards['n'+n.o][3]>=1).length, kept=N.filter(n=>cards['n'+n.o]&&cards['n'+n.o][2]>=8).length;
  let h='<div class="wdrow" style="justify-content:space-between"><div class="wdstats">'+[[learned+' / '+N.length,'learning'],[kept,'kept (8+ days)'],[due.length,'due today'],[introduced+' / '+perDay,'new today']].map(([v,k])=>'<div><b>'+v+'</b><span>'+k+'</span></div>').join('')+'</div><label class="meta">new a day <select id="wdPer">'+[3,5,7,10,15].map(v=>'<option'+(v===perDay?' selected':'')+'>'+v+'</option>').join('')+'</select></label></div>';
  if(!a) h+='<p class="fnd">The Study\'s scheduler did not load, so cards cannot be kept. Reload the page.</p>';
  if(!cur) h+='<div class="wdcard"><div style="font-family:var(--f-head);font-size:1.5rem">Nothing more today.</div><div class="meta">'+(learned===N.length?'Every Name is in your keeping; the reviews return as they come due.':'The next Names arrive tomorrow.')+'</div></div>';
  else{const vw=vow(cur.o)||cur.aw||cur.ab; h+='<div class="wdcard"><div class="meta" style="letter-spacing:.08em;text-transform:uppercase;font-size:.72rem">'+(c?'review':'new')+' · Name '+cur.o+' of 99</div>';
    h+=reverse&&!V.show?'<div style="font-family:var(--f-head);font-size:clamp(1.4rem,5vw,1.9rem);margin:14px 0">“'+esc(cur.en)+'” — which Name?</div>':'<div class="wdbig">'+esc(vw)+'</div><div class="wdtr" style="font-size:1.15rem">'+esc(cur.tr)+'</div>';
    if(V.show){h+=(reverse?'<div class="wdbig">'+esc(vw)+'</div><div class="wdtr" style="font-size:1.1rem">'+esc(cur.tr)+'</div>':'')+'<div style="font-size:1.2rem">'+esc(cur.en)+'</div><div class="num" style="color:var(--gold);font-size:.95rem">abjad '+cur.mb+(cur.mw?' · with the article '+cur.mw:'')+(cur.p?' · p.'+cur.p:'')+' <span class="tag">recomputed ✓</span></div>'+
      '<div class="wdrate"><button class="more" id="wdNs">its square</button>'+(cur.p?'<button class="more" id="wdNp">its pages</button>':'')+'<button class="more" id="wdNc">count it</button></div>'+
      '<div class="wdrate" style="margin-top:6px">'+[[0,'Forgot'],[1,'Partly'],[2,'Knew it'],[3,'Easy']].map(([s,l])=>'<button class="more'+(s===2?' pri':'')+'" data-wdr="'+s+'">'+l+'</button>').join('')+'</div>'}
    else h+='<div><button class="more pri" id="wdShow" style="min-height:44px">Show the meaning and value</button><div class="meta" style="margin-top:6px">Say its meaning and its abjad to yourself first.</div></div>';
    h+='</div>'}
  el.innerHTML=h;
  document.getElementById('wdPer').onchange=e=>{LSs('wirdNewPerDay',+e.target.value); drawNames()};
  const sh=document.getElementById('wdShow'); if(sh) sh.onclick=()=>{V.show=true; drawNames()};
  if(cur){const ns=document.getElementById('wdNs'); if(ns) ns.onclick=()=>{FG.grid=null; FG.text=cur.ab; FG.num=''; FG.mode='wafq'; fgSave(); tab='forge'; render(); window.scrollTo(0,0)};
    const np=document.getElementById('wdNp'); if(np) np.onclick=()=>{if(window.kbOpenPage) window.kbOpenPage(cur.p)};
    const nc=document.getElementById('wdNc'); if(nc) nc.onclick=()=>{V.key='name:'+cur.o; LSs('wirdKey',V.key); V.target=null; V.count=0; V.committed=0; V.sub='count'; LSs('wirdTab','count'); draw()};
    el.querySelectorAll('[data-wdr]').forEach(b=>b.onclick=()=>{if(!a) return; const s=+b.dataset.wdr, id='n'+cur.o, isNew=!cards[id];
      wdUpdate(p=>{p.cards=Object.assign({},p.cards,{[id]:a.dsSchedule(p.cards[id],s)}); if(isNew) p.newDay=Object.assign({},p.newDay,{[t]:(p.newDay[t]||0)+1})}); V.show=false; if(s===0) V.skip.push(cur.o); drawNames()})}}

/* 3 · Say it — you say the Name, and the listening checks every letter */
function drawSay(){const el=document.getElementById('wdBody'); if(!el) return; const N=NAMES; const n=N.find(x=>x.o===V.sayO)||N[0]; const target=n.aw||n.ab; const pron=W.pron||{}; const best=pron[n.o]; const said=Object.keys(pron).length;
  let h='<div class="wdrow"><button class="more" id="wdSp" aria-label="Previous Name">←</button><select id="wdSo" aria-label="Name">'+N.map(x=>'<option value="'+x.o+'"'+(x.o===n.o?' selected':'')+'>'+x.o+'. '+esc(x.tr)+((pron[x.o]||0)>=85?' ✓':'')+'</option>').join('')+'</select><button class="more" id="wdSn" aria-label="Next Name">→</button><span class="num">'+said+' of '+N.length+' practised</span></div>';
  h+='<div class="wdcard"><div class="wdbig">'+esc(vow(n.o)||target)+'</div><div class="wdtr" style="font-size:1.1rem">'+esc(n.tr)+' — <span style="font-style:normal;color:var(--ink)">'+esc(n.en)+'</span></div>';
  h+='<div><button class="more pri" id="wdSay" style="min-height:44px"'+(V.listening?' disabled':'')+'>'+(V.listening?'🎙 listening…':'🎙 Now say it')+'</button></div><p class="meta" id="wdSayN" hidden>Listening to your voice is not available in this view (it needs Chrome or the Claude desktop app). Read the Name and its transliteration aloud with care.</p>';
  if(V.heard&&V.heard.o===n.o){const sc=V.heard.score; h+='<div class="num" style="font-size:2rem;color:'+(sc>=85?'var(--ok)':sc>=60?'var(--gold)':'var(--warn)')+'">'+sc+'%</div><div class="wdmarks">'+wdMarks(target,V.heard.text).map(([ch,ok])=>'<span class="'+(ok?'ok':'no')+'">'+esc(ch)+'</span>').join('')+'</div><div class="meta">Heard: <span class="ari" dir="rtl">'+esc(V.heard.text)+'</span></div><div>'+(sc>=85?'Well said. Move to the next Name.':sc>=60?'Close — the letters in red were not heard clearly. Say it again slowly and give each letter its full place.':'Not yet. Read it once more, slowly, then say it with care.')+'</div>'}
  if(best!=null) h+='<div class="meta">your best on this Name: '+best+'%</div>';
  h+='<p class="meta" style="font-size:.8rem;max-width:62ch;justify-self:center">The listening is a helper, not a shaykh of tajwīd: it checks that every letter was heard, not the fine points of makhārij. Red letters are the ones it missed. (The Iḥyāʾ Engine first said the Name in a machine voice; that is left out here by your decision — learn it from your teacher or a real recitation.)</p></div>';
  el.innerHTML=h;
  const go=o=>{V.sayO=o; LSs('wirdSayO',o); V.heard=null; if(V.stopSay){const s=V.stopSay; V.stopSay=null; s()} V.listening=false; drawSay()};
  document.getElementById('wdSp').onclick=()=>go(Math.max(2,n.o-1)); document.getElementById('wdSn').onclick=()=>go(Math.min(99,n.o+1)); document.getElementById('wdSo').onchange=e=>go(+e.target.value);
  const btn=document.getElementById('wdSay'); const note=document.getElementById('wdSayN');
  if(!DICT&&!SR){dict().then(d=>{if(!d&&!SR&&document.getElementById('wdSayN')){document.getElementById('wdSayN').hidden=false; const b=document.getElementById('wdSay'); if(b) b.disabled=true}})}
  btn.onclick=()=>{if(!DICT&&!SR){note.hidden=false; return} V.listening=true; V.heard=null; btn.disabled=true; btn.textContent='🎙 listening…';
    let got=false; V.stopSay=listen(false,alts=>{if(got) return; got=true; const b=alts.map(x=>[x,wdSim(target,x)]).sort((p,q)=>q[1]-p[1])[0]; V.heard={o:n.o,text:b[0],score:b[1]};
      wdUpdate(p=>{p.pron=Object.assign({},p.pron,{[n.o]:Math.max(p.pron[n.o]||0,b[1])})}); if(DICT) DICT.stop().catch(()=>{})},err=>{V.listening=false; V.stopSay=null; if(err==='not_granted'||err==='unavailable'){note.hidden=false} if(tab==='learn'&&V.sub==='say') drawSay()})}}

/* 4 · My path, the day's check-in, and the teacher's letter for the week */
const weekKey=(d=new Date())=>{const x=new Date(d); x.setHours(12,0,0,0); x.setDate(x.getDate()-((x.getDay()+1)%7)); return ymd(x)};   // weeks begin on Saturday
async function pathData(){const a=API(); let prog={units:{},cards:{},minutes:{},answers:[]}; try{if(a) prog=await a.dsLoad()}catch(e){}
  const st=a?a.dsStats(prog):{pct:0,taught:0,total:855,retention:null,streak:0,due:0}; const days=[...Array(14)].map((_,i)=>{const d=new Date(); d.setDate(d.getDate()-13+i); return d});
  const mins=days.map(d=>Math.round((prog.minutes||{})[ymd(d)]||0)), counts=days.map(d=>Object.values((W.totals||{})[ymd(d)]||{}).reduce((x,y)=>x+y,0));
  let byCh=[]; try{const m=await a.meta(); const U=a.dsUnits(); byCh=m.chapters.filter(c=>c.to>=40).map(c=>{const us=U.filter(u=>u.ch===c.ch); return {c,total:us.length,done:us.filter(u=>(prog.units||{})[u.id]).length}})}catch(e){}
  let journal=0; try{const db=await cuse('db'); if(db){const q=await db.collection('journal').where('at','>',Date.now()-7*864e5).get(); journal=q.docs.length}}catch(e){}
  const learned=NAMES.filter(n=>(W.cards||{})['n'+n.o]).length; return {prog,st,days,mins,counts,byCh,journal,learned}}
const wsum=a=>a.slice(-7).reduce((x,y)=>x+y,0);
function factsOf(P){return 'Minutes studied each of the last 7 days: '+P.mins.slice(-7).join(', ')+'. Lessons of the book taught: '+P.st.taught+' of '+P.st.total+'. Remembered in recent questions: '+(P.st.retention??'—')+'%. Reviews due now: '+P.st.due+'. Days in a row: '+P.st.streak+'. Dhikr counted this week: '+wsum(P.counts)+'. Names of the Ninety-nine in his keeping: '+P.learned+' of '+NAMES.length+'. Chapters in progress: '+(P.byCh.filter(x=>x.done&&x.done<x.total).map(x=>'ch.'+x.c.ch+' '+x.done+'/'+x.total).join(', ')||'none')+'. Journal entries this week: '+P.journal+'.'}
const NUTQ_RULE='Whenever you write any Arabic (a Divine Name, a verse, a dhikr, a word), write it in Arabic script with full and correct tashkīl on every letter — never bare letters — and the Qurʾān exactly as in the Ḥafṣ reading.';
async function compose(P,auto){const s=await cuse('sample'); if(!s) throw {code:'unavailable'}; const wk=weekKey();
  const prompt=NUTQ_RULE+' You are al-Muʿallim, a master of the Shādhilī way, teaching one student, Al, the book Iḥyāʾ Uṣūl al-Ḥikmah. Write him this week\'s letter: 150–230 words of warm, plain spoken English, no markdown. Name what he did well (from the facts only), the one thing that slipped, and a clear small aim for next week (minutes a day, which chapter or review, how many Names). Close with one short line of adab from the masters, named as such. Never invent numbers. Return JSON {"letter": "..."}.\n\nFacts: '+factsOf(P);
  const r=await s.json([{role:'user',content:prompt}],{modelTier:'default'}); const txt=r&&(r.letter||(r.data&&r.data.letter)); if(!txt) throw {code:'empty'};
  wdUpdate(p=>{p.letters=Object.assign({},p.letters,{[wk]:{text:txt,at:Date.now(),auto:!!auto}})}); return txt}
async function drawPath(){const el=document.getElementById('wdBody'); if(!el) return; el.innerHTML='<p class="empty">Gathering your path…</p>'; const P=await pathData(); if(!document.getElementById('wdBody')||V.sub!=='path') return;
  const t=ymd(new Date()), ci=(W.checkins||{})[t], wk=weekKey(), letter=(W.letters||{})[wk]; const maxM=Math.max(30,...P.mins), maxC=Math.max(33,...P.counts);
  const dots=n=>'●'.repeat(n)+'○'.repeat(3-n);
  let h='<div class="wdci">'+(ci?'<div class="meta">Today: sleep '+dots(ci.sleep)+' · focus '+dots(ci.focus)+' · heart '+dots(ci.heart)+' — '+esc(ci.advice)+'</div>':'<div>How are you today? He shapes the study to it.</div>'+[['sleep','sleep',['poor','fair','good']],['focus','focus',['scattered','fair','clear']],['heart','heart',['heavy','steady','light']]].map(([k,l,ic])=>'<div class="wdrow"><span>'+l+'</span><div class="flt">'+ic.map((x,i)=>'<button data-ci="'+k+':'+(i+1)+'" aria-pressed="false">'+x+'</button>').join('')+'</div></div>').join(''))+'</div>';
  h+='<div class="wdtiles">'+[['the book',P.st.pct+'%',P.st.taught+' of '+P.st.total+' lessons'],['this week',(Math.round(wsum(P.mins)/6)/10)+' h','of study'],['remembered',P.st.retention==null?'—':P.st.retention+'%','of recent questions'],['days in a row',P.st.streak,'5+ minutes a day'],['dhikr this week',wsum(P.counts).toLocaleString(),'counted here'],['the Names',P.learned+' / '+NAMES.length,'in your keeping']].map(([k,v,s])=>'<div class="wdtile"><span>'+k+'</span><b>'+v+'</b><i>'+s+'</i></div>').join('')+'</div>';
  const bars=(v,max,l)=>'<div><div class="meta" style="font-size:.75rem;letter-spacing:.06em;text-transform:uppercase">'+l+'</div><div class="wdbar" role="img" aria-label="'+l+': '+v.join(', ')+'">'+v.map((x,i)=>'<span class="'+(i===13?'t':'')+'" title="'+ymd(P.days[i])+': '+x+'" style="height:'+Math.max(2,82*x/max)+'px"></span>').join('')+'</div><div class="wdlbl"><span>'+P.days[0].toLocaleDateString(undefined,{month:'short',day:'numeric'})+'</span><span>today</span></div></div>';
  h+='<div class="wdbars">'+bars(P.mins,maxM,'minutes studied · 14 days')+bars(P.counts,maxC,'dhikr counted · 14 days')+'</div>';
  h+='<div class="wdletter"><div class="wdrow" style="justify-content:space-between"><b style="font-family:var(--f-head);font-weight:400;color:var(--gold)">His letter for the week of '+wk+'</b><div class="wdrow">'+(letter?'<button class="more" id="wdLh" hidden>🔊 Hear it (English)</button>':'')+'<button class="more'+(letter?'':' pri')+'" id="wdLw"'+(V.busy?' disabled':'')+'>'+(V.busy?'writing…':letter?'write it again':'Ask him for this week\'s letter')+'</button></div></div>'+(letter?'<p>'+esc(letter.text)+'</p>'+(letter.auto?'<span class="meta">Written by itself on Friday.</span>':''):'<p class="meta">Each week he looks at what you did — study, review, dhikr, the Names — and writes to you: what went well, what slipped, and one aim for the week ahead. On Fridays he writes it by himself.</p>')+(V.err?'<p class="meta" style="color:var(--warn)">'+esc(V.err)+'</p>':'')+'</div>';
  const old=Object.entries(W.letters||{}).filter(([k])=>k!==wk).sort((a,b)=>a[0]<b[0]?1:-1); if(old.length) h+='<details><summary class="meta">Earlier letters · '+old.length+'</summary>'+old.map(([k,l])=>'<div class="wdletter" style="margin-top:8px"><b class="meta">Week of '+k+'</b><p>'+esc(l.text)+'</p></div>').join('')+'</details>';
  h+='<div><div class="meta" style="font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;margin:6px 0">The book, chapter by chapter</div>'+P.byCh.map(({c,total,done})=>'<button class="wdch" data-wdc="'+c.from+'"><span>'+(c.ch?'ch.'+c.ch:'Prologue')+' · '+esc(c.short||c.title||'')+'</span><span class="bar"><i style="width:'+(100*done/Math.max(1,total))+'%"></i></span><span class="num">'+done+'/'+total+'</span></button>').join('')+'</div>';
  el.innerHTML=h;
  el.querySelectorAll('[data-ci]').forEach(b=>b.onclick=()=>{const [k,x]=b.dataset.ci.split(':'); V.ci=Object.assign({sleep:0,focus:0,heart:0},V.ci||{},{[k]:+x}); el.querySelectorAll('[data-ci^="'+k+':"]').forEach(y=>y.setAttribute('aria-pressed',y===b));
    const nv=V.ci; if(!nv.sleep||!nv.focus||!nv.heart) return; const s=nv.sleep+nv.focus+nv.heart;
    const advice=s<=4?'a gentle day: one hour, mostly review, and dhikr with the breath':s<=6?'a steady day: two hours, new pages with review':'a strong day: three hours or more — he will go deeper'; const len=s<=4?60:s<=6?120:180;
    wdUpdate(p=>{p.checkins=Object.assign({},p.checkins,{[t]:Object.assign({},nv,{advice,len})})}); const a=API(); if(a&&a.dsSetCfg){a.dsSetCfg('len',len); if(s<=4) a.dsSetCfg('mode','forgot')} V.ci=null; drawPath()});
  el.querySelectorAll('[data-wdc]').forEach(b=>b.onclick=()=>{if(window.kbOpenPage) window.kbOpenPage(+b.dataset.wdc)});
  document.getElementById('wdLw').onclick=async()=>{V.err=''; V.busy=true; drawPath(); try{await compose(P,false)}catch(e){V.err=e&&e.code==='rate_limited'?'Claude is busy — try again in a moment.':e&&e.code==='not_granted'?'Claude was not allowed for this page.':'The letter needs Claude — open the engine inside Claude.'} V.busy=false; drawPath()};
  const lh=document.getElementById('wdLh'); if(lh){cuse('tts').then(tt=>{if(!tt||!document.getElementById('wdLh')) return; lh.hidden=false; lh.onclick=()=>{const x=englishOnly(letter.text); if(x) tt.speak(x.slice(0,2000),{language:'en'}).catch(()=>{})}})}}
/* on Fridays (Al's day off) the week's letter is written by itself the first time the engine opens */
async function autoLetter(){try{if(new Date().getDay()!==5) return; await Promise.all([wdLoad(),names()]); const wk=weekKey(); if((W.letters||{})[wk]||LSg('wdLetterTry','')===wk) return; LSs('wdLetterTry',wk); const P=await pathData(); await compose(P,true)}catch(e){}}

/* ── where it lives: Learn (with a place in the Go-to row) and a card on My day ── */
const rL=window.renderLearn||renderLearn;
renderLearn=function(){const r=rL.apply(this,arguments); const v=document.getElementById('view');
  if(v&&!root()){const d=document.createElement('div'); d.id='wdRoot'; const k=document.getElementById('kzhRoot'); if(k&&k.nextSibling) v.insertBefore(d,k.nextSibling); else v.appendChild(d);
    const j=v.querySelector('.learnjump'); if(j&&!j.querySelector('[data-lj="wdRoot"]')){const b=document.createElement('button'); b.dataset.lj='wdRoot'; b.innerHTML='Wird &amp; the Ninety-nine'; b.onclick=()=>d.scrollIntoView({behavior:'smooth',block:'start'}); const ab=j.querySelector('[data-lj="about"]'); j.insertBefore(b,ab||null)}
    draw()} return r};
window.renderLearn=renderLearn;
window.wdOpen=sub=>{if(sub) {V.sub=sub; LSs('wirdTab',sub)} tab='learn'; render(); setTimeout(()=>{const x=root(); if(x) x.scrollIntoView({block:'start'})},120)};
const rT=window.renderToday||renderToday;
const renderTodayWd=function(){const r=rT.apply(this,arguments); const v=document.getElementById('view'); if(v&&!document.getElementById('wdDay')){const box=document.createElement('section'); box.className='box'; box.id='wdDay';
    const k=document.getElementById('kzWird'); if(k&&k.nextSibling) v.insertBefore(box,k.nextSibling); else v.appendChild(box);
    Promise.all([wdLoad(),names()]).then(()=>{const b=document.getElementById('wdDay'); if(!b) return; const t=ymd(new Date()), cards=W.cards||{}; const due=NAMES.filter(n=>cards['n'+n.o]&&cards['n'+n.o][0]<=t).length;
      const nw=Math.max(0,LSg('wirdNewPerDay',5)-((W.newDay||{})[t]||0)), left=NAMES.filter(n=>!cards['n'+n.o]).length; const cnt=Object.values((W.totals||{})[t]||{}).reduce((x,y)=>x+y,0);
      b.innerHTML='<h2>Wird &amp; the Ninety-nine <span class="ari" style="color:var(--gold)">الورد</span></h2><div class="wdrow"><div class="wdstats"><div><b>'+due+'</b><span>Names due for review</span></div><div><b>'+Math.min(nw,left)+'</b><span>new Names today</span></div><div><b>'+cnt+'</b><span>dhikr counted today</span></div></div><div class="wdrow"><button class="kzbtn pri" data-wdo="names">The Ninety-nine</button><button class="kzbtn" data-wdo="count">Count with him</button><button class="kzbtn" data-wdo="path">My path</button></div></div>';
      b.querySelectorAll('[data-wdo]').forEach(x=>x.onclick=()=>window.wdOpen(x.dataset.wdo))})} return r};
renderToday=renderTodayWd; window.renderToday=renderTodayWd;

/* ── Ask ── */
if(typeof AITOOLS!=='undefined') AITOOLS.push(
 {name:'wird_status',description:"Al's own Wird (from the Iḥyāʾ Engine's Wird module): dhikr counted per day (last 14 days), the Ninety-nine flash cards (learning, kept, due today, each Name's next review), his best 'say it' scores, today's check-in and this week's letter from al-Muʿallim.",inputSchema:{type:'object',properties:{}},
  execute:async()=>{await Promise.all([wdLoad(),names()]); const t=ymd(new Date()), cards=W.cards||{}; const days=[...Array(14)].map((_,i)=>{const d=new Date(); d.setDate(d.getDate()-13+i); return ymd(d)});
    return {dhikr_by_day:Object.fromEntries(days.map(d=>[d,(W.totals||{})[d]||{}])),names:{total:NAMES.length,learning:NAMES.filter(n=>cards['n'+n.o]).length,kept_8_days:NAMES.filter(n=>cards['n'+n.o]&&cards['n'+n.o][2]>=8).length,due_today:NAMES.filter(n=>cards['n'+n.o]&&cards['n'+n.o][0]<=t).map(n=>n.tr),next_review:Object.fromEntries(NAMES.filter(n=>cards['n'+n.o]).map(n=>[n.tr,cards['n'+n.o][0]]))},say_scores:Object.fromEntries(Object.entries(W.pron||{}).map(([o,s])=>[(NAMES.find(n=>n.o===+o)||{}).tr||o,s])),checkin_today:(W.checkins||{})[t]||null,letter_this_week:((W.letters||{})[weekKey()]||{}).text||null}}},
 {name:'open_wird',description:'Open Learn → Wird & the Ninety-nine for Al at a part: "count" (the dhikr counter), "names" (the flash cards), "say" (say a Name and have it checked), "path" (his study path and the weekly letter). With name_number (2–99) and part "count", the counter is set to that Name at its abjad.',inputSchema:{type:'object',properties:{part:{type:'string',enum:['count','names','say','path']},name_number:{type:'number'}},required:['part']},
  execute:async({part,name_number})=>{await names(); if(name_number&&NAMES.find(n=>n.o===+name_number)){if(part==='say'){V.sayO=+name_number; LSs('wirdSayO',V.sayO)} else {V.key='name:'+(+name_number); LSs('wirdKey',V.key); V.target=null; V.count=0; V.committed=0}} setTimeout(()=>window.wdOpen(part),300); return {opened:part}}});

wdLoad().catch(()=>{}); names(); setTimeout(autoLetter,4000);
if(tab==='learn'&&!root()) renderLearn();
if(tab==='day'&&!document.getElementById('wdDay')) renderToday();
})();
