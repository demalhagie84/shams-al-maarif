/* ===== Kunūz al-Dhikr inside the merged engine — port 6, part 6 (2026-11-22): the Ustādh.
   A vanilla-JS port of Kunūz al-Dhikr's ustadh() (index.html, "Ustādh" view) and the index it searches with (buildIdx,
   scoreE, searchIdx, search — "one index for everything"), merged into Ask as a second teacher beside the engine.
   Kept from B, verbatim: the Ustādh's instructions (its persona, the rule to search before answering, citing refs like
   (post #925) or (Sharḥ p.80), "texts are not idhn", multiple-choice quizzes one question at a time, no operable steps
   for harm-directed work), its six suggested questions, its three tools — search_corpus (B's ranking over the Dīwān
   posts, the three awrād books line by line, the Sharḥ, Rev5 and the practices and teachings), search_sohbahs (B's word
   index, five sohbahs with 1,600 characters around the first match) and get_post — and its 40-message conversation.
   Better than B: the engine's readers as tools (read and open the awrād, the Dīwān and the sohbahs), the conversation
   kept in the database so it follows Al across devices, every cited post, sohbah, Sharḥ/Rev5 page, Iḥyāʾ page and
   operation tappable in the answer, quiz answers as buttons, and "Ask the Ustādh" from the Kunūz readers.
   2026-11-22 (Al's instruction): the four Ḥizb al-Baḥr lines once withheld are indexed again and the seven working-book entries
   are restored from the edition; the instruction on such entries now asks for the edition's text with its restrictions.
   Differences, on purpose:
   the channel's PDF books (B's library.json) and documents (docs.json) joined search_corpus with the Maktaba port
   (2026-11-22), as in B; a book hit opens the Maktaba at its page (read_maktaba_page / open_maktaba). ===== */
(function(){
'use strict';
/* ── B's normaliser and query terms, exactly ── */
const N_STRIP=/[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed\u0640\u02be\u02bf\u02bb\u02bc\u2018\u2019'`\u00b4]/g;
const N_MAP={'ٱ':'ا','ة':'ه','ى':'ي','ک':'ك','ی':'ي','ھ':'ه','ہ':'ه'};
const bn=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(N_STRIP,'').replace(/[ٱةىکیھہ]/g,c=>N_MAP[c]);
const N_STOP=new Set(['the','and','of','to','in','is','for','on','al','wa']);
function qterms(q){const t=[...new Set(bn(q).split(/[^a-z0-9ء-ي]+/).filter(w=>w.length>1))]; const s=t.filter(w=>!N_STOP.has(w)); return s.length?s:t}
const NC=new Map(); const nch=c=>{let v=NC.get(c); if(v===undefined){v=bn(c); NC.set(c,v)} return v};
function nmap(text){let n=''; const map=[]; for(let i=0;i<text.length;i++){const c=nch(text[i]); for(let j=0;j<c.length;j++){n+=c[j]; map.push(i)}} return {n,map}}
function firstHit(text,terms){const {n,map}=nmap(text); let best=-1; for(const t of terms){const i=n.indexOf(t); if(i>-1&&(best<0||i<best)) best=i} return best<0?-1:map[best]}
const held=(k,si,bi)=>window.kzAwHeld?window.kzAwHeld(k,si,bi):null;

/* ── the data B's index reads, from this engine's copies ── */
const J={}; const jget=p=>J[p]||(J[p]=fetch(p).then(r=>{if(!r.ok) throw new Error(p); return r.json()}).catch(e=>{delete J[p]; throw e}));
let D=null, DP=null;
function loadD(){if(D) return Promise.resolve(D); return DP||(DP=Promise.all([jget('kunuz/posts.json'),window.KZBK.all(),jget('kunuz/sharh.json'),jget('kunuz/rev5.json'),jget('kunuz/practices.json'),jget('kunuz/library.json').catch(()=>null),jget('kunuz/docs.json').catch(()=>[])]).then(([posts,books,sharh,rev5,prac,library,docs])=>(D={posts,books,sharh,rev5,prac,library,docs})).catch(e=>{DP=null; throw e}))}

/* ── B's "one index for everything" (buildIdx, scoreE, searchIdx), verbatim but for the held lines ── */
let IDX=null;
function buildIdx(){IDX=[]; const add=e=>{e.n=bn(e.x); e.tn=bn(e.title); IDX.push(e)};
  for(const p of D.posts||[]){const t=[p.x,p.lt,p.ld,p.doc].filter(Boolean).join(' · '); if(t.length>3) add({k:'post',title:'Post #'+p.i+' · '+p.d+(p.lt?' · '+p.lt:''),ref:'post #'+p.i+' ('+p.d+')',x:t,go:'diwan-'+p.i,pid:p.i})}
  for(const [bk,B] of Object.entries(D.books)) B.sections.forEach((s,si)=>{const go='awrad-'+bk+'-'+si, title=B.tariqa+' · '+s.title, ref=B.title+' › '+s.title;
    add({k:'awrad',title,ref,x:[s.title,s.ar,s.num].filter(Boolean).join(' · '),go,bk,si,bi:0,head:1});
    let u=null; (s.blocks||[]).forEach((b,bi)=>{if(held(bk,si,bi)){u=null; return}
      if(b.t==='ar'){u={k:'awrad',title,ref,x:b.x,go,bk,si,bi,ar:1}; IDX.push(u); return}
      if((b.t==='tl'||b.t==='en')&&u){u.x+='\n'+b.x; return}
      if(b.t==='entry'){add({k:'awrad',title,ref,x:[b.title,b.withheld?'':b.formula,b.withheld?'':b.method,(b.tags||[]).join(' ')].filter(Boolean).join(' · '),go,bk,si,bi,withheld:!!b.withheld}); return}
      if(b.x) add({k:'awrad',title,ref,x:b.x,go,bk,si,bi})})});
  for(const e of IDX) if(e.n===undefined){e.n=bn(e.x); e.tn=bn(e.title)}
  D.sharh.pages.forEach((p,i)=>add({k:'sharh',title:'Sharḥ Ḥizb al-Baḥr · p.'+p.n,ref:'Sharḥ Ḥizb al-Baḥr p.'+p.n,x:p.x,go:'awrad-sharh-'+i}));
  D.rev5.pages.forEach((p,i)=>add({k:'sharh',title:'Rev5 compilation · p.'+p.n,ref:'Rev5 compilation p.'+p.n,x:p.x,go:'awrad-rev5-'+i}));
  for(const b of D.library||[]) b.pages.forEach((p,i)=>{if(!p.w&&p.x&&p.x.length>60) add({k:'book',title:b.t+' · p.'+p.n,ref:b.t+' p.'+p.n+' (DhikrNotes #'+b.post+')',x:p.x,go:'maktaba-'+b.k+'-'+(i+1)})});
  for(const o of [...D.prac.daily,...D.prac.occasions]) add({k:'amal',title:o.title,ref:'Practice: '+o.title+' (posts '+(o.src||[]).join(',')+')',x:[o.when,o.title,...(o.steps||[]),o.note,o.notext].filter(Boolean).join('\n'),go:'amal-'+o.id});
  D.prac.teachings.forEach((t,i)=>add({k:'amal',title:'Teaching · '+t.t,ref:'Teaching: '+t.t,x:t.x,go:'amal-t-'+i}));
  for(const d of D.docs) add({k:'doc',title:d.name,ref:'Document: '+d.name+' (posts '+d.posts.join(',')+')',x:[d.name,d.desc].filter(Boolean).join('\n'),go:'kutub'});
}
function scoreE(e,terms,phrase){let s=0,hit=0; const th=e.head||e.k==='post'||e.k==='amal'||e.k==='doc'; for(const t of terms){let i=e.n.indexOf(t),c=0; while(i>-1&&c<6){c++; i=e.n.indexOf(t,i+t.length)} if(c){hit++; s+=1+Math.log(c)} if(e.tn.includes(t)){if(c) s+=th?1.5:.3; else if(th){s+=1; hit++}}}
  if(!hit) return null; if(phrase&&e.n.includes(phrase)) s+=4; if(e.head) s+=1; return {s,all:hit>=terms.length}}
function searchIdx(q){if(!IDX) buildIdx(); const terms=qterms(q); if(!terms.length) return {terms,res:[]}; const phrase=terms.length>1?bn(q).trim().replace(/\s+/g,' '):'';
  let res=[]; for(const e of IDX){const r=scoreE(e,terms,phrase); if(r) res.push([r.s,e,r.all])}
  if(res.some(r=>r[2])) res=res.filter(r=>r[2]); res.sort((a,b)=>b[0]-a[0]); return {terms,res}}
/* the teacher's tool: best passages with their refs; an awrād hit carries the lines that follow it (B's search()) */
function search(q,k){k=k||8; const {res}=searchIdx(String(q||'')); const out=[], seen=[];
  for(const [s,e] of res){if(out.length>=k) break; if(e.k==='doc') continue;
    if(e.k==='awrad'){if(seen.some(o=>o.go===e.go&&Math.abs(o.bi-e.bi)<14)) continue; seen.push(e); const bl=D.books[e.bk].sections[e.si].blocks; let t='';
      for(let i=e.bi;i<bl.length&&t.length<1600;i++){const b=bl[i]; if(held(e.bk,e.si,i)){t+='['+held(e.bk,e.si,i)+' — method withheld: aimed at another person]\n'; continue} t+=(b.t==='entry'?[b.title,b.withheld?'(method withheld: harm-directed)':b.formula,b.withheld?'':b.method].filter(Boolean).join(' — '):b.x||'')+'\n'}
      out.push({ref:e.ref,text:t.slice(0,1600),open:{book:e.bk,section:e.si,line:e.bi}}); continue}
    const o={ref:e.ref,text:e.x.slice(0,1600)}; if(e.k==='post') o.open={book:'diwan',section:e.pid}; else if(e.k==='book') o.open={book:'maktaba',section:e.go.replace(/^maktaba-/,'')}; else if(e.k==='sharh') o.open={book:e.go.split('-')[1],section:+e.go.split('-')[2]}; out.push(o)}
  return out}
async function searchReady(q,k){try{await loadD()}catch(e){} if(!D) return {error:'the Kunūz texts did not load'}; return search(q,k)}

/* ── the Ustādh's instructions (B, verbatim) and what the merged engine adds ── */
const SYS=`You are the Ustādh of "Kunūz al-Dhikr", a personal study engine built from Amin Patel's DhikrNotes Telegram channel (Naqshbandī-Ḥaqqānī, with Shādhilī, Qādirī, Akbarī, Tijānī, Chishtī material), his web editions of the Naqshbandī awrād + Dalāʾil al-Khayrāt, al-Ṣalāt al-Kubrā + Qādirī awrād, Ḥizb al-Baḥr + Shādhilī aḥzāb, and the English Sharḥ Ḥizb al-Baḥr of Shāh Walī Allāh Dihlawī. The student is Al, a practitioner on a Shādhilī/Chishtī-adjacent and Naqshbandī path who has his shaykh's idhn for some Naqshbandī awrād and keeps his practice within the bounds of Sufi orders' awrād.
Rules: ALWAYS call search_corpus before answering (and search_sohbahs for questions on Mawlana Shaykh Nazim's teaching) (several times with different keywords if useful) and ground every claim in the results, citing refs like (post #925) or (Sharḥ p.80). If the corpus is silent, say so plainly, then you may add brief classical context (al-Ghazālī, Ibn ʿArabī, al-Shādhilī, the Naqshbandī masters) clearly marked as outside the channel. When Al asks for a litany, a duʿāʾ or an entry of the editions (the aḥzāb, the working book), quote it exactly as the edition prints it — nothing cut or softened — with the compiler's own restriction and the tradition's caution: only against an actual oppressor, never the innocent, and under a teacher's idhn. Remind that texts are not idhn when he asks about ʿamaliyyāt. Quizzes are multiple choice only, one question at a time, wait for his answer. Use transliteration with diacritics; keep answers focused and warm. Plain text, no markdown headings.
In this merged engine you can also read a whole awrād section (read_awrad_section), a whole post (get_post), sohbah (read_sohbah) or page of a channel book (read_maktaba_page), and open them for Al in the reader (open_awrad, open_diwan, open_sohbah, open_maktaba). Cite sohbahs as (Sohbah #n) with the number search_sohbahs gives. For a quiz, put each choice on its own line as "A) …", "B) …", "C) …", "D) …".`;
const SUGG=['What is my daily wird according to the channel?','How do I recite Ḥizb al-Wiqāya for a weighty matter?','What should I do on the last Wednesday of Ṣafar?','Teach me the meaning of Kāf Hā Yā ʿAyn Ṣād in Ḥizb al-Baḥr','What does the Sharḥ say about the conditions for the ḥizb?','Quiz me (multiple choice) on Naqshbandi awrād'];
const TOOLS=[
 {name:'search_corpus',description:'Keyword search over the DhikrNotes posts, the three books of awrād (English + transliteration), the Sharḥ Ḥizb al-Baḥr, and curated practices. Returns up to 8 passages with refs.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query']},
  execute:async({query})=>{if(typeof prog==='function') prog('Searching the treasury: '+query); return searchReady(String(query||''))}},
 {name:'search_sohbahs',description:'Full-text search of 2,302 sohbahs of Mawlana Shaykh Nazim (1979-2013). Returns titles and excerpts.',inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query']},
  execute:async({query})=>{if(typeof prog==='function') prog('Searching the sohbahs: '+query); const SOH=window.kzSOH; const ns=await SOH.searchFull(String(query||''),5); const I=await SOH.index(); const out=[];
    for(const n of ns){const t=await SOH.text(n); const i=Math.max(0,firstHit(t,qterms(String(query||'')))-400); out.push({ref:'Sohbah #'+(n+1)+': '+I.items[n][0],index:n,excerpt:t.slice(i,i+1600)})} return out}},
 {name:'get_post',description:'Full text of one DhikrNotes post by number.',inputSchema:{type:'object',properties:{id:{type:'number'}},required:['id']},
  execute:async({id})=>{let P; try{P=await jget('kunuz/posts.json')}catch(e){return {error:'posts unavailable'}} const p=P.find(x=>x.i===+id); return p?{date:p.d,text:p.x.slice(0,6000),title:p.lt,doc:p.doc}:{error:'not found'}}}];
const EXTRA=['read_awrad_section','open_awrad','read_sohbah','open_sohbah','open_diwan','read_maktaba_page','open_maktaba','compute_abjad'];
function tools(){const all=(typeof AITOOLS!=='undefined'?AITOOLS:[]); return TOOLS.concat(EXTRA.map(n=>all.find(t=>t.name===n)).filter(Boolean))}

window.USTADH={sys:SYS,sugg:SUGG,tools,search:searchReady,qterms,_idx:()=>IDX};
window.askUstadh=function(text){if(typeof askAs==='function') return askAs('ustadh',text); return askAbout(text)};
})();
