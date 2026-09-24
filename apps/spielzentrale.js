/* ══════════════════════════════════
   SPIELZENTRALE – Gesamtprofil, spielübergreifende Bestenliste, tägliche Challenges
   Liest die Daten aller Spiele (Kniffel, Monopoly und die spielmeta-Spiele).
   State (Challenges, Bonus-PR, Gesamt-Rang): zf_sm_zentrale
══════════════════════════════════ */
const ZC_GAMES=[
  {id:'kniffel',title:'Kniffel',icon:'🎲',kind:'kniffel'},
  {id:'mono',title:'Monopoly',icon:'🏠',kind:'sm'},
  {id:'ttt',title:'Tic-Tac-Toe',icon:'⭕',kind:'sm'},
  {id:'vg',title:'Vier gewinnt',icon:'🔴',kind:'sm'},
  {id:'chess',title:'Schach',icon:'♟️',kind:'sm'},
  {id:'bs',title:'Schiffe versenken',icon:'🚢',kind:'sm'},
  {id:'mem',title:'Memory (2P)',icon:'🃏',kind:'sm'},
  {id:'hm',title:'Hangman (2P)',icon:'🔤',kind:'sm'},
  {id:'mm',title:'Mau-Mau',icon:'🂡',kind:'sm'}
];
let zcView='profile';
let zcName='';
let zcBoard={cat:'pr',game:'all'};

function zcLS(key,fallback){try{const s=localStorage.getItem(key);return s?JSON.parse(s):fallback;}catch(e){return fallback;}}
function zcState(){
  const st=smS('zentrale');
  if(!st.zc)st.zc={player:'',names:{},prog:{},days:{},bonus:{},today:null,list:[]};
  if(st.zTiers!==2){st.tiers=smClone(SM_TIERS_DEFAULT).map(t=>{t.steps=t.steps.map(x=>({rp:x.rp*3,icon:x.icon}));return t;});st.zTiers=2;smSave('zentrale');}
  return st;
}
function zcKey(n){return (n||'').trim().toLowerCase();}
function zcToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function zcYesterday(){const d=new Date(Date.now()-86400000);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

/* ── Daten aller Spiele einheitlich lesen ── */
function zcGameData(g){
  if(g.kind==='kniffel'){
    const hof=zcLS('zf_kniffel_halloffame',{}),rank=zcLS('zf_kniffel_rank',{}),sh=zcLS('zf_kniffel_seasonhistory',[]);
    return{hof,rank,seasons:sh.map(h=>({season:h.season,results:(h.results||[]).map(r=>({name:r.name,pr:r.pr!=null?r.pr:r.rp,label:r.label,icon:r.icon,color:r.color}))})),
      seasonNo:(zcLS('zf_kniffel_season',{number:1})||{}).number||1};
  }
  const st=smS(g.id);
  return{hof:st.hof,rank:st.rank,seasons:st.seasonHistory||[],seasonNo:st.season.number};
}
function zcRankInfo(g,pr){
  if(g.kind==='kniffel'){
    if(typeof kniffRankTiersLoad==='function')kniffRankTiersLoad();
    return typeof kniffRankInfo==='function'?kniffRankInfo(pr):{label:'–',divisionIcon:'🏅',tier:{icon:'🏅',color:'var(--text-3)'}};
  }
  const i=smRankInfo(g.id,pr);return{label:i.label,divisionIcon:i.icon,tier:i.tier};
}
function zcNormRec(g,rec){
  if(!rec)return null;
  const games=rec.games||0,wins=rec.wins||0;
  return{games,wins,losses:g.kind==='kniffel'?games-wins:(rec.losses||0),draws:g.kind==='kniffel'?0:(rec.draws||0),
    bestStreak:rec.bestStreak||0,streak:rec.streak||0,cupWins:rec.cupWins||0,prEarned:rec.prEarned||0,prLost:rec.prLost||0,lastPlayed:rec.lastPlayed||0,aiExpertWins:rec.aiExpertWins||0};
}
function zcAllNames(){
  const seen={},out=[];
  ZC_GAMES.forEach(g=>Object.keys(zcGameData(g).hof).forEach(n=>{const k=zcKey(n);if(k&&!seen[k]){seen[k]=1;out.push(n);}}));
  return out.sort((a,b)=>a.localeCompare(b,'de'));
}
function zcFindKey(hof,name){const k=zcKey(name);return Object.keys(hof).find(n=>zcKey(n)===k);}
function zcAggregate(name){
  const st=zcState(),k=zcKey(name);
  const rows=[];
  let T={games:0,wins:0,losses:0,draws:0,bestStreak:0,cups:0,pr:0,prEarned:0,prLost:0,last:0};
  ZC_GAMES.forEach(g=>{
    const d=zcGameData(g),n=zcFindKey(d.hof,name);if(n==null)return;
    const r=zcNormRec(g,d.hof[n]);const pr=d.rank[zcFindKey(d.rank,name)]||0;
    const seasonRows=[];
    d.seasons.forEach(sh=>{const x=(sh.results||[]).find(z=>zcKey(z.name)===k);if(x)seasonRows.push({season:sh.season,pr:x.pr,label:x.label,icon:x.icon,color:x.color});});
    rows.push({g,r,pr,info:zcRankInfo(g,pr),seasonRows,seasonNo:d.seasonNo});
    T.games+=r.games;T.wins+=r.wins;T.losses+=r.losses;T.draws+=r.draws;T.bestStreak=Math.max(T.bestStreak,r.bestStreak);T.cups+=r.cupWins;
    T.pr+=pr;T.prEarned+=r.prEarned;T.prLost+=r.prLost;T.last=Math.max(T.last,r.lastPlayed);
  });
  const bonus=st.zc.bonus[k]||0,total=T.pr+bonus,dd=st.zc.days[k]||{};
  return{rows,T,bonus,total,wonGames:rows.filter(x=>x.r.wins>0).length,expertWins:rows.reduce((q,x)=>q+(x.r.aiExpertWins||0),0),
    tierIdx:smRankInfo('zentrale',total).tierIdx,days:dd.best||dd.count||0,
    champWins:(st.zc.champHistory||[]).filter(h=>h.winners.length===1&&zcKey(h.players[h.winners[0]])===k).length,
    seasonWins:(st.zc.seasons||[]).filter(q=>q.winner&&zcKey(q.winner)===k).length};
}
/* Gesamtrang: EIN Rang über alle Spiele hinweg (Summe aller Spiel-PR + Bonus), statt eines eigenen Rangs je Spiel. */
function zcOverallTotal(name){try{return zcAggregate(name).total;}catch(e){return 0;}}
function zcOverallInfo(name){return smRankInfo('zentrale',zcOverallTotal(name));}
function zcOverallBadge(name,compact){return smRankBadge('zentrale',zcOverallTotal(name),compact);}

/* ── Tabs ── */
function zcInit(){
  zcState();zcSeasonAutoCheck();
  if(!zcName)zcName=zcState().zc.player||'';
  zcShow(zcView);
}
/* Kopf der Spielzentrale: Titel + aktueller Spieler mit Rang und Coins */
function zcRenderHead(){
  const el=document.getElementById('zc-head');if(!el)return;
  let name='';try{name=(zcState().zc.player||'').trim();}catch(e){}
  let chips='';
  if(name){
    try{
      const ri=smRankInfo('zentrale',zcOverallTotal(name)),coins=typeof zcCoinsOf==='function'?zcCoinsOf(name):0;
      chips=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:14px;background:rgba(255,255,255,0.2);font-size:12px;font-weight:700">${ri.icon} ${escHtml(ri.label)}</span>
        <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:14px;background:rgba(255,255,255,0.2);font-size:12px;font-weight:700">🪙 ${coins}</span></div>`;
    }catch(e){}
  }
  el.innerHTML=`<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:16px 18px;margin-bottom:14px;border-radius:18px;background:linear-gradient(120deg,var(--accent),#7c4dff 60%,#e040fb);color:#fff;box-shadow:0 6px 20px rgba(124,77,255,0.25)">
    <div style="font-size:40px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">🎮</div>
    <div style="flex:1;min-width:160px"><div style="font-size:21px;font-weight:800;line-height:1.15;letter-spacing:-0.3px">Spielzentrale</div><div style="font-size:12px;opacity:0.9;margin-top:2px">Ränge, Challenges, Saison, Shop und mehr – alles an einem Ort</div></div>
    ${chips}</div>`;
}
function zcShow(v){
  zcView=v;zcRenderHead();
  ['profile','board','chal','cmp','champ','season','replays'].forEach(x=>{
    document.getElementById('zc-tab-'+x)?.classList.toggle('active',x===v);
    const e=document.getElementById('zc-view-'+x);if(e)e.style.display=x===v?'block':'none';
  });
  if(v==='profile')zcRenderProfile();
  if(v==='board')zcRenderBoard();
  if(v==='chal'){if(zcName)zcState().zc.player=zcName;zcRenderChallenges();}
  if(v==='cmp'){if(!zcCmp.a&&zcName)zcCmp.a=zcName;zcRenderCompare();}
  if(v==='champ')zcRenderChamp();
  if(v==='season')zcRenderSeason();
  if(v==='replays')zcRenderReplays();
}
function zcOpenProfile(name){zcName=name;zcShow('profile');}
function zcSearch(v){zcName=(v||'').trim();zcRenderProfile();}

/* ── 1: Gesamtprofil ── */
function zcTile(label,value,sub){return smTile(label,value,sub);}
function zcRenderProfile(){
  const dl=document.getElementById('zc-names');if(dl)dl.innerHTML=zcAllNames().map(n=>`<option value="${escHtml(n)}"></option>`).join('');
  const inp=document.getElementById('zc-profile-input');if(inp&&document.activeElement!==inp)inp.value=zcName;
  const wrap=document.getElementById('zc-profile-result');if(!wrap)return;
  if(!zcName){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Spielernamen eingeben (oder in der Bestenliste auf einen Namen tippen), um das Gesamtprofil über alle Spiele zu sehen.</div>`;return;}
  const a=zcAggregate(zcName);
  if(!a.rows.length){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Kein Spieler „${escHtml(zcName)}" in einem Spiel gefunden.</div>`;return;}
  const T=a.T,wr=T.games?Math.round(T.wins/T.games*100):0;
  const fav=[...a.rows].sort((x,y)=>y.r.games-x.r.games)[0];
  const best=[...a.rows].filter(x=>x.r.games>=3).sort((x,y)=>(y.r.wins/y.r.games)-(x.r.wins/x.r.games))[0];
  const st=zcState(),days=st.zc.days[zcKey(zcName)]||{count:0};
  const sec=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:16px 0 6px">${t}</div>`;
  const displayName=(a.rows[0]&&Object.keys(zcGameData(a.rows[0].g).hof).find(n=>zcKey(n)===zcKey(zcName)))||zcName;
  const ri=smRankInfo('zentrale',a.total);
  wrap.innerHTML=`
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;overflow:hidden;margin-bottom:12px">
      <div style="height:74px;background:${(typeof zcBannerBg==='function'&&zcBannerBg(displayName))||'linear-gradient(120deg,var(--accent),'+ri.tier.color+')'}"></div>
      <div style="padding:0 16px 16px">
        <div style="display:flex;align-items:flex-end;gap:14px;margin-top:-34px">
          <div style="flex:none;padding:4px;background:var(--surface);border-radius:50%">${typeof zcAvatarHtml==='function'?zcAvatarHtml(displayName,68):''}</div>
          <div style="flex:1;min-width:0;padding-bottom:4px">
            <div style="font-size:20px;font-weight:800;color:var(--text);line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(displayName)}</div>
            <div style="font-size:12px;color:var(--text-2);min-height:16px">${typeof zcTitleOf==='function'&&zcTitleOf(displayName)?zcTitleOf(displayName):'&nbsp;'}</div>
          </div>
          ${typeof zcCoinsOf==='function'?`<div style="flex:none;padding:5px 11px;border-radius:14px;background:var(--bg);border:0.5px solid var(--divider);font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">🪙 ${zcCoinsOf(displayName)}</div>`:''}
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:14px;padding:10px 12px;border-radius:12px;background:var(--bg);border-left:4px solid ${ri.tier.color}">
          <span style="font-size:34px;line-height:1">${ri.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-size:15px;color:${ri.tier.color}">${escHtml(ri.label)}</b><span style="font-size:11px;color:var(--text-3)">${a.total} PR</span></div>
            <div style="height:8px;background:var(--divider);border-radius:4px;overflow:hidden;margin-top:6px"><div style="height:100%;width:${Math.round(ri.progress*100)}%;background:${ri.tier.color};border-radius:4px"></div></div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--text-3);margin-top:8px">Gesamt-Rang aus der Summe aller aktuellen Spiel-PR (${T.pr}) + Challenge-Bonus (${a.bonus}).</div>
      ${typeof zcWrappedOpen==='function'?`<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><button class="timer-btn" onclick="zcWrappedOpen('month','${escHtml(displayName).replace(/'/g,"\\'")}')" style="padding:6px 12px;font-size:11px">📸 Monatsrückblick</button><button class="timer-btn" onclick="zcWrappedOpen('year','${escHtml(displayName).replace(/'/g,"\\'")}')" style="padding:6px 12px;font-size:11px">📸 Jahresrückblick</button></div>`:''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:8px">
      ${[['🎮',T.games,'Spiele',`${T.wins} S · ${T.draws} U · ${T.losses} N`],['🎯',wr+'%','Siegchance',`in ${a.rows.length} Spiel${a.rows.length===1?'':'en'}`],['🔥',T.bestStreak,'Längste Serie','Siege in Folge'],['📈',(T.prEarned-T.prLost>0?'+':'')+(T.prEarned-T.prLost),'PR netto',`+${T.prEarned} / −${T.prLost}`]].map(([ic,v,l,sub])=>`<div style="background:linear-gradient(160deg,var(--active-bg),var(--surface));border:0.5px solid var(--divider);border-radius:14px;padding:12px 8px;text-align:center"><div style="font-size:18px">${ic}</div><div style="font-size:24px;font-weight:800;color:var(--text);line-height:1.15">${v}</div><div style="font-size:11px;font-weight:700;color:var(--text-2)">${l}</div><div style="font-size:10px;color:var(--text-3);margin-top:1px">${sub}</div></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
      ${zcTile('Cups gewonnen',T.cups,'über alle Spiele')}
      ${zcTile('Challenge-Serie',days.count||0,`Tage · Bonus ${a.bonus} PR`)}
      ${zcTile('Lieblingsspiel',fav?fav.g.icon+' '+escHtml(fav.g.title):'–',fav?fav.r.games+' Partien':'')}
      ${zcTile('Stärkstes Spiel',best?best.g.icon+' '+escHtml(best.g.title):'–',best?Math.round(best.r.wins/best.r.games*100)+'% Siege':'min. 3 Partien')}
      ${zcTile('Zuletzt gespielt',T.last?new Date(T.last).toLocaleDateString('de-DE'):'–','')}
    </div>
    ${zcRivalsHtml(displayName)?sec('⚔️ Rivalen (mind. 2 gemeinsame Partien)')+zcRivalsHtml(displayName):''}
    ${sec('Ränge & Statistik pro Spiel')}
    ${a.rows.map(x=>`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">${x.g.icon}</span><span style="flex:1;font-size:13px;font-weight:700;color:var(--text)">${escHtml(x.g.title)}</span><span style="font-size:11px;color:var(--text-3)">${x.r.games} Spiele · ${x.r.games?Math.round(x.r.wins/x.r.games*100):0}% · Serie ${x.r.bestStreak}</span></div>
      <div style="margin-top:6px">${smRankBadgeFor(x)}</div>
    </div>`).join('')}
    ${sec('Ränge pro Saison')}
    ${a.rows.map(x=>`<details style="margin-bottom:6px"><summary style="cursor:pointer;font-size:12px;color:var(--text-2)">${x.g.icon} ${escHtml(x.g.title)} <span style="color:var(--text-3)">(${x.seasonRows.length+1} Saison${x.seasonRows.length?'en':''})</span></summary><div style="margin-top:6px">
      ${[{season:x.seasonNo,cur:true,label:x.info.label,icon:x.info.divisionIcon,color:x.info.tier.color,pr:x.pr},...x.seasonRows].map(s=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 10px;border-left:3px solid ${s.color};background:var(--bg);border-radius:6px;margin-bottom:3px"><span style="font-size:11px;color:var(--text-3);width:62px">Saison ${s.season}${s.cur?' ⏳':''}</span><span>${s.icon}</span><span style="flex:1;font-size:12px;font-weight:600;color:${s.color}">${escHtml(s.label)}</span><span style="font-size:11px;color:var(--text-3)">${s.pr} PR</span></div>`).join('')}
    </div></details>`).join('')}
    ${zcTrophiesHtml(displayName)}`;
}
/* ── Rivalen: Bilanz gegen echte Mitspieler, über alle 2-Spieler-Spiele hinweg ── */
function zcRivalStats(name){
  const agg={};
  ZC_GAMES.filter(g=>g.kind==='sm'&&g.id!=='mono').forEach(g=>{
    const d=zcGameData(g),n=zcFindKey(d.hof,name);if(n==null)return;
    (d.hof[n].history||[]).forEach(x=>{
      if(x.ai||!x.opp)return;
      const rk=zcKey(x.opp);if(!rk)return;
      const r=agg[rk]||(agg[rk]={name:x.opp,w:0,d:0,l:0});
      if(x.res==='W')r.w++;else if(x.res==='L')r.l++;else r.d++;
    });
  });
  return Object.values(agg).map(r=>({...r,games:r.w+r.d+r.l})).sort((a,b)=>b.games-a.games);
}
function zcRivalsHtml(name){
  const rivals=zcRivalStats(name).filter(r=>r.games>=2);
  if(!rivals.length)return'';
  const byNet=[...rivals].sort((a,b)=>(a.w-a.l)-(b.w-b.l));
  const nemesis=byNet[0].l>byNet[0].w?byNet[0]:null;
  const favorite=byNet[byNet.length-1].w>byNet[byNet.length-1].l?byNet[byNet.length-1]:null;
  const tag=(icon,label,r,color)=>r?`<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${color};background:var(--bg);border-radius:12px;padding:3px 10px;margin:0 6px 6px 0">${icon} ${label}: ${escHtml(r.name)} (${r.w}:${r.l})</span>`:'';
  const rows=rivals.slice(0,5).map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 10px;background:var(--bg);border-radius:6px;margin-bottom:3px">
    <span onclick="zcOpenProfile('${escHtml(r.name).replace(/'/g,"\\'")}')" style="flex:1;font-size:12px;color:var(--text);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.name)}</span>
    <span style="font-size:11px;color:var(--text-3)">${r.games} Partien</span>
    <span style="font-size:11px;font-weight:700;color:var(--text-2);white-space:nowrap">${r.w}S · ${r.d}U · ${r.l}N</span>
  </div>`).join('');
  return`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:10px 12px;margin-bottom:6px">
    <div style="margin-bottom:8px">${tag('😈','Nemesis',nemesis,'#e53935')}${tag('🎯','Lieblingsgegner',favorite,'#2e7d32')}</div>
    ${rows}
  </div>`;
}
function smRankBadgeFor(x){
  const info=x.info;
  return`<div style="display:flex;align-items:center;gap:6px"><span style="font-size:15px">${info.divisionIcon}</span><span style="font-size:11px;font-weight:700;color:${info.tier.color};white-space:nowrap">${escHtml(info.label)}</span><span style="font-size:10px;color:var(--text-3)">${x.pr} PR</span></div>`;
}

/* ── 2: Bestenliste ── */
const ZC_CATS={
  pr:{label:'PR / Rang',val:a=>a.pr,fmt:v=>v+' PR',min:0},
  wins:{label:'Siege',val:a=>a.wins,fmt:v=>v+' Siege',min:1},
  rate:{label:'Siegquote',val:a=>a.games>=5?Math.round(a.wins/a.games*100):-1,fmt:v=>v+'%',min:0,note:'mind. 5 Partien'},
  streak:{label:'Beste Serie',val:a=>a.bestStreak,fmt:v=>v+' in Folge',min:1},
  cups:{label:'Cups',val:a=>a.cups,fmt:v=>v+' Cups',min:1},
  games:{label:'Partien',val:a=>a.games,fmt:v=>v+' Partien',min:1}
};
function zcSetBoard(key,val){zcBoard[key]=val;zcRenderBoard();}
function zcBoardRows(){
  const cat=ZC_CATS[zcBoard.cat],out=[];
  zcAllNames().forEach(n=>{
    const a=zcAggregate(n);
    let src=a.rows;
    if(zcBoard.game!=='all')src=a.rows.filter(x=>x.g.id===zcBoard.game);
    if(!src.length)return;
    const agg={games:0,wins:0,bestStreak:0,cups:0,pr:0};
    src.forEach(x=>{agg.games+=x.r.games;agg.wins+=x.r.wins;agg.bestStreak=Math.max(agg.bestStreak,x.r.bestStreak);agg.cups+=x.r.cupWins;agg.pr+=x.pr;});
    if(zcBoard.game==='all')agg.pr=a.total;
    const v=cat.val(agg);
    if(v<cat.min)return;
    out.push({name:n,v,agg,games:agg.games});
  });
  return out.sort((x,y)=>y.v-x.v||y.games-x.games).slice(0,20);
}
function zcRenderBoard(){
  const cat=ZC_CATS[zcBoard.cat];
  const chip=(on,label,fn)=>`<button onclick="${fn}" style="padding:6px 12px;font-size:11px;font-weight:600;border-radius:16px;border:0.5px solid ${on?'var(--accent)':'var(--divider)'};background:${on?'var(--accent)':'var(--surface)'};color:${on?'#fff':'var(--text-2)'};cursor:pointer;white-space:nowrap">${label}</button>`;
  const rows=zcBoardRows();
  const medals=['🥇','🥈','🥉'],mcol=['#ffc107','#b0bec5','#cd7f32'];
  const av=(n,sz)=>typeof zcAvatarHtml==='function'?zcAvatarHtml(n,sz):'';
  const ttl=n=>typeof zcTitleOf==='function'&&zcTitleOf(n)?`<div style="font-size:10px;margin-top:1px">${zcTitleOf(n)}</div>`:'';
  const rankOf=r=>zcBoard.cat==='pr'?(zcBoard.game==='all'?smRankInfo('zentrale',r.v):zcRankInfo(ZC_GAMES.find(g=>g.id===zcBoard.game),r.v)):null;
  // Podest: Platz 2 – 1 – 3
  const pod=i=>{
    const r=rows[i];if(!r)return'<div style="flex:1"></div>';
    const h=[96,68,52][i],ri=rankOf(r),first=i===0;
    return`<div onclick="zcOpenProfile(zcBoardRows()[${i}].name)" style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;cursor:pointer">
      <div style="font-size:${first?26:20}px;line-height:1;${first?'filter:drop-shadow(0 2px 6px rgba(255,193,7,0.6))':''}">${medals[i]}</div>
      <div style="margin:4px 0 4px">${av(r.name,first?58:46)}</div>
      <div style="font-size:${first?14:12}px;font-weight:800;color:var(--text);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px">${escHtml(r.name)}</div>
      ${ttl(r.name)}
      <div style="font-size:${first?15:13}px;font-weight:800;color:${mcol[i]};margin:3px 0 5px">${cat.fmt(r.v)}</div>
      <div style="width:100%;height:${h}px;border-radius:10px 10px 0 0;background:linear-gradient(180deg,${mcol[i]}66,${mcol[i]}14);border:1px solid ${mcol[i]}88;border-bottom:none;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-size:${first?26:20}px;font-weight:900;color:${mcol[i]}">${i===0?1:i===1?2:3}</div>
    </div>`;
  };
  const top=rows[0]?rows[0].v:0;
  const rest=rows.slice(3).map((r,j)=>{
    const i=j+3,ri=rankOf(r),pct=top>0?Math.max(3,Math.round(Math.max(r.v,0)/top*100)):0;
    return`<div onclick="zcOpenProfile(zcBoardRows()[${i}].name)" style="position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:8px 12px;margin-bottom:6px;cursor:pointer;transition:transform .12s,box-shadow .12s" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="position:absolute;left:0;bottom:0;height:3px;width:${pct}%;background:${ri?ri.tier.color:'var(--accent)'};opacity:0.7"></div>
      ${typeof zcBannerBar==='function'?zcBannerBar(r.name):''}<span style="width:26px;font-size:12px;font-weight:700;text-align:center;color:var(--text-3)">${i+1}.</span>${av(r.name,30)}
      <span style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(r.name)}${typeof zcTitleOf==='function'&&zcTitleOf(r.name)?' <span style="font-size:11px">'+zcTitleOf(r.name)+'</span>':''}</div>
      ${ri?`<div style="margin-top:3px">${zcBoard.game==='all'?smRankBadge('zentrale',r.v,true):smRankBadgeFor({info:ri,pr:r.v})}</div>`:`<div style="font-size:10px;color:var(--text-3)">${r.agg.games} Partien</div>`}</span>
      <span style="font-size:14px;font-weight:800;color:var(--text)">${cat.fmt(r.v)}</span></div>`;
  }).join('');
  document.getElementById('zc-board').innerHTML=`
    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">Die gemeinsame Hall of Fame für alle Spiele – nach Kategorie und optional nach einem einzelnen Spiel filterbar. Auf einen Namen tippen öffnet das volle Profil.</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${Object.entries(ZC_CATS).map(([k,c])=>chip(zcBoard.cat===k,c.label,`zcSetBoard('cat','${k}')`)).join('')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${chip(zcBoard.game==='all','Alle Spiele',"zcSetBoard('game','all')")}${ZC_GAMES.map(g=>chip(zcBoard.game===g.id,g.icon+' '+g.title,`zcSetBoard('game','${g.id}')`)).join('')}</div>
    ${cat.note?`<div style="font-size:10px;color:var(--text-3);margin-bottom:6px">${cat.note}</div>`:''}
    ${zcBoard.cat==='pr'&&zcBoard.game==='all'?`<div style="font-size:10px;color:var(--text-3);margin-bottom:6px">Gesamt-PR = Summe aller aktuellen Spiel-PR + Challenge-Bonus</div>`:''}
    ${rows.length?`<div style="display:flex;align-items:flex-end;gap:8px;padding:14px 6px 0;margin-bottom:12px;border-radius:14px;background:radial-gradient(ellipse at 50% 100%,var(--active-bg),transparent 70%)">${pod(1)}${pod(0)}${pod(2)}</div>${rest}`
      :`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Noch keine Einträge – spiel ein paar Partien.</div>`}`;
}

/* ── 3: Tägliche Challenges ── */
function zcRng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296;};}
function zcGenerate(dateStr){
  const rnd=zcRng('zc-'+dateStr),pick=a=>a[Math.floor(rnd()*a.length)];
  const games=ZC_GAMES.filter(g=>g.id!=='mem'&&g.id!=='hm');
  const pool=[
    ()=>{const n=pick([2,3,4]);return{type:'win',target:n,reward:n*5,text:`Gewinne ${n} Partien (beliebiges Spiel)`};},
    ()=>{const n=pick([3,4,5]);return{type:'play',target:n,reward:n*3,text:`Spiele ${n} Partien`};},
    ()=>{const n=pick([1,2]);return{type:'winhard',target:n,reward:n*12,text:`Gewinne ${n}× gegen die schwere KI`};},
    ()=>{const g=pick(games),n=pick([1,2]);return{type:'wingame',game:g.id,target:n,reward:n*8,text:`Gewinne ${n}× in ${g.title}`};},
    ()=>{const n=pick([2,3]);return{type:'streak',target:n,reward:n*7,text:`Erreiche eine Siegesserie von ${n}`};},
    ()=>{const n=pick([2,3]);return{type:'diverse',target:n,reward:n*6,text:`Spiele ${n} verschiedene Spiele`};},
    ()=>({type:'cup',target:1,reward:10,text:'Spiele eine Cup-Runde'})
  ];
  const chosen=[],used=new Set();
  while(chosen.length<3&&used.size<pool.length){const i=Math.floor(rnd()*pool.length);if(used.has(i))continue;used.add(i);chosen.push(pool[i]());}
  return chosen;
}
function zcEnsureToday(){
  const st=zcState(),today=zcToday();
  if(st.zc.today!==today){st.zc.today=today;st.zc.list=zcGenerate(today);st.zc.prog={};smSave('zentrale');}
  return st.zc;
}
function zcProg(k){
  const z=zcEnsureToday();
  if(!z.prog[k])z.prog[k]={vals:[0,0,0],sets:[[],[],[]],done:[false,false,false],all:false};
  return z.prog[k];
}
function zcEvent(ev){
  try{
    if(!ev||!ev.name)return;
    const z=zcEnsureToday(),k=zcKey(ev.name),ps=zcProg(k);
    z.names[k]=ev.name;if(!z.player)z.player=ev.name;
    z.list.forEach((c,i)=>{
      if(ps.done[i])return;
      if(c.type==='win'&&ev.res==='W')ps.vals[i]++;
      else if(c.type==='play')ps.vals[i]++;
      else if(c.type==='winhard'&&ev.res==='W'&&(ev.diff==='hard'||ev.diff==='expert'))ps.vals[i]++;
      else if(c.type==='wingame'&&ev.res==='W'&&ev.game===c.game)ps.vals[i]++;
      else if(c.type==='streak')ps.vals[i]=Math.max(ps.vals[i],ev.streak||0);
      else if(c.type==='diverse'){if(!ps.sets[i].includes(ev.game))ps.sets[i].push(ev.game);ps.vals[i]=ps.sets[i].length;}
      else if(c.type==='cup'&&ev.cup)ps.vals[i]++;
      if(ps.vals[i]>=c.target){
        ps.done[i]=true;z.bonus[k]=(z.bonus[k]||0)+c.reward;sfx('chime');
        if(typeof showToast==='function')showToast(`🎯 Challenge geschafft: ${c.text} (+${c.reward} PR)`,3500);
      }
    });
    if(!ps.all&&ps.done.every(Boolean)){
      ps.all=true;
      const d=z.days[k]||{count:0,last:null};
      d.count=d.last===zcYesterday()?d.count+1:1;d.last=zcToday();d.best=Math.max(d.best||0,d.count);z.days[k]=d;
      const extra=15+Math.min(d.count,7)*2;z.bonus[k]=(z.bonus[k]||0)+extra;
      if(typeof showToast==='function')setTimeout(()=>showToast(`🔥 Alle Tages-Challenges! Serie ${d.count} Tag${d.count===1?'':'e'} · +${extra} PR`,4000),600);
    }
    smSave('zentrale');
    setTimeout(()=>zcTrophyCheck(ev.name),400);
  }catch(e){}
}
function zcSetPlayer(v){zcState().zc.player=(v||'').trim();smSave('zentrale');zcRenderChallenges();}
function zcRenderChallenges(){
  const z=zcEnsureToday(),name=(z.player||'').trim();
  const dl=document.getElementById('zc-names2');if(dl)dl.innerHTML=zcAllNames().map(n=>`<option value="${escHtml(n)}"></option>`).join('');
  const inp=document.getElementById('zc-chal-input');if(inp&&document.activeElement!==inp)inp.value=name;
  const wrap=document.getElementById('zc-chal-list');if(!wrap)return;
  const k=zcKey(name),ps=name?zcProg(k):{vals:[0,0,0],done:[false,false,false],all:false};
  const d=z.days[k]||{count:0},bonus=z.bonus[k]||0;
  const now=new Date(),midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1),left=midnight-now;
  const hh=Math.floor(left/3600000),mm=Math.floor(left%3600000/60000);
  const doneN=ps.done.filter(Boolean).length,total=z.list.length||3,all=doneN===total;
  const ICON={win:'🏆',play:'🎮',winhard:'🤖',wingame:'🎯',streak:'🔥',diverse:'🎲',cup:'🏅'};
  const ring=(pct,col,inner)=>`<div style="position:relative;width:64px;height:64px;flex:none;border-radius:50%;background:conic-gradient(${col} ${pct*3.6}deg,rgba(255,255,255,0.28) 0);display:flex;align-items:center;justify-content:center"><div style="width:52px;height:52px;border-radius:50%;background:${all?'#2e7d32':'var(--accent)'};display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;color:#fff">${inner}</div></div>`;
  const dots=Array.from({length:7},(_,i)=>`<span title="Tag ${i+1}" style="width:9px;height:9px;border-radius:50%;background:${i<Math.min(d.count,7)?'#ffb300':'rgba(255,255,255,0.35)'}"></span>`).join('');
  wrap.innerHTML=`
    <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,${all?'#2e7d32,#66bb6a':'var(--accent),#ab47bc'});color:#fff;margin-bottom:12px">
      ${ring(Math.round(doneN/total*100),'#fff',doneN+'/'+total)}
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">Tages-Challenges</div>
        <div style="font-size:18px;font-weight:800;line-height:1.2">${all?'Alles geschafft! 🎉':doneN+' von '+total+' erledigt'}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px"><span style="font-weight:700">🔥 ${d.count} Tag${d.count===1?'':'e'} Serie</span><span style="display:flex;gap:3px">${dots}</span></div>
        <div style="font-size:11px;opacity:0.9;margin-top:4px">⏱️ Neue Aufgaben in ${hh}h ${mm}min · ⭐ ${bonus} Bonus-PR gesamt</div>
      </div>
    </div>
    ${!name?`<div style="font-size:12px;color:var(--text-3);margin-bottom:10px">Gib oben deinen Spielernamen ein – Fortschritt zählt automatisch bei jeder Partie, die du mit diesem Namen spielst.</div>`:''}
    ${z.list.map((c,i)=>{const v=Math.min(ps.vals[i],c.target),pct=Math.round(v/c.target*100),dn=ps.done[i],col=dn?'#43a047':'var(--accent)';return`<div style="display:flex;align-items:center;gap:12px;background:${dn?'linear-gradient(120deg,rgba(67,160,71,0.14),var(--surface))':'var(--surface)'};border:0.5px solid ${dn?'#43a047':'var(--divider)'};border-left:4px solid ${col};border-radius:14px;padding:12px 14px;margin-bottom:8px;${dn?'':''}">
      <div style="width:44px;height:44px;flex:none;border-radius:12px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:22px;${dn?'':'filter:grayscale(0.15)'}">${dn?'✅':(ICON[c.type]||'🎯')}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px"><span style="flex:1;font-size:13px;font-weight:700;color:var(--text)">${escHtml(c.text)}</span><span style="font-size:11px;font-weight:800;color:#fff;background:${col};border-radius:10px;padding:2px 8px;white-space:nowrap">+${c.reward} PR</span></div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px"><div style="flex:1;height:8px;background:var(--divider);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${col};border-radius:4px;transition:width .4s"></div></div><span style="font-size:11px;font-weight:700;color:var(--text-2)">${v}/${c.target}</span></div>
      </div></div>`;}).join('')}
    <div style="font-size:11px;color:var(--text-3);margin-top:8px;padding:8px 12px;background:var(--surface);border:0.5px dashed var(--divider);border-radius:10px">🎁 Alle 3 Challenges an einem Tag: Extra-Bonus 15 PR + 2 PR pro Serientag (max. 7). Bonus-PR zählen zum Gesamt-Rang.</div>`;
}

/* ── Start ── */
zcState();


/* ══════════════════════════════════
   Erweiterungen: Trophäen, Vergleich, Gesamt-Saison, Meisterschaft
══════════════════════════════════ */
const ZC_TROPHIES=[
  {id:'first',icon:'🎉',label:'Willkommen',desc:'Erste Partie gespielt',f:a=>[a.T.games,1]},
  {id:'g25',icon:'🎮',label:'Stammspieler',desc:'25 Partien gespielt',f:a=>[a.T.games,25]},
  {id:'g100',icon:'🏟️',label:'Dauerbrenner',desc:'100 Partien gespielt',f:a=>[a.T.games,100]},
  {id:'g500',icon:'🗿',label:'Legende der Halle',desc:'500 Partien gespielt',f:a=>[a.T.games,500]},
  {id:'w10',icon:'🥇',label:'Sieger',desc:'10 Siege insgesamt',f:a=>[a.T.wins,10]},
  {id:'w50',icon:'🏅',label:'Champion',desc:'50 Siege insgesamt',f:a=>[a.T.wins,50]},
  {id:'div3',icon:'🧭',label:'Allrounder',desc:'In 3 verschiedenen Spielen gewonnen',f:a=>[a.wonGames,3]},
  {id:'div5',icon:'🌍',label:'Universalgenie',desc:'In 5 verschiedenen Spielen gewonnen',f:a=>[a.wonGames,5]},
  {id:'div9',icon:'👑',label:'Alleskönner',desc:'In allen 9 Spielen gewonnen',f:a=>[a.wonGames,9]},
  {id:'played9',icon:'🎪',label:'Weltenbummler',desc:'Alle 9 Spiele mindestens einmal gespielt',f:a=>[a.rows.length,9]},
  {id:'streak5',icon:'🔥',label:'Siegesserie',desc:'5 Siege in Folge (in einem Spiel)',f:a=>[a.T.bestStreak,5]},
  {id:'streak10',icon:'🌋',label:'Unaufhaltsam',desc:'10 Siege in Folge',f:a=>[a.T.bestStreak,10]},
  {id:'expert',icon:'🧠',label:'KI-Bezwinger',desc:'Die „Sehr schwer"-KI besiegt',f:a=>[a.expertWins,1]},
  {id:'cups3',icon:'🏆',label:'Pokalsammler',desc:'3 Cups gewonnen',f:a=>[a.T.cups,3]},
  {id:'pr1000',icon:'💰',label:'PR-Sammler',desc:'1000 PR verdient (Karriere)',f:a=>[a.T.prEarned,1000]},
  {id:'rank',icon:'💎',label:'Aufsteiger',desc:'Gesamt-Rang „Gold" erreicht',f:a=>[a.tierIdx,2]},
  {id:'daily7',icon:'📅',label:'Tagesroutine',desc:'7 Tage Challenge-Serie',f:a=>[a.days,7]},
  {id:'champ',icon:'🏵️',label:'Meister',desc:'Eine Meisterschaft gewonnen',f:a=>[a.champWins,1]},
  {id:'season',icon:'🏁',label:'Saisonsieger',desc:'Eine Gesamt-Saison gewonnen',f:a=>[a.seasonWins,1]}
];
const ZC_TROPHY_BONUS=15;
function zcTrophyList(a){return ZC_TROPHIES.map(t=>{const [cur,target]=t.f(a);return{...t,cur,target,done:cur>=target};});}
function zcTrophyCheck(name){
  try{
    const z=zcState().zc,k=zcKey(name);if(!k)return;
    if(!z.trophies)z.trophies={};if(!z.trophies[k])z.trophies[k]=[];
    for(let round=0;round<3;round++){
      const a=zcAggregate(name),fresh=zcTrophyList(a).filter(t=>t.done&&!z.trophies[k].includes(t.id));
      if(!fresh.length)break;
      fresh.forEach(t=>{
        z.trophies[k].push(t.id);z.bonus[k]=(z.bonus[k]||0)+ZC_TROPHY_BONUS;
        if(typeof showToast==='function')showToast(`🏆 Trophäe freigeschaltet: ${t.icon} ${t.label} (+${ZC_TROPHY_BONUS} PR)`,3800);
        sfx('rankup');
      });
    }
    smSave('zentrale');
  }catch(e){}
}

/* ── Vergleich ── */
function zcCmpSet(which,v){zcCmp[which]=(v||'').trim();zcRenderCompare();}
let zcCmp={a:'',b:''};
function zcH2H(nameA,nameB){
  const ka=zcKey(nameA),kb=zcKey(nameB),per=[];
  ZC_GAMES.filter(g=>g.kind==='sm'&&g.id!=='mono'&&g.id!=='mm').forEach(g=>{
    const hof=smS(g.id).hof,n=Object.keys(hof).find(x=>zcKey(x)===ka);if(!n)return;
    const h=(hof[n].history||[]).filter(x=>!x.ai&&zcKey(x.opp)===kb);
    if(h.length)per.push({g,W:h.filter(x=>x.res==='W').length,D:h.filter(x=>x.res==='D').length,L:h.filter(x=>x.res==='L').length});
  });
  return per;
}
function zcRenderCompare(){
  const dl=document.getElementById('zc-names3');if(dl)dl.innerHTML=zcAllNames().map(n=>`<option value="${escHtml(n)}"></option>`).join('');
  ['a','b'].forEach(w=>{const i=document.getElementById('zc-cmp-'+w);if(i&&document.activeElement!==i)i.value=zcCmp[w];});
  const wrap=document.getElementById('zc-cmp-result');if(!wrap)return;
  if(!zcCmp.a||!zcCmp.b){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Zwei Spielernamen eingeben, um sie über alle Spiele zu vergleichen.</div>`;return;}
  const A=zcAggregate(zcCmp.a),B=zcAggregate(zcCmp.b);
  if(!A.rows.length||!B.rows.length){wrap.innerHTML=`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">${!A.rows.length?escHtml(zcCmp.a):escHtml(zcCmp.b)} wurde in keinem Spiel gefunden.</div>`;return;}
  const tro=n=>((zcState().zc.trophies||{})[zcKey(n)]||[]).length;
  const rate=x=>x.T.games?Math.round(x.T.wins/x.T.games*100):0;
  const metrics=[['Gesamt-PR',A.total,B.total],['Spiele',A.T.games,B.T.games],['Siege',A.T.wins,B.T.wins],['Siegquote',rate(A),rate(B),'%'],['Beste Serie',A.T.bestStreak,B.T.bestStreak],['PR verdient',A.T.prEarned,B.T.prEarned],['Cups',A.T.cups,B.T.cups],['Trophäen',tro(zcCmp.a),tro(zcCmp.b)]];
  const rk=x=>{const i=smRankInfo('zentrale',x.total);return`<span style="font-size:11px;font-weight:700;color:${i.tier.color}">${i.icon} ${escHtml(i.label)}</span>`;};
  const av=n=>typeof zcAvatarHtml==='function'?zcAvatarHtml(n,54):'';
  const h2h=zcH2H(zcCmp.a,zcCmp.b),tot=h2h.reduce((s,x)=>({W:s.W+x.W,D:s.D+x.D,L:s.L+x.L}),{W:0,D:0,L:0});
  const ca='var(--accent)',cb='#ff7043';
  // Kennzahlen als gespiegelte Balken (Gewinner farbig hervorgehoben)
  const metricRow=m=>{
    const [l,va,vb,u]=m,mx=Math.max(va,vb,1),wa=va>vb,wb=vb>va;
    return`<div style="padding:7px 0;border-top:0.5px solid var(--divider)">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:64px;text-align:right;font-size:14px;font-weight:${wa?800:500};color:${wa?ca:'var(--text)'}">${va}${u||''}</span>
        <span style="flex:1;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--text-3)">${l}</span>
        <span style="width:64px;font-size:14px;font-weight:${wb?800:500};color:${wb?cb:'var(--text)'}">${vb}${u||''}</span></div>
      <div style="display:flex;gap:4px;margin-top:4px;height:5px">
        <div style="flex:1;display:flex;justify-content:flex-end;background:var(--divider);border-radius:3px;overflow:hidden"><div style="width:${Math.round(va/mx*100)}%;background:${ca};opacity:${wa?1:0.45}"></div></div>
        <div style="flex:1;display:flex;background:var(--divider);border-radius:3px;overflow:hidden"><div style="width:${Math.round(vb/mx*100)}%;background:${cb};opacity:${wb?1:0.45}"></div></div></div></div>`;};
  const gameRow=g=>{
    const ra=A.rows.find(x=>x.g.id===g.id),rb=B.rows.find(x=>x.g.id===g.id);if(!ra&&!rb)return'';
    const f=r=>r?`${r.r.wins}/${r.r.games} <span style="font-weight:400;color:var(--text-3)">(${r.r.games?Math.round(r.r.wins/r.r.games*100):0}%)</span>`:'–';
    const wa=ra&&ra.r.games?ra.r.wins/ra.r.games:-1,wb=rb&&rb.r.games?rb.r.wins/rb.r.games:-1;
    return`<div style="display:flex;align-items:center;gap:8px;padding:7px 12px;border-top:0.5px solid var(--divider);font-size:12px">
      <span style="flex:1;min-width:0;color:var(--text-2)">${g.icon} ${escHtml(g.title)}</span>
      <span style="width:88px;text-align:center;font-weight:${wa>wb?800:500};color:${wa>wb?ca:'var(--text)'}">${f(ra)}</span>
      <span style="width:88px;text-align:center;font-weight:${wb>wa?800:500};color:${wb>wa?cb:'var(--text)'}">${f(rb)}</span></div>`;};
  const sec=t=>`<div style="font-size:12px;font-weight:800;color:var(--text-2);margin:20px 0 8px">${t}</div>`;
  const leadA=tot.W>tot.L,leadB=tot.L>tot.W;
  wrap.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-around;gap:6px;padding:16px 10px;border-radius:18px;background:linear-gradient(120deg,${ca}33,var(--surface) 50%,${cb}33);border:0.5px solid var(--divider)">
      <div style="flex:1;min-width:0;text-align:center"><div style="display:flex;justify-content:center">${av(zcCmp.a)}</div><div style="font-size:15px;font-weight:800;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(zcCmp.a)}</div>${rk(A)}<div style="font-size:11px;color:var(--text-3)">${A.total} PR</div></div>
      <div style="flex:none;font-size:22px;font-weight:900;color:var(--text-3);letter-spacing:0.05em">VS</div>
      <div style="flex:1;min-width:0;text-align:center"><div style="display:flex;justify-content:center">${av(zcCmp.b)}</div><div style="font-size:15px;font-weight:800;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(zcCmp.b)}</div>${rk(B)}<div style="font-size:11px;color:var(--text-3)">${B.total} PR</div></div>
    </div>
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;padding:6px 16px 10px;margin-top:12px">${metrics.map(metricRow).join('')}</div>
    ${sec('⚔️ Direktduelle (2-Spieler-Spiele)')}
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;padding:14px 16px">
      ${h2h.length?`<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:8px"><span style="font-size:30px;font-weight:900;color:${leadA?ca:'var(--text-2)'}">${tot.W}</span><span style="font-size:18px;color:var(--text-3)">:</span><span style="font-size:30px;font-weight:900;color:${leadB?cb:'var(--text-2)'}">${tot.L}</span></div>
      <div style="text-align:center;font-size:11px;color:var(--text-3);margin-bottom:8px">${escHtml(zcCmp.a)} vs ${escHtml(zcCmp.b)}${tot.D?` · ${tot.D} unentschieden`:''}</div>`
      +h2h.map(x=>`<div style="display:flex;font-size:12px;padding:4px 0;border-top:0.5px solid var(--divider);color:var(--text-2)"><span style="flex:1">${x.g.icon} ${escHtml(x.g.title)}</span><span>${x.W}S · ${x.D}U · ${x.L}N</span></div>`).join(''):`<div style="font-size:12px;color:var(--text-3);text-align:center">Noch keine gemeinsamen Partien.</div>`}
    </div>
    ${sec('🎮 Pro Spiel (Siege / Partien)')}
    <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;overflow:hidden">
      <div style="display:flex;gap:8px;padding:8px 12px;font-size:11px;font-weight:700;color:var(--text-3)"><span style="flex:1"></span><span style="width:88px;text-align:center;color:${ca}">${escHtml(zcCmp.a)}</span><span style="width:88px;text-align:center;color:${cb}">${escHtml(zcCmp.b)}</span></div>
      ${ZC_GAMES.map(gameRow).join('')}</div>`;
}

/* ── Trophäen im Profil ── */
function zcTrophiesHtml(name){
  const a=zcAggregate(name),list=zcTrophyList(a),got=list.filter(t=>t.done).length;
  return`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:16px 0 6px">Trophäen (${got}/${list.length}) · je +${ZC_TROPHY_BONUS} PR</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${list.map(t=>`<div title="${escHtml(t.desc)}" style="background:var(--surface);border:0.5px solid ${t.done?'var(--accent)':'var(--divider)'};border-radius:10px;padding:8px 10px;opacity:${t.done?1:0.5}">
    <div style="font-size:20px;filter:${t.done?'none':'grayscale(1)'}">${t.icon}</div>
    <div style="font-size:12px;font-weight:700;color:var(--text)">${escHtml(t.label)}</div>
    <div style="font-size:10px;color:var(--text-3)">${escHtml(t.desc)}</div>
    ${t.done?`<div style="font-size:10px;color:var(--accent);margin-top:2px">✓ freigeschaltet</div>`:`<div style="font-size:10px;color:var(--text-3);margin-top:2px">${Math.min(t.cur,t.target)} / ${t.target}</div>`}</div>`).join('')}</div>`;
}

/* ── Gesamt-Saison: endet immer automatisch zum Monatsende ── */
function zcMonthKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}
function zcMonthDaysLeft(){
  const n=new Date(),end=new Date(n.getFullYear(),n.getMonth()+1,1);
  return Math.max(0,Math.ceil((end-n)/86400000));
}
function zcSeasonAsk(){
  appConfirm('Saison in ALLEN Spielen beenden? Die Ränge aller Spiele werden archiviert und auf 0 PR zurückgesetzt. Die Top 3 der Gesamtwertung bekommen Bonus-PR.',()=>zcCloseAllSeasons(false));
}
function zcSeasonAutoCheck(){
  const z=zcState().zc;if(!z.seasonStart)z.seasonStart=Date.now();if(!z.seasonNo)z.seasonNo=1;
  if(!z.seasonMonth)z.seasonMonth=zcMonthKey(new Date(z.seasonStart));
  if(zcMonthKey()!==z.seasonMonth)zcCloseAllSeasons(true);
}
function zcCloseAllSeasons(auto){
  if(typeof zcPassAutoClaimAll==='function')zcPassAutoClaimAll();
  const z=zcState().zc;if(!z.seasonNo)z.seasonNo=1;if(!z.seasons)z.seasons=[];
  const standings=zcAllNames().map(n=>{const a=zcAggregate(n),i=smRankInfo('zentrale',a.T.pr);return{name:n,total:a.T.pr,label:i.label,icon:i.icon};}).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const per={};
  ZC_GAMES.forEach(g=>{const d=zcGameData(g);per[g.id]=Object.entries(d.rank).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>({name:e[0],pr:e[1]}));});
  ZC_GAMES.forEach(g=>{
    if(g.kind==='kniffel'){
      if(typeof kniffSeasonLoad==='function'&&typeof kniffSeasonArchiveAndReset==='function'){kniffRankTiersLoad();kniffSeasonLoad();kniffSeasonArchiveAndReset(true,true);}
    }else smSeasonArchive(g.id,true,true);
  });
  const rewards=[100,50,25];
  standings.slice(0,3).forEach((s,i)=>{const k=zcKey(s.name);z.bonus[k]=(z.bonus[k]||0)+rewards[i];});
  z.seasons.unshift({no:z.seasonNo,endedAt:Date.now(),standings:standings.slice(0,10),per,winner:standings[0]?standings[0].name:null});
  z.seasonNo++;z.seasonStart=Date.now();z.seasonMonth=zcMonthKey();
  smSave('zentrale');
  standings.slice(0,3).forEach(s=>zcTrophyCheck(s.name));
  sfx('win');
  showToast(`🏁 Gesamt-Saison ${z.seasonNo} gestartet${auto?' (automatisch)':''} ✓`,3500);
  if(typeof zcRenderSeason==='function')zcRenderSeason();
}
function zcRenderSeason(keepFocus){
  const wrap=document.getElementById('zc-season');if(!wrap)return;
  const z=zcState().zc;if(!z.seasonNo)z.seasonNo=1;if(!z.seasonStart)z.seasonStart=Date.now();
  if(keepFocus&&document.activeElement&&document.activeElement.id==='zc-season-input'){
    const pc=document.getElementById('zc-season-pass');if(pc){pc.innerHTML=zcPassHtml((z.player||'').trim());return;}
  }
  const days=Math.floor((Date.now()-z.seasonStart)/86400000),medals=['🥇','🥈','🥉'],mcol=['#ffc107','#b0bec5','#cd7f32'];
  const daysLeft=zcMonthDaysLeft(),last=(z.seasons||[])[0];
  const nowD=new Date(),monthDays=new Date(nowD.getFullYear(),nowD.getMonth()+1,0).getDate(),pctM=Math.round(Math.min(1,(monthDays-daysLeft)/monthDays)*100);
  const av=n=>typeof zcAvatarHtml==='function'?zcAvatarHtml(n,28):'';
  const sec=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:18px 0 8px">${t}</div>`;
  const stand=zcAllNames().map(n=>({n,t:zcAggregate(n).T.pr})).filter(x=>x.t>0).sort((a,b)=>b.t-a.t).slice(0,5);
  const topPr=stand[0]?stand[0].t:1;
  wrap.innerHTML=`
    ${typeof zcPlayerInput==='function'?zcPlayerInput('zc-season-input'):''}
    <div id="zc-season-pass">${typeof zcPassHtml==='function'?zcPassHtml((z.player||'').trim()):''}</div>
    <div style="padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#5c6bc0,var(--accent));color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">🏁 Gesamt-Saison</div><div style="font-size:24px;font-weight:800;line-height:1.15">Saison ${z.seasonNo}</div><div style="font-size:11px;opacity:0.9;margin-top:2px">läuft seit ${days} Tag${days===1?'':'en'}</div></div>
        <div style="text-align:right;flex:none"><div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">Endet in</div><div style="font-size:22px;font-weight:800;line-height:1.1">${daysLeft} Tag${daysLeft===1?'':'e'}</div></div>
      </div>
      <div style="height:6px;background:rgba(255,255,255,0.28);border-radius:3px;margin-top:12px;overflow:hidden"><div style="height:100%;width:${pctM}%;background:#fff;border-radius:3px"></div></div>
      <div style="font-size:10px;opacity:0.85;margin-top:5px">📅 Endet automatisch zum Monatsende</div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px">
      <button class="btn-generate" onclick="zcSeasonAsk()" style="width:auto;padding:10px 20px">🏁 Saison beenden</button>
      <div style="flex:1;min-width:200px;font-size:11px;color:var(--text-3)">Beendet gleichzeitig die Saison von Kniffel, Monopoly und allen anderen Spielen. Platz 1/2/3 der Gesamtwertung bekommen +100/+50/+25 Bonus-PR.</div>
    </div>
    ${sec('Aktuelle Gesamtwertung (Summe der Spiel-PR)')}
    ${stand.length?stand.map((x,i)=>`<div style="position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;background:${i<3?`linear-gradient(120deg,${mcol[i]}22,var(--surface) 60%)`:'var(--surface)'};border:0.5px solid ${i<3?mcol[i]:'var(--divider)'};border-radius:12px;padding:8px 12px;margin-bottom:6px">
      <div style="position:absolute;left:0;bottom:0;height:3px;width:${Math.max(4,Math.round(x.t/topPr*100))}%;background:${i<3?mcol[i]:'var(--accent)'};opacity:0.7"></div>
      <span style="width:26px;text-align:center;font-size:${i<3?18:12}px;color:var(--text-3)">${medals[i]||(i+1)+'.'}</span>${av(x.n)}<span style="flex:1;font-size:13px;font-weight:700;color:var(--text)">${escHtml(x.n)}</span><b style="color:${i<3?mcol[i]:'var(--text)'}">${x.t} PR</b></div>`).join(''):'<div style="font-size:12px;color:var(--text-3)">Noch keine PR vergeben.</div>'}
    ${sec('Saison-Abschlüsse')}
    ${(z.seasons||[]).length?(z.seasons||[]).map(s=>`<details style="margin-bottom:8px;background:var(--surface);border:0.5px solid var(--divider);border-left:4px solid var(--accent);border-radius:12px;padding:10px 14px"><summary style="cursor:pointer;font-size:13px;font-weight:700;list-style:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span>🏁 Saison ${s.no}</span><span style="font-weight:400;font-size:11px;color:var(--text-3)">${new Date(s.endedAt).toLocaleDateString('de-DE')}</span><span style="margin-left:auto;font-size:12px">👑 ${escHtml(s.winner||'–')}</span></summary>
      <div style="margin-top:10px">${s.standings.slice(0,5).map((x,i)=>`<div style="display:flex;gap:8px;font-size:12px;padding:3px 0;align-items:center"><span style="width:22px">${medals[i]||(i+1)+'.'}</span><span>${x.icon}</span><span style="flex:1">${escHtml(x.name)}</span><span style="font-weight:700">${x.total} PR</span></div>`).join('')}
      ${ZC_GAMES.map(g=>(s.per[g.id]||[]).length?`<div style="font-size:11px;color:var(--text-3);margin-top:4px">${g.icon} ${escHtml(g.title)}: ${s.per[g.id].map((p,i)=>(medals[i]||'')+escHtml(p.name)+' '+p.pr).join(' · ')}</div>`:'').join('')}</div></details>`).join(''):'<div style="font-size:12px;color:var(--text-3)">Noch keine Gesamt-Saison beendet.</div>'}`;
}

/* ── Saison-Pass: gekoppelt an die Ränge – jeder Rang-Aufstieg (z.B. Bronze 1 → Bronze 2) ist eine neue Stufe ── */
/* Stufe N = N-ter Rang-Aufstieg seit Bronze 1 (5 Ränge × 3 Divisionen + Meister = 15 Stufen).
   Jede Stufe gibt Coins + ein Pass-exklusives Item (nicht im Shop kaufbar); besitzt man es schon, gibt's den halben Preis. */
const ZC_PASS_LEVELS=[
  {coins:10},{coins:15},{coins:20},{coins:25},{coins:30},{coins:35},{coins:40},{coins:50},
  {coins:60},{coins:70},{coins:80},{coins:90},{coins:100},{coins:110},{coins:150}
]; // Items je Stufe: zcPassItemAt(i) in zc-shop.js (14 zufällige normale Artikel pro Saison + Titel „Saison-Champion")
const zcPassIt=i=>{const p=typeof zcPassItemAt==='function'?zcPassItemAt(i):null;return p?{kind:p.kind,id:p.id,it:zcItem(p.kind,p.id)}:null;};
function zcPassState(name){
  const z=zcState().zc,k=zcKey(name);if(!z.pass)z.pass={};
  if(!z.pass[k]||z.pass[k].season!==z.seasonNo)z.pass[k]={season:z.seasonNo,claimed:[]};
  return z.pass[k];
}
function zcPassPr(name){return zcAggregate(name).T.pr;}
/* Rang-Index: wie viele Divisionen liegen unter dem aktuellen Rang (Bronze 1 = 0) */
function zcPassRankIdx(name){
  const info=smRankInfo('zentrale',zcOverallTotal(name)),tiers=smS('zentrale').tiers;
  let idx=0;for(let i=0;i<info.tierIdx;i++)idx+=Math.max(1,smTierSteps(tiers[i]).length);
  return idx+(info.division?parseInt(info.division,10)-1:0);
}
/* Rang-Name, der für Stufe lvl (1-basiert) erreicht werden muss */
function zcPassRankLabel(lvl){
  const tiers=smS('zentrale').tiers;let idx=0;
  for(let i=0;i<tiers.length;i++){
    const n=Math.max(1,smTierSteps(tiers[i]).length);
    if(lvl<idx+n)return n>1?`${tiers[i].label} ${lvl-idx+1}`:tiers[i].label;
    idx+=n;
  }
  return tiers[tiers.length-1].label;
}
function zcPassLevel(name){
  const st=zcPassState(name),cur=zcPassRankIdx(name);
  if(cur>(st.peak||0))st.peak=cur; // einmal erreichte Stufen bleiben, auch bei Rang-Abstieg
  return Math.min(ZC_PASS_LEVELS.length,Math.max(cur,st.peak||0,st.claimed.length?Math.max(...st.claimed)+1:0));
}
function zcPassUnclaimed(name){
  const st=zcPassState(name),lvl=zcPassLevel(name),out=[];
  for(let i=0;i<lvl;i++)if(!st.claimed.includes(i))out.push(i);
  return out;
}
/* Eine Stufe abholen: Coins + Pass-Item (schon vorhanden → halber Preis). Gibt die Meldung zurück. */
function zcPassClaimOne(name,i){
  const st=zcPassState(name);
  if(st.claimed.includes(i)||i>=zcPassLevel(name))return null;
  st.claimed.push(i);
  const L=ZC_PASS_LEVELS[i],last=i===ZC_PASS_LEVELS.length-1;
  zcAddCoins(name,L.coins);
  let msg=`🎫 Stufe ${i+1}${last?' – MAXIMUM':''}: +${L.coins} 🪙`,gain=L.coins;
  const pi=zcPassIt(i),it=pi&&pi.it;
  if(it){
    const key=pi.kind+':'+pi.id,inv=zcp().inv,k=zcKey(name);
    if((inv[k]||[]).includes(key)){const back=Math.round((it.price||0)/2);zcAddCoins(name,back);gain+=back;msg+=` · ${it.icon} ${it.name} schon vorhanden → +${back} 🪙`;}
    else{(inv[k]=inv[k]||[]).push(key);msg+=` · ${it.icon} ${it.name} freigeschaltet`;}
  }
  return{msg,gain};
}
function zcPassClaim(i){
  const name=(zcState().zc.player||'').trim();if(!name)return;
  const r=zcPassClaimOne(name,i);if(!r)return;
  smSave('zentrale');sfx('coin');if(typeof smConfetti==='function')smConfetti();
  showToast('🎫 '+r.msg,3500);zcRenderSeason();if(typeof zcChipUpdate==='function')zcChipUpdate();
}
function zcPassClaimAll(){
  const name=(zcState().zc.player||'').trim();if(!name)return;
  const list=zcPassUnclaimed(name);if(!list.length)return;
  let coins=0,items=0;
  list.forEach(i=>{const r=zcPassClaimOne(name,i);if(r){coins+=r.gain;items++;}});
  smSave('zentrale');sfx('coin');if(typeof smConfetti==='function')smConfetti();
  showToast(`🎫 ${items} Stufe${items===1?'':'n'} abgeholt · insgesamt +${coins} 🪙 (plus neue Items)`,4000);
  zcRenderSeason();if(typeof zcChipUpdate==='function')zcChipUpdate();
}
/* Saisonende: alles Nicht-Abgeholte wird automatisch für alle Accounts eingefordert */
function zcPassAutoClaimAll(){
  try{
    const me=(zcState().zc.player||'').trim();let mine=0;
    zcAllNames().forEach(n=>{zcPassUnclaimed(n).forEach(i=>{const r=zcPassClaimOne(n,i);if(r&&zcKey(n)===zcKey(me))mine++;});});
    if(mine)setTimeout(()=>showToast(`🎫 ${mine} nicht abgeholte Pass-Stufe${mine===1?'':'n'} automatisch eingefordert`,4000),1500);
  }catch(e){}
}
function zcPassHtml(name){
  if(!name)return'<div style="font-size:12px;color:var(--text-3);text-align:center;padding:10px 0">Spieler wählen, um den Saison-Pass zu sehen.</div>';
  const lvl=zcPassLevel(name),st=zcPassState(name),unc=zcPassUnclaimed(name);
  const total=zcOverallTotal(name),info=smRankInfo('zentrale',total),max=ZC_PASS_LEVELS.length;
  const z=zcState().zc,daysLeft=typeof zcMonthDaysLeft==='function'?zcMonthDaysLeft():0;
  const pct=lvl>=max?100:Math.round(info.progress*100);
  const rc=it=>{try{return zcRarityOf(it);}catch(e){return{label:'',color:'#9e9e9e'};}};
  const nx=ZC_PASS_LEVELS[lvl],nxP=nx&&zcPassIt(lvl),nxIt=nxP&&nxP.it;
  const tiles=ZC_PASS_LEVELS.map((l,i)=>{
    const got=st.claimed.includes(i),ready=i<lvl&&!got,isNext=i===lvl,pi=zcPassIt(i),it=pi&&pi.it,r=it?rc(it):{color:'#9e9e9e',label:''};
    const bd=got?'var(--accent)':ready?r.color:isNext?r.color:'var(--divider)';
    return`<div ${ready?`onclick="zcPassClaim(${i})"`:''} title="${it?escHtml(it.name+' · '+r.label):''}" style="position:relative;padding:8px 4px 7px;border-radius:10px;text-align:center;background:${got?'var(--active-bg)':'var(--bg)'};border:1.5px solid ${bd};border-bottom:3px solid ${r.color};${ready?'cursor:pointer;':got||isNext?'':'opacity:0.62;'}${ready||isNext?`animation:zcPassPulse 1.6s ease-in-out infinite;--pc:${r.color};`:''}">
      <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:${got?'var(--accent)':ready||isNext?r.color:'var(--divider)'};color:${got||ready||isNext?'#fff':'var(--text-3)'};font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${got?'✓':i+1}</div>
      <div style="font-size:24px;line-height:1.2;margin-top:6px;${got||ready||isNext?'':'filter:grayscale(0.7)'}">${it?it.icon:'🎁'}</div>
      <div style="font-size:10px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px">${it?escHtml(it.name):'–'}</div>
      <div style="font-size:9px;color:var(--text-3);margin-top:1px">${escHtml(zcPassRankLabel(i+1))}</div>
      <div style="font-size:9px;font-weight:700;color:${got?'var(--accent)':ready?r.color:'var(--text-3)'}">${ready?'🎁 Abholen':'🪙 '+l.coins}</div>
    </div>`;
  }).join('');
  const nextBox=nx?`<div style="display:flex;align-items:center;gap:12px;background:var(--bg);border:0.5px solid var(--divider);border-left:4px solid ${nxIt?rc(nxIt).color:'var(--accent)'};border-radius:10px;padding:10px 12px;margin:12px 0 14px">
      <div style="font-size:34px;line-height:1">${nxIt?nxIt.icon:'🎁'}</div>
      <div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-3)">Nächste Belohnung · Stufe ${lvl+1}</div>
        <div style="font-size:14px;font-weight:800;color:var(--text)">${nxIt?escHtml(nxIt.name):'Überraschung'} <span style="font-size:10px;font-weight:700;color:${nxIt?rc(nxIt).color:'var(--text-3)'};text-transform:uppercase">${nxIt?rc(nxIt).label:''}</span></div>
        <div style="font-size:11px;color:var(--text-2)">+ ${nx.coins} 🪙 · bei Aufstieg zu <b>${escHtml(zcPassRankLabel(lvl+1))}</b></div></div></div>`
    :`<div style="text-align:center;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;padding:12px;margin:12px 0 14px;font-size:13px;font-weight:700;color:var(--accent)">🎉 Alle Stufen erreicht – Meister-Rang! 🏵️ Saison-Champion ist dein.</div>`;
  return`<style>@keyframes zcPassPulse{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 12px 1px var(--pc)}}</style>
  <div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:14px;padding:0 0 14px;margin-bottom:16px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:12px;padding:14px;background:linear-gradient(120deg,var(--accent),${info.tier.color});color:#fff">
      <div style="font-size:38px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">${info.icon}</div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">🎫 Saison-Pass · Saison ${z.seasonNo||1}</div>
        <div style="font-size:20px;font-weight:800;line-height:1.2">Stufe ${lvl} <span style="font-size:13px;font-weight:600;opacity:0.85">/ ${max}</span></div>
        <div style="font-size:11px;opacity:0.9">${escHtml(info.label)} · ${total} PR · noch ${daysLeft} Tag${daysLeft===1?'':'e'}</div></div>
    </div>
    <div style="padding:0 14px">
      <div style="display:flex;align-items:center;gap:8px;margin-top:14px">
        <span style="font-size:11px;font-weight:700;color:var(--text-2);white-space:nowrap">${escHtml(info.label)}</span>
        <div style="flex:1;height:10px;background:var(--divider);border-radius:5px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),${info.tier.color});border-radius:5px;transition:width .5s"></div></div>
        <span style="font-size:11px;font-weight:700;color:var(--text-2);white-space:nowrap">${nx?escHtml(zcPassRankLabel(lvl+1)):'MAX'}</span>
      </div>
      ${unc.length?`<button class="btn-generate" onclick="zcPassClaimAll()" style="width:100%;margin:12px 0 0;padding:11px">🎁 ${unc.length} Stufe${unc.length===1?'':'n'} abholen</button>`:''}
      ${nextBox}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:12px 8px;padding-top:6px">${tiles}</div>
      <div style="font-size:10px;color:var(--text-3);margin-top:12px;line-height:1.4">Jeder Rang-Aufstieg schaltet die nächste Stufe frei – tippe sie an, um sie abzuholen. Zum Saisonende wird alles Übrige automatisch eingefordert. Die Pass-Artikel sind bis Saisonende nicht im Shop erhältlich – besitzt du einen schon, bekommst du den halben Preis in Coins.</div>
    </div>
  </div>`;
}

/* ── Größere Feier bei echtem Rang-Aufstieg (Tier-Wechsel), statt nur eines Toasts ── */
function zcRankUpCelebrate(name,before,after){
  if(document.getElementById('zc-rankup'))return;
  const ov=document.createElement('div');ov.id='zc-rankup';
  ov.style.cssText=`position:fixed;inset:0;z-index:2500;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,${after.tier.color}33,rgba(0,0,0,0.78));cursor:pointer`;
  ov.innerHTML=`<style>@keyframes zcPop{0%{transform:scale(0.3) rotate(-8deg);opacity:0}55%{transform:scale(1.15) rotate(3deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
    @keyframes zcGlow{0%,100%{text-shadow:0 0 30px ${after.tier.color}}50%{text-shadow:0 0 60px ${after.tier.color}}}</style>
    <div style="text-align:center;animation:zcPop .6s cubic-bezier(.2,1.4,.4,1)">
      <div style="font-size:110px;line-height:1;animation:zcGlow 1.6s ease-in-out infinite">${after.icon}</div>
      <div style="font-size:24px;font-weight:800;color:#fff;margin-top:10px">🎉 Rang-Aufstieg!</div>
      <div style="font-size:15px;color:#fff;opacity:0.9;margin-top:6px">${escHtml(name)}</div>
      <div style="font-size:16px;color:#fff;opacity:0.85;margin-top:10px">${escHtml(before.label)} → <b style="color:${after.tier.color}">${escHtml(after.label)}</b></div>
      <div style="font-size:11px;color:#fff;opacity:0.6;margin-top:18px">Zum Schließen tippen</div>
    </div>`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
  sfx('rankup');if(typeof smConfetti==='function')smConfetti();
  setTimeout(()=>{if(document.getElementById('zc-rankup'))ov.remove();},4500);
}
function zcCheckRankUpCelebration(deltasLike){
  try{
    const list=Array.isArray(deltasLike)?deltasLike:Object.values(deltasLike||{});
    const hit=list.find(d=>d&&d.delta>0&&d.rankBefore&&d.rankAfter&&d.rankBefore.label!==d.rankAfter.label);
    if(hit)setTimeout(()=>zcRankUpCelebrate(hit.name,hit.rankBefore,hit.rankAfter),450);
  }catch(e){}
}

/* ── Meisterschaft (spielübergreifender Cup) ── */
const ZC_CHAMP_GAMES=[
  {id:'ttt',screen:'tictactoe',mode:()=>tttSetMode('2p')},
  {id:'vg',screen:'viergewinnt',mode:()=>vgSetMode('2p')},
  {id:'chess',screen:'schach',mode:()=>chessSetMode('2p')},
  {id:'bs',screen:'schiffe',mode:()=>bsSetMode('2p')},
  {id:'mem',screen:'memory',mode:()=>memSetMode('2p')},
  {id:'hm',screen:'hangman',mode:()=>hmSetMode('2p')}
];
let zcChampForm={a:'',b:'',games:['ttt','vg','chess','bs'],rounds:1};
function zcChampGameInfo(id){return ZC_GAMES.find(g=>g.id===id)||{title:id,icon:'🎮'};}
function zcChampForm_(k,v){if(k==='games'){const s=new Set(zcChampForm.games);s.has(v)?s.delete(v):s.add(v);zcChampForm.games=ZC_CHAMP_GAMES.map(g=>g.id).filter(x=>s.has(x));}else zcChampForm[k]=k==='rounds'?+v:(v||'').trim();zcRenderChamp();}
function zcChampStart(){
  const f=zcChampForm;
  if(!f.a||!f.b||zcKey(f.a)===zcKey(f.b)){showToast('Zwei verschiedene Spielernamen eingeben');return;}
  if(!f.games.length){showToast('Mindestens ein Spiel auswählen');return;}
  const list=[];for(let r=0;r<f.rounds;r++)f.games.forEach(g=>list.push(g));
  const z=zcState().zc;
  z.champ={players:[f.a,f.b],games:list,idx:0,pts:[0,0],results:[],done:false,winPts:3,drawPts:1,winners:[]};
  smSave('zentrale');zcRenderChamp();showToast('🏅 Meisterschaft gestartet');
}
function zcChampCancel(){appConfirm('Meisterschaft abbrechen?',()=>{const z=zcState().zc;z.champ=null;smSave('zentrale');zcRenderChamp();});}
function zcChampActive(gameId,players){
  const c=zcState().zc.champ;if(!c||c.done)return null;
  if(c.games[c.idx]!==gameId)return null;
  if(players.some(p=>p.isAI))return null;
  const ks=players.map(p=>zcKey(p.name));
  if(!(ks.includes(zcKey(c.players[0]))&&ks.includes(zcKey(c.players[1]))))return null;
  return c;
}
function zcChampReport(gameId,players,winner){
  const c=zcChampActive(gameId,players);if(!c)return null;
  let pi=-1;
  if(winner!==-1)pi=zcKey(players[winner].name)===zcKey(c.players[0])?0:1;
  if(pi>=0)c.pts[pi]+=c.winPts;else{c.pts[0]+=c.drawPts;c.pts[1]+=c.drawPts;}
  c.results.push({game:gameId,winner:pi});c.idx++;
  if(c.idx>=c.games.length){
    c.done=true;
    const top=Math.max(c.pts[0],c.pts[1]);c.winners=[0,1].filter(i=>c.pts[i]===top);
    const z=zcState().zc;if(!z.champHistory)z.champHistory=[];
    z.champHistory.unshift({endedAt:Date.now(),players:[...c.players],pts:[...c.pts],games:c.games.length,winners:[...c.winners]});
    c.players.forEach((n,i)=>{const k=zcKey(n);z.bonus[k]=(z.bonus[k]||0)+10+(c.winners.length===1&&c.winners[0]===i?60:0);});
    smSave('zentrale');
    c.players.forEach(n=>zcTrophyCheck(n));
    sfx('rankup');
  }
  smSave('zentrale');
  return c;
}
function zcChampLaunch(){
  const z=zcState().zc,c=z.champ;if(!c||c.done)return;
  const id=c.games[c.idx],def=ZC_CHAMP_GAMES.find(g=>g.id===id);if(!def)return;
  const st=smS(id),flip=c.idx%2===1;
  st.series=null;st.cup=null;
  st.setup.names=flip?[c.players[1],c.players[0]]:[c.players[0],c.players[1]];
  smSave(id);
  goTo(def.screen);def.mode();smRefresh(id);
  showToast(`🏅 ${zcChampGameInfo(id).title}: ${st.setup.names[0]} vs ${st.setup.names[1]}`,3500);
}
function zcRenderChamp(){
  const wrap=document.getElementById('zc-champ');if(!wrap)return;
  const dl=document.getElementById('zc-names4');if(dl)dl.innerHTML=zcAllNames().map(n=>`<option value="${escHtml(n)}"></option>`).join('');
  const z=zcState().zc,c=z.champ,f=zcChampForm;
  const inp='padding:9px 10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;color:var(--text);font-size:14px;width:100%;box-sizing:border-box';
  if(!c){
    wrap.innerHTML=`<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#ff8f00,#e53935);color:#fff;margin-bottom:14px">
        <div style="font-size:36px;line-height:1">🏅</div>
        <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9">Meisterschaft</div><div style="font-size:12px;opacity:0.95;margin-top:2px;line-height:1.4">Zwei Spieler messen sich in mehreren Spielen nacheinander. Sieg = 3 Punkte, Unentschieden = 1. Wer am Ende die meisten Punkte hat, wird Meister (+60 Bonus-PR). Normale PR gibt es dabei nicht.</div></div></div>
      <div style="display:flex;gap:8px;margin-bottom:10px">${zcAccountSelect(f.a,[f.b],"zcChampForm_('a',this.value)",{guest:false,neu:false,placeholder:'Spieler 1 wählen…',style:inp})}${zcAccountSelect(f.b,[f.a],"zcChampForm_('b',this.value)",{guest:false,neu:false,placeholder:'Spieler 2 wählen…',style:inp})}</div>
      <datalist id="zc-names4"></datalist>
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px">Spiele</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${ZC_CHAMP_GAMES.map(g=>{const i=zcChampGameInfo(g.id),on=f.games.includes(g.id);return`<button onclick="zcChampForm_('games','${g.id}')" style="padding:7px 12px;font-size:12px;border-radius:14px;border:0.5px solid var(--divider);background:${on?'var(--accent)':'var(--bg)'};color:${on?'#fff':'var(--text)'};cursor:pointer">${i.icon} ${escHtml(i.title)}</button>`;}).join('')}</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2);margin-bottom:14px">Runden je Spiel<select onchange="zcChampForm_('rounds',this.value)" style="padding:6px;border-radius:6px;background:var(--bg);color:var(--text);border:0.5px solid var(--divider)">${[1,2,3].map(n=>`<option value="${n}" ${f.rounds===n?'selected':''}>${n}</option>`).join('')}</select></label>
      <button class="btn-generate" onclick="zcChampStart()" style="width:auto;padding:10px 22px">🏅 Meisterschaft starten</button>
      ${(z.champHistory||[]).length?`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:18px 0 6px">Bisherige Meisterschaften</div>`+z.champHistory.slice(0,8).map(h=>`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px;margin-bottom:6px;font-size:12px">🏵️ ${escHtml(h.players[0])} <b>${h.pts[0]} : ${h.pts[1]}</b> ${escHtml(h.players[1])} · ${h.games} Spiele · ${h.winners.length===1?'Meister: '+escHtml(h.players[h.winners[0]]):'unentschieden'} · ${new Date(h.endedAt).toLocaleDateString('de-DE')}</div>`).join(''):''}`;
    return;
  }
  const next=c.done?null:c.games[c.idx];
  const cav=n=>typeof zcAvatarHtml==='function'?zcAvatarHtml(n,52):'';
  const lead0=c.pts[0]>c.pts[1],lead1=c.pts[1]>c.pts[0];
  wrap.innerHTML=`<div style="padding:16px 12px;border-radius:18px;margin-bottom:14px;background:linear-gradient(120deg,var(--accent)33,var(--surface) 50%,#ff704333);border:0.5px solid var(--divider)">
      <div style="text-align:center;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">🏅 Meisterschaft</div>
      <div style="display:flex;align-items:center;justify-content:space-around;gap:6px">
        <div style="flex:1;min-width:0;text-align:center"><div style="display:flex;justify-content:center">${cav(c.players[0])}</div><div style="font-size:14px;font-weight:800;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(c.players[0])}</div></div>
        <div style="flex:none;display:flex;align-items:center;gap:10px"><span style="font-size:34px;font-weight:900;color:${lead0?'var(--accent)':'var(--text)'}">${c.pts[0]}</span><span style="font-size:20px;color:var(--text-3)">:</span><span style="font-size:34px;font-weight:900;color:${lead1?'#ff7043':'var(--text)'}">${c.pts[1]}</span></div>
        <div style="flex:1;min-width:0;text-align:center"><div style="display:flex;justify-content:center">${cav(c.players[1])}</div><div style="font-size:14px;font-weight:800;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(c.players[1])}</div></div>
      </div>
      ${c.done?`<div style="margin-top:12px;text-align:center;font-weight:800;font-size:14px;color:var(--accent)">${c.winners.length>1?'🤝 Unentschieden!':'🏵️ Meister: '+escHtml(c.players[c.winners[0]])+' (+60 PR)'}</div>`:''}
    </div>
    ${c.games.map((id,i)=>{const gi=zcChampGameInfo(id),r=c.results[i],cur=i===c.idx&&!c.done;
      const res=r?(r.winner===-1?'🤝 Unentschieden':'✅ '+escHtml(c.players[r.winner])):cur?'⏳ als Nächstes':'⬜';
      return`<div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:0.5px solid ${cur?'var(--accent)':'var(--divider)'};border-left:4px solid ${r?(r.winner===-1?'#fb8c00':'#43a047'):cur?'var(--accent)':'var(--divider)'};border-radius:12px;padding:10px 14px;margin-bottom:8px;${cur?'box-shadow:0 0 12px var(--glow,rgba(0,0,0,0.15));':''}"><span style="font-size:22px">${gi.icon}</span><span style="flex:1;font-size:13px;font-weight:600">${escHtml(gi.title)}${i%2===1?' <span style="font-size:10px;color:var(--text-3)">(Seiten getauscht)</span>':''}</span><span style="font-size:12px;color:var(--text-2)">${res}</span></div>`;}).join('')}
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      ${c.done?`<button class="btn-generate" onclick="zcState().zc.champ=null;smSave('zentrale');zcRenderChamp()" style="width:auto;padding:10px 20px">Neue Meisterschaft</button>`:`<button class="btn-generate" onclick="zcChampLaunch()" style="width:auto;padding:10px 20px">▶ ${escHtml(zcChampGameInfo(next).title)} starten</button><button class="timer-btn" onclick="zcChampCancel()" style="padding:10px 16px;font-size:12px">Abbrechen</button>`}
    </div>`;
}

/* ── Replay-Bibliothek ── */
let zcRplFav=false,zcRplGame='all';
function zcRplFilter(v){zcRplFav=!!v;zcRenderReplays();}
function zcRplGameSet(v){zcRplGame=v;zcRenderReplays();}
function zcReplayFav(id,rid){rplToggleFav(id,rid);zcRenderReplays();}
function zcReplayDel(id,rid){appConfirm('Replay löschen?',()=>{rplDelete(id,rid);zcRenderReplays();});}
function zcRenderReplays(){
  const wrap=document.getElementById('zc-replays');if(!wrap)return;
  const rows=[];
  ZC_GAMES.forEach(g=>rplLoadList(g.id).forEach((e,i)=>rows.push({g,e,i})));
  rows.sort((a,b)=>(b.e.meta.t||0)-(a.e.meta.t||0));
  const favN=rows.filter(r=>r.e.fav).length;
  let list=zcRplFav?rows.filter(r=>r.e.fav):rows;
  if(zcRplGame!=='all')list=list.filter(r=>r.g.id===zcRplGame);
  const chip=(on,l,f)=>`<button onclick="${f}" style="padding:6px 12px;font-size:11px;font-weight:600;border-radius:16px;border:0.5px solid ${on?'var(--accent)':'var(--divider)'};background:${on?'var(--accent)':'var(--surface)'};color:${on?'#fff':'var(--text-2)'};cursor:pointer;white-space:nowrap">${l}</button>`;
  const gamesWith=ZC_GAMES.filter(g=>rows.some(r=>r.g.id===g.id));
  const fmt=t=>{const d=new Date(t||0),today=new Date(),y=new Date(Date.now()-86400000);const same=(a,b)=>a.toDateString()===b.toDateString();const hm=d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});return same(d,today)?'Heute '+hm:same(d,y)?'Gestern '+hm:d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' '+hm;};
  const card=r=>{
    const m=r.e.meta,names=m.names||[],cols=m.colors||[];
    const res=m.result||'';
    return`<div style="display:flex;align-items:center;gap:12px;background:var(--surface);border:0.5px solid var(--divider);border-left:4px solid ${r.e.fav?'#ffb300':'var(--accent)'};border-radius:14px;padding:10px 12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <button onclick="rplOpen('${r.g.id}',${r.i})" title="Abspielen" style="position:relative;width:54px;height:54px;flex:none;border-radius:12px;border:none;cursor:pointer;background:linear-gradient(135deg,var(--active-bg),var(--bg));font-size:26px;display:flex;align-items:center;justify-content:center">${r.g.icon}<span style="position:absolute;right:-4px;bottom:-4px;width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3)">▶</span></button>
      <span style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800;color:var(--text)">${escHtml(r.g.title)}</span>${names.length?`<span style="font-size:11px;color:var(--text-2)">${names.map((n,i)=>`<span style="display:inline-flex;align-items:center;gap:3px">${cols[i]?`<span style="width:7px;height:7px;border-radius:50%;background:${cols[i]}"></span>`:''}${escHtml(n)}</span>`).join(' <span style="color:var(--text-3)">vs</span> ')}</span>`:''}</div>
        ${res?`<div style="font-size:12px;font-weight:600;color:var(--text);margin-top:2px">${escHtml(res)}</div>`:''}
        <div style="font-size:10px;color:var(--text-3);margin-top:2px">🕐 ${fmt(m.t)} · ⚡ ${(m.marks||[]).length} Momente${m.prLine?' · '+escHtml(m.prLine):''}</div>
      </span>
      <button class="timer-btn" onclick="zcReplayFav('${r.g.id}','${r.e.rid}')" title="Favorit" style="padding:6px 10px;font-size:14px;color:${r.e.fav?'#ffb300':'var(--text-3)'}">${r.e.fav?'★':'☆'}</button>
      <button class="timer-btn" onclick="zcReplayDel('${r.g.id}','${r.e.rid}')" title="Löschen" style="padding:6px 10px;font-size:12px">🗑</button></div>`;
  };
  wrap.innerHTML=`<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#d81b60,var(--accent));color:#fff;margin-bottom:12px">
      <div style="font-size:34px;line-height:1">🎬</div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">Replay-Bibliothek</div><div style="font-size:18px;font-weight:800;line-height:1.2">${rows.length} Replay${rows.length===1?'':'s'} · ${favN} Favorit${favN===1?'':'en'}</div><div style="font-size:11px;opacity:0.9;margin-top:2px">Je Spiel bleiben die letzten 8 (+ bis zu 12 Favoriten) erhalten</div></div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">${chip(!zcRplFav,'Alle ('+rows.length+')','zcRplFilter(false)')}${chip(zcRplFav,'★ Favoriten ('+favN+')','zcRplFilter(true)')}</div>
    ${gamesWith.length>1?`<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">${chip(zcRplGame==='all','Alle Spiele',"zcRplGameSet('all')")}${gamesWith.map(g=>chip(zcRplGame===g.id,g.icon+' '+g.title,`zcRplGameSet('${g.id}')`)).join('')}</div>`:''}`
    +(list.length?list.map(card).join(''):`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:24px 0">${zcRplFav?'Noch keine Favoriten – markiere Replays mit ☆.':'Noch keine Replays – sie entstehen automatisch nach jeder beendeten Partie.'}</div>`);
}
