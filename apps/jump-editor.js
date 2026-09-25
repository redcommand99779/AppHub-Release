/* ══════════════════════════════════
   SUPER JUMPER – LEVEL-EDITOR
   Eigene Level malen (Maus oder Finger), sofort testen, in 5 Plätzen speichern und als Code teilen.
   Der Editor benutzt die Engine aus jump-run.js (Zeichnen, Level-Bau, Test-Modus).
   Kacheln im Raster (Buchstaben):  . leer · # Boden · B Ziegel · ? Münzblock · a/b/c Power-Block (Schild/Feder/Magnet)
   T Röhre · W/V goldene Röhre (Geheimkammer 1/2) · s Stacheln · o Münze · e Gegner · K Checkpoint · F Ziel · P Start
══════════════════════════════════ */
const JR_ED_CHARS='.#B?abcTWVsoeKFP';
const JR_ED_TOOLS=[
  ['.','⬜','Radierer'],['#','🟫','Boden'],['B','🧱','Ziegel'],['?','❓','Münzblock'],
  ['a','🛡️','Power: Schild'],['b','🪶','Power: Doppelsprung'],['c','🧲','Power: Magnet'],
  ['T','🟩','Röhre'],['W','🟨','Goldene Röhre 1'],['V','🟧','Goldene Röhre 2'],
  ['s','🔺','Stacheln'],['o','🪙','Münze'],['e','👾','Gegner'],['K','🚩','Checkpoint'],['F','🏁','Ziel'],['P','🏃','Start']
];
const JR_ED_MINW=24,JR_ED_MAXW=300;
const jrEd={open:false,rows:null,w:60,theme:0,name:'Mein Level',time:300,tool:'#',cam:0,undo:[],paint:false,slot:1,hover:null,msg:''};

/* ── Raster ── */
function jrEdNewRows(w){
  const rows=Array.from({length:JR_ROWS},()=>Array(w).fill('.'));
  for(let x=0;x<w;x++){rows[10][x]='#';rows[11][x]='#';}
  rows[9][2]='P';rows[9][w-4]='F';
  return rows;
}
function jrEdResize(w){
  w=Math.max(JR_ED_MINW,Math.min(JR_ED_MAXW,w));
  const old=jrEd.rows;
  jrEd.rows=old.map((r,y)=>{const n=r.slice(0,w);while(n.length<w)n.push(y>=10?'#':'.');return n;});
  jrEd.w=w;
}
/* Raster -> spielbares Level (oder Fehlertext) */
function jrLevelFromRows(rows,meta){
  meta=meta||{};
  const h=rows.length,w=rows[0].length;
  if(h!==JR_ROWS)return {error:'Das Level muss genau '+JR_ROWS+' Zeilen haben.'};
  const g=Array.from({length:JR_ROWS},()=>Array(w).fill('.')),powers={},warps={},enemies=[],kCols=[];
  let start=null,flagCol=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const c=rows[y][x];
    if(c==='.')continue;
    if(c==='#'||c==='B'||c==='?'||c==='T'||c==='s'||c==='o')g[y][x]=c;
    else if(c==='a'||c==='b'||c==='c'){g[y][x]='!';powers[x+','+y]={a:'shield',b:'feather',c:'magnet'}[c];}
    else if(c==='W'||c==='V'){g[y][x]='W';warps[x]=c==='W'?0:1;}
    else if(c==='e')enemies.push([x,y]);
    else if(c==='K')kCols.push(x);
    else if(c==='F'){if(flagCol<0)flagCol=x;}
    else if(c==='P'){if(!start)start=[x,y];}
  }
  if(!start)return {error:'Es fehlt der Startpunkt (🏃).'};
  if(flagCol<0)return {error:'Es fehlt das Ziel (🏁).'};
  for(let r=2;r<=9;r++)g[r][flagCol]='F';
  kCols.forEach(x=>{g[8][x]='K';g[9][x]='K';});
  const lv={w,g,enemies:enemies.map(([x,y])=>({x:x*JR_T+3,y:(y+1)*JR_T-24,w:26,h:24,vx:-0.8,dir:-1,alive:true,squash:0})),
    powers,warps,start:[start[0],Math.max(0,start[1]-1)],theme:meta.theme||0,time:meta.time||300,name:meta.name||'Eigenes Level',custom:true};
  return {level:lv};
}

/* ── Level-Code (zum Teilen) ── */
function jrEdRle(row){let out='',i=0;while(i<row.length){let j=i;while(j<row.length&&row[j]===row[i])j++;out+=(j-i)+row[i];i=j;}return out;}
function jrEdUnrle(str){
  const out=[];const re=/(\d+)(.)/g;let m,total=0;
  while((m=re.exec(str))){const n=parseInt(m[1],10);if(n>JR_ED_MAXW||total+n>JR_ED_MAXW)throw new Error('Level zu breit');for(let i=0;i<n;i++)out.push(m[2]);total+=n;}
  return out;
}
function jrEdEncode(ed){
  const payload={n:ed.name,t:ed.theme,tm:ed.time,r:ed.rows.map(jrEdRle)};
  const json=JSON.stringify(payload);
  let b64;
  try{b64=btoa(unescape(encodeURIComponent(json)));}catch(e){b64=Buffer.from(json,'utf8').toString('base64');}
  return 'JR1:'+b64;
}
function jrEdDecode(code){
  code=String(code||'').trim();
  if(!code.startsWith('JR1:'))throw new Error('Das ist kein Super-Jumper-Level-Code.');
  let json;
  try{json=decodeURIComponent(escape(atob(code.slice(4))));}catch(e){try{json=Buffer.from(code.slice(4),'base64').toString('utf8');}catch(e2){throw new Error('Der Code ist beschädigt.');}}
  let p;try{p=JSON.parse(json);}catch(e){throw new Error('Der Code ist beschädigt.');}
  if(!p||!Array.isArray(p.r)||p.r.length!==JR_ROWS)throw new Error('Der Code hat ein falsches Format.');
  const rows=p.r.map(jrEdUnrle);
  const w=rows[0].length;
  if(w<JR_ED_MINW||w>JR_ED_MAXW||rows.some(r=>r.length!==w))throw new Error('Der Code hat falsche Maße.');
  if(rows.some(r=>r.some(c=>!JR_ED_CHARS.includes(c))))throw new Error('Der Code enthält unbekannte Kacheln.');
  return {rows,w,theme:Math.max(0,Math.min(5,p.t|0)),time:Math.max(30,Math.min(999,p.tm|0||300)),name:String(p.n||'Eigenes Level').slice(0,30)};
}

/* ── Speicherplätze ── */
function jrEdSlots(){try{const a=JSON.parse(localStorage.getItem('zf_jump_custom')||'[]');return Array.isArray(a)?a:[];}catch(e){return[];}}
function jrEdSaveSlot(n){
  const a=jrEdSlots();while(a.length<5)a.push(null);
  a[n-1]={name:jrEd.name,code:jrEdEncode(jrEd)};
  try{localStorage.setItem('zf_jump_custom',JSON.stringify(a));}catch(e){}
}
function jrEdLoadSlot(n){
  const s=jrEdSlots()[n-1];if(!s)throw new Error('Platz '+n+' ist leer.');
  jrEdApply(jrEdDecode(s.code));
}
function jrEdApply(d){jrEd.rows=d.rows;jrEd.w=d.w;jrEd.theme=d.theme;jrEd.time=d.time;jrEd.name=d.name;jrEd.cam=0;jrEd.undo=[];}

/* ── Rückgängig ── */
function jrEdSnap(){jrEd.undo.push(JSON.stringify(jrEd.rows));if(jrEd.undo.length>40)jrEd.undo.shift();}
function jrEdUndo(){const s=jrEd.undo.pop();if(s){jrEd.rows=JSON.parse(s);jrEd.w=jrEd.rows[0].length;}}
/* Malen: P und F gibt es nur einmal */
function jrEdPaint(cx,cy,tool){
  if(cx<0||cy<0||cx>=jrEd.w||cy>=JR_ROWS)return;
  if(tool==='P'||tool==='F')jrEd.rows.forEach(r=>{const i=r.indexOf(tool);if(i>=0)r[i]='.';});
  jrEd.rows[cy][cx]=tool;
}

/* ── Öffnen / Schließen / Test ── */
function jrEdOpen(){
  if(!jrEd.rows)jrEd.rows=jrEdNewRows(jrEd.w);
  jrEd.open=true;jrEd.msg='';
  if(jrState){jrState.mode='menu';jrState.paused=false;}
  const cv=document.getElementById('jr-canvas');
  if(cv){
    cv.onclick=null;
    cv.oncontextmenu=e=>{e.preventDefault();return false;};
    cv.onpointerdown=jrEdDown;cv.onpointermove=jrEdMove;cv.onpointerup=cv.onpointerleave=jrEdUp;
    cv.onwheel=e=>{if(!jrEd.open)return;e.preventDefault();jrEd.cam=jrEdClamp(jrEd.cam+e.deltaY+e.deltaX);};
  }
  jrEdBuildUi();
  const bar=document.getElementById('jr-editor-bar');if(bar)bar.style.display='block';
  const main=document.getElementById('jr-main-controls');if(main)main.style.display='none';
  const tc=document.getElementById('jr-touch');if(tc)tc.style.setProperty('display','none','important');
}
function jrEdClose(){
  jrEd.open=false;
  const cv=document.getElementById('jr-canvas');
  if(cv){cv.onpointerdown=cv.onpointermove=cv.onpointerup=cv.onpointerleave=cv.onwheel=cv.oncontextmenu=null;cv.onclick=jrClick;}
  const bar=document.getElementById('jr-editor-bar');if(bar)bar.style.display='none';
  const main=document.getElementById('jr-main-controls');if(main)main.style.display='';
  const tc=document.getElementById('jr-touch');if(tc)tc.style.removeProperty('display');
}
function jrEdExit(){jrEdClose();if(typeof jrToMenu==='function')jrToMenu();}
function jrEdTest(){
  const r=jrLevelFromRows(jrEd.rows,{theme:jrEd.theme,time:jrEd.time,name:jrEd.name});
  if(r.error){jrEd.msg='⚠️ '+r.error;jrEdUi();return;}
  jrEd.open=false;
  const bar=document.getElementById('jr-editor-bar');if(bar)bar.style.display='none';
  const cv=document.getElementById('jr-canvas');
  if(cv){cv.onpointerdown=cv.onpointermove=cv.onpointerup=cv.onpointerleave=cv.onwheel=cv.oncontextmenu=null;cv.onclick=jrClick;}
  const main=document.getElementById('jr-main-controls');if(main)main.style.display='';
  const tc=document.getElementById('jr-touch');if(tc)tc.style.removeProperty('display');
  jrStartCustom(r.level);
}
/* Nach dem Test (Ziel erreicht oder Game Over) zurück in den Editor */
function jrEdReturn(cleared){
  jrEdOpen();
  jrEd.msg=cleared?'🎉 Geschafft! Dein Level ist spielbar.':'Zurück im Editor.';
  jrEdUi();
}

/* ── Zeigereingaben ── */
function jrEdClamp(c){return Math.max(0,Math.min(jrEd.w*JR_T-JR_W,c));}
function jrEdCell(e){
  const cv=document.getElementById('jr-canvas'),r=cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*JR_W/r.width,y=(e.clientY-r.top)*JR_H/r.height;
  return {cx:Math.floor((x+jrEd.cam)/JR_T),cy:Math.floor(y/JR_T),x,y};
}
function jrEdDown(e){
  if(!jrEd.open)return;
  e.preventDefault();
  try{e.target.setPointerCapture(e.pointerId);}catch(_){}
  const c=jrEdCell(e);
  jrEdSnap();jrEd.paint=true;jrEd.erase=(e.button===2);
  jrEdPaint(c.cx,c.cy,jrEd.erase?'.':jrEd.tool);
}
function jrEdMove(e){
  if(!jrEd.open)return;
  const c=jrEdCell(e);jrEd.hover=[c.cx,c.cy];
  // am Rand des Feldes scrollen
  if(jrEd.paint){
    if(c.x>JR_W-40)jrEd.cam=jrEdClamp(jrEd.cam+8);else if(c.x<40)jrEd.cam=jrEdClamp(jrEd.cam-8);
    jrEdPaint(c.cx,c.cy,jrEd.erase?'.':jrEd.tool);
  }
}
function jrEdUp(){jrEd.paint=false;}
function jrEdKey(e){
  if(!jrEd.open)return false;
  const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A'){jrEd.cam=jrEdClamp(jrEd.cam-64);e.preventDefault();return true;}
  if(k==='ArrowRight'||k==='d'||k==='D'){jrEd.cam=jrEdClamp(jrEd.cam+64);e.preventDefault();return true;}
  if((e.ctrlKey||e.metaKey)&&(k==='z'||k==='Z')){jrEdUndo();e.preventDefault();return true;}
  if(k==='Escape'){jrEdExit();e.preventDefault();return true;}
  return false;
}

/* ── Zeichnen ── */
function jrEdDraw(ctx){
  const T=JR_T,cam=jrEd.cam,t=jrFrame;
  const g=jrEd.rows.map(r=>r.map(c=>({a:'!',b:'!',c:'!',V:'W',e:'.',P:'.'}[c]||c)));
  const pst={level:{w:jrEd.w,g,theme:jrEd.theme,warps:{}},cam,bumps:{},checkpoint:null};
  jrFrame++;
  jrBackground(ctx,pst);
  const c0=Math.max(0,Math.floor(cam/T)),c1=Math.min(jrEd.w-1,Math.floor((cam+JR_W)/T)+1);
  // Raster
  ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=1;
  for(let x=c0;x<=c1+1;x++){ctx.beginPath();ctx.moveTo(Math.round(x*T-cam)+0.5,0);ctx.lineTo(Math.round(x*T-cam)+0.5,JR_H);ctx.stroke();}
  for(let y=0;y<=JR_ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*T+0.5);ctx.lineTo(JR_W,y*T+0.5);ctx.stroke();}
  for(let ty=0;ty<JR_ROWS;ty++)for(let tx=c0;tx<=c1;tx++){
    const raw=jrEd.rows[ty][tx],ch=g[ty][tx],x=Math.round(tx*T-cam),y=ty*T;
    if(raw==='e')jrDrawEnemy(ctx,{x:tx*T+3,y:(ty+1)*T-24,w:26,h:24,alive:true,dir:-1,squash:0},{cam},t);
    else if(raw==='P'){
      ctx.save();jrDrawPlayer(ctx,{p:{x:tx*T+5,y:(ty+1)*T-34,w:22,h:34,face:1,onGround:true,vx:0,anim:0,duck:false,slam:false,inv:0,shield:false,magnet:0},mode:'play',cam},t,JR_SKIN_DEFAULT);ctx.restore();
      ctx.fillStyle='rgba(255,255,255,0.9)';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('START',x+T/2,y+8);
    }
    else if(ch!=='.')jrDrawTile(ctx,pst,ch,tx,ty,x,y,t);
    if(raw==='a'||raw==='b'||raw==='c'){ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillText({a:'🛡️',b:'🪶',c:'🧲'}[raw],x+T/2,y+T-8);}
    if(raw==='V'){ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('2',x+T/2,y+T/2+4);}
    if(raw==='W'){ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('1',x+T/2,y+T/2+4);}
  }
  // Auswahl unter der Maus
  if(jrEd.hover){
    const [hx,hy]=jrEd.hover;
    if(hx>=0&&hx<jrEd.w&&hy>=0&&hy<JR_ROWS){ctx.strokeStyle='#ffeb3b';ctx.lineWidth=2;ctx.strokeRect(Math.round(hx*T-cam)+1,hy*T+1,T-2,T-2);}
  }
  // Statuszeile
  ctx.fillStyle='rgba(20,24,36,0.72)';jrRR(ctx,8,JR_H-30,JR_W-16,22,11);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textAlign='left';
  ctx.fillText('Editor · Breite '+jrEd.w+' · Werkzeug: '+((JR_ED_TOOLS.find(x=>x[0]===jrEd.tool)||[])[2]||'')+' · rechte Maustaste = radieren · ←/→ scrollen',16,JR_H-15);
}

/* ── Bedienleiste (wird beim Öffnen gebaut) ── */
function jrEdBuildUi(){
  const bar=document.getElementById('jr-editor-bar');if(!bar)return;
  const btn=(id,label,fn,extra)=>`<button class="set-btn jr-ed-btn" id="${id}" onclick="${fn}" ${extra||''}>${label}</button>`;
  bar.innerHTML=`
    <div class="jr-ed-tools">${JR_ED_TOOLS.map(([c,ic,name])=>`<button class="jr-ed-tool${jrEd.tool===c?' active':''}" data-tool="${c}" title="${name}" onclick="jrEdTool('${c.replace(/'/g,"\\'")}')">${ic}</button>`).join('')}</div>
    <div class="jr-ed-row">
      <input id="jr-ed-name" class="jr-ed-input" maxlength="30" value="${jrEd.name.replace(/"/g,'&quot;')}" oninput="jrEd.name=this.value" placeholder="Name des Levels"/>
      <select id="jr-ed-theme" class="jr-ed-input" onchange="jrEd.theme=+this.value">${['🌞 Wiese','🌇 Abend','🌙 Nacht','💎 Höhle','❄️ Schnee','🌋 Vulkan'].map((n,i)=>`<option value="${i}" ${jrEd.theme===i?'selected':''}>${n}</option>`).join('')}</select>
      ${btn('jr-ed-wm','− Breite','jrEdResize(jrEd.w-10)')}${btn('jr-ed-wp','+ Breite','jrEdResize(jrEd.w+10)')}
    </div>
    <div class="jr-ed-row">
      ${btn('jr-ed-test','▶ Testen','jrEdTest()')}${btn('jr-ed-undo','↩ Rückgängig','jrEdUndo()')}${btn('jr-ed-new','🗑 Neu','jrEdNew()')}
      <select id="jr-ed-slot" class="jr-ed-input" onchange="jrEd.slot=+this.value">${[1,2,3,4,5].map(n=>{const s=jrEdSlots()[n-1];return`<option value="${n}" ${jrEd.slot===n?'selected':''}>Platz ${n}${s?' · '+String(s.name).replace(/</g,'&lt;'):' · leer'}</option>`;}).join('')}</select>
      ${btn('jr-ed-save','💾 Speichern','jrEdDoSave()')}${btn('jr-ed-load','📂 Laden','jrEdDoLoad()')}
    </div>
    <div class="jr-ed-row">
      ${btn('jr-ed-copy','📋 Code kopieren','jrEdDoCopy()')}${btn('jr-ed-paste','📥 Code einfügen','jrEdDoPaste()')}${btn('jr-ed-exit','⬅ Beenden','jrEdExit()')}
    </div>
    <div id="jr-ed-msg" class="jr-ed-msg">${jrEd.msg||''}</div>`;
}
function jrEdUi(){const m=document.getElementById('jr-ed-msg');if(m)m.textContent=jrEd.msg||'';}
function jrEdTool(c){
  jrEd.tool=c;
  document.querySelectorAll('#jr-editor-bar .jr-ed-tool').forEach(b=>b.classList.toggle('active',b.getAttribute('data-tool')===c));
}
function jrEdNew(){
  const go=()=>{jrEd.rows=jrEdNewRows(jrEd.w);jrEd.undo=[];jrEd.cam=0;jrEd.msg='Neues Level angelegt.';jrEdUi();};
  if(typeof appConfirm==='function')appConfirm('Das aktuelle Level verwerfen und neu beginnen?',go);else go();
}
function jrEdDoSave(){jrEdSaveSlot(jrEd.slot);jrEd.msg='💾 In Platz '+jrEd.slot+' gespeichert.';jrEdBuildUi();}
function jrEdDoLoad(){
  try{jrEdLoadSlot(jrEd.slot);jrEd.msg='📂 Platz '+jrEd.slot+' geladen.';jrEdBuildUi();}
  catch(e){jrEd.msg='⚠️ '+e.message;jrEdUi();}
}
function jrEdDoCopy(){
  const code=jrEdEncode(jrEd);
  const done=()=>{jrEd.msg='📋 Code kopiert – schick ihn einem Freund!';jrEdUi();};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code).then(done,()=>{window.prompt('Level-Code (zum Kopieren markieren):',code);});
  else window.prompt('Level-Code (zum Kopieren markieren):',code);
}
function jrEdDoPaste(){
  const code=window.prompt('Level-Code einfügen:');
  if(!code)return;
  try{jrEdApply(jrEdDecode(code));jrEd.msg='📥 Level geladen.';jrEdBuildUi();}
  catch(e){jrEd.msg='⚠️ '+e.message;jrEdUi();}
}
