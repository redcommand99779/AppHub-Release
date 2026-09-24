/* ══════════════════════════════════
   SPIELZENTRALE PLUS – Wochen-Bestenliste, Wochen-Challenge, Erinnerungen,
   Coins, Quests-Belohnungen und Shop (Themes, Titel, Konfetti, Sound-Pakete)
   State: zf_sm_zentrale.zc (coins, inv, eq, titles, wk, wkHist, wchal, wprog, notif)
   Coins entstehen automatisch: Partien, Tages-/Wochen-Challenges, Trophäen, Schach-Rätsel.
══════════════════════════════════ */

/* ── Zustand ── */
function zcp(){
  const z=zcState().zc;
  if(!z.coins)z.coins={};if(!z.earned)z.earned={};if(!z.inv)z.inv={};if(!z.titles)z.titles={};
  if(!z.eqp)z.eqp={};if(!z.hist)z.hist={};if(!z.groups)z.groups=[];if(!z.gHist)z.gHist=[];if(!z.bonusD)z.bonusD={};if(!z.custom)z.custom={};
  if(!z.wk)z.wk={week:zcWeekKey(),players:{}};
  if(!z.wkHist)z.wkHist=[];if(!z.wprog)z.wprog={};if(!z.remind)z.remind={};
  return z;
}
function zcCoinsOf(name){return zcp().coins[zcKey(name)]||0;}
function zcAddCoins(name,n){
  const z=zcp(),k=zcKey(name);if(!k||!n)return 0;
  z.coins[k]=(z.coins[k]||0)+n;if(n>0)z.earned[k]=(z.earned[k]||0)+n;
  z.names[k]=z.names[k]||name;return n;
}

/* ── Woche ── */
function zcWeekKey(d){
  d=d||new Date();
  const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),day=t.getUTCDay()||7;
  t.setUTCDate(t.getUTCDate()+4-day);
  const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/86400000+1)/7);
  return y+'-W'+String(w).padStart(2,'0');
}
function zcWeekMsLeft(){
  const n=new Date(),day=n.getDay()||7,end=new Date(n.getFullYear(),n.getMonth(),n.getDate()+(8-day));
  return end-n;
}
function zcWeekGenerate(week){
  const rnd=zcRng('zcw-'+week),pick=a=>a[Math.floor(rnd()*a.length)];
  const pool=[
    ()=>{const n=pick([6,8,10]);return{type:'win',target:n,reward:n*4,text:`Gewinne ${n} Partien`};},
    ()=>{const n=pick([12,15,20]);return{type:'play',target:n,reward:n*2,text:`Spiele ${n} Partien`};},
    ()=>{const n=pick([2,3,4]);return{type:'winhard',target:n,reward:n*14,text:`Gewinne ${n}× gegen die schwere KI`};},
    ()=>{const n=pick([3,4]);return{type:'wingames',target:n,reward:n*12,text:`Gewinne in ${n} verschiedenen Spielen`};},
    ()=>{const n=pick([4,5]);return{type:'streak',target:n,reward:n*9,text:`Erreiche eine Siegesserie von ${n}`};},
    ()=>{const n=pick([2,3,4]);return{type:'puzzle',target:n,reward:n*13,text:`Löse ${n} Schach-Rätsel`};},
    ()=>{const n=pick([2,3]);return{type:'cup',target:n,reward:n*14,text:`Spiele ${n} Cup-/Serien-Runden`};}
  ];
  const chosen=[],used=new Set();
  while(chosen.length<3&&used.size<pool.length){const i=Math.floor(rnd()*pool.length);if(used.has(i))continue;used.add(i);chosen.push(pool[i]());}
  return chosen;
}
const ZC_WEEK_BONUS=40,ZC_WEEK_WINNER_COINS=50;
function zcWeekEnsure(){
  const z=zcp(),cur=zcWeekKey();
  if(z.wk.week!==cur){
    const rows=Object.entries(z.wk.players).map(([k,p])=>({k,...p})).filter(p=>p.games>0).sort((a,b)=>b.pts-a.pts||b.wins-a.wins);
    if(rows.length){
      const top=rows.slice(0,5).map(p=>({name:p.name,pts:p.pts,wins:p.wins,games:p.games}));
      z.wkHist.unshift({week:z.wk.week,winner:rows[0].games>=3?rows[0].name:null,top});
      z.wkHist=z.wkHist.slice(0,12);
      if(rows[0].games>=3){
        zcAddCoins(rows[0].name,ZC_WEEK_WINNER_COINS);
        setTimeout(()=>showToast(`👑 ${rows[0].name} hat die letzte Woche gewonnen (+${ZC_WEEK_WINNER_COINS} 🪙)`,4000),1500);
      }
    }
    if(typeof zcGroupWeekClose==='function')zcGroupWeekClose(z.wk.players,z.wk.week);
    z.wk={week:cur,players:{}};z.wprog={};z.wchal=null;
  }
  if(!z.wchal||z.wchal.week!==cur)z.wchal={week:cur,list:zcWeekGenerate(cur)};
  return z;
}
function zcWeekProg(k){
  const z=zcWeekEnsure();
  if(!z.wprog[k])z.wprog[k]={vals:[0,0,0],sets:[[],[],[]],done:[false,false,false],all:false};
  return z.wprog[k];
}
function zcWeekProgress(name,ev){ // ev: Partie oder {puzzle:true}
  const z=zcWeekEnsure(),k=zcKey(name),ps=zcWeekProg(k);
  z.wchal.list.forEach((c,i)=>{
    if(ps.done[i])return;
    if(ev.puzzle){if(c.type==='puzzle')ps.vals[i]++;}
    else if(c.type==='win'&&ev.res==='W')ps.vals[i]++;
    else if(c.type==='play')ps.vals[i]++;
    else if(c.type==='winhard'&&ev.res==='W'&&(ev.diff==='hard'||ev.diff==='expert'))ps.vals[i]++;
    else if(c.type==='wingames'&&ev.res==='W'){if(!ps.sets[i].includes(ev.game))ps.sets[i].push(ev.game);ps.vals[i]=ps.sets[i].length;}
    else if(c.type==='streak')ps.vals[i]=Math.max(ps.vals[i],ev.streak||0);
    else if(c.type==='cup'&&ev.cup)ps.vals[i]++;
    if(ps.vals[i]>=c.target){
      ps.done[i]=true;z.bonus[k]=(z.bonus[k]||0)+c.reward;
      setTimeout(()=>{sfx('chime');showToast(`📅 Wochen-Ziel geschafft: ${c.text} (+${c.reward} PR & 🪙)`,3500);},900);
    }
  });
  if(!ps.all&&ps.done.every(Boolean)){
    ps.all=true;z.bonus[k]=(z.bonus[k]||0)+ZC_WEEK_BONUS;
    setTimeout(()=>{sfx('rankup');if(typeof smConfetti==='function')smConfetti();showToast(`🏆 Wochen-Challenge komplett! +${ZC_WEEK_BONUS} PR & 🪙`,4500);},1800);
  }
}
function zcWeekBoard(ev){
  const z=zcWeekEnsure(),k=zcKey(ev.name);
  const p=z.wk.players[k]||(z.wk.players[k]={name:ev.name,games:0,wins:0,pts:0});
  p.name=ev.name;p.games++;
  if(ev.res==='W'){p.wins++;p.pts+=3+((ev.diff==='hard'||ev.diff==='expert')?1:0);}
  else if(ev.res==='D')p.pts+=1;
}

/* ── Coins & Ereignisse (Wrapper um die bestehende Logik) ── */
function zcPlusInstall(){
  if(zcPlusInstall.done)return;zcPlusInstall.done=true;
  const _ev=zcEvent;
  zcEvent=function(ev){
    let before=0;
    try{if(ev&&ev.name){zcp();zcWeekEnsure();before=zcp().bonus[zcKey(ev.name)]||0;}}catch(e){}
    _ev(ev);
    try{
      if(!ev||!ev.name)return;
      const z=zcp(),k=zcKey(ev.name);
      zcWeekBoard(ev);zcWeekProgress(ev.name,ev);
      if(typeof zcHistPush==='function')zcHistPush(ev);
      const base=(ev.res==='W'?5:ev.res==='D'?2:1)+(ev.res==='W'&&(ev.diff==='hard'||ev.diff==='expert')?3:0)+(ev.cup?2:0);
      const bonus=(z.bonus[k]||0)-before;
      zcAddCoins(ev.name,base+bonus);
      smSave('zentrale');
      setTimeout(()=>{if(typeof showToast==='function')showToast(`🪙 +${base+bonus} Coins · Kontostand ${zcCoinsOf(ev.name)}`,2200);},1300);
      zcReminderRefresh();
    }catch(e){}
  };
  const _tr=zcTrophyCheck;
  zcTrophyCheck=function(name){
    let before=0;try{before=zcp().bonus[zcKey(name)]||0;}catch(e){}
    _tr(name);
    try{const d=(zcp().bonus[zcKey(name)]||0)-before;if(d>0){zcAddCoins(name,d);smSave('zentrale');}}catch(e){}
  };
  const _show=zcShow;
  zcShow=function(v){
    zcView=v;
    ['profile','board','chal','cmp','champ','season','replays','week','shop','bonus','stats','groups'].forEach(x=>{
      document.getElementById('zc-tab-'+x)?.classList.toggle('active',x===v);
      const e=document.getElementById('zc-view-'+x);if(e)e.style.display=x===v?'block':'none';
    });
    if(v==='week'){zcWeekEnsure();zcRenderWeek();}
    else if(v==='shop')zcRenderShop();
    else if(v==='bonus')zcRenderBonus();
    else if(v==='stats')zcRenderStats();
    else if(v==='groups')zcRenderGroups();
    else _show(v);
  };
  const _rc=zcRenderChallenges;
  zcRenderChallenges=function(){_rc();const w=document.getElementById('zc-chal-list');if(w)w.insertAdjacentHTML('afterbegin',zcRemindBanner());};
  // Profilkopf (Banner, Avatar, Titel, Coins) ist jetzt direkt in zcRenderProfile enthalten
  if(typeof applyTheme==='function'){const _at=applyTheme;applyTheme=function(t){_at(t);zcSkinApply();};}
  if(typeof smConfetti==='function'){const _c=smConfetti;smConfetti=function(){const c=zcEq().conf;if(!c||!ZC_CONFETTI[c])return _c();zcConfetti(c);};}
  if(typeof sfxTone==='function'){
    const _t=sfxTone;
    sfxTone=function(c,freq,dur,type,vol,delay,to){
      const p=zcEq().pack;
      if(p==='8bit')return _t(c,freq,dur,'square',(vol||0.2)*0.8,delay,to);
      if(p==='soft')return _t(c,freq,dur*1.3,'sine',(vol||0.2)*0.7,delay,to);
      if(p==='deep')return _t(c,freq*0.6,dur*1.2,'triangle',vol,delay,to&&to*0.6);
      return _t(c,freq,dur,type,vol,delay,to);
    };
  }
}
/* Schach-Rätsel: Belohnung */
function zcPuzzleSolved(i){
  try{
    const z=zcp(),name=(z.player||'').trim();if(!name)return 0;
    zcWeekEnsure();
    const k=zcKey(name),b0=z.bonus[k]||0;
    zcWeekProgress(name,{puzzle:true});
    const n=10+((z.bonus[k]||0)-b0);
    zcAddCoins(name,n);smSave('zentrale');return n;
  }catch(e){return 0;}
}

/* ── Titel-Anzeige ── */
function zcTitleOf(name){
  const z=zcp(),id=z.titles[zcKey(name)],t=ZC_SHOP.title.find(x=>x.id===id);
  return t?`<span style="font-weight:700;color:var(--accent)">${t.icon} ${t.name}</span>`:'';
}

/* ══ Wochen-Tab ══ */
function zcRenderWeek(keepFocus){
  const wrap=document.getElementById('zc-week');if(!wrap)return;
  const z=zcWeekEnsure(),name=(z.player||'').trim(),k=zcKey(name),ps=name?zcWeekProg(k):{vals:[0,0,0],done:[false,false,false],all:false};
  if(keepFocus&&document.activeElement&&document.activeElement.id==='zc-week-input'){const b=document.getElementById('zc-week-body');if(b){b.innerHTML=zcWeekBody(z,name,k,ps);return;}}
  wrap.innerHTML=`${zcPlayerInput('zc-week-input')}<div id="zc-week-body">${zcWeekBody(z,name,k,ps)}</div>`;
}
function zcWeekBody(z,name,k,ps){
  const left=zcWeekMsLeft(),dd=Math.floor(left/86400000),hh=Math.floor(left%86400000/3600000);
  const grp=(z.groups||[]).find(g=>g.id===z.wkGroup);
  const rows=Object.values(z.wk.players).filter(p=>p.games>0&&(!grp||grp.members.some(m=>zcKey(m)===zcKey(p.name)))).sort((a,b)=>b.pts-a.pts||b.wins-a.wins).slice(0,10);
  const medals=['🥇','🥈','🥉'],sec=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:18px 0 6px">${t}</div>`;
  const doneCount=ps.done.filter(Boolean).length,total=z.wchal.list.length||3,all=doneCount===total;
  const wd=(new Date().getDay()+6)%7; // Mo=0
  const ICON={win:'🏆',play:'🎮',winhard:'🤖',wingame:'🎯',streak:'🔥',diverse:'🎲',cup:'🏅',puzzle:'🧩'};
  const days=['Mo','Di','Mi','Do','Fr','Sa','So'].map((t,i)=>`<span style="display:flex;flex-direction:column;align-items:center;gap:3px;font-size:9px;font-weight:700;opacity:${i>wd?0.6:1}"><span style="width:${i===wd?14:10}px;height:${i===wd?14:10}px;border-radius:50%;background:${i<=wd?'#fff':'rgba(255,255,255,0.3)'};${i===wd?'box-shadow:0 0 8px #fff':''}"></span>${t}</span>`).join('');
  const hero=`<div style="padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,${all?'#2e7d32,#66bb6a':'#00897b,var(--accent)'});color:#fff;margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
        <div><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">📅 Kalenderwoche ${z.wk.week.split('-W')[1]}</div>
          <div style="font-size:18px;font-weight:800;line-height:1.2;margin-top:2px">${all?'Alle Wochenziele geschafft! 🎉':doneCount+' von '+total+' Wochenzielen'}</div></div>
        <div style="text-align:right;flex:none"><div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">Endet in</div><div style="font-size:20px;font-weight:800;line-height:1.1">${dd}d ${hh}h</div></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;padding:0 4px">${days}</div>
    </div>`;
  return`${hero}
    ${sec('🎯 Wochen-Challenge')}
    ${z.wchal.list.map((c,i)=>{const v=Math.min(ps.vals[i],c.target),pct=Math.round(v/c.target*100),dn=ps.done[i],col=dn?'#43a047':'var(--accent)';return`<div style="display:flex;align-items:center;gap:12px;background:${dn?'linear-gradient(120deg,rgba(67,160,71,0.14),var(--surface))':'var(--surface)'};border:0.5px solid ${dn?'#43a047':'var(--divider)'};border-left:4px solid ${col};border-radius:14px;padding:12px 14px;margin-bottom:8px">
      <div style="width:44px;height:44px;flex:none;border-radius:12px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:22px">${dn?'✅':(ICON[c.type]||'🎯')}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px"><span style="flex:1;font-size:13px;font-weight:700;color:var(--text)">${escHtml(c.text)}</span><span style="font-size:11px;font-weight:800;color:#fff;background:${col};border-radius:10px;padding:2px 8px;white-space:nowrap">+${c.reward} PR &amp; 🪙</span></div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px"><div style="flex:1;height:8px;background:var(--divider);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${col};border-radius:4px;transition:width .4s"></div></div><span style="font-size:11px;font-weight:700;color:var(--text-2)">${v}/${c.target}</span></div>
      </div></div>`;}).join('')}
    <div style="font-size:11px;color:var(--text-3);padding:8px 12px;background:var(--surface);border:0.5px dashed var(--divider);border-radius:10px">🎁 Alle drei Wochenziele: Extra-Bonus ${ZC_WEEK_BONUS} PR &amp; Coins. Neue Ziele jeden Montag.</div>
    ${sec('🏆 Wochen-Bestenliste')}
    ${(z.groups||[]).length?`<select onchange="zcGroupFilter(this.value)" style="margin-bottom:8px;padding:6px 10px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:12px"><option value="">Alle Spieler</option>${z.groups.map(g=>`<option value="${g.id}" ${g.id===z.wkGroup?'selected':''}>${g.icon} ${escHtml(g.name)}</option>`).join('')}</select>`:''}
    <div style="font-size:10px;color:var(--text-3);margin-bottom:6px">Punkte: Sieg 3 · Unentschieden 1 · +1 für Siege gegen die schwere KI. Wochensieger (mind. 3 Partien) bekommt ${ZC_WEEK_WINNER_COINS} 🪙.</div>
    ${rows.length?rows.map((p,i)=>{const mc=['#ffc107','#b0bec5','#cd7f32'][i],top=rows[0].pts||1,pct=Math.max(4,Math.round(p.pts/top*100));return`<div style="position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;background:${i<3?`linear-gradient(120deg,${mc}22,var(--surface) 60%)`:'var(--surface)'};border:0.5px solid ${i<3?mc:'var(--divider)'};border-radius:12px;padding:${i===0?'12px':'8px'} 12px;margin-bottom:6px">
      <div style="position:absolute;left:0;bottom:0;height:3px;width:${pct}%;background:${i<3?mc:'var(--accent)'};opacity:0.7"></div>
      ${zcBannerBar(p.name)}<span style="width:26px;text-align:center;font-size:${i<3?20:12}px;color:var(--text-3)">${medals[i]||(i+1)+'.'}</span>${zcAvatarHtml(p.name,i===0?38:30)}
      <span style="flex:1;min-width:0"><div style="font-size:${i===0?14:13}px;font-weight:800;color:var(--text)">${escHtml(p.name)} ${zcTitleOf(p.name)}</div><div style="font-size:10px;color:var(--text-3)">${p.games} Partien · ${p.wins} Siege</div></span>
      <span style="font-size:${i===0?17:14}px;font-weight:800;color:${i<3?mc:'var(--text)'}">${p.pts} Pkt</span></div>`;}).join(''):`<div style="font-size:12px;color:var(--text-3);text-align:center;padding:14px 0">Noch keine Partien in dieser Woche.</div>`}
    ${z.wkHist.length?sec('📜 Frühere Wochen')+z.wkHist.map(h=>`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:10px;padding:8px 12px;margin-bottom:6px;font-size:12px;color:var(--text-2)"><b style="color:var(--text)">KW ${h.week.split('-W')[1]}</b> · ${h.winner?`👑 ${escHtml(h.winner)}`:'kein Sieger'} <span style="color:var(--text-3)">${h.top.slice(0,3).map(t=>escHtml(t.name)+' '+t.pts).join(' · ')}</span></div>`).join(''):''}`;
}

/* ══ Erinnerungen ══ */
function zcReminderInfo(){
  const z=zcWeekEnsure(),name=(z.player||'').trim();if(!name)return null;
  const k=zcKey(name),d=z.days[k],out={name,streak:null,week:null};
  if(d&&d.count>=1&&d.last===zcYesterday()){
    zcEnsureToday();
    const ps=zcProg(k);
    if(!ps.all)out.streak={count:d.count,open:ps.done.filter(x=>!x).length};
  }
  const left=zcWeekMsLeft(),ws=zcWeekProg(k);
  if(left<86400000*1.5&&!ws.all){const open=ws.done.filter(x=>!x).length;if(open)out.week={open};}
  return out.streak||out.week?out:null;
}
function zcRemindBanner(){
  const r=zcReminderInfo();if(!r)return'';
  const parts=[];
  if(r.streak)parts.push(`🔥 Deine <b>${r.streak.count}-Tage-Serie</b> läuft heute ab – noch ${r.streak.open} Challenge${r.streak.open===1?'':'s'} offen!`);
  if(r.week)parts.push(`📅 Die Wochen-Challenge endet bald – noch ${r.week.open} Ziel${r.week.open===1?'':'e'} offen.`);
  return`<div style="background:rgba(255,152,0,0.14);border:0.5px solid #ff9800;border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--text)">${parts.join('<br>')}</div>`;
}
function zcReminderRefresh(notify){
  try{
    const r=zcReminderInfo(),tile=document.querySelector('.app-tile[data-appid="zentrale"]');
    if(tile){
      let dot=tile.querySelector('.zc-dot');
      if(r&&!dot){tile.style.position='relative';dot=document.createElement('span');dot.className='zc-dot';dot.textContent='!';dot.style.cssText='position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:50%;background:#ff3b30;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px rgba(255,59,48,0.6)';tile.appendChild(dot);}
      else if(!r&&dot)dot.remove();
    }
    if(!r||!notify)return;
    const z=zcp(),today=zcToday(),msg=r.streak?`🔥 Deine ${r.streak.count}-Tage-Serie ist in Gefahr – noch ${r.streak.open} Challenge${r.streak.open===1?'':'s'} offen!`:`📅 Die Wochen-Challenge endet bald – noch ${r.week.open} Ziel${r.week.open===1?'':'e'} offen.`;
    if(z.remind.toast!==today){z.remind.toast=today;smSave('zentrale');setTimeout(()=>showToast(msg,5000),1200);}
    if(z.notif&&'Notification' in window&&Notification.permission==='granted'&&new Date().getHours()>=17&&z.remind.notif!==today){
      z.remind.notif=today;smSave('zentrale');
      try{new Notification('Spielzentrale',{body:msg});}catch(e){}
    }
  }catch(e){}
}

/* ── Start ── */
function zcPlusInit(){
  try{zcPlusInstall();zcWeekEnsure();smSave('zentrale');zcSkinApply();zcBgApply();zcReminderRefresh(true);setInterval(()=>zcReminderRefresh(true),600000);}catch(e){}
}
zcPlusInstall();
document.addEventListener('DOMContentLoaded',zcPlusInit);
