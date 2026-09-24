/* ══════════════════════════════════
   REPLAY – Partien aufnehmen, in der App ansehen, als Video (MP4/WebM) speichern
   Die Spiele legen Zustands-Frames ab (rplBegin/rplPush bzw. smSnap); am Spielende
   wird das Replay gesichert (rplFinish). Gezeichnet wird auf ein Canvas – dasselbe
   Canvas wird per MediaRecorder zum Video aufgenommen.
══════════════════════════════════ */
const RPL_LIVE={},RPL_DRAW={};
const RPL_W=640,RPL_H=480;
const RPL_TITLES={ttt:'Tic-Tac-Toe',vg:'Vier gewinnt',chess:'Schach',bs:'Schiffe versenken',mem:'Memory',hm:'Hangman',mm:'Mau-Mau',kniffel:'Kniffel',mono:'Monopoly'};
const RPL_PACK={
  ttt:f=>({board:f.board,turn:f.turn}),
  vg:f=>({board:f.board,turn:f.turn}),
  chess:f=>({board:f.board,turn:f.turn})
};
const RPL_LIVE_PREF={mm:true};
let RPL_UI={id:null,rid:null,p:0,seq:[],hl:false,playing:false,speed:1,timer:null,rec:false};

function rplBegin(id){RPL_LIVE[id]=[];}
function rplPush(id,f){
  const a=RPL_LIVE[id]||(RPL_LIVE[id]=[]);
  const k=JSON.stringify(f);
  if(a.length&&a._last===k)return;
  a._last=k;a.push(f);
  if(a.length>3000)a.splice(1,1);
}
function rplSample(frames,max){
  if(frames.length<=max)return frames.slice();
  const out=[];
  for(let i=0;i<max;i++)out.push(frames[Math.round(i*(frames.length-1)/(max-1))]);
  return out;
}

/* ── Bibliothek: mehrere Replays pro Spiel, Favoriten, Löschen ── */
const RPL_LIST={},RPL_MARKS={};
const RPL_MAX_NONFAV=8,RPL_MAX_FAV=12;
/* Pro Account: jeder Spieler hat seine eigene Liste (Schlüssel zf_rpll_<spiel>_<spieler>).
   Ohne gewählten Spieler gilt die alte gemeinsame Liste. */
function rplScope(){try{return typeof zcp==='function'&&typeof zcKey==='function'?zcKey(zcp().player||''):'';}catch(e){return '';}}
function rplLegacyList(id){
  let arr=[];
  try{const s=localStorage.getItem('zf_rpll_'+id);if(s)arr=JSON.parse(s);}catch(e){}
  if(!arr.length){try{const o=localStorage.getItem('zf_rpl_'+id);if(o){arr=[Object.assign({rid:'m'+id,fav:false},JSON.parse(o))];localStorage.removeItem('zf_rpl_'+id);}}catch(e){}}
  return arr;
}
function rplLoadList(id,sc){
  if(sc==null)sc=rplScope();
  const ck=sc+'|'+id;
  if(RPL_LIST[ck])return RPL_LIST[ck];
  let arr=[];
  if(!sc)arr=rplLegacyList(id);
  else{
    let s=null;try{s=localStorage.getItem('zf_rpll_'+id+'_'+sc);}catch(e){}
    if(s!=null){try{arr=JSON.parse(s);}catch(e){}}
    else{ // erste Nutzung: bisherige gemeinsame Replays übernehmen, an denen dieser Account beteiligt war
      arr=rplLegacyList(id).filter(r=>r&&r.meta&&(r.meta.names||[]).some(n=>typeof zcKey==='function'&&zcKey(n)===sc));
    }
  }
  RPL_LIST[ck]=(arr||[]).filter(r=>r&&r.frames&&r.frames.length>=2);
  return RPL_LIST[ck];
}
function rplSaveList(id,sc){
  if(sc==null)sc=rplScope();
  const arr=RPL_LIST[sc+'|'+id];if(!arr)return;
  const nonfav=arr.filter(r=>!r.fav);
  while(nonfav.length>RPL_MAX_NONFAV){const d=nonfav.pop();arr.splice(arr.indexOf(d),1);}
  const favs=arr.filter(r=>r.fav);
  while(favs.length>RPL_MAX_FAV){const d=favs.pop();arr.splice(arr.indexOf(d),1);}
  const key='zf_rpll_'+id+(sc?'_'+sc:'');
  for(let t=0;t<14;t++){
    try{localStorage.setItem(key,JSON.stringify(arr));return;}
    catch(e){const i=[...arr.keys()].reverse().find(k=>!arr[k].fav);if(i==null)break;arr.splice(i,1);}
  }
}
const RPL_LASTSC={};
function rplFinish(id,meta){
  let frames;
  if(typeof SM_CFG!=='undefined'&&SM_CFG[id]&&SM_CFG[id].snapshot&&SM_SNAP[id]&&!RPL_LIVE_PREF[id])frames=SM_SNAP[id].map(RPL_PACK[id]||(x=>x));
  else frames=(RPL_LIVE[id]||[]).slice();
  if(frames.length<2)return;
  const sampled=rplSample(frames,300);
  const m=Object.assign({title:RPL_TITLES[id]||id,t:Date.now()},meta||{});
  try{m.marks=(RPL_MARKS[id]?RPL_MARKS[id](sampled,m):[]).slice(0,60);}catch(e){m.marks=[];}
  const rid=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  // das Replay landet beim aktuellen Account und bei allen beteiligten Accounts
  const scopes=new Set([rplScope()]);
  if(typeof zcProfileOf==='function')(m.names||[]).forEach(n=>{if(zcProfileOf(n))scopes.add(zcKey(n));});
  let entry=null;
  scopes.forEach(sc=>{
    const e={rid,frames:sampled,meta:Object.assign({},m),fav:false};
    rplLoadList(id,sc).unshift(e);rplSaveList(id,sc);
    if(sc===rplScope())entry=e;
  });
  RPL_LASTSC[id]={rid,scopes:[...scopes]};
  rplRefreshButtons();
  return entry;
}
function rplGet(id,idx){return rplLoadList(id)[idx||0]||null;}
function rplHas(id){return rplLoadList(id).length>0;}
function rplUpdateMeta(id,patch){
  const ls=RPL_LASTSC[id];
  if(ls){ls.scopes.forEach(sc=>{const e=rplLoadList(id,sc).find(r=>r.rid===ls.rid);if(e){Object.assign(e.meta,patch);rplSaveList(id,sc);}});return;}
  const l=rplLoadList(id);if(l[0]){Object.assign(l[0].meta,patch);rplSaveList(id);}
}
function rplToggleFav(id,rid){const e=rplLoadList(id).find(r=>r.rid===rid);if(e){e.fav=!e.fav;rplSaveList(id);}return e?e.fav:false;}
function rplDelete(id,rid){const l=rplLoadList(id),i=l.findIndex(r=>r.rid===rid);if(i>=0){l.splice(i,1);rplSaveList(id);rplRefreshButtons();}}
function rplRefreshButtons(){
  document.querySelectorAll('[data-rpl]').forEach(b=>{b.style.display=rplHas(b.dataset.rpl)?'':'none';});
  if(typeof smRefresh==='function'&&typeof SM_CFG!=='undefined')Object.keys(SM_CFG).forEach(id=>{if(!SM_CFG[id].noMount&&document.getElementById('sm-'+id+'-meta'))smRefresh(id);});
}

/* ── Zeichnen ── */
function rplRR(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function rplT(ctx,txt,x,y,size,color,align,bold){ctx.font=(bold?'bold ':'')+size+'px system-ui,"Segoe UI Emoji",sans-serif';ctx.fillStyle=color||'#f2f4f8';ctx.textAlign=align||'left';ctx.textBaseline='middle';ctx.fillText(txt,x,y);}
function rplDrawFrame(ctx,id,r,i){
  const W=RPL_W,H=RPL_H,m=r.meta||{},n=r.frames.length,f=r.frames[i];
  ctx.fillStyle='#1c2130';ctx.fillRect(0,0,W,H);
  rplT(ctx,'🎬 '+(RPL_TITLES[id]||id),18,26,20,'#f2f4f8','left',true);
  rplT(ctx,(m.names||[]).join('  vs  ').slice(0,56),W-18,26,13,'#9aa4b8','right');
  const d=RPL_DRAW[id];
  ctx.save();ctx.beginPath();ctx.rect(0,50,W,H-110);ctx.clip();
  try{if(d)d(ctx,f,{x:0,y:50,w:W,h:H-110},m,i,n);}catch(e){rplT(ctx,'Darstellungsfehler',W/2,H/2,16,'#e57373','center');}
  ctx.restore();
  ctx.fillStyle='#2c3448';ctx.fillRect(0,H-50,W,50);
  ctx.fillStyle='#7c9cff';ctx.fillRect(0,H-50,W*(n>1?i/(n-1):1),4);
  rplT(ctx,`Schritt ${i+1} / ${n}`,18,H-26,13,'#c9d1e6','left');
  if(i===n-1&&m.result)rplT(ctx,m.result,W-18,H-26,15,'#ffd54f','right',true);
  const mk=(m.marks||[]).find(k=>k.i===i&&!(i===n-1&&m.result&&k.icon==='🏁'));
  if(mk)rplT(ctx,mk.icon+' '+mk.label,W/2,H-27,14,'#ffffff','center',true);
}
function rplArea(a,pad){const s=Math.min(a.w,a.h)-pad*2;return{s,x:a.x+(a.w-s)/2,y:a.y+(a.h-s)/2};}

RPL_DRAW.ttt=(ctx,f,a,m)=>{
  const {s,x,y}=rplArea(a,14),c=s/3;
  ctx.strokeStyle='#4a5573';ctx.lineWidth=4;
  for(let k=1;k<3;k++){ctx.beginPath();ctx.moveTo(x+k*c,y+8);ctx.lineTo(x+k*c,y+s-8);ctx.stroke();ctx.beginPath();ctx.moveTo(x+8,y+k*c);ctx.lineTo(x+s-8,y+k*c);ctx.stroke();}
  f.board.forEach((v,i)=>{if(!v)return;const col=(m.colors||[])[v==='X'?0:1]||'#fff';rplT(ctx,v==='X'?'✕':'○',x+(i%3)*c+c/2,y+Math.floor(i/3)*c+c/2,c*0.7,col,'center',true);});
};
RPL_DRAW.vg=(ctx,f,a,m)=>{
  const c=Math.min((a.w-30)/7,(a.h-10)/6),w=c*7,h=c*6,x=a.x+(a.w-w)/2,y=a.y+(a.h-h)/2;
  rplRR(ctx,x-6,y-6,w+12,h+12,12);ctx.fillStyle='#2a4d9b';ctx.fill();
  const cols=m.colors||['#ff3b30','#ffcc00'];
  f.board.forEach((row,r)=>row.forEach((v,cc)=>{ctx.beginPath();ctx.arc(x+cc*c+c/2,y+r*c+c/2,c*0.4,0,7);ctx.fillStyle=v===1?cols[0]:v===2?cols[1]:'#1c2130';ctx.fill();}));
};
RPL_DRAW.chess=(ctx,f,a)=>{
  const {s,x,y}=rplArea(a,6),c=s/8,CPm=typeof CP!=='undefined'?CP:{};
  for(let r=0;r<8;r++)for(let k=0;k<8;k++){
    ctx.fillStyle=(r+k)%2?'#a67c52':'#e8d8b8';ctx.fillRect(x+k*c,y+r*c,c,c);
    const p=f.board[r*8+k];if(!p)continue;
    const white=p===p.toUpperCase();
    ctx.font=Math.floor(c*0.8)+'px "Segoe UI Symbol","Noto Sans Symbols2",serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.lineWidth=2;ctx.strokeStyle=white?'#222':'#eee';ctx.strokeText(CPm[p]||p,x+k*c+c/2,y+r*c+c/2+2);
    ctx.fillStyle=white?'#fff':'#111';ctx.fillText(CPm[p]||p,x+k*c+c/2,y+r*c+c/2+2);
  }
};
RPL_DRAW.bs=(ctx,f,a,m)=>{
  const c=Math.min((a.w-60)/20,(a.h-40)/10),gw=c*10,gap=30,x0=a.x+(a.w-(gw*2+gap))/2,y0=a.y+(a.h-gw)/2+10;
  [[f.g1,0],[f.g2,1]].forEach(([g,k])=>{
    const x=x0+k*(gw+gap);
    rplT(ctx,(m.names||[])[k]||'Flotte '+(k+1),x+gw/2,y0-14,13,'#c9d1e6','center',true);
    for(let i=0;i<100;i++){
      const cx=x+(i%10)*c,cy=y0+Math.floor(i/10)*c,v=g[i];
      ctx.fillStyle=v===1?'#7f8c9b':v===2?'#e53935':'#1b3a5c';ctx.fillRect(cx+1,cy+1,c-2,c-2);
      if(v===3){ctx.beginPath();ctx.arc(cx+c/2,cy+c/2,c*0.16,0,7);ctx.fillStyle='#dfe6ee';ctx.fill();}
    }
  });
};
RPL_DRAW.mem=(ctx,f,a,m)=>{
  const N=f.cards.length,cols=N<=16?4:N<=24?6:Math.ceil(Math.sqrt(N)),rows=Math.ceil(N/cols);
  const top=34,c=Math.min((a.w-40)/cols,(a.h-top-10)/rows),w=c*cols,x=a.x+(a.w-w)/2,y=a.y+top;
  const nm=m.names||['Spieler 1','Spieler 2'];
  rplT(ctx,`${nm[0]}: ${f.s[0]}`,a.x+24,a.y+16,15,f.turn===1?'#ffd54f':'#c9d1e6','left',true);
  rplT(ctx,`${nm[1]}: ${f.s[1]}`,a.x+a.w-24,a.y+16,15,f.turn===2?'#ffd54f':'#c9d1e6','right',true);
  f.cards.forEach((e,i)=>{
    const cx=x+(i%cols)*c,cy=y+Math.floor(i/cols)*c,up=f.matched.includes(i)||f.flipped.includes(i);
    rplRR(ctx,cx+3,cy+3,c-6,c-6,8);ctx.fillStyle=up?'#f2f4f8':'#3a4a7a';ctx.fill();
    if(f.matched.includes(i)){ctx.strokeStyle='#43a047';ctx.lineWidth=3;ctx.stroke();}
    if(up)rplT(ctx,e,cx+c/2,cy+c/2+1,c*0.5,'#111','center');
  });
};
RPL_DRAW.hm=(ctx,f,a)=>{
  const figs=['😊','😐','😮','😨','😰','😱','💀'];
  rplT(ctx,figs[Math.min(f.errors,6)],a.x+130,a.y+a.h/2-10,110,'#fff','center');
  rplT(ctx,`Fehler: ${f.errors}/6`,a.x+130,a.y+a.h-26,14,'#c9d1e6','center');
  const word=f.word.split(''),step=Math.min(44,(a.w-300)/Math.max(word.length,1));
  const sx=a.x+260;
  word.forEach((ch,i)=>{
    const shown=!/[A-ZÄÖÜ]/.test(ch)||f.guessed.includes(ch);
    rplT(ctx,shown?ch:'_',sx+i*step,a.y+a.h/2-10,Math.min(38,step*0.9),shown?'#fff':'#7c8aa8','left',true);
  });
  const wrong=f.guessed.filter(l=>!f.word.includes(l));
  rplT(ctx,'Falsch: '+(wrong.join(' ')||'–'),a.x+260,a.y+a.h/2+50,15,'#e57373','left');
};
RPL_DRAW.mm=(ctx,f,a,m)=>{
  const card=(cd,x,y,hide)=>{rplRR(ctx,x,y,38,54,6);ctx.fillStyle=hide?'#1a5fc4':'#fff';ctx.fill();
    if(!hide&&cd){const red=cd.c==='♥'||cd.c==='♦';rplT(ctx,cd.v,x+19,y+20,15,red?'#d32f2f':'#222','center',true);rplT(ctx,cd.c,x+19,y+40,17,red?'#d32f2f':'#222','center');}};
  const row=(cards,y,label,color)=>{rplT(ctx,label,a.x+16,y-10,13,color,'left',true);
    const step=Math.min(42,(a.w-60)/Math.max(cards.length,1));cards.forEach((cd,i)=>card(cd,a.x+20+i*step,y,false));};
  const nm=m.names||['Du','Gegner'];
  row(f.a,a.y+22,`${nm[1]} (${f.a.length})`,'#c9d1e6');
  rplT(ctx,'Ablage',a.x+a.w/2-60,a.y+a.h/2-8,12,'#9aa4b8','center');
  if(f.d)card(f.d,a.x+a.w/2-19-60,a.y+a.h/2+2,false);
  card(null,a.x+a.w/2+40,a.y+a.h/2-24,true);rplT(ctx,`Stapel ${f.pile}`,a.x+a.w/2+59,a.y+a.h/2+42,12,'#9aa4b8','center');
  if(f.wish)rplT(ctx,'Wunsch '+f.wish,a.x+a.w/2-60,a.y+a.h/2+74,13,'#ffd54f','center',true);
  row(f.p,a.y+a.h-70,`${nm[0]} (${f.p.length})`,'#c9d1e6');
};
RPL_DRAW.kniffel=(ctx,f,a,m)=>{
  const nm=m.names||[],colors=m.colors||[];
  f.dice.forEach((d,i)=>{const x=a.x+24+i*54;rplRR(ctx,x,a.y+16,46,46,8);ctx.fillStyle='#f2f4f8';ctx.fill();rplT(ctx,String(d),x+23,a.y+40,26,'#111','center',true);});
  if(f.last)rplT(ctx,`${nm[f.last.p]||'?'} wählt „${f.last.cat}" (${f.last.score})`,a.x+24,a.y+84,15,'#ffd54f','left',true);
  const max=Math.max(1,...f.tot),bw=a.w-220;
  f.tot.forEach((t,i)=>{
    const y=a.y+120+i*Math.min(34,(a.h-130)/Math.max(f.tot.length,1));
    rplT(ctx,nm[i]||'Spieler '+(i+1),a.x+24,y,14,f.turn===i?'#ffd54f':'#c9d1e6','left',f.turn===i);
    ctx.fillStyle=colors[i]||'#7c9cff';ctx.fillRect(a.x+150,y-8,Math.max(2,bw*t/max),16);
    rplT(ctx,String(t),a.x+150+Math.max(2,bw*t/max)+8,y,14,'#fff','left',true);
  });
};
RPL_DRAW.mono=(ctx,f,a,m)=>{
  const S=Math.min(a.h-6,a.w-220),c=S/11,x0=a.x+8,y0=a.y+(a.h-S)/2;
  const cell=i=>i<=10?[10-i,10]:i<=19?[0,10-(i-10)]:i<=30?[i-20,0]:[10,i-30];
  const cols=m.colors||[];
  for(let i=0;i<40;i++){
    const [gx,gy]=cell(i),o=f.own[i];
    ctx.fillStyle=o!==undefined?(cols[o]||'#888'):'#33405e';ctx.globalAlpha=o!==undefined?0.85:1;ctx.fillRect(x0+gx*c+1,y0+gy*c+1,c-2,c-2);ctx.globalAlpha=1;
  }
  const GC={brown:'#8d5a3b',lightblue:'#8fd3f4',pink:'#e879b9',orange:'#fb8c00',red:'#e53935',yellow:'#fdd835',green:'#43a047',darkblue:'#1a4fb3'};
  (m.fc||[]).forEach((col,i)=>{if(!col||!GC[col]||i>=40)return;const [gx,gy]=cell(i);ctx.fillStyle=GC[col];ctx.fillRect(x0+gx*c+1,y0+gy*c+1,c-2,5);});
  rplT(ctx,'MONOPOLY',x0+S/2,y0+S/2,c*0.9,'#3a4666','center',true);
  f.pos.forEach((p,i)=>{
    if(f.out.includes(i))return;
    const [gx,gy]=cell(p%40);
    ctx.beginPath();ctx.arc(x0+gx*c+c*0.3+(i%3)*c*0.2,y0+gy*c+c*0.3+Math.floor(i/3)*c*0.25,c*0.17,0,7);ctx.fillStyle=cols[i]||'#fff';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#fff';ctx.stroke();
  });
  const nm=m.names||[],lx=x0+S+20;
  f.mon.forEach((mo,i)=>{
    const y=a.y+22+i*30,out=f.out.includes(i);
    ctx.beginPath();ctx.arc(lx+8,y,7,0,7);ctx.fillStyle=cols[i]||'#888';ctx.fill();
    rplT(ctx,(nm[i]||'Spieler '+(i+1)).slice(0,10),lx+22,y,13,out?'#6b7691':(f.turn===i?'#ffd54f':'#c9d1e6'),'left',f.turn===i);
    rplT(ctx,out?'bankrott':mo+'€',a.x+a.w-14,y,13,out?'#e57373':'#fff','right',true);
  });
};

/* ── Highlights automatisch erkennen ── */
function rplPieceCounts(board){const c={};board.forEach(p=>{if(p)c[p]=(c[p]||0)+1;});return c;}
RPL_MARKS.chess=(fr,m)=>{
  const names={q:'Dame',r:'Turm',b:'Läufer',n:'Springer',p:'Bauer'},marks=[];
  for(let i=1;i<fr.length;i++){
    const a=rplPieceCounts(fr[i-1].board),b=rplPieceCounts(fr[i].board);
    let cap=null,capW=false;
    Object.keys(a).forEach(p=>{if((b[p]||0)<a[p]&&p.toLowerCase()!=='k'){const lower=p.toLowerCase();if(!cap||['q','r','b','n','p'].indexOf(lower)<['q','r','b','n','p'].indexOf(cap)){cap=lower;capW=p===p.toUpperCase();}}});
    const promo=((b.Q||0)>(a.Q||0))||((b.q||0)>(a.q||0));
    if(promo)marks.push({i,icon:'👑',label:'Umwandlung zur Dame'});
    else if(cap)marks.push({i,icon:'⚔️',label:`${names[cap]} geschlagen`});
  }
  if(m.winner!=null&&m.winner!==-1)marks.push({i:fr.length-1,icon:'🏁',label:'Schachmatt'});
  else marks.push({i:fr.length-1,icon:'🏁',label:'Partieende'});
  return marks;
};
RPL_MARKS.ttt=(fr,m)=>[{i:fr.length-1,icon:'🏁',label:m.winner===-1?'Unentschieden':'Siegzug'}];
RPL_MARKS.vg=(fr,m)=>{
  const marks=[];
  if(fr.length>4)marks.push({i:Math.floor(fr.length/2),icon:'🧩',label:'Mittelspiel'});
  marks.push({i:fr.length-1,icon:'🏁',label:m.winner===-1?'Unentschieden':'Vier in einer Reihe'});return marks;
};
RPL_MARKS.bs=(fr,m)=>{
  const marks=[];
  const comp=(g,start)=>{ // verbundene Trefferzellen ohne angrenzende unversehrte Schiffsteile
    const seen=new Set([start]),q=[start];let alive=false;
    while(q.length){const c=q.pop(),r=Math.floor(c/10),k=c%10;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dk])=>{const nr=r+dr,nk=k+dk;if(nr<0||nr>9||nk<0||nk>9)return;const n=nr*10+nk;if(g[n]===1)alive=true;if(g[n]===2&&!seen.has(n)){seen.add(n);q.push(n);}});}
    return !alive;
  };
  let sunk=0;
  for(let i=1;i<fr.length;i++)['g1','g2'].forEach(k=>{
    const a=fr[i-1][k],b=fr[i][k];
    for(let c=0;c<100;c++)if(b[c]===2&&a[c]!==2&&comp(b,c)){sunk++;marks.push({i,icon:'💥',label:'Schiff versenkt'});break;}
  });
  marks.push({i:fr.length-1,icon:'🏁',label:'Flotte vernichtet'});return marks;
};
RPL_MARKS.mem=(fr)=>{
  const marks=[];
  for(let i=1;i<fr.length;i++)if(fr[i].matched.length>fr[i-1].matched.length)marks.push({i,icon:'✨',label:'Paar gefunden'});
  marks.push({i:fr.length-1,icon:'🏁',label:'Alle Paare gefunden'});return marks;
};
RPL_MARKS.hm=(fr)=>{
  const marks=[];
  for(let i=1;i<fr.length;i++)if(fr[i].errors>fr[i-1].errors)marks.push({i,icon:'❌',label:'Fehler '+fr[i].errors+'/6'});
  marks.push({i:fr.length-1,icon:'🏁',label:'Wort aufgelöst'});return marks;
};
RPL_MARKS.mm=(fr,m)=>{
  const marks=[];let mau=false;
  for(let i=1;i<fr.length;i++){
    const dp=fr[i].p.length-fr[i-1].p.length,da=fr[i].a.length-fr[i-1].a.length;
    if(dp>=2||da>=2)marks.push({i,icon:'📥',label:'Karten ziehen (+'+Math.max(dp,da)+')'});
    if(!mau&&(fr[i].p.length===1||fr[i].a.length===1)){mau=true;marks.push({i,icon:'☝️',label:'Mau! – nur noch eine Karte'});}
  }
  marks.push({i:fr.length-1,icon:'🏁',label:'Letzte Karte gelegt'});return marks;
};
RPL_MARKS.kniffel=(fr)=>{
  const marks=[];
  fr.forEach((f,i)=>{
    if(!f.last)return;
    if(f.last.cat==='Kniffel'&&f.last.score===50)marks.push({i,icon:'🎉',label:'Kniffel!'});
    else if(f.last.score>=40)marks.push({i,icon:'⭐',label:`${f.last.cat} (${f.last.score})`});
    else if(f.last.score===0)marks.push({i,icon:'🕳️',label:`${f.last.cat}: Null`});
  });
  marks.push({i:fr.length-1,icon:'🏁',label:'Spielende'});return marks;
};
RPL_MARKS.mono=(fr)=>{
  const marks=[];let buys=0;
  for(let i=1;i<fr.length;i++){
    const a=fr[i-1],b=fr[i];
    if(b.out.length>a.out.length)marks.push({i,icon:'💀',label:'Bankrott'});
    else if(Object.keys(b.own).length>Object.keys(a.own).length&&buys<10){buys++;marks.push({i,icon:'🏠',label:'Straße gekauft'});}
    else if(b.mon.some((mo,k)=>a.mon[k]-mo>=400))marks.push({i,icon:'💸',label:'Hohe Zahlung'});
  }
  marks.push({i:fr.length-1,icon:'🏁',label:'Spielende'});return marks;
};

/* ── Wiedergabe in der App ── */
function rplFrameMs(n){return Math.max(220,Math.min(900,22000/Math.max(n,1)))/RPL_UI.speed;}
function rplCur(){return rplLoadList(RPL_UI.id).find(r=>r.rid===RPL_UI.rid)||null;}
function rplSeqFor(r,hl){
  const n=r.frames.length,all=[...Array(n).keys()];
  if(!hl)return all;
  const marks=(r.meta&&r.meta.marks)||[];if(!marks.length)return all;
  const s=new Set([0,n-1]);marks.forEach(m=>{s.add(Math.max(0,m.i-1));s.add(m.i);});
  return[...s].sort((a,b)=>a-b);
}
function rplEnsureOverlay(){
  let ov=document.getElementById('rpl-overlay');if(ov)return ov;
  ov=document.createElement('div');ov.id='rpl-overlay';
  ov.style.cssText='display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2200;align-items:center;justify-content:center;padding:12px';
  ov.innerHTML=`<div style="background:var(--window);border-radius:14px;padding:14px;max-width:680px;width:100%;max-height:96vh;overflow-y:auto">
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <select id="rpl-select" onchange="rplSelect(this.value)" style="flex:1;min-width:0;padding:6px;border-radius:8px;background:var(--bg);color:var(--text);border:0.5px solid var(--divider);font-size:12px"></select>
      <button class="timer-btn" id="rpl-fav" onclick="rplFav()" title="Favorit" style="padding:6px 10px;font-size:14px">☆</button>
      <button class="timer-btn" onclick="rplDel()" title="Löschen" style="padding:6px 10px;font-size:13px">🗑</button>
    </div>
    <canvas id="rpl-canvas" width="${RPL_W}" height="${RPL_H}" style="width:100%;height:auto;border-radius:10px;background:#1c2130;display:block"></canvas>
    <div id="rpl-marks" style="position:relative;height:16px;margin-top:6px"></div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <button class="timer-btn" onclick="rplToggle()" id="rpl-play" style="padding:6px 12px;font-size:12px">⏸</button>
      <button class="timer-btn" onclick="rplRestart()" style="padding:6px 12px;font-size:12px">⏮</button>
      <input type="range" id="rpl-range" min="0" max="1" value="0" oninput="rplSeek(this.value)" style="flex:1;min-width:120px"/>
      <select id="rpl-speed" onchange="rplSpeed(this.value)" style="padding:5px;border-radius:6px;background:var(--bg);color:var(--text);border:0.5px solid var(--divider)"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
    </div>
    <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-2);margin-top:8px"><input type="checkbox" id="rpl-hl" onchange="rplHighlights(this.checked)"/>⚡ Nur Highlights <span id="rpl-hl-count" style="color:var(--text-3)"></span></label>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
      <button class="btn-generate" id="rpl-dl" onclick="rplDownload()" style="width:auto;padding:8px 14px;font-size:13px">⬇ Video</button>
      <button class="timer-btn" onclick="rplShareImage(false)" style="padding:8px 12px;font-size:12px">🖼 Ergebnisbild</button>
      <button class="timer-btn" onclick="rplShareImage(true)" style="padding:8px 12px;font-size:12px">📋 Kopieren</button>
      <span id="rpl-status" style="font-size:11px;color:var(--text-3);flex:1;min-width:100px"></span>
      <button class="timer-btn" onclick="rplClose()" style="padding:8px 14px;font-size:12px">Schließen</button>
    </div></div>`;
  document.body.appendChild(ov);return ov;
}
function rplFmtEntry(e,k){
  const m=e.meta||{};return `${e.fav?'★ ':''}${k===0?'Letzte: ':''}${new Date(m.t||0).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${(m.names||[]).join(' vs ')} · ${m.result||''}`.slice(0,90);
}
function rplOpen(id,idx){
  const list=rplLoadList(id);
  if(!list.length){if(typeof showToast==='function')showToast('Noch kein Replay – spiel zuerst eine Partie zu Ende.');return;}
  if(typeof smCloseResult==='function')smCloseResult();
  const e=list[idx||0]||list[0];
  const ov=rplEnsureOverlay();ov.style.display='flex';
  clearInterval(RPL_UI.timer);
  RPL_UI={id,rid:e.rid,p:0,seq:rplSeqFor(e,false),hl:false,playing:true,speed:1,timer:null,rec:false};
  document.getElementById('rpl-speed').value='1';document.getElementById('rpl-hl').checked=false;
  rplFillSelect();rplPrepare();rplShowFrame();rplSchedule();
}
function rplFillSelect(){
  const list=rplLoadList(RPL_UI.id),sel=document.getElementById('rpl-select');
  sel.innerHTML=list.map((e,k)=>`<option value="${e.rid}" ${e.rid===RPL_UI.rid?'selected':''}>${rplFmtEntry(e,k).replace(/</g,'&lt;')}</option>`).join('');
}
function rplPrepare(){
  const r=rplCur();if(!r)return;
  RPL_UI.seq=rplSeqFor(r,RPL_UI.hl);RPL_UI.p=Math.min(RPL_UI.p,RPL_UI.seq.length-1);
  const rg=document.getElementById('rpl-range');rg.max=RPL_UI.seq.length-1;
  const marks=(r.meta&&r.meta.marks)||[];
  document.getElementById('rpl-hl-count').textContent=marks.length?`(${marks.length} Momente)`:'(keine erkannt)';
  document.getElementById('rpl-fav').textContent=r.fav?'★':'☆';
  document.getElementById('rpl-status').textContent=`${RPL_UI.seq.length} von ${r.frames.length} Schritten`;
  const n=RPL_UI.seq.length;
  document.getElementById('rpl-marks').innerHTML=marks.map(m=>{const pos=RPL_UI.seq.indexOf(m.i);if(pos<0)return'';return`<button title="${(m.icon+' '+m.label).replace(/"/g,'&quot;')}" onclick="rplSeek(${pos})" style="position:absolute;left:calc(${n>1?pos/(n-1)*100:0}% - 7px);top:0;width:14px;height:14px;padding:0;border:none;background:none;font-size:11px;cursor:pointer;line-height:14px">${m.icon}</button>`;}).join('');
}
function rplSelect(rid){RPL_UI.rid=rid;RPL_UI.p=0;RPL_UI.playing=true;rplPrepare();rplShowFrame();rplSchedule();}
function rplFav(){const f=rplToggleFav(RPL_UI.id,RPL_UI.rid);document.getElementById('rpl-fav').textContent=f?'★':'☆';rplFillSelect();if(typeof zcRenderReplays==='function'&&document.getElementById('zc-replays'))zcRenderReplays();}
function rplDel(){
  const id=RPL_UI.id,rid=RPL_UI.rid;
  appConfirm('Dieses Replay löschen?',()=>{
    rplDelete(id,rid);const l=rplLoadList(id);
    if(!l.length){rplClose();}else{RPL_UI.rid=l[0].rid;RPL_UI.p=0;RPL_UI.playing=true;rplFillSelect();rplPrepare();rplShowFrame();rplSchedule();}
    if(typeof zcRenderReplays==='function'&&document.getElementById('zc-replays'))zcRenderReplays();
  });
}
function rplHighlights(on){RPL_UI.hl=!!on;RPL_UI.p=0;RPL_UI.playing=true;rplPrepare();rplShowFrame();rplSchedule();}
function rplShowFrame(){
  const r=rplCur();if(!r)return;
  const cv=document.getElementById('rpl-canvas');rplDrawFrame(cv.getContext('2d'),RPL_UI.id,r,RPL_UI.seq[RPL_UI.p]);
  document.getElementById('rpl-range').value=RPL_UI.p;
  document.getElementById('rpl-play').textContent=RPL_UI.playing?'⏸':'▶';
}
function rplSchedule(){
  clearInterval(RPL_UI.timer);
  if(!rplCur()||!RPL_UI.playing)return;
  RPL_UI.timer=setInterval(()=>{
    if(RPL_UI.p>=RPL_UI.seq.length-1){RPL_UI.playing=false;clearInterval(RPL_UI.timer);rplShowFrame();return;}
    RPL_UI.p++;rplShowFrame();
  },rplFrameMs(RPL_UI.seq.length));
}
function rplToggle(){
  if(!RPL_UI.playing&&RPL_UI.p>=RPL_UI.seq.length-1)RPL_UI.p=0;
  RPL_UI.playing=!RPL_UI.playing;rplShowFrame();rplSchedule();
}
function rplRestart(){RPL_UI.p=0;RPL_UI.playing=true;rplShowFrame();rplSchedule();}
function rplSeek(v){RPL_UI.p=+v;RPL_UI.playing=false;clearInterval(RPL_UI.timer);rplShowFrame();}
function rplSpeed(v){RPL_UI.speed=+v;rplSchedule();}
function rplClose(){clearInterval(RPL_UI.timer);RPL_UI.playing=false;const ov=document.getElementById('rpl-overlay');if(ov)ov.style.display='none';}

/* ── Video-Aufnahme ── */
function rplPickMime(){
  if(typeof MediaRecorder==='undefined')return null;
  return['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>{try{return MediaRecorder.isTypeSupported(t);}catch(e){return false;}})||null;
}
function rplRecordEntry(id,entry,hl,onProgress){
  return new Promise((resolve,reject)=>{
    const mime=rplPickMime();if(!mime)return reject(new Error('Dieser Browser unterstützt keine Videoaufnahme'));
    const cv=document.createElement('canvas');cv.width=RPL_W;cv.height=RPL_H;
    const ctx=cv.getContext('2d');
    const stream=cv.captureStream(30),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2500000}),chunks=[];
    rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
    rec.onerror=e=>reject(e.error||new Error('Aufnahmefehler'));
    rec.onstop=()=>resolve({blob:new Blob(chunks,{type:mime.split(';')[0]}),ext:mime.startsWith('video/mp4')?'mp4':'webm',mime});
    const seq=rplSeqFor(entry,hl),n=seq.length,ms=Math.max(220,Math.min(900,22000/n));
    let p=0;rplDrawFrame(ctx,id,entry,seq[0]);rec.start(200);
    const redraw=setInterval(()=>rplDrawFrame(ctx,id,entry,seq[Math.min(p,n-1)]),100);
    const step=()=>{
      if(onProgress)onProgress(Math.min(p,n-1)+1,n);
      if(p>=n-1){setTimeout(()=>{clearInterval(redraw);rec.stop();stream.getTracks().forEach(t=>t.stop());},1400);return;}
      p++;setTimeout(step,ms);
    };
    setTimeout(step,ms);
  });
}
function rplRecord(id,onProgress){const e=rplGet(id);return e?rplRecordEntry(id,e,false,onProgress):Promise.reject(new Error('Kein Replay'));}
async function rplDownload(){
  if(RPL_UI.rec)return;
  const e=rplCur();if(!e)return;
  const id=RPL_UI.id,btn=document.getElementById('rpl-dl'),st=document.getElementById('rpl-status');
  RPL_UI.rec=true;btn.disabled=true;
  try{
    const {blob,ext}=await rplRecordEntry(id,e,RPL_UI.hl,(k,n)=>{st.textContent=`Video wird aufgenommen … ${k}/${n}`;});
    rplSaveBlob(blob,`replay-${id}${RPL_UI.hl?'-highlights':''}-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.${ext}`);
    st.textContent=ext==='mp4'?'✓ Als MP4 gespeichert':'✓ Gespeichert als WebM – dieser Browser kann kein MP4 direkt aufnehmen (öffnet in Chrome, Edge, VLC).';
  }catch(err){st.textContent='Video konnte nicht erstellt werden: '+(err.message||err);}
  RPL_UI.rec=false;btn.disabled=false;
}
function rplSaveBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}

/* ── Ergebnisbild (PNG) zum Teilen ── */
function rplBuildShareCanvas(id,e){
  const W=720,H=860,cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1c2130');g.addColorStop(1,'#2b1f4a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const m=e.meta||{};
  rplT(ctx,'🎬 '+(RPL_TITLES[id]||id),W/2,48,34,'#ffffff','center',true);
  rplT(ctx,m.result||'',W/2,96,26,'#ffd54f','center',true);
  const names=m.names||[],cols=m.colors||[],av=m.avatars||[];
  const n=Math.min(names.length,4),stepW=(W-80)/Math.max(n,1);
  names.slice(0,n).forEach((nm,i)=>{const cx=40+stepW*i+stepW/2;
    ctx.beginPath();ctx.arc(cx,150,22,0,7);ctx.fillStyle=cols[i]||'#7c9cff';ctx.fill();
    rplT(ctx,av[i]||'🎲',cx,151,22,'#fff','center');
    rplT(ctx,String(nm).slice(0,14),cx,196,18,'#e6ebf7','center',true);});
  const inner=document.createElement('canvas');inner.width=RPL_W;inner.height=RPL_H;
  rplDrawFrame(inner.getContext('2d'),id,e,e.frames.length-1);
  ctx.save();rplRR(ctx,40,224,640,480,16);ctx.clip();ctx.drawImage(inner,40,224);ctx.restore();
  if(m.prLine)rplT(ctx,m.prLine,W/2,742,20,'#9be7a4','center',true);
  const marks=(m.marks||[]).filter(k=>k.icon!=='🏁').slice(0,4);
  if(marks.length)rplT(ctx,marks.map(k=>k.icon+' '+k.label).join('   ').slice(0,70),W/2,782,15,'#c9d1e6','center');
  rplT(ctx,new Date(m.t||Date.now()).toLocaleString('de-DE')+' · AppHub',W/2,H-34,15,'#8a94ad','center');
  return cv;
}
async function rplShareImage(copy){
  const e=rplCur();if(!e)return;const st=document.getElementById('rpl-status');
  const cv=rplBuildShareCanvas(RPL_UI.id,e);
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  if(!blob){st.textContent='Bild konnte nicht erstellt werden';return;}
  if(copy){
    try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);st.textContent='✓ Bild in die Zwischenablage kopiert';return;}
    catch(err){st.textContent='Kopieren nicht möglich – Bild wird gespeichert';}
  }
  rplSaveBlob(blob,`ergebnis-${RPL_UI.id}-${Date.now()}.png`);
  if(!copy)st.textContent='✓ Ergebnisbild gespeichert';
}
document.addEventListener('DOMContentLoaded',()=>rplRefreshButtons());
