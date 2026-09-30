/* ══════════════════════════════════
   KARTEN-RÄTSEL – Weltkarte mit echten Ländergrenzen (Daten in geo-daten.js, Natural Earth 110m, offline).
   Vier Spielarten: „Land finden“ (Land wird genannt, du klickst es an, 3 Versuche mit Richtungs-Hinweis), „Entfernung“ (wie GeoGuessr:
   klick irgendwohin, Punkte nach Abstand zum Land),
   „Hauptstadt“ (zur Hauptstadt das Land finden) und „Land benennen“ (Land ist markiert, 4 Antworten).
   Auswahl nach Weltteil und Schwierigkeit, Zoom (Rad/Knöpfe) und Verschieben (Ziehen). Bestwerte: zf_georaetsel
══════════════════════════════════ */
const GEO_KEY='zf_georaetsel';
const GEO_ROUNDS=10;
const GEO_W=800,GEO_H=480;
const GEO_MODES={find:{name:'📍 Land finden',desc:'Land wird genannt – klick es an'},guess:{name:'🎯 Entfernung',desc:'Klick irgendwohin (auch aufs Meer) – je näher am Land, desto mehr Punkte, wie bei GeoGuessr'},capital:{name:'🏛 Hauptstadt',desc:'Zur Hauptstadt das Land finden'},name:{name:'🔤 Land benennen',desc:'Land ist markiert – wähle den Namen'}};
const GEO_REGIONS={welt:{name:'🌍 Welt',box:[-180,180,84,-58]},Europa:{name:'Europa',box:[-25,50,72,33]},Asien:{name:'Asien',box:[25,150,58,-12]},Afrika:{name:'Afrika',box:[-20,55,38,-36]},
  Nordamerika:{name:'Nordamerika',box:[-170,-50,75,6]},Südamerika:{name:'Südamerika',box:[-85,-32,14,-57]},Ozeanien:{name:'Ozeanien',box:[110,180,2,-48]}};
const GEO_LEVELS={leicht:{name:'Leicht (bekannte Länder)'},alle:{name:'Alle Länder'}};
const GEO_EXTRA_EASY=['Norwegen','Finnland','Griechenland','Irland','Österreich','Schweiz','Portugal','Niederlande','Dänemark','Island','Kuba','Neuseeland','Chile','Kenia','Marokko','Algerien','Ägypten','Peru','Schweden','Kolumbien','Kanada'];
const GEO_COLORS=['#dfe8b8','#f1e2b5','#d5e8c8','#f0d5c0','#d8dfef','#e6d5ea'];

/* ── Daten entschlüsseln: Ringe als [Länge×10, Breite×10]-Punkte, Schwerpunkt, Umrissrahmen ── */
const GEO_LAND=GEO_DATA.map((d,idx)=>{
  const rings=d.r.map(flat=>{const pts=[];let x=0,y=0;for(let i=0;i<flat.length;i+=2){x+=flat[i];y+=flat[i+1];pts.push([x,y]);}return pts;});
  let best=null,bestA=-1,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  rings.forEach(r=>{let a=0,cx=0,cy=0;for(let i=0;i<r.length;i++){const p=r[i],q=r[(i+1)%r.length];a+=p[0]*q[1]-q[0]*p[1];r[i][0]<x0&&(x0=r[i][0]);r[i][0]>x1&&(x1=r[i][0]);r[i][1]<y0&&(y0=r[i][1]);r[i][1]>y1&&(y1=r[i][1]);}
    a=Math.abs(a/2);if(a>bestA){bestA=a;best=r;}});
  const mx=best.reduce((s,p)=>s+p[0],0)/best.length,my=best.reduce((s,p)=>s+p[1],0)/best.length;
  return {id:idx,name:d.n,iso:d.i,cont:d.k,pop:d.p,capital:d.c,rings,bbox:[x0,y0,x1,y1],lat:my/10,lon:mx/10,
    easy:d.p>=15||GEO_EXTRA_EASY.includes(d.n),color:GEO_COLORS[(idx*5+(idx>>2))%GEO_COLORS.length]};
});

/* ── Rechnen ── */
function geoDist(lat1,lon1,lat2,lon2){
  const R=6371,rad=Math.PI/180,dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(a)));
}
function geoBearingWord(lat1,lon1,lat2,lon2){
  const rad=Math.PI/180,dL=(lon2-lon1)*rad;
  const y=Math.sin(dL)*Math.cos(lat2*rad),x=Math.cos(lat1*rad)*Math.sin(lat2*rad)-Math.sin(lat1*rad)*Math.cos(lat2*rad)*Math.cos(dL);
  const b=(Math.atan2(y,x)/rad+360)%360;
  return ['Norden','Nordosten','Osten','Südosten','Süden','Südwesten','Westen','Nordwesten'][Math.round(b/45)%8];
}
/* Punkt (Breite, Länge in Grad) liegt in welchem Land? -1 = Wasser. Löcher zählen über „gerade/ungerade“ mit. */
function geoHit(lat,lon){
  const x=lon*10,y=lat*10;
  for(const c of GEO_LAND){
    const b=c.bbox;if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;
    let inside=false;
    for(const r of c.rings){
      for(let i=0,j=r.length-1;i<r.length;j=i++){
        const a=r[i],p=r[j];
        if((a[1]>y)!==(p[1]>y)&&x<(p[0]-a[0])*(y-a[1])/(p[1]-a[1])+a[0])inside=!inside;
      }
    }
    if(inside)return c.id;
  }
  return -1;
}
/* Abstand und Richtung vom Klick zum nächsten Randpunkt des gesuchten Landes */
function geoHint(lat,lon,target){
  let best=1e9,bl=0,bo=0;
  target.rings.forEach(r=>{for(let i=0;i<r.length;i++){const la=r[i][1]/10,lo=r[i][0]/10,d=geoDist(lat,lon,la,lo);if(d<best){best=d;bl=la;bo=lo;}}});
  return {km:Math.round(best/10)*10,dir:geoBearingWord(lat,lon,bl,bo),lat:bl,lon:bo};
}
/* Entfernungs-Modus: im Land = 0 km, sonst Abstand zum nächsten Randpunkt; 1000 Punkte bei 0 km, dann immer weniger (wie bei GeoGuessr) */
function geoGuessKm(lat,lon,target){return geoHit(lat,lon)===target.id?0:geoHint(lat,lon,target).km;}
function geoGuessPoints(km){return Math.round(1000*Math.exp(-km/1500));}
function geoScoreTry(tries){return tries===1?3:tries===2?2:tries===3?1:0;}
function geoPool(region,level,mode){
  const base=GEO_LAND.filter(c=>(region==='welt'||c.cont===region)&&(mode!=='capital'||c.capital));
  const easy=base.filter(c=>c.easy);
  return level==='alle'||easy.length<GEO_ROUNDS?base:easy;   // zu wenige bekannte Länder in diesem Weltteil: alle nehmen
}
function geoShuffle(a,rnd){a=a.slice();rnd=rnd||Math.random;for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function geoPickCountries(region,level,mode,n,rnd){return geoShuffle(geoPool(region,level,mode),rnd).slice(0,n);}
function geoOptions(target,region,level,rnd){
  const pool=geoPool(region,'alle','name').filter(c=>c.id!==target.id);
  const near=geoShuffle(pool.filter(c=>c.cont===target.cont),rnd),rest=geoShuffle(pool,rnd);
  const wrong=[];near.concat(rest).forEach(c=>{if(wrong.length<3&&!wrong.some(w=>w.id===c.id))wrong.push(c);});
  return geoShuffle([target].concat(wrong),rnd);
}
function geoKey(g){return g.mode+'|'+g.region+'|'+g.level;}
function geoLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(GEO_KEY)||'null');}catch(e){}if(!d||typeof d!=='object')d={};d.best=d.best&&typeof d.best==='object'?d.best:{};return d;}
function geoSave(d){try{localStorage.setItem(GEO_KEY,JSON.stringify(d));}catch(e){}}

/* ── Ansicht (Zoom und Verschieben) ── */
const geoWX=lon=>lon*10+1800,geoWY=lat=>900-lat*10;
let geoV={x0:0,y0:0,z:0.2};
function geoFit(box,pad){
  const ww=(box[1]-box[0])*10*(pad||1),hh=(box[2]-box[3])*10*(pad||1);
  const z=Math.min(GEO_W/ww,GEO_H/hh,4),cx=geoWX((box[0]+box[1])/2),cy=geoWY((box[2]+box[3])/2);
  geoV={z,x0:cx-GEO_W/(2*z),y0:cy-GEO_H/(2*z)};
}
function geoFitCountry(c){
  const b=c.bbox,lo0=b[0]/10,lo1=b[2]/10,la0=b[1]/10,la1=b[3]/10;
  const w=Math.max(lo1-lo0,14),h=Math.max(la1-la0,8.4),cx=(lo0+lo1)/2,cy=(la0+la1)/2;
  geoFit([cx-w/2,cx+w/2,cy+h/2,cy-h/2],1.6);
}
/* Bildschirmpunkt (Canvas-Pixel) → [Breite, Länge] in Grad, passend zur aktuellen Ansicht */
function geoScreenToLatLon(x,y){return [(900-(geoV.y0+y/geoV.z))/10,(geoV.x0+x/geoV.z-1800)/10];}
function geoLatLonToScreen(lat,lon){return [(geoWX(lon)-geoV.x0)*geoV.z,(geoWY(lat)-geoV.y0)*geoV.z];}
function geoFitPair(lat,lon,c){
  const b=c.bbox,lo0=Math.min(lon,b[0]/10),lo1=Math.max(lon,b[2]/10),la0=Math.min(lat,b[1]/10),la1=Math.max(lat,b[3]/10);
  const w=Math.max(lo1-lo0,20),h=Math.max(la1-la0,12),cx=(lo0+lo1)/2,cy=(la0+la1)/2;
  geoFit([cx-w/2,cx+w/2,cy+h/2,cy-h/2],1.5);
}
function geoZoomAt(f,px,py){
  const zMin=GEO_W/3600,z=Math.max(zMin,Math.min(4,geoV.z*f));
  const wx=geoV.x0+px/geoV.z,wy=geoV.y0+py/geoV.z;
  geoV={z,x0:wx-px/z,y0:wy-py/z};geoDraw();
}
function geoZoom(f){geoZoomAt(f,GEO_W/2,GEO_H/2);}
function geoResetView(){geoFit(GEO_REGIONS[geo?geo.region:'welt'].box);geoDraw();}

/* ── Oberfläche ── */
let geo=null,geoSetup={mode:'find',region:'welt',level:'leicht'},geoData=null,geoPaths=null,geoDrag=null;
function geoInit(){geoData=geoLoad();geo=null;geoRender();}
function geoSet(k,v){geoSetup[k]=v;geoRender();}
function geoStart(){
  const s=geoSetup,list=geoPickCountries(s.region,s.level,s.mode,GEO_ROUNDS);
  if(!list.length)return;
  geo={mode:s.mode,region:s.region,level:s.level,list,n:list.length,i:0,score:0,tries:0,wrong:[],found:false,done:false,msg:'',opts:null,answered:-1};
  geoNewQuestion();geoRender();
}
function geoNewQuestion(){
  const t=geo.list[geo.i];geo.tries=0;geo.wrong=[];geo.found=false;geo.msg='';geo.answered=-1;geo.pin=null;
  geo.opts=geo.mode==='name'?geoOptions(t,geo.region,geo.level):null;
  if(geo.mode==='name')geoFitCountry(t);else geoFit(GEO_REGIONS[geo.region].box);
}
function geoRender(){
  const root=document.getElementById('geo-root');if(!root)return;
  const d=geoData||geoLoad();
  if(!geo){
    const s=geoSetup,best=d.best[s.mode+'|'+s.region+'|'+s.level],chips=(k,obj)=>Object.keys(obj).map(x=>`<button type="button" class="lrn-chip ${s[k]===x?'active':''}" onclick="geoSet('${k}','${x}')">${obj[x].name}</button>`).join('');
    const n=Math.min(GEO_ROUNDS,geoPool(s.region,s.level,s.mode).length),max=s.mode==='name'?n:s.mode==='guess'?n*1000:n*3;
    root.innerHTML=`<div class="lrn-card"><div class="lrn-label">Spielart</div><div class="lrn-chips">${chips('mode',GEO_MODES)}</div>
      <div style="font-size:12px;color:var(--text-3);margin:6px 0 12px">${GEO_MODES[s.mode].desc}</div>
      <div class="lrn-label">Weltteil</div><div class="lrn-chips" style="margin-bottom:12px">${chips('region',GEO_REGIONS)}</div>
      <div class="lrn-label">Schwierigkeit</div><div class="lrn-chips" style="margin-bottom:14px">${chips('level',GEO_LEVELS)}</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:12px">${n} Länder pro Runde${s.mode==='name'?': 1 Punkt je richtige Antwort.':s.mode==='guess'?': bis zu 1000 Punkte je Land, je nach Entfernung deines Klicks. Ein Klick im Land gibt die volle Punktzahl.':': 3 Punkte beim ersten Versuch, 2 beim zweiten, 1 beim dritten. Nach jedem Fehlversuch gibt es einen Hinweis.'}${best!=null?` · 🏅 Bestwert ${best}/${max}`:''}</div>
      <button class="lrn-btn" onclick="geoStart()">▶ Runde starten</button></div>`;
    return;
  }
  const max=geo.mode==='name'?geo.n:geo.mode==='guess'?geo.n*1000:geo.n*3;
  if(geo.done){
    const rec=(d.best[geoKey(geo)]||0)===geo.score&&geo.score>0;
    root.innerHTML=`<div class="lrn-card" style="text-align:center"><div style="font-size:44px">${geo.score>=max*0.8?'🏆':geo.score>=max*0.5?'🌍':'🧭'}</div><div style="font-size:26px;font-weight:800">${geo.score} von ${max} Punkten</div>
      <div style="font-size:13px;color:var(--text-2);margin:6px 0 14px">${rec?'🏅 Neuer Bestwert! ':''}${GEO_MODES[geo.mode].name} · ${GEO_REGIONS[geo.region].name}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="geoStart()">Nochmal</button><button class="lrn-btn ghost" onclick="geo=null;geoRender()">Menü</button></div></div>`;
    return;
  }
  const t=geo.list[geo.i];
  const prompt=geo.mode==='find'||geo.mode==='guess'?`Wo liegt <span style="color:var(--accent)">${escHtml(t.name)}</span>?`:geo.mode==='capital'?`Zu welchem Land gehört die Hauptstadt <span style="color:var(--accent)">${escHtml(t.capital)}</span>?`:'Welches Land ist markiert?';
  root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="game-chip">${geo.i+1}/${geo.n}</span><span class="game-chip">⭐ <strong>${geo.score}</strong></span></div>
    <div style="text-align:center;font-size:21px;font-weight:800;margin-bottom:8px">${prompt}</div>
    <div style="position:relative"><canvas id="geo-canvas" width="${GEO_W}" height="${GEO_H}" style="display:block;width:100%;height:auto;border-radius:12px;background:#a5d0ea;cursor:grab;touch-action:none"></canvas>
      <div style="position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:4px"><button class="lrn-btn ghost" style="padding:4px 10px;font-size:16px" onclick="geoZoom(1.6)">＋</button><button class="lrn-btn ghost" style="padding:4px 10px;font-size:16px" onclick="geoZoom(1/1.6)">－</button><button class="lrn-btn ghost" style="padding:4px 8px;font-size:13px" title="Ansicht zurücksetzen" onclick="geoResetView()">⟲</button></div></div>
    <div id="geo-msg" style="text-align:center;margin-top:10px;min-height:24px;font-size:14px"></div>
    <div id="geo-ctrl" style="text-align:center;margin-top:6px"></div>`;
  const cv=document.getElementById('geo-canvas');
  cv.onpointerdown=geoPointerDown;cv.onpointermove=geoPointerMove;cv.onpointerup=geoPointerUp;cv.onpointercancel=()=>{geoDrag=null;};
  cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();geoZoomAt(e.deltaY<0?1.25:0.8,(e.clientX-r.left)*GEO_W/r.width,(e.clientY-r.top)*GEO_H/r.height);},{passive:false});
  geoDraw();geoUpdateUi();
}
function geoUpdateUi(){
  if(!geo||geo.done)return;
  const msg=document.getElementById('geo-msg'),ctrl=document.getElementById('geo-ctrl'),t=geo.list[geo.i];
  if(msg)msg.innerHTML=geo.msg;
  if(!ctrl)return;
  const last=geo.i+1>=geo.n,next=`<button class="lrn-btn" onclick="geoNext()">${last?'Ergebnis':'Weiter'} ▶</button>`;
  if(geo.mode==='name'){
    ctrl.innerHTML=geo.answered<0?`<div class="lrn-two" style="margin-top:0">${geo.opts.map((o,i)=>`<button class="lrn-btn ghost" style="padding:11px;font-size:15px" onclick="geoAnswer(${i})">${escHtml(o.name)}</button>`).join('')}</div>`:next;
  }else ctrl.innerHTML=geo.found||geo.tries>=3?next:'';
}
function geoDraw(){
  const cv=document.getElementById('geo-canvas');if(!cv||!geo||typeof Path2D==='undefined')return;
  const ctx=cv.getContext('2d');
  if(!geoPaths){geoPaths=GEO_LAND.map(c=>{const p=new Path2D();c.rings.forEach(r=>{r.forEach((pt,i)=>{const x=geoWX(pt[0]/10),y=geoWY(pt[1]/10);if(i)p.lineTo(x,y);else p.moveTo(x,y);});p.closePath();});return p;});}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#a5d0ea';ctx.fillRect(0,0,GEO_W,GEO_H);
  const z=geoV.z;ctx.setTransform(z,0,0,z,-geoV.x0*z,-geoV.y0*z);
  ctx.lineJoin='round';ctx.lineWidth=0.9/z;ctx.strokeStyle='#7a8f66';
  const t=geo.list[geo.i],reveal=geo.found||geo.tries>=3||geo.answered>=0;
  GEO_LAND.forEach(c=>{
    let col=c.color;
    if(geo.wrong.includes(c.id))col='#ff8787';
    if(c.id===t.id){if(geo.mode==='name'&&geo.answered<0)col='#ffd43b';else if(reveal)col=(geo.mode==='name'?geo.opts[geo.answered]&&geo.opts[geo.answered].id===t.id:geo.found)?'#51cf66':'#ffd43b';}
    ctx.fillStyle=col;ctx.fill(geoPaths[c.id],'evenodd');ctx.stroke(geoPaths[c.id]);
  });
  ctx.setTransform(1,0,0,1,0,0);
  if(geo.mode==='guess'&&geo.pin){
    const a=geoLatLonToScreen(geo.pin.lat,geo.pin.lon);
    if(geo.pin.to){const b=geoLatLonToScreen(geo.pin.to[0],geo.pin.to[1]);ctx.strokeStyle='#e03131';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);}
    ctx.fillStyle='#1971c2';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a[0],a[1],7,0,7);ctx.fill();ctx.stroke();
  }
  ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.fillStyle='#222';
  const label=(c)=>{const px=(geoWX(c.lon)-geoV.x0)*z,py=(geoWY(c.lat)-geoV.y0)*z;if(px<0||px>GEO_W||py<0||py>GEO_H)return;ctx.strokeText(c.name,px,py);ctx.fillText(c.name,px,py);};
  if(reveal&&geo.mode!=='name')label(t);
  if(geo.mode==='name'&&geo.answered>=0)label(t);
  geo.wrong.forEach(id=>label(GEO_LAND[id]));
}
/* Ziehen = verschieben, kurzes Tippen = Land wählen */
function geoCanvasPos(ev){const cv=document.getElementById('geo-canvas'),r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*GEO_W/r.width,(ev.clientY-r.top)*GEO_H/r.height];}
function geoPointerDown(ev){const [x,y]=geoCanvasPos(ev);geoDrag={x,y,sx:x,sy:y,x0:geoV.x0,y0:geoV.y0,moved:false};try{ev.target.setPointerCapture(ev.pointerId);}catch(e){}}
function geoPointerMove(ev){
  if(!geoDrag)return;const [x,y]=geoCanvasPos(ev);
  if(Math.hypot(x-geoDrag.sx,y-geoDrag.sy)>6)geoDrag.moved=true;
  if(geoDrag.moved){geoV.x0=geoDrag.x0-(x-geoDrag.sx)/geoV.z;geoV.y0=geoDrag.y0-(y-geoDrag.sy)/geoV.z;geoDraw();}
}
function geoPointerUp(ev){
  const d=geoDrag;geoDrag=null;if(!d||d.moved||!geo||geo.done)return;
  const [x,y]=geoCanvasPos(ev);
  const pos=geoScreenToLatLon(x,y);geoClickAt(pos[0],pos[1]);
}
function geoClickAt(lat,lon){
  if(!geo||geo.done||geo.mode==='name'||geo.found||geo.tries>=3)return;
  const t=geo.list[geo.i];
  if(geo.mode==='guess'){
    const km=geoGuessKm(lat,lon,t),pts=geoGuessPoints(km),h=geoHint(lat,lon,t);
    geo.score+=pts;geo.found=true;geo.tries=1;geo.pin={lat,lon,to:km===0?null:[h.lat,h.lon]};
    geo.msg=km===0?`🎯 Volltreffer! <b>${escHtml(t.name)}</b> · <b>+${pts}</b>`:`📍 Du warst <b>${km.toLocaleString('de-DE')} km</b> von ${escHtml(t.name)} entfernt · <b>+${pts}</b>`;
    if(km>0)geoFitPair(lat,lon,t);
    geoDraw();geoUpdateUi();return;
  }
  const hit=geoHit(lat,lon);
  if(hit<0){geo.msg='💧 Das ist Wasser – klick auf ein Land.';geoUpdateUi();return;}
  if(geo.wrong.includes(hit)){geo.msg='Das hattest du schon probiert.';geoUpdateUi();return;}
  geo.tries++;
  if(hit===t.id){
    const pts=geoScoreTry(geo.tries);geo.score+=pts;geo.found=true;
    geo.msg=`✅ Richtig! <b>${escHtml(t.name)}</b>${geo.mode==='capital'?' ('+escHtml(t.capital)+')':''} · <b>+${pts}</b>`;
  }else{
    geo.wrong.push(hit);
    const c=GEO_LAND[hit];
    if(geo.tries>=3){geo.msg=`❌ Das war ${escHtml(c.name)}. Gesucht war <b>${escHtml(t.name)}</b> – grün markiert.`;geoFitCountry(t);}
    else{const h=geoHint(lat,lon,t);geo.msg=`❌ Das ist ${escHtml(c.name)}. Gesucht ist etwa <b>${h.km.toLocaleString('de-DE')} km</b> Richtung <b>${h.dir}</b>. (${3-geo.tries} Versuch${3-geo.tries===1?'':'e'} übrig)`;}
  }
  geoDraw();geoUpdateUi();
}
function geoAnswer(i){
  if(!geo||geo.done||geo.mode!=='name'||geo.answered>=0)return;
  const t=geo.list[geo.i];geo.answered=i;
  const ok=geo.opts[i].id===t.id;
  if(ok)geo.score++;
  geo.msg=ok?`✅ Richtig! <b>${escHtml(t.name)}</b> · +1`:`❌ Falsch – das war <b>${escHtml(t.name)}</b>${t.capital?' (Hauptstadt '+escHtml(t.capital)+')':''}.`;
  geoDraw();geoUpdateUi();
}
function geoNext(){
  if(!geo)return;
  geo.i++;
  if(geo.i>=geo.n){
    geo.done=true;const d=geoLoad(),k=geoKey(geo);if((d.best[k]||0)<geo.score)d.best[k]=geo.score;geoSave(d);geoData=d;geoRender();return;
  }
  geoNewQuestion();geoRender();
}
