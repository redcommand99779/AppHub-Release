/* ══════════════════════════════════
   BAHNHOF-BOSS – Idle-Spiel: Tickets verkaufen, Gebäude und Züge kaufen, die Geld verdienen – auch wenn du nicht da bist.
   Meilensteine (×2 bei 10/25/50/100/150/200 Stück), Upgrades, goldene Tickets, Erfolge (mit AppHub-Coins) und der
   „Neue Fahrplan“ (Prestige: alles zurücksetzen für dauerhaft mehr Einkommen). Spielstand je Konto: zf_idle.
══════════════════════════════════ */
const BB_KEY='zf_idle';
const BB_GENS=[
  {id:'auto',name:'Fahrkartenautomat',icon:'🎫',cost:15,rate:0.1,desc:'Verkauft Tickets ganz von allein.'},
  {id:'kiosk',name:'Bahnhofs-Kiosk',icon:'🥨',cost:100,rate:1,desc:'Brezeln und Zeitungen für Reisende.'},
  {id:'cafe',name:'Bahnhofscafé',icon:'☕',cost:1100,rate:8,desc:'Kaffee to go am Gleis 3.'},
  {id:'regio',name:'Regionalzug',icon:'🚃',cost:12000,rate:47,desc:'Pendler jeden Morgen.'},
  {id:'netz',name:'Gleisnetz',icon:'🛤️',cost:130000,rate:260,desc:'Neue Strecken verbinden Städte.'},
  {id:'ice',name:'Schnellzug',icon:'🚄',cost:1.4e6,rate:1400,desc:'300 km/h und pünktlich.'},
  {id:'halle',name:'Bahnhofshalle',icon:'🏛️',cost:2e7,rate:7800,desc:'Glasdach, Läden, Reisezentrum.'},
  {id:'welt',name:'Weltnetz',icon:'🌍',cost:3.3e8,rate:44000,desc:'Züge über alle Kontinente.'},
  {id:'raum',name:'Weltraumbahnhof',icon:'🚀',cost:5.1e9,rate:260000,desc:'Umsteigen zum Mond.'}
];
const BB_GROWTH=1.15;
const BB_MILESTONES=[10,25,50,100,150,200];         // jeweils ×2 für dieses Gebäude
const BB_UPGRADES=[
  {id:'k1',name:'Kräftiger Stempel',icon:'🖋️',cost:500,desc:'Ein Ticket bringt doppelt so viel.',click:2},
  {id:'k2',name:'Ticketdrucker',icon:'🖨️',cost:5000,desc:'Ein Ticket bringt nochmal ×3.',click:3},
  {id:'k3',name:'Reiseführer',icon:'📘',cost:250000,desc:'Ein Ticket bringt nochmal ×5.',click:5},
  {id:'k4',name:'Stammkunden',icon:'🤝',cost:5e7,desc:'Ein Klick bringt zusätzlich 2 % deines Einkommens pro Sekunde.',clickPct:0.02},
  {id:'g1',name:'Freundliches Personal',icon:'😊',cost:10000,desc:'Alles verdient 50 % mehr.',all:1.5},
  {id:'g2',name:'Werbekampagne',icon:'📣',cost:2e6,desc:'Alles verdient doppelt so viel.',all:2},
  {id:'g3',name:'Digitalisierung',icon:'💻',cost:2e8,desc:'Alles verdient dreimal so viel.',all:3},
  {id:'g4',name:'Staatliche Förderung',icon:'🏦',cost:5e10,desc:'Alles verdient fünfmal so viel.',all:5}
];
const BB_ACH=[
  {id:'c100',name:'Erster Schalter',desc:'100 Tickets verkauft',test:s=>s.clicks>=100,coins:1},
  {id:'c1000',name:'Schalterprofi',desc:'1.000 Tickets verkauft',test:s=>s.clicks>=1000,coins:2},
  {id:'e1k',name:'Kleines Geschäft',desc:'1.000 € verdient',test:s=>s.lifetime>=1e3,coins:1},
  {id:'e1m',name:'Millionär',desc:'1 Mio. € verdient',test:s=>s.lifetime>=1e6,coins:2},
  {id:'e1b',name:'Milliardär',desc:'1 Mrd. € verdient',test:s=>s.lifetime>=1e9,coins:3},
  {id:'e1t',name:'Bahn-Imperium',desc:'1 Bio. € verdient',test:s=>s.lifetime>=1e12,coins:5},
  {id:'g10',name:'Kleiner Fuhrpark',desc:'25 Gebäude gekauft',test:s=>bbTotalOwned(s)>=25,coins:1},
  {id:'g100',name:'Großer Fuhrpark',desc:'250 Gebäude gekauft',test:s=>bbTotalOwned(s)>=250,coins:3},
  {id:'all',name:'Alles im Angebot',desc:'Jedes Gebäude mindestens einmal',test:s=>s.gens.every(n=>n>0),coins:3},
  {id:'ups',name:'Rundum verbessert',desc:'Alle Upgrades gekauft',test:s=>BB_UPGRADES.every(u=>s.ups[u.id]),coins:3},
  {id:'gold',name:'Glückstreffer',desc:'5 goldene Tickets gefangen',test:s=>s.goldCaught>=5,coins:2},
  {id:'reset',name:'Neuer Fahrplan',desc:'Zum ersten Mal einen neuen Fahrplan eingeführt',test:s=>s.resets>=1,coins:4}
];
const BB_OFFLINE_MAX=8*3600,BB_OFFLINE_RATE=0.5;
const BB_PRESTIGE_BONUS=0.05;                    // +5 % je Fahrplan-Punkt
const BB_GOLD_MIN=90,BB_GOLD_MAX=240;            // Sekunden zwischen goldenen Tickets
let bb=null,bbTab='gens',bbBuy=1,bbTick=null,bbMsg='',bbLastSave=0,bbWelcome=null;

function bbEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
/* Zahlen lesbar: 1.234 · 12,3 Tsd · 4,56 Mio · 7,8 Mrd … */
function bbFmt(n){
  if(!isFinite(n))return '∞';
  if(n<0)return '-'+bbFmt(-n);
  if(n<1000)return n<10?(Math.round(n*10)/10).toLocaleString('de-DE'):Math.floor(n).toLocaleString('de-DE');
  const names=['','Tsd','Mio','Mrd','Bio','Brd','Trl','Trd'],e=Math.min(names.length-1,Math.floor(Math.log10(n)/3));
  if(e<=1)return Math.floor(n).toLocaleString('de-DE');
  const v=n/Math.pow(1000,e);return (v>=100?Math.floor(v):v>=10?Math.round(v*10)/10:Math.round(v*100)/100).toLocaleString('de-DE')+' '+names[e];
}

/* ── Logik (ohne Oberfläche, testbar) ── */
function bbNew(){
  return {money:0,run:0,lifetime:0,clicks:0,gens:BB_GENS.map(()=>0),ups:{},ach:{},pts:0,resets:0,goldCaught:0,gold:null,goldIn:BB_GOLD_MIN+Math.random()*(BB_GOLD_MAX-BB_GOLD_MIN),boost:0,last:Date.now(),coinsGiven:0};
}
function bbTotalOwned(s){return s.gens.reduce((a,b)=>a+b,0);}
/* Preis für n weitere Stück, wenn schon 'owned' vorhanden sind */
function bbCost(i,owned,n){
  const g=BB_GENS[i];n=n||1;
  return g.cost*Math.pow(BB_GROWTH,owned)*(Math.pow(BB_GROWTH,n)-1)/(BB_GROWTH-1);
}
function bbMaxBuy(s,i){
  const g=BB_GENS[i],owned=s.gens[i];let n=0;
  // größtes n mit bbCost(i,owned,n) <= Geld (geschlossene Formel)
  const base=g.cost*Math.pow(BB_GROWTH,owned);
  if(s.money<base)return 0;
  n=Math.floor(Math.log(s.money*(BB_GROWTH-1)/base+1)/Math.log(BB_GROWTH));
  while(n>0&&bbCost(i,owned,n)>s.money)n--;
  return Math.max(0,n);
}
function bbMilestoneMult(count){let m=1;BB_MILESTONES.forEach(t=>{if(count>=t)m*=2;});return m;}
function bbNextMilestone(count){return BB_MILESTONES.find(t=>t>count)||0;}
function bbGlobalMult(s){
  let m=1;BB_UPGRADES.forEach(u=>{if(u.all&&s.ups[u.id])m*=u.all;});
  m*=1+s.pts*BB_PRESTIGE_BONUS;
  if(s.boost>0)m*=7;
  return m;
}
function bbGenRate(s,i){return BB_GENS[i].rate*s.gens[i]*bbMilestoneMult(s.gens[i])*bbGlobalMult(s);}
function bbRate(s){let r=0;for(let i=0;i<BB_GENS.length;i++)r+=bbGenRate(s,i);return r;}
function bbClickValue(s){
  let v=1;BB_UPGRADES.forEach(u=>{if(u.click&&s.ups[u.id])v*=u.click;});
  v*=1+s.pts*BB_PRESTIGE_BONUS;if(s.boost>0)v*=7;
  let pct=0;BB_UPGRADES.forEach(u=>{if(u.clickPct&&s.ups[u.id])pct+=u.clickPct;});
  return v+pct*bbRate(s);
}
function bbEarn(s,amount){s.money+=amount;s.run+=amount;s.lifetime+=amount;}
function bbClick(s){const v=bbClickValue(s);bbEarn(s,v);s.clicks++;return v;}
function bbBuyGen(s,i,n){
  n=n==='max'?bbMaxBuy(s,i):n;if(n<=0)return 0;
  const c=bbCost(i,s.gens[i],n);if(s.money<c)return 0;
  s.money-=c;s.gens[i]+=n;return n;
}
function bbBuyUpgrade(s,id){const u=BB_UPGRADES.find(x=>x.id===id);if(!u||s.ups[u.id]||s.money<u.cost)return false;s.money-=u.cost;s.ups[u.id]=true;return true;}
/* Zeit vergeht: Einkommen, goldenes Ticket, Boost */
function bbAdvance(s,dt){
  if(dt<=0)return;
  bbEarn(s,bbRate(s)*dt);
  if(s.boost>0)s.boost=Math.max(0,s.boost-dt);
  if(s.gold){s.gold.left-=dt;if(s.gold.left<=0)s.gold=null;}
  else{s.goldIn-=dt;if(s.goldIn<=0){s.gold={left:14,x:10+Math.random()*80,y:10+Math.random()*70};s.goldIn=BB_GOLD_MIN+Math.random()*(BB_GOLD_MAX-BB_GOLD_MIN);}}
}
/* Goldenes Ticket gefangen: sofort 60 Sekunden Einkommen oder 20 Sekunden lang ×7 */
function bbCatchGold(s){
  if(!s.gold)return null;
  s.goldCaught++;s.gold=null;
  if(Math.random()<0.5){const v=Math.max(50,bbRate(s)*60);bbEarn(s,v);return {kind:'bonus',value:v};}
  s.boost=20;return {kind:'boost',value:20};
}
/* Offline-Verdienst: halbes Einkommen, höchstens 8 Stunden */
function bbOffline(s,now){
  const dt=Math.max(0,Math.min(BB_OFFLINE_MAX,(now-s.last)/1000));
  const gain=bbRate(s)*dt*BB_OFFLINE_RATE;if(gain>0)bbEarn(s,gain);
  s.last=now;return {seconds:dt,gain};
}
/* Neuer Fahrplan: Punkte aus dem Einkommen dieser Runde */
function bbPrestigeGain(s){return Math.floor(Math.sqrt(s.run/1e8));}
function bbPrestige(s){
  const g=bbPrestigeGain(s);if(g<1)return 0;
  s.pts+=g;s.resets++;s.money=0;s.run=0;s.gens=BB_GENS.map(()=>0);s.ups={};s.gold=null;s.boost=0;return g;
}
function bbCheckAch(s){
  const got=[];BB_ACH.forEach(a=>{if(!s.ach[a.id]&&a.test(s)){s.ach[a.id]=true;got.push(a);}});return got;
}

/* ── Speichern (je Konto) ── */
function bbAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function bbKey(){return bbAccount().toLowerCase()||'_gast';}
function bbLoad(){
  let all={};try{all=JSON.parse(localStorage.getItem(BB_KEY)||'{}')||{};}catch(e){}
  const d=all[bbKey()],s=bbNew();
  if(d&&typeof d==='object'){
    ['money','run','lifetime','clicks','pts','resets','goldCaught','last','coinsGiven'].forEach(k=>{if(isFinite(d[k]))s[k]=+d[k];});
    if(Array.isArray(d.gens))s.gens=BB_GENS.map((_,i)=>Math.max(0,Math.floor(+d.gens[i]||0)));
    if(d.ups&&typeof d.ups==='object')BB_UPGRADES.forEach(u=>{if(d.ups[u.id])s.ups[u.id]=true;});
    if(d.ach&&typeof d.ach==='object')BB_ACH.forEach(a=>{if(d.ach[a.id])s.ach[a.id]=true;});
  }
  return s;
}
function bbSave(){
  if(!bb)return;let all={};try{all=JSON.parse(localStorage.getItem(BB_KEY)||'{}')||{};}catch(e){}
  bb.last=Date.now();
  all[bbKey()]={money:bb.money,run:bb.run,lifetime:bb.lifetime,clicks:bb.clicks,gens:bb.gens,ups:bb.ups,ach:bb.ach,pts:bb.pts,resets:bb.resets,goldCaught:bb.goldCaught,last:bb.last,coinsGiven:bb.coinsGiven,name:bbAccount()};
  try{localStorage.setItem(BB_KEY,JSON.stringify(all));}catch(e){}
  bbLastSave=Date.now();
}
/* Erfolge bringen AppHub-Coins (einmalig) */
function bbAwardAch(list){
  if(!list.length)return;
  const coins=list.reduce((a,x)=>a+x.coins,0);
  let paid=0;
  try{const name=bbAccount();if(name&&typeof zcAddCoins==='function'){zcAddCoins(name,coins);paid=coins;bb.coinsGiven+=coins;if(typeof smSave==='function')smSave('zentrale');}}catch(e){}
  bbMsg='🏅 '+list.map(a=>a.name).join(', ')+(paid?` · +${paid} 🪙 AppHub-Coins`:'');
  if(typeof sfx==='function'){try{sfx('chime');}catch(e){}}
}

/* ── Oberfläche ── */
function bbInit(){
  bb=bbLoad();bbTab='gens';bbMsg='';
  const r=bbOffline(bb,Date.now());
  bbWelcome=r.gain>=1&&r.seconds>=60?r:null;
  bbAwardAch(bbCheckAch(bb));
  bbRender();
  clearInterval(bbTick);bbTick=setInterval(bbLoop,200);
}
function bbLoop(){
  if(!bb)return;
  const now=Date.now(),dt=Math.min(5,(now-bb.last)/1000);
  bb.last=now;bbAdvance(bb,dt);
  const got=bbCheckAch(bb);if(got.length){bbAwardAch(got);bbRender();}
  const scr=document.getElementById('screen-idle');
  if(scr&&scr.classList.contains('active'))bbLive();
  if(now-bbLastSave>5000)bbSave();
}
function bbRoot(){return document.getElementById('bb-root');}
function bbSetTab(t){bbTab=t;bbRender();}
function bbSetBuy(n){bbBuy=n;bbRender();}
function bbTicket(ev){
  const v=bbClick(bb);
  const btn=document.getElementById('bb-ticket');
  if(btn&&ev&&btn.parentNode){const f=document.createElement('div');f.className='bb-float';f.textContent='+'+bbFmt(v)+' €';f.style.left=(20+Math.random()*60)+'%';btn.parentNode.appendChild(f);setTimeout(()=>f.remove(),900);}
  bbLive();
}
function bbBuyClick(i){
  const n=bbBuy==='max'?bbMaxBuy(bb,i):bbBuy;
  if(bbBuyGen(bb,i,bbBuy)){if(typeof sfx==='function'){try{sfx('click');}catch(e){}}bbAwardAch(bbCheckAch(bb));bbSave();bbRender();}
}
function bbUpClick(id){if(bbBuyUpgrade(bb,id)){bbAwardAch(bbCheckAch(bb));bbSave();bbRender();}}
function bbGoldClick(){
  const r=bbCatchGold(bb);if(!r)return;
  bbMsg=r.kind==='bonus'?`✨ Goldenes Ticket: +${bbFmt(r.value)} €`:'✨ Goldenes Ticket: 20 Sekunden lang ×7 Einkommen!';
  bbAwardAch(bbCheckAch(bb));bbSave();bbRender();
}
function bbDoPrestige(){
  const g=bbPrestigeGain(bb);if(g<1)return;
  const go=()=>{bbPrestige(bb);bbMsg=`🔄 Neuer Fahrplan! +${g} Fahrplan-Punkte (dauerhaft +${Math.round(g*BB_PRESTIGE_BONUS*100)} % Einkommen).`;bbAwardAch(bbCheckAch(bb));bbSave();bbTab='gens';bbRender();};
  if(typeof appConfirm==='function')appConfirm(`Alles zurücksetzen und ${g} Fahrplan-Punkte erhalten? Gebäude und Upgrades gehen verloren, die Punkte bleiben für immer.`,go);else go();
}
function bbDismissWelcome(){bbWelcome=null;bbRender();}
function bbLive(){
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=v;};
  set('bb-money',bbFmt(bb.money));set('bb-rate',bbFmt(bbRate(bb)));set('bb-click',bbFmt(bbClickValue(bb)));
  BB_GENS.forEach((g,i)=>{
    const b=document.getElementById('bb-buy-'+i);if(!b)return;
    const n=bbBuy==='max'?Math.max(1,bbMaxBuy(bb,i)):bbBuy,c=bbCost(i,bb.gens[i],n),ok=bb.money>=c&&(bbBuy!=='max'||bbMaxBuy(bb,i)>0);
    b.disabled=!ok;b.classList.toggle('poor',!ok);
    const l=document.getElementById('bb-cost-'+i);if(l&&l.textContent!==bbFmt(c)+' €')l.textContent=bbFmt(c)+' €';
    const q=document.getElementById('bb-n-'+i);if(q){const t='×'+n;if(q.textContent!==t)q.textContent=t;}
    set('bb-rate-'+i,bbFmt(bbGenRate(bb,i))+' €/s');
  });
  BB_UPGRADES.forEach(u=>{const b=document.getElementById('bb-up-'+u.id);if(b){const ok=bb.money>=u.cost;b.disabled=!ok;b.classList.toggle('poor',!ok);}});
  const bo=document.getElementById('bb-boost');if(bo)bo.textContent=bb.boost>0?'⚡ ×7 noch '+Math.ceil(bb.boost)+' s':'';
  const gd=document.getElementById('bb-gold');
  if(gd){const show=!!bb.gold;if(show&&gd.style.display==='none'){gd.style.display='block';}else if(!show&&gd.style.display!=='none'){gd.style.display='none';}
    if(show){gd.style.left=bb.gold.x+'%';gd.style.top=bb.gold.y+'%';}}
  else if(bb.gold)bbRender();
  const pg=document.getElementById('bb-prestige-gain');if(pg)pg.textContent=bbPrestigeGain(bb);
}
function bbRender(){
  const root=bbRoot();if(!root||!bb)return;
  const tab=(id,l)=>`<button class="lrn-tab${bbTab===id?' active':''}" onclick="bbSetTab('${id}')">${l}</button>`;
  const buy=(n,l)=>`<button class="lrn-chip${bbBuy===n?' active':''}" onclick="bbSetBuy(${typeof n==='string'?`'${n}'`:n})">${l}</button>`;
  let body='';
  if(bbTab==='gens')body=`<div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap"><span style="font-size:12px;color:var(--text-3);font-weight:700">KAUFEN</span>${buy(1,'×1')}${buy(10,'×10')}${buy(100,'×100')}${buy('max','Max')}</div>`+BB_GENS.map((g,i)=>bbRenderGen(g,i)).join('');
  else if(bbTab==='ups')body=BB_UPGRADES.map(u=>bbRenderUp(u)).join('');
  else if(bbTab==='ach')body=`<div class="lrn-tiles"><div class="lrn-tile"><b>${Object.keys(bb.ach).length}/${BB_ACH.length}</b><span>Erfolge</span></div><div class="lrn-tile"><b>${bbFmt(bb.lifetime)} €</b><span>insgesamt verdient</span></div><div class="lrn-tile"><b>${bbFmt(bb.clicks)}</b><span>Tickets verkauft</span></div></div>`+BB_ACH.map(a=>`<div class="lrn-card" style="margin-bottom:6px;padding:10px 14px;display:flex;align-items:center;gap:10px;${bb.ach[a.id]?'':'opacity:.55'}"><div style="font-size:22px">${bb.ach[a.id]?'🏅':'🔒'}</div><div style="flex:1"><b>${bbEsc(a.name)}</b><div style="font-size:12px;color:var(--text-3)">${bbEsc(a.desc)}</div></div><span style="font-size:12px;color:var(--text-3)">🪙 ${a.coins}</span></div>`).join('');
  else body=bbRenderPrestige();
  root.innerHTML=`${bbWelcome?`<div class="lrn-msg">👋 Willkommen zurück! In den ${Math.round(bbWelcome.seconds/60)} Minuten deiner Abwesenheit haben deine Züge <b>${bbFmt(bbWelcome.gain)} €</b> verdient. <button class="lrn-btn ghost" style="padding:2px 10px;margin-left:8px" onclick="bbDismissWelcome()">OK</button></div>`:''}
    ${bbMsg?`<div class="lrn-msg">${bbEsc(bbMsg)}</div>`:''}
    <div class="lrn-card bb-hero"><div style="position:relative">
      <div style="text-align:center"><div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--text-3)">KONTOSTAND</div>
        <div style="font-size:38px;font-weight:800;line-height:1.1"><span id="bb-money">${bbFmt(bb.money)}</span> €</div>
        <div style="font-size:13px;color:var(--text-3)"><b id="bb-rate">${bbFmt(bbRate(bb))}</b> € pro Sekunde <span id="bb-boost" style="color:#ff9500;font-weight:700;margin-left:6px"></span></div></div>
      <div style="position:relative;text-align:center;margin-top:12px"><button id="bb-ticket" class="bb-ticket" onclick="bbTicket(event)">🎫 Ticket verkaufen<small>+<span id="bb-click">${bbFmt(bbClickValue(bb))}</span> €</small></button></div>
      <button id="bb-gold" class="bb-gold" onclick="bbGoldClick()" style="display:${bb.gold?'block':'none'};left:${bb.gold?bb.gold.x:50}%;top:${bb.gold?bb.gold.y:50}%" title="Goldenes Ticket – schnell klicken!">🎟️</button></div></div>
    <div class="lrn-tabs" style="margin-top:14px">${tab('gens','🏗 Gebäude')}${tab('ups','⬆ Upgrades')}${tab('ach','🏅 Erfolge')}${tab('prest','🔄 Fahrplan')}</div>${body}`;
  bbLive();
}
function bbRenderGen(g,i){
  const owned=bb.gens[i],mult=bbMilestoneMult(owned),nm=bbNextMilestone(owned),n=bbBuy==='max'?Math.max(1,bbMaxBuy(bb,i)):bbBuy;
  return `<div class="lrn-card bb-gen"><div class="bb-icon">${g.icon}</div>
    <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">${bbEsc(g.name)} <span class="lrn-pill">${owned}</span>${mult>1?` <span class="lrn-pill" style="background:rgba(255,149,0,.15);color:#ff9500">×${mult}</span>`:''}</div>
      <div style="font-size:11px;color:var(--text-3)">${bbEsc(g.desc)} · je ${bbFmt(g.rate*mult*bbGlobalMult(bb))} €/s${nm?` · nächster Bonus bei ${nm}`:''}</div>
      <div style="font-size:11px;margin-top:2px;color:var(--text-2)">Gesamt: <b id="bb-rate-${i}">${bbFmt(bbGenRate(bb,i))} €/s</b></div></div>
    <button id="bb-buy-${i}" class="lrn-btn bb-buybtn" onclick="bbBuyClick(${i})"><span id="bb-n-${i}">×${n}</span><br><small id="bb-cost-${i}">${bbFmt(bbCost(i,owned,n))} €</small></button></div>`;
}
function bbRenderUp(u){
  const has=!!bb.ups[u.id];
  return `<div class="lrn-card bb-gen" style="${has?'opacity:.6':''}"><div class="bb-icon">${u.icon}</div><div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">${bbEsc(u.name)}</div><div style="font-size:12px;color:var(--text-3)">${bbEsc(u.desc)}</div></div>
    ${has?'<span class="lrn-pill">gekauft ✓</span>':`<button id="bb-up-${u.id}" class="lrn-btn bb-buybtn" onclick="bbUpClick('${u.id}')">${bbFmt(u.cost)} €</button>`}</div>`;
}
function bbRenderPrestige(){
  const g=bbPrestigeGain(bb);
  return `<div class="lrn-card" style="text-align:center;padding:22px 16px"><div style="font-size:40px">🔄</div><div style="font-size:18px;font-weight:800;margin:6px 0">Neuer Fahrplan</div>
    <div style="font-size:13px;color:var(--text-3);line-height:1.5;margin-bottom:14px">Beginne mit einem frischen Bahnhof und behalte <b>Fahrplan-Punkte</b>: Jeder Punkt bringt dauerhaft <b>+${Math.round(BB_PRESTIGE_BONUS*100)} %</b> auf alles Einkommen – und auf jedes Ticket.</div>
    <div class="lrn-tiles" style="max-width:420px;margin:0 auto 14px"><div class="lrn-tile"><b>${bb.pts}</b><span>Punkte jetzt (+${Math.round(bb.pts*BB_PRESTIGE_BONUS*100)} %)</span></div><div class="lrn-tile"><b>+<span id="bb-prestige-gain">${g}</span></b><span>bei Neustart</span></div><div class="lrn-tile"><b>${bb.resets}</b><span>Neustarts</span></div></div>
    <button class="lrn-btn" onclick="bbDoPrestige()" ${g<1?'disabled':''}>${g<1?'Noch zu früh – verdiene mehr (ab 100 Mio. € in dieser Runde)':'🔄 Jetzt neuen Fahrplan einführen'}</button></div>`;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&bb)bbSave();});
window.addEventListener('beforeunload',()=>{if(bb)bbSave();});
