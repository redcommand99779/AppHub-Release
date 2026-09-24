/* ══════════════════════════════════
   WIKIPEDIA
══════════════════════════════════ */
function wikiSearch(){
  const q=document.getElementById('wiki-input')?.value.trim();if(!q)return;
  const lang=document.getElementById('wiki-lang')?.value||'de';
  const res=document.getElementById('wiki-result');const sug=document.getElementById('wiki-suggestions');
  if(res)res.innerHTML='<div style="color:var(--text-3)">Lädt…</div>';
  fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`.replace('de.wikipedia',`${lang}.wikipedia`))
    .then(r=>r.json()).then(d=>{
      if(d.type==='disambiguation'||d.title?.includes('not found')){
        if(res)res.innerHTML='<div style="color:var(--danger)">Nicht gefunden. Versuche einen anderen Begriff.</div>';return;
      }
      if(res)res.innerHTML=`
        ${d.thumbnail?`<img src="${d.thumbnail.source}" style="float:right;max-width:140px;border-radius:8px;margin:0 0 10px 14px"/>`:''  }
        <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:6px">${escHtml(d.title||'')}</div>
        <div style="font-size:13px;color:var(--text-3);margin-bottom:8px;font-style:italic">${escHtml(d.description||'')}</div>
        <div style="font-size:14px;line-height:1.7;color:var(--text)">${escHtml(d.extract||'')}</div>
        <a href="${d.content_urls?.desktop?.page||'#'}" target="_blank" style="display:inline-block;margin-top:10px;color:var(--accent);font-size:13px">→ Vollständiger Artikel auf Wikipedia</a>
      `;
    }).catch(()=>{if(res)res.innerHTML='<div style="color:var(--danger)">Fehler beim Laden</div>';});
}

