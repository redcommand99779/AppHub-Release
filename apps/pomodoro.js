/* ── Pomodoro ── */
let pomRunning=false,pomPaused=false,pomSeconds=25*60,pomIsWork=true,pomInterval=null,pomCount=parseInt(localStorage.getItem('zf_pom_count')||'0');
function pomInit(){const c=document.getElementById('pom-count');if(c)c.textContent=pomCount;pomDisplay();}
function pomDisplay(){const d=document.getElementById('pom-display');if(d)d.textContent=String(Math.floor(pomSeconds/60)).padStart(2,'0')+':'+String(pomSeconds%60).padStart(2,'0');}
function pomToggle(){
  if(!pomRunning){pomRunning=true;pomPaused=false;const b=document.getElementById('pom-btn');if(b)b.textContent='Pausieren';clearInterval(pomInterval);pomInterval=setInterval(()=>{pomSeconds--;pomDisplay();if(pomSeconds<=0){clearInterval(pomInterval);pomRunning=false;if(pomIsWork){pomCount++;localStorage.setItem('zf_pom_count',pomCount);const c=document.getElementById('pom-count');if(c)c.textContent=pomCount;pomSeconds=5*60;pomIsWork=false;const p=document.getElementById('pom-phase');if(p)p.textContent='Pause!';}else{pomSeconds=25*60;pomIsWork=true;const p=document.getElementById('pom-phase');if(p)p.textContent='Fokus-Zeit';}const b=document.getElementById('pom-btn');if(b)b.textContent='Starten';}},1000);}
  else{clearInterval(pomInterval);pomRunning=false;const b=document.getElementById('pom-btn');if(b)b.textContent='Weiter';}
}
function pomReset(){clearInterval(pomInterval);pomRunning=false;pomSeconds=25*60;pomIsWork=true;const b=document.getElementById('pom-btn');if(b)b.textContent='Starten';const p=document.getElementById('pom-phase');if(p)p.textContent='Fokus-Zeit';pomDisplay();}
