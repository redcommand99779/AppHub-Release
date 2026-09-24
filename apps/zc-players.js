/* ══════════════════════════════════
   SPIELER-PROFILE ("Wer spielt?"), Gruppen/Teams und Statistik-Dashboard
   Profile: zc.profiles [{name,avatar,color}] · Gruppen: zc.groups [{id,name,icon,members}]
   Verlauf für die Statistik: zc.hist[name] [{t,g,r,d,pr}]
══════════════════════════════════ */
const ZC_AVATARS=['😀','😎','🤠','🥳','🤓','😈','🦊','🐱','🐶','🐼','🦁','🐸','🐵','🦄','🐙','🦉','🚀','⚽','🎲','🍀','🔥','⭐','👑','🧠'];
const ZC_COLORS=['#e53935','#1e88e5','#43a047','#fdd835','#8e24aa','#fb8c00','#00acc1','#6d4c41'];
const ZC_DEFAULT_NAMES=/^(spieler\s*\d+|ki|gast(\s*\d+)?|player\s*\d+)$/i;

/* ── Profile ── */
function zcProfiles(){
  const z=zcp();
  if(!Array.isArray(z.profiles)){ // erster Start: vorhandene Namen aus allen Spielen übernehmen
    z.profiles=[];
    zcAllNames().filter(n=>!ZC_DEFAULT_NAMES.test(n.trim())).forEach((n,i)=>{
      let avatar='',color='';
      ZC_GAMES.filter(g=>g.kind==='sm').forEach(g=>{
        const su=smS(g.id).setup;if(!su)return;
        su.names.forEach((nm,j)=>{if(!avatar&&zcKey(nm)===zcKey(n)){avatar=su.avatars[j];color=su.colors[j];}});
      });
      z.profiles.push({name:n,avatar:avatar||ZC_AVATARS[(i*5)%ZC_AVATARS.length],color:color||ZC_COLORS[i%ZC_COLORS.length]});
    });
    smSave('zentrale');
  }
  return z.profiles;
}
function zcProfileOf(name){const k=zcKey(name);return zcProfiles().find(p=>zcKey(p.name)===k)||null;}

let zcWho={mode:'pick',edit:null,form:{name:'',avatar:'😀',color:ZC_COLORS[1]}};
function zcWhoEl(){
  let el=document.getElementById('zc-who');
  if(!el){el=document.createElement('div');el.id='zc-who';el.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.62);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:16px;overflow:auto';document.body.appendChild(el);}
  return el;
}
function zcWhoOpen(force){
  zcWho.mode=(zcProfiles().length||!force)?'pick':'form';
  if(!zcProfiles().length){zcWho.mode='form';zcWho.edit=null;zcWho.form={name:'',avatar:'😀',color:ZC_COLORS[1]};}
  zcWhoRender();zcWhoEl().style.display='flex';
}
function zcWhoClose(){zcWhoEl().style.display='none';try{sessionStorage.setItem('zf_who',(zcp().player||'-'));}catch(e){}}
function zcWhoRender(){
  const el=zcWhoEl(),z=zcp();
  const box=inner=>`<div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:18px;padding:22px 20px;max-width:520px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5);color:var(--text)">${inner}</div>`;
  if(zcWho.mode==='pick'){
    const ps=zcProfiles();
    el.innerHTML=box(`<div style="font-size:20px;font-weight:800;text-align:center;margin-bottom:4px">Wer spielt?</div>
      <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:16px">Wähle dein Profil – Name, Coins und Kosmetik werden übernommen.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">
      ${ps.map(p=>`<div style="position:relative;background:var(--surface);border:0.5px solid ${zcKey(p.name)===zcKey(z.player)?'var(--accent)':'var(--divider)'};border-radius:14px;padding:14px 8px 10px;text-align:center;cursor:pointer" onclick="zcSelectPlayer(${JSON.stringify(p.name).replace(/"/g,'&quot;')})">
        ${zcBannerBg(p.name)?`<div style="position:absolute;top:0;left:0;right:0;height:38px;border-radius:14px 14px 0 0;background:${zcBannerBg(p.name)}"></div>`:''}
        <div style="position:relative;display:flex;justify-content:center;margin:8px 0 6px">${zcAvatarHtml(p.name,54)}</div>
        <div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.name)}</div>
        <div style="font-size:11px;min-height:15px">${zcTitleOf(p.name)}</div>
        <div style="font-size:11px;color:var(--text-3)">🪙 ${zcCoinsOf(p.name)}</div>
        <button onclick="event.stopPropagation();zcWhoEdit(${JSON.stringify(p.name).replace(/"/g,'&quot;')})" title="Bearbeiten" style="position:absolute;top:6px;right:6px;background:none;border:none;color:var(--text-3);cursor:pointer;font-size:13px">✏️</button></div>`).join('')}
      <div onclick="zcWhoNew()" style="background:var(--bg);border:1.5px dashed var(--divider);border-radius:14px;padding:14px 8px;text-align:center;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:120px;color:var(--text-2)"><div style="font-size:28px">＋</div><div style="font-size:12px">Neuer Spieler</div></div></div>
      <div style="text-align:center;margin-top:16px"><button class="timer-btn" onclick="zcWhoClose()" style="padding:7px 16px;font-size:12px">Ohne Auswahl weiter</button></div>`);
  }else{
    const f=zcWho.form,editing=!!zcWho.edit;
    el.innerHTML=box(`<div style="font-size:18px;font-weight:800;text-align:center;margin-bottom:14px">${editing?'Profil bearbeiten':'Neuer Spieler'}</div>
      <input type="text" id="zc-who-name" value="${escHtml(f.name)}" ${editing?'disabled':''} maxlength="20" placeholder="Name" oninput="zcWho.form.name=this.value" style="width:100%;box-sizing:border-box;padding:10px 12px;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;color:var(--text);font-size:15px;margin-bottom:12px"/>
      ${editing?'<div style="font-size:10px;color:var(--text-3);margin:-8px 0 10px">Der Name ist mit den Statistiken verknüpft und kann nicht geändert werden.</div>':''}
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Avatar</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${ZC_AVATARS.map(a=>`<button onclick="zcWhoSet('avatar','${a}')" style="width:38px;height:38px;font-size:20px;border-radius:10px;cursor:pointer;background:${f.avatar===a?'var(--accent)':'var(--surface)'};border:0.5px solid var(--divider)">${a}</button>`).join('')}</div>
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Farbe</div>
      <div style="display:flex;gap:8px;margin-bottom:16px">${ZC_COLORS.map(c=>`<button onclick="zcWhoSet('color','${c}')" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:${f.color===c?'3px solid var(--text)':'3px solid transparent'}"></button>`).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn-generate" onclick="zcWhoSave()" style="width:auto;padding:9px 22px">Speichern</button>
        <button class="timer-btn" onclick="zcWhoCancel()" style="padding:9px 16px;font-size:13px">Abbrechen</button>
        ${editing?`<button class="timer-btn" onclick="zcWhoDelete()" style="padding:9px 16px;font-size:13px;color:#e53935">Profil löschen</button>`:''}</div>
      ${editing?'<div style="font-size:10px;color:var(--text-3);text-align:center;margin-top:8px">Beim Löschen bleiben Statistiken und Ränge erhalten – nur die Profilkarte verschwindet.</div>':''}`);
    setTimeout(()=>{const i=document.getElementById('zc-who-name');if(i&&!editing)i.focus();},50);
  }
}
function zcWhoCreate(cb){zcWho.after=cb;zcWhoNew();zcWhoEl().style.display='flex';}
function zcWhoCancel(){if(zcWho.after){zcWho.after=null;zcWhoEl().style.display='none';}else{zcWho.mode='pick';zcWhoRender();}}
function zcWhoSet(k,v){zcWho.form[k]=v;const n=document.getElementById('zc-who-name');if(n)zcWho.form.name=n.value;zcWhoRender();}
function zcWhoNew(){zcWho.mode='form';zcWho.edit=null;zcWho.form={name:'',avatar:ZC_AVATARS[Math.floor(Math.random()*ZC_AVATARS.length)],color:ZC_COLORS[Math.floor(Math.random()*ZC_COLORS.length)]};zcWhoRender();}
function zcWhoEdit(name){const p=zcProfileOf(name);if(!p)return;zcWho.mode='form';zcWho.edit=p.name;zcWho.form={name:p.name,avatar:p.avatar,color:p.color};zcWhoRender();}
function zcWhoSave(){
  const f=zcWho.form,name=(f.name||'').trim();
  if(!name){showToast('Bitte einen Namen eingeben');return;}
  if(ZC_DEFAULT_NAMES.test(name)){showToast('Wähle einen eigenen Namen (nicht „Spieler 1")');return;}
  const ps=zcProfiles();
  if(zcWho.edit){const p=zcProfileOf(zcWho.edit);p.avatar=f.avatar;p.color=f.color;}
  else{
    if(zcProfileOf(name)){showToast('Diesen Spieler gibt es schon');return;}
    ps.push({name,avatar:f.avatar,color:f.color});
  }
  smSave('zentrale');
  if(zcWho.edit){zcWho.mode='pick';zcWhoRender();if(zcKey(zcp().player)===zcKey(name))zcPrefillGames(name);}
  else if(zcWho.after){const cb=zcWho.after;zcWho.after=null;zcWhoEl().style.display='none';cb(name);}
  else zcSelectPlayer(name);
}
function zcWhoDelete(){
  const name=zcWho.edit;if(!name)return;
  appConfirm(`Profil „${name}" löschen?`,()=>{
    const z=zcp();z.profiles=zcProfiles().filter(p=>zcKey(p.name)!==zcKey(name));smSave('zentrale');
    zcWho.mode='pick';zcWho.edit=null;zcWhoRender();zcChipUpdate();
  });
}
function zcPrefillGames(name){
  try{
    const p=zcProfileOf(name);if(!p)return;
    ZC_GAMES.filter(g=>g.kind==='sm').forEach(g=>{
      if(!SM_CFG[g.id]||typeof SM_CFG[g.id].sideAI!=='function')return;
      const s=smS(g.id),ai=SM_CFG[g.id].sideAI(),i=ai[0]?1:0,o=1-i;
      if(!ai[o]&&zcKey(s.setup.names[o])===zcKey(name)){s.setup.names[o]=zcGuestName([name]);}
      s.setup.names[i]=name;s.setup.avatars[i]=p.avatar;s.setup.colors[i]=p.color;
      if(s.setup.colors[o]===p.color)s.setup.colors[o]=ZC_COLORS.find(c=>c!==p.color)||s.setup.colors[o];
      smSave(g.id);
      if(typeof smRefresh==='function')try{smRefresh(g.id);}catch(e){}
    });
    if(typeof kniffPlayersSetup!=='undefined'&&kniffPlayersSetup.length){
      const q=kniffPlayersSetup.find(x=>!x.isAI);
      if(q&&!kniffPlayersSetup.some(x=>x!==q&&zcKey(x.name)===zcKey(name))){q.name=name;q.avatar=p.avatar;q.color=p.color;if(typeof kniffRenderPlayerSetup==='function')try{kniffRenderPlayerSetup();}catch(e){}}
    }
    if(typeof monoPlayersSetup!=='undefined'&&monoPlayersSetup.length){
      const q=monoPlayersSetup.find(x=>!x.isAI);
      if(q&&!monoPlayersSetup.some(x=>x!==q&&zcKey(x.name)===zcKey(name))){q.name=name;q.avatar=p.avatar;q.color=p.color;if(typeof monoRenderPlayerSetup==='function')try{monoRenderPlayerSetup();}catch(e){}}
    }
  }catch(e){}
}
function zcSelectPlayer(name,quiet){
  const z=zcp();z.player=name;smSave('zentrale');
  try{sessionStorage.setItem('zf_who',name);}catch(e){}
  zcName=name;
  zcPrefillGames(name);zcApplyPlayer();
  if(typeof sbReloadRecent==='function')sbReloadRecent();
  if(typeof rplRefreshButtons==='function')rplRefreshButtons();
  zcWhoEl().style.display='none';
  if(typeof zcReminderRefresh==='function')zcReminderRefresh(true);
  zcChipUpdate();
  if(!quiet||zcBonusAvailable(name))setTimeout(()=>showToast(`👋 Hallo ${name}!${zcBonusAvailable(name)?' 🎁 Dein Tagesbonus wartet.':''}`,3000),300);
  if(document.getElementById('screen-zentrale')?.classList.contains('active'))zcShow(zcView);
}

/* ── Konten-Auswahl für Mehrspieler-Spiele (nur Accounts oder Gäste) ── */
function zcAccountLook(name){const p=zcProfileOf(name);return p?{avatar:p.avatar,color:p.color}:null;}
function zcNormAccount(name,taken){
  const n=(name||'').trim(),p=zcProfileOf(n),tk=(taken||[]).map(zcKey);
  if(p&&!tk.includes(zcKey(p.name)))return p.name;
  if(zcIsGuest(n)&&!tk.includes(zcKey(n)))return n.replace(/^gast/i,'Gast');
  return zcGuestName(taken||[]);
}
function zcNormSetupNames(id){
  try{
    const cfg=SM_CFG[id],s=smS(id).setup,ai=cfg.sideAI();let ch=false;const taken=[];
    [0,1].forEach(i=>{
      if(ai[i])return;
      const n=zcNormAccount(s.names[i],taken);
      if(n!==s.names[i]){
        s.names[i]=n;ch=true;const l=zcAccountLook(n);
        if(l){if(s.avatars[1-i]!==l.avatar)s.avatars[i]=l.avatar;if(s.colors[1-i]!==l.color)s.colors[i]=l.color;}
      }
      taken.push(s.names[i]);
    });
    if(ch)smSave(id);
  }catch(e){}
}
// opts: {guest:true,neu:true,disabled,style,placeholder}
function zcAccountSelect(current,taken,onchange,opts){
  opts=opts||{};const guest=opts.guest!==false,neu=opts.neu!==false,tk=(taken||[]).map(zcKey);
  const accts=zcProfiles().filter(p=>zcKey(p.name)===zcKey(current)||!tk.includes(zcKey(p.name)));
  const isG=zcIsGuest(current),gv=isG?current:zcGuestName(taken||[]);
  const style=opts.style||'padding:7px 9px;background:var(--bg);border:0.5px solid var(--divider);border-radius:8px;color:var(--text);font-size:13px';
  return`<select ${opts.disabled?'disabled':''} onchange="${onchange}" style="${style}">
    ${opts.placeholder?`<option value="" ${current?'':'selected'}>${opts.placeholder}</option>`:''}
    ${accts.map(p=>`<option value="${escHtml(p.name)}" ${zcKey(p.name)===zcKey(current)?'selected':''}>${escHtml(p.avatar)} ${escHtml(p.name)}</option>`).join('')}
    ${guest?`<option value="${escHtml(gv)}" ${isG?'selected':''}>👤 Gast${isG&&/\d/.test(current)?' ('+escHtml(current)+')':''}</option>`:''}
    ${neu?'<option value="__new">➕ Neuer Account…</option>':''}</select>`;
}

/* ── Chip auf der Startseite ── */
function zcChipUpdate(){
  let c=document.getElementById('zc-chip');
  if(!c){
    c=document.createElement('button');c.id='zc-chip';c.onclick=()=>zcWhoOpen(true);
    c.style.cssText='position:fixed;top:10px;right:12px;z-index:1400;display:none;align-items:center;gap:8px;padding:4px 12px 4px 5px;border-radius:24px;border:0.5px solid var(--divider);background:var(--surface);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.15);backdrop-filter:blur(8px)';
    document.body.appendChild(c);
  }
  const home=document.querySelector('.screen.active');
  c.style.display=home&&home.id==='screen-home'?'flex':'none';
  const name=(zcp().player||'').trim();
  if(!name){c.innerHTML='<span style="font-size:16px;padding-left:6px">👤</span><span>Spieler wählen</span>';return;}
  const dot=zcBonusAvailable(name)?'<span title="Bonus wartet" style="font-size:14px">🎁</span>':'';
  c.innerHTML=`${zcAvatarHtml(name,28)}<span>${escHtml(name)}</span><span style="color:var(--text-3);font-weight:500">🪙 ${zcCoinsOf(name)}</span>${dot}`;
}

/* ── Verlauf (für die Statistik) ── */
function zcHistPush(ev){
  const z=zcp(),k=zcKey(ev.name);
  const arr=z.hist[k]||(z.hist[k]=[]);
  const e={t:Date.now(),g:ev.game,r:ev.res,d:ev.diff||''};arr.push(e);
  if(arr.length>1500)arr.splice(0,arr.length-1500);
  setTimeout(()=>{try{e.pr=zcAggregate(ev.name).total;smSave('zentrale');}catch(x){}},700);
}
function zcProfileHeader(name){
  const t=zcTitleOf(name);
  return`${zcBannerHtml(name)}<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="margin-top:${zcItem('frame',zcEquipped('frame',name))&&zcItem('frame',zcEquipped('frame',name)).deco?'10px':'0'}">${zcAvatarHtml(name,52)}</span><div><div style="font-size:12px;color:var(--text-2)">${t||'&nbsp;'}</div><div style="font-size:12px;color:var(--text-2)">🪙 <b>${zcCoinsOf(name)}</b> Coins</div></div></div>`;
}

/* ══ Gruppen ══ */
let zcGroupEdit=null,zcGroupForm={name:'',icon:'👥',members:[]};
const ZC_GROUP_ICONS=['👥','🏠','🏫','💼','⚔️','🛡️','🐺','🦅','🔥','⭐','🍕','🎮'];
function zcGroupMembersStats(g){
  return g.members.map(n=>{const a=zcAggregate(n),wk=zcp().wk.players[zcKey(n)]||{pts:0,games:0,wins:0};return{name:n,a,pts:wk.pts,total:a.total,games:a.T.games,wins:a.T.wins};}).sort((x,y)=>y.total-x.total);
}
function zcGroupTotals(g){
  const m=zcGroupMembersStats(g);
  return{m,pr:m.reduce((s,x)=>s+x.total,0),games:m.reduce((s,x)=>s+x.games,0),wins:m.reduce((s,x)=>s+x.wins,0),pts:m.reduce((s,x)=>s+x.pts,0)};
}
function zcGroupOpen(id){
  zcGroupEdit=id;
  const g=(zcp().groups||[]).find(x=>x.id===id);
  zcGroupForm=g?{name:g.name,icon:g.icon,members:[...g.members]}:{name:'',icon:'👥',members:[]};
  zcRenderGroups();
}
function zcGroupSetField(k,v){zcGroupForm[k]=v;zcRenderGroups();}
function zcGroupToggle(name){const i=zcGroupForm.members.findIndex(n=>zcKey(n)===zcKey(name));if(i>=0)zcGroupForm.members.splice(i,1);else zcGroupForm.members.push(name);zcRenderGroups();}
function zcGroupSave(){
  const f=zcGroupForm,name=(f.name||'').trim(),z=zcp();
  if(!name){showToast('Bitte einen Gruppennamen eingeben');return;}
  if(f.members.length<2){showToast('Eine Gruppe braucht mindestens 2 Mitglieder');return;}
  if(zcGroupEdit&&zcGroupEdit!=='new'){const g=z.groups.find(x=>x.id===zcGroupEdit);if(g){g.name=name;g.icon=f.icon;g.members=[...f.members];}}
  else z.groups.push({id:'g'+Date.now().toString(36),name,icon:f.icon,members:[...f.members]});
  smSave('zentrale');zcGroupEdit=null;zcRenderGroups();showToast('Gruppe gespeichert ✓');
}
function zcGroupDelete(id){appConfirm('Gruppe löschen?',()=>{const z=zcp();z.groups=z.groups.filter(g=>g.id!==id);smSave('zentrale');zcGroupEdit=null;zcRenderGroups();});}
function zcGroupFilter(id){zcp().wkGroup=id||'';smSave('zentrale');zcRenderWeek();}
function zcGroupWeekClose(players,week){
  try{
    const z=zcp();if(!z.groups.length)return;
    const list=z.groups.map(g=>({id:g.id,name:g.name,icon:g.icon,members:g.members,pts:g.members.reduce((s,n)=>s+((players[zcKey(n)]||{}).pts||0),0)})).sort((a,b)=>b.pts-a.pts);
    if(!list.length||list[0].pts<=0)return;
    const win=list[0];
    z.gHist.unshift({week,winner:win.name,icon:win.icon,list:list.map(x=>({name:x.name,pts:x.pts}))});z.gHist=z.gHist.slice(0,12);
    win.members.forEach(n=>zcAddCoins(n,20));
    setTimeout(()=>showToast(`${win.icon} Gruppe „${win.name}" gewinnt die Woche (+20 🪙 je Mitglied)`,4500),2500);
  }catch(e){}
}
function zcRenderGroups(){
  const wrap=document.getElementById('zc-groups');if(!wrap)return;
  const z=zcp(),sec=t=>`<div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin:16px 0 6px">${t}</div>`;
  if(zcGroupEdit){
    const f=zcGroupForm,names=[...new Set([...zcProfiles().map(p=>p.name),...zcAllNames()])].filter(n=>!ZC_DEFAULT_NAMES.test(n));
    wrap.innerHTML=`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:12px;padding:14px">
      <div style="font-size:15px;font-weight:700;margin-bottom:10px">${zcGroupEdit==='new'?'Neue Gruppe':'Gruppe bearbeiten'}</div>
      <input type="text" value="${escHtml(f.name)}" maxlength="24" placeholder="Gruppenname (z. B. Familie, Büro-Team)" oninput="zcGroupForm.name=this.value" style="width:100%;box-sizing:border-box;padding:10px 12px;background:var(--bg);border:0.5px solid var(--divider);border-radius:10px;color:var(--text);font-size:14px;margin-bottom:10px"/>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${ZC_GROUP_ICONS.map(i=>`<button onclick="zcGroupSetField('icon','${i}')" style="width:36px;height:36px;font-size:18px;border-radius:9px;cursor:pointer;background:${f.icon===i?'var(--accent)':'var(--bg)'};border:0.5px solid var(--divider)">${i}</button>`).join('')}</div>
      <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;margin-bottom:6px">Mitglieder (${f.members.length})</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">${names.length?names.map(n=>{const on=f.members.some(m=>zcKey(m)===zcKey(n));return`<button onclick="zcGroupToggle(${JSON.stringify(n).replace(/"/g,'&quot;')})" style="display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:18px;font-size:12px;cursor:pointer;border:0.5px solid var(--divider);background:${on?'var(--accent)':'var(--bg)'};color:${on?'#fff':'var(--text)'}">${zcAvatarHtml(n,22)}${escHtml(n)}</button>`;}).join(''):'<span style="font-size:12px;color:var(--text-3)">Lege zuerst Spieler-Profile an (Startseite → oben rechts).</span>'}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn-generate" onclick="zcGroupSave()" style="width:auto;padding:9px 22px">Speichern</button><button class="timer-btn" onclick="zcGroupEdit=null;zcRenderGroups()" style="padding:9px 16px;font-size:13px">Abbrechen</button>${zcGroupEdit!=='new'?`<button class="timer-btn" onclick="zcGroupDelete('${zcGroupEdit}')" style="padding:9px 16px;font-size:13px;color:#e53935">Löschen</button>`:''}</div></div>`;
    return;
  }
  const groups=z.groups.map(g=>({g,t:zcGroupTotals(g)}));
  const medals=['🥇','🥈','🥉'],mcol=['#ffc107','#b0bec5','#cd7f32'];
  const ranking=[...groups].sort((a,b)=>b.t.pts-a.t.pts||b.t.pr-a.t.pr);
  const topPts=ranking[0]?ranking[0].t.pts||1:1;
  wrap.innerHTML=`<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,#6d4c41,var(--accent));color:#fff;margin-bottom:12px">
      <div style="font-size:34px;line-height:1">👥</div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">Teams &amp; Freundesgruppen</div><div style="font-size:18px;font-weight:800;line-height:1.2">${groups.length} Gruppe${groups.length===1?'':'n'}</div><div style="font-size:11px;opacity:0.9;margin-top:2px">Eigene Wertung &amp; Wochensieger (+20 🪙 je Mitglied)</div></div>
      <button onclick="zcGroupOpen('new')" style="flex:none;padding:8px 14px;font-size:12px;font-weight:700;border-radius:12px;border:1px solid rgba(255,255,255,0.6);background:rgba(255,255,255,0.18);color:#fff;cursor:pointer">＋ Neue Gruppe</button>
    </div>
    ${groups.length>1?sec('🏆 Gruppen-Wochenwertung')+ranking.map((r,i)=>`<div style="position:relative;overflow:hidden;display:flex;align-items:center;gap:10px;background:${i<3?`linear-gradient(120deg,${mcol[i]}22,var(--surface) 60%)`:'var(--surface)'};border:0.5px solid ${i<3&&r.t.pts>0?mcol[i]:'var(--divider)'};border-radius:12px;padding:9px 12px;margin-bottom:6px"><div style="position:absolute;left:0;bottom:0;height:3px;width:${Math.max(4,Math.round(r.t.pts/topPts*100))}%;background:${i<3?mcol[i]:'var(--accent)'};opacity:0.7"></div><span style="width:26px;text-align:center;font-size:${i<3?18:12}px">${medals[i]||(i+1)+'.'}</span><span style="font-size:20px">${r.g.icon}</span><span style="flex:1;font-size:13px;font-weight:800">${escHtml(r.g.name)} <span style="font-weight:400;font-size:11px;color:var(--text-3)">${r.g.members.length} Mitglieder</span></span><span style="font-size:14px;font-weight:800;color:${i<3&&r.t.pts>0?mcol[i]:'var(--text)'}">${r.t.pts} Pkt</span></div>`).join(''):''}
    ${groups.length?groups.map(({g,t})=>`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;overflow:hidden;margin-top:14px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(120deg,var(--active-bg),var(--surface))">
        <span style="width:42px;height:42px;border-radius:12px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:24px">${g.icon}</span>
        <span style="flex:1;min-width:0"><div style="font-size:16px;font-weight:800">${escHtml(g.name)}</div><div style="font-size:11px;color:var(--text-3)">${g.members.length} Mitglieder</div></span>
        <button class="timer-btn" onclick="zcGroupOpen('${g.id}')" style="padding:6px 11px;font-size:12px">✏️ Bearbeiten</button></div>
      <div style="padding:12px 14px">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:10px">
        ${[['⭐','Gesamt-PR',t.pr],['🎮','Partien',t.games],['🏆','Siege',t.wins],['🎯','Siegquote',(t.games?Math.round(t.wins/t.games*100):0)+'%'],['📅','Wochenpunkte',t.pts]].map(([ic,l,v])=>`<div style="background:var(--bg);border-radius:12px;padding:8px 6px;text-align:center"><div style="font-size:14px">${ic}</div><div style="font-size:17px;font-weight:800">${v}</div><div style="font-size:9px;color:var(--text-3);text-transform:uppercase">${l}</div></div>`).join('')}</div>
      ${t.m.map((m,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:0.5px solid var(--divider)">${zcBannerBar(m.name)}<span style="width:22px;font-size:${i<3?15:11}px;text-align:center;color:var(--text-3)">${medals[i]||(i+1)+'.'}</span>${zcAvatarHtml(m.name,28)}<span style="flex:1;font-size:13px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(m.name)} ${zcTitleOf(m.name)}</span><span style="font-size:11px;color:var(--text-3);white-space:nowrap">${m.pts} Wochenpkt · <b style="color:var(--text-2)">${m.total} PR</b></span></div>`).join('')}</div></div>`).join(''):`<div style="text-align:center;padding:28px 10px;margin-top:14px;background:var(--surface);border:0.5px dashed var(--divider);border-radius:16px"><div style="font-size:34px">👥</div><div style="font-size:13px;font-weight:700;margin:6px 0 4px">Noch keine Gruppe</div><div style="font-size:12px;color:var(--text-3)">Lege eine an, z. B. „Familie“ – dann gibt es eine eigene Gruppen-Wertung und einen Gruppen-Wochensieger (+20 🪙 je Mitglied).</div></div>`}
    ${z.gHist.length?sec('📜 Frühere Gruppen-Wochensieger')+z.gHist.map(h=>`<div style="background:var(--surface);border:0.5px solid var(--divider);border-left:4px solid var(--accent);border-radius:12px;padding:8px 12px;margin-bottom:6px;font-size:12px;color:var(--text-2)"><b style="color:var(--text)">KW ${h.week.split('-W')[1]}</b> · ${h.icon} ${escHtml(h.winner)} <span style="color:var(--text-3)">${h.list.slice(0,3).map(x=>escHtml(x.name)+' '+x.pts).join(' · ')}</span></div>`).join(''):''}`;
}

/* ══ Statistik-Dashboard ══ */
function zcSvgLine(vals,w,h,color){
  if(vals.length<2)return'<div style="font-size:12px;color:var(--text-3);text-align:center;padding:18px 0">Noch zu wenig Daten – der Verlauf füllt sich mit jeder Partie.</div>';
  const mn=Math.min(...vals),mx=Math.max(...vals),pad=14,rng=(mx-mn)||1,flat=mx===mn;
  const pts=vals.map((v,i)=>[pad+i*(w-2*pad)/(vals.length-1),flat?h/2:h-pad-(v-mn)/rng*(h-2*pad)]);
  const line=pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  return`<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block"><defs><linearGradient id="zcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <polygon points="${pad},${h-pad} ${line} ${w-pad},${h-pad}" fill="url(#zcg)"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="3.5" fill="${color}"/>
    ${flat?`<text x="${pad}" y="11" font-size="12" fill="var(--text-3)">${mx} PR</text>`:`<text x="${pad}" y="11" font-size="12" fill="var(--text-3)">max ${mx}</text><text x="${pad}" y="${h-2}" font-size="12" fill="var(--text-3)">min ${mn}</text>`}</svg>`;
}
function zcRenderStats(keepFocus){
  const wrap=document.getElementById('zc-stats');if(!wrap)return;
  const z=zcp(),name=(z.player||'').trim();
  if(keepFocus&&document.activeElement&&document.activeElement.id==='zc-stats-input'){const b=document.getElementById('zc-stats-body');if(b){b.innerHTML=zcStatsBody(name);return;}}
  wrap.innerHTML=`${zcPlayerInput('zc-stats-input')}<div id="zc-stats-body">${zcStatsBody(name)}</div>`;
}
function zcStatsBody(name){
  if(!name)return'<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Spieler wählen, um die Statistik zu sehen.</div>';
  const z=zcp(),k=zcKey(name),hist=z.hist[k]||[],a=zcAggregate(name);
  if(!a.rows.length&&!hist.length)return'<div style="font-size:12px;color:var(--text-3);text-align:center;padding:20px 0">Noch keine Partien für diesen Spieler.</div>';
  const card=(t,inner,sub)=>`<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:16px;padding:14px 16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05)"><div style="font-size:12px;font-weight:800;color:var(--text);letter-spacing:0.01em;margin-bottom:10px;padding-bottom:8px;border-bottom:0.5px solid var(--divider)">${t}</div>${inner}${sub?`<div style="font-size:10px;color:var(--text-3);margin-top:8px">${sub}</div>`:''}</div>`;
  const T=a.T,wr=T.games?Math.round(T.wins/T.games*100):0;
  const ri=smRankInfo('zentrale',a.total);
  const tile=(ic,l,v,s)=>`<div style="background:linear-gradient(160deg,var(--active-bg),var(--surface));border:0.5px solid var(--divider);border-radius:14px;padding:12px 10px;text-align:center"><div style="font-size:18px">${ic}</div><div style="font-size:24px;font-weight:800;line-height:1.15;color:var(--text)">${v}</div><div style="font-size:11px;font-weight:700;color:var(--text-2)">${l}</div>${s?`<div style="font-size:10px;color:var(--text-3);margin-top:1px">${s}</div>`:''}</div>`;
  let out=`<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:linear-gradient(120deg,var(--accent),${ri.tier.color});color:#fff;margin-bottom:12px">
      <div style="flex:none">${zcAvatarHtml(name,56)}</div>
      <div style="flex:1;min-width:0"><div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85">📊 Statistik</div><div style="font-size:19px;font-weight:800;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(name)}</div><div style="font-size:12px;opacity:0.92">${ri.icon} ${escHtml(ri.label)} · ${a.total} PR</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;margin-bottom:12px">${tile('🎮','Partien',T.games)}${tile('🎯','Siegquote',wr+'%',T.wins+' Siege')}${tile('🔥','Beste Serie',T.bestStreak)}${tile('🪙','Coins verdient',z.earned[k]||0)}</div>`;
  // 1) PR-Verlauf
  const prs=hist.filter(e=>e.pr!=null).slice(-80).map(e=>e.pr);
  out+=card('📈 PR-Verlauf (Gesamt-Rang)',zcSvgLine(prs,640,150,'var(--accent)'),hist.length?`letzte ${prs.length} aufgezeichnete Partien`:'Wird ab jetzt bei jeder Partie aufgezeichnet.');
  // 2) Form
  const form=hist.slice(-20);
  out+=card('🔥 Letzte Ergebnisse',form.length?`<div style="display:flex;gap:3px;flex-wrap:wrap">${form.map(e=>`<span title="${escHtml((zcChampGameInfo(e.g)||{}).title||e.g)}" style="width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;background:${e.r==='W'?'#43a047':e.r==='D'?'#fb8c00':'#e53935'}">${e.r==='W'?'S':e.r==='D'?'U':'N'}</span>`).join('')}</div>`:'<div style="font-size:12px;color:var(--text-3)">Noch keine aufgezeichneten Partien.</div>','S = Sieg · U = Unentschieden · N = Niederlage (ältestes links)');
  // 3) Siegquote pro Spiel
  out+=card('🎮 Siegquote pro Spiel',a.rows.length?a.rows.sort((x,y)=>y.r.games-x.r.games).map(x=>{const p=x.r.games?Math.round(x.r.wins/x.r.games*100):0;return`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="width:22px;text-align:center">${x.g.icon}</span><span style="width:96px;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(x.g.title)}</span><div style="flex:1;height:10px;background:var(--divider);border-radius:5px;overflow:hidden"><div style="height:100%;width:${p}%;background:var(--accent)"></div></div><span style="width:70px;text-align:right;font-size:11px;color:var(--text-2)">${p}% · ${x.r.games}</span></div>`;}).join(''):'–');
  // 4) gegen KI-Stufen
  const lv=[['easy','Leicht'],['medium','Mittel'],['hard','Schwer'],['expert','Sehr schwer']].map(([id,l])=>{const e=hist.filter(h=>h.d===id),w=e.filter(h=>h.r==='W').length;return{l,n:e.length,p:e.length?Math.round(w/e.length*100):0};});
  if(lv.some(x=>x.n))out+=card('🤖 Gegen die KI',lv.filter(x=>x.n).map(x=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="width:86px;font-size:11px">${x.l}</span><div style="flex:1;height:10px;background:var(--divider);border-radius:5px;overflow:hidden"><div style="height:100%;width:${x.p}%;background:#8e24aa"></div></div><span style="width:66px;text-align:right;font-size:11px;color:var(--text-2)">${x.p}% · ${x.n}</span></div>`).join(''));
  // 5) Aktivität
  if(hist.length){
    const grid=Array.from({length:7},()=>[0,0,0,0]);let mx=1;
    hist.forEach(e=>{const d=new Date(e.t),wd=(d.getDay()+6)%7,b=Math.floor(d.getHours()/6);grid[wd][b]++;mx=Math.max(mx,grid[wd][b]);});
    const days=['Mo','Di','Mi','Do','Fr','Sa','So'],cols=['0–6','6–12','12–18','18–24'];
    out+=card('🗓️ Wann du spielst',`<div style="display:grid;grid-template-columns:28px repeat(4,1fr);gap:3px;align-items:center"><span></span>${cols.map(c=>`<span style="font-size:9px;text-align:center;color:var(--text-3)">${c} Uhr</span>`).join('')}${grid.map((r,i)=>`<span style="font-size:10px;color:var(--text-3)">${days[i]}</span>${r.map(v=>`<span title="${v} Partien" style="height:20px;border-radius:4px;background:var(--accent);opacity:${v?0.15+0.85*v/mx:0.06}"></span>`).join('')}`).join('')}</div>`);
    // 6) Partien pro Woche
    const wk=[];for(let i=7;i>=0;i--){const d=new Date(Date.now()-i*7*86400000);wk.push(zcWeekKey(d));}
    const cnt=wk.map(w=>hist.filter(e=>zcWeekKey(new Date(e.t))===w).length),cm=Math.max(...cnt,1);
    out+=card('📊 Partien pro Woche',`<div style="display:flex;align-items:flex-end;gap:6px;height:80px">${cnt.map((c,i)=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"><span style="font-size:10px;color:var(--text-2)">${c||''}</span><div style="width:100%;height:${Math.round(c/cm*58)}px;min-height:${c?3:1}px;background:${i===7?'var(--accent)':'var(--text-3)'};border-radius:4px 4px 0 0;opacity:${i===7?1:0.6}"></div><span style="font-size:9px;color:var(--text-3);margin-top:2px">KW${wk[i].split('-W')[1]}</span></div>`).join('')}</div>`,'die letzten 8 Wochen (rechts: aktuelle)');
  }
  return out;
}

/* ── Schnellduell: von der Startseite direkt gegen einen anderen Account antreten ── */
const ZC_DUEL_GAMES=[
  {id:'ttt',icon:'⭕',title:'Tic-Tac-Toe',mode:()=>tttSetMode('2p')},
  {id:'vg',icon:'🔴',title:'Vier gewinnt',mode:()=>vgSetMode('2p')},
  {id:'chess',icon:'♟️',title:'Schach',mode:()=>chessSetMode('2p')},
  {id:'bs',icon:'🚢',title:'Schiffe versenken',mode:()=>bsSetMode('2p')},
  {id:'mem',icon:'🃏',title:'Memory',mode:()=>memSetMode('2p')},
  {id:'hm',icon:'🔤',title:'Hangman',mode:()=>hmSetMode('2p')},
  {id:'kniffel',icon:'🎲',title:'Kniffel',mode:null},
  {id:'mono',icon:'🏠',title:'Monopoly',mode:null}
];
function zcDuelChips(){
  const self=(zcp().player||'').trim();if(!self)return'';
  const others=zcProfiles().filter(p=>zcKey(p.name)!==zcKey(self));if(!others.length)return'';
  return`<div><div class="dsh-sec">⚔️ Schnellduell</div><div class="dsh-row">${others.map(p=>`<button class="dsh-chip" onclick="zcDuelOpen('${escHtml(p.name).replace(/'/g,"\'")}',event)">${zcAvatarHtml(p.name,22)}<span>${escHtml(p.name)}</span></button>`).join('')}</div></div>`;
}
function zcDuelFlyEl(){
  let el=document.getElementById('zc-duel-fly');
  if(!el){el=document.createElement('div');el.id='zc-duel-fly';el.style.cssText='position:fixed;z-index:1500;min-width:220px;background:var(--bg);border:0.5px solid var(--divider);border-radius:12px;padding:8px;box-shadow:0 12px 40px rgba(0,0,0,0.28);display:none';document.body.appendChild(el);}
  return el;
}
function zcDuelClose(){const el=document.getElementById('zc-duel-fly');if(el)el.style.display='none';document.removeEventListener('click',zcDuelOutside);}
function zcDuelOutside(e){const el=document.getElementById('zc-duel-fly');if(el&&el.style.display==='block'&&!el.contains(e.target))zcDuelClose();}
function zcDuelOpen(oppName,ev){
  const el=zcDuelFlyEl(),r=ev.currentTarget.getBoundingClientRect();
  el.innerHTML=`<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-3);padding:4px 8px 6px">Duell gegen ${escHtml(oppName)}</div>`
    +ZC_DUEL_GAMES.map(g=>`<button onclick="zcDuelStart('${escHtml(oppName).replace(/'/g,"\'")}','${g.id}')" style="display:flex;align-items:center;gap:10px;width:100%;padding:7px 8px;border:none;background:none;border-radius:8px;color:var(--text-2);font-size:13px;font-family:inherit;cursor:pointer;text-align:left" onmouseover="this.style.background='var(--active-bg)'" onmouseout="this.style.background='none'"><span style="width:22px;text-align:center;flex:none">${g.icon}</span>${g.title}</button>`).join('');
  el.style.display='block';
  const top=Math.min(r.bottom+6,window.innerHeight-el.offsetHeight-10),left=Math.max(8,Math.min(r.left,window.innerWidth-236));
  el.style.top=top+'px';el.style.left=left+'px';
  setTimeout(()=>document.addEventListener('click',zcDuelOutside),0);
}
function zcDuelStart(oppName,gameId){
  const self=(zcp().player||'').trim();if(!self){showToast('Wähle zuerst deinen Spieler');return;}
  const g=ZC_DUEL_GAMES.find(x=>x.id===gameId);if(!g)return;
  zcDuelClose();
  const la=zcAccountLook(self),lb=zcAccountLook(oppName);
  if(g.mode){
    goTo(g.id);
    setTimeout(()=>{
      g.mode();
      const s=smS(g.id).setup;
      s.names=[self,oppName];
      if(la){s.avatars[0]=la.avatar;s.colors[0]=la.color;}
      if(lb){s.avatars[1]=lb.avatar;s.colors[1]=lb.color;}
      if(s.colors[0]===s.colors[1])s.colors[1]=SM_COLORS.find(c=>c!==s.colors[0])||s.colors[1];
      smSave(g.id);if(typeof smRefresh==='function')smRefresh(g.id);
      if(SM_CFG[g.id]&&SM_CFG[g.id].newGame)SM_CFG[g.id].newGame();
      showToast(`⚔️ Duell gestartet: ${self} vs ${oppName}`,2500);
    },150);
  }else if(g.id==='kniffel'){
    goTo('kniffel');
    setTimeout(()=>{
      kniffPlayersSetup=[
        {name:self,color:(la&&la.color)||KNIFFEL_PLAYER_COLORS[0],avatar:(la&&la.avatar)||KNIFFEL_AVATARS[0],isAI:false},
        {name:oppName,color:(lb&&lb.color)||KNIFFEL_PLAYER_COLORS[1],avatar:(lb&&lb.avatar)||KNIFFEL_AVATARS[1],isAI:false}
      ];
      if(typeof kniffRenderPlayerSetup==='function')kniffRenderPlayerSetup();
      showToast(`⚔️ Kniffel-Duell vorbereitet – „Spiel starten" drücken`,2800);
    },150);
  }else if(g.id==='mono'){
    goTo('monopoly');
    setTimeout(()=>{
      monoPlayersSetup=[
        {name:self,color:(la&&la.color)||MONO_PLAYER_COLORS[0],avatar:(la&&la.avatar)||MONO_AVATARS[0],isAI:false,team:null},
        {name:oppName,color:(lb&&lb.color)||MONO_PLAYER_COLORS[1],avatar:(lb&&lb.avatar)||MONO_AVATARS[1],isAI:false,team:null}
      ];
      if(typeof monoRenderPlayerSetup==='function')monoRenderPlayerSetup();
      showToast(`⚔️ Monopoly-Duell vorbereitet – „Spiel starten" drücken`,2800);
    },150);
  }
}

/* ── Wochenrückblick: einmal pro Woche kurz zusammenfassen, wie die Vorwoche lief ── */
function zcWeeklyRecapCheck(){
  try{
    if(typeof zcWeekEnsure!=='function')return;
    const z=zcp();zcWeekEnsure();
    const last=(z.wkHist||[])[0];if(!last)return;
    if(z.recapShown===last.week)return;
    z.recapShown=last.week;smSave('zentrale');
    zcWeeklyRecapShow(last);
  }catch(e){}
}
function zcWeeklyRecapShow(h){
  let ov=document.getElementById('zc-recap');
  if(!ov){ov=document.createElement('div');ov.id='zc-recap';ov.style.cssText='display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:2200;align-items:center;justify-content:center;padding:16px';ov.onclick=e=>{if(e.target===ov)zcWeeklyRecapClose();};document.body.appendChild(ov);}
  const self=(zcp().player||'').trim(),medals=['🥇','🥈','🥉'];
  const rows=(h.top||[]).map((p,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:8px;background:${zcKey(p.name)===zcKey(self)?'var(--active-bg)':'var(--bg)'};margin-bottom:4px"><span style="width:24px;text-align:center">${medals[i]||(i+1)+'.'}</span><span style="flex:1;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.name)}${zcKey(p.name)===zcKey(self)?' <b>(du)</b>':''}</span><span style="font-size:11px;color:var(--text-3)">${p.games} Partien</span><span style="font-size:13px;font-weight:700;color:var(--text)">${p.pts} Pkt</span></div>`).join('');
  ov.innerHTML=`<div style="background:var(--bg);border:0.5px solid var(--divider);border-radius:18px;padding:24px 22px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5);color:var(--text)">
    <div style="font-size:20px;font-weight:800;text-align:center;margin-bottom:2px">📅 Wochenrückblick</div>
    <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:16px">Kalenderwoche ${h.week.split('-W')[1]}</div>
    ${h.winner?`<div style="text-align:center;font-size:14px;margin-bottom:14px">👑 <b style="color:var(--accent)">${escHtml(h.winner)}</b> hat die Woche gewonnen!${zcKey(h.winner)===zcKey(self)?' 🎉 Das warst du!':''}</div>`:''}
    ${rows||'<div style="font-size:12px;color:var(--text-3);text-align:center">Keine Partien in dieser Woche.</div>'}
    <div style="text-align:center;margin-top:16px"><button class="btn-generate" onclick="zcWeeklyRecapClose()" style="width:auto;padding:9px 22px">Weiter geht's ✓</button></div>
  </div>`;
  ov.style.display='flex';
}
function zcWeeklyRecapClose(){const ov=document.getElementById('zc-recap');if(ov)ov.style.display='none';}

/* ── Start ── */
function zcPlayersInit(){
  try{
    zcChipUpdate();
    const ps=zcProfiles();let seen='';try{seen=sessionStorage.getItem('zf_who')||'';}catch(e){}
    if(!seen){
      if(ps.length>=2)setTimeout(()=>zcWhoOpen(),400);
      else if(ps.length===1)zcSelectPlayer(ps[0].name,true);
    }else{const z=zcp();if(seen!=='-'&&!z.player)z.player=seen;}
    zcApplyPlayer();
    if(typeof sbReloadRecent==='function')sbReloadRecent();
    if(typeof goTo==='function'&&!zcPlayersInit.wrapped){zcPlayersInit.wrapped=true;const _g=goTo;goTo=function(id){const r=_g.apply(this,arguments);zcChipUpdate();return r;};}
    setTimeout(()=>{if(typeof zcWeeklyRecapCheck==='function')zcWeeklyRecapCheck();},2200);
  }catch(e){}
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(zcPlayersInit,0));
