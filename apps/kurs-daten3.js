/* ══════════════════════════════════
   PROGRAMMIERKURSE – weitere JavaScript-Kurse: „JavaScript für Fortgeschrittene“ (13 Lektionen, laufen wie der Einsteigerkurs im Worker)
   und „JavaScript im Browser“ (8 Lektionen, laufen in einer abgeschotteten Seite; geprüft wird die Seite nach dem Ausführen).
   Bei den Browser-Lektionen bekommt check({ code, doc, logs }): doc ist die Seite nach dem Skript (Textkopie), logs die console-Ausgaben.
   Das Feld after enthält Code, den die Prüfung nach dem Laden auf der Seite ausführt (z. B. einen Klick auslösen).
══════════════════════════════════ */
(() => {
const { c, ex, tip, warn, expectOutput, txt } = window.KURS_HELP;

/* ====================================================================== */
/*  JavaScript 2 – Fortgeschritten                                          */
/* ====================================================================== */
window.KURS_COURSES.push({
  id: "js2",
  lang: "javascript",
  langLabel: "JavaScript",
  emoji: "🚀",
  title: "JavaScript für Fortgeschrittene",
  desc: "Destructuring, reduce, Klassen, Closures, JSON, Map und Set, Fehlerbehandlung und reguläre Ausdrücke. Baut auf dem Einsteigerkurs auf.",
  lessons: [
    {
      title: "Destructuring und Spread",
      content: `
        <p>Mit <b>Destructuring</b> („Auspacken“) holst du Werte aus Arrays und Objekten in einzelne Variablen, in einer Zeile statt vieler.</p>
        ${ex('const farben = ["rot", "grün", "blau"];\nconst [erste, zweite] = farben;     // erste = "rot", zweite = "grün"\n\nconst person = { name: "Mia", alter: 12 };\nconst { name, alter } = person;      // name = "Mia", alter = 12\nconsole.log(name, alter);')}
        <p>Die drei Punkte ${c("...")} haben zwei Gesichter:</p>
        <ul>
          <li><b>Rest</b> beim Auspacken: ${c("const [erste, ...rest] = farben;")} sammelt alles Übrige in einem Array.</li>
          <li><b>Spread</b> beim Zusammenbauen: ${c("[...a, ...b]")} und ${c("{ ...x, ...y }")} kopieren Elemente in ein neues Array bzw. Objekt.</li>
        </ul>
        ${ex("const a = [1, 2];\nconst b = [...a, 3];        // [1, 2, 3], a bleibt unverändert\nconst o = { x: 1 };\nconst p = { ...o, y: 2 };   // { x: 1, y: 2 }")}`,
      task: "Packe aus <code>person</code> die Eigenschaften <code>name</code> und <code>stadt</code> aus und gib <code>Mia aus Wien</code> aus. Packe aus <code>farben</code> die erste Farbe aus und den Rest mit <code>...</code>. Gib <code>rot</code> und <code>grün,blau</code> aus.",
      starter: 'const person = { name: "Mia", alter: 12, stadt: "Wien" };\nconst farben = ["rot", "grün", "blau"];\n\n',
      hint: 'const { name, stadt } = person;\nconst [erste, ...rest] = farben;\nconsole.log(`${name} aus ${stadt}`);\nconsole.log(erste);\nconsole.log(rest.join(","));',
      solution: 'const person = { name: "Mia", alter: 12, stadt: "Wien" };\nconst farben = ["rot", "grün", "blau"];\nconst { name, stadt } = person;\nconst [erste, ...rest] = farben;\nconsole.log(`${name} aus ${stadt}`);\nconsole.log(erste);\nconsole.log(rest.join(","));',
      check: ({ output, code }) => {
        if (!/const\s*\{/.test(code)) return "Packe das Objekt mit const { ... } = person aus.";
        if (!/\.\.\.\s*\w+\s*\]\s*=/.test(code)) return "Sammle den Rest mit const [erste, ...rest] = farben.";
        return expectOutput(output, ["Mia aus Wien", "rot", "grün,blau"]);
      },
    },
    {
      title: "reduce: Werte zusammenfassen",
      content: `
        <p>${c("reduce")} fasst ein ganzes Array zu <b>einem einzigen Wert</b> zusammen: zu einer Summe, einem Maximum, einem Objekt … Du gibst eine Funktion mit zwei Parametern und einen <b>Startwert</b> an.</p>
        ${ex("const zahlen = [1, 2, 3, 4];\nconst summe = zahlen.reduce((summe, x) => summe + x, 0);\nconsole.log(summe);   // 10")}
        <p>So läuft es ab: ${c("summe")} startet bei 0. Bei jedem Element berechnet die Funktion den <b>neuen</b> Wert von ${c("summe")} (alt + Element), und das Ergebnis wird beim nächsten Element wieder als ${c("summe")} übergeben. Am Ende kommt der letzte Wert heraus.</p>
        ${ex("const groesste = zahlen.reduce((max, x) => (x > max ? x : max), zahlen[0]);\nconsole.log(groesste);   // 4")}
        ${tip("Der Startwert steht <b>nach</b> der Funktion. Lässt du ihn weg, nimmt reduce das erste Element als Start, das klappt aber nicht bei leeren Arrays.")}`,
      task: "Berechne mit <code>reduce</code> die Summe aller <code>preise</code> und danach den größten Preis (ohne <code>Math.max</code>). Erwartet: <code>10</code> und <code>4.5</code>.",
      starter: "const preise = [4.5, 2, 3.5];\n\n",
      hint: "const summe = preise.reduce((s, p) => s + p, 0);\nconst teuerster = preise.reduce((m, p) => (p > m ? p : m), preise[0]);",
      solution: "const preise = [4.5, 2, 3.5];\nconst summe = preise.reduce((s, p) => s + p, 0);\nconst teuerster = preise.reduce((m, p) => (p > m ? p : m), preise[0]);\nconsole.log(summe);\nconsole.log(teuerster);",
      check: ({ output, code }) => {
        if (!code.includes("reduce")) return "Benutze reduce().";
        if (code.includes("Math.max")) return "Benutze Math.max nicht, sondern reduce.";
        return expectOutput(output, ["10", "4.5"]);
      },
    },
    {
      title: "find, some, every",
      content: `
        <p>Arrays aus Objekten sind in JavaScript allgegenwärtig. Dafür gibt es Methoden, die Fragen beantworten, jeweils mit einer Funktion, die ${c("true")} oder ${c("false")} liefert:</p>
        <ul>
          <li>${c("find")}: das <b>erste</b> passende Element (oder ${c("undefined")}).</li>
          <li>${c("some")}: gibt es <b>mindestens eines</b>, das passt? (true/false)</li>
          <li>${c("every")}: passen <b>alle</b>? (true/false)</li>
          <li>${c("findIndex")}: die Position des ersten passenden (oder -1).</li>
        </ul>
        ${ex('const tiere = [{ name: "Rex", beine: 4 }, { name: "Piep", beine: 2 }];\nconsole.log(tiere.find((t) => t.beine === 2).name);   // Piep\nconsole.log(tiere.some((t) => t.beine > 3));          // true\nconsole.log(tiere.every((t) => t.beine > 3));         // false')}`,
      task: "Gib den <code>name</code> des ersten Nutzers aus, der mindestens 18 ist (<code>find</code>), dann ob <b>jemand</b> älter als 25 ist (<code>some</code>) und ob <b>alle</b> mindestens 18 sind (<code>every</code>). Erwartet: <code>Ben</code>, <code>true</code>, <code>false</code>.",
      starter: 'const nutzer = [{ name: "Mia", alter: 12 }, { name: "Ben", alter: 18 }, { name: "Zoe", alter: 30 }];\n\n',
      hint: "console.log(nutzer.find((n) => n.alter >= 18).name);\nconsole.log(nutzer.some((n) => n.alter > 25));\nconsole.log(nutzer.every((n) => n.alter >= 18));",
      solution: 'const nutzer = [{ name: "Mia", alter: 12 }, { name: "Ben", alter: 18 }, { name: "Zoe", alter: 30 }];\nconsole.log(nutzer.find((n) => n.alter >= 18).name);\nconsole.log(nutzer.some((n) => n.alter > 25));\nconsole.log(nutzer.every((n) => n.alter >= 18));',
      check: ({ output, code }) => {
        if (!/find\s*\(/.test(code) || !/some\s*\(/.test(code) || !/every\s*\(/.test(code)) return "Benutze find, some und every.";
        return expectOutput(output, ["Ben", "true", "false"]);
      },
    },
    {
      title: "Sortieren",
      content: `
        <p>${c("sort()")} sortiert ein Array <b>direkt</b> (es verändert das Original). Aber Vorsicht: Ohne Hilfe sortiert es alles als <b>Text</b>!</p>
        ${ex("console.log([10, 9, 100, 25].sort());   // [10, 100, 25, 9]  (als Text sortiert!)")}
        <p>Für Zahlen gibst du eine <b>Vergleichsfunktion</b> mit zwei Parametern. Sie liefert eine negative Zahl, wenn ${c("a")} vor ${c("b")} kommen soll, eine positive, wenn danach:</p>
        ${ex("const zahlen = [10, 9, 100, 25];\nzahlen.sort((a, b) => a - b);   // aufsteigend\nconsole.log(zahlen);            // [9, 10, 25, 100]\n// absteigend: (a, b) => b - a")}
        <p>Genauso sortierst du nach jeder Eigenschaft, zum Beispiel nach der Länge von Wörtern: ${c("(a, b) => a.length - b.length")}.</p>
        ${warn("<code>sort()</code> verändert das Array. Willst du das Original behalten, kopiere es vorher: <code>[...zahlen].sort(...)</code>.")}`,
      task: "Sortiere <code>zahlen</code> aufsteigend und gib sie mit <code>join(\",\")</code> aus (<code>9,10,25,100</code>). Sortiere dann <code>namen</code> nach der Länge und gib sie ebenso aus (<code>Max,Anna,Elisabeth</code>).",
      starter: 'const zahlen = [10, 9, 100, 25];\nconst namen = ["Anna", "Max", "Elisabeth"];\n\n',
      hint: 'zahlen.sort((a, b) => a - b);\nnamen.sort((a, b) => a.length - b.length);\nconsole.log(zahlen.join(","));\nconsole.log(namen.join(","));',
      solution: 'const zahlen = [10, 9, 100, 25];\nconst namen = ["Anna", "Max", "Elisabeth"];\nzahlen.sort((a, b) => a - b);\nnamen.sort((a, b) => a.length - b.length);\nconsole.log(zahlen.join(","));\nconsole.log(namen.join(","));',
      check: ({ output, code }) => {
        if (!/sort\s*\(\s*\(?\s*\w+\s*,\s*\w+\s*\)?\s*=>/.test(code)) return "Gib sort() eine Vergleichsfunktion mit zwei Parametern, z. B. (a, b) => a - b.";
        return expectOutput(output, ["9,10,25,100", "Max,Anna,Elisabeth"]);
      },
    },
    {
      title: "Objekte durchgehen",
      content: `
        <p>Um die Inhalte eines Objekts zu durchlaufen, wandelst du es in ein Array um:</p>
        <ul>
          <li>${c("Object.keys(obj)")}: alle <b>Namen</b> der Eigenschaften.</li>
          <li>${c("Object.values(obj)")}: alle <b>Werte</b>.</li>
          <li>${c("Object.entries(obj)")}: alle <b>Paare</b> als <code>[name, wert]</code>.</li>
        </ul>
        ${ex('const noten = { mathe: 2, sport: 1 };\nconsole.log(Object.values(noten));   // [2, 1]\nfor (const [fach, note] of Object.entries(noten)) {\n  console.log(`${fach}: ${note}`);\n}')}
        <p>Die Schreibweise ${c("const [fach, note] of ...")} packt jedes Paar sofort aus (Destructuring aus der ersten Lektion).</p>`,
      task: "Gib die <b>Summe</b> aller Werte von <code>preise</code> aus (<code>6</code>), danach für jedes Paar eine Zeile im Format <code>apfel: 2</code>.",
      starter: "const preise = { apfel: 2, brot: 3, milch: 1 };\n\n",
      hint: "const summe = Object.values(preise).reduce((s, p) => s + p, 0);\nfor (const [name, preis] of Object.entries(preise)) {\n  console.log(`${name}: ${preis}`);\n}",
      solution: "const preise = { apfel: 2, brot: 3, milch: 1 };\nconst summe = Object.values(preise).reduce((s, p) => s + p, 0);\nconsole.log(summe);\nfor (const [name, preis] of Object.entries(preise)) {\n  console.log(`${name}: ${preis}`);\n}",
      check: ({ output, code }) => {
        if (!code.includes("Object.")) return "Benutze Object.values und Object.entries.";
        return expectOutput(output, ["6", "apfel: 2", "brot: 3", "milch: 1"]);
      },
    },
    {
      title: "Klassen",
      content: `
        <p>Eine <b>Klasse</b> ist ein Bauplan für Objekte, die Daten und Verhalten zusammenfassen:</p>
        ${ex('class Konto {\n  constructor(guthaben) {\n    this.guthaben = guthaben;\n  }\n  einzahlen(betrag) {\n    this.guthaben += betrag;\n  }\n}\n\nconst k = new Konto(100);\nk.einzahlen(50);\nconsole.log(k.guthaben);   // 150')}
        <ul>
          <li>${c("constructor")} läuft beim Erzeugen mit ${c("new")} und legt die Startwerte an.</li>
          <li>${c("this")} ist „dieses Objekt“. Damit greifst du auf seine Eigenschaften zu.</li>
          <li>Funktionen in der Klasse heißen <b>Methoden</b>. Man schreibt sie ohne das Wort <code>function</code>.</li>
        </ul>
        ${warn("Ohne <code>this.</code> wäre <code>guthaben</code> in einer Methode nur eine fremde, nicht vorhandene Variable.")}`,
      task: "Ergänze in <code>Konto</code> die Methode <code>abheben(betrag)</code>: Reicht das Guthaben, ziehe ab und gib <code>true</code> zurück, sonst <code>false</code> (ohne etwas abzuziehen). Erwartet: <code>120</code> und <code>false</code>.",
      starter: "class Konto {\n  constructor(guthaben) {\n    this.guthaben = guthaben;\n  }\n  einzahlen(betrag) {\n    this.guthaben += betrag;\n  }\n  // abheben(betrag) { ... }\n}\n\nconst k = new Konto(100);\nk.einzahlen(50);\nk.abheben(30);\nconsole.log(k.guthaben);\nconsole.log(k.abheben(500));\n",
      hint: "abheben(betrag) {\n  if (betrag > this.guthaben) {\n    return false;\n  }\n  this.guthaben -= betrag;\n  return true;\n}",
      solution: "class Konto {\n  constructor(guthaben) {\n    this.guthaben = guthaben;\n  }\n  einzahlen(betrag) {\n    this.guthaben += betrag;\n  }\n  abheben(betrag) {\n    if (betrag > this.guthaben) {\n      return false;\n    }\n    this.guthaben -= betrag;\n    return true;\n  }\n}\n\nconst k = new Konto(100);\nk.einzahlen(50);\nk.abheben(30);\nconsole.log(k.guthaben);\nconsole.log(k.abheben(500));",
      check: ({ output, code }) => {
        if (!/abheben\s*\(\s*betrag\s*\)\s*\{/.test(code)) return "Ergänze die Methode abheben(betrag) in der Klasse.";
        return expectOutput(output, ["120", "false"]);
      },
    },
    {
      title: "Vererbung",
      content: `
        <p>Mit ${c("extends")} baust du eine Klasse auf einer anderen auf. Die neue Klasse (Unterklasse) <b>erbt</b> alle Eigenschaften und Methoden und kann eigene dazu bekommen oder alte überschreiben.</p>
        ${ex('class Tier {\n  constructor(name) {\n    this.name = name;\n  }\n  info() {\n    return `${this.name} ist ein Tier`;\n  }\n}\n\nclass Hund extends Tier {\n  constructor(name) {\n    super(name);          // ruft den Konstruktor von Tier auf\n  }\n  sprich() {\n    return `${this.name} sagt Wuff`;\n  }\n}\n\nconst h = new Hund("Rex");\nconsole.log(h.info());    // Rex ist ein Tier\nconsole.log(h.sprich());  // Rex sagt Wuff')}
        <p>${c("super(name)")} muss in einem Konstruktor der Unterklasse <b>zuerst</b> stehen, bevor du ${c("this")} benutzt. Die Unterklasse hat ${c("info()")} geerbt, ohne es selbst zu schreiben.</p>`,
      task: "Schreibe die Klasse <code>Katze</code>, die <code>Tier</code> erweitert (<code>extends</code>, <code>super(name)</code>) und eine Methode <code>sprich()</code> hat, die <code>Tom sagt Miau</code> zurückgibt. Erwartet: <code>Tom ist ein Tier</code> und <code>Tom sagt Miau</code>.",
      starter: 'class Tier {\n  constructor(name) {\n    this.name = name;\n  }\n  info() {\n    return `${this.name} ist ein Tier`;\n  }\n}\n\n// class Katze extends Tier { ... }\n\nconst k = new Katze("Tom");\nconsole.log(k.info());\nconsole.log(k.sprich());\n',
      hint: "class Katze extends Tier {\n  constructor(name) {\n    super(name);\n  }\n  sprich() {\n    return `${this.name} sagt Miau`;\n  }\n}",
      solution: 'class Tier {\n  constructor(name) {\n    this.name = name;\n  }\n  info() {\n    return `${this.name} ist ein Tier`;\n  }\n}\n\nclass Katze extends Tier {\n  constructor(name) {\n    super(name);\n  }\n  sprich() {\n    return `${this.name} sagt Miau`;\n  }\n}\n\nconst k = new Katze("Tom");\nconsole.log(k.info());\nconsole.log(k.sprich());',
      check: ({ output, code }) => {
        if (!/class\s+Katze\s+extends\s+Tier/.test(code) || !code.includes("super(")) return "Schreibe class Katze extends Tier und rufe super(name) auf.";
        return expectOutput(output, ["Tom ist ein Tier", "Tom sagt Miau"]);
      },
    },
    {
      title: "Closures",
      content: `
        <p>Eine Funktion kann Variablen aus ihrer <b>Umgebung</b> „mitnehmen“, auch wenn die äußere Funktion längst fertig ist. Das nennt man <b>Closure</b> („Einschluss“). Damit baust du Zähler, die sich ihren Stand merken:</p>
        ${ex("function macheZaehler() {\n  let n = 0;           // gehört nur diesem Zähler\n  return function () {\n    n = n + 1;\n    return n;\n  };\n}\n\nconst a = macheZaehler();\nconsole.log(a());   // 1\nconsole.log(a());   // 2")}
        <p>Jeder Aufruf von ${c("macheZaehler()")} erzeugt eine <b>neue</b> Variable ${c("n")} und eine neue innere Funktion, die darauf zugreift. Zwei Zähler beeinflussen sich also nicht. Von außen kommst du an ${c("n")} nicht heran: Es ist wie eine private Variable.</p>
        ${tip("Das Muster „Funktion, die eine Funktion zurückgibt“ ist die Grundlage vieler JavaScript-Bibliotheken.")}`,
      task: "Schreibe <code>macheZaehler()</code>, die eine Funktion zurückgibt, die bei jedem Aufruf um 1 hochzählt und den neuen Stand zurückgibt. Zwei Zähler müssen unabhängig sein. Erwartet: <code>1</code>, <code>2</code>, <code>3</code>, <code>1</code>.",
      starter: "// function macheZaehler() { ... }\n\nconst z1 = macheZaehler();\nconst z2 = macheZaehler();\nconsole.log(z1());\nconsole.log(z1());\nconsole.log(z1());\nconsole.log(z2());\n",
      hint: "function macheZaehler() {\n  let n = 0;\n  return function () {\n    n = n + 1;\n    return n;\n  };\n}",
      solution: "function macheZaehler() {\n  let n = 0;\n  return function () {\n    n = n + 1;\n    return n;\n  };\n}\n\nconst z1 = macheZaehler();\nconst z2 = macheZaehler();\nconsole.log(z1());\nconsole.log(z1());\nconsole.log(z1());\nconsole.log(z2());",
      check: ({ output, code }) => {
        if (!/function\s+macheZaehler/.test(code) || !code.includes("return")) return "Definiere macheZaehler(), die eine Funktion mit return zurückgibt.";
        return expectOutput(output, ["1", "2", "3", "1"]);
      },
    },
    {
      title: "JSON",
      content: `
        <p><b>JSON</b> ist ein Textformat für Daten. Es sieht aus wie ein JavaScript-Objekt, ist aber reiner Text, den man speichern oder über das Internet schicken kann. Fast jede Web-Schnittstelle spricht JSON.</p>
        ${ex('const obj = { name: "Mia", hobbys: ["Lesen", "Tanzen"] };\nconst text = JSON.stringify(obj);\nconsole.log(text);   // {"name":"Mia","hobbys":["Lesen","Tanzen"]}\n\nconst zurueck = JSON.parse(text);\nconsole.log(zurueck.hobbys.length);   // 2')}
        <ul>
          <li>${c("JSON.stringify(wert)")}: macht aus einem Objekt oder Array einen <b>Text</b>.</li>
          <li>${c("JSON.parse(text)")}: macht aus dem Text wieder ein <b>Objekt</b>.</li>
        </ul>
        ${warn("In JSON müssen Namen und Texte in <b>doppelten</b> Anführungszeichen stehen. Ein Fehler im Text führt bei <code>JSON.parse</code> zu einem <code>SyntaxError</code>.")}`,
      task: "Wandle <code>text</code> mit <code>JSON.parse</code> in ein Objekt um und gib den Namen und die Zahl der Hobbys aus (<code>Mia</code>, <code>2</code>). Gib dann <code>daten</code> mit <code>JSON.stringify</code> als Text aus.",
      starter: "const text = '{\"name\":\"Mia\",\"hobbys\":[\"Lesen\",\"Tanzen\"]}';\nconst daten = { a: 1, b: [2, 3] };\n\n",
      hint: "const person = JSON.parse(text);\nconsole.log(person.name);\nconsole.log(person.hobbys.length);\nconsole.log(JSON.stringify(daten));",
      solution: "const text = '{\"name\":\"Mia\",\"hobbys\":[\"Lesen\",\"Tanzen\"]}';\nconst daten = { a: 1, b: [2, 3] };\nconst person = JSON.parse(text);\nconsole.log(person.name);\nconsole.log(person.hobbys.length);\nconsole.log(JSON.stringify(daten));",
      check: ({ output, code }) => {
        if (!code.includes("JSON.parse") || !code.includes("JSON.stringify")) return "Benutze JSON.parse und JSON.stringify.";
        return expectOutput(output, ["Mia", "2", '{"a":1,"b":[2,3]}']);
      },
    },
    {
      title: "Map und Set",
      content: `
        <p>Zwei praktische Datenstrukturen neben Array und Objekt:</p>
        <ul>
          <li>${c("Set")}: eine Sammlung <b>ohne Doppelte</b>. Ideal, um Duplikate zu entfernen.</li>
          <li>${c("Map")}: eine Zuordnung <b>Schlüssel → Wert</b> wie ein Objekt, aber mit beliebigen Schlüsseln und garantierter Reihenfolge.</li>
        </ul>
        ${ex('const eindeutig = new Set([1, 2, 2, 3]);\nconsole.log(eindeutig.size);          // 3\nconsole.log([...eindeutig]);          // [1, 2, 3]\n\nconst m = new Map();\nm.set("a", 1);\nm.set("b", 2);\nconsole.log(m.get("a"));              // 1\nconsole.log(m.has("c"));              // false')}
        <p>Mit ${c("for (const [schluessel, wert] of m)")} gehst du alle Einträge durch. Ein typisches Muster: <b>Zählen</b>. Beim Durchgehen holst du den alten Stand (${c("m.get(x) || 0")}) und erhöhst ihn um 1.</p>`,
      task: "Gib mit einem <code>Set</code> aus, wie viele <b>verschiedene</b> Zahlen in <code>zahlen</code> stehen (<code>3</code>). Zähle dann mit einer <code>Map</code>, wie oft jedes Wort in <code>woerter</code> vorkommt, und gib je eine Zeile aus: <code>a: 3</code>, <code>b: 2</code>, <code>c: 1</code>.",
      starter: 'const zahlen = [1, 2, 2, 3, 3, 3];\nconst woerter = ["a", "b", "a", "c", "b", "a"];\n\n',
      hint: "console.log(new Set(zahlen).size);\nconst zaehler = new Map();\nfor (const w of woerter) {\n  zaehler.set(w, (zaehler.get(w) || 0) + 1);\n}\nfor (const [w, n] of zaehler) {\n  console.log(`${w}: ${n}`);\n}",
      solution: 'const zahlen = [1, 2, 2, 3, 3, 3];\nconst woerter = ["a", "b", "a", "c", "b", "a"];\nconsole.log(new Set(zahlen).size);\nconst zaehler = new Map();\nfor (const w of woerter) {\n  zaehler.set(w, (zaehler.get(w) || 0) + 1);\n}\nfor (const [w, n] of zaehler) {\n  console.log(`${w}: ${n}`);\n}',
      check: ({ output, code }) => {
        if (!code.includes("new Set") || !code.includes("new Map")) return "Benutze new Set und new Map.";
        return expectOutput(output, ["3", "a: 3", "b: 2", "c: 1"]);
      },
    },
    {
      title: "Fehler abfangen",
      content: `
        <p>Fehler gehören zum Programmieren. Mit ${c("try")} und ${c("catch")} fängst du sie ab, damit das Programm nicht abstürzt:</p>
        ${ex('try {\n  JSON.parse("kaputt");        // wirft einen Fehler\n  console.log("klappt");       // wird übersprungen\n} catch (fehler) {\n  console.log("Fehler: " + fehler.message);\n}')}
        <p>Sobald im ${c("try")}-Block ein Fehler auftritt, springt JavaScript in den ${c("catch")}-Block. ${c("fehler.message")} enthält die Beschreibung.</p>
        <p>Eigene Fehler löst du mit ${c("throw")} aus. Das ist sinnvoll, wenn deine Funktion mit der Eingabe nichts anfangen kann:</p>
        ${ex('function teile(a, b) {\n  if (b === 0) {\n    throw new Error("Durch 0");\n  }\n  return a / b;\n}')}
        ${tip("Wirf immer <code>new Error(\"Text\")</code> und keine nackten Texte, dann hast du auch Hinweise darauf, wo der Fehler entstand.")}`,
      task: "Rufe <code>teile(10, 2)</code> und <code>teile(1, 0)</code> jeweils in einem <code>try</code>-Block auf. Bei einem Fehler soll <code>Fehler: &lt;Meldung&gt;</code> ausgegeben werden. Erwartet: <code>5</code> und <code>Fehler: Durch 0</code>.",
      starter: 'function teile(a, b) {\n  if (b === 0) {\n    throw new Error("Durch 0");\n  }\n  return a / b;\n}\n\n',
      hint: 'try {\n  console.log(teile(10, 2));\n} catch (e) {\n  console.log("Fehler: " + e.message);\n}\nDasselbe mit teile(1, 0).',
      solution: 'function teile(a, b) {\n  if (b === 0) {\n    throw new Error("Durch 0");\n  }\n  return a / b;\n}\n\ntry {\n  console.log(teile(10, 2));\n} catch (e) {\n  console.log("Fehler: " + e.message);\n}\ntry {\n  console.log(teile(1, 0));\n} catch (e) {\n  console.log("Fehler: " + e.message);\n}',
      check: ({ output, code }) => {
        if (!/\btry\b/.test(code) || !/\bcatch\b/.test(code)) return "Benutze try und catch.";
        return expectOutput(output, ["5", "Fehler: Durch 0"]);
      },
    },
    {
      title: "Reguläre Ausdrücke",
      content: `
        <p>Ein <b>regulärer Ausdruck</b> (RegEx) beschreibt ein Textmuster, zum Beispiel „eine oder mehrere Ziffern“. Er steht zwischen Schrägstrichen: ${c("/\\d+/")}.</p>
        <ul>
          <li>${c("\\d")} eine Ziffer, ${c("\\w")} ein Buchstabe, eine Ziffer oder <code>_</code>, ${c("\\s")} ein Leerzeichen.</li>
          <li>${c("+")} „eines oder mehr“, ${c("*")} „null oder mehr“, ${c("?")} „optional“.</li>
          <li>${c("^")} Anfang, ${c("$")} Ende des Textes. ${c("g")} nach dem Ausdruck heißt „alle Treffer“.</li>
        </ul>
        ${ex('const text = "Zimmer 12, Etage 3";\nconsole.log(text.match(/\\d+/g));       // ["12", "3"]\nconsole.log(/\\d/.test("abc"));         // false\nconsole.log(text.replace(/\\d+/g, "#")); // Zimmer #, Etage #')}
        <p>${c(".test(text)")} gibt ${c("true")}/${c("false")} zurück (passt das Muster?), ${c("text.match(...)")} liefert die Treffer, ${c("replace")} ersetzt sie.</p>
        ${warn("Reguläre Ausdrücke werden schnell unleserlich. Schreibe sie kurz und teste sie an Beispielen.")}`,
      task: "Hole mit <code>match</code> alle Zahlen aus <code>text</code> und gib sie mit <code>join(\",\")</code> aus (<code>42,7,3</code>). Prüfe dann mit <code>test</code> und dem Ausdruck <code>/^\\S+@\\S+\\.\\S+$/</code>, ob <code>mia@mail.de</code> eine E-Mail-Adresse ist (<code>true</code>) und <code>keine mail</code> (<code>false</code>).",
      starter: 'const text = "Bestellung 42 am 7. Mai: 3 Äpfel";\n\n',
      hint: 'console.log(text.match(/\\d+/g).join(","));\nconst mail = /^\\S+@\\S+\\.\\S+$/;\nconsole.log(mail.test("mia@mail.de"));\nconsole.log(mail.test("keine mail"));',
      solution: 'const text = "Bestellung 42 am 7. Mai: 3 Äpfel";\nconsole.log(text.match(/\\d+/g).join(","));\nconst mail = /^\\S+@\\S+\\.\\S+$/;\nconsole.log(mail.test("mia@mail.de"));\nconsole.log(mail.test("keine mail"));',
      check: ({ output, code }) => {
        if (!code.includes("match(") || !code.includes(".test(")) return "Benutze match() und test().";
        return expectOutput(output, ["42,7,3", "true", "false"]);
      },
    },
    {
      title: "Mini-Projekt: Inventar",
      content: `
        <p>Du verwaltest das Lager eines Schreibwarenladens. Jeder Artikel ist ein Objekt mit Name, Menge und Preis. Mit den Array-Methoden aus diesem Kurs beantwortest du Fragen wie:</p>
        <ul>
          <li>Was ist der <b>Gesamtwert</b> des Lagers? (${c("map")} + ${c("reduce")})</li>
          <li>Welche Artikel sind <b>ausverkauft</b>? (${c("filter")})</li>
          <li>Welcher Artikel ist der <b>teuerste</b> (pro Stück)? (${c("reduce")} oder ${c("sort")})</li>
        </ul>
        ${ex("const waren = [{ name: \"Stift\", menge: 10, preis: 0.5 }];\nconst werte = waren.map((w) => w.menge * w.preis);   // [5]\nconst leer = waren.filter((w) => w.menge === 0);      // []")}
        <p>Ketten wie ${c("waren.filter(...).map(...)")} sind in JavaScript sehr üblich: Jede Methode gibt ein neues Array zurück, an das du die nächste hängst.</p>`,
      task: "Gib aus: <code>Gesamtwert: 14</code> (Summe aus Menge mal Preis), <code>Ausverkauft: Heft</code> (Namen aller Artikel mit Menge 0, mit Komma getrennt) und <code>Teuerster Artikel: Lineal</code> (höchster Preis pro Stück).",
      starter: 'const waren = [\n  { name: "Stift", menge: 10, preis: 0.5 },\n  { name: "Heft", menge: 0, preis: 1.5 },\n  { name: "Lineal", menge: 4, preis: 2.25 },\n];\n\n',
      hint: 'const gesamt = waren.map((w) => w.menge * w.preis).reduce((s, x) => s + x, 0);\nconst leer = waren.filter((w) => w.menge === 0).map((w) => w.name);\nconst teuerster = waren.reduce((m, w) => (w.preis > m.preis ? w : m));',
      solution: 'const waren = [\n  { name: "Stift", menge: 10, preis: 0.5 },\n  { name: "Heft", menge: 0, preis: 1.5 },\n  { name: "Lineal", menge: 4, preis: 2.25 },\n];\nconst gesamt = waren.map((w) => w.menge * w.preis).reduce((s, x) => s + x, 0);\nconst leer = waren.filter((w) => w.menge === 0).map((w) => w.name);\nconst teuerster = waren.reduce((m, w) => (w.preis > m.preis ? w : m));\nconsole.log(`Gesamtwert: ${gesamt}`);\nconsole.log(`Ausverkauft: ${leer.join(", ")}`);\nconsole.log(`Teuerster Artikel: ${teuerster.name}`);',
      check: ({ output, code }) => {
        if (!/\.(map|filter|reduce)\s*\(/.test(code)) return "Benutze map, filter oder reduce.";
        return expectOutput(output, ["Gesamtwert: 14", "Ausverkauft: Heft", "Teuerster Artikel: Lineal"]);
      },
    },
  ],
});

/* ====================================================================== */
/*  JavaScript im Browser (DOM)                                             */
/* ====================================================================== */
const dom = (title, content, task, starter, hint, solution, check, after) => ({ title, content, task, starter, hint, solution, check, after: after || "" });
window.KURS_COURSES.push({
  id: "dom",
  lang: "dom",
  langLabel: "HTML + JavaScript",
  emoji: "🖱️",
  title: "JavaScript im Browser",
  desc: "Webseiten lebendig machen: Elemente finden und ändern, Listen bauen, auf Klicks reagieren. Du siehst die Seite sofort.",
  lessons: [
    dom("Elemente finden und ändern",
      `
        <p>Mit JavaScript veränderst du die Webseite, während sie angezeigt wird. Die Seite besteht aus einem Baum von Elementen, dem <b>DOM</b>. Zuerst musst du ein Element <b>finden</b>:</p>
        ${ex('const titel = document.querySelector("#titel");   // # = id\nconst info = document.querySelector(".info");    // . = Klasse\nconst erster = document.querySelector("p");      // Tag-Name')}
        <p>${c("querySelector")} nimmt denselben Selektor wie CSS und liefert das <b>erste</b> passende Element. Danach änderst du es:</p>
        <ul>
          <li>${c("element.textContent = 'Neuer Text'")}: den Text.</li>
          <li>${c("element.style.color = 'red'")}: einzelne Stile (CSS-Eigenschaften in camelCase: <code>backgroundColor</code>).</li>
        </ul>
        ${tip("Dein Skript steht <b>unter</b> den Elementen im HTML. Sonst gibt es sie noch nicht, wenn das Skript sie sucht.")}`,
      "Ändere den Text der Überschrift <code>#titel</code> in <code>Neuer Titel</code> und färbe den Absatz <code>.info</code> rot (<code>style.color = \"red\"</code>).",
      '<h1 id="titel">Alter Titel</h1>\n<p class="info">Dieser Text soll rot werden.</p>\n\n<script>\n  // hier JavaScript\n\n</script>\n',
      'document.querySelector("#titel").textContent = "Neuer Titel";\ndocument.querySelector(".info").style.color = "red";',
      '<h1 id="titel">Alter Titel</h1>\n<p class="info">Dieser Text soll rot werden.</p>\n\n<script>\n  document.querySelector("#titel").textContent = "Neuer Titel";\n  document.querySelector(".info").style.color = "red";\n</script>\n',
      ({ doc }) => {
        const t = doc.querySelector("#titel"), p = doc.querySelector(".info");
        if (!t || !p) return "Lass die Überschrift #titel und den Absatz .info stehen.";
        if (txt(t) !== "Neuer Titel") return 'Der Text von #titel soll „Neuer Titel“ sein (textContent).';
        if (p.style.color !== "red") return 'Setze p.style.color = "red".';
        return true;
      }),
    dom("Elemente erzeugen",
      `
        <p>Du kannst neue Elemente per Code <b>erzeugen</b> und in die Seite einfügen:</p>
        ${ex('const li = document.createElement("li");   // neues <li>\nli.textContent = "Apfel";\ndocument.querySelector("#liste").appendChild(li);   // ans Ende von #liste')}
        <ul>
          <li>${c("createElement('li')")} erzeugt ein Element im Speicher, es ist noch nicht sichtbar.</li>
          <li>${c("appendChild(kind)")} hängt es als letztes Kind an ein anderes Element, jetzt erscheint es.</li>
        </ul>
        <p>Mit einer <b>Schleife</b> baust du so ganze Listen aus Daten, ohne jede Zeile von Hand im HTML zu tippen:</p>
        ${ex('for (const name of ["a", "b"]) {\n  const li = document.createElement("li");\n  li.textContent = name;\n  document.querySelector("#liste").appendChild(li);\n}')}`,
      "Baue aus dem Array <code>fruechte</code> eine Liste: Für jeden Eintrag soll ein <code>&lt;li&gt;</code> mit dem Namen in <code>#liste</code> erscheinen (<code>Apfel</code>, <code>Birne</code>, <code>Kirsche</code>).",
      '<ul id="liste"></ul>\n\n<script>\n  const fruechte = ["Apfel", "Birne", "Kirsche"];\n\n</script>\n',
      'for (const name of fruechte) {\n  const li = document.createElement("li");\n  li.textContent = name;\n  document.querySelector("#liste").appendChild(li);\n}',
      '<ul id="liste"></ul>\n\n<script>\n  const fruechte = ["Apfel", "Birne", "Kirsche"];\n  for (const name of fruechte) {\n    const li = document.createElement("li");\n    li.textContent = name;\n    document.querySelector("#liste").appendChild(li);\n  }\n</script>\n',
      ({ doc }) => {
        const items = [...doc.querySelectorAll("#liste > li")].map(txt);
        if (items.join("|") !== "Apfel|Birne|Kirsche") return "Die Liste #liste braucht drei <li>: Apfel, Birne, Kirsche. Jetzt: " + (items.join(", ") || "(leer)");
        return true;
      }),
    dom("Klassen schalten",
      `
        <p>Statt Stile einzeln zu setzen, schaltest du lieber <b>CSS-Klassen</b> an und aus. Das Aussehen steht im CSS, JavaScript entscheidet nur, wann es gilt. Dafür hat jedes Element eine ${c("classList")}:</p>
        <ul>
          <li>${c("el.classList.add('aktiv')")} fügt die Klasse hinzu.</li>
          <li>${c("el.classList.remove('aktiv')")} entfernt sie.</li>
          <li>${c("el.classList.toggle('aktiv')")} schaltet um: war sie da, wird sie entfernt, sonst hinzugefügt.</li>
          <li>${c("el.classList.contains('aktiv')")} fragt, ob sie da ist (true/false).</li>
        </ul>
        ${ex('const box = document.querySelector("#a");\nbox.classList.add("aktiv");\nconsole.log(box.classList.contains("aktiv"));   // true')}`,
      "Füge dem Element <code>#a</code> die Klasse <code>aktiv</code> hinzu. Das Element <code>#b</code> hat sie schon: Schalte sie mit <code>toggle</code> aus.",
      '<style>\n  .aktiv { background: gold; }\n  div { padding: 10px; margin: 4px; border: 1px solid gray; }\n</style>\n\n<div id="a">Box A</div>\n<div id="b" class="aktiv">Box B</div>\n\n<script>\n\n</script>\n',
      'document.querySelector("#a").classList.add("aktiv");\ndocument.querySelector("#b").classList.toggle("aktiv");',
      '<style>\n  .aktiv { background: gold; }\n  div { padding: 10px; margin: 4px; border: 1px solid gray; }\n</style>\n\n<div id="a">Box A</div>\n<div id="b" class="aktiv">Box B</div>\n\n<script>\n  document.querySelector("#a").classList.add("aktiv");\n  document.querySelector("#b").classList.toggle("aktiv");\n</script>\n',
      ({ doc }) => {
        const a = doc.querySelector("#a"), b = doc.querySelector("#b");
        if (!a || !b) return "Lass die Boxen #a und #b stehen.";
        if (!a.classList.contains("aktiv")) return "#a soll die Klasse aktiv bekommen.";
        if (b.classList.contains("aktiv")) return "#b soll die Klasse aktiv verlieren.";
        return true;
      }),
    dom("Auf Klicks reagieren",
      `
        <p>Jetzt wird es interaktiv: Mit ${c("addEventListener")} sagst du, was passieren soll, wenn etwas Bestimmtes passiert, zum Beispiel ein <b>Klick</b>.</p>
        ${ex('const knopf = document.querySelector("#knopf");\nknopf.addEventListener("click", function () {\n  document.querySelector("#ausgabe").textContent = "Geklickt!";\n});')}
        <ul>
          <li>Das erste Argument ist der <b>Ereignisname</b>: ${c('"click"')}, ${c('"input"')}, ${c('"mouseover"')} …</li>
          <li>Das zweite ist eine <b>Funktion</b>, die bei jedem Ereignis läuft (kurz: <code>() =&gt; { ... }</code>).</li>
        </ul>
        <p>Der Code in der Funktion läuft <b>nicht sofort</b>, sondern erst, wenn jemand klickt. Zum Prüfen deiner Lösung klickt der Kurs den Knopf automatisch für dich.</p>`,
      "Wenn auf den Knopf <code>#knopf</code> geklickt wird, soll der Text von <code>#ausgabe</code> zu <code>Geklickt!</code> wechseln.",
      '<button id="knopf">Klick mich</button>\n<p id="ausgabe">Noch nichts passiert.</p>\n\n<script>\n  // knopf.addEventListener("click", ...)\n\n</script>\n',
      'document.querySelector("#knopf").addEventListener("click", () => {\n  document.querySelector("#ausgabe").textContent = "Geklickt!";\n});',
      '<button id="knopf">Klick mich</button>\n<p id="ausgabe">Noch nichts passiert.</p>\n\n<script>\n  document.querySelector("#knopf").addEventListener("click", () => {\n    document.querySelector("#ausgabe").textContent = "Geklickt!";\n  });\n</script>\n',
      ({ doc }) => {
        const o = doc.querySelector("#ausgabe");
        if (!o) return "Lass den Absatz #ausgabe stehen.";
        if (txt(o) !== "Geklickt!") return "Nach einem Klick auf #knopf soll in #ausgabe „Geklickt!“ stehen. Jetzt: „" + txt(o) + "“";
        return true;
      },
      'document.querySelector("#knopf").click();'),
    dom("Eingaben lesen",
      `
        <p>Bei Formularfeldern liest du den eingetippten Text mit der Eigenschaft ${c("value")}:</p>
        ${ex('const feld = document.querySelector("#name");\nconsole.log(feld.value);      // was gerade im Feld steht\nfeld.value = "";              // Feld leeren')}
        <p>Typisch ist die Kombination aus Klick und Eingabe: Bei einem Klick liest du das Feld und schreibst etwas auf die Seite.</p>
        ${ex('knopf.addEventListener("click", () => {\n  const name = feld.value;\n  ausgabe.textContent = "Hallo, " + name;\n});')}
        ${warn("Mit <code>textContent</code> setzt du Text sicher ein. Mit <code>innerHTML</code> würde eingetippter Text als HTML <b>ausgeführt</b>, das ist eine Sicherheitslücke, wenn der Text von Fremden stammt.")}`,
      "Beim Klick auf <code>#los</code> soll <code>#gruss</code> den Text <code>Hallo, </code> und den Inhalt des Feldes <code>#name</code> zeigen (hier: <code>Hallo, Mia</code>).",
      '<input id="name" value="Mia">\n<button id="los">Begrüßen</button>\n<p id="gruss"></p>\n\n<script>\n\n</script>\n',
      'document.querySelector("#los").addEventListener("click", () => {\n  const name = document.querySelector("#name").value;\n  document.querySelector("#gruss").textContent = "Hallo, " + name;\n});',
      '<input id="name" value="Mia">\n<button id="los">Begrüßen</button>\n<p id="gruss"></p>\n\n<script>\n  document.querySelector("#los").addEventListener("click", () => {\n    const name = document.querySelector("#name").value;\n    document.querySelector("#gruss").textContent = "Hallo, " + name;\n  });\n</script>\n',
      ({ doc }) => {
        const g = doc.querySelector("#gruss");
        if (!g) return "Lass den Absatz #gruss stehen.";
        if (txt(g) !== "Hallo, Mia") return "Nach dem Klick soll in #gruss „Hallo, Mia“ stehen. Jetzt: „" + txt(g) + "“";
        return true;
      },
      'document.querySelector("#los").click();'),
    dom("Listen aus Daten bauen",
      `
        <p>Echte Seiten entstehen aus <b>Daten</b>: Eine Liste von Objekten wird in HTML verwandelt. Das Muster ist immer gleich: Für jedes Element ein neues HTML-Element erzeugen, füllen und anhängen.</p>
        ${ex('const tiere = [{ name: "Hund", beine: 4 }, { name: "Vogel", beine: 2 }];\nfor (const t of tiere) {\n  const li = document.createElement("li");\n  li.textContent = `${t.name} (${t.beine} Beine)`;\n  document.querySelector("#liste").appendChild(li);\n}')}
        <p>Mit Template-Strings baust du den Text einer Zeile bequem aus mehreren Eigenschaften zusammen. Sehr ähnlich funktionieren Webshops, Nachrichtenseiten und soziale Netzwerke, nur mit tausenden Einträgen.</p>`,
      "Erzeuge für jedes Tier in <code>tiere</code> ein <code>&lt;li&gt;</code> in <code>#liste</code> mit dem Text im Format <code>Hund (4 Beine)</code>.",
      '<ul id="liste"></ul>\n\n<script>\n  const tiere = [\n    { name: "Hund", beine: 4 },\n    { name: "Vogel", beine: 2 },\n    { name: "Spinne", beine: 8 },\n  ];\n\n</script>\n',
      'for (const t of tiere) {\n  const li = document.createElement("li");\n  li.textContent = `${t.name} (${t.beine} Beine)`;\n  document.querySelector("#liste").appendChild(li);\n}',
      '<ul id="liste"></ul>\n\n<script>\n  const tiere = [\n    { name: "Hund", beine: 4 },\n    { name: "Vogel", beine: 2 },\n    { name: "Spinne", beine: 8 },\n  ];\n  for (const t of tiere) {\n    const li = document.createElement("li");\n    li.textContent = `${t.name} (${t.beine} Beine)`;\n    document.querySelector("#liste").appendChild(li);\n  }\n</script>\n',
      ({ doc }) => {
        const items = [...doc.querySelectorAll("#liste > li")].map(txt);
        if (items.join("|") !== "Hund (4 Beine)|Vogel (2 Beine)|Spinne (8 Beine)") return "Erwartet: Hund (4 Beine), Vogel (2 Beine), Spinne (8 Beine). Jetzt: " + (items.join(", ") || "(leer)");
        return true;
      }),
    dom("Ein Zähler",
      `
        <p>Programme müssen sich Dinge <b>merken</b>: Der Zähler steht in einer Variablen <b>außerhalb</b> der Klick-Funktion. Bei jedem Klick erhöhst du ihn und schreibst den neuen Stand auf die Seite.</p>
        ${ex('let stand = 0;\nknopf.addEventListener("click", () => {\n  stand = stand + 1;\n  anzeige.textContent = stand;\n});')}
        <p>Würdest du ${c("let stand = 0")} <b>in</b> die Funktion schreiben, begänne der Zähler bei jedem Klick wieder bei 0. Die Variable draußen lebt so lange wie die Seite (das ist wieder eine Closure).</p>
        ${tip("Das ist die Grundlage fast aller Apps: Zustand in Variablen halten, bei Ereignissen verändern und die Anzeige aktualisieren.")}`,
      "Baue den Zähler: Jeder Klick auf <code>#plus</code> erhöht die Zahl in <code>#stand</code> um 1 (der Kurs klickt zum Prüfen dreimal, am Ende soll <code>3</code> dort stehen).",
      '<button id="plus">+1</button>\n<span id="stand">0</span>\n\n<script>\n\n</script>\n',
      'let stand = 0;\ndocument.querySelector("#plus").addEventListener("click", () => {\n  stand = stand + 1;\n  document.querySelector("#stand").textContent = stand;\n});',
      '<button id="plus">+1</button>\n<span id="stand">0</span>\n\n<script>\n  let stand = 0;\n  document.querySelector("#plus").addEventListener("click", () => {\n    stand = stand + 1;\n    document.querySelector("#stand").textContent = stand;\n  });\n</script>\n',
      ({ doc }) => {
        const s = doc.querySelector("#stand");
        if (!s) return "Lass #stand stehen.";
        if (txt(s) !== "3") return "Nach drei Klicks soll in #stand eine 3 stehen. Jetzt: „" + txt(s) + "“";
        return true;
      },
      'const b = document.querySelector("#plus"); b.click(); b.click(); b.click();'),
    dom("Mini-Projekt: To-do-Liste",
      `
        <p>Zum Abschluss baust du eine kleine <b>To-do-Liste</b> aus allem, was du gelernt hast:</p>
        <ul>
          <li>Ein Eingabefeld ${c("#neu")} und ein Knopf ${c("#hinzu")}.</li>
          <li>Beim Klick: den Text lesen (${c("value")}), ein ${c("li")} erzeugen, anhängen und das Feld wieder leeren.</li>
          <li>Leere Eingaben sollen <b>nicht</b> hinzugefügt werden.</li>
        </ul>
        ${ex('const text = feld.value.trim();   // trim entfernt Leerzeichen am Rand\nif (text === "") {\n  return;                      // nichts tun\n}')}
        <p>Mit ${c("return")} verlässt du die Funktion früh, praktisch für solche Prüfungen am Anfang.</p>
        ${tip("Als Erweiterung könntest du jedem Eintrag per Klick eine durchgestrichene Darstellung geben (<code>li.classList.toggle(\"erledigt\")</code>) und die Liste in <code>localStorage</code> speichern.")}`,
      "Baue die Liste: Beim Klick auf <code>#hinzu</code> wird der (getrimmte) Text aus <code>#neu</code> als <code>&lt;li&gt;</code> an <code>#liste</code> gehängt, das Feld geleert, und leere Eingaben werden ignoriert. Der Kurs trägt zum Prüfen <code>Lernen</code>, <code>Sport</code> und einen leeren Eintrag ein.",
      '<input id="neu" placeholder="Neue Aufgabe">\n<button id="hinzu">Hinzufügen</button>\n<ul id="liste"></ul>\n\n<script>\n\n</script>\n',
      'document.querySelector("#hinzu").addEventListener("click", () => {\n  const feld = document.querySelector("#neu");\n  const text = feld.value.trim();\n  if (text === "") {\n    return;\n  }\n  const li = document.createElement("li");\n  li.textContent = text;\n  document.querySelector("#liste").appendChild(li);\n  feld.value = "";\n});',
      '<input id="neu" placeholder="Neue Aufgabe">\n<button id="hinzu">Hinzufügen</button>\n<ul id="liste"></ul>\n\n<script>\n  document.querySelector("#hinzu").addEventListener("click", () => {\n    const feld = document.querySelector("#neu");\n    const text = feld.value.trim();\n    if (text === "") {\n      return;\n    }\n    const li = document.createElement("li");\n    li.textContent = text;\n    document.querySelector("#liste").appendChild(li);\n    feld.value = "";\n  });\n</script>\n',
      ({ doc }) => {
        const items = [...doc.querySelectorAll("#liste > li")].map(txt);
        if (items.join("|") !== "Lernen|Sport") return "Erwartet: die zwei Einträge Lernen und Sport (leere Eingaben werden ignoriert). Jetzt: " + (items.join(", ") || "(leer)");
        const feld = doc.querySelector("#neu");
        if (feld && feld.getAttribute("value") !== null && feld.value !== "") return "Nach dem Hinzufügen soll das Eingabefeld leer sein.";
        return true;
      },
      'const f = document.querySelector("#neu"), b = document.querySelector("#hinzu"); f.value = "Lernen"; b.click(); f.value = "Sport"; b.click(); f.value = "   "; b.click();'),
  ],
});

window.KURS_HINTS.js2 = [
  "Bei Objekten packst du mit geschweiften Klammern aus, bei Arrays mit eckigen. Der Rest eines Arrays steht hinter drei Punkten.",
  "Der Startwert von reduce steht nach der Funktion. Die Funktion bekommt den bisherigen Stand und das aktuelle Element und gibt den neuen Stand zurück.",
  "find liefert das erste passende Element, some und every liefern true oder false. Jede Methode bekommt eine Funktion mit der Bedingung.",
  "sort braucht für Zahlen eine Vergleichsfunktion: a minus b sortiert aufsteigend. Bei Wörtern vergleichst du die Länge.",
  "Object.values gibt alle Werte als Array, Object.entries die Paare. Mit for...of und [name, wert] gehst du sie durch.",
  "Prüfe in abheben zuerst, ob das Guthaben reicht. Wenn nicht, gibst du false zurück, sonst ziehst du ab und gibst true zurück.",
  "Eine Unterklasse beginnt mit extends. Im Konstruktor rufst du zuerst super(name) auf. Die Methode darf this.name benutzen.",
  "Lege die Zählvariable in der äußeren Funktion an und gib eine innere Funktion zurück, die sie erhöht und zurückgibt.",
  "parse macht aus Text ein Objekt, stringify macht aus einem Objekt Text. Beim Parsen greifst du danach mit Punkt auf die Eigenschaften zu.",
  "Die Größe eines Sets steht in size. Beim Zählen mit der Map holst du den alten Stand mit get, nimmst bei fehlendem Eintrag 0 und erhöhst um 1.",
  "Packe den Aufruf in try, die Fehlerbehandlung in catch. Die Fehlermeldung steht in e.message.",
  "match mit dem Flag g liefert alle Treffer als Array. test gibt true oder false zurück. \\d steht für eine Ziffer.",
  "Den Gesamtwert bekommst du mit map und reduce, die ausverkauften Artikel mit filter, den teuersten mit reduce und einem Vergleich der Preise.",
];
window.KURS_HINTS.dom = [
  "Suche die Elemente mit document.querySelector und setze dann textContent und style.color.",
  "Erzeuge in der Schleife je ein li mit createElement, setze den Text und hänge es mit appendChild an die Liste.",
  "classList.add fügt eine Klasse hinzu, toggle schaltet sie um. Beide rufst du auf dem gefundenen Element auf.",
  "Hänge mit addEventListener(\"click\", ...) eine Funktion an den Knopf. In ihr setzt du den Text von #ausgabe.",
  "Lies das Feld in der Klick-Funktion mit .value und setze den Text zusammen. Das Skript steht unter den Elementen.",
  "Gehe das Array mit einer Schleife durch und baue den Text mit einem Template-String aus Name und Beinen.",
  "Die Variable für den Stand muss außerhalb der Klick-Funktion stehen. In der Funktion erhöhst du sie und schreibst sie in #stand.",
  "Lies und trimme den Text, beende die Funktion früh bei leerem Text, sonst li anhängen und das Feld leeren.",
];
})();
