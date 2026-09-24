/* ══════════════════════════════════
   SPIELMETA – gemeinsame Bausteine für Mehrspielerspiele
   Spielerkarte (Name/Emoji/Farbe), Hall of Fame, Profil, Ränge/Saisons,
   Best-of-Serie und Cup. Jedes Spiel meldet nur sein Ergebnis via smReport().
══════════════════════════════════ */
const SM_CFG={},SM_ST={},SM_UI={},SM_SNAP={},SM_REPLAY={};
const SM_COLORS=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00','#00acc1','#6d4c41'];
const SM_AVATARS=['🎲','🍀','🃏','🎯','🦄','🐉','🔥','⭐'];
const SM_ROMAN_FALLBACK=300;
const SM_TIERS_DEFAULT=[
  {label:'Bronze',icon:'🥉',color:'#ad6a3d',steps:[{rp:100,icon:'🥉'},{rp:150,icon:'🥉'},{rp:200,icon:'🥉'}]},
  {label:'Silber',icon:'🥈',color:'#9aa0a6',steps:[{rp:250,icon:'🥈'},{rp:300,icon:'🥈'},{rp:350,icon:'🥈'}]},
  {label:'Gold',icon:'🥇',color:'#d4af37',steps:[{rp:400,icon:'🥇'},{rp:450,icon:'🥇'},{rp:500,icon:'🥇'}]},
  {label:'Platin',icon:'💎',color:'#5ec8d8',steps:[{rp:550,icon:'💎'},{rp:600,icon:'💎'},{rp:650,icon:'💎'}]},
  {label:'Diamant',icon:'💠',color:'#7c4dff',steps:[{rp:700,icon:'💠'},{rp:750,icon:'💠'},{rp:800,icon:'💠'}]},
  {label:'Meister',icon:'👑',color:'#ff6f00',steps:[{rp:300,icon:'👑'}]}
];
function smTiersAreOld(t){return Array.isArray(t)&&t.length===6&&t.slice(0,5).every(x=>Array.isArray(x.steps)&&x.steps.length===3&&x.steps.every(z=>z.rp===100));}
const SM_FORMULA_DEFAULT={win:40,draw:10,loss:-25,streakBonus:5,streakCap:5,aiMult:{easy:0.5,medium:1,hard:1.5,expert:2},cupWinPts:3,cupDrawPts:1,eloOn:true,eloScale:200,eloStrength:0.5};
/* Standard-PR je Spiel (passend zu Spieldauer/Charakter; Rangleiter wie bei Kniffel) */
const SM_FORMULA_BY_GAME={
  ttt:{win:30,draw:5,loss:-20},
  vg:{win:40,draw:10,loss:-25},
  chess:{win:60,draw:20,loss:-40},
  bs:{win:50,draw:0,loss:-35},
  mem:{win:40,draw:10,loss:-25},
  hm:{win:30,draw:0,loss:-20},
  mm:{win:40,draw:0,loss:-25}
};
function smFormulaDefault(id){return Object.assign(smClone(SM_FORMULA_DEFAULT),SM_FORMULA_BY_GAME[id]||{});}
const SM_ACH=[
  {icon:'🥇',label:'Erster Sieg',desc:'Ein Spiel gewonnen',f:r=>r.wins>=1},
  {icon:'🎖',label:'Zehnfach-Sieger',desc:'10 Spiele gewonnen',f:r=>r.wins>=10},
  {icon:'🏅',label:'Halbhundert',desc:'50 Spiele gewonnen',f:r=>r.wins>=50},
  {icon:'🏟',label:'Veteran',desc:'50 Spiele gespielt',f:r=>r.games>=50},
  {icon:'🔥',label:'Auf Touren',desc:'3 Siege in Folge',f:r=>r.bestStreak>=3},
  {icon:'☄️',label:'Unaufhaltsam',desc:'5 Siege in Folge',f:r=>r.bestStreak>=5},
  {icon:'🌋',label:'Legende',desc:'10 Siege in Folge',f:r=>r.bestStreak>=10},
  {icon:'🤖',label:'KI-Bezwinger',desc:'Gegen die schwere KI gewonnen',f:r=>r.aiHardWins>=1},
  {icon:'🎯',label:'Serien-Sieger',desc:'Eine Best-of-Serie gewonnen',f:r=>r.seriesWins>=1},
  {icon:'🏆',label:'Cup-Sieger',desc:'Einen Cup gewonnen',f:r=>r.cupWins>=1},
  {icon:'💎',label:'Goldklasse',desc:'Mindestens den 3. Rang erreicht',f:(r,pk)=>pk>=2}
];

/* Konten: Mehrspieler-Spiele erlauben nur Spieler-Accounts (Spielzentrale) oder Gäste. Gast-Partien werden nicht gewertet. */
function zcIsGuest(n){return /^Gast( \d+)?$/i.test((n||'').trim());}
function zcGuestName(taken){const t=(taken||[]).map(x=>(x||'').trim().toLowerCase());if(!t.includes('gast'))return'Gast';for(let i=2;;i++){if(!t.includes('gast '+i))return'Gast '+i;}}
function smClone(o){return JSON.parse(JSON.stringify(o));}
function smEl(id,part){return document.getElementById('sm-'+id+'-'+part);}
function smKey(id){return 'zf_sm_'+id;}
function smDefaultState(){
  return{setup:{names:['Gast','Gast 2'],avatars:['🎲','🍀'],colors:['#e53935','#1e88e5']},
    hof:{},rank:{},tiers:null,formula:null,season:null,seasonHistory:[],cupHistory:[],seriesHistory:[],
    series:null,cup:null,cupRounds:3};
}
function smS(id){
  if(SM_ST[id])return SM_ST[id];
  let st=null;
  try{const s=localStorage.getItem(smKey(id));st=s?JSON.parse(s):null;}catch(e){}
  const d=smDefaultState();
  st=Object.assign(d,st||{});
  st.setup=Object.assign(smDefaultState().setup,st.setup||{});
  const oldF=st.formula&&st.formula.win===20&&st.formula.draw===5&&st.formula.loss===-12&&st.formula.streakBonus===3;
  st.formula=Object.assign(smFormulaDefault(id),oldF?{}:(st.formula||{}));
  st.formula.aiMult=Object.assign({},SM_FORMULA_DEFAULT.aiMult,st.formula.aiMult||{});
  if(!Array.isArray(st.tiers)||st.tiers.length<2||smTiersAreOld(st.tiers))st.tiers=smClone(SM_TIERS_DEFAULT);
  if(!st.season||!st.season.startedAt)st.season={number:1,startedAt:Date.now(),autoResetDays:0};
  SM_ST[id]=st;return st;
}
function smSave(id){try{localStorage.setItem(smKey(id),JSON.stringify(SM_ST[id]));}catch(e){}}

/* ── Spieler ── */
function smPlayers(id){
  const cfg=SM_CFG[id],st=smS(id).setup,ai=cfg.sideAI();
  return[0,1].map(i=>ai[i]
    ?{name:'KI',avatar:'🤖',color:'#78909c',isAI:true,side:i,label:cfg.sides[i]}
    :{name:st.names[i],avatar:st.avatars[i],color:st.colors[i],isAI:false,side:i,label:cfg.sides[i]});
}
function smLocked(id){const s=smS(id);return!!((s.series&&!s.series.done)||(s.cup&&!s.cup.done));}
function smNotify(id){const cfg=SM_CFG[id];if(cfg&&cfg.onPlayers){try{cfg.onPlayers(smPlayers(id));}catch(e){}}}
function smSetName(id,i,v){
  if(smLocked(id)){smRenderMeta(id);return;}
  if(v==='__new'){if(typeof zcWhoCreate==='function')zcWhoCreate(n=>smSetName(id,i,n));smRenderMeta(id);return;}
  const s=smS(id).setup;v=(v||'').trim()||zcGuestName([]);
  const ai=SM_CFG[id].sideAI();
  if(!ai[1-i]&&s.names[1-i].toLowerCase()===v.toLowerCase()){showToast('Dieser Spieler ist schon auf der anderen Seite');smRenderMeta(id);return;}
  s.names[i]=v;
  const look=typeof zcAccountLook==='function'?zcAccountLook(v):null;
  if(look){if(s.avatars[1-i]!==look.avatar)s.avatars[i]=look.avatar;if(s.colors[1-i]!==look.color)s.colors[i]=look.color;}
  smSave(id);smRenderMeta(id);smNotify(id);
}
function smSetAvatar(id,i,val){
  if(smLocked(id)){smRenderMeta(id);return;}
  const s=smS(id).setup,v=(val||'').trim();
  if(!v){smRenderMeta(id);return;}
  if(s.avatars[1-i]===v){showToast('Emoji bereits vergeben');smRenderMeta(id);return;}
  s.avatars[i]=v;smSave(id);smRenderMeta(id);smNotify(id);
}
function smSetColor(id,i,val){
  if(smLocked(id)){smRenderMeta(id);return;}
  const s=smS(id).setup;let v=(val||'').trim();
  if(v&&!v.startsWith('#'))v='#'+v;v=v.toLowerCase();
  if(!/^#[0-9a-f]{6}$/.test(v)){showToast('Ungültiger Hex-Code (Format #RRGGBB)');smRenderMeta(id);return;}
  if(s.colors[1-i]===v){showToast('Farbe bereits vergeben');smRenderMeta(id);return;}
  s.colors[i]=v;SM_UI[id].colorPickerFor=null;smSave(id);smRenderMeta(id);smNotify(id);
}
function smToggleColorPicker(id,i){SM_UI[id].colorPickerFor=SM_UI[id].colorPickerFor===i?null:i;smRenderMeta(id);}

/* ── Rang-Berechnung ── */
function smTierSteps(t){
  const raw=Array.isArray(t.steps)&&t.steps.length?t.steps:[{rp:SM_ROMAN_FALLBACK,icon:t.icon}];
  return raw.map(s=>({rp:Math.max(1,+(s&&s.rp!=null?s.rp:s)||100),icon:(s&&s.icon)||t.icon}));
}
function smRankInfo(id,pr){
  pr=Math.max(0,pr||0);
  const tiers=smS(id).tiers;let acc=0;
  for(let i=0;i<tiers.length-1;i++){
    const steps=smTierSteps(tiers[i]);
    const width=steps.reduce((a,b)=>a+b.rp,0);
    if(pr<acc+width){
      const into=pr-acc;let cum=0,di=steps.length-1,inDiv=0,dw=steps[di].rp;
      for(let d=0;d<steps.length;d++){if(into<cum+steps[d].rp){di=d;inDiv=into-cum;dw=steps[d].rp;break;}cum+=steps[d].rp;}
      const division=steps.length>1?String(di+1):null;
      return{tier:tiers[i],tierIdx:i,division,icon:steps[di].icon||tiers[i].icon,pr,progress:inDiv/dw,label:division?`${tiers[i].label} ${division}`:tiers[i].label};
    }
    acc+=width;
  }
  const top=tiers[tiers.length-1];
  return{tier:top,tierIdx:tiers.length-1,division:null,icon:top.icon,pr,progress:1,label:top.label};
}
function smRankBadge(id,pr,compact){
  const i=smRankInfo(id,pr),pct=Math.round(i.progress*100);
  return`<div style="display:flex;align-items:center;gap:6px">
    <span style="font-size:${compact?14:16}px;flex-shrink:0">${i.icon}</span>
    <span style="font-size:11px;font-weight:700;color:${i.tier.color};white-space:nowrap">${escHtml(i.label)}</span>
    <div style="flex:1;height:6px;background:var(--divider);border-radius:3px;overflow:hidden;min-width:40px;max-width:120px"><div style="height:100%;width:${pct}%;background:${i.tier.color}"></div></div>
    <span style="font-size:10px;color:var(--text-3);white-space:nowrap;flex-shrink:0">${pr} PR</span>
  </div>`;
}
function smPrDelta(id,o,rec,opp,diff,myPr,oppPr){
  const f=smS(id).formula;
  let base=o==='W'?f.win:o==='D'?f.draw:f.loss;
  if(o==='W')base+=Math.min(Math.max(rec.streak-1,0),f.streakCap)*f.streakBonus;
  if(opp.isAI){
    const m=f.aiMult[diff]||1;
    base=base>=0?base*m:base/m;
  }else if(f.eloOn&&oppPr!=null){
    const dn=Math.max(-1,Math.min(1,(oppPr-myPr)/(f.eloScale||200)))*(f.eloStrength==null?0.5:f.eloStrength);
    base=base>=0?base*(1+dn):base*(1-dn);
  }
  return Math.round(base);
}

/* ── Ergebnis melden ── */
function smRecordHof(id,p,i,o,players,res,inCup,diff){
  const st=smS(id);
  let rec=st.hof[p.name];
  if(!rec)rec=st.hof[p.name]={games:0,wins:0,losses:0,draws:0,streak:0,bestStreak:0,history:[],firstPlayed:Date.now(),prEarned:0,prLost:0,peakPr:0,cupWins:0,cupsPlayed:0,seriesWins:0,seriesPlayed:0,aiHardWins:0};
  rec.games++;
  if(o==='W'){rec.wins++;rec.streak=(rec.streak||0)+1;rec.bestStreak=Math.max(rec.bestStreak||0,rec.streak);}
  else{rec.streak=0;if(o==='L')rec.losses++;else rec.draws++;}
  const opp=players[1-i];
  if(o==='W'&&opp.isAI&&(diff==='hard'||diff==='expert'))rec.aiHardWins=(rec.aiHardWins||0)+1;
  if(o==='W'&&opp.isAI&&diff==='expert')rec.aiExpertWins=(rec.aiExpertWins||0)+1;
  rec.lastPlayed=Date.now();
  rec.history.push({t:rec.lastPlayed,res:o,opp:opp.isAI?'🤖 KI':opp.name,ai:opp.isAI,diff:opp.isAI?(diff||null):null,cup:!!inCup,score:res.scores?res.scores[i]:null});
  if(rec.history.length>150)rec.history.shift();
  return rec;
}
function smApplyPr(id,players,outcome,diff){
  const st=smS(id),deltas={};
  const pre=players.map(p=>p.isAI?null:(st.rank[p.name]||0));
  const overallBefore=players.map(p=>p.isAI?null:(typeof zcOverallTotal==='function'?zcOverallTotal(p.name):0));
  players.forEach((p,i)=>{
    if(p.isAI)return;
    const rec=st.hof[p.name];
    const before=pre[i];
    const d=smPrDelta(id,outcome[i],rec,players[1-i],diff,before,pre[1-i]);
    const after=Math.max(0,before+d);
    st.rank[p.name]=after;
    rec.prEarned=(rec.prEarned||0)+Math.max(0,after-before);
    rec.prLost=(rec.prLost||0)+Math.max(0,before-after);
    rec.peakPr=Math.max(rec.peakPr||0,after);
    // Angezeigt wird der Gesamtrang (spielübergreifend), nicht der Rang in diesem einen Spiel.
    const ob=overallBefore[i],oa=typeof zcOverallTotal==='function'?zcOverallTotal(p.name):after;
    deltas[i]={name:p.name,delta:oa-ob,before:ob,after:oa,gameDelta:after-before,rankBefore:smRankInfo('zentrale',ob),rankAfter:smRankInfo('zentrale',oa)};
  });
  return deltas;
}
function smSnapshotSides(players){return players.map(p=>({name:p.name,isAI:p.isAI,avatar:p.avatar,color:p.color}));}
function smSidesMatch(snap,players){return snap.every((s,i)=>s.isAI===players[i].isAI&&s.name===players[i].name);}
function smReport(id,res){
  const cfg=SM_CFG[id],st=smS(id);
  smSeasonCheck(id);
  const players=smPlayers(id);
  const diff=cfg.difficulty?cfg.difficulty():null;
  const winner=res.winner;
  const outcome=[winner===-1?'D':(winner===0?'W':'L'),winner===-1?'D':(winner===1?'W':'L')];
  const friendly=players.some(p=>!p.isAI&&zcIsGuest(p.name));
  const champ=!friendly&&typeof zcChampActive==='function'?zcChampActive(id,players):null;
  let cup=st.cup&&!st.cup.done?st.cup:null;
  let series=st.series&&!st.series.done?st.series:null;
  if(cup&&!smSidesMatch(cup.sides,players)){st.cup=null;cup=null;showToast('Cup abgebrochen (Spieler/Modus geändert)');}
  if(series&&!smSidesMatch(series.sides,players)){st.series=null;series=null;showToast('Serie abgebrochen (Spieler/Modus geändert)');}
  players.forEach((p,i)=>{if(p.isAI||friendly)return;const rec=smRecordHof(id,p,i,outcome[i],players,res,!!cup||!!champ,diff);if(typeof zcEvent==='function')zcEvent({game:id,name:p.name,res:outcome[i],diff:players[1-i].isAI?diff:null,cup:!!cup||!!champ,streak:rec.streak});});
  const deltas=(cup||champ||friendly)?null:smApplyPr(id,players,outcome,diff);
  if(!cup&&!champ&&!friendly&&players.some(p=>p.isAI)){const hi=players.findIndex(p=>!p.isAI);if(hi>=0)smAdaptiveUpdate(id,players[hi].name,outcome[hi]);}
  if(cup){
    const f=st.formula,pts=[0,0];
    pts[0]=outcome[0]==='W'?f.cupWinPts:outcome[0]==='D'?f.cupDrawPts:0;
    pts[1]=outcome[1]==='W'?f.cupWinPts:outcome[1]==='D'?f.cupDrawPts:0;
    cup.pts[0]+=pts[0];cup.pts[1]+=pts[1];cup.results.push({w:winner,pts});cup.played++;
    if(cup.played>=cup.rounds){
      cup.done=true;
      const top=Math.max(cup.pts[0],cup.pts[1]);
      const winners=[0,1].filter(i=>cup.pts[i]===top);
      cup.winners=winners;
      st.cupHistory.unshift({endedAt:Date.now(),rounds:cup.rounds,sides:cup.sides,pts:cup.pts.slice(),winners});
      cup.sides.forEach((s,i)=>{if(s.isAI||friendly)return;const r=st.hof[s.name];if(!r)return;r.cupsPlayed=(r.cupsPlayed||0)+1;if(winners.includes(i)&&winners.length===1)r.cupWins=(r.cupWins||0)+1;});
    }
  }
  if(series){
    if(winner!==-1)series.wins[winner]++;
    series.played++;
    if(series.wins[0]>=series.target||series.wins[1]>=series.target){
      series.done=true;series.winner=series.wins[0]>series.wins[1]?0:1;
      st.seriesHistory.unshift({endedAt:Date.now(),bo:series.bo,sides:series.sides,wins:series.wins.slice(),winner:series.winner});
      series.sides.forEach((s,i)=>{if(s.isAI||friendly)return;const r=st.hof[s.name];if(!r)return;r.seriesPlayed=(r.seriesPlayed||0)+1;if(series.winner===i)r.seriesWins=(r.seriesWins||0)+1;});
    }
  }
  smSave(id);
  if(typeof rplFinish==='function')rplFinish(id,{prLine:deltas?Object.values(deltas).map(d=>`${d.name} ${d.delta>0?'+':''}${d.delta} PR`).join(' · '):'',names:players.map(p=>p.name),colors:players.map(p=>p.color),avatars:players.map(p=>p.avatar),winner,result:winner===-1?'🤝 Unentschieden':'🏆 '+players[winner].name+' gewinnt'});
  smRefresh(id);
  const champRes=champ&&typeof zcChampReport==='function'?zcChampReport(id,players,winner):null;
  smShowResult(id,{players,outcome,res,deltas,friendly,champ:champRes,cup:st.cup&&(cup||st.cup.done)?st.cup:null,series:st.series&&(series||st.series.done)?st.series:null,winner});
  const rankedUp=deltas&&Object.values(deltas).some(d=>d.delta>0&&d.rankAfter.label!==d.rankBefore.label);
  if(winner!==-1&&!players[winner].isAI){smConfetti();sfx(rankedUp?'rankup':'win');}
  else sfx(winner===-1?'draw':(players.some(p=>p.isAI)?'lose':'win'));
}

/* ── Adaptive KI: passt die Stufe an deine Leistung an ── */
function smAdaptiveName(id){const h=smPlayers(id).find(p=>!p.isAI);return h?h.name:null;}
function smHasAI(id){return SM_CFG[id].sideAI().some(Boolean);}
function smAdaptiveLevel(id,name){
  const st=smS(id),lv=SM_CFG[id].levels;if(!st.adapt)st.adapt={};
  let idx=st.adapt[name];if(idx==null)idx=Math.min(1,lv.length-1);
  return lv[Math.max(0,Math.min(lv.length-1,idx))];
}
function smApplyAdaptive(id){
  const cfg=SM_CFG[id],st=smS(id);
  if(!cfg.levels||!cfg.setLevel||!st.adaptive||!smHasAI(id))return;
  const name=smAdaptiveName(id);if(!name)return;
  const lv=smAdaptiveLevel(id,name);
  if(cfg.difficulty()!==lv)cfg.setLevel(lv);
}
function smAdaptiveUpdate(id,name,o){
  const cfg=SM_CFG[id],st=smS(id);
  if(!cfg.levels||!st.adaptive)return;
  if(!st.adapt)st.adapt={};if(!st.adaptC)st.adaptC={};
  let idx=st.adapt[name];if(idx==null)idx=Math.min(1,cfg.levels.length-1);
  let c=st.adaptC[name]||0;
  if(o==='W')c=Math.max(c,0)+1;else if(o==='L')c=Math.min(c,0)-1;else c=0;
  let msg=null;
  if(c>=2&&idx<cfg.levels.length-1){idx++;c=0;msg='🧠 KI wird stärker: '+cfg.levels[idx];}
  else if(c<=-2&&idx>0){idx--;c=0;msg='🧠 KI wird schwächer: '+cfg.levels[idx];}
  st.adapt[name]=idx;st.adaptC[name]=c;
  if(msg)setTimeout(()=>showToast(msg,2500),900);
}
function smSetAdaptive(id,on){smS(id).adaptive=!!on;smSave(id);smApplyAdaptive(id);smRefresh(id);showToast(on?'🧠 Adaptive KI an':'Adaptive KI aus');}

/* ── Zug zurück & Replay (Spiele liefern snapshot()/restore()) ── */
function smSnap(id,reset){
  const cfg=SM_CFG[id];if(!cfg||!cfg.snapshot)return;
  if(reset||!SM_SNAP[id])SM_SNAP[id]=[];
  SM_SNAP[id].push(cfg.snapshot());
}
function smUndo(id){
  const cfg=SM_CFG[id],sn=SM_SNAP[id]||[];
  if(SM_REPLAY[id]){showToast('Replay läuft');return;}
  if(cfg.isOver&&cfg.isOver()){showToast('Die Partie ist bereits beendet');return;}
  if(sn.length<2){showToast('Kein Zug zum Zurücknehmen');return;}
  if(cfg.cancelPending)cfg.cancelPending();
  let target;
  do{sn.pop();target=sn[sn.length-1];}while(sn.length>1&&cfg.undoUntil&&!cfg.undoUntil(target));
  cfg.restore(target,{});
  sfx('undo');
  showToast('↩ Zug zurückgenommen');
}
/* ── Ergebnis-Fenster ── */
function smShowResult(id,r){
  let ov=document.getElementById('sm-overlay');
  if(!ov){ov=document.createElement('div');ov.id='sm-overlay';ov.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:2000;align-items:center;justify-content:center;padding:16px';ov.innerHTML='<div id="sm-overlay-box" style="background:var(--window);border-radius:16px;padding:22px;max-width:380px;width:100%;max-height:85vh;overflow-y:auto;text-align:left"></div>';document.body.appendChild(ov);}
  const cfg=SM_CFG[id],p=r.players;
  const title=r.winner===-1?'🤝 Unentschieden':`🏆 ${escHtml(p[r.winner].name)} gewinnt!`;
  const line=(pl,i)=>`<div style="display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:8px;padding:6px 10px;margin-bottom:4px">
    <span style="width:22px;height:22px;border-radius:50%;background:${pl.color};display:inline-flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${pl.avatar}</span>
    <span style="flex:1;font-size:13px;color:var(--text)">${escHtml(pl.name)} <span style="font-size:10px;color:var(--text-3)">${escHtml(pl.label||'')}</span></span>
    ${r.res.scores?`<span style="font-size:12px;color:var(--text-3)">${r.res.scores[i]}</span>`:''}
    <span style="font-size:12px;font-weight:700;color:${r.outcome[i]==='W'?'#43a047':r.outcome[i]==='L'?'#e53935':'var(--text-3)'}">${r.outcome[i]==='W'?'Sieg':r.outcome[i]==='L'?'Niederlage':'Unentschieden'}</span>
  </div>`;
  const dHtml=r.deltas?`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:12px 0 6px">📊 Gesamtrang-Update</div>`+Object.values(r.deltas).map(d=>{
    const changed=d.rankAfter.label!==d.rankBefore.label;
    return`<div style="background:var(--bg);border-radius:8px;padding:6px 10px;margin-bottom:4px">
      <div style="display:flex"><span style="flex:1;font-size:12px;color:var(--text)">${escHtml(d.name)}</span><span style="font-size:12px;font-weight:700;color:${d.delta>0?'#2e7d32':d.delta<0?'#c62828':'var(--text-3)'}">${d.delta>0?'+':''}${d.delta} PR</span></div>
      <div style="margin-top:4px">${smRankBadge('zentrale',d.after,true)}</div>
      ${changed?`<div style="font-size:10px;margin-top:3px;color:${d.delta>0?'var(--accent)':'var(--text-3)'}">${d.delta>0?'🎉 Aufstieg':'Abstieg'} zu ${escHtml(d.rankAfter.label)}!</div>`:''}
    </div>`;}).join(''):'';
  if(r.deltas&&typeof zcCheckRankUpCelebration==='function')zcCheckRankUpCelebration(r.deltas);
  let mHtml=r.friendly?`<div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:10px;font-size:12px;text-align:center;color:var(--text-2)">🤝 Gastspiel – diese Partie wird nicht gewertet (keine PR, Statistik oder Coins).</div>`:'';
  if(r.series){const s=r.series;mHtml=`<div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:10px;font-size:12px;text-align:center;color:var(--text-2)">🎯 Serie (Best-of-${s.bo}): <b>${escHtml(s.sides[0].name)} ${s.wins[0]} : ${s.wins[1]} ${escHtml(s.sides[1].name)}</b>${s.done?`<div style="margin-top:4px;font-weight:700;color:var(--accent)">Serie entschieden – ${escHtml(s.sides[s.winner].name)} gewinnt!</div>`:`<div style="margin-top:2px;color:var(--text-3)">Weiter mit Runde ${s.played+1}</div>`}</div>`;}
  if(r.cup){const c=r.cup;mHtml=`<div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:10px;font-size:12px;color:var(--text-2)"><div style="text-align:center;font-weight:700;margin-bottom:4px">🏆 Cup · ${Math.min(c.played,c.rounds)}/${c.rounds} Runden</div>${c.sides.map((s,i)=>`<div style="display:flex"><span style="flex:1">${escHtml(s.avatar)} ${escHtml(s.name)}</span><b>${c.pts[i]} Pkt.</b></div>`).join('')}${c.done?`<div style="margin-top:6px;text-align:center;font-weight:700;color:var(--accent)">${c.winners.length>1?'Cup unentschieden!':'🏆 Cup-Sieger: '+escHtml(c.sides[c.winners[0]].name)}</div>`:`<div style="margin-top:4px;text-align:center;color:var(--text-3)">Weiter mit Runde ${c.played+1}</div>`}</div>`;}
  if(r.champ){const c=r.champ;mHtml=`<div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:10px;font-size:12px;text-align:center;color:var(--text-2)">🏅 Meisterschaft: <b>${escHtml(c.players[0])} ${c.pts[0]} : ${c.pts[1]} ${escHtml(c.players[1])}</b>${c.done?`<div style="margin-top:4px;font-weight:700;color:var(--accent)">${c.winners.length>1?'Unentschieden!':'🏵️ Meister: '+escHtml(c.players[c.winners[0]])+'!'}</div>`:`<div style="margin-top:2px;color:var(--text-3)">Weiter mit Spiel ${c.idx+1}/${c.games.length}</div>`}</div>`;}
  const champBtn=`<button class="btn-generate" onclick="smCloseResult();goTo('zentrale');zcShow('champ')" style="width:auto;padding:10px 22px">🏅 Zur Meisterschaft</button>`;
  const ongoing=(r.series&&!r.series.done)||(r.cup&&!r.cup.done);
  const bothHuman=!p[0].isAI&&!p[1].isAI&&!ongoing;
  const btns=ongoing
    ?`<button class="btn-generate" onclick="smNext('${id}')" style="width:auto;padding:10px 22px">▶ Nächste Runde</button><button class="timer-btn" onclick="smCancelMode('${id}',true)" style="padding:10px 16px;font-size:12px">Abbrechen</button>`
    :`<button class="btn-generate" onclick="${bothHuman?`smRematch('${id}')`:`smNext('${id}')`}" style="width:auto;padding:10px 22px">${bothHuman?'🔄 Revanche (Seiten tauschen)':'🔁 Nochmal'}</button><button class="timer-btn" onclick="smCloseResult()" style="padding:10px 16px;font-size:12px">Schließen</button>`;
  const replayBtn=typeof rplHas==='function'&&rplHas(id)?`<button class="timer-btn" onclick="rplOpen('${id}')" style="padding:10px 16px;font-size:12px">🎬 Replay</button>`:'';
  document.getElementById('sm-overlay-box').innerHTML=`<div style="text-align:center;font-size:18px;font-weight:700;color:var(--text);margin-bottom:12px">${title}</div>${line(p[0],0)}${line(p[1],1)}${dHtml}${mHtml}<div style="display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap">${r.champ?champBtn:btns}${replayBtn}</div>`;
  ov.style.display='flex';
}
function smRematch(id){
  const s=smS(id).setup;
  [s.names[0],s.names[1]]=[s.names[1],s.names[0]];
  [s.avatars[0],s.avatars[1]]=[s.avatars[1],s.avatars[0]];
  [s.colors[0],s.colors[1]]=[s.colors[1],s.colors[0]];
  smSave(id);smNotify(id);smNext(id);
  showToast('Seiten getauscht – Revanche!');
}
function smCloseResult(){const ov=document.getElementById('sm-overlay');if(ov)ov.style.display='none';}
function smNext(id){
  smCloseResult();
  const s=smS(id);
  if(s.series&&s.series.done){s.series=null;smSave(id);}
  if(s.cup&&s.cup.done){s.cup=null;smSave(id);}
  smRefresh(id);
  if(SM_CFG[id].newGame)SM_CFG[id].newGame();
}
function smConfetti(){
  const cols=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00'];
  const div=document.createElement('div');div.style.cssText='position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:2100';
  let h='<style>@keyframes smFall{to{transform:translateY(100vh) rotate(720deg);opacity:0}}</style>';
  for(let i=0;i<50;i++){const w=(5+Math.random()*6).toFixed(1);h+=`<span style="position:absolute;top:-20px;left:${(Math.random()*100).toFixed(1)}%;width:${w}px;height:${(w*0.4).toFixed(1)}px;background:${cols[i%cols.length]};opacity:0.9;transform:rotate(${Math.floor(Math.random()*360)}deg);animation:smFall ${(1.8+Math.random()*1.4).toFixed(2)}s ${(Math.random()*0.5).toFixed(2)}s ease-in forwards;border-radius:2px"></span>`;}
  div.innerHTML=h;document.body.appendChild(div);setTimeout(()=>div.remove(),3500);
}

/* ── Modus: Einzelspiel / Best-of-Serie / Cup ── */
function smStartSeries(id,bo){
  const s=smS(id);if(smLocked(id))return;
  s.series={bo,target:Math.ceil(bo/2),wins:[0,0],played:0,done:false,sides:smSnapshotSides(smPlayers(id))};s.cup=null;
  smSave(id);smRefresh(id);
  if(SM_CFG[id].newGame)SM_CFG[id].newGame();
}
function smStartCup(id){
  const s=smS(id);if(smLocked(id))return;
  s.cup={rounds:s.cupRounds,played:0,done:false,pts:[0,0],results:[],sides:smSnapshotSides(smPlayers(id))};s.series=null;
  smSave(id);smRefresh(id);
  if(SM_CFG[id].newGame)SM_CFG[id].newGame();
}
function smSetCupRounds(id,v){smS(id).cupRounds=Math.max(2,Math.min(30,Math.round(+v||3)));smSave(id);}
function smCancelMode(id,fromResult){
  const s=smS(id);s.series=null;s.cup=null;smSave(id);
  if(fromResult)smCloseResult();
  smRefresh(id);
}
function smRenderBanner(id){
  const el=smEl(id,'banner');if(!el)return;const s=smS(id);
  const a=s.series&&!s.series.done?s.series:null,c=s.cup&&!s.cup.done?s.cup:null;
  if(!a&&!c){el.innerHTML='';return;}
  el.innerHTML=a
    ?`🎯 Serie (Best-of-${a.bo}) · Runde ${a.played+1}: <b>${escHtml(a.sides[0].name)} ${a.wins[0]} : ${a.wins[1]} ${escHtml(a.sides[1].name)}</b>`
    :`🏆 Cup · Runde ${c.played+1}/${c.rounds}: <b>${escHtml(c.sides[0].name)} ${c.pts[0]} : ${c.pts[1]} ${escHtml(c.sides[1].name)}</b> <span style="color:var(--text-3)">(Ränge aus)</span>`;
}

/* ── Spielerkarte & Modus-Auswahl ── */
function smRenderMeta(id){
  const el=smEl(id,'meta');if(!el)return;
  const cfg=SM_CFG[id],s=smS(id),ui=SM_UI[id];
  if(typeof zcNormSetupNames==='function')zcNormSetupNames(id);
  if(cfg.levels&&s.adaptive)smApplyAdaptive(id);
  if(cfg.active&&!cfg.active()){el.innerHTML=`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--text-3);text-align:left">👥 Wertung, Ränge, Serie &amp; Cup gibt es im 2-Spieler-Modus – bitte oben „2 Spieler“ wählen.</div>`;return;}
  const pl=smPlayers(id),locked=smLocked(id);
  const inp='padding:7px 9px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px';
  const rows=pl.map((p,i)=>{
    if(p.isAI)return`<div style="display:flex;gap:8px;align-items:center"><span style="width:26px;height:26px;border-radius:50%;background:${p.color};display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🤖</span><span style="font-size:13px;color:var(--text-2);flex:1">KI${cfg.difficulty&&cfg.difficulty()?' ('+({easy:'Leicht',medium:'Mittel',hard:'Schwer',expert:'Sehr schwer'}[cfg.difficulty()]||'')+')':''} <span style="font-size:10px;color:var(--text-3)">${escHtml(cfg.sides[i])}</span></span></div>`;
    const picker=ui.colorPickerFor===i?`<div style="display:flex;flex-direction:column;gap:8px;padding:6px 0 4px 32px"><div style="display:flex;gap:7px;flex-wrap:wrap">${SM_COLORS.map(c=>{const taken=s.setup.colors[1-i]===c;return`<button ${taken?'disabled':''} onclick="smSetColor('${id}',${i},'${c}')" style="width:22px;height:22px;border-radius:50%;background:${c};border:${c===p.color?'2px solid var(--text)':'2px solid transparent'};cursor:${taken?'not-allowed':'pointer'};padding:0;opacity:${taken?0.25:1}"></button>`;}).join('')}</div><div style="display:flex;align-items:center;gap:8px"><input type="color" value="${p.color}" onchange="smSetColor('${id}',${i},this.value)" style="width:32px;height:28px;padding:0;border:0.5px solid var(--divider);border-radius:6px;cursor:pointer;background:none"/><input type="text" value="${p.color}" onchange="smSetColor('${id}',${i},this.value)" maxlength="7" style="width:90px;${inp};font-family:monospace;font-size:12px"/></div></div>`:'';
    return`<div style="display:flex;flex-direction:column"><div style="display:flex;gap:8px;align-items:center">
      <input type="text" value="${escHtml(p.avatar)}" ${locked?'disabled':''} onchange="smSetAvatar('${id}',${i},this.value)" maxlength="8" title="Emoji eingeben – Windows: Win+. · Mac: Cmd+Ctrl+Leertaste" style="width:26px;height:26px;border-radius:50%;background:var(--bg);flex-shrink:0;border:2px solid var(--divider);padding:0;font-size:14px;text-align:center"/>
      <button ${locked?'disabled':''} onclick="smToggleColorPicker('${id}',${i})" title="Farbe ändern" style="width:22px;height:22px;border-radius:50%;background:${p.color};flex-shrink:0;border:2px solid var(--divider);cursor:pointer;padding:0"></button>
      ${typeof zcAccountSelect==='function'?zcAccountSelect(p.name,pl.filter((q,j)=>j!==i&&!q.isAI).map(q=>q.name),`smSetName('${id}',${i},this.value)`,{disabled:locked,style:'flex:1;min-width:0;'+inp}):`<input type="text" value="${escHtml(p.name)}" ${locked?'disabled':''} onchange="smSetName('${id}',${i},this.value)" style="flex:1;min-width:0;${inp}"/>`}
      <span style="font-size:10px;color:var(--text-3);flex-shrink:0">${escHtml(cfg.sides[i])}</span></div>${picker}</div>`;
  }).join('');
  const chip=(label,on)=>`style="padding:6px 11px;font-size:11px;border-radius:14px;border:0.5px solid var(--divider);background:${on?'var(--accent)':'var(--bg)'};color:${on?'#fff':'var(--text)'};cursor:pointer"`;
  const active=(s.series&&!s.series.done)||(s.cup&&!s.cup.done);
  const modeRow=active
    ?`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:11px;color:var(--text-3);flex:1">Laufender ${s.series&&!s.series.done?'Serien':'Cup'}-Modus – Namen gesperrt</span><button class="timer-btn" onclick="smCancelMode('${id}')" style="padding:5px 12px;font-size:11px">Abbrechen</button></div>`
    :`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:11px;color:var(--text-3)">Modus:</span>
      <button disabled style="padding:6px 11px;font-size:11px;border-radius:14px;border:0.5px solid var(--accent);background:var(--accent);color:#fff">Einzelspiel</button>
      ${[3,5,7].map(b=>`<button onclick="smStartSeries('${id}',${b})" ${chip('',false)} title="Best-of-${b}-Serie starten">Best-of-${b}</button>`).join('')}
      <button onclick="smStartCup('${id}')" ${chip('',false)} title="Cup starten: Punkte über alle Runden addieren, Ränge aus">🏆 Cup</button>
      <input type="number" min="2" max="30" value="${s.cupRounds}" oninput="smSetCupRounds('${id}',this.value)" title="Cup-Runden" style="width:46px;${inp};padding:5px;text-align:right"/><span style="font-size:10px;color:var(--text-3)">Runden</span></div>`;
  const adaptRow=(cfg.levels&&smHasAI(id))?`<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2);cursor:pointer"><input type="checkbox" ${s.adaptive?'checked':''} onchange="smSetAdaptive('${id}',this.checked)"/>🧠 Adaptive KI – passt die Stufe an dich an${s.adaptive&&smAdaptiveName(id)?` <span style="color:var(--text-3)">(aktuell: ${{easy:'Leicht',medium:'Mittel',hard:'Schwer',expert:'Sehr schwer'}[smAdaptiveLevel(id,smAdaptiveName(id))]})</span>`:''}</label>`:'';
  const hasR=typeof rplHas==='function'&&rplHas(id);
  const undoRow=(cfg.snapshot||hasR)?`<div style="display:flex;gap:8px;flex-wrap:wrap">${cfg.snapshot?`<button class="timer-btn" onclick="smUndo('${id}')" style="padding:6px 12px;font-size:11px">↩ Zug zurück</button>`:''}${hasR?`<button class="timer-btn" onclick="rplOpen('${id}')" style="padding:6px 12px;font-size:11px">🎬 Letzte Partie ansehen</button>`:''}</div>`:'';
  el.innerHTML=`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:12px;margin-bottom:12px;text-align:left;display:flex;flex-direction:column;gap:8px">${rows}${adaptRow}${modeRow}${undoRow}<div id="sm-${id}-banner" style="font-size:12px;color:var(--text-2);text-align:center"></div></div>`;
  smRenderBanner(id);
}
function smRefresh(id){smRenderMeta(id);}

/* ── Tabs ── */
function smShowView(id,v){
  SM_UI[id].view=v;
  ['play','hof','profile','ranks'].forEach(x=>{
    const t=document.getElementById(`sm-${id}-tab-${x}`);if(t)t.classList.toggle('active',x===v);
    const c=smEl(id,'view-'+x);if(c)c.style.display=x===v?'block':'none';
  });
  if(v==='play')smRenderMeta(id);
  if(v==='hof')smRenderHof(id);
  if(v==='profile')smRenderProfile(id);
  if(v==='ranks')smRenderRanks(id);
}

/* ── Hall of Fame ── */
let smHofNames={};
function smRenderHof(id){
  const wrap=smEl(id,'hof-list');if(!wrap)return;
  const s=smS(id),names=Object.keys(s.hof);
  const legend=`<details style="margin-bottom:12px"><summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--text-2)">🏅 Auszeichnungen (${SM_ACH.length})</summary><div style="margin-top:8px">${SM_ACH.map(a=>`<div style="display:flex;gap:10px;align-items:center;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:6px 10px;margin-bottom:4px"><span style="font-size:16px">${a.icon}</span><div><div style="font-size:12px;font-weight:700;color:var(--text)">${escHtml(a.label)}</div><div style="font-size:10px;color:var(--text-3)">${escHtml(a.desc)}</div></div></div>`).join('')}</div></details>`;
  const hist=`<details style="margin-top:14px"><summary style="cursor:pointer;font-size:12px;font-weight:700;color:var(--text-2)">🎯 Serien- &amp; Cup-Historie</summary><div style="margin-top:8px">${smHistoryHtml(id)}</div></details>`;
  if(!names.length){smHofNames[id]=[];wrap.innerHTML=legend+`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0">Noch keine abgeschlossene Partie – füllt sich nach dem ersten Spielende.</div>`+hist;return;}
  const rows=names.map(n=>({name:n,pr:s.rank[n]||0,...s.hof[n]})).sort((a,b)=>b.pr-a.pr||b.wins-a.wins);
  smHofNames[id]=rows.map(r=>r.name);
  wrap.innerHTML=legend+rows.map((r,idx)=>{
    const wr=r.games?Math.round(r.wins/r.games*100):0;
    return`<div style="background:var(--bg);border-radius:10px;padding:10px 12px;margin-bottom:8px;text-align:left">
      <div style="display:flex;align-items:center;gap:8px">
        <span onclick="smOpenProfile('${id}',smHofNames['${id}'][${idx}])" title="Profil öffnen" style="flex:1;font-size:13px;font-weight:700;color:var(--text);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.name)}</span>
        <span style="font-size:11px;color:var(--text-3);flex-shrink:0">${r.wins}S · ${r.draws}U · ${r.losses}N (${wr}%)</span>
        <button onclick="smHofDelete('${id}',${idx})" title="Eintrag löschen" style="padding:2px 7px;font-size:11px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">✕</button>
      </div>
      <div style="margin-top:6px">${typeof zcOverallBadge==='function'?zcOverallBadge(r.name,false):smRankBadge(id,r.pr,false)}</div>
      <div style="font-size:11px;color:var(--text-3);margin-top:6px">Beste Serie: <b>${r.bestStreak||0}</b> · Aktuell: ${r.streak||0}${r.cupWins?` · 🏆 Cup-Sieger ${r.cupWins}×`:''}${r.seriesWins?` · 🎯 Serien ${r.seriesWins}×`:''}</div>
    </div>`;}).join('')+hist;
}
function smHistoryHtml(id){
  const s=smS(id);
  const d=t=>new Date(t).toLocaleDateString('de-DE');
  const ser=s.seriesHistory.slice(0,10).map(h=>`<div style="background:var(--bg);border-radius:8px;padding:6px 10px;margin-bottom:4px;font-size:11px;color:var(--text-2)">🎯 Best-of-${h.bo} · ${d(h.endedAt)}: <b>${escHtml(h.sides[0].name)} ${h.wins[0]} : ${h.wins[1]} ${escHtml(h.sides[1].name)}</b> → ${escHtml(h.sides[h.winner].name)}</div>`).join('');
  const cup=s.cupHistory.slice(0,10).map(h=>`<div style="background:var(--bg);border-radius:8px;padding:6px 10px;margin-bottom:4px;font-size:11px;color:var(--text-2)">🏆 Cup (${h.rounds} Runden) · ${d(h.endedAt)}: <b>${escHtml(h.sides[0].name)} ${h.pts[0]} : ${h.pts[1]} ${escHtml(h.sides[1].name)}</b>${h.winners.length===1?' → '+escHtml(h.sides[h.winners[0]].name):' → unentschieden'}</div>`).join('');
  return(ser+cup)||`<div style="font-size:11px;color:var(--text-3)">Noch keine abgeschlossene Serie oder Cup.</div>`;
}
function smHofDelete(id,idx){
  const name=(smHofNames[id]||[])[idx];if(name==null)return;
  appConfirm(`Eintrag für „${name}" löschen? Statistiken und Rang gehen verloren.`,()=>{
    const s=smS(id);delete s.hof[name];delete s.rank[name];smSave(id);smRenderHof(id);showToast('Eintrag gelöscht ✓');
  });
}
function smHofReset(id){
  appConfirm('Hall of Fame wirklich zurücksetzen? Alle Statistiken, Ränge, Serien- und Cup-Historie gehen verloren.',()=>{
    const s=smS(id);s.hof={};s.rank={};s.cupHistory=[];s.seriesHistory=[];smSave(id);smRenderHof(id);showToast('Hall of Fame zurückgesetzt ✓');
  });
}

/* ── Profil ── */
function smOpenProfile(id,name){if(!name)return;if(typeof goTo==='function')goTo('zentrale');if(typeof zcOpenProfile==='function')zcOpenProfile(name);}
function smProfileSearch(id,v){SM_UI[id].profileName=(v||'').trim();smRenderProfile(id);}
function smSpark(vals){
  if(vals.length<2)return'';
  const w=300,h=50,mn=Math.min(...vals),mx=Math.max(...vals),rg=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1)*w).toFixed(1)},${(h-4-((v-mn)/rg)*(h-8)).toFixed(1)}`).join(' ');
  return`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:50px"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}
function smTile(label,value,sub){
  return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em">${label}</div><div style="font-size:18px;font-weight:700;color:var(--text);margin-top:2px">${value}</div>${sub?`<div style="font-size:10px;color:var(--text-3);margin-top:2px">${sub}</div>`:''}</div>`;
}
function smRenderProfile(id){
  const s=smS(id);
  const dl=document.getElementById(`sm-${id}-names`);if(dl)dl.innerHTML=Object.keys(s.hof).map(n=>`<option value="${escHtml(n)}"></option>`).join('');
  const inp=document.getElementById(`sm-${id}-profile-input`);if(inp&&document.activeElement!==inp)inp.value=SM_UI[id].profileName||'';
  const wrap=smEl(id,'profile-result');if(!wrap)return;
  const q=(SM_UI[id].profileName||'').trim().toLowerCase();
  if(!q){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Spielernamen eingeben (oder in der Hall of Fame auf einen Namen tippen), um alle Statistiken zu sehen.</div>`;return;}
  const name=Object.keys(s.hof).find(n=>n.toLowerCase()===q);
  if(!name){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Kein Spieler „${escHtml(SM_UI[id].profileName)}" gefunden – Statistiken entstehen nach der ersten abgeschlossenen Partie.</div>`;return;}
  const cfg=SM_CFG[id],r=s.hof[name],pr=s.rank[name]||0,h=r.history||[];
  const seasonRows=[];s.seasonHistory.forEach(sh=>{const x=(sh.results||[]).find(z=>z.name===name);if(x)seasonRows.push({season:sh.season,pr:x.pr,label:x.label,icon:x.icon,color:x.color});});
  const peak=Math.max(r.peakPr||0,pr,...seasonRows.map(x=>x.pr));
  const peakI=smRankInfo(id,peak); // interner Spitzenwert in diesem Spiel (Stat, kein eigener Rang)
  const wr=r.games?Math.round(r.wins/r.games*100):0;
  const rate=arr=>arr.length?Math.round(arr.filter(x=>x.res==='W').length/arr.length*100)+'%':'–';
  const vsAi=h.filter(x=>x.ai),vsHu=h.filter(x=>!x.ai);
  const dot=x=>`<span title="${escHtml(x.opp)}" style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;font-size:10px;font-weight:700;color:#fff;background:${x.res==='W'?'#43a047':x.res==='L'?'#e53935':'#9e9e9e'}">${x.res==='W'?'S':x.res==='L'?'N':'U'}</span>`;
  const bal={};h.forEach(x=>{const b=bal[x.opp]||(bal[x.opp]={W:0,D:0,L:0});b[x.res]++;});
  const balRows=Object.entries(bal).sort((a,b)=>(b[1].W+b[1].D+b[1].L)-(a[1].W+a[1].D+a[1].L)).slice(0,6).map(([o,b])=>`<div style="display:flex;font-size:11px;padding:3px 0;color:var(--text-2)"><span style="flex:1">${escHtml(o)}</span><span>${b.W}S · ${b.D}U · ${b.L}N</span></div>`).join('');
  let cum=0;const cumVals=cfg.sparkVals?cfg.sparkVals(h):[0,...h.map(x=>cum+=(x.res==='W'?1:x.res==='L'?-1:0))];
  const ach=SM_ACH.filter(a=>a.f(Object.assign({aiHardWins:0,seriesWins:0,cupWins:0},r),typeof zcOverallInfo==='function'?zcOverallInfo(name).tierIdx:peakI.tierIdx));
  const seasonList=[{season:s.season.number,cur:true,pr},...seasonRows.map(x=>({season:x.season,pr:x.pr}))].map(x=>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px"><span style="font-size:11px;color:var(--text-3);width:62px;flex-shrink:0">Saison ${x.season}${x.cur?' ⏳':''}</span><span style="flex:1;font-size:12px;color:var(--text)">PR aus diesem Spiel</span><span style="font-size:11px;font-weight:600;color:var(--text-2)">${x.pr} PR</span></div>`
  ).join('');
  const sec=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:14px 0 6px">${t}</div>`;
  wrap.innerHTML=`
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:14px;margin-bottom:12px;text-align:left">
      <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">${escHtml(name)}</div>${typeof zcOverallBadge==='function'?zcOverallBadge(name,false):smRankBadge(id,pr,false)}
      <div style="font-size:11px;color:var(--text-3);margin-top:6px">Beste PR in diesem Spiel: <b>${peak}</b></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;text-align:left">
      ${smTile('Spiele',r.games,cfg.noDraws?`${r.wins} Siege · ${r.losses||0} Niederlagen`:`${r.wins} Siege · ${r.draws||0} Unentschieden · ${r.losses||0} Niederlagen`)}
      ${smTile('Siegchance',wr+'%',cfg.winSub?cfg.winSub(r,h):`gegen KI: ${rate(vsAi)} · Mensch: ${rate(vsHu)}`)}
      ${smTile('Beste Siegesserie',r.bestStreak||0,`Aktuell: ${r.streak||0}`)}
      ${smTile('PR verdient (gesamt)',r.prEarned||0,`verloren: ${r.prLost||0} · netto ${(r.prEarned||0)-(r.prLost||0)}`)}
      ${smTile('Serien',r.seriesWins||0,`gewonnen · ${r.seriesPlayed||0} gespielt`)}
      ${smTile('Cups',r.cupWins||0,`gewonnen · ${r.cupsPlayed||0} gespielt`)}
      ${smTile('Erste Partie',r.firstPlayed?new Date(r.firstPlayed).toLocaleDateString('de-DE'):'–','')}
      ${smTile('Zuletzt gespielt',r.lastPlayed?new Date(r.lastPlayed).toLocaleDateString('de-DE'):'–','')}
      ${cfg.extraTiles?cfg.extraTiles(r,h):''}
    </div>
    <div style="text-align:left">
    ${sec('Form (letzte '+Math.min(10,h.length)+' Spiele)')}<div>${h.slice(-10).map(dot).join(' ')||'<span style="font-size:11px;color:var(--text-3)">Noch keine Daten</span>'}</div>
    ${h.length>=2?sec(cfg.sparkTitle||'Bilanz-Verlauf (Siege − Niederlagen)')+`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 10px">${smSpark(cumVals)}</div>`:''}
    ${balRows?sec(cfg.balTitle||'Bilanz gegen Gegner')+`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:6px 12px">${balRows}</div>`:''}
    ${sec('PR-Beitrag pro Saison (dieses Spiel)')}${seasonList}
    ${ach.length?sec('Auszeichnungen')+`<div style="display:flex;flex-wrap:wrap;gap:4px">${ach.map(a=>`<span title="${escHtml(a.desc)}" style="font-size:10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:2px 8px">${a.icon} ${escHtml(a.label)}</span>`).join('')}</div>`:''}
    </div>`;
}

/* ── Ränge, Saisons, Editor ── */
function smSeasonFinalSum(id,name){return smS(id).seasonHistory.reduce((a,h)=>{const x=(h.results||[]).find(z=>z.name===name);return a+(x?x.pr:0);},0);}
function smSeasonArchive(id,auto,quiet){
  const s=smS(id),names=Object.keys(s.rank);
  if(names.length){
    s.seasonHistory.unshift({season:s.season.number,endedAt:Date.now(),results:names.map(n=>{const i=smRankInfo(id,s.rank[n]);return{name:n,pr:s.rank[n],label:i.label,icon:i.icon,color:i.tier.color};}).sort((a,b)=>b.pr-a.pr)});
  }
  s.rank={};const n=s.season.number+1;s.season={number:n,startedAt:Date.now(),autoResetDays:s.season.autoResetDays};
  smSave(id);smRenderRanks(id);smRenderHof(id);if(!quiet)showToast(`🏁 Saison ${n} gestartet${auto?' (automatisch)':''} ✓`);
}
function smSeasonCheck(id){
  const s=smS(id);if(!s.season.autoResetDays)return;
  if((Date.now()-s.season.startedAt)/86400000>=s.season.autoResetDays)smSeasonArchive(id,true);
}
function smSeasonManual(id){appConfirm(`Neue Saison starten? Alle aktuellen Ränge werden als „Saison ${smS(id).season.number}" archiviert und auf 0 PR zurückgesetzt.`,()=>smSeasonArchive(id,false));}
function smSeasonDays(id,v){smS(id).season.autoResetDays=Math.max(0,Math.round(+v||0));smSave(id);}
function smTierField(id,idx,key,val){const t=smS(id).tiers[idx];if(!t)return;if(key==='icon')val=(val||'').trim()||'🏅';else if(key==='label')val=(val||'').trim()||'Rang';t[key]=val;smSave(id);smRenderLadder(id);}
function smStepSet(id,idx,si,field,val){const t=smS(id).tiers[idx];if(!t||!t.steps[si])return;if(field==='icon')t.steps[si].icon=(val||'').trim()||'🏅';else t.steps[si].rp=Math.max(10,+val||10);smSave(id);smRenderLadder(id);}
function smStepAdd(id,idx){const t=smS(id).tiers[idx];if(!t||t.steps.length>=7)return;t.steps.push({rp:100,icon:t.icon});smSave(id);smRenderRanks(id);}
function smStepRemove(id,idx,si){const t=smS(id).tiers[idx];if(!t||t.steps.length<=1)return;t.steps.splice(si,1);smSave(id);smRenderRanks(id);}
function smTierAdd(id){const s=smS(id);s.tiers.splice(s.tiers.length-1,0,{label:'Neuer Rang',icon:'🏅',color:'#888888',steps:[{rp:100,icon:'🏅'},{rp:100,icon:'🏅'},{rp:100,icon:'🏅'}]});smSave(id);smRenderRanks(id);}
function smTierDel(id,idx){const s=smS(id);if(s.tiers.length<=2||!s.tiers[idx])return;appConfirm(`Rang „${s.tiers[idx].label}" löschen?`,()=>{s.tiers.splice(idx,1);smSave(id);smRenderRanks(id);});}
function smTiersReset(id){appConfirm('Ränge auf Standard zurücksetzen?',()=>{smS(id).tiers=smClone(SM_TIERS_DEFAULT);smSave(id);smRenderRanks(id);showToast('Ränge zurückgesetzt ✓');});}
function smFormulaSet(id,key,val){smS(id).formula[key]=Math.round(+val||0);smSave(id);}
function smFormulaFloat(id,key,val){smS(id).formula[key]=Math.max(0,+val||0);smSave(id);}
function smFormulaBool(id,key,val){smS(id).formula[key]=!!val;smSave(id);}
function smFormulaAi(id,d,val){smS(id).formula.aiMult[d]=Math.max(0.1,+val||1);smSave(id);}
function smFormulaReset(id){appConfirm('PR-Formel auf Standard zurücksetzen?',()=>{smS(id).formula=smFormulaDefault(id);smSave(id);smRenderRanks(id);showToast('PR-Formel zurückgesetzt ✓');});}
function smRenderLadder(id){
  const wrap=smEl(id,'ladder');if(!wrap)return;
  const tiers=smS(id).tiers;let acc=0;const rows=[];
  tiers.forEach((t,idx)=>{
    if(idx===tiers.length-1){rows.push({icon:t.icon,label:t.label,color:t.color,range:`ab ${acc} PR`});return;}
    smTierSteps(t).forEach((st,si)=>{rows.push({icon:st.icon,label:`${t.label} ${si+1}`,color:t.color,range:`${acc}–${acc+st.rp-1} PR`});acc+=st.rp;});
  });
  wrap.innerHTML=rows.reverse().map(r=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-left:3px solid ${r.color};background:var(--bg);border-radius:6px;margin-bottom:4px"><span style="font-size:16px">${r.icon}</span><span style="flex:1;font-size:12px;font-weight:600;color:var(--text)">${escHtml(r.label)}</span><span style="font-size:11px;color:var(--text-3)">${r.range}</span></div>`).join('');
}
function smRenderRanks(id){
  const s=smS(id);
  const box='background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text)';
  const ov=smEl(id,'overall');
  if(ov)ov.innerHTML=`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:14px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">🏆 Ein Rang für alle Spiele</div>
      <div style="font-size:12px;color:var(--text-2);line-height:1.5">Dein Rang gilt jetzt spielübergreifend – dieses Spiel trägt mit eigener PR zum Gesamtrang bei, hat aber keinen eigenen Rang mehr. Rang, Saison und Bestenliste findest du in der Spielzentrale.</div>
      <button class="timer-btn" onclick="goTo('zentrale')" style="margin-top:10px;padding:7px 14px;font-size:12px">🏆 Zur Spielzentrale</button>
    </div>`;
  const fe=smEl(id,'formula');
  if(fe&&SM_CFG[id].renderFormula){SM_CFG[id].renderFormula(id,fe);}
  else if(fe){
    const f=s.formula;
    const num=(label,key,step)=>`<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">${label}<input type="number" step="${step||1}" value="${f[key]}" oninput="smFormulaSet('${id}','${key}',this.value)" style="width:56px;padding:6px;${box};text-align:right"/></label>`;
    fe.innerHTML=`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">PR pro Ergebnis</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${num('🏆 Sieg','win')}${num('🤝 Unentschieden','draw')}${num('💥 Niederlage','loss')}${num('🔥 Serien-Bonus','streakBonus')}${num('Serien-Max','streakCap')}</div>
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">KI-Schwierigkeit (Sieg × Faktor, Niederlage ÷ Faktor)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${['easy','medium','hard','expert'].map(d=>`<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">${{easy:'Leicht',medium:'Mittel',hard:'Schwer',expert:'Sehr schwer'}[d]} ×<input type="number" step="0.1" min="0.1" value="${f.aiMult[d]}" oninput="smFormulaAi('${id}','${d}',this.value)" style="width:56px;padding:6px;${box};text-align:right"/></label>`).join('')}</div>
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Elo-Effekt (Mensch gegen Mensch)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;align-items:center"><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px"><input type="checkbox" ${f.eloOn?'checked':''} onchange="smFormulaBool('${id}','eloOn',this.checked)"/>An</label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">Skala (PR)<input type="number" step="50" min="10" value="${f.eloScale}" oninput="smFormulaSet('${id}','eloScale',this.value)" style="width:60px;padding:6px;${box};text-align:right"/></label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">Stärke<input type="number" step="0.1" min="0" max="1" value="${f.eloStrength}" oninput="smFormulaFloat('${id}','eloStrength',this.value)" style="width:56px;padding:6px;${box};text-align:right"/></label></div>
      <div style="font-size:10px;color:var(--text-3);margin-bottom:10px">Sieg gegen einen höher gerankten Spieler gibt mehr PR, Niederlage gegen ihn kostet weniger (und umgekehrt). Bei einem PR-Abstand ≥ Skala wirkt die volle Stärke (0,5 = ±50 %).</div>
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Cup-Punkte (keine PR im Cup)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">${num('Sieg','cupWinPts')}${num('Unentschieden','cupDrawPts')}</div>
      <button class="timer-btn" onclick="smFormulaReset('${id}')" style="padding:7px 14px;font-size:12px">↩ PR-Formel zurücksetzen</button>`;
  }
}

/* ── Registrierung & Einbau in den Spielbildschirm ── */
function smRegister(cfg){
  SM_CFG[cfg.id]=cfg;SM_UI[cfg.id]={view:'play',profileName:'',colorPickerFor:null};
  if(!cfg.noMount)smMount(cfg.id);
}
function smMount(id){
  const cfg=SM_CFG[id],screen=document.getElementById(cfg.screen);
  if(!screen||screen.dataset.smMounted)return;
  const content=[...screen.children].find(c=>!c.classList.contains('titlebar'));if(!content)return;
  screen.dataset.smMounted='1';
  const meta=document.createElement('div');meta.id=`sm-${id}-meta`;
  content.insertBefore(meta,content.firstChild);
  smSeasonCheck(id);smRenderMeta(id);smNotify(id);
}
