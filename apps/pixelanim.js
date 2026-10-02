/* ══════════════════════════════════
   PIXEL-ANIMATOR – Bilder Pixel für Pixel zeichnen und zu einer Animation zusammensetzen, als GIF speichern.
   Raster 16×16, 32×32 oder 48×48, 16 Farben (die erste ist durchsichtig), bis zu 24 Bilder je Animation, Zwiebelhaut (das Bild davor scheint durch),
   Stift, Radierer, Füllen, Pipette, Rückgängig, Abspielen mit 1–24 Bildern/s. Je Konto bis zu 8 Animationen (zf_pixelanim).
   Der GIF-Export ist selbst gebaut (LZW-Kompression, durchsichtiger Hintergrund, Endlosschleife) – kein Download von Bibliotheken nötig.
══════════════════════════════════ */
const PA_KEY='zf_pixelanim',PA_MAX_PROJ=8,PA_MAX_FRAMES=24,PA_SIZES=[16,32,48];
const PA_PALETTE=['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'];   // Farbe 0 ist durchsichtig (wird als Karomuster gezeigt)
/* ── Reine Logik (wird getestet) ── */
const paNew=(w,h)=>new Uint8Array(w*h);
const paToHex=a=>{let s='';for(let i=0;i<a.length;i++)s+=a[i].toString(16);return s;};
function paFromHex(s,n){const a=new Uint8Array(n);if(typeof s!=='string')return a;for(let i=0;i<n&&i<s.length;i++){const v=parseInt(s[i],16);a[i]=v>=0&&v<16?v:0;}return a;}
/* Füllen (4 Nachbarn); gibt die Zahl der geänderten Pixel zurück */
function paFill(a,w,h,x,y,c){
  if(x<0||y<0||x>=w||y>=h)return 0;const t=a[y*w+x];if(t===c)return 0;
  const st=[x+y*w];let n=0;
  while(st.length){const p=st.pop();if(a[p]!==t)continue;a[p]=c;n++;const px=p%w,py=(p-px)/w;
    if(px>0)st.push(p-1);if(px<w-1)st.push(p+1);if(py>0)st.push(p-w);if(py<h-1)st.push(p+w);}
  return n;
}
/* Linie zwischen zwei Rasterpunkten (Bresenham), beide Enden gehören dazu */
function paLine(x0,y0,x1,y1){
  const pts=[];let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy;
  for(;;){pts.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}
  return pts;
}
/* GIF-Kompression (LZW) mit variabler Codebreite; Rückgabe: Bytes ohne Blockaufteilung */
function paLzw(idx,minCode){
  const clear=1<<minCode,eoi=clear+1,out=[];let size=minCode+1,next=eoi+1,cur=0,bits=0,dict=new Map();
  const emit=c=>{cur|=c<<bits;bits+=size;while(bits>=8){out.push(cur&255);cur>>>=8;bits-=8;}};
  emit(clear);let prefix=idx[0];
  for(let i=1;i<idx.length;i++){
    const k=idx[i],key=prefix*256+k,hit=dict.get(key);
    if(hit!==undefined){prefix=hit;continue;}
    emit(prefix);dict.set(key,next);if(next===(1<<size)&&size<12)size++;next++;
    if(next>4095){emit(clear);dict=new Map();size=minCode+1;next=eoi+1;}
    prefix=k;
  }
  emit(prefix);emit(eoi);if(bits>0)out.push(cur&255);return out;
}
const paHexRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
/* Ganze Animation als GIF: frames = Liste von Uint8Array (w·h), scale = Vergrößerung (ganze Pixel), fps = Bilder pro Sekunde */
function paGif(frames,w,h,scale,fps){
  const W=w*scale,H=h*scale,out=[],u16=n=>[n&255,(n>>8)&255];
  out.push(...'GIF89a'.split('').map(c=>c.charCodeAt(0)),...u16(W),...u16(H),0xF3,0,0);
  PA_PALETTE.forEach(c=>out.push(...paHexRgb(c)));
  out.push(0x21,0xFF,0x0B,...'NETSCAPE2.0'.split('').map(c=>c.charCodeAt(0)),3,1,0,0,0);
  const delay=Math.max(2,Math.round(100/Math.max(1,fps)));
  frames.forEach(f=>{
    out.push(0x21,0xF9,4,0x09,...u16(delay),0,0);
    out.push(0x2C,0,0,0,0,...u16(W),...u16(H),0);
    const px=new Uint8Array(W*H);
    for(let y=0;y<H;y++){const sy=Math.floor(y/scale);for(let x=0;x<W;x++)px[y*W+x]=f[sy*w+Math.floor(x/scale)];}
    out.push(4);const data=paLzw(px,4);
    for(let i=0;i<data.length;i+=255){const ch=data.slice(i,i+255);out.push(ch.length,...ch);}
    out.push(0);
  });
  out.push(0x3B);return Uint8Array.from(out);
}
function paAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n.toLowerCase();}}catch(e){}return '_gast';}
function paAll(){try{const o=JSON.parse(localStorage.getItem(PA_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
/* Konto laden: nur gültige Animationen (Name, Größe 16/32/48, 1–24 Bilder, fps 1–24); Bilder als Hex-Text */
function paLoad(){
  const a=paAll()[paAccount()]||{},out={projects:{},last:''},P=a.projects&&typeof a.projects==='object'&&!Array.isArray(a.projects)?a.projects:{};let n=0;
  Object.keys(P).forEach(k=>{
    if(n>=PA_MAX_PROJ||!Object.prototype.hasOwnProperty.call(P,k))return;const p=P[k],name=String(k).trim().slice(0,30);
    if(!name||!p||typeof p!=='object'||!PA_SIZES.includes(p.w)||!Array.isArray(p.frames)||!p.frames.length)return;
    const fps=Math.min(24,Math.max(1,p.fps|0||8));
    out.projects[name]={w:p.w,fps,frames:p.frames.slice(0,PA_MAX_FRAMES).map(f=>paToHex(paFromHex(f,p.w*p.w)))};n++;
  });
  out.last=typeof a.last==='string'&&a.last in out.projects?a.last:'';return out;
}
function paSave(d){const all=paAll();all[paAccount()]=d;try{localStorage.setItem(PA_KEY,JSON.stringify(all));}catch(e){return false;}return true;}
function paCreate(d,name,size){
  name=String(name||'').trim();if(!name||name.length>30||name in d.projects||!PA_SIZES.includes(size))return 'name';
  if(Object.keys(d.projects).length>=PA_MAX_PROJ)return 'voll';
  d.projects[name]={w:size,fps:8,frames:[paToHex(paNew(size,size))]};d.last=name;return 'ok';
}
/* Bilder verwalten: hinzufügen (leer oder Kopie), löschen (mindestens eins bleibt), verschieben */
function paFrameAdd(p,at,copy){if(p.frames.length>=PA_MAX_FRAMES)return false;p.frames.splice(at+1,0,copy?p.frames[at]:paToHex(paNew(p.w,p.w)));return true;}
function paFrameDel(p,at){if(p.frames.length<=1||at<0||at>=p.frames.length)return false;p.frames.splice(at,1);return true;}
function paFrameMove(p,at,dir){const to=at+dir;if(at<0||at>=p.frames.length||to<0||to>=p.frames.length)return false;const f=p.frames.splice(at,1)[0];p.frames.splice(to,0,f);return true;}
/* ── Oberfläche ── */
let paData=null,paCur='',paIdx=0,paColor=8,paTool='pen',paOnion=true,paPlaying=null,paDown=false,paLast=null,paUndo=[],paMsg='';
const paEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const paProj=()=>paData.projects[paCur];
const paFrameArr=i=>paFromHex(paProj().frames[i],paProj().w*paProj().w);
function paInit(){const root=document.getElementById('pa-root');if(!root)return;paStop();paData=paLoad();paCur='';paMsg='';paRenderList();}
function paRenderList(){
  const root=document.getElementById('pa-root');paCur='';const names=Object.keys(paData.projects);
  root.innerHTML=`<p class="pa-muted">Zeichne Bilder Pixel für Pixel und lass sie als Animation laufen. Als GIF speichern kannst du sie überall teilen.</p>
  <div class="pa-card"><b>Neue Animation</b><div class="pa-row"><input id="pa-name" class="pa-input" maxlength="30" placeholder="Name">
  <select id="pa-size" class="pa-input">${PA_SIZES.map(s=>`<option value="${s}"${s===32?' selected':''}>${s} × ${s} Pixel</option>`).join('')}</select><button class="pa-btn primary" id="pa-new" type="button">Erstellen</button></div><div class="pa-muted" id="pa-msg">${paEsc(paMsg)}</div></div>
  <h3>Deine Animationen (${names.length}/${PA_MAX_PROJ})</h3><div id="pa-projects">${names.length?'':'<div class="pa-muted">Noch keine – leg oben eine an.</div>'}</div>`;
  const box=document.getElementById('pa-projects');
  names.forEach(n=>{const p=paData.projects[n],row=document.createElement('div');row.className='pa-proj';row.innerHTML='<button type="button" class="pa-open"></button><span class="pa-muted">'+p.frames.length+' Bilder · '+p.w+'×'+p.w+'</span><button type="button" class="pa-btn ghost" title="Löschen">✕</button>';
    row.querySelector('.pa-open').textContent='🎞️ '+n;row.querySelector('.pa-open').onclick=()=>paOpen(n);
    row.querySelector('.ghost').onclick=()=>{if(confirm('Animation „'+n+'“ löschen?')){delete paData.projects[n];if(paData.last===n)paData.last='';paSave(paData);paRenderList();}};box.appendChild(row);});
  document.getElementById('pa-new').onclick=()=>{const r=paCreate(paData,document.getElementById('pa-name').value,parseInt(document.getElementById('pa-size').value,10));
    if(r==='ok'){paSave(paData);paMsg='';paOpen(paData.last);}else{paMsg=r==='voll'?'Du hast schon '+PA_MAX_PROJ+' Animationen – lösche erst eine.':'Gib einen neuen Namen ein (höchstens 30 Zeichen, noch nicht vergeben).';document.getElementById('pa-msg').textContent=paMsg;}};
}
function paOpen(name){
  paStop();paCur=name;paIdx=0;paUndo=[];paData.last=name;paSave(paData);const p=paProj();
  const root=document.getElementById('pa-root');
  root.innerHTML=`<div class="pa-bar"><button class="pa-btn" id="pa-back" type="button">← Animationen</button><b id="pa-title"></b><span class="pa-spacer"></span>
    <label class="pa-muted">Tempo <input type="range" id="pa-fps" min="1" max="24" value="${p.fps}"> <span id="pa-fpsv">${p.fps}</span>/s</label>
    <button class="pa-btn" id="pa-play" type="button">▶ Abspielen</button>
    <select id="pa-scale" class="pa-input pa-narrow" title="Größe des GIFs"><option value="4">GIF ×4</option><option value="8" selected>GIF ×8</option><option value="12">GIF ×12</option></select><button class="pa-btn primary" id="pa-gif" type="button">⬇ Als GIF speichern</button></div>
  <div class="pa-main"><div class="pa-tools"><div id="pa-toolbtns"></div><div class="pa-pal" id="pa-pal"></div>
    <button class="pa-btn" id="pa-undo" type="button">↶ Rückgängig</button><label class="pa-muted"><input type="checkbox" id="pa-onion" ${paOnion?'checked':''}> Zwiebelhaut</label>
    <button class="pa-btn" id="pa-clear" type="button">🗑 Bild leeren</button></div>
    <div class="pa-stage"><canvas id="pa-cv" width="${p.w}" height="${p.w}"></canvas><div class="pa-muted" id="pa-info"></div></div>
    <div class="pa-prevbox"><div class="pa-muted">Vorschau</div><canvas id="pa-prev" width="${p.w}" height="${p.w}"></canvas></div></div>
  <div class="pa-frames" id="pa-frames"></div>
  <div class="pa-row"><button class="pa-btn" id="pa-fnew" type="button">＋ Neues Bild</button><button class="pa-btn" id="pa-fcopy" type="button">⧉ Kopieren</button><button class="pa-btn" id="pa-fleft" type="button">◀ Nach links</button><button class="pa-btn" id="pa-fright" type="button">Nach rechts ▶</button><button class="pa-btn ghost" id="pa-fdel" type="button">✕ Bild löschen</button></div>`;
  document.getElementById('pa-title').textContent=name;
  document.getElementById('pa-back').onclick=()=>{paStop();paRenderList();};
  const fps=document.getElementById('pa-fps');fps.oninput=()=>{p.fps=parseInt(fps.value,10);document.getElementById('pa-fpsv').textContent=p.fps;paSave(paData);if(paPlaying)paPlay(true);};
  document.getElementById('pa-play').onclick=()=>paPlaying?paStop():paPlay();
  document.getElementById('pa-gif').onclick=paDownload;
  document.getElementById('pa-undo').onclick=paUndoStep;
  document.getElementById('pa-onion').onchange=e=>{paOnion=e.target.checked;paDraw();};
  document.getElementById('pa-clear').onclick=()=>{paPush();p.frames[paIdx]=paToHex(paNew(p.w,p.w));paChanged();};
  document.getElementById('pa-fnew').onclick=()=>{if(paFrameAdd(p,paIdx,false)){paIdx++;paUndo=[];paChanged();}else alert('Höchstens '+PA_MAX_FRAMES+' Bilder.');};
  document.getElementById('pa-fcopy').onclick=()=>{if(paFrameAdd(p,paIdx,true)){paIdx++;paUndo=[];paChanged();}else alert('Höchstens '+PA_MAX_FRAMES+' Bilder.');};
  document.getElementById('pa-fleft').onclick=()=>{if(paFrameMove(p,paIdx,-1)){paIdx--;paChanged();}};
  document.getElementById('pa-fright').onclick=()=>{if(paFrameMove(p,paIdx,1)){paIdx++;paChanged();}};
  document.getElementById('pa-fdel').onclick=()=>{if(p.frames.length>1&&confirm('Dieses Bild löschen?')){paFrameDel(p,paIdx);paIdx=Math.min(paIdx,p.frames.length-1);paUndo=[];paChanged();}};
  const cv=document.getElementById('pa-cv');
  const pos=e=>{const r=cv.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*p.w),Math.floor((e.clientY-r.top)/r.height*p.w)];};
  cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const [x,y]=pos(e);paStop();
    if(paTool==='pick'){if(x>=0&&y>=0&&x<p.w&&y<p.w){paColor=paFrameArr(paIdx)[y*p.w+x];paTool='pen';paRenderTools();}return;}
    paPush();paDown=true;paLast=[x,y];paApply(x,y,x,y);};
  cv.onpointermove=e=>{if(!paDown)return;const [x,y]=pos(e);paApply(paLast[0],paLast[1],x,y);paLast=[x,y];};
  cv.onpointerup=cv.onpointercancel=()=>{if(paDown){paDown=false;paSave(paData);paFramesRender();}};
  paRenderTools();paFramesRender();paDraw();
}
function paRenderTools(){
  const tb=document.getElementById('pa-toolbtns');if(!tb)return;
  tb.innerHTML=[['pen','✏️ Stift'],['erase','🧽 Radierer'],['fill','🪣 Füllen'],['pick','💧 Pipette']].map(([k,l])=>`<button type="button" class="pa-btn${paTool===k?' on':''}" data-t="${k}">${l}</button>`).join('');
  tb.querySelectorAll('button').forEach(b=>b.onclick=()=>{paTool=b.dataset.t;paRenderTools();});
  const pal=document.getElementById('pa-pal');pal.innerHTML=PA_PALETTE.map((c,i)=>`<button type="button" class="pa-sw${i===paColor?' on':''}" data-c="${i}" style="${i===0?'':'background:'+c}" title="${i===0?'durchsichtig':c}"></button>`).join('');
  pal.querySelectorAll('button').forEach(b=>b.onclick=()=>{paColor=parseInt(b.dataset.c,10);if(paTool==='erase'||paTool==='pick')paTool='pen';paRenderTools();});
}
function paPush(){paUndo.push([paIdx,paProj().frames[paIdx]]);if(paUndo.length>40)paUndo.shift();}
function paUndoStep(){const u=paUndo.pop();if(!u)return;paStop();paProj().frames[u[0]]=u[1];paIdx=u[0];paChanged();}
function paApply(x0,y0,x1,y1){
  const p=paProj(),a=paFrameArr(paIdx);
  if(paTool==='fill'){if(paFill(a,p.w,p.w,x1,y1,paColor)===0)return;}
  else{const c=paTool==='erase'?0:paColor;paLine(x0,y0,x1,y1).forEach(([x,y])=>{if(x>=0&&y>=0&&x<p.w&&y<p.w)a[y*p.w+x]=c;});}
  p.frames[paIdx]=paToHex(a);paDraw();
}
function paChanged(){paSave(paData);paFramesRender();paDraw();}
function paPaint(g,a,w,alpha){const im=g.getImageData(0,0,w,w),d=im.data;for(let i=0;i<a.length;i++){if(!a[i])continue;const c=paHexRgb(PA_PALETTE[a[i]]);d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=alpha;}g.putImageData(im,0,0);}
function paRender(cv,a,w,under){const g=cv.getContext('2d');g.clearRect(0,0,w,w);if(under){const t=document.createElement('canvas');t.width=t.height=w;const tg=t.getContext('2d');paPaint(tg,under,w,90);g.drawImage(t,0,0);}
  const t2=document.createElement('canvas');t2.width=t2.height=w;paPaint(t2.getContext('2d'),a,w,255);g.drawImage(t2,0,0);}
function paDraw(){
  const p=paProj(),cv=document.getElementById('pa-cv');if(!cv)return;
  paRender(cv,paFrameArr(paIdx),p.w,paOnion&&paIdx>0?paFrameArr(paIdx-1):null);
  document.getElementById('pa-info').textContent='Bild '+(paIdx+1)+' von '+p.frames.length+' · '+p.w+'×'+p.w+' Pixel';
  const pv=document.getElementById('pa-prev');if(pv&&!paPlaying)paRender(pv,paFrameArr(paIdx),p.w);
}
function paFramesRender(){
  const p=paProj(),box=document.getElementById('pa-frames');if(!box)return;box.innerHTML='';
  p.frames.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.className='pa-fr'+(i===paIdx?' on':'');const c=document.createElement('canvas');c.width=c.height=p.w;paRender(c,paFrameArr(i),p.w);b.appendChild(c);const s=document.createElement('span');s.textContent=i+1;b.appendChild(s);
    b.onclick=()=>{paIdx=i;paUndo=[];paFramesRender();paDraw();};box.appendChild(b);});
}
function paStop(){const was=!!paPlaying;if(paPlaying){clearInterval(paPlaying);paPlaying=null;}const b=document.getElementById('pa-play');if(b)b.textContent='▶ Abspielen';if(was&&paCur&&document.getElementById('pa-cv')){paDraw();paFramesRender();}}
function paPlay(restart){
  if(paPlaying)clearInterval(paPlaying);const p=paProj();let i=restart?paIdx:0;
  document.getElementById('pa-play').textContent='⏸ Anhalten';const pv=document.getElementById('pa-prev');
  paPlaying=setInterval(()=>{paRender(pv,paFrameArr(i%p.frames.length),p.w);paIdx=i%p.frames.length;i++;},1000/p.fps);
}
function paDownload(){
  const p=paProj(),sc=parseInt(document.getElementById('pa-scale').value,10)||8;
  const bytes=paGif(p.frames.map((_,i)=>paFrameArr(i)),p.w,p.w,sc,p.fps),a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([bytes],{type:'image/gif'}));a.download=paCur.replace(/[^\w-]+/g,'_')+'.gif';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
