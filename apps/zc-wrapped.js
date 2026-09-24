/* ══════════════════════════════════
   RÜCKBLICK – "Wrapped"-artiges Teilen-Bild (Jahr/Monat) aus dem Partien-Verlauf (zc.hist).
   Nutzt dieselben Canvas-Helfer wie die Replay-Ergebnisbilder (rplT/rplRR/rplSaveBlob aus replay.js).
══════════════════════════════════ */
function zcWrappedData(name,period){ // period: {y, m?} – m weggelassen = ganzes Jahr
  const k=zcKey(name),h=(zcp().hist[k]||[]).filter(e=>{
    const d=new Date(e.t);
    return d.getFullYear()===period.y&&(period.m==null||d.getMonth()===period.m);
  }).sort((a,b)=>a.t-b.t);
  const games=h.length,wins=h.filter(e=>e.r==='W').length,draws=h.filter(e=>e.r==='D').length,losses=h.filter(e=>e.r==='L').length;
  let streak=0,best=0;h.forEach(e=>{streak=e.r==='W'?streak+1:0;best=Math.max(best,streak);});
  const byGame={};h.forEach(e=>{byGame[e.g]=(byGame[e.g]||0)+1;});
  const favId=Object.keys(byGame).sort((a,b)=>byGame[b]-byGame[a])[0];
  const fav=favId?ZC_GAMES.find(g=>g.id===favId):null;
  const withPr=h.filter(e=>e.pr!=null);
  const prStart=withPr.length?withPr[0].pr:null,prEnd=withPr.length?withPr[withPr.length-1].pr:null;
  return{games,wins,draws,losses,winRate:games?Math.round(wins/games*100):0,bestStreak:best,fav,favCount:favId?byGame[favId]:0,prStart,prEnd,period};
}
function zcWrappedLabel(period){return period.m==null?'Jahr '+period.y:ZC_MONTHS[period.m]+' '+period.y;}
function zcWrappedTile(ctx,x,y,w,h,icon,val,lbl){
  ctx.save();rplRR(ctx,x,y,w,h,16);ctx.fillStyle='rgba(255,255,255,0.11)';ctx.fill();ctx.restore();
  rplT(ctx,icon,x+w/2,y+32,24,'#fff','center');
  rplT(ctx,String(val),x+w/2,y+62,26,'#ffffff','center',true);
  rplT(ctx,lbl,x+w/2,y+h-14,11,'#d8c3f0','center');
}
function zcWrappedCanvas(name,d){
  const W=720,H=960,cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#170a2b');g.addColorStop(0.55,'#3a1361');g.addColorStop(1,'#7c1f5e');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<26;i++){const rx=Math.random()*W,ry=Math.random()*H*0.7,rr=1+Math.random()*2;ctx.beginPath();ctx.arc(rx,ry,rr,0,7);ctx.fillStyle='rgba(255,255,255,'+(0.15+Math.random()*0.25).toFixed(2)+')';ctx.fill();}
  rplT(ctx,'✨ MEIN APPHUB-RÜCKBLICK',W/2,58,22,'#e0c3fc','center',true);
  rplT(ctx,zcWrappedLabel(d.period),W/2,90,16,'#c9a8ec','center');
  const av=(typeof zcProfileOf==='function'&&zcProfileOf(name))?zcProfileOf(name).avatar:'🙂';
  ctx.beginPath();ctx.arc(W/2,168,42,0,7);ctx.fillStyle='rgba(255,255,255,0.16)';ctx.fill();
  rplT(ctx,av,W/2,170,42,'#fff','center');
  rplT(ctx,name,W/2,232,32,'#ffd54f','center',true);
  rplT(ctx,d.games?`${d.games} Partien gespielt`:'Keine Partien in diesem Zeitraum',W/2,268,18,'#f2e6ff','center');
  const tw=(W-40*2-16)/2;
  zcWrappedTile(ctx,40,310,tw,110,'🏆',d.wins,'Siege');
  zcWrappedTile(ctx,40+tw+16,310,tw,110,'📊',d.winRate+'%','Siegquote');
  zcWrappedTile(ctx,40,436,tw,110,'🔥',d.bestStreak,'Beste Serie');
  zcWrappedTile(ctx,40+tw+16,436,tw,110,'💥',d.losses,'Niederlagen');
  ctx.save();rplRR(ctx,40,562,W-80,120,16);ctx.fillStyle='rgba(255,255,255,0.11)';ctx.fill();ctx.restore();
  if(d.fav){
    rplT(ctx,d.fav.icon,W/2,600,34,'#fff','center');
    rplT(ctx,d.fav.title,W/2,636,20,'#ffffff','center',true);
    rplT(ctx,`Lieblingsspiel · ${d.favCount}× gespielt`,W/2,662,13,'#d8c3f0','center');
  }else{
    rplT(ctx,'Noch kein Lieblingsspiel',W/2,622,18,'#e6d6f7','center');
  }
  if(d.prStart!=null&&d.prEnd!=null){
    const delta=d.prEnd-d.prStart;
    rplT(ctx,`📈 Gesamtrang: ${d.prStart} → ${d.prEnd} PR (${delta>=0?'+':''}${delta})`,W/2,716,17,'#9be7a4','center',true);
  }
  rplT(ctx,new Date().toLocaleDateString('de-DE')+' · AppHub',W/2,H-30,14,'#c9a8ec','center');
  return cv;
}
async function zcWrappedShare(name,period,copy){
  const d=zcWrappedData(name,period),cv=zcWrappedCanvas(name,d);
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  if(!blob){showToast('Bild konnte nicht erstellt werden');return;}
  if(copy){
    try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);showToast('✓ Rückblick in die Zwischenablage kopiert',2500);return;}
    catch(err){/* Kopieren nicht möglich – als Datei speichern */}
  }
  const tag=period.m==null?'jahr-'+period.y:'monat-'+(period.m+1)+'-'+period.y;
  rplSaveBlob(blob,`apphub-rueckblick-${tag}.png`);
  showToast('✓ Rückblick gespeichert',2200);
}
function zcWrappedOpen(kind,forName){
  const name=(forName||zcp().player||'').trim();
  if(!name){showToast('Wähle zuerst einen Spieler');return;}
  const now=new Date();
  const period=kind==='month'?{y:now.getFullYear(),m:now.getMonth()}:{y:now.getFullYear()};
  const d=zcWrappedData(name,period);
  if(!d.games){showToast(`Noch keine Partien im ${kind==='month'?'aktuellen Monat':'aktuellen Jahr'} aufgezeichnet.`,3200);return;}
  zcWrappedShare(name,period,false);
}
