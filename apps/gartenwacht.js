/* ══════════════════════════════════
   GARTENWACHT – Pflanzen gegen Zombies. Fünf Beete, Zombiewellen von rechts, links steht dein Haus (mit einem Rasenmäher je Beet als
   letzte Rettung). Du sammelst Sonne (fällt vom Himmel, Sonnenblumen machen mehr) und pflanzt damit Verteidiger. 9 Pflanzen, 7 Zombiearten,
   10 Level mit Boss. Nach jedem Level kommt eine neue Pflanze dazu, ab 7 Pflanzen wählst du 6 aus. Sterne: 3 ohne Rasenmäher, 2 mit höchstens
   zwei, sonst 1. AppHub-Coins einmalig für das erste Schaffen und für neue Sterne. Fortschritt je Konto: zf_garten
   Die Spielregeln (gwStep) sind von der Oberfläche getrennt; tests/gw-bot.js spielt jedes Level mit einer einfachen Strategie durch.
══════════════════════════════════ */
const GW_KEY='zf_garten';
const GW_COLS=9,GW_ROWS=5;
const GW_PLANTS={
  sunflower:{name:'Sonnenblume',icon:'🌻',cost:50,cd:7.5,hp:300,desc:'Erzeugt alle 20 s Sonne (25).'},
  peashooter:{name:'Erbsenschütze',icon:'🌱',cost:100,cd:7.5,hp:300,desc:'Schießt Erbsen auf Zombies im Beet.'},
  wallnut:{name:'Nuss',icon:'🥜',cost:50,cd:30,hp:4000,desc:'Riesige Mauer: hält lange stand.'},
  cherry:{name:'Kirschbombe',icon:'🍒',cost:150,cd:50,hp:300,desc:'Explodiert nach 1 s: vernichtet alle Zombies im 3×3-Feld.'},
  snow:{name:'Schnee-Erbse',icon:'❄️',cost:175,cd:7.5,hp:300,desc:'Erbsen, die Zombies verlangsamen.'},
  mine:{name:'Kartoffelmine',icon:'🥔',cost:25,cd:30,hp:300,desc:'Scharf nach 14 s, sprengt den ersten Zombie, der sie berührt.'},
  repeater:{name:'Doppelschütze',icon:'🌿',cost:200,cd:7.5,hp:300,desc:'Zwei Erbsen auf einmal.'},
  chomper:{name:'Chomper',icon:'🪴',cost:150,cd:7.5,hp:300,desc:'Verschlingt einen Zombie, kaut dann 40 s.'},
  spikes:{name:'Stachelgras',icon:'🌵',cost:100,cd:7.5,hp:300,desc:'Zombies laufen darüber und nehmen Schaden.'}
};
const GW_ORDER=['sunflower','peashooter','wallnut','cherry','snow','mine','repeater','chomper','spikes'];   // Reihenfolge der Freischaltung
const GW_ZOMBIES={
  zombie:{name:'Zombie',hp:200,speed:0.21,icon:'🧟'},
  flag:{name:'Flaggenzombie',hp:200,speed:0.31,icon:'🧟',acc:'flag'},
  cone:{name:'Hütchenzombie',hp:400,speed:0.21,icon:'🧟',acc:'cone'},
  bucket:{name:'Eimerzombie',hp:800,speed:0.21,icon:'🧟',acc:'bucket'},
  runner:{name:'Sprinter',hp:260,speed:0.45,icon:'🧟',acc:'pole',vault:true},
  screen:{name:'Türzombie',hp:700,speed:0.21,icon:'🧟',acc:'door'},
  boss:{name:'Zombie-König',hp:3500,speed:0.1,icon:'🧟',acc:'crown',boss:true,scale:1.7}
};
const GW_PEA_DMG=25,GW_PEA_SPEED=6,GW_SHOT_GAP=1.3,GW_SUN_VALUE=25,GW_SKY_GAP=8,GW_FLOWER_GAP=20,GW_BLAST=1800,GW_MOWER_SPEED=5;

/* ── Level: Zombies werden aus [Art, Anzahl, von s, bis s] zufällig auf die Beete verteilt, „big“ = riesige Welle zu diesen Zeiten ── */
const GW_LEVELS=[
  {id:'g1',name:'Vorgarten',sky:true,sun:50,spawn:[['zombie',6,35,115]]},
  {id:'g2',name:'Garten',sky:true,sun:50,spawn:[['zombie',7,30,125],['cone',1,90,125]]},
  {id:'g3',name:'Hinterhof',sky:true,sun:75,spawn:[['zombie',8,30,135],['cone',3,60,135],['flag',1,110,110]],big:[110]},
  {id:'g4',name:'Nachtwache',sky:true,skyGap:16,sun:200,spawn:[['zombie',8,30,140],['cone',4,55,140],['flag',1,115,115]],big:[115]},
  {id:'g5',name:'Dachgarten',sky:true,sun:100,spawn:[['zombie',6,30,145],['cone',3,50,145],['bucket',2,95,145],['flag',1,120,120]],big:[120]},
  {id:'g6',name:'Terrasse',sky:true,sun:100,spawn:[['zombie',5,30,155],['cone',3,50,155],['runner',2,75,155],['bucket',1,105,155],['flag',1,130,130]],big:[130]},
  {id:'g7',name:'Kellergarten',sky:true,skyGap:14,sun:250,spawn:[['zombie',6,30,160],['cone',3,50,160],['screen',3,85,160],['bucket',2,105,160],['flag',1,135,135]],big:[135]},
  {id:'g8',name:'Nebelfeld',sky:true,skyGap:14,sun:250,spawn:[['zombie',7,30,170],['cone',4,45,170],['runner',2,70,170],['screen',2,95,170],['bucket',1,110,170],['flag',2,110,155]],big:[110,155]},
  {id:'g9',name:'Großer Angriff',sky:true,sun:150,spawn:[['zombie',8,25,175],['cone',4,40,175],['runner',2,65,175],['screen',2,85,175],['bucket',2,105,175],['flag',2,100,145]],big:[100,145]},
  {id:'g10',name:'Zombie-König',sky:true,sun:150,spawn:[['zombie',7,25,165],['cone',3,40,165],['screen',2,75,165],['bucket',2,95,165],['boss',1,125,125],['flag',2,115,150]],big:[115,150]}
];

/* ── Zufall (immer gleicher Ablauf bei gleichem Startwert) ── */
function gwRng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
/* Zeitplan eines Levels: Liste [Sekunde, Art, Beet], sortiert */
function gwSchedule(level,seed){
  const r=gwRng((seed||1)*7919+level.id.charCodeAt(1)*131+(level.id.length>2?level.id.charCodeAt(2):0)),list=[];
  level.spawn.forEach(([type,n,t0,t1])=>{for(let i=0;i<n;i++)list.push([Math.round((t0+(n>1?(t1-t0)*(i+r()*0.6)/n:0))*10)/10,type,Math.floor(r()*GW_ROWS)]);});
  (level.big||[]).forEach(t=>{const lanes=[0,1,2,3,4].sort(()=>r()-0.5);for(let i=0;i<3;i++)list.push([t+i*0.4,i===0?'flag':'zombie',lanes[i]]);});
  return list.sort((a,b)=>a[0]-b[0]);
}
/* ── Spielzustand ── */
function gwNewState(levelIdx,allowed,seed){
  const level=GW_LEVELS[levelIdx];
  const st={level,levelIdx,allowed:allowed.slice(),seed:seed||1,rng:gwRng((seed||1)*104729+levelIdx),t:0,sun:level.sun,mode:'play',plants:[],zombies:[],peas:[],suns:[],effects:[],cool:{},
    mowers:[0,1,2,3,4].map(r=>({row:r,x:0,active:false,used:false})),schedule:gwSchedule(level,seed||1),si:0,skyT:level.sky?4+(level.skyGap||GW_SKY_GAP)*0.4:1e9,nextId:1,mowersUsed:0,killed:0,banner:'',bannerT:0,total:0};
  for(let r=0;r<GW_ROWS;r++)st.plants.push(new Array(GW_COLS).fill(null));
  st.total=st.schedule.length;GW_ORDER.forEach(k=>{st.cool[k]=0;});
  return st;
}
function gwPlantAt(st,row,col){return row>=0&&row<GW_ROWS&&col>=0&&col<GW_COLS?st.plants[row][col]:null;}
function gwCanPlant(st,type,row,col){
  if(st.mode!=='play'||!GW_PLANTS[type]||!st.allowed.includes(type))return false;
  if(row<0||row>=GW_ROWS||col<0||col>=GW_COLS||st.plants[row][col])return false;
  return st.sun>=GW_PLANTS[type].cost&&st.cool[type]<=0;
}
function gwPlace(st,type,row,col){
  if(!gwCanPlant(st,type,row,col))return null;
  const d=GW_PLANTS[type];st.sun-=d.cost;st.cool[type]=d.cd;
  const p={type,row,col,hp:d.hp,maxHp:d.hp,t:0,shot:0,burst:0,state:type==='mine'?'arming':type==='chomper'?'ready':type==='cherry'?'fuse':'',timer:0,id:st.nextId++};
  if(type==='sunflower')p.timer=6+st.rng()*6;
  if(type==='mine')p.timer=14;if(type==='cherry')p.timer=1;
  st.plants[row][col]=p;return p;
}
function gwShovel(st,row,col){const p=gwPlantAt(st,row,col);if(!p||st.mode!=='play')return false;st.plants[row][col]=null;return true;}
function gwCollect(st,id){const i=st.suns.findIndex(s=>s.id===id);if(i<0)return 0;const v=st.suns[i].value;st.sun+=v;st.suns.splice(i,1);return v;}
function gwSpawnSun(st,x,y,value,auto){st.suns.push({id:st.nextId++,x,y,ty:y,value,life:auto?9:11,auto:!!auto,age:0});}
function gwAddZombie(st,type,row,x){
  const d=GW_ZOMBIES[type];
  st.zombies.push({id:st.nextId++,type,row,x:x===undefined?GW_COLS+0.4:x,hp:d.hp,maxHp:d.hp,slow:0,eating:null,vaulted:false,bossT:8+st.rng()*4,dead:false});
}
/* Zombie, das vor der Pflanze in Spalte col steht (Erbsenschütze schießt nur dann) */
function gwZombieAhead(st,row,col){return st.zombies.some(z=>!z.dead&&z.row===row&&z.x+0.6>col+0.3&&z.x<GW_COLS+0.5);}
function gwHurt(st,z,dmg,slow){
  if(z.dead)return;z.hp-=dmg;if(slow)z.slow=Math.max(z.slow,3);
  if(z.hp<=0){z.dead=true;st.killed++;}
}
function gwBlast(st,c0,c1,r0,r1,dmg){st.zombies.forEach(z=>{const cx=z.x+0.3;if(!z.dead&&z.row>=r0&&z.row<=r1&&cx>=c0&&cx<c1)gwHurt(st,z,dmg);});}
function gwStep(st,dt){
  if(st.mode!=='play')return;
  st.t+=dt;if(st.bannerT>0)st.bannerT-=dt;
  GW_ORDER.forEach(k=>{if(st.cool[k]>0)st.cool[k]=Math.max(0,st.cool[k]-dt);});
  /* Sonne vom Himmel */
  st.skyT-=dt;if(st.skyT<=0){st.skyT=(st.level.skyGap||GW_SKY_GAP)*(0.85+st.rng()*0.3);const tx=0.6+st.rng()*(GW_COLS-1.2),ty=0.6+st.rng()*(GW_ROWS-1.4);gwSpawnSun(st,tx,-0.6,GW_SUN_VALUE,false);st.suns[st.suns.length-1].ty=ty;}
  st.suns.forEach(s=>{s.age+=dt;if(s.y<s.ty)s.y=Math.min(s.ty,s.y+dt*0.7);s.life-=dt;});
  st.suns=st.suns.filter(s=>{if(s.life>0)return true;if(s.auto)st.sun+=s.value;return false;});   // Sonnenblumen-Sonne wird nach kurzer Zeit von allein eingesammelt
  /* Zombies erscheinen */
  while(st.si<st.schedule.length&&st.schedule[st.si][0]<=st.t){
    const [t,type,row]=st.schedule[st.si++];gwAddZombie(st,type,row);
    if(type==='flag'&&(st.level.big||[]).some(b=>Math.abs(b-t)<0.01)){st.banner='Eine riesige Welle Zombies kommt!';st.bannerT=4;}
  }
  /* Pflanzen */
  for(let r=0;r<GW_ROWS;r++)for(let c=0;c<GW_COLS;c++){
    const p=st.plants[r][c];if(!p)continue;
    if(p.hp<=0){st.plants[r][c]=null;continue;}
    if(p.type==='sunflower'){p.timer-=dt;if(p.timer<=0){p.timer=GW_FLOWER_GAP;gwSpawnSun(st,c+0.3+st.rng()*0.4,r+0.1,GW_SUN_VALUE,true);}}
    else if(p.type==='peashooter'||p.type==='snow'||p.type==='repeater'){
      p.shot-=dt;
      if(p.burst>0){p.burst-=dt;if(p.burst<=0)st.peas.push({row:r,x:c+0.8,slow:false,dmg:GW_PEA_DMG});}
      if(p.shot<=0&&gwZombieAhead(st,r,c)){
        p.shot=GW_SHOT_GAP;st.peas.push({row:r,x:c+0.8,slow:p.type==='snow',dmg:GW_PEA_DMG});
        if(p.type==='repeater')p.burst=0.18;
      }
    }
    else if(p.type==='cherry'){p.timer-=dt;if(p.timer<=0){gwBlast(st,c-1,c+2,r-1,r+1,GW_BLAST);st.effects.push({t:0.5,kind:'boom',x:c+0.5,y:r+0.5});st.plants[r][c]=null;}}
    else if(p.type==='mine'){
      if(p.state==='arming'){p.timer-=dt;if(p.timer<=0)p.state='armed';}
      else if(p.state==='armed'){
        const z=st.zombies.find(q=>!q.dead&&q.row===r&&q.x<c+1.0&&q.x+0.6>c+0.1);
        if(z){gwBlast(st,c-0.2,c+1.8,r,r,GW_BLAST);st.effects.push({t:0.5,kind:'boom',x:c+0.7,y:r+0.5});st.plants[r][c]=null;}
      }
    }
    else if(p.type==='chomper'){
      if(p.state==='chewing'){p.timer-=dt;if(p.timer<=0)p.state='ready';}
      else{
        const z=st.zombies.find(q=>!q.dead&&q.row===r&&!GW_ZOMBIES[q.type].boss&&q.x>c+0.3&&q.x<c+1.7);
        if(z){z.dead=true;st.killed++;p.state='chewing';p.timer=40;}
      }
    }
    else if(p.type==='spikes'){
      p.timer-=dt;
      if(p.timer<=0){p.timer=0.5;st.zombies.forEach(z=>{if(!z.dead&&z.row===r&&z.x<c+1&&z.x+0.6>c)gwHurt(st,z,GW_PEA_DMG);});}
    }
  }
  /* Erbsen */
  for(let i=st.peas.length-1;i>=0;i--){
    const b=st.peas[i];b.x+=GW_PEA_SPEED*dt;
    let hit=null;
    for(const z of st.zombies){if(z.dead||z.row!==b.row)continue;if(b.x>=z.x+0.15&&b.x<=z.x+0.9&&(!hit||z.x<hit.x))hit=z;}
    if(hit){gwHurt(st,hit,b.dmg,b.slow);st.peas.splice(i,1);}
    else if(b.x>GW_COLS+1)st.peas.splice(i,1);
  }
  /* Zombies laufen, fressen Pflanzen, springen (Sprinter) */
  st.zombies.forEach(z=>{
    if(z.dead)return;
    const d=GW_ZOMBIES[z.type];if(z.slow>0)z.slow-=dt;
    const sp=d.speed*(z.slow>0?0.5:1);
    const col=Math.floor(z.x),p=gwPlantAt(st,z.row,col);
    const blocks=p&&p.type!=='spikes'&&z.x<col+0.75&&!(p.type==='mine'&&p.state==='armed');
    if(blocks){
      if(d.vault&&!z.vaulted){z.vaulted=true;z.x-=1.1;return;}
      z.eating=p.id;p.hp-=(d.boss?400:100)*dt;
      if(p.hp<=0){st.plants[p.row][p.col]=null;z.eating=null;}
    }else{z.eating=null;z.x-=sp*dt;}
    if(d.boss){z.bossT-=dt;if(z.bossT<=0){z.bossT=12;gwAddZombie(st,'zombie',Math.floor(st.rng()*GW_ROWS));gwAddZombie(st,'cone',Math.floor(st.rng()*GW_ROWS));}}
  });
  /* Rasenmäher: das Beet leerfegen, sobald ein Zombie das Haus erreicht; ohne Rasenmäher ist das Spiel verloren */
  st.zombies.forEach(z=>{
    if(z.dead||z.x>=0.1)return;
    const m=st.mowers[z.row];
    if(!m.used&&!m.active){m.active=true;m.used=true;m.x=0;st.mowersUsed++;}
    else if(!m.active&&m.used){st.mode='lost';}
  });
  st.mowers.forEach(m=>{
    if(!m.active)return;m.x+=GW_MOWER_SPEED*dt;
    st.zombies.forEach(z=>{if(!z.dead&&z.row===m.row&&z.x<m.x+0.7&&z.x+0.6>m.x-0.3)gwHurt(st,z,GW_BLAST);});
    if(m.x>GW_COLS+1)m.active=false;
  });
  st.effects=st.effects.filter(e=>(e.t-=dt)>0);
  st.zombies=st.zombies.filter(z=>!z.dead);
  if(st.mode==='play'&&st.si>=st.schedule.length&&!st.zombies.length)st.mode='won';
}
/* Sterne: 3 ohne Rasenmäher, 2 mit höchstens zwei, sonst 1 */
function gwStars(st){return st.mowersUsed===0?3:st.mowersUsed<=2?2:1;}

/* ── Fortschritt je Konto ── */
function gwAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function gwProfAll(){try{const o=JSON.parse(localStorage.getItem(GW_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function gwProf(){
  const all=gwProfAll(),p=all[gwAccount().toLowerCase()||'_gast']||{},lv={};
  GW_LEVELS.forEach(L=>{const r=p.lv&&p.lv[L.id]||{};lv[L.id]={done:!!r.done,stars:Math.min(3,r.stars|0),wins:r.wins|0};});
  return {name:gwAccount(),lv,sel:Array.isArray(p.sel)?p.sel.filter(x=>GW_ORDER.includes(x)):[]};
}
function gwSaveProf(p){const all=gwProfAll();all[gwAccount().toLowerCase()||'_gast']={lv:p.lv,sel:p.sel};try{localStorage.setItem(GW_KEY,JSON.stringify(all));}catch(e){}}
function gwUnlocked(p,i){return i===0||p.lv[GW_LEVELS[i-1].id].done;}
/* freigeschaltete Pflanzen: 2 zu Beginn, dazu eine je geschafftem Level 1–7 (nacheinander) */
function gwPlantsOf(p){let n=2;for(let i=0;i<7&&i<GW_LEVELS.length;i++){if(p.lv[GW_LEVELS[i].id].done)n++;else break;}return GW_ORDER.slice(0,Math.min(GW_ORDER.length,n));}
function gwSlots(){return 6;}
function gwPickSel(p){const have=gwPlantsOf(p),sel=p.sel.filter(k=>have.includes(k));return (sel.length?sel:have).slice(0,gwSlots());}
function gwPay(n){try{const name=gwAccount();if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
/* Level verbuchen: Sterne, freigeschaltete Pflanze, einmalige AppHub-Coins (10 für das erste Schaffen, 4 je neuen Stern) */
function gwRecordWin(idx,stars){
  const L=GW_LEVELS[idx],p=gwProf(),r=p.lv[L.id],before=r.stars,first=!r.done,had=gwPlantsOf(p).length;
  r.done=true;r.stars=Math.max(before,stars);r.wins++;
  const res={stars,newStars:r.stars-before,firstClear:first,paid:0,newPlant:null};
  res.paid=gwPay((first?10:0)+res.newStars*4);
  gwSaveProf(p);
  const now=gwPlantsOf(p);if(now.length>had)res.newPlant=now[now.length-1];
  return res;
}

/* ── Oberfläche ── */
const GW_CW=80,GW_CH=76,GW_X0=44,GW_Y0=44,GW_W=800,GW_H=452;
let gw=null,gwView='menu',gwRaf=null,gwLast=0,gwAcc=0,gwSpeed=1,gwPickSeed=null,gwShovelOn=false,gwPrep=null;
function gwActive(){const s=document.getElementById('screen-garten');return !!s&&s.classList.contains('active');}
function gwInit(){if(gwRaf){cancelAnimationFrame(gwRaf);gwRaf=null;}if(typeof SFX_GAME_SCREENS!=='undefined'&&!SFX_GAME_SCREENS.includes('screen-garten'))SFX_GAME_SCREENS.push('screen-garten');gwView='menu';gw=null;gwPrep=null;gwRender();}
function gwShowMenu(){if(gwRaf){cancelAnimationFrame(gwRaf);gwRaf=null;}gwView='menu';gw=null;gwPrep=null;gwRender();}
/* Vor dem Start: bei mehr als 6 Pflanzen auswählen, sonst direkt los */
function gwOpen(idx){
  const p=gwProf();if(!gwUnlocked(p,idx))return;
  if(gwPlantsOf(p).length>gwSlots()){gwPrep={idx,sel:gwPickSel(p)};gwView='prep';gwRender();}
  else gwStart(idx,gwPickSel(p));
}
function gwTogglePrep(k){
  if(!gwPrep)return;const i=gwPrep.sel.indexOf(k);
  if(i>=0){if(gwPrep.sel.length>1)gwPrep.sel.splice(i,1);}else if(gwPrep.sel.length<gwSlots())gwPrep.sel.push(k);
  gwRender();
}
function gwStartPrep(){if(!gwPrep)return;const p=gwProf();p.sel=gwPrep.sel.slice();gwSaveProf(p);gwStart(gwPrep.idx,gwPrep.sel);}
function gwStart(idx,sel){
  gw=gwNewState(idx,sel,1+Math.floor(Math.random()*1e6));gw.sel=sel.slice();gw.over=null;
  gwPickSeed=null;gwShovelOn=false;gwSpeed=1;gwView='game';gwRender();gwLast=0;gwAcc=0;
  if(gwRaf)cancelAnimationFrame(gwRaf);gwRaf=requestAnimationFrame(gwLoop);
}
function gwRestart(){if(gw)gwStart(gw.levelIdx,gw.sel);}
function gwNext(){if(gw&&gw.levelIdx+1<GW_LEVELS.length)gwOpen(gw.levelIdx+1);else gwShowMenu();}
function gwLoop(ts){
  if(!gwActive()||!gw||gwView!=='game'){gwRaf=null;return;}
  if(!gwLast)gwLast=ts;
  gwAcc+=Math.min(100,ts-gwLast);gwLast=ts;
  while(gwAcc>=1000/60){gwTick(1/60*gwSpeed);gwAcc-=1000/60;}
  const cv=document.getElementById('gw-canvas');if(cv)gwDraw(cv.getContext('2d'));
  gwHud();
  gwRaf=requestAnimationFrame(gwLoop);
}
function gwTick(dt){
  if(!gw||gw.paused||gw.over)return;
  const z0=gw.killed,m0=gw.mowersUsed;
  gwStep(gw,dt);
  if(gw.killed>z0)gwSfx('hit');
  if(gw.mowersUsed>m0)gwSfx('drop');
  if(gw.mode==='won'&&!gw.over){gwSfx('win');const res=gwRecordWin(gw.levelIdx,gwStars(gw));gw.over=Object.assign({won:true},res);gwRender();}
  else if(gw.mode==='lost'&&!gw.over){gwSfx('lose');gw.over={won:false};gwRender();}
}
function gwSfx(n){try{if(typeof sfx==='function')sfx(n);}catch(e){}}
function gwTogglePause(){if(gw&&!gw.over){gw.paused=!gw.paused;gwRender();}}
function gwSetSpeed(){gwSpeed=gwSpeed===1?2:gwSpeed===2?3:1;gwHud();}
function gwSelectSeed(k){
  if(!gw||gw.over)return;gwShovelOn=false;
  if(gwPickSeed===k){gwPickSeed=null;}else if(gw.allowed.includes(k)){gwPickSeed=k;gwSfx('click');}
  gwHud();
}
function gwToggleShovel(){if(!gw||gw.over)return;gwShovelOn=!gwShovelOn;gwPickSeed=null;gwHud();}
function gwCanvasClick(ev){
  if(!gw||gw.over||gw.paused)return;
  const cv=document.getElementById('gw-canvas'),r=cv.getBoundingClientRect(),x=(ev.clientX-r.left)*GW_W/r.width,y=(ev.clientY-r.top)*GW_H/r.height;
  const cx=(x-GW_X0)/GW_CW,cy=(y-GW_Y0)/GW_CH;
  // Sonne einsammeln (mit etwas Toleranz)
  const s=gw.suns.find(q=>Math.hypot((q.x+0.5-cx)*GW_CW,(q.y+0.5-cy)*GW_CH)<38);
  if(s){gwCollect(gw,s.id);gwSfx('coin');gwHud();return;}
  const col=Math.floor(cx),row=Math.floor(cy);
  if(col<0||col>=GW_COLS||row<0||row>=GW_ROWS)return;
  if(gwShovelOn){if(gwShovel(gw,row,col))gwSfx('click');return;}
  if(gwPickSeed){
    if(gwPlace(gw,gwPickSeed,row,col)){gwSfx('place');gwPickSeed=null;}else gwSfx('error');
    gwHud();
  }
}
function gwRender(){
  const root=document.getElementById('gw-root');if(!root)return;
  const p=gwProf();
  if(gwView==='menu'){
    const have=gwPlantsOf(p),stars=GW_LEVELS.reduce((n,L)=>n+p.lv[L.id].stars,0);
    root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:10px"><span class="game-chip">⭐ <strong>${stars}</strong>/${GW_LEVELS.length*3}</span><span class="game-chip">🌱 <strong>${have.length}</strong>/${GW_ORDER.length} Pflanzen</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:14px">${GW_ORDER.map(k=>{const on=have.includes(k),d=GW_PLANTS[k];return `<span title="${escHtml(d.name)}: ${escHtml(d.desc)}${on?'':' (noch gesperrt)'}" style="width:40px;height:40px;border-radius:10px;background:var(--surface);border:1.5px solid ${on?'var(--accent)':'var(--divider)'};display:flex;align-items:center;justify-content:center;font-size:22px;opacity:${on?1:0.3}">${d.icon}</span>`;}).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${GW_LEVELS.map((L,i)=>{
        const r=p.lv[L.id],open=gwUnlocked(p,i),reward=i<7?GW_PLANTS[GW_ORDER[2+i]]:null;
        return `<button type="button" class="lrn-card" ${open?`onclick="gwOpen(${i})"`:'disabled'} style="text-align:left;cursor:${open?'pointer':'default'};opacity:${open?1:0.5};font-family:inherit;color:var(--text)">
          <div style="font-size:11px;color:var(--text-3);font-weight:700">LEVEL ${i+1}${L.spawn.some(s=>s[0]==='boss')?' · BOSS':''}</div><div style="font-size:16px;font-weight:800;margin:2px 0">${open?'':'🔒 '}${escHtml(L.name)}</div>
          <div style="font-size:12px;color:var(--text-2)">${L.sky?(L.skyGap?'🌙 wenig Sonne':'☀️ Tag'):'🌙 Nacht'} · ${L.spawn.reduce((n,s)=>n+s[1],0)+(L.big?L.big.length*3:0)} Zombies${reward?' · Belohnung '+reward.icon:''}</div>
          <div style="margin-top:6px;font-size:15px;color:#f59f00;letter-spacing:2px">${'★'.repeat(r.stars)}<span style="opacity:.3">${'★'.repeat(3-r.stars)}</span></div></button>`;}).join('')}</div>
      <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px">Sammle Sonne (Klick), wähle unten eine Pflanze und tippe auf ein Beet. Zombies fressen Pflanzen – der Rasenmäher am Haus räumt ein Beet einmal leer. 3 ★ ohne Rasenmäher, 2 ★ mit höchstens zwei. 🪙 AppHub-Coins: 10 für das erste Schaffen, 4 je neuen Stern.</div>`;
    return;
  }
  if(gwView==='prep'&&gwPrep){
    const have=gwPlantsOf(p);
    root.innerHTML=`<div style="text-align:center;font-size:18px;font-weight:800;margin-bottom:4px">Wähle bis zu ${gwSlots()} Pflanzen</div><div style="text-align:center;font-size:12px;color:var(--text-3);margin-bottom:12px">Level ${gwPrep.idx+1}: ${escHtml(GW_LEVELS[gwPrep.idx].name)} · ${gwPrep.sel.length}/${gwSlots()} gewählt</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:14px">${have.map(k=>{const d=GW_PLANTS[k],on=gwPrep.sel.includes(k);return `<button type="button" class="td-tbtn ${on?'active':''}" onclick="gwTogglePrep('${k}')" style="text-align:center"><span style="font-size:28px">${d.icon}</span><b>${escHtml(d.name)}</b><small>${d.cost} ☀ · ${d.cd} s</small><small style="white-space:normal">${escHtml(d.desc)}</small></button>`;}).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="gwStartPrep()">▶ Los!</button><button class="lrn-btn ghost" onclick="gwShowMenu()">Zurück</button></div>`;
    return;
  }
  if(!gw)return;
  const o=gw.over;
  root.innerHTML=`<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="game-chip">☀️ <strong id="gw-sun">${Math.floor(gw.sun)}</strong></span><span class="game-chip">🧟 <strong id="gw-left">0</strong></span><span class="game-chip">⏱ <strong id="gw-time">0</strong> s</span>
      <button class="lrn-btn ghost" id="gw-shovel" onclick="gwToggleShovel()" title="Pflanze entfernen (X)">⛏ Schaufel</button><button class="lrn-btn ghost" id="gw-speed" onclick="gwSetSpeed()">⏩ ×1</button><button class="lrn-btn ghost" onclick="gwTogglePause()">${gw.paused?'▶':'⏸'}</button><button class="lrn-btn ghost" onclick="gwShowMenu()">☰</button></div>
    <div id="gw-seeds" style="display:grid;grid-template-columns:repeat(${gw.sel.length},1fr);gap:6px;max-width:800px;margin:0 auto 8px">${gw.sel.map((k,i)=>{const d=GW_PLANTS[k];return `<button type="button" class="td-tbtn" id="gw-s-${k}" onclick="gwSelectSeed('${k}')" style="position:relative;overflow:hidden"><span style="font-size:24px">${d.icon}</span><b>${escHtml(d.name)}</b><small>${d.cost} ☀ · Taste ${i+1}</small><span class="gw-cd" style="position:absolute;left:0;right:0;bottom:0;height:0;background:rgba(0,0,0,.35);pointer-events:none"></span></button>`;}).join('')}</div>
    <div style="position:relative;max-width:800px;margin:0 auto"><canvas id="gw-canvas" width="${GW_W}" height="${GW_H}" style="display:block;width:100%;height:auto;border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,0.3);touch-action:none;cursor:pointer" onpointerdown="gwCanvasClick(event)"></canvas>
      ${o?gwOverHtml(o):''}${gw.paused&&!o?'<div class="td-over"><div style="font-size:30px;font-weight:800">⏸ Pause</div><div style="margin-top:10px"><button class="lrn-btn" onclick="gwTogglePause()">▶ Weiter</button></div></div>':''}</div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:8px">Klick auf Sonne = einsammeln · Pflanze wählen (Tasten 1–${gw.sel.length}) und aufs Beet klicken · X = Schaufel · Esc = abbrechen · P = Pause</div>`;
  gwHud();
}
function gwOverHtml(o){
  const ghost='background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)';
  if(!o.won)return `<div class="td-over"><div style="font-size:44px">🧟</div><div style="font-size:22px;font-weight:800">Die Zombies sind im Haus!</div><div style="font-size:13px;margin:6px 0 12px">Versuch es noch einmal – vielleicht mit mehr Sonnenblumen oder Nüssen.</div><div style="display:flex;gap:8px"><button class="lrn-btn" onclick="gwRestart()">Nochmal</button><button class="lrn-btn ghost" style="${ghost}" onclick="gwShowMenu()">Menü</button></div></div>`;
  return `<div class="td-over"><div style="font-size:44px">🌻</div><div style="font-size:22px;font-weight:800">Garten verteidigt!</div>
    <div style="color:#ffca28;font-size:30px;letter-spacing:5px;margin:4px 0">${'★'.repeat(o.stars)}<span style="opacity:.3">${'★'.repeat(3-o.stars)}</span></div>
    <div style="font-size:13px;margin-bottom:10px">${gw.mowersUsed===0?'Kein Rasenmäher gebraucht!':gw.mowersUsed+' Rasenmäher benutzt'}${o.paid?'<br>🪙 +'+o.paid+' AppHub-Coins':''}${o.newPlant?'<br>🎁 Neue Pflanze: '+GW_PLANTS[o.newPlant].icon+' '+escHtml(GW_PLANTS[o.newPlant].name):''}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="lrn-btn" onclick="gwNext()">${gw.levelIdx+1<GW_LEVELS.length?'Nächstes Level ▶':'Zum Menü'}</button><button class="lrn-btn ghost" style="${ghost}" onclick="gwRestart()">Nochmal</button></div></div>`;
}
/* Anzeige oben und Pflanzenkarten (Abklingzeit, bezahlbar, gewählt) aktuell halten */
function gwHud(){
  if(!gw||gwView!=='game')return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=v;};
  set('gw-sun',Math.floor(gw.sun));set('gw-left',gw.total-gw.si+gw.zombies.length);set('gw-time',Math.floor(gw.t));
  const sp=document.getElementById('gw-speed');if(sp)sp.textContent='⏩ ×'+gwSpeed;
  const sv=document.getElementById('gw-shovel');if(sv)sv.classList.toggle('active',gwShovelOn);
  gw.sel.forEach(k=>{
    const b=document.getElementById('gw-s-'+k);if(!b)return;const d=GW_PLANTS[k];
    b.classList.toggle('active',gwPickSeed===k);b.classList.toggle('poor',gw.sun<d.cost||gw.cool[k]>0);
    const cd=b.querySelector('.gw-cd');if(cd)cd.style.height=(gw.cool[k]>0?gw.cool[k]/d.cd*100:0)+'%';
  });
}
function gwDraw(ctx){
  if(!gw)return;
  const st=gw;
  ctx.clearRect(0,0,GW_W,GW_H);
  ctx.fillStyle=st.level.sky&&!st.level.skyGap?'#7bc96f':'#5f9d62';ctx.fillRect(0,0,GW_W,GW_H);
  if(st.level.skyGap){ctx.fillStyle='rgba(20,30,70,0.35)';ctx.fillRect(0,0,GW_W,GW_H);}
  for(let r=0;r<GW_ROWS;r++)for(let c=0;c<GW_COLS;c++){ctx.fillStyle=(r+c)%2?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)';ctx.fillRect(GW_X0+c*GW_CW,GW_Y0+r*GW_CH,GW_CW,GW_CH);}
  ctx.fillStyle='#c98f5a';ctx.fillRect(0,GW_Y0,GW_X0-4,GW_ROWS*GW_CH);                    // Haus
  ctx.fillStyle='#8d5a34';ctx.fillRect(GW_X0-8,GW_Y0,8,GW_ROWS*GW_CH);
  ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  st.mowers.forEach(m=>{if(m.used&&!m.active)return;ctx.fillText('🚜',GW_X0-22+m.x*GW_CW,GW_Y0+m.row*GW_CH+GW_CH*0.55);});
  /* Pflanzen */
  ctx.font='42px sans-serif';
  for(let r=0;r<GW_ROWS;r++)for(let c=0;c<GW_COLS;c++){
    const p=st.plants[r][c];if(!p)continue;
    const x=GW_X0+c*GW_CW+GW_CW/2,y=GW_Y0+r*GW_CH+GW_CH/2;
    if(p.type==='mine'&&p.state==='arming'){ctx.globalAlpha=0.55;ctx.fillText('🥔',x,y+16);ctx.globalAlpha=1;}
    else if(p.type==='cherry'){const s=1+Math.sin(st.t*20)*0.08;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillText('🍒',0,0);ctx.restore();}
    else if(p.type==='chomper'&&p.state==='chewing'){ctx.globalAlpha=0.6;ctx.fillText(GW_PLANTS.chomper.icon,x,y);ctx.globalAlpha=1;}
    else if(p.type==='spikes'){ctx.fillText('🌵',x,y+12);}
    else ctx.fillText(GW_PLANTS[p.type].icon,x,y);
    if(p.type==='snow'){ctx.fillStyle='rgba(120,200,255,0.35)';ctx.beginPath();ctx.arc(x,y,22,0,7);ctx.fill();}
    if(p.hp<p.maxHp){ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x-20,y+28,40,5);ctx.fillStyle=p.hp/p.maxHp>0.5?'#69db7c':'#ff6b6b';ctx.fillRect(x-20,y+28,40*Math.max(0,p.hp)/p.maxHp,5);}
  }
  /* Zombies (von hinten nach vorn, damit die vorderen oben liegen) */
  st.zombies.slice().sort((a,b)=>a.row-b.row).forEach(z=>{
    const d=GW_ZOMBIES[z.type],sc=d.scale||1,x=GW_X0+z.x*GW_CW+GW_CW*0.3,y=GW_Y0+z.row*GW_CH+GW_CH*0.5;
    ctx.save();ctx.translate(x,y);ctx.scale(-sc,sc);if(z.eating)ctx.rotate(Math.sin(st.t*14)*0.08);
    ctx.font='44px sans-serif';ctx.fillText('🧟',0,0);
    ctx.scale(-1,1);
    if(d.acc==='cone'){ctx.fillStyle='#ff9800';ctx.beginPath();ctx.moveTo(-10,-22);ctx.lineTo(10,-22);ctx.lineTo(0,-46);ctx.closePath();ctx.fill();}
    else if(d.acc==='bucket'){ctx.fillStyle='#90a4ae';ctx.beginPath();ctx.moveTo(-12,-22);ctx.lineTo(12,-22);ctx.lineTo(9,-40);ctx.lineTo(-9,-40);ctx.closePath();ctx.fill();}
    else if(d.acc==='door'){ctx.fillStyle='#8d6e63';ctx.fillRect(-30,-18,14,40);ctx.strokeStyle='#5d4037';ctx.strokeRect(-30,-18,14,40);}
    else if(d.acc==='flag'){ctx.strokeStyle='#5d4037';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14,-8);ctx.lineTo(14,-44);ctx.stroke();ctx.fillStyle='#e53935';ctx.fillRect(14,-44,18,12);}
    else if(d.acc==='pole'){ctx.strokeStyle='#8d6e63';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-26,20);ctx.lineTo(26,-34);ctx.stroke();}
    else if(d.acc==='crown'){ctx.font='26px sans-serif';ctx.fillText('👑',0,-30);}
    ctx.restore();
    if(z.hp<z.maxHp){const bw=d.boss?70:34;ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(x-bw/2,y-GW_CH*0.55*sc,bw,4);ctx.fillStyle='#ef5350';ctx.fillRect(x-bw/2,y-GW_CH*0.55*sc,bw*Math.max(0,z.hp)/z.maxHp,4);}
    if(z.slow>0){ctx.fillStyle='rgba(100,181,246,.3)';ctx.beginPath();ctx.arc(x,y,24*sc,0,7);ctx.fill();}
  });
  /* Erbsen, Effekte, Sonne */
  st.peas.forEach(b=>{ctx.fillStyle=b.slow?'#4fc3f7':'#66bb6a';ctx.beginPath();ctx.arc(GW_X0+b.x*GW_CW,GW_Y0+b.row*GW_CH+GW_CH*0.4,7,0,7);ctx.fill();});
  st.effects.forEach(e=>{const k=1-e.t/0.5;ctx.fillStyle='rgba(255,152,0,'+(0.7-k*0.6)+')';ctx.beginPath();ctx.arc(GW_X0+e.x*GW_CW,GW_Y0+e.y*GW_CH,40+k*90,0,7);ctx.fill();});
  st.suns.forEach(s=>{const x=GW_X0+(s.x+0.5)*GW_CW,y=GW_Y0+(s.y+0.5)*GW_CH,pulse=1+Math.sin((s.age||0)*6)*0.06;ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);const g=ctx.createRadialGradient(0,0,4,0,0,26);g.addColorStop(0,'#fff59d');g.addColorStop(0.6,'#ffd54f');g.addColorStop(1,'rgba(255,193,7,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,26,0,7);ctx.fill();ctx.fillStyle='#ffca28';ctx.beginPath();ctx.arc(0,0,13,0,7);ctx.fill();ctx.restore();});
  /* Vorschau beim Pflanzen */
  if(st.bannerT>0){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,GW_H/2-30,GW_W,60);ctx.fillStyle='#fff';ctx.font='bold 24px sans-serif';ctx.fillText(st.banner,GW_W/2,GW_H/2);}
  ctx.textBaseline='alphabetic';
}
document.addEventListener('keydown',e=>{
  if(!gwActive()||gwView!=='game'||!gw)return;
  const k=e.key;
  if(/^[1-9]$/.test(k)){const seed=gw.sel[+k-1];if(seed)gwSelectSeed(seed);}
  else if(k==='x'||k==='X')gwToggleShovel();
  else if(k==='Escape'){gwPickSeed=null;gwShovelOn=false;gwHud();}
  else if(k==='p'||k==='P')gwTogglePause();
});
window.addEventListener('blur',()=>{if(gw&&gwView==='game'&&!gw.paused&&!gw.over&&gwActive())gwTogglePause();});
