/* ── Reaktionstest ── */
let reaktionState='waiting',reaktionStart=0,reaktionTimeout=null;
function reaktionInit(){reaktionState='waiting';const a=document.getElementById('reaktion-area');if(a){a.style.background='var(--surface)';a.textContent='Klicken zum Starten';a.style.color='var(--text-2)';}}
function reaktionClick(){
  const a=document.getElementById('reaktion-area');if(!a)return;
  if(reaktionState==='waiting'){
    reaktionState='ready';a.style.background='#ff3b30';a.textContent='Warte auf Grün…';a.style.color='#fff';
    clearTimeout(reaktionTimeout);
    reaktionTimeout=setTimeout(()=>{reaktionState='go';a.style.background='#34c759';a.textContent='JETZT!';a.style.color='#fff';reaktionStart=Date.now();},1000+Math.random()*3000);
  } else if(reaktionState==='ready'){
    clearTimeout(reaktionTimeout);reaktionState='waiting';a.style.background='#ff9500';a.textContent='Zu früh! Nochmal klicken.';a.style.color='#fff';
  } else if(reaktionState==='go'){
    const ms=Date.now()-reaktionStart;reaktionState='waiting';
    a.style.background='var(--surface)';a.textContent='Nochmal klicken';a.style.color='var(--text-2)';
    const last=document.getElementById('reaktion-last');const best=document.getElementById('reaktion-best');
    if(last)last.textContent=ms+'ms';
    const bestVal=parseInt(localStorage.getItem('zf_reaktion_best')||'99999');
    if(ms<bestVal){localStorage.setItem('zf_reaktion_best',ms);if(best)best.textContent=ms+'ms';}
    else if(best)best.textContent=bestVal+'ms';
  }
}

