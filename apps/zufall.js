/* ══════════════════════════════════
   ZUFALL
══════════════════════════════════ */
let fmt='number';
const zHistory=[];
let alarmTime=null,alarmTimer=null,alarmArmed=false;
let alarmSoundHandle=null,previewAudio=null,previewingId=null,pendingDeleteId=null;

const BUILTIN=[
  {id:'beep',name:'Klassischer Piepton',tag:'Standard'},
  {id:'gentle',name:'Sanftes Klingeln',tag:'Standard'},
  {id:'pulse',name:'Puls',tag:'Standard'},
];
let customTones=JSON.parse(localStorage.getItem('zufall_tones')||'[]');
let selectedToneId=localStorage.getItem('zufall_selected_tone')||'beep';

function saveTones(){localStorage.setItem('zufall_tones',JSON.stringify(customTones));localStorage.setItem('zufall_selected_tone',selectedToneId)}
function allTones(){return[...BUILTIN,...customTones]}
function getSelectedTone(){return allTones().find(t=>t.id===selectedToneId)||BUILTIN[0]}

function showZufallPage(p){
  document.querySelectorAll('#screen-zufall .page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('#screen-zufall .nav-tab').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('#screen-zufall .nav-tab')[p==='main'?0:1].classList.add('active');
  if(p==='tones')renderToneList();
  stopPreview();
}

function setFormat(f){
  fmt=f;
  ['number','time','euro'].forEach(x=>document.getElementById('btn-'+x).classList.toggle('active',x===f));
  renderInputs();
  document.getElementById('result').innerHTML='<span class="result-sub">Werte eingeben und generieren</span>';
  document.getElementById('z-error').textContent='';
  document.getElementById('alarm-btn-wrap').style.display='none';
  cancelAlarm();
}

function renderInputs(){
  const area=document.getElementById('input-area'),hint=document.getElementById('hint');
  if(!area)return;
  if(fmt==='number'){
    area.innerHTML=`<div class="input-group"><label>Von</label><input type="number" id="v1" value="0" placeholder="0" step="any"/></div><div class="input-group"><label>Bis</label><input type="number" id="v2" value="100" placeholder="100" step="any"/></div>`;
    hint.textContent='Nachkommastellen werden automatisch übernommen';
  }else if(fmt==='time'){
    area.innerHTML=`<div class="input-group"><label>Von</label><input type="time" id="v1" value="08:00"/></div><div class="input-group"><label>Bis</label><input type="time" id="v2" value="18:00"/></div>`;
    hint.textContent='Ausgabe minutengenau im Format HH:MM';
  }else{
    area.innerHTML=`<div class="input-group"><label>Von (€)</label><input type="number" id="v1" value="0" placeholder="0" step="0.01" min="0"/></div><div class="input-group"><label>Bis (€)</label><input type="number" id="v2" value="100" placeholder="100" step="0.01" min="0"/></div>`;
    hint.textContent='Ergebnis centgenau auf 2 Nachkommastellen';
  }
}

function getDecimals(s){const d=s.indexOf('.');return d===-1?0:s.length-d-1}
function toMins(t){const[h,m]=t.split(':').map(Number);return h*60+m}
function toTime(m){return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}

function generate(){
  const err=document.getElementById('z-error'),res=document.getElementById('result');
  err.textContent='';cancelAlarm();
  const e1=document.getElementById('v1'),e2=document.getElementById('v2');
  if(!e1||!e2)return;
  const v1=e1.value.trim(),v2=e2.value.trim();
  if(!v1||!v2){err.textContent='Bitte beide Felder ausfüllen.';return}
  let display='',raw='',sub='';
  if(fmt==='time'){
    const a=toMins(v1),b=toMins(v2);
    if(a===b){err.textContent='Die Uhrzeiten müssen unterschiedlich sein.';return}
    const mn=Math.min(a,b),mx=Math.max(a,b);
    const r=Math.floor(Math.random()*(mx-mn+1))+mn;
    display=toTime(r);raw=display;alarmTime=display;
    sub=`zwischen ${toTime(mn)} und ${toTime(mx)} Uhr`;
    document.getElementById('alarm-btn-wrap').style.display='block';
    document.getElementById('alarm-btn').className='btn-alarm';
    document.getElementById('alarm-btn-text').textContent=`Wecker auf ${display} Uhr stellen`;
    document.getElementById('alarm-status-wrap').style.display='none';
  }else{
    alarmTime=null;document.getElementById('alarm-btn-wrap').style.display='none';
    if(fmt==='euro'){
      const a=parseFloat(v1),b=parseFloat(v2);
      if(isNaN(a)||isNaN(b)){err.textContent='Bitte gültige Zahlen eingeben.';return}
      const mn=Math.min(a,b),mx=Math.max(a,b);
      const val=parseFloat((Math.random()*(mx-mn)+mn).toFixed(2));
      display=val.toLocaleString('de-DE',{style:'currency',currency:'EUR'});raw=display;
      sub=`zwischen ${mn.toLocaleString('de-DE',{style:'currency',currency:'EUR'})} und ${mx.toLocaleString('de-DE',{style:'currency',currency:'EUR'})}`;
    }else{
      const a=parseFloat(v1),b=parseFloat(v2);
      if(isNaN(a)||isNaN(b)){err.textContent='Bitte gültige Zahlen eingeben.';return}
      const mn=Math.min(a,b),mx=Math.max(a,b);
      const dec=Math.max(getDecimals(v1),getDecimals(v2));
      const val=parseFloat((Math.random()*(mx-mn)+mn).toFixed(dec));
      display=val.toLocaleString('de-DE');raw=val;
      sub=`zwischen ${mn.toLocaleString('de-DE')} und ${mx.toLocaleString('de-DE')} · ${dec===0?'ganze Zahl':dec+' Nachkommastelle'+(dec!==1?'n':'')}`;
    }
  }
  res.innerHTML=`<span class="result-number">${display}</span><span class="result-sub">${sub}</span>`;
  zHistory.unshift(raw);if(zHistory.length>10)zHistory.pop();renderHistory();
}

function renderHistory(){
  const h=document.getElementById('hist'),c=document.getElementById('chips');
  if(!zHistory.length){h.style.display='none';return}
  h.style.display='block';
  c.innerHTML=zHistory.map(n=>`<span class="chip">${n}</span>`).join('');
}
