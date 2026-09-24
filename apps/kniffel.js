/* ══════════════════════════════════
   KNIFFEL
══════════════════════════════════ */
const KNIFFEL_CATEGORIES=[
  {key:'einser',label:'Einser',section:'upper',face:1},
  {key:'zweier',label:'Zweier',section:'upper',face:2},
  {key:'dreier',label:'Dreier',section:'upper',face:3},
  {key:'vierer',label:'Vierer',section:'upper',face:4},
  {key:'fuenfer',label:'Fünfer',section:'upper',face:5},
  {key:'sechser',label:'Sechser',section:'upper',face:6},
  {key:'dreierpasch',label:'Dreierpasch',section:'lower'},
  {key:'viererpasch',label:'Viererpasch',section:'lower'},
  {key:'fullhouse',label:'Full House',section:'lower'},
  {key:'kleinestrasse',label:'Kleine Straße',section:'lower'},
  {key:'grossestrasse',label:'Große Straße',section:'lower'},
  {key:'kniffel',label:'Kniffel',section:'lower'},
  {key:'chance',label:'Chance',section:'lower'}
];
const KNIFFEL_PLAYER_COLORS=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00','#00acc1','#6d4c41'];
const KNIFFEL_AVATARS=['🎲','🍀','🃏','🎯','🦄','🐉','🔥','⭐'];
const KNIFFEL_PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};

let kniffPlayersSetup=[];
let kniffPlayers=[];
let kniffTurn=0;
let kniffDice=[1,1,1,1,1];
let kniffHeld=[false,false,false,false,false];
let kniffRollsLeft=3;
let kniffGameOver=false;
let kniffLog=[];
let kniffAiTimer=null;
let kniffRolling=false;
let kniffUndoSnapshot=null;
let kniffRules={jokerRuleEnabled:true,rollsPerTurn:3,bonusThreshold:63,bonusPoints:35,kniffelBonusPoints:100,aiDifficulty:'hard',showProbabilities:true,showHints:true,adaptiveAI:false};
const KNIFFEL_RULES_DEFAULT={jokerRuleEnabled:true,rollsPerTurn:3,bonusThreshold:63,bonusPoints:35,kniffelBonusPoints:100,aiDifficulty:'hard',showProbabilities:true,showHints:true,adaptiveAI:false};
function kniffGameActive(){return kniffPlayers.length>0&&!kniffGameOver;}
const KNIFF_LEVELS=['easy','hard','expert'],KNIFF_LEVEL_LABELS=['Leicht','Schwer','Sehr schwer'];
function kniffAdaptUpdate(name,won){
  let st={};try{st=JSON.parse(localStorage.getItem('zf_kniffel_adapt')||'{}');}catch(e){}
  const key=(name||'').trim().toLowerCase();let c=(st[key]&&st[key].c)||0;
  c=won?Math.max(c,0)+1:Math.min(c,0)-1;
  let idx=KNIFF_LEVELS.indexOf(kniffRules.aiDifficulty);if(idx<0)idx=1;
  let msg=null;
  if(c>=2&&idx<KNIFF_LEVELS.length-1){idx++;c=0;msg='🧠 Kniffel-KI wird stärker: '+KNIFF_LEVEL_LABELS[idx];}
  else if(c<=-2&&idx>0){idx--;c=0;msg='🧠 Kniffel-KI wird schwächer: '+KNIFF_LEVEL_LABELS[idx];}
  st[key]={c};try{localStorage.setItem('zf_kniffel_adapt',JSON.stringify(st));}catch(e){}
  if(msg){kniffRules.aiDifficulty=KNIFF_LEVELS[idx];kniffSaveRules();setTimeout(()=>showToast(msg,2800),900);}
}
function kniffAiDiff(){return kniffRules.aiDifficulty==='easy'?'easy':kniffRules.aiDifficulty==='expert'?'expert':'hard';}
function kniffLoadRules(){
  try{const s=localStorage.getItem('zf_kniffel_rules');if(s)kniffRules=Object.assign({},KNIFFEL_RULES_DEFAULT,JSON.parse(s));}catch(e){}
}
function kniffSaveRules(){try{localStorage.setItem('zf_kniffel_rules',JSON.stringify(kniffRules));}catch(e){}}
function kniffSetRuleNumber(key,val){kniffRules[key]=Math.max(1,+val||0);kniffSaveRules();}
function kniffSetRuleToggle(key,val){kniffRules[key]=val;kniffSaveRules();}
function kniffSetAiDifficulty(d){kniffRules.aiDifficulty=d;kniffSaveRules();kniffRenderRulesEditor();}
function kniffRulesReset(){
  appConfirm('Regeln auf Standard zurücksetzen?',()=>{
    kniffRules=Object.assign({},KNIFFEL_RULES_DEFAULT);
    kniffSaveRules();kniffRenderRulesEditor();showToast('Regeln zurückgesetzt ✓');
  });
}

/* ── Turniermodus (Best-of-Serie für 2 Spieler) ── */
let kniffTournamentSetup={enabled:false,bo:3};
let kniffTournament=null;
function kniffLoadTournament(){
  try{const s=localStorage.getItem('zf_kniffel_tournament');kniffTournament=s?JSON.parse(s):null;}catch(e){kniffTournament=null;}
}
function kniffSaveTournament(){
  try{if(kniffTournament)localStorage.setItem('zf_kniffel_tournament',JSON.stringify(kniffTournament));else localStorage.removeItem('zf_kniffel_tournament');}catch(e){}
}
function kniffToggleTournamentMode(v){
  kniffTournamentSetup.enabled=v;
  if(v)kniffCupSetup.enabled=false;
  kniffRenderTournamentSetupUI();kniffRenderCupSetupUI();
}
function kniffSetTournamentBo(bo){kniffTournamentSetup.bo=bo;kniffRenderTournamentSetupUI();}
function kniffRenderTournamentSetupUI(){
  const wrap=document.getElementById('kniffel-tournament-setup');if(!wrap)return;
  const eligible=kniffPlayersSetup.length===2;
  wrap.style.display=eligible?'block':'none';
  if(!eligible)kniffTournamentSetup.enabled=false;
  const cb=document.getElementById('kniffel-tournament-toggle');if(cb)cb.checked=kniffTournamentSetup.enabled;
  const boWrap=document.getElementById('kniffel-tournament-bo');if(boWrap)boWrap.style.display=kniffTournamentSetup.enabled?'flex':'none';
  const b3=document.getElementById('kniffel-bo-3'),b5=document.getElementById('kniffel-bo-5');
  if(b3){b3.style.background=kniffTournamentSetup.bo===3?'var(--accent)':'var(--bg)';b3.style.color=kniffTournamentSetup.bo===3?'#fff':'var(--text)';}
  if(b5){b5.style.background=kniffTournamentSetup.bo===5?'var(--accent)':'var(--bg)';b5.style.color=kniffTournamentSetup.bo===5?'#fff':'var(--text)';}
}
function kniffRenderTournamentBanner(){
  const el=document.getElementById('kniffel-tournament-banner');if(!el)return;
  if(!kniffTournament||kniffTournament.done){el.style.display='none';el.innerHTML='';return;}
  const t=kniffTournament;
  el.style.display='block';
  el.innerHTML=`<div style="text-align:center;font-size:12px;color:var(--text-2);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px;margin-bottom:12px">
    🏆 Serie (Best-of-${t.bo}) · Runde ${t.round}: <b>${escHtml(t.names[0])} ${t.wins[0]} : ${t.wins[1]} ${escHtml(t.names[1])}</b>
  </div>`;
}
function kniffTournamentRecordRound(winner){
  if(!kniffTournament)return;
  if(winner){
    const idx=kniffPlayers.indexOf(winner);
    if(idx===0||idx===1){
      kniffTournament.wins[idx]++;
      kniffLogAdd(`🏅 Serie: ${kniffTournament.names[0]} ${kniffTournament.wins[0]} : ${kniffTournament.wins[1]} ${kniffTournament.names[1]}.`);
    }
  } else {
    kniffLogAdd('🤝 Unentschieden – die Runde zählt nicht für die Serie.');
  }
  if(kniffTournament.wins[0]>=kniffTournament.target||kniffTournament.wins[1]>=kniffTournament.target){
    kniffTournament.done=true;
    const winIdx=kniffTournament.wins[0]>kniffTournament.wins[1]?0:1;
    kniffLogAdd(`🏆 ${kniffTournament.names[winIdx]} gewinnt die Serie (Best-of-${kniffTournament.bo}) mit ${kniffTournament.wins[winIdx]}:${kniffTournament.wins[1-winIdx]}!`);
  }
  kniffSaveTournament();
}
function kniffTournamentNextRound(){
  kniffCloseGameOverModal();
  kniffStartGame();
}

/* ── Cup-Modus (mehrere Runden, Punkte werden addiert – keine Rangpunkte) ── */
let kniffCupSetup={enabled:false,rounds:3};
let kniffCup=null;
function kniffLoadCup(){
  try{const s=localStorage.getItem('zf_kniffel_cup');kniffCup=s?JSON.parse(s):null;}catch(e){kniffCup=null;}
}
function kniffSaveCup(){
  try{if(kniffCup)localStorage.setItem('zf_kniffel_cup',JSON.stringify(kniffCup));else localStorage.removeItem('zf_kniffel_cup');}catch(e){}
}
function kniffToggleCupMode(v){
  kniffCupSetup.enabled=v;
  if(v)kniffTournamentSetup.enabled=false;
  kniffRenderCupSetupUI();kniffRenderTournamentSetupUI();
}
function kniffSetCupRounds(v){kniffCupSetup.rounds=Math.max(2,Math.min(20,Math.round(+v||3)));}
function kniffRenderCupSetupUI(){
  const cb=document.getElementById('kniffel-cup-toggle');if(cb)cb.checked=kniffCupSetup.enabled;
  const roundsWrap=document.getElementById('kniffel-cup-rounds');if(roundsWrap)roundsWrap.style.display=kniffCupSetup.enabled?'flex':'none';
}
function kniffRenderCupBanner(){
  const el=document.getElementById('kniffel-cup-banner');if(!el)return;
  if(!kniffCup||kniffCup.done){el.style.display='none';el.innerHTML='';return;}
  const sorted=[...kniffCup.players].sort((a,b)=>b.total-a.total);
  el.style.display='block';
  el.innerHTML=`<div style="text-align:center;font-size:12px;color:var(--text-2);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px;margin-bottom:12px">
    🏆 Cup · Runde ${kniffCup.round}/${kniffCup.rounds}${sorted.length?` — Zwischenstand: ${sorted.map(p=>`${escHtml(p.name)} ${p.total}`).join(' · ')}`:''}
  </div>`;
}
function kniffCupRecordRound(){
  if(!kniffCup)return;
  kniffPlayers.forEach(p=>{
    let cp=kniffCup.players.find(x=>x.name===p.name);
    if(!cp){cp={name:p.name,color:p.color,avatar:p.avatar,total:0,scores:[]};kniffCup.players.push(cp);}
    const score=kniffGrandTotal(p);
    cp.scores.push(score);
    cp.total+=score;
  });
  kniffLogAdd(`🏆 Cup-Runde ${kniffCup.round}/${kniffCup.rounds} gewertet.`);
  if(kniffCup.round>=kniffCup.rounds){
    kniffCup.done=true;
    const sorted=[...kniffCup.players].sort((a,b)=>b.total-a.total);
    const top=sorted[0].total;
    const winners=sorted.filter(cp=>cp.total===top);
    const msg=winners.length>1?`Unentschieden im Cup zwischen ${winners.map(w=>w.name).join(', ')}!`:`${winners[0].name} gewinnt den Cup mit ${top} Punkten!`;
    kniffLogAdd(`🏆 ${msg}`);
    kniffCupHistoryRecord(sorted);
    kniffCupAwardBadges(winners.map(w=>w.name));
    kniffRenderCupHistory();
    kniffRenderHallOfFame();
  }
  kniffSaveCup();
}
function kniffCupHistoryLoad(){try{const s=localStorage.getItem('zf_kniffel_cuphistory');const arr=s?JSON.parse(s):[];return Array.isArray(arr)?arr:[];}catch(e){return[];}}
function kniffCupHistorySave(h){try{localStorage.setItem('zf_kniffel_cuphistory',JSON.stringify(h));}catch(e){}}
function kniffCupHistoryRecord(sortedPlayers){
  const history=kniffCupHistoryLoad();
  history.unshift({
    endedAt:Date.now(),
    rounds:kniffCup.rounds,
    players:sortedPlayers.map(cp=>({name:cp.name,total:cp.total,avatar:cp.avatar,color:cp.color}))
  });
  kniffCupHistorySave(history);
}
function kniffCupAwardBadges(winnerNames){
  const hof=kniffHallOfFameLoad();
  winnerNames.forEach(name=>{
    if(!name)return;
    if(!hof[name])hof[name]={games:0,wins:0,bestScore:0,kniffelCount:0,totalScore:0,badges:{},milestones:{},cupWins:0};
    hof[name].cupWins=(hof[name].cupWins||0)+1;
  });
  kniffHallOfFameSave(hof);
}
function kniffRenderCupHistory(){
  const wrap=document.getElementById('kniffel-cup-history');if(!wrap)return;
  const history=kniffCupHistoryLoad();
  if(!history.length){wrap.innerHTML=`<div style="font-size:11px;color:var(--text-3);padding:4px 0">Noch kein abgeschlossener Cup.</div>`;return;}
  wrap.innerHTML=history.map(h=>`<div style="background:var(--bg);border-radius:8px;padding:8px 10px;margin-bottom:6px">
    <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px">Cup (${h.rounds} Runden) · beendet am ${new Date(h.endedAt).toLocaleDateString('de-DE')}</div>
    ${h.players.slice(0,5).map((p,i)=>`<div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:2px 0">
      <span style="color:var(--text-3);width:14px;flex-shrink:0">${i+1}.</span>
      <span style="width:16px;height:16px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:10px">${p.avatar}</span>
      <span style="flex:1;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.name)}</span>
      <span style="font-weight:600">${p.total}</span>
    </div>`).join('')}
  </div>`).join('');
}
function kniffCupNextRound(){
  kniffCloseGameOverModal();
  kniffStartGame();
}

function kniffelCounts(dice){
  const counts=[0,0,0,0,0,0,0];
  dice.forEach(d=>counts[d]++);
  return counts;
}
function kniffelSum(dice){return dice.reduce((a,b)=>a+b,0);}
function kniffelIsKniffel(dice){return kniffelCounts(dice).some(c=>c===5);}
function kniffJokerActive(p){return kniffRules.jokerRuleEnabled&&p.scores.kniffel===50;}
function kniffelScoreFor(key,dice,jokerActive){
  const counts=kniffelCounts(dice);
  const cat=KNIFFEL_CATEGORIES.find(c=>c.key===key);
  if(cat&&cat.section==='upper')return counts[cat.face]*cat.face;
  if(key==='dreierpasch')return counts.some(c=>c>=3)?kniffelSum(dice):0;
  if(key==='viererpasch')return counts.some(c=>c>=4)?kniffelSum(dice):0;
  const isKniffel=kniffelIsKniffel(dice);
  if(key==='fullhouse'){
    if(jokerActive&&isKniffel)return 25;
    const hasThree=counts.some(c=>c===3);
    const hasTwo=counts.some(c=>c===2);
    return(hasThree&&hasTwo)?25:0;
  }
  if(key==='kleinestrasse'){
    if(jokerActive&&isKniffel)return 30;
    const present=new Set(dice);
    const runs=[[1,2,3,4],[2,3,4,5],[3,4,5,6]];
    return runs.some(r=>r.every(v=>present.has(v)))?30:0;
  }
  if(key==='grossestrasse'){
    if(jokerActive&&isKniffel)return 40;
    const present=new Set(dice);
    const runs=[[1,2,3,4,5],[2,3,4,5,6]];
    return runs.some(r=>r.every(v=>present.has(v)))?40:0;
  }
  if(key==='kniffel')return isKniffel?50:0;
  if(key==='chance')return kniffelSum(dice);
  return 0;
}
function kniffUpperSum(p){return KNIFFEL_CATEGORIES.filter(c=>c.section==='upper').reduce((s,c)=>s+(p.scores[c.key]||0),0);}
function kniffBonus(p){return kniffUpperSum(p)>=kniffRules.bonusThreshold?kniffRules.bonusPoints:0;}
function kniffLowerSum(p){return KNIFFEL_CATEGORIES.filter(c=>c.section==='lower').reduce((s,c)=>s+(p.scores[c.key]||0),0);}
function kniffGrandTotal(p){return kniffUpperSum(p)+kniffBonus(p)+kniffLowerSum(p)+(p.kniffelBonus||0);}
function kniffAllFilled(p){return KNIFFEL_CATEGORIES.every(c=>p.scores[c.key]!=null);}
function kniffZeroCount(p){return KNIFFEL_CATEGORIES.filter(c=>p.scores[c.key]===0).length;}
function kniffBestSingleScore(p){return Math.max(0,...KNIFFEL_CATEGORIES.map(c=>p.scores[c.key]||0));}
function kniffMostZeroedCategory(){
  let best=null,bestCount=0;
  KNIFFEL_CATEGORIES.forEach(c=>{
    const count=kniffPlayers.filter(p=>p.scores[c.key]===0).length;
    if(count>bestCount){bestCount=count;best=c;}
  });
  return best?{cat:best,count:bestCount}:null;
}

/* ── Badges ── */
const KNIFFEL_BADGE_DEFS=[
  {key:'kniffelking',icon:'🎲',label:'Kniffel-König',desc:'Die meisten Kniffel gewürfelt',calc:p=>p.kniffelRollCount||0},
  {key:'bestroll',icon:'🎯',label:'Bester Einzelwurf',desc:'Höchste Punktzahl in einer einzelnen Kategorie',calc:p=>kniffBestSingleScore(p)},
  {key:'cleanest',icon:'✨',label:'Sauberste Karte',desc:'Die wenigsten Nullen',calc:p=>kniffZeroCount(p),agg:'min'},
  {key:'upperchamp',icon:'🔝',label:'Oberteil-Champion',desc:'Höchste Summe im Oberteil',calc:p=>kniffUpperSum(p)}
];
const KNIFFEL_MILESTONE_DEFS=[
  {key:'bonushunter',icon:'💰',label:'Bonus-Jäger',desc:'Oberteil-Bonus erreicht',check:p=>kniffBonus(p)>0},
  {key:'perfectionist',icon:'🌟',label:'Perfektionist',desc:'Keine einzige Kategorie genullt',check:p=>kniffZeroCount(p)===0}
];
function kniffComputeBadges(){
  const badges=[];
  KNIFFEL_BADGE_DEFS.forEach(def=>{
    const isMin=def.agg==='min';
    let bestP=null,bestVal=isMin?Infinity:0;
    kniffPlayers.forEach(p=>{
      const v=def.calc(p);
      if(isMin?v<bestVal:v>bestVal){bestVal=v;bestP=p;}
    });
    if(bestP&&(isMin||bestVal>0))badges.push({...def,player:bestP,value:bestVal});
  });
  return badges;
}
function kniffComputeMilestones(){
  const out=[];
  kniffPlayers.forEach(p=>{
    KNIFFEL_MILESTONE_DEFS.forEach(def=>{if(def.check(p))out.push({...def,player:p});});
  });
  return out;
}
function kniffBadgeLegendHtml(title,hint,defs){
  return `<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:14px 0 6px">${title}</div>
    <div style="font-size:11px;color:var(--text-3);margin-bottom:8px">${hint}</div>
    ${defs.map(b=>`<div style="display:flex;gap:10px;align-items:center;background:var(--surface);border:0.5px ${b.check?'dashed var(--accent)':'solid var(--divider)'};border-radius:12px;padding:8px 12px;margin-bottom:6px">
      <div style="font-size:18px;flex-shrink:0">${b.icon}</div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">${escHtml(b.label)}</div>
        <div style="font-size:10px;color:var(--text-3)">${escHtml(b.desc)}</div>
      </div>
    </div>`).join('')}`;
}

/* ── Rang-System (wettkampf-ähnliche Rangliste pro Spielername) ── */
const KNIFFEL_RANK_TIERS_DEFAULT=[
  {label:'Bronze',icon:'🥉',color:'#ad6a3d',steps:[{rp:100,icon:'🥉'},{rp:150,icon:'🥉'},{rp:200,icon:'🥉'}]},
  {label:'Silber',icon:'🥈',color:'#9aa0a6',steps:[{rp:250,icon:'🥈'},{rp:300,icon:'🥈'},{rp:350,icon:'🥈'}]},
  {label:'Gold',icon:'🥇',color:'#d4af37',steps:[{rp:400,icon:'🥇'},{rp:450,icon:'🥇'},{rp:500,icon:'🥇'}]},
  {label:'Platin',icon:'💎',color:'#5ec8d8',steps:[{rp:550,icon:'💎'},{rp:600,icon:'💎'},{rp:650,icon:'💎'}]},
  {label:'Diamant',icon:'💠',color:'#7c4dff',steps:[{rp:700,icon:'💠'},{rp:750,icon:'💠'},{rp:800,icon:'💠'}]},
  {label:'Meister',icon:'👑',color:'#ff6f00',steps:[{rp:300,icon:'👑'}]}
];
function kniffTiersAreOldDefault(t){return Array.isArray(t)&&t.length===6&&t.slice(0,5).every(x=>Array.isArray(x.steps)&&x.steps.length===3&&x.steps.every(z=>(z.rp!=null?z.rp:z)===100));}
function kniffRankDivisionLabels(n){
  n=Math.max(1,Math.min(7,+n||3));
  const labels=[];
  for(let i=1;i<=n;i++)labels.push(String(i));
  return labels;
}
const KNIFFEL_RANK_PER_TIER_FALLBACK=300;
function kniffRankNormalizeStep(s,fallbackIcon){
  if(s&&typeof s==='object')return{rp:Math.max(1,+s.rp||100),icon:(s.icon||fallbackIcon||'🏅')};
  return{rp:Math.max(1,+s||100),icon:fallbackIcon||'🏅'};
}
function kniffRankNormalizeTier(t){
  if(!Array.isArray(t.steps)||!t.steps.length){
    const n=Math.max(1,Math.min(7,Math.round(+t.divisions)||3));
    const w=Math.max(10,+t.rp||KNIFFEL_RANK_PER_TIER_FALLBACK);
    t.steps=Array(n).fill(Math.round(w/n));
  }
  t.steps=t.steps.map(s=>kniffRankNormalizeStep(s,t.icon));
  delete t.rp;delete t.divisions;
  return t;
}
let kniffRankTiers=JSON.parse(JSON.stringify(KNIFFEL_RANK_TIERS_DEFAULT));
let kniffLastRankDeltas=null;
function kniffRankTiersLoad(){
  try{
    const s=localStorage.getItem('zf_kniffel_ranktiers');
    const parsed=s?JSON.parse(s):null;
    kniffRankTiers=(Array.isArray(parsed)&&parsed.length>=2&&!kniffTiersAreOldDefault(parsed))?parsed:JSON.parse(JSON.stringify(KNIFFEL_RANK_TIERS_DEFAULT));
  }catch(e){kniffRankTiers=JSON.parse(JSON.stringify(KNIFFEL_RANK_TIERS_DEFAULT));}
  kniffRankTiers.forEach(kniffRankNormalizeTier);
}
function kniffRankTiersSave(){
  try{localStorage.setItem('zf_kniffel_ranktiers',JSON.stringify(kniffRankTiers));}catch(e){}
  kniffRenderRankLadder();
}
function kniffRenderRankLadder(){
  const wrap=document.getElementById('kniffel-rank-ladder');if(!wrap)return;
  let acc=0;
  const rows=[];
  kniffRankTiers.forEach((t,idx)=>{
    const isTop=idx===kniffRankTiers.length-1;
    if(isTop){
      rows.push({icon:t.icon,label:t.label,color:t.color,range:`ab ${acc} PR`});
      return;
    }
    const steps=(Array.isArray(t.steps)&&t.steps.length?t.steps:[{rp:KNIFFEL_RANK_PER_TIER_FALLBACK,icon:t.icon}]).map(s=>kniffRankNormalizeStep(s,t.icon));
    steps.forEach((s,si)=>{
      const from=acc,to=acc+s.rp-1;
      rows.push({icon:s.icon,label:`${t.label} ${si+1}`,color:t.color,range:`${from}–${to} PR`});
      acc+=s.rp;
    });
  });
  wrap.innerHTML=rows.reverse().map(r=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-left:3px solid ${r.color};background:var(--bg);border-radius:6px;margin-bottom:4px">
    <span style="font-size:16px;flex-shrink:0">${r.icon}</span>
    <span style="flex:1;font-size:12px;font-weight:600;color:var(--text)">${escHtml(r.label)}</span>
    <span style="font-size:11px;color:var(--text-3);white-space:nowrap">${r.range}</span>
  </div>`).join('');
}
function kniffRankTierSetField(idx,key,val){
  const t=kniffRankTiers[idx];if(!t)return;
  if(key==='icon')val=(val||'').trim()||'🏅';
  else if(key==='label')val=(val||'').trim()||'Rang';
  t[key]=val;
  kniffRankTiersSave();
}
function kniffRankStepSet(idx,si,field,val){
  const t=kniffRankTiers[idx];if(!t||!Array.isArray(t.steps)||!t.steps[si])return;
  if(field==='icon')t.steps[si].icon=(val||'').trim()||'🏅';
  else t.steps[si].rp=Math.max(10,+val||10);
  kniffRankTiersSave();
}
function kniffRankStepAdd(idx){
  const t=kniffRankTiers[idx];if(!t)return;
  if(!Array.isArray(t.steps))t.steps=[];
  if(t.steps.length>=7)return;
  t.steps.push({rp:100,icon:t.icon||'🏅'});
  kniffRankTiersSave();kniffRenderRankEditor();
}
function kniffRankStepRemove(idx,si){
  const t=kniffRankTiers[idx];if(!t||!Array.isArray(t.steps)||t.steps.length<=1)return;
  t.steps.splice(si,1);
  kniffRankTiersSave();kniffRenderRankEditor();
}
function kniffRankTierAdd(){
  kniffRankTiers.splice(Math.max(0,kniffRankTiers.length-1),0,{label:'Neuer Rang',icon:'🏅',color:'#888888',steps:[{rp:100,icon:'🏅'},{rp:100,icon:'🏅'},{rp:100,icon:'🏅'}]});
  kniffRankTiersSave();kniffRenderRankEditor();
}
function kniffRankTierDelete(idx){
  if(kniffRankTiers.length<=2||!kniffRankTiers[idx])return;
  appConfirm(`Rang „${kniffRankTiers[idx].label}" löschen?`,()=>{
    kniffRankTiers.splice(idx,1);
    kniffRankTiersSave();kniffRenderRankEditor();
  });
}
function kniffRankTiersReset(){
  appConfirm('Ränge auf Standard zurücksetzen?',()=>{
    kniffRankTiers=JSON.parse(JSON.stringify(KNIFFEL_RANK_TIERS_DEFAULT));
    kniffRankTiersSave();kniffRenderRankEditor();showToast('Ränge zurückgesetzt ✓');
  });
}
function kniffRenderRankEditor(){
  const wrap=document.getElementById('kniffel-rank-editor');if(!wrap)return;
  wrap.innerHTML=kniffRankTiers.map((t,idx)=>{
    const isTop=idx===kniffRankTiers.length-1;
    const steps=Array.isArray(t.steps)&&t.steps.length?t.steps:[KNIFFEL_RANK_PER_TIER_FALLBACK];
    const divLabels=kniffRankDivisionLabels(steps.length);
    return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:${isTop?'0':'8px'}">
        <input type="text" value="${escHtml(t.icon)}" onchange="kniffRankTierSetField(${idx},'icon',this.value)" maxlength="4" title="Symbol" style="width:34px;height:34px;border-radius:8px;text-align:center;font-size:16px;padding:0;background:var(--bg);border:0.5px solid var(--divider);color:var(--text)"/>
        <input type="text" value="${escHtml(t.label)}" onchange="kniffRankTierSetField(${idx},'label',this.value)" title="Name" style="flex:1;min-width:100px;padding:7px 9px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px"/>
        <input type="color" value="${t.color}" onchange="kniffRankTierSetField(${idx},'color',this.value)" title="Farbe" style="width:32px;height:30px;padding:0;border:0.5px solid var(--divider);border-radius:6px;cursor:pointer;background:none"/>
        ${isTop?`<span style="font-size:11px;color:var(--text-3);flex-shrink:0">Offenes Ende (Top-Rang)</span>`:''}
        ${kniffRankTiers.length>2?`<button onclick="kniffRankTierDelete(${idx})" title="Rang löschen" style="padding:5px 9px;font-size:11px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer;flex-shrink:0">✕</button>`:''}
      </div>
      ${isTop?'':`<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;padding-left:2px">
        ${steps.map((s,si)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <span style="font-size:9px;color:var(--text-3)">Stufe ${divLabels[si]}</span>
          <div style="display:flex;align-items:center;gap:2px">
            <input type="text" value="${escHtml(s.icon)}" maxlength="4" title="Icon für Stufe ${divLabels[si]}" onchange="kniffRankStepSet(${idx},${si},'icon',this.value)" style="width:26px;height:26px;border-radius:6px;text-align:center;font-size:13px;padding:0;background:var(--bg);border:0.5px solid var(--divider);color:var(--text)"/>
            <input type="number" min="10" step="10" value="${s.rp}" title="PR für Stufe ${divLabels[si]}" oninput="kniffRankStepSet(${idx},${si},'rp',this.value)" style="width:52px;padding:5px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right;font-size:11px"/>
            ${steps.length>1?`<button onclick="kniffRankStepRemove(${idx},${si})" title="Stufe entfernen" style="padding:4px 5px;font-size:9px;border-radius:4px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">✕</button>`:''}
          </div>
        </div>`).join('')}
        ${steps.length<7?`<button onclick="kniffRankStepAdd(${idx})" title="Stufe hinzufügen" style="padding:6px 9px;font-size:11px;border-radius:6px;border:0.5px dashed var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">+ Stufe</button>`:''}
      </div>`}
    </div>`;
  }).join('')+`<button class="timer-btn" onclick="kniffRankTierAdd()" style="padding:7px 14px;font-size:12px">+ Neuer Rang</button>`;
}
function kniffRankInfo(rp){
  rp=Math.max(0,rp||0);
  const tiers=kniffRankTiers.length?kniffRankTiers:KNIFFEL_RANK_TIERS_DEFAULT;
  let acc=0;
  for(let i=0;i<tiers.length-1;i++){
    const rawSteps=Array.isArray(tiers[i].steps)&&tiers[i].steps.length?tiers[i].steps:[{rp:KNIFFEL_RANK_PER_TIER_FALLBACK,icon:tiers[i].icon}];
    const steps=rawSteps.map(s=>kniffRankNormalizeStep(s,tiers[i].icon));
    const width=steps.reduce((a,b)=>a+b.rp,0);
    if(rp<acc+width){
      const rpIntoTier=rp-acc;
      const divLabels=kniffRankDivisionLabels(steps.length);
      let cum=0,divIdx=steps.length-1,rpIntoDivision=0,divWidth=steps[steps.length-1].rp;
      for(let d=0;d<steps.length;d++){
        if(rpIntoTier<cum+steps[d].rp){divIdx=d;rpIntoDivision=rpIntoTier-cum;divWidth=steps[d].rp;break;}
        cum+=steps[d].rp;
      }
      const division=steps.length>1?divLabels[divIdx]:null;
      const divisionIcon=steps[divIdx].icon||tiers[i].icon;
      return{tier:tiers[i],division,divisionIcon,rp,progress:rpIntoDivision/divWidth,label:division?`${tiers[i].label} ${division}`:tiers[i].label};
    }
    acc+=width;
  }
  const topTier=tiers[tiers.length-1];
  return{tier:topTier,division:null,divisionIcon:topTier.icon,rp,progress:1,label:topTier.label};
}
function kniffRankLoad(){try{const s=localStorage.getItem('zf_kniffel_rank');return s?JSON.parse(s):{};}catch(e){return{};}}
function kniffRankSave(data){try{localStorage.setItem('zf_kniffel_rank',JSON.stringify(data));}catch(e){}}
/* ── PR-Formel (Punkte→PR-Schwellen & Platzierungs-Bonus, ebenfalls frei einstellbar) ── */
const KNIFFEL_RANK_FORMULA_DEFAULT={
  thresholds:[{score:300,rp:50},{score:250,rp:40},{score:200,rp:30},{score:150,rp:20},{score:100,rp:10},{score:0,rp:0}],
  firstBonus:50,
  lastPenalty:-50
};
let kniffRankFormula=JSON.parse(JSON.stringify(KNIFFEL_RANK_FORMULA_DEFAULT));
function kniffRankFormulaLoad(){
  try{
    const s=localStorage.getItem('zf_kniffel_rankformula');
    const parsed=s?JSON.parse(s):null;
    kniffRankFormula=(parsed&&Array.isArray(parsed.thresholds)&&parsed.thresholds.length&&!(parsed.firstBonus===20&&parsed.lastPenalty===-15&&parsed.thresholds[0]&&parsed.thresholds[0].rp===40))?parsed:JSON.parse(JSON.stringify(KNIFFEL_RANK_FORMULA_DEFAULT));
  }catch(e){kniffRankFormula=JSON.parse(JSON.stringify(KNIFFEL_RANK_FORMULA_DEFAULT));}
}
function kniffRankFormulaSave(){try{localStorage.setItem('zf_kniffel_rankformula',JSON.stringify(kniffRankFormula));}catch(e){}}
function kniffRankThresholdSet(idx,key,val){
  const t=kniffRankFormula.thresholds[idx];if(!t)return;
  t[key]=Math.round(+val||0);
  kniffRankFormulaSave();
}
function kniffRankThresholdAdd(){
  kniffRankFormula.thresholds.push({score:0,rp:0});
  kniffRankFormulaSave();kniffRenderRankFormulaEditor();
}
function kniffRankThresholdDelete(idx){
  if(kniffRankFormula.thresholds.length<=1)return;
  kniffRankFormula.thresholds.splice(idx,1);
  kniffRankFormulaSave();kniffRenderRankFormulaEditor();
}
function kniffRankFormulaSetBonus(key,val){
  kniffRankFormula[key]=Math.round(+val||0);
  kniffRankFormulaSave();
}
function kniffRankFormulaReset(){
  appConfirm('PR-Formel auf Standard zurücksetzen?',()=>{
    kniffRankFormula=JSON.parse(JSON.stringify(KNIFFEL_RANK_FORMULA_DEFAULT));
    kniffRankFormulaSave();kniffRenderRankFormulaEditor();showToast('PR-Formel zurückgesetzt ✓');
  });
}
function kniffRenderRankFormulaEditor(){
  const wrap=document.getElementById('kniffel-rank-formula-editor');if(!wrap)return;
  const sorted=kniffRankFormula.thresholds.map((t,i)=>({...t,i})).sort((a,b)=>b.score-a.score);
  wrap.innerHTML=`
    <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Punktzahl → PR</div>
    ${sorted.map(t=>`<div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px;margin-bottom:6px;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">ab Punktzahl<input type="number" step="10" value="${t.score}" oninput="kniffRankThresholdSet(${t.i},'score',this.value)" style="width:70px;padding:6px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right"/></label>
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">→ PR<input type="number" step="5" value="${t.rp}" oninput="kniffRankThresholdSet(${t.i},'rp',this.value)" style="width:60px;padding:6px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right"/></label>
      ${kniffRankFormula.thresholds.length>1?`<button onclick="kniffRankThresholdDelete(${t.i})" title="Schwelle löschen" style="margin-left:auto;padding:5px 9px;font-size:11px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">✕</button>`:''}
    </div>`).join('')}
    <button class="timer-btn" onclick="kniffRankThresholdAdd()" style="padding:7px 14px;font-size:12px;margin-bottom:16px">+ Schwelle</button>
    <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Platzierungs-Bonus (bei mehreren Spielern)</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">🥇 Erster Platz<input type="number" step="5" value="${kniffRankFormula.firstBonus}" oninput="kniffRankFormulaSetBonus('firstBonus',this.value)" style="width:60px;padding:6px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right"/></label>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text);background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px">🐌 Letzter Platz<input type="number" step="5" value="${kniffRankFormula.lastPenalty}" oninput="kniffRankFormulaSetBonus('lastPenalty',this.value)" style="width:60px;padding:6px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right"/></label>
    </div>
    <button class="timer-btn" onclick="kniffRankFormulaReset()" style="padding:7px 14px;font-size:12px">↩ PR-Formel zurücksetzen</button>
  `;
}
function kniffRankScoreBaseRp(score){
  const sorted=[...kniffRankFormula.thresholds].sort((a,b)=>b.score-a.score);
  for(const t of sorted)if(score>=t.score)return t.rp;
  return sorted.length?sorted[sorted.length-1].rp:0;
}
function kniffRankApplyResults(){
  const humans=kniffPlayers.filter(p=>!p.isAI&&(p.name||'').trim());
  if(!humans.length)return null;
  const rankData=kniffRankLoad();
  const sorted=[...kniffPlayers].sort((a,b)=>kniffGrandTotal(b)-kniffGrandTotal(a));
  const topScore=kniffGrandTotal(sorted[0]);
  const bottomScore=kniffGrandTotal(sorted[sorted.length-1]);
  const multiplayer=kniffPlayers.length>1;
  const hof=kniffHallOfFameLoad();
  // Phase 1: neue Kniffel-Ränge berechnen und den Vorher-Gesamtrang (spielübergreifend) merken,
  // BEVOR irgendetwas gespeichert wird.
  const perPlayer=humans.map(p=>{
    const name=p.name.trim();
    const score=kniffGrandTotal(p);
    let delta=kniffRankScoreBaseRp(score);
    if(multiplayer){
      if(score===topScore)delta+=kniffRankFormula.firstBonus;
      else if(score===bottomScore)delta+=kniffRankFormula.lastPenalty;
    }
    const before=rankData[name]||0;
    const overallBefore=typeof zcOverallTotal==='function'?zcOverallTotal(name):before;
    const after=Math.max(0,before+delta);
    rankData[name]=after;
    return{name,before,after,overallBefore};
  });
  // Phase 2: die neuen Kniffel-Ränge speichern, DANACH erst den Gesamtrang erneut lesen –
  // sonst liest zcOverallTotal noch den alten Stand und die angezeigte PR-Änderung ist 0.
  kniffRankSave(rankData);
  const deltas={};
  perPlayer.forEach(({name,before,after,overallBefore})=>{
    const overallAfter=typeof zcOverallTotal==='function'?zcOverallTotal(name):after;
    // Angezeigt wird der Gesamtrang (spielübergreifend), nicht der Rang nur in Kniffel.
    deltas[name]={name,delta:overallAfter-overallBefore,before:overallBefore,after:overallAfter,gameDelta:after-before,rankBefore:smRankInfo('zentrale',overallBefore),rankAfter:smRankInfo('zentrale',overallAfter)};
    const rec=hof[name];
    if(rec){
      if(rec.prEarned==null)rec.prEarned=before+kniffSeasonFinalSum(name);
      if(rec.prLost==null)rec.prLost=0;
      rec.prEarned+=Math.max(0,after-before);
      rec.prLost+=Math.max(0,before-after);
      rec.peakPr=Math.max(rec.peakPr||0,after);
    }
  });
  kniffHallOfFameSave(hof);
  return deltas;
}
function kniffRankBadgeHtml(rp,compact){
  const info=kniffRankInfo(rp);
  const pct=Math.round((info.progress!=null?info.progress:1)*100);
  return`<div style="display:flex;align-items:center;gap:6px">
    <span style="font-size:${compact?14:16}px;flex-shrink:0">${info.divisionIcon||info.tier.icon}</span>
    <span style="font-size:11px;font-weight:700;color:${info.tier.color};white-space:nowrap">${escHtml(info.label)}</span>
    <div style="flex:1;height:6px;background:var(--divider);border-radius:3px;overflow:hidden;min-width:40px;max-width:120px">
      <div style="height:100%;width:${pct}%;background:${info.tier.color}"></div>
    </div>
    <span style="font-size:10px;color:var(--text-3);white-space:nowrap;flex-shrink:0">${rp} PR</span>
  </div>`;
}
/* ── Saisons (Ränge periodisch zurücksetzen, alte Ergebnisse archivieren) ── */
const KNIFFEL_SEASON_DEFAULT={number:1,startedAt:0,autoResetDays:0};
let kniffSeason=JSON.parse(JSON.stringify(KNIFFEL_SEASON_DEFAULT));
function kniffSeasonLoad(){
  try{
    const s=localStorage.getItem('zf_kniffel_season');
    kniffSeason=s?JSON.parse(s):null;
  }catch(e){kniffSeason=null;}
  if(!kniffSeason||!kniffSeason.startedAt){
    kniffSeason=Object.assign({},KNIFFEL_SEASON_DEFAULT,{startedAt:Date.now()});
    kniffSeasonSave();
  }
  kniffSeasonCheckAutoReset();
}
function kniffSeasonSave(){try{localStorage.setItem('zf_kniffel_season',JSON.stringify(kniffSeason));}catch(e){}}
function kniffSeasonHistoryLoad(){try{const s=localStorage.getItem('zf_kniffel_seasonhistory');const arr=s?JSON.parse(s):[];return Array.isArray(arr)?arr:[];}catch(e){return[];}}
function kniffSeasonHistorySave(h){try{localStorage.setItem('zf_kniffel_seasonhistory',JSON.stringify(h));}catch(e){}}
function kniffSeasonArchiveAndReset(auto,quiet){
  const rankData=kniffRankLoad();
  const names=Object.keys(rankData);
  if(names.length){
    const results=names.map(name=>{
      const info=kniffRankInfo(rankData[name]);
      return{name,rp:rankData[name],label:info.label,icon:info.divisionIcon||info.tier.icon,color:info.tier.color};
    }).sort((a,b)=>b.rp-a.rp);
    const history=kniffSeasonHistoryLoad();
    history.unshift({season:kniffSeason.number,endedAt:Date.now(),results});
    kniffSeasonHistorySave(history);
  }
  kniffRankSave({});
  const newNumber=kniffSeason.number+1;
  kniffSeason={number:newNumber,startedAt:Date.now(),autoResetDays:kniffSeason.autoResetDays};
  kniffSeasonSave();
  kniffRenderHallOfFame();
  kniffRenderSeasonPanel();
  kniffRenderSeasonHistory();
  if(!quiet)showToast(`🏁 Saison ${newNumber} gestartet${auto?' (automatisch)':''} ✓`);
}
function kniffSeasonCheckAutoReset(){
  if(!kniffSeason.autoResetDays||kniffSeason.autoResetDays<=0)return;
  const elapsedDays=(Date.now()-kniffSeason.startedAt)/86400000;
  if(elapsedDays>=kniffSeason.autoResetDays)kniffSeasonArchiveAndReset(true);
}
function kniffSeasonSetAutoResetDays(v){
  kniffSeason.autoResetDays=Math.max(0,Math.round(+v||0));
  kniffSeasonSave();
}
function kniffSeasonManualReset(){
  appConfirm(`Neue Saison starten? Alle aktuellen Ränge werden als „Saison ${kniffSeason.number}" archiviert und auf 0 PR zurückgesetzt.`,()=>{
    kniffSeasonArchiveAndReset(false);
  });
}
function kniffRenderSeasonPanel(){
  const wrap=document.getElementById('kniffel-season-panel');if(!wrap)return;
  const daysElapsed=Math.floor((Date.now()-kniffSeason.startedAt)/86400000);
  wrap.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;margin-bottom:16px">
    <div style="font-size:12px;color:var(--text)">🏁 <b>Saison ${kniffSeason.number}</b> · läuft seit ${daysElapsed} Tag${daysElapsed===1?'':'en'}</div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-3)">Auto-Reset nach<input type="number" min="0" step="1" value="${kniffSeason.autoResetDays}" title="Tage bis zum automatischen Saison-Reset (0 = deaktiviert)" oninput="kniffSeasonSetAutoResetDays(this.value)" style="width:50px;padding:5px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);text-align:right"/>Tagen</label>
      <button class="timer-btn" onclick="kniffSeasonManualReset()" style="padding:6px 12px;font-size:11px">🏁 Neue Saison starten</button>
    </div>
  </div>`;
}
function kniffRenderSeasonHistory(){
  const wrap=document.getElementById('kniffel-season-history');if(!wrap)return;
  const history=kniffSeasonHistoryLoad();
  if(!history.length){wrap.innerHTML=`<div style="font-size:11px;color:var(--text-3);padding:4px 0">Noch keine abgeschlossene Saison.</div>`;return;}
  wrap.innerHTML=history.map(h=>`<div style="background:var(--bg);border-radius:8px;padding:8px 10px;margin-bottom:6px">
    <div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:4px">Saison ${h.season} · beendet am ${new Date(h.endedAt).toLocaleDateString('de-DE')}</div>
    ${h.results.slice(0,5).map((r,i)=>`<div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:2px 0">
      <span style="color:var(--text-3);width:14px;flex-shrink:0">${i+1}.</span>
      <span style="flex-shrink:0">${r.icon}</span>
      <span style="flex:1;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.name)}</span>
      <span style="color:${r.color};font-weight:600;white-space:nowrap">${escHtml(r.label)}</span>
    </div>`).join('')}
  </div>`).join('');
}

/* ── Spielerprofil (alle Statistiken zu einem Namen) ── */
let kniffProfileName='';
function kniffSeasonFinalSum(name){
  return kniffSeasonHistoryLoad().reduce((s,h)=>{const r=(h.results||[]).find(x=>x.name===name);return s+(r?r.rp:0);},0);
}
function kniffProfileFindName(q){
  q=(q||'').trim().toLowerCase();if(!q)return null;
  return Object.keys(kniffHallOfFameLoad()).find(n=>n.toLowerCase()===q)||null;
}
function kniffProfileSearch(val){kniffProfileName=(val||'').trim();kniffRenderProfile();}
function kniffOpenProfile(name){if(!name)return;if(typeof goTo==='function')goTo('zentrale');if(typeof zcOpenProfile==='function')zcOpenProfile(name);}
function kniffSparklineSvg(vals){
  if(vals.length<2)return'';
  const w=300,h=50,min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1)*w).toFixed(1)},${(h-4-((v-min)/range)*(h-8)).toFixed(1)}`).join(' ');
  return`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:50px"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}
function kniffProfileTile(label,value,sub){
  return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px">
    <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em">${label}</div>
    <div style="font-size:18px;font-weight:700;color:var(--text);margin-top:2px">${value}</div>
    ${sub?`<div style="font-size:10px;color:var(--text-3);margin-top:2px">${sub}</div>`:''}
  </div>`;
}
function kniffRenderProfile(){
  const hof=kniffHallOfFameLoad();
  const dl=document.getElementById('kniffel-profile-names');
  if(dl)dl.innerHTML=Object.keys(hof).map(n=>`<option value="${escHtml(n)}"></option>`).join('');
  const inp=document.getElementById('kniffel-profile-input');
  if(inp&&document.activeElement!==inp)inp.value=kniffProfileName;
  const wrap=document.getElementById('kniffel-profile-result');if(!wrap)return;
  const q=(kniffProfileName||'').trim();
  if(!q){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Spielernamen eingeben (oder in der Hall of Fame auf einen Namen tippen), um alle Statistiken zu sehen.</div>`;return;}
  const name=kniffProfileFindName(q);
  if(!name){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Kein Spieler mit dem Namen „${escHtml(q)}" gefunden – Statistiken entstehen nach der ersten abgeschlossenen Partie.</div>`;return;}
  const rec=hof[name];
  const rankData=kniffRankLoad();
  const rp=rankData[name]||0;
  const seasons=kniffSeasonHistoryLoad();
  const games=rec.games||0,wins=rec.wins||0;
  const winRate=games?Math.round(wins/games*100):0;
  const history=Array.isArray(rec.history)?rec.history:[];
  const mp=history.filter(h=>h.n>1);
  const mpWins=mp.filter(h=>h.won).length;
  const mpRate=mp.length?Math.round(mpWins/mp.length*100)+'%':'–';
  const seasonRows=[];
  seasons.forEach(h=>{const r=(h.results||[]).find(x=>x.name===name);if(r)seasonRows.push({season:h.season,rp:r.rp,label:r.label,icon:r.icon,color:r.color});});
  const prEarned=rec.prEarned!=null?rec.prEarned:rp+seasonRows.reduce((s,r)=>s+r.rp,0);
  const prLost=rec.prLost||0;
  const peak=Math.max(rec.peakPr||0,rp,...seasonRows.map(r=>r.rp));
  const peakInfo=kniffRankInfo(peak);
  const cupsPlayed=kniffCupHistoryLoad().filter(c=>(c.players||[]).some(p=>p.name===name)).length;
  const last10=history.slice(-10);
  const form=last10.length?last10.map(h=>`<span title="${h.score} Pkt." style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;font-size:10px;font-weight:700;color:#fff;background:${h.won?'#43a047':'#e53935'}">${h.won?'S':'N'}</span>`).join(' '):'<span style="font-size:11px;color:var(--text-3)">Noch keine Daten</span>';
  const chips=(rec.cupWins?`<span style="font-size:10px;background:var(--surface);border:0.5px solid var(--accent);border-radius:12px;padding:2px 7px;color:var(--accent);font-weight:700">🏆 Cup-Sieger ${rec.cupWins}×</span>`:'')+kniffHofChipsHtml(rec.badges,KNIFFEL_BADGE_DEFS,false)+kniffHofChipsHtml(rec.milestones,KNIFFEL_MILESTONE_DEFS,true);
  const fmtDate=t=>t?new Date(t).toLocaleDateString('de-DE'):'–';
  const seasonList=[{season:kniffSeason.number,current:true,rp},...seasonRows.map(r=>({season:r.season,rp:r.rp}))].map(s=>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg);border-radius:6px;margin-bottom:4px">
      <span style="font-size:11px;color:var(--text-3);width:62px;flex-shrink:0">Saison ${s.season}${s.current?' ⏳':''}</span>
      <span style="flex:1;font-size:12px;color:var(--text)">PR aus Kniffel</span>
      <span style="font-size:11px;font-weight:600;color:var(--text-2)">${s.rp} PR</span>
    </div>`
  ).join('');
  wrap.innerHTML=`
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">${escHtml(name)}</div>
      ${typeof zcOverallBadge==='function'?zcOverallBadge(name,false):kniffRankBadgeHtml(rp,false)}
      <div style="font-size:11px;color:var(--text-3);margin-top:6px">Beste PR in Kniffel: <b>${peak}</b></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-bottom:14px">
      ${kniffProfileTile('Spiele',games,`${wins} Siege · ${games-wins} Niederlagen`)}
      ${kniffProfileTile('Siegchance',winRate+'%',`Mehrspieler: ${mpRate}`)}
      ${kniffProfileTile('Beste Siegesserie',rec.bestStreak||0,`Aktuell: ${rec.streak||0}`)}
      ${kniffProfileTile('PR verdient (gesamt)',prEarned,`verloren: ${prLost} · netto ${prEarned-prLost}`)}
      ${kniffProfileTile('Bester Score',rec.bestScore||0,`schlechtester: ${rec.minScore!=null?rec.minScore:'–'}`)}
      ${kniffProfileTile('Ø Score',games?Math.round((rec.totalScore||0)/games):0,`gesamt: ${rec.totalScore||0}`)}
      ${kniffProfileTile('Kniffel gewürfelt',rec.kniffelCount||0,'')}
      ${kniffProfileTile('Cups',rec.cupWins||0,`gewonnen · ${cupsPlayed} gespielt`)}
      ${kniffProfileTile('Zuletzt gespielt',fmtDate(rec.lastPlayed),'')}
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Form (letzte ${last10.length||10} Spiele)</div>
    <div style="margin-bottom:14px">${form}</div>
    ${history.length>=2?`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Punkteverlauf (letzte ${Math.min(30,history.length)} Spiele)</div>
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 10px;margin-bottom:14px">${kniffSparklineSvg(history.slice(-30).map(h=>h.score))}</div>`:''}
    <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">PR-Beitrag pro Saison (Kniffel)</div>
    <div style="margin-bottom:14px">${seasonList}</div>
    ${chips?`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Auszeichnungen</div><div style="display:flex;flex-wrap:wrap;gap:4px">${chips}</div>`:''}
  `;
}

/* ── Init / Setup ── */
function kniffInit(){
  kniffLoadRules();
  kniffLoadTournament();
  kniffLoadCup();
  kniffRankTiersLoad();
  kniffRankFormulaLoad();
  kniffSeasonLoad();
  if(!kniffPlayersSetup.length){
    kniffPlayersSetup=[
      {name:'Gast',color:KNIFFEL_PLAYER_COLORS[0],avatar:KNIFFEL_AVATARS[0],isAI:false},
      {name:'Gast 2',color:KNIFFEL_PLAYER_COLORS[1],avatar:KNIFFEL_AVATARS[1],isAI:false}
    ];
    try{if(typeof zcp==='function'&&zcp().player)zcPrefillGames(zcp().player);}catch(e){}
  }
  kniffShowView('play');
  kniffRenderPlayerSetup();
  let restored=false;
  if(!kniffPlayers.length){restored=kniffLoadGame();}
  // Sicherheitsnetz: ein unvollständiger/beschädigter Spielstand darf nie beide Panels
  // gleichzeitig oder ein leeres Spiel-Panel zeigen - dann lieber zurück zum Setup.
  if(kniffPlayers.length&&(!Array.isArray(kniffDice)||kniffPlayers.some(p=>!p||!p.scores))){
    kniffPlayers=[];kniffClearSavedGame();restored=false;
  }
  if(kniffPlayers.length&&!kniffGameOver){
    const sp=document.getElementById('kniffel-setup-panel');if(sp)sp.style.display='none';
    const gp=document.getElementById('kniffel-game-panel');if(gp)gp.style.display='';
    kniffRenderAll();
    if(restored)showToast('Spielstand wiederhergestellt ✓');
  } else {
    const sp=document.getElementById('kniffel-setup-panel');if(sp)sp.style.display='block';
    const gp=document.getElementById('kniffel-game-panel');if(gp)gp.style.display='none';
  }
}
let kniffColorPickerFor=null;
function kniffNormNames(){
  if(typeof zcNormAccount!=='function')return;
  const taken=[];
  kniffPlayersSetup.forEach(p=>{
    if(p.isAI)return;
    const n=zcNormAccount(p.name,taken);
    if(n!==p.name){
      p.name=n;const l=zcAccountLook(n);
      if(l){if(!kniffPlayersSetup.some(q=>q!==p&&q.avatar===l.avatar))p.avatar=l.avatar;if(!kniffPlayersSetup.some(q=>q!==p&&q.color===l.color))p.color=l.color;}
    }
    taken.push(p.name);
  });
}
function kniffRenderPlayerSetup(){
  const wrap=document.getElementById('kniffel-player-rows');if(!wrap)return;
  kniffNormNames();
  wrap.innerHTML=kniffPlayersSetup.map((p,i)=>`<div style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;gap:8px;align-items:center">
      <input type="text" value="${escHtml(p.avatar)}" onchange="kniffSetupAvatar(${i},this.value)" maxlength="8" title="Emoji eingeben – Windows: Win+. bzw. Win+; · Mac: Cmd+Ctrl+Leertaste öffnet die Emoji-Auswahl" style="width:26px;height:26px;border-radius:50%;background:var(--bg);flex-shrink:0;border:2px solid var(--divider);cursor:text;padding:0;font-size:14px;line-height:1;text-align:center"/>
      <button onclick="kniffToggleColorPicker(${i})" title="Farbe ändern" style="width:22px;height:22px;border-radius:50%;background:${p.color};flex-shrink:0;border:2px solid var(--divider);cursor:pointer;padding:0"></button>
      ${p.isAI||typeof zcAccountSelect!=='function'?`<input type="text" value="${escHtml(p.name)}" onchange="kniffSetupName(${i},this.value)" style="flex:1;padding:8px 10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px"/>`:zcAccountSelect(p.name,kniffPlayersSetup.filter((q,j)=>j!==i&&!q.isAI).map(q=>q.name),`kniffSetupName(${i},this.value)`,{style:'flex:1;padding:8px 10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px'})}
      <button onclick="kniffToggleAI(${i})" title="${p.isAI?'KI-Spieler – klicken für Mensch':'Mensch – klicken für KI-Spieler'}" style="padding:7px 10px;font-size:12px;border-radius:8px;border:0.5px solid var(--divider);background:${p.isAI?'var(--accent)':'var(--bg)'};color:${p.isAI?'#fff':'var(--text)'};cursor:pointer;flex-shrink:0">🤖${p.isAI?' KI':''}</button>
    </div>
    ${kniffColorPickerFor===i?`<div style="display:flex;flex-direction:column;gap:8px;padding:2px 0 4px 30px">
      <div style="display:flex;gap:7px;flex-wrap:wrap">
      ${KNIFFEL_PLAYER_COLORS.map(c=>{
        const takenBy=kniffPlayersSetup.findIndex((pp,ii)=>ii!==i&&pp.color===c);
        const disabled=takenBy>=0;
        return `<button ${disabled?'disabled':''} onclick="kniffSetupColor(${i},'${c}')" title="${disabled?'Bereits vergeben':c}" style="width:22px;height:22px;border-radius:50%;background:${c};border:${c===p.color?'2px solid var(--text)':'2px solid transparent'};cursor:${disabled?'not-allowed':'pointer'};padding:0;opacity:${disabled?'0.25':'1'}"></button>`;
      }).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="color" value="${p.color}" onchange="kniffSetupColorHex(${i},this.value)" title="Eigene Farbe wählen" style="width:32px;height:28px;padding:0;border:0.5px solid var(--divider);border-radius:6px;cursor:pointer;background:none"/>
        <input type="text" value="${p.color}" onchange="kniffSetupColorHex(${i},this.value)" placeholder="#RRGGBB" maxlength="7" style="width:90px;padding:6px 8px;background:var(--bg);border:0.5px solid var(--divider);border-radius:6px;color:var(--text);font-size:12px;font-family:monospace"/>
      </div>
    </div>`:''}
  </div>`).join('');
  kniffRenderTournamentSetupUI();
  kniffRenderCupSetupUI();
}
function kniffToggleColorPicker(i){kniffColorPickerFor=kniffColorPickerFor===i?null:i;kniffRenderPlayerSetup();}
function kniffSetupColor(i,color){
  if(kniffPlayersSetup.some((pp,ii)=>ii!==i&&pp.color===color))return;
  kniffPlayersSetup[i].color=color;kniffColorPickerFor=null;kniffRenderPlayerSetup();
}
function kniffSetupColorHex(i,val){
  let v=(val||'').trim();
  if(v&&!v.startsWith('#'))v='#'+v;
  v=v.toLowerCase();
  if(!/^#[0-9a-f]{6}$/.test(v)){showToast('Ungültiger Hex-Code (Format #RRGGBB)');kniffRenderPlayerSetup();return;}
  if(kniffPlayersSetup.some((pp,ii)=>ii!==i&&pp.color===v)){showToast('Farbe bereits vergeben');kniffRenderPlayerSetup();return;}
  kniffPlayersSetup[i].color=v;kniffRenderPlayerSetup();
}
function kniffSetupName(i,v){
  const p=kniffPlayersSetup[i];
  if(v==='__new'&&typeof zcWhoCreate==='function'){zcWhoCreate(n=>kniffSetupName(i,n));kniffRenderPlayerSetup();return;}
  p.name=(v||'').trim()||(p.isAI?'KI':zcGuestName([]));
  if(!p.isAI){
    const l=typeof zcAccountLook==='function'?zcAccountLook(p.name):null;
    if(l){if(!kniffPlayersSetup.some(q=>q!==p&&q.avatar===l.avatar))p.avatar=l.avatar;if(!kniffPlayersSetup.some(q=>q!==p&&q.color===l.color))p.color=l.color;}
    kniffRenderPlayerSetup();
  }
}
function kniffSetupAvatar(i,val){
  const v=(val||'').trim();
  if(!v){kniffRenderPlayerSetup();return;}
  if(kniffPlayersSetup.some((pp,ii)=>ii!==i&&pp.avatar===v)){showToast('Emoji bereits vergeben');kniffRenderPlayerSetup();return;}
  kniffPlayersSetup[i].avatar=v;kniffRenderPlayerSetup();
}
function kniffToggleAI(i){kniffPlayersSetup[i].isAI=!kniffPlayersSetup[i].isAI;kniffRenderPlayerSetup();}
function kniffAddPlayer(){
  kniffColorPickerFor=null;
  const used=kniffPlayersSetup.map(p=>p.color);
  const color=KNIFFEL_PLAYER_COLORS.find(c=>!used.includes(c))||KNIFFEL_PLAYER_COLORS[kniffPlayersSetup.length%KNIFFEL_PLAYER_COLORS.length];
  const avatar=KNIFFEL_AVATARS[kniffPlayersSetup.length%KNIFFEL_AVATARS.length];
  kniffPlayersSetup.push({name:zcGuestName(kniffPlayersSetup.map(q=>q.name)),color,avatar,isAI:false});
  kniffRenderPlayerSetup();
}
function kniffRemovePlayer(){if(kniffPlayersSetup.length<=1)return;kniffColorPickerFor=null;kniffPlayersSetup.pop();kniffRenderPlayerSetup();}

/* ── Spielstart ── */
function kniffStartGame(){
  kniffPlayers=kniffPlayersSetup.map(p=>{
    const scores={};KNIFFEL_CATEGORIES.forEach(c=>scores[c.key]=null);
    return{name:p.name,color:p.color,avatar:p.avatar,isAI:!!p.isAI,scores,kniffelBonus:0,kniffelRollCount:0};
  });
  kniffTurn=0;kniffDice=[1,1,1,1,1];kniffHeld=[false,false,false,false,false];kniffRollsLeft=kniffRules.rollsPerTurn;kniffGameOver=false;kniffLog=[];kniffUndoSnapshot=null;
  if(kniffPlayersSetup.length===2){
    if(!kniffTournament&&kniffTournamentSetup.enabled){
      kniffCup=null;kniffSaveCup();
      kniffTournament={bo:kniffTournamentSetup.bo,target:Math.ceil(kniffTournamentSetup.bo/2),wins:[0,0],round:1,names:[kniffPlayers[0].name,kniffPlayers[1].name],done:false};
      kniffSaveTournament();
    } else if(kniffTournament&&!kniffTournament.done){
      kniffTournament.round++;
      kniffSaveTournament();
    }
  }
  if(!kniffCup&&kniffCupSetup.enabled){
    kniffTournament=null;kniffSaveTournament();
    kniffCup={rounds:kniffCupSetup.rounds,round:1,done:false,players:kniffPlayers.map(p=>({name:p.name,color:p.color,avatar:p.avatar,total:0,scores:[]}))};
    kniffSaveCup();
  } else if(kniffCup&&!kniffCup.done){
    kniffCup.round++;
    kniffSaveCup();
  }
  if(typeof rplBegin==='function')rplBegin('kniffel');
  kniffLogAdd('🎲 Spiel gestartet mit '+kniffPlayers.length+' Spieler'+(kniffPlayers.length===1?'':'n')+'.');
  const sp=document.getElementById('kniffel-setup-panel');if(sp)sp.style.display='none';
  const gp=document.getElementById('kniffel-game-panel');if(gp)gp.style.display='';
  kniffRenderAll();
}
function kniffAbandonGame(){
  appConfirm('Aktuelles Spiel beenden?',()=>{
    clearTimeout(kniffAiTimer);
    kniffPlayers=[];kniffGameOver=false;
    kniffTournament=null;kniffSaveTournament();
    kniffCup=null;kniffSaveCup();
    kniffClearSavedGame();
    const overlay=document.getElementById('kniffel-modal-overlay');if(overlay)overlay.style.display='none';
    const sp=document.getElementById('kniffel-setup-panel');if(sp)sp.style.display='block';
    const gp=document.getElementById('kniffel-game-panel');if(gp)gp.style.display='none';
  });
}

/* ── Speichern/Laden ── */
function kniffSerializeState(){
  return{players:kniffPlayers,turn:kniffTurn,dice:kniffDice,held:kniffHeld,rollsLeft:kniffRollsLeft,gameOver:kniffGameOver,log:kniffLog};
}
function kniffApplyState(st){
  kniffPlayers=st.players||[];kniffTurn=st.turn||0;kniffDice=st.dice||[1,1,1,1,1];
  kniffHeld=st.held||[false,false,false,false,false];kniffRollsLeft=st.rollsLeft!=null?st.rollsLeft:3;
  kniffGameOver=!!st.gameOver;kniffLog=st.log||[];
}
function kniffSaveGame(){
  if(!kniffPlayers.length)return;
  try{localStorage.setItem('zf_kniffel_savegame',JSON.stringify(kniffSerializeState()));}catch(e){}
}
function kniffLoadGame(){
  try{
    const s=localStorage.getItem('zf_kniffel_savegame');if(!s)return false;
    const st=JSON.parse(s);
    if(!st||!Array.isArray(st.players)||!st.players.length)return false;
    kniffApplyState(st);
    return true;
  }catch(e){return false;}
}
function kniffClearSavedGame(){try{localStorage.removeItem('zf_kniffel_savegame');}catch(e){}}

/* ── Spielzug ── */
function kniffLogAdd(msg){
  kniffLog.unshift(msg);if(kniffLog.length>60)kniffLog.pop();
  kniffRenderLog();
}
let kniffHint=null;
function kniffHintCompute(){
  const p=kniffPlayers[kniffTurn];
  if(kniffRollsLeft===kniffRules.rollsPerTurn)return{text:'Würfle zuerst – dann zeige ich dir den besten Zug.'};
  const jokerActive=kniffJokerActive(p);
  const open=KNIFFEL_CATEGORIES.filter(c=>p.scores[c.key]==null);
  let best=null,bs=-1;
  open.forEach(c=>{const sc=kniffelScoreFor(c.key,kniffDice,jokerActive);if(sc>bs){bs=sc;best=c;}});
  const strong={kniffel:50,grossestrasse:40,kleinestrasse:30,fullhouse:25};
  if(kniffRollsLeft===0||(best&&strong[best.key]&&bs>=strong[best.key])){
    const key=kniffAiPickCategory('hard');
    const c=KNIFFEL_CATEGORIES.find(x=>x.key===key);
    const sc=kniffelScoreFor(key,kniffDice,jokerActive);
    return{pick:key,text:`Trag „${c.label}" ein (${sc} Punkte)${sc===0?' – so verlierst du am wenigsten':''}.`};
  }
  const hold=kniffAiDecideHold('hard');
  if(!hold.some(Boolean))return{hold,text:`Alle Würfel neu würfeln (${kniffRollsLeft} Wurf${kniffRollsLeft===1?'':'e'} übrig).`};
  return{hold,text:`Halte ${kniffDice.filter((d,i)=>hold[i]).join(' · ')} (gelb markiert) und würfle den Rest neu.`};
}
function kniffShowHint(){
  if(kniffGameOver||kniffRolling)return;
  const p=kniffPlayers[kniffTurn];if(!p||p.isAI)return;
  kniffHint=kniffHintCompute();
  kniffRenderTurnInfo();kniffRenderScorecard();
}
function kniffRoll(){
  if(kniffGameOver||kniffRollsLeft<=0||kniffRolling||kniffHeld.every(h=>h))return;
  const p=kniffPlayers[kniffTurn];if(p.isAI)return;
  kniffHint=null;
  kniffUndoSnapshot={dice:[...kniffDice],held:[...kniffHeld],rollsLeft:kniffRollsLeft};
  kniffPlayRollAnimation(()=>{
    for(let i=0;i<5;i++){if(!kniffHeld[i])kniffDice[i]=1+Math.floor(Math.random()*6);}
    kniffRollsLeft--;
    kniffLogAdd(`🎲 ${p.name} würfelt: ${kniffDice.join(', ')}${kniffRollsLeft>0?` (noch ${kniffRollsLeft}×)`:''}`);
    kniffRenderAll();
  });
}
function kniffUndoRoll(){
  sfx('undo');
  kniffHint=null;
  if(!kniffUndoSnapshot||kniffGameOver||kniffRolling)return;
  const p=kniffPlayers[kniffTurn];if(p.isAI)return;
  kniffDice=[...kniffUndoSnapshot.dice];
  kniffHeld=[...kniffUndoSnapshot.held];
  kniffRollsLeft=kniffUndoSnapshot.rollsLeft;
  kniffUndoSnapshot=null;
  kniffLogAdd(`↩️ ${p.name} macht den letzten Wurf rückgängig.`);
  kniffRenderAll();
}
function kniffPlayRollAnimation(done){
  sfx('dice');
  const wrap=document.getElementById('kniffel-dice');
  if(!wrap){done();return;}
  kniffRolling=true;
  let frame=0;
  const frames=5;
  const iv=setInterval(()=>{
    frame++;
    const tempDice=kniffDice.map((v,i)=>kniffHeld[i]?v:1+Math.floor(Math.random()*6));
    wrap.innerHTML=`<style>@keyframes kniffShake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}</style>`
      +tempDice.map((v,i)=>{
        const html=kniffDiceFaceHtml(v,i,kniffHeld[i],false);
        return kniffHeld[i]?html:html.replace('style="','style="animation:kniffShake 0.12s ease-in-out;');
      }).join('');
    if(frame>=frames){clearInterval(iv);kniffRolling=false;done();}
  },70);
}
function kniffToggleHold(i){
  sfx('click');
  if(kniffGameOver||kniffRollsLeft===kniffRules.rollsPerTurn)return;
  const p=kniffPlayers[kniffTurn];if(p.isAI)return;
  kniffHeld[i]=!kniffHeld[i];
  kniffRenderTurnInfo();
}
function kniffPreviewScore(key){const p=kniffPlayers[kniffTurn];return kniffelScoreFor(key,kniffDice,kniffJokerActive(p));}
const KNIFFEL_PROB_CATS=[
  {key:'dreierpasch',label:'3er-Pasch'},
  {key:'viererpasch',label:'4er-Pasch'},
  {key:'fullhouse',label:'Full House'},
  {key:'kleinestrasse',label:'Kl. Straße'},
  {key:'grossestrasse',label:'Gr. Straße'},
  {key:'kniffel',label:'Kniffel'}
];
function kniffEstimateProbabilities(dice,held,rollsLeft,trials){
  trials=trials||300;
  const hits={};KNIFFEL_PROB_CATS.forEach(c=>hits[c.key]=0);
  for(let t=0;t<trials;t++){
    let d=dice.slice();
    for(let r=0;r<rollsLeft;r++)d=d.map((v,i)=>held[i]?v:1+Math.floor(Math.random()*6));
    KNIFFEL_PROB_CATS.forEach(c=>{if(kniffelScoreFor(c.key,d,false)>0)hits[c.key]++;});
  }
  const out={};KNIFFEL_PROB_CATS.forEach(c=>out[c.key]=Math.round(hits[c.key]/trials*100));
  return out;
}
function kniffRenderProbabilities(){
  const el=document.getElementById('kniffel-probabilities');if(!el)return;
  const p=kniffPlayers[kniffTurn];
  if(!kniffRules.showProbabilities||kniffGameOver||!p||p.isAI||kniffRollsLeft<=0){el.innerHTML='';return;}
  const open=KNIFFEL_PROB_CATS.filter(c=>p.scores[c.key]==null);
  if(!open.length){el.innerHTML='';return;}
  const probs=kniffEstimateProbabilities(kniffDice,kniffHeld,kniffRollsLeft);
  el.innerHTML=`<div style="margin-top:10px;padding:8px 10px;background:var(--bg);border-radius:8px">
    <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">🎯 Chancen bei ${kniffRollsLeft} verbleibendem${kniffRollsLeft===1?'':'n'} Wurf${kniffRollsLeft===1?'':'en'}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${open.map(c=>`<span style="font-size:11px;background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:3px 8px;color:var(--text-2)">${c.label}: <b style="color:${probs[c.key]>=50?'var(--accent)':'var(--text)'}">${probs[c.key]}%</b></span>`).join('')}
    </div>
  </div>`;
}
const KNIFFEL_CONFETTI_COLORS=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00','#00acc1','#6d4c41'];
function kniffConfettiBurst(){
  sfx('kniffel');
  const div=document.createElement('div');
  div.style.cssText='position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999';
  let pieces='';
  for(let i=0;i<50;i++){
    const color=KNIFFEL_CONFETTI_COLORS[i%KNIFFEL_CONFETTI_COLORS.length];
    const left=(Math.random()*100).toFixed(1);
    const delay=(Math.random()*0.5).toFixed(2);
    const duration=(1.8+Math.random()*1.4).toFixed(2);
    const rotate=Math.floor(Math.random()*360);
    const w=(5+Math.random()*6).toFixed(1);
    pieces+=`<span style="position:absolute;top:-20px;left:${left}%;width:${w}px;height:${(w*0.4).toFixed(1)}px;background:${color};opacity:0.9;transform:rotate(${rotate}deg);animation:kniffConfettiFall ${duration}s ${delay}s ease-in forwards;border-radius:2px"></span>`;
  }
  div.innerHTML=`<style>@keyframes kniffConfettiFall{to{transform:translateY(100vh) rotate(720deg);opacity:0}}</style>${pieces}`;
  document.body.appendChild(div);
  setTimeout(()=>div.remove(),3500);
}
function kniffPickCategory(key){
  kniffHint=null;
  if(kniffGameOver||kniffRollsLeft===kniffRules.rollsPerTurn)return;
  const p=kniffPlayers[kniffTurn];
  if(p.scores[key]!=null)return;
  const jokerActive=kniffJokerActive(p);
  const isKniffel=kniffelIsKniffel(kniffDice);
  const score=kniffelScoreFor(key,kniffDice,jokerActive);
  p.scores[key]=score;
  const cat=KNIFFEL_CATEGORIES.find(c=>c.key===key);
  if(isKniffel){
    p.kniffelRollCount=(p.kniffelRollCount||0)+1;
    kniffConfettiBurst();
    if(jokerActive&&key!=='kniffel'){
      p.kniffelBonus=(p.kniffelBonus||0)+kniffRules.kniffelBonusPoints;
      kniffLogAdd(`🎉 ${p.name} würfelt einen weiteren Kniffel – Bonus +${kniffRules.kniffelBonusPoints}!`);
    }
  }
  sfx('place');
  kniffLogAdd(`✅ ${p.name} wählt „${cat.label}" für ${score} Punkte.`);
  if(typeof rplPush==='function')rplPush('kniffel',{dice:[...kniffDice],turn:kniffTurn,tot:kniffPlayers.map(kniffGrandTotal),last:{p:kniffTurn,cat:cat.label,score}});
  if(key==='kniffel'&&score===50)showToast('🎉 Kniffel! 50 Punkte!',3000);
  kniffNextTurn();
}
function kniffNextTurn(){
  kniffHint=null;
  kniffUndoSnapshot=null;
  if(kniffPlayers.every(kniffAllFilled)){
    kniffGameOver=true;
    const best=kniffPlayers.reduce((a,b)=>kniffGrandTotal(b)>kniffGrandTotal(a)?b:a);
    const tied=kniffPlayers.filter(pl=>kniffGrandTotal(pl)===kniffGrandTotal(best));
    const msg=tied.length>1?`Unentschieden zwischen ${tied.map(t=>t.name).join(', ')}!`:`${best.name} gewinnt mit ${kniffGrandTotal(best)} Punkten!`;
    kniffLogAdd(`🏆 ${msg}`);
    sfx(kniffPlayers.some(pl=>!pl.isAI&&kniffGrandTotal(pl)===kniffGrandTotal(best))?'win':'lose');
    const friendly=kniffPlayers.some(pl=>!pl.isAI&&zcIsGuest(pl.name));
    if(friendly)kniffLogAdd('🤝 Gastspiel – nicht gewertet (keine PR, Statistik oder Coins)');
    if(!friendly&&kniffRules.adaptiveAI){const hu=kniffPlayers.filter(pl=>!pl.isAI),ai=kniffPlayers.filter(pl=>pl.isAI);if(hu.length===1&&ai.length>=1)kniffAdaptUpdate(hu[0].name,kniffGrandTotal(hu[0])>=Math.max(...ai.map(kniffGrandTotal)));}
    if(typeof rplFinish==='function')rplFinish('kniffel',{names:kniffPlayers.map(p=>p.name),colors:kniffPlayers.map(p=>p.color),result:'🏆 '+msg});
    const cupActive=!!(kniffCup&&!kniffCup.done);
    if(cupActive)kniffCupRecordRound();
    if(!friendly)kniffHallOfFameRecordGame(cupActive);
    kniffLastRankDeltas=(cupActive||friendly)?null:kniffRankApplyResults();
    if(kniffLastRankDeltas&&typeof rplUpdateMeta==='function')rplUpdateMeta('kniffel',{prLine:Object.entries(kniffLastRankDeltas).map(([n,d])=>`${n} ${d.delta>0?'+':''}${d.delta} PR`).join(' · ')});
    if(!friendly&&typeof zcEvent==='function'){const hofNow=kniffHallOfFameLoad();kniffPlayers.forEach(pl=>{if(pl.isAI)return;const won=kniffGrandTotal(pl)===kniffGrandTotal(best);const rec=hofNow[(pl.name||'').trim()]||{};zcEvent({game:'kniffel',name:pl.name,res:won?'W':'L',diff:null,cup:cupActive,streak:rec.streak||0});});}
    if(kniffTournament&&!kniffTournament.done)kniffTournamentRecordRound(tied.length>1?null:best);
    kniffRenderAll();
    return;
  }
  do{kniffTurn=(kniffTurn+1)%kniffPlayers.length;}while(kniffAllFilled(kniffPlayers[kniffTurn]));
  kniffDice=[1,1,1,1,1];kniffHeld=[false,false,false,false,false];kniffRollsLeft=kniffRules.rollsPerTurn;kniffUndoSnapshot=null;
  kniffRenderAll();
}

/* ── KI ── */
const KNIFF_PAR={einser:2.1,zweier:4.2,dreier:6.3,vierer:8.4,fuenfer:10.5,sechser:12.6,dreierpasch:17,viererpasch:9,fullhouse:9,kleinestrasse:15,grossestrasse:8,kniffel:2,chance:22};
function kniffAiBestValue(p,dice){
  let b=-99;
  KNIFFEL_CATEGORIES.forEach(c=>{if(p.scores[c.key]!=null)return;const v=kniffelScoreFor(c.key,dice,kniffJokerActive(p))-(KNIFF_PAR[c.key]||0);if(v>b)b=v;});
  return b;
}
function kniffAiDecideHoldExpert(){
  const p=kniffPlayers[kniffTurn],rolls=kniffRollsLeft;
  let bestMask=31,bestV=-1e9;
  for(let mask=0;mask<32;mask++){
    let tot=0;const N=110;
    for(let t=0;t<N;t++){
      let d=kniffDice.map((v,i)=>(mask>>i&1)?v:1+Math.floor(Math.random()*6));
      if(rolls>1){
        const saved=kniffDice;kniffDice=d;const h=kniffAiDecideHold('hard');kniffDice=saved;
        d=d.map((v,i)=>h[i]?v:1+Math.floor(Math.random()*6));
      }
      tot+=kniffAiBestValue(p,d);
    }
    if(tot>bestV){bestV=tot;bestMask=mask;}
  }
  return kniffDice.map((v,i)=>!!(bestMask>>i&1));
}
function kniffAiDecideHold(diffOverride){
  if((diffOverride||kniffAiDiff())==='expert')return kniffAiDecideHoldExpert();
  const counts=kniffelCounts(kniffDice);
  let bestVal=0,bestCount=0;
  for(let v=6;v>=1;v--){if(counts[v]>bestCount){bestCount=counts[v];bestVal=v;}}
  if((diffOverride||kniffAiDiff())==='easy'){
    return kniffDice.map(d=>d===bestVal&&bestCount>=2);
  }
  const present=new Set(kniffDice);
  const straightRuns=[[1,2,3,4,5],[2,3,4,5,6],[1,2,3,4],[2,3,4,5],[3,4,5,6]];
  const bestRun=straightRuns.find(r=>r.every(v=>present.has(v))&&r.length>=4);
  if(bestRun&&bestCount<3){
    const seen=new Set();
    return kniffDice.map(d=>{if(bestRun.includes(d)&&!seen.has(d)){seen.add(d);return true;}return false;});
  }
  return kniffDice.map(d=>d===bestVal&&bestCount>=2);
}
function kniffAiPickCategory(diffOverride){
  const p=kniffPlayers[kniffTurn];
  if((diffOverride||kniffAiDiff())==='expert'){
    let bk=null,bv=-1e9;
    KNIFFEL_CATEGORIES.forEach(c=>{if(p.scores[c.key]!=null)return;const v=kniffelScoreFor(c.key,kniffDice,kniffJokerActive(p))-(KNIFF_PAR[c.key]||0);if(v>bv){bv=v;bk=c.key;}});
    return bk;
  }
  const jokerActive=kniffJokerActive(p);
  const available=KNIFFEL_CATEGORIES.filter(c=>p.scores[c.key]==null);
  let best=null,bestScore=-1;
  available.forEach(c=>{
    const s=kniffelScoreFor(c.key,kniffDice,jokerActive);
    if(s>bestScore){bestScore=s;best=c;}
  });
  if(bestScore<=0){
    if((diffOverride||kniffAiDiff())==='easy'){
      best=available[Math.floor(Math.random()*available.length)];
    } else {
      const zeroPriority=['kniffel','grossestrasse','kleinestrasse','viererpasch','fullhouse','dreierpasch','sechser','fuenfer','vierer','dreier','zweier','chance','einser'];
      for(const key of zeroPriority){
        const cat=available.find(c=>c.key===key);
        if(cat){best=cat;break;}
      }
    }
  }
  return best.key;
}
function kniffAiTurnStep(){
  clearTimeout(kniffAiTimer);
  if(!kniffPlayers.length||kniffGameOver)return;
  const p=kniffPlayers[kniffTurn];if(!p||!p.isAI)return;
  kniffAiTimer=setTimeout(()=>{
    if(kniffGameOver)return;
    const pl=kniffPlayers[kniffTurn];if(!pl||!pl.isAI)return;
    if(kniffRollsLeft>0){
      if(kniffRollsLeft<kniffRules.rollsPerTurn){
        const hold=kniffAiDecideHold();
        if(kniffAiDiff()==='expert'&&hold.every(Boolean)){kniffPickCategory(kniffAiPickCategory());return;}
        const alreadyGood=kniffelScoreFor('kniffel',kniffDice)===50;
        if(alreadyGood){kniffPickCategory('kniffel');return;}
        kniffHeld=hold;
      }
      kniffPlayRollAnimation(()=>{
        for(let i=0;i<5;i++){if(!kniffHeld[i])kniffDice[i]=1+Math.floor(Math.random()*6);}
        kniffRollsLeft--;
        kniffLogAdd(`🎲 ${pl.name} würfelt: ${kniffDice.join(', ')}${kniffRollsLeft>0?` (noch ${kniffRollsLeft}×)`:''}`);
        kniffRenderAll();
      });
    } else {
      kniffPickCategory(kniffAiPickCategory());
    }
  },700);
}

/* ── Render ── */
function kniffRenderLog(){
  const el=document.getElementById('kniffel-log');if(el)el.innerHTML=kniffLog.map(m=>`<div>${escHtml(m)}</div>`).join('');
}
function kniffDiceFaceHtml(value,i,held,canHold){
  const pips=KNIFFEL_PIPS[value]||[],ds=typeof zcBoardSkin==='function'?zcBoardSkin('dice'):null;
  const cells=Array.from({length:9},(_,idx)=>`<span style="display:flex;align-items:center;justify-content:center"><span style="width:8px;height:8px;border-radius:50%;background:${pips.includes(idx)?(held?'#fff':(ds?ds.pip:'var(--text)')):'transparent'}"></span></span>`).join('');
  return `<button onclick="kniffToggleHold(${i})" ${canHold?'':'disabled'} title="${held?'Würfel gehalten – klicken zum Lösen':canHold?'Klicken zum Halten':'Erst würfeln'}" style="width:52px;height:52px;border-radius:10px;background:${held?'var(--accent)':(ds?ds.bg:'var(--surface)')};border:2px solid ${held?'var(--accent)':(ds?ds.bd:'var(--divider)')};display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:6px;cursor:${canHold?'pointer':'default'};box-shadow:${ds&&!held?ds.sh:'0 2px 6px rgba(0,0,0,0.15)'};flex-shrink:0;outline:${kniffHint&&kniffHint.hold&&kniffHint.hold[i]&&!held?'3px solid #fdd835':'none'};outline-offset:1px${ds&&ds.glowAnim&&!held?`;animation:zcGlowPulse 1.8s ease-in-out infinite;--myth-glow:${ds.glowColor||'#ff2fd0'}`:''}">${cells}</button>`;
}
function kniffRenderDice(){
  const wrap=document.getElementById('kniffel-dice');if(!wrap)return;
  const canHold=kniffRollsLeft<kniffRules.rollsPerTurn&&!kniffGameOver&&!kniffPlayers[kniffTurn].isAI;
  wrap.innerHTML=kniffDice.map((v,i)=>kniffDiceFaceHtml(v,i,kniffHeld[i],canHold)).join('');
}
function kniffRenderTurnInfo(){
  const el=document.getElementById('kniffel-turn-info');if(!el)return;
  if(kniffGameOver){el.innerHTML='<div style="text-align:center;font-weight:700;color:var(--accent)">🏆 Spiel beendet</div>';return;}
  const p=kniffPlayers[kniffTurn];
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="width:22px;height:22px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1">${p.avatar}</span>
      <div style="font-weight:700;color:var(--text)">${escHtml(p.name)} ist dran</div>
    </div>
    <div style="font-size:12px;color:var(--text-3);margin-bottom:8px">Würfe übrig: ${kniffRollsLeft}${p.isAI?' · 🤖 KI denkt…':''}</div>
    ${(!p.isAI&&!(kniffCup&&!kniffCup.done))?(()=>{
      const score=kniffGrandTotal(p);
      const rp=kniffRankScoreBaseRp(score);
      return`<div style="font-size:11px;color:var(--text-3);text-align:center;margin-bottom:10px">📊 PR-Vorschau bei aktuellem Stand (${score} Pkt.): <b style="color:${rp>=0?'var(--accent)':'#c62828'}">${rp>=0?'+':''}${rp} PR</b>${kniffPlayers.length>1?' <span title="Platzierungsbonus/-malus steht erst bei Spielende fest">±Platzierung</span>':''}</div>`;
    })():''}
    <div id="kniffel-dice" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:10px"></div>
    ${p.isAI?'':(()=>{
      const allHeld=kniffHeld.every(h=>h);
      const disabled=kniffRollsLeft<=0||allHeld;
      const label=allHeld&&kniffRollsLeft>0?'🎲 Alle Würfel gehalten':`🎲 Würfeln${kniffRollsLeft<kniffRules.rollsPerTurn?' ('+kniffRollsLeft+' übrig)':''}`;
      const canUndo=!!kniffUndoSnapshot&&!kniffRolling;
      return`<div style="display:flex;gap:8px;justify-content:center">
        <button class="btn-generate" ${disabled?'disabled':''} onclick="kniffRoll()" style="width:auto;padding:9px 22px;${disabled?'opacity:0.5':''}">${label}</button>
        ${kniffRules.showHints?`<button class="timer-btn" onclick="kniffShowHint()" title="Besten Zug anzeigen" style="padding:9px 14px;font-size:12px">💡 Hinweis</button>`:''}
        ${kniffUndoSnapshot?`<button class="timer-btn" ${canUndo?'':'disabled'} onclick="kniffUndoRoll()" title="Letzten Wurf rückgängig machen" style="padding:9px 14px;font-size:12px;${canUndo?'':'opacity:0.5'}">↩️</button>`:''}
      </div>`;
    })()}
    ${kniffHint&&!p.isAI?`<div style="margin-top:10px;padding:8px 10px;background:rgba(253,216,53,0.15);border:0.5px solid #fdd835;border-radius:8px;font-size:12px;color:var(--text);text-align:center">💡 ${escHtml(kniffHint.text)}</div>`:''}
    <div id="kniffel-probabilities"></div>
  `;
  kniffRenderDice();
  kniffRenderProbabilities();
}
function kniffColBg(i){return(i===kniffTurn&&!kniffGameOver)?'background:color-mix(in srgb, var(--accent) 10%, transparent);':'';}
function kniffScoreCellHtml(p,i,cat){
  const filled=p.scores[cat.key]!=null;
  const isCurrent=i===kniffTurn&&!kniffGameOver;
  const canPick=isCurrent&&!filled&&kniffRollsLeft<kniffRules.rollsPerTurn&&!kniffPlayers[kniffTurn].isAI;
  const bg=kniffColBg(i);
  if(filled)return`<td style="padding:6px 8px;text-align:center;font-size:12px;color:var(--text);${bg}">${p.scores[cat.key]}</td>`;
  if(canPick){
    const preview=kniffPreviewScore(cat.key);
    return`<td style="padding:2px;${bg}"><button onclick="kniffPickCategory('${cat.key}')" style="width:100%;padding:5px;font-size:12px;border-radius:6px;border:0.5px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer${kniffHint&&kniffHint.pick===cat.key?';box-shadow:0 0 0 3px #fdd835':''}">${preview}</button></td>`;
  }
  return`<td style="padding:6px 8px;text-align:center;font-size:12px;color:var(--text-3);${bg}">–</td>`;
}
function kniffRenderScorecard(){
  const wrap=document.getElementById('kniffel-scorecard');if(!wrap)return;
  const upper=KNIFFEL_CATEGORIES.filter(c=>c.section==='upper');
  const lower=KNIFFEL_CATEGORIES.filter(c=>c.section==='lower');
  const rowHtml=cat=>`<tr>
    <td style="padding:6px 8px;font-size:12px;color:var(--text-2)">${cat.label}</td>
    ${kniffPlayers.map((p,i)=>kniffScoreCellHtml(p,i,cat)).join('')}
  </tr>`;
  wrap.innerHTML=`<div style="overflow-x:auto"><table style="width:100%;max-width:${210+kniffPlayers.length*120}px;margin:0;border-collapse:collapse;min-width:${240+kniffPlayers.length*70}px">
    <thead><tr>
      <th style="padding:6px 8px;text-align:left;font-size:10px;color:var(--text-3);text-transform:uppercase;width:190px">Kategorie</th>
      ${kniffPlayers.map((p,i)=>`<th style="padding:6px 8px;font-size:11px;color:${i===kniffTurn&&!kniffGameOver?'var(--accent)':'var(--text)'};text-align:center;white-space:nowrap;${kniffColBg(i)}">${p.avatar} ${escHtml(p.name)}${p.isAI?' 🤖':''}</th>`).join('')}
    </tr></thead>
    <tbody>
      ${upper.map(rowHtml).join('')}
      <tr style="border-top:0.5px solid var(--divider)">
        <td style="padding:6px 8px;font-size:11px;font-weight:700;color:var(--text-3)">Summe</td>
        ${kniffPlayers.map((p,i)=>`<td style="padding:6px 8px;text-align:center;font-size:12px;font-weight:700;${kniffColBg(i)}">${kniffUpperSum(p)}</td>`).join('')}
      </tr>
      <tr>
        <td style="padding:6px 8px;font-size:11px;color:var(--text-3)">Bonus (≥${kniffRules.bonusThreshold}: +${kniffRules.bonusPoints})</td>
        ${kniffPlayers.map((p,i)=>`<td style="padding:6px 8px;text-align:center;font-size:12px;color:${kniffBonus(p)?'var(--accent)':'var(--text-3)'};${kniffColBg(i)}">${kniffBonus(p)}</td>`).join('')}
      </tr>
      ${lower.map(rowHtml).join('')}
      <tr>
        <td style="padding:6px 8px;font-size:11px;color:var(--text-3)" title="+${kniffRules.kniffelBonusPoints} für jeden weiteren Kniffel, sobald die Kniffel-Kategorie schon 50 Punkte hat">Kniffel-Bonus</td>
        ${kniffPlayers.map((p,i)=>`<td style="padding:6px 8px;text-align:center;font-size:12px;color:${p.kniffelBonus?'var(--accent)':'var(--text-3)'};${kniffColBg(i)}">${p.kniffelBonus||0}</td>`).join('')}
      </tr>
      <tr style="border-top:0.5px solid var(--divider)">
        <td style="padding:6px 8px;font-size:12px;font-weight:700;color:var(--text)">Gesamt</td>
        ${kniffPlayers.map((p,i)=>`<td style="padding:6px 8px;text-align:center;font-size:13px;font-weight:700;color:var(--accent);${kniffColBg(i)}">${kniffGrandTotal(p)}</td>`).join('')}
      </tr>
    </tbody>
  </table></div>`;
}
function kniffCloseGameOverModal(){const overlay=document.getElementById('kniffel-modal-overlay');if(overlay)overlay.style.display='none';}
function kniffRenderGameOverModal(){
  const overlay=document.getElementById('kniffel-modal-overlay');
  const box=document.getElementById('kniffel-modal-box');if(!overlay||!box)return;
  const sorted=[...kniffPlayers].sort((a,b)=>kniffGrandTotal(b)-kniffGrandTotal(a));
  const winner=sorted[0];
  const tiedWinners=sorted.filter(p=>kniffGrandTotal(p)===kniffGrandTotal(winner));
  const badges=kniffComputeBadges();
  const milestones=kniffComputeMilestones();
  const rankEntries=Object.entries(kniffLastRankDeltas||{});
  if(kniffLastRankDeltas&&typeof zcCheckRankUpCelebration==='function')zcCheckRankUpCelebration(kniffLastRankDeltas);
  const rankHtml=rankEntries.length?`<div style="margin-bottom:14px">
    <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">📊 Gesamtrang-Update</div>
    ${rankEntries.map(([name,d])=>{
      const tierChanged=d.rankAfter.label!==d.rankBefore.label;
      const sign=d.delta>0?'+':'';
      const noteColor=d.delta>0?'#2e7d32':d.delta<0?'#c62828':'var(--text-3)';
      return`<div style="background:var(--bg);border-radius:8px;padding:6px 10px;margin-bottom:4px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="flex:1;font-size:12px;color:var(--text)">${escHtml(name)}</span>
          <span style="font-size:12px;font-weight:700;color:${noteColor}">${sign}${d.delta} PR</span>
        </div>
        <div style="margin-top:4px">${typeof zcOverallBadge==='function'?zcOverallBadge(name,true):kniffRankBadgeHtml(d.after,true)}</div>
        ${tierChanged?`<div style="font-size:10px;margin-top:3px;color:${d.delta>0?'var(--accent)':'var(--text-3)'}">${d.delta>0?'🎉 Aufstieg':'Abstieg'} zu ${escHtml(d.rankAfter.label)}!</div>`:''}
      </div>`;
    }).join('')}
  </div>`:'';
  const t=kniffTournament;
  const seriesHtml=t?`<div style="text-align:center;margin-bottom:14px;padding:10px;background:var(--bg);border-radius:10px;font-size:12px;color:var(--text-2)">
    🏆 Serie (Best-of-${t.bo}): <b>${escHtml(t.names[0])} ${t.wins[0]} : ${t.wins[1]} ${escHtml(t.names[1])}</b>
    ${t.done?`<div style="margin-top:4px;font-weight:700;color:var(--accent)">Serie entschieden!</div>`:`<div style="margin-top:2px;color:var(--text-3)">Weiter geht's mit Runde ${t.round+1}</div>`}
  </div>`:'';
  const cup=kniffCup;
  const cupHtml=cup?`<div style="text-align:left;margin-bottom:14px;padding:10px 12px;background:var(--bg);border-radius:10px;font-size:12px;color:var(--text-2)">
    <div style="font-weight:700;margin-bottom:6px;text-align:center">🏆 Cup · Runde ${cup.round}/${cup.rounds}${cup.done?' — beendet':''}</div>
    ${[...cup.players].sort((a,b)=>b.total-a.total).map((cp,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:3px 0">
      <span style="font-size:11px;color:var(--text-3);width:14px">${i+1}.</span>
      <span style="width:16px;height:16px;border-radius:50%;background:${cp.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:10px">${cp.avatar}</span>
      <span style="flex:1">${escHtml(cp.name)}</span>
      <span style="font-size:10px;color:var(--text-3)">${cp.scores.join(' + ')}</span>
      <span style="font-weight:700">${cp.total}</span>
    </div>`).join('')}
    ${cup.done?`<div style="margin-top:6px;font-weight:700;color:var(--accent);text-align:center">🏆 Cup-Sieger: ${escHtml([...cup.players].sort((a,b)=>b.total-a.total)[0].name)}</div>`:`<div style="margin-top:4px;color:var(--text-3);text-align:center">Weiter geht's mit Runde ${cup.round+1}</div>`}
  </div>`:'';
  overlay.style.display='flex';
  box.innerHTML=`
    <div style="text-align:center">
      <div style="font-size:40px;margin-bottom:6px">🏆</div>
      <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:12px">${tiedWinners.length>1?`Unentschieden zwischen ${tiedWinners.map(p=>escHtml(p.name)).join(', ')} (${kniffGrandTotal(winner)} Punkte)!`:`${escHtml(winner.name)} gewinnt mit ${kniffGrandTotal(winner)} Punkten!`}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
      ${sorted.map((p,rank)=>{
        const chips=[
          ...badges.filter(b=>b.player===p).map(b=>({...b,milestone:false})),
          ...milestones.filter(m=>m.player===p).map(m=>({...m,milestone:true}))
        ];
        return`<div style="background:var(--bg);border-radius:8px;padding:6px 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;color:var(--text-3);width:14px">${rank+1}.</span>
          <span style="width:18px;height:18px;border-radius:50%;background:${p.color};flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;font-size:11px">${p.avatar}</span>
          <span style="flex:1;font-size:13px;color:var(--text)">${escHtml(p.name)}</span>
          <span style="font-size:13px;font-weight:700">${kniffGrandTotal(p)}</span>
        </div>
        <div style="font-size:10px;color:var(--text-3);margin-top:4px;padding-left:22px">Bester Wurf: ${kniffBestSingleScore(p)} · Kniffel gewürfelt: ${p.kniffelRollCount||0} · Nullen: ${kniffZeroCount(p)}</div>
        ${chips.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;padding-left:22px">${chips.map(c=>`<span title="${escHtml(c.desc)}" style="font-size:10px;background:var(--surface);border:0.5px ${c.milestone?'dashed var(--accent)':'solid var(--divider)'};border-radius:12px;padding:2px 7px;white-space:nowrap">${c.icon} ${c.label}</span>`).join('')}</div>`:''}
      </div>`;
      }).join('')}
    </div>
    ${(()=>{const mz=kniffMostZeroedCategory();return mz?`<div style="font-size:11px;color:var(--text-3);text-align:center;margin-bottom:14px">Am häufigsten genullt: <b>${escHtml(mz.cat.label)}</b> (${mz.count}×)</div>`:'';})()}
    ${rankHtml}
    ${cupHtml}
    ${seriesHtml}
    <div style="text-align:center;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      ${cup&&!cup.done?`<button class="btn-generate" onclick="kniffCupNextRound()" style="width:auto;padding:10px 24px">▶ Nächste Runde</button>
        <button class="timer-btn" onclick="kniffAbandonGame()" style="width:auto;padding:10px 18px;font-size:12px">Cup abbrechen</button>`
        :t&&!t.done?`<button class="btn-generate" onclick="kniffTournamentNextRound()" style="width:auto;padding:10px 24px">▶ Nächste Runde</button>
        <button class="timer-btn" onclick="kniffAbandonGame()" style="width:auto;padding:10px 18px;font-size:12px">Serie abbrechen</button>`
        :`<button class="btn-generate" onclick="kniffAbandonGame()" style="width:auto;padding:10px 24px">Neues Spiel</button>`}
      ${typeof rplHas==='function'&&rplHas('kniffel')?`<button class="timer-btn" onclick="rplOpen('kniffel')" style="padding:10px 16px;font-size:12px">🎬 Replay</button>`:''}
    </div>
  `;
}
/* ── Hall of Fame (über mehrere Partien hinweg, nach Spielername) ── */
function kniffHallOfFameLoad(){
  try{const s=localStorage.getItem('zf_kniffel_halloffame');return s?JSON.parse(s):{};}catch(e){return{};}
}
function kniffHallOfFameSave(hof){try{localStorage.setItem('zf_kniffel_halloffame',JSON.stringify(hof));}catch(e){}}
function kniffHallOfFameRecordGame(inCup){
  const hof=kniffHallOfFameLoad();
  const sorted=[...kniffPlayers].sort((a,b)=>kniffGrandTotal(b)-kniffGrandTotal(a));
  const topScore=kniffGrandTotal(sorted[0]);
  const winners=kniffPlayers.filter(p=>kniffGrandTotal(p)===topScore);
  const badges=kniffComputeBadges();
  const milestones=kniffComputeMilestones();
  kniffPlayers.forEach(p=>{
    const name=(p.name||'').trim();if(!name)return;
    if(!hof[name])hof[name]={games:0,wins:0,bestScore:0,kniffelCount:0,totalScore:0,badges:{},milestones:{}};
    const rec=hof[name];
    if(!rec.badges)rec.badges={};if(!rec.milestones)rec.milestones={};if(!rec.totalScore)rec.totalScore=0;
    rec.games++;
    const won=winners.includes(p);
    if(won)rec.wins++;
    rec.streak=won?(rec.streak||0)+1:0;
    rec.bestStreak=Math.max(rec.bestStreak||0,rec.streak);
    const scoreNow=kniffGrandTotal(p);
    rec.minScore=rec.minScore==null?scoreNow:Math.min(rec.minScore,scoreNow);
    rec.lastPlayed=Date.now();
    if(!Array.isArray(rec.history))rec.history=[];
    rec.history.push({t:rec.lastPlayed,score:scoreNow,won,n:kniffPlayers.length,cup:!!inCup});
    if(rec.history.length>100)rec.history.shift();
    rec.bestScore=Math.max(rec.bestScore,kniffGrandTotal(p));
    rec.kniffelCount+=(p.kniffelRollCount||0);
    rec.totalScore+=kniffGrandTotal(p);
    badges.filter(b=>b.player===p).forEach(b=>{rec.badges[b.key]=(rec.badges[b.key]||0)+1;});
    milestones.filter(m=>m.player===p).forEach(m=>{rec.milestones[m.key]=(rec.milestones[m.key]||0)+1;});
  });
  kniffHallOfFameSave(hof);
}
function kniffHofChipsHtml(counts,defs,milestone){
  if(!counts)return'';
  return Object.entries(counts).map(([key,count])=>{
    const def=defs.find(d=>d.key===key);if(!def)return'';
    return `<span title="${escHtml(def.label)}" style="font-size:10px;background:var(--surface);border:0.5px ${milestone?'dashed var(--accent)':'solid var(--divider)'};border-radius:12px;padding:2px 7px;white-space:nowrap">${def.icon} ${count}×</span>`;
  }).join('');
}
let kniffHofSortedNames=[];
function kniffRenderHallOfFame(){
  const wrap=document.getElementById('kniffel-hof-list');if(!wrap)return;
  const hof=kniffHallOfFameLoad();
  const rankData=kniffRankLoad();
  const names=Object.keys(hof);
  const legend=kniffBadgeLegendHtml('Bestenlisten','Nur der/die Spieler(in) mit dem besten Wert bekommt die Auszeichnung.',KNIFFEL_BADGE_DEFS)
    +kniffBadgeLegendHtml('Meilensteine','Ab einem Schwellenwert – kann jede(r) erreichen.',KNIFFEL_MILESTONE_DEFS);
  if(!names.length){kniffHofSortedNames=[];wrap.innerHTML=legend+`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:16px 0">Noch keine abgeschlossene Partie – füllt sich nach dem ersten Spielende.</div>`;return;}
  const rows=names.map(name=>({name,rp:rankData[name]||0,...hof[name]})).sort((a,b)=>b.rp-a.rp||b.bestScore-a.bestScore||b.wins-a.wins);
  kniffHofSortedNames=rows.map(r=>r.name);
  wrap.innerHTML=legend+rows.map((r,idx)=>{
    const avg=r.games?Math.round((r.totalScore||0)/r.games):0;
    const winRate=r.games?Math.round((r.wins/r.games)*100):0;
    const cupChip=r.cupWins?`<span title="Cups gewonnen" style="font-size:10px;background:var(--surface);border:0.5px solid var(--accent);border-radius:12px;padding:2px 7px;white-space:nowrap;color:var(--accent);font-weight:700">🏆 Cup-Sieger ${r.cupWins}×</span>`:'';
    const chips=cupChip+kniffHofChipsHtml(r.badges,KNIFFEL_BADGE_DEFS,false)+kniffHofChipsHtml(r.milestones,KNIFFEL_MILESTONE_DEFS,true);
    return`<div style="background:var(--bg);border-radius:10px;padding:10px 12px;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:8px">
      <span onclick="kniffOpenProfile(kniffHofSortedNames[${idx}])" title="Profil öffnen" style="flex:1;font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer">${escHtml(r.name)}</span>
      <span style="font-size:11px;color:var(--text-3);flex-shrink:0">${r.games} Spiel${r.games===1?'':'e'} · 🏆 ${r.wins} (${winRate}%)</span>
      <button onclick="kniffHallOfFameDeleteAt(${idx})" title="Eintrag löschen" style="flex-shrink:0;padding:2px 7px;font-size:11px;border-radius:6px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text-3);cursor:pointer">✕</button>
    </div>
    <div style="margin-top:6px">${typeof zcOverallBadge==='function'?zcOverallBadge(r.name,false):kniffRankBadgeHtml(r.rp,false)}</div>
    <div style="font-size:11px;color:var(--text-3);margin-top:6px">Bester Score: <b>${r.bestScore}</b> · Ø ${avg} · Kniffel gewürfelt: ${r.kniffelCount}</div>
    ${chips?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${chips}</div>`:''}
  </div>`;
  }).join('');
}
function kniffHallOfFameDeleteAt(idx){
  const name=kniffHofSortedNames[idx];if(name==null)return;
  appConfirm(`Hall-of-Fame-Eintrag für „${name}" löschen? Das kann nicht rückgängig gemacht werden.`,()=>{
    const hof=kniffHallOfFameLoad();
    delete hof[name];
    kniffHallOfFameSave(hof);
    const rankData=kniffRankLoad();
    delete rankData[name];
    kniffRankSave(rankData);
    kniffRenderHallOfFame();
    showToast('Eintrag gelöscht ✓');
  });
}
function kniffHallOfFameResetConfirm(){
  appConfirm('Hall of Fame wirklich zurücksetzen? Das kann nicht rückgängig gemacht werden.',()=>{
    try{localStorage.removeItem('zf_kniffel_halloffame');localStorage.removeItem('zf_kniffel_rank');localStorage.removeItem('zf_kniffel_cuphistory');}catch(e){}
    kniffRenderHallOfFame();
    kniffRenderCupHistory();
    showToast('Hall of Fame zurückgesetzt ✓');
  });
}

/* ── Tabs ── */
function kniffShowView(v){
  if(v==='rules'&&kniffGameActive()){
    showToast('Nur vor dem Spielstart bearbeitbar');
    v='play';
  }
  document.getElementById('kniffel-tab-play')?.classList.toggle('active',v==='play');
  document.getElementById('kniffel-tab-hof')?.classList.toggle('active',v==='hof');
  document.getElementById('kniffel-tab-profile')?.classList.toggle('active',v==='profile');
  const vpr=document.getElementById('kniffel-view-profile');if(vpr)vpr.style.display=v==='profile'?'block':'none';
  if(v==='profile')kniffRenderProfile();
  document.getElementById('kniffel-tab-ranks')?.classList.toggle('active',v==='ranks');
  document.getElementById('kniffel-tab-rules')?.classList.toggle('active',v==='rules');
  const vp=document.getElementById('kniffel-view-play');if(vp)vp.style.display=v==='play'?'block':'none';
  const vh=document.getElementById('kniffel-view-hof');if(vh)vh.style.display=v==='hof'?'block':'none';
  const vra=document.getElementById('kniffel-view-ranks');if(vra)vra.style.display=v==='ranks'?'block':'none';
  const vr=document.getElementById('kniffel-view-rules');if(vr)vr.style.display=v==='rules'?'block':'none';
  if(v==='hof'){kniffRenderHallOfFame();kniffRenderCupHistory();}
  if(v==='ranks')kniffRenderRankFormulaEditor();
  if(v==='rules')kniffRenderRulesEditor();
  const tabRules=document.getElementById('kniffel-tab-rules');
  if(tabRules){
    const active=kniffGameActive();
    tabRules.style.opacity=active?'0.4':'';tabRules.style.cursor=active?'not-allowed':'';
    tabRules.title=active?'Nur vor dem Spielstart verfügbar':'';
  }
}
function kniffRenderRulesEditor(){
  const wrap=document.getElementById('kniffel-rules-editor');if(!wrap)return;
  wrap.innerHTML=`
    <div style="display:flex;flex-direction:column;gap:10px;max-width:480px">
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" ${kniffRules.jokerRuleEnabled?'checked':''} onchange="kniffSetRuleToggle('jokerRuleEnabled',this.checked)" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">Joker-Regel</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Weitere Kniffel nach dem ersten geben Bonuspunkte und dürfen Full House/Kleine Straße/Große Straße zum vollen Wert nutzen.</span>
          </span>
        </label>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px">
        <label class="set-label">Würfe pro Zug</label>
        <input type="number" min="1" step="1" value="${kniffRules.rollsPerTurn}" oninput="kniffSetRuleNumber('rollsPerTurn',this.value)" style="width:80px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <label class="set-label">Oberteil-Bonus ab</label>
        <input type="number" min="1" step="1" value="${kniffRules.bonusThreshold}" oninput="kniffSetRuleNumber('bonusThreshold',this.value)" style="width:80px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <label class="set-label">Oberteil-Bonus-Punkte</label>
        <input type="number" min="0" step="1" value="${kniffRules.bonusPoints}" oninput="kniffSetRuleNumber('bonusPoints',this.value)" style="width:80px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <label class="set-label">Kniffel-Bonus-Punkte</label>
        <input type="number" min="0" step="1" value="${kniffRules.kniffelBonusPoints}" oninput="kniffSetRuleNumber('kniffelBonusPoints',this.value)" style="width:80px;padding:7px;background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);text-align:right"/>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" ${kniffRules.showProbabilities?'checked':''} onchange="kniffSetRuleToggle('showProbabilities',this.checked)" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">Chancenanzeige</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Zeigt beim Würfeln die geschätzte Wahrscheinlichkeit für offene Kombinationen (Pasch, Straßen, Kniffel).</span>
          </span>
        </label>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" ${kniffRules.showHints?'checked':''} onchange="kniffSetRuleToggle('showHints',this.checked)" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">Hinweis-Modus</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Zeigt einen 💡-Button, der den besten Zug vorschlägt (welche Würfel halten oder welche Kategorie eintragen).</span>
          </span>
        </label>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
          <input type="checkbox" ${kniffRules.adaptiveAI?'checked':''} onchange="kniffSetRuleToggle('adaptiveAI',this.checked)" style="margin-top:2px"/>
          <span>
            <span style="display:block;font-size:13px;font-weight:600;color:var(--text)">🧠 Adaptive KI</span>
            <span style="display:block;font-size:11px;color:var(--text-3);margin-top:2px">Bei genau einem Menschen gegen KI: nach 2 Siegen in Folge wird die KI stärker, nach 2 Niederlagen schwächer (Leicht ↔ Schwer ↔ Sehr schwer).</span>
          </span>
        </label>
      </div>
      <div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px">KI-Schwierigkeit</div>
        <div style="display:flex;gap:8px">
          <button class="timer-btn" onclick="kniffSetAiDifficulty('easy')" style="padding:7px 14px;font-size:12px;${kniffRules.aiDifficulty==='easy'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">Leicht</button>
          <button class="timer-btn" onclick="kniffSetAiDifficulty('hard')" style="padding:7px 14px;font-size:12px;${kniffRules.aiDifficulty!=='easy'&&kniffRules.aiDifficulty!=='expert'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">Schwer</button>
          <button class="timer-btn" onclick="kniffSetAiDifficulty('expert')" style="padding:7px 14px;font-size:12px;${kniffRules.aiDifficulty==='expert'?'background:var(--accent);color:#fff;border-color:var(--accent)':''}">Sehr schwer</button>
        </div>
      </div>
      <button class="timer-btn" onclick="kniffRulesReset()" style="padding:8px 14px;font-size:12px;align-self:flex-start">↩ Regeln auf Standard zurücksetzen</button>
    </div>`;
}

function kniffRenderAll(){
  if(!kniffPlayers.length)return;
  kniffRenderTournamentBanner();
  kniffRenderCupBanner();
  kniffRenderTurnInfo();kniffRenderScorecard();kniffRenderLog();
  if(kniffGameOver)kniffRenderGameOverModal();else kniffCloseGameOverModal();
  kniffAiTurnStep();
  kniffSaveGame();
}
