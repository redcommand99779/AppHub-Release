/* ══════════════════════════════════
   QR-CODE
══════════════════════════════════ */
let qrTimer=null;
function qrGenDebounce(){clearTimeout(qrTimer);qrTimer=setTimeout(qrGen,300);}
function qrGen(){
  const text=document.getElementById('qr-input')?.value||'';
  const canvas=document.getElementById('qr-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const size=220;
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#fff';
  ctx.fillRect(0,0,size,size);
  if(!text){ctx.fillStyle='#ccc';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('Text eingeben',size/2,size/2);return;}
  // Minimal QR-like visualization using a simple encoding library approach
  // Since we can't import libraries, use a basic pattern display + link to generator
  try{
    qrDraw(ctx,text,size);
  }catch(e){ctx.fillStyle='#333';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText('QR wird generiert…',size/2,size/2);}
}

function qrDraw(ctx,text,size){
  // Use Google Charts QR API via an image (no CORS issues)
  const img=new Image();
  const url=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}&format=png`;
  img.crossOrigin='anonymous';
  img.onload=()=>{ctx.clearRect(0,0,size,size);ctx.drawImage(img,0,0,size,size);};
  img.onerror=()=>{
    // Fallback: just show text URL
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle='var(--text-3)';ctx.font='12px sans-serif';ctx.textAlign='center';
    ctx.fillText('Kein Internet verfügbar',size/2,size/2);
  };
  img.src=url;
}

function qrDownload(){
  const canvas=document.getElementById('qr-canvas');
  const a=document.createElement('a');a.download='qrcode.png';a.href=canvas.toDataURL();a.click();
}


function escD(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
