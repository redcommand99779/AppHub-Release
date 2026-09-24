/* ══════════════════════════════════
   SCHIFFE VERSENKEN
══════════════════════════════════ */

/* ══ SCHIFFE VERSENKEN ══ */
const BS_SHIPS=[5,4,3,3,2];
const BS_NAMES=['Träger (5)','Schlachtschiff (4)','Kreuzer (3)','Zerstörer (3)','U-Boot (2)'];
const CELL=32, GAP=2, STEP=CELL+GAP;

let bsMode='ai',bsMode2=false;
let bsPlayerGrid=[],bsEnemyGrid=[];
let bsPhase='place',bsTurn='player',bsOver=false;
let bsAiSunkCells=new Set(),bsAiSunkLens=[];
let bsAiHits=[],bsAiTargets=[],bsEnemyShipList=[],bsDiff=(localStorage.getItem('zf_default_diff')||'medium');
let bsP2Grid=[],bsP2Ships=[],bsP2ShipList=[],bsP1Ships_saved=[],bsP1Attacks=[],bsP2Attacks=[];
// Placement state
let bsShips=[]; // [{row,col,horiz,len,placed}]
let bsDragging=null,bsDragOffX=0,bsDragOffY=0;
let bsSelected=0;


function bsSetLevel(d){
  bsDiff=d;['easy','medium','hard','expert'].forEach(x=>{const b=document.getElementById('bs-diff-'+x);if(b)b.classList.toggle('active',x===d);});
}
function bsShipCells(sh){const a=[];for(let i=0;i<sh.len;i++)a.push(sh.horiz?sh.row*10+sh.col+i:(sh.row+i)*10+sh.col);return a;}
function bsAiExpertPick(){
  const remaining=[...BS_SHIPS];
  bsAiSunkLens.forEach(l=>{const k=remaining.indexOf(l);if(k>=0)remaining.splice(k,1);});
  const score=Array(100).fill(0);
  remaining.forEach(L=>{
    for(let r=0;r<10;r++)for(let c=0;c<10;c++)for(const horiz of [true,false]){
      if(horiz&&c+L>10)continue;if(!horiz&&r+L>10)continue;
      const cells=[];let ok=true,hits=0;
      for(let i=0;i<L;i++){
        const idx=horiz?r*10+c+i:(r+i)*10+c,v=bsPlayerGrid[idx];
        if(v===3||bsAiSunkCells.has(idx)){ok=false;break;}
        if(v===2)hits++;cells.push(idx);
      }
      if(!ok)continue;
      const w=hits?Math.pow(12,hits):1;
      cells.forEach(idx=>{if(bsPlayerGrid[idx]<2)score[idx]+=w;});
    }
  });
  let best=-1,bi=[];
  for(let i=0;i<100;i++){if(bsPlayerGrid[i]>=2)continue;if(score[i]>best){best=score[i];bi=[i];}else if(score[i]===best)bi.push(i);}
  return bi.length?bi[Math.floor(Math.random()*bi.length)]:-1;
}
function bsSetDiff(d){
  bsDiff=d;if(typeof smRefresh==='function')smRefresh('bs');
  ['easy','medium','hard','expert'].forEach(x=>{
    const b=document.getElementById('bs-diff-'+x);
    if(b)b.classList.toggle('active',x===d);
  });
}

function bsSetMode(m){
  bsMode=m;bsMode2=m==='2p';if(typeof smRefresh==='function')smRefresh('bs');
  const dr=document.getElementById('bs-diff-row');if(dr)dr.style.display=m==='2p'?'none':'flex';
  document.getElementById('bs-mode-ai')?.classList.toggle('active',m==='ai');
  document.getElementById('bs-mode-2p')?.classList.toggle('active',m==='2p');
  bsNew();
}

function bsNew(){
  if(typeof rplBegin==='function')rplBegin('bs');
  bsPlayerGrid=Array(100).fill(0);bsEnemyGrid=Array(100).fill(0);
  bsP2Grid=Array(100).fill(0);
  bsPhase='place';bsTurn='player';bsOver=false;
  bsAiHits=[];bsAiTargets=[];bsSelected=0;bsAiSunkCells=new Set();bsAiSunkLens=[];
  bsShips=BS_SHIPS.map((len,i)=>({len,name:BS_NAMES[i],horiz:true,row:-1,col:-1,placed:false}));
  bsP2Ships=BS_SHIPS.map((len,i)=>({len,name:BS_NAMES[i],horiz:true,row:-1,col:-1,placed:false}));
  if(!bsMode2){
    // AI mode: place enemy ships
    bsEnemyGrid=Array(100).fill(0);
    bsEnemyShipList=[];
    BS_SHIPS.forEach((len,i)=>{
      const before=bsEnemyGrid.map((v,j)=>v===1?j:-1).filter(j=>j>=0);
      bsAIPlace(bsEnemyGrid,len);
      const after=bsEnemyGrid.map((v,j)=>v===1?j:-1).filter(j=>j>=0);
      const newCells=after.filter(j=>!before.includes(j));
      if(newCells.length){
        const minR=Math.min(...newCells.map(j=>Math.floor(j/10)));
        const minC=Math.min(...newCells.map(j=>j%10));
        const maxR=Math.max(...newCells.map(j=>Math.floor(j/10)));
        const maxC=Math.max(...newCells.map(j=>j%10));
        bsEnemyShipList.push({row:minR,col:minC,len,name:BS_NAMES[i],horiz:minR===maxR});
      }
    });
  }
  document.getElementById('bs-place-phase').style.display='block';
  document.getElementById('bs-battle-phase').style.display='none';
  const st=document.getElementById('bs-status');
  if(st)st.textContent=bsMode2?'Spieler 1: Schiffe platzieren':'Schiffe auf das Feld ziehen oder Zufällig wählen';
  const rl=document.getElementById('bs-ready-btn');
  if(rl){rl.style.opacity='0.4';rl.style.pointerEvents='none';}
  setTimeout(bsRenderPlace,50);
}

function bsCanPlace(grid,r,c,len,horiz,skipIdx=-1){
  for(let i=0;i<len;i++){
    const nr=horiz?r:r+i,nc=horiz?c+i:c;
    if(nr<0||nr>=10||nc<0||nc>=10)return false;
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      const nnr=nr+dr,nnc=nc+dc;
      if(nnr<0||nnr>=10||nnc<0||nnc>=10)continue;
      if(grid[nnr*10+nnc]===1)return false;
    }
  }
  return true;
}

function bsCanPlaceShips(){
  // Check all currently placed ships against each other
  const tmp=Array(100).fill(0);
  for(const sh of bsShips){
    if(!sh.placed)continue;
    for(let i=0;i<sh.len;i++){
      const nr=sh.horiz?sh.row:sh.row+i,nc=sh.horiz?sh.col+i:sh.col;
      tmp[nr*10+nc]=1;
    }
  }
  // Validate no touching
  for(const sh of bsShips){
    if(!sh.placed)continue;
    for(let i=0;i<sh.len;i++){
      const nr=sh.horiz?sh.row:sh.row+i,nc=sh.horiz?sh.col+i:sh.col;
      for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
        if(dr===0&&dc===0)continue;
        const nnr=nr+dr,nnc=nc+dc;
        if(nnr<0||nnr>=10||nnc<0||nnc>=10)continue;
        // Check if this neighbor belongs to a DIFFERENT ship
        for(const sh2 of bsShips){
          if(sh2===sh||!sh2.placed)continue;
          for(let j=0;j<sh2.len;j++){
            const r2=sh2.horiz?sh2.row:sh2.row+j,c2=sh2.horiz?sh2.col+j:sh2.col;
            if(r2===nnr&&c2===nnc)return false;
          }
        }
      }
    }
  }
  return true;
}

function bsAIPlace(grid,len){
  let tries=0;
  while(tries++<500){
    const h=Math.random()<0.5;
    const r=Math.floor(Math.random()*(h?10:10-len+1));
    const co=Math.floor(Math.random()*(h?10-len+1:10));
    if(bsCanPlace(grid,r,co,len,h)){
      for(let i=0;i<len;i++){const nr=h?r:r+i;const nc=h?co+i:co;grid[nr*10+nc]=1;}
      return;
    }
  }
}

function bsRenderPlace(){
  const gridEl=document.getElementById('bs-place-grid');
  const dockEl=document.getElementById('bs-ships-dock');
  if(!gridEl||!dockEl)return;
  // Show selected ship name in status
  const selSh=bsShips[bsSelected];
  const st2=document.getElementById('bs-status');
  if(st2&&selSh){
    const allPlaced=bsShips.every(s=>s.placed);
    if(!allPlaced)st2.textContent=`Ausgewählt: ${selSh.name} – auf Feld ziehen oder Drehen`;
    else st2.textContent='Alle Schiffe platziert – Drehen oder Fertig klicken';
  }
  gridEl.innerHTML='';
  // Draw grid cells
  for(let row=0;row<10;row++)for(let col=0;col<10;col++){
    const cell=document.createElement('div');
    cell.style.cssText=`position:absolute;width:${CELL}px;height:${CELL}px;left:${col*STEP}px;top:${row*STEP}px;background:#b8e0f7;border:1px solid rgba(255,255,255,0.5);border-radius:1px;box-sizing:border-box`;
    cell.dataset.row=row;cell.dataset.col=col;
    gridEl.appendChild(cell);
  }
  // Check validity
  const allPlaced=bsShips.every(s=>s.placed);
  const validPlacement=allPlaced&&bsCanPlaceShips();
  // Draw placed ships
  bsShips.forEach((sh,idx)=>{
    if(!sh.placed)return;
    const isValid=bsIsShipValid(idx);
    const div=document.createElement('div');
    const w=sh.horiz?sh.len*STEP-GAP:CELL;
    const h=sh.horiz?CELL:sh.len*STEP-GAP;
    const isSel2=bsSelected===idx;
    div.style.cssText=`position:absolute;width:${w}px;height:${h}px;left:${sh.col*STEP}px;top:${sh.row*STEP}px;background:${isValid?'#3a7bd5':'#ff6b6b'};border-radius:4px;cursor:grab;z-index:${isSel2?3:2};border:${isSel2?'3px solid #fff':'2px solid '+(isValid?'#1a5fc5':'#cc0000')};box-sizing:border-box;display:flex;align-items:center;justify-content:center;outline:${isSel2?'2px solid var(--accent)':'none'};outline-offset:2px`;
    div.title=sh.name;
    // Drag from placed ship
    div.onclick=e=>{if(e.target===div){bsSelected=idx;bsRenderPlace();}};
    div.onmousedown=e=>{bsSelected=idx;bsStartDrag(e,idx);};
    div.ontouchstart=e=>{bsSelected=idx;bsStartDragTouch(e,idx);};
    gridEl.appendChild(div);
  });
  // Update ready button
  const rb=document.getElementById('bs-ready-btn');
  if(rb){
    const ok=allPlaced&&validPlacement;
    rb.style.opacity=ok?'1':'0.4';
    rb.style.pointerEvents=ok?'auto':'none';
  }
  // Dock - unplaced ships
  dockEl.innerHTML='';
  bsShips.forEach((sh,idx)=>{
    if(sh.placed)return;
    const div=document.createElement('div');
    const isSel=bsSelected===idx;
    div.style.cssText=`display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;border:2px solid ${isSel?'var(--accent)':'var(--divider)'};background:${isSel?'var(--active-bg)':'var(--surface)'};cursor:grab`;
    // Ship preview
    const preview=document.createElement('div');
    preview.style.cssText=`display:flex;gap:2px;flex-direction:${sh.horiz?'row':'column'}`;
    for(let i=0;i<sh.len;i++){
      const cell=document.createElement('div');
      cell.style.cssText=`width:14px;height:14px;border-radius:2px;background:${isSel?'var(--accent)':'#3a7bd5'}`;
      preview.appendChild(cell);
    }
    const label=document.createElement('span');
    label.style.cssText='font-size:12px;color:var(--text-2)';
    label.textContent=sh.name;
    div.appendChild(preview);div.appendChild(label);
    div.onclick=()=>{bsSelected=idx;bsRenderPlace();};
    div.onmousedown=e=>{bsSelected=idx;bsStartDrag(e,idx);};
    div.ontouchstart=e=>{bsSelected=idx;bsStartDragTouch(e,idx);};
    dockEl.appendChild(div);
  });
}

function bsIsShipValid(idx){
  const sh=bsShips[idx];
  if(!sh.placed)return false;
  for(let i=0;i<sh.len;i++){
    const nr=sh.horiz?sh.row:sh.row+i,nc=sh.horiz?sh.col+i:sh.col;
    if(nr<0||nr>=10||nc<0||nc>=10)return false;
    // Check neighbors against other ships
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      if(dr===0&&dc===0)continue;
      const nnr=nr+dr,nnc=nc+dc;
      if(nnr<0||nnr>=10||nnc<0||nnc>=10)continue;
      for(let j=0;j<bsShips.length;j++){
        if(j===idx)continue;
        const sh2=bsShips[j];if(!sh2.placed)continue;
        for(let k=0;k<sh2.len;k++){
          const r2=sh2.horiz?sh2.row:sh2.row+k,c2=sh2.horiz?sh2.col+k:sh2.col;
          if(r2===nnr&&c2===nnc)return false;
        }
      }
    }
  }
  return true;
}

function bsRotateSelected(){
  const sh=bsShips[bsSelected];if(!sh)return;
  sh.horiz=!sh.horiz;
  // If placed, check bounds and adjust
  if(sh.placed){
    if(sh.horiz){if(sh.col+sh.len>10)sh.col=10-sh.len;}
    else{if(sh.row+sh.len>10)sh.row=10-sh.len;}
  }
  bsRenderPlace();
}

function bsStartDrag(e,idx){
  e.preventDefault();
  bsDragging=idx;
  const sh=bsShips[idx];
  const gridEl=document.getElementById('bs-place-grid');
  if(!gridEl)return;
  const rect=gridEl.getBoundingClientRect();
  // Create drag ghost
  const ghost=document.createElement('div');
  ghost.id='bs-drag-ghost';
  const w=sh.horiz?sh.len*STEP-GAP:CELL;
  const h=sh.horiz?CELL:sh.len*STEP-GAP;
  ghost.style.cssText=`position:fixed;width:${w}px;height:${h}px;background:#3a7bd5;border-radius:4px;opacity:0.8;pointer-events:none;z-index:9999;border:2px solid #1a5fc5;box-sizing:border-box`;
  ghost.style.left=(e.clientX-w/2)+'px';
  ghost.style.top=(e.clientY-h/2)+'px';
  document.body.appendChild(ghost);
  bsDragOffX=w/2;bsDragOffY=h/2;

  const onMove=e2=>{
    const gx=e2.clientX-bsDragOffX,gy=e2.clientY-bsDragOffY;
    ghost.style.left=gx+'px';ghost.style.top=gy+'px';
    // Show snap preview on grid
    const col=Math.round((e2.clientX-rect.left-bsDragOffX)/STEP);
    const row=Math.round((e2.clientY-rect.top-bsDragOffY)/STEP);
    bsShowSnap(idx,row,col);
  };
  const onUp=e2=>{
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    document.getElementById('bs-drag-ghost')?.remove();
    bsClearSnap();
    // Drop
    const col=Math.round((e2.clientX-rect.left-bsDragOffX)/STEP);
    const row=Math.round((e2.clientY-rect.top-bsDragOffY)/STEP);
    bsDropShip(idx,row,col);
    bsDragging=null;
  };
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
}

function bsStartDragTouch(e,idx){
  e.preventDefault();
  const touch=e.touches[0];
  const sh=bsShips[idx];
  const gridEl=document.getElementById('bs-place-grid');
  if(!gridEl)return;
  const rect=gridEl.getBoundingClientRect();
  const w=sh.horiz?sh.len*STEP-GAP:CELL;
  const h=sh.horiz?CELL:sh.len*STEP-GAP;
  const ghost=document.createElement('div');
  ghost.id='bs-drag-ghost';
  ghost.style.cssText=`position:fixed;width:${w}px;height:${h}px;background:#3a7bd5;border-radius:4px;opacity:0.8;pointer-events:none;z-index:9999;border:2px solid #1a5fc5;box-sizing:border-box`;
  ghost.style.left=(touch.clientX-w/2)+'px';
  ghost.style.top=(touch.clientY-h/2)+'px';
  document.body.appendChild(ghost);
  bsDragOffX=w/2;bsDragOffY=h/2;

  const onMove=e2=>{
    const t=e2.touches[0];
    ghost.style.left=(t.clientX-bsDragOffX)+'px';
    ghost.style.top=(t.clientY-bsDragOffY)+'px';
    const col=Math.round((t.clientX-rect.left-bsDragOffX)/STEP);
    const row=Math.round((t.clientY-rect.top-bsDragOffY)/STEP);
    bsShowSnap(idx,row,col);
  };
  const onEnd=e2=>{
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('touchend',onEnd);
    document.getElementById('bs-drag-ghost')?.remove();
    bsClearSnap();
    const t=e2.changedTouches[0];
    const col=Math.round((t.clientX-rect.left-bsDragOffX)/STEP);
    const row=Math.round((t.clientY-rect.top-bsDragOffY)/STEP);
    bsDropShip(idx,row,col);
  };
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('touchend',onEnd);
}

let bsSnapRow=-1,bsSnapCol=-1;
function bsShowSnap(idx,row,col){bsSnapRow=row;bsSnapCol=col;}
function bsClearSnap(){bsSnapRow=-1;bsSnapCol=-1;}

function bsDropShip(idx,row,col){
  const sh=bsShips[idx];
  // Clamp to grid
  let r=Math.max(0,Math.min(row,sh.horiz?9:10-sh.len));
  let c=Math.max(0,Math.min(col,sh.horiz?10-sh.len:9));
  // Additional bounds check
  if(sh.horiz&&c+sh.len>10)c=10-sh.len;
  if(!sh.horiz&&r+sh.len>10)r=10-sh.len;
  sh.row=r;sh.col=c;sh.placed=true;
  bsSelected=idx;
  bsRenderPlace();
}

function bsRandomPlace(){
  bsShips.forEach(sh=>{sh.placed=false;sh.row=-1;sh.col=-1;});
  for(let idx=0;idx<bsShips.length;idx++){
    const sh=bsShips[idx];
    let placed=false;let tries=0;
    while(!placed&&tries++<1000){
      const h=Math.random()<0.5;
      const r=Math.floor(Math.random()*(h?10:11-sh.len));
      const co=Math.floor(Math.random()*(h?11-sh.len:10));
      sh.horiz=h;sh.row=r;sh.col=co;sh.placed=true;
      if(!bsIsShipValid(idx)){sh.placed=false;sh.row=-1;sh.col=-1;}
      else placed=true;
    }
  }
  bsRenderPlace();
}

function bsStartBattle(){
  if(bsPhase==='place-p2'){bsStartBattle2();return;}
  if(!bsShips.every(s=>s.placed)||!bsCanPlaceShips())return;
  // Save P1 ships
  bsPlayerGrid=Array(100).fill(0);
  bsShips.forEach(sh=>{
    for(let i=0;i<sh.len;i++){
      const nr=sh.horiz?sh.row:sh.row+i,nc=sh.horiz?sh.col+i:sh.col;
      bsPlayerGrid[nr*10+nc]=1;
    }
  });
  bsP1Ships_saved=[...bsShips.map(s=>({...s}))];
  if(bsMode2){
    // 2P: now Player 2 places ships
    bsPhase='place-p2';
    bsShips=bsP2Ships;
    bsSelected=0;
    const st=document.getElementById('bs-status');
    if(st)st.textContent='Spieler 2: Schiffe platzieren (Spieler 1 wegschauen!)';
    const rb=document.getElementById('bs-ready-btn');
    if(rb){rb.style.opacity='0.4';rb.style.pointerEvents='none';rb.textContent='✓ Fertig (S2)';}
    setTimeout(bsRenderPlace,50);
    return;
  }
  bsPhase='battle';
  document.getElementById('bs-place-phase').style.display='none';
  document.getElementById('bs-battle-phase').style.display='block';
  document.getElementById('bs-ai-grids').style.display='flex';
  document.getElementById('bs-2p-panels').style.display='none';
  const st=document.getElementById('bs-status');if(st)st.textContent='Angriff! Klick auf Gegnerfeld.';
  bsBattleRender();
}

function bsStartBattle2(){
  if(!bsShips.every(s=>s.placed)||!bsCanPlaceShips())return;
  bsP2Grid=Array(100).fill(0);
  bsShips.forEach(sh=>{
    for(let i=0;i<sh.len;i++){
      const nr=sh.horiz?sh.row:sh.row+i,nc=sh.horiz?sh.col+i:sh.col;
      bsP2Grid[nr*10+nc]=1;
    }
  });
  bsP2ShipList=[...bsShips.map(s=>({...s}))];
  bsShips=bsP1Ships_saved;
  bsPhase='battle';bsTurn='p1';
  // Init separate attack grids
  bsP1Attacks=Array(100).fill(0); // P1 attacks on P2Grid
  bsP2Attacks=Array(100).fill(0); // P2 attacks on P1Grid
  document.getElementById('bs-place-phase').style.display='none';
  document.getElementById('bs-battle-phase').style.display='block';
  document.getElementById('bs-2p-panels').style.display='flex';
  document.getElementById('bs-ai-grids').style.display='none';
  const st=document.getElementById('bs-status');if(st)st.textContent='Spieler 1 fängt an!';
  setTimeout(bs2pRenderBoth,50);
}

function bs2pRenderBoth(){
  if(typeof rplPush==='function')rplPush('bs',{g1:bsPlayerGrid.map((v,i)=>bsP2Attacks[i]===2?2:bsP2Attacks[i]===3?3:v),g2:bsP2Grid.map((v,i)=>bsP1Attacks[i]===2?2:bsP1Attacks[i]===3?3:v)});
  const t=BS_SHIPS.reduce((a,b)=>a+b,0);
  // P1 attack grid (attacks P2 ships)
  const g1=document.getElementById('bs-p1-attack-grid');
  if(g1){
    g1.innerHTML='';
    for(let i=0;i<100;i++){
      const div=document.createElement('div');
      let bg='#c8e6fa',txt='';
      if(bsP1Attacks[i]===2){bg='#ff3b30';txt='💥';}
      if(bsP1Attacks[i]===3){bg='#90caf9';txt='·';}
      if(bsP1Attacks[i]===4){bg='rgba(58,123,213,0.35)';}
      const canClick=bsTurn==='p1'&&bsP1Attacks[i]<2&&!bsOver;
      div.style.cssText=`width:28px;height:28px;border-radius:2px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:12px;cursor:${canClick?'pointer':'default'}`;
      div.textContent=txt;
      if(canClick)div.onclick=()=>bs2pShoot(1,i);
      g1.appendChild(div);
    }
  }
  // P2 attack grid (attacks P1 ships)
  const g2=document.getElementById('bs-p2-attack-grid');
  if(g2){
    g2.innerHTML='';
    for(let i=0;i<100;i++){
      const div=document.createElement('div');
      let bg='#c8e6fa',txt='';
      if(bsP2Attacks[i]===2){bg='#ff3b30';txt='💥';}
      if(bsP2Attacks[i]===3){bg='#90caf9';txt='·';}
      if(bsP2Attacks[i]===4){bg='rgba(58,123,213,0.35)';}
      const canClick=bsTurn==='p2'&&bsP2Attacks[i]<2&&!bsOver;
      div.style.cssText=`width:28px;height:28px;border-radius:2px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:12px;cursor:${canClick?'pointer':'default'}`;
      div.textContent=txt;
      if(canClick)div.onclick=()=>bs2pShoot(2,i);
      g2.appendChild(div);
    }
  }
  // Update labels and hit counts
  const p1h=bsP1Attacks.filter(v=>v===2).length;
  const p2h=bsP2Attacks.filter(v=>v===2).length;
  const p1lbl=document.getElementById('bs-p1-turn-label');
  const p2lbl=document.getElementById('bs-p2-turn-label');
  if(p1lbl){p1lbl.style.color=bsTurn==='p1'?'var(--accent)':'var(--text-3)';p1lbl.textContent=(bsTurn==='p1'?'⚔️ ':'')+'Spieler 1 greift an';}
  if(p2lbl){p2lbl.style.color=bsTurn==='p2'?'var(--accent)':'var(--text-3)';p2lbl.textContent=(bsTurn==='p2'?'⚔️ ':'')+'Spieler 2 greift an';}
  const p1hits=document.getElementById('bs-p1-hits');if(p1hits)p1hits.textContent=`Treffer: ${p1h}/${t}`;
  const p2hits=document.getElementById('bs-p2-hits');if(p2hits)p2hits.textContent=`Treffer: ${p2h}/${t}`;
}

function bs2pShoot(player,idx){
  const targetGrid=player===1?bsP2Grid:bsPlayerGrid;
  const attackGrid=player===1?bsP1Attacks:bsP2Attacks;
  if(attackGrid[idx]>=2||bsOver)return;
  const hit=targetGrid[idx]===1;sfx(hit?'hit':'miss');
  attackGrid[idx]=hit?2:3;
  const st=document.getElementById('bs-status');
  const t=BS_SHIPS.reduce((a,b)=>a+b,0);
  const enemyShips=player===1?bsP2ShipList:bsP1Ships_saved;
  const sunk=hit?bsCheckSunk(attackGrid,idx,enemyShips):null;
  if(attackGrid.filter(v=>v===2).length>=t){
    bsOver=true;
    // Reveal remaining
    for(let i=0;i<100;i++)if(targetGrid[i]===1&&attackGrid[i]<2)attackGrid[i]=4;
    if(st)st.textContent=`🎉 Spieler ${player} gewinnt! Alle Schiffe versenkt!`;
    bs2pRenderBoth();smReport('bs',{winner:player-1});return;
  }
  if(hit){
    const msg=sunk?`💥 S${player}: ${sunk} versenkt! Nochmal!`:`💥 Spieler ${player}: Treffer! Nochmal!`;
    if(st)st.textContent=msg;
    // Same player shoots again
  }else{
    if(st)st.textContent=`Spieler ${player} daneben → Spieler ${player===1?2:1} ist dran`;
    bsTurn=player===1?'p2':'p1';
  }
  bs2pRenderBoth();
}


function bsRevealEnemyShips(){
  // Show all enemy ship positions that weren't hit
  for(let i=0;i<100;i++){
    if(bsEnemyGrid[i]===1)bsEnemyGrid[i]=4; // 4 = revealed ship
  }
  bsBattleRender();
}

function bsBattleRender(){
  if(bsMode2)return;
  if(typeof rplPush==='function')rplPush('bs',{g1:[...bsPlayerGrid],g2:[...bsEnemyGrid]});// 2P uses bs2pRenderAttack
  // Player grid
  const pg=document.getElementById('bs-player-grid');
  if(pg){
    pg.innerHTML='';
    for(let i=0;i<100;i++){
      const div=document.createElement('div');
      let bg='#c8e6fa',txt='';
      if(bsPlayerGrid[i]===1)bg='#3a7bd5';
      if(bsPlayerGrid[i]===2){bg='#ff3b30';txt='💥';}
      if(bsPlayerGrid[i]===3){bg='#90caf9';txt='·';}
      div.style.cssText=`width:30px;height:30px;border-radius:2px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:14px`;
      div.textContent=txt;
      pg.appendChild(div);
    }
  }
  // Enemy grid
  const eg=document.getElementById('bs-enemy-grid-ai');
  if(eg){
    eg.innerHTML='';
    for(let i=0;i<100;i++){
      const div=document.createElement('div');
      let bg='#c8e6fa',txt='';
      if(bsEnemyGrid[i]===2){bg='#ff3b30';txt='💥';}
      if(bsEnemyGrid[i]===3){bg='#90caf9';txt='·';}
      if(bsEnemyGrid[i]===4){bg='rgba(58,123,213,0.4)';txt='';}
      div.style.cssText=`width:30px;height:30px;border-radius:2px;background:${bg};display:flex;align-items:center;justify-content:center;font-size:14px;cursor:${bsTurn==='player'&&bsEnemyGrid[i]<2?'pointer':'default'}`;
      div.textContent=txt;
      if(bsTurn==='player'&&bsEnemyGrid[i]<2&&!bsOver)div.onclick=()=>bsEnemyClick(i);
      eg.appendChild(div);
    }
  }
}

function bsCheckSunk(grid,idx,ships){
  // Check if the ship at the hit cell is now fully sunk
  // ships = array of {row,col,horiz,len,name}
  for(const sh of ships){
    let cells=[];
    for(let i=0;i<sh.len;i++){
      const nr=sh.horiz?sh.row:sh.row+i,nc=sh.horiz?sh.col+i:sh.col;
      cells.push(nr*10+nc);
    }
    if(cells.includes(idx)&&cells.every(c=>grid[c]===2))return sh.name;
  }
  return null;
}

function bsEnemyShips(){
  // Reconstruct enemy ship positions from eGrid value=1 or 2
  // Since AI places ships randomly we track them
  return bsEnemyShipList||[];
}

function bsEnemyClick(idx){
  if(bsPhase!=='battle'||bsEnemyGrid[idx]>=2||bsOver)return;
  if(!bsMode2&&bsTurn!=='player')return;
  if(bsMode2&&bsTurn==='ai')return;
  const hit=bsEnemyGrid[idx]===1;sfx(hit?'hit':'miss');
  bsEnemyGrid[idx]=hit?2:3;
  const st=document.getElementById('bs-status');
  const totalHits=BS_SHIPS.reduce((a,b)=>a+b,0);
  if(bsEnemyGrid.filter(v=>v===2).length>=totalHits){
    bsOver=true;if(st)st.textContent='🎉 Du gewinnst! Alle Schiffe versenkt!';setTimeout(bsBattleRender,100);smReport('bs',{winner:0});return;
  }
  if(hit){
    const sunk=bsCheckSunk(bsEnemyGrid,idx,bsEnemyShipList||[]);
    if(sunk){if(st)st.textContent=`💥 Versenkt: ${sunk}! Nochmal!`;}
    else{if(st)st.textContent='💥 Treffer! Nochmal!';}
  }else{
    if(bsMode2){
      // 2P: switch attacker
      if(bsTurn==='p1'){
        bsTurn='p2';
        // Show P2's enemy grid (=P1's ships)
        bsEnemyGrid=bsPlayerGrid;
        bsEnemyShipList=bsP1Ships_saved;
        if(st)st.textContent='Spieler 2: Angriff auf Spieler 1 Feld!';
        const ll=document.getElementById('bs-left-label');if(ll)ll.textContent='Spieler 2 Feld';
        const rl=document.getElementById('bs-right-label');if(rl)rl.textContent='Spieler 1 Feld (angreifen)';
      }else{
        bsTurn='p1';
        bsEnemyGrid=bsP2Grid;
        bsEnemyShipList=bsP2ShipList;
        if(st)st.textContent='Spieler 1: Angriff auf Spieler 2 Feld!';
        const ll=document.getElementById('bs-left-label');if(ll)ll.textContent='Spieler 1 Feld';
        const rl=document.getElementById('bs-right-label');if(rl)rl.textContent='Spieler 2 Feld (angreifen)';
      }
    }else{
      bsTurn='ai';if(st)st.textContent='KI schießt…';bsBattleRender();setTimeout(bsAIShoot,700);return;
    }
  }
  bsBattleRender();
}

function bsAIShoot(){
  if(bsOver)return;
  const st=document.getElementById('bs-status');
  let idx;

  if(bsDiff==='easy'){
    // Easy: always random, no memory
    const untried=[];for(let i=0;i<100;i++)if(bsPlayerGrid[i]<2)untried.push(i);
    if(!untried.length)return;
    idx=untried[Math.floor(Math.random()*untried.length)];
  } else if(bsDiff==='medium'){
    // Medium: hunts after a hit but no direction tracking
    if(bsAiHits.length>0){
      const lastHit=bsAiHits[bsAiHits.length-1];
      const r=Math.floor(lastHit/10),co=lastHit%10;
      const adj=[[0,1],[0,-1],[1,0],[-1,0]]
        .map(([dr,dc])=>[r+dr,co+dc])
        .filter(([nr,nc])=>nr>=0&&nr<10&&nc>=0&&nc<10&&bsPlayerGrid[nr*10+nc]<2)
        .map(([nr,nc])=>nr*10+nc);
      if(adj.length>0){idx=adj[Math.floor(Math.random()*adj.length)];}
    }
    if(idx===undefined){
      const untried=[];for(let i=0;i<100;i++)if(bsPlayerGrid[i]<2)untried.push(i);
      if(!untried.length)return;
      idx=untried[Math.floor(Math.random()*untried.length)];
    }
  } else if(bsDiff==='expert'){
    idx=bsAiExpertPick();
    if(idx<0)return;
  } else {
    // Hard: smart hunt+target with direction tracking
    if(bsAiTargets.length>0){
      idx=bsAiTargets.shift();
      while(idx!==undefined&&bsPlayerGrid[idx]>=2)idx=bsAiTargets.shift();
    }
    if(idx===undefined){
      // Parity optimization: only check cells of same color as ships can't be on every cell
      const untried=[];
      for(let i=0;i<100;i++){
        const r=Math.floor(i/10),co=i%10;
        if(bsPlayerGrid[i]<2&&(r+co)%2===0)untried.push(i);
      }
      if(untried.length===0)for(let i=0;i<100;i++)if(bsPlayerGrid[i]<2)untried.push(i);
      if(!untried.length)return;
      idx=untried[Math.floor(Math.random()*untried.length)];
    }
  }

  const hit=bsPlayerGrid[idx]===1;sfx(hit?'hit':'miss');
  bsPlayerGrid[idx]=hit?2:3;

  if(hit){
    bsAiHits.push(idx);
    if(bsDiff==='hard'){
      const r=Math.floor(idx/10),co=idx%10;
      if(bsAiHits.length>=2){
        const last=bsAiHits[bsAiHits.length-2];
        const dr=Math.floor(idx/10)-Math.floor(last/10),dc=(idx%10)-(last%10);
        const nxt=idx+dr*10+dc,prv=bsAiHits[0]-dr*10-dc;
        if(nxt>=0&&nxt<100&&Math.abs(Math.floor(nxt/10)-Math.floor(idx/10))<=1&&bsPlayerGrid[nxt]<2)bsAiTargets.unshift(nxt);
        if(prv>=0&&prv<100&&Math.abs(Math.floor(prv/10)-Math.floor(bsAiHits[0]/10))<=1&&bsPlayerGrid[prv]<2)bsAiTargets.push(prv);
      }else{
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc])=>{
          const nr=r+dr,nc=co+dc;
          if(nr>=0&&nr<10&&nc>=0&&nc<10&&bsPlayerGrid[nr*10+nc]<2)bsAiTargets.push(nr*10+nc);
        });
      }
    }
  }else{
    if(bsDiff==='hard'&&bsAiTargets.length===0)bsAiHits=[];
    else if(bsDiff!=='hard')bsAiHits=[];
  }

  if(bsPlayerGrid.filter(v=>v===2).length>=BS_SHIPS.reduce((a,b)=>a+b,0)){
    bsOver=true;if(st)st.textContent='💀 KI gewinnt!';bsRevealEnemyShips();smReport('bs',{winner:1});return;
  }
  if(hit){
    const sunk=bsCheckSunk(bsPlayerGrid,idx,bsShips);
    if(sunk){bsAiHits=[];const sh=bsShips.find(x=>bsShipCells(x).includes(idx));if(sh){bsShipCells(sh).forEach(x=>bsAiSunkCells.add(x));bsAiSunkLens.push(sh.len);}}
    const msg=sunk?`KI versenkt: ${sunk}! KI schießt nochmal…`:'KI trifft! KI schießt nochmal…';
    if(st)st.textContent=msg;
    bsBattleRender();
    const delay=bsDiff==='easy'?1200:bsDiff==='medium'?900:bsDiff==='expert'?550:700;
    setTimeout(bsAIShoot,delay);
  }else{
    bsTurn='player';
    if(st)st.textContent='KI daneben. Dein Zug.';
    bsBattleRender();
  }
}


smRegister({id:'bs',screen:'screen-schiffe',title:'Schiffe versenken',sides:['Flotte 1','Flotte 2'],
  sideAI:()=>[false,!bsMode2],difficulty:()=>bsMode2?null:bsDiff,levels:['easy','medium','hard','expert'],setLevel:bsSetLevel,newGame:bsNew});
