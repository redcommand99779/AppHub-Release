/* ══════════════════════════════════
   WÖRTERBUCH – AUTOCOMPLETE
══════════════════════════════════ */
let dictSuggestTimer=null;
let dictSuggestActive=-1;

function dictInputInit(){
  const inp=document.getElementById('dict-input');
  if(!inp||inp._dictInited)return;
  inp._dictInited=true;

  inp.addEventListener('input',()=>{
    clearTimeout(dictSuggestTimer);
    const q=inp.value.trim();
    if(q.length<2){hideSuggestions();return;}
    dictSuggestTimer=setTimeout(()=>fetchSuggestions(q),200);
  });

  inp.addEventListener('keydown',e=>{
    const box=document.getElementById('dict-suggestions');
    const items=box.querySelectorAll('.dict-suggest-item');
    if(e.key==='ArrowDown'){
      e.preventDefault();
      dictSuggestActive=Math.min(dictSuggestActive+1,items.length-1);
      items.forEach((el,i)=>el.classList.toggle('active',i===dictSuggestActive));
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      dictSuggestActive=Math.max(dictSuggestActive-1,-1);
      items.forEach((el,i)=>el.classList.toggle('active',i===dictSuggestActive));
    } else if(e.key==='Enter'){
      if(dictSuggestActive>=0&&items[dictSuggestActive]){
        items[dictSuggestActive].click();
      } else {
        hideSuggestions();
        dictSearch();
      }
    } else if(e.key==='Escape'){
      hideSuggestions();
    }
  });

  // close on outside click
  document.addEventListener('click',e=>{
    if(!e.target.closest('.dict-suggest-wrap'))hideSuggestions();
  });
}

async function fetchSuggestions(q){
  const lang=dictLang==='ende'?'en':'de';
  const wiki=lang==='de'?'de.wiktionary.org':'en.wiktionary.org';
  try{
    const res=await fetch(`https://${wiki}/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`);
    const data=await res.json();
    const suggestions=data[1]||[];
    showSuggestions(suggestions,q);
  }catch(_){hideSuggestions();}
}

function showSuggestions(words,q){
  const box=document.getElementById('dict-suggestions');
  if(!words.length){hideSuggestions();return;}
  dictSuggestActive=-1;
  const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`(${escaped})`,'i');
  box.innerHTML=words.map(w=>{
    const highlighted=escD(w).replace(re,`<b>$1</b>`);
    return `<div class="dict-suggest-item" onclick="pickSuggestion('${escD(w)}')">${highlighted}</div>`;
  }).join('');
  box.classList.add('show');
}

function hideSuggestions(){
  const box=document.getElementById('dict-suggestions');
  if(box){box.classList.remove('show');box.innerHTML='';}
  dictSuggestActive=-1;
}

function pickSuggestion(word){
  document.getElementById('dict-input').value=word;
  hideSuggestions();
  dictSearch();
}
let dictLang='de';
let dictAudioUrl=null;

function setDictLang(l){
  dictLang=l;
  document.getElementById('dlang-de').classList.toggle('active',l==='de');
  document.getElementById('dlang-deen').classList.toggle('active',l==='deen');
  document.getElementById('dlang-ende').classList.toggle('active',l==='ende');
  const ph={'de':'Deutsches Wort eingeben…','deen':'Deutsches Wort eingeben…','ende':'English word…'};
  document.getElementById('dict-input').placeholder=ph[l]||'Wort eingeben…';
  document.getElementById('dict-result-area').innerHTML='<div class="dict-empty">Gib ein Wort ein und drück auf Suchen</div>';
  hideSuggestions();
  document.getElementById('dict-input').value='';
  document.getElementById('dict-input').focus();
}

async function dictSearch(){
  const word=document.getElementById('dict-input').value.trim();
  if(!word)return;
  const area=document.getElementById('dict-result-area');
  area.innerHTML='<div class="dict-loading"><div class="dict-spinner"></div><div style="font-size:13px;color:var(--text-3)">Suche läuft…</div></div>';
  if(dictLang==='de') await searchGerman(word,area);
  else if(dictLang==='deen') await searchTranslation(word,'de','en',area);
  else await searchTranslation(word,'en','de',area);
}

// German monolingual: Wiktionary API
async function searchGerman(word,area){
  try{
    const url=`https://de.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
    const res=await fetch(url);
    if(!res.ok)throw new Error('fail');
    const data=await res.json();
    if(data.error||!data.parse){
      area.innerHTML=`<div class="dict-error-msg">Kein Eintrag für „${escD(word)}" gefunden.</div>`;
      return;
    }
    renderWiktionaryResult(word,data.parse.wikitext['*'],area);
  }catch(e){
    area.innerHTML='<div class="dict-error-msg">Verbindungsfehler – bitte Internetverbindung prüfen.</div>';
  }
}

function renderWiktionaryResult(word,wikitext,area){
  const get=(re,src)=>{const m=(src||wikitext).match(re);return m?m[1]?.trim():null};

  const wortart=get(/\{\{Wortart\|([^|}\n]+)/);
  const genusRaw=get(/\|Genus(?:\s*\d*)?=([mfnu])/)||get(/\|Genus 1=([mfnu])/);
  const genusMap={m:'maskulin (der)',f:'feminin (die)',n:'neutrum (das)',u:'ohne Artikel'};
  const genus=genusRaw?genusMap[genusRaw]||'':'';

  const ipa=get(/\{\{Lautschrift\|([^}]+)\}\}/);

  const silbeBlock=wikitext.match(/\{\{Worttrennung\}\}\s*\n:([^\n]+)/);
  const silben=silbeBlock?silbeBlock[1].replace(/[\[\]]/g,'').replace(/,.*$/,'').trim():'';

  const clean=s=>(s||'').replace(/[\[\]']/g,'').replace(/\{\{[^}]+\}\}/g,'').trim();

  const nomSg=clean(get(/\|Nominativ Singular(?:\s*\d*)?=([^\n|]+)/));
  const nomPl=clean(get(/\|Nominativ Plural(?:\s*\d*)?=([^\n|]+)/));
  const genSg=clean(get(/\|Genitiv Singular(?:\s*\d*)?=([^\n|]+)/));
  const akkSg=clean(get(/\|Akkusativ Singular(?:\s*\d*)?=([^\n|]+)/));
  const datSg=clean(get(/\|Dativ Singular(?:\s*\d*)?=([^\n|]+)/));
  const komp=clean(get(/\|Komparativ(?:\s*\d*)?=([^\n|]+)/));
  const sup=clean(get(/\|Superlativ(?:\s*\d*)?=([^\n|]+)/));
  const praet=clean(get(/\|Präteritum[_ ]ich(?:\s*\d*)?=([^\n|]+)/i));
  const part=clean(get(/\|Partizip II(?:\s*\d*)?=([^\n|]+)/));
  const hilf=clean(get(/\|Hilfsverb(?:\s*\d*)?=([^\n|]+)/));

  // Definitions
  const bedM=wikitext.match(/\{\{Bedeutungen\}\}([\s\S]*?)(?:\{\{[A-ZÄÖÜ]|\n==)/);
  const defs=[];
  if(bedM){
    bedM[1].split('\n').forEach(l=>{
      if(!/^:/.test(l))return;
      let d=l.slice(1)
        .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2')
        .replace(/\{\{[^}]+\}\}/g,'')
        .replace(/<[^>]+>/g,'')
        .replace(/'{2,}/g,'')
        .replace(/^[\d.,;:\[\]\s]+/,'')
        .trim();
      if(d&&d.length>3)defs.push(d);
    });
  }

  // Beispiele
  const bspM=wikitext.match(/\{\{Beispiele\}\}([\s\S]*?)(?:\{\{[A-ZÄÖÜ]|\n==)/);
  const examples=[];
  if(bspM){
    bspM[1].split('\n').forEach(l=>{
      if(!/^:/.test(l))return;
      let ex=l.slice(1)
        .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2')
        .replace(/\{\{[^}]+\}\}/g,'')
        .replace(/<[^>]+>/g,'')
        .replace(/'{2,}/g,'')
        .trim();
      if(ex&&ex.length>5&&examples.length<4)examples.push(ex);
    });
  }

  // Synonyme
  const synM=wikitext.match(/\{\{Synonyme\}\}([\s\S]*?)(?:\{\{[A-ZÄÖÜ]|\n==)/);
  const synonyms=[];
  if(synM){
    synM[1].split('\n').forEach(l=>{
      if(!l.startsWith(':'))return;
      const matches=[...l.matchAll(/\[\[([^\]|]+)\]\]/g)];
      matches.forEach(m=>{if(m[1]&&synonyms.length<8)synonyms.push(m[1].trim())});
    });
  }

  // Rechtschreibung: Korrekte Schreibung
  const rechtM=wikitext.match(/\{\{Alte Rechtschreibung\}\}\s*\n:([^\n]+)/);
  const altSchreib=rechtM?rechtM[1].replace(/[\[\]]/g,'').trim():'';

  let html='<div class="dict-result">';
  html+=`<div class="dict-word">${escD(word)}</div>`;

  // Wortart + Genus badges
  if(wortart||genus){
    html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">';
    if(wortart)html+=`<span class="dict-pos">${escD(wortart)}</span>`;
    if(genus)html+=`<span style="font-size:12px;color:var(--text-2);background:var(--surface);border:0.5px solid var(--divider);border-radius:5px;padding:2px 8px">${escD(genus)}</span>`;
    html+='</div>';
  }

  // IPA
  if(ipa){
    html+=`<div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Aussprache</div>
      <span style="font-family:var(--mono);font-size:15px;color:var(--text)">[${escD(ipa)}]</span>
    </div>`;
  }

  // Silbentrennung
  if(silben){
    html+=`<div style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">Silbentrennung</div>
      <span style="font-size:14px;color:var(--text);font-family:var(--mono)">${escD(silben)}</span>
    </div>`;
  }

  // Alte Rechtschreibung
  if(altSchreib){
    html+=`<div style="margin-bottom:12px;padding:8px 10px;background:rgba(255,204,0,0.08);border:0.5px solid rgba(255,204,0,0.3);border-radius:8px;font-size:12px;color:var(--text-2)">
      Alte Rechtschreibung: <strong>${escD(altSchreib)}</strong>
    </div>`;
  }

  // Grammatik-Tabelle
  const gramRows=[];
  if(nomSg)gramRows.push(['Nominativ Sg.',nomSg]);
  if(genSg) gramRows.push(['Genitiv Sg.',genSg]);
  if(datSg) gramRows.push(['Dativ Sg.',datSg]);
  if(akkSg) gramRows.push(['Akkusativ Sg.',akkSg]);
  if(nomPl) gramRows.push(['Nominativ Pl.',nomPl]);
  if(komp)  gramRows.push(['Komparativ',komp]);
  if(sup)   gramRows.push(['Superlativ',sup]);
  if(praet) gramRows.push(['Präteritum',praet]);
  if(part)  gramRows.push(['Partizip II',part]);
  if(hilf)  gramRows.push(['Hilfsverb',hilf]);

  if(gramRows.length){
    html+='<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Grammatik</div>';
    html+='<div style="background:var(--surface);border:0.5px solid var(--divider);border-radius:8px;overflow:hidden">';
    gramRows.forEach(([lbl,val],i)=>{
      html+=`<div style="display:flex;padding:7px 12px;${i>0?'border-top:0.5px solid var(--divider)':''}">
        <span style="font-size:12px;color:var(--text-3);width:130px;flex-shrink:0">${escD(lbl)}</span>
        <span style="font-size:13px;color:var(--text);font-family:var(--mono)">${escD(val)}</span>
      </div>`;
    });
    html+='</div></div>';
  }

  if(defs.length||gramRows.length)html+='<div class="dict-sep"></div>';

  // Bedeutungen
  if(defs.length){
    html+='<div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Bedeutungen</div>';
    defs.slice(0,6).forEach((d,i)=>{
      html+=`<div class="dict-def"><span class="dict-def-num">${i+1}.</span><span>${escD(d)}</span></div>`;
    });
    html+='<div class="dict-sep"></div>';
  }

  // Beispiele
  if(examples.length){
    html+='<div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Beispiele</div>';
    examples.forEach(ex=>{
      html+=`<div style="font-size:13px;color:var(--text-2);font-style:italic;margin-bottom:6px;line-height:1.4">"${escD(ex)}"</div>`;
    });
    html+='<div class="dict-sep"></div>';
  }

  // Synonyme
  if(synonyms.length){
    html+='<div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Synonyme</div>';
    html+='<div class="dict-trans-list">';
    synonyms.forEach(s=>{html+=`<span class="dict-trans-chip" onclick="dictLookup('${escD(s)}')">${escD(s)}</span>`});
    html+='</div><div class="dict-sep"></div>';
  }

  // Wiktionary-Link
  html+=`<div style="font-size:12px;color:var(--text-3);margin-top:4px">Quelle: <a href="https://de.wiktionary.org/wiki/${encodeURIComponent(word)}" target="_blank" style="color:var(--accent)">de.wiktionary.org →</a></div>`;

  if(!defs.length&&!gramRows.length&&!ipa&&!genus){
    html+='<div style="color:var(--text-3);font-size:13px;margin-top:8px">Wenige strukturierte Daten verfügbar.</div>';
  }

  html+='</div>';
  area.innerHTML=html;
}


// Translation via Wiktionary translation sections (no external API, no CORS issues)
async function searchTranslation(word, fromLang, toLang, area){
  try{
    // Fetch wikitext from the source language wiktionary
    const wiki = fromLang==='de' ? 'de.wiktionary.org' : 'en.wiktionary.org';
    const url=`https://${wiki}/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
    const res=await fetch(url);
    if(!res.ok) throw new Error('fail');
    const data=await res.json();
    if(data.error||!data.parse){
      area.innerHTML=`<div class="dict-error-msg">Kein Eintrag für „${escD(word)}" gefunden.</div>`;
      return;
    }
    const wikitext=data.parse.wikitext['*'];
    renderTranslationResult(word, wikitext, fromLang, toLang, area);
  }catch(e){
    area.innerHTML='<div class="dict-error-msg">Verbindungsfehler – bitte Internetverbindung prüfen.</div>';
  }
}

function renderTranslationResult(word, wikitext, fromLang, toLang, area){
  const flag={'de':'🇩🇪','en':'🇬🇧'};
  const targetLangNames={'en':'Englisch','de':'Deutsch'};

  // Extract translations from wikitext
  // DE wiktionary: {{Ü|en|word}} or {{Üt|en|word|...}}
  // EN wiktionary: look for ==German== or ==English== translation sections
  let translations=[];

  if(fromLang==='de'){
    // German wiktionary → find Übersetzungen section → extract {{Ü|en|...}}
    const uebSection=wikitext.match(/\{\{Übersetzungen\}\}([\s\S]*?)(?:\{\{Abschnitte fehlen|\{\{Referenzen|==\s*\w|\z)/);
    if(uebSection){
      const matches=[...uebSection[1].matchAll(/\{\{[ÜüUu]t?\|en\|([^|}]+)/g)];
      matches.forEach(m=>{
        const t=m[1].trim();
        if(t&&!translations.includes(t))translations.push(t);
      });
    }
    // Also try {{Ü?|en| pattern broadly
    if(!translations.length){
      const broad=[...wikitext.matchAll(/\{\{[ÜüUu]t?\|en\|([^|})\n]+)/g)];
      broad.forEach(m=>{const t=m[1].trim();if(t&&!translations.includes(t))translations.push(t);});
    }
  } else {
    // English wiktionary → find German in translations
    // Pattern: {{t|de|word}} or {{t+|de|word}}
    const matches=[...wikitext.matchAll(/\{\{t[+*]?\|de\|([^|})\n]+)/g)];
    matches.forEach(m=>{const t=m[1].trim();if(t&&!translations.includes(t))translations.push(t);});

    // Also try simple German: header approach
    if(!translations.length){
      const deSection=wikitext.match(/German:\s*([^\n]+)/);
      if(deSection){
        const words=deSection[1].match(/\[\[([^\]]+)\]\]/g)||[];
        words.forEach(w=>{translations.push(w.replace(/\[\[|\]\]/g,'').split('|').pop());});
      }
    }
  }

  translations=translations.slice(0,8);

  // Also extract a short definition of the source word for context
  const defs=[];
  if(fromLang==='de'){
    const bedM=wikitext.match(/\{\{Bedeutungen\}\}([\s\S]*?)(?:\{\{[A-ZÄÖÜ]|\n==)/);
    if(bedM){
      bedM[1].split('\n').forEach(l=>{
        if(!/^:/.test(l))return;
        let d=l.slice(1).replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2').replace(/\{\{[^}]+\}\}/g,'').replace(/<[^>]+>/g,'').replace(/'{2,}/g,'').replace(/^[\d.,;:\[\]\s]+/,'').trim();
        if(d&&d.length>3&&defs.length<2)defs.push(d);
      });
    }
  } else {
    const defM=wikitext.match(/#\s([^#\n:*][^\n]+)/g);
    if(defM) defM.slice(0,2).forEach(l=>{
      let d=l.replace(/^#\s*/,'').replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g,'$2').replace(/\{\{[^}]+\}\}/g,'').replace(/<[^>]+>/g,'').trim();
      if(d.length>3)defs.push(d);
    });
  }

  // IPA of source word
  const ipa = fromLang==='de'
    ? (wikitext.match(/\{\{Lautschrift\|([^}]+)\}\}/)||[])[1]||''
    : (wikitext.match(/IPA[^/]*\/([^/]+)\//)||[])[1]||'';

  let html='<div class="dict-result">';
  html+=`<div class="dict-word">${flag[fromLang]||''} ${escD(word)}</div>`;
  if(ipa) html+=`<div style="font-family:var(--mono);font-size:13px;color:var(--text-3);margin-bottom:10px">[${escD(ipa)}]</div>`;

  if(defs.length){
    html+=`<div style="margin-bottom:14px">`;
    defs.forEach(d=>{ html+=`<div style="font-size:13px;color:var(--text-2);line-height:1.5;margin-bottom:4px">${escD(d)}</div>`; });
    html+=`</div>`;
  }

  html+=`<div class="dict-sep"></div>`;
  html+=`<div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">${targetLangNames[toLang]||toLang}</div>`;

  if(translations.length){
    html+=`<div class="dict-trans-list" style="margin-bottom:16px">`;
    translations.forEach(t=>{
      html+=`<span class="dict-trans-chip" onclick="dictLookupLang('${escD(t)}','${toLang}','${fromLang}')">${escD(t)}</span>`;
    });
    html+=`</div>`;
  } else {
    html+=`<div style="color:var(--text-3);font-size:13px;margin-bottom:12px">Keine Übersetzung gefunden. `;
    html+=`<a href="https://${fromLang==='de'?'de':'en'}.wiktionary.org/wiki/${encodeURIComponent(word)}" target="_blank" style="color:var(--accent)">Auf Wiktionary ansehen →</a></div>`;
  }

  html+=`<div class="dict-sep"></div>`;
  html+=`<div style="font-size:12px;color:var(--text-3)">Quelle: <a href="https://${fromLang==='de'?'de':'en'}.wiktionary.org/wiki/${encodeURIComponent(word)}" target="_blank" style="color:var(--accent)">${fromLang==='de'?'de':'en'}.wiktionary.org →</a></div>`;
  html+=`</div>`;
  area.innerHTML=html;
}

function playAudio(url){
  if(!url)return;
  new Audio(url.startsWith('//')?'https:'+url:url).play().catch(()=>{});
}

function dictLookup(word){
  document.getElementById('dict-input').value=word;
  dictSearch();
}
function dictLookupLang(word,fromLang,toLang){
  const modeMap={de_en:'deen',en_de:'ende'};
  const key=fromLang+'_'+toLang;
  if(modeMap[key])setDictLang(modeMap[key]);
  document.getElementById('dict-input').value=word;
  dictSearch();
}

