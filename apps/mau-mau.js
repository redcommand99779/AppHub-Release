/* ══════════════════════════════════
   MAU-MAU
══════════════════════════════════ */
let mmDeck=[],mmPlayerHand=[],mmAIHand=[],mmDiscard=null,mmDrawPile=[],mmPendingPlus2=0,mmOver=false,mmWishColor=null;
const MM_COLORS=['♥','♠','♦','♣'];const MM_VALUES=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const MM_COLORS_CSS={'♥':'#e74c3c','♠':'#2c3e50','♦':'#e67e22','♣':'#27ae60'};
let mmLevel=(localStorage.getItem('zf_default_diff')||'medium'),mmAiTimer=null;
function mmSetLevel(l,quiet){
  mmLevel=l;
  ['easy','medium','hard','expert'].forEach(x=>document.getElementById('mm-diff-'+x)?.classList.toggle('active',x===l));
  if(!quiet&&typeof smRefresh==='function')smRefresh('mm');
}
function mmAiColorCount(c){return mmAIHand.filter(x=>x.c===c).length;}
function mmAiBestColor(){let best=MM_COLORS[0],bc=-1;MM_COLORS.forEach(c=>{const n=mmAiColorCount(c);if(n>bc){bc=n;best=c;}});return best;}
function mmAiScore(card){
  let s=0;
  if(card.v==='J'){if(mmAIHand.length<=2)s+=10;else s-=6;}
  else{s+=mmAIHand.filter(x=>x.v===card.v).length*1.5+mmAiColorCount(card.c)*0.4;}
  if(card.v==='7')s+=mmPlayerHand.length<=3?6:3;
  return s;
}
function mmAiPick(playable){
  if(mmLevel==='easy')return playable[Math.floor(Math.random()*playable.length)];
  if(mmLevel==='medium')return playable[0];
  let best=playable[0],bs=-1e9;
  playable.forEach(x=>{const sc=mmAiScore(x.c);if(sc>bs){bs=sc;best=x;}});
  return best;
}
function mmNew(){
  clearTimeout(mmAiTimer);
  if(typeof rplBegin==='function')rplBegin('mm');
  mmDeck=[];MM_COLORS.forEach(c=>MM_VALUES.forEach(v=>mmDeck.push({c,v})));
  mmDeck.sort(()=>Math.random()-0.5);
  const mmHS=parseInt(document.getElementById('mm-hand-size')?.value||'7');mmPlayerHand=mmDeck.splice(0,mmHS);mmAIHand=mmDeck.splice(0,mmHS);
  mmDrawPile=[...mmDeck];mmDiscard=mmDrawPile.pop();mmDeck=[];
  mmOver=false;mmWishColor=null;mmPendingPlus2=0;
  mmRender();
  if(typeof smSnap==='function')smSnap('mm',true);
}
function mmCanPlay(card){
  if(!mmDiscard)return true;
  if(card.v==='J')return true;
  const effColor=mmWishColor||mmDiscard.c;
  return card.c===effColor||card.v===mmDiscard.v;
}
function mmPlay(idx,isAI=false){
  const hand=isAI?mmAIHand:mmPlayerHand;
  const card=hand[idx];if(!card)return;
  if(!mmCanPlay(card)&&!isAI)return;
  hand.splice(idx,1);mmDiscard=card;mmWishColor=null;sfx('card');
  if(card.v==='7'){mmPendingPlus2+=2;}
  if(card.v==='8'){if(!isAI){mmRender();mmAITurn();return;}else{mmRender();return;}}
  if(card.v==='J'){
    if(!isAI){const colors=MM_COLORS_CSS;const el=document.getElementById('mm-color-pick');if(el)el.style.display='block';mmRender();return;}
    else{mmWishColor=(mmLevel==='hard'||mmLevel==='expert')?mmAiBestColor():MM_COLORS[Math.floor(Math.random()*4)];const el=document.getElementById('mm-wish-color');if(el){el.textContent=mmWishColor;el.style.background=MM_COLORS_CSS[mmWishColor];}}}
  if(!hand.length){mmOver=true;const st=document.getElementById('mm-status');if(st)st.textContent=(isAI?'KI gewinnt! 🤖':'Du gewinnst! 🎉');mmRender();smReport('mm',{winner:isAI?1:0});return;}
  mmRender();
  if(!isAI)mmAiTimer=setTimeout(mmAITurn,600);
}
function mmPickColor(c){mmWishColor=c;const el=document.getElementById('mm-color-pick');if(el)el.style.display='none';const wc=document.getElementById('mm-wish-color');if(wc){wc.textContent=c;wc.style.background=MM_COLORS_CSS[c];}mmRender();mmAiTimer=setTimeout(mmAITurn,600);}
function mmDraw(){
  if(mmOver)return;
  const n=mmPendingPlus2||1;mmPendingPlus2=0;sfx('click');
  for(let i=0;i<n;i++){if(!mmDrawPile.length)return;mmPlayerHand.push(mmDrawPile.pop());}
  mmRender();mmAiTimer=setTimeout(mmAITurn,600);
}
function mmAITurnCore(){
  if(mmOver)return;
  if(mmPendingPlus2>0){
    if(mmLevel==='hard'||mmLevel==='expert'){const i7=mmAIHand.findIndex(c=>c.v==='7');if(i7>=0){mmPlay(i7,true);return;}}
    for(let i=0;i<mmPendingPlus2;i++){if(mmDrawPile.length)mmAIHand.push(mmDrawPile.pop());}
    mmPendingPlus2=0;mmRender();return;
  }
  const playable=mmAIHand.map((c,i)=>({c,i})).filter(({c})=>mmCanPlay(c));
  if(playable.length&&!(mmLevel==='easy'&&Math.random()<0.25&&mmDrawPile.length)){mmPlay(mmAiPick(playable).i,true);}
  else{if(mmDrawPile.length)mmAIHand.push(mmDrawPile.pop());}
  mmRender();
}
function mmAITurn(){mmAITurnCore();if(!mmOver&&typeof smSnap==='function')smSnap('mm');}
function mmCardHtml(card,onclick='',hidden=false){
  if(hidden)return `<div style="width:56px;height:84px;background:#1a5fc4;border-radius:8px;border:2px solid var(--divider);display:flex;align-items:center;justify-content:center;font-size:22px">🂠</div>`;
  return `<div onclick="${onclick}" style="width:56px;height:84px;background:#fff;border-radius:8px;border:2px solid ${mmCanPlay(card)?'var(--accent)':'var(--divider)'};display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:${onclick?'pointer':'default'};font-size:18px;font-weight:700;color:${MM_COLORS_CSS[card.c]}">${card.v}<br>${card.c}</div>`;
}
function mmRender(){
  if(typeof rplPush==='function'&&mmDiscard)rplPush('mm',{p:mmPlayerHand.map(c=>({...c})),a:mmAIHand.map(c=>({...c})),d:{...mmDiscard},pile:mmDrawPile.length,wish:mmWishColor});
  const ai=document.getElementById('mm-ai-hand');const player=document.getElementById('mm-player-hand');const disc=document.getElementById('mm-discard');const cnt=document.getElementById('mm-ai-count');const deckCnt=document.getElementById('mm-deck-count');const st=document.getElementById('mm-status');
  if(ai)ai.innerHTML=mmAIHand.map(()=>mmCardHtml(null,'',true)).join('');
  if(cnt)cnt.textContent=mmAIHand.length;
  if(disc&&mmDiscard)disc.innerHTML=`<div style="width:56px;height:84px;background:#fff;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:${MM_COLORS_CSS[mmDiscard.c]}">${mmDiscard.v}<br>${mmDiscard.c}</div>`;
  if(deckCnt)deckCnt.textContent=mmDrawPile.length;
  if(player)player.innerHTML=mmPlayerHand.map((c,i)=>mmCardHtml(c,`mmPlay(${i})`)).join('');
  if(st&&!mmOver)st.textContent=mmPendingPlus2?`+${mmPendingPlus2} — Karte ziehen oder auch +2 legen!`:'Dein Zug';
}


smRegister({id:'mm',screen:'screen-maumau',title:'Mau-Mau',sides:['Du','Gegner'],
  sideAI:()=>[false,true],difficulty:()=>mmLevel,levels:['easy','medium','hard','expert'],setLevel:l=>mmSetLevel(l,true),
  snapshot:()=>({p:mmPlayerHand.map(c=>({...c})),a:mmAIHand.map(c=>({...c})),d:{...mmDiscard},pile:mmDrawPile.map(c=>({...c})),wish:mmWishColor,pend:mmPendingPlus2}),
  isOver:()=>mmOver,cancelPending:()=>clearTimeout(mmAiTimer),
  restore:(st)=>{
    mmPlayerHand=st.p.map(c=>({...c}));mmAIHand=st.a.map(c=>({...c}));mmDiscard={...st.d};mmDrawPile=st.pile.map(c=>({...c}));
    mmWishColor=st.wish;mmPendingPlus2=st.pend;mmOver=false;
    const cp=document.getElementById('mm-color-pick');if(cp)cp.style.display='none';
    const wc=document.getElementById('mm-wish-color');if(wc){wc.textContent=mmWishColor||'';wc.style.background=mmWishColor?MM_COLORS_CSS[mmWishColor]:'';}
    mmRender();
  },
  newGame:mmNew});
