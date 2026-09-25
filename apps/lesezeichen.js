/* ══════════════════════════════════
   LESEZEICHEN – Ordner (Tags), Favoriten, Suche, Sortierung, Bearbeiten, Import/Export.
   Nur http(s)-Adressen (Schutz vor javascript:-Links). Keine externen Symbole: Buchstaben-Symbol in Farbe der Domain.
   Daten: zf_bookmarks [{id,title,url,cat,fav,visits,created}] (altes Format bleibt lesbar)
══════════════════════════════════ */
const BM_KEY='zf_bookmarks';
const BM_COLORS=['#0a84ff','#34c759','#ff9500','#ff3b30','#af52de','#ff2d55','#5856d6','#00c7be'];
let bmItems=[],bmQuery='',bmCat='',bmSort='new',bmOnlyFav=false,bmEditId=null,bmMsg='';

function bmEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
/* Adresse bereinigen: fehlendes https:// ergänzen, nur http/https zulassen; sonst '' */
function bmNormalize(u){
  u=String(u||'').trim();if(!u)return '';
  if(/^[a-z][a-z0-9+.-]*:/i.test(u)&&!/^https?:\/\//i.test(u))return '';       // javascript:, data:, file: … abgelehnt
  if(!/^https?:\/\//i.test(u))u='https://'+u.replace(/^\/+/,'');
  try{const x=new URL(u);if(!/^https?:$/.test(x.protocol)||!x.hostname.includes('.')&&x.hostname!=='localhost')return '';return x.href;}catch(e){return '';}
}
function bmHost(url){try{return new URL(url).hostname.replace(/^www\./,'');}catch(e){return url;}}
function bmColor(url){let h=0;const s=bmHost(url);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return BM_COLORS[h%BM_COLORS.length];}
function bmKey(url){return bmNormalize(url).replace(/^https?:\/\/(www\.)?/i,'').replace(/\/+$/,'').toLowerCase();}
function bmLoad(){
  let a=[];try{a=JSON.parse(localStorage.getItem(BM_KEY)||'[]');}catch(e){}
  if(!Array.isArray(a))a=[];
  return a.map(b=>{const url=bmNormalize(b&&b.url);return url?{id:b.id||Date.now()+Math.random(),title:String(b.title||bmHost(url)),url,cat:String(b.cat||'').trim(),fav:!!b.fav,visits:+b.visits||0,created:b.created||(typeof b.id==='number'?b.id:0)}:null;}).filter(Boolean);
}
function bmSave(){try{localStorage.setItem(BM_KEY,JSON.stringify(bmItems));}catch(e){}}

/* ── Logik (testbar) ── */
function bmFiltered(){
  const q=bmQuery.toLowerCase();
  const list=bmItems.filter(b=>(!bmCat||b.cat===bmCat)&&(!bmOnlyFav||b.fav)&&(!q||b.title.toLowerCase().includes(q)||b.url.toLowerCase().includes(q)||b.cat.toLowerCase().includes(q)));
  const cmp={new:(a,b)=>(b.created||0)-(a.created||0),name:(a,b)=>a.title.localeCompare(b.title,'de'),visits:(a,b)=>(b.visits-a.visits)||(b.created-a.created)}[bmSort]||((a,b)=>0);
  return list.sort((a,b)=>(b.fav-a.fav)||cmp(a,b));
}
function bmCats(){return [...new Set(bmItems.map(b=>b.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));}
/* Einfügen: eine Adresse pro Zeile (optional "Titel | Adresse") oder JSON-Export */
function bmParseImport(text){
  text=String(text||'').trim();const out=[],bad=[];
  if(text.startsWith('[')){try{JSON.parse(text).forEach((b,i)=>{const url=bmNormalize(b&&b.url);if(url)out.push({title:String(b.title||bmHost(url)),url,cat:String(b.cat||''),fav:!!b.fav});else bad.push(i+1);});return {items:out,bad};}catch(e){}}
  text.split(/\r?\n/).forEach((line,i)=>{
    line=line.trim();if(!line)return;
    let title='',u=line;const m=/^(.*?)\s*[|;]\s*(\S+)$/.exec(line);if(m){title=m[1].trim();u=m[2];}
    const url=bmNormalize(u);if(url)out.push({title:title||bmHost(url),url,cat:'',fav:false});else bad.push(i+1);
  });
  return {items:out,bad};
}
function bmAddItems(list){
  let added=0,dup=0;
  list.forEach(x=>{if(bmItems.some(b=>bmKey(b.url)===bmKey(x.url))){dup++;return;}bmItems.push({id:Date.now()+Math.floor(Math.random()*100000),title:x.title,url:x.url,cat:x.cat||'',fav:!!x.fav,visits:0,created:Date.now()+added});added++;});
  return {added,dup};
}

/* ── Oberfläche ── */
function bmInit(){bmItems=bmLoad();bmEditId=null;bmMsg='';bmRender();}
function bmRoot(){return document.getElementById('bm-root');}
function bmVal(id){const e=document.getElementById(id);return e?e.value:'';}
function bmAdd(){
  const url=bmNormalize(bmVal('bm-url'));
  if(!url){bmMsg='Bitte eine gültige Webadresse eingeben (http oder https).';bmRender();return;}
  const r=bmAddItems([{title:bmVal('bm-title').trim()||bmHost(url),url,cat:bmVal('bm-cat').trim()}]);
  bmMsg=r.dup?'Diese Adresse ist schon gespeichert.':'✅ Gespeichert.';if(r.added)bmSave();bmRender();const e=document.getElementById('bm-url');if(e)e.focus();
}
function bmFind(id){return bmItems.find(b=>String(b.id)===String(id));}
function bmVisit(id){const b=bmFind(id);if(b){b.visits++;bmSave();}}
function bmFav(id){const b=bmFind(id);if(!b)return;b.fav=!b.fav;bmSave();bmRender();}
function bmDelete(id){bmItems=bmItems.filter(b=>String(b.id)!==String(id));bmSave();bmRender();}
function bmEdit(id){bmEditId=id==null?null:String(id);bmRender();}
function bmSaveEdit(id){
  const b=bmFind(id),url=bmNormalize(bmVal('bm-e-url'));if(!b||!url)return;
  b.url=url;b.title=bmVal('bm-e-title').trim()||bmHost(url);b.cat=bmVal('bm-e-cat').trim();bmEditId=null;bmSave();bmRender();
}
function bmSearch(v){bmQuery=v||'';bmRender();const e=document.getElementById('bm-q');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}
function bmSetCat(c){bmCat=bmCat===c?'':c;bmRender();}
function bmSetSort(s){bmSort=s;bmRender();}
function bmToggleFav(){bmOnlyFav=!bmOnlyFav;bmRender();}
function bmExport(){
  const blob=new Blob([JSON.stringify(bmItems.map(b=>({title:b.title,url:b.url,cat:b.cat,fav:b.fav})),null,1)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='lesezeichen.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function bmImport(){
  const r=bmParseImport(bmVal('bm-import'));
  if(!r.items.length){bmMsg='Keine gültigen Adressen gefunden.';bmRender();return;}
  const a=bmAddItems(r.items);if(a.added)bmSave();
  bmMsg=`✅ ${a.added} hinzugefügt`+(a.dup?`, ${a.dup} schon vorhanden`:'')+(r.bad.length?`, ${r.bad.length} Zeilen ungültig`:'')+'.';bmRender();
}
function bmRender(){
  const root=bmRoot();if(!root)return;
  const cats=bmCats(),list=bmFiltered();
  root.innerHTML=`${bmMsg?`<div class="lrn-msg">${bmEsc(bmMsg)}</div>`:''}
    <div class="lrn-card" style="margin-bottom:14px"><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="bm-url" class="lrn-input" placeholder="Adresse, z. B. wikipedia.org" style="flex:2;min-width:180px" onkeydown="if(event.key==='Enter')bmAdd()"><input id="bm-title" class="lrn-input" placeholder="Titel (optional)" style="flex:1;min-width:120px" onkeydown="if(event.key==='Enter')bmAdd()"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><input id="bm-cat" class="lrn-input" list="bm-cats" placeholder="Ordner (optional)" style="flex:1;min-width:120px"><datalist id="bm-cats">${cats.map(c=>`<option value="${bmEsc(c)}">`).join('')}</datalist><button class="lrn-btn" onclick="bmAdd()">＋ Speichern</button></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><input id="bm-q" class="lrn-input" placeholder="🔍 Suchen …" value="${bmEsc(bmQuery)}" oninput="bmSearch(this.value)" style="flex:1;min-width:130px">
      <select class="lrn-input" onchange="bmSetSort(this.value)"><option value="new" ${bmSort==='new'?'selected':''}>Neueste</option><option value="name" ${bmSort==='name'?'selected':''}>A–Z</option><option value="visits" ${bmSort==='visits'?'selected':''}>Meistbesucht</option></select>
      <button class="lrn-btn ghost${bmOnlyFav?' active':''}" onclick="bmToggleFav()">⭐ Favoriten</button></div>
    ${cats.length?`<div class="lrn-chips" style="margin-bottom:10px">${cats.map(c=>`<button class="lrn-chip${bmCat===c?' active':''}" data-c="${bmEsc(c)}" onclick="bmSetCat(this.dataset.c)">📁 ${bmEsc(c)}</button>`).join('')}</div>`:''}
    ${list.length?list.map(b=>bmRenderItem(b)).join(''):`<div style="text-align:center;color:var(--text-3);padding:26px;font-size:13px">${bmItems.length?'Keine Treffer.':'Noch keine Lesezeichen – speichere oben deine erste Adresse. 🔖'}</div>`}
    <details class="lrn-card" style="margin-top:14px"><summary style="cursor:pointer;font-weight:700;font-size:13px">Importieren &amp; Exportieren</summary>
      <div style="font-size:12px;color:var(--text-3);margin:10px 0 6px">Eine Adresse pro Zeile (optional <code>Titel | Adresse</code>) oder ein früherer JSON-Export:</div>
      <textarea id="bm-import" class="lrn-input" rows="4" style="width:100%;resize:vertical" placeholder="Wikipedia | de.wikipedia.org&#10;https://example.com"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="lrn-btn" onclick="bmImport()">Importieren</button><button class="lrn-btn ghost" onclick="bmExport()">💾 Alle exportieren (JSON)</button></div></details>`;
}
function bmRenderItem(b){
  const sid=String(b.id);
  if(bmEditId===sid){
    return `<div class="lrn-card" style="margin-bottom:8px"><input id="bm-e-title" class="lrn-input" value="${bmEsc(b.title)}" placeholder="Titel" style="width:100%;margin-bottom:8px"><input id="bm-e-url" class="lrn-input" value="${bmEsc(b.url)}" style="width:100%;margin-bottom:8px"><input id="bm-e-cat" class="lrn-input" value="${bmEsc(b.cat)}" list="bm-cats" placeholder="Ordner" style="width:100%">
      <div class="lrn-two"><button class="lrn-btn ghost" onclick="bmEdit(null)">Abbrechen</button><button class="lrn-btn" onclick="bmSaveEdit('${sid}')">Speichern</button></div></div>`;
  }
  const c=bmColor(b.url);
  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:14px;margin-bottom:6px">
    <div style="width:38px;height:38px;border-radius:11px;background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex:none">${bmEsc((bmHost(b.url)[0]||'?').toUpperCase())}</div>
    <a href="${bmEsc(b.url)}" target="_blank" rel="noopener noreferrer" onclick="bmVisit('${sid}')" style="flex:1;min-width:0;text-decoration:none"><div style="font-size:14px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bmEsc(b.title)}</div>
      <div style="font-size:11px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bmEsc(bmHost(b.url))}${b.cat?' · 📁 '+bmEsc(b.cat):''}${b.visits?' · '+b.visits+'×':''}</div></a>
    <button class="lrn-btn ghost" onclick="bmFav('${sid}')" title="Favorit">${b.fav?'⭐':'☆'}</button><button class="lrn-btn ghost" onclick="bmEdit('${sid}')" title="Bearbeiten">✏️</button><button class="lrn-btn ghost" onclick="bmDelete('${sid}')" title="Löschen">🗑</button></div>`;
}
