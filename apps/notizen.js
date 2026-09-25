/* ══════════════════════════════════
   NOTIZEN – Liste mit Suche, Anpinnen und Ordnern (Tags), Editor mit Vorschau (Markdown, anklickbare Checklisten),
   automatisches Speichern, Wortzähler, Duplizieren, Export als .md. Daten: zf_notes (altes Format bleibt lesbar)
   Notiz: {id,title,body,pin,cat,created,updated}
══════════════════════════════════ */
const NOTES_KEY='zf_notes';
let notes=[],notesActive=null,notesQuery='',notesCat='',notesPreview=false,notesSaveT=null,notesMobileEdit=false;

function noteEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function notesLoad(){
  let a=[];try{a=JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');}catch(e){}
  if(!Array.isArray(a))a=[];
  return a.filter(n=>n&&typeof n==='object').map(n=>({id:n.id||Date.now()+Math.random(),title:String(n.title||''),body:String(n.body||''),pin:!!n.pin,cat:String(n.cat||'').trim(),
    created:n.created||(typeof n.id==='number'?n.id:0),updated:n.updated||(typeof n.id==='number'?n.id:0)}));
}
function notesDataSave(){try{localStorage.setItem(NOTES_KEY,JSON.stringify(notes));}catch(e){}}

/* ── Logik (testbar) ── */
function notesFiltered(q,cat){
  q=String(q||'').toLowerCase();
  return notes.filter(n=>(!cat||n.cat===cat)&&(!q||n.title.toLowerCase().includes(q)||n.body.toLowerCase().includes(q)||n.cat.toLowerCase().includes(q)))
    .sort((a,b)=>(b.pin-a.pin)||(b.updated-a.updated));
}
function notesCats(){return [...new Set(notes.map(n=>n.cat).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'de'));}
function noteWords(s){const t=String(s||'').trim();return t?t.split(/\s+/).length:0;}
function noteTitleOf(n){return n.title.trim()||(n.body.trim().split('\n')[0]||'').slice(0,40)||'Ohne Titel';}
/* Kleines, sicheres Markdown: Überschriften, fett, kursiv, Code, Listen, Checklisten, Zitate, Links, Trennlinie */
function noteMd(src){
  const lines=String(src||'').split('\n'),out=[];let list=null,code=false,codeBuf=[];
  const inline=s=>noteEsc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const close=()=>{if(list){out.push('</'+list+'>');list=null;}};
  lines.forEach((raw,i)=>{
    if(/^```/.test(raw)){if(code){out.push('<pre><code>'+noteEsc(codeBuf.join('\n'))+'</code></pre>');codeBuf=[];code=false;}else{close();code=true;}return;}
    if(code){codeBuf.push(raw);return;}
    let m;
    if((m=/^(#{1,3})\s+(.*)$/.exec(raw))){close();out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);}
    else if((m=/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(raw))){if(list!=='ul'){close();out.push('<ul class="nt-check">');list='ul';}
      out.push(`<li><input type="checkbox" ${m[1]===' '?'':'checked'} onchange="noteToggleLine(${i})"> <span${m[1]===' '?'':' style="text-decoration:line-through;opacity:.55"'}>${inline(m[2])}</span></li>`);}
    else if((m=/^\s*[-*]\s+(.*)$/.exec(raw))){if(list!=='ul'){close();out.push('<ul>');list='ul';}out.push('<li>'+inline(m[1])+'</li>');}
    else if((m=/^\s*\d+[.)]\s+(.*)$/.exec(raw))){if(list!=='ol'){close();out.push('<ol>');list='ol';}out.push('<li>'+inline(m[1])+'</li>');}
    else if((m=/^>\s?(.*)$/.exec(raw))){close();out.push('<blockquote>'+inline(m[1])+'</blockquote>');}
    else if(/^-{3,}\s*$/.test(raw)){close();out.push('<hr>');}
    else if(!raw.trim()){close();out.push('<div style="height:8px"></div>');}
    else{close();out.push('<p>'+inline(raw)+'</p>');}
  });
  if(code)out.push('<pre><code>'+noteEsc(codeBuf.join('\n'))+'</code></pre>');
  close();return out.join('');
}
/* Zeile n einer Checkliste umschalten ([ ] <-> [x]) */
function noteToggleBody(body,n){
  const lines=String(body).split('\n');
  if(lines[n]==null)return body;
  lines[n]=lines[n].replace(/\[([ xX])\]/,(m,c)=>c===' '?'[x]':'[ ]');
  return lines.join('\n');
}
function noteExportText(n){return (n.title.trim()?'# '+n.title.trim()+'\n\n':'')+n.body;}

/* ── Oberfläche ── */
function notesInit(){notes=notesLoad();notesQuery='';notesCat='';notesPreview=false;notesMobileEdit=false;
  const f=notesFiltered('','');notesActive=f.length?f[0].id:null;notesRender();}
function notesRoot(){return document.getElementById('notes-root');}
function noteCur(){return notes.find(n=>String(n.id)===String(notesActive))||null;}
function noteNew(){
  const now=Date.now(),n={id:now,title:'',body:'',pin:false,cat:notesCat,created:now,updated:now};
  notes.unshift(n);notesActive=n.id;notesPreview=false;notesMobileEdit=true;notesDataSave();notesRender();
  const t=document.getElementById('note-title');if(t)t.focus();
}
function noteOpen(id){flushNote();notesActive=id;notesPreview=false;notesMobileEdit=true;notesRender();}
function noteBack(){flushNote();notesMobileEdit=false;notesRender();}
function noteSearch(v){notesQuery=v||'';flushNote();notesRender();const e=document.getElementById('note-q');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}
function noteSetCat(c){notesCat=notesCat===c?'':c;notesRender();}
/* Eingaben werden nach kurzer Pause gespeichert (ohne die Liste neu aufzubauen, solange du tippst) */
function noteInput(){
  const n=noteCur();if(!n)return;
  n.title=document.getElementById('note-title').value;n.body=document.getElementById('note-body').value;n.updated=Date.now();
  const w=document.getElementById('note-words');if(w)w.textContent=noteWords(n.body)+' Wörter';
  clearTimeout(notesSaveT);notesSaveT=setTimeout(()=>{notesDataSave();notesRenderList();},350);
}
function flushNote(){if(notesSaveT){clearTimeout(notesSaveT);notesSaveT=null;notesDataSave();}}
function noteSetCatOf(v){const n=noteCur();if(!n)return;n.cat=String(v||'').trim();n.updated=Date.now();notesDataSave();notesRenderList();}
function notePin(){const n=noteCur();if(!n)return;n.pin=!n.pin;notesDataSave();notesRender();}
function noteTogglePreview(){flushNote();notesPreview=!notesPreview;notesRender();}
function noteToggleLine(i){const n=noteCur();if(!n)return;n.body=noteToggleBody(n.body,i);n.updated=Date.now();notesDataSave();notesRender();}
function noteDuplicate(){
  const n=noteCur();if(!n)return;const now=Date.now(),c=Object.assign({},n,{id:now,title:(n.title||noteTitleOf(n))+' (Kopie)',pin:false,created:now,updated:now});
  notes.unshift(c);notesActive=c.id;notesDataSave();notesRender();
}
function noteDelete(){
  const n=noteCur();if(!n)return;
  const go=()=>{notes=notes.filter(x=>x.id!==n.id);const f=notesFiltered(notesQuery,notesCat);notesActive=f.length?f[0].id:null;notesMobileEdit=false;notesDataSave();notesRender();};
  if(typeof appConfirm==='function')appConfirm(`Notiz „${noteTitleOf(n)}“ löschen?`,go);else go();
}
function noteExport(){
  const n=noteCur();if(!n)return;
  const blob=new Blob([noteExportText(n)],{type:'text/markdown'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=(noteTitleOf(n).replace(/[^\wäöüÄÖÜß\- ]+/g,'').trim()||'notiz')+'.md';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function noteCopy(){
  const n=noteCur();if(!n)return;
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(noteExportText(n)).then(()=>{if(typeof showToast==='function')showToast('📋 Notiz kopiert',1800);});
}
function noteDate(ts){
  if(!ts||ts<1e11)return '';const d=new Date(ts),t=new Date();
  if(d.toDateString()===t.toDateString())return d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:d.getFullYear()===t.getFullYear()?undefined:'2-digit'});
}
function notesRenderList(){
  const el=document.getElementById('note-list');if(!el)return;
  const list=notesFiltered(notesQuery,notesCat);
  el.innerHTML=list.map(n=>{const prev=n.body.replace(/[#*`>\[\]-]/g,' ').replace(/\s+/g,' ').trim().slice(0,70);
    return `<div class="nt-item${String(n.id)===String(notesActive)?' active':''}" onclick="noteOpen('${n.id}')"><div style="display:flex;gap:6px;align-items:center"><b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px">${n.pin?'📌 ':''}${noteEsc(noteTitleOf(n))}</b><span style="font-size:10px;color:var(--text-3);flex:none">${noteDate(n.updated)}</span></div>
      <div style="font-size:12px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${noteEsc(prev)||'Leer'}</div>${n.cat?`<span class="lrn-pill" style="margin-top:4px;display:inline-block">${noteEsc(n.cat)}</span>`:''}</div>`;}).join('')
    ||`<div style="text-align:center;color:var(--text-3);padding:24px 8px;font-size:13px">${notes.length?'Keine Treffer.':'Noch keine Notizen.'}</div>`;
}
function notesRender(){
  const root=notesRoot();if(!root)return;
  const n=noteCur(),cats=notesCats();
  root.innerHTML=`<div class="nt-wrap${notesMobileEdit&&n?' editing':''}">
    <div class="nt-side">
      <div style="display:flex;gap:6px;margin-bottom:8px"><input id="note-q" class="lrn-input" placeholder="🔍 Suchen …" value="${noteEsc(notesQuery)}" oninput="noteSearch(this.value)" style="flex:1;min-width:0"><button class="lrn-btn" onclick="noteNew()" title="Neue Notiz">＋</button></div>
      ${cats.length?`<div class="lrn-chips" style="margin-bottom:8px">${cats.map(c=>`<button class="lrn-chip${notesCat===c?' active':''}" style="padding:3px 10px;font-size:12px" data-c="${noteEsc(c)}" onclick="noteSetCat(this.dataset.c)">${noteEsc(c)}</button>`).join('')}</div>`:''}
      <div id="note-list" class="nt-list"></div></div>
    <div class="nt-main">${n?`
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap"><button class="lrn-btn ghost nt-back" onclick="noteBack()">← Liste</button>
        <input id="note-title" class="lrn-input" placeholder="Titel …" value="${noteEsc(n.title)}" oninput="noteInput()" style="flex:1;min-width:120px;font-size:16px;font-weight:700">
        <button class="lrn-btn ghost" onclick="notePin()" title="${n.pin?'Loslösen':'Anpinnen'}">${n.pin?'📌':'📍'}</button>
        <button class="lrn-btn ghost${notesPreview?' active':''}" onclick="noteTogglePreview()" title="Vorschau">${notesPreview?'✏️ Bearbeiten':'👁 Vorschau'}</button></div>
      ${notesPreview?`<div class="nt-preview">${noteMd(n.body)||'<span style="color:var(--text-3)">Nichts zu zeigen.</span>'}</div>`
        :`<textarea id="note-body" class="lrn-input nt-area" placeholder="Schreib los … (Markdown: # Titel, **fett**, - Liste, - [ ] Aufgabe)" oninput="noteInput()">${noteEsc(n.body)}</textarea>`}
      <div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap"><input class="lrn-input" list="note-cats" placeholder="Ordner / Tag" value="${noteEsc(n.cat)}" onchange="noteSetCatOf(this.value)" style="width:140px"><datalist id="note-cats">${cats.map(c=>`<option value="${noteEsc(c)}">`).join('')}</datalist>
        <span id="note-words" style="font-size:11px;color:var(--text-3);flex:1">${noteWords(n.body)} Wörter</span>
        <button class="lrn-btn ghost" onclick="noteCopy()" title="Kopieren">📋</button><button class="lrn-btn ghost" onclick="noteExport()" title="Als .md speichern">💾</button><button class="lrn-btn ghost" onclick="noteDuplicate()" title="Duplizieren">⧉</button><button class="lrn-btn ghost" onclick="noteDelete()" title="Löschen">🗑</button></div>`
      :`<div style="text-align:center;color:var(--text-3);padding:60px 10px"><div style="font-size:40px">📝</div><div style="margin:8px 0 14px">Wähle eine Notiz oder schreib eine neue.</div><button class="lrn-btn" onclick="noteNew()">＋ Neue Notiz</button></div>`}</div></div>`;
  notesRenderList();
}
