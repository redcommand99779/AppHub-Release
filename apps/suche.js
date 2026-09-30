/* ══════════════════════════════════
   INHALTS-SUCHE – ergänzt die Befehlspalette (Strg+K, sidebar.js) um Inhalte aus den Apps: Zeilen und Formeln aus dem Tafelwerk,
   Elemente, Länder mit Hauptstädten, Flüsse, Seen, Meere, Berge und Inseln sowie die eigenen Vokabeln, Notizen und Aufgaben.
   srcContent(text) liefert fertige Treffer { g: Gruppe, ico, label, sub, run } – ein Klick springt direkt zum Inhalt.
   Gesucht wird ohne Rücksicht auf Groß-/Kleinschreibung und Umlaute (ä = a = ae), Tief-/Hochzahlen zählen als Ziffern (H2SO4 = H₂SO₄),
   bei mehreren Wörtern müssen alle vorkommen. Die festen Daten werden einmal indiziert, persönliche Daten bei jeder Suche frisch gelesen.
══════════════════════════════════ */
const SRC_PER_GROUP=6,SRC_TOTAL=30,SRC_MIN=2;
const SRC_SUB={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','−':'-','·':' ','π':'pi'};
function srcNorm(s){
  return String(s==null?'':s).toLowerCase().replace(/[₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁻−·π]/g,c=>SRC_SUB[c]||c).normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/ß/g,'ss').replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u').replace(/\s+/g,' ').trim();
}
/* Trefferwert eines Eintrags: 100 = genau, 80 = fängt an, 65 = ein Wort fängt an, 50 = kommt im Namen vor, 21–45 = mehrere Suchwörter
   (je Wort: ganzes Wort im Namen zählt am meisten, dann Wortanfang, dann irgendwo im Namen, dann Wortanfang im Zusatztext, dann irgendwo im Zusatztext),
   0 = nicht gefunden. Einzelne Buchstaben zählen nur am Wortanfang, damit „vitamin c“ nicht alles findet, in dem irgendwo ein c steht. */
function srcWords(t){return t.split(/[^a-z0-9]+/).filter(Boolean);}
function srcScore(it,q,toks){
  const l=it.l,kw=it.k||'',lw=it.lw||(it.lw=srcWords(l)),kwd=it.kwd||(it.kwd=srcWords(kw));
  const tokScore=t=>{
    if(lw.includes(t))return 5;                       // ganzes Wort im Namen
    if(lw.some(w=>w.startsWith(t)))return 4;
    if(t.length>1&&l.includes(t))return 3;
    if(kwd.some(w=>w.startsWith(t)))return 2;
    if(t.length>1&&kw.includes(t))return 1;
    return 0;
  };
  const sc=toks.map(tokScore);if(sc.some(x=>x===0))return 0;
  if(l===q)return 100;if(l.startsWith(q))return 80;
  if(toks.length===1){if(lw.some(w=>w.startsWith(q)))return 65;if(l.includes(q))return 50;return 20+sc[0]*3;}
  if(l.includes(q))return 50;
  return 20+Math.round(sc.reduce((a,b)=>a+b,0)/(5*toks.length)*24);
}
let srcIndex=null;
function srcRunTafel(q){return ()=>{goTo('formeln');if(typeof formOpenSearch==='function')formOpenSearch(q);};}
function srcBuild(){
  const out=[];
  const push=(g,ico,label,sub,kw,mk)=>out.push({g,ico,label,sub,l:srcNorm(label),k:srcNorm(kw||''),mk});
  /* Tafelwerk: jede Tabellenzeile, dazu alle Formeln */
  if(typeof formSections==='function'){
    formSections().forEach(sec=>{
      const subj=(typeof TAFEL_SUBJ!=='undefined'&&TAFEL_SUBJ[sec.subj])?TAFEL_SUBJ[sec.subj].name:'';
      sec.rows.forEach(r=>{
        const cut=t=>String(t).length>72?String(t).slice(0,70).replace(/\s+\S*$/,'')+' …':String(t);
        const label=r.length>1&&r[1]?r[0]+' – '+cut(r[1]):r[0];
        push('Tafelwerk',sec.icon,label,(sec.formula?'Formel':sec.title)+' · '+subj,r.join(' ')+' '+sec.title+' '+subj,q=>srcRunTafel(q));
      });
    });
  }
  /* Elemente */
  if(typeof PT_EL!=='undefined'){
    PT_EL.forEach(e=>push('Elemente','🧪',e.name+' ('+e.sym+')','Element Nr. '+e.z+' · '+e.mass+' u',e.sym+' '+e.z+' '+(PT_CATS[e.cat]?PT_CATS[e.cat].name:'')+' '+e.state+' periodensystem',()=>()=>{goTo('periodensystem');ptSetView('table');ptSelect(e.z);}));
  }
  /* Länder, Hauptstädte, Flüsse, Seen, Meere, Berge, Inseln */
  if(typeof GEO_LAND!=='undefined'){
    GEO_LAND.forEach(c=>{
      push('Länder & Orte','🌍',c.name,'Land'+(c.capital?' · Hauptstadt '+c.capital:'')+' · '+c.cont,c.capital+' '+c.cont+' '+c.iso+' land staat',()=>()=>{goTo('georaetsel');geoExplore(c);});
      if(c.capital)push('Länder & Orte','🏛',c.capital,'Hauptstadt von '+c.name,c.name+' hauptstadt',()=>()=>{goTo('georaetsel');geoExplore(c);});
    });
  }
  if(typeof GEO_FEAT!=='undefined'){
    const T={fluss:['🏞','Fluss'],see:['🏞','See'],meer:['🌊','Meer'],berg:['⛰','Berg'],insel:['🏝','Insel']};
    GEO_FEAT.forEach(f=>{
      const t=T[f.type]||['📍',''],det=f.height?' · '+f.height.toLocaleString('de-DE')+' m':f.area?' · '+f.area.toLocaleString('de-DE')+' km²':'';
      push('Länder & Orte',t[0],f.name,t[1]+det+(f.cont?' · '+f.cont:''),t[1]+' '+f.cont+' '+f.art,()=>()=>{goTo('georaetsel');geoExplore(f);});
    });
  }
  return out;
}
/* Persönliche Daten: Vokabeln, Notizen, Aufgaben (bei jeder Suche frisch aus dem Speicher) */
function srcPersonal(q){
  const out=[],ls=k=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}};
  const push=(g,ico,label,sub,kw,run)=>out.push({g,ico,label,sub,l:srcNorm(label),k:srcNorm(kw||''),run});
  const v=ls('zf_vok2');
  if(v&&Array.isArray(v.decks))v.decks.forEach(d=>(d.cards||[]).forEach(c=>{if(c&&c.f)push('Vokabeln','📖',c.f+' → '+c.b,'Stapel „'+(d.name||'')+'“',c.f+' '+c.b,()=>{goTo('vokabeln');if(typeof vokSetView==='function'){vokSetView('cards');vokQuery=q;vokRender();}});}));
  const n=ls('zf_notes');
  if(Array.isArray(n))n.forEach(x=>{if(!x||typeof x!=='object')return;const title=String(x.title||'').trim()||String(x.body||'').split('\n')[0].slice(0,50)||'(ohne Titel)';push('Notizen','📝',title,'Notiz'+(x.cat?' · '+x.cat:''),String(x.body||'')+' '+(x.cat||''),()=>{goTo('notizen');if(typeof noteOpen==='function')noteOpen(x.id);});});
  const t=ls('zf_todos');
  if(Array.isArray(t))t.forEach(x=>{if(!x||typeof x.text!=='string')return;push('Aufgaben','✅',x.text,'To-Do'+(x.done?' · erledigt':'')+(x.due?' · fällig '+x.due:''),(Array.isArray(x.sub)?x.sub.map(s=>s&&s.t).join(' '):'')+' '+(x.cat||''),()=>goTo('todo'));});
  return out;
}
/* Treffer für den Suchtext; leer, wenn der Text zu kurz ist */
function srcContent(text){
  const raw=String(text||'').trim(),q=srcNorm(raw);
  if(q.length<SRC_MIN)return [];
  if(!srcIndex)srcIndex=srcBuild();
  const toks=q.split(' ').filter(Boolean),scored=[];
  srcIndex.forEach(it=>{const s=srcScore(it,q,toks);if(s>0)scored.push({it,s,run:it.mk(raw)});});
  srcPersonal(raw).forEach(it=>{const s=srcScore(it,q,toks);if(s>0)scored.push({it,s:s+2,run:it.run});});   // eigene Inhalte leicht bevorzugen
  scored.sort((a,b)=>b.s-a.s||a.it.label.length-b.it.label.length);
  const per={},out=[];
  const seen=new Set();
  for(const o of scored){
    const key=o.it.g+'|'+o.it.l;if(seen.has(key))continue;seen.add(key);
    if((per[o.it.g]||0)>=SRC_PER_GROUP)continue;
    per[o.it.g]=(per[o.it.g]||0)+1;out.push({g:o.it.g,ico:o.it.ico,label:o.it.label,sub:o.it.sub,run:o.run,s:o.s});
    if(out.length>=SRC_TOTAL)break;
  }
  // Gruppen so ordnen, wie ihr bester Treffer liegt
  const order=[];out.forEach(x=>{if(!order.includes(x.g))order.push(x.g);});
  return order.flatMap(g=>out.filter(x=>x.g===g));
}
