/* ══════════════════════════════════
   REGEX TESTER
══════════════════════════════════ */
const REGEX_EXAMPLES=[
  {name:'E-Mail',pattern:'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'},
  {name:'URL',pattern:'https?:\\/\\/[^\\s/$.?#].[^\\s]*'},
  {name:'PLZ (DE)',pattern:'\\b\\d{5}\\b'},
  {name:'Datum',pattern:'\\d{2}\\.\\d{2}\\.\\d{4}'},
  {name:'Tel.',pattern:'(\\+49|0)[\\d\\s\\-\\/]{7,}'},
  {name:'IP',pattern:'\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b'},
  {name:'Zahl',pattern:'-?\\d+(\\.\\d+)?'},
  {name:'Wort',pattern:'\\b[A-Za-zÄÖÜäöüß]+\\b'},
];
function regexInit(){
  const ex=document.getElementById('regex-examples');
  if(ex)ex.innerHTML=REGEX_EXAMPLES.map(e=>`<button onclick="regexSetExample('${e.pattern.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')" class="timer-btn" style="padding:4px 8px;font-size:11px">${e.name}</button>`).join('');
}
function regexSetExample(p){const el=document.getElementById('regex-pattern');if(el){el.value=p;regexUpdate();}}
function regexUpdate(){
  const pat=document.getElementById('regex-pattern')?.value||'';
  const flags=document.getElementById('regex-flags')?.value||'';
  const text=document.getElementById('regex-text')?.value||'';
  const hl=document.getElementById('regex-highlighted');
  const info=document.getElementById('regex-info');
  const matches=document.getElementById('regex-matches');
  if(!hl)return;
  if(!pat){hl.innerHTML=escHtml(text);if(info)info.textContent='';if(matches)matches.innerHTML='';return;}
  try{
    const re=new RegExp(pat,flags.includes('g')?flags:flags+'g');
    const allMatches=[...text.matchAll(re)];
    if(info)info.textContent=`${allMatches.length} Treffer`;
    // Highlight
    let highlighted='';let last=0;
    for(const m of allMatches){
      highlighted+=escHtml(text.slice(last,m.index));
      highlighted+=`<mark style="background:#ffd60a;color:#000;border-radius:2px;padding:0 1px">${escHtml(m[0])}</mark>`;
      last=m.index+m[0].length;
    }
    highlighted+=escHtml(text.slice(last));
    hl.innerHTML=highlighted;
    if(matches)matches.innerHTML=allMatches.length?allMatches.map((m,i)=>`<div style="font-family:var(--mono);font-size:11px;padding:4px 8px;background:var(--surface);border:0.5px solid var(--divider);border-radius:5px">[${i+1}] "${escHtml(m[0])}" @ pos ${m.index}${m.length>1?' — Gruppen: '+m.slice(1).map(g=>'"'+escHtml(g||'')+'"').join(', '):''}  </div>`).join(''):'';
  }catch(e){
    if(info)info.textContent='Ungültiger Regex: '+e.message;
    hl.innerHTML=escHtml(text);
  }
}

