/* ══════════════════════════════════
   WEBSEITEN-BAUKASTEN – eigene kleine Webseiten aus mehreren Dateien (HTML, CSS, JavaScript) bauen, sofort in der Vorschau sehen und als ZIP speichern.
   Je Konto bis zu 10 Projekte mit bis zu 8 Dateien (je höchstens 100 000 Zeichen); Vorlagen zum Start. Die Vorschau läuft abgeschottet (sandbox, nur Skripte),
   Dateien werden zusammengesetzt: <link rel="stylesheet" href="x.css"> und <script src="x.js"> nehmen den Inhalt der Projektdatei, Links zwischen den
   Seiten (<a href="ueber.html">) wechseln die Vorschau. Syntax-Farben und Vorschläge kommen aus den Programmierkursen (kurs-highlight.js, kurs-autocomplete.js).
   Gespeichert in zf_webbau: { konto: { projects: { Name: { files: { "index.html": "…" } } }, last: "Name" } }
══════════════════════════════════ */
const WB_KEY='zf_webbau',WB_MAX_PROJ=10,WB_MAX_FILES=8,WB_MAX_SIZE=100000;
const WB_FILE_RE=/^[a-z0-9_-]{1,24}\.(html|css|js)$/;
const WB_TEMPLATES=[
  {id:'leer',name:'Leere Seite',files:{'index.html':'<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>Meine Seite</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hallo Welt</h1>\n  <script src="script.js"></script>\n</body>\n</html>\n','style.css':'body {\n  font-family: Arial, sans-serif;\n  margin: 40px;\n}\n','script.js':'console.log("Seite geladen");\n'}},
  {id:'karte',name:'Visitenkarte',files:{'index.html':'<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>Visitenkarte</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="karte">\n    <h1>Anna Muster</h1>\n    <p class="beruf">Hobby-Programmiererin</p>\n    <ul>\n      <li>📍 Berlin</li>\n      <li>✉️ anna@beispiel.de</li>\n    </ul>\n    <button id="knopf">Hallo sagen</button>\n    <p id="gruss"></p>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>\n','style.css':'body {\n  background: #e0e7ff;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  margin: 0;\n  font-family: Arial, sans-serif;\n}\n.karte {\n  background: white;\n  padding: 30px 40px;\n  border-radius: 16px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);\n}\n.beruf { color: #6366f1; }\nul { list-style: none; padding: 0; }\nbutton { padding: 8px 16px; border-radius: 8px; border: none; background: #6366f1; color: white; cursor: pointer; }\n','script.js':'document.querySelector("#knopf").addEventListener("click", () => {\n  document.querySelector("#gruss").textContent = "Hallo! Schön, dass du da bist 👋";\n});\n'}},
  {id:'mehr',name:'Webseite mit zwei Seiten',files:{'index.html':'<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>Start</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <nav><a href="index.html">Start</a> <a href="ueber.html">Über mich</a></nav>\n  <h1>Willkommen</h1>\n  <p>Das ist meine erste Seite mit zwei Unterseiten.</p>\n</body>\n</html>\n','ueber.html':'<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>Über mich</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <nav><a href="index.html">Start</a> <a href="ueber.html">Über mich</a></nav>\n  <h1>Über mich</h1>\n  <p>Hier steht etwas über mich.</p>\n</body>\n</html>\n','style.css':'body { font-family: Arial, sans-serif; margin: 40px; }\nnav a { margin-right: 14px; color: #4f46e5; text-decoration: none; font-weight: bold; }\nh1 { border-bottom: 3px solid #4f46e5; padding-bottom: 6px; }\n'}}
];
/* ── Reine Logik (wird getestet) ── */
function wbValidName(n){return typeof n==='string'&&WB_FILE_RE.test(n);}
function wbAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n.toLowerCase();}}catch(e){}return '_gast';}
function wbAll(){try{const o=JSON.parse(localStorage.getItem(WB_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
/* Konto laden: nur gültige Projekte (Name 1–30 Zeichen, höchstens 10), gültige Dateinamen (höchstens 8), Text bis 100 000 Zeichen */
function wbLoad(){
  const a=wbAll()[wbAccount()]||{},out={projects:{},last:''};
  const P=a.projects&&typeof a.projects==='object'&&!Array.isArray(a.projects)?a.projects:{};let n=0;
  Object.keys(P).forEach(k=>{
    if(n>=WB_MAX_PROJ||!Object.prototype.hasOwnProperty.call(P,k))return;const name=String(k).trim().slice(0,30);if(!name||name in out.projects)return;
    const F=P[k]&&P[k].files&&typeof P[k].files==='object'&&!Array.isArray(P[k].files)?P[k].files:{},files={};let m=0;
    Object.keys(F).forEach(f=>{if(m>=WB_MAX_FILES||!wbValidName(f)||typeof F[f]!=='string'||!Object.prototype.hasOwnProperty.call(F,f))return;files[f]=F[f].slice(0,WB_MAX_SIZE);m++;});
    if(Object.keys(files).length){out.projects[name]={files};n++;}
  });
  out.last=typeof a.last==='string'&&a.last in out.projects?a.last:'';
  return out;
}
function wbSave(d){const all=wbAll();all[wbAccount()]=d;try{localStorage.setItem(WB_KEY,JSON.stringify(all));}catch(e){return false;}return true;}
/* neues Projekt aus Vorlage: 'ok', 'name' (leer/zu lang/schon vorhanden) oder 'voll' (10 Projekte) */
function wbCreate(d,name,tplId){
  name=String(name||'').trim();const t=WB_TEMPLATES.find(x=>x.id===tplId);
  if(!name||name.length>30||name in d.projects||!t)return 'name';
  if(Object.keys(d.projects).length>=WB_MAX_PROJ)return 'voll';
  d.projects[name]={files:Object.assign({},t.files)};d.last=name;return 'ok';
}
/* Datei anlegen: 'ok', 'name' (ungültig oder vorhanden), 'voll' (8 Dateien) */
function wbAddFile(p,name){
  name=String(name||'').trim().toLowerCase();if(!wbValidName(name)||name in p.files)return 'name';
  if(Object.keys(p.files).length>=WB_MAX_FILES)return 'voll';
  p.files[name]=name.endsWith('.html')?'<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>Neue Seite</title>\n</head>\n<body>\n\n</body>\n</html>\n':'';return 'ok';
}
function wbDeleteFile(p,name){if(!(name in p.files)||Object.keys(p.files).length<=1)return false;delete p.files[name];return true;}
const wbInlineSafe=(s,tag)=>String(s).replace(new RegExp('</'+tag,'gi'),'<\\/'+tag);
/* Seite für die Vorschau zusammensetzen: CSS- und JS-Dateien des Projekts werden eingesetzt, eine kleine Brücke meldet Klicks auf Links zu anderen Projektseiten */
function wbBuild(files,page){
  let h=files[page];if(typeof h!=='string')return '';
  h=h.replace(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi,(m,href)=>/\.css$/.test(href)&&Object.prototype.hasOwnProperty.call(files,href)?'<style>\n'+wbInlineSafe(files[href],'style')+'\n</style>':m);
  h=h.replace(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi,(m,src)=>/\.js$/.test(src)&&Object.prototype.hasOwnProperty.call(files,src)?'<script>\n'+wbInlineSafe(files[src],'script')+'\n<\/script>':m);
  const names=Object.keys(files).filter(f=>f.endsWith('.html'));
  const bridge='<script>document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href");if(h.charAt(0)==="#")return;e.preventDefault();if('+JSON.stringify(names)+'.indexOf(h)>-1)parent.postMessage({wb:1,file:h},"*");});<\/script>';
  return /<\/body>/i.test(h)?h.replace(/<\/body>/i,()=>bridge+'</body>'):h+bridge;
}
/* ZIP (ohne Kompression) – für den Export; Namen sind einfache ASCII-Dateinamen */
const WB_CRC=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function wbCrc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=WB_CRC[(c^b[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function wbZip(files,now){
  const enc=new TextEncoder(),d=now||new Date(),time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const parts=[],central=[];let offset=0;
  const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];
  Object.keys(files).forEach(name=>{
    const nb=enc.encode(name),data=enc.encode(files[name]),crc=wbCrc32(data);
    const local=[0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(time),...u16(date),...u32(crc),...u32(data.length),...u32(data.length),...u16(nb.length),...u16(0)];
    parts.push(Uint8Array.from(local),nb,data);
    central.push(Uint8Array.from([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(time),...u16(date),...u32(crc),...u32(data.length),...u32(data.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]),nb);
    offset+=local.length+nb.length+data.length;
  });
  const cdSize=central.reduce((n,x)=>n+x.length,0),count=Object.keys(files).length;
  const end=Uint8Array.from([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(count),...u16(count),...u32(cdSize),...u32(offset),...u16(0)]);
  const all=[...parts,...central,end],out=new Uint8Array(all.reduce((n,x)=>n+x.length,0));let p=0;all.forEach(x=>{out.set(x,p);p+=x.length;});return out;
}
/* ── Oberfläche ── */
let wbData=null,wbCur='',wbFile='',wbPage='',wbBuilt=false,wbTimer=null,wbAc=null,wbMsg='';
const wbEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const wbLang=f=>f.endsWith('.css')?'css':f.endsWith('.js')?'javascript':'dom';
function wbInit(){
  const root=document.getElementById('wb-root');if(!root)return;
  wbData=wbLoad();wbCur='';wbMsg='';wbRenderList();
}
function wbRenderList(){
  const root=document.getElementById('wb-root');if(!root)return;wbCur='';
  const names=Object.keys(wbData.projects);
  root.innerHTML=`<p class="wb-muted">Baue eigene Webseiten aus HTML, CSS und JavaScript. Alles bleibt in deinem Konto gespeichert, und du kannst deine Seite als ZIP-Datei herunterladen.</p>
  <div class="wb-card"><b>Neues Projekt</b><div class="wb-row"><input id="wb-name" class="wb-input" maxlength="30" placeholder="Projektname">
  <select id="wb-tpl" class="wb-input">${WB_TEMPLATES.map(t=>`<option value="${t.id}">${wbEsc(t.name)}</option>`).join('')}</select><button class="wb-btn primary" id="wb-new" type="button">Erstellen</button></div><div class="wb-muted" id="wb-msg">${wbEsc(wbMsg)}</div></div>
  <h3>Deine Projekte (${names.length}/${WB_MAX_PROJ})</h3><div id="wb-projects">${names.length?'':'<div class="wb-muted">Noch kein Projekt – leg oben eins an.</div>'}</div>`;
  const box=document.getElementById('wb-projects');
  names.forEach(n=>{const row=document.createElement('div');row.className='wb-proj';row.innerHTML='<button type="button" class="wb-open"></button><span class="wb-muted">'+Object.keys(wbData.projects[n].files).length+' Dateien</span><button type="button" class="wb-btn ghost" title="Löschen">✕</button>';
    row.querySelector('.wb-open').textContent='🌐 '+n;row.querySelector('.wb-open').onclick=()=>wbOpen(n);
    row.querySelector('.ghost').onclick=()=>{if(confirm('Projekt „'+n+'“ löschen?')){delete wbData.projects[n];if(wbData.last===n)wbData.last='';wbSave(wbData);wbRenderList();}};box.appendChild(row);});
  document.getElementById('wb-new').onclick=()=>{const r=wbCreate(wbData,document.getElementById('wb-name').value,document.getElementById('wb-tpl').value);
    if(r==='ok'){wbSave(wbData);wbMsg='';wbOpen(wbData.last);}else{wbMsg=r==='voll'?'Du hast schon '+WB_MAX_PROJ+' Projekte – lösche erst eins.':'Gib einen neuen Namen ein (höchstens 30 Zeichen, noch nicht vergeben).';document.getElementById('wb-msg').textContent=wbMsg;}};
}
function wbOpen(name){
  wbCur=name;const files=wbData.projects[name].files;wbFile=files['index.html']!==undefined?'index.html':Object.keys(files)[0];wbPage=Object.keys(files).find(f=>f.endsWith('.html'))||'';
  wbData.last=name;wbSave(wbData);
  const root=document.getElementById('wb-root');
  root.innerHTML=`<div class="wb-bar"><button class="wb-btn" id="wb-back" type="button">← Projekte</button><b id="wb-title"></b><span class="wb-spacer"></span><button class="wb-btn primary" id="wb-zip" type="button">⬇ Als ZIP speichern</button></div>
  <div class="wb-tabs" id="wb-tabs"></div>
  <div class="wb-split"><div class="wb-edwrap"><div class="wb-codebox"><pre id="wb-hl" class="wb-hl" aria-hidden="true"></pre><textarea id="wb-ed" wrap="off" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea></div><div class="wb-muted" id="wb-info"></div></div>
  <div class="wb-prevwrap"><div class="wb-muted" id="wb-pagelabel"></div><iframe id="wb-prev" sandbox="allow-scripts" title="Vorschau"></iframe></div></div>`;
  document.getElementById('wb-title').textContent=name;
  document.getElementById('wb-back').onclick=wbRenderList;
  document.getElementById('wb-zip').onclick=wbDownload;
  const ed=document.getElementById('wb-ed');
  ed.addEventListener('input',()=>{wbData.projects[wbCur].files[wbFile]=ed.value.slice(0,WB_MAX_SIZE);wbRefreshEd();clearTimeout(wbTimer);wbTimer=setTimeout(()=>{wbSave(wbData);wbPreview();},400);});
  ed.addEventListener('scroll',wbSync);
  wbAc=window.kursAutocomplete?window.kursAutocomplete(ed,()=>wbLang(wbFile)):null;   // vor dem keydown-Handler, damit das Vorschlags-Popup Enter/Tab zuerst bekommt
  ed.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();if(!document.execCommand('insertText',false,'  ')){ed.setRangeText('  ',ed.selectionStart,ed.selectionEnd,'end');ed.dispatchEvent(new Event('input'));}}
    else if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){const s=ed.selectionStart,ls=ed.value.lastIndexOf('\n',s-1)+1,ind=ed.value.slice(ls,s).match(/^[ \t]*/)[0];e.preventDefault();if(!document.execCommand('insertText',false,'\n'+ind)){ed.setRangeText('\n'+ind,s,ed.selectionEnd,'end');ed.dispatchEvent(new Event('input'));}}
    if(!e.ctrlKey&&!e.metaKey)e.stopPropagation();});
  window.removeEventListener('message',wbOnMessage);window.addEventListener('message',wbOnMessage);
  wbRenderTabs();wbLoadFile();
}
function wbRenderTabs(){
  const files=wbData.projects[wbCur].files,box=document.getElementById('wb-tabs');box.innerHTML='';
  Object.keys(files).forEach(f=>{const b=document.createElement('button');b.type='button';b.className='wb-tab'+(f===wbFile?' on':'');b.textContent=f;
    b.onclick=()=>{wbFile=f;if(f.endsWith('.html'))wbPage=f;wbRenderTabs();wbLoadFile();};box.appendChild(b);
    if(f===wbFile&&Object.keys(files).length>1){const x=document.createElement('button');x.type='button';x.className='wb-tab x';x.title='Datei löschen';x.textContent='✕';x.onclick=()=>{if(confirm('Datei „'+f+'“ löschen?')){wbDeleteFile(wbData.projects[wbCur],f);wbFile=Object.keys(files)[0];if(!(wbPage in files))wbPage=Object.keys(files).find(n=>n.endsWith('.html'))||'';wbSave(wbData);wbRenderTabs();wbLoadFile();}};box.appendChild(x);}});
  const add=document.createElement('button');add.type='button';add.className='wb-tab add';add.textContent='＋ Datei';
  add.onclick=()=>{const n=prompt('Name der neuen Datei (z. B. ueber.html, extra.css, spiel.js):');if(n===null)return;const r=wbAddFile(wbData.projects[wbCur],n);
    if(r==='ok'){wbFile=String(n).trim().toLowerCase();if(wbFile.endsWith('.html'))wbPage=wbFile;wbSave(wbData);wbRenderTabs();wbLoadFile();}else alert(r==='voll'?'Höchstens '+WB_MAX_FILES+' Dateien je Projekt.':'Ungültiger Name. Erlaubt: Kleinbuchstaben, Ziffern, - und _, dann .html, .css oder .js – und die Datei darf noch nicht existieren.');};
  box.appendChild(add);
}
function wbLoadFile(){const ed=document.getElementById('wb-ed');ed.value=wbData.projects[wbCur].files[wbFile]||'';wbRefreshEd();wbPreview();}
function wbSync(){const ed=document.getElementById('wb-ed'),c=document.getElementById('wb-hl').firstChild;if(c)c.style.transform='translate('+(-ed.scrollLeft)+'px,'+(-ed.scrollTop)+'px)';}
function wbRefreshEd(){const ed=document.getElementById('wb-ed'),v=ed.value;document.getElementById('wb-hl').innerHTML='<code>'+(window.kursHighlight?window.kursHighlight(v,wbLang(wbFile)):wbEsc(v))+'\n </code>';wbSync();
  document.getElementById('wb-info').textContent=wbFile+' · '+v.split('\n').length+' Zeilen · '+v.length+' von '+WB_MAX_SIZE+' Zeichen';}
function wbPreview(){
  const f=document.getElementById('wb-prev');if(!f||!wbCur)return;const files=wbData.projects[wbCur].files;
  if(!wbPage||!(wbPage in files)){f.srcdoc='<p style="font-family:sans-serif;color:#666">Lege eine HTML-Datei an, um die Vorschau zu sehen.</p>';document.getElementById('wb-pagelabel').textContent='';return;}
  document.getElementById('wb-pagelabel').textContent='Vorschau: '+wbPage;f.srcdoc=wbBuild(files,wbPage);
}
function wbOnMessage(e){const d=e.data,f=document.getElementById('wb-prev');if(!d||d.wb!==1||!f||e.source!==f.contentWindow||!wbCur)return;if(wbData.projects[wbCur].files[d.file]!==undefined&&d.file.endsWith('.html')){wbPage=d.file;wbPreview();}}
function wbDownload(){
  const bytes=wbZip(wbData.projects[wbCur].files),a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));a.download=wbCur.replace(/[^\w-]+/g,'_')+'.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
