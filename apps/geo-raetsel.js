/* ══════════════════════════════════
   KARTEN-RÄTSEL – „Wo liegt …?“ Ein Land wird genannt, du klickst auf die Weltkarte. Je näher du dran bist, desto mehr Punkte
   (1000 bei einem Volltreffer, 0 ab etwa 4000 km). Eine Runde hat 10 Länder. Die Karte ist grob gezeichnet und braucht
   keine Bilder oder Internet. Bestwerte: zf_georaetsel
══════════════════════════════════ */
const GEO_KEY='zf_georaetsel';
const GEO_ROUNDS=10;
/* Land: Name, Breite, Länge (ungefähre Mitte) */
const GEO_RAW=
'Deutschland 51 10|Frankreich 46.5 2.5|Spanien 40 -3.5|Portugal 39.5 -8|Italien 42.5 12.5|Vereinigtes Königreich 54 -2.5|Irland 53 -8|Norwegen 61 9|Schweden 62 15|Finnland 64 26|Dänemark 56 9.5|Island 65 -18|'
+'Polen 52 19|Tschechien 49.8 15.5|Österreich 47.5 14.5|Schweiz 46.8 8.2|Niederlande 52.2 5.5|Belgien 50.6 4.6|Griechenland 39 22|Ungarn 47 19.5|Rumänien 46 25|Bulgarien 42.7 25.5|Ukraine 49 32|Weißrussland 53.7 28|'
+'Türkei 39 35|Serbien 44 21|Kroatien 45.2 15.5|Litauen 55.3 23.8|Lettland 57 25|Estland 58.7 25.5|Slowakei 48.7 19.5|Slowenien 46.1 14.8|Bosnien-Herzegowina 44 17.8|Albanien 41 20|Nordmazedonien 41.6 21.7|Moldau 47.2 28.5|Russland 61 90|'
+'China 35 103|Indien 21 78|Japan 36 138|Südkorea 36.5 128|Nordkorea 40 127|Mongolei 47 103|Kasachstan 48 68|Usbekistan 41.5 64|Iran 32 53|Irak 33 44|Saudi-Arabien 24 45|Israel 31 35|Syrien 35 38|Jordanien 31 36.5|Afghanistan 33.9 67.7|Pakistan 30 70|Bangladesch 24 90|Nepal 28.4 84|'
+'Thailand 15 101|Vietnam 16 107|Indonesien -2 118|Malaysia 4 102|Philippinen 12.8 122|Myanmar 21 96|Kambodscha 12.5 105|Laos 19 103|Sri Lanka 7.8 80.7|Jemen 15.5 48|Oman 21 57|Vereinigte Arabische Emirate 24 54|Katar 25.3 51.2|Kuwait 29.3 47.7|Libanon 33.9 35.9|'
+'Georgien 42 43.5|Armenien 40 45|Aserbaidschan 40.3 47.7|Turkmenistan 39 59|Kirgisistan 41.5 74.5|Tadschikistan 38.9 71|Singapur 1.35 103.8|Taiwan 23.7 121|'
+'Ägypten 26.5 30|Libyen 27 17|Tunesien 34 9|Algerien 28 2.6|Marokko 32 -6|Mauretanien 20 -10.5|Mali 17 -4|Niger 17 9|Tschad 15 19|Sudan 15.6 30|Südsudan 7.5 30|Äthiopien 9 40|Somalia 5 46|Kenia 0.5 38|Uganda 1.4 32.3|Tansania -6.3 34.8|Ruanda -2 29.9|'
+'Demokratische Republik Kongo -3 23.5|Republik Kongo -0.7 15|Gabun -0.8 11.6|Kamerun 5.7 12.7|Nigeria 9.6 8.1|Ghana 7.9 -1.2|Elfenbeinküste 7.6 -5.5|Senegal 14.5 -14.5|Guinea 10.5 -11|Angola -12 17.5|Sambia -13 27.8|Simbabwe -19 29.8|Mosambik -18.5 35|Madagaskar -19 46.7|'
+'Namibia -22 17|Botsuana -22 24|Südafrika -29 24|Malawi -13.3 34|Burkina Faso 12.3 -1.6|Benin 9.5 2.3|Togo 8.6 1|Liberia 6.5 -9.3|Sierra Leone 8.5 -11.8|Eritrea 15.3 39|Dschibuti 11.8 42.6|Zentralafrikanische Republik 6.6 20.9|'
+'USA 39 -98|Kanada 58 -105|Mexiko 23.6 -102.5|Kuba 21.5 -79|Guatemala 15.5 -90.3|Honduras 14.8 -86.6|Nicaragua 12.9 -85|Costa Rica 9.9 -84|Panama 8.5 -80|Kolumbien 4 -73|Venezuela 7 -66|Ecuador -1.4 -78.4|Peru -9.2 -75|Bolivien -16.7 -64.7|'
+'Brasilien -10 -52|Chile -30 -71|Argentinien -34 -64|Uruguay -33 -56|Paraguay -23.4 -58.4|Guyana 4.9 -58.9|Suriname 4 -56|Jamaika 18.1 -77.3|Haiti 19 -72.4|Dominikanische Republik 18.9 -70.5|El Salvador 13.8 -88.9|'
+'Australien -25 134|Neuseeland -41 174|Papua-Neuguinea -6.3 145|Fidschi -17.7 178';
const GEO_EASY='Deutschland,Frankreich,Spanien,Italien,Vereinigtes Königreich,Irland,Norwegen,Schweden,Finnland,Polen,Österreich,Schweiz,Griechenland,Türkei,Russland,China,Indien,Japan,Saudi-Arabien,Ägypten,Südafrika,Kenia,Nigeria,Marokko,Algerien,Brasilien,Argentinien,Chile,Peru,Kolumbien,Mexiko,Kanada,USA,Kuba,Australien,Neuseeland,Indonesien,Thailand,Iran,Island,Ukraine,Portugal,Niederlande,Dänemark,Äthiopien,Madagaskar,Kasachstan,Pakistan'.split(',');
const GEO_LAND=GEO_RAW.split('|').map(s=>{const m=s.match(/^(.+) (-?[\d.]+) (-?[\d.]+)$/);return {name:m[1],lat:+m[2],lon:+m[3]};});
GEO_LAND.forEach(c=>{c.easy=GEO_EASY.includes(c.name);});
const GEO_LEVELS={leicht:{name:'Leicht (bekannte Länder)'},alle:{name:'Alle Länder'}};

/* Grobe Umrisse der Landmassen als [Länge, Breite]-Paare */
const GEO_POLYS=[
  [[-168,66],[-162,70],[-141,70],[-128,70],[-115,68],[-95,72],[-85,70],[-80,63],[-93,58],[-85,55],[-80,51],[-78,58],[-70,60],[-62,58],[-56,52],[-66,45],[-70,42],[-74,40],[-76,35],[-81,31],[-80,26],[-83,29],[-90,30],[-97,27],[-98,22],[-95,18],[-90,21],[-87,21],[-88,16],[-83,15],[-83,10],[-78,8],[-80,7],[-85,10],[-92,15],[-98,16],[-105,20],[-110,24],[-113,31],[-117,32],[-121,35],[-124,40],[-124,48],[-130,55],[-140,60],[-152,59],[-160,56],[-165,60]],
  [[-73,78],[-60,82],[-30,83],[-20,78],[-20,70],[-40,65],[-44,60],[-52,64],[-58,75]],
  [[-77,8],[-72,12],[-62,10],[-52,5],[-50,0],[-35,-5],[-38,-13],[-41,-22],[-48,-26],[-54,-34],[-58,-38],[-65,-41],[-66,-47],[-69,-52],[-72,-54],[-75,-48],[-73,-38],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,-1],[-78,3]],
  [[-9,37],[-9,43],[-2,43.5],[-1,46],[-4,48],[2,51],[5,53],[8,54],[9,57],[11,58],[6,58],[5,62],[14,68],[20,70],[30,71],[41,67],[33,66],[40,64],[44,68],[60,69],[70,73],[80,73],[100,77],[113,74],[130,71],[150,71],[170,70],[180,68],[180,65],[170,60],[163,58],[156,51],[155,58],[142,59],[135,54],[141,52],[140,48],[132,43],[129,41],[129,35],[126,35],[126,38],[121,40],[119,37],[122,31],[120,25],[110,20],[108,21],[106,18],[109,12],[105,9],[100,13],[99,8],[103,1],[101,3],[98,8],[98,16],[94,17],[92,22],[87,21],[80,15],[78,8],[73,17],[72,22],[67,25],[57,25],[56,27],[50,30],[48,29],[52,24],[56,26],[58,23],[52,17],[43,13],[39,21],[35,28],[35,33],[36,36],[30,36],[27,37],[26,40],[29,41],[24,40],[23,36],[21,37],[20,40],[19,42],[14,45],[12,44],[14,42],[18,40],[16,38],[12,41],[9,44],[3,43],[0,39],[-2,37],[-6,36]],
  [[-17,21],[-13,28],[-6,36],[10,37],[11,33],[20,31],[32,31],[34,28],[43,12],[51,12],[45,2],[40,-3],[39,-8],[41,-15],[35,-24],[32,-29],[27,-34],[20,-35],[17,-30],[12,-18],[13,-9],[9,-1],[9,4],[4,6],[-8,4],[-13,8],[-17,14]],
  [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
  [[114,-22],[122,-18],[130,-12],[136,-12],[142,-11],[146,-19],[153,-26],[151,-34],[145,-39],[138,-35],[131,-31],[115,-34],[113,-26]],
  [[95,5],[98,4],[106,-3],[104,-6],[100,-2]],
  [[109,1],[117,7],[119,1],[116,-4],[110,-3]],
  [[131,-1],[141,-3],[150,-10],[142,-9],[138,-8]],
  [[105,-6],[114,-8],[106,-7.5]],
  [[130,33],[135,34],[140,36],[142,40],[140,41],[136,36],[131,35]],
  [[140,42],[145,43],[142,45]],
  [[-5,50],[1,51],[2,53],[-2,56],[-5,58],[-6,56],[-3,54],[-5,52]],
  [[-10,52],[-6,52],[-6,55],[-10,54]],
  [[-24,64],[-14,64],[-14,66],[-22,66]],
  [[173,-35],[178,-38],[175,-41],[173,-39]],
  [[172,-41],[174,-42],[170,-46],[167,-46]],
  [[120,18],[124,13],[126,7],[122,7],[120,14]]
];
/* Kartenausschnitt: Länge −180…180, Breite 85…−58 */
const GEO_W=800,GEO_LAT_TOP=85,GEO_LAT_BOT=-58,GEO_H=Math.round(GEO_W*(GEO_LAT_TOP-GEO_LAT_BOT)/360);
function geoXY(lat,lon){return [(lon+180)/360*GEO_W,(GEO_LAT_TOP-lat)/(GEO_LAT_TOP-GEO_LAT_BOT)*GEO_H];}
function geoLatLon(x,y){return [GEO_LAT_TOP-y/GEO_H*(GEO_LAT_TOP-GEO_LAT_BOT),x/GEO_W*360-180];}
function geoDist(lat1,lon1,lat2,lon2){
  const R=6371,rad=Math.PI/180,dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(a)));
}
function geoPoints(km){return Math.max(0,Math.round(1000*(1-km/4000)));}
function geoPickCountries(level,n,rnd){
  rnd=rnd||Math.random;
  const pool=GEO_LAND.filter(c=>level==='alle'||c.easy).map(c=>[rnd(),c]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  return pool.slice(0,n);
}
function geoLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(GEO_KEY)||'null');}catch(e){}if(!d||typeof d!=='object')d={};d.best=d.best&&typeof d.best==='object'?d.best:{};return d;}
function geoSave(d){try{localStorage.setItem(GEO_KEY,JSON.stringify(d));}catch(e){}}

/* ── Oberfläche ── */
let geo=null,geoLevel='leicht',geoData=null;
function geoInit(){geoData=geoLoad();geo=null;geoRender();}
function geoSetLevel(l){geoLevel=l;geoRender();}
function geoStart(){
  geo={level:geoLevel,list:geoPickCountries(geoLevel,GEO_ROUNDS),i:0,total:0,guess:null,km:0,pts:0,done:false};
  geoRender();
}
function geoRender(){
  const root=document.getElementById('geo-root');if(!root)return;
  const d=geoData||geoLoad();
  if(!geo){
    root.innerHTML=`<div class="lrn-card"><div class="lrn-label">Schwierigkeit</div><div class="lrn-chips">${Object.keys(GEO_LEVELS).map(k=>`<button type="button" class="lrn-chip ${geoLevel===k?'active':''}" onclick="geoSetLevel('${k}')">${GEO_LEVELS[k].name}${d.best[k]!=null?' · Best '+d.best[k]:''}</button>`).join('')}</div>
      <div style="font-size:13px;color:var(--text-2);margin:12px 0">Ein Land wird genannt, du klickst auf die Karte, wo es liegt. Je näher, desto mehr Punkte (max. 1000 je Land, ${GEO_ROUNDS} Länder pro Runde).</div>
      <button class="lrn-btn" onclick="geoStart()">▶ Runde starten</button></div>`;
    return;
  }
  if(geo.done){
    const rec=(d.best[geo.level]||0)===geo.total&&geo.total>0;
    root.innerHTML=`<div class="lrn-card" style="text-align:center"><div style="font-size:44px">${geo.total>=7500?'🏆':geo.total>=4500?'🌍':'🧭'}</div><div style="font-size:26px;font-weight:800">${geo.total} Punkte</div>
      <div style="font-size:13px;color:var(--text-2);margin:6px 0 14px">von ${GEO_ROUNDS*1000} möglichen${rec?' · 🏅 Bestwert':''}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="geoStart()">Nochmal</button><button class="lrn-btn ghost" onclick="geo=null;geoRender()">Menü</button></div></div>`;
    return;
  }
  const c=geo.list[geo.i];
  root.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><span class="game-chip">Land ${geo.i+1}/${GEO_ROUNDS}</span><span class="game-chip">⭐ <strong>${geo.total}</strong></span></div>
    <div style="text-align:center;font-size:22px;font-weight:800;margin-bottom:8px">Wo liegt <span style="color:var(--accent)">${escHtml(c.name)}</span>?</div>
    <canvas id="geo-canvas" width="${GEO_W}" height="${GEO_H}" style="display:block;width:100%;height:auto;border-radius:12px;background:#9ec9e8;cursor:crosshair;touch-action:none" onpointerdown="geoClick(event)"></canvas>
    <div id="geo-result" style="text-align:center;margin-top:10px;min-height:52px"></div>`;
  geoDraw();
}
function geoDraw(){
  const cv=document.getElementById('geo-canvas');if(!cv||!geo)return;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#9ec9e8';ctx.fillRect(0,0,GEO_W,GEO_H);
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=1;
  for(let lon=-150;lon<=150;lon+=30){const [x]=geoXY(0,lon);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,GEO_H);ctx.stroke();}
  for(let lat=-30;lat<=60;lat+=30){const [,y]=geoXY(lat,0);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(GEO_W,y);ctx.stroke();}
  ctx.fillStyle='#8fbf7a';ctx.strokeStyle='#5e8c4c';ctx.lineWidth=1.2;ctx.lineJoin='round';
  GEO_POLYS.forEach(p=>{ctx.beginPath();p.forEach((pt,i)=>{const [x,y]=geoXY(pt[1],pt[0]);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();ctx.fill();ctx.stroke();});
  if(geo.guess){
    const c=geo.list[geo.i],[gx,gy]=geoXY(geo.guess[0],geo.guess[1]),[tx,ty]=geoXY(c.lat,c.lon);
    ctx.strokeStyle='#e03131';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#1971c2';ctx.beginPath();ctx.arc(gx,gy,6,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#2f9e44';ctx.beginPath();ctx.arc(tx,ty,8,0,7);ctx.fill();ctx.stroke();
    ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.strokeText(c.name,tx,ty-14);ctx.fillStyle='#111';ctx.fillText(c.name,tx,ty-14);
  }
}
function geoClick(ev){
  if(!geo||geo.done||geo.guess)return;
  const cv=document.getElementById('geo-canvas'),r=cv.getBoundingClientRect();
  const x=(ev.clientX-r.left)*GEO_W/r.width,y=(ev.clientY-r.top)*GEO_H/r.height;
  geoGuess(geoLatLon(x,y));
}
function geoGuess(pos){
  const c=geo.list[geo.i];
  geo.guess=pos;geo.km=Math.round(geoDist(pos[0],pos[1],c.lat,c.lon));geo.pts=geoPoints(geo.km);geo.total+=geo.pts;
  geoDraw();
  const res=document.getElementById('geo-result');
  if(res)res.innerHTML=`<div style="font-size:15px;margin-bottom:8px"><b>${geo.km.toLocaleString('de-DE')} km</b> daneben · <b style="color:${geo.pts>=700?'#2f9e44':geo.pts>=300?'#f59f00':'#e03131'}">+${geo.pts}</b> Punkte</div><button class="lrn-btn" onclick="geoNext()">${geo.i+1>=GEO_ROUNDS?'Ergebnis':'Weiter'} ▶</button>`;
}
function geoNext(){
  if(!geo||!geo.guess)return;
  geo.i++;geo.guess=null;
  if(geo.i>=GEO_ROUNDS){
    geo.done=true;const d=geoLoad();if((d.best[geo.level]||0)<geo.total)d.best[geo.level]=geo.total;geoSave(d);geoData=d;
  }
  geoRender();
}
