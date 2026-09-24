/* ══════════════════════════════════
   MONOPOLY-META – PR-Ränge, Profil, Saisons und Cup für Monopoly
   Die PR einer Partie richten sich nach dem HÖCHSTEN VERMÖGEN, das ein
   Spieler in der Runde hatte (plus Bonus für den Sieg / Malus für die
   erste Pleite). Baut auf spielmeta.js auf (State: zf_sm_mono).
══════════════════════════════════ */
const MONO_MF_DEFAULT={
  thresholds:[{worth:6000,pr:50},{worth:4500,pr:40},{worth:3500,pr:30},{worth:2500,pr:20},{worth:1800,pr:10},{worth:0,pr:0}],
  first:50,last:-50
};
let monoCupSetup={enabled:false,rounds:3};
let monoMetaLast=null;

function monoMF(){
  const st=smS('mono');
  const old=st.mformula&&st.mformula.first===20&&st.mformula.last===-15&&st.mformula.thresholds&&st.mformula.thresholds[0]&&st.mformula.thresholds[0].pr===40;
  if(!st.mformula||!Array.isArray(st.mformula.thresholds)||!st.mformula.thresholds.length||old)st.mformula=smClone(MONO_MF_DEFAULT);
  return st.mformula;
}
function monoMetaPeak(i){
  let pk=0;
  if(typeof monoStats!=='undefined'&&monoStats&&monoStats[i])pk=Math.max(pk,monoStats[i].peakNetWorth||0);
  ((typeof monoNetWorthHistory!=='undefined'&&monoNetWorthHistory[i])||[]).forEach(v=>{pk=Math.max(pk,v);});
  return Math.max(pk,monoNetWorth(i));
}
function monoMetaBasePr(peak){
  const sorted=[...monoMF().thresholds].sort((a,b)=>b.worth-a.worth);
  for(const t of sorted)if(peak>=t.worth)return t.pr;
  return sorted[sorted.length-1].pr;
}
function monoMetaPlacement(){
  const place=monoPlayers.map(p=>p.bankrupt?0:1);
  let nxt=2;
  [...monoBankruptOrder].reverse().forEach(i=>{if(!place[i])place[i]=nxt++;});
  return place;
}

/* ── Spielende ── */
function monoMetaOnGameOver(){
  const st=smS('mono'),n=monoPlayers.length;
  smSeasonCheck('mono');
  const peaks=monoPlayers.map((p,i)=>monoMetaPeak(i));
  const place=monoMetaPlacement();
  let cup=st.cup&&!st.cup.done?st.cup:null;
  const friendly=monoPlayers.some(p=>!p.isAI&&zcIsGuest(p.name));
  if(friendly)cup=null;
  if(cup&&!(cup.players.length===n&&cup.players.every((c,i)=>c.name===monoPlayers[i].name))){st.cup=null;cup=null;showToast('Cup abgebrochen (Spieler geändert)');}
  const deltas={};
  monoPlayers.forEach((p,i)=>{
    if(p.isAI||friendly)return;
    let rec=st.hof[p.name];
    if(!rec)rec=st.hof[p.name]={games:0,wins:0,losses:0,draws:0,streak:0,bestStreak:0,history:[],firstPlayed:Date.now(),prEarned:0,prLost:0,peakPr:0,cupWins:0,cupsPlayed:0,seriesWins:0,seriesPlayed:0,aiHardWins:0,bestPeak:0,sumPeak:0,sumPlace:0};
    const won=place[i]===1;
    rec.games++;
    if(won){rec.wins++;rec.streak=(rec.streak||0)+1;rec.bestStreak=Math.max(rec.bestStreak||0,rec.streak);}
    else{rec.losses++;rec.streak=0;}
    if(typeof zcEvent==='function')zcEvent({game:'mono',name:p.name,res:won?'W':'L',cup:!!cup,streak:rec.streak});
    rec.bestPeak=Math.max(rec.bestPeak||0,peaks[i]);rec.sumPeak=(rec.sumPeak||0)+peaks[i];rec.sumPlace=(rec.sumPlace||0)+place[i];
    rec.lastPlayed=Date.now();
    rec.history.push({t:rec.lastPlayed,res:won?'W':'L',opp:`${n} Spieler`,ai:false,diff:null,cup:!!cup,score:peaks[i],place:place[i],n});
    if(rec.history.length>150)rec.history.shift();
    if(!cup){
      const f=monoMF();
      let d=monoMetaBasePr(peaks[i]);
      if(won)d+=f.first;else if(monoBankruptOrder[0]===i)d+=f.last;
      const before=st.rank[p.name]||0,overallBefore=typeof zcOverallTotal==='function'?zcOverallTotal(p.name):before;
      const after=Math.max(0,before+d);
      st.rank[p.name]=after;
      const overallAfter=typeof zcOverallTotal==='function'?zcOverallTotal(p.name):after;
      rec.prEarned=(rec.prEarned||0)+Math.max(0,after-before);
      rec.prLost=(rec.prLost||0)+Math.max(0,before-after);
      rec.peakPr=Math.max(rec.peakPr||0,after);
      // Angezeigt wird der Gesamtrang (spielübergreifend), nicht der Rang nur in Monopoly.
      deltas[i]={name:p.name,delta:overallAfter-overallBefore,before:overallBefore,after:overallAfter,gameDelta:after-before,rankAfter:smRankInfo('zentrale',overallAfter),rankBefore:smRankInfo('zentrale',overallBefore),peak:peaks[i],place:place[i]};
    }
  });
  if(cup){
    cup.played++;
    monoPlayers.forEach((p,i)=>{cup.players[i].scores.push(peaks[i]);cup.players[i].total+=peaks[i];});
    if(cup.played>=cup.rounds){
      cup.done=true;
      const top=Math.max(...cup.players.map(c=>c.total));
      cup.winners=cup.players.map((c,i)=>c.total===top?i:-1).filter(i=>i>=0);
      st.cupHistory.unshift({endedAt:Date.now(),rounds:cup.rounds,players:cup.players.map(c=>({name:c.name,total:c.total})),winners:cup.winners,mono:true});
      cup.players.forEach((c,i)=>{
        if(c.isAI)return;const r=st.hof[c.name];if(!r)return;
        r.cupsPlayed=(r.cupsPlayed||0)+1;
        if(cup.winners.length===1&&cup.winners[0]===i)r.cupWins=(r.cupWins||0)+1;
      });
    }
  }
  smSave('mono');
  if(!friendly&&monoRules.adaptiveAI){const hi=monoPlayers.map((p,i)=>i).filter(i=>!monoPlayers[i].isAI);if(hi.length===1&&monoPlayers.some(p=>p.isAI))monoAdaptUpdate(monoPlayers[hi[0]].name,place[hi[0]]===1);}
  if(typeof rplFinish==='function'){const w=monoPlayers.filter((p,i)=>place[i]===1).map(p=>p.name);rplFinish('mono',{prLine:Object.values(deltas).map(d=>`${d.name} ${d.delta>0?'+':''}${d.delta} PR`).join(' · '),fc:monoFields.map(f=>f.color||''),names:monoPlayers.map(p=>p.name),colors:monoPlayers.map(p=>p.color),result:'🏆 '+(w.join(', ')||'Niemand')+' gewinnt'});}
  monoMetaLast={friendly,deltas,cup:st.cup&&(cup||st.cup.done)?st.cup:null,peaks,place};
  if(peaks.some((x,i)=>place[i]===1&&!monoPlayers[i].isAI)){smConfetti();sfx('win');}else sfx('lose');
}

/* ── Live-PR-Vorschau im laufenden Spiel ── */
function monoMetaPreviewHtml(p,idx){
  if(p.isAI||p.bankrupt)return'';
  const st=smS('mono'),peak=monoMetaPeak(idx);
  const cup=st.cup&&!st.cup.done;
  const wrap=t=>`<div style="font-size:11px;color:var(--text-3);text-align:center;margin-bottom:8px">${t}</div>`;
  if(cup)return wrap(`🏆 Cup · Höchstvermögen bisher: <b>${peak}€</b> (zählt für diese Runde)`);
  const base=monoMetaBasePr(peak),f=monoMF(),info=typeof zcOverallInfo==='function'?zcOverallInfo(p.name):smRankInfo('mono',st.rank[p.name]||0);
  const sg=n=>(n>=0?'+':'')+n;
  return wrap(`📊 Höchstvermögen bisher: <b>${peak}€</b> → <b style="color:${base>=0?'var(--accent)':'#c62828'}">${sg(base)} PR</b> (bei Sieg ${sg(base+f.first)}) · ${info.icon} ${escHtml(info.label)}`);
}

/* ── Adaptive KI ── */
function monoAdaptUpdate(name,won){
  let st={};try{st=JSON.parse(localStorage.getItem('zf_mono_adapt')||'{}');}catch(e){}
  const key=(name||'').trim().toLowerCase();let c=(st[key]&&st[key].c)||0;
  c=won?Math.max(c,0)+1:Math.min(c,0)-1;
  let msg=null;
  if(c>=2&&monoRules.aiDifficulty!=='hard'){monoRules.aiDifficulty='hard';c=0;msg='🧠 Monopoly-KI wird stärker: Schwer';}
  else if(c<=-2&&monoRules.aiDifficulty!=='easy'){monoRules.aiDifficulty='easy';c=0;msg='🧠 Monopoly-KI wird schwächer: Leicht';}
  st[key]={c};try{localStorage.setItem('zf_mono_adapt',JSON.stringify(st));}catch(e){}
  if(msg){monoSaveRules();setTimeout(()=>showToast(msg,2800),900);}
}

/* ── Game-Over-Fenster ── */
function monoMetaModalHtml(){
  const m=monoMetaLast;if(!m)return'';
  const head=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:14px 0 6px">${t}</div>`;
  let h=m.friendly?'<div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:10px;font-size:12px;text-align:center;color:var(--text-2)">🤝 Gastspiel – diese Partie wird nicht gewertet (keine PR, Statistik oder Coins).</div>':'';
  const ds=Object.values(m.deltas);
  if(m.deltas&&typeof zcCheckRankUpCelebration==='function')zcCheckRankUpCelebration(m.deltas);
  if(ds.length){
    h+=head('📊 Gesamtrang-Update (nach höchstem Vermögen)')+ds.map(d=>{
      const changed=d.rankAfter.label!==d.rankBefore.label;
      return`<div style="background:var(--bg);border-radius:8px;padding:6px 10px;margin-bottom:4px">
        <div style="display:flex;gap:8px"><span style="flex:1;font-size:12px;color:var(--text)">${escHtml(d.name)} <span style="font-size:10px;color:var(--text-3)">· max. ${d.peak}€ · Platz ${d.place}</span></span><span style="font-size:12px;font-weight:700;color:${d.delta>0?'#2e7d32':d.delta<0?'#c62828':'var(--text-3)'}">${d.delta>0?'+':''}${d.delta} PR</span></div>
        <div style="margin-top:4px">${smRankBadge('zentrale',d.after,true)}</div>
        ${changed?`<div style="font-size:10px;margin-top:3px;color:${d.delta>0?'var(--accent)':'var(--text-3)'}">${d.delta>0?'🎉 Aufstieg':'Abstieg'} zu ${escHtml(d.rankAfter.label)}!</div>`:''}
      </div>`;}).join('');
  }
  if(m.cup){
    const c=m.cup;
    h+=head(`🏆 Cup · Runde ${Math.min(c.played,c.rounds)}/${c.rounds} (Ränge aus – zählt das höchste Vermögen)`)
      +[...c.players.map((p,i)=>({p,i}))].sort((a,b)=>b.p.total-a.p.total).map(({p},k)=>`<div style="display:flex;gap:8px;align-items:center;background:var(--bg);border-radius:8px;padding:5px 10px;margin-bottom:4px;font-size:12px"><span style="color:var(--text-3);width:14px">${k+1}.</span><span style="width:16px;height:16px;border-radius:50%;background:${p.color};display:inline-flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">${escHtml(p.avatar)}</span><span style="flex:1;color:var(--text)">${escHtml(p.name)}</span><span style="font-size:10px;color:var(--text-3)">${p.scores.join(' + ')}</span><b>${p.total}€</b></div>`).join('')
      +(c.done?`<div style="text-align:center;font-weight:700;color:var(--accent);font-size:12px;margin-top:4px">${c.winners.length>1?'Cup unentschieden!':'🏆 Cup-Sieger: '+escHtml(c.players[c.winners[0]].name)}</div>`:`<div style="text-align:center;color:var(--text-3);font-size:11px;margin-top:4px">Weiter geht's mit Runde ${c.played+1}</div>`);
  }
  return h;
}
function monoMetaButtonsHtml(){
  const c=monoMetaLast&&monoMetaLast.cup;
  if(c&&!c.done)return`<div style="text-align:center;margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn-generate" onclick="monoMetaNextRound()" style="width:auto;padding:10px 22px">▶ Nächste Runde</button><button class="timer-btn" onclick="rplOpen('mono')" style="padding:10px 16px;font-size:12px">🎬 Replay</button><button class="timer-btn" onclick="monoAbandonGame()" style="padding:10px 16px;font-size:12px">Cup abbrechen</button></div>`;
  return`<div style="text-align:center;margin-top:14px"><button class="btn-generate" onclick="monoAbandonGame()" style="width:auto;padding:10px 24px">Neues Spiel</button> <button class="timer-btn" onclick="rplOpen('mono')" style="padding:10px 16px;font-size:12px">🎬 Replay</button></div>`;
}
function monoMetaNextRound(){monoStartGame();}

/* ── Hooks aus monopoly.js ── */
function monoMetaBeforeStart(){
  const st=smS('mono');
  if(!st.cup&&monoCupSetup.enabled){
    st.cup={rounds:monoCupSetup.rounds,played:0,done:false,
      players:monoPlayersSetup.map((p,i)=>({name:p.name,color:p.color,avatar:monoAvatarFor(p,i),isAI:!!p.isAI,total:0,scores:[]}))};
    smSave('mono');
  }
  monoMetaLast=null;
}
function monoMetaCancelCup(){const st=smS('mono');st.cup=null;smSave('mono');monoMetaLast=null;}

/* ── Tabs Profil / Ränge ── */
function monoMetaShowView(v){
  const custom=['profile','ranks'];
  custom.forEach(x=>{document.getElementById('mono-tab-'+x)?.classList.remove('active');const e=document.getElementById('mono-view-'+x);if(e)e.style.display='none';});
  if(!custom.includes(v))return false;
  ['setup','editor','cards','rules','badges'].forEach(x=>{document.getElementById('mono-tab-'+x)?.classList.remove('active');const e=document.getElementById('mono-view-'+x);if(e)e.style.display='none';});
  document.getElementById('mono-tab-'+v)?.classList.add('active');
  const el=document.getElementById('mono-view-'+v);if(el)el.style.display='block';
  monoCurrentView=v;
  smSeasonCheck('mono');
  if(v==='profile')smRenderProfile('mono');
  else smRenderRanks('mono');
  return true;
}

/* ── PR-Formel-Editor (Vermögensschwellen) ── */
function monoMFSet(idx,key,val){const t=monoMF().thresholds[idx];if(!t)return;t[key]=Math.round(+val||0);smSave('mono');}
function monoMFBonus(key,val){monoMF()[key]=Math.round(+val||0);smSave('mono');}
function monoMFAdd(){monoMF().thresholds.push({worth:0,pr:0});smSave('mono');smRenderRanks('mono');}
function monoMFDel(idx){const f=monoMF();if(f.thresholds.length<=1)return;f.thresholds.splice(idx,1);smSave('mono');smRenderRanks('mono');}
function monoMFReset(){appConfirm('PR-Formel auf Standard zurücksetzen?',()=>{smS('mono').mformula=smClone(MONO_MF_DEFAULT);smSave('mono');smRenderRanks('mono');showToast('PR-Formel zurückgesetzt ✓');});}
function monoMetaFormulaEditor(id,el){
  const f=monoMF();
  const box='background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right';
  const sorted=f.thresholds.map((t,i)=>({...t,i})).sort((a,b)=>b.worth-a.worth);
  const head=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">${t}</div>`;
  el.innerHTML=head('Höchstes Vermögen der Runde → PR')
    +sorted.map(t=>`<div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px;margin-bottom:6px;flex-wrap:wrap"><label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">ab (€)<input type="number" step="100" value="${t.worth}" oninput="monoMFSet(${t.i},'worth',this.value)" style="width:76px;padding:6px;${box}"/></label><label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">→ PR<input type="number" step="5" value="${t.pr}" oninput="monoMFSet(${t.i},'pr',this.value)" style="width:60px;padding:6px;${box}"/></label>${f.thresholds.length>1?`<button onclick="monoMFDel(${t.i})" style="margin-left:auto;padding:5px 9px;font-size:11px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">✕</button>`:''}</div>`).join('')
    +`<button class="timer-btn" onclick="monoMFAdd()" style="padding:7px 14px;font-size:12px;margin-bottom:14px">+ Schwelle</button>`
    +head('Zusatz-PR')
    +`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">🏆 Sieger<input type="number" step="5" value="${f.first}" oninput="monoMFBonus('first',this.value)" style="width:56px;padding:6px;${box}"/></label><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">💀 Erste Pleite<input type="number" step="5" value="${f.last}" oninput="monoMFBonus('last',this.value)" style="width:56px;padding:6px;${box}"/></label></div>`
    +`<div style="font-size:11px;color:var(--text-3);margin-bottom:10px">Im Cup gibt es keine PR – dort zählt die Summe der Höchstvermögen aller Runden.</div>`
    +`<button class="timer-btn" onclick="monoMFReset()" style="padding:7px 14px;font-size:12px">↩ PR-Formel zurücksetzen</button>`;
}

/* ── Cup-Auswahl im Setup ── */
function monoMetaToggleCup(v){monoCupSetup.enabled=v;const r=document.getElementById('mono-cup-rounds');if(r)r.style.display=v?'flex':'none';}
function monoMetaSetCupRounds(v){monoCupSetup.rounds=Math.max(2,Math.min(20,Math.round(+v||3)));}
function monoMetaInjectSetup(){
  const btn=document.querySelector('#mono-setup-panel .btn-generate');
  if(!btn||document.getElementById('mono-cup-setup'))return;
  const d=document.createElement('div');d.id='mono-cup-setup';
  d.style.cssText='margin-bottom:14px;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px';
  d.innerHTML=`<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;font-weight:600;color:var(--text)"><input type="checkbox" onchange="monoMetaToggleCup(this.checked)"/>🏆 Cup-Modus (mehrere Runden)</label><div style="font-size:10px;color:var(--text-3);margin-top:2px">Es zählt die Summe des höchsten Vermögens aller Runden – Ränge/PR sind im Cup aus.</div><div id="mono-cup-rounds" style="display:none;align-items:center;gap:8px;margin-top:8px"><span style="font-size:11px;color:var(--text-3)">Anzahl Runden</span><input type="number" min="2" max="20" value="3" oninput="monoMetaSetCupRounds(this.value)" style="width:60px;padding:6px;background:var(--surface);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right"/></div>`;
  btn.parentNode.insertBefore(d,btn);
}

smRegister({id:'mono',title:'Monopoly',noMount:true,noDraws:true,
  renderFormula:monoMetaFormulaEditor,balTitle:'Bilanz nach Spielerzahl',sparkTitle:'Höchstes Vermögen pro Partie (€)',
  sparkVals:h=>h.map(x=>x.score||0),
  winSub:(r,h)=>`Ø Platz ${r.games?(r.sumPlace/r.games).toFixed(1):'–'}`,
  extraTiles:(r,h)=>{
    const g=r.games||0;
    return smTile('Höchstes Vermögen',(r.bestPeak||0)+'€',`Ø ${g?Math.round((r.sumPeak||0)/g):0}€ pro Partie`);
  }});
monoMetaInjectSetup();
smSeasonCheck('mono');
