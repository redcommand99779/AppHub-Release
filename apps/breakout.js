/* ══════════════════════════════════
   BREAKOUT
══════════════════════════════════ */
let boRunning=false,boRafId=null,boBall={x:240,y:250,vx:3,vy:-3},boPaddle={x:190,w:100},boBricks=[],boScore=0,boLives=3,boDiff='easy',boMouseX=0;
function boSetDiff(d){boDiff=d;['easy','medium','hard'].forEach(x=>document.getElementById('bo-diff-'+x)?.classList.toggle('active',x===d));}
function boStop(){if(boRafId)cancelAnimationFrame(boRafId);boRunning=false;}
function boInit(){
  const cv=document.getElementById('bo-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#000';ctx.fillRect(0,0,480,360);
  ctx.fillStyle='#aaa';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Klicken zum Starten',240,180);
  cv.onclick=boBegin;
}
function boMakeBricks(){
  boBricks=[];
  const rows={easy:4,medium:6,hard:8}[boDiff];
  const cols=10;const W=44;const H=16;const PAD=4;
  const colors=['#ff3b30','#ff9500','#ffcc00','#34c759','#0071e3','#5856d6','#af52de','#ff2d55'];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    boBricks.push({x:c*(W+PAD)+8,y:r*(H+PAD)+40,w:W,h:H,color:colors[r%colors.length],alive:true});
  }
}
function boBegin(){
  const cv=document.getElementById('bo-canvas');if(!cv)return;
  cv.onclick=null;
  boScore=0;boLives=3;
  boBall={x:240,y:250,vx:{easy:2.5,medium:3.5,hard:4.5}[boDiff],vy:-{easy:2.5,medium:3.5,hard:4.5}[boDiff]};
  boPaddle={x:190,w:{easy:120,medium:90,hard:70}[boDiff]};
  boMakeBricks();boRunning=true;
  const s=document.getElementById('bo-score');const l=document.getElementById('bo-lives');
  if(s)s.textContent=0;if(l)l.textContent='❤️❤️❤️';
  cv.onmousemove=e=>{const rect=cv.getBoundingClientRect();boMouseX=e.clientX-rect.left-boPaddle.w/2;};
  function loop(){
    if(!boRunning)return;
    const cv2=document.getElementById('bo-canvas');if(!cv2)return;
    const ctx=cv2.getContext('2d');
    // Move paddle
    boPaddle.x=Math.max(0,Math.min(480-boPaddle.w,boMouseX));
    // Move ball
    boBall.x+=boBall.vx;boBall.y+=boBall.vy;
    // Wall bounce
    if(boBall.x<=6||boBall.x>=474)boBall.vx*=-1;
    if(boBall.y<=6)boBall.vy*=-1;
    // Paddle bounce
    if(boBall.y>=320&&boBall.y<=332&&boBall.x>=boPaddle.x&&boBall.x<=boPaddle.x+boPaddle.w){
      boBall.vy=Math.abs(boBall.vy)*-1;
      const rel=(boBall.x-(boPaddle.x+boPaddle.w/2))/(boPaddle.w/2);
      boBall.vx=rel*5;
    }
    // Ball lost
    if(boBall.y>360){
      boLives--;const l=document.getElementById('bo-lives');if(l)l.textContent=['','❤️','❤️❤️','❤️❤️❤️'][boLives]||'';
      if(boLives<=0){boRunning=false;const ctx2=cv2.getContext('2d');ctx2.fillStyle='rgba(0,0,0,0.7)';ctx2.fillRect(0,150,480,60);ctx2.fillStyle='#fff';ctx2.font='bold 22px sans-serif';ctx2.textAlign='center';ctx2.fillText('GAME OVER — '+boScore+' Punkte',240,185);return;}
      boBall={x:240,y:250,vx:boBall.vx,vy:-Math.abs(boBall.vy)};
    }
    // Brick collision
    boBricks.forEach(b=>{
      if(!b.alive)return;
      if(boBall.x>b.x&&boBall.x<b.x+b.w&&boBall.y>b.y&&boBall.y<b.y+b.h){
        b.alive=false;boBall.vy*=-1;boScore+=10;
        const s=document.getElementById('bo-score');if(s)s.textContent=boScore;
      }
    });
    if(boBricks.every(b=>!b.alive)){boRunning=false;boMakeBricks();boBall.vy=-Math.abs(boBall.vy);}
    // Draw
    ctx.fillStyle='#111';ctx.fillRect(0,0,480,360);
    boBricks.forEach(b=>{if(!b.alive)return;ctx.fillStyle=b.color;ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x,b.y,b.w,b.h,3):ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();});
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(boBall.x,boBall.y,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#aaa';ctx.beginPath();ctx.roundRect?ctx.roundRect(boPaddle.x,325,boPaddle.w,10,5):ctx.rect(boPaddle.x,325,boPaddle.w,10);ctx.fill();
    boRafId=requestAnimationFrame(loop);
  }
  boRafId=requestAnimationFrame(loop);
}
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-breakout')return;
  if(e.key==='ArrowLeft')boMouseX=Math.max(0,boMouseX-20);
  if(e.key==='ArrowRight')boMouseX=Math.min(480-boPaddle.w,boMouseX+20);
});
