/* ══════════════════════════════════
   TIC-TAC-TOE
══════════════════════════════════ */
let tttAiTimer=null;
let tttColors=['var(--text)','var(--text)'];
let tttBoard=Array(9).fill(''),tttTurn='X',tttOver=false,tttModeAI=true,tttDiff='hard',
    tttXWins=0,tttOWins=0,tttDraws=0;
function tttSetMode(m){tttModeAI=m==='ai';if(typeof smRefresh==='function')smRefresh('ttt');document.getElementById('ttt-mode-ai')?.classList.toggle('active',tttModeAI);document.getElementById('ttt-mode-2p')?.classList.toggle('active',!tttModeAI);document.getElementById('ttt-diff-row').style.display=tttModeAI?'flex':'none';tttNew();}
function tttSetLevel(d){tttDiff=d;['easy','medium','hard'].forEach(x=>{const b=document.getElementById('ttt-diff-'+x);if(b)b.classList.toggle('active',x===d);});}
function tttSetDiff(d){tttDiff=d;if(typeof smRefresh==='function')smRefresh('ttt');['easy','medium','hard'].forEach(x=>{const b=document.getElementById('ttt-diff-'+x);if(b)b.classList.toggle('active',x===d);});}
function tttNew(){tttBoard=Array(9).fill('');tttTurn='X';tttOver=false;tttRender();const s=document.getElementById('ttt-status');if(s)s.textContent=tttModeAI?'Du bist ✕':'✕ ist dran';clearTimeout(tttAiTimer);if(typeof smSnap==='function')smSnap('ttt',true);}
function tttCheck(b){const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];for(const [a,x,c]of lines)if(b[a]&&b[a]===b[x]&&b[a]===b[c])return b[a];return b.every(v=>v)?'draw':null;}
function tttRender(){
  const board=document.getElementById('ttt-board');if(!board)return;
  board.innerHTML=tttBoard.map((v,i)=>`<div onclick="tttClick(${i})" style="width:100px;height:100px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:48px;cursor:pointer;user-select:none;color:${v==='X'?tttColors[0]:tttColors[1]}">${v}</div>`).join('');
}
function tttClick(i){
  if(tttOver||tttBoard[i])return;
  if(tttModeAI&&tttTurn==='O')return;
  tttBoard[i]=tttTurn;sfx('place');
  const result=tttCheck(tttBoard);
  if(result){tttEnd(result);return;}
  tttTurn=tttTurn==='X'?'O':'X';
  tttRender();
  const s=document.getElementById('ttt-status');if(s)s.textContent=tttModeAI?'KI denkt…':(tttTurn==='X'?'✕':'○')+' ist dran';
  if(typeof smSnap==='function')smSnap('ttt');
  if(tttModeAI&&tttTurn==='O')tttAiTimer=setTimeout(tttAI,300);
}
function tttAI(){
  const empty=tttBoard.map((v,i)=>v?-1:i).filter(i=>i>=0);
  if(tttDiff==='easy'){
    if(empty.length)tttBoard[empty[Math.floor(Math.random()*empty.length)]]='O';
  }else if(tttDiff==='medium'&&Math.random()<0.35){
    if(empty.length)tttBoard[empty[Math.floor(Math.random()*empty.length)]]='O';
  }else{
    let best=-Infinity;const scored=[];
    tttBoard.forEach((v,i)=>{if(v)return;tttBoard[i]='O';const s=tttMinimax(tttBoard,'X');tttBoard[i]='';scored.push({i,s});if(s>best)best=s;});
    const bestMoves=scored.filter(x=>x.s===best).map(x=>x.i);
    const move=bestMoves[Math.floor(Math.random()*bestMoves.length)];
    tttBoard[move]='O';
  }
  sfx('place');
  const result=tttCheck(tttBoard);
  if(result){tttEnd(result);return;}
  tttTurn='X';tttRender();const s=document.getElementById('ttt-status');if(s)s.textContent='Du bist ✕';
  if(typeof smSnap==='function')smSnap('ttt');
}
function tttMinimax(b,turn){
  const r=tttCheck(b);if(r==='O')return 10;if(r==='X')return -10;if(r==='draw')return 0;
  const scores=[];b.forEach((v,i)=>{if(v)return;b[i]=turn;scores.push(tttMinimax(b,turn==='X'?'O':'X'));b[i]='';});
  return turn==='O'?Math.max(...scores):Math.min(...scores);
}
function tttEnd(result){
  tttOver=true;
  if(result==='X'){tttXWins++;const el=document.getElementById('ttt-x-wins');if(el)el.textContent=tttXWins;}
  else if(result==='O'){tttOWins++;const el=document.getElementById('ttt-o-wins');if(el)el.textContent=tttOWins;}
  else{tttDraws++;const el=document.getElementById('ttt-draws');if(el)el.textContent=tttDraws;}
  const s=document.getElementById('ttt-status');
  if(s)s.textContent=result==='draw'?'Unentschieden!':result==='X'?'✕ gewinnt! 🎉':(tttModeAI?'KI gewinnt! 🤖':'○ gewinnt! 🎉');
  tttRender();
  if(typeof smSnap==='function')smSnap('ttt');
  smReport('ttt',{winner:result==='X'?0:result==='O'?1:-1});
}


smRegister({id:'ttt',screen:'screen-tictactoe',title:'Tic-Tac-Toe',sides:['✕','○'],
  snapshot:()=>({board:[...tttBoard],turn:tttTurn}),isOver:()=>tttOver,cancelPending:()=>clearTimeout(tttAiTimer),
  undoUntil:st=>!tttModeAI||st.turn==='X',
  restore:(st,o)=>{tttBoard=[...st.board];tttTurn=st.turn;tttOver=!!o.replay;tttRender();const e=document.getElementById('ttt-status');if(e)e.textContent=o.replay?'🎬 Replay…':(tttModeAI?'Du bist ✕':(tttTurn==='X'?'✕':'○')+' ist dran');},
  levels:['easy','medium','hard'],setLevel:tttSetLevel,
  sideAI:()=>[false,tttModeAI],difficulty:()=>tttModeAI?tttDiff:null,newGame:tttNew,
  onPlayers:pl=>{tttColors=[pl[0].color,pl[1].color];tttRender();}});
