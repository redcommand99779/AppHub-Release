/* ══════════════════════════════════
   WORDLE
══════════════════════════════════ */
const WORDLE_WORDS_DE=['APFEL','BIRNE','MANGO','TRAUM','STERN','BLUME','TISCH','STUHL','LAMPE','BRUCH','STEIN','SPIEL','MUSIK','BODEN','FEUER','WASSER','GLÜCK','LIEBE','KRAFT','DUNKEL','LICHT','PFERD','VOGEL','FISCH','BAUCH','SCHAF','GABEL','MESSER','GARTEN','TURM','KÖNIG','WALD','FLUSS','WOLKE','WIND','SCHNEE','REGEN','FROST','SONNE','MOND','BRIEF','BUCH','BRIEF','DACH','HAFEN','SCHIFF','KREIS','WÜRFEL','FARBE','PREIS','MARKT'];
const WORDLE_WORDS_EN=['CRANE','SLATE','AUDIO','RAISE','STARE','TRAIN','BRAIN','GRAIN','PLAIN','CHAIN','FLAME','BLAME','SHAME','FRAME','GRADE','TRADE','BRAVE','CRAVE','GRAVE','SHAVE','STONE','PHONE','ALONE','CLONE','DRONE','FLESH','FRESH','DRESS','PRESS','STRESS','BREAD','TREAD','SPEAK','CREAK','SNEAK','BLANK','CLANK','PLANK','THANK','FRANK'];
let wordleWord='',wordleGuesses=[],wordleCurrent='',wordleOver=false,wordleLang='de';
function wordleSetLang(l){wordleLang=l;document.getElementById('wordle-lang-de')?.classList.toggle('active',l==='de');document.getElementById('wordle-lang-en')?.classList.toggle('active',l==='en');wordleNew();}

function wordleSolve(){
  if(!wordleWord||wordleOver)return;
  const grid=document.getElementById('wordle-grid');if(!grid)return;
  const r=wordleGuesses.length<6?wordleGuesses.length:5;
  for(let i=0;i<5;i++){
    const cell=grid.children[r*5+i];if(!cell)continue;
    cell.textContent=wordleWord[i].toUpperCase();
    cell.style.background='#6aaa64';cell.style.color='#fff';cell.style.border='none';
  }
  wordleOver=true;
  const msg=document.getElementById('wordle-msg');
  if(msg)msg.textContent='Die Lösung war: '+wordleWord.toUpperCase();
}

function wordleNew(){
  const words=wordleLang==='de'?WORDLE_WORDS_DE:WORDLE_WORDS_EN;
  // Filter to 5-letter words
  const five=words.filter(w=>w.length===5);
  wordleWord=five[Math.floor(Math.random()*five.length)];
  wordleGuesses=[];wordleCurrent='';wordleOver=false;
  const msg=document.getElementById('wordle-msg');if(msg)msg.textContent='';
  wordleRenderGrid();wordleRenderKeyboard();
}
function wordleRenderGrid(){
  const grid=document.getElementById('wordle-grid');if(!grid)return;
  const rows=[];
  for(let r=0;r<6;r++){
    const guess=wordleGuesses[r]||'';
    const isCurrent=r===wordleGuesses.length&&!wordleOver;
    for(let c=0;c<5;c++){
      const letter=isCurrent?(wordleCurrent[c]||''):(guess[c]||'');
      let bg='var(--surface)';let border='0.5px solid var(--divider)';let color='var(--text)';
      if(r<wordleGuesses.length&&guess){
        const {colors}=wordleScore(guess,wordleWord);
        bg=colors[c]==='green'?'#538d4e':colors[c]==='yellow'?'#b59f3b':'#3a3a3c';
        border='none';color='#fff';
      }
      rows.push(`<div style="width:52px;height:52px;background:${bg};border:${border};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:${color};transition:background 0.2s">${letter}</div>`);
    }
  }
  grid.innerHTML=rows.join('');
}
function wordleScore(guess,target){
  const colors=Array(5).fill('gray');
  const targetArr=[...target];const guessArr=[...guess];
  // Green pass
  for(let i=0;i<5;i++)if(guessArr[i]===targetArr[i]){colors[i]='green';targetArr[i]=null;guessArr[i]=null;}
  // Yellow pass
  for(let i=0;i<5;i++){if(!guessArr[i])continue;const ti=targetArr.indexOf(guessArr[i]);if(ti>=0){colors[i]='yellow';targetArr[ti]=null;}}
  return{colors};
}
function wordleRenderKeyboard(){
  const kb=document.getElementById('wordle-keyboard');if(!kb)return;
  const rows=['QWERTZUIOP','ASDFGHJKL','YXCVBNM'];
  const letterColors={};
  wordleGuesses.forEach(g=>{const{colors}=wordleScore(g,wordleWord);[...g].forEach((l,i)=>{if(!letterColors[l]||letterColors[l]!=='green')letterColors[l]=colors[i];});});
  kb.innerHTML=rows.map(row=>`<div style="display:flex;gap:4px">${[...row].map(l=>{const col=letterColors[l];const bg=col==='green'?'#538d4e':col==='yellow'?'#b59f3b':col==='gray'?'#3a3a3c':'var(--surface)';const fc=col?'#fff':'var(--text)';return`<button onclick="wordleKey('${l}')" style="width:32px;height:40px;border-radius:4px;background:${bg};border:0.5px solid var(--divider);color:${fc};font-size:13px;font-weight:600;cursor:pointer">${l}</button>`;}).join('')}<button onclick="wordleKey('ENTER')" style="padding:0 8px;height:40px;border-radius:4px;background:var(--surface);border:0.5px solid var(--divider);color:var(--text);font-size:11px;font-weight:600;cursor:pointer">↵</button><button onclick="wordleKey('BACK')" style="width:36px;height:40px;border-radius:4px;background:var(--surface);border:0.5px solid var(--divider);color:var(--text);font-size:14px;cursor:pointer">⌫</button></div>`).join('');
}
function wordleKey(k){
  if(wordleOver)return;
  if(k==='BACK'){wordleCurrent=wordleCurrent.slice(0,-1);}
  else if(k==='ENTER'){
    if(wordleCurrent.length!==5){const msg=document.getElementById('wordle-msg');if(msg){msg.textContent='5 Buchstaben eingeben!';msg.style.color='var(--danger)';}return;}
    wordleGuesses.push(wordleCurrent);
    const{colors}=wordleScore(wordleCurrent,wordleWord);
    const won=colors.every(c=>c==='green');
    const msg=document.getElementById('wordle-msg');
    if(won){wordleOver=true;if(msg){msg.textContent='🎉 Gewonnen in '+wordleGuesses.length+' Versuchen!';msg.style.color='#34c759';}}
    else if(wordleGuesses.length>=6){wordleOver=true;if(msg){msg.textContent='Verloren! Das Wort war: '+wordleWord;msg.style.color='var(--danger)';}}
    else if(msg)msg.textContent='';
    wordleCurrent='';
  } else if('ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.includes(k)&&wordleCurrent.length<5){
    wordleCurrent+=k;
  }
  wordleRenderGrid();wordleRenderKeyboard();
}
document.addEventListener('keydown',e=>{
  if(document.querySelector('.screen.active')?.id!=='screen-wordle')return;
  if(e.key==='Enter')wordleKey('ENTER');
  else if(e.key==='Backspace')wordleKey('BACK');
  else if(e.key.length===1&&/[a-zA-ZäöüÄÖÜ]/.test(e.key))wordleKey(e.key.toUpperCase());
});

