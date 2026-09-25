/* ══════════════════════════════════
   PASSWORT-MANAGER – verschlüsselter Tresor
   Alle Einträge liegen als EIN verschlüsselter Block in zf_pwm_vault (AES-256-GCM, Schlüssel per PBKDF2-SHA-256
   aus dem Master-Passwort, zufälliges Salz und IV). Das Master-Passwort und der Schlüssel werden nie gespeichert;
   ohne das Master-Passwort sind die Daten unlesbar (auch in appdata.json und den Sicherungen).
   Alte Klartext-Einträge (zf_pwm_data / zf_pwm_hash) werden beim Einrichten verschlüsselt übernommen und gelöscht.
══════════════════════════════════ */
const PWM_KEY='zf_pwm_vault',PWM_ITER=250000,PWM_LOCK_MS=3*60*1000,PWM_CLIP_MS=30*1000,PWM_MIN_LEN=8;
let pwm={key:null,salt:null,iter:PWM_ITER,entries:[],mode:'lock',edit:null,query:'',msg:'',msgBad:false,shown:{},busy:false,tries:0,wait:0};
let pwmLockTimer=null,pwmClipTimer=null;

function pwmEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const pwmTE=typeof TextEncoder!=='undefined'?new TextEncoder():null,pwmTD=typeof TextDecoder!=='undefined'?new TextDecoder():null;
function pwmB64(buf){const b=new Uint8Array(buf);let s='';for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s);}
function pwmUnB64(s){const bin=atob(s),b=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);return b;}

/* ── Verschlüsselung (ohne Oberfläche, testbar) ── */
async function pwmDerive(password,salt,iter){
  const km=await crypto.subtle.importKey('raw',pwmTE.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function pwmSeal(key,salt,iter,entries){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pwmTE.encode(JSON.stringify(entries)));
  return {v:2,iter,salt:pwmB64(salt),iv:pwmB64(iv),data:pwmB64(ct)};
}
async function pwmCreateVault(password,entries,iter){
  iter=iter||PWM_ITER;const salt=crypto.getRandomValues(new Uint8Array(16)),key=await pwmDerive(password,salt,iter);
  return {vault:await pwmSeal(key,salt,iter,entries||[]),key,salt};
}
/* Falsches Passwort -> Fehler (die GCM-Prüfsumme schlägt fehl) */
async function pwmOpenVault(vault,password){
  const salt=pwmUnB64(vault.salt),key=await pwmDerive(password,salt,vault.iter||PWM_ITER);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:pwmUnB64(vault.iv)},key,pwmUnB64(vault.data));
  const entries=JSON.parse(pwmTD.decode(pt));
  if(!Array.isArray(entries))throw new Error('format');
  return {key,salt,iter:vault.iter||PWM_ITER,entries};
}
function pwmStoredVault(){try{const v=JSON.parse(localStorage.getItem(PWM_KEY)||'null');return v&&v.v===2&&v.data&&v.salt&&v.iv?v:null;}catch(e){return null;}}
function pwmLegacyEntries(){
  try{const a=JSON.parse(localStorage.getItem('zf_pwm_data')||'[]');return Array.isArray(a)?a.filter(e=>e&&e.name&&e.pass).map(e=>({id:e.id||Date.now()+Math.random(),name:String(e.name),user:String(e.user||''),pass:String(e.pass),url:'',note:''})):[];}catch(e){return[];}
}
async function pwmSave(){
  const v=await pwmSeal(pwm.key,pwm.salt,pwm.iter,pwm.entries);
  try{localStorage.setItem(PWM_KEY,JSON.stringify(v));}catch(e){}
}
/* Passwort-Stärke 0–4 und Zufallspasswort */
function pwmStrength(p){
  p=String(p||'');if(!p)return 0;
  let s=0;if(p.length>=8)s++;if(p.length>=12)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p)&&/[^A-Za-z0-9]/.test(p))s++;
  if(/^(.)\1+$/.test(p)||/^(1234|password|passwort|qwert|abcd)/i.test(p))s=Math.min(s,1);
  return Math.min(4,s);
}
function pwmGenerate(len,opts){
  opts=Object.assign({lower:true,upper:true,digits:true,symbols:true},opts||{});len=Math.max(6,Math.min(64,len|0||16));
  const sets=[];if(opts.lower)sets.push('abcdefghijkmnopqrstuvwxyz');if(opts.upper)sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');if(opts.digits)sets.push('23456789');if(opts.symbols)sets.push('!@#$%&*?-_+=');
  if(!sets.length)sets.push('abcdefghijkmnopqrstuvwxyz');
  const rnd=n=>{const a=new Uint32Array(1),lim=Math.floor(4294967296/n)*n;let x;do{crypto.getRandomValues(a);x=a[0];}while(x>=lim);return x%n;};
  const all=sets.join(''),out=sets.map(s=>s[rnd(s.length)]);
  while(out.length<len)out.push(all[rnd(all.length)]);
  for(let i=out.length-1;i>0;i--){const j=rnd(i+1);[out[i],out[j]]=[out[j],out[i]];}   // mischen
  return out.join('');
}

/* ── Oberfläche ── */
function pwmRoot(){return document.getElementById('pwm-root');}
function pwmInit(){
  pwmClear();pwm.msg='';pwm.tries=0;
  if(typeof crypto==='undefined'||!crypto.subtle){pwm.mode='nocrypto';}
  else pwm.mode=pwmStoredVault()?'lock':'setup';
  pwmRender();
}
function pwmClear(){pwm.key=null;pwm.salt=null;pwm.entries=[];pwm.edit=null;pwm.query='';pwm.shown={};clearTimeout(pwmLockTimer);pwmLockTimer=null;}
function pwmLockOnLeave(id){if(id!=='pwmanager'&&pwm.key)pwmClear();}
function pwmLock(){pwmClear();pwm.mode=pwmStoredVault()?'lock':'setup';pwm.msg='';pwmRender();}
function pwmTouch(){
  clearTimeout(pwmLockTimer);
  if(pwm.key)pwmLockTimer=setTimeout(()=>{if(pwm.key){pwmLock();pwm.msg='🔒 Automatisch gesperrt (3 Minuten ohne Aktivität).';pwmRender();}},PWM_LOCK_MS);
}
function pwmMsg(t,bad){pwm.msg=t;pwm.msgBad=!!bad;}
function pwmRender(){
  const root=pwmRoot();if(!root)return;
  const m=pwm.msg?`<div class="lrn-msg" style="${pwm.msgBad?'background:rgba(255,59,48,0.12);color:#d93025':''}">${pwmEsc(pwm.msg)}</div>`:'';
  let body='';
  if(pwm.mode==='nocrypto')body=`<div class="lrn-card" style="text-align:center;padding:30px"><div style="font-size:40px">⚠️</div><div style="font-weight:800;margin:8px 0">Verschlüsselung nicht verfügbar</div><div style="font-size:13px;color:var(--text-3)">Dein Browser stellt hier keine sichere Verschlüsselung bereit. Öffne AppHub über die Verknüpfung „AppHub“ (localhost) oder in einem aktuellen Chrome, Edge oder Safari.</div></div>`;
  else if(pwm.mode==='setup')body=pwmRenderSetup();
  else if(pwm.mode==='lock')body=pwmRenderLock();
  else if(pwm.mode==='edit')body=pwmRenderEdit();
  else if(pwm.mode==='settings')body=pwmRenderSettings();
  else body=pwmRenderList();
  root.innerHTML=m+body;
  const f=root.querySelector('[data-autofocus]');if(f)f.focus();
}
function pwmMeter(p){const s=pwmStrength(p),cols=['#d0d0d5','#ff3b30','#ff9500','#34c759','#00a86b'],lab=['','Schwach','Mäßig','Gut','Sehr stark'];
  return `<div style="display:flex;align-items:center;gap:8px;margin-top:6px"><div style="flex:1;height:6px;background:var(--divider);border-radius:3px;overflow:hidden"><div style="height:100%;width:${s*25}%;background:${cols[s]};transition:width .2s"></div></div><span style="font-size:11px;color:var(--text-3);width:70px">${lab[s]}</span></div>`;}
function pwmOnPw(id,mid){const v=document.getElementById(id).value,e=document.getElementById(mid);if(e)e.innerHTML=pwmMeter(v);}
function pwmRenderSetup(){
  const legacy=pwmLegacyEntries().length;
  return `<div class="lrn-card" style="text-align:center;padding:26px 20px">
    <div style="font-size:44px">🔐</div><div style="font-size:20px;font-weight:800;margin:6px 0 4px">Tresor einrichten</div>
    <div style="font-size:13px;color:var(--text-3);margin-bottom:16px;line-height:1.5">${legacy?`Es wurden <b>${legacy} alte Einträge</b> gefunden (bisher unverschlüsselt). Sie werden mit deinem neuen Master-Passwort verschlüsselt übernommen.<br>`:''}Wähle ein Master-Passwort (mindestens ${PWM_MIN_LEN} Zeichen). <b>Es kann nicht wiederhergestellt werden</b> – vergisst du es, sind die Einträge weg.</div>
    <div style="max-width:340px;margin:0 auto;text-align:left">
      <input type="password" id="pwm-new1" class="lrn-input" data-autofocus placeholder="Master-Passwort" autocomplete="new-password" style="width:100%" oninput="pwmOnPw('pwm-new1','pwm-meter')">
      <div id="pwm-meter">${pwmMeter('')}</div>
      <input type="password" id="pwm-new2" class="lrn-input" placeholder="Master-Passwort wiederholen" autocomplete="new-password" style="width:100%;margin-top:10px" onkeydown="if(event.key==='Enter')pwmSetup()">
      <button class="lrn-btn" style="width:100%;margin-top:14px" ${pwm.busy?'disabled':''} onclick="pwmSetup()">${pwm.busy?'Verschlüssele …':'🔒 Tresor anlegen'}</button>
    </div></div>`;
}
async function pwmSetup(){
  if(pwm.busy)return;
  const a=document.getElementById('pwm-new1').value,b=document.getElementById('pwm-new2').value;
  if(a.length<PWM_MIN_LEN){pwmMsg(`Das Master-Passwort braucht mindestens ${PWM_MIN_LEN} Zeichen.`,true);pwmRender();return;}
  if(a!==b){pwmMsg('Die beiden Eingaben stimmen nicht überein.',true);pwmRender();return;}
  pwm.busy=true;pwmRender();
  try{
    const legacy=pwmLegacyEntries(),r=await pwmCreateVault(a,legacy);
    localStorage.setItem(PWM_KEY,JSON.stringify(r.vault));
    pwm.key=r.key;pwm.salt=r.salt;pwm.iter=r.vault.iter;pwm.entries=legacy;
    try{localStorage.removeItem('zf_pwm_data');localStorage.removeItem('zf_pwm_hash');}catch(e){}   // Klartext-Reste entfernen
    pwm.mode='list';pwmMsg(legacy.length?`✅ ${legacy.length} alte Einträge verschlüsselt übernommen. Die unverschlüsselten Kopien wurden gelöscht.`:'✅ Tresor angelegt.');
  }catch(e){pwmMsg('Einrichten fehlgeschlagen: '+(e.message||e),true);}
  pwm.busy=false;pwmTouch();pwmRender();
}
function pwmRenderLock(){
  const wait=pwm.wait>Date.now()?Math.ceil((pwm.wait-Date.now())/1000):0;
  return `<div class="lrn-card" style="text-align:center;padding:30px 20px">
    <div style="font-size:48px">🔒</div><div style="font-size:18px;font-weight:800;margin:6px 0 14px">Tresor gesperrt</div>
    <div style="max-width:320px;margin:0 auto">
      <input type="password" id="pwm-pw" class="lrn-input" data-autofocus placeholder="Master-Passwort" autocomplete="current-password" style="width:100%;font-size:16px;text-align:center" onkeydown="if(event.key==='Enter')pwmUnlock()">
      <button class="lrn-btn" style="width:100%;margin-top:12px" ${pwm.busy||wait?'disabled':''} onclick="pwmUnlock()">${pwm.busy?'Prüfe …':wait?'Bitte '+wait+' s warten':'Entsperren'}</button>
      <div style="margin-top:14px"><button class="lrn-btn ghost" onclick="pwmReset()">Passwort vergessen? Tresor zurücksetzen</button></div>
    </div></div>`;
}
async function pwmUnlock(){
  if(pwm.busy||pwm.wait>Date.now())return;
  const pw=document.getElementById('pwm-pw').value,vault=pwmStoredVault();
  if(!pw||!vault)return;
  pwm.busy=true;pwmRender();
  try{
    const r=await pwmOpenVault(vault,pw);
    pwm.key=r.key;pwm.salt=r.salt;pwm.iter=r.iter;pwm.entries=r.entries;pwm.mode='list';pwm.tries=0;pwm.msg='';
  }catch(e){
    pwm.tries++;pwm.wait=Date.now()+Math.min(30,pwm.tries*2)*1000;pwmMsg('Falsches Master-Passwort.',true);
    setTimeout(pwmRender,Math.min(30,pwm.tries*2)*1000+50);
  }
  pwm.busy=false;pwmTouch();pwmRender();
}
function pwmReset(){
  const go=()=>{try{localStorage.removeItem(PWM_KEY);localStorage.removeItem('zf_pwm_data');localStorage.removeItem('zf_pwm_hash');}catch(e){}pwmClear();pwm.mode='setup';pwmMsg('Tresor gelöscht. Lege einen neuen an.');pwmRender();};
  const msg='Der Tresor mit ALLEN gespeicherten Passwörtern wird unwiderruflich gelöscht. Wirklich?';
  if(typeof appConfirm==='function')appConfirm(msg,go);else if(confirm(msg))go();
}

/* Liste */
function pwmRenderList(){
  const q=pwmQ(pwm.query),list=pwm.entries.filter(e=>!q||pwmQ(e.name).includes(q)||pwmQ(e.user).includes(q)||pwmQ(e.url).includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'de'));
  return `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <input class="lrn-input" placeholder="🔍 Suchen …" value="${pwmEsc(pwm.query)}" oninput="pwmSearch(this.value)" style="flex:1;min-width:140px">
      <button class="lrn-btn" onclick="pwmEdit(null)">＋ Neu</button>
      <button class="lrn-btn ghost" onclick="pwmSetMode('settings')" title="Einstellungen">⚙️</button>
      <button class="lrn-btn ghost" onclick="pwmLock()">🔒 Sperren</button></div>
    ${list.length?list.map(e=>{const shown=!!pwm.shown[e.id];return `<div class="lrn-card" style="margin-bottom:8px;padding:12px 14px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="width:36px;height:36px;border-radius:10px;background:var(--active-bg);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:800;flex:none">${pwmEsc((e.name[0]||'?').toUpperCase())}</div>
        <div style="flex:1;min-width:130px"><div style="font-size:14px;font-weight:700">${pwmEsc(e.name)}</div><div style="font-size:12px;color:var(--text-3)">${pwmEsc(e.user)}${e.url?' · '+pwmEsc(e.url):''}</div>
          <div style="font-family:var(--mono);font-size:13px;margin-top:2px;color:var(--text-2)">${shown?pwmEsc(e.pass):'••••••••••'}</div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="lrn-btn ghost" onclick="pwmToggle('${e.id}')" title="Anzeigen">${shown?'🙈':'👁'}</button>
          <button class="lrn-btn ghost" onclick="pwmCopy('${e.id}','pass')" title="Passwort kopieren">📋 Passwort</button>
          ${e.user?`<button class="lrn-btn ghost" onclick="pwmCopy('${e.id}','user')" title="Benutzername kopieren">👤</button>`:''}
          <button class="lrn-btn ghost" onclick="pwmEdit('${e.id}')" title="Bearbeiten">✏️</button>
          <button class="lrn-btn ghost" onclick="pwmDelete('${e.id}')" title="Löschen">🗑</button></div></div>
      ${e.note?`<div style="font-size:12px;color:var(--text-3);margin-top:8px;white-space:pre-wrap">${pwmEsc(e.note)}</div>`:''}</div>`;}).join('')
    :`<div style="text-align:center;color:var(--text-3);padding:30px;font-size:13px">${pwm.entries.length?'Keine Treffer.':'Noch keine Einträge – lege mit „＋ Neu“ deinen ersten an.'}</div>`}
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px">🔐 Verschlüsselt (AES-256) · sperrt sich nach 3 Minuten Inaktivität · Zwischenablage wird nach 30 s geleert</div>`;
}
function pwmQ(s){return String(s||'').toLowerCase();}
function pwmSearch(v){pwm.query=v||'';pwmTouch();pwmRender();const e=document.querySelector('#pwm-root input[placeholder^="🔍"]');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}
function pwmSetMode(m){pwm.mode=m;pwm.msg='';pwmTouch();pwmRender();}
function pwmToggle(id){pwm.shown[id]=!pwm.shown[id];pwmTouch();pwmRender();}
function pwmCopy(id,field){
  const e=pwm.entries.find(x=>String(x.id)===String(id));if(!e)return;
  const text=e[field]||'';
  const done=()=>{pwmMsg(field==='pass'?'📋 Passwort kopiert – wird in 30 Sekunden aus der Zwischenablage gelöscht.':'📋 Benutzername kopiert.');pwmRender();
    if(field==='pass'){clearTimeout(pwmClipTimer);pwmClipTimer=setTimeout(()=>{try{navigator.clipboard.writeText('');}catch(_){}},PWM_CLIP_MS);}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,()=>{pwmMsg('Kopieren nicht erlaubt – bitte Anzeigen (👁) nutzen.',true);pwmRender();});
  else{pwmMsg('Kopieren nicht verfügbar – bitte Anzeigen (👁) nutzen.',true);pwmRender();}
  pwmTouch();
}
function pwmDelete(id){
  const e=pwm.entries.find(x=>String(x.id)===String(id));if(!e)return;
  const go=async()=>{pwm.entries=pwm.entries.filter(x=>String(x.id)!==String(id));await pwmSave();pwmMsg('Eintrag gelöscht.');pwmRender();};
  if(typeof appConfirm==='function')appConfirm(`Eintrag „${e.name}“ löschen?`,go);else if(confirm(`Eintrag „${e.name}“ löschen?`))go();
}

/* Eintrag anlegen / bearbeiten */
let pwmGen={len:16,lower:true,upper:true,digits:true,symbols:true};
function pwmEdit(id){pwm.edit=id?String(id):null;pwm.mode='edit';pwm.msg='';pwmTouch();pwmRender();}
function pwmRenderEdit(){
  const e=pwm.entries.find(x=>String(x.id)===pwm.edit)||{name:'',user:'',pass:'',url:'',note:''};
  const opt=(k,l)=>`<label style="font-size:12px;display:inline-flex;align-items:center;gap:4px;margin-right:10px"><input type="checkbox" ${pwmGen[k]?'checked':''} onchange="pwmGen.${k}=this.checked"> ${l}</label>`;
  return `<div class="lrn-card">
    <div style="font-size:16px;font-weight:800;margin-bottom:12px">${pwm.edit?'Eintrag bearbeiten':'Neuer Eintrag'}</div>
    <div class="lrn-label">Name / Dienst</div><input class="lrn-input" id="pwm-f-name" data-autofocus value="${pwmEsc(e.name)}" placeholder="z. B. Netflix" style="width:100%;margin-bottom:10px">
    <div class="lrn-label">Benutzername / E-Mail</div><input class="lrn-input" id="pwm-f-user" value="${pwmEsc(e.user)}" autocomplete="off" style="width:100%;margin-bottom:10px">
    <div class="lrn-label">Passwort</div>
    <div style="display:flex;gap:8px"><input class="lrn-input" id="pwm-f-pass" type="text" value="${pwmEsc(e.pass)}" autocomplete="off" spellcheck="false" style="flex:1;font-family:var(--mono)" oninput="pwmOnPw('pwm-f-pass','pwm-f-meter')"><button class="lrn-btn ghost" onclick="pwmFillGen()" title="Zufallspasswort">🎲 Erzeugen</button></div>
    <div id="pwm-f-meter">${pwmMeter(e.pass)}</div>
    <div style="margin:8px 0 10px"><span style="font-size:12px;color:var(--text-3);margin-right:8px">Länge <b id="pwm-len">${pwmGen.len}</b></span><input type="range" min="8" max="40" value="${pwmGen.len}" oninput="pwmGen.len=+this.value;document.getElementById('pwm-len').textContent=this.value" style="vertical-align:middle;width:130px;margin-right:12px">${opt('lower','a-z')}${opt('upper','A-Z')}${opt('digits','0-9')}${opt('symbols','!?#')}</div>
    <div class="lrn-label">Webseite (optional)</div><input class="lrn-input" id="pwm-f-url" value="${pwmEsc(e.url)}" style="width:100%;margin-bottom:10px">
    <div class="lrn-label">Notiz (optional)</div><textarea class="lrn-input" id="pwm-f-note" rows="2" style="width:100%;resize:vertical">${pwmEsc(e.note)}</textarea>
    <div class="lrn-two"><button class="lrn-btn ghost" onclick="pwmSetMode('list')">Abbrechen</button><button class="lrn-btn" onclick="pwmSaveEntry()">Speichern</button></div></div>`;
}
function pwmFillGen(){const f=document.getElementById('pwm-f-pass');f.value=pwmGenerate(pwmGen.len,pwmGen);pwmOnPw('pwm-f-pass','pwm-f-meter');}
async function pwmSaveEntry(){
  const v=id=>document.getElementById(id).value;
  const name=v('pwm-f-name').trim(),pass=v('pwm-f-pass');
  if(!name||!pass){pwmMsg('Name und Passwort sind Pflicht.',true);const keep={name,user:v('pwm-f-user'),pass,url:v('pwm-f-url'),note:v('pwm-f-note')};
    pwmRender();['name','user','pass','url','note'].forEach(k=>{const e=document.getElementById('pwm-f-'+k);if(e)e.value=keep[k];});return;}
  const data={name,user:v('pwm-f-user').trim(),pass,url:v('pwm-f-url').trim(),note:v('pwm-f-note').trim()};
  const cur=pwm.entries.find(x=>String(x.id)===pwm.edit);
  if(cur)Object.assign(cur,data);else pwm.entries.push(Object.assign({id:Date.now()+Math.floor(Math.random()*1000)},data));
  await pwmSave();pwm.mode='list';pwmMsg('✅ Gespeichert.');pwmTouch();pwmRender();
}

/* Einstellungen: Master-Passwort ändern */
function pwmRenderSettings(){
  return `<div class="lrn-card"><div style="font-size:16px;font-weight:800;margin-bottom:12px">⚙️ Einstellungen</div>
    <div class="lrn-label">Master-Passwort ändern</div>
    <input type="password" id="pwm-c1" class="lrn-input" placeholder="Neues Master-Passwort" autocomplete="new-password" style="width:100%;margin-bottom:8px" oninput="pwmOnPw('pwm-c1','pwm-c-meter')"><div id="pwm-c-meter">${pwmMeter('')}</div>
    <input type="password" id="pwm-c2" class="lrn-input" placeholder="Wiederholen" autocomplete="new-password" style="width:100%;margin:8px 0">
    <button class="lrn-btn" onclick="pwmChange()">Master-Passwort ändern</button>
    <div class="lrn-label" style="margin-top:18px">Gefahrenzone</div>
    <button class="lrn-btn ghost" style="color:#d93025" onclick="pwmReset()">Tresor komplett löschen</button>
    <div style="margin-top:14px"><button class="lrn-btn ghost" onclick="pwmSetMode('list')">← Zurück</button></div></div>`;
}
async function pwmChange(){
  const a=document.getElementById('pwm-c1').value,b=document.getElementById('pwm-c2').value;
  if(a.length<PWM_MIN_LEN){pwmMsg(`Mindestens ${PWM_MIN_LEN} Zeichen.`,true);pwmRender();return;}
  if(a!==b){pwmMsg('Die Eingaben stimmen nicht überein.',true);pwmRender();return;}
  const r=await pwmCreateVault(a,pwm.entries);
  localStorage.setItem(PWM_KEY,JSON.stringify(r.vault));pwm.key=r.key;pwm.salt=r.salt;pwm.iter=r.vault.iter;
  pwm.mode='list';pwmMsg('✅ Master-Passwort geändert.');pwmTouch();pwmRender();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&pwm.key&&document.getElementById('screen-pwmanager')&&document.getElementById('screen-pwmanager').classList.contains('active')){pwmTouch();}});
