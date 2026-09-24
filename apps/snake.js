/* ── Snake ── */
let snakeGame=null,snakeLastTime=null,snakeAcc=0;
function snakeInit(){
  const cv=document.getElementById('snake-canvas');if(!cv)return;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='var(--surface)';ctx.fillRect(0,0,320,320);
  ctx.fillStyle='#888';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText('Auf Start klicken',160,160);
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
    const ctx=cv.getContext('2d');ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,320,320);
    ctx.fillStyle='#34c759';game.snake.forEach(s=>ctx.fillRect(s.x*SZ+1,s.y*SZ+1,SZ-2,SZ-2));
    ctx.fillStyle='#ff3b30';ctx.fillRect(game.food.x*SZ+2,game.food.y*SZ+2,SZ-4,SZ-4);
  }
  function tick(){
    if(!game.running)return;
    const head={x:game.snake[0].x+game.dir.x,y:game.snake[0].y+game.dir.y};
    if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||game.snake.some(s=>s.x===head.x&&s.y===head.y)){
      game.running=false;clearInterval(game.interval);
      const best=parseInt(localStorage.getItem('zf_snake_best')||'0');
      if(game.score>best)localStorage.setItem('zf_snake_best',game.score);
      const ctx=cv.getContext('2d');ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,130,320,60);
      ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER: '+game.score,160,165);
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
