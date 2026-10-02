/* ══════════════════════════════════
   PIXEL-ANIMATOR – Bilder Pixel für Pixel zeichnen und zu einer Animation zusammensetzen, als GIF speichern.
   Raster 16×16, 32×32 oder 48×48, 16 Farben (die erste ist durchsichtig), bis zu 24 Bilder je Animation, Zwiebelhaut (das Bild davor scheint durch),
   Stift, Radierer, Füllen, Pipette, Rückgängig, Abspielen mit 1–24 Bildern/s. Je Konto bis zu 8 Animationen (zf_pixelanim).
   Der GIF-Export ist selbst gebaut (LZW-Kompression, durchsichtiger Hintergrund, Endlosschleife) – kein Download von Bibliotheken nötig.
══════════════════════════════════ */
const PN_KEY='zf_pixelanim',PN_MAX_PROJ=8,PN_MAX_FRAMES=24,PN_SIZES=[16,32,48];
const PN_PALETTE=['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'];   // Farbe 0 ist durchsichtig (wird als Karomuster gezeigt)
/* ── Reine Logik (wird getestet) ── */
const pnNew=(w,h)=>new Uint8Array(w*h);
const pnToHex=a=>{let s='';for(let i=0;i<a.length;i++)s+=a[i].toString(16);return s;};
function pnFromHex(s,n){const a=new Uint8Array(n);if(typeof s!=='string')return a;for(let i=0;i<n&&i<s.length;i++){const v=parseInt(s[i],16);a[i]=v>=0&&v<16?v:0;}return a;}
/* Füllen (4 Nachbarn); gibt die Zahl der geänderten Pixel zurück */
function pnFill(a,w,h,x,y,c){
  if(x<0||y<0||x>=w||y>=h)return 0;const t=a[y*w+x];if(t===c)return 0;
  const st=[x+y*w];let n=0;
  while(st.length){const p=st.pop();if(a[p]!==t)continue;a[p]=c;n++;const px=p%w,py=(p-px)/w;
    if(px>0)st.push(p-1);if(px<w-1)st.push(p+1);if(py>0)st.push(p-w);if(py<h-1)st.push(p+w);}
  return n;
}
/* Linie zwischen zwei Rasterpunkten (Bresenham), beide Enden gehören dazu */
function pnLine(x0,y0,x1,y1){
  const pts=[];let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy;
  for(;;){pts.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}
  return pts;
}
/* GIF-Kompression (LZW) mit variabler Codebreite; Rückgabe: Bytes ohne Blockaufteilung */
function pnLzw(idx,minCode){
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
const pnHexRgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
/* Ganze Animation als GIF: frames = Liste von Uint8Array (w·h), scale = Vergrößerung (ganze Pixel), fps = Bilder pro Sekunde */
function pnGif(frames,w,h,scale,fps){
  const W=w*scale,H=h*scale,out=[],u16=n=>[n&255,(n>>8)&255];
  out.push(...'GIF89a'.split('').map(c=>c.charCodeAt(0)),...u16(W),...u16(H),0xF3,0,0);
  PN_PALETTE.forEach(c=>out.push(...pnHexRgb(c)));
  out.push(0x21,0xFF,0x0B,...'NETSCAPE2.0'.split('').map(c=>c.charCodeAt(0)),3,1,0,0,0);
  const delay=Math.max(2,Math.round(100/Math.max(1,fps)));
  frames.forEach(f=>{
    out.push(0x21,0xF9,4,0x09,...u16(delay),0,0);
    out.push(0x2C,0,0,0,0,...u16(W),...u16(H),0);
    const px=new Uint8Array(W*H);
    for(let y=0;y<H;y++){const sy=Math.floor(y/scale);for(let x=0;x<W;x++)px[y*W+x]=f[sy*w+Math.floor(x/scale)];}
    out.push(4);const data=pnLzw(px,4);
    for(let i=0;i<data.length;i+=255){const ch=data.slice(i,i+255);out.push(ch.length,...ch);}
    out.push(0);
  });
  out.push(0x3B);return Uint8Array.from(out);
}
function pnAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n.toLowerCase();}}catch(e){}return '_gast';}
function pnAll(){try{const o=JSON.parse(localStorage.getItem(PN_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
/* Konto laden: nur gültige Animationen (Name, Größe 16/32/48, 1–24 Bilder, fps 1–24); Bilder als Hex-Text */
function pnLoad(){
  const a=pnAll()[pnAccount()]||{},out={projects:{},last:''},P=a.projects&&typeof a.projects==='object'&&!Array.isArray(a.projects)?a.projects:{};let n=0;
  Object.keys(P).forEach(k=>{
    if(n>=PN_MAX_PROJ||!Object.prototype.hasOwnProperty.call(P,k))return;const p=P[k],name=String(k).trim().slice(0,30);
    if(!name||!p||typeof p!=='object'||!PN_SIZES.includes(p.w)||!Array.isArray(p.frames)||!p.frames.length)return;
    const fps=Math.min(24,Math.max(1,p.fps|0||8));
    out.projects[name]={w:p.w,fps,frames:p.frames.slice(0,PN_MAX_FRAMES).map(f=>pnToHex(pnFromHex(f,p.w*p.w)))};n++;
  });
  out.last=typeof a.last==='string'&&a.last in out.projects?a.last:'';return out;
}
function pnSave(d){const all=pnAll();all[pnAccount()]=d;try{localStorage.setItem(PN_KEY,JSON.stringify(all));}catch(e){return false;}return true;}
function pnCreate(d,name,size){
  name=String(name||'').trim();if(!name||name.length>30||name in d.projects||!PN_SIZES.includes(size))return 'name';
  if(Object.keys(d.projects).length>=PN_MAX_PROJ)return 'voll';
  d.projects[name]={w:size,fps:8,frames:[pnToHex(pnNew(size,size))]};d.last=name;return 'ok';
}
/* Bilder verwalten: hinzufügen (leer oder Kopie), löschen (mindestens eins bleibt), verschieben */
function pnFrameAdd(p,at,copy){if(p.frames.length>=PN_MAX_FRAMES)return false;p.frames.splice(at+1,0,copy?p.frames[at]:pnToHex(pnNew(p.w,p.w)));return true;}
function pnFrameDel(p,at){if(p.frames.length<=1||at<0||at>=p.frames.length)return false;p.frames.splice(at,1);return true;}
function pnFrameMove(p,at,dir){const to=at+dir;if(at<0||at>=p.frames.length||to<0||to>=p.frames.length)return false;const f=p.frames.splice(at,1)[0];p.frames.splice(to,0,f);return true;}
/* ── Oberfläche ── */
let pnData=null,pnCur='',pnIdx=0,pnColor=8,pnTool='pen',pnOnion=true,pnPlaying=null,pnDown=false,pnLast=null,pnUndo=[],pnMsg='';
const pnEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pnProj=()=>pnData.projects[pnCur];
const pnFrameArr=i=>pnFromHex(pnProj().frames[i],pnProj().w*pnProj().w);
function pnInit(){const root=document.getElementById('pn-root');if(!root)return;pnStop();pnData=pnLoad();pnCur='';pnMsg='';pnRenderList();}
function pnRenderList(){
  const root=document.getElementById('pn-root');pnCur='';const names=Object.keys(pnData.projects);
  root.innerHTML=`<p class="pn-muted">Zeichne Bilder Pixel für Pixel und lass sie als Animation laufen. Als GIF speichern kannst du sie überall teilen.</p>
  <div class="pn-card"><b>Neue Animation</b><div class="pn-row"><input id="pn-name" class="pn-input" maxlength="30" placeholder="Name">
  <select id="pn-size" class="pn-input">${PN_SIZES.map(s=>`<option value="${s}"${s===32?' selected':''}>${s} × ${s} Pixel</option>`).join('')}</select><button class="pn-btn primary" id="pn-new" type="button">Erstellen</button></div><div class="pn-muted" id="pn-msg">${pnEsc(pnMsg)}</div></div>
  <h3>Deine Animationen (${names.length}/${PN_MAX_PROJ})</h3><div id="pn-projects">${names.length?'':'<div class="pn-muted">Noch keine – leg oben eine an.</div>'}</div>`;
  const box=document.getElementById('pn-projects');
  names.forEach(n=>{const p=pnData.projects[n],row=document.createElement('div');row.className='pn-proj';row.innerHTML='<button type="button" class="pn-open"></button><span class="pn-muted">'+p.frames.length+' Bilder · '+p.w+'×'+p.w+'</span><button type="button" class="pn-btn ghost" title="Löschen">✕</button>';
    row.querySelector('.pn-open').textContent='🎞️ '+n;row.querySelector('.pn-open').onclick=()=>pnOpen(n);
    row.querySelector('.ghost').onclick=()=>{if(confirm('Animation „'+n+'“ löschen?')){delete pnData.projects[n];if(pnData.last===n)pnData.last='';pnSave(pnData);pnRenderList();}};box.appendChild(row);});
  document.getElementById('pn-new').onclick=()=>{const r=pnCreate(pnData,document.getElementById('pn-name').value,parseInt(document.getElementById('pn-size').value,10));
    if(r==='ok'){pnSave(pnData);pnMsg='';pnOpen(pnData.last);}else{pnMsg=r==='voll'?'Du hast schon '+PN_MAX_PROJ+' Animationen – lösche erst eine.':'Gib einen neuen Namen ein (höchstens 30 Zeichen, noch nicht vergeben).';document.getElementById('pn-msg').textContent=pnMsg;}};
}
function pnOpen(name){
  pnStop();pnCur=name;pnIdx=0;pnUndo=[];pnData.last=name;pnSave(pnData);const p=pnProj();
  const root=document.getElementById('pn-root');
  root.innerHTML=`<div class="pn-bar"><button class="pn-btn" id="pn-back" type="button">← Animationen</button><b id="pn-title"></b><span class="pn-spacer"></span>
    <label class="pn-muted">Tempo <input type="range" id="pn-fps" min="1" max="24" value="${p.fps}"> <span id="pn-fpsv">${p.fps}</span>/s</label>
    <button class="pn-btn" id="pn-play" type="button">▶ Abspielen</button>
    <select id="pn-scale" class="pn-input pn-narrow" title="Größe des GIFs"><option value="4">GIF ×4</option><option value="8" selected>GIF ×8</option><option value="12">GIF ×12</option></select><button class="pn-btn primary" id="pn-gif" type="button">⬇ Als GIF speichern</button></div>
  <div class="pn-main"><div class="pn-tools"><div id="pn-toolbtns"></div><div class="pn-pal" id="pn-pal"></div>
    <button class="pn-btn" id="pn-undo" type="button">↶ Rückgängig</button><label class="pn-muted"><input type="checkbox" id="pn-onion" ${pnOnion?'checked':''}> Zwiebelhaut</label>
    <button class="pn-btn" id="pn-clear" type="button">🗑 Bild leeren</button></div>
    <div class="pn-stage"><canvas id="pn-cv" width="${p.w}" height="${p.w}"></canvas><div class="pn-muted" id="pn-info"></div></div>
    <div class="pn-prevbox"><div class="pn-muted">Vorschau</div><canvas id="pn-prev" width="${p.w}" height="${p.w}"></canvas></div></div>
  <div class="pn-frames" id="pn-frames"></div>
  <div class="pn-row"><button class="pn-btn" id="pn-fnew" type="button">＋ Neues Bild</button><button class="pn-btn" id="pn-fcopy" type="button">⧉ Kopieren</button><button class="pn-btn" id="pn-fleft" type="button">◀ Nach links</button><button class="pn-btn" id="pn-fright" type="button">Nach rechts ▶</button><button class="pn-btn ghost" id="pn-fdel" type="button">✕ Bild löschen</button></div>`;
  document.getElementById('pn-title').textContent=name;
  document.getElementById('pn-back').onclick=()=>{pnStop();pnRenderList();};
  const fps=document.getElementById('pn-fps');fps.oninput=()=>{p.fps=parseInt(fps.value,10);document.getElementById('pn-fpsv').textContent=p.fps;pnSave(pnData);if(pnPlaying)pnPlay(true);};
  document.getElementById('pn-play').onclick=()=>pnPlaying?pnStop():pnPlay();
  document.getElementById('pn-gif').onclick=pnDownload;
  document.getElementById('pn-undo').onclick=pnUndoStep;
  document.getElementById('pn-onion').onchange=e=>{pnOnion=e.target.checked;pnDraw();};
  document.getElementById('pn-clear').onclick=()=>{pnPush();p.frames[pnIdx]=pnToHex(pnNew(p.w,p.w));pnChanged();};
  document.getElementById('pn-fnew').onclick=()=>{if(pnFrameAdd(p,pnIdx,false)){pnIdx++;pnUndo=[];pnChanged();}else alert('Höchstens '+PN_MAX_FRAMES+' Bilder.');};
  document.getElementById('pn-fcopy').onclick=()=>{if(pnFrameAdd(p,pnIdx,true)){pnIdx++;pnUndo=[];pnChanged();}else alert('Höchstens '+PN_MAX_FRAMES+' Bilder.');};
  document.getElementById('pn-fleft').onclick=()=>{if(pnFrameMove(p,pnIdx,-1)){pnIdx--;pnChanged();}};
  document.getElementById('pn-fright').onclick=()=>{if(pnFrameMove(p,pnIdx,1)){pnIdx++;pnChanged();}};
  document.getElementById('pn-fdel').onclick=()=>{if(p.frames.length>1&&confirm('Dieses Bild löschen?')){pnFrameDel(p,pnIdx);pnIdx=Math.min(pnIdx,p.frames.length-1);pnUndo=[];pnChanged();}};
  const cv=document.getElementById('pn-cv');
  const pos=e=>{const r=cv.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*p.w),Math.floor((e.clientY-r.top)/r.height*p.w)];};
  cv.onpointerdown=e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const [x,y]=pos(e);pnStop();
    if(pnTool==='pick'){if(x>=0&&y>=0&&x<p.w&&y<p.w){pnColor=pnFrameArr(pnIdx)[y*p.w+x];pnTool='pen';pnRenderTools();}return;}
    pnPush();pnDown=true;pnLast=[x,y];pnApply(x,y,x,y);};
  cv.onpointermove=e=>{if(!pnDown)return;const [x,y]=pos(e);pnApply(pnLast[0],pnLast[1],x,y);pnLast=[x,y];};
  cv.onpointerup=cv.onpointercancel=()=>{if(pnDown){pnDown=false;pnSave(pnData);pnFramesRender();}};
  pnRenderTools();pnFramesRender();pnDraw();
}
function pnRenderTools(){
  const tb=document.getElementById('pn-toolbtns');if(!tb)return;
  tb.innerHTML=[['pen','✏️ Stift'],['erase','🧽 Radierer'],['fill','🪣 Füllen'],['pick','💧 Pipette']].map(([k,l])=>`<button type="button" class="pn-btn${pnTool===k?' on':''}" data-t="${k}">${l}</button>`).join('');
  tb.querySelectorAll('button').forEach(b=>b.onclick=()=>{pnTool=b.dataset.t;pnRenderTools();});
  const pal=document.getElementById('pn-pal');pal.innerHTML=PN_PALETTE.map((c,i)=>`<button type="button" class="pn-sw${i===pnColor?' on':''}" data-c="${i}" style="${i===0?'':'background:'+c}" title="${i===0?'durchsichtig':c}"></button>`).join('');
  pal.querySelectorAll('button').forEach(b=>b.onclick=()=>{pnColor=parseInt(b.dataset.c,10);if(pnTool==='erase'||pnTool==='pick')pnTool='pen';pnRenderTools();});
}
function pnPush(){pnUndo.push([pnIdx,pnProj().frames[pnIdx]]);if(pnUndo.length>40)pnUndo.shift();}
function pnUndoStep(){const u=pnUndo.pop();if(!u)return;pnStop();pnProj().frames[u[0]]=u[1];pnIdx=u[0];pnChanged();}
function pnApply(x0,y0,x1,y1){
  const p=pnProj(),a=pnFrameArr(pnIdx);
  if(pnTool==='fill'){if(pnFill(a,p.w,p.w,x1,y1,pnColor)===0)return;}
  else{const c=pnTool==='erase'?0:pnColor;pnLine(x0,y0,x1,y1).forEach(([x,y])=>{if(x>=0&&y>=0&&x<p.w&&y<p.w)a[y*p.w+x]=c;});}
  p.frames[pnIdx]=pnToHex(a);pnDraw();
}
function pnChanged(){pnSave(pnData);pnFramesRender();pnDraw();}
function pnPaint(g,a,w,alpha){const im=g.getImageData(0,0,w,w),d=im.data;for(let i=0;i<a.length;i++){if(!a[i])continue;const c=pnHexRgb(PN_PALETTE[a[i]]);d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=alpha;}g.putImageData(im,0,0);}
function pnRender(cv,a,w,under){const g=cv.getContext('2d');g.clearRect(0,0,w,w);if(under){const t=document.createElement('canvas');t.width=t.height=w;const tg=t.getContext('2d');pnPaint(tg,under,w,90);g.drawImage(t,0,0);}
  const t2=document.createElement('canvas');t2.width=t2.height=w;pnPaint(t2.getContext('2d'),a,w,255);g.drawImage(t2,0,0);}
function pnDraw(){
  const p=pnProj(),cv=document.getElementById('pn-cv');if(!cv)return;
  pnRender(cv,pnFrameArr(pnIdx),p.w,pnOnion&&pnIdx>0?pnFrameArr(pnIdx-1):null);
  document.getElementById('pn-info').textContent='Bild '+(pnIdx+1)+' von '+p.frames.length+' · '+p.w+'×'+p.w+' Pixel';
  const pv=document.getElementById('pn-prev');if(pv&&!pnPlaying)pnRender(pv,pnFrameArr(pnIdx),p.w);
}
function pnFramesRender(){
  const p=pnProj(),box=document.getElementById('pn-frames');if(!box)return;box.innerHTML='';
  p.frames.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.className='pn-fr'+(i===pnIdx?' on':'');const c=document.createElement('canvas');c.width=c.height=p.w;pnRender(c,pnFrameArr(i),p.w);b.appendChild(c);const s=document.createElement('span');s.textContent=i+1;b.appendChild(s);
    b.onclick=()=>{pnIdx=i;pnUndo=[];pnFramesRender();pnDraw();};box.appendChild(b);});
}
function pnStop(){const was=!!pnPlaying;if(pnPlaying){clearInterval(pnPlaying);pnPlaying=null;}const b=document.getElementById('pn-play');if(b)b.textContent='▶ Abspielen';if(was&&pnCur&&document.getElementById('pn-cv')){pnDraw();pnFramesRender();}}
function pnPlay(restart){
  if(pnPlaying)clearInterval(pnPlaying);const p=pnProj();let i=restart?pnIdx:0;
  document.getElementById('pn-play').textContent='⏸ Anhalten';const pv=document.getElementById('pn-prev');
  pnPlaying=setInterval(()=>{pnRender(pv,pnFrameArr(i%p.frames.length),p.w);pnIdx=i%p.frames.length;i++;},1000/p.fps);
}
function pnDownload(){
  const p=pnProj(),sc=parseInt(document.getElementById('pn-scale').value,10)||8;
  const bytes=pnGif(p.frames.map((_,i)=>pnFrameArr(i)),p.w,p.w,sc,p.fps),a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([bytes],{type:'image/gif'}));a.download=pnCur.replace(/[^\w-]+/g,'_')+'.gif';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
