/* ══════════════════════════════════
   MATHE-TRAINER – Üben (Themen + Schwierigkeit frei wählbar), Sprint (60 Sekunden) und Statistik.
   Themen: Plus, Minus, Mal, Geteilt, Punkt-vor-Strich, Potenzen, Wurzeln, Prozent, Gleichungen.
   Daten: zf_math2 (Statistik je Thema, Bestwerte, Coins des Tages)
══════════════════════════════════ */
const MATH_KEY='zf_math2';
const MATH_TOPICS=[
  {id:'add',sym:'＋',name:'Plus'},{id:'sub',sym:'−',name:'Minus'},{id:'mul',sym:'×',name:'Mal'},{id:'div',sym:'÷',name:'Geteilt'},
  {id:'mix',sym:'()',name:'Punkt vor Strich'},{id:'pow',sym:'x²',name:'Potenzen'},{id:'root',sym:'√',name:'Wurzeln'},
  {id:'pct',sym:'%',name:'Prozent'},{id:'eq',sym:'x=',name:'Gleichungen'}
];
const MATH_LEVELS=['Leicht','Mittel','Schwer'];
const MATH_SPRINT_SECONDS=60;
const MATH_COINS_PER_DAY=10;
let math=null,mathView='practice',mathQ=null,mathSess=null,mathSprint=null,mathTimer=null,mathNextT=null;

function mathEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mathTodayKey(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

/* ── Daten ── */
function mathLoad(){
  let d=null;try{d=JSON.parse(localStorage.getItem(MATH_KEY)||'null');}catch(e){}
  d=d&&typeof d==='object'?d:{};
  d.topics=Array.isArray(d.topics)&&d.topics.length?d.topics.filter(t=>MATH_TOPICS.some(x=>x.id===t)):['add','sub','mul','div'];
  if(!d.topics.length)d.topics=['add','sub','mul','div'];
  d.level=[1,2,3].includes(d.level)?d.level:2;
  d.stats=d.stats||{};d.sprint=d.sprint||{};d.bestStreak=d.bestStreak||0;d.coinsDate=d.coinsDate||'';d.coinsDay=d.coinsDay||0;
  return d;
}
function mathSave(){try{localStorage.setItem(MATH_KEY,JSON.stringify(math));}catch(e){}}

/* ── Aufgaben-Erzeugung (ohne Oberfläche, testbar) ── */
function mathInt(rnd,a,b){return a+Math.floor(rnd()*(b-a+1));}
function mathPick(rnd,arr){return arr[Math.floor(rnd()*arr.length)];}
const MATH_SUP={2:'²',3:'³',4:'⁴'};
function mathGen(topic,level,rnd){
  rnd=rnd||Math.random;level=Math.max(1,Math.min(3,level|0||2));
  const L=level-1;let a,b,c,d;
  switch(topic){
    case 'add':{const m=[10,50,200][L];a=mathInt(rnd,1,m);b=mathInt(rnd,1,m);return {topic,q:`${a} + ${b}`,ans:a+b};}
    case 'sub':{const m=[10,50,200][L];a=mathInt(rnd,1,m);b=mathInt(rnd,1,m);if(L<2&&a<b)[a,b]=[b,a];return {topic,q:`${a} − ${b}`,ans:a-b};}
    case 'mul':{
      if(L===0){a=mathInt(rnd,2,9);b=mathInt(rnd,2,5);}else if(L===1){a=mathInt(rnd,2,12);b=mathInt(rnd,2,12);}else{a=mathInt(rnd,11,25);b=mathInt(rnd,3,12);}
      return {topic,q:`${a} × ${b}`,ans:a*b};}
    case 'div':{
      const mb=[9,12,15][L],mq=[9,12,20][L];b=mathInt(rnd,2,mb);const q=mathInt(rnd,2,mq);return {topic,q:`${b*q} ÷ ${b}`,ans:q};}
    case 'mix':{
      if(L===0){a=mathInt(rnd,1,10);b=mathInt(rnd,2,5);c=mathInt(rnd,2,5);return {topic,q:`${a} + ${b} × ${c}`,ans:a+b*c};}
      if(L===1){a=mathInt(rnd,2,9);b=mathInt(rnd,2,9);c=mathInt(rnd,1,20);
        return rnd()<0.5?{topic,q:`${a} × ${b} − ${c}`,ans:a*b-c}:{topic,q:`${c} + ${a} × ${b}`,ans:c+a*b};}
      a=mathInt(rnd,2,9);b=mathInt(rnd,2,9);c=mathInt(rnd,2,9);d=mathInt(rnd,1,20);
      return rnd()<0.5?{topic,q:`(${a} + ${b}) × ${c}`,ans:(a+b)*c}:{topic,q:`${d} + (${a} + ${b}) × ${c}`,ans:d+(a+b)*c};}
    case 'pow':{
      if(L===0){a=mathInt(rnd,2,5);b=2;}else if(L===1){b=mathInt(rnd,2,3);a=b===2?mathInt(rnd,2,10):mathInt(rnd,2,5);}
      else{b=mathInt(rnd,2,4);a=b===2?mathInt(rnd,2,15):b===3?mathInt(rnd,2,8):mathInt(rnd,2,5);}
      return {topic,q:`${a}${MATH_SUP[b]}`,ans:Math.pow(a,b)};}
    case 'root':{
      if(L===2&&rnd()<0.35){a=mathPick(rnd,[2,3,4,5,6]);return {topic,q:`∛${a*a*a}`,ans:a};}
      a=mathInt(rnd,2,[10,15,20][L]);return {topic,q:`√${a*a}`,ans:a};}
    case 'pct':{
      if(L===0){b=mathPick(rnd,[10,50,25]);a=mathInt(rnd,1,10)*(b===25?40:20);return {topic,q:`${b} % von ${a}`,ans:a*b/100};}
      if(L===1){b=mathPick(rnd,[5,10,15,20,25,30,40,50,75]);a=mathInt(rnd,1,10)*20;return {topic,q:`${b} % von ${a}`,ans:a*b/100};}
      if(rnd()<0.5){b=mathInt(rnd,1,99);a=mathInt(rnd,1,8)*100;return {topic,q:`${b} % von ${a}`,ans:a*b/100};}
      for(let i=0;i<50;i++){ // "Wie viel Prozent sind x von y?" – nur mit glatten Werten
        const w=mathPick(rnd,[20,40,50,80,100,200]),p=mathPick(rnd,[5,10,20,25,30,40,50,60,75,80]),part=w*p/100;
        if(Number.isInteger(part))return {topic,q:`Wie viel % sind ${part} von ${w}?`,ans:p};
      }
      return {topic,q:'50 % von 80',ans:40};}
    case 'eq':{
      const x=mathInt(rnd,1,[10,12,15][L]);
      if(L===0){a=mathInt(rnd,1,15);return {topic,q:`x + ${a} = ${x+a}`,ans:x,ask:'x'};}
      if(L===1){a=mathInt(rnd,2,9);if(rnd()<0.5)return {topic,q:`${a}x = ${a*x}`,ans:x,ask:'x'};b=mathInt(rnd,1,20);return {topic,q:`x − ${b} = ${x-b}`,ans:x,ask:'x'};}
      a=mathInt(rnd,2,9);b=mathInt(rnd,1,20);
      return rnd()<0.5?{topic,q:`${a}x + ${b} = ${a*x+b}`,ans:x,ask:'x'}:{topic,q:`${a}x − ${b} = ${a*x-b}`,ans:x,ask:'x'};}
  }
  return mathGen('add',level,rnd);
}
function mathParse(s){
  s=String(s==null?'':s).trim().replace(/\s+/g,'').replace('−','-').replace(',','.');
  if(!/^-?\d*\.?\d+$/.test(s))return NaN;
  return parseFloat(s);
}
function mathIsRight(input,ans){const v=mathParse(input);return !isNaN(v)&&Math.abs(v-ans)<0.005;}
function mathNiceNumber(n){return String(Math.round(n*100)/100).replace('.',',');}
function mathNewQuestion(){
  const t=mathPick(Math.random,math.topics);
  let q=mathGen(t,math.level),guard=0;
  while(mathQ&&q.q===mathQ.q&&guard++<10)q=mathGen(t,math.level);
  mathQ=q;return q;
}

/* ── Oberfläche ── */
function mathInit(){
  math=mathLoad();mathView='practice';mathSess={ok:0,no:0,streak:0,answered:false,last:null};mathSprint=null;mathStopTimer();
  mathNewQuestion();mathRender();mathBindKeys();
}
function mathNew(){mathInit();}   // Kompatibilität (alter Name)
function mathRoot(){return document.getElementById('math-root');}
function mathSetView(v){
  mathStopTimer();clearTimeout(mathNextT);mathView=v;mathSprint=null;
  if(v!=='stats'){mathSess.answered=false;mathSess.last=null;mathNewQuestion();}
  mathRender();
}
function mathToggleTopic(id){
  const i=math.topics.indexOf(id);
  if(i>=0){if(math.topics.length>1)math.topics.splice(i,1);}else math.topics.push(id);
  mathSave();clearTimeout(mathNextT);mathSess.answered=false;mathSess.last=null;mathNewQuestion();mathRender();
}
function mathSetLevel(l){math.level=l;mathSave();clearTimeout(mathNextT);mathSess.answered=false;mathSess.last=null;mathSprint=null;mathStopTimer();mathNewQuestion();mathRender();}
function mathRender(){
  const root=mathRoot();if(!root||!math)return;
  const tab=(id,label)=>`<button class="lrn-tab${mathView===id?' active':''}" onclick="mathSetView('${id}')">${label}</button>`;
  let body='';
  if(mathView==='stats')body=mathRenderStats();
  else body=mathRenderSetup()+(mathView==='sprint'?mathRenderSprint():mathRenderPractice());
  root.innerHTML=`<div class="lrn-tabs">${tab('practice','🎯 Üben')}${tab('sprint','⏱ Sprint')}${tab('stats','📊 Statistik')}</div>${body}`;
  const f=root.querySelector('[data-autofocus]');if(f)f.focus();
}
function mathRenderSetup(){
  const locked=mathView==='sprint'&&mathSprint&&mathSprint.running;
  return `<div class="lrn-card" style="margin-bottom:14px${locked?';opacity:.5;pointer-events:none':''}">
    <div class="lrn-label">Themen</div>
    <div class="lrn-chips">${MATH_TOPICS.map(t=>`<button class="lrn-chip${math.topics.includes(t.id)?' active':''}" onclick="mathToggleTopic('${t.id}')"><b style="margin-right:4px">${t.sym}</b>${t.name}</button>`).join('')}</div>
    <div class="lrn-label" style="margin-top:12px">Schwierigkeit</div>
    <div class="lrn-chips">${MATH_LEVELS.map((n,i)=>`<button class="lrn-chip${math.level===i+1?' active':''}" onclick="mathSetLevel(${i+1})">${n}</button>`).join('')}</div>
  </div>`;
}
function mathAnswerBox(){
  return `<div class="lrn-qbox"><div class="lrn-question" id="math-question">${mathEsc(mathQ.q)}${mathQ.ask?'':' = ?'}${mathQ.ask?'<div style="font-size:15px;color:var(--text-3);margin-top:4px">x = ?</div>':''}</div>
    <input class="lrn-input lrn-answer" id="math-answer" data-autofocus inputmode="decimal" autocomplete="off" placeholder="Antwort" onkeydown="if(event.key==='Enter'){event.preventDefault();mathEnter();}">
    <div id="math-feedback" class="lrn-feedback"></div></div>`;
}
function mathRenderPractice(){
  const S=mathSess,acc=S.ok+S.no?Math.round(S.ok/(S.ok+S.no)*100):0;
  return `${mathAnswerBox()}
    <div style="display:flex;gap:8px;margin:12px 0"><button class="lrn-btn" style="flex:1" onclick="mathEnter()">Prüfen</button><button class="lrn-btn ghost" onclick="mathSkip()">Überspringen</button></div>
    <div class="lrn-tiles" style="margin-top:14px"><div class="lrn-tile"><b>${S.ok}</b><span>richtig</span></div><div class="lrn-tile"><b>${S.no}</b><span>falsch</span></div><div class="lrn-tile"><b>${acc}%</b><span>Trefferquote</span></div><div class="lrn-tile"><b>🔥 ${S.streak}</b><span>in Folge</span></div></div>`;
}
function mathFeedback(html,cls){const fb=document.getElementById('math-feedback');if(fb){fb.className='lrn-feedback '+(cls||'');fb.innerHTML=html;}}
function mathStat(topic,ok){const s=math.stats[topic]=math.stats[topic]||{ok:0,no:0};if(ok)s.ok++;else s.no++;}

/* Enter/Prüfen: erst prüfen, dann (bei falscher Antwort) mit Enter weiter */
function mathEnter(){
  if(!mathQ)return;
  if(mathView==='sprint'){mathSprintAnswer();return;}
  if(mathSess.answered){clearTimeout(mathNextT);mathNext();return;}
  const inp=document.getElementById('math-answer');
  const v=mathParse(inp?inp.value:'');
  if(isNaN(v)){mathFeedback('Bitte eine Zahl eingeben','warn');if(inp)inp.focus();return;}
  const ok=mathIsRight(inp.value,mathQ.ans),S=mathSess;
  mathStat(mathQ.topic,ok);S.answered=true;
  if(ok){S.ok++;S.streak++;if(S.streak>math.bestStreak)math.bestStreak=S.streak;mathFeedback('✓ Richtig!','good');mathNextT=setTimeout(mathNext,750);}
  else{S.no++;S.streak=0;mathFeedback(`✗ Richtig wäre <b>${mathNiceNumber(mathQ.ans)}</b> &nbsp;<small>(Enter = weiter)</small>`,'bad');}
  mathSave();
  if(inp)inp.readOnly=true;
}
function mathNext(){mathSess.answered=false;mathNewQuestion();mathRender();}
function mathSkip(){if(mathView!=='practice')return;clearTimeout(mathNextT);mathSess.answered=false;mathSess.streak=0;mathNewQuestion();mathRender();}

/* ── Sprint ── */
function mathRenderSprint(){
  const R=mathSprint;
  if(R&&R.running){
    return `<div class="lrn-sprintbar"><div id="math-timebar" style="width:${Math.round(R.left/MATH_SPRINT_SECONDS*100)}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-3);margin:6px 2px 10px"><span>⏱ <b id="math-time" style="color:var(--text)">${Math.ceil(R.left)}</b> s</span><span>Punkte: <b id="math-score" style="color:var(--text)">${R.score}</b></span></div>
      ${mathAnswerBox()}<div style="margin-top:12px"><button class="lrn-btn" style="width:100%" onclick="mathEnter()">Antworten (Enter)</button></div>`;
  }
  if(R&&R.done){
    const best=math.sprint[math.level]||0;
    return `<div class="lrn-card" style="text-align:center"><div style="font-size:44px">${R.record?'🏆':'⏱'}</div>
      <div style="font-size:24px;font-weight:800;margin:6px 0">${R.score} Aufgaben richtig</div>
      <div style="color:var(--text-3);font-size:13px">${R.wrong} falsch${R.record?' · <b style="color:var(--accent)">Neuer Rekord!</b>':' · Rekord auf „'+MATH_LEVELS[math.level-1]+'“: '+best}</div>
      ${R.coins?`<div style="font-size:13px;margin-top:8px">🪙 +${R.coins} Coins</div>`:''}
      <button class="lrn-btn" style="margin-top:16px" onclick="mathSprintStart()">Nochmal</button></div>`;
  }
  return `<div class="lrn-card" style="text-align:center"><div style="font-size:40px">⏱</div>
    <div style="font-size:18px;font-weight:800;margin:6px 0">${MATH_SPRINT_SECONDS} Sekunden – so viele richtige Antworten wie möglich</div>
    <div style="font-size:13px;color:var(--text-3);margin-bottom:14px">Deine Themen und Schwierigkeit oben gelten. Rekord auf „${MATH_LEVELS[math.level-1]}“: <b style="color:var(--text)">${math.sprint[math.level]||0}</b></div>
    <button class="lrn-btn" style="padding:12px 28px;font-size:16px" onclick="mathSprintStart()">▶ Start</button></div>`;
}
function mathSprintStart(){
  mathStopTimer();mathSprint={running:true,left:MATH_SPRINT_SECONDS,score:0,wrong:0,t0:Date.now()};
  mathNewQuestion();mathRender();
  mathTimer=setInterval(mathTick,200);
}
function mathStopTimer(){if(mathTimer){clearInterval(mathTimer);mathTimer=null;}}
function mathTick(){
  const R=mathSprint;if(!R||!R.running){mathStopTimer();return;}
  const scr=document.getElementById('screen-mathe');
  if(!scr||!scr.classList.contains('active')){mathStopTimer();mathSprint=null;return;}
  R.left=Math.max(0,MATH_SPRINT_SECONDS-(Date.now()-R.t0)/1000);
  const bar=document.getElementById('math-timebar'),t=document.getElementById('math-time');
  if(bar)bar.style.width=(R.left/MATH_SPRINT_SECONDS*100)+'%';if(t)t.textContent=Math.ceil(R.left);
  if(R.left<=0)mathSprintEnd();
}
function mathSprintAnswer(){
  const R=mathSprint;if(!R||!R.running)return;
  const inp=document.getElementById('math-answer');
  if(isNaN(mathParse(inp?inp.value:''))){mathFeedback('Bitte eine Zahl eingeben','warn');return;}
  const ok=mathIsRight(inp.value,mathQ.ans);mathStat(mathQ.topic,ok);
  if(ok)R.score++;else R.wrong++;
  mathNewQuestion();mathRender();
  mathFeedback(ok?'✓':'✗','flash '+(ok?'good':'bad'));
}
function mathSprintEnd(){
  const R=mathSprint;if(!R)return;
  mathStopTimer();R.running=false;R.done=true;
  const prev=math.sprint[math.level]||0;
  R.record=R.score>prev&&R.score>0;if(R.record)math.sprint[math.level]=R.score;
  // Coins: 1 pro 8 richtige Antworten, höchstens 10 pro Tag
  const today=mathTodayKey();if(math.coinsDate!==today){math.coinsDate=today;math.coinsDay=0;}
  let coins=Math.min(Math.floor(R.score/8),MATH_COINS_PER_DAY-math.coinsDay);
  if(coins>0&&typeof zcp==='function'&&typeof zcAddCoins==='function'){
    try{const name=(zcp().player||'').trim();if(name){zcAddCoins(name,coins);math.coinsDay+=coins;if(typeof smSave==='function')smSave('zentrale');}else coins=0;}catch(e){coins=0;}
  }else coins=0;
  R.coins=coins;mathSave();mathRender();
}

/* ── Statistik ── */
function mathRenderStats(){
  const rows=MATH_TOPICS.map(t=>{const s=math.stats[t.id]||{ok:0,no:0},n=s.ok+s.no;return {t,s,n,pct:n?Math.round(s.ok/n*100):0};});
  const total=rows.reduce((a,r)=>a+r.n,0),ok=rows.reduce((a,r)=>a+r.s.ok,0);
  return `<div class="lrn-tiles"><div class="lrn-tile"><b>${total}</b><span>Aufgaben gelöst</span></div><div class="lrn-tile"><b>${total?Math.round(ok/total*100):0}%</b><span>Trefferquote</span></div><div class="lrn-tile"><b>🔥 ${math.bestStreak}</b><span>längste Serie</span></div></div>
    <div class="lrn-card" style="margin-bottom:14px"><div class="lrn-label">Sprint-Rekorde (60 s)</div>
      <div class="lrn-tiles" style="margin:0">${MATH_LEVELS.map((n,i)=>`<div class="lrn-tile"><b>${math.sprint[i+1]||'–'}</b><span>${n}</span></div>`).join('')}</div></div>
    <div class="lrn-card"><div class="lrn-label">Nach Thema</div>
      ${rows.map(r=>`<div class="lrn-statrow"><span class="nm"><b>${r.t.sym}</b> ${r.t.name}</span><div class="lrn-bar" style="flex:1;margin:0"><div style="width:${r.pct}%"></div></div><span class="pc">${r.n?r.pct+'% · '+r.n:'–'}</span></div>`).join('')}
      <div style="margin-top:12px"><button class="lrn-btn ghost" onclick="mathResetStats()">Statistik zurücksetzen</button></div></div>`;
}
function mathResetStats(){
  const go=()=>{math.stats={};math.sprint={};math.bestStreak=0;mathSave();mathRender();};
  if(typeof appConfirm==='function')appConfirm('Statistik und Rekorde wirklich zurücksetzen?',go);else go();
}

/* ── Tastatur: Ziffern landen immer im Antwortfeld ── */
let mathKeysBound=false;
function mathBindKeys(){
  if(mathKeysBound)return;mathKeysBound=true;
  document.addEventListener('keydown',e=>{
    const scr=document.getElementById('screen-mathe');if(!scr||!scr.classList.contains('active')||mathView==='stats')return;
    const inp=document.getElementById('math-answer');
    if(inp&&document.activeElement!==inp&&/^[0-9,.\-]$/.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))&&!inp.readOnly)inp.focus();
    else if(e.key==='Enter'&&mathSess&&mathSess.answered&&document.activeElement!==inp&&mathView==='practice'){e.preventDefault();clearTimeout(mathNextT);mathNext();}
  });
}
