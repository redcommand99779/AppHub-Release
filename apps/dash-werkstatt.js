/* ══════════════════════════════════
   LEVEL-WERKSTATT für Neon-Dash – eigene Level bauen, ausprobieren, vom Löser beweisen lassen und mit einem Code teilen.
   Bausteine: Stachel, Block-Turm (1–5 hoch), Lücke, Sprungfeld, Orb, Münze (höchstens 3), schwebender Block, Checkpoint. Länge 60–300 Kacheln.
   Das fertige Level wird als Spec für ndBuildLevel gebaut (dieselbe Physik wie die 8 Level). „Beweis prüfen“ lässt den Löser von neon-dash.js jede Eingabe Bild für Bild
   probieren: Nur ein bewiesen schaffbares Level bekommt einen Teilen-Code (ND1-…, mit Prüfsumme). Gespielte eigene Level geben keine Coins und keine Sterne.
   Je Konto bis zu 10 Level (zf_dashwerk): { konto: { levels: { Name: { c:Länge, h:Farbton, i:[[Typ,x,r],…], proof:"Prüfsumme" } } } }
══════════════════════════════════ */
const NDW_KEY='zf_dashwerk',NDW_MAX_LEVELS=10,NDW_MAX_ITEMS=400,NDW_MIN_COLS=60,NDW_MAX_COLS=300,NDW_MIN_X=10,NDW_TILE=20;
const NDW_SCALES=['Moll','Offen','Dur','Blues','Pentatonik','Wehmütig','Weit','Spannung'],NDW_TEMPOS=[100,124,150],NDW_NOTES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','H'];
const NDW_THEMES=[['Neon-Blau',190],['Grün',130],['Orange',30],['Lila',280],['Pink',320],['Gelb',60],['Türkis',170],['Rot',0]];
const NDW_TYPES={s:'Stachel',b:'Block-Turm',g:'Lücke',p:'Sprungfeld',o:'Orb',c:'Münze',f:'Schwebender Block',k:'Checkpoint'};
const NDW_GROUND_T=['s','b','g','p'];            // höchstens eins davon je Spalte
const NDW_FLOAT_T=['o','c','f'];                 // brauchen eine Zeile (2–10)
/* ── Reine Logik (wird getestet) ── */
/* Level prüfen und bereinigen: Name 1–30 Zeichen, Länge 60–300, Bausteine nur in erlaubten Spalten (10 … Länge−10), höchstens 400, 3 Münzen, 3 Checkpoints;
   in einer Spalte höchstens ein Bodenbaustein, gleiche Position nur einmal. Gibt null zurück, wenn gar nichts Brauchbares übrig bleibt. */
function ndwClean(lv){
  if(!lv||typeof lv!=='object')return null;
  const nm=lv.n===undefined?lv.name:lv.n;if(typeof nm!=='string')return null;const name=nm.trim().slice(0,30);if(!name)return null;
  const cols=Math.max(NDW_MIN_COLS,Math.min(NDW_MAX_COLS,(lv.c===undefined?lv.cols:lv.c)|0||NDW_MIN_COLS)),hue=((lv.h===undefined?lv.hue:lv.h)|0)%360;
  const src=Array.isArray(lv.i)?lv.i:Array.isArray(lv.items)?lv.items:[],out=[],seen=new Set(),ground=new Set();let coins=0,checks=0;
  for(const it of src){
    if(out.length>=NDW_MAX_ITEMS)break;if(!Array.isArray(it))continue;
    const t=it[0],x=it[1]|0,r=it[2]|0;
    if(!NDW_TYPES[t]||x<NDW_MIN_X||x>cols-NDW_MIN_X)continue;
    if(t==='b'){if(r<1||r>5)continue;}else if(NDW_FLOAT_T.includes(t)){if(r<2||r>10)continue;}
    const key=NDW_FLOAT_T.includes(t)?t+x+','+r:t+x;if(seen.has(key))continue;
    if(NDW_GROUND_T.includes(t)){if(ground.has(x))continue;ground.add(x);}
    if(t==='c'){if(coins>=3)continue;coins++;}if(t==='k'){if(checks>=3)continue;checks++;}
    seen.add(key);out.push([t,x,NDW_FLOAT_T.includes(t)||t==='b'?r:0]);
  }
  out.sort((a,b)=>a[1]-b[1]||(a[0]<b[0]?-1:1));
  const m=Array.isArray(lv.m)?lv.m:[1,0,0,124],tempo=NDW_TEMPOS.includes(m[3]|0)?m[3]|0:124;
  return {n:name,c:cols,h:hue<0?hue+360:hue,m:[m[0]?1:0,Math.max(0,Math.min(7,m[1]|0)),Math.max(0,Math.min(11,m[2]|0)),tempo],i:out};
}
/* Bauanweisung für ndBuildLevel (neon-dash.js) */
function ndwSpec(lv){
  const ops=lv.i.map(([t,x,r])=>t==='s'?['spike',x]:t==='b'?['block',x,1,r]:t==='g'?['gap',x,1]:t==='p'?['pad',x]:t==='o'?['orb',x,r]:t==='c'?['coin',x,r]:t==='f'?['plat',x,1,r]:['check',x]);
  ops.push(['end',lv.c-4]);return {id:'u',name:lv.n,hue:lv.h,cols:lv.c,ops};
}
/* Musik und Aussehen gehören zum Level: Farbton (h) färbt Hintergrund und Wände, m = [an, Tonleiter, Grundton, Tempo] */
function ndwBuild(lv){const L=ndBuildLevel(ndwSpec(lv)),m=ndwClean(lv).m;L.music={on:m[0],s:m[1],r:m[2],t:m[3]};return L;}
/* Löser: ist das Level schaffbar? */
function ndwProve(lv){const L=ndwBuild(lv),r=ndSolve(L);return {ok:r.ok,allCoins:r.allCoins,coins:L.coins,maxX:r.maxX,total:Math.round(L.endX/ND_T*10)/10};}
const ndwB64=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const ndwUnB64=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function ndwSum(s){let a=1,b=0;for(let i=0;i<s.length;i++){a=(a+s.charCodeAt(i))%65521;b=(b+a)%65521;}return ((b<<16|a)>>>0).toString(36);}
/* Teilen-Code: ND1-<Daten>-<Prüfsumme>; die Daten sind das Level als JSON (Base64, URL-sicher) */
function ndwEncode(lv){const c=ndwClean(lv);if(!c)return '';const p=ndwB64(JSON.stringify(c));return 'ND1-'+p+'-'+ndwSum(p);}
function ndwDecode(code){
  const m=/^ND1-([A-Za-z0-9_-]+)-([a-z0-9]+)$/.exec(String(code||'').trim().replace(/\s+/g,''));if(!m||m[2]!==ndwSum(m[1]))return null;
  try{const o=JSON.parse(ndwUnB64(m[1]));return ndwClean(o);}catch(e){return null;}
}
const ndwProofOf=lv=>{const c=ndwClean(lv);return ndwSum(JSON.stringify({n:c.n,c:c.c,i:c.i}));};   // nur Spielbares: Farben und Musik ändern den Beweis nicht
/* Konto: Level je Konto, nur gültige (ndwClean), höchstens 10; proof gilt nur, wenn er zum Inhalt passt */
function ndwAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n.toLowerCase();}}catch(e){}return '_gast';}
function ndwAll(){try{const o=JSON.parse(localStorage.getItem(NDW_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function ndwLoad(){
  const a=ndwAll()[ndwAccount()]||{},L=a.levels&&typeof a.levels==='object'&&!Array.isArray(a.levels)?a.levels:{},out={levels:{}};let n=0;
  Object.keys(L).forEach(k=>{if(n>=NDW_MAX_LEVELS||!Object.prototype.hasOwnProperty.call(L,k))return;const c=ndwClean(Object.assign({},L[k],{n:k}));if(!c)return;
    c.proof=typeof L[k].proof==='string'&&L[k].proof===ndwProofOf(c)?L[k].proof:'';out.levels[c.n]=c;n++;});
  return out;
}
function ndwSave(d){const all=ndwAll();all[ndwAccount()]=d;try{localStorage.setItem(NDW_KEY,JSON.stringify(all));}catch(e){return false;}return true;}
function ndwNew(d,name,cols){
  name=String(name||'').trim();if(!name||name.length>30||name in d.levels)return 'name';if(Object.keys(d.levels).length>=NDW_MAX_LEVELS)return 'voll';
  d.levels[name]={n:name,c:Math.max(NDW_MIN_COLS,Math.min(NDW_MAX_COLS,cols|0||120)),h:NDW_THEMES[Math.floor(Math.random()*NDW_THEMES.length)][1],m:[1,Math.floor(Math.random()*8),Math.floor(Math.random()*12),124],i:[],proof:''};return 'ok';
}
/* Baustein setzen (ersetzt in derselben Spalte einen Bodenbaustein); gibt true zurück, wenn sich etwas geändert hat. Änderungen löschen den Beweis. */
function ndwPlace(lv,t,x,row){
  const r=t==='b'?12-row:row,groundT=NDW_GROUND_T.includes(t);
  const keep=lv.i.filter(it=>!(groundT&&NDW_GROUND_T.includes(it[0])&&it[1]===x));
  const test=ndwClean({n:'x',c:lv.c,i:keep.concat([[t,x,r]])});
  if(!test||!test.i.some(it=>it[0]===t&&it[1]===x&&(t==='b'||NDW_FLOAT_T.includes(t)?it[2]===r:true)))return false;
  const before=JSON.stringify(lv.i);lv.i=test.i;lv.proof='';return JSON.stringify(lv.i)!==before;
}
/* Treffer beim Radieren: gehört der Baustein zur angeklickten Kachel (Spalte x, Zeile row 0–13)? */
function ndwHit(it,x,row){if(it[1]!==x)return false;const t=it[0];return t==='b'?row>=12-it[2]&&row<12:NDW_FLOAT_T.includes(t)?it[2]===row:t==='g'?row>=12:row===11;}
function ndwErase(lv,x,row){const n=lv.i.length;lv.i=lv.i.filter(it=>!ndwHit(it,x,row));if(lv.i.length!==n){lv.proof='';return true;}return false;}
/* ── Oberfläche ── */
let ndwData=null,ndwCur='',ndwTool='s',ndwMsg='',ndwBack=null;
const ndwEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function ndwOpen(){ndRegisterSounds();ndStopLoop();ndMusicStop();ndView='werk';nd=null;ndwData=ndwLoad();ndwCur='';ndwList();}
function ndwList(){
  const root=document.getElementById('nd-root');if(!root)return;ndwCur='';const names=Object.keys(ndwData.levels);
  root.innerHTML=`<div class="lrn-row" style="display:flex;gap:8px;margin-bottom:10px"><button class="lrn-btn ghost" onclick="ndShowMenu()">← Level</button><b style="align-self:center">🛠️ Level-Werkstatt</b></div>
  <p style="font-size:13px;color:var(--text-2)">Baue ein eigenes Neon-Dash-Level. Lass es vom Löser prüfen – ist es schaffbar, bekommst du einen Code, den du Freunden schicken kannst. Eigene Level geben keine Sterne und keine Coins.</p>
  <div class="lrn-card"><b>Neues Level</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><input id="ndw-name" class="lrn-input" maxlength="30" placeholder="Name" style="flex:1;min-width:140px"><select id="ndw-cols" class="lrn-input"><option value="80">kurz (80)</option><option value="120" selected>mittel (120)</option><option value="200">lang (200)</option><option value="300">sehr lang (300)</option></select><button class="lrn-btn" id="ndw-new">Erstellen</button></div></div>
  <div class="lrn-card" style="margin-top:10px"><b>Code einfügen</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><input id="ndw-code" class="lrn-input" placeholder="ND1-…" style="flex:1;min-width:200px"><button class="lrn-btn" id="ndw-import">Laden</button></div></div>
  <div id="ndw-msg" style="font-size:12px;color:var(--text-2);margin:8px 0">${ndwEsc(ndwMsg)}</div>
  <div class="lrn-label">Deine Level (${names.length}/${NDW_MAX_LEVELS})</div><div id="ndw-levels">${names.length?'':'<div style="font-size:12px;color:var(--text-3)">Noch keins.</div>'}</div>`;
  const box=document.getElementById('ndw-levels');
  names.forEach(n=>{const lv=ndwData.levels[n],row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--divider)';
    row.innerHTML='<button type="button" class="lrn-btn ghost" style="flex:1;text-align:left;font-weight:700"></button><span style="font-size:12px;color:var(--text-3)">'+lv.i.length+' Bausteine · '+lv.c+' Kacheln '+(lv.proof?'· ✔ geprüft':'· ungeprüft')+'</span><button type="button" class="lrn-btn ghost" title="Löschen">✕</button>';
    row.firstChild.textContent='🛠️ '+n;row.firstChild.onclick=()=>ndwEdit(n);
    row.lastChild.onclick=()=>{if(confirm('Level „'+n+'“ löschen?')){delete ndwData.levels[n];ndwSave(ndwData);ndwList();}};box.appendChild(row);});
  document.getElementById('ndw-new').onclick=()=>{const r=ndwNew(ndwData,document.getElementById('ndw-name').value,parseInt(document.getElementById('ndw-cols').value,10));
    if(r==='ok'){const n=document.getElementById('ndw-name').value.trim();ndwSave(ndwData);ndwMsg='';ndwEdit(n);}else{ndwMsg=r==='voll'?'Du hast schon '+NDW_MAX_LEVELS+' Level – lösche erst eins.':'Gib einen neuen Namen ein (höchstens 30 Zeichen, noch nicht vergeben).';document.getElementById('ndw-msg').textContent=ndwMsg;}};
  document.getElementById('ndw-import').onclick=()=>{const c=ndwDecode(document.getElementById('ndw-code').value);
    if(!c){ndwMsg='Dieser Code ist ungültig (Tippfehler oder abgeschnitten?).';document.getElementById('ndw-msg').textContent=ndwMsg;return;}
    let name=c.n,k=2;while(name in ndwData.levels)name=c.n.slice(0,26)+' '+(k++);
    if(Object.keys(ndwData.levels).length>=NDW_MAX_LEVELS){ndwMsg='Du hast schon '+NDW_MAX_LEVELS+' Level – lösche erst eins.';document.getElementById('ndw-msg').textContent=ndwMsg;return;}
    c.n=name;c.proof='';ndwData.levels[name]=c;ndwSave(ndwData);ndwMsg='„'+name+'“ geladen. Prüfe es mit dem Löser, bevor du es weitergibst.';ndwList();};
}
function ndwEdit(name){
  ndwCur=name;const lv=ndwData.levels[name],root=document.getElementById('nd-root');
  root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><button class="lrn-btn ghost" id="ndw-back">← Werkstatt</button><b id="ndw-title"></b><span style="flex:1"></span><button class="lrn-btn" id="ndw-test">▶ Ausprobieren</button><button class="lrn-btn" id="ndw-prove">✔ Beweis prüfen</button><button class="lrn-btn" id="ndw-share">📋 Code kopieren</button></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px" id="ndw-tools"></div>
  <details class="lrn-card" style="margin-bottom:8px"><summary style="cursor:pointer;font-weight:700">🎨 Aussehen &amp; Musik</summary><div id="ndw-look" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px"></div></details>
  <div style="overflow-x:auto;border-radius:10px;border:1px solid var(--divider)"><canvas id="ndw-cv" width="${lv.c*NDW_TILE}" height="${14*NDW_TILE}" style="display:block;cursor:crosshair"></canvas></div>
  <div id="ndw-status" style="font-size:13px;margin-top:8px;min-height:20px"></div>
  <div style="font-size:11px;color:var(--text-3);margin-top:6px">Klicke ins Feld, um den gewählten Baustein zu setzen. Block-Turm: klicke so hoch, wie der Turm werden soll. Die ersten und letzten 10 Kacheln bleiben frei. Höchstens 3 Münzen und 3 Checkpoints.</div>`;
  document.getElementById('ndw-title').textContent=name;
  document.getElementById('ndw-back').onclick=()=>{ndwSave(ndwData);ndwList();};
  const tb=document.getElementById('ndw-tools');
  Object.keys(NDW_TYPES).concat(['x']).forEach(t=>{const b=document.createElement('button');b.type='button';b.className='lrn-chip'+(ndwTool===t?' active':'');b.textContent=t==='x'?'🧽 Radierer':NDW_TYPES[t];b.onclick=()=>{ndwTool=t;tb.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');};tb.appendChild(b);});
  ndwLook(lv);
  const cv=document.getElementById('ndw-cv');
  cv.onclick=e=>{const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*lv.c),row=Math.floor((e.clientY-r.top)/r.height*14);
    const ch=ndwTool==='x'?ndwErase(lv,x,row):ndwPlace(lv,ndwTool,x,row);if(ch){ndwSave(ndwData);ndwDraw();ndwStatus('');}};
  document.getElementById('ndw-test').onclick=()=>{if(!lv.i.length){ndwStatus('Setze zuerst ein paar Bausteine.');return;}ndwSave(ndwData);ndwBack=()=>ndwEdit(name);ndwPlay(lv);};
  document.getElementById('ndw-prove').onclick=()=>ndwProveClick(lv);
  document.getElementById('ndw-share').onclick=()=>ndwShareClick(lv);
  ndwDraw();ndwStatus(lv.proof?'✔ Dieses Level ist bewiesen schaffbar.':'');
}
/* Aussehen und Musik einstellen (ändert den Beweis nicht: Farben und Musik beeinflussen die Spielbarkeit nicht) */
function ndwLook(lv){
  const box=document.getElementById('ndw-look');if(!box)return;
  const opt=(arr,sel)=>arr.map((x,i)=>'<option value="'+i+'"'+(i===sel?' selected':'')+'>'+x+'</option>').join('');
  box.innerHTML='<label style="font-size:12px">Farbwelt<br><select id="ndw-theme" class="lrn-input"><option value="-1">eigener Farbton</option>'+NDW_THEMES.map((t,i)=>'<option value="'+i+'"'+(t[1]===lv.h?' selected':'')+'>'+t[0]+'</option>').join('')+'</select></label>'
   +'<label style="font-size:12px">Farbton <span id="ndw-hv">'+lv.h+'</span><br><input type="range" id="ndw-hue" min="0" max="359" value="'+lv.h+'"></label>'
   +'<label style="font-size:12px"><input type="checkbox" id="ndw-mon" '+(lv.m[0]?'checked':'')+'> Musik an</label>'
   +'<label style="font-size:12px">Tonleiter<br><select id="ndw-ms" class="lrn-input">'+opt(NDW_SCALES,lv.m[1])+'</select></label>'
   +'<label style="font-size:12px">Grundton<br><select id="ndw-mr" class="lrn-input">'+opt(NDW_NOTES,lv.m[2])+'</select></label>'
   +'<label style="font-size:12px">Tempo<br><select id="ndw-mt" class="lrn-input">'+NDW_TEMPOS.map((t,i)=>'<option value="'+t+'"'+(t===lv.m[3]?' selected':'')+'>'+['langsam','normal','schnell'][i]+' ('+t+')</option>').join('')+'</select></label>'
   +'<button type="button" class="lrn-btn ghost" id="ndw-hear">🎵 Hörprobe</button>';
  const save=()=>{ndwSave(ndwData);ndwDraw();};
  document.getElementById('ndw-theme').onchange=e=>{const i=+e.target.value;if(i>=0){lv.h=NDW_THEMES[i][1];document.getElementById('ndw-hue').value=lv.h;document.getElementById('ndw-hv').textContent=lv.h;save();}};
  document.getElementById('ndw-hue').oninput=e=>{lv.h=+e.target.value;document.getElementById('ndw-hv').textContent=lv.h;document.getElementById('ndw-theme').value=String(NDW_THEMES.findIndex(t=>t[1]===lv.h));save();};
  document.getElementById('ndw-mon').onchange=e=>{lv.m[0]=e.target.checked?1:0;save();};
  document.getElementById('ndw-ms').onchange=e=>{lv.m[1]=+e.target.value;save();};
  document.getElementById('ndw-mr').onchange=e=>{lv.m[2]=+e.target.value;save();};
  document.getElementById('ndw-mt').onchange=e=>{lv.m[3]=+e.target.value;save();};
  document.getElementById('ndw-hear').onclick=()=>{if(!lv.m[0]){ndwStatus('Die Musik ist ausgeschaltet.');return;}ndRegisterSounds();ndMusicStart(3,{on:1,s:lv.m[1],r:lv.m[2],t:lv.m[3]});setTimeout(()=>{if(ndView==='werk')ndMusicStop();},5000);};
}
function ndwStatus(t){const s=document.getElementById('ndw-status');if(s)s.textContent=t;}
function ndwProveClick(lv){
  if(!lv.i.length){ndwStatus('Setze zuerst ein paar Bausteine.');return;}
  ndwStatus('Der Löser probiert alle Möglichkeiten … das kann einige Sekunden dauern.');
  setTimeout(()=>{const r=ndwProve(lv);
    if(r.ok){lv.proof=ndwProofOf(lv);ndwSave(ndwData);ndwStatus('✔ Schaffbar! '+(r.allCoins?'Sogar mit allen '+r.coins+' Münzen in einem Lauf.':r.coins?'Aber nicht alle Münzen lassen sich in einem Lauf holen.':'')+' Du kannst den Code jetzt teilen.');}
    else{lv.proof='';ndwSave(ndwData);ndwStatus('✗ Nicht schaffbar: Der Löser kommt nur bis Kachel '+r.maxX+' von '+r.total+'. Mach die Stelle dort leichter (weniger Stacheln hintereinander, kleinere Lücken).');}},60);
}
function ndwShareClick(lv){
  if(!lv.proof||lv.proof!==ndwProofOf(lv)){ndwStatus('Prüfe das Level zuerst mit „Beweis prüfen“ – nur schaffbare Level bekommen einen Code.');return;}
  const code=ndwEncode(lv);let ok=false;try{navigator.clipboard.writeText(code).then(()=>ndwStatus('✔ Code kopiert (' +code.length+' Zeichen). Schick ihn Freunden – sie fügen ihn in der Werkstatt unter „Code einfügen“ ein.'),()=>ndwStatus('Kopieren nicht möglich. Dein Code: '+code));ok=true;}catch(e){}
  if(!ok)ndwStatus('Dein Code: '+code);
}
function ndwPlay(lv){ndView='game';ndStartCustom(ndwBuild(lv));}
function ndwDraw(){
  const cv=document.getElementById('ndw-cv');if(!cv||!ndwCur)return;const lv=ndwData.levels[ndwCur],g=cv.getContext('2d'),T=NDW_TILE;
  const bgc='hsl('+lv.h+',55%,10%)',gc='hsl('+lv.h+',45%,18%)';
  g.fillStyle=bgc;g.fillRect(0,0,cv.width,cv.height);
  g.fillStyle=gc;g.fillRect(0,12*T,cv.width,2*T);
  g.fillStyle='rgba(255,255,255,.04)';for(let x=0;x<=lv.c;x++){if(x%10===0){g.fillRect(x*T,0,1,cv.height);}}
  g.fillStyle='rgba(255,64,64,.10)';g.fillRect(0,0,NDW_MIN_X*T,cv.height);g.fillRect((lv.c-NDW_MIN_X)*T,0,NDW_MIN_X*T,cv.height);
  g.fillStyle='#fff';g.font='10px sans-serif';for(let x=0;x<lv.c;x+=10)g.fillText(x,x*T+2,10);
  lv.i.forEach(([t,x,r])=>{const px=x*T;
    if(t==='g'){g.fillStyle=bgc;g.fillRect(px,12*T,T,2*T);}
    else if(t==='s'){g.fillStyle='#ff4081';g.beginPath();g.moveTo(px,12*T);g.lineTo(px+T/2,11*T);g.lineTo(px+T,12*T);g.fill();}
    else if(t==='b'){g.fillStyle='#00e5ff';g.fillRect(px,(12-r)*T,T-1,r*T-1);}
    else if(t==='p'){g.fillStyle='#ffea00';g.fillRect(px,12*T-6,T,6);}
    else if(t==='o'){g.strokeStyle='#e040fb';g.lineWidth=3;g.beginPath();g.arc(px+T/2,r*T+T/2,T/2-3,0,7);g.stroke();}
    else if(t==='c'){g.fillStyle='#ffd54f';g.beginPath();g.arc(px+T/2,r*T+T/2,T/2-3,0,7);g.fill();}
    else if(t==='f'){g.fillStyle='#76ff03';g.fillRect(px,r*T,T-1,T-1);}
    else if(t==='k'){g.fillStyle='#ffffff';g.beginPath();g.moveTo(px+T/2,8*T);g.lineTo(px+T,9*T);g.lineTo(px+T/2,10*T);g.lineTo(px,9*T);g.fill();}
  });
  g.fillStyle='#76ff03';g.fillRect((lv.c-4)*T,0,3,12*T);g.fillText('Ziel',(lv.c-4)*T+5,24);
}
