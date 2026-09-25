/* ══════════════════════════════════
   KALENDER – Monatsansicht (Woche ab Montag) mit Terminen (Uhrzeit, Farbe, Wiederholung), deutschen Feiertagen,
   Tagesliste, "Als Nächstes"-Übersicht und Bearbeiten. Lokales Datum (früher UTC).
   Daten: zf_cal { 'JJJJ-MM-TT': [{id,t,time,color,rep:'none'|'weekly'|'monthly'|'yearly',note}] } (alte Text-Termine werden gewandelt)
══════════════════════════════════ */
const KAL_KEY='zf_cal';
const KAL_MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const KAL_DAYS=['Mo','Di','Mi','Do','Fr','Sa','So'];
const KAL_COLORS={blue:'#0a84ff',red:'#ff3b30',green:'#34c759',orange:'#ff9500',purple:'#af52de',pink:'#ff2d55'};
const KAL_REP={none:'Einmalig',weekly:'Jede Woche',monthly:'Jeden Monat',yearly:'Jedes Jahr'};
let kalDate=new Date(),kalSel='',kalEditId=null,kalEvents={};

function kalEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function kalKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function kalParse(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d,12);}
function kalShift(key,n){const d=kalParse(key);d.setDate(d.getDate()+n);return kalKey(d);}
function kalLoad(){
  let raw={};try{raw=JSON.parse(localStorage.getItem(KAL_KEY)||'{}');}catch(e){}
  const out={};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  Object.keys(raw).forEach(k=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!Array.isArray(raw[k]))return;
    const list=raw[k].map((e,i)=>typeof e==='string'?{id:k+'-'+i,t:e,time:'',color:'blue',rep:'none',note:''}
      :(e&&e.t?{id:e.id||k+'-'+i,t:String(e.t),time:/^\d{2}:\d{2}$/.test(e.time||'')?e.time:'',color:KAL_COLORS[e.color]?e.color:'blue',rep:KAL_REP[e.rep]?e.rep:'none',note:String(e.note||'')}:null)).filter(Boolean);
    if(list.length)out[k]=list;
  });
  return out;
}
function kalSave(){try{localStorage.setItem(KAL_KEY,JSON.stringify(kalEvents));}catch(e){}}

/* ── Feiertage (Deutschland, bundesweit) ── */
function kalEaster(year){   // Gaußsche Osterformel
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
    i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day,12);
}
const kalHolidayCache={};
function kalHolidays(year){
  if(kalHolidayCache[year])return kalHolidayCache[year];
  const e=kalEaster(year),add=n=>{const d=new Date(e);d.setDate(d.getDate()+n);return kalKey(d);},fix=(m,d)=>year+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
  const h={};h[fix(1,1)]='Neujahr';h[add(-2)]='Karfreitag';h[add(0)]='Ostersonntag';h[add(1)]='Ostermontag';h[fix(5,1)]='Tag der Arbeit';h[add(39)]='Christi Himmelfahrt';
  h[add(49)]='Pfingstsonntag';h[add(50)]='Pfingstmontag';h[fix(10,3)]='Tag der Deutschen Einheit';h[fix(12,25)]='1. Weihnachtstag';h[fix(12,26)]='2. Weihnachtstag';
  return kalHolidayCache[year]=h;
}
function kalHoliday(key){return kalHolidays(+key.slice(0,4))[key]||'';}

/* ── Termine eines Tages (inkl. Wiederholungen), sortiert nach Uhrzeit ── */
function kalOn(key){
  const target=kalParse(key),out=[];
  Object.keys(kalEvents).forEach(k=>{
    kalEvents[k].forEach(ev=>{
      let hit=false;
      if(k===key)hit=true;
      else if(k<key){const s=kalParse(k);
        if(ev.rep==='weekly')hit=Math.round((target-s)/86400000)%7===0;
        else if(ev.rep==='monthly')hit=s.getDate()===target.getDate();
        else if(ev.rep==='yearly')hit=s.getDate()===target.getDate()&&s.getMonth()===target.getMonth();}
      if(hit)out.push({ev,start:k});
    });
  });
  return out.sort((a,b)=>(a.ev.time||'99:99').localeCompare(b.ev.time||'99:99')||a.ev.t.localeCompare(b.ev.t,'de'));
}
function kalUpcoming(fromKey,days){
  const out=[];for(let i=0;i<days;i++){const k=kalShift(fromKey,i);kalOn(k).forEach(x=>out.push({key:k,ev:x.ev}));}
  return out;
}
function kalDayLabel(key,today){
  today=today||kalKey();if(key===today)return 'Heute';if(key===kalShift(today,1))return 'Morgen';if(key===kalShift(today,-1))return 'Gestern';
  const d=kalParse(key);return ['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]+', '+d.getDate()+'. '+KAL_MONTHS[d.getMonth()];
}

/* ── Oberfläche ── */
function kalInit(){kalEvents=kalLoad();kalDate=new Date();kalSel=kalKey();kalEditId=null;kalRender();}
function kalRoot(){return document.getElementById('kal-root');}
function kalPrev(){kalDate=new Date(kalDate.getFullYear(),kalDate.getMonth()-1,1);kalRender();}
function kalNext(){kalDate=new Date(kalDate.getFullYear(),kalDate.getMonth()+1,1);kalRender();}
function kalToday(){kalDate=new Date();kalSel=kalKey();kalEditId=null;kalRender();}
function kalSelectDay(key){kalSel=key;kalEditId=null;const d=kalParse(key);if(d.getMonth()!==kalDate.getMonth()||d.getFullYear()!==kalDate.getFullYear())kalDate=new Date(d.getFullYear(),d.getMonth(),1);kalRender();}
function kalVal(id){const e=document.getElementById(id);return e?e.value:'';}
function kalAddEvent(){
  const t=kalVal('kal-t').trim();if(!t){const e=document.getElementById('kal-t');if(e)e.focus();return;}
  const ev={id:Date.now()+Math.floor(Math.random()*1000),t,time:kalVal('kal-time'),color:kalVal('kal-color')||'blue',rep:kalVal('kal-rep')||'none',note:''};
  (kalEvents[kalSel]=kalEvents[kalSel]||[]).push(ev);kalSave();kalRender();const e=document.getElementById('kal-t');if(e)e.focus();
}
function kalFind(start,id){return (kalEvents[start]||[]).find(e=>String(e.id)===String(id));}
function kalEdit(start,id){kalEditId=start?start+'|'+id:null;kalRender();const e=document.getElementById('kal-e-t');if(e)e.focus();}
function kalSaveEdit(start,id){
  const ev=kalFind(start,id),t=kalVal('kal-e-t').trim();if(!ev||!t)return;
  ev.t=t;ev.time=kalVal('kal-e-time');ev.color=kalVal('kal-e-color')||'blue';ev.rep=kalVal('kal-e-rep')||'none';ev.note=kalVal('kal-e-note').trim();
  kalEditId=null;kalSave();kalRender();
}
function kalDelete(start,id){
  const ev=kalFind(start,id);if(!ev)return;
  const go=()=>{kalEvents[start]=kalEvents[start].filter(e=>String(e.id)!==String(id));if(!kalEvents[start].length)delete kalEvents[start];kalSave();kalRender();};
  if(ev.rep!=='none'&&typeof appConfirm==='function')appConfirm(`„${ev.t}“ und alle Wiederholungen löschen?`,go);else go();
}
function kalRender(){
  const root=kalRoot();if(!root)return;
  const year=kalDate.getFullYear(),month=kalDate.getMonth(),today=kalKey();
  const startDay=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate();
  let grid=KAL_DAYS.map(d=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-align:center;padding:4px">${d}</div>`).join('');
  for(let i=0;i<startDay;i++)grid+='<div></div>';
  for(let d=1;d<=days;d++){
    const key=year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'),evs=kalOn(key),hol=kalHoliday(key),wd=(startDay+d-1)%7,isToday=key===today,sel=key===kalSel;
    const dots=evs.slice(0,3).map(x=>`<i style="width:5px;height:5px;border-radius:50%;background:${KAL_COLORS[x.ev.color]};display:inline-block"></i>`).join('');
    grid+=`<div onclick="kalSelectDay('${key}')" title="${kalEsc(hol)}" style="min-height:52px;padding:5px 2px;border-radius:10px;text-align:center;cursor:pointer;font-size:13px;border:1.5px solid ${sel?'var(--accent)':'transparent'};background:${isToday?'var(--accent)':sel?'var(--active-bg)':'transparent'};color:${isToday?'#fff':hol||wd===6?'#ff3b30':'var(--text)'};font-weight:${isToday||hol?'700':'500'}">${d}<div style="display:flex;gap:2px;justify-content:center;margin-top:3px;min-height:6px">${dots}</div>${hol?`<div style="font-size:8px;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.85">${kalEsc(hol.split(' ')[0])}</div>`:''}</div>`;
  }
  const evs=kalOn(kalSel),hol=kalHoliday(kalSel);
  const up=kalUpcoming(today,7).slice(0,6);
  root.innerHTML=`
    <div class="lrn-card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button class="lrn-btn ghost" onclick="kalPrev()">‹</button><div style="flex:1;text-align:center;font-size:17px;font-weight:800">${KAL_MONTHS[month]} ${year}</div><button class="lrn-btn ghost" onclick="kalNext()">›</button><button class="lrn-btn ghost" onclick="kalToday()">Heute</button></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">${grid}</div></div>
    <div class="lrn-card" style="margin-bottom:14px">
      <div style="font-size:15px;font-weight:800">${kalDayLabel(kalSel,today)} <span style="font-size:12px;color:var(--text-3);font-weight:500">${kalSel.split('-').reverse().join('.')}</span></div>
      ${hol?`<div style="font-size:12px;color:#ff3b30;font-weight:700;margin-top:2px">🎌 ${kalEsc(hol)}</div>`:''}
      <div style="margin-top:10px">${evs.length?evs.map(x=>kalRenderEvent(x)).join(''):'<div style="font-size:13px;color:var(--text-3);padding:6px 0">Keine Termine an diesem Tag.</div>'}</div>
      <div style="border-top:0.5px solid var(--divider);margin-top:10px;padding-top:12px">
        <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="kal-t" class="lrn-input" placeholder="Neuer Termin …" style="flex:1;min-width:160px" onkeydown="if(event.key==='Enter')kalAddEvent()"><input id="kal-time" type="time" class="lrn-input" title="Uhrzeit (optional)"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><select id="kal-color" class="lrn-input">${Object.keys(KAL_COLORS).map(c=>`<option value="${c}">${{blue:'🔵 Blau',red:'🔴 Rot',green:'🟢 Grün',orange:'🟠 Orange',purple:'🟣 Lila',pink:'🩷 Pink'}[c]}</option>`).join('')}</select>
          <select id="kal-rep" class="lrn-input">${Object.keys(KAL_REP).map(r=>`<option value="${r}">${KAL_REP[r]}</option>`).join('')}</select><button class="lrn-btn" onclick="kalAddEvent()">＋ Termin</button></div></div></div>
    <div class="lrn-card"><div class="lrn-label">Als Nächstes (7 Tage)</div>
      ${up.length?up.map(u=>`<div class="lrn-row" onclick="kalSelectDay('${u.key}')" style="cursor:pointer"><i style="width:8px;height:8px;border-radius:50%;background:${KAL_COLORS[u.ev.color]};flex:none"></i><b style="min-width:84px;font-weight:600">${kalDayLabel(u.key,today)}</b><span style="margin:0;flex:1">${u.ev.time?u.ev.time+' · ':''}${kalEsc(u.ev.t)}</span></div>`).join(''):'<div style="font-size:13px;color:var(--text-3)">Nichts geplant.</div>'}</div>`;
}
function kalRenderEvent(x){
  const ev=x.ev,start=x.start,id=start+'|'+ev.id;
  if(kalEditId===id){
    return `<div style="background:var(--bg);border-radius:12px;padding:10px;margin-bottom:8px"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><input id="kal-e-t" class="lrn-input" value="${kalEsc(ev.t)}" style="flex:1;min-width:140px"><input id="kal-e-time" type="time" class="lrn-input" value="${ev.time}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="kal-e-color" class="lrn-input">${Object.keys(KAL_COLORS).map(c=>`<option value="${c}" ${ev.color===c?'selected':''}>${c}</option>`).join('')}</select><select id="kal-e-rep" class="lrn-input">${Object.keys(KAL_REP).map(r=>`<option value="${r}" ${ev.rep===r?'selected':''}>${KAL_REP[r]}</option>`).join('')}</select></div>
      <textarea id="kal-e-note" class="lrn-input" rows="2" placeholder="Notiz" style="width:100%;resize:vertical">${kalEsc(ev.note)}</textarea>
      <div class="lrn-two"><button class="lrn-btn ghost" onclick="kalEdit(null)">Abbrechen</button><button class="lrn-btn" onclick="kalSaveEdit('${start}','${ev.id}')">Speichern</button></div></div>`;
  }
  return `<div style="display:flex;align-items:center;gap:10px;padding:9px 10px;background:var(--bg);border-left:4px solid ${KAL_COLORS[ev.color]};border-radius:10px;margin-bottom:6px">
    <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${ev.time?`<span style="color:var(--text-3);font-family:var(--mono);margin-right:6px">${ev.time}</span>`:''}${kalEsc(ev.t)}</div>
      <div style="font-size:11px;color:var(--text-3)">${ev.rep!=='none'?'🔁 '+KAL_REP[ev.rep]:''}${ev.rep!=='none'&&ev.note?' · ':''}${kalEsc(ev.note)}</div></div>
    <button class="lrn-btn ghost" onclick="kalEdit('${start}','${ev.id}')" title="Bearbeiten">✏️</button><button class="lrn-btn ghost" onclick="kalDelete('${start}','${ev.id}')" title="Löschen">🗑</button></div>`;
}
