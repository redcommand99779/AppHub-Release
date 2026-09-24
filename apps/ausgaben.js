/* ══════════════════════════════════
   AUSGABEN / EXPENSE TRACKER
══════════════════════════════════ */
let expItems=[];
function expInit(){expItems=JSON.parse(localStorage.getItem('zf_expenses')||'[]');expRender();}
function expAdd(){
  const desc=document.getElementById('exp-desc')?.value.trim();
  const amount=parseFloat(document.getElementById('exp-amount')?.value||'0');
  const cat=document.getElementById('exp-cat')?.value||'📦 Sonstiges';
  if(!desc||isNaN(amount)||amount<=0)return;
  expItems.unshift({id:Date.now(),desc,amount,cat,date:new Date().toISOString().slice(0,10)});
  localStorage.setItem('zf_expenses',JSON.stringify(expItems));
  const d=document.getElementById('exp-desc');const a=document.getElementById('exp-amount');
  if(d)d.value='';if(a)a.value='';
  expRender();
}
function expDelete(id){expItems=expItems.filter(e=>e.id!==id);localStorage.setItem('zf_expenses',JSON.stringify(expItems));expRender();}
function expRender(){
  const total=expItems.reduce((s,e)=>s+e.amount,0);
  const now=new Date();const month=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const monthTotal=expItems.filter(e=>e.date?.startsWith(month)).reduce((s,e)=>s+e.amount,0);
  const t=document.getElementById('exp-total');const m=document.getElementById('exp-month');const cnt=document.getElementById('exp-count');
  if(t)t.textContent=total.toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  if(m)m.textContent=monthTotal.toLocaleString('de-DE',{style:'currency',currency:'EUR'});
  if(cnt)cnt.textContent=expItems.length;
  // Simple bar chart by category
  const catTotals={};expItems.forEach(e=>{catTotals[e.cat]=(catTotals[e.cat]||0)+e.amount;});
  const cv=document.getElementById('exp-chart');
  if(cv){
    const W=cv.offsetWidth||600;cv.width=W;cv.height=80;
    const ctx=cv.getContext('2d');ctx.clearRect(0,0,W,80);
    const cats=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
    const maxVal=cats[0]?.[1]||1;const barW=Math.floor((W-20)/Math.max(cats.length,1));
    const colors=['#ff3b30','#ff9500','#ffcc00','#34c759','#0071e3','#5856d6','#af52de'];
    cats.forEach(([cat,val],i)=>{
      const h=Math.round((val/maxVal)*60);const x=10+i*barW;
      ctx.fillStyle=colors[i%colors.length];ctx.fillRect(x,70-h,barW-4,h);
      ctx.fillStyle='var(--text)';ctx.font='9px sans-serif';ctx.textAlign='center';
      ctx.fillText(cat.slice(0,2),x+barW/2-2,78);
    });
  }
  const list=document.getElementById('exp-list');
  if(list)list.innerHTML=expItems.map(e=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px">
    <span style="font-size:16px">${e.cat?.slice(0,2)||'📦'}</span>
    <span style="flex:1;font-size:13px;color:var(--text)">${escHtml(e.desc)}</span>
    <span style="font-size:11px;color:var(--text-3)">${e.date||''}</span>
    <span style="font-weight:700;color:var(--text);min-width:60px;text-align:right">${e.amount.toLocaleString('de-DE',{style:'currency',currency:'EUR'})}</span>
    <button onclick="expDelete(${e.id})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;padding:0">×</button>
  </div>`).join('')||'<div style="text-align:center;color:var(--text-3);padding:20px">Noch keine Ausgaben</div>';
}

