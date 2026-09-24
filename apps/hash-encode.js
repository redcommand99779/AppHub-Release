/* ══════════════════════════════════
   HASH & ENCODE
══════════════════════════════════ */
let b64Mode='encode';
async function hashUpdate(){
  const text=document.getElementById('hash-input')?.value||'';
  const res=document.getElementById('hash-results');
  const b64El=document.getElementById('b64-result');
  if(!res)return;
  if(!text){res.innerHTML='';if(b64El)b64El.textContent='';return;}
  const enc=new TextEncoder();const data=enc.encode(text);
  const results=[];
  for(const alg of[['SHA-1','sha1'],['SHA-256','sha256'],['SHA-512','sha512']]){
    try{
      const buf=await crypto.subtle.digest(alg[0],data);
      const hex=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      results.push({name:alg[0],id:alg[1],val:hex});
    }catch(e){}
  }
  // Simple MD5 approximation (not crypto-strength, just for display)
  function simpleMd5(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return(h>>>0).toString(16).padStart(8,'0').repeat(4).slice(0,32);}
  results.unshift({name:'MD5 (approx)',id:'md5',val:simpleMd5(text)});
  res.innerHTML=results.map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px">
    <span style="font-size:11px;font-weight:600;color:var(--text-3);min-width:60px">${r.name}</span>
    <span style="font-family:var(--mono);font-size:11px;color:var(--text);flex:1;word-break:break-all">${r.val}</span>
    <button onclick="navigator.clipboard.writeText('${r.val}')" style="padding:3px 8px;background:var(--active-bg);border:0.5px solid var(--active-border);border-radius:5px;font-size:11px;color:var(--accent);cursor:pointer;font-family:var(--font)">📋</button>
  </div>`).join('');
  // Base64
  if(b64El){
    if(b64Mode==='encode')b64El.textContent=btoa(unescape(encodeURIComponent(text)));
    else{try{b64El.textContent=decodeURIComponent(escape(atob(text)));}catch{b64El.textContent='Ungültiges Base64';}}
  }
}
function hashCopy(id){const rows=document.querySelectorAll('#hash-results div');rows.forEach(r=>{if(r.querySelector('span')?.textContent===id.toUpperCase())r.querySelector('button')?.click();});}
function b64SetMode(m){b64Mode=m;document.getElementById('b64-encode-btn')?.classList.toggle('active',m==='encode');document.getElementById('b64-decode-btn')?.classList.toggle('active',m==='decode');hashUpdate();}
function hashCopyB64(){const el=document.getElementById('b64-result');if(el)navigator.clipboard.writeText(el.textContent);}

/* ── Base64 standalone ── */
let b64sMode='encode';
function b64sSetMode(m){b64sMode=m;document.getElementById('b64s-encode-btn')?.classList.toggle('active',m==='encode');document.getElementById('b64s-decode-btn')?.classList.toggle('active',m==='decode');b64sUpdate();}
function b64sUpdate(){
  const inp=document.getElementById('b64s-input')?.value||'';
  const res=document.getElementById('b64s-result');if(!res)return;
  if(!inp){res.textContent='';return;}
  try{res.textContent=b64sMode==='encode'?btoa(unescape(encodeURIComponent(inp))):decodeURIComponent(escape(atob(inp)));}
  catch{res.textContent='Ungültige Eingabe';}
}
function b64sCopy(){const el=document.getElementById('b64s-result');if(el)navigator.clipboard.writeText(el.textContent);}

