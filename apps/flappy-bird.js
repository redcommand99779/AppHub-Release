/* Optik: Himmel-Verlauf, Wolken, Röhren mit Kappen, Boden und ein Vogel mit Flügel */
function flappySky(ctx){
  const g=ctx.createLinearGradient(0,0,0,480);g.addColorStop(0,'#4fb3e8');g.addColorStop(0.7,'#a9e0f5');g.addColorStop(1,'#d8f3fb');
  ctx.fillStyle=g;ctx.fillRect(0,0,320,480);
  ctx.fillStyle='rgba(255,255,255,0.8)';
  [[50,80,26],[200,140,32],[120,240,22],[270,300,28]].forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.arc(x+r*0.9,y+4,r*0.75,0,Math.PI*2);ctx.arc(x-r*0.9,y+6,r*0.65,0,Math.PI*2);ctx.fill();});
}
function flappyPipe(ctx,x,y,h,cap,capAtBottom){
  if(h<=0)return;
  const g=ctx.createLinearGradient(x-15,0,x+15,0);g.addColorStop(0,'#3f7d1a');g.addColorStop(0.35,'#8bd450');g.addColorStop(1,'#3f7d1a');
  ctx.fillStyle=g;ctx.fillRect(x-15,y,30,h);
  const cy=capAtBottom?y+h-12:y;
  const g2=ctx.createLinearGradient(x-20,0,x+20,0);g2.addColorStop(0,'#376e15');g2.addColorStop(0.35,'#9be05f');g2.addColorStop(1,'#376e15');
  ctx.fillStyle=g2;ctx.fillRect(x-20,cy,40,12);
  ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1.5;ctx.strokeRect(x-20,cy,40,12);
}
function flappyGround(ctx){
  ctx.fillStyle='#ded895';ctx.fillRect(0,466,320,14);
  ctx.fillStyle='#8bc34a';ctx.fillRect(0,462,320,5);
}
function flappyBirdDraw(ctx,y,vy){
  ctx.save();ctx.translate(60,y);ctx.rotate(Math.max(-0.5,Math.min(0.9,vy*0.07)));
  ctx.fillStyle='#ffcc00';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.arc(-4,-5,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f5a000';ctx.beginPath();ctx.ellipse(-5,4,8,5,-0.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff6600';ctx.beginPath();ctx.moveTo(12,-2);ctx.lineTo(23,2);ctx.lineTo(12,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6,-5,4.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#222';ctx.beginPath();ctx.arc(7.5,-5,2,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
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
  flappySky(ctx);flappyGround(ctx);flappyBirdDraw(ctx,220,0);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,0.4)';ctx.shadowBlur=6;ctx.font='bold 20px sans-serif';ctx.fillText('Klicken zum Starten',160,300);ctx.shadowBlur=0;
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
  flappySky(ctx);
  flappyPipes.forEach(p=>{flappyPipe(ctx,p.x,0,p.top,true,true);flappyPipe(ctx,p.x,p.top+p.gap,462-p.top-p.gap,true,false);});
  flappyGround(ctx);
  flappyBirdDraw(ctx,flappyBird.y,flappyBird.vy||0);
  if(!flappyRunning){
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(0,0,320,480);
    ctx.fillStyle='rgba(20,24,36,0.92)';ctx.beginPath();ctx.roundRect?ctx.roundRect(40,170,240,120,16):ctx.rect(40,170,240,120);ctx.fill();
    ctx.textAlign='center';ctx.fillStyle='#ff5a52';ctx.font='bold 20px sans-serif';ctx.fillText('GAME OVER',160,205);
    ctx.fillStyle='#fff';ctx.font='bold 34px sans-serif';ctx.fillText(String(flappyScore),160,247);
    ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='13px sans-serif';ctx.fillText('Klicken für Neustart',160,272);
  }
}
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-flappy')return;
  if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();flappyJump();}
});

