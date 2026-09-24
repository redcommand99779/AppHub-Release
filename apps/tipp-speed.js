
/* ── Tipp-Speed ── */
const TYPING_TEXTS=['Der schnelle braune Fuchs springt über den faulen Hund.','Die Sonne scheint hell am blauen Himmel über den grünen Bergen.','Programmieren ist eine Kunst und eine Wissenschaft zugleich.','Übung macht den Meister, besonders beim Tippen auf der Tastatur.'];
let typingStart=null,typingOriginal='',typingDone=false;
function typingNew(){
  typingOriginal=TYPING_TEXTS[Math.floor(Math.random()*TYPING_TEXTS.length)];
  typingStart=null;typingDone=false;
  const inp=document.getElementById('typing-input');if(inp){inp.value='';inp.disabled=false;inp.focus();}
  const wpm=document.getElementById('typing-wpm');const acc=document.getElementById('typing-acc');const time=document.getElementById('typing-time');
  if(wpm)wpm.textContent='0';if(acc)acc.textContent='100%';if(time)time.textContent='0s';
  const txt=document.getElementById('typing-text');if(txt)txt.innerHTML=typingOriginal.split('').map(c=>`<span>${escHtml(c)}</span>`).join('');
}
function typingCheck(){
  if(typingDone)return;
  const inp=document.getElementById('typing-input');if(!inp)return;
  if(!typingStart)typingStart=Date.now();
  const typed=inp.value;
  const elapsed=(Date.now()-typingStart)/1000;
  const words=typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm=elapsed>0?Math.round(words/(elapsed/60)):0;
  const correct=typed.split('').filter((c,i)=>c===typingOriginal[i]).length;
  const acc=typed.length>0?Math.round(correct/typed.length*100):100;
  const wpmEl=document.getElementById('typing-wpm');const accEl=document.getElementById('typing-acc');const timeEl=document.getElementById('typing-time');
  if(wpmEl)wpmEl.textContent=wpm;if(accEl)accEl.textContent=acc+'%';if(timeEl)timeEl.textContent=Math.round(elapsed)+'s';
  const txt=document.getElementById('typing-text');
  if(txt)txt.innerHTML=typingOriginal.split('').map((c,i)=>{
    let color='var(--text-2)';
    if(i<typed.length)color=typed[i]===c?'#34c759':'#ff3b30';
    return `<span style="color:${color};${i===typed.length?'text-decoration:underline':''}">${escHtml(c)}</span>`;
  }).join('');
  if(typed===typingOriginal){typingDone=true;const b=document.getElementById('typing-wpm');if(b)b.textContent=wpm;}
}
