/* ══════════════════════════════════
   TAFELWERK – Nachschlagen (Tabellen aus tafelwerk-daten.js plus alle Formeln, mit Suche über alles) und Lernen mit
   Karteikarten zu Mathe, Physik und Chemie nach dem Karteikasten-Prinzip (Leitner) wie bei den Vokabeln.
   Fortschritt der Karten: zf_formeln  { id: {box, due} }
══════════════════════════════════ */
const FORM_KEY='zf_formeln';
const FORM_BOX_DAYS=[0,1,3,7,14,30];
const FORM_SESSION=15;
const FORM_DECKS={mathe:{name:'Mathe',icon:'📐'},physik:{name:'Physik',icon:'⚛️'},chemie:{name:'Chemie',icon:'🧪'}};
const FORM_RAW={
mathe:[
['Satz des Pythagoras','a² + b² = c²'],['Flächeninhalt Kreis','A = π · r²'],['Umfang Kreis','U = 2 · π · r'],
['Flächeninhalt Dreieck','A = ½ · g · h'],['Flächeninhalt Trapez','A = ½ · (a + c) · h'],['Volumen Quader','V = a · b · c'],
['Volumen Zylinder','V = π · r² · h'],['Volumen Kugel','V = 4/3 · π · r³'],['Oberfläche Kugel','O = 4 · π · r²'],
['Volumen Kegel','V = ⅓ · π · r² · h'],['Volumen Pyramide','V = ⅓ · G · h'],['1. binomische Formel','(a + b)² = a² + 2ab + b²'],
['2. binomische Formel','(a − b)² = a² − 2ab + b²'],['3. binomische Formel','(a + b) · (a − b) = a² − b²'],
['Mitternachtsformel (abc-Formel)','x = (−b ± √(b² − 4ac)) / 2a'],['pq-Formel','x = −p/2 ± √((p/2)² − q)'],
['Steigung einer Geraden','m = (y₂ − y₁) / (x₂ − x₁)'],['Geradengleichung','y = m · x + b'],['Potenzregel (Ableitung)','(xⁿ)′ = n · xⁿ⁻¹'],
['Produktregel','(u · v)′ = u′ · v + u · v′'],['Kettenregel','(f(g(x)))′ = f′(g(x)) · g′(x)'],['Sinus im Dreieck','sin α = Gegenkathete / Hypotenuse'],
['Kosinus im Dreieck','cos α = Ankathete / Hypotenuse'],['Tangens im Dreieck','tan α = Gegenkathete / Ankathete'],
['Trigonometrischer Pythagoras','sin² α + cos² α = 1'],['Logarithmus eines Produkts','log(a · b) = log a + log b'],
['Gaußsche Summenformel','1 + 2 + … + n = n · (n + 1) / 2'],['Prozentwert','W = G · p / 100'],['Kosinussatz','c² = a² + b² − 2ab · cos γ'],
['Summe der Innenwinkel im n-Eck','(n − 2) · 180°'],
['Zinseszins','Kₙ = K₀ · (1 + p/100)ⁿ'],['Summe einer arithmetischen Folge','sₙ = n/2 · (a₁ + aₙ)'],['Summe einer geometrischen Folge','sₙ = a₁ · (1 − qⁿ) / (1 − q)'],
['Ableitung von eˣ','(eˣ)′ = eˣ'],['Ableitung von sin x','(sin x)′ = cos x'],['Ableitung von ln x','(ln x)′ = 1 / x'],['Stammfunktion von xⁿ','∫ xⁿ dx = xⁿ⁺¹ / (n + 1) + C'],
['Binomialkoeffizient','(n über k) = n! / (k! · (n − k)!)'],['Abstand zweier Punkte','d = √((x₂ − x₁)² + (y₂ − y₁)²)'],['Skalarprodukt','a · b = a₁b₁ + a₂b₂ + a₃b₃'],
['Kreisgleichung','(x − m)² + (y − n)² = r²'],['Sinussatz','a / sin α = b / sin β = c / sin γ'],['Höhensatz','h² = p · q'],
['Quotientenregel','(u / v)′ = (u′ · v − u · v′) / v²'],['Basiswechsel beim Logarithmus','log_a(b) = ln b / ln a']
],
physik:[
['Geschwindigkeit','v = s / t'],['Beschleunigung','a = Δv / Δt'],['Weg bei gleichmäßiger Beschleunigung','s = ½ · a · t²'],
['Newtons 2. Gesetz (Kraft)','F = m · a'],['Gewichtskraft','F = m · g   (g ≈ 9,81 m/s²)'],['Mechanische Arbeit','W = F · s'],
['Leistung','P = W / t'],['Kinetische Energie','E = ½ · m · v²'],['Lageenergie (potenzielle Energie)','E = m · g · h'],
['Impuls','p = m · v'],['Dichte','ρ = m / V'],['Druck','p = F / A'],['Ohmsches Gesetz','U = R · I'],['Elektrische Leistung','P = U · I'],
['Reihenschaltung von Widerständen','R = R₁ + R₂ + …'],['Parallelschaltung von Widerständen','1/R = 1/R₁ + 1/R₂ + …'],
['Frequenz und Periodendauer','f = 1 / T'],['Wellengleichung','c = λ · f'],['Wärmemenge','Q = c · m · ΔT'],
['Gravitationsgesetz','F = G · m₁ · m₂ / r²'],['Zentripetalkraft','F = m · v² / r'],['Masse-Energie-Äquivalenz','E = m · c²'],
['Hookesches Gesetz (Feder)','F = D · s'],['Auftriebskraft','F = ρ · V · g'],['Elektrische Ladung','Q = I · t'],
['Wirkungsgrad','η = P(nutz) / P(zu)'],['Brechungsgesetz (Snellius)','n₁ · sin α = n₂ · sin β'],['Linsengleichung','1/f = 1/g + 1/b'],
['Lichtgeschwindigkeit im Vakuum','c ≈ 3 · 10⁸ m/s'],
['Drehmoment','M = F · r'],['Hebelgesetz','F₁ · l₁ = F₂ · l₂'],['Reibungskraft','F_R = μ · F_N'],['Freier Fall: Geschwindigkeit','v = g · t'],['Freier Fall: Weg','s = ½ · g · t²'],
['Fadenpendel (Periodendauer)','T = 2π · √(l / g)'],['Federpendel (Periodendauer)','T = 2π · √(m / D)'],['Bahngeschwindigkeit (Kreisbewegung)','v = 2π · r / T = ω · r'],
['Spezifischer Widerstand','R = ρ · l / A'],['Elektrische Arbeit','W = U · I · t'],['Kapazität eines Kondensators','C = Q / U'],['Transformator','U₁ / U₂ = N₁ / N₂'],
['Energie eines Photons','E = h · f'],['Radioaktiver Zerfall','N(t) = N₀ · (½)^(t / T½)'],['Lorentzkraft','F = q · v · B'],['Energieerhaltung (Mechanik)','E_kin + E_pot = konstant']
],
chemie:[
['Stoffmenge','n = m / M'],['Stoffmengenkonzentration','c = n / V'],['Ideales Gasgesetz','p · V = n · R · T'],['Massenanteil','w = m(Stoff) / m(Gesamt)'],
['pH-Wert','pH = −log c(H₃O⁺)'],['pH und pOH bei 25 °C','pH + pOH = 14'],['Avogadro-Konstante','N_A ≈ 6,022 · 10²³ mol⁻¹'],
['Molares Volumen eines idealen Gases (0 °C, 1013 hPa)','V_m ≈ 22,4 L/mol'],['Ionenprodukt des Wassers (25 °C)','K_W = c(H₃O⁺) · c(OH⁻) = 10⁻¹⁴ mol²/L²'],
['Verdünnungsgleichung','c₁ · V₁ = c₂ · V₂'],['Reaktionsgeschwindigkeit','v = Δc / Δt'],['Massenwirkungsgesetz','K = c(C)ᶜ · c(D)ᵈ / (c(A)ᵃ · c(B)ᵇ)'],
['Ausbeute','η = m(real) / m(theoretisch)'],['Neutronenzahl','N = A − Z   (Massenzahl − Ordnungszahl)'],
['Photosynthese (Reaktionsgleichung)','6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂'],['Neutralisation','H₃O⁺ + OH⁻ → 2 H₂O'],
['Verbrennung von Methan','CH₄ + 2 O₂ → CO₂ + 2 H₂O'],['Faradaysches Gesetz','m = M · I · t / (z · F)'],['Dichte','ρ = m / V'],
['Stoffmenge aus Teilchenzahl','n = N / N_A'],['Massenkonzentration','β = m / V'],['Volumenanteil','φ = V(Stoff) / V(Gesamt)'],['Säure- und Basenkonstante','K_S · K_B = K_W'],
['Summe der Oxidationszahlen','= Ladung des Teilchens'],['Allgemeine Formel der Alkane','CₙH₂ₙ₊₂'],['Allgemeine Formel der Alkene','CₙH₂ₙ'],['Salzbildung','Säure + Base → Salz + Wasser']
]};
const FORM_CARDS=[];
Object.keys(FORM_RAW).forEach(k=>FORM_RAW[k].forEach((c,i)=>FORM_CARDS.push({id:k[0]+(i+1),deck:k,f:c[0],b:c[1]})));

function formDay(){return Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/86400000);}
function formLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(FORM_KEY)||'null');}catch(e){}return d&&typeof d==='object'&&!Array.isArray(d)?d:{};}
function formSave(d){try{localStorage.setItem(FORM_KEY,JSON.stringify(d));}catch(e){}}
function formProg(d,id){const p=d[id];return p&&typeof p==='object'?{box:Math.max(0,Math.min(5,p.box|0)),due:p.due|0}:{box:0,due:0};}
function formIsDue(d,c){const p=formProg(d,c.id);return p.box===0||p.due<=formDay();}
function formCardsOf(deck){return deck==='alle'?FORM_CARDS:FORM_CARDS.filter(c=>c.deck===deck);}
function formStats(d,deck){
  const list=formCardsOf(deck),day=formDay();
  return {total:list.length,fresh:list.filter(c=>formProg(d,c.id).box===0).length,due:list.filter(c=>{const p=formProg(d,c.id);return p.box>0&&p.due<=day;}).length,learned:list.filter(c=>formProg(d,c.id).box>=4).length};
}
/* Antwort verbuchen: richtig = ein Fach höher, falsch = zurück in Fach 1 (morgen wieder) */
function formGrade(d,id,ok){
  const p=formProg(d,id),box=ok?Math.min(5,p.box+1):1;
  d[id]={box,due:formDay()+FORM_BOX_DAYS[box]};return d[id];
}
/* Lernrunde: fällige zuerst, dann neue, insgesamt höchstens FORM_SESSION Karten */
function formPickSession(d,deck,rnd){
  rnd=rnd||Math.random;
  const list=formCardsOf(deck).filter(c=>formIsDue(d,c)),sh=a=>a.map(x=>[rnd(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
  const due=list.filter(c=>formProg(d,c.id).box>0),fresh=list.filter(c=>formProg(d,c.id).box===0);
  return sh(due).concat(sh(fresh)).slice(0,FORM_SESSION);
}

/* ── Tafelwerk: Abschnitte (Tabellen + Formel-Übersichten aus den Karteikarten) ── */
const TAFEL_ORDER=['mathe','physik','chemie','astro','info','alltag'];
function formSections(){
  const list=[];
  Object.keys(FORM_DECKS).forEach(k=>list.push({id:'f-'+k,subj:k,title:'Formeln – Übersicht',icon:'🧾',cols:['Name','Formel'],rows:formCardsOf(k).map(c=>[c.f,c.b]),formula:true}));
  (typeof TAFEL!=='undefined'?TAFEL:[]).forEach(t=>list.push(t));
  return list.map((x,i)=>({x,i})).sort((a,b)=>TAFEL_ORDER.indexOf(a.x.subj)-TAFEL_ORDER.indexOf(b.x.subj)||a.i-b.i).map(o=>o.x);
}
/* Suche: passt der Suchtext auf den Titel (dann ganzer Abschnitt) oder auf einzelne Zeilen? */
function formFilter(sections,subj,query){
  const q=(query||'').trim().toLowerCase(),out=[];
  sections.forEach(sec=>{
    if(subj&&subj!=='alle'&&sec.subj!==subj)return;
    if(!q){out.push({sec,rows:sec.rows});return;}
    if(sec.title.toLowerCase().includes(q)){out.push({sec,rows:sec.rows});return;}
    const rows=sec.rows.filter(r=>r.join(' ').toLowerCase().includes(q));
    if(rows.length)out.push({sec,rows});
  });
  return out;
}

/* ── Oberfläche ── */
let formView='tafel',formSubj='alle',formDeck='alle',formSess=null,formQuery='',formData=null;
function formInit(){formData=formLoad();formView='tafel';formSess=null;formQuery='';formRender();}
function formSetView(v){formView=v;formSess=null;formRender();}
function formSetSubj(k){formSubj=k;formRender();}
function formSetDeck(k){formDeck=k;formSess=null;formRender();}
function formSearch(v){formQuery=v;const el=document.getElementById('form-list');if(el)el.innerHTML=formTafelHtml();}
function formStart(){
  const cards=formPickSession(formData,formDeck);
  if(!cards.length){formSess=null;formRender();return;}
  formSess={queue:cards.slice(),total:cards.length,flipped:false,ok:0,retry:{},done:false};formRender();
}
function formFlip(){if(formSess&&!formSess.done){formSess.flipped=!formSess.flipped;formRender();}}
function formAnswer(ok){
  const s=formSess;if(!s||s.done||!s.flipped)return;
  const c=s.queue.shift();
  if(ok){if(!s.retry[c.id])formGrade(formData,c.id,true);s.ok++;}
  else{if(!s.retry[c.id])formGrade(formData,c.id,false);s.retry[c.id]=1;s.queue.push(c);}   // falsche Karte kommt am Ende noch einmal
  formSave(formData);
  s.flipped=false;if(!s.queue.length)s.done=true;
  formRender();
}
function formRender(){
  const root=document.getElementById('form-root');if(!root)return;
  const tabs=`<div class="lrn-tabs"><button class="lrn-tab ${formView==='tafel'?'active':''}" onclick="formSetView('tafel')">📖 Tafelwerk</button><button class="lrn-tab ${formView==='learn'?'active':''}" onclick="formSetView('learn')">🧠 Karteikarten</button></div>`;
  root.innerHTML=tabs+(formView==='tafel'?formTafelPageHtml():formSess?formSessHtml():formLearnHtml());
}
function formDeckChips(){
  return `<div class="lrn-chips" style="margin-bottom:12px"><button type="button" class="lrn-chip ${formDeck==='alle'?'active':''}" onclick="formSetDeck('alle')">Alle (${FORM_CARDS.length})</button>${Object.keys(FORM_DECKS).map(k=>`<button type="button" class="lrn-chip ${formDeck===k?'active':''}" onclick="formSetDeck('${k}')">${FORM_DECKS[k].icon} ${FORM_DECKS[k].name} (${formCardsOf(k).length})</button>`).join('')}</div>`;
}
function formLearnHtml(){
  const st=formStats(formData,formDeck),todo=Math.min(FORM_SESSION,st.due+st.fresh);
  return `<div class="lrn-card">${formDeckChips()}
    <div class="lrn-tiles"><div class="lrn-tile"><b>${st.due}</b><span>fällig</span></div><div class="lrn-tile"><b>${st.fresh}</b><span>neu</span></div><div class="lrn-tile"><b>${st.learned}</b><span>gelernt</span></div><div class="lrn-tile"><b>${st.total}</b><span>Karten</span></div></div>
    <div class="lrn-bar"><div style="width:${st.total?st.learned/st.total*100:0}%"></div></div>
    <div style="margin-top:14px;text-align:center">${todo?`<button class="lrn-btn" onclick="formStart()">▶ Lernrunde starten (${todo} Karten)</button>`:'<div style="font-size:14px;color:var(--text-2)">🎉 Für heute ist alles gelernt. Komm morgen wieder!</div>'}</div></div>
    <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:10px">Richtig gewusst: Die Karte kommt später wieder (1, 3, 7, 14, 30 Tage). Falsch: schon morgen.</div>`;
}
function formSessHtml(){
  const s=formSess;
  if(s.done){
    return `<div class="lrn-card" style="text-align:center"><div style="font-size:44px">🎓</div><div style="font-size:22px;font-weight:800">Runde geschafft!</div>
      <div style="font-size:13px;color:var(--text-2);margin:6px 0 14px">${s.total} Karten durchgearbeitet</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="lrn-btn" onclick="formStart()">Weiter lernen</button><button class="lrn-btn ghost" onclick="formSetView('learn')">Fertig</button></div></div>`;
  }
  const c=s.queue[0],done=s.total-s.queue.length;
  return `<div style="font-size:12px;color:var(--text-3);margin-bottom:6px;display:flex;justify-content:space-between"><span>${FORM_DECKS[c.deck].icon} ${FORM_DECKS[c.deck].name}</span><span>${s.queue.length} übrig</span></div>
    <div class="lrn-bar" style="margin-bottom:10px"><div style="width:${done/s.total*100}%"></div></div>
    <div class="lrn-flash" onclick="formFlip()">${s.flipped
      ?`<div class="lrn-label">${escHtml(c.f)}</div><div class="lrn-big" style="font-size:26px;font-family:'Cambria Math',Georgia,serif">${escHtml(c.b)}</div>`
      :`<div class="lrn-label">Wie lautet die Formel?</div><div class="lrn-big">${escHtml(c.f)}</div><div style="font-size:12px;color:var(--text-3);margin-top:14px">Tippen zum Umdrehen</div>`}</div>
    <div class="lrn-two">${s.flipped?`<button class="lrn-btn bad" onclick="formAnswer(false)">✗ Nicht gewusst</button><button class="lrn-btn good" onclick="formAnswer(true)">✓ Gewusst</button>`:`<button class="lrn-btn" style="grid-column:1/3" onclick="formFlip()">Umdrehen</button>`}</div>`;
}
function formTafelPageHtml(){
  const chips=`<div class="lrn-chips" style="margin-bottom:10px"><button type="button" class="lrn-chip ${formSubj==='alle'?'active':''}" onclick="formSetSubj('alle')">Alles</button>${TAFEL_ORDER.map(k=>`<button type="button" class="lrn-chip ${formSubj===k?'active':''}" onclick="formSetSubj('${k}')">${TAFEL_SUBJ[k].icon} ${TAFEL_SUBJ[k].name}</button>`).join('')}</div>`;
  return `<div class="lrn-card">${chips}<input class="lrn-input" style="width:100%;margin-bottom:12px" placeholder="Im ganzen Tafelwerk suchen (z. B. Kraft, Kreis, pH, Gold, Mars) …" value="${escHtml(formQuery)}" oninput="formSearch(this.value)"><div id="form-list">${formTafelHtml()}</div></div>`;
}
function formTafelHtml(){
  const res=formFilter(formSections(),formSubj,formQuery),searching=!!formQuery.trim();
  if(!res.length)return '<div style="font-size:13px;color:var(--text-3);text-align:center;padding:14px">Nichts gefunden.</div>';
  let lastSubj='';
  return res.map(({sec,rows})=>{
    const head=sec.subj!==lastSubj?`<div class="lrn-label" style="margin:14px 0 6px">${TAFEL_SUBJ[sec.subj].icon} ${TAFEL_SUBJ[sec.subj].name}</div>`:'';lastSubj=sec.subj;
    const th=sec.cols.map(c=>`<th style="text-align:left;padding:6px 8px;border-bottom:1.5px solid var(--divider);color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap">${escHtml(c)}</th>`).join('');
    const body=rows.map(r=>`<tr>${r.map((c,i)=>`<td style="padding:6px 8px;border-bottom:0.5px solid var(--divider);vertical-align:top;${i===r.length-1&&sec.formula?"font-family:'Cambria Math',Georgia,serif;font-weight:700;":''}">${escHtml(c)}</td>`).join('')}</tr>`).join('');
    const link=sec.link?`<div style="margin-top:8px"><button class="lrn-btn" onclick="goTo('${sec.link.app}')">${escHtml(sec.link.label)}</button></div>`:'';
    const note=sec.note?`<div style="font-size:12px;color:var(--text-3);margin-top:8px">${escHtml(sec.note)}</div>`:'';
    return head+`<details ${searching?'open':''} style="background:var(--bg);border:0.5px solid var(--divider);border-radius:12px;padding:8px 12px;margin-bottom:8px"><summary style="cursor:pointer;font-weight:700;font-size:14px;padding:4px 0">${sec.icon} ${escHtml(sec.title)} <span style="font-weight:500;color:var(--text-3);font-size:12px">· ${rows.length}</span></summary><div style="margin-top:8px"><div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>${note}${link}</div></details>`;
  }).join('');
}
