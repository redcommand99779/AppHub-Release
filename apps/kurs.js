/* ══════════════════════════════════
   PROGRAMMIERKURSE – Kategorie „Programmieren“. 5 Themen (Python, JavaScript, HTML & CSS, SQL, Git) mit 13 Kursen und 141 Lektionen:
   kurze Erklärung, Aufgabe, Editor mit Syntax-Farben, Zeilennummern, Autovervollständigung und Klammer-/Einrückungs-Komfort wie in VS Code, Prüfung
   per Knopfdruck, Tipps in zwei Stufen, Lösung auf Wunsch. Jede Lektion schaltet erst die nächste frei. Aus dem CodingKurs-Projekt übernommen
   (Daten: apps/kurs-daten*.js, Farben: kurs-highlight.js, Vorschläge: kurs-autocomplete.js, Aussehen: kurs.css).
   Für AppHub: Fortschritt, Sterne und eigener Code je Konto (zf_kurs); Sterne gibt es für jede Lektion (3 ohne Tipp und Lösung, 2 mit Tipp, 1 mit
   Lösung), AppHub-Coins einmalig je Lektion (2, bei 3 Sternen 3) und 10 für einen ganzen Kurs, zählt für die Lern-Serie; „Spielplatz“ zum freien
   Ausprobieren (Python, JavaScript, HTML + JavaScript, SQL) mit gespeicherten Schnipseln.
   Sprachen: python (Pyodide), javascript (Worker mit 3 s Zeitlimit), html (Vorschau, geprüft am DOM), dom (HTML mit Skript in abgeschotteter Seite,
   die Prüfung bekommt eine Kopie der Seite), sql (SQLite in Pyodide), git (Befehle werden geprüft und mit Beispielantworten „ausgeführt“).
   Python/SQL laden Pyodide beim ersten Ausführen: aus dem Ordner pyodide/ neben AppHub.html, wenn er da ist (kein Download, offline), sonst einmalig
   aus dem Netz (jsdelivr, Browser-Zwischenspeicher). Alles andere läuft immer offline.
══════════════════════════════════ */
const KURS_KEY='zf_kurs';
const KURS_PYODIDE_LOCAL='pyodide/pyodide.js';   // lokale Kopie (Ordner pyodide/ neben AppHub.html), wird bevorzugt
const KURS_PYODIDE='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';   // sonst wie bisher aus dem Netz (Browser-Zwischenspeicher)
const KURS_TIMEOUT=3000,KURS_MAXOUT=50000;
const KURS_TOPICS=[
  {id:'python',name:'Python',emoji:'🐍',courses:['py1','py2','py3','py4','bugpy'],desc:'Von print bis Algorithmen und eigenen Projekten'},
  {id:'javascript',name:'JavaScript',emoji:'🟨',courses:['js1','js2','dom','bugjs'],desc:'Die Sprache des Webs, auch direkt im Browser'},
  {id:'web',name:'HTML & CSS',emoji:'🌐',courses:['html','css'],desc:'Webseiten bauen und gestalten'},
  {id:'sql',name:'SQL',emoji:'🗃️',courses:['sql'],desc:'Datenbanken abfragen und ändern'},
  {id:'git',name:'Git',emoji:'🌿',courses:['git'],desc:'Versionsverwaltung für alle Projekte'}
];
const KURS_PLAY_LANGS={python:{name:'Python',tpl:'print("Hallo Welt")\n'},javascript:{name:'JavaScript',tpl:'console.log("Hallo Welt");\n'},html:{name:'HTML + JavaScript',tpl:'<h1 id="titel">Hallo Welt</h1>\n<button id="knopf">Klick mich</button>\n\n<script>\n  document.querySelector("#knopf").addEventListener("click", () => {\n    document.querySelector("#titel").textContent = "Geklickt!";\n  });\n</script>\n'},sql:{name:'SQL',tpl:'-- Tabellen: tiere und besitzer\nSELECT * FROM tiere;\n'}};
const KURS_SNIP_MAX=20;
const KURS_REWARD_LESSON=2,KURS_REWARD_BONUS=10;

/* ── Reine Logik (ohne Oberfläche, wird getestet) ── */
function kursKey(c,i){return c.id+'-'+i;}
function kursDoneCount(c,done){return c.lessons.filter((_,i)=>done[kursKey(c,i)]).length;}
/* Die erste noch nicht geschaffte Lektion (oder die letzte, wenn alles geschafft ist). Eine Lektion ist erst offen, wenn alle davor geschafft sind. */
function kursFirstOpen(c,done){const i=c.lessons.findIndex((_,j)=>!done[kursKey(c,j)]);return i===-1?c.lessons.length-1:i;}
function kursIsUnlocked(c,i,done){return i<=kursFirstOpen(c,done);}
function kursTotals(courses,done){return {all:courses.reduce((n,c)=>n+c.lessons.length,0),done:courses.reduce((n,c)=>n+kursDoneCount(c,done),0)};}
function kursTopicOf(c){return KURS_TOPICS.find(t=>t.courses.includes(c.id))||null;}
/* Kurse zum selben Thema, in der Reihenfolge des Themas – die Seitenleiste zeigt nur diese */
function kursSiblings(c,courses){const t=kursTopicOf(c);if(!t)return [c];return t.courses.map(id=>courses.find(x=>x.id===id)).filter(Boolean);}
function kursTopicCourses(t,courses){return t.courses.map(id=>courses.find(x=>x.id===id)).filter(Boolean);}
const KURS_TOPIC_NAME={python:'Python',javascript:'JavaScript',html:'Web'};   // Kurzbezeichnung nach Sprache
/* Sterne einer Lektion: used = 0 (nichts benutzt), 1 (Tipp), 2 (Lösung angesehen) */
function kursStarsFor(used){return used>=2?1:used===1?2:3;}
function kursLessonCoins(stars){return KURS_REWARD_LESSON+(stars>=3?1:0);}
function kursStarSum(courses,stars){return courses.reduce((n,c)=>n+c.lessons.reduce((m,_,i)=>m+(stars[kursKey(c,i)]|0),0),0);}
function kursAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function kursAllStore(){try{const o=JSON.parse(localStorage.getItem(KURS_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
const KURS_KEYRE=/^[a-z0-9]+-\d+$/,KURS_PAIDRE=/^[a-z0-9]+-(\d+|all)$/;
/* Fortschritt des Kontos: nur gültige Schlüssel und Werte (kaputte Daten werden ignoriert) */
function kursLoadStore(){
  const a=kursAllStore()[kursAccount().toLowerCase()||'_gast']||{},out={done:{},code:{},stars:{},used:{},paid:{},play:{},snips:{}};
  const each=(o,fn)=>{if(o&&typeof o==='object'&&!Array.isArray(o))Object.keys(o).forEach(k=>{if(Object.prototype.hasOwnProperty.call(o,k))fn(k,o[k]);});};
  each(a.done,(k,v)=>{if(v===true&&KURS_KEYRE.test(k))out.done[k]=true;});
  each(a.code,(k,v)=>{if(typeof v==='string'&&KURS_KEYRE.test(k))out.code[k]=v.slice(0,20000);});
  each(a.stars,(k,v)=>{if(KURS_KEYRE.test(k)&&v>=1&&v<=3)out.stars[k]=v|0;});
  each(a.used,(k,v)=>{if(KURS_KEYRE.test(k)&&v>=1&&v<=2)out.used[k]=v|0;});
  each(a.paid,(k,v)=>{if(v===true&&KURS_PAIDRE.test(k))out.paid[k]=true;});
  each(a.play,(k,v)=>{if(KURS_PLAY_LANGS[k]&&typeof v==='string')out.play[k]=v.slice(0,20000);});
  let n=0;each(a.snips,(k,v)=>{if(n>=KURS_SNIP_MAX||!v||typeof v!=='object'||!KURS_PLAY_LANGS[v.lang]||typeof v.code!=='string')return;const name=String(k).slice(0,40);if(!name.trim())return;out.snips[name]={lang:v.lang,code:v.code.slice(0,20000)};n++;});
  return out;
}
function kursSaveStore(st){const all=kursAllStore();all[kursAccount().toLowerCase()||'_gast']={done:st.done,code:st.code,stars:st.stars,used:st.used,paid:st.paid,play:st.play,snips:st.snips};try{localStorage.setItem(KURS_KEY,JSON.stringify(all));}catch(e){return false;}return true;}
/* Schnipsel des Spielplatzes speichern/löschen (höchstens 20, Name höchstens 40 Zeichen) */
function kursSnipSave(st,name,lang,code){
  name=String(name||'').trim().slice(0,40);if(!name||!KURS_PLAY_LANGS[lang])return 'name';
  if(!(name in st.snips)&&Object.keys(st.snips).length>=KURS_SNIP_MAX)return 'voll';
  st.snips[name]={lang,code:String(code).slice(0,20000)};return 'ok';
}
function kursSnipDelete(st,name){if(!(name in st.snips))return false;delete st.snips[name];return true;}
/* Programm für den Worker: sammelt console.log-Ausgaben (höchstens 50 000 Zeichen) und meldet Fehler mit Namen und Text */
const KURS_WORKER_SRC=
  "var MAXOUT="+KURS_MAXOUT+";"+
  "function fmt(v){if(typeof v==='string')return v;try{return typeof v==='object'?JSON.stringify(v):String(v);}catch(e){return String(v);}}"+
  "self.onmessage=function(e){var out='';"+
  "var log=function(){var s='';for(var i=0;i<arguments.length;i++){s+=(i?' ':'')+fmt(arguments[i]);}out+=s+'\\n';if(out.length>MAXOUT)throw new Error('Zu viel Ausgabe (mehr als '+MAXOUT+' Zeichen)');};"+
  "var con={log:log,info:log,warn:log,error:log};"+
  "try{new Function('console',e.data)(con);self.postMessage({output:out});}"+
  "catch(err){self.postMessage({output:out,error:(err&&err.name?err.name:'Error')+': '+(err&&err.message?err.message:String(err))});}};";
const kursFmt=v=>{if(typeof v==='string')return v;try{return typeof v==='object'?JSON.stringify(v):String(v);}catch(e){return String(v);}};
function kursRunJSInline(code){   // Notlösung ohne Worker
  let out='';const f=(...a)=>{out+=a.map(kursFmt).join(' ')+'\n';},con={log:f,info:f,warn:f,error:f};
  try{new Function('console',code)(con);return {output:out};}catch(e){return {output:out,error:e.name+': '+e.message};}
}
function kursRunJS(code){
  return new Promise(resolve=>{
    let w=null,timer=null,url=null;
    const done=r=>{clearTimeout(timer);try{if(w)w.terminate();}catch(e){}try{if(url)URL.revokeObjectURL(url);}catch(e){}resolve(r);};
    try{url=URL.createObjectURL(new Blob([KURS_WORKER_SRC],{type:'text/javascript'}));w=new Worker(url);}
    catch(e){resolve(kursRunJSInline(code));return;}
    w.onmessage=e=>done(e.data);
    w.onerror=e=>done({output:'',error:'Fehler: '+(e.message||'unbekannt')});
    timer=setTimeout(()=>done({output:'',error:'Zeitüberschreitung: Das Programm läuft länger als '+(KURS_TIMEOUT/1000)+' Sekunden (vielleicht eine Endlosschleife?).'}),KURS_TIMEOUT);
    w.postMessage(code);
  });
}
/* SQL: Python-Programm für SQLite (läuft in Pyodide, in Tests mit echtem Python). Erwartet die Variablen setup_sql (legt die Beispieldatenbank an) und user_sql.
   Ausgabe je Abfrage: Spaltennamen, dann je Zeile die Werte mit „ | “ getrennt (Kommazahlen auf 2 Stellen gerundet); Anweisungen ohne Ergebnis melden „OK“. */
const KURS_SQL_RUNNER=
"import sqlite3\n"+
"_con = sqlite3.connect(':memory:')\n"+
"_cur = _con.cursor()\n"+
"_cur.executescript(setup_sql)\n"+
"def _fmt(v):\n"+
"    if v is None:\n"+
"        return 'NULL'\n"+
"    if isinstance(v, float):\n"+
"        return str(round(v, 2))\n"+
"    return str(v)\n"+
"_buf = ''\n"+
"def _run(stmt):\n"+
"    try:\n"+
"        _cur.execute(stmt)\n"+
"        if _cur.description:\n"+
"            print(' | '.join(d[0] for d in _cur.description))\n"+
"            for row in _cur.fetchall():\n"+
"                print(' | '.join(_fmt(v) for v in row))\n"+
"        else:\n"+
"            print('OK')\n"+
"    except Exception as e:\n"+
"        print('Fehler: ' + str(e))\n"+
"for _line in user_sql.split('\\n'):\n"+
"    _buf += _line + '\\n'\n"+
"    if sqlite3.complete_statement(_buf):\n"+
"        _run(_buf.strip())\n"+
"        _buf = ''\n"+
"if any(l.strip() and not l.strip().startswith('--') for l in _buf.split('\\n')):\n"+
"    print('Fehler: Die letzte Anweisung ist nicht beendet (fehlt ein Semikolon?)')\n";
/* Git: Beispielantworten (der Kurs führt nichts wirklich aus, er prüft die Befehle und zeigt, was Git sagen würde) */
const KURS_GIT_REPLIES=[
  [/^git --version$/,()=>'git version 2.45.0'],
  [/^git init$/,()=>'Leeres Git-Repository in …/.git/ angelegt'],
  [/^git status$/,()=>'Auf Branch main\nNichts zu committen, Arbeitsverzeichnis unverändert'],
  [/^git add\b/,()=>''],
  [/^git commit -m "(.+)"$/,m=>'[main 3f2a9c1] '+m[1]+'\n 1 file changed, 1 insertion(+)'],
  [/^git commit\b/,()=>'Bitte gib mit -m "Nachricht" an, was sich geändert hat.'],
  [/^git log --oneline$/,()=>'3f2a9c1 (HEAD -> main) Erste Version'],
  [/^git log$/,()=>'commit 3f2a9c1e8b4d…\nAuthor: Du <du@beispiel.de>\n\n    Erste Version'],
  [/^git diff\b/,()=>'--- a/datei.txt\n+++ b/datei.txt\n-alte Zeile\n+neue Zeile'],
  [/^git restore\b/,()=>''],
  [/^git branch$/,()=>'* main'],
  [/^git branch (-d )?(\S+)$/,()=>''],
  [/^git (switch|checkout) (-c|-b) (\S+)$/,m=>"Zu neuem Branch '"+m[3]+"' gewechselt"],
  [/^git (switch|checkout) (\S+)$/,m=>"Zu Branch '"+m[2]+"' gewechselt"],
  [/^git merge (\S+)$/,()=>'Aktualisiere 3f2a9c1..8b1d4e7\nFast-forward\n 1 file changed, 2 insertions(+)'],
  [/^git clone (\S+)$/,m=>"Klone nach '"+(m[1].split('/').pop()||'repo').replace(/\.git$/,'')+"' …\nfertig."],
  [/^git pull$/,()=>'Bereits aktuell.'],
  [/^git push$/,()=>'Zu origin gepusht: main -> main'],
  [/^git revert HEAD$/,()=>'[main 9d3c2aa] Revert "Erste Version"\n 1 file changed, 1 deletion(-)'],
  [/^(mkdir|cd|ls|touch|echo|cat|pwd)\b/,()=>'']
];
function kursGitSim(code){
  const out=[];
  String(code).split('\n').forEach(raw=>{
    const l=raw.replace(/#.*$/,'').trim().replace(/\s+/g,' ');if(!l)return;
    out.push('$ '+l);
    const hit=KURS_GIT_REPLIES.find(r=>r[0].test(l));
    if(hit){const t=hit[1](l.match(hit[0]));if(t)out.push(t);}
    else if(/^git (\S+)/.test(l))out.push("git: '"+l.split(' ')[1]+"' ist kein bekannter Git-Befehl.");
    else out.push('Befehl nicht gefunden: '+l.split(' ')[0]);
  });
  return out.join('\n');
}
/* Seite mit Skript ausführen: die Seite läuft in einer abgeschotteten Umgebung (sandbox ohne same-origin) und meldet nach dem Laden eine Kopie ihres Inhalts */
function kursDomSrcdoc(code,after,id){
  const pre='<script data-ck>(function(){window.__ck=[];var l=function(){window.__ck.push(Array.prototype.map.call(arguments,function(x){try{return typeof x===\'object\'?JSON.stringify(x):String(x);}catch(e){return String(x);}}).join(\' \'));};console.log=console.info=console.warn=console.error=l;window.addEventListener(\'error\',function(e){window.__ck.push(\'Fehler: \'+e.message);});window.alert=function(m){window.__ck.push(\'alert: \'+m);};})();<\/script>';
  const post='<script data-ck>window.addEventListener(\'load\',function(){setTimeout(function(){try{'+(after||'')+'}catch(e){window.__ck.push(\'Fehler: \'+e.message);}setTimeout(function(){document.querySelectorAll(\'script[data-ck]\').forEach(function(s){s.remove();});parent.postMessage({kurs:1,id:'+JSON.stringify(id)+',html:\'<!DOCTYPE html>\'+document.documentElement.outerHTML,logs:window.__ck},\'*\');},30);},30);});<\/script>';
  return pre+code+'\n'+post;
}
function kursDomParse(html){try{return new DOMParser().parseFromString(html,'text/html');}catch(e){return null;}}

/* ── Oberfläche ── */
let kursCourse=null,kursTopic=null,kursMode='home',kursIdx=0,kursPlayLang='python',kursStore=kursLoadStore(),kursBuilt=false,kursAc=null,kursRunning=false,kursTimer=null,kursPy=null,kursEls={},kursAnnounced='',kursRunId=0;
const kursEl=id=>document.getElementById('ck-'+id);
function kursActiveScreen(){const s=document.getElementById('screen-kurs');return !!s&&s.classList.contains('active');}
const kursCourses=()=>window.KURS_COURSES||[];
const kursHints=()=>window.KURS_HINTS||{};
function kursSave(){kursSaveStore(kursStore);}
const kursLang=()=>(kursMode==='play'?(kursPlayLang==='html'?'dom':kursPlayLang):(kursCourse?kursCourse.lang:''));
const kursEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const kursStars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
function kursBuild(){
  const root=document.getElementById('kurs-root');if(!root)return false;
  root.innerHTML=`<div class="ck-top"><button class="ck-btn ck-menu" id="ck-menu" type="button">☰ Menü</button><button class="ck-btn" id="ck-overview" type="button">🏠 Alle Kurse</button><button class="ck-btn" id="ck-playbtn" type="button">🧪 Spielplatz</button><span class="ck-total" id="ck-total"></span></div>
  <div class="ck-layout"><nav class="ck-side" id="ck-side"></nav><main class="ck-main">
    <section id="ck-home" class="ck-home"><h2>Programmieren lernen 💻</h2><p>Wähle ein Thema. Jede Lektion erklärt etwas kurz und gibt dir dann eine Aufgabe, die du direkt hier im Editor löst. Dein Fortschritt, deine Sterne und deine Coins werden automatisch gespeichert – für jedes Konto getrennt.</p><div id="ck-topics" class="ck-cards"></div></section>
    <section id="ck-topic" class="ck-home ck-hidden"><h2 id="ck-topicTitle"></h2><p id="ck-topicDesc"></p><div id="ck-cards" class="ck-cards"></div></section>
    <section id="ck-lesson" class="ck-lesson ck-hidden">
      <article class="ck-text" id="ck-textbox"><div class="ck-crumbs" id="ck-crumbs"></div><h2 id="ck-lessonTitle"></h2><div id="ck-lessonContent" class="ck-content"></div>
        <div class="ck-task"><h3>🎯 Aufgabe</h3><div id="ck-taskText"></div></div>
        <div class="ck-nav"><button id="ck-prevBtn" class="ck-btn" type="button">← Zurück</button><button id="ck-nextBtn" class="ck-btn" type="button">Weiter →</button></div></article>
      <article class="ck-text ck-hidden" id="ck-playbox"><h2>🧪 Spielplatz</h2><p class="ck-muted">Probiere Code frei aus – ohne Aufgabe und ohne Prüfung. Alles bleibt in deinem Konto gespeichert.</p>
        <div class="ck-chips" id="ck-playlangs"></div><div class="ck-playrow"><input id="ck-snipname" class="ck-input" maxlength="40" placeholder="Name für den Schnipsel"><button class="ck-btn primary" id="ck-snipsave" type="button">💾 Speichern</button><button class="ck-btn" id="ck-playnew" type="button">Neu</button></div>
        <div id="ck-playmsg" class="ck-muted"></div><div class="ck-label">Deine Schnipsel</div><div id="ck-snips"></div></article>
      <div class="ck-work">
        <div class="ck-editor-wrap"><div class="ck-head"><span id="ck-langLabel"></span><span class="ck-hint">Strg + Enter = Ausführen</span></div>
          <div class="ck-code-box"><pre id="ck-gutter" class="ck-gutter" aria-hidden="true"></pre><div class="ck-code-area"><pre id="ck-hl" class="ck-hl" aria-hidden="true"></pre><textarea id="ck-editor" wrap="off" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea></div></div>
          <div class="ck-actions"><button id="ck-runBtn" class="ck-btn primary" type="button">▶ Ausführen &amp; Prüfen</button><button id="ck-hintBtn" class="ck-btn" type="button">💡 Tipp</button><button id="ck-solutionBtn" class="ck-btn" type="button">🔑 Lösung</button><button id="ck-resetBtn" class="ck-btn ghost" type="button">↺ Zurücksetzen</button></div></div>
        <div class="ck-output-wrap"><div class="ck-head"><span id="ck-outputLabel">Ausgabe</span></div><pre id="ck-output" class="ck-output"></pre>
          <iframe id="ck-preview" class="ck-preview ck-hidden" sandbox="allow-same-origin" title="Vorschau"></iframe>
          <iframe id="ck-domview" class="ck-preview ck-hidden" sandbox="allow-scripts" title="Seite"></iframe><div id="ck-result" class="ck-result ck-hidden"></div></div>
      </div></section></main></div>`;
  kursEls={side:kursEl('side'),home:kursEl('home'),topic:kursEl('topic'),lesson:kursEl('lesson'),topics:kursEl('topics'),cards:kursEl('cards'),editor:kursEl('editor'),output:kursEl('output'),preview:kursEl('preview'),domview:kursEl('domview'),result:kursEl('result'),total:kursEl('total'),hl:kursEl('hl'),gutter:kursEl('gutter'),textbox:kursEl('textbox'),playbox:kursEl('playbox')};
  kursEl('menu').onclick=()=>kursEls.side.classList.toggle('open');
  kursEl('overview').onclick=kursShowHome;
  kursEl('playbtn').onclick=kursShowPlay;
  kursEl('runBtn').onclick=kursRun;
  kursEl('hintBtn').onclick=kursHintClick;
  kursEl('solutionBtn').onclick=()=>{
    if(!confirm('Wirklich die Lösung anzeigen? Versuch es vorher ruhig noch einmal! (Dann gibt es für diese Lektion höchstens 1 Stern.)'))return;
    const k=kursKey(kursCourse,kursIdx);kursStore.used[k]=2;
    kursEls.editor.value=kursCourse.lessons[kursIdx].solution;kursRefreshEditor();
    kursStore.code[k]=kursEls.editor.value;kursSave();kursLivePreview();
  };
  kursEl('resetBtn').onclick=()=>{
    if(!confirm('Deinen Code auf den Anfang zurücksetzen?'))return;
    if(kursMode==='play'){kursEls.editor.value=KURS_PLAY_LANGS[kursPlayLang].tpl;kursStore.play[kursPlayLang]=kursEls.editor.value;}
    else{delete kursStore.code[kursKey(kursCourse,kursIdx)];kursEls.editor.value=kursCourse.lessons[kursIdx].starter;}
    kursSave();kursRefreshEditor();kursEls.result.className='ck-result ck-hidden';kursLivePreview();
  };
  kursEl('prevBtn').onclick=()=>kursOpenLesson(kursCourse,kursIdx-1);
  kursEl('nextBtn').onclick=()=>kursOpenLesson(kursCourse,kursIdx+1);
  kursEl('snipsave').onclick=kursSnipSaveClick;
  kursEl('playnew').onclick=()=>{kursEls.editor.value=KURS_PLAY_LANGS[kursPlayLang].tpl;kursStore.play[kursPlayLang]=kursEls.editor.value;kursSave();kursRefreshEditor();kursLivePreview();kursEl('snipname').value='';};
  const ed=kursEls.editor;
  ed.addEventListener('scroll',kursSyncScroll);
  ed.addEventListener('input',kursRefreshEditor);
  // Muss vor dem keydown-Handler des Editors registriert werden, damit Pfeile/Enter/Tab zuerst beim Popup landen
  kursAc=window.kursAutocomplete?window.kursAutocomplete(ed,()=>kursLang()):{close(){}};
  ed.addEventListener('input',()=>{
    if(kursMode==='play')kursStore.play[kursPlayLang]=ed.value;else if(kursCourse)kursStore.code[kursKey(kursCourse,kursIdx)]=ed.value;
    clearTimeout(kursTimer);
    kursTimer=setTimeout(()=>{kursSave();kursLivePreview();},300);
  });
  ed.addEventListener('keydown',kursKeydown);
  ed.addEventListener('beforeinput',kursBeforeInput);
  window.addEventListener('message',kursOnMessage);
  return true;
}
function kursEnsure(){if(!kursBuilt)kursBuilt=kursBuild();return kursBuilt;}
window.kursCurrentId=()=>(kursMode==='play'?'play':kursCourse?(kursTopicOf(kursCourse)||{}).id||'':kursMode==='topic'&&kursTopic?kursTopic.id:'');
function kursAnnounce(){const id=window.kursCurrentId();if(id===kursAnnounced)return;kursAnnounced=id;try{if(typeof sbRefresh==='function')sbRefresh();}catch(e){}}
/* Aufruf von goTo('kurs-…'): id = Thema (python, javascript, web, sql, git), „play“ (Spielplatz), ein Kurskürzel oder leer (Übersicht) */
function kursInit(id){
  if(!kursEnsure())return;
  kursStore=kursLoadStore();
  const course=kursCourses().find(x=>x.id===id),topic=KURS_TOPICS.find(t=>t.id===id);
  if(id==='play')kursShowPlay();
  else if(course)kursOpenLesson(course,kursFirstOpen(course,kursStore.done));
  else if(topic)kursShowTopic(topic);
  else kursShowHome();
  kursUpdateTiles();
}
function kursUpdateTiles(){
  KURS_TOPICS.forEach(t=>{
    const el=document.querySelector('.app-tile[data-appid="kurs-'+t.id+'"] .app-tile-desc');if(!el)return;
    const tot=kursTotals(kursTopicCourses(t,kursCourses()),kursStore.done);el.textContent=tot.done+' von '+tot.all+' Lektionen';
  });
}
function kursRenderTotal(){
  const list=kursCourse?kursSiblings(kursCourse,kursCourses()):kursMode==='topic'&&kursTopic?kursTopicCourses(kursTopic,kursCourses()):kursCourses(),t=kursTotals(list,kursStore.done);
  const name=kursCourse?(kursTopicOf(kursCourse)||{}).name:kursMode==='topic'&&kursTopic?kursTopic.name:'';
  kursEls.total.textContent=kursMode==='play'?'🧪 Spielplatz':(name?name+': ':'')+t.done+' / '+t.all+' Lektionen · ★ '+kursStarSum(list,kursStore.stars);
}
function kursView(v){
  kursMode=v;
  kursEls.home.classList.toggle('ck-hidden',v!=='home');kursEls.topic.classList.toggle('ck-hidden',v!=='topic');kursEls.lesson.classList.toggle('ck-hidden',v!=='lesson'&&v!=='play');
  kursEls.textbox.classList.toggle('ck-hidden',v!=='lesson');kursEls.playbox.classList.toggle('ck-hidden',v!=='play');
  ['hintBtn','solutionBtn'].forEach(id=>kursEl(id).classList.toggle('ck-hidden',v==='play'));
  kursEl('runBtn').textContent=v==='play'?'▶ Ausführen':'▶ Ausführen & Prüfen';
  kursEls.side.classList.remove('open');
}
function kursRenderSidebar(){
  kursEls.side.innerHTML='';
  const add=(txt,cls,fn,title)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.innerHTML=txt;if(fn)b.onclick=fn;if(title)b.title=title;kursEls.side.appendChild(b);return b;};
  if(kursCourse||kursMode==='topic'){
    const topic=kursCourse?kursTopicOf(kursCourse):kursTopic;
    (topic?kursTopicCourses(topic,kursCourses()):[kursCourse]).forEach(c=>{
      const h=document.createElement('h3');h.innerHTML=c.emoji+' '+c.title+' <small>'+kursDoneCount(c,kursStore.done)+'/'+c.lessons.length+'</small>';
      h.onclick=()=>kursOpenLesson(c,kursFirstOpen(c,kursStore.done));kursEls.side.appendChild(h);
      if(kursCourse!==c)return;   // nur der gewählte Kurs zeigt seine Lektionen
      c.lessons.forEach((l,i)=>{
        const b=document.createElement('button');b.type='button';
        b.className='ck-link'+(kursCourse===c&&kursIdx===i&&kursMode==='lesson'?' active':'');
        const k=kursKey(c,i),locked=!kursIsUnlocked(c,i,kursStore.done),done=kursStore.done[k],mark=done?'✅':locked?'🔒':(i+1)+'.';
        b.innerHTML='<span class="mark">'+mark+'</span><span class="ck-ltitle"></span>'+(done?'<span class="ck-lstars" title="'+(kursStore.stars[k]||1)+' von 3 Sternen">'+'★'.repeat(kursStore.stars[k]||1)+'</span>':'');
        b.querySelector('.ck-ltitle').textContent=l.title;
        if(locked){b.disabled=true;b.classList.add('locked');b.title='Schließe erst die Lektionen davor ab';}
        else b.onclick=()=>kursOpenLesson(c,i);
        kursEls.side.appendChild(b);
      });
    });
    add('← Alle Themen','ck-link ck-sidefoot',kursShowHome);
  }else{
    KURS_TOPICS.forEach(t=>{const tot=kursTotals(kursTopicCourses(t,kursCourses()),kursStore.done);
      add(t.emoji+' '+t.name+' <small>'+tot.done+'/'+tot.all+'</small>','ck-link ck-topiclink',()=>kursShowTopic(t));});
    add('🧪 Spielplatz','ck-link ck-topiclink'+(kursMode==='play'?' active':''),kursShowPlay);
  }
}
function kursRenderHome(){
  kursEls.topics.innerHTML='';
  KURS_TOPICS.forEach(t=>{
    const cs=kursTopicCourses(t,kursCourses()),tot=kursTotals(cs,kursStore.done),card=document.createElement('button');card.type='button';card.className='ck-card';
    card.innerHTML='<div class="emoji">'+t.emoji+'</div><h3></h3><p></p><div class="ck-bar"><div style="width:'+(tot.all?tot.done/tot.all*100:0)+'%"></div></div><small>'+tot.done+' von '+tot.all+' Lektionen · '+cs.length+(cs.length===1?' Kurs':' Kurse')+' · ★ '+kursStarSum(cs,kursStore.stars)+'</small>';
    card.querySelector('h3').textContent=t.name;card.querySelector('p').textContent=t.desc;card.onclick=()=>kursShowTopic(t);kursEls.topics.appendChild(card);
  });
  const play=document.createElement('button');play.type='button';play.className='ck-card';play.innerHTML='<div class="emoji">🧪</div><h3>Spielplatz</h3><p>Code frei ausprobieren: Python, JavaScript, HTML und SQL, mit gespeicherten Schnipseln.</p><small>ohne Aufgabe und Prüfung</small>';play.onclick=kursShowPlay;kursEls.topics.appendChild(play);
}
function kursRenderTopic(){
  kursEl('topicTitle').textContent=kursTopic.emoji+' '+kursTopic.name;kursEl('topicDesc').textContent=kursTopic.desc;kursEls.cards.innerHTML='';
  kursTopicCourses(kursTopic,kursCourses()).forEach(c=>{
    const done=kursDoneCount(c,kursStore.done),card=document.createElement('button');card.type='button';card.className='ck-card';
    card.innerHTML='<div class="emoji">'+c.emoji+'</div><h3></h3><p></p><div class="ck-bar"><div style="width:'+(done/c.lessons.length)*100+'%"></div></div><small>'+done+' von '+c.lessons.length+' Lektionen'+(done===c.lessons.length?' · ✅ geschafft':'')+'</small>';
    card.querySelector('h3').textContent=c.title;card.querySelector('p').textContent=c.desc;card.onclick=()=>kursOpenLesson(c,kursFirstOpen(c,kursStore.done));kursEls.cards.appendChild(card);
  });
}
function kursShowHome(){kursCourse=null;kursTopic=null;kursView('home');kursRenderHome();kursRenderSidebar();kursRenderTotal();kursAnnounce();}
function kursShowTopic(t){
  kursCourse=null;kursTopic=t;const cs=kursTopicCourses(t,kursCourses());
  if(cs.length===1){kursOpenLesson(cs[0],kursFirstOpen(cs[0],kursStore.done));return;}   // Thema mit nur einem Kurs: gleich hinein
  kursView('topic');kursRenderTopic();kursRenderSidebar();kursRenderTotal();kursAnnounce();window.scrollTo({top:0});
}
function kursUpdateNext(){
  const last=kursIdx===kursCourse.lessons.length-1,next=kursEl('nextBtn'),done=!!kursStore.done[kursKey(kursCourse,kursIdx)];
  next.disabled=last||!done;next.title=!last&&!done?'Löse erst diese Aufgabe, dann geht es weiter':'';
}
/* Ausgabebereich je Sprache: Text, Vorschau (html, prüfbar) oder Seite mit Skript (dom/Spielplatz-HTML) */
function kursSetOutputKind(lang){
  const web=lang==='html',dom=lang==='dom';
  kursEls.output.classList.toggle('ck-hidden',web||dom);kursEls.preview.classList.toggle('ck-hidden',!web);kursEls.domview.classList.toggle('ck-hidden',!dom);
  kursEl('outputLabel').textContent=web||dom?'Vorschau':'Ausgabe';
  kursEls.output.textContent='';kursEls.result.className='ck-result ck-hidden';
}
function kursOpenLesson(c,i){
  if(kursAc)kursAc.close();
  if(!kursIsUnlocked(c,i,kursStore.done))i=kursFirstOpen(c,kursStore.done);
  i=Math.max(0,Math.min(c.lessons.length-1,i));
  kursCourse=c;kursTopic=kursTopicOf(c);kursIdx=i;kursView('lesson');kursEl('hintBtn').textContent=kursStore.used[kursKey(c,i)]?'💡 Noch ein Tipp':'💡 Tipp';
  const l=c.lessons[i],k=kursKey(c,i);
  kursEl('crumbs').textContent=c.title+' · Lektion '+(i+1)+' von '+c.lessons.length+(kursStore.done[k]?' · '+kursStars(kursStore.stars[k]||1):'');
  kursEl('lessonTitle').textContent=l.title;kursEl('lessonContent').innerHTML=l.content;kursAddExampleButtons();
  kursEl('taskText').innerHTML=l.task;kursEl('langLabel').textContent=c.langLabel;
  kursEls.editor.value=kursStore.code[k]!==undefined?kursStore.code[k]:l.starter;kursRefreshEditor();
  kursSetOutputKind(c.lang);
  kursEl('prevBtn').disabled=i===0;kursUpdateNext();
  kursLivePreview();
  kursRenderSidebar();kursRenderTotal();window.scrollTo({top:0});kursAnnounce();
}
/* ── Spielplatz ── */
function kursShowPlay(){
  if(kursAc)kursAc.close();
  kursCourse=null;kursTopic=null;kursView('play');
  const pre=window.kursPlayPreset;
  if(pre&&KURS_PLAY_LANGS[pre.lang]){kursPlayLang=pre.lang;kursStore.play[pre.lang]=String(pre.code||'');kursSave();window.kursPlayPreset=null;}
  kursPlayLoad();kursRenderSidebar();kursRenderTotal();window.scrollTo({top:0});kursAnnounce();
}
function kursPlayLoad(){
  const lang=kursPlayLang;
  kursEl('langLabel').textContent=KURS_PLAY_LANGS[lang].name;
  kursEls.editor.value=kursStore.play[lang]!==undefined?kursStore.play[lang]:KURS_PLAY_LANGS[lang].tpl;kursRefreshEditor();
  kursSetOutputKind(lang==='html'?'dom':lang);kursLivePreview();kursRenderPlayPanel();
}
function kursPlayLangSet(l){if(!KURS_PLAY_LANGS[l])return;kursStore.play[kursPlayLang]=kursEls.editor.value;kursPlayLang=l;kursSave();kursPlayLoad();}
function kursRenderPlayPanel(){
  kursEl('playlangs').innerHTML=Object.keys(KURS_PLAY_LANGS).map(l=>'<button type="button" class="ck-chip'+(l===kursPlayLang?' active':'')+'" data-l="'+l+'">'+KURS_PLAY_LANGS[l].name+'</button>').join('');
  kursEl('playlangs').querySelectorAll('button').forEach(b=>{b.onclick=()=>kursPlayLangSet(b.dataset.l);});
  const names=Object.keys(kursStore.snips),box=kursEl('snips');
  box.innerHTML=names.length?'':'<div class="ck-muted">Noch nichts gespeichert.</div>';
  names.forEach(n=>{
    const s=kursStore.snips[n],row=document.createElement('div');row.className='ck-snip';
    row.innerHTML='<button type="button" class="ck-snipname"></button><span class="ck-muted">'+KURS_PLAY_LANGS[s.lang].name+'</span><button type="button" class="ck-btn ghost" title="Löschen">✕</button>';
    row.querySelector('.ck-snipname').textContent='📄 '+n;
    row.querySelector('.ck-snipname').onclick=()=>{kursStore.play[kursPlayLang]=kursEls.editor.value;kursPlayLang=s.lang;kursStore.play[s.lang]=s.code;kursSave();kursEl('snipname').value=n;kursPlayLoad();};
    row.querySelector('.ck-btn').onclick=()=>{if(confirm('Schnipsel „'+n+'“ löschen?')){kursSnipDelete(kursStore,n);kursSave();kursRenderPlayPanel();}};
    box.appendChild(row);
  });
}
function kursSnipSaveClick(){
  const r=kursSnipSave(kursStore,kursEl('snipname').value,kursPlayLang,kursEls.editor.value);
  kursEl('playmsg').textContent=r==='ok'?'Gespeichert.':r==='voll'?'Es sind schon '+KURS_SNIP_MAX+' Schnipsel gespeichert – lösche erst einen.':'Gib dem Schnipsel einen Namen.';
  if(r==='ok'){kursSave();kursRenderPlayPanel();}
}
/* Syntax-Farben und Zeilennummern */
function kursSyncScroll(){const code=kursEls.hl.firstChild;if(code)code.style.transform='translate('+(-kursEls.editor.scrollLeft)+'px,'+(-kursEls.editor.scrollTop)+'px)';kursEls.gutter.scrollTop=kursEls.editor.scrollTop;}
function kursRefreshEditor(){
  const v=kursEls.editor.value,html=window.kursHighlight?window.kursHighlight(v,kursLang()):kursEsc(v);
  kursEls.hl.innerHTML='<code>'+html+'\n </code>';
  const n=v.split('\n').length;let nums='';for(let i=1;i<=n;i++)nums+=i+'\n';kursEls.gutter.textContent=nums;kursSyncScroll();
}
function kursAddExampleButtons(){
  document.querySelectorAll('#ck-lessonContent pre').forEach(pre=>{
    const wrap=document.createElement('div');wrap.className='ck-example';pre.replaceWith(wrap);wrap.appendChild(pre);
    const btn=document.createElement('button');btn.type='button';btn.className='ck-load';btn.textContent='▶ In den Editor laden';
    btn.onclick=()=>{
      const starter=kursCourse.lessons[kursIdx].starter,ed=kursEls.editor,dirty=ed.value.trim()!==''&&ed.value!==starter;
      if(dirty&&!confirm('Dein Code im Editor wird ersetzt. Fortfahren?'))return;
      ed.value=pre.textContent;kursRefreshEditor();kursStore.code[kursKey(kursCourse,kursIdx)]=ed.value;kursSave();
      kursEls.result.className='ck-result ck-hidden';kursLivePreview();
    };
    wrap.appendChild(btn);
  });
}
function kursShowResult(kind,msg,extra){
  kursEls.result.className='ck-result '+kind;kursEls.result.textContent=msg;
  if(extra){const d=document.createElement('div');d.className='extra';d.textContent=extra;kursEls.result.appendChild(d);}
}
/* Geschafft: Sterne (je nach benutztem Tipp/Lösung), Coins und Lern-Serie */
function kursPay(n){try{const name=kursAccount();if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
function kursSolved(){
  const c=kursCourse,k=kursKey(c,kursIdx),stars=kursStarsFor(kursStore.used[k]|0);
  kursStore.done[k]=true;kursStore.stars[k]=Math.max(kursStore.stars[k]|0,stars);
  let coins=0,bonus=0;
  if(!kursStore.paid[k]){kursStore.paid[k]=true;coins+=kursPay(kursLessonCoins(stars));}
  if(kursDoneCount(c,kursStore.done)===c.lessons.length&&!kursStore.paid[c.id+'-all']){kursStore.paid[c.id+'-all']=true;bonus=kursPay(KURS_REWARD_BONUS);}
  kursSave();try{if(typeof lsMark==='function')lsMark('kurs');}catch(e){}
  kursRenderSidebar();kursRenderTotal();kursUpdateNext();kursUpdateTiles();
  kursEl('crumbs').textContent=c.title+' · Lektion '+(kursIdx+1)+' von '+c.lessons.length+' · '+kursStars(kursStore.stars[k]);
  const last=kursIdx===c.lessons.length-1;
  kursShowResult('ok','✅ Richtig! '+kursStars(stars)+(coins?' · 🪙 +'+coins:'')+(bonus?' · 🏆 Kurs geschafft: 🪙 +'+bonus:'')+' · '+(last?'Kurs abgeschlossen – stark! 🎉':'Weiter mit „Weiter →“.'));
}
function kursFinish(l,ctx){
  let res;try{res=l.check(ctx);}catch(e){res='Prüfung fehlgeschlagen: '+e.message;}
  if(res===true)kursSolved();else kursShowResult('fail','❌ Noch nicht ganz.',res);
}
/* Ausführen */
function kursScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('nicht ladbar: '+src));};document.head.appendChild(s);});}
function kursLoadPy(){
  if(kursPy)return kursPy;
  kursPy=kursScript(KURS_PYODIDE_LOCAL).catch(()=>kursScript(KURS_PYODIDE))   // erst die lokale Kopie, dann das Netz
    .then(()=>loadPyodide(),()=>{throw new Error('Python konnte nicht geladen werden. Lege den Ordner pyodide neben AppHub.html oder verbinde dich mit dem Internet.');})
    .catch(e=>{kursPy=null;throw e;});
  return kursPy;
}
async function kursRunPython(code){
  const py=await kursLoadPy();let out='';
  py.setStdout({batched:s=>{out+=s+'\n';}});py.setStderr({batched:s=>{out+=s+'\n';}});
  py.setStdin({stdin:()=>{const v=prompt('Python fragt nach einer Eingabe:');return v===null?'':v;}});
  try{await py.runPythonAsync(code,{globals:py.toPy({})});return {output:out};}
  catch(e){const msg=String(e.message||e).trim().split('\n');return {output:out,error:msg.slice(-3).join('\n')};}
}
async function kursRunSql(code,setup){
  const py=await kursLoadPy();let out='';
  await py.loadPackage('sqlite3');
  py.setStdout({batched:s=>{out+=s+'\n';}});py.setStderr({batched:s=>{out+=s+'\n';}});
  try{await py.runPythonAsync(KURS_SQL_RUNNER,{globals:py.toPy({setup_sql:setup||'',user_sql:code})});return {output:out};}
  catch(e){return {output:out,error:String(e.message||e).trim().split('\n').slice(-2).join('\n')};}
}
function kursSqlSetup(){const s=kursCourses().find(c=>c.id==='sql');return s?s.lessons[0].setup:'';}
/* Seite mit Skript: wartet auf die Kopie der Seite, die sie nach dem Laden meldet */
let kursDomWait=null;
function kursOnMessage(e){
  const d=e.data;if(!d||d.kurs!==1||!kursDomWait||d.id!==kursDomWait.id||!kursEls.domview||e.source!==kursEls.domview.contentWindow)return;
  const w=kursDomWait;kursDomWait=null;clearTimeout(w.timer);w.resolve({html:String(d.html||''),logs:Array.isArray(d.logs)?d.logs.map(String):[]});
}
function kursRunDom(code,after){
  return new Promise(resolve=>{
    const id=++kursRunId;
    if(kursDomWait){clearTimeout(kursDomWait.timer);kursDomWait.resolve(null);}
    kursDomWait={id,resolve,timer:setTimeout(()=>{kursDomWait=null;kursEls.domview.srcdoc='<p style="font-family:sans-serif">Zeitüberschreitung</p>';resolve(null);},KURS_TIMEOUT+500)};
    kursEls.domview.srcdoc=kursDomSrcdoc(code,after,id);
  });
}
function kursRenderPreview(){return new Promise(resolve=>{kursEls.preview.onload=()=>resolve();kursEls.preview.srcdoc=kursEls.editor.value;});}
/* Live-Vorschau beim Tippen: HTML-Lektionen sofort, Seiten mit Skript einmal pro Pause (ohne die Klicks der Prüfung) */
function kursLivePreview(){
  const l=kursLang();
  if(l==='html')kursRenderPreview();
  else if(l==='dom')kursRunDom(kursEls.editor.value,'');
}
async function kursRun(){
  if(kursRunning)return;kursRunning=true;if(kursAc)kursAc.close();
  const btn=kursEl('runBtn');btn.disabled=true;kursEls.result.className='ck-result ck-hidden';
  const play=kursMode==='play',lang=kursLang(),code=kursEls.editor.value,l=play?null:kursCourse.lessons[kursIdx];
  if(play)kursStore.play[kursPlayLang]=code;else kursStore.code[kursKey(kursCourse,kursIdx)]=code;kursSave();
  try{
    if(lang==='html'){
      await kursRenderPreview();
      kursFinish(l,{code,win:kursEls.preview.contentWindow,doc:kursEls.preview.contentDocument});
    }else if(lang==='dom'){
      const r=await kursRunDom(code,play?'':(l.after||''));
      if(!r){kursShowResult('fail','❌ Die Seite hat nicht geantwortet.','Vielleicht läuft dein Skript endlos. Prüfe Schleifen und Bedingungen.');return;}
      if(!play)kursFinish(l,{code,doc:kursDomParse(r.html),logs:r.logs});
      else if(r.logs.length)kursShowResult('info','Ausgaben der Seite (console.log):',r.logs.join('\n'));
    }else{
      let r;
      if(lang==='python'||lang==='sql'){
        kursEls.output.textContent=(lang==='sql'?'Datenbank':'Python')+' wird geladen … (beim ersten Mal ein paar Sekunden)';
        try{r=lang==='sql'?await kursRunSql(code,play?kursSqlSetup():l.setup):await kursRunPython(code);}catch(e){kursEls.output.textContent=e.message;return;}
      }else if(lang==='git'){r={output:kursGitSim(code)};}
      else r=await kursRunJS(code);
      kursEls.output.textContent=r.output;
      if(r.error){
        const sp=document.createElement('span');sp.className='err';sp.textContent=r.error;kursEls.output.appendChild(sp);
        if(!play)kursShowResult('fail','❌ Fehler im Code.','Lies die rote Meldung in der Ausgabe – meist steht dort die Zeile und das Problem.');
      }else{
        if(!r.output)kursEls.output.textContent='(keine Ausgabe)';
        if(!play)kursFinish(l,{code,output:r.output});
      }
    }
  }finally{kursRunning=false;btn.disabled=false;}
}
/* Tipps in zwei Stufen: erst ein sanfter Hinweis, beim zweiten Klick der genauere Tipp. Wer einen Tipp benutzt, bekommt höchstens 2 Sterne. */
let kursHintStage=0,kursHintKey='';
function kursHintClick(){
  const k=kursKey(kursCourse,kursIdx);if(kursHintKey!==k){kursHintKey=k;kursHintStage=0;}
  const l=kursCourse.lessons[kursIdx],gentle=(kursHints()[kursCourse.id]||[])[kursIdx]||l.hint;
  kursHintStage=Math.min(kursHintStage+1,2);if(!kursStore.used[k]){kursStore.used[k]=1;kursSave();}
  kursEls.result.className='ck-result info';kursEls.result.textContent='💡 '+gentle;
  if(kursHintStage===2&&gentle!==l.hint){const d=document.createElement('div');d.className='extra';d.textContent='Noch genauer: '+l.hint;kursEls.result.appendChild(d);}
  kursEl('hintBtn').textContent=kursHintStage===1&&gentle!==l.hint?'💡 Noch ein Tipp':'💡 Tipp';
}
/* ── Editor-Komfort wie in VS Code ── */
const KURS_PAIRS={'(':')','[':']','{':'}','"':'"',"'":"'",'`':'`'};
const KURS_CLOSERS=new Set([')',']','}']);
const KURS_VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr']);
const kursIsWord=ch=>!!ch&&/[\p{L}\p{N}_]/u.test(ch);
// Text an der Cursorposition einfügen, so bleibt Rückgängig (Strg+Z) intakt
function kursInsert(ed,text,selStart,selEnd){
  if(selStart!==undefined)ed.setSelectionRange(selStart,selEnd);
  if(!document.execCommand('insertText',false,text)){ed.setRangeText(text,ed.selectionStart,ed.selectionEnd,'end');ed.dispatchEvent(new Event('input'));}
}
const kursIndentUnit=()=>(kursLang()==='python'?'    ':'  ');
function kursTab(ed,e){
  const unit=kursIndentUnit(),value=ed.value,s=ed.selectionStart,end=ed.selectionEnd;
  if(s===end&&!e.shiftKey){kursInsert(ed,unit);return;}
  const lineStart=value.lastIndexOf('\n',s-1)+1,ls=value.slice(lineStart,end).split('\n');
  const out=ls.map(l=>{if(!e.shiftKey)return unit+l;return l.startsWith(unit)?l.slice(unit.length):l.replace(/^ {1,4}/,'');});
  const text=out.join('\n');kursInsert(ed,text,lineStart,end);
  ed.setSelectionRange(Math.max(lineStart,s+(out[0].length-ls[0].length)),lineStart+text.length);
}
function kursEnter(ed){
  const value=ed.value,s=ed.selectionStart,end=ed.selectionEnd,lineStart=value.lastIndexOf('\n',s-1)+1,before=value.slice(lineStart,s);
  const indent=before.match(/^[ \t]*/)[0],prev=value[s-1],next=value[end],unit=kursIndentUnit();
  // Enter auf einer Zeile, die nur aus Einrückung besteht: Zeile leeren und ganz links weitermachen (so kommt man aus dem Block heraus)
  if(s===end&&indent.length>0&&before===indent){
    let lineEnd=value.indexOf('\n',end);if(lineEnd===-1)lineEnd=value.length;
    if(value.slice(end,lineEnd).trim()===''){kursInsert(ed,'\n',lineStart,lineEnd);return;}
  }
  const lastCh=before.trimEnd().slice(-1),opens=!!lastCh&&('([{'.includes(lastCh)||(kursLang()==='python'&&lastCh===':'));
  if(prev&&'([{'.includes(prev)&&next===KURS_PAIRS[prev]){   // {|} → Block mit Cursor in der Mitte
    kursInsert(ed,'\n'+indent+unit+'\n'+indent,s,end);const pos=s+1+indent.length+unit.length;ed.setSelectionRange(pos,pos);
  }else kursInsert(ed,'\n'+indent+(opens?unit:''),s,end);
}
/* Soll beim Tippen von k ein Gegenstück ergänzt werden? prev ist das Zeichen davor, next das dahinter. Es wird nur gepaart, wenn dahinter Leerraum, das Ende,
   ein schließendes Zeichen oder ein Anführungszeichen folgt (so klappt es auch in "…(" und `…${`); „${“ wird immer gepaart; Anführungszeichen mitten im Wort (don't) nicht. */
function kursShouldPair(k,prev,next){
  if(k==='{'&&prev==='$')return true;
  if(next&&!/[\s)\]}>,;:'"`]/.test(next))return false;
  if((k==='"'||k==="'"||k==='`')&&kursIsWord(prev))return false;
  return true;
}
function kursChar(ed,e,k){
  const value=ed.value,s=ed.selectionStart,end=ed.selectionEnd,prev=value[s-1],next=value[end],lang=kursLang();
  // Auto-Schließen von HTML-Tags: <div> → <div></div>
  if(k==='>'&&(lang==='html'||lang==='dom')&&s===end){
    const lineStart=value.lastIndexOf('\n',s-1)+1,m=value.slice(lineStart,s).match(/<([a-zA-Z][\w-]*)(?:\s[^<>]*)?$/);
    if(m&&!KURS_VOID.has(m[1].toLowerCase())&&!value.slice(lineStart,s).endsWith('/')){
      e.preventDefault();kursInsert(ed,'></'+m[1]+'>');ed.setSelectionRange(s+1,s+1);return true;
    }
    return false;
  }
  // Schließendes Zeichen überschreiben, wenn es schon da ist
  if((KURS_CLOSERS.has(k)||k==='"'||k==="'"||k==='`')&&s===end&&next===k){e.preventDefault();ed.setSelectionRange(s+1,s+1);return true;}
  if(!(k in KURS_PAIRS))return false;
  const close=KURS_PAIRS[k];
  if(s!==end){e.preventDefault();const sel=value.slice(s,end);kursInsert(ed,k+sel+close);ed.setSelectionRange(s+1,s+1+sel.length);return true;}   // Markierten Text umschließen
  if(!kursShouldPair(k,prev,next))return false;
  e.preventDefault();kursInsert(ed,k+close);ed.setSelectionRange(s+1,s+1);return true;
}
function kursKeydown(e){
  if(e.isComposing)return;const ed=kursEls.editor;
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();kursRun();return;}
  if(e.key==='Tab'){e.preventDefault();kursTab(ed,e);return;}
  if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();kursEnter(ed);return;}
  if(e.key==='Backspace'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&ed.selectionStart===ed.selectionEnd){
    const s=ed.selectionStart,prev=ed.value[s-1],next=ed.value[s],lineStart=ed.value.lastIndexOf('\n',s-1)+1,before=ed.value.slice(lineStart,s);
    // Steht links vom Cursor nur Einrückung, wird gleich eine ganze Einrückungsstufe gelöscht
    if(before.length>0&&/^ +$/.test(before)){
      const unitLen=kursIndentUnit().length,n=before.length%unitLen||unitLen;
      e.preventDefault();kursInsert(ed,'',s-n,s);ed.setSelectionRange(s-n,s-n);return;   // Chrome setzt den Cursor sonst eine Zeile zu weit oben
    }
    if(prev&&KURS_PAIRS[prev]&&next===KURS_PAIRS[prev]){e.preventDefault();kursInsert(ed,'',s-1,s+1);ed.setSelectionRange(s-1,s-1);}
  }
  if(!e.ctrlKey&&!e.metaKey)e.stopPropagation();   // normale Tasten im Editor lösen keine AppHub-Kurzbefehle aus (Strg+K usw. bleiben nutzbar)
}
// Zeichen über beforeinput abfangen: unabhängig vom Tastaturlayout, so funktionieren auch [ ] { } (AltGr) und Eingaben auf Touch-Geräten
let kursInBefore=false;
function kursBeforeInput(e){
  if(kursInBefore||e.isComposing||e.inputType!=='insertText'||!e.data||e.data.length!==1)return;
  kursInBefore=true;try{kursChar(kursEls.editor,e,e.data);}finally{kursInBefore=false;}
}
