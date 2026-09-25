/* ══════════════════════════════════
   POMODORO – Fokus, kurze und lange Pause mit Ring-Anzeige, einstellbaren Zeiten, Tagesstatistik und Serie.
   Der Timer rechnet mit der Uhrzeit (endAt) und läuft auch weiter, wenn du die Seite wechselst.
   Daten: zf_pom2 {set:{work,short,long,every,auto}, days:{'JJJJ-MM-TT':{n,min}}, run:{phase,endAt,left,paused,label}, coins:{date,n}}
══════════════════════════════════ */
const POM_KEY='zf_pom2';
const POM_PHASES={work:{name:'Fokus',icon:'🎯',color:'#ff3b30'},short:{name:'Kurze Pause',icon:'☕',color:'#34c759'},long:{name:'Lange Pause',icon:'🌴',color:'#0a84ff'}};
const POM_COINS_PER_DAY=8;
let pom=null,pomTick=null;

function pomEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pomDate(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function pomLoad(){
  let d=null;try{d=JSON.parse(localStorage.getItem(POM_KEY)||'null');}catch(e){}
  d=d&&typeof d==='object'?d:{};
  const s=d.set||{};
  d.set={work:pomClamp(s.work,25,1,120),short:pomClamp(s.short,5,1,60),long:pomClamp(s.long,15,1,90),every:pomClamp(s.every,4,2,8),auto:!!s.auto};
  d.days=d.days&&typeof d.days==='object'?d.days:{};
  d.coins=d.coins||{date:'',n:0};
  if(!d.run||!POM_PHASES[d.run.phase])d.run={phase:'work',endAt:0,left:d.set.work*60,paused:true,label:''};
  // Alter Zähler aus der ersten Version: einmalig als "heute" übernehmen ist nicht sinnvoll – wir starten sauber
  return d;
}
function pomClamp(v,def,lo,hi){v=parseInt(v,10);return isNaN(v)?def:Math.max(lo,Math.min(hi,v));}
function pomSave(){try{localStorage.setItem(POM_KEY,JSON.stringify(pom));}catch(e){}}

/* ── Logik (ohne Oberfläche, testbar) ── */
function pomSecondsFor(phase){return pom.set[phase]*60;}
function pomToday(){return pom.days[pomDate()]||{n:0,min:0};}
function pomLeft(){
  const r=pom.run;
  if(r.endAt&&!r.paused)return Math.max(0,Math.ceil((r.endAt-Date.now())/1000));
  return Math.max(0,r.left);
}
function pomRunning(){return !!(pom.run.endAt&&!pom.run.paused);}
/* Nach welcher Fokus-Runde kommt welche Pause */
function pomNextPhase(phase,doneToday){
  if(phase!=='work')return 'work';
  return doneToday>0&&doneToday%pom.set.every===0?'long':'short';
}
function pomStreak(){
  let n=0;const d=new Date();
  if(!(pom.days[pomDate(d)]&&pom.days[pomDate(d)].n>0))d.setDate(d.getDate()-1);   // heute noch nichts: Serie von gestern zählt
  while(pom.days[pomDate(d)]&&pom.days[pomDate(d)].n>0){n++;d.setDate(d.getDate()-1);}
  return n;
}
function pomLast7(){
  const out=[],d=new Date();d.setDate(d.getDate()-6);
  for(let i=0;i<7;i++){const k=pomDate(d),e=pom.days[k]||{n:0,min:0};out.push({key:k,label:['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()],n:e.n,min:e.min});d.setDate(d.getDate()+1);}
  return out;
}
/* Phase beendet: Fokus zählt (Statistik + Coins), danach nächste Phase vorbereiten */
function pomComplete(skipped){
  const r=pom.run,phase=r.phase;let msg='';
  if(phase==='work'&&!skipped){
    const k=pomDate(),e=pom.days[k]||(pom.days[k]={n:0,min:0});e.n++;e.min+=pom.set.work;
    if(pom.coins.date!==k){pom.coins={date:k,n:0};}
    if(pom.coins.n<POM_COINS_PER_DAY&&typeof zcp==='function'&&typeof zcAddCoins==='function'){
      try{const name=(zcp().player||'').trim();if(name){zcAddCoins(name,1);pom.coins.n++;if(typeof smSave==='function')smSave('zentrale');msg=' · +1 🪙';}}catch(e){}
    }
  }
  const next=skipped&&phase!=='work'?'work':pomNextPhase(phase,pomToday().n);
  pom.run={phase:next,endAt:0,left:pomSecondsFor(next),paused:true,label:r.label||''};
  if(pom.set.auto&&!skipped){pom.run.endAt=Date.now()+pom.run.left*1000;pom.run.paused=false;}
  pomSave();
  return {phase,next,msg};
}
function pomStart(){
  const r=pom.run;
  r.endAt=Date.now()+pomLeft()*1000;r.paused=false;
  if(pomLeft()<=0){r.left=pomSecondsFor(r.phase);r.endAt=Date.now()+r.left*1000;}
  pomSave();pomEnsureTick();
}
function pomPause(){const r=pom.run;r.left=pomLeft();r.endAt=0;r.paused=true;pomSave();}
function pomResetPhase(){const r=pom.run;r.left=pomSecondsFor(r.phase);r.endAt=0;r.paused=true;pomSave();}
function pomSetPhase(p){if(pomRunning()||!POM_PHASES[p])return;pom.run.phase=p;pomResetPhase();}

/* ── Oberfläche ── */
function pomInit(){pom=pomLoad();pomEnsureTick();pomRender();}
function pomRoot(){return document.getElementById('pom-root');}
function pomFmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function pomEnsureTick(){
  if(pomTick||!pom)return;
  pomTick=setInterval(()=>{
    if(!pom)return;
    if(pomRunning()&&pomLeft()<=0){pomFinished();}
    const scr=document.getElementById('screen-pomodoro'),active=scr&&scr.classList.contains('active');
    if(active)pomUpdateLive();
    if(!pomRunning()){clearInterval(pomTick);pomTick=null;document.title=pomBaseTitle();}
    else document.title=pomFmt(pomLeft())+' · '+POM_PHASES[pom.run.phase].name;
  },500);
}
function pomBaseTitle(){return 'AppHub';}
function pomFinished(){
  const res=pomComplete(false),ph=POM_PHASES[res.phase],nx=POM_PHASES[res.next];
  if(typeof sfx==='function'){try{sfx('chime');}catch(e){}}
  const text=res.phase==='work'?`🎯 Fokus geschafft!${res.msg} Zeit für: ${nx.name}`:`${ph.icon} ${ph.name} vorbei – weiter mit Fokus`;
  if(typeof showToast==='function')showToast(text,5000);
  try{if(typeof Notification!=='undefined'&&Notification.permission==='granted')new Notification('Pomodoro',{body:text});}catch(e){}
  pomRender();
}
function pomToggle(){
  if(pomRunning())pomPause();
  else{
    pomStart();
    try{if(typeof Notification!=='undefined'&&Notification.permission==='default')Notification.requestPermission();}catch(e){}
  }
  pomRender();
}
function pomReset(){pomResetPhase();pomRender();}
function pomSkip(){
  const wasWork=pom.run.phase==='work';
  const go=()=>{pomComplete(true);pomRender();};
  if(wasWork&&(pomLeft()<pomSecondsFor('work')||pomRunning())&&typeof appConfirm==='function')appConfirm('Fokus-Runde überspringen? Sie wird nicht gezählt.',go);else go();
}
function pomPick(p){pomSetPhase(p);pomRender();}
function pomLabel(v){pom.run.label=String(v||'').slice(0,60);pomSave();}
function pomSetting(k,v){
  const lim={work:[25,1,120],short:[5,1,60],long:[15,1,90],every:[4,2,8]};
  if(k==='auto')pom.set.auto=!!v;else{const l=lim[k];pom.set[k]=pomClamp(v,l[0],l[1],l[2]);}
  if(!pomRunning()&&(k==='work'||k==='short'||k==='long')&&pom.run.phase===k)pomResetPhase();
  pomSave();pomRender();
}
function pomUpdateLive(){
  const t=document.getElementById('pom-time'),ring=document.getElementById('pom-ring');if(!t||!ring)return;
  const left=pomLeft(),tot=pomSecondsFor(pom.run.phase);
  t.textContent=pomFmt(left);
  ring.setAttribute('stroke-dashoffset',String(pomCirc()*(1-(tot?left/tot:0))));
}
function pomCirc(){return 2*Math.PI*96;}
function pomRender(){
  const root=pomRoot();if(!root||!pom)return;
  const r=pom.run,ph=POM_PHASES[r.phase],left=pomLeft(),tot=pomSecondsFor(r.phase),running=pomRunning();
  const today=pomToday(),last=pomLast7(),maxN=Math.max(1,...last.map(d=>d.n));
  const dots=Array.from({length:pom.set.every},(_,i)=>`<i style="width:10px;height:10px;border-radius:50%;background:${i<today.n%pom.set.every||(today.n>0&&today.n%pom.set.every===0&&r.phase!=='work')?ph.color:'var(--divider)'};display:inline-block"></i>`).join('');
  const num=(k,l,min,max)=>`<label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-3);font-weight:700">${l}<input class="lrn-input" type="number" min="${min}" max="${max}" value="${pom.set[k]}" onchange="pomSetting('${k}',this.value)" style="width:100%"></label>`;
  root.innerHTML=`
    <div class="lrn-tabs">${Object.keys(POM_PHASES).map(k=>`<button class="lrn-tab${r.phase===k?' active':''}" ${running?'disabled style="opacity:.55;cursor:default"':''} onclick="pomPick('${k}')">${POM_PHASES[k].icon} ${POM_PHASES[k].name}</button>`).join('')}</div>
    <div class="lrn-card" style="text-align:center;padding:26px 16px">
      <div style="position:relative;width:230px;height:230px;margin:0 auto">
        <svg viewBox="0 0 220 220" width="230" height="230" style="transform:rotate(-90deg)"><circle cx="110" cy="110" r="96" fill="none" stroke="var(--divider)" stroke-width="12"/>
          <circle id="pom-ring" cx="110" cy="110" r="96" fill="none" stroke="${ph.color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${pomCirc()}" stroke-dashoffset="${pomCirc()*(1-(tot?left/tot:0))}" style="transition:stroke-dashoffset .5s linear"/></svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div id="pom-time" style="font-size:52px;font-weight:800;font-family:var(--mono);letter-spacing:-1px">${pomFmt(left)}</div>
          <div style="font-size:13px;font-weight:700;color:${ph.color}">${ph.icon} ${ph.name}</div></div></div>
      <input class="lrn-input" placeholder="Woran arbeitest du? (optional)" value="${pomEsc(r.label)}" oninput="pomLabel(this.value)" style="width:100%;max-width:340px;text-align:center;margin:14px 0 4px">
      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
        <button class="lrn-btn" style="min-width:150px;padding:12px 22px;font-size:15px;background:${ph.color}" onclick="pomToggle()">${running?'⏸ Pausieren':(left<tot?'▶ Weiter':'▶ Starten')}</button>
        <button class="lrn-btn ghost" onclick="pomReset()" title="Zeit zurücksetzen">↺</button>
        <button class="lrn-btn ghost" onclick="pomSkip()" title="Phase überspringen">⏭</button></div>
      <div style="margin-top:14px;display:flex;gap:5px;justify-content:center;align-items:center">${dots}<span style="font-size:11px;color:var(--text-3);margin-left:6px">bis zur langen Pause</span></div>
    </div>
    <div class="lrn-tiles" style="margin-top:14px"><div class="lrn-tile"><b>${today.n}</b><span>Runden heute</span></div><div class="lrn-tile"><b>${today.min}</b><span>Minuten fokussiert</span></div><div class="lrn-tile"><b>🔥 ${pomStreak()}</b><span>Tage in Folge</span></div></div>
    <div class="lrn-card" style="margin-bottom:14px"><div class="lrn-label">Letzte 7 Tage</div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:80px">${last.map(d=>`<div style="flex:1;text-align:center"><div title="${d.n} Runden" style="height:${Math.max(4,Math.round(d.n/maxN*56))}px;background:${d.n?'var(--accent)':'var(--divider)'};border-radius:5px 5px 2px 2px;margin-bottom:4px"></div><div style="font-size:10px;color:var(--text-3)">${d.label}</div></div>`).join('')}</div></div>
    <div class="lrn-card"><div class="lrn-label">Einstellungen (Minuten)</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">${num('work','Fokus',1,120)}${num('short','Kurze Pause',1,60)}${num('long','Lange Pause',1,90)}${num('every','Runden bis lange Pause',2,8)}</div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;cursor:pointer"><input type="checkbox" ${pom.set.auto?'checked':''} onchange="pomSetting('auto',this.checked)"> Nächste Phase automatisch starten</label>
      <div style="font-size:11px;color:var(--text-3);margin-top:8px">🪙 Für jede abgeschlossene Fokus-Runde gibt es 1 Coin (höchstens ${POM_COINS_PER_DAY} pro Tag, wenn ein Spieler gewählt ist).</div></div>`;
}
