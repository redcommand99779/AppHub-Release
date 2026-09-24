/* ── Memory ── */
const MEMORY_EMOJIS=['🍕','🎸','🌈','🚀','🦁','🎯','🌸','⚡','🎪','🦋','🌊','🏆','🎭','🌙','💎','🔥','🎨','🎵','🌺','🦊','🍦','🎃','🌴','🦄'];
let memoryCards=[],memoryFlipped=[],memoryMatched=new Set(),memoryMoves=0;
let memMode='solo',memTurn=1,memP1Score=0,memP2Score=0,memBlocking=false;

function memSetMode(m){
  memMode=m;if(typeof smRefresh==='function')smRefresh('mem');
  document.getElementById('mem-mode-solo')?.classList.toggle('active',m==='solo');
  document.getElementById('mem-mode-2p')?.classList.toggle('active',m==='2p');
  const solo=document.getElementById('mem-solo-stats');
  const two=document.getElementById('mem-2p-stats');
  if(solo)solo.style.display=m==='solo'?'block':'none';
  if(two)two.style.display=m==='2p'?'flex':'none';
  memoryNew();
}

function memoryNew(){
  if(typeof rplBegin==='function')rplBegin('mem');
  const size=parseInt(document.getElementById('memory-size')?.value||6);
  const defaultPairs=size===4?8:12;
  const customPairs=parseInt(document.getElementById('memory-pairs-custom')?.value||'');
  const pairs=!isNaN(customPairs)&&customPairs>=2?Math.min(customPairs,MEMORY_EMOJIS.length):defaultPairs;
  const emojis=MEMORY_EMOJIS.slice(0,pairs);
  memoryCards=[...emojis,...emojis].sort(()=>Math.random()-0.5);
  memoryFlipped=[];memoryMatched=new Set();memoryMoves=0;memBlocking=false;
  memTurn=1;memP1Score=0;memP2Score=0;
  const m=document.getElementById('memory-moves');if(m)m.textContent='0';
  const msg=document.getElementById('memory-msg');if(msg)msg.textContent='';
  const p1s=document.getElementById('mem-p1-score');if(p1s)p1s.textContent='0';
  const p2s=document.getElementById('mem-p2-score');if(p2s)p2s.textContent='0';
  memUpdateTurnUI();
  memoryRender();
}

function memUpdateTurnUI(){
  if(memMode!=='2p')return;
  const p1t=document.getElementById('mem-p1-turn');
  const p2t=document.getElementById('mem-p2-turn');
  const p1box=document.getElementById('mem-p1-score')?.parentElement;
  const p2box=document.getElementById('mem-p2-score')?.parentElement;
  if(p1t)p1t.textContent=memTurn===1?'← dran':'';
  if(p2t)p2t.textContent=memTurn===2?'← dran':'';
  if(p1box)p1box.style.borderColor=memTurn===1?'var(--accent)':'var(--divider)';
  if(p2box)p2box.style.borderColor=memTurn===2?'var(--accent)':'var(--divider)';
}

function memoryRender(){
  if(memMode==='2p'&&typeof rplPush==='function')rplPush('mem',{cards:[...memoryCards],flipped:[...memoryFlipped],matched:[...memoryMatched],s:[memP1Score,memP2Score],turn:memTurn});
  const board=document.getElementById('memory-board');if(!board)return;
  board.innerHTML=memoryCards.map((emoji,i)=>{
    const flipped=memoryFlipped.includes(i)||memoryMatched.has(i);
    const matchedBy=memoryMatched.has(i)?memoryMatched.get?.(i):null;
    const bg=memoryMatched.has(i)
      ?(memMode==='2p'&&memoryMatched[i+'_player']===1?'rgba(0,113,227,0.12)':'rgba(52,199,89,0.1)')
      :(memoryFlipped.includes(i)?'var(--active-bg)':'var(--surface)');
    const ms=typeof zcBoardSkin==='function'?zcBoardSkin('mem'):null;
    return `<div onclick="memoryClick(${i})" style="width:80px;height:80px;border-radius:12px;border:0.5px solid var(--divider);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:${flipped?32:24}px;background:${!flipped&&ms?ms.bg:bg};transition:all 0.15s${!flipped&&ms&&ms.glowAnim?`;animation:zcGlowPulse 1.8s ease-in-out infinite;--myth-glow:${ms.glowColor||'#ff2fd0'}`:''}">${flipped?emoji:(ms?ms.back:'🎴')}</div>`;
  }).join('');
}

function memoryClick(i){
  if(memBlocking||memoryFlipped.length>=2||memoryFlipped.includes(i)||memoryMatched.has(i))return;
  memoryFlipped.push(i);sfx('flip');
  memoryRender();
  if(memoryFlipped.length===2){
    memoryMoves++;
    const mEl=document.getElementById('memory-moves');if(mEl)mEl.textContent=memoryMoves;
    const [a,b]=memoryFlipped;
    if(memoryCards[a]===memoryCards[b]){
      // Match!
      sfx('match');
      memoryMatched.add(a);memoryMatched.add(b);
      memoryFlipped=[];
      if(memMode==='2p'){
        if(memTurn===1){memP1Score++;const el=document.getElementById('mem-p1-score');if(el)el.textContent=memP1Score;}
        else{memP2Score++;const el=document.getElementById('mem-p2-score');if(el)el.textContent=memP2Score;}
        // Same player gets another turn on match!
        memUpdateTurnUI();
        const msg=document.getElementById('memory-msg');
        if(msg){msg.textContent=`✅ Treffer! Spieler ${memTurn} nochmal!`;msg.style.color='#34c759';}
        setTimeout(()=>{if(msg)msg.textContent='';},1200);
      }
      if(memoryMatched.size===memoryCards.length){
        const msg=document.getElementById('memory-msg');
        if(msg){
          if(memMode==='2p'){
            const winner=memP1Score>memP2Score?'Spieler 1':memP2Score>memP1Score?'Spieler 2':'Unentschieden';
            msg.textContent=`🎉 ${winner} gewinnt! (${memP1Score}:${memP2Score})`;
          } else {
            msg.textContent=`🎉 Gewonnen in ${memoryMoves} Zügen!`;
          }
          msg.style.color='#34c759';
        }
        if(memMode==='2p')setTimeout(()=>smReport('mem',{winner:memP1Score>memP2Score?0:memP2Score>memP1Score?1:-1,scores:[memP1Score,memP2Score]}),700);
      }
      memoryRender();
    } else {
      // No match - switch turns in 2P mode
      sfx('nomatch');
      memBlocking=true;
      setTimeout(()=>{
        memoryFlipped=[];memBlocking=false;
        if(memMode==='2p'){
          memTurn=memTurn===1?2:1;
          memUpdateTurnUI();
          const msg=document.getElementById('memory-msg');
          if(msg){msg.textContent=`❌ Kein Paar — Spieler ${memTurn} ist dran`;msg.style.color='var(--text-3)';}
          setTimeout(()=>{if(msg&&msg.textContent.startsWith('❌'))msg.textContent='';},1500);
        }
        memoryRender();
      },1000);
    }
  }
}

smRegister({id:'mem',screen:'screen-memory',title:'Memory',sides:['Spieler 1','Spieler 2'],
  active:()=>memMode==='2p',sideAI:()=>[false,false],difficulty:()=>null,newGame:memoryNew});
