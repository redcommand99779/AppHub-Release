
/* ── Vokabeln ── */
let vokCards=[],vokIdx=0,vokFlipped=false;
function vokInit(){vokCards=JSON.parse(localStorage.getItem('zf_vokabeln')||'[{"front":"Bonjour","back":"Hallo"},{"front":"Merci","back":"Danke"},{"front":"Maison","back":"Haus"},{"front":"Chat","back":"Katze"},{"front":"Chien","back":"Hund"}]');vokIdx=0;vokFlipped=false;vokShow();}
function vokShow(){const c=document.getElementById('vok-card');const s=document.getElementById('vok-stats');if(!c)return;if(!vokCards.length){c.textContent='Keine Karten';return;}const card=vokCards[vokIdx];c.textContent=vokFlipped?card.back:card.front;if(s)s.textContent=`${vokIdx+1}/${vokCards.length} Karten`;}
function vokFlip(){vokFlipped=!vokFlipped;vokShow();}
function vokCorrect(){vokIdx=(vokIdx+1)%vokCards.length;vokFlipped=false;vokShow();}
function vokWrong(){vokCards.push(vokCards[vokIdx]);vokIdx=(vokIdx+1)%vokCards.length;vokFlipped=false;vokShow();}
function vokAdd(){const f=prompt('Vorderseite:');if(!f)return;const b=prompt('Rückseite:');if(!b)return;vokCards.push({front:f,back:b});localStorage.setItem('zf_vokabeln',JSON.stringify(vokCards));vokShow();}
