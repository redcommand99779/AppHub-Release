/* ══════════════════════════════════
   RECHNER
══════════════════════════════════ */
let calcMode='basic';
let calcExpr='';   // display expression string
let calcInput='0'; // current input
let calcJustEvaled=false;
let calcAngle='deg'; // deg or rad

const BASIC_BTNS=[
  ['AC','clear','fn clear'],['±','sign','fn'],['%','pct','fn'],['÷','op'],
  ['7','7',''],  ['8','8',''],  ['9','9',''],  ['×','op'],
  ['4','4',''],  ['5','5',''],  ['6','6',''],  ['−','op'],
  ['1','1',''],  ['2','2',''],  ['3','3',''],  ['+','op'],
  ['0','0','wide'],['.','.',''],              ['=','eq','eq'],
];
const SCI_BTNS=[
  ['sin','sin(','sci-fn'],['cos','cos(','sci-fn'],['tan','tan(','sci-fn'],['ln','ln(','sci-fn'],['log','log(','sci-fn'],
  ['√','sqrt(','sci-fn'],['x²','sq','sci-fn'],['xʸ','^','sci-fn'],['ⁿ√x','nthroot','sci-fn'],['1/x','inv','sci-fn'],
  ['(','(','sci-fn'],[')','paren-close','sci-fn'],['π','pi','sci-fn'],['e','e','sci-fn'],['DEG','deg','sci-fn'],
  ['AC','clear','fn clear'],['±','sign','fn'],['%','pct','fn'],['CE','ce','fn'],['÷','op'],
  ['7','7',''],['8','8',''],['9','9',''],['×','op'],['−','op'],
  ['4','4',''],['5','5',''],['6','6',''],['3','3',''],['+','op'],
  ['1','1',''],['2','2',''],['0','0',''],['.','.',''],['=','eq','eq'],
];

function setCalcMode(m){
  calcMode=m;
  document.getElementById('mode-basic').classList.toggle('active',m==='basic');
  document.getElementById('mode-sci').classList.toggle('active',m==='sci');
  renderCalc();
}

function renderCalc(){
  const grid=document.getElementById('calc-buttons');
  const btns=calcMode==='basic'?BASIC_BTNS:SCI_BTNS;
  const cols=calcMode==='basic'?4:5;
  grid.innerHTML='';
  const g=document.createElement('div');
  g.className='calc-grid '+(calcMode==='basic'?'basic':'sci');
  btns.forEach(([label,action,cls])=>{
    const b=document.createElement('button');
    b.className='calc-btn '+(cls||'');
    b.textContent=label;
    if(action==='deg')b.textContent=calcAngle.toUpperCase();
    if(cls&&cls.includes('wide'))b.style.gridColumn='span 2';
    b.dataset.action=action;
    b.onclick=()=>calcPress(b.dataset.action,label,b);
    g.appendChild(b);
  });
  grid.appendChild(g);
  updateCalcDisplay();
}

function calcPress(action,label,btn){
  const errEl=document.getElementById('calc-error');
  errEl.textContent='';
  // operators
  const OPS={'+':'+','−':'-','×':'*','÷':'/'};
  if(['÷','×','−','+'].includes(label)||action==='^'){
    const op=action==='^'?'^':label;
    if(calcJustEvaled){calcExpr=calcInput+op;calcInput='0';calcJustEvaled=false;}
    else{
      // always append current input unless we're right after an operator or opening paren
      const endsWithOp=/[+\-×÷\^(]$/.test(calcExpr);
      if(!endsWithOp)calcExpr+=calcInput;
      else if(calcInput!=='0')calcExpr+=calcInput; // user typed something after op
      calcExpr+=op;calcInput='0';
    }
    updateCalcDisplay();return;
  }
  if(action==='eq'){doEval();return;}
  if(action==='clear'){calcExpr='';calcInput='0';calcJustEvaled=false;updateCalcDisplay();return;}
  if(action==='ce'){
    // delete last digit of current input, or reset to 0
    if(calcInput.length>1&&calcInput!=='-0'){calcInput=calcInput.slice(0,-1)||'0';}
    else{calcInput='0';}
    calcJustEvaled=false;updateCalcDisplay();return;
  }
  if(action==='sign'){calcInput=calcInput.startsWith('-')?calcInput.slice(1):calcInput==='0'?'0':'-'+calcInput;updateCalcDisplay();return;}
  if(action==='pct'){calcInput=String(parseFloat(calcInput)/100);updateCalcDisplay();return;}
  if(action==='pi'){insertNum(String(Math.PI));return;}
  if(action==='e'){insertNum(String(Math.E));return;}
  if(action==='sq'){calcInput=String(parseFloat(calcInput)**2);calcJustEvaled=true;updateCalcDisplay();return;}
  if(action==='inv'){calcInput=String(1/parseFloat(calcInput));calcJustEvaled=true;updateCalcDisplay();return;}
  if(action==='nthroot'){
    // xʸ√ prompt: uses current input as n, adds nthroot( to expr
    // We encode it as: nthroot(n, x) = x**(1/n)
    // Push current input as the n, then open nthroot function
    const n=calcInput;
    if(calcJustEvaled)calcExpr='';
    calcExpr+=`nthroot(${n},`;
    calcInput='0';calcJustEvaled=false;
    updateCalcDisplay();return;
  }
  if(['sin(','cos(','tan(','ln(','log(','sqrt('].includes(action)){
    if(calcJustEvaled){calcExpr=action;calcInput='0';calcJustEvaled=false;}
    else{calcExpr+=action;calcInput='0';}
    updateCalcDisplay();return;
  }
  if(action==='('){calcExpr+='(';updateCalcDisplay();return;}
  if(action==='paren-close'){
    if(calcInput!=='0')calcExpr+=calcInput;
    calcExpr+=')';calcInput='0';updateCalcDisplay();return;
  }
  if(action==='deg'){calcAngle=calcAngle==='deg'?'rad':'deg';renderCalc();return;}
  // digit / dot
  if(calcJustEvaled){calcExpr='';calcInput='0';calcJustEvaled=false;}
  if(action==='.'){if(!calcInput.includes('.'))calcInput+='.';updateCalcDisplay();return;}
  calcInput=calcInput==='0'?action:calcInput+action;
  updateCalcDisplay();
}

function insertNum(v){
  if(calcJustEvaled){calcExpr='';calcInput=v;calcJustEvaled=true;}
  else{calcInput=v;}
  updateCalcDisplay();
}

function doEval(){
  const errEl=document.getElementById('calc-error');
  const origExpr=calcExpr+(calcInput!=='0'?calcInput:'');
  let expr=origExpr;
  if(!expr||expr==='0'){return;}
  try{
    expr=expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\^/g,'**');
    expr=expr
      .replace(/sin\(([^)]+)\)/g,(_,a)=>`Math.sin(${calcAngle==='deg'?`(${a})*Math.PI/180`:a})`)
      .replace(/cos\(([^)]+)\)/g,(_,a)=>`Math.cos(${calcAngle==='deg'?`(${a})*Math.PI/180`:a})`)
      .replace(/tan\(([^)]+)\)/g,(_,a)=>`Math.tan(${calcAngle==='deg'?`(${a})*Math.PI/180`:a})`)
      .replace(/ln\(([^)]+)\)/g,(_,a)=>`Math.log(${a})`)
      .replace(/log\(([^)]+)\)/g,(_,a)=>`Math.log10(${a})`)
      .replace(/sqrt\(([^)]+)\)/g,(_,a)=>`Math.sqrt(${a})`)
      .replace(/nthroot\(([^,]+),([^)]+)\)/g,(_,n,x)=>`Math.pow(${x},1/(${n}))`);
    const res=Function('"use strict";return ('+expr+')')();
    if(!isFinite(res)||isNaN(res)){errEl.textContent='Ungültiger Ausdruck';return;}
    calcExpr=origExpr+' =';
    calcInput=String(parseFloat(res.toFixed(10)));
    calcJustEvaled=true;
    updateCalcDisplay();
  }catch(e){errEl.textContent='Fehler im Ausdruck';}
}

function updateCalcDisplay(){
  document.getElementById('calc-expr').textContent=calcExpr;
  const v=parseFloat(calcInput);
  document.getElementById('calc-val').textContent=isNaN(v)?calcInput:parseFloat(calcInput.replace(',','.')).toLocaleString('de-DE',{maximumFractionDigits:10});
}

// Keyboard for calc

