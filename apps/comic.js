/* ══════════════════════════════════
   COMIC-MAKER – Comic-Seiten bauen. Seite mit 1–6 Bildern (8 Vorlagen), je Bild ein Hintergrund (Himmel, Stadt, Zimmer, Weltall, Wiese, Meer,
   Manga-Linien oder eine Farbe), darauf Figuren (Emojis, mit Größe und Spiegeln), Sprechblasen (sagen, denken, schreien, Kasten) mit Schwanz, der auf
   die Figur zeigt, und freie Texte. Alles lässt sich anklicken, verschieben, in der Größe ziehen, nach vorn/hinten legen, duplizieren und löschen;
   Rückgängig/Wiederholen (Strg+Z / Strg+Y). Speichern je Konto (bis 10 Comics), Export als PNG.
   Die Rechen-Logik (Bildaufteilung, Blasen-Schwanz, Textumbruch, Treffer, Reihenfolge, Prüfen, Verlauf) ist von der Oberfläche getrennt und wird
   in tests/check.js geprüft. Gespeichert wird je Konto unter zf_comic.
══════════════════════════════════ */
const CM_KEY='zf_comic';
const CM_W=600,CM_H=800,CM_MAXITEMS=60,CM_MAXSAVED=10,CM_HIST=60;
const CM_LAYOUTS={
  '1':{name:'1 Bild',rects:[[0,0,1,1]]},
  '2h':{name:'2 übereinander',rects:[[0,0,1,.5],[0,.5,1,.5]]},
  '2v':{name:'2 nebeneinander',rects:[[0,0,.5,1],[.5,0,.5,1]]},
  '3':{name:'3 (oben breit)',rects:[[0,0,1,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]},
  '3s':{name:'3 Streifen',rects:[[0,0,1,1/3],[0,1/3,1,1/3],[0,2/3,1,1/3]]},
  '4':{name:'4 Felder',rects:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]},
  '5':{name:'5 gemischt',rects:[[0,0,1,.34],[0,.34,.5,.33],[.5,.34,.5,.33],[0,.67,.4,.33],[.4,.67,.6,.33]]},
  '6':{name:'6 Felder',rects:[[0,0,.5,1/3],[.5,0,.5,1/3],[0,1/3,.5,1/3],[.5,1/3,.5,1/3],[0,2/3,.5,1/3],[.5,2/3,.5,1/3]]}
};
const CM_BG={sky:'Himmel',city:'Stadt',room:'Zimmer',space:'Weltall',grass:'Wiese',sea:'Meer',manga:'Manga',plain:'Farbe'};
const CM_BUBBLES={say:'Sprechblase',think:'Gedanke',shout:'Schrei',box:'Kasten'};
const CM_EMOJI={
  Gesichter:['😀','😁','😂','😅','😍','😎','🤔','😮','😱','😡','😭','😴','🥳','🤯','😇','🤪','🙄','😏'],
  Leute:['🧍','🧑‍🚀','🦸','🦹','🧙','🧛','🧟','👮','👷','🕵️','🧑‍🍳','🤖','👽','👻','🥷','🧑‍🎤','👑','🎅'],
  Tiere:['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐸','🐵','🦁','🐯','🐷','🐔','🦄','🐉','🦖','🐢','🦈'],
  Dinge:['🚀','🚗','✈️','🏠','🏰','🌳','🌵','🌈','☀️','🌙','⭐','⚡','🔥','💥','💣','🔑','💎','🍕'],
  Zeichen:['❗','❓','💬','💤','❤️','💔','✨','💢','💨','💦','🎵','🔔','👍','👎','👀','🙌','💪','🏆']
};
const CM_FONT='"Comic Sans MS","Chalkboard SE","Comic Neue",cursive,sans-serif';

/* ── Rechen-Logik (rein) ── */
/* Aufteilung der Seite in Bilder: Außenrand und Abstand zwischen den Bildern in Pixeln */
function cmLayout(id,W,H,margin,gutter){
  const L=CM_LAYOUTS[id]||CM_LAYOUTS['4'],iw=W-2*margin,ih=H-2*margin,g=gutter/2;
  return L.rects.map(([x,y,w,h])=>{
    let x0=margin+x*iw,y0=margin+y*ih,x1=margin+(x+w)*iw,y1=margin+(y+h)*ih;
    if(x>1e-9)x0+=g;if(y>1e-9)y0+=g;if(x+w<1-1e-9)x1-=g;if(y+h<1-1e-9)y1-=g;
    return {x:x0,y:y0,w:x1-x0,h:y1-y0};
  });
}
function cmPanelAt(panels,x,y){for(let i=panels.length-1;i>=0;i--){const p=panels[i];if(x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h)return i;}return -1;}
/* Textumbruch: measure(text) liefert die Breite in Pixeln; lange Wörter werden gebrochen */
function cmWrap(text,maxW,measure){
  const out=[];
  String(text).split('\n').forEach(par=>{
    let line='';
    par.split(/\s+/).filter(w=>w.length).forEach(word=>{
      let w=word;
      while(measure(w)>maxW&&w.length>1){let k=w.length-1;while(k>1&&measure(w.slice(0,k))>maxW)k--;if(line){out.push(line);line='';}out.push(w.slice(0,k));w=w.slice(k);}
      const t=line?line+' '+w:w;
      if(measure(t)<=maxW||!line)line=t;else{out.push(line);line=w;}
    });
    out.push(line);
  });
  return out;
}
/* Schwanz einer Sprechblase: Dreieck mit der Spitze beim Ziel (tx,ty) und der Basis auf dem Rand der Blase (Ellipse, Richtung zum Ziel) */
function cmTail(b){
  const cx=b.x+b.w/2,cy=b.y+b.h/2,rx=b.w/2,ry=b.h/2;
  let dx=b.tx-cx,dy=b.ty-cy;if(Math.abs(dx)<1e-6&&Math.abs(dy)<1e-6)dy=1;
  const d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;
  const k=1/Math.sqrt((ux*ux)/(rx*rx)+(uy*uy)/(ry*ry));   // Abstand vom Mittelpunkt zum Ellipsenrand in dieser Richtung
  const bx=cx+ux*k*0.9,by=cy+uy*k*0.9,half=Math.max(6,Math.min(rx,ry)*0.28);
  return [[bx-uy*half,by+ux*half],[bx+uy*half,by-ux*half],[b.tx,b.ty]];
}
function cmBBox(it){
  if(it.t==='emoji')return {x:it.x-it.s/2,y:it.y-it.s/2,w:it.s,h:it.s};
  if(it.t==='bubble')return {x:it.x,y:it.y,w:it.w,h:it.h};
  return {x:it.x,y:it.y,w:it.w||it.s*Math.max(2,String(it.text).length*0.6),h:it.h||it.s*1.3};
}
function cmItemAt(items,x,y){
  for(let i=items.length-1;i>=0;i--){const b=cmBBox(items[i]);if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return i;}
  return -1;
}
/* Reihenfolge ändern (0 = ganz hinten): gibt die neue Position zurück */
function cmReorder(items,i,mode){
  if(i<0||i>=items.length)return i;
  const [it]=items.splice(i,1);let j=i;
  if(mode==='front')j=items.length;else if(mode==='back')j=0;else if(mode==='up')j=Math.min(items.length,i+1);else if(mode==='down')j=Math.max(0,i-1);
  items.splice(j,0,it);return j;
}
const CM_CLAMP=(v,a,b)=>Math.max(a,Math.min(b,v));
function cmNewComic(){return {v:1,name:'Mein Comic',layout:'4',panels:Array.from({length:4},(_,i)=>({bg:['sky','city','room','space'][i],color:'#fff3b0'})),items:[]};}
/* Comic prüfen: Müll, falsche Typen, Zahlen außerhalb, zu viele Teile */
function cmSanitize(o){
  const c=cmNewComic();if(!o||typeof o!=='object')return c;
  c.name=String(o.name||'Mein Comic').slice(0,40);c.layout=CM_LAYOUTS[o.layout]?o.layout:'4';
  const n=CM_LAYOUTS[c.layout].rects.length;
  c.panels=Array.from({length:n},(_,i)=>{const p=Array.isArray(o.panels)&&o.panels[i]||{};return {bg:CM_BG[p.bg]?p.bg:'plain',color:/^#[0-9a-fA-F]{6}$/.test(p.color)?p.color:'#fff3b0'};});
  const num=(v,d)=>isNaN(+v)?d:+v;
  c.items=(Array.isArray(o.items)?o.items:[]).slice(0,CM_MAXITEMS).map(it=>{
    if(!it||typeof it!=='object')return null;
    const base={x:CM_CLAMP(num(it.x,100),-200,CM_W+200),y:CM_CLAMP(num(it.y,100),-200,CM_H+200),p:CM_CLAMP(Math.round(num(it.p,0)),0,n-1)};
    if(it.t==='emoji')return Object.assign(base,{t:'emoji',e:String(it.e||'😀').slice(0,8),s:CM_CLAMP(num(it.s,80),16,400),flip:!!it.flip});
    if(it.t==='bubble')return Object.assign(base,{t:'bubble',kind:CM_BUBBLES[it.kind]?it.kind:'say',text:String(it.text||'').slice(0,200),w:CM_CLAMP(num(it.w,160),50,500),h:CM_CLAMP(num(it.h,80),30,400),tx:CM_CLAMP(num(it.tx,base.x),-200,CM_W+200),ty:CM_CLAMP(num(it.ty,base.y+120),-200,CM_H+200),fs:CM_CLAMP(num(it.fs,16),8,60)});
    if(it.t==='text')return Object.assign(base,{t:'text',text:String(it.text||'').slice(0,200),s:CM_CLAMP(num(it.s,28),8,120),color:/^#[0-9a-fA-F]{6}$/.test(it.color)?it.color:'#111111',w:0,h:0});
    return null;
  }).filter(Boolean);
  return c;
}
/* Verlauf mit Momentaufnahmen (JSON) */
function cmHistNew(){return {undo:[],redo:[]};}
function cmHistPush(h,c){const sn=JSON.stringify(c);if(h.undo.length&&h.undo[h.undo.length-1]===sn)return false;h.undo.push(sn);if(h.undo.length>CM_HIST)h.undo.shift();h.redo=[];return true;}
function cmHistUndo(h,c){if(!h.undo.length)return null;h.redo.push(JSON.stringify(c));return cmSanitize(JSON.parse(h.undo.pop()));}
function cmHistRedo(h,c){if(!h.redo.length)return null;h.undo.push(JSON.stringify(c));return cmSanitize(JSON.parse(h.redo.pop()));}
/* Speicher je Konto */
function cmAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function cmAll(){try{const o=JSON.parse(localStorage.getItem(CM_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function cmSaved(){const a=cmAll()[cmAccount().toLowerCase()||'_gast'];const out={};if(a&&a.comics&&typeof a.comics==='object')Object.keys(a.comics).slice(0,CM_MAXSAVED).forEach(k=>{out[k.slice(0,40)]=cmSanitize(a.comics[k]);});return out;}
function cmSave(name,comic){
  name=String(name||'').trim().slice(0,40);if(!name)return 'name';
  const all=cmAll(),key=cmAccount().toLowerCase()||'_gast',cs=cmSaved();
  if(!(name in cs)&&Object.keys(cs).length>=CM_MAXSAVED)return 'voll';
  const c=cmSanitize(comic);c.name=name;cs[name]=c;all[key]={comics:cs};
  try{localStorage.setItem(CM_KEY,JSON.stringify(all));}catch(e){return 'speicher';}return 'ok';
}

/* ── Zeichnen ── */
function cmRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function cmDrawBg(ctx,P,panel,idx){
  const {x,y,w,h}=P,r=cmRng(idx*7919+13);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  const grad=(c0,c1)=>{const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,c0);g.addColorStop(1,c1);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);};
  const bg=panel.bg;
  if(bg==='sky'){grad('#5aa9ff','#cfe9ff');ctx.fillStyle='rgba(255,255,255,.9)';for(let i=0;i<4;i++){const cx=x+r()*w,cy=y+h*0.1+r()*h*0.35,s=18+r()*22;[[0,0,1],[s*.9,s*.15,.8],[-s*.9,s*.2,.75]].forEach(([dx,dy,k])=>{ctx.beginPath();ctx.arc(cx+dx,cy+dy,s*k,0,Math.PI*2);ctx.fill();});}}
  else if(bg==='city'){grad('#ff9e7a','#5d3a6e');ctx.fillStyle='#2a2342';let bx=x;while(bx<x+w){const bw=22+r()*34,bh=h*(0.25+r()*0.4);ctx.fillRect(bx,y+h-bh,bw,bh);ctx.fillStyle='#ffd54f';for(let wy=y+h-bh+8;wy<y+h-8;wy+=14)for(let wx=bx+5;wx<bx+bw-6;wx+=11)if(r()<0.5)ctx.fillRect(wx,wy,5,7);ctx.fillStyle='#2a2342';bx+=bw+2;}}
  else if(bg==='room'){ctx.fillStyle='#f4d8a8';ctx.fillRect(x,y,w,h);ctx.fillStyle='#b5835a';ctx.fillRect(x,y+h*0.72,w,h*0.28);ctx.fillStyle='#8fd1ff';ctx.fillRect(x+w*0.15,y+h*0.12,w*0.28,h*0.3);ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(x+w*0.15,y+h*0.12,w*0.28,h*0.3);ctx.beginPath();ctx.moveTo(x+w*0.29,y+h*0.12);ctx.lineTo(x+w*0.29,y+h*0.42);ctx.stroke();}
  else if(bg==='space'){grad('#0b0b2a','#2a1b5c');for(let i=0;i<Math.max(20,w*h/1800);i++){ctx.fillStyle='rgba(255,255,255,'+(0.4+r()*0.6)+')';const s=r()<0.1?2.2:1.2;ctx.fillRect(x+r()*w,y+r()*h,s,s);}ctx.fillStyle='#c97b3a';ctx.beginPath();ctx.arc(x+w*(0.7+r()*0.2),y+h*0.25,Math.min(w,h)*0.12,0,Math.PI*2);ctx.fill();}
  else if(bg==='grass'){grad('#7ec8ff','#e6f6ff');ctx.fillStyle='#5cb85c';ctx.beginPath();ctx.ellipse(x+w*0.3,y+h*1.05,w*0.7,h*0.35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4aa34a';ctx.beginPath();ctx.ellipse(x+w*0.85,y+h*1.1,w*0.6,h*0.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffee58';ctx.beginPath();ctx.arc(x+w*0.85,y+h*0.18,Math.min(w,h)*0.09,0,Math.PI*2);ctx.fill();}
  else if(bg==='sea'){grad('#9bd8ff','#0a74c9');ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;for(let k=0;k<6;k++){const yy=y+h*(0.45+k*0.09);ctx.beginPath();for(let xx=x;xx<=x+w;xx+=6)ctx.lineTo(xx,yy+Math.sin((xx+k*30)/12)*3);ctx.stroke();}}
  else if(bg==='manga'){ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#222';ctx.lineWidth=1.4;const cx=x+w/2,cy=y+h/2,n=70;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r()*0.05,r0=Math.min(w,h)*(0.18+r()*0.1),r1=Math.hypot(w,h);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.stroke();}}
  else{ctx.fillStyle=panel.color||'#fff3b0';ctx.fillRect(x,y,w,h);}
  ctx.restore();
}
function cmDrawBubble(ctx,b,measure){
  const cx=b.x+b.w/2,cy=b.y+b.h/2,rx=b.w/2,ry=b.h/2;
  ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.lineJoin='round';
  if(b.kind==='box'){ctx.fillStyle='#fff7c2';ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();ctx.stroke();}
  else if(b.kind==='shout'){
    const n=16;ctx.beginPath();for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2,k=i%2?0.78:1.08;ctx.lineTo(cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k);}ctx.closePath();ctx.fillStyle='#ffe566';ctx.fill();ctx.stroke();
  }else{
    const tail=cmTail(b);
    if(b.kind==='think'){
      ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      const [p1,p2,tip]=tail,bx=(p1[0]+p2[0])/2,by=(p1[1]+p2[1])/2;
      [[0.25,9],[0.6,6],[0.92,4]].forEach(([t,rad])=>{ctx.beginPath();ctx.arc(bx+(tip[0]-bx)*t,by+(tip[1]-by)*t,rad,0,Math.PI*2);ctx.fill();ctx.stroke();});
    }else{
      ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(tail[0][0],tail[0][1]);ctx.lineTo(tail[2][0],tail[2][1]);ctx.lineTo(tail[1][0],tail[1][1]);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(cx,cy,rx-1.5,ry-1.5,0,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();   // Naht zwischen Schwanz und Blase überdecken
    }
  }
  ctx.fillStyle='#111';ctx.font=b.fs+'px '+CM_FONT;ctx.textAlign='center';ctx.textBaseline='middle';
  const lines=cmWrap(b.text,b.w*(b.kind==='box'?0.92:0.74),measure(ctx,b.fs)),lh=b.fs*1.2,y0=cy-(lines.length-1)*lh/2;
  lines.forEach((l,i)=>ctx.fillText(l,cx,y0+i*lh));
  ctx.restore();
}
function cmMeasurer(ctx,fs){return s=>{ctx.font=fs+'px '+CM_FONT;return ctx.measureText(s).width;};}
function cmDrawAll(ctx,c,panels,sel,opts){
  ctx.clearRect(0,0,CM_W,CM_H);ctx.fillStyle='#fff';ctx.fillRect(0,0,CM_W,CM_H);
  panels.forEach((P,i)=>{cmDrawBg(ctx,P,c.panels[i],i);});
  c.items.forEach(it=>{
    ctx.save();
    if(it.t!=='bubble'){const P=panels[Math.min(it.p,panels.length-1)];if(P){ctx.beginPath();ctx.rect(P.x,P.y,P.w,P.h);ctx.clip();}}
    if(it.t==='emoji'){ctx.font=it.s*0.85+'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.translate(it.x,it.y);if(it.flip)ctx.scale(-1,1);ctx.fillText(it.e,0,it.s*0.05);}
    else if(it.t==='bubble')cmDrawBubble(ctx,it,cmMeasurer);
    else{ctx.font='bold '+it.s+'px '+CM_FONT;ctx.textBaseline='top';ctx.textAlign='left';ctx.lineWidth=Math.max(3,it.s/6);ctx.strokeStyle='#fff';ctx.lineJoin='round';const lines=String(it.text).split('\n');lines.forEach((l,k)=>{ctx.strokeText(l,it.x,it.y+k*it.s*1.2);ctx.fillStyle=it.color;ctx.fillText(l,it.x,it.y+k*it.s*1.2);});
      it.w=Math.max(...lines.map(l=>ctx.measureText(l).width),it.s);it.h=lines.length*it.s*1.2;}
    ctx.restore();
  });
  panels.forEach((P,i)=>{ctx.strokeStyle='#111';ctx.lineWidth=5;ctx.strokeRect(P.x,P.y,P.w,P.h);});
  if(opts&&opts.panelSel>=0&&panels[opts.panelSel]&&!sel){const P=panels[opts.panelSel];ctx.save();ctx.strokeStyle='#42a5f5';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.strokeRect(P.x+4,P.y+4,P.w-8,P.h-8);ctx.restore();}
  if(sel){
    const b=cmBBox(sel);ctx.save();ctx.strokeStyle='#42a5f5';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(b.x-3,b.y-3,b.w+6,b.h+6);ctx.setLineDash([]);
    ctx.fillStyle='#42a5f5';ctx.fillRect(b.x+b.w-4,b.y+b.h-4,12,12);
    if(sel.t==='bubble'&&sel.kind!=='box'){ctx.beginPath();ctx.arc(sel.tx,sel.ty,7,0,Math.PI*2);ctx.fillStyle='#ff7043';ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();}
    ctx.restore();
  }
}

/* ── Oberfläche ── */
const cm={c:null,hist:cmHistNew(),sel:-1,panel:0,drag:null,msg:'',emojiCat:'Gesichter',ctx:null};
function cmActive(){const s=document.getElementById('screen-comic');return !!s&&s.classList.contains('active');}
function cmPanels(){return cmLayout(cm.c.layout,CM_W,CM_H,16,12);}
function cmInit(){if(!cm.c)cm.c=cmNewComic();cmRender();}
function cmCommit(){cmHistPush(cm.hist,cm.c);cmUpdateHist();}
function cmUpdateHist(){const u=document.getElementById('cm-undo'),r=document.getElementById('cm-redo');if(u)u.style.opacity=cm.hist.undo.length?1:0.35;if(r)r.style.opacity=cm.hist.redo.length?1:0.35;}
function cmUndo(){const r=cmHistUndo(cm.hist,cm.c);if(r){cm.c=r;cm.sel=-1;cmRender();}}
function cmRedo(){const r=cmHistRedo(cm.hist,cm.c);if(r){cm.c=r;cm.sel=-1;cmRender();}}
function cmCtx(){const cv=document.getElementById('cm-canvas');return cv?cv.getContext('2d'):null;}
function cmDraw(){const x=cmCtx();if(!x)return;cmDrawAll(x,cm.c,cmPanels(),cm.sel>=0?cm.c.items[cm.sel]:null,{panelSel:cm.panel});}
function cmPos(e){const cv=document.getElementById('cm-canvas'),r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*CM_W,y:(e.clientY-r.top)/r.height*CM_H};}
function cmDown(e){
  e.preventDefault();const p=cmPos(e),panels=cmPanels();
  try{e.target.setPointerCapture(e.pointerId);}catch(_){}
  const sel=cm.sel>=0?cm.c.items[cm.sel]:null;
  if(sel){
    const b=cmBBox(sel);
    if(Math.abs(p.x-(b.x+b.w))<=14&&Math.abs(p.y-(b.y+b.h))<=14){cmCommit();cm.drag={mode:'resize',it:sel,x0:p.x,y0:p.y,w0:b.w,h0:b.h,s0:sel.s,fs0:sel.fs};return;}
    if(sel.t==='bubble'&&sel.kind!=='box'&&Math.hypot(p.x-sel.tx,p.y-sel.ty)<=14){cmCommit();cm.drag={mode:'tail',it:sel};return;}
  }
  const i=cmItemAt(cm.c.items,p.x,p.y);
  if(i>=0){cm.sel=i;cm.panel=cm.c.items[i].p;cmCommit();const it=cm.c.items[i];cm.drag={mode:'move',it,dx:p.x-it.x,dy:p.y-it.y,tx:it.tx,ty:it.ty,x0:it.x,y0:it.y};cmRefreshTop();cmDraw();cmUpdateProps();return;}
  cm.sel=-1;const pi=cmPanelAt(panels,p.x,p.y);if(pi>=0)cm.panel=pi;cmRefreshTop();cmDraw();cmUpdateProps();
}
function cmMove(e){
  const d=cm.drag;if(!d)return;const p=cmPos(e),it=d.it;
  if(d.mode==='move'){const nx=p.x-d.dx,ny=p.y-d.dy;it.x=nx;it.y=ny;if(it.t==='bubble'){it.tx=d.tx+(nx-d.x0);it.ty=d.ty+(ny-d.y0);}const P=cmPanelAt(cmPanels(),p.x,p.y);if(P>=0&&it.t!=='bubble')it.p=P;}
  else if(d.mode==='tail'){it.tx=p.x;it.ty=p.y;}
  else if(d.mode==='resize'){
    const dx=p.x-d.x0,dy=p.y-d.y0;
    if(it.t==='emoji')it.s=CM_CLAMP(d.s0+Math.max(dx,dy)*(it.t==='emoji'?2:1),16,400);
    else if(it.t==='bubble'){it.w=CM_CLAMP(d.w0+dx,50,500);it.h=CM_CLAMP(d.h0+dy,30,400);}
    else it.s=CM_CLAMP(d.s0+Math.max(dx,dy)*0.5,8,120);
  }
  cmDraw();cmUpdateProps();
}
document.addEventListener('pointerup',()=>{if(cm.drag){cm.drag=null;cmDraw();}});
function cmSetLayout(id){cmCommit();cm.c=cmSanitize(Object.assign({},cm.c,{layout:id,panels:cm.c.panels}));cm.panel=Math.min(cm.panel,cm.c.panels.length-1);cm.sel=-1;cmRender();}
function cmSetBg(bg){cmCommit();cm.c.panels[cm.panel].bg=bg;cmRender(true);}
function cmSetColor(c){cm.c.panels[cm.panel].color=c;cm.c.panels[cm.panel].bg='plain';cmDraw();}
function cmAddEmoji(e){
  if(cm.c.items.length>=CM_MAXITEMS){cm.msg='Mehr als 60 Teile passen nicht auf eine Seite.';cmMsg();return;}
  cmCommit();const P=cmPanels()[cm.panel];cm.c.items.push({t:'emoji',e,s:Math.min(110,Math.max(40,Math.min(P.w,P.h)*0.4)),flip:false,x:P.x+P.w/2,y:P.y+P.h*0.62,p:cm.panel});
  cm.sel=cm.c.items.length-1;cmRender(true);
}
function cmAddBubble(kind){
  if(cm.c.items.length>=CM_MAXITEMS){cm.msg='Mehr als 60 Teile passen nicht auf eine Seite.';cmMsg();return;}
  cmCommit();const P=cmPanels()[cm.panel],w=Math.min(200,P.w*0.7),h=kind==='box'?44:Math.min(90,P.h*0.3);
  const x=P.x+Math.max(6,P.w*0.08),y=P.y+8;
  cm.c.items.push({t:'bubble',kind,text:kind==='shout'?'AAAH!':kind==='think'?'Hmm …':kind==='box'?'Später …':'Hallo!',x,y,w,h,tx:x+w*0.5,ty:y+h+Math.min(60,P.h*0.25),fs:16,p:cm.panel});
  cm.sel=cm.c.items.length-1;cmRender(true);
}
function cmAddText(){
  if(cm.c.items.length>=CM_MAXITEMS)return;cmCommit();const P=cmPanels()[cm.panel];
  cm.c.items.push({t:'text',text:'BUMM!',x:P.x+20,y:P.y+P.h*0.4,s:42,color:'#e53935',w:0,h:0,p:cm.panel});cm.sel=cm.c.items.length-1;cmRender(true);
}
function cmProp(k,v){
  const it=cm.c.items[cm.sel];if(!it)return;
  if(k==='text'){it.text=String(v).slice(0,200);}
  else if(k==='size'){if(it.t==='bubble')it.fs=CM_CLAMP(+v,8,60);else it.s=CM_CLAMP(+v,8,400);}
  else if(k==='color')it.color=v;
  else if(k==='kind'&&CM_BUBBLES[v])it.kind=v;
  else if(k==='flip')it.flip=!it.flip;
  cmDraw();
}
function cmPropStart(){cmCommit();}
function cmOrder(mode){if(cm.sel<0)return;cmCommit();cm.sel=cmReorder(cm.c.items,cm.sel,mode);cmDraw();}
function cmDup(){const it=cm.c.items[cm.sel];if(!it||cm.c.items.length>=CM_MAXITEMS)return;cmCommit();const n=JSON.parse(JSON.stringify(it));n.x+=24;n.y+=24;if(n.tx!==undefined){n.tx+=24;n.ty+=24;}cm.c.items.push(n);cm.sel=cm.c.items.length-1;cmRender(true);}
function cmDelete(){if(cm.sel<0)return;cmCommit();cm.c.items.splice(cm.sel,1);cm.sel=-1;cmRender(true);}
function cmNew(){cmCommit();cm.c=cmNewComic();cm.sel=-1;cm.panel=0;cmRender();}
function cmSaveClick(){
  const n=(document.getElementById('cm-name')||{}).value||cm.c.name;cm.c.name=String(n).trim().slice(0,40)||'Mein Comic';
  const r=cmSave(cm.c.name,cm.c);cm.msg=r==='ok'?'Gespeichert: '+cm.c.name:r==='voll'?'Es sind schon 10 Comics gespeichert – lösche erst einen.':r==='speicher'?'Der Browser-Speicher ist voll. Exportiere den Comic als PNG.':'Bitte einen Namen eingeben.';
  cmRender(true);
}
function cmLoad(name){const c=cmSaved()[name];if(c){cmCommit();cm.c=c;cm.sel=-1;cm.panel=0;cmRender();}}
function cmDel(name){if(cmRemove(name)){cm.msg='Gelöscht: '+name;cmRender(true);}}
function cmRemove(name){const all=cmAll(),key=cmAccount().toLowerCase()||'_gast',cs=cmSaved();if(!(name in cs))return false;delete cs[name];all[key]={comics:cs};try{localStorage.setItem(CM_KEY,JSON.stringify(all));}catch(e){return false;}return true;}
function cmExport(){
  const c=document.createElement('canvas');c.width=CM_W*2;c.height=CM_H*2;const x=c.getContext('2d');x.scale(2,2);
  cmDrawAll(x,cm.c,cmPanels(),null,null);
  const a=document.createElement('a');a.href=c.toDataURL('image/png');a.download=(cm.c.name||'comic').replace(/[^\wäöüÄÖÜß -]/g,'_')+'.png';document.body.appendChild(a);a.click();a.remove();
  cm.msg='PNG-Datei erstellt.';cmMsg();
}
function cmMsg(){const el=document.getElementById('cm-msg');if(el)el.textContent=cm.msg||'';}
function cmEmojiCat(c){cm.emojiCat=c;cmRender(true);}
function cmUpdateProps(){
  const el=document.getElementById('cm-props');if(!el)return;const it=cm.sel>=0?cm.c.items[cm.sel]:null;const esc=typeof escHtml==='function'?escHtml:(x=>x);
  if(!it){el.innerHTML='<span style="color:var(--text-3);font-size:12px">Klicke ein Teil an, um es zu bearbeiten – oder ein leeres Bild, um es für Hintergrund und neue Teile zu wählen.</span>';return;}
  const size=it.t==='bubble'?it.fs:it.s,max=it.t==='emoji'?300:it.t==='bubble'?40:100;
  el.innerHTML=`${it.t!=='emoji'?`<textarea rows="2" onfocus="cmPropStart()" oninput="cmProp('text',this.value)" style="width:100%;padding:6px;border-radius:8px;border:1px solid var(--divider);background:transparent;color:var(--text);font-family:inherit;font-size:13px;margin-bottom:6px">${esc(it.text)}</textarea>`:''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px">
    <label>Größe <input type="range" min="${it.t==='emoji'?16:8}" max="${max}" value="${size}" onpointerdown="cmPropStart()" oninput="cmProp('size',this.value)" style="width:100px;vertical-align:middle"></label>
    ${it.t==='bubble'?`<select onchange="cmPropStart();cmProp('kind',this.value)">${Object.keys(CM_BUBBLES).map(k=>`<option value="${k}" ${k===it.kind?'selected':''}>${CM_BUBBLES[k]}</option>`).join('')}</select>`:''}
    ${it.t==='text'?`<input type="color" value="${it.color}" onpointerdown="cmPropStart()" oninput="cmProp('color',this.value)">`:''}
    ${it.t==='emoji'?`<button class="lrn-btn ghost" onclick="cmPropStart();cmProp('flip')">↔ Spiegeln</button>`:''}
    <button class="lrn-btn ghost" onclick="cmOrder('front')" title="Ganz nach vorn">⤒</button><button class="lrn-btn ghost" onclick="cmOrder('up')" title="Eine Ebene nach vorn">▲</button><button class="lrn-btn ghost" onclick="cmOrder('down')" title="Eine Ebene zurück">▼</button><button class="lrn-btn ghost" onclick="cmOrder('back')" title="Ganz nach hinten">⤓</button>
    <button class="lrn-btn ghost" onclick="cmDup()" title="Duplizieren">⧉</button><button class="lrn-btn ghost" onclick="cmDelete()" title="Löschen (Entf)" style="color:#e53935">🗑</button></div>`;
}
function cmTopHtml(){
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center;margin-bottom:8px;font-size:12px">
    <label>Seite <select onchange="cmSetLayout(this.value)">${Object.keys(CM_LAYOUTS).map(k=>`<option value="${k}" ${k===cm.c.layout?'selected':''}>${CM_LAYOUTS[k].name}</option>`).join('')}</select></label>
    <button class="lrn-btn ghost" id="cm-undo" onclick="cmUndo()" title="Rückgängig (Strg+Z)" style="opacity:${cm.hist.undo.length?1:0.35}">↶</button><button class="lrn-btn ghost" id="cm-redo" onclick="cmRedo()" title="Wiederholen (Strg+Y)" style="opacity:${cm.hist.redo.length?1:0.35}">↷</button>
    <span style="color:var(--text-3)">Bild ${cm.panel+1} gewählt:</span>${Object.keys(CM_BG).map(k=>`<button class="lrn-chip ${cm.c.panels[cm.panel]&&cm.c.panels[cm.panel].bg===k?'active':''}" onclick="cmSetBg('${k}')" style="padding:2px 9px">${CM_BG[k]}</button>`).join('')}
    <input type="color" value="${cm.c.panels[cm.panel]?cm.c.panels[cm.panel].color:'#fff3b0'}" onpointerdown="cmCommit()" oninput="cmSetColor(this.value)" title="Hintergrundfarbe"></div>`;
}
function cmRefreshTop(){const el=document.getElementById('cm-top');if(el)el.innerHTML=cmTopHtml();}
function cmRender(keep){
  const root=document.getElementById('cm-root');if(!root)return;const esc=typeof escHtml==='function'?escHtml:(x=>x);
  const names=Object.keys(cmSaved());
  root.innerHTML=`<div id="cm-top">${cmTopHtml()}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:8px">${Object.keys(CM_BUBBLES).map(k=>`<button class="lrn-btn ghost" onclick="cmAddBubble('${k}')">💬 ${CM_BUBBLES[k]}</button>`).join('')}<button class="lrn-btn ghost" onclick="cmAddText()">🅰 Text</button></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:4px">${Object.keys(CM_EMOJI).map(k=>`<button class="lrn-chip ${cm.emojiCat===k?'active':''}" onclick="cmEmojiCat('${k}')" style="padding:2px 9px">${k}</button>`).join('')}</div>
  <div style="display:flex;gap:2px;flex-wrap:wrap;justify-content:center;margin-bottom:10px">${CM_EMOJI[cm.emojiCat].map(e=>`<button onclick="cmAddEmoji('${e}')" style="font-size:24px;background:none;border:none;cursor:pointer;padding:2px 4px">${e}</button>`).join('')}</div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start">
    <canvas id="cm-canvas" width="${CM_W}" height="${CM_H}" style="width:100%;max-width:450px;height:auto;border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.4);background:#fff;touch-action:none;cursor:crosshair" onpointerdown="cmDown(event)" onpointermove="cmMove(event)"></canvas>
    <div style="flex:1 1 240px;max-width:360px"><div class="lrn-label" style="margin-bottom:6px">Auswahl</div><div id="cm-props"></div></div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:12px;font-size:12px">
    <input id="cm-name" value="${esc(cm.c.name)}" maxlength="40" style="padding:6px 10px;border-radius:8px;border:1px solid var(--divider);background:transparent;color:var(--text)">
    <button class="lrn-btn" onclick="cmSaveClick()">💾 Speichern</button><button class="lrn-btn ghost" onclick="cmExport()">⬇ Als PNG</button><button class="lrn-btn ghost" onclick="cmNew()">Neu</button></div>
  <div id="cm-msg" style="text-align:center;font-size:12px;color:var(--text-3);margin-top:6px;min-height:16px">${esc(cm.msg||'')}</div>
  ${names.length?`<div class="lrn-label" style="text-align:center;margin-top:8px">Deine Comics</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">${names.map(n=>`<span class="game-chip"><a href="#" onclick="cmLoad(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:inherit;text-decoration:none">📖 ${esc(n)}</a> <a href="#" onclick="cmDel(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:#e53935;text-decoration:none;margin-left:6px">✕</a></span>`).join('')}</div>`:''}
  <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:10px;line-height:1.5">Erst ein Bild anklicken (gestrichelter Rahmen), dann Hintergrund, Figuren und Blasen hinzufügen. Teile packst du zum Verschieben; das blaue Quadrat unten rechts ändert die Größe, der orange Punkt am Schwanz einer Blase zeigt auf den Sprecher. Entf löscht, Strg+Z macht rückgängig.</div>`;
  cmDraw();cmUpdateProps();
}
document.addEventListener('keydown',e=>{
  if(!cmActive()||/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))return;
  const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(mod&&k==='z'){e.preventDefault();if(e.shiftKey)cmRedo();else cmUndo();}
  else if(mod&&k==='y'){e.preventDefault();cmRedo();}
  else if(cm.sel>=0&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();cmDelete();}
});
