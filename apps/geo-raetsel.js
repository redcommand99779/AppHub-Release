/* ══════════════════════════════════
   KARTEN-RÄTSEL – Weltkarte mit echten Ländergrenzen (geo-daten.js) sowie Flüssen, Seen, Meeren, Bergen und Inseln (geo-daten2.js).
   Daten: Natural Earth 110m (gemeinfrei), stark vereinfacht, komplett offline. Themen: Länder, Flüsse & Seen, Meere, Berge, Inseln.
   Spielarten bei Ländern: „Land finden“ (3 Versuche mit Richtungs-Hinweis), „Entfernung“ (wie GeoGuessr: klick irgendwohin, Punkte nach Abstand),
   „Hauptstadt“ und „Land benennen“ (4 Antworten). Bei den anderen Themen: „Entfernung“ und „Benennen“.
   Dazu das Tages-Rätsel (für alle Spieler am selben Tag gleich) mit Rangliste. Auswahl nach Weltteil und Schwierigkeit, Zoom (Rad/Knöpfe)
   und Verschieben (Ziehen). Bestwerte und Tagesergebnisse: zf_georaetsel
══════════════════════════════════ */
const GEO_KEY='zf_georaetsel';
const GEO_ROUNDS=10;
const GEO_W=800,GEO_H=480;
const GEO_MODES={find:{name:'📍 Land finden',desc:'Land wird genannt – klick es an'},guess:{name:'🎯 Entfernung',desc:'Klick irgendwohin (auch aufs Meer) – je näher am Ziel, desto mehr Punkte, wie bei GeoGuessr'},capital:{name:'🏛 Hauptstadt',desc:'Zur Hauptstadt das Land finden'},name:{name:'🔤 Benennen',desc:'Das Ziel ist markiert – wähle den Namen'}};
const GEO_THEMES={
  laender:{name:'🌍 Länder',modes:['find','guess','capital','name'],unit:'Länder'},
  fluesse:{name:'🏞 Flüsse & Seen',modes:['guess','name'],types:['fluss','see'],unit:'Flüsse und Seen'},
  meere:{name:'🌊 Meere',modes:['guess','name'],types:['meer'],unit:'Meere'},
  berge:{name:'⛰ Berge',modes:['guess','name'],types:['berg'],unit:'Berge'},
  inseln:{name:'🏝 Inseln',modes:['guess','name'],types:['insel'],unit:'Inseln'}};
const GEO_REGIONS={welt:{name:'🌍 Welt',box:[-180,180,84,-58]},Europa:{name:'Europa',box:[-25,50,72,33]},Asien:{name:'Asien',box:[25,150,58,-12]},Afrika:{name:'Afrika',box:[-20,55,38,-36]},
  Nordamerika:{name:'Nordamerika',box:[-170,-50,75,6]},Südamerika:{name:'Südamerika',box:[-85,-32,14,-57]},Ozeanien:{name:'Ozeanien',box:[110,180,2,-48]}};
const GEO_LEVELS={leicht:{name:'Leicht (bekannte)'},alle:{name:'Alle'}};
const GEO_EXTRA_EASY=['Norwegen','Finnland','Griechenland','Irland','Österreich','Schweiz','Portugal','Niederlande','Dänemark','Island','Kuba','Neuseeland','Chile','Kenia','Marokko','Algerien','Ägypten','Peru','Schweden','Kolumbien','Kanada'];
const GEO_COLORS=['#dfe8b8','#f1e2b5','#d5e8c8','#f0d5c0','#d8dfef','#e6d5ea'];

/* ── Daten entschlüsseln: Punkte als [Länge×10, Breite×10], Schwerpunkt, Umrissrahmen ── */
function geoDecodeRings(list){return list.map(flat=>{const pts=[];let x=0,y=0;for(let i=0;i<flat.length;i+=2){x+=flat[i];y+=flat[i+1];pts.push([x,y]);}return pts;});}
function geoBox(rings){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;rings.forEach(r=>r.forEach(p=>{p[0]<x0&&(x0=p[0]);p[0]>x1&&(x1=p[0]);p[1]<y0&&(y0=p[1]);p[1]>y1&&(y1=p[1]);}));return [x0,y0,x1,y1];}
function geoBiggest(rings){let best=null,bestA=-1;rings.forEach(r=>{let a=0;for(let i=0;i<r.length;i++){const p=r[i],q=r[(i+1)%r.length];a+=p[0]*q[1]-q[0]*p[1];}a=Math.abs(a/2);if(a>bestA||(bestA<=0&&r.length>(best?best.length:0))){bestA=a;best=r;}});return best;}
const GEO_LAND=GEO_DATA.map((d,idx)=>{
  const rings=geoDecodeRings(d.r),best=geoBiggest(rings);
  const mx=best.reduce((s,p)=>s+p[0],0)/best.length,my=best.reduce((s,p)=>s+p[1],0)/best.length;
  return {id:idx,theme:'laender',type:'land',name:d.n,iso:d.i,cont:d.k,pop:d.p,capital:d.c,rings,bbox:geoBox(rings),lat:my/10,lon:mx/10,
    easy:d.p>=15||GEO_EXTRA_EASY.includes(d.n),color:GEO_COLORS[(idx*5+(idx>>2))%GEO_COLORS.length]};
});
/* Flüsse (Linien), Seen und Meere (Flächen), Berge und Inseln (Punkte) */
const GEO_FEAT=(typeof GEO_FEATURES!=='undefined'?GEO_FEATURES:[]).map((d,idx)=>{
  const theme=d.t==='fluss'||d.t==='see'?'fluesse':d.t==='meer'?'meere':d.t==='berg'?'berge':'inseln';
  const f={id:idx,theme,type:d.t,name:d.n,art:d.a||'',cont:d.k,easy:!!d.e,dense:[]};
  if(d.p){
    f.pt=d.p;f.height=d.h;f.area=d.f;f.radiusKm=d.f?Math.sqrt(d.f/Math.PI):0;
    f.rings=[];f.bbox=[d.p[1],d.p[0],d.p[1],d.p[0]];f.lat=d.p[0]/10;f.lon=d.p[1]/10;f.dense=[[f.lat,f.lon]];
  }else{
    f.rings=geoDecodeRings(d.r);f.bbox=geoBox(f.rings);
    const big=d.t==='fluss'?f.rings.reduce((a,b)=>b.length>a.length?b:a):geoBiggest(f.rings),mid=d.t==='fluss'?big[Math.floor(big.length/2)]:[big.reduce((s,p)=>s+p[0],0)/big.length,big.reduce((s,p)=>s+p[1],0)/big.length];
    f.lat=mid[1]/10;f.lon=mid[0]/10;
    f.rings.forEach(r=>{const n=d.t==='fluss'?r.length-1:r.length;for(let i=0;i<n;i++){const a=r[i],b=r[(i+1)%r.length],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let s=0;s<steps;s++)f.dense.push([(a[1]+(b[1]-a[1])*s/steps)/10,(a[0]+(b[0]-a[0])*s/steps)/10]);}if(d.t==='fluss'){const l=r[r.length-1];f.dense.push([l[1]/10,l[0]/10]);}});
  }
  return f;
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
/* liegt der Punkt (in Zehntelgrad x = Länge, y = Breite) in den Ringen? Löcher zählen über „gerade/ungerade“ mit */
function geoInRings(rings,x,y){
  let inside=false;
  for(const r of rings){for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],p=r[j];if((a[1]>y)!==(p[1]>y)&&x<(p[0]-a[0])*(y-a[1])/(p[1]-a[1])+a[0])inside=!inside;}}
  return inside;
}
/* Punkt (Breite, Länge in Grad) liegt in welchem Land? -1 = Wasser */
function geoHit(lat,lon){
  const x=lon*10,y=lat*10;
  for(const c of GEO_LAND){const b=c.bbox;if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;if(geoInRings(c.rings,x,y))return c.id;}
  return -1;
}
/* Abstand und Richtung vom Klick zum nächsten Punkt des Ziels (Land, Fluss, See, Meer, Berg oder Insel) */
function geoHint(lat,lon,target){
  let best=1e9,bl=0,bo=0;
  if(target.theme==='laender'){target.rings.forEach(r=>{for(let i=0;i<r.length;i++){const la=r[i][1]/10,lo=r[i][0]/10,d=geoDist(lat,lon,la,lo);if(d<best){best=d;bl=la;bo=lo;}}});}
  else{target.dense.forEach(p=>{const d=geoDist(lat,lon,p[0],p[1]);if(d<best){best=d;bl=p[0];bo=p[1];}});best=Math.max(0,best-(target.radiusKm||0));}
  return {km:Math.round(best/10)*10,dir:geoBearingWord(lat,lon,bl,bo),lat:bl,lon:bo};
}
/* Entfernungs-Modus: im Ziel = 0 km, sonst Abstand zum nächsten Punkt; 1000 Punkte bei 0 km, dann immer weniger (wie bei GeoGuessr) */
function geoGuessKm(lat,lon,target){
  if(target.theme==='laender')return geoHit(lat,lon)===target.id?0:geoHint(lat,lon,target).km;
  if(target.type==='see'||target.type==='meer'){const x=lon*10,y=lat*10,b=target.bbox;if(x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]&&geoInRings(target.rings,x,y))return 0;}
  return geoHint(lat,lon,target).km;
}
function geoGuessPoints(km){return Math.round(1000*Math.exp(-km/1500));}
function geoScoreTry(tries){return tries===1?3:tries===2?2:tries===3?1:0;}
function geoItems(theme){return !theme||theme==='laender'?GEO_LAND:GEO_FEAT.filter(f=>GEO_THEMES[theme]&&GEO_THEMES[theme].types.includes(f.type));}
function geoPool(region,level,mode,theme){
  theme=theme||'laender';
  const all=geoItems(theme).filter(c=>(mode!=='capital'||c.capital));
  let base=all.filter(c=>region==='welt'||theme==='meere'||c.cont===region);
  if(theme!=='laender'&&base.length<4)base=all;                 // zu wenig Objekte in diesem Weltteil: die ganze Welt nehmen
  const easy=base.filter(c=>c.easy);
  return level==='alle'||easy.length<Math.min(GEO_ROUNDS,base.length)?base:easy;
}
function geoShuffle(a,rnd){a=a.slice();rnd=rnd||Math.random;for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function geoPickCountries(region,level,mode,n,rnd,theme){return geoShuffle(geoPool(region,level,mode,theme),rnd).slice(0,n);}
function geoOptions(target,region,level,rnd){
  const pool=geoItems(target.theme).filter(c=>c.id!==target.id);
  const near=geoShuffle(pool.filter(c=>c.type===target.type&&c.cont===target.cont),rnd),same=geoShuffle(pool.filter(c=>c.type===target.type),rnd),rest=geoShuffle(pool,rnd);
  const wrong=[];near.concat(same,rest).forEach(c=>{if(wrong.length<3&&!wrong.some(w=>w.id===c.id))wrong.push(c);});
  return geoShuffle([target].concat(wrong),rnd);
}
function geoNameOf(t){return t.theme==='laender'||!t.art?t.name:t.art+' '+t.name;}
function geoKey(g){const k=g.mode+'|'+g.region+'|'+g.level;return !g.theme||g.theme==='laender'?k:g.theme+'|'+k;}
function geoLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(GEO_KEY)||'null');}catch(e){}if(!d||typeof d!=='object')d={};d.best=d.best&&typeof d.best==='object'?d.best:{};d.daily=d.daily&&typeof d.daily==='object'&&!Array.isArray(d.daily)?d.daily:{};return d;}
function geoSave(d){try{localStorage.setItem(GEO_KEY,JSON.stringify(d));}catch(e){}}

/* ── Tages-Rätsel: für alle am selben Tag dieselben 10 Länder, Rangliste auf diesem Gerät ── */
function geoDayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function geoRng(seed){return ()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function geoSeedOf(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function geoDailyList(key){return geoPickCountries('welt','alle','guess',GEO_ROUNDS,geoRng(geoSeedOf('geo-raetsel-'+key)),'laender');}
function geoPlayer(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return 'Gast';}
/* Ergebnis eintragen: pro Spieler und Tag zählt nur der erste Durchgang */
function geoDailyRecord(d,key,player,score){
  d.daily[key]=d.daily[key]||{};
  if(d.daily[key][player]!=null)return false;
  d.daily[key][player]=score;
  const keys=Object.keys(d.daily).sort();while(keys.length>60)delete d.daily[keys.shift()];   // nur die letzten 60 Tage behalten
  return true;
}
function geoDailyRanking(d,key){return Object.keys(d.daily[key]||{}).map(n=>[n,d.daily[key][n]]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));}

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
  const w=Math.max(lo1-lo0,c.pt?20:14),h=Math.max(la1-la0,c.pt?12:8.4),cx=(lo0+lo1)/2,cy=(la0+la1)/2;
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
function geoRegionBox(){return GEO_REGIONS[geo&&geo.theme!=='meere'?geo.region:'welt'].box;}
function geoResetView(){geoFit(geoRegionBox());geoDraw();}

/* ── Oberfläche ── */
let geo=null,geoSetup={theme:'laender',mode:'find',region:'welt',level:'leicht'},geoData=null,geoPaths=null,geoFeatPaths={},geoDrag=null;
function geoInit(){geoData=geoLoad();geo=null;geoRender();}
function geoSet(k,v){
  geoSetup[k]=v;
  if(k==='theme'&&!GEO_THEMES[v].modes.includes(geoSetup.mode))geoSetup.mode=GEO_THEMES[v].modes.includes('guess')?'guess':GEO_THEMES[v].modes[0];
  geoRender();
}
function geoStart(daily){
  const s=geoSetup;let cfg,list;
  if(daily===true){cfg={theme:'laender',mode:'guess',region:'welt',level:'alle'};list=geoDailyList(geoDayKey());}
  else{cfg={theme:s.theme||'laender',mode:s.mode,region:s.region,level:s.level};list=geoPickCountries(cfg.region,cfg.level,cfg.mode,GEO_ROUNDS,null,cfg.theme);}
  if(!list.length)return;
  geo=Object.assign({},cfg,{list,n:list.length,i:0,score:0,tries:0,wrong:[],found:false,done:false,msg:'',opts:null,answered:-1,daily:daily===true?geoDayKey():null});
  geoNewQuestion();geoRender();
}
function geoNewQuestion(){
  const t=geo.list[geo.i];geo.tries=0;geo.wrong=[];geo.found=false;geo.msg='';geo.answered=-1;geo.pin=null;
  geo.opts=geo.mode==='name'?geoOptions(t,geo.region,geo.level):null;
  if(geo.mode==='name')geoFitCountry(t);else geoFit(geoRegionBox());
}
function geoMax(mode,n){return mode==='name'?n:mode==='guess'?n*1000:n*3;}
function geoRankingHtml(d,key,me){
  const r=geoDailyRanking(d,key);
  if(!r.length)return '<div style="font-size:12px;color:var(--text-3)">Noch niemand hat heute gespielt.</div>';
  return `<table style="border-collapse:collapse;font-size:13px;width:100%">${r.slice(0,8).map((x,i)=>`<tr style="${x[0]===me?'font-weight:800;color:var(--accent)':''}"><td style="padding:3px 6px;width:26px">${['🥇','🥈','🥉'][i]||(i+1)+'.'}</td><td style="padding:3px 6px">${escHtml(x[0])}</td><td style="padding:3px 6px;text-align:right">${x[1]}</td></tr>`).join('')}</table>`;
}
function geoRender(){
  const root=document.getElementById('geo-root');if(!root)return;
  const d=geoData||geoLoad();
  if(!geo){
    const s=geoSetup,th=GEO_THEMES[s.theme||'laender'],best=d.best[geoKey(s)],me=geoPlayer(),today=geoDayKey();
    const chips=(k,obj,only)=>Object.keys(obj).filter(x=>!only||only.includes(x)).map(x=>`<button type="button" class="lrn-chip ${s[k]===x?'active':''}" onclick="geoSet('${k}','${x}')">${obj[x].name}</button>`).join('');
    const n=Math.min(GEO_ROUNDS,geoPool(s.region,s.level,s.mode,s.theme).length),max=geoMax(s.mode,n);
    const doneToday=d.daily[today]&&d.daily[today][me]!=null;
    root.innerHTML=`<div class="lrn-card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div style="font-weight:800;font-size:16px">📅 Tages-Rätsel</div>
        <div style="font-size:12px;color:var(--text-3)">Heute für alle dieselben ${GEO_ROUNDS} Länder (Entfernung). Pro Spieler zählt der erste Durchgang.</div></div>
        <button class="lrn-btn" onclick="geoStart(true)">${doneToday?'Nochmal üben':'▶ Heute spielen'}</button></div>
      <div style="margin-top:10px"><div class="lrn-label">Rangliste heute (${escHtml(me)}${doneToday?': '+d.daily[today][me]:''})</div>${geoRankingHtml(d,today,me)}</div></div>
      <div class="lrn-card"><div class="lrn-label">Thema</div><div class="lrn-chips" style="margin-bottom:12px">${chips('theme',GEO_THEMES)}</div>
      <div class="lrn-label">Spielart</div><div class="lrn-chips">${chips('mode',GEO_MODES,th.modes)}</div>
      <div style="font-size:12px;color:var(--text-3);margin:6px 0 12px">${GEO_MODES[s.mode].desc}</div>
      ${s.theme==='meere'?'':`<div class="lrn-label">Weltteil</div><div class="lrn-chips" style="margin-bottom:12px">${chips('region',GEO_REGIONS)}</div>`}
      <div class="lrn-label">Schwierigkeit</div><div class="lrn-chips" style="margin-bottom:14px">${chips('level',GEO_LEVELS)}</div>
      <div style="font-size:13px;color:var(--text-2);margin-bottom:12px">${n} ${th.unit} pro Runde${s.mode==='name'?': 1 Punkt je richtige Antwort.':s.mode==='guess'?': bis zu 1000 Punkte je Ziel, je nach Entfernung deines Klicks. Ein Klick direkt drauf gibt die volle Punktzahl.':': 3 Punkte beim ersten Versuch, 2 beim zweiten, 1 beim dritten. Nach jedem Fehlversuch gibt es einen Hinweis.'}${best!=null?` · 🏅 Bestwert ${best}/${max}`:''}</div>
      <button class="lrn-btn" onclick="geoStart()">▶ Runde starten</button></div>`;
    return;
  }
  const max=geoMax(geo.mode,geo.n);
  if(geo.done){
    const rec=!geo.daily&&(d.best[geoKey(geo)]||0)===geo.score&&geo.score>0,me=geoPlayer();
    root.innerHTML=`<div class="lrn-card" style="text-align:center"><div style="font-size:44px">${geo.score>=max*0.8?'🏆':geo.score>=max*0.5?'🌍':'🧭'}</div><div style="font-size:26px;font-weight:800">${geo.score} von ${max} Punkten</div>
      <div style="font-size:13px;color:var(--text-2);margin:6px 0 14px">${geo.daily?'📅 Tages-Rätsel'+(geo.recorded?' · in die Rangliste eingetragen':' · heute schon gewertet, dieser Durchgang zählt nicht'):(rec?'🏅 Neuer Bestwert! ':'')+GEO_THEMES[geo.theme].name+' · '+GEO_MODES[geo.mode].name+(geo.theme==='meere'?'':' · '+GEO_REGIONS[geo.region].name)}</div>
      ${geo.daily?`<div style="max-width:260px;margin:0 auto 14px;text-align:left"><div class="lrn-label">Rangliste heute</div>${geoRankingHtml(d,geo.daily,me)}</div>`:''}
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="geoStart(${geo.daily?'true':''})">Nochmal</button><button class="lrn-btn ghost" onclick="geo=null;geoRender()">Menü</button></div></div>`;
    return;
  }
  const t=geo.list[geo.i],lands=t.theme==='laender';
  const prompt=geo.mode==='find'||geo.mode==='guess'?`Wo liegt <span style="color:var(--accent)">${escHtml(geoNameOf(t))}</span>?`:geo.mode==='capital'?`Zu welchem Land gehört die Hauptstadt <span style="color:var(--accent)">${escHtml(t.capital)}</span>?`:lands?'Welches Land ist markiert?':'Was ist hier markiert?';
  root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="game-chip">${geo.i+1}/${geo.n}${geo.daily?' · 📅':''}</span><span class="game-chip">⭐ <strong>${geo.score}</strong></span></div>
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
  const msg=document.getElementById('geo-msg'),ctrl=document.getElementById('geo-ctrl');
  if(msg)msg.innerHTML=geo.msg;
  if(!ctrl)return;
  const last=geo.i+1>=geo.n,next=`<button class="lrn-btn" onclick="geoNext()">${last?'Ergebnis':'Weiter'} ▶</button>`;
  if(geo.mode==='name'){
    ctrl.innerHTML=geo.answered<0?`<div class="lrn-two" style="margin-top:0">${geo.opts.map((o,i)=>`<button class="lrn-btn ghost" style="padding:11px;font-size:15px" onclick="geoAnswer(${i})">${escHtml(o.name)}</button>`).join('')}</div>`:next;
  }else ctrl.innerHTML=geo.found||geo.tries>=3?next:'';
}
function geoFeatPath(f){
  if(geoFeatPaths[f.id])return geoFeatPaths[f.id];
  const p=new Path2D();
  f.rings.forEach(r=>{r.forEach((pt,i)=>{const x=geoWX(pt[0]/10),y=geoWY(pt[1]/10);if(i)p.lineTo(x,y);else p.moveTo(x,y);});if(f.type!=='fluss')p.closePath();});
  return geoFeatPaths[f.id]=p;
}
/* Beschriftung/Zusatzinfo zu einem Ziel: Höhe bei Bergen, Fläche bei Inseln */
function geoDetail(t){return t.height?` (${t.height.toLocaleString('de-DE')} m)`:t.area?` (${t.area.toLocaleString('de-DE')} km²)`:'';}
function geoDraw(){
  const cv=document.getElementById('geo-canvas');if(!cv||!geo||typeof Path2D==='undefined')return;
  const ctx=cv.getContext('2d');
  if(!geoPaths){geoPaths=GEO_LAND.map(c=>{const p=new Path2D();c.rings.forEach(r=>{r.forEach((pt,i)=>{const x=geoWX(pt[0]/10),y=geoWY(pt[1]/10);if(i)p.lineTo(x,y);else p.moveTo(x,y);});p.closePath();});return p;});}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#a5d0ea';ctx.fillRect(0,0,GEO_W,GEO_H);
  const z=geoV.z;ctx.setTransform(z,0,0,z,-geoV.x0*z,-geoV.y0*z);
  ctx.lineJoin='round';ctx.lineWidth=0.9/z;ctx.strokeStyle='#7a8f66';
  const t=geo.list[geo.i],lands=t.theme==='laender',reveal=geo.found||geo.tries>=3||geo.answered>=0;
  const right=geo.mode==='name'?!!(geo.opts&&geo.answered>=0&&geo.opts[geo.answered].id===t.id):geo.found;
  GEO_LAND.forEach(c=>{
    let col=c.color;
    if(geo.wrong.includes(c.id))col='#ff8787';
    if(lands&&c.id===t.id){if(geo.mode==='name'&&geo.answered<0)col='#ffd43b';else if(reveal)col=right?'#51cf66':'#ffd43b';}
    ctx.fillStyle=col;ctx.fill(geoPaths[c.id],'evenodd');ctx.stroke(geoPaths[c.id]);
  });
  // Ziel der anderen Themen: Fläche (See/Meer), Linie (Fluss) oder Punkt (Berg/Insel)
  const showFeat=!lands&&(geo.mode==='name'||reveal);
  if(showFeat&&t.rings.length){
    const p=geoFeatPath(t),col=right||(geo.mode!=='name'&&geo.found)?'81,207,102':'255,212,59';
    if(t.type==='fluss'){ctx.strokeStyle='rgba(25,113,194,0.95)';ctx.lineWidth=3.2/z;ctx.stroke(p);}
    else{ctx.fillStyle='rgba('+col+',0.6)';ctx.fill(p,'evenodd');ctx.strokeStyle='#8a6d00';ctx.lineWidth=1.4/z;ctx.stroke(p);}
  }
  ctx.setTransform(1,0,0,1,0,0);
  if(showFeat&&t.pt){
    const a=geoLatLonToScreen(t.lat,t.lon),r=Math.max(8,t.radiusKm/111*10*z);
    ctx.fillStyle=right||(geo.mode!=='name'&&geo.found)?'rgba(81,207,102,0.85)':'rgba(255,212,59,0.85)';ctx.strokeStyle='#8a6d00';ctx.lineWidth=2;
    ctx.beginPath();if(t.type==='berg'){ctx.moveTo(a[0],a[1]-r);ctx.lineTo(a[0]+r,a[1]+r*0.8);ctx.lineTo(a[0]-r,a[1]+r*0.8);ctx.closePath();}else ctx.arc(a[0],a[1],r,0,7);
    ctx.fill();ctx.stroke();
  }
  if(geo.mode==='guess'&&geo.pin){
    const a=geoLatLonToScreen(geo.pin.lat,geo.pin.lon);
    if(geo.pin.to){const b=geoLatLonToScreen(geo.pin.to[0],geo.pin.to[1]);ctx.strokeStyle='#e03131';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.setLineDash([]);}
    ctx.fillStyle='#1971c2';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a[0],a[1],7,0,7);ctx.fill();ctx.stroke();
  }
  ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.fillStyle='#222';
  const label=(c)=>{const px=(geoWX(c.lon)-geoV.x0)*z,py=(geoWY(c.lat)-geoV.y0)*z-(c.pt?14:0);if(px<0||px>GEO_W||py<0||py>GEO_H)return;ctx.strokeText(c.name,px,py);ctx.fillText(c.name,px,py);};
  if(reveal&&geo.mode!=='name')label(t);
  if(geo.mode==='name'&&geo.answered>=0)label(t);
  geo.wrong.forEach(id=>label(GEO_LAND[id]));
}
/* Ziehen = verschieben, kurzes Tippen = wählen */
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
    const km=geoGuessKm(lat,lon,t),pts=geoGuessPoints(km),h=geoHint(lat,lon,t),nm=escHtml(t.name)+geoDetail(t);
    geo.score+=pts;geo.found=true;geo.tries=1;geo.pin={lat,lon,to:km===0?null:[h.lat,h.lon]};
    geo.msg=km===0?`🎯 Volltreffer! <b>${nm}</b> · <b>+${pts}</b>`:`📍 Du warst <b>${km.toLocaleString('de-DE')} km</b> von ${nm} entfernt · <b>+${pts}</b>`;
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
  const extra=t.capital?' (Hauptstadt '+escHtml(t.capital)+')':escHtml(geoDetail(t));
  geo.msg=ok?`✅ Richtig! <b>${escHtml(t.name)}</b>${extra} · +1`:`❌ Falsch – das war <b>${escHtml(t.name)}</b>${extra}.`;
  geoDraw();geoUpdateUi();
}
function geoNext(){
  if(!geo)return;
  geo.i++;
  if(geo.i>=geo.n){
    geo.done=true;const d=geoLoad();
    if(geo.daily)geo.recorded=geoDailyRecord(d,geo.daily,geoPlayer(),geo.score);
    else{const k=geoKey(geo);if((d.best[k]||0)<geo.score)d.best[k]=geo.score;}
    geoSave(d);geoData=d;
    if(typeof lsMark==='function')lsMark('georaetsel');
    geoRender();return;
  }
  geoNewQuestion();geoRender();
}
