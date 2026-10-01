/* ══════════════════════════════════
   MUSIKSTUDIO – eigene Musik machen, alles direkt im Browser erzeugt (Web Audio, keine Dateien nötig).
   Beat-Maker: Raster mit 16 oder 32 Schritten, 6 Schlagzeug-Spuren (Bassdrum, Snare, Clap, Hi-Hat zu/offen, Tom) plus eine Melodie- und
   eine Bass-Spur, die du in Tonart und Tonleiter einstellst (Töne passen immer zusammen). Tempo, Swing, 6 Klangfarben, Vorlagen, Würfeln.
   Klavier: 2 Oktaven zum Anklicken oder mit der Computertastatur, mit Aufnahme. Songs speicherst du je Konto, Export als WAV- oder MP3-Datei (MP3 über die kleine Bibliothek apps/lame.min.js, lamejs, LGPL, wird erst beim ersten Export geladen).
   Die Musik-Logik (Tonleitern, Schritt-Zeiten mit Swing, Ereignisse je Schritt, Lieder prüfen, WAV-Kodierung) ist von der Tonerzeugung
   getrennt und wird in tests/check.js geprüft. Songs je Konto: zf_studio
══════════════════════════════════ */
const MS_KEY='zf_studio';
const MS_DRUMS=[
  {id:'kick',name:'Bassdrum',col:'#ef5350'},{id:'snare',name:'Snare',col:'#ffa726'},{id:'clap',name:'Clap',col:'#ffee58'},
  {id:'hatc',name:'Hi-Hat',col:'#66bb6a'},{id:'hato',name:'Hi-Hat offen',col:'#26c6da'},{id:'tom',name:'Tom',col:'#ab47bc'}
];
const MS_SCALES={
  minpent:{name:'Moll-Pentatonik',iv:[0,3,5,7,10]},majpent:{name:'Dur-Pentatonik',iv:[0,2,4,7,9]},
  major:{name:'Dur',iv:[0,2,4,5,7,9,11]},minor:{name:'Moll',iv:[0,2,3,5,7,8,10]},
  blues:{name:'Blues',iv:[0,3,5,6,7,10]},dorian:{name:'Dorisch',iv:[0,2,3,5,7,9,10]}
};
const MS_KEYS=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','H'];
const MS_INST={
  synth:{name:'Synth',wave:'sawtooth',cut:2600,a:0.01,d:0.18,s:0.55,r:0.15,vol:0.22},
  square:{name:'Chip',wave:'square',cut:3200,a:0.005,d:0.1,s:0.6,r:0.08,vol:0.16},
  sine:{name:'Weich',wave:'sine',cut:6000,a:0.02,d:0.2,s:0.7,r:0.25,vol:0.35},
  pluck:{name:'Zupf',wave:'triangle',cut:4000,a:0.002,d:0.28,s:0.02,r:0.1,vol:0.4},
  bass:{name:'Bass',wave:'sawtooth',cut:520,a:0.005,d:0.2,s:0.5,r:0.1,vol:0.34},
  bell:{name:'Glocke',wave:'sine',cut:8000,a:0.003,d:0.9,s:0,r:0.3,vol:0.3,bell:1}
};
const MS_ROWS=8,MS_MIN_BPM=50,MS_MAX_BPM=200;

/* ── Musik-Logik (rein, ohne Audio) ── */
function msFreq(midi){return 440*Math.pow(2,(midi-69)/12);}
function msNote(row,rootMidi,scale){const iv=(MS_SCALES[scale]||MS_SCALES.minpent).iv;return rootMidi+iv[row%iv.length]+12*Math.floor(row/iv.length);}
function msStepDur(bpm){return 60/bpm/4;}   // ein Schritt ist eine Sechzehntel
function msStepTime(step,bpm,swing){const d=msStepDur(bpm);return step*d+(step%2===1?swing*d/3:0);}   // swing 1 = Triolen-Gefühl
function msRoot(track,key){return (track==='bass'?36:60)+key;}
function msBlank(steps){
  steps=steps===32?32:16;
  const drums={};MS_DRUMS.forEach(d=>drums[d.id]=new Array(steps).fill(0));
  const rows=()=>Array.from({length:MS_ROWS},()=>new Array(steps).fill(0));
  return {v:1,name:'Neuer Song',bpm:110,swing:0,steps,key:0,scale:'minpent',leadInst:'synth',bassInst:'bass',drums,lead:rows(),bass:rows()};
}
/* Beliebige Daten zu einem gültigen Song machen (kaputte oder fremde Daten werden entschärft) */
function msSanitize(o){
  const steps=o&&o.steps===32?32:16,s=msBlank(steps);
  if(!o||typeof o!=='object')return s;
  s.name=String(o.name||'Neuer Song').slice(0,40);
  s.bpm=Math.max(MS_MIN_BPM,Math.min(MS_MAX_BPM,Math.round(+o.bpm)||110));
  s.swing=Math.max(0,Math.min(1,+o.swing||0));
  s.key=Math.max(0,Math.min(11,(+o.key)|0));
  s.scale=MS_SCALES[o.scale]?o.scale:'minpent';
  s.leadInst=MS_INST[o.leadInst]?o.leadInst:'synth';
  s.bassInst=MS_INST[o.bassInst]?o.bassInst:'bass';
  const cell=v=>v?1:0;
  MS_DRUMS.forEach(d=>{const a=o.drums&&Array.isArray(o.drums[d.id])?o.drums[d.id]:[];for(let i=0;i<steps;i++)s.drums[d.id][i]=cell(a[i]);});
  ['lead','bass'].forEach(t=>{const g=Array.isArray(o[t])?o[t]:[];for(let r=0;r<MS_ROWS;r++){const row=Array.isArray(g[r])?g[r]:[];for(let i=0;i<steps;i++)s[t][r][i]=cell(row[i]);}});
  return s;
}
/* Was erklingt in diesem Schritt? */
function msEventsAt(song,step){
  const ev=[],i=step%song.steps;
  MS_DRUMS.forEach(d=>{if(song.drums[d.id][i])ev.push({t:'drum',id:d.id});});
  ['lead','bass'].forEach(tr=>{for(let r=0;r<MS_ROWS;r++)if(song[tr][r][i])ev.push({t:'note',track:tr,row:r,midi:msNote(r,msRoot(tr,song.key),song.scale),inst:tr==='lead'?song.leadInst:song.bassInst});});
  return ev;
}
function msCount(song){let n=0;MS_DRUMS.forEach(d=>song.drums[d.id].forEach(v=>n+=v));['lead','bass'].forEach(t=>song[t].forEach(r=>r.forEach(v=>n+=v)));return n;}
function msLength(song,bars){return song.steps*msStepDur(song.bpm)*(bars||1)+(song.swing*msStepDur(song.bpm)/3);}
/* 16-Bit-WAV (Stereo) aus zwei Kanälen mit Werten von -1 bis 1 */
function msWav(left,right,rate){
  const n=left.length,bytes=new Uint8Array(44+n*4),dv=new DataView(bytes.buffer);
  const wr=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};
  wr(0,'RIFF');dv.setUint32(4,36+n*4,true);wr(8,'WAVE');wr(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,2,true);
  dv.setUint32(24,rate,true);dv.setUint32(28,rate*4,true);dv.setUint16(32,4,true);dv.setUint16(34,16,true);wr(36,'data');dv.setUint32(40,n*4,true);
  const cl=x=>{x=Math.max(-1,Math.min(1,x));return Math.round(x<0?x*32768:x*32767);};
  for(let i=0;i<n;i++){dv.setInt16(44+i*4,cl(left[i]),true);dv.setInt16(46+i*4,cl(right[i]),true);}
  return bytes;
}
/* MP3 (Stereo) mit der Bibliothek lamejs; gibt null zurück, wenn sie nicht geladen ist */
function msMp3(left,right,rate,kbps){
  if(typeof lamejs==='undefined'||!lamejs.Mp3Encoder)return null;
  const enc=new lamejs.Mp3Encoder(2,rate,kbps||128),n=left.length,parts=[],B=1152;
  const i16=(src,o,len)=>{const a=new Int16Array(len);for(let i=0;i<len;i++){const x=Math.max(-1,Math.min(1,src[o+i]));a[i]=x<0?x*32768:x*32767;}return a;};
  for(let o=0;o<n;o+=B){const len=Math.min(B,n-o),d=enc.encodeBuffer(i16(left,o,len),i16(right,o,len));if(d.length)parts.push(d);}
  const f=enc.flush();if(f.length)parts.push(f);
  let total=0;parts.forEach(x=>total+=x.length);const out=new Uint8Array(total);let k=0;parts.forEach(x=>{out.set(x,k);k+=x.length;});return out;
}
function msLoadLame(done){
  if(typeof lamejs!=='undefined'){done(true);return;}
  const sc=document.createElement('script');sc.src='apps/lame.min.js';sc.onload=()=>done(typeof lamejs!=='undefined');sc.onerror=()=>done(false);document.head.appendChild(sc);
}
/* Vorlagen: Schlagzeug als Text ('x' = Schlag), Melodie als Liste [Schritt,Zeile] */
function msFromText(drums,lead,bass,opt){
  const s=msBlank(16);Object.assign(s,opt||{});
  MS_DRUMS.forEach(d=>{const t=drums[d.id]||'';for(let i=0;i<16;i++)s.drums[d.id][i]=t[i]==='x'?1:0;});
  (lead||[]).forEach(([i,r])=>{s.lead[r][i]=1;});(bass||[]).forEach(([i,r])=>{s.bass[r][i]=1;});
  return s;
}
const MS_PRESETS=[
  {id:'house',name:'House (4 auf den Boden)',make:()=>msFromText({kick:'x...x...x...x...',clap:'....x.......x...',hatc:'..x...x...x...x.',hato:'..x...x...x...x.'},[[0,4],[3,2],[6,5],[8,4],[11,6],[14,2]],[[0,0],[4,0],[8,2],[12,0]],{name:'House',bpm:124,key:9,scale:'minpent',leadInst:'synth',bassInst:'bass'})},
  {id:'hiphop',name:'Hip-Hop',make:()=>msFromText({kick:'x.....x..x......',snare:'....x.......x...',hatc:'x.x.x.x.x.x.x.x.',tom:'..............x.'},[[2,3],[6,2],[10,4],[12,2]],[[0,0],[6,0],[9,2],[10,1]],{name:'Hip-Hop',bpm:90,swing:0.45,key:0,scale:'minor',leadInst:'pluck',bassInst:'bass'})},
  {id:'rock',name:'Rock',make:()=>msFromText({kick:'x.....x.x.......',snare:'....x.......x...',hatc:'x.x.x.x.x.x.x.x.',hato:'..............x.'},[[0,5],[4,6],[8,5],[12,7]],[[0,0],[2,0],[4,0],[6,2],[8,0],[10,0],[12,0],[14,2]],{name:'Rock',bpm:116,key:4,scale:'minpent',leadInst:'square',bassInst:'bass'})},
  {id:'chill',name:'Chill',make:()=>msFromText({kick:'x.......x..x....',snare:'....x.......x...',hatc:'x...x...x...x...',tom:'.......x........'},[[0,4],[4,2],[8,5],[10,3],[14,6]],[[0,0],[8,3]],{name:'Chill',bpm:78,swing:0.3,key:5,scale:'majpent',leadInst:'bell',bassInst:'sine'})},
  {id:'chip',name:'Spielhalle',make:()=>msFromText({kick:'x...x...x...x...',snare:'....x.......x..x',hatc:'xxxxxxxxxxxxxxxx'},[[0,0],[1,2],[2,4],[3,6],[4,7],[5,6],[6,4],[7,2],[8,1],[9,3],[10,5],[11,7],[12,6],[13,4],[14,3],[15,1]],[[0,0],[4,0],[8,1],[12,1]],{name:'Spielhalle',bpm:150,key:0,scale:'major',leadInst:'square',bassInst:'bass'})}
];
function msRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
/* Zufalls-Beat: immer Bassdrum auf 1, Snare auf 2 und 4, Rest nach Zufall; Melodie bleibt dank Tonleiter stimmig */
function msRandom(seed,steps){
  const r=msRng(seed),s=msBlank(steps===32?32:16),n=s.steps;
  s.name='Würfel '+(seed%1000);s.bpm=Math.round(80+r()*70);s.swing=r()<0.4?0.3:0;s.key=Math.floor(r()*12);
  s.scale=Object.keys(MS_SCALES)[Math.floor(r()*6)];s.leadInst=['synth','square','pluck','bell'][Math.floor(r()*4)];s.bassInst=['bass','sine'][Math.floor(r()*2)];
  for(let i=0;i<n;i++){
    if(i%4===0)s.drums.kick[i]=1;else if(r()<0.12)s.drums.kick[i]=1;
    if(i%8===4)s.drums.snare[i]=1;else if(r()<0.06)s.drums.snare[i]=1;
    if(i%8===4&&r()<0.5)s.drums.clap[i]=1;
    if(i%2===0)s.drums.hatc[i]=1;else if(r()<0.25)s.drums.hatc[i]=1;
    if(i%8===6&&r()<0.5)s.drums.hato[i]=1;
    if(i%4===0&&r()<0.5){s.bass[Math.floor(r()*3)][i]=1;}
    if(r()<0.35)s.lead[Math.floor(r()*MS_ROWS)][i]=1;
  }
  return s;
}
/* ── Songs je Konto ── */
function msAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n;}}catch(e){}return '';}
function msAll(){try{const o=JSON.parse(localStorage.getItem(MS_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function msSongs(){const a=msAll()[msAccount().toLowerCase()||'_gast'];const out={};if(a&&a.songs&&typeof a.songs==='object')Object.keys(a.songs).slice(0,50).forEach(k=>{out[k.slice(0,40)]=msSanitize(a.songs[k]);});return out;}
function msSaveSong(name,song){
  name=String(name||'').trim().slice(0,40);if(!name)return false;
  const all=msAll(),key=msAccount().toLowerCase()||'_gast',songs=msSongs();
  if(!(name in songs)&&Object.keys(songs).length>=50)return false;
  const s=msSanitize(song);s.name=name;songs[name]=s;all[key]={songs};
  try{localStorage.setItem(MS_KEY,JSON.stringify(all));}catch(e){return false;}
  return true;
}
function msDeleteSong(name){const all=msAll(),key=msAccount().toLowerCase()||'_gast',songs=msSongs();if(!(name in songs))return false;delete songs[name];all[key]={songs};try{localStorage.setItem(MS_KEY,JSON.stringify(all));}catch(e){return false;}return true;}

/* ── Töne erzeugen (Web Audio; ctx kann auch ein OfflineAudioContext sein) ── */
function msNoise(ctx,dur){const n=Math.max(1,Math.floor(ctx.sampleRate*dur)),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;}
function msEnv(g,when,a,peak,d,hold,r){g.gain.setValueAtTime(0.0001,when);g.gain.linearRampToValueAtTime(peak,when+a);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak*hold),when+a+d);g.gain.setTargetAtTime(0.0001,when+a+d+hold*0.0,r);}
function msVoice(ctx,dest,when,midi,dur,instId,vol){
  const I=MS_INST[instId]||MS_INST.synth,f=msFreq(midi);
  const o=ctx.createOscillator(),fl=ctx.createBiquadFilter(),g=ctx.createGain();
  o.type=I.wave;o.frequency.value=f;fl.type='lowpass';fl.frequency.setValueAtTime(Math.min(I.cut,f*8),when);fl.frequency.exponentialRampToValueAtTime(Math.max(200,Math.min(I.cut,f*8)*0.4),when+dur+0.1);
  const peak=I.vol*(vol||1);
  g.gain.setValueAtTime(0.0001,when);g.gain.linearRampToValueAtTime(peak,when+I.a);g.gain.linearRampToValueAtTime(Math.max(0.0002,peak*I.s),when+I.a+I.d);
  g.gain.setValueAtTime(Math.max(0.0002,peak*I.s),when+Math.max(dur,I.a+I.d));g.gain.linearRampToValueAtTime(0.0001,when+Math.max(dur,I.a+I.d)+I.r);
  o.connect(fl);fl.connect(g);g.connect(dest);o.start(when);o.stop(when+Math.max(dur,I.a+I.d)+I.r+0.05);
  if(I.bell){const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.value=f*2.76;g2.gain.setValueAtTime(peak*0.4,when);g2.gain.exponentialRampToValueAtTime(0.0002,when+0.5);o2.connect(g2);g2.connect(dest);o2.start(when);o2.stop(when+0.6);}
}
function msDrum(ctx,dest,when,id,vol){
  const v=vol||1,g=ctx.createGain();g.connect(dest);
  const tone=(f0,f1,dur,peak)=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f0,when);o.frequency.exponentialRampToValueAtTime(f1,when+dur);og.gain.setValueAtTime(peak*v,when);og.gain.exponentialRampToValueAtTime(0.0002,when+dur);o.connect(og);og.connect(g);o.start(when);o.stop(when+dur+0.02);};
  const noise=(dur,type,freq,peak,q)=>{const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),ng=ctx.createGain();s.buffer=msNoise(ctx,dur);fl.type=type;fl.frequency.value=freq;if(q)fl.Q.value=q;ng.gain.setValueAtTime(peak*v,when);ng.gain.exponentialRampToValueAtTime(0.0002,when+dur);s.connect(fl);fl.connect(ng);ng.connect(g);s.start(when);};
  if(id==='kick')tone(160,42,0.28,0.95);
  else if(id==='snare'){tone(210,120,0.12,0.45);noise(0.2,'highpass',1500,0.5);}
  else if(id==='clap'){[0,0.012,0.026].forEach(dt=>{const s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),ng=ctx.createGain();s.buffer=msNoise(ctx,0.12);fl.type='bandpass';fl.frequency.value=1300;fl.Q.value=1.2;ng.gain.setValueAtTime(0.5*v,when+dt);ng.gain.exponentialRampToValueAtTime(0.0002,when+dt+0.1);s.connect(fl);fl.connect(ng);ng.connect(g);s.start(when+dt);});}
  else if(id==='hatc')noise(0.05,'highpass',7500,0.28);
  else if(id==='hato')noise(0.26,'highpass',7000,0.26);
  else if(id==='tom')tone(230,95,0.32,0.7);
}
function msPlayEvent(ctx,dest,when,ev,song){
  if(ev.t==='drum')msDrum(ctx,dest,when,ev.id,1);
  else msVoice(ctx,dest,when,ev.midi,msStepDur(song.bpm)*0.9,ev.inst,1);
}
/* Song in einen Offline-Puffer rendern (für die WAV-Datei) */
function msRender(song,bars,done){
  const rate=44100,len=msLength(song,bars)+1.2,Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!Off){done(null);return;}
  const ctx=new Off(2,Math.ceil(rate*len),rate),master=ctx.createGain();master.gain.value=0.8;master.connect(ctx.destination);
  for(let b=0;b<bars;b++)for(let i=0;i<song.steps;i++){const t=b*song.steps*msStepDur(song.bpm)+msStepTime(i,song.bpm,song.swing)+0.05;msEventsAt(song,i).forEach(ev=>msPlayEvent(ctx,master,t,ev,song));}
  const p=ctx.startRendering();
  const fin=buf=>done({l:buf.getChannelData(0),r:buf.getChannelData(Math.min(1,buf.numberOfChannels-1)),rate});
  if(p&&p.then)p.then(fin);else ctx.oncomplete=e=>fin(e.renderedBuffer);
}

/* ── Oberfläche ── */
let ms=null,msTab='beat',msCtx=null,msMaster=null,msTimer=null,msPaint=null,msSel='sine',msOct=0,msRec=null,msTake=[],msHeld={};
const MS_PIANO_KEYS='awsedftgyhujkolp;';   // Computertasten → Halbtöne ab C
function msActive(){const s=document.getElementById('screen-studio');return !!s&&s.classList.contains('active');}
function msAudio(){
  if(!msCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;msCtx=new C();const comp=msCtx.createDynamicsCompressor();msMaster=msCtx.createGain();msMaster.gain.value=0.8;msMaster.connect(comp);comp.connect(msCtx.destination);}
  if(msCtx.state==='suspended')msCtx.resume();return msCtx;
}
function msInit(){
  if(typeof nbStop==='function'&&typeof nb!=='undefined'&&nb)nbStop();
  if(!ms)ms={song:msSanitize(MS_PRESETS[0].make()),playing:false,step:-1,next:0,nextStep:0,bars:2,msg:''};
  msStop();msRenderView();
}
function msSongChanged(){ms.msg='';}
function msStart(){
  const c=msAudio();if(!c)return;
  ms.playing=true;ms.queue=[];ms.nextStep=0;ms.next=c.currentTime+0.08;ms.step=-1;
  if(msTimer)clearInterval(msTimer);
  msTimer=setInterval(msSchedule,25);msSchedule();msRenderView();
  requestAnimationFrame(msAnimate);
}
function msStop(){
  if(msTimer){clearInterval(msTimer);msTimer=null;}
  if(ms){ms.playing=false;ms.step=-1;}
  msMarkStep(-1);
}
function msSchedule(){
  if(!ms||!ms.playing||!msCtx)return;
  const song=ms.song,d=msStepDur(song.bpm);
  while(ms.next<msCtx.currentTime+0.12){
    const i=ms.nextStep%song.steps,when=ms.next+(i%2===1?song.swing*d/3:0);
    msEventsAt(song,i).forEach(ev=>msPlayEvent(msCtx,msMaster,when,ev,song));
    (ms.queue=ms.queue||[]).push({t:when,i});
    ms.next+=d;ms.nextStep++;
  }
}
function msAnimate(){
  if(!ms||!ms.playing||!msActive()){if(ms&&ms.playing&&!msActive())msStop();return;}
  const q=ms.queue||[];let cur=-1;
  while(q.length&&q[0].t<=msCtx.currentTime){cur=q.shift().i;}
  if(cur>=0&&cur!==ms.step){ms.step=cur;msMarkStep(cur);}
  requestAnimationFrame(msAnimate);
}
function msMarkStep(i){
  document.querySelectorAll('#ms-root .ms-on').forEach(e=>e.classList.remove('ms-on'));
  if(i>=0)document.querySelectorAll('#ms-root [data-s="'+i+'"]').forEach(e=>e.classList.add('ms-on'));
}
function msToggle(track,row,i,val){
  const s=ms.song;let cur;if(track!=='drum')row=+row;
  if(track==='drum')cur=s.drums[row];else cur=s[track][row];
  const v=val===undefined?(cur[i]?0:1):val;cur[i]=v;
  const el=document.querySelector('#ms-root [data-c="'+track+'-'+row+'-'+i+'"]');if(el)el.classList.toggle('ms-fill',!!v);
  return v;
}
function msCellDown(e,track,row,i){
  e.preventDefault();if(track!=='drum')row=+row;const v=msToggle(track,row,i);msPaint=v;
  if(v&&msAudio()){if(track==='drum')msDrum(msCtx,msMaster,msCtx.currentTime,row,1);else msVoice(msCtx,msMaster,msCtx.currentTime,msNote(row,msRoot(track,ms.song.key),ms.song.scale),0.25,track==='lead'?ms.song.leadInst:ms.song.bassInst,1);}
}
function msCellOver(e,track,row,i){if(msPaint!==null&&(e.buttons&1))msToggle(track,row,i,msPaint);}
document.addEventListener('pointerup',()=>{msPaint=null;});
function msSet(k,v){
  const s=ms.song;
  if(k==='bpm')s.bpm=Math.max(MS_MIN_BPM,Math.min(MS_MAX_BPM,+v||110));
  else if(k==='swing')s.swing=Math.max(0,Math.min(1,+v/100));
  else if(k==='key')s.key=+v;else if(k==='scale'&&MS_SCALES[v])s.scale=v;
  else if(k==='leadInst'&&MS_INST[v])s.leadInst=v;else if(k==='bassInst'&&MS_INST[v])s.bassInst=v;
  else if(k==='name')s.name=String(v).slice(0,40);
  else if(k==='bars')ms.bars=Math.max(1,Math.min(8,+v|0));
  if(k==='bpm'||k==='swing'){const el=document.getElementById('ms-'+k+'-v');if(el)el.textContent=k==='bpm'?s.bpm:Math.round(s.swing*100)+' %';}
  else if(k!=='name'&&k!=='bars')msRenderView();
}
function msSteps(n){const old=ms.song,s=msSanitize(Object.assign({},old,{steps:n}));
  // beim Verlängern wird das Muster wiederholt, beim Kürzen abgeschnitten
  const cp=(from,to)=>{for(let i=0;i<n;i++)to[i]=from[i%old.steps]?1:0;};
  MS_DRUMS.forEach(d=>cp(old.drums[d.id],s.drums[d.id]));['lead','bass'].forEach(t=>{for(let r=0;r<MS_ROWS;r++)cp(old[t][r],s[t][r]);});
  ms.song=s;msRenderView();}
function msPreset(id){const p=MS_PRESETS.find(x=>x.id===id);if(!p)return;ms.song=msSanitize(p.make());msStopStart();}
function msDice(){ms.song=msRandom((Date.now()&0xffffff)+1,ms.song.steps);msStopStart();}
function msClear(){const n=ms.song.steps,k=msBlank(n);Object.assign(k,{bpm:ms.song.bpm,swing:ms.song.swing,key:ms.song.key,scale:ms.song.scale,leadInst:ms.song.leadInst,bassInst:ms.song.bassInst,name:ms.song.name});ms.song=k;msRenderView();}
function msStopStart(){const was=ms.playing;msStop();msRenderView();if(was)msStart();}
function msSave(){const n=(document.getElementById('ms-name')||{}).value||ms.song.name;const ok=msSaveSong(n,ms.song);ms.song.name=String(n).trim().slice(0,40)||ms.song.name;ms.msg=ok?'Gespeichert: '+ms.song.name:'Speichern ging nicht (Name leer oder 50 Songs voll).';msRenderView();}
function msLoad(name){const all=msSongs();if(all[name]){ms.song=msSanitize(all[name]);msStopStart();}}
function msDel(name){if(msDeleteSong(name)){ms.msg='Gelöscht: '+name;msRenderView();}}
function msDownload(bytes,type,ext){
  const url=URL.createObjectURL(new Blob([bytes],{type})),a=document.createElement('a');
  a.href=url;a.download=(ms.song.name||'song').replace(/[^\wäöüÄÖÜß -]/g,'_')+'.'+ext;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
}
function msExport(fmt){
  const say=t=>{ms.msg=t;const el=document.getElementById('ms-msg');if(el)el.textContent=t;};
  say('Datei wird erzeugt …');
  const go=()=>msRender(ms.song,ms.bars,ch=>{
    if(!ch){say('Dein Browser kann die Datei nicht erzeugen.');return;}
    const bytes=fmt==='mp3'?msMp3(ch.l,ch.r,ch.rate,128):msWav(ch.l,ch.r,ch.rate);
    if(!bytes){say('MP3 ging nicht – die Bibliothek konnte nicht geladen werden.');return;}
    msDownload(bytes,fmt==='mp3'?'audio/mpeg':'audio/wav',fmt==='mp3'?'mp3':'wav');
    say((fmt==='mp3'?'MP3':'WAV')+'-Datei erstellt ('+Math.round(bytes.length/1024)+' KB).');
  });
  if(fmt==='mp3')msLoadLame(ok=>{if(ok)go();else say('MP3 ging nicht – die Bibliothek konnte nicht geladen werden.');});else go();
}
function msTabsHtml(){return `<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;flex-wrap:wrap"><button class="lrn-chip ${msTab==='beat'?'active':''}" onclick="msTabSet('beat')">🥁 Beat-Maker</button><button class="lrn-chip ${msTab==='compose'?'active':''}" onclick="msTabSet('compose')">🎼 Komponieren</button><button class="lrn-chip ${msTab==='piano'?'active':''}" onclick="msTabSet('piano')">🎹 Klavier</button></div>`;}
function msTabSet(t){msTab=t;msStop();if(typeof nbStop==='function')nbStop();msRenderView();}
/* Klavier */
function msKeyOn(semi){
  if(msHeld[semi])return;const c=msAudio();if(!c)return;
  const midi=48+12*msOct+semi,f=msFreq(midi);msHeld[semi]={t:c.currentTime};
  msVoice(c,msMaster,c.currentTime,midi,0.6,msSel,1);
  const el=document.querySelector('#ms-root [data-k="'+semi+'"]');if(el)el.classList.add('ms-down');
  if(msRec!==null)msTake.push({midi,t:c.currentTime-msRec});
}
function msKeyOff(semi){delete msHeld[semi];const el=document.querySelector('#ms-root [data-k="'+semi+'"]');if(el)el.classList.remove('ms-down');}
function msRecToggle(){const c=msAudio();if(!c)return;if(msRec===null){msTake=[];msRec=c.currentTime;}else{msRec=null;}msRenderView();}
function msPlayTake(){const c=msAudio();if(!c||!msTake.length)return;const t0=c.currentTime+0.1;msTake.forEach(n=>msVoice(c,msMaster,t0+n.t,n.midi,0.5,msSel,1));}
function msOctShift(d){msOct=Math.max(-1,Math.min(1,msOct+d));msRenderView();}
function msSelInst(k){msSel=k;msRenderView();}
document.addEventListener('keydown',e=>{
  if(!msActive()||msTab!=='piano'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(/INPUT|SELECT|TEXTAREA/.test((document.activeElement||{}).tagName||''))return;
  const i=MS_PIANO_KEYS.indexOf(e.key.toLowerCase());if(i>=0){e.preventDefault();msKeyOn(i);}
});
document.addEventListener('keyup',e=>{const i=MS_PIANO_KEYS.indexOf(e.key.toLowerCase());if(i>=0)msKeyOff(i);});
function msRenderView(){
  const root=document.getElementById('ms-root');if(!root||!ms)return;
  if(msTab==='compose'&&typeof nbRenderView==='function'){nbRenderView();return;}
  const s=ms.song,esc=typeof escHtml==='function'?escHtml:(x=>x);
  const tabs=msTabsHtml();
  const opt=(obj,cur)=>Object.keys(obj).map(k=>`<option value="${k}" ${k===cur?'selected':''}>${obj[k].name}</option>`).join('');
  if(msTab==='piano'){
    const whites=[0,2,4,5,7,9,11,12,14,16,17,19,21,23,24],blacks={0:1,2:3,5:6,7:8,9:10,12:13,14:15,17:18,19:20,21:22},label={0:'A',2:'S',4:'D',5:'F',7:'G',9:'H',11:'J',12:'K',14:'L',16:'P'};
    const kb=whites.map((w,i)=>`<div data-k="${w}" onpointerdown="msKeyOn(${w})" onpointerup="msKeyOff(${w})" onpointerleave="msKeyOff(${w})" style="position:relative;flex:1;min-width:30px;height:170px;background:#fafafa;border:1px solid #999;border-radius:0 0 6px 6px;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;color:#888;font-size:11px;padding-bottom:6px;user-select:none">${MS_KEYS[(48+12*msOct+w)%12]}${blacks[w]!==undefined?`<div data-k="${blacks[w]}" onpointerdown="event.stopPropagation();msKeyOn(${blacks[w]})" onpointerup="event.stopPropagation();msKeyOff(${blacks[w]})" onpointerleave="msKeyOff(${blacks[w]})" style="position:absolute;top:0;right:-9px;width:18px;height:105px;background:#222;border-radius:0 0 4px 4px;z-index:2"></div>`:''}</div>`).join('');
    root.innerHTML=tabs+`<style>#ms-root .ms-down{background:#ffd54f !important}</style>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:10px">
        <span style="font-size:12px;color:var(--text-3)">Klang:</span>${Object.keys(MS_INST).map(k=>`<button class="lrn-chip ${msSel===k?'active':''}" onclick="msSelInst('${k}')">${MS_INST[k].name}</button>`).join('')}
        <span style="font-size:12px;color:var(--text-3);margin-left:8px">Oktave:</span><button class="lrn-btn ghost" onclick="msOctShift(-1)">−</button><strong>${msOct>=0?'+':''}${msOct}</strong><button class="lrn-btn ghost" onclick="msOctShift(1)">+</button></div>
      <div style="display:flex;max-width:760px;margin:0 auto;padding-top:4px">${kb}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button class="lrn-btn ${msRec!==null?'':'ghost'}" onclick="msRecToggle()">${msRec!==null?'⏹ Aufnahme stoppen':'⏺ Aufnehmen'}</button><button class="lrn-btn ghost" onclick="msPlayTake()" ${msTake.length?'':'disabled'}>▶ Abspielen (${msTake.length} Töne)</button></div>
      <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:10px">Mit der Maus oder dem Finger spielen – oder mit der Tastatur: A W S E D F T G Y H U J K O L P ; (Buchstaben = weiße und schwarze Tasten, beginnend bei C).</div>`;
    return;
  }
  const cell=(track,row,i,fill,col)=>`<div data-c="${track}-${row}-${i}" data-s="${i}" class="ms-cell ${fill?'ms-fill':''}" style="--c:${col}" onpointerdown="msCellDown(event,'${track}','${row}',${i})" onpointerover="msCellOver(event,'${track}','${row}',${i})"></div>`;
  const head=`<div class="ms-row"><div class="ms-lab"></div>${Array.from({length:s.steps},(_,i)=>`<div data-s="${i}" class="ms-num ${i%4===0?'b':''}">${i%4===0?(i/4+1):''}</div>`).join('')}</div>`;
  const drumRows=MS_DRUMS.map(d=>`<div class="ms-row"><div class="ms-lab">${d.name}</div>${Array.from({length:s.steps},(_,i)=>cell('drum',d.id,i,s.drums[d.id][i],d.col)).join('')}</div>`).join('');
  const melRows=(tr,col)=>Array.from({length:MS_ROWS},(_,k)=>{const r=MS_ROWS-1-k,m=msNote(r,msRoot(tr,s.key),s.scale);return `<div class="ms-row"><div class="ms-lab" style="font-size:10px">${MS_KEYS[m%12]}${Math.floor(m/12)-1}</div>${Array.from({length:s.steps},(_,i)=>cell(tr,r,i,s[tr][r][i],col)).join('')}</div>`;}).join('');
  const songs=msSongs(),names=Object.keys(songs);
  root.innerHTML=tabs+`<style>
    #ms-root .ms-grid{overflow-x:auto;padding-bottom:6px}
    #ms-root .ms-row{display:flex;gap:2px;margin-bottom:2px;align-items:center;min-width:max-content}
    #ms-root .ms-lab{width:84px;flex:none;font-size:11px;color:var(--text-2);font-weight:600;padding-right:4px;text-align:right}
    #ms-root .ms-cell{width:24px;height:24px;flex:none;border-radius:5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);cursor:pointer;touch-action:none}
    #ms-root .ms-cell:nth-child(5n+2),#ms-root .ms-cell:nth-child(5n+6){}
    #ms-root .ms-cell.ms-fill{background:var(--c);border-color:transparent;box-shadow:0 0 8px var(--c)}
    #ms-root .ms-cell.ms-on{outline:2px solid #fff}
    #ms-root .ms-num{width:24px;flex:none;text-align:center;font-size:10px;color:var(--text-3);height:14px}
    #ms-root .ms-num.ms-on{color:#fff;font-weight:800}
    #ms-root .ms-sec{font-size:11px;font-weight:800;color:var(--text-3);margin:10px 0 4px;letter-spacing:.5px}
  </style>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:10px">
    <button class="lrn-btn" onclick="${ms.playing?'msStop();msRenderView()':'msStart()'}" style="min-width:110px">${ms.playing?'⏹ Stopp':'▶ Abspielen'}</button>
    <label style="font-size:12px">Tempo <strong id="ms-bpm-v">${s.bpm}</strong> <input type="range" min="${MS_MIN_BPM}" max="${MS_MAX_BPM}" value="${s.bpm}" oninput="msSet('bpm',this.value)" style="width:120px;vertical-align:middle"></label>
    <label style="font-size:12px">Swing <strong id="ms-swing-v">${Math.round(s.swing*100)} %</strong> <input type="range" min="0" max="100" value="${Math.round(s.swing*100)}" oninput="msSet('swing',this.value)" style="width:90px;vertical-align:middle"></label>
    <button class="lrn-chip ${s.steps===16?'active':''}" onclick="msSteps(16)">16 Schritte</button><button class="lrn-chip ${s.steps===32?'active':''}" onclick="msSteps(32)">32 Schritte</button></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:10px;font-size:12px">
    <label>Tonart <select onchange="msSet('key',this.value)">${MS_KEYS.map((k,i)=>`<option value="${i}" ${i===s.key?'selected':''}>${k}</option>`).join('')}</select></label>
    <label>Tonleiter <select onchange="msSet('scale',this.value)">${opt(MS_SCALES,s.scale)}</select></label>
    <label>Melodie <select onchange="msSet('leadInst',this.value)">${opt(MS_INST,s.leadInst)}</select></label>
    <label>Bass <select onchange="msSet('bassInst',this.value)">${opt(MS_INST,s.bassInst)}</select></label>
    <label>Vorlage <select onchange="msPreset(this.value)"><option value="">– wählen –</option>${MS_PRESETS.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label>
    <button class="lrn-btn ghost" onclick="msDice()">🎲 Würfeln</button><button class="lrn-btn ghost" onclick="msClear()">🗑 Leeren</button></div>
  <div class="ms-grid">${head}<div class="ms-sec">SCHLAGZEUG</div>${drumRows}<div class="ms-sec">MELODIE</div>${melRows('lead','#42a5f5')}<div class="ms-sec">BASS</div>${melRows('bass','#ec407a')}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:14px;font-size:12px">
    <input id="ms-name" value="${esc(s.name)}" maxlength="40" placeholder="Songname" style="padding:6px 10px;border-radius:8px;border:1px solid var(--divider);background:transparent;color:var(--text)" onchange="msSet('name',this.value)">
    <button class="lrn-btn" onclick="msSave()">💾 Speichern</button>
    <label>Wiederholungen <select onchange="msSet('bars',this.value)">${[1,2,4,8].map(n=>`<option ${n===ms.bars?'selected':''}>${n}</option>`).join('')}</select></label>
    <button class="lrn-btn ghost" onclick="msExport('mp3')">⬇ Als MP3</button><button class="lrn-btn ghost" onclick="msExport('wav')">⬇ Als WAV</button></div>
  <div id="ms-msg" style="text-align:center;font-size:12px;color:var(--text-3);margin-top:6px;min-height:16px">${esc(ms.msg||'')}</div>
  ${names.length?`<div class="lrn-label" style="text-align:center;margin-top:10px">Deine Songs</div><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:6px">${names.map(n=>`<span class="game-chip"><a href="#" onclick="msLoad(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:inherit;text-decoration:none">🎵 ${esc(n)}</a> <a href="#" onclick="msDel(decodeURIComponent('${encodeURIComponent(n)}'));return false" style="color:#e53935;text-decoration:none;margin-left:6px" title="Löschen">✕</a></span>`).join('')}</div>`:''}
  <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:12px">Klicke Felder an (oder ziehe über mehrere), um Schläge und Töne zu setzen. Die Tonleiter sorgt dafür, dass jede Melodie gut klingt – die Zeilen sind die Töne der gewählten Tonart von unten nach oben.</div>`;
}
