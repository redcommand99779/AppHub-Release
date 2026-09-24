/* ══════════════════════════════════
   PASSWORT-GENERATOR
══════════════════════════════════ */
const PW_SETS={upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',lower:'abcdefghijklmnopqrstuvwxyz',nums:'0123456789',spec:'!@#$%^&*()-_=+[]{}|;:,.<>?'};
const pwState={upper:true,lower:true,nums:true,spec:true};
function pwToggle(k){pwState[k]=!pwState[k];const b=document.getElementById('pw-'+k);b.className='pw-toggle '+(pwState[k]?'on':'off');pwGen();}
function pwGen(){
  let chars='';
  if(pwState.upper)chars+=PW_SETS.upper;
  if(pwState.lower)chars+=PW_SETS.lower;
  if(pwState.nums)chars+=PW_SETS.nums;
  if(pwState.spec)chars+=PW_SETS.spec;
  if(!chars)chars=PW_SETS.lower;
  const len=+document.getElementById('pw-len').value;
  let pw='';
  const arr=new Uint32Array(len);crypto.getRandomValues(arr);
  arr.forEach(v=>{pw+=chars[v%chars.length];});
  document.getElementById('pw-text').textContent=pw;
  pwStrength(pw);
}
function pwStrength(pw){
  let score=0;
  if(pw.length>=8)score++;if(pw.length>=16)score++;
  if(/[A-Z]/.test(pw))score++;if(/[a-z]/.test(pw))score++;
  if(/[0-9]/.test(pw))score++;if(/[^A-Za-z0-9]/.test(pw))score++;
  const labels=['Sehr schwach','Schwach','Mittel','Gut','Stark','Sehr stark'];
  const colors=['#ff3b30','#ff9f0a','#ffcc00','#34c759','#30d158','#28c840'];
  const bar=document.getElementById('pw-strength');
  bar.style.background=colors[Math.min(score-1,5)]||'var(--divider)';
  bar.style.width=(score/6*100)+'%';
  document.getElementById('pw-strength-label').textContent=labels[Math.min(score-1,5)]||'';
}
function pwCopy(){
  const pw=document.getElementById('pw-text').textContent;
  navigator.clipboard.writeText(pw).catch(()=>{});
  const btn=document.getElementById('pw-copy-btn');btn.textContent='✓ Kopiert';
  setTimeout(()=>btn.textContent='Kopieren',1500);
}
