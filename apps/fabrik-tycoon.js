/* ══════════════════════════════════
   FABRIK-TYCOON – 3D-Brettspiel (WebGL, ohne Bibliothek): Würfle um ein Brett, kaufe Rohstoff-Felder, baue sie aus,
   stelle in der Werkstatt Bauteile her und liefere sie an der Rampe ab. Wer zuerst alle Teile für den Weltraum-Aufzug
   geliefert hat, gewinnt. Gegner: 1–3 Computer-Spieler. Die Regeln (ft…) laufen ohne Oberfläche und sind getestet.
══════════════════════════════════ */
const FT_N=32;                                   // Felder im Kreis
const FT_START_MONEY=500,FT_PASS_START=100,FT_MAX_ROUNDS=60;
const FT_RES={iron:{name:'Eisenerz',icon:'⛏️',color:'#8fa3b8',price:60},wood:{name:'Holz',icon:'🪵',color:'#6da55a',price:60},copper:{name:'Kupfer',icon:'🟠',color:'#e08a4a',price:80},coal:{name:'Kohle',icon:'⚫',color:'#4a4a55',price:80},oil:{name:'Öl',icon:'🛢️',color:'#8e5ab8',price:100}};
const FT_RES_ORDER=['iron','wood','copper','coal','oil','iron','copper','wood','coal','iron','copper','wood','oil','coal','iron','copper','wood','coal','oil','iron','copper','wood','coal','oil'];
const FT_CORNERS={0:'start',8:'workshop',16:'market',24:'delivery'};
const FT_EVENT_TILES=[4,12,20,28];
const FT_RECIPES={plate:{name:'Stahlplatte',icon:'🔩',need:{iron:2,coal:1}},cable:{name:'Kabelbündel',icon:'🔌',need:{copper:2,oil:1}},frame:{name:'Rahmen',icon:'🏗️',need:{wood:3,iron:1}}};
const FT_GOAL=3;                                 // je Bauteil-Art
const FT_UPGRADE=[80,140];                       // Kosten Stufe 2 und 3
const FT_SELL_PRICE=15;
const FT_COLORS=['#ff5252','#448aff','#69f0ae','#ffd740'];
const FT_NAMES=['Du','Robo','Zahnrad','Turbo'];

/* ── Brett ── */
function ftTiles(){
  const tiles=[];let r=0;
  for(let i=0;i<FT_N;i++){
    if(FT_CORNERS[i])tiles.push({i,type:FT_CORNERS[i],owner:-1,lvl:0});
    else if(FT_EVENT_TILES.includes(i))tiles.push({i,type:'event',owner:-1,lvl:0});
    else{const res=FT_RES_ORDER[r++];tiles.push({i,type:'res',res,price:FT_RES[res].price,owner:-1,lvl:0});}
  }
  return tiles;
}
function ftRng(seed){let s=(seed==null?Date.now():seed)>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

/* ── Spielzustand ── */
function ftNew(nPlayers,seed,humans){
  const rng=ftRng(seed);nPlayers=Math.max(2,Math.min(4,nPlayers|0||2));humans=humans==null?1:humans;
  const players=[];for(let i=0;i<nPlayers;i++)players.push({id:i,name:FT_NAMES[i],color:FT_COLORS[i],bot:i>=humans,money:FT_START_MONEY+i*30,inv:{iron:0,wood:0,copper:0,coal:0,oil:0},parts:{plate:0,cable:0,frame:0},delivered:{plate:0,cable:0,frame:0},pos:0,laps:0});
  return {rng,players,tiles:ftTiles(),cur:0,round:1,phase:'roll',dice:[0,0],flags:{},pending:null,log:[],winner:-1,over:false,lastEvent:null};
}
function ftLog(st,msg){st.log.unshift(msg);if(st.log.length>40)st.log.pop();}
function ftCur(st){return st.players[st.cur];}
function ftCanWin(p){return ['plate','cable','frame'].every(k=>p.delivered[k]>=FT_GOAL);}

/* Würfeln: 2 Würfel, Figur zieht. Rückgabe: Feldliste des Weges (für die Animation) */
function ftRoll(st,forced){
  if(st.phase!=='roll'||st.over)return null;
  const d1=forced?forced[0]:1+Math.floor(st.rng()*6),d2=forced?forced[1]:1+Math.floor(st.rng()*6),steps=d1+d2,p=ftCur(st);
  st.dice=[d1,d2];st.flags={};
  const path=[];
  for(let k=1;k<=steps;k++){
    const pos=(p.pos+k)%FT_N;path.push(pos);
    if(pos===0){p.money+=FT_PASS_START;p.laps++;ftLog(st,`${p.name} kommt am Start vorbei: +${FT_PASS_START} 🪙`);}
    if(FT_CORNERS[pos]&&pos!==0)st.flags[FT_CORNERS[pos]]=true;   // Werkstatt, Markt, Rampe: beim Vorbeikommen oder Landen benutzbar
  }
  p.pos=path[path.length-1];st.phase='land';
  return path;
}
/* Auf dem Feld angekommen */
function ftLand(st){
  if(st.phase!=='land')return;
  const p=ftCur(st),t=st.tiles[p.pos];st.phase='act';st.pending=null;
  if(t.type==='res'){
    if(t.owner<0){st.pending={kind:'buy',tile:t.i};st.phase='buy';}
    else if(t.owner!==p.id){
      const rent=15*t.lvl,pay=Math.min(p.money,rent);p.money-=pay;st.players[t.owner].money+=pay;
      ftLog(st,`${p.name} zahlt ${pay} 🪙 Nutzungsgebühr an ${st.players[t.owner].name}.`);
    }else if(t.lvl<3)st.pending={kind:'upgrade',tile:t.i};
  }else if(t.type==='event')ftEvent(st,p);
  else ftLog(st,`${p.name} steht auf ${ftTileName(t)}.`);
}
function ftTileName(t){return t.type==='res'?FT_RES[t.res].name+'-Feld':({start:'Start',workshop:'Werkstatt',market:'Markt',delivery:'Lieferrampe',event:'Ereignis'}[t.type]||t.type);}
function ftEvent(st,p){
  const roll=Math.floor(st.rng()*6);
  const keys=Object.keys(FT_RES),k=keys[Math.floor(st.rng()*keys.length)];
  let msg;
  if(roll===0){p.money+=80;msg='Förderzuschuss: +80 🪙';}
  else if(roll===1){const pay=Math.min(p.money,60);p.money-=pay;msg=`Maschinenschaden: −${pay} 🪙`;}
  else if(roll===2){p.inv[k]+=2;msg=`Glücklicher Fund: +2 ${FT_RES[k].name}`;}
  else if(roll===3){const have=Object.keys(FT_RES).filter(x=>p.inv[x]>0);if(have.length){const x=have[Math.floor(st.rng()*have.length)];p.inv[x]--;msg=`Diebstahl: −1 ${FT_RES[x].name}`;}else msg='Diebe kommen – aber du hast nichts.';}
  else if(roll===4){let n=0;st.tiles.forEach(t=>{if(t.owner===p.id){p.inv[t.res]+=t.lvl;n+=t.lvl;}});msg=n?`Sonderschicht: alle Felder liefern sofort (${n} Rohstoffe)`:'Sonderschicht – aber du besitzt noch keine Felder.';}
  else{const tax=Math.floor(p.money*0.1);p.money-=tax;msg=`Steuerprüfung: −${tax} 🪙`;}
  st.lastEvent=msg;ftLog(st,`${p.name}: ${msg}`);
}
/* Aktionen */
function ftBuy(st){
  const p=ftCur(st);if(st.phase!=='buy'||!st.pending)return false;
  const t=st.tiles[st.pending.tile];if(p.money<t.price)return false;
  p.money-=t.price;t.owner=p.id;t.lvl=1;ftLog(st,`${p.name} kauft ${ftTileName(t)} für ${t.price} 🪙.`);st.pending=null;st.phase='act';return true;
}
function ftSkipBuy(st){if(st.phase==='buy'){st.pending=null;st.phase='act';return true;}return false;}
function ftUpgradeCost(t){return t.lvl>=1&&t.lvl<3?FT_UPGRADE[t.lvl-1]:0;}
function ftUpgrade(st,tileIdx){
  const p=ftCur(st),t=st.tiles[tileIdx];if(!t||t.owner!==p.id||t.lvl>=3)return false;
  const c=ftUpgradeCost(t);if(p.money<c)return false;
  p.money-=c;t.lvl++;ftLog(st,`${p.name} baut ${ftTileName(t)} aus (Stufe ${t.lvl}).`);
  if(st.pending&&st.pending.kind==='upgrade')st.pending=null;return true;
}
function ftCanCraft(p,key){const r=FT_RECIPES[key];return Object.keys(r.need).every(k=>p.inv[k]>=r.need[k]);}
function ftCraft(st,key){
  const p=ftCur(st);if(!st.flags.workshop&&!(st.tiles[p.pos].type==='workshop'))return false;
  if(!FT_RECIPES[key]||!ftCanCraft(p,key))return false;
  Object.keys(FT_RECIPES[key].need).forEach(k=>{p.inv[k]-=FT_RECIPES[key].need[k];});p.parts[key]++;
  ftLog(st,`${p.name} stellt ${FT_RECIPES[key].name} her.`);return true;
}
function ftDeliver(st){
  const p=ftCur(st);if(!st.flags.delivery&&st.tiles[p.pos].type!=='delivery')return 0;
  let n=0;['plate','cable','frame'].forEach(k=>{while(p.parts[k]>0&&p.delivered[k]<FT_GOAL){p.parts[k]--;p.delivered[k]++;n++;}});
  if(n){ftLog(st,`${p.name} liefert ${n} Bauteil${n===1?'':'e'} an die Rampe (${ftDeliveredCount(p)}/${FT_GOAL*3}).`);if(ftCanWin(p)){st.winner=p.id;st.over=true;st.phase='over';ftLog(st,`🏆 ${p.name} vollendet den Weltraum-Aufzug!`);}}
  return n;
}
function ftDeliveredCount(p){return p.delivered.plate+p.delivered.cable+p.delivered.frame;}
function ftSell(st,res,n){
  const p=ftCur(st);if(!st.flags.market&&st.tiles[p.pos].type!=='market')return 0;
  n=Math.min(n||1,p.inv[res]||0);if(n<=0)return 0;p.inv[res]-=n;p.money+=n*FT_SELL_PRICE;ftLog(st,`${p.name} verkauft ${n} ${FT_RES[res].name} für ${n*FT_SELL_PRICE} 🪙.`);return n;
}
/* Ende des Zuges; nach der letzten Runde produzieren alle Felder */
function ftEndTurn(st){
  if(st.over)return;
  st.phase='roll';st.flags={};st.pending=null;
  st.cur=(st.cur+1)%st.players.length;
  if(st.cur===0){
    st.tiles.forEach(t=>{if(t.type==='res'&&t.owner>=0)st.players[t.owner].inv[t.res]+=t.lvl;});
    st.round++;
    if(st.round>FT_MAX_ROUNDS){ // Zeitlimit: die meisten gelieferten Teile, dann Geld
      st.over=true;st.phase='over';
      const sorted=st.players.slice().sort((a,b)=>ftDeliveredCount(b)-ftDeliveredCount(a)||b.money-a.money);st.winner=sorted[0].id;ftLog(st,`Zeitlimit: ${sorted[0].name} liegt vorn.`);
    }
  }
}

/* ── Computer-Spieler: wählt Aktionen nach Landung (Kaufen, Ausbauen, Herstellen, Abliefern, Verkaufen) ── */
function ftNeeded(p){const need={};['plate','cable','frame'].forEach(k=>{need[k]=Math.max(0,FT_GOAL-p.delivered[k]-p.parts[k]);});return need;}
function ftBotActions(st){
  const p=ftCur(st);
  if(st.phase==='buy'&&st.pending){
    const t=st.tiles[st.pending.tile];
    const wanted=ftWantedRes(p);
    const reserve=t.price>=100?110:80;
    if(p.money>=t.price+reserve&&(wanted[t.res]||p.money>t.price+260))ftBuy(st);else ftSkipBuy(st);
  }
  // Ausbauen, wenn reich genug
  for(let g=0;g<6;g++){
    const mine=st.tiles.filter(t=>t.owner===p.id&&t.lvl<3&&ftWantedRes(p)[t.res]).sort((a,b)=>ftUpgradeCost(a)-ftUpgradeCost(b));
    if(mine.length&&p.money>=ftUpgradeCost(mine[0])+120)ftUpgrade(st,mine[0].i);else break;
  }
  // Herstellen
  if(st.flags.workshop||st.tiles[p.pos].type==='workshop'){
    for(let g=0;g<12;g++){
      const need=ftNeeded(p),opts=Object.keys(FT_RECIPES).filter(k=>need[k]>0&&ftCanCraft(p,k)).sort((a,b)=>need[b]-need[a]);
      if(!opts.length)break;ftCraft(st,opts[0]);
    }
  }
  if(st.flags.delivery||st.tiles[p.pos].type==='delivery')ftDeliver(st);
  // Verkaufen, wenn knapp bei Kasse
  if((st.flags.market||st.tiles[p.pos].type==='market')&&p.money<120){
    const spare=Object.keys(FT_RES).filter(k=>!ftWantedRes(p)[k]&&p.inv[k]>0);
    spare.forEach(k=>ftSell(st,k,p.inv[k]));
  }
}
/* Welche Rohstoffe braucht der Spieler noch für die offenen Bauteile? */
function ftWantedRes(p){
  const need=ftNeeded(p),w={};
  Object.keys(FT_RECIPES).forEach(k=>{if(need[k]>0)Object.keys(FT_RECIPES[k].need).forEach(r=>{if(p.inv[r]<FT_RECIPES[k].need[r]*need[k])w[r]=true;});});
  return w;
}
/* Komplette Zug eines Computer-Spielers ohne Animation (für Tests und schnelles Spielen) */
function ftPlayBotTurn(st){
  if(st.over)return;
  ftRoll(st);ftLand(st);ftBotActions(st);
  if(!st.over)ftEndTurn(st);
}

/* ══ 3D-Darstellung (WebGL, flach schattierte Klötzchen) ══ */
const FT_SP=1.3;                                  // Abstand der Felder
function ftTilePos(i){
  let x,z;
  if(i<8){x=-4+i;z=4;}else if(i<16){x=4;z=4-(i-8);}else if(i<24){x=4-(i-16);z=-4;}else{x=-4;z=-4+(i-24);}
  return [x*FT_SP,z*FT_SP];
}
/* kleine Matrix-Helfer (spaltenweise) */
const M4={
  id(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);},
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;},
  look(e,c,u){let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];const zl=Math.hypot(zx,zy,zz);zx/=zl;zy/=zl;zz/=zl;
    let xx=u[1]*zz-u[2]*zy,xy=u[2]*zx-u[0]*zz,xz=u[0]*zy-u[1]*zx;const xl=Math.hypot(xx,xy,xz);xx/=xl;xy/=xl;xz/=xl;
    const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
    return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]);},
  model(x,y,z,sx,sy,sz,ry,rx,rz){
    const cy=Math.cos(ry||0),sy_=Math.sin(ry||0),cx=Math.cos(rx||0),sx_=Math.sin(rx||0),cz=Math.cos(rz||0),sz_=Math.sin(rz||0);
    // R = Ry * Rx * Rz, danach Skalierung (zuerst) und Verschiebung
    const r00=cy*cz+sy_*sx_*sz_,r01=-cy*sz_+sy_*sx_*cz,r02=sy_*cx,r10=cx*sz_,r11=cx*cz,r12=-sx_,r20=-sy_*cz+cy*sx_*sz_,r21=sy_*sz_+cy*sx_*cz,r22=cy*cx;
    return new Float32Array([r00*sx,r10*sx,r20*sx,0,r01*sy,r11*sy,r21*sy,0,r02*sz,r12*sz,r22*sz,0,x,y,z,1]);}
};
function ftHex(c){const n=parseInt(c.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];}
function ftMesh(gl,pos,norm,idx){
  const mk=(t,d,tgt)=>{const b=gl.createBuffer();gl.bindBuffer(tgt,b);gl.bufferData(tgt,d,gl.STATIC_DRAW);return b;};
  return {p:mk('p',new Float32Array(pos),gl.ARRAY_BUFFER),n:mk('n',new Float32Array(norm),gl.ARRAY_BUFFER),i:mk('i',new Uint16Array(idx),gl.ELEMENT_ARRAY_BUFFER),count:idx.length};
}
function ftCubeData(){
  const F=[[[0,0,1],[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,0,-1],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]],[[1,0,0],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],
    [[-1,0,0],[[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],[[0,1,0],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]]];
  const p=[],n=[],i=[];F.forEach(([nm,vs],k)=>{vs.forEach(v=>{p.push(...v);n.push(...nm);});i.push(k*4,k*4+1,k*4+2,k*4,k*4+2,k*4+3);});
  return {p,n,i};
}
function ftCylData(seg){
  const p=[],n=[],idx=[];
  for(let s=0;s<seg;s++){const a=s/seg*Math.PI*2,c=Math.cos(a)*0.5,d=Math.sin(a)*0.5;p.push(c,-0.5,d,c,0.5,d);n.push(c*2,0,d*2,c*2,0,d*2);}
  for(let s=0;s<seg;s++){const a=s*2,b=((s+1)%seg)*2;idx.push(a,b,a+1,a+1,b,b+1);}
  const base=p.length/3;p.push(0,0.5,0);n.push(0,1,0);for(let s=0;s<seg;s++){const a=s/seg*Math.PI*2;p.push(Math.cos(a)*0.5,0.5,Math.sin(a)*0.5);n.push(0,1,0);}
  for(let s=0;s<seg;s++)idx.push(base,base+1+((s+1)%seg),base+1+s);
  const b2=p.length/3;p.push(0,-0.5,0);n.push(0,-1,0);for(let s=0;s<seg;s++){const a=s/seg*Math.PI*2;p.push(Math.cos(a)*0.5,-0.5,Math.sin(a)*0.5);n.push(0,-1,0);}
  for(let s=0;s<seg;s++)idx.push(b2,b2+1+s,b2+1+((s+1)%seg));
  return {p,n,i:idx};
}
function ftSphereData(la,lo){
  const p=[],n=[],idx=[];
  for(let y=0;y<=la;y++){const t=y/la*Math.PI;for(let x=0;x<=lo;x++){const a=x/lo*Math.PI*2,nx=Math.sin(t)*Math.cos(a),ny=Math.cos(t),nz=Math.sin(t)*Math.sin(a);p.push(nx*0.5,ny*0.5,nz*0.5);n.push(nx,ny,nz);}}
  for(let y=0;y<la;y++)for(let x=0;x<lo;x++){const a=y*(lo+1)+x,b=a+lo+1;idx.push(a,b,a+1,a+1,b,b+1);}
  return {p,n,i:idx};
}
const FT_SHADOW=1024;
/* Hauptdurchgang: Beleuchtung mit Glanz, Schatten (Shadow-Map mit weichem Rand), Nebel */
const FT_VS='attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform mat4 uM;varying vec3 vN;varying vec3 vW;void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=normalize((uM*vec4(aN,0.0)).xyz);gl_Position=uVP*w;}';
const FT_FS='precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uC;uniform float uA;uniform float uGlow;uniform float uSpec;uniform vec3 uEye;uniform mat4 uLVP;uniform sampler2D uShadow;uniform float uShadowOn;'
 +'float unpack(vec4 c){return dot(c,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));}'
 +'float shadowAt(vec2 uv,float z,float bias){return (z-bias>unpack(texture2D(uShadow,uv)))?0.0:1.0;}'
 +'void main(){vec3 N=normalize(vN);vec3 L=normalize(vec3(0.45,0.9,0.35));float d=max(dot(N,L),0.0);float hemi=0.5+0.5*N.y;'
 +'float lit=1.0;if(uShadowOn>0.5){vec4 sp=uLVP*vec4(vW,1.0);vec3 sc=sp.xyz*0.5+0.5;if(sc.x>0.0&&sc.x<1.0&&sc.y>0.0&&sc.y<1.0&&sc.z<1.0){float bias=0.0035;float px=1.0/'+FT_SHADOW+'.0;lit=0.0;for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){lit+=shadowAt(sc.xy+vec2(float(i),float(j))*px*1.3,sc.z,bias);}}lit/=9.0;}}'
 +'vec3 V=normalize(uEye-vW);vec3 H=normalize(L+V);float spec=pow(max(dot(N,H),0.0),36.0)*uSpec*lit;'
 +'vec3 col=uC*(0.30+0.34*hemi+0.62*d*(0.35+0.65*lit))+vec3(spec)+uC*uGlow;'
 +'float dist=length(vW-uEye);float fog=clamp((dist-24.0)/34.0,0.0,0.85);vec3 fc=vec3(0.36,0.47,0.66);col=mix(col,fc,fog);gl_FragColor=vec4(col,uA);}';
/* Schatten-Durchgang: schreibt die Tiefe aus Sicht der Sonne als Farbe */
const FT_VS_D='attribute vec3 aP;uniform mat4 uLVP;uniform mat4 uM;varying float vD;void main(){vec4 p=uLVP*uM*vec4(aP,1.0);vD=p.z*0.5+0.5;gl_Position=p;}';
const FT_FS_D='precision highp float;varying float vD;vec4 pack(float d){vec4 enc=vec4(1.0,255.0,65025.0,16581375.0)*d;enc=fract(enc);enc-=enc.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);return enc;}void main(){gl_FragColor=pack(clamp(vD,0.0,0.99999));}';
let ftGen=0;   // zählt Spiele hoch: alte Zeitgeber eines beendeten oder neu gestarteten Spiels tun nichts mehr
let ft=null,ftG=null,ftRaf=null,ftLast=0,ftA=null,ftBusy=false,ftView='setup',ftMsg='',ftNBots=1,ftCam={yaw:0.55,pitch:0.85,dist:19},ftDrag=null,ftTokens=[],ftDiceShow=null,ftDiceT=0;

M4.ortho=function(l,r,b,t,n,f){const o=new Float32Array(16);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o;};

function ftInitGL(canvas){
  const gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false})||canvas.getContext('experimental-webgl');
  if(!gl)return null;
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){throw new Error(gl.getShaderInfoLog(s));}return s;};
  const mkProg=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;};
  const pm=mkProg(FT_VS,FT_FS),pd=mkProg(FT_VS_D,FT_FS_D);
  const U=(p,n)=>gl.getUniformLocation(p,n),A=(p,n)=>gl.getAttribLocation(p,n);
  const cube=ftCubeData(),cyl=ftCylData(20),sph=ftSphereData(8,12);
  const g={gl,canvas,pass:'main',cube:ftMesh(gl,cube.p,cube.n,cube.i),cyl:ftMesh(gl,cyl.p,cyl.n,cyl.i),sph:ftMesh(gl,sph.p,sph.n,sph.i),vp:null,lvp:null,shadowOk:false,
    main:{prog:pm,p:A(pm,'aP'),n:A(pm,'aN'),vp:U(pm,'uVP'),m:U(pm,'uM'),c:U(pm,'uC'),a:U(pm,'uA'),glow:U(pm,'uGlow'),spec:U(pm,'uSpec'),eye:U(pm,'uEye'),lvp:U(pm,'uLVP'),shadow:U(pm,'uShadow'),on:U(pm,'uShadowOn')},
    depth:{prog:pd,p:A(pd,'aP'),m:U(pd,'uM'),lvp:U(pd,'uLVP')}};
  // Schatten-Puffer (RGBA-Textur + Tiefenpuffer)
  try{
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,FT_SHADOW,FT_SHADOW,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    const rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,FT_SHADOW,FT_SHADOW);
    const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
    g.shadowOk=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);g.fb=fb;g.tex=tex;
  }catch(e){g.shadowOk=false;}
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  return g;
}
function ftDrawMesh(g,mesh,m,color,alpha,glow,spec){
  const gl=g.gl,depth=g.pass==='depth';
  if(depth&&alpha!=null&&alpha<0.99)return;               // durchsichtige Dinge werfen keinen Schatten
  const L=depth?g.depth:g.main;
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.p);gl.enableVertexAttribArray(L.p);gl.vertexAttribPointer(L.p,3,gl.FLOAT,false,0,0);
  if(!depth){gl.bindBuffer(gl.ARRAY_BUFFER,mesh.n);gl.enableVertexAttribArray(L.n);gl.vertexAttribPointer(L.n,3,gl.FLOAT,false,0,0);}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.i);
  gl.uniformMatrix4fv(L.m,false,m);
  if(!depth){gl.uniform3fv(L.c,ftHex(color));gl.uniform1f(L.a,alpha==null?1:alpha);gl.uniform1f(L.glow,glow||0);gl.uniform1f(L.spec,spec==null?0.10:spec);}
  gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
}
const ftBox=(g,x,y,z,sx,sy,sz,c,ry,glow,a,spec)=>ftDrawMesh(g,g.cube,M4.model(x,y,z,sx,sy,sz,ry||0),c,a,glow,spec);
const ftCyl=(g,x,y,z,sx,sy,sz,c,glow,spec)=>ftDrawMesh(g,g.cyl,M4.model(x,y,z,sx,sy,sz,0),c,1,glow,spec==null?0.45:spec);
function ftShade(hex,k){const n=parseInt(hex.slice(1),16),r=Math.min(255,Math.round((n>>16)*k)),gg=Math.min(255,Math.round(((n>>8)&255)*k)),b=Math.min(255,Math.round((n&255)*k));return '#'+((1<<24)|(r<<16)|(gg<<8)|b).toString(16).slice(1);}
function ftEye(){
  const c=ftCam,cp=Math.cos(c.pitch),sp=Math.sin(c.pitch);
  return [Math.sin(c.yaw)*cp*c.dist,sp*c.dist,Math.cos(c.yaw)*cp*c.dist];
}
function ftWindows(g,x,y,z,w,h,d,n){for(let i=0;i<n;i++)ftBox(g,x-w/2+w*(i+0.5)/n,y,z+d/2+0.005,w/n*0.45,h,0.02,'#ffe9a0',0,0.9);}
function ftBuilding(g,t,x,z,time){
  const col=FT_COLORS[t.owner],dark=ftShade(col,0.7),res=FT_RES[t.res].color,y0=0.19;
  if(t.lvl>=1){ftBox(g,x-0.25,y0+0.18,z+0.15,0.42,0.36,0.42,col);ftBox(g,x-0.25,y0+0.39,z+0.15,0.5,0.06,0.5,dark);ftCyl(g,x-0.25,y0+0.5,z+0.15,0.14,0.16,0.14,'#8a8f99');}
  if(t.lvl>=2){ftBox(g,x+0.22,y0+0.3,z-0.15,0.4,0.6,0.4,ftShade(col,1.12));ftCyl(g,x+0.22,y0+0.72,z-0.15,0.16,0.3,0.16,'#9aa3b0');ftWindows(g,x+0.22,y0+0.32,z-0.15,0.3,0.1,0.4,3);}
  if(t.lvl>=3){ftBox(g,x-0.05,y0+0.55,z-0.32,0.7,0.5,0.28,dark);ftCyl(g,x-0.28,y0+0.95,z-0.32,0.13,0.5,0.13,'#c5ccd6',0.05);ftWindows(g,x-0.05,y0+0.55,z-0.32,0.55,0.12,0.28,4);ftBox(g,x+0.3,y0+0.9,z+0.3,0.14,0.14,0.14,res,0.25,0.3);}
  else ftBox(g,x+0.32,y0+0.09,z+0.32,0.18,0.18,0.18,res);
}
/* Rauch: weiche, aufsteigende Kugeln über Schornsteinen (durchsichtig, ohne Schatten) */
function ftSmoke(g,time){
  const gl=g.gl;if(g.pass==='depth')return;
  gl.depthMask(false);
  const sources=[];
  ft.tiles.forEach(t=>{if(t.type==='res'&&t.owner>=0&&t.lvl>=2){const [x,z]=ftTilePos(t.i);sources.push([x+0.22,1.12,z-0.15,t.i]);if(t.lvl>=3)sources.push([x-0.28,1.6,z-0.32,t.i+50]);}else if(t.type==='workshop'){const [x,z]=ftTilePos(t.i);sources.push([x+0.25,1.2,z+0.25,t.i]);}});
  sources.push([1.2,2.0,-0.9,99]);
  sources.forEach(s=>{for(let k=0;k<3;k++){const ph=((time*0.35+k/3+s[3]*0.37)%1),sc=0.14+0.32*ph,al=0.42*(1-ph)*(1-ph);
    ftDrawMesh(g,g.sph,M4.model(s[0]+ph*0.5,s[1]+ph*1.3,s[2]+ph*0.2,sc,sc,sc,0),'#e8edf5',al,0.25,0);}});
  gl.depthMask(true);
}
function ftSceneObjects(g,time){
  // Boden und Insel
  ftBox(g,0,-0.55,0,60,0.6,60,'#243247',0,0,1,0);
  ftBox(g,0,-0.12,0,FT_SP*10.6,0.2,FT_SP*10.6,'#34465f',0,0,1,0.05);
  ftBox(g,0,-0.02,0,FT_SP*10.9,0.05,FT_SP*10.9,'#485c78',0,0,1,0.05);
  ftBox(g,0,0.02,0,FT_SP*7.2,0.1,FT_SP*7.2,'#3f7658',0,0,1,0.02);
  // kleine Bäume und Steine auf der Insel
  [[-2.4,1.2],[2.6,1.8],[-2.9,-1.1],[1.9,-2.6],[-1.4,2.7],[3.1,-0.4]].forEach((p,i)=>{const x=p[0]*1.0,z=p[1]*1.0;ftCyl(g,x,0.22,z,0.1,0.34,0.1,'#6b4f3a',0,0.05);ftDrawMesh(g,g.sph,M4.model(x,0.55,z,0.5+((i*3)%3)*0.08,0.5,0.5+((i*3)%3)*0.08,0),'#3f9a5a',1,0,0.05);});
  // Felder
  ft.tiles.forEach(t=>{
    const [x,z]=ftTilePos(t.i);let c='#c9c3b0',sz=1.12;
    if(t.type==='res')c=FT_RES[t.res].color;else if(t.type==='event')c='#e0b04a';else if(t.type==='start')c='#6dd36d';else if(t.type==='workshop')c='#7aa2d8';else if(t.type==='market')c='#d87ab8';else if(t.type==='delivery')c='#f0f0f0';
    if(t.owner>=0)ftBox(g,x,0.03,z,1.24,0.1,1.24,FT_COLORS[t.owner]);
    ftBox(g,x,0.1,z,sz,0.16,sz,ftShade(c,0.82),0,0,1,0.08);                     // Sockel (dunkler)
    ftBox(g,x,0.19,z,sz-0.12,0.03,sz-0.12,ftShade(c,1.12),0,0,1,0.18);           // helle Deckplatte = abgeschrägte Kante
    if(t.type==='res'&&t.owner>=0)ftBuilding(g,t,x,z,time);
    if(t.type==='start'){ftCyl(g,x-0.4,0.65,z-0.4,0.06,1,0.06,'#eeeeee');ftBox(g,x-0.14,1.0,z-0.4,0.5,0.3,0.05,'#ff5252',0,0.1);}
    if(t.type==='workshop'){ftBox(g,x,0.55,z,0.8,0.7,0.8,'#5f7fb0');ftBox(g,x,0.93,z,0.9,0.06,0.9,'#3f5578');ftCyl(g,x+0.25,1.0,z+0.25,0.2,0.4,0.2,'#c9d3e2',0.05);ftBox(g,x-0.2,1.0,z-0.2,0.25,0.15,0.25,'#f0c040');ftWindows(g,x,0.6,z,0.6,0.16,0.8,3);}
    if(t.type==='market'){ftBox(g,x,0.4,z,0.9,0.4,0.7,'#b05f92');ftBox(g,x,0.7,z,1.05,0.1,0.85,'#ffd5ef',0,0.05);ftBox(g,x-0.32,0.34,z+0.36,0.06,0.3,0.06,'#6b3f58');ftBox(g,x+0.32,0.34,z+0.36,0.06,0.3,0.06,'#6b3f58');}
    if(t.type==='delivery'){ftBox(g,x,0.35,z,0.9,0.3,0.9,'#b0b8c4');ftCyl(g,x,0.95,z,0.35,1,0.35,'#eaeef5',0.02,0.6);ftCyl(g,x,1.55,z,0.2,0.3,0.2,'#ff5252',0.1);}
    if(t.type==='event'){ftBox(g,x,0.45,z,0.35,0.4,0.35,'#ffd54f',time,0.2,1,0.6);}
  });
  // Weltraum-Aufzug in der Mitte: wächst mit jedem gelieferten Teil
  ftBox(g,0,0.22,0,2.6,0.3,2.6,'#5b6b80');ftBox(g,0,0.4,0,2.2,0.06,2.2,'#7c8ea6',0,0,1,0.2);
  ftBox(g,-1.3,0.65,1.1,0.9,0.7,0.9,'#7a8ba3');ftBox(g,-1.3,1.02,1.1,1.0,0.06,1.0,'#55647a');ftWindows(g,-1.3,0.7,1.1,0.7,0.14,0.9,3);
  ftCyl(g,1.2,0.95,-0.9,0.5,1.2,0.5,'#8797ab',0,0.5);ftCyl(g,1.2,1.75,-0.9,0.25,0.5,0.25,'#c5ccd6',0.05,0.6);
  let seg=0;ft.players.forEach(p=>{['plate','cable','frame'].forEach(k=>{for(let n=0;n<p.delivered[k];n++){ftBox(g,0,0.6+seg*0.32,0,0.5-seg*0.01,0.3,0.5-seg*0.01,FT_COLORS[p.id],0,0.1,1,0.3);seg++;}});});
  ftCyl(g,0,0.6+seg*0.32+0.15,0,0.06,0.4,0.06,'#f4f4f4',0,0.8);
  ftBox(g,0,0.75+seg*0.32,0,0.14,0.14,0.14,'#ffffff',time,0.8);
  // Figuren
  ftTokens.forEach(tk=>{
    const col=FT_COLORS[tk.id],off=[[-0.25,-0.25],[0.25,-0.25],[-0.25,0.25],[0.25,0.25]][tk.id],y=0.22+tk.y;
    ftCyl(g,tk.x+off[0],y+0.08,tk.z+off[1],0.36,0.16,0.36,ftShade(col,0.75),0,0.6);
    ftCyl(g,tk.x+off[0],y+0.3,tk.z+off[1],0.22,0.32,0.22,col,0.05,0.7);
    ftDrawMesh(g,g.sph,M4.model(tk.x+off[0],y+0.56,tk.z+off[1],0.32,0.32,0.32,0),col,1,0.1,0.9);
  });
  // Würfel
  if(ftDiceShow){[0,1].forEach(k=>{const t=ftDiceT,rx=t*7+k*2,rz=t*6+k,fall=Math.max(0,1-t*1.4),y=0.95+fall*3+Math.abs(Math.sin(t*9+k))*0.5*fall,xx=-0.6+k*1.2;
      ftDrawMesh(g,g.cube,M4.model(xx,y,0.2,0.75,0.75,0.75,t*4,rx,rz),'#ffffff',1,0.05,0.5);});}
}
function ftDrawScene(g,time){
  const gl=g.gl,cv=g.canvas;
  // Sonne: Matrix für die Schatten (Blick von der Lichtrichtung auf das Brett)
  const Ldir=[0.45,0.9,0.35],ll=Math.hypot(...Ldir),lpos=[Ldir[0]/ll*30,Ldir[1]/ll*30,Ldir[2]/ll*30];
  g.lvp=M4.mul(M4.ortho(-17,17,-17,17,1,70),M4.look(lpos,[0,0,0],[0,1,0]));
  if(g.shadowOk){
    g.pass='depth';gl.bindFramebuffer(gl.FRAMEBUFFER,g.fb);gl.viewport(0,0,FT_SHADOW,FT_SHADOW);
    gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);
    gl.useProgram(g.depth.prog);gl.uniformMatrix4fv(g.depth.lvp,false,g.lvp);
    ftSceneObjects(g,time);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.BLEND);
  }
  g.pass='main';gl.viewport(0,0,cv.width,cv.height);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const asp=cv.width/cv.height,eye=ftEye(),V=M4.look(eye,[0,0,0.3],[0,1,0]),P=M4.persp(0.8,asp,0.5,120);
  g.vp=M4.mul(P,V);g.eye=eye;
  gl.useProgram(g.main.prog);
  gl.uniformMatrix4fv(g.main.vp,false,g.vp);gl.uniform3fv(g.main.eye,eye);gl.uniformMatrix4fv(g.main.lvp,false,g.lvp);
  gl.uniform1f(g.main.on,g.shadowOk?1:0);
  if(g.shadowOk){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,g.tex);gl.uniform1i(g.main.shadow,0);}
  ftSceneObjects(g,time);
  // Markierung des aktuellen Feldes (leuchtend, durchsichtig)
  if(!ft.over){const [cx,cz]=ftTilePos(ftCur(ft).pos);const ph=0.45+0.2*Math.sin(time*4);ftBox(g,cx,0.25,cz,1.35,0.03,1.35,FT_COLORS[ft.cur],0,ph,0.85,0);}
  ftSmoke(g,time);
}

/* Beschriftungen (2D über dem 3D-Bild): Symbole der Felder, Namen, Würfelzahl */
function ftProject(g,x,y,z){
  const m=g.vp,w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=0.01)return null;
  const cx=(m[0]*x+m[4]*y+m[8]*z+m[12])/w,cy=(m[1]*x+m[5]*y+m[9]*z+m[13])/w;
  return [(cx*0.5+0.5)*g.canvas.clientWidth,(0.5-cy*0.5)*g.canvas.clientHeight,w];
}
function ftDrawLabels(g,ctx,time){
  const cv=ctx.canvas,dpr=cv.width/cv.clientWidth;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cv.clientWidth,cv.clientHeight);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ft.tiles.forEach(t=>{
    const [x,z]=ftTilePos(t.i);
    let label=null,sub=null;
    if(t.type==='res'){label=FT_RES[t.res].icon;sub=t.owner>=0?'★'.repeat(t.lvl):t.price;}
    else label={start:'🏁',workshop:'🛠️',market:'💱',delivery:'🚀',event:'❔'}[t.type];
    const p=ftProject(g,x,0.75,z);if(!p)return;
    const s=Math.max(11,Math.min(26,190/p[2]));
    ctx.font=Math.round(s)+'px sans-serif';ctx.fillText(label,p[0],p[1]);
    if(sub!=null){ctx.font='bold '+Math.round(s*0.5)+'px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,0.65)';ctx.fillStyle=t.owner>=0?FT_COLORS[t.owner]:'#ffe082';ctx.strokeText(sub,p[0],p[1]+s*0.8);ctx.fillText(sub,p[0],p[1]+s*0.8);ctx.fillStyle='#fff';}
  });
  ftTokens.forEach(tk=>{const p=ftProject(g,tk.x,1.35+tk.y,tk.z);if(!p)return;ctx.font='bold 12px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,0.7)';ctx.fillStyle='#fff';ctx.strokeText(ft.players[tk.id].name,p[0],p[1]);ctx.fillText(ft.players[tk.id].name,p[0],p[1]);});
  if(ftDiceShow&&ftDiceT>0.75){const p=ftProject(g,0,2.4,0.2);if(p){ctx.font='bold 34px sans-serif';ctx.lineWidth=5;ctx.strokeStyle='rgba(0,0,0,0.7)';const txt=ftDiceShow[0]+' + '+ftDiceShow[1]+' = '+(ftDiceShow[0]+ftDiceShow[1]);ctx.strokeText(txt,p[0],p[1]);ctx.fillStyle='#fff';ctx.fillText(txt,p[0],p[1]);}}
}

/* ══ Spielablauf mit Animationen und Oberfläche ══ */
function ftEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function ftRoot(){return document.getElementById('ft-root');}
function ftActive(){const s=document.getElementById('screen-ft');return !!s&&s.classList.contains('active');}
const FT_KEY='zf_ft';
function ftAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function ftProfAll(){try{const o=JSON.parse(localStorage.getItem(FT_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function ftProf(){const k=ftAccount().toLowerCase()||'_gast',p=ftProfAll()[k]||{};return {wins:p.wins|0,games:p.games|0,coinsDay:p.coinsDay|0,date:p.date||''};}
function ftSaveProf(p){const all=ftProfAll();all[ftAccount().toLowerCase()||'_gast']=p;try{localStorage.setItem(FT_KEY,JSON.stringify(all));}catch(e){}}

function ftInit(){
  if(ftRaf){cancelAnimationFrame(ftRaf);ftRaf=null;}
  ftGen++;ft=null;ftView='setup';ftMsg='';ftBusy=false;ftA=null;ftRenderView();
}
function ftStartGame(){
  ftGen++;
  ft=ftNew(ftNBots+1,null,1);ftView='game';ftBusy=false;ftA=null;ftDiceShow=null;
  ftTokens=ft.players.map(p=>({id:p.id,pos:0,x:ftTilePos(0)[0],z:ftTilePos(0)[1],y:0}));
  ftRenderView();
  ftLast=0;ftRaf=requestAnimationFrame(ftLoop);
  ftNextStep();
}
function ftRestart(){ftInit();}
function ftRenderView(){
  const root=ftRoot();if(!root)return;
  if(ftView==='setup'){
    const p=ftProf();
    root.innerHTML=`<div class="lrn-card" style="text-align:center;padding:26px 18px">
      <div style="font-size:44px">🏭</div><div style="font-size:22px;font-weight:800;margin:6px 0">Fabrik-Tycoon</div>
      <div style="font-size:13px;color:var(--text-3);max-width:520px;margin:0 auto 16px;line-height:1.6">Würfle um das 3D-Brett, kaufe Rohstoff-Felder und baue sie aus. Stelle in der <b>Werkstatt</b> Bauteile her und liefere sie an der <b>Rampe</b> ab.
        Wer zuerst <b>je 3 Stahlplatten, Kabelbündel und Rahmen</b> geliefert hat, vollendet den Weltraum-Aufzug in der Mitte und gewinnt.</div>
      <div class="lrn-label">Gegner</div>
      <div class="lrn-chips" style="justify-content:center;margin-bottom:16px">${[1,2,3].map(n=>`<button class="lrn-chip${ftNBots===n?' active':''}" onclick="ftSetBots(${n})">${n} Computer-Spieler</button>`).join('')}</div>
      <button class="lrn-btn" style="padding:12px 28px;font-size:16px" onclick="ftStartGame()">▶ Spiel starten</button>
      <div style="font-size:12px;color:var(--text-3);margin-top:14px">Bisher: ${p.wins} Siege in ${p.games} Spielen · 🪙 10 AppHub-Coins pro Sieg (höchstens 30 pro Tag)</div></div>`;
    return;
  }
  root.innerHTML=`<div class="ft-stage"><canvas id="ft-gl"></canvas><canvas id="ft-lbl"></canvas><div id="ft-over"></div>
      <div class="ft-cam"><button class="lrn-btn ghost" onclick="ftCamTurn(-0.4)" title="Links drehen">⟲</button><button class="lrn-btn ghost" onclick="ftCamTurn(0.4)" title="Rechts drehen">⟳</button><button class="lrn-btn ghost" onclick="ftCamZoom(-2)" title="Näher">＋</button><button class="lrn-btn ghost" onclick="ftCamZoom(2)" title="Weiter weg">－</button></div></div>
    <div id="ft-players" class="ft-players"></div>
    <div class="ft-bottom"><div id="ft-actions" class="lrn-card"></div><div id="ft-log" class="lrn-card"></div></div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:8px">Ziehen = Kamera drehen · Mausrad = Zoom · Werkstatt, Markt und Rampe kannst du beim Vorbeikommen oder Landen benutzen</div>`;
  const cv=document.getElementById('ft-gl');
  try{ftG=ftInitGL(cv);}catch(e){ftG=null;ftMsg='3D konnte nicht gestartet werden: '+e.message;}
  if(!ftG){document.querySelector('.ft-stage').innerHTML=`<div class="lrn-card" style="text-align:center;padding:30px">⚠️ ${ftEsc(ftMsg||'Dein Browser unterstützt WebGL nicht.')}</div>`;return;}
  ftResize();
  cv.onpointerdown=e=>{ftDrag={x:e.clientX,y:e.clientY,yaw:ftCam.yaw,pitch:ftCam.pitch};try{cv.setPointerCapture(e.pointerId);}catch(_){}};
  cv.onpointermove=e=>{if(!ftDrag)return;ftCam.yaw=ftDrag.yaw-(e.clientX-ftDrag.x)*0.008;ftCam.pitch=Math.max(0.25,Math.min(1.35,ftDrag.pitch+(e.clientY-ftDrag.y)*0.006));};
  cv.onpointerup=cv.onpointercancel=()=>{ftDrag=null;};
  cv.onwheel=e=>{e.preventDefault();ftCamZoom(e.deltaY>0?1.2:-1.2);};
  ftUpdatePanels();
}
function ftSetBots(n){ftNBots=n;ftRenderView();}
function ftCamTurn(d){ftCam.yaw+=d;}
function ftCamZoom(d){ftCam.dist=Math.max(9,Math.min(30,ftCam.dist+d));}
function ftResize(){
  const cv=document.getElementById('ft-gl'),lb=document.getElementById('ft-lbl');if(!cv||!lb)return;
  const stage=cv.parentNode,w=stage.clientWidth||800,h=Math.round(w*(w<560?0.95:0.62)),dpr=Math.min(2,window.devicePixelRatio||1);
  stage.style.height=h+'px';
  [cv,lb].forEach(c=>{c.style.width=w+'px';c.style.height=h+'px';c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);});
}
window.addEventListener('resize',()=>{if(ftView==='game')ftResize();});

/* ── Animationen ── */
function ftLoop(ts){
  if(!ftActive()||!ftG||ftView!=='game'){ftRaf=null;return;}
  if(!ftLast)ftLast=ts;const dt=Math.min(0.1,(ts-ftLast)/1000);ftLast=ts;
  if(ftA){ftA.t+=dt;ftA.update(dt);if(ftA&&ftA.t>=ftA.dur){const d=ftA.done;ftA=null;if(d)d();}}
  if(ftDiceShow)ftDiceT+=dt;
  const time=ts/1000;
  ftDrawScene(ftG,time);
  const lb=document.getElementById('ft-lbl');if(lb)ftDrawLabels(ftG,lb.getContext('2d'),time);
  ftRaf=requestAnimationFrame(ftLoop);
}
/* Ablauf eines Zuges: Würfeln -> Ziehen -> Landen -> Aktionen (Mensch klickt, Computer entscheidet) */
function ftNextStep(){
  if(!ft||ftView!=='game')return;
  if(ft.over){ftShowEnd();ftUpdatePanels();return;}
  const p=ftCur(ft),gen=ftGen;ftUpdatePanels();
  if(p.bot){setTimeout(()=>{if(gen===ftGen&&ft&&!ft.over&&ftCur(ft)===p)ftDoRoll();},700);}
}
function ftDoRoll(){
  if(!ft||ft.phase!=='roll'||ftBusy||ft.over)return;
  ftBusy=true;const p=ftCur(ft),gen=ftGen;
  const path=ftRoll(ft);ftDiceShow=ft.dice.slice();ftDiceT=0;ftUpdatePanels();
  ftA={t:0,dur:1.0,update(){},done(){
    if(gen!==ftGen)return;
    ftDiceShow=null;
    // Figur hüpfen lassen: Feld für Feld
    const tk=ftTokens[p.id];let i=0;
    const hop=()=>{
      if(gen!==ftGen)return;
      if(i>=path.length){tk.y=0;ftBusy=false;ftLand(ft);ftAfterLand();return;}
      const from=[tk.x,tk.z],to=ftTilePos(path[i]);
      ftA={t:0,dur:0.2,update(){const k=Math.min(1,this.t/this.dur);tk.x=from[0]+(to[0]-from[0])*k;tk.z=from[1]+(to[1]-from[1])*k;tk.y=Math.sin(k*Math.PI)*0.45;},done(){tk.x=to[0];tk.z=to[1];tk.y=0;i++;hop();}};
    };
    ftBusy=true;hop();
  }};
}
function ftAfterLand(){
  ftBusy=false;const p=ftCur(ft),gen=ftGen;ftUpdatePanels();
  if(p.bot){
    setTimeout(()=>{
      if(gen!==ftGen||!ft||ft.over)return;
      ftBotActions(ft);ftUpdatePanels();
      if(ft.over){ftNextStep();return;}
      setTimeout(()=>{if(gen===ftGen&&ft&&!ft.over){ftEndTurnUi();}},650);
    },600);
  }
}
function ftEndTurnUi(){if(!ft||ftBusy)return;ftEndTurn(ft);ftNextStep();}
/* Aktionen des Menschen */
function ftHuman(){return ft&&!ft.over&&!ftBusy&&!ftCur(ft).bot;}
function ftBtnRoll(){if(ftHuman()&&ft.phase==='roll')ftDoRoll();}
function ftBtnBuy(){if(ftHuman()&&ftBuy(ft)){ftUpdatePanels();}}
function ftBtnSkip(){if(ftHuman()&&ftSkipBuy(ft))ftUpdatePanels();}
function ftBtnUpgrade(i){if(ftHuman()&&ftUpgrade(ft,i))ftUpdatePanels();}
function ftBtnCraft(k){if(ftHuman()&&ftCraft(ft,k))ftUpdatePanels();}
function ftBtnDeliver(){if(ftHuman()){ftDeliver(ft);ftUpdatePanels();if(ft.over)ftNextStep();}}
function ftBtnSell(r){if(ftHuman()&&ftSell(ft,r,99))ftUpdatePanels();}
function ftBtnEnd(){if(ftHuman()&&(ft.phase==='act'))ftEndTurnUi();}

function ftUpdatePanels(){
  if(!ft)return;
  const pl=document.getElementById('ft-players'),ac=document.getElementById('ft-actions'),lg=document.getElementById('ft-log');
  if(pl)pl.innerHTML=ft.players.map(p=>{
    const inv=Object.keys(FT_RES).filter(k=>p.inv[k]>0).map(k=>`<span title="${FT_RES[k].name}">${FT_RES[k].icon}${p.inv[k]}</span>`).join(' ');
    const parts=Object.keys(FT_RECIPES).map(k=>`<span title="${FT_RECIPES[k].name}: geliefert/im Lager">${FT_RECIPES[k].icon}${p.delivered[k]}/${FT_GOAL}${p.parts[k]?'+'+p.parts[k]:''}</span>`).join(' ');
    return `<div class="ft-pcard${p.id===ft.cur&&!ft.over?' cur':''}" style="border-color:${p.color}"><div style="display:flex;align-items:center;gap:6px"><i style="width:12px;height:12px;border-radius:50%;background:${p.color};display:inline-block"></i><b>${ftEsc(p.name)}</b><span style="margin-left:auto;font-weight:800">${p.money} 🪙</span></div>
      <div style="font-size:12px;margin-top:4px;min-height:16px;color:var(--text-2)">${inv||'<span style="color:var(--text-3)">keine Rohstoffe</span>'}</div><div style="font-size:12px;margin-top:2px">${parts}</div></div>`;}).join('');
  if(lg)lg.innerHTML=`<div class="lrn-label">Verlauf · Runde ${Math.min(ft.round,FT_MAX_ROUNDS)}/${FT_MAX_ROUNDS}</div>`+ft.log.slice(0,8).map(l=>`<div style="font-size:12px;color:var(--text-2);margin-bottom:3px">${ftEsc(l)}</div>`).join('');
  if(!ac)return;
  const p=ftCur(ft),human=!p.bot&&!ft.over&&!ftBusy;
  let html=`<div class="lrn-label">${ft.over?'Spiel beendet':(p.bot?ftEsc(p.name)+' ist dran …':'Du bist dran')}</div>`;
  if(human){
    if(ft.phase==='roll')html+=`<button class="lrn-btn" style="width:100%;padding:14px;font-size:16px" onclick="ftBtnRoll()">🎲 Würfeln</button>`;
    else if(ft.phase==='buy'){const t=ft.tiles[ft.pending.tile];html+=`<div style="font-size:13px;margin-bottom:8px"><b>${FT_RES[t.res].icon} ${FT_RES[t.res].name}-Feld</b> ist frei: liefert jede Runde 1 ${FT_RES[t.res].name} (später mehr).</div><div class="lrn-two" style="margin-top:0"><button class="lrn-btn ghost" onclick="ftBtnSkip()">Nicht kaufen</button><button class="lrn-btn ${p.money<t.price?'poor':''}" ${p.money<t.price?'disabled':''} onclick="ftBtnBuy()">Kaufen ${t.price} 🪙</button></div>`;}
    else if(ft.phase==='act'){
      const here=ft.tiles[p.pos],btns=[];
      if(here.type==='res'&&here.owner===p.id&&here.lvl<3){const c=ftUpgradeCost(here);btns.push(`<button class="lrn-btn ${p.money<c?'poor':''}" ${p.money<c?'disabled':''} onclick="ftBtnUpgrade(${here.i})">🔧 Ausbauen (Stufe ${here.lvl+1}) ${c} 🪙</button>`);}
      if(ft.flags.workshop||here.type==='workshop')Object.keys(FT_RECIPES).forEach(k=>{const r=FT_RECIPES[k],ok=ftCanCraft(p,k),need=Object.keys(r.need).map(x=>r.need[x]+FT_RES[x].icon).join(' ');btns.push(`<button class="lrn-btn ${ok?'':'poor'}" ${ok?'':'disabled'} onclick="ftBtnCraft('${k}')">${r.icon} ${r.name} <small>${need}</small></button>`);});
      if(ft.flags.delivery||here.type==='delivery'){const n=['plate','cable','frame'].reduce((a,k)=>a+Math.min(p.parts[k],FT_GOAL-p.delivered[k]),0);btns.push(`<button class="lrn-btn ${n?'':'poor'}" ${n?'':'disabled'} onclick="ftBtnDeliver()">🚀 ${n} Teil${n===1?'':'e'} abliefern</button>`);}
      if(ft.flags.market||here.type==='market'){Object.keys(FT_RES).filter(k=>p.inv[k]>0).forEach(k=>btns.push(`<button class="lrn-btn ghost" onclick="ftBtnSell('${k}')">${FT_RES[k].icon} ${p.inv[k]} verkaufen +${p.inv[k]*FT_SELL_PRICE} 🪙</button>`));}
      html+=`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${btns.join('')||'<span style="font-size:13px;color:var(--text-3)">Hier gibt es nichts zu tun.</span>'}</div><button class="lrn-btn" style="width:100%" onclick="ftBtnEnd()">Zug beenden ➜</button>`;
    }
  }else if(!ft.over)html+=`<div style="font-size:13px;color:var(--text-3)">${p.bot?'Der Computer überlegt …':'…'}</div>`;
  ac.innerHTML=html;
}
function ftShowEnd(){
  const over=document.getElementById('ft-over');if(!over||over.innerHTML)return;
  const w=ft.players[ft.winner],human=!w.bot;
  let coins=0;
  if(human&&ftCanWin(w)||human){
    const pf=ftProf(),today=new Date().toDateString();if(pf.date!==today){pf.date=today;pf.coinsDay=0;}
    pf.wins++;coins=Math.min(10,30-pf.coinsDay);pf.coinsDay+=Math.max(0,coins);
    try{const name=ftAccount();if(coins>0&&name&&typeof zcAddCoins==='function'){zcAddCoins(name,coins);if(typeof smSave==='function')smSave('zentrale');}else coins=0;}catch(e){coins=0;}
    pf.games++;ftSaveProf(pf);
  }else{const pf=ftProf();pf.games++;ftSaveProf(pf);}
  over.innerHTML=`<div class="ft-endcard"><div style="font-size:46px">${human?'🏆':'🤖'}</div><div style="font-size:22px;font-weight:800">${human?'Du hast gewonnen!':ftEsc(w.name)+' gewinnt'}</div>
    <div style="font-size:13px;margin:6px 0 12px;opacity:.9">${ftCanWin(w)?'Der Weltraum-Aufzug ist fertig.':'Zeitlimit erreicht – die meisten gelieferten Teile zählen.'}${coins?'<br>🪙 +'+coins+' AppHub-Coins':''}</div>
    <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="ftStartGame()">Nochmal</button><button class="lrn-btn ghost" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)" onclick="ftRestart()">Menü</button></div></div>`;
}
document.addEventListener('visibilitychange',()=>{});
