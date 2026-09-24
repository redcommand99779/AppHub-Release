/* ── Lesezeichen ── */
let bmItems=[];
function bmInit(){bmItems=JSON.parse(localStorage.getItem('zf_bookmarks')||'[]');bmRender();}
function bmAdd(){
  const title=document.getElementById('bm-title')?.value.trim();
  const url=document.getElementById('bm-url')?.value.trim();
  if(!url)return;
  bmItems.unshift({id:Date.now(),title:title||url,url});
  localStorage.setItem('zf_bookmarks',JSON.stringify(bmItems));
  document.getElementById('bm-title').value='';document.getElementById('bm-url').value='';
  bmRender();
}
function bmDelete(id){bmItems=bmItems.filter(b=>b.id!==id);localStorage.setItem('zf_bookmarks',JSON.stringify(bmItems));bmRender();}
function bmRender(){
  const list=document.getElementById('bm-list');if(!list)return;
  list.innerHTML=bmItems.map(b=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;margin-bottom:6px">
    <a href="${escHtml(b.url)}" target="_blank" style="flex:1;text-decoration:none"><div style="font-size:13px;font-weight:600;color:var(--accent)">${escHtml(b.title)}</div><div style="font-size:11px;color:var(--text-3)">${escHtml(b.url.slice(0,60))}</div></a>
    <button onclick="bmDelete(${b.id})" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:16px;padding:0">×</button>
  </div>`).join('')||'<div style="text-align:center;color:var(--text-3);padding:20px">Keine Lesezeichen</div>';
}
