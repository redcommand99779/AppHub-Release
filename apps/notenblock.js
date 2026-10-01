/* ══════════════════════════════════
   NOTENBLOCK-STUDIO – richtig komponieren, im Stil von Minecraft Note Block Studio. Ein Stück besteht aus bis zu 12 Ebenen, jede mit eigenem
   Instrument (16 Klänge: Klavier, Bass, Basstrommel, Snare, Klicks, Gitarre, Flöte, Glocke, Chime, Xylophon, Eisenxylophon, Kuhglocke, Didgeridoo,
   Bit, Banjo, Pling), Lautstärke, Stumm und Solo. Im Notenraster (Zeit nach rechts, 25 Tonhöhen von Fis3 bis Fis5 nach oben) setzt du Töne mit
   einem Klick; Töne lassen sich in der Länge ziehen (rechter Rand), verschieben, einzeln oder mit einem Auswahlrahmen markieren, ausschneiden, kopieren,
   einfügen und löschen. Rückgängig/Wiederholen (Strg+Z / Strg+Y), Links-Rechts-Verteilung (Panning) je Ebene. Tempo in Ticks pro Sekunde, Länge bis 512 Ticks, Wiedergabe mit Cursor und Wiederholung, Songs je Konto,
   Export als MP3 oder WAV. Die Logik (Töne, Ereignisse je Tick mit Stumm/Solo, Lieder prüfen) ist von der Tonerzeugung getrennt und wird
   in tests/check.js geprüft. Songs je Konto: zf_notenblock. Wird vom Musikstudio (apps/studio.js) als Tab „Komponieren“ benutzt.
══════════════════════════════════ */
const NB_KEY='zf_notenblock';
const NB_MINKEY=54,NB_KEYS=25,NB_MAXLEN=512,NB_MAXLAYERS=12,NB_MAXNOTES=2000,NB_LENS=[1,2,3,4,6,8,12,16],NB_MAXSONGS=30,NB_CW=20,NB_CH=16,NB_RULER=22;
const NB_COLORS=['#42a5f5','#ef5350','#66bb6a','#ffa726','#ab47bc','#26c6da','#ec407a','#d4e157','#8d6e63','#7e57c2','#26a69a','#ffca28'];
const NB_INST={
  harp:{n:'Klavier',kind:'tone',wave:'triangle',a:0.004,d:0.55,s:0.12,r:0.3,cut:5200,oct:0,vol:0.5,p2:2,g2:0.3},
  bass:{n:'Bass',kind:'tone',wave:'square',a:0.005,d:0.25,s:0.5,r:0.1,cut:650,oct:-2,vol:0.4},
  kick:{n:'Basstrommel',kind:'kick'},
  snare:{n:'Snare',kind:'snare'},
  hat:{n:'Klicks',kind:'hat'},
  guitar:{n:'Gitarre',kind:'tone',wave:'sawtooth',a:0.003,d:0.6,s:0.05,r:0.2,cut:2300,oct:-1,vol:0.28},
  flute:{n:'Flöte',kind:'tone',wave:'sine',a:0.07,d:0.1,s:0.8,r:0.22,cut:7000,oct:1,vol:0.5,vib:1},
  bell:{n:'Glocke',kind:'tone',wave:'sine',a:0.002,d:1.3,s:0,r:0.4,cut:9000,oct:2,vol:0.38,p2:2.76,g2:0.45},
  chime:{n:'Chime',kind:'tone',wave:'sine',a:0.002,d:1.0,s:0,r:0.4,cut:9000,oct:2,vol:0.3,p2:4.1,g2:0.5},
  xylo:{n:'Xylophon',kind:'tone',wave:'sine',a:0.002,d:0.22,s:0,r:0.08,cut:9000,oct:2,vol:0.55,p2:3,g2:0.35},
  iron:{n:'Eisenxylophon',kind:'tone',wave:'triangle',a:0.002,d:0.5,s:0,r:0.2,cut:7000,oct:0,vol:0.5,p2:3.2,g2:0.3},
  cow:{n:'Kuhglocke',kind:'tone',wave:'square',a:0.002,d:0.22,s:0.04,r:0.1,cut:3200,oct:1,vol:0.2,p2:1.5,g2:0.6},
  didge:{n:'Didgeridoo',kind:'tone',wave:'sawtooth',a:0.05,d:0.1,s:0.85,r:0.18,cut:380,oct:-2,vol:0.45,vib:1},
  bit:{n:'Bit',kind:'tone',wave:'square',a:0.003,d:0.08,s:0.7,r:0.06,cut:6500,oct:0,vol:0.17},
  banjo:{n:'Banjo',kind:'tone',wave:'sawtooth',a:0.002,d:0.2,s:0.02,r:0.1,cut:3400,oct:0,vol:0.3,p2:2,g2:0.25},
  pling:{n:'Pling',kind:'tone',wave:'sine',a:0.002,d:0.45,s:0.2,r:0.25,cut:9000,oct:0,vol:0.5,p2:2,g2:0.6}
};
const NB_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','H'];

/* ── Musik-Logik (rein) ── */
function nbMidi(key,inst){const I=NB_INST[inst]||NB_INST.harp;return NB_MINKEY+key+12*(I.oct||0);}
function nbKeyName(key){const m=NB_MINKEY+key;return NB_NAMES[m%12]+(Math.floor(m/12)-1);}
function nbIsBlack(key){return [1,3,6,8,10].includes((NB_MINKEY+key)%12);}
function nbLayer(i,inst){return {name:'Ebene '+(i+1),inst:inst||'harp',vol:100,pan:0,mute:false,solo:false,notes:[]};}
/* Töne [Tick,Taste,Länge in Ticks]; Länge fehlt = 1. Überlappende Töne auf gleicher Taste, Ungültiges und Doppeltes werden verworfen */
function nbFillNotes(L,src,len){
  L.notes=[];
  (Array.isArray(src)?src:[]).forEach(n=>{
    if(!Array.isArray(n))return;const t=n[0]|0,k=n[1]|0;
    if(t<0||t>=len||k<0||k>=NB_KEYS||n[0]!==t||n[1]!==k||L.notes.length>=NB_MAXNOTES)return;
    let d=n[2]===undefined?1:Math.round(+n[2]);if(!(d>=1))d=1;d=Math.min(d,len-t);
    L.notes.push([t,k,d]);
  });
  L.notes.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const out=[],end={};
  L.notes.forEach(n=>{if(end[n[1]]!==undefined&&n[0]<end[n[1]])return;end[n[1]]=n[0]+n[2];out.push(n);});
  L.notes=out;
}
function nbBlank(){return {v:1,name:'Neues Stück',tps:8,len:64,layers:[nbLayer(0,'harp'),nbLayer(1,'bass')]};}
function nbSanitize(o){
  const s=nbBlank();if(!o||typeof o!=='object')return s;
  s.name=String(o.name||'Neues Stück').slice(0,40);
  s.tps=Math.max(1,Math.min(20,Math.round((+o.tps||8)*2)/2));
  s.len=Math.max(16,Math.min(NB_MAXLEN,Math.ceil((+o.len||64)/4)*4));
  const ls=Array.isArray(o.layers)?o.layers.slice(0,NB_MAXLAYERS):[];
  if(ls.length){
    s.layers=ls.map((l,i)=>{
      const L=nbLayer(i,l&&NB_INST[l.inst]?l.inst:'harp');
      if(l&&typeof l==='object'){
        L.name=String(l.name||'Ebene '+(i+1)).slice(0,20);L.vol=(l.vol===undefined||l.vol===null||isNaN(+l.vol))?100:Math.max(0,Math.min(100,Math.round(+l.vol)));
        L.pan=(l.pan===undefined||l.pan===null||isNaN(+l.pan))?0:Math.max(-100,Math.min(100,Math.round(+l.pan)));L.mute=!!l.mute;L.solo=!!l.solo;
        nbFillNotes(L,l.notes,s.len);
      }
      return L;
    });
  }
  return s;
}
/* Was erklingt in diesem Tick? Töne beginnen in ihrem ersten Tick (dur = Länge in Sekunden). Stumm und Solo werden beachtet (ist irgendeine Ebene Solo, spielen nur die Solo-Ebenen) */
function nbEventsAt(song,tick){
  const solo=song.layers.some(l=>l.solo),ev=[];
  song.layers.forEach((l,li)=>{
    if(solo?!l.solo:l.mute)return;
    for(const n of l.notes)if(n[0]===tick)ev.push({layer:li,inst:l.inst,key:n[1],midi:nbMidi(n[1],l.inst),vol:l.vol/100,pan:(l.pan||0)/100,len:n[2],dur:n[2]/song.tps});
  });
  return ev;
}
function nbCount(song){return song.layers.reduce((n,l)=>n+l.notes.length,0);}
function nbSeconds(song){return song.len/song.tps;}
/* Welcher Ton der Ebene liegt in diesem Tick auf dieser Taste (auch mitten in einem langen Ton)? Gibt den Ton oder null zurück */
function nbNoteAt(song,layer,tick,key){const L=song.layers[layer];if(!L)return null;return L.notes.find(n=>n[1]===key&&tick>=n[0]&&tick<n[0]+n[2])||null;}
/* Platz nach rechts bis zum nächsten Ton gleicher Taste (oder Stückende) */
function nbRoom(song,L,key,tick,skip){let end=song.len;for(const n of L.notes)if(n!==skip&&n[1]===key&&n[0]>tick&&n[0]<end)end=n[0];return end-tick;}
function nbAddNote(song,layer,tick,key,len){
  const L=song.layers[layer];if(!L||tick<0||tick>=song.len||key<0||key>=NB_KEYS||L.notes.length>=NB_MAXNOTES||nbNoteAt(song,layer,tick,key))return null;
  const d=Math.max(1,Math.min(Math.round(len)||1,nbRoom(song,L,key,tick)));
  const n=[tick,key,d];L.notes.push(n);L.notes.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);return n;
}
function nbRemoveNote(song,layer,note){const L=song.layers[layer];if(!L)return false;const i=L.notes.indexOf(note);if(i<0)return false;L.notes.splice(i,1);return true;}
/* Länge ändern: mindestens 1, höchstens bis zum nächsten Ton gleicher Taste oder Stückende */
function nbResizeNote(song,layer,note,len){const L=song.layers[layer];if(!L||L.notes.indexOf(note)<0)return false;note[2]=Math.max(1,Math.min(Math.round(len)||1,nbRoom(song,L,note[1],note[0],note)));return true;}
/* Ton verschieben (Tick und Taste); klappt nur, wenn er im Raster bleibt und keinen Ton gleicher Taste überlappt */
function nbMoveNote(song,layer,note,tick,key){
  const L=song.layers[layer];if(!L||L.notes.indexOf(note)<0||tick<0||key<0||key>=NB_KEYS||tick+note[2]>song.len)return false;
  for(const n of L.notes)if(n!==note&&n[1]===key&&tick<n[0]+n[2]&&n[0]<tick+note[2])return false;
  note[0]=tick;note[1]=key;L.notes.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);return true;
}
/* ── Mehrere Töne: Auswahl, Verschieben, Länge, Löschen, Kopieren/Einfügen ── */
/* Töne der Ebene, die das Rechteck [t0..t1] × [k0..k1] berühren (Ticks und Tasten, Grenzen eingeschlossen) */
function nbSelectRect(song,layer,t0,t1,k0,k1){
  const L=song.layers[layer];if(!L)return [];
  const a=Math.min(t0,t1),b=Math.max(t0,t1),c=Math.min(k0,k1),d=Math.max(k0,k1);
  return L.notes.filter(n=>n[1]>=c&&n[1]<=d&&n[0]+n[2]-1>=a&&n[0]<=b);
}
/* Alle gewählten Töne um dt Ticks und dk Tasten verschieben – ganz oder gar nicht (Raster- und Überlappungsprüfung gegen die nicht gewählten) */
function nbMoveNotes(song,layer,notes,dt,dk){
  const L=song.layers[layer];if(!L||!notes.length||(!dt&&!dk))return false;
  if(!notes.every(n=>L.notes.indexOf(n)>=0))return false;
  const set=new Set(notes);
  for(const n of notes){const t=n[0]+dt,k=n[1]+dk;if(t<0||t+n[2]>song.len||k<0||k>=NB_KEYS)return false;
    for(const o of L.notes)if(!set.has(o)&&o[1]===k&&t<o[0]+o[2]&&o[0]<t+n[2])return false;}
  notes.forEach(n=>{n[0]+=dt;n[1]+=dk;});L.notes.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);return true;
}
/* Länge aller gewählten Töne um delta ändern (jeder mindestens 1, höchstens bis zum nächsten Ton gleicher Taste oder Stückende) */
function nbResizeNotes(song,layer,notes,delta){
  const L=song.layers[layer];if(!L)return false;let any=false;
  notes.forEach(n=>{if(L.notes.indexOf(n)<0)return;const old=n[2];nbResizeNote(song,layer,n,old+delta);if(n[2]!==old)any=true;});return any;
}
function nbSetLenNotes(song,layer,notes,len){const L=song.layers[layer];if(!L)return false;let any=false;notes.forEach(n=>{if(L.notes.indexOf(n)<0)return;const old=n[2];nbResizeNote(song,layer,n,len);if(n[2]!==old)any=true;});return any;}
function nbRemoveNotes(song,layer,notes){const L=song.layers[layer];if(!L)return 0;const set=new Set(notes),before=L.notes.length;L.notes=L.notes.filter(n=>!set.has(n));return before-L.notes.length;}
/* Zwischenablage: Töne relativ zum ersten Tick (Tasten bleiben) */
function nbCopyNotes(notes){if(!notes.length)return null;const t0=Math.min(...notes.map(n=>n[0]));return {notes:notes.map(n=>[n[0]-t0,n[1],n[2]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),span:Math.max(...notes.map(n=>n[0]+n[2]))-t0};}
/* Einfügen ab einem Tick (dk verschiebt die Tonhöhe); Töne, die nicht passen (Raster, Überlappung), bleiben weg. Gibt die neuen Töne zurück */
function nbPasteNotes(song,layer,clip,tick,dk){
  const L=song.layers[layer];if(!L||!clip)return [];const out=[];dk=dk||0;
  clip.notes.forEach(([dt,k,len])=>{
    const t=tick+dt,key=k+dk;if(t<0||t>=song.len||key<0||key>=NB_KEYS||L.notes.length>=NB_MAXNOTES)return;
    const d=Math.min(len,song.len-t);
    for(const o of L.notes)if(o[1]===key&&t<o[0]+o[2]&&o[0]<t+d)return;
    const n=[t,key,d];L.notes.push(n);out.push(n);
  });
  L.notes.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);return out;
}
/* Rückgängig/Wiederholen: Verlauf aus Momentaufnahmen (JSON); h = {undo:[],redo:[]} */
function nbSnap(song){return JSON.stringify(song);}
function nbHistNew(){return {undo:[],redo:[]};}
function nbHistPush(h,song){const sn=nbSnap(song);if(h.undo.length&&h.undo[h.undo.length-1]===sn)return false;h.undo.push(sn);if(h.undo.length>100)h.undo.shift();h.redo=[];return true;}
function nbHistUndo(h,song){if(!h.undo.length)return null;h.redo.push(nbSnap(song));return nbSanitize(JSON.parse(h.undo.pop()));}
function nbHistRedo(h,song){if(!h.redo.length)return null;h.undo.push(nbSnap(song));return nbSanitize(JSON.parse(h.redo.pop()));}
/* Umschalten (für Tests und einfache Aufrufe): liegt ein Ton auf der Zelle, wird er gelöscht, sonst einer gesetzt; val erzwingt den Zustand */
function nbToggleNote(song,layer,tick,key,val){
  const L=song.layers[layer];if(!L||tick<0||tick>=song.len||key<0||key>=NB_KEYS)return false;
  const n=nbNoteAt(song,layer,tick,key),want=val===undefined?!n:!!val;
  if(want&&!n)return !!nbAddNote(song,layer,tick,key,1);
  if(!want&&n)nbRemoveNote(song,layer,n);
  return want;
}
function nbDouble(song){   // Stück einmal wiederholen (höchstens bis 512 Ticks)
  const add=Math.min(song.len,NB_MAXLEN-song.len);if(add<=0)return false;
  const old=song.len;song.len+=add;
  song.layers.forEach(l=>{const copy=l.notes.filter(n=>n[0]<add).map(n=>[n[0]+old,n[1],Math.min(n[2],song.len-(n[0]+old))]);l.notes=l.notes.concat(copy);});
  return true;
}
function nbSetLen(song,len){
  len=Math.max(16,Math.min(NB_MAXLEN,Math.ceil(len/4)*4));song.len=len;
  song.layers.forEach(l=>{l.notes=l.notes.filter(n=>n[0]<len);l.notes.forEach(n=>{n[2]=Math.min(n[2],len-n[0]);});});
}
function nbShift(song,layer,semi){const L=song.layers[layer];if(!L)return false;if(L.notes.some(n=>n[1]+semi<0||n[1]+semi>=NB_KEYS))return false;L.notes.forEach(n=>n[1]+=semi);return true;}
/* Beispiel-Stücke (Ode an die Freude, Alle meine Entchen) */
function nbFromMelody(name,tps,steps,bass){
  const s=nbBlank();s.name=name;s.tps=tps;let t=0;
  steps.forEach(([semi,d])=>{if(semi!==null)s.layers[0].notes.push([t,semi+6,d]);t+=d;});   // semi: Halbtöne ab C4 (C4 = Taste 6)
  (bass||[]).forEach(([semi,tk])=>s.layers[1].notes.push([tk,semi+6+12,8]));
  s.len=Math.min(NB_MAXLEN,Math.ceil(t/4)*4);
  return nbSanitize(s);
}
const NB_DEMOS=[
  {name:'Ode an die Freude',make:()=>{const E=4,F=5,G=7,D=2,C=0,q=4,h=8;const m=[];
    [[E,q],[E,q],[F,q],[G,q],[G,q],[F,q],[E,q],[D,q],[C,q],[C,q],[D,q],[E,q],[E,6],[D,2],[D,h],
     [E,q],[E,q],[F,q],[G,q],[G,q],[F,q],[E,q],[D,q],[C,q],[C,q],[D,q],[E,q],[D,6],[C,2],[C,h]].forEach(x=>m.push(x));
    return nbFromMelody('Ode an die Freude',8,m,[[-12,0],[-17,8],[-12,16],[-17,24],[-12,32],[-17,40],[-12,48],[-17,56],[-12,64],[-17,72],[-12,80],[-17,88],[-12,96],[-17,104],[-12,112],[-17,120]]);}},
  {name:'Alle meine Entchen',make:()=>{const C=0,D=2,E=4,F=5,G=7,A=9,q=4,h=8,w=16;
    const m=[[C,q],[D,q],[E,q],[F,q],[G,h],[G,h],[A,q],[A,q],[A,q],[A,q],[G,w],[A,q],[A,q],[A,q],[A,q],[G,w],[F,q],[F,q],[F,q],[F,q],[E,h],[E,h],[D,q],[D,q],[D,q],[D,q],[C,w]];
    return nbFromMelody('Alle meine Entchen',8,m,[[-12,0],[-12,16],[-5,32],[-12,48],[-5,64],[-12,80],[-5,96],[-12,112]]);}}
];
/* ── Songs je Konto ── */
function nbAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function nbAll(){try{const o=JSON.parse(localStorage.getItem(NB_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function nbSongs(){const a=nbAll()[nbAccount().toLowerCase()||'_gast'];const out={};if(a&&a.songs&&typeof a.songs==='object')Object.keys(a.songs).slice(0,NB_MAXSONGS).forEach(k=>{out[k.slice(0,40)]=nbSanitize(a.songs[k]);});return out;}
function nbSaveSong(name,song){
  name=String(name||'').trim().slice(0,40);if(!name)return false;
  const all=nbAll(),key=nbAccount().toLowerCase()||'_gast',songs=nbSongs();
  if(!(name in songs)&&Object.keys(songs).length>=NB_MAXSONGS)return false;
  const s=nbSanitize(song);s.name=name;songs[name]=s;all[key]={songs};
  try{localStorage.setItem(NB_KEY,JSON.stringify(all));}catch(e){return false;}return true;
}
function nbDeleteSong(name){const all=nbAll(),key=nbAccount().toLowerCase()||'_gast',songs=nbSongs();if(!(name in songs))return false;delete songs[name];all[key]={songs};try{localStorage.setItem(NB_KEY,JSON.stringify(all));}catch(e){return false;}return true;}

/* ── Töne erzeugen (Web Audio, auch für OfflineAudioContext) ── */
function nbNoiseBuf(ctx,dur){const n=Math.max(1,Math.floor(ctx.sampleRate*dur)),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;}
function nbPlay(ctx,dest,when,instId,key,vol,dur){
  const I=NB_INST[instId]||NB_INST.harp,v=Math.max(0,vol);
  if(v<=0)return;
  if(I.kind==='kick'){
    const o=ctx.createOscillator(),g=ctx.createGain(),f=90*Math.pow(2,(key-12)/24);
    o.type='sine';o.frequency.setValueAtTime(f*1.8,when);o.frequency.exponentialRampToValueAtTime(Math.max(30,f*0.45),when+0.25);
    g.gain.setValueAtTime(0.9*v,when);g.gain.exponentialRampToValueAtTime(0.0002,when+0.3);o.connect(g);g.connect(dest);o.start(when);o.stop(when+0.32);return;
  }
  if(I.kind==='snare'||I.kind==='hat'){
    const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain(),sn=I.kind==='snare',len=sn?0.2:0.06;
    s.buffer=nbNoiseBuf(ctx,len);fl.type='highpass';fl.frequency.value=(sn?1200:6500)*Math.pow(2,(key-12)/36);
    g.gain.setValueAtTime((sn?0.6:0.3)*v,when);g.gain.exponentialRampToValueAtTime(0.0002,when+len);s.connect(fl);fl.connect(g);g.connect(dest);s.start(when);
    if(sn){const o=ctx.createOscillator(),og=ctx.createGain();o.type='triangle';o.frequency.value=190*Math.pow(2,(key-12)/36);og.gain.setValueAtTime(0.35*v,when);og.gain.exponentialRampToValueAtTime(0.0002,when+0.1);o.connect(og);og.connect(dest);o.start(when);o.stop(when+0.12);}
    return;
  }
  const midi=nbMidi(key,instId),f=440*Math.pow(2,(midi-69)/12),hold=Math.max(dur||0.25,I.a+I.d);
  const o=ctx.createOscillator(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
  o.type=I.wave;o.frequency.value=f;fl.type='lowpass';fl.frequency.value=Math.min(I.cut,f*10);
  const peak=I.vol*v;
  g.gain.setValueAtTime(0.0001,when);g.gain.linearRampToValueAtTime(peak,when+I.a);g.gain.linearRampToValueAtTime(Math.max(0.0002,peak*I.s),when+I.a+I.d);
  g.gain.setValueAtTime(Math.max(0.0002,peak*I.s),when+hold);g.gain.linearRampToValueAtTime(0.0001,when+hold+I.r);
  o.connect(fl);fl.connect(g);g.connect(dest);
  if(I.vib){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=5.5;lg.gain.value=f*0.006;l.connect(lg);lg.connect(o.frequency);l.start(when);l.stop(when+hold+I.r+0.05);}
  o.start(when);o.stop(when+hold+I.r+0.05);
  if(I.p2){const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.value=f*I.p2;g2.gain.setValueAtTime(peak*I.g2,when);g2.gain.exponentialRampToValueAtTime(0.0002,when+Math.min(1.2,I.d+0.3));o2.connect(g2);g2.connect(dest);o2.start(when);o2.stop(when+Math.min(1.4,I.d+0.4));}
}
function nbPlayEvent(ctx,dest,when,ev,song){
  let d=dest;
  if(ev.pan&&ctx.createStereoPanner){const pn=ctx.createStereoPanner();pn.pan.value=Math.max(-1,Math.min(1,ev.pan));pn.connect(dest);d=pn;}
  nbPlay(ctx,d,when,ev.inst,ev.key,ev.vol,Math.max(0.08,ev.dur*0.97));
}
/* Ganzes Stück offline rendern (für die Dateien); done({l,r,rate}) */
function nbRender(song,done){
  const rate=44100,Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Off){done(null);return;}
  const len=nbSeconds(song)+2.5,ctx=new Off(2,Math.ceil(rate*len),rate),master=ctx.createGain();master.gain.value=0.7;master.connect(ctx.destination);
  for(let t=0;t<song.len;t++)nbEventsAt(song,t).forEach(ev=>nbPlayEvent(ctx,master,0.05+t/song.tps,ev,song));
  const p=ctx.startRendering(),fin=buf=>done({l:buf.getChannelData(0),r:buf.getChannelData(Math.min(1,buf.numberOfChannels-1)),rate});
  if(p&&p.then)p.then(fin);else ctx.oncomplete=e=>fin(e.renderedBuffer);
}

/* ── Oberfläche (läuft im Musikstudio-Tab „Komponieren“) ── */
let nb=null,nbRaf=null;
function nbState(){
  if(!nb)nb={song:NB_DEMOS[0].make(),active:0,playing:false,tick:0,start:0,loop:true,msg:'',next:0,nextTick:0,queue:[],hover:null,sel:[],drag:null,defLen:4,tool:'draw',clip:null,hist:nbHistNew(),rect:null};
  return nb;
}
function nbStop(){
  if(nb){nb.playing=false;if(nb.timer){clearInterval(nb.timer);nb.timer=null;}}
  nbMoveHead(nb?nb.start:0);
}
function nbStart(){
  const s=nbState(),c=typeof msAudio==='function'?msAudio():null;if(!c)return;
  nbStop();s.playing=true;s.nextTick=s.start;s.next=c.currentTime+0.08;s.queue=[];
  s.timer=setInterval(nbSchedule,25);nbSchedule();nbUpdateButtons();
  if(nbRaf)cancelAnimationFrame(nbRaf);nbRaf=requestAnimationFrame(nbAnimate);
}
function nbSchedule(){
  const s=nb;if(!s||!s.playing||!msCtx)return;
  const d=1/s.song.tps;
  while(s.next<msCtx.currentTime+0.15){
    if(s.nextTick>=s.song.len){
      if(s.loop){s.nextTick=s.start;}
      else if(s.next>msCtx.currentTime+0.6||s.nextTick>s.song.len+8){s.stopAt=true;break;}
      else{s.nextTick++;s.next+=d;continue;}
    }
    if(s.nextTick<s.song.len)nbEventsAt(s.song,s.nextTick).forEach(ev=>nbPlayEvent(msCtx,msMaster,s.next,ev,s.song));
    s.queue.push({t:s.next,i:s.nextTick});s.next+=d;s.nextTick++;
  }
}
function nbAnimate(){
  const s=nb;if(!s||!s.playing)return;
  if(!msActive()||msTab!=='compose'){nbStop();return;}
  let cur=-1;while(s.queue.length&&s.queue[0].t<=msCtx.currentTime)cur=s.queue.shift().i;
  if(cur>=0){s.tick=cur;nbMoveHead(cur);}
  if(s.stopAt&&!s.queue.length){s.stopAt=false;nbStop();nbUpdateButtons();return;}
  nbRaf=requestAnimationFrame(nbAnimate);
}
function nbMoveHead(t){
  const h=document.getElementById('nb-head');if(!h)return;h.style.left=(t*NB_CW)+'px';
  const sc=document.getElementById('nb-scroll');if(sc&&nb&&nb.playing){const x=t*NB_CW,vis=sc.clientWidth-60;if(x<sc.scrollLeft||x>sc.scrollLeft+vis)sc.scrollLeft=Math.max(0,x-40);}
}
function nbUpdateButtons(){const b=document.getElementById('nb-play');if(b&&nb)b.textContent=nb.playing?'⏹ Stopp':'▶ Abspielen';}
function nbTogglePlay(){if(nb&&nb.playing){nbStop();nbUpdateButtons();}else nbStart();}

/* Verlauf */
function nbCommit(){const s=nbState();nbHistPush(s.hist,s.song);nbUpdateHist();}
function nbUpdateHist(){
  const s=nb;if(!s)return;
  const u=document.getElementById('nb-undo'),r=document.getElementById('nb-redo');
  if(u)u.style.opacity=s.hist.undo.length?1:0.35;if(r)r.style.opacity=s.hist.redo.length?1:0.35;
}
function nbAfterRestore(){const s=nb;s.sel=[];if(s.active>=s.song.layers.length)s.active=s.song.layers.length-1;if(s.start>=s.song.len)s.start=0;nbRenderView();}
function nbUndo(){const s=nbState(),r=nbHistUndo(s.hist,s.song);if(r){s.song=r;nbAfterRestore();}}
function nbRedo(){const s=nbState(),r=nbHistRedo(s.hist,s.song);if(r){s.song=r;nbAfterRestore();}}

/* Raster-Zugriff mit der Maus */
function nbCanvasLeft(){const cv=document.getElementById('nb-canvas');return cv?cv.getBoundingClientRect().left:0;}
function nbCell(e){
  const cv=document.getElementById('nb-canvas');if(!cv)return null;const r=cv.getBoundingClientRect();
  const x=e.clientX-r.left,y=e.clientY-r.top-NB_RULER;
  return {tick:Math.floor(x/NB_CW),key:NB_KEYS-1-Math.floor(y/NB_CH),ruler:y<0,x};
}
function nbOnEdge(n,e){return (n[0]+n[2])*NB_CW-(e.clientX-nbCanvasLeft())<=7;}
function nbPrev(key){const s=nbState(),L=s.song.layers[s.active];if(typeof msAudio==='function'&&msAudio())nbPlay(msCtx,msMaster,msCtx.currentTime,L.inst,key,L.vol/100,0.3);}
function nbIsSel(n){return nb.sel.indexOf(n)>=0;}
function nbDown(e){
  if(e.button===2)return;e.preventDefault();const s=nbState(),c=nbCell(e);if(!c)return;
  if(c.ruler){s.start=Math.max(0,Math.min(s.song.len-1,c.tick));nbMoveHead(s.start);if(s.playing)nbStart();nbDraw();return;}
  if(c.tick<0||c.tick>=s.song.len||c.key<0||c.key>=NB_KEYS)return;
  const multi=e.ctrlKey||e.metaKey||e.shiftKey,n=nbNoteAt(s.song,s.active,c.tick,c.key);
  if(n){
    if(multi){const i=s.sel.indexOf(n);if(i>=0)s.sel.splice(i,1);else s.sel.push(n);nbDraw();nbUpdateSel();return;}
    if(!nbIsSel(n))s.sel=[n];
    nbCommit();
    s.drag={mode:nbOnEdge(n,e)?'resize':'move',anchor:n,off:c.tick-n[0],moved:false};s.defLen=n[2];
  }else if(s.tool==='select'||e.shiftKey||e.ctrlKey||e.metaKey){
    s.drag={mode:'rect',t0:c.tick,k0:c.key,base:multi?s.sel.slice():[]};s.rect={t0:c.tick,t1:c.tick,k0:c.key,k1:c.key};
    if(!multi)s.sel=[];
  }else{
    nbCommit();const nn=nbAddNote(s.song,s.active,c.tick,c.key,s.defLen);
    if(!nn){nbDraw();return;}
    s.sel=[nn];s.drag={mode:'new',anchor:nn,t0:c.tick,moved:false};nbPrev(c.key);
  }
  nbDraw();nbCountEl();nbUpdateSel();
}
function nbMove(e){
  const s=nbState(),c=nbCell(e);if(!c)return;
  const d=s.drag;
  if(d&&(e.buttons&1)){
    const tick=Math.max(0,Math.min(s.song.len-1,c.tick)),key=Math.max(0,Math.min(NB_KEYS-1,c.key));
    if(d.mode==='resize'){
      const delta=(tick-d.anchor[0]+1)-d.anchor[2];
      if(delta&&nbResizeNotes(s.song,s.active,s.sel,delta)){s.defLen=d.anchor[2];d.moved=true;}
    }else if(d.mode==='new'){
      if(tick!==d.t0||d.moved){if(nbResizeNote(s.song,s.active,d.anchor,tick-d.anchor[0]+1)){s.defLen=d.anchor[2];d.moved=true;}}
    }else if(d.mode==='move'){
      const dt=(tick-d.off)-d.anchor[0],dk=key-d.anchor[1],k0=d.anchor[1];
      if((dt||dk)&&nbMoveNotes(s.song,s.active,s.sel,dt,dk)){d.moved=true;if(d.anchor[1]!==k0)nbPrev(d.anchor[1]);}
    }else if(d.mode==='rect'){
      s.rect={t0:d.t0,t1:tick,k0:d.k0,k1:key};
      const hit=nbSelectRect(s.song,s.active,d.t0,tick,d.k0,key);
      s.sel=d.base.concat(hit.filter(n=>d.base.indexOf(n)<0));
    }
    nbDraw();nbUpdateSel();
  }
  const h=c.ruler?null:[c.tick,c.key];if(!s.hover||!h||s.hover[0]!==h[0]||s.hover[1]!==h[1]){s.hover=h;nbDraw();}
  const cv=document.getElementById('nb-canvas');
  if(cv&&!(e.buttons&1)){const n=c.ruler?null:nbNoteAt(s.song,s.active,c.tick,c.key);cv.style.cursor=!n?(s.tool==='select'?'cell':'crosshair'):(nbOnEdge(n,e)?'ew-resize':'grab');}
}
document.addEventListener('pointerup',()=>{if(nb&&nb.drag){nb.drag=null;nb.rect=null;nbDraw();nbCountEl();nbUpdateSel();}});

/* Auswahl-Aktionen */
function nbSelAll(){const s=nbState();s.sel=s.song.layers[s.active].notes.slice();nbDraw();nbUpdateSel();}
function nbSelClear(){const s=nbState();s.sel=[];nbDraw();nbUpdateSel();}
function nbDelSel(){const s=nbState();if(!s.sel.length)return;nbCommit();nbRemoveNotes(s.song,s.active,s.sel);s.sel=[];nbDraw();nbCountEl();nbUpdateSel();}
function nbContext(e){const s=nbState(),c=nbCell(e);if(!c||c.ruler)return;const n=nbNoteAt(s.song,s.active,c.tick,c.key);if(n){e.preventDefault();if(!nbIsSel(n))s.sel=[n];nbDelSel();}}
function nbCopy(cut){
  const s=nbState();if(!s.sel.length){s.msg='Erst Töne auswählen (Auswahlrahmen: Umschalt gedrückt halten und ziehen).';nbMsg();return;}
  s.clip=nbCopyNotes(s.sel);s.msg=s.sel.length+(s.sel.length===1?' Ton':' Töne')+(cut?' ausgeschnitten':' kopiert')+' – Einfügen setzt sie an den Startpunkt (oder unter den Mauszeiger mit Strg+V).';
  if(cut)nbDelSel();nbMsg();
}
function nbPaste(atHover){
  const s=nbState();if(!s.clip){s.msg='Die Zwischenablage ist leer.';nbMsg();return;}
  const tick=atHover&&s.hover?s.hover[0]:s.start;nbCommit();
  const got=nbPasteNotes(s.song,s.active,s.clip,tick,0);
  s.sel=got;s.msg=got.length===s.clip.notes.length?'Eingefügt: '+got.length+(got.length===1?' Ton':' Töne')+' ab Tick '+(tick+1)+'.':'Nur '+got.length+' von '+s.clip.notes.length+' Tönen passten (Raster oder Überlappung).';
  nbDraw();nbCountEl();nbUpdateSel();nbMsg();
}
function nbDup(){
  const s=nbState();if(!s.sel.length)return;
  const clip=nbCopyNotes(s.sel),tick=Math.min(...s.sel.map(n=>n[0]))+clip.span;nbCommit();
  const got=nbPasteNotes(s.song,s.active,clip,tick,0);
  if(got.length){s.sel=got;s.msg='';}else s.msg='Hier ist kein Platz für eine Kopie.';
  nbDraw();nbCountEl();nbUpdateSel();nbMsg();
}
function nbSetLenSel(v){const s=nbState();s.defLen=+v;if(s.sel.length){nbCommit();nbSetLenNotes(s.song,s.active,s.sel,+v);}nbDraw();nbCountEl();nbUpdateSel();}
function nbSetTool(t){nbState().tool=t;nbRenderView();}
function nbUpdateSel(){
  const s=nb;if(!s)return;const el=document.getElementById('nb-sel'),sel=document.getElementById('nb-len');
  const lens=s.sel.map(n=>n[2]),same=lens.length&&lens.every(x=>x===lens[0]);
  if(sel){const l=s.sel.length?(same?lens[0]:-1):s.defLen;sel.value=NB_LENS.includes(l)?String(l):'';}
  if(el)el.textContent=!s.sel.length?'kein Ton gewählt':s.sel.length===1?(nbKeyName(s.sel[0][1])+' · Tick '+(s.sel[0][0]+1)+' · '+s.sel[0][2]+' lang'):s.sel.length+' Töne gewählt';
}
function nbPreviewKey(k){const s=nbState();if(typeof msAudio==='function'&&msAudio()){const L=s.song.layers[s.active];nbPlay(msCtx,msMaster,msCtx.currentTime,L.inst,k,L.vol/100,0.4);}}
function nbCountEl(){const el=document.getElementById('nb-info');if(el&&nb)el.textContent=nb.song.len+' Ticks · '+nbSeconds(nb.song).toFixed(1)+' s · '+nbCount(nb.song)+' Töne';}
function nbDraw(){
  const cv=document.getElementById('nb-canvas');if(!cv||!nb)return;
  const s=nb,song=s.song,ctx=cv.getContext('2d'),W=song.len*NB_CW,H=NB_RULER+NB_KEYS*NB_CH;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(0,0,W,NB_RULER);
  for(let k=0;k<NB_KEYS;k++){const y=NB_RULER+(NB_KEYS-1-k)*NB_CH;ctx.fillStyle=nbIsBlack(k)?'rgba(0,0,0,.28)':'rgba(255,255,255,.035)';ctx.fillRect(0,y,W,NB_CH);if((NB_MINKEY+k)%12===0){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,y+NB_CH-1,W,1);}}
  for(let t=0;t<=song.len;t++){ctx.fillStyle=t%16===0?'rgba(255,255,255,.35)':t%4===0?'rgba(255,255,255,.16)':'rgba(255,255,255,.05)';ctx.fillRect(t*NB_CW,t%4===0?0:NB_RULER,1,H);}
  ctx.fillStyle='rgba(255,255,255,.65)';ctx.font='10px sans-serif';ctx.textAlign='left';for(let t=0;t<song.len;t+=4)ctx.fillText(String(t/4+1),t*NB_CW+3,14);
  ctx.fillStyle='#ffd54f';ctx.beginPath();ctx.moveTo(s.start*NB_CW,NB_RULER);ctx.lineTo(s.start*NB_CW+9,NB_RULER-8);ctx.lineTo(s.start*NB_CW,NB_RULER-16);ctx.fill();
  song.layers.forEach((l,li)=>{
    if(li===s.active)return;
    ctx.globalAlpha=l.mute?0.08:0.28;ctx.fillStyle=NB_COLORS[li%NB_COLORS.length];
    l.notes.forEach(([t,k,d])=>ctx.fillRect(t*NB_CW+2,NB_RULER+(NB_KEYS-1-k)*NB_CH+3,d*NB_CW-3,NB_CH-6));
  });
  ctx.globalAlpha=1;
  const L=song.layers[s.active];
  if(L){
    ctx.fillStyle=NB_COLORS[s.active%NB_COLORS.length];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=6;
    L.notes.forEach(([t,k,d])=>ctx.fillRect(t*NB_CW+1,NB_RULER+(NB_KEYS-1-k)*NB_CH+1,d*NB_CW-2,NB_CH-2));ctx.shadowBlur=0;
    ctx.fillStyle='rgba(0,0,0,.28)';L.notes.forEach(([t,k,d])=>ctx.fillRect((t+d)*NB_CW-5,NB_RULER+(NB_KEYS-1-k)*NB_CH+3,3,NB_CH-6));
    ctx.strokeStyle='#fff';ctx.lineWidth=2;s.sel.forEach(n=>{if(L.notes.indexOf(n)>=0)ctx.strokeRect(n[0]*NB_CW+1,NB_RULER+(NB_KEYS-1-n[1])*NB_CH+1,n[2]*NB_CW-2,NB_CH-2);});
  }
  if(s.rect){const r=s.rect,x=Math.min(r.t0,r.t1)*NB_CW,y=NB_RULER+(NB_KEYS-1-Math.max(r.k0,r.k1))*NB_CH,w=(Math.abs(r.t1-r.t0)+1)*NB_CW,h=(Math.abs(r.k1-r.k0)+1)*NB_CH;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.setLineDash([]);}
  if(s.hover&&!s.drag){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.strokeRect(s.hover[0]*NB_CW+1,NB_RULER+(NB_KEYS-1-s.hover[1])*NB_CH+1,NB_CW-2,NB_CH-2);}
}

/* Ebenen und Stück */
function nbSetLayer(i,k,v){
  const s=nbState(),L=s.song.layers[i];if(!L)return;
  if(k==='vol')L.vol=Math.max(0,Math.min(100,+v|0));
  else if(k==='pan')L.pan=Math.max(-100,Math.min(100,Math.round(+v)));
  else if(k==='name')L.name=String(v).slice(0,20);
  else{
    nbCommit();
    if(k==='inst'&&NB_INST[v])L.inst=v;else if(k==='mute')L.mute=!L.mute;else if(k==='solo')L.solo=!L.solo;
    nbRenderPanel();nbDraw();
  }
}
function nbSelectLayer(i){const s=nbState();if(s.active===i)return;s.active=i;s.sel=[];nbRenderPanel();nbDraw();nbUpdateSel();}
function nbAddLayer(){const s=nbState();if(s.song.layers.length>=NB_MAXLAYERS)return;nbCommit();s.song.layers.push(nbLayer(s.song.layers.length,'harp'));s.active=s.song.layers.length-1;s.sel=[];nbRenderPanel();nbDraw();nbUpdateSel();}
function nbDelLayer(i){const s=nbState();if(s.song.layers.length<=1)return;nbCommit();s.song.layers.splice(i,1);s.active=Math.max(0,Math.min(s.active,s.song.layers.length-1));s.sel=[];nbRenderPanel();nbDraw();nbCountEl();nbUpdateSel();}
function nbClearLayer(){const s=nbState();nbCommit();s.sel=[];s.song.layers[s.active].notes=[];nbDraw();nbCountEl();nbUpdateSel();}
function nbSetTps(v){const s=nbState();s.song.tps=Math.max(1,Math.min(20,Math.round(+v*2)/2));const el=document.getElementById('nb-tps-v');if(el)el.textContent=s.song.tps+' ('+Math.round(s.song.tps*15)+' BPM)';nbCountEl();}
function nbLen(delta){const s=nbState();nbCommit();nbSetLen(s.song,s.song.len+delta);s.sel=s.sel.filter(n=>s.song.layers[s.active].notes.indexOf(n)>=0);if(s.start>=s.song.len)s.start=0;nbRenderView();}
function nbDoubleSong(){const s=nbState();nbCommit();if(!nbDouble(s.song))s.msg='Länger als 512 Ticks geht nicht.';nbRenderView();}
function nbShiftLayer(d){const s=nbState();nbCommit();if(!nbShift(s.song,s.active,d))s.msg='Weiter geht es nicht – ein Ton würde den Bereich verlassen.';else s.msg='';nbDraw();nbMsg();}
function nbMsg(){const el=document.getElementById('nb-msg');if(el&&nb)el.textContent=nb.msg||'';}
function nbReplace(song){const s=nbState();nbStop();nbCommit();s.song=song;s.active=0;s.start=0;s.sel=[];s.msg='';nbRenderView();}
function nbDemo(i){nbReplace(NB_DEMOS[i].make());}
function nbNew(){nbReplace(nbBlank());}
function nbSave(){const s=nbState(),n=(document.getElementById('nb-name')||{}).value||s.song.name;const ok=nbSaveSong(n,s.song);s.song.name=String(n).trim().slice(0,40)||s.song.name;s.msg=ok?'Gespeichert: '+s.song.name:'Speichern ging nicht (Name leer oder 30 Stücke voll).';nbRenderView();}
function nbLoad(name){const a=nbSongs();if(a[name])nbReplace(nbSanitize(a[name]));}
function nbDel(name){if(nbDeleteSong(name)){nbState().msg='Gelöscht: '+name;nbRenderView();}}
function nbExport(fmt){
  const s=nbState(),say=t=>{s.msg=t;nbMsg();};
  say('Datei wird erzeugt …');
  const go=()=>nbRender(s.song,ch=>{
    if(!ch){say('Dein Browser kann die Datei nicht erzeugen.');return;}
    const bytes=fmt==='mp3'?msMp3(ch.l,ch.r,ch.rate,128):msWav(ch.l,ch.r,ch.rate);
    if(!bytes){say('MP3 ging nicht – die Bibliothek konnte nicht geladen werden.');return;}
    const old=ms&&ms.song?ms.song.name:'';if(ms&&ms.song)ms.song.name=s.song.name;msDownload(bytes,fmt==='mp3'?'audio/mpeg':'audio/wav',fmt==='mp3'?'mp3':'wav');if(ms&&ms.song)ms.song.name=old;
    say((fmt==='mp3'?'MP3':'WAV')+'-Datei erstellt ('+Math.round(bytes.length/1024)+' KB).');
  });
  if(fmt==='mp3')msLoadLame(ok=>{if(ok)go();else say('MP3 ging nicht – die Bibliothek konnte nicht geladen werden.');});else go();
}
function nbRenderPanel(){
  const el=document.getElementById('nb-layers');if(!el||!nb)return;
  const s=nb,esc=typeof escHtml==='function'?escHtml:(x=>x);
  el.innerHTML=s.song.layers.map((l,i)=>`<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:4px 6px;border-radius:8px;margin-bottom:3px;border:2px solid ${i===s.active?NB_COLORS[i%NB_COLORS.length]:'transparent'};background:${i===s.active?'rgba(255,255,255,.06)':'transparent'}">
    <span onclick="nbSelectLayer(${i})" style="width:14px;height:14px;border-radius:4px;background:${NB_COLORS[i%NB_COLORS.length]};cursor:pointer;flex:none" title="Diese Ebene bearbeiten"></span>
    <input value="${esc(l.name)}" maxlength="20" onfocus="nbSelectLayer(${i})" onchange="nbCommit();nbSetLayer(${i},'name',this.value)" style="width:96px;padding:3px 6px;border-radius:6px;border:1px solid var(--divider);background:transparent;color:var(--text);font-size:12px">
    <select onchange="nbSetLayer(${i},'inst',this.value)" style="font-size:12px">${Object.keys(NB_INST).map(k=>`<option value="${k}" ${k===l.inst?'selected':''}>${NB_INST[k].n}</option>`).join('')}</select>
    <span title="Lautstärke" style="font-size:11px">🔊</span><input type="range" min="0" max="100" value="${l.vol}" onpointerdown="nbCommit()" oninput="nbSetLayer(${i},'vol',this.value)" style="width:64px">
    <span title="Links – Rechts (Doppelklick = Mitte)" style="font-size:11px">↔</span><input type="range" min="-100" max="100" value="${l.pan||0}" onpointerdown="nbCommit()" oninput="nbSetLayer(${i},'pan',this.value)" ondblclick="this.value=0;nbSetLayer(${i},'pan',0)" style="width:64px">
    <button class="lrn-chip ${l.mute?'active':''}" onclick="nbSetLayer(${i},'mute')" title="Stumm" style="padding:2px 8px">M</button>
    <button class="lrn-chip ${l.solo?'active':''}" onclick="nbSetLayer(${i},'solo')" title="Solo" style="padding:2px 8px">S</button>
    <button class="lrn-chip" onclick="nbDelLayer(${i})" title="Ebene löschen" style="padding:2px 8px;color:#e53935">✕</button></div>`).join('');
}
function nbRenderView(){
  const root=document.getElementById('ms-root');if(!root)return;
  const s=nbState(),song=s.song,esc=typeof escHtml==='function'?escHtml:(x=>x);
  const tabs=typeof msTabsHtml==='function'?msTabsHtml():'';
  const names=Object.keys(nbSongs());
  root.innerHTML=tabs+`<style>#nb-scroll{overflow:auto;border:1px solid var(--divider);border-radius:10px;max-height:520px;position:relative;background:rgba(0,0,0,.18)}
    #nb-wrap{position:relative;display:flex}#nb-keys{position:sticky;left:0;z-index:3;width:46px;flex:none;background:var(--card-bg,#1c1c1e);padding-top:${NB_RULER}px}
    .nb-key{height:${NB_CH}px;font-size:9px;line-height:${NB_CH}px;text-align:center;color:#999;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;box-sizing:border-box}.nb-key.b{background:#000;color:#777}.nb-key:hover{background:#ffd54f;color:#000}
    #nb-head{position:absolute;top:0;bottom:0;width:2px;background:#fff;z-index:2;pointer-events:none;left:0;opacity:.85}</style>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:8px">
    <button class="lrn-btn" id="nb-play" onclick="nbTogglePlay()" style="min-width:110px">${s.playing?'⏹ Stopp':'▶ Abspielen'}</button>
    <button class="lrn-chip ${s.loop?'active':''}" onclick="nbState().loop=!nbState().loop;nbRenderView()">🔁 Wiederholen</button>
    <button class="lrn-btn ghost" id="nb-undo" onclick="nbUndo()" title="Rückgängig (Strg+Z)" style="opacity:${s.hist.undo.length?1:0.35}">↶</button><button class="lrn-btn ghost" id="nb-redo" onclick="nbRedo()" title="Wiederholen (Strg+Y)" style="opacity:${s.hist.redo.length?1:0.35}">↷</button>
    <label style="font-size:12px">Tempo <strong id="nb-tps-v">${song.tps} (${Math.round(song.tps*15)} BPM)</strong> <input type="range" min="1" max="20" step="0.5" value="${song.tps}" onpointerdown="nbCommit()" oninput="nbSetTps(this.value)" style="width:110px;vertical-align:middle"></label>
    <span style="font-size:12px">Länge <button class="lrn-btn ghost" onclick="nbLen(-16)">−16</button><button class="lrn-btn ghost" onclick="nbLen(16)">+16</button><button class="lrn-btn ghost" onclick="nbDoubleSong()" title="Stück einmal wiederholen">×2</button></span>
    <span id="nb-info" style="font-size:12px;color:var(--text-3)"></span></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:8px;font-size:12px">
    <button class="lrn-chip ${s.tool==='draw'?'active':''}" onclick="nbSetTool('draw')" title="Klicken setzt Töne">✏️ Setzen</button><button class="lrn-chip ${s.tool==='select'?'active':''}" onclick="nbSetTool('select')" title="Ziehen markiert mit einem Rahmen (geht sonst auch mit Umschalt)">⬚ Auswählen</button>
    <label>Notenlänge <select id="nb-len" onchange="nbSetLenSel(this.value)">${NB_LENS.map(l=>`<option value="${l}" ${l===s.defLen?'selected':''}>${l===1?'1 Tick (16tel)':l===2?'2 Ticks (8tel)':l===4?'4 Ticks (Viertel)':l===8?'8 Ticks (Halbe)':l===16?'16 Ticks (Ganze)':l+' Ticks'}</option>`).join('')}</select></label>
    <span id="nb-sel" style="color:var(--text-3)">kein Ton gewählt</span>
    <button class="lrn-btn ghost" onclick="nbSelAll()" title="Strg+A">Alle</button><button class="lrn-btn ghost" onclick="nbCopy(false)" title="Strg+C">Kopieren</button><button class="lrn-btn ghost" onclick="nbCopy(true)" title="Strg+X">Ausschneiden</button><button class="lrn-btn ghost" onclick="nbPaste(false)" title="Fügt am Startpunkt ein (Strg+V: unter dem Mauszeiger)">Einfügen</button><button class="lrn-btn ghost" onclick="nbDup()" title="Strg+D: Kopie direkt dahinter">⧉</button><button class="lrn-btn ghost" onclick="nbDelSel()" title="Entf">🗑</button></div>
  <div style="display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-bottom:8px"><div id="nb-layers"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;font-size:12px"><button class="lrn-btn ghost" onclick="nbAddLayer()">＋ Ebene</button><button class="lrn-btn ghost" onclick="nbClearLayer()">Ebene leeren</button><button class="lrn-btn ghost" onclick="nbShiftLayer(1)">Ebene ↑ Halbton</button><button class="lrn-btn ghost" onclick="nbShiftLayer(-1)">Ebene ↓ Halbton</button>
    <label>Beispiel <select onchange="if(this.value!=='')nbDemo(+this.value);this.value=''"><option value="">– laden –</option>${NB_DEMOS.map((d,i)=>`<option value="${i}">${d.name}</option>`).join('')}</select></label><button class="lrn-btn ghost" onclick="nbNew()">Neu</button></div></div>
  <div id="nb-scroll"><div id="nb-wrap"><div id="nb-keys">${Array.from({length:NB_KEYS},(_,i)=>{const k=NB_KEYS-1-i;return `<div class="nb-key ${nbIsBlack(k)?'b':''}" onclick="nbPreviewKey(${k})">${nbKeyName(k)}</div>`;}).join('')}</div>
    <div style="position:relative"><canvas id="nb-canvas" width="${song.len*NB_CW}" height="${NB_RULER+NB_KEYS*NB_CH}" style="display:block;cursor:crosshair;touch-action:pan-x" onpointerdown="nbDown(event)" onpointermove="nbMove(event)" oncontextmenu="nbContext(event)" onpointerleave="nbState().hover=null;nbDraw()"></canvas><div id="nb-head"></div></div></div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:12px;font-size:12px">
    <input id="nb-name" value="${esc(song.name)}" maxlength="40" placeholder="Name des Stücks" style="padding:6px 10px;border-radius:8px;border:1px solid var(--divider);background:transparent;color:var(--text)" onchange="nbState().song.name=this.value.slice(0,40)">
    <button class="lrn-btn" onclick="nbSave()">💾 Speichern</button><button class="lrn-btn ghost" onclick="nbExport('mp3')">⬇ Als MP3</button><button class="lrn-btn ghost" onclick="nbExport('wav')">⬇ Als WAV</button></div>
  <div id="nb-msg" style="text-align:center;font-size:12px;color:var(--text-3);margin-top:6px;min-height:16px">${esc(s.msg||'')}</div>
  ${names.length?`<div class="lrn-label" style="text-align:center;margin-top:10px">Deine Stücke</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">${names.map(n=>`<span class="game-chip"><a href="#" onclick="nbLoad(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:inherit;text-decoration:none">🎼 ${esc(n)}</a> <a href="#" onclick="nbDel(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:#e53935;text-decoration:none;margin-left:6px" title="Löschen">✕</a></span>`).join('')}</div>`:''}
  <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px;line-height:1.5">Ebene wählen (farbiges Feld), dann ins Raster klicken: ein Ton entsteht, nach rechts ziehen macht ihn länger. Einen Ton packst du in der Mitte und verschiebst ihn, am rechten Rand ziehst du die Länge. Mehrere Töne: Umschalt (oder Strg) gedrückt halten und klicken, oder mit Umschalt/„Auswählen“ einen Rahmen aufziehen. Rechtsklick oder Entf löscht, Strg+C/X/V kopiert, schneidet aus und fügt ein, Strg+Z/Y macht rückgängig. Pfeiltasten verschieben die Auswahl, Umschalt+←/→ ändert die Länge. Klick aufs Lineal setzt den Startpunkt, Klick auf eine Taste links spielt den Ton an. 1 Tick = eine Sechzehntel, vier Ticks = ein Schlag.</div>`;
  nbRenderPanel();nbDraw();nbCountEl();nbMoveHead(s.start);nbUpdateSel();
}
document.addEventListener('keydown',e=>{
  if(!msActive()||msTab!=='compose')return;
  if(/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))return;
  const s=nbState(),mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(e.key===' '){e.preventDefault();nbTogglePlay();return;}
  if(mod&&k==='z'){e.preventDefault();if(e.shiftKey)nbRedo();else nbUndo();return;}
  if(mod&&k==='y'){e.preventDefault();nbRedo();return;}
  if(mod&&k==='a'){e.preventDefault();nbSelAll();return;}
  if(mod&&k==='c'){e.preventDefault();nbCopy(false);return;}
  if(mod&&k==='x'){e.preventDefault();nbCopy(true);return;}
  if(mod&&k==='v'){e.preventDefault();nbPaste(true);return;}
  if(mod&&k==='d'){e.preventDefault();nbDup();return;}
  if(e.key==='Escape'){nbSelClear();return;}
  if(!s.sel.length)return;
  if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();nbDelSel();return;}
  if(/^Arrow/.test(e.key)){
    e.preventDefault();let ok=false;nbCommit();
    if(e.shiftKey&&e.key==='ArrowRight')ok=nbResizeNotes(s.song,s.active,s.sel,1);
    else if(e.shiftKey&&e.key==='ArrowLeft')ok=nbResizeNotes(s.song,s.active,s.sel,-1);
    else if(e.key==='ArrowRight')ok=nbMoveNotes(s.song,s.active,s.sel,1,0);
    else if(e.key==='ArrowLeft')ok=nbMoveNotes(s.song,s.active,s.sel,-1,0);
    else if(e.key==='ArrowUp'){ok=nbMoveNotes(s.song,s.active,s.sel,0,1);if(ok)nbPrev(s.sel[0][1]);}
    else if(e.key==='ArrowDown'){ok=nbMoveNotes(s.song,s.active,s.sel,0,-1);if(ok)nbPrev(s.sel[0][1]);}
    if(ok){if(s.sel.length===1)s.defLen=s.sel[0][2];nbDraw();nbUpdateSel();nbCountEl();}
  }
});
