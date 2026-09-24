/* Hintergrund: dunkler Farbverlauf mit dezentem Raster */
function boBg(ctx){
  const g=ctx.createLinearGradient(0,0,0,360);g.addColorStop(0,'#0f1220');g.addColorStop(1,'#1c2138');
  ctx.fillStyle=g;ctx.fillRect(0,0,480,360);
  ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1;
  for(let x=0;x<480;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,360);ctx.stroke();}
  for(let y=0;y<360;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(480,y);ctx.stroke();}
}
/* ══════════════════════════════════
   BREAKOUT
══════════════════════════════════ */
let boRunning=false,boRafId=null,boBall={x:240,y:250,vx:3,vy:-3},boPaddle={x:190,w:100},boBricks=[],boScore=0,boLives=3,boDiff='easy',boMouseX=0,boLevel=1,boFreeze=0;
function boSetDiff(d){boDiff=d;['easy','medium','hard'].forEach(x=>document.getElementById('bo-diff-'+x)?.classList.toggle('active',x===d));}
function boStop(){if(boRafId)cancelAnimationFrame(boRafId);boRunning=false;}
function boInit(){
  const cv=document.getElementById('bo-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  boBg(ctx);
  ctx.textAlign='center';ctx.font='46px sans-serif';ctx.fillText('🧱',240,165);
  ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold 16px sans-serif';ctx.fillText('Klicken zum Starten',240,205);
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
  boScore=0;boLives=3;boLevel=1;boFreeze=0;
  boBall={x:240,y:250,vx:{easy:2.5,medium:3.5,hard:4.5}[boDiff],vy:-{easy:2.5,medium:3.5,hard:4.5}[boDiff]};
  boPaddle={x:190,w:{easy:120,medium:90,hard:70}[boDiff]};
  boMouseX=boPaddle.x; // Schläger startet in der Mitte statt am linken Rand
  boKeys.left=boKeys.right=false;
  boMakeBricks();boRunning=true;
  const s=document.getElementById('bo-score');const l=document.getElementById('bo-lives');
  if(s)s.textContent=0;if(l)l.textContent='❤️❤️❤️';
  cv.onmousemove=e=>{const rect=cv.getBoundingClientRect();boMouseX=e.clientX-rect.left-boPaddle.w/2;};
  function loop(){
    if(!boRunning)return;
    const cv2=document.getElementById('bo-canvas');if(!cv2)return;
    const ctx=cv2.getContext('2d');
    // Move paddle: gehaltene Pfeiltaste bewegt den Schläger gleichmäßig in jedem Bild (keine Tastenwiederholungs-Pause)
    if(boKeys.left)boMouseX-=boKeySpeed;
    if(boKeys.right)boMouseX+=boKeySpeed;
    boMouseX=Math.max(0,Math.min(480-boPaddle.w,boMouseX));
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
      if(boLives<=0){boRunning=false;const ctx2=cv2.getContext('2d');ctx2.fillStyle='rgba(0,0,0,0.55)';ctx2.fillRect(0,0,480,360);ctx2.fillStyle='rgba(20,24,36,0.94)';ctx2.beginPath();ctx2.roundRect?ctx2.roundRect(120,110,240,150,18):ctx2.rect(120,110,240,150);ctx2.fill();ctx2.textAlign='center';ctx2.fillStyle='#ff5a52';ctx2.font='bold 22px sans-serif';ctx2.fillText('GAME OVER',240,150);ctx2.fillStyle='#fff';ctx2.font='bold 36px sans-serif';ctx2.fillText(String(boScore),240,198);ctx2.fillStyle='rgba(255,255,255,0.7)';ctx2.font='13px sans-serif';ctx2.fillText('Level '+boLevel+' · Klicken für Neustart',240,232);cv2.onclick=boBegin;return;}
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
    // Kurze Pause zu Beginn eines Levels: der Ball wartet über dem Schläger
    if(boFreeze>0){boFreeze--;boBall.x=boPaddle.x+boPaddle.w/2;boBall.y=250;}
    // Alle Steine weg -> nächstes Level: neues Feld, Ball etwas schneller, Bonuspunkte
    else if(boBricks.every(b=>!b.alive)){
      boLevel++;boScore+=100;
      const s2=document.getElementById('bo-score');if(s2)s2.textContent=boScore;
      boMakeBricks();
      const base={easy:2.5,medium:3.5,hard:4.5}[boDiff],sp=Math.min(7,base*Math.pow(1.08,boLevel-1));
      boBall={x:boPaddle.x+boPaddle.w/2,y:250,vx:(Math.random()<0.5?-1:1)*sp*0.7,vy:-sp};
      boFreeze=75;
      if(typeof sfx==='function')sfx('win');
    }
    // Draw
    boBg(ctx);
    boBricks.forEach(b=>{if(!b.alive)return;
      ctx.fillStyle=b.color;ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x,b.y,b.w,b.h,4):ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();
      const g=ctx.createLinearGradient(0,b.y,0,b.y+b.h);g.addColorStop(0,'rgba(255,255,255,0.4)');g.addColorStop(0.55,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,0.3)');
      ctx.fillStyle=g;ctx.beginPath();ctx.roundRect?ctx.roundRect(b.x,b.y,b.w,b.h,4):ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();});
    // Ball mit Leuchten
    ctx.save();ctx.shadowColor='rgba(255,255,255,0.9)';ctx.shadowBlur=12;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(boBall.x,boBall.y,7,0,Math.PI*2);ctx.fill();ctx.restore();
    // Schläger mit Farbverlauf
    const pg=ctx.createLinearGradient(0,325,0,335);pg.addColorStop(0,'#e8eefc');pg.addColorStop(1,'#7f93c9');
    ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect?ctx.roundRect(boPaddle.x,325,boPaddle.w,10,5):ctx.rect(boPaddle.x,325,boPaddle.w,10);ctx.fill();
    if(boFreeze>0){
      ctx.fillStyle='rgba(20,24,36,0.78)';ctx.beginPath();ctx.roundRect?ctx.roundRect(150,150,180,70,16):ctx.rect(150,150,180,70);ctx.fill();
      ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 26px sans-serif';ctx.fillText('LEVEL '+boLevel,240,185);
      ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='12px sans-serif';ctx.fillText('+100 Bonus',240,206);
    }
    boRafId=requestAnimationFrame(loop);
  }
  boRafId=requestAnimationFrame(loop);
}
/* Tastensteuerung über Zustand statt Einzel-Ereignisse: Taste gedrückt = bewegen, losgelassen = stopp */
const boKeys={left:false,right:false},boKeySpeed=7;
function boKeyMap(e){
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')return 'left';
  if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')return 'right';
  return null;
}
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-breakout')return;
  const k=boKeyMap(e);if(!k)return;
  e.preventDefault();boKeys[k]=true;
});
document.addEventListener('keyup',e=>{const k=boKeyMap(e);if(k)boKeys[k]=false;});
window.addEventListener('blur',()=>{boKeys.left=boKeys.right=false;});
