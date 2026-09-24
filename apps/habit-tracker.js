/* ── Habit Tracker ── */
let habitItems=[];
function habitInit(){habitItems=JSON.parse(localStorage.getItem('zf_habits')||'[]');habitRender();}
function habitAdd(){
  const inp=document.getElementById('habit-input');if(!inp?.value.trim())return;
  habitItems.push({text:inp.value.trim(),id:Date.now(),dates:[]});
  inp.value='';localStorage.setItem('zf_habits',JSON.stringify(habitItems));habitRender();
}
function habitToggle(id){
  const today=new Date().toISOString().slice(0,10);
  const h=habitItems.find(h=>h.id===id);if(!h)return;
  const idx=h.dates.indexOf(today);
  if(idx>=0)h.dates.splice(idx,1);else h.dates.push(today);
  localStorage.setItem('zf_habits',JSON.stringify(habitItems));habitRender();
}
function habitDelete(id){habitItems=habitItems.filter(h=>h.id!==id);localStorage.setItem('zf_habits',JSON.stringify(habitItems));habitRender();}
function habitRender(){
  const list=document.getElementById('habit-list');if(!list)return;
  const today=new Date().toISOString().slice(0,10);
  list.innerHTML=habitItems.map(h=>{
    const done=h.dates.includes(today);
    const streak=h.dates.filter(d=>d).length;
    return `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;margin-bottom:6px">
      <div onclick="habitToggle(${h.id})" style="width:28px;height:28px;border-radius:8px;background:${done?'var(--accent)':'transparent'};border:2px solid var(--accent);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex-shrink:0">${done?'✓':''}</div>
      <span style="flex:1;font-size:14px;font-weight:500;color:var(--text)">${escHtml(h.text)}</span>
      <span style="font-size:12px;color:var(--text-3)">${streak} Tage 🔥</span>
      <button onclick="habitDelete(${h.id})" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:16px;padding:0">×</button>
    </div>`;
  }).join('')||'<div style="text-align:center;color:var(--text-3);padding:20px;font-size:13px">Noch keine Gewohnheiten</div>';
}
