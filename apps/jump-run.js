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
const JR_SPRING=15.5;
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
    jrSpring:c=>sfxTone(c,240,0.22,'square',0.1,0,900),
    jrCrumble:c=>{sfxNoise(c,0.12,0.16,0,500);sfxTone(c,120,0.1,'sawtooth',0.07,0,70);},
    jrShoot:c=>{sfxTone(c,700,0.12,'sawtooth',0.08,0,200);},
    jrBossHit:c=>{sfxNoise(c,0.2,0.3,0,400);sfxTone(c,180,0.25,'sawtooth',0.14,0,60);},
    jrClear:c=>[523,659,784,1046,784,1046,1319].forEach((f,i)=>sfxTone(c,f,0.14,'square',0.09,i*0.09))
  });
  if(typeof SFX_GAME_SCREENS!=='undefined'&&!SFX_GAME_SCREENS.includes('screen-jumprun'))SFX_GAME_SCREENS.push('screen-jumprun');
  if(typeof sfxUpdateBtn==='function')try{sfxUpdateBtn();}catch(e){}
}
function jrSfx(n){if(typeof sfx==='function')sfx(n);}

/* ── Level-Bau: Boden-Abschnitte, Plattformen, Blöcke, Power-ups, Münzen, Gegner, Röhren, Stacheln ── */
/* Gegnertypen: walk (läuft), fly (schwebt), spiky (Stachelpanzer: nur per Slam besiegbar), shoot (schießt Kugeln) */
function jrMakeEnemy(x,y,type){
  const T=JR_T;type=type||'walk';
  if(type==='fly')return {type,x:x*T+3,y:y*T,by:y*T,ox:x*T+3,w:26,h:22,vx:-0.9,dir:-1,alive:true,squash:0,ph:x};
  if(type==='shoot')return {type,x:x*T+3,y:(y+1)*T-26,w:26,h:26,vx:0,dir:-1,alive:true,squash:0,cd:90+(x%60)};
  if(type==='spiky')return {type,sp:0.5,x:x*T+3,y:(y+1)*T-24,w:26,h:24,vx:-0.5,dir:-1,alive:true,squash:0};
  return {type:'walk',x:x*T+3,y:(y+1)*T-24,w:26,h:24,vx:-0.8,dir:-1,alive:true,squash:0};
}
/* Bosse: golem (Sprung-Angriff, 3 Leben) und drake (schießt Feuerbälle und stürmt, 5 Leben) */
function jrMakeBoss(type,col){
  const T=JR_T,drake=type==='drake',w=drake?64:56,h=drake?44:56,hp=drake?5:3;
  return {type:drake?'drake':'golem',x:col*T,y:10*T-h,sx:col*T,sy:10*T-h,w,h,hp,maxhp:hp,vx:0,vy:0,dir:-1,inv:0,alive:true,cd:120,mode:'walk',t:0};
}
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
  (spec.springs||[]).forEach(x=>{g[9][x]='J';});
  if(spec.gate!=null)for(let r=0;r<=9;r++)g[r][spec.gate]='G';
  const enemies=(spec.enemies||[]).map(([x,y,type])=>jrMakeEnemy(x,y,type));
  const movers=(spec.movers||[]).map(([x,y,range,speed,axis])=>({x:x*JR_T,y:y*JR_T,ox:x*JR_T,oy:y*JR_T,w:96,h:14,range:range*JR_T,speed:speed||1,axis:axis||'x',dir:1,dx:0,dy:0}));
  const boss=spec.boss?jrMakeBoss(spec.boss.type,spec.boss.x):null;
  if(boss){ // Arena: zusammenhängender Boden um den Boss, rechts begrenzt durch das Tor
    let l=spec.boss.x;while(l>0&&g[10][l-1]==='#')l--;
    boss.minX=l*JR_T;boss.maxX=(spec.gate!=null?spec.gate:w)*JR_T-boss.w;
  }
  return {w,g,enemies,movers,boss,gate:spec.gate!=null?spec.gate:-1,
    powers,warps,start:spec.start||[2,8],theme:spec.theme||0,time:spec.time||300,name:spec.name};
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
  {name:'Mitternachts-Burg',theme:2,w:170,flag:164,time:260,
   ground:[[0,14],[18,32],[36,50],[54,68],[72,86],[90,104],[108,122],[126,140],[144,168]],
   checkpoint:[75,145],
   boss:{type:'golem',x:152},gate:160,
   tunnels:[[55,3]],
   platforms:[[9,7,4,'B'],[27,7,4,'B'],[45,7,4,'B'],[63,7,4,'B'],[81,7,4,'B'],[99,7,4,'B'],[117,7,4,'B'],[135,7,4,'B']],
   blocks:[[10,7],[28,7],[46,7],[64,7],[100,7],[118,7]],
   power:[[82,7,'magnet'],[136,7,'shield']],
   pipes:[[6,2],[60,3],[96,3],[132,3]],
   warps:[[24,3,0]],
   spikes:[[42,43],[78,79],[114,115]],
   coinRows:[[9,6,4],[27,6,4],[45,6,4],[63,6,4],[81,6,4],[99,6,4],[117,6,4],[135,6,4],[150,7,6]],
   coins:[[15,5],[16,5],[33,5],[34,5],[51,5],[52,5],[69,5],[70,5],[87,5],[88,5],[105,5],[106,5],[123,5],[124,5],[141,5],[142,5]],
   enemies:[[12,9],[21,9],[30,9],[66,9],[93,9],[102,9],[129,9]]}
];

/* Generator für die Level 4–6: gleichmäßige Abschnitte (je 15 Kacheln) mit einem Merkmal pro Abschnitt.
   Regeln, damit alles schaffbar bleibt: Landezone am Anfang frei, Stacheln nie unter Plattformen,
   keine Gegner in Stachel-Abschnitten, Löcher höchstens 3 Kacheln breit. */
function jrGenSpec(name,theme,time,plan,gaps){
  const L=15,ground=[],platforms=[],blocks=[],power=[],pipes=[],warps=[],spikes=[],coinRows=[],coins=[],enemies=[],stairs=[],tunnels=[],checkpoint=[],movers=[],springs=[];
  let x=0,flag=0,boss=null,gate=null;
  plan.forEach((kind,i)=>{
    const a=x,len=kind==='finish'?18:kind.startsWith('arena')?26:L,b=a+len-1;ground.push([a,b]);
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
      case 'fly':enemies.push([a+7,6,'fly'],[a+11,6,'fly']);coinRows.push([a+4,7,7]);break;
      case 'spiky':enemies.push([a+9,9,'spiky']);coinRows.push([a+4,7,5]);break;
      case 'shoot':enemies.push([a+11,9,'shoot']);coinRows.push([a+3,7,5]);break;
      case 'mover':movers.push([a+3,6,7,1.2,'x']);coinRows.push([a+4,5,8]);enemies.push([a+11,9]);break;
      case 'crumble':platforms.push([a+6,7,5,'C']);coinRows.push([a+6,6,5]);enemies.push([a+3,9]);break;
      case 'spring':springs.push(a+5);platforms.push([a+8,4,5,'B']);coinRows.push([a+8,3,5]);power.push([a+10,4,arg||'feather']);break;
      case 'arena':checkpoint.push(a+2);boss={type:arg||'golem',x:a+14};gate=a+21;flag=a+24;coinRows.push([a+6,7,6]);break;
      case 'finish':stairs.push([a+4,4]);flag=b-5;break;
    }
    x=b+1+gaps[i%gaps.length];
  });
  const w=x-gaps[(plan.length-1)%gaps.length]+0;
  return {name,theme,time,w:Math.max(w,flag+3),flag,ground,platforms,blocks,power,pipes,warps,spikes,coinRows,coins,enemies,stairs,tunnels,checkpoint,movers,springs,boss,gate};
}
JR_SPECS.push(
  jrGenSpec('Kristallhöhle',3,300,['start','plain','pipe','crumble','spikes','fly','tunnel','checkpoint','warp:1','stairs','spring:feather','spikes','mover','plain','finish'],[2,3,3,3,3,3,3]),
  jrGenSpec('Schneegipfel',4,290,['start','plain','pipe:3','spikes','spiky','stairs','power:magnet','tunnel','checkpoint','spikes:3','plain','warp:0','shoot','pipe:3','fly','spikes','finish'],[3,3,3,3,3,3,3]),
  jrGenSpec('Vulkan-Festung',5,280,['start','enemies','spikes:3','pipe:3','power:shield','spiky','spikes','tunnel','checkpoint','stairs','spikes:3','warp:1','spring:magnet','shoot','pipe:3','spikes:3','crumble','plain','arena:drake'],[3,3,3,3,3,3,3])
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

/* ── Fortschritt je Konto (Profil aus der Spielzentrale, alle Konten in EINEM Eintrag zf_jump_p) ── */
function jrAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function jrProfKey(name){return String(name||'').trim().toLowerCase()||'_gast';}
function jrProfAll(){try{const o=JSON.parse(localStorage.getItem('zf_jump_p')||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function jrProf(name){
  if(name===undefined)name=jrAccount();
  const all=jrProfAll(),p=all[jrProfKey(name)];
  if(p)return Object.assign({name:name||'',best:0,unlocked:1,done:0,stars:{},times:{},coins:0,slams:0,bosses:0,cleared:0},p);
  const q={name:name||'',best:0,unlocked:1,done:0,stars:{},times:{},coins:0,slams:0,bosses:0,cleared:0};
  if(!all._legacy){q.best=jrLoad('zf_jump_best',0);q.unlocked=Math.max(1,jrLoad('zf_jump_unlocked',1));q.done=jrLoad('zf_jump_done',0);}  // alter Fortschritt gehört dem ersten Konto
  return q;
}
function jrProfSave(p){const all=jrProfAll();all[jrProfKey(p.name)]=p;all._legacy=1;jrSave('zf_jump_p',JSON.stringify(all));}
function jrStarCount(p){let n=0;for(const k in p.stars){const v=p.stars[k]|0;n+=(v&1?1:0)+(v&2?1:0)+(v&4?1:0);}return n;}
/* Herausforderungen (Tages-Challenges der Spielzentrale): Ereignisse sammeln und gebündelt melden */
const jrChalBuf={};
function jrChal(kind,n){jrChalBuf[kind]=(jrChalBuf[kind]||0)+(n||1);}
function jrChalFlush(){
  const keys=Object.keys(jrChalBuf);if(!keys.length)return;
  const buf=Object.assign({},jrChalBuf);keys.forEach(k=>delete jrChalBuf[k]);
  const name=jrAccount();if(!name||typeof zcEvent!=='function')return;
  try{zcEvent({name,game:'jump',jump:buf});}catch(e){}
}
/* Galerie: geschaffte Level je Konto merken */
function jrGalMark(id){const pf=jrProf();pf.gal=pf.gal||[];if(!pf.gal.includes(id)){pf.gal.push(id);jrProfSave(pf);}}
function jrGalDone(){return jrProf().gal||[];}
function jrCountCoins(L){let n=0;for(const r of L.g)for(const c of r)if(c==='o')n++;return n;}

function jrCloneFrom(L,idx){
  return {idx,w:L.w,g:L.g.map(r=>r.slice()),theme:L.theme,name:L.name,bonus:!!L.bonus,custom:!!L.custom,
    enemies:L.enemies.map(e=>({...e})),start:L.start.slice(),time:L.time,
    powers:Object.assign({},L.powers||{}),warps:Object.assign({},L.warps||{}),
    movers:(L.movers||[]).map(m=>({...m})),boss:L.boss?{...L.boss}:null,gate:L.gate!=null?L.gate:-1,bullets:[]};
}
function jrCloneLevel(idx){return jrCloneFrom(JR_LEVELS[idx],idx);}
function jrPlayerAt(level){
  return {x:level.start[0]*JR_T+5,y:level.start[1]*JR_T,w:22,h:JR_H_STAND,vx:0,vy:0,onGround:false,face:1,coyote:0,jbuf:0,anim:0,
    duck:false,slam:false,nocut:false,riding:null,inv:0,shield:false,feather:0,magnet:0,dj:false,sg:0,warpT:0};
}
/* Neues Spiel (idx = Startlevel) */
function jrNewState(idx){
  const n=JR_LEVELS.length,lvl=jrCloneLevel(Math.max(0,Math.min(n-1,idx||0)));
  return {mode:'menu',level:lvl,p:jrPlayerAt(lvl),cam:0,coins:0,score:0,lives:3,timeLeft:lvl.time,frames:0,paused:false,fade:0,
    popups:[],fx:[],shake:0,shock:null,checkpoint:null,stack:[],crumbs:{},regrow:[],custom:false,customSrc:null,timer:0,bumps:{},sel:Math.max(0,Math.min(n-1,idx||0)),
    best:jrProf().best,unlocked:Math.max(1,Math.min(n,jrProf().unlocked)),done:jrProf().done,stars:jrProf().stars,times:jrProf().times,msg:'',lvDeaths:0,coinInit:jrCountCoins(lvl),clearInfo:null};
}
/* Level (neu) laden, Fortschritt (Münzen, Punkte, Leben) bleibt */
function jrLoadLevel(st,idx){
  st.level=st.customSrc?jrCloneFrom(st.customSrc,-1):jrCloneLevel(idx);
  st.p=jrPlayerAt(st.level);st.cam=0;st.timeLeft=st.level.time;st.frames=0;st.lvDeaths=0;st.coinInit=jrCountCoins(st.level);st.clearInfo=null;st.popups=[];st.bumps={};st.fx=[];st.shake=0;st.shock=null;st.checkpoint=null;st.stack=[];st.crumbs={};st.regrow=[];
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
const JR_SOLID={'#':1,'B':1,'?':1,'!':1,'U':1,'T':1,'W':1,'X':1,'C':1,'J':1,'G':1};
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
  jrUpdateMovers(st);
  if(p.riding){const m=p.riding;if(p.x+p.w>m.x&&p.x<m.x+m.w&&Math.abs(p.y+p.h-m.y)<5){p.x+=m.dx;p.y+=m.dy;}else p.riding=null;}
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
    p.vy=-JR_JUMP;p.jbuf=0;p.coyote=0;p.onGround=false;p.riding=null;
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
  const preVy=p.vy,wasAir=!p.onGround,bottomBefore=p.y+p.h;
  const r=jrMove(st,p);
  if(!r.ground&&p.vy>=0){   // bewegliche Plattformen (von oben betretbar)
    for(const m of st.level.movers){
      if(p.x+p.w>m.x+2&&p.x<m.x+m.w-2&&bottomBefore<=m.y+6+Math.max(0,m.dy)&&p.y+p.h>=m.y){p.y=m.y-p.h-0.01;p.vy=0;r.ground=true;p.riding=m;break;}
    }
  }
  p.onGround=r.ground;
  if(r.ground&&p.slam)jrSlamLand(st);
  else if(r.ground){jrGroundEffects(st,preVy,wasAir);if(wasAir&&preVy>4&&!p.nocut){jrDust(st,p.x+p.w/2,p.y+p.h,5,0);jrSfx('jrLand');}}
  jrCrumbleStep(st);
  if(p.onGround&&Math.abs(p.vx)>2&&st.frames%6===0)jrDust(st,p.x+p.w/2-p.face*6,p.y+p.h,1,p.face);
  p.anim+=Math.abs(p.vx)*0.15;
  const skinTrail=jrSkin().trail;if(skinTrail&&(Math.abs(p.vx)>0.5||!p.onGround))jrTrail(st,skinTrail);
  // Kopf an Blöcken
  r.head.forEach(([tx,ty])=>{
    const c=jrTile(st,tx,ty);
    if(c==='?'){
      st.level.g[ty][tx]='U';st.coins++;jrChal('coins',1);st.score+=50;st.bumps[tx+','+ty]=10;
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
    if(e.type==='fly')jrFlyStep(st,e);
    else{
      e.vy=(e.vy||0)+JR_GRAV;if(e.vy>JR_MAXFALL)e.vy=JR_MAXFALL;
      const sp=e.sp||0.8;
      if(e.type==='shoot')e.vx=0;
      const before=e.x,rr=jrMove(st,{get x(){return e.x;},set x(v){e.x=v;},get y(){return e.y;},set y(v){e.y=v;},
        get vx(){return e.vx;},set vx(v){e.vx=v;},get vy(){return e.vy;},set vy(v){e.vy=v;},w:e.w,h:e.h});
      if(e.type==='shoot')jrShootStep(st,e);
      else{
        if(rr.hitX||e.x===before){e.dir*=-1;e.vx=sp*e.dir;}
        // an Kanten umdrehen (kein Abstürzen)
        const aheadX=e.dir>0?e.x+e.w+2:e.x-2,footY=Math.floor((e.y+e.h+2)/T);
        if(rr.ground&&!jrSolid(st,Math.floor(aheadX/T),footY)){e.dir*=-1;e.vx=sp*e.dir;}
      }
      if(e.y>JR_ROWS*T+60)e.alive=false;
    }
    // Berührung mit dem Spieler
    if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
      const fromAbove=p.vy>0&&(p.y+p.h)-e.y<18;
      if(e.type==='spiky'&&!(p.slam&&fromAbove)){if(p.inv<=0&&jrHurt(st,false))return;}
      else if(fromAbove){
        jrKillEnemy(st,e,p.slam);
        if(!p.slam){p.vy=inp.jumpHeld?-10.5:-8;p.onGround=false;p.nocut=true;}
        jrSfx('jrStomp');
      }else if(p.inv<=0){if(jrHurt(st,false))return;}
    }
  }
  if(jrBulletsStep(st))return;
  if(jrBossStep(st,inp))return;
  // Popups / Wackeln
  st.popups.forEach(o=>{o.t--;o.y-=0.8;});st.popups=st.popups.filter(o=>o.t>0);
  Object.keys(st.bumps).forEach(k=>{if(--st.bumps[k]<=0)delete st.bumps[k];});
  // Kamera
  const target=Math.max(0,Math.min(st.level.w*T-JR_W,p.x+p.w/2-JR_W/2+p.face*30));
  st.cam+=(target-st.cam)*0.12;
}
function jrKillEnemy(st,e,bySlam){
  e.alive=false;e.squash=25;st.score+=100;
  st.popups.push({x:e.x+e.w/2,y:e.y,t:30,txt:'+100'});
  if(bySlam&&typeof jrChal==='function')jrChal('slam',1);
}
/* Bewegliche Plattformen */
function jrUpdateMovers(st){
  for(const m of st.level.movers){
    const ox=m.x,oy=m.y;
    if(m.axis==='y'){m.y+=m.speed*m.dir;if(m.y>m.oy+m.range){m.y=m.oy+m.range;m.dir=-1;}else if(m.y<m.oy){m.y=m.oy;m.dir=1;}}
    else{m.x+=m.speed*m.dir;if(m.x>m.ox+m.range){m.x=m.ox+m.range;m.dir=-1;}else if(m.x<m.ox){m.x=m.ox;m.dir=1;}}
    m.dx=m.x-ox;m.dy=m.y-oy;
  }
}
/* Boden unter den Füßen: Federn schleudern hoch, Bröckelplattformen fangen an zu bröseln */
function jrGroundEffects(st,preVy,wasAir){
  const p=st.p,T=JR_T,by=Math.floor((p.y+p.h+1)/T),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-0.01)/T);
  for(let tx=x0;tx<=x1;tx++){
    const c=jrTile(st,tx,by);
    if(c==='J'&&wasAir&&preVy>1.5){
      p.vy=-JR_SPRING;p.onGround=false;p.nocut=true;p.coyote=0;st.bumps[tx+','+by]=10;
      jrSfx('jrSpring');jrBurst(st,tx*T+T/2,by*T,'#ffe082',6);
      return;
    }
    if(c==='C'&&!st.crumbs[tx+','+by])st.crumbs[tx+','+by]={t:40,tx,ty:by};
  }
}
function jrCrumbleStep(st){
  for(const k of Object.keys(st.crumbs)){
    const c=st.crumbs[k];
    if(--c.t<=0){
      if(st.level.g[c.ty][c.tx]==='C'){st.level.g[c.ty][c.tx]='.';st.regrow.push({tx:c.tx,ty:c.ty,t:240});jrBurst(st,c.tx*JR_T+JR_T/2,c.ty*JR_T+JR_T/2,'#bcaaa4',8);jrSfx('jrCrumble');}
      delete st.crumbs[k];
    }
  }
  for(const g of st.regrow){
    if(--g.t<=0){
      const p=st.p,inside=p.x+p.w>g.tx*JR_T&&p.x<(g.tx+1)*JR_T&&p.y+p.h>g.ty*JR_T&&p.y<(g.ty+1)*JR_T;
      if(inside)g.t=30;else{st.level.g[g.ty][g.tx]='C';g.done=true;}
    }
  }
  st.regrow=st.regrow.filter(g=>!g.done);
}
/* Fliegende Gegner: pendeln waagerecht und wippen */
function jrFlyStep(st,e){
  e.x+=e.vx;
  const T=JR_T;
  if(Math.abs(e.x-e.ox)>96||jrSolid(st,Math.floor((e.x+(e.vx>0?e.w:0))/T),Math.floor((e.y+e.h/2)/T))){e.vx*=-1;e.dir*=-1;}
  e.y=e.by+Math.sin(st.frames*0.06+e.ph)*22;
}
/* Schützen: bleiben stehen, drehen sich zum Spieler und schießen alle 2,5 Sekunden */
function jrShootStep(st,e){
  const p=st.p;
  e.dir=(p.x+p.w/2<e.x+e.w/2)?-1:1;
  if(--e.cd<=0){
    if(Math.abs(p.x-e.x)<340&&Math.abs(p.y-e.y)<130){
      st.level.bullets.push({x:e.x+e.w/2+e.dir*10,y:e.y+e.h*0.45,vx:e.dir*2.6,vy:0,t:260,r:5});
      jrSfx('jrShoot');e.cd=150;
    }else e.cd=30;
  }
}
function jrBulletsStep(st){
  const p=st.p,T=JR_T;
  for(const b of st.level.bullets){
    b.x+=b.vx;b.y+=b.vy||0;b.t--;
    if(jrSolid(st,Math.floor(b.x/T),Math.floor(b.y/T)))b.t=0;
    else if(!b.hit&&b.x+b.r>p.x&&b.x-b.r<p.x+p.w&&b.y+b.r>p.y&&b.y-b.r<p.y+p.h&&p.inv<=0){b.hit=true;b.t=0;if(jrHurt(st,false))return true;}
  }
  st.level.bullets=st.level.bullets.filter(b=>b.t>0);
  return false;
}
/* Boss: golem springt auf dich zu, drake stürmt und schießt. Besiegen: draufspringen oder Slam-Stoßwelle. */
function jrBossStep(st,inp){
  const b=st.level.boss;if(!b||!b.alive)return false;
  const p=st.p,T=JR_T;
  if(Math.abs(p.x-b.x)>620)return false;   // erst aktiv, wenn der Spieler in der Nähe ist
  if(b.inv>0)b.inv--;
  b.vy=Math.min(JR_MAXFALL,b.vy+JR_GRAV);
  const dirTo=(p.x+p.w/2<b.x+b.w/2)?-1:1;
  const rage=1+(b.maxhp-b.hp)*0.22;
  if(b.type==='golem'){
    if(b.onGround)b.dir=dirTo;
    b.vx=b.dir*(0.9*rage);
    if(--b.cd<=0&&b.onGround){b.vy=-11.5;b.cd=Math.max(70,150-(b.maxhp-b.hp)*25);b.vx=dirTo*3.2;jrSfx('jrSlam');}
  }else{
    b.t++;
    if(b.mode==='walk'){b.dir=dirTo;b.vx=b.dir*1.1*rage;if(b.t>90){b.mode='shoot';b.t=0;}}
    else if(b.mode==='shoot'){b.dir=dirTo;b.vx=0;if(b.t===30){st.level.bullets.push({x:b.x+b.w/2+b.dir*30,y:b.y+b.h*0.5,vx:b.dir*2.4,vy:0,t:240,r:7});jrSfx('jrShoot');}if(b.t>80){b.mode='windup';b.t=0;}}
    else if(b.mode==='windup'){b.dir=dirTo;b.vx=0;if(b.t>32){b.mode='charge';b.t=0;b.dir=dirTo;}}
    else if(b.mode==='charge'){b.vx=b.dir*3*Math.min(1.3,rage);if(b.t>40){b.mode='rest';b.t=0;}}
    else{b.vx=0;if(b.t>100){b.mode='walk';b.t=0;}}
  }
  const o=b,before=b.x;
  const rr=jrMove(st,{get x(){return o.x;},set x(v){o.x=v;},get y(){return o.y;},set y(v){o.y=v;},get vx(){return o.vx;},set vx(v){o.vx=v;},get vy(){return o.vy;},set vy(v){o.vy=v;},w:o.w,h:o.h});
  b.onGround=rr.ground;
  if(b.x<b.minX){b.x=b.minX;b.dir=1;}else if(b.x>b.maxX){b.x=b.maxX;b.dir=-1;}
  if(rr.hitX&&b.type==='drake'&&b.mode==='charge'){b.mode='rest';b.t=0;}
  // Kontakt mit dem Spieler
  if(p.x<b.x+b.w&&p.x+p.w>b.x&&p.y<b.y+b.h&&p.y+p.h>b.y){
    const above=p.vy>0&&(p.y+p.h)-b.y<26;
    if(above&&b.inv<=0){jrBossHurt(st);if(!p.slam){p.vy=-11;p.nocut=true;p.onGround=false;}return !b.alive?false:false;}
    else if(!above&&p.inv<=0){if(jrHurt(st,false))return true;}
  }
  return false;
}
function jrBossHurt(st){
  const b=st.level.boss;if(!b||!b.alive||b.inv>0)return;
  b.hp--;b.inv=75;st.shake=10;
  jrBurst(st,b.x+b.w/2,b.y+b.h/2,'#ffcc80',14);jrSfx('jrBossHit');
  st.popups.push({x:b.x+b.w/2,y:b.y-6,t:40,txt:b.hp>0?'Treffer! '+b.hp+' übrig':'Besiegt!'});
  if(b.hp<=0)jrBossDefeat(st);
}
function jrBossDefeat(st){
  const b=st.level.boss;b.alive=false;st.score+=1000;st.level.bullets=[];
  for(let r=0;r<=9;r++)for(let c=0;c<st.level.w;c++)if(st.level.g[r][c]==='G'){st.level.g[r][c]='.';jrBurst(st,c*JR_T+16,r*JR_T+16,'#b0bec5',2);}
  st.shake=20;st.popups.push({x:b.x+b.w/2,y:b.y-30,t:90,txt:'Boss besiegt! Das Tor ist offen!'});
  jrSfx('jrBoom');if(typeof jrChal==='function')jrChal('boss',1);
}
const JR_BREAKABLE={'B':1,'?':1,'!':1,'U':1};
/* Slam-Landung: bricht Blöcke direkt unter den Füßen (die Attacke geht dann weiter nach unten);
   auf hartem Boden endet sie mit einer Stoßwelle, die Gegner in der Nähe besiegt. */
function jrSlamLand(st){
  const p=st.p,T=JR_T,ty=Math.floor((p.y+p.h+1)/T),x0=Math.floor(p.x/T),x1=Math.floor((p.x+p.w-0.01)/T);
  for(let tx=x0;tx<=x1;tx++)if(jrTile(st,tx,ty)==='J'){p.slam=false;p.vy=-JR_SPRING;p.onGround=false;p.nocut=true;st.bumps[tx+','+ty]=10;jrSfx('jrSpring');return;}
  let broke=0;
  for(let tx=x0;tx<=x1;tx++){
    const c=jrTile(st,tx,ty);
    if(JR_BREAKABLE[c]){
      st.level.g[ty][tx]='.';broke++;
      if(c==='?'){st.coins++;jrChal('coins',1);st.score+=50;st.popups.push({x:tx*T+T/2,y:ty*T,t:30,txt:'+50'});jrCheckLife(st);}
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
  const fx=jrFx();
  st.shake=10;st.shock={x:p.x+p.w/2,y:p.y+p.h,t:16,rgb:fx.rgb,dbl:fx.double,rainbow:fx.rainbow};
  for(let i=0;i<fx.parts.length;i++)jrBurst(st,p.x+p.w/2,p.y+p.h,fx.parts[i],Math.ceil(fx.n/fx.parts.length));jrDust(st,p.x+p.w/2,p.y+p.h,8,0);
  const cx=p.x+p.w/2,fy=p.y+p.h;
  for(const e of st.level.enemies){
    if(e.alive&&Math.abs(e.x+e.w/2-cx)<72&&Math.abs(e.y+e.h-fy)<22){
      jrKillEnemy(st,e,true);
    }
  }
  const bs=st.level.boss;
  if(bs&&bs.alive&&Math.abs(bs.x+bs.w/2-cx)<96&&Math.abs(bs.y+bs.h-fy)<26)jrBossHurt(st);
  jrSfx('jrBoom');
}
function jrCollectCoin(st,tx,ty){
  st.level.g[ty][tx]='.';st.coins++;jrChal('coins',1);st.score+=10;
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
  st.lives--;st.lvDeaths++;jrChalFlush();
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
  // Bröckelplattformen zurück, Kugeln weg, Boss zurück an den Start (seine Leben bleiben)
  st.regrow.forEach(g=>{st.level.g[g.ty][g.tx]='C';});st.regrow=[];st.crumbs={};st.level.bullets=[];
  const bs=st.level.boss;if(bs&&bs.alive){bs.x=bs.sx;bs.y=bs.sy;bs.vx=0;bs.vy=0;bs.inv=0;bs.mode='walk';bs.t=0;bs.cd=120;}
}
function jrClear(st){
  if(st.mode!=='play')return;
  const bonus=Math.max(0,st.timeLeft)*5+500;
  st.score+=bonus;st.mode='clear';st.timer=150;st.msg='Level geschafft!  +'+bonus;
  if(!st.custom){
    const idx=st.level.idx,next=idx+2,pf=jrProf();
    const got=st.coinInit>0?(st.coinInit-jrCountCoins(st.level))/st.coinInit:1;
    const stars=1|(got>=0.8?2:0)|(st.lvDeaths===0?4:0);
    const old=pf.stars[idx]|0,fresh=stars&~old,firstClear=!(pf.done&(1<<idx));
    pf.stars[idx]=old|stars;
    const secs=Math.round(st.frames/60);if(!pf.times[idx]||secs<pf.times[idx])pf.times[idx]=secs;
    if(st.level.boss&&!st.level.boss.alive)pf.bosses++;
    pf.done|=(1<<idx);st.done=pf.done;st.stars=pf.stars;st.times=pf.times;pf.cleared++;
    if(next<=JR_LEVELS.length&&next>pf.unlocked)pf.unlocked=next;
    st.unlocked=Math.max(st.unlocked,pf.unlocked);
    // Belohnung in AppHub-Coins: neue Sterne, erstes Abschließen, Boss
    let reward=0;[1,2,4].forEach(b=>{if(fresh&b)reward+=5;});
    if(firstClear&&st.level.boss)reward+=10;
    pf.coins+=Math.max(0,Math.round(got*(st.coinInit)));
    st.clearInfo={stars,got:Math.round(got*100),reward};
    jrSaveBestInto(st,pf);jrProfSave(pf);
    if(reward>0&&jrAccount()&&typeof zcAddCoins==='function'){try{zcAddCoins(jrAccount(),reward);if(typeof smSave==='function')smSave('zentrale');}catch(e){}}
    jrChal('clear',1);jrChalFlush();
  }
  jrSfx('jrClear');
}
function jrNextLevel(st){
  if(st.custom){
    st.mode='customdone';
    if(st.gallery){jrGalMark(st.gallery);jrToMenu();return;}   // Galerie-Level: zurück zur Weltkarte
    if(typeof jrEdReturn==='function')jrEdReturn(true);return;
  }
  if(st.level.idx>=JR_LEVELS.length-1){st.mode='win';st.msg='Alle Level geschafft!';jrSaveBest(st);return;}
  jrLoadLevel(st,st.level.idx+1);st.mode='play';
}
function jrSaveBestInto(st,pf){if(st.score>pf.best)pf.best=st.score;st.best=pf.best;}
function jrSaveBest(st){if(st.custom||st.score<=st.best)return;const pf=jrProf();jrSaveBestInto(st,pf);jrProfSave(pf);}

/* ── Held-Skin (aus dem Shop) ── */
const JR_SKIN_DEFAULT={cap:'#ffb300',capTop:'#ffe082',body:'#3f6fe6',strap:'#ffd54f',skin:'#ffdcb8',boots:'#5d4037',trail:null,glow:null,visor:false,mask:false,cape:null};
/* Slam-Effekt (aus dem Shop): Farbe der Stoßwelle und der Funken */
const JR_FX_DEFAULT={rgb:[255,255,255],parts:['#d7ccc8'],n:10,double:false,rainbow:false};
function jrFx(){
  try{
    if(typeof zcEquipped==='function'&&typeof zcItem==='function'){
      const id=zcEquipped('jfx'),it=id&&zcItem('jfx',id);
      if(it&&it.fx)return Object.assign({},JR_FX_DEFAULT,it.fx);
    }
  }catch(e){}
  return JR_FX_DEFAULT;
}
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
  }else if(ch==='C'){
    const cr=st.crumbs[tx+','+ty],sh=cr?Math.sin(t*1.7)*1.6:0;
    ctx.fillStyle='#a1887f';ctx.fillRect(x+sh,y,T,T);ctx.fillStyle='#8d6e63';ctx.fillRect(x+sh,y,T,7);
    ctx.strokeStyle='#5d4037';ctx.lineWidth=1.5;ctx.strokeRect(x+sh+0.5,y+0.5,T-1,T-1);
    ctx.beginPath();ctx.moveTo(x+sh+8,y+7);ctx.lineTo(x+sh+13,y+17);ctx.lineTo(x+sh+9,y+25);ctx.moveTo(x+sh+22,y+8);ctx.lineTo(x+sh+19,y+18);ctx.stroke();
  }else if(ch==='J'){
    const b=st.bumps[tx+','+ty]?1-st.bumps[tx+','+ty]/10:1,h=6+10*b;
    ctx.strokeStyle='#90a4ae';ctx.lineWidth=3;ctx.beginPath();
    for(let i=0;i<4;i++){const yy=y+T-3-i*(h/4);ctx.moveTo(x+8,yy);ctx.lineTo(x+T-8,yy-h/8);}ctx.stroke();
    ctx.fillStyle='#e53935';jrRR(ctx,x+3,y+T-4-h-5,T-6,7,3);ctx.fill();
  }else if(ch==='G'){
    ctx.fillStyle='#455a64';ctx.fillRect(x+3,y,T-6,T);ctx.strokeStyle='#263238';ctx.lineWidth=2;ctx.strokeRect(x+3.5,y+0.5,T-7,T-1);
    ctx.fillStyle='#78909c';ctx.fillRect(x+6,y,4,T);ctx.fillRect(x+T-10,y,4,T);
    ctx.fillStyle='rgba(255,82,82,'+(0.5+0.3*Math.sin(t*0.1+ty))+')';ctx.beginPath();ctx.arc(x+T/2,y+T/2,4,0,Math.PI*2);ctx.fill();
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
  if(e.type==='fly'){ // Fledermaus
    const fl=Math.sin(t*0.4+e.x)*7;
    ctx.fillStyle='#37474f';ctx.beginPath();ctx.ellipse(x+e.w/2,y+e.h/2,8,7,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+e.w/2-6,y+e.h/2);ctx.quadraticCurveTo(x-6,y+e.h/2-12+fl,x-4,y+e.h/2+6);ctx.lineTo(x+e.w/2-6,y+e.h/2+4);ctx.fill();
    ctx.beginPath();ctx.moveTo(x+e.w/2+6,y+e.h/2);ctx.quadraticCurveTo(x+e.w+6,y+e.h/2-12+fl,x+e.w+4,y+e.h/2+6);ctx.lineTo(x+e.w/2+6,y+e.h/2+4);ctx.fill();
    ctx.fillStyle='#ff5252';ctx.beginPath();ctx.arc(x+e.w/2-3,y+e.h/2-1,2,0,Math.PI*2);ctx.arc(x+e.w/2+3,y+e.h/2-1,2,0,Math.PI*2);ctx.fill();return;
  }
  if(e.type==='spiky'){ // Stachelkäfer: nicht draufspringen
    ctx.fillStyle='#b71c1c';ctx.beginPath();ctx.arc(x+e.w/2,y+e.h-8,e.w/2,Math.PI,0);ctx.lineTo(x+e.w,y+e.h-4);ctx.lineTo(x,y+e.h-4);ctx.fill();
    ctx.fillStyle='#eceff1';for(let i=0;i<4;i++){const px=x+3+i*6;ctx.beginPath();ctx.moveTo(px,y+e.h-13);ctx.lineTo(px+3,y+e.h-25);ctx.lineTo(px+6,y+e.h-13);ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+e.w/2+e.dir*5,y+e.h-10,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+e.w/2+e.dir*6,y+e.h-10,1.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4e342e';jrRR(ctx,x+2+wob,y+e.h-5,8,5,2);ctx.fill();jrRR(ctx,x+e.w-10-wob,y+e.h-5,8,5,2);ctx.fill();return;
  }
  if(e.type==='shoot'){ // Kanonenpflanze
    ctx.fillStyle='#2e7d32';ctx.fillRect(x+e.w/2-3,y+e.h-12,6,12);
    ctx.fillStyle='#455a64';jrRR(ctx,x+2,y+2,e.w-4,e.h-10,8);ctx.fill();
    ctx.fillStyle='#263238';ctx.fillRect(x+(e.dir>0?e.w-6:-4),y+e.h/2-8,10,8);
    ctx.fillStyle='#ffb300';ctx.beginPath();ctx.arc(x+e.w/2-e.dir*2,y+9,3.5,0,Math.PI*2);ctx.fill();return;
  }
  ctx.fillStyle='#8e44ad';ctx.beginPath();ctx.arc(x+e.w/2,y+e.h-10,e.w/2,Math.PI,0);ctx.lineTo(x+e.w,y+e.h-4);ctx.lineTo(x,y+e.h-4);ctx.fill();
  ctx.fillStyle='#5b2c7a';jrRR(ctx,x+2+wob,y+e.h-6,9,6,3);ctx.fill();jrRR(ctx,x+e.w-11-wob,y+e.h-6,9,6,3);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+8,y+9,4,0,Math.PI*2);ctx.arc(x+18,y+9,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+8+e.dir*1.5,y+10,1.8,0,Math.PI*2);ctx.arc(x+18+e.dir*1.5,y+10,1.8,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+4,y+4);ctx.lineTo(x+11,y+7);ctx.moveTo(x+22,y+4);ctx.lineTo(x+15,y+7);ctx.stroke();
}
/* Boss zeichnen samt Lebensanzeige */
function jrDrawBoss(ctx,st,t){
  const b=st.level.boss,x=Math.round(b.x-st.cam),y=Math.round(b.y);
  if(x<-120||x>JR_W+120)return;
  ctx.save();
  if(b.inv>0&&Math.floor(b.inv/4)%2===0)ctx.globalAlpha=0.45;
  if(b.type==='golem'){
    ctx.fillStyle='#5d4037';jrRR(ctx,x,y+14,b.w,b.h-14,12);ctx.fill();
    ctx.fillStyle='#795548';jrRR(ctx,x+6,y,b.w-12,26,10);ctx.fill();
    ctx.fillStyle='#4e342e';ctx.fillRect(x+6,y+b.h-8,16,8);ctx.fillRect(x+b.w-22,y+b.h-8,16,8);
    ctx.fillStyle='#ff5252';ctx.beginPath();ctx.arc(x+b.w/2-9+b.dir*3,y+12,4,0,Math.PI*2);ctx.arc(x+b.w/2+9+b.dir*3,y+12,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#3e2723';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+b.w/2-14,y+5);ctx.lineTo(x+b.w/2-4,y+9);ctx.moveTo(x+b.w/2+14,y+5);ctx.lineTo(x+b.w/2+4,y+9);ctx.stroke();
    ctx.strokeStyle='rgba(255,183,77,0.7)';ctx.beginPath();ctx.moveTo(x+14,y+34);ctx.lineTo(x+22,y+40);ctx.lineTo(x+18,y+48);ctx.moveTo(x+40,y+30);ctx.lineTo(x+36,y+40);ctx.stroke();
  }else{
    const f=b.dir;ctx.translate(x+b.w/2,y+b.h/2);ctx.scale(f,1);
    if(b.mode==='windup'||b.mode==='charge')ctx.translate(Math.sin(t*1.6)*1.5,0);
    ctx.fillStyle='#c62828';jrRR(ctx,-30,-14,60,34,14);ctx.fill();
    ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(22,-10,15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffab91';ctx.beginPath();ctx.moveTo(-30,-4);ctx.lineTo(-44,-10);ctx.lineTo(-30,6);ctx.fill();
    ctx.fillStyle='#ff8a65';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-18+i*11,-14);ctx.lineTo(-13+i*11,-24);ctx.lineTo(-8+i*11,-14);ctx.fill();}
    ctx.fillStyle='#fff59d';ctx.beginPath();ctx.arc(26,-14,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.arc(27,-14,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3e2723';ctx.fillRect(-16,16,10,7);ctx.fillRect(8,16,10,7);
    if(b.mode==='shoot'||b.mode==='windup'){ctx.fillStyle='rgba(255,152,0,'+(0.5+0.4*Math.sin(t*0.5))+')';ctx.beginPath();ctx.arc(38,-4,5+(b.mode==='windup'?3:0),0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
  // Lebensleiste
  const bw=Math.max(60,b.w+10),bx=x+b.w/2-bw/2,by=y-16;
  ctx.fillStyle='rgba(0,0,0,0.55)';jrRR(ctx,bx-2,by-2,bw+4,10,5);ctx.fill();
  ctx.fillStyle='#ef5350';jrRR(ctx,bx,by,bw*Math.max(0,b.hp)/b.maxhp,6,3);ctx.fill();
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
  (st.level.movers||[]).forEach(m=>{
    const mx=Math.round(m.x-cam),my=Math.round(m.y);
    ctx.fillStyle='#90a4ae';jrRR(ctx,mx,my,m.w,m.h,6);ctx.fill();ctx.fillStyle='#cfd8dc';ctx.fillRect(mx+4,my+1,m.w-8,4);
    ctx.fillStyle='#455a64';ctx.beginPath();ctx.arc(mx+12,my+m.h-4,3,0,Math.PI*2);ctx.arc(mx+m.w-12,my+m.h-4,3,0,Math.PI*2);ctx.fill();
  });
  st.level.enemies.forEach(e=>jrDrawEnemy(ctx,e,st,t));
  if(st.level.boss&&st.level.boss.alive)jrDrawBoss(ctx,st,t);
  (st.level.bullets||[]).forEach(b=>{
    const bx=b.x-cam;ctx.fillStyle='rgba(255,152,0,0.35)';ctx.beginPath();ctx.arc(bx-b.vx*3,b.y,b.r*1.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff6d00';ctx.beginPath();ctx.arc(bx,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffee58';ctx.beginPath();ctx.arc(bx,b.y,b.r*0.5,0,Math.PI*2);ctx.fill();
  });
  const sk=jrSkin();
  jrDrawPlayer(ctx,st,t,sk);
  // Partikel und Stoßwelle
  st.fx.forEach(f=>{
    ctx.globalAlpha=Math.min(1,f.t/14);ctx.fillStyle=f.color;
    if(f.dust){ctx.beginPath();ctx.arc(f.x-cam,f.y,f.s*(1+(22-f.t)*0.04),0,Math.PI*2);ctx.fill();}
    else ctx.fillRect(f.x-cam-f.s/2,f.y-f.s/2,f.s,f.s);
    ctx.globalAlpha=1;
  });
  if(st.shock){
    const sh=st.shock,k=1-sh.t/16,rgb=sh.rgb||[255,255,255];
    const col=sh.rainbow?'hsla('+((jrFrame*14)%360)+',95%,62%,'+(0.85*(1-k))+')':'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+(0.85*(1-k))+')';
    ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(sh.x-cam,sh.y-2,10+k*70,3+k*9,0,0,Math.PI*2);ctx.stroke();
    if(sh.dbl){ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(sh.x-cam,sh.y-2,6+k*104,2+k*14,0,0,Math.PI*2);ctx.stroke();}
  }
  ctx.textAlign='center';ctx.font='bold 15px sans-serif';
  st.popups.forEach(o=>{ctx.globalAlpha=Math.min(1,o.t/15);ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=3;ctx.strokeText(o.txt,o.x-cam,o.y);ctx.fillText(o.txt,o.x-cam,o.y);ctx.globalAlpha=1;});
  ctx.restore();
  jrDrawPowers(ctx,st);
  if(st.level.bonus){ctx.fillStyle='rgba(20,24,36,0.65)';jrRR(ctx,JR_W-176,8,168,26,13);ctx.fill();ctx.fillStyle='#ffe082';ctx.textAlign='center';ctx.font='bold 13px sans-serif';ctx.fillText('✦ '+st.level.name+' ✦',JR_W-92,26);}
  if(st.fade>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,st.fade/24)+')';ctx.fillRect(0,0,JR_W,JR_H);}
  if(st.paused)jrCard(ctx,'PAUSE',['Klicken oder P zum Weiterspielen','↓ ducken · in der Luft ↓ = Slam','Auf goldenen Röhren ↓ halten: Geheimkammer'],'#ffca28');
  else if(st.mode==='clear'){
    const ci=st.clearInfo;
    jrCard(ctx,st.msg.split('  ')[0],ci?[st.msg.split('  ')[1]||'','','','Punkte: '+st.score+(ci.reward>0?'  ·  🪙 +'+ci.reward+' Coins':'')]:[st.msg.split('  ')[1]||'','Punkte: '+st.score],'#69f0ae');
    if(ci){ // Sterne: Ziel · 80 % der Münzen · kein Leben verloren
      const cy=JR_H/2+24;ctx.textAlign='center';
      [[1,'Ziel'],[2,'Münzen ≥ 80 %'],[4,'Ohne Sturz']].forEach(([b,lab],k)=>{const x=JR_W/2-100+k*100,on=ci.stars&b;
        ctx.font='34px sans-serif';ctx.fillStyle=on?'#ffca28':'rgba(255,255,255,0.22)';ctx.fillText('★',x,cy);
        ctx.font='11px sans-serif';ctx.fillStyle=on?'#fff':'rgba(255,255,255,0.5)';ctx.fillText(lab,x,cy+16);});
    }
  }
  else if(st.mode==='win')jrCard(ctx,'GESCHAFFT! 🎉',['Alle Level abgeschlossen','Punkte: '+st.score+(st.score>=st.best?'  🏆 Rekord':''),'Klicken für die Weltkarte'],'#69f0ae');
  else if(st.mode==='gameover')jrCard(ctx,'GAME OVER',['Punkte: '+st.score+(st.score>=st.best&&st.score>0?'  🏆 Rekord':''),'Klicken für die Weltkarte'],'#ff5a52');
}

/* ── Weltkarte (Levelauswahl) ── */
const JR_MAP_NODES=[[70,250],[170,175],[270,255],[370,170],[470,250],[570,170]];
function jrMapNodeAt(x,y){
  for(let i=0;i<JR_LEVELS.length;i++){const n=JR_MAP_NODES[i];if(Math.hypot(x-n[0],y-n[1])<=28)return i;}
  return -1;
}
function jrStarSum(stars){let n=0;for(const k in (stars||{})){const v=stars[k]|0;n+=(v&1?1:0)+(v&2?1:0)+(v&4?1:0);}return n;}
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
  ctx.font='13px sans-serif';ctx.lineWidth=3;ctx.strokeText('Weltkarte · Rekord '+st.best,22,62);ctx.fillText('Weltkarte · Rekord '+st.best+' · ★ '+jrStarSum(st.stars)+'/'+JR_LEVELS.length*3,22,62);
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
    if(!locked){const sb=(st.stars&&st.stars[i])|0;ctx.font='15px sans-serif';[1,2,4].forEach((b,k)=>{ctx.fillStyle=sb&b?'#ffca28':'rgba(0,0,0,0.28)';ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=2;ctx.strokeText('★',x-14+k*14,y+42);ctx.fillText('★',x-14+k*14,y+42);});}
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
window.addEventListener('blur',()=>{jrChalFlush();jrIn.left=jrIn.right=jrIn.jumpHeld=jrIn.down=false;if(jrState&&jrState.mode==='play'&&!jrState.paused&&jrActive())jrTogglePause(true);});
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
  else if(st.mode==='gameover'||st.mode==='win'){if(st.custom&&!st.gallery&&typeof jrEdReturn==='function')jrEdReturn(false);else jrToMenu();}
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
  jrChalFlush();
  jrRegisterSounds();
  if(jrRaf){cancelAnimationFrame(jrRaf);jrRaf=null;}
  jrState=jrNewState(jrProf().unlocked-1);jrState.mode='menu';jrLast=0;jrAcc=0;
  const cv=document.getElementById('jr-canvas');
  if(cv){cv.onclick=jrClick;}
  if(typeof jrEd!=='undefined'&&jrEd&&jrEd.open&&typeof jrEdClose==='function')jrEdClose();
  jrHud(true);
  const best=document.getElementById('jr-best');if(best)best.textContent=jrState.best;
  jrRaf=requestAnimationFrame(jrLoop);
}
