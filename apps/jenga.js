/* ══════════════════════════════════
   JENGA – Turm aus 18 Etagen mit je 3 Steinen. Ziehe einen Stein heraus und lege ihn oben auf – wer den Turm zum Einsturz bringt, verliert.
   Ob der Turm hält, entscheidet die Statik: Pro Etage muss der gemeinsame Schwerpunkt aller darüberliegenden Steine über der Fläche liegen, auf der die
   Etage wirklich aufliegt (konvexe Hülle der Berührflächen). Die Reserve bis zum Kippen (Abstand zum Rand der Fläche, in Steinbreiten) zeigt, wie sehr der Turm wackelt.
   Realistischer Zug: Steine werden mit gedrückter Maustaste herausgezogen. Jeder Stein sitzt unterschiedlich fest (Last der Steine darüber, die er trägt, mal eine zufällige
   Rauheit): locker, fest oder klemmend. Wer hastig an einem festen Stein zieht, erschüttert den Turm (Erschütterung = Zugweg mal Festigkeit, klingt langsam ab); übersteigt sie die
   Reserve des Turms, stürzt er ein, auch wenn er statisch gestanden hätte. Tippen testet, wie fest ein Stein sitzt. Die KI zieht je nach Stufe hastig oder vorsichtig.
   Der Stein folgt der Maus in jede Richtung (längs, seitlich und schräg): Längs ist immer frei, seitlich nur, solange dort kein Nachbarstein im Weg ist (am Rand nach außen immer).
   Fertig gezogen ist er, wenn er kaum noch auf dem Turm liegt (Rest der Fläche unter dem Turm höchstens 0,4 von 3).
   Modi: gegen die KI (leicht, mittel, schwer), 2–4 Spieler am selben PC, Solo (wie viele Züge schaffst du?). Ansicht 2.5D (Isometrie) auf einer Zeichenfläche.
   Regeln: Nicht erlaubt sind die oberste volle Etage, eine unvollständige Etage und die Etage darunter, und der letzte Stein einer Etage. Gelegt wird in die oberste Etage, quer zur Etage darunter.
   Zwei Spieler (gegen die KI oder zwei Accounts am selben PC) laufen über spielmeta.js wie Schach oder Vier gewinnt: Account, Emoji und Farbe wählen, Ränge (PR), Hall of Fame,
   Best-of-Serie, Cup, Replay-Ergebnis und Schnellduell der Spielzentrale. 3–4 Spieler und Solo sind Freundschaftsspiele ohne Wertung.
   Belohnung: Sieg gegen die KI – leicht 3, mittel 5, schwer 8 AppHub-Coins, je Stufe einmal pro Tag. Spielstand je Konto: zf_jenga.
══════════════════════════════════ */
const JG_KEY='zf_jenga',JG_FLOORS=18,JG_WOBBLE=0.3,JG_SAFE=0.1;
const JG_REWARD={leicht:3,mittel:5,schwer:8};
/* ── Reine Statik und Regeln (wird getestet) ── */
const jgNew=()=>({floors:Array.from({length:JG_FLOORS},()=>[1,1,1])});
const jgCopy=t=>({floors:t.floors.map(f=>f.slice())});
const jgCount=t=>t.floors.reduce((n,f)=>n+f[0]+f[1]+f[2],0);
/* Grundfläche eines Steins in Etage f, Platz s (0–2): Etagen wechseln die Richtung; Stein 1 breit und 3 lang */
function jgRect(f,s){const c=s-1;return f%2===0?{x0:c-0.5,x1:c+0.5,z0:-1.5,z1:1.5}:{x0:-1.5,x1:1.5,z0:c-0.5,z1:c+0.5};}
const jgCenter=(f,s)=>{const r=jgRect(f,s);return [(r.x0+r.x1)/2,(r.z0+r.z1)/2];};
function jgHull(pts){
  const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]).filter((q,i,a)=>!i||q[0]!==a[i-1][0]||q[1]!==a[i-1][1]);if(p.length<3)return p;
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
  for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=1e-12)lo.pop();lo.push(q);}
  for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=1e-12)up.pop();up.push(q);}
  lo.pop();up.pop();return lo.concat(up);   // gegen den Uhrzeigersinn
}
/* Reserve einer Grenze: Abstand des Schwerpunkts zum Rand der Auflagefläche (positiv = innen). Etage f liegt auf Etage f−1 (f=0: auf dem Tisch). */
function jgBoundary(t,f){
  const pts=[];
  t.floors[f].forEach((a,s)=>{if(!a)return;const r=jgRect(f,s);
    if(f===0){pts.push([r.x0,r.z0],[r.x1,r.z0],[r.x1,r.z1],[r.x0,r.z1]);return;}
    t.floors[f-1].forEach((b,u)=>{if(!b)return;const q=jgRect(f-1,u),x0=Math.max(r.x0,q.x0),x1=Math.min(r.x1,q.x1),z0=Math.max(r.z0,q.z0),z1=Math.min(r.z1,q.z1);
      if(x1-x0>1e-9&&z1-z0>1e-9)pts.push([x0,z0],[x1,z0],[x1,z1],[x0,z1]);});});
  let sx=0,sz=0,n=0;
  for(let g=f;g<t.floors.length;g++)t.floors[g].forEach((a,s)=>{if(a){const c=jgCenter(g,s);sx+=c[0];sz+=c[1];n++;}});
  if(!n)return 9;const com=[sx/n,sz/n],h=jgHull(pts);if(h.length<3)return -1;
  let m=9;for(let i=0;i<h.length;i++){const a=h[i],b=h[(i+1)%h.length],ex=b[0]-a[0],ez=b[1]-a[1],len=Math.hypot(ex,ez);m=Math.min(m,(ex*(com[1]-a[1])-ez*(com[0]-a[0]))/len);}
  return m;
}
/* Kleinste Reserve im ganzen Turm: unter 0 = fällt, unter 0,3 = wackelt */
function jgMargin(t){let m=9;for(let f=0;f<t.floors.length;f++){if(!t.floors[f][0]&&!t.floors[f][1]&&!t.floors[f][2])return -1;m=Math.min(m,jgBoundary(t,f));}return m;}
const jgTop=t=>t.floors.length-1;
const jgTopFull=t=>t.floors[jgTop(t)].every(x=>x);
/* Welche Steine dürfen gezogen werden? Nicht aus der obersten vollen Etage, aus einer unvollständigen Etage und der darunter, und nie der letzte Stein einer Etage. */
function jgRemovable(t){
  const T=jgTop(t),maxF=jgTopFull(t)?T-1:T-2,out=[];
  for(let f=0;f<=maxF;f++){const n=t.floors[f][0]+t.floors[f][1]+t.floors[f][2];if(n<2)continue;t.floors[f].forEach((a,s)=>{if(a)out.push([f,s]);});}
  return out;
}
function jgRemove(t,f,s){const c=jgCopy(t);c.floors[f][s]=0;return c;}
/* Freie Plätze oben: in der obersten Etage, ist sie voll, in einer neuen (quer zur darunter, Plätze 0–2) */
function jgSlots(t){const T=jgTop(t);return jgTopFull(t)?[[T+1,0],[T+1,1],[T+1,2]]:t.floors[T].map((a,s)=>a?null:[T,s]).filter(Boolean);}
function jgPlace(t,f,s){const c=jgCopy(t);if(f>jgTop(c))c.floors.push([0,0,0]);c.floors[f][s]=1;return c;}
/* Ein ganzer Zug (Stein ziehen und oben ablegen); gibt null zurück, wenn der Turm danach fällt */
function jgMove(t,f,s,pf,ps){const a=jgRemove(t,f,s);if(jgMargin(a)<0)return null;const b=jgPlace(a,pf,ps);return jgMargin(b)<0?null:b;}
/* KI: leicht = zufälliger Stein (kann den Turm zum Einsturz bringen), mittel = zufälliger sicherer Stein, schwer = der Zug, nach dem dem Gegner die wenigsten sicheren Steine bleiben */
function jgSafeMoves(t){return jgRemovable(t).filter(([f,s])=>jgMargin(jgRemove(t,f,s))>=JG_SAFE);}
function jgAiMove(t,level,rnd,seed){
  rnd=rnd||Math.random;seed=seed|0;const all=jgRemovable(t);if(!all.length)return null;const pick=a=>a[Math.floor(rnd()*a.length)];
  const bestSlot=(a)=>{let best=null,bm=-9;jgSlots(a).forEach(([pf,ps])=>{const m=jgMargin(jgPlace(a,pf,ps));if(m>bm+1e-9){bm=m;best=[pf,ps];}});return best;};
  if(level==='leicht'){const [f,s]=pick(all),a=jgRemove(t,f,s),sl=jgSlots(a)[0]||[0,0];return {f,s,pf:sl[0],ps:sl[1]};}
  const safe=jgSafeMoves(t);if(!safe.length){let best=all[0],bm=-9;all.forEach(([f,s])=>{const m=jgMargin(jgRemove(t,f,s));if(m>bm){bm=m;best=[f,s];}});const sl=bestSlot(jgRemove(t,best[0],best[1]))||[0,0];return {f:best[0],s:best[1],pf:sl[0],ps:sl[1]};}
  if(level==='mittel'){const loose=safe.filter(([f,s])=>jgTight(t,f,s,seed)<0.65),[f,s]=pick(loose.length?loose:safe),sl=bestSlot(jgRemove(t,f,s));return {f,s,pf:sl[0],ps:sl[1]};}
  let best=null,bn=1e9;
  safe.forEach(([f,s])=>{const a=jgRemove(t,f,s);jgSlots(a).forEach(([pf,ps])=>{const b=jgPlace(a,pf,ps);if(jgMargin(b)<JG_SAFE)return;const n=jgSafeMoves(b).length+rnd()*0.4+jgTight(t,f,s,seed)*1.2;if(n<bn){bn=n;best={f,s,pf,ps};}});});
  return best||{f:safe[0][0],s:safe[0][1],pf:jgSlots(jgRemove(t,safe[0][0],safe[0][1]))[0][0],ps:jgSlots(jgRemove(t,safe[0][0],safe[0][1]))[0][1]};
}
/* ── Festigkeit der Steine und Erschütterung (Physik des Ziehens) ── */
const JG_K=9,JG_DECAY=0.96,JG_PULL_DIST=2.6;
const jgOverlap=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.z1,b.z1)-Math.max(a.z0,b.z0));
/* Last, die der Stein in Etage f, Platz s trägt: Jeder Stein der Etage darüber trägt sich selbst und (gleichmäßig verteilt) alles darüber und gibt das nach Berührfläche an die Steine darunter weiter */
function jgLoad(t,f,s){
  if(f+1>=t.floors.length||!t.floors[f][s])return 0;
  let m2=0;for(let g=f+2;g<t.floors.length;g++)m2+=t.floors[g][0]+t.floors[g][1]+t.floors[g][2];
  const ups=t.floors[f+1],n=ups[0]+ups[1]+ups[2];if(!n)return 0;
  let load=0;
  ups.forEach((a,u)=>{if(!a)return;const ru=jgRect(f+1,u);let tot=0,mine=0;
    t.floors[f].forEach((b,l)=>{if(!b)return;const ov=jgOverlap(ru,jgRect(f,l));tot+=ov;if(l===s)mine=ov;});
    if(tot>0)load+=(1+m2/n)*mine/tot;});
  return load;
}
/* Zufällige Rauheit je Stein (0,75–1,25), bei gleichem Spiel (seed) immer gleich */
function jgRough(seed,f,s){let h=((seed|0)*374761393+f*668265263+s*2147483647+97)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return 0.75+((h>>>0)%1000)/2000;}
/* Festigkeit 0 … 1,6: unter 0,3 locker, bis 0,65 fest, darüber klemmt der Stein */
const jgTight=(t,f,s,seed)=>Math.max(0,Math.min(1.6,jgLoad(t,f,s)*jgRough(seed,f,s)/20));
const jgTightClass=x=>x<0.3?'locker':x<0.65?'fest':'klemmt';
/* Wie viel Erschütterung der Turm verträgt: je größer die Reserve (vor und nach dem Ziehen, die kleinere zählt), desto mehr */
const jgCap=(mNow,mAfter)=>0.8+2.2*Math.max(0,Math.min(1.5,Math.min(mNow,mAfter)))/1.5;
/* Erschütterung: klingt je Bild ab, wächst beim Herausziehen um (Zugweg mal Festigkeit mal 9) */
const jgShake=(shake,dp,tight)=>shake*JG_DECAY+Math.max(0,dp)*tight*JG_K;
/* Spielstand je Konto: Solo-Bestwert, Siege, Tagesgrenze der Coins */
function jgAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function jgAll(){try{const o=JSON.parse(localStorage.getItem(JG_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function jgProf(){
  const p=jgAll()[jgAccount().toLowerCase()||'_gast']||{},wins={},daily={};
  Object.keys(JG_REWARD).forEach(k=>{wins[k]=Math.max(0,Math.min(99999,(p.wins&&p.wins[k])|0));daily[k]=p.daily&&typeof p.daily[k]==='string'&&/^\d{4}-\d\d-\d\d$/.test(p.daily[k])?p.daily[k]:'';});
  return {best:Math.max(0,Math.min(99999,p.best|0)),wins,daily};
}
function jgSaveProf(p){const all=jgAll();all[jgAccount().toLowerCase()||'_gast']={best:p.best,wins:p.wins,daily:p.daily};try{localStorage.setItem(JG_KEY,JSON.stringify(all));}catch(e){}}
const jgDay=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
/* Sieg gegen die KI verbuchen: Sieg zählen, Coins nur einmal pro Tag und Stufe; gibt die ausgezahlten Coins zurück */
function jgWin(level,pay){
  if(!JG_REWARD[level])return 0;const p=jgProf();p.wins[level]++;let coins=0;
  if(p.daily[level]!==jgDay()){p.daily[level]=jgDay();coins=JG_REWARD[level];}
  jgSaveProf(p);if(coins&&pay)coins=pay(coins);return coins;
}
function jgSolo(moves){const p=jgProf(),nb=moves>p.best;if(nb){p.best=Math.min(99999,moves);jgSaveProf(p);}return nb;}
/* ── Oberfläche ── */
const JG_W=720,JG_H=660,JG_S=34,JG_SH=0.6,JG_VS=40;
const JG_COLORS=['#ff7043','#42a5f5','#66bb6a','#ffca28'];
let jg=null,jgRaf=null,jgHover=null,jgHits=[];
/* Spieler: bei KI und 2 Spielern aus spielmeta (Account, Emoji, Farbe), sonst einfache Namen */
const jgIsRanked=()=>!!jg&&(jg.mode==='ki'||(jg.mode==='lokal'&&jg.players===2));
const jgPlayer=i=>{try{return jgIsRanked()&&typeof smPlayers==='function'?smPlayers('jg')[i]:null;}catch(e){return null;}};
const jgCol=i=>{const p=jgPlayer(i);return p&&p.color||JG_COLORS[i%4];};
const JG_LEVEL_MAP={easy:'leicht',medium:'mittel',hard:'schwer'},JG_LEVEL_BACK={leicht:'easy',mittel:'medium',schwer:'hard'};
const jgEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function jgActive(){const s=document.getElementById('screen-jenga');return !!s&&s.classList.contains('active');}
function jgPay(n){try{const name=jgAccount();if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
function jgInit(){jgStopLoop();jg=Object.assign(jg||{mode:'ki',level:'mittel',players:2},{view:'menu'});jgRender();}
function jgStopLoop(){if(jgRaf){cancelAnimationFrame(jgRaf);jgRaf=null;}}
function jgRender(){
  const root=document.getElementById('jg-root');if(!root)return;
  if(jg.view==='menu'){
    const p=jgProf(),chip=(on,label,fn)=>'<button type="button" class="lrn-chip'+(on?' active':'')+'" onclick="'+fn+'">'+label+'</button>';
    root.innerHTML=`<p style="font-size:13px;color:var(--text-2);text-align:center">Ziehe einen Stein aus dem Turm und lege ihn oben auf. Wer den Turm zum Einsturz bringt, verliert. Je weniger Steine unten stehen, desto mehr wackelt der Turm.</p>
    <div class="lrn-card"><div class="lrn-label">Modus</div><div style="display:flex;gap:8px;flex-wrap:wrap">${chip(jg.mode==='ki','🤖 Gegen die KI',"jgPick('ki')")}${chip(jg.mode==='lokal'&&jg.players===2,'👥 2 Spieler (zwei Accounts)',"jgPick('lokal',2)")}${chip(jg.mode==='lokal'&&jg.players===3,'👥 3 Spieler',"jgPick('lokal',3)")}${chip(jg.mode==='lokal'&&jg.players===4,'👥 4 Spieler',"jgPick('lokal',4)")}${chip(jg.mode==='solo','🧗 Solo',"jgPick('solo')")}</div>
    ${jg.mode==='ki'?'<div class="lrn-label" style="margin-top:10px">KI-Stufe</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+['leicht','mittel','schwer'].map(l=>chip(jg.level===l,l+' ('+JG_REWARD[l]+' 🪙/Tag · '+p.wins[l]+' Siege)',"jgLevel('"+l+"')")).join('')+'</div>':''}
    ${jg.mode==='solo'?'<div style="font-size:12px;color:var(--text-3);margin-top:8px">Bestwert: <b>'+p.best+'</b> Züge</div>':''}
    ${jg.mode==='lokal'&&jg.players>2?'<div style="font-size:12px;color:var(--text-3);margin-top:8px">Mit 3 oder 4 Spielern gibt es keine Wertung – 2-Spieler-Partien zählen für Ränge, Serie und Cup.</div>':''}
    <div style="margin-top:12px"><button class="lrn-btn" onclick="jgStart(jg.mode,jg.mode==='ki'?jg.level:jg.players)">▶ Spiel starten</button></div></div>`;
    if(typeof smRefresh==='function')smRefresh('jg');
    return;
  }
  root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:8px"><button class="lrn-btn ghost" onclick="jgMenu()">← Menü</button><span class="game-chip" id="jg-turn"></span><span class="game-chip" id="jg-info"></span></div>
    <div style="position:relative;max-width:${JG_W}px;margin:0 auto"><canvas id="jg-canvas" width="${JG_W}" height="${JG_H}" style="display:block;width:100%;height:auto;border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.35);cursor:grab;touch-action:none"></canvas><div id="jg-over"></div></div>
    <div id="jg-hint" style="font-size:12px;color:var(--text-3);text-align:center;margin-top:8px"></div>`;
  const cv=document.getElementById('jg-canvas');
  if(typeof smRefresh==='function')smRefresh('jg');
  cv.onmousemove=e=>{jgHover=jgHit(cv,e);};cv.onmouseleave=()=>{jgHover=null;};cv.onclick=e=>jgClick(jgHit(cv,e));cv.onpointerdown=e=>jgDown(cv,e);
}
/* Modus im Menü wählen (zeigt die Spielerauswahl für 2-Spieler-Modi) */
function jgPick(mode,n){jg.mode=mode;if(n)jg.players=n;jgRender();}
function jgLevel(l){jg.level=l;jgRender();}
/* Von außen (Schnellduell, Meisterschaft der Spielzentrale): Modus setzen – '2p' = zwei Accounts, 'ai' = gegen die KI */
function jgSetMode(m){if(!jg)jg={view:'menu',mode:'ki',level:'mittel',players:2};jg.mode=m==='ai'?'ki':'lokal';jg.players=2;if(jg.view==='game'){jgMenu();}else jgRender();}
function jgMenu(){jgStopLoop();jg.view='menu';jgRender();}
function jgStart(mode,arg){
  jgStopLoop();jg=Object.assign(jg,{view:'game',mode,t:jgNew(),turn:0,phase:'pick',sel:null,moves:0,over:null,anim:null,wob:0,bits:[],time:0,msg:'',msgT:0,seed:Math.floor(Math.random()*1e9),shake:0,pull:null,carry:null,cap:jgCap(1.5,1.5)});
  if(mode==='ki')jg.level=arg;else if(mode==='lokal')jg.players=arg;
  jg.mode=mode;
  jg.n=mode==='lokal'?jg.players:mode==='ki'?2:1;jgRender();jgHud();jgLoop();
}
const jgName=i=>{const p=jgPlayer(i);return p?(p.isAI?'KI ('+jg.level+')':p.avatar+' '+p.name):jg.mode==='solo'?(jgAccount()||'Du'):'Spieler '+(i+1);};
function jgHud(){
  const t=document.getElementById('jg-turn'),i=document.getElementById('jg-info'),h=document.getElementById('jg-hint');if(!t||!jg.t)return;
  t.innerHTML='<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+jgCol(jg.turn)+'"></span> '+jgEsc(jgName(jg.turn))+(jg.over?'':jg.phase==='pick'?' · Stein wählen':jg.phase==='pull'?' · ziehen …':' · oben ablegen');
  i.textContent='🧱 '+jgCount(jg.t)+' Steine · Etagen '+jg.t.floors.length+' · Züge '+jg.moves;
  if(h)h.textContent=jg.msg||(jg.phase==='pick'?'Halte einen hellen Stein gedrückt und ziehe ihn langsam heraus – in jede Richtung: längs, seitlich (wenn dort kein Stein im Weg ist) oder schräg. Hastiges Ziehen erschüttert den Turm. Antippen testet, wie fest er sitzt.':jg.phase==='pull'?'Gleichmäßig ziehen! Je fester der Stein, desto stärker wackelt der Turm.':'Klicke einen freien Platz ganz oben.');
}
/* Projektion: Isometrie. x nach rechts-unten, z nach links-unten, y nach oben */
function jgPt(x,y,z,ox,oy){return [JG_W/2+(x-z)*JG_S*0.866+(ox||0),JG_H-70-y*JG_VS*JG_SH*1.0+(x+z)*JG_S*0.5+(oy||0)];}
function jgBox(r,f,off){ // acht Ecken eines Steins in Etage f, verschoben um off
  const y0=f*JG_SH,y1=y0+JG_SH*0.96,o=off||[0,0,0],c=[];
  [[r.x0,r.z0],[r.x1,r.z0],[r.x1,r.z1],[r.x0,r.z1]].forEach(p=>{c.push([p[0]+o[0],y0+o[1],p[1]+o[2]]);});[[r.x0,r.z0],[r.x1,r.z0],[r.x1,r.z1],[r.x0,r.z1]].forEach(p=>{c.push([p[0]+o[0],y1+o[1],p[1]+o[2]]);});return c;
}
function jgFaces(c,sw){const P=c.map(p=>jgPt(p[0],p[1],p[2],sw[0],sw[1]));return {top:[P[4],P[5],P[6],P[7]],left:[P[3],P[2],P[6],P[7]],right:[P[1],P[2],P[6],P[5]]};}
function jgPoly(ctx,pts,fill,stroke){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
const jgIn=(p,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
function jgHit(cv,e){const r=cv.getBoundingClientRect(),p=[(e.clientX-r.left)/r.width*JG_W,(e.clientY-r.top)/r.height*JG_H];for(let i=jgHits.length-1;i>=0;i--)if(jgIn(p,jgHits[i].poly))return jgHits[i].id;return null;}
function jgHuman(){return jg.mode!=='ki'||jg.turn===0;}
function jgClick(id){
  if(!jg||jg.view!=='game'||jg.over||jg.anim||!jgHuman()||!id)return;
  if(jg.phase==='place'&&id[0]==='p'){const [,pf,ps]=id.split('_').map((v,i)=>i?+v:v);jgPut(pf,ps);}
}
/* Stein herausziehen beginnen: Erschütterungsgrenze aus der Reserve des Turms, Festigkeit aus Last und Rauheit */
function jgPull(f,s,ai,v,dir){
  const a=jgRemove(jg.t,f,s),mN=jgMargin(jg.t),mA=jgMargin(a);
  jg.sel={f,s};jg.after=a;jg.phase='pull';jg.msg='';jgHud();
  jg.pull={f,s,p:0,lastP:0,dx:0,dz:0,sign:1,dir:dir||jgWorld(f,1,0),ai:!!ai,v:v||0,tight:jgTight(jg.t,f,s,jg.seed),cap:jgCap(mN,mA),mA,retract:false};
}
function jgDown(cv,e){
  if(!jg||jg.view!=='game'||jg.over||jg.anim||jg.phase!=='pick'||!jgHuman()||e.button>0)return;
  const id=jgHit(cv,e);if(!id||id[0]!=='s')return;
  const [,f,s]=id.split('_').map((v,i)=>i?+v:v);if(!jgRemovable(jg.t).some(m=>m[0]===f&&m[1]===s))return;
  e.preventDefault();const r0=cv.getBoundingClientRect();   // Lage der Zeichenfläche beim Anfassen: ändert sich das Layout beim Ziehen (Textzeile bricht um, Seite scrollt), bleibt der Zugweg trotzdem richtig
  const pos=ev=>[(ev.clientX-r0.left)/r0.width*JG_W,(ev.clientY-r0.top)/r0.height*JG_H];
  const p0=pos(e);let maxP=0;const t0=Date.now();
  jgPull(f,s,false);cv.style.cursor='grabbing';
  const move=ev=>{if(!jg.pull||jg.pull.ai)return;const q=pos(ev),dxp=q[0]-p0[0],dyp=q[1]-p0[1],w=jgScreenToWorld(dxp,dyp),d=jgDrag(jg.t,f,s,w[0],w[1]);
    maxP=Math.max(maxP,Math.hypot(dxp,dyp));jg.pull.dx=d.dx;jg.pull.dz=d.dz;jg.pull.p=d.p;if(Math.hypot(d.dx,d.dz)>0.15)jg.pull.sign=1;};
  const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);cv.style.cursor='grab';
    if(!jg||!jg.pull||jg.phase!=='pull')return;
    if(maxP<10&&Date.now()-t0<600){jgTap(f,s);}else jg.pull.retract=true;};   // zu früh losgelassen: der Stein rutscht zurück
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
}
/* ── Zugrichtung: Bildschirm → Tischebene, längs/quer zum Stein, Platz neben dem Stein, Fortschritt ── */
/* Mausweg in Bildpunkten (dx, dy) → Verschiebung auf dem Tisch (x, z); Umkehrung der Isometrie in jgPt */
const jgScreenToWorld=(dx,dy)=>{const a=dx/(JG_S*0.866),b=dy/(JG_S*0.5);return [(a+b)/2,(b-a)/2];};
/* Gerade Etagen: Steine liegen längs z (quer zu ihnen x), ungerade längs x (quer z) */
const jgLocal=(f,wx,wz)=>f%2===0?[wz,wx]:[wx,wz];   // [längs u, quer v]
const jgWorld=(f,u,v)=>f%2===0?[v,u]:[u,v];          // [x, z]
/* Wie weit der Stein quer ausweichen kann: bis zum nächsten Nachbarstein, nach außen am Rand unbegrenzt (3) */
function jgFree(t,f,s){
  let lo=-3,hi=3;
  for(let k=s-1;k>=0;k--)if(t.floors[f][k]){lo=-(s-k-1);break;}
  for(let k=s+1;k<=2;k++)if(t.floors[f][k]){hi=k-s-1;break;}
  return {lo,hi};
}
const JG_TOWER={x0:-1.5,x1:1.5,z0:-1.5,z1:1.5};
/* Fortschritt 0…1: 0 = Stein liegt ganz im Turm, 1 = nur noch höchstens 0,4 der 3 Flächeneinheiten liegen auf dem Turm */
function jgProgress(f,s,dx,dz){const r=jgRect(f,s),m={x0:r.x0+dx,x1:r.x1+dx,z0:r.z0+dz,z1:r.z1+dz};return Math.max(0,Math.min(1,(3-jgOverlap(m,JG_TOWER))/2.6));}
/* Verschiebung des Steins aus dem Mausweg: längs frei, quer nur im freien Bereich */
function jgDrag(t,f,s,wx,wz){
  const [u,v]=jgLocal(f,wx,wz),fr=jgFree(t,f,s),vc=Math.max(fr.lo,Math.min(fr.hi,v)),w=jgWorld(f,u,vc);
  return {dx:w[0],dz:w[1],p:jgProgress(f,s,w[0],w[1])};
}
/* Antippen: testet, wie fest der Stein sitzt (mit etwas Unschärfe) und wackelt leicht am Turm */
function jgTap(f,s){
  const x=jg.pull.tight+(Math.random()-0.5)*0.2;jg.pull=null;jg.phase='pick';
  jg.shake+=0.15*Math.min(1.2,jgTight(jg.t,f,s,jg.seed));
  jg.msg='Der Stein sitzt '+jgTightClass(x)+'.';jg.msgT=150;jgHud();
}
function jgPullTick(){
  const P=jg.pull;let dp=0;
  if(P.ai){const step=P.v*JG_PULL_DIST;P.dx+=P.dir[0]*step;P.dz+=P.dir[1]*step;const np=jgProgress(P.f,P.s,P.dx,P.dz);dp=Math.max(0,np-P.p);P.p=np>=0.9999?1:np;}
  else if(P.retract){P.p=Math.max(0,P.p-0.05);P.dx*=0.9;P.dz*=0.9;P.lastP=P.p;if(P.p<=0){jg.pull=null;jg.phase='pick';jgHud();}return;}
  else{dp=P.p-P.lastP;P.lastP=P.p;}
  jg.shake+=Math.max(0,dp)*P.tight*JG_K;   // das Abklingen passiert in jgTick
  if(jg.shake>P.cap){const mine=!P.ai;jg.pull=null;jgCollapse(jg.turn,mine?'Zu hastig gezogen – der Turm hat gewackelt und ist eingestürzt.':'Die KI hat zu hastig gezogen – der Turm ist eingestürzt.');return;}
  if(P.p>=1){
    jg.pull=null;
    if(P.mA<0){jgCollapse(jg.turn,'Der Turm hat den fehlenden Stein nicht ausgehalten.');return;}
    jg.t=jg.after;{const L=Math.hypot(P.dx,P.dz)||1;jg.carry={f:P.f,s:P.s,dx:P.dx/L*(JG_PULL_DIST+0.9),dz:P.dz/L*(JG_PULL_DIST+0.9)};}jg.phase='place';jg.wob=Math.max(0,Math.min(1,(JG_WOBBLE-P.mA)/JG_WOBBLE));jg.cap=jgCap(P.mA,P.mA);jgHud();
    if(jg.mode==='ki'&&jg.turn===1)setTimeout(()=>{if(jg&&jg.phase==='place'&&!jg.over)jgPut(jg.aiMove.pf,jg.aiMove.ps);},350);
  }
}
function jgPut(pf,ps){
  jg.carry=null;jg.anim={kind:'put',t:0,pf,ps};jg.phase='anim';
}
function jgEndTurn(){
  jg.moves++;jg.turn=(jg.turn+1)%jg.n;jg.phase='pick';jg.sel=null;jg.msg='';
  if(jg.mode!=='solo'&&!jgRemovable(jg.t).length){jgOver(jg.turn,'Kein Stein darf mehr gezogen werden.');return;}
  jgHud();if(jg.mode==='ki'&&jg.turn===1)setTimeout(jgAiTurn,600);
}
function jgAiTurn(){
  if(!jg||jg.view!=='game'||jg.over||jg.turn!==1||jg.mode!=='ki')return;
  const mv=jgAiMove(jg.t,jg.level,undefined,jg.seed);if(!mv){jgOver(1,'');return;}jg.aiMove=mv;
  const v=jg.level==='leicht'?0.035+Math.random()*0.02:jg.level==='mittel'?0.02:0.011;const edge=mv.s!==1,sideways=edge&&Math.random()<0.35,sg=Math.random()<0.5?1:-1,dir=sideways?jgWorld(mv.f,0,mv.s===0?-1:1):jgWorld(mv.f,sg,0);
  jgPull(mv.f,mv.s,true,v,dir);
}
function jgCollapse(loser,why){
  jg.anim={kind:'fall',t:0};jg.phase='anim';jg.loser=loser;jg.why=why;
  jg.bits=[];jg.t.floors.forEach((fl,f)=>fl.forEach((a,s)=>{if(a)jg.bits.push({f,s,x:0,y:0,z:0,vx:(Math.random()-0.5)*0.14,vy:Math.random()*0.05,vz:(Math.random()-0.5)*0.14});}));
}
function jgOver(loser,why){
  jg.over={loser,why};jg.anim=null;jg.phase='over';
  let html='',n=jg.mode==='solo'?jg.moves:0;
  if(jgIsRanked()){   // 2 Spieler / KI: Wertung und Ergebnisfenster kommen aus spielmeta
    let c=0;if(jg.mode==='ki'&&loser===1)c=jgWin(jg.level,jgPay);
    const el=document.getElementById('jg-over');if(el)el.innerHTML='';jgHud();
    smReport('jg',{winner:1-loser});
    if(c&&typeof showToast==='function')showToast('🪙 +'+c+' AppHub-Coins für den Sieg gegen die KI',3000);
    return;
  }
  if(jg.mode==='solo'){const nb=jgSolo(jg.moves);html=`<div style="font-size:40px">🏗️</div><div style="font-size:22px;font-weight:800">Der Turm ist eingestürzt!</div><div style="font-size:14px;margin:8px 0 12px">${jg.moves} Züge geschafft${nb?' · 🏅 neuer Bestwert!':''}</div>`;}
  else html=`<div style="font-size:40px">💥</div><div style="font-size:22px;font-weight:800">${jgEsc(jgName(loser))} hat den Turm umgeworfen!</div><div style="font-size:13px;margin:8px 0 12px">${jgEsc(why||'')}</div>`;
  const el=document.getElementById('jg-over');if(el)el.innerHTML='<div class="td-over">'+html+`<div style="display:flex;gap:8px"><button class="lrn-btn" onclick="jgStart(jg.mode,jg.mode==='ki'?jg.level:jg.players)">Nochmal</button><button class="lrn-btn ghost" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)" onclick="jgMenu()">Menü</button></div></div>`;
  jgHud();
}
function jgLoop(){
  if(!jgActive()||!jg||jg.view!=='game'){jgRaf=null;return;}
  jgTick();const cv=document.getElementById('jg-canvas');if(cv)jgDraw(cv.getContext('2d'));jgRaf=requestAnimationFrame(jgLoop);
}
function jgTick(){
  jg.time++;jg.shake*=JG_DECAY;if(jg.msgT>0&&--jg.msgT===0){jg.msg='';jgHud();}
  if(jg.phase==='pull'&&jg.pull){jgPullTick();return;}
  const a=jg.anim;
  if(!a){jg.wob=jg.wob*0.98;return;}
  a.t++;
  if(a.kind==='put'&&a.t>=16){
    jg.anim=null;const nt=jgPlace(jg.t,a.pf,a.ps),m=jgMargin(nt);jg.t=nt;
    if(m<0){jgCollapse(jg.turn,'Der Turm ist nach dem Ablegen gekippt.');return;}
    jg.wob=Math.max(0,Math.min(1,(JG_WOBBLE-m)/JG_WOBBLE));jg.cap=jgCap(m,m);
    jg.shake+=0.25+Math.max(0,JG_WOBBLE-m)*4;   // Ablegen erschüttert den Turm, besonders wenn er knapp steht
    if(jg.shake>jg.cap){jgCollapse(jg.turn,'Der Turm hat das Ablegen nicht verkraftet.');return;}
    jgEndTurn();
  }else if(a.kind==='fall'){
    jg.bits.forEach(b=>{b.vy-=0.006;b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;if(b.y<-b.f*JG_SH){b.y=-b.f*JG_SH;b.vy*=-0.2;b.vx*=0.9;b.vz*=0.9;}});
    if(a.t>110)jgOver(jg.loser,jg.why);
  }
}
function jgDraw(ctx){
  jgHits=[];ctx.clearRect(0,0,JG_W,JG_H);
  const g=ctx.createLinearGradient(0,0,0,JG_H);g.addColorStop(0,'#1d2540');g.addColorStop(1,'#2d3a5e');ctx.fillStyle=g;ctx.fillRect(0,0,JG_W,JG_H);
  // Tisch
  const tb=[[-3.2,0,-3.2],[3.2,0,-3.2],[3.2,0,3.2],[-3.2,0,3.2]].map(p=>jgPt(p[0],p[1],p[2]));jgPoly(ctx,tb,'#7b5a3a','#5a3f26');
  if(!jg.t)return;
  const t=jg.t,capNow=jg.pull?jg.pull.cap:jg.cap||2,amp=Math.max(Math.min(1.3,jg.shake/capNow),jg.wob*0.5),sway=amp*Math.sin(jg.time*0.35)*0.07,removable=jg.phase==='pick'&&jgHuman()&&!jg.anim&&!jg.over?jgRemovable(t):[];
  const bits=jg.anim&&jg.anim.kind==='fall'?jg.bits:null;
  const colors=f=>['#d9a566','#c68e4e','#e2b676'][f%3];
  let glowLast=null;   // der markierte Stein wird zuletzt gezeichnet, damit er ganz zu sehen ist und leuchtet
  const drawBox=(r,f,off,fill,id,hl)=>{
    const sw=[sway*f*JG_S*0.6,0],F=jgFaces(jgBox(r,f,off),sw);
    if(hl&&!glowLast){if(id)jgHits.push({id,poly:hullPoly(F)});glowLast=[r,f,off,fill,null];return;}
    if(hl){ // markierter Stein: leuchtet in der Farbe des Spielers, der am Zug ist
      const pc=jgCol(jg.turn),pulse=0.5+0.5*Math.sin(jg.time*0.2);
      ctx.save();ctx.shadowColor=pc;ctx.shadowBlur=22+pulse*14;
      jgPoly(ctx,F.left,mix(fill,pc,0.55,-20),pc);jgPoly(ctx,F.right,mix(fill,pc,0.55,-6),pc);jgPoly(ctx,F.top,mix(fill,pc,0.6,26),pc);
      ctx.restore();ctx.strokeStyle=pc;ctx.lineWidth=3;[F.left,F.right,F.top].forEach(q=>{ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.stroke();});
    }else{jgPoly(ctx,F.left,shade(fill,-28),'rgba(0,0,0,.35)');jgPoly(ctx,F.right,shade(fill,-14),'rgba(0,0,0,.35)');jgPoly(ctx,F.top,shade(fill,6),'rgba(0,0,0,.35)');}
    if(id)jgHits.push({id,poly:[].concat(F.top.slice(0,2),[F.right[1],F.left[0]],[F.left[1]]).length?hullPoly(F):F.top});
  };
  function mix(c,p,k,d){const a=parseInt(c.slice(1),16),b=parseInt(p.slice(1),16),f=(x,y)=>Math.max(0,Math.min(255,Math.round(x*(1-k)+y*k+(d||0))));return 'rgb('+f(a>>16,b>>16)+','+f((a>>8)&255,(b>>8)&255)+','+f(a&255,b&255)+')';}
  function hullPoly(F){return jgHull([].concat(F.top,F.left,F.right)).reverse();}
  function shade(c,d){const n=parseInt(c.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+d)),gg=Math.max(0,Math.min(255,((n>>8)&255)+d)),b=Math.max(0,Math.min(255,(n&255)+d));return 'rgb('+r+','+gg+','+b+')';}
  const pull=jg.pull;
  for(let f=0;f<t.floors.length+(jg.after&&pull?0:0);f++){
    const order=[0,1,2].sort((a,b)=>{const ca=jgCenter(f,a),cb=jgCenter(f,b);return (ca[0]+ca[1])-(cb[0]+cb[1]);});
    order.forEach(s=>{
      if(bits){const b=bits.find(q=>q.f===f&&q.s===s);if(b)drawBox(jgRect(f,s),f,[b.x,b.y,b.z],colors(f+s),null,false);return;}
      const present=t.floors[f][s]&&!(pull&&pull.f===f&&pull.s===s);
      if(present){const id='s_'+f+'_'+s,can=removable.some(m=>m[0]===f&&m[1]===s),hov=jgHover===id&&can;drawBox(jgRect(f,s),f,null,colors(f+s),can?id:null,hov||(can&&jg.time%90<8&&false));
        if(can&&!hov){const c=jgCenter(f,s),P=jgPt(c[0],f*JG_SH+JG_SH,c[1],sway*f*JG_S*0.6,0);ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(P[0],P[1],2.5,0,7);ctx.fill();}}
      else if(pull&&pull.f===f&&pull.s===s){const j=pull.tight>0.4?Math.sin(jg.time*1.7)*0.035*pull.tight:0;drawBox(jgRect(f,s),f,[pull.dx+j,0,pull.dz+j*0.6],colors(f+s),null,true);}
    });
  }
  if(glowLast){const [r,f,off,fill,id]=glowLast;glowLast=[];const keep=jgHits.length;drawBox(r,f,off,fill,id,true);}
  if(jg.carry&&jg.phase==='place'){const c=jg.carry;drawBox(jgRect(c.f,c.s),c.f,[c.dx,0,c.dz],colors(c.f+c.s),null,false);}
  // Erschütterungs-Anzeige
  if(jg.pull&&!bits){const r=Math.min(1,jg.shake/jg.pull.cap);ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(16,16,170,14);ctx.fillStyle=r<0.5?'#66bb6a':r<0.8?'#ffca28':'#ef5350';ctx.fillRect(17,17,168*r,12);ctx.fillStyle='#fff';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText('Erschütterung · Stein '+jgTightClass(jg.pull.tight),16,46);}
  // freie Plätze oben beim Ablegen
  if(!bits&&(jg.phase==='place'||jg.anim&&jg.anim.kind==='put')){
    const slots=jgSlots(t),pa=jg.anim&&jg.anim.kind==='put'?jg.anim:null;
    slots.forEach(([f,s])=>{const id='p_'+f+'_'+s,hov=jgHover===id&&jgHuman()&&!pa;
      if(pa&&(pa.pf!==f||pa.ps!==s))return;const lift=pa?(1-pa.t/16)*1.4:0;
      const F=jgFaces(jgBox(jgRect(f,s),f,[0,lift,0]),[0,0]);jgPoly(ctx,F.left,pa?'#b07a3c':'rgba(255,255,255,.12)');jgPoly(ctx,F.right,pa?'#c68e4e':'rgba(255,255,255,.16)');if(hov){ctx.save();ctx.shadowColor=jgCol(jg.turn);ctx.shadowBlur=24;}jgPoly(ctx,F.top,pa?'#e2b676':hov?jgCol(jg.turn):'rgba(255,255,255,.28)',hov?jgCol(jg.turn):'rgba(255,255,255,.7)');if(hov)ctx.restore();
      if(!pa&&jgHuman())jgHits.push({id,poly:jgHull([].concat(F.top,F.left,F.right)).reverse()});});
  }
  if(jg.wob>0.05&&!jg.over&&!bits){ctx.fillStyle='rgba(255,200,60,.9)';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('⚠ Der Turm wackelt!',JG_W/2,34);}
}

/* ── Anbindung an spielmeta (Ränge, Hall of Fame, Serie, Cup, Duell) ── */
if(typeof SM_HERO!=='undefined')SM_HERO.jg=['🧱','#8d5524','Wer den Turm umwirft, verliert'];
if(typeof smRegister==='function')smRegister({id:'jg',screen:'screen-jenga',title:'Jenga',sides:['Spieler 1','Spieler 2'],
  isOver:()=>!jg||jg.view!=='game'||!!jg.over,cancelPending:()=>{},
  active:()=>jgIsRanked(),
  levels:['easy','medium','hard'],setLevel:l=>{if(jg&&JG_LEVEL_MAP[l])jg.level=JG_LEVEL_MAP[l];},
  sideAI:()=>[false,!!jg&&jg.mode==='ki'],difficulty:()=>jg&&jg.mode==='ki'?JG_LEVEL_BACK[jg.level]:null,
  newGame:()=>{if(jg&&jg.view==='game')jgStart(jg.mode,jg.mode==='ki'?jg.level:jg.players);},
  onPlayers:()=>{if(jg&&jg.view==='game')jgHud();}});
