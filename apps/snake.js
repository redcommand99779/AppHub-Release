/* ── Snake ── */
let snakeGame=null,snakeLastTime=null,snakeAcc=0;
/* Schachbrett-Hintergrund in dunklem Grün */
function snakeBg(ctx){
  for(let r=0;r<16;r++)for(let c=0;c<16;c++){ctx.fillStyle=(r+c)%2?'#1d2b22':'#18241c';ctx.fillRect(c*20,r*20,20,20);}
}
function snakeRR(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function snakeInit(){
  const cv=document.getElementById('snake-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  snakeBg(ctx);
  ctx.textAlign='center';ctx.font='48px sans-serif';ctx.fillText('🐍',160,150);
  ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold 16px sans-serif';ctx.fillText('Auf Start klicken',160,190);
  const best=parseInt(localStorage.getItem('zf_snake_best')||'0');
  const el=document.getElementById('snake-best');if(el)el.textContent=best;
}
function snakeStart(){
  if(snakeGame)clearInterval(snakeGame.interval);
  const cv=document.getElementById('snake-canvas');if(!cv)return;
  const SZ=20,COLS=16,ROWS=16;
  const game={snake:[{x:8,y:8}],dir:{x:1,y:0},food:{x:3,y:3},score:0,running:true};
  function placeFood(){game.food={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}
  function draw(){
    const ctx=cv.getContext('2d');snakeBg(ctx);
    // Futter: roter Apfel mit Glanzpunkt
    const fx=game.food.x*SZ+SZ/2,fy=game.food.y*SZ+SZ/2;
    ctx.save();ctx.shadowColor='rgba(255,59,48,0.8)';ctx.shadowBlur=10;ctx.fillStyle='#ff3b30';ctx.beginPath();ctx.arc(fx,fy,SZ/2-3,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(255,255,255,0.55)';ctx.beginPath();ctx.arc(fx-2.5,fy-3,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#43a047';ctx.fillRect(fx-1,fy-SZ/2+1,2,3);
    // Schlange: Farbverlauf vom Kopf zum Schwanz, abgerundete Segmente
    const n=game.snake.length;
    game.snake.forEach((s,i)=>{
      const t=n>1?i/(n-1):0,g=Math.round(199-t*70),b=Math.round(89-t*40);
      ctx.fillStyle=`rgb(${Math.round(52-t*20)},${g},${b})`;
      snakeRR(ctx,s.x*SZ+1,s.y*SZ+1,SZ-2,SZ-2,i===0?7:5);ctx.fill();
    });
    // Augen am Kopf
    const hd=game.snake[0],cx=hd.x*SZ+SZ/2,cy=hd.y*SZ+SZ/2,dx=game.dir.x,dy=game.dir.y;
    const px=-dy,py=dx; // Senkrechte zur Blickrichtung
    [1,-1].forEach(k=>{
      const ex=cx+dx*3+px*4*k,ey=cy+dy*3+py*4*k;
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey,2.6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ex+dx*0.8,ey+dy*0.8,1.3,0,Math.PI*2);ctx.fill();
    });
  }
  function tick(){
    if(!game.running)return;
    const head={x:game.snake[0].x+game.dir.x,y:game.snake[0].y+game.dir.y};
    if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||game.snake.some(s=>s.x===head.x&&s.y===head.y)){
      game.running=false;clearInterval(game.interval);
      const best=parseInt(localStorage.getItem('zf_snake_best')||'0');
      if(game.score>best)localStorage.setItem('zf_snake_best',game.score);
      const ctx=cv.getContext('2d');ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,320,320);
      ctx.fillStyle='rgba(20,20,20,0.85)';snakeRR(ctx,50,105,220,110,16);ctx.fill();
      ctx.textAlign='center';ctx.fillStyle='#ff5a52';ctx.font='bold 22px sans-serif';ctx.fillText('GAME OVER',160,142);
      ctx.fillStyle='#fff';ctx.font='bold 34px sans-serif';ctx.fillText(String(game.score),160,182);
      ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='12px sans-serif';ctx.fillText(game.score>best?'🏆 Neuer Rekord!':'Punkte',160,203);
      const el=document.getElementById('snake-best');if(el)el.textContent=Math.max(game.score,best);
      return;
    }
    game.snake.unshift(head);
    if(head.x===game.food.x&&head.y===game.food.y){game.score++;const el=document.getElementById('snake-score');if(el)el.textContent=game.score;placeFood();}
    else game.snake.pop();
    draw();
  }
  const snakeSpeed=150;
  function snakeRafLoop(ts){
    if(!game.running)return;
    if(snakeLastTime===null)snakeLastTime=ts;
    const dt=Math.min(ts-snakeLastTime,200);
    snakeLastTime=ts;
    snakeAcc+=dt;
    if(snakeAcc>=snakeSpeed){snakeAcc-=snakeSpeed;tick();}
    draw();
    snakeRafId=requestAnimationFrame(snakeRafLoop);
  }
  game.interval={cancel:()=>{if(snakeRafId)cancelAnimationFrame(snakeRafId);}};
  snakeGame=game;
  snakeLastTime=null;snakeAcc=0;
  snakeRafId=requestAnimationFrame(snakeRafLoop);
  draw();
  document.getElementById('snake-btn').textContent='Neustart';
}


// Snake keyboard handler
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-snake'||!snakeGame?.running)return;
  const K=customKeys||{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
  const maps={
    [K.up]:{x:0,y:-1},'w':{x:0,y:-1},'W':{x:0,y:-1},
    [K.down]:{x:0,y:1},'s':{x:0,y:1},'S':{x:0,y:1},
    [K.left]:{x:-1,y:0},'a':{x:-1,y:0},'A':{x:-1,y:0},
    [K.right]:{x:1,y:0},'d':{x:1,y:0},'D':{x:1,y:0}
  };
  const dir=maps[e.key];
  if(dir){
    e.preventDefault();
    // Prevent reversing
    if(snakeGame.dir.x+dir.x!==0||snakeGame.dir.y+dir.y!==0)
      snakeGame.dir=dir;
  }
});
