/* ══════════════════════════════════
   PERIODENSYSTEM – alle 118 Elemente zum Nachschlagen (Tabelle mit Steckbrief) und als Quiz.
   Daten: Ordnungszahl, Symbol, deutscher Name, Atommasse. Kategorie, Zustand und Position in der Tabelle
   werden aus der Ordnungszahl berechnet. Bestwerte des Quiz: zf_pt
══════════════════════════════════ */
const PT_KEY='zf_pt';
const PT_RAW='H Wasserstoff 1.008|He Helium 4.0026|Li Lithium 6.94|Be Beryllium 9.0122|B Bor 10.81|C Kohlenstoff 12.011|N Stickstoff 14.007|O Sauerstoff 15.999|F Fluor 18.998|Ne Neon 20.180|'
+'Na Natrium 22.990|Mg Magnesium 24.305|Al Aluminium 26.982|Si Silicium 28.085|P Phosphor 30.974|S Schwefel 32.06|Cl Chlor 35.45|Ar Argon 39.948|K Kalium 39.098|Ca Calcium 40.078|'
+'Sc Scandium 44.956|Ti Titan 47.867|V Vanadium 50.942|Cr Chrom 51.996|Mn Mangan 54.938|Fe Eisen 55.845|Co Cobalt 58.933|Ni Nickel 58.693|Cu Kupfer 63.546|Zn Zink 65.38|'
+'Ga Gallium 69.723|Ge Germanium 72.630|As Arsen 74.922|Se Selen 78.971|Br Brom 79.904|Kr Krypton 83.798|Rb Rubidium 85.468|Sr Strontium 87.62|Y Yttrium 88.906|Zr Zirconium 91.224|'
+'Nb Niob 92.906|Mo Molybdän 95.95|Tc Technetium 98|Ru Ruthenium 101.07|Rh Rhodium 102.91|Pd Palladium 106.42|Ag Silber 107.87|Cd Cadmium 112.41|In Indium 114.82|Sn Zinn 118.71|'
+'Sb Antimon 121.76|Te Tellur 127.60|I Iod 126.90|Xe Xenon 131.29|Cs Caesium 132.91|Ba Barium 137.33|La Lanthan 138.91|Ce Cer 140.12|Pr Praseodym 140.91|Nd Neodym 144.24|'
+'Pm Promethium 145|Sm Samarium 150.36|Eu Europium 151.96|Gd Gadolinium 157.25|Tb Terbium 158.93|Dy Dysprosium 162.50|Ho Holmium 164.93|Er Erbium 167.26|Tm Thulium 168.93|Yb Ytterbium 173.05|'
+'Lu Lutetium 174.97|Hf Hafnium 178.49|Ta Tantal 180.95|W Wolfram 183.84|Re Rhenium 186.21|Os Osmium 190.23|Ir Iridium 192.22|Pt Platin 195.08|Au Gold 196.97|Hg Quecksilber 200.59|'
+'Tl Thallium 204.38|Pb Blei 207.2|Bi Bismut 208.98|Po Polonium 209|At Astat 210|Rn Radon 222|Fr Francium 223|Ra Radium 226|Ac Actinium 227|Th Thorium 232.04|'
+'Pa Protactinium 231.04|U Uran 238.03|Np Neptunium 237|Pu Plutonium 244|Am Americium 243|Cm Curium 247|Bk Berkelium 247|Cf Californium 251|Es Einsteinium 252|Fm Fermium 257|'
+'Md Mendelevium 258|No Nobelium 259|Lr Lawrencium 266|Rf Rutherfordium 267|Db Dubnium 268|Sg Seaborgium 269|Bh Bohrium 270|Hs Hassium 277|Mt Meitnerium 278|Ds Darmstadtium 281|'
+'Rg Roentgenium 282|Cn Copernicium 285|Nh Nihonium 286|Fl Flerovium 289|Mc Moscovium 290|Lv Livermorium 293|Ts Tenness 294|Og Oganesson 294';
const PT_CATS={
  alkali:{name:'Alkalimetalle',color:'#ff6b6b'},erdalkali:{name:'Erdalkalimetalle',color:'#ffa94d'},
  uebergang:{name:'Übergangsmetalle',color:'#ffd43b'},metall:{name:'Metalle (Hauptgruppen)',color:'#69db7c'},
  halbmetall:{name:'Halbmetalle',color:'#38d9a9'},nichtmetall:{name:'Nichtmetalle',color:'#4dabf7'},
  halogen:{name:'Halogene',color:'#9775fa'},edelgas:{name:'Edelgase',color:'#f783ac'},
  lanthanoid:{name:'Lanthanoide',color:'#a9e34b'},actinoid:{name:'Actinoide',color:'#e599f7'}
};
const PT_EL=PT_RAW.split('|').map((s,i)=>{const p=s.split(' ');return {z:i+1,sym:p[0],name:p[1],mass:p[2]};});
PT_EL.forEach(e=>{e.cat=ptCat(e.z);e.state=ptState(e.z);const pos=ptPos(e.z);e.col=pos.col;e.row=pos.row;});
function ptCat(z){
  if([3,11,19,37,55,87].includes(z))return 'alkali';
  if([4,12,20,38,56,88].includes(z))return 'erdalkali';
  if(z>=57&&z<=71)return 'lanthanoid';
  if(z>=89&&z<=103)return 'actinoid';
  if([1,6,7,8,15,16,34].includes(z))return 'nichtmetall';
  if([5,14,32,33,51,52].includes(z))return 'halbmetall';
  if([9,17,35,53,85,117].includes(z))return 'halogen';
  if([2,10,18,36,54,86,118].includes(z))return 'edelgas';
  if([13,31,49,50,81,82,83,84,113,114,115,116].includes(z))return 'metall';
  return 'uebergang';
}
function ptState(z){
  if([1,2,7,8,9,10,17,18,36,54,86].includes(z))return 'gasförmig';
  if(z===35||z===80)return 'flüssig';
  if(z>=104)return 'unbekannt';
  return 'fest';
}
/* Spalte 1–18, Zeile 1–7; Lanthanoide in Zeile 9, Actinoide in Zeile 10 (Spalten 3–17) */
function ptPos(z){
  if(z===1)return {col:1,row:1};if(z===2)return {col:18,row:1};
  if(z<=4)return {col:z-2,row:2};if(z<=10)return {col:z+8,row:2};
  if(z<=12)return {col:z-10,row:3};if(z<=18)return {col:z,row:3};
  if(z<=36)return {col:z-18,row:4};if(z<=54)return {col:z-36,row:5};
  if(z<=56)return {col:z-54,row:6};if(z<=71)return {col:z-54,row:9};if(z<=86)return {col:z-68,row:6};
  if(z<=88)return {col:z-86,row:7};if(z<=103)return {col:z-86,row:10};return {col:z-100,row:7};
}
function ptGroupInfo(e){
  if(e.row>=9)return e.cat==='lanthanoid'?'Lanthanoide (Periode 6)':'Actinoide (Periode 7)';
  return 'Gruppe '+e.col+' · Periode '+e.row;
}
function ptLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(PT_KEY)||'null');}catch(e){}if(!d||typeof d!=='object')d={};d.best=d.best&&typeof d.best==='object'?d.best:{};d.games=d.games|0;return d;}
function ptSave(d){try{localStorage.setItem(PT_KEY,JSON.stringify(d));}catch(e){}}

/* ── Quiz-Logik (ohne Oberfläche) ── */
const PT_LEVELS={leicht:{name:'Leicht (1–20)',max:20},mittel:{name:'Mittel (1–54)',max:54},schwer:{name:'Alle 118',max:118}};
const PT_TYPES=['name','sym','z','cat'];
function ptShuffle(a,rnd){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor((rnd||Math.random)()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function ptMakeQuestion(level,type,rnd){
  rnd=rnd||Math.random;
  const max=(PT_LEVELS[level]||PT_LEVELS.leicht).max,pool=PT_EL.filter(e=>e.z<=max),e=pool[Math.floor(rnd()*pool.length)];
  let q,answer,pick;
  if(type==='sym'){q='Welches Symbol hat '+e.name+'?';answer=e.sym;pick=x=>x.sym;}
  else if(type==='z'){q='Welche Ordnungszahl hat '+e.name+' ('+e.sym+')?';answer=String(e.z);pick=x=>String(x.z);}
  else if(type==='cat'){q='Zu welcher Gruppe gehört '+e.name+' ('+e.sym+')?';answer=PT_CATS[e.cat].name;pick=x=>PT_CATS[x.cat].name;}
  else{q='Wie heißt das Element mit dem Symbol '+e.sym+'?';answer=e.name;pick=x=>x.name;}
  const wrong=[];
  if(type==='cat'){Object.keys(PT_CATS).forEach(k=>{if(PT_CATS[k].name!==answer)wrong.push(PT_CATS[k].name);});}
  else{ptShuffle(pool,rnd).forEach(x=>{const v=pick(x);if(v!==answer&&!wrong.includes(v))wrong.push(v);});}
  const opts=ptShuffle([answer].concat(ptShuffle(wrong,rnd).slice(0,3)),rnd);
  return {q,answer,opts,z:e.z};
}

/* ── Oberfläche ── */
/* ── Eigenschaften-Ansicht: die Tabelle nach einem Wert einfärben ── */
const PT_VIEWS={
  gruppe:{name:'Gruppe'},zustand:{name:'Zustand (20 °C)'},
  masse:{name:'Atommasse',hue:320,get:e=>+e.mass,fmt:v=>ptDe(v,v<100?3:2)+' u'},
  dichte:{name:'Dichte',hue:265,idx:0,log:true,fmt:v=>v<0.01?ptDe(v*1000,v<0.001?4:3)+' g/L':ptDe(v,v<10?3:2)+' g/cm³'},
  schmelz:{name:'Schmelzpunkt',hue:12,idx:1,fmt:v=>ptDe(v-273.15,0)+' °C'},
  siede:{name:'Siedepunkt',hue:35,idx:2,fmt:v=>ptDe(v-273.15,0)+' °C'},
  en:{name:'Elektronegativität',hue:150,idx:3,fmt:v=>ptDe(v,2)},
  ie:{name:'1. Ionisierungsenergie',hue:195,idx:4,fmt:v=>ptDe(v,1)+' kJ/mol'}};
const PT_STATE_COLORS={'fest':'#a5d8ff','flüssig':'#ffd43b','gasförmig':'#ffa8a8','unbekannt':'#dee2e6'};
function ptDe(v,d){return Number(v).toFixed(d).replace('.',',');}
function ptProp(view,e){
  const v=PT_VIEWS[view];if(!v||(v.get===undefined&&v.idx===undefined))return null;
  if(v.get)return v.get(e);
  const row=typeof PT_PROPS!=='undefined'?PT_PROPS[e.z-1]:null;return row&&row[v.idx]!=null?row[v.idx]:null;
}
/* Wertebereich einer Ansicht (Dichte logarithmisch, weil sie über 5 Zehnerpotenzen reicht) */
function ptRange(view){
  const v=PT_VIEWS[view],vals=PT_EL.map(e=>ptProp(view,e)).filter(x=>x!=null);
  const f=v.log?Math.log10:x=>x;const a=vals.map(f);
  return {min:Math.min(...a),max:Math.max(...a),f,count:vals.length};
}
function ptT(view,e,r){const x=ptProp(view,e);return x==null?null:(r.max===r.min?0:(r.f(x)-r.min)/(r.max-r.min));}
function ptCellStyle(view,e,r){
  if(view==='gruppe')return {bg:PT_CATS[e.cat].color,fg:'#111'};
  if(view==='zustand')return {bg:PT_STATE_COLORS[e.state],fg:'#111'};
  const t=ptT(view,e,r);if(t===null)return {bg:'#e9ecef',fg:'#868e96'};
  const l=94-t*62;return {bg:`hsl(${PT_VIEWS[view].hue},70%,${l}%)`,fg:l<58?'#fff':'#111'};
}
function ptRanks(view){
  const list=PT_EL.map(e=>[e,ptProp(view,e)]).filter(x=>x[1]!=null).sort((a,b)=>b[1]-a[1]),f=PT_VIEWS[view].fmt;
  const nm=x=>x.map(y=>`<b>${y[0].sym}</b> ${escHtml(f(y[1]))}`).join(' · ');
  return {hi:nm(list.slice(0,3)),lo:nm(list.slice(-3).reverse()),n:list.length};
}
let ptView='table',ptSel=1,ptFilter='',ptQuiz=null,ptLevel='leicht',ptData=null,ptProperty='gruppe';
function ptInit(){ptData=ptLoad();ptView='table';ptSel=1;ptFilter='';ptQuiz=null;ptRender();}
function ptSetView(v){ptView=v;ptQuiz=null;ptRender();}
function ptSelect(z){ptSel=z;ptRender();}
function ptSetFilter(k){ptFilter=ptFilter===k?'':k;ptRender();}
function ptSetProperty(k){ptProperty=k;ptFilter='';ptRender();}
function ptRender(){
  const root=document.getElementById('pt-root');if(!root)return;
  const tabs=`<div class="lrn-tabs"><button class="lrn-tab ${ptView==='table'?'active':''}" onclick="ptSetView('table')">🧪 Tabelle</button><button class="lrn-tab ${ptView==='quiz'?'active':''}" onclick="ptSetView('quiz')">🎯 Quiz</button></div>`;
  root.innerHTML=tabs+(ptView==='quiz'?ptQuizHtml():ptTableHtml());
}
function ptTableHtml(){
  const view=ptProperty,r=view==='gruppe'||view==='zustand'?null:ptRange(view),fmt=PT_VIEWS[view].fmt;
  const cell=e=>{
    const st=ptCellStyle(view,e,r),dim=view==='gruppe'&&ptFilter&&ptFilter!==e.cat,val=r?ptProp(view,e):null;
    const tip=escHtml(e.name)+(r?': '+(val==null?'kein Wert':fmt(val)):view==='zustand'?': '+e.state:'');
    return `<button type="button" onclick="ptSelect(${e.z})" title="${tip}" style="grid-column:${e.col};grid-row:${e.row};background:${st.bg};opacity:${dim?0.18:1};border:${e.z===ptSel?'2px solid var(--text)':'1px solid rgba(0,0,0,0.15)'};border-radius:5px;padding:1px 0;cursor:pointer;color:${st.fg};font-family:inherit;line-height:1.05;min-width:0"><span style="display:block;font-size:8px;opacity:.7">${e.z}</span><b style="display:block;font-size:12px">${e.sym}</b></button>`;};
  const hint=view==='gruppe'?'Tippe ein Element an. Unten kannst du eine Gruppe hervorheben.':view==='zustand'?'So liegen die Elemente bei 20 °C vor.':'Je dunkler, desto höher der Wert. Graue Felder: kein Wert bekannt.';
  const grid=`<div style="overflow-x:auto;padding-bottom:6px"><div style="display:grid;grid-template-columns:repeat(18,minmax(30px,1fr));grid-template-rows:repeat(7,38px) 14px repeat(2,38px);gap:2px;min-width:620px">${PT_EL.map(cell).join('')}
    <div style="grid-column:3/13;grid-row:1/4;font-size:12px;color:var(--text-3);display:flex;align-items:center;justify-content:center;text-align:center;padding:0 10px">${hint}</div></div></div>`;
  const chips=`<div class="lrn-label" style="margin-top:8px">Einfärben nach</div><div class="lrn-chips" style="margin-bottom:10px">${Object.keys(PT_VIEWS).map(k=>`<button type="button" class="lrn-chip ${ptProperty===k?'active':''}" onclick="ptSetProperty('${k}')">${PT_VIEWS[k].name}</button>`).join('')}</div>`;
  let legend;
  if(view==='gruppe')legend=`<div class="lrn-chips" style="margin:10px 0">${Object.keys(PT_CATS).map(k=>`<button type="button" class="lrn-chip ${ptFilter===k?'active':''}" onclick="ptSetFilter('${k}')"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${PT_CATS[k].color};margin-right:5px"></span>${PT_CATS[k].name}</button>`).join('')}</div>`;
  else if(view==='zustand')legend=`<div class="lrn-chips" style="margin:10px 0">${Object.keys(PT_STATE_COLORS).map(k=>`<span class="lrn-chip"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${PT_STATE_COLORS[k]};margin-right:5px"></span>${k}</span>`).join('')}</div>`;
  else{
    const rk=ptRanks(view),h=PT_VIEWS[view].hue;
    legend=`<div style="margin:10px 0"><div style="height:12px;border-radius:6px;background:linear-gradient(90deg,hsl(${h},70%,94%),hsl(${h},70%,32%))"></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);margin-top:3px"><span>niedrig</span><span>${PT_VIEWS[view].log?'logarithmische Skala':''}</span><span>hoch</span></div>
      <div style="font-size:12px;color:var(--text-2);margin-top:6px">Höchste: ${rk.hi}</div><div style="font-size:12px;color:var(--text-2);margin-top:2px">Niedrigste: ${rk.lo}</div>
      <div style="font-size:11px;color:var(--text-3);margin-top:2px">${rk.n} von 118 Elementen mit Wert</div></div>`;
  }
  const e=PT_EL[ptSel-1],c=PT_CATS[e.cat];
  const fv=k=>{const x=ptProp(k,e);return x==null?'–':PT_VIEWS[k].fmt(x);};
  const card=`<div class="lrn-card" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div style="width:96px;height:96px;border-radius:14px;background:${c.color};color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1"><span style="font-size:12px;opacity:.7">${e.z}</span><b style="font-size:38px">${e.sym}</b></div>
    <div style="flex:1;min-width:200px"><div style="font-size:22px;font-weight:800">${escHtml(e.name)}</div>
    <div style="font-size:13px;color:var(--text-2);margin-top:4px">${c.name} · ${ptGroupInfo(e)}</div>
    <div style="font-size:13px;color:var(--text-2);margin-top:2px">Atommasse ${escHtml(e.mass)} u · bei 20 °C ${e.state}</div>
    <div style="font-size:13px;color:var(--text-2);margin-top:2px">${e.z} Protonen · ${e.z} Elektronen</div>
    ${typeof PT_PROPS!=='undefined'?`<div style="font-size:13px;color:var(--text-2);margin-top:6px;display:grid;grid-template-columns:auto auto;gap:2px 16px;justify-content:start"><span>Dichte</span><b>${fv('dichte')}</b><span>Schmelzpunkt</span><b>${fv('schmelz')}</b><span>Siedepunkt</span><b>${fv('siede')}</b><span>Elektronegativität</span><b>${fv('en')}</b><span>1. Ionisierungsenergie</span><b>${fv('ie')}</b></div>`:''}</div>
    <div style="display:flex;gap:6px"><button class="lrn-btn ghost" ${ptSel<=1?'disabled':''} onclick="ptSelect(${ptSel-1})">◀</button><button class="lrn-btn ghost" ${ptSel>=118?'disabled':''} onclick="ptSelect(${ptSel+1})">▶</button></div></div>
    <div style="font-size:11px;color:var(--text-3);margin-top:8px">Kohlenstoff und Arsen sublimieren, Helium wird bei Normdruck nicht fest (kein Schmelz-/Siedepunkt). Daten: Wikipedia-Datenseiten (CRC-Handbuch, CC BY-SA) und Periodic-Table-JSON (CC BY-SA).</div>`;
  return grid+chips+legend+card;
}
function ptNewQuiz(){
  ptQuiz={level:ptLevel,n:0,score:0,streak:0,best:0,q:null,answered:null,total:10,done:false};
  ptNextQ();ptRender();
}
function ptNextQ(){
  const t=ptQuiz;t.answered=null;
  t.q=ptMakeQuestion(t.level,PT_TYPES[Math.floor(Math.random()*PT_TYPES.length)]);
}
function ptSetLevel(l){ptLevel=l;ptRender();}
function ptAnswer(i){
  const t=ptQuiz;if(!t||t.answered!==null||t.done)return;
  t.answered=i;const ok=t.q.opts[i]===t.q.answer;
  if(ok){t.score++;t.streak++;t.best=Math.max(t.best,t.streak);}else t.streak=0;
  ptRender();
}
function ptAdvance(){
  const t=ptQuiz;if(!t||t.answered===null)return;
  t.n++;
  if(t.n>=t.total){
    t.done=true;const d=ptLoad();d.games++;if((d.best[t.level]||0)<t.score)d.best[t.level]=t.score;ptSave(d);ptData=d;if(typeof lsMark==='function')lsMark('periodensystem');
  }else ptNextQ();
  ptRender();
}
function ptQuizHtml(){
  const t=ptQuiz,d=ptData||ptLoad();
  if(!t){
    return `<div class="lrn-card"><div class="lrn-label">Schwierigkeit</div><div class="lrn-chips">${Object.keys(PT_LEVELS).map(k=>`<button type="button" class="lrn-chip ${ptLevel===k?'active':''}" onclick="ptSetLevel('${k}')">${PT_LEVELS[k].name}${d.best[k]!=null?' · Best '+d.best[k]+'/10':''}</button>`).join('')}</div>
      <div style="font-size:13px;color:var(--text-2);margin:12px 0">10 Fragen zu Namen, Symbolen, Ordnungszahlen und Gruppen der Elemente.</div>
      <button class="lrn-btn" onclick="ptNewQuiz()">▶ Quiz starten</button></div>`;
  }
  if(t.done){
    const rec=d.best[t.level]===t.score;
    return `<div class="lrn-card" style="text-align:center"><div style="font-size:44px">${t.score>=9?'🏆':t.score>=6?'👍':'📚'}</div><div style="font-size:24px;font-weight:800">${t.score} von ${t.total} richtig</div>
      <div style="font-size:13px;color:var(--text-2);margin:6px 0 14px">Längste Serie: ${t.best}${rec?' · 🏅 Bestwert':''}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="ptNewQuiz()">Nochmal</button><button class="lrn-btn ghost" onclick="ptSetView('table')">Zur Tabelle</button></div></div>`;
  }
  const q=t.q;
  return `<div class="lrn-card"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);margin-bottom:8px"><span>Frage ${t.n+1}/${t.total}</span><span>✅ ${t.score} · 🔥 ${t.streak}</span></div>
    <div class="lrn-bar" style="margin-bottom:14px"><div style="width:${t.n/t.total*100}%"></div></div>
    <div style="font-size:19px;font-weight:800;margin-bottom:14px">${escHtml(q.q)}</div>
    <div class="lrn-two" style="margin-top:0">${q.opts.map((o,i)=>{
      let st='';if(t.answered!==null){st='opacity:.55;';if(o===q.answer)st='opacity:1;background:#34c759;color:#fff';else if(i===t.answered)st='opacity:1;background:#ff3b30;color:#fff';}
      return `<button class="lrn-btn ghost" style="padding:12px;font-size:15px;${st}" ${t.answered!==null?'disabled':''} onclick="ptAnswer(${i})">${escHtml(o)}</button>`;}).join('')}</div>
    ${t.answered!==null?`<div style="text-align:center;margin-top:14px"><button class="lrn-btn" onclick="ptAdvance()">${t.n+1>=t.total?'Ergebnis':'Weiter'} ▶</button></div>`:''}</div>`;
}
