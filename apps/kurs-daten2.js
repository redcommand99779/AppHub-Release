/* ══════════════════════════════════
   PROGRAMMIERKURSE – weitere Python-Kurse: „Algorithmen mit Python“ (10 Lektionen) und „Python-Projekte“ (8 Lektionen).
   Gleicher Aufbau wie kurs-daten.js (title, content, task, starter, hint, solution, check); die sanften Tipps kommen in KURS_HINTS.
   Alle Musterlösungen werden in tests/check.js mit echtem Python geprüft.
══════════════════════════════════ */
(() => {
const { c, ex, tip, warn, expectOutput } = window.KURS_HELP;
// Der Rumpf einer Funktion (alles Eingerückte nach der def-Zeile), um zu prüfen, ob sie sich selbst aufruft
const body = (code, name) => { const m = code.match(new RegExp("def\\s+" + name + "\\s*\\([^)]*\\)\\s*:[^\\n]*\\n((?:[ \\t]+[^\\n]*\\n?|\\n)+)")); return m ? m[1] : ""; };

/* ====================================================================== */
/*  PYTHON 3 – Algorithmen                                                  */
/* ====================================================================== */
window.KURS_COURSES.push({
  id: "py3",
  lang: "python",
  langLabel: "Python",
  emoji: "🧮",
  title: "Algorithmen mit Python",
  desc: "Suchen, Sortieren, Primzahlen und Rekursion: So denken Programmierer. Baut auf dem Einsteigerkurs auf.",
  lessons: [
    {
      title: "Was ist ein Algorithmus?",
      content: `
        <p>Ein <b>Algorithmus</b> ist eine genaue Schritt-für-Schritt-Anleitung, mit der man ein Problem löst, so wie ein Kochrezept. Computer können nur Algorithmen ausführen, deshalb ist das Entwerfen guter Anleitungen die Kunst des Programmierens.</p>
        <p>Beispiel: Wie findest du die <b>größte</b> Zahl in einer Liste? Du merkst dir die bisher größte Zahl und gehst alle anderen durch. Ist eine größer, merkst du dir die neue.</p>
        ${ex("zahlen = [4, 9, 2, 7]\nbeste = zahlen[0]       # Start: das erste Element\nfor z in zahlen:\n    if z > beste:       # größer als die bisher beste?\n        beste = z\nprint(beste)            # 9")}
        <p>Genau so arbeitet die fertige Funktion ${c("max()")} im Inneren. Du baust sie jetzt selbst nach.</p>
        ${tip("Gute Algorithmen sind <b>eindeutig</b> (jeder Schritt ist klar), <b>endlich</b> (sie hören irgendwann auf) und <b>korrekt</b> (sie lösen das Problem für jede Eingabe).")}`,
      task: "Finde die <b>kleinste</b> Zahl in <code>zahlen</code> mit einer Schleife (ohne <code>min()</code>) und gib sie aus. Erwartet: <code>3</code>.",
      starter: "zahlen = [8, 3, 11, 5, 6]\nkleinste = zahlen[0]\n\n# gehe alle Zahlen durch und merke dir die kleinste\n",
      hint: "for z in zahlen:\n    if z < kleinste:\n        kleinste = z\nprint(kleinste)",
      solution: "zahlen = [8, 3, 11, 5, 6]\nkleinste = zahlen[0]\nfor z in zahlen:\n    if z < kleinste:\n        kleinste = z\nprint(kleinste)",
      check: ({ output, code }) => {
        if (/\bmin\s*\(/.test(code)) return "Benutze min() nicht, sondern baue den Algorithmus selbst mit einer Schleife.";
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife.";
        return expectOutput(output, ["3"]);
      },
    },
    {
      title: "Lineare Suche",
      content: `
        <p>Die einfachste Suche: Gehe die Liste von vorn nach hinten durch und schau bei jedem Element, ob es das gesuchte ist. Findest du es, gibst du den <b>Index</b> (die Position) zurück, sonst ${c("-1")} als Zeichen für „nicht gefunden“.</p>
        ${ex("def finde(liste, ziel):\n    for i in range(len(liste)):\n        if liste[i] == ziel:\n            return i\n    return -1\n\nprint(finde([4, 7, 1], 7))   # 1\nprint(finde([4, 7, 1], 9))   # -1")}
        <p>Wichtig: Das ${c("return -1")} steht <b>außerhalb</b> der Schleife, denn erst nach dem Durchsehen aller Elemente weißt du, dass nichts gefunden wurde. Ein <code>return</code> beendet die Funktion sofort.</p>
        ${warn("Setzt du das <code>return -1</code> in die Schleife (eingerückt), gibt die Funktion schon nach dem ersten Element auf.")}`,
      task: "Schreibe <code>finde(liste, ziel)</code> mit einer Schleife (ohne <code>.index()</code>), die den Index von <code>ziel</code> oder <code>-1</code> zurückgibt. Erwartet: <code>2</code> und <code>-1</code>.",
      starter: "# def finde(liste, ziel):\n#     ...\n\nprint(finde([5, 3, 8, 1], 8))\nprint(finde([5, 3, 8, 1], 7))\n",
      hint: "for i in range(len(liste)):\n    if liste[i] == ziel:\n        return i\nreturn -1   (nach der Schleife)",
      solution: "def finde(liste, ziel):\n    for i in range(len(liste)):\n        if liste[i] == ziel:\n            return i\n    return -1\n\nprint(finde([5, 3, 8, 1], 8))\nprint(finde([5, 3, 8, 1], 7))",
      check: ({ output, code }) => {
        if (!/def\s+finde\s*\(/.test(code)) return "Definiere die Funktion finde mit def.";
        if (/\.index\s*\(/.test(code)) return "Benutze .index() nicht, sondern suche selbst mit einer Schleife.";
        return expectOutput(output, ["2", "-1"]);
      },
    },
    {
      title: "Primzahlen",
      content: `
        <p>Eine <b>Primzahl</b> ist eine Zahl größer als 1, die nur durch 1 und durch sich selbst teilbar ist: 2, 3, 5, 7, 11 … Um das zu prüfen, probierst du alle möglichen Teiler aus. Ist die Zahl durch einen davon teilbar (Rest 0), ist sie keine Primzahl.</p>
        ${ex("def ist_gerade(n):\n    return n % 2 == 0\n\nprint(ist_gerade(10))   # True\nprint(ist_gerade(7))    # False")}
        <p>Für Primzahlen gehst du die Zahlen ${c("2")} bis ${c("n - 1")} durch (${c("range(2, n)")}) und prüfst ${c("n % teiler == 0")}. Sobald du einen Teiler findest, steht die Antwort fest: <b>False</b>. Findest du keinen, ist es eine Primzahl: <b>True</b>.</p>
        ${tip("Zahlen kleiner als 2 sind keine Primzahlen, behandle sie als Sonderfall am Anfang der Funktion.")}`,
      task: "Vervollständige <code>ist_primzahl(n)</code>, sodass das Programm alle Primzahlen von 2 bis 30 in <b>einer Zeile</b> ausgibt: <code>2 3 5 7 11 13 17 19 23 29</code>.",
      starter: "def ist_primzahl(n):\n    # Primzahlen sind größer als 1 und nur durch 1 und sich selbst teilbar\n    pass\n\nprimzahlen = []\nfor zahl in range(2, 31):\n    if ist_primzahl(zahl):\n        primzahlen.append(str(zahl))\nprint(\" \".join(primzahlen))\n",
      hint: "if n < 2: return False\nfor teiler in range(2, n):\n    if n % teiler == 0:\n        return False\nreturn True",
      solution: "def ist_primzahl(n):\n    if n < 2:\n        return False\n    for teiler in range(2, n):\n        if n % teiler == 0:\n            return False\n    return True\n\nprimzahlen = []\nfor zahl in range(2, 31):\n    if ist_primzahl(zahl):\n        primzahlen.append(str(zahl))\nprint(\" \".join(primzahlen))",
      check: ({ output, code }) => {
        if (!/def\s+ist_primzahl/.test(code) || !code.includes("return")) return "Die Funktion ist_primzahl soll True oder False mit return zurückgeben.";
        return expectOutput(output, ["2 3 5 7 11 13 17 19 23 29"]);
      },
    },
    {
      title: "Größter gemeinsamer Teiler (Euklid)",
      content: `
        <p>Der <b>größte gemeinsame Teiler</b> (ggT) zweier Zahlen ist die größte Zahl, durch die beide teilbar sind. Für 48 und 18 ist das die 6. Der Grieche <b>Euklid</b> hat vor über 2000 Jahren einen genialen Algorithmus dafür gefunden:</p>
        <ol>
          <li>Teile die größere durch die kleinere Zahl und nimm den <b>Rest</b>.</li>
          <li>Ersetze die größere Zahl durch die kleinere und die kleinere durch den Rest.</li>
          <li>Wiederhole, bis der Rest 0 ist. Dann ist die andere Zahl der ggT.</li>
        </ol>
        ${ex("a, b = 48, 18\nwhile b != 0:\n    a, b = b, a % b   # beide Werte gleichzeitig tauschen\nprint(a)   # 6")}
        <p>Die Zeile ${c("a, b = b, a % b")} setzt beide Variablen <b>gleichzeitig</b>: Rechts wird zuerst alles berechnet, dann zugewiesen. Dieser Trick (Tupel-Zuweisung) spart eine Hilfsvariable.</p>`,
      task: "Schreibe <code>ggt(a, b)</code> mit dem euklidischen Algorithmus (<code>while</code>-Schleife) und gib <code>ggt(48, 18)</code>, <code>ggt(17, 5)</code> und <code>ggt(100, 75)</code> aus. Erwartet: <code>6</code>, <code>1</code>, <code>25</code>.",
      starter: "# def ggt(a, b):\n#     ...\n\nprint(ggt(48, 18))\nprint(ggt(17, 5))\nprint(ggt(100, 75))\n",
      hint: "def ggt(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a",
      solution: "def ggt(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\nprint(ggt(48, 18))\nprint(ggt(17, 5))\nprint(ggt(100, 75))",
      check: ({ output, code }) => {
        if (!/def\s+ggt\s*\(/.test(code)) return "Definiere die Funktion ggt.";
        if (!/\bwhile\b/.test(code)) return "Benutze eine while-Schleife wie bei Euklid.";
        return expectOutput(output, ["6", "1", "25"]);
      },
    },
    {
      title: "Sortieren 1: Bubble Sort",
      content: `
        <p>Sortieren gehört zu den wichtigsten Aufgaben. Der einfachste Algorithmus heißt <b>Bubble Sort</b> („Blasen-Sortierung“): Du vergleichst immer zwei <b>benachbarte</b> Elemente und vertauschst sie, wenn sie in der falschen Reihenfolge stehen. Dadurch „blubbert“ die größte Zahl wie eine Blase nach hinten.</p>
        ${ex("zahlen = [3, 1, 2]\n# 1. Runde: 3 und 1 tauschen -> [1, 3, 2]\n#           3 und 2 tauschen -> [1, 2, 3]\nif zahlen[0] > zahlen[1]:\n    zahlen[0], zahlen[1] = zahlen[1], zahlen[0]")}
        <p>Nach jeder Runde steht das größte Element am Ende, also muss die nächste Runde ein Element weniger vergleichen. Das spiegelt sich in zwei verschachtelten Schleifen wider.</p>
        ${tip("Das Tauschen zweier Listenelemente geht in Python mit einer Zeile: <code>liste[i], liste[j] = liste[j], liste[i]</code>.")}`,
      task: "Ergänze in <code>bubble_sort</code> den Vergleich und das Tauschen (ohne <code>sorted()</code> oder <code>.sort()</code>). Erwartet: <code>[1, 2, 5, 7, 9]</code>.",
      starter: "def bubble_sort(liste):\n    n = len(liste)\n    for runde in range(n - 1):\n        for i in range(n - 1 - runde):\n            # vergleiche liste[i] und liste[i + 1] und tausche sie, wenn nötig\n            pass\n    return liste\n\nprint(bubble_sort([5, 2, 9, 1, 7]))\n",
      hint: "if liste[i] > liste[i + 1]:\n    liste[i], liste[i + 1] = liste[i + 1], liste[i]",
      solution: "def bubble_sort(liste):\n    n = len(liste)\n    for runde in range(n - 1):\n        for i in range(n - 1 - runde):\n            if liste[i] > liste[i + 1]:\n                liste[i], liste[i + 1] = liste[i + 1], liste[i]\n    return liste\n\nprint(bubble_sort([5, 2, 9, 1, 7]))",
      check: ({ output, code }) => {
        if (/\bsorted\s*\(|\.sort\s*\(/.test(code)) return "Benutze sorted() und .sort() nicht, sondern tausche die Elemente selbst.";
        return expectOutput(output, ["[1, 2, 5, 7, 9]"]);
      },
    },
    {
      title: "Sortieren 2: sorted() und key",
      content: `
        <p>In der Praxis nutzt du die eingebaute Funktion ${c("sorted()")}. Sie gibt eine <b>neue sortierte Liste</b> zurück und lässt die alte unverändert. Mit ${c("reverse=True")} sortierst du absteigend.</p>
        ${ex("zahlen = [3, 11, 7]\nprint(sorted(zahlen))                 # [3, 7, 11]\nprint(sorted(zahlen, reverse=True))   # [11, 7, 3]")}
        <p>Mit ${c("key=")} bestimmst du, <b>wonach</b> sortiert wird. Der Wert von <code>key</code> ist eine Funktion, die für jedes Element einen Sortierwert berechnet, zum Beispiel ${c("len")} für die Länge eines Wortes:</p>
        ${ex('woerter = ["Banane", "Kiwi", "Apfel"]\nprint(sorted(woerter, key=len))   # [\'Kiwi\', \'Apfel\', \'Banane\']')}
        <p>Bei gleichem Sortierwert bleibt die ursprüngliche Reihenfolge erhalten (die Sortierung ist <b>stabil</b>).</p>`,
      task: "Sortiere <code>woerter</code> nach der Länge (<code>key=len</code>) und gib die Liste aus. Sortiere danach <code>zahlen</code> absteigend und gib sie aus. Erwartet: <code>['Kiwi', 'Apfel', 'Mango', 'Banane']</code> und <code>[11, 7, 3]</code>.",
      starter: 'woerter = ["Banane", "Kiwi", "Apfel", "Mango"]\nzahlen = [3, 11, 7]\n\n',
      hint: "print(sorted(woerter, key=len))\nprint(sorted(zahlen, reverse=True))",
      solution: 'woerter = ["Banane", "Kiwi", "Apfel", "Mango"]\nzahlen = [3, 11, 7]\nprint(sorted(woerter, key=len))\nprint(sorted(zahlen, reverse=True))',
      check: ({ output, code }) => {
        if (!/key\s*=/.test(code) || !/reverse\s*=/.test(code)) return "Benutze sorted() mit key= und reverse=.";
        return expectOutput(output, ["['Kiwi', 'Apfel', 'Mango', 'Banane']", "[11, 7, 3]"]);
      },
    },
    {
      title: "Binäre Suche",
      content: `
        <p>Die lineare Suche braucht bei 1000 Einträgen im schlimmsten Fall 1000 Schritte. Ist die Liste aber <b>sortiert</b>, geht es viel schneller mit der <b>binären Suche</b>: Du schaust in die <b>Mitte</b>. Ist das Element zu klein, kann es nur in der rechten Hälfte stehen, ist es zu groß, nur in der linken. So halbierst du den Suchbereich in jedem Schritt.</p>
        ${ex("liste = [2, 5, 8, 12, 16, 23, 38]\nlinks = 0\nrechts = len(liste) - 1\nmitte = (links + rechts) // 2   # 3\nprint(liste[mitte])             # 12")}
        <p>Bei 1000 Einträgen reichen so höchstens <b>10 Schritte</b>, bei einer Million nur 20! Das Zeichen ${c("//")} teilt ganzzahlig, die Mitte ist also immer ein gültiger Index.</p>
        ${warn("Binäre Suche funktioniert <b>nur in sortierten</b> Listen.")}`,
      task: "Ergänze die Schleife in <code>binaer_suche(liste, ziel)</code>: Gib den Index von <code>ziel</code> zurück oder <code>-1</code>. Erwartet: <code>5</code> und <code>-1</code>.",
      starter: "def binaer_suche(liste, ziel):\n    links = 0\n    rechts = len(liste) - 1\n    # while links <= rechts:\n    #     mitte = (links + rechts) // 2\n    #     ... gefunden? sonst links oder rechts anpassen\n    return -1\n\nzahlen = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]\nprint(binaer_suche(zahlen, 23))\nprint(binaer_suche(zahlen, 40))\n",
      hint: "while links <= rechts:\n    mitte = (links + rechts) // 2\n    if liste[mitte] == ziel:\n        return mitte\n    elif liste[mitte] < ziel:\n        links = mitte + 1\n    else:\n        rechts = mitte - 1",
      solution: "def binaer_suche(liste, ziel):\n    links = 0\n    rechts = len(liste) - 1\n    while links <= rechts:\n        mitte = (links + rechts) // 2\n        if liste[mitte] == ziel:\n            return mitte\n        elif liste[mitte] < ziel:\n            links = mitte + 1\n        else:\n            rechts = mitte - 1\n    return -1\n\nzahlen = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]\nprint(binaer_suche(zahlen, 23))\nprint(binaer_suche(zahlen, 40))",
      check: ({ output, code }) => {
        if (!/\bwhile\b/.test(code) || !code.includes("//")) return "Benutze eine while-Schleife und berechne die Mitte mit //.";
        return expectOutput(output, ["5", "-1"]);
      },
    },
    {
      title: "Rekursion: Fakultät",
      content: `
        <p>Bei der <b>Rekursion</b> ruft eine Funktion <b>sich selbst</b> auf, mit einem kleineren Problem. Klassisches Beispiel ist die <b>Fakultät</b>: ${c("5! = 5 · 4 · 3 · 2 · 1 = 120")}. Man kann sie auch so beschreiben: <i>5! ist 5 mal 4!</i>, und <i>4! ist 4 mal 3!</i> usw.</p>
        ${ex("def fakultaet(n):\n    if n <= 1:           # Abbruchbedingung: hier hört es auf\n        return 1\n    return n * fakultaet(n - 1)   # Aufruf mit kleinerem n\n\nprint(fakultaet(4))   # 24")}
        <p>Jede rekursive Funktion braucht zwei Dinge:</p>
        <ul>
          <li>eine <b>Abbruchbedingung</b> (hier: ${c("n <= 1")}), sonst läuft sie ewig (Python meldet dann ${c("RecursionError")}),</li>
          <li>einen <b>rekursiven Aufruf</b>, der dem Ziel näher kommt (hier: ${c("n - 1")}).</li>
        </ul>`,
      task: "Schreibe die <b>rekursive</b> Funktion <code>fakultaet(n)</code> und gib <code>fakultaet(5)</code>, <code>fakultaet(10)</code> und <code>fakultaet(0)</code> aus. Erwartet: <code>120</code>, <code>3628800</code>, <code>1</code>.",
      starter: "# def fakultaet(n):\n#     ...\n\nprint(fakultaet(5))\nprint(fakultaet(10))\nprint(fakultaet(0))\n",
      hint: "def fakultaet(n):\n    if n <= 1:\n        return 1\n    return n * fakultaet(n - 1)",
      solution: "def fakultaet(n):\n    if n <= 1:\n        return 1\n    return n * fakultaet(n - 1)\n\nprint(fakultaet(5))\nprint(fakultaet(10))\nprint(fakultaet(0))",
      check: ({ output, code }) => {
        if (!/def\s+fakultaet\s*\(/.test(code)) return "Definiere die Funktion fakultaet.";
        if (!body(code, "fakultaet").includes("fakultaet(")) return "Die Funktion soll sich selbst aufrufen (Rekursion).";
        return expectOutput(output, ["120", "3628800", "1"]);
      },
    },
    {
      title: "Rekursion: Fibonacci",
      content: `
        <p>Die <b>Fibonacci-Folge</b> beginnt mit 0 und 1; jede weitere Zahl ist die <b>Summe der beiden vorherigen</b>: 0, 1, 1, 2, 3, 5, 8, 13, 21 … Sie kommt in der Natur vor, zum Beispiel bei Sonnenblumen und Tannenzapfen.</p>
        <p>Das lässt sich direkt rekursiv aufschreiben: <i>fib(n) = fib(n-1) + fib(n-2)</i>, und die ersten beiden Werte sind die Abbruchbedingung.</p>
        ${ex("def fib(n):\n    if n < 2:\n        return n   # fib(0) = 0, fib(1) = 1\n    return fib(n - 1) + fib(n - 2)\n\nprint(fib(6))   # 8")}
        <p>Mit einer List Comprehension und ${c('" ".join(...)')} gibst du mehrere Werte in einer Zeile aus:</p>
        ${ex('print(" ".join(str(fib(i)) for i in range(5)))   # 0 1 1 2 3')}
        ${warn("Diese rekursive Version ist bei großen Zahlen <b>sehr langsam</b> (fib(35) braucht Millionen Aufrufe), denn sie rechnet dieselben Werte immer wieder aus. Schnellere Wege (Schleife oder Merken von Ergebnissen) kommen später.")}`,
      task: "Schreibe <code>fib(n)</code> rekursiv und gib die ersten 10 Fibonacci-Zahlen in <b>einer Zeile</b> aus: <code>0 1 1 2 3 5 8 13 21 34</code>.",
      starter: "# def fib(n):\n#     ...\n\n# print(\" \".join(str(fib(i)) for i in range(10)))\n",
      hint: "def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(\" \".join(str(fib(i)) for i in range(10)))",
      solution: "def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint(\" \".join(str(fib(i)) for i in range(10)))",
      check: ({ output, code }) => {
        if (!/def\s+fib\s*\(/.test(code)) return "Definiere die Funktion fib.";
        if (!body(code, "fib").includes("fib(")) return "Die Funktion soll sich selbst aufrufen (Rekursion).";
        return expectOutput(output, ["0 1 1 2 3 5 8 13 21 34"]);
      },
    },
    {
      title: "Mini-Projekt: Zahl erraten wie ein Computer",
      content: `
        <p>Beim Ratespiel „Ich denke mir eine Zahl zwischen 1 und 100“ rät ein Mensch oft wild drauflos. Ein Computer ist schlauer: Er rät immer die <b>Mitte</b> des noch möglichen Bereichs und bekommt als Antwort „zu klein“ oder „zu groß“. Das ist genau die binäre Suche!</p>
        ${ex("geheim = 73\nunten, oben = 1, 100\nversuche = 0\nwhile True:\n    tipp = (unten + oben) // 2\n    versuche = versuche + 1\n    if tipp == geheim:\n        break               # gefunden\n    elif tipp < geheim:\n        unten = tipp + 1    # die Zahl ist größer\n    else:\n        oben = tipp - 1     # die Zahl ist kleiner")}
        <p>Mit ${c("break")} verlässt du eine Schleife sofort. Spannend: Selbst bei 100 möglichen Zahlen braucht der Computer <b>höchstens 7 Versuche</b>, bei 1000 Zahlen höchstens 10.</p>`,
      task: "Lass den Computer die Zahl <code>geheim = 73</code> erraten und gib am Ende genau diese Zeile aus: <code>Gefunden: 73 nach 6 Versuchen</code> (Zahl der Versuche mit einer Variablen zählen).",
      starter: "geheim = 73\nunten = 1\noben = 100\nversuche = 0\n\n# rate die Mitte, zähle die Versuche, passe unten oder oben an\n",
      hint: "while True:\n    tipp = (unten + oben) // 2\n    versuche = versuche + 1\n    if tipp == geheim:\n        break\n    ...\nprint(f\"Gefunden: {tipp} nach {versuche} Versuchen\")",
      solution: "geheim = 73\nunten = 1\noben = 100\nversuche = 0\nwhile True:\n    tipp = (unten + oben) // 2\n    versuche = versuche + 1\n    if tipp == geheim:\n        break\n    elif tipp < geheim:\n        unten = tipp + 1\n    else:\n        oben = tipp - 1\nprint(f\"Gefunden: {tipp} nach {versuche} Versuchen\")",
      check: ({ output, code }) => {
        if (!/\bwhile\b/.test(code)) return "Benutze eine while-Schleife.";
        return expectOutput(output, ["Gefunden: 73 nach 6 Versuchen"]);
      },
    },
  ],
});

/* ====================================================================== */
/*  PYTHON 4 – Projekte                                                     */
/* ====================================================================== */
window.KURS_COURSES.push({
  id: "py4",
  lang: "python",
  langLabel: "Python",
  emoji: "🛠️",
  title: "Python-Projekte",
  desc: "Kleine Programme zum Anwenden: Taschenrechner, Notenschnitt, Quiz, Passwort-Check, Textanalyse und ein Textabenteuer.",
  lessons: [
    {
      title: "Projekt 1: Taschenrechner",
      content: `
        <p>Du baust eine Funktion, die zwei Zahlen und ein Rechenzeichen bekommt und das Ergebnis zurückgibt. Dafür brauchst du <b>Funktionen</b> (${c("def")} und ${c("return")}) und <b>Verzweigungen</b> (${c("if / elif / else")}).</p>
        ${ex('def rechne(a, op, b):\n    if op == "+":\n        return a + b\n    elif op == "-":\n        return a - b\n    else:\n        return "Unbekanntes Rechenzeichen"\n\nprint(rechne(2, "+", 3))   # 5\nprint(rechne(2, "?", 3))   # Unbekanntes Rechenzeichen')}
        <p>Besonders wichtig bei einem Rechner: <b>Division durch null</b> ist nicht erlaubt. Prüfe das vorher, damit das Programm nicht abstürzt, und gib stattdessen einen Hinweistext zurück.</p>
        ${tip("Eine Funktion darf mal eine Zahl und mal einen Text zurückgeben. Python ist da flexibel. In größeren Programmen wäre ein Fehler (Exception) sauberer, aber so bleibt es für den Anfang einfach.")}`,
      task: "Schreibe <code>rechne(a, op, b)</code> für <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>. Bei <code>/</code> mit <code>b == 0</code> soll der Text <code>Division durch 0 geht nicht</code> zurückgegeben werden. Erwartet: <code>9</code>, <code>42</code>, <code>4.5</code> und der Text.",
      starter: '# def rechne(a, op, b):\n#     ...\n\nprint(rechne(6, "+", 3))\nprint(rechne(7, "*", 6))\nprint(rechne(9, "/", 2))\nprint(rechne(1, "/", 0))\n',
      hint: 'if op == "+": return a + b\nelif ... für -, *, /\nBei "/" zuerst prüfen: if b == 0: return "Division durch 0 geht nicht"',
      solution: 'def rechne(a, op, b):\n    if op == "+":\n        return a + b\n    elif op == "-":\n        return a - b\n    elif op == "*":\n        return a * b\n    elif op == "/":\n        if b == 0:\n            return "Division durch 0 geht nicht"\n        return a / b\n    else:\n        return "Unbekanntes Rechenzeichen"\n\nprint(rechne(6, "+", 3))\nprint(rechne(7, "*", 6))\nprint(rechne(9, "/", 2))\nprint(rechne(1, "/", 0))',
      check: ({ output, code }) => {
        if (!/def\s+rechne\s*\(/.test(code)) return "Definiere die Funktion rechne.";
        return expectOutput(output, ["9", "42", "4.5", "Division durch 0 geht nicht"]);
      },
    },
    {
      title: "Projekt 2: Notenschnitt",
      content: `
        <p>Ein Dictionary eignet sich ideal, um Fächer und Noten zu speichern: Der <b>Schlüssel</b> ist das Fach, der <b>Wert</b> die Note. Du brauchst:</p>
        <ul>
          <li>${c("sum(noten.values())")}: die Summe aller Werte,</li>
          <li>${c("len(noten)")}: die Zahl der Einträge,</li>
          <li>${c("min(noten, key=noten.get)")}: der <b>Schlüssel</b> mit dem kleinsten Wert (also die beste Note).</li>
        </ul>
        ${ex('noten = {"Mathe": 2, "Sport": 1}\nprint(sum(noten.values()) / len(noten))   # 1.5\nprint(min(noten, key=noten.get))             # Sport\nprint(noten["Sport"])                        # 1')}
        <p>Mit ${c("round(zahl, 1)")} rundest du auf eine Nachkommastelle.</p>
        ${tip("In Deutschland ist <b>1</b> die beste Note, deshalb ist die beste Note der <b>kleinste</b> Wert.")}`,
      task: "Gib den Durchschnitt (eine Nachkommastelle), das Fach mit der besten und das mit der schlechtesten Note aus. Erwartet: <code>Durchschnitt: 2.0</code>, <code>Beste Note: Englisch (1)</code>, <code>Schlechteste Note: Deutsch (3)</code>.",
      starter: 'noten = {"Mathe": 2, "Deutsch": 3, "Englisch": 1, "Sport": 2}\n\n',
      hint: 'durchschnitt = sum(noten.values()) / len(noten)\nbeste = min(noten, key=noten.get)\nschlechteste = max(noten, key=noten.get)\nDann je ein print mit f-String, Note über noten[beste].',
      solution: 'noten = {"Mathe": 2, "Deutsch": 3, "Englisch": 1, "Sport": 2}\ndurchschnitt = sum(noten.values()) / len(noten)\nbeste = min(noten, key=noten.get)\nschlechteste = max(noten, key=noten.get)\nprint(f"Durchschnitt: {round(durchschnitt, 1)}")\nprint(f"Beste Note: {beste} ({noten[beste]})")\nprint(f"Schlechteste Note: {schlechteste} ({noten[schlechteste]})")',
      check: ({ output }) => expectOutput(output, ["Durchschnitt: 2.0", "Beste Note: Englisch (1)", "Schlechteste Note: Deutsch (3)"]),
    },
    {
      title: "Projekt 3: Quiz-Auswertung",
      content: `
        <p>Ein Quiz besteht aus Fragen mit richtigen Antworten und den Antworten des Spielers. Du vergleichst beide Listen Stück für Stück. Mit ${c("enumerate")} bekommst du Index <b>und</b> Element gleichzeitig, und mit ${c("zip")} gehst du zwei Listen parallel durch:</p>
        ${ex('antworten = ["Paris", "8"]\nrichtig = ["Paris", "6"]\nfor nr, (a, r) in enumerate(zip(antworten, richtig), start=1):\n    print(nr, a == r)\n# 1 True\n# 2 False')}
        <p>Mit ${c(".lower()")} ignorierst du Groß- und Kleinschreibung beim Vergleichen. Den Prozentwert rechnest du mit ${c("round(richtige / gesamt * 100)")}.</p>`,
      task: "Vergleiche <code>antworten</code> mit den richtigen Antworten in <code>fragen</code> (Groß-/Kleinschreibung egal). Gib je Frage <code>Frage 1: richtig</code> bzw. <code>falsch</code> aus und am Ende <code>Ergebnis: 2 von 3 (67 %)</code>.",
      starter: 'fragen = [("Hauptstadt von Frankreich?", "Paris"), ("2 + 2 * 2?", "6"), ("Größter Planet?", "Jupiter")]\nantworten = ["paris", "8", "Jupiter"]\n\n',
      hint: 'richtige = 0\nfor nr, (frage, loesung) in enumerate(fragen, start=1):\n    if antworten[nr - 1].lower() == loesung.lower(): ...',
      solution: 'fragen = [("Hauptstadt von Frankreich?", "Paris"), ("2 + 2 * 2?", "6"), ("Größter Planet?", "Jupiter")]\nantworten = ["paris", "8", "Jupiter"]\nrichtige = 0\nfor nr, (frage, loesung) in enumerate(fragen, start=1):\n    if antworten[nr - 1].lower() == loesung.lower():\n        print(f"Frage {nr}: richtig")\n        richtige = richtige + 1\n    else:\n        print(f"Frage {nr}: falsch")\nprint(f"Ergebnis: {richtige} von {len(fragen)} ({round(richtige / len(fragen) * 100)} %)")',
      check: ({ output }) => expectOutput(output, ["Frage 1: richtig", "Frage 2: falsch", "Frage 3: richtig", "Ergebnis: 2 von 3 (67 %)"]),
    },
    {
      title: "Projekt 4: Passwort-Check",
      content: `
        <p>Ein gutes Passwort ist <b>lang</b> und mischt <b>Ziffern</b> und <b>Großbuchstaben</b>. Du schreibst eine Funktion, die ein Passwort prüft und eine <b>Liste der Probleme</b> zurückgibt. Eine leere Liste bedeutet: alles in Ordnung.</p>
        <p>Nützliche String-Methoden:</p>
        ${ex('print("a1".isdigit())      # False (nicht nur Ziffern)\nprint("7".isdigit())       # True\nprint("A".isupper())       # True\nprint(len("geheim"))       # 6')}
        <p>Um zu prüfen, ob <b>irgendein</b> Zeichen eine Ziffer ist, gehst du mit einer Schleife durch den Text und merkst dir das Ergebnis in einer Variable, zum Beispiel ${c("hat_zahl = False")}, die du bei einem Treffer auf ${c("True")} setzt.</p>
        ${warn("Speichere echte Passwörter <b>nie</b> im Klartext und baue Regeln wie diese nur als Hilfe für Nutzer ein. Sicherheit entsteht erst durch Länge und Zufall.")}`,
      task: "Schreibe <code>pruefe(passwort)</code>, das eine Liste der Probleme zurückgibt, in dieser Reihenfolge: <code>zu kurz</code> (unter 8 Zeichen), <code>keine Zahl</code>, <code>kein Großbuchstabe</code>. Erwartet: <code>['zu kurz', 'keine Zahl', 'kein Großbuchstabe']</code> und <code>[]</code>.",
      starter: '# def pruefe(passwort):\n#     probleme = []\n#     ...\n#     return probleme\n\nprint(pruefe("abc"))\nprint(pruefe("Abcdefg1"))\n',
      hint: 'Merke dir mit zwei Variablen hat_zahl und hat_gross, ob du beim Durchgehen eine Ziffer (isdigit) bzw. einen Großbuchstaben (isupper) gefunden hast. Danach hängst du je nach Ergebnis mit append den Text an.',
      solution: 'def pruefe(passwort):\n    probleme = []\n    hat_zahl = False\n    hat_gross = False\n    for zeichen in passwort:\n        if zeichen.isdigit():\n            hat_zahl = True\n        if zeichen.isupper():\n            hat_gross = True\n    if len(passwort) < 8:\n        probleme.append("zu kurz")\n    if not hat_zahl:\n        probleme.append("keine Zahl")\n    if not hat_gross:\n        probleme.append("kein Großbuchstabe")\n    return probleme\n\nprint(pruefe("abc"))\nprint(pruefe("Abcdefg1"))',
      check: ({ output, code }) => {
        if (!/def\s+pruefe\s*\(/.test(code)) return "Definiere die Funktion pruefe.";
        return expectOutput(output, ["['zu kurz', 'keine Zahl', 'kein Großbuchstabe']", "[]"]);
      },
    },
    {
      title: "Projekt 5: Textanalyse",
      content: `
        <p>Programme, die Text auswerten, stecken in Suchmaschinen und Rechtschreibprüfungen. Mit wenigen Methoden bekommst du schon viel heraus:</p>
        ${ex('text = "Hallo schöne Welt Hallo"\nworte = text.split()                  # [\'Hallo\', \'schöne\', \'Welt\', \'Hallo\']\nprint(len(worte))                     # 4\nprint(max(worte, key=len))            # schöne (längstes Wort)\nprint(worte.count("Hallo"))           # 2')}
        <ul>
          <li>${c("text.split()")} zerlegt den Text an den Leerzeichen in eine Liste von Wörtern.</li>
          <li>${c("max(liste, key=len)")} liefert das <b>längste</b> Element. Bei Gleichstand das erste.</li>
          <li>${c("liste.count(x)")} zählt, wie oft ${c("x")} vorkommt.</li>
        </ul>`,
      task: "Analysiere <code>text</code> und gib aus: <code>Wörter: 9</code>, <code>Längstes Wort: Programmieren</code> und <code>Python: 2</code> (wie oft das Wort <code>Python</code> vorkommt).",
      starter: 'text = "Python macht Spaß und Programmieren macht Python noch besser"\n\n',
      hint: 'worte = text.split()\nprint(f"Wörter: {len(worte)}")\nprint(f"Längstes Wort: {max(worte, key=len)}")\nprint(f"Python: {worte.count(\'Python\')}")',
      solution: 'text = "Python macht Spaß und Programmieren macht Python noch besser"\nworte = text.split()\nprint(f"Wörter: {len(worte)}")\nprint(f"Längstes Wort: {max(worte, key=len)}")\nprint(f"Python: {worte.count(\'Python\')}")',
      check: ({ output }) => expectOutput(output, ["Wörter: 9", "Längstes Wort: Programmieren", "Python: 2"]),
    },
    {
      title: "Projekt 6: Würfelstatistik",
      content: `
        <p>Du wertest eine Liste von Würfen aus: Wie viele Sechser, wie hoch ist die Summe, wie hoch der Durchschnitt? Ein Spiel hängt oft an solchen Zahlen.</p>
        ${ex("wuerfe = [3, 6, 2, 6]\nprint(sum(wuerfe))            # 17\nprint(wuerfe.count(6))        # 2\nprint(sum(wuerfe) / len(wuerfe))   # 4.25")}
        <p>Möchtest du eine Zahl auf <b>zwei Nachkommastellen</b> ausgeben, hilft der Formatierungsteil in einem f-String: ${c('f"{x:.2f}"')}. Das ${c(":.2f")} steht für „Kommazahl mit 2 Stellen“.</p>
        ${tip("Echte Zufallswürfe holst du mit <code>import random</code> und <code>random.randint(1, 6)</code>. Hier nutzen wir feste Würfe, damit das Ergebnis immer gleich ist und geprüft werden kann.")}`,
      task: "Gib für <code>wuerfe</code> aus: <code>Summe: 28</code>, <code>Sechser: 3</code> und <code>Durchschnitt: 4.00</code> (zwei Nachkommastellen).",
      starter: "wuerfe = [3, 6, 2, 6, 6, 1, 4]\n\n",
      hint: 'print(f"Summe: {sum(wuerfe)}")\nprint(f"Sechser: {wuerfe.count(6)}")\nprint(f"Durchschnitt: {sum(wuerfe) / len(wuerfe):.2f}")',
      solution: 'wuerfe = [3, 6, 2, 6, 6, 1, 4]\nprint(f"Summe: {sum(wuerfe)}")\nprint(f"Sechser: {wuerfe.count(6)}")\nprint(f"Durchschnitt: {sum(wuerfe) / len(wuerfe):.2f}")',
      check: ({ output }) => expectOutput(output, ["Summe: 28", "Sechser: 3", "Durchschnitt: 4.00"]),
    },
    {
      title: "Projekt 7: Einkaufsliste",
      content: `
        <p>Du rechnest eine Einkaufsliste mit Mengen und Preisen aus. Zwei Dictionaries hängen über den <b>gleichen Schlüssel</b> zusammen: Der Produktname verbindet Preis und Menge.</p>
        ${ex('preise = {"Apfel": 0.5, "Brot": 2.2}\nmenge = {"Apfel": 4, "Brot": 1}\nfor name in preise:\n    posten = preise[name] * menge[name]\n    print(name, posten)   # Apfel 2.0 / Brot 2.2')}
        <p>Mit ${c("max(dictionary, key=...)")} findest du den Schlüssel mit dem größten Wert. Um eine Summe als Geldbetrag auszugeben, nimmst du ${c(":.2f")}: ${c('f"{summe:.2f} €"')}.</p>
        ${warn("Bei Geld sind Kommazahlen (float) in Python nicht ganz genau (0.1 + 0.2 ist 0.30000000000000004). Für die Ausgabe auf 2 Stellen reicht das, echte Buchhaltung rechnet in Cent als ganzen Zahlen.")}`,
      task: "Berechne die Summe und den teuersten Posten (Preis mal Menge). Erwartet: <code>Summe: 7.40 €</code> und <code>Teuerster Posten: Apfel</code>.",
      starter: 'preise = {"Apfel": 0.5, "Brot": 2.2, "Milch": 1.1}\nmenge = {"Apfel": 6, "Brot": 1, "Milch": 2}\n\n',
      hint: 'posten = {}\nfor name in preise:\n    posten[name] = preise[name] * menge[name]\nsumme = sum(posten.values())\nteuerster = max(posten, key=posten.get)',
      solution: 'preise = {"Apfel": 0.5, "Brot": 2.2, "Milch": 1.1}\nmenge = {"Apfel": 6, "Brot": 1, "Milch": 2}\nposten = {}\nfor name in preise:\n    posten[name] = preise[name] * menge[name]\nsumme = sum(posten.values())\nteuerster = max(posten, key=posten.get)\nprint(f"Summe: {summe:.2f} €")\nprint(f"Teuerster Posten: {teuerster}")',
      check: ({ output }) => expectOutput(output, ["Summe: 7.40 €", "Teuerster Posten: Apfel"]),
    },
    {
      title: "Projekt 8: Textabenteuer",
      content: `
        <p>Ein <b>Textabenteuer</b> ist ein Spiel nur aus Text: „Du bist im Flur. Gehst du links oder rechts?“ Die Räume und ihre Verbindungen speicherst du in einem <b>verschachtelten Dictionary</b>: Jeder Raum hat ein eigenes Dictionary mit den möglichen Wegen.</p>
        ${ex('raeume = {\n    "Flur": {"links": "Küche", "rechts": "Bad"},\n    "Küche": {"zurück": "Flur"},\n}\nprint(raeume["Flur"]["links"])      # Küche\nprint("oben" in raeume["Flur"])     # False')}
        <p>Du bewegst dich, indem du den aktuellen Raum auf das Ziel setzt: ${c("ort = raeume[ort][richtung]")}. Vorher prüfst du mit ${c("in")}, ob es den Weg überhaupt gibt, sonst würde ein ${c("KeyError")} auftreten.</p>
        <p>Das ist eine kleine <b>Zustandsmaschine</b>: Das Programm merkt sich den aktuellen Zustand (den Ort) und ändert ihn bei jeder Eingabe. Dieses Muster steckt in vielen Spielen und Programmen.</p>`,
      task: "Gehe die Züge in <code>zuege</code> der Reihe nach. Gibt es den Weg, setze den Ort um und gib <code>Du bist in: &lt;Ort&gt;</code> aus, sonst <code>Da geht es nicht weiter</code>. Erwartet: Küche, Nicht-weiter, Flur, Bad.",
      starter: 'raeume = {\n    "Flur": {"links": "Küche", "rechts": "Bad"},\n    "Küche": {"zurück": "Flur"},\n    "Bad": {"zurück": "Flur"},\n}\nort = "Flur"\nzuege = ["links", "oben", "zurück", "rechts"]\n\n',
      hint: 'for zug in zuege:\n    if zug in raeume[ort]:\n        ort = raeume[ort][zug]\n        print(f"Du bist in: {ort}")\n    else:\n        print("Da geht es nicht weiter")',
      solution: 'raeume = {\n    "Flur": {"links": "Küche", "rechts": "Bad"},\n    "Küche": {"zurück": "Flur"},\n    "Bad": {"zurück": "Flur"},\n}\nort = "Flur"\nzuege = ["links", "oben", "zurück", "rechts"]\nfor zug in zuege:\n    if zug in raeume[ort]:\n        ort = raeume[ort][zug]\n        print(f"Du bist in: {ort}")\n    else:\n        print("Da geht es nicht weiter")',
      check: ({ output, code }) => {
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife über zuege.";
        return expectOutput(output, ["Du bist in: Küche", "Da geht es nicht weiter", "Du bist in: Flur", "Du bist in: Bad"]);
      },
    },
  ],
});

window.KURS_HINTS.py3 = [
  "Merke dir die kleinste Zahl in einer Variable und vergleiche jede weitere Zahl damit. Ist sie kleiner, wird sie die neue kleinste.",
  "Gehe die Positionen der Liste durch. Beim ersten Treffer gibst du sofort die Position zurück, erst nach der Schleife das Zeichen für „nicht gefunden“.",
  "Zuerst die Sonderfälle (kleiner als 2), dann alle möglichen Teiler probieren. Findest du einen, ist es keine Primzahl.",
  "Wiederhole in einer while-Schleife, bis b gleich 0 ist: a wird zu b, b wird zum Rest von a geteilt durch b. Am Ende ist a das Ergebnis.",
  "In der inneren Schleife vergleichst du immer zwei Nachbarn. Steht der linke Wert über dem rechten, tauschst du die beiden.",
  "sorted() bekommt als zweites Argument entweder key (nach welcher Funktion sortiert wird) oder reverse (für absteigend).",
  "Schaue immer in die Mitte. Ist der Wert dort zu klein, suchst du rechts weiter, ist er zu groß, links. Danach verschiebst du links oder rechts.",
  "Die Abbruchbedingung ist der kleinste Fall (0 oder 1 hat die Fakultät 1). Sonst rechnest du n mal die Fakultät von einer kleineren Zahl.",
  "Die ersten beiden Werte (0 und 1) sind die Abbruchbedingung. Für alle anderen addierst du die zwei vorherigen Fibonacci-Zahlen.",
  "Rate immer die Mitte von unten und oben. Je nach Ergebnis änderst du unten oder oben und zählst jeden Versuch mit.",
];
window.KURS_HINTS.py4 = [
  "Prüfe das Rechenzeichen mit if und elif. Vor der Division kontrollierst du, ob der zweite Wert 0 ist.",
  "Die Summe aller Noten liefert sum(noten.values()). Das Fach mit der besten Note findest du mit min, mit der schlechtesten mit max (beide mit key=noten.get).",
  "Gehe Frage und richtige Antwort gemeinsam durch und vergleiche beide Texte nach lower(). Zähle die richtigen mit einer Variablen mit.",
  "Gehe alle Zeichen des Passworts durch und merke dir in zwei Variablen, ob du eine Ziffer und einen Großbuchstaben gesehen hast. Zum Schluss prüfst du die drei Regeln.",
  "Mit split() bekommst du die Wörter. Länge ist len, das längste Wort findest du mit max und key=len, das Zählen übernimmt count.",
  "sum() liefert die Summe, count(6) die Sechser. Den Durchschnitt teilst du durch len und formatierst ihn mit :.2f.",
  "Rechne für jeden Namen Preis mal Menge aus und sammle die Ergebnisse. Summe und teuerster Posten ergeben sich daraus.",
  "Prüfe mit in, ob die Richtung im aktuellen Raum möglich ist. Dann wechselst du den Ort und gibst ihn aus, sonst die Meldung.",
];
})();
