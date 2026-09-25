/* ══════════════════════════════════
   AUSGABEN – Einnahmen und Ausgaben pro Monat: Saldo, Monatsbudget, Ring-Diagramm nach Kategorie, Liste nach Tagen,
   Bearbeiten, Suche und CSV-Export. Lokales Datum (früher UTC).
   Daten: zf_expenses [{id,desc,amount,cat,date,type:'exp'|'inc'}] (altes Format bleibt lesbar), zf_exp_budget: Monatsbudget in €
══════════════════════════════════ */
const EXP_KEY='zf_expenses',EXP_BUDGET_KEY='zf_exp_budget';
const EXP_CATS=['🍕 Essen','🛒 Lebensmittel','🏠 Wohnen','🚗 Transport','🛍 Shopping','🎮 Freizeit','💊 Gesundheit','📱 Abos & Handy','🎁 Geschenke','📦 Sonstiges'];
const INC_CATS=['💼 Gehalt','🎁 Geschenk','💰 Sonstiges'];
const EXP_COLORS=['#ff3b30','#ff9500','#ffcc00','#34c759','#00c7be','#0a84ff','#5856d6','#af52de','#ff2d55','#8e8e93'];
let expItems=[],expMonth='',expType='exp',expEditId=null,expQuery='',expBudget=0;

function expEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function expDay(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function expEur(n){return (Math.round(n*100)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});}
function expLoad(){
  let a=[];try{a=JSON.parse(localStorage.getItem(EXP_KEY)||'[]');}catch(e){}
  if(!Array.isArray(a))a=[];
  return a.filter(e=>e&&isFinite(e.amount)&&+e.amount>0).map(e=>({id:e.id||Date.now()+Math.random(),desc:String(e.desc||''),amount:Math.round(+e.amount*100)/100,cat:String(e.cat||'📦 Sonstiges'),
    date:/^\d{4}-\d{2}-\d{2}$/.test(e.date||'')?e.date:expDay(),type:e.type==='inc'?'inc':'exp'}));
}
function expSave(){try{localStorage.setItem(EXP_KEY,JSON.stringify(expItems));}catch(e){}}

/* ── Logik (testbar) ── */
function expParseAmount(s){
  s=String(s==null?'':s).trim().replace(/\s|€/g,'');
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');   // 1.234,56
  else s=s.replace(',','.');
  if(!/^\d+(\.\d{1,2})?$/.test(s))return NaN;
  return Math.round(parseFloat(s)*100)/100;
}
function expInMonth(items,month){return items.filter(e=>e.date.startsWith(month));}
function expSums(items){
  const inc=items.filter(e=>e.type==='inc').reduce((s,e)=>s+e.amount,0),exp=items.filter(e=>e.type==='exp').reduce((s,e)=>s+e.amount,0);
  return {inc:Math.round(inc*100)/100,exp:Math.round(exp*100)/100,saldo:Math.round((inc-exp)*100)/100};
}
function expByCat(items){
  const m={};items.filter(e=>e.type==='exp').forEach(e=>{m[e.cat]=(m[e.cat]||0)+e.amount;});
  return Object.entries(m).sort((a,b)=>b[1]-a[1]);
}
function expShiftMonth(month,n){const [y,m]=month.split('-').map(Number),d=new Date(y,m-1+n,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function expCsv(items){
  const q=s=>'"'+String(s).replace(/"/g,'""')+'"';
  return 'Datum;Art;Kategorie;Beschreibung;Betrag\n'+items.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(e=>[e.date,e.type==='inc'?'Einnahme':'Ausgabe',q(e.cat),q(e.desc),(e.type==='inc'?'':'-')+String(e.amount).replace('.',',')].join(';')).join('\n');
}
function expDayLabel(key){
  const today=expDay(),y=expDay(new Date(Date.now()-86400000));
  if(key===today)return 'Heute';if(key===y)return 'Gestern';
  const d=new Date(key+'T12:00:00');return ['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]+', '+d.getDate()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.';
}

/* ── Oberfläche ── */
function expInit(){
  expItems=expLoad();expMonth=expDay().slice(0,7);expType='exp';expEditId=null;expQuery='';
  expBudget=parseFloat(localStorage.getItem(EXP_BUDGET_KEY)||'0')||0;expRender();
}
function expRoot(){return document.getElementById('exp-root');}
function expVal(id){const e=document.getElementById(id);return e?e.value:'';}
function expSetType(t){expType=t;expRender();}
function expPrev(){expMonth=expShiftMonth(expMonth,-1);expRender();}
function expNext(){expMonth=expShiftMonth(expMonth,1);expRender();}
function expThisMonth(){expMonth=expDay().slice(0,7);expRender();}
function expAdd(){
  const desc=expVal('exp-desc').trim(),amount=expParseAmount(expVal('exp-amount'));
  if(isNaN(amount)||amount<=0){const e=document.getElementById('exp-amount');if(e){e.focus();e.style.borderColor='#ff3b30';}return;}
  const date=expVal('exp-date')||expDay(),cat=expVal('exp-cat')||(expType==='inc'?INC_CATS[0]:EXP_CATS[EXP_CATS.length-1]);
  expItems.unshift({id:Date.now()+Math.floor(Math.random()*1000),desc:desc||cat.replace(/^\S+\s/,''),amount,cat,date,type:expType});
  expSave();if(date.slice(0,7)!==expMonth)expMonth=date.slice(0,7);expRender();const e=document.getElementById('exp-desc');if(e)e.focus();
}
function expDelete(id){
  const go=()=>{expItems=expItems.filter(e=>String(e.id)!==String(id));expSave();expRender();};go();
}
function expEdit(id){expEditId=id==null?null:String(id);expRender();}
function expSaveEdit(id){
  const e=expItems.find(x=>String(x.id)===String(id)),amount=expParseAmount(expVal('exp-e-amount'));if(!e||isNaN(amount)||amount<=0)return;
  e.desc=expVal('exp-e-desc').trim()||e.desc;e.amount=amount;e.cat=expVal('exp-e-cat')||e.cat;e.date=expVal('exp-e-date')||e.date;
  expEditId=null;expSave();expRender();
}
function expSetBudget(v){const n=expParseAmount(v);expBudget=isNaN(n)?0:n;try{localStorage.setItem(EXP_BUDGET_KEY,String(expBudget));}catch(e){}expRender();}
function expSearch(v){expQuery=v||'';expRender();const e=document.getElementById('exp-q');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}
function expExport(){
  const blob=new Blob(['﻿'+expCsv(expItems)],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='ausgaben-'+expDay()+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function expDonut(cats,total){
  if(!cats.length||total<=0)return '<div style="width:120px;height:120px;border-radius:50%;border:14px solid var(--divider);box-sizing:border-box"></div>';
  let acc=0,parts=cats.map(([c,v],i)=>{const from=acc/total*100;acc+=v;return `${EXP_COLORS[i%EXP_COLORS.length]} ${from}% ${acc/total*100}%`;});
  return `<div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(${parts.join(',')});flex:none;-webkit-mask:radial-gradient(circle,transparent 34px,#000 35px);mask:radial-gradient(circle,transparent 34px,#000 35px)"></div>`;
}
function expRender(){
  const root=expRoot();if(!root)return;
  const items=expInMonth(expItems,expMonth),sums=expSums(items),cats=expByCat(items),q=expQuery.toLowerCase();
  const shown=items.filter(e=>!q||e.desc.toLowerCase().includes(q)||e.cat.toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
  const [y,m]=expMonth.split('-').map(Number),names=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const left=expBudget>0?expBudget-sums.exp:0,pct=expBudget>0?Math.min(100,Math.round(sums.exp/expBudget*100)):0;
  const cur=expType==='inc'?INC_CATS:EXP_CATS,byDay={};shown.forEach(e=>{(byDay[e.date]=byDay[e.date]||[]).push(e);});
  root.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><button class="lrn-btn ghost" onclick="expPrev()">‹</button><div style="flex:1;text-align:center;font-size:17px;font-weight:800">${names[m-1]} ${y}</div><button class="lrn-btn ghost" onclick="expNext()">›</button><button class="lrn-btn ghost" onclick="expThisMonth()">Heute</button></div>
    <div class="lrn-tiles"><div class="lrn-tile"><b style="color:#34c759">${expEur(sums.inc)}</b><span>Einnahmen</span></div><div class="lrn-tile"><b style="color:#ff3b30">${expEur(sums.exp)}</b><span>Ausgaben</span></div><div class="lrn-tile"><b style="color:${sums.saldo<0?'#ff3b30':'var(--text)'}">${expEur(sums.saldo)}</b><span>Saldo</span></div></div>
    <div class="lrn-card" style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="lrn-label" style="margin:0">Monatsbudget</span>
      <input class="lrn-input" placeholder="z. B. 800" value="${expBudget?String(expBudget).replace('.',','):''}" onchange="expSetBudget(this.value)" style="width:110px"><span style="font-size:12px;color:var(--text-3)">€</span>
      ${expBudget?`<span style="margin-left:auto;font-size:13px;font-weight:700;color:${left<0?'#ff3b30':'#34c759'}">${left<0?'Überschritten um '+expEur(-left):'Noch '+expEur(left)}</span>`:''}</div>
      ${expBudget?`<div class="lrn-bar" style="margin-top:8px"><div style="width:${pct}%;background:${pct>=100?'#ff3b30':pct>=80?'#ff9500':''}"></div></div>`:''}</div>
    <div class="lrn-card" style="margin-bottom:14px">
      <div class="lrn-tabs" style="margin-bottom:12px"><button class="lrn-tab${expType==='exp'?' active':''}" onclick="expSetType('exp')">➖ Ausgabe</button><button class="lrn-tab${expType==='inc'?' active':''}" onclick="expSetType('inc')">➕ Einnahme</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="exp-amount" class="lrn-input" inputmode="decimal" placeholder="Betrag in €" style="width:120px" onkeydown="if(event.key==='Enter')expAdd()"><input id="exp-desc" class="lrn-input" placeholder="Wofür? (optional)" style="flex:1;min-width:140px" onkeydown="if(event.key==='Enter')expAdd()"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><select id="exp-cat" class="lrn-input">${cur.map(c=>`<option>${c}</option>`).join('')}</select><input id="exp-date" type="date" class="lrn-input" value="${expMonth===expDay().slice(0,7)?expDay():expMonth+'-01'}"><button class="lrn-btn" onclick="expAdd()">＋ Hinzufügen</button></div></div>
    ${cats.length?`<div class="lrn-card" style="margin-bottom:14px"><div class="lrn-label">Ausgaben nach Kategorie</div><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${expDonut(cats,sums.exp)}
      <div style="flex:1;min-width:180px">${cats.map(([c,v],i)=>`<div style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:5px"><i style="width:10px;height:10px;border-radius:3px;background:${EXP_COLORS[i%EXP_COLORS.length]};flex:none"></i><span style="flex:1">${expEsc(c)}</span><span style="color:var(--text-3);font-size:11px">${Math.round(v/sums.exp*100)}%</span><b>${expEur(v)}</b></div>`).join('')}</div></div></div>`:''}
    <div style="display:flex;gap:8px;margin-bottom:10px"><input id="exp-q" class="lrn-input" placeholder="🔍 Suchen …" value="${expEsc(expQuery)}" oninput="expSearch(this.value)" style="flex:1"><button class="lrn-btn ghost" onclick="expExport()" title="Alle Einträge als CSV speichern">💾 CSV</button></div>
    ${Object.keys(byDay).length?Object.keys(byDay).sort().reverse().map(d=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin:12px 2px 6px">${expDayLabel(d)}</div>${byDay[d].map(e=>expRenderItem(e)).join('')}`).join('')
      :`<div style="text-align:center;color:var(--text-3);padding:26px;font-size:13px">${expItems.length?'In diesem Monat gibt es noch keine Einträge.':'Noch keine Einträge – trage oben deine erste Ausgabe ein. 💶'}</div>`}`;
}
function expRenderItem(e){
  const sid=String(e.id);
  if(expEditId===sid){
    const cats=(e.type==='inc'?INC_CATS:EXP_CATS).concat([e.cat]).filter((c,i,a)=>a.indexOf(c)===i);
    return `<div class="lrn-card" style="margin-bottom:6px;padding:10px"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><input id="exp-e-amount" class="lrn-input" value="${String(e.amount).replace('.',',')}" style="width:110px"><input id="exp-e-desc" class="lrn-input" value="${expEsc(e.desc)}" style="flex:1;min-width:130px"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><select id="exp-e-cat" class="lrn-input">${cats.map(c=>`<option ${c===e.cat?'selected':''}>${expEsc(c)}</option>`).join('')}</select><input id="exp-e-date" type="date" class="lrn-input" value="${e.date}"></div>
      <div class="lrn-two"><button class="lrn-btn ghost" onclick="expEdit(null)">Abbrechen</button><button class="lrn-btn" onclick="expSaveEdit('${sid}')">Speichern</button></div></div>`;
  }
  return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;margin-bottom:5px">
    <span style="font-size:20px">${expEsc(e.cat.split(' ')[0])}</span><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${expEsc(e.desc)}</div><div style="font-size:11px;color:var(--text-3)">${expEsc(e.cat.replace(/^\S+\s/,''))}</div></div>
    <b style="color:${e.type==='inc'?'#34c759':'var(--text)'};white-space:nowrap">${e.type==='inc'?'+':'−'}${expEur(e.amount)}</b>
    <button class="lrn-btn ghost" onclick="expEdit('${sid}')" title="Bearbeiten">✏️</button><button class="lrn-btn ghost" onclick="expDelete('${sid}')" title="Löschen">🗑</button></div>`;
}
