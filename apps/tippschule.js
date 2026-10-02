/* ══════════════════════════════════
   TIPPSCHULE – Zehn-Finger-Schreiben in 16 Lektionen (Grundreihe, obere/untere Reihe, Großbuchstaben, Zahlen, Wörter, Sätze und zum Schluss Code abtippen: Python, JavaScript, HTML & CSS, SQL & Git).
   Eine Lektion gilt als bestanden (★), wenn mindestens 90 % der Tastenanschläge stimmen; dann wird die nächste frei.
   Tastatur-Anzeige (QWERTZ) mit Fingerfarben. Dazu: Fehlerstatistik je Taste mit „Problemtasten üben“, Freies Üben mit eigenem Text und eine
   Bestenliste über alle Lektionen. Fortschritt: zf_tippschule  { stars:{id:n}, wpm:{id:n}, keys:{taste:[Anschläge,Fehler]}, free:{id:wpm} }
══════════════════════════════════ */
const TL_KEY='zf_tippschule';
const TL_FINGER_COLORS=['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#4dabf7','#69db7c','#ffd43b','#ffa94d','#ff6b6b'];  // kleiner Finger links … kleiner Finger rechts
const TL_ROWS=['1234567890ß','qwertzuiopü','asdfghjklöä','yxcvbnm,.-'];
const TL_ROW_OFFSET=[0,0.5,0.75,1.25];
const TL_FINGER_COL={'1':0,'q':0,'a':0,'y':0,'2':1,'w':1,'s':1,'x':1,'3':2,'e':2,'d':2,'c':2,'4':3,'r':3,'f':3,'v':3,'5':3,'t':3,'g':3,'b':3,
  '6':6,'z':6,'h':6,'n':6,'7':6,'u':6,'j':6,'m':6,'8':7,'i':7,'k':7,',':7,'9':8,'o':8,'l':8,'.':8,'0':9,'p':9,'ö':9,'-':9,'ß':9,'ü':9,'ä':9};
const TL_SHIFT_BASE={'!':'1','"':'2','§':'3','$':'4','%':'5','&':'6','/':'7','(':'8',')':'9','=':'0','?':'ß',';':',',':':'.','_':'-'};
const TL_WORDS_SHORT=['und','der','die','das','ist','ein','ich','du','wir','sie','nicht','auch','mit','auf','für','von','zu','im','an','es','wie','was','wo','ja','nein','hier','dort','gut','viel','alle','mehr','noch','schon','dann','wenn','aber','oder','kann','will','muss'];
const TL_WORDS_LONG=['Geschwindigkeit','Schreibmaschine','Tastatur','Freundschaft','Abenteuer','Wirklichkeit','Regenbogen','Schmetterling','Entwicklung','Herausforderung','Kartoffelsalat','Wochenende','Bibliothek','Programmierung','Geburtstagsgeschenk','Sonnenuntergang','Straßenbahn','Zusammenarbeit','Schokoladenkuchen','Hausaufgabe'];
const TL_SENTENCES=['Der schnelle Fuchs springt über den Zaun.','Heute scheint die Sonne den ganzen Tag.','Wer viel übt, wird immer besser.','Am Wochenende gehen wir gern spazieren.','Ohne Fleiß kein Preis, sagt das Sprichwort.','Ich lerne jeden Tag ein bisschen mehr.','Die Katze schläft auf dem warmen Sofa.','Im Herbst fallen die bunten Blätter von den Bäumen.','Gemeinsam schaffen wir das Ziel viel schneller.','Nach der Schule treffe ich meine Freunde.'];
/* Code abtippen: Zeilen aus den Programmierkursen. Zeichen wie { } [ ] @ \ ~ | < > gibt es nicht auf dem Tastenfeld – dafür zeigt die Tippschule, wie man sie tippt (AltGr). */
const TL_CODE_PY=['print("Hallo Welt")','name = input("Dein Name? ")','for i in range(10):','zahlen = [3, 1, 2]','if x > 5 and y < 3:','def addiere(a, b):','return a + b','while n != 0:','text = f"Hi {name}"','print(len(zahlen))','liste.append(42)','d = {"a": 1, "b": 2}'];
const TL_CODE_JS=['const summe = (a, b) => a + b;','let zahl = 42;','console.log("Hallo");','if (x === 5) { return; }','for (let i = 0; i < 10; i++) {','const arr = [1, 2, 3];','arr.map((x) => x * 2);','document.querySelector("#knopf");','function gruss(name) {','el.textContent = "Neu";','const o = { a: 1, b: [2, 3] };'];
const TL_CODE_WEB=['<div class="karte">','<a href="seite.html">Link</a>','<p id="text">Hallo</p>','<img src="bild.png" alt="Bild">','<ul><li>Eins</li></ul>','h1 { color: red; }','.box { margin: 0 auto; }','p > span { font-size: 16px; }','background: #ff6600;','<button id="knopf">Klick</button>'];
const TL_CODE_SQLGIT=["SELECT * FROM tiere WHERE jahre > 3;","INSERT INTO t (a, b) VALUES (1, 2);","UPDATE tiere SET name = 'Rex';",'git commit -m "Fertig"','git add .','git push origin main','ORDER BY name DESC;','SELECT COUNT(*) FROM tiere;','git switch -c neu','git log --oneline'];
const TL_LESSONS=[
  {id:'l1',name:'Grundreihe links',hint:'Finger auf a s d f',letters:'asdf',kind:'letters'},
  {id:'l2',name:'Grundreihe rechts',hint:'Finger auf j k l ö',letters:'jklö',kind:'letters'},
  {id:'l3',name:'Ganze Grundreihe',hint:'a s d f g h j k l ö',letters:'asdfghjklö',kind:'letters'},
  {id:'l4',name:'Obere Reihe 1',hint:'Dazu e r u i',letters:'asdfghjklöeriu',kind:'letters'},
  {id:'l5',name:'Obere Reihe 2',hint:'Dazu q w t z o p ü',letters:'asdfghjklöqwertzuiopü',kind:'letters'},
  {id:'l6',name:'Untere Reihe',hint:'Dazu y x c v b n m',letters:'asdfghjklöyxcvbnm',kind:'letters'},
  {id:'l7',name:'Alle Buchstaben',hint:'Alles zusammen',letters:'abcdefghijklmnopqrstuvwxyzöäü',kind:'letters'},
  {id:'l8',name:'Kurze Wörter',hint:'Häufige deutsche Wörter',words:TL_WORDS_SHORT,kind:'words'},
  {id:'l9',name:'Großbuchstaben',hint:'Mit Shift-Taste',words:TL_WORDS_LONG,kind:'words'},
  {id:'l10',name:'Zahlenreihe',hint:'1 2 3 4 5 6 7 8 9 0',letters:'0123456789',kind:'letters'},
  {id:'l11',name:'Sonderzeichen',hint:'. , ! ? - ( ) /',letters:'.,!?-()/asdfjkl',kind:'letters'},
  {id:'l12',name:'Ganze Sätze',hint:'Mit Satzzeichen',sentences:TL_SENTENCES,kind:'sentences'},
  {id:'l13',name:'Code: Python',hint:'Klammern, Anführungszeichen, Doppelpunkt',snippets:TL_CODE_PY,kind:'code',needs:'l11'},
  {id:'l14',name:'Code: JavaScript',hint:'Dazu { } [ ] und =>',snippets:TL_CODE_JS,kind:'code',needs:'l11'},
  {id:'l15',name:'Code: HTML & CSS',hint:'Dazu < > und #',snippets:TL_CODE_WEB,kind:'code',needs:'l11'},
  {id:'l16',name:'Code: SQL & Git',hint:'Großbuchstaben, * und -',snippets:TL_CODE_SQLGIT,kind:'code',needs:'l11'}
];
/* Zeichen ohne Taste im Tastenfeld: so tippt man sie auf einer deutschen Tastatur (Windows; Mac nur für Klammern) */
const TL_EXTRA={'{':'AltGr + 7 (Mac: Alt + 8)','[':'AltGr + 8 (Mac: Alt + 5)',']':'AltGr + 9 (Mac: Alt + 6)','}':'AltGr + 0 (Mac: Alt + 9)','@':'AltGr + Q','\\':'AltGr + ß','~':'AltGr + +','|':'AltGr + <','<':'Taste links neben Y','>':'Shift + Taste links neben Y','+':'Taste rechts neben Ü','*':'Shift + Taste rechts neben Ü','#':'Taste links neben Enter',"'":'Shift + #'};
const TL_LEN=45;

function tlLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(TL_KEY)||'null');}catch(e){}if(!d||typeof d!=='object')d={};d.stars=d.stars&&typeof d.stars==='object'?d.stars:{};d.wpm=d.wpm&&typeof d.wpm==='object'?d.wpm:{};d.keys=d.keys&&typeof d.keys==='object'&&!Array.isArray(d.keys)?d.keys:{};d.free=d.free&&typeof d.free==='object'?d.free:{};return d;}
function tlSave(d){try{localStorage.setItem(TL_KEY,JSON.stringify(d));}catch(e){}}
function tlUnlocked(d,i){const n=TL_LESSONS[i].needs;if(n)return (d.stars[n]|0)>0;return i===0||(d.stars[TL_LESSONS[i-1].id]|0)>0;}   // Code-Lektionen brauchen nur die Sonderzeichen-Lektion
/* Sterne: 1 ab 90 % Genauigkeit, 2 ab 95 % und 20 WPM, 3 ab 98 % und 35 WPM */
function tlStars(acc,wpm){if(acc>=98&&wpm>=35)return 3;if(acc>=95&&wpm>=20)return 2;if(acc>=90)return 1;return 0;}
function tlGenerate(lesson,rnd){
  rnd=rnd||Math.random;const pick=a=>a[Math.floor(rnd()*a.length)];
  if(lesson.kind==='text')return lesson.text;
  if(lesson.kind==='sentences')return pick(lesson.sentences);
  if(lesson.kind==='code'){const a=pick(lesson.snippets);let b=pick(lesson.snippets);for(let n=0;b===a&&n<20;n++)b=pick(lesson.snippets);return a+' '+b;}   // zwei Zeilen hintereinander
  if(lesson.kind==='words'){
    let out=[];
    if(lesson.id==='l9'){for(let i=0;i<3;i++){const w=pick(lesson.words);out.push(w);}return out.join(' ');}
    while(out.join(' ').length<TL_LEN)out.push(pick(lesson.words));
    return out.join(' ');
  }
  let s='';
  while(s.length<TL_LEN){
    const n=2+Math.floor(rnd()*4);let w='';
    for(let i=0;i<n;i++)w+=pick(lesson.letters);
    s+=(s?' ':'')+w;
  }
  return s;
}
/* Zeichen, die nicht im Tastenfeld stehen: Hinweis, wie man sie tippt (sonst leer) */
function tlExtraHint(ch){if(!ch||ch===' ')return '';const k=tlKeyFor(ch).key;if(k===' '||TL_ROWS.some(r=>r.includes(k)))return '';return TL_EXTRA[ch]||'';}
/* Welche Taste (und ob mit Shift) braucht man für ein Zeichen? */
function tlKeyFor(ch){
  if(ch===' ')return {key:' ',shift:false};
  if(TL_SHIFT_BASE[ch])return {key:TL_SHIFT_BASE[ch],shift:true};
  const low=ch.toLowerCase();
  return {key:low,shift:low!==ch};
}

/* ── Fehlerstatistik, Problemtasten, freier Text, Bestenliste ── */
function tlMergeKeys(d,ks){Object.keys(ks||{}).forEach(k=>{const a=d.keys[k]||(d.keys[k]=[0,0]);a[0]+=ks[k][0];a[1]+=ks[k][1];});}
/* Problemtasten: mindestens 15 Anschläge und Fehlerquote über 4 %, die schlechtesten zuerst */
function tlWeakKeys(d,max){
  return Object.keys(d.keys).filter(k=>k!==' '&&d.keys[k][0]>=15&&d.keys[k][1]/d.keys[k][0]>0.04)
    .map(k=>({key:k,n:d.keys[k][0],rate:d.keys[k][1]/d.keys[k][0]})).sort((a,b)=>b.rate-a.rate||b.n-a.n).slice(0,max||8);
}
function tlWeakLesson(d){
  const w=tlWeakKeys(d,6).map(x=>x.key).filter(k=>!TL_SHIFT_BASE[k]);
  return {id:'weak',name:'Problemtasten',hint:'Deine schwächsten Tasten',letters:w.length?w.join('')+w[0]+w[w.length-1]:'asdfjklö',kind:'letters'};
}
/* Eigener Text: Anführungszeichen und Striche vereinheitlichen, nicht tippbare Zeichen entfernen, höchstens 400 Zeichen */
function tlCleanText(raw){
  let t=String(raw||'').replace(/[„“”«»]/g,'"').replace(/[‘’‚`´]/g,"'").replace(/[–—−]/g,'-').replace(/…/g,'...').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  let removed=0;t=t.replace(/[^A-Za-zÄÖÜäöüß0-9 .,;:!?\-_()"'\/&%$§=+*#@€]/gu,()=>{removed++;return '';}).replace(/ {2,}/g,' ').trim();
  return {text:t.slice(0,400),removed,cut:t.length>400};
}
function tlStats(d){
  const stars=TL_LESSONS.reduce((n,l)=>n+(d.stars[l.id]|0),0),passed=TL_LESSONS.filter(l=>(d.stars[l.id]|0)>0).length;
  const w=TL_LESSONS.map(l=>d.wpm[l.id]|0).filter(x=>x>0);
  return {stars,passed,avg:w.length?Math.round(w.reduce((a,b)=>a+b,0)/w.length):0,best:w.length?Math.max(...w):0};
}
function tlRanking(d){return TL_LESSONS.filter(l=>d.wpm[l.id]).map(l=>({name:l.name,wpm:d.wpm[l.id],stars:d.stars[l.id]|0})).sort((a,b)=>b.wpm-a.wpm).slice(0,5);}
let tlFreeText='',tlFreeMsg='';
function tlFreeInput(v){tlFreeText=v;}
function tlFreeRandom(){tlFreeText=TL_SENTENCES[Math.floor(Math.random()*TL_SENTENCES.length)]+' '+TL_SENTENCES[Math.floor(Math.random()*TL_SENTENCES.length)];tlFreeMsg='';tlRender();}
function tlStartFree(){
  const c=tlCleanText(tlFreeText);
  if(c.text.length<10){tlFreeMsg='Der Text ist zu kurz – mindestens 10 tippbare Zeichen.';tlRender();return;}
  tlFreeMsg=c.removed||c.cut?`Hinweis: ${c.removed?c.removed+' nicht tippbare Zeichen entfernt':''}${c.removed&&c.cut?', ':''}${c.cut?'Text auf 400 Zeichen gekürzt':''}.`:'';
  tlBegin({id:'free',name:'Freies Üben',hint:'Dein eigener Text',text:c.text,kind:'text'},-1);
}
function tlStartWeak(){tlBegin(tlWeakLesson(tlLoad()),-1);}

/* ── Oberfläche ── */
let tl=null,tlView='menu',tlData=null;
function tlInit(){tlData=tlLoad();tlView='menu';tl=null;tlRender();}
function tlMenu(){if(tl&&!tl.done){const d=tlLoad();tlMergeKeys(d,tl.kstat);tlSave(d);}tlView='menu';tl=null;tlData=tlLoad();tlRender();}
function tlStart(i){
  if(!tlUnlocked(tlData,i))return;
  tlBegin(TL_LESSONS[i],i);
}
function tlBegin(lesson,i){
  tl={i,lesson,text:tlGenerate(lesson),pos:0,errors:0,keys:0,kstat:{},t0:0,done:false,flash:false,res:null};
  tlView='play';tlRender();
  setTimeout(()=>{const inp=document.getElementById('tl-in');if(inp)inp.focus();},30);
}
function tlAgain(){if(tl&&tl.i>=0)tlStart(tl.i);else if(tl)tlBegin(tl.lesson.id==='weak'?tlWeakLesson(tlLoad()):tl.lesson,-1);}
function tlAcc(t){return t.keys?Math.round((t.keys-t.errors)/t.keys*1000)/10:100;}
function tlWpm(t){if(!t.t0||t.pos<5)return 0;const min=Math.max(Date.now()-t.t0,2000)/60000;return Math.round(t.pos/5/min);}   // erst ab 5 Zeichen, sonst springt der Wert am Anfang
function tlType(ch){
  if(!tl||tl.done||!ch)return;
  if(!tl.t0)tl.t0=Date.now();
  tl.keys++;
  const exp=tl.text[tl.pos],kk=tlKeyFor(exp).key,ks=tl.kstat[kk]||(tl.kstat[kk]=[0,0]);ks[0]++;   // Fehler zählen bei der Taste, die eigentlich gebraucht wurde
  if(ch===exp){tl.pos++;tl.flash=false;}else{tl.errors++;ks[1]++;tl.flash=true;}
  if(tl.pos>=tl.text.length)tlFinish();
  tlRenderPlay();
}
function tlFinish(){
  tl.done=true;
  const acc=tlAcc(tl),wpm=tlWpm(tl),stars=tlStars(acc,wpm),d=tlLoad(),id=tl.lesson.id;
  const before=d.stars[id]|0,lessonRun=tl.i>=0;
  if(lessonRun){if(stars>before)d.stars[id]=stars;if(stars>0&&wpm>(d.wpm[id]|0))d.wpm[id]=wpm;}
  else if(acc>=90&&wpm>(d.free[id]|0))d.free[id]=wpm;
  tlMergeKeys(d,tl.kstat);
  tlSave(d);tlData=d;
  if(typeof lsMark==='function')lsMark('tippschule');
  tl.res={acc,wpm,stars:lessonRun?stars:0,newBest:lessonRun?stars>before:false,custom:!lessonRun};
}
function tlOnInput(el){const v=el.value;el.value='';for(const ch of v)tlType(ch);}
function tlFocus(){const inp=document.getElementById('tl-in');if(inp)inp.focus();}
function tlRender(){
  const root=document.getElementById('tl-root');if(!root)return;
  if(tlView==='play'&&tl){tlRenderPlay(true);return;}
  const d=tlData||tlLoad();
  root.innerHTML=`<div style="font-size:13px;color:var(--text-2);margin-bottom:12px">Lerne das Zehn-Finger-System Schritt für Schritt. Mit 90 % Genauigkeit gibt es einen Stern und die nächste Lektion wird frei.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px">${TL_LESSONS.map((l,i)=>{
      const open=tlUnlocked(d,i),s=d.stars[l.id]|0;
      return `<button type="button" class="lrn-card" ${open?`onclick="tlStart(${i})"`:'disabled'} style="text-align:left;cursor:${open?'pointer':'default'};opacity:${open?1:0.5};font-family:inherit;color:var(--text)">
        <div style="font-size:11px;color:var(--text-3);font-weight:700">LEKTION ${i+1}</div><div style="font-size:16px;font-weight:800;margin:2px 0">${open?'':'🔒 '}${escHtml(l.name)}</div>
        <div style="font-size:12px;color:var(--text-2)">${escHtml(l.hint)}</div>
        <div style="margin-top:6px;font-size:15px;color:#f59f00;letter-spacing:2px">${'★'.repeat(s)}<span style="opacity:.3">${'★'.repeat(3-s)}</span>${d.wpm[l.id]?`<span style="font-size:11px;color:var(--text-3);letter-spacing:0;margin-left:8px">${d.wpm[l.id]} WPM</span>`:''}</div></button>`;}).join('')}</div>
    ${tlMenuExtras(d)}`;
}
function tlMenuExtras(d){
  const st=tlStats(d),rank=tlRanking(d),weak=tlWeakKeys(d,8);
  const board=`<div class="lrn-card" style="margin-top:14px"><div class="lrn-label">🏆 Deine Bestenliste</div>
    <div class="lrn-tiles"><div class="lrn-tile"><b>${st.stars}/${TL_LESSONS.length*3}</b><span>Sterne</span></div><div class="lrn-tile"><b>${st.passed}/${TL_LESSONS.length}</b><span>Lektionen</span></div><div class="lrn-tile"><b>${st.avg}</b><span>Ø WPM</span></div><div class="lrn-tile"><b>${st.best}</b><span>Bestwert WPM</span></div></div>
    ${rank.length?`<table style="border-collapse:collapse;width:100%;font-size:13px">${rank.map((r,i)=>`<tr><td style="padding:3px 6px;width:26px">${['🥇','🥈','🥉'][i]||(i+1)+'.'}</td><td style="padding:3px 6px">${escHtml(r.name)}</td><td style="padding:3px 6px;color:#f59f00">${'★'.repeat(r.stars)}</td><td style="padding:3px 6px;text-align:right"><b>${r.wpm}</b> WPM</td></tr>`).join('')}</table>`:'<div style="font-size:12px;color:var(--text-3)">Schaffe eine Lektion, dann erscheint hier deine Bestenliste.</div>'}</div>`;
  const wk=`<div class="lrn-card" style="margin-top:12px"><div class="lrn-label">🎯 Problemtasten</div>
    ${weak.length?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${weak.map(w=>`<span style="padding:6px 10px;border-radius:10px;background:var(--bg);border:1.5px solid #ff6b6b;font-size:13px"><b style="font-size:16px">${escHtml(w.key==='ß'?w.key:w.key.toUpperCase())}</b> ${Math.round(w.rate*100)} % Fehler <span style="color:var(--text-3)">(${w.n} Anschläge)</span></span>`).join('')}</div><button class="lrn-btn" onclick="tlStartWeak()">▶ Problemtasten üben</button>`
      :'<div style="font-size:12px;color:var(--text-3)">Sobald du ein paar Lektionen getippt hast, zeigt dir die Tippschule hier, bei welchen Tasten du dich oft vertippst (ab 15 Anschlägen und über 4 % Fehlern).</div>'}</div>`;
  const free=`<div class="lrn-card" style="margin-top:12px"><div class="lrn-label">✍️ Freies Üben mit eigenem Text</div>
    <textarea class="lrn-input" style="width:100%;min-height:74px;resize:vertical" placeholder="Füge hier einen Text ein, den du tippen möchtest (10 bis 400 Zeichen) …" oninput="tlFreeInput(this.value)">${escHtml(tlFreeText)}</textarea>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center"><button class="lrn-btn" onclick="tlStartFree()">▶ Diesen Text üben</button><button class="lrn-btn ghost" onclick="tlFreeRandom()">🎲 Zufälliger Text</button>
    ${d.free.free?`<span style="font-size:12px;color:var(--text-3)">Bestwert freies Üben: <b>${d.free.free}</b> WPM</span>`:''}</div>
    ${tlFreeMsg?`<div style="font-size:12px;color:var(--text-2);margin-top:6px">${escHtml(tlFreeMsg)}</div>`:''}</div>`;
  return board+wk+free;
}
function tlKeyboardHtml(next){
  const nk=next?tlKeyFor(next):null,U=100/12.5;   // Tastenbreite in Prozent der Zeile: 11 Tasten + Versatz passen immer in die Breite
  const rows=TL_ROWS.map((row,ri)=>`<div style="display:flex;gap:${U*0.12}%;margin-left:${TL_ROW_OFFSET[ri]*U}%;margin-bottom:${U*0.12}%">${row.split('').map(k=>{
    const col=TL_FINGER_COL[k],color=TL_FINGER_COLORS[col],on=nk&&nk.key===k;
    return `<div style="flex:0 0 ${U*0.88}%;aspect-ratio:1;box-sizing:border-box;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:clamp(9px,2.6vw,14px);font-weight:700;background:${on?color:'var(--bg)'};color:${on?'#111':'var(--text-3)'};border:1.5px solid ${color};${on?'transform:scale(1.12);box-shadow:0 0 10px '+color:''}">${k==='ß'?k:k.toUpperCase()}</div>`;}).join('')}</div>`).join('');
  const space=`<div style="aspect-ratio:8/0.9;width:${U*8}%;margin-left:${U*2.5}%;box-sizing:border-box;border-radius:6px;background:${nk&&nk.key===' '?'#c0c0c8':'var(--bg)'};border:1.5px solid var(--divider)"></div>`;
  const shift=`<div style="text-align:center;font-size:12px;height:18px;margin-bottom:4px;color:${nk&&nk.shift?'var(--accent)':'transparent'};font-weight:700">⇧ Shift gedrückt halten</div>`;
  return `<div style="margin:12px auto 0;max-width:460px;text-align:left">${shift}${rows}${space}</div>`;
}
function tlRenderPlay(full){
  const root=document.getElementById('tl-root');if(!root||!tl)return;
  const t=tl;
  if(t.done){
    const r=t.res,next=TL_LESSONS[t.i+1];
    if(r.custom){
      const wk=t.lesson.id==='weak';
      root.innerHTML=`<div class="lrn-card" style="text-align:center"><div style="font-size:14px;color:var(--text-3)">${escHtml(t.lesson.name)}</div>
        <div style="font-size:40px;margin:6px 0">${r.acc>=95?'🎉':'👍'}</div><div style="font-size:22px;font-weight:800">Geschafft!</div>
        <div style="font-size:14px;margin:8px 0 14px">${r.wpm} Wörter/Min · ${r.acc} % Genauigkeit${r.acc<90?' · Ab 90 % zählt die Runde als Bestwert':''}</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="lrn-btn" onclick="tlAgain()">Nochmal${wk?' (neu gemischt)':''}</button><button class="lrn-btn ghost" onclick="tlMenu()">Zurück</button></div></div>`;
      return;
    }
    root.innerHTML=`<div class="lrn-card" style="text-align:center"><div style="font-size:14px;color:var(--text-3)">${escHtml(t.lesson.name)}</div>
      <div style="font-size:34px;color:#f59f00;letter-spacing:6px;margin:6px 0">${'★'.repeat(r.stars)}<span style="opacity:.25">${'★'.repeat(3-r.stars)}</span></div>
      <div style="font-size:22px;font-weight:800">${r.stars?(r.stars===3?'Perfekt!':'Bestanden!'):'Noch nicht ganz'}</div>
      <div style="font-size:14px;margin:8px 0 4px">${r.wpm} Wörter/Min · ${r.acc} % Genauigkeit${r.newBest?' · 🏅 neuer Bestwert':''}</div>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:14px">${r.stars?'':'Für einen Stern brauchst du 90 % Genauigkeit. Lieber langsamer, dafür ohne Fehler!'}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="lrn-btn ghost" onclick="tlStart(${t.i})">Nochmal</button>${r.stars&&next?`<button class="lrn-btn" onclick="tlStart(${t.i+1})">Nächste Lektion ▶</button>`:''}<button class="lrn-btn ghost" onclick="tlMenu()">Lektionen</button></div></div>`;
    return;
  }
  const chars=t.text.split('').map((c,i)=>{
    const shown=c===' '?'␣':escHtml(c);
    if(i<t.pos)return `<span style="color:#34c759">${shown}</span>`;
    if(i===t.pos)return `<span style="background:${t.flash?'#ff3b30':'var(--accent)'};color:#fff;border-radius:4px;padding:0 2px">${shown}</span>`;
    return `<span style="color:var(--text-2)">${shown}</span>`;}).join('');
  if(full||!document.getElementById('tl-text')){
    root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px"><b>${t.i>=0?'Lektion '+(t.i+1)+': ':''}${escHtml(t.lesson.name)}</b><span><span class="game-chip">⌨️ <strong id="tl-wpm">0</strong> WPM</span> <span class="game-chip">🎯 <strong id="tl-acc">100</strong> %</span> <button class="lrn-btn ghost" onclick="tlMenu()">✕</button></span></div>
      <div class="lrn-card" onclick="tlFocus()" style="cursor:text"><div id="tl-text" style="font-size:24px;line-height:1.9;letter-spacing:.04em;font-family:ui-monospace,Consolas,monospace;word-break:break-word"></div>
      <input id="tl-in" oninput="tlOnInput(this)" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="position:absolute;opacity:0;width:1px;height:1px;left:-999px"></div>
      <div id="tl-kb" style="text-align:center"></div><div id="tl-extra" style="text-align:center;font-size:14px;font-weight:700;color:var(--accent);height:22px;margin-top:6px"></div>
      <div style="font-size:12px;color:var(--text-3);text-align:center;margin-top:10px">Tippe die markierte Taste. Ein falscher Anschlag zählt als Fehler.</div>`;
  }
  document.getElementById('tl-text').innerHTML=chars;
  document.getElementById('tl-kb').innerHTML=tlKeyboardHtml(t.text[t.pos]);
  const ex=document.getElementById('tl-extra'),eh=tlExtraHint(t.text[t.pos]);if(ex)ex.textContent=eh?'Zeichen „'+t.text[t.pos]+'“: '+eh:'';
  const w=document.getElementById('tl-wpm'),a=document.getElementById('tl-acc');
  if(w)w.textContent=tlWpm(t);if(a)a.textContent=tlAcc(t);
  if(full)tlFocus();
}
