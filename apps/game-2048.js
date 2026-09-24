/* ══════════════════════════════════
   2048
══════════════════════════════════ */
let g2048Grid=[],g2048Score=0,g2048Best2=0,g2048Over=false,g2048Diff=(localStorage.getItem('zf_default_diff')||'medium'),g2048Goal={easy:512,medium:1024,hard:2048}[g2048Diff]||1024;
function g2048SetDiff(d){
  g2048Diff=d;g2048Goal={easy:512,medium:1024,hard:2048}[d];
  ['easy','medium','hard'].forEach(x=>{const b=document.getElementById('g2048-diff-'+x);if(b)b.classList.toggle('active',x===d);});
  g2048New();
}
function g2048New(){
  g2048Grid=Array(4).fill(null).map(()=>Array(4).fill(0));
  g2048Score=0;g2048Over=false;g2048Best2=parseInt(localStorage.getItem('g2048_best')||'0');
  g2048AddTile();g2048AddTile();g2048Render();
  const s=document.getElementById('g2048-score');const b=document.getElementById('g2048-best');const m=document.getElementById('g2048-msg');
  if(s)s.textContent=0;if(b)b.textContent=g2048Best2;if(m)m.textContent='';
}
function g2048AddTile(){
  const empty=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(!g2048Grid[r][c])empty.push([r,c]);
  if(!empty.length)return;
  const [r,c]=empty[Math.floor(Math.random()*empty.length)];g2048Grid[r][c]=Math.random()<0.9?2:4;
}
function g2048SlideRow(row){const nums=row.filter(v=>v);const merged=[];let skip=false;
  for(let i=0;i<nums.length;i++){if(!skip&&i+1<nums.length&&nums[i]===nums[i+1]){merged.push(nums[i]*2);g2048Score+=nums[i]*2;skip=true;}else if(!skip){merged.push(nums[i]);}else skip=false;}
  while(merged.length<4)merged.push(0);return merged;
}
function g2048Move(dir){
  if(g2048Over)return;
  const prev=JSON.stringify(g2048Grid);
  if(dir==='left')g2048Grid=g2048Grid.map(r=>g2048SlideRow(r));
  else if(dir==='right')g2048Grid=g2048Grid.map(r=>g2048SlideRow([...r].reverse()).reverse());
  else if(dir==='up'){g2048Grid=g2048Grid[0].map((_,c)=>g2048Grid.map(r=>r[c])).map(r=>g2048SlideRow(r));g2048Grid=g2048Grid[0].map((_,c)=>g2048Grid.map(r=>r[c]));}
  else if(dir==='down'){g2048Grid=g2048Grid[0].map((_,c)=>g2048Grid.map(r=>r[c])).map(r=>g2048SlideRow([...r].reverse()).reverse());g2048Grid=g2048Grid[0].map((_,c)=>g2048Grid.map(r=>r[c]));}
  if(JSON.stringify(g2048Grid)!==prev){
    g2048AddTile();
    const s=document.getElementById('g2048-score');if(s)s.textContent=g2048Score;
    if(g2048Score>g2048Best2){g2048Best2=g2048Score;localStorage.setItem('g2048_best',g2048Best2);const b=document.getElementById('g2048-best');if(b)b.textContent=g2048Best2;}
    if(g2048Grid.flat().includes(g2048Goal)){const m=document.getElementById('g2048-msg');if(m){m.textContent='🎉 Gewonnen! '+g2048Goal+' erreicht!';m.style.color='#34c759';}}
    const hasMoves=g2048Grid.flat().includes(0)||g2048Grid.some((r,ri)=>r.some((v,ci)=>(ci<3&&v===r[ci+1])||(ri<3&&v===g2048Grid[ri+1][ci])));
    if(!hasMoves){g2048Over=true;const m=document.getElementById('g2048-msg');if(m){m.textContent='Game Over!';m.style.color='var(--danger)';}}
    g2048Render();
  }
}
const G2048_COLORS={0:'#cdc1b4',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
function g2048Render(){
  const board=document.getElementById('g2048-board');if(!board)return;
  board.innerHTML=g2048Grid.flat().map(v=>`<div style="width:88px;height:88px;background:${G2048_COLORS[v]||'#3c3a32'};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:${v>999?20:v>99?24:28}px;font-weight:900;color:${v<=4?'#776e65':'#f9f6f2'}">${v||''}</div>`).join('');
}

// Touch support
let g2048TouchStart={};
document.addEventListener('touchstart',e=>{if(document.querySelector('.screen.active')?.id!=='screen-g2048')return;g2048TouchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
document.addEventListener('touchend',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-g2048')return;
  const dx=e.changedTouches[0].clientX-g2048TouchStart.x;const dy=e.changedTouches[0].clientY-g2048TouchStart.y;
  if(Math.abs(dx)>Math.abs(dy)){g2048Move(dx>0?'right':'left');}else{g2048Move(dy>0?'down':'up');}
},{passive:true});

// 2048 keyboard
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-g2048')return;
  const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',
    a:'left',d:'right',w:'up',s:'down',A:'left',D:'right',W:'up',S:'down'};
  if(map[e.key]){e.preventDefault();g2048Move(map[e.key]);}
});
