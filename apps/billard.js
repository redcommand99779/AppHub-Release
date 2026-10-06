/* ══════════════════════════════════
   BILLARD – 8-Ball-Pool von oben. 15 Kugeln (1–7 volle, 9–15 halbe, die 8 schwarz) und die weiße Kugel, 6 Taschen, Physik mit festem Zeitschritt (1/240 s):
   elastische Stöße gleich schwerer Kugeln, Banden mit Verlust, Rollreibung. Zielen mit der Maus, Maustaste gedrückt halten lädt die Kraft, Loslassen stößt.
   Regeln (vereinfacht): Gruppen werden mit der ersten versenkten Kugel verteilt (offener Tisch), weiter spielt, wer eigene Kugeln versenkt. Foul: weiße Kugel versenkt,
   keine Kugel getroffen, falsche Kugel zuerst getroffen (die 8 erst, wenn alle eigenen weg sind), nichts versenkt und keine Bande nach dem Treffer – der Gegner darf die weiße Kugel
   frei setzen. Die 8 versenken gewinnt, wenn alle eigenen Kugeln weg sind und kein Foul passiert; sonst verliert man.
   Regeln nachlesen: Knopf „Regeln“ im Menü und im Spiel. „Strenge Fouls“ lässt sich ausschalten (lockere Regeln: nur die weiße Kugel zu versenken ist ein Foul); solche Partien zählen nicht für Ränge.
   Modi: gegen die KI (leicht, mittel, schwer; berechnet Zielkugel, Tasche und Schusswinkel, mit Ungenauigkeit je Stufe), 2 Spieler (zwei Accounts über spielmeta wie Schach: PR, Serie, Cup,
   Hall of Fame) und Üben (freier Tisch). Sieg gegen die KI: 3 / 5 / 8 AppHub-Coins, je Stufe einmal pro Tag (zf_billard).
══════════════════════════════════ */
const BIL_KEY='zf_billard',BIL_REWARD={leicht:3,mittel:5,schwer:8};
const BIL_W=840,BIL_H=420,BIL_R=10.5,BIL_STEP=1/240,BIL_VMAX=1500,BIL_DEC=220,BIL_AIR=0.3,BIL_E=0.96,BIL_WALL=0.78;
const BIL_POCKETS=[[0,0,25],[BIL_W/2,-4,22],[BIL_W,0,25],[0,BIL_H,25],[BIL_W/2,BIL_H+4,22],[BIL_W,BIL_H,25]];
const BIL_COLORS=['#fff','#fbc02d','#1565c0','#e53935','#6a1b9a','#fb8c00','#2e7d32','#8d1c1c','#111'];
/* ── Reine Physik und Regeln (wird getestet) ── */
const bilGroup=id=>id===0?'cue':id===8?'eight':id<8?'solid':'stripe';
function bilRack(){
  const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,15,7],balls=[{id:0,x:BIL_W*0.25,y:BIL_H/2,vx:0,vy:0,out:false}];
  const x0=BIL_W*0.72,d=2*BIL_R+0.4;let k=0;
  for(let row=0;row<5;row++)for(let i=0;i<=row;i++){balls.push({id:order[k++],x:x0+row*d*0.866,y:BIL_H/2+(i-row/2)*d,vx:0,vy:0,out:false});}
  return balls;
}
const bilCue=b=>b[0];
const bilMoving=b=>b.some(q=>!q.out&&(q.vx!==0||q.vy!==0));
/* Ein Zeitschritt: bewegen, Reibung, Taschen, Banden, Stöße. ev sammelt: first (erste vom Spielball getroffene Kugel), pocketed (Liste von Nummern), rail (Bande nach dem ersten Treffer) */
function bilStep(balls,dt,ev){
  for(const q of balls){
    if(q.out)continue;
    q.x+=q.vx*dt;q.y+=q.vy*dt;
    let s=Math.hypot(q.vx,q.vy);
    if(s>0){const ns=Math.max(0,s-BIL_DEC*dt)*Math.exp(-BIL_AIR*dt);if(ns<3){q.vx=0;q.vy=0;}else{q.vx*=ns/s;q.vy*=ns/s;}}
    for(const p of BIL_POCKETS){if(Math.hypot(q.x-p[0],q.y-p[1])<p[2]){q.out=true;q.vx=q.vy=0;ev.pocketed.push(q.id);break;}}
    if(q.out)continue;
    let hit=false;
    if(q.x<BIL_R){q.x=BIL_R;q.vx=Math.abs(q.vx)*BIL_WALL;hit=true;}else if(q.x>BIL_W-BIL_R){q.x=BIL_W-BIL_R;q.vx=-Math.abs(q.vx)*BIL_WALL;hit=true;}
    if(q.y<BIL_R){q.y=BIL_R;q.vy=Math.abs(q.vy)*BIL_WALL;hit=true;}else if(q.y>BIL_H-BIL_R){q.y=BIL_H-BIL_R;q.vy=-Math.abs(q.vy)*BIL_WALL;hit=true;}
    if(hit&&ev.first!==null)ev.rail=true;
  }
  for(let i=0;i<balls.length;i++){const a=balls[i];if(a.out)continue;
    for(let j=i+1;j<balls.length;j++){const b=balls[j];if(b.out)continue;
      const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,m=2*BIL_R;
      if(d2>=m*m||d2===0)continue;
      const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,ov=(m-d)/2;a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;
      const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv>=0)continue;   // entfernen sich schon
      const jn=-(1+BIL_E)*rv/2;a.vx-=jn*nx;a.vy-=jn*ny;b.vx+=jn*nx;b.vy+=jn*ny;
      if(ev.first===null){if(a.id===0)ev.first=b.id;else if(b.id===0)ev.first=a.id;}
    }}
}
const bilEvents=()=>({first:null,pocketed:[],rail:false});
/* Schuss ausführen: Winkel (Bogenmaß) und Kraft 0–1; läuft bis alles steht (höchstens 60 s Spielzeit); Ergebnis: Ereignisse */
function bilShoot(balls,angle,power,ev){
  const c=balls[0],v=Math.max(0,Math.min(1,power))*BIL_VMAX;c.vx=Math.cos(angle)*v;c.vy=Math.sin(angle)*v;
  ev=ev||bilEvents();for(let i=0;i<60/BIL_STEP&&bilMoving(balls);i++)bilStep(balls,BIL_STEP,ev);return ev;
}
const bilLeft=(balls,g)=>balls.filter(q=>!q.out&&bilGroup(q.id)===g).length;
/* Regeln nach einem Schuss. st: { groups:[g0,g1] (null = offen), turn }. Rückgabe: { foul, reason, groups, next, inHand, winner (Index oder null), why } */
function bilJudge(st,balls,ev,wasLeft,loose){
  const me=st.turn,opp=1-me,groups=st.groups.slice();let foul=false,reason='';
  const cueOut=balls[0].out,pk=ev.pocketed.filter(id=>id!==0),eight=pk.includes(8);
  const mine=groups[me],needEight=mine&&wasLeft===0;
  if(cueOut){foul=true;reason='Weiße Kugel versenkt';}
  else if(loose){/* lockere Regeln: nur die weiße Kugel in der Tasche ist ein Foul */}
  else if(ev.first===null){foul=true;reason='Keine Kugel getroffen';}
  else{
    const fg=bilGroup(ev.first);
    if(mine){if(fg!==(needEight?'eight':mine)){foul=true;reason=needEight?'Zuerst muss die 8 getroffen werden':'Falsche Kugel zuerst getroffen';}}
    else if(fg==='eight'){foul=true;reason='Die 8 darf nicht zuerst getroffen werden';}
    if(!foul&&!pk.length&&!ev.rail){foul=true;reason='Keine Bande nach dem Treffer';}
  }
  const res={foul,reason,groups,next:me,inHand:false,winner:null,why:''};
  if(eight){
    const ok=!foul&&mine&&needEight;
    res.winner=ok?me:opp;res.why=ok?'Die 8 sauber versenkt':(!mine?'Die 8 bei offenem Tisch versenkt':foul?'Die 8 mit Foul versenkt ('+reason+')':'Die 8 zu früh versenkt');return res;
  }
  if(!mine&&!foul&&pk.length){const g=bilGroup(pk[0]);groups[me]=g;groups[opp]=g==='solid'?'stripe':'solid';res.groups=groups;}
  const g2=res.groups[me];
  const own=!foul&&g2&&pk.some(id=>bilGroup(id)===g2);
  if(foul){res.next=opp;res.inHand=true;}else if(!own)res.next=opp;
  return res;
}
/* Kurze Erklärung zu jedem Foul (für die Meldung im Spiel) */
const BIL_FOUL_WHY={'Weiße Kugel versenkt':'Die weiße Kugel darf nie in der Tasche landen.','Keine Kugel getroffen':'Die weiße Kugel muss eine andere Kugel berühren – sonst ist es ein Foul.','Zuerst muss die 8 getroffen werden':'Sind alle eigenen Kugeln weg, muss die 8 zuerst getroffen werden.','Falsche Kugel zuerst getroffen':'Zuerst muss eine Kugel der eigenen Gruppe getroffen werden.','Die 8 darf nicht zuerst getroffen werden':'Bei offenem Tisch darf die 8 nicht zuerst getroffen werden.','Keine Bande nach dem Treffer':'Nach dem Treffer muss eine Kugel versenkt werden oder eine Kugel an die Bande laufen.'};
const BIL_RULES=['Ziel: Versenke alle Kugeln deiner Gruppe (volle 1–7 oder halbe 9–15) und danach die schwarze 8.','Gruppen: Die erste versenkte Kugel bestimmt, welche Gruppe du bekommst. Bis dahin ist der Tisch offen.','Du bleibst am Tisch, solange du eine Kugel deiner Gruppe versenkst.','Foul: Die weiße Kugel muss immer zuerst eine Kugel deiner Gruppe berühren (die 8 erst am Ende). Wer keine Kugel trifft, die falsche trifft oder die weiße Kugel versenkt, begeht ein Foul. Auch nichts zu versenken und keine Bande zu berühren ist ein Foul.','Nach einem Foul darf der Gegner die weiße Kugel frei auf den Tisch setzen (Kugel in der Hand).','Die 8: Wer sie zu früh, bei offenem Tisch oder mit einem Foul versenkt, verliert. Sauber nach allen eigenen Kugeln versenkt, gewinnt man.'];
/* ── KI ── */
const bilDist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function bilSegDist(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;let t=l2?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy));}
/* Alle sinnvollen Schüsse (Zielkugel, Tasche): Geisterkugel-Verfahren; Wert niedriger = besser */
function bilShots(balls,group,cue){
  const c=cue||[balls[0].x,balls[0].y],left=group?bilLeft(balls,group):99,want=group?(left===0?'eight':group):null,out=[];
  for(const t of balls){
    if(t.out||t.id===0)continue;const g=bilGroup(t.id);
    if(want?g!==want:g==='eight')continue;
    for(const p of BIL_POCKETS){
      const pc=[p[0]+(p[0]===0?6:p[0]===BIL_W?-6:0),p[1]+(p[1]===0?6:p[1]===BIL_H?-6:0)],tp=[t.x,t.y],dt=bilDist(tp,pc);if(dt<1)continue;
      const ux=(pc[0]-tp[0])/dt,uy=(pc[1]-tp[1])/dt,gh=[tp[0]-ux*2*BIL_R,tp[1]-uy*2*BIL_R],dc=bilDist(c,gh);if(dc<2)continue;
      if(gh[0]<BIL_R||gh[0]>BIL_W-BIL_R||gh[1]<BIL_R||gh[1]>BIL_H-BIL_R)continue;
      const cx=(gh[0]-c[0])/dc,cy=(gh[1]-c[1])/dc,cosA=cx*ux+cy*uy;if(cosA<0.25)continue;   // Schnittwinkel unter ~75°
      let clear=true;
      for(const o of balls){if(o.out||o.id===0||o===t)continue;const op=[o.x,o.y];
        if(bilSegDist(op,c,gh)<2*BIL_R-1||bilSegDist(op,tp,pc)<2*BIL_R-1){clear=false;break;}}
      if(!clear)continue;
      out.push({ball:t.id,pocket:p,angle:Math.atan2(gh[1]-c[1],gh[0]-c[0]),dist:dc+dt,cut:Math.acos(Math.min(1,cosA)),score:dc*0.5+dt*0.8+(1-cosA)*320});
    }
  }
  return out.sort((a,b)=>a.score-b.score);
}
const BIL_AI={leicht:{err:0.075,pw:0.22,pick:1},mittel:{err:0.018,pw:0.08,pick:0.3},schwer:{err:0.008,pw:0.05,pick:0}};   // Winkelfehler (Bogenmaß), Kraftfehler, Chance auf eine schlechtere Wahl
function bilKraft(dist){return Math.max(0.22,Math.min(0.95,(260+dist*1.15)/BIL_VMAX));}
/* Wählt den Schuss: { angle, power }; ohne klaren Schuss ein vorsichtiger Treffer auf die nächste Zielkugel */
function bilAiShot(balls,group,level,rnd){
  rnd=rnd||Math.random;const L=BIL_AI[level]||BIL_AI.mittel,shots=bilShots(balls,group),gauss=()=>(rnd()+rnd()+rnd()-1.5)/0.75;
  const noise=a=>a+gauss()*L.err;
  if(shots.length){
    const pickIdx=rnd()<L.pick?Math.min(shots.length-1,Math.floor(rnd()*shots.length)):0,s=shots[pickIdx];
    return {angle:noise(s.angle),power:Math.max(0.15,Math.min(1,bilKraft(s.dist)*(1+gauss()*L.pw))),ball:s.ball,pocket:s.pocket,planned:true};
  }
  const c=balls[0],left=group?bilLeft(balls,group):99,want=group?(left===0?'eight':group):null;
  const ts=balls.filter(q=>!q.out&&q.id!==0&&(want?bilGroup(q.id)===want:bilGroup(q.id)!=='eight'));
  const t=ts.sort((a,b)=>bilDist([a.x,a.y],[c.x,c.y])-bilDist([b.x,b.y],[c.x,c.y]))[0]||balls.find(q=>!q.out&&q.id!==0);
  return {angle:noise(Math.atan2(t.y-c.y,t.x-c.x)),power:0.35+rnd()*0.2,ball:t.id,planned:false};
}
/* Platz für die weiße Kugel (Kugel in der Hand): der Ort mit dem besten Schuss; beim Anstoß hinter der Kopflinie */
function bilAiPlace(balls,group,level,rnd,breakShot){
  rnd=rnd||Math.random;let best=null,bs=1e9;const free=(x,y)=>!balls.some(q=>!q.out&&q.id!==0&&Math.hypot(q.x-x,q.y-y)<2*BIL_R+1);
  for(let i=0;i<60;i++){
    const x=breakShot?BIL_R+rnd()*(BIL_W*0.25-BIL_R):BIL_R+rnd()*(BIL_W-2*BIL_R),y=BIL_R+rnd()*(BIL_H-2*BIL_R);if(!free(x,y))continue;
    const sh=bilShots(balls,group,[x,y]),sc=sh.length?sh[0].score:500+rnd()*50;if(sc<bs){bs=sc;best=[x,y];}
  }
  return best||[BIL_W*0.2,BIL_H/2];
}
/* Strahl vom Spielkugel-Mittelpunkt: erster Treffpunkt auf eine Kugel (Geisterkugel) oder die Bande, für die Ziellinie */
function bilRay(balls,angle){
  const c=balls[0],dx=Math.cos(angle),dy=Math.sin(angle);let tBest=1e9,hitBall=null;
  for(const q of balls){if(q.out||q.id===0)continue;const ox=q.x-c.x,oy=q.y-c.y,pr=ox*dx+oy*dy;if(pr<=0)continue;
    const d2=ox*ox+oy*oy-pr*pr,m=2*BIL_R;if(d2>m*m)continue;const t=pr-Math.sqrt(m*m-d2);if(t<tBest){tBest=t;hitBall=q;}}
  let tw=1e9;
  if(dx>1e-9)tw=Math.min(tw,(BIL_W-BIL_R-c.x)/dx);else if(dx<-1e-9)tw=Math.min(tw,(BIL_R-c.x)/dx);
  if(dy>1e-9)tw=Math.min(tw,(BIL_H-BIL_R-c.y)/dy);else if(dy<-1e-9)tw=Math.min(tw,(BIL_R-c.y)/dy);
  const t=Math.min(tBest,tw);return {x:c.x+dx*t,y:c.y+dy*t,ball:tBest<=tw?hitBall:null,t};
}
/* Spielstand je Konto: Siege und Tagesgrenze der Coins */
function bilAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function bilAll(){try{const o=JSON.parse(localStorage.getItem(BIL_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function bilProf(){
  const p=bilAll()[bilAccount().toLowerCase()||'_gast']||{},wins={},daily={};
  Object.keys(BIL_REWARD).forEach(k=>{wins[k]=Math.max(0,Math.min(99999,(p.wins&&p.wins[k])|0));daily[k]=p.daily&&typeof p.daily[k]==='string'&&/^\d{4}-\d\d-\d\d$/.test(p.daily[k])?p.daily[k]:'';});
  return {wins,daily};
}
function bilSaveProf(p){const all=bilAll();all[bilAccount().toLowerCase()||'_gast']={wins:p.wins,daily:p.daily};try{localStorage.setItem(BIL_KEY,JSON.stringify(all));}catch(e){}}
const bilDay=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function bilWin(level,pay){
  if(!BIL_REWARD[level])return 0;const p=bilProf();p.wins[level]++;let coins=0;
  if(p.daily[level]!==bilDay()){p.daily[level]=bilDay();coins=BIL_REWARD[level];}
  bilSaveProf(p);if(coins&&pay)coins=pay(coins);return coins;
}
/* ── Oberfläche ── */
const BIL_CW=960,BIL_CH=560,BIL_OX=60,BIL_OY=60;
const BIL_LEVEL_MAP={easy:'leicht',medium:'mittel',hard:'schwer'},BIL_LEVEL_BACK={leicht:'easy',mittel:'medium',schwer:'hard'};
let bil=null,bilRaf=null,bilMouse=[BIL_W/2,BIL_H/2];
const bilEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const bilHasPlayers=()=>!!bil&&(bil.mode==='ki'||bil.mode==='lokal');
const bilIsRanked=()=>bilHasPlayers()&&!bil.loose;   // lockere Regeln zählen nicht für Ränge
const bilPlayer=i=>{try{return bilHasPlayers()&&typeof smPlayers==='function'?smPlayers('bil')[i]:null;}catch(e){return null;}};
const bilCol=i=>{const p=bilPlayer(i);return p&&p.color||['#ff7043','#42a5f5'][i%2];};
const bilName=i=>{const p=bilPlayer(i);return p?(p.isAI?'KI ('+bil.level+')':p.avatar+' '+p.name):bil.mode==='ueben'?(bilAccount()||'Du'):'Spieler '+(i+1);};
const bilHuman=()=>!!bil&&(bil.mode!=='ki'||bil.turn===0);
function bilActive(){const s=document.getElementById('screen-billard');return !!s&&s.classList.contains('active');}
function bilPay(n){try{const name=bilAccount();if(name&&n>0&&typeof zcAddCoins==='function'){zcAddCoins(name,n);if(typeof smSave==='function')smSave('zentrale');return n;}}catch(e){}return 0;}
function bilInit(){bilStopLoop();bil=Object.assign(bil||{mode:'ki',level:'mittel',loose:false},{view:'menu'});bilRender();}
function bilStopLoop(){if(bilRaf){cancelAnimationFrame(bilRaf);bilRaf=null;}}
function bilPick(mode){bil.mode=mode;bilRender();}
function bilLoose(v){bil.loose=!!v;bilRender();}
function bilToggleRules(){const el=document.getElementById('bil-rules');if(el)el.style.display=el.style.display==='none'?'block':'none';}
const bilRulesHtml=()=>'<ul style="margin:6px 0 0 18px;padding:0;font-size:12px;color:var(--text-2);line-height:1.5">'+BIL_RULES.map(r=>'<li>'+bilEsc(r)+'</li>').join('')+'</ul>';
function bilLevel(l){bil.level=l;bilRender();}
/* Von außen (Schnellduell, Meisterschaft): '2p' = zwei Accounts, 'ai' = gegen die KI */
function bilSetMode(m){if(!bil)bil={view:'menu',mode:'ki',level:'mittel',loose:false};bil.mode=m==='ai'?'ki':'lokal';if(bil.view==='game')bilMenu();else bilRender();}
function bilMenu(){bilStopLoop();bil.view='menu';bilRender();}
function bilStart(){
  bilStopLoop();Object.assign(bil,{view:'game',balls:bilRack(),groups:[null,null],turn:0,phase:'aim',inHand:false,breakShot:true,angle:0,power:0,charging:false,t0:0,ev:null,msg:'',over:null,time:0,fouls:0,pocketedLog:[[],[]]});
  bil.angle=0;bilRender();bilHud();bilLoop();if(bil.mode==='ki'&&bil.turn===1)setTimeout(bilAiTurn,700);
}
function bilRender(){
  const root=document.getElementById('bil-root');if(!root)return;
  if(bil.view==='menu'){
    const p=bilProf(),chip=(on,label,fn)=>'<button type="button" class="lrn-chip'+(on?' active':'')+'" onclick="'+fn+'">'+label+'</button>';
    root.innerHTML=`<p style="font-size:13px;color:var(--text-2);text-align:center">8-Ball: Versenke zuerst alle deine Kugeln (volle 1–7 oder halbe 9–15) und dann die schwarze 8. Zielen mit der Maus, zum Stoßen Maustaste gedrückt halten (Kraft lädt auf) und loslassen.</p>
    <div class="lrn-card"><div class="lrn-label">Modus</div><div style="display:flex;gap:8px;flex-wrap:wrap">${chip(bil.mode==='ki','🤖 Gegen die KI',"bilPick('ki')")}${chip(bil.mode==='lokal','👥 2 Spieler (zwei Accounts)',"bilPick('lokal')")}${chip(bil.mode==='ueben','🎯 Üben (freier Tisch)',"bilPick('ueben')")}</div>
    ${bil.mode==='ki'?'<div class="lrn-label" style="margin-top:10px">KI-Stufe</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+['leicht','mittel','schwer'].map(l=>chip(bil.level===l,l+' ('+BIL_REWARD[l]+' 🪙/Tag · '+p.wins[l]+' Siege)',"bilLevel('"+l+"')")).join('')+'</div>':''}
    ${bil.mode==='ueben'?'<div style="font-size:12px;color:var(--text-3);margin-top:8px">Üben zählt nicht für Ränge: Du schießt allein, Fouls und Gruppen gibt es nicht.</div>':'<div class="lrn-label" style="margin-top:10px">Regeln</div><div style="display:flex;gap:8px;flex-wrap:wrap">'+chip(!bil.loose,'🎓 Strenge Fouls (gewertet)',"bilLoose(false)")+chip(!!bil.loose,'😌 Lockere Regeln (ohne Wertung)',"bilLoose(true)")+'</div><div style="font-size:12px;color:var(--text-3);margin-top:6px">'+(bil.loose?'Locker: Nur die weiße Kugel zu versenken ist ein Foul. Diese Partien zählen nicht für Ränge, Serie und Cup.':'Streng: Wie im echten 8-Ball – auch „keine Kugel getroffen“ ist ein Foul.')+'</div>'}
    <details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;font-weight:700">📖 Regeln nachlesen</summary>${bilRulesHtml()}</details>
    <div style="margin-top:12px"><button class="lrn-btn" onclick="bilStart()">▶ Spiel starten</button></div></div>`;
    if(typeof smRefresh==='function')smRefresh('bil');return;
  }
  root.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:8px"><button class="lrn-btn ghost" onclick="bilMenu()">← Menü</button><button class="lrn-btn ghost" onclick="bilToggleRules()">📖 Regeln</button><span class="game-chip" id="bil-turn"></span><span class="game-chip" id="bil-info"></span></div>
    <div style="position:relative;max-width:${BIL_CW}px;margin:0 auto"><canvas id="bil-canvas" width="${BIL_CW}" height="${BIL_CH}" style="display:block;width:100%;height:auto;border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.35);touch-action:none;cursor:crosshair"></canvas><div id="bil-over"></div></div>
    <div id="bil-hint" style="font-size:12px;color:var(--text-3);text-align:center;margin-top:8px"></div>
    <div id="bil-rules" class="lrn-card" style="display:none;margin-top:10px"><b>📖 Regeln</b>${bilRulesHtml()}</div>`;
  if(typeof smRefresh==='function')smRefresh('bil');
  const cv=document.getElementById('bil-canvas'),pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*BIL_CW-BIL_OX,(e.clientY-r.top)/r.height*BIL_CH-BIL_OY];};
  cv.onpointermove=e=>{bilMouse=pos(e);};
  cv.onpointerdown=e=>{if(e.button>0)return;bilMouse=pos(e);bilDown();e.preventDefault();};
  cv.onpointerup=cv.onpointercancel=()=>bilUp();
  cv.onpointerleave=()=>{if(bil&&bil.charging)bilUp();};
}
function bilHud(){
  const t=document.getElementById('bil-turn'),i=document.getElementById('bil-info'),h=document.getElementById('bil-hint');if(!t||!bil.balls)return;
  const gn=g=>g==='solid'?'volle':g==='stripe'?'halbe':'offen';
  t.innerHTML='<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+bilCol(bil.turn)+'"></span> '+bilEsc(bilName(bil.turn))+(bil.over?'':bil.inHand?' · weiße Kugel setzen':bil.phase==='roll'?' · …':' · am Stoß');
  i.textContent=bil.mode==='ueben'?'🎱 '+bil.balls.filter(q=>!q.out&&q.id).length+' Kugeln':bilName(0)+': '+gn(bil.groups[0])+' · '+bilName(1)+': '+gn(bil.groups[1]);
  if(h)h.textContent=bil.msg||(bil.inHand?(bil.breakShot?'Klicke hinter die linke Linie, um die weiße Kugel zu setzen.':'Foul des Gegners: Setze die weiße Kugel frei auf den Tisch (Klick).'):bil.phase==='aim'?'Zielen mit der Maus. Maustaste gedrückt halten lädt die Kraft, Loslassen stößt.':'');
}
/* Zielen, Kraft laden, Stoßen, Kugel setzen */
function bilTo(p){return Math.atan2(p[1]-bil.balls[0].y,p[0]-bil.balls[0].x);}
function bilDown(){
  if(!bil||bil.view!=='game'||bil.over||!bilHuman()||bil.phase!=='aim')return;
  if(bil.inHand){bilPlaceCue(bilMouse[0],bilMouse[1]);return;}
  bil.angle=bilTo(bilMouse);bil.charging=true;bil.t0=performance.now();bil.power=0;
}
function bilUp(){
  if(!bil||!bil.charging)return;bil.charging=false;const pw=Math.min(1,(performance.now()-bil.t0)/1400);
  if(pw<0.04){bil.power=0;return;}   // zu kurz gedrückt: kein Stoß
  bilFire(bil.angle,Math.max(0.08,pw));
}
function bilPlaceCue(x,y){
  const lim=bil.breakShot?BIL_W*0.25:BIL_W-BIL_R;
  if(x<BIL_R||x>lim||y<BIL_R||y>BIL_H-BIL_R)return false;
  if(bil.balls.some(q=>!q.out&&q.id!==0&&Math.hypot(q.x-x,q.y-y)<2*BIL_R+1))return false;
  const c=bil.balls[0];c.x=x;c.y=y;c.vx=c.vy=0;c.out=false;bil.inHand=false;bil.msg='';bilHud();return true;
}
function bilFire(angle,power){
  const c=bil.balls[0];c.vx=Math.cos(angle)*power*BIL_VMAX;c.vy=Math.sin(angle)*power*BIL_VMAX;
  bil.ev=bilEvents();bil.phase='roll';bil.power=0;bil.msg='';bil.wasLeft=bil.groups[bil.turn]?bilLeft(bil.balls,bil.groups[bil.turn]):99;bilHud();
}
function bilAiTurn(){
  if(!bil||bil.view!=='game'||bil.over||bil.mode!=='ki'||bil.turn!==1||bil.phase!=='aim')return;
  if(bil.inHand){const p=bilAiPlace(bil.balls,bil.groups[1],bil.level,Math.random,bil.breakShot);bilPlaceCue(p[0],p[1]);}
  const sh=bilAiShot(bil.balls,bil.groups[1],bil.level);bil.angle=sh.angle;bil.aiShot=sh;bil.aimT=0;bil.phase='aiaim';
}
function bilLoop(){
  if(!bilActive()||!bil||bil.view!=='game'){bilRaf=null;return;}
  bilTick();const cv=document.getElementById('bil-canvas');if(cv)bilDraw(cv.getContext('2d'));bilRaf=requestAnimationFrame(bilLoop);
}
let bilAcc=0,bilLastTs=0;
function bilTick(){
  const now=performance.now();bilAcc+=Math.min(0.05,(now-(bilLastTs||now))/1000);bilLastTs=now;bil.time++;
  if(bil.phase==='aiaim'){bil.aimT++;if(bil.aimT>45){bil.phase='aim';bilFire(bil.angle,bil.aiShot.power);}return;}
  if(bil.phase==='aim'&&bil.charging)bil.power=Math.min(1,(now-bil.t0)/1400);
  if(bil.phase==='aim'&&!bil.charging&&!bil.inHand&&bilHuman())bil.angle=bilTo(bilMouse);
  if(bil.phase!=='roll'){bilAcc=0;return;}
  let n=0;while(bilAcc>=BIL_STEP&&n<20){bilStep(bil.balls,BIL_STEP,bil.ev);bilAcc-=BIL_STEP;n++;}
  if(!bilMoving(bil.balls))bilResolve();
}
function bilResolve(){
  bilAcc=0;const ev=bil.ev,balls=bil.balls;bil.phase='aim';
  if(bil.mode==='ueben'){const c=balls[0];if(c.out){c.out=false;c.x=BIL_W*0.25;c.y=BIL_H/2;c.vx=c.vy=0;bil.msg='Weiße Kugel versenkt – neu gesetzt.';}if(balls.every(q=>q.id===0||q.out))bil.msg='Alles versenkt – gut gemacht! (Menü → neu starten)';bil.inHand=false;bil.breakShot=false;bilHud();return;}
  const r=bilJudge({groups:bil.groups,turn:bil.turn},balls,ev,bil.wasLeft,!!bil.loose);
  ev.pocketed.filter(id=>id).forEach(id=>bil.pocketedLog[bilGroup(id)==='stripe'?1:0].push(id));
  bil.breakShot=false;
  if(r.winner!==null){bil.groups=r.groups;bilOver(r.winner,r.why);return;}
  bil.groups=r.groups;
  const was=bil.turn;bil.turn=r.next;bil.inHand=r.inHand;
  if(balls[0].out){balls[0].out=false;balls[0].vx=balls[0].vy=0;}
  bil.msg=r.foul?'Foul: '+r.reason+'. '+(BIL_FOUL_WHY[r.reason]||'')+' '+bilName(bil.turn)+' setzt die weiße Kugel.':(r.next===was?bilName(was)+' bleibt am Tisch.':bilName(bil.turn)+' ist dran.');
  if(r.groups[0]&&!bil.groupsShown){bil.groupsShown=true;}
  bilHud();
  if(bil.mode==='ki'&&bil.turn===1)setTimeout(bilAiTurn,900);
}
function bilOver(winner,why){
  bil.over={winner,why};bil.phase='over';bilHud();
  let c=0;if(bil.mode==='ki'&&winner===0&&bilIsRanked())c=bilWin(bil.level,bilPay);   // Coins nur bei strengen Regeln
  const el=document.getElementById('bil-over');if(el)el.innerHTML='';
  if(!bilIsRanked()&&el&&bil.mode!=='ueben'){el.innerHTML='<div class="td-over"><div style="font-size:40px">'+(winner===0?'🏆':'🎱')+'</div><div style="font-size:22px;font-weight:800">'+bilEsc(bilName(winner))+' gewinnt!</div><div style="font-size:13px;margin:8px 0 12px">'+bilEsc(why||'')+'<br>Lockere Regeln – keine Wertung.</div><div style="display:flex;gap:8px"><button class="lrn-btn" onclick="bilStart()">Nochmal</button><button class="lrn-btn ghost" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)" onclick="bilMenu()">Menü</button></div></div>';}
  if(bilIsRanked()){smReport('bil',{winner});if(c&&typeof showToast==='function')showToast('🪙 +'+c+' AppHub-Coins für den Sieg gegen die KI',3000);}
}
/* ── Zeichnen ── */
function bilBall(ctx,x,y,id,alpha){
  const col=BIL_COLORS[id===0?0:id===8?8:(id-1)%7+1];ctx.save();ctx.globalAlpha=alpha===undefined?1:alpha;
  ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
  ctx.beginPath();ctx.arc(x,y,BIL_R,0,7);ctx.fillStyle=id>8?'#f4f1ea':col;ctx.fill();ctx.shadowColor='transparent';
  if(id>8){ctx.save();ctx.beginPath();ctx.arc(x,y,BIL_R,0,7);ctx.clip();ctx.fillStyle=col;ctx.fillRect(x-BIL_R,y-BIL_R*0.55,BIL_R*2,BIL_R*1.1);ctx.restore();}
  if(id>0){ctx.beginPath();ctx.arc(x,y,BIL_R*0.5,0,7);ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle='#111';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(id,x,y+0.5);}
  ctx.beginPath();ctx.arc(x-BIL_R*0.3,y-BIL_R*0.35,BIL_R*0.22,0,7);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();ctx.restore();
}
function bilDraw(ctx){
  ctx.clearRect(0,0,BIL_CW,BIL_CH);ctx.fillStyle='#1a1410';ctx.fillRect(0,0,BIL_CW,BIL_CH);
  const g=ctx.createLinearGradient(0,0,0,BIL_CH);g.addColorStop(0,'#8d5a2b');g.addColorStop(1,'#5a3716');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect?ctx.roundRect(8,8,BIL_CW-16,BIL_H+2*BIL_OY-16+0,22):ctx.rect(8,8,BIL_CW-16,BIL_H+2*BIL_OY-16);ctx.fill();
  ctx.save();ctx.translate(BIL_OX,BIL_OY);
  ctx.fillStyle='#1b7a4a';ctx.fillRect(-14,-14,BIL_W+28,BIL_H+28);ctx.fillStyle='#22915a';ctx.fillRect(0,0,BIL_W,BIL_H);
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(BIL_W*0.25,0);ctx.lineTo(BIL_W*0.25,BIL_H);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(BIL_W*0.72,BIL_H/2,2.5,0,7);ctx.fill();
  for(const p of BIL_POCKETS){ctx.fillStyle='#0b0b0b';ctx.beginPath();ctx.arc(p[0],p[1],p[2]-3,0,7);ctx.fill();}
  if(!bil.balls){ctx.restore();return;}
  const b=bil.balls,cue=b[0],moving=bil.phase==='roll';
  // Ziellinie
  const showAim=(bil.phase==='aim'||bil.phase==='aiaim')&&!bil.inHand&&!cue.out&&!bil.over&&bilHuman();
  if(showAim){
    const r=bilRay(b,bil.angle);ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(r.x,r.y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(r.x,r.y,BIL_R,0,7);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.stroke();
    if(r.ball){const nx=r.ball.x-r.x,ny=r.ball.y-r.y,l=Math.hypot(nx,ny)||1;ctx.strokeStyle='rgba(255,230,120,.8)';ctx.beginPath();ctx.moveTo(r.ball.x,r.ball.y);ctx.lineTo(r.ball.x+nx/l*60,r.ball.y+ny/l*60);ctx.stroke();}
  }
  for(const q of b){if(!q.out)bilBall(ctx,q.x,q.y,q.id);}
  if(bil.inHand&&bil.view==='game'&&!bil.over&&bilHuman()){   // Kugel in der Hand: Vorschau unter der Maus
    const lim=bil.breakShot?BIL_W*0.25:BIL_W-BIL_R,x=Math.max(BIL_R,Math.min(lim,bilMouse[0])),y=Math.max(BIL_R,Math.min(BIL_H-BIL_R,bilMouse[1]));bilBall(ctx,x,y,0,0.55);
    if(bil.breakShot){ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(0,0,BIL_W*0.25,BIL_H);}
  }
  // Queue
  if((bil.phase==='aim'||bil.phase==='aiaim')&&!bil.inHand&&!cue.out&&!bil.over){
    const pw=bil.phase==='aiaim'?Math.min(1,bil.aimT/45)*bil.aiShot.power:bil.power,pull=14+pw*70,dx=Math.cos(bil.angle),dy=Math.sin(bil.angle),x0=cue.x-dx*(BIL_R+pull),y0=cue.y-dy*(BIL_R+pull);
    ctx.lineCap='round';ctx.strokeStyle='#e0b878';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0-dx*250,y0-dy*250);ctx.stroke();
    ctx.strokeStyle='#3b2410';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x0-dx*150,y0-dy*150);ctx.lineTo(x0-dx*250,y0-dy*250);ctx.stroke();ctx.lineCap='butt';
  }
  ctx.restore();
  // Kraftleiste und versenkte Kugeln
  if(bil.charging||(bil.phase==='aiaim'&&bil.aiShot)){const pw=bil.phase==='aiaim'?Math.min(1,bil.aimT/45)*bil.aiShot.power:bil.power;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(BIL_OX,BIL_CH-34,240,12);ctx.fillStyle=pw<0.5?'#66bb6a':pw<0.8?'#ffca28':'#ef5350';ctx.fillRect(BIL_OX+1,BIL_CH-33,238*pw,10);ctx.fillStyle='#fff';ctx.font='11px sans-serif';ctx.textAlign='left';ctx.fillText('Kraft',BIL_OX+248,BIL_CH-24);}
  if(bil.pocketedLog&&bil.mode!=='ueben'){[0,1].forEach(i=>{bil.pocketedLog[i].forEach((id,k)=>bilBall(ctx,BIL_CW-BIL_OX-14-k*24,BIL_CH-28-(i?0:0),id,1));});}
}
/* ── Anbindung an spielmeta (Ränge, Hall of Fame, Serie, Cup, Duell) ── */
if(typeof SM_HERO!=='undefined')SM_HERO.bil=['🎱','#1b7a4a','8-Ball: erst deine Kugeln, dann die 8'];
if(typeof smRegister==='function')smRegister({id:'bil',screen:'screen-billard',title:'Billard',sides:['Spieler 1','Spieler 2'],
  isOver:()=>!bil||bil.view!=='game'||!!bil.over,cancelPending:()=>{},
  active:()=>bilIsRanked(),
  levels:['easy','medium','hard'],setLevel:l=>{if(bil&&BIL_LEVEL_MAP[l])bil.level=BIL_LEVEL_MAP[l];},
  sideAI:()=>[false,!!bil&&bil.mode==='ki'],difficulty:()=>bil&&bil.mode==='ki'?BIL_LEVEL_BACK[bil.level]:null,
  newGame:()=>{if(bil&&bil.view==='game')bilStart();},
  onPlayers:()=>{if(bil&&bil.view==='game')bilHud();}});
