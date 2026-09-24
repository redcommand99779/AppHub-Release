/* ══════════════════════════════════
   TIMER & STOPPUHR
══════════════════════════════════ */
let timerInterval=null,timerRemaining=0,timerRunning=false;
let swInterval=null,swElapsed=0,swRunning=false,swLaps=[];

function timerSetMode(mode){
  ['countdown','stopwatch','alarm'].forEach(m=>{
    const tab=document.getElementById('ttab-'+m);
    const ui=document.getElementById('timer-'+m+'-ui');
    if(tab)tab.classList.toggle('active',m===mode);
    if(ui)ui.style.display=m===mode?'block':'none';
  });
}
function timerPreview(){
  const h=+document.getElementById('t-h').value||0;
  const m=+document.getElementById('t-m').value||0;
  const s=+document.getElementById('t-s').value||0;
  timerRemaining=h*3600+m*60+s;
  timerShowRemaining();
}
function timerShowRemaining(){
  const h=Math.floor(timerRemaining/3600),m=Math.floor((timerRemaining%3600)/60),s=timerRemaining%60;
  document.getElementById('timer-display').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function timerToggle(){
  if(timerRunning){
    clearInterval(timerInterval);timerRunning=false;
    document.getElementById('timer-start-btn').textContent='Weiter';
    document.getElementById('timer-start-btn').className='timer-btn primary';
  } else {
    if(timerRemaining===0)timerPreview();
    if(timerRemaining===0)return;
    timerRunning=true;
    document.getElementById('timer-start-btn').textContent='Pause';
    document.getElementById('timer-set-row').style.opacity='0.4';
    document.getElementById('timer-set-row').style.pointerEvents='none';
    timerInterval=setInterval(()=>{
      timerRemaining--;timerShowRemaining();
      if(timerRemaining<=0){
        clearInterval(timerInterval);timerRunning=false;
        document.getElementById('timer-start-btn').textContent='Start';
        document.getElementById('timer-set-row').style.opacity='1';
        document.getElementById('timer-set-row').style.pointerEvents='';
        timerRingOnce();
      }
    },1000);
  }
}
function timerReset(){
  clearInterval(timerInterval);timerRunning=false;
  document.getElementById('timer-start-btn').textContent='Start';
  document.getElementById('timer-set-row').style.opacity='1';
  document.getElementById('timer-set-row').style.pointerEvents='';
  timerPreview();
}
function timerRingOnce(){
  try{const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [0,0.5,1].forEach(t=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
      o.frequency.value=880;g.gain.setValueAtTime(0.4,ctx.currentTime+t);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.4);
      o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+0.4);});}catch(_){}
}
function swToggle(){
  if(swRunning){clearInterval(swInterval);swRunning=false;document.getElementById('sw-start-btn').textContent='Weiter';}
  else{swRunning=true;document.getElementById('sw-start-btn').textContent='Pause';
    const start=Date.now()-swElapsed;
    swInterval=setInterval(()=>{swElapsed=Date.now()-start;swShowElapsed();},50);}
}
function swShowElapsed(){
  const ms=swElapsed,s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000)%60,cs=Math.floor((ms%1000)/10);
  document.getElementById('sw-display').innerHTML=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}<span class="timer-ms">.${String(cs).padStart(2,'0')}</span>`;
}
function swLap(){
  if(!swRunning&&swElapsed===0)return;
  swLaps.unshift({n:swLaps.length+1,t:swElapsed});
  const el=document.getElementById('sw-laps');
  el.innerHTML=swLaps.map(l=>{
    const ms=l.t,s=Math.floor(ms/1000)%60,m=Math.floor(ms/60000),cs=Math.floor((ms%1000)/10);
    return`<div class="lap-item"><span>Runde ${l.n}</span><span>${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}</span></div>`;
  }).join('');
}
function swReset(){clearInterval(swInterval);swRunning=false;swElapsed=0;swLaps=[];document.getElementById('sw-start-btn').textContent='Start';document.getElementById('sw-laps').innerHTML='';swShowElapsed();}
