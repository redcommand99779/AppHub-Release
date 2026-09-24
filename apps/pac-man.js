/* ══════════════════════════════════
   PAC-MAN
══════════════════════════════════ */
let pacCtx=null,pacRunning=false,pacScore=0,pacLives=3,pacInterval=null,pacDiff='easy',pacCurrentLevel=0,pacTotalScore=0;

function pacSetDiff(d){
  pacDiff=d;
  ['easy','medium','hard','hell'].forEach(x=>{
    const b=document.getElementById('pac-diff-'+x);
    if(b)b.classList.toggle('active',x===d);
  });
}
function pacStop(){if(pacInterval?.cancel)pacInterval.cancel();else clearInterval(pacInterval);pacRunning=false;}
function pacInit(){
  const cv=document.getElementById('pac-canvas');if(!cv)return;
  pacCtx=cv.getContext('2d');
  pacCtx.fillStyle='#000';pacCtx.fillRect(0,0,420,420);
  pacCtx.fillStyle='#ffcc00';pacCtx.font='bold 22px sans-serif';pacCtx.textAlign='center';
  pacCtx.fillText('PAC-MAN',210,195);
  pacCtx.fillStyle='#aaa';pacCtx.font='13px sans-serif';
  pacCtx.fillText('Level wählen oder Starten',210,225);
}

// ── 5 hand-crafted level maps (21×21 grids) ──────────────────────────────
// 1=wall, 2=dot, 3=power, 0=empty
const PAC_LEVELS=(()=>{
  function mk(rows){
    const W=rows[0].length;
    return rows.map(r=>[...r.padEnd(W,'#')].map(ch=>ch==='#'?1:ch==='.'?2:ch==='o'?3:0));
  }
  return [
    mk(['###################',
        '#o..#.......#..o..#',
        '#.##.###.#.###.##.#',
        '#.................#',
        '#.##.#.#####.#.##.#',
        '#....#...#...#....#',
        '####.###   ###.####',
        '####.#       #.####',
        '     .   #   .     ',
        '####.#       #.####',
        '####.#       #.####',
        '####.#       #.####',
        '#o.......#.......o#',
        '#.##.###.#.###.##.#',
        '#..#...........#..#',
        '##.#.#.#####.#.#.##',
        '#....#...#...#....#',
        '#.######.#.######.#',
        '###################']),
    mk(['###################',
        '#o...#.......#...o#',
        '#.#.###.###.###.#.#',
        '#.#...........#.#.#',
        '#.#.#########.#.#.#',
        '#...#.......#...#.#',
        '#####.#####.#####.#',
        '#...#.......#...#.#',
        '#.#.###.###.###.#.#',
        '#.#...........#.#.#',
        '#o..#.......#...o.#',
        '#.#.#.#####.#.#.#.#',
        '#...#.......#...#.#',
        '#.###.#####.#.###.#',
        '#.................#',
        '#.##.###.#.###.##.#',
        '#..#...........#..#',
        '##.#.#.#####.#.#.##',
        '###################']),
    mk(['###################',
        '#o.................#',
        '#.###############.#',
        '#.#o...........#..#',
        '#.#.###########.#.#',
        '#.#.#.........#.#.#',
        '#.#.#.#######.#.#.#',
        '#.#.#.#.....#.#.#.#',
        '#.#.#.#.###.#.#.#.#',
        '#.#.#...#.#...#.#.#',
        '#.#.#######.###.#.#',
        '#.#.........#...#.#',
        '#.#.###.###.#.#.#.#',
        '#.#...#...#.#.#.#.#',
        '#.###.###.#.#.###.#',
        '#.....#...#.......#',
        '#.###.#.#########.#',
        'o.................o#',
        '###################']),
    mk(['###################',
        '#o.#...#.#...#.#.o#',
        '#.#.#.#.#.#.#.#.#.#',
        '#...#...#...#...#.#',
        '###.#.###.###.#.###',
        '#...#.........#...#',
        '#.###.#.###.#.###.#',
        '#.....#.....#.....#',
        '###.#.#####.#.#.###',
        '#...#.......#...#.#',
        '#.#.#.#.#.#.#.#.#.#',
        '#.#...#.#.#...#.#.#',
        '#.#####.#.#####.#.#',
        '#o....#...#....o#.#',
        '#.###.#.#.#.###.#.#',
        '#.#...#.#.#...#.#.#',
        '#.#.###.#.###.#.#.#',
        '#...............#.#',
        '###################']),
    mk(['###################',
        '#o...............o#',
        '#.#####.#.#.#####.#',
        '#.#...#.#.#.#...#.#',
        '#.#.#.#.#.#.#.#.#.#',
        '#...#.#.#.#.#.#...#',
        '###.#.#####.#.#.###',
        '#...#.......#...#.#',
        '#.###.#.#.#.###.#.#',
        '#.....#.#.#.....#.#',
        '#.###.#####.###.#.#',
        '#.#.#.......#.#.#.#',
        '#.#.#.#####.#.#.#.#',
        '#...#.#...#.#...#.#',
        '###.#.#.#.#.#.#.###',
        '#...#...#...#...#.#',
        '#.#####.#.#####.#.#',
        '#o...............o#',
        '###################']),
  ];
})();

const PAC_GHOST_COLORS=['#ff0000','#ffb8ff','#00ffff','#ffb852'];
let pacMap=[],pacP={x:10,y:17,dx:0,dy:0,ndx:0,ndy:0},pacGhosts=[],pacPower=false,pacPowerTimer=null,pacDots=0,pacLevelNum=0;

function pacStart(levelIdx){
  // Stop previous game
  if(pacInterval&&pacInterval.cancel)pacInterval.cancel();
  if(pacRafId){cancelAnimationFrame(pacRafId);pacRafId=null;}

  // Load level
  if(levelIdx!=null&&levelIdx>=0)pacCurrentLevel=levelIdx;
  else if(levelIdx===-1)pacCurrentLevel=Math.floor(Math.random()*PAC_LEVELS.length);
  pacCurrentLevel=Math.min(pacCurrentLevel,PAC_LEVELS.length-1);
  pacLevelNum=pacCurrentLevel+1;
  const lv=document.getElementById('pac-level');if(lv)lv.textContent=pacLevelNum;

  const src=PAC_LEVELS[pacCurrentLevel]||PAC_LEVELS[0];
  const ROWS=src.length, COLS=src[0].length;
  pacMap=src.map(r=>[...r]);
  pacDots=pacMap.flat().filter(v=>v===2||v===3).length;
  pacScore=0;pacLives=3;pacPower=false;clearTimeout(pacPowerTimer);

  // Canvas setup
  const cv=document.getElementById('pac-canvas');
  if(!cv)return;
  pacCtx=cv.getContext('2d');
  const SZ=Math.floor(418/Math.max(COLS,ROWS));
  const offX=Math.floor((418-COLS*SZ)/2),offY=Math.floor((418-ROWS*SZ)/2);

  // Find spawn point (non-wall, lower center)
  let sx=Math.floor(COLS/2), sy=Math.floor(ROWS*0.7);
  for(let dist=0; dist<ROWS+COLS; dist++){
    const candidates=[[sx,sy],[sx,sy-dist],[sx,sy+dist],[sx-dist,sy],[sx+dist,sy]];
    const found=candidates.find(([tx,ty])=>tx>=0&&tx<COLS&&ty>=0&&ty<ROWS&&pacMap[ty][tx]!==1);
    if(found){[sx,sy]=found;break;}
  }
  pacP={x:sx,y:sy,dx:1,dy:0,ndx:1,ndy:0};

  // Place ghosts at far corners/edges
  const customGhostInput=document.getElementById('pac-ghost-custom');
  const customGhostVal=customGhostInput&&customGhostInput.value?parseInt(customGhostInput.value):0;
  const ghostCount=customGhostVal>0?Math.min(10,Math.max(1,customGhostVal)):({easy:3,medium:4,hard:5,hell:6}[pacDiff]||3);
  const opens=[];
  for(let r=0;r<ROWS;r++) for(let cc=0;cc<COLS;cc++)
    if(pacMap[r][cc]!==1) opens.push({x:cc,y:r,d:Math.hypot(cc-sx,r-sy)});
  opens.sort((a,b)=>b.d-a.d);
  const placed=[];
  for(const cell of opens){
    if(placed.length>=ghostCount)break;
    if(cell.d<5)continue;
    if(placed.some(g=>Math.hypot(g.x-cell.x,g.y-cell.y)<4))continue;
    placed.push(cell);
  }
  while(placed.length<ghostCount&&opens.length>placed.length)placed.push(opens[placed.length]);
  const GHOST_MODES=['chase','ambush','scatter','random'];
  pacGhosts=placed.slice(0,ghostCount).map((p,i)=>({
    x:p.x,y:p.y,dx:1,dy:0,
    color:PAC_GHOST_COLORS[i%PAC_GHOST_COLORS.length],
    mode:GHOST_MODES[i%GHOST_MODES.length]
  }));

  // Update UI
  const sEl=document.getElementById('pac-score');if(sEl)sEl.textContent=0;
  const lEl=document.getElementById('pac-lives');if(lEl)lEl.textContent='🟡🟡🟡';
  const btn=document.getElementById('pac-btn');if(btn)btn.textContent='Neustart';
  pacRunning=true;

  // Focus canvas for key input
  setTimeout(()=>cv.focus(),100);

  const pacSpeed={easy:160,medium:130,hard:100,hell:70}[pacDiff]||160;
  const gNormal={easy:220,medium:170,hard:120,hell:80}[pacDiff]||220;
  const gPower=Math.round(pacSpeed*2.5);

  // --- Physics: runs every pacSpeed ms ---
  function physStep(){
    if(!pacRunning)return;
    // Try buffered direction first
    const nnx=pacP.x+pacP.ndx, nny=pacP.y+pacP.ndy;
    if((pacP.ndx!==pacP.dx||pacP.ndy!==pacP.dy)&&
       nnx>=0&&nnx<COLS&&nny>=0&&nny<ROWS&&pacMap[nny][nnx]!==1){
      pacP.dx=pacP.ndx;pacP.dy=pacP.ndy;
    }
    const nx=pacP.x+pacP.dx, ny=pacP.y+pacP.dy;
    if(nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&pacMap[ny][nx]!==1){
      pacP.x=nx;pacP.y=ny;
      const cell=pacMap[ny][nx];
      if(cell===2){pacMap[ny][nx]=0;pacScore+=10;pacDots--;}
      else if(cell===3){
        pacMap[ny][nx]=0;pacScore+=50;pacDots--;
        pacPower=true;clearTimeout(pacPowerTimer);
        pacPowerTimer=setTimeout(()=>{pacPower=false;},7000);
      }
      const sE=document.getElementById('pac-score');if(sE)sE.textContent=pacScore;
    }
    // Tunnel wrap
    if(pacP.x<0)pacP.x=COLS-1;
    if(pacP.x>=COLS)pacP.x=0;
  }

  // --- Ghost AI ---
  function ghostStep(){
    if(!pacRunning)return;
    const spd=pacPower?gPower:gNormal;
    pacGhosts.forEach(g=>{
      const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      // Valid moves: in bounds, not wall, not reversing (unless trapped)
      let valid=dirs.filter(d=>{
        const nx=g.x+d.x, ny=g.y+d.y;
        return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&pacMap[ny][nx]!==1&&!(d.x===-g.dx&&d.y===-g.dy);
      });
      if(!valid.length) valid=dirs.filter(d=>{const nx=g.x+d.x,ny=g.y+d.y;return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&pacMap[ny][nx]!==1;});
      if(!valid.length)return;

      let chosen;
      if(pacPower){
        // Flee
        chosen=valid.reduce((b,d)=>Math.hypot(pacP.x-(g.x+d.x),pacP.y-(g.y+d.y))>Math.hypot(pacP.x-(g.x+b.x),pacP.y-(g.y+b.y))?d:b);
      } else {
        // Mode-based AI
        let targetX=pacP.x, targetY=pacP.y;
        if(g.mode==='ambush'){
          // Pinky: target 4 tiles ahead of pac-man
          targetX=pacP.x+pacP.dx*4;
          targetY=pacP.y+pacP.dy*4;
        } else if(g.mode==='scatter'){
          // Scatter to corner every ~10s
          const t=Date.now()/1000;
          if(Math.floor(t)%20<7){targetX=COLS-1;targetY=0;} // scatter corner
        } else if(g.mode==='random'){
          // 40% random, 60% chase
          if(Math.random()<0.4){chosen=valid[Math.floor(Math.random()*valid.length)];}
        }
        if(!chosen){
          chosen=valid.reduce((b,d)=>
            Math.hypot(targetX-(g.x+d.x),targetY-(g.y+d.y))<Math.hypot(targetX-(g.x+b.x),targetY-(g.y+b.y))?d:b
          );
        }
      }

      g.x+=chosen.x;g.y+=chosen.y;g.dx=chosen.x;g.dy=chosen.y;

      // Collision with pac-man
      if(g.x===pacP.x&&g.y===pacP.y){
        if(pacPower){
          pacScore+=200;g.x=sx;g.y=sy;
          const sE=document.getElementById('pac-score');if(sE)sE.textContent=pacScore;
        } else {
          pacLives--;
          const lE=document.getElementById('pac-lives');
          if(lE)lE.textContent='🟡'.repeat(Math.max(0,pacLives));
          if(pacLives<=0){
            pacRunning=false;
          } else {
            pacP.x=sx;pacP.y=sy;pacP.dx=1;pacP.dy=0;pacP.ndx=1;pacP.ndy=0;
          }
        }
      }
    });
    if(!pacDots&&pacRunning){
      pacRunning=false;
      if(pacCurrentLevel<PAC_LEVELS.length-1)setTimeout(()=>pacStart(pacCurrentLevel+1),1500);
    }
  }

  // Start intervals
  const physInt=setInterval(physStep,pacSpeed);
  const ghostInt=setInterval(ghostStep,gNormal);

  // rAF draw loop
  let angle=0;
  function drawLoop(){
    if(!pacRunning){pacDraw(COLS,ROWS,SZ,offX,offY,angle);return;}
    angle+=0.15;
    pacDraw(COLS,ROWS,SZ,offX,offY,angle);
    pacRafId=requestAnimationFrame(drawLoop);
  }
  pacRafId=requestAnimationFrame(drawLoop);
  pacInterval={cancel:()=>{clearInterval(physInt);clearInterval(ghostInt);if(pacRafId)cancelAnimationFrame(pacRafId);pacRafId=null;pacRunning=false;}};
}

function pacDraw(COLS,ROWS,SZ,offX,offY,angle){
  const cv=document.getElementById('pac-canvas');if(!cv||!pacCtx)return;
  if(offX===undefined){offX=Math.floor((418-COLS*SZ)/2);offY=Math.floor((418-ROWS*SZ)/2);}
  // Clear
  pacCtx.fillStyle='#000';pacCtx.fillRect(0,0,420,420);
  // Draw maze
  for(let r=0;r<ROWS;r++)for(let cc=0;cc<COLS;cc++){
    const v=pacMap[r][cc];
    if(v===1){pacCtx.fillStyle='#1a1aff';pacCtx.fillRect(offX+cc*SZ,offY+r*SZ,SZ,SZ);}
    else if(v===2){pacCtx.fillStyle='#ffcc00';pacCtx.beginPath();pacCtx.arc(offX+cc*SZ+SZ/2,offY+r*SZ+SZ/2,SZ*0.15,0,Math.PI*2);pacCtx.fill();}
    else if(v===3){pacCtx.fillStyle='#ffffff';pacCtx.beginPath();pacCtx.arc(offX+cc*SZ+SZ/2,offY+r*SZ+SZ/2,SZ*0.3,0,Math.PI*2);pacCtx.fill();}
  }
  // Draw pac-man
  const p=pacP;
  const mouth=0.25+Math.abs(Math.sin(angle||0))*0.25;
  const dir=Math.atan2(p.dy||0,p.dx||0);
  const px=offX+p.x*SZ+SZ/2, py=offY+p.y*SZ+SZ/2;
  pacCtx.fillStyle='#ffcc00';
  pacCtx.beginPath();
  pacCtx.moveTo(px,py);
  pacCtx.arc(px,py,SZ/2-1,dir+mouth,dir+Math.PI*2-mouth);
  pacCtx.closePath();pacCtx.fill();
  // Draw ghosts
  pacGhosts.forEach(g=>{
    const col=pacPower?'#4444ff':g.color;
    const gx=offX+g.x*SZ+SZ/2, gy=offY+g.y*SZ+SZ/2;
    const r=SZ/2-1;
    pacCtx.fillStyle=col;
    pacCtx.beginPath();
    pacCtx.arc(gx,gy-r*0.1,r,Math.PI,0);
    const y2=gy+r*0.85;
    pacCtx.lineTo(gx+r,y2);
    const waves=3,ww=(r*2)/waves;
    for(let i=0;i<waves;i++){
      const wx=gx+r-ww*(i+0.5);
      pacCtx.arc(wx,y2,ww/2,0,Math.PI,i%2===0);
    }
    pacCtx.lineTo(gx-r,gy-r*0.1);
    pacCtx.closePath();pacCtx.fill();
    // Eyes
    if(!pacPower){
      pacCtx.fillStyle='#fff';
      pacCtx.beginPath();pacCtx.ellipse(gx-r*0.35,gy-r*0.1,r*0.27,r*0.33,0,0,Math.PI*2);pacCtx.fill();
      pacCtx.beginPath();pacCtx.ellipse(gx+r*0.35,gy-r*0.1,r*0.27,r*0.33,0,0,Math.PI*2);pacCtx.fill();
      pacCtx.fillStyle='#00f';
      pacCtx.beginPath();pacCtx.ellipse(gx-r*0.28,gy-r*0.1,r*0.13,r*0.17,0,0,Math.PI*2);pacCtx.fill();
      pacCtx.beginPath();pacCtx.ellipse(gx+r*0.42,gy-r*0.1,r*0.13,r*0.17,0,0,Math.PI*2);pacCtx.fill();
    }
  });
  if(!pacRunning){
    pacCtx.fillStyle='rgba(0,0,0,0.65)';pacCtx.fillRect(0,190,420,60);
    pacCtx.fillStyle='#fff';pacCtx.font='bold 20px sans-serif';pacCtx.textAlign='center';
    pacCtx.fillText(pacDots>0?'GAME OVER – '+pacScore+' Pkt':'🎉 LEVEL GESCHAFFT! '+pacScore+' Pkt',210,225);
  }
}
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-pacman'||!pacRunning)return;
  const dirs={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
    w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0},
    W:{x:0,y:-1},S:{x:0,y:1},A:{x:-1,y:0},D:{x:1,y:0}};
  const dir=dirs[e.key];
  if(dir&&typeof pacP!=='undefined'){e.preventDefault();pacP.ndx=dir.x;pacP.ndy=dir.y;}
});
