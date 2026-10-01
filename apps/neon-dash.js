/* ══════════════════════════════════
   NEON-DASH – Rhythmus-Springer im Stil von Geometry Dash. Der Würfel läuft von allein nach rechts, du steuerst nur den Sprung
   (Leertaste / ↑ / W / Klick / Tippen, Gedrückthalten springt bei jeder Landung erneut). Hindernisse: Stacheln, Blöcke, Lücken,
   Sprungfelder (=), Sprung-Orbs (○, in der Luft drücken) und Schwerkraft-Portale (F = kehrt um, N = normal).
   8 Level, je 3 geheime Münzen, Sterne, Übungsmodus mit Checkpoints, 8 Würfelfarben, Musik aus der Web-Audio-Schnittstelle.
   Physik (ndStep) ist von der Oberfläche getrennt, ein Löser (tests/dash-solver.js) beweist, dass jedes Level schaffbar ist.
   Fortschritt je Konto: zf_dash
══════════════════════════════════ */
const ND_KEY='zf_dash';
const ND_T=32,ND_ROWS=14,ND_W=800,ND_H=448,ND_GROUND=12;          // Kachelgröße, Zeilen, Bildgröße, erste Boden-Zeile
const ND_SPEED=5.5,ND_GRAV=0.95,ND_JUMP=12.2,ND_PAD=15.5,ND_ORB=12.2,ND_VMAX=16,ND_BUF=6,ND_PW=28,ND_STEP=8,ND_START=3*ND_T;
const ND_BPM=124;                                                     // eine Zählzeit = 5 Kacheln Weg
const ND_COLORS=[['#00e5ff',0],['#ff4081',0],['#76ff03',3],['#ffea00',6],['#e040fb',10],['#ff6d00',14],['#ffffff',18],['#ff1744',22]];

/* ── Level aus Bauanweisungen ── */
function ndBuildLevel(spec){
  const cols=spec.cols,g=[];
  for(let r=0;r<ND_ROWS;r++)g.push(new Array(cols).fill(r>=ND_GROUND?'#':'.'));
  const put=(r,c,ch)=>{if(r>=0&&r<ND_ROWS&&c>=0&&c<cols)g[r][c]=ch;};
  const events=[];let coinN=0;const coinIdx={};
  spec.ops.forEach(o=>{
    const [k,x,a,b]=o;
    if(k==='gap')for(let c=x;c<x+a;c++){put(12,c,'.');put(13,c,'.');}
    else if(k==='spike')for(let c=x;c<x+(a||1);c++)put(b===undefined?ND_GROUND-1:b,c,'^');
    else if(k==='cspike')for(let c=x;c<x+(a||1);c++)put(b===undefined?2:b,c,'v');
    else if(k==='block')for(let c=x;c<x+a;c++)for(let r=ND_GROUND-b;r<ND_GROUND;r++)put(r,c,'#');
    else if(k==='plat')for(let c=x;c<x+a;c++)put(b,c,'#');
    else if(k==='pad')put(a===undefined?ND_GROUND-1:a,x,'=');
    else if(k==='orb')put(a,x,'o');
    else if(k==='coin'){put(a,x,'c');coinIdx[a+','+x]=coinN++;}
    else if(k==='ceil')for(let c=x;c<=a;c++){put(0,c,'#');put(1,c,'#');}
    else if(k==='flip')events.push({x:x*ND_T,t:'F'});
    else if(k==='norm')events.push({x:x*ND_T,t:'N'});
    else if(k==='check')events.push({x:x*ND_T,t:'K'});
    else if(k==='end')events.push({x:x*ND_T,t:'E'});
  });
  events.sort((p,q)=>p.x-q.x);
  const rows=g.map(r=>r.join(''));
  const end=events.find(e=>e.t==='E');
  return {id:spec.id,name:spec.name,hue:spec.hue,cols,rows,events,coinIdx,coins:coinN,endX:end?end.x:cols*ND_T,orbs:[],pads:[],
    solid:(c,r)=>c>=0&&c<cols&&r>=0&&r<ND_ROWS&&rows[r][c]==='#',tile:(c,r)=>c>=0&&c<cols&&r>=0&&r<ND_ROWS?rows[r][c]:'.'};
}
/* ── Spielzustand und ein Bild Physik ── */
function ndNewState(L,snap){
  const st={L,x:ND_START,y:ND_GROUND*ND_T-ND_PW,vy:0,g:1,onGround:true,hold:false,pressT:-99,orb:-1,pad:'',ev:0,coins:0,frame:0,dead:false,won:false,rot:0,check:null,cause:''};
  if(snap){st.x=snap.x;st.y=snap.y;st.vy=snap.vy;st.g=snap.g;st.onGround=snap.onGround;st.ev=snap.ev;st.coins=snap.coins||0;}
  return st;
}
function ndSnapshot(st){return {x:st.x,y:st.y,vy:st.vy,g:st.g,onGround:st.onGround,ev:st.ev,coins:st.coins};}
function ndCells(st){return {c0:Math.floor(st.x/ND_T),c1:Math.floor((st.x+ND_PW-1e-6)/ND_T),r0:Math.floor(st.y/ND_T),r1:Math.floor((st.y+ND_PW-1e-6)/ND_T)};}
function ndOverlapSolid(st){
  const {c0,c1,r0,r1}=ndCells(st),L=st.L,out=[];
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)if(L.solid(c,r))out.push([c,r]);
  return out;
}
function ndStanding(st){
  const L=st.L,c0=Math.floor(st.x/ND_T),c1=Math.floor((st.x+ND_PW-1e-6)/ND_T);
  const r=st.g>0?Math.floor((st.y+ND_PW+0.5)/ND_T):Math.floor((st.y-0.5)/ND_T);
  for(let c=c0;c<=c1;c++)if(L.solid(c,r))return true;
  return false;
}
function ndRects(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function ndStep(st,hold){
  if(st.dead||st.won)return;
  const L=st.L,press=hold&&!st.hold;st.hold=hold;if(press)st.pressT=st.frame;
  const me=()=>({x:st.x,y:st.y,w:ND_PW,h:ND_PW});
  /* Sprung: am Boden bei gedrückter Taste, in der Luft nur mit einem Orb */
  if(hold&&st.onGround){st.vy=-ND_JUMP*st.g;st.onGround=false;}
  else if(hold&&!st.onGround&&st.frame-st.pressT<=ND_BUF){
    const {c0,c1,r0,r1}=ndCells(st);
    for(let r=r0-1;r<=r1+1;r++)for(let c=c0-1;c<=c1+1;c++)if(L.tile(c,r)==='o'&&st.orb!==r+','+c&&ndRects(me(),{x:c*ND_T-2,y:r*ND_T-2,w:36,h:36})){st.vy=-ND_ORB*st.g;st.orb=r+','+c;}
  }
  /* Sprungfeld: Berührung schleudert nach oben (einmal je Feld) */
  {
    const {c0,c1,r0,r1}=ndCells(st);let touching='';
    for(let r=r0;r<=r1+1;r++)for(let c=c0;c<=c1;c++)if(L.tile(c,r)==='='&&ndRects(me(),{x:c*ND_T+2,y:r*ND_T+(st.g>0?22:0),w:28,h:10}))touching=r+','+c;
    if(touching&&touching!==st.pad){st.vy=-ND_PAD*st.g;st.onGround=false;}
    st.pad=touching;
  }
  st.vy+=ND_GRAV*st.g;if(st.vy>ND_VMAX)st.vy=ND_VMAX;if(st.vy<-ND_VMAX)st.vy=-ND_VMAX;
  /* nach rechts: gegen die Seite eines Blocks = Absturz, außer man ist höchstens 8 px zu tief (dann steigt man auf) */
  st.x+=ND_SPEED;
  {
    const hit=ndOverlapSolid(st);
    if(hit.length){
      let pen=0;
      for(const [c,r] of hit){const p=st.g>0?(st.y+ND_PW)-r*ND_T:(r+1)*ND_T-st.y;if(p>pen)pen=p;}
      if(pen>ND_STEP){st.dead=true;st.cause='block';return;}
      st.y+=st.g>0?-pen:pen;
    }
  }
  /* senkrecht: landen oder an die Decke stoßen */
  st.y+=st.vy;
  {
    const hit=ndOverlapSolid(st);
    if(hit.length){
      const falling=st.g>0?st.vy>=0:st.vy<=0;
      if(st.g>0){
        if(falling){st.y=Math.min(...hit.map(h=>h[1]))*ND_T-ND_PW;}else{st.y=(Math.max(...hit.map(h=>h[1]))+1)*ND_T;}
      }else{
        if(falling){st.y=(Math.max(...hit.map(h=>h[1]))+1)*ND_T;}else{st.y=Math.min(...hit.map(h=>h[1]))*ND_T-ND_PW;}
      }
      st.vy=0;
    }
  }
  st.onGround=ndStanding(st);
  if(st.g>0&&st.y>ND_H+64||st.g<0&&st.y<-96){st.dead=true;st.cause='fall';return;}
  /* Stacheln (kleinere Trefferfläche) und Münzen */
  {
    const {c0,c1,r0,r1}=ndCells(st),body={x:st.x+3,y:st.y+3,w:ND_PW-6,h:ND_PW-6};
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
      const t=L.tile(c,r);
      if(t==='^'&&ndRects(body,{x:c*ND_T+9,y:r*ND_T+10,w:14,h:22})){st.dead=true;st.cause='spike';return;}
      if(t==='v'&&ndRects(body,{x:c*ND_T+9,y:r*ND_T,w:14,h:22})){st.dead=true;st.cause='spike';return;}
      if(t==='c'){const i=L.coinIdx[r+','+c];if(i!==undefined&&ndRects(body,{x:c*ND_T+6,y:r*ND_T+6,w:20,h:20}))st.coins|=1<<i;}
    }
  }
  /* Ereignisse am Wegrand: Portale, Checkpoint, Ziel */
  const mid=st.x+ND_PW/2;
  while(st.ev<L.events.length&&L.events[st.ev].x<=mid){
    const e=L.events[st.ev++];
    if(e.t==='F'&&st.g>0){st.g=-1;st.vy=0;st.onGround=false;}
    else if(e.t==='N'&&st.g<0){st.g=1;st.vy=0;st.onGround=false;}
    else if(e.t==='K')st.check=ndSnapshot(st);
    else if(e.t==='E'){st.won=true;}
  }
  st.frame++;
}
function ndProgress(st){if(st.won)return 100;return Math.max(0,Math.min(100,Math.floor((st.x-ND_START)/(st.L.endX-ND_START)*100)));}

/* ── Löser: probiert jede Kombination aus Drücken/Loslassen Bild für Bild aus (Beweis, dass ein Level schaffbar ist) ── */
function ndSolve(L,maxFrames){
  maxFrames=maxFrames||Math.ceil(L.endX/ND_SPEED)+200;
  const key=s=>[s.y.toFixed(2),s.vy.toFixed(2),s.g,s.onGround?1:0,s.hold?1:0,(s.onGround?0:Math.min(ND_BUF+1,s.frame-s.pressT)),s.orb,s.pad,s.ev,s.coins].join('|');
  let layer=new Map();const s0=ndNewState(L);layer.set(key(s0),s0);
  const usedOrbs=new Set();
  let bestCoins=0,won=null,f=0,maxX=0,reach=0;   // maxX = weitester erreichter Punkt, reach = alle Münzen, die irgendein Weg einsammeln kann
  for(;f<maxFrames&&layer.size;f++){
    const next=new Map();
    for(const s of layer.values()){
      for(const hold of [false,true]){
        const n=Object.assign({},s);ndStep(n,hold);
        if(n.dead)continue;
        if(n.x>maxX)maxX=n.x;reach|=n.coins;if(n.orb!==s.orb&&n.orb!==-1)usedOrbs.add(n.orb);
        if(n.won){if(!won||n.coins>won.coins)won=n;if(n.coins>bestCoins)bestCoins=n.coins;continue;}
        const k=key(n);if(!next.has(k))next.set(k,n);
      }
    }
    layer=next;
    if(won&&!layer.size)break;
  }
  return {ok:!!won,frames:f,allCoins:!!won&&bestCoins===(1<<L.coins)-1,coins:bestCoins,reach,maxX:Math.round(maxX/ND_T*10)/10,states:layer.size,orbsUsed:usedOrbs.size,orbsTotal:L.rows.reduce((n,row)=>n+[...row].filter(ch=>ch==='o').length,0)};
}

/* ── Die 8 Level ── */
const ND_SPECS=[
 {id:'d1',name:'Erster Sprung',hue:190,cols:150,ops:[
  ['spike',22],['coin',22,9],['spike',36],['spike',48],['spike',49],['block',62,2,1],['coin',63,9],['gap',76,2],['spike',90],['spike',100,2],['coin',101,9],['block',114,3,1],['spike',124],['check',75],['end',146]]},
 {id:'d2',name:'Stachelfeld',hue:130,cols:170,ops:[
  ['spike',20,2],['spike',32],['spike',38],['coin',37,9],['block',50,2,2],['spike',58,2],['block',70,1,1],['block',76,2,2],['coin',77,8],['gap',88,3],['spike',100],['spike',106],['spike',112,2],['coin',113,9],['block',124,2,1],['spike',132,2],['spike',142],['check',85],['end',166]]},
 {id:'d3',name:'Kluft',hue:30,cols:190,ops:[
  ['gap',22,3],['spike',34],['gap',44,4],['coin',46,9],['block',56,2,1],['gap',62,3],['spike',74,2],['block',86,2,2],['gap',92,3],['coin',93,9],['spike',104],['gap',110,3],['spike',122,2],['block',134,2,1],['gap',140,4],['coin',142,9],['spike',154],['spike',160],['check',100],['end',186]]},
 {id:'d4',name:'Sprungbrett',hue:280,cols:200,ops:[
  ['spike',18],['pad',28],['coin',31,7],['spike',38,2],['gap',52,4],['orb',54,9],['coin',55,9],['spike',68],['pad',78],['block',82,5,3],['spike',92,2],['orb',100,9],['spike',100,2],['gap',110,4],['orb',112,9],['pad',126],['coin',129,7],['block',130,4,2],['spike',142,2],['orb',146,9],['gap',158,4],['orb',160,9],['spike',178,2],['check',105],['end',196]]},
 {id:'d5',name:'Umkehr',hue:320,cols:210,ops:[
  ['spike',20],['spike',30,2],['flip',44],['ceil',44,86],['cspike',56],['spike',52],['cspike',66],['coin',70,3],['spike',74],['norm',86],['spike',96],['coin',100,9],['spike',108,2],['flip',120],['ceil',120,160],['cspike',132,2],['spike',142],['cspike',150],['coin',146,3],['norm',160],['spike',172],['spike',180,2],['check',104],['end',206]]},
 {id:'d6',name:'Treppenhaus',hue:60,cols:230,ops:[
  ['block',20,4,1],['block',24,4,2],['spike',31,2],['block',38,4,1],['block',42,4,2],['block',46,4,3],['coin',48,7],['spike',54,2],['block',61,4,2],['spike',68,2],['spike',74],['block',81,4,1],['block',85,4,2],['block',89,4,3],['gap',98,3],['coin',91,7],['block',104,3,2],['spike',110,2],['block',118,2,2],['spike',122,2],['block',132,5,1],['spike',137,2],['coin',138,8],['spike',150],['block',160,3,2],['spike',168,2],['check',120],['end',226]]},
 {id:'d7',name:'Neon-Tunnel',hue:170,cols:250,ops:[
  ['spike',20,2],['orb',30,9],['gap',31,4],['flip',46],['ceil',46,100],['cspike',54],['spike',60],['cspike',70,2],['coin',74,3],['orb',84,3],['cspike',88],['spike',92],['norm',100],['pad',108],['block',112,4,2],['coin',114,7],['spike',124,2],['gap',134,4],['orb',136,9],['spike',146,2],['flip',158],['ceil',158,210],['cspike',166],['spike',172,2],['cspike',180],['spike',188],['coin',190,3],['cspike',198,2],['norm',210],['spike',220],['spike',228,2],['check',105],['end',246]]},
 {id:'d8',name:'Finale',hue:0,cols:300,ops:[
  ['spike',18,2],['block',30,2,2],['spike',36,2],['gap',46,3],['orb',48,9],['spike',58],['spike',63],['pad',72],['block',76,5,3],['coin',78,7],['spike',86,2],['gap',96,4],['orb',98,9],['flip',110],['ceil',110,150],['cspike',120],['spike',126],['cspike',134],['spike',140,2],['coin',146,3],['norm',150],['spike',160,2],['block',172,2,1],['spike',176,2],['pad',190],['orb',197,9],['gap',198,4],['spike',212],['spike',217],['block',228,3,2],['coin',230,7],['spike',241,2],['flip',248],['ceil',248,280],['cspike',256],['spike',262],['cspike',270,2],['norm',280],['spike',288],['check',150],['check',235],['end',296]]}
];
const ND_LEVELS=ND_SPECS.map(ndBuildLevel);

/* ── Fortschritt je Konto ── */
function ndAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function ndProfAll(){try{const o=JSON.parse(localStorage.getItem(ND_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function ndProf(){
  const all=ndProfAll(),p=all[ndAccount().toLowerCase()||'_gast']||{};
  const lv={};ND_LEVELS.forEach(L=>{const r=p.lv&&p.lv[L.id]||{};lv[L.id]={best:Math.min(100,r.best|0),done:!!r.done,coins:(r.coins|0)&((1<<L.coins)-1),stars:Math.min(3,r.stars|0),attempts:r.attempts|0};});
  return {name:ndAccount(),lv,color:Math.max(0,Math.min(ND_COLORS.length-1,p.color|0))};
}
function ndSaveProf(p){const all=ndProfAll();all[ndAccount().toLowerCase()||'_gast']={lv:p.lv,color:p.color};try{localStorage.setItem(ND_KEY,JSON.stringify(all));}catch(e){}}
function ndUnlocked(p,i){return i===0||p.lv[ND_LEVELS[i-1].id].done;}
function ndTotalStars(p){return ND_LEVELS.reduce((n,L)=>n+p.lv[L.id].stars,0);}
function ndColorOpen(p,i){return ndTotalStars(p)>=ND_COLORS[i][1];}
function ndBits(n){let c=0;while(n){c+=n&1;n>>=1;}return c;}
/* Sterne: 1 = geschafft, 2 = geschafft und mindestens 2 Münzen im selben Lauf, 3 = alle Münzen im selben Lauf */
function ndStarsFor(L,coins){const n=ndBits(coins&((1<<L.coins)-1));return n>=L.coins?3:n>=2?2:1;}
function ndPay(n){try{const name=ndAccount();if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
/* Lauf verbuchen (nicht im Übungsmodus): bester Fortschritt, Versuche, bei Sieg Sterne, Münzen und einmalige AppHub-Coins (5 für das Level, 3 je neuen Stern) */
function ndRecordRun(idx,run){
  const L=ND_LEVELS[idx],p=ndProf(),r=p.lv[L.id];
  r.best=Math.max(r.best,run.won?100:Math.max(0,Math.min(99,run.progress|0)));
  const res={stars:r.stars,newStars:0,paid:0,firstClear:false};
  if(run.won){
    const s=ndStarsFor(L,run.coins),before=r.stars;
    res.firstClear=!r.done;r.done=true;r.coins|=run.coins&((1<<L.coins)-1);r.stars=Math.max(before,s);
    res.newStars=r.stars-before;res.stars=s;
    res.paid=ndPay((res.firstClear?5:0)+res.newStars*3);
  }
  ndSaveProf(p);return res;
}
function ndCountAttempt(idx){const p=ndProf();p.lv[ND_LEVELS[idx].id].attempts++;ndSaveProf(p);}

/* ── Töne und Musik (Web Audio, alles erzeugt) ── */
function ndRegisterSounds(){
  if(typeof SFX_SOUNDS==='undefined'||typeof sfxTone!=='function'||SFX_SOUNDS.ndJump)return;
  Object.assign(SFX_SOUNDS,{
    ndJump:c=>sfxTone(c,300,0.09,'square',0.05,0,620),
    ndPad:c=>sfxTone(c,260,0.16,'square',0.07,0,900),
    ndOrb:c=>sfxTone(c,700,0.1,'triangle',0.09,0,1100),
    ndDie:c=>{sfxNoise(c,0.28,0.24,0,700);sfxTone(c,240,0.3,'sawtooth',0.12,0,50);},
    ndCoin:c=>{sfxTone(c,1046,0.06,'square',0.07);sfxTone(c,1568,0.18,'square',0.07,0.06);},
    ndFlip:c=>sfxTone(c,500,0.2,'sine',0.1,0,180),
    ndWin:c=>[523,659,784,1046,1319].forEach((f,i)=>sfxTone(c,f,0.2,'triangle',0.16,i*0.09))
  });
  if(typeof SFX_GAME_SCREENS!=='undefined'&&!SFX_GAME_SCREENS.includes('screen-dash'))SFX_GAME_SCREENS.push('screen-dash');
}
const ND_SCALES=[[0,3,7,10],[0,2,7,9],[0,4,7,11],[0,3,5,10],[0,2,4,7],[0,3,7,8],[0,5,7,10],[0,3,6,10]];
let ndMus=null;
function ndMusicStop(){if(ndMus){clearInterval(ndMus.timer);ndMus=null;}}
function ndMusicStart(idx){
  ndMusicStop();
  if(typeof sfxCtx!=='function'||typeof SFX_MUTED==='undefined')return;
  const c=sfxCtx();if(!c)return;
  const step=60/ND_BPM/4,root=110*Math.pow(2,(idx*2%12)/12),scale=ND_SCALES[idx%ND_SCALES.length];
  const m={c,t0:c.currentTime+0.05,n:0,timer:null};
  const play=(n,when)=>{
    if(SFX_MUTED)return;const d=Math.max(0,when-c.currentTime),s=n%16,bar=Math.floor(n/16);
    if(s%4===0)sfxTone(c,150,0.16,'sine',0.11,d,45);                                   // Kick auf jeder Zählzeit
    if(s===4||s===12)sfxNoise(c,0.1,0.06,d,1800);                                      // Snare auf 2 und 4
    if(s%2===1)sfxNoise(c,0.03,0.025,d,7000);                                          // Hi-Hat
    if([0,3,6,8,11,14].includes(s))sfxTone(c,root*(s===8||s===14?1.5:1),0.14,'square',0.035,d);   // Bass
    if(s%2===0)sfxTone(c,root*4*Math.pow(2,scale[(s/2+bar)%scale.length]/12),0.11,'triangle',0.03,d);   // Melodie
  };
  m.timer=setInterval(()=>{while(m.t0+m.n*step<c.currentTime+0.3){play(m.n,m.t0+m.n*step);m.n++;}},40);
  ndMus=m;
}

/* ── Oberfläche ── */
let nd=null,ndView='menu',ndRaf=null,ndLast=0,ndAcc=0,ndHold=false,ndPractice=false,ndParts=[],ndShake=0;
function ndActive(){const s=document.getElementById('screen-dash');return !!s&&s.classList.contains('active');}
function ndInit(){ndRegisterSounds();ndStopLoop();ndMusicStop();ndView='menu';nd=null;ndRenderView();}
function ndStopLoop(){if(ndRaf){cancelAnimationFrame(ndRaf);ndRaf=null;}}
function ndShowMenu(){ndStopLoop();ndMusicStop();ndView='menu';nd=null;ndRenderView();}
function ndStart(idx){
  const p=ndProf();if(idx<0||idx>=ND_LEVELS.length||!ndUnlocked(p,idx))return;
  nd={idx,L:ND_LEVELS[idx],st:null,attempt:0,practice:ndPractice,check:null,deadT:0,over:null,paused:false,frame:0};
  ndParts=[];ndView='game';ndRenderView();ndNewAttempt();ndLast=0;ndAcc=0;ndStopLoop();ndRaf=requestAnimationFrame(ndLoop);
}
function ndNewAttempt(){
  nd.attempt++;nd.deadT=0;nd.over=null;
  nd.st=ndNewState(nd.L,nd.practice?nd.check:null);
  if(!nd.practice)ndCountAttempt(nd.idx);
  ndMusicStart(nd.idx);
}
function ndLoop(ts){
  if(!ndActive()||!nd||ndView!=='game'){ndRaf=null;ndMusicStop();return;}
  if(!ndLast)ndLast=ts;
  ndAcc+=Math.min(100,ts-ndLast);ndLast=ts;
  while(ndAcc>=1000/60){ndTick();ndAcc-=1000/60;}
  const cv=document.getElementById('nd-canvas');if(cv)ndDraw(cv.getContext('2d'));
  ndRaf=requestAnimationFrame(ndLoop);
}
function ndTick(){
  if(!nd||nd.paused||nd.over)return;
  const st=nd.st;nd.frame++;
  if(st.dead){
    nd.deadT++;
    if(nd.deadT===1){
      ndBurst(st,26,'#fff');ndShake=10;ndSfx('ndDie');ndMusicStop();
      if(!nd.practice)ndRecordRun(nd.idx,{progress:ndProgress(st),won:false,coins:0});
    }
    if(nd.deadT>=34)ndNewAttempt();
    return;
  }
  const wasG=st.onGround,c0=st.coins,g0=st.g,ev0=st.ev,pad0=st.pad,orb0=st.orb;
  ndStep(st,ndHold);
  if(st.dead||st.won){if(st.won)ndWon();return;}
  if(ndHold&&wasG&&!st.onGround)ndSfx('ndJump');
  if(st.pad&&st.pad!==pad0)ndSfx('ndPad');
  if(st.orb!==orb0)ndSfx('ndOrb');
  if(st.coins!==c0){ndSfx('ndCoin');ndBurst(st,8,'#ffd54f');}
  if(st.g!==g0)ndSfx('ndFlip');
  if(nd.practice&&st.check&&st.ev!==ev0)nd.check=st.check;
  if(st.onGround&&Math.random()<0.5)ndParts.push({x:st.x,y:st.g>0?st.y+ND_PW:st.y,vx:-1-Math.random()*2,vy:(Math.random()-0.5)*1.5,life:14,c:ND_COLORS[ndProf().color][0],s:3});
  if(!st.onGround)st.rot+=st.g*0.12;else{const q=Math.PI/2;st.rot=Math.round(st.rot/q)*q;}
}
function ndSfx(n){try{if(typeof sfx==='function')sfx(n);}catch(e){}}
function ndBurst(st,n,col){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=2+Math.random()*5;ndParts.push({x:st.x+ND_PW/2,y:st.y+ND_PW/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:26+Math.random()*14,c:col,s:4});}}
function ndWon(){
  const st=nd.st;if(nd.over)return;
  ndMusicStop();ndSfx('ndWin');ndBurst(st,40,'#ffd54f');
  if(nd.practice)nd.over={practice:true};
  else{const res=ndRecordRun(nd.idx,{progress:100,won:true,coins:st.coins});nd.over=Object.assign({coins:ndBits(st.coins)},res);}
  ndRenderView();
}
function ndSetPractice(v){ndPractice=!!v;ndRenderView();}
function ndSetColor(i){const p=ndProf();if(!ndColorOpen(p,i))return;p.color=i;ndSaveProf(p);ndRenderView();}
function ndTogglePause(){if(!nd||nd.over)return;nd.paused=!nd.paused;if(nd.paused)ndMusicStop();else if(!nd.st.dead)ndMusicStart(nd.idx);ndRenderView();}
function ndRestartRun(){if(!nd)return;nd.check=null;nd.paused=false;ndNewAttempt();ndRenderView();}
function ndNextLevel(){if(nd&&nd.idx+1<ND_LEVELS.length)ndStart(nd.idx+1);else ndShowMenu();}

function ndRenderView(){
  const root=document.getElementById('nd-root');if(!root)return;
  if(ndView==='menu'){
    const p=ndProf(),stars=ndTotalStars(p);
    root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:10px">
        <span class="game-chip">⭐ <strong>${stars}</strong>/${ND_LEVELS.length*3}</span>
        <button type="button" class="lrn-chip ${ndPractice?'active':''}" onclick="ndSetPractice(${!ndPractice})" title="Bei einem Fehler geht es am letzten Checkpoint weiter. Zählt nicht für Sterne.">🔧 Übungsmodus ${ndPractice?'an':'aus'}</button></div>
      <div class="lrn-label" style="text-align:center">Würfelfarbe</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">${ND_COLORS.map((c,i)=>{const open=ndColorOpen(p,i);return `<button type="button" onclick="ndSetColor(${i})" title="${open?'Farbe wählen':'ab '+c[1]+' Sternen'}" style="width:34px;height:34px;border-radius:8px;border:2.5px solid ${p.color===i?'var(--text)':'var(--divider)'};background:${open?c[0]:'var(--bg)'};cursor:${open?'pointer':'default'};opacity:${open?1:0.5};font-size:11px;color:var(--text-3)">${open?'':'🔒'}</button>`;}).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px">${ND_LEVELS.map((L,i)=>{
        const r=p.lv[L.id],open=ndUnlocked(p,i);
        return `<button type="button" class="lrn-card" ${open?`onclick="ndStart(${i})"`:'disabled'} style="text-align:left;cursor:${open?'pointer':'default'};opacity:${open?1:0.5};font-family:inherit;color:var(--text);border-left:5px solid hsl(${L.hue},80%,55%)">
          <div style="font-size:11px;color:var(--text-3);font-weight:700">LEVEL ${i+1}</div><div style="font-size:16px;font-weight:800;margin:2px 0">${open?'':'🔒 '}${escHtml(L.name)}</div>
          <div class="lrn-bar" style="margin:6px 0"><div style="width:${r.best}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-2)"><span>${r.best} %${r.attempts?' · '+r.attempts+' Versuche':''}</span><span style="color:#f59f00;letter-spacing:1px">${'★'.repeat(r.stars)}<span style="opacity:.3">${'★'.repeat(3-r.stars)}</span></span></div>
          <div style="margin-top:4px;font-size:14px">${Array.from({length:L.coins},(_,k)=>r.coins&(1<<k)?'🪙':'<span style="opacity:.25">🪙</span>').join(' ')}</div></button>`;}).join('')}</div>
      <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px">Springen: Leertaste, ↑, W, Klick oder Tippen (gedrückt halten = bei jeder Landung erneut). Sprungfelder (gelb) schleudern dich hoch, Orbs (Kreise) geben in der Luft einen Extra-Sprung, Portale drehen die Schwerkraft. 1 ★ = geschafft, 2 ★ = 2 Münzen, 3 ★ = alle 3 Münzen in einem Lauf. 🪙 AppHub-Coins: 5 für das erste Schaffen, 3 je neuen Stern.</div>`;
    return;
  }
  const o=nd&&nd.over;
  root.innerHTML=`<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:8px">
      <span class="game-chip">🎯 <strong id="nd-pct">0</strong> %</span><span class="game-chip">Versuch <strong id="nd-att">1</strong></span><span class="game-chip">🪙 <strong id="nd-coins">0</strong>/${nd.L.coins}</span>
      <button class="lrn-btn ghost" onclick="ndTogglePause()">${nd.paused?'▶ Weiter':'⏸ Pause'}</button><button class="lrn-btn ghost" onclick="ndRestartRun()" title="Neu starten (R)">↺</button><button class="lrn-btn ghost" onclick="ndShowMenu()">☰ Level</button></div>
    <div style="position:relative;max-width:800px;margin:0 auto"><canvas id="nd-canvas" width="${ND_W}" height="${ND_H}" style="display:block;width:100%;height:auto;border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,0.35);touch-action:none;cursor:pointer" onpointerdown="ndHold=true;event.preventDefault()" onpointerup="ndHold=false" onpointerleave="ndHold=false" onpointercancel="ndHold=false" oncontextmenu="return false"></canvas>
      ${o?ndOverHtml(o):''}${nd.paused?'<div class="td-over"><div style="font-size:30px;font-weight:800">⏸ Pause</div><div style="margin-top:10px"><button class="lrn-btn" onclick="ndTogglePause()">▶ Weiter</button></div></div>':''}</div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:8px">${nd.practice?'🔧 Übungsmodus: Checkpoints ◆ setzen automatisch. · ':''}Leertaste / ↑ / Klick = springen · P = Pause · R = neu starten</div>`;
}
function ndOverHtml(o){
  const ghost='background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)';
  if(o.practice)return `<div class="td-over"><div style="font-size:40px">🔧</div><div style="font-size:22px;font-weight:800">Übung geschafft!</div><div style="font-size:13px;margin:6px 0 12px">Jetzt ohne Übungsmodus versuchen – nur dann gibt es Sterne.</div><div style="display:flex;gap:8px"><button class="lrn-btn" onclick="ndSetPractice(false);ndStart(nd.idx)">Ohne Übungsmodus</button><button class="lrn-btn ghost" style="${ghost}" onclick="ndShowMenu()">Menü</button></div></div>`;
  return `<div class="td-over"><div style="font-size:44px">🏆</div><div style="font-size:22px;font-weight:800">Level geschafft!</div>
    <div style="color:#ffca28;font-size:30px;letter-spacing:5px;margin:4px 0">${'★'.repeat(o.stars)}<span style="opacity:.3">${'★'.repeat(3-o.stars)}</span></div>
    <div style="font-size:13px;margin-bottom:10px">${o.coins}/${nd.L.coins} Münzen · ${nd.attempt} Versuch${nd.attempt===1?'':'e'}${o.paid?'<br>🪙 +'+o.paid+' AppHub-Coins':''}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="lrn-btn" onclick="ndNextLevel()">${nd.idx+1<ND_LEVELS.length?'Nächstes Level ▶':'Zum Menü'}</button><button class="lrn-btn ghost" style="${ghost}" onclick="ndRestartRun()">Nochmal</button></div></div>`;
}
function ndDraw(ctx){
  if(!nd||!nd.st)return;
  const st=nd.st,L=nd.L,cam=st.x-200,T=ND_T,hue=L.hue,pulse=1-(nd.frame%29)/29;
  ctx.save();
  if(ndShake>0){ctx.translate((Math.random()-0.5)*ndShake,(Math.random()-0.5)*ndShake);ndShake*=0.85;if(ndShake<0.5)ndShake=0;}
  const bg=ctx.createLinearGradient(0,0,0,ND_H);bg.addColorStop(0,`hsl(${hue},55%,${9+pulse*4}%)`);bg.addColorStop(1,`hsl(${hue+40},55%,${16+pulse*5}%)`);
  ctx.fillStyle=bg;ctx.fillRect(-20,-20,ND_W+40,ND_H+40);
  ctx.fillStyle=`hsla(${hue},70%,60%,0.07)`;                                    // Streifen im Hintergrund (bewegen sich langsamer als der Vordergrund)
  for(let i=-1;i<8;i++){const x=((i*140-(cam*0.3)%140)+140)%1120-140;ctx.fillRect(x,0,60,ND_H);}
  const c0=Math.max(0,Math.floor(cam/T)-1),c1=Math.min(L.cols-1,c0+Math.ceil(ND_W/T)+2);
  const edge=`hsl(${hue},85%,62%)`,fill=`hsl(${hue},45%,${13+pulse*3}%)`,have=ndProf().lv[L.id].coins;
  for(let c=c0;c<=c1;c++)for(let r=0;r<ND_ROWS;r++){
    const t=L.rows[r][c];if(t==='.')continue;const x=c*T-cam,y=r*T;
    if(t==='#'){ctx.fillStyle=fill;ctx.fillRect(x,y,T,T);ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,T-2,T-2);}
    else if(t==='^'||t==='v'){ctx.fillStyle='#fff';ctx.strokeStyle=`hsl(${hue+180},90%,60%)`;ctx.lineWidth=2;ctx.beginPath();if(t==='^'){ctx.moveTo(x+3,y+T);ctx.lineTo(x+T/2,y+9);ctx.lineTo(x+T-3,y+T);}else{ctx.moveTo(x+3,y);ctx.lineTo(x+T/2,y+T-9);ctx.lineTo(x+T-3,y);}ctx.closePath();ctx.fill();ctx.stroke();}
    else if(t==='='){ctx.fillStyle='#ffea00';ctx.shadowColor='#ffea00';ctx.shadowBlur=12;ctx.fillRect(x+2,y+T-10,T-4,8);ctx.shadowBlur=0;}
    else if(t==='o'){ctx.strokeStyle='#ffea00';ctx.shadowColor='#ffea00';ctx.shadowBlur=14;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+T/2,y+T/2,9+pulse*2.5,0,7);ctx.stroke();ctx.fillStyle='rgba(255,234,0,.35)';ctx.fill();ctx.shadowBlur=0;}
    else if(t==='c'){
      const i=L.coinIdx[r+','+c],got=i!==undefined&&(st.coins&(1<<i)),owned=i!==undefined&&(have&(1<<i));
      if(!got){ctx.fillStyle=owned?'rgba(255,213,79,.35)':'#ffd54f';ctx.shadowColor='#ffd54f';ctx.shadowBlur=owned?0:12;ctx.beginPath();ctx.arc(x+T/2,y+T/2,9,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='rgba(120,80,0,.6)';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('★',x+T/2,y+T/2+4);}
    }
  }
  L.events.forEach(e=>{
    const x=e.x-cam;if(x<-40||x>ND_W+40)return;
    if(e.t==='F'||e.t==='N'){const col=e.t==='F'?'#e040fb':'#00e5ff';ctx.fillStyle=col;ctx.globalAlpha=0.35+0.2*pulse;ctx.fillRect(x-6,0,12,ND_GROUND*T);ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.strokeRect(x-6,4,12,ND_GROUND*T-8);}
    else if(e.t==='E'){for(let r=0;r<ND_ROWS;r++){ctx.fillStyle=r%2?'#fff':'#222';ctx.fillRect(x,r*T,T/2,T);ctx.fillStyle=r%2?'#222':'#fff';ctx.fillRect(x+T/2,r*T,T/2,T);}}
    else if(e.t==='K'&&nd.practice){ctx.fillStyle='#69f0ae';ctx.beginPath();ctx.moveTo(x,ND_GROUND*T-30);ctx.lineTo(x+9,ND_GROUND*T-19);ctx.lineTo(x,ND_GROUND*T-8);ctx.lineTo(x-9,ND_GROUND*T-19);ctx.closePath();ctx.fill();}
  });
  for(let i=ndParts.length-1;i>=0;i--){const q=ndParts[i];q.x+=q.vx;q.y+=q.vy;q.vy+=0.25;q.life--;if(q.life<=0){ndParts.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,q.life/14);ctx.fillStyle=q.c;ctx.fillRect(q.x-cam-q.s/2,q.y-q.s/2,q.s,q.s);}
  ctx.globalAlpha=1;
  if(!st.dead){                                                                     // der Würfel
    const col=ND_COLORS[ndProf().color][0],cx=st.x-cam+ND_PW/2,cy=st.y+ND_PW/2;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(st.rot);ctx.shadowColor=col;ctx.shadowBlur=14;ctx.fillStyle=col;ctx.fillRect(-ND_PW/2,-ND_PW/2,ND_PW,ND_PW);ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=2;ctx.strokeRect(-ND_PW/2+1,-ND_PW/2+1,ND_PW-2,ND_PW-2);
    ctx.fillStyle='#111';ctx.fillRect(-8,-7,5,5);ctx.fillRect(3,-7,5,5);ctx.fillRect(-8,4,16,3);ctx.restore();
  }
  ctx.restore();
  const pr=ndProgress(st);
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(20,10,ND_W-40,8);ctx.fillStyle=`hsl(${hue},85%,62%)`;ctx.fillRect(20,10,(ND_W-40)*pr/100,8);
  ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='left';ctx.fillText(L.name,20,36);
  const pc=document.getElementById('nd-pct');if(pc&&pc.textContent!==String(pr))pc.textContent=pr;
  const at=document.getElementById('nd-att');if(at&&at.textContent!==String(nd.attempt))at.textContent=nd.attempt;
  const cn=document.getElementById('nd-coins');if(cn){const n=ndBits(st.coins);if(cn.textContent!==String(n))cn.textContent=n;}
}
document.addEventListener('keydown',e=>{
  if(!ndActive()||ndView!=='game')return;
  const k=e.key;
  if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){e.preventDefault();ndHold=true;}
  else if(k==='p'||k==='P'||k==='Escape'){e.preventDefault();ndTogglePause();}
  else if(k==='r'||k==='R'){e.preventDefault();ndRestartRun();}
});
document.addEventListener('keyup',e=>{if(e.key===' '||e.key==='ArrowUp'||e.key==='w'||e.key==='W')ndHold=false;});
window.addEventListener('blur',()=>{ndHold=false;if(nd&&ndView==='game'&&!nd.paused&&!nd.over&&ndActive())ndTogglePause();});
