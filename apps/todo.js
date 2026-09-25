/* ══════════════════════════════════
   TO-DO – Aufgaben mit Priorität, Fälligkeit, Kategorie und Unteraufgaben; Filter (Heute, Überfällig, Kategorie),
   Bearbeiten direkt in der Liste. Daten: zf_todos (bisheriges Format bleibt lesbar; neue Felder sind optional)
   Aufgabe: {id,text,prio:'high'|'normal'|'low',done,due:'JJJJ-MM-TT',cat,note,sub:[{id,t,d}],created,doneAt}
══════════════════════════════════ */
const TODO_KEY='zf_todos';
const TODO_PRIO={high:{label:'Hoch',color:'#ff3b30',rank:0},normal:{label:'Normal',color:'var(--accent)',rank:1},low:{label:'Niedrig',color:'#34c759',rank:2}};
let todoItems=[],todoFilterMode='open',todoCat='',todoSort='smart',todoEditId=null,todoOpenId=null,todoQuery='';

function todoEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function todoDate(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function todoLoad(){
  let a=[];try{a=JSON.parse(localStorage.getItem(TODO_KEY)||'[]');}catch(e){}
  if(!Array.isArray(a))a=[];
  return a.filter(t=>t&&typeof t.text==='string').map(t=>({id:t.id||Date.now()+Math.random(),text:t.text,prio:TODO_PRIO[t.prio]?t.prio:'normal',done:!!t.done,due:/^\d{4}-\d{2}-\d{2}$/.test(t.due||'')?t.due:'',cat:String(t.cat||'').trim(),note:String(t.note||''),
    sub:Array.isArray(t.sub)?t.sub.filter(s=>s&&s.t).map(s=>({id:s.id||Math.random(),t:String(s.t),d:!!s.d})):[],created:t.created||0,doneAt:t.doneAt||0}));
}
function todoSave(){try{localStorage.setItem(TODO_KEY,JSON.stringify(todoItems));}catch(e){}}

/* ── Logik (testbar) ── */
function todoIsOverdue(t,today){today=today||todoDate();return !t.done&&!!t.due&&t.due<today;}
function todoIsToday(t,today){today=today||todoDate();return !t.done&&t.due===today;}
function todoCategories(){return [...new Set(todoItems.map(t=>t.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));}
function todoMatches(t,mode,cat,q,today){
  today=today||todoDate();
  if(mode==='open'&&t.done)return false;
  if(mode==='done'&&!t.done)return false;
  if(mode==='today'&&!(todoIsToday(t,today)||todoIsOverdue(t,today)))return false;
  if(mode==='overdue'&&!todoIsOverdue(t,today))return false;
  if(cat&&t.cat!==cat)return false;
  if(q){const s=q.toLowerCase();if(!(t.text.toLowerCase().includes(s)||t.cat.toLowerCase().includes(s)||t.sub.some(x=>x.t.toLowerCase().includes(s))))return false;}
  return true;
}
/* Sortierung: offene zuerst, überfällig/fällig früh, dann Priorität, dann neueste */
function todoCompare(a,b){
  if(a.done!==b.done)return a.done?1:-1;
  if(a.done)return (b.doneAt||0)-(a.doneAt||0);
  const ad=a.due||'9999-99-99',bd=b.due||'9999-99-99';
  if(ad!==bd)return ad<bd?-1:1;
  const pr=TODO_PRIO[a.prio].rank-TODO_PRIO[b.prio].rank;
  if(pr)return pr;
  return (b.created||0)-(a.created||0);
}
function todoComparePrio(a,b){
  if(a.done!==b.done)return a.done?1:-1;
  const pr=TODO_PRIO[a.prio].rank-TODO_PRIO[b.prio].rank;
  if(pr)return pr;
  return todoCompare(a,b);
}
function todoDueLabel(t,today){
  today=today||todoDate();if(!t.due)return '';
  const d=new Date(t.due+'T12:00:00'),t0=new Date(today+'T12:00:00'),diff=Math.round((d-t0)/86400000);
  if(diff===0)return 'Heute';if(diff===1)return 'Morgen';if(diff===-1)return 'Gestern';
  if(diff<0)return 'vor '+(-diff)+' Tagen';if(diff<7)return 'in '+diff+' Tagen';
  return d.toLocaleDateString('de-DE',{day:'numeric',month:'short'});
}
function todoNew(text,opts){
  opts=opts||{};
  return {id:Date.now()+Math.floor(Math.random()*1000),text:String(text).trim(),prio:TODO_PRIO[opts.prio]?opts.prio:'normal',done:false,due:opts.due||'',cat:String(opts.cat||'').trim(),note:'',sub:[],created:Date.now(),doneAt:0};
}

/* ── Oberfläche ── */
function todoInit(){todoItems=todoLoad();todoEditId=null;todoOpenId=null;todoRender();}
function todoRoot(){return document.getElementById('todo-root');}
function todoVal(id){const e=document.getElementById(id);return e?e.value:'';}
function todoAdd(){
  const text=todoVal('todo-input').trim();if(!text){const e=document.getElementById('todo-input');if(e)e.focus();return;}
  todoItems.unshift(todoNew(text,{prio:todoVal('todo-prio'),due:todoVal('todo-due'),cat:todoVal('todo-cat')}));
  todoSave();todoRender();const e=document.getElementById('todo-input');if(e)e.focus();
}
function todoFind(id){return todoItems.find(t=>String(t.id)===String(id));}
function todoFilter(m){todoFilterMode=m;todoRender();}
function todoSetCat(c){todoCat=todoCat===c?'':c;todoRender();}
function todoSetSort(s){todoSort=s;todoRender();}
function todoSearch(v){todoQuery=v||'';todoRender();const e=document.getElementById('todo-q');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}
function todoToggle(id){const t=todoFind(id);if(!t)return;t.done=!t.done;t.doneAt=t.done?Date.now():0;if(t.done)t.sub.forEach(s=>s.d=true);todoSave();todoRender();}
function todoDelete(id){todoItems=todoItems.filter(t=>String(t.id)!==String(id));todoSave();todoRender();}
function todoEdit(id){todoEditId=id==null?null:String(id);todoRender();const e=document.getElementById('todo-e-text');if(e)e.focus();}
function todoSaveEdit(id){
  const t=todoFind(id),text=todoVal('todo-e-text').trim();if(!t||!text)return;
  t.text=text;t.prio=todoVal('todo-e-prio')||'normal';t.due=todoVal('todo-e-due');t.cat=todoVal('todo-e-cat').trim();t.note=todoVal('todo-e-note').trim();
  todoEditId=null;todoSave();todoRender();
}
function todoOpen(id){todoOpenId=String(todoOpenId)===String(id)?null:String(id);todoRender();}
function todoAddSub(id){
  const t=todoFind(id),inp=document.getElementById('todo-sub-'+id);if(!t||!inp||!inp.value.trim())return;
  t.sub.push({id:Date.now()+Math.random(),t:inp.value.trim(),d:false});if(t.done){t.done=false;t.doneAt=0;}
  todoSave();todoRender();const n=document.getElementById('todo-sub-'+id);if(n)n.focus();
}
function todoToggleSub(id,sid){
  const t=todoFind(id);if(!t)return;const s=t.sub.find(x=>String(x.id)===String(sid));if(!s)return;s.d=!s.d;
  if(t.sub.length&&t.sub.every(x=>x.d)&&!t.done){t.done=true;t.doneAt=Date.now();}
  todoSave();todoRender();
}
function todoDelSub(id,sid){const t=todoFind(id);if(!t)return;t.sub=t.sub.filter(x=>String(x.id)!==String(sid));todoSave();todoRender();}
function todoClearDone(){
  const n=todoItems.filter(t=>t.done).length;if(!n)return;
  const go=()=>{todoItems=todoItems.filter(t=>!t.done);todoSave();todoRender();};
  if(typeof appConfirm==='function')appConfirm(`${n} erledigte Aufgabe${n===1?'':'n'} löschen?`,go);else go();
}
function todoRender(){
  const root=todoRoot();if(!root)return;
  const today=todoDate(),cats=todoCategories();
  const openN=todoItems.filter(t=>!t.done).length,doneN=todoItems.length-openN,overN=todoItems.filter(t=>todoIsOverdue(t,today)).length,todayN=todayCount(today);
  const list=todoItems.filter(t=>todoMatches(t,todoFilterMode,todoCat,todoQuery,today)).sort(todoSort==='prio'?todoComparePrio:todoCompare);
  const chip=(id,l,n)=>`<button class="lrn-chip${todoFilterMode===id?' active':''}" onclick="todoFilter('${id}')">${l}${n!=null?` <b style="opacity:.7">${n}</b>`:''}</button>`;
  root.innerHTML=`
    <div class="lrn-card" style="margin-bottom:14px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="todo-input" class="lrn-input" placeholder="Neue Aufgabe …" style="flex:1;min-width:180px" onkeydown="if(event.key==='Enter')todoAdd()">
        <button class="lrn-btn" onclick="todoAdd()">＋ Hinzufügen</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <select id="todo-prio" class="lrn-input" title="Priorität"><option value="normal">● Normal</option><option value="high">🔴 Hoch</option><option value="low">🟢 Niedrig</option></select>
        <input id="todo-due" type="date" class="lrn-input" title="Fällig am">
        <input id="todo-cat" class="lrn-input" list="todo-cats" placeholder="Kategorie" style="flex:1;min-width:110px"><datalist id="todo-cats">${cats.map(c=>`<option value="${todoEsc(c)}">`).join('')}</datalist></div>
    </div>
    <div class="lrn-tiles"><div class="lrn-tile"><b>${openN}</b><span>offen</span></div><div class="lrn-tile"><b style="${overN?'color:#ff3b30':''}">${overN}</b><span>überfällig</span></div><div class="lrn-tile"><b>${todayN}</b><span>heute fällig</span></div><div class="lrn-tile"><b>${doneN}/${todoItems.length}</b><span>erledigt</span></div></div>
    <div class="lrn-bar" style="margin-bottom:12px"><div style="width:${todoItems.length?Math.round(doneN/todoItems.length*100):0}%"></div></div>
    <div class="lrn-chips" style="margin-bottom:8px">${chip('open','Offen',openN)}${chip('today','Heute',todayN+overN)}${chip('overdue','Überfällig',overN)}${chip('done','Erledigt',doneN)}${chip('all','Alle',todoItems.length)}</div>
    ${cats.length?`<div class="lrn-chips" style="margin-bottom:8px">${cats.map(c=>`<button class="lrn-chip${todoCat===c?' active':''}" onclick="todoSetCat(this.dataset.c)" data-c="${todoEsc(c)}">🏷 ${todoEsc(c)}</button>`).join('')}</div>`:''}
    <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap"><input id="todo-q" class="lrn-input" placeholder="🔍 Suchen …" value="${todoEsc(todoQuery)}" oninput="todoSearch(this.value)" style="flex:1;min-width:130px">
      <select class="lrn-input" onchange="todoSetSort(this.value)" title="Sortierung"><option value="smart" ${todoSort==='smart'?'selected':''}>Nach Datum</option><option value="prio" ${todoSort==='prio'?'selected':''}>Nach Priorität</option></select>
      ${doneN?`<button class="lrn-btn ghost" onclick="todoClearDone()">Erledigte löschen</button>`:''}</div>
    ${list.length?list.map(t=>todoRenderItem(t,today)).join(''):`<div style="text-align:center;color:var(--text-3);padding:26px;font-size:13px">${todoItems.length?'Nichts in dieser Ansicht.':'Noch keine Aufgaben – schreib oben deine erste auf. ✍️'}</div>`}`;
}
function todayCount(today){return todoItems.filter(t=>todoIsToday(t,today)).length;}
function todoRenderItem(t,today){
  const pr=TODO_PRIO[t.prio],sid=String(t.id);
  if(todoEditId===sid){
    return `<div class="lrn-card" style="margin-bottom:8px"><input id="todo-e-text" class="lrn-input" value="${todoEsc(t.text)}" style="width:100%;margin-bottom:8px" onkeydown="if(event.key==='Enter')todoSaveEdit('${sid}')">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="todo-e-prio" class="lrn-input">${Object.keys(TODO_PRIO).map(k=>`<option value="${k}" ${t.prio===k?'selected':''}>${TODO_PRIO[k].label}</option>`).join('')}</select>
        <input id="todo-e-due" type="date" class="lrn-input" value="${t.due}"><input id="todo-e-cat" class="lrn-input" value="${todoEsc(t.cat)}" placeholder="Kategorie" list="todo-cats" style="flex:1;min-width:100px"></div>
      <textarea id="todo-e-note" class="lrn-input" rows="2" placeholder="Notiz" style="width:100%;resize:vertical">${todoEsc(t.note)}</textarea>
      <div class="lrn-two"><button class="lrn-btn ghost" onclick="todoEdit(null)">Abbrechen</button><button class="lrn-btn" onclick="todoSaveEdit('${sid}')">Speichern</button></div></div>`;
  }
  const over=todoIsOverdue(t,today),subDone=t.sub.filter(s=>s.d).length,open=todoOpenId===sid;
  return `<div class="lrn-card" style="margin-bottom:8px;padding:10px 12px${over?';border-color:rgba(255,59,48,0.45)':''}">
    <div style="display:flex;align-items:center;gap:10px">
      <div onclick="todoToggle('${sid}')" role="checkbox" aria-checked="${t.done}" style="width:22px;height:22px;border-radius:50%;border:2px solid ${pr.color};background:${t.done?pr.color:'transparent'};cursor:pointer;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px">${t.done?'✓':''}</div>
      <div style="flex:1;min-width:0;cursor:pointer" onclick="todoOpen('${sid}')"><div style="font-size:14px;font-weight:600;${t.done?'text-decoration:line-through;opacity:.5':''}">${todoEsc(t.text)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:3px;font-size:11px;color:var(--text-3)">
          ${t.due?`<span style="${over?'color:#ff3b30;font-weight:700':''}">📅 ${todoDueLabel(t,today)}</span>`:''}${t.cat?`<span>🏷 ${todoEsc(t.cat)}</span>`:''}${t.sub.length?`<span>☑ ${subDone}/${t.sub.length}</span>`:''}${t.note?'<span>📝</span>':''}</div></div>
      <button class="lrn-btn ghost" onclick="todoEdit('${sid}')" title="Bearbeiten">✏️</button><button class="lrn-btn ghost" onclick="todoDelete('${sid}')" title="Löschen">🗑</button></div>
    ${open?`<div style="margin:10px 0 0 32px">${t.note?`<div style="font-size:12px;color:var(--text-2);white-space:pre-wrap;margin-bottom:8px">${todoEsc(t.note)}</div>`:''}
      ${t.sub.map(s=>`<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px"><input type="checkbox" ${s.d?'checked':''} onchange="todoToggleSub('${sid}','${s.id}')"><span style="flex:1;${s.d?'text-decoration:line-through;opacity:.5':''}">${todoEsc(s.t)}</span><button class="lrn-btn ghost" style="padding:2px 8px" onclick="todoDelSub('${sid}','${s.id}')">×</button></div>`).join('')}
      <div style="display:flex;gap:6px;margin-top:6px"><input id="todo-sub-${sid}" class="lrn-input" placeholder="Unteraufgabe …" style="flex:1" onkeydown="if(event.key==='Enter')todoAddSub('${sid}')"><button class="lrn-btn ghost" onclick="todoAddSub('${sid}')">＋</button></div></div>`:''}</div>`;
}
