/* ══════════════════════════════════
   PROGRAMMIERKURSE – Kursdaten (aus dem CodingKurs-Projekt übernommen, unverändert bis auf die Kapselung und die Prüfung der input()-Lektion von Python 1: dort steht die Eingabeaufforderung mit in der Ausgabe, deshalb prüft sie jetzt „enthält Hallo, “ statt „beginnt mit Hallo“).
   5 Kurse: Python für Einsteiger, Python für Fortgeschrittene, JavaScript für Einsteiger, HTML, CSS (zusammen 67 Lektionen).
   Jede Lektion hat title, content (HTML), task, starter, hint, solution und check(ctx). check bekommt { output, code, win, doc } und gibt
   true (richtig) oder einen Fehlertext zurück. Die sanften Tipps stehen in KURS_HINTS (gleiche Reihenfolge wie die Lektionen).
   Eingebunden über window.KURS_COURSES und window.KURS_HINTS (genutzt von apps/kurs.js).
══════════════════════════════════ */
(() => {
// Kursdaten, Teil 1: Hilfsfunktionen + Python-Kurse.
// Jede Lektion hat: title, content (HTML), task, starter, hint, solution, check(ctx)
// check bekommt { output, code, win, doc } und gibt true (richtig) oder einen Fehlertext (String) zurück.

const COURSES = [];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ex = (s) => "<pre><code>" + esc(s.replace(/^\n+|\s+$/g, "")) + "</code></pre>"; // Codebeispiel
const c = (s) => "<code>" + esc(s) + "</code>"; // Inline-Code
const tip = (h) => '<div class="tip"><b>💡 Merke:</b> ' + h + "</div>";
const warn = (h) => '<div class="warn"><b>⚠️ Häufiger Fehler:</b> ' + h + "</div>";

const lines = (out) => out.trim().split("\n").map((l) => l.trim());
const expectOutput = (out, expected) => {
  const got = lines(out).join("\n");
  const want = expected.join("\n");
  return got === want
    ? true
    : "Erwartet:\n" + want + "\n\nDeine Ausgabe:\n" + (got || "(nichts ausgegeben)");
};

/* ====================================================================== */
/*  PYTHON 1 – Einsteiger                                                  */
/* ====================================================================== */
COURSES.push({
  id: "py1",
  lang: "python",
  langLabel: "Python",
  emoji: "🐍",
  title: "Python für Einsteiger",
  desc: "Ganz von vorn, in kleinen Schritten: print, Variablen, Rechnen, Entscheidungen, Schleifen, Listen, Funktionen.",
  lessons: [
    {
      title: "Dein erstes Programm",
      content: `
        <p>Ein <b>Programm</b> ist eine Liste von Anweisungen für den Computer. Er führt sie <b>von oben nach unten</b> aus, eine nach der anderen.</p>
        <p>Die wichtigste erste Anweisung heißt ${c("print")}. Sie zeigt etwas auf dem Bildschirm an (rechts unter „Ausgabe“).</p>
        ${ex('print("Hallo Welt")')}
        <p>Schritt für Schritt:</p>
        <ul>
          <li>${c("print")} ist der Befehl.</li>
          <li>Die <b>runden Klammern</b> ${c("( )")} gehören dazu. In ihnen steht, <i>was</i> angezeigt werden soll.</li>
          <li>Text steht immer in <b>Anführungszeichen</b> ${c('" "')}. Text nennt man in der Programmierung <b>String</b> („Zeichenkette“).</li>
        </ul>
        ${tip("Klick bei jedem Beispiel auf „In den Editor laden“ und dann auf „Ausführen“. Ausprobieren ist der beste Weg zum Lernen!")}
        ${warn("Python unterscheidet Groß- und Kleinschreibung. " + c("Print") + " funktioniert nicht, es muss " + c("print") + " heißen. Und vergiss das Anführungszeichen am Ende nicht, sonst gibt es einen " + c("SyntaxError") + ".")}`,
      task: "Im Editor steht schon ein Programm. Ändere den Text so, dass <code>Ich lerne Programmieren</code> ausgegeben wird.",
      starter: 'print("Hallo Welt")\n',
      hint: 'Ersetze nur den Text zwischen den Anführungszeichen: print("Ich lerne Programmieren")',
      solution: 'print("Ich lerne Programmieren")',
      check: ({ output }) => expectOutput(output, ["Ich lerne Programmieren"]),
    },
    {
      title: "Mehrere Zeilen & Kommentare",
      content: `
        <p>Jedes ${c("print")} beginnt eine <b>neue Zeile</b>. Die Reihenfolge im Code ist die Reihenfolge in der Ausgabe.</p>
        ${ex('print("Erst das")\nprint("dann das")')}
        <p>Mit dem Zeichen ${c("#")} schreibst du einen <b>Kommentar</b>. Alles hinter dem ${c("#")} ignoriert Python. Kommentare sind Notizen für Menschen.</p>
        ${ex('# Das ist ein Kommentar, er wird nicht ausgeführt\nprint("Hallo")  # auch hier hinten geht es')}
        ${tip("Du kannst Kommentare auch nutzen, um eine Zeile kurz „auszuschalten“, ohne sie zu löschen.")}`,
      task: "Ersetze die Kommentare durch Code, sodass drei Zeilen erscheinen: <code>Erste Zeile</code>, <code>Zweite Zeile</code>, <code>Dritte Zeile</code>.",
      starter: 'print("Erste Zeile")\n# hier die zweite Zeile ausgeben\n# hier die dritte Zeile ausgeben\n',
      hint: 'Schreibe zwei weitere print-Zeilen mit dem passenden Text.',
      solution: 'print("Erste Zeile")\nprint("Zweite Zeile")\nprint("Dritte Zeile")',
      check: ({ output }) => expectOutput(output, ["Erste Zeile", "Zweite Zeile", "Dritte Zeile"]),
    },
    {
      title: "Variablen: Werte merken",
      content: `
        <p>Eine <b>Variable</b> ist wie eine beschriftete Schachtel: Du legst einen Wert hinein und kannst ihn später über den Namen wieder holen.</p>
        ${ex('tier = "Katze"\nprint(tier)')}
        <ul>
          <li>${c("tier")} ist der <b>Name</b> der Variable.</li>
          <li>Das Zeichen ${c("=")} bedeutet hier „speichere rechts in links“, nicht „ist gleich“.</li>
          <li>${c("print(tier)")} zeigt den <b>Inhalt</b> an. Beachte: ohne Anführungszeichen! Mit ${c('print("tier")')} würde das Wort „tier“ erscheinen.</li>
        </ul>
        <p>Du kannst den Inhalt später überschreiben:</p>
        ${ex('zahl = 5\nzahl = 10\nprint(zahl)   # 10')}
        ${tip("Variablennamen: nur Buchstaben, Zahlen und <code>_</code>, nicht mit einer Zahl beginnen, keine Leerzeichen. Gute Namen sagen, was drin ist: <code>alter</code>, <code>vorname</code>.")}`,
      task: "Lege eine Variable <code>stadt</code> an, die den Text <code>Berlin</code> enthält, und gib sie mit <code>print</code> aus.",
      starter: "# stadt = ...\n# print(...)\n",
      hint: 'stadt = "Berlin" und danach print(stadt)',
      solution: 'stadt = "Berlin"\nprint(stadt)',
      check: ({ output, code }) => {
        if (!/stadt\s*=/.test(code)) return "Lege die Variable stadt mit = an.";
        return expectOutput(output, ["Berlin"]);
      },
    },
    {
      title: "Rechnen mit Zahlen",
      content: `
        <p>Python ist ein guter Taschenrechner. Zahlen schreibst du <b>ohne</b> Anführungszeichen.</p>
        ${ex('print(5 + 3)    # 8\nprint(10 - 4)   # 6\nprint(6 * 7)    # 42\nprint(9 / 2)    # 4.5')}
        <p>Du kannst auch mit Variablen rechnen. Python setzt dann den gespeicherten Wert ein:</p>
        ${ex('a = 4\nb = 5\nsumme = a + b\nprint(summe)   # 9')}
        <p>Ablauf: Python berechnet zuerst die <b>rechte Seite</b> (${c("a + b")} = 9) und speichert das Ergebnis dann in ${c("summe")}.</p>
        ${tip("Zahlen ohne Komma heißen <code>int</code> (ganze Zahlen), Zahlen mit Komma <code>float</code>. Python schreibt das Komma als <b>Punkt</b>: <code>2.5</code>.")}
        ${warn(c('"5" + "3"') + " ergibt " + c("53") + " (Text wird zusammengeklebt), " + c("5 + 3") + " ergibt " + c("8") + ". Anführungszeichen machen den Unterschied!")}`,
      task: "<code>a</code> ist 8 und <code>b</code> ist 3. Gib in drei Zeilen aus: die Summe, die Differenz (a − b) und das Produkt (a · b).",
      starter: "a = 8\nb = 3\n\n# print(a + b)\n",
      hint: "Drei print-Zeilen: print(a + b), print(a - b), print(a * b)",
      solution: "a = 8\nb = 3\nprint(a + b)\nprint(a - b)\nprint(a * b)",
      check: ({ output, code }) => {
        if (!/a\s*[+\-*]\s*b/.test(code)) return "Rechne mit den Variablen a und b.";
        return expectOutput(output, ["11", "5", "24"]);
      },
    },
    {
      title: "Mehr Rechenzeichen: //, % und **",
      content: `
        <p>Neben den bekannten gibt es drei besondere Rechenzeichen:</p>
        <ul>
          <li>${c("//")} <b>Ganzzahl-Division</b>: wie oft passt die Zahl rein, ohne Rest. ${c("23 // 5")} ist ${c("4")}.</li>
          <li>${c("%")} <b>Rest</b> (Modulo): was übrig bleibt. ${c("23 % 5")} ist ${c("3")}, denn 4·5 = 20 und 23 − 20 = 3.</li>
          <li>${c("**")} <b>Potenz</b>: ${c("2 ** 3")} ist 2·2·2 = ${c("8")}.</li>
        </ul>
        ${ex("print(23 // 5)   # 4\nprint(23 % 5)    # 3\nprint(2 ** 3)    # 8")}
        <p>Warum ist ${c("%")} nützlich? Damit erkennst du zum Beispiel <b>gerade Zahlen</b>: ${c("zahl % 2")} ist bei geraden Zahlen ${c("0")}.</p>
        ${tip("Es gilt „Punkt vor Strich“ wie in der Mathematik. Mit Klammern bestimmst du die Reihenfolge selbst: <code>(2 + 3) * 4</code> ist 20.")}`,
      task: "Gib nacheinander aus: <code>17 // 5</code>, <code>17 % 5</code> und <code>2 ** 5</code>.",
      starter: "# drei print-Zeilen\n",
      hint: "print(17 // 5)   print(17 % 5)   print(2 ** 5)",
      solution: "print(17 // 5)\nprint(17 % 5)\nprint(2 ** 5)",
      check: ({ output }) => expectOutput(output, ["3", "2", "32"]),
    },
    {
      title: "Text zusammenbauen (f-Strings)",
      content: `
        <p>Oft willst du Text und Variablen mischen, etwa „Anna ist 12 Jahre alt“. Dafür gibt es den <b>f-String</b>: ein ${c("f")} vor den Anführungszeichen, und Variablen kommen in geschweifte Klammern ${c("{ }")}.</p>
        ${ex('name = "Max"\nalter = 14\nprint(f"{name} ist {alter} Jahre alt.")')}
        <p>Python ersetzt ${c("{name}")} durch den Inhalt der Variable. Es geht sogar mit Rechnungen:</p>
        ${ex('print(f"In 5 Jahren bist du {alter + 5}.")')}
        <p>Text kann man auch mit ${c("+")} verbinden, aber nur Text mit Text:</p>
        ${ex('print("Hallo " + name)   # Hallo Max')}
        ${warn(c('"Alter: " + 14') + " geht nicht (Text + Zahl) und gibt einen " + c("TypeError") + ". Mit f-Strings hast du das Problem nicht, deshalb sind sie die beste Wahl.")}`,
      task: "Gib mit einem f-String genau diesen Satz aus: <code>Anna ist 12 Jahre alt.</code>, mit Name und Alter aus den Variablen.",
      starter: 'name = "Anna"\nalter = 12\n\n# print(f"...")\n',
      hint: 'print(f"{name} ist {alter} Jahre alt.")',
      solution: 'name = "Anna"\nalter = 12\nprint(f"{name} ist {alter} Jahre alt.")',
      check: ({ output, code }) => {
        if (!/f["']/.test(code)) return "Benutze einen f-String, also f vor den Anführungszeichen.";
        return expectOutput(output, ["Anna ist 12 Jahre alt."]);
      },
    },
    {
      title: "Eingaben mit input()",
      content: `
        <p>Programme werden spannend, wenn sie mit dem Benutzer reden. ${c("input()")} stellt eine Frage und wartet auf eine Antwort. Die Antwort wird dir als Text zurückgegeben, du speicherst sie in einer Variable.</p>
        ${ex('ort = input("Wo wohnst du? ")\nprint("Du wohnst in " + ort)')}
        <p>Hier im Kurs öffnet sich beim Ausführen ein kleines <b>Eingabefenster</b> im Browser. Tippe etwas ein und bestätige.</p>
        ${tip("<code>input()</code> liefert <b>immer Text</b>, auch wenn du eine Zahl eintippst. Wie du daraus eine Zahl machst, lernst du in der nächsten Lektion.")}`,
      task: "Frage mit <code>input</code> nach dem Namen und gib dann <code>Hallo, </code> gefolgt vom Namen aus.",
      starter: '# name = input("...")\n# print(...)\n',
      hint: 'name = input("Wie heißt du? ")\nprint("Hallo, " + name)',
      solution: 'name = input("Wie heißt du? ")\nprint("Hallo, " + name)',
      check: ({ output, code }) => {
        if (!code.includes("input(")) return "Benutze input().";
        if (!output.includes("Hallo, ")) return 'In der Ausgabe soll "Hallo, " gefolgt vom Namen stehen.';
        return true;
      },
    },
    {
      title: "Datentypen umwandeln",
      content: `
        <p>Jeder Wert hat einen <b>Typ</b>: ${c("str")} (Text), ${c("int")} (ganze Zahl), ${c("float")} (Kommazahl). Mit ${c("type()")} fragst du ihn ab.</p>
        ${ex('print(type("Hallo"))   # str\nprint(type(42))        # int\nprint(type(3.14))      # float')}
        <p>Mit ${c("int()")}, ${c("float()")} und ${c("str()")} wandelst du um:</p>
        ${ex('text = "21"\nzahl = int(text)    # aus "21" wird 21\nprint(zahl + 1)     # 22')}
        <p>Typisches Muster mit ${c("input")}:</p>
        ${ex('alter = int(input("Alter? "))\nprint(alter + 1)')}
        ${warn("Ohne <code>int()</code> wäre das Alter ein Text, und <code>\"14\" + 1</code> gibt einen Fehler.")}`,
      task: "<code>zahl_text</code> ist der Text <code>\"21\"</code>. Wandle ihn mit <code>int()</code> in eine Zahl um und gib das Doppelte aus (<code>42</code>).",
      starter: 'zahl_text = "21"\n\n',
      hint: "zahl = int(zahl_text)  und dann print(zahl * 2)",
      solution: 'zahl_text = "21"\nzahl = int(zahl_text)\nprint(zahl * 2)',
      check: ({ output, code }) => {
        if (!code.includes("int(")) return "Benutze int().";
        return expectOutput(output, ["42"]);
      },
    },
    {
      title: "Entscheidungen mit if",
      content: `
        <p>Bisher lief alles stur von oben nach unten. Mit ${c("if")} („wenn“) führt Python Code nur aus, <b>wenn eine Bedingung stimmt</b>.</p>
        ${ex('punkte = 12\nif punkte > 10:\n    print("Gewonnen!")\nprint("Spiel vorbei")')}
        <p>So liest du das:</p>
        <ul>
          <li>${c("if punkte > 10:")}: „Wenn punkte größer als 10 ist …“ Der <b>Doppelpunkt</b> am Ende ist Pflicht.</li>
          <li>Der <b>eingerückte</b> Block (4 Leerzeichen) läuft nur, wenn die Bedingung wahr ist.</li>
          <li>${c('print("Spiel vorbei")')} ist nicht eingerückt und läuft <b>immer</b>.</li>
        </ul>
        <p>Vergleichszeichen: ${c(">")} größer, ${c("<")} kleiner, ${c(">=")} größer oder gleich, ${c("<=")} kleiner oder gleich, ${c("==")} gleich, ${c("!=")} ungleich.</p>
        ${warn("Ein einzelnes " + c("=") + " speichert einen Wert. Zum <b>Vergleichen</b> brauchst du " + c("==") + " (zwei Gleichzeichen).")}`,
      task: "Gib <code>Es ist warm</code> aus, wenn <code>temperatur</code> größer als 20 ist.",
      starter: "temperatur = 25\n\n# if ...:\n#     print(...)\n",
      hint: 'if temperatur > 20:\n    print("Es ist warm")   (vier Leerzeichen vor print!)',
      solution: 'temperatur = 25\nif temperatur > 20:\n    print("Es ist warm")',
      check: ({ output, code }) => {
        if (!/\bif\b/.test(code)) return "Benutze if.";
        return expectOutput(output, ["Es ist warm"]);
      },
    },
    {
      title: "else und elif",
      content: `
        <p>Mit ${c("else")} („sonst“) sagst du, was passiert, wenn die Bedingung <b>nicht</b> stimmt. Mit ${c("elif")} („sonst wenn“) prüfst du weitere Fälle.</p>
        ${ex('temperatur = 18\nif temperatur >= 25:\n    print("heiß")\nelif temperatur >= 15:\n    print("mild")\nelse:\n    print("kalt")')}
        <p>Python prüft <b>von oben nach unten</b> und nimmt den <b>ersten</b>, der stimmt. Alles darunter wird übersprungen. Bei 18 stimmt die erste Bedingung nicht (18 ist nicht ≥ 25), die zweite schon, also erscheint „mild“. Wäre die Temperatur 8, würde keine Bedingung stimmen und das <code>else</code> greift: „kalt“.</p>
        ${tip("Nach <code>else</code> steht <b>keine</b> Bedingung, aber auch ein Doppelpunkt.")}`,
      task: "Gib bei <code>punkte</code> ab 90 <code>Sehr gut</code> aus, ab 70 <code>Gut</code>, sonst <code>Weiter üben</code>. Mit 75 Punkten soll <code>Gut</code> erscheinen.",
      starter: "punkte = 75\n\n",
      hint: 'Ein if, ein elif und ein else. Denk an die Doppelpunkte und die Einrückung!',
      solution: 'punkte = 75\nif punkte >= 90:\n    print("Sehr gut")\nelif punkte >= 70:\n    print("Gut")\nelse:\n    print("Weiter üben")',
      check: ({ output, code }) => {
        if (!/\belif\b/.test(code) || !/\belse\b/.test(code)) return "Benutze if, elif und else.";
        return expectOutput(output, ["Gut"]);
      },
    },
    {
      title: "Bedingungen kombinieren (and, or)",
      content: `
        <p>Manchmal müssen <b>mehrere</b> Dinge gleichzeitig stimmen:</p>
        <ul>
          <li>${c("and")} („und“): beide Teile müssen wahr sein.</li>
          <li>${c("or")} („oder“): mindestens ein Teil muss wahr sein.</li>
          <li>${c("not")}: dreht wahr und falsch um.</li>
        </ul>
        ${ex('temperatur = 22\nist_sonnig = True\nif temperatur >= 20 and ist_sonnig:\n    print("Ab ins Schwimmbad!")\nelse:\n    print("Lieber drinnen bleiben")\n\nif temperatur < 5 or temperatur > 35:\n    print("Zu extrem")')}
        <p>${c("True")} und ${c("False")} sind besondere Werte (<b>Wahrheitswerte</b>, Typ ${c("bool")}). Beachte die Großschreibung!</p>
        ${tip("Eine Bedingung kann auch direkt ein Wahrheitswert sein: <code>if ist_sonnig:</code> reicht.")}`,
      task: "Gib <code>Eintritt erlaubt</code> aus, wenn <code>alter</code> mindestens 12 ist <b>und</b> <code>hat_ticket</code> wahr ist, sonst <code>Kein Eintritt</code>.",
      starter: "alter = 16\nhat_ticket = True\n\n",
      hint: "if alter >= 12 and hat_ticket:",
      solution: 'alter = 16\nhat_ticket = True\nif alter >= 12 and hat_ticket:\n    print("Eintritt erlaubt")\nelse:\n    print("Kein Eintritt")',
      check: ({ output, code }) => {
        if (!/\band\b/.test(code)) return "Benutze and.";
        return expectOutput(output, ["Eintritt erlaubt"]);
      },
    },
    {
      title: "Schleifen 1: for und range",
      content: `
        <p>Stell dir vor, du sollst die Zahlen von 1 bis 100 ausgeben. Du willst nicht 100 Mal ${c("print")} tippen! Dafür gibt es <b>Schleifen</b>: Sie wiederholen Code.</p>
        ${ex("for i in range(3, 6):\n    print(i)")}
        <p>Ausgabe: ${c("3")}, ${c("4")}, ${c("5")}. So funktioniert es:</p>
        <ul>
          <li>${c("range(3, 6)")} liefert die Zahlen 3, 4, 5. Die <b>obere Grenze 6 ist nicht dabei</b>.</li>
          <li>${c("i")} ist die <b>Laufvariable</b>. In jedem Durchgang hat sie den nächsten Wert.</li>
          <li>Der <b>eingerückte Block</b> wird bei jedem Durchgang einmal ausgeführt.</li>
        </ul>
        <p>Varianten von ${c("range")}:</p>
        ${ex("range(5)          # 0, 1, 2, 3, 4\nrange(2, 10, 2)  # 2, 4, 6, 8  (Schritt 2)\nrange(5, 0, -1)  # 5, 4, 3, 2, 1")}
        ${warn("Du willst bis 5 zählen? Dann schreibe " + c("range(1, 6)") + ", denn die obere Grenze zählt nicht mit.")}`,
      task: "Gib die Zahlen von 1 bis 5 aus, jede in einer eigenen Zeile.",
      starter: "# for i in range(...):\n#     print(i)\n",
      hint: "for i in range(1, 6):\n    print(i)",
      solution: "for i in range(1, 6):\n    print(i)",
      check: ({ output, code }) => {
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife.";
        return expectOutput(output, ["1", "2", "3", "4", "5"]);
      },
    },
    {
      title: "Schleifen 2: In der Schleife rechnen",
      content: `
        <p>In der Schleife kannst du mit der Laufvariable rechnen. Zum Beispiel die Quadratzahlen:</p>
        ${ex("for i in range(1, 4):\n    print(i * i)   # 1, 4, 9")}
        <p>Besonders mächtig: ein <b>Zwischenergebnis merken</b>. Du legst vor der Schleife eine Variable an und änderst sie bei jedem Durchgang. Beispiel: Malnehmen aller Zahlen von 1 bis 4.</p>
        ${ex("produkt = 1\nfor zahl in range(1, 5):\n    produkt = produkt * zahl\nprint(produkt)   # 24")}
        <p>Die Zeile ${c("produkt = produkt * zahl")} heißt: „Nimm den alten Wert von produkt, multipliziere mit zahl und speichere das wieder in produkt.“</p>
        ${ex("Durchgang | zahl | produkt vorher | produkt nachher\n   1      |  1   |       1        |       1\n   2      |  2   |       1        |       2\n   3      |  3   |       2        |       6\n   4      |  4   |       6        |      24")}
        <p>Genauso funktioniert das <b>Summieren</b>, nur mit ${c("+")} und dem Startwert ${c("0")}: ${c("summe = summe + zahl")}. Kurzform: ${c("summe += zahl")}.</p>
        ${tip("Der Startwert muss zur Rechnung passen: bei <code>+</code> beginnst du mit <code>0</code>, bei <code>*</code> mit <code>1</code>.")}
        ${warn("Das <code>print(...)</code> gehört <b>hinter</b> die Schleife (nicht eingerückt), sonst wird bei jedem Durchgang ausgegeben.")}`,
      task: "Berechne die Summe der Zahlen von 1 bis 10 und gib nur das Ergebnis aus (<code>55</code>).",
      starter: "summe = 0\n# for zahl in range(...):\n#     summe = ...\n# print(summe)\n",
      hint: "for zahl in range(1, 11):\n    summe = summe + zahl\nprint(summe)  # print ohne Einrückung",
      solution: "summe = 0\nfor zahl in range(1, 11):\n    summe = summe + zahl\nprint(summe)",
      check: ({ output, code }) => {
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife.";
        return expectOutput(output, ["55"]);
      },
    },
    {
      title: "Schleifen 3: while",
      content: `
        <p>Die ${c("while")}-Schleife wiederholt, <b>solange</b> eine Bedingung stimmt. Du nutzt sie, wenn du vorher nicht weißt, wie oft.</p>
        ${ex("x = 3\nwhile x > 0:\n    print(x)\n    x = x - 1")}
        <p>Ablauf: 3 &gt; 0 ✔ → Ausgabe 3, x wird 2 → 2 &gt; 0 ✔ → Ausgabe 2, x wird 1 → … → x ist 0, die Bedingung stimmt nicht mehr, die Schleife endet.</p>
        ${warn("Wenn du <code>x = x - 1</code> vergisst, ist x immer 3 und die Schleife läuft <b>ewig</b> (Endlosschleife)! Ändere in der Schleife immer etwas, das die Bedingung irgendwann falsch macht.")}`,
      task: "Zähle mit einer <code>while</code>-Schleife von 3 runter bis 1 und gib danach <code>Los!</code> aus.",
      starter: "x = 3\n\n",
      hint: 'while x > 0:\n    print(x)\n    x = x - 1\nprint("Los!")',
      solution: 'x = 3\nwhile x > 0:\n    print(x)\n    x = x - 1\nprint("Los!")',
      check: ({ output, code }) => {
        if (!/\bwhile\b/.test(code)) return "Benutze eine while-Schleife.";
        return expectOutput(output, ["3", "2", "1", "Los!"]);
      },
    },
    {
      title: "Listen 1: Grundlagen",
      content: `
        <p>Eine <b>Liste</b> speichert mehrere Werte in einer Variable. Sie steht in eckigen Klammern, die Werte sind durch Kommas getrennt.</p>
        ${ex('farben = ["rot", "blau", "grün"]')}
        <p>Auf einzelne Elemente greifst du über den <b>Index</b> zu. Wichtig: Gezählt wird ab <b>0</b>!</p>
        ${ex('print(farben[0])   # rot\nprint(farben[1])   # blau\nprint(farben[-1])  # grün (letztes Element)')}
        <p>Weitere Befehle:</p>
        ${ex('farben.append("gelb")   # hinten anhängen\nprint(len(farben))      # Anzahl: 4')}
        ${tip("Index 0 ist das erste Element. Eine Liste mit 3 Elementen hat die Indizes 0, 1, 2.")}
        ${warn("<code>farben[3]</code> bei einer 3-elementigen Liste gibt einen <code>IndexError</code>, denn es gibt keinen Index 3.")}`,
      task: "Gib das erste Element von <code>farben</code> aus, hänge <code>\"gelb\"</code> an und gib dann die Anzahl der Elemente aus. Erwartet: <code>rot</code> und <code>3</code>.",
      starter: 'farben = ["rot", "blau"]\n\n',
      hint: 'print(farben[0])\nfarben.append("gelb")\nprint(len(farben))',
      solution: 'farben = ["rot", "blau"]\nprint(farben[0])\nfarben.append("gelb")\nprint(len(farben))',
      check: ({ output, code }) => {
        if (!code.includes("append")) return "Benutze append().";
        return expectOutput(output, ["rot", "3"]);
      },
    },
    {
      title: "Listen 2: Durch Listen gehen",
      content: `
        <p>Mit ${c("for")} kannst du direkt jedes Element einer Liste besuchen, ganz ohne Index:</p>
        ${ex('tiere = ["Hund", "Katze", "Maus"]\nfor tier in tiere:\n    print(tier)')}
        <p>Die Variable ${c("tier")} ist in jedem Durchgang das nächste Element. Den Namen kannst du frei wählen, es hilft, wenn er zur Liste passt (Mehrzahl → Einzahl).</p>
        <p>Nützliche Funktionen für Zahlen-Listen:</p>
        ${ex("zahlen = [3, 8, 1]\nprint(sum(zahlen))   # 12\nprint(max(zahlen))   # 8\nprint(min(zahlen))   # 1")}
        <p>Und mit ${c("in")} prüfst du, ob etwas enthalten ist:</p>
        ${ex('print("Hund" in tiere)   # True')}`,
      task: "Berechne mit einer Schleife die Summe aller Zahlen in <code>zahlen</code> und gib sie aus. Gib danach mit <code>max()</code> die größte Zahl aus. Erwartet: <code>18</code> und <code>8</code>.",
      starter: "zahlen = [3, 8, 1, 6]\nsumme = 0\n\n",
      hint: "for zahl in zahlen:\n    summe = summe + zahl\nprint(summe)\nprint(max(zahlen))",
      solution: "zahlen = [3, 8, 1, 6]\nsumme = 0\nfor zahl in zahlen:\n    summe = summe + zahl\nprint(summe)\nprint(max(zahlen))",
      check: ({ output, code }) => {
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife über die Liste.";
        return expectOutput(output, ["18", "8"]);
      },
    },
    {
      title: "Funktionen 1: Eigener Code-Baustein",
      content: `
        <p>Eine <b>Funktion</b> ist ein Block Code mit einem Namen. Einmal geschrieben, kannst du ihn beliebig oft <b>aufrufen</b>, ohne ihn zu wiederholen.</p>
        ${ex('def begruesse():\n    print("Hallo!")\n    print("Schön, dich zu sehen.")\n\nbegruesse()\nbegruesse()')}
        <ul>
          <li>${c("def")} startet die Definition („define“).</li>
          <li>${c("begruesse")} ist der Name, danach ${c("()")} und der Doppelpunkt.</li>
          <li>Der eingerückte Block ist der Inhalt der Funktion.</li>
          <li>Mit ${c("begruesse()")} <b>führst du sie aus</b>. Nur die Definition allein tut noch nichts!</li>
        </ul>
        ${warn("Ohne die Klammern (<code>begruesse</code>) wird die Funktion nicht aufgerufen.")}`,
      task: "Definiere eine Funktion <code>hallo</code>, die <code>Hallo!</code> ausgibt, und rufe sie zweimal auf.",
      starter: "# def hallo():\n#     ...\n\n# hallo()\n# hallo()\n",
      hint: 'def hallo():\n    print("Hallo!")\n\nhallo()\nhallo()',
      solution: 'def hallo():\n    print("Hallo!")\n\nhallo()\nhallo()',
      check: ({ output, code }) => {
        if (!/def\s+hallo\s*\(/.test(code)) return "Definiere die Funktion hallo mit def.";
        return expectOutput(output, ["Hallo!", "Hallo!"]);
      },
    },
    {
      title: "Funktionen 2: Parameter & return",
      content: `
        <p>Funktionen werden mächtig, wenn sie Werte <b>bekommen</b> (Parameter) und ein Ergebnis <b>zurückgeben</b> (${c("return")}).</p>
        ${ex("def multipliziere(a, b):\n    return a * b\n\nergebnis = multipliziere(4, 5)\nprint(ergebnis)   # 20\nprint(multipliziere(3, 7))   # 21")}
        <ul>
          <li>${c("a")} und ${c("b")} sind <b>Parameter</b>: Platzhalter für die Werte beim Aufruf.</li>
          <li>${c("return")} gibt das Ergebnis an die Stelle zurück, wo die Funktion aufgerufen wurde.</li>
          <li>Beim Aufruf ${c("multipliziere(4, 5)")} ist ${c("a = 4")} und ${c("b = 5")}.</li>
        </ul>
        ${tip("<code>return</code> beendet die Funktion sofort. Es gibt das Ergebnis nur zurück, anzeigen musst du es selbst mit <code>print</code>.")}
        ${warn("Ein <code>print</code> in der Funktion ist nicht dasselbe wie ein <code>return</code>. Mit <code>return</code> kannst du das Ergebnis weiterverwenden, z. B. speichern oder damit rechnen.")}`,
      task: "Schreibe die Funktion <code>addiere(a, b)</code>, die die Summe <b>zurückgibt</b>. Gib dann <code>addiere(2, 3)</code> und <code>addiere(10, 20)</code> aus (<code>5</code> und <code>30</code>).",
      starter: "# def addiere(a, b):\n#     return ...\n\n# print(addiere(2, 3))\n",
      hint: "def addiere(a, b):\n    return a + b",
      solution: "def addiere(a, b):\n    return a + b\n\nprint(addiere(2, 3))\nprint(addiere(10, 20))",
      check: ({ output, code }) => {
        if (!/def\s+addiere/.test(code) || !code.includes("return")) return "Definiere addiere mit def und gib mit return zurück.";
        return expectOutput(output, ["5", "30"]);
      },
    },
    {
      title: "Dictionaries",
      content: `
        <p>Eine Liste findet Elemente über eine Nummer. Ein <b>Dictionary</b> („Wörterbuch“) findet sie über einen <b>Namen</b> (Schlüssel). Es besteht aus Paaren <code>schlüssel: wert</code> in geschweiften Klammern.</p>
        ${ex('auto = {"marke": "VW", "jahr": 2015}\nprint(auto["marke"])    # VW')}
        <p>Neue Einträge legst du einfach an, vorhandene überschreibst du:</p>
        ${ex('auto["farbe"] = "blau"\nauto["jahr"] = 2020')}
        <p>Alle Paare durchgehen:</p>
        ${ex("for schluessel, wert in auto.items():\n    print(schluessel, wert)")}
        ${tip("Typische Einsatzzwecke: Eigenschaften einer Sache (Person, Auto, Produkt) oder Zählen („wie oft kommt jedes Wort vor?“).")}
        ${warn("Den Schlüssel gibt es nicht? Dann bekommst du einen <code>KeyError</code>. Mit <code>auto.get(\"x\")</code> bekommst du stattdessen <code>None</code>.")}`,
      task: "Füge <code>\"farbe\": \"blau\"</code> zum Dictionary <code>auto</code> hinzu. Gib dann die Marke und die Farbe aus. Erwartet: <code>VW</code> und <code>blau</code>.",
      starter: 'auto = {"marke": "VW", "jahr": 2015}\n\n',
      hint: 'auto["farbe"] = "blau"\nprint(auto["marke"])\nprint(auto["farbe"])',
      solution: 'auto = {"marke": "VW", "jahr": 2015}\nauto["farbe"] = "blau"\nprint(auto["marke"])\nprint(auto["farbe"])',
      check: ({ output, code }) => {
        if (!/auto\[["']farbe["']\]\s*=/.test(code)) return 'Füge den Eintrag mit auto["farbe"] = ... hinzu.';
        return expectOutput(output, ["VW", "blau"]);
      },
    },
    {
      title: "Mini-Projekt: FizzBuzz",
      content: `
        <p>Ein Klassiker, der zeigt, was du schon alles kannst. Gehe die Zahlen von 1 bis 15 durch:</p>
        <ul>
          <li>durch 3 <b>und</b> 5 teilbar → ${c("FizzBuzz")}</li>
          <li>nur durch 3 teilbar → ${c("Fizz")}</li>
          <li>nur durch 5 teilbar → ${c("Buzz")}</li>
          <li>sonst die Zahl selbst</li>
        </ul>
        <p>Dein Werkzeugkasten: <b>Schleife</b> (${c("for")}), <b>Entscheidungen</b> (${c("if / elif / else")}) und der <b>Rest-Operator</b> (${c("%")}): Eine Zahl ist durch 3 teilbar, wenn ${c("i % 3 == 0")}.</p>
        ${tip("Prüfe <b>zuerst</b> den Fall „durch 3 und 5“ (also durch 15 teilbar). Sonst würde bei 15 schon der „Fizz“-Zweig greifen.")}`,
      task: "Gib FizzBuzz für die Zahlen von 1 bis 15 aus, jede Ausgabe in einer eigenen Zeile.",
      starter: "for i in range(1, 16):\n    # hier prüfen und ausgeben\n    pass\n",
      hint: 'Reihenfolge: if i % 15 == 0 → "FizzBuzz", elif i % 3 == 0 → "Fizz", elif i % 5 == 0 → "Buzz", else → print(i)',
      solution: 'for i in range(1, 16):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
      check: ({ output }) =>
        expectOutput(output, ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]),
    },
  ],
});

/* ====================================================================== */
/*  PYTHON 2 – Fortgeschritten                                             */
/* ====================================================================== */
COURSES.push({
  id: "py2",
  lang: "python",
  langLabel: "Python",
  emoji: "🐍",
  title: "Python für Fortgeschrittene",
  desc: "Strings, Slicing, List Comprehensions, Fehlerbehandlung, Module und Klassen. Baut auf dem Einsteigerkurs auf.",
  lessons: [
    {
      title: "String-Methoden",
      content: `
        <p>Texte haben eingebaute <b>Methoden</b>. Du rufst sie mit einem Punkt hinter dem Text auf. Sie verändern den Text nicht, sondern geben eine neue Version zurück.</p>
        ${ex('text = "  Hallo Welt  "\nprint(text.upper())    # "  HALLO WELT  "\nprint(text.lower())    # "  hallo welt  "\nprint(text.strip())    # "Hallo Welt"  (Leerzeichen am Rand weg)\nprint(text.replace("Welt", "Python"))\nprint(len(text))       # Länge')}
        <p>Mit ${c("split")} zerlegst du Text in eine Liste, mit ${c("join")} setzt du ihn wieder zusammen:</p>
        ${ex('woerter = "a,b,c".split(",")   # ["a", "b", "c"]\nprint("-".join(woerter))      # a-b-c')}
        ${tip("Methoden lassen sich verketten: <code>text.strip().upper()</code> macht erst strip, dann upper.")}`,
      task: "Entferne bei <code>text</code> die Leerzeichen am Rand und mache alles groß. Gib das Ergebnis aus: <code>HALLO WELT</code>.",
      starter: 'text = "  hallo welt  "\n\n',
      hint: "print(text.strip().upper())",
      solution: 'text = "  hallo welt  "\nprint(text.strip().upper())',
      check: ({ output, code }) => {
        if (!code.includes("strip") || !code.includes("upper")) return "Benutze strip() und upper().";
        return expectOutput(output, ["HALLO WELT"]);
      },
    },
    {
      title: "Slicing: Teile von Text und Listen",
      content: `
        <p>Mit eckigen Klammern holst du einzelne Zeichen oder ganze <b>Ausschnitte</b> („Slices“).</p>
        ${ex('wort = "Programm"\nprint(wort[0])      # P  (erstes Zeichen)\nprint(wort[-1])     # m  (letztes Zeichen)\nprint(wort[0:4])    # Prog  (Index 0 bis 3, die 4 ist nicht dabei)\nprint(wort[3:])     # gramm (ab Index 3 bis Ende)\nprint(wort[:3])     # Pro   (Anfang bis Index 2)\nprint(wort[::-1])   # mmargorP (rückwärts)')}
        <p>Genau dasselbe funktioniert bei Listen: ${c("zahlen[1:3]")}.</p>
        ${tip("Bei <code>a:b</code> ist <code>a</code> dabei, <code>b</code> nicht. Wie bei <code>range</code>.")}`,
      task: "Gib vom Wort <code>Programmieren</code> aus: das erste Zeichen, das letzte Zeichen und die ersten vier Zeichen (jeweils eine Zeile). Erwartet: <code>P</code>, <code>n</code>, <code>Prog</code>.",
      starter: 'text = "Programmieren"\n\n',
      hint: "print(text[0])  print(text[-1])  print(text[0:4])",
      solution: 'text = "Programmieren"\nprint(text[0])\nprint(text[-1])\nprint(text[0:4])',
      check: ({ output }) => expectOutput(output, ["P", "n", "Prog"]),
    },
    {
      title: "Listen sortieren & verändern",
      content: `
        <p>Listen haben viele Methoden, die sie direkt <b>verändern</b>:</p>
        ${ex('zahlen = [5, 2, 9]\nzahlen.sort()          # sortiert: [2, 5, 9]\nzahlen.append(7)       # hinten anhängen\nzahlen.insert(0, 1)    # an Index 0 einfügen\nzahlen.remove(9)       # den Wert 9 löschen\nzahlen.reverse()       # umdrehen\nprint(zahlen)')}
        <p>Mit ${c("in")} prüfst du, ob ein Wert enthalten ist:</p>
        ${ex("print(5 in zahlen)   # True")}
        <p>Und ${c("sorted(zahlen)")} gibt eine sortierte <b>Kopie</b> zurück, ohne das Original zu ändern.</p>
        ${warn("<code>zahlen = zahlen.sort()</code> ist ein Klassiker: <code>sort()</code> verändert die Liste und gibt <code>None</code> zurück. Du überschreibst deine Liste dann mit <code>None</code>!")}`,
      task: "Sortiere die Liste <code>zahlen</code> und gib sie aus. Gib danach aus, ob <code>9</code> in der Liste vorkommt. Erwartet: <code>[1, 2, 5, 9]</code> und <code>True</code>.",
      starter: "zahlen = [5, 2, 9, 1]\n\n",
      hint: "zahlen.sort()\nprint(zahlen)\nprint(9 in zahlen)",
      solution: "zahlen = [5, 2, 9, 1]\nzahlen.sort()\nprint(zahlen)\nprint(9 in zahlen)",
      check: ({ output, code }) => {
        if (!/sort/.test(code)) return "Benutze sort() oder sorted().";
        return expectOutput(output, ["[1, 2, 5, 9]", "True"]);
      },
    },
    {
      title: "List Comprehensions",
      content: `
        <p>Eine <b>List Comprehension</b> baut eine Liste in einer Zeile. Statt:</p>
        ${ex("quadrate = []\nfor x in range(1, 4):\n    quadrate.append(x * x)")}
        <p>schreibst du:</p>
        ${ex("quadrate = [x * x for x in range(1, 4)]   # [1, 4, 9]")}
        <p>Aufbau: ${c("[ was-berechnen   for x in quelle ]")}. Du kannst auch filtern:</p>
        ${ex("gerade = [x for x in range(10) if x % 2 == 0]   # [0, 2, 4, 6, 8]")}
        ${tip("Wenn dir eine Comprehension zu kompliziert aussieht, nimm die ausführliche Schleife. Lesbarkeit zählt mehr als Kürze.")}`,
      task: "Erzeuge mit einer List Comprehension die Liste der Quadratzahlen von 1 bis 5 und gib sie aus: <code>[1, 4, 9, 16, 25]</code>.",
      starter: "# quadrate = [ ... for x in range(...) ]\n",
      hint: "quadrate = [x * x for x in range(1, 6)]\nprint(quadrate)",
      solution: "quadrate = [x * x for x in range(1, 6)]\nprint(quadrate)",
      check: ({ output, code }) => {
        if (!/\[[^\]]*\bfor\b/.test(code)) return "Benutze eine List Comprehension: [... for x in ...]";
        return expectOutput(output, ["[1, 4, 9, 16, 25]"]);
      },
    },
    {
      title: "Tupel & Mengen",
      content: `
        <p>Ein <b>Tupel</b> ist wie eine Liste, aber nicht veränderbar. Es steht in runden Klammern. Praktisch zum „Auspacken“:</p>
        ${ex("punkt = (3, 4)\nx, y = punkt\nprint(x + y)   # 7")}
        <p>Eine <b>Menge</b> (${c("set")}) enthält jeden Wert nur <b>einmal</b> und hat keine feste Reihenfolge. Ideal, um Doppelte zu entfernen:</p>
        ${ex("zahlen = [1, 2, 2, 3, 3, 3]\neindeutig = set(zahlen)   # {1, 2, 3}\nprint(len(eindeutig))      # 3")}`,
      task: "Gib aus, wie viele <b>verschiedene</b> Zahlen in <code>zahlen</code> stehen (<code>3</code>). Packe danach das Tupel <code>punkt</code> in <code>x</code> und <code>y</code> aus und gib <code>x + y</code> aus (<code>7</code>).",
      starter: "zahlen = [1, 2, 2, 3, 3, 3]\npunkt = (3, 4)\n\n",
      hint: "print(len(set(zahlen)))\nx, y = punkt\nprint(x + y)",
      solution: "zahlen = [1, 2, 2, 3, 3, 3]\npunkt = (3, 4)\nprint(len(set(zahlen)))\nx, y = punkt\nprint(x + y)",
      check: ({ output, code }) => {
        if (!code.includes("set(")) return "Benutze set().";
        return expectOutput(output, ["3", "7"]);
      },
    },
    {
      title: "Fehler abfangen (try / except)",
      content: `
        <p>Manchmal passieren Fehler, z. B. wenn jemand statt einer Zahl „abc“ eingibt. Ohne Schutz stürzt dein Programm ab:</p>
        ${ex('zahl = int("abc")   # ValueError!')}
        <p>Mit ${c("try")} und ${c("except")} fängst du den Fehler ab und reagierst darauf:</p>
        ${ex('try:\n    zahl = int("hallo")\n    print("Klappt")\nexcept ValueError:\n    print("Geht nicht!")')}
        <ul>
          <li>Im ${c("try")}-Block steht Code, der schiefgehen <i>könnte</i>.</li>
          <li>Passiert ein ${c("ValueError")}, springt Python sofort in den ${c("except")}-Block.</li>
          <li>Ohne Fehler wird der ${c("except")}-Block übersprungen.</li>
        </ul>
        ${tip("Nenne im <code>except</code> immer den konkreten Fehlertyp, z. B. <code>ValueError</code> oder <code>ZeroDivisionError</code>, damit du nicht aus Versehen andere Fehler versteckst.")}`,
      task: "Versuche, <code>text</code> mit <code>int()</code> umzuwandeln. Klappt das nicht (<code>ValueError</code>), gib <code>Das ist keine Zahl</code> aus.",
      starter: 'text = "abc"\n\n',
      hint: 'try:\n    zahl = int(text)\n    print(zahl)\nexcept ValueError:\n    print("Das ist keine Zahl")',
      solution: 'text = "abc"\ntry:\n    zahl = int(text)\n    print(zahl)\nexcept ValueError:\n    print("Das ist keine Zahl")',
      check: ({ output, code }) => {
        if (!/\btry\b/.test(code) || !/\bexcept\b/.test(code)) return "Benutze try und except.";
        return expectOutput(output, ["Das ist keine Zahl"]);
      },
    },
    {
      title: "Module importieren",
      content: `
        <p>Python bringt viele fertige Werkzeugkästen mit: <b>Module</b>. Mit ${c("import")} holst du sie dir.</p>
        ${ex("import math\nprint(math.sqrt(16))   # 4.0  (Wurzel)\nprint(math.pi)        # 3.14159...\nprint(math.floor(3.7))  # 3   (abrunden)\nprint(math.ceil(3.2))   # 4   (aufrunden)")}
        <p>Andere nützliche Module: ${c("random")} (Zufall), ${c("datetime")} (Datum und Zeit), ${c("json")} (Datenformat).</p>
        ${ex("import random\nprint(random.randint(1, 6))   # Würfel")}
        ${tip("Mit <code>from math import sqrt</code> kannst du danach direkt <code>sqrt(16)</code> schreiben.")}`,
      task: "Nutze das Modul <code>math</code>: Gib die Wurzel aus 49 aus und danach <code>3.7</code> abgerundet. Erwartet: <code>7.0</code> und <code>3</code>.",
      starter: "import math\n\n",
      hint: "print(math.sqrt(49))\nprint(math.floor(3.7))",
      solution: "import math\nprint(math.sqrt(49))\nprint(math.floor(3.7))",
      check: ({ output, code }) => {
        if (!code.includes("math.")) return "Benutze Funktionen aus dem Modul math.";
        return expectOutput(output, ["7.0", "3"]);
      },
    },
    {
      title: "Klassen 1: Eigene Objekte",
      content: `
        <p>Eine <b>Klasse</b> ist ein Bauplan für Objekte. Zum Beispiel: Alle Katzen haben einen Namen und können miauen. Aus dem Bauplan erstellst du einzelne Katzen.</p>
        ${ex('class Katze:\n    def __init__(self, name):\n        self.name = name\n\n    def miauen(self):\n        print(f"{self.name} sagt Miau!")\n\nmia = Katze("Mia")\nmia.miauen()   # Mia sagt Miau!')}
        <ul>
          <li>${c("class Katze:")} definiert den Bauplan.</li>
          <li>${c("__init__")} läuft automatisch, wenn ein Objekt erstellt wird (der „Konstruktor“).</li>
          <li>${c("self")} meint „dieses Objekt“. Damit speicherst du Daten: ${c("self.name")}.</li>
          <li>Funktionen in einer Klasse heißen <b>Methoden</b>. Sie haben immer ${c("self")} als ersten Parameter.</li>
          <li>${c('Katze("Mia")')} erstellt ein Objekt.</li>
        </ul>`,
      task: "Ergänze die Methode <code>bellen</code>, sodass <code>Rex sagt Wuff!</code> ausgegeben wird.",
      starter: 'class Hund:\n    def __init__(self, name):\n        self.name = name\n\n    # def bellen(self):\n    #     print(...)\n\nrex = Hund("Rex")\nrex.bellen()\n',
      hint: 'def bellen(self):\n    print(f"{self.name} sagt Wuff!")  (eingerückt in der Klasse)',
      solution: 'class Hund:\n    def __init__(self, name):\n        self.name = name\n\n    def bellen(self):\n        print(f"{self.name} sagt Wuff!")\n\nrex = Hund("Rex")\nrex.bellen()',
      check: ({ output, code }) => {
        if (!/def\s+bellen/.test(code)) return "Definiere die Methode bellen in der Klasse.";
        return expectOutput(output, ["Rex sagt Wuff!"]);
      },
    },
    {
      title: "Klassen 2: Zustand verändern",
      content: `
        <p>Objekte können sich ihren <b>Zustand merken</b>, und Methoden können ihn verändern. Beispiel: ein Bankkonto.</p>
        ${ex("class Konto:\n    def __init__(self, guthaben):\n        self.guthaben = guthaben\n\n    def einzahlen(self, betrag):\n        self.guthaben = self.guthaben + betrag\n\nk = Konto(100)\nk.einzahlen(50)\nprint(k.guthaben)   # 150")}
        <p>Jedes Objekt hat seinen eigenen Zustand: Ein zweites ${c("Konto(10)")} wäre unabhängig vom ersten.</p>
        ${warn("In Methoden musst du <code>self.guthaben</code> schreiben. Nur <code>guthaben</code> wäre eine ganz neue, lokale Variable.")}`,
      task: "Ergänze die Methode <code>abheben(betrag)</code>, die das Guthaben verringert. Nach <code>Konto(100)</code> und <code>abheben(30)</code> soll <code>70</code> ausgegeben werden.",
      starter: "class Konto:\n    def __init__(self, guthaben):\n        self.guthaben = guthaben\n\n    # def abheben(self, betrag):\n\nk = Konto(100)\nk.abheben(30)\nprint(k.guthaben)\n",
      hint: "def abheben(self, betrag):\n    self.guthaben = self.guthaben - betrag",
      solution: "class Konto:\n    def __init__(self, guthaben):\n        self.guthaben = guthaben\n\n    def abheben(self, betrag):\n        self.guthaben = self.guthaben - betrag\n\nk = Konto(100)\nk.abheben(30)\nprint(k.guthaben)",
      check: ({ output, code }) => {
        if (!/def\s+abheben/.test(code)) return "Definiere die Methode abheben.";
        return expectOutput(output, ["70"]);
      },
    },
    {
      title: "Mini-Projekt: Wörter zählen",
      content: `
        <p>Du zählst, wie oft jedes Wort in einem Text vorkommt. Dafür kombinierst du mehrere Dinge, die du gelernt hast:</p>
        <ul>
          <li>${c("text.split()")} zerlegt den Text in eine Liste von Wörtern.</li>
          <li>Ein <b>Dictionary</b> merkt sich pro Wort die Anzahl.</li>
          <li>Eine <b>Schleife</b> geht alle Wörter durch.</li>
        </ul>
        ${ex('anzahl = {}\nfor wort in ["a", "b", "a"]:\n    if wort in anzahl:\n        anzahl[wort] = anzahl[wort] + 1\n    else:\n        anzahl[wort] = 1\nprint(anzahl)   # {"a": 2, "b": 1}')}
        <p>Das Muster: Ist das Wort schon im Dictionary, erhöhe die Zahl, sonst starte bei 1.</p>`,
      task: "Zähle die Wörter in <code>text</code> und gib dann für jedes Wort eine Zeile im Format <code>wort: anzahl</code> aus (in der Reihenfolge des ersten Auftretens). Erwartet: <code>a: 3</code>, <code>b: 2</code>, <code>c: 1</code>.",
      starter: 'text = "a b a c b a"\nanzahl = {}\n\n# 1. Schleife über text.split()\n# 2. Dictionary füllen\n# 3. Mit items() ausgeben\n',
      hint: 'for wort in text.split():\n    if wort in anzahl:\n        anzahl[wort] = anzahl[wort] + 1\n    else:\n        anzahl[wort] = 1\nfor wort, n in anzahl.items():\n    print(f"{wort}: {n}")',
      solution: 'text = "a b a c b a"\nanzahl = {}\nfor wort in text.split():\n    if wort in anzahl:\n        anzahl[wort] = anzahl[wort] + 1\n    else:\n        anzahl[wort] = 1\nfor wort, n in anzahl.items():\n    print(f"{wort}: {n}")',
      check: ({ output }) => expectOutput(output, ["a: 3", "b: 2", "c: 1"]),
    },
  ],
});

// Kursdaten, Teil 2: JavaScript (nutzt die Helfer aus courses.js)

COURSES.push({
  id: "js1",
  lang: "javascript",
  langLabel: "JavaScript",
  emoji: "🟨",
  title: "JavaScript für Einsteiger",
  desc: "Die Sprache des Webs, Schritt für Schritt: Variablen, Rechnen, Entscheidungen, Schleifen, Arrays, Funktionen, Objekte.",
  lessons: [
    {
      title: "Dein erstes Programm",
      content: `
        <p>Ein <b>Programm</b> ist eine Liste von Anweisungen. Der Computer führt sie <b>von oben nach unten</b> aus.</p>
        <p>Mit ${c("console.log()")} zeigst du etwas an (rechts unter „Ausgabe“).</p>
        ${ex('console.log("Hallo Welt");')}
        <ul>
          <li>${c("console.log")} ist der Befehl, in den runden Klammern steht, was angezeigt wird.</li>
          <li>Text steht in <b>Anführungszeichen</b> und heißt <b>String</b>.</li>
          <li>Am Ende einer Anweisung steht ein <b>Semikolon</b> ${c(";")}.</li>
        </ul>
        ${tip("Klick bei den Beispielen auf „In den Editor laden“ und dann auf „Ausführen“. Ausprobieren ist der beste Weg zu lernen!")}
        ${warn("JavaScript unterscheidet Groß- und Kleinschreibung: " + c("Console.Log") + " funktioniert nicht.")}`,
      task: "Ändere den Text so, dass <code>Ich lerne JavaScript</code> ausgegeben wird.",
      starter: 'console.log("Hallo Welt");\n',
      hint: 'console.log("Ich lerne JavaScript");',
      solution: 'console.log("Ich lerne JavaScript");',
      check: ({ output }) => expectOutput(output, ["Ich lerne JavaScript"]),
    },
    {
      title: "Mehrere Zeilen & Kommentare",
      content: `
        <p>Jedes ${c("console.log")} schreibt eine neue Zeile. Die Reihenfolge im Code ist die Reihenfolge in der Ausgabe.</p>
        ${ex('console.log("Erst das");\nconsole.log("dann das");')}
        <p>Mit ${c("//")} schreibst du einen <b>Kommentar</b>. Alles dahinter ignoriert JavaScript. Für mehrere Zeilen: ${c("/* ... */")}.</p>
        ${ex('// Das ist ein Kommentar\nconsole.log("Hallo"); // auch hier hinten geht es\n/* Dieser Kommentar\n   geht über mehrere Zeilen */')}`,
      task: "Ersetze die Kommentare durch Code, sodass drei Zeilen erscheinen: <code>Erste Zeile</code>, <code>Zweite Zeile</code>, <code>Dritte Zeile</code>.",
      starter: 'console.log("Erste Zeile");\n// hier die zweite Zeile ausgeben\n// hier die dritte Zeile ausgeben\n',
      hint: "Schreibe zwei weitere console.log-Zeilen.",
      solution: 'console.log("Erste Zeile");\nconsole.log("Zweite Zeile");\nconsole.log("Dritte Zeile");',
      check: ({ output }) => expectOutput(output, ["Erste Zeile", "Zweite Zeile", "Dritte Zeile"]),
    },
    {
      title: "Variablen: let und const",
      content: `
        <p>Eine <b>Variable</b> ist eine beschriftete Schachtel für einen Wert. Du legst sie mit ${c("let")} oder ${c("const")} an.</p>
        ${ex('const stadt = "Wien";\nlet punkte = 10;\npunkte = 15;\nconsole.log(stadt);\nconsole.log(punkte);')}
        <ul>
          <li>${c("const")}: der Wert bleibt <b>konstant</b> und kann nicht neu zugewiesen werden.</li>
          <li>${c("let")}: der Wert darf sich später <b>ändern</b>.</li>
          <li>${c("=")} bedeutet „speichere rechts in links“.</li>
          <li>${c("console.log(stadt)")} zeigt den <b>Inhalt</b>, ohne Anführungszeichen! Mit ${c('console.log("stadt")')} würde das Wort „stadt“ erscheinen.</li>
        </ul>
        ${tip("Faustregel: Nimm <code>const</code>, es sei denn, du willst den Wert später ändern. Namen schreibt man in camelCase: <code>meinAlter</code>.")}
        ${warn("Eine <code>const</code>-Variable später zu ändern gibt den Fehler <code>Assignment to constant variable</code>.")}`,
      task: "Lege eine <code>const</code>-Variable <code>stadt</code> mit dem Text <code>Berlin</code> an und gib sie aus.",
      starter: "// const stadt = ...;\n// console.log(...);\n",
      hint: 'const stadt = "Berlin";\nconsole.log(stadt);',
      solution: 'const stadt = "Berlin";\nconsole.log(stadt);',
      check: ({ output, code }) => {
        if (!/(const|let)\s+stadt/.test(code)) return "Lege die Variable stadt mit const oder let an.";
        return expectOutput(output, ["Berlin"]);
      },
    },
    {
      title: "Rechnen mit Zahlen",
      content: `
        <p>JavaScript rechnet wie ein Taschenrechner. Zahlen schreibst du <b>ohne</b> Anführungszeichen.</p>
        ${ex("console.log(5 + 3);   // 8\nconsole.log(10 - 4);  // 6\nconsole.log(6 * 7);   // 42\nconsole.log(9 / 2);   // 4.5")}
        <p>Mit Variablen funktioniert es genauso:</p>
        ${ex("const a = 4;\nconst b = 5;\nconst summe = a + b;\nconsole.log(summe);   // 9")}
        <p>Auch hier wird erst die <b>rechte Seite</b> berechnet und dann in die Variable gespeichert.</p>
        <p>Zwei besondere Rechenzeichen:</p>
        <ul>
          <li>${c("%")} <b>Rest</b> der Division: ${c("17 % 5")} ist ${c("2")}.</li>
          <li>${c("**")} <b>Potenz</b>: ${c("2 ** 3")} ist ${c("8")}.</li>
        </ul>
        ${tip("Punkt vor Strich gilt wie in der Mathematik. Mit Klammern bestimmst du die Reihenfolge: <code>(2 + 3) * 4</code> ist 20.")}`,
      task: "<code>a</code> ist 8, <code>b</code> ist 3. Gib in drei Zeilen aus: Summe, Differenz (a − b) und Produkt.",
      starter: "const a = 8;\nconst b = 3;\n\n",
      hint: "console.log(a + b);  console.log(a - b);  console.log(a * b);",
      solution: "const a = 8;\nconst b = 3;\nconsole.log(a + b);\nconsole.log(a - b);\nconsole.log(a * b);",
      check: ({ output, code }) => {
        if (!/a\s*[+\-*]\s*b/.test(code)) return "Rechne mit den Variablen a und b.";
        return expectOutput(output, ["11", "5", "24"]);
      },
    },
    {
      title: "Text zusammenbauen",
      content: `
        <p>Text und Variablen mischst du mit ${c("+")}:</p>
        ${ex('const name = "Max";\nconsole.log("Hallo " + name);   // Hallo Max')}
        <p>Eleganter sind <b>Template-Strings</b> mit <b>Backticks</b> (Schrägstrich-Anführungszeichen) und ${c("${...}")}:</p>
        ${ex("const tier = \"Katze\";\nconst monate = 18;\nconsole.log(`Die ${tier} ist ${monate} Monate alt.`);")}
        <p>Innerhalb von ${c("${ }")} kannst du auch rechnen: ${c("${monate + 6}")}.</p>
        ${warn("Die Backticks sind nicht dasselbe wie <code>'</code>. Auf der deutschen Tastatur: <code>Umschalt + Akzent-Taste</code> (neben dem ß), dann Leertaste.")}`,
      task: "Gib mit einem Template-String genau diesen Satz aus: <code>Anna ist 12 Jahre alt.</code> Name und Alter kommen aus den Variablen.",
      starter: 'const name = "Anna";\nconst alter = 12;\n\n',
      hint: "console.log(`${name} ist ${alter} Jahre alt.`);",
      solution: 'const name = "Anna";\nconst alter = 12;\nconsole.log(`${name} ist ${alter} Jahre alt.`);',
      check: ({ output, code }) => {
        if (!code.includes("`")) return "Benutze einen Template-String mit Backticks (`).";
        return expectOutput(output, ["Anna ist 12 Jahre alt."]);
      },
    },
    {
      title: "Datentypen",
      content: `
        <p>Jeder Wert hat einen <b>Typ</b>. Die wichtigsten: ${c("string")} (Text), ${c("number")} (Zahl), ${c("boolean")} (${c("true")} oder ${c("false")}). Mit ${c("typeof")} fragst du ihn ab.</p>
        ${ex('console.log(typeof "Hallo");   // string\nconsole.log(typeof 42);        // number\nconsole.log(typeof true);      // boolean')}
        <p>Umwandeln geht mit ${c("Number()")} und ${c("String()")}:</p>
        ${ex('const text = "21";\nconst zahl = Number(text);\nconsole.log(zahl + 1);   // 22')}
        ${warn("Achtung: " + c('"5" + 3') + " ergibt den <b>Text</b> " + c("53") + ", aber " + c('"5" - 3') + " ergibt die Zahl " + c("2") + ". Wandle Text deshalb immer bewusst mit " + c("Number()") + " um.")}`,
      task: "<code>zahlText</code> ist der Text <code>\"21\"</code>. Wandle ihn mit <code>Number()</code> um und gib das Doppelte aus (<code>42</code>).",
      starter: 'const zahlText = "21";\n\n',
      hint: "const zahl = Number(zahlText);\nconsole.log(zahl * 2);",
      solution: 'const zahlText = "21";\nconst zahl = Number(zahlText);\nconsole.log(zahl * 2);',
      check: ({ output, code }) => {
        if (!code.includes("Number(")) return "Benutze Number().";
        return expectOutput(output, ["42"]);
      },
    },
    {
      title: "Entscheidungen mit if",
      content: `
        <p>Mit ${c("if")} („wenn“) führst du Code nur aus, <b>wenn eine Bedingung stimmt</b>.</p>
        ${ex('const punkte = 12;\nif (punkte > 10) {\n  console.log("Gewonnen!");\n}\nconsole.log("Spiel vorbei");')}
        <ul>
          <li>Die Bedingung steht in <b>runden Klammern</b> hinter dem ${c("if")}.</li>
          <li>Der Code in den <b>geschweiften Klammern</b> ${c("{ }")} läuft nur, wenn die Bedingung wahr ist.</li>
          <li>${c('console.log("Spiel vorbei")')} steht außerhalb und läuft immer.</li>
        </ul>
        <p>Vergleichszeichen: ${c(">")}, ${c("<")}, ${c(">=")}, ${c("<=")}, ${c("===")} (gleich), ${c("!==")} (ungleich).</p>
        ${warn("Ein einzelnes " + c("=") + " speichert einen Wert. Zum Vergleichen brauchst du " + c("===") + " (drei Gleichzeichen).")}`,
      task: "Gib <code>Es ist warm</code> aus, wenn <code>temperatur</code> größer als 20 ist.",
      starter: "const temperatur = 25;\n\n// if (...) {\n//   ...\n// }\n",
      hint: 'if (temperatur > 20) {\n  console.log("Es ist warm");\n}',
      solution: 'const temperatur = 25;\nif (temperatur > 20) {\n  console.log("Es ist warm");\n}',
      check: ({ output, code }) => {
        if (!/if\s*\(/.test(code)) return "Benutze if (...) { ... }";
        return expectOutput(output, ["Es ist warm"]);
      },
    },
    {
      title: "else und else if",
      content: `
        <p>Mit ${c("else")} („sonst“) sagst du, was passiert, wenn die Bedingung <b>nicht</b> stimmt. Mit ${c("else if")} prüfst du weitere Fälle.</p>
        ${ex('const temperatur = 18;\nif (temperatur >= 25) {\n  console.log("heiß");\n} else if (temperatur >= 15) {\n  console.log("mild");\n} else {\n  console.log("kalt");\n}')}
        <p>JavaScript prüft <b>von oben nach unten</b> und nimmt den <b>ersten</b> Fall, der stimmt. Bei 18 stimmt der erste nicht (18 ist nicht ≥ 25), der zweite schon, also erscheint „mild“. Wäre die Temperatur 8, greift das <code>else</code>: „kalt“.</p>`,
      task: "Gib bei <code>punkte</code> ab 90 <code>Sehr gut</code> aus, ab 70 <code>Gut</code>, sonst <code>Weiter üben</code>. Mit 75 Punkten: <code>Gut</code>.",
      starter: "const punkte = 75;\n\n",
      hint: "if (...) {...} else if (...) {...} else {...}  Achte auf die geschweiften Klammern!",
      solution: 'const punkte = 75;\nif (punkte >= 90) {\n  console.log("Sehr gut");\n} else if (punkte >= 70) {\n  console.log("Gut");\n} else {\n  console.log("Weiter üben");\n}',
      check: ({ output, code }) => {
        if (!/else\s+if/.test(code) || !/else\s*\{/.test(code)) return "Benutze if, else if und else.";
        return expectOutput(output, ["Gut"]);
      },
    },
    {
      title: "Bedingungen kombinieren (&&, ||)",
      content: `
        <p>Mehrere Bedingungen verbindest du so:</p>
        <ul>
          <li>${c("&&")} („und“): beide müssen wahr sein.</li>
          <li>${c("||")} („oder“): mindestens eine muss wahr sein.</li>
          <li>${c("!")} („nicht“): dreht wahr und falsch um.</li>
        </ul>
        ${ex('const temperatur = 22;\nconst istSonnig = true;\nif (temperatur >= 20 && istSonnig) {\n  console.log("Ab ins Schwimmbad!");\n} else {\n  console.log("Lieber drinnen bleiben");\n}\n\nif (temperatur < 5 || temperatur > 35) {\n  console.log("Zu extrem");\n}')}
        ${tip("<code>true</code> und <code>false</code> sind die zwei Wahrheitswerte (<code>boolean</code>). <code>if (istSonnig)</code> reicht schon aus, wenn die Variable <code>true</code> oder <code>false</code> ist.")}`,
      task: "Gib <code>Eintritt erlaubt</code> aus, wenn <code>alter</code> mindestens 12 <b>und</b> <code>hatTicket</code> wahr ist, sonst <code>Kein Eintritt</code>.",
      starter: "const alter = 16;\nconst hatTicket = true;\n\n",
      hint: "if (alter >= 12 && hatTicket) { ... } else { ... }",
      solution: 'const alter = 16;\nconst hatTicket = true;\nif (alter >= 12 && hatTicket) {\n  console.log("Eintritt erlaubt");\n} else {\n  console.log("Kein Eintritt");\n}',
      check: ({ output, code }) => {
        if (!code.includes("&&")) return "Benutze &&.";
        return expectOutput(output, ["Eintritt erlaubt"]);
      },
    },
    {
      title: "Schleifen 1: for",
      content: `
        <p>Stell dir vor, du sollst die Zahlen von 1 bis 100 ausgeben. Statt 100 Mal ${c("console.log")} zu tippen, nutzt du eine <b>Schleife</b>: Sie wiederholt Code.</p>
        ${ex("for (let i = 3; i <= 6; i++) {\n  console.log(i);\n}")}
        <p>Die ${c("for")}-Schleife hat <b>drei Teile</b> in der Klammer, getrennt durch ${c(";")}:</p>
        <ul>
          <li>${c("let i = 3")}: <b>Start</b>. Die Zählvariable ${c("i")} beginnt bei 3.</li>
          <li>${c("i <= 6")}: <b>Bedingung</b>. Die Schleife läuft, solange sie stimmt.</li>
          <li>${c("i++")}: <b>Schritt</b>. Nach jedem Durchgang wird ${c("i")} um 1 größer (${c("i--")} wäre kleiner).</li>
        </ul>
        <p>Der Block in ${c("{ }")} wird bei jedem Durchgang einmal ausgeführt. Ausgabe: 3, 4, 5, 6.</p>
        ${warn("Ein Zeichen wie <code>&lt;</code> statt <code>&lt;=</code> macht den Unterschied, ob die letzte Zahl dabei ist. Teste bei Schleifen immer die Grenzen.")}`,
      task: "Gib die Zahlen von 1 bis 5 aus, jede in einer eigenen Zeile.",
      starter: "// for (let i = ...; ...; ...) {\n//   ...\n// }\n",
      hint: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
      solution: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
      check: ({ output, code }) => {
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife.";
        return expectOutput(output, ["1", "2", "3", "4", "5"]);
      },
    },
    {
      title: "Schleifen 2: In der Schleife rechnen",
      content: `
        <p>In der Schleife kannst du mit der Zählvariable rechnen, z. B. die Quadratzahlen:</p>
        ${ex("for (let i = 1; i <= 3; i++) {\n  console.log(i * i);   // 1, 4, 9\n}")}
        <p>Besonders mächtig: Du <b>merkst dir ein Zwischenergebnis</b>. Lege vor der Schleife eine Variable an (mit ${c("let")}!) und ändere sie bei jedem Durchgang.</p>
        ${ex("let produkt = 1;\nfor (let zahl = 1; zahl <= 4; zahl++) {\n  produkt = produkt * zahl;\n}\nconsole.log(produkt);   // 24")}
        <p>${c("produkt = produkt * zahl")} heißt: „Nimm den alten Wert von produkt, multipliziere mit zahl und speichere das wieder in produkt.“ Das Summieren geht genauso mit ${c("+")}: ${c("summe = summe + zahl")}, kürzer ${c("summe += zahl")}. Der Startwert muss passen: bei ${c("+")} beginnst du mit ${c("0")}, bei ${c("*")} mit ${c("1")}.</p>
        ${warn("Das <code>console.log(summe)</code> gehört <b>hinter</b> die Schleife (nach der schließenden <code>}</code>), sonst wird bei jedem Durchgang ausgegeben.")}`,
      task: "Berechne die Summe der Zahlen von 1 bis 10 und gib nur das Ergebnis aus (<code>55</code>).",
      starter: "let summe = 0;\n\n",
      hint: "for (let zahl = 1; zahl <= 10; zahl++) {\n  summe = summe + zahl;\n}\nconsole.log(summe);",
      solution: "let summe = 0;\nfor (let zahl = 1; zahl <= 10; zahl++) {\n  summe = summe + zahl;\n}\nconsole.log(summe);",
      check: ({ output, code }) => {
        if (!/\bfor\b/.test(code)) return "Benutze eine for-Schleife.";
        return expectOutput(output, ["55"]);
      },
    },
    {
      title: "Schleifen 3: while",
      content: `
        <p>Die ${c("while")}-Schleife wiederholt, <b>solange</b> eine Bedingung stimmt. Du nutzt sie, wenn du vorher nicht weißt, wie oft.</p>
        ${ex("let x = 3;\nwhile (x > 0) {\n  console.log(x);\n  x = x - 1;\n}")}
        <p>Ablauf: 3 &gt; 0 ✔ → Ausgabe 3, x wird 2 → 2 &gt; 0 ✔ → Ausgabe 2, x wird 1 → … → x ist 0, die Bedingung stimmt nicht mehr, Ende.</p>
        ${warn("Vergisst du <code>x = x - 1</code>, läuft die Schleife <b>ewig</b> (Endlosschleife) und der Browser-Tab hängt. Ändere in der Schleife immer etwas, das die Bedingung irgendwann falsch macht.")}`,
      task: "Zähle mit <code>while</code> von 3 runter bis 1 und gib danach <code>Los!</code> aus.",
      starter: "let x = 3;\n\n",
      hint: 'while (x > 0) {\n  console.log(x);\n  x = x - 1;\n}\nconsole.log("Los!");',
      solution: 'let x = 3;\nwhile (x > 0) {\n  console.log(x);\n  x = x - 1;\n}\nconsole.log("Los!");',
      check: ({ output, code }) => {
        if (!/\bwhile\b/.test(code)) return "Benutze eine while-Schleife.";
        return expectOutput(output, ["3", "2", "1", "Los!"]);
      },
    },
    {
      title: "Arrays 1: Grundlagen",
      content: `
        <p>Ein <b>Array</b> speichert mehrere Werte in einer Variable. Es steht in eckigen Klammern.</p>
        ${ex('const farben = ["rot", "blau", "grün"];')}
        <p>Auf Elemente greifst du über den <b>Index</b> zu. Gezählt wird ab <b>0</b>!</p>
        ${ex('console.log(farben[0]);   // rot\nconsole.log(farben[1]);   // blau\nconsole.log(farben.length);   // 3 (Anzahl)')}
        <p>Hinten anhängen mit ${c("push")}:</p>
        ${ex('farben.push("gelb");\nconsole.log(farben.length);   // 4')}
        ${tip("Das letzte Element hat den Index <code>farben.length - 1</code>.")}
        ${warn("Auch ein <code>const</code>-Array darf man mit <code>push</code> erweitern. <code>const</code> verbietet nur, die Variable komplett neu zuzuweisen.")}`,
      task: "Gib das erste Element von <code>farben</code> aus, hänge <code>\"gelb\"</code> an und gib dann die Anzahl aus. Erwartet: <code>rot</code> und <code>3</code>.",
      starter: 'const farben = ["rot", "blau"];\n\n',
      hint: 'console.log(farben[0]);\nfarben.push("gelb");\nconsole.log(farben.length);',
      solution: 'const farben = ["rot", "blau"];\nconsole.log(farben[0]);\nfarben.push("gelb");\nconsole.log(farben.length);',
      check: ({ output, code }) => {
        if (!code.includes("push")) return "Benutze push().";
        return expectOutput(output, ["rot", "3"]);
      },
    },
    {
      title: "Arrays 2: Durch Arrays gehen",
      content: `
        <p>Mit ${c("for...of")} besuchst du jedes Element, ganz ohne Index:</p>
        ${ex('const tiere = ["Hund", "Katze", "Maus"];\nfor (const tier of tiere) {\n  console.log(tier);\n}')}
        <p>In jedem Durchgang ist ${c("tier")} das nächste Element. Alternativ gibt es ${c("forEach")}:</p>
        ${ex("tiere.forEach((tier) => {\n  console.log(tier);\n});")}
        <p>Nützlich: ${c("includes")} prüft, ob etwas enthalten ist, und ${c("Math.max(...zahlen)")} findet die größte Zahl.</p>
        ${ex('console.log(tiere.includes("Hund"));   // true\nconsole.log(Math.max(...[3, 8, 1]));   // 8')}`,
      task: "Berechne mit einer Schleife die Summe aller Zahlen im Array und gib sie aus. Gib dann mit <code>Math.max(...zahlen)</code> die größte Zahl aus. Erwartet: <code>18</code> und <code>8</code>.",
      starter: "const zahlen = [3, 8, 1, 6];\nlet summe = 0;\n\n",
      hint: "for (const zahl of zahlen) {\n  summe = summe + zahl;\n}\nconsole.log(summe);\nconsole.log(Math.max(...zahlen));",
      solution: "const zahlen = [3, 8, 1, 6];\nlet summe = 0;\nfor (const zahl of zahlen) {\n  summe = summe + zahl;\n}\nconsole.log(summe);\nconsole.log(Math.max(...zahlen));",
      check: ({ output, code }) => {
        if (!/\bfor\b|forEach/.test(code)) return "Benutze eine Schleife über das Array.";
        return expectOutput(output, ["18", "8"]);
      },
    },
    {
      title: "Funktionen 1: Eigener Code-Baustein",
      content: `
        <p>Eine <b>Funktion</b> ist ein Block Code mit einem Namen. Einmal geschrieben, rufst du ihn beliebig oft <b>auf</b>.</p>
        ${ex('function begruesse() {\n  console.log("Hallo!");\n  console.log("Schön, dich zu sehen.");\n}\n\nbegruesse();\nbegruesse();')}
        <ul>
          <li>${c("function")} startet die Definition, danach kommt der Name und ${c("()")}.</li>
          <li>Der Inhalt steht in ${c("{ }")}.</li>
          <li>Mit ${c("begruesse();")} <b>führst du sie aus</b>. Die Definition allein tut noch nichts!</li>
        </ul>
        ${warn("Ohne die Klammern (<code>begruesse;</code>) wird die Funktion nicht aufgerufen.")}`,
      task: "Definiere eine Funktion <code>hallo</code>, die <code>Hallo!</code> ausgibt, und rufe sie zweimal auf.",
      starter: "// function hallo() { ... }\n\n// hallo();\n// hallo();\n",
      hint: 'function hallo() {\n  console.log("Hallo!");\n}\nhallo();\nhallo();',
      solution: 'function hallo() {\n  console.log("Hallo!");\n}\nhallo();\nhallo();',
      check: ({ output, code }) => {
        if (!/function\s+hallo\s*\(/.test(code)) return "Definiere die Funktion hallo mit function.";
        return expectOutput(output, ["Hallo!", "Hallo!"]);
      },
    },
    {
      title: "Funktionen 2: Parameter & return",
      content: `
        <p>Funktionen werden mächtig, wenn sie Werte <b>bekommen</b> (Parameter) und ein Ergebnis <b>zurückgeben</b> (${c("return")}).</p>
        ${ex("function multipliziere(a, b) {\n  return a * b;\n}\n\nconst ergebnis = multipliziere(4, 5);\nconsole.log(ergebnis);              // 20\nconsole.log(multipliziere(3, 7));   // 21")}
        <ul>
          <li>${c("a")} und ${c("b")} sind <b>Parameter</b>, Platzhalter für die Werte beim Aufruf.</li>
          <li>${c("return")} gibt das Ergebnis an die Stelle zurück, wo die Funktion aufgerufen wurde, und beendet sie.</li>
        </ul>
        ${tip("<code>return</code> gibt das Ergebnis nur zurück. Anzeigen musst du es selbst mit <code>console.log</code>.")}
        ${warn("Eine Funktion ohne <code>return</code> gibt <code>undefined</code> zurück. Wenn du das Ergebnis weiterverwenden willst, brauchst du <code>return</code>.")}`,
      task: "Schreibe <code>addiere(a, b)</code>, die die Summe <b>zurückgibt</b>. Gib <code>addiere(2, 3)</code> und <code>addiere(10, 20)</code> aus (<code>5</code> und <code>30</code>).",
      starter: "// function addiere(a, b) { return ...; }\n\n// console.log(addiere(2, 3));\n",
      hint: "function addiere(a, b) {\n  return a + b;\n}",
      solution: "function addiere(a, b) {\n  return a + b;\n}\nconsole.log(addiere(2, 3));\nconsole.log(addiere(10, 20));",
      check: ({ output, code }) => {
        if (!/function\s+addiere/.test(code) || !code.includes("return")) return "Definiere addiere mit function und gib mit return zurück.";
        return expectOutput(output, ["5", "30"]);
      },
    },
    {
      title: "Objekte",
      content: `
        <p>Ein Array findet Elemente über eine Nummer. Ein <b>Objekt</b> findet sie über einen <b>Namen</b> (Eigenschaft). Es besteht aus Paaren <code>name: wert</code> in geschweiften Klammern.</p>
        ${ex('const auto = { marke: "VW", jahr: 2015 };\nconsole.log(auto.marke);   // VW')}
        <p>Neue Eigenschaften legst du einfach an, vorhandene überschreibst du:</p>
        ${ex('auto.farbe = "blau";\nauto.jahr = 2020;')}
        <p>Eine Eigenschaft kann auch eine Funktion sein (eine <b>Methode</b>), und mit ${c("Object.keys(auto)")} bekommst du alle Namen.</p>
        ${tip("Objekte sind in JavaScript überall: Fast alles, was du im Web programmierst, besteht aus Objekten.")}`,
      task: "Setze <code>auto.farbe</code> auf <code>\"blau\"</code> und gib dann die Marke und die Farbe aus. Erwartet: <code>VW</code> und <code>blau</code>.",
      starter: 'const auto = { marke: "VW", jahr: 2015 };\n\n',
      hint: 'auto.farbe = "blau";\nconsole.log(auto.marke);\nconsole.log(auto.farbe);',
      solution: 'const auto = { marke: "VW", jahr: 2015 };\nauto.farbe = "blau";\nconsole.log(auto.marke);\nconsole.log(auto.farbe);',
      check: ({ output, code }) => {
        if (!/auto\.farbe\s*=/.test(code)) return "Setze die Eigenschaft farbe mit auto.farbe = ...";
        return expectOutput(output, ["VW", "blau"]);
      },
    },
    {
      title: "map & filter",
      content: `
        <p>Arrays haben mächtige Methoden. ${c("filter")} behält nur passende Elemente, ${c("map")} wandelt jedes Element um. Dazu nutzt du <b>Pfeilfunktionen</b>: ${c("(x) => ...")} heißt „mit x mache …“.</p>
        ${ex('const z = [1, 2, 3, 4];\nconsole.log(z.map((x) => x * 10).join(","));    // 10,20,30,40\nconsole.log(z.filter((x) => x > 2).join(","));  // 3,4')}
        <p>Beide geben ein <b>neues</b> Array zurück und lassen das alte unverändert. ${c('join(",")')} macht daraus Text, damit du es schön ausgeben kannst.</p>
        ${tip("<code>filter</code>: Die Funktion gibt <code>true</code> oder <code>false</code> zurück (behalten oder nicht). <code>map</code>: Die Funktion gibt den neuen Wert zurück.")}`,
      task: "Filtere die geraden Zahlen aus <code>zahlen</code> und gib sie mit <code>join(\",\")</code> aus: <code>2,4,6</code>.",
      starter: "const zahlen = [1, 2, 3, 4, 5, 6];\n\n",
      hint: "const gerade = zahlen.filter((x) => x % 2 === 0);\nconsole.log(gerade.join(\",\"));",
      solution: 'const zahlen = [1, 2, 3, 4, 5, 6];\nconst gerade = zahlen.filter((x) => x % 2 === 0);\nconsole.log(gerade.join(","));',
      check: ({ output, code }) => {
        if (!code.includes("filter")) return "Benutze filter().";
        return expectOutput(output, ["2,4,6"]);
      },
    },
    {
      title: "Mini-Projekt: FizzBuzz",
      content: `
        <p>Ein Klassiker, der zeigt, was du schon kannst. Gehe die Zahlen von 1 bis 15 durch:</p>
        <ul>
          <li>durch 3 <b>und</b> 5 teilbar → ${c("FizzBuzz")}</li>
          <li>nur durch 3 teilbar → ${c("Fizz")}</li>
          <li>nur durch 5 teilbar → ${c("Buzz")}</li>
          <li>sonst die Zahl selbst</li>
        </ul>
        <p>Dein Werkzeugkasten: <b>Schleife</b> (${c("for")}), <b>Entscheidungen</b> (${c("if / else if / else")}) und der <b>Rest-Operator</b> ${c("%")}: ${c("i % 3 === 0")} heißt „i ist durch 3 teilbar“.</p>
        ${tip("Prüfe <b>zuerst</b> den Fall „durch 3 und 5“ (also durch 15 teilbar), sonst greift bei 15 schon „Fizz“.")}`,
      task: "Gib FizzBuzz für 1 bis 15 aus, jede Ausgabe in einer eigenen Zeile.",
      starter: "for (let i = 1; i <= 15; i++) {\n  // hier prüfen und ausgeben\n}\n",
      hint: 'if (i % 15 === 0) → "FizzBuzz", else if (i % 3 === 0) → "Fizz", else if (i % 5 === 0) → "Buzz", else → i',
      solution: 'for (let i = 1; i <= 15; i++) {\n  if (i % 15 === 0) {\n    console.log("FizzBuzz");\n  } else if (i % 3 === 0) {\n    console.log("Fizz");\n  } else if (i % 5 === 0) {\n    console.log("Buzz");\n  } else {\n    console.log(i);\n  }\n}',
      check: ({ output }) =>
        expectOutput(output, ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]),
    },
  ],
});

// Kursdaten, Teil 3: HTML und CSS (nutzt die Helfer aus courses.js)

const txt = (el) => (el ? el.textContent.trim() : "");

/* ====================================================================== */
/*  HTML                                                                   */
/* ====================================================================== */
COURSES.push({
  id: "html",
  lang: "html",
  langLabel: "HTML",
  emoji: "🌐",
  title: "HTML: Webseiten bauen",
  desc: "Die Struktur jeder Webseite: Überschriften, Text, Listen, Links, Bilder, Tabellen und Formulare. Du siehst sofort die Vorschau.",
  lessons: [
    {
      title: "Was ist HTML?",
      content: `
        <p><b>HTML</b> beschreibt, <i>was</i> auf einer Webseite steht: Überschriften, Text, Bilder, Links. Dafür benutzt du <b>Tags</b> in spitzen Klammern.</p>
        ${ex("<h1>Meine Seite</h1>\n<p>Das ist ein Absatz.</p>")}
        <ul>
          <li>${c("<h1>")} ist der <b>Start-Tag</b>, ${c("</h1>")} der <b>End-Tag</b> (mit Schrägstrich).</li>
          <li>Dazwischen steht der <b>Inhalt</b>.</li>
          <li>${c("h1")} bedeutet „heading 1“, die wichtigste Überschrift. ${c("p")} steht für „paragraph“, den Absatz.</li>
        </ul>
        <p>Start-Tag + Inhalt + End-Tag nennt man zusammen ein <b>Element</b>.</p>
        ${tip("Rechts siehst du live, wie dein Code im Browser aussieht. Du musst nicht mal auf „Ausführen“ klicken, es aktualisiert sich beim Tippen.")}
        ${warn("Vergisst du einen End-Tag, wird der Rest der Seite oft komisch dargestellt. Schließe jedes Element!")}`,
      task: "Ändere den Text der Überschrift in <code>Meine erste Seite</code> und schreibe unter die Überschrift einen Absatz (<code>&lt;p&gt;</code>) mit beliebigem Text.",
      starter: "<h1>Hallo Welt</h1>\n",
      hint: "<h1>Meine erste Seite</h1>\n<p>Hier steht mein Text.</p>",
      solution: "<h1>Meine erste Seite</h1>\n<p>Hier steht mein Text.</p>",
      check: ({ doc }) => {
        if (txt(doc.querySelector("h1")) !== "Meine erste Seite") return "Die Überschrift muss genau „Meine erste Seite“ heißen.";
        if (!txt(doc.querySelector("p"))) return "Füge einen Absatz <p> mit Text hinzu.";
        return true;
      },
    },
    {
      title: "Überschriften & Absätze",
      content: `
        <p>Es gibt sechs Überschriftsebenen: ${c("<h1>")} (größte) bis ${c("<h6>")} (kleinste). Nutze sie wie ein Inhaltsverzeichnis: ${c("h1")} für den Seitentitel, ${c("h2")} für Abschnitte, ${c("h3")} für Unterabschnitte.</p>
        ${ex("<h1>Mein Hobby</h1>\n<h2>Fußball</h2>\n<p>Ich spiele gern Fußball.</p>\n<h2>Musik</h2>\n<p>Ich höre viel Musik.</p>")}
        <p>Zwei praktische Tags ohne Inhalt:</p>
        <ul>
          <li>${c("<br>")}: ein <b>Zeilenumbruch</b> innerhalb eines Absatzes.</li>
          <li>${c("<hr>")}: eine <b>Trennlinie</b>.</li>
        </ul>
        ${tip("Mehrere Leerzeichen und Zeilenumbrüche im Code ignoriert der Browser. Wenn du Zeilenumbruch willst, brauchst du <code>&lt;br&gt;</code> oder einen neuen <code>&lt;p&gt;</code>.")}`,
      task: "Baue eine Seite „Über mich“: die <code>&lt;h1&gt;</code> mit dem Text <code>Über mich</code>, darunter zwei <code>&lt;h2&gt;</code>-Überschriften mit den Texten <code>Hobbys</code> und <code>Lieblingsessen</code>. Unter <b>jeder</b> <code>&lt;h2&gt;</code> steht ein <code>&lt;p&gt;</code> mit eigenem Text.",
      starter: "<h1>Über mich</h1>\n\n",
      hint: "<h2>…</h2>\n<p>…</p>\n<h2>…</h2>\n<p>…</p>",
      solution: "<h1>Über mich</h1>\n<h2>Hobbys</h2>\n<p>Ich spiele gern Gitarre.</p>\n<h2>Lieblingsessen</h2>\n<p>Am liebsten esse ich Nudeln.</p>",
      check: ({ doc }) => {
        if (txt(doc.querySelector("h1")) !== "Über mich") return "Die <h1> muss „Über mich“ heißen.";
        const h2 = [...doc.querySelectorAll("h2")].map(txt);
        if (h2.length !== 2 || h2[0] !== "Hobbys" || h2[1] !== "Lieblingsessen") return "Du brauchst zwei <h2>: erst „Hobbys“, dann „Lieblingsessen“.";
        const ps = [...doc.querySelectorAll("h2 + p")];
        if (ps.length < 2 || ps.some((p) => !txt(p))) return "Unter jeder <h2> soll direkt ein <p> mit Text stehen.";
        return true;
      },
    },
    {
      title: "Text hervorheben",
      content: `
        <p>Mit Tags innerhalb eines Absatzes hebst du Wörter hervor:</p>
        ${ex("<p>Das ist <strong>sehr wichtig</strong> und das ist <em>betont</em>.</p>")}
        <ul>
          <li>${c("<strong>")}: <b>wichtiger</b> Text (meist fett).</li>
          <li>${c("<em>")}: <i>betonter</i> Text (meist kursiv).</li>
        </ul>
        <p>Tags kann man auch <b>verschachteln</b>, also ineinander legen. Wichtig: Schließe in umgekehrter Reihenfolge.</p>
        ${ex("<p><strong><em>fett und kursiv</em></strong></p>")}
        ${warn("Falsch wäre <code>&lt;strong&gt;&lt;em&gt;…&lt;/strong&gt;&lt;/em&gt;</code>: Der zuletzt geöffnete Tag muss zuerst geschlossen werden.")}`,
      task: "Im Absatz soll das Wort <code>Python</code> mit <code>&lt;strong&gt;</code> und das Wort <code>Spaß</code> mit <code>&lt;em&gt;</code> hervorgehoben werden.",
      starter: "<p>Python macht richtig Spaß.</p>\n",
      hint: "Setze nur die beiden Wörter in die Tags, der Rest des Satzes bleibt gleich.",
      solution: "<p><strong>Python</strong> macht richtig <em>Spaß</em>.</p>",
      check: ({ doc }) => {
        if (txt(doc.querySelector("p strong")) !== "Python") return "Das Wort „Python“ soll in <strong> stehen.";
        if (txt(doc.querySelector("p em")) !== "Spaß") return "Das Wort „Spaß“ soll in <em> stehen.";
        if (txt(doc.querySelector("p")) !== "Python macht richtig Spaß.") return "Der Satz selbst soll unverändert bleiben.";
        return true;
      },
    },
    {
      title: "Listen",
      content: `
        <p>Für Aufzählungen gibt es zwei Listen-Arten:</p>
        <ul>
          <li>${c("<ul>")} (<i>unordered list</i>): Liste mit Punkten.</li>
          <li>${c("<ol>")} (<i>ordered list</i>): nummerierte Liste.</li>
        </ul>
        <p>Jeder Eintrag steckt in einem ${c("<li>")} (<i>list item</i>):</p>
        ${ex("<ul>\n  <li>Äpfel</li>\n  <li>Brot</li>\n  <li>Milch</li>\n</ul>\n\n<ol>\n  <li>Erst das</li>\n  <li>Dann das</li>\n</ol>")}
        ${tip("<code>&lt;li&gt;</code> steht <b>immer innerhalb</b> von <code>&lt;ul&gt;</code> oder <code>&lt;ol&gt;</code>, nie allein. Die Einrückung hilft dir, den Überblick zu behalten.")}`,
      task: "Erstelle eine Einkaufsliste mit Punkten (<code>&lt;ul&gt;</code>): <code>Nudeln</code>, <code>Tomaten</code>, <code>Käse</code> (in dieser Reihenfolge). Darunter eine nummerierte Liste (<code>&lt;ol&gt;</code>) mit den Schritten <code>Kochen</code> und <code>Essen</code>.",
      starter: "",
      hint: "<ul><li>…</li><li>…</li><li>…</li></ul>\n<ol><li>…</li><li>…</li></ol>",
      solution: "<ul>\n  <li>Nudeln</li>\n  <li>Tomaten</li>\n  <li>Käse</li>\n</ul>\n<ol>\n  <li>Kochen</li>\n  <li>Essen</li>\n</ol>",
      check: ({ doc }) => {
        const ul = [...doc.querySelectorAll("ul > li")].map(txt);
        if (ul.join("|") !== "Nudeln|Tomaten|Käse") return "Die <ul> braucht genau die Einträge Nudeln, Tomaten, Käse (in dieser Reihenfolge).";
        const ol = [...doc.querySelectorAll("ol > li")].map(txt);
        if (ol.join("|") !== "Kochen|Essen") return "Die <ol> braucht die Einträge Kochen und Essen.";
        return true;
      },
    },
    {
      title: "Links",
      content: `
        <p>Das Besondere am Web sind <b>Links</b>. Du erstellst sie mit dem ${c("<a>")}-Tag („anchor“).</p>
        ${ex('<a href="https://de.wikipedia.org">Zur Wikipedia</a>')}
        <ul>
          <li>${c("href")} ist ein <b>Attribut</b>. Attribute geben einem Tag zusätzliche Infos und stehen im Start-Tag als ${c('name="wert"')}.</li>
          <li>${c("href")} enthält das <b>Ziel</b> (die Adresse).</li>
          <li>Der Text zwischen den Tags ist das, worauf man klickt.</li>
        </ul>
        <p>Mit ${c('target="_blank"')} öffnet sich der Link in einem neuen Tab.</p>
        ${warn("Ohne <code>https://</code> am Anfang behandelt der Browser die Adresse als Datei auf deiner eigenen Seite und der Link führt ins Leere.")}`,
      task: "Erstelle einen Link mit dem Text <code>Zur Wikipedia</code>, der auf <code>https://de.wikipedia.org</code> zeigt und in einem neuen Tab öffnet (<code>target=\"_blank\"</code>).",
      starter: "",
      hint: '<a href="https://de.wikipedia.org" target="_blank">Zur Wikipedia</a>',
      solution: '<a href="https://de.wikipedia.org" target="_blank">Zur Wikipedia</a>',
      check: ({ doc }) => {
        const a = doc.querySelector("a");
        if (!a) return "Füge einen <a>-Link hinzu.";
        if (txt(a) !== "Zur Wikipedia") return "Der Linktext muss „Zur Wikipedia“ sein.";
        if (a.getAttribute("href") !== "https://de.wikipedia.org") return "Das href muss https://de.wikipedia.org sein.";
        if (a.getAttribute("target") !== "_blank") return 'Setze target="_blank".';
        return true;
      },
    },
    {
      title: "Bilder",
      content: `
        <p>Bilder fügst du mit ${c("<img>")} ein. Dieser Tag hat <b>keinen Inhalt</b> und deshalb auch keinen End-Tag. Die Infos stecken in den Attributen:</p>
        ${ex('<img src="https://picsum.photos/200" alt="Ein Zufallsbild">')}
        <ul>
          <li>${c("src")} (<i>source</i>): Adresse des Bildes.</li>
          <li>${c("alt")}: eine <b>Beschreibung</b> als Text. Sie erscheint, wenn das Bild nicht lädt, und wird von Screenreadern vorgelesen. Sie ist wichtig für Barrierefreiheit!</li>
          <li>Optional: ${c('width="100"')} setzt die Breite in Pixeln.</li>
        </ul>
        ${tip("Schreibe im <code>alt</code>, was auf dem Bild zu sehen ist, nicht „Bild“.")}`,
      task: "Füge ein Bild mit <code>src=\"https://picsum.photos/200\"</code> und einem aussagekräftigen <code>alt</code>-Text ein. Setze außerdem <code>width=\"100\"</code>.",
      starter: "",
      hint: '<img src="https://picsum.photos/200" alt="Ein Zufallsbild" width="100">',
      solution: '<img src="https://picsum.photos/200" alt="Ein Zufallsbild" width="100">',
      check: ({ doc }) => {
        const img = doc.querySelector("img");
        if (!img) return "Füge ein <img> hinzu.";
        if (img.getAttribute("src") !== "https://picsum.photos/200") return "Das src muss https://picsum.photos/200 sein.";
        if (!(img.getAttribute("alt") || "").trim()) return "Füge einen alt-Text hinzu.";
        if (img.getAttribute("width") !== "100") return 'Setze width="100".';
        return true;
      },
    },
    {
      title: "Tabellen",
      content: `
        <p>Tabellen ordnen Daten in Zeilen und Spalten. Sie bestehen aus mehreren Tags:</p>
        <ul>
          <li>${c("<table>")}: die ganze Tabelle.</li>
          <li>${c("<tr>")} (<i>table row</i>): eine Zeile.</li>
          <li>${c("<th>")} (<i>table header</i>): eine Kopfzelle (fett, zentriert).</li>
          <li>${c("<td>")} (<i>table data</i>): eine normale Zelle.</li>
        </ul>
        ${ex("<table>\n  <tr>\n    <th>Name</th>\n    <th>Alter</th>\n  </tr>\n  <tr>\n    <td>Anna</td>\n    <td>12</td>\n  </tr>\n</table>")}
        ${tip("Eine Zeile (<code>tr</code>) enthält so viele Zellen, wie die Tabelle Spalten hat. Damit man Linien sieht, braucht man CSS (kommt im CSS-Kurs).")}`,
      task: "Baue eine Tabelle mit einer Kopfzeile (2 <code>&lt;th&gt;</code>: z. B. Name, Alter) und mindestens 2 Datenzeilen mit je 2 <code>&lt;td&gt;</code>.",
      starter: "<table>\n  \n</table>\n",
      hint: "<tr><th>Name</th><th>Alter</th></tr>\n<tr><td>Anna</td><td>12</td></tr>\n<tr><td>Ben</td><td>13</td></tr>",
      solution: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Alter</th>\n  </tr>\n  <tr>\n    <td>Anna</td>\n    <td>12</td>\n  </tr>\n  <tr>\n    <td>Ben</td>\n    <td>13</td>\n  </tr>\n</table>",
      check: ({ doc }) => {
        if (doc.querySelectorAll("th").length < 2) return "Die Kopfzeile braucht 2 <th>.";
        const datenzeilen = [...doc.querySelectorAll("tr")].filter((tr) => tr.querySelectorAll("td").length === 2);
        if (datenzeilen.length < 2) return "Du brauchst mindestens 2 Datenzeilen mit je 2 <td>.";
        return true;
      },
    },
    {
      title: "Formulare",
      content: `
        <p>Mit Formularen nimmst du Eingaben entgegen. Die wichtigsten Teile:</p>
        <ul>
          <li>${c("<input>")}: ein Eingabefeld. Das Attribut ${c("type")} bestimmt die Art: ${c('text')}, ${c('number')}, ${c('email')}, ${c('checkbox')} …</li>
          <li>${c("<label>")}: die Beschriftung zum Feld.</li>
          <li>${c("<button>")}: ein Knopf.</li>
          <li>${c("<form>")}: umschließt alles.</li>
        </ul>
        ${ex('<form>\n  <label for="name">Name:</label>\n  <input type="text" id="name" placeholder="Dein Name">\n  <button type="submit">Absenden</button>\n</form>')}
        <p>${c("for")} im Label und ${c("id")} im Input müssen <b>gleich</b> sein: So gehören sie zusammen, und ein Klick aufs Label aktiviert das Feld.</p>
        ${tip("<code>placeholder</code> zeigt einen grauen Hinweistext im leeren Feld.")}`,
      task: "Baue ein Anmelde-Formular: ein <code>&lt;label&gt;</code> mit dem Text <code>E-Mail:</code>, ein zugehöriges Feld mit <code>type=\"email\"</code> und einer <code>id</code>, und ein <code>&lt;button&gt;</code> mit dem Text <code>Anmelden</code>. Das <code>for</code> des Labels muss zur <code>id</code> des Feldes passen.",
      starter: "<form>\n  \n</form>\n",
      hint: "Das Feld braucht type=\"email\" und eine id. Das label verweist mit for auf diese id.",
      solution: '<form>\n  <label for="mail">E-Mail:</label>\n  <input type="email" id="mail">\n  <button type="submit">Anmelden</button>\n</form>',
      check: ({ doc }) => {
        if (!doc.querySelector("form")) return "Behalte das <form> bei.";
        const input = doc.querySelector('form input[type="email"]');
        if (!input) return 'Füge ein <input type="email"> im Formular hinzu.';
        const id = input.getAttribute("id");
        if (!id) return "Gib dem Eingabefeld eine id.";
        const label = doc.querySelector("form label");
        if (!label || label.getAttribute("for") !== id) return "Füge ein <label> hinzu, dessen for zur id des Feldes passt.";
        if (txt(label) !== "E-Mail:") return "Der Label-Text soll „E-Mail:“ sein.";
        if (txt(doc.querySelector("form button")) !== "Anmelden") return "Füge einen <button> mit dem Text „Anmelden“ hinzu.";
        return true;
      },
    },
    {
      title: "Seitenstruktur",
      content: `
        <p>Echte Seiten haben Bereiche. HTML bietet dafür <b>aussagekräftige Tags</b>:</p>
        <ul>
          <li>${c("<header>")}: Kopfbereich (Titel, Logo).</li>
          <li>${c("<nav>")}: Navigation (Links).</li>
          <li>${c("<main>")}: der Hauptinhalt.</li>
          <li>${c("<footer>")}: Fußbereich.</li>
          <li>${c("<div>")}: ein neutraler Behälter zum Gruppieren.</li>
        </ul>
        ${ex("<header>\n  <h1>Meine Seite</h1>\n</header>\n<main>\n  <p>Hauptinhalt</p>\n</main>\n<footer>\n  <p>© 2026</p>\n</footer>")}
        <p>Diese Tags sehen erstmal wie gewöhnliche Blöcke aus. Aber sie sagen Suchmaschinen und Screenreadern, was was ist, und mit CSS gestaltest du sie später.</p>`,
      task: "Baue die Startseite eines Blogs: ein <code>&lt;header&gt;</code> mit einer <code>&lt;h1&gt;</code> mit dem Text <code>Mein Blog</code>, ein <code>&lt;main&gt;</code> mit einem <code>&lt;p&gt;</code> mit Text und einen <code>&lt;footer&gt;</code> mit Text.",
      starter: "",
      hint: "<header><h1>…</h1></header>\n<main><p>…</p></main>\n<footer>…</footer>",
      solution: "<header>\n  <h1>Mein Blog</h1>\n</header>\n<main>\n  <p>Willkommen auf meinem Blog!</p>\n</main>\n<footer>\n  <p>Danke fürs Vorbeischauen</p>\n</footer>",
      check: ({ doc }) => {
        if (txt(doc.querySelector("header h1")) !== "Mein Blog") return "Der <header> braucht eine <h1> mit dem Text „Mein Blog“.";
        if (!txt(doc.querySelector("main p"))) return "Das <main> braucht einen <p> mit Text.";
        if (!txt(doc.querySelector("footer"))) return "Der <footer> braucht Text.";
        return true;
      },
    },
  ],
});

/* ====================================================================== */
/*  CSS                                                                    */
/* ====================================================================== */
COURSES.push({
  id: "css",
  lang: "html",
  langLabel: "HTML + CSS",
  emoji: "🎨",
  title: "CSS: Webseiten gestalten",
  desc: "Farben, Schrift, Abstände, Rahmen und Flexbox. Mit CSS bestimmst du, wie eine Seite aussieht.",
  lessons: [
    {
      title: "Deine erste CSS-Regel",
      content: `
        <p>HTML legt fest, <i>was</i> auf der Seite steht. <b>CSS</b> legt fest, <i>wie es aussieht</i>. Du schreibst es im ${c("<style>")}-Tag.</p>
        ${ex("<style>\n  h1 {\n    color: blue;\n  }\n</style>\n\n<h1>Hallo!</h1>")}
        <p>Eine CSS-Regel besteht aus:</p>
        <ul>
          <li>dem <b>Selektor</b> ${c("h1")}: „Welche Elemente?“</li>
          <li>geschweiften Klammern ${c("{ }")}</li>
          <li>darin <b>Eigenschaften</b>: ${c("color: blue;")} („Eigenschaft: Wert;“). Das Semikolon am Ende nicht vergessen!</li>
        </ul>
        <p>Farben kannst du als Namen schreiben: ${c("red")}, ${c("green")}, ${c("blue")}, ${c("orange")} …</p>
        ${warn("Ohne <code>;</code> am Ende einer Zeile funktioniert die nächste Zeile oft nicht mehr.")}`,
      task: "Mache die Überschrift <code>h1</code> rot (<code>color: red</code>).",
      starter: "<style>\n  h1 {\n    \n  }\n</style>\n\n<h1>Hallo CSS</h1>\n",
      hint: "color: red;",
      solution: "<style>\n  h1 {\n    color: red;\n  }\n</style>\n\n<h1>Hallo CSS</h1>",
      check: ({ win, doc }) => {
        const h1 = doc.querySelector("h1");
        if (!h1) return "Lass die <h1> stehen.";
        if (win.getComputedStyle(h1).color !== "rgb(255, 0, 0)") return "Die Überschrift ist noch nicht rot.";
        return true;
      },
    },
    {
      title: "Schrift gestalten",
      content: `
        <p>Die wichtigsten Eigenschaften für Text:</p>
        <ul>
          <li>${c("font-size: 20px;")}: Schriftgröße (in <b>Pixeln</b>).</li>
          <li>${c("font-family: Arial, sans-serif;")}: Schriftart. Liste mehrere auf, falls eine fehlt.</li>
          <li>${c("font-weight: bold;")}: fett.</li>
          <li>${c("text-align: center;")}: Ausrichtung (${c("left")}, ${c("center")}, ${c("right")}).</li>
          <li>${c("text-decoration: underline;")}: unterstrichen.</li>
        </ul>
        ${ex("<style>\n  p {\n    font-size: 20px;\n    font-family: Arial, sans-serif;\n    text-align: center;\n  }\n</style>\n\n<p>Ich bin zentriert.</p>")}
        ${tip("Du kannst mehrere Eigenschaften pro Regel untereinander schreiben. Jede mit <code>;</code> beenden.")}`,
      task: "Setze für <code>p</code>: Schriftgröße <code>24px</code>, <code>text-align: center</code> und <code>font-weight: bold</code>.",
      starter: "<style>\n  p {\n    \n  }\n</style>\n\n<p>Dieser Text soll gestaltet werden.</p>\n",
      hint: "font-size: 24px;\ntext-align: center;\nfont-weight: bold;",
      solution: "<style>\n  p {\n    font-size: 24px;\n    text-align: center;\n    font-weight: bold;\n  }\n</style>\n\n<p>Dieser Text soll gestaltet werden.</p>",
      check: ({ win, doc }) => {
        const p = doc.querySelector("p");
        if (!p) return "Lass den <p> stehen.";
        const s = win.getComputedStyle(p);
        if (s.fontSize !== "24px") return "font-size sollte 24px sein.";
        if (s.textAlign !== "center") return "text-align sollte center sein.";
        if (!(s.fontWeight === "bold" || Number(s.fontWeight) >= 700)) return "font-weight sollte bold sein.";
        return true;
      },
    },
    {
      title: "Klassen und IDs",
      content: `
        <p>Bisher hast du <b>alle</b> Elemente eines Typs gestaltet (alle ${c("p")}). Oft willst du nur <b>bestimmte</b> treffen. Dafür gibst du Elementen ein ${c("class")}-Attribut und wählst sie mit einem <b>Punkt</b> aus.</p>
        ${ex('<style>\n  .wichtig {\n    color: red;\n  }\n</style>\n\n<p>Normal</p>\n<p class="wichtig">Wichtig!</p>')}
        <ul>
          <li>Im HTML: ${c('class="wichtig"')}</li>
          <li>Im CSS: ${c(".wichtig")} (Punkt davor)</li>
        </ul>
        <p>Dieselbe Klasse darf an <b>beliebig vielen</b> Elementen stehen. Ein Element darf auch mehrere haben: ${c('class="a b"')}.</p>
        <p>Für ein <b>einzelnes</b> Element gibt es die ${c("id")} mit <b>Raute</b> im CSS: ${c('id="titel"')} → ${c("#titel")}. Eine id darf nur einmal pro Seite vorkommen.</p>
        ${tip("Faustregel: Klassen für wiederkehrende Stile, IDs für Einzelstücke. Meist reichen Klassen.")}`,
      task: "Mache nur die Absätze mit <code>class=\"wichtig\"</code> rot und fett. Der andere Absatz soll unverändert bleiben.",
      starter: '<style>\n  /* .wichtig { ... } */\n</style>\n\n<p>Ein normaler Absatz.</p>\n<p class="wichtig">Ein wichtiger Absatz.</p>\n',
      hint: ".wichtig {\n  color: red;\n  font-weight: bold;\n}",
      solution: '<style>\n  .wichtig {\n    color: red;\n    font-weight: bold;\n  }\n</style>\n\n<p>Ein normaler Absatz.</p>\n<p class="wichtig">Ein wichtiger Absatz.</p>',
      check: ({ win, doc }) => {
        const normal = doc.querySelector("p:not(.wichtig)");
        const wichtig = doc.querySelector("p.wichtig");
        if (!normal || !wichtig) return "Lass beide Absätze stehen.";
        const w = win.getComputedStyle(wichtig);
        if (w.color !== "rgb(255, 0, 0)") return "Der wichtige Absatz soll rot sein.";
        if (!(w.fontWeight === "bold" || Number(w.fontWeight) >= 700)) return "Der wichtige Absatz soll fett sein.";
        if (win.getComputedStyle(normal).color === "rgb(255, 0, 0)") return "Der normale Absatz darf nicht rot sein. Benutze .wichtig als Selektor.";
        return true;
      },
    },
    {
      title: "Farben & Hintergrund",
      content: `
        <p>Farben gibst du auf drei Arten an:</p>
        <ul>
          <li><b>Name</b>: ${c("tomato")}, ${c("skyblue")}, ${c("gold")} …</li>
          <li><b>Hex-Code</b>: ${c("#3366cc")}. Zwei Ziffern je für Rot, Grün, Blau (00 bis ff).</li>
          <li><b>RGB</b>: ${c("rgb(51, 102, 204)")}, jede Zahl von 0 bis 255.</li>
        </ul>
        <p>Zwei Eigenschaften brauchst du ständig:</p>
        <ul>
          <li>${c("color")}: Farbe des <b>Textes</b>.</li>
          <li>${c("background-color")}: Farbe des <b>Hintergrunds</b>.</li>
        </ul>
        ${ex("<style>\n  body {\n    background-color: #e3f2fd;\n  }\n  h1 {\n    color: #c62828;\n  }\n</style>\n\n<h1>Bunt!</h1>")}
        ${tip("Suche im Netz nach „Color Picker“. Dort klickst du eine Farbe an und bekommst den Hex-Code.")}`,
      task: "Gib dem <code>body</code> den Hintergrund <code>#fff8e1</code> und der Überschrift <code>h1</code> die Textfarbe <code>#3366cc</code>.",
      starter: "<style>\n  body {\n    \n  }\n  h1 {\n    \n  }\n</style>\n\n<h1>Farbenfroh</h1>\n<p>Etwas Text.</p>\n",
      hint: "body { background-color: #fff8e1; }\nh1 { color: #3366cc; }",
      solution: "<style>\n  body {\n    background-color: #fff8e1;\n  }\n  h1 {\n    color: #3366cc;\n  }\n</style>\n\n<h1>Farbenfroh</h1>\n<p>Etwas Text.</p>",
      check: ({ win, doc }) => {
        const body = win.getComputedStyle(doc.body);
        const h1 = doc.querySelector("h1");
        if (!h1) return "Lass die <h1> stehen.";
        if (body.backgroundColor !== "rgb(255, 248, 225)") return "Der body-Hintergrund ist nicht #fff8e1.";
        if (win.getComputedStyle(h1).color !== "rgb(51, 102, 204)") return "Die Überschrift ist nicht #3366cc.";
        return true;
      },
    },
    {
      title: "Das Box-Modell",
      content: `
        <p>Jedes HTML-Element ist eine <b>Box</b> aus vier Schichten, von innen nach außen:</p>
        <ol>
          <li><b>Inhalt</b> (Text, Bild)</li>
          <li>${c("padding")}: <b>Innenabstand</b> zwischen Inhalt und Rand.</li>
          <li>${c("border")}: der <b>Rand</b>.</li>
          <li>${c("margin")}: <b>Außenabstand</b> zu anderen Elementen.</li>
        </ol>
        ${ex(".box {\n  padding: 20px;\n  border: 2px solid black;\n  margin: 10px;\n  background-color: lightblue;\n}")}
        <p>${c("border")} besteht aus drei Teilen: <b>Dicke</b>, <b>Stil</b> (${c("solid")}, ${c("dashed")}, ${c("dotted")}) und <b>Farbe</b>.</p>
        ${tip("Merkhilfe: <b>padding</b> = Polster innen, <b>margin</b> = Abstand außen.")}`,
      task: "Gib <code>.box</code> einen <code>padding</code> von 20px, einen Rand <code>2px solid</code> (Farbe egal) und einen <code>margin</code> von 10px.",
      starter: '<style>\n  .box {\n    background-color: lightblue;\n    /* padding, border, margin */\n  }\n</style>\n\n<div class="box">Ich bin eine Box</div>\n',
      hint: "padding: 20px;\nborder: 2px solid black;\nmargin: 10px;",
      solution: '<style>\n  .box {\n    background-color: lightblue;\n    padding: 20px;\n    border: 2px solid black;\n    margin: 10px;\n  }\n</style>\n\n<div class="box">Ich bin eine Box</div>',
      check: ({ win, doc }) => {
        const el = doc.querySelector(".box");
        if (!el) return 'Das Element mit class="box" fehlt.';
        const s = win.getComputedStyle(el);
        if (s.paddingTop !== "20px") return "padding sollte 20px sein.";
        // Browser runden Rahmen je nach Zoom auf Geräte-Pixel, daher mit Toleranz prüfen
        if (Math.abs(parseFloat(s.borderTopWidth) - 2) > 0.6 || s.borderTopStyle !== "solid") return "border sollte 2px solid sein.";
        if (s.marginTop !== "10px") return "margin sollte 10px sein.";
        return true;
      },
    },
    {
      title: "Größe & runde Ecken",
      content: `
        <p>Die Größe einer Box steuerst du mit ${c("width")} (Breite) und ${c("height")} (Höhe). Mit ${c("border-radius")} rundest du die Ecken ab.</p>
        ${ex(".karte {\n  width: 200px;\n  height: 100px;\n  border-radius: 12px;\n  background-color: gold;\n}")}
        <p>Mit ${c("border-radius: 50%")} auf einer quadratischen Box entsteht ein <b>Kreis</b>.</p>
        <p>Angaben in <b>Prozent</b> beziehen sich auf das Elternelement: ${c("width: 50%")} ist die halbe Breite.</p>
        ${tip("Mit <code>max-width</code> kannst du eine Maximalbreite setzen. Praktisch, damit Seiten auf kleinen Handys nicht überlaufen.")}`,
      task: "Mache aus <code>.kreis</code> einen Kreis: Breite und Höhe jeweils <code>100px</code> und <code>border-radius: 50%</code>.",
      starter: '<style>\n  .kreis {\n    background-color: tomato;\n    \n  }\n</style>\n\n<div class="kreis"></div>\n',
      hint: "width: 100px;\nheight: 100px;\nborder-radius: 50%;",
      solution: '<style>\n  .kreis {\n    background-color: tomato;\n    width: 100px;\n    height: 100px;\n    border-radius: 50%;\n  }\n</style>\n\n<div class="kreis"></div>',
      check: ({ win, doc }) => {
        const el = doc.querySelector(".kreis");
        if (!el) return 'Das Element mit class="kreis" fehlt.';
        const s = win.getComputedStyle(el);
        if (s.width !== "100px" || s.height !== "100px") return "width und height sollten 100px sein.";
        if (s.borderTopLeftRadius !== "50%") return "border-radius sollte 50% sein.";
        return true;
      },
    },
    {
      title: "Flexbox 1: Elemente nebeneinander",
      content: `
        <p>Normalerweise stehen Blöcke <b>untereinander</b>. Mit <b>Flexbox</b> ordnest du sie <b>nebeneinander</b> an. Dafür gibst du dem <b>Elternelement</b> (dem Container) ${c("display: flex;")}.</p>
        ${ex("<style>\n  .container {\n    display: flex;\n  }\n</style>\n\n<div class=\"container\">\n  <div>1</div>\n  <div>2</div>\n  <div>3</div>\n</div>")}
        <p>Mit ${c("justify-content")} bestimmst du die Verteilung entlang der Zeile:</p>
        <ul>
          <li>${c("flex-start")}: links (Standard)</li>
          <li>${c("center")}: mittig</li>
          <li>${c("flex-end")}: rechts</li>
          <li>${c("space-between")}: gleichmäßig verteilt, ganz außen beginnend</li>
        </ul>
        ${tip("Flexbox wirkt immer auf die <b>direkten Kinder</b> des Containers.")}`,
      task: "Mache <code>.container</code> zu einem Flex-Container mit <code>justify-content: space-between</code>, damit die drei Kästchen verteilt nebeneinander stehen.",
      starter: '<style>\n  .container {\n    border: 2px dashed gray;\n  }\n  .item {\n    background: orange;\n    padding: 12px;\n  }\n</style>\n\n<div class="container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>\n',
      hint: ".container {\n  display: flex;\n  justify-content: space-between;\n}",
      solution: '<style>\n  .container {\n    border: 2px dashed gray;\n    display: flex;\n    justify-content: space-between;\n  }\n  .item {\n    background: orange;\n    padding: 12px;\n  }\n</style>\n\n<div class="container">\n  <div class="item">1</div>\n  <div class="item">2</div>\n  <div class="item">3</div>\n</div>',
      check: ({ win, doc }) => {
        const el = doc.querySelector(".container");
        if (!el) return 'Das Element mit class="container" fehlt.';
        const s = win.getComputedStyle(el);
        if (s.display !== "flex") return "Setze display: flex.";
        if (s.justifyContent !== "space-between") return "Setze justify-content: space-between.";
        return true;
      },
    },
    {
      title: "Flexbox 2: Richtung, Abstand, Ausrichtung",
      content: `
        <p>Mehr Flexbox-Eigenschaften für den Container:</p>
        <ul>
          <li>${c("gap: 10px;")}: Abstand zwischen den Kindern.</li>
          <li>${c("flex-direction: column;")}: Kinder untereinander statt nebeneinander (Standard: ${c("row")}).</li>
          <li>${c("align-items: center;")}: Ausrichtung in der <b>anderen</b> Richtung, bei einer Zeile also vertikal.</li>
        </ul>
        ${ex(".container {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  justify-content: center;\n  height: 200px;\n}")}
        <p>Mit ${c("justify-content: center")} und ${c("align-items: center")} zentrierst du etwas <b>genau in der Mitte</b>. Dafür brauchst du eine Höhe am Container.</p>
        ${tip("Merke: <code>justify-content</code> wirkt entlang der Hauptachse (Richtung), <code>align-items</code> quer dazu.")}`,
      task: "Zentriere den Kasten in <code>.container</code> waagrecht und senkrecht (<code>justify-content: center</code>, <code>align-items: center</code>) mit <code>display: flex</code> und setze <code>gap: 10px</code>.",
      starter: '<style>\n  .container {\n    height: 200px;\n    border: 2px dashed gray;\n    \n  }\n  .item {\n    background: orange;\n    padding: 12px;\n  }\n</style>\n\n<div class="container">\n  <div class="item">A</div>\n  <div class="item">B</div>\n</div>\n',
      hint: "display: flex;\njustify-content: center;\nalign-items: center;\ngap: 10px;",
      solution: '<style>\n  .container {\n    height: 200px;\n    border: 2px dashed gray;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    gap: 10px;\n  }\n  .item {\n    background: orange;\n    padding: 12px;\n  }\n</style>\n\n<div class="container">\n  <div class="item">A</div>\n  <div class="item">B</div>\n</div>',
      check: ({ win, doc }) => {
        const el = doc.querySelector(".container");
        if (!el) return 'Das Element mit class="container" fehlt.';
        const s = win.getComputedStyle(el);
        if (s.display !== "flex") return "Setze display: flex.";
        if (s.justifyContent !== "center") return "justify-content sollte center sein.";
        if (s.alignItems !== "center") return "align-items sollte center sein.";
        if (!/^10px/.test(s.columnGap)) return "gap sollte 10px sein.";
        return true;
      },
    },
    {
      title: "Mini-Projekt: Eine Karte",
      content: `
        <p>Jetzt kombinierst du alles in einer kleinen <b>Profil-Karte</b>. Eine Karte besteht aus:</p>
        <ul>
          <li>einer Box ${c(".karte")} mit Innenabstand, Rand und runden Ecken,</li>
          <li>einer Überschrift in einer eigenen Farbe,</li>
          <li>einem Absatz mit kleinerer Schrift.</li>
        </ul>
        <p>Gehe Schritt für Schritt vor: erst die Box, dann Überschrift, dann Absatz. Nach jeder Änderung siehst du in der Vorschau, was passiert.</p>
        ${tip("Wenn etwas nicht klappt: Prüfe Semikolons, geschweifte Klammern und ob der Selektor stimmt (Punkt vor Klassen!).")}`,
      task: "Gestalte <code>.karte</code>: <code>padding: 20px</code>, <code>border-radius: 12px</code>, <code>background-color: #eef2ff</code>, <code>width: 250px</code>. Die <code>h2</code> in der Karte bekommt die Farbe <code>#4f46e5</code>, der <code>p</code> die Schriftgröße <code>14px</code>.",
      starter: '<style>\n  .karte {\n    \n  }\n  .karte h2 {\n    \n  }\n  .karte p {\n    \n  }\n</style>\n\n<div class="karte">\n  <h2>Mia</h2>\n  <p>Programmiert gern und mag Katzen.</p>\n</div>\n',
      hint: ".karte { padding: 20px; border-radius: 12px; background-color: #eef2ff; width: 250px; }\n.karte h2 { color: #4f46e5; }\n.karte p { font-size: 14px; }",
      solution: '<style>\n  .karte {\n    padding: 20px;\n    border-radius: 12px;\n    background-color: #eef2ff;\n    width: 250px;\n  }\n  .karte h2 {\n    color: #4f46e5;\n  }\n  .karte p {\n    font-size: 14px;\n  }\n</style>\n\n<div class="karte">\n  <h2>Mia</h2>\n  <p>Programmiert gern und mag Katzen.</p>\n</div>',
      check: ({ win, doc }) => {
        const k = doc.querySelector(".karte");
        const h2 = doc.querySelector(".karte h2");
        const p = doc.querySelector(".karte p");
        if (!k || !h2 || !p) return "Lass .karte, h2 und p stehen.";
        const s = win.getComputedStyle(k);
        if (s.paddingTop !== "20px") return "padding der Karte sollte 20px sein.";
        if (s.borderTopLeftRadius !== "12px") return "border-radius der Karte sollte 12px sein.";
        if (s.backgroundColor !== "rgb(238, 242, 255)") return "Hintergrund der Karte sollte #eef2ff sein.";
        if (s.width !== "250px") return "width der Karte sollte 250px sein.";
        if (win.getComputedStyle(h2).color !== "rgb(79, 70, 229)") return "Die Überschrift sollte #4f46e5 sein.";
        if (win.getComputedStyle(p).fontSize !== "14px") return "Der Absatz sollte 14px groß sein.";
        return true;
      },
    },
  ],
});

// Sanfte Tipps (verraten die Lösung nicht). Reihenfolge = Reihenfolge der Lektionen im Kurs.
// Der ausführlichere Tipp aus den Lektionsdaten kommt erst beim zweiten Klick auf „Tipp“.
const HINTS = {
  py1: [
    "Du musst nur den Text zwischen den Anführungszeichen ändern, alles andere bleibt.",
    "Jede Zeile Ausgabe braucht ihren eigenen print-Aufruf. Schau dir die erste Zeile an und mach es genauso.",
    "Zuerst speicherst du den Text mit = in der Variable, dann gibst du die Variable aus. Der Text braucht Anführungszeichen, der Variablenname beim print nicht.",
    "Du brauchst drei print-Aufrufe. In der Klammer rechnest du mit den Variablen a und b, nicht mit festen Zahlen.",
    "Jede der drei Rechnungen bekommt ein eigenes print. Welches Rechenzeichen war „ganzzahlig teilen“, welches „Rest“, welches „hoch“? Sieh in der Erklärung nach.",
    "Ein f-String beginnt mit einem f direkt vor dem Anführungszeichen. Die Variablen setzt du in geschweiften Klammern in den Text.",
    "Speichere die Antwort von input() in einer Variable. Danach verbindest du „Hallo, “ mit dieser Variable.",
    "Wandle den Text zuerst mit int() in eine Zahl um und speichere sie in einer Variable. Dann rechnest du mit dieser Zahl.",
    "Die Bedingung vergleicht temperatur mit 20. Vergiss den Doppelpunkt nicht und rücke die print-Zeile ein (4 Leerzeichen).",
    "Du brauchst drei Fälle: ein if, ein elif und ein else. Prüfe zuerst die höchste Grenze (90).",
    "Beide Bedingungen sollen gleichzeitig stimmen. Verbinde sie mit dem passenden Wort aus der Lektion.",
    "Überlege, bei welcher Zahl die Schleife anfangen soll und welche Zahl du als obere Grenze in range schreiben musst (sie zählt nicht mit!).",
    "Der Startwert der Summe ist schon da. In der Schleife addierst du bei jedem Durchgang die aktuelle Zahl dazu. Das print gehört hinter die Schleife.",
    "Die Schleife läuft, solange x größer als 0 ist. Was musst du in jedem Durchgang außer print noch mit x machen? Das „Los!“ kommt erst nach der Schleife.",
    "Das erste Element hat den Index 0. Zum Anhängen gibt es eine Methode, deren Name „anhängen“ auf Englisch ist, und len() liefert die Anzahl.",
    "Gehe mit einer for-Schleife durch die Liste und addiere in jedem Durchgang auf summe. Die größte Zahl findest du mit einer fertigen Funktion, die max heißt.",
    "Eine Funktion beginnt mit def, dann Name, Klammern und Doppelpunkt. Der Inhalt ist eingerückt. Danach rufst du sie zweimal auf.",
    "Die Funktion bekommt a und b und soll das Ergebnis mit return zurückgeben, nicht mit print. Das print passiert beim Aufruf außerhalb.",
    "Einen neuen Eintrag legst du an wie bei einer Variable, nur mit dem Schlüssel in eckigen Klammern hinter dem Dictionary-Namen. Zum Ausgeben holst du die Werte auf dieselbe Weise.",
    "Die Reihenfolge der Prüfungen ist wichtig: Welchen Fall musst du zuerst prüfen, damit er nicht von „durch 3“ oder „durch 5“ geschluckt wird?",
  ],
  py2: [
    "Beide Methoden kannst du hintereinander an den Text hängen (Punkt, Name, Klammern).",
    "Das erste Zeichen hat Index 0, das letzte Index -1. Für die ersten vier Zeichen brauchst du einen Slice mit Doppelpunkt.",
    "Sortieren verändert die Liste direkt, danach gibst du sie aus. Ob etwas enthalten ist, prüfst du mit dem Wort in.",
    "Die Form ist [ Berechnung for x in range(...) ]. Denk an die obere Grenze von range.",
    "Eine Menge (set) entfernt Doppelte. Wie viele Elemente sie hat, zeigt len. Ein Tupel packst du mit zwei Variablen links vom = aus.",
    "Setze die int()-Umwandlung in den try-Block und fange im except genau den Fehler ValueError ab.",
    "Beide Funktionen findest du im Modul math. Du erreichst sie, indem du math und einen Punkt davorschreibst.",
    "Die Methode steht eingerückt in der Klasse und hat self als ersten Parameter. Den Namen holst du mit self.name.",
    "Die Methode funktioniert wie einzahlen, nur mit dem umgekehrten Rechenzeichen. Vergiss self. vor dem Guthaben nicht.",
    "Gehe alle Wörter durch. Ist das Wort schon im Dictionary, erhöhe die Zahl um 1, sonst setze sie auf 1. Danach gibst du alle Paare mit items() aus.",
  ],
  js1: [
    "Du musst nur den Text zwischen den Anführungszeichen ändern.",
    "Jede Zeile Ausgabe braucht ihr eigenes console.log. Mach die beiden fehlenden Zeilen wie die erste.",
    "Lege den Text mit const an und gib die Variable aus (ohne Anführungszeichen beim log).",
    "Drei console.log-Zeilen, in denen du mit a und b rechnest.",
    "Ein Template-String nutzt Backticks statt Anführungszeichen. Variablen kommen mit Dollarzeichen und geschweiften Klammern hinein.",
    "Wandle den Text zuerst mit Number() in eine Zahl um, dann rechnest du damit.",
    "Die Bedingung steht in runden Klammern hinter if, der Code darunter in geschweiften Klammern.",
    "Du brauchst if, else if und else. Prüfe zuerst die höchste Grenze.",
    "Beide Bedingungen sollen gleichzeitig gelten. Verbinde sie mit dem passenden Zeichen (zwei Stück davon).",
    "Die Schleife hat drei Teile: Start bei 1, Bedingung bis 5 (mit kleiner-gleich) und Schritt um 1 erhöhen.",
    "In der Schleife addierst du die Zählvariable auf summe. Das console.log kommt hinter die Schleife.",
    "Die Schleife läuft, solange x größer als 0 ist. Vergiss nicht, x in jedem Durchgang zu verkleinern. „Los!“ kommt erst danach.",
    "Das erste Element hat Index 0. Zum Anhängen gibt es die Methode push, und die Anzahl steht in length.",
    "Gehe mit for...of durch das Array und addiere auf summe. Für das Maximum gibt es Math.max mit drei Punkten vor dem Array-Namen.",
    "Eine Funktion beginnt mit dem Wort function, dann Name, Klammern, geschweifte Klammern. Danach rufst du sie zweimal auf.",
    "Die Funktion bekommt a und b und soll das Ergebnis mit return zurückgeben, nicht mit console.log.",
    "Neue Eigenschaften legst du an, indem du dem Namen mit Punkt etwas zuweist, genau wie bei einer Variable.",
    "filter bekommt eine Pfeilfunktion, die true zurückgibt, wenn die Zahl behalten werden soll. Gerade heißt: Rest bei Division durch 2 ist 0.",
    "Prüfe zuerst den Fall „durch 3 und 5“, also durch 15. Danach durch 3, dann durch 5, sonst die Zahl selbst.",
  ],
  html: [
    "Die Überschrift ist schon da, du musst nur den Text ändern. Dann fehlt noch ein Absatz-Tag mit Text.",
    "Unter jeder h2 soll direkt ein p stehen. Du brauchst also zweimal das Paar h2 und p.",
    "Setze innerhalb des Absatzes ein Wort in strong und ein anderes in em. Schließe beide Tags!",
    "Du brauchst zwei Listen: eine mit ul und eine mit ol. Jeder Eintrag steht in einem li.",
    "Der Link braucht das Attribut href mit der Adresse und das Attribut target mit dem Wert, der einen neuen Tab öffnet.",
    "img hat keinen End-Tag. Du brauchst die Attribute src, alt und width.",
    "Eine Kopfzeile besteht aus th-Zellen in einem tr, die Datenzeilen aus td-Zellen in je einem tr.",
    "Das for im label und die id im input müssen denselben Wert haben. Vergiss den button nicht.",
    "Setze die h1 in den header, den p in main und etwas in den footer.",
  ],
  css: [
    "Die Regel für h1 ist schon da. Trage zwischen den geschweiften Klammern die Eigenschaft color mit dem Wert ein.",
    "Drei Eigenschaften, jede mit Doppelpunkt und Semikolon: font-size, text-align und font-weight.",
    "Ein Selektor für eine Klasse beginnt mit einem Punkt, danach der Klassenname. In die Klammern kommen Farbe und Schriftstärke.",
    "background-color für den body, color für die h1. Die Werte sind Hex-Codes mit Raute.",
    "Du brauchst padding, border und margin. Beim border stehen Dicke, Stil und Farbe hintereinander.",
    "Für einen Kreis braucht die Box gleiche Breite und Höhe und eine Rundung von 50 Prozent.",
    "Der Container braucht display mit dem Wert flex und die Verteilung space-between bei justify-content.",
    "Auf dem Container: display flex, dazu je center bei justify-content und align-items, und gap mit 10px.",
    "Drei Regeln: .karte (padding, border-radius, background-color, width), .karte h2 (color) und .karte p (font-size).",
  ],
};

window.KURS_COURSES = COURSES;
window.KURS_HINTS = HINTS;
// Hilfsfunktionen für die weiteren Kursdateien (kurs-daten2.js …): gleiche Schreibweise für Codebeispiele, Hinweise und Prüfungen
window.KURS_HELP = { esc, ex, c, tip, warn, lines, expectOutput, txt };
})();
