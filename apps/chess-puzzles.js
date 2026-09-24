/* ══════════════════════════════════
   SCHACH-RÄTSEL – Matt in 1 / Matt in 2 (Weiß am Zug)
   Alle Aufgaben wurden mit der Schach-Engine geprüft; ob ein Zug richtig ist,
   entscheidet zur Laufzeit die Engine (auch alternative Lösungen zählen).
══════════════════════════════════ */
const CHESS_PUZZLES=[
  {fen:'6k1/5ppp/8/8/8/8/5PPP/3R2K1',title:'Grundreihenmatt',goal:1},
  {fen:'3r2k1/5ppp/8/8/8/8/5PPP/3R2K1',title:'Turmtausch mit Matt',goal:1},
  {fen:'7k/R7/8/8/8/8/8/1R4K1',title:'Turm-Leiter',goal:1},
  {fen:'5k2/8/5K2/8/8/8/8/R7',title:'Turm und König',goal:1},
  {fen:'6rk/6pp/8/6N1/8/8/8/6K1',title:'Erstickungsmatt',goal:1},
  {fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR',title:'Schäfermatt',goal:1},
  {fen:'6k1/8/8/8/8/8/R7/1R4K1',title:'Leiter in zwei Zügen',goal:2},
  {fen:'k7/8/2K5/8/8/8/8/7R',title:'König führt den Turm',goal:2},
  {fen:'8/4R3/8/8/4R3/8/2K5/7k',title:'Zwei Türme',goal:2},
  {fen:'6R1/8/8/8/8/7R/k7/3K4',title:'Turm-Zange',goal:2},
  {fen:'7k/8/5K2/7B/8/8/4R3/8',title:'Läufer hilft',goal:2},
  {fen:'k7/8/8/7R/8/5K2/8/7R',title:'Türme im Doppelpack',goal:2},
  {fen:'8/8/8/3K4/1N6/7Q/8/1k6',title:'Dame und Springer',goal:2},
  {fen:'8/8/4N3/8/8/K7/1Q6/3k4',title:'Springer-Gabel',goal:2}
];
const CHESS_NC={wK:false,wQR:false,wKR:false,bK:false,bQR:false,bKR:false};
let chessPuzzle=null;

function chessPuzzleParse(fen){
  const b=[];
  fen.split(' ')[0].split('/').forEach(row=>{for(const ch of row){if(/\d/.test(ch))for(let i=0;i<+ch;i++)b.push('');else b.push(ch);}});
  return b;
}
function chessMateMoves(board,turn){
  const opp=turn==='w'?'b':'w';
  return chessAllMoves(board,turn,null,CHESS_NC).filter(m=>{
    const nb=chessApply(board,m[0],m[1],m[2],m[3],null);
    return chessAllMoves(nb,opp,null,CHESS_NC).length===0&&chessInCheck(nb,opp);
  });
}
function chessIsMate(board,turn){return chessAllMoves(board,turn,null,CHESS_NC).length===0&&chessInCheck(board,turn);}
function chessForcedMateStart(board){ // Weiß-Züge, nach denen jede schwarze Antwort ein Matt in 1 zulässt
  return chessAllMoves(board,'w',null,CHESS_NC).filter(m=>{
    const nb=chessApply(board,m[0],m[1],m[2],m[3],null),rep=chessAllMoves(nb,'b',null,CHESS_NC);
    return rep.length>0&&rep.every(r=>chessMateMoves(chessApply(nb,r[0],r[1],r[2],r[3],null),'w').length>0);
  });
}
function chessPuzzleSolvedList(){try{return JSON.parse(localStorage.getItem('zf_chess_puzzles')||'[]');}catch(e){return[];}}
function chessPuzzleSq(m){return 'abcdefgh'[m[1]]+(8-m[0])+'→'+'abcdefgh'[m[3]]+(8-m[2]);}

function chessPuzzleToggle(){if(chessPuzzle)chessPuzzleExit();else{const solved=chessPuzzleSolvedList();const next=CHESS_PUZZLES.findIndex((p,i)=>!solved.includes(i));chessPuzzleStart(next<0?0:next);}}
function chessPuzzleStart(i){
  i=(i+CHESS_PUZZLES.length)%CHESS_PUZZLES.length;
  const P=CHESS_PUZZLES[i];
  chessPuzzle={i,goal:P.goal,stage:1,hinted:0,done:false};
  clearTimeout(chessAiTimer);
  chessBoard=chessPuzzleParse(P.fen);chessTurn='w';chessSelected=null;chessOver=false;
  chessCapturedW=[];chessCapturedB=[];chessMoveHistory=[];chessEnPassant=null;chessCastling={...CHESS_NC};
  chessRender();
  document.getElementById('chess-mode-puzzle')?.classList.add('active');
  chessPuzzleRender();
}
function chessPuzzleExit(quiet){
  if(!chessPuzzle&&quiet)return;
  chessPuzzle=null;
  document.getElementById('chess-mode-puzzle')?.classList.remove('active');
  const panel=document.getElementById('chess-puzzle-panel');if(panel)panel.style.display='none';
  if(!quiet)chessReset();
}
function chessPuzzleRender(msg,ok){
  const panel=document.getElementById('chess-puzzle-panel');if(!panel)return;
  if(!chessPuzzle){panel.style.display='none';return;}
  const P=CHESS_PUZZLES[chessPuzzle.i],solved=chessPuzzleSolvedList();
  panel.style.display='block';
  panel.innerHTML=`<div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em">Aufgabe ${chessPuzzle.i+1}/${CHESS_PUZZLES.length} · gelöst ${solved.length}/${CHESS_PUZZLES.length}${solved.includes(chessPuzzle.i)?' ✓':''}</div>
    <div style="font-size:15px;font-weight:700;color:var(--text);margin:2px 0">🧩 ${P.title}</div>
    <div style="font-size:13px;color:var(--text-2)">Weiß am Zug – <b>Matt in ${P.goal}</b>${P.goal===2?` (Zug ${chessPuzzle.stage}/2)`:''}</div>
    ${msg?`<div style="margin-top:6px;font-size:13px;font-weight:600;color:${ok?'#43a047':'#e53935'}">${msg}</div>`:''}
    <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:8px">
      <button class="timer-btn" onclick="chessPuzzleStart(chessPuzzle.i-1)" style="padding:5px 10px;font-size:12px">◀</button>
      <button class="timer-btn" onclick="chessPuzzleHint()" style="padding:5px 10px;font-size:12px">💡 Tipp</button>
      <button class="timer-btn" onclick="chessPuzzleStart(chessPuzzle.i)" style="padding:5px 10px;font-size:12px">↺ Neu</button>
      <button class="timer-btn" onclick="chessPuzzleStart(chessPuzzle.i+1)" style="padding:5px 10px;font-size:12px">▶</button>
      <button class="timer-btn" onclick="chessPuzzleExit()" style="padding:5px 10px;font-size:12px">✖ Beenden</button>
    </div>`;
}
function chessPuzzleHint(){
  if(!chessPuzzle||chessPuzzle.done)return;
  const sols=chessPuzzle.goal===1||chessPuzzle.stage===2?chessMateMoves(chessBoard,'w'):chessForcedMateStart(chessBoard);
  if(!sols.length)return;
  const m=sols[0];chessPuzzle.hinted++;
  if(chessPuzzle.hinted===1){chessSelected=[m[0],m[1]];chessRender();chessPuzzleRender('💡 Diese Figur ist wichtig (markiert).',true);}
  else chessPuzzleRender('💡 Zug: '+chessPuzzleSq(m),true);
}
function chessPuzzleMove(sr,sf,nr,nf){
  const P=chessPuzzle;if(!P||P.done)return;
  const before=[...chessBoard],nb=chessApply(chessBoard,sr,sf,nr,nf,null);
  chessBoard=nb;chessSelected=null;
  if(chessIsMate(nb,'b')){chessPuzzleSuccess();return;}
  if(P.goal===2&&P.stage===1){
    const replies=chessAllMoves(nb,'b',null,CHESS_NC);
    if(replies.length&&replies.every(r=>chessMateMoves(chessApply(nb,r[0],r[1],r[2],r[3],null),'w').length>0)){
      let best=replies[0],bc=1e9;
      replies.forEach(r=>{const c=chessMateMoves(chessApply(nb,r[0],r[1],r[2],r[3],null),'w').length;if(c<bc){bc=c;best=r;}});
      chessBoard=chessApply(nb,best[0],best[1],best[2],best[3],null);P.stage=2;P.hinted=0;
      chessRender();sfx('place');chessPuzzleRender('Gut! Schwarz antwortet '+chessPuzzleSq(best)+' – jetzt Matt setzen!',true);
      return;
    }
  }
  chessBoard=before;chessRender();sfx('error');
  chessPuzzleRender(P.goal===2&&P.stage===1?'Das erzwingt noch kein Matt in 2 – probier etwas anderes.':'Das ist noch kein Matt – versuch es nochmal.',false);
}
function chessPuzzleSuccess(){
  const P=chessPuzzle;P.done=true;
  const solved=chessPuzzleSolvedList(),first=!solved.includes(P.i);
  if(first){solved.push(P.i);try{localStorage.setItem('zf_chess_puzzles',JSON.stringify(solved));}catch(e){}}
  chessRender();sfx('win');if(typeof smConfetti==='function')smConfetti();
  let extra='';
  if(first&&typeof zcPuzzleSolved==='function'){const r=zcPuzzleSolved(P.i);if(r)extra=` (+${r} 🪙)`;}
  chessPuzzleRender('🎉 Schachmatt! Aufgabe gelöst'+extra+'.',true);
  const panel=document.getElementById('chess-puzzle-panel');
  if(panel)panel.insertAdjacentHTML('beforeend',`<button class="btn-generate" onclick="chessPuzzleStart(chessPuzzle.i+1)" style="margin-top:10px;width:auto;padding:8px 20px">Nächste Aufgabe ▶</button>`);
}
