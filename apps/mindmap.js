/* ══════════════════════════════════
   MIND-MAP
══════════════════════════════════ */
let mmapNodes=[],mmapSelected=null,mmapDragging=null,mmapDragOffset={x:0,y:0};
const MMAP_COLORS=['#0071e3','#34c759','#ff9500','#ff3b30','#af52de','#ff2d55','#5856d6','#30b0c7'];
function mmapInit(){
  if(!mmapNodes.length){mmapNodes=[{id:0,text:'Hauptidee',x:300,y:230,parent:null}];}
  mmapRender();
}
function mmAddNode(){
  const inp=document.getElementById('mm-node-input');if(!inp?.value.trim())return;
  const id=Date.now();
  mmapNodes.push({id,text:inp.value.trim(),x:80+Math.random()*400,y:80+Math.random()*300,parent:null});
  inp.value='';mmapRender();
}
function mmAddChild(){
  const inp=document.getElementById('mm-node-input');if(!inp?.value.trim()||mmapSelected===null)return;
  const parent=mmapNodes.find(n=>n.id===mmapSelected);if(!parent)return;
  const id=Date.now();
  mmapNodes.push({id,text:inp.value.trim(),x:parent.x+80+Math.random()*60,y:parent.y+60+Math.random()*40,parent:mmapSelected});
  inp.value='';mmapRender();
}
function mmDelete(){
  if(mmapSelected===null)return;
  mmapNodes=mmapNodes.filter(n=>n.id!==mmapSelected&&n.parent!==mmapSelected);
  mmapSelected=null;mmapRender();
}
function mmClear(){mmapNodes=[{id:0,text:'Hauptidee',x:300,y:230,parent:null}];mmapSelected=null;mmapRender();}
function mmExport(){const cv=document.getElementById('mm-canvas');if(!cv)return;const a=document.createElement('a');a.download='mindmap.png';a.href=cv.toDataURL();a.click();}
function mmapRender(){
  const cv=document.getElementById('mm-canvas');if(!cv)return;
  const W=cv.offsetWidth||600;cv.width=W;cv.height=460;
  const ctx=cv.getContext('2d');
  ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--bg')||'#f5f5f7';
  ctx.fillRect(0,0,W,460);
  // Draw connections
  mmapNodes.forEach(n=>{
    if(n.parent===null)return;
    const p=mmapNodes.find(x=>x.id===n.parent);if(!p)return;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(n.x,n.y);
    ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=2;ctx.stroke();
  });
  // Draw nodes
  mmapNodes.forEach((n,i)=>{
    const col=MMAP_COLORS[i%MMAP_COLORS.length];
    ctx.font='bold 13px sans-serif';
    const tw=ctx.measureText(n.text).width;const pw=tw+20;const ph=32;
    const x=n.x-pw/2,y=n.y-ph/2;
    ctx.fillStyle=n.id===mmapSelected?col:'rgba(0,0,0,0.1)';
    ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,pw,ph,8):ctx.rect(x,y,pw,ph);ctx.fill();
    ctx.fillStyle=col;ctx.lineWidth=2;ctx.strokeStyle=col;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,pw,ph,8):ctx.rect(x,y,pw,ph);ctx.stroke();
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.text,n.x,n.y);
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  const cv=document.getElementById('mm-canvas');if(!cv)return;
  cv.addEventListener('mousedown',e=>{
    const rect=cv.getBoundingClientRect();const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const hit=mmapNodes.find(n=>{const ctx=cv.getContext('2d');ctx.font='bold 13px sans-serif';const tw=ctx.measureText(n.text).width+20;return Math.abs(mx-n.x)<tw/2&&Math.abs(my-n.y)<16;});
    if(hit){mmapSelected=hit.id;mmapDragging=hit.id;mmapDragOffset={x:mx-hit.x,y:my-hit.y};mmapRender();}
    else{mmapSelected=null;mmapRender();}
  });
  cv.addEventListener('mousemove',e=>{
    if(mmapDragging===null)return;
    const rect=cv.getBoundingClientRect();const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const n=mmapNodes.find(x=>x.id===mmapDragging);
    if(n){n.x=mx-mmapDragOffset.x;n.y=my-mmapDragOffset.y;mmapRender();}
  });
  cv.addEventListener('mouseup',()=>mmapDragging=null);
});
