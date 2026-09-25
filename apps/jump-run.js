/* ══════════════════════════════════
   SUPER JUMPER – Jump-and-Run (eigene Figuren und Grafik, komplett gezeichnet)
   Laufen, Springen, Münzen sammeln, Gegnern auf den Kopf springen, Stacheln und Löcher meiden,
   am Ende des Levels die Zielfahne erreichen. 6 Level auf einer Weltkarte, Geheimkammern, Power-ups,
   Checkpoints und ein Level-Editor (apps/jump-editor.js).
   Steuerung: ←/→ oder A/D laufen · Leertaste/↑/W springen (länger halten = höher)
   ↓/S ducken (auf einer goldenen Röhre gehalten = Geheimkammer) · in der Luft ↓/S = Slam-Attacke
   P oder Esc = Pause
══════════════════════════════════ */
const JR_T=32,JR_W=640,JR_H=384,JR_ROWS=12;
const JR_GRAV=0.5,JR_JUMP=11.2,JR_MAXFALL=12,JR_MAXV=3.4,JR_SLAM=14;
const JR_H_STAND=34,JR_H_DUCK=20;
const JR_POWER_FRAMES=1800;   // Feder und Magnet halten 30 Sekunden

/* ── Eigene Klänge (werden beim ersten Start beim Sound-System angemeldet) ── */
function jrRegisterSounds(){
  if(typeof SFX_SOUNDS==='undefined'||typeof sfxTone!=='function'||SFX_SOUNDS.jrJump)return;
  Object.assign(SFX_SOUNDS,{
    jrJump:c=>sfxTone(c,330,0.16,'square',0.09,0,720),
    jrDouble:c=>sfxTone(c,520,0.14,'triangle',0.16,0,1100),
    jrLand:c=>{sfxNoise(c,0.05,0.1,0,300);sfxTone(c,140,0.06,'sine',0.12,0,80);},
    jrCoin:c=>{sfxTone(c,1175,0.05,'square',0.07);sfxTone(c,1568,0.16,'square',0.07,0.05);},
    jrStomp:c=>{sfxTone(c,260,0.09,'square',0.13,0,120);sfxNoise(c,0.05,0.09,0,900);},
    jrBump:c=>sfxTone(c,180,0.07,'square',0.11,0,120),
    jrBreak:c=>{sfxNoise(c,0.18,0.26,0,700);sfxTone(c,200,0.12,'sawtooth',0.09,0,90);},
    jrSlam:c=>sfxTone(c,520,0.14,'sawtooth',0.11,0,120),
    jrBoom:c=>{sfxNoise(c,0.28,0.32,0,300);sfxTone(c,90,0.3,'sine',0.28,0,40);},
    jrPower:c=>[523,659,784,1046,1319].forEach((f,i)=>sfxTone(c,f,0.09,'square',0.08,i*0.06)),
    jrShield:c=>sfxTone(c,700,0.22,'triangle',0.15,0,240),
    jrCheck:c=>[659,784,988].forEach((f,i)=>sfxTone(c,f,0.12,'triangle',0.2,i*0.08)),
    jrDie:c=>[392,330,262,196].forEach((f,i)=>sfxTone(c,f,0.2,'sawtooth',0.11,i*0.13)),
    jrWarp:c=>sfxTone(c,880,0.35,'sine',0.18,0,110),
    jrPause:c=>sfxTone(c,600,0.06,'square',0.07),
    jrClear:c=>[523,659,784,1046,784,1046,1319].forEach((f,i)=>sfxTone(c,f,0.14,'square',0.09,i*0.09))
  });
  if(typeof SFX_GAME_SCREENS!=='undefined'&&!SFX_GAME_SCREENS.includes('screen-jumprun'))SFX_GAME_SCREENS.push('screen-jumprun');
  if(typeof sfxUpdateBtn==='function')try{sfxUpdateBtn();}catch(e){}
}
function jrSfx(n){if(typeof sfx==='function')sfx(n);}

/* ── Level-Bau: Boden-Abschnitte, Plattformen, Blöcke, Power-ups, Münzen, Gegner, Röhren, Stacheln ── */
function jrBuild(spec){
  const w=spec.w,g=Array.from({length:JR_ROWS},()=>Array(w).fill('.'));
  const powers={},warps={};
  (spec.ground||[]).forEach(([a,b])=>{for(let x=a;x<=b;x++){g[10][x]='#';g[11][x]='#';}});
  (spec.platforms||[]).forEach(([x,y,len,ch])=>{for(let i=0;i<len;i++)g[y][x+i]=ch||'B';});
  (spec.blocks||[]).forEach(([x,y])=>{g[y][x]='?';});
  (spec.power||[]).forEach(([x,y,type])=>{g[y][x]='!';powers[x+','+y]=type;});
  (spec.pipes||[]).forEach(([x,h])=>{for(let r=0;r<h;r++){g[9-r][x]='T';g[9-r][x+1]='T';}});
  (spec.warps||[]).forEach(([x,h,bonus])=>{for(let r=0;r<h;r++){g[9-r][x]='W';g[9-r][x+1]='W';}warps[x]=bonus;warps[x+1]=bonus;});
  (spec.exits||[]).forEach(([x,h])=>{for(let r=0;r<h;r++){g[9-r][x]='X';g[9-r][x+1]='X';}});
  (spec.spikes||[]).forEach(([a,b])=>{for(let x=a;x<=b;x++)g[9][x]='s';});
  (spec.stairs||[]).forEach(([x,h])=>{for(let i=0;i<h;i++)for(let r=0;r<=i;r++)g[9-r][x+i]='B';});
  (spec.coins||[]).forEach(([x,y])=>{if(g[y][x]==='.')g[y][x]='o';});
  (spec.coinRows||[]).forEach(([x,y,n])=>{for(let i=0;i<n;i++)if(g[y][x+i]==='.')g[y][x+i]='o';});
  if(spec.flag!=null)for(let r=2;r<=9;r++)g[r][spec.flag]='F';
  (spec.checkpoint||[]).forEach(x=>{g[8][x]='K';g[9][x]='K';});
  // Tunnel: 1 Kachel niedrig -> nur geduckt passierbar, mit Münzen als Belohnung
  (spec.tunnels||[]).forEach(([x,len])=>{for(let i=0;i<len;i++){g[8][x+i]='B';g[9][x+i]='o';}});
  const enemies=(spec.enemies||[]).map(([x,y])=>({x:x*JR_T+3,y:(y+1)*JR_T-24,w:26,h:24,vx:-0.8,dir:-1,alive:true,squash:0}));
  return {w,g,enemies,powers,warps,start:spec.start||[2,8],theme:spec.theme||0,time:spec.time||300,name:spec.name};
}
const JR_SPECS=[
  {name:'Grüne Wiesen',theme:0,w:112,flag:106,time:300,
   ground:[[0,24],[27,52],[56,80],[83,111]],
   checkpoint:[50],
   tunnels:[[33,4]],
   platforms:[[11,7,5,'B'],[36,7,4,'B'],[60,7,3,'B'],[70,7,6,'B'],[93,7,4,'B']],
   blocks:[[13,7],[38,7],[72,7],[95,7]],
   power:[[61,7,'shield']],
   pipes:[[20,2],[66,2],[88,2]],
   warps:[[45,3,0]],
   coinRows:[[12,6,4],[37,6,3],[70,6,5],[92,6,5]],
   coins:[[25,7],[26,6],[54,7],[55,6],[81,7],[82,6]],
   enemies:[[16,9],[32,9],[42,9],[62,9],[74,9],[90,9],[98,9]],
   stairs:[[100,4]]},
  {name:'Abendrot-Schlucht',theme:1,w:136,flag:130,time:300,
   ground:[[0,17],[21,38],[42,58],[62,80],[84,100],[104,122],[125,135]],
   checkpoint:[64],
   tunnels:[[43,3]],
   platforms:[[8,7,4,'B'],[26,7,5,'B'],[48,7,4,'B'],[68,7,4,'B'],[90,7,5,'B'],[110,7,4,'B']],
   blocks:[[9,7],[28,7],[49,7],[92,7],[112,7]],
   power:[[70,7,'feather']],
   pipes:[[14,2],[54,2],[76,3],[96,2],[116,3]],
   warps:[[34,3,1]],
   coinRows:[[8,6,4],[26,6,5],[48,6,4],[68,6,4],[90,6,5],[110,6,4]],
   coins:[[19,5],[40,5],[59,5],[81,5],[101,5],[123,5]],
   enemies:[[10,9],[24,9],[30,9],[46,9],[52,9],[66,9],[72,9],[88,9],[94,9],[108,9],[114,9]],
   stairs:[[126,4]]},
  {name:'Mitternachts-Burg',theme:2,w:158,flag:152,time:260,
   ground:[[0,14],[18,32],[36,50],[54,68],[72,86],[90,104],[108,122],[126,140],[144,157]],
   checkpoint:[75],
   tunnels:[[55,3]],
   platforms:[[9,7,4,'B'],[27,7,4,'B'],[45,7,4,'B'],[63,7,4,'B'],[81,7,4,'B'],[99,7,4,'B'],[117,7,4,'B'],[135,7,4,'B']],
   blocks:[[10,7],[28,7],[46,7],[64,7],[100,7],[118,7]],
   power:[[82,7,'magnet'],[136,7,'shield']],
   pipes:[[6,2],[60,3],[96,3],[132,3]],
   warps:[[24,3,0]],
   spikes:[[42,43],[78,79],[114,115]],
   coinRows:[[9,6,4],[27,6,4],[45,6,4],[63,6,4],[81,6,4],[99,6,4],[117,6,4],[135,6,4]],
   coins:[[15,5],[16,5],[33,5],[34,5],[51,5],[52,5],[69,5],[70,5],[87,5],[88,5],[105,5],[106,5],[123,5],[124,5],[141,5],[142,5]],
   enemies:[[12,9],[21,9],[30,9],[66,9],[93,9],[102,9],[129,9],[148,9]],
   stairs:[[146,4]]}
];

/* Generator für die Level 4–6: gleichmäßige Abschnitte (je 15 Kacheln) mit einem Merkmal pro Abschnitt.
   Regeln, damit alles schaffbar bleibt: Landezone am Anfang frei, Stacheln nie unter Plattformen,
   keine Gegner in Stachel-Abschnitten, Löcher höchstens 3 Kacheln breit. */
function jrGenSpec(name,theme,time,plan,gaps){
  const L=15,ground=[],platforms=[],blocks=[],power=[],pipes=[],warps=[],spikes=[],coinRows=[],coins=[],enemies=[],stairs=[],tunnels=[],checkpoint=[];
  let x=0,flag=0;
  plan.forEach((kind,i)=>{
    const a=x,len=kind==='finish'?18:L,b=a+len-1;ground.push([a,b]);
    const [k,arg]=kind.split(':');
    switch(k){
      case 'start':coinRows.push([a+5,7,4]);enemies.push([a+11,9]);break;
      case 'plain':coinRows.push([a+4,7,5]);enemies.push([a+9,9]);break;
      case 'pipe':pipes.push([a+6,arg==='3'?3:2]);enemies.push([a+11,9]);coinRows.push([a+5,arg==='3'?5:6,4]);break;
      case 'spikes':if(arg==='3'){spikes.push([a+4,a+5],[a+9,a+10]);coinRows.push([a+4,6,7]);}else{spikes.push([a+6,a+7]);coinRows.push([a+5,6,4]);}break;
      case 'platform':platforms.push([a+8,7,4,'B']);blocks.push([a+9,7]);coinRows.push([a+8,6,4]);enemies.push([a+4,9]);break;
      case 'power':platforms.push([a+8,7,4,'B']);power.push([a+9,7,arg||'shield']);coinRows.push([a+8,6,4]);enemies.push([a+3,9]);break;
      case 'tunnel':tunnels.push([a+6,3]);enemies.push([a+11,9]);break;
      case 'stairs':stairs.push([a+7,3]);enemies.push([a+3,9]);break;
      case 'enemies':enemies.push([a+4,9],[a+9,9]);coinRows.push([a+5,7,4]);break;
      case 'warp':warps.push([a+6,2,+arg||0]);enemies.push([a+11,9]);break;
      case 'checkpoint':checkpoint.push(a+4);coinRows.push([a+7,7,5]);enemies.push([a+11,9]);break;
      case 'finish':stairs.push([a+4,4]);flag=b-5;break;
    }
    x=b+1+gaps[i%gaps.length];
  });
  const w=x-gaps[(plan.length-1)%gaps.length]+0;
  return {name,theme,time,w:Math.max(w,flag+8),flag,ground,platforms,blocks,power,pipes,warps,spikes,coinRows,coins,enemies,stairs,tunnels,checkpoint};
}
JR_SPECS.push(
  jrGenSpec('Kristallhöhle',3,300,['start','plain','pipe','platform','spikes','plain','tunnel','checkpoint','warp:1','stairs','power:feather','spikes','platform','plain','finish'],[2,3,3,3,3,3,3]),
  jrGenSpec('Schneegipfel',4,290,['start','plain','pipe:3','spikes','platform','stairs','power:magnet','tunnel','checkpoint','spikes:3','plain','warp:0','platform','pipe:3','plain','spikes','finish'],[3,3,3,3,3,3,3]),
  jrGenSpec('Vulkan-Festung',5,280,['start','enemies','spikes:3','pipe:3','power:shield','platform','spikes','tunnel','checkpoint','stairs','spikes:3','warp:1','power:feather','enemies','pipe:3','spikes:3','platform','plain','finish'],[3,3,3,3,3,3,3])
);

/* Geheimkammern (Bonusräume): über goldene Röhren erreichbar, Ausgang = Röhre rechts */
const JR_BONUS_SPECS=[
  {name:'Geheimkammer',theme:3,w:26,ground:[[0,25]],start:[2,8],
   coinRows:[[4,8,6],[12,6,6],[19,8,5]],
   coins:[[8,5],[9,4],[10,4],[11,5],[15,4],[16,3],[17,4]],
   exits:[[22,2]]},
  {name:'Schatzkammer',theme:3,w:26,ground:[[0,25]],start:[2,8],
   coinRows:[[5,8,5],[11,6,4],[17,8,5]],
   coins:[[7,4],[8,3],[9,3],[10,4],[14,3],[15,2],[16,3],[18,5],[19,4],[20,5]],
   power:[[13,6,'shield']],
   exits:[[23,2]]}
];
const JR_LEVELS=JR_SPECS.map(jrBuild);
const JR_BONUS=JR_BONUS_SPECS.map(jrBuild);
JR_BONUS.forEach(L=>{L.bonus=true;});

/* ── Zustand ── */
let jrState=null,jrRaf=null,jrLast=0,jrAcc=0,jrFrame=0;
const jrIn={left:false,right:false,jump:false,jumpHeld:false,down:false,downPress:false};
function jrLoad(k,d){try{const v=localStorage.getItem(k);return v===null?d:parseInt(v,10)||d;}catch(e){return d;}}
function jrSave(k,v){try{localStorage.setItem(k,String(v));}catch(e){}}

function jrCloneFrom(L,idx){
  return {idx,w:L.w,g:L.g.map(r=>r.slice()),theme:L.theme,name:L.name,bonus:!!L.bonus,custom:!!L.custom,
    enemies:L.enemies.map(e=>({...e})),start:L.start.slice(),time:L.time,
    powers:Object.assign({},L.powers||{}),warps:Object.assign({},L.warps||{})};
}
function jrCloneLevel(idx){return jrCloneFrom(JR_LEVELS[idx],idx);}
function jrPlayerAt(level){
  return {x:level.start[0]*JR_T+5,y:level.start[1]*JR_T,w:22,h:JR_H_STAND,vx:0,vy:0,onGround:false,face:1,coyote:0,jbuf:0,anim:0,
    duck:false,slam:false,nocut:false,inv:0,shield:false,feather:0,magnet:0,dj:false,sg:0,warpT:0};
}
/* Neues Spiel (idx = Startlevel) */
function jrNewState(idx){
  const n=JR_LEVELS.length,lvl=jrCloneLevel(Math.max(0,Math.min(n-1,idx||0)));
  return {mode:'menu',level:lvl,p:jrPlayerAt(lvl),cam:0,coins:0,score:0,lives:3,timeLeft:lvl.time,frames:0,paused:false,fade:0,
    popups:[],fx:[],shake:0,shock:null,checkpoint:null,stack:[],custom:false,customSrc:null,timer:0,bumps:{},sel:Math.max(0,Math.min(n-1,idx||0)),
    best:jrLoad('zf_jump_best',0),unlocked:Math.max(1,Math.min(n,jrLoad('zf_jump_unlocked',1))),done:jrLoad('zf_jump_done',0),msg:''};
}
/* Level (neu) laden, Fortschritt (Münzen, Punkte, Leben) bleibt */
function jrLoadLevel(st,idx){
  st.level=st.customSrc?jrCloneFrom(st.customSrc,-1):jrCloneLevel(idx);
  st.p=jrPlayerAt(st.level);st.cam=0;st.timeLeft=st.level.time;st.frames=0;st.popups=[];st.bumps={};st.fx=[];st.shake=0;st.shock=null;st.checkpoint=null;st.stack=[];
}
function jrStart(idx){
  const keep=jrState;
  jrState=jrNewState(idx);
  if(keep){jrState.unlocked=Math.max(jrState.unlocked,keep.unlocked);}
  jrState.mode='play';jrHud(true);
  jrSfx('click');
}
/* Eigenes Level (aus dem Editor) testen */
function jrStartCustom(src){
  jrState=jrNewState(0);
  jrState.customSrc=src;jrState.custom=true;
  jrLoadLevel(jrState,0);jrState.mode='play';jrHud(true);
}

/* ── Kollision ── */
const JR_SOLID={'#':1,'B':1,'?':1,'!':1,'U':1,'T':1,'W':1,'X':1};
function jrTile(st,tx,ty){
  if(tx<0||tx>=st.level.w)return '#';   // seitliche Ränder sind Wände
  if(ty<0)return '.';
  if(ty>=JR_ROWS)return '.';            // unten: Abgrund
  return st.level.g[ty][tx];
}
function jrSolid(st,tx,ty){return !!JR_SOLID[jrTile(st,tx,ty)];}
/* bewegt ein Rechteck (x,y,w,h) mit Geschwindigkeit; gibt {hitX,ground,head} zurück */
function jrMove(st,o){
  const T=JR_T,res={hitX:false,ground:false,head:[]};
  // horizontal
  o.x+=o.vx;
  let y0=Math.floor(o.y/T),y1=Math.floor((o.y+o.h-0.01)/T);
  if(o.vx>0){const tx=Math.floor((o.x+o.w)/T);for(let ty=y0;ty<=y1;ty++)if(jrSolid(st,tx,ty)){o.x=tx*T-o.w-0.01;o.vx=0;res.hitX=true;break;}}
  else if(o.vx<0){const tx=Math.floor(o.x/T);for(let ty=y0;ty<=y1;ty++)if(jrSolid(st,tx,ty)){o.x=(tx+1)*T+0.01;o.vx=0;res.hitX=true;break;}}
  // vertikal
  o.y+=o.vy;
  const x0=Math.floor(o.x/T),x1=Math.floor((o.x+o.w-0.01)/T);
  if(o.vy>0){const ty=Math.floor((o.y+o.h)/T);for(let tx=x0;tx<=x1;tx++)if(jrSolid(st,tx,ty)){o.y=ty*T-o.h-0.01;o.vy=0;res.ground=true;break;}}
  else if(o.vy<0){const ty=Math.floor(o.y/T);for(let tx=x0;tx<=x1;tx++)if(jrSolid(st,tx,ty)){o.y=(ty+1)*T+0.01;o.vy=0;res.head.push([tx,ty]);}}
  return res;
}

/* ── Effekte: Partikel, Staub, Stoßwelle, Wackeln ── */
function jrFx(st){
  if(!st.fx)return;
  st.fx.forEach(f=>{f.x+=f.vx;f.y+=f.vy;f.vy+=f.dust?0.02:0.4;f.t--;});
  st.fx=st.fx.filter(f=>f.t>0);
  if(st.shock&&--st.shock.t<=0)st.shock=null;
  if(st.shake>0)st.shake--;
}
function jrBurst(st,x,y,color,n){
  for(let i=0;i<n;i++)st.fx.push({x,y,vx:(Math.random()-0.5)*6,vy:-Math.random()*5-1,t:28+Math.floor(Math.random()*10),color,s:3+Math.floor(Math.random()*3)});
}
function jrDust(st,x,y,n,dir){
  for(let i=0;i<n;i++)st.fx.push({x:x+(Math.random()-0.5)*10,y,vx:(dir||0)*-0.6+(Math.random()-0.5)*1.4,vy:-Math.random()*0.8,t:16+Math.floor(Math.random()*8),color:'rgba(255,255,255,0.7)',s:3+Math.random()*3,dust:true});
}
/* Schweif-Effekt der Held-Skins (Regenbogen, Gold, Feuer, Eis) */
function jrTrail(st,kind){
  const p=st.p;if(st.frames%2)return;
  const c=kind==='rainbow'?'hsl('+((st.frames*9)%360)+',90%,60%)':kind==='gold'?'#ffd54f':kind==='fire'?(st.frames%4?'#ff7043':'#ffca28'):'#b3e5fc';
  st.fx.push({x:p.x+p.w/2-p.face*8,y:p.y+p.h*0.55+(Math.random()-0.5)*8,vx:-p.face*0.4,vy:(Math.random()-0.5)*0.5,t:22,color:c,s:4+Math.random()*3,dust:true,glowy:true});
}

/* ── Ein Bild (1/60 s) Spiellogik ── */
function jrStep(st,inp){
  inp=inp||jrIn;
  if(st.paused)return;
  st.frames++;
  jrFx(st);
  if(st.fade>0)st.fade--;
  if(st.mode==='dying'){
    const p=st.p;p.vy=Math.min(JR_MAXFALL,p.vy+JR_GRAV);p.y+=p.vy;
    if(--st.timer<=0)jrAfterDeath(st);
    return;
  }
  if(st.mode==='clear'){
    if(--st.timer<=0)jrNextLevel(st);
    return;
  }
  if(st.mode!=='play')return;
  const p=st.p,T=JR_T;
  // Zeit
  if(st.frames%60===0){st.timeLeft--;if(st.timeLeft<=0){jrDie(st);return;}}
  if(p.inv>0)p.inv--;
  if(p.sg>0)p.sg--;
  if(p.feather>0)p.feather--;
  if(p.magnet>0)p.magnet--;
  // Ducken (nur am Boden). Aufstehen nur, wenn über dem Kopf Platz ist.
  const wantDuck=!!inp.down&&p.onGround&&!p.slam;
  if(wantDuck&&!p.duck){p.duck=true;p.y+=JR_H_STAND-JR_H_DUCK;p.h=JR_H_DUCK;}
  else if(!wantDuck&&p.duck){
    const ny=p.y-(JR_H_STAND-JR_H_DUCK),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-0.01)/T),ty=Math.floor(ny/T);
    let free=true;for(let tx=x0;tx<=x1;tx++)if(jrSolid(st,tx,ty))free=false;
    if(free||!p.onGround){p.duck=false;p.y=ny;p.h=JR_H_STAND;}
  }
  // Slam-Attacke: in der Luft ↓ drücken -> mit Wucht senkrecht nach unten
  if(inp.downPress){inp.downPress=false;if(!p.onGround&&!p.slam&&!p.duck){p.slam=true;p.vx=0;p.jbuf=0;jrSfx('jrSlam');}}
  // Eingabe -> Bewegung
  const dir=(inp.right?1:0)-(inp.left?1:0),maxV=p.duck?1.3:JR_MAXV,acc=p.onGround?0.6:0.4;
  if(p.slam)p.vx=0;
  else{
    if(dir){
      p.face=dir;
      let nv=p.vx+dir*acc;
      if(Math.abs(nv)>maxV)nv=Math.sign(nv)*Math.max(maxV,Math.abs(p.vx)-0.5);   // am Limit: nie schneller werden
      p.vx=nv;
    }
    else p.vx*=p.onGround?0.78:0.96;
    if(Math.abs(p.vx)<0.08)p.vx=0;
  }
  // Sprung: normal (mit Coyote-Zeit und Puffer) oder Doppelsprung mit der Feder
  const jumpPressed=!!inp.jump;
  if(jumpPressed){p.jbuf=8;inp.jump=false;}else if(p.jbuf>0)p.jbuf--;
  if(p.onGround){p.coyote=6;p.dj=false;}else if(p.coyote>0)p.coyote--;
  if(p.jbuf>0&&p.coyote>0&&!p.slam){
    p.vy=-JR_JUMP;p.jbuf=0;p.coyote=0;p.onGround=false;
    jrSfx('jrJump');jrDust(st,p.x+p.w/2,p.y+p.h,3,0);
  }else if(jumpPressed&&!p.onGround&&p.coyote<=0&&p.feather>0&&!p.dj&&!p.slam){
    p.vy=-JR_JUMP*0.92;p.dj=true;p.jbuf=0;
    jrSfx('jrDouble');jrBurst(st,p.x+p.w/2,p.y+p.h,'#e1f5fe',6);
  }
  if(p.slam)p.vy=JR_SLAM;
  else{
    if(p.nocut&&(p.vy>=0||p.onGround))p.nocut=false;
    if(!inp.jumpHeld&&p.vy<-4&&!p.nocut)p.vy=-4;     // kurzer Tipp = kleiner Sprung (nicht bei Abprallern)
    p.vy=Math.min(JR_MAXFALL,p.vy+JR_GRAV);
  }
  const preVy=p.vy,wasAir=!p.onGround;
  const r=jrMove(st,p);
  p.onGround=r.ground;
  if(r.ground&&p.slam)jrSlamLand(st);
  else if(r.ground&&wasAir&&preVy>4){jrDust(st,p.x+p.w/2,p.y+p.h,5,0);jrSfx('jrLand');}
  if(p.onGround&&Math.abs(p.vx)>2&&st.frames%6===0)jrDust(st,p.x+p.w/2-p.face*6,p.y+p.h,1,p.face);
  p.anim+=Math.abs(p.vx)*0.15;
  const skinTrail=jrSkin().trail;if(skinTrail&&(Math.abs(p.vx)>0.5||!p.onGround))jrTrail(st,skinTrail);
  // Kopf an Blöcken
  r.head.forEach(([tx,ty])=>{
    const c=jrTile(st,tx,ty);
    if(c==='?'){
      st.level.g[ty][tx]='U';st.coins++;st.score+=50;st.bumps[tx+','+ty]=10;
      st.popups.push({x:tx*T+T/2,y:ty*T,t:30,txt:'+50'});
      jrSfx('jrCoin');jrCheckLife(st);
    }else if(c==='!'){
      st.level.g[ty][tx]='U';st.bumps[tx+','+ty]=10;
      jrGrantPower(st,st.level.powers[tx+','+ty]||'shield',tx*T+T/2,ty*T);
    }else{st.bumps[tx+','+ty]=8;jrSfx('jrBump');}
  });
  // Münzen (und Magnet), Stacheln, Checkpoint, Fahne
  const cx0=Math.floor(p.x/T),cx1=Math.floor((p.x+p.w)/T),cy0=Math.floor(p.y/T),cy1=Math.floor((p.y+p.h-0.01)/T);
  for(let ty=cy0;ty<=cy1;ty++)for(let tx=cx0;tx<=cx1;tx++){
    const t=jrTile(st,tx,ty);
    if(t==='o')jrCollectCoin(st,tx,ty);
    else if(t==='s'){if(p.sg<=0&&p.y+p.h>ty*T+14){if(jrHurt(st,true))return;}}
    else if(t==='K'){jrCheckpoint(st,tx);}
    else if(t==='F'){jrClear(st);return;}
  }
  if(p.magnet>0){
    const mx=p.x+p.w/2,my=p.y+p.h/2,R=JR_T*3;
    for(let ty=Math.floor((my-R)/T);ty<=Math.floor((my+R)/T);ty++)for(let tx=Math.floor((mx-R)/T);tx<=Math.floor((mx+R)/T);tx++){
      if(jrTile(st,tx,ty)==='o'&&Math.hypot(tx*T+T/2-mx,ty*T+T/2-my)<=R)jrCollectCoin(st,tx,ty);
    }
  }
  // Geheimkammern: auf einer goldenen Röhre ↓ gehalten
  if(p.onGround&&inp.down){
    const bx=Math.floor((p.x+p.w/2)/T),by=Math.floor((p.y+p.h+1)/T),below=jrTile(st,bx,by);
    if(below==='W'&&st.level.warps[bx]!=null){if(++p.warpT>=18){jrEnterBonus(st,st.level.warps[bx],bx);return;}}
    else if(below==='X'&&st.stack.length){if(++p.warpT>=18){jrExitBonus(st);return;}}
    else p.warpT=0;
  }else p.warpT=0;
  // Abgrund
  if(p.y>JR_ROWS*T+40){jrDie(st);return;}
  // Gegner
  for(const e of st.level.enemies){
    if(!e.alive){if(e.squash>0)e.squash--;continue;}
    e.vy=(e.vy||0)+JR_GRAV;if(e.vy>JR_MAXFALL)e.vy=JR_MAXFALL;
    const before=e.x,rr=jrMove(st,{get x(){return e.x;},set x(v){e.x=v;},get y(){return e.y;},set y(v){e.y=v;},
      get vx(){return e.vx;},set vx(v){e.vx=v;},get vy(){return e.vy;},set vy(v){e.vy=v;},w:e.w,h:e.h});
    if(rr.hitX||e.x===before){e.dir*=-1;e.vx=0.8*e.dir;}
    // an Kanten umdrehen (kein Abstürzen)
    const aheadX=e.dir>0?e.x+e.w+2:e.x-2,footY=Math.floor((e.y+e.h+2)/T);
    if(rr.ground&&!jrSolid(st,Math.floor(aheadX/T),footY)){e.dir*=-1;e.vx=0.8*e.dir;}
    if(e.y>JR_ROWS*T+60)e.alive=false;
    // Berührung mit dem Spieler
    if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
      if(p.vy>0&&(p.y+p.h)-e.y<18){
        e.alive=false;e.squash=25;st.score+=100;
        if(!p.slam){p.vy=inp.jumpHeld?-10.5:-8;p.onGround=false;p.nocut=true;}
        st.popups.push({x:e.x+e.w/2,y:e.y,t:30,txt:'+100'});
        jrSfx('jrStomp');
      }else if(p.inv<=0){if(jrHurt(st,false))return;}
    }
  }
  // Popups / Wackeln
  st.popups.forEach(o=>{o.t--;o.y-=0.8;});st.popups=st.popups.filter(o=>o.t>0);
  Object.keys(st.bumps).forEach(k=>{if(--st.bumps[k]<=0)delete st.bumps[k];});
  // Kamera
  const target=Math.max(0,Math.min(st.level.w*T-JR_W,p.x+p.w/2-JR_W/2+p.face*30));
  st.cam+=(target-st.cam)*0.12;
}
const JR_BREAKABLE={'B':1,'?':1,'!':1,'U':1};
/* Slam-Landung: bricht Blöcke direkt unter den Füßen (die Attacke geht dann weiter nach unten);
   auf hartem Boden endet sie mit einer Stoßwelle, die Gegner in der Nähe besiegt. */
function jrSlamLand(st){
  const p=st.p,T=JR_T,ty=Math.floor((p.y+p.h+1)/T),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-0.01)/T);
  let broke=0;
  for(let tx=x0;tx<=x1;tx++){
    const c=jrTile(st,tx,ty);
    if(JR_BREAKABLE[c]){
      st.level.g[ty][tx]='.';broke++;
      if(c==='?'){st.coins++;st.score+=50;st.popups.push({x:tx*T+T/2,y:ty*T,t:30,txt:'+50'});jrCheckLife(st);}
      else if(c==='!')jrGrantPower(st,st.level.powers[tx+','+ty]||'shield',tx*T+T/2,ty*T);
      else st.score+=10;
      jrBurst(st,tx*T+T/2,ty*T+T/2,c==='?'||c==='!'?'#ffca28':'#c8642a',8);
    }
  }
  if(broke){
    st.shake=6;p.onGround=false;p.vy=JR_SLAM;
    jrSfx('jrBreak');
    return;                       // Slam läuft weiter durch die zerstörten Blöcke
  }
  p.slam=false;p.vy=0;
  st.shake=10;st.shock={x:p.x+p.w/2,y:p.y+p.h,t:16};
  jrBurst(st,p.x+p.w/2,p.y+p.h,'#d7ccc8',10);jrDust(st,p.x+p.w/2,p.y+p.h,8,0);
  const cx=p.x+p.w/2,fy=p.y+p.h;
  for(const e of st.level.enemies){
    if(e.alive&&Math.abs(e.x+e.w/2-cx)<72&&Math.abs(e.y+e.h-fy)<22){
      e.alive=false;e.squash=25;st.score+=100;st.popups.push({x:e.x+e.w/2,y:e.y,t:30,txt:'+100'});
    }
  }
  jrSfx('jrBoom');
}
function jrCollectCoin(st,tx,ty){
  st.level.g[ty][tx]='.';st.coins++;st.score+=10;
  jrBurst(st,tx*JR_T+JR_T/2,ty*JR_T+JR_T/2,'#ffe082',3);
  jrCheckLife(st);jrSfx('jrCoin');
}
function jrGrantPower(st,type,x,y){
  const p=st.p,names={shield:'🛡️ Schild!',feather:'🪶 Doppelsprung!',magnet:'🧲 Münz-Magnet!'};
  if(type==='shield')p.shield=true;
  else if(type==='feather')p.feather=JR_POWER_FRAMES;
  else if(type==='magnet')p.magnet=JR_POWER_FRAMES;
  st.popups.push({x,y:y-4,t:70,txt:names[type]||'Power-up!'});
  jrBurst(st,x,y+8,'#b388ff',10);
  jrSfx('jrPower');
}
/* Schaden: Schild fängt einen Treffer ab, sonst Tod. Gibt true zurück, wenn der Spieler gestorben ist. */
function jrHurt(st,fromSpike){
  const p=st.p;
  if(p.shield){
    p.shield=false;p.inv=90;p.sg=10;p.vy=-8;p.onGround=false;p.slam=false;p.nocut=true;
    st.popups.push({x:p.x+p.w/2,y:p.y-6,t:40,txt:'Schild weg!'});
    jrBurst(st,p.x+p.w/2,p.y+p.h/2,'#80d8ff',12);jrSfx('jrShield');
    return false;
  }
  jrDie(st);return true;
}
function jrCheckpoint(st,tx){
  if(st.checkpoint&&st.checkpoint.col===tx)return;
  st.checkpoint={col:tx,x:tx*JR_T+5,y:10*JR_T-JR_H_STAND-0.01};
  st.popups.push({x:tx*JR_T+JR_T/2,y:7*JR_T,t:70,txt:'Checkpoint!'});
  jrSfx('jrCheck');
}
function jrCheckLife(st){if(st.coins>0&&st.coins%25===0){st.lives++;st.popups.push({x:st.p.x,y:st.p.y-10,t:60,txt:'❤️ +1'});jrSfx('rankup');}}

/* ── Geheimkammern ── */
function jrEnterBonus(st,idx,col){
  const p=st.p;
  st.stack.push({level:st.level,x:p.x,y:p.y,cam:st.cam,col,idx});
  st.level=jrCloneFrom(JR_BONUS[idx%JR_BONUS.length],st.level.idx);
  const keep={shield:p.shield,feather:p.feather,magnet:p.magnet};
  st.p=jrPlayerAt(st.level);Object.assign(st.p,keep);
  st.cam=0;st.fx=[];st.popups=[];st.bumps={};st.fade=24;
  jrSfx('jrWarp');
}
function jrExitBonus(st){
  const top=st.stack.pop();if(!top)return;
  const keep={shield:st.p.shield,feather:st.p.feather,magnet:st.p.magnet};
  st.level=top.level;
  // die benutzte Röhre wird zur normalen Röhre (die Kammer gibt es nur einmal)
  for(let r=0;r<JR_ROWS;r++)for(let c=0;c<st.level.w;c++)if(st.level.g[r][c]==='W'&&st.level.warps[c]===top.idx)st.level.g[r][c]='T';
  Object.keys(st.level.warps).forEach(k=>{if(st.level.warps[k]===top.idx)delete st.level.warps[k];});
  st.p=jrPlayerAt(st.level);st.p.x=top.x;st.p.y=top.y-4;Object.assign(st.p,keep);
  st.cam=top.cam;st.fx=[];st.popups=[];st.fade=24;
  jrSfx('jrWarp');
}

/* ── Tod / Respawn / Level-Ende ── */
function jrDie(st){
  if(st.mode!=='play')return;
  st.mode='dying';st.timer=70;st.p.vy=-9;st.p.vx=0;st.p.slam=false;
  jrSfx('jrDie');
}
function jrAfterDeath(st){
  st.lives--;
  if(st.lives<=0){
    st.mode='gameover';jrSaveBest(st);
    return;
  }
  if(st.stack.length){st.level=st.stack[0].level;st.stack=[];}   // Tod in der Geheimkammer: zurück ins Hauptlevel
  if(st.checkpoint){jrRespawn(st);}
  else jrLoadLevel(st,st.level.idx);
  st.mode='play';
}
/* Nach dem Tod am Checkpoint weitermachen: Level-Stand (Münzen, Blöcke, besiegte Gegner) bleibt erhalten */
function jrRespawn(st){
  const cp=st.checkpoint;
  st.p=jrPlayerAt(st.level);st.p.x=cp.x;st.p.y=cp.y;st.p.inv=120;
  st.cam=Math.max(0,Math.min(st.level.w*JR_T-JR_W,cp.x-JR_W/2));
  st.timeLeft=Math.max(st.timeLeft,120);st.fx=[];st.shake=0;st.shock=null;
}
function jrClear(st){
  if(st.mode!=='play')return;
  const bonus=Math.max(0,st.timeLeft)*5+500;
  st.score+=bonus;st.mode='clear';st.timer=150;st.msg='Level geschafft!  +'+bonus;
  if(!st.custom){
    const idx=st.level.idx,next=idx+2;
    st.done|=(1<<idx);jrSave('zf_jump_done',st.done);
    if(next<=JR_LEVELS.length&&next>st.unlocked){st.unlocked=next;jrSave('zf_jump_unlocked',next);}
  }
  jrSfx('jrClear');
  jrSaveBest(st);
}
function jrNextLevel(st){
  if(st.custom){st.mode='customdone';if(typeof jrEdReturn==='function')jrEdReturn(true);return;}
  if(st.level.idx>=JR_LEVELS.length-1){st.mode='win';st.msg='Alle Level geschafft!';jrSaveBest(st);return;}
  jrLoadLevel(st,st.level.idx+1);st.mode='play';
}
function jrSaveBest(st){if(!st.custom&&st.score>st.best){st.best=st.score;jrSave('zf_jump_best',st.best);}}

/* ── Held-Skin (aus dem Shop) ── */
const JR_SKIN_DEFAULT={cap:'#ffb300',capTop:'#ffe082',body:'#3f6fe6',strap:'#ffd54f',skin:'#ffdcb8',boots:'#5d4037',trail:null,glow:null,visor:false,mask:false,cape:null};
function jrSkin(){
  try{
    if(typeof zcEquipped==='function'&&typeof zcItem==='function'){
      const id=zcEquipped('jskin'),it=id&&zcItem('jskin',id);
      if(it&&it.hero)return Object.assign({},JR_SKIN_DEFAULT,it.hero);
    }
  }catch(e){}
  return JR_SKIN_DEFAULT;
}

/* ══ Zeichnen ══ */
const JR_THEMES=[
  {sky:['#4fb3e8','#d8f3fb'],hill:'rgba(76,175,80,0.35)',hill2:'rgba(56,142,60,0.45)',cloud:'rgba(255,255,255,0.85)',ground:['#8d5a2b','#5cb85c','#3f9a3f']},
  {sky:['#ff8a65','#ffe0b2'],hill:'rgba(191,54,12,0.28)',hill2:'rgba(136,14,79,0.32)',cloud:'rgba(255,240,220,0.75)',ground:['#8d5a2b','#5cb85c','#3f9a3f']},
  {sky:['#0b1030','#33427e'],hill:'rgba(63,81,181,0.35)',hill2:'rgba(26,35,126,0.5)',cloud:'rgba(180,190,255,0.25)',stars:true,ground:['#6d4a25','#4c9a4c','#367a36']},
  {sky:['#141824','#2c3550'],hill:'rgba(120,144,156,0.25)',hill2:'rgba(84,110,122,0.35)',cloud:'rgba(140,170,220,0.12)',stars:true,ground:['#59606e','#7d8798','#626b7a']},
  {sky:['#9ec9f0','#f4fbff'],hill:'rgba(176,190,197,0.55)',hill2:'rgba(144,164,174,0.6)',cloud:'rgba(255,255,255,0.95)',snow:true,ground:['#7b8fa1','#ffffff','#dfe9f2']},
  {sky:['#3b0d0d','#ff7043'],hill:'rgba(62,39,35,0.6)',hill2:'rgba(33,15,15,0.7)',cloud:'rgba(255,171,145,0.22)',embers:true,ground:['#4a2c2a','#ff7043','#c2431f']}
];
function jrRR(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function jrBackground(ctx,st){
  const th=JR_THEMES[st.level.theme]||JR_THEMES[0],cam=st.cam,t=jrFrame;
  const g=ctx.createLinearGradient(0,0,0,JR_H);g.addColorStop(0,th.sky[0]);g.addColorStop(1,th.sky[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,JR_W,JR_H);
  if(th.stars){ctx.fillStyle='rgba(255,255,255,0.8)';for(let i=0;i<40;i++){const x=(i*97+40-cam*0.05)%JR_W,y=(i*53)%200;ctx.fillRect((x+JR_W)%JR_W,y,2,2);}}
  // Hügel (Parallax)
  [[0.25,th.hill,150,0.011],[0.45,th.hill2,110,0.017]].forEach(([par,col,h,f])=>{
    ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,JR_H);
    for(let x=0;x<=JR_W;x+=16){const wx=x+cam*par;ctx.lineTo(x,JR_H-70-h*0.5-Math.sin(wx*f)*h*0.35-Math.sin(wx*f*2.3)*h*0.12);}
    ctx.lineTo(JR_W,JR_H);ctx.fill();
  });
  // Wolken
  ctx.fillStyle=th.cloud;
  for(let i=0;i<7;i++){const x=((i*230+60-cam*0.5)%(JR_W+200)+JR_W+200)%(JR_W+200)-100,y=40+(i*47)%110,r=20+(i%4)*4+(i*11)%10;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.arc(x+r*0.9,y+4,r*0.75,0,Math.PI*2);ctx.arc(x-r*0.9,y+6,r*0.65,0,Math.PI*2);ctx.fill();}
  // Schneeflocken / Glut
  if(th.snow){ctx.fillStyle='rgba(255,255,255,0.9)';for(let i=0;i<40;i++){const x=(i*61+t*0.6*(1+i%3)*0.4-cam*0.3)%JR_W,y=(i*47+t*(0.8+(i%4)*0.3))%JR_H;ctx.fillRect((x+JR_W)%JR_W,y,2,2);}}
  if(th.embers){ctx.fillStyle='rgba(255,183,77,0.85)';for(let i=0;i<30;i++){const x=(i*73+Math.sin(t*0.02+i)*20-cam*0.2)%JR_W,y=JR_H-((i*41+t*(0.6+(i%3)*0.4))%JR_H);ctx.fillRect((x+JR_W)%JR_W,y,2,2);}}
}
function jrDrawTile(ctx,st,ch,tx,ty,x,y,t){
  const T=JR_T,th=JR_THEMES[st.level.theme]||JR_THEMES[0];
  const bump=st.bumps[tx+','+ty]?-Math.sin(st.bumps[tx+','+ty]/10*Math.PI)*6:0;
  if(ch==='#'){
    const gc=th.ground;
    ctx.fillStyle=gc[0];ctx.fillRect(x,y,T,T);
    ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(x+6,y+14,5,4);ctx.fillRect(x+20,y+22,6,4);
    if(jrTile(st,tx,ty-1)!=='#'){ctx.fillStyle=gc[1];ctx.fillRect(x,y,T,8);ctx.fillStyle=gc[2];ctx.fillRect(x,y+8,T,3);}
    ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.strokeRect(x+0.5,y+0.5,T-1,T-1);
  }else if(ch==='B'){
    y+=bump;ctx.fillStyle='#c8642a';ctx.fillRect(x,y,T,T);ctx.strokeStyle='#7a3410';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x,y+T/2);ctx.lineTo(x+T,y+T/2);ctx.moveTo(x+T/2,y);ctx.lineTo(x+T/2,y+T/2);ctx.moveTo(x+T/4,y+T/2);ctx.lineTo(x+T/4,y+T);ctx.moveTo(x+3*T/4,y+T/2);ctx.lineTo(x+3*T/4,y+T);ctx.stroke();
    ctx.strokeRect(x+0.5,y+0.5,T-1,T-1);
  }else if(ch==='?'){
    y+=bump;const g=ctx.createLinearGradient(0,y,0,y+T);g.addColorStop(0,'#ffd54f');g.addColorStop(1,'#f59f00');
    ctx.fillStyle=g;jrRR(ctx,x+1,y+1,T-2,T-2,5);ctx.fill();ctx.strokeStyle='#a86400';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('?',x+T/2,y+T/2+7);
    ctx.fillStyle='rgba(255,255,255,'+(0.25+0.2*Math.sin(t*0.08))+')';ctx.fillRect(x+4,y+4,T-8,4);
  }else if(ch==='!'){
    y+=bump;const g=ctx.createLinearGradient(0,y,0,y+T);g.addColorStop(0,'#b388ff');g.addColorStop(1,'#651fff');
    ctx.fillStyle=g;jrRR(ctx,x+1,y+1,T-2,T-2,5);ctx.fill();ctx.strokeStyle='#311b92';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('!',x+T/2,y+T/2+7);
    ctx.fillStyle='rgba(255,255,255,'+(0.25+0.25*Math.sin(t*0.1))+')';ctx.fillRect(x+4,y+4,T-8,4);
  }else if(ch==='U'){
    y+=bump;ctx.fillStyle='#8b6b3a';jrRR(ctx,x+1,y+1,T-2,T-2,5);ctx.fill();ctx.strokeStyle='#5c4522';ctx.lineWidth=2;ctx.stroke();
  }else if(ch==='T'||ch==='W'||ch==='X'){
    const top=jrTile(st,tx,ty-1)!==ch,left=jrTile(st,tx-1,ty)!==ch,gold=ch==='W',exit=ch==='X';
    const c0=gold?'#b8860b':exit?'#1565c0':'#2e7d32',c1=gold?'#ffe082':exit?'#64b5f6':'#81c784',rim=gold?'#7a5a00':exit?'#0d3c7a':'#1b5e20';
    const g=ctx.createLinearGradient(x,0,x+T,0);g.addColorStop(0,c0);g.addColorStop(0.45,c1);g.addColorStop(1,c0);
    ctx.fillStyle=g;ctx.fillRect(x,y,T,T);
    if(top){ctx.fillStyle=g;ctx.fillRect(x-(left?3:0),y,T+(left?0:3),14);ctx.strokeStyle=rim;ctx.lineWidth=2;ctx.strokeRect(x-(left?3:0),y,T+3,14);
      if((gold||exit)&&left){ // Hinweis: ↓ halten
        ctx.fillStyle=gold?'#fff59d':'#bbdefb';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
        ctx.fillText('▼',x+T,y-6+Math.sin(t*0.12)*3);
        if(gold){ctx.globalAlpha=0.5+0.5*Math.sin(t*0.15);ctx.fillText('✦',x+T+14,y-16);ctx.globalAlpha=1;}
      }}
  }else if(ch==='s'){
    ctx.fillStyle='#cfd8dc';for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x+i*16,y+T);ctx.lineTo(x+i*16+8,y+8);ctx.lineTo(x+i*16+16,y+T);ctx.fill();}
    ctx.strokeStyle='#607d8b';ctx.lineWidth=1.5;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x+i*16,y+T);ctx.lineTo(x+i*16+8,y+8);ctx.lineTo(x+i*16+16,y+T);ctx.stroke();}
  }else if(ch==='o'){
    const w=Math.abs(Math.cos(t*0.06+tx))*8+2;
    ctx.fillStyle='#ffca28';ctx.beginPath();ctx.ellipse(x+T/2,y+T/2+Math.sin(t*0.08+tx)*2,w,10,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f57f17';ctx.lineWidth=1.5;ctx.stroke();
  }else if(ch==='K'){
    if(jrTile(st,tx,ty-1)!=='K'){
      const on=st.checkpoint&&st.checkpoint.col===tx;
      ctx.fillStyle='#b0bec5';ctx.fillRect(x+14,y,4,T*2);
      ctx.fillStyle=on?'#43a047':'#1e88e5';ctx.beginPath();ctx.moveTo(x+18,y+3);ctx.lineTo(x+18+20+(on?Math.sin(t*0.15)*3:0),y+11);ctx.lineTo(x+18,y+19);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='left';ctx.fillText(on?'✓':'',x+21,y+15);
    }
  }else if(ch==='F'){
    ctx.fillStyle='#b0bec5';ctx.fillRect(x+14,y,4,T);
    if(jrTile(st,tx,ty-1)!=='F'){ctx.fillStyle='#ffca28';ctx.beginPath();ctx.arc(x+16,y+2,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e91e63';ctx.beginPath();ctx.moveTo(x+18,y+6);ctx.lineTo(x+18+26+Math.sin(t*0.1)*3,y+16);ctx.lineTo(x+18,y+28);ctx.fill();}
  }
}
function jrDrawPlayer(ctx,st,t,sk){
  const p=st.p,x=Math.round(p.x-st.cam),y=Math.round(p.y),f=p.face;
  sk=sk||jrSkin();
  ctx.save();
  if(p.inv>0&&Math.floor(p.inv/4)%2===0)ctx.globalAlpha=0.35;
  // Füße bleiben am Boden: beim Ducken zusammengedrückt, beim Slam gestreckt
  ctx.translate(x+p.w/2,y+p.h);
  if(sk.glow){ctx.shadowColor=sk.glow;ctx.shadowBlur=14;}
  if(st.mode==='dying')ctx.rotate(0.3);
  if(p.duck)ctx.scale(1,0.62);
  if(p.slam){ctx.scale(0.86,1.22);ctx.fillStyle='rgba(255,255,255,0.55)';for(let i=0;i<3;i++)ctx.fillRect(-8+i*8,-46-i*4,3,22);}
  ctx.translate(0,-17);
  ctx.scale(f,1);
  const run=p.onGround&&Math.abs(p.vx)>0.5,leg=run?Math.sin(p.anim*2)*5:0,air=!p.onGround;
  // Umhang (hinter dem Körper)
  if(sk.cape){ctx.fillStyle=sk.cape;ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(-20-Math.abs(p.vx)*1.5,8+Math.sin(t*0.3)*2);ctx.lineTo(-8,14);ctx.closePath();ctx.fill();}
  // Stiefel
  ctx.fillStyle=sk.boots;jrRR(ctx,-9+leg,10,10,6,3);ctx.fill();jrRR(ctx,0-leg,10,10,6,3);ctx.fill();
  // Körper (Latzhose)
  ctx.fillStyle=sk.body;jrRR(ctx,-11,-1,22,15,5);ctx.fill();
  ctx.fillStyle=sk.strap;ctx.beginPath();ctx.arc(-4,4,2,0,Math.PI*2);ctx.arc(4,4,2,0,Math.PI*2);ctx.fill();
  // Arm
  ctx.fillStyle=sk.skin;ctx.beginPath();ctx.arc(air?8:9,air?-2:5+Math.sin(p.anim*2)*2,3.5,0,Math.PI*2);ctx.fill();
  // Kopf
  ctx.fillStyle=sk.skin;ctx.beginPath();ctx.arc(0,-8,9,0,Math.PI*2);ctx.fill();
  // Mütze
  ctx.fillStyle=sk.cap;ctx.beginPath();ctx.arc(0,-11,9.5,Math.PI,0);ctx.fill();ctx.fillRect(-1,-13,13,4);
  ctx.fillStyle=sk.capTop;ctx.beginPath();ctx.arc(-2,-15,2,0,Math.PI*2);ctx.fill();
  if(sk.mask){ctx.fillStyle='rgba(20,20,30,0.9)';ctx.fillRect(-9,-10,18,6);}
  // Auge / Visier
  if(sk.visor){ctx.fillStyle='rgba(120,200,255,0.85)';jrRR(ctx,-1,-14,11,9,4);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(1,-12,4,2);}
  else{
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(4,-8,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(5,-8,1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  // Schild-Blase
  if(p.shield){
    ctx.save();ctx.strokeStyle='rgba(128,216,255,'+(0.6+0.25*Math.sin(t*0.15))+')';ctx.fillStyle='rgba(128,216,255,0.15)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.ellipse(x+p.w/2,y+p.h/2,20,p.h/2+7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  // Magnet-Aura
  if(p.magnet>0){ctx.save();ctx.strokeStyle='rgba(255,112,67,'+(0.25+0.2*Math.sin(t*0.2))+')';ctx.setLineDash([5,6]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+p.w/2,y+p.h/2,JR_T*3,0,Math.PI*2);ctx.stroke();ctx.restore();}
}
function jrDrawEnemy(ctx,e,st,t){
  const x=Math.round(e.x-st.cam),y=Math.round(e.y);
  if(!e.alive){
    if(e.squash<=0)return;
    ctx.fillStyle='#7b3fa0';jrRR(ctx,x,y+e.h-8,e.w,8,4);ctx.fill();return;
  }
  const wob=Math.sin(t*0.25+e.x)*1.5;
  ctx.fillStyle='#8e44ad';ctx.beginPath();ctx.arc(x+e.w/2,y+e.h-10,e.w/2,Math.PI,0);ctx.lineTo(x+e.w,y+e.h-4);ctx.lineTo(x,y+e.h-4);ctx.fill();
  ctx.fillStyle='#5b2c7a';jrRR(ctx,x+2+wob,y+e.h-6,9,6,3);ctx.fill();jrRR(ctx,x+e.w-11-wob,y+e.h-6,9,6,3);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+8,y+9,4,0,Math.PI*2);ctx.arc(x+18,y+9,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+8+e.dir*1.5,y+10,1.8,0,Math.PI*2);ctx.arc(x+18+e.dir*1.5,y+10,1.8,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+11,y+7);ctx.moveTo(x+22,y+4);ctx.lineTo(x+15,y+7);ctx.stroke();
}
function jrCard(ctx,title,lines,color){
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,JR_W,JR_H);
  const h=70+lines.length*26;ctx.fillStyle='rgba(20,24,36,0.94)';jrRR(ctx,JR_W/2-190,JR_H/2-h/2,380,h,20);ctx.fill();
  ctx.textAlign='center';ctx.fillStyle=color||'#fff';ctx.font='bold 28px sans-serif';ctx.fillText(title,JR_W/2,JR_H/2-h/2+44);
  ctx.fillStyle='rgba(255,255,255,0.82)';ctx.font='15px sans-serif';
  lines.forEach((l,i)=>ctx.fillText(l,JR_W/2,JR_H/2-h/2+76+i*26));
}
/* Anzeige der aktiven Power-ups oben links */
function jrDrawPowers(ctx,st){
  const p=st.p,items=[];
  if(p.shield)items.push(['🛡️','']);
  if(p.feather>0)items.push(['🪶',Math.ceil(p.feather/60)+'s']);
  if(p.magnet>0)items.push(['🧲',Math.ceil(p.magnet/60)+'s']);
  items.forEach((it,i)=>{
    ctx.fillStyle='rgba(20,24,36,0.65)';jrRR(ctx,8,8+i*30,it[1]?58:36,26,13);ctx.fill();
    ctx.fillStyle='#fff';ctx.textAlign='left';ctx.font='15px sans-serif';ctx.fillText(it[0],14,27+i*30);
    if(it[1]){ctx.font='bold 12px sans-serif';ctx.fillText(it[1],36,26+i*30);}
  });
}
function jrDraw(ctx,st){
  if(st.mode==='menu'){jrDrawMap(ctx,st);return;}
  const t=jrFrame;
  ctx.save();if(st.shake>0)ctx.translate((Math.random()-0.5)*st.shake,(Math.random()-0.5)*st.shake);
  jrBackground(ctx,st);
  const cam=st.cam,T=JR_T,c0=Math.max(0,Math.floor(cam/T)),c1=Math.min(st.level.w-1,Math.floor((cam+JR_W)/T)+1);
  for(let ty=0;ty<JR_ROWS;ty++)for(let tx=c0;tx<=c1;tx++){
    const ch=st.level.g[ty][tx];if(ch!=='.')jrDrawTile(ctx,st,ch,tx,ty,Math.round(tx*T-cam),ty*T,t);
  }
  st.level.enemies.forEach(e=>jrDrawEnemy(ctx,e,st,t));
  const sk=jrSkin();
  jrDrawPlayer(ctx,st,t,sk);
  // Partikel und Stoßwelle
  st.fx.forEach(f=>{
    ctx.globalAlpha=Math.min(1,f.t/14);ctx.fillStyle=f.color;
    if(f.dust){ctx.beginPath();ctx.arc(f.x-cam,f.y,f.s*(1+(22-f.t)*0.04),0,Math.PI*2);ctx.fill();}
    else ctx.fillRect(f.x-cam-f.s/2,f.y-f.s/2,f.s,f.s);
    ctx.globalAlpha=1;
  });
  if(st.shock){const k=1-st.shock.t/16;ctx.strokeStyle='rgba(255,255,255,'+(0.8*(1-k))+')';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(st.shock.x-cam,st.shock.y-2,10+k*70,3+k*9,0,0,Math.PI*2);ctx.stroke();}
  ctx.textAlign='center';ctx.font='bold 15px sans-serif';
  st.popups.forEach(o=>{ctx.globalAlpha=Math.min(1,o.t/15);ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=3;ctx.strokeText(o.txt,o.x-cam,o.y);ctx.fillText(o.txt,o.x-cam,o.y);ctx.globalAlpha=1;});
  ctx.restore();
  jrDrawPowers(ctx,st);
  if(st.level.bonus){ctx.fillStyle='rgba(20,24,36,0.65)';jrRR(ctx,JR_W-176,8,168,26,13);ctx.fill();ctx.fillStyle='#ffe082';ctx.textAlign='center';ctx.font='bold 13px sans-serif';ctx.fillText('✦ '+st.level.name+' ✦',JR_W-92,26);}
  if(st.fade>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,st.fade/24)+')';ctx.fillRect(0,0,JR_W,JR_H);}
  if(st.paused)jrCard(ctx,'PAUSE',['Klicken oder P zum Weiterspielen','↓ ducken · in der Luft ↓ = Slam','Auf goldenen Röhren ↓ halten: Geheimkammer'],'#ffca28');
  else if(st.mode==='clear')jrCard(ctx,st.msg.split('  ')[0],[st.msg.split('  ')[1]||'','Punkte: '+st.score],'#69f0ae');
  else if(st.mode==='win')jrCard(ctx,'GESCHAFFT! 🎉',['Alle Level abgeschlossen','Punkte: '+st.score+(st.score>=st.best?'  🏆 Rekord':''),'Klicken für die Weltkarte'],'#69f0ae');
  else if(st.mode==='gameover')jrCard(ctx,'GAME OVER',['Punkte: '+st.score+(st.score>=st.best&&st.score>0?'  🏆 Rekord':''),'Klicken für die Weltkarte'],'#ff5a52');
}

/* ── Weltkarte (Levelauswahl) ── */
const JR_MAP_NODES=[[70,250],[170,175],[270,255],[370,170],[470,250],[570,170]];
function jrMapNodeAt(x,y){
  for(let i=0;i<JR_LEVELS.length;i++){const n=JR_MAP_NODES[i];if(Math.hypot(x-n[0],y-n[1])<=28)return i;}
  return -1;
}
function jrDrawMap(ctx,st){
  const t=jrFrame;
  const g=ctx.createLinearGradient(0,0,0,JR_H);g.addColorStop(0,'#5fb6ea');g.addColorStop(0.6,'#cfeefa');g.addColorStop(1,'#8fd18f');
  ctx.fillStyle=g;ctx.fillRect(0,0,JR_W,JR_H);
  ctx.fillStyle='rgba(255,255,255,0.85)';[[90,60,26],[300,44,30],[520,70,24]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x+Math.sin(t*0.01+x)*6,y,r,0,Math.PI*2);ctx.arc(x+r*0.9,y+4,r*0.75,0,Math.PI*2);ctx.arc(x-r*0.9,y+6,r*0.65,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='rgba(76,175,80,0.55)';ctx.beginPath();ctx.moveTo(0,JR_H);for(let x=0;x<=JR_W;x+=16)ctx.lineTo(x,JR_H-60-Math.sin(x*0.013)*38-Math.sin(x*0.031)*10);ctx.lineTo(JR_W,JR_H);ctx.fill();
  // Weg
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle='rgba(121,85,72,0.9)';ctx.lineWidth=12;ctx.beginPath();JR_MAP_NODES.slice(0,JR_LEVELS.length).forEach((n,i)=>{if(i)ctx.lineTo(n[0],n[1]);else ctx.moveTo(n[0],n[1]);});ctx.stroke();
  ctx.strokeStyle='rgba(255,224,178,0.9)';ctx.lineWidth=5;ctx.setLineDash([2,12]);ctx.beginPath();JR_MAP_NODES.slice(0,JR_LEVELS.length).forEach((n,i)=>{if(i)ctx.lineTo(n[0],n[1]);else ctx.moveTo(n[0],n[1]);});ctx.stroke();ctx.setLineDash([]);
  // Titel
  ctx.textAlign='left';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=4;ctx.font='bold 26px sans-serif';
  ctx.strokeText('SUPER JUMPER',20,40);ctx.fillText('SUPER JUMPER',20,40);
  ctx.font='13px sans-serif';ctx.lineWidth=3;ctx.strokeText('Weltkarte · Rekord '+st.best,22,62);ctx.fillText('Weltkarte · Rekord '+st.best,22,62);
  // Knoten
  for(let i=0;i<JR_LEVELS.length;i++){
    const [x,y]=JR_MAP_NODES[i],locked=i+1>st.unlocked,done=!!(st.done&(1<<i)),sel=st.sel===i,th=JR_THEMES[JR_LEVELS[i].theme]||JR_THEMES[0];
    if(sel&&!locked){ctx.fillStyle='rgba(255,235,59,'+(0.25+0.15*Math.sin(t*0.12))+')';ctx.beginPath();ctx.arc(x,y,36,0,Math.PI*2);ctx.fill();}
    const ng=ctx.createLinearGradient(0,y-24,0,y+24);ng.addColorStop(0,locked?'#b0bec5':th.sky[0]);ng.addColorStop(1,locked?'#78909c':th.sky[1]);
    ctx.fillStyle=ng;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();
    ctx.lineWidth=4;ctx.strokeStyle=done?'#43a047':sel?'#ffeb3b':'#fff';ctx.stroke();
    ctx.textAlign='center';ctx.font='bold 18px sans-serif';ctx.fillStyle=locked?'#eceff1':'#1b1b1b';
    ctx.fillText(locked?'🔒':String(i+1),x,y+6);
    if(done){ctx.fillStyle='#43a047';ctx.beginPath();ctx.arc(x+18,y-18,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText('✓',x+18,y-14);}
  }
  // Beschriftung des gewählten Levels
  const L=JR_LEVELS[st.sel],locked=st.sel+1>st.unlocked;
  ctx.fillStyle='rgba(20,24,36,0.82)';jrRR(ctx,JR_W/2-170,JR_H-70,340,54,14);ctx.fill();
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 16px sans-serif';ctx.fillText('Level '+(st.sel+1)+' · '+L.name,JR_W/2,JR_H-46);
  ctx.font='12px sans-serif';ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.fillText(locked?'Noch gesperrt – schließe das vorherige Level ab':'Klicken oder Enter zum Starten · ←/→ wählen',JR_W/2,JR_H-26);
}

/* ── HUD (Chips über dem Spielfeld) ── */
function jrHud(force){
  const st=jrState;if(!st)return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=v;};
  set('jr-coins',st.coins);set('jr-score',st.score);set('jr-lives',st.lives);
  const mainLv=st.stack&&st.stack.length?st.stack[0].level:st.level;
  set('jr-level',st.custom?'Eigenes Level':(mainLv.idx+1)+' · '+mainLv.name);set('jr-time',Math.max(0,st.timeLeft));
  for(let i=1;i<=JR_LEVELS.length;i++){
    const b=document.getElementById('jr-lv-'+i);if(!b)continue;
    b.disabled=i>st.unlocked;b.style.opacity=i>st.unlocked?'0.45':'';
    b.classList.toggle('active',st.mode!=='menu'&&!st.custom&&(st.level.idx+1)===i);
    b.textContent=i>st.unlocked?'🔒 '+i:'Level '+i;
  }
  const pb=document.getElementById('jr-pause');if(pb)pb.textContent=st.paused?'▶ Weiter':'⏸ Pause';
}

/* ── Pause ── */
function jrTogglePause(force){
  const st=jrState;if(!st||st.mode==='menu'||st.mode==='gameover'||st.mode==='win'||st.mode==='clear'||st.mode==='customdone')return;
  st.paused=force==null?!st.paused:!!force;
  jrIn.left=jrIn.right=jrIn.jumpHeld=jrIn.down=false;
  jrSfx('jrPause');jrHud(true);
}

/* ── Eingabe ── */
function jrKeyState(e,down){
  const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')jrIn.left=down;
  else if(k==='ArrowRight'||k==='d'||k==='D')jrIn.right=down;
  else if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){if(down&&!jrIn.jumpHeld)jrIn.jump=true;jrIn.jumpHeld=down;}
  else if(k==='ArrowDown'||k==='s'||k==='S'){if(down&&!jrIn.down)jrIn.downPress=true;jrIn.down=down;}
  else return false;
  return true;
}
function jrActive(){const s=document.getElementById('screen-jumprun');return !!s&&s.classList.contains('active');}
document.addEventListener('keydown',e=>{
  if(!jrActive())return;
  const st=jrState;
  if(typeof jrEd!=='undefined'&&jrEd&&jrEd.open&&typeof jrEdKey==='function'){if(jrEdKey(e))return;}
  if(e.key==='p'||e.key==='P'||e.key==='Escape'){if(st&&st.mode!=='menu'){e.preventDefault();jrTogglePause();}return;}
  if(st&&st.mode==='menu'){
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D'){st.sel=Math.min(JR_LEVELS.length-1,st.sel+1);e.preventDefault();return;}
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A'){st.sel=Math.max(0,st.sel-1);e.preventDefault();return;}
    if(e.key===' '||e.key==='Enter'){e.preventDefault();jrClick();return;}
    return;
  }
  if(jrKeyState(e,true)){e.preventDefault();
    if(st&&(st.mode==='gameover'||st.mode==='win')&&(e.key===' '||e.key==='Enter'))jrClick();
    else if(st&&st.paused&&(e.key===' '||e.key==='Enter'))jrTogglePause(false);}
  else if(e.key==='Enter'&&st&&st.mode!=='play')jrClick();
});
document.addEventListener('keyup',e=>{jrKeyState(e,false);});
window.addEventListener('blur',()=>{jrIn.left=jrIn.right=jrIn.jumpHeld=jrIn.down=false;if(jrState&&jrState.mode==='play'&&!jrState.paused&&jrActive())jrTogglePause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&jrState&&jrState.mode==='play'&&!jrState.paused&&jrActive())jrTogglePause(true);});
/* Touch-Tasten */
function jrTouch(k,down){
  if(k==='jump'){if(down&&!jrIn.jumpHeld)jrIn.jump=true;jrIn.jumpHeld=down;}
  else if(k==='down'){if(down&&!jrIn.down)jrIn.downPress=true;jrIn.down=down;}
  else jrIn[k]=down;
}
function jrToMenu(){
  const sel=jrState?Math.max(0,jrState.level.idx):0;
  jrState=jrNewState(sel);jrState.mode='menu';jrHud(true);
}
function jrClick(ev){
  const st=jrState;if(!st)return;
  if(st.paused){jrTogglePause(false);return;}
  if(st.mode==='menu'){
    if(ev&&ev.clientX!=null){
      const cv=document.getElementById('jr-canvas'),r=cv.getBoundingClientRect();
      const i=jrMapNodeAt((ev.clientX-r.left)*JR_W/r.width,(ev.clientY-r.top)*JR_H/r.height);
      if(i>=0)st.sel=i;else return;
    }
    if(st.sel+1<=st.unlocked)jrStart(st.sel);
    else jrSfx('error');
  }
  else if(st.mode==='gameover'||st.mode==='win'){if(st.custom&&typeof jrEdReturn==='function')jrEdReturn(false);else jrToMenu();}
}
function jrPickLevel(i){
  if(!jrState||i>jrState.unlocked)return;
  jrStart(i-1);
}

/* ── Schleife ── */
function jrLoop(ts){
  if(!jrActive()){jrRaf=null;return;}
  const cv=document.getElementById('jr-canvas');
  if(!jrLast)jrLast=ts;
  jrAcc+=Math.min(100,ts-jrLast);jrLast=ts;
  if(typeof jrEd!=='undefined'&&jrEd&&jrEd.open){
    jrAcc=0;if(cv&&typeof jrEdDraw==='function')jrEdDraw(cv.getContext('2d'));
  }else{
    while(jrAcc>=1000/60){jrStep(jrState,jrIn);jrAcc-=1000/60;jrFrame++;}
    if(cv)jrDraw(cv.getContext('2d'),jrState);
    if(jrFrame%6===0)jrHud();
  }
  jrRaf=requestAnimationFrame(jrLoop);
}
function jrInit(){
  jrRegisterSounds();
  if(jrRaf){cancelAnimationFrame(jrRaf);jrRaf=null;}
  jrState=jrNewState(jrLoad('zf_jump_unlocked',1)-1);jrState.mode='menu';jrLast=0;jrAcc=0;
  const cv=document.getElementById('jr-canvas');
  if(cv){cv.onclick=jrClick;}
  if(typeof jrEd!=='undefined'&&jrEd&&jrEd.open&&typeof jrEdClose==='function')jrEdClose();
  jrHud(true);
  const best=document.getElementById('jr-best');if(best)best.textContent=jrState.best;
  jrRaf=requestAnimationFrame(jrLoop);
}
