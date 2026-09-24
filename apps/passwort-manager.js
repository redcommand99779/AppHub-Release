
/* ── Passwort-Manager ── */
let pwmUnlocked=false,pwmEntries=[];
function pwmInit(){pwmUnlocked=false;const c=document.getElementById('pwm-content');const l=document.getElementById('pwm-lock');if(c)c.style.display='none';if(l)l.style.display='block';}
function pwmLogin(){
  const pin=document.getElementById('pwm-pin')?.value||'';
  const stored=localStorage.getItem('zf_pwm_hash')||'';
  if(!stored){localStorage.setItem('zf_pwm_hash',btoa(pin));}
  else if(btoa(pin)!==stored){alert('Falscher PIN');return;}
  pwmUnlocked=true;pwmEntries=JSON.parse(localStorage.getItem('zf_pwm_data')||'[]');
  const c=document.getElementById('pwm-content');const l=document.getElementById('pwm-lock');
  if(c)c.style.display='block';if(l)l.style.display='none';pwmRender();
}
function pwmLock(){pwmUnlocked=false;pwmInit();}
function pwmAdd(){
  const name=prompt('Service/Name:');if(!name)return;
  const user=prompt('Benutzername:');
  const pass=prompt('Passwort:');if(!pass)return;
  pwmEntries.push({id:Date.now(),name,user:user||'',pass});
  localStorage.setItem('zf_pwm_data',JSON.stringify(pwmEntries));pwmRender();
}
function pwmDelete(id){pwmEntries=pwmEntries.filter(e=>e.id!==id);localStorage.setItem('zf_pwm_data',JSON.stringify(pwmEntries));pwmRender();}
function pwmRender(){
  const list=document.getElementById('pwm-list');if(!list)return;
  list.innerHTML=pwmEntries.map(e=>`<div style="padding:12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;margin-bottom:6px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:14px;font-weight:600;color:var(--text)">${escHtml(e.name)}</div><div style="font-size:12px;color:var(--text-3)">${escHtml(e.user)}</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <button onclick="navigator.clipboard.writeText('${e.pass}'.replace(/\\\\/g,'\\\\\\\\').replace(/'/g,\"\\\\'\"))" style="padding:5px 10px;background:var(--active-bg);border:0.5px solid var(--active-border);border-radius:6px;font-size:12px;color:var(--accent);cursor:pointer;font-family:var(--font)">📋 Kopieren</button>
        <button onclick="pwmDelete(${e.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;padding:0">×</button>
      </div>
    </div>
  `).join('')||'<div style="text-align:center;color:var(--text-3);padding:20px">Keine Einträge</div>';
}
