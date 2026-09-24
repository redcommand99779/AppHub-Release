/* ── Todo ── */
let todoItems=[],todoFilterMode='all';
function todoInit(){todoItems=JSON.parse(localStorage.getItem('zf_todos')||'[]');todoRender();}
function todoAdd(){
  const inp=document.getElementById('todo-input');const prio=document.getElementById('todo-prio');
  if(!inp?.value.trim())return;
  todoItems.unshift({text:inp.value.trim(),prio:prio?.value||'normal',done:false,id:Date.now()});
  inp.value='';localStorage.setItem('zf_todos',JSON.stringify(todoItems));todoRender();
}
function todoFilter(m){todoFilterMode=m;['all','open','done'].forEach(f=>{const b=document.getElementById('todo-filter-'+f);if(b)b.classList.toggle('active',f===m);});todoRender();}
function todoToggle(id){const t=todoItems.find(t=>t.id===id);if(t)t.done=!t.done;localStorage.setItem('zf_todos',JSON.stringify(todoItems));todoRender();}
function todoDelete(id){todoItems=todoItems.filter(t=>t.id!==id);localStorage.setItem('zf_todos',JSON.stringify(todoItems));todoRender();}
function todoRender(){
  const list=document.getElementById('todo-list');const stats=document.getElementById('todo-stats');
  if(!list)return;
  const filtered=todoFilterMode==='all'?todoItems:todoFilterMode==='open'?todoItems.filter(t=>!t.done):todoItems.filter(t=>t.done);
  const prioColors={high:'#ff3b30',normal:'var(--accent)',low:'#34c759'};
  list.innerHTML=filtered.map(t=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;margin-bottom:6px">
    <div onclick="todoToggle(${t.id})" style="width:20px;height:20px;border-radius:50%;border:2px solid ${prioColors[t.prio]};background:${t.done?prioColors[t.prio]:'transparent'};cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px">${t.done?'✓':''}</div>
    <span style="flex:1;font-size:13px;color:var(--text);text-decoration:${t.done?'line-through':'none'};opacity:${t.done?0.5:1}">${escHtml(t.text)}</span>
    <button onclick="todoDelete(${t.id})" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:16px;padding:0">×</button>
  </div>`).join('')||'<div style="text-align:center;color:var(--text-3);padding:20px;font-size:13px">Keine Aufgaben</div>';
  const done=todoItems.filter(t=>t.done).length;
  if(stats)stats.textContent=`${done}/${todoItems.length} erledigt`;
}
