/* ══════════════════════════════════
   LERN-SERIE – „X Tage in Folge gelernt“ quer über alle Lern-Apps. Jede Lern-App meldet mit lsMark('name'), dass gelernt wurde;
   ein Lerntag zählt, sobald in irgendeiner App etwas gelernt wurde. Über goTo() wird oben in jede Lern-App ein Streifen mit der Serie
   und den letzten 7 Tagen gesetzt. Daten: zf_lernserie  { days: { 'JJJJ-MM-TT': { app: Anzahl } }, best }
══════════════════════════════════ */
const LS_KEY='zf_lernserie';
const LS_APPS={vokabeln:'Vokabeln',mathe:'Mathe-Trainer',periodensystem:'Periodensystem',formeln:'Tafelwerk',tippschule:'Tippschule',georaetsel:'Karten-Rätsel'};
const LS_SCREENS=['vokabeln','mathe','periodensystem','formeln','tippschule','georaetsel'];
function lsDayKey(date){const d=date||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function lsShiftDay(key,n){const p=key.split('-').map(Number),d=new Date(p[0],p[1]-1,p[2]+n);return lsDayKey(d);}
function lsLoad(){
  let d=null;try{d=JSON.parse(localStorage.getItem(LS_KEY)||'null');}catch(e){}
  if(!d||typeof d!=='object'||Array.isArray(d))d={};
  d.days=d.days&&typeof d.days==='object'&&!Array.isArray(d.days)?d.days:{};d.best=d.best|0;
  return d;
}
function lsSave(d){try{localStorage.setItem(LS_KEY,JSON.stringify(d));}catch(e){}}
/* Serie = Tage in Folge bis heute; ist heute noch nichts gelernt, zählt die Serie von gestern weiter */
function lsStreak(d,today){
  today=today||lsDayKey();let day=d.days[today]?today:lsShiftDay(today,-1),n=0;
  while(d.days[day]){n++;day=lsShiftDay(day,-1);}
  return n;
}
function lsMark(app,n){
  try{
    const d=lsLoad(),k=lsDayKey();
    d.days[k]=d.days[k]||{};d.days[k][app]=(d.days[k][app]||0)+(n||1);
    const cut=lsShiftDay(k,-400);Object.keys(d.days).forEach(x=>{if(x<cut)delete d.days[x];});   // alte Tage aufräumen
    d.best=Math.max(d.best,lsStreak(d,k));lsSave(d);lsRefresh();
  }catch(e){}
}
function lsBannerHtml(){
  const d=lsLoad(),today=lsDayKey(),streak=lsStreak(d,today),doneToday=!!d.days[today];
  const dots=[6,5,4,3,2,1,0].map(i=>{const k=lsShiftDay(today,-i);return `<span title="${k}" style="display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 2px;background:${d.days[k]?'#ff9500':'var(--divider)'}"></span>`;}).join('');
  const apps=Object.keys(d.days[today]||{}).map(a=>LS_APPS[a]||a).join(', ');
  return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;margin-bottom:12px;border-radius:12px;background:var(--surface);border:0.5px solid var(--divider);font-size:13px">
    <span style="font-size:18px">🔥</span><b>${streak} ${streak===1?'Tag':'Tage'} in Folge</b>
    <span style="color:var(--text-3)">Rekord ${Math.max(d.best,streak)}</span><span style="margin-left:auto">${dots}</span>
    <span style="flex-basis:100%;font-size:12px;color:var(--text-3)">${doneToday?'Heute gelernt: '+apps:'Heute noch nichts gelernt – eine Runde in einer Lern-App reicht.'}</span></div>`;
}
/* Streifen oben in einer Lern-App einsetzen bzw. aktualisieren */
function lsAttach(screenId){
  const wrap=document.querySelector('#screen-'+screenId+' .lrn-wrap');if(!wrap)return;
  let el=wrap.querySelector('.ls-banner');
  if(!el){el=document.createElement('div');el.className='ls-banner';wrap.insertBefore(el,wrap.firstChild);}
  el.innerHTML=lsBannerHtml();
}
function lsRefresh(){LS_SCREENS.forEach(id=>{const s=document.getElementById('screen-'+id);if(s&&s.querySelector('.ls-banner'))lsAttach(id);});}
