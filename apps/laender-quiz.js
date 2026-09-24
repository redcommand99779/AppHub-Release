
/* ── Länder-Quiz ── */
const LQ_DATA=[{q:'Hauptstadt von Frankreich?',a:'Paris',opts:['Paris','Lyon','Marseille','Bordeaux']},{q:'Hauptstadt von Japan?',a:'Tokyo',opts:['Osaka','Kyoto','Tokyo','Hiroshima']},{q:'Hauptstadt von Brasilien?',a:'Brasília',opts:['São Paulo','Rio de Janeiro','Brasília','Salvador']},{q:'Hauptstadt von Australien?',a:'Canberra',opts:['Sydney','Melbourne','Canberra','Brisbane']},{q:'Hauptstadt von Kanada?',a:'Ottawa',opts:['Toronto','Vancouver','Ottawa','Montreal']},{q:'Hauptstadt von Argentinien?',a:'Buenos Aires',opts:['Córdoba','Rosario','Buenos Aires','Mendoza']},{q:'Hauptstadt von Ägypten?',a:'Kairo',opts:['Alexandria','Kairo','Luxor','Aswan']},{q:'Hauptstadt von Russland?',a:'Moskau',opts:['St. Petersburg','Moskau','Kasan','Nowosibirsk']},{q:'Hauptstadt von China?',a:'Peking',opts:['Shanghai','Peking','Guangzhou','Shenzhen']},{q:'Hauptstadt von Indien?',a:'Neu-Delhi',opts:['Mumbai','Kolkata','Neu-Delhi','Chennai']}];
let lqIdx=0,lqScore=0,lqAnswered=false;
function lqInit(){lqIdx=0;lqScore=0;lqAnswered=false;lqShow();}
function lqShow(){
  const q=LQ_DATA[lqIdx];if(!q)return;
  document.getElementById('lq-num').textContent=lqIdx+1;
  document.getElementById('lq-score').textContent=lqScore;
  document.getElementById('lq-question').textContent=q.q;
  document.getElementById('lq-msg').textContent='';
  lqAnswered=false;
  const opts=document.getElementById('lq-options');if(!opts)return;
  opts.innerHTML=q.opts.map(o=>`<button onclick="lqAnswer('${escHtml(o)}')" style="padding:12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;font-size:14px;color:var(--text);cursor:pointer;text-align:left;font-family:var(--font)">${escHtml(o)}</button>`).join('');
}
function lqAnswer(ans){
  if(lqAnswered)return;lqAnswered=true;
  const q=LQ_DATA[lqIdx];const msg=document.getElementById('lq-msg');
  if(ans===q.a){lqScore++;if(msg){msg.textContent='✓ Richtig!';msg.style.color='#34c759';}}
  else{if(msg){msg.textContent=`✗ Falsch. Richtig: ${q.a}`;msg.style.color='var(--danger)';}}
  setTimeout(()=>{lqIdx++;if(lqIdx>=LQ_DATA.length){const msg=document.getElementById('lq-msg');if(msg)msg.textContent=`Spiel vorbei! ${lqScore}/${LQ_DATA.length} richtig.`;document.getElementById('lq-options').innerHTML=`<button onclick="lqInit()" class="btn-generate" style="padding:12px 24px;width:auto;margin:0 auto">Nochmal</button>`;}else lqShow();},1000);
}
