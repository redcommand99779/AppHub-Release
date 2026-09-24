/* ── Länder ── */
function laenderInit(){}
function laenderSearch(){
  const q=(document.getElementById('laender-input')?.value||'').trim().toLowerCase();
  const res=document.getElementById('laender-result');if(!res)return;
  if(!q){res.innerHTML='';return;}
  const matches=COUNTRY_DATA.filter(c=>c.n.toLowerCase().includes(q));
  if(!matches.length){res.innerHTML='<div style="color:var(--danger)">Nicht gefunden</div>';return;}
  res.innerHTML=matches.slice(0,8).map(c=>{
    const flag=wmFlagEmoji(c.cc)||'🏳️';
    return `<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;padding:20px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">
        <div style="font-size:48px">${flag}</div>
        <div><div style="font-size:18px;font-weight:700;color:var(--text)">${escHtml(c.n)}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${[['Hauptstadt',c.c],['Region',c.r],['Bevölkerung',c.p.toLocaleString('de-DE')]].map(([k,v])=>`<div style="padding:8px 10px;background:var(--bg);border-radius:8px"><div style="font-size:10px;color:var(--text-3);text-transform:uppercase">${k}</div><div style="font-size:13px;font-weight:500;color:var(--text)">${escHtml(String(v))}</div></div>`).join('')}
      </div>
    </div>`;
  }).join('');
}
