const HANGMAN_WORDS=['Programmieren','Werkbank','Diamant','Schmetterling','Abenteuer','Galaxie','Kristall','Horizont','Melodie','Strudel','Zauberer','Baumkrone','Regenbogen','Leuchtturm','Sandstrand','Vulkan','Drachenfels','Segelschiff','Mondlicht','Donnerwetter','Fahrradkette','Wassertropfen','Blitzableiter','Schokoladenkuchen','Weltreise'];
let hangmanWord='',hangmanGuessed=new Set(),hangmanErrors=0,hangmanOver=false;
let hmReported=false;
let hmMode='solo',hm2PWord='',hmP1Score=0,hmP2Score=0,hmRound=1;
const HANGMAN_FIGS=['😊','😐','😮','😨','😰','😱','💀'];

function hmSetMode(m){
  hmMode=m;if(typeof smRefresh==='function')smRefresh('hm');
  document.getElementById('hm-mode-solo')?.classList.toggle('active',m==='solo');
  document.getElementById('hm-mode-2p')?.classList.toggle('active',m==='2p');
  const score=document.getElementById('hm-score');
  if(score)score.style.display=m==='2p'?'flex':'none';
  hangmanNew();
}


function hangmanSolve(){
  if(!hangmanWord||hangmanOver)return;
  hangmanGuessed=new Set(hangmanWord.toUpperCase().split(''));
  hangmanOver=true;
  hangmanRender();
  const msg=document.getElementById('hangman-msg');
  if(msg){msg.textContent='Die Lösung war: '+hangmanWord.toUpperCase();msg.style.color='var(--text-3)';}
}

function hangmanNew(){
  if(typeof rplBegin==='function')rplBegin('hm');
  hangmanGuessed=new Set();hangmanErrors=0;hangmanOver=false;hmReported=false;
  if(hmMode==='2p'){
    // Show word input for player 1
    const inp=document.getElementById('hm-input-area');
    const game=document.getElementById('hm-game-area');
    if(inp)inp.style.display='block';
    if(game)game.style.display='none';
    const wi=document.getElementById('hm-word-input');
    if(wi){wi.value='';setTimeout(()=>wi.focus(),100);}
    const lbl=document.getElementById('hm-turn-label');
    if(lbl)lbl.textContent='';
  } else {
    hangmanWord=HANGMAN_WORDS[Math.floor(Math.random()*HANGMAN_WORDS.length)].toUpperCase();
    const inp=document.getElementById('hm-input-area');
    const game=document.getElementById('hm-game-area');
    if(inp)inp.style.display='none';
    if(game)game.style.display='block';
    const lbl=document.getElementById('hm-turn-label');
    if(lbl)lbl.textContent='';
    hangmanRender();
  }
}

function hmStartWith2P(){
  const wi=document.getElementById('hm-word-input');
  if(!wi)return;
  const word=wi.value.trim().toUpperCase().replace(/[^A-ZÄÖÜ]/g,'');
  if(word.length<2){wi.style.borderColor='var(--danger)';setTimeout(()=>wi.style.borderColor='',800);return;}
  hm2PWord=word;
  wi.value='';
  const inp=document.getElementById('hm-input-area');
  const game=document.getElementById('hm-game-area');
  if(inp)inp.style.display='none';
  if(game)game.style.display='block';
  hangmanWord=hm2PWord;
  if(typeof rplBegin==='function')rplBegin('hm');
  hangmanGuessed=new Set();hangmanErrors=0;hangmanOver=false;hmReported=false;
  const lbl=document.getElementById('hm-turn-label');
  if(lbl)lbl.textContent='👤 Spieler 2 ist dran!';
  hangmanRender();
}

function hangmanGuess(letter){
  if(hangmanGuessed.has(letter))return;
  hangmanGuessed.add(letter);
  if(!hangmanWord.includes(letter)){hangmanErrors++;sfx('nomatch');}else sfx('match');
  hangmanRender();
}

function hangmanRender(){
  if(hmMode==='2p'&&hangmanWord&&typeof rplPush==='function')rplPush('hm',{word:hangmanWord,guessed:[...hangmanGuessed],errors:hangmanErrors});
  const fig=document.getElementById('hangman-fig');
  const wordEl=document.getElementById('hangman-word');
  const keys=document.getElementById('hangman-keys');
  const msg=document.getElementById('hangman-msg');
  if(fig)fig.textContent=HANGMAN_FIGS[Math.min(hangmanErrors,6)];
  const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ';
  if(wordEl)wordEl.textContent=hangmanWord.split('').map(c=>LETTERS.includes(c)?(hangmanGuessed.has(c)?c:'_'):c).join(' ');
  if(keys)keys.innerHTML=LETTERS.split('').map(c=>`<button onclick="hangmanGuess('${c}')" style="width:36px;height:36px;border-radius:8px;background:${hangmanGuessed.has(c)?(hangmanWord.includes(c)?'#34c759':'#ff3b30'):'var(--surface)'};border:0.5px solid var(--divider);color:${hangmanGuessed.has(c)?'#fff':'var(--text)'};font-size:14px;font-weight:600;cursor:pointer;transition:all 0.1s">${c}</button>`).join('');
  const won=hangmanWord.split('').every(c=>hangmanGuessed.has(c)||!'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.includes(c));
  const lost=hangmanErrors>=6;
  if(msg){
    if(lost){
      if(hmMode==='2p'){
        hmP1Score++;const el=document.getElementById('hm-p1-score');if(el)el.textContent=hmP1Score;
        msg.textContent=`💀 Spieler 2 verliert! Wort: ${hangmanWord} — Spieler 1 bekommt einen Punkt!`;
        if(!hmReported){hmReported=true;setTimeout(()=>smReport('hm',{winner:0,scores:[hmP1Score,hmP2Score]}),900);}
      } else msg.textContent='💀 Verloren! Wort: '+hangmanWord;
      msg.style.color='var(--danger)';
    } else if(won){
      if(hmMode==='2p'){
        hmP2Score++;const el=document.getElementById('hm-p2-score');if(el)el.textContent=hmP2Score;
        msg.textContent=`🎉 Spieler 2 gewinnt! +1 Punkt`;
        if(!hmReported){hmReported=true;setTimeout(()=>smReport('hm',{winner:1,scores:[hmP1Score,hmP2Score]}),900);}
      } else msg.textContent='🎉 Gewonnen!';
      msg.style.color='#34c759';
    } else {
      msg.textContent=`${6-hangmanErrors} Versuche übrig`;
      msg.style.color='var(--text-3)';
    }
  }
  // Auto-disable buttons when game over
  if((won||lost)&&keys){
    hangmanOver=true;
    keys.querySelectorAll('button').forEach(b=>b.onclick=null);
  }
}

smRegister({id:'hm',screen:'screen-hangman',title:'Hangman',sides:['Wort-Geber','Rater'],
  active:()=>hmMode==='2p',sideAI:()=>[false,false],difficulty:()=>null,
  newGame:()=>{if(typeof hangmanNew==='function')hangmanNew();}});
