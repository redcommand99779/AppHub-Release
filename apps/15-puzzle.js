/* ══════════════════════════════════
   15-PUZZLE
══════════════════════════════════ */
let p15Tiles=[],p15N=4,p15Moves=0,p15Timer=null,p15Secs=0,p15Started=false;

function p15Solve(){
  if(!p15N||!p15Tiles||!p15Tiles.length)return; // not initialized yet
  const size=p15N*p15N;
  p15Tiles=Array.from({length:size},(_,i)=>i===size-1?0:i+1);
  p15Over=true;
  p15Render();
  const msg=document.getElementById('p15-msg');
  if(msg){msg.textContent='Gelöst! (Lösung angezeigt)';msg.style.color='var(--text-3)';}
}

function p15New(){
  p15N=parseInt(document.getElementById('p15-size')?.value||4);
  const total=p15N*p15N;
  p15Tiles=[...Array(total-1).keys()].map(i=>i+1);p15Tiles.push(0);
  // Shuffle (ensure solvable)
  do{for(let i=p15Tiles.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p15Tiles[i],p15Tiles[j]]=[p15Tiles[j],p15Tiles[i]];}}while(!p15IsSolvable());
  p15Moves=0;p15Secs=0;p15Started=false;
  clearInterval(p15Timer);
  const m=document.getElementById('p15-moves');const t=document.getElementById('p15-time');const msg=document.getElementById('p15-msg');
  if(m)m.textContent=0;if(t)t.textContent=0;if(msg)msg.textContent='';
  p15Render();
}
function p15IsSolvable(){
  const arr=p15Tiles.filter(x=>x!==0);let inv=0;
  for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++)if(arr[i]>arr[j])inv++;
  if(p15N%2===1)return inv%2===0;
  const blank=p15Tiles.indexOf(0);const row=Math.floor(blank/p15N);
  return(inv+row)%2===1;
}
function p15Click(i){
  const blank=p15Tiles.indexOf(0);const bi=blank%p15N,bj=Math.floor(blank/p15N);
  const ci=i%p15N,cj=Math.floor(i/p15N);
  if((Math.abs(ci-bi)+Math.abs(cj-bj))!==1)return;
  [p15Tiles[blank],p15Tiles[i]]=[p15Tiles[i],p15Tiles[blank]];
  p15Moves++;const m=document.getElementById('p15-moves');if(m)m.textContent=p15Moves;
  if(!p15Started){p15Started=true;clearInterval(p15Timer);p15Timer=setInterval(()=>{p15Secs++;const t=document.getElementById('p15-time');if(t)t.textContent=p15Secs;},1000);}
  p15Render();
  if(p15Tiles.every((v,i)=>v===(i===p15Tiles.length-1?0:i+1))){
    clearInterval(p15Timer);const msg=document.getElementById('p15-msg');if(msg){msg.textContent=`🎉 Gelöst in ${p15Moves} Zügen & ${p15Secs}s!`;msg.style.color='#34c759';}
  }
}
function p15Render(){
  const board=document.getElementById('p15-board');if(!board)return;
  const sz=Math.floor(440/p15N);
  board.style.gridTemplateColumns=`repeat(${p15N},${sz}px)`;
  board.innerHTML=p15Tiles.map((v,i)=>`<div onclick="p15Click(${i})" style="width:${sz}px;height:${sz}px;background:${v===0?'transparent':'var(--active-bg)'};border:${v===0?'none':'2px solid var(--accent)'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:${Math.max(16,sz/3)}px;font-weight:700;color:var(--text);cursor:${v===0?'default':'pointer'};user-select:none">${v||''}</div>`).join('');
}

