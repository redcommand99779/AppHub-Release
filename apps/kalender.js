/* ── Kalender ── */
let kalDate=new Date();
const kalMonths=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const kalDays=['Mo','Di','Mi','Do','Fr','Sa','So'];
function kalInit(){kalRender();}
function kalPrev(){kalDate=new Date(kalDate.getFullYear(),kalDate.getMonth()-1,1);kalRender();}
function kalNext(){kalDate=new Date(kalDate.getFullYear(),kalDate.getMonth()+1,1);kalRender();}
function kalRender(){
  const t=document.getElementById('kal-title');if(t)t.textContent=kalMonths[kalDate.getMonth()]+' '+kalDate.getFullYear();
  const g=document.getElementById('kal-grid');if(!g)return;
  const events=JSON.parse(localStorage.getItem('zf_cal')||'{}');
  const year=kalDate.getFullYear(),month=kalDate.getMonth();
  const first=new Date(year,month,1);let startDay=(first.getDay()+6)%7;
  const days=new Date(year,month+1,0).getDate();
  const today=new Date();
  let html=kalDays.map(d=>`<div style="font-size:11px;font-weight:600;color:var(--text-3);text-align:center;padding:4px">${d}</div>`).join('');
  for(let i=0;i<startDay;i++)html+='<div></div>';
  for(let d=1;d<=days;d++){
    const key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
    const hasEvent=events[key]?.length>0;
    html+=`<div onclick="kalSelectDay('${key}')" style="padding:6px;border-radius:8px;text-align:center;cursor:pointer;font-size:13px;background:${isToday?'var(--accent)':'transparent'};color:${isToday?'#fff':'var(--text)'};font-weight:${isToday?'700':'400'};position:relative">${d}${hasEvent?'<div style="width:4px;height:4px;border-radius:50%;background:var(--accent);position:absolute;bottom:2px;left:50%;transform:translateX(-50%)"></div>':''}</div>`;
  }
  g.innerHTML=html;
  kalShowEvents();
}
function kalSelectDay(key){
  const events=JSON.parse(localStorage.getItem('zf_cal')||'{}');
  const inp=document.getElementById('kal-new-event');if(inp)inp.dataset.key=key;
  kalShowEvents(key);
}
function kalAddEvent(){
  const inp=document.getElementById('kal-new-event');if(!inp||!inp.value)return;
  const key=inp.dataset.key||new Date().toISOString().slice(0,10);
  const events=JSON.parse(localStorage.getItem('zf_cal')||'{}');
  if(!events[key])events[key]=[];
  events[key].push(inp.value);
  localStorage.setItem('zf_cal',JSON.stringify(events));
  inp.value='';kalRender();
}
function kalShowEvents(key){
  const ev=document.getElementById('kal-events');if(!ev)return;
  const events=JSON.parse(localStorage.getItem('zf_cal')||'{}');
  const k=key||Object.keys(events)[0];
  if(!k||!events[k]){ev.innerHTML='<div style="font-size:13px;color:var(--text-3)">Kein Tag ausgewählt</div>';return;}
  ev.innerHTML=`<div style="font-size:12px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">${k}</div>`+
    events[k].map((e,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;margin-bottom:4px"><span style="font-size:13px;color:var(--text)">${escHtml(e)}</span><button onclick="kalDelete('${k}',${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;padding:0">×</button></div>`).join('');
}
function kalDelete(key,idx){const e=JSON.parse(localStorage.getItem('zf_cal')||'{}');e[key].splice(idx,1);localStorage.setItem('zf_cal',JSON.stringify(e));kalRender();}

