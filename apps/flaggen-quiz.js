/* ── Flaggen-Quiz ── */
const FQ_DATA=[{cc:'fr',name:'Frankreich'},{cc:'de',name:'Deutschland'},{cc:'jp',name:'Japan'},{cc:'br',name:'Brasilien'},{cc:'us',name:'USA'},{cc:'gb',name:'Großbritannien'},{cc:'cn',name:'China'},{cc:'in',name:'Indien'},{cc:'ru',name:'Russland'},{cc:'it',name:'Italien'},{cc:'es',name:'Spanien'},{cc:'au',name:'Australien'},{cc:'ca',name:'Kanada'},{cc:'mx',name:'Mexiko'},{cc:'kr',name:'Südkorea'},{cc:'sa',name:'Saudi-Arabien'}];
let fqIdx=0,fqScore=0,fqAnswered=false,fqOrder=[];
function fqInit(){fqOrder=[...FQ_DATA].sort(()=>Math.random()-0.5).slice(0,10);fqIdx=0;fqScore=0;fqAnswered=false;fqShow();}
function fqShow(){
  const q=fqOrder[fqIdx];if(!q)return;
  document.getElementById('fq-num').textContent=fqIdx+1;
  document.getElementById('fq-score').textContent=fqScore;
  document.getElementById('fq-flag').innerHTML=`<img src="https://flagcdn.com/w160/${q.cc}.png" alt="${escHtml(q.name)}" style="width:120px;height:auto;border:0.5px solid var(--divider);border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15)"/>`;
  document.getElementById('fq-msg').textContent='';
  fqAnswered=false;
  const wrongs=FQ_DATA.filter(f=>f.name!==q.name).sort(()=>Math.random()-0.5).slice(0,3);
  const opts=[...wrongs,q].sort(()=>Math.random()-0.5);
  const el=document.getElementById('fq-options');if(!el)return;
  el.innerHTML=opts.map(o=>`<button onclick="fqAnswer('${escHtml(o.name)}')" style="padding:12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;font-size:14px;color:var(--text);cursor:pointer;text-align:left;font-family:var(--font)">${escHtml(o.name)}</button>`).join('');
}
function fqAnswer(ans){
  if(fqAnswered)return;fqAnswered=true;
  const q=fqOrder[fqIdx];const msg=document.getElementById('fq-msg');
  if(ans===q.name){fqScore++;if(msg){msg.textContent='✓ Richtig!';msg.style.color='#34c759';}}
  else{if(msg){msg.textContent=`✗ Falsch. Richtig: ${q.name}`;msg.style.color='var(--danger)';}}
  setTimeout(()=>{fqIdx++;if(fqIdx>=fqOrder.length){const msg=document.getElementById('fq-msg');if(msg)msg.textContent=`Spiel vorbei! ${fqScore}/10 richtig.`;document.getElementById('fq-options').innerHTML=`<button onclick="fqInit()" class="btn-generate" style="padding:12px 24px;width:auto;margin:0 auto">Nochmal</button>`;}else fqShow();},1000);
}
