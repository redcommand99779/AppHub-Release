let mathOp='all',mathCurrent={};
/* ── Mathe-Trainer ── */
let mathCorrect=0,mathWrong=0;
function mathSetOp(op){
  mathOp=op;
  ['all','+','-','×','÷'].forEach(o=>{const b=document.getElementById('math-op-'+o);if(b)b.classList.toggle('active',o===op);});
  mathNew();
}
function mathNew(){
  const level=parseInt(document.getElementById('math-level')?.value||2);
  const fb=document.getElementById('math-feedback');if(fb){fb.textContent='';fb.style.color='';}
  const inp=document.getElementById('math-answer');if(inp)inp.value='';
  if(level===4){
    const types=['power','root','percent','quadratic'];
    const t=types[Math.floor(Math.random()*types.length)];
    let question='',ans=0;
    if(t==='power'){const b=Math.floor(Math.random()*10)+2;const e=Math.floor(Math.random()*3)+2;ans=Math.pow(b,e);question=`${b}^${e} = ?`;}
    else if(t==='root'){const perfect=[4,9,16,25,36,49,64,81,100];const n=perfect[Math.floor(Math.random()*perfect.length)];ans=Math.sqrt(n);question=`√${n} = ?`;}
    else if(t==='percent'){const whole=Math.floor(Math.random()*9+1)*100;const pct=[5,10,15,20,25,50][Math.floor(Math.random()*6)];ans=whole*pct/100;question=`${pct}% von ${whole} = ?`;}
    else{const x=Math.floor(Math.random()*8)+2;ans=x;question=`x² = ${x*x}, x = ?`;}
    mathCurrent={question,ans,op:'höhere'};
    const q=document.getElementById('math-question');if(q)q.textContent=question;
    if(inp)inp.focus();return;
  }
  const max={1:10,2:50,3:100}[level];
  const ops=mathOp==='all'?['+','-','×','÷']:[mathOp];
  const op=ops[Math.floor(Math.random()*ops.length)];
  let a=Math.floor(Math.random()*max)+1,b,ans;
  if(op==='÷'){b=Math.floor(Math.random()*9)+1;a=b*(Math.floor(Math.random()*max/b)+1);}
  else b=Math.floor(Math.random()*max)+1;
  if(op==='+')ans=a+b;else if(op==='-'){if(a<b)[a,b]=[b,a];ans=a-b;}
  else if(op==='×')ans=a*b;else ans=a/b;
  mathCurrent={a,b,op,ans};
  const q=document.getElementById('math-question');if(q)q.textContent=`${a} ${op} ${b} = ?`;
  if(inp)inp.focus();
}
function mathCheck(){
  const inp=document.getElementById('math-answer');const fb=document.getElementById('math-feedback');
  if(!inp||!fb||!mathCurrent.ans===undefined)return;
  const val=parseFloat(inp.value);
  if(isNaN(val)){fb.textContent='Bitte eine Zahl eingeben';fb.style.color='var(--danger)';return;}
  if(Math.abs(val-mathCurrent.ans)<0.001){mathCorrect++;fb.textContent='✓ Richtig!';fb.style.color='#34c759';}
  else{mathWrong++;fb.textContent=`✗ Falsch. Richtig: ${mathCurrent.ans}`;fb.style.color='var(--danger)';}
  const c=document.getElementById('math-correct');const w=document.getElementById('math-wrong');
  if(c)c.textContent=mathCorrect;if(w)w.textContent=mathWrong;
  setTimeout(()=>mathNew(),1200);
}
