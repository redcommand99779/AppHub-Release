/* ══════════════════════════════════
   TIPPSCHULE – Zehn-Finger-Schreiben in 12 Lektionen (Grundreihe, obere/untere Reihe, Großbuchstaben, Zahlen, Wörter, Sätze).
   Eine Lektion gilt als bestanden (★), wenn mindestens 90 % der Tastenanschläge stimmen; dann wird die nächste frei.
   Tastatur-Anzeige (QWERTZ) mit Fingerfarben. Fortschritt: zf_tippschule  { stars:{id:n}, wpm:{id:n} }
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
  {id:'l12',name:'Ganze Sätze',hint:'Mit Satzzeichen',sentences:TL_SENTENCES,kind:'sentences'}
];
const TL_LEN=45;

function tlLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(TL_KEY)||'null');}catch(e){}if(!d||typeof d!=='object')d={};d.stars=d.stars&&typeof d.stars==='object'?d.stars:{};d.wpm=d.wpm&&typeof d.wpm==='object'?d.wpm:{};return d;}
function tlSave(d){try{localStorage.setItem(TL_KEY,JSON.stringify(d));}catch(e){}}
function tlUnlocked(d,i){return i===0||(d.stars[TL_LESSONS[i-1].id]|0)>0;}
/* Sterne: 1 ab 90 % Genauigkeit, 2 ab 95 % und 20 WPM, 3 ab 98 % und 35 WPM */
function tlStars(acc,wpm){if(acc>=98&&wpm>=35)return 3;if(acc>=95&&wpm>=20)return 2;if(acc>=90)return 1;return 0;}
function tlGenerate(lesson,rnd){
  rnd=rnd||Math.random;const pick=a=>a[Math.floor(rnd()*a.length)];
  if(lesson.kind==='sentences')return pick(lesson.sentences);
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
/* Welche Taste (und ob mit Shift) braucht man für ein Zeichen? */
function tlKeyFor(ch){
  if(ch===' ')return {key:' ',shift:false};
  if(TL_SHIFT_BASE[ch])return {key:TL_SHIFT_BASE[ch],shift:true};
  const low=ch.toLowerCase();
  return {key:low,shift:low!==ch};
}

/* ── Oberfläche ── */
let tl=null,tlView='menu',tlData=null;
function tlInit(){tlData=tlLoad();tlView='menu';tl=null;tlRender();}
function tlMenu(){tlView='menu';tl=null;tlData=tlLoad();tlRender();}
function tlStart(i){
  if(!tlUnlocked(tlData,i))return;
  const lesson=TL_LESSONS[i];
  tl={i,lesson,text:tlGenerate(lesson),pos:0,errors:0,keys:0,t0:0,done:false,flash:false,res:null};
  tlView='play';tlRender();
  setTimeout(()=>{const inp=document.getElementById('tl-in');if(inp)inp.focus();},30);
}
function tlAcc(t){return t.keys?Math.round((t.keys-t.errors)/t.keys*1000)/10:100;}
function tlWpm(t){if(!t.t0||t.pos<5)return 0;const min=Math.max(Date.now()-t.t0,2000)/60000;return Math.round(t.pos/5/min);}   // erst ab 5 Zeichen, sonst springt der Wert am Anfang
function tlType(ch){
  if(!tl||tl.done||!ch)return;
  if(!tl.t0)tl.t0=Date.now();
  tl.keys++;
  if(ch===tl.text[tl.pos]){tl.pos++;tl.flash=false;}else{tl.errors++;tl.flash=true;}
  if(tl.pos>=tl.text.length)tlFinish();
  tlRenderPlay();
}
function tlFinish(){
  tl.done=true;
  const acc=tlAcc(tl),wpm=tlWpm(tl),stars=tlStars(acc,wpm),d=tlLoad(),id=tl.lesson.id;
  const before=d.stars[id]|0;
  if(stars>before)d.stars[id]=stars;
  if(stars>0&&wpm>(d.wpm[id]|0))d.wpm[id]=wpm;
  tlSave(d);tlData=d;
  tl.res={acc,wpm,stars,newBest:stars>before};
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
        <div style="margin-top:6px;font-size:15px;color:#f59f00;letter-spacing:2px">${'★'.repeat(s)}<span style="opacity:.3">${'★'.repeat(3-s)}</span>${d.wpm[l.id]?`<span style="font-size:11px;color:var(--text-3);letter-spacing:0;margin-left:8px">${d.wpm[l.id]} WPM</span>`:''}</div></button>`;}).join('')}</div>`;
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
    root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px"><b>Lektion ${t.i+1}: ${escHtml(t.lesson.name)}</b><span><span class="game-chip">⌨️ <strong id="tl-wpm">0</strong> WPM</span> <span class="game-chip">🎯 <strong id="tl-acc">100</strong> %</span> <button class="lrn-btn ghost" onclick="tlMenu()">✕</button></span></div>
      <div class="lrn-card" onclick="tlFocus()" style="cursor:text"><div id="tl-text" style="font-size:24px;line-height:1.9;letter-spacing:.04em;font-family:ui-monospace,Consolas,monospace;word-break:break-word"></div>
      <input id="tl-in" oninput="tlOnInput(this)" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" style="position:absolute;opacity:0;width:1px;height:1px;left:-999px"></div>
      <div id="tl-kb" style="text-align:center"></div>
      <div style="font-size:12px;color:var(--text-3);text-align:center;margin-top:10px">Tippe die markierte Taste. Ein falscher Anschlag zählt als Fehler.</div>`;
  }
  document.getElementById('tl-text').innerHTML=chars;
  document.getElementById('tl-kb').innerHTML=tlKeyboardHtml(t.text[t.pos]);
  const w=document.getElementById('tl-wpm'),a=document.getElementById('tl-acc');
  if(w)w.textContent=tlWpm(t);if(a)a.textContent=tlAcc(t);
  if(full)tlFocus();
}
