/* ══════════════════════════════════
   SUDOKU – Rätsel mit garantiert EINER Lösung, Notizen (Bleistift), Tipp, Rückgängig, Fehlermarkierung,
   Zahlenfeld für Handy, Tastatur, automatisches Weiterspielen und Bestzeiten je Konto.
   Spielstand: zf_sudoku_game · Bestzeiten: zf_sudoku_best {leicht|mittel|schwer: {konto: Sekunden}}
══════════════════════════════════ */
const SUDOKU_GAME_KEY='zf_sudoku_game',SUDOKU_BEST_KEY='zf_sudoku_best';
const SUDOKU_CLUES={easy:40,medium:32,hard:26};
const SUDOKU_NAMES={easy:'Leicht',medium:'Mittel',hard:'Schwer'};
const SUDOKU_COINS={easy:2,medium:4,hard:6},SUDOKU_COINS_PER_DAY=12;
let sd=null,sudokuTimer=null,sudokuKeysBound=false;

/* ── Logik (ohne Oberfläche, testbar) ── */
const SD_BOX=i=>Math.floor(Math.floor(i/9)/3)*3+Math.floor((i%9)/3);
/* Löst/zählt Lösungen (bis 'limit') mit Bitmasken und "kleinste Auswahl zuerst". shuffle = Zufallsfunktion für Zufallsfelder */
function sudokuSolve(grid,limit,rnd){
  const g=grid.slice(),rows=Array(9).fill(0),cols=Array(9).fill(0),boxes=Array(9).fill(0);
  for(let i=0;i<81;i++)if(g[i]){const b=1<<g[i];if((rows[Math.floor(i/9)]&b)||(cols[i%9]&b)||(boxes[SD_BOX(i)]&b))return {count:0,solution:null};rows[Math.floor(i/9)]|=b;cols[i%9]|=b;boxes[SD_BOX(i)]|=b;}
  let count=0,first=null;
  const digits=[1,2,3,4,5,6,7,8,9];
  (function rec(){
    if(count>=limit)return;
    let best=-1,bestMask=0,bestN=10;
    for(let i=0;i<81;i++){
      if(g[i])continue;
      const used=rows[Math.floor(i/9)]|cols[i%9]|boxes[SD_BOX(i)],free=(~used)&0x3FE;
      let n=0,m=free;while(m){n+=m&1;m>>=1;}
      if(n<bestN){best=i;bestMask=free;bestN=n;if(n<=1)break;}
    }
    if(best<0){count++;if(!first)first=g.slice();return;}
    if(bestN===0)return;
    const order=rnd?digits.slice().sort(()=>rnd()-0.5):digits;
    for(const d of order){
      const b=1<<d;if(!(bestMask&b))continue;
      g[best]=d;rows[Math.floor(best/9)]|=b;cols[best%9]|=b;boxes[SD_BOX(best)]|=b;
      rec();
      g[best]=0;rows[Math.floor(best/9)]&=~b;cols[best%9]&=~b;boxes[SD_BOX(best)]&=~b;
      if(count>=limit)return;
    }
  })();
  return {count,solution:first};
}
/* Neues Rätsel: vollständiges Gitter, dann Zellen entfernen, solange die Lösung eindeutig bleibt */
function sudokuGenerate(diff,rnd){
  rnd=rnd||Math.random;
  const full=sudokuSolve(Array(81).fill(0),1,rnd).solution,puzzle=full.slice(),target=SUDOKU_CLUES[diff]||32;
  const order=Array.from({length:81},(_,i)=>i).sort(()=>rnd()-0.5);
  let clues=81;
  for(const i of order){
    if(clues<=target)break;
    const keep=puzzle[i];puzzle[i]=0;
    if(sudokuSolve(puzzle,2).count!==1)puzzle[i]=keep;else clues--;
  }
  return {puzzle,solution:full};
}
/* Zellen, die eine Zahl doppelt in Zeile, Spalte oder Block haben */
function sudokuConflicts(vals){
  const bad=new Set(),groups=[];
  for(let r=0;r<9;r++)groups.push(Array.from({length:9},(_,c)=>r*9+c));
  for(let c=0;c<9;c++)groups.push(Array.from({length:9},(_,r)=>r*9+c));
  for(let b=0;b<9;b++)groups.push(Array.from({length:9},(_,k)=>(Math.floor(b/3)*3+Math.floor(k/3))*9+(b%3)*3+k%3));
  groups.forEach(gr=>{const seen={};gr.forEach(i=>{const v=vals[i];if(!v)return;(seen[v]=seen[v]||[]).push(i);});Object.values(seen).forEach(l=>{if(l.length>1)l.forEach(i=>bad.add(i));});});
  return bad;
}
function sudokuCounts(vals){const c=Array(10).fill(0);vals.forEach(v=>{if(v)c[v]++;});return c;}
function sudokuSolved(vals,solution){return vals.every((v,i)=>v===solution[i]);}
function sudokuPeers(a,b){return a!==b&&(Math.floor(a/9)===Math.floor(b/9)||a%9===b%9||SD_BOX(a)===SD_BOX(b));}
function sudokuFmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}

/* ── Spielstand ── */
function sudokuNewState(diff){
  const g=sudokuGenerate(diff);
  return {diff,puzzle:g.puzzle,solution:g.solution,vals:g.puzzle.slice(),notes:Array.from({length:81},()=>0),sel:-1,secs:0,hints:0,errors:0,notesMode:false,showErrors:true,undo:[],won:false,coins:0,record:false};
}
function sudokuSaveGame(){if(!sd)return;try{localStorage.setItem(SUDOKU_GAME_KEY,JSON.stringify(sd));}catch(e){}}
function sudokuLoadGame(){
  try{const d=JSON.parse(localStorage.getItem(SUDOKU_GAME_KEY)||'null');
    if(d&&Array.isArray(d.puzzle)&&d.puzzle.length===81&&d.solution.length===81&&d.vals.length===81&&d.notes.length===81&&!d.won&&SUDOKU_CLUES[d.diff]){d.undo=d.undo||[];return d;}}catch(e){}
  return null;
}
function sudokuAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function sudokuBestAll(){try{const o=JSON.parse(localStorage.getItem(SUDOKU_BEST_KEY)||'{}');return o&&typeof o==='object'?o:{};}catch(e){return {};}}
function sudokuBest(diff){const k=(sudokuAccount()||'_gast').toLowerCase();return (sudokuBestAll()[diff]||{})[k]||0;}

/* ── Zug-Funktionen ── */
function sudokuPush(){sd.undo.push({vals:sd.vals.slice(),notes:sd.notes.slice()});if(sd.undo.length>200)sd.undo.shift();}
function sudokuPlace(n){
  if(!sd||sd.won||sd.sel<0||sd.puzzle[sd.sel])return;
  const i=sd.sel;
  if(sd.notesMode){
    if(sd.vals[i])return;
    sudokuPush();sd.notes[i]^=(1<<n);
  }else{
    if(sd.vals[i]===n)return;
    sudokuPush();sd.vals[i]=n;sd.notes[i]=0;
    if(n!==sd.solution[i])sd.errors++;
    // gleiche Zahl aus den Notizen der Nachbarn entfernen
    for(let j=0;j<81;j++)if(sudokuPeers(i,j))sd.notes[j]&=~(1<<n);
  }
  sudokuAfterMove();
}
function sudokuErase(){
  if(!sd||sd.won||sd.sel<0||sd.puzzle[sd.sel])return;
  if(!sd.vals[sd.sel]&&!sd.notes[sd.sel])return;
  sudokuPush();sd.vals[sd.sel]=0;sd.notes[sd.sel]=0;sudokuAfterMove();
}
function sudokuUndoMove(){
  if(!sd||sd.won||!sd.undo.length)return;
  const s=sd.undo.pop();sd.vals=s.vals;sd.notes=s.notes;sudokuAfterMove(true);
}
function sudokuHint(){
  if(!sd||sd.won)return;
  let i=sd.sel;
  if(i<0||sd.puzzle[i]||sd.vals[i]===sd.solution[i]){   // sonst die erste falsche/leere Zelle
    i=sd.vals.findIndex((v,k)=>!sd.puzzle[k]&&v!==sd.solution[k]);
  }
  if(i<0)return;
  sudokuPush();sd.vals[i]=sd.solution[i];sd.notes[i]=0;sd.sel=i;sd.hints++;
  for(let j=0;j<81;j++)if(sudokuPeers(i,j))sd.notes[j]&=~(1<<sd.solution[i]);
  sudokuAfterMove();
}
function sudokuAfterMove(noWinCheck){
  if(!noWinCheck&&sudokuSolved(sd.vals,sd.solution))sudokuWin();
  if(!sd.won)sudokuSaveGame();
  sudokuRender();
}
function sudokuWin(){
  sd.won=true;clearInterval(sudokuTimer);sudokuTimer=null;
  const acc=(sudokuAccount()||'_gast').toLowerCase(),all=sudokuBestAll(),d=all[sd.diff]=all[sd.diff]||{},prev=d[acc]||0;
  if(!sd.hints&&(!prev||sd.secs<prev)){d[acc]=sd.secs;sd.record=true;try{localStorage.setItem(SUDOKU_BEST_KEY,JSON.stringify(all));}catch(e){}}
  // Coins nur ohne Tipps, höchstens 12 pro Tag
  let coins=0;
  if(!sd.hints&&typeof zcp==='function'&&typeof zcAddCoins==='function'){
    try{const name=(zcp().player||'').trim(),today=new Date().toDateString();
      if(name){let c={};try{c=JSON.parse(localStorage.getItem('zf_sudoku_coins')||'{}');}catch(e){}
        if(c.date!==today)c={date:today,n:0};coins=Math.min(SUDOKU_COINS[sd.diff],SUDOKU_COINS_PER_DAY-c.n);
        if(coins>0){zcAddCoins(name,coins);c.n+=coins;localStorage.setItem('zf_sudoku_coins',JSON.stringify(c));if(typeof smSave==='function')smSave('zentrale');}else coins=0;}}catch(e){coins=0;}
  }
  sd.coins=coins;
  try{localStorage.removeItem(SUDOKU_GAME_KEY);}catch(e){}
  if(typeof sfx==='function'){try{sfx('win');}catch(e){}}
}

/* ── Oberfläche ── */
function sudokuInit(){
  const saved=sudokuLoadGame();
  sd=saved||sudokuNewState(document.getElementById('sudoku-diff')?document.getElementById('sudoku-diff').value:'medium');
  sudokuStartTimer();sudokuBindKeys();sudokuRender();
}
function sudokuNew(diff){
  sd=sudokuNewState(diff||(sd&&sd.diff)||'medium');sudokuSaveGame();sudokuStartTimer();sudokuRender();
}
function sudokuRoot(){return document.getElementById('sudoku-root');}
function sudokuStartTimer(){
  clearInterval(sudokuTimer);
  sudokuTimer=setInterval(()=>{
    const scr=document.getElementById('screen-sudoku');
    if(!sd||sd.won||!scr||!scr.classList.contains('active')||document.hidden)return;
    sd.secs++;const t=document.getElementById('sudoku-time');if(t)t.textContent=sudokuFmt(sd.secs);
    if(sd.secs%10===0)sudokuSaveGame();
  },1000);
}
function sudokuSelect(i){if(!sd)return;sd.sel=i;sudokuRender();}
function sudokuToggleNotes(){sd.notesMode=!sd.notesMode;sudokuRender();}
function sudokuToggleErrors(){sd.showErrors=!sd.showErrors;sudokuRender();}
function sudokuRestart(){
  const go=()=>{sd.vals=sd.puzzle.slice();sd.notes=Array(81).fill(0);sd.undo=[];sd.secs=0;sd.hints=0;sd.errors=0;sd.won=false;sudokuStartTimer();sudokuSaveGame();sudokuRender();};
  if(typeof appConfirm==='function')appConfirm('Dieses Rätsel von vorn beginnen?',go);else go();
}
function sudokuRender(){
  const root=sudokuRoot();if(!root||!sd)return;
  const conflicts=sudokuConflicts(sd.vals),counts=sudokuCounts(sd.vals),selVal=sd.sel>=0?sd.vals[sd.sel]:0;
  const cells=Array.from({length:81},(_,i)=>{
    const v=sd.vals[i],fixed=!!sd.puzzle[i],sel=i===sd.sel;
    const peer=sd.sel>=0&&sudokuPeers(sd.sel,i),same=selVal&&v===selVal&&!sel;
    const wrong=(conflicts.has(i)||(sd.showErrors&&v&&v!==sd.solution[i]))&&!fixed;
    let cls='sd-cell'+(fixed?' fixed':'')+(sel?' sel':peer?' peer':'')+(same?' same':'')+(wrong?' wrong':'')+((i%9===2||i%9===5)?' br':'')+((Math.floor(i/9)===2||Math.floor(i/9)===5)?' bb':'');
    let inner='';
    if(v)inner=String(v);
    else if(sd.notes[i]){inner='<div class="sd-notes">'+[1,2,3,4,5,6,7,8,9].map(n=>`<i>${sd.notes[i]&(1<<n)?n:''}</i>`).join('')+'</div>';}
    return `<button class="${cls}" onclick="sudokuSelect(${i})" aria-label="Zeile ${Math.floor(i/9)+1}, Spalte ${i%9+1}">${inner}</button>`;
  }).join('');
  const pad=[1,2,3,4,5,6,7,8,9].map(n=>`<button class="sd-num${counts[n]>=9?' done':''}" onclick="sudokuPlace(${n})"${counts[n]>=9?' disabled':''}>${n}<small>${9-counts[n]>0?9-counts[n]:''}</small></button>`).join('');
  const best=sudokuBest(sd.diff);
  root.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:12px">
      <select class="lrn-input" id="sudoku-diff" onchange="sudokuNew(this.value)">${Object.keys(SUDOKU_NAMES).map(k=>`<option value="${k}" ${sd.diff===k?'selected':''}>${SUDOKU_NAMES[k]}</option>`).join('')}</select>
      <button class="lrn-btn" onclick="sudokuNew(document.getElementById('sudoku-diff').value)">Neues Rätsel</button>
      <span id="sudoku-time" class="lrn-tile" style="padding:8px 14px;font-family:var(--mono);font-weight:800;font-size:16px">${sudokuFmt(sd.secs)}</span>
      <span style="font-size:12px;color:var(--text-3)">🏆 ${best?sudokuFmt(best):'–'} · ❌ ${sd.errors} · 💡 ${sd.hints}</span></div>
    <div class="sd-board">${cells}${sd.won?`<div class="sd-win"><div style="font-size:44px">🎉</div><div style="font-size:20px;font-weight:800">Gelöst in ${sudokuFmt(sd.secs)}!</div>
      <div style="font-size:12px;margin:6px 0 12px;opacity:.9">${sd.record?'🏆 Neue Bestzeit! ':''}${sd.hints?'Mit '+sd.hints+' Tipp'+(sd.hints===1?'':'s')+' – zählt nicht für die Bestzeit. ':''}${sd.coins?'🪙 +'+sd.coins+' Coins':''}</div><button class="lrn-btn" onclick="sudokuNew('${sd.diff}')">Noch ein Rätsel</button></div>`:''}</div>
    <div class="sd-pad">${pad}</div>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px">
      <button class="lrn-btn ghost${sd.notesMode?' active':''}" onclick="sudokuToggleNotes()">✏️ Notizen ${sd.notesMode?'an':'aus'}</button>
      <button class="lrn-btn ghost" onclick="sudokuErase()">⌫ Löschen</button>
      <button class="lrn-btn ghost" onclick="sudokuUndoMove()" ${sd.undo.length?'':'disabled'}>↩ Zurück</button>
      <button class="lrn-btn ghost" onclick="sudokuHint()">💡 Tipp</button>
      <button class="lrn-btn ghost${sd.showErrors?' active':''}" onclick="sudokuToggleErrors()">Fehler zeigen</button>
      <button class="lrn-btn ghost" onclick="sudokuRestart()">↺ Neu beginnen</button></div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:10px">Tastatur: Pfeile bewegen · 1–9 eintragen · Entf löschen · N Notizen · H Tipp · Strg+Z zurück</div>`;
}
function sudokuBindKeys(){
  if(sudokuKeysBound)return;sudokuKeysBound=true;
  document.addEventListener('keydown',e=>{
    const scr=document.getElementById('screen-sudoku');if(!scr||!scr.classList.contains('active')||!sd)return;
    if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    const k=e.key;
    if(/^[1-9]$/.test(k)){e.preventDefault();sudokuPlace(+k);}
    else if(k==='Backspace'||k==='Delete'||k==='0'){e.preventDefault();sudokuErase();}
    else if(k==='n'||k==='N'){e.preventDefault();sudokuToggleNotes();}
    else if(k==='h'||k==='H'){e.preventDefault();sudokuHint();}
    else if((e.ctrlKey||e.metaKey)&&(k==='z'||k==='Z')){e.preventDefault();sudokuUndoMove();}
    else if(k.startsWith('Arrow')){e.preventDefault();const s=sd.sel<0?40:sd.sel,r=Math.floor(s/9),c=s%9;
      const nr=k==='ArrowUp'?Math.max(0,r-1):k==='ArrowDown'?Math.min(8,r+1):r,nc=k==='ArrowLeft'?Math.max(0,c-1):k==='ArrowRight'?Math.min(8,c+1):c;sudokuSelect(nr*9+nc);}
  });
}
