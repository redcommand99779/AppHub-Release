/* ══════════════════════════════════
   VOKABELN – mehrere Stapel, Lernen nach dem Karteikasten-Prinzip (Leitner), Karteikarte / Tippen / Auswahl,
   Import & Export als Text. Daten: zf_vok2 (alte Karten aus zf_vokabeln werden einmalig übernommen).
   Karte: {id,f,b,box,due,ok,no}  box 0 = neu, 1–5 = Fach im Karteikasten, due = Tag der nächsten Wiederholung
══════════════════════════════════ */
const VOK_KEY='zf_vok2';
const VOK_BOX_DAYS=[0,1,3,7,14,30];          // Wartezeit in Tagen je Fach
const VOK_SESSION_SIZE=20;
const VOK_COINS_PER_DAY=10;
let vok=null,vokView='learn',vokSess=null,vokQuery='',vokEditId=null,vokMsg='';

function vokUid(){return Math.random().toString(36).slice(2,9);}
function vokEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function vokDay(){return Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/86400000);}
function vokShuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ── Daten ── */
function vokMakeCard(f,b){return {id:vokUid(),f:String(f).trim(),b:String(b).trim(),box:0,due:0,ok:0,no:0};}
function vokLoad(){
  let d=null;
  try{d=JSON.parse(localStorage.getItem(VOK_KEY)||'null');}catch(e){}
  if(!d||!Array.isArray(d.decks)){
    d={v:2,cur:'',decks:[],days:{},coinsDay:0,coinsDate:'',opts:{mode:'cards',dir:'fwd'}};
    let old=null;try{old=JSON.parse(localStorage.getItem('zf_vokabeln')||'null');}catch(e){}
    if(Array.isArray(old)&&old.length){   // alte Karten übernehmen (Duplikate der "Falsch"-Wiederholung entfernen)
      const seen={},cards=[];
      old.forEach(c=>{if(c&&c.front&&c.back){const k=c.front+'|'+c.back;if(!seen[k]){seen[k]=1;cards.push(vokMakeCard(c.front,c.back));}}});
      d.decks.push({id:vokUid(),name:'Meine Vokabeln',front:'Vorderseite',back:'Rückseite',cards});
    }
  }
  d.days=d.days||{};d.opts=Object.assign({mode:'cards',dir:'fwd'},d.opts||{});
  if(!d.decks.some(x=>x.id===d.cur))d.cur=d.decks.length?d.decks[0].id:'';
  return d;
}
function vokSave(){try{localStorage.setItem(VOK_KEY,JSON.stringify(vok));}catch(e){}}
function vokDeck(){return vok.decks.find(d=>d.id===vok.cur)||vok.decks[0]||null;}
function vokIsDue(c){return c.box===0||c.due<=vokDay();}
function vokStats(deck){
  const day=vokDay(),cards=deck.cards;
  return {total:cards.length,fresh:cards.filter(c=>c.box===0).length,due:cards.filter(c=>c.box>0&&c.due<=day).length,learned:cards.filter(c=>c.box>=4).length};
}
function vokStreak(){
  let n=0,day=vokDay();
  if(!vok.days[day])day--;            // heute noch nicht gelernt: Serie von gestern zählt weiter
  while(vok.days[day]){n++;day--;}
  return n;
}

/* ── Karten-Logik (ohne Oberfläche, testbar) ── */
function vokGrade(card,ok){
  if(ok){card.ok++;card.box=Math.min(5,card.box+1);card.due=vokDay()+VOK_BOX_DAYS[card.box];}
  else{card.no++;card.box=1;card.due=vokDay()+VOK_BOX_DAYS[1];}
}
function vokNorm(s){return String(s||'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[.!?¿¡"'`´]/g,'').replace(/\s+/g,' ').trim();}
function vokAlternatives(s){return String(s||'').split(/[;\/,]/).map(vokNorm).filter(Boolean);}
function vokAnswerOk(input,answer){
  const t=vokNorm(input);if(!t)return false;
  return vokNorm(answer)===t||vokAlternatives(answer).includes(t);
}
/* Text "vorne;hinten" pro Zeile (auch Tab oder " - ") -> Karten */
function vokParseImport(text){
  const out=[],bad=[];
  String(text||'').split(/\r?\n/).forEach((line,i)=>{
    line=line.trim();if(!line)return;
    let m=line.split('\t');if(m.length<2)m=line.split(';');if(m.length<2)m=line.split(' - ');
    const f=(m.shift()||'').trim(),b=m.join(';').trim();
    if(f&&b)out.push({f,b});else bad.push(i+1);
  });
  return {cards:out,bad};
}
function vokExportText(deck){return deck.cards.map(c=>c.f+';'+c.b).join('\n');}
function vokBuildQueue(deck,force,size){
  const day=vokDay();
  let pool=deck.cards.filter(c=>force?true:(c.box===0||c.due<=day));
  const due=pool.filter(c=>c.box>0).sort((a,b)=>a.due-b.due),fresh=pool.filter(c=>c.box===0);
  pool=due.concat(vokShuffle(fresh).slice(0,10));
  if(force)pool=vokShuffle(deck.cards);
  return pool.slice(0,size||VOK_SESSION_SIZE);
}
function vokMakeChoices(deck,card,rev,n){
  const right=rev?card.f:card.b;
  const others=vokShuffle(deck.cards.filter(c=>c.id!==card.id).map(c=>rev?c.f:c.b).filter((x,i,a)=>x!==right&&a.indexOf(x)===i)).slice(0,(n||4)-1);
  return vokShuffle(others.concat([right]));
}

/* ── Oberfläche ── */
function vokInit(){vok=vokLoad();vokSave();vokSess=null;vokEditId=null;vokMsg='';vokRender();vokBindKeys();}
function vokRoot(){return document.getElementById('vok-root');}
function vokSetView(v){vokView=v;vokSess=null;vokEditId=null;vokMsg='';vokRender();}
function vokRender(){
  const root=vokRoot();if(!root||!vok)return;
  const tab=(id,label)=>`<button class="lrn-tab${vokView===id?' active':''}" onclick="vokSetView('${id}')">${label}</button>`;
  let body='';
  if(vokView==='decks')body=vokRenderDecks();
  else if(!vok.decks.length)body=vokRenderNoDeck();
  else if(vokView==='learn')body=vokSess?vokRenderSession():vokRenderLearn();
  else body=vokRenderCards();
  root.innerHTML=`<div class="lrn-tabs">${tab('learn','🧠 Lernen')}${tab('decks','🗂 Stapel')}${tab('cards','✏️ Karten')}</div>${body}`;
  const f=root.querySelector('[data-autofocus]');if(f)f.focus();
}
/* Noch kein Stapel: nichts vorgegeben – erst einen eigenen anlegen */
function vokRenderNoDeck(){
  return `<div class="lrn-card" style="text-align:center;padding:34px 20px"><div style="font-size:44px">📚</div>
    <div style="font-size:18px;font-weight:800;margin:8px 0 4px">Noch keine Vokabeln</div>
    <div style="font-size:13px;color:var(--text-3);margin-bottom:16px">Lege deinen ersten Stapel an – zum Beispiel „Englisch Unit 1“ – und füge Vokabeln ein oder tippe sie einzeln ein.</div>
    <button class="lrn-btn" onclick="vokSetView('decks')">＋ Ersten Stapel anlegen</button></div>`;
}
function vokDeckSelect(){
  return `<select class="lrn-input" onchange="vokSelectDeck(this.value)" style="max-width:100%">${vok.decks.map(d=>`<option value="${d.id}" ${d.id===vok.cur?'selected':''}>${vokEsc(d.name)} (${d.cards.length})</option>`).join('')}</select>`;
}
function vokSelectDeck(id){vok.cur=id;vokSess=null;vokSave();vokRender();}

function vokRenderLearn(){
  const deck=vokDeck(),s=vokStats(deck),o=vok.opts,streak=vokStreak();
  const chip=(k,v,l)=>`<button class="lrn-chip${o[k]===v?' active':''}" onclick="vokSetOpt('${k}','${v}')">${l}</button>`;
  const ready=s.due+Math.min(s.fresh,10);
  return `<div class="lrn-card" style="margin-bottom:14px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><span style="font-size:12px;font-weight:700;color:var(--text-3)">STAPEL</span>${vokDeckSelect()}</div>
      <div class="lrn-tiles">
        <div class="lrn-tile"><b>${s.due}</b><span>fällig</span></div>
        <div class="lrn-tile"><b>${s.fresh}</b><span>neu</span></div>
        <div class="lrn-tile"><b>${s.learned}/${s.total}</b><span>gelernt</span></div>
        <div class="lrn-tile"><b>🔥 ${streak}</b><span>Tage in Folge</span></div>
      </div>
      <div class="lrn-bar"><div style="width:${s.total?Math.round(s.learned/s.total*100):0}%"></div></div>
    </div>
    <div class="lrn-card" style="margin-bottom:14px">
      <div class="lrn-label">Art des Übens</div>
      <div class="lrn-chips">${chip('mode','cards','🃏 Karteikarte')}${chip('mode','type','⌨️ Tippen')}${chip('mode','choice','🔘 Auswahl')}</div>
      <div class="lrn-label" style="margin-top:12px">Richtung</div>
      <div class="lrn-chips">${chip('dir','fwd',vokEsc(deck.front||'Vorne')+' → '+vokEsc(deck.back||'Hinten'))}${chip('dir','rev',vokEsc(deck.back||'Hinten')+' → '+vokEsc(deck.front||'Vorne'))}${chip('dir','mix','🔀 Gemischt')}</div>
    </div>
    ${deck.cards.length?`<button class="lrn-btn" onclick="vokStart(false)" ${ready?'':'disabled'} style="width:100%;padding:14px;font-size:16px">${ready?`▶ Los geht's – ${Math.min(ready,VOK_SESSION_SIZE)} Karten`:'✅ Heute ist alles gelernt'}</button>
      <div style="text-align:center;margin-top:10px"><button class="lrn-btn ghost" onclick="vokStart(true)">Trotzdem alle Karten üben</button></div>`
      :`<div class="lrn-card" style="text-align:center;color:var(--text-3)">Dieser Stapel ist leer. Füge unter <b>✏️ Karten</b> Vokabeln hinzu oder importiere eine Liste unter <b>🗂 Stapel</b>.</div>`}`;
}
function vokSetOpt(k,v){vok.opts[k]=v;vokSave();vokRender();}

function vokStart(force){
  const deck=vokDeck();if(!deck)return;
  const cards=vokBuildQueue(deck,force,VOK_SESSION_SIZE);
  if(!cards.length){vokRender();return;}
  let mode=vok.opts.mode;if(mode==='choice'&&deck.cards.length<2)mode='cards';
  const dir=vok.opts.dir;
  vokSess={mode,total:cards.length,queue:cards.map(c=>({id:c.id,rev:dir==='rev'||(dir==='mix'&&Math.random()<0.5),retry:false})),
    ok:0,no:0,wrong:[],dueOk:0,flipped:false,answered:false,result:null,choices:null,typed:''};
  vokPrepareChoices();vokRender();
}
function vokCur(){if(!vokSess)return null;const q=vokSess.queue[0];if(!q)return null;const card=vokDeck().cards.find(c=>c.id===q.id);return card?{q,card}:null;}
function vokPrepareChoices(){
  const c=vokSess&&vokCur();if(!c||vokSess.mode!=='choice'){return;}
  vokSess.choices=vokMakeChoices(vokDeck(),c.card,c.q.rev,4);
}
function vokRenderSession(){
  const S=vokSess,cur=vokCur();
  if(!cur)return vokRenderSummary();
  const {q,card}=cur,deck=vokDeck(),rev=q.rev;
  const ask=rev?card.b:card.f,answer=rev?card.f:card.b;
  const done=S.total-S.queue.filter(x=>!x.retry).length;
  const head=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><button class="lrn-btn ghost" onclick="vokEnd()">✕ Beenden</button>
      <div class="lrn-bar" style="flex:1;margin:0"><div style="width:${Math.round(done/S.total*100)}%"></div></div><span style="font-size:12px;color:var(--text-3);white-space:nowrap">${done}/${S.total}</span></div>`;
  const label=`<div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">${vokEsc(rev?deck.back:deck.front)}${q.retry?' · Wiederholung':''}</div>`;
  let inner='';
  if(S.mode==='cards'){
    inner=`<div class="lrn-flash" onclick="vokFlip()">${label}<div class="lrn-big">${vokEsc(ask)}</div>
        ${S.flipped?`<div class="lrn-sep"></div><div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--text-3);text-transform:uppercase;margin-bottom:8px">${vokEsc(rev?deck.front:deck.back)}</div><div class="lrn-big" style="color:var(--accent)">${vokEsc(answer)}</div>`
        :`<div style="margin-top:18px;font-size:12px;color:var(--text-3)">Tippen oder Leertaste zum Umdrehen</div>`}</div>
      ${S.flipped?`<div class="lrn-two"><button class="lrn-btn bad" onclick="vokMark(false)">✗ Nicht gewusst <small>(1)</small></button><button class="lrn-btn good" onclick="vokMark(true)">✓ Gewusst <small>(2)</small></button></div>`
      :`<button class="lrn-btn" style="width:100%" onclick="vokFlip()">Umdrehen</button>`}`;
  }else if(S.mode==='type'){
    inner=`<div class="lrn-flash" style="cursor:default">${label}<div class="lrn-big">${vokEsc(ask)}</div></div>
      ${S.answered?vokRenderResult(answer):`<div style="display:flex;gap:8px"><input class="lrn-input" data-autofocus id="vok-type" placeholder="${vokEsc(rev?deck.front:deck.back)} eingeben …" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;font-size:17px" onkeydown="if(event.key==='Enter')vokTypeSubmit()"><button class="lrn-btn" onclick="vokTypeSubmit()">Prüfen</button></div>
      <div style="text-align:center;margin-top:8px"><button class="lrn-btn ghost" onclick="vokTypeGiveUp()">Weiß ich nicht</button></div>`}`;
  }else{
    inner=`<div class="lrn-flash" style="cursor:default">${label}<div class="lrn-big">${vokEsc(ask)}</div></div>
      <div class="lrn-choices">${S.choices.map((c,i)=>{
        let cls='lrn-choice';
        if(S.answered){if(vokNorm(c)===vokNorm(answer)||c===answer)cls+=' right';else if(S.result&&S.result.pick===i)cls+=' wrong';}
        return `<button class="${cls}" ${S.answered?'disabled':''} onclick="vokPick(${i})"><span>${i+1}</span>${vokEsc(c)}</button>`;}).join('')}</div>
      ${S.answered?`<button class="lrn-btn" style="width:100%;margin-top:12px" onclick="vokNext()" data-autofocus>Weiter <small>(Enter)</small></button>`:''}`;
  }
  return head+inner;
}
function vokRenderResult(answer){
  const r=vokSess.result;
  return `<div class="lrn-result ${r.ok?'good':'bad'}"><b>${r.ok?'✓ Richtig!':'✗ Leider falsch'}</b>${r.ok?'':`<div style="margin-top:4px">Richtig wäre: <b>${vokEsc(answer)}</b>${r.typed?` <span style="opacity:.7">(du: ${vokEsc(r.typed)})</span>`:''}</div>`}</div>
    <button class="lrn-btn" style="width:100%;margin-top:10px" onclick="vokNext()" data-autofocus>Weiter <small>(Enter)</small></button>`;
}
function vokRenderSummary(){
  const S=vokSess,total=S.ok+S.no,pct=total?Math.round(S.ok/total*100):0;
  if(!S.finished)vokFinish();
  return `<div class="lrn-card" style="text-align:center">
      <div style="font-size:44px">${pct>=80?'🎉':pct>=50?'👍':'💪'}</div>
      <div style="font-size:22px;font-weight:800;margin:6px 0">${S.ok} von ${total} beim ersten Mal gewusst</div>
      <div class="lrn-bar" style="margin:10px auto;max-width:280px"><div style="width:${pct}%"></div></div>
      ${S.coins?`<div style="font-size:13px;margin-bottom:6px">🪙 +${S.coins} Coins für fleißiges Lernen</div>`:''}
      ${S.wrong.length?`<div style="text-align:left;margin-top:14px"><div class="lrn-label">Das üben wir nochmal</div>${S.wrong.map(w=>`<div class="lrn-row"><b>${vokEsc(w.f)}</b><span>${vokEsc(w.b)}</span></div>`).join('')}</div>`:'<div style="color:var(--text-3);font-size:13px;margin-top:8px">Alles beim ersten Mal richtig – stark!</div>'}
      <div class="lrn-two" style="margin-top:16px"><button class="lrn-btn ghost" onclick="vokEnd()">Fertig</button><button class="lrn-btn" onclick="vokStart(false)">Noch eine Runde</button></div>
    </div>`;
}
function vokFlip(){if(!vokSess||vokSess.mode!=='cards')return;vokSess.flipped=!vokSess.flipped;vokRender();}
/* Antwort werten: Fach/Datum nur beim ersten Versuch ändern; falsche Karten kommen ans Ende der Runde zurück */
function vokRecord(ok,typed){
  const S=vokSess,cur=vokCur();if(!cur)return;
  const {q,card}=cur;
  if(!q.retry){
    const wasDue=vokIsDue(card);
    vokGrade(card,ok);
    if(ok){S.ok++;if(wasDue)S.dueOk++;}else{S.no++;S.wrong.push({f:card.f,b:card.b});}
    vokSave();
  }
  if(!ok&&!q.retry)S.retryQueue=(S.retryQueue||[]).concat([card.id]);
  S.result={ok,typed:typed||'',pick:S.result&&S.result.pick};
}
function vokAdvance(){
  const S=vokSess;
  const q=S.queue.shift();
  if(S.result&&!S.result.ok&&!q.retry)S.queue.push({id:q.id,rev:q.rev,retry:true});
  S.flipped=false;S.answered=false;S.result=null;
  vokPrepareChoices();
}
function vokMark(ok){if(!vokSess)return;vokRecord(ok);vokAdvance();vokRender();}
function vokTypeSubmit(){
  if(!vokSess||vokSess.mode!=='type'||vokSess.answered)return;
  const cur=vokCur();if(!cur)return;
  const inp=document.getElementById('vok-type'),typed=inp?inp.value:'';
  if(!typed.trim()){if(inp)inp.focus();return;}
  const answer=cur.q.rev?cur.card.f:cur.card.b;
  vokRecord(vokAnswerOk(typed,answer),typed);vokSess.answered=true;vokRender();
}
function vokTypeGiveUp(){if(!vokSess||vokSess.answered)return;vokRecord(false,'');vokSess.answered=true;vokRender();}
function vokPick(i){
  if(!vokSess||vokSess.mode!=='choice'||vokSess.answered)return;
  const cur=vokCur();if(!cur)return;
  const answer=cur.q.rev?cur.card.f:cur.card.b,pick=vokSess.choices[i];if(pick==null)return;
  vokSess.result={pick};
  vokRecord(vokAnswerOk(pick,answer)||pick===answer,pick);vokSess.answered=true;vokSess.result.pick=i;vokRender();
}
function vokNext(){if(!vokSess||!vokSess.answered)return;vokAdvance();vokRender();}
function vokEnd(){vokSess=null;vokRender();}
function vokFinish(){
  const S=vokSess;S.finished=true;
  if(S.ok+S.no>0){vok.days[vokDay()]=(vok.days[vokDay()]||0)+S.ok+S.no;}
  // Coins: 1 pro 5 richtig wiederholte, wirklich fällige Karten – höchstens 10 pro Tag
  const today=String(vokDay());if(vok.coinsDate!==today){vok.coinsDate=today;vok.coinsDay=0;}
  let coins=Math.min(Math.floor(S.dueOk/5),VOK_COINS_PER_DAY-vok.coinsDay);
  if(coins>0&&typeof zcp==='function'&&typeof zcAddCoins==='function'){
    try{const name=(zcp().player||'').trim();if(name){zcAddCoins(name,coins);vok.coinsDay+=coins;if(typeof smSave==='function')smSave('zentrale');}else coins=0;}catch(e){coins=0;}
  }else coins=0;
  S.coins=coins;vokSave();
}

/* ── Stapel ── */
function vokRenderDecks(){
  const cur=vok.cur;
  return `${vokMsg?`<div class="lrn-msg">${vokEsc(vokMsg)}</div>`:''}
    ${vok.decks.map(d=>{const s=vokStats(d);return `<div class="lrn-card lrn-deck${d.id===cur?' cur':''}" style="margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:150px"><div style="font-size:15px;font-weight:800">${vokEsc(d.name)}${d.id===cur?' <span class="lrn-pill">aktiv</span>':''}</div>
          <div style="font-size:12px;color:var(--text-3)">${vokEsc(d.front)} → ${vokEsc(d.back)} · ${s.total} Karten · ${s.due} fällig · ${s.fresh} neu</div></div>
        <button class="lrn-btn ghost" onclick="vokSelectDeck('${d.id}');vokSetView('learn')">Lernen</button>
        <button class="lrn-btn ghost" onclick="vokRenameDeck('${d.id}')" title="Umbenennen">✏️</button>
        <button class="lrn-btn ghost" onclick="vokExport('${d.id}')" title="Als Text kopieren">📋</button>
        <button class="lrn-btn ghost" onclick="vokResetDeck('${d.id}')" title="Lernfortschritt zurücksetzen">↺</button>
        <button class="lrn-btn ghost" onclick="vokDeleteDeck('${d.id}')" title="Stapel löschen">🗑</button>
      </div></div>`;}).join('')}
    <div class="lrn-card" style="margin-top:14px">
      <div class="lrn-label">Neuen Stapel anlegen</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="vok-nd-name" class="lrn-input" placeholder="Name, z. B. Englisch Unit 3" style="flex:2;min-width:150px"><input id="vok-nd-front" class="lrn-input" placeholder="Vorderseite (Englisch)" style="flex:1;min-width:110px"><input id="vok-nd-back" class="lrn-input" placeholder="Rückseite (Deutsch)" style="flex:1;min-width:110px"></div>
      <div class="lrn-label" style="margin-top:12px">Vokabeln einfügen (optional) – eine pro Zeile: <code>vorne;hinten</code></div>
      <textarea id="vok-nd-text" class="lrn-input" rows="5" placeholder="apple;Apfel&#10;house;Haus&#10;to run;rennen" style="width:100%;resize:vertical"></textarea>
      <button class="lrn-btn" style="margin-top:10px" onclick="vokNewDeck()">＋ Stapel anlegen</button>
    </div>`;
}
function vokNewDeck(){
  const val=id=>{const e=document.getElementById(id);return e?e.value.trim():'';};
  const name=val('vok-nd-name');if(!name){vokMsg='Bitte gib dem Stapel einen Namen.';vokRender();return;}
  const imp=vokParseImport(val('vok-nd-text')||(document.getElementById('vok-nd-text')||{}).value||'');
  const deck={id:vokUid(),name,front:val('vok-nd-front')||'Vorderseite',back:val('vok-nd-back')||'Rückseite',cards:imp.cards.map(c=>vokMakeCard(c.f,c.b))};
  vok.decks.push(deck);vok.cur=deck.id;vokSave();
  vokMsg=`Stapel „${name}“ angelegt mit ${deck.cards.length} Karten.`+(imp.bad.length?` (Zeilen ohne Trennzeichen übersprungen: ${imp.bad.join(', ')})`:'');
  vokRender();
}
function vokRenameDeck(id){
  const d=vok.decks.find(x=>x.id===id);if(!d)return;
  const n=window.prompt('Neuer Name für den Stapel:',d.name);
  if(n&&n.trim()){d.name=n.trim();vokSave();vokRender();}
}
function vokDeleteDeck(id){
  const d=vok.decks.find(x=>x.id===id);if(!d)return;
  const go=()=>{vok.decks=vok.decks.filter(x=>x.id!==id);if(vok.cur===id)vok.cur=vok.decks.length?vok.decks[0].id:'';vokSave();vokRender();};
  if(typeof appConfirm==='function')appConfirm(`Stapel „${d.name}“ mit ${d.cards.length} Karten löschen?`,go);else go();
}
function vokResetDeck(id){
  const d=vok.decks.find(x=>x.id===id);if(!d)return;
  const go=()=>{d.cards.forEach(c=>{c.box=0;c.due=0;c.ok=0;c.no=0;});vokSave();vokMsg='Lernfortschritt zurückgesetzt.';vokRender();};
  if(typeof appConfirm==='function')appConfirm(`Lernfortschritt von „${d.name}“ zurücksetzen?`,go);else go();
}
function vokExport(id){
  const d=vok.decks.find(x=>x.id===id);if(!d)return;
  const text=vokExportText(d);
  const done=()=>{vokMsg='📋 '+d.cards.length+' Karten als Text kopiert (vorne;hinten pro Zeile).';vokRender();};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(done,()=>window.prompt('Zum Kopieren markieren:',text));
  else window.prompt('Zum Kopieren markieren:',text);
}

/* ── Karten bearbeiten ── */
function vokRenderCards(){
  const deck=vokDeck(),q=vokNorm(vokQuery);
  const list=deck.cards.filter(c=>!q||vokNorm(c.f).includes(q)||vokNorm(c.b).includes(q)).slice().reverse();
  const dots=c=>Array.from({length:5},(_,i)=>`<i class="${i<c.box?'on':''}"></i>`).join('');
  return `<div class="lrn-card" style="margin-bottom:12px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px"><span style="font-size:12px;font-weight:700;color:var(--text-3)">STAPEL</span>${vokDeckSelect()}</div>
      <div class="lrn-label">Neue Karte</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="vok-add-f" class="lrn-input" placeholder="${vokEsc(deck.front)}" style="flex:1;min-width:120px" onkeydown="if(event.key==='Enter')document.getElementById('vok-add-b').focus()"><input id="vok-add-b" class="lrn-input" placeholder="${vokEsc(deck.back)}" style="flex:1;min-width:120px" onkeydown="if(event.key==='Enter')vokAddCard()"><button class="lrn-btn" onclick="vokAddCard()">＋ Hinzufügen</button></div>
      <div style="font-size:11px;color:var(--text-3);margin-top:6px">Tipp: Mehrere richtige Antworten mit Komma oder / trennen (z. B. <i>Katze, Kater</i>) – beim Tippen zählt jede davon.</div>
    </div>
    <input class="lrn-input" placeholder="🔍 Suchen …" value="${vokEsc(vokQuery)}" oninput="vokSearch(this.value)" style="width:100%;margin-bottom:10px">
    ${list.length?list.map(c=>vokEditId===c.id?`<div class="lrn-card" style="margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input id="vok-ed-f" class="lrn-input" value="${vokEsc(c.f)}" style="flex:1;min-width:110px"><input id="vok-ed-b" class="lrn-input" value="${vokEsc(c.b)}" style="flex:1;min-width:110px" onkeydown="if(event.key==='Enter')vokSaveCard('${c.id}')">
        <button class="lrn-btn" onclick="vokSaveCard('${c.id}')">Speichern</button><button class="lrn-btn ghost" onclick="vokEditCard(null)">Abbrechen</button></div>`
      :`<div class="lrn-row card"><div style="flex:1;min-width:0"><b>${vokEsc(c.f)}</b><span>${vokEsc(c.b)}</span></div><span class="lrn-dots" title="Fach ${c.box} von 5">${dots(c)}</span>
        <button class="lrn-btn ghost" onclick="vokEditCard('${c.id}')">✏️</button><button class="lrn-btn ghost" onclick="vokDelCard('${c.id}')">🗑</button></div>`).join('')
      :`<div style="text-align:center;color:var(--text-3);padding:20px;font-size:13px">${deck.cards.length?'Keine Treffer.':'Noch keine Karten in diesem Stapel.'}</div>`}`;
}
function vokSearch(v){vokQuery=v||'';vokRender();const e=document.querySelector('#vok-root input[placeholder^="🔍"]');if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length);}}
function vokAddCard(){
  const f=document.getElementById('vok-add-f'),b=document.getElementById('vok-add-b');if(!f||!b)return;
  if(!f.value.trim()||!b.value.trim()){(f.value.trim()?b:f).focus();return;}
  vokDeck().cards.push(vokMakeCard(f.value,b.value));vokSave();vokRender();
  const nf=document.getElementById('vok-add-f');if(nf)nf.focus();
}
function vokEditCard(id){vokEditId=id;vokRender();}
function vokSaveCard(id){
  const c=vokDeck().cards.find(x=>x.id===id),f=document.getElementById('vok-ed-f'),b=document.getElementById('vok-ed-b');
  if(!c||!f||!b||!f.value.trim()||!b.value.trim())return;
  c.f=f.value.trim();c.b=b.value.trim();vokEditId=null;vokSave();vokRender();
}
function vokDelCard(id){const d=vokDeck();d.cards=d.cards.filter(c=>c.id!==id);vokSave();vokRender();}

/* ── Tastatur ── */
let vokKeysBound=false;
function vokBindKeys(){
  if(vokKeysBound)return;vokKeysBound=true;
  document.addEventListener('keydown',e=>{
    const scr=document.getElementById('screen-vokabeln');if(!scr||!scr.classList.contains('active')||!vokSess||vokView!=='learn')return;
    const tag=(e.target&&e.target.tagName)||'';
    if(vokSess.finished||!vokCur())return;
    if(vokSess.mode==='cards'){
      if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!vokSess.flipped)vokFlip();else vokMark(true);}
      else if(vokSess.flipped&&(e.key==='1'||e.key==='ArrowLeft')){e.preventDefault();vokMark(false);}
      else if(vokSess.flipped&&(e.key==='2'||e.key==='ArrowRight')){e.preventDefault();vokMark(true);}
    }else if(vokSess.mode==='choice'){
      if(!vokSess.answered&&/^[1-4]$/.test(e.key)){e.preventDefault();vokPick(+e.key-1);}
      else if(vokSess.answered&&e.key==='Enter'){e.preventDefault();vokNext();}
    }else if(vokSess.mode==='type'&&vokSess.answered&&e.key==='Enter'&&tag!=='BUTTON'){e.preventDefault();vokNext();}
  });
}
