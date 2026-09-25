/* ══════════════════════════════════
   TURMWACHT – Tower Defense: Stelle Türme neben den Weg, wehre 20 Wellen ab und verlasse dich nicht auf Glück.
   4 Turmarten (Pfeilturm, Kanone, Frostturm, Scharfschütze) mit je 3 Verbesserungen, 5 Gegnerarten (auch Flieger und Bosse),
   3 Karten (Sterne je Karte, nächste Karte wird freigeschaltet). Fortschritt je Konto: zf_td.
   Die Spiellogik (tdStep) läuft ohne Oberfläche; tests/check.js prüft sie und spielt eine Strategie durch.
══════════════════════════════════ */
const TD_COLS=16,TD_ROWS=9,TD_T=40,TD_W=TD_COLS*TD_T,TD_H=TD_ROWS*TD_T;
const TD_WAVES=20,TD_KEY='zf_td';
const TD_MAPS=[
  {id:'wiese',name:'Grüne Wiese',desc:'Ein gemütlicher Weg mit Kurven – perfekt zum Lernen.',lives:20,gold:200,hp:1.3,theme:0,path:[[-1,4],[3,4],[3,1],[8,1],[8,7],[12,7],[12,3],[16,3]]},
  {id:'schlucht',name:'Enge Schlucht',desc:'Kurzer Weg, wenig Platz – hier zählt jeder Turm.',lives:18,gold:210,hp:0.88,theme:1,path:[[-1,1],[13,1],[13,4],[2,4],[2,7],[16,7]]},
  {id:'schlange',name:'Serpentine',desc:'Ein langer Zickzackweg mit vielen Wendungen.',lives:16,gold:210,hp:1.05,theme:2,path:[[-1,7],[2,7],[2,1],[5,1],[5,7],[8,7],[8,1],[11,1],[11,7],[14,7],[14,4],[16,4]]}
];
const TD_TOWERS={
  arrow:{name:'Pfeilturm',icon:'🏹',color:'#8d6e63',cost:50,dmg:[8,14,24,40],range:[3.0,3.2,3.5,3.8],cd:[0.55,0.5,0.45,0.4],up:[40,80,150],air:true,desc:'Schnell, trifft Boden und Luft.'},
  cannon:{name:'Kanone',icon:'💣',color:'#546e7a',cost:90,dmg:[22,38,62,100],range:[2.6,2.8,3.0,3.2],cd:[1.5,1.4,1.3,1.2],splash:[1.0,1.1,1.2,1.3],up:[70,130,220],air:false,desc:'Flächenschaden, nur am Boden.'},
  frost:{name:'Frostturm',icon:'❄️',color:'#4fc3f7',cost:70,dmg:[1,2,3,4],range:[2.4,2.6,2.8,3.0],cd:[0.9,0.9,0.9,0.9],slow:[0.6,0.5,0.42,0.35],up:[50,90,150],air:true,desc:'Bremst alle Gegner in Reichweite.'},
  sniper:{name:'Scharfschütze',icon:'🎯',color:'#7e57c2',cost:140,dmg:[70,120,200,340],range:[6,6.5,7,7.5],cd:[2.4,2.2,2.0,1.8],up:[110,190,320],air:true,strong:true,desc:'Riesige Reichweite, zielt auf den Stärksten.'}
};
const TD_ENEMIES={
  grunt:{name:'Läufer',hp:30,speed:1.6,bounty:4,color:'#8bc34a',r:0.30,dmg:1},
  runner:{name:'Sprinter',hp:18,speed:2.8,bounty:3,color:'#ffb300',r:0.24,dmg:1},
  tank:{name:'Panzer',hp:140,speed:1.0,bounty:12,color:'#78909c',r:0.38,dmg:2},
  flyer:{name:'Flieger',hp:34,speed:2.0,bounty:5,color:'#ab47bc',r:0.28,dmg:1,air:true},
  boss:{name:'Boss',hp:1200,speed:0.9,bounty:70,color:'#d32f2f',r:0.5,dmg:5}
};
const TD_SPAWN_GAP={grunt:0.8,runner:0.5,tank:1.6,flyer:0.9,boss:3};
const TD_SELL=0.7;

/* ── Weg ── */
function tdCenter(p){return [p[0]+0.5,p[1]+0.5];}
function tdPathInfo(map){
  const pts=map.path.map(tdCenter),cum=[0];
  for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  const tiles={};
  for(let i=1;i<map.path.length;i++){
    const [a,b]=[map.path[i-1],map.path[i]];const dc=Math.sign(b[0]-a[0]),dr=Math.sign(b[1]-a[1]);
    let c=a[0],r=a[1];
    for(;;){tiles[c+','+r]=1;if(c===b[0]&&r===b[1])break;c+=dc;r+=dr;}
  }
  return {pts,cum,total:cum[cum.length-1],tiles};
}
function tdPointAt(info,d){
  d=Math.max(0,Math.min(info.total,d));
  let i=1;while(i<info.cum.length-1&&info.cum[i]<d)i++;
  const seg=info.cum[i]-info.cum[i-1]||1,t=(d-info.cum[i-1])/seg,a=info.pts[i-1],b=info.pts[i];
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
}

/* ── Wellen ── */
function tdHpMult(n){return Math.pow(1.17,n-1);}
function tdWaveCounts(n){
  const c={grunt:Math.round(6+n*1.9)};
  if(n>=3)c.runner=Math.round((n-1)*1.1);
  if(n>=4)c.tank=Math.floor((n-2)/1.6);
  if(n>=6)c.flyer=Math.floor((n-3)/1.3);
  if(n%10===0)c.boss=1;
  return c;
}
/* Zeitplan der Gegner einer Welle: [{t:Sekunde,type}] */
function tdWaveSchedule(n){
  const c=tdWaveCounts(n),offs={grunt:0,runner:2,tank:4,flyer:3,boss:6},out=[];
  Object.keys(c).forEach(k=>{for(let i=0;i<c[k];i++)out.push({t:offs[k]+i*TD_SPAWN_GAP[k],type:k});});
  return out.sort((a,b)=>a.t-b.t||(a.type<b.type?-1:1));
}

/* ── Zustand ── */
function tdNewState(mapId){
  const map=TD_MAPS.find(m=>m.id===mapId)||TD_MAPS[0],info=tdPathInfo(map);
  return {map,info,mapId:map.id,towers:[],enemies:[],wave:0,spawnQ:[],spawnT:0,gold:map.gold,lives:map.lives,maxLives:map.lives,time:0,fx:[],mode:'build',kills:0,nextId:1,leaked:0,stars:0,paused:false};
}
function tdTowerAt(st,c,r){return st.towers.find(t=>t.c===c&&t.r===r)||null;}
function tdCanPlace(st,c,r){return c>=0&&c<TD_COLS&&r>=0&&r<TD_ROWS&&!st.info.tiles[c+','+r]&&!tdTowerAt(st,c,r);}
function tdPlace(st,type,c,r){
  const d=TD_TOWERS[type];if(!d||!tdCanPlace(st,c,r)||st.gold<d.cost||st.mode==='won'||st.mode==='lost')return null;
  st.gold-=d.cost;const t={id:st.nextId++,type,c,r,lv:0,cd:0.2,spent:d.cost};st.towers.push(t);return t;
}
function tdUpgradeCost(t){const d=TD_TOWERS[t.type];return t.lv<3?d.up[t.lv]:0;}
function tdUpgrade(st,t){
  if(!t||t.lv>=3)return false;const c=tdUpgradeCost(t);if(st.gold<c)return false;
  st.gold-=c;t.spent+=c;t.lv++;return true;
}
function tdSell(st,t){
  const i=st.towers.indexOf(t);if(i<0)return 0;
  const g=Math.floor(t.spent*TD_SELL);st.gold+=g;st.towers.splice(i,1);return g;
}
function tdCanStartWave(st){return (st.mode==='build'||st.mode==='wave')&&st.wave<TD_WAVES&&st.spawnQ.length===0;}
function tdStartWave(st){
  if(!tdCanStartWave(st))return false;
  const early=st.enemies.length>0;   // vorzeitig gerufen: Bonus
  st.wave++;st.spawnQ=tdWaveSchedule(st.wave);st.spawnT=0;st.mode='wave';
  if(early)st.gold+=Math.round(6+st.wave);
  return true;
}
function tdSpawn(st,type){
  const b=TD_ENEMIES[type],n=st.wave,hp=Math.round(b.hp*tdHpMult(n)*(st.map.hp||1));
  st.enemies.push({id:st.nextId++,type,hp,maxHp:hp,d:0,slow:0,slowF:1,air:!!b.air,bounty:Math.round(b.bounty*(1+0.03*(n-1))),x:0,y:0,dead:false});
  const e=st.enemies[st.enemies.length-1];tdPlaceEnemy(st,e);
}
function tdPlaceEnemy(st,e){
  if(e.air){ // Flieger: Luftlinie vom Start zum Ziel
    const a=st.info.pts[0],b=st.info.pts[st.info.pts.length-1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,t=Math.min(1,e.d/L);
    e.x=a[0]+(b[0]-a[0])*t;e.y=a[1]+(b[1]-a[1])*t;e.total=L;
  }else{const p=tdPointAt(st.info,e.d);e.x=p[0];e.y=p[1];e.total=st.info.total;}
}

/* ── Ein Schritt (dt in Sekunden) ── */
function tdStep(st,dt){
  if(st.paused||st.mode==='won'||st.mode==='lost')return;
  st.time+=dt;
  st.fx.forEach(f=>{f.t-=dt;});st.fx=st.fx.filter(f=>f.t>0);
  // Gegner erscheinen
  if(st.spawnQ.length){st.spawnT+=dt;while(st.spawnQ.length&&st.spawnQ[0].t<=st.spawnT)tdSpawn(st,st.spawnQ.shift().type);}
  // Gegner bewegen
  st.enemies.forEach(e=>{
    if(e.slow>0){e.slow-=dt;if(e.slow<=0){e.slow=0;e.slowF=1;}}
    e.d+=TD_ENEMIES[e.type].speed*e.slowF*dt;
    tdPlaceEnemy(st,e);
    if(e.d>=e.total){e.dead=true;e.leaked=true;st.lives-=TD_ENEMIES[e.type].dmg;st.leaked++;}
  });
  // Türme schießen
  st.towers.forEach(t=>{
    const d=TD_TOWERS[t.type];t.cd-=dt;if(t.cd>0)return;
    const range=d.range[t.lv],cx=t.c+0.5,cy=t.r+0.5;
    const inR=st.enemies.filter(e=>!e.dead&&(d.air||!e.air)&&Math.hypot(e.x-cx,e.y-cy)<=range);
    if(!inR.length)return;
    t.cd=d.cd[t.lv];
    if(t.type==='frost'){
      inR.forEach(e=>{e.hp-=d.dmg[t.lv];e.slow=1.6;e.slowF=Math.min(e.slowF,d.slow[t.lv]);if(e.hp<=0)e.dead=true;});
      st.fx.push({k:'nova',x:cx,y:cy,r:range,t:0.25,max:0.25});
      return;
    }
    const target=d.strong?inR.reduce((a,b)=>b.hp>a.hp?b:a):inR.reduce((a,b)=>b.d>a.d?b:a);
    if(t.type==='cannon'){
      const sp=d.splash[t.lv];
      st.enemies.forEach(e=>{if(!e.dead&&!e.air&&Math.hypot(e.x-target.x,e.y-target.y)<=sp){e.hp-=d.dmg[t.lv];if(e.hp<=0)e.dead=true;}});
      st.fx.push({k:'boom',x:target.x,y:target.y,r:sp,t:0.3,max:0.3});
    }else{
      target.hp-=d.dmg[t.lv];if(target.hp<=0)target.dead=true;
    }
    st.fx.push({k:'shot',x:cx,y:cy,x2:target.x,y2:target.y,c:d.color,t:0.12,max:0.12});
  });
  // Tote entfernen, Beute
  st.enemies=st.enemies.filter(e=>{
    if(!e.dead)return true;
    if(!e.leaked){st.gold+=e.bounty;st.kills++;st.fx.push({k:'gold',x:e.x,y:e.y,txt:'+'+e.bounty,t:0.7,max:0.7});}
    return false;
  });
  // Ende der Welle / des Spiels
  if(st.lives<=0){st.lives=0;st.mode='lost';return;}
  if(st.mode==='wave'&&st.spawnQ.length===0&&st.enemies.length===0){
    if(st.wave>=TD_WAVES){st.mode='won';st.stars=st.lives>=Math.ceil(st.maxLives*0.75)?3:st.lives>=Math.ceil(st.maxLives*0.4)?2:1;}
    else{st.mode='build';st.gold+=20+2*st.wave;}   // Bonus für die geschaffte Welle
  }
}

/* ── Fortschritt je Konto ── */
function tdAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function tdProfAll(){try{const o=JSON.parse(localStorage.getItem(TD_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function tdProf(){
  const all=tdProfAll(),k=tdAccount().toLowerCase()||'_gast',p=all[k]||{};
  return {name:tdAccount(),maps:p.maps&&typeof p.maps==='object'?p.maps:{},wins:p.wins|0};
}
function tdSaveProf(p){const all=tdProfAll();all[tdAccount().toLowerCase()||'_gast']=p;try{localStorage.setItem(TD_KEY,JSON.stringify(all));}catch(e){}}
function tdUnlocked(p,i){return i===0||!!(p.maps[TD_MAPS[i-1].id]&&p.maps[TD_MAPS[i-1].id].stars>0);}
/* Ergebnis eintragen: Sterne, beste Welle, einmalige AppHub-Coins */
function tdFinish(st){
  if(st.reported||(st.mode!=='won'&&st.mode!=='lost'))return null;
  st.reported=true;
  const p=tdProf(),m=p.maps[st.mapId]||(p.maps[st.mapId]={stars:0,best:0});
  const prevStars=m.stars;m.best=Math.max(m.best,st.mode==='won'?TD_WAVES:Math.max(0,st.wave-1));
  let coins=0;
  if(st.mode==='won'){m.stars=Math.max(m.stars,st.stars);p.wins++;coins=(prevStars===0?10:0)+Math.max(0,st.stars-prevStars)*4;}
  else coins=0;
  tdSaveProf(p);
  if(coins>0){try{const name=tdAccount();if(name&&typeof zcAddCoins==='function'){zcAddCoins(name,coins);if(typeof smSave==='function')smSave('zentrale');}else coins=0;}catch(e){coins=0;}}
  st.coinsEarned=coins;return {coins,stars:m.stars};
}

/* ══ Zeichnen ══ */
const TD_THEMES=[{g1:'#7cb668',g2:'#71ab5f',path:'#c9b27c',edge:'#a89060',deco:'#3f7f3a'},{g1:'#c9a06b',g2:'#bf9760',path:'#8d7a63',edge:'#6f5e4c',deco:'#8a6b3f'},{g1:'#7fa3b8',g2:'#759aaf',path:'#d7d0bd',edge:'#b3ab97',deco:'#3f6b7f'}];
let td=null,tdRaf=null,tdLast=0,tdAcc=0,tdSel=null,tdBuild='arrow',tdHover=null,tdSpeed=1,tdView='menu',tdMsg='';
function tdRR(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function tdDraw(ctx,st){
  const th=TD_THEMES[st.map.theme]||TD_THEMES[0];
  for(let r=0;r<TD_ROWS;r++)for(let c=0;c<TD_COLS;c++){
    const path=st.info.tiles[c+','+r];
    ctx.fillStyle=path?th.path:((c+r)%2?th.g1:th.g2);ctx.fillRect(c*TD_T,r*TD_T,TD_T,TD_T);
    if(path){ctx.fillStyle=th.edge;ctx.fillRect(c*TD_T,r*TD_T,TD_T,2);ctx.fillRect(c*TD_T,r*TD_T+TD_T-2,TD_T,2);}
    else if((c*7+r*13)%11===0&&!tdTowerAt(st,c,r)){ctx.fillStyle=th.deco;ctx.beginPath();ctx.arc(c*TD_T+20,r*TD_T+22,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(c*TD_T+18,r*TD_T+28,4,7);}
  }
  // Ziel-Markierung und Start
  const e0=st.info.pts[st.info.pts.length-1];ctx.fillStyle='rgba(211,47,47,0.25)';ctx.fillRect(Math.min(TD_COLS-1,Math.floor(e0[0]))*TD_T,Math.floor(e0[1])*TD_T,TD_T,TD_T);
  // Auswahl: Reichweite
  const selT=tdSel?st.towers.find(t=>t.id===tdSel):null;
  const rangeOf=(type,lv)=>TD_TOWERS[type].range[lv];
  if(selT){ctx.fillStyle='rgba(255,255,255,0.18)';ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc((selT.c+0.5)*TD_T,(selT.r+0.5)*TD_T,rangeOf(selT.type,selT.lv)*TD_T,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else if(tdHover&&tdBuild&&tdCanPlace(st,tdHover[0],tdHover[1])){
    const ok=st.gold>=TD_TOWERS[tdBuild].cost;
    ctx.fillStyle=ok?'rgba(255,255,255,0.18)':'rgba(255,82,82,0.2)';ctx.strokeStyle=ok?'rgba(255,255,255,0.7)':'rgba(255,82,82,0.8)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc((tdHover[0]+0.5)*TD_T,(tdHover[1]+0.5)*TD_T,rangeOf(tdBuild,0)*TD_T,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.globalAlpha=0.6;tdDrawTower(ctx,tdBuild,0,tdHover[0]*TD_T,tdHover[1]*TD_T);ctx.globalAlpha=1;
  }
  // Türme
  st.towers.forEach(t=>{tdDrawTower(ctx,t.type,t.lv,t.c*TD_T,t.r*TD_T);if(t.id===tdSel){ctx.strokeStyle='#ffeb3b';ctx.lineWidth=3;tdRR(ctx,t.c*TD_T+2,t.r*TD_T+2,TD_T-4,TD_T-4,8);ctx.stroke();}});
  // Effekte unter den Gegnern
  st.fx.forEach(f=>{
    const k=f.t/f.max;
    if(f.k==='nova'){ctx.strokeStyle='rgba(129,212,250,'+(0.8*k)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(f.x*TD_T,f.y*TD_T,f.r*TD_T*(1-k*0.4),0,Math.PI*2);ctx.stroke();}
    else if(f.k==='boom'){ctx.fillStyle='rgba(255,152,0,'+(0.55*k)+')';ctx.beginPath();ctx.arc(f.x*TD_T,f.y*TD_T,f.r*TD_T*(1.1-k*0.3),0,Math.PI*2);ctx.fill();}
  });
  // Gegner
  st.enemies.slice().sort((a,b)=>a.y-b.y).forEach(e=>{
    const b=TD_ENEMIES[e.type],x=e.x*TD_T,y=e.y*TD_T,r=b.r*TD_T;
    if(e.air){ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(x,y+r+6,r*0.8,r*0.35,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=e.slow>0?'#81d4fa':b.color;
    if(e.type==='flyer'){ctx.beginPath();ctx.moveTo(x-r*1.2,y);ctx.lineTo(x,y-r);ctx.lineTo(x+r*1.2,y);ctx.lineTo(x,y+r*0.6);ctx.fill();}
    else if(e.type==='tank'||e.type==='boss'){tdRR(ctx,x-r,y-r*0.8,r*2,r*1.6,4);ctx.fill();ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(x-r*0.2,y-r*0.2,r*1.2,r*0.4);}
    else{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-r*0.3,y-r*0.2,2.2,0,Math.PI*2);ctx.arc(x+r*0.3,y-r*0.2,2.2,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1;
    // Lebensleiste
    const w=Math.max(16,r*2);ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(x-w/2,y-r-9,w,4);ctx.fillStyle=e.hp/e.maxHp>0.5?'#66bb6a':e.hp/e.maxHp>0.25?'#ffca28':'#ef5350';ctx.fillRect(x-w/2,y-r-9,w*Math.max(0,e.hp/e.maxHp),4);
  });
  // Schüsse und Gold-Texte
  st.fx.forEach(f=>{
    const k=f.t/f.max;
    if(f.k==='shot'){ctx.strokeStyle=f.c;ctx.lineWidth=2.5;ctx.globalAlpha=k;ctx.beginPath();ctx.moveTo(f.x*TD_T,f.y*TD_T);ctx.lineTo(f.x2*TD_T,f.y2*TD_T);ctx.stroke();ctx.globalAlpha=1;}
    else if(f.k==='gold'){ctx.globalAlpha=k;ctx.fillStyle='#ffe082';ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=3;ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.strokeText(f.txt,f.x*TD_T,f.y*TD_T-14-(1-k)*18);ctx.fillText(f.txt,f.x*TD_T,f.y*TD_T-14-(1-k)*18);ctx.globalAlpha=1;}
  });
}
function tdDrawTower(ctx,type,lv,x,y){
  const d=TD_TOWERS[type];
  ctx.fillStyle='rgba(0,0,0,0.25)';tdRR(ctx,x+5,y+8,TD_T-8,TD_T-8,9);ctx.fill();
  ctx.fillStyle=d.color;tdRR(ctx,x+4,y+4,TD_T-8,TD_T-8,9);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=2;ctx.stroke();
  ctx.font='19px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(d.icon,x+TD_T/2,y+TD_T/2+1);
  for(let i=0;i<lv;i++){ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(x+9+i*8,y+TD_T-7,2.6,0,Math.PI*2);ctx.fill();}
  ctx.textBaseline='alphabetic';
}

/* ══ Oberfläche ══ */
function tdEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function tdRoot(){return document.getElementById('td-root');}
function tdActive(){const s=document.getElementById('screen-td');return !!s&&s.classList.contains('active');}
function tdInit(){
  if(tdRaf){cancelAnimationFrame(tdRaf);tdRaf=null;}
  tdView='menu';td=null;tdSel=null;tdMsg='';tdRenderView();
}
function tdShowMenu(){if(tdRaf){cancelAnimationFrame(tdRaf);tdRaf=null;}tdView='menu';td=null;tdSel=null;tdRenderView();}
function tdStartMap(id){
  const p=tdProf(),i=TD_MAPS.findIndex(m=>m.id===id);if(i<0||!tdUnlocked(p,i))return;
  td=tdNewState(id);tdSel=null;tdBuild='arrow';tdSpeed=1;tdView='game';tdRenderView();
  tdLast=0;tdAcc=0;tdRaf=requestAnimationFrame(tdLoop);
}
function tdRestart(){if(td)tdStartMap(td.mapId);}
function tdRenderView(){
  const root=tdRoot();if(!root)return;
  if(tdView==='menu'){
    const p=tdProf();
    root.innerHTML=`<div style="text-align:center;margin-bottom:14px"><div style="font-size:13px;color:var(--text-3)">Platziere Türme neben dem Weg und halte 20 Wellen durch. Erreicht ein Gegner das Ziel, verlierst du Leben.</div></div>`
      +TD_MAPS.map((m,i)=>{const u=tdUnlocked(p,i),st=(p.maps[m.id]||{}).stars||0,best=(p.maps[m.id]||{}).best||0;
        return `<div class="lrn-card" style="margin-bottom:10px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;${u?'':'opacity:.55'}"><canvas class="td-thumb" data-map="${m.id}" width="160" height="90" style="border-radius:10px;flex:none"></canvas>
          <div style="flex:1;min-width:150px"><div style="font-weight:800;font-size:16px">${u?'':'🔒 '}${tdEsc(m.name)}</div><div style="font-size:12px;color:var(--text-3);margin:2px 0 6px">${tdEsc(m.desc)}</div>
            <div style="font-size:13px"><span style="color:#f59f00;letter-spacing:2px">${'★'.repeat(st)}${'☆'.repeat(3-st)}</span> <span style="color:var(--text-3);font-size:11px;margin-left:6px">Beste Welle ${best}/${TD_WAVES} · ❤️ ${m.lives} · 💰 ${m.gold}</span></div></div>
          <button class="lrn-btn" ${u?'':'disabled'} onclick="tdStartMap('${m.id}')">${u?'Spielen':'Gesperrt'}</button></div>`;}).join('')
      +`<div class="lrn-card" style="margin-top:12px"><div class="lrn-label">Türme</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">${Object.keys(TD_TOWERS).map(k=>{const t=TD_TOWERS[k];return `<div style="font-size:12px"><b>${t.icon} ${t.name}</b> · ${t.cost} 💰<div style="color:var(--text-3)">${t.desc}</div></div>`;}).join('')}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:10px">🪙 AppHub-Coins: 10 für den ersten Sieg auf einer Karte, 4 für jeden neuen Stern.</div></div>`;
    root.querySelectorAll('.td-thumb').forEach(cv=>{const m=TD_MAPS.find(x=>x.id===cv.dataset.map),s=tdNewState(m.id),c=cv.getContext('2d');c.save();c.scale(cv.width/TD_W,cv.height/TD_H);tdDraw(c,s);c.restore();});
    return;
  }
  root.innerHTML=`<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:10px">
      <span class="game-chip">❤️ <strong id="td-lives">${td.lives}</strong></span><span class="game-chip">💰 <strong id="td-gold">${td.gold}</strong></span><span class="game-chip">🌊 <strong id="td-wave">0</strong>/${TD_WAVES}</span>
      <button class="lrn-btn" id="td-next" onclick="tdNextWave()">▶ Welle 1</button>
      <button class="lrn-btn ghost" id="td-speed" onclick="tdToggleSpeed()">⏩ ×1</button><button class="lrn-btn ghost" id="td-pause" onclick="tdTogglePause()">⏸</button><button class="lrn-btn ghost" onclick="tdShowMenu()">☰ Karten</button></div>
    <div style="position:relative;max-width:640px;margin:0 auto"><canvas id="td-canvas" width="${TD_W}" height="${TD_H}" style="display:block;width:100%;height:auto;border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,0.25);cursor:crosshair;touch-action:none"></canvas><div id="td-over"></div></div>
    <div id="td-shop" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:640px;margin:12px auto 0">${Object.keys(TD_TOWERS).map((k,i)=>`<button class="td-tbtn" id="td-t-${k}" onclick="tdPickTower('${k}')"><span style="font-size:22px">${TD_TOWERS[k].icon}</span><b>${TD_TOWERS[k].name}</b><small>${TD_TOWERS[k].cost} 💰 · Taste ${i+1}</small></button>`).join('')}</div>
    <div id="td-info" class="lrn-card" style="max-width:640px;margin:10px auto 0;min-height:64px"></div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:8px">Klick auf ein freies Feld = Turm bauen · Klick auf einen Turm = verbessern oder verkaufen · Leertaste = nächste Welle · P = Pause</div>`;
  const cv=document.getElementById('td-canvas');
  cv.onpointerdown=tdPointer;cv.onpointermove=tdMove;cv.onpointerleave=()=>{tdHover=null;};cv.oncontextmenu=e=>{e.preventDefault();tdSel=null;tdBuild=null;return false;};
  tdLastInfo='';tdUpdateHud(true);
}
function tdTilePos(e){const cv=document.getElementById('td-canvas'),r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*TD_W/r.width,y=(e.clientY-r.top)*TD_H/r.height;return [Math.floor(x/TD_T),Math.floor(y/TD_T)];}
function tdMove(e){tdHover=tdTilePos(e);}
function tdPointer(e){
  if(!td||td.mode==='won'||td.mode==='lost')return;
  const [c,r]=tdTilePos(e),t=tdTowerAt(td,c,r);
  tdHover=[c,r];
  if(t){tdSel=t.id;tdUpdateHud(true);return;}
  if(tdBuild&&tdCanPlace(td,c,r)){
    if(td.gold<TD_TOWERS[tdBuild].cost){tdMsg='Nicht genug Gold.';tdFlash();return;}
    const nt=tdPlace(td,tdBuild,c,r);if(nt){tdSel=nt.id;try{if(typeof sfx==='function')sfx('place');}catch(_){}}
  }else tdSel=null;
  tdUpdateHud(true);
}
function tdFlash(){const i=document.getElementById('td-info');if(i){i.innerHTML=`<div style="color:#ff3b30;font-weight:700;text-align:center">${tdEsc(tdMsg)}</div>`;setTimeout(()=>{tdLastInfo='';tdUpdateHud(true);},900);}}
function tdPickTower(k){tdBuild=k;tdSel=null;tdUpdateHud(true);}
function tdNextWave(){if(td&&tdStartWave(td))tdUpdateHud(true);}
function tdToggleSpeed(){tdSpeed=tdSpeed===1?2:tdSpeed===2?3:1;tdUpdateHud(true);}
function tdTogglePause(){if(td){td.paused=!td.paused;tdUpdateHud(true);}}
function tdUpgradeSel(){const t=td&&td.towers.find(x=>x.id===tdSel);if(t&&tdUpgrade(td,t))tdUpdateHud(true);}
function tdSellSel(){const t=td&&td.towers.find(x=>x.id===tdSel);if(t){tdSell(td,t);tdSel=null;tdUpdateHud(true);}}
let tdLastInfo='';
function tdUpdateHud(force){
  if(!td)return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=v;};
  set('td-lives',td.lives);set('td-gold',td.gold);set('td-wave',td.wave);
  const nb=document.getElementById('td-next');
  if(nb){const can=tdCanStartWave(td),txt=td.wave>=TD_WAVES?'Letzte Welle':(td.spawnQ.length?'Welle läuft …':'▶ Welle '+(td.wave+1)+(td.enemies.length?' (früh +'+(6+td.wave+1)+'💰)':''));if(nb.textContent!==txt)nb.textContent=txt;nb.disabled=!can;}
  set('td-speed','⏩ ×'+tdSpeed);set('td-pause',td.paused?'▶':'⏸');
  Object.keys(TD_TOWERS).forEach(k=>{const b=document.getElementById('td-t-'+k);if(b){b.classList.toggle('active',tdBuild===k&&!tdSel);b.classList.toggle('poor',td.gold<TD_TOWERS[k].cost);}});
  const info=document.getElementById('td-info');
  if(info){
    const t=tdSel?td.towers.find(x=>x.id===tdSel):null;let html;
    if(t){const d=TD_TOWERS[t.type],up=tdUpgradeCost(t);
      html=`<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div style="font-size:30px">${d.icon}</div><div style="flex:1;min-width:150px"><div style="font-weight:800">${d.name} <span style="color:#f59f00">${'★'.repeat(t.lv+1)}</span></div>
        <div style="font-size:12px;color:var(--text-3)">Schaden ${d.dmg[t.lv]} · Reichweite ${d.range[t.lv]} · alle ${d.cd[t.lv]} s${d.splash?' · Fläche '+d.splash[t.lv]:''}${d.slow?' · Tempo ×'+d.slow[t.lv]:''}</div></div>
        ${t.lv<3?`<button class="lrn-btn ${td.gold<up?'poor':''}" ${td.gold<up?'disabled':''} onclick="tdUpgradeSel()">⬆ Verbessern ${up} 💰</button>`:'<span class="lrn-pill">Maximal</span>'}
        <button class="lrn-btn ghost" onclick="tdSellSel()">Verkaufen +${Math.floor(t.spent*TD_SELL)} 💰</button></div>`;}
    else{const d=tdBuild?TD_TOWERS[tdBuild]:null;html=d?`<div style="font-size:13px"><b>${d.icon} ${d.name}</b> – ${d.desc}<div style="font-size:12px;color:var(--text-3);margin-top:2px">Schaden ${d.dmg[0]} · Reichweite ${d.range[0]} · alle ${d.cd[0]} s. Klicke auf ein freies Feld, um ihn zu bauen.</div></div>`:'<div style="font-size:13px;color:var(--text-3)">Wähle unten einen Turm aus.</div>';}
    if(force||html!==tdLastInfo){info.innerHTML=html;tdLastInfo=html;}
  }
  const over=document.getElementById('td-over');
  if(over&&(td.mode==='won'||td.mode==='lost')&&!over.innerHTML){
    const r=tdFinish(td)||{coins:td.coinsEarned||0};
    over.innerHTML=`<div class="td-over"><div style="font-size:44px">${td.mode==='won'?'🏆':'💥'}</div><div style="font-size:22px;font-weight:800">${td.mode==='won'?'Alle Wellen geschafft!':'Die Basis ist gefallen'}</div>
      <div style="font-size:14px;margin:6px 0">${td.mode==='won'?'<span style="color:#ffca28;font-size:24px;letter-spacing:4px">'+'★'.repeat(td.stars)+'☆'.repeat(3-td.stars)+'</span><br>':''}Welle ${Math.max(0,td.mode==='won'?TD_WAVES:td.wave-1)}/${TD_WAVES} · ${td.kills} Gegner besiegt${r.coins?'<br>🪙 +'+r.coins+' AppHub-Coins':''}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="tdRestart()">Nochmal</button><button class="lrn-btn ghost" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)" onclick="tdShowMenu()">Karten</button></div></div>`;
  }
}
function tdLoop(ts){
  if(!tdActive()||!td||tdView!=='game'){tdRaf=null;return;}
  if(!tdLast)tdLast=ts;
  tdAcc+=Math.min(100,ts-tdLast);tdLast=ts;
  while(tdAcc>=1000/60){tdStep(td,(1/60)*tdSpeed);tdAcc-=1000/60;}
  const cv=document.getElementById('td-canvas');if(cv)tdDraw(cv.getContext('2d'),td);
  tdUpdateHud(false);
  tdRaf=requestAnimationFrame(tdLoop);
}
document.addEventListener('keydown',e=>{
  if(!tdActive()||!td||tdView!=='game')return;
  if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  const k=e.key,keys=Object.keys(TD_TOWERS);
  if(/^[1-4]$/.test(k)){tdPickTower(keys[+k-1]);e.preventDefault();}
  else if(k===' '||k==='n'||k==='N'){tdNextWave();e.preventDefault();}
  else if(k==='p'||k==='P'){tdTogglePause();e.preventDefault();}
  else if(k==='u'||k==='U'){tdUpgradeSel();e.preventDefault();}
  else if(k==='s'||k==='S'||k==='Delete'){tdSellSel();e.preventDefault();}
  else if(k==='f'||k==='F'){tdToggleSpeed();e.preventDefault();}
  else if(k==='Escape'){tdSel=null;tdUpdateHud(true);e.preventDefault();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&td&&td.mode==='wave'&&!td.paused&&tdActive()){td.paused=true;tdUpdateHud(true);}});
