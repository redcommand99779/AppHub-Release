/* ══════════════════════════════════
   TETRIS
══════════════════════════════════ */
let tetBoard=[],tetPiece=null,tetNext=null,tetScore=0,tetLevel=1,tetLines=0,
    tetInterval=null,tetRunning=false,tetPaused=false,tetDiff='easy',tetBest=0,
    tetAcc=0,tetLastTime=null;
const TETS=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
const TET_COLORS=['#00f0f0','#f0f000','#a000f0','#f0a000','#0000f0','#00f000','#f00000'];

function tetMove(dx){
  if(!tetRunning||tetPaused||!tetPiece)return;
  if(!tetCollide(tetPiece,dx,0)){tetPiece.x+=dx;tetDraw();}
}
function tetRotate(){
  if(!tetRunning||tetPaused||!tetPiece)return;
  const orig=tetPiece.shape;
  const R=orig.length,C=orig[0].length;
  const rot=Array.from({length:C},(_,i)=>Array.from({length:R},(_,j)=>orig[R-1-j][i]));
  const prev=tetPiece.shape;tetPiece.shape=rot;
  // Wall kick
  if(tetCollide(tetPiece,0,0)){
    if(!tetCollide(tetPiece,1,0))tetPiece.x+=1;
    else if(!tetCollide(tetPiece,-1,0))tetPiece.x-=1;
    else if(!tetCollide(tetPiece,2,0))tetPiece.x+=2;
    else if(!tetCollide(tetPiece,-2,0))tetPiece.x-=2;
    else tetPiece.shape=prev;
  }
  tetDraw();
}
function tetSoftDrop(){
  if(!tetRunning||tetPaused||!tetPiece)return;
  if(!tetCollide(tetPiece,0,1)){tetPiece.y++;tetDraw();}
  else tetLock();
}
function tetHardDrop(){
  if(!tetRunning||tetPaused||!tetPiece)return;
  while(!tetCollide(tetPiece,0,1))tetPiece.y++;
  tetLock();
}

function tetrisInit(){
  tetBest=parseInt(localStorage.getItem('tetris_best')||'0');
  const b=document.getElementById('tetris-best');if(b)b.textContent=tetBest;
  tetDrawEmpty();
}
function tetrisSetDiff(d){
  tetDiff=d;['easy','medium','hard'].forEach(x=>{const b=document.getElementById('tetris-diff-'+x);if(b)b.classList.toggle('active',x===d);});
}
function tetrisStop(){if(tetInterval?.cancel)tetInterval.cancel();else clearInterval(tetInterval);tetRunning=false;}
function tetDrawEmpty(){
  const cv=document.getElementById('tetris-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,200,400);
  ctx.fillStyle='#555';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('Auf Start klicken',100,200);
}
function tetDropMs(){return Math.max(50,500-tetLevel*40);}

function tetrisStart(){
  // Stop any existing loop
  if(tetRafId){cancelAnimationFrame(tetRafId);tetRafId=null;}
  if(tetPhysInt){clearInterval(tetPhysInt);tetPhysInt=null;}
  
  tetBoard=Array(20).fill(null).map(()=>Array(10).fill(0));
  tetScore=0;tetLevel={easy:1,medium:3,hard:6}[tetDiff];tetLines=0;
  tetRunning=true;tetPaused=false;
  const s=document.getElementById('tetris-score');
  const l=document.getElementById('tetris-level');
  if(s)s.textContent=0;if(l)l.textContent=tetLevel;
  tetNext=tetNewPiece();tetPiece=tetSpawn();
  const btn=document.getElementById('tetris-btn');if(btn)btn.textContent='Neustart';
  
  // Physics via setInterval - reliable drop timing
  function startPhys(){
    if(tetPhysInt)clearInterval(tetPhysInt);
    tetPhysInt=setInterval(()=>{
      if(!tetRunning||tetPaused)return;
      if(!tetCollide(tetPiece,0,1)){tetPiece.y++;}
      else{tetLock();}
    },tetDropMs());
  }
  startPhys();
  tetInterval={cancel:()=>{clearInterval(tetPhysInt);tetPhysInt=null;if(tetRafId){cancelAnimationFrame(tetRafId);tetRafId=null;}tetRunning=false;}};
  
  // Draw via rAF
  function draw(){
    if(!tetRunning&&!tetPaused)return;
    tetDraw();
    tetRafId=requestAnimationFrame(draw);
  }
  tetRafId=requestAnimationFrame(draw);
  tetDraw();
}
function tetrisPause(){
  if(!tetRunning)return;
  tetPaused=!tetPaused;
  const btn=document.getElementById('tetris-pause-btn');
  if(btn)btn.textContent=tetPaused?'Weiter':'Pause';
  if(tetPaused){
    if(tetPhysInt){clearInterval(tetPhysInt);tetPhysInt=null;}
  } else {
    // Restart physics interval  
    tetPhysInt=setInterval(()=>{
      if(!tetRunning||tetPaused)return;
      if(!tetCollide(tetPiece,0,1)){tetPiece.y++;}
      else{tetLock();}
    },tetDropMs());
  }
}
function tetNewPiece(){const idx=Math.floor(Math.random()*7);return{shape:TETS[idx].map(r=>[...r]),color:TET_COLORS[idx]};}
function tetSpawn(){const p=tetNext||tetNewPiece();tetNext=tetNewPiece();tetDrawNext();return{...p,x:3,y:0};}
function tetDrawNext(){
  const cv=document.getElementById('tetris-next');if(!cv)return;
  const ctx=cv.getContext('2d');const SZ=12;
  ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,60,60);
  if(!tetNext)return;
  const offX=Math.floor((5-tetNext.shape[0].length)/2)*SZ;
  const offY=Math.floor((5-tetNext.shape.length)/2)*SZ;
  tetNext.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.fillStyle=tetNext.color;ctx.fillRect(offX+c*SZ,offY+r*SZ,SZ-1,SZ-1);}}));
}
function tetCollide(piece,dx,dy,shape){
  const s=shape||piece.shape;
  return s.some((row,r)=>row.some((v,c)=>{
    if(!v)return false;
    const nx=piece.x+c+dx,ny=piece.y+r+dy;
    return nx<0||nx>=10||ny>=20||(ny>=0&&tetBoard[ny][nx]);
  }));
}
function tetLock(){
  tetPiece.shape.forEach((row,r)=>row.forEach((v,col)=>{if(v&&tetPiece.y+r>=0)tetBoard[tetPiece.y+r][tetPiece.x+col]=tetPiece.color;}));
  let cleared=0;
  for(let r=19;r>=0;r--){if(tetBoard[r].every(v=>v)){tetBoard.splice(r,1);tetBoard.unshift(Array(10).fill(0));cleared++;r++;}}
  if(cleared){
    const points=[0,100,300,500,800][cleared]*tetLevel;
    tetScore+=points;tetLines+=cleared;
    tetLevel=Math.floor(tetLines/10)+{easy:1,medium:3,hard:6}[tetDiff];
    const s=document.getElementById('tetris-score');const l=document.getElementById('tetris-level');
    if(s)s.textContent=tetScore;if(l)l.textContent=tetLevel;
    // Update drop speed
    if(tetPhysInt){clearInterval(tetPhysInt);tetPhysInt=setInterval(()=>{if(!tetRunning||tetPaused)return;if(!tetCollide(tetPiece,0,1)){tetPiece.y++;}else{tetLock();}},tetDropMs());}
  }
  tetPiece=tetSpawn();
  if(tetCollide(tetPiece,0,0)){
    tetRunning=false;
    if(tetRafId){cancelAnimationFrame(tetRafId);tetRafId=null;}
    if(tetScore>tetBest){tetBest=tetScore;localStorage.setItem('tetris_best',tetBest);const b=document.getElementById('tetris-best');if(b)b.textContent=tetBest;}
    const cv=document.getElementById('tetris-canvas');if(!cv)return;
    const ctx=cv.getContext('2d');ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,160,200,60);
    ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER: '+tetScore,100,195);
  }
}
function tetTick(){if(!tetRunning||tetPaused)return;if(tetCollide(tetPiece,0,1)){tetLock();}else{tetPiece.y++;tetDraw();}}
function tetDraw(){
  const cv=document.getElementById('tetris-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');const SZ=20;
  ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,200,400);
  // Grid lines
  ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=0.5;
  for(let r=0;r<20;r++){ctx.beginPath();ctx.moveTo(0,r*SZ);ctx.lineTo(200,r*SZ);ctx.stroke();}
  for(let c=0;c<10;c++){ctx.beginPath();ctx.moveTo(c*SZ,0);ctx.lineTo(c*SZ,400);ctx.stroke();}
  // Board
  tetBoard.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.fillStyle=v;ctx.fillRect(c*SZ+1,r*SZ+1,SZ-2,SZ-2);}}));
  // Ghost
  let ghostY=tetPiece.y;
  while(!tetCollide({...tetPiece,y:ghostY+1},0,0))ghostY++;
  tetPiece.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect((tetPiece.x+c)*SZ+1,(ghostY+r)*SZ+1,SZ-2,SZ-2);}}));
  // Piece
  tetPiece.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v&&tetPiece.y+r>=0){ctx.fillStyle=tetPiece.color;ctx.fillRect((tetPiece.x+c)*SZ+1,(tetPiece.y+r)*SZ+1,SZ-2,SZ-2);}}));
}


// Tetris keyboard handler
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-tetris')return;
  const K=customKeys||{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
  if(e.key===K.left||e.key==='a'||e.key==='A'){e.preventDefault();tetMove(-1);}
  else if(e.key===K.right||e.key==='d'||e.key==='D'){e.preventDefault();tetMove(1);}
  else if(e.key===K.up||e.key==='w'||e.key==='W'){e.preventDefault();tetRotate();}
  else if(e.key===K.down||e.key==='s'||e.key==='S'){e.preventDefault();tetSoftDrop();}
  else if(e.key===' '){e.preventDefault();tetHardDrop();}
  else if(e.key==='p'||e.key==='P'){tetrisPause();}
});
