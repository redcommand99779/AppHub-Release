/* ── Sudoku ── */
let sudokuGrid=[],sudokuFixed=[],sudokuSolution=[],sudokuTimer=null,sudokuSeconds=0,sudokuWon=false;
function sudokuNew(){
  clearInterval(sudokuTimer);sudokuSeconds=0;sudokuWon=false;
  const msg0=document.getElementById('sudoku-msg');if(msg0)msg0.textContent='';
  const diff=document.getElementById('sudoku-diff')?.value||'medium';
  const removes={easy:35,medium:45,hard:55}[diff];
  // Generate solved grid
  const base=[[1,2,3,4,5,6,7,8,9],[4,5,6,7,8,9,1,2,3],[7,8,9,1,2,3,4,5,6],[2,3,4,5,6,7,8,9,1],[5,6,7,8,9,1,2,3,4],[8,9,1,2,3,4,5,6,7],[3,4,5,6,7,8,9,1,2],[6,7,8,9,1,2,3,4,5],[9,1,2,3,4,5,6,7,8]];
  // Shuffle using only transformations that preserve Sudoku validity:
  // rows may only swap within their own band of 3 (else 3x3 boxes break), likewise columns within their stack.
  for(let i=0;i<20;i++){const band=Math.floor(Math.random()*3);const r1=band*3+Math.floor(Math.random()*3),r2=band*3+Math.floor(Math.random()*3);[base[r1],base[r2]]=[base[r2],base[r1]];}
  for(let i=0;i<20;i++){const stack=Math.floor(Math.random()*3);const c1=stack*3+Math.floor(Math.random()*3),c2=stack*3+Math.floor(Math.random()*3);for(let r=0;r<9;r++){const t=base[r][c1];base[r][c1]=base[r][c2];base[r][c2]=t;}}
  for(let i=0;i<6;i++){const b1=Math.floor(Math.random()*3),b2=Math.floor(Math.random()*3);for(let k=0;k<3;k++){const t=base[b1*3+k];base[b1*3+k]=base[b2*3+k];base[b2*3+k]=t;}}
  for(let i=0;i<6;i++){const s1=Math.floor(Math.random()*3),s2=Math.floor(Math.random()*3);for(let r=0;r<9;r++){for(let k=0;k<3;k++){const t=base[r][s1*3+k];base[r][s1*3+k]=base[r][s2*3+k];base[r][s2*3+k]=t;}}}
  const digitMap=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);
  for(let r=0;r<9;r++)for(let c=0;c<9;c++)base[r][c]=digitMap[base[r][c]-1];
  sudokuSolution=base.map(r=>[...r]);
  sudokuFixed=base.map(r=>[...r]);
  // Remove cells
  let removed=0;while(removed<removes){const r=Math.floor(Math.random()*9),c=Math.floor(Math.random()*9);if(sudokuFixed[r][c]!==0){sudokuFixed[r][c]=0;removed++;}}
  sudokuGrid=sudokuFixed.map(r=>[...r]);
  sudokuRender();
  sudokuTimer=setInterval(()=>{sudokuSeconds++;const t=document.getElementById('sudoku-time');if(t)t.textContent=String(Math.floor(sudokuSeconds/60)).padStart(2,'0')+':'+String(sudokuSeconds%60).padStart(2,'0');},1000);
}
function sudokuRender(){
  const board=document.getElementById('sudoku-board');if(!board)return;
  board.innerHTML=sudokuGrid.flat().map((v,idx)=>{
    const r=Math.floor(idx/9),c=idx%9;
    const fixed=sudokuFixed[r][c]!==0;
    const borderRight=(c===2||c===5)?'border-right:2px solid var(--text-2);':'';
    const borderBottom=(r===2||r===5)?'border-bottom:2px solid var(--text-2);':'';
    return `<input type="number" min="1" max="9" value="${v||''}" ${fixed||sudokuWon?'readonly':''} onchange="sudokuInput(${r},${c},this.value)" style="width:52px;height:52px;text-align:center;border:0.5px solid var(--divider);background:${fixed?'var(--surface)':'var(--bg)'};color:${fixed?'var(--text)':'var(--accent)'};font-size:18px;font-weight:${fixed?700:400};outline:none;${borderRight}${borderBottom}"/>`;
  }).join('');
}
function sudokuIsValidGroup(vals){
  const nums=vals.filter(v=>v>=1&&v<=9);
  return nums.length===9&&new Set(nums).size===9;
}
function sudokuCheckWin(){
  for(let r=0;r<9;r++)if(!sudokuIsValidGroup(sudokuGrid[r]))return false;
  for(let c=0;c<9;c++)if(!sudokuIsValidGroup(sudokuGrid.map(row=>row[c])))return false;
  for(let br=0;br<3;br++)for(let bc=0;bc<3;bc++){
    const box=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)box.push(sudokuGrid[br*3+r][bc*3+c]);
    if(!sudokuIsValidGroup(box))return false;
  }
  return true;
}
function sudokuInput(r,c,val){
  const n=parseInt(val);
  sudokuGrid[r][c]=(n>=1&&n<=9)?n:0;
  if(sudokuCheckWin()){
    sudokuWon=true;clearInterval(sudokuTimer);
    const msg=document.getElementById('sudoku-msg');
    if(msg){msg.textContent=`🎉 Gewonnen in ${String(Math.floor(sudokuSeconds/60)).padStart(2,'0')}:${String(sudokuSeconds%60).padStart(2,'0')}!`;msg.style.color='#34c759';}
    sudokuRender();
  }
}
function sudokuSolve(){
  sudokuGrid=sudokuSolution.map(r=>[...r]);
  clearInterval(sudokuTimer);sudokuWon=true;
  sudokuRender();
  const msg=document.getElementById('sudoku-msg');
  if(msg){msg.textContent='Gelöst (Lösung angezeigt)';msg.style.color='var(--text-3)';}
}
