/* ══════════════════════════════════
   SPICKZETTEL – schnell nachschlagen: kurze Beispiele für Python, JavaScript, HTML, CSS, SQL und Git.
   Suche über Titel, Beispiel und Stichwörter, Filter nach Sprache, Favoriten (je Konto gespeichert), Kopieren und – wo es passt –
   „Im Spielplatz öffnen“ (Python, JavaScript, HTML, SQL), dann steht das Beispiel direkt im Code-Spielplatz der Programmierkurse.
══════════════════════════════════ */
const SPICK_KEY='zf_spick';
const SPICK_LANGS=[{id:'python',name:'Python',emoji:'🐍'},{id:'javascript',name:'JavaScript',emoji:'🟨'},{id:'html',name:'HTML',emoji:'🌐'},{id:'css',name:'CSS',emoji:'🎨'},{id:'sql',name:'SQL',emoji:'🗃️'},{id:'git',name:'Git',emoji:'🌿'}];
const SPICK_PLAY={python:'python',javascript:'javascript',html:'html',sql:'sql'};   // Sprachen, die der Spielplatz kann
/* [Sprache, Titel, Beispiel, Stichwörter] */
const SPICK=[
['python','Ausgabe','print("Hallo", "Welt")\nprint(f"Ergebnis: {3 + 4}")','print ausgeben text f-string'],
['python','Eingabe','name = input("Dein Name? ")\nalter = int(input("Alter? "))\nprint(name, alter)','input eingabe lesen int'],
['python','Variablen und Rechnen','x = 7\ny = 2\nprint(x + y, x - y, x * y, x / y, x // y, x % y, x ** y)','plus minus mal geteilt rest potenz modulo'],
['python','Zahlen runden','print(round(3.14159, 2))\nprint(int(3.9))\nprint(abs(-5))','round runden int abs betrag'],
['python','if / elif / else','zahl = 5\nif zahl > 10:\n    print("groß")\nelif zahl > 3:\n    print("mittel")\nelse:\n    print("klein")','bedingung verzweigung wenn'],
['python','Vergleiche und Logik','print(3 == 3, 3 != 4, 3 < 4, 3 >= 4)\nprint(True and False, True or False, not True)','gleich ungleich und oder nicht boolean'],
['python','for-Schleife','for i in range(5):\n    print(i)\nfor wort in ["a", "b"]:\n    print(wort)','schleife wiederholen range'],
['python','range mit Start, Ende, Schritt','print(list(range(2, 10, 2)))\nprint(list(range(5, 0, -1)))','range schritt rückwärts'],
['python','while-Schleife','n = 0\nwhile n < 3:\n    print(n)\n    n += 1','solange schleife endlos break'],
['python','break und continue','for i in range(10):\n    if i == 3:\n        continue\n    if i == 6:\n        break\n    print(i)','abbrechen überspringen schleife'],
['python','Funktion','def addiere(a, b=0):\n    return a + b\n\nprint(addiere(2, 3))\nprint(addiere(5))','def return parameter standardwert'],
['python','Liste','zahlen = [3, 1, 2]\nzahlen.append(4)\nzahlen.remove(1)\nprint(zahlen, len(zahlen), zahlen[0], zahlen[-1])','array append remove len index'],
['python','Liste sortieren','z = [3, 1, 2]\nprint(sorted(z))\nprint(sorted(z, reverse=True))\nz.sort()','sort sorted aufsteigend absteigend'],
['python','Slicing','t = [10, 20, 30, 40, 50]\nprint(t[1:4])\nprint(t[:2])\nprint(t[::-1])','teilliste ausschnitt umdrehen'],
['python','List Comprehension','quadrate = [x * x for x in range(5)]\ngerade = [x for x in range(10) if x % 2 == 0]\nprint(quadrate, gerade)','liste kurz filter'],
['python','Dictionary','tier = {"name": "Rex", "alter": 3}\ntier["farbe"] = "braun"\nfor k, v in tier.items():\n    print(k, v)\nprint(tier.get("x", "fehlt"))','dict schlüssel wert'],
['python','Set (Menge)','a = {1, 2, 3}\nb = {3, 4}\nprint(a | b, a & b, a - b)','menge vereinigung schnitt'],
['python','Tuple','p = (3, 4)\nx, y = p\nprint(x, y)','tupel entpacken'],
['python','Strings bearbeiten','s = "  Hallo Welt  "\nprint(s.strip(), s.upper(), s.lower())\nprint("a,b,c".split(","))\nprint("-".join(["a", "b"]))\nprint("Welt" in s, s.replace("Welt", "du"))','text split join replace upper strip'],
['python','Strings formatieren','name, preis = "Brot", 2.5\nprint(f"{name}: {preis:.2f} Euro")\nprint("{} kostet {}".format(name, preis))','f-string format nachkommastellen'],
['python','Datei lesen und schreiben','with open("test.txt", "w") as f:\n    f.write("Hallo\\n")\nwith open("test.txt") as f:\n    print(f.read())','open with write read datei'],
['python','Fehler abfangen','try:\n    zahl = int("abc")\nexcept ValueError:\n    print("Keine Zahl!")\nfinally:\n    print("fertig")','try except exception fehler'],
['python','Klasse','class Hund:\n    def __init__(self, name):\n        self.name = name\n    def belle(self):\n        print(self.name, "sagt Wuff")\n\nHund("Rex").belle()','class objekt self init methode oop'],
['python','Zufall','import random\nprint(random.randint(1, 6))\nprint(random.choice(["a", "b", "c"]))','random würfel zufall choice'],
['python','enumerate und zip','for i, x in enumerate(["a", "b"]):\n    print(i, x)\nfor a, b in zip([1, 2], ["x", "y"]):\n    print(a, b)','index paarweise'],
['python','map, filter, sum, max, min','z = [3, 1, 2]\nprint(sum(z), max(z), min(z))\nprint(list(map(lambda x: x * 2, z)))\nprint(list(filter(lambda x: x > 1, z)))','lambda summe maximum minimum'],
['javascript','Ausgabe','console.log("Hallo", 1 + 2);\nconsole.log(`Summe: ${1 + 2}`);','console log ausgeben template string'],
['javascript','Variablen','const pi = 3.14;   // bleibt gleich\nlet zaehler = 0;     // darf sich ändern\nzaehler += 1;\nconsole.log(pi, zaehler);','const let var variable konstante'],
['javascript','if / else','const n = 5;\nif (n > 10) {\n  console.log("groß");\n} else if (n > 3) {\n  console.log("mittel");\n} else {\n  console.log("klein");\n}','bedingung verzweigung'],
['javascript','Vergleiche','console.log(3 === 3, 3 !== 4, "3" == 3, "3" === 3);\nconsole.log(true && false, true || false, !true);','gleich === ungleich und oder nicht'],
['javascript','for-Schleife','for (let i = 0; i < 3; i++) {\n  console.log(i);\n}\nfor (const x of ["a", "b"]) {\n  console.log(x);\n}','schleife of wiederholen'],
['javascript','while-Schleife','let n = 0;\nwhile (n < 3) {\n  console.log(n);\n  n++;\n}','solange schleife'],
['javascript','Funktion','function addiere(a, b = 0) {\n  return a + b;\n}\nconst mal = (a, b) => a * b;\nconsole.log(addiere(2, 3), mal(4, 5));','function pfeilfunktion arrow return'],
['javascript','Array','const z = [3, 1, 2];\nz.push(4);\nz.pop();\nconsole.log(z, z.length, z[0], z.at(-1));','liste push pop länge'],
['javascript','Array: map, filter, reduce','const z = [1, 2, 3, 4];\nconsole.log(z.map((x) => x * 2));\nconsole.log(z.filter((x) => x % 2 === 0));\nconsole.log(z.reduce((s, x) => s + x, 0));','umwandeln filtern summe'],
['javascript','Array sortieren','const z = [10, 9, 1];\nz.sort((a, b) => a - b);\nconsole.log(z);','sort zahlen aufsteigend vergleich'],
['javascript','Array durchsuchen','const z = [5, 8, 12];\nconsole.log(z.includes(8), z.indexOf(12), z.find((x) => x > 6));','includes indexOf find suchen'],
['javascript','Objekt','const tier = { name: "Rex", alter: 3 };\ntier.farbe = "braun";\nconsole.log(tier.name, Object.keys(tier));\nfor (const [k, v] of Object.entries(tier)) console.log(k, v);','object schlüssel wert entries'],
['javascript','Destrukturieren und Spread','const [a, b] = [1, 2];\nconst { name } = { name: "Rex" };\nconst z = [...[1, 2], 3];\nconsole.log(a, b, name, z);','spread rest entpacken'],
['javascript','Strings','const s = "  Hallo Welt ";\nconsole.log(s.trim().toUpperCase());\nconsole.log("a,b".split(","), ["a", "b"].join("-"));\nconsole.log(s.includes("Welt"), s.replace("Welt", "du"));','text split join trim replace'],
['javascript','Zahlen','console.log(Math.round(2.5), Math.floor(2.9), Math.max(1, 5), Math.random());\nconsole.log((3.14159).toFixed(2), parseInt("42"), Number("3.5"));','math round floor random toFixed parseInt'],
['javascript','Fehler abfangen','try {\n  JSON.parse("kaputt");\n} catch (e) {\n  console.log("Fehler:", e.message);\n}','try catch error exception'],
['javascript','JSON','const text = JSON.stringify({ a: 1, b: [2, 3] });\nconsole.log(text);\nconsole.log(JSON.parse(text).b[1]);','stringify parse daten'],
['javascript','Klasse','class Hund {\n  constructor(name) {\n    this.name = name;\n  }\n  belle() {\n    console.log(this.name + " sagt Wuff");\n  }\n}\nnew Hund("Rex").belle();','class oop objekt this constructor'],
['javascript','setTimeout und Promise','setTimeout(() => console.log("später"), 100);\nconst warte = (ms) => new Promise((r) => setTimeout(r, ms));\nwarte(50).then(() => console.log("fertig"));','async asynchron verzögerung warten'],
['html','Grundgerüst','<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="UTF-8">\n  <title>Meine Seite</title>\n</head>\n<body>\n  <h1>Hallo</h1>\n</body>\n</html>','gerüst skeleton doctype head body'],
['html','Überschriften und Absätze','<h1>Titel</h1>\n<h2>Untertitel</h2>\n<p>Ein <strong>wichtiger</strong> und ein <em>betonter</em> Text.</p>','h1 p strong em text'],
['html','Link und Bild','<a href="https://example.com">Zur Seite</a>\n<img src="bild.png" alt="Beschreibung" width="200">','a href img src alt'],
['html','Listen','<ul>\n  <li>Apfel</li>\n  <li>Birne</li>\n</ul>\n<ol>\n  <li>Erst</li>\n  <li>Dann</li>\n</ol>','ul ol li aufzählung nummeriert'],
['html','Tabelle','<table>\n  <tr><th>Name</th><th>Alter</th></tr>\n  <tr><td>Anna</td><td>12</td></tr>\n</table>','table tr td th zeile spalte'],
['html','Formular','<form>\n  <label for="n">Name</label>\n  <input id="n" type="text" placeholder="Dein Name">\n  <input type="checkbox" id="c"><label for="c">Ja</label>\n  <select><option>A</option><option>B</option></select>\n  <button type="submit">Senden</button>\n</form>','form input label button select eingabe'],
['html','div, span und Klassen','<div class="karte" id="eins">\n  <span class="rot">Hallo</span>\n</div>','div span class id container'],
['html','Semantische Elemente','<header>Kopf</header>\n<nav>Menü</nav>\n<main>\n  <article>Beitrag</article>\n  <aside>Nebenbei</aside>\n</main>\n<footer>Fuß</footer>','header nav main article footer'],
['html','Button mit JavaScript','<button id="b">Klick</button>\n<p id="t">...</p>\n<script>\n  document.querySelector("#b").addEventListener("click", () => {\n    document.querySelector("#t").textContent = "Geklickt!";\n  });\n</script>','klick ereignis dom script event'],
['html','Elemente finden und ändern (DOM)','<p id="a" class="x">Text</p>\n<script>\n  const p = document.querySelector("#a");\n  p.textContent = "Neu";\n  p.classList.add("fett");\n  p.style.color = "tomato";\n</script>','querySelector textContent classList style dom'],
['html','Elemente erzeugen (DOM)','<ul id="liste"></ul>\n<script>\n  for (const t of ["a", "b", "c"]) {\n    const li = document.createElement("li");\n    li.textContent = t;\n    document.querySelector("#liste").appendChild(li);\n  }\n</script>','createElement appendChild dom liste'],
['css','Selektoren','p { color: navy; }       /* alle p */\n.karte { margin: 8px; }  /* Klasse */\n#kopf { padding: 4px; }  /* ID */\nul li { color: gray; }   /* li in ul */\na:hover { color: red; }  /* Maus drüber */','selector klasse id element hover'],
['css','Farben und Schrift','h1 {\n  color: #3366cc;\n  background-color: rgb(240, 240, 240);\n  font-family: Arial, sans-serif;\n  font-size: 24px;\n  font-weight: bold;\n  text-align: center;\n}','color background font text-align hex rgb'],
['css','Box-Modell','.box {\n  width: 200px;\n  padding: 10px;\n  border: 2px solid black;\n  margin: 20px auto;\n  box-sizing: border-box;\n  border-radius: 8px;\n}','margin padding border width abstand rand'],
['css','Flexbox','.reihe {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 12px;\n}','flex layout zentrieren nebeneinander'],
['css','Grid','.gitter {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 10px;\n}','grid spalten raster layout'],
['css','Zentrieren','.mitte {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}','mitte center zentrieren'],
['css','Positionieren','.eltern { position: relative; }\n.kind {\n  position: absolute;\n  top: 0;\n  right: 0;\n}','position absolute relative fixed top left'],
['css','Übergänge und Animation','.knopf { transition: background 0.3s; }\n.knopf:hover { background: gold; }\n\n@keyframes puls {\n  from { transform: scale(1); }\n  to { transform: scale(1.2); }\n}\n.herz { animation: puls 1s infinite alternate; }','transition animation keyframes hover transform'],
['css','Responsiv (Media Query)','.spalte { width: 50%; }\n@media (max-width: 600px) {\n  .spalte { width: 100%; }\n}','media query handy mobil breite'],
['css','Variablen',':root {\n  --farbe: #6366f1;\n}\n.knopf {\n  background: var(--farbe);\n}','custom properties var root'],
['sql','SELECT','SELECT name, art FROM tiere;\nSELECT * FROM tiere;','abfrage spalten alle'],
['sql','WHERE','SELECT * FROM tiere\nWHERE jahre > 3 AND art = \'Hund\';','filter bedingung and or'],
['sql','ORDER BY und LIMIT','SELECT name, jahre FROM tiere\nORDER BY jahre DESC\nLIMIT 3;','sortieren absteigend begrenzen'],
['sql','LIKE und IN','SELECT * FROM tiere WHERE name LIKE \'M%\';\nSELECT * FROM tiere WHERE art IN (\'Hund\', \'Katze\');','suchmuster beginnt in liste'],
['sql','Zählen und Rechnen','SELECT COUNT(*), AVG(jahre), MAX(gewicht) FROM tiere;','count avg sum min max aggregat'],
['sql','GROUP BY','SELECT art, COUNT(*) AS anzahl\nFROM tiere\nGROUP BY art\nHAVING COUNT(*) > 1;','gruppieren having zählen'],
['sql','JOIN','SELECT t.name, b.name AS besitzer\nFROM tiere t\nJOIN besitzer b ON t.besitzer_id = b.id;','verbinden tabellen inner join on'],
['sql','INSERT','INSERT INTO tiere (name, art, jahre, gewicht, besitzer_id)\nVALUES (\'Pixel\', \'Katze\', 2, 3.5, 1);','einfügen neue zeile'],
['sql','UPDATE','UPDATE tiere SET jahre = jahre + 1 WHERE name = \'Rex\';','ändern aktualisieren where'],
['sql','DELETE','DELETE FROM tiere WHERE jahre > 12;','löschen where vorsicht'],
['sql','Tabelle anlegen','CREATE TABLE spiele (\n  id INTEGER PRIMARY KEY,\n  titel TEXT NOT NULL,\n  punkte INTEGER DEFAULT 0\n);','create table spalten typen primary key'],
['sql','DISTINCT und NULL','SELECT DISTINCT art FROM tiere;\nSELECT * FROM tiere WHERE gewicht IS NULL;','doppelte leer null'],
['git','Neues Repository','git init\ngit status','anfangen init status'],
['git','Änderungen speichern','git add datei.txt\ngit add .\ngit commit -m "Beschreibung"','add commit stage speichern'],
['git','Verlauf ansehen','git log\ngit log --oneline\ngit diff','log verlauf unterschied diff'],
['git','Branch anlegen und wechseln','git branch\ngit switch -c neu\ngit switch main','branch zweig switch checkout'],
['git','Branches zusammenführen','git switch main\ngit merge neu','merge zusammenführen'],
['git','Änderung rückgängig','git restore datei.txt\ngit revert HEAD','restore revert zurück undo'],
['git','Mit GitHub arbeiten','git clone https://github.com/name/projekt.git\ngit pull\ngit push','clone pull push remote online'],
['git','Datei ignorieren','# Datei .gitignore\nnode_modules/\n*.log\n.env','gitignore ignorieren']
];
function spickLoad(){try{const o=JSON.parse(localStorage.getItem(SPICK_KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
function spickAccount(){try{if(typeof zcp==='function'){const n=String(zcp().player||'').trim();if(n)return n.toLowerCase();}}catch(e){}return '_gast';}
/* Favoriten: Liste von Titeln je Konto (nur Titel, die es gibt) */
function spickFavs(){const a=spickLoad()[spickAccount()];return Array.isArray(a)?a.filter(t=>typeof t==='string'&&SPICK.some(e=>e[0]+'|'+e[1]===t)):[];}
function spickToggleFav(id){const all=spickLoad(),k=spickAccount(),cur=spickFavs(),i=cur.indexOf(id);if(i===-1)cur.push(id);else cur.splice(i,1);all[k]=cur;try{localStorage.setItem(SPICK_KEY,JSON.stringify(all));}catch(e){}return i===-1;}
/* Suche: alle Wörter müssen in Sprache, Titel, Beispiel oder Stichwörtern vorkommen */
function spickFilter(q,lang,onlyFav,favs){
  const words=String(q||'').toLowerCase().split(/\s+/).filter(Boolean);
  return SPICK.filter(e=>{
    if(lang&&lang!=='alle'&&e[0]!==lang)return false;
    if(onlyFav&&!(favs||[]).includes(e[0]+'|'+e[1]))return false;
    const hay=(e[0]+' '+e[1]+' '+e[2]+' '+e[3]).toLowerCase();
    return words.every(w=>hay.includes(w));
  });
}
let spickLang='alle',spickFavOnly=false,spickQuery='',spickBuilt=false;
const spickEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function spickInit(){
  const root=document.getElementById('spick-root');if(!root)return;
  if(!spickBuilt){
    spickBuilt=true;
    root.innerHTML='<div class="sp-top"><input id="sp-q" class="sp-q" type="search" placeholder="Suchen: z. B. Schleife, JOIN, flex, branch …" autocomplete="off"><div id="sp-chips" class="sp-chips"></div></div><div id="sp-count" class="sp-count"></div><div id="sp-list"></div>';
    document.getElementById('sp-q').addEventListener('input',e=>{spickQuery=e.target.value;spickRender();});
  }
  spickRender();
}
function spickRender(){
  const favs=spickFavs(),chips=document.getElementById('sp-chips'),list=document.getElementById('sp-list');if(!chips||!list)return;
  const defs=[{id:'alle',name:'Alle',emoji:''}].concat(SPICK_LANGS);
  chips.innerHTML=defs.map(l=>'<button type="button" class="sp-chip'+(spickLang===l.id&&!spickFavOnly?' on':'')+'" data-l="'+l.id+'">'+(l.emoji?l.emoji+' ':'')+l.name+'</button>').join('')+'<button type="button" class="sp-chip'+(spickFavOnly?' on':'')+'" data-fav="1">★ Favoriten ('+favs.length+')</button>';
  chips.querySelectorAll('button').forEach(b=>{b.onclick=()=>{if(b.dataset.fav)spickFavOnly=!spickFavOnly;else{spickLang=b.dataset.l;spickFavOnly=false;}spickRender();};});
  const res=spickFilter(spickQuery,spickLang,spickFavOnly,favs);
  document.getElementById('sp-count').textContent=res.length+' von '+SPICK.length+' Einträgen';
  list.innerHTML=res.length?'':'<div class="sp-empty">Nichts gefunden. Versuch ein anderes Wort.</div>';
  res.forEach(e=>{
    const id=e[0]+'|'+e[1],lang=SPICK_LANGS.find(l=>l.id===e[0]),isFav=favs.includes(id),card=document.createElement('div');card.className='sp-card';
    card.innerHTML='<div class="sp-head"><span class="sp-lang">'+lang.emoji+' '+lang.name+'</span><b class="sp-title"></b><button type="button" class="sp-star'+(isFav?' on':'')+'" title="Favorit" aria-label="Favorit">'+(isFav?'★':'☆')+'</button></div><pre class="sp-code"></pre><div class="sp-actions"><button type="button" class="sp-btn sp-copy">📋 Kopieren</button>'+(SPICK_PLAY[e[0]]?'<button type="button" class="sp-btn sp-play">🧪 Im Spielplatz öffnen</button>':'')+'</div>';
    card.querySelector('.sp-title').textContent=e[1];
    const pre=card.querySelector('.sp-code');pre.innerHTML=window.kursHighlight?window.kursHighlight(e[2],e[0]==='css'?'html':e[0]==='html'?'dom':e[0]):spickEsc(e[2]);
    card.querySelector('.sp-star').onclick=()=>{spickToggleFav(id);spickRender();};
    card.querySelector('.sp-copy').onclick=ev=>{const b=ev.currentTarget;const done=()=>{b.textContent='✅ Kopiert';setTimeout(()=>{b.textContent='📋 Kopieren';},1500);};
      try{navigator.clipboard.writeText(e[2]).then(done,()=>{b.textContent='Markieren und Strg+C';});}catch(x){b.textContent='Markieren und Strg+C';}};
    const pl=card.querySelector('.sp-play');if(pl)pl.onclick=()=>{window.kursPlayPreset={lang:SPICK_PLAY[e[0]],code:e[2]+'\n'};goTo('kurs-play');};
    list.appendChild(card);
  });
}
