/* ══════════════════════════════════
   SOUND – kleine Soundeffekte für die Spiele (Web Audio, komplett synthetisiert)
   sfx('name') spielt einen Effekt; Stumm-Schalter unten links auf den Spiel-Bildschirmen.
══════════════════════════════════ */
const SFX_GAME_SCREENS=['screen-kniffel','screen-monopoly','screen-tictactoe','screen-viergewinnt','screen-schach','screen-schiffe','screen-memory','screen-hangman','screen-maumau','screen-zentrale'];
let SFX_CTX=null;
let SFX_MUTED=false;
try{SFX_MUTED=localStorage.getItem('zf_sfx_muted')==='1';}catch(e){}

function sfxCtx(){
  if(!SFX_CTX){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;SFX_CTX=new C();}
  if(SFX_CTX.state==='suspended')SFX_CTX.resume();
  return SFX_CTX;
}
function sfxTone(c,freq,dur,type,vol,delay,to){
  const t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(freq,t);
  if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(vol||0.2,0.0002),t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+0.02);
}
function sfxNoise(c,dur,vol,delay,freq){
  const t=c.currentTime+(delay||0),n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource();s.buffer=b;
  const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq||1500;
  const g=c.createGain();g.gain.value=vol||0.2;
  s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);
}
const SFX_SOUNDS={
  click:c=>sfxTone(c,900,0.04,'square',0.08),
  place:c=>{sfxTone(c,520,0.07,'triangle',0.25);sfxTone(c,340,0.09,'triangle',0.2,0.05);},
  drop:c=>{sfxTone(c,320,0.16,'triangle',0.28,0,140);sfxNoise(c,0.06,0.15,0.13,600);},
  dice:c=>{for(let i=0;i<6;i++)sfxNoise(c,0.05,0.22,i*0.06,1500+Math.random()*1500);sfxTone(c,180,0.08,'triangle',0.15,0.36);},
  flip:c=>sfxTone(c,720,0.05,'triangle',0.18,0,500),
  match:c=>{sfxTone(c,660,0.1,'sine',0.25);sfxTone(c,880,0.16,'sine',0.25,0.09);},
  nomatch:c=>sfxTone(c,220,0.18,'sawtooth',0.12,0,150),
  capture:c=>{sfxNoise(c,0.1,0.25,0,900);sfxTone(c,210,0.12,'square',0.15);},
  hit:c=>{sfxNoise(c,0.22,0.3,0,500);sfxTone(c,150,0.25,'sawtooth',0.2,0,60);},
  miss:c=>{sfxNoise(c,0.2,0.16,0,2500);sfxTone(c,420,0.18,'sine',0.14,0,220);},
  card:c=>{sfxNoise(c,0.07,0.2,0,3200);sfxTone(c,500,0.05,'triangle',0.1,0.02);},
  coin:c=>{sfxTone(c,988,0.08,'square',0.13);sfxTone(c,1319,0.22,'square',0.13,0.08);},
  pay:c=>{sfxTone(c,392,0.1,'triangle',0.2);sfxTone(c,294,0.16,'triangle',0.2,0.1);},
  undo:c=>sfxTone(c,620,0.12,'triangle',0.2,0,380),
  error:c=>sfxTone(c,150,0.16,'square',0.14),
  win:c=>[523,659,784,1046].forEach((f,i)=>sfxTone(c,f,0.18,'triangle',0.28,i*0.11)),
  lose:c=>[392,330,262].forEach((f,i)=>sfxTone(c,f,0.24,'sawtooth',0.12,i*0.16)),
  draw:c=>{sfxTone(c,440,0.14,'triangle',0.22);sfxTone(c,440,0.2,'triangle',0.22,0.16);},
  kniffel:c=>{[523,659,784,1046,784,1046,1319].forEach((f,i)=>sfxTone(c,f,0.16,'square',0.14,i*0.09));sfxTone(c,1568,0.4,'triangle',0.2,0.66);},
  rankup:c=>[523,659,784,988,1319].forEach((f,i)=>sfxTone(c,f,0.14,'triangle',0.26,i*0.08)),
  chime:c=>{sfxTone(c,880,0.16,'sine',0.25);sfxTone(c,1320,0.3,'sine',0.25,0.12);}
};
function sfx(name){
  if(SFX_MUTED)return;
  try{const c=sfxCtx(),f=SFX_SOUNDS[name];if(c&&f)f(c);}catch(e){}
}
function sfxToggle(){
  SFX_MUTED=!SFX_MUTED;
  try{localStorage.setItem('zf_sfx_muted',SFX_MUTED?'1':'0');}catch(e){}
  sfxUpdateBtn();
  if(!SFX_MUTED)sfx('chime');
}
function sfxUpdateBtn(){
  let b=document.getElementById('sfx-toggle');
  if(!b){
    b=document.createElement('button');b.id='sfx-toggle';b.onclick=sfxToggle;b.title='Sound an/aus';
    b.style.cssText='position:fixed;left:10px;bottom:10px;width:32px;height:32px;border-radius:50%;border:0.5px solid var(--divider);background:var(--surface);color:var(--text);font-size:15px;opacity:0.75;cursor:pointer;z-index:1500;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:none';
    document.body.appendChild(b);
  }
  b.textContent=SFX_MUTED?'🔇':'🔊';
  const active=document.querySelector('.screen.active');
  b.style.display=active&&SFX_GAME_SCREENS.includes(active.id)?'block':'none';
}
if(typeof goTo==='function'){
  const _goTo=goTo;
  goTo=function(id){const r=_goTo.apply(this,arguments);sfxUpdateBtn();return r;};
}
document.addEventListener('DOMContentLoaded',sfxUpdateBtn);
sfxUpdateBtn();
