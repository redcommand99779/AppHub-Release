/* ══════════════════════════════════
   UPDATER-UI: Update-Hinweis, „Neu in dieser Version“ und Sicherungen zurückspielen.
   - Vergleicht die lokale version.txt mit der im Release-Repo und bietet „Jetzt aktualisieren“ an
     (der lokale Server führt dann den Updater aus: POST /api/update).
   - Zeigt nach einem Update ein Fenster mit den Neuerungen aus changelog.json.
   - Listet die täglichen Sicherungen des Servers (/api/backups) und spielt eine davon zurück.
   Ohne AppHub-Server (file://) oder in einem Git-Entwicklungsordner (keine version.txt) passiert nichts.
══════════════════════════════════ */
const ZF_RELEASE_REPO='redcommand99779/AppHub-Release';
const zfUpdate={local:'',remote:'',busy:false};

function zfHttp(){return location.protocol==='http:'||location.protocol==='https:';}
function zfEsc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
async function zfFetchText(url,opts){
  const r=await fetch(url,Object.assign({cache:'no-store'},opts||{}));
  if(!r.ok)throw new Error('HTTP '+r.status);
  return (await r.text()).trim();
}
async function zfLocalVersion(){
  try{zfUpdate.local=await zfFetchText('version.txt');}catch(e){zfUpdate.local='';}
  return zfUpdate.local;
}
async function zfRemoteVersion(){
  try{zfUpdate.remote=await zfFetchText(`https://raw.githubusercontent.com/${ZF_RELEASE_REPO}/main/version.txt?t=${Date.now()}`);}catch(e){zfUpdate.remote='';}
  return zfUpdate.remote;
}
/* "20260924-104652-34fb624" -> "24.09.2026 10:46" */
function zfVersionLabel(v){
  const m=/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(v||'');
  return m?`${m[3]}.${m[2]}.${m[1]} ${m[4]}:${m[5]}`:(v||'unbekannt');
}

/* ── Update-Hinweis ── */
function zfUpdateBanner(show){
  let el=document.getElementById('zf-update-banner');
  if(!show){if(el)el.remove();return;}
  if(!el){
    el=document.createElement('div');el.id='zf-update-banner';
    el.style.cssText='position:fixed;right:16px;bottom:16px;z-index:2400;max-width:340px;background:var(--window);border:0.5px solid var(--divider);border-left:4px solid var(--accent);border-radius:14px;padding:12px 14px;box-shadow:0 10px 32px rgba(0,0,0,0.3);color:var(--text);animation:hilfePop .25s ease-out';
    document.body.appendChild(el);
  }
  el.innerHTML=`<div style="font-size:13px;font-weight:800;margin-bottom:2px">🚀 Neue Version verfügbar</div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">Stand ${zfEsc(zfVersionLabel(zfUpdate.remote))} · du hast ${zfEsc(zfVersionLabel(zfUpdate.local))}</div>
    <div style="display:flex;gap:8px"><button onclick="zfUpdateNow()" class="btn-generate" style="width:auto;padding:8px 14px;font-size:12px">Jetzt aktualisieren</button>
    <button onclick="zfUpdateLater()" class="timer-btn" style="padding:8px 12px;font-size:12px">Später</button></div>`;
}
function zfUpdateLater(){try{sessionStorage.setItem('zf_upd_later',zfUpdate.remote);}catch(e){}zfUpdateBanner(false);}
async function zfUpdateCheck(manual){
  if(!zfHttp())return;
  const lv=await zfLocalVersion();
  if(!lv){ // Entwicklungsordner oder Server ohne version.txt: kein Update-Hinweis
    if(manual&&typeof showToast==='function')showToast('Dieser Ordner wird über Git aktualisiert – kein Update-Hinweis nötig',3500);
    zfUpdateStatus();return;
  }
  const rv=await zfRemoteVersion();
  zfUpdateStatus();
  if(!rv){if(manual&&typeof showToast==='function')showToast('Update-Server nicht erreichbar – Internet prüfen',3000);return;}
  if(rv!==lv){
    let later='';try{later=sessionStorage.getItem('zf_upd_later')||'';}catch(e){}
    if(manual||later!==rv)zfUpdateBanner(true);
  }else{
    zfUpdateBanner(false);
    if(manual&&typeof showToast==='function')showToast('✅ Du hast die neueste Version',2500);
  }
}
async function zfUpdateNow(){
  if(zfUpdate.busy)return;zfUpdate.busy=true;
  const el=document.getElementById('zf-update-banner');
  if(el)el.innerHTML='<div style="font-size:13px;font-weight:700">⏳ Aktualisiere …</div><div style="font-size:11px;color:var(--text-3);margin-top:2px">Einen Moment, die App lädt danach neu.</div>';
  try{
    const before=zfUpdate.local;
    const v=await zfFetchText('api/update',{method:'POST'});
    if(v&&v!==before){location.reload();return;}
    if(typeof showToast==='function')showToast('Kein neues Update gefunden – App einmal neu starten',3500);
  }catch(e){
    if(typeof showToast==='function')showToast('Automatisches Update nicht möglich – bitte die App neu starten (Verknüpfung)',4500);
  }
  zfUpdate.busy=false;zfUpdateBanner(false);
}
function zfUpdateStatus(){
  const el=document.getElementById('upd-status');if(!el)return;
  if(!zfUpdate.local){el.innerHTML=zfHttp()?'Diese Installation wird über <b>Git</b> aktualisiert.':'Updates sind nur über den AppHub-Start (Verknüpfung) verfügbar.';return;}
  el.innerHTML=`Version: <b>${zfEsc(zfVersionLabel(zfUpdate.local))}</b>`+(zfUpdate.remote&&zfUpdate.remote!==zfUpdate.local?` · <span style="color:var(--accent);font-weight:700">Neu: ${zfEsc(zfVersionLabel(zfUpdate.remote))}</span>`:'');
}

/* ── „Neu in dieser Version“ ── */
async function zfLoadChangelog(){
  try{const j=JSON.parse(await zfFetchText('changelog.json'));return Array.isArray(j)?j.slice().sort((a,b)=>b.id-a.id):[];}catch(e){return[];}
}
function zfWhatsNewOpen(entries){
  let ov=document.getElementById('zf-whatsnew');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='zf-whatsnew';
  ov.style.cssText='position:fixed;inset:0;z-index:2600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px)';
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  ov.innerHTML=`<div style="background:var(--window);border-radius:20px;max-width:520px;width:100%;max-height:86vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.4);color:var(--text);animation:hilfePop .2s ease-out">
    <div style="padding:20px 22px;background:linear-gradient(120deg,var(--accent),#7c4dff);color:#fff;border-radius:20px 20px 0 0;display:flex;align-items:center;gap:12px">
      <div style="font-size:34px;line-height:1">🎉</div><div><div style="font-size:19px;font-weight:800;line-height:1.15">Neu in AppHub</div><div style="font-size:12px;opacity:0.92">Das hat sich geändert</div></div></div>
    <div style="padding:16px 22px 6px">${entries.map(e=>`<div style="margin-bottom:14px"><div style="font-size:13px;font-weight:800;margin-bottom:4px">${zfEsc(e.title||'Update')} <span style="font-weight:400;font-size:11px;color:var(--text-3)">${zfEsc(e.date||'')}</span></div>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.55;color:var(--text-2)">${(e.items||[]).map(i=>`<li>${zfEsc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div style="padding:6px 22px 20px"><button class="btn-generate" onclick="document.getElementById('zf-whatsnew').remove()" style="width:100%;padding:12px">Los geht's</button></div></div>`;
  document.body.appendChild(ov);
}
async function zfWhatsNewAuto(){
  if(!zfHttp())return;
  const list=await zfLoadChangelog();if(!list.length)return;
  const max=list[0].id;let seen=null;
  try{const v=localStorage.getItem('zf_seen_changelog');if(v!==null)seen=parseInt(v,10);}catch(e){}
  const fresh=seen===null?list.slice(0,1):list.filter(e=>e.id>seen).slice(0,3);
  try{localStorage.setItem('zf_seen_changelog',String(max));}catch(e){}
  if(fresh.length)zfWhatsNewOpen(fresh);
}
async function zfWhatsNewShow(){
  const list=await zfLoadChangelog();
  if(!list.length){if(typeof showToast==='function')showToast('Keine Neuigkeiten gefunden',2500);return;}
  zfWhatsNewOpen(list.slice(0,5));
}

/* ── Sicherungen (tägliche Kopien des Servers) ── */
async function zfBackupsShow(){
  const box=document.getElementById('bk-list');if(!box)return;
  box.innerHTML='<div style="font-size:12px;color:var(--text-3)">Lade …</div>';
  try{
    const list=JSON.parse(await zfFetchText('api/backups'));
    if(!list.length){box.innerHTML='<div style="font-size:12px;color:var(--text-3)">Noch keine Sicherungen – sie entstehen automatisch einmal pro Tag.</div>';return;}
    box.innerHTML=list.map(b=>{
      const m=/appdata-(\d{4})-(\d{2})-(\d{2})/.exec(b.name),lab=m?`${m[3]}.${m[2]}.${m[1]}`:b.name;
      return`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--bg);border:0.5px solid var(--divider);margin-bottom:6px">
        <span style="font-size:18px">🗄️</span><span style="flex:1;font-size:13px"><b>${zfEsc(lab)}</b> <span style="font-size:11px;color:var(--text-3)">${Math.max(1,Math.round(b.size/1024))} KB</span></span>
        <button class="set-btn" onclick="zfBackupRestore('${zfEsc(b.name)}','${zfEsc(lab)}')">↩ Zurückspielen</button></div>`;
    }).join('');
  }catch(e){box.innerHTML='<div style="font-size:12px;color:var(--text-3)">Sicherungen sind nur mit dem AppHub-Server verfügbar (Verknüpfung „AppHub“).</div>';}
}
function zfBackupRestore(name,label){
  const run=async()=>{
    try{
      const text=await zfFetchText('api/backup/'+encodeURIComponent(name));
      if(typeof zfSync==='undefined'||!zfSync.importText)throw new Error('kein Import');
      await zfSync.importText(text); // ersetzt den Stand und lädt neu
    }catch(e){if(typeof showToast==='function')showToast('Zurückspielen fehlgeschlagen: '+(e.message||e),4000);}
  };
  const msg=`Sicherung vom ${label} zurückspielen? Der aktuelle Stand wird dadurch ersetzt (Tipp: vorher „Sicherung herunterladen“).`;
  if(typeof appConfirm==='function')appConfirm(msg,run);else if(confirm(msg))run();
}

/* ── Start ── */
document.addEventListener('DOMContentLoaded',()=>{
  if(!zfHttp())return;
  setTimeout(()=>{zfUpdateCheck(false);zfWhatsNewAuto();},4000);
  setInterval(()=>zfUpdateCheck(false),20*60*1000);
  zfLocalVersion().then(zfUpdateStatus);
});
