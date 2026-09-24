/* ══════════════════════════════════
   DATEI-SPEICHERUNG – spiegelt den kompletten localStorage in "appdata.json" (Ordner der App).
   Läuft nur, wenn die App über server.py geöffnet wurde (http://localhost:8080).
   Muss als ERSTES Skript im <head> stehen: lädt die Datei synchron, bevor die Apps starten.
   Meta-Schlüssel (zf_sync_*) werden nicht in die Datei geschrieben.
══════════════════════════════════ */
(function(){
  'use strict';
  const LS=window.localStorage,proto=Storage.prototype;
  const oSet=proto.setItem,oRem=proto.removeItem,oClear=proto.clear;
  const META=k=>k.indexOf('zf_sync_')===0;
  const S=window.zfSync={enabled:false,mode:'browser',last:0,error:'',pending:false,file:'appdata.json'};
  const api=()=>location.origin+'/api/data';

  function snapshot(){
    const d={};
    for(let i=0;i<LS.length;i++){const k=LS.key(i);if(!META(k))d[k]=LS.getItem(k);}
    return d;
  }
  function localKeys(){const a=[];for(let i=0;i<LS.length;i++){const k=LS.key(i);if(!META(k))a.push(k);}return a;}

  S.exportFile=function(){
    const blob=new Blob([JSON.stringify({v:1,t:Date.now(),data:snapshot()},null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='appdata-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  };

  /* ── Datei-Modus (file://): einmalige Übernahme der alten Browser-Daten in den Server ── */
  if(location.protocol==='file:'){
    S.mode='file';
    if(/[?&]migrate=1/.test(location.search)){
      const target='http://localhost:8080/';
      const done=()=>location.replace(target+'AppHub.html');
      try{
        const snap=snapshot();
        fetch(target+'api/data?migrate=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({v:1,t:Date.now(),data:snap})})
          .then(done,()=>{/* Server nicht erreichbar: im Datei-Modus weiterarbeiten */});
      }catch(e){}
    }
    return;
  }

  /* ── Server-Modus ── */
  let xhr;
  try{
    xhr=new XMLHttpRequest();xhr.open('GET',api(),false);xhr.send();
  }catch(e){return;}
  if(!/^[12]$/.test(xhr.getResponseHeader('X-AppHub')||''))return; // anderer Server (z. B. http-server): nur Browser-Speicher
  S.enabled=true;S.mode='server';

  let fileData=null;
  if(xhr.status===200){try{fileData=JSON.parse(xhr.responseText);}catch(e){fileData=null;}}
  const local=localKeys(),dirty=LS.getItem('zf_sync_dirty')==='1',linked=LS.getItem('zf_sync_linked')==='1';
  if(fileData&&fileData.data){
    if(dirty&&local.length){S.pending=true;} // lokale, noch nicht gespeicherte Änderungen gewinnen
    else{
      const merge=!linked&&local.length; // erstes Verknüpfen: Datei + lokale Zusatz-Schlüssel
      if(!merge)local.forEach(k=>oRem.call(LS,k));
      Object.keys(fileData.data).forEach(k=>{try{oSet.call(LS,k,fileData.data[k]);}catch(e){}});
      if(merge)S.pending=true;
    }
    S.last=fileData.t||Date.now();
  }else if(local.length){S.pending=true;} // Datei fehlt: bisherige Browser-Daten hochladen
  oSet.call(LS,'zf_sync_linked','1');

  /* ── Schreiben (entprellt) ── */
  let timer=null,busy=false,again=false;
  function schedule(){
    S.pending=true;
    try{oSet.call(LS,'zf_sync_dirty','1');}catch(e){}
    clearTimeout(timer);timer=setTimeout(push,400);
  }
  function push(){
    if(busy){again=true;return;}
    busy=true;again=false;
    const body=JSON.stringify({v:1,t:Date.now(),data:snapshot()});
    return fetch(api(),{method:'PUT',headers:{'Content-Type':'application/json'},body}).then(r=>{
      if(!r.ok)throw new Error('HTTP '+r.status);
      S.last=Date.now();S.error='';S.pending=again;
      if(!again)try{oRem.call(LS,'zf_sync_dirty');}catch(e){}
    }).catch(e=>{
      S.error=String(e&&e.message||e);S.pending=true;
      if(!push.warned&&typeof showToast==='function'){push.warned=true;showToast('⚠️ Datei-Speicherung nicht erreichbar – AppHub neu starten',4000);}
    }).finally(()=>{busy=false;if(again)push();document.dispatchEvent(new Event('zfsync'));});
  }
  proto.setItem=function(k,v){oSet.call(this,k,v);if(this===LS&&!META(String(k)))schedule();};
  proto.removeItem=function(k){oRem.call(this,k);if(this===LS&&!META(String(k)))schedule();};
  proto.clear=function(){oClear.call(this);if(this===LS)schedule();};
  if(S.pending)setTimeout(push,800);
  window.addEventListener('pagehide',()=>{if(S.pending&&!busy){try{fetch(api(),{method:'PUT',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({v:1,t:Date.now(),data:snapshot()})});}catch(e){}}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.pending)push();});
  setInterval(()=>{fetch(location.origin+'/api/ping').then(()=>{if(S.pending&&!busy)push();}).catch(()=>{S.error='Server nicht erreichbar';});},30000);

  /* ── Export / Import / Status für die Einstellungen ── */
  S.pushNow=push;
  S.importText=function(text){
    const j=JSON.parse(text);if(!j||typeof j.data!=='object')throw new Error('Keine gültige Sicherungsdatei');
    localKeys().forEach(k=>oRem.call(LS,k));
    Object.keys(j.data).forEach(k=>oSet.call(LS,k,j.data[k]));
    oSet.call(LS,'zf_sync_dirty','1');
    return Promise.resolve(push()).then(()=>location.reload());
  };
})();
