/* ══ SCHACH ══ */
let chessAiTimer=null;
let chessLevel=(localStorage.getItem('zf_default_diff')||'medium');
const CHESS_DEPTH={easy:0,medium:2,hard:3,expert:4};
function chessSetLevel(l,quiet){
  chessLevel=l;
  ['easy','medium','hard','expert'].forEach(x=>document.getElementById('chess-diff-'+x)?.classList.toggle('active',x===l));
  if(!quiet&&typeof smRefresh==='function')smRefresh('chess');
}
let chessBoard=[],chessTurn='w',chessMode='2p',chessSelected=null,chessOver=false;
let chessCapturedW=[],chessCapturedB=[],chessMoveHistory=[];
let chessEnPassant=null,chessCastling={wK:true,wQR:true,wKR:true,bK:true,bQR:true,bKR:true};
const CP={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const INIT=['r','n','b','q','k','b','n','r','p','p','p','p','p','p','p','p',
  '','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',
  'P','P','P','P','P','P','P','P','R','N','B','Q','K','B','N','R'];
const isW=p=>p&&p===p.toUpperCase();
const isB=p=>p&&p===p.toLowerCase();
const enemy=(p,t)=>t==='w'?isB(p):isW(p);
const own=(p,t)=>t==='w'?isW(p):isB(p);
function ri(r,f){return r*8+f;}
function inBounds(r,f){return r>=0&&r<8&&f>=0&&f<8;}
function chessInsufficientMaterial(board){
  const pieces=[];board.forEach((p,i)=>{if(p&&p.toLowerCase()!=='k')pieces.push({p,i});});
  if(pieces.length===0)return true; // nur Könige
  if(pieces.length===1&&/^[bn]$/i.test(pieces[0].p))return true; // König + Läufer/Springer vs. König
  if(pieces.length===2&&pieces.every(x=>x.p.toLowerCase()==='b')){
    const c0=(Math.floor(pieces[0].i/8)+pieces[0].i%8)%2,c1=(Math.floor(pieces[1].i/8)+pieces[1].i%8)%2;
    if(c0===c1)return true; // beide Läufer auf gleichfarbigen Feldern
  }
  return false;
}

function chessSetMode(m){
  chessMode=m;if(typeof smRefresh==='function')smRefresh('chess');
  const dr=document.getElementById('chess-diff-row');if(dr)dr.style.display=m==='ai'?'flex':'none';
  ['2p','ai'].forEach(x=>{const b=document.getElementById('chess-mode-'+x);if(b)b.classList.toggle('active',x===m);});
  chessReset();
}
function chessReset(){
  if(typeof chessPuzzleExit==='function')chessPuzzleExit(true);
  chessBoard=[...INIT];chessTurn='w';chessSelected=null;chessOver=false;
  chessCapturedW=[];chessCapturedB=[];chessMoveHistory=[];
  chessEnPassant=null;
  chessCastling={wK:true,wQR:true,wKR:true,bK:true,bQR:true,bKR:true};
  chessRender();
  clearTimeout(chessAiTimer);
  const st=document.getElementById('chess-status');if(st)st.textContent='Weiß ist dran';
  if(typeof smSnap==='function')smSnap('chess',true);
}

function chessMoves(board,r,f,turn,ep,castling){
  const p=board[ri(r,f)];if(!p||!own(p,turn))return[];
  const moves=[];const pt=p.toLowerCase();
  const add=(nr,nf)=>{if(!inBounds(nr,nf)||own(board[ri(nr,nf)],turn))return false;moves.push([nr,nf]);return true;};
  const slide=(dr,df)=>{let cr=r+dr,cf=f+df;while(inBounds(cr,cf)){if(own(board[ri(cr,cf)],turn))break;moves.push([cr,cf]);if(enemy(board[ri(cr,cf)],turn))break;cr+=dr;cf+=df;}};
  if(pt==='p'){
    const dir=turn==='w'?-1:1;const start=turn==='w'?6:1;
    if(inBounds(r+dir,f)&&!board[ri(r+dir,f)]){moves.push([r+dir,f]);if(r===start&&!board[ri(r+dir*2,f)])moves.push([r+dir*2,f]);}
    [-1,1].forEach(df=>{if(inBounds(r+dir,f+df)&&(enemy(board[ri(r+dir,f+df)],turn)||(ep&&ep[0]===r+dir&&ep[1]===f+df)))moves.push([r+dir,f+df]);});
  }else if(pt==='n'){
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,df])=>add(r+dr,f+df));
  }else if(pt==='b'){
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,df])=>slide(dr,df));
  }else if(pt==='r'){
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,df])=>slide(dr,df));
  }else if(pt==='q'){
    [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,df])=>slide(dr,df));
  }else if(pt==='k'){
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,df])=>add(r+dr,f+df));
    // Castling
    const kr=turn==='w'?7:0;
    if(castling[turn+'K']&&!board[ri(kr,5)]&&!board[ri(kr,6)]&&!chessAttacked(board,kr,4,turn)&&!chessAttacked(board,kr,5,turn))moves.push([kr,6]);
    if(castling[turn+'QR']&&!board[ri(kr,3)]&&!board[ri(kr,2)]&&!board[ri(kr,1)]&&!chessAttacked(board,kr,4,turn)&&!chessAttacked(board,kr,3,turn))moves.push([kr,2]);
  }
  // Filter moves that leave king in check
  return moves.filter(([nr,nf])=>{
    const nb=chessApply(board,r,f,nr,nf,ep);
    return !chessInCheck(nb,turn);
  });
}

function chessAttacked(board,r,f,byColor){
  const enemy=byColor==='w'?'b':'w';
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){
    const p=board[ri(i,j)];if(!p)continue;
    const isEnemy=enemy==='w'?isW(p):isB(p);if(!isEnemy)continue;
    const pt=p.toLowerCase();const dr=r-i,df=f-j;
    if(pt==='p'){const dir=enemy==='w'?-1:1;if(dr===dir&&Math.abs(df)===1)return true;}
    else if(pt==='n'){if((Math.abs(dr)===2&&Math.abs(df)===1)||(Math.abs(dr)===1&&Math.abs(df)===2))return true;}
    else if(pt==='k'){if(Math.abs(dr)<=1&&Math.abs(df)<=1)return true;}
    else if(pt==='r'||pt==='b'||pt==='q'){
      const straight=(dr===0||df===0)&&(dr!==0||df!==0),diag=Math.abs(dr)===Math.abs(df)&&dr!==0;
      if((straight&&(pt==='r'||pt==='q'))||(diag&&(pt==='b'||pt==='q'))){
        const sr=Math.sign(dr),sf=Math.sign(df);let cr=i+sr,cf=j+sf,ok=true;
        while(cr!==r||cf!==f){if(board[ri(cr,cf)]){ok=false;break;}cr+=sr;cf+=sf;}
        if(ok)return true;
      }
    }
  }
  return false;
}

function chessInCheck(board,turn){
  let kr=-1,kf=-1;
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){if(board[ri(i,j)]===(turn==='w'?'K':'k')){kr=i;kf=j;}}
  return kr>=0&&chessAttacked(board,kr,kf,turn);
}

function chessApply(board,r,f,nr,nf,ep){
  const nb=[...board];const p=nb[ri(r,f)];
  nb[ri(nr,nf)]=p;nb[ri(r,f)]='';
  // En passant capture
  if(p.toLowerCase()==='p'&&ep&&nr===ep[0]&&nf===ep[1])nb[ri(r,nf)]='';
  // Pawn promotion (auto-queen)
  if(p==='P'&&nr===0)nb[ri(nr,nf)]='Q';
  if(p==='p'&&nr===7)nb[ri(nr,nf)]='q';
  // Castling move
  if(p==='K'&&f===4&&nf===6){nb[ri(nr,5)]=nb[ri(nr,7)];nb[ri(nr,7)]='';}
  if(p==='K'&&f===4&&nf===2){nb[ri(nr,3)]=nb[ri(nr,0)];nb[ri(nr,0)]='';}
  if(p==='k'&&f===4&&nf===6){nb[ri(nr,5)]=nb[ri(nr,7)];nb[ri(nr,7)]='';}
  if(p==='k'&&f===4&&nf===2){nb[ri(nr,3)]=nb[ri(nr,0)];nb[ri(nr,0)]='';}
  return nb;
}

function chessAllMoves(board,turn,ep,castling){
  const all=[];
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){
    chessMoves(board,i,j,turn,ep,castling).forEach(m=>all.push([i,j,...m]));
  }
  return all;
}

const PIECE_VAL={p:100,n:320,b:330,r:500,q:900,k:20000};
function chessEval(board){
  let score=0;
  for(let i=0;i<64;i++){const p=board[i];if(!p)continue;const v=PIECE_VAL[p.toLowerCase()]||0;score+=isW(p)?v:-v;}
  return score;
}

function chessMinimax(board,depth,alpha,beta,maximizing,turn,ep,castling){
  const opp=turn==='w'?'b':'w';
  if(depth===0)return chessEval(board);
  const moves=chessAllMoves(board,turn,ep,castling);
  if(moves.length===0)return chessInCheck(board,turn)?(maximizing?-50000:50000):0;
  moves.sort((x,y)=>{const a=board[ri(x[2],x[3])],b=board[ri(y[2],y[3])];return(b?PIECE_VAL[b.toLowerCase()]||0:0)-(a?PIECE_VAL[a.toLowerCase()]||0:0);});
  if(maximizing){
    let best=-Infinity;
    for(const [r,f,nr,nf] of moves){
      const nb=chessApply(board,r,f,nr,nf,ep);
      const val=chessMinimax(nb,depth-1,alpha,beta,false,opp,null,castling);
      best=Math.max(best,val);alpha=Math.max(alpha,val);
      if(beta<=alpha)break;
    }
    return best;
  }else{
    let best=Infinity;
    for(const [r,f,nr,nf] of moves){
      const nb=chessApply(board,r,f,nr,nf,ep);
      const val=chessMinimax(nb,depth-1,alpha,beta,true,opp,null,castling);
      best=Math.min(best,val);beta=Math.min(beta,val);
      if(beta<=alpha)break;
    }
    return best;
  }
}

function chessAIMove(){
  const moves=chessAllMoves(chessBoard,'b',chessEnPassant,chessCastling);
  if(!moves.length)return;
  const depth=CHESS_DEPTH[chessLevel]!=null?CHESS_DEPTH[chessLevel]:2;
  const capVal=m=>{const t=chessBoard[ri(m[2],m[3])];return t?(PIECE_VAL[t.toLowerCase()]||0):0;};
  moves.sort((x,y)=>capVal(y)-capVal(x));
  let bestMove=moves[0];
  if(chessLevel==='easy'&&Math.random()<0.35){bestMove=moves[Math.floor(Math.random()*moves.length)];}
  else{
    let best=Infinity;
    for(const m of moves){
      const nb=chessApply(chessBoard,m[0],m[1],m[2],m[3],chessEnPassant);
      const val=chessMinimax(nb,depth,-Infinity,best+1,true,'w',null,chessCastling);
      if(val<best){best=val;bestMove=m;}
    }
  }
  chessDoMove(bestMove[0],bestMove[1],bestMove[2],bestMove[3]);
}

function chessClick(r,f){
  if(chessOver)return;
  if(chessMode==='ai'&&chessTurn==='b')return;
  const p=chessBoard[ri(r,f)];
  if(chessSelected){
    const [sr,sf]=chessSelected;
    const moves=chessMoves(chessBoard,sr,sf,chessTurn,chessEnPassant,chessCastling);
    if(moves.some(([mr,mf])=>mr===r&&mf===f)){
      if(typeof chessPuzzle!=='undefined'&&chessPuzzle)chessPuzzleMove(sr,sf,r,f);else chessDoMove(sr,sf,r,f);
      return;
    }
  }
  if(own(p,chessTurn)){chessSelected=[r,f];}else{chessSelected=null;}
  chessRender();
}

function chessDoMove(r,f,nr,nf){
  const p=chessBoard[ri(r,f)];const cap=chessBoard[ri(nr,nf)];
  // En passant capture
  let epCap='';
  if(p.toLowerCase()==='p'&&chessEnPassant&&nr===chessEnPassant[0]&&nf===chessEnPassant[1]){
    epCap=chessBoard[ri(r,nf)];chessBoard[ri(r,nf)]='';
  }
  chessBoard=chessApply(chessBoard,r,f,nr,nf,chessEnPassant);
  sfx(cap||epCap?'capture':'place');
  // Update castling rights
  if(p==='K')chessCastling.wK=chessCastling.wKR=chessCastling.wQR=false;
  if(p==='k')chessCastling.bK=chessCastling.bKR=chessCastling.bQR=false;
  if(p==='R'){if(r===7&&f===0)chessCastling.wQR=false;if(r===7&&f===7)chessCastling.wKR=false;}
  if(p==='r'){if(r===0&&f===0)chessCastling.bQR=false;if(r===0&&f===7)chessCastling.bKR=false;}
  // En passant state
  chessEnPassant=null;
  if(p.toLowerCase()==='p'&&Math.abs(nr-r)===2)chessEnPassant=[(r+nr)/2,f];
  // Captures
  if(cap)(isW(cap)?chessCapturedB:chessCapturedW).push(cap);
  if(epCap)(isW(epCap)?chessCapturedB:chessCapturedW).push(epCap);
  // History
  const files='abcdefgh';const ranks='87654321';
  chessMoveHistory.push(files[f]+ranks[r]+files[nf]+ranks[nr]);
  // Switch turn
  chessTurn=chessTurn==='w'?'b':'w';
  chessSelected=null;
  // Check game state
  const nextMoves=chessAllMoves(chessBoard,chessTurn,chessEnPassant,chessCastling);
  const inCheck=chessInCheck(chessBoard,chessTurn);
  const st=document.getElementById('chess-status');
  if(nextMoves.length===0||chessInsufficientMaterial(chessBoard)){
    chessOver=true;
    if(st)st.textContent=nextMoves.length===0?(inCheck?(chessTurn==='w'?'Schachmatt! Schwarz gewinnt 🏆':'Schachmatt! Weiß gewinnt 🏆'):'Patt – Unentschieden'):'Remis – zu wenig Material für ein Matt';
    chessRender();
    if(typeof smSnap==='function')smSnap('chess');
    smReport('chess',{winner:(nextMoves.length===0&&inCheck)?(chessTurn==='w'?1:0):-1});
    return;
  }else{
    const who=chessTurn==='w'?'Weiß':'Schwarz';
    if(st)st.textContent=inCheck?`${who} ist im Schach!`:`${who} ist dran`;
    if(chessMode==='ai'&&chessTurn==='b')chessAiTimer=setTimeout(chessAIMove,400);
  }
  chessRender();
  if(typeof smSnap==='function')smSnap('chess');
}

function chessRender(){
  const board=document.getElementById('chess-board');if(!board)return;
  board.innerHTML='';
  const selMoves=chessSelected?chessMoves(chessBoard,chessSelected[0],chessSelected[1],chessTurn,chessEnPassant,chessCastling):[];
  const bs=typeof zcBoardSkin==='function'?zcBoardSkin('chess'):null;
  for(let r=0;r<8;r++)for(let f=0;f<8;f++){
    const div=document.createElement('div');
    const light=(r+f)%2===0;
    const isSel=chessSelected&&chessSelected[0]===r&&chessSelected[1]===f;
    const isMove=selMoves.some(([mr,mf])=>mr===r&&mf===f);
    const inCheckSq=chessBoard[ri(r,f)]===(chessTurn==='w'?'K':'k')&&chessInCheck(chessBoard,chessTurn);
    div.style.cssText=`width:60px;height:60px;display:flex;align-items:center;justify-content:center;font-size:36px;cursor:pointer;position:relative;`+
      (isSel?`background:${bs?bs.sel:'#7fc97f'};`:(isMove?(light?`background:${bs?bs.ml:'#cdd56a'};`:`background:${bs?bs.md:'#aaa23a'};`):(inCheckSq?'background:#ff6b6b;':(light?`background:${bs?bs.l:'#f0d9b5'};`:`background:${bs?bs.d:'#b58863'};`))));
    if(isMove&&!chessBoard[ri(r,f)]){const dot=document.createElement('div');dot.style.cssText='width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,0.15);position:absolute;';div.appendChild(dot);}
    const p=chessBoard[ri(r,f)];
    if(p){const span=document.createElement('span');span.textContent=CP[p]||p;span.style.cssText='position:relative;z-index:1;line-height:1;text-shadow:'+(bs&&bs.ts?bs.ts:'0 1px 2px rgba(0,0,0,0.4)')+(bs&&bs.glowAnim?`;animation:zcGlowPulse 1.8s ease-in-out infinite;--myth-glow:${bs.glowColor||'#ff2fd0'}`:'')+';';div.appendChild(span);}
    div.onclick=()=>chessClick(r,f);
    board.appendChild(div);
  }
  const cw=document.getElementById('chess-captured-w');
  const cb=document.getElementById('chess-captured-b');
  if(cw)cw.textContent=chessCapturedW.map(p=>CP[p]||p).join('');
  if(cb)cb.textContent=chessCapturedB.map(p=>CP[p]||p).join('');
  const hist=document.getElementById('chess-history');
  if(hist){
    let html='';
    for(let i=0;i<chessMoveHistory.length;i+=2){
      const num=Math.floor(i/2)+1;
      html+=`<div style="color:var(--text-3)">${num}.</div><div style="color:var(--text)">${chessMoveHistory[i]||''} ${chessMoveHistory[i+1]||''}</div>`;
    }
    hist.innerHTML=html;hist.scrollTop=hist.scrollHeight;
  }
}


function initAllSettings(){
  loadKeybinds();
  applyTheme(localStorage.getItem('zf_theme')||'auto');
  setTileSize(localStorage.getItem('zf_tile_size')||'m');
  setFontSize(localStorage.getItem('zf_font_size')||'m');
  setRadius(localStorage.getItem('zf_radius')||'m');
  const anim=localStorage.getItem('zf_anim');if(anim==='0')setAnimations(false);
  setLang(localStorage.getItem('zf_lang')||'de',true);
  favApps=JSON.parse(localStorage.getItem('zf_favs')||'[]');
  setRadius(localStorage.getItem('zf_radius')||'m');
  const hc=localStorage.getItem('zf_highcontrast');if(hc==='1')setHighContrast(true);
  const bt=localStorage.getItem('zf_bigtargets');if(bt==='1')setBigTargets(true);
  const kn=localStorage.getItem('zf_keynav');if(kn==='1')setKeyboardNav(true);
  const sb=localStorage.getItem('zf_search_bar');
  const bar=document.getElementById('home-search-bar');if(bar)bar.style.display=sb==='1'?'block':'none';
  const startCat=localStorage.getItem('zf_start_cat')||'produktivitaet';
  showCat(startCat);
  applyTranslations(localStorage.getItem('zf_lang')||'de');
}


/* ── Missing function stubs ── */
function chessInit(){if(typeof chessReset==='function')chessReset();}
// Chess keyboard (escape to deselect)
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-schach')return;
  if(e.key==='Escape'){chessSelected=null;chessRender();}
});

smRegister({id:'chess',screen:'screen-schach',title:'Schach',sides:['♔ Weiß','♚ Schwarz'],
  snapshot:()=>({board:[...chessBoard],turn:chessTurn,capW:[...chessCapturedW],capB:[...chessCapturedB],hist:[...chessMoveHistory],ep:chessEnPassant?[...chessEnPassant]:null,cast:{...chessCastling}}),
  isOver:()=>chessOver,cancelPending:()=>clearTimeout(chessAiTimer),undoUntil:st=>chessMode!=='ai'||st.turn==='w',
  restore:(st,o)=>{chessBoard=[...st.board];chessTurn=st.turn;chessCapturedW=[...st.capW];chessCapturedB=[...st.capB];chessMoveHistory=[...st.hist];chessEnPassant=st.ep?[...st.ep]:null;chessCastling={...st.cast};chessSelected=null;chessOver=!!o.replay;chessRender();const e=document.getElementById('chess-status');if(e)e.textContent=o.replay?'🎬 Replay…':(chessTurn==='w'?'Weiß':'Schwarz')+' ist dran';},
  sideAI:()=>[false,chessMode==='ai'],difficulty:()=>chessMode==='ai'?chessLevel:null,levels:['easy','medium','hard','expert'],setLevel:l=>chessSetLevel(l,true),newGame:chessReset});
