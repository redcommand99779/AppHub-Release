/* ══════════════════════════════════
   VIER GEWINNT
══════════════════════════════════ */
let vgAiTimer=null;
let vgColors=['#ff3b30','#ffcc00'];
function vgName(t){if(typeof smPlayers!=='function')return t===1?'🔴 Rot':'🟡 Gelb';const p=smPlayers('vg')[t-1];return p.avatar+' '+p.name;}
let vgBoard=[],vgTurn=1,vgOver=false,vgModeAI=true,vgModeAI2=false,vgDiff=(localStorage.getItem('zf_default_diff')||'medium');
function vgSetMode(m){vgModeAI=m==='ai';if(typeof smRefresh==='function')smRefresh('vg');document.getElementById('vg-mode-ai')?.classList.toggle('active',vgModeAI);document.getElementById('vg-mode-2p')?.classList.toggle('active',!vgModeAI);const dr=document.getElementById('vg-diff-row');if(dr)dr.style.display=vgModeAI?'flex':'none';vgNew();}
function vgSetLevel(d){vgDiff=d;['easy','medium','hard','expert'].forEach(x=>{const b=document.getElementById('vg-diff-'+x);if(b)b.classList.toggle('active',x===d);});}
function vgSetDiff(d){vgDiff=d;if(typeof smRefresh==='function')smRefresh('vg');['easy','medium','hard','expert'].forEach(x=>{const b=document.getElementById('vg-diff-'+x);if(b)b.classList.toggle('active',x===d);});vgNew();}
function vgNew(){
  vgBoard=Array(6).fill(null).map(()=>Array(7).fill(0));
  vgTurn=1;vgOver=false;clearTimeout(vgAiTimer);vgRender();
  const st=document.getElementById('vg-status');if(st)st.textContent=vgName(1)+' ist dran';
  const dr=document.getElementById('vg-diff-row');if(dr)dr.style.display=vgModeAI?'flex':'none';
  if(typeof smSnap==='function')smSnap('vg',true);
}
function vgDrop(col,fromAI=false){
  if(vgOver)return;
  if(vgModeAI&&vgTurn===2&&!fromAI)return;
  for(let r=5;r>=0;r--){
    if(!vgBoard[r][col]){vgBoard[r][col]=vgTurn;sfx('drop');break;}
  }
  if(vgCheckWin(vgTurn)){
    const st=document.getElementById('vg-status');
    if(st)st.textContent=vgName(vgTurn)+' gewinnt! 🎉';
    vgOver=true;vgRender();if(typeof smSnap==='function')smSnap('vg');smReport('vg',{winner:vgTurn-1});return;
  }
  if(vgBoard[0].every(c=>c)){const st=document.getElementById('vg-status');if(st)st.textContent='Unentschieden!';vgOver=true;vgRender();if(typeof smSnap==='function')smSnap('vg');smReport('vg',{winner:-1});return;}
  vgTurn=vgTurn===1?2:1;
  const st=document.getElementById('vg-status');if(st)st.textContent=vgName(vgTurn)+' ist dran';
  vgRender();
  if(typeof smSnap==='function')smSnap('vg');
  if(vgModeAI&&vgTurn===2)vgAiTimer=setTimeout(vgAI,300);
}
function vgCheckWin(player){
  for(let r=0;r<6;r++)for(let c=0;c<7;c++){
    if(c+3<7&&[0,1,2,3].every(i=>vgBoard[r][c+i]===player))return true;
    if(r+3<6&&[0,1,2,3].every(i=>vgBoard[r+i][c]===player))return true;
    if(r+3<6&&c+3<7&&[0,1,2,3].every(i=>vgBoard[r+i][c+i]===player))return true;
    if(r+3<6&&c-3>=0&&[0,1,2,3].every(i=>vgBoard[r+i][c-i]===player))return true;
  }
  return false;
}
function vgScore(b,p){let s=0;function evalWindow(w){const mine=w.filter(x=>x===p).length,empty=w.filter(x=>x===0).length,opp=w.filter(x=>x&&x!==p).length;if(opp===0){if(mine===4)s+=100;else if(mine===3&&empty===1)s+=5;else if(mine===2&&empty===2)s+=2;}else if(mine===0&&opp===3&&empty===1)s-=4;};
  for(let r=0;r<6;r++)for(let c=0;c<4;c++)evalWindow([b[r][c],b[r][c+1],b[r][c+2],b[r][c+3]]);
  for(let r=0;r<3;r++)for(let c=0;c<7;c++)evalWindow([b[r][c],b[r+1][c],b[r+2][c],b[r+3][c]]);
  return s;
}
function vgMinimax(b,depth,alpha,beta,maximizing){
  if(vgCheckWin(1))return -1000;if(vgCheckWin(2))return 1000;
  if(!b[0].some(v=>!v)||depth===0)return vgScore(b,2)-vgScore(b,1);
  if(maximizing){let best=-Infinity;for(const c of [3,2,4,1,5,0,6]){if(b[0][c])continue;const nb=b.map(r=>[...r]);for(let r=5;r>=0;r--)if(!nb[r][c]){nb[r][c]=2;break;}const s=vgMinimax(nb,depth-1,alpha,beta,false);best=Math.max(best,s);alpha=Math.max(alpha,s);if(beta<=alpha)break;}return best;}
  else{let best=Infinity;for(const c of [3,2,4,1,5,0,6]){if(b[0][c])continue;const nb=b.map(r=>[...r]);for(let r=5;r>=0;r--)if(!nb[r][c]){nb[r][c]=1;break;}const s=vgMinimax(nb,depth-1,alpha,beta,true);best=Math.min(best,s);beta=Math.min(beta,s);if(beta<=alpha)break;}return best;}
}
function vgAI(){
  if(vgOver)return;
  const depth={easy:1,medium:3,hard:5,expert:7}[vgDiff];
  let best=-Infinity;const scored=[];
  for(const c of [3,2,4,1,5,0,6]){
    if(vgBoard[0][c])continue;
    const nb=vgBoard.map(r=>[...r]);
    for(let r=5;r>=0;r--)if(!nb[r][c]){nb[r][c]=2;break;}
    const s=vgMinimax(nb,depth,-Infinity,Infinity,false);
    scored.push({c,s});if(s>best)best=s;
  }
  const bestCols=scored.filter(x=>x.s===best).map(x=>x.c);
  const col=bestCols[Math.floor(Math.random()*bestCols.length)];
  vgDrop(col,true);
}
function vgRender(){
  const drop=document.getElementById('vg-drop-row');const board=document.getElementById('vg-board');
  if(!drop||!board)return;
  drop.innerHTML=Array(7).fill(0).map((_,c)=>`<div onclick="vgDrop(${c})" style="width:52px;height:52px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;border-radius:8px" onmouseenter="this.style.background='${vgColors[vgTurn-1]}';this.style.opacity='0.6'" onmouseleave="this.style.background='';this.style.opacity=''"></div>`).join('');
  const ds=typeof zcBoardSkin==='function'?zcBoardSkin('vg'):null;
  board.innerHTML=vgBoard.flat().map((v,i)=>`<div style="width:52px;height:52px;border-radius:50%;${ds?ds.disc(v===1?vgColors[0]:vgColors[1],v>0):`background:${v===1?vgColors[0]:v===2?vgColors[1]:'rgba(255,255,255,0.15)'};border:2px solid rgba(0,0,0,0.2)`};cursor:pointer" onclick="vgDrop(${i%7})"></div>`).join('');
}


smRegister({id:'vg',screen:'screen-viergewinnt',title:'Vier gewinnt',sides:['Zug 1','Zug 2'],
  snapshot:()=>({board:vgBoard.map(r=>[...r]),turn:vgTurn}),isOver:()=>vgOver,cancelPending:()=>clearTimeout(vgAiTimer),
  undoUntil:st=>!vgModeAI||st.turn===1,
  restore:(st,o)=>{vgBoard=st.board.map(r=>[...r]);vgTurn=st.turn;vgOver=!!o.replay;vgRender();const e=document.getElementById('vg-status');if(e)e.textContent=o.replay?'🎬 Replay…':vgName(vgTurn)+' ist dran';},
  sideAI:()=>[false,vgModeAI],difficulty:()=>vgModeAI?vgDiff:null,levels:['easy','medium','hard','expert'],setLevel:vgSetLevel,newGame:vgNew,
  onPlayers:pl=>{vgColors=[pl[0].color,pl[1].color];vgRender();}});
