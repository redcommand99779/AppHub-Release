/* ══════════════════════════════════
   PIXEL ART EDITOR
══════════════════════════════════ */
let paGrid=[],paSizeN=16,paTool='draw',paDrawing=false;
const PA_PALETTE=['#000000','#ffffff','#ff3b30','#ff9500','#ffcc00','#34c759','#30b0c7','#0071e3','#5856d6','#af52de','#ff2d55','#a2845e','#636366','#d1d1d6','#fffacd','#b5d5ff'];
function paInit(){
  paSizeN=parseInt(document.getElementById('pa-size')?.value||16);
  paGrid=Array(paSizeN*paSizeN).fill('#ffffff');
  const pp=document.getElementById('pa-palette');
  if(pp)pp.innerHTML=PA_PALETTE.map(col=>`<div onclick="document.getElementById('pa-color').value='${col}'" style="width:22px;height:22px;background:${col};border-radius:4px;cursor:pointer;border:0.5px solid var(--divider)"></div>`).join('');
  paRender();
}
function paNew(){paInit();}
function paClear(){paGrid=Array(paSizeN*paSizeN).fill('#ffffff');paRender();}
function paFill(){const color=document.getElementById('pa-color')?.value||'#000000';paGrid=paGrid.map(()=>color);paRender();}
function paRender(){
  const cv=document.getElementById('pa-canvas');if(!cv)return;
  const size=Math.min(480,window.innerWidth-40);
  cv.width=size;cv.height=size;
  const cell=size/paSizeN;
  const ctx=cv.getContext('2d');
  paGrid.forEach((col,i)=>{
    const x=(i%paSizeN)*cell,y=Math.floor(i/paSizeN)*cell;
    ctx.fillStyle=col;ctx.fillRect(x,y,cell,cell);
    ctx.strokeStyle='rgba(0,0,0,0.05)';ctx.lineWidth=0.5;ctx.strokeRect(x,y,cell,cell);
  });
}
function paGetIdx(e){
  const cv=document.getElementById('pa-canvas');if(!cv)return -1;
  const rect=cv.getBoundingClientRect();
  const cell=rect.width/paSizeN;
  const x=Math.floor((e.clientX-rect.left)/cell);
  const y=Math.floor((e.clientY-rect.top)/cell);
  if(x<0||x>=paSizeN||y<0||y>=paSizeN)return -1;
  return y*paSizeN+x;
}
function paApply(e){
  const idx=paGetIdx(e);if(idx<0)return;
  const color=document.getElementById('pa-color')?.value||'#000000';
  if(paTool==='draw')paGrid[idx]=color;
  else if(paTool==='erase')paGrid[idx]='#ffffff';
  else if(paTool==='pick'){const el=document.getElementById('pa-color');if(el)el.value=paGrid[idx];return;}
  else if(paTool==='fill'){const target=paGrid[idx];if(target===color)return;const q=[idx];const visited=new Set([idx]);while(q.length){const cur=q.shift();paGrid[cur]=color;const x=cur%paSizeN,y=Math.floor(cur/paSizeN);[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].forEach(([nx,ny])=>{if(nx>=0&&nx<paSizeN&&ny>=0&&ny<paSizeN){const ni=ny*paSizeN+nx;if(!visited.has(ni)&&paGrid[ni]===target){visited.add(ni);q.push(ni);}}});}}
  paRender();
}
function paExport(){
  const cv=document.getElementById('pa-canvas');if(!cv)return;
  const a=document.createElement('a');a.download='pixel-art.png';a.href=cv.toDataURL();a.click();
}
document.addEventListener('DOMContentLoaded',()=>{
  const cv=document.getElementById('pa-canvas');
  if(cv){
    cv.addEventListener('mousedown',e=>{paDrawing=true;paApply(e);});
    cv.addEventListener('mousemove',e=>{if(paDrawing)paApply(e);});
    cv.addEventListener('mouseup',()=>paDrawing=false);
    cv.addEventListener('mouseleave',()=>paDrawing=false);
    cv.addEventListener('touchstart',e=>{e.preventDefault();paDrawing=true;paApply(e.touches[0]);},{passive:false});
    cv.addEventListener('touchmove',e=>{e.preventDefault();if(paDrawing)paApply(e.touches[0]);},{passive:false});
    cv.addEventListener('touchend',()=>paDrawing=false);
  }
});

