/* ===== al-Qurʾān al-Karīm — port 7, part 2 (2026-11-22), from the Iḥyāʾ Engine's kit/tools/quran.jsx (v3.9–v3.16).
   Read → Qurʾān: the 114 sūras in the Tanzil Uthmani text (verbatim), Pickthall (1930) and Yusuf Ali (1934), transliteration,
   every āya with its abjad (Mashriqī, on the corpus's plain spelling — the same values as Reference → Verses), juzʾ and page,
   sajda marks, ☆ marks kept across devices, search by reference, sūra name or any word (Arabic or English);
   the nine tafsīrs as the Iḥyāʾ carries them (al-Jalālayn and Ibn Kathīr for the plain sense; al-Qushayrī, Ibn ʿAjība,
   Ismāʿīl Ḥaqqī, al-Taʾwīlāt al-Najmiyya, al-Qāshānī, al-Sulamī and al-Tustarī for the inner), with "In English" (Claude's
   faithful rendering, labelled, kept once made) and "Teach me this verse" (al-Muʿallim's reading from the masters, labelled);
   and the three qurrāʾ — Mishary Alafasy, Maḥmūd Khalīl al-Ḥuṣarī, Muḥammad Ṣiddīq al-Minshāwī — real recordings from
   everyayah.com, copied into this page's asset store, with every āya's place: recite the sūra, one āya, or from here,
   repeat ×1/3/7/11/100, slow, the āya lit and followed as it is recited.
   Al's decision 1: no machine voice ever says the Arabic; only the English translation may be read aloud. ===== */
(function(){
'use strict';
const LSg=(k,d)=>{try{const v=localStorage.getItem(k); return v==null?d:JSON.parse(v)}catch(e){return d}};
const LSs=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IND=n=>String(n).replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[+d]);
const ABJF=t=>(typeof abjad==='function')?abjad(t,false):{total:0,letters:0,parts:[]};
const USE=n=>(window.claude&&typeof window.claude.use==='function')?window.claude.use(n).catch(()=>null):Promise.resolve(null);

/* ── style ── */
const css=`
.qrsec,.qrsec2{grid-template-columns:minmax(0,1fr)}
.qrhead{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:flex-end;justify-content:space-between}
.qrhead h2 .ari{color:var(--gold);font-size:1.35em}
.qrfind{display:flex;gap:8px;flex:1 1 300px;min-width:0}.qrfind input{flex:1;min-width:0;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);font:inherit}
.qrgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr));gap:8px}
.qrsu{font:inherit;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;padding:10px 12px;min-height:56px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);cursor:pointer}
.qrsu:hover{border-color:var(--gold)}.qrsu .n{font-family:var(--f-mono);font-size:.8rem;color:var(--gold);width:30px;height:30px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--gold) 55%,transparent);transform:rotate(45deg);border-radius:4px}.qrsu .n i{font-style:normal;transform:rotate(-45deg)}
.qrsu .en{font-size:.95rem;line-height:1.25}.qrsu .mn{font-size:.75rem;color:var(--muted)}.qrsu .ar{font-size:1.25rem;line-height:1.4;color:var(--ink)}
.qrcart{text-align:center;padding:18px 14px;border-radius:12px;border:1px solid color-mix(in srgb,var(--gold) 50%,var(--line));background:radial-gradient(600px 180px at 50% 0,color-mix(in srgb,var(--gold) 18%,transparent),transparent 70%),var(--panel);box-shadow:inset 0 0 0 4px var(--panel),inset 0 0 0 5px color-mix(in srgb,var(--gold) 45%,transparent);display:grid;gap:6px}
.qrcart .t{font-family:var(--f-ar);font-size:clamp(1.7rem,6vw,2.4rem);line-height:1.5;color:var(--ink)}
.qrcart .s{font-family:var(--f-head);font-size:1.15rem}.qrcart .m{font-size:.8rem;color:var(--muted)}
.qrbar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.qrbtn{font:inherit;font-size:.85rem;min-height:38px;padding:6px 13px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.qrbtn:hover{border-color:var(--gold)}.qrbtn[aria-pressed="true"],.qrbtn.on{background:linear-gradient(180deg,var(--gold-hi),var(--gold));border-color:var(--gold-hi);color:#1a1405}
.qrbtn.pri{background:var(--lapis);border-color:var(--lapis);color:var(--panel)}.qrbtn:disabled{opacity:.45;cursor:default}
.qrbtn.sm{min-height:34px;font-size:.8rem;padding:4px 11px}
.qrtools{position:sticky;top:calc(var(--hdrH,0px) + env(safe-area-inset-top,0px));z-index:3;background:color-mix(in srgb,var(--panel) 94%,transparent);backdrop-filter:blur(6px);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
@media (max-width:640px){.qrtools .qrbar{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.qrtools .qrbar::-webkit-scrollbar{display:none}.qrtools .qrbtn,.qrtools select{flex:none}}
.qrbsm{text-align:center;font-family:var(--f-ar);font-size:calc(var(--qrfs,30px)*.9);line-height:1.8;color:var(--gold);padding:4px 0}
.qra{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:14px 16px;display:grid;gap:6px;min-width:0;transition:background .3s,border-color .3s;scroll-margin-top:180px}
.qra.tg{border-color:color-mix(in srgb,var(--gold) 60%,var(--line))}
.qra.now{border-color:var(--gold-hi);background:color-mix(in srgb,var(--gold-soft) 70%,var(--panel));box-shadow:inset 3px 0 0 var(--gold-hi)}
.qra .qar{font-family:var(--f-ar);font-size:var(--qrfs,30px);line-height:2.1;direction:rtl;text-align:right;unicode-bidi:isolate;overflow-wrap:anywhere;color:var(--ink)}
@media (max-width:520px){.qra .qar{font-size:calc(var(--qrfs,30px)*.86)}}
.qra .qno{font-family:var(--f-ar);color:var(--gold);font-size:.75em;white-space:nowrap}
.qra .sj{font-family:var(--f-body);font-size:.75rem;color:var(--gold);white-space:nowrap}
.qra .qtl{font-style:italic;color:var(--turq);font-size:.92rem}
.qra .qen{font-size:1rem;line-height:1.7;max-width:76ch}.qra .qen .k{font-family:var(--f-mono);font-size:.72rem;color:var(--gold);margin-inline-end:6px}
.qra .qen.y{color:var(--muted)}
.qra .qmeta{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;font-family:var(--f-mono);font-size:.74rem;color:var(--muted)}
.qra .qmeta .ab{color:var(--lapis)}
.qrtf{border-top:1px solid var(--line);margin-top:6px;padding-top:10px;display:grid;gap:8px;min-width:0}
.qrtf .grp{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.qrtf .bk{display:flex;flex-wrap:wrap;gap:6px}
.qrtf .bk button{font:inherit;font-size:.8rem;min-height:34px;padding:4px 11px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);cursor:pointer}
.qrtf .bk button[aria-pressed="true"]{border-color:var(--gold);background:var(--gold-soft);box-shadow:inset 0 -2px 0 var(--gold)}
.qrtf .bk button.no{color:var(--muted);opacity:.6}
.qrtf .tar{font-family:var(--f-ar);font-size:1.2rem;line-height:2;direction:rtl;text-align:right;white-space:pre-wrap;max-height:360px;overflow-y:auto;padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid var(--line);overflow-wrap:anywhere}
.qrtf .ten{font-size:.98rem;line-height:1.75;white-space:pre-wrap;max-width:76ch;padding:8px 12px;border-left:3px solid var(--turq);background:var(--turq-soft);border-radius:0 8px 8px 0}
.qrtf .mu{border-left-color:var(--gold);background:var(--gold-soft)}
.qrnow{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:20;display:flex;gap:8px;align-items:center;padding:8px 10px 8px 14px;border-radius:999px;background:var(--hdr1);color:var(--hdr-ink);border:1px solid var(--gold-hi);box-shadow:0 10px 30px -12px rgba(0,0,0,.6);max-width:calc(100vw - 24px);font-size:.85rem}
.qrnow b{font-family:var(--f-mono);font-weight:500;color:var(--gold-hi);white-space:nowrap}.qrnow span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.qrnow button{font:inherit;min-width:38px;min-height:38px;border-radius:50%;border:1px solid var(--gold-hi);background:transparent;color:var(--hdr-ink);cursor:pointer}
.qrhit{font:inherit;display:grid;gap:2px;text-align:left;width:100%;padding:10px 0;border:0;border-bottom:1px solid var(--line);background:none;color:var(--ink);cursor:pointer}
.qrhit .ar{font-size:1.2rem}.qrhit mark{background:var(--gold-soft);color:inherit;border-radius:3px}
.qrmk{display:flex;flex-wrap:wrap;gap:6px}
`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ── data: the text, the translations and the tafsīrs, carried gzip-compressed as base64 text (as in the Iḥyāʾ) ── */
let IDX=null; const FILES={};
async function qrJson(path){const r=await fetch(path); if(!r.ok) throw new Error(r.status+' '+path);
  let b=new Uint8Array(await r.arrayBuffer());
  if(b[0]!==0x1f&&b[0]!==0x7b&&b[0]!==0x5b){const t=new TextDecoder().decode(b).trim(); if(/^[A-Za-z0-9+/=\s]+$/.test(t.slice(0,200))){const bin=atob(t.replace(/\s+/g,'')); b=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i)}}
  if(b[0]===0x1f&&b[1]===0x8b) return JSON.parse(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
  return JSON.parse(new TextDecoder().decode(b))}
const qrIndex=()=>{if(!IDX) IDX=qrJson('quran/index.json').catch(e=>{IDX=null; throw e}); return IDX};
const qrLoad=f=>{if(!FILES[f]) FILES[f]=qrJson(f).catch(e=>{delete FILES[f]; throw e}); return FILES[f]};
/** the āyāt of a sūra: [{a, ar, tr, p, y, j, pg, sj, k}] */
async function qrSurah(n){const I=await qrIndex(), c=I.core.find(x=>n>=x.from&&n<=x.to); const d=await qrLoad(c.f);
  return (d[n]||[]).map(([a,ar,tr,p,y,j,pg,sj,k])=>({a,ar,tr,p,y,j,pg,sj:!!sj,k}))}
async function qrTafsir(book,n){const I=await qrIndex(), B=I.books[book]; if(!B) return []; const f=B.files.find(x=>n>=x.from&&n<=x.to); if(!f) return []; const d=await qrLoad(f.f); return d[n]||[]}
/** the entry that speaks of āya a (a passage may cover several āyāt) */
function qrEntryFor(entries,a,count){let k=-1; for(let i=0;i<entries.length;i++){if(entries[i][0]<=a) k=i; else break} if(k<0) return null;
  const from=entries[k][0], to=k+1<entries.length?entries[k+1][0]-1:count; if(a>to) return null; return {from,to,text:entries[k][1]}}
/* Arabic folded for search (marks and tatwīl out; the alifs, yā, tāʾ marbūṭa and hamza seats brought together) */
const fold=s=>String(s||'').normalize('NFC').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/[ٱأإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/\s+/g,' ').trim();
const QR_ALIAS={yasin:36,yaseen:36,'ya sin':36,kahf:18,mulk:67,rahman:55,waqia:56,waqiah:56,waqiaa:56,fatiha:1,fatihah:1,faatiha:1,baqara:2,baqarah:2,ikhlas:112,ikhlaas:112,falaq:113,nas:114,naas:114,kursi:2,'ayat al-kursi':2,muzzammil:73,jumua:62,jumuah:62,maryam:19,yusuf:12,taha:20,'ta ha':20,sharh:94,inshirah:94,qadr:97,kawthar:108,asr:103,dukhan:44,fath:48,nur:24,noor:24,hadid:57,sajda:32,sajdah:32};
const qrFold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[ʿʾ'’`-]/g,'').replace(/^(surat?|surah|sura)\s+/,'').replace(/^(al|an|ar|as|ash|at|ad|adh|az)\s*/,'').replace(/\s+/g,' ').trim();
function qrParseRef(q,meta){const t=String(q||'').trim(); let m=t.match(/^(?:q\.?\s*)?(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$/i);
  if(m){const s=+m[1],a=+m[2]; if(s>=1&&s<=114&&meta&&a>=1&&a<=meta[s-1].ayahs) return {s,a,to:m[3]?Math.min(+m[3],meta[s-1].ayahs):a}}
  if(/^\d{1,3}$/.test(t)&&+t>=1&&+t<=114) return {s:+t,a:1};
  if(/kurs/i.test(t)||/الكرسي/.test(t)) return {s:2,a:255,to:255};
  m=t.match(/^(.+?)\s+(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?$/); const name=m?m[1]:t, a=m?+m[2]:1;
  const f=qrFold(name); if(!f||/^\d+$/.test(f)) return null;
  const fa=fold(name).replace(/^سوره\s*/,'').replace(/^ال/,'');
  const hit=QR_ALIAS[f]||((meta||[]).find(x=>qrFold(x.en)===f||(fa.length>1&&fold(x.ar).replace(/^سوره\s*/,'').replace(/^ال/,'')===fa))||{}).n;
  return hit?{s:hit,a:Math.min(a,(meta[hit-1]||{}).ayahs||a),to:m&&m[3]?+m[3]:a}:null}

/* ── state ── */
const Q=Object.assign({s:null,tgt:null,tr:'p',tl:true,fs:30,book:'ajiba',rk:'alafasy',rep:1,slow:false},LSg('qrState',{}));
const qSave=()=>{const {tgt,...o}=Q; LSs('qrState',o)};
let MARKS=LSg('qrMarks',[]), MKDEL=LSg('qrMarksDel',{}), OPEN={}, ROWS=null, ROWS_S=null, HITS=null, QTXT='';

/* ☆ marks follow Al across devices: study/quran-marks {json:{marks:{'2:255':time}, del:{}}} — a union, with removals remembered */
let mkDb=null, mkTried=false;
async function mkSync(){try{if(!mkTried){mkTried=true; mkDb=await Promise.race([USE('db'),new Promise(r=>setTimeout(()=>r(null),8000))])} if(!mkDb) return;
  const ref=mkDb.doc('study/quran-marks'); const s=await ref.get(); let rem={marks:{},del:{}}; if(s.exists){try{rem=JSON.parse(s.data().json)||rem}catch(e){}}
  const loc={}; MARKS.forEach((k,i)=>loc[k]=LSg('qrMarkT',{})[k]||Date.now()-i);
  const all=Object.assign({},rem.marks||{},loc), del=Object.assign({},rem.del||{},MKDEL);
  for(const [k,t] of Object.entries(del)) if(all[k]&&all[k]<=t) delete all[k];
  const out=Object.entries(all).sort((a,b)=>b[1]-a[1]).map(x=>x[0]).slice(0,300);
  const changed=JSON.stringify(out)!==JSON.stringify(MARKS); MARKS=out; MKDEL=del; LSs('qrMarks',MARKS); LSs('qrMarksDel',MKDEL); LSs('qrMarkT',all);
  await ref.set({json:JSON.stringify({marks:all,del}),updated:new Date().toISOString()});
  if(changed&&tab==='read'&&curShelf()==='quran') draw()}catch(e){}}
function toggleMark(k){const T=LSg('qrMarkT',{}); if(MARKS.includes(k)){MARKS=MARKS.filter(x=>x!==k); MKDEL[k]=Date.now(); delete T[k]} else {MARKS=[k,...MARKS].slice(0,300); T[k]=Date.now(); delete MKDEL[k]}
  LSs('qrMarks',MARKS); LSs('qrMarksDel',MKDEL); LSs('qrMarkT',T); mkSync()}

/* ── the recitation: the three qurrāʾ from everyayah.com, one file a sūra (long sūras in parts), every āya's place known ── */
let RECIT=null;
const qrRecit=()=>{if(!RECIT) RECIT=(async()=>{let R; try{R=await (await fetch('quran/recit.json')).json()}catch(e){return null}
  let found=0, total=0; for(const [rk,t] of Object.entries(R.tracks)){let all=true; for(const ps of Object.values(t)) for(const p of ps){total++; p.url=p.id?'/_blob/'+p.id:null; if(p.url) found++; else all=false} R.reciters[rk].complete=all}
  R.found=found; R.total=total; return found?R:null})(); return RECIT};
const QA=(()=>{let el=null,stopAt=null,onTick=null,resolveCur=null,part=null,gen=0,busy=0,loading=false; const subs=new Set(), BLOBS=new Map();
  const S={playing:false,s:null,a:null,r:null,busy:false,err:''};
  const emit=()=>subs.forEach(f=>{try{f(Object.assign({},S))}catch(e){}});
  const get=()=>{if(!el){el=new Audio(); el.preload='auto'; el.addEventListener('timeupdate',tick); el.addEventListener('ended',()=>end(true)); el.addEventListener('pause',()=>{S.playing=false; emit()}); el.addEventListener('play',()=>{S.playing=true; emit()}); el.addEventListener('error',()=>end(false))} return el};
  const ayahAt=t=>{if(!part) return null; let a=part.ayat[0][0]; for(const [n,o] of part.ayat){if(o<=t+0.05) a=n; else break} return a};
  function tick(){const t=el.currentTime,a=ayahAt(t); if(a!==S.a){S.a=a; emit(); onTick&&onTick(a)} if(stopAt!=null&&t>=stopAt) end(true)}
  function end(ok){if(!el) return; const r=resolveCur; resolveCur=null; stopAt=null; try{el.pause()}catch(e){} S.playing=false; emit(); r&&r(ok)}
  async function trackOf(s,rk){const R=await qrRecit(); rk=rk||Q.rk; const ok=ps=>ps&&ps.length&&ps.every(p=>p.url);
    return R&&R.tracks?(ok(R.tracks[rk]&&R.tracks[rk][s])?R.tracks[rk][s]:ok(R.tracks.alafasy&&R.tracks.alafasy[s])?R.tracks.alafasy[s]:null):null}
  // a part is fetched whole and played from memory, so a jump to any āya always lands; the last few are kept
  async function blobUrl(u){if(BLOBS.has(u)) return BLOBS.get(u); let url; try{const r=await fetch(u); if(!r.ok) throw 0; const bl=await r.blob(); url=URL.createObjectURL(/^(audio|video)\//.test(bl.type)?bl:new Blob([bl],{type:'audio/webm'}))}catch(e){return null}
    BLOBS.set(u,url); if(BLOBS.size>4){const [k,v]=BLOBS.entries().next().value; URL.revokeObjectURL(v); BLOBS.delete(k)} return url}
  async function seg(P,from,to,g){const offs=P.ayat, i0=offs.findIndex(x=>x[0]===from), i1=offs.findIndex(x=>x[0]===to); if(i0<0||i1<0) return false;
    const e=get(); part=P; S.a=from; loading=true; emit();
    if(e.__u!==P.url){const url=await blobUrl(P.url); if(g!==gen) return false; if(!url) return null; e.__u=P.url; e.src=url; await new Promise(r=>{e.addEventListener('loadedmetadata',r,{once:true}); setTimeout(r,8000)})}
    if(g!==gen) return false;
    e.playbackRate=Q.slow?0.75:1; try{e.preservesPitch=true}catch(x){}
    e.currentTime=offs[i0][1]; stopAt=i1+1<offs.length?offs[i1+1][1]-0.05:null;
    const p=new Promise(r=>{resolveCur=r});
    const watch=setInterval(()=>{try{if(!e.paused) tick()}catch(x){}},40);   // the end of an āya watched every 40 ms, so the next never bleeds in
    try{await e.play()}catch(x){end(false)}
    loading=false; const ok=await p; clearInterval(watch); return ok}
  /** play āyāt from..to of sūra s; true when heard to the end, false if stopped, null if not carried */
  async function play(s,from,to,opts){opts=opts||{}; end(false); const g=++gen; busy=g; loading=true; S.busy=true; S.err=''; emit();
    const free=()=>{if(g===gen){busy=0; loading=false; S.busy=false; emit()}};
    const parts=await trackOf(s,opts.reciter); if(g!==gen) return false; if(!parts){S.err='The recitation of this sūra is not carried yet.'; free(); return null}
    const first=parts[0].a0, last=parts[parts.length-1].a1; from=from||first; to=to||last;
    S.s=s; S.r=opts.reciter||Q.rk; onTick=opts.onAyah||null; let ok=true;
    for(const P of parts){if(P.a1<from||P.a0>to) continue; const a=Math.max(from,P.a0), b=Math.min(to,P.a1); ok=await seg(P,a,b,g); if(ok===null&&g===gen){S.err='The recording could not be opened.'; break} if(!ok||g!==gen){ok=false; break}}
    if(g===gen){busy=0; loading=false; S.busy=false; emit()} return ok}
  const ayatOf=async s=>{const P=await trackOf(s).catch(()=>null); return P?new Set(P.flatMap(x=>x.ayat.map(y=>y[0]))):null};
  return {play,ayatOf,trackOf,stop:()=>{gen++; busy=0; loading=false; S.busy=false; end(false)},pause:()=>el&&el.pause(),resume:()=>el&&el.play().catch(()=>{}),
    rate:r=>{if(el) el.playbackRate=r},get state(){return Object.assign({},S)},get busy(){return !!busy&&(loading||!!(el&&!el.paused))},subscribe(f){subs.add(f); return ()=>subs.delete(f)}}})();
window.QRAudio=QA;   // other parts of the engine (al-Ḥalqa, the runner) may recite a verse by the qāriʾ through this
let AUD=null;        // the āyāt the chosen recitation carries for this sūra
async function playFrom(a,to){const s=Q.s; for(let k=0;k<Q.rep;k++){const ok=await QA.play(s,a,to,{onAyah:follow}); if(!ok) break}}
function follow(a){if(Q.s!==QA.state.s) return; document.querySelectorAll('.qra.now').forEach(x=>x.classList.remove('now')); const el=document.getElementById('qa-'+a); if(el){el.classList.add('now'); const r=el.getBoundingClientRect(); if(r.top<110||r.bottom>innerHeight-80) el.scrollIntoView({behavior:'smooth',block:'center'})}}
QA.subscribe(S=>{drawNow(S); document.querySelectorAll('[data-qrplay]').forEach(b=>{const on=(S.playing||S.busy)&&S.s===Q.s; b.textContent=on?'■ Stop':'▶ Recite the sūra'; b.classList.toggle('on',on)}); if(!(S.playing||S.busy)) document.querySelectorAll('.qra.now').forEach(x=>x.classList.remove('now')); const er=document.getElementById('qrErr'); if(er) er.textContent=S.err||''});
function drawNow(S){let b=document.getElementById('qrNow'); const on=(S.playing||S.busy)&&S.s;
  if(!on){if(b) b.remove(); return} if(!b){b=document.createElement('div'); b.id='qrNow'; b.className='qrnow'; b.setAttribute('role','status'); document.body.appendChild(b)}
  const meta=window.__qrMeta?window.__qrMeta[S.s-1]:null; const R=window.__qrRC;
  b.innerHTML='<b>'+(meta?E(meta.en)+' ':'')+S.s+':'+(S.a||'…')+'</b><span>'+E(R&&R.reciters[S.r]?R.reciters[S.r].name:'')+(S.busy&&!S.playing?' · opening…':'')+'</span><button aria-label="Go to the āya" id="qrNowGo">↧</button><button aria-label="Stop the recitation" id="qrNowStop">■</button>';
  const hm=[...document.querySelectorAll('.hqmini')].find(x=>x.offsetParent!==null); b.style.bottom=hm?'calc('+(innerHeight-hm.getBoundingClientRect().top+10)+'px + 0px)':'';
  b.querySelector('#qrNowStop').onclick=()=>QA.stop(); b.querySelector('#qrNowGo').onclick=()=>qrOpen(S.s,S.a||1)}

/* ── Claude: a faithful English rendering of one tafsīr, and al-Muʿallim's reading of a verse (kept once made) ── */
const RULE='Write Arabic in Arabic script with full vowels where you quote it, and give its transliteration and English. Never invent a quotation, a report or a page.';
const qrKey=(...x)=>'tq-'+x.join('-');
async function qrCached(key){const L=LSg('quranAi',{}); if(L[key]) return L[key]; try{const db=await USE('db'); if(db){const s=await db.doc('study/'+key).get(); if(s.exists){const d=s.data(); if(d&&d.text){L[key]=d; LSs('quranAi',L); return d}}}}catch(e){} return null}
async function qrKeep(key,v){const L=LSg('quranAi',{}); L[key]=v; const ks=Object.keys(L); if(ks.length>400) delete L[ks[0]]; LSs('quranAi',L); try{const db=await USE('db'); if(db) await db.doc('study/'+key).set(v)}catch(e){}}
async function qrRender(book,s,entry,rows){const key=qrKey(book,s,entry.from); const c=await qrCached(key); if(c) return c;
  const sm=await USE('sample'); if(!sm) throw {code:'no-sample'}; const I=await qrIndex(), B=I.books[book];
  const verses=rows.filter(r=>r.a>=entry.from&&r.a<=entry.to).map(r=>s+':'+r.a+' '+r.ar+'\n('+r.p+')').join('\n');
  const src=entry.text.length>14000?entry.text.slice(0,14000)+' […]':entry.text;
  const r=await sm.json([{role:'user',content:RULE+' Translate this classical Arabic tafsīr into clear, faithful English for a practitioner of the Shādhilī way. Source: '+B.title+', by '+B.author+', on Qurʾān '+s+':'+entry.from+(entry.to>entry.from?'–'+entry.to:'')+'. Translate; do not summarise or add. If it is longer than about 900 words, translate the parts that explain the verse and its inner meaning in full and mark each omission with […]. Keep the author\'s voice; render Qurʾān quotations with their reference; keep Divine Names and technical terms (dhikr, fanāʾ, maqām, ḥāl, nafs, rūḥ, sirr) in transliteration with a short gloss the first time. No markdown. Return JSON {"text": "..."}.\n\nThe verses:\n'+verses+'\n\nThe tafsīr:\n'+src}],{modelTier:'default',cache:false});
  const text=r&&(r.text||(r.data&&r.data.text)); if(!text) throw {code:'empty'};
  const v={text,book,s,from:entry.from,to:entry.to,at:Date.now()}; await qrKeep(key,v); return v}
async function qrReading(s,a,rows){const key=qrKey('muallim',s,a); const c=await qrCached(key); if(c) return c;
  const sm=await USE('sample'); if(!sm) throw {code:'no-sample'}; const I=await qrIndex(), row=rows.find(r=>r.a===a), parts=[];
  for(const b of ['jalalayn','qushayri','ajiba','haqqi','najmiyya','ibnarabi','sulami','tustari']){const En=qrEntryFor(await qrTafsir(b,s),a,rows.length); if(!En) continue;
    parts.push('=== '+I.books[b].title+' ('+I.books[b].author+') on '+s+':'+En.from+(En.to>En.from?'–'+En.to:'')+'\n'+En.text.slice(0,b==='haqqi'||b==='ajiba'?5000:2500))}
  const r=await sm.json([{role:'user',content:RULE+' You are al-Muʿallim, Al\'s teacher in the Shādhilī way (with love for the Naqshbandī masters and the Muḥammadan Reality). Give Al the reading of Qurʾān '+s+':'+a+' as a shaykh of the path would in a circle: plain spoken English, no markdown, 220–380 words. Order: (1) the plain sense, briefly, from al-Jalālayn; (2) the inner allusion (ishāra) from the masters below — name each master you draw on (al-Qushayrī, Ibn ʿAjība, Ismāʿīl Ḥaqqī, Najm al-Dīn, al-Qāshānī, al-Sulamī, al-Tustarī), paraphrased faithfully from the Arabic given, never an invented quotation; (3) what it asks of the heart today, and one small practice of adab or dhikr that rises from the verse. Say "by way of allusion" for inner readings; never set the inner against the outer. Return JSON {"text": "..."}.\n\nThe verse: '+(row?row.ar:'')+'\nPickthall: '+(row?row.p:'')+'\n\n'+parts.join('\n\n')}],{modelTier:'default',cache:false});
  const text=r&&(r.text||(r.data&&r.data.text)); if(!text) throw {code:'empty'};
  const v={text,s,a,at:Date.now()}; await qrKeep(key,v); return v}
const errText=e=>e&&e.code==='no-sample'?'This needs Claude — open the engine inside Claude.':e&&e.code==='rate_limited'?'Claude is busy — try again in a moment.':e&&e.code==='not_granted'?'Claude was not allowed for this page.':'Could not do it just now.';

/* English read aloud (translation only — never the Arabic) */
let TTS; async function tts(){if(TTS===undefined) TTS=await USE('tts'); return TTS}

/* ── drawing ── */
const view=()=>document.getElementById('view');
const curShelf=()=>window.kzShelf?window.kzShelf():'quran';
function shelf(){return window.kzShelfHTML?window.kzShelfHTML():''}
const setHash=h=>{try{history.replaceState(null,'','#'+h)}catch(e){}};
async function draw(){const v=view(); if(!v) return;
  v.innerHTML=shelf()+'<section class="box"><p class="empty">Opening the Qurʾān…</p></section>'; if(window.kzWireShelf) window.kzWireShelf(v);
  let I; try{I=await qrIndex()}catch(e){v.lastElementChild.innerHTML='<p class="empty">The Qurʾān\'s files could not be opened ('+E(e.message)+'). Reload to try again.</p>'; return}
  window.__qrMeta=I.meta; qrRecit().then(R=>{window.__qrRC=R});
  if(tab!=='read'||curShelf()!=='quran') return;
  document.documentElement.style.setProperty('--qrfs',Q.fs+'px'); const hd=document.querySelector('header'); if(hd) document.documentElement.style.setProperty('--hdrH',hd.offsetHeight+'px');
  return Q.s?drawSurah(I):drawList(I)}
function headHTML(){return '<section class="box"><div class="qrhead"><div><h2>al-Qurʾān <span class="ari">القرآن الكريم</span></h2><p class="meta" style="max-width:70ch;margin:4px 0 0">The text as written in the muṣḥaf, recited by Mishary Alafasy, al-Ḥuṣarī and al-Minshāwī, in Pickthall\'s and Yusuf Ali\'s English, every āya with its abjad — and read with the masters: al-Jalālayn and Ibn Kathīr for the plain sense; al-Qushayrī, Ibn ʿAjība, Ismāʿīl Ḥaqqī, Najm al-Dīn, al-Qāshānī, al-Sulamī and al-Tustarī for the inner.</p></div><form class="qrfind" id="qrF"><label for="qrQ" hidden>Find in the Qurʾān</label><input id="qrQ" type="search" placeholder="2:255 · Yasin 82 · al-Kahf · a word, English or Arabic" value="'+E(QTXT)+'" autocomplete="off"><button class="qrbtn pri" type="submit">Find</button></form></div><div id="qrHits"></div></section>'}
function wireHead(I){const f=document.getElementById('qrF'); f.onsubmit=e=>{e.preventDefault(); QTXT=document.getElementById('qrQ').value; search(I)}; if(HITS) drawHits(I)}
function drawList(I){setHash('read/quran'); const v=view();
  let h=shelf()+headHTML();
  if(MARKS.length) h+='<section class="box"><h2>Your marked verses</h2><div class="qrmk">'+MARKS.slice(0,60).map(k=>{const [x]=k.split(':').map(Number); return '<button class="qrbtn sm" data-qgo="'+k+'">☆ '+E(I.meta[x-1].en)+' '+k+'</button>'}).join('')+'</div></section>';
  const last=LSg('qrLast',null); if(last&&last.s) h+='<section class="box" style="gap:4px"><div class="qrbar"><span class="meta">Where you were:</span><button class="qrbtn" data-qgo="'+last.s+':'+(last.a||1)+'">'+E(I.meta[last.s-1].en)+' '+last.s+':'+(last.a||1)+' →</button><button class="qrbtn" data-qgo="18:1">al-Kahf (Friday)</button><button class="qrbtn" data-qgo="36:1">Yā Sīn</button><button class="qrbtn" data-qgo="67:1">al-Mulk</button><button class="qrbtn" data-qgo="2:255">Āyat al-Kursī</button></div></section>';
  else h+='<section class="box" style="gap:4px"><div class="qrbar"><span class="meta">Often read:</span><button class="qrbtn" data-qgo="18:1">al-Kahf (Friday)</button><button class="qrbtn" data-qgo="36:1">Yā Sīn</button><button class="qrbtn" data-qgo="56:1">al-Wāqiʿa</button><button class="qrbtn" data-qgo="67:1">al-Mulk</button><button class="qrbtn" data-qgo="2:255">Āyat al-Kursī</button></div></section>';
  h+='<section class="box"><div class="qrgrid">'+I.meta.map(m=>'<button class="qrsu" data-qgo="'+m.n+':1"><span class="n"><i>'+m.n+'</i></span><span style="min-width:0"><div class="en">'+E(m.en)+'</div><div class="mn">'+E(m.mean)+' · '+m.ayahs+' āyāt · '+(m.type==='Meccan'?'Makkan':'Madinan')+'</div></span><span class="ar" dir="rtl">'+E(m.ar.replace(/^سُورَةُ\s*/,''))+'</span></button>').join('')+'</div>';
  h+='<p class="meta" style="font-size:.78rem;margin-top:10px">Text: Tanzil Quran Text (Uthmani), tanzil.net — copied verbatim. Translations: M. M. Pickthall (1930) and A. Yusuf Ali (1934). Recitation: Mishary Rashid Alafasy, Maḥmūd Khalīl al-Ḥuṣarī and Muḥammad Ṣiddīq al-Minshāwī — the whole Qurʾān, murattal, via everyayah.com. Tafsīr: the classical Arabic texts as carried by altafsir.com. Abjad: Mashriqī, counted by the engine on the corpus\'s plain spelling (the same values as Reference → Verses).</p></section>';
  v.innerHTML=h; if(window.kzWireShelf) window.kzWireShelf(v); wireHead(I)}
async function search(I){const t=QTXT.trim(); if(!t){HITS=null; drawHits(I); return}
  const ref=qrParseRef(t,I.meta); if(ref){HITS=null; QTXT=''; return qrOpen(ref.s,ref.a)}
  HITS='…'; drawHits(I); const out=[], ar=/[\u0600-\u06FF]/.test(t), f=ar?fold(t):t.toLowerCase();
  for(const c of I.core){const d=await qrLoad(c.f); for(const [n,rs] of Object.entries(d)) for(const r of rs){if(out.length>=120) break; if(ar?fold(r[8]).includes(f):(r[3]+' '+r[4]).toLowerCase().includes(f)) out.push({s:+n,a:r[0],ar:r[1],p:r[3],y:r[4]})}}
  HITS=out; drawHits(I)}
function drawHits(I){const el=document.getElementById('qrHits'); if(!el) return; if(!HITS){el.innerHTML=''; return} if(HITS==='…'){el.innerHTML='<p class="empty">Searching all 6,236 āyāt…</p>'; return}
  const t=QTXT.trim(), ar=/[\u0600-\u06FF]/.test(t); const mk=s=>{if(ar) return E(s); const i=s.toLowerCase().indexOf(t.toLowerCase()); return i<0?E(s):E(s.slice(0,i))+'<mark>'+E(s.slice(i,i+t.length))+'</mark>'+E(s.slice(i+t.length))};
  el.innerHTML='<div class="qrbar" style="justify-content:space-between"><span class="meta">'+(HITS.length?HITS.length+(HITS.length>=120?'+':'')+' āyāt':'Nothing found — try another word, a reference (36:82) or a sūra name.')+'</span><button class="qrbtn sm" id="qrHx">close</button></div>'+HITS.map(x=>'<button class="qrhit" data-qgo="'+x.s+':'+x.a+'"><span class="num" style="color:var(--gold)">'+E(I.meta[x.s-1].en)+' '+x.s+':'+x.a+'</span><span class="ar" dir="rtl">'+E(x.ar)+'</span><span class="meta">'+mk(ar?x.p:((x.p+' ').toLowerCase().includes(t.toLowerCase())?x.p:x.y))+'</span></button>').join('');
  document.getElementById('qrHx').onclick=()=>{HITS=null; QTXT=''; const q=document.getElementById('qrQ'); if(q) q.value=''; drawHits(I)}}
async function drawSurah(I){const s=Q.s, M=I.meta[s-1]; setHash('read/quran/'+s+(Q.tgt?'/'+Q.tgt:'')); const v=view();
  let h=shelf()+headHTML();
  h+='<section class="box qrsec" style="gap:10px"><div class="qrcart"><div class="t" dir="rtl">'+E(M.ar)+'</div><div class="s">'+M.n+'. '+E(M.en)+' — '+E(M.mean)+'</div><div class="m">'+(M.type==='Meccan'?'Makkan':'Madinan')+' · '+M.ayahs+' āyāt</div><div class="qrbar" style="justify-content:center;margin-top:6px" id="qrRec"><span class="meta">Opening the recitation…</span></div><div class="meta" id="qrErr" style="color:var(--warn)"></div></div>';
  h+='</section>';
const TB='<div class="qrtools"><div class="qrbar"><button class="qrbtn sm" id="qrAll">← all sūras</button><button class="qrbtn sm" id="qrPrev"'+(s<=1?' disabled':'')+'>‹ '+(s>1?E(I.meta[s-2].en):'')+'</button><button class="qrbtn sm" id="qrNext"'+(s>=114?' disabled':'')+'>'+(s<114?E(I.meta[s].en):'')+' ›</button><label for="qrTr" hidden>Translation</label><select id="qrTr"><option value="p"'+(Q.tr==='p'?' selected':'')+'>Pickthall</option><option value="y"'+(Q.tr==='y'?' selected':'')+'>Yusuf Ali</option><option value="b"'+(Q.tr==='b'?' selected':'')+'>both translations</option><option value=""'+(Q.tr===''?' selected':'')+'>Arabic only</option></select><button class="qrbtn sm" id="qrTl" aria-pressed="'+!!Q.tl+'">transliteration</button><button class="qrbtn sm" id="qrFm" aria-label="Smaller Arabic">A−</button><button class="qrbtn sm" id="qrFp" aria-label="Larger Arabic">A+</button><label for="qrGo" hidden>Go to āya</label><input id="qrGo" type="number" min="1" max="'+M.ayahs+'" placeholder="āya" style="width:76px;min-height:34px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);font:inherit;font-size:.8rem"></div></div>';
  h+='<section class="box qrsec" style="gap:8px">'+TB+'<div id="qrBody" style="display:grid;gap:8px;min-width:0"><p class="empty">…</p></div></section>';
  v.innerHTML=h; if(window.kzWireShelf) window.kzWireShelf(v); wireHead(I);
  const go=n=>{QA.stop(); OPEN={}; Q.s=n; Q.tgt=null; qSave(); draw(); window.scrollTo(0,0)};
  document.getElementById('qrAll').onclick=()=>{QA.stop(); Q.s=null; Q.tgt=null; qSave(); draw(); window.scrollTo(0,0)};
  document.getElementById('qrPrev').onclick=()=>s>1&&go(s-1); document.getElementById('qrNext').onclick=()=>s<114&&go(s+1);
  document.getElementById('qrTr').onchange=e=>{Q.tr=e.target.value; qSave(); body()};
  document.getElementById('qrTl').onclick=e=>{Q.tl=!Q.tl; qSave(); e.currentTarget.setAttribute('aria-pressed',Q.tl); body()};
  const fs=d=>{Q.fs=Math.max(20,Math.min(52,Q.fs+d)); qSave(); document.documentElement.style.setProperty('--qrfs',Q.fs+'px')};
  document.getElementById('qrFm').onclick=()=>fs(-3); document.getElementById('qrFp').onclick=()=>fs(3);
  document.getElementById('qrGo').onchange=e=>{const a=Math.max(1,Math.min(M.ayahs,+e.target.value||1)); Q.tgt=a; scrollTo(a)};
  if(ROWS_S!==s){ROWS=null; try{ROWS=await qrSurah(s); ROWS_S=s}catch(e){document.getElementById('qrBody').innerHTML='<p class="empty">This sūra did not load ('+E(e.message)+').</p>'; return}}
  if(Q.s!==s||tab!=='read') return;
  body(); recBar(I);
  if(Q.tgt) setTimeout(()=>scrollTo(Q.tgt),80)}
function scrollTo(a){const el=document.getElementById('qa-'+a); if(el){document.querySelectorAll('.qra.tg').forEach(x=>x.classList.remove('tg')); el.classList.add('tg'); el.scrollIntoView({behavior:'smooth',block:'center'})} LSs('qrLast',{s:Q.s,a})}
async function recBar(I){const el=document.getElementById('qrRec'); if(!el) return; const R=await qrRecit(); window.__qrRC=R; AUD=await QA.ayatOf(Q.s); if(!document.getElementById('qrRec')) return;
  if(!R||!AUD){el.innerHTML='<span class="meta">The qurrāʾ\'s recordings are being copied into this engine; until they arrive the text, translations and tafsīr are complete here. The Arabic is never given to a machine voice.</span>'; body(); return}
  const S=QA.state, on=(S.playing||S.busy)&&S.s===Q.s;
  el.innerHTML='<button class="qrbtn pri'+(on?' on':'')+'" data-qrplay="1">'+(on?'■ Stop':'▶ Recite the sūra')+'</button><label for="qrRk" hidden>The qāriʾ</label><select id="qrRk">'+Object.entries(R.reciters).map(([k,r])=>'<option value="'+k+'"'+(Q.rk===k?' selected':'')+(r.complete?'':' disabled')+'>'+E(r.name)+(r.complete?'':' (coming)')+'</option>').join('')+'</select><label for="qrRep" hidden>Repeat</label><select id="qrRep" title="Repeat each time (for memorising)">'+[1,3,7,11,100].map(n=>'<option value="'+n+'"'+(Q.rep===n?' selected':'')+'>'+(n===1?'once':'×'+n)+'</option>').join('')+'</select><button class="qrbtn sm" id="qrSlow" aria-pressed="'+!!Q.slow+'">slow</button>';
  el.querySelector('[data-qrplay]').onclick=()=>{const S=QA.state; if((S.playing||S.busy)&&S.s===Q.s) QA.stop(); else playFrom(null,null)};
  document.getElementById('qrRk').onchange=e=>{QA.stop(); Q.rk=e.target.value; qSave(); recBar(I)};
  document.getElementById('qrRep').onchange=e=>{Q.rep=+e.target.value; qSave()};
  document.getElementById('qrSlow').onclick=e=>{Q.slow=!Q.slow; qSave(); e.currentTarget.setAttribute('aria-pressed',Q.slow); QA.rate(Q.slow?0.75:1)};
  body()}
function ayahHTML(r){const s=Q.s, k=s+':'+r.a, mk=MARKS.includes(k), o=!!OPEN[r.a], ab=ABJF(r.k); const S=QA.state, now=(S.playing||S.busy)&&S.s===s&&S.a===r.a; const has=AUD&&AUD.has(r.a);
  let h='<article class="qra'+(now?' now':'')+(Q.tgt===r.a?' tg':'')+'" id="qa-'+r.a+'" data-a="'+r.a+'"><div class="qar">'+E(r.ar)+' <span class="qno">﴿'+IND(r.a)+'﴾</span>'+(r.sj?' <span class="sj">۩ sajda</span>':'')+'</div>';
  if(Q.tl) h+='<div class="qtl">'+E(String(r.tr||'').replace(/<[^>]+>/g,''))+'</div>';
  if(Q.tr==='p'||Q.tr==='b') h+='<div class="qen"><span class="k">'+k+'</span>'+E(r.p)+'</div>';
  if(Q.tr==='y'||Q.tr==='b') h+='<div class="qen'+(Q.tr==='b'?' y':'')+'">'+(Q.tr==='y'?'<span class="k">'+k+'</span>':'<span class="meta">Yusuf Ali: </span>')+E(r.y)+'</div>';
  h+='<div class="qrbar">'+(has?'<button class="qrbtn sm" data-qra="one">'+(now?'■':'▶ recite')+'</button><button class="qrbtn sm" data-qra="from">▶ from here</button>':'')+'<button class="qrbtn sm" data-qra="tf" aria-pressed="'+o+'">'+(o?'close the tafsīr':'tafsīr · the masters')+'</button><button class="qrbtn sm" data-qra="mk" aria-pressed="'+mk+'">'+(mk?'★ marked':'☆ mark')+'</button><button class="qrbtn sm" data-qra="say" hidden>🔊 translation</button><button class="qrbtn sm" data-qra="ask">✦ Ask</button></div>';
  h+='<div class="qmeta"><span class="ab" title="Mashriqī abjad of the āya in the corpus\'s plain spelling">abjad '+ab.total+' · '+ab.letters+' letters</span><span>juzʾ '+r.j+'</span><span>page '+r.pg+'</span></div>';
  if(o) h+='<div class="qrtf" id="qtf-'+r.a+'"><p class="empty">Opening the tafsīr…</p></div>';
  return h+'</article>'}
function body(){const el=document.getElementById('qrBody'); if(!el||!ROWS) return; const s=Q.s;
  el.innerHTML=(s!==1&&s!==9?'<div class="qrbsm" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>':'')+ROWS.map(ayahHTML).join('');
  el.querySelectorAll('[data-qra]').forEach(b=>b.onclick=()=>act(b.dataset.qra,+b.closest('.qra').dataset.a,b));
  tts().then(t=>{if(t) el.querySelectorAll('[data-qra="say"]').forEach(b=>b.hidden=false)});
  Object.keys(OPEN).forEach(a=>OPEN[a]&&tafsir(+a))}
function act(k,a,b){const s=Q.s, row=ROWS.find(r=>r.a===a); LSs('qrLast',{s,a});
  if(k==='one'){const S=QA.state; if((S.playing||S.busy)&&S.s===s&&S.a===a) QA.stop(); else playFrom(a,a); return}
  if(k==='from') return playFrom(a,null);
  if(k==='tf'){OPEN[a]=!OPEN[a]; const art=document.getElementById('qa-'+a); art.outerHTML=ayahHTML(row); const n=document.getElementById('qa-'+a); n.querySelectorAll('[data-qra]').forEach(x=>x.onclick=()=>act(x.dataset.qra,a,x)); tts().then(t=>{if(t) n.querySelectorAll('[data-qra="say"]').forEach(x=>x.hidden=false)}); if(OPEN[a]) tafsir(a); return}
  if(k==='mk'){toggleMark(s+':'+a); const on=MARKS.includes(s+':'+a); b.setAttribute('aria-pressed',on); b.textContent=on?'★ marked':'☆ mark'; return}
  if(k==='say'){tts().then(t=>{if(!t) return; const txt=Q.tr==='y'?row.y:row.p; t.speak(String(txt).slice(0,2000),{language:'en'}).catch(()=>{})}); return}
  if(k==='ask'&&typeof askAbout==='function') askAbout('Explain Qurʾān '+s+':'+a+' ('+(window.__qrMeta?window.__qrMeta[s-1].en:'')+'): the plain sense, what the masters of the inner reading say (use read_quran with the tafsīrs), its abjad, and where my sources (the Iḥyāʾ, Kunūz, the Teacher Library) use this āya.')}
async function tafsir(a){const box=document.getElementById('qtf-'+a); if(!box) return; const s=Q.s, rows=ROWS; const I=await qrIndex();
  const av={}; await Promise.all(Object.keys(I.books).map(async b=>{try{av[b]=qrEntryFor(await qrTafsir(b,s),a,rows.length)}catch(e){av[b]=null}}));
  if(!document.getElementById('qtf-'+a)||Q.s!==s) return;
  const book=I.books[Q.book]?Q.book:'jalalayn', B=I.books[book], En=av[book];
  let h=[['zahir','The plain sense'],['ishara','The inner reading — the masters']].map(([g,gl])=>'<div class="grp">'+gl+'</div><div class="bk">'+Object.entries(I.books).filter(([,x])=>x.kind===g).map(([k,x])=>'<button data-qbk="'+k+'" aria-pressed="'+(k===book)+'" class="'+(av[k]?'':'no')+'" title="'+E(x.author+' — '+x.about)+'">'+E(x.title)+(av[k]?'':' ·')+'</button>').join('')+'</div>').join('');
  h+='<div class="meta">'+E(B.author)+' — '+E(B.about)+'</div>';
  if(!En) h+='<p class="meta">'+E(B.title)+' says nothing on this āya in the copy carried here — try another master'+(Object.values(av).some(Boolean)?' (those marked without · speak on it)':'')+'.</p>';
  else {h+='<div class="num" style="color:var(--gold)">on '+s+':'+En.from+(En.to>En.from?'–'+En.to:'')+'</div><div class="tar" dir="rtl">'+E(En.text)+'</div><div class="qrbar"><button class="qrbtn sm" data-qtf="en">In English</button><button class="qrbtn sm" data-qtf="mu">Teach me this verse</button></div><div data-qout="en"></div>'}
  if(!En) h+='<div class="qrbar"><button class="qrbtn sm" data-qtf="mu">Teach me this verse</button></div>';
  h+='<div data-qout="mu"></div><div class="meta" data-qerr style="color:var(--warn)"></div>';
  box.innerHTML=h;
  box.querySelectorAll('[data-qbk]').forEach(x=>x.onclick=()=>{Q.book=x.dataset.qbk; qSave(); tafsir(a)});
  const out=(k,v,label)=>{const o=box.querySelector('[data-qout="'+k+'"]'); if(o) o.innerHTML='<div class="meta" style="font-size:.78rem">'+E(label)+'</div><div class="ten'+(k==='mu'?' mu':'')+'">'+E(v.text)+'</div>'+(TTS?'<div class="qrbar"><button class="qrbtn sm" data-qsay="'+k+'">🔊 read the English</button></div>':''); const sb=o&&o.querySelector('[data-qsay]'); if(sb) sb.onclick=()=>TTS.speak(englishOnly(v.text).slice(0,2000),{language:'en'}).catch(()=>{})};
  const enLbl='English rendering by Claude from '+B.title+' — faithful, not the author\'s own English', muLbl='al-Muʿallim\'s reading by Claude, drawn from the masters\' Arabic above — a teaching, not the masters\' own words';
  if(En) qrCached(qrKey(book,s,En.from)).then(c=>{if(c){out('en',c,enLbl); const b=box.querySelector('[data-qtf="en"]'); if(b) b.hidden=true}});
  qrCached(qrKey('muallim',s,a)).then(c=>{if(c){out('mu',c,muLbl); const b=box.querySelector('[data-qtf="mu"]'); if(b) b.hidden=true}});
  box.querySelectorAll('[data-qtf]').forEach(x=>x.onclick=async()=>{const k=x.dataset.qtf, er=box.querySelector('[data-qerr]'); er.textContent=''; x.disabled=true; const old=x.textContent; x.textContent=k==='en'?'translating…':'the teacher is reading…';
    try{const v=k==='en'?await qrRender(book,s,En,rows):await qrReading(s,a,rows); await tts(); out(k,v,k==='en'?enLbl:muLbl); x.hidden=true}catch(e){er.textContent=errText(e); x.disabled=false; x.textContent=old}})}

/* ── opening from anywhere: qrOpen(s, a) ── */
function qrOpen(s,a){s=+s; a=+a||1; if(!(s>=1&&s<=114)) return; if(window.kzSetShelf) window.kzSetShelf('quran'); if(Q.s!==s) OPEN={}; Q.s=s; Q.tgt=a; qSave(); LSs('qrLast',{s,a});
  if(tab==='read'&&document.getElementById('qrBody')&&ROWS_S===s){scrollTo(a); return} tab='read'; render(); window.scrollTo(0,0)}
window.qrOpen=qrOpen; window.qrRender=draw;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-qgo],[data-qr]'); if(!b) return; e.preventDefault(); const [s,a]=String(b.dataset.qgo||b.dataset.qr).split(':').map(x=>parseInt(x,10)); HITS=null; qrOpen(s,a)});
mkSync();

/* ── Ask: read verses with the masters' tafsīr, and open the Qurʾān ── */
async function readQuran(i){const I=await qrIndex(); const ref=qrParseRef(String(i.ref||''),I.meta);
  if(!ref&&i.query){const out=[], t=String(i.query), ar=/[\u0600-\u06FF]/.test(t), f=ar?fold(t):t.toLowerCase();
    for(const c of I.core){const d=await qrLoad(c.f); for(const [n,rs] of Object.entries(d)) for(const r of rs) if(ar?fold(r[8]).includes(f):(r[3]+' '+r[4]).toLowerCase().includes(f)){out.push({ref:n+':'+r[0],ar:r[1],pickthall:r[3],abjad:ABJF(r[8]).total}); if(out.length>=20) return {verses:out}}}
    return {verses:out}}
  if(!ref) throw new Error('give ref like 2:255 or a query');
  const rows=await qrSurah(ref.s), from=ref.a, to=Math.min(ref.to||ref.a,from+9);
  const verses=rows.filter(r=>r.a>=from&&r.a<=to).map(r=>({ref:ref.s+':'+r.a,ar:r.ar,transliteration:String(r.tr||'').replace(/<[^>]+>/g,''),pickthall:r.p,yusuf_ali:r.y,abjad:ABJF(r.k).total,letters:ABJF(r.k).letters,juz:r.j,page:r.pg,sajda:r.sj||undefined}));
  const books=i.tafsir?[].concat(i.tafsir):['jalalayn']; const tafsir={};
  for(const b of books){if(!I.books[b]) continue; const En=qrEntryFor(await qrTafsir(b,ref.s),from,rows.length); if(En) tafsir[b]={title:I.books[b].title,author:I.books[b].author,on:ref.s+':'+En.from+'-'+En.to,arabic:En.text.slice(0,6000)}}
  return {surah:I.meta[ref.s-1].en,verses,tafsir,books_available:Object.fromEntries(Object.entries(I.books).map(([k,b])=>[k,b.title+' — '+b.author]))}}
const QTOOLS=[
 {name:'read_quran',description:'Read Qurʾān verses (Tanzil Uthmani text, transliteration, Pickthall and Yusuf Ali, the abjad of each āya, juzʾ and page) by ref ("2:255", "36:82-83", "Yasin 82", "al-Kahf"), or search by query (Arabic or English words) for up to 20 āyāt. With tafsir (one or more of jalalayn, ibnkathir, qushayri, ajiba, haqqi, najmiyya, ibnarabi, sulami, tustari) returns that master\'s Arabic commentary on the passage.',inputSchema:{type:'object',properties:{ref:{type:'string'},query:{type:'string'},tafsir:{type:'array',items:{type:'string'}}}},
  execute:async i=>{if(typeof prog==='function') prog('Reading the Qurʾān'+(i.ref?' '+i.ref:'')); return readQuran(i)}},
 {name:'open_quran',description:'Open the Qurʾān reader (Read → Qurʾān) at a sūra and āya for Al, e.g. to show him the verse with its tafsīrs and recitation.',inputSchema:{type:'object',properties:{surah:{type:'number'},ayah:{type:'number'}},required:['surah']},
  execute:i=>{setTimeout(()=>qrOpen(i.surah,i.ayah||1),400); return {opened:i.surah+':'+(i.ayah||1)}}}];
if(typeof AITOOLS!=='undefined') AITOOLS.push(...QTOOLS);
})();
