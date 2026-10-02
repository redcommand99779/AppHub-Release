/* ══════════════════════════════════
   MALSTUDIO – Zeichenprogramm mit Ebenen. Pinsel (rund, weich oder hart, mit Deckkraft), Radierer, Linie, Rechteck, Ellipse, Füllen (mit Toleranz),
   Pipette, Spiegel-Symmetrie, bis zu 8 Ebenen (sichtbar/unsichtbar, Deckkraft, nach oben/unten, duplizieren, nach unten verbinden), Rückgängig und
   Wiederholen (Strg+Z / Strg+Y), Speichern im Browser je Konto (bis 5 Bilder), Export als PNG, Bild als neue Ebene laden.
   Die Rechen-Logik (Füllen, Linien, Farben, Ebenen mischen, Verlauf, Projekt prüfen) ist von der Oberfläche getrennt und wird in tests/check.js
   geprüft. Gespeichert wird je Konto unter zf_malstudio.
══════════════════════════════════ */
const MZ_KEY='zf_malstudio';
const MZ_W=800,MZ_H=500,MZ_MAXL=8,MZ_HIST=25,MZ_MAXPROJ=5;
const MZ_PALETTE=['#000000','#434343','#7f7f7f','#bfbfbf','#ffffff','#7b3f00','#b5651d','#e6b980','#ff0000','#ff6b6b','#ff8c00','#ffd000','#fff176','#a6e22e','#2e8b2e','#006400','#00c9a7','#00bcd4','#1e90ff','#0d47a1','#6a1b9a','#b388ff','#ff4fd8','#e91e63','#c2185b','#800020','#ffe0bd','#d2a679','#8d5524','#3e2723','#90a4ae','#263238'];

/* ── Rechen-Logik (rein) ── */
function mzParse(h){h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');if(!/^[0-9a-fA-F]{6}$/.test(h))return [0,0,0];return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function mzHex(r,g,b){const c=x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0');return '#'+c(r)+c(g)+c(b);}
function mzHsv(h,s,v){   // h 0–360, s und v 0–1 → [r,g,b]
  h=((h%360)+360)%360;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
}
/* Füllen: img = {data:Uint8ClampedArray, width, height}, fill = [r,g,b,a], tol = erlaubte Abweichung je Kanal (0–255). Gibt die Zahl der geänderten Pixel zurück. */
function mzFloodFill(img,sx,sy,fill,tol){
  const {data,width:w,height:h}=img;sx=Math.floor(sx);sy=Math.floor(sy);tol=Math.max(0,Math.min(255,tol|0));
  if(sx<0||sy<0||sx>=w||sy>=h)return 0;
  const i0=(sy*w+sx)*4,tr=data[i0],tg=data[i0+1],tb=data[i0+2],ta=data[i0+3];
  const f=[fill[0],fill[1],fill[2],fill[3]===undefined?255:fill[3]];
  if(tol===0&&tr===f[0]&&tg===f[1]&&tb===f[2]&&ta===f[3])return 0;
  const seen=new Uint8Array(w*h),match=p=>{const i=p*4;return Math.abs(data[i]-tr)<=tol&&Math.abs(data[i+1]-tg)<=tol&&Math.abs(data[i+2]-tb)<=tol&&Math.abs(data[i+3]-ta)<=tol;};
  const stack=[[sx,sy]];let n=0;
  while(stack.length){
    const [x0,y]=stack.pop();let x=x0;
    while(x>=0&&!seen[y*w+x]&&match(y*w+x))x--;
    x++;let up=false,dn=false;
    while(x<w&&!seen[y*w+x]&&match(y*w+x)){
      const p=y*w+x,i=p*4;seen[p]=1;data[i]=f[0];data[i+1]=f[1];data[i+2]=f[2];data[i+3]=f[3];n++;
      if(y>0){const q=p-w,m=!seen[q]&&match(q);if(m&&!up){stack.push([x,y-1]);up=true;}else if(!m)up=false;}
      if(y<h-1){const q=p+w,m=!seen[q]&&match(q);if(m&&!dn){stack.push([x,y+1]);dn=true;}else if(!m)dn=false;}
      x++;
    }
  }
  return n;
}
function mzLine(x0,y0,x1,y1,cb){   // Bresenham: jeder Punkt der Linie, Anfang und Ende eingeschlossen
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
  for(;;){cb(x0,y0);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}}
}
function mzRect(x0,y0,x1,y1){return {x:Math.min(x0,x1),y:Math.min(y0,y1),w:Math.abs(x1-x0),h:Math.abs(y1-y0)};}
/* Ein Quellpixel (Farbe + Alpha 0–1) „darüberlegen“ (Normal-Überblendung) */
function mzBlend(d,i,r,g,b,a){
  if(a<=0)return;const da=d[i+3]/255,oa=a+da*(1-a);
  if(oa<=0)return;
  d[i]=Math.round((r*a+d[i]*da*(1-a))/oa);d[i+1]=Math.round((g*a+d[i+1]*da*(1-a))/oa);d[i+2]=Math.round((b*a+d[i+2]*da*(1-a))/oa);d[i+3]=Math.round(oa*255);
}
/* Ebenen von unten nach oben zusammenrechnen: layers = [{data,opacity 0–1,visible}], bg = [r,g,b] oder null (durchsichtig) */
function mzComposite(layers,w,h,bg){
  const out=new Uint8ClampedArray(w*h*4);
  if(bg)for(let i=0;i<out.length;i+=4){out[i]=bg[0];out[i+1]=bg[1];out[i+2]=bg[2];out[i+3]=255;}
  layers.forEach(L=>{if(!L.visible||L.opacity<=0)return;const s=L.data;for(let i=0;i<out.length;i+=4){const a=s[i+3]/255*L.opacity;if(a>0)mzBlend(out,i,s[i],s[i+1],s[i+2],a);}});
  return out;
}
function mzMergeDown(lower,upper,opacity){   // untere Ebene bekommt die obere (mit deren Deckkraft)
  const out=new Uint8ClampedArray(lower);for(let i=0;i<out.length;i+=4){const a=upper[i+3]/255*opacity;if(a>0)mzBlend(out,i,upper[i],upper[i+1],upper[i+2],a);}return out;
}
/* Ebenenliste (Beschreibungen ohne Pixel): Namen, sichtbar, Deckkraft */
function mzNewLayerInfo(n){return {name:'Ebene '+n,visible:true,opacity:1};}
function mzCanAdd(list){return list.length<MZ_MAXL;}
function mzMoveIndex(list,i,delta){const j=i+delta;return j<0||j>=list.length?i:j;}   // neue Position oder gleiche, wenn nicht möglich
/* Projekt prüfen: Daten aus dem Speicher (Ebenen mit PNG-Bild) in Ordnung bringen */
function mzSanitize(o){
  const out={v:1,name:'Mein Bild',w:MZ_W,h:MZ_H,layers:[]};
  if(!o||typeof o!=='object')return out;
  out.name=String(o.name||'Mein Bild').slice(0,40);
  (Array.isArray(o.layers)?o.layers:[]).slice(0,MZ_MAXL).forEach((l,i)=>{
    if(!l||typeof l!=='object')return;
    const op=l.opacity===undefined||isNaN(+l.opacity)?1:Math.max(0,Math.min(1,+l.opacity));
    out.layers.push({name:String(l.name||'Ebene '+(i+1)).slice(0,24),visible:l.visible!==false,opacity:op,png:typeof l.png==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(l.png)?l.png:''});
  });
  return out;
}
/* Verlauf: Einträge sind beliebige Objekte; h = {undo:[],redo:[]} */
function mzHistNew(){return {undo:[],redo:[]};}
function mzHistPush(h,entry){h.undo.push(entry);if(h.undo.length>MZ_HIST)h.undo.shift();h.redo=[];}
function mzHistUndo(h,current){if(!h.undo.length)return null;h.redo.push(current);return h.undo.pop();}
function mzHistRedo(h,current){if(!h.redo.length)return null;h.undo.push(current);return h.redo.pop();}
/* Projekte je Konto */
function mzAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function mzAll(){try{const o=JSON.parse(localStorage.getItem(MZ_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function mzProjects(){const a=mzAll()[mzAccount().toLowerCase()||'_gast'];const out={};if(a&&a.projects&&typeof a.projects==='object')Object.keys(a.projects).slice(0,MZ_MAXPROJ).forEach(k=>{out[k.slice(0,40)]=mzSanitize(a.projects[k]);});return out;}
function mzSaveProject(name,proj){
  name=String(name||'').trim().slice(0,40);if(!name)return 'name';
  const all=mzAll(),key=mzAccount().toLowerCase()||'_gast',ps=mzProjects();
  if(!(name in ps)&&Object.keys(ps).length>=MZ_MAXPROJ)return 'voll';
  const p=mzSanitize(proj);p.name=name;ps[name]=p;all[key]={projects:ps};
  try{localStorage.setItem(MZ_KEY,JSON.stringify(all));}catch(e){return 'speicher';}
  return 'ok';
}
function mzDeleteProject(name){const all=mzAll(),key=mzAccount().toLowerCase()||'_gast',ps=mzProjects();if(!(name in ps))return false;delete ps[name];all[key]={projects:ps};try{localStorage.setItem(MZ_KEY,JSON.stringify(all));}catch(e){return false;}return true;}

/* ── Oberfläche ── */
const mz={tool:'brush',color:'#1e1e1e',size:8,opacity:1,soft:false,fill:false,tol:24,mirror:false,active:0,layers:[],hist:null,view:null,tmp:null,drag:null,msg:'',name:'Mein Bild',recent:[]};
function mzActive(){const s=document.getElementById('screen-malen');return !!s&&s.classList.contains('active');}
function mzMakeCanvas(){const c=document.createElement('canvas');c.width=MZ_W;c.height=MZ_H;return c;}
function mzNewLayer(name,white){
  const c=mzMakeCanvas(),x=c.getContext('2d');if(white){x.fillStyle='#ffffff';x.fillRect(0,0,MZ_W,MZ_H);}
  return {name,visible:true,opacity:1,canvas:c};
}
function mzInit(){
  if(!mz.layers.length){mz.layers=[mzNewLayer('Hintergrund',true),mzNewLayer('Ebene 2',false)];mz.active=1;mz.hist=mzHistNew();}
  mzRender();
}
function mzCtx(i){return mz.layers[i===undefined?mz.active:i].canvas.getContext('2d',{willReadFrequently:true});}
/* Verlauf-Einträge */
function mzSnapPix(){const L=mz.layers[mz.active];return {t:'pix',i:mz.active,data:mzCtx().getImageData(0,0,MZ_W,MZ_H)};}
function mzSnapAll(){return {t:'all',active:mz.active,layers:mz.layers.map(l=>({name:l.name,visible:l.visible,opacity:l.opacity,data:l.canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,MZ_W,MZ_H)}))};}
function mzCommit(entry){mzHistPush(mz.hist,entry||mzSnapPix());mzUpdateHist();}
function mzApply(e){
  if(e.t==='pix'){mz.layers[e.i].canvas.getContext('2d').putImageData(e.data,0,0);mz.active=Math.min(mz.active,mz.layers.length-1);}
  else{mz.layers=e.layers.map(l=>{const c=mzMakeCanvas();c.getContext('2d').putImageData(l.data,0,0);return {name:l.name,visible:l.visible,opacity:l.opacity,canvas:c};});mz.active=Math.max(0,Math.min(e.active,mz.layers.length-1));}
}
function mzUndo(){const top=mz.hist.undo[mz.hist.undo.length-1];if(!top)return;const cur=top.t==='pix'?{t:'pix',i:top.i,data:mzCtx(top.i).getImageData(0,0,MZ_W,MZ_H)}:mzSnapAll();const e=mzHistUndo(mz.hist,cur);mzApply(e);mzRender();}
function mzRedo(){const top=mz.hist.redo[mz.hist.redo.length-1];if(!top)return;const cur=top.t==='pix'?{t:'pix',i:top.i,data:mzCtx(top.i).getImageData(0,0,MZ_W,MZ_H)}:mzSnapAll();const e=mzHistRedo(mz.hist,cur);mzApply(e);mzRender();}
function mzUpdateHist(){const u=document.getElementById('mz-undo'),r=document.getElementById('mz-redo');if(u)u.style.opacity=mz.hist.undo.length?1:0.35;if(r)r.style.opacity=mz.hist.redo.length?1:0.35;}
/* Anzeige: alle Ebenen übereinander, darüber der Strich in Arbeit */
function mzPaintView(){
  const cv=mz.view;if(!cv)return;const x=cv.getContext('2d');
  x.clearRect(0,0,MZ_W,MZ_H);
  const s=14;for(let yy=0;yy<MZ_H;yy+=s)for(let xx=0;xx<MZ_W;xx+=s){x.fillStyle=((xx/s+yy/s)%2)?'#d9d9d9':'#f2f2f2';x.fillRect(xx,yy,s,s);}
  mz.layers.forEach((L,i)=>{
    if(!L.visible)return;x.globalAlpha=L.opacity;
    if(i===mz.active&&mz.drag&&mz.drag.live){
      const t=document.createElement('canvas');t.width=MZ_W;t.height=MZ_H;const tx=t.getContext('2d');tx.drawImage(L.canvas,0,0);
      tx.globalAlpha=mz.opacity;tx.globalCompositeOperation=mz.tool==='eraser'?'destination-out':'source-over';tx.drawImage(mz.tmp,0,0);x.drawImage(t,0,0);
    }else x.drawImage(L.canvas,0,0);
  });
  x.globalAlpha=1;
}
function mzPos(e){const r=mz.view.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*MZ_W,y:(e.clientY-r.top)/r.height*MZ_H};}
function mzStrokeStyle(x){x.strokeStyle=mz.tool==='eraser'?'#000':mz.color;x.fillStyle=x.strokeStyle;x.lineWidth=mz.size;x.lineCap='round';x.lineJoin='round';if(mz.soft){x.shadowColor=x.strokeStyle;x.shadowBlur=mz.size*0.8;}else{x.shadowBlur=0;}}
function mzDrawSeg(x,a,b){
  mzStrokeStyle(x);
  const pts=[[a,b]];if(mz.mirror)pts.push([{x:MZ_W-a.x,y:a.y},{x:MZ_W-b.x,y:b.y}]);
  pts.forEach(([p,q])=>{x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x+0.01,q.y);x.stroke();});
}
function mzShape(x,a,b){
  mzStrokeStyle(x);const sets=[[a,b]];if(mz.mirror)sets.push([{x:MZ_W-a.x,y:a.y},{x:MZ_W-b.x,y:b.y}]);
  sets.forEach(([p,q])=>{
    x.beginPath();
    if(mz.tool==='line'){x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke();}
    else{const r=mzRect(p.x,p.y,q.x,q.y);
      if(mz.tool==='rect'){x.rect(r.x,r.y,r.w,r.h);}else{x.ellipse(r.x+r.w/2,r.y+r.h/2,Math.max(0.5,r.w/2),Math.max(0.5,r.h/2),0,0,Math.PI*2);}
      if(mz.fill)x.fill();x.stroke();}
  });
}
function mzDown(e){
  e.preventDefault();const p=mzPos(e),L=mz.layers[mz.active];if(!L)return;
  try{e.target.setPointerCapture(e.pointerId);}catch(_){}
  if(mz.tool==='pipette'){mzPick(p);return;}
  if(!L.visible){mz.msg='Diese Ebene ist unsichtbar – blende sie erst ein.';mzMsg();return;}
  if(mz.tool==='fill'){
    mzCommit();const x=mzCtx(),img=x.getImageData(0,0,MZ_W,MZ_H),c=mzParse(mz.color);
    mzFloodFill(img,p.x,p.y,[c[0],c[1],c[2],255],mz.tol);x.putImageData(img,0,0);mzRememberColor();mzPaintView();return;
  }
  mzCommit();mz.tmp=mz.tmp||mzMakeCanvas();mz.tmp.getContext('2d').clearRect(0,0,MZ_W,MZ_H);
  mz.drag={start:p,last:p,live:true};
  if(mz.tool==='brush'||mz.tool==='eraser')mzDrawSeg(mz.tmp.getContext('2d'),p,p);
  mzPaintView();
}
function mzMove(e){
  if(!mz.drag)return;const p=mzPos(e),x=mz.tmp.getContext('2d');
  if(mz.tool==='brush'||mz.tool==='eraser'){mzDrawSeg(x,mz.drag.last,p);mz.drag.last=p;}
  else{x.clearRect(0,0,MZ_W,MZ_H);mzShape(x,mz.drag.start,e.shiftKey&&mz.tool!=='line'?{x:p.x,y:mz.drag.start.y+(p.x-mz.drag.start.x)*(p.y>=mz.drag.start.y?1:-1)*(p.x>=mz.drag.start.x?1:-1)}:p);}
  mzPaintView();
}
function mzUp(){
  if(!mz.drag)return;const L=mz.layers[mz.active],x=L.canvas.getContext('2d');
  x.save();x.globalAlpha=mz.opacity;x.globalCompositeOperation=mz.tool==='eraser'?'destination-out':'source-over';x.drawImage(mz.tmp,0,0);x.restore();
  mz.tmp.getContext('2d').clearRect(0,0,MZ_W,MZ_H);mz.drag=null;if(mz.tool!=='eraser')mzRememberColor();mzPaintView();mzUpdateThumbs();
}
function mzPick(p){
  const c=document.createElement('canvas');c.width=1;c.height=1;const x=c.getContext('2d');
  x.drawImage(mz.view,-Math.floor(p.x),-Math.floor(p.y));const d=x.getImageData(0,0,1,1).data;mz.color=mzHex(d[0],d[1],d[2]);mzRender();
}
function mzRememberColor(){const c=mz.color;mz.recent=[c].concat(mz.recent.filter(x=>x!==c)).slice(0,10);const el=document.getElementById('mz-recent');if(el)el.innerHTML=mzRecentHtml();}
function mzRecentHtml(){return mz.recent.map(c=>`<span onclick="mzSetColor('${c}')" style="display:inline-block;width:20px;height:20px;border-radius:5px;background:${c};border:1px solid rgba(255,255,255,.4);cursor:pointer"></span>`).join(' ');}
function mzSetColor(c){mz.color=c;mzRender();}
function mzSet(k,v){
  if(k==='size')mz.size=Math.max(1,Math.min(120,+v|0));else if(k==='opacity')mz.opacity=Math.max(0.05,Math.min(1,(+v)/100));
  else if(k==='tol')mz.tol=Math.max(0,Math.min(120,+v|0));else if(k==='soft')mz.soft=!mz.soft;else if(k==='fill')mz.fill=!mz.fill;else if(k==='mirror')mz.mirror=!mz.mirror;
  else if(k==='tool')mz.tool=v;else if(k==='color')mz.color=v;
  mzRender();
}
/* Ebenen */
function mzSelectLayer(i){mz.active=i;mzRenderLayers();}
function mzAddLayer(){if(!mzCanAdd(mz.layers)){mz.msg='Mehr als 8 Ebenen gibt es nicht.';mzMsg();return;}mzCommit(mzSnapAll());mz.layers.splice(mz.active+1,0,mzNewLayer('Ebene '+(mz.layers.length+1),false));mz.active++;mzRender();}
function mzDupLayer(){if(!mzCanAdd(mz.layers))return mzAddLayer();mzCommit(mzSnapAll());const s=mz.layers[mz.active],n=mzNewLayer(s.name+' Kopie',false);n.canvas.getContext('2d').drawImage(s.canvas,0,0);n.opacity=s.opacity;n.visible=s.visible;mz.layers.splice(mz.active+1,0,n);mz.active++;mzRender();}
function mzDelLayer(){if(mz.layers.length<=1)return;mzCommit(mzSnapAll());mz.layers.splice(mz.active,1);mz.active=Math.max(0,mz.active-1);mzRender();}
function mzMoveLayer(d){const j=mzMoveIndex(mz.layers,mz.active,d);if(j===mz.active)return;mzCommit(mzSnapAll());const [l]=mz.layers.splice(mz.active,1);mz.layers.splice(j,0,l);mz.active=j;mzRender();}
function mzMergeLayer(){if(mz.active<=0)return;mzCommit(mzSnapAll());const up=mz.layers[mz.active],lo=mz.layers[mz.active-1];const ud=up.canvas.getContext('2d').getImageData(0,0,MZ_W,MZ_H),ld=lo.canvas.getContext('2d').getImageData(0,0,MZ_W,MZ_H);const out=mzMergeDown(ld.data,ud.data,up.visible?up.opacity:0);ld.data.set(out);lo.canvas.getContext('2d').putImageData(ld,0,0);mz.layers.splice(mz.active,1);mz.active--;mzRender();}
function mzToggleVis(i){mzCommit(mzSnapAll());mz.layers[i].visible=!mz.layers[i].visible;mzRender();}
function mzLayerOpacity(i,v){mz.layers[i].opacity=Math.max(0,Math.min(1,v/100));mzPaintView();}
function mzClearLayer(){mzCommit();mzCtx().clearRect(0,0,MZ_W,MZ_H);if(mz.active===0){const x=mzCtx();x.fillStyle='#fff';x.fillRect(0,0,MZ_W,MZ_H);}mzPaintView();mzUpdateThumbs();}
function mzFlipLayer(){mzCommit();const L=mz.layers[mz.active],t=mzMakeCanvas(),x=t.getContext('2d');x.translate(MZ_W,0);x.scale(-1,1);x.drawImage(L.canvas,0,0);const lx=L.canvas.getContext('2d');lx.clearRect(0,0,MZ_W,MZ_H);lx.drawImage(t,0,0);mzPaintView();mzUpdateThumbs();}
function mzRenameLayer(i,v){mz.layers[i].name=String(v).slice(0,24)||('Ebene '+(i+1));}
function mzNewImage(){mzCommit(mzSnapAll());mz.layers=[mzNewLayer('Hintergrund',true),mzNewLayer('Ebene 2',false)];mz.active=1;mz.name='Mein Bild';mzRender();}
function mzLoadFile(input){
  const f=input.files&&input.files[0];if(!f)return;const img=new Image(),url=URL.createObjectURL(f);
  img.onload=()=>{
    if(!mzCanAdd(mz.layers)){mz.msg='Mehr als 8 Ebenen gibt es nicht.';mzMsg();URL.revokeObjectURL(url);return;}
    mzCommit(mzSnapAll());const n=mzNewLayer(f.name.slice(0,20),false),s=Math.min(MZ_W/img.width,MZ_H/img.height,1),w=img.width*s,h=img.height*s;
    n.canvas.getContext('2d').drawImage(img,(MZ_W-w)/2,(MZ_H-h)/2,w,h);mz.layers.splice(mz.active+1,0,n);mz.active++;URL.revokeObjectURL(url);mzRender();
  };
  img.onerror=()=>{mz.msg='Das Bild konnte nicht geladen werden.';mzMsg();URL.revokeObjectURL(url);};img.src=url;input.value='';
}
/* Speichern und Exportieren */
function mzProject(){return {v:1,name:mz.name,w:MZ_W,h:MZ_H,layers:mz.layers.map(l=>({name:l.name,visible:l.visible,opacity:l.opacity,png:l.canvas.toDataURL('image/png')}))};}
function mzSave(){
  const n=(document.getElementById('mz-name')||{}).value||mz.name;mz.name=String(n).trim().slice(0,40)||'Mein Bild';
  const r=mzSaveProject(mz.name,mzProject());
  mz.msg=r==='ok'?'Gespeichert: '+mz.name:r==='voll'?'Es sind schon 5 Bilder gespeichert – lösche erst eins.':r==='speicher'?'Der Browser-Speicher ist voll. Exportiere das Bild als PNG.':'Bitte einen Namen eingeben.';
  mzRender();
}
function mzLoad(name){
  const p=mzProjects()[name];if(!p||!p.layers.length)return;
  mzCommit(mzSnapAll());let pending=p.layers.length;const layers=new Array(p.layers.length);
  p.layers.forEach((l,i)=>{
    const c=mzMakeCanvas(),done=()=>{layers[i]={name:l.name,visible:l.visible,opacity:l.opacity,canvas:c};if(--pending===0){mz.layers=layers;mz.active=layers.length-1;mz.name=p.name;mzRender();}};
    if(!l.png){done();return;}const im=new Image();im.onload=()=>{c.getContext('2d').drawImage(im,0,0);done();};im.onerror=done;im.src=l.png;
  });
}
function mzDel(name){if(mzDeleteProject(name)){mz.msg='Gelöscht: '+name;mzRender();}}
function mzExport(){
  const c=document.createElement('canvas');c.width=MZ_W;c.height=MZ_H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,MZ_W,MZ_H);
  mz.layers.forEach(L=>{if(!L.visible)return;x.globalAlpha=L.opacity;x.drawImage(L.canvas,0,0);});
  const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=(mz.name||'bild').replace(/[^\wäöüÄÖÜß -]/g,'_')+'.png';document.body.appendChild(a);a.click();a.remove();
  mz.msg='PNG-Datei erstellt.';mzMsg();
}
function mzMsg(){const el=document.getElementById('mz-msg');if(el)el.textContent=mz.msg||'';}
function mzUpdateThumbs(){document.querySelectorAll('#mz-root [data-th]').forEach(c=>{const i=+c.getAttribute('data-th'),L=mz.layers[i];if(!L)return;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#eee';x.fillRect(0,0,c.width,c.height);x.drawImage(L.canvas,0,0,c.width,c.height);});}
function mzRenderLayers(){
  const el=document.getElementById('mz-layers');if(!el)return;const esc=typeof escHtml==='function'?escHtml:(x=>x);
  el.innerHTML=mz.layers.map((l,i)=>i).reverse().map(i=>{const l=mz.layers[i];return `<div style="display:flex;gap:6px;align-items:center;padding:4px;border-radius:8px;margin-bottom:3px;border:2px solid ${i===mz.active?'#42a5f5':'transparent'};background:${i===mz.active?'rgba(66,165,245,.1)':'transparent'}">
    <button class="lrn-chip" onclick="mzToggleVis(${i})" title="Sichtbar/Unsichtbar" style="padding:2px 6px">${l.visible?'👁':'🚫'}</button>
    <canvas data-th="${i}" width="48" height="30" onclick="mzSelectLayer(${i})" style="border:1px solid var(--divider);border-radius:4px;cursor:pointer"></canvas>
    <div style="flex:1;min-width:0"><input value="${esc(l.name)}" maxlength="24" onfocus="mzSelectLayer(${i})" onchange="mzRenameLayer(${i},this.value)" style="width:100%;padding:2px 6px;border-radius:5px;border:1px solid var(--divider);background:transparent;color:var(--text);font-size:11px">
    <input type="range" min="0" max="100" value="${Math.round(l.opacity*100)}" oninput="mzLayerOpacity(${i},this.value)" title="Deckkraft" style="width:100%"></div></div>`;}).join('');
  mzUpdateThumbs();
}
function mzRender(){
  const root=document.getElementById('mz-root');if(!root)return;
  const esc=typeof escHtml==='function'?escHtml:(x=>x);
  const tools=[['brush','🖌','Pinsel'],['eraser','🧽','Radierer'],['line','📏','Linie'],['rect','⬜','Rechteck'],['ellipse','⭕','Ellipse'],['fill','🪣','Füllen'],['pipette','💧','Pipette']];
  const names=Object.keys(mzProjects());
  root.innerHTML=`<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">${tools.map(t=>`<button class="lrn-chip ${mz.tool===t[0]?'active':''}" onclick="mzSet('tool','${t[0]}')" title="${t[2]}" style="font-size:15px;padding:5px 10px">${t[1]} <span style="font-size:11px">${t[2]}</span></button>`).join('')}
    <button class="lrn-btn ghost" id="mz-undo" onclick="mzUndo()" title="Rückgängig (Strg+Z)" style="opacity:${mz.hist.undo.length?1:0.35}">↶</button><button class="lrn-btn ghost" id="mz-redo" onclick="mzRedo()" title="Wiederholen (Strg+Y)" style="opacity:${mz.hist.redo.length?1:0.35}">↷</button></div>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:8px;font-size:12px">
    <label>Farbe <input type="color" value="${mz.color}" oninput="mz.color=this.value" onchange="mzSet('color',this.value)" style="vertical-align:middle;width:36px;height:28px"></label>
    <label>Größe <strong>${mz.size}</strong> <input type="range" min="1" max="120" value="${mz.size}" onchange="mzSet('size',this.value)" style="width:100px;vertical-align:middle"></label>
    <label>Deckkraft <strong>${Math.round(mz.opacity*100)} %</strong> <input type="range" min="5" max="100" value="${Math.round(mz.opacity*100)}" onchange="mzSet('opacity',this.value)" style="width:90px;vertical-align:middle"></label>
    ${mz.tool==='fill'?`<label>Toleranz <strong>${mz.tol}</strong> <input type="range" min="0" max="120" value="${mz.tol}" onchange="mzSet('tol',this.value)" style="width:90px;vertical-align:middle"></label>`:''}
    <button class="lrn-chip ${mz.soft?'active':''}" onclick="mzSet('soft')">Weich</button><button class="lrn-chip ${mz.fill?'active':''}" onclick="mzSet('fill')" title="Rechteck und Ellipse füllen">Gefüllt</button><button class="lrn-chip ${mz.mirror?'active':''}" onclick="mzSet('mirror')" title="Alles wird links-rechts gespiegelt mitgezeichnet">Spiegeln</button></div>
  <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:4px">${MZ_PALETTE.map(c=>`<span onclick="mzSetColor('${c}')" style="width:22px;height:22px;border-radius:5px;background:${c};border:2px solid ${c===mz.color?'#fff':'rgba(255,255,255,.25)'};cursor:pointer"></span>`).join('')}</div>
  <div id="mz-recent" style="text-align:center;margin-bottom:8px;min-height:22px">${mzRecentHtml()}</div>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;justify-content:center">
    <div style="flex:1 1 520px;max-width:800px"><canvas id="mz-view" width="${MZ_W}" height="${MZ_H}" style="display:block;width:100%;height:auto;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.35);touch-action:none;cursor:crosshair;background:#fff" onpointerdown="mzDown(event)" onpointermove="mzMove(event)" onpointerup="mzUp(event)" onpointercancel="mzUp(event)"></canvas></div>
    <div style="flex:0 0 210px;max-width:100%"><div class="lrn-label" style="margin-bottom:4px">Ebenen</div><div id="mz-layers"></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px"><button class="lrn-btn ghost" onclick="mzAddLayer()" title="Neue Ebene">＋</button><button class="lrn-btn ghost" onclick="mzDupLayer()" title="Ebene duplizieren">⧉</button><button class="lrn-btn ghost" onclick="mzMoveLayer(1)" title="Nach oben">▲</button><button class="lrn-btn ghost" onclick="mzMoveLayer(-1)" title="Nach unten">▼</button><button class="lrn-btn ghost" onclick="mzMergeLayer()" title="Mit der Ebene darunter verbinden">⤓</button><button class="lrn-btn ghost" onclick="mzDelLayer()" title="Ebene löschen" style="color:#e53935">✕</button></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;font-size:11px"><button class="lrn-btn ghost" onclick="mzClearLayer()">Ebene leeren</button><button class="lrn-btn ghost" onclick="mzFlipLayer()">Spiegeln ↔</button></div></div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:12px;font-size:12px">
    <input id="mz-name" value="${esc(mz.name)}" maxlength="40" style="padding:6px 10px;border-radius:8px;border:1px solid var(--divider);background:transparent;color:var(--text)">
    <button class="lrn-btn" onclick="mzSave()">💾 Speichern</button><button class="lrn-btn ghost" onclick="mzExport()">⬇ Als PNG</button>
    <label class="lrn-btn ghost" style="cursor:pointer">🖼 Bild laden<input type="file" accept="image/*" style="display:none" onchange="mzLoadFile(this)"></label><button class="lrn-btn ghost" onclick="mzNewImage()">Neu</button></div>
  <div id="mz-msg" style="text-align:center;font-size:12px;color:var(--text-3);margin-top:6px;min-height:16px">${esc(mz.msg||'')}</div>
  ${names.length?`<div class="lrn-label" style="text-align:center;margin-top:8px">Deine Bilder</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">${names.map(n=>`<span class="game-chip"><a href="#" onclick="mzLoad(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:inherit;text-decoration:none">🖼 ${esc(n)}</a> <a href="#" onclick="mzDel(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:#e53935;text-decoration:none;margin-left:6px">✕</a></span>`).join('')}</div>`:''}
  <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:10px">Zeichne auf der gewählten Ebene (blau markiert). Alles lässt sich mit Strg+Z zurücknehmen. Gespeichert wird im Browser (bis 5 Bilder) – für mehr oder zum Teilen nimm „Als PNG“.</div>`;
  mz.view=document.getElementById('mz-view');mzPaintView();mzRenderLayers();
}
document.addEventListener('keydown',e=>{
  if(!mzActive()||/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))return;
  const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(mod&&k==='z'){e.preventDefault();if(e.shiftKey)mzRedo();else mzUndo();}
  else if(mod&&k==='y'){e.preventDefault();mzRedo();}
  else if(!mod){const m={b:'brush',e:'eraser',l:'line',r:'rect',o:'ellipse',g:'fill',i:'pipette'}[k];if(m)mzSet('tool',m);}
});
