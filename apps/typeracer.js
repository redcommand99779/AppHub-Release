/* ══════════════════════════════════
   TYPERACER
══════════════════════════════════ */
const TR_TEXTS=['Der schnelle braune Fuchs springt über den faulen Hund und landet auf der anderen Seite.','Programmieren ist die Kunst, komplexe Probleme durch elegante Lösungen zu vereinfachen.','In der Stille des frühen Morgens beginnt die Stadt langsam aufzuwachen und zum Leben zu erwachen.','Die Musik spielt eine wichtige Rolle in der menschlichen Kultur und verbindet Menschen weltweit.','Wissenschaft und Technologie verändern unsere Welt in rasantem Tempo und eröffnen neue Möglichkeiten.'];
/* ── Typeracer ── */
let trText='',trPlayer=1,trStart=null;
let trP1WPM=0,trP1Time=0,trP2WPM=0,trP2Time=0,trP1Done=false,trP2Done=false;

function trNew(){
  trText=TR_TEXTS[Math.floor(Math.random()*TR_TEXTS.length)];
  trPlayer=1;trStart=null;trP1Done=false;trP2Done=false;
  trP1WPM=0;trP1Time=0;trP2WPM=0;trP2Time=0;
  clearInterval(trTimerInt);
  const inp=document.getElementById('tr-input');
  if(inp){inp.value='';inp.disabled=false;inp.focus();}
  const lbl=document.getElementById('tr-current-label');
  if(lbl)lbl.textContent='👤 Spieler 1 tippt…';
  const timer=document.getElementById('tr-timer');if(timer)timer.textContent='0.0s';
  const res=document.getElementById('tr-result');if(res)res.textContent='';
  const cmp=document.getElementById('tr-compare-btn');if(cmp)cmp.style.display='none';
  const st=document.getElementById('tr-status');if(st)st.textContent='Spieler 1 tippt zuerst. Los!';
  ['p1','p2'].forEach(p=>{
    const wpm=document.getElementById('tr-'+p+'-wpm');if(wpm)wpm.textContent='—';
    const time=document.getElementById('tr-'+p+'-time');if(time)time.textContent='—';
  });
  const el=document.getElementById('tr-text');if(!el)return;
  el.innerHTML=trText.split('').map(ch=>'<span>'+escHtml(ch)+'</span>').join('');
}

function trType(){
  const inp=document.getElementById('tr-input');if(!inp)return;
  const typed=inp.value;
  if(!trStart&&typed.length>0){
    trStart=Date.now();
    clearInterval(trTimerInt);
    trTimerInt=setInterval(()=>{
      const t=document.getElementById('tr-timer');
      if(t)t.textContent=((Date.now()-trStart)/1000).toFixed(1)+'s';
    },100);
  }
  // Highlight text
  const spans=document.querySelectorAll('#tr-text span');
  typed.split('').forEach((ch,i)=>{
    if(!spans[i])return;
    spans[i].style.color=ch===trText[i]?'#34c759':'#ff3b30';
    spans[i].style.background=ch===trText[i]?'transparent':'rgba(255,59,48,0.1)';
    spans[i].style.fontWeight=ch===trText[i]?'':'700';
  });
  for(let i=typed.length;i<spans.length;i++){
    spans[i].style.color='';spans[i].style.background='';spans[i].style.fontWeight='';
  }
  // Check if done
  if(typed===trText)trFinish();
}

function trFinish(){
  clearInterval(trTimerInt);
  const elapsed=(Date.now()-trStart)/1000;
  const wordCount=trText.trim().split(/\s+/).length;
  const wpm=Math.round(wordCount/(elapsed/60));
  const inp=document.getElementById('tr-input');
  if(trPlayer===1){
    trP1WPM=wpm;trP1Time=elapsed;trP1Done=true;
    const w1=document.getElementById('tr-p1-wpm');if(w1)w1.textContent=wpm+' WPM';
    const t1=document.getElementById('tr-p1-time');if(t1)t1.textContent=elapsed.toFixed(1)+'s';
    // Switch to player 2
    trPlayer=2;trStart=null;
    clearInterval(trTimerInt);
    if(inp){inp.value='';inp.disabled=false;inp.focus();}
    const timer=document.getElementById('tr-timer');if(timer)timer.textContent='0.0s';
    const lbl=document.getElementById('tr-current-label');if(lbl)lbl.textContent='👤 Spieler 2 tippt…';
    const st=document.getElementById('tr-status');if(st)st.textContent='Spieler 1 fertig! Spieler 2 ist dran.';
    // Reset highlighting
    document.querySelectorAll('#tr-text span').forEach(s=>{s.style.color='';s.style.background='';});
  }else{
    trP2WPM=wpm;trP2Time=elapsed;trP2Done=true;
    const w2=document.getElementById('tr-p2-wpm');if(w2)w2.textContent=wpm+' WPM';
    const t2=document.getElementById('tr-p2-time');if(t2)t2.textContent=elapsed.toFixed(1)+'s';
    if(inp)inp.disabled=true;
    // Show result
    const res=document.getElementById('tr-result');
    const cmp=document.getElementById('tr-compare-btn');
    if(cmp)cmp.style.display='block';
    if(res){
      if(trP1WPM>trP2WPM)res.textContent='🏆 Spieler 1 gewinnt! ('+trP1WPM+' vs '+trP2WPM+' WPM)';
      else if(trP2WPM>trP1WPM)res.textContent='🏆 Spieler 2 gewinnt! ('+trP2WPM+' vs '+trP1WPM+' WPM)';
      else res.textContent='🤝 Unentschieden! ('+trP1WPM+' WPM)';
    }
  }
}

function trShowComparison(){
  const res=document.getElementById('tr-result');if(!res)return;
  res.innerHTML='Spieler 1: '+trP1WPM+' WPM in '+trP1Time.toFixed(1)+'s<br>Spieler 2: '+trP2WPM+' WPM in '+trP2Time.toFixed(1)+'s';
}
