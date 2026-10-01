/* ══════════════════════════════════
   ARENA-DUELL – Echtzeit-Kartenkampf im Stil von Clash Royale. Zwei Bahnen mit Brücken über den Fluss, je zwei Prinzessinnen-Türme und ein
   Königsturm. Elixir wächst von allein (in der letzten Minute doppelt so schnell); du spielst Karten aus deiner Hand von 4 auf deine Seite
   (Zauber überall), die Truppen laufen von allein zum nächsten Ziel und kämpfen. Gewonnen hat, wer nach 3 Minuten mehr Türme (Kronen) zerstört
   hat, der Königsturm zählt sofort alles. Bei Gleichstand gibt es 1 Minute Verlängerung (die erste Krone entscheidet).
   13 Karten, 10 Gegner mit wachsender Stärke, nach jedem Sieg eine neue Karte, Deck aus 8 Karten. Sterne: 1 = Sieg, 2 = mit 2 Kronen, 3 = mit 3 Kronen.
   AppHub-Coins einmalig für das erste Schaffen und für neue Sterne. Fortschritt je Konto: zf_arena
   Die Regeln (arStep) sind von der Oberfläche getrennt und rein deterministisch (Zufall nur aus einem Startwert); der Computer-Gegner (arThink) wird
   auch von tests/arena-bot.js benutzt, das beweist, dass jeder Gegner mit dem Startdeck zu schlagen ist.
══════════════════════════════════ */
const AR_KEY='zf_arena';
const AR_W=18,AR_H=32,AR_DT=0.05,AR_RIVER=[15.4,16.6],AR_BRIDGES=[3.5,14.5],AR_BHW=1.6,AR_MATCH=180,AR_OVER=60,AR_MAXEL=10,AR_SPAWN=0.8;

/* ── Einheiten (Werte in Kacheln und Sekunden) ── */
const AR_UNITS={
  knight:{n:'Ritter',ic:'⚔️',hp:800,dmg:90,hit:1.2,rng:0.5,spd:1.5,sight:5.5,air:0,fly:0,r:0.6},
  archer:{n:'Bogenschützin',ic:'🏹',hp:250,dmg:50,hit:1.0,rng:5,spd:1.5,sight:6.5,air:1,fly:0,r:0.45},
  giant:{n:'Riese',ic:'🗿',hp:2200,dmg:130,hit:1.5,rng:0.7,spd:1.0,sight:5.5,air:0,fly:0,r:0.9,bldg:1},
  goblin:{n:'Kobold',ic:'👺',hp:160,dmg:60,hit:0.9,rng:0.5,spd:3,sight:5.5,air:0,fly:0,r:0.4},
  skel:{n:'Skelett',ic:'💀',hp:60,dmg:55,hit:1.0,rng:0.5,spd:2.2,sight:5,air:0,fly:0,r:0.35},
  drake:{n:'Baby-Drache',ic:'🐲',hp:900,dmg:100,hit:1.7,rng:3.5,spd:2,sight:6,air:1,fly:1,r:0.7,splash:1.3},
  wizard:{n:'Magier',ic:'🧙',hp:340,dmg:130,hit:1.4,rng:5,spd:1.5,sight:6.5,air:1,fly:0,r:0.5,splash:1.4},
  mini:{n:'Mini-P.E.K.K.A',ic:'🤖',hp:750,dmg:310,hit:1.8,rng:0.6,spd:2.2,sight:5.5,air:0,fly:0,r:0.6},
  musk:{n:'Musketierin',ic:'🔫',hp:420,dmg:120,hit:1.0,rng:6,spd:1.5,sight:7,air:1,fly:0,r:0.5},
  balloon:{n:'Ballon',ic:'🎈',hp:1100,dmg:350,hit:3,rng:0.6,spd:1.5,sight:5,air:0,fly:1,r:0.7,bldg:1},
  cannon:{n:'Kanone',ic:'💣',hp:600,dmg:100,hit:0.9,rng:5.5,spd:0,sight:5.5,air:0,fly:0,r:0.8,building:1,life:30}
};
/* ── Karten ── */
const AR_CARDS={
  knight:{n:'Ritter',ic:'⚔️',cost:3,role:'tank',units:[['knight',1]],desc:'Zäher Nahkämpfer.'},
  archers:{n:'Bogenschützinnen',ic:'🏹',cost:3,role:'support',units:[['archer',2]],desc:'Zwei Fernkämpferinnen, treffen auch Flieger.'},
  giant:{n:'Riese',ic:'🗿',cost:5,role:'tank',units:[['giant',1]],desc:'Greift nur Gebäude und Türme an, hält enorm viel aus.'},
  goblins:{n:'Kobolde',ic:'👺',cost:2,role:'swarm',units:[['goblin',3]],desc:'Drei schnelle Kämpfer.'},
  skeletons:{n:'Skelette',ic:'💀',cost:1,role:'swarm',units:[['skel',3]],desc:'Drei Skelette für nur 1 Elixier – lenken gut ab.'},
  drake:{n:'Baby-Drache',ic:'🐲',cost:4,role:'air',units:[['drake',1]],desc:'Fliegt, Flächenschaden.'},
  wizard:{n:'Magier',ic:'🧙',cost:5,role:'support',units:[['wizard',1]],desc:'Starker Flächenschaden aus der Ferne.'},
  mini:{n:'Mini-P.E.K.K.A',ic:'🤖',cost:4,role:'tank',units:[['mini',1]],desc:'Schlägt brutal hart zu.'},
  musk:{n:'Musketierin',ic:'🔫',cost:4,role:'support',units:[['musk',1]],desc:'Große Reichweite, trifft auch Flieger.'},
  balloon:{n:'Ballon',ic:'🎈',cost:5,role:'air',units:[['balloon',1]],desc:'Fliegt direkt auf Türme und Gebäude zu.'},
  cannon:{n:'Kanone',ic:'💣',cost:3,role:'building',units:[['cannon',1]],desc:'Gebäude für 30 s, schießt auf Bodentruppen.'},
  fireball:{n:'Feuerball',ic:'🔥',cost:4,role:'spell',spell:{rad:2.5,dmg:420,delay:0.8,tw:0.35},desc:'Flächenschaden (Türme nehmen nur 35 %).'},
  arrows:{n:'Pfeile',ic:'🌧️',cost:3,role:'spell',spell:{rad:4,dmg:160,delay:0.5,tw:0.35},desc:'Trifft alles im großen Feld, auch Flieger.'}
};
const AR_START=['knight','archers','giant','goblins','skeletons','cannon','fireball','arrows'];
const AR_UNLOCK=['drake','mini','musk','wizard','balloon'];      // neue Karten durch Siege (1., 2., … Level)
const AR_TOWER={princess:{hp:1500,dmg:70,hit:0.8,rng:7.5,r:1.5},king:{hp:2800,dmg:80,hit:1.0,rng:7,r:2}};
const AR_TOWER_POS=[   // Seite 0 (unten, du) und Seite 1 (oben, Gegner)
  [{t:'princess',x:3.5,y:25.5},{t:'princess',x:14.5,y:25.5},{t:'king',x:9,y:29.2}],
  [{t:'princess',x:3.5,y:6.5},{t:'princess',x:14.5,y:6.5},{t:'king',x:9,y:2.8}]
];

function arRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

/* ── Zustand ── */
function arNewState(deck0,deck1,seed,opt){
  opt=opt||{};
  const rng=arRng(seed||1);
  const mk=(deck)=>{const d=deck.slice();for(let i=d.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return {hand:d.slice(0,4),queue:d.slice(4)};};
  const st={t:0,mode:'play',over:false,overtime:false,rng,nid:1,ents:[],spells:[],fx:[],crowns:[0,0],elixir:[5,5],elMul:[1,opt.elMul1||1],decks:[mk(deck0),mk(deck1)],plays:[0,0],ai:[null,null],log:[]};
  for(let s=0;s<2;s++)AR_TOWER_POS[s].forEach((p,i)=>{
    const T=AR_TOWER[p.t],mul=s===1&&opt.towerMul?opt.towerMul:1;
    st.ents.push({id:st.nid++,side:s,kind:p.t,tower:1,idx:i,x:p.x,y:p.y,hp:T.hp*mul,maxhp:T.hp*mul,dmg:T.dmg,hit:T.hit,rng:T.rng,r:T.r,cd:0,air:1,fly:0,active:p.t!=='king',building:1});
  });
  return st;
}
function arDist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function arAlive(st,side){return st.ents.filter(e=>e.hp>0&&(side===undefined||e.side===side));}
function arTowerAlive(st,side,idx){return st.ents.some(e=>e.tower&&e.side===side&&e.idx===idx&&e.hp>0);}
/* Wo darf Seite `side` etwas hinstellen? Eigene Hälfte, nach einem zerstörten Prinzessinnen-Turm auch die Bahn davor */
function arCanPlace(st,side,card,x,y){
  const C=AR_CARDS[card];if(!C)return false;
  if(x<0.5||x>AR_W-0.5||y<0.5||y>AR_H-0.5)return false;
  if(C.spell)return true;
  const mine=side===0?y>=AR_RIVER[1]+0.6:y<=AR_RIVER[0]-0.6;
  if(mine)return true;
  const lane=x<AR_W/2?0:1,enemy=1-side;
  if(!arTowerAlive(st,enemy,lane)){const edge=side===0?AR_H/2-4.5:AR_H/2+4.5;return side===0?y>=edge:y<=edge;}
  return false;
}
/* Karte aus der Hand spielen; gibt die neuen Einheiten zurück oder null */
function arPlay(st,side,handIdx,x,y){
  if(st.mode!=='play')return null;
  const dk=st.decks[side],card=dk.hand[handIdx],C=AR_CARDS[card];
  if(!C||Math.floor(st.elixir[side]+1e-9)<C.cost||!arCanPlace(st,side,card,x,y))return null;
  st.elixir[side]-=C.cost;
  dk.hand[handIdx]=dk.queue.shift();dk.queue.push(card);st.plays[side]++;
  const made=[];
  if(C.spell){st.spells.push({side,x,y,rad:C.spell.rad,dmg:C.spell.dmg,tw:C.spell.tw,t:C.spell.delay,card});}
  else C.units.forEach(([k,n])=>{
    for(let i=0;i<n;i++){
      const U=AR_UNITS[k],off=n>1?[(i-(n-1)/2)*0.9,((i%2)*0.5)*(side===0?1:-1)]:[0,0];
      const e={id:st.nid++,side,kind:k,card,x:x+off[0],y:y+off[1],hp:U.hp,maxhp:U.hp,dmg:U.dmg,hit:U.hit,rng:U.rng,r:U.r,air:U.air,fly:U.fly,spd:U.spd,sight:U.sight,cd:0.3,spawn:AR_SPAWN,tid:0,rt:0,px:x,py:y,building:U.building?1:0,bldg:U.bldg||0,splash:U.splash||0,life:U.life||0};
      st.ents.push(e);made.push(e);
    }
  });
  return made;
}
function arPosOk(e){return true;}
/* Ziel für eine Einheit wählen */
function arPickTarget(st,u){
  let best=null,bd=1e9;
  const valid=t=>t.hp>0&&t.side!==u.side&&(!t.fly||u.air)&&!(t.spawn>0&&!t.building);
  for(const t of st.ents){
    if(!valid(t))continue;
    if(u.bldg&&!t.building)continue;
    const d=arDist(u,t)-t.r;
    if(!u.bldg&&d>u.sight)continue;
    if(d<bd){bd=d;best=t;}
  }
  if(best)return best;
  // Ziel in der Ferne: der Turm in der eigenen Bahn, sonst irgendeiner (zuletzt der König)
  const lane=u.x<AR_W/2?0:1;let tw=null;
  for(const t of st.ents)if(t.tower&&t.hp>0&&t.side!==u.side&&t.kind==='princess'&&t.idx===lane)tw=t;
  if(!tw)for(const t of st.ents)if(t.tower&&t.hp>0&&t.side!==u.side){const d=arDist(u,t);if(!tw||d<arDist(u,tw))tw=t;}
  return tw;
}
/* Wegpunkt für Bodentruppen: über eine Brücke */
function arWaypoint(u,tx,ty){
  if(u.fly)return [tx,ty];
  const north=u.y>AR_RIVER[1],south=u.y<AR_RIVER[0];
  if((north&&ty<AR_RIVER[0])||(south&&ty>AR_RIVER[1])){
    let bx=AR_BRIDGES[0];if(Math.abs(u.x-AR_BRIDGES[1])<Math.abs(u.x-AR_BRIDGES[0]))bx=AR_BRIDGES[1];
    const entryY=north?AR_RIVER[1]+0.3:AR_RIVER[0]-0.3;
    if(Math.abs(u.x-bx)>AR_BHW*0.6&&Math.abs(u.y-entryY)<5)return [bx,north?AR_RIVER[1]+1.2:AR_RIVER[0]-1.2];
    if(Math.abs(u.x-bx)>AR_BHW*0.6)return [bx,u.y+(ty<u.y?-0.5:0.5)];
    return [bx,ty];
  }
  if(u.y>=AR_RIVER[0]&&u.y<=AR_RIVER[1]){   // im Fluss: auf der Brücke bleiben
    let bx=AR_BRIDGES[0];if(Math.abs(u.x-AR_BRIDGES[1])<Math.abs(u.x-AR_BRIDGES[0]))bx=AR_BRIDGES[1];
    return [Math.abs(u.x-bx)>AR_BHW?bx:tx,ty];
  }
  return [tx,ty];
}
function arHit(st,a,t){   // a trifft t (mit Flächenschaden)
  const dealt=(x,f)=>{x.hp-=a.dmg*(f||1);x.hurt=0.12;if(x.tower&&x.kind==='king')x.active=true;};
  dealt(t);
  if(a.splash){for(const o of st.ents)if(o!==t&&o.hp>0&&o.side!==a.side&&(!o.fly||a.air)&&arDist(o,t)<=a.splash)dealt(o);}
  if(st.fx.length<60)st.fx.push({t:0.18,ax:a.x,ay:a.y,bx:t.x,by:t.y,kind:a.tower?'tshot':a.rng>1.5?'shot':'hit',side:a.side});
}
function arMove(u,tx,ty,dt){
  const w=arWaypoint(u,tx,ty),dx=w[0]-u.x,dy=w[1]-u.y,d=Math.hypot(dx,dy);
  if(d<1e-6)return;
  const s=Math.min(d,u.spd*dt);u.x+=dx/d*s;u.y+=dy/d*s;
}
function arStep(st){
  if(st.mode!=='play')return;
  const dt=AR_DT;st.t+=dt;
  const last=st.t>=AR_MATCH-60;
  for(let s=0;s<2;s++)st.elixir[s]=Math.min(AR_MAXEL,st.elixir[s]+dt/2.8*(last?2:1)*st.elMul[s]);
  /* Zauber */
  for(let i=st.spells.length-1;i>=0;i--){
    const sp=st.spells[i];sp.t-=dt;
    if(sp.t<=0){
      st.ents.forEach(e=>{if(e.hp>0&&e.side!==sp.side&&arDist(e,sp)<=sp.rad+e.r*0.5){e.hp-=e.tower?sp.dmg*sp.tw:sp.dmg;e.hurt=0.15;if(e.tower&&e.kind==='king')e.active=true;}});
      st.fx.push({t:0.35,ax:sp.x,ay:sp.y,rad:sp.rad,kind:'boom',side:sp.side});st.spells.splice(i,1);
    }
  }
  /* Einheiten und Türme */
  for(const u of st.ents){
    if(u.hp<=0)continue;
    if(u.hurt>0)u.hurt-=dt;
    if(u.cd>0)u.cd-=dt;
    if(u.life){u.hp-=u.maxhp/u.life*dt;if(u.hp<=0)continue;}
    if(u.spawn>0){u.spawn-=dt;continue;}
    if(u.tower&&!u.active)continue;
    // Ziel
    let t=u.tid?st.ents.find(e=>e.id===u.tid):null;
    u.rt-=dt;
    const stillOk=t&&t.hp>0&&(!t.fly||u.air)&&(u.bldg?t.building:true)&&arDist(u,t)-t.r<=(u.sight?u.sight*1.4:u.rng+0.5);
    if(!stillOk||u.rt<=0){
      if(u.tower){t=null;let bd=1e9;for(const o of st.ents)if(o.hp>0&&o.side!==u.side&&!o.building&&!(o.spawn>0)){const d=arDist(u,o)-o.r;if(d<=u.rng&&d<bd){bd=d;t=o;}}}
      else t=arPickTarget(st,u);
      u.tid=t?t.id:0;u.rt=0.3;
    }
    if(!t)continue;
    const d=arDist(u,t)-t.r;
    if(d<=u.rng+0.05){
      if(u.cd<=0){u.cd=u.hit;arHit(st,u,t);}
    }else if(!u.tower&&u.spd>0){
      u.px=u.x;u.py=u.y;
      arMove(u,t.x,t.y,dt);
    }
  }
  /* Abstand halten (Bodentruppen schieben sich weg, Türme sind fest) und im Fluss auf der Brücke bleiben */
  const mov=st.ents.filter(e=>e.hp>0&&!e.building&&!e.fly&&!(e.spawn>0));
  for(let i=0;i<mov.length;i++){
    const a=mov[i];
    for(let j=i+1;j<mov.length;j++){
      const b=mov[j],dx=b.x-a.x,dy=b.y-a.y,m=a.r+b.r,d2=dx*dx+dy*dy;
      if(d2<m*m&&d2>1e-8){const d=Math.sqrt(d2),push=(m-d)/2*0.5;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;}
    }
    for(const t of st.ents)if(t.tower&&t.hp>0&&t.side!==a.side){
      const dx=a.x-t.x,dy=a.y-t.y,m=a.r+t.r*0.8,d2=dx*dx+dy*dy;
      if(d2<m*m&&d2>1e-8){const d=Math.sqrt(d2);a.x=t.x+dx/d*m;a.y=t.y+dy/d*m;}
    }
    if(a.y>AR_RIVER[0]&&a.y<AR_RIVER[1]){
      const onB=AR_BRIDGES.some(bx=>Math.abs(a.x-bx)<=AR_BHW+0.3);
      if(!onB){a.y=a.py!==undefined&&a.py>=AR_RIVER[1]?AR_RIVER[1]:AR_RIVER[0];}
    }
    a.x=Math.max(0.3,Math.min(AR_W-0.3,a.x));
  }
  /* Tote entfernen, Kronen zählen */
  for(const e of st.ents)if(e.hp<=0&&!e.gone){
    e.gone=1;
    if(e.tower){
      const other=1-e.side;
      if(e.kind==='king'){st.crowns[other]=3;}
      else{st.crowns[other]++;const k=st.ents.find(o=>o.tower&&o.side===e.side&&o.kind==='king');if(k)k.active=true;}
      st.log.push({t:st.t,tower:e.kind,side:e.side});
    }
  }
  st.ents=st.ents.filter(e=>e.hp>0||(e.tower&&true));
  st.fx=st.fx.filter(f=>(f.t-=dt)>0);
  /* Ende */
  if(st.crowns[0]>=3||st.crowns[1]>=3){arEnd(st);return;}
  if(!st.overtime&&st.t>=AR_MATCH){
    if(st.crowns[0]!==st.crowns[1]){arEnd(st);return;}
    st.overtime=true;
  }
  if(st.overtime){
    if(st.crowns[0]!==st.crowns[1]){arEnd(st);return;}
    if(st.t>=AR_MATCH+AR_OVER){arEnd(st);return;}
  }
  for(let s=0;s<2;s++)if(st.ai[s])arThink(st,s,st.ai[s]);
}
function arEnd(st){st.mode=st.crowns[0]>st.crowns[1]?'won':st.crowns[0]<st.crowns[1]?'lost':'draw';}
/* Türme, die nach dem Ende noch stehen, werden nicht mehr gebraucht – ihr Zustand bleibt für die Anzeige erhalten */

/* ── Computer-Gegner (auch der Test-Bot für die Spielerseite) ──
   P = {delay: Mindestabstand zwischen zwei Karten in s, acc: Wahrscheinlichkeit für die kluge Wahl, wait: ab so viel Elixier greift er an,
        spells: darf Zauber nutzen} */
function arThreat(st,side){
  const lanes=[0,0];
  for(const e of st.ents){
    if(e.hp<=0||e.side===side||e.tower||e.building||e.spawn>0)continue;
    const mine=side===0?e.y>AR_RIVER[1]-3:e.y<AR_RIVER[0]+3;   // auf meiner Seite oder kurz davor
    if(mine)lanes[e.x<AR_W/2?0:1]+=e.hp;
  }
  return lanes;
}
function arThink(st,side,P){
  const ai=st.aiMem||(st.aiMem=[{next:0},{next:0}]),m=ai[side];
  if(st.t<m.next)return;
  const dk=st.decks[side],el=Math.floor(st.elixir[side]+1e-9),rng=st.rng;
  const hand=dk.hand.map((c,i)=>({c,i,C:AR_CARDS[c]})).filter(h=>h.C.cost<=el);
  if(!hand.length)return;
  const dir=side===0?-1:1,home=side===0?AR_H:0;   // „vorwärts“ ist für Seite 0 nach oben (y wird kleiner)
  const back=side===0?AR_H-4:4,front=side===0?AR_RIVER[1]+3.5:AR_RIVER[0]-3.5;
  const th=arThreat(st,side),tot=th[0]+th[1],clever=rng()<P.acc;
  const enemies=st.ents.filter(e=>e.hp>0&&e.side!==side&&!e.tower&&!e.building&&!(e.spawn>0));
  const lane=th[0]>=th[1]?0:1,lx=lane===0?3.5:14.5;
  const pick=pred=>hand.filter(pred);
  const play=(h,x,y)=>{if(arPlay(st,side,h.i,x,y)){m.next=st.t+P.delay*(0.8+rng()*0.4);return true;}return false;};
  // 1. Zauber: Ansammlungen bekämpfen, wenn erlaubt
  if(P.spells&&clever){
    let bestS=null;
    for(const h of pick(h=>h.C.spell)){
      for(const e of enemies){
        let n=0,hp=0;for(const o of enemies)if(arDist(o,e)<=h.C.spell.rad){n++;hp+=Math.min(o.hp,h.C.spell.dmg);}
        const val=hp+(e.y*0)*0;if(n>=3&&hp>=h.C.cost*160&&(!bestS||val>bestS.val))bestS={h,x:e.x,y:e.y,val};
      }
    }
    if(bestS&&play(bestS.h,bestS.x,bestS.y))return;
  }
  // 2. Verteidigen
  if(tot>0){
    const air=enemies.some(e=>e.fly&&(e.x<AR_W/2?0:1)===lane);
    const heavy=th[lane]>=1200;
    let opts=pick(h=>!h.C.spell&&h.C.role!=='building'&&(!air||AR_UNITS[h.C.units[0][0]].air));
    if(!air&&clever){const cn=pick(h=>h.C.role==='building');opts=cn.concat(opts);}
    if(!opts.length)opts=pick(h=>!h.C.spell);
    if(opts.length){
      const sel=clever?(heavy?opts.sort((a,b)=>b.C.cost-a.C.cost)[0]:opts.sort((a,b)=>a.C.cost-b.C.cost)[0]):opts[Math.floor(rng()*opts.length)];
      const t=enemies.filter(e=>(e.x<AR_W/2?0:1)===lane).sort((a,b)=>(side===0?b.y-a.y:a.y-b.y))[0];
      const ty=side===0?Math.max(AR_RIVER[1]+3,Math.min(AR_H-6,(t?t.y:front)+3)):Math.min(AR_RIVER[0]-3,Math.max(6,(t?t.y:front)-3));
      const off=sel.C.role==='tank'?0:(lane===0?1.5:-1.5);
      if(play(sel,Math.max(1,Math.min(AR_W-1,lx+off)),sel.C.role==='building'?(side===0?AR_H-10:10):ty))return;
    }
  }
  // 3. Angreifen: Unterstützung hinter einen laufenden Angriff stellen, sonst mit einem Panzer (Tank/Flieger) im Rücken einer Bahn beginnen
  const own=st.ents.filter(e=>e.hp>0&&e.side===side&&!e.tower&&!e.building&&e.spawn<=0);
  const lead=own.filter(e=>e.bldg||e.maxhp>=700).sort((x,y)=>(side===0?x.y-y.y:y.y-x.y))[0];
  const behind=(l)=>side===0?Math.min(AR_H-2,Math.max(AR_RIVER[1]+0.8,l.y+2.5)):Math.max(2,Math.min(AR_RIVER[0]-0.8,l.y-2.5));
  if(lead&&el>=3){
    const sup=pick(h=>!h.C.spell&&h.C.role!=='building'&&h.C.role!=='tank').sort((x,y)=>y.C.cost-x.C.cost);
    if(sup.length){const h=clever?sup[0]:sup[Math.floor(rng()*sup.length)];if(play(h,lead.x+(lead.x<9?0.8:-0.8),behind(lead)))return;}
  }
  if(el>=(st.t>AR_MATCH-30?Math.min(P.wait,4):P.wait)){
    const w=[0,1].map(l=>{let q=0;for(const e of st.ents)if(e.hp>0&&e.side!==side&&!e.tower&&(e.x<AR_W/2?0:1)===l)q+=e.hp;if(arTowerAlive(st,1-side,l))q+=1000;return q;});
    const lanePick=rng()<0.65?(w[0]<=w[1]?0:1):Math.floor(rng()*2);
    const ax=lanePick===0?3.5:14.5;
    const opts=pick(h=>!h.C.spell&&h.C.role!=='building');
    if(!opts.length)return;
    const tank=opts.filter(h=>h.C.role==='tank'||h.C.role==='air');
    const sel=clever&&tank.length?tank.sort((x,y)=>y.C.cost-x.C.cost)[0]:(clever?opts.sort((x,y)=>y.C.cost-x.C.cost)[0]:opts[Math.floor(rng()*opts.length)]);
    const tower=!arTowerAlive(st,1-side,lanePick);
    const y=sel.C.role==='tank'||sel.C.role==='air'?back:(side===0?AR_H-7:7);
    if(play(sel,ax,tower?front:y))return;
  }
}
/* ── Gegner (10 Stufen) ── */
const AR_LEVELS=[
  {id:'a1',name:'Rekrut Rudi',hue:120,deck:['knight','archers','goblins','skeletons','giant','cannon','arrows','fireball'],P:{delay:7,acc:0.25,wait:9,spells:false},towerMul:0.5,elMul:0.8},
  {id:'a2',name:'Wächter Willi',hue:100,deck:['knight','archers','goblins','skeletons','giant','cannon','arrows','fireball'],P:{delay:6,acc:0.35,wait:9,spells:false},towerMul:0.6,elMul:0.85},
  {id:'a3',name:'Kobold-König',hue:140,deck:['goblins','skeletons','archers','knight','mini','cannon','arrows','fireball'],P:{delay:5.5,acc:0.4,wait:8,spells:true},towerMul:0.65,elMul:0.85},
  {id:'a4',name:'Riesen-Rita',hue:30,deck:['giant','knight','musk','archers','goblins','cannon','fireball','arrows'],P:{delay:4.5,acc:0.55,wait:8,spells:true},towerMul:0.8,elMul:0.9},
  {id:'a5',name:'Luftflotte',hue:200,deck:['drake','balloon','archers','musk','knight','skeletons','arrows','cannon'],P:{delay:5.2,acc:0.4,wait:7,spells:true},towerMul:1,elMul:0.9},
  {id:'a6',name:'Magier-Max',hue:270,deck:['wizard','knight','giant','archers','goblins','skeletons','fireball','arrows'],P:{delay:4,acc:0.55,wait:7,spells:true},towerMul:1,elMul:0.95},
  {id:'a7',name:'Eisenfaust',hue:0,deck:['mini','giant','musk','knight','goblins','cannon','fireball','arrows'],P:{delay:3.6,acc:0.62,wait:7,spells:true},towerMul:1,elMul:1},
  {id:'a8',name:'Drachenmeisterin',hue:320,deck:['drake','balloon','wizard','musk','knight','skeletons','arrows','fireball'],P:{delay:3.6,acc:0.62,wait:6,spells:true},towerMul:1,elMul:0.95},
  {id:'a9',name:'Großmeister',hue:50,deck:['giant','mini','knight','archers','drake','goblins','fireball','arrows'],P:{delay:3.8,acc:0.55,wait:6,spells:true},towerMul:1,elMul:0.95},
  {id:'a10',name:'Königin Nova',hue:290,deck:['giant','balloon','wizard','mini','musk','knight','fireball','arrows'],P:{delay:2.9,acc:0.74,wait:6,spells:true},towerMul:1,elMul:1.05}
];
function arLevelState(idx,deck,seed,player){
  const L=AR_LEVELS[idx],st=arNewState(deck,L.deck,seed,{towerMul:L.towerMul,elMul1:L.elMul});
  st.ai[1]=L.P;if(player)st.ai[0]=player;return st;
}
function arStarsFor(crowns){return crowns>=3?3:crowns>=2?2:1;}

/* ── Fortschritt je Konto ── */
function arAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function arProfAll(){try{const o=JSON.parse(localStorage.getItem(AR_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function arOpenCards(done){return AR_START.concat(AR_UNLOCK.slice(0,done));}
function arProf(){
  const all=arProfAll(),p=all[arAccount().toLowerCase()||'_gast']||{};
  const lv={};AR_LEVELS.forEach(L=>{const r=p.lv&&p.lv[L.id]||{};lv[L.id]={done:!!r.done,stars:Math.min(3,r.stars|0),crowns:Math.min(3,r.crowns|0),wins:r.wins|0,plays:r.plays|0};});
  const done=AR_LEVELS.filter(L=>lv[L.id].done).length,open=arOpenCards(done);
  let deck=Array.isArray(p.deck)?p.deck.filter((c,i,a)=>open.includes(c)&&a.indexOf(c)===i):[];
  if(deck.length!==8)deck=AR_START.slice();
  return {name:arAccount(),lv,deck,open,done};
}
function arSaveProf(p){const all=arProfAll();all[arAccount().toLowerCase()||'_gast']={lv:p.lv,deck:p.deck};try{localStorage.setItem(AR_KEY,JSON.stringify(all));}catch(e){}}
function arUnlocked(p,i){return i===0||p.lv[AR_LEVELS[i-1].id].done;}
function arTotalStars(p){return AR_LEVELS.reduce((n,L)=>n+p.lv[L.id].stars,0);}
function arPay(n){try{const name=arAccount();if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
/* Ergebnis verbuchen: Sterne nach Kronen (1 Sieg, 2 mit 2 Kronen, 3 mit 3), einmalige AppHub-Coins (5 für das Level, 3 je neuen Stern), neue Karte beim ersten Sieg */
function arRecord(idx,res){
  const L=AR_LEVELS[idx],p=arProf(),r=p.lv[L.id];
  r.plays++;
  const out={stars:0,newStars:0,paid:0,firstClear:false,newCard:null};
  if(res.mode==='won'){
    const s=arStarsFor(res.crowns),before=r.stars;
    out.firstClear=!r.done;r.done=true;r.wins++;r.crowns=Math.max(r.crowns,res.crowns);r.stars=Math.max(before,s);
    out.newStars=r.stars-before;out.stars=s;out.paid=arPay((out.firstClear?5:0)+out.newStars*3);
    if(out.firstClear&&idx<AR_UNLOCK.length)out.newCard=AR_UNLOCK[idx];
  }
  arSaveProf(p);return out;
}
function arSetDeck(deck){const p=arProf();if(deck.length!==8||new Set(deck).size!==8||!deck.every(c=>p.open.includes(c)))return false;p.deck=deck.slice();arSaveProf(p);return true;}

/* ── Töne ── */
function arRegisterSounds(){
  if(typeof SFX_SOUNDS==='undefined'||typeof sfxTone!=='function'||SFX_SOUNDS.arCard)return;
  Object.assign(SFX_SOUNDS,{
    arCard:c=>sfxTone(c,420,0.08,'square',0.06,0,640),
    arNo:c=>sfxTone(c,150,0.1,'sawtooth',0.05),
    arBoom:c=>{sfxNoise(c,0.3,0.2,0,500);sfxTone(c,120,0.25,'sine',0.12,0,40);},
    arTower:c=>{sfxNoise(c,0.4,0.25,0,300);sfxTone(c,90,0.4,'sawtooth',0.12,0,30);},
    arWin:c=>[523,659,784,1046,1319].forEach((f,i)=>sfxTone(c,f,0.2,'triangle',0.16,i*0.09)),
    arLose:c=>[392,330,262].forEach((f,i)=>sfxTone(c,f,0.25,'triangle',0.14,i*0.16))
  });
  if(typeof SFX_GAME_SCREENS!=='undefined'&&!SFX_GAME_SCREENS.includes('screen-arena'))SFX_GAME_SCREENS.push('screen-arena');
}
function arSfx(n){try{if(typeof sfx==='function')sfx(n);}catch(e){}}

/* ── Oberfläche ── */
const AR_S=20;   // Pixel je Kachel
let ar=null,arView='menu',arRaf=null,arLast=0,arAcc=0,arSel=-1,arHover=null,arMsg='';
function arActive(){const s=document.getElementById('screen-arena');return !!s&&s.classList.contains('active');}
function arInit(){arRegisterSounds();arStopLoop();arView='menu';ar=null;arSel=-1;arRenderView();}
function arStopLoop(){if(arRaf){cancelAnimationFrame(arRaf);arRaf=null;}}
function arShowMenu(){arStopLoop();arView='menu';ar=null;arRenderView();}
function arStart(idx){
  const p=arProf();if(idx<0||idx>=AR_LEVELS.length||!arUnlocked(p,idx))return;
  if(p.deck.length!==8){arMsg='Dein Deck braucht genau 8 Karten.';arRenderView();return;}
  const st=arLevelState(idx,p.deck,(Date.now()&0xffff)+1,null);
  ar={idx,L:AR_LEVELS[idx],st,paused:false,over:null,seen:{crowns:[0,0],plays:0}};
  arSel=-1;arHover=null;arView='game';arRenderView();arLast=0;arAcc=0;arStopLoop();arRaf=requestAnimationFrame(arLoop);
}
function arRestart(){if(ar)arStart(ar.idx);}
function arNext(){if(ar&&ar.idx+1<AR_LEVELS.length)arStart(ar.idx+1);else arShowMenu();}
function arTogglePause(){if(!ar||ar.over)return;ar.paused=!ar.paused;arRenderView();}
function arLoop(ts){
  if(!arActive()||!ar||arView!=='game'){arRaf=null;return;}
  if(!arLast)arLast=ts;
  arAcc+=Math.min(200,ts-arLast);arLast=ts;
  while(arAcc>=AR_DT*1000){if(!ar.paused&&!ar.over){arStep(ar.st);arEvents();}arAcc-=AR_DT*1000;}
  const cv=document.getElementById('ar-canvas');if(cv)arDraw(cv.getContext('2d'));
  arUpdateHud();
  arRaf=requestAnimationFrame(arLoop);
}
function arEvents(){
  const st=ar.st;
  if(st.crowns[0]!==ar.seen.crowns[0]||st.crowns[1]!==ar.seen.crowns[1]){arSfx('arTower');ar.seen.crowns=st.crowns.slice();}
  if(st.fx.some(f=>f.kind==='boom'&&f.t>0.33))arSfx('arBoom');
  if(st.mode!=='play'&&!ar.over){
    const res=arRecord(ar.idx,{mode:st.mode,crowns:st.crowns[0]});
    ar.over=Object.assign({mode:st.mode,crowns:st.crowns.slice()},res);arSfx(st.mode==='won'?'arWin':'arLose');arRenderView();
  }
}
function arPos(e){const cv=document.getElementById('ar-canvas'),r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*AR_W,y:(e.clientY-r.top)/r.height*AR_H};}
function arClick(e){
  if(!ar||ar.over||ar.paused||arSel<0)return;
  const p=arPos(e),st=ar.st;
  const made=arPlay(st,0,arSel,p.x,p.y);
  if(made){arSfx('arCard');arSel=-1;arUpdateHand();}else arSfx('arNo');
}
function arPointer(e){if(ar)arHover=arPos(e);}
function arSelect(i){if(!ar||ar.over)return;const c=ar.st.decks[0].hand[i];if(!c)return;arSel=arSel===i?-1:i;arUpdateHand();}
function arTimeText(st){const left=st.overtime?AR_MATCH+AR_OVER-st.t:AR_MATCH-st.t;const s=Math.max(0,Math.ceil(left));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function arHandHtml(){
  const st=ar.st,dk=st.decks[0],el=Math.floor(st.elixir[0]+1e-9);
  const nxt=dk.queue[0],N=AR_CARDS[nxt];
  return `<div style="display:flex;gap:8px;justify-content:center;align-items:stretch;flex-wrap:wrap">
    <div title="Nächste Karte: ${N.n}" style="width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:.7;font-size:10px;color:var(--text-3)"><div>nächste</div><div style="font-size:22px">${N.ic}</div><div>${N.cost}</div></div>
    ${dk.hand.map((c,i)=>{const C=AR_CARDS[c],ok=el>=C.cost,sel=arSel===i;
      return `<button type="button" onclick="arSelect(${i})" title="${C.n}: ${C.desc}" style="position:relative;width:78px;padding:8px 4px 6px;border-radius:12px;border:3px solid ${sel?'#ffb300':ok?'#7e57c2':'var(--divider)'};background:${sel?'rgba(255,179,0,.18)':'var(--bg-2,transparent)'};color:var(--text);cursor:pointer;opacity:${ok?1:0.45};font-family:inherit;transform:${sel?'translateY(-6px)':'none'}"><div style="position:absolute;top:-9px;left:-9px;width:24px;height:24px;border-radius:50%;background:#ab47bc;color:#fff;font-weight:800;font-size:13px;line-height:24px">${C.cost}</div><div style="font-size:28px;line-height:1.1">${C.ic}</div><div style="font-size:10px;font-weight:700;margin-top:2px">${C.n}</div><div style="font-size:9px;color:var(--text-3)">${i+1}</div></button>`;}).join('')}</div>`;
}
function arUpdateHand(){const el=document.getElementById('ar-hand');if(el&&ar)el.innerHTML=arHandHtml();}
let arHudKey='';
function arUpdateHud(){
  if(!ar)return;const st=ar.st;
  const e=document.getElementById('ar-elixir');if(e){const v=st.elixir[0];e.firstElementChild.style.width=(v/AR_MAXEL*100)+'%';e.lastElementChild.textContent=Math.floor(v+1e-9)+(st.t>=AR_MATCH-60?'  ×2':'');}
  const t=document.getElementById('ar-time');if(t)t.textContent=arTimeText(st)+(st.overtime?' · Verlängerung':'');
  const c=document.getElementById('ar-crowns');if(c)c.innerHTML='👑 <strong>'+st.crowns[0]+'</strong> : <strong>'+st.crowns[1]+'</strong>';
  const key=st.decks[0].hand.join()+Math.floor(st.elixir[0])+arSel;if(key!==arHudKey){arHudKey=key;arUpdateHand();}
}
function arDeckToggle(c){
  const p=arProf();let d=(arDraft&&arDraft.every(x=>p.open.includes(x))?arDraft:p.deck).slice();
  if(d.includes(c))d=d.filter(x=>x!==c);else if(d.length<8)d.push(c);else{arMsg='Dein Deck ist voll – nimm zuerst eine Karte heraus.';arRenderView();return;}
  arMsg='';arDraft=d;if(d.length===8)arSetDeck(d);   // erst ein vollständiges Deck wird gespeichert
  arRenderView();
}
let arDraft=null;
function arRenderView(){
  const root=document.getElementById('ar-root');if(!root)return;
  if(arView==='menu'){
    const p=arProf(),deck=arDraft&&arDraft.every(c=>p.open.includes(c))?arDraft:p.deck;
    const card=(c,inDeck)=>{const C=AR_CARDS[c];return `<button type="button" onclick="arDeckToggle('${c}')" title="${C.n} (${C.cost} Elixier): ${C.desc}" style="width:74px;padding:6px 2px;border-radius:10px;border:2.5px solid ${inDeck?'#7e57c2':'var(--divider)'};background:${inDeck?'rgba(126,87,194,.18)':'transparent'};color:var(--text);cursor:pointer;font-family:inherit;position:relative"><span style="position:absolute;top:-8px;left:-8px;width:22px;height:22px;border-radius:50%;background:#ab47bc;color:#fff;font-weight:800;font-size:12px;line-height:22px">${C.cost}</span><div style="font-size:24px">${C.ic}</div><div style="font-size:10px;font-weight:700">${C.n}</div></button>`;};
    const valid=deck.length===8;
    root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:10px"><span class="game-chip">⭐ <strong>${arTotalStars(p)}</strong>/${AR_LEVELS.length*3}</span><span class="game-chip">🃏 ${p.open.length}/${Object.keys(AR_CARDS).length} Karten</span></div>
      <div class="lrn-label" style="text-align:center">Dein Deck <span style="color:${valid?'var(--text-3)':'#e53935'}">(${deck.length}/8)</span></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0 6px;min-height:70px">${deck.map(c=>card(c,true)).join('')||'<span style="font-size:12px;color:var(--text-3)">Wähle unten Karten aus.</span>'}</div>
      <div class="lrn-label" style="text-align:center;margin-top:10px">Sammlung</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0 6px">${p.open.filter(c=>!deck.includes(c)).map(c=>card(c,false)).join('')||'<span style="font-size:12px;color:var(--text-3)">Alle Karten sind im Deck.</span>'}</div>
      ${arMsg?'<div style="text-align:center;color:#e53935;font-size:12px;margin:4px 0">'+escHtml(arMsg)+'</div>':''}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:12px">${AR_LEVELS.map((L,i)=>{
        const r=p.lv[L.id],open=arUnlocked(p,i)&&valid;
        return `<button type="button" class="lrn-card" ${open?`onclick="arCommitStart(${i})"`:'disabled'} style="text-align:left;cursor:${open?'pointer':'default'};opacity:${open?1:0.5};font-family:inherit;color:var(--text);border-left:5px solid hsl(${L.hue},70%,50%)">
          <div style="font-size:11px;color:var(--text-3);font-weight:700">STUFE ${i+1}</div><div style="font-size:16px;font-weight:800;margin:2px 0">${arUnlocked(p,i)?'':'🔒 '}${escHtml(L.name)}</div>
          <div style="font-size:11px;color:var(--text-2);margin:3px 0">${L.deck.map(c=>AR_CARDS[c].ic).join(' ')}</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-2)"><span>${r.plays?r.wins+' Siege / '+r.plays+' Kämpfe':'–'}</span><span style="color:#f59f00;letter-spacing:1px">${'★'.repeat(r.stars)}<span style="opacity:.3">${'★'.repeat(3-r.stars)}</span></span></div></button>`;}).join('')}</div>
      <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px">Wähle eine Karte aus deiner Hand (oder Taste 1–4) und tippe auf deine Hälfte des Feldes. Elixir wächst von allein, in der letzten Minute doppelt so schnell. 1 ★ = Sieg, 2 ★ = mit 2 Kronen, 3 ★ = mit 3 Kronen. Jeder Sieg schaltet eine neue Karte frei. 🪙 AppHub-Coins: 5 für das erste Schaffen, 3 je neuen Stern.</div>`;
    return;
  }
  const o=ar&&ar.over;
  root.innerHTML=`<div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:8px"><span class="game-chip" id="ar-crowns"></span><span class="game-chip">⏱ <strong id="ar-time"></strong></span>
      <button class="lrn-btn ghost" onclick="arTogglePause()">${ar.paused?'▶ Weiter':'⏸ Pause'}</button><button class="lrn-btn ghost" onclick="arShowMenu()">☰ Menü</button></div>
    <div style="position:relative;max-width:340px;margin:0 auto"><canvas id="ar-canvas" width="${AR_W*AR_S}" height="${AR_H*AR_S}" style="display:block;width:100%;height:auto;border-radius:12px;box-shadow:0 6px 22px rgba(0,0,0,0.35);cursor:crosshair;touch-action:none" onpointerdown="arClick(event)" onpointermove="arPointer(event)"></canvas>
      ${o?arOverHtml(o):''}${ar.paused&&!o?'<div class="td-over"><div style="font-size:30px;font-weight:800">⏸ Pause</div><div style="margin-top:10px"><button class="lrn-btn" onclick="arTogglePause()">▶ Weiter</button></div></div>':''}</div>
    <div style="max-width:420px;margin:10px auto 0"><div id="ar-elixir" style="position:relative;height:20px;border-radius:10px;background:rgba(171,71,188,.2);overflow:hidden;margin-bottom:10px"><div style="position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#ab47bc,#e040fb);width:50%"></div><span style="position:absolute;inset:0;text-align:center;font-weight:800;font-size:12px;line-height:20px;color:#fff;text-shadow:0 1px 2px #000"></span></div><div id="ar-hand"></div></div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:8px">${escHtml(ar.L.name)} · Karte wählen (1–4), dann aufs Feld tippen · Leertaste = Pause</div>`;
  arHudKey='';arUpdateHud();arUpdateHand();
}
function arCommitStart(i){arDraft&&arDraft.length===8&&arSetDeck(arDraft);arDraft=null;arStart(i);}
function arOverHtml(o){
  const ghost='background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)';
  const title=o.mode==='won'?'Sieg!':o.mode==='draw'?'Unentschieden':'Niederlage';
  const card=o.newCard?'<div style="font-size:13px;margin:6px 0">🃏 Neue Karte: <strong>'+AR_CARDS[o.newCard].ic+' '+AR_CARDS[o.newCard].n+'</strong></div>':'';
  return `<div class="td-over"><div style="font-size:44px">${o.mode==='won'?'🏆':o.mode==='draw'?'🤝':'💀'}</div><div style="font-size:22px;font-weight:800">${title}</div>
    <div style="font-size:15px;margin:4px 0">👑 ${o.crowns[0]} : ${o.crowns[1]}</div>
    ${o.mode==='won'?`<div style="color:#ffca28;font-size:30px;letter-spacing:5px;margin:2px 0">${'★'.repeat(o.stars)}<span style="opacity:.3">${'★'.repeat(3-o.stars)}</span></div>${o.paid?'<div style="font-size:13px">🪙 +'+o.paid+' AppHub-Coins</div>':''}${card}`:'<div style="font-size:13px;margin:6px 0">Mehr Kronen als der Gegner gewinnen – versuch es noch einmal.</div>'}
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px">${o.mode==='won'?`<button class="lrn-btn" onclick="arNext()">${ar.idx+1<AR_LEVELS.length?'Nächste Stufe ▶':'Zum Menü'}</button>`:''}<button class="lrn-btn ${o.mode==='won'?'ghost':''}" ${o.mode==='won'?`style="${ghost}"`:''} onclick="arRestart()">Nochmal</button><button class="lrn-btn ghost" style="${ghost}" onclick="arShowMenu()">Menü</button></div></div>`;
}
function arDraw(ctx){
  if(!ar)return;
  const st=ar.st,S=AR_S,W=AR_W*S,H=AR_H*S;
  // Feld
  ctx.fillStyle='#4caf50';ctx.fillRect(0,0,W,H/2);ctx.fillStyle='#43a047';ctx.fillRect(0,H/2,W,H/2);
  for(let r=0;r<AR_H;r++)for(let c=0;c<AR_W;c++)if((r+c)%2===0){ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(c*S,r*S,S,S);}
  ctx.fillStyle='#29b6f6';ctx.fillRect(0,AR_RIVER[0]*S,W,(AR_RIVER[1]-AR_RIVER[0])*S);
  ctx.fillStyle='rgba(255,255,255,.35)';for(let x=0;x<W;x+=24){ctx.fillRect(x+((st.t*20)%24),AR_RIVER[0]*S+6,10,2);ctx.fillRect(x+12-((st.t*14)%24),AR_RIVER[1]*S-9,10,2);}
  ctx.fillStyle='#8d6e63';AR_BRIDGES.forEach(bx=>{ctx.fillRect((bx-AR_BHW)*S,(AR_RIVER[0]-0.2)*S,AR_BHW*2*S,(AR_RIVER[1]-AR_RIVER[0]+0.4)*S);ctx.fillStyle='#6d4c41';for(let k=0;k<7;k++)ctx.fillRect((bx-AR_BHW)*S,(AR_RIVER[0]-0.2)*S+k*S*0.27,AR_BHW*2*S,1);ctx.fillStyle='#8d6e63';});
  // Platzierbereich anzeigen
  if(arSel>=0&&!ar.over){
    const card=st.decks[0].hand[arSel],C=AR_CARDS[card];
    ctx.fillStyle='rgba(255,255,255,.14)';
    if(C&&!C.spell){
      ctx.fillRect(0,(AR_RIVER[1]+0.6)*S,W,H-(AR_RIVER[1]+0.6)*S);
      for(let l=0;l<2;l++)if(!arTowerAlive(st,1,l)){ctx.fillRect(l*W/2,(AR_H/2-4.5)*S,W/2,(AR_RIVER[0]-(AR_H/2-4.5))*S+ (AR_RIVER[1]-AR_RIVER[0])*S*0);}
    }else ctx.fillRect(0,0,W,H);
    if(arHover&&C){
      const ok=arCanPlace(st,0,card,arHover.x,arHover.y);
      ctx.strokeStyle=ok?'rgba(255,255,255,.9)':'rgba(255,82,82,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(arHover.x*S,arHover.y*S,(C.spell?C.spell.rad:1)*S,0,Math.PI*2);ctx.stroke();
      ctx.font='22px sans-serif';ctx.textAlign='center';ctx.fillText(C.ic,arHover.x*S,arHover.y*S+8);
    }
  }
  // Türme
  st.ents.filter(e=>e.tower).forEach(t=>{
    const x=t.x*S,y=t.y*S,w=t.r*2*S*0.85,col=t.side===0?'#1e88e5':'#e53935';
    if(t.hp<=0){ctx.fillStyle='rgba(60,60,60,.7)';ctx.fillRect(x-w/2,y-w/2,w,w);ctx.fillStyle='#222';ctx.fillRect(x-w/3,y-w/3,w*0.66,w*0.66);return;}
    ctx.fillStyle=t.hurt>0?'#fff':'#cfd8dc';ctx.fillRect(x-w/2,y-w/2,w,w);
    ctx.fillStyle=col;ctx.fillRect(x-w/2+4,y-w/2+4,w-8,w-8);
    ctx.font=(t.kind==='king'?'20px':'15px')+' sans-serif';ctx.textAlign='center';ctx.fillText(t.kind==='king'?(t.active?'👑':'😴'):'🏰',x,y+6);
    arBar(ctx,x,y-w/2-6,w,t.hp/t.maxhp,col);
  });
  // Zauber und Effekte
  st.spells.forEach(sp=>{ctx.strokeStyle='rgba(255,112,67,.9)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(sp.x*S,sp.y*S,sp.rad*S,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);});
  st.fx.forEach(f=>{
    if(f.kind==='boom'){ctx.fillStyle='rgba(255,152,0,'+Math.min(.6,f.t*1.8)+')';ctx.beginPath();ctx.arc(f.ax*S,f.ay*S,f.rad*S*(1.1-f.t),0,Math.PI*2);ctx.fill();}
    else{ctx.strokeStyle=f.side===0?'rgba(255,255,255,.9)':'rgba(255,205,210,.9)';ctx.lineWidth=f.kind==='tshot'?3:2;ctx.beginPath();ctx.moveTo(f.ax*S,f.ay*S);ctx.lineTo(f.bx*S,f.by*S);ctx.stroke();}
  });
  // Einheiten (Flieger zuletzt)
  const units=st.ents.filter(e=>!e.tower&&e.hp>0).sort((a,b)=>(a.fly-b.fly)||(a.y-b.y));
  units.forEach(u=>{
    const x=u.x*S,y=u.y*S,r=Math.max(7,u.r*S),col=u.side===0?'#1e88e5':'#e53935';
    ctx.globalAlpha=u.spawn>0?0.55:1;
    if(u.fly){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+r+3,r*0.8,r*0.35,0,0,Math.PI*2);ctx.fill();}
    const yy=u.fly?y-6:y;
    ctx.fillStyle=u.hurt>0?'#fff':'rgba(255,255,255,.88)';ctx.beginPath();ctx.arc(x,yy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col;ctx.lineWidth=3;ctx.stroke();
    ctx.font=Math.round(r*1.45)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(AR_UNITS[u.kind].ic,x,yy+r*0.5);
    if(u.hp<u.maxhp)arBar(ctx,x,yy-r-5,r*2,u.hp/u.maxhp,col);
    ctx.globalAlpha=1;
  });
}
function arBar(ctx,x,y,w,f,col){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-w/2,y-2,w,5);ctx.fillStyle=col;ctx.fillRect(x-w/2,y-2,w*Math.max(0,f),5);}
document.addEventListener('keydown',e=>{
  if(!arActive()||arView!=='game'||!ar)return;
  const k=e.key;
  if(/^[1-4]$/.test(k)){e.preventDefault();arSelect(+k-1);}
  else if(k===' '||k==='p'||k==='P'||k==='Escape'){e.preventDefault();arTogglePause();}
});
window.addEventListener('blur',()=>{if(ar&&arView==='game'&&!ar.paused&&!ar.over&&arActive()){ar.paused=true;arRenderView();}});
