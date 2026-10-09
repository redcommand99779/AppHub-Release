/* ══════════════════════════════════
   VERLIES – rundenbasierter Roguelike-Dungeon. Jede Etage wird aus einem Startwert (Seed) zufällig erzeugt: Räume und Gänge, Gegner, Beute, Treppe nach unten.
   Du ziehst, dann ziehen die Gegner. Sicht mit Nebel des Krieges (was du gesehen hast, bleibt auf der Karte, Gegner siehst du nur im Blickfeld).
   Ausrüstung mit zufälligen Werten (Waffen, Rüstungen), Tränke, Erfahrung und Stufen. Alle 5 Etagen wartet ein Boss.
   Stirbst du, ist der Durchgang vorbei – aber du bekommst Seelen (nach Tiefe, Siegen und Bossen) und kaufst damit dauerhafte Stärkungen für alle weiteren Durchgänge.
   Ein laufender Durchgang wird nach jedem Zug gespeichert. Spielstand je Konto: zf_verlies { souls, up:{hp,atk,pot}, best:{depth,kills,gold}, runs, run:{…} }.
   Orientierung: „Erkunden“ (X) läuft zum nächsten Feld am Rand des Bekannten (dort, wo noch Unbekanntes angrenzt), „Treppe“ (T) läuft zur Treppe, sobald du sie gesehen hast;
   beides stoppt, sobald ein Gegner in Sicht kommt.
   Händler: ab Etage 2 steht manchmal ein Händler (🛒) in einem Raum; ein Schritt auf ihn öffnet den Laden (Heiltrank, Vollheilung, Waffe, Rüstung gegen Gold, kostet keinen Zug).
   AppHub-Coins: einmalige Belohnungen für Meilensteine (tiefste Etage, erster/dritter Boss) und ein Tagesbonus für den ersten Durchgang des Tages mit mindestens Etage 2.
   Klassen: Krieger (Schildwall), Magier (Feuerball, Frostblitz; Mana), Dieb (Schatten, Schleichangriff dreifach, öffnet Truhen ohne Schlüssel, entschärft Fallen); Magier und Dieb schaltest du mit Seelen frei.
   Fallen (Stachel, Gift, Alarm), Truhen mit Schlüsseln, Seltenheit der Ausrüstung (selten, episch, legendär), Zustände Gift, Brennen, Frost.
   Steuerung: Pfeiltasten/WASD (auch Ziffernblock) ziehen oder angreifen, Leertaste/. wartet, Q/H trinkt einen Trank, Mausklick auf ein Nachbarfeld zieht, ein Klick auf ein fernes Feld läuft hin.
══════════════════════════════════ */
const VL_KEY='zf_verlies',VL_W=48,VL_H=30,VL_VIEW_W=21,VL_VIEW_H=15,VL_T=32,VL_SIGHT=8;
const VL_UP={hp:{name:'Zähigkeit',desc:'+6 Lebenspunkte zum Start',max:6,cost:l=>20*(l+1)},atk:{name:'Kampfkraft',desc:'+1 Angriff zum Start',max:6,cost:l=>30*(l+1)},pot:{name:'Vorrat',desc:'+1 Heiltrank zum Start',max:3,cost:l=>25*(l+1)}};
const VL_MOBS=[   // Name, Zeichen, Leben, Angriff, Rüstung, Erfahrung, früheste Etage, Gewicht, Verhalten
  {id:'ratte',n:'Ratte',e:'🐀',hp:6,atk:3,def:0,xp:3,from:1,w:10,ai:'chase'},
  {id:'fledermaus',n:'Fledermaus',e:'🦇',hp:5,atk:3,def:0,xp:4,from:1,w:6,ai:'erratic'},
  {id:'skelett',n:'Skelett',e:'💀',hp:11,atk:4,def:1,xp:7,from:2,w:8,ai:'chase'},
  {id:'goblin',n:'Goblin',e:'👺',hp:9,atk:5,def:1,xp:8,from:2,w:8,ai:'chase'},
  {id:'spinne',n:'Riesenspinne',e:'🕷️',hp:10,atk:5,def:0,xp:9,from:3,w:6,ai:'chase'},
  {id:'zombie',n:'Zombie',e:'🧟',hp:20,atk:5,def:2,xp:12,from:4,w:6,ai:'slow'},
  {id:'magier',n:'Dunkelmagier',e:'🧙',hp:10,atk:6,def:0,xp:14,from:5,w:5,ai:'ranged'},
  {id:'ork',n:'Ork',e:'👹',hp:24,atk:8,def:3,xp:18,from:6,w:6,ai:'chase'},
  {id:'golem',n:'Steingolem',e:'🗿',hp:40,atk:9,def:6,xp:28,from:9,w:4,ai:'slow'}
];
const VL_BOSS=[{id:'boss1',n:'Knochenkönig',e:'👑',hp:60,atk:8,def:3,xp:60,ai:'chase'},{id:'boss2',n:'Drachenbrut',e:'🐉',hp:110,atk:12,def:5,xp:110,ai:'chase'},{id:'boss3',n:'Der Verschlinger',e:'👁️',hp:180,atk:16,def:8,xp:200,ai:'chase'}];
const VL_WEAPONS=['Rostiges Messer','Kurzschwert','Langschwert','Streitaxt','Runenklinge','Drachenzahn'],VL_ARMORS=['Lederhemd','Kettenhemd','Schuppenpanzer','Plattenrüstung','Runenpanzer','Drachenhaut'];
const VL_MILE=[{id:'d3',depth:3,coins:5,text:'Etage 3 erreicht'},{id:'d5',depth:5,coins:10,text:'Etage 5 erreicht'},{id:'d8',depth:8,coins:15,text:'Etage 8 erreicht'},{id:'d10',depth:10,coins:25,text:'Etage 10 erreicht'},{id:'d15',depth:15,coins:40,text:'Etage 15 erreicht'},{id:'d20',depth:20,coins:60,text:'Etage 20 erreicht'},{id:'b1',bosses:1,coins:10,text:'Ersten Boss besiegt'},{id:'b3',bosses:3,coins:25,text:'Drei Bosse in einem Durchgang besiegt'}],VL_DAILY=3;
const VL_CLS={
  krieger:{name:'Krieger',e:'🧑',hp:30,atk:5,mp:0,hpUp:6,mpUp:0,cost:0,desc:'Zäh und stark im Nahkampf.',skills:[{k:'shield',name:'Schildwall',e:'🛡️',key:'F',desc:'6 Züge lang nur halber Schaden (Abklingzeit 14)'}]},
  magier:{name:'Magier',e:'🧝',hp:20,atk:3,mp:16,hpUp:4,mpUp:2,cost:60,desc:'Schwach im Nahkampf, aber mit Zaubern aus der Ferne.',skills:[{k:'fire',name:'Feuerball',e:'🔥',key:'F',mp:6,desc:'6 Mana: starker Schaden und Brand (2 Schaden je Zug, 2 Züge)'},{k:'frost',name:'Frostblitz',e:'❄️',key:'G',mp:5,desc:'5 Mana: Schaden und Gegner 2 Züge eingefroren'}]},
  dieb:{name:'Dieb',e:'🥷',hp:26,atk:4,mp:0,hpUp:5,mpUp:0,cost:60,desc:'Trifft Ahnungslose dreifach, öffnet Truhen ohne Schlüssel und entschärft Fallen.',skills:[{k:'hide',name:'Schatten',e:'🌑',key:'F',desc:'6 Züge unsichtbar, Angriffe aus dem Schatten treffen dreifach (Abklingzeit 18)'}]}
};
/* ── Zufall: kleiner, schneller, gespeicherter Zufallsgenerator (Mulberry32) ── */
function vlRnd(st){st.rs=(st.rs+0x6D2B79F5)|0;let t=Math.imul(st.rs^(st.rs>>>15),1|st.rs);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;}
const vlInt=(st,a,b)=>a+Math.floor(vlRnd(st)*(b-a+1));
/* ── Etage erzeugen ── */
const vlIdx=(x,y)=>y*VL_W+x;
function vlGen(seed,depth){
  const g={rs:(seed*7919+depth*104729)|0},t=new Uint8Array(VL_W*VL_H),rooms=[];   // 0 Wand, 1 Boden, 2 Treppe
  for(let tries=0;tries<200&&rooms.length<10;tries++){
    const w=vlInt(g,4,10),h=vlInt(g,4,7),x=vlInt(g,1,VL_W-w-2),y=vlInt(g,1,VL_H-h-2);
    if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y))continue;
    rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});
  }
  rooms.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)t[vlIdx(x,y)]=1;});
  const carve=(x,y)=>{if(x>0&&y>0&&x<VL_W-1&&y<VL_H-1)t[vlIdx(x,y)]=1;};
  for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];let x=a.cx,y=a.cy;const horiz=vlRnd(g)<0.5;
    if(horiz){while(x!==b.cx){carve(x,y);x+=b.cx>x?1:-1;}while(y!==b.cy){carve(x,y);y+=b.cy>y?1:-1;}}
    else{while(y!==b.cy){carve(x,y);y+=b.cy>y?1:-1;}while(x!==b.cx){carve(x,y);x+=b.cx>x?1:-1;}}carve(x,y);}
  const start=[rooms[0].cx,rooms[0].cy];
  // Treppe: im am weitesten entfernten Raum (Weglänge)
  const dist=vlDistMap(t,start[0],start[1]);let far=rooms[rooms.length-1],best=-1;
  rooms.forEach(r=>{const d=dist[vlIdx(r.cx,r.cy)];if(d>best){best=d;far=r;}});
  const stairs=[far.cx,far.cy];t[vlIdx(stairs[0],stairs[1])]=2;
  return {t,rooms,start,stairs,g};
}
/* Weglängen von einem Punkt aus (Breitensuche, 4 Richtungen, begehbar = nicht Wand); -1 = nicht erreichbar */
function vlDistMap(t,sx,sy){
  const d=new Int16Array(VL_W*VL_H).fill(-1),q=[sx,sy];d[vlIdx(sx,sy)]=0;
  for(let i=0;i<q.length;i+=2){const x=q[i],y=q[i+1],c=d[vlIdx(x,y)];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=VL_W||ny>=VL_H)continue;const k=vlIdx(nx,ny);if(t[k]===0||d[k]!==-1)continue;d[k]=c+1;q.push(nx,ny);}}
  return d;
}
/* Sichtfeld: Strahlen vom Spieler zu allen Feldern im Radius; Wände blockieren (die Wand selbst ist sichtbar) */
function vlFov(t,px,py,R){
  const vis=new Uint8Array(VL_W*VL_H);vis[vlIdx(px,py)]=1;
  for(let y=Math.max(0,py-R);y<=Math.min(VL_H-1,py+R);y++)for(let x=Math.max(0,px-R);x<=Math.min(VL_W-1,px+R);x++){
    if((x-px)**2+(y-py)**2>R*R)continue;
    let x0=px,y0=py;const dx=Math.abs(x-x0),dy=Math.abs(y-y0),sx=x0<x?1:-1,sy=y0<y?1:-1;let err=dx-dy,ok=true;
    for(;;){if(x0===x&&y0===y)break;const e2=2*err;if(e2>-dy){err-=dy;x0+=sx;}if(e2<dx){err+=dx;y0+=sy;}
      if(x0===x&&y0===y)break;if(t[vlIdx(x0,y0)]===0){ok=false;break;}}
    if(ok)vis[vlIdx(x,y)]=1;
  }
  return vis;
}
/* ── Spielzustand ── */
const vlXpNeed=l=>Math.round(10*Math.pow(l,1.5));
function vlNewRun(seed,up,cls){
  up=up||{hp:0,atk:0,pot:0};cls=VL_CLS[cls]?cls:'krieger';const C=VL_CLS[cls];
  const p={cls,x:0,y:0,hp:C.hp+6*(up.hp|0),max:C.hp+6*(up.hp|0),atk:C.atk+(up.atk|0),def:0,lvl:1,xp:0,gold:0,weapon:null,armor:null,pots:1+(up.pot|0),mp:C.mp,mpm:C.mp,cd:0,shield:0,hide:0,poison:0,keys:0};
  const st={seed:seed|0,rs:(seed*31337+7)|0,depth:1,p,mobs:[],items:[],log:[],turn:0,kills:0,bosses:0,over:null,explored:null,t:null,stairs:null,shop:null,talk:false,traps:[],chests:[],name:VL_CLS[cls].name};
  vlEnter(st,1);vlLog(st,'Du betrittst das Verlies. Finde die Treppe nach unten!');return st;
}
const vlLog=(st,m)=>{st.log.push(m);if(st.log.length>40)st.log.shift();};
function vlMobStats(def,depth){const f=1+0.2*(depth-1),a=1+0.14*(depth-1);return {hp:Math.round(def.hp*f),atk:Math.round(def.atk*a),def:def.def+Math.floor(depth/3)};}
function vlPickMob(st,depth){
  const pool=VL_MOBS.filter(m=>m.from<=depth),tot=pool.reduce((s,m)=>s+m.w,0);let r=vlRnd(st)*tot;
  for(const m of pool){r-=m.w;if(r<=0)return m;}return pool[0];
}
function vlEnter(st,depth){
  st.depth=depth;st.shop=null;st.traps=[];st.chests=[];const gen=vlGen(st.seed,depth);st.t=gen.t;st.stairs=gen.stairs;st.rooms=gen.rooms;st.rs^=gen.g.rs;
  st.p.x=gen.start[0];st.p.y=gen.start[1];st.mobs=[];st.items=[];st.explored=new Uint8Array(VL_W*VL_H);
  const taken=new Set([vlIdx(st.p.x,st.p.y),vlIdx(gen.stairs[0],gen.stairs[1])]);
  const free=(room)=>{for(let i=0;i<30;i++){const x=vlInt(st,room.x,room.x+room.w-1),y=vlInt(st,room.y,room.y+room.h-1),k=vlIdx(x,y);if(!taken.has(k)&&st.t[k]===1){taken.add(k);return [x,y];}}return null;};
  const boss=depth%5===0,rooms=st.rooms;
  const n=Math.min(14,3+depth+(boss?0:1));
  for(let i=0;i<n;i++){const room=rooms[1+vlInt(st,0,rooms.length-2)]||rooms[rooms.length-1],pos=free(room);if(!pos)continue;
    const def=vlPickMob(st,depth),s=vlMobStats(def,depth);st.mobs.push({id:def.id,n:def.n,e:def.e,ai:def.ai,x:pos[0],y:pos[1],hp:s.hp,max:s.hp,atk:s.atk,def:s.def,xp:Math.round(def.xp*(1+0.1*(depth-1))),alert:false,boss:false});}
  if(boss){const bd=VL_BOSS[Math.min(VL_BOSS.length-1,depth/5-1)],room=rooms[rooms.length-1],pos=free(room)||[room.cx,room.cy],s=vlMobStats(bd,Math.max(1,depth-3));
    st.mobs.push({id:bd.id,n:bd.n,e:bd.e,ai:bd.ai,x:pos[0],y:pos[1],hp:bd.hp*Math.ceil(depth/5),max:bd.hp*Math.ceil(depth/5),atk:bd.atk+Math.floor(depth/2),def:bd.def,xp:bd.xp*Math.ceil(depth/5),alert:true,boss:true});}
  const ni=vlInt(st,3,5)+(depth>3?1:0);
  for(let i=0;i<ni;i++){const room=rooms[vlInt(st,0,rooms.length-1)],pos=free(room);if(!pos)continue;st.items.push(vlRollItem(st,depth,pos[0],pos[1]));}
  if(depth>=2&&depth%5!==0&&(depth===2||vlRnd(st)<0.5)){
    for(let tries=0;tries<20&&!st.shop;tries++){const room=rooms[1+vlInt(st,0,rooms.length-2)]||rooms[0],pos=free(room);if(!pos)continue;if(vlSafeBlock(st,pos))st.shop=vlMakeShop(st,depth,pos);}}   // der Händler darf keinen Weg versperren (z. B. den einzigen Eingang eines Raums)
  const nt=depth>=2?Math.min(6,1+Math.floor(depth/2)):0;
  for(let i=0;i<nt;i++){const room=rooms[1+vlInt(st,0,rooms.length-2)]||rooms[0],pos=free(room);if(!pos)continue;st.traps.push({x:pos[0],y:pos[1],k:['spike','poison','alarm'][vlInt(st,0,2)],seen:false});}
  if(depth>=2&&vlRnd(st)<0.6){   // Truhe samt Schlüssel irgendwo auf der Etage
    for(let tries=0;tries<20&&!st.chests.length;tries++){const room=rooms[vlInt(st,0,rooms.length-1)],pos=free(room);if(!pos)continue;if(vlSafeBlock(st,pos))st.chests.push({x:pos[0],y:pos[1]});}
    if(st.chests.length){const room=rooms[vlInt(st,0,rooms.length-1)],pos=free(room);if(pos)st.items.push({kind:'key',x:pos[0],y:pos[1]});}}
  vlSee(st);
}
/* Darf auf diesem Feld etwas Unbegehbares stehen (Händler, Truhe), ohne dass Treppe oder ein Raum unerreichbar werden? */
function vlSafeBlock(st,pos){const t2=st.t.slice();t2[vlIdx(pos[0],pos[1])]=0;if(st.shop)t2[vlIdx(st.shop.x,st.shop.y)]=0;st.chests.forEach(c=>{t2[vlIdx(c.x,c.y)]=0;});const dm=vlDistMap(t2,st.p.x,st.p.y);return dm[vlIdx(st.stairs[0],st.stairs[1])]>=0&&st.rooms.every(r=>t2[vlIdx(r.cx,r.cy)]===0||dm[vlIdx(r.cx,r.cy)]>=0);}
/* Händler: vier Angebote, die Preise wachsen mit der Tiefe; Waffe und Rüstung sind etwas besser als der Durchschnitt der Etage */
function vlMakeShop(st,depth,pos){
  const tier=Math.min(5,Math.floor(depth/2)),wv=3+tier*2+vlInt(st,0,2),av=2+tier*2+vlInt(st,0,1);
  return {x:pos[0],y:pos[1],stock:[{k:'pot',n:'Heiltrank',v:0,price:8+2*depth,left:3},{k:'heal',n:'Vollheilung',v:0,price:15+3*depth,left:1},{k:'weapon',n:VL_WEAPONS[tier],v:wv,price:5*wv,left:1},{k:'armor',n:VL_ARMORS[tier],v:av,price:6*av,left:1}]};
}
const vlShopAt=(st,x,y)=>!!st.shop&&st.shop.x===x&&st.shop.y===y;
/* Kauf: 'ok', 'gold' (zu wenig), 'sold' (ausverkauft), 'full' (Vollheilung bei voller Gesundheit), 'worse' (nicht besser als deine Ausrüstung), 'none' */
function vlShopBuy(st,i){
  const it=st.shop&&st.shop.stock[i],p=st.p;if(!it)return 'none';if(it.left<=0)return 'sold';if(p.gold<it.price)return 'gold';
  if(it.k==='heal'&&p.hp>=p.max)return 'full';
  if(it.k==='weapon'&&p.weapon&&p.weapon.v>=it.v)return 'worse';
  if(it.k==='armor'&&p.armor&&p.armor.v>=it.v)return 'worse';
  p.gold-=it.price;it.left--;
  if(it.k==='pot'){p.pots++;vlLog(st,'🛒 Heiltrank gekauft (−'+it.price+' Gold).');}
  else if(it.k==='heal'){p.hp=p.max;vlLog(st,'🛒 Vollheilung getrunken (−'+it.price+' Gold).');}
  else if(it.k==='weapon'){p.weapon={n:it.n,v:it.v};vlLog(st,'🛒 '+it.n+' gekauft (+'+it.v+' Angriff, −'+it.price+' Gold).');}
  else{p.armor={n:it.n,v:it.v};vlLog(st,'🛒 '+it.n+' gekauft (+'+it.v+' Rüstung, −'+it.price+' Gold).');}
  return 'ok';
}
/* Noch nicht ausgezahlte Meilensteine (nur lesen; der Aufrufer zahlt und trägt sie dann ein) */
function vlMilestones(pr,st){return VL_MILE.filter(m=>pr.rew.indexOf(m.id)<0&&((m.depth&&st.depth>=m.depth)||(m.bosses&&st.bosses>=m.bosses)));}
const vlDailyDue=(pr,over,today)=>!!today&&over.depth>=2&&pr.daily!==today;
/* Seltenheit: gewöhnlich, selten, episch, legendär – wächst mit der Tiefe; Truhen geben mindestens „selten“. Seltene Ausrüstung hat höhere Werte (×1,3 / ×1,6 / ×2). */
const VL_RAR=['gewöhnlich','selten','episch','legendär'],VL_RCOL=['#9e9e9e','#42a5f5','#ab47bc','#ffa000'],VL_RMUL=[1,1.3,1.6,2];
const vlItemName=it=>it.n+(it.r?' ('+VL_RAR[it.r]+')':'');
function vlRarity(st,depth){const q=vlRnd(st),l=0.01+0.002*depth,e=l+0.06+0.004*depth,s=e+0.2+0.01*depth;return q<l?3:q<e?2:q<s?1:0;}
function vlGear(st,depth,x,y,kind,minR){
  const tier=Math.min(5,Math.floor((depth-1)/2)+(vlRnd(st)<0.25?1:0)),rar=Math.max(minR|0,vlRarity(st,depth)),mul=VL_RMUL[rar];
  return kind==='weapon'?{kind,x,y,n:VL_WEAPONS[tier],v:Math.round((2+tier*2+vlInt(st,0,2))*mul),r:rar}:{kind,x,y,n:VL_ARMORS[tier],v:Math.round((1+tier*2+vlInt(st,0,1))*mul),r:rar};
}
function vlRollItem(st,depth,x,y){
  const r=vlRnd(st);
  if(r<0.34)return {kind:'pot',x,y};
  if(r<0.6)return {kind:'gold',x,y,v:vlInt(st,3,8)*depth+vlInt(st,0,5)};
  return vlGear(st,depth,x,y,r<0.82?'weapon':'armor',0);
}
const vlAtk=st=>st.p.atk+(st.p.weapon?st.p.weapon.v:0);
const vlDef=st=>st.p.armor?st.p.armor.v:0;
/* Schaden: Angriff gedämpft durch Rüstung (Rüstung 12 halbiert), ±1 Streuung, mindestens 1 */
function vlDamage(st,atk,def){return Math.max(1,Math.round(atk*(1-def/(def+12)))+vlInt(st,-1,1));}
function vlSee(st){const v=vlFov(st.t,st.p.x,st.p.y,VL_SIGHT);st.vis=v;for(let i=0;i<v.length;i++)if(v[i])st.explored[i]=1;
  const R=st.p.cls==='dieb'?3:1;(st.traps||[]).forEach(t=>{if(Math.max(Math.abs(t.x-st.p.x),Math.abs(t.y-st.p.y))<=R)t.seen=true;});}   // Fallen zeigen sich, wenn man nah genug ist
const vlMobAt=(st,x,y)=>st.mobs.find(m=>m.x===x&&m.y===y);
const vlBlocked=(st,x,y)=>vlShopAt(st,x,y)||!!vlChestAt(st,x,y);   // Händler und geschlossene Truhen sind keine Wege
const vlWalk=(st,x,y)=>x>0&&y>0&&x<VL_W-1&&y<VL_H-1&&st.t[vlIdx(x,y)]!==0&&!vlBlocked(st,x,y);
function vlHurtMob(st,m,dmg,how){
  m.hp-=dmg;
  if(m.hp<=0){st.mobs.splice(st.mobs.indexOf(m),1);st.kills++;if(m.boss)st.bosses++;vlLog(st,how+' '+m.n+' besiegt! (+'+m.xp+' Erfahrung)');vlGainXp(st,m.xp);
    if(m.boss){const g=20*st.depth;st.p.gold+=g;vlLog(st,'Der Boss lässt '+g+' Gold fallen.');}else if(vlRnd(st)<0.18){st.items.push(vlRollItem(st,st.depth,m.x,m.y));}}
}
function vlGainXp(st,xp){const p=st.p;p.xp+=xp;while(p.xp>=vlXpNeed(p.lvl)){p.xp-=vlXpNeed(p.lvl);p.lvl++;const C=VL_CLS[p.cls]||VL_CLS.krieger;p.max+=C.hpUp;p.atk+=1;p.hp=Math.min(p.max,p.hp+Math.ceil(p.max*0.4));if(p.mpm){p.mpm+=C.mpUp;p.mp=Math.min(p.mpm,p.mp+C.mpUp*2);}vlLog(st,'⭐ Stufe '+p.lvl+'! Mehr Leben und Angriff.');}}
/* Ein Zug des Spielers: dx,dy bewegen/angreifen/Truhe öffnen, wait=warten, drink=Trank, skill=Klassenfähigkeit (n = 1 oder 2). Danach ziehen die Gegner. Gibt true zurück, wenn ein Zug verbraucht wurde. */
function vlAct(st,act){
  if(st.over)return false;const p=st.p;let used=false;
  if(act.t==='wait'){used=true;}
  else if(act.t==='drink'){if(p.pots<=0){vlLog(st,'Du hast keinen Heiltrank.');return false;}if(p.hp>=p.max){vlLog(st,'Du bist schon bei voller Gesundheit.');return false;}
    p.pots--;const h=Math.ceil(p.max*0.5);p.hp=Math.min(p.max,p.hp+h);vlLog(st,'🧪 Du trinkst einen Heiltrank (+'+h+').');used=true;}
  else if(act.t==='skill'){used=vlSkill(st,act.n|0);if(!used)return false;}
  else if(act.t==='move'){
    const nx=p.x+act.dx,ny=p.y+act.dy;if(vlShopAt(st,nx,ny)){st.talk=true;return false;}
    const ch=vlChestAt(st,nx,ny);
    if(ch){if(!vlOpenChest(st,ch))return false;used=true;}
    else{
      if(!vlWalk(st,nx,ny))return false;
      const m=vlMobAt(st,nx,ny);
      if(m){vlPlayerHit(st,m);used=true;}
      else{p.x=nx;p.y=ny;used=true;vlTrap(st);
        if(p.hp>0){vlPickup(st);
          if(st.t[vlIdx(p.x,p.y)]===2){vlLog(st,'Du steigst eine Etage tiefer …');vlEnter(st,st.depth+1);vlLog(st,'Etage '+st.depth+(st.depth%5===0?' – hier wartet ein Boss!':'')+'.');st.turn++;return true;}}}
    }
  }
  if(!used)return false;
  st.turn++;
  if(p.cd>0)p.cd--;if(p.shield>0)p.shield--;if(p.hide>0)p.hide--;
  if(p.mpm>0&&st.turn%3===0&&p.mp<p.mpm)p.mp++;
  if(p.poison>0){p.poison--;p.hp--;if(p.poison===0&&p.hp>0)vlLog(st,'Das Gift lässt nach.');}
  vlSee(st);vlMobsAct(st);vlSee(st);
  if(p.hp<=0)vlDie(st);
  if(!st.over&&st.turn%8===0&&p.hp<p.max&&!st.mobs.some(m=>st.vis[vlIdx(m.x,m.y)]))p.hp++;   // langsame Erholung, wenn kein Gegner in Sicht
  return true;
}
/* Nahkampf des Spielers: ±1 Streuung, Kritische Treffer (Dieb öfter); der Dieb trifft Ahnungslose (und alles, solange er unsichtbar ist) dreifach */
function vlPlayerHit(st,m){
  const p=st.p,thief=p.cls==='dieb',sneak=thief&&(!m.alert||p.hide>0);
  let d=vlDamage(st,vlAtk(st),m.def);const crit=vlRnd(st)<(thief?0.2:0.1);
  if(sneak)d*=3;else if(crit)d*=2;
  vlLog(st,'Du triffst '+m.n+' für '+d+(sneak?' (Schleichangriff!)':crit?' (kritisch!)':'')+'.');
  p.hide=0;m.alert=true;vlHurtMob(st,m,d,'Du hast');
}
/* Nächster sichtbarer Gegner im Umkreis R (für Zauber) */
function vlTarget(st,R){let best=null,bd=1e9;for(const m of st.mobs){if(!st.vis[vlIdx(m.x,m.y)])continue;const d=Math.hypot(m.x-st.p.x,m.y-st.p.y);if(d<=R&&d<bd){bd=d;best=m;}}return best;}
/* Klassenfähigkeit n (1 oder 2): Schildwall und Schatten haben Abklingzeit, Zauber kosten Mana und brauchen ein Ziel in Sicht (7 Felder). Gibt true zurück, wenn sie gewirkt wurde. */
function vlSkill(st,n){
  const p=st.p,C=VL_CLS[p.cls],sk=C&&C.skills[n-1];
  if(!sk){vlLog(st,'Diese Klasse hat keine zweite Fähigkeit.');return false;}
  if(sk.k==='shield'||sk.k==='hide'){
    if(p.cd>0){vlLog(st,sk.name+' ist noch nicht bereit (noch '+p.cd+' Züge).');return false;}
    if(sk.k==='shield'){p.shield=6;p.cd=14;vlLog(st,'🛡️ Schildwall: 6 Züge lang nur halber Schaden.');}
    else{p.hide=6;p.cd=18;st.mobs.forEach(m=>{if(Math.abs(m.x-p.x)+Math.abs(m.y-p.y)>1)m.alert=false;});vlLog(st,'🌑 Du verschwindest im Schatten: 6 Züge lang bemerkt dich niemand, der nicht direkt neben dir steht.');}
    return true;
  }
  if(p.mp<sk.mp){vlLog(st,'Zu wenig Mana ('+sk.mp+' nötig).');return false;}
  const tg=vlTarget(st,7);if(!tg){vlLog(st,'Kein Ziel in Sicht.');return false;}
  p.mp-=sk.mp;tg.alert=true;
  if(sk.k==='fire'){const d=vlDamage(st,6+2*p.lvl,tg.def);tg.burn=2;vlLog(st,'🔥 Feuerball trifft '+tg.n+' für '+d+' und setzt ihn 2 Züge in Brand.');vlHurtMob(st,tg,d,'Der Feuerball hat');}
  else{const d=vlDamage(st,4+p.lvl,tg.def);tg.frozen=2;vlLog(st,'❄️ Frostblitz trifft '+tg.n+' für '+d+' und friert ihn 2 Züge ein.');vlHurtMob(st,tg,d,'Der Frostblitz hat');}
  return true;
}
/* Fallen: verborgen, bis man daneben steht (der Dieb sieht sie auf 3 Felder und entschärft sie im Vorbeigehen); Stachelfalle (Schaden), Giftfalle (Gift), Alarmfalle (alle Gegner wachen auf) */
const VL_TRAPS={spike:'Stachelfalle',poison:'Giftfalle',alarm:'Alarmfalle'};
const vlTrapAt=(st,x,y)=>(st.traps||[]).find(t=>t.x===x&&t.y===y);
function vlTrap(st){
  const p=st.p,t=vlTrapAt(st,p.x,p.y);if(!t)return;st.traps.splice(st.traps.indexOf(t),1);
  if(p.cls==='dieb'){vlLog(st,'🥷 Du entschärfst eine '+VL_TRAPS[t.k]+'.');return;}
  if(t.k==='spike'){const d=3+st.depth;p.hp-=d;vlLog(st,'⚠️ Stachelfalle! Du verlierst '+d+' Leben.');}
  else if(t.k==='poison'){p.poison=Math.max(p.poison,6);vlLog(st,'⚠️ Giftfalle! Du bist 6 Züge lang vergiftet (−1 Leben je Zug).');}
  else{st.mobs.forEach(m=>{m.alert=true;});vlLog(st,'🔔 Alarmfalle! Alle Gegner auf der Etage sind alarmiert.');}
}
/* Truhe: braucht einen Schlüssel (der Dieb knackt sie); gibt Gold und ein Stück Ausrüstung (mindestens selten) auf ihr Feld */
const vlChestAt=(st,x,y)=>(st.chests||[]).find(c=>c.x===x&&c.y===y);
function vlOpenChest(st,ch){
  const p=st.p;
  if(p.keys>0){p.keys--;vlLog(st,'🗝️ Du öffnest die Truhe mit dem Schlüssel.');}
  else if(p.cls==='dieb')vlLog(st,'🥷 Du knackst das Schloss der Truhe.');
  else{vlLog(st,'🧰 Die Truhe ist verschlossen – du brauchst einen Schlüssel 🗝️ (irgendwo auf der Etage).');return false;}
  st.chests.splice(st.chests.indexOf(ch),1);const g=vlInt(st,8,14)*st.depth;p.gold+=g;
  st.items.push(vlGear(st,st.depth,ch.x,ch.y,vlRnd(st)<0.5?'weapon':'armor',1));vlLog(st,'💰 '+g+' Gold – und etwas glänzt auf dem Feld der Truhe!');return true;
}
function vlPickup(st){
  const p=st.p,i=st.items.findIndex(it=>it.x===p.x&&it.y===p.y);if(i<0)return;const it=st.items[i],take=()=>st.items.splice(st.items.indexOf(it),1);
  if(it.kind==='pot'){take();p.pots++;vlLog(st,'🧪 Du findest einen Heiltrank.');}
  else if(it.kind==='key'){take();p.keys++;vlLog(st,'🗝️ Du findest einen Schlüssel.');}
  else if(it.kind==='gold'){take();p.gold+=it.v;vlLog(st,'💰 Du findest '+it.v+' Gold.');}
  else if(it.kind==='weapon'){if(!p.weapon||it.v>p.weapon.v){take();p.weapon={n:it.n,v:it.v,r:it.r|0};vlLog(st,'🗡️ '+vlItemName(it)+' ausgerüstet (+'+it.v+' Angriff).');}else vlLog(st,'🗡️ '+vlItemName(it)+' (+'+it.v+') ist schlechter als deine Waffe – liegen gelassen.');}
  else if(it.kind==='armor'){if(!p.armor||it.v>p.armor.v){take();p.armor={n:it.n,v:it.v,r:it.r|0};vlLog(st,'🛡️ '+vlItemName(it)+' angelegt (+'+it.v+' Rüstung).');}else vlLog(st,'🛡️ '+vlItemName(it)+' (+'+it.v+') ist schlechter als deine Rüstung – liegen gelassen.');}
}
function vlDie(st){st.over={souls:vlSouls(st),depth:st.depth,kills:st.kills,gold:st.p.gold,lvl:st.p.lvl,cls:st.p.cls};vlLog(st,'☠️ Du bist gefallen.');}
const vlSouls=st=>st.depth*5+st.kills+Math.floor(st.p.gold/10)+25*st.bosses;
/* Gegner: Sicht (≤ 8 Felder und Blickkontakt) weckt sie, dann Verfolgung auf dem kürzesten Weg; je nach Art zufällig (Fledermaus), langsam (jede 2. Runde), mit Fernangriff (Magier) */
function vlMobsAct(st){
  const p=st.p,dp=vlDistMap(st.t,p.x,p.y);
  for(const m of st.mobs.slice()){
    if(m.burn>0){m.burn--;vlHurtMob(st,m,2,'Die Flammen haben');if(st.mobs.indexOf(m)<0)continue;}
    if(m.frozen>0){m.frozen--;continue;}
    const near=Math.abs(m.x-p.x)+Math.abs(m.y-p.y)===1;
    if(p.hide>0&&!near){m.alert=false;continue;}   // im Schatten bemerkt dich nur, wer direkt neben dir steht
    const sees=st.vis[vlIdx(m.x,m.y)]&&Math.hypot(m.x-p.x,m.y-p.y)<=VL_SIGHT;if(sees)m.alert=true;
    if(!m.alert)continue;
    const adj=Math.abs(m.x-p.x)+Math.abs(m.y-p.y)===1;
    if(m.ai==='slow'&&st.turn%2===0&&!adj)continue;
    if(m.ai==='erratic'&&vlRnd(st)<0.45){const d=[[1,0],[-1,0],[0,1],[0,-1]][vlInt(st,0,3)];if(vlWalk(st,m.x+d[0],m.y+d[1])&&!vlMobAt(st,m.x+d[0],m.y+d[1])&&!(m.x+d[0]===p.x&&m.y+d[1]===p.y)){m.x+=d[0];m.y+=d[1];}continue;}
    if(adj){vlMobHit(st,m);continue;}
    if(m.ai==='ranged'&&sees&&Math.hypot(m.x-p.x,m.y-p.y)<=5){vlMobHit(st,m,true);continue;}
    // Schritt auf den Spieler zu: kleinste Weglänge unter den freien Nachbarfeldern
    let best=null,bd=dp[vlIdx(m.x,m.y)];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=m.x+dx,ny=m.y+dy;if(!vlWalk(st,nx,ny)||vlMobAt(st,nx,ny)||(nx===p.x&&ny===p.y))continue;const d=dp[vlIdx(nx,ny)];if(d>=0&&d<bd){bd=d;best=[nx,ny];}}
    if(best){m.x=best[0];m.y=best[1];}
  }
}
function vlMobHit(st,m,ranged){
  let d=vlDamage(st,m.atk,vlDef(st));if(st.p.shield>0)d=Math.max(1,Math.ceil(d/2));st.p.hp-=d;
  vlLog(st,m.n+(ranged?' schleudert einen Zauber auf dich':' trifft dich')+' für '+d+(st.p.shield>0?' (Schildwall)':'')+'.');
  if(m.id==='spinne'&&vlRnd(st)<0.35){st.p.poison=Math.max(st.p.poison,4);vlLog(st,'🕷️ Du bist vergiftet (4 Züge).');}
}
/* ── Dauerhafter Spielstand ── */
function vlAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n.toLowerCase();}}catch(e){}return '_gast';}
function vlAll(){try{const o=JSON.parse(localStorage.getItem(VL_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
const vlClamp=(v,a,b)=>Math.max(a,Math.min(b,Math.floor(Number(v))||0));
function vlProf(){
  const pr=vlProf0();if(!pr.cls.includes(pr.pickRaw))pr.pickRaw='krieger';pr.pick=pr.pickRaw;delete pr.pickRaw;return pr;
}
function vlProf0(){
  const a=vlAll()[vlAccount()]||{},up={};Object.keys(VL_UP).forEach(k=>{up[k]=vlClamp(a.up&&a.up[k],0,VL_UP[k].max);});
  const b=a.best&&typeof a.best==='object'?a.best:{};
  return {souls:vlClamp(a.souls,0,9999999),up,best:{depth:vlClamp(b.depth,0,999),kills:vlClamp(b.kills,0,99999),gold:vlClamp(b.gold,0,9999999)},runs:vlClamp(a.runs,0,99999),pickRaw:typeof a.pick==='string'?a.pick:'krieger',cls:['krieger'].concat((Array.isArray(a.cls)?a.cls:[]).filter((x,i,ar)=>VL_CLS[x]&&x!=='krieger'&&ar.indexOf(x)===i)),pick:'krieger',rew:(Array.isArray(a.rew)?a.rew:[]).filter((x,i,ar)=>VL_MILE.some(m=>m.id===x)&&ar.indexOf(x)===i),daily:typeof a.daily==='string'&&/^\d{4}-\d\d-\d\d$/.test(a.daily)?a.daily:'',run:vlLoadRun(a.run)};
}
/* Laufenden Durchgang prüfen und wiederherstellen (kaputte oder erfundene Daten führen zu „kein Durchgang“) */
function vlLoadRun(r){
  try{
    if(!r||typeof r!=='object'||r.over)return null;
    const p=r.p||{},cls=VL_CLS[p.cls]?p.cls:'krieger';
    const st=vlNewRun(r.seed|0,{hp:0,atk:0,pot:0},cls);const d=vlClamp(r.depth,1,999);
    st.rs=r.rs|0;st.depth=d;
    const gen=vlGen(st.seed,d);st.t=gen.t;st.stairs=gen.stairs;st.rooms=gen.rooms;st.explored=Uint8Array.from(Array.from({length:VL_W*VL_H},(_,i)=>(r.ex&&r.ex[i]==='1')?1:0));
    st.shop=null;st.chests=[];st.traps=[];
    if(r.shop&&typeof r.shop==='object'&&Array.isArray(r.shop.stock)){const sx=vlClamp(r.shop.x,1,VL_W-2),sy=vlClamp(r.shop.y,1,VL_H-2),stock=r.shop.stock.slice(0,4).filter(i=>i&&['pot','heal','weapon','armor'].includes(i.k)).map(i=>({k:i.k,n:String(i.n||'').slice(0,30),v:vlClamp(i.v,0,99),price:vlClamp(i.price,1,99999),left:vlClamp(i.left,0,9)}));if(st.t[vlIdx(sx,sy)]===1&&stock.length)st.shop={x:sx,y:sy,stock};}
    (Array.isArray(r.chests)?r.chests:[]).slice(0,3).forEach(c=>{if(!c)return;const x=vlClamp(c.x,1,VL_W-2),y=vlClamp(c.y,1,VL_H-2);if(st.t[vlIdx(x,y)]===1&&!vlShopAt(st,x,y)&&!vlChestAt(st,x,y))st.chests.push({x,y});});
    (Array.isArray(r.traps)?r.traps:[]).slice(0,12).forEach(t=>{if(!t||!VL_TRAPS[t.k])return;const x=vlClamp(t.x,1,VL_W-2),y=vlClamp(t.y,1,VL_H-2);if(st.t[vlIdx(x,y)]===1&&!vlTrapAt(st,x,y))st.traps.push({x,y,k:t.k,seen:!!t.seen});});
    st.p={cls,x:vlClamp(p.x,1,VL_W-2),y:vlClamp(p.y,1,VL_H-2),hp:vlClamp(p.hp,1,9999),max:vlClamp(p.max,1,9999),atk:vlClamp(p.atk,1,999),def:0,lvl:vlClamp(p.lvl,1,99),xp:vlClamp(p.xp,0,999999),gold:vlClamp(p.gold,0,9999999),pots:vlClamp(p.pots,0,99),weapon:null,armor:null,
      mp:vlClamp(p.mp,0,999),mpm:VL_CLS[cls].mp?vlClamp(p.mpm,1,999):0,cd:vlClamp(p.cd,0,99),shield:vlClamp(p.shield,0,99),hide:vlClamp(p.hide,0,99),poison:vlClamp(p.poison,0,99),keys:vlClamp(p.keys,0,99)};
    if(st.p.hp>st.p.max)st.p.hp=st.p.max;if(st.p.mp>st.p.mpm)st.p.mp=st.p.mpm;if(st.t[vlIdx(st.p.x,st.p.y)]===0||vlBlocked(st,st.p.x,st.p.y))return null;
    if(p.weapon&&typeof p.weapon.n==='string')st.p.weapon={n:p.weapon.n.slice(0,30),v:vlClamp(p.weapon.v,1,99),r:vlClamp(p.weapon.r,0,3)};
    if(p.armor&&typeof p.armor.n==='string')st.p.armor={n:p.armor.n.slice(0,30),v:vlClamp(p.armor.v,1,99),r:vlClamp(p.armor.r,0,3)};
    st.turn=vlClamp(r.turn,0,9999999);st.kills=vlClamp(r.kills,0,99999);st.bosses=vlClamp(r.bosses,0,999);
    st.mobs=(Array.isArray(r.mobs)?r.mobs:[]).slice(0,40).filter(m=>m&&VL_MOBS.concat(VL_BOSS).some(d=>d.id===m.id)&&vlWalk(st,m.x|0,m.y|0)).map(m=>{const d=VL_MOBS.concat(VL_BOSS).find(x=>x.id===m.id);return {id:d.id,n:d.n,e:d.e,ai:d.ai,x:m.x|0,y:m.y|0,hp:vlClamp(m.hp,1,99999),max:vlClamp(m.max,1,99999),atk:vlClamp(m.atk,1,999),def:vlClamp(m.def,0,999),xp:vlClamp(m.xp,0,99999),alert:!!m.alert,boss:!!m.boss,burn:vlClamp(m.burn,0,9),frozen:vlClamp(m.frozen,0,9)};});
    st.items=(Array.isArray(r.items)?r.items:[]).slice(0,40).filter(it=>it&&['pot','gold','weapon','armor','key'].includes(it.kind)&&vlWalk(st,it.x|0,it.y|0)).map(it=>({kind:it.kind,x:it.x|0,y:it.y|0,v:vlClamp(it.v,0,9999),n:typeof it.n==='string'?it.n.slice(0,30):'',r:vlClamp(it.r,0,3)}));
    st.log=(Array.isArray(r.log)?r.log:[]).slice(-12).map(x=>String(x).slice(0,160));vlSee(st);return st;
  }catch(e){return null;}
}
function vlPack(st){
  return {seed:st.seed,rs:st.rs,depth:st.depth,turn:st.turn,kills:st.kills,bosses:st.bosses,shop:st.shop,p:st.p,traps:st.traps,chests:st.chests,mobs:st.mobs.map(m=>({id:m.id,x:m.x,y:m.y,hp:m.hp,max:m.max,atk:m.atk,def:m.def,xp:m.xp,alert:m.alert,boss:m.boss,burn:m.burn||0,frozen:m.frozen||0})),items:st.items,ex:Array.from(st.explored).join(''),log:st.log.slice(-12)};
}
function vlSaveProf(pr,st){
  const all=vlAll();all[vlAccount()]={souls:pr.souls,up:pr.up,best:pr.best,runs:pr.runs,cls:pr.cls,pick:pr.pick,rew:pr.rew,daily:pr.daily,run:st&&!st.over?vlPack(st):null};
  try{localStorage.setItem(VL_KEY,JSON.stringify(all));}catch(e){return false;}return true;
}
/* Stärkung kaufen: 'ok', 'max' (Höchststufe) oder 'souls' (zu wenig Seelen) */
function vlBuy(pr,k){const u=VL_UP[k];if(!u)return 'max';const l=pr.up[k];if(l>=u.max)return 'max';const c=u.cost(l);if(pr.souls<c)return 'souls';pr.souls-=c;pr.up[k]++;return 'ok';}
/* Klasse freischalten: 'ok' (und gleich gewählt), 'have', 'souls' oder 'none' */
function vlBuyClass(pr,id){const C=VL_CLS[id];if(!C)return 'none';if(pr.cls.includes(id))return 'have';if(pr.souls<C.cost)return 'souls';pr.souls-=C.cost;pr.cls.push(id);pr.pick=id;return 'ok';}
/* Ende eines Durchgangs verbuchen: Seelen, Bestwerte, Durchgangszähler */
function vlFinish(pr,over){pr.souls+=over.souls;pr.best.depth=Math.max(pr.best.depth,over.depth);pr.best.kills=Math.max(pr.best.kills,over.kills);pr.best.gold=Math.max(pr.best.gold,over.gold);pr.runs++;pr.run=null;}
/* ── Oberfläche ── */
/* AppHub-Coins gutschreiben (nur mit angemeldetem Spieler); gibt die ausgezahlte Menge zurück */
function vlPay(n){try{const name=typeof zcp==='function'?String(zcp().player||'').trim():'';if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
const vlToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
let vl=null,vlPr=null,vlPath=null,vlHover=null;
const vlEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function vlActive(){const s=document.getElementById('screen-verlies');return !!s&&s.classList.contains('active');}
function vlInit(){vlPr=vlProf();vl={view:'menu',st:null};vlPath=null;vlRender();}
function vlStart(cont){
  vlPr=vlProf();
  vl.st=cont&&vlPr.run?vlPr.run:vlNewRun((Date.now()^Math.floor(Math.random()*1e9))|0,vlPr.up,vlPr.pick);
  vl.view='game';vl.shop=false;vlPath=null;vlRender();vlDraw();vlSaveProf(vlPr,vl.st);
}
function vlRender(){
  const root=document.getElementById('vl-root');if(!root)return;
  if(vl.view==='menu'){
    const p=vlPr,upRows=Object.keys(VL_UP).map(k=>{const u=VL_UP[k],l=p.up[k],cost=l>=u.max?null:u.cost(l);
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--divider)"><div style="flex:1"><b>'+u.name+'</b> <span style="font-size:12px;color:var(--text-3)">Stufe '+l+'/'+u.max+'</span><div style="font-size:12px;color:var(--text-2)">'+u.desc+'</div></div>'+(cost===null?'<span style="font-size:12px;color:var(--text-3)">Höchststufe</span>':'<button class="lrn-btn" '+(p.souls<cost?'disabled':'')+' onclick="vlBuyClick(\''+k+'\')">'+cost+' 👻 kaufen</button>')+'</div>';}).join('');
    const mileRows=VL_MILE.map(m=>'<div style="display:flex;gap:8px;font-size:13px;padding:3px 0"><span style="width:20px">'+(p.rew.indexOf(m.id)>=0?'✅':'⬜')+'</span><span style="flex:1">'+m.text+'</span><b>'+m.coins+' 🪙</b></div>').join('');
    const clsRows=Object.keys(VL_CLS).map(id=>{const C=VL_CLS[id],own=p.cls.includes(id),sel=p.pick===id;
      return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--divider)"><div style="font-size:26px">'+C.e+'</div><div style="flex:1"><b>'+C.name+'</b> <span style="font-size:12px;color:var(--text-3)">❤️ '+C.hp+' · 🗡️ '+C.atk+(C.mp?' · 🔷 '+C.mp:'')+'</span><div style="font-size:12px;color:var(--text-2)">'+C.desc+'</div><div style="font-size:12px;color:var(--text-3)">'+C.skills.map(k=>k.e+' '+k.name+' ('+k.key+'): '+k.desc).join(' · ')+'</div></div>'+(own?'<button class="lrn-btn '+(sel?'':'ghost')+'" onclick="vlPickClass(\''+id+'\')">'+(sel?'✔ Gewählt':'Wählen')+'</button>':'<button class="lrn-btn" '+(p.souls<C.cost?'disabled':'')+' onclick="vlBuyClassClick(\''+id+'\')">'+C.cost+' 👻 freischalten</button>')+'</div>';}).join('');
    root.innerHTML=`<p style="font-size:13px;color:var(--text-2);text-align:center">Steige so tief wie möglich in das Verlies hinab. Jede Etage ist neu, jeder Durchgang anders. Wenn du fällst, behältst du deine <b>Seelen</b> und wirst mit ihnen dauerhaft stärker. Gefundenes <b>Gold</b> gibst du beim <b>Händler</b> 🛒 aus (er steht ab Etage 2 manchmal in einem Raum).</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:10px"><span class="game-chip">👻 <strong>${p.souls}</strong> Seelen</span><span class="game-chip">🏆 Tiefste Etage <strong>${p.best.depth}</strong></span><span class="game-chip">⚔️ Meiste Siege <strong>${p.best.kills}</strong></span><span class="game-chip">🔁 Durchgänge <strong>${p.runs}</strong></span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">${p.run?'<button class="lrn-btn" onclick="vlStart(true)">▶ Durchgang fortsetzen (Etage '+p.run.depth+')</button>':''}<button class="lrn-btn ${p.run?'ghost':''}" onclick="vlNewClick()">${p.run?'Neuer Durchgang (der alte wird aufgegeben)':'▶ Neuer Durchgang'}</button></div>
    <div class="lrn-card"><div class="lrn-label">Klasse (gilt für den nächsten Durchgang)</div>${clsRows}</div>
    <div class="lrn-card" style="margin-top:10px"><div class="lrn-label">Dauerhafte Stärkungen</div>${upRows}</div>
    <div class="lrn-card" style="margin-top:10px"><div class="lrn-label">AppHub-Coins verdienen</div><div style="font-size:12px;color:var(--text-2);margin-bottom:6px">Einmalige Belohnungen für Meilensteine, dazu ${VL_DAILY} Coins für den ersten Durchgang des Tages, der mindestens Etage 2 erreicht.</div>${mileRows}</div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px">Steuerung: Pfeiltasten oder WASD ziehen und greifen an · Leertaste wartet · Q trinkt einen Trank · F und G wirken Klassenfähigkeiten · Mausklick auf ein Feld zieht dorthin · X erkundet automatisch · T läuft zur Treppe.</div>`;
    return;
  }
  root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:6px"><button class="lrn-btn ghost" onclick="vlMenu()">← Menü</button><span class="game-chip" id="vl-hp"></span><span class="game-chip" id="vl-lv"></span><span class="game-chip" id="vl-eq"></span><span class="game-chip" id="vl-st"></span><button class="lrn-btn" onclick="vlDo({t:'drink'})">🧪 Trank (Q)</button><button class="lrn-btn ghost" onclick="vlDo({t:'wait'})">⏳ Warten</button><button class="lrn-btn ghost" onclick="vlAuto('explore')" title="Läuft zum nächsten unerforschten Bereich (X)">🧭 Erkunden</button><button class="lrn-btn ghost" onclick="vlAuto('stairs')" title="Läuft zur Treppe, wenn du sie gesehen hast (T)">🪜 Treppe</button>${vlSkillBtns(vl.st)}</div>
    <div style="position:relative;max-width:${VL_VIEW_W*VL_T}px;margin:0 auto"><canvas id="vl-canvas" width="${VL_VIEW_W*VL_T}" height="${VL_VIEW_H*VL_T}" style="display:block;width:100%;height:auto;border-radius:12px;box-shadow:0 6px 22px rgba(0,0,0,.35);cursor:pointer"></canvas><div id="vl-over"></div></div>
    <div id="vl-log" style="max-width:${VL_VIEW_W*VL_T}px;margin:8px auto 0;font-size:12px;color:var(--text-2);line-height:1.45;min-height:90px"></div>`;
  const cv=document.getElementById('vl-canvas');cv.onclick=e=>vlClick(cv,e);cv.onmousemove=e=>{vlHover=vlTile(cv,e);vlDraw();};cv.onmouseleave=()=>{vlHover=null;vlDraw();};
}
function vlSkillBtns(st){return VL_CLS[st.p.cls].skills.map((k,i)=>'<button class="lrn-btn ghost" onclick="vlDo({t:\'skill\',n:'+(i+1)+'})" title="'+vlEsc(k.desc)+'">'+k.e+' '+k.name+' ('+k.key+')</button>').join('');}
function vlAuto(kind){
  if(!vl||vl.view!=='game'||vl.st.over)return;const st=vl.st;
  if(st.mobs.some(m=>st.vis[vlIdx(m.x,m.y)])){vlLog(st,'Ein Gegner ist in Sicht – erst kämpfen oder fliehen.');vlDraw();return;}
  let path=null,none='';
  if(kind==='stairs'){path=vlStairsPath(st);none='Die Treppe hast du noch nicht gesehen. Erkunde weiter (X).';}
  else{path=vlExplorePath(st);none=st.explored[vlIdx(st.stairs[0],st.stairs[1])]?'Hier gibt es nichts mehr zu erkunden – nimm die Treppe (T).':'Alles Erreichbare ist erkundet, aber die Treppe fehlt noch. Prüfe Ecken und Türen mit den Pfeiltasten.';}
  if(!path||!path.length){vlPath=null;vlLog(st,none);vlDraw();return;}
  vlPath=path;vlWalkStep();
}
function vlNewClick(){if(vlPr.run&&!confirm('Den laufenden Durchgang aufgeben und neu beginnen?'))return;vlPr.run=null;vlStart(false);}
function vlPickClass(id){if(!vlPr.cls.includes(id))return;vlPr.pick=id;vlSaveProf(vlPr,null);vlRender();}
function vlBuyClassClick(id){const r=vlBuyClass(vlPr,id);vlSaveProf(vlPr,null);if(r==='ok'&&typeof showToast==='function')showToast('Freigeschaltet: '+VL_CLS[id].name,1500);vlRender();}
function vlBuyClick(k){const r=vlBuy(vlPr,k);vlSaveProf(vlPr,null);if(r==='ok'&&typeof showToast==='function')showToast('Gekauft: '+VL_UP[k].name,1500);vlRender();}
function vlMenu(){vlPath=null;vl.shop=false;if(vl.st&&!vl.st.over)vlSaveProf(vlPr,vl.st);vlPr=vlProf();vl.view='menu';vlRender();}
function vlDo(act){if(!vl||vl.view!=='game'||!vl.st||vl.st.over||vl.shop)return;vlPath=null;vlTurn(act);}
function vlTurn(act){
  const st=vl.st,ok=vlAct(st,act);if(!ok){if(st.talk){st.talk=false;vlShopOpen();}vlDraw();return false;}
  const pend=vlMilestones(vlPr,st);if(pend.length){const sum=pend.reduce((a,m)=>a+m.coins,0);if(vlPay(sum)){pend.forEach(m=>{vlPr.rew.push(m.id);vlLog(st,'🪙 '+m.text+': +'+m.coins+' AppHub-Coins!');});}}
  if(st.over){const today=vlToday();if(vlDailyDue(vlPr,st.over,today)&&vlPay(VL_DAILY)){vlPr.daily=today;st.over.daily=VL_DAILY;}vlFinish(vlPr,st.over);vlSaveProf(vlPr,null);vlOverUi();}else vlSaveProf(vlPr,st);
  vlDraw();return true;
}
function vlOverUi(){
  const o=vl.st.over,el=document.getElementById('vl-over');if(!el)return;
  el.innerHTML='<div class="td-over"><div style="font-size:42px">☠️</div><div style="font-size:22px;font-weight:800">Du bist gefallen</div><div style="font-size:13px;margin:8px 0 12px;line-height:1.6">Etage '+o.depth+' · '+o.kills+' Siege · '+o.gold+' Gold · Stufe '+o.lvl+'<br>👻 <b>+'+o.souls+' Seelen</b> (gesamt '+vlPr.souls+')'+(o.daily?'<br>🪙 +'+o.daily+' AppHub-Coins (Tagesbonus)':'')+'</div><div style="display:flex;gap:8px"><button class="lrn-btn" onclick="vlMenu()">Stärkungen kaufen</button><button class="lrn-btn ghost" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)" onclick="vlStart(false)">Nochmal</button></div></div>';
}
/* Laden des Händlers (liegt über der Karte; kostet keinen Zug) */
function vlShopOpen(){vl.shop=true;vlPath=null;vlShopRender();}
function vlShopClose(){vl.shop=false;const el=document.getElementById('vl-over');if(el)el.innerHTML='';vlDraw();}
const VL_SHOP_WHY={gold:'Zu wenig Gold',sold:'Ausverkauft',full:'Du bist gesund',worse:'Nicht besser als deine Ausrüstung'};
function vlShopWhy(st,it){if(it.left<=0)return VL_SHOP_WHY.sold;if(it.k==='heal'&&st.p.hp>=st.p.max)return VL_SHOP_WHY.full;if(it.k==='weapon'&&st.p.weapon&&st.p.weapon.v>=it.v)return VL_SHOP_WHY.worse;if(it.k==='armor'&&st.p.armor&&st.p.armor.v>=it.v)return VL_SHOP_WHY.worse;if(st.p.gold<it.price)return VL_SHOP_WHY.gold;return '';}
function vlShopRender(){
  const el=document.getElementById('vl-over'),st=vl&&vl.st;if(!el||!st||!st.shop)return;
  const rows=st.shop.stock.map((it,i)=>{const why=vlShopWhy(st,it),label=it.k==='pot'?'🧪 Heiltrank <span style="opacity:.7">(noch '+it.left+')</span>':it.k==='heal'?'💖 Vollheilung':it.k==='weapon'?'🗡️ '+vlEsc(it.n)+' <span style="opacity:.7">(+'+it.v+' Angriff)</span>':'🛡️ '+vlEsc(it.n)+' <span style="opacity:.7">(+'+it.v+' Rüstung)</span>';
    return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.18);text-align:left"><div style="flex:1;font-size:13px">'+label+(why&&why!==VL_SHOP_WHY.gold?'<div style="font-size:11px;opacity:.7">'+why+'</div>':'')+'</div><button class="lrn-btn" '+(why?'disabled':'')+' onclick="vlShopClick('+i+')">'+it.price+' 💰</button></div>';}).join('');
  el.innerHTML='<div class="td-over"><div style="font-size:34px">🛒</div><div style="font-size:20px;font-weight:800">Händler</div><div style="font-size:13px;margin:4px 0 8px">Du hast <b>'+st.p.gold+' 💰</b> · ❤️ '+st.p.hp+'/'+st.p.max+'</div><div style="width:min(380px,92%)">'+rows+'</div><button class="lrn-btn ghost" style="margin-top:12px;background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)" onclick="vlShopClose()">Weiter (Esc)</button></div>';
}
function vlShopClick(i){if(!vl||!vl.st||!vl.shop)return;const r=vlShopBuy(vl.st,i);if(r==='ok'){vlSaveProf(vlPr,vl.st);}vlShopRender();vlDraw();}
/* Kamera: der Spieler in der Mitte, am Kartenrand angehalten */
const vlCam=st=>({x:Math.max(0,Math.min(VL_W-VL_VIEW_W,st.p.x-(VL_VIEW_W>>1))),y:Math.max(0,Math.min(VL_H-VL_VIEW_H,st.p.y-(VL_VIEW_H>>1)))});
function vlTile(cv,e){const r=cv.getBoundingClientRect(),c=vlCam(vl.st);return [Math.floor((e.clientX-r.left)/r.width*VL_VIEW_W)+c.x,Math.floor((e.clientY-r.top)/r.height*VL_VIEW_H)+c.y];}
/* Was ein Klick auf ein Feld bewirkt – immer mit Rückmeldung, nie stumm:
   Nachbarfeld = ziehen oder angreifen, Diagonale = ein Schritt über das freie Nachbarfeld, fernes Feld = hinlaufen (mit Gegner in Sicht nur ein vorsichtiger Schritt),
   eigenes Feld = warten, Wand oder unbekanntes Feld = kurzer Hinweis im Protokoll. */
function vlClickAction(st,x,y){
  const p=st.p,dx=x-p.x,dy=y-p.y;
  if(x<0||y<0||x>=VL_W||y>=VL_H)return {act:'msg',text:'Dort ist nichts.'};
  if(!dx&&!dy)return {act:'wait'};
  if(Math.abs(dx)+Math.abs(dy)===1)return vlWalk(st,x,y)||vlBlocked(st,x,y)?{act:'move',dx,dy}:{act:'msg',text:'Da ist eine Wand.'};
  if(!st.explored[vlIdx(x,y)])return {act:'msg',text:'Dorthin kennst du den Weg noch nicht.'};
  if(st.t[vlIdx(x,y)]===0)return {act:'msg',text:'Da ist eine Wand.'};
  if(Math.abs(dx)===1&&Math.abs(dy)===1){   // Diagonale: über das freie Nachbarfeld (bevorzugt eins ohne Gegner)
    const c=[[dx,0],[0,dy]].filter(d=>vlWalk(st,p.x+d[0],p.y+d[1]));
    if(c.length){const free=c.filter(d=>!vlMobAt(st,p.x+d[0],p.y+d[1]))[0]||c[0];return {act:'move',dx:free[0],dy:free[1]};}
    return {act:'msg',text:'Dort kommst du nicht direkt hin.'};
  }
  const path=vlFindPath(st,p.x,p.y,x,y);
  if(!path||!path.length)return {act:'msg',text:'Dorthin gibt es keinen bekannten Weg.'};
  if(st.mobs.some(m=>st.vis[vlIdx(m.x,m.y)]))return {act:'move',dx:path[0][0]-p.x,dy:path[0][1]-p.y};   // Gegner in Sicht: Schritt für Schritt
  return {act:'walk',path};
}
function vlClick(cv,e){
  if(!vl||vl.view!=='game'||vl.st.over)return;const [x,y]=vlTile(cv,e),a=vlClickAction(vl.st,x,y);
  if(a.act==='move')vlDo({t:'move',dx:a.dx,dy:a.dy});
  else if(a.act==='wait')vlDo({t:'wait'});
  else if(a.act==='walk'){vlPath=a.path;vlWalkStep();}
  else{vlPath=null;vlLog(vl.st,a.text);vlDraw();}
}
/* Automatische Wege meiden gesehene Fallen (der Dieb entschärft sie im Vorbeigehen) */
const vlAvoid=(st,x,y)=>{const t=vlTrapAt(st,x,y);return !!t&&t.seen&&st.p.cls!=='dieb';};
/* Nächstes Erkundungsziel: das nächste bekannte begehbare Feld, an das ein unbekanntes begehbares oder noch nie gesehenes Feld grenzt (Breitensuche über bekannte Felder, Gegner werden umgangen); null, wenn alles erkundet ist */
function vlExplorePath(st,noAvoid){
  const sx=st.p.x,sy=st.p.y,d=new Int16Array(VL_W*VL_H).fill(-1),from=new Int32Array(VL_W*VL_H).fill(-1),q=[sx,sy];d[vlIdx(sx,sy)]=0;
  const frontier=(x,y)=>{for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<=0||ny<=0||nx>=VL_W-1||ny>=VL_H-1)continue;const k=vlIdx(nx,ny);if(!st.explored[k])return true;}return false;};
  for(let i=0;i<q.length;i+=2){const x=q[i],y=q[i+1];
    if((x!==sx||y!==sy)&&frontier(x,y)){const path=[];let k=vlIdx(x,y);while(k!==vlIdx(sx,sy)){path.unshift([k%VL_W,Math.floor(k/VL_W)]);k=from[k];}return path;}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=vlIdx(nx,ny);if(!vlWalk(st,nx,ny)||st.t[k]===2||d[k]!==-1||!st.explored[k]||vlMobAt(st,nx,ny)||(!noAvoid&&vlAvoid(st,nx,ny)))continue;d[k]=d[vlIdx(x,y)]+1;from[k]=vlIdx(x,y);q.push(nx,ny);}}   // die Treppe wird beim Erkunden nicht betreten (sie führt hinab)
  return noAvoid?null:vlExplorePath(st,true);   // nur wenn es anders nicht geht, führt der Weg an einer bekannten Falle vorbei (das Laufen hält davor an)
}
/* Weg zur Treppe, wenn sie schon gesehen wurde */
function vlStairsPath(st){return st.explored[vlIdx(st.stairs[0],st.stairs[1])]?vlFindPath(st,st.p.x,st.p.y,st.stairs[0],st.stairs[1]):null;}
/* Weg zu einem Feld (Breitensuche über bekannte Felder; Gegner werden umgangen, der Zielpunkt selbst darf ein Gegner sein) */
function vlFindPath(st,sx,sy,tx,ty,noAvoid){
  const d=new Int16Array(VL_W*VL_H).fill(-1),from=new Int32Array(VL_W*VL_H).fill(-1),q=[sx,sy];d[vlIdx(sx,sy)]=0;
  for(let i=0;i<q.length;i+=2){const x=q[i],y=q[i+1];if(x===tx&&y===ty)break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=vlIdx(nx,ny);if(!(vlWalk(st,nx,ny)||(nx===tx&&ny===ty&&vlBlocked(st,nx,ny)))||d[k]!==-1||!st.explored[k]||(!noAvoid&&vlAvoid(st,nx,ny)&&!(nx===tx&&ny===ty))||(st.t[k]===2&&!(nx===tx&&ny===ty))||(vlMobAt(st,nx,ny)&&!(nx===tx&&ny===ty)))continue;d[k]=d[vlIdx(x,y)]+1;from[k]=vlIdx(x,y);q.push(nx,ny);}}
  if(d[vlIdx(tx,ty)]<0)return noAvoid?null:vlFindPath(st,sx,sy,tx,ty,true);const path=[];let k=vlIdx(tx,ty);while(k!==vlIdx(sx,sy)){path.unshift([k%VL_W,Math.floor(k/VL_W)]);k=from[k];}return path;
}
function vlWalkStep(){
  if(!vl||vl.view!=='game'||!vlPath||!vlPath.length||vl.st.over)return;
  const st=vl.st;if(st.mobs.some(m=>st.vis[vlIdx(m.x,m.y)])){vlPath=null;vlLog(st,'Gegner in Sicht – du hältst an.');vlDraw();return;}   // ein Gegner in Sicht beendet das Laufen
  if(vlAvoid(st,vlPath[0][0],vlPath[0][1])){vlPath=null;vlLog(st,'⚠️ Vor dir liegt eine bekannte Falle – geh selbst weiter.');vlDraw();return;}
  const n=vlPath.shift(),ok=vlTurn({t:'move',dx:n[0]-st.p.x,dy:n[1]-st.p.y});
  if(ok&&vlPath&&vlPath.length&&!vl.st.over)setTimeout(vlWalkStep,60);else vlPath=null;
}
/* Zeichnen */
function vlDraw(){
  const cv=document.getElementById('vl-canvas');if(!cv||!vl.st)return;const st=vl.st,ctx=cv.getContext('2d'),c=vlCam(st),T=VL_T;
  ctx.fillStyle='#0b0b12';ctx.fillRect(0,0,cv.width,cv.height);ctx.textAlign='center';ctx.textBaseline='middle';
  for(let ty=0;ty<VL_VIEW_H;ty++)for(let tx=0;tx<VL_VIEW_W;tx++){
    const x=tx+c.x,y=ty+c.y,k=vlIdx(x,y),seen=st.vis[k],mem=st.explored[k];if(!mem)continue;
    const t=st.t[k],px=tx*T,py=ty*T;
    if(t===0){ctx.fillStyle=seen?'#3b3550':'#24202f';ctx.fillRect(px,py,T,T);ctx.strokeStyle=seen?'#51496b':'#2e2a3c';ctx.strokeRect(px+.5,py+.5,T-1,T-1);}
    else{ctx.fillStyle=seen?((x+y)%2?'#2b2a38':'#302f3f'):'#1a1924';ctx.fillRect(px,py,T,T);if(t===2){ctx.font=Math.floor(T*0.7)+'px sans-serif';ctx.fillStyle='#fff';ctx.globalAlpha=seen?1:0.5;ctx.fillText('🪜',px+T/2,py+T/2+1);ctx.globalAlpha=1;}}
  }
  ctx.font=Math.floor(T*0.62)+'px "Segoe UI Emoji",sans-serif';
  for(const t of st.traps){if(!t.seen)continue;const tx=t.x-c.x,ty=t.y-c.y;if(tx<0||ty<0||tx>=VL_VIEW_W||ty>=VL_VIEW_H)continue;ctx.fillStyle='#fff';ctx.globalAlpha=st.vis[vlIdx(t.x,t.y)]?1:0.5;ctx.fillText('⚠️',tx*T+T/2,ty*T+T/2+1);ctx.globalAlpha=1;}
  for(const ch of st.chests){if(!st.explored[vlIdx(ch.x,ch.y)])continue;const tx=ch.x-c.x,ty=ch.y-c.y;if(tx<0||ty<0||tx>=VL_VIEW_W||ty>=VL_VIEW_H)continue;ctx.fillStyle='#fff';ctx.globalAlpha=st.vis[vlIdx(ch.x,ch.y)]?1:0.55;ctx.fillText('🧰',tx*T+T/2,ty*T+T/2+1);ctx.globalAlpha=1;}
  for(const it of st.items){if(!st.vis[vlIdx(it.x,it.y)])continue;const tx=it.x-c.x,ty=it.y-c.y;if(tx<0||ty<0||tx>=VL_VIEW_W||ty>=VL_VIEW_H)continue;
    if(it.r>0){ctx.strokeStyle=VL_RCOL[it.r];ctx.lineWidth=3;ctx.strokeRect(tx*T+3,ty*T+3,T-6,T-6);}   // Rahmen in der Farbe der Seltenheit
    ctx.fillStyle='#fff';ctx.fillText(it.kind==='pot'?'🧪':it.kind==='gold'?'💰':it.kind==='key'?'🗝️':it.kind==='weapon'?'🗡️':'🛡️',tx*T+T/2,ty*T+T/2+1);}
  if(st.shop&&st.explored[vlIdx(st.shop.x,st.shop.y)]){const tx=st.shop.x-c.x,ty=st.shop.y-c.y;if(tx>=0&&ty>=0&&tx<VL_VIEW_W&&ty<VL_VIEW_H){ctx.font=Math.floor(T*0.7)+'px "Segoe UI Emoji",sans-serif';ctx.fillStyle='#fff';ctx.globalAlpha=st.vis[vlIdx(st.shop.x,st.shop.y)]?1:0.55;ctx.fillText('🛒',tx*T+T/2,ty*T+T/2+1);ctx.globalAlpha=1;ctx.font=Math.floor(T*0.62)+'px "Segoe UI Emoji",sans-serif';}}
  for(const m of st.mobs){if(!st.vis[vlIdx(m.x,m.y)])continue;const tx=m.x-c.x,ty=m.y-c.y;if(tx<0||ty<0||tx>=VL_VIEW_W||ty>=VL_VIEW_H)continue;
    ctx.font=Math.floor(T*(m.boss?0.85:0.68))+'px "Segoe UI Emoji",sans-serif';ctx.fillStyle='#fff';ctx.fillText(m.e,tx*T+T/2,ty*T+T/2+1);
    if(m.frozen>0||m.burn>0){ctx.font=Math.floor(T*0.3)+'px "Segoe UI Emoji",sans-serif';ctx.fillText(m.frozen>0?'🧊':'🔥',tx*T+T-8,ty*T+9);}
    const w=T-6;ctx.fillStyle='#000';ctx.fillRect(tx*T+3,ty*T+T-6,w,4);ctx.fillStyle=m.hp/m.max>0.5?'#66bb6a':m.hp/m.max>0.25?'#ffca28':'#ef5350';ctx.fillRect(tx*T+3,ty*T+T-6,w*m.hp/m.max,4);}
  const px=(st.p.x-c.x)*T,py=(st.p.y-c.y)*T;ctx.font=Math.floor(T*0.7)+'px "Segoe UI Emoji",sans-serif';ctx.fillStyle='#fff';ctx.globalAlpha=st.p.hide>0?0.45:1;ctx.fillText(st.over?'🪦':VL_CLS[st.p.cls].e,px+T/2,py+T/2+1);ctx.globalAlpha=1;
  if(vlHover&&!st.over){const hx=(vlHover[0]-c.x)*T,hy=(vlHover[1]-c.y)*T;ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.strokeRect(hx+1,hy+1,T-2,T-2);}
  const p=st.p,hp=document.getElementById('vl-hp'),lv=document.getElementById('vl-lv'),eq=document.getElementById('vl-eq'),lg=document.getElementById('vl-log');
  if(hp)hp.innerHTML='❤️ <strong>'+p.hp+'</strong>/'+p.max+' · Etage <strong>'+st.depth+'</strong>';
  if(lv)lv.innerHTML='⭐ Stufe <strong>'+p.lvl+'</strong> ('+p.xp+'/'+vlXpNeed(p.lvl)+') · 💰 '+p.gold+' · 🧪 '+p.pots;
  if(eq)eq.innerHTML='🗡️ '+vlAtk(st)+' · 🛡️ '+vlDef(st);
  const sc=document.getElementById('vl-st');if(sc){const a=[];if(p.mpm)a.push('🔷 '+p.mp+'/'+p.mpm);if(p.keys)a.push('🗝️ '+p.keys);if(p.cd>0)a.push('⏳ '+p.cd);if(p.shield>0)a.push('🛡️ '+p.shield);if(p.hide>0)a.push('🌑 '+p.hide);if(p.poison>0)a.push('☠️ '+p.poison);sc.innerHTML=a.join(' · ')||'–';}
  if(lg)lg.innerHTML=st.log.slice(-6).map((m,i,a)=>'<div style="opacity:'+(0.45+0.55*(i+1)/a.length)+'">'+vlEsc(m)+'</div>').join('');
}
document.addEventListener('keydown',e=>{
  if(!vlActive()||!vl||vl.view!=='game'||e.ctrlKey||e.metaKey||e.altKey)return;
  if(vl.shop){if(e.key==='Escape'){e.preventDefault();vlShopClose();}return;}
  const k=e.key,M={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],'8':[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],'2':[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],'4':[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0],'6':[1,0]};
  if(M[k]){e.preventDefault();vlDo({t:'move',dx:M[k][0],dy:M[k][1]});}
  else if(k===' '||k==='.'||k==='5'){e.preventDefault();vlDo({t:'wait'});}
  else if(k==='q'||k==='Q'||k==='h'||k==='H'){e.preventDefault();vlDo({t:'drink'});}
  else if(k==='f'||k==='F'){e.preventDefault();vlDo({t:'skill',n:1});}
  else if(k==='g'||k==='G'){e.preventDefault();vlDo({t:'skill',n:2});}
  else if(k==='x'||k==='X'){e.preventDefault();vlAuto('explore');}
  else if(k==='t'||k==='T'||k==='>'){e.preventDefault();vlAuto('stairs');}
});
