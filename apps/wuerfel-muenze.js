/* ══════════════════════════════════
   WÜRFEL & MÜNZE
══════════════════════════════════ */
let diceType=6;
function setDiceType(t){
  diceType=t;
  document.querySelectorAll('.dice-type-btn').forEach(b=>{
    const label=b.textContent.trim();
    const match=t==='coin'?label.includes('Münze'):label===`W${t}`;
    b.classList.toggle('active',match);
  });
  document.getElementById('dice-count-row').style.display=t==='coin'?'none':'flex';
  document.getElementById('dice-result-area').innerHTML='<div style="color:var(--text-3);font-size:14px">Würfeln!</div>';
}
function diceRoll(){
  const area=document.getElementById('dice-result-area');
  if(diceType==='coin'){
    const r=Math.random()<0.5;
    area.innerHTML=`<div class="coin-display" style="font-size:64px">${r?'🪙 Kopf':'🔵 Zahl'}</div>`;
    return;
  }
  const count=Math.max(1,Math.min(20,+document.getElementById('dice-count').value||1));
  const rolls=Array.from({length:count},()=>Math.floor(Math.random()*diceType)+1);
  const total=rolls.reduce((a,b)=>a+b,0);
  let html=`<div class="dice-total">${total}</div>`;
  if(count>1)html+=`<div class="dice-individual">${rolls.join(' + ')} = ${total}</div>`;
  html+=`<div class="dice-faces">`;
  rolls.forEach(r=>{html+=`<div class="dice-face">${r}</div>`;});
  html+=`</div>`;
  area.innerHTML=html;
}
