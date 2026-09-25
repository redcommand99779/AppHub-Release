/* ══════════════════════════════════
   HABIT-TRACKER – Gewohnheiten mit Symbol, Wochenziel, Serie (Tage in Folge), 7-Tage-Reihe zum Nachtragen
   und Monatsübersicht. Datum = lokaler Kalendertag (früher UTC, dadurch war "heute" nachts falsch).
   Daten: zf_habits [{id,text,icon,goal(1-7 Tage pro Woche),dates:['JJJJ-MM-TT'],created}]
══════════════════════════════════ */
const HABIT_KEY='zf_habits';
const HABIT_ICONS=['✅','💧','🏃','📖','🧘','😴','🥗','🦷','✍️','🎸','🧹','💊'];
const HABIT_ALL_COINS=2;
let habitItems=[],habitEditId=null,habitOpenId=null,habitIcon='✅';

function habitEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function habitDate(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function habitShift(dateStr,n){const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()+n);return habitDate(d);}
function habitLoad(){
  let a=[];try{a=JSON.parse(localStorage.getItem(HABIT_KEY)||'[]');}catch(e){}
  if(!Array.isArray(a))a=[];
  return a.filter(h=>h&&typeof h.text==='string').map(h=>({id:h.id||Date.now()+Math.random(),text:h.text,icon:h.icon||'✅',goal:Math.max(1,Math.min(7,parseInt(h.goal,10)||7)),
    dates:[...new Set((Array.isArray(h.dates)?h.dates:[]).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort(),created:h.created||0}));
}
function habitSave(){try{localStorage.setItem(HABIT_KEY,JSON.stringify(habitItems));}catch(e){}}

/* ── Logik (testbar) ── */
/* Serie: aufeinanderfolgende Tage bis heute; ist heute noch nicht erledigt, zählt die Serie von gestern weiter.
   Bei einem Wochenziel unter 7 zählen Tage ohne Eintrag nicht als Bruch, solange das Wochenziel erreicht wurde -> hier bewusst einfach:
   Serie = Tage in Folge (Wochenziel wirkt sich nur auf die Wochenanzeige aus). */
function habitStreak(h,today){
  today=today||habitDate();let d=h.dates.includes(today)?today:habitShift(today,-1),n=0;
  while(h.dates.includes(d)){n++;d=habitShift(d,-1);}
  return n;
}
function habitBestStreak(h){
  let best=0,run=0,prev=null;
  h.dates.slice().sort().forEach(d=>{run=prev&&habitShift(prev,1)===d?run+1:1;prev=d;if(run>best)best=run;});
  return best;
}
/* Montag der Woche von 'date' */
function habitWeekStart(date){const d=new Date(date+'T12:00:00'),wd=(d.getDay()+6)%7;return habitShift(date,-wd);}
function habitWeekCount(h,today){today=today||habitDate();const s=habitWeekStart(today);let n=0;for(let i=0;i<7;i++)if(h.dates.includes(habitShift(s,i)))n++;return n;}
function habitRate30(h,today){today=today||habitDate();let n=0;for(let i=0;i<30;i++)if(h.dates.includes(habitShift(today,-i)))n++;return Math.round(n/30*100);}
function habitToggleDate(h,date){const i=h.dates.indexOf(date);if(i>=0)h.dates.splice(i,1);else{h.dates.push(date);h.dates.sort();}return i<0;}
function habitAllDoneToday(today){today=today||habitDate();return habitItems.length>0&&habitItems.every(h=>h.dates.includes(today));}

/* ── Oberfläche ── */
function habitInit(){habitItems=habitLoad();habitEditId=null;habitRender();}
function habitRoot(){return document.getElementById('habit-root');}
function habitAdd(){
  const inp=document.getElementById('habit-input');if(!inp||!inp.value.trim()){if(inp)inp.focus();return;}
  const goal=parseInt((document.getElementById('habit-goal')||{}).value,10)||7;
  habitItems.push({id:Date.now(),text:inp.value.trim(),icon:habitIcon,goal:Math.max(1,Math.min(7,goal)),dates:[],created:Date.now()});
  habitSave();habitRender();const e=document.getElementById('habit-input');if(e)e.focus();
}
function habitPickIcon(i){habitIcon=i;habitRender();const e=document.getElementById('habit-input');if(e)e.focus();}
function habitFind(id){return habitItems.find(h=>String(h.id)===String(id));}
function habitToggle(id,date){
  const h=habitFind(id);if(!h)return;
  const today=habitDate(),d=date||today,wasAll=habitAllDoneToday(today);
  const added=habitToggleDate(h,d);habitSave();
  if(added&&d===today&&!wasAll&&habitAllDoneToday(today))habitAllReward();
  habitRender();
}
/* Alle Gewohnheiten an einem Tag erledigt: einmal pro Tag ein paar Coins */
function habitAllReward(){
  const today=habitDate();let last='';try{last=localStorage.getItem('zf_habit_coin')||'';}catch(e){}
  if(last===today)return;
  try{localStorage.setItem('zf_habit_coin',today);}catch(e){}
  let got=0;
  if(typeof zcp==='function'&&typeof zcAddCoins==='function'){try{const name=(zcp().player||'').trim();if(name){zcAddCoins(name,HABIT_ALL_COINS);if(typeof smSave==='function')smSave('zentrale');got=HABIT_ALL_COINS;}}catch(e){}}
  if(typeof showToast==='function')showToast('🎉 Alle Gewohnheiten für heute geschafft!'+(got?` +${got} 🪙`:''),3500);
  if(typeof sfx==='function'){try{sfx('chime');}catch(e){}}
}
function habitDelete(id){
  const h=habitFind(id);if(!h)return;
  const go=()=>{habitItems=habitItems.filter(x=>String(x.id)!==String(id));habitSave();habitRender();};
  if(typeof appConfirm==='function')appConfirm(`„${h.text}“ und alle Einträge löschen?`,go);else go();
}
function habitEdit(id){habitEditId=id==null?null:String(id);habitRender();const e=document.getElementById('habit-e-text');if(e)e.focus();}
function habitSaveEdit(id){
  const h=habitFind(id),t=(document.getElementById('habit-e-text')||{}).value;if(!h||!t||!t.trim())return;
  h.text=t.trim();h.goal=Math.max(1,Math.min(7,parseInt((document.getElementById('habit-e-goal')||{}).value,10)||7));
  const ic=document.querySelector('#habit-root input[name="habit-e-icon"]:checked');if(ic)h.icon=ic.value;
  habitEditId=null;habitSave();habitRender();
}
function habitOpen(id){habitOpenId=String(habitOpenId)===String(id)?null:String(id);habitRender();}
function habitRender(){
  const root=habitRoot();if(!root)return;
  const today=habitDate(),n=habitItems.length,doneToday=habitItems.filter(h=>h.dates.includes(today)).length;
  const best=habitItems.reduce((m,h)=>Math.max(m,habitStreak(h,today)),0);
  const week=n?Math.round(habitItems.reduce((a,h)=>a+Math.min(1,habitWeekCount(h,today)/h.goal),0)/n*100):0;
  root.innerHTML=`
    <div class="lrn-card" style="margin-bottom:14px">
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="habit-input" class="lrn-input" placeholder="Neue Gewohnheit, z. B. 2 Liter trinken" style="flex:1;min-width:180px" onkeydown="if(event.key==='Enter')habitAdd()">
        <select id="habit-goal" class="lrn-input" title="Ziel pro Woche">${[7,6,5,4,3,2,1].map(g=>`<option value="${g}">${g===7?'Täglich':g+'× pro Woche'}</option>`).join('')}</select>
        <button class="lrn-btn" onclick="habitAdd()">＋ Hinzufügen</button></div>
      <div class="lrn-chips" style="margin-top:10px">${HABIT_ICONS.map(i=>`<button class="lrn-chip${habitIcon===i?' active':''}" style="padding:4px 10px;font-size:16px" onclick="habitPickIcon('${i}')">${i}</button>`).join('')}</div></div>
    ${n?`<div class="lrn-tiles"><div class="lrn-tile"><b>${doneToday}/${n}</b><span>heute erledigt</span></div><div class="lrn-tile"><b>🔥 ${best}</b><span>beste aktuelle Serie</span></div><div class="lrn-tile"><b>${week}%</b><span>Wochenziele</span></div></div>
    <div class="lrn-bar" style="margin-bottom:14px"><div style="width:${Math.round(doneToday/n*100)}%"></div></div>`:''}
    ${n?habitItems.map(h=>habitRenderItem(h,today)).join(''):`<div style="text-align:center;color:var(--text-3);padding:30px;font-size:13px">Noch keine Gewohnheiten – starte mit einer kleinen. 🌱</div>`}`;
}
function habitRenderItem(h,today){
  const sid=String(h.id);
  if(habitEditId===sid){
    return `<div class="lrn-card" style="margin-bottom:8px"><input id="habit-e-text" class="lrn-input" value="${habitEsc(h.text)}" style="width:100%;margin-bottom:8px" onkeydown="if(event.key==='Enter')habitSaveEdit('${sid}')">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="habit-e-goal" class="lrn-input">${[7,6,5,4,3,2,1].map(g=>`<option value="${g}" ${h.goal===g?'selected':''}>${g===7?'Täglich':g+'× pro Woche'}</option>`).join('')}</select></div>
      <div class="lrn-chips">${HABIT_ICONS.map(i=>`<label class="lrn-chip" style="padding:4px 10px;font-size:16px;cursor:pointer"><input type="radio" name="habit-e-icon" value="${i}" ${h.icon===i?'checked':''} style="display:none" onchange="this.parentNode.parentNode.querySelectorAll('.lrn-chip').forEach(c=>c.classList.remove('active'));this.parentNode.classList.add('active')">${i}</label>`).join('')}</div>
      <div class="lrn-two"><button class="lrn-btn ghost" onclick="habitEdit(null)">Abbrechen</button><button class="lrn-btn" onclick="habitSaveEdit('${sid}')">Speichern</button></div></div>`;
  }
  const done=h.dates.includes(today),streak=habitStreak(h,today),wk=habitWeekCount(h,today),open=habitOpenId===sid;
  const days=Array.from({length:7},(_,i)=>habitShift(today,i-6));
  const wkd=['So','Mo','Di','Mi','Do','Fr','Sa'];
  return `<div class="lrn-card" style="margin-bottom:8px;padding:12px 14px">
    <div style="display:flex;align-items:center;gap:10px">
      <button onclick="habitToggle('${sid}')" style="width:38px;height:38px;border-radius:12px;border:2px solid var(--accent);background:${done?'var(--accent)':'transparent'};color:#fff;font-size:18px;cursor:pointer;flex:none">${done?'✓':''}</button>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="habitOpen('${sid}')"><div style="font-size:15px;font-weight:700">${habitEsc(h.icon)} ${habitEsc(h.text)}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px">🔥 ${streak} Tag${streak===1?'':'e'} in Folge · Woche ${wk}/${h.goal}${wk>=h.goal?' ✅':''}</div></div>
      <button class="lrn-btn ghost" onclick="habitEdit('${sid}')" title="Bearbeiten">✏️</button><button class="lrn-btn ghost" onclick="habitDelete('${sid}')" title="Löschen">🗑</button></div>
    <div style="display:flex;gap:6px;margin-top:10px;justify-content:space-between">${days.map(d=>{const on=h.dates.includes(d),dt=new Date(d+'T12:00:00');
      return `<button onclick="habitToggle('${sid}','${d}')" title="${d}" style="flex:1;padding:5px 0;border-radius:9px;border:1.5px solid ${on?'var(--accent)':'var(--divider)'};background:${on?'var(--accent)':'var(--bg)'};color:${on?'#fff':'var(--text-3)'};font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;${d===today?'box-shadow:0 0 0 2px var(--active-bg)':''}">${wkd[dt.getDay()]}<br><span style="font-size:13px">${dt.getDate()}</span></button>`;}).join('')}</div>
    ${open?habitRenderMonth(h,today):''}</div>`;
}
function habitRenderMonth(h,today){
  const rate=habitRate30(h,today),best=habitBestStreak(h);
  const cells=Array.from({length:30},(_,i)=>{const d=habitShift(today,i-29);return `<i title="${d}" style="width:14px;height:14px;border-radius:4px;background:${h.dates.includes(d)?'var(--accent)':'var(--divider)'};display:inline-block"></i>`;}).join('');
  return `<div style="margin-top:12px;padding-top:10px;border-top:0.5px solid var(--divider)"><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${cells}</div>
    <div style="font-size:12px;color:var(--text-3)">Letzte 30 Tage: <b style="color:var(--text)">${rate}%</b> · Beste Serie: <b style="color:var(--text)">${best}</b> · Insgesamt: <b style="color:var(--text)">${h.dates.length}</b> Tage</div></div>`;
}
