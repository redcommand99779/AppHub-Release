/* ══════════════════════════════════
   FLAPPY BIRD
══════════════════════════════════ */
let flappyRunning=false,flappyScore=0,flappyBest2=0,flappyBird={y:200,vy:0},
    flappyPipes=[],flappyInterval=null,flappyDiff='easy',flappyGap=180;
function flappySetDiff(d){
  flappyDiff=d;flappyGap={easy:180,medium:140,hard:110}[d];
  ['easy','medium','hard'].forEach(x=>{const b=document.getElementById('flappy-diff-'+x);if(b)b.classList.toggle('active',x===d);});
}
function flappyInit(){
  const cv=document.getElementById('flappy-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#70c5ce';ctx.fillRect(0,0,320,480);
  ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('Klicken zum Starten',160,240);
  flappyBest2=parseInt(localStorage.getItem('flappy_best')||'0');
  const b=document.getElementById('flappy-best');if(b)b.textContent=flappyBest2;
}
function flappyStop(){clearInterval(flappyInterval);flappyRunning=false;}
function flappyBegin(){
  if(flappyRunning){flappyJump();return;}
  clearInterval(flappyInterval);
  flappyScore=0;flappyBird={y:200,vy:0};flappyPipes=[];flappyRunning=true;
  const s=document.getElementById('flappy-score');if(s)s.textContent=0;
  let frame=0;
  flappyInterval=setInterval(()=>{
    frame++;
    flappyBird.vy+=0.5;flappyBird.y+=flappyBird.vy;
    if(frame%60===0){const top=50+Math.random()*(480-flappyGap-100);flappyPipes.push({x:320,top,gap:flappyGap,counted:false});}
    flappyPipes.forEach(p=>{p.x-={easy:2,medium:3,hard:4}[flappyDiff];if(!p.counted&&p.x<60){p.counted=true;flappyScore++;const s=document.getElementById('flappy-score');if(s)s.textContent=flappyScore;}});
    flappyPipes=flappyPipes.filter(p=>p.x>-60);
    const dead=flappyBird.y<0||flappyBird.y>460||flappyPipes.some(p=>p.x<80&&p.x>20&&(flappyBird.y<p.top||flappyBird.y>p.top+p.gap));
    if(dead){clearInterval(flappyInterval);flappyRunning=false;if(flappyScore>flappyBest2){flappyBest2=flappyScore;localStorage.setItem('flappy_best',flappyBest2);const b=document.getElementById('flappy-best');if(b)b.textContent=flappyBest2;}}
    flappyDraw();
  },1000/60);
}
function flappyJump(){if(!flappyRunning){flappyBegin();return;}flappyBird.vy=-8;}
function flappyDraw(){
  const cv=document.getElementById('flappy-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#70c5ce';ctx.fillRect(0,0,320,480);
  flappyPipes.forEach(p=>{ctx.fillStyle='#5d8a1c';ctx.fillRect(p.x-15,0,30,p.top);ctx.fillRect(p.x-20,p.top-10,40,10);ctx.fillRect(p.x-15,p.top+p.gap,30,480-p.top-p.gap);ctx.fillRect(p.x-20,p.top+p.gap,40,10);});
  ctx.fillStyle='#ffcc00';ctx.beginPath();ctx.arc(60,flappyBird.y,14,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff6600';ctx.beginPath();ctx.moveTo(74,flappyBird.y-3);ctx.lineTo(84,flappyBird.y);ctx.lineTo(74,flappyBird.y+3);ctx.fill();
  ctx.fillStyle='#333';ctx.beginPath();ctx.arc(66,flappyBird.y-4,3,0,Math.PI*2);ctx.fill();
  if(!flappyRunning){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,180,320,80);ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('Game Over: '+flappyScore,160,210);ctx.font='14px sans-serif';ctx.fillText('Klicken für Neustart',160,240);}
}
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-flappy')return;
  if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();flappyJump();}
});

