/* ══════════════════════════════════
   SUPER JUMPER – Jump-and-Run (eigene Figuren und Grafik, komplett gezeichnet)
   Laufen, Springen, Münzen sammeln, Gegnern auf den Kopf springen, Stacheln und Löcher meiden,
   am Ende des Levels die Zielfahne erreichen. 3 Level, 3 Leben.
   Steuerung: ←/→ oder A/D laufen · Leertaste/↑/W springen (länger halten = höher) · Shift/X rennen
══════════════════════════════════ */
const JR_T=32,JR_W=640,JR_H=384,JR_ROWS=12;
const JR_GRAV=0.5,JR_JUMP=11.2,JR_MAXFALL=12;

/* ── Level-Bau: Boden-Abschnitte, Plattformen, Blöcke, Münzen, Gegner, Röhren, Stacheln ── */
function jrBuild(spec){
  const w=spec.w,g=Array.from({length:JR_ROWS},()=>Array(w).fill('.'));
  (spec.ground||[]).forEach(([a,b])=>{for(let x=a;x<=b;x++){g[10][x]='#';g[11][x]='#';}});
  (spec.platforms||[]).forEach(([x,y,len,ch])=>{for(let i=0;i<len;i++)g[y][x+i]=ch||'B';});
  (spec.blocks||[]).forEach(([x,y])=>{g[y][x]='?';});
  (spec.pipes||[]).forEach(([x,h])=>{for(let r=0;r<h;r++){g[9-r][x]='T';g[9-r][x+1]='T';}});
  (spec.spikes||[]).forEach(([a,b])=>{for(let x=a;x<=b;x++)g[9][x]='s';});
  (spec.stairs||[]).forEach(([x,h])=>{for(let i=0;i<h;i++)for(let r=0;r<=i;r++)g[9-r][x+i]='B';});
  (spec.coins||[]).forEach(([x,y])=>{if(g[y][x]==='.')g[y][x]='o';});
  (spec.coinRows||[]).forEach(([x,y,n])=>{for(let i=0;i<n;i++)if(g[y][x+i]==='.')g[y][x+i]='o';});
  for(let r=2;r<=9;r++)g[r][spec.flag]='F';
  const enemies=(spec.enemies||[]).map(([x,y])=>({x:x*JR_T+3,y:(y+1)*JR_T-24,w:26,h:24,vx:-0.8,dir:-1,alive:true,squash:0}));
  return {w,g,enemies,start:spec.start||[2,8],theme:spec.theme||0,time:spec.time||300,name:spec.name};
}
const JR_SPECS=[
  {name:'Grüne Wiesen',theme:0,w:112,flag:106,time:300,
   ground:[[0,24],[27,52],[56,80],[83,111]],
   platforms:[[11,7,5,'B'],[36,7,4,'B'],[60,6,3,'B'],[70,7,6,'B'],[93,7,4,'B']],
   blocks:[[13,7],[38,7],[61,6],[72,7],[95,7]],
   pipes:[[20,2],[45,3],[66,2],[88,2]],
   coinRows:[[12,6,4],[37,6,3],[70,6,5],[92,6,5]],
   coins:[[25,7],[26,6],[54,7],[55,6],[81,7],[82,6]],
   enemies:[[16,9],[32,9],[42,9],[62,9],[74,9],[90,9],[98,9]],
   stairs:[[100,4]]},
  {name:'Abendrot-Schlucht',theme:1,w:136,flag:130,time:300,
   ground:[[0,17],[21,38],[42,58],[62,80],[84,100],[104,122],[125,135]],
   platforms:[[8,7,4,'B'],[18,6,2,'B'],[26,7,5,'B'],[40,6,2,'B'],[48,7,4,'B'],[59,6,2,'B'],[68,6,4,'B'],[81,6,2,'B'],[90,7,5,'B'],[101,6,2,'B'],[110,7,4,'B'],[123,6,2,'B']],
   blocks:[[9,7],[28,7],[49,7],[70,6],[92,7],[112,7]],
   pipes:[[14,2],[34,3],[54,2],[76,3],[96,2],[116,3]],
   coinRows:[[8,6,4],[26,6,5],[48,6,4],[68,5,4],[90,6,5],[110,6,4]],
   coins:[[19,5],[40,5],[59,5],[81,5],[101,5],[123,5]],
   enemies:[[10,9],[24,9],[30,9],[46,9],[52,9],[66,9],[72,9],[88,9],[94,9],[108,9],[114,9]],
   stairs:[[126,4]]},
  {name:'Mitternachts-Burg',theme:2,w:158,flag:152,time:260,
   ground:[[0,14],[18,32],[36,50],[54,68],[72,86],[90,104],[108,122],[126,140],[144,157]],
   platforms:[[9,7,4,'B'],[27,7,4,'B'],[45,7,4,'B'],[63,7,4,'B'],[81,7,4,'B'],[99,7,4,'B'],[117,7,4,'B'],[135,7,4,'B'],
              [15,6,2,'B'],[33,6,2,'B'],[51,6,2,'B'],[69,6,2,'B'],[87,6,2,'B'],[105,6,2,'B'],[123,6,2,'B'],[141,6,2,'B']],
   blocks:[[10,7],[28,7],[46,7],[64,7],[82,7],[100,7],[118,7],[136,7]],
   pipes:[[6,2],[24,3],[60,3],[96,3],[132,3]],
   spikes:[[42,43],[78,79],[114,115]],
   coinRows:[[9,6,4],[27,6,4],[45,6,4],[63,6,4],[81,6,4],[99,6,4],[117,6,4],[135,6,4]],
   coins:[[15,5],[16,5],[33,5],[34,5],[51,5],[52,5],[69,5],[70,5],[87,5],[88,5],[105,5],[106,5],[123,5],[124,5],[141,5],[142,5]],
   enemies:[[12,9],[21,9],[30,9],[39,9],[48,9],[57,9],[66,9],[75,9],[84,9],[93,9],[102,9],[111,9],[120,9],[129,9],[138,9],[148,9]],
   stairs:[[146,4]]}
];
const JR_LEVELS=JR_SPECS.map(jrBuild);

/* ── Zustand ── */
let jrState=null,jrRaf=null,jrLast=0,jrAcc=0,jrFrame=0;
const jrIn={left:false,right:false,jump:false,jumpHeld:false,run:false};
function jrLoad(k,d){try{const v=localStorage.getItem(k);return v===null?d:parseInt(v,10)||d;}catch(e){return d;}}
function jrSave(k,v){try{localStorage.setItem(k,String(v));}catch(e){}}

function jrCloneLevel(idx){
  const L=JR_LEVELS[idx];
  return {idx,w:L.w,g:L.g.map(r=>r.slice()),theme:L.theme,name:L.name,
    enemies:L.enemies.map(e=>({...e})),start:L.start.slice(),time:L.time};
}
function jrPlayerAt(level){
  return {x:level.start[0]*JR_T+5,y:level.start[1]*JR_T,w:22,h:30,vx:0,vy:0,onGround:false,face:1,coyote:0,jbuf:0,anim:0};
}
/* Neues Spiel (idx = Startlevel) */
function jrNewState(idx){
  const lvl=jrCloneLevel(idx||0);
  return {mode:'menu',level:lvl,p:jrPlayerAt(lvl),cam:0,coins:0,score:0,lives:3,timeLeft:lvl.time,frames:0,
    popups:[],timer:0,bumps:{},best:jrLoad('zf_jump_best',0),unlocked:Math.max(1,Math.min(3,jrLoad('zf_jump_unlocked',1))),msg:''};
}
/* Level (neu) laden, Fortschritt (Münzen, Punkte, Leben) bleibt */
function jrLoadLevel(st,idx){
  st.level=jrCloneLevel(idx);st.p=jrPlayerAt(st.level);st.cam=0;st.timeLeft=st.level.time;st.frames=0;st.popups=[];st.bumps={};
}
function jrStart(idx){
  const keep=jrState;
  jrState=jrNewState(idx);
  if(keep)jrState.unlocked=keep.unlocked;
  jrState.mode='play';jrHud(true);
  if(typeof sfx==='function')sfx('click');
}

/* ── Kollision ── */
const JR_SOLID={'#':1,'B':1,'?':1,'U':1,'T':1};
function jrTile(st,tx,ty){
  if(tx<0||tx>=st.level.w)return '#';   // seitliche Ränder sind Wände
  if(ty<0)return '.';
  if(ty>=JR_ROWS)return '.';            // unten: Abgrund
  return st.level.g[ty][tx];
}
function jrSolid(st,tx,ty){return !!JR_SOLID[jrTile(st,tx,ty)];}
/* bewegt ein Rechteck (x,y,w,h) mit Geschwindigkeit; gibt {hitX,hitY,ground,headTiles} zurück */
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

/* ── Ein Bild (1/60 s) Spiellogik ── */
function jrStep(st,inp){
  inp=inp||jrIn;
  st.frames++;
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
  // Eingabe -> Bewegung
  const dir=(inp.right?1:0)-(inp.left?1:0),maxV=inp.run?4.6:3.2,acc=p.onGround?0.6:0.4;
  if(dir){p.vx+=dir*acc;p.face=dir;if(Math.abs(p.vx)>maxV)p.vx=Math.sign(p.vx)*Math.max(maxV,Math.abs(p.vx)-0.5);}
  else p.vx*=p.onGround?0.78:0.96;
  if(Math.abs(p.vx)<0.08)p.vx=0;
  if(inp.jump){p.jbuf=8;inp.jump=false;}else if(p.jbuf>0)p.jbuf--;
  if(p.onGround)p.coyote=6;else if(p.coyote>0)p.coyote--;
  if(p.jbuf>0&&p.coyote>0){p.vy=-JR_JUMP;p.jbuf=0;p.coyote=0;p.onGround=false;}
  if(!inp.jumpHeld&&p.vy<-4)p.vy=-4;     // kurzer Tipp = kleiner Sprung
  p.vy=Math.min(JR_MAXFALL,p.vy+JR_GRAV);
  const r=jrMove(st,p);
  p.onGround=r.ground;
  p.anim+=Math.abs(p.vx)*0.15;
  // Kopf an Blöcken
  r.head.forEach(([tx,ty])=>{
    if(jrTile(st,tx,ty)==='?'){
      st.level.g[ty][tx]='U';st.coins++;st.score+=50;st.bumps[tx+','+ty]=10;
      st.popups.push({x:tx*T+T/2,y:ty*T,t:30,txt:'+50'});
      if(typeof sfx==='function')sfx('coin');
      jrCheckLife(st);
    }else st.bumps[tx+','+ty]=8;
  });
  // Münzen, Stacheln, Fahne
  const cx0=Math.floor(p.x/T),cx1=Math.floor((p.x+p.w)/T),cy0=Math.floor(p.y/T),cy1=Math.floor((p.y+p.h-0.01)/T);
  for(let ty=cy0;ty<=cy1;ty++)for(let tx=cx0;tx<=cx1;tx++){
    const t=jrTile(st,tx,ty);
    if(t==='o'){st.level.g[ty][tx]='.';st.coins++;st.score+=10;jrCheckLife(st);if(typeof sfx==='function')sfx('coin');}
    else if(t==='s'){if(p.y+p.h>ty*T+14){jrDie(st);return;}}
    else if(t==='F'){jrClear(st);return;}
  }
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
        p.vy=inp.jumpHeld?-9.5:-7;p.onGround=false;
        st.popups.push({x:e.x+e.w/2,y:e.y,t:30,txt:'+100'});
        if(typeof sfx==='function')sfx('click');
      }else{jrDie(st);return;}
    }
  }
  // Popups / Wackeln
  st.popups.forEach(o=>{o.t--;o.y-=0.8;});st.popups=st.popups.filter(o=>o.t>0);
  Object.keys(st.bumps).forEach(k=>{if(--st.bumps[k]<=0)delete st.bumps[k];});
  // Kamera
  const target=Math.max(0,Math.min(st.level.w*T-JR_W,p.x+p.w/2-JR_W/2+p.face*30));
  st.cam+=(target-st.cam)*0.12;
}
function jrCheckLife(st){if(st.coins>0&&st.coins%25===0){st.lives++;st.popups.push({x:st.p.x,y:st.p.y-10,t:60,txt:'❤️ +1'});if(typeof sfx==='function')sfx('rankup');}}
function jrDie(st){
  if(st.mode!=='play')return;
  st.mode='dying';st.timer=70;st.p.vy=-9;st.p.vx=0;
  if(typeof sfx==='function')sfx('error');
}
function jrAfterDeath(st){
  st.lives--;
  if(st.lives<=0){
    st.mode='gameover';jrSaveBest(st);
    return;
  }
  jrLoadLevel(st,st.level.idx);st.mode='play';
}
function jrClear(st){
  if(st.mode!=='play')return;
  const bonus=Math.max(0,st.timeLeft)*5+500;
  st.score+=bonus;st.mode='clear';st.timer=150;st.msg='Level geschafft!  +'+bonus;
  const next=st.level.idx+2;
  if(next<=3&&next>st.unlocked){st.unlocked=next;jrSave('zf_jump_unlocked',next);}
  if(typeof sfx==='function')sfx('win');
  jrSaveBest(st);
}
function jrNextLevel(st){
  if(st.level.idx>=JR_LEVELS.length-1){st.mode='win';st.msg='Alle Level geschafft!';jrSaveBest(st);return;}
  jrLoadLevel(st,st.level.idx+1);st.mode='play';
}
function jrSaveBest(st){if(st.score>st.best){st.best=st.score;jrSave('zf_jump_best',st.best);}}

/* ══ Zeichnen ══ */
const JR_THEMES=[
  {sky:['#4fb3e8','#d8f3fb'],hill:'rgba(76,175,80,0.35)',hill2:'rgba(56,142,60,0.45)',cloud:'rgba(255,255,255,0.85)',stars:false},
  {sky:['#ff8a65','#ffe0b2'],hill:'rgba(191,54,12,0.28)',hill2:'rgba(136,14,79,0.32)',cloud:'rgba(255,240,220,0.75)',stars:false},
  {sky:['#0b1030','#33427e'],hill:'rgba(63,81,181,0.35)',hill2:'rgba(26,35,126,0.5)',cloud:'rgba(180,190,255,0.25)',stars:true}
];
function jrRR(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function jrBackground(ctx,st){
  const th=JR_THEMES[st.level.theme],cam=st.cam;
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
  for(let i=0;i<7;i++){const x=((i*230+60-cam*0.5)%(JR_W+200)+JR_W+200)%(JR_W+200)-100,y=40+(i*47)%110,r=20+(i*11)%14;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.arc(x+r*0.9,y+4,r*0.75,0,Math.PI*2);ctx.arc(x-r*0.9,y+6,r*0.65,0,Math.PI*2);ctx.fill();}
}
function jrDrawTile(ctx,st,ch,tx,ty,x,y,t){
  const T=JR_T;
  const bump=st.bumps[tx+','+ty]?-Math.sin(st.bumps[tx+','+ty]/10*Math.PI)*6:0;
  if(ch==='#'){
    ctx.fillStyle='#8d5a2b';ctx.fillRect(x,y,T,T);
    ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(x+6,y+14,5,4);ctx.fillRect(x+20,y+22,6,4);
    if(jrTile(st,tx,ty-1)!=='#'){ctx.fillStyle='#5cb85c';ctx.fillRect(x,y,T,8);ctx.fillStyle='#3f9a3f';ctx.fillRect(x,y+8,T,3);}
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
  }else if(ch==='U'){
    y+=bump;ctx.fillStyle='#8b6b3a';jrRR(ctx,x+1,y+1,T-2,T-2,5);ctx.fill();ctx.strokeStyle='#5c4522';ctx.lineWidth=2;ctx.stroke();
  }else if(ch==='T'){
    const top=jrTile(st,tx,ty-1)!=='T',left=jrTile(st,tx-1,ty)!=='T';
    const g=ctx.createLinearGradient(x,0,x+T,0);g.addColorStop(0,'#2e7d32');g.addColorStop(0.45,'#81c784');g.addColorStop(1,'#2e7d32');
    ctx.fillStyle=g;ctx.fillRect(x,y,T,T);
    if(top){ctx.fillStyle=g;ctx.fillRect(x-(left?3:0),y,T+(left?0:3),14);ctx.strokeStyle='#1b5e20';ctx.lineWidth=2;ctx.strokeRect(x-(left?3:0),y,T+3,14);}
  }else if(ch==='s'){
    ctx.fillStyle='#cfd8dc';for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x+i*16,y+T);ctx.lineTo(x+i*16+8,y+8);ctx.lineTo(x+i*16+16,y+T);ctx.fill();}
    ctx.strokeStyle='#607d8b';ctx.lineWidth=1.5;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(x+i*16,y+T);ctx.lineTo(x+i*16+8,y+8);ctx.lineTo(x+i*16+16,y+T);ctx.stroke();}
  }else if(ch==='o'){
    const w=Math.abs(Math.cos(t*0.06+tx))*8+2;
    ctx.fillStyle='#ffca28';ctx.beginPath();ctx.ellipse(x+T/2,y+T/2+Math.sin(t*0.08+tx)*2,w,10,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f57f17';ctx.lineWidth=1.5;ctx.stroke();
  }else if(ch==='F'){
    ctx.fillStyle='#b0bec5';ctx.fillRect(x+14,y,4,T);
    if(jrTile(st,tx,ty-1)!=='F'){ctx.fillStyle='#ffca28';ctx.beginPath();ctx.arc(x+16,y+2,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e91e63';ctx.beginPath();ctx.moveTo(x+18,y+6);ctx.lineTo(x+18+26+Math.sin(t*0.1)*3,y+16);ctx.lineTo(x+18,y+28);ctx.fill();}
  }
}
function jrDrawPlayer(ctx,st,t){
  const p=st.p,x=Math.round(p.x-st.cam),y=Math.round(p.y),f=p.face;
  ctx.save();ctx.translate(x+p.w/2,y+p.h/2);
  if(st.mode==='dying')ctx.rotate(0.3);
  ctx.scale(f,1);
  const run=p.onGround&&Math.abs(p.vx)>0.5,leg=run?Math.sin(p.anim*2)*5:0,air=!p.onGround;
  // Stiefel
  ctx.fillStyle='#5d4037';jrRR(ctx,-9+leg,10,10,6,3);ctx.fill();jrRR(ctx,0-leg,10,10,6,3);ctx.fill();
  // Körper (Latzhose)
  ctx.fillStyle='#3f6fe6';jrRR(ctx,-11,-1,22,15,5);ctx.fill();
  ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.arc(-4,4,2,0,Math.PI*2);ctx.arc(4,4,2,0,Math.PI*2);ctx.fill();
  // Arm
  ctx.fillStyle='#ffdcb8';ctx.beginPath();ctx.arc(air?8:9,air?-2:5+Math.sin(p.anim*2)*2,3.5,0,Math.PI*2);ctx.fill();
  // Kopf
  ctx.fillStyle='#ffdcb8';ctx.beginPath();ctx.arc(0,-8,9,0,Math.PI*2);ctx.fill();
  // Mütze
  ctx.fillStyle='#ffb300';ctx.beginPath();ctx.arc(0,-11,9.5,Math.PI,0);ctx.fill();ctx.fillRect(-1,-13,13,4);
  ctx.fillStyle='#ffe082';ctx.beginPath();ctx.arc(-2,-15,2,0,Math.PI*2);ctx.fill();
  // Auge
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(4,-8,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(5,-8,1.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
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
function jrDraw(ctx,st){
  const t=jrFrame;jrBackground(ctx,st);
  const cam=st.cam,T=JR_T,c0=Math.max(0,Math.floor(cam/T)),c1=Math.min(st.level.w-1,Math.floor((cam+JR_W)/T)+1);
  for(let ty=0;ty<JR_ROWS;ty++)for(let tx=c0;tx<=c1;tx++){
    const ch=st.level.g[ty][tx];if(ch!=='.')jrDrawTile(ctx,st,ch,tx,ty,Math.round(tx*T-cam),ty*T,t);
  }
  st.level.enemies.forEach(e=>jrDrawEnemy(ctx,e,st,t));
  jrDrawPlayer(ctx,st,t);
  ctx.textAlign='center';ctx.font='bold 15px sans-serif';
  st.popups.forEach(o=>{ctx.globalAlpha=Math.min(1,o.t/15);ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=3;ctx.strokeText(o.txt,o.x-cam,o.y);ctx.fillText(o.txt,o.x-cam,o.y);ctx.globalAlpha=1;});
  if(st.mode==='menu')jrCard(ctx,'SUPER JUMPER',['Klicken oder Leertaste zum Starten','←/→ laufen · Leertaste springen · Shift rennen','Rekord: '+st.best],'#ffca28');
  else if(st.mode==='clear')jrCard(ctx,st.msg.split('  ')[0],[st.msg.split('  ')[1]||'','Punkte: '+st.score],'#69f0ae');
  else if(st.mode==='win')jrCard(ctx,'GESCHAFFT! 🎉',['Alle Level abgeschlossen','Punkte: '+st.score+(st.score>=st.best?'  🏆 Rekord':''),'Klicken für ein neues Spiel'],'#69f0ae');
  else if(st.mode==='gameover')jrCard(ctx,'GAME OVER',['Punkte: '+st.score+(st.score>=st.best&&st.score>0?'  🏆 Rekord':''),'Klicken für Neustart'],'#ff5a52');
}

/* ── HUD (Chips über dem Spielfeld) ── */
function jrHud(force){
  const st=jrState;if(!st)return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=v;};
  set('jr-coins',st.coins);set('jr-score',st.score);set('jr-lives',st.lives);set('jr-level',(st.level.idx+1)+' · '+st.level.name);set('jr-time',Math.max(0,st.timeLeft));
  for(let i=1;i<=3;i++){
    const b=document.getElementById('jr-lv-'+i);if(!b)continue;
    b.disabled=i>st.unlocked;b.style.opacity=i>st.unlocked?'0.45':'';
    b.classList.toggle('active',st.mode!=='menu'&&(st.level.idx+1)===i);
    b.textContent=i>st.unlocked?'🔒 Level '+i:'Level '+i;
  }
}

/* ── Eingabe ── */
function jrKeyState(e,down){
  const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')jrIn.left=down;
  else if(k==='ArrowRight'||k==='d'||k==='D')jrIn.right=down;
  else if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){if(down&&!jrIn.jumpHeld)jrIn.jump=true;jrIn.jumpHeld=down;}
  else if(k==='Shift'||k==='x'||k==='X')jrIn.run=down;
  else return false;
  return true;
}
function jrActive(){const s=document.getElementById('screen-jumprun');return !!s&&s.classList.contains('active');}
document.addEventListener('keydown',e=>{
  if(!jrActive())return;
  if(jrKeyState(e,true)){e.preventDefault();
    if(jrState&&(jrState.mode==='menu'||jrState.mode==='gameover'||jrState.mode==='win')&&(e.key===' '||e.key==='Enter'))jrClick();}
  else if(e.key==='Enter'&&jrState&&jrState.mode!=='play')jrClick();
});
document.addEventListener('keyup',e=>{jrKeyState(e,false);});
window.addEventListener('blur',()=>{jrIn.left=jrIn.right=jrIn.jumpHeld=jrIn.run=false;});
/* Touch-Tasten */
function jrTouch(k,down){
  if(k==='jump'){if(down&&!jrIn.jumpHeld)jrIn.jump=true;jrIn.jumpHeld=down;}
  else jrIn[k]=down;
}
function jrClick(){
  if(!jrState)return;
  if(jrState.mode==='menu')jrStart(Math.min(jrState.level.idx,jrState.unlocked-1));
  else if(jrState.mode==='gameover'||jrState.mode==='win'){const u=jrState.unlocked;jrState=jrNewState(0);jrState.unlocked=u;jrStart(0);}
}
function jrPickLevel(i){
  if(!jrState||i>jrState.unlocked)return;
  const u=jrState.unlocked;jrState=jrNewState(i-1);jrState.unlocked=u;jrStart(i-1);
}

/* ── Schleife ── */
function jrLoop(ts){
  if(!jrActive()){jrRaf=null;return;}
  const cv=document.getElementById('jr-canvas');
  if(!jrLast)jrLast=ts;
  jrAcc+=Math.min(100,ts-jrLast);jrLast=ts;
  while(jrAcc>=1000/60){jrStep(jrState,jrIn);jrAcc-=1000/60;jrFrame++;}
  if(cv)jrDraw(cv.getContext('2d'),jrState);
  if(jrFrame%6===0)jrHud();
  jrRaf=requestAnimationFrame(jrLoop);
}
function jrInit(){
  if(jrRaf){cancelAnimationFrame(jrRaf);jrRaf=null;}
  jrState=jrNewState(0);jrLast=0;jrAcc=0;
  const cv=document.getElementById('jr-canvas');
  if(cv){cv.onclick=jrClick;}
  jrHud(true);
  const best=document.getElementById('jr-best');if(best)best.textContent=jrState.best;
  jrRaf=requestAnimationFrame(jrLoop);
}
