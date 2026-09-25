/* ══════════════════════════════════
   MIND-MAP – Knoten mit Verbindungslinien, ziehen (Maus & Touch), automatisch gespeichert (zf_mindmap)
   Jeder Knoten außer der Hauptidee hängt an einem Eltern-Knoten; "+ Knoten" hängt an den markierten Knoten
   (ohne Auswahl an die Hauptidee), damit immer eine Linie gezeichnet wird.
══════════════════════════════════ */
let mmapNodes=[],mmapSelected=null,mmapDragging=null,mmapDragOffset={x:0,y:0};
const MMAP_COLORS=['#0071e3','#34c759','#ff9500','#ff3b30','#af52de','#ff2d55','#5856d6','#30b0c7'];
const MMAP_KEY='zf_mindmap';
function mmapRoot(){return {id:0,text:'Hauptidee',x:300,y:230,parent:null};}
function mmapLoad(){
  try{const d=JSON.parse(localStorage.getItem(MMAP_KEY)||'null');if(Array.isArray(d)&&d.length&&d.every(n=>n&&typeof n.text==='string'&&isFinite(n.x)&&isFinite(n.y)))return d;}catch(e){}
  return [mmapRoot()];
}
function mmapSave(){try{localStorage.setItem(MMAP_KEY,JSON.stringify(mmapNodes));}catch(e){}}
/* Knoten, die keinen (vorhandenen) Eltern-Knoten haben, an die Hauptidee hängen – so bleibt jede Karte verbunden */
function mmapRepair(){
  if(!mmapNodes.length)mmapNodes=[mmapRoot()];
  const root=mmapNodes.find(n=>n.parent===null)||mmapNodes[0];
  root.parent=null;
  mmapNodes.forEach(n=>{if(n!==root&&(n.parent===null||n.parent===undefined||!mmapNodes.some(p=>p.id===n.parent)))n.parent=root.id;});
  return root;
}
function mmapInit(){mmapNodes=mmapLoad();mmapRepair();mmapRender();}
function mmapNewId(){let id=Date.now();while(mmapNodes.some(n=>n.id===id))id++;return id;}
function mmapAdd(parentId){
  const inp=document.getElementById('mm-node-input');if(!inp||!inp.value.trim())return;
  const root=mmapRepair(),parent=mmapNodes.find(n=>n.id===parentId)||root;
  const kids=mmapNodes.filter(n=>n.parent===parent.id).length,ang=(kids*137.5)*Math.PI/180+(parent===root?0:Math.atan2(parent.y-root.y,parent.x-root.x)),r=110;
  const cv=document.getElementById('mm-canvas'),W=(cv&&cv.offsetWidth)||600;
  const x=Math.max(60,Math.min(W-60,parent.x+Math.cos(ang)*r)),y=Math.max(30,Math.min(430,parent.y+Math.sin(ang)*r));
  const node={id:mmapNewId(),text:inp.value.trim(),x,y,parent:parent.id};
  mmapNodes.push(node);inp.value='';inp.focus();mmapSave();mmapRender();
}
function mmAddNode(){mmapAdd(mmapSelected);}                       // hängt an den markierten Knoten, sonst an die Hauptidee
function mmAddChild(){mmapAdd(mmapSelected);}
function mmDescendants(id){const out=[],todo=[id];while(todo.length){const c=todo.pop();mmapNodes.forEach(n=>{if(n.parent===c&&!out.includes(n.id)){out.push(n.id);todo.push(n.id);}});}return out;}
function mmDelete(){
  if(mmapSelected===null)return;
  const root=mmapRepair();
  if(mmapSelected===root.id){mmClear();return;}
  const gone=[mmapSelected].concat(mmDescendants(mmapSelected));
  mmapNodes=mmapNodes.filter(n=>!gone.includes(n.id));
  mmapSelected=null;mmapSave();mmapRender();
}
function mmClear(){mmapNodes=[mmapRoot()];mmapSelected=null;mmapSave();mmapRender();}
function mmExport(){const cv=document.getElementById('mm-canvas');if(!cv)return;const a=document.createElement('a');a.download='mindmap.png';a.href=cv.toDataURL();a.click();}
function mmapCss(name,fb){const v=getComputedStyle(document.documentElement).getPropertyValue(name);return (v&&v.trim())||fb;}
function mmapBox(ctx,n){ctx.font='bold 13px sans-serif';const tw=ctx.measureText(n.text).width,pw=tw+24,ph=32;return {pw,ph,x:n.x-pw/2,y:n.y-ph/2};}
function mmapRender(){
  const cv=document.getElementById('mm-canvas');if(!cv)return;
  const W=cv.offsetWidth||600;cv.width=W;cv.height=460;
  const ctx=cv.getContext('2d');
  const bg=mmapCss('--bg','#f5f5f7'),surface=mmapCss('--surface','#ffffff'),text=mmapCss('--text','#1d1d1f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,460);
  const colorOf=n=>MMAP_COLORS[Math.max(0,mmapNodes.indexOf(n))%MMAP_COLORS.length];
  // Verbindungslinien: sanfte Kurven in der Farbe des Kind-Knotens
  ctx.lineCap='round';
  mmapNodes.forEach(n=>{
    if(n.parent===null||n.parent===undefined)return;
    const p=mmapNodes.find(x=>x.id===n.parent);if(!p)return;
    const mx=(p.x+n.x)/2;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.bezierCurveTo(mx,p.y,mx,n.y,n.x,n.y);
    ctx.strokeStyle=colorOf(n);ctx.globalAlpha=n.id===mmapSelected||p.id===mmapSelected?0.95:0.6;ctx.lineWidth=3;ctx.stroke();ctx.globalAlpha=1;
  });
  // Knoten (über den Linien)
  mmapNodes.forEach(n=>{
    const col=colorOf(n),b=mmapBox(ctx,n),sel=n.id===mmapSelected,root=n.parent===null;
    ctx.save();ctx.shadowColor='rgba(0,0,0,0.18)';ctx.shadowBlur=sel?10:5;ctx.shadowOffsetY=2;
    ctx.fillStyle=sel||root?col:surface;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x,b.y,b.pw,b.ph,10):ctx.rect(b.x,b.y,b.pw,b.ph);ctx.fill();ctx.restore();
    ctx.lineWidth=2;ctx.strokeStyle=col;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x,b.y,b.pw,b.ph,10):ctx.rect(b.x,b.y,b.pw,b.ph);ctx.stroke();
    ctx.fillStyle=sel||root?'#fff':text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.text,n.x,n.y+0.5);
  });
}
function mmapPoint(cv,e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*(cv.width/r.width),y:(e.clientY-r.top)*(cv.height/r.height)};}
document.addEventListener('DOMContentLoaded',()=>{
  const cv=document.getElementById('mm-canvas');if(!cv)return;
  cv.style.touchAction='none';
  cv.addEventListener('pointerdown',e=>{
    const {x:mx,y:my}=mmapPoint(cv,e),ctx=cv.getContext('2d');
    let hit=null;for(let i=mmapNodes.length-1;i>=0;i--){const n=mmapNodes[i],b=mmapBox(ctx,n);if(mx>=b.x&&mx<=b.x+b.pw&&my>=b.y&&my<=b.y+b.ph){hit=n;break;}}
    if(hit){mmapSelected=hit.id;mmapDragging=hit.id;mmapDragOffset={x:mx-hit.x,y:my-hit.y};try{cv.setPointerCapture(e.pointerId);}catch(_){}cv.style.cursor='grabbing';}
    else mmapSelected=null;
    mmapRender();
  });
  cv.addEventListener('pointermove',e=>{
    if(mmapDragging===null)return;
    const {x:mx,y:my}=mmapPoint(cv,e),n=mmapNodes.find(x=>x.id===mmapDragging);
    if(n){n.x=Math.max(20,Math.min(cv.width-20,mx-mmapDragOffset.x));n.y=Math.max(16,Math.min(cv.height-16,my-mmapDragOffset.y));mmapRender();}
  });
  const end=()=>{if(mmapDragging!==null)mmapSave();mmapDragging=null;cv.style.cursor='default';};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
});
