/* ══════════════════════════════════
   STIMMENSTUDIO – Stimme mit dem Mikrofon aufnehmen (oder eine Audiodatei laden), zuschneiden, mit Effekten verändern und als WAV oder MP3 speichern.
   Effekte: Roboter, Echo, Hall, Chipmunk (hoch), Monster (tief), Rückwärts, Radio, Lauter. Jeder Effekt lässt sich rückgängig machen (bis zu 10 Schritte).
   Alles läuft im Browser, nichts wird hochgeladen. Die Effekte sind einfache Rechenverfahren auf den Messwerten (testbar ohne Mikrofon).
   Aufnahmen werden nicht gespeichert – exportiere, was du behalten willst. MP3 nutzt wie das Musikstudio die Bibliothek apps/lame.min.js (wird erst beim Export geladen).
══════════════════════════════════ */
const SV_MAX_SEC=60,SV_UNDO=10;
/* ── Reine Signalverarbeitung auf Float32Array (Mono, Werte −1…1) ── */
function svNormalize(x,peak){peak=peak||0.95;let m=0;for(let i=0;i<x.length;i++)m=Math.max(m,Math.abs(x[i]));if(m<1e-6)return Float32Array.from(x);const g=peak/m,o=new Float32Array(x.length);for(let i=0;i<x.length;i++)o[i]=x[i]*g;return o;}
function svTrim(x,rate,startSec,endSec){const a=Math.max(0,Math.min(x.length,Math.round(startSec*rate))),b=Math.max(a,Math.min(x.length,Math.round(endSec*rate)));return x.slice(a,b);}
function svReverse(x){const o=new Float32Array(x.length);for(let i=0;i<x.length;i++)o[i]=x[x.length-1-i];return o;}
/* Tonhöhe und Tempo zusammen ändern (Faktor 1,5 = höher und schneller, 0,7 = tiefer und langsamer), lineare Interpolation */
function svPitch(x,f){const n=Math.max(1,Math.floor(x.length/f)),o=new Float32Array(n);for(let i=0;i<n;i++){const p=i*f,k=Math.floor(p),t=p-k,a=x[k]||0,b=k+1<x.length?x[k+1]:a;o[i]=a+(b-a)*t;}return o;}
/* Roboter: Ringmodulation (Signal mal Sinus) */
function svRobot(x,rate,freq){freq=freq||50;const o=new Float32Array(x.length),w=2*Math.PI*freq/rate;for(let i=0;i<x.length;i++)o[i]=x[i]*Math.sin(w*i);return o;}
/* Echo: verzögerte Wiederholungen, die leiser werden; die Aufnahme wird um den Nachhall verlängert */
function svEcho(x,rate,delaySec,feedback,mix){
  delaySec=delaySec||0.28;feedback=feedback===undefined?0.45:feedback;mix=mix===undefined?0.6:mix;
  const d=Math.max(1,Math.round(delaySec*rate)),tail=Math.min(Math.round(rate*2),d*6),n=x.length+tail,buf=new Float32Array(n),o=new Float32Array(n);
  for(let i=0;i<n;i++){const dry=i<x.length?x[i]:0,wet=i>=d?buf[i-d]:0;buf[i]=dry+wet*feedback;o[i]=dry+wet*mix;}
  return o;
}
/* Hall: vier Kammfilter und zwei Allpässe (Schroeder), 30 % Hallanteil, 1,5 s Nachhall */
function svReverb(x,rate){
  const tail=Math.round(rate*1.5),n=x.length+tail,inp=new Float32Array(n);inp.set(x);
  const combs=[0.0297,0.0371,0.0411,0.0437].map(s=>Math.round(s*rate)),sum=new Float32Array(n);
  combs.forEach(d=>{const b=new Float32Array(n);for(let i=0;i<n;i++){b[i]=inp[i]+(i>=d?b[i-d]*0.77:0);sum[i]+=b[i]*0.25;}});
  let y=sum;[0.005,0.0017].forEach(s=>{const d=Math.round(s*rate),o=new Float32Array(n);for(let i=0;i<n;i++){const xd=i>=d?y[i-d]:0,od=i>=d?o[i-d]:0;o[i]=-0.7*y[i]+xd+0.7*od;}y=o;});
  const out=new Float32Array(n);for(let i=0;i<n;i++)out[i]=inp[i]*0.7+y[i]*0.3;return out;
}
/* Radio: Bässe und Höhen abschneiden (ca. 500–3000 Hz) und leicht übersteuern */
function svRadio(x,rate){
  const lp=1-Math.exp(-2*Math.PI*3000/rate),hp=Math.exp(-2*Math.PI*500/rate),o=new Float32Array(x.length);let l=0,px=0,py=0;
  for(let i=0;i<x.length;i++){l+=lp*(x[i]-l);const h=hp*(py+l-px);px=l;py=h;o[i]=Math.tanh(h*3)*0.8;}
  return o;
}
const SV_EFFECTS={
  robot:{name:'🤖 Roboter',fn:(x,r)=>svRobot(x,r,50)},
  echo:{name:'🏔️ Echo',fn:(x,r)=>svEcho(x,r)},
  hall:{name:'⛪ Hall',fn:(x,r)=>svReverb(x,r)},
  hoch:{name:'🐿️ Chipmunk',fn:x=>svPitch(x,1.5)},
  tief:{name:'👹 Monster',fn:x=>svPitch(x,0.7)},
  rueck:{name:'⏪ Rückwärts',fn:x=>svReverse(x)},
  radio:{name:'📻 Radio',fn:(x,r)=>svRadio(x,r)},
  laut:{name:'🔊 Lauter',fn:x=>svNormalize(x,0.98)}
};
/* Effekt anwenden; die Länge wird auf 60 Sekunden begrenzt. Unbekannte Effekte ändern nichts. */
function svApply(x,rate,id){const e=SV_EFFECTS[id];if(!e)return x;const y=e.fn(x,rate);return y.length>rate*SV_MAX_SEC?y.slice(0,Math.round(rate*SV_MAX_SEC)):y;}
/* Wellenform: n Spitzenwerte (größter Betrag je Abschnitt) */
function svPeaks(x,n){const o=new Float32Array(n),step=Math.max(1,x.length/n);for(let i=0;i<n;i++){let m=0;const a=Math.floor(i*step),b=Math.min(x.length,Math.floor((i+1)*step));for(let k=a;k<b;k++)m=Math.max(m,Math.abs(x[k]));o[i]=m;}return o;}
/* Rückgängig-Speicher: Liste von Zuständen, höchstens 10 */
function svPush(stack,x){stack.push(x);while(stack.length>SV_UNDO)stack.shift();return stack;}
/* ── Oberfläche ── */
let svRate=44100,svData=null,svStack=[],svCtx=null,svRec=null,svStream=null,svTimer=null,svSrc=null,svStart=0,svEnd=1,svMsg='';
const svDur=()=>svData?svData.length/svRate:0;
function svInit(){
  const root=document.getElementById('sv-root');if(!root)return;
  root.innerHTML=`<p class="sv-muted">Nimm deine Stimme auf, schneide sie zu und verwandle sie mit Effekten. Du brauchst ein Mikrofon (der Browser fragt um Erlaubnis) – oder du lädst eine Audiodatei.</p>
  <div class="sv-row"><button class="sv-btn primary" id="sv-rec" type="button">⏺ Aufnehmen</button><button class="sv-btn" id="sv-load" type="button">📂 Audiodatei laden</button><input type="file" id="sv-file" accept="audio/*" hidden><span class="sv-muted" id="sv-status"></span></div>
  <canvas id="sv-wave" width="900" height="140"></canvas>
  <div class="sv-row"><label class="sv-muted">Anfang <input type="range" id="sv-s" min="0" max="1000" value="0"></label><label class="sv-muted">Ende <input type="range" id="sv-e" min="0" max="1000" value="1000"></label><button class="sv-btn" id="sv-trim" type="button">✂ Zuschneiden</button><span class="sv-muted" id="sv-time"></span></div>
  <div class="sv-row"><button class="sv-btn primary" id="sv-play" type="button">▶ Abspielen</button><button class="sv-btn" id="sv-undo" type="button">↶ Rückgängig</button></div>
  <div class="sv-label">Effekte</div><div class="sv-row" id="sv-fx"></div>
  <div class="sv-label">Speichern</div><div class="sv-row"><button class="sv-btn" id="sv-wav" type="button">⬇ WAV</button><button class="sv-btn" id="sv-mp3" type="button">⬇ MP3</button></div>`;
  const fx=document.getElementById('sv-fx');Object.keys(SV_EFFECTS).forEach(k=>{const b=document.createElement('button');b.type='button';b.className='sv-btn';b.textContent=SV_EFFECTS[k].name;b.onclick=()=>svEffect(k);fx.appendChild(b);});
  document.getElementById('sv-rec').onclick=svToggleRec;
  document.getElementById('sv-load').onclick=()=>document.getElementById('sv-file').click();
  document.getElementById('sv-file').onchange=e=>{const f=e.target.files[0];if(f)f.arrayBuffer().then(svDecode).catch(()=>svSay('Die Datei konnte nicht gelesen werden.'));e.target.value='';};
  const s=document.getElementById('sv-s'),e=document.getElementById('sv-e');
  s.oninput=()=>{svStart=Math.min(s.value/1000,svEnd-0.001);s.value=svStart*1000;svDraw();};e.oninput=()=>{svEnd=Math.max(e.value/1000,svStart+0.001);e.value=svEnd*1000;svDraw();};
  document.getElementById('sv-trim').onclick=()=>{if(!svData)return;svChange(svTrim(svData,svRate,svStart*svDur(),svEnd*svDur()));svStart=0;svEnd=1;s.value=0;e.value=1000;};
  document.getElementById('sv-play').onclick=svPlayToggle;
  document.getElementById('sv-undo').onclick=()=>{const p=svStack.pop();if(p){svStop();svData=p;svStart=0;svEnd=1;svDraw();}};
  document.getElementById('sv-wav').onclick=()=>svExport('wav');document.getElementById('sv-mp3').onclick=()=>svExport('mp3');
  svDraw();
}
function svSay(t){const el=document.getElementById('sv-status');if(el)el.textContent=t;}
function svCtxGet(){if(!svCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;svCtx=new C();}if(svCtx.state==='suspended')svCtx.resume();return svCtx;}
function svChange(x){svPush(svStack,svData);svData=x;svDraw();}
function svEffect(id){if(!svData){svSay('Nimm zuerst etwas auf oder lade eine Datei.');return;}svStop();svChange(svApply(svData,svRate,id));svSay(SV_EFFECTS[id].name+' angewendet.');}
function svSetNew(x,rate){svStop();svRate=rate;svData=x;svStack=[];svStart=0;svEnd=1;const s=document.getElementById('sv-s'),e=document.getElementById('sv-e');if(s)s.value=0;if(e)e.value=1000;svDraw();}
function svDecode(buf){
  const c=svCtxGet();if(!c){svSay('Dein Browser kann kein Audio verarbeiten.');return Promise.resolve();}
  return new Promise((ok,no)=>c.decodeAudioData(buf,ok,no)).then(ab=>{
    const n=Math.min(ab.length,Math.round(ab.sampleRate*SV_MAX_SEC)),m=new Float32Array(n);
    for(let ch=0;ch<ab.numberOfChannels;ch++){const d=ab.getChannelData(ch);for(let i=0;i<n;i++)m[i]+=d[i]/ab.numberOfChannels;}
    svSetNew(m,ab.sampleRate);svSay('Geladen: '+(n/ab.sampleRate).toFixed(1)+' s'+(ab.length>n?' (auf 60 s gekürzt)':''));
  }).catch(()=>svSay('Das Audioformat wird nicht unterstützt.'));
}
function svToggleRec(){
  if(svRec){svRec.stop();return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){svSay('Aufnehmen geht in diesem Browser nicht – lade stattdessen eine Datei.');return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    svStop();svStream=stream;const chunks=[],r=new MediaRecorder(stream);svRec=r;let t0=Date.now();
    r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    r.onstop=()=>{clearInterval(svTimer);stream.getTracks().forEach(t=>t.stop());svRec=null;svStream=null;const b=document.getElementById('sv-rec');if(b)b.textContent='⏺ Aufnehmen';
      new Blob(chunks,{type:r.mimeType}).arrayBuffer().then(svDecode).catch(()=>svSay('Aufnahme konnte nicht gelesen werden.'));};
    r.start();document.getElementById('sv-rec').textContent='⏹ Stopp';
    svTimer=setInterval(()=>{const s=(Date.now()-t0)/1000;svSay('● Aufnahme läuft … '+s.toFixed(1)+' s');if(s>=SV_MAX_SEC)r.stop();},200);
  }).catch(()=>svSay('Kein Zugriff auf das Mikrofon (Erlaubnis verweigert oder kein Mikrofon gefunden).'));
}
function svStop(){if(svSrc){try{svSrc.onended=null;svSrc.stop();}catch(e){}svSrc=null;}const b=document.getElementById('sv-play');if(b)b.textContent='▶ Abspielen';}
function svPlayToggle(){
  if(svSrc){svStop();return;}if(!svData)return;const c=svCtxGet();if(!c)return;
  const a=Math.floor(svStart*svData.length),b=Math.floor(svEnd*svData.length),buf=c.createBuffer(1,Math.max(1,b-a),svRate);buf.copyToChannel(svData.slice(a,b),0);
  const s=c.createBufferSource();s.buffer=buf;s.connect(c.destination);s.onended=()=>{svSrc=null;const p=document.getElementById('sv-play');if(p)p.textContent='▶ Abspielen';};s.start();svSrc=s;document.getElementById('sv-play').textContent='⏹ Stopp';
}
function svDraw(){
  const cv=document.getElementById('sv-wave');if(!cv)return;const g=cv.getContext('2d'),W=cv.width,H=cv.height;g.clearRect(0,0,W,H);g.fillStyle='#0f172a';g.fillRect(0,0,W,H);
  if(svData&&svData.length){const p=svPeaks(svData,W);for(let i=0;i<W;i++){const inSel=i/W>=svStart&&i/W<=svEnd;g.fillStyle=inSel?'#38bdf8':'#475569';const h=Math.max(1,p[i]*H*0.46);g.fillRect(i,H/2-h,1,h*2);}}
  else{g.fillStyle='#64748b';g.font='16px sans-serif';g.textAlign='center';g.fillText('Noch keine Aufnahme',W/2,H/2);}
  const t=document.getElementById('sv-time');if(t)t.textContent=svData?'Länge '+svDur().toFixed(1)+' s · Auswahl '+((svEnd-svStart)*svDur()).toFixed(1)+' s':'';
}
function svExport(kind){
  if(!svData){svSay('Nimm zuerst etwas auf oder lade eine Datei.');return;}
  const a=Math.floor(svStart*svData.length),b=Math.floor(svEnd*svData.length),x=svData.slice(a,b);
  const save=(bytes,type,ext)=>{const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([bytes],{type}));l.download='stimme.'+ext;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(l.href),2000);svSay('Gespeichert als stimme.'+ext);};
  if(kind==='wav'){save(msWav(x,x,svRate),'audio/wav','wav');return;}
  svSay('MP3 wird vorbereitet …');
  msLoadLame(ok=>{if(!ok){svSay('MP3 geht gerade nicht (Bibliothek nicht ladbar) – speichere als WAV.');return;}save(msMp3(x,x,svRate,128),'audio/mpeg','mp3');});
}
