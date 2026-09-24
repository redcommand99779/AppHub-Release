/* ── Zeitzonen ── */
const TZ_LIST=['Europe/Berlin','America/New_York','America/Los_Angeles','Asia/Tokyo','Asia/Shanghai','Asia/Dubai','Europe/London','Australia/Sydney','America/Sao_Paulo','Pacific/Auckland'];
let tzZones=[];let tzInterval=null;
function tzInit(){
  tzZones=JSON.parse(localStorage.getItem('zf_timezones')||'["Europe/Berlin","America/New_York","Asia/Tokyo"]');
  const sel=document.getElementById('tz-select');
  if(sel)sel.innerHTML=TZ_LIST.map(tz=>`<option value="${tz}">${tz.replace('_',' ')}</option>`).join('');
  clearInterval(tzInterval);tzInterval=setInterval(tzRender,1000);tzRender();
}
function tzAdd(){const sel=document.getElementById('tz-select');if(!sel)return;const tz=sel.value;if(!tzZones.includes(tz))tzZones.push(tz);localStorage.setItem('zf_timezones',JSON.stringify(tzZones));tzRender();}
function tzRemove(tz){tzZones=tzZones.filter(z=>z!==tz);localStorage.setItem('zf_timezones',JSON.stringify(tzZones));tzRender();}
function tzRender(){
  const list=document.getElementById('tz-list');if(!list)return;
  const now=new Date();
  list.innerHTML=tzZones.map(tz=>{
    const opts={timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false};
    const time=now.toLocaleTimeString('de-DE',opts);
    const offset=now.toLocaleString('en-US',{timeZone:tz,timeZoneName:'short'}).split(' ').pop();
    const dateStr=now.toLocaleDateString('de-DE',{timeZone:tz,weekday:'short',day:'numeric',month:'short'});
    const city=tz.split('/')[1]?.replace('_',' ')||tz;
    const country=tz.split('/')[0];
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;margin-bottom:6px">
      <div><div style="font-size:14px;font-weight:600;color:var(--text)">${city} <span style="font-size:11px;color:var(--text-3)">${offset}</span></div><div style="font-size:11px;color:var(--text-3)">${dateStr}</div></div>
      <div style="display:flex;align-items:center;gap:10px"><div style="font-family:var(--mono);font-size:24px;font-weight:600;color:var(--text)">${time}</div>
      <button onclick="tzRemove('${tz}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:18px;padding:0">×</button></div>
    </div>`;
  }).join('');
}
